#!/usr/bin/env python3
"""Aggregate privacy-safe OWASP CRS observations from Docker logs."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlsplit


ACCESS_RE = re.compile(r'"(?P<method>[A-Z]+) (?P<uri>\S+) HTTP/[^"]+" (?P<status>\d{3}) ')
NUMERIC_SEGMENT_RE = re.compile(r"(?<=/)\d+(?=/|$)")
UUID_SEGMENT_RE = re.compile(
    r"(?<=/)[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-"
    r"[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}(?=/|$)"
)


def normalize_route(uri: str) -> str:
    path = urlsplit(uri).path or "/"
    path = UUID_SEGMENT_RE.sub("{uuid}", path)
    return NUMERIC_SEGMENT_RE.sub("{id}", path)


def read_logs(container: str, since: str) -> list[str]:
    result = subprocess.run(
        ["docker", "logs", "--since", since, container],
        check=True,
        capture_output=True,
        text=True,
    )
    return (result.stdout + result.stderr).splitlines()


def load_state(path: Path) -> dict:
    if not path.exists():
        return {"started_at": datetime.now(timezone.utc).isoformat(), "seen": []}
    return json.loads(path.read_text(encoding="utf-8"))


def atomic_json(path: Path, payload: dict) -> None:
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary.replace(path)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--container", default="giproy-beta-waf")
    parser.add_argument("--since", default="65m")
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--window-days", type=int, default=7)
    args = parser.parse_args()

    args.output_dir.mkdir(parents=True, exist_ok=True)
    state_path = args.output_dir / "state.json"
    observations_path = args.output_dir / "observations.jsonl"
    state = load_state(state_path)
    seen = set(state.get("seen", []))
    seen_access = set(state.get("seen_access", []))
    new_seen: list[str] = []
    new_seen_access: list[str] = []
    access_rows: list[dict] = []
    detections: list[dict] = []

    for line in read_logs(args.container, args.since):
        match = ACCESS_RE.search(line)
        if match:
            access_digest = hashlib.sha256(line.encode("utf-8")).hexdigest()
            if access_digest in seen_access:
                continue
            new_seen_access.append(access_digest)
            access_rows.append(
                {
                    "method": match.group("method"),
                    "route": normalize_route(match.group("uri")),
                    "status": int(match.group("status")),
                }
            )
        if not line.startswith('{"transaction"'):
            continue
        try:
            transaction = json.loads(line)["transaction"]
        except (KeyError, json.JSONDecodeError):
            continue
        unique_id = str(transaction.get("unique_id") or "")
        if not unique_id or unique_id in seen:
            continue
        request = transaction.get("request") or {}
        response = transaction.get("response") or {}
        messages = transaction.get("messages") or []
        rule_ids = sorted(
            {
                str(message.get("details", {}).get("ruleId"))
                for message in messages
                if message.get("details", {}).get("ruleId")
            }
        )
        score = 0
        for message in messages:
            if str(message.get("details", {}).get("ruleId")) == "949110":
                found = re.search(r"Total Score: (\d+)", str(message.get("message", "")))
                score = int(found.group(1)) if found else score
        row = {
            "observed_at": transaction.get("time_stamp"),
            "method": request.get("method", "UNKNOWN"),
            "route": normalize_route(request.get("uri", "/")),
            "status": int(response.get("http_code") or 0),
            "rule_ids": rule_ids,
            "anomaly_score": score,
        }
        detections.append(row)
        new_seen.append(unique_id)

    if detections:
        with observations_path.open("a", encoding="utf-8") as stream:
            for row in detections:
                stream.write(json.dumps(row, ensure_ascii=False) + "\n")

    all_observations: list[dict] = []
    if observations_path.exists():
        for line in observations_path.read_text(encoding="utf-8").splitlines():
            try:
                row = json.loads(line)
            except json.JSONDecodeError:
                continue
            # CRS timestamps are retained only as operational evidence; malformed
            # timestamps stay in the report rather than breaking collection.
            all_observations.append(row)

    route_rules = Counter(
        (row["method"], row["route"], rule_id)
        for row in all_observations
        for rule_id in row.get("rule_ids", [])
        if rule_id != "949110"
    )
    started_at = datetime.fromisoformat(state["started_at"])
    elapsed_days = (datetime.now(timezone.utc) - started_at).total_seconds() / 86400
    total_requests = int(state.get("total_requests", 0)) + len(access_rows)
    api_requests = int(state.get("api_requests", 0)) + sum(
        row["route"].startswith("/api/") for row in access_rows
    )
    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "mode": "DetectionOnly",
        "window_days_required": args.window_days,
        "elapsed_days": round(elapsed_days, 3),
        "totals": {
            "requests": total_requests,
            "api_requests": api_requests,
            "detections": len(all_observations),
        },
        "latest_sample": {
            "requests": len(access_rows),
            "new_detections": len(detections),
        },
        "top_rule_route_pairs": [
            {"method": key[0], "route": key[1], "rule_id": key[2], "count": count}
            for key, count in route_rules.most_common(30)
        ],
        "candidate_review": [
            {"method": key[0], "route": key[1], "rule_id": key[2], "count": count}
            for key, count in route_rules.most_common()
            if count >= 3
        ][:30],
        "promotion_gate": {
            "time_complete": elapsed_days >= args.window_days,
            "traffic_complete": total_requests >= 500 and api_requests >= 200,
            "human_review_required": True,
            "auto_promotion": False,
        },
        "privacy": {
            "query_strings": False,
            "client_ips": False,
            "headers": False,
            "bodies": False,
        },
    }
    atomic_json(args.output_dir / "latest.json", report)
    state.update(
        {
            "seen": (state.get("seen", []) + new_seen)[-10000:],
            "seen_access": (state.get("seen_access", []) + new_seen_access)[-100000:],
            "total_requests": total_requests,
            "api_requests": api_requests,
            "last_run_at": report["generated_at"],
        }
    )
    atomic_json(state_path, state)
    print(json.dumps(report, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
