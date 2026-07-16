from datetime import date, timedelta
from decimal import Decimal

from fastapi.testclient import TestClient

from app.api.deps import get_current_active_user, get_current_user
from app.core.database import get_db
from app.main import app
from app.models.edt import EdtNode, TipoNodoEdt
from app.models.empresa import Empresa
from app.models.empresa_licencia import EmpresaLicencia
from app.models.licencia import Licencia
from app.models.license_event import LicenseEvent
from app.models.presupuesto import Presupuesto, PresupuestoDetalle
from app.models.proyecto import Proyecto
from app.models.proyecto_asignacion import ProyectoAsignacion
from app.models.saas_equipo import SaasEquipoEdtAssignment, SaasEquipoSeat
from app.models.usuario import Usuario


def _create_company(db) -> Empresa:
    company = Empresa(
        nombre="Empresa Mockup Equipo Operativo",
        ruc="1893000000001",
        localidad="Cuenca",
        canton="Cuenca",
        provincia="Azuay",
        pais="Ecuador",
        telefono="0999999999",
        proy_prefijo="EQP1893",
        proy_periodo="2026",
        proy_secuencial=1,
        proy_secuencial_size=9,
    )
    db.add(company)
    db.commit()
    db.refresh(company)
    return company


def _create_license_assignment(db, empresa_id: int) -> None:
    license_ = Licencia(
        nombre="Profesional Equipo Mock",
        codigo=f"PRO_TEAM_{empresa_id}",
        descripcion="Licencia focal para Equipo.",
        plan_kind="profesional",
        limites={
            "usuarios": 5,
            "administradores": 1,
            "usuarios_normales": 4,
            "modulos_permitidos": ["apus", "presupuestos"],
            "packs_incluidos": ["PACK_PLANIFICA", "PACK_LICITA"],
            "packs_opcionales": ["PACK_CONECTA", "PACK_EQUIPO"],
            "team_pack_available": True,
            "equipo_base_slots": 1,
            "excel_exports": True,
        },
        activo=True,
    )
    db.add(license_)
    db.flush()
    db.add(
        EmpresaLicencia(
            empresa_id=empresa_id,
            licencia_id=license_.id,
            starts_at=date.today() - timedelta(days=1),
            ends_at=date.today() + timedelta(days=30),
            status="active",
            activa=True,
        )
    )
    db.commit()


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
    app.dependency_overrides[get_current_active_user] = lambda: current_user_ref["user"]
    return TestClient(app)


def _flatten_edt_ids(tree: list[dict]) -> set[int]:
    ids = set()
    stack = list(tree)
    while stack:
        node = stack.pop()
        ids.add(node["id"])
        stack.extend(node.get("hijos") or [])
    return ids


def _create_project(db, *, company: Empresa):
    project = Proyecto(
        nombre="Proyecto Equipo Operativo",
        codigo="EQP1893-001",
        codigo_root="EQP1893-001",
        revision=0,
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
        nombre="Raiz Equipo",
        empresa_id=company.id,
    )
    db.add(root)
    db.flush()
    allowed = EdtNode(
        proyecto_id=project.id,
        parent_id=root.id,
        tipo_nodo=TipoNodoEdt.CUENTA_PAQUETE,
        orden=0,
        codigo="1.1",
        nombre="Rama Equipo asignada",
        empresa_id=company.id,
    )
    blocked = EdtNode(
        proyecto_id=project.id,
        parent_id=root.id,
        tipo_nodo=TipoNodoEdt.CUENTA_PAQUETE,
        orden=1,
        codigo="1.2",
        nombre="Rama Equipo bloqueada",
        empresa_id=company.id,
    )
    db.add_all([allowed, blocked])
    db.flush()
    budget = Presupuesto(
        codigo="PRE-EQP1893",
        descripcion="Presupuesto Equipo Operativo",
        proyecto_id=project.id,
        empresa_id=company.id,
        subtotal=Decimal("300.00"),
        total=Decimal("300.00"),
    )
    db.add(budget)
    db.flush()
    visible_line = PresupuestoDetalle(
        presupuesto_id=budget.id,
        edt_id=allowed.id,
        descripcion="Linea Equipo visible",
        unidad="u",
        cantidad=Decimal("1.0"),
        precio_unitario=Decimal("100.0"),
        precio_total=Decimal("100.0"),
        orden=0,
    )
    hidden_line = PresupuestoDetalle(
        presupuesto_id=budget.id,
        edt_id=blocked.id,
        descripcion="Linea Equipo oculta",
        unidad="u",
        cantidad=Decimal("1.0"),
        precio_unitario=Decimal("200.0"),
        precio_total=Decimal("200.0"),
        orden=1,
    )
    db.add_all([visible_line, hidden_line])
    db.commit()
    return project, allowed, blocked, budget, visible_line


def test_equipo_full_backend_flow_assigns_scope_locks_approves_and_revokes(db):
    company = _create_company(db)
    _create_license_assignment(db, company.id)
    admin = _create_user(db, company=company, email="admin-task1893@giproy.test", role="administrador")
    collaborator = _create_user(db, company=company, email="collab-task1893@giproy.test", role="usuario")
    other_user = _create_user(db, company=company, email="other-task1893@giproy.test", role="usuario")
    project, allowed, blocked, budget, visible_line = _create_project(db, company=company)
    project_id = project.id
    allowed_id = allowed.id
    blocked_id = blocked.id
    visible_line_id = visible_line.id

    current_user_ref = {"user": admin}
    try:
        with _client(db, current_user_ref) as client:
            limits_response = client.get("/api/v1/equipo/limits")
            assert limits_response.status_code == 200, limits_response.text
            assert limits_response.json()["total_slots"] == 1

            seat_response = client.post(
                "/api/v1/equipo/seats",
                json={"collaborator_user_id": collaborator.id},
            )
            assert seat_response.status_code == 200, seat_response.text
            seat_id = seat_response.json()["id"]
            assert seat_response.json()["source_right_code"] == "PACK_EQUIPO"

            assignment_response = client.post(
                "/api/v1/equipo/assignments",
                json={
                    "seat_id": seat_id,
                    "proyecto_id": project_id,
                    "edt_id": allowed_id,
                    "modulo": "presupuestos",
                },
            )
            assert assignment_response.status_code == 200, assignment_response.text
            assignment_id = assignment_response.json()["id"]
            assert db.query(ProyectoAsignacion).filter(
                ProyectoAsignacion.proyecto_id == project_id,
                ProyectoAsignacion.usuario_id == collaborator.id,
                ProyectoAsignacion.edt_id == allowed_id,
            ).count() == 1

            context_response = client.get(f"/api/v1/equipo/context?empresa_id={company.id}&proyecto_id={project_id}")
            assert context_response.status_code == 200, context_response.text
            context_payload = context_response.json()
            assert {user["id"] for user in context_payload["users"]} == {admin.id, collaborator.id, other_user.id}
            assert [project_row["id"] for project_row in context_payload["projects"]] == [project_id]
            assert {node["id"] for node in context_payload["edt_nodes"]} == {allowed_id, blocked_id, allowed.parent_id}

            current_user_ref["user"] = collaborator
            tree_response = client.get(f"/api/v1/edt/project/{project_id}")
            assert tree_response.status_code == 200, tree_response.text
            visible_edt_ids = _flatten_edt_ids(tree_response.json())
            assert allowed_id in visible_edt_ids
            assert blocked_id not in visible_edt_ids

            lock_response = client.post(
                "/api/v1/equipo/locks",
                json={
                    "proyecto_id": project_id,
                    "edt_id": allowed_id,
                    "presupuesto_linea_id": visible_line_id,
                    "reason": "Trabajo focal Equipo",
                },
            )
            assert lock_response.status_code == 200, lock_response.text
            lock_id = lock_response.json()["id"]

            current_user_ref["user"] = collaborator
            proposal_response = client.post(
                "/api/v1/equipo/proposals",
                json={
                    "proyecto_id": project_id,
                    "edt_id": allowed_id,
                    "presupuesto_linea_id": visible_line_id,
                    "title": "Ajuste colaborativo focal",
                    "proposed_changes": {"cantidad": "2.0", "descripcion": "Linea Equipo aprobada"},
                },
            )
            assert proposal_response.status_code == 200, proposal_response.text
            proposal_id = proposal_response.json()["id"]
            assert proposal_response.json()["status"] == "pending"

            current_user_ref["user"] = admin
            operations_response = client.get(f"/api/v1/equipo/operations?empresa_id={company.id}")
            assert operations_response.status_code == 200, operations_response.text
            operations_payload = operations_response.json()
            assert operations_payload["empresa_id"] == company.id
            assert [seat["id"] for seat in operations_payload["seats"]] == [seat_id]
            assert [assignment["id"] for assignment in operations_payload["assignments"]] == [assignment_id]
            assert [lock["id"] for lock in operations_payload["locks"]] == [lock_id]
            assert [proposal["id"] for proposal in operations_payload["proposals"]] == [proposal_id]

            review_response = client.post(
                f"/api/v1/equipo/proposals/{proposal_id}/review",
                json={"approve": True, "notes": "Aprobado en flujo focal."},
            )
            assert review_response.status_code == 200, review_response.text
            assert review_response.json()["status"] == "approved"
            updated_line = db.query(PresupuestoDetalle).filter(PresupuestoDetalle.id == visible_line_id).one()
            assert updated_line.descripcion == "Linea Equipo aprobada"
            assert updated_line.cantidad == Decimal("2.000000")
            assert updated_line.precio_total == Decimal("200.000000")

            release_lock = client.post(f"/api/v1/equipo/locks/{lock_id}/release", json={})
            assert release_lock.status_code == 200, release_lock.text

            revoke_response = client.post(
                f"/api/v1/equipo/assignments/{assignment_id}/revoke",
                json={"reason": "Fin de alcance focal."},
            )
            assert revoke_response.status_code == 200, revoke_response.text
            assert revoke_response.json()["status"] == "revoked"

            current_user_ref["user"] = collaborator
            revoked_tree = client.get(f"/api/v1/edt/project/{project_id}")
            assert revoked_tree.status_code == 403
    finally:
        app.dependency_overrides.clear()

    assert db.query(SaasEquipoSeat).filter(SaasEquipoSeat.empresa_id == company.id).count() == 1
    assert db.query(SaasEquipoEdtAssignment).filter(SaasEquipoEdtAssignment.id == assignment_id).one().status == "revoked"
    events = {
        row.event_type
        for row in db.query(LicenseEvent).filter(LicenseEvent.empresa_id == company.id).all()
    }
    assert {
        "saas_equipo_seat_assigned",
        "saas_equipo_edt_assigned",
        "saas_equipo_lock_acquired",
        "saas_equipo_proposal_submitted",
        "saas_equipo_proposal_reviewed",
        "saas_equipo_edt_revoked",
    }.issubset(events)
