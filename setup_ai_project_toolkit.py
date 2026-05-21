import os
import json
from pathlib import Path

ROOT = Path(".").resolve()

def write(path, content):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf8") as f:
        f.write(content.strip() + "\n")

print("Creando AI Project Toolkit...")

# =========================
# AI CONTEXT
# =========================

write(ROOT / "AI_CONTEXT.md", """
# AI_CONTEXT.md

Archivo de contexto rápido para motores de IA.

Objetivo:
Reducir el tiempo de análisis del repositorio entre 80% y 95%.

Tecnologías principales:

Backend: Python
Frontend: React
Base de datos: PostgreSQL

Componentes principales:

backend/
frontend/
tools/
tools/launcher → control de servicios Windows
docs/
.runtime → logs y monitorización

Flujo recomendado para motores IA:

1. Leer AI_CONTEXT.md
2. Leer docs/project_state.json
3. Leer docs/HANDOFF.md
4. Revisar docs/tasks
5. Analizar solo cambios respecto al snapshot
""")

# =========================
# PROMPT ACTIVACION
# =========================

write(ROOT / "ACTIVATE_PROMPT.md", """
PROMPT DE ACTIVACIÓN DEL SISTEMA IA

Lee primero:

AI_CONTEXT.md
docs/project_state.json
docs/HANDOFF.md
docs/tasks/

Usa project_state.json como snapshot del proyecto.

Evita reanalizar todo el repositorio.

Si detectas cambios estructurales actualiza:

docs/project_state.json
docs/architecture/project_map.json

Todas las operaciones deben registrarse como TASKS.
""")

# =========================
# PROJECT STATE
# =========================

state = {
    "project": {
        "name": "PROJECT_NAME",
        "backend": "python",
        "frontend": "react",
        "database": "postgresql"
    },
    "components": {
        "backend_modules": [],
        "frontend_modules": [],
        "api_endpoints": [],
        "dependencies": []
    },
    "analysis": {
        "snapshot_version": 1
    }
}

write(
    ROOT / "docs/project_state.json",
    json.dumps(state, indent=2)
)

# =========================
# PROJECT MAP
# =========================

project_map = {
    "backend_modules": [],
    "frontend_components": [],
    "api_endpoints": [],
    "dependencies": [],
    "technical_debt": []
}

write(
    ROOT / "docs/architecture/project_map.json",
    json.dumps(project_map, indent=2)
)

# =========================
# HANDOFF
# =========================

write(ROOT / "docs/HANDOFF.md", """
# HANDOFF

Fecha:
Motor IA:

Última TASK completada:

TASK en progreso:

Problemas abiertos:

Próximo paso recomendado:
""")

# =========================
# CHANGELOG
# =========================

write(ROOT / "docs/CHANGELOG.md", """
# CHANGELOG

## Fecha

### TASK-ID

Cambios realizados:

Impacto backend:
Impacto frontend:
Impacto base de datos:
""")

# =========================
# TASK TEMPLATE
# =========================

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

- [ ] análisis
- [ ] implementación
- [ ] pruebas
- [ ] documentación
- [ ] actualización project_state.json
""")

# =========================
# SCRIPT: GENERAR SNAPSHOT
# =========================

write(ROOT / "tools/ai_tools/generate_project_state.py", r"""
import os, json

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DOCS = os.path.join(ROOT, "docs")
STATE_FILE = os.path.join(DOCS, "project_state.json")

def modules(path):
    if not os.path.exists(path):
        return []
    return [d for d in os.listdir(path) if os.path.isdir(os.path.join(path, d))]

state = {
    "components": {
        "backend_modules": modules(os.path.join(ROOT,"backend")),
        "frontend_modules": modules(os.path.join(ROOT,"frontend"))
    }
}

os.makedirs(DOCS, exist_ok=True)

with open(STATE_FILE,"w") as f:
    json.dump(state,f,indent=2)

print("project_state.json generado")
""")

# =========================
# INDEXADOR PROYECTO
# =========================

write(ROOT / "tools/ai_tools/index_project.py", r"""
import os,json,re

ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),"..",".."))
OUT=os.path.join(ROOT,"docs","architecture","project_map.json")

data={
 "backend_modules":[],
 "frontend_components":[],
 "api_endpoints":[],
 "dependencies":[],
 "technical_debt":[]
}

for root,dirs,files in os.walk(ROOT):
 for f in files:
  path=os.path.join(root,f)

  if f.endswith(".py"):
   data["backend_modules"].append(path)

   try:
       with open(path,"r",errors="ignore") as fp:
           txt=fp.read()

           if "@router" in txt or "@app.route" in txt:
               data["api_endpoints"].append(path)

           if "TODO" in txt or "FIXME" in txt:
               data["technical_debt"].append(path)
   except:
       pass

  if f.endswith(".jsx") or f.endswith(".tsx"):
   data["frontend_components"].append(path)

  if f=="requirements.txt" or f=="package.json":
   data["dependencies"].append(path)

os.makedirs(os.path.dirname(OUT),exist_ok=True)

with open(OUT,"w") as f:
 json.dump(data,f,indent=2)

print("project_map.json generado")
""")

# =========================
# GENERADOR TASK
# =========================

write(ROOT / "tools/ai_tools/create_task.py", r"""
import os

DIR="docs/tasks"

nums=[]
for f in os.listdir(DIR):
 if f.startswith("TASK-"):
  nums.append(int(f.split("-")[1].split(".")[0]))

n=max(nums)+1 if nums else 1
name=f"TASK-{str(n).zfill(4)}.md"

with open(os.path.join(DIR,name),"w") as f:
 f.write("# "+name)

print("TASK creada:",name)
""")

# =========================
# GENERADOR DOC AUTOMATICA
# =========================

write(ROOT / "tools/ai_tools/generate_auto_docs.py", r"""
import json,os

ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),"..",".."))
MAP=os.path.join(ROOT,"docs","architecture","project_map.json")
OUT=os.path.join(ROOT,"docs","architecture","AUTO_DOC.md")

if not os.path.exists(MAP):
 print("Ejecuta primero index_project.py")
 exit()

with open(MAP) as f:
 data=json.load(f)

doc="# Documentación automática del proyecto\n"

doc+="\n## Backend modules\n"
for m in data["backend_modules"]:
 doc+="- "+m+"\n"

doc+="\n## Frontend components\n"
for m in data["frontend_components"]:
 doc+="- "+m+"\n"

doc+="\n## API endpoints detectados\n"
for m in data["api_endpoints"]:
 doc+="- "+m+"\n"

doc+="\n## Posible deuda técnica\n"
for m in data["technical_debt"]:
 doc+="- "+m+"\n"

with open(OUT,"w") as f:
 f.write(doc)

print("AUTO_DOC.md generado")
""")

print("AI Project Toolkit instalado correctamente.")