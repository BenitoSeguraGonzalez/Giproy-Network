import json
import sys
from datetime import datetime, timezone, timedelta

try:
    with open("docs/runtime/WORK_MODE_STATE.json", "r", encoding="utf-8") as f:
        data = json.load(f)

    print("Original active_task:", data.get("active_task"))
    print("Original generated_at:", data.get("generated_at"))

    # Update active task
    data["active_task"] = "TASK-1414"

    # Update timestamp
    tz = timezone(timedelta(hours=-5))
    data["generated_at"] = datetime.now(tz).strftime("%Y-%m-%dT%H:%M:%S%z")

    # Add to latest_tasks if not present
    if "TASK-1414.md" not in data.get("latest_tasks", []):
        data["latest_tasks"].insert(0, "TASK-1414.md")
        print("Added TASK-1414.md to latest_tasks")
    else:
        print("TASK-1414.md already in latest_tasks")

    # Add note
    new_note = "2026-04-24: TASK-1414 abierta como nueva TASK activa de saneamiento de infraestructura: Alembic completo, code splitting frontend, limpieza de artefactos y normalizacion de API. Modo GIPROY CLASICO. Sin impacto en licencias, UI ni BIM."
    if new_note not in data.get("notes", []):
        data["notes"].append(new_note)
        print("Added note for TASK-1414")
    else:
        print("Note already exists")

    with open("docs/runtime/WORK_MODE_STATE.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print("SUCCESS: WORK_MODE_STATE.json updated")
    print("New active_task:", data["active_task"])
    print("New generated_at:", data["generated_at"])
    print("latest_tasks count:", len(data["latest_tasks"]))
    print("notes count:", len(data["notes"]))

except Exception as e:
    print("ERROR:", str(e))
    import traceback

    traceback.print_exc()
    sys.exit(1)
