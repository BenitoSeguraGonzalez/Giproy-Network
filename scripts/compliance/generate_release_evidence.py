#!/usr/bin/env python3
"""Generate deterministic third-party and release evidence for GiProy.

Run inside the exact source tree/image used for a release. The command never
claims legal compliance; it produces reviewable evidence and fails closed for
forbidden artifacts or explicitly denied licenses.
"""

from __future__ import annotations

import argparse
import base64
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys


DENIED_LICENSE_MARKERS = {"AGPL", "SSPL", "BUSL", "Commons Clause", "Hippocratic"}
FORBIDDEN_SUFFIXES = {".lic", ".pfx", ".p12", ".jks"}
FORBIDDEN_NAMES = {"id_rsa", "id_ed25519", "license.key", "apikey.txt"}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def git_files(root: Path) -> list[Path]:
    result = subprocess.run(
        ["git", "ls-files", "-co", "--exclude-standard"], cwd=root,
        check=True, capture_output=True, text=True,
    )
    return [root / line for line in result.stdout.splitlines() if line]


def scan_forbidden(root: Path) -> list[str]:
    findings = []
    for path in git_files(root):
        if not path.is_file():
            continue
        lowered = path.name.lower()
        suspicious_name = any(marker in lowered for marker in ("api key", "apikey", "private key"))
        if path.suffix.lower() in FORBIDDEN_SUFFIXES or lowered in FORBIDDEN_NAMES or suspicious_name:
            findings.append(path.relative_to(root).as_posix())
    return sorted(findings)


def frontend_components(root: Path, frontend_root: Path | None = None) -> list[dict[str, str]]:
    frontend_root = frontend_root or (root / "frontend")
    lock_path = frontend_root / "package-lock.json"
    lock = json.loads(lock_path.read_text(encoding="utf-8"))
    components = []
    for key, metadata in sorted(lock.get("packages", {}).items()):
        if not key.startswith("node_modules/") or not metadata.get("version") or metadata.get("dev") is True:
            continue
        package_dir = frontend_root / key
        package_json = package_dir / "package.json"
        installed = json.loads(package_json.read_text(encoding="utf-8")) if package_json.is_file() else {}
        license_value = installed.get("license", metadata.get("license", "UNKNOWN"))
        components.append({
            "name": key.rsplit("node_modules/", 1)[-1],
            "version": str(metadata["version"]),
            "license": str(license_value),
            "scope": "frontend-runtime",
            "source": str(installed.get("repository", {}).get("url", "") if isinstance(installed.get("repository"), dict) else installed.get("repository", "")),
            "license_file": next((str(candidate) for candidate in package_dir.glob("LICEN[CS]E*") if candidate.is_file()), ""),
        })
    return components


def _classifier_license(metadata: dict) -> str:
    classifiers = metadata.get("classifier", [])
    values = [item.rsplit("::", 1)[-1].strip() for item in classifiers if item.startswith("License ::")]
    return " OR ".join(values) if values else "UNKNOWN"


def _normalize_backend_license(name: str, declared: str, classifiers: list[str]) -> str:
    if name.lower().replace("-", "_") == "language_tool_python":
        return "GPL-3.0-only"
    if declared == "UNKNOWN" and classifiers:
        values = [item.rsplit("::", 1)[-1].strip() for item in classifiers if item.startswith("License ::")]
        return " OR ".join(values) if values else declared
    if len(declared) > 240 or "TERMS AND CONDITIONS" in declared:
        return "GPL-3.0-only" if "GNU GENERAL PUBLIC LICENSE" in declared.upper() else "SEE_DISTRIBUTION_LICENSE"
    return declared


def remote_backend_components(ssh_host: str, container: str) -> list[dict[str, str]]:
    code = '''import json
import importlib.metadata as m
print(json.dumps([{"name": d.metadata.get("Name"), "version": d.version, "license": d.metadata.get("License-Expression") or d.metadata.get("License") or "UNKNOWN", "classifiers": [x for x in (d.metadata.get_all("Classifier") or []) if x.startswith("License ::")]} for d in m.distributions()]))
'''
    encoded = base64.b64encode(code.encode("utf-8")).decode("ascii")
    command = f"echo {encoded} | base64 -d | docker exec -i {container} python -"
    result = subprocess.run(["ssh", ssh_host, command], check=True, capture_output=True, text=True)
    installed = json.loads(result.stdout)
    components = []
    for item in installed:
        name = str(item.get("name") or "UNKNOWN")
        declared = str(item.get("license") or "UNKNOWN").strip()
        components.append({
            "name": name, "version": str(item.get("version") or "UNKNOWN"),
            "license": _normalize_backend_license(name, declared, item.get("classifiers") or []),
            "scope": "backend-runtime", "source": f"container://{container}", "license_file": "",
        })
    return sorted(components, key=lambda component: component["name"].lower())


def backend_components(root: Path, pip_report: Path | None) -> list[dict[str, str]]:
    if pip_report and pip_report.is_file():
        report = json.loads(pip_report.read_text(encoding="utf-8"))
        result = []
        for item in report.get("install", []):
            metadata = item.get("metadata", {})
            license_value = metadata.get("license_expression") or metadata.get("license") or _classifier_license(metadata)
            result.append({
                "name": str(metadata.get("name", "UNKNOWN")),
                "version": str(metadata.get("version", "UNKNOWN")),
                "license": str(license_value).strip() or "UNKNOWN",
                "scope": "backend-runtime",
                "source": str(item.get("download_info", {}).get("url", "")),
                "license_file": "",
            })
        return sorted(result, key=lambda component: component["name"].lower())
    requirements = root / "backend" / "requirements.txt"
    components = []
    for raw in requirements.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or line.startswith("-"):
            continue
        match = re.match(r"^([A-Za-z0-9_.-]+)==([^;\s]+)", line)
        if match:
            components.append({"name": match.group(1), "version": match.group(2), "license": "REVIEW_FROM_IMAGE", "scope": "backend-runtime", "source": "", "license_file": ""})
    return sorted(components, key=lambda item: item["name"].lower())


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[2])
    parser.add_argument("--output", type=Path, default=Path("dist/compliance"))
    parser.add_argument("--image", action="append", default=[], help="service=image@sha256:...; repeatable")
    parser.add_argument("--pip-report", type=Path, help="pip --report JSON from the target runtime")
    parser.add_argument("--remote-container", help="ssh-host/container-name for exact published Python inventory")
    parser.add_argument("--deployment-url", default="", help="URL represented by the supplied immutable images")
    parser.add_argument("--frontend-root", type=Path, help="exact installed frontend tree used to build the image")
    parser.add_argument("--report-only", action="store_true", help="emit evidence for a non-compliant artifact, but never mark it certifiable")
    args = parser.parse_args()
    root = args.root.resolve()
    output = (root / args.output).resolve() if not args.output.is_absolute() else args.output

    forbidden = scan_forbidden(root)
    if forbidden:
        print("Forbidden proprietary/secret artifacts detected:\n- " + "\n- ".join(forbidden), file=sys.stderr)
        return 2

    report_path = None
    if args.pip_report:
        report_path = args.pip_report if args.pip_report.is_absolute() else root / args.pip_report
    if args.remote_container:
        ssh_host, container = args.remote_container.split("/", 1)
        backend = remote_backend_components(ssh_host, container)
    else:
        backend = backend_components(root, report_path)
    frontend_root = args.frontend_root.resolve() if args.frontend_root else None
    components = frontend_components(root, frontend_root) + backend
    denied = [item for item in components if any(marker.lower() in item["license"].lower() for marker in DENIED_LICENSE_MARKERS)]
    if denied and not args.report_only:
        print("Denied licenses detected: " + json.dumps(denied, ensure_ascii=False), file=sys.stderr)
        return 3

    output.mkdir(parents=True, exist_ok=True)
    frontend_license_dir = output / "licenses" / "frontend"
    frontend_license_dir.mkdir(parents=True, exist_ok=True)
    for item in components:
        source_file = Path(item.get("license_file", ""))
        if source_file.is_file():
            safe_name = re.sub(r"[^A-Za-z0-9_.-]+", "_", f"{item['name']}-{item['version']}")
            target = frontend_license_dir / f"{safe_name}{source_file.suffix or '.txt'}"
            shutil.copyfile(source_file, target)
            item["license_file"] = target.relative_to(output).as_posix()
    sbom_components = []
    for item in components:
        component = {
            "type": "library", "name": item["name"], "version": item["version"],
            "licenses": [{"license": {"name": item["license"]}}],
            "properties": [
                {"name": "giproy:scope", "value": item["scope"]},
                {"name": "giproy:license-file", "value": item.get("license_file", "")},
            ],
        }
        if item.get("source"):
            component["externalReferences"] = [{"type": "distribution", "url": item["source"]}]
        sbom_components.append(component)
    sbom = {
        "bomFormat": "CycloneDX", "specVersion": "1.5", "version": 1,
        "metadata": {"component": {"type": "application", "name": "GiProy Network"}},
        "components": sbom_components,
    }
    sbom_path = output / "sbom.cyclonedx.json"
    sbom_path.write_text(json.dumps(sbom, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    notices = ["# THIRD-PARTY SOFTWARE NOTICES", "", "Generated from the exact dependency locks. UNKNOWN/REVIEW_FROM_IMAGE entries require metadata enrichment before certification.", ""]
    for item in components:
        evidence = f"; texto: {item['license_file']}" if item.get("license_file") else ""
        notices.append(f"- {item['name']} {item['version']} — {item['license']} ({item['scope']}){evidence}")
    notices_path = output / "THIRD_PARTY_NOTICES.md"
    notices_path.write_text("\n".join(notices) + "\n", encoding="utf-8")

    revision = subprocess.run(["git", "rev-parse", "HEAD"], cwd=root, check=True, capture_output=True, text=True).stdout.strip()
    dirty = bool(subprocess.run(["git", "status", "--porcelain"], cwd=root, check=True, capture_output=True, text=True).stdout.strip())
    manifest = {
        "schema": "giproy-release-evidence-v1", "git_commit": revision,
        "git_dirty": dirty, "images": sorted(args.image),
        "artifacts": {path.name: sha256(path) for path in (sbom_path, notices_path)},
        "unresolved_license_metadata": [f"{item['name']}@{item['version']}" for item in components if item["license"] in {"UNKNOWN", "REVIEW_FROM_IMAGE"}],
        "denied_licenses": [f"{item['name']}@{item['version']}:{item['license']}" for item in denied],
        "certification_status": "NON_COMPLIANT" if denied else ("REVIEW_REQUIRED" if dirty or not args.image or any(item["license"] in {"UNKNOWN", "REVIEW_FROM_IMAGE"} for item in components) else "TECHNICALLY_REPRODUCIBLE"),
    }
    manifest_path = output / "release-manifest.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    certificate_lines = [
        "# Certificado técnico de composición y licencias — GiProy Network",
        "", f"Estado: **{manifest['certification_status']}**", "",
        f"Despliegue examinado: `{args.deployment_url or 'NO_INDICADO'}`",
        f"Revisión Git de apoyo: `{revision}` ({'con cambios locales' if dirty else 'limpia'})", "",
        "## Identidad de artefactos", "",
        *[f"- `{item}`" for item in manifest["images"]], "",
        "## Evidencia enlazada", "",
        *[f"- `{name}` — SHA-256 `{digest}`" for name, digest in manifest["artifacts"].items()], "",
        "## Resultado técnico", "",
        f"- Componentes inventariados: {len(components)}.",
        f"- Metadatos de licencia sin resolver: {len(manifest['unresolved_license_metadata'])}.",
        f"- Dependencias expresamente denegadas: {len(manifest['denied_licenses'])}.",
        "- El gate rechaza secretos, archivos `.lic` y licencias expresamente denegadas.",
        "- Este documento certifica evidencia técnica reproducible; no sustituye la declaración de titularidad ni el dictamen jurídico.", "",
        "## Condiciones para firma", "",
        "La firma sólo procede cuando el estado sea `TECHNICALLY_REPRODUCIBLE`, los hashes coincidan con el servidor y el responsable confirme titularidad de código, marcas, imágenes, fuentes y datos.", "",
        "Responsable técnico: ____________________", "",
        "Firma: ____________________    Fecha: ____________________", "",
    ]
    certificate_path = output / "CERTIFICADO_TECNICO.md"
    certificate_path.write_text("\n".join(certificate_lines), encoding="utf-8")
    print(manifest_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
