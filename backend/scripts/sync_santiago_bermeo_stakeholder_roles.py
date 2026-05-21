"""
Sincroniza roles consolidados de Stakeholders para la empresa Santiago Bermeo.

Politica historica:
1. EDO con rol tiene prioridad.
2. Si no hay EDO con rol, se usa EDT con rol.
3. Si no hay rol en EDO/EDT, queda Sin rol asignado.

Uso:
    python backend/scripts/sync_santiago_bermeo_stakeholder_roles.py
    python backend/scripts/sync_santiago_bermeo_stakeholder_roles.py --dry-run
"""

from __future__ import annotations

import argparse
import json
from datetime import datetime
from pathlib import Path
import sys

BACKEND_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = Path(__file__).resolve().parents[2]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.database import SessionLocal
from app.models.empresa import Empresa
from app.models.edo import EdoNode, TipoNodo
from app.models.edt import EdtNode, TipoNodoEdt
from app.models.proyecto import Proyecto
from app.models.stakeholder import ProyectoStakeholder, Stakeholder
from app.repositories.stakeholder import stakeholder_repo


def _iso(value):
    return value.isoformat() if value else None


def _node_sort_key(node):
    return (
        getattr(node, "ultima_modificacion", None) or getattr(node, "fecha_creacion", None) or datetime.min,
        node.id or 0,
    )


def _find_preferred_role(db, project_ids, stakeholder_id):
    edo_nodes = (
        db.query(EdoNode)
        .filter(
            EdoNode.proyecto_id.in_(project_ids),
            EdoNode.tipo_nodo == TipoNodo.STAKEHOLDER,
            EdoNode.stakeholder_id == stakeholder_id,
            EdoNode.rol_id.isnot(None),
        )
        .all()
    )
    if edo_nodes:
        node = sorted(edo_nodes, key=_node_sort_key, reverse=True)[0]
        return node.rol_id, "EDO", node.id

    edt_nodes = (
        db.query(EdtNode)
        .filter(
            EdtNode.proyecto_id.in_(project_ids),
            EdtNode.tipo_nodo == TipoNodoEdt.STAKEHOLDER,
            EdtNode.stakeholder_id == stakeholder_id,
            EdtNode.rol_id.isnot(None),
        )
        .all()
    )
    if edt_nodes:
        node = sorted(edt_nodes, key=_node_sort_key, reverse=True)[0]
        return node.rol_id, "EDT", node.id

    return None, "SIN_ROL", None


def run(dry_run: bool = False):
    db = SessionLocal()
    summary = {
        "dry_run": dry_run,
        "empresa": None,
        "updated": 0,
        "unchanged": 0,
        "without_role": 0,
        "roots": [],
        "backup_file": None,
    }
    try:
        empresa = (
            db.query(Empresa)
            .filter(Empresa.nombre.ilike("%Santiago Bermeo%"))
            .order_by(Empresa.id.asc())
            .first()
        )
        if not empresa:
            raise RuntimeError("No se encontro una empresa con nombre Santiago Bermeo.")

        summary["empresa"] = {"id": empresa.id, "nombre": empresa.nombre}

        projects = (
            db.query(Proyecto)
            .filter(Proyecto.empresa_id == empresa.id)
            .order_by(Proyecto.codigo_root.asc(), Proyecto.revision.asc(), Proyecto.id.asc())
            .all()
        )
        roots = {}
        for project in projects:
            root_code = project.codigo_root or project.codigo
            if root_code:
                roots.setdefault(root_code, []).append(project)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = REPO_ROOT / "tmp" / f"santiago_bermeo_stakeholder_roles_backup_{timestamp}.json"
        backup_path.parent.mkdir(parents=True, exist_ok=True)

        backup = []
        for root_code, root_projects in roots.items():
            root_project = sorted(root_projects, key=lambda p: (p.revision or 0, p.id))[0]
            project_ids = [project.id for project in root_projects]
            stakeholders = (
                db.query(Stakeholder)
                .filter(
                    Stakeholder.empresa_id == empresa.id,
                    Stakeholder.proyecto_codigo_root == root_code,
                )
                .order_by(Stakeholder.id.asc())
                .all()
            )
            root_info = {
                "codigo_root": root_code,
                "root_project_id": root_project.id,
                "stakeholders": len(stakeholders),
                "updated": 0,
                "without_role": 0,
            }

            for stakeholder in stakeholders:
                existing = (
                    db.query(ProyectoStakeholder)
                    .filter(
                        ProyectoStakeholder.proyecto_id == root_project.id,
                        ProyectoStakeholder.stakeholder_id == stakeholder.id,
                    )
                    .first()
                )
                backup.append(
                    {
                        "root_project_id": root_project.id,
                        "stakeholder_id": stakeholder.id,
                        "previous_assignment_id": existing.id if existing else None,
                        "previous_rol_id": existing.rol_id if existing else None,
                        "stakeholder_codigo": stakeholder.codigo,
                        "stakeholder_nombre": f"{stakeholder.nombre} {stakeholder.apellidos}".strip(),
                    }
                )

                role_id, source, source_node_id = _find_preferred_role(db, project_ids, stakeholder.id)
                if role_id is None:
                    root_info["without_role"] += 1
                    summary["without_role"] += 1

                if existing and existing.rol_id == role_id:
                    summary["unchanged"] += 1
                    continue

                root_info["updated"] += 1
                summary["updated"] += 1

                if not dry_run:
                    stakeholder_repo.sync_role_from_project_structure(
                        db,
                        proyecto_id=root_project.id,
                        stakeholder_id=stakeholder.id,
                        rol_id=role_id,
                    )

                backup[-1].update(
                    {
                        "new_rol_id": role_id,
                        "source": source,
                        "source_node_id": source_node_id,
                    }
                )

            summary["roots"].append(root_info)

        backup_path.write_text(
            json.dumps(
                {
                    "generated_at": datetime.now().isoformat(),
                    "dry_run": dry_run,
                    "empresa": summary["empresa"],
                    "assignments": backup,
                },
                ensure_ascii=False,
                indent=2,
            ),
            encoding="utf-8",
        )
        summary["backup_file"] = str(backup_path)

        if dry_run:
            db.rollback()
        else:
            db.commit()
        return summary
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    print(json.dumps(run(dry_run=args.dry_run), ensure_ascii=False, indent=2))
