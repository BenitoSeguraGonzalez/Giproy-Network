import hashlib
import re
import uuid
from dataclasses import dataclass
from pathlib import Path

from app.core.config import settings


MAX_IFC_STORAGE_BYTES = 50 * 1024 * 1024


@dataclass(frozen=True)
class StoredIfcFile:
    source_filename: str
    artifact_path: str
    checksum_sha256: str
    file_size_bytes: int
    text: str


def store_ifc_bytes(
    *,
    content: bytes,
    source_filename: str,
    company_id: int,
    project_id: int,
    storage_root: Path | None = None,
) -> StoredIfcFile:
    normalized_filename = _sanitize_ifc_filename(source_filename)
    if not normalized_filename.lower().endswith(".ifc"):
        raise ValueError("El archivo BIM debe tener extension .ifc.")
    if not content:
        raise ValueError("El archivo IFC esta vacio.")
    if len(content) > MAX_IFC_STORAGE_BYTES:
        raise ValueError("El archivo IFC supera el tamano maximo local permitido.")

    root = Path(storage_root or settings.BIM_LOCAL_STORAGE_DIR)
    target_dir = root / str(company_id) / str(project_id)
    target_dir.mkdir(parents=True, exist_ok=True)

    checksum = hashlib.sha256(content).hexdigest()
    unique_name = f"{Path(normalized_filename).stem}-{checksum[:12]}-{uuid.uuid4().hex[:8]}.ifc"
    target_path = target_dir / unique_name
    target_path.write_bytes(content)

    return StoredIfcFile(
        source_filename=normalized_filename,
        artifact_path=str(target_path).replace("\\", "/"),
        checksum_sha256=checksum,
        file_size_bytes=len(content),
        text=_decode_ifc_text(content),
    )


def remove_stored_ifc_file(artifact_path: str | None) -> None:
    if not artifact_path:
        return
    path = Path(artifact_path)
    if path.exists() and path.is_file():
        path.unlink()


def _sanitize_ifc_filename(filename: str) -> str:
    raw_name = Path(filename or "modelo.ifc").name.strip() or "modelo.ifc"
    sanitized = re.sub(r"[^A-Za-z0-9._ -]+", "_", raw_name).strip(" .")
    return sanitized or "modelo.ifc"


def _decode_ifc_text(content: bytes) -> str:
    try:
        return content.decode("utf-8")
    except UnicodeDecodeError:
        return content.decode("latin-1")
