from decimal import Decimal

from app.models.apu import APU
from app.models.base_trabajo import BaseTrabajo
from app.models.edt import EdtNode
from app.models.presupuesto import Presupuesto, PresupuestoDetalle
from app.models.edt import TipoNodoEdt
from app.models.proyecto import Proyecto
from app.repositories.edt import edt_repo
from app.schemas.edt import EdtNodeCreate, EdtNodeMove
from app.schemas.proyecto import ProyectoCreate
from app.services.presupuesto import (
    enforce_presupuesto_apu_uniqueness,
    get_or_create_operational_presupuesto,
    refresh_presupuesto_prices,
)
from app.services.proyecto import proyecto_service


def test_get_or_create_operational_presupuesto_collapses_duplicates_and_keeps_best_candidate(db, sample_empresa):
    proyecto = proyecto_service.create_proyecto(db, ProyectoCreate(nombre="Proyecto Presupuesto Duplicado"), sample_empresa.id)

    edt_node = EdtNode(
        nombre="Capítulo 1",
        proyecto_id=proyecto.id,
        codigo="1",
        orden=0,
        empresa_id=sample_empresa.id,
    )
    db.add(edt_node)
    db.flush()

    weak_budget = Presupuesto(
        descripcion="Presupuesto vacío",
        proyecto_id=proyecto.id,
        empresa_id=sample_empresa.id,
        revision=0,
        total=Decimal("0"),
    )
    strong_budget = Presupuesto(
        descripcion="Presupuesto canónico",
        proyecto_id=proyecto.id,
        empresa_id=sample_empresa.id,
        revision=0,
        total=Decimal("150"),
    )
    db.add_all([weak_budget, strong_budget])
    db.flush()

    db.add(
        PresupuestoDetalle(
            presupuesto_id=strong_budget.id,
            descripcion="Rubro principal",
            cantidad=Decimal("3"),
            precio_unitario=Decimal("50"),
            precio_total=Decimal("150"),
            edt_id=edt_node.id,
            apu_id=None,
        )
    )
    db.commit()

    canonical = get_or_create_operational_presupuesto(db, proyecto.id, sample_empresa.id)

    remaining = (
        db.query(Presupuesto)
        .filter(Presupuesto.proyecto_id == proyecto.id, Presupuesto.empresa_id == sample_empresa.id)
        .order_by(Presupuesto.id.asc())
        .all()
    )

    assert canonical.id == strong_budget.id
    assert len(remaining) == 1
    assert remaining[0].id == strong_budget.id
    assert remaining[0].descripcion == "Presupuesto canónico"
    assert len(remaining[0].indirectos) >= 11


def test_sync_presupuesto_codes_with_edt_reparents_moved_branch_and_excludes_stakeholders(db, sample_empresa):
    proyecto = proyecto_service.create_proyecto(
        db,
        ProyectoCreate(nombre="Proyecto Sync EDT Presupuesto"),
        sample_empresa.id,
    )

    root_a = edt_repo.create(
        db,
        EdtNodeCreate(
            proyecto_id=proyecto.id,
            parent_id=None,
            tipo_nodo=TipoNodoEdt.CUENTA_PAQUETE,
            nombre="Capítulo A",
        ),
        sample_empresa.id,
    )
    child_a1 = edt_repo.create(
        db,
        EdtNodeCreate(
            proyecto_id=proyecto.id,
            parent_id=root_a.id,
            tipo_nodo=TipoNodoEdt.CUENTA_PAQUETE,
            nombre="Subcapítulo A1",
        ),
        sample_empresa.id,
    )
    stakeholder = edt_repo.create(
        db,
        EdtNodeCreate(
            proyecto_id=proyecto.id,
            parent_id=root_a.id,
            tipo_nodo=TipoNodoEdt.STAKEHOLDER,
            nombre="Stakeholder interno",
        ),
        sample_empresa.id,
    )
    root_b = edt_repo.create(
        db,
        EdtNodeCreate(
            proyecto_id=proyecto.id,
            parent_id=None,
            tipo_nodo=TipoNodoEdt.CUENTA_PAQUETE,
            nombre="Capítulo B",
        ),
        sample_empresa.id,
    )

    moved = edt_repo.move(
        db,
        child_a1.id,
        EdtNodeMove(new_parent_id=root_b.id, new_orden=0),
        sample_empresa.id,
    )

    presupuesto = get_or_create_operational_presupuesto(db, proyecto.id, sample_empresa.id)

    structural_rows = (
        db.query(PresupuestoDetalle)
        .filter(
            PresupuestoDetalle.presupuesto_id == presupuesto.id,
            PresupuestoDetalle.apu_id.is_(None),
        )
        .order_by(PresupuestoDetalle.id.asc())
        .all()
    )
    rows_by_edt = {row.edt_id: row for row in structural_rows}

    assert moved.codigo == "2.1"
    assert stakeholder.id not in rows_by_edt
    assert rows_by_edt[root_a.id].codigo_item == "1"
    assert rows_by_edt[root_b.id].codigo_item == "2"
    assert rows_by_edt[child_a1.id].codigo_item == "2.1"
    assert rows_by_edt[child_a1.id].parent_id == rows_by_edt[root_b.id].id


def test_enforce_presupuesto_apu_uniqueness_merges_duplicate_operational_lines(db, sample_empresa):
    base = BaseTrabajo(
        codigo_unico="BASE-TEST-001",
        nombre="Base Test Presupuesto",
        empresa_id=sample_empresa.id,
        activa=True,
    )
    db.add(base)
    db.flush()

    proyecto = Proyecto(
        nombre="Proyecto Unicidad APU",
        empresa_id=sample_empresa.id,
        revision=0,
        base_trabajo_id=base.id,
    )
    db.add(proyecto)
    db.flush()

    edt = EdtNode(
        nombre="Capítulo 1",
        proyecto_id=proyecto.id,
        codigo="1.1",
        orden=0,
        empresa_id=sample_empresa.id,
        tipo_nodo=TipoNodoEdt.CUENTA_PAQUETE,
    )
    db.add(edt)
    db.flush()

    apu = APU(
        codigo="5-001-0001",
        descripcion="Replanteo y nivelación",
        descripcion_normalizada="replanteo y nivelacion",
        unidad="m2",
        costo_directo=Decimal("1.04"),
        precio_unitario_total=Decimal("1.04"),
        empresa_id=sample_empresa.id,
        base_trabajo_id=base.id,
        revision=0,
    )
    db.add(apu)
    db.flush()

    presupuesto = Presupuesto(
        descripcion="Presupuesto Test",
        proyecto_id=proyecto.id,
        empresa_id=sample_empresa.id,
        revision=0,
        total=Decimal("0"),
    )
    db.add(presupuesto)
    db.flush()

    db.add_all([
        PresupuestoDetalle(
            presupuesto_id=presupuesto.id,
            edt_id=edt.id,
            apu_id=apu.id,
            codigo_item="1.1.1",
            descripcion=apu.descripcion,
            unidad="m2",
            cantidad=Decimal("112.62"),
            precio_unitario=Decimal("1.04"),
            precio_total=Decimal("117.12"),
            orden=0,
            notas="nota 1",
        ),
        PresupuestoDetalle(
            presupuesto_id=presupuesto.id,
            edt_id=edt.id,
            apu_id=apu.id,
            codigo_item="1.1.11",
            descripcion=apu.descripcion,
            unidad="m2",
            cantidad=Decimal("1.00"),
            precio_unitario=Decimal("1.04"),
            precio_total=Decimal("1.04"),
            orden=10,
            notas="nota 2",
        ),
    ])
    db.commit()

    result = enforce_presupuesto_apu_uniqueness(db, presupuesto.id)

    remaining = (
        db.query(PresupuestoDetalle)
        .filter(
            PresupuestoDetalle.presupuesto_id == presupuesto.id,
            PresupuestoDetalle.edt_id == edt.id,
            PresupuestoDetalle.apu_id == apu.id,
        )
        .order_by(PresupuestoDetalle.id.asc())
        .all()
    )

    assert result["merged_groups"] == 1
    assert result["merged_lines"] == 1
    assert len(remaining) == 1
    assert remaining[0].codigo_item == "1.1.1"
    assert remaining[0].cantidad == Decimal("113.62")
    assert "nota 1" in (remaining[0].notas or "")
    assert "nota 2" in (remaining[0].notas or "")


def test_refresh_presupuesto_prices_self_heals_duplicate_apu_rows(db, sample_empresa):
    base = BaseTrabajo(
        codigo_unico="BASE-TEST-002",
        nombre="Base Test Refresh",
        empresa_id=sample_empresa.id,
        activa=True,
    )
    db.add(base)
    db.flush()

    proyecto = Proyecto(
        nombre="Proyecto Refresh Presupuesto",
        empresa_id=sample_empresa.id,
        revision=0,
        base_trabajo_id=base.id,
    )
    db.add(proyecto)
    db.flush()

    edt = EdtNode(
        nombre="Capítulo 2",
        proyecto_id=proyecto.id,
        codigo="2.1",
        orden=0,
        empresa_id=sample_empresa.id,
        tipo_nodo=TipoNodoEdt.CUENTA_PAQUETE,
    )
    db.add(edt)
    db.flush()

    apu = APU(
        codigo="5-001-0002",
        descripcion="Excavación manual",
        descripcion_normalizada="excavacion manual",
        unidad="m3",
        costo_directo=Decimal("9.45"),
        precio_unitario_total=Decimal("9.45"),
        empresa_id=sample_empresa.id,
        base_trabajo_id=base.id,
        revision=0,
    )
    db.add(apu)
    db.flush()

    presupuesto = Presupuesto(
        descripcion="Presupuesto Refresh",
        proyecto_id=proyecto.id,
        empresa_id=sample_empresa.id,
        revision=0,
        total=Decimal("0"),
    )
    db.add(presupuesto)
    db.flush()

    db.add_all([
        PresupuestoDetalle(
            presupuesto_id=presupuesto.id,
            edt_id=edt.id,
            apu_id=apu.id,
            codigo_item="2.1.1",
            descripcion=apu.descripcion,
            unidad="m3",
            cantidad=Decimal("1"),
            precio_unitario=Decimal("9.45"),
            precio_total=Decimal("9.45"),
            orden=0,
        ),
        PresupuestoDetalle(
            presupuesto_id=presupuesto.id,
            edt_id=edt.id,
            apu_id=apu.id,
            codigo_item="2.1.2",
            descripcion=apu.descripcion,
            unidad="m3",
            cantidad=Decimal("2"),
            precio_unitario=Decimal("9.45"),
            precio_total=Decimal("18.90"),
            orden=1,
        ),
    ])
    db.commit()

    refresh_presupuesto_prices(db, presupuesto.id)

    remaining = (
        db.query(PresupuestoDetalle)
        .filter(
            PresupuestoDetalle.presupuesto_id == presupuesto.id,
            PresupuestoDetalle.edt_id == edt.id,
            PresupuestoDetalle.apu_id == apu.id,
        )
        .all()
    )

    assert len(remaining) == 1
    assert remaining[0].cantidad == Decimal("3")
    assert remaining[0].precio_total == Decimal("28.35")
