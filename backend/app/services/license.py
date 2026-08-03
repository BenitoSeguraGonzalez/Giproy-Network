from datetime import date, datetime, timedelta, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.inspection import inspect as sa_inspect
from sqlalchemy.exc import OperationalError, ProgrammingError
from app.models.empresa import Empresa
from app.models.usuario import Usuario
from app.models.base_trabajo import BaseTrabajo
from app.models.base_trabajo_asignacion import BaseTrabajoAsignacion
from app.models.proyecto import Proyecto
from app.models.proyecto_asignacion import ProyectoAsignacion
from app.models.proyecto_detalle import ProyectoDetalle
from app.models.licencia import Licencia
from app.models.empresa_licencia import EmpresaLicencia
from app.models.empresa_uso import EmpresaUso
from app.models.license_event import LicenseEvent
from app.models.subcategoria_item import SubcategoriaItem
from app.models.recurso import CategoriaRecurso, Recurso
from app.models.unidad import Unidad
from app.models.apu import APU, APULinea
from app.models.stakeholder import Rol, Stakeholder, ProyectoStakeholder
from app.models.edt import EdtNode
from app.models.edo import EdoNode
from app.models.presupuesto import Presupuesto, PresupuestoDetalle, PresupuestoIndirecto, PresupuestoNota, PresupuestoVistaUsuario, PresupuestoLineaVistaUsuario
from app.models.cronograma import CronogramaValorado
from app.models.cronograma_trabajo import CronogramaTrabajo
from app.models.polinomica import FormulaPolinomica, FormulaPolinomicaMonomio, CuadrillaTipo, FormulaPolinomicaAsignacion
from app.models.community import CommunityAdminAlert, CommunityAttachment, CommunityCategory, CommunityDmMessage, CommunityDmThread, CommunityInfraction, CommunityPost, CommunityPostReply, CommunitySanction, CommunitySanctionAppeal, CommunityTopic, CommunityTopicFollow, CommunityTopicMember
from fastapi import HTTPException, status


DEFAULT_LICENSE_CATALOG = [
    {
        "nombre": "Express",
        "codigo": "EXPRESS",
        "plan_kind": "express",
        "descripcion": "Trial/freemium de 30 dias para arranque controlado de empresa.",
        "precio_mensual": 0,
        "precio_anual": 0,
        "sort_order": 0,
        "is_default_express": True,
        "limites": {
            "administradores": 1,
            "usuarios_normales": 0,
            "usuarios": 1,
            "proyectos": 1,
            "almacenamiento_gb": 0.05,
            "modulos_permitidos": ["apus", "presupuestos"],
            "trial_days": 30,
            "watermark_reports": True,
            "excel_exports": False,
            "ads_enabled": True,
        },
    },
    {
        "nombre": "Estándar",
        "codigo": "STANDARD",
        "plan_kind": "estandar",
        "descripcion": "Licencia SaaS estándar para operación regular de empresa.",
        "precio_mensual": 25,
        "precio_anual": 250,
        "sort_order": 10,
        "is_default_express": False,
        "limites": {
            "administradores": 1,
            "usuarios_normales": 4,
            "usuarios": 5,
            "proyectos": -1,
            "almacenamiento_gb": 500,
            "storage_unlimited": True,
            "modulos_permitidos": ["apus", "presupuestos"],
            "packs_opcionales": ["PACK_PLANIFICA", "PACK_LICITA", "PACK_CONECTA"],
            "conecta_base_slots": 1,
            "watermark_reports": False,
            "excel_exports": True,
            "support_sla_hours": 48,
        },
    },
    {
        "nombre": "Profesional",
        "codigo": "PROFESSIONAL",
        "plan_kind": "profesional",
        "descripcion": "Licencia SaaS profesional para operación extendida.",
        "precio_mensual": 40,
        "precio_anual": 400,
        "sort_order": 20,
        "is_default_express": False,
        "limites": {
            "administradores": 2,
            "usuarios_normales": 13,
            "usuarios": 15,
            "proyectos": -1,
            "almacenamiento_gb": 500,
            "storage_unlimited": True,
            "modulos_permitidos": ["*"],
            "packs_incluidos": ["PACK_PLANIFICA", "PACK_LICITA"],
            "packs_opcionales": ["PACK_CONECTA", "PACK_EQUIPO"],
            "conecta_base_slots": 2,
            "team_pack_available": True,
            "watermark_reports": False,
            "excel_exports": True,
            "support_sla_hours": 24,
        },
    },
]

LICENSE_GRACE_DAYS = 15


def _is_legacy_license_schema_error(exc: Exception) -> bool:
    message = str(exc or "").lower()
    return any(token in message for token in [
        "licencias.plan_kind",
        "licencias.precio_mensual",
        "licencias.precio_anual",
        "licencias.is_default_express",
        "empresa_licencias",
        "license_events",
        "undefinedcolumn",
        "undefinedtable",
    ])


def _value_size_bytes(value) -> int:
    if value is None:
        return 0
    if isinstance(value, (bytes, bytearray)):
        return len(value)
    return len(str(value).encode("utf-8"))


def _estimate_query_storage_bytes(query, model) -> int:
    mapper = sa_inspect(model)
    column_keys = [column.key for column in mapper.columns]
    total = 0
    for row in query.yield_per(200):
        total += 32
        for key in column_keys:
            total += _value_size_bytes(getattr(row, key, None))
    return total


def _company_scoped_queries(db: Session, empresa_id: int):
    company_base_ids = db.query(BaseTrabajo.id).filter(BaseTrabajo.empresa_id == empresa_id)
    return (
        (Usuario, db.query(Usuario).filter(Usuario.empresa_id == empresa_id)),
        (BaseTrabajo, db.query(BaseTrabajo).filter(BaseTrabajo.empresa_id == empresa_id)),
        (
            BaseTrabajoAsignacion,
            db.query(BaseTrabajoAsignacion)
            .join(BaseTrabajo, BaseTrabajo.id == BaseTrabajoAsignacion.base_trabajo_id)
            .filter(BaseTrabajo.empresa_id == empresa_id),
        ),
        (Proyecto, db.query(Proyecto).filter(Proyecto.empresa_id == empresa_id)),
        (
            ProyectoAsignacion,
            db.query(ProyectoAsignacion)
            .join(Proyecto, Proyecto.id == ProyectoAsignacion.proyecto_id)
            .filter(Proyecto.empresa_id == empresa_id),
        ),
        (ProyectoDetalle, db.query(ProyectoDetalle).filter(ProyectoDetalle.empresa_id == empresa_id)),
        (SubcategoriaItem, db.query(SubcategoriaItem).filter(SubcategoriaItem.empresa_id == empresa_id)),
        (
            CategoriaRecurso,
            db.query(CategoriaRecurso).filter(
                (CategoriaRecurso.empresa_id == empresa_id)
                | (
                    CategoriaRecurso.empresa_id.is_(None)
                    & CategoriaRecurso.base_trabajo_id.in_(company_base_ids)
                )
            ),
        ),
        (
            Unidad,
            db.query(Unidad).filter(
                (Unidad.empresa_id == empresa_id)
                | (
                    Unidad.empresa_id.is_(None)
                    & Unidad.base_trabajo_id.in_(company_base_ids)
                )
            ),
        ),
        (Recurso, db.query(Recurso).filter(Recurso.empresa_id == empresa_id)),
        (APU, db.query(APU).filter(APU.empresa_id == empresa_id)),
        (
            APULinea,
            db.query(APULinea)
            .join(APU, APU.id == APULinea.apu_id)
            .filter(APU.empresa_id == empresa_id),
        ),
        (Rol, db.query(Rol).filter(Rol.empresa_id == empresa_id)),
        (Stakeholder, db.query(Stakeholder).filter(Stakeholder.empresa_id == empresa_id)),
        (
            ProyectoStakeholder,
            db.query(ProyectoStakeholder)
            .join(Proyecto, Proyecto.id == ProyectoStakeholder.proyecto_id)
            .filter(Proyecto.empresa_id == empresa_id),
        ),
        (EdtNode, db.query(EdtNode).filter(EdtNode.empresa_id == empresa_id)),
        (EdoNode, db.query(EdoNode).filter(EdoNode.empresa_id == empresa_id)),
        (Presupuesto, db.query(Presupuesto).filter(Presupuesto.empresa_id == empresa_id)),
        (
            PresupuestoDetalle,
            db.query(PresupuestoDetalle)
            .join(Presupuesto, Presupuesto.id == PresupuestoDetalle.presupuesto_id)
            .filter(Presupuesto.empresa_id == empresa_id),
        ),
        (PresupuestoIndirecto, db.query(PresupuestoIndirecto).filter(PresupuestoIndirecto.empresa_id == empresa_id)),
        (
            PresupuestoNota,
            db.query(PresupuestoNota)
            .join(Presupuesto, Presupuesto.id == PresupuestoNota.presupuesto_id)
            .filter(Presupuesto.empresa_id == empresa_id),
        ),
        (
            PresupuestoVistaUsuario,
            db.query(PresupuestoVistaUsuario)
            .join(Presupuesto, Presupuesto.id == PresupuestoVistaUsuario.presupuesto_id)
            .filter(Presupuesto.empresa_id == empresa_id),
        ),
        (
            PresupuestoLineaVistaUsuario,
            db.query(PresupuestoLineaVistaUsuario)
            .join(Presupuesto, Presupuesto.id == PresupuestoLineaVistaUsuario.presupuesto_id)
            .filter(Presupuesto.empresa_id == empresa_id),
        ),
        (CronogramaValorado, db.query(CronogramaValorado).filter(CronogramaValorado.empresa_id == empresa_id)),
        (CronogramaTrabajo, db.query(CronogramaTrabajo).filter(CronogramaTrabajo.empresa_id == empresa_id)),
        (
            FormulaPolinomica,
            db.query(FormulaPolinomica)
            .join(Presupuesto, Presupuesto.id == FormulaPolinomica.presupuesto_id)
            .filter(Presupuesto.empresa_id == empresa_id),
        ),
        (
            FormulaPolinomicaMonomio,
            db.query(FormulaPolinomicaMonomio)
            .join(FormulaPolinomica, FormulaPolinomica.id == FormulaPolinomicaMonomio.formula_id)
            .join(Presupuesto, Presupuesto.id == FormulaPolinomica.presupuesto_id)
            .filter(Presupuesto.empresa_id == empresa_id),
        ),
        (
            CuadrillaTipo,
            db.query(CuadrillaTipo)
            .join(FormulaPolinomica, FormulaPolinomica.id == CuadrillaTipo.formula_id)
            .join(Presupuesto, Presupuesto.id == FormulaPolinomica.presupuesto_id)
            .filter(Presupuesto.empresa_id == empresa_id),
        ),
        (
            FormulaPolinomicaAsignacion,
            db.query(FormulaPolinomicaAsignacion)
            .join(FormulaPolinomica, FormulaPolinomica.id == FormulaPolinomicaAsignacion.formula_id)
            .join(Presupuesto, Presupuesto.id == FormulaPolinomica.presupuesto_id)
            .filter(Presupuesto.empresa_id == empresa_id),
        ),
        (CommunityCategory, db.query(CommunityCategory).filter(CommunityCategory.target_empresa_id == empresa_id)),
        (CommunityTopic, db.query(CommunityTopic).filter(CommunityTopic.target_empresa_id == empresa_id)),
        (
            CommunityTopicMember,
            db.query(CommunityTopicMember)
            .join(CommunityTopic, CommunityTopic.id == CommunityTopicMember.topic_id)
            .filter(CommunityTopic.target_empresa_id == empresa_id),
        ),
        (
            CommunityTopicFollow,
            db.query(CommunityTopicFollow)
            .join(CommunityTopic, CommunityTopic.id == CommunityTopicFollow.topic_id)
            .filter(CommunityTopic.target_empresa_id == empresa_id),
        ),
        (
            CommunityPost,
            db.query(CommunityPost).filter(
                (CommunityPost.target_empresa_id == empresa_id) | (CommunityPost.empresa_id == empresa_id)
            ),
        ),
        (
            CommunityPostReply,
            db.query(CommunityPostReply)
            .join(CommunityPost, CommunityPost.id == CommunityPostReply.post_id)
            .filter((CommunityPost.target_empresa_id == empresa_id) | (CommunityPost.empresa_id == empresa_id)),
        ),
        (CommunityDmThread, db.query(CommunityDmThread).filter(CommunityDmThread.empresa_context_id == empresa_id)),
        (
            CommunityDmMessage,
            db.query(CommunityDmMessage)
            .join(CommunityDmThread, CommunityDmThread.id == CommunityDmMessage.thread_id)
            .filter(CommunityDmThread.empresa_context_id == empresa_id),
        ),
        (CommunityAttachment, db.query(CommunityAttachment).filter(CommunityAttachment.target_empresa_id == empresa_id)),
        (CommunitySanction, db.query(CommunitySanction).filter(CommunitySanction.target_empresa_id == empresa_id)),
        (
            CommunitySanctionAppeal,
            db.query(CommunitySanctionAppeal)
            .join(CommunitySanction, CommunitySanction.id == CommunitySanctionAppeal.sanction_id)
            .filter(CommunitySanction.target_empresa_id == empresa_id),
        ),
        (CommunityInfraction, db.query(CommunityInfraction).filter(CommunityInfraction.target_empresa_id == empresa_id)),
        (CommunityAdminAlert, db.query(CommunityAdminAlert).filter(CommunityAdminAlert.target_empresa_id == empresa_id)),
    )

class LicenseService:
    @staticmethod
    def ensure_default_catalog(db: Session) -> list[Licencia]:
        catalog: list[Licencia] = []
        for seed in DEFAULT_LICENSE_CATALOG:
            licencia = (
                db.query(Licencia)
                .filter(
                    (func.upper(Licencia.codigo) == seed["codigo"])
                    | (func.lower(Licencia.nombre) == seed["nombre"].lower())
                )
                .first()
            )
            if not licencia:
                licencia = Licencia(
                    nombre=seed["nombre"],
                    codigo=seed["codigo"],
                    descripcion=seed["descripcion"],
                    limites=seed["limites"],
                    plan_kind=seed["plan_kind"],
                    precio_mensual=seed["precio_mensual"],
                    precio_anual=seed["precio_anual"],
                    sort_order=seed["sort_order"],
                    is_default_express=seed["is_default_express"],
                    activo=True,
                )
                db.add(licencia)
                db.flush()
            else:
                licencia.nombre = licencia.nombre or seed["nombre"]
                licencia.descripcion = licencia.descripcion or seed["descripcion"]
                licencia.plan_kind = licencia.plan_kind or seed["plan_kind"]
                licencia.precio_mensual = licencia.precio_mensual if licencia.precio_mensual is not None else seed["precio_mensual"]
                licencia.precio_anual = licencia.precio_anual if licencia.precio_anual is not None else seed["precio_anual"]
                licencia.sort_order = licencia.sort_order or seed["sort_order"]
                licencia.is_default_express = bool(licencia.is_default_express or seed["is_default_express"])
                if not isinstance(licencia.limites, dict) or not licencia.limites:
                    licencia.limites = seed["limites"]
                licencia.activo = True
            catalog.append(licencia)
        db.flush()
        return catalog

    @staticmethod
    def get_default_express_license(db: Session) -> Licencia:
        LicenseService.ensure_default_catalog(db)
        licencia = (
            db.query(Licencia)
            .filter(Licencia.activo == True, (Licencia.is_default_express == True) | (func.upper(Licencia.codigo) == "EXPRESS"))
            .order_by(Licencia.id.asc())
            .first()
        )
        if not licencia:
            raise HTTPException(status_code=500, detail="No existe la licencia Express base del sistema.")
        return licencia

    @staticmethod
    def _build_assignment_end(starts_at: date, months: int) -> date:
        safe_months = max(1, int(months or 1))
        return starts_at + timedelta(days=30 * safe_months)

    @staticmethod
    def _log_event(
        db: Session,
        *,
        empresa_id: int,
        event_type: str,
        empresa_licencia_id: int | None = None,
        licencia_id: int | None = None,
        actor_usuario_id: int | None = None,
        notes: str | None = None,
        payload: dict | None = None,
    ) -> None:
        db.add(
            LicenseEvent(
                empresa_id=empresa_id,
                empresa_licencia_id=empresa_licencia_id,
                licencia_id=licencia_id,
                actor_usuario_id=actor_usuario_id,
                event_type=event_type,
                notes=notes,
                payload=payload or None,
            )
        )

    @staticmethod
    def _sync_legacy_company_window(db: Session, empresa_id: int, current_assignment: EmpresaLicencia | None = None) -> None:
        assignment = current_assignment
        if assignment is None:
            today = date.today()
            assignment = (
                db.query(EmpresaLicencia)
                .filter(
                    EmpresaLicencia.empresa_id == empresa_id,
                    EmpresaLicencia.activa == True,
                    EmpresaLicencia.status == "active",
                    EmpresaLicencia.starts_at <= today,
                )
                .filter((EmpresaLicencia.ends_at == None) | (EmpresaLicencia.ends_at >= today))
                .order_by(EmpresaLicencia.starts_at.desc(), EmpresaLicencia.id.desc())
                .first()
            )
        if assignment:
            target_start = assignment.starts_at
            target_end = assignment.grace_ends_at or assignment.ends_at or assignment.starts_at
            current_window = (
                db.query(Empresa.license_start_date, Empresa.license_end_date)
                .filter(Empresa.id == empresa_id)
                .first()
            )
            if current_window and (
                current_window.license_start_date == target_start
                and current_window.license_end_date == target_end
            ):
                return
            db.query(Empresa).filter(Empresa.id == empresa_id).update(
                {
                    Empresa.license_start_date: target_start,
                    Empresa.license_end_date: target_end,
                },
                synchronize_session=False,
            )

    @staticmethod
    def ensure_company_express_assignment(db: Session, empresa_id: int) -> EmpresaLicencia:
        express = LicenseService.get_default_express_license(db)
        assignment = (
            db.query(EmpresaLicencia)
            .filter(
                EmpresaLicencia.empresa_id == empresa_id,
                EmpresaLicencia.licencia_id == express.id,
                EmpresaLicencia.activa == True,
            )
            .order_by(EmpresaLicencia.id.desc())
            .first()
        )
        if assignment:
            if assignment.status != "active":
                assignment.status = "active"
                assignment.read_only_mode = False
                assignment.activated_at = assignment.activated_at or datetime.now(timezone.utc)
                db.add(assignment)
            LicenseService._sync_legacy_company_window(db, empresa_id, assignment)
            db.flush()
            return assignment

        assignment = EmpresaLicencia(
            empresa_id=empresa_id,
            licencia_id=express.id,
            starts_at=date.today(),
            ends_at=None,
            status="active",
            source="system_default",
            activa=True,
            activated_at=datetime.now(timezone.utc),
            payment_confirmed_at=datetime.now(timezone.utc),
            read_only_mode=False,
            detalles={"kind": "default_express"},
        )
        db.add(assignment)
        db.flush()
        LicenseService._log_event(
            db,
            empresa_id=empresa_id,
            empresa_licencia_id=assignment.id,
            licencia_id=express.id,
            event_type="license_default_express_seeded",
            payload={"starts_at": assignment.starts_at.isoformat()},
        )
        LicenseService._sync_legacy_company_window(db, empresa_id, assignment)
        db.flush()
        return assignment

    @staticmethod
    def run_license_housekeeping_for_company(db: Session, empresa_id: int, *, today: date | None = None, commit: bool = True) -> dict:
        reference = today or date.today()
        now = datetime.now(timezone.utc)
        assignments = (
            db.query(EmpresaLicencia)
            .join(Licencia, Licencia.id == EmpresaLicencia.licencia_id)
            .filter(EmpresaLicencia.empresa_id == empresa_id, EmpresaLicencia.activa == True)
            .order_by(EmpresaLicencia.starts_at.asc(), EmpresaLicencia.id.asc())
            .all()
        )

        changed = {"expired": 0, "activated": 0}
        current_active: EmpresaLicencia | None = None

        for assignment in assignments:
            is_express = bool(getattr(assignment.licencia, "is_default_express", False))
            if assignment.status == "active":
                if assignment.ends_at and assignment.ends_at < reference and not is_express:
                    assignment.status = "expired"
                    assignment.expired_at = assignment.expired_at or now
                    assignment.grace_ends_at = assignment.grace_ends_at or (assignment.ends_at + timedelta(days=LICENSE_GRACE_DAYS))
                    assignment.read_only_mode = True
                    db.add(assignment)
                    changed["expired"] += 1
                    LicenseService._log_event(
                        db,
                        empresa_id=empresa_id,
                        empresa_licencia_id=assignment.id,
                        licencia_id=assignment.licencia_id,
                        event_type="license_expired",
                        payload={
                            "ends_at": assignment.ends_at.isoformat() if assignment.ends_at else None,
                            "grace_ends_at": assignment.grace_ends_at.isoformat() if assignment.grace_ends_at else None,
                        },
                    )
                elif assignment.starts_at <= reference and (assignment.ends_at is None or assignment.ends_at >= reference):
                    current_active = assignment

        if not current_active:
            queued = (
                db.query(EmpresaLicencia)
                .filter(
                    EmpresaLicencia.empresa_id == empresa_id,
                    EmpresaLicencia.activa == True,
                    EmpresaLicencia.status == "queued",
                    EmpresaLicencia.starts_at <= reference,
                )
                .order_by(EmpresaLicencia.starts_at.asc(), EmpresaLicencia.id.asc())
                .first()
            )
            if queued:
                queued.status = "active"
                queued.activated_at = queued.activated_at or now
                queued.payment_confirmed_at = queued.payment_confirmed_at or now
                queued.read_only_mode = False
                db.add(queued)
                current_active = queued
                changed["activated"] += 1
                LicenseService._log_event(
                    db,
                    empresa_id=empresa_id,
                    empresa_licencia_id=queued.id,
                    licencia_id=queued.licencia_id,
                    event_type="license_activated",
                    payload={"starts_at": queued.starts_at.isoformat()},
                )

        has_non_express_history = any(not bool(getattr(item.licencia, "is_default_express", False)) for item in assignments)
        if not current_active and not has_non_express_history:
            current_active = LicenseService.ensure_company_express_assignment(db, empresa_id)

        LicenseService._sync_legacy_company_window(db, empresa_id, current_active)
        if commit:
            db.commit()
        else:
            db.flush()
        return changed

    @staticmethod
    def run_license_housekeeping_for_all_companies(
        db: Session,
        *,
        today: date | None = None,
        commit: bool = True,
    ) -> dict:
        reference = today or date.today()
        empresa_ids = [row[0] for row in db.query(Empresa.id).order_by(Empresa.id.asc()).all()]

        items: list[dict] = []
        totals = {
            "companies_processed": 0,
            "companies_changed": 0,
            "expired": 0,
            "activated": 0,
        }

        for empresa_id in empresa_ids:
            changed = LicenseService.run_license_housekeeping_for_company(
                db,
                empresa_id,
                today=reference,
                commit=False,
            )
            totals["companies_processed"] += 1
            totals["expired"] += int(changed.get("expired", 0) or 0)
            totals["activated"] += int(changed.get("activated", 0) or 0)
            if (changed.get("expired", 0) or 0) > 0 or (changed.get("activated", 0) or 0) > 0:
                totals["companies_changed"] += 1
                items.append(
                    {
                        "empresa_id": empresa_id,
                        "expired": int(changed.get("expired", 0) or 0),
                        "activated": int(changed.get("activated", 0) or 0),
                    }
                )

        if commit:
            db.commit()
        else:
            db.flush()

        return {
            "run_date": reference.isoformat(),
            "totals": totals,
            "items": items,
        }

    @staticmethod
    def get_company_license_snapshot(
        db: Session,
        empresa_id: int,
        *,
        today: date | None = None,
        run_housekeeping: bool = False,
    ) -> dict:
        reference = today or date.today()
        if run_housekeeping:
            LicenseService.run_license_housekeeping_for_company(
                db,
                empresa_id,
                today=reference,
                commit=False,
            )

        current_assignment = (
            db.query(EmpresaLicencia)
            .join(Licencia, Licencia.id == EmpresaLicencia.licencia_id)
            .filter(
                EmpresaLicencia.empresa_id == empresa_id,
                EmpresaLicencia.activa == True,
                EmpresaLicencia.status == "active",
                EmpresaLicencia.starts_at <= reference,
            )
            .filter((EmpresaLicencia.ends_at == None) | (EmpresaLicencia.ends_at >= reference) | (Licencia.is_default_express == True))
            .order_by(EmpresaLicencia.starts_at.desc(), EmpresaLicencia.id.desc())
            .first()
        )
        next_assignment = (
            db.query(EmpresaLicencia)
            .join(Licencia, Licencia.id == EmpresaLicencia.licencia_id)
            .filter(
                EmpresaLicencia.empresa_id == empresa_id,
                EmpresaLicencia.activa == True,
                EmpresaLicencia.status == "queued",
                EmpresaLicencia.starts_at > reference,
            )
            .order_by(EmpresaLicencia.starts_at.asc(), EmpresaLicencia.id.asc())
            .first()
        )
        last_expired = (
            db.query(EmpresaLicencia)
            .join(Licencia, Licencia.id == EmpresaLicencia.licencia_id)
            .filter(
                EmpresaLicencia.empresa_id == empresa_id,
                EmpresaLicencia.activa == True,
                EmpresaLicencia.status == "expired",
                Licencia.is_default_express == False,
            )
            .order_by(EmpresaLicencia.ends_at.desc().nullslast(), EmpresaLicencia.id.desc())
            .first()
        )

        license_status = "active"
        access_mode = "full"
        grace_days_remaining = 0
        banner_message = None

        if current_assignment:
            if current_assignment.ends_at:
                days_remaining = (current_assignment.ends_at - reference).days
                if 0 <= days_remaining <= 7:
                    banner_message = f"La licencia actual vence el {current_assignment.ends_at.strftime('%d/%m/%Y')}."
        elif last_expired and last_expired.grace_ends_at and last_expired.grace_ends_at >= reference:
            license_status = "expired"
            access_mode = "readonly"
            grace_days_remaining = (last_expired.grace_ends_at - reference).days
            banner_message = f"La licencia expiró y la empresa opera en solo lectura hasta el {last_expired.grace_ends_at.strftime('%d/%m/%Y')}."
        elif last_expired:
            license_status = "expired"
            access_mode = "readonly"
            banner_message = "La licencia expiró y la empresa se mantiene en modo solo lectura."
        elif next_assignment:
            license_status = "pending"

        return {
            "license_status": license_status,
            "access_mode": access_mode,
            "grace_days_remaining": max(0, grace_days_remaining),
            "banner_message": banner_message,
            "current_assignment": current_assignment,
            "next_assignment": next_assignment,
            "last_expired_assignment": last_expired,
        }

    @staticmethod
    def assign_license_to_company(
        db: Session,
        *,
        empresa_id: int,
        licencia_id: int,
        months: int = 12,
        actor_usuario_id: int | None = None,
        start_on: date | None = None,
        payment_confirmed_at: datetime | None = None,
        notes: str | None = None,
        force_immediate: bool = False,
        source: str = "manual_admin",
    ) -> EmpresaLicencia:
        reference = start_on or date.today()
        LicenseService.ensure_default_catalog(db)
        LicenseService.run_license_housekeeping_for_company(db, empresa_id, today=reference, commit=False)

        target_license = db.query(Licencia).filter(Licencia.id == licencia_id, Licencia.activo == True).first()
        if not target_license:
            raise HTTPException(status_code=404, detail="Licencia destino no encontrada.")

        current_snapshot = LicenseService.get_company_license_snapshot(
            db,
            empresa_id,
            today=reference,
            run_housekeeping=True,
        )
        current_assignment = current_snapshot["current_assignment"]
        current_license = current_assignment.licencia if current_assignment else None

        queue_anchor = (
            db.query(EmpresaLicencia)
            .filter(
                EmpresaLicencia.empresa_id == empresa_id,
                EmpresaLicencia.activa == True,
                EmpresaLicencia.status.in_(["active", "queued"]),
            )
            .order_by(EmpresaLicencia.ends_at.desc().nullslast(), EmpresaLicencia.starts_at.desc(), EmpresaLicencia.id.desc())
            .first()
        )

        starts_at = reference
        queued_from_assignment_id = None
        target_status = "active"
        is_current_express = bool(current_license and getattr(current_license, "is_default_express", False))

        if current_assignment and not force_immediate and not is_current_express:
            anchor_end = queue_anchor.ends_at if queue_anchor and queue_anchor.ends_at else current_assignment.ends_at
            if anchor_end and anchor_end >= reference:
                starts_at = anchor_end + timedelta(days=1)
                queued_from_assignment_id = queue_anchor.id if queue_anchor else current_assignment.id
                target_status = "queued"
        elif queue_anchor and queue_anchor.status == "queued" and queue_anchor.ends_at and queue_anchor.ends_at >= reference:
            starts_at = queue_anchor.ends_at + timedelta(days=1)
            queued_from_assignment_id = queue_anchor.id
            target_status = "queued"

        if is_current_express and not bool(target_license.is_default_express):
            current_assignment.activa = False
            current_assignment.status = "cancelled"
            db.add(current_assignment)
            starts_at = reference
            queued_from_assignment_id = current_assignment.id
            target_status = "active"

        ends_at = LicenseService._build_assignment_end(starts_at, months)
        new_assignment = EmpresaLicencia(
            empresa_id=empresa_id,
            licencia_id=target_license.id,
            starts_at=starts_at,
            ends_at=ends_at,
            status=target_status,
            source=source,
            activated_at=datetime.now(timezone.utc) if target_status == "active" else None,
            payment_confirmed_at=payment_confirmed_at or (datetime.now(timezone.utc) if target_status == "active" else None),
            grace_ends_at=ends_at + timedelta(days=LICENSE_GRACE_DAYS),
            queued_from_assignment_id=queued_from_assignment_id,
            read_only_mode=False,
            activa=True,
            detalles={"months": int(months or 0), "notes": notes} if notes else {"months": int(months or 0)},
        )
        db.add(new_assignment)
        db.flush()

        LicenseService._log_event(
            db,
            empresa_id=empresa_id,
            empresa_licencia_id=new_assignment.id,
            licencia_id=target_license.id,
            actor_usuario_id=actor_usuario_id,
            event_type="license_assignment_created",
            notes=notes,
            payload={
                "starts_at": starts_at.isoformat(),
                "ends_at": ends_at.isoformat(),
                "status": target_status,
                "source": source,
            },
        )

        if current_license and current_license.id != target_license.id:
            LicenseService._log_event(
                db,
                empresa_id=empresa_id,
                empresa_licencia_id=new_assignment.id,
                licencia_id=target_license.id,
                actor_usuario_id=actor_usuario_id,
                event_type="license_plan_change_registered",
                payload={
                    "from_license_id": current_license.id,
                    "from_license_name": current_license.nombre,
                    "to_license_id": target_license.id,
                    "to_license_name": target_license.nombre,
                    "activation_mode": target_status,
                },
            )

        if (
            not bool(target_license.is_default_express)
            and (payment_confirmed_at is not None or source == "marketplace_order")
        ):
            from app.services.license_notifications import license_notification_service

            queued_notifications = license_notification_service.queue_paid_license_welcome(
                db,
                new_assignment,
                licencia=target_license,
                actor_usuario_id=actor_usuario_id,
            )
            if queued_notifications:
                LicenseService._log_event(
                    db,
                    empresa_id=empresa_id,
                    empresa_licencia_id=new_assignment.id,
                    licencia_id=target_license.id,
                    actor_usuario_id=actor_usuario_id,
                    event_type="license_welcome_notifications_queued",
                    payload={
                        "notification_event_ids": [event.id for event in queued_notifications],
                        "channels": sorted({event.channel for event in queued_notifications}),
                    },
                )

        LicenseService.run_license_housekeeping_for_company(db, empresa_id, today=reference, commit=False)
        db.commit()
        db.refresh(new_assignment)
        return new_assignment

    @staticmethod
    def get_company_license_limits(db: Session, empresa_id: int) -> dict:
        try:
            licencia = LicenseService.get_company_license(db, empresa_id)
            if not licencia or not isinstance(licencia.limites, dict):
                return {}
            limits = dict(licencia.limites)
            total_users = limits.get("usuarios", 1)
            plan_key = ((licencia.plan_kind or licencia.codigo or licencia.nombre or "")).strip().lower()

            if "administradores" not in limits:
                if total_users == -1:
                    limits["administradores"] = -1
                elif plan_key in {"profesional", "professional"}:
                    limits["administradores"] = min(2, int(total_users or 1))
                elif plan_key in {"empresarial", "enterprise"}:
                    limits["administradores"] = min(3, int(total_users or 1))
                else:
                    limits["administradores"] = 1

            if "usuarios_normales" not in limits:
                if total_users == -1 or limits.get("administradores") == -1:
                    limits["usuarios_normales"] = -1
                else:
                    limits["usuarios_normales"] = max(0, int(total_users or 0) - int(limits.get("administradores") or 0))

            return limits
        except (ProgrammingError, OperationalError) as exc:
            if not _is_legacy_license_schema_error(exc):
                raise
            db.rollback()
            return {}

    @staticmethod
    def get_company_special_flags(db: Session, empresa_id: int) -> dict:
        limites = LicenseService.get_company_license_limits(db, empresa_id)
        is_academic = bool(limites.get("is_academic", False))
        is_training = bool(limites.get("is_training", False))
        return {
            "is_tester": bool(limites.get("is_tester", False)),
            "is_academic": is_academic,
            "is_training": is_training,
            "is_commercial": bool(limites.get("is_commercial", not (is_academic or is_training))),
        }

    @staticmethod
    def can_use_experimental_features(db: Session, empresa_id: int) -> bool:
        return LicenseService.get_company_special_flags(db, empresa_id)["is_tester"]

    @staticmethod
    def ensure_commercial_exports_allowed(db: Session, empresa_id: int) -> None:
        flags = LicenseService.get_company_special_flags(db, empresa_id)
        if flags["is_commercial"]:
            return
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="La licencia activa de su empresa no permite exportaciones comerciales.",
        )

    @staticmethod
    def requires_periodic_cleanup(db: Session, empresa_id: int) -> bool:
        limits = LicenseService.get_company_license_limits(db, empresa_id)
        flags = LicenseService.get_company_special_flags(db, empresa_id)
        return bool(flags["is_training"] and limits.get("reset_periodical", False))

    @staticmethod
    def run_periodic_cleanup(db: Session, empresa_id: int) -> dict:
        if not LicenseService.requires_periodic_cleanup(db, empresa_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La empresa no tiene una licencia Academy con limpieza periódica habilitada.",
            )

        active_bases_cleared = db.query(BaseTrabajo).filter(
            BaseTrabajo.empresa_id == empresa_id,
            BaseTrabajo.activa == True,
        ).update({"activa": False})

        active_sessions_cleared = db.query(Usuario).filter(
            Usuario.empresa_id == empresa_id,
        ).filter(
            (Usuario.current_session_id.isnot(None))
            | (Usuario.current_session_started_at.isnot(None))
            | (Usuario.current_session_expires_at.isnot(None))
            | (Usuario.current_session_device_id.isnot(None))
        ).update(
            {
                "current_session_id": None,
                "current_session_started_at": None,
                "current_session_expires_at": None,
                "current_session_device_id": None,
            },
            synchronize_session=False,
        )

        db.commit()
        uso = LicenseService.update_usage_metrics(db, empresa_id)

        return {
            "empresa_id": empresa_id,
            "active_bases_cleared": int(active_bases_cleared or 0),
            "active_sessions_cleared": int(active_sessions_cleared or 0),
            "usage_recalculated": True,
            "usuarios_count": int(uso.usuarios_count or 0),
            "proyectos_count": int(uso.proyectos_count or 0),
        }

    @staticmethod
    def run_periodic_cleanup_for_all_training_companies(db: Session) -> list[dict]:
        assignments = db.query(EmpresaLicencia).filter(EmpresaLicencia.activa == True).all()
        target_company_ids = []
        for assignment in assignments:
            limites = assignment.licencia.limites if assignment.licencia and isinstance(assignment.licencia.limites, dict) else {}
            if limites.get("is_training") and limites.get("reset_periodical"):
                target_company_ids.append(assignment.empresa_id)

        results = []
        for empresa_id in sorted(set(target_company_ids)):
            results.append(LicenseService.run_periodic_cleanup(db, empresa_id))
        return results

    @staticmethod
    def get_company_license(db: Session, empresa_id: int) -> Licencia | None:
        """Obtiene la licencia activa actual de la empresa."""
        try:
            assignment = LicenseService.get_company_license_assignment(db, empresa_id)
            if assignment:
                return assignment.licencia
            return None
        except (ProgrammingError, OperationalError) as exc:
            if not _is_legacy_license_schema_error(exc):
                raise
            db.rollback()
            return None

    @staticmethod
    def get_company_license_assignment(db: Session, empresa_id: int) -> EmpresaLicencia | None:
        """Obtiene la asignación de licencia activa actual de la empresa."""
        today = date.today()
        try:
            LicenseService.ensure_default_catalog(db)
            LicenseService.run_license_housekeeping_for_company(db, empresa_id, today=today, commit=False)
            return (
                db.query(EmpresaLicencia)
                .join(Licencia, Licencia.id == EmpresaLicencia.licencia_id)
                .filter(
                    EmpresaLicencia.empresa_id == empresa_id,
                    EmpresaLicencia.activa == True,
                    EmpresaLicencia.status == "active",
                    EmpresaLicencia.starts_at <= today,
                )
                .filter((EmpresaLicencia.ends_at == None) | (EmpresaLicencia.ends_at >= today) | (Licencia.is_default_express == True))
                .order_by(EmpresaLicencia.starts_at.desc(), EmpresaLicencia.id.desc())
                .first()
            )
        except (ProgrammingError, OperationalError) as exc:
            if not _is_legacy_license_schema_error(exc):
                raise
            db.rollback()
            return None

    @staticmethod
    def calculate_storage_usage(db: Session, empresa_id: int) -> int:
        """
        Calcula el uso de almacenamiento en bytes para una empresa.
        Politica actual:
        - almacenamiento aproximado consumido por los datos de la empresa en BD
        - mas el peso de adjuntos activos usados en Comunidad
        """
        db_bytes = 0
        for model, query in _company_scoped_queries(db, empresa_id):
            db_bytes += _estimate_query_storage_bytes(query, model)

        community_attachment_bytes = db.query(
            func.coalesce(func.sum(CommunityAttachment.size_bytes), 0)
        ).filter(
            CommunityAttachment.target_empresa_id == empresa_id,
            CommunityAttachment.deleted_at.is_(None),
        ).scalar() or 0

        return int(db_bytes + int(community_attachment_bytes))

    @staticmethod
    def update_usage_metrics(db: Session, empresa_id: int):
        """Calcula y actualiza las métricas de uso en la tabla EmpresaUso."""
        try:
            # 1. Contar usuarios
            users_count = db.query(Usuario).filter(Usuario.empresa_id == empresa_id, Usuario.rol.ilike("superadministrador") == False).count()
            
            # 2. Contar proyectos (solo raíces - Revisión 0)
            projects_count = db.query(Proyecto).filter(
                Proyecto.empresa_id == empresa_id, 
                Proyecto.revision == 0
            ).count()
            
            # 3. Calcular almacenamiento
            storage_bytes = LicenseService.calculate_storage_usage(db, empresa_id)
            
            # Obtener o crear registro de uso
            uso = db.query(EmpresaUso).filter(EmpresaUso.empresa_id == empresa_id).first()
            
            # Obtener límites de la licencia para denormalizar
            licencia = LicenseService.get_company_license(db, empresa_id)
            if not licencia:
                # Si no hay licencia, usamos límites de seguridad (mínimos)
                max_u, max_p, max_s = 1, 3, 500 * 1024 * 1024
            else:
                limites = LicenseService.get_company_license_limits(db, empresa_id)
                max_u = limites.get("usuarios", 1)
                max_p = limites.get("proyectos", 3)
                max_s = limites.get("almacenamiento_gb", 0.5) * 1024 * 1024 * 1024
                
            if not uso:
                uso = EmpresaUso(
                    empresa_id=empresa_id,
                    usuarios_count=users_count,
                    proyectos_count=projects_count,
                    almacenamiento_bytes=storage_bytes,
                    max_usuarios=max_u,
                    max_proyectos=max_p,
                    max_almacenamiento_bytes=int(max_s)
                )
                db.add(uso)
            else:
                uso.usuarios_count = users_count
                uso.proyectos_count = projects_count
                uso.almacenamiento_bytes = storage_bytes
                uso.max_usuarios = max_u
                uso.max_proyectos = max_p
                uso.max_almacenamiento_bytes = int(max_s)
                
            db.commit()
            return uso
        except (ProgrammingError, OperationalError) as exc:
            if not _is_legacy_license_schema_error(exc):
                raise
            db.rollback()
            # Fallback mínimo seguro para bases sin esquema SaaS nuevo
            users_count = db.query(Usuario).filter(Usuario.empresa_id == empresa_id, Usuario.rol.ilike("superadministrador") == False).count()
            projects_count = db.query(Proyecto).filter(Proyecto.empresa_id == empresa_id, Proyecto.revision == 0).count()
            storage_bytes = LicenseService.calculate_storage_usage(db, empresa_id)
            uso = db.query(EmpresaUso).filter(EmpresaUso.empresa_id == empresa_id).first()
            if not uso:
                uso = EmpresaUso(
                    empresa_id=empresa_id,
                    usuarios_count=users_count,
                    proyectos_count=projects_count,
                    almacenamiento_bytes=storage_bytes,
                    max_usuarios=1,
                    max_proyectos=3,
                    max_almacenamiento_bytes=int(0.5 * 1024 * 1024 * 1024),
                )
                db.add(uso)
            else:
                uso.usuarios_count = users_count
                uso.proyectos_count = projects_count
                uso.almacenamiento_bytes = storage_bytes
                uso.max_usuarios = uso.max_usuarios or 1
                uso.max_proyectos = uso.max_proyectos or 3
                uso.max_almacenamiento_bytes = uso.max_almacenamiento_bytes or int(0.5 * 1024 * 1024 * 1024)
            db.commit()
            return uso

    @staticmethod
    def check_limit(db: Session, empresa_id: int, resource_type: str):
        """
        Valida si una empresa puede consumir más de un recurso.
        Tipos: 'usuarios', 'proyectos', 'almacenamiento'
        """
        uso = db.query(EmpresaUso).filter(EmpresaUso.empresa_id == empresa_id).first()
        if not uso:
            # Forzar actualización si no existe
            uso = LicenseService.update_usage_metrics(db, empresa_id)
            
        if resource_type == "usuarios":
            if uso.usuarios_count >= uso.max_usuarios and uso.max_usuarios != -1:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Límite de usuarios alcanzado ({uso.max_usuarios}). Mejore su plan de licencia."
                )
        elif resource_type == "proyectos":
            if uso.proyectos_count >= uso.max_proyectos and uso.max_proyectos != -1:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Límite de proyectos alcanzado ({uso.max_proyectos}). Mejore su plan de licencia."
                )
        # El almacenamiento suele validarse antes de subidas pesadas o en inserciones masivas

license_service = LicenseService()
