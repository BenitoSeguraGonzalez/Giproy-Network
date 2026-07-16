import os
from pathlib import Path

ROOT = Path.cwd()

skills = {
    "project-snapshot": """---
name: project-snapshot
description: Mantiene el contexto persistente de GiProy Network.
---

# Project Snapshot Skill

1. Revisar:
   - AI_CONTEXT.md
   - docs/project_state.json
   - docs/HANDOFF.md
   - docs/architecture/project_map.json

2. Actualizar contexto después de cambios importantes.
""",

    "safe-refactor": """---
name: safe-refactor
description: Refactors seguros para GiProy Network.
---

# Safe Refactor Skill

1. Revisar dependencias.
2. Revisar imports.
3. Revisar impacto backend/frontend.
4. No romper contratos API.
""",

    "fullstack-sync": """---
name: fullstack-sync
description: Mantiene sincronía backend/frontend.
---

# Fullstack Sync Skill

1. Revisar DTOs.
2. Revisar endpoints.
3. Revisar frontend API clients.
4. Revisar schemas.
""",

    "tenancy-guard": """---
name: tenancy-guard
description: Protege aislamiento multitenant.
---

# Tenancy Guard Skill

1. Validar company_id.
2. Validar tenant_id.
3. Revisar permisos.
4. Revisar aislamiento.
""",

    "database-migration": """---
name: database-migration
description: Gestiona cambios seguros de PostgreSQL.
---

# Database Migration Skill

1. Revisar migraciones.
2. Revisar FK.
3. Revisar índices.
4. Revisar compatibilidad.
""",

    "architecture-enforcer": """---
name: architecture-enforcer
description: Mantiene arquitectura limpia.
---

# Architecture Enforcer Skill

1. No lógica negocio en React.
2. No SQL complejo en routers.
3. Mantener separación de capas.
""",

    "documentation-continuity": """---
name: documentation-continuity
description: Mantiene documentación viva.
---

# Documentation Continuity Skill

1. Actualizar HANDOFF.md.
2. Actualizar CHANGELOG.md.
3. Actualizar project_state.json.
""",

    "git-safety": """---
name: git-safety
description: Seguridad Git antes de cambios grandes.
---

# Git Safety Skill

1. Revisar git status.
2. Crear branches.
3. Revisar diffs.
4. Documentar rollback.
""",

    "claudeignore-manager": """---
name: claudeignore-manager
description: Mantiene .claudeignore optimizado.
---

# Claudeignore Manager Skill

1. Excluir node_modules.
2. Excluir builds.
3. Excluir logs.
4. Excluir entornos virtuales.
"""
}

claudeignore = """node_modules/
dist/
build/
coverage/
.next/
.vite/
.cache/
tmp/
logs/
*.log
venv/
.venv/
__pycache__/
*.pyc
.env
.env.*
"""

docs_files = [
    "AI_CONTEXT.md",
    "docs/HANDOFF.md",
    "docs/CHANGELOG.md",
    "docs/project_state.json",
    "docs/architecture/project_map.json"
]

print("======================================")
print(" Generador de Skills para GiProy")
print("======================================")

(Path(".claude") / "skills").mkdir(parents=True, exist_ok=True)

for skill_name, content in skills.items():
    skill_dir = Path(".claude") / "skills" / skill_name
    skill_dir.mkdir(parents=True, exist_ok=True)

    skill_file = skill_dir / "SKILL.md"
    skill_file.write_text(content, encoding="utf-8")

    print(f"[OK] Skill creada: {skill_name}")

Path(".claudeignore").write_text(claudeignore, encoding="utf-8")
print("[OK] .claudeignore creado")

for file_path in docs_files:
    path = Path(file_path)
    path.parent.mkdir(parents=True, exist_ok=True)

    if not path.exists():
        path.write_text("", encoding="utf-8")
        print(f"[OK] Archivo creado: {file_path}")

print("======================================")
print(" Skills instaladas correctamente")
print("======================================")
