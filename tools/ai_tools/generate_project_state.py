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
