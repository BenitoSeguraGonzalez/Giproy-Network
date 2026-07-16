from decimal import Decimal

from app.models.apu import APU, APULinea
from app.models.base_trabajo import BaseTrabajo
from app.models.edt import EdtNode, TipoNodoEdt
from app.models.presupuesto import Presupuesto, PresupuestoDetalle
from app.models.proyecto import Proyecto
from app.models.recurso import Recurso
from app.models.subcategoria_item import SubcategoriaItem
from app.models.unidad import Unidad
from app.services.public_procurement_import_certifier import (
    is_invalid_imported_resource_description,
    public_procurement_import_certifier,
)


def _seed_certification_context(db, empresa):
    base = BaseTrabajo(
        codigo_unico="BT-CERT-001",
        nombre="Base certificacion",
        tipo="Base de Proyecto",
        empresa_id=empresa.id,
    )
    db.add(base)
    db.flush()

    subcat_resource = SubcategoriaItem(
        codigo="1-001",
        descripcion="General",
        subcategoria_codigo=1,
        base_trabajo_id=base.id,
        empresa_id=empresa.id,
        revisado=True,
    )
    subcat_apu = SubcategoriaItem(
        codigo="5-001",
        descripcion="General",
        subcategoria_codigo=5,
        base_trabajo_id=base.id,
        empresa_id=empresa.id,
        revisado=True,
    )
    unit = Unidad(
        descripcion="h",
        descripcion_completa="Hora",
        subcategoria_codigo=1,
        es_global=True,
    )
    db.add_all([subcat_resource, subcat_apu, unit])
    db.flush()

    project = Proyecto(
        codigo="CERT-2026-001",
        codigo_root="CERT-2026-001",
        revision=0,
        nombre="Proyecto certificacion",
        empresa_id=empresa.id,
        base_trabajo_id=base.id,
    )
    db.add(project)
    db.flush()

    presupuesto = Presupuesto(
        proyecto_id=project.id,
        empresa_id=empresa.id,
        descripcion="Presupuesto certificacion",
        revision=0,
    )
    edt = EdtNode(
        proyecto_id=project.id,
        empresa_id=empresa.id,
        tipo_nodo=TipoNodoEdt.CUENTA_PAQUETE,
        orden=1,
        codigo="1",
        nombre="General",
    )
    db.add_all([presupuesto, edt])
    db.flush()
    return base, subcat_resource, subcat_apu, unit, project, presupuesto, edt


def _make_apu(db, empresa, base, subcat, code, description):
    apu = APU(
        codigo=code,
        descripcion=description,
        descripcion_normalizada=description.lower(),
        unidad="u",
        costo_directo=Decimal("1"),
        precio_unitario_total=Decimal("1"),
        subcategoria_item_id=subcat.id,
        base_trabajo_id=base.id,
        empresa_id=empresa.id,
    )
    db.add(apu)
    db.flush()
    return apu


def _make_resource(db, empresa, base, subcat, unit, code, description):
    resource = Recurso(
        codigo=code,
        descripcion=description,
        descripcion_normalizada=description.lower(),
        precio=Decimal("1"),
        unidad_id=unit.id,
        subcategoria_item_id=subcat.id,
        base_trabajo_id=base.id,
        empresa_id=empresa.id,
    )
    db.add(resource)
    db.flush()
    return resource


def test_resource_description_detector_flags_numeric_unit_rows():
    assert is_invalid_imported_resource_description("Hora 1,00000 0,35000") is True
    assert is_invalid_imported_resource_description("Retroexcavadora") is False


def test_certifier_accepts_budget_root_apu_nested_apu_and_resources(db, sample_empresa):
    base, subcat_resource, subcat_apu, unit, _, presupuesto, edt = _seed_certification_context(db, sample_empresa)
    root = _make_apu(db, sample_empresa, base, subcat_apu, "APU-ROOT", "Rubro principal")
    child = _make_apu(db, sample_empresa, base, subcat_apu, "APU-CHILD", "APU anidado")
    root_resource = _make_resource(db, sample_empresa, base, subcat_resource, unit, "REC-001", "Retroexcavadora")
    child_resource = _make_resource(db, sample_empresa, base, subcat_resource, unit, "REC-002", "Peon")
    db.add_all([
        APULinea(apu_id=root.id, recurso_id=root_resource.id, cantidad=1, rendimiento=1, orden=1),
        APULinea(apu_id=root.id, apu_hijo_id=child.id, cantidad=1, rendimiento=1, orden=2),
        APULinea(apu_id=child.id, recurso_id=child_resource.id, cantidad=1, rendimiento=1, orden=1),
        PresupuestoDetalle(
            presupuesto_id=presupuesto.id,
            apu_id=root.id,
            edt_id=edt.id,
            tipo="RUBRO",
            codigo_item="1.1",
            descripcion="Rubro principal",
            cantidad=1,
            precio_unitario=1,
            precio_total=1,
        ),
    ])
    db.flush()

    result = public_procurement_import_certifier.certify_materialized_project(
        db,
        empresa_id=sample_empresa.id,
        base_trabajo_id=base.id,
        presupuesto_id=presupuesto.id,
    )

    assert result["valid"] is True
    assert result["summary"]["root_apus_count"] == 1
    assert result["summary"]["nested_apus_count"] == 1
    assert result["summary"]["reachable_resources_count"] == 2


def test_certifier_blocks_orphan_resources_and_apus(db, sample_empresa):
    base, subcat_resource, subcat_apu, unit, _, presupuesto, edt = _seed_certification_context(db, sample_empresa)
    root = _make_apu(db, sample_empresa, base, subcat_apu, "APU-ROOT", "Rubro principal")
    orphan_apu = _make_apu(db, sample_empresa, base, subcat_apu, "APU-ORPHAN", "APU suelto")
    used = _make_resource(db, sample_empresa, base, subcat_resource, unit, "REC-001", "Retroexcavadora")
    _make_resource(db, sample_empresa, base, subcat_resource, unit, "REC-002", "Recurso suelto")
    db.add_all([
        APULinea(apu_id=root.id, recurso_id=used.id, cantidad=1, rendimiento=1, orden=1),
        APULinea(apu_id=orphan_apu.id, recurso_id=used.id, cantidad=1, rendimiento=1, orden=1),
        PresupuestoDetalle(
            presupuesto_id=presupuesto.id,
            apu_id=root.id,
            edt_id=edt.id,
            tipo="RUBRO",
            codigo_item="1.1",
            descripcion="Rubro principal",
            cantidad=1,
            precio_unitario=1,
            precio_total=1,
        ),
    ])
    db.flush()

    result = public_procurement_import_certifier.certify_materialized_project(
        db,
        empresa_id=sample_empresa.id,
        base_trabajo_id=base.id,
        presupuesto_id=presupuesto.id,
    )

    assert result["valid"] is False
    assert result["issue_counts"]["orphan_apu"] == 1
    assert result["issue_counts"]["orphan_resource"] == 1


def test_certifier_blocks_phantom_resources_and_nested_cycles(db, sample_empresa):
    base, subcat_resource, subcat_apu, unit, _, presupuesto, edt = _seed_certification_context(db, sample_empresa)
    root = _make_apu(db, sample_empresa, base, subcat_apu, "APU-ROOT", "Rubro principal")
    child = _make_apu(db, sample_empresa, base, subcat_apu, "APU-CHILD", "APU anidado")
    phantom = _make_resource(db, sample_empresa, base, subcat_resource, unit, "REC-001", "Hora 1,00000 0,35000")
    db.add_all([
        APULinea(apu_id=root.id, recurso_id=phantom.id, cantidad=1, rendimiento=1, orden=1),
        APULinea(apu_id=root.id, apu_hijo_id=child.id, cantidad=1, rendimiento=1, orden=2),
        APULinea(apu_id=child.id, apu_hijo_id=root.id, cantidad=1, rendimiento=1, orden=1),
        PresupuestoDetalle(
            presupuesto_id=presupuesto.id,
            apu_id=root.id,
            edt_id=edt.id,
            tipo="RUBRO",
            codigo_item="1.1",
            descripcion="Rubro principal",
            cantidad=1,
            precio_unitario=1,
            precio_total=1,
        ),
    ])
    db.flush()

    result = public_procurement_import_certifier.certify_materialized_project(
        db,
        empresa_id=sample_empresa.id,
        base_trabajo_id=base.id,
        presupuesto_id=presupuesto.id,
    )

    assert result["valid"] is False
    assert result["issue_counts"]["invalid_resource_description"] == 1
    assert result["issue_counts"]["nested_apu_cycle"] == 1
