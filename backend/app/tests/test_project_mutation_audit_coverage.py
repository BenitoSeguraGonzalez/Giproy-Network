import ast
from pathlib import Path


ENDPOINT_ROOT = Path(__file__).resolve().parents[1] / "api" / "endpoints"

EXPECTED = {
    "proyectos.py": {
        "create_proyecto", "restore_recycled_project", "purge_recycled_project",
        "create_revision", "delete_revision", "update_proyecto", "delete_proyecto",
        "assign_user", "unassign_user", "put_project_capability_grant",
    },
    "proyecto_detalles.py": {
        "upload_project_document", "delete_project_document",
        "create_or_update_proyecto_detalle", "upload_project_image",
    },
    "presupuestos.py": {
        "create_presupuesto", "update_presupuesto_indirectos",
        "create_presupuesto_general_note", "create_presupuesto_line_note",
        "apply_tanteo", "clear_all_tanteos", "delete_tanteo",
        "add_presupuesto_linea", "update_presupuesto_linea",
        "bulk_update_presupuesto_lineas_cantidad", "move_presupuesto_linea",
        "delete_presupuesto_linea",
    },
    "cronogramas_trabajo.py": {
        "save_gantt_draft_intention", "mark_gantt_draft_applied",
        "discard_invalidated_gantt_draft_intentions",
        "prepare_invalidated_gantt_draft_intentions_for_adjustment",
        "update_cronograma_trabajo", "update_cronograma_trabajo_delta",
        "reset_cronograma_integral", "merge_cronograma_trabajo_interparent_subbars",
        "reload_cronograma_trabajo_holiday_calendar",
        "reset_cronograma_trabajo_holiday_calendar",
        "add_cronograma_trabajo_holiday_manual",
        "remove_cronograma_trabajo_holiday_day",
        "import_cronograma_trabajo_ms_project",
    },
    "edt.py": {"create_edt_node", "bulk_delete_edt_nodes", "bulk_move_edt_nodes", "update_edt_node", "move_edt_node", "delete_edt_node"},
    "edo.py": {"create_edo_node", "bulk_delete_edo_nodes", "bulk_move_edo_nodes", "update_edo_node", "move_edo_node", "delete_edo_node"},
    "stakeholders.py": {"create_stakeholder", "update_stakeholder", "delete_stakeholder", "assign_stakeholder", "unassign_stakeholder"},
    "polinomica.py": {"regenerate_formula", "update_formula", "save_assignments", "save_indices"},
}

AUDIT_CALLS = {"record_audit_event", "record_project_entity_event", "_record_project_event", "_audit_project_detail", "_audit_budget", "_audit_schedule", "_audit_formula"}


def _called_names(function: ast.FunctionDef | ast.AsyncFunctionDef) -> set[str]:
    names = set()
    for node in ast.walk(function):
        if not isinstance(node, ast.Call):
            continue
        if isinstance(node.func, ast.Name):
            names.add(node.func.id)
        elif isinstance(node.func, ast.Attribute):
            names.add(node.func.attr)
    return names


def test_every_material_project_mutation_has_structured_audit_evidence():
    missing = []
    for filename, function_names in EXPECTED.items():
        tree = ast.parse((ENDPOINT_ROOT / filename).read_text(encoding="utf-8"))
        functions = {node.name: node for node in tree.body if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))}
        for function_name in function_names:
            function = functions.get(function_name)
            if function is None or not (_called_names(function) & AUDIT_CALLS):
                missing.append(f"{filename}:{function_name}")
    assert not missing, f"Mutaciones de Proyecto sin auditoría estructurada: {missing}"


def test_project_audit_timeline_has_one_route_and_correlation_filter():
    source = (ENDPOINT_ROOT / "proyectos.py").read_text(encoding="utf-8")
    assert source.count('@router.get("/{id}/audit-events"') == 1
    assert "SystemAuditEvent.correlation_id == correlation_id" in source
    assert "SystemAuditEvent.proyecto_codigo_root == project.codigo_root" in source
