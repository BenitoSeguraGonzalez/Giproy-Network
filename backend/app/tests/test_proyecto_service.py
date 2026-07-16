import pytest
from app.services.proyecto import proyecto_service
from app.schemas.proyecto import ProyectoCreate
from app.models.proyecto import Proyecto
from app.models.base_trabajo import BaseTrabajo

def test_create_proyecto_basic(db, sample_empresa):
    """Prueba la creación básica de un proyecto y generación de código"""
    proyecto_in = ProyectoCreate(
        nombre="Proyecto Alpha",
        descripcion="Descripción del proyecto alpha",
        moneda="USD",
        presupuesto_estimado=10000.0,
        source_base_id=None
    )
    
    nuevo_proyecto = proyecto_service.create_proyecto(db, proyecto_in, sample_empresa.id)
    
    assert nuevo_proyecto.nombre == "Proyecto Alpha"
    assert nuevo_proyecto.empresa_id == sample_empresa.id
    # Código esperado: TEST-2026-001 (basado en proy_prefijo, proy_periodo y proy_secuencial=1)
    assert nuevo_proyecto.codigo == "TEST-2026-001"
    assert nuevo_proyecto.codigo_root == "TEST-2026-001"
    assert nuevo_proyecto.revision == 0

def test_create_proyecto_secuencial_increment(db, sample_empresa):
    """Prueba que el secuencial se incremente correctamente"""
    proyecto1_in = ProyectoCreate(nombre="P1")
    proyecto2_in = ProyectoCreate(nombre="P2")
    
    p1 = proyecto_service.create_proyecto(db, proyecto1_in, sample_empresa.id)
    p2 = proyecto_service.create_proyecto(db, proyecto2_in, sample_empresa.id)
    
    assert p1.codigo == "TEST-2026-001"
    assert p2.codigo == "TEST-2026-002"
    
    # Verificar que la empresa haya actualizado su secuencial
    db.refresh(sample_empresa)
    assert sample_empresa.proy_secuencial == 3

def test_get_projects_roots_uses_subtotal_for_sole_presupuesto_total(db, sample_empresa):
    from app.models.presupuesto import Presupuesto
    from app.models.usuario import Usuario

    proyecto_in = ProyectoCreate(nombre="Proyecto Presupuesto Visible")
    proyecto = proyecto_service.create_proyecto(db, proyecto_in, sample_empresa.id)

    presupuesto = db.query(Presupuesto).filter(Presupuesto.proyecto_id == proyecto.id).first()
    presupuesto.subtotal = 100
    presupuesto.indirectos_total = 21
    presupuesto.impuestos = 18.15
    presupuesto.total = 139.15
    db.add(presupuesto)
    db.commit()

    current_user = Usuario(
        email="admin@test.local",
        hashed_password="x",
        nombre_completo="Admin Test",
        rol="administrador",
        empresa_id=sample_empresa.id,
    )
    db.add(current_user)
    db.commit()
    db.refresh(current_user)

    roots = proyecto_service.get_projects_roots(db, current_user, sample_empresa.id)
    root = next(item for item in roots if item.id == proyecto.id)
    assert root.sole_presupuesto_total == 100.0

def test_create_proyecto_with_invalid_empresa(db):
    """Prueba que falle si la empresa no existe"""
    proyecto_in = ProyectoCreate(nombre="Fail")
    with pytest.raises(ValueError, match="Empresa no encontrada"):
        proyecto_service.create_proyecto(db, proyecto_in, 9999)

def test_create_revision(db, sample_empresa):
    """Prueba la creación de una revisión (clonación completa)"""
    from app.models.presupuesto import Presupuesto, PresupuestoDetalle, PresupuestoIndirecto
    from app.models.cronograma_trabajo import CronogramaTrabajo
    from app.models.edt import EdtNode, TipoNodoEdt

    # 1. Crear proyecto original con un presupuesto y un detalle
    proyecto_in = ProyectoCreate(nombre="Proyecto Raiz")
    original = proyecto_service.create_proyecto(db, proyecto_in, sample_empresa.id)
    
    # Simular EDT y Presupuesto
    edt_node = EdtNode(
        nombre="Cap 1",
        proyecto_id=original.id,
        codigo="1",
        orden=0,
        empresa_id=sample_empresa.id,
        tipo_nodo=TipoNodoEdt.CUENTA_PAQUETE,
    )
    db.add(edt_node)
    db.flush()
    
    presupuesto = Presupuesto(
        descripcion="Presupuesto Base",
        proyecto_id=original.id,
        empresa_id=sample_empresa.id,
        total=500.0
    )
    db.add(presupuesto)
    db.flush()
    
    detalle = PresupuestoDetalle(
        presupuesto_id=presupuesto.id,
        descripcion="Rubro 1",
        cantidad=10.0,
        precio_unitario=50.0,
        precio_total=500.0,
        edt_id=edt_node.id
    )
    db.add(detalle)
    detalle_dependiente = PresupuestoDetalle(
        presupuesto_id=presupuesto.id,
        descripcion="Rubro 2",
        cantidad=5.0,
        precio_unitario=20.0,
        precio_total=100.0,
        edt_id=edt_node.id,
        orden=1,
    )
    db.add(detalle_dependiente)
    db.flush()
    db.add(
        CronogramaTrabajo(
            presupuesto_id=presupuesto.id,
            proyecto_id=original.id,
            empresa_id=sample_empresa.id,
            schedule_data={
                "__config__": {"jornada_laboral_horas": 8.0},
                str(detalle.id): {
                    "duration": 1.0,
                    "predecessors": [],
                    "dependencies": [],
                    "metadata": {
                        "gantt_subbars": [
                            {"budget_line_id": detalle.id, "percent": 100.0}
                        ]
                    },
                },
                str(detalle_dependiente.id): {
                    "duration": 2.0,
                    "predecessors": [detalle.id],
                    "dependencies": [
                        {
                            "source_id": detalle.id,
                            "target_id": detalle_dependiente.id,
                            "type": "FS",
                            "lag_days": 0.0,
                            "lag_unit": "day",
                            "lag_mode": "duration",
                            "metadata": {"budget_line_id": detalle_dependiente.id},
                        }
                    ],
                },
            },
        )
    )
    indirecto = PresupuestoIndirecto(
        presupuesto_id=presupuesto.id,
        empresa_id=sample_empresa.id,
        concepto_codigo="IND-001",
        categoria_codigo="ADM",
        nombre="Administración",
        porcentaje=21.0,
        observaciones="",
        fijo=False,
        usuario=False,
        custom=False,
    )
    db.add(indirecto)
    db.commit()
    
    # 2. Crear revisión
    revision = proyecto_service.create_revision(db, original.id, sample_empresa.id)
    
    assert revision.id != original.id
    assert revision.revision == 1
    assert revision.codigo_root == original.codigo
    assert "R001" in revision.codigo
    
    # 3. Verificar que se clonó el presupuesto
    rev_presupuestos = db.query(Presupuesto).filter(Presupuesto.proyecto_id == revision.id).all()
    assert len(rev_presupuestos) == 1
    assert rev_presupuestos[0].descripcion == "Presupuesto Base"
    
    # 4. Verificar que se clonaron los detalles
    rev_detalles = (
        db.query(PresupuestoDetalle)
        .filter(PresupuestoDetalle.presupuesto_id == rev_presupuestos[0].id)
        .order_by(PresupuestoDetalle.id.asc())
        .all()
    )
    assert len(rev_detalles) == 3
    package_line = next(det for det in rev_detalles if det.parent_id is None)
    item_line = next(det for det in rev_detalles if det.descripcion == "Rubro 1")
    item_line_2 = next(det for det in rev_detalles if det.descripcion == "Rubro 2")
    assert package_line.descripcion == "Cap 1"
    assert item_line.precio_total == 500.0
    assert item_line.edt_id != edt_node.id
    assert item_line.parent_id == package_line.id
    assert item_line_2.parent_id == package_line.id

    rev_cronograma = db.query(CronogramaTrabajo).filter(CronogramaTrabajo.presupuesto_id == rev_presupuestos[0].id).one()
    rev_schedule_data = rev_cronograma.schedule_data or {}
    assert str(item_line.id) in rev_schedule_data
    assert str(item_line_2.id) in rev_schedule_data
    assert rev_schedule_data[str(item_line_2.id)]["predecessors"] == [item_line.id]
    assert rev_schedule_data[str(item_line_2.id)]["dependencies"][0]["source_id"] == item_line.id
    assert rev_schedule_data[str(item_line_2.id)]["dependencies"][0]["target_id"] == item_line_2.id
    assert rev_schedule_data[str(item_line.id)]["metadata"]["gantt_subbars"][0]["budget_line_id"] == item_line.id

    rev_edt_nodes = db.query(EdtNode).filter(EdtNode.proyecto_id == revision.id).all()
    assert len(rev_edt_nodes) == 1
    assert rev_edt_nodes[0].codigo == "1"
    assert rev_edt_nodes[0].nombre == "Cap 1"

    rev_indirectos = db.query(PresupuestoIndirecto).filter(PresupuestoIndirecto.presupuesto_id == rev_presupuestos[0].id).all()
    assert len(rev_indirectos) >= 1
    cloned_indirecto = next(item for item in rev_indirectos if item.concepto_codigo == "IND-001")
    assert float(cloned_indirecto.porcentaje or 0) == 21.0


def test_delete_revision_keeps_root_revision(db, sample_empresa):
    from app.models.presupuesto import Presupuesto
    from app.models.proyecto import Proyecto
    from app.models.base_trabajo import BaseTrabajo
    from app.models.unidad import Unidad
    from app.models.cronograma import CronogramaValorado
    from app.models.cronograma_trabajo import CronogramaTrabajo

    proyecto_in = ProyectoCreate(nombre="Proyecto Revisionable")
    original = proyecto_service.create_proyecto(db, proyecto_in, sample_empresa.id)
    revision = proyecto_service.create_revision(db, original.id, sample_empresa.id)

    original_id = original.id
    revision_id = revision.id
    revision_base_id = revision.base_trabajo_id

    revision_budget = db.query(Presupuesto).filter(Presupuesto.proyecto_id == revision_id).first()
    db.add(
        Unidad(
            descripcion="m2",
            descripcion_completa="Metro cuadrado",
            subcategoria_codigo=5,
            es_global=False,
            base_trabajo_id=revision_base_id,
            empresa_id=sample_empresa.id,
        )
    )
    db.add(
        CronogramaValorado(
            empresa_id=sample_empresa.id,
            proyecto_id=revision_id,
            presupuesto_id=revision_budget.id,
            period_type="mensual",
            distribution_mode="homogeneo",
            global_distribution=[],
            line_distribution_overrides={},
        )
    )
    db.add(
        CronogramaTrabajo(
            empresa_id=sample_empresa.id,
            proyecto_id=revision_id,
            presupuesto_id=revision_budget.id,
            schedule_data={},
        )
    )
    db.commit()

    success = proyecto_service.delete_revision(db, revision_id, sample_empresa.id)
    assert success is True

    assert db.query(Proyecto).filter(Proyecto.id == original_id).first() is not None
    assert db.query(Proyecto).filter(Proyecto.id == revision_id).first() is None
    assert db.query(Presupuesto).filter(Presupuesto.proyecto_id == revision_id).count() == 0
    assert db.query(BaseTrabajo).filter(BaseTrabajo.id == revision_base_id).first() is None
    assert db.query(Unidad).filter(Unidad.base_trabajo_id == revision_base_id).count() == 0
    assert db.query(CronogramaValorado).filter(CronogramaValorado.proyecto_id == revision_id).count() == 0
    assert db.query(CronogramaTrabajo).filter(CronogramaTrabajo.proyecto_id == revision_id).count() == 0


def test_delete_revision_rejects_root_revision(db, sample_empresa):
    proyecto_in = ProyectoCreate(nombre="Proyecto Base Protegido")
    original = proyecto_service.create_proyecto(db, proyecto_in, sample_empresa.id)

    with pytest.raises(ValueError, match="R000"):
        proyecto_service.delete_revision(db, original.id, sample_empresa.id)
