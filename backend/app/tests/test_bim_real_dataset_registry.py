import json
from pathlib import Path

import pytest

from app.services.bim.dataset_registry import (
    BimDatasetManifestError,
    load_bim_dataset_manifest,
    validate_bim_dataset_manifest,
)


CORPUS_ROOT = Path(__file__).parent / "fixtures" / "bim" / "real"
MANIFEST_PATH = CORPUS_ROOT / "manifest.json"


def test_bim_real_dataset_manifest_has_approved_scales_and_disciplines():
    manifest = load_bim_dataset_manifest(MANIFEST_PATH)

    assert {dataset["scale"] for dataset in manifest["datasets"]} == {
        "small",
        "medium",
        "large",
    }
    assert {dataset["discipline"] for dataset in manifest["datasets"]}.issuperset(
        {"architecture", "structural", "mep"}
    )
    assert all(dataset["source"]["license_spdx"] == "CC-BY-4.0" for dataset in manifest["datasets"])


def test_bim_real_dataset_manifest_matches_files_parser_and_federation():
    validations = validate_bim_dataset_manifest(MANIFEST_PATH)

    assert len(validations) == 6
    assert sum(item.bytes for item in validations) == 21174986
    assert sum(item.element_count for item in validations) == 1115
    assert {item.schema for item in validations} == {"IFC2X3", "IFC4", "IFC4X3_ADD2"}


def test_bim_real_dataset_manifest_rejects_checksum_drift(tmp_path):
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    dataset = manifest["datasets"][0]
    source_path = CORPUS_ROOT / dataset["relative_path"]
    copied_path = tmp_path / source_path.name
    copied_path.write_bytes(source_path.read_bytes() + b"\n")
    dataset["relative_path"] = copied_path.name
    manifest["datasets"] = [dataset]
    manifest["federations"] = []
    manifest_path = tmp_path / "manifest.json"
    manifest_path.write_text(json.dumps(manifest), encoding="utf-8")

    with pytest.raises(BimDatasetManifestError, match="bytes mismatch"):
        validate_bim_dataset_manifest(manifest_path)


def test_bim_real_dataset_manifest_rejects_path_escape(tmp_path):
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    dataset = manifest["datasets"][0]
    dataset["relative_path"] = "../outside.ifc"
    manifest["datasets"] = [dataset]
    manifest["federations"] = []
    manifest_path = tmp_path / "manifest.json"
    manifest_path.write_text(json.dumps(manifest), encoding="utf-8")

    with pytest.raises(BimDatasetManifestError, match="escapes the corpus root"):
        validate_bim_dataset_manifest(manifest_path)
