from typing import Optional


def normalize_apu_revision_status(status: Optional[str]) -> str:
    normalized = (status or "").strip().lower()
    if normalized in {"revisado", "aprobado"}:
        return "Revisado"
    if normalized in {"pendiente", "por validar", "borrador", "incompleto"}:
        return "Pendiente"
    return "Pendiente"


def is_apu_revision_status_revisado(status: Optional[str]) -> bool:
    return normalize_apu_revision_status(status) == "Revisado"
