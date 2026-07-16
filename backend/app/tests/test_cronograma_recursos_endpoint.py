from types import SimpleNamespace

from app.schemas.cronograma import CronogramaRecursosStateUpdate
from app.api.endpoints import cronogramas


def test_read_cronograma_recursos_endpoint_uses_existing_tenant_and_access(monkeypatch):
    current_user = SimpleNamespace(id=9, empresa_id=3, rol="administrador")
    presupuesto = SimpleNamespace(id=77, proyecto_id=44, empresa_id=3)
    cronograma = SimpleNamespace(id=5)
    serialized = SimpleNamespace(period_type="mensual", distribution_mode="gantt")
    calls = {}

    def fake_resolve_budget(db, presupuesto_id, user, empresa_id):
        calls["resolve_budget"] = {
            "presupuesto_id": presupuesto_id,
            "user_id": user.id,
            "empresa_id": empresa_id,
        }
        return presupuesto

    def fake_verify_access(db, proyecto_id, user_id):
        calls["verify_access"] = {"proyecto_id": proyecto_id, "user_id": user_id}

    def fake_build_demand(db, resolved_presupuesto, resolved_cronograma, empresa_id):
        calls["build_demand"] = {
            "presupuesto_id": resolved_presupuesto.id,
            "cronograma": resolved_cronograma,
            "empresa_id": empresa_id,
        }
        return {
            "source": "cronograma_valorado",
            "mode": "read_only",
            "presupuesto_id": resolved_presupuesto.id,
            "empresa_id": empresa_id,
            "period_type": "mensual",
            "distribution_mode": "gantt",
            "periodos": [{"periodo_id": "P1", "label": "P1", "cantidad": 1.0, "costo": 10.0}],
            "recursos": [],
            "summary": {"recursos": 0, "periodos": 1, "cantidad_total": 0.0, "costo_total": 0.0},
        }

    monkeypatch.setattr(cronogramas, "_resolve_budget", fake_resolve_budget)
    monkeypatch.setattr(cronogramas, "_verify_module_access", fake_verify_access)
    monkeypatch.setattr(cronogramas, "_get_or_create_cronograma", lambda db, resolved_presupuesto: cronograma)
    monkeypatch.setattr(cronogramas, "_serialize_cronograma", lambda db, resolved_presupuesto, resolved_cronograma: serialized)
    monkeypatch.setattr(cronogramas.cronograma_recursos_service, "build_resource_demand", fake_build_demand)

    response = cronogramas.read_cronograma_recursos(
        presupuesto_id=77,
        db=None,
        current_user=current_user,
        empresa_id=3,
    )

    assert response["mode"] == "read_only"
    assert response["source"] == "cronograma_valorado"
    assert calls["resolve_budget"] == {"presupuesto_id": 77, "user_id": 9, "empresa_id": 3}
    assert calls["verify_access"] == {"proyecto_id": 44, "user_id": 9}
    assert calls["build_demand"]["presupuesto_id"] == 77
    assert calls["build_demand"]["cronograma"] is serialized
    assert calls["build_demand"]["empresa_id"] == 3


def test_read_cronograma_recursos_state_endpoint_uses_existing_tenant_and_access(monkeypatch):
    current_user = SimpleNamespace(id=9, empresa_id=3, rol="administrador")
    presupuesto = SimpleNamespace(id=77, proyecto_id=44, empresa_id=3)
    calls = {}

    monkeypatch.setattr(cronogramas, "_resolve_budget", lambda db, presupuesto_id, user, empresa_id: presupuesto)

    def fake_verify_access(db, proyecto_id, user_id):
        calls["verify_access"] = {"proyecto_id": proyecto_id, "user_id": user_id}

    def fake_get_state(db, resolved_presupuesto):
        calls["get_state"] = {"presupuesto_id": resolved_presupuesto.id}
        return {
            "source": "cronograma_recursos_state",
            "mode": "persistent_state",
            "presupuesto_id": resolved_presupuesto.id,
            "proyecto_id": resolved_presupuesto.proyecto_id,
            "empresa_id": resolved_presupuesto.empresa_id,
            "version": 1,
            "adjustments": {},
            "updated_by_id": None,
            "updated_at": None,
        }

    monkeypatch.setattr(cronogramas, "_verify_module_access", fake_verify_access)
    monkeypatch.setattr(cronogramas.cronograma_recursos_service, "get_resource_state", fake_get_state)

    response = cronogramas.read_cronograma_recursos_state(
        presupuesto_id=77,
        db=None,
        current_user=current_user,
        empresa_id=3,
    )

    assert response["mode"] == "persistent_state"
    assert calls["verify_access"] == {"proyecto_id": 44, "user_id": 9}
    assert calls["get_state"] == {"presupuesto_id": 77}


def test_update_cronograma_recursos_state_endpoint_persists_collaborative_state(monkeypatch):
    current_user = SimpleNamespace(id=9, empresa_id=3, rol="administrador")
    presupuesto = SimpleNamespace(id=77, proyecto_id=44, empresa_id=3)
    calls = {}

    monkeypatch.setattr(cronogramas, "_check_write_permissions", lambda user: calls.setdefault("write_user", user.id))
    monkeypatch.setattr(cronogramas, "_resolve_budget", lambda db, presupuesto_id, user, empresa_id: presupuesto)
    monkeypatch.setattr(cronogramas, "_verify_module_access", lambda db, proyecto_id, user_id: calls.setdefault("access", (proyecto_id, user_id)))

    def fake_update_state(db, resolved_presupuesto, adjustments, expected_version, updated_by_id):
        calls["update_state"] = {
            "presupuesto_id": resolved_presupuesto.id,
            "adjustments": adjustments,
            "expected_version": expected_version,
            "updated_by_id": updated_by_id,
        }
        return {
            "source": "cronograma_recursos_state",
            "mode": "persistent_state",
            "presupuesto_id": resolved_presupuesto.id,
            "proyecto_id": resolved_presupuesto.proyecto_id,
            "empresa_id": resolved_presupuesto.empresa_id,
            "version": 3,
            "adjustments": adjustments,
            "updated_by_id": updated_by_id,
            "updated_at": None,
        }

    def fake_audit(db, **kwargs):
        calls["audit"] = kwargs

    monkeypatch.setattr(cronogramas.cronograma_recursos_service, "update_resource_state", fake_update_state)
    monkeypatch.setattr(cronogramas, "record_audit_event", fake_audit)

    response = cronogramas.update_cronograma_recursos_state(
        presupuesto_id=77,
        payload=CronogramaRecursosStateUpdate(version=2, adjustments={"manual_limits": {"101": {"P1": 8}}}),
        db=None,
        current_user=current_user,
        empresa_id=3,
    )

    assert response["version"] == 3
    assert calls["write_user"] == 9
    assert calls["access"] == (44, 9)
    assert calls["update_state"] == {
        "presupuesto_id": 77,
        "adjustments": {"manual_limits": {"101": {"P1": 8}}},
        "expected_version": 2,
        "updated_by_id": 9,
    }
    assert calls["audit"]["event_type"] == "cronograma_recursos_state_updated"
    assert calls["audit"]["target_empresa_id"] == 3
