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
