from decimal import Decimal

from app.models.apu import APU, APULinea
from app.models.base_trabajo import BaseTrabajo
from app.models.codcpc import CodCPC
from app.models.recurso import Recurso
from app.models.subcategoria_item import SubcategoriaItem
from app.models.unidad import Unidad
from app.services.project_base_reconciliation import project_base_reconciliation_service
from app.services.apu import normalize_string


def _seed_base(db, empresa_id: int, name: str, tipo: str, source_base_id=None):
    base = BaseTrabajo(
        codigo_unico=f"BT-{name}",
        nombre=name,
        tipo=tipo,
        empresa_id=empresa_id,
        source_base_id=source_base_id,
        moneda="USD",
    )
    db.add(base)
    db.flush()
    return base


def _seed_subcat(db, empresa_id: int, base_id: int, codigo: str, descripcion: str, subcategoria_codigo: int):
    item = SubcategoriaItem(
        codigo=codigo,
        descripcion=descripcion,
        subcategoria_codigo=subcategoria_codigo,
        base_trabajo_id=base_id,
        empresa_id=empresa_id,
        revisado=True,
    )
    db.add(item)
    db.flush()
    return item


def _seed_unidad(db):
    unidad = Unidad(
        descripcion="u",
        descripcion_completa="Unidad",
        subcategoria_codigo=2,
        es_global=True,
    )
    db.add(unidad)
    db.flush()
    return unidad


def _seed_cpc(db, code: str = "4292100117"):
    cpc = CodCPC(codCPC=code, descripcion=f"CPC {code}", porcentaje=70)
    db.add(cpc)
    db.flush()
    return cpc


def _seed_resource(db, empresa_id: int, base_id: int, subcat_id: int, unidad_id: int, code: str, desc: str, price: str, cod_cpc_id=None):
    rec = Recurso(
        codigo=code,
        descripcion=desc,
        descripcion_normalizada=normalize_string(desc),
        precio=Decimal(price),
        unidad_id=unidad_id,
        cod_cpc_id=cod_cpc_id,
        subcategoria_item_id=subcat_id,
        base_trabajo_id=base_id,
        empresa_id=empresa_id,
        revisado=True,
    )
    db.add(rec)
    db.flush()
    return rec


def _seed_apu(db, empresa_id: int, base_id: int, subcat_id: int, code: str, desc: str, source_apu_id=None, origin="native"):
    apu = APU(
        codigo=code,
        descripcion=desc,
        descripcion_normalizada=normalize_string(desc),
        unidad="u",
        empresa_id=empresa_id,
        base_trabajo_id=base_id,
        subcategoria_item_id=subcat_id,
        precio_unitario_total=Decimal("0"),
        costo_directo=Decimal("0"),
        costo_indirecto=Decimal("0"),
        source_apu_id=source_apu_id,
        content_origin=origin,
    )
    db.add(apu)
    db.flush()
    return apu


def _seed_line(db, apu_id: int, recurso_id: int, orden: int, cantidad: str):
    line = APULinea(
        apu_id=apu_id,
        recurso_id=recurso_id,
        orden=orden,
        cantidad=Decimal(cantidad),
        rendimiento=Decimal("1"),
        precio_congelado=Decimal("10"),
        subtotal=Decimal("10"),
    )
    db.add(line)
    db.flush()
    return line


def test_sync_missing_creates_new_apu_with_resources(db, sample_empresa):
    unidad = _seed_unidad(db)
    source_base = _seed_base(db, sample_empresa.id, "source", "Base Maestra")
    target_base = _seed_base(db, sample_empresa.id, "target", "Base de Proyecto", source_base_id=source_base.id)
    source_subcat = _seed_subcat(db, sample_empresa.id, source_base.id, "5-001", "General APU", 5)
    target_subcat = _seed_subcat(db, sample_empresa.id, target_base.id, "5-001", "General APU", 5)
    source_res_subcat = _seed_subcat(db, sample_empresa.id, source_base.id, "2-001", "Materiales", 2)

    source_resource = _seed_resource(db, sample_empresa.id, source_base.id, source_res_subcat.id, unidad.id, "2-0001-00001", "Cemento", "10")
    source_apu = _seed_apu(db, sample_empresa.id, source_base.id, source_subcat.id, "5-001-0001", "APU Nuevo")
    _seed_line(db, source_apu.id, source_resource.id, 1, "1")
    db.commit()

    result = project_base_reconciliation_service.sync_missing_only(db, target_base.id, sample_empresa.id)

    created_apu = db.query(APU).filter(APU.base_trabajo_id == target_base.id, APU.codigo == "5-001-0001").first()
    created_resource = db.query(Recurso).filter(Recurso.base_trabajo_id == target_base.id, Recurso.codigo == "2-0001-00001").first()
    assert result["added"]["apus"] == 1
    assert result["added"]["resources"] == 1
    assert created_apu is not None
    assert created_resource is not None
    assert db.query(APULinea).filter(APULinea.apu_id == created_apu.id).count() == 1


def test_sync_missing_does_not_touch_divergent_existing_apu(db, sample_empresa):
    unidad = _seed_unidad(db)
    source_base = _seed_base(db, sample_empresa.id, "source-div", "Base Maestra")
    target_base = _seed_base(db, sample_empresa.id, "target-div", "Base de Proyecto", source_base_id=source_base.id)
    source_subcat = _seed_subcat(db, sample_empresa.id, source_base.id, "5-001", "General APU", 5)
    target_subcat = _seed_subcat(db, sample_empresa.id, target_base.id, "5-001", "General APU", 5)
    source_res_subcat = _seed_subcat(db, sample_empresa.id, source_base.id, "2-001", "Materiales", 2)
    target_res_subcat = _seed_subcat(db, sample_empresa.id, target_base.id, "2-001", "Materiales", 2)

    source_resource = _seed_resource(db, sample_empresa.id, source_base.id, source_res_subcat.id, unidad.id, "2-0001-00001", "Cemento", "10")
    target_resource = _seed_resource(db, sample_empresa.id, target_base.id, target_res_subcat.id, unidad.id, "2-0001-00001", "Cemento", "11")
    source_apu = _seed_apu(db, sample_empresa.id, source_base.id, source_subcat.id, "5-001-0001", "APU Divergente")
    target_apu = _seed_apu(
        db, sample_empresa.id, target_base.id, target_subcat.id, "5-001-0001", "APU Divergente",
        source_apu_id=source_apu.id, origin="inherited"
    )
    _seed_line(db, source_apu.id, source_resource.id, 1, "1")
    _seed_line(db, target_apu.id, target_resource.id, 1, "2")
    target_apu.precio_unitario_total = Decimal("22")
    target_apu.costo_directo = Decimal("22")
    db.commit()

    result = project_base_reconciliation_service.sync_missing_only(db, target_base.id, sample_empresa.id)
    db.refresh(target_apu)

    assert result["added"]["apus"] == 0
    assert result["repaired"]["apus"] == 0
    assert result["untouched"]["divergent_apus"] >= 1
    assert db.query(APULinea).filter(APULinea.apu_id == target_apu.id).count() == 1
    assert target_apu.precio_unitario_total == Decimal("22")


def test_repair_inherited_only_repairs_empty_apu_without_touching_source(db, sample_empresa):
    unidad = _seed_unidad(db)
    source_base = _seed_base(db, sample_empresa.id, "source-repair", "Base Maestra")
    target_base = _seed_base(db, sample_empresa.id, "target-repair", "Base de Proyecto", source_base_id=source_base.id)
    source_subcat = _seed_subcat(db, sample_empresa.id, source_base.id, "5-001", "General APU", 5)
    target_subcat = _seed_subcat(db, sample_empresa.id, target_base.id, "5-001", "General APU", 5)
    source_res_subcat = _seed_subcat(db, sample_empresa.id, source_base.id, "2-001", "Materiales", 2)

    source_resource = _seed_resource(db, sample_empresa.id, source_base.id, source_res_subcat.id, unidad.id, "2-0001-00001", "Cemento", "10")
    source_apu = _seed_apu(db, sample_empresa.id, source_base.id, source_subcat.id, "5-001-0001", "APU Heredado")
    _seed_line(db, source_apu.id, source_resource.id, 1, "1")
    source_apu.precio_unitario_total = Decimal("10")
    source_apu.costo_directo = Decimal("10")

    target_apu = _seed_apu(
        db, sample_empresa.id, target_base.id, target_subcat.id, "5-001-0001", "APU Heredado",
        source_apu_id=source_apu.id, origin="inherited"
    )
    db.commit()

    result = project_base_reconciliation_service.repair_inherited_only(db, target_base.id, sample_empresa.id)

    db.refresh(source_apu)
    db.refresh(target_apu)
    assert result["repaired"]["apus"] == 1
    assert db.query(APULinea).filter(APULinea.apu_id == target_apu.id).count() == 1
    assert db.query(APULinea).filter(APULinea.apu_id == source_apu.id).count() == 1


def test_value_sync_updates_resource_cpc_even_when_apu_signature_is_unchanged(db, sample_empresa):
    unidad = _seed_unidad(db)
    cpc = _seed_cpc(db)
    source_base = _seed_base(db, sample_empresa.id, "source-cpc-sync", "Base Maestra")
    target_base = _seed_base(db, sample_empresa.id, "target-cpc-sync", "Base de Proyecto", source_base_id=source_base.id)
    source_subcat = _seed_subcat(db, sample_empresa.id, source_base.id, "5-001", "General APU", 5)
    target_subcat = _seed_subcat(db, sample_empresa.id, target_base.id, "5-001", "General APU", 5)
    source_res_subcat = _seed_subcat(db, sample_empresa.id, source_base.id, "2-001", "Materiales", 2)
    target_res_subcat = _seed_subcat(db, sample_empresa.id, target_base.id, "2-001", "Materiales", 2)

    source_resource = _seed_resource(
        db,
        sample_empresa.id,
        source_base.id,
        source_res_subcat.id,
        unidad.id,
        "2-0001-00001",
        "Cemento",
        "10",
        cod_cpc_id=cpc.id,
    )
    target_resource = _seed_resource(
        db,
        sample_empresa.id,
        target_base.id,
        target_res_subcat.id,
        unidad.id,
        "2-0001-00001",
        "Cemento",
        "10",
        cod_cpc_id=None,
    )
    target_resource.source_recurso_id = source_resource.id
    target_resource.content_origin = "inherited"
    target_resource.sync_status = "synced"

    source_apu = _seed_apu(db, sample_empresa.id, source_base.id, source_subcat.id, "5-001-0001", "APU sin cambio")
    target_apu = _seed_apu(
        db,
        sample_empresa.id,
        target_base.id,
        target_subcat.id,
        "5-001-0001",
        "APU sin cambio",
        source_apu_id=source_apu.id,
        origin="inherited",
    )
    _seed_line(db, source_apu.id, source_resource.id, 1, "1")
    _seed_line(db, target_apu.id, target_resource.id, 1, "1")
    source_apu.precio_unitario_total = Decimal("10")
    source_apu.costo_directo = Decimal("10")
    target_apu.precio_unitario_total = Decimal("10")
    target_apu.costo_directo = Decimal("10")
    db.commit()

    result = project_base_reconciliation_service.execute_sync_operation(
        db,
        target_base.id,
        sample_empresa.id,
        "apu_values",
    )

    db.refresh(target_resource)
    assert result["updated"]["resource_values"] == 1
    assert target_resource.cod_cpc_id == cpc.id
