import re
import unicodedata
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from datetime import datetime, timezone
from app.models.recurso import Recurso, CategoriaRecurso
from app.models.empresa import Empresa
from app.models.unidad import Unidad
from app.models.codcpc import CodCPC
from app.models.subcategoria_item import SubcategoriaItem
from app.models.apu import APULinea
from app.models.base_trabajo import BaseTrabajo
from app.schemas.recurso import RecursoCreate, RecursoUpdate, RecursoImportItem
from app.services.apu import update_apu_operational_price
from app.core.rounding import round_decimal
from app.core.text_formatting import normalize_sentence_case, normalize_uppercase_label
from decimal import Decimal

class RecursoService:
    VALID_EQUIPMENT_OWNERSHIP_KINDS = {"owned", "rented"}
    VALID_GOVERNING_RESOURCE_KINDS = {
        "equipo_maquinaria",
        "herramientas",
        "mano_obra_especializada",
        "mano_obra_semiespecializada",
        "mano_obra_no_especializada",
        "materiales",
        "transporte",
    }
    GOVERNING_KINDS_BY_CATEGORY = {
        1: {"equipo_maquinaria", "herramientas"},
        2: {"materiales"},
        3: {"transporte"},
        4: {
            "mano_obra_especializada",
            "mano_obra_semiespecializada",
            "mano_obra_no_especializada",
        },
    }

    def _build_sync_metadata(self, db: Session, base_id: int, source_recurso_id: Optional[int] = None) -> Dict[str, object]:
        base = db.query(BaseTrabajo.id, BaseTrabajo.source_base_id).filter(BaseTrabajo.id == base_id).first()
        now = datetime.now(timezone.utc)
        if source_recurso_id:
            return {
                "source_recurso_id": source_recurso_id,
                "content_origin": "inherited",
                "sync_status": "synced",
                "last_sync_at": now,
            }
        if base and getattr(base, "source_base_id", None):
            return {
                "source_recurso_id": None,
                "content_origin": "local",
                "sync_status": "local_only",
                "last_sync_at": None,
            }
        return {
            "source_recurso_id": None,
            "content_origin": "native",
            "sync_status": "not_applicable",
            "last_sync_at": None,
        }

    def _company_uses_omniclass(self, db: Session, empresa_id: int) -> bool:
        empresa = db.query(Empresa.id, Empresa.use_omniclass).filter(Empresa.id == empresa_id).first()
        return bool(getattr(empresa, "use_omniclass", True)) if empresa else True

    def _strip_omniclass_from_payload(self, payload) -> None:
        if hasattr(payload, "omniclass_codigo"):
            payload.omniclass_codigo = None
        if hasattr(payload, "omniclass_titulo"):
            payload.omniclass_titulo = None

    def _normalize_text(self, text: str) -> str:
        """Elimina acentos y convierte a minúsculas para comparaciones precisas."""
        if not text: return ""
        text = text.lower().strip()
        text = "".join(c for c in unicodedata.normalize('NFD', text)
                      if unicodedata.category(c) != 'Mn')
        return text

    def _normalize_equipment_ownership_kind(self, value: Optional[str]) -> Optional[str]:
        normalized = str(value or "").strip().lower()
        if not normalized:
            return None
        if normalized not in self.VALID_EQUIPMENT_OWNERSHIP_KINDS:
            raise ValueError("`equipment_ownership_kind` debe ser `owned` o `rented`.")
        return normalized

    def _infer_default_governing_resource_kind(
        self,
        subcat: Optional[SubcategoriaItem],
        resource_description: Optional[str] = None,
    ) -> Optional[str]:
        try:
            category_code = int(getattr(subcat, "subcategoria_codigo", 0) or 0)
        except Exception:
            category_code = 0
        if category_code == 1:
            normalized_description = self._normalize_text(resource_description or "")
            return "herramientas" if "herramient" in normalized_description else "equipo_maquinaria"
        if category_code == 2:
            return "materiales"
        if category_code == 3:
            return "transporte"
        if category_code == 4:
            return "mano_obra_no_especializada"
        return None

    def _normalize_governing_resource_kind(
        self,
        raw_value: Optional[str],
        subcat: Optional[SubcategoriaItem],
        resource_description: Optional[str] = None,
    ) -> Optional[str]:
        normalized = str(raw_value or "").strip().lower()
        if not normalized:
            return self._infer_default_governing_resource_kind(subcat, resource_description)
        if normalized not in self.VALID_GOVERNING_RESOURCE_KINDS:
            raise ValueError("`governing_resource_kind` no es válido para la lógica clásica de recurso gobernante.")
        try:
            category_code = int(getattr(subcat, "subcategoria_codigo", 0) or 0)
        except Exception:
            category_code = 0
        allowed_values = self.GOVERNING_KINDS_BY_CATEGORY.get(category_code, set())
        if allowed_values and normalized not in allowed_values:
            raise ValueError("`governing_resource_kind` no coincide con la categoría principal del recurso.")
        return normalized

    def _normalize_equipment_ownership_for_subcategoria(
        self,
        raw_value: Optional[str],
        subcat: Optional[SubcategoriaItem],
    ) -> Optional[str]:
        normalized = self._normalize_equipment_ownership_kind(raw_value)
        try:
            category_code = int(getattr(subcat, "subcategoria_codigo", 0) or 0)
        except Exception:
            category_code = 0
        if category_code != 1:
            return None
        return normalized

    def _ensure_valid_resource_subcategoria(self, db: Session, subcategoria_item_id: int, base_id: int) -> SubcategoriaItem:
        subcat = db.query(SubcategoriaItem).filter(SubcategoriaItem.id == subcategoria_item_id).first()
        
        if not subcat or subcat.base_trabajo_id != base_id:
            subcat = db.query(SubcategoriaItem).filter(
                SubcategoriaItem.base_trabajo_id == base_id,
                SubcategoriaItem.descripcion == "General"
            ).first()
            
            if not subcat:
                subcat = db.query(SubcategoriaItem).filter(SubcategoriaItem.base_trabajo_id == base_id).first()
                
            if not subcat:
                raise ValueError("No se encontró una subcategoría válida para los recursos.")

        if subcat.subcategoria_codigo == 5:
            raise ValueError(
                "No se pueden crear ni importar recursos en subcategorías de la categoría principal APU. "
                "Esos elementos se generan desde el flujo propio de Análisis de Precios Unitarios."
            )
        return subcat

    def _generate_code(self, db: Session, subcategoria_item_id: int, base_id: int) -> str:
        """Genera código en formato C-SSSS-RRRRR"""
        subcat = db.query(SubcategoriaItem).filter(SubcategoriaItem.id == subcategoria_item_id).first()
        if not subcat:
            raise ValueError("Subcategoría no encontrada")
            
        parts = subcat.codigo.split("-")
        cat = parts[0]
        subcat_code = parts[1]
        
        if subcat_code.isdigit():
            subcat_code = subcat_code.zfill(4)
        elif len(parts) > 2:
            subcat_code = "-".join(parts[1:])
        
        last_recurso = db.query(Recurso).filter(
            Recurso.subcategoria_item_id == subcategoria_item_id
        ).order_by(Recurso.id.desc()).first()
        
        serial = 1
        if last_recurso:
            try:
                last_serial = int(last_recurso.codigo.split("-")[-1])
                serial = last_serial + 1
            except (ValueError, IndexError):
                count = db.query(Recurso).filter(Recurso.subcategoria_item_id == subcategoria_item_id).count()
                serial = count + 1
            
        return f"{cat}-{subcat_code}-{str(serial).zfill(5)}"

    def get_recurso(self, db: Session, recurso_id: int) -> Optional[Recurso]:
        from app.repositories.recurso import recurso_repo
        return recurso_repo.get_by_id(db, recurso_id)

    def create_recurso(self, db: Session, obj_in: RecursoCreate, base_trabajo_id: int, empresa_id: int, revision: int = 0) -> Recurso:
        use_omniclass = self._company_uses_omniclass(db, empresa_id)
        if not use_omniclass:
            self._strip_omniclass_from_payload(obj_in)
        subcat = self._ensure_valid_resource_subcategoria(db, obj_in.subcategoria_item_id, base_trabajo_id)
        obj_in.equipment_ownership_kind = self._normalize_equipment_ownership_for_subcategoria(
            getattr(obj_in, "equipment_ownership_kind", None),
            subcat,
        )
        obj_in.governing_resource_kind = self._normalize_governing_resource_kind(
            getattr(obj_in, "governing_resource_kind", None),
            subcat,
            getattr(obj_in, "descripcion", None),
        )
        obj_in.descripcion = normalize_sentence_case(obj_in.descripcion)
        norm_desc = self._normalize_text(obj_in.descripcion)
        
        existing = db.query(Recurso).filter(
            Recurso.descripcion_normalizada == norm_desc,
            Recurso.empresa_id == empresa_id,
            Recurso.base_trabajo_id == base_trabajo_id,
            Recurso.revision == revision
        ).first()
        
        if existing:
            raise ValueError(f"Ya existe un recurso con la descripción '{obj_in.descripcion}' en esta base de trabajo.")

        empresa = db.query(Empresa).filter(Empresa.id == empresa_id).first()
        dec_moneda = empresa.decimales_moneda if empresa else 2
        dec_calculos = empresa.decimales_calculos if empresa else 4
        
        if obj_in.precio is not None:
            obj_in.precio = round_decimal(Decimal(str(obj_in.precio)), dec_moneda)

        from app.repositories.recurso import recurso_repo
        db_obj = recurso_repo.create(
            db, 
            obj_in=obj_in, 
            empresa_id=empresa_id,
            base_trabajo_id=base_trabajo_id,
            descripcion_normalizada=norm_desc,
            codigo=self._generate_code(db, subcat.id, base_trabajo_id),
            **self._build_sync_metadata(db, base_trabajo_id)
        )
        
        # Inherit OmniClass from SubcategoriaItem if not provided in obj_in
        if use_omniclass and not db_obj.omniclass_codigo and subcat.omniclass_codigo:
            db_obj.omniclass_codigo = subcat.omniclass_codigo
            db_obj.omniclass_titulo = subcat.omniclass_titulo

        db_obj.revision = revision
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update_recurso(self, db: Session, recurso_id: int, obj_in: RecursoUpdate) -> Recurso:
        from app.repositories.recurso import recurso_repo
        db_obj = recurso_repo.get_by_id(db, recurso_id)
        if not db_obj: return None
        use_omniclass = self._company_uses_omniclass(db, db_obj.empresa_id)
        if not use_omniclass:
            self._strip_omniclass_from_payload(obj_in)
        
        update_data = obj_in.model_dump(exclude_unset=True)
        clear_cod_cpc = bool(update_data.pop("clear_cod_cpc", False))
        if "cod_cpc_id" in update_data and update_data.get("cod_cpc_id") is None and not clear_cod_cpc:
            update_data.pop("cod_cpc_id", None)
        if "equipment_ownership_kind" in update_data:
            current_subcat = db.query(SubcategoriaItem).filter(SubcategoriaItem.id == db_obj.subcategoria_item_id).first()
            update_data["equipment_ownership_kind"] = self._normalize_equipment_ownership_for_subcategoria(
                update_data.get("equipment_ownership_kind"),
                current_subcat,
            )
        if "governing_resource_kind" in update_data:
            current_subcat = db.query(SubcategoriaItem).filter(SubcategoriaItem.id == db_obj.subcategoria_item_id).first()
            resource_description = update_data.get("descripcion") or db_obj.descripcion
            update_data["governing_resource_kind"] = self._normalize_governing_resource_kind(
                update_data.get("governing_resource_kind"),
                current_subcat,
                resource_description,
            )
        
        if "precio" in update_data and update_data["precio"] is not None:
            empresa = db.query(Empresa).filter(Empresa.id == db_obj.empresa_id).first()
            dec_moneda = empresa.decimales_moneda if empresa else 2
            update_data["precio"] = round_decimal(Decimal(str(update_data["precio"])), dec_moneda)

        if "descripcion" in update_data:
            update_data["descripcion"] = normalize_sentence_case(update_data["descripcion"])
            norm_desc = self._normalize_text(update_data["descripcion"])
            existing = db.query(Recurso).filter(
                Recurso.descripcion_normalizada == norm_desc,
                Recurso.empresa_id == db_obj.empresa_id,
                Recurso.base_trabajo_id == db_obj.base_trabajo_id,
                Recurso.id != recurso_id
            ).first()
            
            if existing:
                raise ValueError(f"Ya existe un recurso con la descripción '{update_data['descripcion']}' en esta base de trabajo.")
            
            update_data["descripcion_normalizada"] = norm_desc
            if db_obj.revisado == False and "-duplicado" not in update_data["descripcion"]:
                update_data["revisado"] = True

        updated_obj = recurso_repo.update(db, db_obj=db_obj, obj_in=update_data)
        base = db.query(BaseTrabajo.id, BaseTrabajo.source_base_id).filter(BaseTrabajo.id == db_obj.base_trabajo_id).first()
        if base and getattr(base, "source_base_id", None):
            if updated_obj.source_recurso_id:
                updated_obj.content_origin = "inherited"
                updated_obj.sync_status = "diverged"
            else:
                updated_obj.content_origin = "local"
                updated_obj.sync_status = "local_only"
            db.add(updated_obj)
            db.flush()
        db.commit()
        db.refresh(updated_obj)

        if "precio" in update_data or "unidad_id" in update_data:
            self._trigger_cascade_for_recurso(db, updated_obj.id)

        return updated_obj

    def _trigger_cascade_for_recurso(self, db: Session, recurso_id: int):
        from app.services.presupuesto import propagate_apu_change_to_presupuestos
        apus_directos = db.query(APULinea.apu_id).filter(APULinea.recurso_id == recurso_id).distinct().all()
        for (apu_id,) in apus_directos:
            update_apu_operational_price(db, apu_id)
            propagate_apu_change_to_presupuestos(db, apu_id)

    def bulk_assign_cpc(self, db: Session, recurso_ids: list[int], cod_cpc_id: int, empresa_id: int) -> list[int]:
        if not recurso_ids:
            raise ValueError("Debe seleccionar al menos un recurso.")
        unique_ids = list(dict.fromkeys(int(recurso_id) for recurso_id in recurso_ids if recurso_id))
        if not unique_ids:
            raise ValueError("Debe seleccionar al menos un recurso válido.")
        cpc = db.query(CodCPC).filter(CodCPC.id == cod_cpc_id).first()
        if not cpc:
            raise ValueError("El código CPC seleccionado no existe.")
        recursos = (
            db.query(Recurso)
            .filter(Recurso.id.in_(unique_ids), Recurso.empresa_id == empresa_id)
            .all()
        )
        recursos_by_id = {int(recurso.id): recurso for recurso in recursos}
        missing_ids = [recurso_id for recurso_id in unique_ids if recurso_id not in recursos_by_id]
        if missing_ids:
            raise ValueError("Uno o más recursos no existen o no pertenecen a la empresa activa.")

        updated_ids: list[int] = []
        for recurso_id in unique_ids:
            recurso = recursos_by_id[recurso_id]
            if int(recurso.cod_cpc_id or 0) == int(cod_cpc_id):
                continue
            recurso.cod_cpc_id = cod_cpc_id
            base = db.query(BaseTrabajo.id, BaseTrabajo.source_base_id).filter(BaseTrabajo.id == recurso.base_trabajo_id).first()
            if base and getattr(base, "source_base_id", None):
                if recurso.source_recurso_id:
                    recurso.content_origin = "inherited"
                    recurso.sync_status = "diverged"
                else:
                    recurso.content_origin = "local"
                    recurso.sync_status = "local_only"
            db.add(recurso)
            updated_ids.append(recurso.id)
        db.commit()
        return updated_ids

    def delete_recurso(self, db: Session, recurso_id: int) -> bool:
        from app.repositories.recurso import recurso_repo
        db_obj = recurso_repo.get_by_id(db, recurso_id)
        if not db_obj: return False

        is_used = db.query(APULinea).filter(APULinea.recurso_id == db_obj.id).first()
        if is_used:
            raise ValueError(f"El recurso '{db_obj.descripcion}' no se puede borrar porque está siendo usado en uno o más Análisis de Precios Unitarios (APUs).")

        subcat_id = db_obj.subcategoria_item_id
        recurso_repo.delete(db, db_obj)
        self._fix_codes_inner(db, subcat_id)
        db.commit()
        return True

    def bulk_delete_recursos(self, db: Session, recurso_ids: List[int], empresa_id: int) -> List[int]:
        from app.repositories.recurso import recurso_repo
        unique_ids = list(dict.fromkeys(recurso_ids))
        recursos = db.query(Recurso).filter(
            Recurso.id.in_(unique_ids),
            Recurso.empresa_id == empresa_id
        ).all()

        recurso_map = {recurso.id: recurso for recurso in recursos}
        affected_subcats = set()
        for recurso_id in unique_ids:
            recurso = recurso_map.get(recurso_id)
            if not recurso:
                continue
            is_used = db.query(APULinea).filter(APULinea.recurso_id == recurso.id).first()
            if is_used:
                raise ValueError(f"El recurso '{recurso.descripcion}' no se puede borrar porque está usado en APUs.")
            affected_subcats.add(recurso.subcategoria_item_id)

        for recurso_id in unique_ids:
            if recurso_id in recurso_map:
                recurso_repo.delete(db, recurso_map[recurso_id])

        db.flush()
        for subcat_id in affected_subcats:
            self._fix_codes_inner(db, subcat_id)

        db.commit()
        return unique_ids

    def _fix_codes_inner(self, db: Session, subcategoria_item_id: int):
        items = db.query(Recurso).filter(
            Recurso.subcategoria_item_id == subcategoria_item_id
        ).order_by(Recurso.id).all()
        
        if not items: return
        subcat = db.query(SubcategoriaItem).get(subcategoria_item_id)
        if not subcat: return
        
        parts = subcat.codigo.split("-")
        category_part = parts[0]
        subcat_serial = parts[1].zfill(4)
        prefix = f"{category_part}-{subcat_serial}"
        
        for item in items:
            item.codigo = f"FIX-{item.id}-{subcategoria_item_id}"
        db.flush()
        
        for i, item in enumerate(items, 1):
            item.codigo = f"{prefix}-{str(i).zfill(5)}"
        db.flush()

    def move_recurso(self, db: Session, recurso_id: int, target_subcategoria_item_id: int) -> Optional[Recurso]:
        db_obj = db.query(Recurso).get(recurso_id)
        if not db_obj: return None
        self._ensure_valid_resource_subcategoria(db, target_subcategoria_item_id, db_obj.base_trabajo_id)
        
        old_subcat_id = db_obj.subcategoria_item_id
        db_obj.codigo = f"MOVE-TEMP-{db_obj.id}"
        db_obj.subcategoria_item_id = target_subcategoria_item_id
        db.flush()
        
        self._fix_codes_inner(db, old_subcat_id)
        self._fix_codes_inner(db, target_subcategoria_item_id)
        
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def duplicate_recurso(self, db: Session, recurso_id: int) -> Optional[Recurso]:
        source = db.query(Recurso).get(recurso_id)
        if not source: return None
        return self.copy_to_base(db, recurso_id, source.base_trabajo_id, source.empresa_id)

    def copy_to_base(self, db: Session, recurso_id: int, target_base_id: int, empresa_id: int, revision: int = 0) -> Optional[Recurso]:
        source = db.query(Recurso).get(recurso_id)
        if not source: return None
        
        # Resolver subcategoría en la base destino
        from app.models.subcategoria_item import SubcategoriaItem
        source_subcat = db.query(SubcategoriaItem).get(source.subcategoria_item_id)
        
        target_subcat = db.query(SubcategoriaItem).filter(
            SubcategoriaItem.descripcion == source_subcat.descripcion,
            SubcategoriaItem.subcategoria_codigo == source_subcat.subcategoria_codigo,
            SubcategoriaItem.base_trabajo_id == target_base_id,
            SubcategoriaItem.empresa_id == empresa_id
        ).first()
        
        if not target_subcat:
            # Si no existe, crear la subcategoría en la base destino
            target_subcat = SubcategoriaItem(
                descripcion=normalize_uppercase_label(source_subcat.descripcion),
                codigo=source_subcat.codigo,
                subcategoria_codigo=source_subcat.subcategoria_codigo,
                base_trabajo_id=target_base_id,
                empresa_id=empresa_id,
                revisado=True
            )
            db.add(target_subcat)
            db.flush()

        # Verificar si ya existe un recurso idéntico en la base destino
        norm_desc = source.descripcion_normalizada
        existing = db.query(Recurso).filter(
            Recurso.descripcion_normalizada == norm_desc,
            Recurso.base_trabajo_id == target_base_id,
            Recurso.revision == revision,
            Recurso.empresa_id == empresa_id
        ).first()
        
        if existing:
            return existing

        # Generar nuevo código para la base destino
        new_code = self._generate_code(db, target_subcat.id, target_base_id)
        source_tracking_id = source.id if target_base_id != source.base_trabajo_id else None
        
        db_obj = Recurso(
            codigo=new_code,
            descripcion=normalize_sentence_case(source.descripcion),
            descripcion_normalizada=norm_desc,
            precio=source.precio,
            equipment_ownership_kind=source.equipment_ownership_kind,
            governing_resource_kind=source.governing_resource_kind,
            unidad_id=source.unidad_id,
            cod_cpc_id=source.cod_cpc_id,
            especificaciones=source.especificaciones,
            subcategoria_item_id=target_subcat.id,
            base_trabajo_id=target_base_id,
            revision=revision,
            empresa_id=empresa_id,
            revisado=source.revisado,
            omniclass_codigo=source.omniclass_codigo if self._company_uses_omniclass(db, empresa_id) else None,
            omniclass_titulo=source.omniclass_titulo if self._company_uses_omniclass(db, empresa_id) else None,
            **self._build_sync_metadata(db, target_base_id, source_tracking_id)
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def _generate_unique_description(self, db: Session, base_desc: str, empresa_id: int) -> str:
        base = re.sub(r"-duplicado\d+$", "", base_desc)
        i = 1
        while True:
            candidate = f"{base}-duplicado{i}"
            norm = self._normalize_text(candidate)
            existing = db.query(Recurso).filter(
                Recurso.descripcion_normalizada == norm,
                Recurso.empresa_id == empresa_id
            ).first()
            if not existing:
                return candidate
            i += 1

    def import_recursos(self, db: Session, items: List[RecursoImportItem], base_trabajo_id: int, empresa_id: int, subcategoria_item_id: int, revision: int = 0) -> dict:
        imported = 0
        duplicates = 0
        errors = []
        imported_ids = []
        use_omniclass = self._company_uses_omniclass(db, empresa_id)
        
        try:
            subcat = self._ensure_valid_resource_subcategoria(db, subcategoria_item_id, base_trabajo_id)
        except Exception as e:
            return {"imported": 0, "duplicates": 0, "errors": [str(e)]}
            
        parts = subcat.codigo.split("-")
        cat_codigo = int(parts[0])
        subcat_actual_id = subcat.id

        for item_data in items:
            try:
                norm_desc = self._normalize_text(item_data.descripcion)
                existing = db.query(Recurso).filter(
                    Recurso.descripcion_normalizada == norm_desc,
                    Recurso.empresa_id == empresa_id,
                    Recurso.base_trabajo_id == base_trabajo_id,
                    Recurso.revision == revision
                ).first()
                if existing:
                    duplicates += 1
                    continue

                u_id = item_data.unidad_id
                if not u_id and item_data.unidad_nombre:
                    u_obj = db.query(Unidad).filter(
                        Unidad.descripcion == item_data.unidad_nombre,
                        Unidad.subcategoria_codigo == cat_codigo
                    ).filter(
                        (Unidad.es_global == True) | ((Unidad.empresa_id == empresa_id) & (Unidad.base_trabajo_id == base_trabajo_id))
                    ).first()
                    if u_obj: u_id = u_obj.id
                elif u_id:
                    u_obj = db.query(Unidad).filter(
                        Unidad.id == u_id,
                        Unidad.subcategoria_codigo == cat_codigo
                    ).filter(
                        (Unidad.es_global == True) | ((Unidad.empresa_id == empresa_id) & (Unidad.base_trabajo_id == base_trabajo_id))
                    ).first()
                    if not u_obj:
                        errors.append(f"Unidad inválida para '{item_data.descripcion}'.")
                        continue
                
                if not u_id:
                    u_obj = db.query(Unidad).filter(Unidad.subcategoria_codigo == cat_codigo).order_by(Unidad.id).first()
                    u_id = u_obj.id if u_obj else None

                if not u_id:
                    errors.append(f"No se pudo determinar unidad para: {item_data.descripcion}")
                    continue

                cpc_id = item_data.cod_cpc_id
                if not cpc_id and item_data.cod_cpc_codigo:
                    cpc_obj = db.query(CodCPC).filter(CodCPC.codCPC == item_data.cod_cpc_codigo).first()
                    if cpc_obj: cpc_id = cpc_obj.id

                empresa = db.query(Empresa).filter(Empresa.id == empresa_id).first()
                dec_moneda = empresa.decimales_moneda if empresa else 2
                dec_calculos = empresa.decimales_calculos if empresa else 4
                
                precio_redondeado = round_decimal(Decimal(str(item_data.precio or 0)), dec_moneda)
                normalized_description = normalize_sentence_case(item_data.descripcion)

                db_obj = Recurso(
                    codigo=self._generate_code(db, subcat_actual_id, base_trabajo_id),
                    descripcion=normalized_description,
                    descripcion_normalizada=norm_desc,
                    precio=precio_redondeado,
                    unidad_id=u_id,
                    cod_cpc_id=cpc_id,
                    especificaciones=item_data.especificaciones,
                    subcategoria_item_id=subcat_actual_id,
                    base_trabajo_id=base_trabajo_id,
                    revision=revision,
                    empresa_id=empresa_id,
                    revisado=True,
                    omniclass_codigo=item_data.omniclass_codigo if use_omniclass else None,
                    omniclass_titulo=item_data.omniclass_titulo if use_omniclass else None
                )
                
                # Inherit OmniClass for imported resources if not provided
                if use_omniclass and not db_obj.omniclass_codigo and subcat.omniclass_codigo:
                    db_obj.omniclass_codigo = subcat.omniclass_codigo
                    db_obj.omniclass_titulo = subcat.omniclass_titulo
                    
                db.add(db_obj)
                db.flush()
                imported += 1
                imported_ids.append(db_obj.id)

            except Exception as e:
                errors.append(f"Error en '{item_data.descripcion}': {str(e)}")

        db.commit()
        return {"imported": imported, "duplicates": duplicates, "errors": errors, "imported_ids": imported_ids}

    def export_recursos(self, db: Session, recurso_ids: List[int]) -> str:
        recursos = db.query(Recurso).filter(Recurso.id.in_(recurso_ids)).order_by(Recurso.codigo).all()
        lines = []
        for r in recursos:
            cpc_val = r.cpc.codCPC if r.cpc else ""
            specs = (r.especificaciones or "").replace("\n", " ").replace("\t", " ")
            line = f"{r.codigo}\t{r.descripcion}\t{r.precio}\t{r.unidad.descripcion}\t{cpc_val}\t{specs}"
            lines.append(line)
        return "\n".join(lines)

recurso_service = RecursoService()
