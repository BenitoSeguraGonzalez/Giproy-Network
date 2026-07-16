from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from app.models.apu import APU, APULinea
from app.models.recurso import Recurso
from app.models.unidad import Unidad
from app.models.subcategoria_item import SubcategoriaItem
from app.models.base_trabajo import BaseTrabajo
from app.models.empresa import Empresa
from app.models.presupuesto import Presupuesto, PresupuestoDetalle
from app.schemas.apu import APUCreate, APUUpdate
from app.core.apu_status import normalize_apu_revision_status, is_apu_revision_status_revisado
from app.core.text_formatting import normalize_sentence_case, normalize_uppercase_label
from app.core.unit_normalization import canonicalize_unit_symbol
from decimal import Decimal
from typing import List, Optional, Dict, Tuple
import re
import unicodedata
import string
from datetime import datetime, timezone

def normalize_string(text: str) -> str:
    if not text:
        return ""
    nfkd_form = unicodedata.normalize('NFKD', text)
    text_no_accents = "".join([c for c in nfkd_form if not unicodedata.combining(c)])
    text_clean = text_no_accents.lower().translate(str.maketrans('', '', string.punctuation))
    return " ".join(text_clean.split())

from app.core.calculation_policy import calculate_apu_line_subtotal, as_decimal, round_operational_calc

def calculate_apu_price(db: Session, apu: APU) -> Decimal:
    """Calcula el costo directo de un APU sumando sus líneas con redondeo directo oficial."""
    empresa = db.query(Empresa).filter(Empresa.id == apu.empresa_id).first()
    dec_moneda = empresa.decimales_moneda if empresa else 2
    dec_calculos = empresa.decimales_calculos if empresa else 4

    costo_directo = Decimal("0.0000")
    for linea in sorted(apu.lineas, key=lambda item: ((item.orden or 0), item.id or 0)):
        precio_base = Decimal("0.0000")
        if linea.recurso_id:
            recurso = db.query(Recurso).filter(Recurso.id == linea.recurso_id).first()
            if recurso:
                precio_base = Decimal(str(recurso.precio))
        elif linea.apu_hijo_id:
            hijo = db.query(APU).filter(APU.id == linea.apu_hijo_id).first()
            if hijo:
                # Un APU anidado debe aportar solo costo directo al padre.
                precio_base = Decimal(str(hijo.costo_directo or 0))
        
        cant = as_decimal(linea.cantidad, "0")
        rendimiento_local = as_decimal(linea.rendimiento, "1")
        sub = calculate_apu_line_subtotal(
            unit_price=precio_base,
            quantity=cant,
            rendimiento=rendimiento_local,
            money_decimals=dec_moneda,
            calc_decimals=dec_calculos,
        )

        linea.precio_congelado = precio_base
        linea.subtotal = sub
        costo_directo += sub
        
    apu.costo_directo = costo_directo
    base = db.query(BaseTrabajo).filter(BaseTrabajo.id == apu.base_trabajo_id).first()
    
    if base and base.porcentaje_indirectos:
        porcentaje = Decimal(str(base.porcentaje_indirectos)) / Decimal("100.0")
        costo_ind = round_operational_calc(costo_directo * porcentaje, dec_calculos)
        apu.costo_indirecto = costo_ind
        apu.precio_unitario_total = costo_directo + costo_ind
    else:
        apu.costo_indirecto = Decimal("0.0000")
        apu.precio_unitario_total = costo_directo
    return apu.precio_unitario_total

def update_apu_operational_price(db: Session, apu_id: int, visited: set = None):
    if visited is None:
        visited = set()
    if apu_id in visited:
        return visited
    visited.add(apu_id)
    apu = db.query(APU).filter(APU.id == apu_id).first()
    if not apu:
        return visited
    calculate_apu_price(db, apu)
    db.commit()
    parent_lines = db.query(APULinea).filter(APULinea.apu_hijo_id == apu_id).all()
    parent_ids = {line.apu_id for line in parent_lines}
    for pid in parent_ids:
        update_apu_operational_price(db, pid, visited)
    return visited


def update_apu_price_cascade(db: Session, apu_id: int, visited: set = None):
    update_apu_operational_price(db, apu_id, visited)


def collect_affected_apu_ids(db: Session, apu_id: int, visited: set = None):
    if visited is None:
        visited = set()
    normalized_apu_id = int(apu_id or 0)
    if not normalized_apu_id or normalized_apu_id in visited:
        return visited
    visited.add(normalized_apu_id)

    parent_lines = db.query(APULinea).filter(APULinea.apu_hijo_id == normalized_apu_id).all()
    parent_ids = {int(line.apu_id) for line in parent_lines if line.apu_id}
    for parent_id in parent_ids:
        collect_affected_apu_ids(db, parent_id, visited)
    return visited

def check_circular_reference(db: Session, target_id: int, id_to_find: int, visited: set = None) -> bool:
    if visited is None: visited = set()
    if target_id == id_to_find: return True
    if target_id in visited: return False
    visited.add(target_id)
    lineas_hijas = db.query(APULinea).filter(APULinea.apu_id == target_id, APULinea.apu_hijo_id != None).all()
    for linea in lineas_hijas:
        if check_circular_reference(db, linea.apu_hijo_id, id_to_find, visited):
            return True
    return False

class APUService:
    CATEGORY_ORDER = {1: 0, 2: 1, 3: 2, 4: 3, 5: 4}

    def _build_sync_metadata(self, db: Session, base_id: int, source_apu_id: Optional[int] = None) -> Dict[str, object]:
        base = db.query(BaseTrabajo.id, BaseTrabajo.source_base_id).filter(BaseTrabajo.id == base_id).first()
        now = datetime.now(timezone.utc)
        if source_apu_id:
            return {
                "source_apu_id": source_apu_id,
                "content_origin": "inherited",
                "sync_status": "synced",
                "last_sync_at": now,
            }
        if base and getattr(base, "source_base_id", None):
            return {
                "source_apu_id": None,
                "content_origin": "local",
                "sync_status": "local_only",
                "last_sync_at": None,
            }
        return {
            "source_apu_id": None,
            "content_origin": "native",
            "sync_status": "not_applicable",
            "last_sync_at": None,
        }

    def _build_codigo_prefix(self, db: Session, subcategoria_item_id: Optional[int] = None) -> str:
        prefix = "APU"
        if subcategoria_item_id:
            subcat = db.query(SubcategoriaItem).get(subcategoria_item_id)
            if subcat and subcat.codigo:
                prefix = subcat.codigo
        return prefix

    def _next_code_sequence_start(self, db: Session, base_id: int, empresa_id: int, prefix: str) -> int:
        last_apu = db.query(APU).filter(
            APU.base_trabajo_id == base_id,
            APU.empresa_id == empresa_id,
            APU.codigo.like(f"{prefix}-%")
        ).order_by(APU.codigo.desc()).first()

        if last_apu and last_apu.codigo:
            parts = last_apu.codigo.split('-')
            last_part = parts[-1]
            if last_part.isdigit():
                return int(last_part) + 1
            return (last_apu.id or 0) + 1
        return 1

    def _is_import_eligible_status(self, status: Optional[str]) -> bool:
        return is_apu_revision_status_revisado(status)

    def _company_uses_omniclass(self, db: Session, empresa_id: int) -> bool:
        empresa = db.query(Empresa.id, Empresa.use_omniclass).filter(Empresa.id == empresa_id).first()
        return bool(getattr(empresa, "use_omniclass", True)) if empresa else True

    def _strip_omniclass_from_payload(self, payload) -> None:
        if hasattr(payload, "omniclass_codigo"):
            payload.omniclass_codigo = None
        if hasattr(payload, "omniclass_titulo"):
            payload.omniclass_titulo = None

    def _resolve_linea_category(self, linea: APULinea) -> int:
        if linea.apu_hijo_id:
            return 2
        codigo = (linea.recurso.codigo if linea.recurso and linea.recurso.codigo else "")
        try:
            return int(str(codigo).strip().split("-")[0])
        except (ValueError, IndexError):
            return 1

    def _normalize_lineas_payload_order(self, db: Session, lineas: List[Dict]) -> List[Dict]:
        resource_codes: Dict[int, str] = {}
        recurso_ids = {
            int(linea.get("recurso_id"))
            for linea in lineas
            if linea.get("recurso_id") is not None
        }
        if recurso_ids:
            resource_codes = {
                recurso_id: (codigo or "")
                for recurso_id, codigo in db.query(Recurso.id, Recurso.codigo).filter(Recurso.id.in_(list(recurso_ids))).all()
            }
        enriched: List[Tuple[int, int, Dict]] = []
        for index, linea in enumerate(lineas):
            if linea.get("apu_hijo_id"):
                category = 2
            else:
                recurso_codigo = str(
                    linea.get("recurso_codigo")
                    or linea.get("codigo")
                    or resource_codes.get(int(linea.get("recurso_id") or 0), "")
                )
                try:
                    category = int(recurso_codigo.strip().split("-")[0])
                except (ValueError, IndexError):
                    category = 1
            enriched.append((self.CATEGORY_ORDER.get(category, 99), int(linea.get("orden", index)), linea))

        normalized: List[Dict] = []
        for global_index, (_, __, linea) in enumerate(sorted(enriched, key=lambda item: (item[0], item[1]))):
            normalized_linea = {k: v for k, v in linea.items() if k not in {"recurso_codigo", "codigo"}}
            normalized_linea["orden"] = global_index
            normalized.append(normalized_linea)
        return normalized

    def _ensure_valid_apu_subcategoria(self, db: Session, subcategoria_item_id: Optional[int], base_id: int) -> Optional[SubcategoriaItem]:
        if not subcategoria_item_id:
            return None

        subcat = db.query(SubcategoriaItem).filter(SubcategoriaItem.id == subcategoria_item_id).first()
        if not subcat:
            raise ValueError("La subcategoría seleccionada no existe.")
        if subcat.base_trabajo_id != base_id:
            raise ValueError("La subcategoría seleccionada no pertenece a la base de trabajo activa.")
        return subcat

    def _resolve_apu_unit_symbol(self, db: Session, empresa_id: int, base_id: int, raw_unit: Optional[str]) -> str:
        normalized_unit = canonicalize_unit_symbol(raw_unit)
        if not normalized_unit:
            raise ValueError("La unidad del APU es obligatoria.")

        available_units = db.query(Unidad).filter(
            Unidad.subcategoria_codigo == 5,
            or_(
                Unidad.es_global == True,
                and_(Unidad.empresa_id == empresa_id, Unidad.base_trabajo_id == base_id)
            )
        ).all()

        normalized_complete = str(raw_unit or '').strip().lower()
        for unit in available_units:
            unit_symbol = canonicalize_unit_symbol(unit.descripcion)
            unit_complete = str(unit.descripcion_completa or '').strip().lower()
            if unit_symbol == normalized_unit or (normalized_complete and unit_complete == normalized_complete):
                return unit_symbol

        raise ValueError(
            f"La unidad '{raw_unit}' no existe en el catálogo de unidades APU de la base activa."
        )

    def _ensure_codigo_matches_subcategoria(self, codigo: str, subcat: Optional[SubcategoriaItem]) -> None:
        if not codigo or not subcat or not subcat.codigo:
            return

        code_parts = str(codigo).split("-")
        subcat_parts = str(subcat.codigo).split("-")
        if len(code_parts) < 2 or len(subcat_parts) < 2:
            return

        code_prefix = "-".join(code_parts[:2])
        subcat_prefix = "-".join(subcat_parts[:2])
        if code_prefix != subcat_prefix:
            raise ValueError(
                f"El código APU '{codigo}' no coincide con la subcategoría seleccionada '{subcat.codigo}'."
            )

    def get_apu(self, db: Session, apu_id: int, empresa_id: int) -> Optional[APU]:
        from app.repositories.apu import apu_repo
        return apu_repo.get_by_id(db, apu_id, empresa_id)

    def get_apus_by_ids(self, db: Session, apu_ids: List[int], empresa_id: int) -> List[APU]:
        from app.repositories.apu import apu_repo
        return apu_repo.get_by_ids(db, apu_ids, empresa_id)

    def get_apu_impact_summary(self, db: Session, apu_id: int, empresa_id: int) -> Dict[str, int]:
        apu = self.get_apu(db, apu_id, empresa_id)
        if not apu:
            raise ValueError("APU no encontrado")

        affected_apu_ids = collect_affected_apu_ids(db, apu_id)
        parent_apus_count = max(0, len(affected_apu_ids) - 1)
        affected_presupuestos_count = 0
        if affected_apu_ids:
            affected_presupuestos_count = db.query(Presupuesto.id)\
                .join(PresupuestoDetalle, Presupuesto.id == PresupuestoDetalle.presupuesto_id)\
                .filter(
                    PresupuestoDetalle.apu_id.in_(list(affected_apu_ids)),
                    Presupuesto.estado.in_(["En Elaboración", "Borrador", "Revision"])
                )\
                .distinct()\
                .count()

        return {
            "apu_id": int(apu_id),
            "parent_apus_count": parent_apus_count,
            "affected_apus_count": len(affected_apu_ids),
            "affected_presupuestos_count": affected_presupuestos_count,
        }

    def create_apu(self, db: Session, apu_in: APUCreate, empresa_id: int, revision: int = 0) -> APU:
        use_omniclass = self._company_uses_omniclass(db, empresa_id)
        if not use_omniclass:
            self._strip_omniclass_from_payload(apu_in)
        apu_in.estado_revision = normalize_apu_revision_status(apu_in.estado_revision)
        apu_in.descripcion = normalize_sentence_case(apu_in.descripcion)
        apu_in.base_trabajo_id = apu_in.base_trabajo_id or 1
        apu_in.unidad = self._resolve_apu_unit_symbol(db, empresa_id, apu_in.base_trabajo_id, apu_in.unidad)
        if apu_in.lineas:
            apu_in.lineas = [type(linea)(**normalized) for linea, normalized in zip(apu_in.lineas, self._normalize_lineas_payload_order(db, [
                {**linea.model_dump(), "recurso_codigo": None} for linea in apu_in.lineas
            ]))]
        desc_norm = normalize_string(apu_in.descripcion)
        # Check uniqueness
        existe_apu = db.query(APU).filter(
            APU.empresa_id == empresa_id,
            APU.base_trabajo_id == (apu_in.base_trabajo_id or 1),
            APU.descripcion_normalizada == desc_norm,
            APU.unidad == apu_in.unidad
        ).first()
        if existe_apu:
            raise ValueError("Ya existe un APU con esta descripción y unidad.")

        subcat = self._ensure_valid_apu_subcategoria(db, apu_in.subcategoria_item_id, apu_in.base_trabajo_id)

        # Auto-generate code if not provided or if it follows the old pattern
        if not apu_in.codigo or apu_in.codigo.startswith("APU-"):
            apu_in.codigo = self._generate_next_code_for_base(
                db, 
                apu_in.base_trabajo_id, 
                empresa_id, 
                apu_in.subcategoria_item_id
            )
        self._ensure_codigo_matches_subcategoria(apu_in.codigo, subcat)

        # Inherit OmniClass from SubcategoriaItem if not provided
        if use_omniclass and not apu_in.omniclass_codigo and apu_in.subcategoria_item_id:
            if subcat and subcat.omniclass_codigo:
                apu_in.omniclass_codigo = subcat.omniclass_codigo
                apu_in.omniclass_titulo = subcat.omniclass_titulo

        from app.repositories.apu import apu_repo
        sync_metadata = self._build_sync_metadata(db, apu_in.base_trabajo_id)
        apu = apu_repo.create(db, obj_in=apu_in, empresa_id=empresa_id, descripcion_normalizada=desc_norm)
        apu.revision = revision
        for key, value in sync_metadata.items():
            setattr(apu, key, value)
        
        # Calculate initial price
        calculate_apu_price(db, apu)
        db.commit()
        db.refresh(apu)
        return apu

    def update_apu(self, db: Session, apu_id: int, apu_in: APUUpdate, empresa_id: int) -> APU:
        from app.repositories.apu import apu_repo
        apu = apu_repo.get_by_id(db, apu_id, empresa_id)
        if not apu:
            return None
        if not self._company_uses_omniclass(db, empresa_id):
            self._strip_omniclass_from_payload(apu_in)
        if apu_in.estado_revision is not None:
            apu_in.estado_revision = normalize_apu_revision_status(apu_in.estado_revision)
        target_descripcion = normalize_sentence_case(apu_in.descripcion) if apu_in.descripcion is not None else apu.descripcion
        if apu_in.descripcion is not None:
            apu_in.descripcion = target_descripcion
        if apu_in.unidad is not None:
            apu_in.unidad = self._resolve_apu_unit_symbol(db, empresa_id, apu.base_trabajo_id, apu_in.unidad)
        target_unidad = apu_in.unidad if apu_in.unidad is not None else apu.unidad

        if apu_in.lineas:
            normalized_payload = self._normalize_lineas_payload_order(db, [
                {**linea.model_dump(), "recurso_codigo": None} for linea in apu_in.lineas
            ])
            apu_in.lineas = [type(linea)(**normalized) for linea, normalized in zip(apu_in.lineas, normalized_payload)]

        # 1. Circular reference check
        for linea_in in apu_in.lineas:
            if linea_in.apu_hijo_id:
                if check_circular_reference(db, linea_in.apu_hijo_id, apu_id):
                    raise ValueError("Referencia circular detectada.")

        # 2. Unicity check
        desc_norm = normalize_string(target_descripcion)
        existe_apu = db.query(APU).filter(
            APU.empresa_id == empresa_id,
            APU.base_trabajo_id == apu.base_trabajo_id,
            APU.descripcion_normalizada == desc_norm,
            APU.unidad == target_unidad,
            APU.id != apu_id
        ).first()
        if existe_apu:
            raise ValueError("Ya existe otro APU con esta descripción y unidad.")

        target_subcat_id = apu_in.subcategoria_item_id if apu_in.subcategoria_item_id is not None else apu.subcategoria_item_id
        target_subcat = self._ensure_valid_apu_subcategoria(db, target_subcat_id, apu.base_trabajo_id)
        target_codigo = apu.codigo
        self._ensure_codigo_matches_subcategoria(target_codigo, target_subcat)

        # 3. Refactor logic to repo/service
        apu = apu_repo.update(db, db_obj=apu, obj_in=apu_in, descripcion_normalizada=desc_norm)
        base = db.query(BaseTrabajo.id, BaseTrabajo.source_base_id).filter(BaseTrabajo.id == apu.base_trabajo_id).first()
        if base and getattr(base, "source_base_id", None):
            if apu.source_apu_id:
                apu.content_origin = "inherited"
                apu.sync_status = "diverged"
            else:
                apu.content_origin = "local"
                apu.sync_status = "local_only"
            db.add(apu)
            db.flush()
        
        # 4. Recalculo operativo con propagación recurrente a APUs padres y presupuestos afectados.
        affected_apu_ids = update_apu_operational_price(db, apu.id) or {apu.id}
        from app.services.presupuesto import propagate_apu_change_to_presupuestos
        for affected_apu_id in sorted(affected_apu_ids):
            propagate_apu_change_to_presupuestos(
                db,
                affected_apu_id,
                apply_active_functional_overlay=False,
            )
        db.refresh(apu)
        return apu

    def delete_apu(self, db: Session, apu_id: int, empresa_id: int) -> bool:
        from app.repositories.apu import apu_repo
        from app.models.presupuesto import PresupuestoDetalle
        from app.services.presupuesto import refresh_presupuesto_prices
        apu = apu_repo.get_by_id(db, apu_id, empresa_id)
        if not apu: return False
        
        is_used_as_child = db.query(APULinea).filter(APULinea.apu_hijo_id == apu_id).first()
        if is_used_as_child:
            parent = db.query(APU).get(is_used_as_child.apu_id)
            raise ValueError(f"El APU está siendo usado en '{parent.descripcion}'.")

        affected_presupuesto_ids = [
            presupuesto_id
            for (presupuesto_id,) in db.query(PresupuestoDetalle.presupuesto_id)
            .filter(PresupuestoDetalle.apu_id == apu_id)
            .distinct()
            .all()
        ]

        deleted = apu_repo.delete(db, apu)
        for presupuesto_id in affected_presupuesto_ids:
            refresh_presupuesto_prices(db, presupuesto_id)
        return deleted

    def bulk_delete(self, db: Session, apu_ids: List[int], empresa_id: int) -> List[int]:
        for aid in apu_ids:
            self.delete_apu(db, aid, empresa_id)
        return apu_ids

    def duplicate_apu(self, db: Session, apu_id: int, empresa_id: int) -> APU:
        from app.repositories.apu import apu_repo
        source = apu_repo.get_by_id(db, apu_id, empresa_id)
        if not source:
            raise ValueError("APU original no encontrado")
        
        normalized_unit = canonicalize_unit_symbol(source.unidad)
        new_desc = self._generate_unique_description(db, source.descripcion, empresa_id, normalized_unit)
        
        new_apu = APU(
            codigo=source.codigo + "-COPY",
            descripcion=new_desc,
            descripcion_normalizada=normalize_string(new_desc),
            unidad=normalized_unit,
            rendimiento_estandar=source.rendimiento_estandar,
            moneda=source.moneda,
            estado_revision="Pendiente",
            categoria_id=source.categoria_id,
            subcategoria_item_id=source.subcategoria_item_id,
            base_trabajo_id=source.base_trabajo_id,
            revision=source.revision,
            empresa_id=empresa_id,
            omniclass_codigo=source.omniclass_codigo if self._company_uses_omniclass(db, empresa_id) else None,
            omniclass_titulo=source.omniclass_titulo if self._company_uses_omniclass(db, empresa_id) else None,
            **self._build_sync_metadata(db, source.base_trabajo_id)
        )
        new_apu.codigo = self._generate_next_code_for_base(db, new_apu.base_trabajo_id, empresa_id, new_apu.subcategoria_item_id)
        db.add(new_apu)
        db.flush()
        
        for linea in source.lineas:
            new_linea = APULinea(
                apu_id=new_apu.id,
                recurso_id=linea.recurso_id,
                apu_hijo_id=linea.apu_hijo_id,
                cantidad=linea.cantidad,
                rendimiento=linea.rendimiento,
                orden=linea.orden,
                precio_congelado=linea.precio_congelado,
                subtotal=linea.subtotal
            )
            db.add(new_linea)
        
        db.commit()
        calculate_apu_price(db, new_apu)
        db.commit()
        db.refresh(new_apu)
        return new_apu

    def _generate_unique_description(self, db: Session, base_desc: str, empresa_id: int, unidad: str) -> str:
        base = re.sub(r"-copia\d+$", "", base_desc)
        i = 1
        while True:
            candidate = f"{base}-copia{i}"
            norm = normalize_string(candidate)
            existing = db.query(APU).filter(
                APU.descripcion_normalizada == norm,
                APU.unidad == unidad,
                APU.empresa_id == empresa_id
            ).first()
            if not existing: return candidate
            i += 1

    def import_clipboard(self, db: Session, items: List, empresa_id: int, base_trabajo_id: int, subcategoria_item_id: int, revision: int = 0) -> dict:
        imported = 0
        errors = []
        use_omniclass = self._company_uses_omniclass(db, empresa_id)
        self._ensure_valid_apu_subcategoria(db, subcategoria_item_id, base_trabajo_id)
        code_prefix = self._build_codigo_prefix(db, subcategoria_item_id)
        next_code_value = self._next_code_sequence_start(db, base_trabajo_id, empresa_id, code_prefix)
        unidades_validas = db.query(Unidad).filter(Unidad.subcategoria_codigo == 5).filter(
            (Unidad.es_global == True) | ((Unidad.empresa_id == empresa_id) & (Unidad.base_trabajo_id == base_trabajo_id))
        ).all()
        unidades_map = {canonicalize_unit_symbol(u.descripcion): u for u in unidades_validas}

        for item in items:
            desc = normalize_sentence_case(item.descripcion)
            unidad = canonicalize_unit_symbol(item.unidad)
            if not desc or not unidad:
                errors.append(f"Saltado: faltan datos en '{desc or unidad}'")
                continue

            norm = normalize_string(desc)
            u_obj = unidades_map.get(unidad)
            if not u_obj:
                errors.append(f"Saltado (unidad inválida): {desc} [{unidad}]")
                continue

            existing = db.query(APU).filter(
                APU.descripcion_normalizada == norm,
                APU.unidad == u_obj.descripcion,
                APU.empresa_id == empresa_id,
                APU.base_trabajo_id == base_trabajo_id,
                APU.revision == revision
            ).first()
            if existing:
                errors.append(f"Saltado (ya existe): {desc}")
                continue

            new_apu = APU(
                codigo=f"{code_prefix}-{str(next_code_value).zfill(4)}",
                descripcion=desc,
                descripcion_normalizada=norm,
                unidad=canonicalize_unit_symbol(u_obj.descripcion),
                rendimiento_estandar=1.0,
                estado_revision="Pendiente",
                subcategoria_item_id=subcategoria_item_id,
                base_trabajo_id=base_trabajo_id,
                revision=revision,
                empresa_id=empresa_id,
                costo_directo=0,
                precio_unitario_total=0,
                **self._build_sync_metadata(db, base_trabajo_id)
            )
            
            # Inherit OmniClass for clipboard import
            subcat_parent = db.query(SubcategoriaItem).get(subcategoria_item_id)
            if use_omniclass and subcat_parent and subcat_parent.omniclass_codigo:
                new_apu.omniclass_codigo = subcat_parent.omniclass_codigo
                new_apu.omniclass_titulo = subcat_parent.omniclass_titulo
                
            db.add(new_apu)
            next_code_value += 1
            imported += 1
            
        db.commit()
        return {"imported": imported, "errors": errors}

    def _generate_next_code_for_base(self, db: Session, base_id: int, empresa_id: int, subcategoria_item_id: Optional[int] = None) -> str:
        prefix = self._build_codigo_prefix(db, subcategoria_item_id)
        next_val = self._next_code_sequence_start(db, base_id, empresa_id, prefix)
        return f"{prefix}-{str(next_val).zfill(4)}"

    def import_from_other_base(
        self,
        db: Session,
        source_base_id: int,
        target_base_id: int,
        apu_ids: List[int],
        empresa_id: int,
        dry_run: bool = False,
        resolutions: Dict[int, str] = None,
        source_revision: int = 0,
        target_revision: int = 0,
    ) -> dict:
        results = {"imported_apus": 0, "imported_resources": 0, "conflicts": [], "errors": []}
        resolutions = resolutions or {}
        self.memo_subcats = {}
        self.memo_resources = {}
        self.memo_apus = {}

        conflicts_found = False
        for apu_id in apu_ids:
            source_apu = db.query(APU).filter(
                APU.id == apu_id,
                APU.base_trabajo_id == source_base_id,
                APU.revision == source_revision,
                APU.empresa_id == empresa_id
            ).first()
            if not source_apu: continue
            if not self._is_import_eligible_status(source_apu.estado_revision):
                results["errors"].append(f"'{source_apu.descripcion}' no está Revisado.")
                continue

            target_apu = db.query(APU).filter(
                APU.descripcion_normalizada == source_apu.descripcion_normalizada,
                APU.unidad == canonicalize_unit_symbol(source_apu.unidad),
                APU.base_trabajo_id == target_base_id,
                APU.revision == target_revision,
                APU.empresa_id == empresa_id
            ).first()

            if target_apu and (apu_id not in resolutions):
                results["conflicts"].append({
                    "source": {
                        "id": source_apu.id,
                        "codigo": source_apu.codigo,
                        "descripcion": source_apu.descripcion,
                        "precio": float(source_apu.precio_unitario_total),
                        "fecha": (source_apu.ultima_modificacion or source_apu.fecha_creacion).isoformat() if (source_apu.ultima_modificacion or source_apu.fecha_creacion) else None,
                    },
                    "target": {
                        "id": target_apu.id,
                        "codigo": target_apu.codigo,
                        "descripcion": target_apu.descripcion,
                        "precio": float(target_apu.precio_unitario_total),
                        "fecha": (target_apu.ultima_modificacion or target_apu.fecha_creacion).isoformat() if (target_apu.ultima_modificacion or target_apu.fecha_creacion) else None,
                    }
                })
                conflicts_found = True

        if dry_run or (conflicts_found and not resolutions):
            return results

        for apu_id in apu_ids:
            if resolutions.get(apu_id) == "skip": continue
            self._import_apu_recursive(
                db,
                apu_id,
                source_base_id,
                target_base_id,
                empresa_id,
                results,
                resolutions,
                source_revision,
                target_revision,
            )

        db.commit()
        return results

    def _import_apu_recursive(
        self,
        db: Session,
        apu_id: int,
        source_base_id: int,
        target_base_id: int,
        empresa_id: int,
        results: dict,
        resolutions: Dict[int, str],
        source_revision: int = 0,
        target_revision: int = 0,
    ) -> int:
        if apu_id in self.memo_apus: return self.memo_apus[apu_id]
        source_apu = db.query(APU).filter(
            APU.id == apu_id,
            APU.base_trabajo_id == source_base_id,
            APU.revision == source_revision,
            APU.empresa_id == empresa_id
        ).first()
        if not source_apu or not self._is_import_eligible_status(source_apu.estado_revision): return 0

        target_apu = db.query(APU).filter(
            APU.descripcion_normalizada == source_apu.descripcion_normalizada,
            APU.unidad == canonicalize_unit_symbol(source_apu.unidad),
            APU.base_trabajo_id == target_base_id,
            APU.revision == target_revision,
            APU.empresa_id == empresa_id
        ).first()

        res = resolutions.get(apu_id)
        if target_apu and not res:
            self.memo_apus[apu_id] = target_apu.id
            return target_apu.id

        if target_apu and res == "overwrite":
            db.query(APULinea).filter(APULinea.apu_id == target_apu.id).delete()
            new_apu = target_apu
        else:
            if target_apu: return target_apu.id
            t_subcat_id = self._resolve_subcat(db, source_apu.subcategoria_item_id, target_base_id, empresa_id)
            new_apu = APU(
                codigo=self._generate_next_code_for_base(db, target_base_id, empresa_id, t_subcat_id), 
                descripcion_normalizada=source_apu.descripcion_normalizada, 
                base_trabajo_id=target_base_id, 
                revision=target_revision, 
                empresa_id=empresa_id,
                omniclass_codigo=source_apu.omniclass_codigo if self._company_uses_omniclass(db, empresa_id) else None,
                omniclass_titulo=source_apu.omniclass_titulo if self._company_uses_omniclass(db, empresa_id) else None,
                **self._build_sync_metadata(db, target_base_id, source_apu.id)
            )
            db.add(new_apu)
            db.flush()

        new_apu.descripcion = source_apu.descripcion
        new_apu.descripcion = normalize_sentence_case(new_apu.descripcion)
        new_apu.unidad = canonicalize_unit_symbol(source_apu.unidad)
        new_apu.rendimiento_estandar = source_apu.rendimiento_estandar
        new_apu.moneda = source_apu.moneda
        new_apu.estado_revision = "Revisado"
        new_apu.subcategoria_item_id = self._resolve_subcat(db, source_apu.subcategoria_item_id, target_base_id, empresa_id)
        for key, value in self._build_sync_metadata(db, target_base_id, source_apu.id).items():
            setattr(new_apu, key, value)
        
        self.memo_apus[apu_id] = new_apu.id
        results["imported_apus"] += 1

        for linea in source_apu.lineas:
            new_linea = APULinea(
                apu_id=new_apu.id,
                cantidad=linea.cantidad,
                rendimiento=linea.rendimiento,
                orden=linea.orden,
                precio_congelado=linea.precio_congelado
            )
            if linea.recurso_id:
                new_linea.recurso_id = self._resolve_resource(db, linea.recurso_id, target_base_id, empresa_id, results, target_revision)
            elif linea.apu_hijo_id:
                new_linea.apu_hijo_id = self._import_apu_recursive(
                    db,
                    linea.apu_hijo_id,
                    source_base_id,
                    target_base_id,
                    empresa_id,
                    results,
                    resolutions,
                    source_revision,
                    target_revision,
                )
            db.add(new_linea)
        
        db.flush()
        calculate_apu_price(db, new_apu)
        return new_apu.id

    def _resolve_subcat(self, db: Session, source_subcat_id: Optional[int], target_base_id: int, empresa_id: int) -> int:
        if source_subcat_id in self.memo_subcats: return self.memo_subcats[source_subcat_id]
        from app.repositories.subcategoria_item import subcategoria_item_repo
        
        source_subcat = db.query(SubcategoriaItem).get(source_subcat_id) if source_subcat_id else None
        desc = normalize_uppercase_label(source_subcat.descripcion if source_subcat else "General")
        code_cat = source_subcat.subcategoria_codigo if source_subcat else 5

        target_subcat = db.query(SubcategoriaItem).filter(
            SubcategoriaItem.subcategoria_codigo == code_cat,
            func.lower(SubcategoriaItem.descripcion) == func.lower(desc),
            SubcategoriaItem.base_trabajo_id == target_base_id,
            SubcategoriaItem.empresa_id == empresa_id
        ).first()
        if not target_subcat:
            from app.schemas.subcategoria_item import SubcategoriaItemCreate
            new_subcat_in = SubcategoriaItemCreate(descripcion=desc, subcategoria_codigo=code_cat)
            target_subcat = subcategoria_item_repo.create(db, obj_in=new_subcat_in, base_trabajo_id=target_base_id, empresa_id=empresa_id)
        
        self.memo_subcats[source_subcat_id] = target_subcat.id
        return target_subcat.id

    def _resolve_resource(self, db: Session, source_recurso_id: int, target_base_id: int, empresa_id: int, results: dict, revision: int = 0) -> int:
        if source_recurso_id in self.memo_resources: return self.memo_resources[source_recurso_id]
        source_rec = db.query(Recurso).get(source_recurso_id)
        u_sigla = db.query(Unidad.descripcion).filter(Unidad.id == source_rec.unidad_id).scalar()
        
        target_rec = db.query(Recurso).join(Unidad).filter(
            Recurso.descripcion_normalizada == source_rec.descripcion_normalizada, 
            Unidad.descripcion == u_sigla, 
            Recurso.base_trabajo_id == target_base_id, 
            Recurso.revision == revision,
            Recurso.empresa_id == empresa_id
        ).first()
        if target_rec:
            self.memo_resources[source_recurso_id] = target_rec.id
            return target_rec.id

        from app.services.recurso import recurso_service
        from app.schemas.recurso import RecursoCreate
        # Find unit in target
        target_u = db.query(Unidad).filter(Unidad.descripcion == u_sigla).filter((Unidad.es_global == True) | (Unidad.empresa_id == empresa_id)).first()
        t_subcat = self._resolve_subcat(db, source_rec.subcategoria_item_id, target_base_id, empresa_id)
        
        new_rec_in = RecursoCreate(descripcion=source_rec.descripcion, precio=source_rec.precio, unidad_id=target_u.id if target_u else 1, subcategoria_item_id=t_subcat)
        new_rec = recurso_service.create_recurso(db, new_rec_in, base_trabajo_id=target_base_id, empresa_id=empresa_id, revision=revision)
        self.memo_resources[source_recurso_id] = new_rec.id
        results["imported_resources"] += 1
        return new_rec.id

    def move_linea(self, db: Session, apu_id: int, linea_id: int, target_index: int, empresa_id: int) -> APU:
        from app.repositories.apu import apu_repo

        apu = apu_repo.get_by_id(db, apu_id, empresa_id)
        if not apu:
            raise ValueError("APU no encontrado.")

        ordered_lineas = sorted(apu.lineas, key=lambda item: ((item.orden or 0), item.id or 0))
        target_linea = next((linea for linea in ordered_lineas if linea.id == linea_id), None)
        if not target_linea:
            raise ValueError("Línea APU no encontrada.")

        target_category = self._resolve_linea_category(target_linea)
        same_category = [linea for linea in ordered_lineas if self._resolve_linea_category(linea) == target_category]
        if len(same_category) <= 1:
            return apu

        bounded_index = max(0, min(target_index, len(same_category) - 1))
        same_category = [linea for linea in same_category if linea.id != linea_id]
        same_category.insert(bounded_index, target_linea)

        position_map = {linea.id: index for index, linea in enumerate(same_category)}
        regrouped = []
        for linea in ordered_lineas:
            category = self._resolve_linea_category(linea)
            if category == target_category:
                regrouped.append((self.CATEGORY_ORDER.get(category, 99), position_map[linea.id], linea))
            else:
                same_cat_before = [item for item in ordered_lineas if self._resolve_linea_category(item) == category]
                original_index = next((idx for idx, item in enumerate(same_cat_before) if item.id == linea.id), 0)
                regrouped.append((self.CATEGORY_ORDER.get(category, 99), original_index, linea))

        ordered_ids = [linea.id for _, __, linea in sorted(regrouped, key=lambda item: (item[0], item[1]))]
        apu_repo.reorder_lineas(db, apu.id, ordered_ids)
        calculate_apu_price(db, apu)
        db.commit()
        db.refresh(apu)
        return apu

apu_service = APUService()
