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
