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
