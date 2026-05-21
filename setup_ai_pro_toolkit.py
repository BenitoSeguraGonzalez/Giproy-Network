import os
import json
import re
from pathlib import Path

ROOT = Path(".").resolve()

def write(path, content):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf8") as f:
        f.write(content.strip() + "\n")

print("Instalando AI PRO Toolkit...")

# ------------------------------------------------
# AI_CONTEXT
# ------------------------------------------------

write(ROOT / "AI_CONTEXT.md", """
# AI_CONTEXT.md

Contexto rápido del proyecto para motores de IA.

Tecnologías principales

Backend: Python
Frontend: React
Database: PostgreSQL

Componentes del sistema

backend/
frontend/
tools/
docs/

Flujo recomendado para IA

1 Leer AI_CONTEXT.md
2 Leer docs/project_state.json
3 Leer docs/HANDOFF.md
4 Revisar docs/tasks
5 Analizar cambios respecto al snapshot

Objetivo

Evitar que la IA tenga que reconstruir todo el proyecto.
Reduce el tiempo de análisis entre 80% y 95%.
""")

# ------------------------------------------------
# AI SUPER PROMPT
# ------------------------------------------------

write(ROOT / "AI_SUPER_PROMPT.md", """
AI SUPER PROMPT

Actúa como arquitecto senior full-stack especializado en:

Python backend
React frontend
PostgreSQL
Arquitectura de software

Reglas obligatorias

Nunca generar código sin analizar primero:

AI_CONTEXT.md
docs/project_state.json
docs/architecture/project_map.json
docs/HANDOFF.md
docs/tasks

Flujo de trabajo

1 Analizar snapshot del proyecto
2 Detectar diferencias con el repositorio
3 Crear TASK para cada modificación
4 Documentar cambios en CHANGELOG

Prohibiciones

No modificar arquitectura sin TASK
No generar código duplicado
No eliminar código sin verificar dependencias

Objetivo

Continuar el desarrollo del proyecto respetando arquitectura existente.
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

Estado
OPEN / IN_PROGRESS / BLOCKED / DONE

Tipo
feature / bug / refactor / infra / docs

Prioridad
low / medium / high / critical

Descripción

Archivos afectados

Checklist

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

Fecha

Motor IA utilizado

Última TASK completada

TASK en progreso

Problemas abiertos

Próximo paso recomendado
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
# ANALIZADOR PROYECTO
# ------------------------------------------------

write(ROOT / "tools/ai_tools/analyze_project_pro.py", r"""
import os
import re
import json

data = {
 "backend_modules":[],
 "frontend_components":[],
 "api_endpoints":[],
 "react_routes":[],
 "dependencies_python":[],
 "dependencies_node":[],
 "technical_debt":[],
 "dead_code":[],
 "unused_functions":[]
}

functions = {}
calls = set()

for root,dirs,files in os.walk("."):

 for f in files:

  path = os.path.join(root,f)

  if f.endswith(".py"):

   data["backend_modules"].append(path)

   try:
    txt = open(path,"r",errors="ignore").read()

    if "@router." in txt or "@app.route" in txt:
     data["api_endpoints"].append(path)

    defs = re.findall(r"def\s+(\w+)\(",txt)

    for d in defs:
     functions[d] = path

    calls_found = re.findall(r"(\w+)\(",txt)

    for c in calls_found:
     calls.add(c)

    if "TODO" in txt or "FIXME" in txt:
     data["technical_debt"].append(path)

    if "if False:" in txt:
     data["dead_code"].append(path)

   except:
    pass

  if f.endswith(".jsx") or f.endswith(".tsx"):

   data["frontend_components"].append(path)

   try:
    txt = open(path,"r",errors="ignore").read()

    routes = re.findall(r'<Route.*path="([^"]+)"',txt)

    for r in routes:
     data["react_routes"].append(r)

   except:
    pass

  if f == "requirements.txt":
   data["dependencies_python"].append(path)

  if f == "package.json":
   data["dependencies_node"].append(path)

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
# DASHBOARD
# ------------------------------------------------

write(ROOT / "tools/ai_tools/dashboard.py", r"""
from http.server import SimpleHTTPRequestHandler, HTTPServer

PORT = 8123

print("Dashboard disponible en http://localhost:8123/docs/architecture/ARCHITECTURE.md")

HTTPServer(("localhost",PORT),SimpleHTTPRequestHandler).serve_forever()
""")

print("AI PRO Toolkit instalado correctamente.")