from fastapi.testclient import TestClient

from app.api.deps import get_current_active_user
from app.core.database import get_db
from app.main import app
from app.models.apu import APU
from app.models.base_trabajo import BaseTrabajo
from app.models.edt import EdtNode
from app.models.empresa import Empresa
from app.models.presupuesto import Presupuesto, PresupuestoDetalle
from app.models.recurso import Recurso
from app.models.unidad import Unidad
from app.models.usuario import Usuario


def _seed_admin_generales(db):
    empresa = Empresa(
        nombre="Administradores Generales",
        ruc="9999999990001",
        proy_prefijo="AG",
        proy_periodo="2026",
        proy_secuencial=1,
        proy_secuencial_size=4,
    )
    db.add(empresa)
    db.flush()

    for category_code in range(1, 6):
        db.add(Unidad(
            descripcion="u",
            descripcion_completa="Unidad",
            subcategoria_codigo=category_code,
            es_global=True,
        ))

    user = Usuario(
        email="superadmin@giproy.test",
        hashed_password="x",
        nombre_completo="Super Admin",
        rol="superadministrador",
        empresa_id=empresa.id,
        empresa=empresa,
        activo=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return empresa, user


def test_project_public_procurement_materialize_creates_classic_project_stack(db):
    empresa, current_user = _seed_admin_generales(db)
    payload = {
        "project_name": "Licitacion de prueba",
        "import_analysis": {
            "source_filename": "fuente.pdf",
            "rubros": [
                {
                    "codigo": "001",
                    "descripcion": "Excavacion manual",
                    "unidad": "u",
                    "cantidad": 2,
                    "precio_unitario": 10,
                    "precio_total": 20,
                    "capitulo": "Obras preliminares",
                },
                {
                    "codigo": "002",
                    "descripcion": "Relleno compactado",
                    "unidad": "u",
                    "cantidad": 3,
                    "precio_unitario": 5,
                    "precio_total": 15,
                    "capitulo": "Movimiento de tierras",
                },
            ],
            "analysis_bundle": {
                "resources": [
                    {
                        "temp_id": "r1",
                        "codigo": "MAT-001",
                        "descripcion": "Material importado",
                        "unidad": "u",
                        "precio_unitario": 4,
                        "resource_type": "material",
                    }
                ],
                "apus": [
                    {
                        "codigo": "001",
                        "descripcion": "Excavacion manual",
                        "unidad": "u",
                        "precio_unitario": 10,
                        "resources": [
                            {
                                "temp_id": "r1",
                                "cantidad": 1,
                                "precio_unitario": 4,
                            }
                        ],
                    }
                ],
            },
        },
    }

    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_current_active_user] = lambda: current_user
    try:
        with TestClient(app) as client:
            response = client.post("/api/v1/proyectos/public-procurement-import/materialize", json=payload)
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 201, response.text
    data = response.json()["materialization"]
    assert data["codigo"] == "AG-2026-0001"
    assert data["summary"]["rubros_count"] == 2
    assert data["summary"]["chapters_count"] == 2
    assert data["summary"]["apus_count"] == 2
    assert data["summary"]["resources_count"] == 1

    assert db.query(BaseTrabajo).filter(BaseTrabajo.empresa_id == empresa.id).count() == 1
    assert db.query(EdtNode).filter(EdtNode.proyecto_id == data["proyecto_id"]).count() == 2
    assert db.query(APU).filter(APU.base_trabajo_id == data["base_trabajo_id"]).count() == 2
    assert db.query(Recurso).filter(Recurso.base_trabajo_id == data["base_trabajo_id"]).count() == 1

    presupuesto = db.query(Presupuesto).filter(Presupuesto.id == data["presupuesto_id"]).one()
    assert float(presupuesto.subtotal) == 35.0
    assert db.query(PresupuestoDetalle).filter(
        PresupuestoDetalle.presupuesto_id == presupuesto.id,
        PresupuestoDetalle.apu_id.isnot(None),
    ).count() == 2


def test_project_public_procurement_materialize_rolls_back_without_budget_rows(db):
    empresa, current_user = _seed_admin_generales(db)

    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_current_active_user] = lambda: current_user
    try:
        with TestClient(app) as client:
            response = client.post(
                "/api/v1/proyectos/public-procurement-import/materialize",
                json={"import_analysis": {"rubros": []}},
            )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 400
    assert db.query(BaseTrabajo).filter(BaseTrabajo.empresa_id == empresa.id).count() == 0
