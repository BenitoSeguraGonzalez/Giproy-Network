# Giproy Network — Security Reference (Maxima Seguridad)

> Documento maestro de seguridad para Giproy Network, derivado del cross-repo hardening de julio 2026. Cualquier degradación pasa review.

---

## 1. Action items derivados del audit 2026-07

### A1. `restart_backend.py` (MEDIO)
Probablemente contiene credenciales con el patrón `SERVER["password"]` similar al de NurIA-Odonto. **Acción**:
1. `git grep -nE "SERVER|server|password|secret|token" restart_backend.py deploy/ scripts/`
2. Para cada match: mover a `os.environ.get(...)` con `MarketI_*` o `Giproy_*` prefix.
3. Generar par ed25519 Windows + distribuir al server con `ssh-copy-id`.

### A2. `.claudeignore` y backups legacy (MEDIO)
Tu dir `CloudFlared-bkp/` puede tener configuraciones de cloudflared con `--token` plan. **Acción**:
1. Si aún se usan, migrar a cert-based (`cloudflared tunnel login` + cert.pem).
2. Si son solo backups históricos, dejarlos en `.gitignore` y `chmod 600` para evitar leaks.
3. Aplicar `.gitleaks.toml` allowlist para que no rompan pre-commit por credenciales históricas.

### A3. `delphi version/` legacy (BAJO)
La carpeta `delphi version/` contiene fuentes legacy. Acción preventiva: ya está en `.gitleaks.toml` allowlist. Si se reactiva ese código, mover credenciales a runtime env.

### A4. `restart_backend.py` + `giproy_service_start.bat` + `instalar_servicio.bat` (MEDIO)
Múltiples scripts Windows en raíz con dependencias potenciales de credenciales hardcoded. Aplicar el mismo `check-no-passwords.sh` heurístico en pre-commit.

## 2. Stack de seguridad (Estado v1 — julio 2026)

### 2.1 Identidad y autenticación
- (Ver `CLAUDE.md` raíz del proyecto para estado actual).
- **Pendiente**: auditar flujo de auth existente; reemplazar passwords hardcoded.

### 2.2 Transporte
- HTTPS obligatorio. Cloudflared tunnel + LetsEncrypt.
- (Verificar estado actual en `cloudflared-bkp/` y service registry).

### 2.3 Aplicación
- CSP, CORS estricto (NO wildcards), rate limiting, CSRF (Double-Submit-Cookie).
- **Audit pendiente**: revisar `.env` y ver si CORS permite `*`.

### 2.4 Datos
- DB cifrada-at-rest opcional con `pgaudit` o equivalente MySQL.
- Audit log append-only (BEFORE UPDATE OR DELETE raise exception).

### 2.5 Infraestructura
- Cloudflared cert-based dedicado. (Recomiendo crear `cloudflared-giproy` tunnel siguiendo patrón MarketI).
- SSH key auth ed25519 (NO password).
- Container non-root (si migra a Docker).

### 2.6 Procesamiento
- Pre-commit `gitleaks` activo (configurado en `.gitleaks.toml`).
- Heuristic `check-no-passwords.sh` (template) defense-in-depth.
- `chmod +x .husky/pre-commit` post-clone (Linux).

## 3. Responsabilidades

| Rol | Responsabilidad de seguridad |
|---|---|
| Backend lead | Code review, auth, secrets handling |
| DBA / DBA-equivalente | pg_dump, backups, role mgmt |
| DevOps | Cloudflare tunnel cert rotation |

## 4. Operativos recurrentes

### Setup inicial
```bash
# En tu máquina dev
git config core.hooksPath .husky
chmod +x .husky/pre-commit                                  # Linux
# Windows: el .git config basta, no chmod
pnpm husky install 2>/dev/null || true                       # si usas husky

# Verificar reglas gitleaks operan
gitleaks protect --staged --redact --verbose --config .gitleaks.toml
bash infra/scripts/check-no-passwords.sh                   # si tienes el script
```

### Backup DB
```bash
# Adaptar al PSP real (parece Windows service + script .bat)
ssh benito@192.168.18.106 '/ruta/al/backup/giproy.sh'
ls /home/benito/docker/backups/giproy/                      # ajustar a tu setup real
```

### Deploy
- Aplicar regla de oro: tests + tsc + secrets-check antes de deploy.
- No deployar con `.env` con secretos hardcoded.

## 5. Decisiones pendientes

| ID | Tema | Estado | Próximo paso |
|---|---|---|---|
| GIP-SEC-001 | Migrar service a cert-based cloudflared | Pendiente v1 | Crear `cloudflared-giproy` tunnel + update NSSM |
| GIP-SEC-002 | Audit `.bat` scripts por credenciales hardcoded | Pendiente | Ejecutar `grep -nE "SERVER\|password\|token"` en todos los .bat |
| GIP-SEC-003 | Mover `.env` secretos a dotenv / vars de entorno | Pendiente | Generar `.env.example` |
| GIP-SEC-004 | Renombrar `restart_backend.py` a `restart_backend_with_secrets.py` y forzar env-vars | Pendiente v2 | Cambio breaking |

## 6. Referencias cruzadas

- `CLAUDE.md` raíz del proyecto.
- `TODO.md` — bugs conocidos + deuda técnica.
- `.gitleaks.toml` — reglas de secret scanning.
- `cloudflared-bkp/` — backups históricos (allowlisted).
- `delphi version/` — legacy source (allowlisted).

---

*Última revisión: julio 2026. Revisar trimestralmente o tras incidente.*
