from __future__ import annotations

import csv
import hashlib
import io
import zipfile
from contextlib import contextmanager
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path
from urllib.parse import urlparse

import httpx
from sqlalchemy import case, func, or_, text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.empresa import Empresa
from app.models.sri_ruc import (
    EmpresaFiscalHistory,
    SriRucDatasetVersion,
    SriRucRecord,
    SriRucVerifiedOverride,
)


SRI_RUC_SOURCES = {
    "01": ("Azuay", "https://descargas.sri.gob.ec/download/datosAbiertos/SRI_RUC_Azuay.csv"),
    "02": ("Bolívar", "https://descargas.sri.gob.ec/download/datosAbiertos/SRI_RUC_Bolivar.csv"),
    "03": ("Cañar", "https://descargas.sri.gob.ec/download/datosAbiertos/SRI_RUC_Ca%C3%B1ar.csv"),
    "04": ("Carchi", "https://descargas.sri.gob.ec/download/datosAbiertos/SRI_RUC_Carchi.csv"),
    "05": ("Cotopaxi", "https://descargas.sri.gob.ec/download/datosAbiertos/SRI_RUC_Cotopaxi.csv"),
    "06": ("Chimborazo", "https://descargas.sri.gob.ec/download/datosAbiertos/SRI_RUC_Chimborazo.csv"),
    "07": ("El Oro", "https://descargas.sri.gob.ec/download/datosAbiertos/SRI_RUC_El_Oro.csv"),
    "08": ("Esmeraldas", "https://descargas.sri.gob.ec/download/datosAbiertos/SRI_RUC_Esmeraldas.csv"),
    "09": ("Guayas", "https://descargas.sri.gob.ec/download/datosAbiertos/SRI_RUC_Guayas.zip"),
    "10": ("Imbabura", "https://descargas.sri.gob.ec/download/datosAbiertos/SRI_RUC_Imbabura.csv"),
    "11": ("Loja", "https://descargas.sri.gob.ec/download/datosAbiertos/SRI_RUC_Loja.csv"),
    "12": ("Los Ríos", "https://descargas.sri.gob.ec/download/datosAbiertos/SRI_RUC_Los_Rios.csv"),
    "13": ("Manabí", "https://descargas.sri.gob.ec/download/datosAbiertos/SRI_RUC_Manabi.csv"),
    "14": ("Morona Santiago", "https://descargas.sri.gob.ec/download/datosAbiertos/SRI_RUC_Morona_Santiago.csv"),
    "15": ("Napo", "https://descargas.sri.gob.ec/download/datosAbiertos/SRI_RUC_Napo.csv"),
    "16": ("Pastaza", "https://descargas.sri.gob.ec/download/datosAbiertos/SRI_RUC_Pastaza.csv"),
    "17": ("Pichincha", "https://descargas.sri.gob.ec/download/datosAbiertos/SRI_RUC_Pichincha.zip"),
    "18": ("Tungurahua", "https://descargas.sri.gob.ec/download/datosAbiertos/SRI_RUC_Tungurahua.csv"),
    "19": ("Zamora Chinchipe", "https://descargas.sri.gob.ec/download/datosAbiertos/SRI_RUC_Zamora_Chinchipe.csv"),
    "20": ("Galápagos", "https://descargas.sri.gob.ec/download/datosAbiertos/SRI_RUC_Galapagos.csv"),
    "21": ("Sucumbíos", "https://descargas.sri.gob.ec/download/datosAbiertos/SRI_RUC_Sucumbios.csv"),
    "22": ("Orellana", "https://descargas.sri.gob.ec/download/datosAbiertos/SRI_RUC_Orellana.csv"),
    "23": ("Santo Domingo", "https://descargas.sri.gob.ec/download/datosAbiertos/SRI_RUC_Santo_Domingo.csv"),
    "24": ("Santa Elena", "https://descargas.sri.gob.ec/download/datosAbiertos/SRI_RUC_Santa_Elena.csv"),
}

REQUIRED_COLUMNS = {
    "NUMERO_RUC",
    "RAZON_SOCIAL",
    "ESTADO_CONTRIBUYENTE",
    "FECHA_INICIO_ACTIVIDADES",
    "NUMERO_ESTABLECIMIENTO",
    "ACTIVIDAD_ECONOMICA",
}
IDENTITY_FIELDS = ("business_name", "taxpayer_status", "taxpayer_type", "start_date")


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def normalize_ruc(value: str | None) -> str:
    raw = str(value or "").strip()
    if any(not (char.isdigit() or char in {" ", "-"}) for char in raw):
        return ""
    return "".join(char for char in raw if char.isdigit())


def canonical_ruc_is_valid(value: str | None) -> bool:
    normalized = normalize_ruc(value)
    return len(normalized) == 13 and normalized.isdigit()


def _clean(value) -> str:
    return str(value or "").strip()


def version_source_date(version: SriRucDatasetVersion) -> datetime:
    if version.source_last_modified:
        try:
            return parsedate_to_datetime(version.source_last_modified)
        except (TypeError, ValueError):
            pass
    return version.activated_at or version.imported_at


def file_sha256(path: Path, chunk_size: int = 1024 * 1024) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(chunk_size), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _row_to_record(row: dict, version_id: int) -> dict | None:
    ruc = normalize_ruc(row.get("NUMERO_RUC"))
    business_name = _clean(row.get("RAZON_SOCIAL"))
    if len(ruc) != 13 or not business_name:
        return None
    return {
        "version_id": version_id,
        "ruc": ruc,
        "business_name": business_name,
        "taxpayer_status": _clean(row.get("ESTADO_CONTRIBUYENTE")),
        "taxpayer_type": _clean(row.get("TIPO_CONTRIBUYENTE") or row.get("CLASE_CONTRIBUYENTE")),
        "start_date": _clean(row.get("FECHA_INICIO_ACTIVIDADES")),
        "economic_activity": _clean(row.get("ACTIVIDAD_ECONOMICA")),
        "establishment_number": _clean(row.get("NUMERO_ESTABLECIMIENTO")) or "999999",
        "identity_conflict": False,
    }


def _merge_batch_record(current: dict, candidate: dict) -> dict:
    if any(_clean(current.get(field)) != _clean(candidate.get(field)) for field in IDENTITY_FIELDS):
        current["identity_conflict"] = True
    if candidate["establishment_number"].zfill(10) < current["establishment_number"].zfill(10):
        conflict = current["identity_conflict"]
        current = candidate
        current["identity_conflict"] = conflict
    return current


def _upsert_records(db: Session, records: list[dict]) -> None:
    if not records:
        return
    table = SriRucRecord.__table__
    dialect = db.bind.dialect.name
    if dialect == "postgresql":
        from sqlalchemy.dialects.postgresql import insert
    elif dialect == "sqlite":
        from sqlalchemy.dialects.sqlite import insert
    else:
        for item in records:
            existing = db.query(SriRucRecord).filter_by(version_id=item["version_id"], ruc=item["ruc"]).first()
            if existing is None:
                db.add(SriRucRecord(**item))
            else:
                if any(_clean(getattr(existing, field)) != _clean(item[field]) for field in IDENTITY_FIELDS):
                    existing.identity_conflict = True
                if item["establishment_number"].zfill(10) < (existing.establishment_number or "999999").zfill(10):
                    for field in (*IDENTITY_FIELDS, "economic_activity", "establishment_number"):
                        setattr(existing, field, item[field])
        db.flush()
        return

    statement = insert(table).values(records)
    excluded = statement.excluded
    prefer_candidate = func.coalesce(excluded.establishment_number, "999999").op("<")(
        func.coalesce(table.c.establishment_number, "999999")
    )
    identity_conflict = or_(
        table.c.identity_conflict,
        table.c.business_name != excluded.business_name,
        func.coalesce(table.c.taxpayer_status, "") != func.coalesce(excluded.taxpayer_status, ""),
        func.coalesce(table.c.taxpayer_type, "") != func.coalesce(excluded.taxpayer_type, ""),
        func.coalesce(table.c.start_date, "") != func.coalesce(excluded.start_date, ""),
        excluded.identity_conflict,
    )
    statement = statement.on_conflict_do_update(
        index_elements=[table.c.version_id, table.c.ruc],
        set_={
            "business_name": case((prefer_candidate, excluded.business_name), else_=table.c.business_name),
            "taxpayer_status": case((prefer_candidate, excluded.taxpayer_status), else_=table.c.taxpayer_status),
            "taxpayer_type": case((prefer_candidate, excluded.taxpayer_type), else_=table.c.taxpayer_type),
            "start_date": case((prefer_candidate, excluded.start_date), else_=table.c.start_date),
            "economic_activity": case((prefer_candidate, excluded.economic_activity), else_=table.c.economic_activity),
            "establishment_number": case((prefer_candidate, excluded.establishment_number), else_=table.c.establishment_number),
            "identity_conflict": identity_conflict,
        },
    )
    db.execute(statement)


@contextmanager
def _open_csv(path: Path):
    if path.suffix.lower() == ".zip":
        archive = zipfile.ZipFile(path)
        candidates = [name for name in archive.namelist() if name.lower().endswith(".csv")]
        if len(candidates) != 1:
            archive.close()
            raise ValueError("El ZIP del SRI debe contener exactamente un CSV.")
        info = archive.getinfo(candidates[0])
        if info.file_size > settings.SRI_RUC_DOWNLOAD_MAX_BYTES:
            archive.close()
            raise ValueError("El CSV descomprimido supera el tamaño máximo configurado.")
        binary = archive.open(candidates[0], "r")
        wrapper = io.TextIOWrapper(binary, encoding="utf-8-sig", errors="replace", newline="")
        try:
            yield wrapper
        finally:
            wrapper.close()
            archive.close()
    else:
        with path.open("r", encoding="utf-8-sig", errors="replace", newline="") as handle:
            yield handle


def import_file(
    db: Session,
    *,
    province_code: str,
    path: Path,
    source_url: str | None = None,
    etag: str | None = None,
    last_modified: str | None = None,
    activate: bool = True,
) -> SriRucDatasetVersion:
    if province_code not in SRI_RUC_SOURCES:
        raise ValueError("Provincia SRI no soportada.")
    if not path.is_file() or path.stat().st_size > settings.SRI_RUC_DOWNLOAD_MAX_BYTES:
        raise ValueError("El archivo SRI no existe o supera el tamaño máximo configurado.")
    province_name, manifest_url = SRI_RUC_SOURCES[province_code]
    checksum = file_sha256(path)
    existing = db.query(SriRucDatasetVersion).filter_by(province_code=province_code, checksum_sha256=checksum).first()
    if existing and existing.is_active:
        return existing
    if existing:
        db.delete(existing)
        db.commit()

    version = SriRucDatasetVersion(
        province_code=province_code,
        province_name=province_name,
        source_url=source_url or manifest_url,
        source_etag=etag,
        source_last_modified=last_modified,
        checksum_sha256=checksum,
        status="staging",
    )
    db.add(version)
    db.commit()
    db.refresh(version)

    row_count = rejected = 0
    try:
        with _open_csv(path) as handle:
            reader = csv.DictReader(handle, delimiter="|")
            headers = set(reader.fieldnames or [])
            missing = REQUIRED_COLUMNS - headers
            if missing:
                raise ValueError(f"Cabeceras SRI faltantes: {', '.join(sorted(missing))}")
            pending: dict[str, dict] = {}
            for row in reader:
                row_count += 1
                item = _row_to_record(row, version.id)
                if item is None:
                    rejected += 1
                    continue
                current = pending.get(item["ruc"])
                pending[item["ruc"]] = item if current is None else _merge_batch_record(current, item)
                if len(pending) >= 2000:
                    _upsert_records(db, list(pending.values()))
                    db.flush()
                    pending.clear()
            _upsert_records(db, list(pending.values()))
        db.commit()
        accepted = db.query(func.count(SriRucRecord.id)).filter(SriRucRecord.version_id == version.id).scalar() or 0
        conflicts = db.query(func.count(SriRucRecord.id)).filter(
            SriRucRecord.version_id == version.id, SriRucRecord.identity_conflict.is_(True)
        ).scalar() or 0
        version.row_count = row_count
        version.accepted_count = accepted
        version.rejected_count = rejected
        version.conflict_count = conflicts

        previous = db.query(SriRucDatasetVersion).filter_by(province_code=province_code, is_active=True).first()
        rejection_ratio = (rejected / row_count) if row_count else 1.0
        count_delta = (
            abs(accepted - previous.accepted_count) / previous.accepted_count
            if previous and previous.accepted_count
            else 0.0
        )
        if row_count == 0 or accepted == 0:
            version.status = "failed"
            version.error_code = "empty_dataset"
        elif conflicts:
            version.status = "failed"
            version.error_code = "identity_conflict"
        elif rejection_ratio > 0.001 or count_delta > 0.10:
            version.status = "quality_review"
            version.error_code = "quality_gate"
        else:
            version.status = "ready"
        db.commit()
        if activate and version.status == "ready":
            activate_version(db, version.id)
        db.refresh(version)
        return version
    except Exception as exc:
        db.rollback()
        version = db.query(SriRucDatasetVersion).filter_by(id=version.id).first()
        if version:
            version.status = "failed"
            version.error_code = "import_error"
            version.error_message = str(exc)[:1000]
            db.commit()
        raise


def activate_version(db: Session, version_id: int, *, force_quality: bool = False) -> SriRucDatasetVersion:
    version = db.query(SriRucDatasetVersion).filter_by(id=version_id).first()
    if version is None:
        raise ValueError("Versión SRI no encontrada.")
    allowed = version.status == "ready" or (force_quality and version.status == "quality_review")
    if not allowed:
        raise ValueError("La versión no supera los controles necesarios para activarse.")
    db.query(SriRucDatasetVersion).filter(
        SriRucDatasetVersion.province_code == version.province_code,
        SriRucDatasetVersion.is_active.is_(True),
    ).update({"is_active": False, "status": "superseded"}, synchronize_session=False)
    version.is_active = True
    version.status = "active"
    version.activated_at = utcnow()
    db.commit()
    sync_company_profiles(db, version)
    reconcile_overrides(db, version)
    _retain_two_versions(db, version.province_code)
    db.refresh(version)
    return version


def _retain_two_versions(db: Session, province_code: str) -> None:
    versions = db.query(SriRucDatasetVersion).filter(
        SriRucDatasetVersion.province_code == province_code,
        SriRucDatasetVersion.status.in_(["active", "superseded"]),
    ).order_by(SriRucDatasetVersion.activated_at.desc().nullslast(), SriRucDatasetVersion.id.desc()).all()
    for old in versions[2:]:
        db.delete(old)
    db.commit()


def lookup_ruc(db: Session, ruc: str) -> dict | None:
    normalized = normalize_ruc(ruc)
    if len(normalized) != 13:
        return None
    row = (
        db.query(SriRucRecord, SriRucDatasetVersion)
        .join(SriRucDatasetVersion, SriRucDatasetVersion.id == SriRucRecord.version_id)
        .filter(SriRucRecord.ruc == normalized, SriRucDatasetVersion.is_active.is_(True))
        .first()
    )
    if row:
        record, version = row
        return {
            "ruc": normalized,
            "business_name": record.business_name,
            "status": record.taxpayer_status,
            "taxpayer_type": record.taxpayer_type,
            "start_date": record.start_date,
            "economic_activity": record.economic_activity,
            "source": "sri_dataset",
            "source_date": version_source_date(version),
            "source_version_id": version.id,
        }
    override = db.query(SriRucVerifiedOverride).filter_by(ruc=normalized, reconciled_at=None).first()
    if override:
        return {
            "ruc": normalized,
            "business_name": override.business_name,
            "status": override.taxpayer_status,
            "taxpayer_type": override.taxpayer_type,
            "start_date": override.start_date,
            "economic_activity": override.economic_activity,
            "source": "sri_certificate",
            "source_date": override.verified_at,
            "source_version_id": None,
        }
    return None


def sync_company_profiles(db: Session, version: SriRucDatasetVersion) -> dict:
    rows = (
        db.query(Empresa, SriRucRecord)
        .join(SriRucRecord, SriRucRecord.ruc == Empresa.ruc)
        .filter(
            Empresa.is_system_company.is_(False),
            SriRucRecord.version_id == version.id,
        )
        .all()
    )
    changed = 0
    mapping = {
        "nombre": "business_name",
        "fiscal_status": "taxpayer_status",
        "fiscal_taxpayer_type": "taxpayer_type",
        "fiscal_start_date": "start_date",
        "fiscal_economic_activity": "economic_activity",
    }
    for company, record in rows:
        if not company.alias and company.nombre and company.nombre != record.business_name:
            company.alias = company.nombre
        company_changed = False
        for company_field, record_field in mapping.items():
            old_value = getattr(company, company_field)
            new_value = getattr(record, record_field)
            if _clean(old_value) == _clean(new_value):
                continue
            db.add(EmpresaFiscalHistory(
                empresa_id=company.id,
                field_name=company_field,
                old_value=None if old_value is None else str(old_value),
                new_value=None if new_value is None else str(new_value),
                source="sri_dataset",
                source_version_id=version.id,
            ))
            setattr(company, company_field, new_value)
            company_changed = True
        company.fiscal_source = "sri_dataset"
        company.fiscal_source_date = version_source_date(version)
        company.fiscal_verified_at = utcnow()
        if company_changed:
            changed += 1
    db.commit()
    matched_ids = {company.id for company, _record in rows}
    province_companies = db.query(Empresa.id).filter(
        Empresa.is_system_company.is_(False),
        Empresa.ruc.like(f"{version.province_code}%"),
    ).all()
    missing_ids = [item[0] for item in province_companies if item[0] not in matched_ids]
    if missing_ids:
        version.error_message = f"alert_only_missing_existing_companies={len(missing_ids)}"
        db.commit()
    return {"matched": len(rows), "changed": changed, "missing_existing": len(missing_ids)}


def reconcile_overrides(db: Session, version: SriRucDatasetVersion) -> int:
    overrides = (
        db.query(SriRucVerifiedOverride)
        .join(SriRucRecord, SriRucRecord.ruc == SriRucVerifiedOverride.ruc)
        .filter(SriRucRecord.version_id == version.id, SriRucVerifiedOverride.reconciled_at.is_(None))
        .all()
    )
    now = utcnow()
    for item in overrides:
        item.reconciled_at = now
    db.commit()
    return len(overrides)


def _validate_source_url(url: str) -> None:
    parsed = urlparse(url)
    if parsed.scheme != "https" or parsed.hostname != "descargas.sri.gob.ec":
        raise ValueError("La fuente RUC debe pertenecer al dominio HTTPS oficial del SRI.")


def _download(url: str, target: Path, *, client: httpx.Client) -> tuple[str | None, str | None]:
    _validate_source_url(url)
    total = 0
    with client.stream("GET", url, headers={"Accept": "text/csv, application/zip"}) as response:
        response.raise_for_status()
        if response.is_redirect:
            raise ValueError("La fuente SRI no puede redirigir a otro dominio.")
        with target.open("wb") as handle:
            for chunk in response.iter_bytes():
                total += len(chunk)
                if total > settings.SRI_RUC_DOWNLOAD_MAX_BYTES:
                    raise ValueError("El archivo SRI supera el tamaño máximo configurado.")
                handle.write(chunk)
        return response.headers.get("etag"), response.headers.get("last-modified")


@contextmanager
def province_lock(db: Session, province_code: str):
    locked = True
    if db.bind.dialect.name == "postgresql":
        locked = bool(db.execute(text("SELECT pg_try_advisory_lock(hashtext(:key))"), {"key": f"sri_ruc_{province_code}"}).scalar())
    if not locked:
        raise RuntimeError("Ya existe una sincronización SRI para esta provincia.")
    try:
        yield
    finally:
        if db.bind.dialect.name == "postgresql":
            db.execute(text("SELECT pg_advisory_unlock(hashtext(:key))"), {"key": f"sri_ruc_{province_code}"})


def sync_province(db: Session, province_code: str, *, force: bool = False, dry_run: bool = False) -> dict:
    if province_code not in SRI_RUC_SOURCES:
        raise ValueError("Provincia SRI no soportada.")
    province_name, url = SRI_RUC_SOURCES[province_code]
    private_dir = Path(settings.SRI_RUC_PRIVATE_DIR).resolve()
    private_dir.mkdir(parents=True, exist_ok=True)
    suffix = ".zip" if url.lower().endswith(".zip") else ".csv"
    target = private_dir / f"{province_code}-{utcnow().strftime('%Y%m%dT%H%M%SZ')}{suffix}"
    with province_lock(db, province_code):
        active = db.query(SriRucDatasetVersion).filter_by(province_code=province_code, is_active=True).first()
        with httpx.Client(timeout=httpx.Timeout(120.0, read=600.0), follow_redirects=False) as client:
            if active and not force:
                _validate_source_url(url)
                head = client.head(url)
                head.raise_for_status()
                current_etag = head.headers.get("etag")
                current_modified = head.headers.get("last-modified")
                if (current_etag and active.source_etag == current_etag) or (
                    not current_etag and current_modified and active.source_last_modified == current_modified
                ):
                    return {"status": "unchanged", "province_code": province_code, "version_id": active.id}
            etag, last_modified = _download(url, target, client=client)
        checksum = file_sha256(target)
        if active and active.checksum_sha256 == checksum and not force:
            target.unlink(missing_ok=True)
            return {"status": "unchanged", "province_code": province_code, "version_id": active.id}
        if dry_run:
            target.unlink(missing_ok=True)
            return {"status": "downloaded", "province_code": province_code, "checksum_sha256": checksum}
        try:
            version = import_file(
                db,
                province_code=province_code,
                path=target,
                source_url=url,
                etag=etag,
                last_modified=last_modified,
                activate=True,
            )
            if version.status == "active":
                target.unlink(missing_ok=True)
            return {
                "status": version.status,
                "province_code": province_code,
                "province_name": province_name,
                "version_id": version.id,
                "row_count": version.row_count,
                "accepted_count": version.accepted_count,
                "rejected_count": version.rejected_count,
                "conflict_count": version.conflict_count,
                "warning": version.error_message,
            }
        except Exception:
            raise


def cleanup_failed_files(*, older_than_days: int = 7) -> int:
    directory = Path(settings.SRI_RUC_PRIVATE_DIR).resolve()
    if not directory.exists():
        return 0
    cutoff = utcnow().timestamp() - older_than_days * 86400
    removed = 0
    for path in directory.iterdir():
        if path.is_file() and path.stat().st_mtime < cutoff:
            path.unlink()
            removed += 1
    return removed


def catalog_status(db: Session) -> dict:
    versions = db.query(SriRucDatasetVersion).order_by(
        SriRucDatasetVersion.province_code, SriRucDatasetVersion.id.desc()
    ).all()
    latest = {}
    for item in versions:
        latest.setdefault(item.province_code, item)
    return {
        "coverage": sum(1 for item in latest.values() if item.is_active),
        "expected_provinces": len(SRI_RUC_SOURCES),
        "provinces": [
            {
                "province_code": code,
                "province_name": SRI_RUC_SOURCES[code][0],
                "version_id": latest[code].id if code in latest else None,
                "status": latest[code].status if code in latest else "missing",
                "is_active": latest[code].is_active if code in latest else False,
                "accepted_count": latest[code].accepted_count if code in latest else 0,
                "activated_at": latest[code].activated_at if code in latest else None,
                "error_code": latest[code].error_code if code in latest else None,
            }
            for code in sorted(SRI_RUC_SOURCES)
        ],
    }
