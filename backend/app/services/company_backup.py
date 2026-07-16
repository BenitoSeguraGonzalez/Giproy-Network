import base64
import hashlib
import io
import json
import re
import zipfile
from datetime import date, datetime, timedelta
from decimal import Decimal
from pathlib import Path
from typing import Any

from cryptography.fernet import Fernet, InvalidToken
from sqlalchemy import Boolean, Date, DateTime, Integer, Numeric
from sqlalchemy import delete
from sqlalchemy import or_
from sqlalchemy import select
from sqlalchemy import text
from sqlalchemy import update
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import Base
from app.models.apu import APU, APULinea
from app.models.base_trabajo import BaseTrabajo
from app.models.company_backup import CompanyBackupInternalArtifact, CompanyBackupOperation
from app.models.community import (
    CommunityAdminAlert,
    CommunityAttachment,
    CommunityCategory,
    CommunityDmMessage,
    CommunityDmThread,
    CommunityInfraction,
    CommunityPost,
    CommunityPostReply,
    CommunitySanction,
    CommunitySanctionAppeal,
    CommunityTopic,
)
from app.models.cronograma import CronogramaValorado
from app.models.cronograma_trabajo import CronogramaTrabajo
from app.models.edt import EdtNode
from app.models.empresa import Empresa
from app.models.marketplace import MarketplaceOrder, MarketplaceProduct
from app.models.presupuesto import Presupuesto, PresupuestoDetalle, PresupuestoIndirecto, PresupuestoNota
from app.models.proyecto import Proyecto
from app.models.proyecto_detalle import ProyectoDetalle
from app.models.proyecto_documento import ProyectoDocumento
from app.models.recurso import Recurso
from app.models.stakeholder import ProyectoStakeholder, Stakeholder
from app.models.subcategoria_item import SubcategoriaItem
from app.models.usuario import Usuario
from app.schemas.company_backup import (
    COMPANY_BACKUP_DESTRUCTIVE_CONFIRMATION_PHRASE,
    COMPANY_BACKUP_FORMAT_VERSION,
    COMPANY_BACKUP_INTERNAL_RETENTION_DAYS,
    COMPANY_BACKUP_RESTORED_INTERNAL_CLEANUP_DAYS,
    COMPANY_BACKUP_SCOPE,
)
from app.services.license import license_service


COMPANY_BACKUP_MAGIC = b"GIPROYBACKUP1\n"
COMPANY_BACKUP_MEDIA_TYPE = "application/vnd.giproy.company-backup"
COMPANY_BACKUP_EXCLUDED_TABLES = {
    "company_backup_operations",
    "company_backup_internal_artifacts",
    "sri_ruc_dataset_versions",
    "sri_ruc_records",
    "sri_ruc_verified_overrides",
    "ruc_manual_verifications",
    "sri_ruc_lookup_attempts",
    "system_audit_events",
}
COMPANY_BACKUP_RESTORE_PROTECTED_TABLES = {
    *COMPANY_BACKUP_EXCLUDED_TABLES,
    "marketplace_orders",
    "marketplace_order_items",
    "marketplace_checkout_drafts",
    "marketplace_payment_attempts",
    "marketplace_payment_events",
    "marketplace_refunds",
    "marketplace_reviews",
    "marketplace_asset_origins",
}


class CompanyBackupPolicyError(Exception):
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code
        self.message = message


def _normalize_role(user: Usuario) -> str:
    return (getattr(user, "rol", "") or "").strip().lower()


def _normalize_text(value: str | None) -> str:
    return " ".join((value or "").strip().lower().split())


def _json_safe(value: Any) -> Any:
    if isinstance(value, Decimal):
        return str(value)
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, bytes):
        return base64.b64encode(value).decode("ascii")
    if isinstance(value, dict):
        return {str(key): _json_safe(item) for key, item in value.items()}
    if isinstance(value, (list, tuple, set)):
        return [_json_safe(item) for item in value]
    return value


def _stable_json_bytes(payload: Any) -> bytes:
    return json.dumps(_json_safe(payload), ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")


def _safe_archive_name(value: str) -> str:
    return re.sub(r"[^A-Za-z0-9._-]+", "_", value or "file").strip("._") or "file"


def _utc_now() -> datetime:
    return datetime.utcnow().replace(microsecond=0)


def _iso_datetime(value: datetime | None) -> str | None:
    if not value:
        return None
    suffix = "Z" if value.tzinfo is None else ""
    return value.isoformat() + suffix


class CompanyBackupService:
    def _assert_superadmin(self, user: Usuario, *, code: str = "company_backup_superadmin_required") -> None:
        if _normalize_role(user) != "superadministrador":
            raise CompanyBackupPolicyError(
                code,
                "Operacion permitida solo para superadministradores.",
            )

    def resolve_effective_empresa_id(self, db: Session, user: Usuario, empresa_id: int | None = None) -> int:
        role = _normalize_role(user)
        if role not in {"administrador", "superadministrador"}:
            raise CompanyBackupPolicyError(
                "company_backup_role_forbidden",
                "Operacion permitida solo para administradores y superadministradores.",
            )

        if role == "superadministrador":
            target_empresa_id = empresa_id or user.empresa_id
            if not target_empresa_id:
                raise CompanyBackupPolicyError(
                    "company_backup_company_required",
                    "Seleccione una empresa activa antes de operar copias de seguridad.",
                )
            return int(target_empresa_id)

        if not user.empresa_id:
            raise CompanyBackupPolicyError(
                "company_backup_company_required",
                "El usuario administrador no tiene empresa asociada.",
            )
        if empresa_id and int(empresa_id) != int(user.empresa_id):
            raise CompanyBackupPolicyError(
                "company_backup_company_scope_forbidden",
                "Un administrador solo puede operar copias de seguridad de su empresa.",
            )
        return int(user.empresa_id)

    def get_company_or_error(self, db: Session, empresa_id: int) -> Empresa:
        empresa = db.query(Empresa).filter(Empresa.id == empresa_id).first()
        if not empresa:
            raise CompanyBackupPolicyError("company_backup_company_not_found", "Empresa no encontrada.")
        return empresa

    def build_company_identity(self, empresa: Empresa) -> dict[str, Any]:
        fiscal_identity = _normalize_text(empresa.ruc)
        identity_seed = "|".join(
            [
                str(empresa.id),
                fiscal_identity,
                _normalize_text(empresa.codigo),
                _normalize_text(empresa.nombre),
            ]
        )
        return {
            "empresa_id": empresa.id,
            "nombre": empresa.nombre,
            "alias": empresa.alias,
            "codigo": empresa.codigo,
            "ruc": empresa.ruc,
            "fiscal_identity": fiscal_identity or None,
            "pais": empresa.pais,
            "fingerprint": hashlib.sha256(identity_seed.encode("utf-8")).hexdigest(),
        }

    def _license_access_mode(self, db: Session, empresa_id: int) -> str:
        try:
            snapshot = license_service.get_company_license_snapshot(db, empresa_id)
        except Exception:
            return "full"
        return str(snapshot.get("access_mode") or "full")

    def _assert_restore_write_allowed(self, db: Session, empresa_id: int) -> None:
        if self._license_access_mode(db, empresa_id) == "readonly":
            raise CompanyBackupPolicyError(
                "company_backup_restore_readonly_forbidden",
                "La empresa esta en solo lectura: puede generar backup, pero no ejecutar restore.",
            )

    def _company_user_ids(self, db: Session, empresa_id: int) -> list[int]:
        return [
            item[0]
            for item in db.query(Usuario.id).filter(Usuario.empresa_id == empresa_id).all()
            if item[0] is not None
        ]

    def collect_counts(self, db: Session, empresa_id: int) -> dict[str, int]:
        user_ids = self._company_user_ids(db, empresa_id)
        project_ids = [
            row[0]
            for row in db.query(Proyecto.id).filter(Proyecto.empresa_id == empresa_id).all()
        ]
        presupuesto_ids = [
            row[0]
            for row in db.query(Presupuesto.id).filter(Presupuesto.empresa_id == empresa_id).all()
        ]

        counts = {
            "usuarios": db.query(Usuario).filter(Usuario.empresa_id == empresa_id).count(),
            "proyectos_total": db.query(Proyecto).filter(Proyecto.empresa_id == empresa_id).count(),
            "proyectos_activos": db.query(Proyecto).filter(Proyecto.empresa_id == empresa_id, Proyecto.deleted_at.is_(None)).count(),
            "proyectos_papelera": db.query(Proyecto).filter(Proyecto.empresa_id == empresa_id, Proyecto.deleted_at.isnot(None)).count(),
            "bases_total": db.query(BaseTrabajo).filter(BaseTrabajo.empresa_id == empresa_id).count(),
            "bases_activas": db.query(BaseTrabajo).filter(BaseTrabajo.empresa_id == empresa_id, BaseTrabajo.deleted_at.is_(None)).count(),
            "bases_papelera": db.query(BaseTrabajo).filter(BaseTrabajo.empresa_id == empresa_id, BaseTrabajo.deleted_at.isnot(None)).count(),
            "presupuestos": db.query(Presupuesto).filter(Presupuesto.empresa_id == empresa_id).count(),
            "presupuesto_detalles": db.query(PresupuestoDetalle).filter(PresupuestoDetalle.presupuesto_id.in_(presupuesto_ids)).count() if presupuesto_ids else 0,
            "presupuesto_indirectos": db.query(PresupuestoIndirecto).filter(PresupuestoIndirecto.empresa_id == empresa_id).count(),
            "presupuesto_notas": db.query(PresupuestoNota).filter(PresupuestoNota.presupuesto_id.in_(presupuesto_ids)).count() if presupuesto_ids else 0,
            "edt_nodes": db.query(EdtNode).filter(EdtNode.empresa_id == empresa_id).count(),
            "cronogramas_valorados": db.query(CronogramaValorado).filter(CronogramaValorado.empresa_id == empresa_id).count(),
            "cronogramas_trabajo": db.query(CronogramaTrabajo).filter(CronogramaTrabajo.empresa_id == empresa_id).count(),
            "apus": db.query(APU).filter(APU.empresa_id == empresa_id).count(),
            "apu_lineas": db.query(APULinea).join(APU, APULinea.apu_id == APU.id).filter(APU.empresa_id == empresa_id).count(),
            "recursos": db.query(Recurso).filter(Recurso.empresa_id == empresa_id).count(),
            "subcategorias": db.query(SubcategoriaItem).filter(SubcategoriaItem.empresa_id == empresa_id).count(),
            "stakeholders": db.query(Stakeholder).filter(Stakeholder.empresa_id == empresa_id).count(),
            "proyecto_stakeholders": db.query(ProyectoStakeholder).filter(ProyectoStakeholder.proyecto_id.in_(project_ids)).count() if project_ids else 0,
            "proyecto_detalles": db.query(ProyectoDetalle).filter(ProyectoDetalle.empresa_id == empresa_id).count(),
            "proyecto_documentos": db.query(ProyectoDocumento).filter(ProyectoDocumento.empresa_id == empresa_id).count(),
            "community_categories": db.query(CommunityCategory).filter(CommunityCategory.target_empresa_id == empresa_id).count(),
            "community_topics": db.query(CommunityTopic).filter(CommunityTopic.target_empresa_id == empresa_id).count(),
            "community_posts": db.query(CommunityPost).filter(or_(CommunityPost.empresa_id == empresa_id, CommunityPost.target_empresa_id == empresa_id)).count(),
            "community_replies": db.query(CommunityPostReply).join(CommunityPost, CommunityPostReply.post_id == CommunityPost.id).filter(or_(CommunityPost.empresa_id == empresa_id, CommunityPost.target_empresa_id == empresa_id)).count(),
            "community_attachments": db.query(CommunityAttachment).filter(CommunityAttachment.target_empresa_id == empresa_id).count(),
            "community_dm_threads": db.query(CommunityDmThread).filter(CommunityDmThread.empresa_context_id == empresa_id).count(),
            "community_dm_messages": db.query(CommunityDmMessage).join(CommunityDmThread, CommunityDmMessage.thread_id == CommunityDmThread.id).filter(CommunityDmThread.empresa_context_id == empresa_id).count(),
            "community_sanctions": db.query(CommunitySanction).filter(CommunitySanction.target_empresa_id == empresa_id).count(),
            "community_sanction_appeals": db.query(CommunitySanctionAppeal).join(CommunitySanction, CommunitySanctionAppeal.sanction_id == CommunitySanction.id).filter(CommunitySanction.target_empresa_id == empresa_id).count(),
            "community_infractions": db.query(CommunityInfraction).filter(CommunityInfraction.target_empresa_id == empresa_id).count(),
            "community_admin_alerts": db.query(CommunityAdminAlert).filter(CommunityAdminAlert.target_empresa_id == empresa_id).count(),
            "marketplace_seller_products": db.query(MarketplaceProduct).filter(MarketplaceProduct.seller_user_id.in_(user_ids)).count() if user_ids else 0,
            "marketplace_purchases": db.query(MarketplaceOrder).filter(MarketplaceOrder.buyer_user_id.in_(user_ids)).count() if user_ids else 0,
        }
        return counts

    def _fernet(self) -> Fernet:
        secret = settings.COMPANY_BACKUP_SECRET or settings.SECRET_KEY
        key_material = hashlib.sha256(f"giproy-company-backup:{secret}".encode("utf-8")).digest()
        return Fernet(base64.urlsafe_b64encode(key_material))

    def _resolve_existing_file(self, raw_path: str) -> Path | None:
        normalized = (raw_path or "").strip().replace("\\", "/")
        if not normalized or normalized.startswith("data:") or normalized.startswith("http://") or normalized.startswith("https://"):
            return None
        if normalized.startswith("/uploads/"):
            normalized = normalized.lstrip("/")
        path_value = Path(normalized)
        service_path = Path(__file__).resolve()
        backend_root = service_path.parents[2]
        repo_root = service_path.parents[3]
        candidates = [path_value] if path_value.is_absolute() else [
            Path.cwd() / path_value,
            backend_root / path_value,
            repo_root / path_value,
        ]
        for candidate in candidates:
            if candidate.exists() and candidate.is_file():
                return candidate
        return None

    def _file_reference_payload(self, *, entity_type: str, entity_id: Any, field: str, raw_path: str) -> dict[str, Any] | None:
        normalized = (raw_path or "").strip()
        if not normalized or normalized.startswith("data:") or normalized.startswith("http://") or normalized.startswith("https://"):
            return None
        resolved = self._resolve_existing_file(normalized)
        if not resolved:
            return {
                "entity_type": entity_type,
                "entity_id": str(entity_id),
                "field": field,
                "path": normalized,
                "exists": False,
                "size_bytes": None,
                "sha256": None,
                "blocker": "referenced_file_missing",
            }
        payload = resolved.read_bytes()
        return {
            "entity_type": entity_type,
            "entity_id": str(entity_id),
            "field": field,
            "path": normalized,
            "exists": True,
            "size_bytes": len(payload),
            "sha256": hashlib.sha256(payload).hexdigest(),
            "blocker": None,
        }

    def collect_file_references(self, db: Session, empresa_id: int) -> list[dict[str, Any]]:
        references: list[dict[str, Any]] = []

        for document in db.query(ProyectoDocumento).filter(ProyectoDocumento.empresa_id == empresa_id).all():
            item = self._file_reference_payload(
                entity_type="proyecto_documento",
                entity_id=document.id,
                field="storage_path",
                raw_path=document.storage_path,
            )
            if item:
                references.append(item)

        for attachment in db.query(CommunityAttachment).filter(CommunityAttachment.target_empresa_id == empresa_id).all():
            item = self._file_reference_payload(
                entity_type="community_attachment",
                entity_id=attachment.id,
                field="storage_path",
                raw_path=attachment.storage_path,
            )
            if item:
                references.append(item)

        details = db.query(ProyectoDetalle).filter(ProyectoDetalle.empresa_id == empresa_id).all()
        for detail in details:
            for field in ("imagen_referencial_url", "georef_map_url"):
                item = self._file_reference_payload(
                    entity_type="proyecto_detalle",
                    entity_id=detail.id,
                    field=field,
                    raw_path=getattr(detail, field, None) or "",
                )
                if item:
                    references.append(item)

        return references

    def _table_rows(self, db: Session, table_name: str, *, empresa_id: int) -> list[dict[str, Any]]:
        table = Base.metadata.tables.get(table_name)
        if table is None or table.name in COMPANY_BACKUP_EXCLUDED_TABLES:
            return []

        scoped_columns = [
            table.c[column_name]
            for column_name in ("empresa_id", "target_empresa_id", "empresa_context_id", "company_id")
            if column_name in table.c
        ]
        if not scoped_columns:
            return []
        statement = select(table).where(or_(*[column == empresa_id for column in scoped_columns]))
        return self._execute_table_rows(db, statement)

    def _execute_table_rows(self, db: Session, statement) -> list[dict[str, Any]]:
        rows = db.execute(statement).mappings().all()
        payload = [{str(key): _json_safe(value) for key, value in row.items()} for row in rows]
        payload.sort(key=lambda item: tuple(str(item.get(key, "")) for key in ("id", "created_at", "fecha_creacion")))
        return payload

    def _ids_from_rows(self, rows: list[dict[str, Any]], key: str = "id") -> list[int]:
        ids: list[int] = []
        for row in rows:
            value = row.get(key)
            if value is None:
                continue
            try:
                ids.append(int(value))
            except (TypeError, ValueError):
                continue
        return ids

    def _dependency_table_rows(self, db: Session, table_name: str, column_name: str, ids: list[int]) -> list[dict[str, Any]]:
        table = Base.metadata.tables.get(table_name)
        if table is None or not ids or column_name not in table.c:
            return []
        return self._execute_table_rows(db, select(table).where(table.c[column_name].in_(ids)))

    def _merge_table_rows(self, tables: dict[str, list[dict[str, Any]]], table_name: str, rows: list[dict[str, Any]]) -> None:
        if not rows:
            return
        by_id = {str(row.get("id")): row for row in tables.get(table_name, []) if row.get("id") is not None}
        without_id = [row for row in tables.get(table_name, []) if row.get("id") is None]
        for row in rows:
            row_id = row.get("id")
            if row_id is None:
                without_id.append(row)
            else:
                by_id[str(row_id)] = row
        merged = without_id + list(by_id.values())
        merged.sort(key=lambda item: tuple(str(item.get(key, "")) for key in ("id", "created_at", "fecha_creacion")))
        tables[table_name] = merged

    def _marketplace_reviews_rows(self, db: Session, *, product_ids: list[int], user_ids: list[int]) -> list[dict[str, Any]]:
        table = Base.metadata.tables.get("marketplace_reviews")
        if table is None:
            return []
        conditions = []
        if product_ids and "product_id" in table.c:
            conditions.append(table.c.product_id.in_(product_ids))
        if user_ids and "buyer_user_id" in table.c:
            conditions.append(table.c.buyer_user_id.in_(user_ids))
        if not conditions:
            return []
        return self._execute_table_rows(db, select(table).where(or_(*conditions)))

    def _marketplace_payment_attempt_rows(self, db: Session, *, order_ids: list[int], draft_ids: list[int]) -> list[dict[str, Any]]:
        table = Base.metadata.tables.get("marketplace_payment_attempts")
        if table is None:
            return []
        conditions = []
        if order_ids and "order_id" in table.c:
            conditions.append(table.c.order_id.in_(order_ids))
        if draft_ids and "checkout_draft_id" in table.c:
            conditions.append(table.c.checkout_draft_id.in_(draft_ids))
        if not conditions:
            return []
        return self._execute_table_rows(db, select(table).where(or_(*conditions)))

    def build_logical_snapshot(self, db: Session, empresa_id: int) -> dict[str, list[dict[str, Any]]]:
        tables: dict[str, list[dict[str, Any]]] = {}
        empresas_table = Base.metadata.tables.get("empresas")
        if empresas_table is not None:
            empresa_rows = self._execute_table_rows(
                db,
                select(empresas_table).where(empresas_table.c.id == empresa_id),
            )
            if empresa_rows:
                tables["empresas"] = empresa_rows

        for table_name in sorted(Base.metadata.tables.keys()):
            rows = self._table_rows(db, table_name, empresa_id=empresa_id)
            if rows:
                tables[table_name] = rows

        user_ids = self._ids_from_rows(tables.get("usuarios", []))
        project_ids = self._ids_from_rows(tables.get("proyectos", []))
        presupuesto_ids = self._ids_from_rows(tables.get("presupuestos", []))
        base_ids = self._ids_from_rows(tables.get("bases_trabajo", []))
        apu_ids = self._ids_from_rows(tables.get("apus", []))
        topic_ids = self._ids_from_rows(tables.get("community_topics", []))
        post_ids = self._ids_from_rows(tables.get("community_posts", []))
        dm_thread_ids = self._ids_from_rows(tables.get("community_dm_threads", []))
        marketplace_product_ids = self._ids_from_rows(tables.get("marketplace_products", []))
        marketplace_order_ids = self._ids_from_rows(tables.get("marketplace_orders", []))
        marketplace_checkout_draft_ids = self._ids_from_rows(tables.get("marketplace_checkout_drafts", []))

        if user_ids:
            self._merge_table_rows(
                tables,
                "marketplace_products",
                self._execute_table_rows(
                    db,
                    select(Base.metadata.tables["marketplace_products"]).where(
                        Base.metadata.tables["marketplace_products"].c.seller_user_id.in_(user_ids)
                    ),
                ),
            )
            marketplace_product_ids = self._ids_from_rows(tables.get("marketplace_products", []))

        dependency_specs = [
            ("apu_lineas", "apu_id", apu_ids),
            ("presupuesto_detalles", "presupuesto_id", presupuesto_ids),
            ("presupuesto_notas", "presupuesto_id", presupuesto_ids),
            ("proyecto_stakeholders", "proyecto_id", project_ids),
            ("community_topic_members", "topic_id", topic_ids),
            ("community_topic_follows", "topic_id", topic_ids),
            ("community_post_replies", "post_id", post_ids),
            ("community_dm_messages", "thread_id", dm_thread_ids),
            ("marketplace_order_items", "order_id", marketplace_order_ids),
            ("marketplace_payment_events", "payment_attempt_id", []),
            ("marketplace_refunds", "order_id", marketplace_order_ids),
        ]
        for table_name, column_name, ids in dependency_specs:
            rows = self._dependency_table_rows(db, table_name, column_name, ids)
            if rows:
                tables[table_name] = rows

        payment_attempt_rows = self._marketplace_payment_attempt_rows(
            db,
            order_ids=marketplace_order_ids,
            draft_ids=marketplace_checkout_draft_ids,
        )
        if payment_attempt_rows:
            tables["marketplace_payment_attempts"] = payment_attempt_rows
            payment_attempt_ids = self._ids_from_rows(payment_attempt_rows)
            payment_event_rows = self._dependency_table_rows(db, "marketplace_payment_events", "payment_attempt_id", payment_attempt_ids)
            if payment_event_rows:
                tables["marketplace_payment_events"] = payment_event_rows

        review_rows = self._marketplace_reviews_rows(db, product_ids=marketplace_product_ids, user_ids=user_ids)
        if review_rows:
            tables["marketplace_reviews"] = review_rows

        unit_ids = {
            int(row["unidad_id"])
            for row in tables.get("recursos", [])
            if row.get("unidad_id") is not None
        }
        category_ids = {
            int(row["categoria_id"])
            for row in tables.get("apus", [])
            if row.get("categoria_id") is not None
        }
        if base_ids:
            self._merge_table_rows(
                tables,
                "unidades",
                self._execute_table_rows(
                    db,
                    select(Base.metadata.tables["unidades"]).where(
                        or_(
                            Base.metadata.tables["unidades"].c.empresa_id == empresa_id,
                            Base.metadata.tables["unidades"].c.base_trabajo_id.in_(base_ids),
                            Base.metadata.tables["unidades"].c.id.in_(list(unit_ids) or [-1]),
                        )
                    ),
                ),
            )
            self._merge_table_rows(
                tables,
                "categorias_recursos",
                self._execute_table_rows(
                    db,
                    select(Base.metadata.tables["categorias_recursos"]).where(
                        or_(
                            Base.metadata.tables["categorias_recursos"].c.empresa_id == empresa_id,
                            Base.metadata.tables["categorias_recursos"].c.base_trabajo_id.in_(base_ids),
                            Base.metadata.tables["categorias_recursos"].c.id.in_(list(category_ids) or [-1]),
                        )
                    ),
                ),
            )

        return {name: rows for name, rows in sorted(tables.items()) if rows}

    def build_export_preflight(self, db: Session, user: Usuario, *, empresa_id: int | None = None) -> dict[str, Any]:
        effective_empresa_id = self.resolve_effective_empresa_id(db, user, empresa_id=empresa_id)
        empresa = self.get_company_or_error(db, effective_empresa_id)
        counts = self.collect_counts(db, effective_empresa_id)
        file_references = self.collect_file_references(db, effective_empresa_id)
        missing_files = [item for item in file_references if not item.get("exists")]
        blockers = [
            f"{item['entity_type']}:{item['entity_id']} referencia archivo inexistente en {item['field']}: {item['path']}"
            for item in missing_files
        ]
        warnings = [
            "Fase 1: preflight no destructivo. Exportacion cifrada y restauracion quedan bloqueadas hasta fases posteriores."
        ]
        marketplace_impact = {
            "seller_products_current": counts["marketplace_seller_products"],
            "purchases_preserved": counts["marketplace_purchases"],
            "products_not_in_backup_policy": "cancel_despublicar_auditoria_superadmin",
        }
        return {
            "dry_run": True,
            "exportable": not blockers,
            "scope": COMPANY_BACKUP_SCOPE,
            "contract_version": COMPANY_BACKUP_FORMAT_VERSION,
            "empresa": self.build_company_identity(empresa),
            "counts": counts,
            "file_references": file_references,
            "marketplace_impact": marketplace_impact,
            "warnings": warnings,
            "blockers": blockers,
            "next_allowed_action": "export_backup" if not blockers else "repair_file_integrity",
        }

    def build_export_archive(self, db: Session, user: Usuario, *, empresa_id: int | None = None) -> dict[str, Any]:
        preflight = self.build_export_preflight(db, user, empresa_id=empresa_id)
        if preflight["blockers"]:
            raise CompanyBackupPolicyError(
                "company_backup_export_blocked",
                "No se puede generar la copia porque existen bloqueos de integridad.",
            )

        effective_empresa_id = int(preflight["empresa"]["empresa_id"])
        snapshot_tables = self.build_logical_snapshot(db, effective_empresa_id)
        created_at = datetime.utcnow().replace(microsecond=0).isoformat() + "Z"
        data_hash = hashlib.sha256(_stable_json_bytes(snapshot_tables)).hexdigest()

        file_manifest: list[dict[str, Any]] = []
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", compression=zipfile.ZIP_DEFLATED) as package:
            for table_name, rows in snapshot_tables.items():
                package.writestr(f"data/tables/{table_name}.json", _stable_json_bytes(rows))

            for index, reference in enumerate(preflight["file_references"], start=1):
                resolved = self._resolve_existing_file(reference["path"])
                if not resolved:
                    raise CompanyBackupPolicyError(
                        "company_backup_file_missing",
                        f"Archivo referenciado no encontrado: {reference['path']}",
                    )
                payload = resolved.read_bytes()
                sha256 = hashlib.sha256(payload).hexdigest()
                if sha256 != reference.get("sha256"):
                    raise CompanyBackupPolicyError(
                        "company_backup_file_hash_changed",
                        f"El archivo referenciado cambio durante la exportacion: {reference['path']}",
                    )
                archive_path = f"files/{index:04d}_{sha256[:16]}_{_safe_archive_name(Path(reference['path']).name)}"
                package.writestr(archive_path, payload)
                file_manifest.append({**reference, "archive_path": archive_path})

            manifest = {
                "format_version": COMPANY_BACKUP_FORMAT_VERSION,
                "scope": COMPANY_BACKUP_SCOPE,
                "created_at": created_at,
                "created_by_user_id": user.id,
                "created_by_user_email": user.email,
                "company_identity": preflight["empresa"],
                "includes_deleted_items": True,
                "includes_files": True,
                "includes_community": True,
                "marketplace_policy": preflight["marketplace_impact"],
                "counts": preflight["counts"],
                "table_counts": {table_name: len(rows) for table_name, rows in snapshot_tables.items()},
                "file_count": len(file_manifest),
                "total_file_size": sum(int(item.get("size_bytes") or 0) for item in file_manifest),
                "files": file_manifest,
                "data_hash": data_hash,
                "encryption": {
                    "algorithm": "fernet",
                    "key_source": "settings.COMPANY_BACKUP_SECRET|SECRET_KEY",
                },
            }
            package.writestr("manifest.json", _stable_json_bytes(manifest))

        zip_payload = zip_buffer.getvalue()
        payload_hash = hashlib.sha256(zip_payload).hexdigest()
        encrypted_payload = self._fernet().encrypt(zip_payload)
        archive_bytes = COMPANY_BACKUP_MAGIC + encrypted_payload
        backup_hash = hashlib.sha256(archive_bytes).hexdigest()
        filename = f"giproy_empresa_{effective_empresa_id}_{created_at.replace(':', '').replace('-', '').replace('Z', '')}.giproybackup"
        manifest["payload_hash"] = payload_hash
        manifest["backup_hash"] = backup_hash

        return {
            "archive_bytes": archive_bytes,
            "backup_hash": backup_hash,
            "payload_hash": payload_hash,
            "filename": filename,
            "size_bytes": len(archive_bytes),
            "manifest": manifest,
            "preflight": preflight,
        }

    def _internal_backup_root(self) -> Path:
        service_path = Path(__file__).resolve()
        backend_root = service_path.parents[2]
        return backend_root / "backups" / "company_internal"

    def _artifact_summary(self, artifact: CompanyBackupInternalArtifact) -> dict[str, Any]:
        return {
            "id": artifact.id,
            "empresa_id": artifact.empresa_id,
            "status": artifact.status,
            "reason": artifact.reason,
            "backup_hash": artifact.backup_hash,
            "backup_format_version": artifact.backup_format_version,
            "size_bytes": artifact.size_bytes,
            "created_by_email": artifact.created_by_email,
            "created_by_role": artifact.created_by_role,
            "created_at": _iso_datetime(artifact.created_at),
            "expires_at": _iso_datetime(artifact.expires_at),
            "cleanup_after": _iso_datetime(artifact.cleanup_after),
            "restored_at": _iso_datetime(artifact.restored_at),
            "counts": artifact.counts_json or {},
            "manifest_summary": artifact.manifest_summary_json or {},
        }

    def _delete_internal_artifact_file(self, artifact: CompanyBackupInternalArtifact) -> None:
        try:
            artifact_path = Path(artifact.artifact_path)
            if artifact_path.exists() and artifact_path.is_file():
                artifact_path.unlink()
        except OSError:
            return

    def mark_expired_internal_artifacts(self, db: Session, *, now: datetime | None = None) -> int:
        now = now or _utc_now()
        expired = (
            db.query(CompanyBackupInternalArtifact)
            .filter(
                CompanyBackupInternalArtifact.deleted_at.is_(None),
                CompanyBackupInternalArtifact.status == "available",
                CompanyBackupInternalArtifact.expires_at <= now,
            )
            .all()
        )
        for artifact in expired:
            artifact.status = "expired"
            artifact.deleted_at = now
            artifact.deletion_reason = "retention_30_days_expired"
            self._delete_internal_artifact_file(artifact)
        return len(expired)

    def mark_restored_internal_artifacts_for_cleanup(self, db: Session, *, now: datetime | None = None) -> int:
        now = now or _utc_now()
        restored = (
            db.query(CompanyBackupInternalArtifact)
            .filter(
                CompanyBackupInternalArtifact.deleted_at.is_(None),
                CompanyBackupInternalArtifact.status == "restored",
                CompanyBackupInternalArtifact.cleanup_after.isnot(None),
                CompanyBackupInternalArtifact.cleanup_after <= now,
            )
            .all()
        )
        for artifact in restored:
            artifact.status = "deleted"
            artifact.deleted_at = now
            artifact.deletion_reason = "restored_cleanup_after_7_days_elapsed"
            self._delete_internal_artifact_file(artifact)
        return len(restored)

    def list_internal_artifacts(
        self,
        db: Session,
        user: Usuario,
        *,
        empresa_id: int | None = None,
    ) -> dict[str, Any]:
        self._assert_superadmin(user)
        effective_empresa_id = self.resolve_effective_empresa_id(db, user, empresa_id=empresa_id)
        empresa = self.get_company_or_error(db, effective_empresa_id)
        expired_count = self.mark_expired_internal_artifacts(db)
        restored_cleanup_count = self.mark_restored_internal_artifacts_for_cleanup(db)
        if expired_count or restored_cleanup_count:
            db.flush()
        artifacts = (
            db.query(CompanyBackupInternalArtifact)
            .filter(
                CompanyBackupInternalArtifact.empresa_id == effective_empresa_id,
                CompanyBackupInternalArtifact.deleted_at.is_(None),
            )
            .order_by(CompanyBackupInternalArtifact.created_at.desc(), CompanyBackupInternalArtifact.id.desc())
            .all()
        )
        return {
            "empresa": self.build_company_identity(empresa),
            "retention_days": COMPANY_BACKUP_INTERNAL_RETENTION_DAYS,
            "restored_cleanup_days": COMPANY_BACKUP_RESTORED_INTERNAL_CLEANUP_DAYS,
            "items": [self._artifact_summary(artifact) for artifact in artifacts],
        }

    def list_cross_company_restore_attempts(
        self,
        db: Session,
        user: Usuario,
        *,
        limit: int = 200,
    ) -> dict[str, Any]:
        self._assert_superadmin(user)
        operations = (
            db.query(CompanyBackupOperation)
            .filter(
                CompanyBackupOperation.operation_type == "restore_preflight",
                CompanyBackupOperation.status == "blocked",
            )
            .order_by(CompanyBackupOperation.created_at.desc(), CompanyBackupOperation.id.desc())
            .limit(max(1, min(int(limit or 200), 1000)))
            .all()
        )
        grouped: dict[str, dict[str, Any]] = {}
        for operation in operations:
            preflight = operation.preflight_json or {}
            if preflight.get("same_company") is not False:
                continue
            attempted_empresa = preflight.get("empresa") or {}
            backup_empresa = preflight.get("backup_empresa") or None
            attempted_fingerprint = attempted_empresa.get("fingerprint") or f"empresa:{operation.empresa_id}"
            backup_fingerprint = (backup_empresa or {}).get("fingerprint") or "backup:unknown"
            key = f"{attempted_fingerprint}|{backup_fingerprint}"
            if key not in grouped:
                grouped[key] = {
                    "attempted_empresa": attempted_empresa,
                    "backup_empresa": backup_empresa,
                    "attempts": 0,
                    "last_attempt_at": _iso_datetime(operation.created_at),
                    "last_requested_by_email": operation.requested_by_email,
                    "last_backup_hash": operation.backup_hash,
                    "operation_ids": [],
                }
            grouped[key]["attempts"] += 1
            grouped[key]["operation_ids"].append(operation.id)
        items = sorted(
            grouped.values(),
            key=lambda item: (item.get("last_attempt_at") or "", item.get("attempts") or 0),
            reverse=True,
        )
        return {"items": items}

    def create_internal_safety_backup(
        self,
        db: Session,
        user: Usuario,
        *,
        restore_preflight: dict[str, Any],
        source_backup_filename: str | None,
        require_superadmin: bool = True,
    ) -> dict[str, Any]:
        if require_superadmin:
            self._assert_superadmin(user)
        if not restore_preflight.get("restorable"):
            raise CompanyBackupPolicyError(
                "company_backup_restore_preflight_blocked",
                "No se puede crear copia automatica previa porque el preflight de restauracion tiene bloqueos.",
            )

        empresa_id = int(restore_preflight["empresa"]["empresa_id"])
        operation = CompanyBackupOperation(
            empresa_id=empresa_id,
            requested_by_user_id=user.id,
            requested_by_email=user.email,
            requested_by_role=user.rol,
            operation_type="restore_prepare_internal_safety_backup",
            source="internal",
            scope=COMPANY_BACKUP_SCOPE,
            status="running",
            backup_hash=restore_preflight.get("backup_hash"),
            backup_format_version=COMPANY_BACKUP_FORMAT_VERSION,
            backup_filename=source_backup_filename,
            preflight_json=restore_preflight,
            counts_json=restore_preflight.get("current_counts"),
            marketplace_impact_json=restore_preflight.get("marketplace_impact"),
            warnings_json=restore_preflight.get("warnings"),
            blockers_json=[],
            metadata_json={
                "source_backup_hash": restore_preflight.get("backup_hash"),
                "source_backup_created_at": restore_preflight.get("backup_created_at"),
                "source_backup_created_by_email": restore_preflight.get("backup_created_by_email"),
                "required_confirmations": restore_preflight.get("required_confirmations", []),
            },
        )
        db.add(operation)
        db.flush()

        try:
            archive = self.build_export_archive(db, user, empresa_id=empresa_id)
            now = _utc_now()
            root = self._internal_backup_root() / f"empresa_{empresa_id}"
            root.mkdir(parents=True, exist_ok=True)
            filename = f"pre_restore_{operation.id}_{archive['filename']}"
            artifact_path = root / filename
            artifact_path.write_bytes(archive["archive_bytes"])
            expires_at = now + timedelta(days=COMPANY_BACKUP_INTERNAL_RETENTION_DAYS)

            artifact = CompanyBackupInternalArtifact(
                empresa_id=empresa_id,
                created_by_operation_id=operation.id,
                created_by_user_id=user.id,
                created_by_email=user.email,
                created_by_role=user.rol,
                reason="pre_restore_safety",
                status="available",
                artifact_path=str(artifact_path),
                backup_hash=archive["backup_hash"],
                backup_format_version=COMPANY_BACKUP_FORMAT_VERSION,
                size_bytes=archive["size_bytes"],
                counts_json=archive["preflight"]["counts"],
                manifest_summary_json={
                    "created_at": archive["manifest"].get("created_at"),
                    "company_identity": archive["manifest"].get("company_identity"),
                    "table_counts": archive["manifest"].get("table_counts"),
                    "file_count": archive["manifest"].get("file_count"),
                    "total_file_size": archive["manifest"].get("total_file_size"),
                    "source": "automatic_pre_restore",
                },
                expires_at=expires_at,
            )
            db.add(artifact)
            db.flush()
            operation.internal_artifact_id = artifact.id
            operation.status = "prepared"
            operation.backup_hash = archive["backup_hash"]
            operation.file_manifest_json = archive["manifest"].get("files")
            operation.metadata_json = {
                **(operation.metadata_json or {}),
                "internal_artifact_id": artifact.id,
                "internal_artifact_path": str(artifact_path),
                "internal_backup_hash": archive["backup_hash"],
                "internal_payload_hash": archive["payload_hash"],
                "internal_expires_at": _iso_datetime(expires_at),
            }
            operation.completed_at = now
            return {
                "operation": operation,
                "artifact": artifact,
                "archive": archive,
                "summary": self._artifact_summary(artifact),
            }
        except Exception:
            operation.status = "failed"
            operation.failure_reason = "No se pudo crear la copia automatica previa."
            raise

    def _coerce_value_for_column(self, column, value: Any) -> Any:
        if value is None:
            return None
        column_type = column.type
        if isinstance(column_type, DateTime) and isinstance(value, str):
            raw = value[:-1] if value.endswith("Z") else value
            return datetime.fromisoformat(raw)
        if isinstance(column_type, Date) and not isinstance(column_type, DateTime) and isinstance(value, str):
            return date.fromisoformat(value)
        if isinstance(column_type, Numeric) and not isinstance(value, Decimal):
            return Decimal(str(value))
        if isinstance(column_type, Boolean) and isinstance(value, str):
            return value.strip().lower() in {"1", "true", "yes", "si", "sí"}
        if isinstance(column_type, Integer) and isinstance(value, str) and value.strip():
            return int(value)
        return value

    def _coerce_row_for_table(self, table, row: dict[str, Any]) -> dict[str, Any]:
        return {
            key: self._coerce_value_for_column(table.c[key], value)
            for key, value in row.items()
            if key in table.c
        }

    def _single_primary_key(self, table):
        primary_keys = list(table.primary_key.columns)
        if len(primary_keys) != 1:
            return None
        return primary_keys[0]

    def _primary_key_values(self, table, rows: list[dict[str, Any]]) -> list[Any]:
        primary_key = self._single_primary_key(table)
        if primary_key is None:
            return []
        values = [row.get(primary_key.name) for row in rows if row.get(primary_key.name) is not None]
        return [self._coerce_value_for_column(primary_key, value) for value in values]

    def _restore_table_order(self, table_names: set[str]) -> list[str]:
        dependencies: dict[str, set[str]] = {name: set() for name in table_names if name in Base.metadata.tables}
        for table_name in list(dependencies.keys()):
            table = Base.metadata.tables[table_name]
            for foreign_key in table.foreign_keys:
                parent_name = foreign_key.column.table.name
                if parent_name != table_name and parent_name in dependencies:
                    dependencies[table_name].add(parent_name)

        ordered: list[str] = []
        ready = sorted(name for name, parents in dependencies.items() if not parents)
        while ready:
            table_name = ready.pop(0)
            ordered.append(table_name)
            for candidate in sorted(dependencies.keys()):
                if table_name in dependencies[candidate]:
                    dependencies[candidate].remove(table_name)
                    if not dependencies[candidate] and candidate not in ordered and candidate not in ready:
                        ready.append(candidate)
            ready.sort()

        unresolved = sorted(name for name in dependencies if name not in ordered)
        return ordered + unresolved

    def _restore_target_tables(
        self,
        current_tables: dict[str, list[dict[str, Any]]],
        backup_tables: dict[str, list[dict[str, Any]]],
    ) -> set[str]:
        excluded = COMPANY_BACKUP_RESTORE_PROTECTED_TABLES | {"empresas", "usuarios", "marketplace_products"}
        return {
            table_name
            for table_name in set(current_tables.keys()) | set(backup_tables.keys())
            if table_name not in excluded and table_name in Base.metadata.tables
        }

    def _purge_target_tables(self, current_tables: dict[str, list[dict[str, Any]]]) -> set[str]:
        excluded = COMPANY_BACKUP_RESTORE_PROTECTED_TABLES | {"empresas", "usuarios", "marketplace_products"}
        return {
            table_name
            for table_name in current_tables.keys()
            if table_name not in excluded and table_name in Base.metadata.tables
        }

    def _delete_current_restore_rows(
        self,
        db: Session,
        *,
        current_tables: dict[str, list[dict[str, Any]]],
        table_order: list[str],
    ) -> dict[str, int]:
        deleted_counts: dict[str, int] = {}
        for table_name in reversed(table_order):
            table = Base.metadata.tables.get(table_name)
            rows = current_tables.get(table_name, [])
            if table is None or not rows:
                continue
            primary_key = self._single_primary_key(table)
            primary_values = self._primary_key_values(table, rows)
            if primary_key is None or not primary_values:
                continue
            db.execute(delete(table).where(primary_key.in_(primary_values)))
            deleted_counts[table_name] = len(primary_values)
        return deleted_counts

    def _insert_backup_restore_rows(
        self,
        db: Session,
        *,
        backup_tables: dict[str, list[dict[str, Any]]],
        table_order: list[str],
    ) -> dict[str, int]:
        inserted_counts: dict[str, int] = {}
        for table_name in table_order:
            table = Base.metadata.tables.get(table_name)
            rows = backup_tables.get(table_name, [])
            if table is None or not rows:
                continue
            coerced_rows = [self._coerce_row_for_table(table, row) for row in rows]
            db.execute(table.insert(), coerced_rows)
            inserted_counts[table_name] = len(coerced_rows)
        return inserted_counts

    def _restore_empresa_row(
        self,
        db: Session,
        *,
        empresa_id: int,
        backup_tables: dict[str, list[dict[str, Any]]],
    ) -> int:
        table = Base.metadata.tables.get("empresas")
        rows = backup_tables.get("empresas") or []
        if table is None or not rows:
            return 0
        row = dict(rows[0])
        row["id"] = empresa_id
        values = self._coerce_row_for_table(table, row)
        values.pop("id", None)
        db.execute(update(table).where(table.c.id == empresa_id).values(**values))
        return 1

    def _marketplace_preserved_user_ids(self, db: Session, empresa_id: int) -> set[int]:
        user_ids = set(self._company_user_ids(db, empresa_id))
        preserved: set[int] = set()

        product_rows = (
            db.query(MarketplaceProduct.seller_user_id)
            .filter(MarketplaceProduct.seller_user_id.in_(list(user_ids) or [-1]))
            .all()
        )
        preserved.update(int(row[0]) for row in product_rows if row[0] is not None)

        order_rows = (
            db.query(MarketplaceOrder.buyer_user_id)
            .filter(MarketplaceOrder.buyer_user_id.in_(list(user_ids) or [-1]))
            .all()
        )
        preserved.update(int(row[0]) for row in order_rows if row[0] is not None)

        order_item_table = Base.metadata.tables.get("marketplace_order_items")
        if order_item_table is not None and "seller_user_id" in order_item_table.c:
            rows = db.execute(
                select(order_item_table.c.seller_user_id).where(order_item_table.c.seller_user_id.in_(list(user_ids) or [-1]))
            ).all()
            preserved.update(int(row[0]) for row in rows if row[0] is not None)

        review_table = Base.metadata.tables.get("marketplace_reviews")
        if review_table is not None and "buyer_user_id" in review_table.c:
            rows = db.execute(
                select(review_table.c.buyer_user_id).where(review_table.c.buyer_user_id.in_(list(user_ids) or [-1]))
            ).all()
            preserved.update(int(row[0]) for row in rows if row[0] is not None)

        return preserved

    def _restore_user_rows(
        self,
        db: Session,
        *,
        empresa_id: int,
        current_tables: dict[str, list[dict[str, Any]]],
        backup_tables: dict[str, list[dict[str, Any]]],
    ) -> dict[str, int]:
        table = Base.metadata.tables.get("usuarios")
        if table is None:
            return {"deleted": 0, "inserted": 0, "updated": 0, "preserved_marketplace": 0}

        current_ids = set(self._primary_key_values(table, current_tables.get("usuarios", [])))
        backup_rows = backup_tables.get("usuarios", [])
        backup_ids = set(self._primary_key_values(table, backup_rows))
        preserved_ids = self._marketplace_preserved_user_ids(db, empresa_id)
        deletable_ids = sorted(current_ids - backup_ids - preserved_ids)
        if deletable_ids:
            db.execute(delete(table).where(table.c.id.in_(deletable_ids)))

        updated = 0
        inserted = 0
        for row in backup_rows:
            values = self._coerce_row_for_table(table, row)
            user_id = values.get("id")
            if user_id in current_ids:
                update_values = dict(values)
                update_values.pop("id", None)
                db.execute(update(table).where(table.c.id == user_id).values(**update_values))
                updated += 1
            else:
                db.execute(table.insert().values(**values))
                inserted += 1

        return {
            "deleted": len(deletable_ids),
            "inserted": inserted,
            "updated": updated,
            "preserved_marketplace": len(preserved_ids - backup_ids),
        }

    def _restore_marketplace_products(
        self,
        db: Session,
        *,
        current_tables: dict[str, list[dict[str, Any]]],
        backup_tables: dict[str, list[dict[str, Any]]],
        user: Usuario,
    ) -> dict[str, int]:
        table = Base.metadata.tables.get("marketplace_products")
        if table is None:
            return {"cancelled": 0, "inserted": 0, "updated": 0}

        now = _utc_now()
        current_rows = current_tables.get("marketplace_products", [])
        backup_rows = backup_tables.get("marketplace_products", [])
        current_ids = set(self._primary_key_values(table, current_rows))
        backup_ids = set(self._primary_key_values(table, backup_rows))
        cancelled_ids = sorted(current_ids - backup_ids)
        if cancelled_ids:
            db.execute(
                update(table)
                .where(table.c.id.in_(cancelled_ids))
                .values(
                    activo=False,
                    estado="cancelled",
                    fecha_actualizacion=now,
                    admin_notes=(
                        "Cancelado automaticamente por restauracion 1:1 de empresa. "
                        f"Operacion confirmada por {user.email}."
                    ),
                )
            )

        updated = 0
        inserted = 0
        for row in backup_rows:
            values = self._coerce_row_for_table(table, row)
            product_id = values.get("id")
            if product_id in current_ids:
                update_values = dict(values)
                update_values.pop("id", None)
                db.execute(update(table).where(table.c.id == product_id).values(**update_values))
                updated += 1
            else:
                db.execute(table.insert().values(**values))
                inserted += 1

        return {"cancelled": len(cancelled_ids), "inserted": inserted, "updated": updated}

    def _reset_postgresql_sequences(self, db: Session, table_names: set[str]) -> None:
        if db.bind is None or db.bind.dialect.name != "postgresql":
            return
        for table_name in sorted(table_names):
            table = Base.metadata.tables.get(table_name)
            if table is None or "id" not in table.c:
                continue
            db.execute(
                text(
                    "SELECT setval(pg_get_serial_sequence(:table_name, 'id'), "
                    f"COALESCE((SELECT MAX(id) FROM {table.name}), 1), true)"
                ),
                {"table_name": table.name},
            )

    def _restore_declared_files(self, *, zip_payload: bytes, manifest: dict[str, Any]) -> dict[str, int]:
        restored = 0
        total_size = 0
        service_path = Path(__file__).resolve()
        repo_root = service_path.parents[3]
        with zipfile.ZipFile(io.BytesIO(zip_payload), "r") as package:
            for file_item in manifest.get("files") or []:
                archive_path = file_item.get("archive_path")
                raw_path = (file_item.get("path") or "").strip().replace("\\", "/")
                if not archive_path or not raw_path:
                    raise CompanyBackupPolicyError(
                        "company_backup_file_restore_invalid_manifest",
                        "La copia contiene una referencia de archivo incompleta.",
                    )
                payload = package.read(archive_path)
                if hashlib.sha256(payload).hexdigest() != file_item.get("sha256"):
                    raise CompanyBackupPolicyError(
                        "company_backup_file_restore_hash_mismatch",
                        f"Hash no coincide al restaurar archivo: {raw_path}",
                    )

                normalized = raw_path.lstrip("/") if raw_path.startswith("/uploads/") else raw_path
                target = Path(normalized)
                if not target.is_absolute():
                    target = repo_root / target
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(payload)
                restored += 1
                total_size += len(payload)
        return {"files_restored": restored, "total_file_size": total_size}

    def _delete_referenced_files(self, file_references: list[dict[str, Any]]) -> dict[str, int]:
        deleted = 0
        missing = 0
        total_size = 0
        seen: set[Path] = set()
        for item in file_references:
            path = self._resolve_existing_file(str(item.get("path") or ""))
            if path is None:
                missing += 1
                continue
            try:
                resolved = path.resolve()
            except Exception:
                missing += 1
                continue
            if resolved in seen:
                continue
            seen.add(resolved)
            try:
                if resolved.exists() and resolved.is_file():
                    total_size += resolved.stat().st_size
                    resolved.unlink()
                    deleted += 1
                else:
                    missing += 1
            except Exception:
                missing += 1
        return {"files_deleted": deleted, "files_missing": missing, "deleted_file_size": total_size}

    def build_offboarding_preflight(self, db: Session, user: Usuario, *, empresa_id: int) -> dict[str, Any]:
        self._assert_superadmin(user)
        empresa = self.get_company_or_error(db, empresa_id)
        if getattr(empresa, "lifecycle_status", "active") == "baja_purgada":
            raise CompanyBackupPolicyError(
                "company_offboarding_already_purged",
                "La empresa ya esta dada de baja y purgada.",
            )
        export_preflight = self.build_export_preflight(db, user, empresa_id=empresa_id)
        current_tables = self.build_logical_snapshot(db, empresa_id)
        purge_tables = self._purge_target_tables(current_tables)
        purge_counts = {table_name: len(current_tables.get(table_name, [])) for table_name in sorted(purge_tables)}
        user_ids = set(self._primary_key_values(Base.metadata.tables["usuarios"], current_tables.get("usuarios", []))) if "usuarios" in Base.metadata.tables else set()
        preserved_users = self._marketplace_preserved_user_ids(db, empresa_id)
        purge_counts["usuarios_deletable"] = max(0, len(user_ids - preserved_users))
        purge_counts["usuarios_preservados_marketplace"] = len(preserved_users)
        return {
            "empresa": export_preflight["empresa"],
            "exportable": export_preflight["exportable"],
            "blockers": list(export_preflight["blockers"]),
            "warnings": [
                *export_preflight["warnings"],
                "La baja purgada elimina datos restaurables y archivos fisicos. El cliente debe custodiar la copia descargada.",
            ],
            "counts": export_preflight["counts"],
            "purge_counts": purge_counts,
            "file_references": export_preflight["file_references"],
            "next_allowed_action": "download_backup_then_execute_offboarding" if export_preflight["exportable"] else "repair_file_integrity",
        }

    def execute_offboarding_purge(
        self,
        db: Session,
        user: Usuario,
        *,
        empresa_id: int,
        archive_bytes: bytes,
        filename: str | None,
        confirm_phrase: str,
    ) -> dict[str, Any]:
        self._assert_superadmin(user)
        if (confirm_phrase or "").strip() != "CONFIRMO BAJA PURGADA":
            raise CompanyBackupPolicyError(
                "company_offboarding_confirmations_invalid",
                "La confirmacion final de baja purgada no coincide.",
            )
        empresa = self.get_company_or_error(db, empresa_id)
        if getattr(empresa, "lifecycle_status", "active") == "baja_purgada":
            raise CompanyBackupPolicyError(
                "company_offboarding_already_purged",
                "La empresa ya esta dada de baja y purgada.",
            )

        preflight = self.build_restore_preflight(
            db,
            user,
            archive_bytes=archive_bytes,
            filename=filename,
            empresa_id=empresa_id,
            allow_readonly=True,
        )
        if preflight["blockers"]:
            raise CompanyBackupPolicyError(
                "company_offboarding_backup_invalid",
                "La copia de seguridad no es valida para dar de baja esta empresa.",
            )

        manifest, backup_tables, _ = self._read_backup_package(archive_bytes)
        backup_hash = hashlib.sha256(archive_bytes).hexdigest()
        current_tables = self.build_logical_snapshot(db, empresa_id)
        purge_tables = self._purge_target_tables(current_tables)
        table_order = self._restore_table_order(purge_tables)
        file_references = self.collect_file_references(db, empresa_id)
        file_counts = self._delete_referenced_files(file_references)
        deleted_counts = self._delete_current_restore_rows(
            db,
            current_tables=current_tables,
            table_order=table_order,
        )
        user_counts = self._restore_user_rows(
            db,
            empresa_id=empresa_id,
            current_tables=current_tables,
            backup_tables={"usuarios": []},
        )
        if "usuarios" in Base.metadata.tables:
            preserved_ids = self._marketplace_preserved_user_ids(db, empresa_id)
            if preserved_ids:
                db.execute(
                    update(Base.metadata.tables["usuarios"])
                    .where(Base.metadata.tables["usuarios"].c.id.in_(sorted(preserved_ids)))
                    .values(activo=False)
                )

        now = _utc_now()
        empresa.activa = False
        empresa.lifecycle_status = "baja_purgada"
        empresa.baja_purged_at = now
        empresa.baja_backup_hash = backup_hash
        empresa.baja_backup_manifest = {
            "filename": filename,
            "backup_created_at": manifest.get("created_at"),
            "backup_empresa": manifest.get("company_identity"),
            "table_counts": manifest.get("table_counts"),
            "file_count": manifest.get("file_count"),
            "total_file_size": manifest.get("total_file_size"),
        }
        empresa.baja_purged_counts = {
            "deleted_tables": deleted_counts,
            "users": user_counts,
            "files": file_counts,
            "backup_table_counts": {table_name: len(rows) for table_name, rows in backup_tables.items()},
        }
        empresa.baja_requested_by_email = user.email
        empresa.baja_recovery_required = True
        db.add(empresa)
        db.flush()

        operation = CompanyBackupOperation(
            empresa_id=empresa_id,
            requested_by_user_id=user.id,
            requested_by_email=user.email,
            requested_by_role=user.rol,
            operation_type="offboarding_purge",
            source="saas",
            scope=COMPANY_BACKUP_SCOPE,
            status="completed",
            backup_hash=backup_hash,
            backup_format_version=COMPANY_BACKUP_FORMAT_VERSION,
            backup_filename=filename,
            preflight_json=preflight,
            counts_json=preflight.get("current_counts"),
            file_manifest_json=manifest.get("files"),
            warnings_json=preflight.get("warnings"),
            blockers_json=[],
            metadata_json=empresa.baja_purged_counts,
            confirmations_json={
                "confirm_phrase": "CONFIRMO BAJA PURGADA",
                "confirmed_by_email": user.email,
                "confirmed_at": _iso_datetime(now),
            },
            completed_at=now,
        )
        db.add(operation)
        db.flush()
        return {
            "operation_id": operation.id,
            "empresa": self.build_company_identity(empresa),
            "backup_hash": backup_hash,
            "purged_counts": empresa.baja_purged_counts,
            "lifecycle_status": empresa.lifecycle_status,
            "warnings": [
                "Baja purgada completada. GiProy conserva solo la ficha minima y auditoria; la recuperacion depende de la copia custodiada por el cliente.",
            ],
        }

    def _validate_internal_artifact_for_restore(
        self,
        db: Session,
        *,
        empresa_id: int,
        internal_artifact_id: int,
    ) -> CompanyBackupInternalArtifact:
        artifact = (
            db.query(CompanyBackupInternalArtifact)
            .filter(
                CompanyBackupInternalArtifact.id == internal_artifact_id,
                CompanyBackupInternalArtifact.empresa_id == empresa_id,
                CompanyBackupInternalArtifact.deleted_at.is_(None),
            )
            .first()
        )
        if not artifact:
            raise CompanyBackupPolicyError(
                "company_backup_internal_artifact_required",
                "Debe existir una copia automatica interna previa para restaurar.",
            )
        if artifact.status != "available":
            raise CompanyBackupPolicyError(
                "company_backup_internal_artifact_not_available",
                "La copia automatica interna no esta disponible para esta restauracion.",
            )
        if artifact.expires_at and artifact.expires_at <= _utc_now():
            raise CompanyBackupPolicyError(
                "company_backup_internal_artifact_expired",
                "La copia automatica interna expiro y debe generarse una nueva.",
            )
        artifact_path = Path(artifact.artifact_path)
        if not artifact_path.exists() or not artifact_path.is_file():
            raise CompanyBackupPolicyError(
                "company_backup_internal_artifact_file_missing",
                "El archivo de copia automatica interna no existe en disco.",
            )
        if hashlib.sha256(artifact_path.read_bytes()).hexdigest() != artifact.backup_hash:
            raise CompanyBackupPolicyError(
                "company_backup_internal_artifact_hash_mismatch",
                "El hash de la copia automatica interna no coincide.",
            )
        return artifact

    def _validate_destructive_confirmations(
        self,
        *,
        user: Usuario,
        empresa: dict[str, Any],
        confirm_phrase: str,
    ) -> dict[str, Any]:
        failures: list[str] = []
        if (confirm_phrase or "").strip() != COMPANY_BACKUP_DESTRUCTIVE_CONFIRMATION_PHRASE:
            failures.append("confirm_phrase")
        if failures:
            raise CompanyBackupPolicyError(
                "company_backup_restore_confirmations_invalid",
                "La confirmacion final de importacion no coincide exactamente.",
            )
        return {
            "confirm_phrase": COMPANY_BACKUP_DESTRUCTIVE_CONFIRMATION_PHRASE,
            "confirmed_by_user_id": user.id,
            "confirmed_by_email": user.email,
            "confirmed_by_role": user.rol,
            "confirmed_at": _iso_datetime(_utc_now()),
        }

    def execute_destructive_restore(
        self,
        db: Session,
        user: Usuario,
        *,
        archive_bytes: bytes,
        filename: str | None,
        empresa_id: int | None,
        internal_artifact_id: int | None = None,
        confirm_phrase: str,
        source: str = "external",
    ) -> dict[str, Any]:
        self._assert_superadmin(user)
        preflight = self.build_restore_preflight(
            db,
            user,
            archive_bytes=archive_bytes,
            filename=filename,
            empresa_id=empresa_id,
        )
        if not preflight.get("restorable"):
            raise CompanyBackupPolicyError(
                "company_backup_restore_preflight_blocked",
                "La copia no supera el preflight de restauracion.",
            )

        effective_empresa_id = int(preflight["empresa"]["empresa_id"])
        if internal_artifact_id:
            artifact = self._validate_internal_artifact_for_restore(
                db,
                empresa_id=effective_empresa_id,
                internal_artifact_id=internal_artifact_id,
            )
        else:
            prepared = self.create_internal_safety_backup(
                db,
                user,
                restore_preflight=preflight,
                source_backup_filename=filename,
                require_superadmin=False,
            )
            artifact = prepared["artifact"]
        confirmations = self._validate_destructive_confirmations(
            user=user,
            empresa=preflight["empresa"],
            confirm_phrase=confirm_phrase,
        )

        manifest, backup_tables, zip_payload = self._read_backup_package(archive_bytes)
        current_tables = self.build_logical_snapshot(db, effective_empresa_id)
        target_tables = self._restore_target_tables(current_tables, backup_tables)
        table_order = self._restore_table_order(target_tables)

        operation = CompanyBackupOperation(
            empresa_id=effective_empresa_id,
            requested_by_user_id=user.id,
            requested_by_email=user.email,
            requested_by_role=user.rol,
            operation_type="restore_execute",
            source=source,
            scope=COMPANY_BACKUP_SCOPE,
            status="running",
            backup_hash=preflight["backup_hash"],
            backup_format_version=COMPANY_BACKUP_FORMAT_VERSION,
            backup_filename=filename,
            internal_artifact_id=artifact.id,
            preflight_json=preflight,
            confirmations_json=confirmations,
            counts_json=preflight.get("backup_counts"),
            file_manifest_json=manifest.get("files"),
            marketplace_impact_json=preflight.get("marketplace_impact"),
            warnings_json=preflight.get("warnings"),
            blockers_json=[],
            metadata_json={
                "internal_artifact_id": artifact.id,
                "internal_backup_hash": artifact.backup_hash,
                "backup_table_counts": preflight.get("backup_table_counts"),
                "restore_policy": "destructive_company_1to1_with_audit_and_marketplace_purchase_protection",
            },
        )
        db.add(operation)
        db.flush()

        try:
            deleted_counts = self._delete_current_restore_rows(
                db,
                current_tables=current_tables,
                table_order=table_order,
            )
            updated_counts: dict[str, int] = {
                "empresas": self._restore_empresa_row(
                    db,
                    empresa_id=effective_empresa_id,
                    backup_tables=backup_tables,
                )
            }
            user_counts = self._restore_user_rows(
                db,
                empresa_id=effective_empresa_id,
                current_tables=current_tables,
                backup_tables=backup_tables,
            )
            updated_counts["usuarios"] = user_counts["updated"]
            inserted_counts = self._insert_backup_restore_rows(
                db,
                backup_tables=backup_tables,
                table_order=table_order,
            )
            inserted_counts["usuarios"] = user_counts["inserted"]
            deleted_counts["usuarios"] = user_counts["deleted"]

            marketplace_counts = self._restore_marketplace_products(
                db,
                current_tables=current_tables,
                backup_tables=backup_tables,
                user=user,
            )
            updated_counts["marketplace_products"] = marketplace_counts["updated"]
            inserted_counts["marketplace_products"] = marketplace_counts["inserted"]
            deleted_counts["marketplace_products_cancelled"] = marketplace_counts["cancelled"]

            file_counts = self._restore_declared_files(zip_payload=zip_payload, manifest=manifest)

            restored_table_names = target_tables | {"empresas", "usuarios", "marketplace_products"}
            self._reset_postgresql_sequences(db, restored_table_names)
            restored_counts = self.collect_counts(db, effective_empresa_id)

            now = _utc_now()
            artifact.status = "restored"
            artifact.restored_by_operation_id = operation.id
            artifact.restored_at = now
            artifact.cleanup_after = now + timedelta(days=COMPANY_BACKUP_RESTORED_INTERNAL_CLEANUP_DAYS)
            artifact.deletion_reason = "restored_cleanup_after_7_days"

            older_artifacts = (
                db.query(CompanyBackupInternalArtifact)
                .filter(
                    CompanyBackupInternalArtifact.empresa_id == effective_empresa_id,
                    CompanyBackupInternalArtifact.id != artifact.id,
                    CompanyBackupInternalArtifact.created_at <= artifact.created_at,
                    CompanyBackupInternalArtifact.deleted_at.is_(None),
                )
                .all()
            )
            for older in older_artifacts:
                older.status = "superseded"
                older.deleted_at = now
                older.deletion_reason = "superseded_by_restored_internal_artifact"

            operation.status = "completed"
            operation.completed_at = now
            operation.counts_json = restored_counts
            operation.metadata_json = {
                **(operation.metadata_json or {}),
                "deleted_counts": deleted_counts,
                "inserted_counts": inserted_counts,
                "updated_counts": updated_counts,
                "file_counts": file_counts,
                "user_restore_counts": user_counts,
                "marketplace_restore_counts": marketplace_counts,
            }

            return {
                "operation": operation,
                "artifact": artifact,
                "empresa": preflight["empresa"],
                "backup_hash": preflight["backup_hash"],
                "restored_counts": restored_counts,
                "deleted_counts": deleted_counts,
                "inserted_counts": inserted_counts,
                "updated_counts": updated_counts,
                "marketplace_impact": preflight["marketplace_impact"],
                "warnings": [
                    *preflight.get("warnings", []),
                    "Restauracion destructiva completada con copia automatica previa registrada.",
                    "Compras de Marketplace preservadas; productos de venta no presentes en la copia fueron cancelados y quedan solo para auditoria/superadministrador.",
                ],
            }
        except Exception:
            operation.status = "failed"
            operation.failure_reason = "La restauracion destructiva no pudo completarse."
            raise

    def execute_internal_artifact_restore(
        self,
        db: Session,
        user: Usuario,
        *,
        empresa_id: int | None,
        internal_artifact_id: int,
        confirm_phrase: str,
    ) -> dict[str, Any]:
        self._assert_superadmin(user)
        effective_empresa_id = self.resolve_effective_empresa_id(db, user, empresa_id=empresa_id)
        artifact = self._validate_internal_artifact_for_restore(
            db,
            empresa_id=effective_empresa_id,
            internal_artifact_id=internal_artifact_id,
        )
        archive_bytes = Path(artifact.artifact_path).read_bytes()
        return self.execute_destructive_restore(
            db,
            user,
            archive_bytes=archive_bytes,
            filename=f"internal-artifact-{artifact.id}.giproybackup",
            empresa_id=effective_empresa_id,
            internal_artifact_id=artifact.id,
            confirm_phrase=confirm_phrase,
            source="internal",
        )

    def decrypt_archive_for_verification(self, archive_bytes: bytes) -> bytes:
        if not archive_bytes.startswith(COMPANY_BACKUP_MAGIC):
            raise CompanyBackupPolicyError("company_backup_invalid_magic", "El archivo no es una copia GiProy valida.")
        token = archive_bytes[len(COMPANY_BACKUP_MAGIC):]
        try:
            return self._fernet().decrypt(token)
        except InvalidToken as exc:
            raise CompanyBackupPolicyError(
                "company_backup_decrypt_failed",
                "No se pudo descifrar la copia. Verifique que fue generada por este sistema GiProy.",
            ) from exc

    def _read_backup_package(self, archive_bytes: bytes) -> tuple[dict[str, Any], dict[str, list[dict[str, Any]]], bytes]:
        zip_payload = self.decrypt_archive_for_verification(archive_bytes)
        try:
            with zipfile.ZipFile(io.BytesIO(zip_payload), "r") as package:
                if "manifest.json" not in package.namelist():
                    raise CompanyBackupPolicyError("company_backup_manifest_missing", "La copia no contiene manifest.")
                manifest = json.loads(package.read("manifest.json").decode("utf-8"))
                table_payload: dict[str, list[dict[str, Any]]] = {}
                for name in package.namelist():
                    if not name.startswith("data/tables/") or not name.endswith(".json"):
                        continue
                    table_name = Path(name).stem
                    table_payload[table_name] = json.loads(package.read(name).decode("utf-8"))
                for file_item in manifest.get("files") or []:
                    archive_path = file_item.get("archive_path")
                    if not archive_path or archive_path not in package.namelist():
                        raise CompanyBackupPolicyError(
                            "company_backup_declared_file_missing",
                            f"La copia no contiene el archivo declarado: {archive_path or file_item.get('path')}",
                        )
                    payload = package.read(archive_path)
                    sha256 = hashlib.sha256(payload).hexdigest()
                    if sha256 != file_item.get("sha256"):
                        raise CompanyBackupPolicyError(
                            "company_backup_declared_file_hash_mismatch",
                            f"Hash no coincide para archivo declarado: {file_item.get('path')}",
                        )
        except zipfile.BadZipFile as exc:
            raise CompanyBackupPolicyError("company_backup_invalid_payload", "El payload descifrado no es un paquete valido.") from exc
        except json.JSONDecodeError as exc:
            raise CompanyBackupPolicyError("company_backup_invalid_json", "La copia contiene JSON invalido.") from exc

        data_hash = hashlib.sha256(_stable_json_bytes(table_payload)).hexdigest()
        if data_hash != manifest.get("data_hash"):
            raise CompanyBackupPolicyError(
                "company_backup_data_hash_mismatch",
                "El hash de datos del backup no coincide con su manifest.",
            )
        return manifest, table_payload, zip_payload

    def build_restore_preflight(
        self,
        db: Session,
        user: Usuario,
        *,
        archive_bytes: bytes,
        filename: str | None = None,
        empresa_id: int | None = None,
        allow_readonly: bool = False,
    ) -> dict[str, Any]:
        effective_empresa_id = self.resolve_effective_empresa_id(db, user, empresa_id=empresa_id)
        if not allow_readonly:
            self._assert_restore_write_allowed(db, effective_empresa_id)
        empresa = self.get_company_or_error(db, effective_empresa_id)
        current_identity = self.build_company_identity(empresa)
        current_counts = self.collect_counts(db, effective_empresa_id)
        backup_hash = hashlib.sha256(archive_bytes).hexdigest()
        manifest, table_payload, _ = self._read_backup_package(archive_bytes)

        blockers: list[str] = []
        warnings = [
            "Validacion no destructiva. Restore Empresa exige confirmacion final y crea copia automatica interna antes de restaurar.",
            "Restore Empresa borra los datos actuales restaurables y los reemplaza por el contenido de esta copia.",
        ]

        if manifest.get("format_version") != COMPANY_BACKUP_FORMAT_VERSION:
            blockers.append("La version del backup no es compatible con esta version de GiProy.")
        if manifest.get("scope") != COMPANY_BACKUP_SCOPE:
            blockers.append("El alcance del backup no corresponde a una copia completa 1:1 de empresa.")
        backup_empresa = manifest.get("company_identity") or {}
        fiscal_match = bool(
            (backup_empresa.get("fiscal_identity") or _normalize_text(backup_empresa.get("ruc")))
            and (backup_empresa.get("fiscal_identity") or _normalize_text(backup_empresa.get("ruc"))) == current_identity.get("fiscal_identity")
        )
        same_company = backup_empresa.get("fingerprint") == current_identity.get("fingerprint")
        if not same_company:
            blockers.append("La copia pertenece a otra empresa y no puede restaurarse aqui para evitar mezcla o sobrescritura multi-tenant.")
        if not fiscal_match:
            blockers.append("El RUC de la copia no coincide exactamente con el RUC inmutable de la empresa destino.")

        files = manifest.get("files") or []
        if int(manifest.get("file_count") or 0) != len(files):
            blockers.append("El conteo de archivos del manifest no coincide con los archivos declarados.")
        table_counts = {table_name: len(rows) for table_name, rows in table_payload.items()}
        manifest_table_counts = manifest.get("table_counts") or {}
        if manifest_table_counts != table_counts:
            blockers.append("Los conteos de tablas del manifest no coinciden con el contenido de datos.")
        if not manifest.get("includes_community"):
            blockers.append("La copia no declara inclusion de Otros > Comunidad.")
        if not manifest.get("includes_deleted_items"):
            blockers.append("La copia no declara inclusion de papelera/borrado logico.")
        if not manifest.get("includes_files"):
            blockers.append("La copia no declara inclusion de archivos fisicos.")

        marketplace_policy = manifest.get("marketplace_policy") or {}
        marketplace_impact = {
            "seller_products_current": current_counts.get("marketplace_seller_products", 0),
            "purchases_preserved": current_counts.get("marketplace_purchases", 0),
            "products_not_in_backup_policy": marketplace_policy.get(
                "products_not_in_backup_policy",
                "cancel_despublicar_auditoria_superadmin",
            ),
        }
        required_confirmations = [
            f"escribir frase final: {COMPANY_BACKUP_DESTRUCTIVE_CONFIRMATION_PHRASE}",
        ]
        restorable = not blockers
        return {
            "dry_run": True,
            "restorable": restorable,
            "destructive_allowed": False,
            "scope": COMPANY_BACKUP_SCOPE,
            "contract_version": COMPANY_BACKUP_FORMAT_VERSION,
            "same_company": same_company,
            "fiscal_identity_match": fiscal_match,
            "empresa": current_identity,
            "backup_empresa": backup_empresa or None,
            "backup_created_at": manifest.get("created_at"),
            "backup_created_by_email": manifest.get("created_by_user_email"),
            "backup_hash": backup_hash,
            "current_counts": current_counts,
            "backup_counts": manifest.get("counts") or {},
            "backup_table_counts": table_counts,
            "file_count": len(files),
            "total_file_size": int(manifest.get("total_file_size") or 0),
            "marketplace_impact": marketplace_impact,
            "warnings": warnings,
            "blockers": blockers,
            "required_confirmations": required_confirmations,
            "next_allowed_action": "final_confirmation_required" if restorable else "reject_restore_preflight",
            "filename": filename,
        }


company_backup_service = CompanyBackupService()
