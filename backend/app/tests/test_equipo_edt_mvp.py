from decimal import Decimal

from fastapi.testclient import TestClient

from app.api.deps import get_current_user
from app.core.database import get_db
from app.main import app
from app.models.edt import EdtNode, TipoNodoEdt
from app.models.empresa import Empresa
from app.models.presupuesto import Presupuesto, PresupuestoDetalle
from app.models.proyecto import Proyecto
from app.models.proyecto_asignacion import ProyectoAsignacion
from app.models.usuario import Usuario


def _create_company(db) -> Empresa:
    company = Empresa(
        nombre="Empresa Mockup Equipo EDT MVP",
        ruc="1892000000001",
        localidad="Cuenca",
        canton="Cuenca",
        provincia="Azuay",
        pais="Ecuador",
        telefono="0999999999",
        proy_prefijo="EQP1892",
        proy_periodo="2026",
        proy_secuencial=1,
        proy_secuencial_size=9,
    )
    db.add(company)
    db.commit()
    db.refresh(company)
    return company


def _create_user(db, *, company: Empresa, email: str, role: str) -> Usuario:
    user = Usuario(
        email=email,
        hashed_password="x",
        nombre_completo=email.split("@")[0],
        nombres="Usuario",
        apellidos="Equipo",
        alias=email.split("@")[0],
        ruc="0102030405001",
        nacionalidad="Ecuatoriana",
        profesion="Arquitecto",
        ciudad="Cuenca",
        provincia="Azuay",
        canton="Cuenca",
        pais="Ecuador",
        movil="0999999999",
        acepta_politica_privacidad=True,
        rol=role,
        empresa_id=company.id,
        activo=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _client(db, current_user_ref: dict):
    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_current_user] = lambda: current_user_ref["user"]
    return TestClient(app)


def _flatten_edt_ids(tree: list[dict]) -> set[int]:
    ids = set()
    stack = list(tree)
    while stack:
        node = stack.pop()
        ids.add(node["id"])
        stack.extend(node.get("hijos") or [])
    return ids


def _create_mock_project_with_budget(db, *, company: Empresa, admin: Usuario, collaborator: Usuario):
    project = Proyecto(
        nombre="Proyecto Equipo EDT MVP",
        codigo="EQP1892-001",
        codigo_root="EQP1892-001",
        revision=0,
        descripcion="Proyecto mock para verificar aislamiento Equipo por EDT.",
        empresa_id=company.id,
    )
    db.add(project)
    db.flush()

    root = EdtNode(
        proyecto_id=project.id,
        parent_id=None,
        tipo_nodo=TipoNodoEdt.CUENTA_PAQUETE,
        orden=0,
        codigo="1",
        nombre="Raiz proyecto",
        empresa_id=company.id,
    )
    db.add(root)
    db.flush()

    allowed_branch = EdtNode(
        proyecto_id=project.id,
        parent_id=root.id,
        tipo_nodo=TipoNodoEdt.CUENTA_PAQUETE,
        orden=0,
        codigo="1.1",
        nombre="Rama asignada Equipo",
        empresa_id=company.id,
    )
    blocked_branch = EdtNode(
        proyecto_id=project.id,
        parent_id=root.id,
        tipo_nodo=TipoNodoEdt.CUENTA_PAQUETE,
        orden=1,
        codigo="1.2",
        nombre="Rama confidencial no asignada",
        empresa_id=company.id,
    )
    db.add_all([allowed_branch, blocked_branch])
    db.flush()

    allowed_child = EdtNode(
        proyecto_id=project.id,
        parent_id=allowed_branch.id,
        tipo_nodo=TipoNodoEdt.CUENTA_PAQUETE,
        orden=0,
        codigo="1.1.1",
        nombre="Subrama visible asignada",
        empresa_id=company.id,
    )
    blocked_child = EdtNode(
        proyecto_id=project.id,
        parent_id=blocked_branch.id,
        tipo_nodo=TipoNodoEdt.CUENTA_PAQUETE,
        orden=0,
        codigo="1.2.1",
        nombre="Subrama confidencial",
        empresa_id=company.id,
    )
    db.add_all([allowed_child, blocked_child])
    db.flush()

    presupuesto = Presupuesto(
        codigo="PRE-EQP1892",
        descripcion="Presupuesto mock Equipo EDT",
        proyecto_id=project.id,
        empresa_id=company.id,
        subtotal=Decimal("300.00"),
        total=Decimal("300.00"),
    )
    db.add(presupuesto)
    db.flush()
    db.add_all(
        [
            PresupuestoDetalle(
                presupuesto_id=presupuesto.id,
                edt_id=allowed_branch.id,
                descripcion="Linea visible asignada",
                unidad="u",
                cantidad=Decimal("1.0"),
                precio_unitario=Decimal("100.0"),
                precio_total=Decimal("100.0"),
                orden=0,
            ),
            PresupuestoDetalle(
                presupuesto_id=presupuesto.id,
                edt_id=blocked_branch.id,
                descripcion="Linea confidencial no asignada",
                unidad="u",
                cantidad=Decimal("1.0"),
                precio_unitario=Decimal("200.0"),
                precio_total=Decimal("200.0"),
                orden=1,
            ),
        ]
    )
    db.add(
        ProyectoAsignacion(
            proyecto_id=project.id,
            usuario_id=collaborator.id,
            edt_id=allowed_branch.id,
            modulo="presupuestos",
            es_global=False,
            asignado_por_id=admin.id,
        )
    )
    db.commit()
    return project, presupuesto, allowed_branch, allowed_child, blocked_branch, blocked_child


def test_equipo_edt_mvp_restricts_collaborator_tree_budget_and_writes(db):
    company = _create_company(db)
    admin = _create_user(
        db,
        company=company,
        email="admin-task1892@giproy.test",
        role="administrador",
    )
    collaborator = _create_user(
        db,
        company=company,
        email="collab-task1892@giproy.test",
        role="usuario",
    )
    outsider = _create_user(
        db,
        company=company,
        email="outsider-task1892@giproy.test",
        role="usuario",
    )
    project, presupuesto, allowed_branch, allowed_child, blocked_branch, blocked_child = (
        _create_mock_project_with_budget(db, company=company, admin=admin, collaborator=collaborator)
    )

    current_user_ref = {"user": collaborator}
    try:
        with _client(db, current_user_ref) as client:
            collaborator_tree_response = client.get(f"/api/v1/edt/project/{project.id}")
            assert collaborator_tree_response.status_code == 200, collaborator_tree_response.text
            visible_ids = _flatten_edt_ids(collaborator_tree_response.json())
            assert allowed_branch.id in visible_ids
            assert allowed_child.id in visible_ids
            assert blocked_branch.id not in visible_ids
            assert blocked_child.id not in visible_ids

            collaborator_budget_response = client.get(f"/api/v1/presupuestos/{presupuesto.id}")
            assert collaborator_budget_response.status_code == 200, collaborator_budget_response.text
            visible_line_descriptions = {
                item["descripcion"] for item in collaborator_budget_response.json()["detalle"]
            }
            assert visible_line_descriptions == {"Linea visible asignada"}
            assert db.query(PresupuestoDetalle).filter(
                PresupuestoDetalle.presupuesto_id == presupuesto.id
            ).count() == 2

            blocked_write_response = client.put(
                f"/api/v1/edt/{allowed_branch.id}",
                json={"nombre": "Intento no permitido"},
            )
            assert blocked_write_response.status_code == 403

            current_user_ref["user"] = outsider
            outsider_response = client.get(f"/api/v1/edt/project/{project.id}")
            assert outsider_response.status_code == 403

            current_user_ref["user"] = admin
            admin_tree_response = client.get(f"/api/v1/edt/project/{project.id}")
            assert admin_tree_response.status_code == 200, admin_tree_response.text
            admin_visible_ids = _flatten_edt_ids(admin_tree_response.json())
            assert {allowed_branch.id, allowed_child.id, blocked_branch.id, blocked_child.id}.issubset(
                admin_visible_ids
            )
    finally:
        app.dependency_overrides.clear()
