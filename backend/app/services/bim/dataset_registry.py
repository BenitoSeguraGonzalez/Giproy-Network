from __future__ import annotations

import hashlib
import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from app.services.bim.ifc_parser import parse_ifc_text_to_bim_package


DATASET_MANIFEST_CONTRACT = "giproy_bim_dataset_manifest_v1"


class BimDatasetManifestError(ValueError):
    pass


@dataclass(frozen=True)
class BimDatasetValidation:
    dataset_id: str
    path: Path
    bytes: int
    sha256: str
    schema: str
    entity_count: int
    storey_count: int
    element_count: int


def load_bim_dataset_manifest(manifest_path: Path) -> dict[str, Any]:
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    if manifest.get("contract_version") != DATASET_MANIFEST_CONTRACT:
        raise BimDatasetManifestError("Unsupported BIM dataset manifest contract")

    datasets = manifest.get("datasets")
    if not isinstance(datasets, list) or not datasets:
        raise BimDatasetManifestError("The BIM dataset manifest must include datasets")

    dataset_ids = [dataset.get("id") for dataset in datasets]
    if any(not dataset_id for dataset_id in dataset_ids):
        raise BimDatasetManifestError("Every BIM dataset requires an id")
    if len(dataset_ids) != len(set(dataset_ids)):
        raise BimDatasetManifestError("BIM dataset ids must be unique")

    for dataset in datasets:
        source = dataset.get("source") or {}
        if source.get("license_spdx") != "CC-BY-4.0":
            raise BimDatasetManifestError(f"Dataset {dataset['id']} has no approved license")
        if not source.get("attribution") or not source.get("url"):
            raise BimDatasetManifestError(f"Dataset {dataset['id']} has incomplete provenance")

    return manifest


def validate_bim_dataset_manifest(manifest_path: Path) -> list[BimDatasetValidation]:
    manifest_path = manifest_path.resolve()
    manifest = load_bim_dataset_manifest(manifest_path)
    root = manifest_path.parent
    validations = [
        _validate_dataset(dataset=dataset, root=root)
        for dataset in manifest["datasets"]
    ]
    _validate_federations(manifest=manifest, validations=validations)
    return validations


def _validate_dataset(*, dataset: dict[str, Any], root: Path) -> BimDatasetValidation:
    dataset_id = dataset["id"]
    relative_path = dataset.get("relative_path")
    if not relative_path:
        raise BimDatasetManifestError(f"Dataset {dataset_id} requires relative_path")

    path = (root / relative_path).resolve()
    try:
        path.relative_to(root)
    except ValueError as exc:
        raise BimDatasetManifestError(f"Dataset {dataset_id} escapes the corpus root") from exc
    if not path.is_file():
        raise BimDatasetManifestError(f"Dataset {dataset_id} file is missing")

    raw_bytes = path.read_bytes()
    sha256 = hashlib.sha256(raw_bytes).hexdigest()
    expected = dataset.get("expected") or {}
    _expect_equal(dataset_id, "bytes", len(raw_bytes), expected.get("bytes"))
    _expect_equal(dataset_id, "sha256", sha256, expected.get("sha256"))

    ifc_text = raw_bytes.decode("utf-8-sig")
    schema_match = re.search(r"FILE_SCHEMA\s*\(\s*\(\s*'([^']+)'", ifc_text, re.IGNORECASE)
    schema = schema_match.group(1).upper() if schema_match else ""
    _expect_equal(dataset_id, "schema", schema, dataset.get("schema"))

    parsed = parse_ifc_text_to_bim_package(
        ifc_text=ifc_text,
        model_name=dataset.get("label") or dataset_id,
        version_label="dataset-registry",
        source_filename=path.name,
        discipline=dataset.get("discipline"),
        activate=False,
    )
    summary = parsed.summary
    _expect_equal(dataset_id, "entity_count", summary.entity_count, expected.get("entity_count"))
    _expect_equal(dataset_id, "storey_count", summary.storey_count, expected.get("storey_count"))
    _expect_equal(dataset_id, "element_count", summary.element_count, expected.get("element_count"))

    for ifc_class in expected.get("required_ifc_classes", []):
        if summary.ifc_class_counts.get(ifc_class, 0) <= 0:
            raise BimDatasetManifestError(f"Dataset {dataset_id} is missing {ifc_class}")

    return BimDatasetValidation(
        dataset_id=dataset_id,
        path=path,
        bytes=len(raw_bytes),
        sha256=sha256,
        schema=schema,
        entity_count=summary.entity_count,
        storey_count=summary.storey_count,
        element_count=summary.element_count,
    )


def _validate_federations(
    *,
    manifest: dict[str, Any],
    validations: list[BimDatasetValidation],
) -> None:
    by_id = {validation.dataset_id: validation for validation in validations}
    for federation in manifest.get("federations", []):
        federation_id = federation.get("id") or "unknown"
        member_ids = federation.get("member_dataset_ids") or []
        if len(member_ids) != len(set(member_ids)):
            raise BimDatasetManifestError(f"Federation {federation_id} repeats members")
        missing = [member_id for member_id in member_ids if member_id not in by_id]
        if missing:
            raise BimDatasetManifestError(f"Federation {federation_id} has unknown members: {missing}")

        expected = federation.get("expected") or {}
        members = [by_id[member_id] for member_id in member_ids]
        _expect_equal(federation_id, "member_count", len(members), expected.get("member_count"))
        _expect_equal(federation_id, "total_bytes", sum(item.bytes for item in members), expected.get("total_bytes"))
        _expect_equal(
            federation_id,
            "total_elements",
            sum(item.element_count for item in members),
            expected.get("total_elements"),
        )


def _expect_equal(dataset_id: str, field: str, actual: Any, expected: Any) -> None:
    if expected is None:
        raise BimDatasetManifestError(f"Dataset {dataset_id} has no expected {field}")
    if actual != expected:
        raise BimDatasetManifestError(
            f"Dataset {dataset_id} {field} mismatch: expected {expected!r}, got {actual!r}"
        )
