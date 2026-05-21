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
