from __future__ import annotations

import argparse
import json
from datetime import datetime
from pathlib import Path
import re


ROOT = Path(__file__).resolve().parents[2]
DOCS = ROOT / "docs"
TASKS = DOCS / "tasks"
ARCH = DOCS / "architecture"
PLANTILLAS = DOCS / "plantillas"
RUNTIME = DOCS / "runtime"
STATE_PATH = RUNTIME / "WORK_MODE_STATE.json"
LAST_PROMPT_PATH = RUNTIME / "LAST_MODE_PROMPT.txt"


MODE_CONFIG = {
    "clasico": {
        "label": "GIPROY CLASICO",
        "template": PLANTILLAS / "Prompt Modo Clasico.txt",
    },
    "bim": {
        "label": "GIPROY BIM",
        "template": PLANTILLAS / "Prompt Modo BIM.txt",
    },
    "integracion": {
        "label": "INTEGRACION CONTROLADA",
        "template": PLANTILLAS / "Prompt Modo Integracion Controlada.txt",
    },
}


def read_json(path: Path) -> dict:
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def latest_task_names(limit: int = 12) -> list[str]:
    if not TASKS.exists():
        return []
    return [p.name for p in sorted(TASKS.glob("TASK-*.md"))[-limit:]]


def latest_numeric_task_number() -> int:
    max_num = 0
    for path in TASKS.glob("TASK-*.md"):
        match = re.match(r"TASK-(\d+)\.md$", path.name)
        if match:
            max_num = max(max_num, int(match.group(1)))
    return max_num


def slugify_objective(objective: str) -> str:
    slug = objective.strip().lower()
    slug = re.sub(r"[^a-z0-9áéíóúñü\s-]", "", slug, flags=re.IGNORECASE)
    slug = re.sub(r"\s+", " ", slug).strip()
    return slug


def ensure_active_task(mode_key: str, objective: str, previous_state: dict) -> dict:
    active = previous_state.get("active_task", {}) if previous_state else {}
    wanted_mode = MODE_CONFIG[mode_key]["label"]
    wanted_slug = slugify_objective(objective)

    existing_path = active.get("path")
    existing_mode = active.get("mode")
    existing_slug = active.get("objective_slug")

    if existing_path and existing_mode == wanted_mode and existing_slug == wanted_slug:
        task_path = ROOT / existing_path
        if task_path.exists():
            return active

    next_number = latest_numeric_task_number() + 1
    task_name = f"TASK-{next_number:04d}.md"
    rel_path = f"docs/tasks/{task_name}"
    task_path = ROOT / rel_path
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    title = objective.strip() or f"Sesión {wanted_mode.lower()}"

    content = "\n".join(
        [
            f"# {task_name}",
            "",
            "## Objetivo",
            title,
            "",
            "## Modo",
            wanted_mode,
            "",
            "## Estado",
            "Autogenerada por `mode_prompt_launcher.py` al activar la sesión.",
            "",
            "## Fecha de creación",
            timestamp,
            "",
            "## Alcance inicial",
            "- Pendiente de completar en la sesión activa.",
            "",
            "## Validación",
            "- Pendiente de definir en la sesión activa.",
            "",
        ]
    )
    task_path.write_text(content, encoding="utf-8")

    return {
        "id": task_name.replace(".md", ""),
        "name": task_name,
        "path": rel_path.replace("\\", "/"),
        "mode": wanted_mode,
        "objective": title,
        "objective_slug": wanted_slug,
        "created_at": timestamp,
        "auto_generated": True,
    }


def architecture_docs() -> list[str]:
    names = [
        "BIM_MASTER_PLAN.md",
        "BIM_CONCEPT_MAP.md",
        "BIM_INSERTION_MAP.md",
        "BIM_VALIDATION_PLAN.md",
        "BIM_EXECUTION_ROADMAP.md",
        "BIM_PARALLEL_IMPLEMENTATION_STRATEGY.md",
    ]
    return [f"docs/architecture/{name}" for name in names if (ARCH / name).exists()]


def build_state(mode_key: str, objective: str) -> dict:
    previous_state = read_json(STATE_PATH)
    project_state = read_json(DOCS / "project_state.json")
    handoff_path = DOCS / "HANDOFF.md"
    handoff_excerpt = ""
    if handoff_path.exists():
        handoff_excerpt = "\n".join(
            handoff_path.read_text(encoding="utf-8").splitlines()[:20]
        ).strip()

    active_task = ensure_active_task(mode_key, objective, previous_state)

    state = {
        "mode": MODE_CONFIG[mode_key]["label"],
        "objective": objective,
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "active_task": active_task,
        "project": {
            "name": project_state.get("project", {}).get("project_name", ""),
            "version": project_state.get("project", {}).get("version", ""),
            "last_sync": project_state.get("project", {}).get("last_sync", ""),
            "database": project_state.get("project", {}).get("database", ""),
        },
        "handoff": {
            "excerpt": handoff_excerpt,
        },
        "latest_tasks": latest_task_names(),
        "architecture_docs": architecture_docs(),
        "notes": [
            "El backend debe seguir siendo comun.",
            "La capa BIM debe permanecer desacoplada mientras madura.",
            "Toda sesion debe mantener trazabilidad TASK + CHANGELOG.",
            "La activacion BIM debe poder apagarse por feature flag.",
        ],
    }
    return state


def auto_context_block(state: dict) -> str:
    project = state.get("project", {})
    tasks = state.get("latest_tasks", [])
    docs = state.get("architecture_docs", [])
    active_task = state.get("active_task", {})
    lines = [
        f"- modo activo: {state.get('mode', '')}",
        f"- objetivo de la sesion: {state.get('objective', '')}",
        f"- proyecto: {project.get('name', '')}",
        f"- version del snapshot: {project.get('version', '')}",
        f"- base documental de arquitectura BIM: {', '.join(docs) if docs else 'sin docs BIM detectados'}",
        f"- tasks recientes: {', '.join(tasks) if tasks else 'sin TASKs detectadas'}",
        f"- task activa: {active_task.get('path', 'sin TASK activa')}",
        f"- estado runtime: {STATE_PATH.as_posix()}",
    ]
    return "\n".join(lines)


def render_prompt(mode_key: str, objective: str, state: dict) -> str:
    template_path = MODE_CONFIG[mode_key]["template"]
    template = template_path.read_text(encoding="utf-8")
    prompt = template.replace("{{OBJETIVO}}", objective.strip() or "[OBJETIVO NO ESPECIFICADO]")
    prompt = prompt.replace("{{AUTO_CONTEXT}}", auto_context_block(state))
    prompt = prompt.replace("{{ACTIVE_TASK}}", state.get("active_task", {}).get("path", "sin TASK activa"))
    prompt = prompt.replace("{{STATE_PATH}}", STATE_PATH.as_posix())
    return prompt


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Genera el prompt de trabajo por modo y actualiza el estado runtime."
    )
    parser.add_argument(
        "mode",
        choices=sorted(MODE_CONFIG.keys()),
        help="Modo de trabajo: clasico, bim, integracion",
    )
    parser.add_argument(
        "-o",
        "--objetivo",
        default="",
        help="Objetivo concreto de la sesion.",
    )
    parser.add_argument(
        "--json-only",
        action="store_true",
        help="Actualiza el estado JSON sin imprimir prompt.",
    )
    args = parser.parse_args()

    RUNTIME.mkdir(parents=True, exist_ok=True)

    state = build_state(args.mode, args.objetivo)
    STATE_PATH.write_text(
        json.dumps(state, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    if args.json_only:
        print(str(STATE_PATH))
        return

    prompt = render_prompt(args.mode, args.objetivo, state)
    LAST_PROMPT_PATH.write_text(prompt, encoding="utf-8")
    print(prompt)


if __name__ == "__main__":
    main()
