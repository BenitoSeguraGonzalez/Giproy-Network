import os
import json
import re
from pathlib import Path

ROOT = Path(".").resolve()

index = {
    "files": [],
    "backend_modules": [],
    "frontend_components": [],
    "api_endpoints": [],
    "react_routes": [],
    "dependencies_python": [],
    "dependencies_node": [],
    "imports": {}
}

for root, dirs, files in os.walk(ROOT):
    for f in files:

        path = os.path.join(root, f)
        rel = os.path.relpath(path, ROOT)

        index["files"].append(rel)

        if f.endswith(".py"):

            index["backend_modules"].append(rel)

            try:
                txt = open(path, "r", errors="ignore").read()

                # endpoints
                if "@router." in txt or "@app.route" in txt:
                    index["api_endpoints"].append(rel)

                # imports
                imps = re.findall(r"import\s+([a-zA-Z0-9_\.]+)", txt)
                if imps:
                    index["imports"][rel] = imps

            except:
                pass

        if f.endswith(".jsx") or f.endswith(".tsx"):

            index["frontend_components"].append(rel)

            try:
                txt = open(path, "r", errors="ignore").read()

                routes = re.findall(r'<Route.*path="([^"]+)"', txt)

                for r in routes:
                    index["react_routes"].append(r)

            except:
                pass

        if f == "requirements.txt":
            index["dependencies_python"].append(rel)

        if f == "package.json":
            index["dependencies_node"].append(rel)

os.makedirs("docs/architecture", exist_ok=True)

with open("docs/architecture/project_index.json", "w") as f:
    json.dump(index, f, indent=2)

print("project_index.json generado")