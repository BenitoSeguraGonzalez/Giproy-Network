from types import SimpleNamespace

from app.services.marketplace_profile import evaluate_marketplace_profile


def _profile_user(**overrides):
    data = {
        "nombre_completo": "Usuario Demo",
        "ruc": "0102030405",
        "nombres": "Usuario",
        "apellidos": "Demo",
        "alias": "udemo",
        "nacionalidad": "Ecuatoriana",
        "profesion": "Ingeniero",
        "ciudad": "Cuenca",
        "provincia": "Azuay",
        "canton": "Cuenca",
        "pais": "Ecuador",
        "movil": "+593 99 123 45 67",
        "acepta_politica_privacidad": True,
    }
    data.update(overrides)
    return SimpleNamespace(**data)


def test_marketplace_profile_complete_for_full_ecuador_profile():
    status = evaluate_marketplace_profile(_profile_user())

    assert status == {
        "complete": True,
        "missing_fields": [],
        "missing_labels": [],
    }


def test_marketplace_profile_requires_canton_only_for_ecuador():
    ecuador_status = evaluate_marketplace_profile(_profile_user(canton=" ", pais=" Ecuador "))
    foreign_status = evaluate_marketplace_profile(_profile_user(canton="", pais="Colombia"))

    assert ecuador_status["complete"] is False
    assert ecuador_status["missing_fields"] == ["canton"]
    assert ecuador_status["missing_labels"] == ["canton"]
    assert foreign_status["complete"] is True


def test_marketplace_profile_reports_missing_text_and_privacy_labels():
    status = evaluate_marketplace_profile(
        _profile_user(
            nombre_completo=" ",
            ruc=None,
            movil="",
            acepta_politica_privacidad=False,
        )
    )

    assert status["complete"] is False
    assert status["missing_fields"] == [
        "nombre_completo",
        "ruc",
        "movil",
        "acepta_politica_privacidad",
    ]
    assert status["missing_labels"] == [
        "nombre completo",
        "identificacion fiscal",
        "movil",
        "aceptacion de politica de privacidad",
    ]
