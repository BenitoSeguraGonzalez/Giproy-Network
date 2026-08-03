#!/usr/bin/env bash
# Cross-repo (MarketI + NurIA-Odonto + Giproy Network) — check-no-passwords.sh
# Defense-in-depth check: detecta credenciales hardcoded via Python regex multilínea.
# Wrapper bash que invoca python3 inline. Mantiene extensión .sh para compat con .husky/pre-commit.
# Idéntica lógica a MarketI y NurIA-Odonto.

set -e

if ! command -v python3 >/dev/null 2>&1; then
    echo "[ERROR] python3 no está instalado, saltando check-no-passwords."
    exit 0
fi

export CHECK_STAGED="${CHECK_STAGED:-}"
if [ -z "$CHECK_STAGED" ]; then
    # Fallback: leer de git los staged
    CHECK_STAGED="$(git diff --cached --name-only --diff-filter=ACM 2>/dev/null || true)"
    export CHECK_STAGED
fi

python3 - << 'PYCHECKEND'
import os, re, sys, pathlib

STAGED = os.environ.get("CHECK_STAGED", "").split()
if not STAGED:
    print("[check-no-passwords] No hay archivos staged, skip.")
    sys.exit(0)

# Multiline regex — match SERVER = {... "password": "..."}, server.password = "...", etc.
SERVER_PATTERN = re.compile(
    r'(?i)(?:SERVER|server|self\._?server|config|CLIENT)'
    r'\s*[:=]?\s*[\{\[\(]'
    r'[\s\S]*?'
    r'["\'](?:password|passwd|secret_key|token|api_key|access_key)["\']?'
    r'\s*[:=]\s*'
    r'["\']([A-Za-z0-9._\-!@#$%^&*?]{6,})["\']'
)

# Single-line literal key/value
SINGLE_PATTERN = re.compile(
    r'(?i)\b(?:password|passwd|secret_key|token|api_key|access_key|auth_token)\b'
    r'\s*[:=]\s*'
    r'["\']([A-Za-z0-9._\-!@#$%^&*?]{8,})["\']'
)

# Line is safe if it reads from env / prompt / example placeholder
SAFE_LINE_PATTERN = re.compile(
    r'\.env\.example|<generar-|os\.environ|os\.getenv|getenv\(|process\.env|'
    r'secrets\.|\binput\s*\(|example\.com|placeholder|\bexample\b|\btest\b|'
    r'\bfixture\b|\bTODO\b|\bFIXME\b|\bdemo\b|\bfake\b|\bmock\b|XXXXX'
)

# Tunnel token plano (--token eyJ...)
CLOUD_TOKEN_PATTERN = re.compile(r'\-\-token\s+eyJ[A-Za-z0-9_\-]{32,}')

VIOLATIONS = 0

for f in STAGED:
    p = pathlib.Path(f)
    if not p.exists() or p.is_dir():
        continue
    if p.suffix not in ('.py', '.ps1', '.sh', '.md', '.txt', '.yml', '.yaml', '.json'):
        continue
    try:
        content = p.read_text(encoding='utf-8', errors='replace')
    except Exception as e:
        print(f"[WARN] {f}: skipped ({e})")
        continue

    for m in SERVER_PATTERN.finditer(content):
        line_start = content.rfind('\n', 0, m.start()) + 1
        line_end = content.find('\n', m.end())
        if line_end == -1:
            line_end = len(content)
        line = content[line_start:line_end]
        if SAFE_LINE_PATTERN.search(line):
            continue
        print(f"[FAIL] {f}: credencial hardcoded en estilo SERVER/config — {m.group(0)[:120]}…")
        VIOLATIONS += 1

    for m in SINGLE_PATTERN.finditer(content):
        line_start = content.rfind('\n', 0, m.start()) + 1
        line_end = content.find('\n', m.end())
        if line_end == -1:
            line_end = len(content)
        line = content[line_start:line_end].strip()
        if SAFE_LINE_PATTERN.search(line):
            continue
        print(f"[FAIL] {f}: credential literal en línea  →  {line}")
        VIOLATIONS += 1

    if CLOUD_TOKEN_PATTERN.search(content):
        print(f"[FAIL] {f}: --token cloudflared plano (usar cert.pem)")
        VIOLATIONS += 1

if VIOLATIONS > 0:
    print()
    print(f"❌ check-no-passwords encontró {VIOLATIONS} violación(es).")
    print("   Remover credenciales hardcoded de los archivos listados.")
    print("   Usar os.environ, dotenv, o env vars en runtime.")
    sys.exit(1)

print("[check-no-passwords] Sin violaciones.")
PYCHECKEND
