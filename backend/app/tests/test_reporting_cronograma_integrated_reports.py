from openpyxl import load_workbook

from app.services.reporting import reporting_service


def _preview_payload(label: str):
    return {
        "descripcion": label,
        "metadata_hint": label,
        "summary_cards": [],
        "table_columns": [
            {"key": "periodo", "label": "Periodo"},
            {"key": "costo", "label": "Costo", "kind": "money"},
        ],
        "lineas": [
            {"periodo": "P1", "costo": 100.0},
        ],
    }


def test_cronograma_report_preview_variants_reuse_common_reporting(monkeypatch):
    monkeypatch.setattr(reporting_service, "_build_cronograma_gantt_preview", lambda *args: _preview_payload("Gantt QA"))
    monkeypatch.setattr(reporting_service, "_build_cronograma_valorado_preview", lambda *args: _preview_payload("Valorado QA"))
    monkeypatch.setattr(reporting_service, "_build_cronograma_cash_flow_preview", lambda *args: _preview_payload("Caja QA"))
    monkeypatch.setattr(reporting_service, "_build_cronograma_pareto_preview", lambda *args: _preview_payload("Pareto QA"))

    cash_preview = reporting_service.preview_report(None, "cronograma_valorado", [1], 1, variant="cash_flow")
    gantt_preview = reporting_service.preview_report(None, "cronograma_valorado", [1], 1, variant="gantt")
    integrated_preview = reporting_service.preview_report(None, "cronograma_valorado", [1], 1, variant="integrado")
    pareto_preview = reporting_service.preview_report(None, "cronograma_valorado", [1], 1, variant="pareto")

    assert cash_preview["title"] == "Reporte de Flujo de Caja"
    assert cash_preview["items"][0]["descripcion"] == "Caja QA"
    assert gantt_preview["title"] == "Reporte de Cronograma Gantt"
    assert gantt_preview["items"][0]["descripcion"] == "Gantt QA"
    assert pareto_preview["title"] == "Reporte de Pareto Temporal"
    assert pareto_preview["items"][0]["descripcion"] == "Pareto QA"
    assert integrated_preview["title"] == "Reporte Integrado Gantt / Valorado / Caja"
    assert [item["descripcion"] for item in integrated_preview["items"]] == [
        "Gantt QA",
        "Valorado QA",
        "Caja QA",
    ]


def test_cronograma_integrated_xlsx_contains_gantt_valorado_and_cash_flow_sheets(monkeypatch):
    monkeypatch.setattr(reporting_service, "_get_empresa_format_config", lambda *args: {"money_decimals": 2, "calc_decimals": 4})
    monkeypatch.setattr(reporting_service, "_build_cronograma_gantt_preview", lambda *args: _preview_payload("Gantt QA"))
    monkeypatch.setattr(reporting_service, "_build_cronograma_valorado_preview", lambda *args: _preview_payload("Valorado QA"))
    monkeypatch.setattr(reporting_service, "_build_cronograma_cash_flow_preview", lambda *args: _preview_payload("Caja QA"))

    workbook_buffer = reporting_service.generate_cronograma_valorado_report(
        None,
        presupuesto_id=1,
        empresa_id=1,
        variant="integrado",
    )
    workbook = load_workbook(workbook_buffer, data_only=True, read_only=True)

    assert workbook.sheetnames == ["Gantt QA", "Valorado QA", "Caja QA"]
    assert workbook["Caja QA"]["A6"].value == "P1"
    assert workbook["Caja QA"]["B6"].value == 100


def test_cronograma_pareto_xlsx_uses_common_report_workbook(monkeypatch):
    monkeypatch.setattr(reporting_service, "_get_empresa_format_config", lambda *args: {"money_decimals": 2, "calc_decimals": 4})
    monkeypatch.setattr(reporting_service, "_build_cronograma_pareto_preview", lambda *args: _preview_payload("Pareto QA"))

    workbook_buffer = reporting_service.generate_cronograma_valorado_report(
        None,
        presupuesto_id=1,
        empresa_id=1,
        variant="pareto",
    )
    workbook = load_workbook(workbook_buffer, data_only=True, read_only=True)

    assert workbook.sheetnames == ["Pareto QA"]
    assert workbook["Pareto QA"]["A6"].value == "P1"
    assert workbook["Pareto QA"]["B6"].value == 100


def test_cash_flow_preview_includes_hours_column(monkeypatch):
    class _Point:
        label = "P1"
        starts_at = __import__("datetime").datetime(2026, 3, 24, 8, 0, 0)
        ends_at = __import__("datetime").datetime(2026, 3, 31, 16, 0, 0)
        work_hours = 64.0
        cost = 100.0
        cumulative_cost = 100.0
        cost_pct = 25.0
        cumulative_pct = 25.0
        category_costs = {"Equipos": 60.0, "Mano de obra": 25.0, "Transporte": 15.0}
        dominant_category = "Equipos"

    class _Cronograma:
        cash_flow = [_Point()]
        period_type = "semanal"
        distribution_mode = "gantt"
        moneda = "USD"

    class _Proyecto:
        codigo = "PRO-1"
        codigo_root = "PRO-1"

    class _Presupuesto:
        id = 1
        descripcion = "Presupuesto QA"
        proyecto = _Proyecto()

    monkeypatch.setattr(reporting_service, "_get_cronograma_valorado_payload", lambda *args: (_Presupuesto(), _Cronograma()))
    monkeypatch.setattr(reporting_service, "_resolve_project_title", lambda *args: "Proyecto QA")

    preview = reporting_service._build_cronograma_cash_flow_preview(None, 1, 1)

    assert preview["summary_cards"][2]["label"] == "Horas efectivas"
    assert preview["summary_cards"][2]["value"] == 64.0
    assert preview["summary_cards"][3]["label"] == "Categoría líder"
    assert preview["summary_cards"][3]["value"] == "Equipos"
    assert preview["table_columns"][3]["key"] == "horas_periodo"
    assert preview["table_columns"][5]["key"] == "equipos"
    assert preview["lineas"][0]["equipos"] == 60.0
    assert preview["lineas"][0]["fecha_inicio"] == "24/03/2026 08:00"


def test_cronograma_valorado_preview_reports_pending_manual_coverage(monkeypatch):
    class _Row:
        def __init__(self, linea_id, codigo_item, descripcion, precio_total, distribution, requires_manual_schedule=False):
            self.linea_id = linea_id
            self.codigo_item = codigo_item
            self.descripcion = descripcion
            self.unidad = "u"
            self.cantidad = 1.0
            self.precio_unitario = precio_total
            self.precio_total = precio_total
            self.distribution = distribution
            self.requires_manual_schedule = requires_manual_schedule

    class _Period:
        def __init__(self, label):
            self.label = label

    class _Cronograma:
        rows = [
            _Row(1, "1.1.1", "Línea programada", 100.0, [100.0, 0.0], requires_manual_schedule=False),
            _Row(2, "1.1.2", "Línea pendiente", 50.0, [0.0, 0.0], requires_manual_schedule=True),
        ]
        periods = [_Period("P1"), _Period("P2")]
        period_type = "mensual"
        distribution_mode = "gantt"
        moneda = "USD"
        cash_flow = []

    class _Proyecto:
        codigo = "PRO-1"
        codigo_root = "PRO-1"

    class _LineaPresupuesto:
        def __init__(self, line_id):
            self.id = line_id
            self.edt_id = None
            self.codigo_item = f"COD-{line_id}"

    class _Presupuesto:
        id = 1
        descripcion = "Presupuesto QA"
        proyecto = _Proyecto()
        detalle = [_LineaPresupuesto(1), _LineaPresupuesto(2)]

    monkeypatch.setattr(reporting_service, "_get_cronograma_valorado_payload", lambda *args: (_Presupuesto(), _Cronograma()))
    monkeypatch.setattr(reporting_service, "_resolve_project_title", lambda *args: "Proyecto QA")
    monkeypatch.setattr(reporting_service, "_get_budget_line_visible_edt_code", lambda *args: "1.1")

    preview = reporting_service._build_cronograma_valorado_preview(None, 1, 1)

    assert "temporalidad parcial" in preview["metadata_hint"]
    assert preview["summary_cards"][3]["label"] == "Pendiente manual"
    assert preview["summary_cards"][3]["value"] == 50.0
    assert preview["summary_cards"][4]["label"] == "Cobertura valorada"
    assert round(float(preview["summary_cards"][4]["value"]), 4) == 66.6667


def test_cronograma_cash_flow_preview_reports_partial_origin_when_manual_pending(monkeypatch):
    class _Point:
        label = "P1"
        starts_at = __import__("datetime").datetime(2026, 3, 24, 8, 0, 0)
        ends_at = __import__("datetime").datetime(2026, 3, 31, 16, 0, 0)
        work_hours = 64.0
        cost = 100.0
        cumulative_cost = 100.0
        cost_pct = 66.6667
        cumulative_pct = 66.6667
        category_costs = {"Equipos": 60.0, "Mano de obra": 25.0, "Transporte": 15.0}
        dominant_category = "Equipos"

    class _Row:
        def __init__(self, precio_total, requires_manual_schedule=False):
            self.precio_total = precio_total
            self.requires_manual_schedule = requires_manual_schedule

    class _Cronograma:
        cash_flow = [_Point()]
        period_type = "semanal"
        distribution_mode = "gantt"
        moneda = "USD"
        rows = [_Row(100.0, False), _Row(50.0, True)]

    class _Proyecto:
        codigo = "PRO-1"
        codigo_root = "PRO-1"

    class _Presupuesto:
        id = 1
        descripcion = "Presupuesto QA"
        proyecto = _Proyecto()

    monkeypatch.setattr(reporting_service, "_get_cronograma_valorado_payload", lambda *args: (_Presupuesto(), _Cronograma()))
    monkeypatch.setattr(reporting_service, "_resolve_project_title", lambda *args: "Proyecto QA")

    preview = reporting_service._build_cronograma_cash_flow_preview(None, 1, 1)

    assert "cobertura parcial" in preview["metadata_hint"]
    assert preview["summary_cards"][4]["label"] == "Origen"
    assert preview["summary_cards"][4]["value"] == "Gantt parcial"
    assert preview["summary_cards"][5]["label"] == "Pendiente manual"
    assert preview["summary_cards"][5]["value"] == 50.0


def test_cronograma_gantt_preview_reports_operational_reconciliation(monkeypatch):
    class _Summary:
        trabajo_total = 12.0
        cuadrilla_total = 3.0

    class _Config:
        dias_laborables_semana = 5

    class _Row:
        def __init__(self):
            self.presupuesto_linea_id = 1
            self.codigo_item = "1.1.1"
            self.descripcion = "Replanteo y nivelación"
            self.start_date = __import__("datetime").datetime(2026, 4, 1)
            self.end_date = __import__("datetime").datetime(2026, 4, 10)
            self.dias_calendario = 10
            self.dias_utiles = 8
            self.progress_pct = 25.0
            self.predecessors = []
            self.dependencies = []
            self.metadata = {
                "gantt_operational": {
                    "budget_line_id": "1",
                    "has_subbars": True,
                    "subbar_count": 2,
                    "has_manual_temporal_window": True,
                },
                "gantt_subbars": [
                    {"period_id": "P1", "status": "draft_session", "percent": 6.0, "amount": 60.0},
                    {"period_id": "P1", "status": "accepted_session", "source": "gantt_interparent_merge", "percent": 5.0, "amount": 50.0},
                ],
            }

    class _Schedule:
        rows = [_Row()]
        summary = _Summary()
        config = _Config()

    class _ValoradoRow:
        linea_id = 1
        distribution = [10.0, 0.0]
        precio_total = 100.0

    class _Period:
        def __init__(self, period_id):
            self.id = period_id

    class _Cronograma:
        rows = [_ValoradoRow()]
        periods = [_Period("P1"), _Period("P2")]

    class _Proyecto:
        codigo = "PRO-1"
        codigo_root = "PRO-1"
        id = 7

    class _LineaPresupuesto:
        id = 1

    class _Presupuesto:
        id = 1
        descripcion = "Presupuesto QA"
        proyecto = _Proyecto()
        proyecto_id = 7
        detalle = [_LineaPresupuesto()]

    monkeypatch.setattr(reporting_service, "_get_presupuesto", lambda *args: _Presupuesto())
    monkeypatch.setattr(reporting_service, "_resolve_project_title", lambda *args: "Proyecto QA")
    monkeypatch.setattr(reporting_service, "_get_budget_line_visible_edt_code", lambda *args: "1.1")
    monkeypatch.setattr(reporting_service, "_get_cronograma_valorado_payload", lambda *args: (_Presupuesto(), _Cronograma()))

    from app.services.cronograma_trabajo import cronograma_trabajo_service

    monkeypatch.setattr(cronograma_trabajo_service, "get_schedule", lambda *args, **kwargs: _Schedule())

    preview = reporting_service._build_cronograma_gantt_preview(None, 1, 1)

    assert "reconciliación operativa" in preview["metadata_hint"]
    assert preview["summary_cards"][3]["label"] == "Líneas con subbarras"
    assert preview["summary_cards"][3]["value"] == 1
    assert preview["summary_cards"][4]["label"] == "Tramos operativos"
    assert preview["summary_cards"][4]["value"] == 2
    assert preview["summary_cards"][5]["label"] == "Tramos en borrador"
    assert preview["summary_cards"][5]["value"] == 1
    assert preview["summary_cards"][6]["label"] == "Fusiones intertramo"
    assert preview["summary_cards"][6]["value"] == 1
    assert preview["summary_cards"][7]["label"] == "Ventanas manuales"
    assert preview["summary_cards"][7]["value"] == 1
    assert preview["summary_cards"][8]["label"] == "Conflictos valorado"
    assert preview["summary_cards"][8]["value"] == 1


def test_summarize_gantt_operational_reporting_ignores_manual_window_without_conflict():
    class _ScheduleRow:
        def __init__(self):
            self.presupuesto_linea_id = 2
            self.metadata = {
                "gantt_operational": {
                    "budget_line_id": "2",
                    "has_subbars": False,
                    "subbar_count": 0,
                    "has_manual_temporal_window": True,
                },
                "manual_temporal_window": {
                    "starts_at": "2026-04-01T08:00:00",
                    "ends_at": "2026-04-03T17:00:00",
                    "source": "manual_temporal_material_only",
                },
            }

    class _Schedule:
        rows = [_ScheduleRow()]

    class _ValoradoRow:
        linea_id = 2
        distribution = [0.0]
        precio_total = 50.0

    class _Period:
        id = "P1"

    class _Cronograma:
        rows = [_ValoradoRow()]
        periods = [_Period()]

    summary = reporting_service._summarize_gantt_operational_reporting(_Schedule(), _Cronograma())

    assert summary["manual_temporal_rows"] == 1
    assert summary["subbar_rows"] == 0
    assert summary["draft_subbar_count"] == 0
    assert summary["interparent_merge_rows"] == 0
    assert summary["interparent_merge_count"] == 0
    assert summary["conflict_rows"] == 0
    assert summary["conflict_periods"] == 0
    assert summary["has_operational_state"] is True


def test_summarize_gantt_operational_reporting_counts_interparent_merge():
    class _ScheduleRow:
        def __init__(self):
            self.presupuesto_linea_id = 3
            self.metadata = {
                "gantt_operational": {
                    "budget_line_id": "3",
                    "has_subbars": True,
                    "subbar_count": 2,
                    "has_manual_temporal_window": False,
                },
                "gantt_subbars": [
                    {"period_id": "P1", "status": "accepted_session", "source": "gantt_interparent_merge", "percent": 6.0, "amount": 60.0},
                    {"period_id": "P2", "status": "draft_session", "source": "gantt_subbar_split", "percent": 4.0, "amount": 40.0},
                ],
            }

    class _Schedule:
        rows = [_ScheduleRow()]

    class _ValoradoRow:
        linea_id = 3
        distribution = [0.0, 10.0]
        precio_total = 100.0

    class _Period:
        def __init__(self, period_id):
            self.id = period_id

    class _Cronograma:
        rows = [_ValoradoRow()]
        periods = [_Period("P1"), _Period("P2")]

    summary = reporting_service._summarize_gantt_operational_reporting(_Schedule(), _Cronograma())

    assert summary["subbar_rows"] == 1
    assert summary["subbar_count"] == 2
    assert summary["draft_subbar_count"] == 1
    assert summary["interparent_merge_rows"] == 1
    assert summary["interparent_merge_count"] == 1
    assert summary["conflict_rows"] == 1
    assert summary["conflict_periods"] == 2
