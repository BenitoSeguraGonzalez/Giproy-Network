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
