from decimal import Decimal

from app.models.apu import APU
from app.models.base_trabajo import BaseTrabajo
from app.models.edt import EdtNode, TipoNodoEdt
from app.models.presupuesto import Presupuesto, PresupuestoDetalle
from app.models.proyecto import Proyecto
from app.models.recurso import Recurso
from app.models.subcategoria_item import SubcategoriaItem
from app.models.unidad import Unidad
from app.services.apu import normalize_string
from app.services.presupuesto import (
    find_mixed_presupuesto_apu_lines,
    repair_presupuesto_apu_scope,
)
from app.services.proyecto import proyecto_service


def _seed_base(db, empresa_id: int, code: str, name: str, tipo: str, source_base_id=None):
    base = BaseTrabajo(
        codigo_unico=code,
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


def _seed_unidad(db, code: int, descripcion: str):
    unidad = Unidad(
        descripcion=descripcion,
        descripcion_completa=descripcion,
        subcategoria_codigo=code,
        es_global=True,
    )
    db.add(unidad)
    db.flush()
    return unidad


def _seed_recurso(db, empresa_id: int, base_id: int, subcat_id: int, unidad_id: int, codigo: str, descripcion: str, precio: str):
    recurso = Recurso(
        codigo=codigo,
        descripcion=descripcion,
        descripcion_normalizada=normalize_string(descripcion),
        precio=Decimal(precio),
        unidad_id=unidad_id,
        subcategoria_item_id=subcat_id,
        base_trabajo_id=base_id,
        empresa_id=empresa_id,
        revisado=True,
    )
    db.add(recurso)
    db.flush()
    return recurso


def _seed_apu(db, empresa_id: int, base_id: int, subcat_id: int, codigo: str, descripcion: str, unidad: str, source_apu_id=None):
    apu = APU(
        codigo=codigo,
        descripcion=descripcion,
        descripcion_normalizada=normalize_string(descripcion),
        unidad=unidad,
        empresa_id=empresa_id,
        base_trabajo_id=base_id,
        subcategoria_item_id=subcat_id,
        precio_unitario_total=Decimal("9.45"),
        costo_directo=Decimal("7.81"),
        costo_indirecto=Decimal("1.64"),
        source_apu_id=source_apu_id,
        content_origin="inherited" if source_apu_id else "native",
    )
    db.add(apu)
    db.flush()
    return apu


def test_repair_presupuesto_apu_scope_remaps_lines_to_project_base(db, sample_empresa):
    unidad_h = _seed_unidad(db, 1, "h")
    unidad_sem = _seed_unidad(db, 2, "sem")
    master_base = _seed_base(db, sample_empresa.id, "BT-MASTER", "Master", "Base Maestra")
    project_base = _seed_base(db, sample_empresa.id, "BT-PROJECT", "Project", "Base de Proyecto", source_base_id=master_base.id)

    apu_subcat_master = _seed_subcat(db, sample_empresa.id, master_base.id, "5-001", "APUs", 5)
    apu_subcat_project = _seed_subcat(db, sample_empresa.id, project_base.id, "5-001", "APUs", 5)
    recurso_subcat_master = _seed_subcat(db, sample_empresa.id, master_base.id, "1-001", "Equipos", 1)
    recurso_subcat_project = _seed_subcat(db, sample_empresa.id, project_base.id, "1-001", "Equipos", 1)

    _seed_recurso(db, sample_empresa.id, master_base.id, recurso_subcat_master.id, unidad_h.id, "1-0001-00003", "Herramientas varias", "0.50")
    _seed_recurso(db, sample_empresa.id, project_base.id, recurso_subcat_project.id, unidad_sem.id, "1-0001-00003", "Herramientas varias", "0.50")

    master_apu = _seed_apu(db, sample_empresa.id, master_base.id, apu_subcat_master.id, "5-002-0001", "Excavación a mano", "m3")
    project_apu = _seed_apu(
        db,
        sample_empresa.id,
        project_base.id,
        apu_subcat_project.id,
        "5-002-0001",
        "Excavación a mano",
        "m3",
        source_apu_id=master_apu.id,
    )

    proyecto = Proyecto(
        nombre="Proyecto Base Scope",
        codigo="TEST-2026-050",
        codigo_root="TEST-2026-050",
        revision=0,
        estado="Planificación",
        presupuesto_estimado=Decimal("100"),
        moneda="USD",
        empresa_id=sample_empresa.id,
        base_trabajo_id=project_base.id,
    )
    db.add(proyecto)
    db.flush()

    edt = EdtNode(
        proyecto_id=proyecto.id,
        parent_id=None,
        tipo_nodo=TipoNodoEdt.CUENTA_PAQUETE,
        orden=0,
        codigo="1.1",
        nombre="Capítulo",
        empresa_id=sample_empresa.id,
    )
    db.add(edt)
    db.flush()

    presupuesto = Presupuesto(
        descripcion="Presupuesto",
        proyecto_id=proyecto.id,
        empresa_id=sample_empresa.id,
        iva_aplicado=Decimal("15.00"),
    )
    db.add(presupuesto)
    db.flush()

    linea = PresupuestoDetalle(
        presupuesto_id=presupuesto.id,
        apu_id=master_apu.id,
        edt_id=edt.id,
        descripcion=master_apu.descripcion,
        unidad=master_apu.unidad,
        cantidad=Decimal("1"),
        precio_unitario=Decimal("9.45"),
        precio_total=Decimal("9.45"),
        codigo_item="1.1.1",
        orden=0,
    )
    db.add(linea)
    db.commit()

    assert len(find_mixed_presupuesto_apu_lines(db, presupuesto_id=presupuesto.id)) == 1

    result = repair_presupuesto_apu_scope(db, presupuesto_id=presupuesto.id, commit=True)

    db.refresh(linea)
    assert result["repaired_lines"] == 1
    assert linea.apu_id == project_apu.id
    assert linea.descripcion == project_apu.descripcion
    assert linea.unidad == "m3"
    assert len(find_mixed_presupuesto_apu_lines(db, presupuesto_id=presupuesto.id)) == 0


def test_create_revision_remaps_budget_apus_to_new_revision_base(db, sample_empresa):
    unidad = _seed_unidad(db, 3, "u")
    master_base = _seed_base(db, sample_empresa.id, "BT-MASTER-REV", "Master Rev", "Base Maestra")
    project_base = _seed_base(db, sample_empresa.id, "BT-PROJECT-REV", "Project Rev", "Base de Proyecto", source_base_id=master_base.id)

    apu_subcat_master = _seed_subcat(db, sample_empresa.id, master_base.id, "5-001", "APUs", 5)
    apu_subcat_project = _seed_subcat(db, sample_empresa.id, project_base.id, "5-001", "APUs", 5)
    recurso_subcat_master = _seed_subcat(db, sample_empresa.id, master_base.id, "1-001", "Equipos", 1)
    recurso_subcat_project = _seed_subcat(db, sample_empresa.id, project_base.id, "1-001", "Equipos", 1)

    _seed_recurso(db, sample_empresa.id, master_base.id, recurso_subcat_master.id, unidad.id, "1-0001-00003", "Herramientas varias", "0.50")
    _seed_recurso(db, sample_empresa.id, project_base.id, recurso_subcat_project.id, unidad.id, "1-0001-00003", "Herramientas varias", "0.50")

    master_apu = _seed_apu(db, sample_empresa.id, master_base.id, apu_subcat_master.id, "5-002-0001", "Excavación a mano", "m3")
    _seed_apu(
        db,
        sample_empresa.id,
        project_base.id,
        apu_subcat_project.id,
        "5-002-0001",
        "Excavación a mano",
        "m3",
        source_apu_id=master_apu.id,
    )

    original = Proyecto(
        nombre="Proyecto Revision Scope",
        codigo="TEST-2026-060",
        codigo_root="TEST-2026-060",
        revision=0,
        estado="Planificación",
        presupuesto_estimado=Decimal("100"),
        moneda="USD",
        empresa_id=sample_empresa.id,
        base_trabajo_id=project_base.id,
    )
    db.add(original)
    db.flush()

    edt = EdtNode(
        proyecto_id=original.id,
        parent_id=None,
        tipo_nodo=TipoNodoEdt.CUENTA_PAQUETE,
        orden=0,
        codigo="1.1",
        nombre="Capítulo",
        empresa_id=sample_empresa.id,
    )
    db.add(edt)
    db.flush()

    presupuesto = Presupuesto(
        descripcion="Presupuesto Base",
        proyecto_id=original.id,
        empresa_id=sample_empresa.id,
        iva_aplicado=Decimal("15.00"),
    )
    db.add(presupuesto)
    db.flush()

    db.add(
        PresupuestoDetalle(
            presupuesto_id=presupuesto.id,
            apu_id=master_apu.id,
            edt_id=edt.id,
            descripcion=master_apu.descripcion,
            unidad=master_apu.unidad,
            cantidad=Decimal("1"),
            precio_unitario=Decimal("9.45"),
            precio_total=Decimal("9.45"),
            codigo_item="1.1.1",
            orden=0,
        )
    )
    db.commit()

    revision = proyecto_service.create_revision(db, original.id, sample_empresa.id)

    revision_budget = db.query(Presupuesto).filter(Presupuesto.proyecto_id == revision.id).first()
    revision_line = db.query(PresupuestoDetalle).filter(PresupuestoDetalle.presupuesto_id == revision_budget.id, PresupuestoDetalle.apu_id.isnot(None)).first()
    revision_apu = db.query(APU).filter(APU.id == revision_line.apu_id).first()

    assert revision_apu is not None
    assert revision_apu.base_trabajo_id == revision.base_trabajo_id
    assert revision_apu.codigo == "5-002-0001"
