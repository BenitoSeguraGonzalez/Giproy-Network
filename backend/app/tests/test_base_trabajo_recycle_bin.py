from fastapi.testclient import TestClient

from app.api.deps import get_current_active_user
from app.core.database import get_db
from app.main import app
from app.models.base_trabajo import BaseTrabajo
from app.models.usuario import Usuario
from app.repositories.base_trabajo import base_trabajo_repo
from app.schemas.base_trabajo import BaseTrabajoCreate


def _admin_user(db, empresa_id: int) -> Usuario:
    user = Usuario(
        email="admin-base-trash@giproy.test",
        hashed_password="x",
        nombre_completo="Admin Base Trash",
        rol="administrador",
        empresa_id=empresa_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def test_base_trabajo_delete_moves_to_recycle_bin_restore_and_purge(db, sample_empresa):
    company_id = sample_empresa.id
    current_user = _admin_user(db, company_id)
    base = base_trabajo_repo.create(
        db,
        BaseTrabajoCreate(
            nombre="Base Maestra Papelera",
            codigo_unico="BT-PAPELERA-001",
            tipo="Base Maestra",
            activa=True,
        ),
        company_id,
    )
    base_id = base.id

    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_current_active_user] = lambda: current_user
    try:
        with TestClient(app) as client:
            delete_response = client.delete(f"/api/v1/bases-trabajo/{base_id}?empresa_id={company_id}")
            normal_list = client.get(f"/api/v1/bases-trabajo/?empresa_id={company_id}")
            recycle_list = client.get(f"/api/v1/bases-trabajo/papelera?empresa_id={company_id}")
            restore_response = client.post(f"/api/v1/bases-trabajo/papelera/{base_id}/restore?empresa_id={company_id}")
            delete_again_response = client.delete(f"/api/v1/bases-trabajo/{base_id}?empresa_id={company_id}")
            purge_response = client.delete(f"/api/v1/bases-trabajo/papelera/{base_id}/purge?empresa_id={company_id}")
    finally:
        app.dependency_overrides.clear()

    assert delete_response.status_code == 200, delete_response.text
    deleted_payload = delete_response.json()
    assert deleted_payload["deleted_at"] is not None
    assert deleted_payload["recycle_expires_at"] is not None
    assert deleted_payload["trash_original_nombre"] == "Base Maestra Papelera"
    assert deleted_payload["trash_original_codigo_unico"] == "BT-PAPELERA-001"
    assert deleted_payload["activa"] is False

    assert normal_list.status_code == 200, normal_list.text
    assert all(item["id"] != base_id for item in normal_list.json())
    assert recycle_list.status_code == 200, recycle_list.text
    assert any(item["id"] == base_id for item in recycle_list.json())

    assert restore_response.status_code == 200, restore_response.text
    restored_payload = restore_response.json()
    assert restored_payload["nombre"] == "Base Maestra Papelera"
    assert restored_payload["codigo_unico"] == "BT-PAPELERA-001"
    assert restored_payload["deleted_at"] is None

    assert delete_again_response.status_code == 200, delete_again_response.text
    assert purge_response.status_code == 204, purge_response.text
    assert db.query(BaseTrabajo).filter(BaseTrabajo.id == base_id).first() is None
