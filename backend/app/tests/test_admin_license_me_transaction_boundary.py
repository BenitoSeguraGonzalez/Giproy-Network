from types import SimpleNamespace

from app.api.endpoints import admin_licenses


class _Query:
    def __init__(self, empresa):
        self.empresa = empresa

    def get(self, _empresa_id):
        return self.empresa


class _Session:
    def __init__(self, empresa):
        self.empresa = empresa
        self.commits = 0

    def commit(self):
        self.commits += 1

    def query(self, _model):
        return _Query(self.empresa)


def test_license_me_commits_writes_and_reuses_snapshot(monkeypatch):
    assignment = SimpleNamespace(
        licencia=SimpleNamespace(nombre="Empresa", id=7),
    )
    snapshot = {
        "current_assignment": assignment,
        "next_assignment": None,
        "license_status": "active",
        "access_mode": "full",
        "grace_days_remaining": 0,
        "banner_message": None,
    }
    usage = SimpleNamespace(
        max_usuarios=5,
        max_proyectos=10,
        max_almacenamiento_bytes=1024**3,
        usuarios_count=1,
        proyectos_count=2,
        almacenamiento_bytes=0,
    )
    empresa = SimpleNamespace(license_end_date=None)
    db = _Session(empresa)
    calls = {}

    monkeypatch.setattr(
        admin_licenses.license_service,
        "get_company_license_snapshot",
        lambda _db, _empresa_id, **_kwargs: snapshot,
    )
    monkeypatch.setattr(
        admin_licenses.license_service,
        "update_usage_metrics",
        lambda _db, _empresa_id: usage,
    )

    def _resolve(_db, _empresa_id, *, license_snapshot=None):
        calls["commits_before_commercial_read"] = db.commits
        calls["snapshot"] = license_snapshot
        return {"saas_products": [], "capabilities": {}}

    monkeypatch.setattr(
        admin_licenses.commercial_capabilities_service,
        "resolve_company_capabilities",
        _resolve,
    )

    response = admin_licenses.read_current_company_license(
        db=db,
        current_user=SimpleNamespace(empresa_id=3, rol="administrador"),
        empresa_id=None,
    )

    assert response["license_status"] == "active"
    assert calls["commits_before_commercial_read"] == 1
    assert calls["snapshot"] is snapshot
    assert db.commits == 2
