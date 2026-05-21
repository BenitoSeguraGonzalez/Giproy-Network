import os
import json
import re
from pathlib import Path

ROOT = Path(".").resolve()

def write(path, content):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf8") as f:
        f.write(content.strip() + "\n")

print("Instalando AI Enterprise Toolkit...")

# ------------------------------------------------
# AI CONTEXT
# ------------------------------------------------

write(ROOT / "AI_CONTEXT.md", """
# AI_CONTEXT.md

Contexto rápido para motores de IA.

Objetivo:
Reducir el análisis del repositorio entre 80% y 95%.

Tecnologías:

Backend: Python
Frontend: React
Database: PostgreSQL

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

Evitar reanalizar todo el repositorio.

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
# ANALIZADOR ENTERPRISE
# ------------------------------------------------

write(ROOT / "tools/ai_tools/analyze_enterprise.py", r"""
import os
import re
import json
from pathlib import Path

ROOT = Path(".").resolve()

data = {
 "backend_modules":[],
 "frontend_components":[],
 "api_endpoints":[],
 "react_routes":[],
 "dependencies_python":[],
 "dependencies_node":[],
 "dead_code":[],
 "technical_debt":[],
 "unused_functions":[]
}

functions = {}
calls = set()

for root,dirs,files in os.walk(ROOT):

 for f in files:

  path = os.path.join(root,f)

  if f.endswith(".py"):

   data["backend_modules"].append(path)

   try:
    txt = open(path,"r",errors="ignore").read()

    # endpoints
    if "@router." in txt or "@app.route" in txt:
     data["api_endpoints"].append(path)

    # funciones
    defs = re.findall(r"def\s+(\w+)\(",txt)

    for d in defs:
     functions[d] = path

    calls_found = re.findall(r"(\w+)\(",txt)

    for c in calls_found:
     calls.add(c)

    # deuda tecnica
    if "TODO" in txt or "FIXME" in txt:
     data["technical_debt"].append(path)

    # dead code
    if "if False:" in txt:
     data["dead_code"].append(path)

   except:
    pass

  if f.endswith(".jsx") or f.endswith(".tsx"):

   data["frontend_components"].append(path)

   try:
    txt = open(path,"r",errors="ignore").read()

    routes = re.findall(r"<Route.*path=\"([^\"]+)\"",txt)

    for r in routes:
     data["react_routes"].append(r)

   except:
    pass

  if f == "requirements.txt":
   data["dependencies_python"].append(path)

  if f == "package.json":
   data["dependencies_node"].append(path)

# detectar funciones no usadas

for fn in functions:
 if fn not in calls:
  data["unused_functions"].append(fn)

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

doc += "\n## React components\n"
for m in data["frontend_components"]:
 doc += "- " + m + "\n"

doc += "\n## API endpoints\n"
for m in data["api_endpoints"]:
 doc += "- " + m + "\n"

doc += "\n## React routes\n"
for r in data["react_routes"]:
 doc += "- " + r + "\n"

doc += "\n## Dead code\n"
for m in data["dead_code"]:
 doc += "- " + m + "\n"

doc += "\n## Unused functions\n"
for m in data["unused_functions"]:
 doc += "- " + m + "\n"

with open("docs/architecture/ARCHITECTURE.md","w") as f:
 f.write(doc)

print("ARCHITECTURE.md generado")
""")

# ------------------------------------------------
# DASHBOARD LOCAL
# ------------------------------------------------

write(ROOT / "tools/ai_tools/dashboard.py", r"""
import json
from http.server import SimpleHTTPRequestHandler, HTTPServer

PORT = 8123

class Handler(SimpleHTTPRequestHandler):
    pass

print("Dashboard disponible en http://localhost:8123/docs/architecture/ARCHITECTURE.md")

HTTPServer(("localhost",PORT),Handler).serve_forever()
""")

print("AI Enterprise Toolkit instalado correctamente.")