#!/usr/bin/env python3
"""Fail-closed comparison between a release manifest and deployed containers."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys
from urllib.request import Request, urlopen


SAFE_NAME = re.compile(r"^[A-Za-z0-9_.-]+$")


def ssh(host: str, command: str) -> str:
    if not SAFE_NAME.fullmatch(host):
        raise ValueError("SSH host contains unsupported characters")
    result = subprocess.run(["ssh", host, command], check=True, capture_output=True, text=True)
    return result.stdout.strip()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("manifest", type=Path)
    parser.add_argument("--ssh-host", required=True)
    parser.add_argument("--service", action="append", default=[], help="manifest-service=container-name")
    parser.add_argument("--url", required=True)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()

    manifest = json.loads(args.manifest.read_text(encoding="utf-8"))
    expected = {}
    for item in manifest.get("images", []):
        service_image, digest = item.split("@", 1)
        service, _image = service_image.split("=", 1)
        expected[service] = f"sha256:{digest.removeprefix('sha256:')}" if not digest.startswith("sha256:") else digest
    mapping = dict(item.split("=", 1) for item in args.service)
    findings = []
    for service, container in mapping.items():
        if not SAFE_NAME.fullmatch(container):
            raise ValueError(f"Invalid container name: {container}")
        actual = ssh(args.ssh_host, f"docker inspect --format='{{{{.Image}}}}' {container}")
        wanted = expected.get(service)
        findings.append({"service": service, "container": container, "expected": wanted, "actual": actual, "match": wanted == actual})

    request = Request(args.url, headers={"User-Agent": "GiProy-Release-Verifier/1.0"})
    with urlopen(request, timeout=15) as response:
        health = {"url": args.url, "status": response.status, "reachable": 200 <= response.status < 400}

    result = {
        "schema": "giproy-deployment-verification-v1",
        "manifest_sha256": hashlib.sha256(args.manifest.read_bytes()).hexdigest(),
        "containers": findings, "health": health,
        "verified": bool(findings) and all(item["match"] for item in findings) and health["reachable"],
    }
    payload = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(payload, encoding="utf-8")
    print(payload, end="")
    return 0 if result["verified"] else 4


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"Deployment verification failed: {exc}", file=sys.stderr)
        raise SystemExit(5)
