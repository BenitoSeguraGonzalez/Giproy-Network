import os
import json
import re
from pathlib import Path

ROOT = Path(".").resolve()

def write(path, content):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf8") as f:
        f.write(content.strip() + "\n")

print("Instalando AI Architecture Toolkit...")

# ------------------------------------------------
# AI CONTEXT
# ------------------------------------------------

write(ROOT / "AI_CONTEXT.md", """
# AI_CONTEXT.md

Archivo de contexto rápido para motores IA.

Reduce el análisis del repositorio entre 80% y 95%.

Tecnologías:

Backend: Python
Frontend: React
Database: PostgreSQL

Componentes:

backend/
frontend/
tools/
tools/launcher
docs/
.runtime

Flujo IA:

1 Leer AI_CONTEXT.md
2 Leer docs/project_state.json
3 Leer docs/HANDOFF.md
4 Revisar docs/tasks
""")

# ------------------------------------------------
# PROMPT ACTIVACION
# ------------------------------------------------

write(ROOT / "ACTIVATE_PROMPT.md", """
PROMPT DE ACTIVACIÓN

Leer primero:

AI_CONTEXT.md
docs/project_state.json
docs/HANDOFF.md
docs/tasks

Usar project_state.json como snapshot.

Evitar reanalizar el repositorio completo.

Registrar cambios como TASKS.
""")

# ------------------------------------------------
# PROJECT STATE
# ------------------------------------------------

state = {
 "project":{
  "backend":"python",
  "frontend":"react",
  "database":"postgresql"
 },
 "components":{
  "backend_modules":[],
  "frontend_modules":[],
  "api_endpoints":[]
 },
 "analysis":{
  "snapshot_version":1
 }
}

write(ROOT / "docs/project_state.json", json.dumps(state,indent=2))

# ------------------------------------------------
# TASK TEMPLATE
# ------------------------------------------------

write(ROOT / "docs/tasks/TASK_TEMPLATE.md", """
# TASK-ID

Estado:
OPEN / IN_PROGRESS / BLOCKED / DONE

Tipo:
feature / bug / refactor / infra / docs

Prioridad:
low / medium / high / critical

Motivación:

Archivos afectados:

Checklist:

[ ] análisis
[ ] implementación
[ ] pruebas
[ ] documentación
""")

# ------------------------------------------------
# HANDOFF
# ------------------------------------------------

write(ROOT / "docs/HANDOFF.md", """
# HANDOFF

Fecha:
Motor IA:

Última TASK completada:

TASK en progreso:

Problemas abiertos:

Próximo paso recomendado:
""")

# ------------------------------------------------
# CHANGELOG
# ------------------------------------------------

write(ROOT / "docs/CHANGELOG.md", """
# CHANGELOG

## Fecha

### TASK-ID

Cambios realizados
""")

# ------------------------------------------------
# ANALIZADOR AVANZADO
# ------------------------------------------------

write(ROOT / "tools/ai_tools/analyze_project.py", r"""
import os
import re
import json
from pathlib import Path

ROOT = Path(".").resolve()

data = {
 "backend_modules":[],
 "frontend_components":[],
 "api_endpoints":[],
 "dependencies_python":[],
 "dependencies_node":[],
 "dead_code":[],
 "technical_debt":[]
}

for root,dirs,files in os.walk(ROOT):

 for f in files:

  path = os.path.join(root,f)

  # backend modules
  if f.endswith(".py"):

   data["backend_modules"].append(path)

   try:
    txt = open(path,"r",errors="ignore").read()

    # FastAPI
    fastapi = re.findall(r"@router\.(get|post|put|delete)",txt)

    if fastapi:
     data["api_endpoints"].append(path)

    # Flask
    flask = re.findall(r"@app\.route",txt)

    if flask:
     data["api_endpoints"].append(path)

    # TODO / FIXME
    if "TODO" in txt or "FIXME" in txt:
     data["technical_debt"].append(path)

    # dead code
    if "if False:" in txt:
     data["dead_code"].append(path)

   except:
    pass

  # React
  if f.endswith(".jsx") or f.endswith(".tsx"):

   data["frontend_components"].append(path)

  # dependencies
  if f == "requirements.txt":
   data["dependencies_python"].append(path)

  if f == "package.json":
   data["dependencies_node"].append(path)

os.makedirs("docs/architecture",exist_ok=True)

with open("docs/architecture/project_map.json","w") as f:
 json.dump(data,f,indent=2)

print("project_map.json generado")
""")

# ------------------------------------------------
# GENERADOR DOCUMENTACION
# ------------------------------------------------

write(ROOT / "tools/ai_tools/generate_architecture_doc.py", r"""
import json

with open("docs/architecture/project_map.json") as f:
 data = json.load(f)

doc = "# Arquitectura del Proyecto\n"

doc += "\n## Backend modules\n"

for m in data["backend_modules"]:
 doc += "- " + m + "\n"

doc += "\n## Frontend components\n"

for m in data["frontend_components"]:
 doc += "- " + m + "\n"

doc += "\n## API endpoints\n"

for m in data["api_endpoints"]:
 doc += "- " + m + "\n"

doc += "\n## Posible deuda técnica\n"

for m in data["technical_debt"]:
 doc += "- " + m + "\n"

doc += "\n## Dead code detectado\n"

for m in data["dead_code"]:
 doc += "- " + m + "\n"

with open("docs/architecture/ARCHITECTURE.md","w") as f:
 f.write(doc)

print("ARCHITECTURE.md generado")
""")

print("AI Architecture Toolkit instalado correctamente.")