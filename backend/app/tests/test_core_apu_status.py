from app.core.apu_status import (
    is_apu_revision_status_revisado,
    normalize_apu_revision_status,
)


def test_normalize_apu_revision_status_accepts_reviewed_aliases():
    assert normalize_apu_revision_status("Revisado") == "Revisado"
    assert normalize_apu_revision_status(" aprobado ") == "Revisado"
    assert is_apu_revision_status_revisado("APROBADO") is True


def test_normalize_apu_revision_status_defaults_to_pending_for_draft_aliases():
    for raw_status in (None, "", "pendiente", "por validar", "borrador", "incompleto", "desconocido"):
        assert normalize_apu_revision_status(raw_status) == "Pendiente"
        assert is_apu_revision_status_revisado(raw_status) is False
