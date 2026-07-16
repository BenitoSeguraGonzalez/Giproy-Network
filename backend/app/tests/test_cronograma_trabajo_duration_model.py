from decimal import Decimal
from datetime import datetime
from types import SimpleNamespace

from app.models.proyecto import Proyecto
from app.models.proyecto_detalle import ProyectoDetalle
from app.schemas.cronograma_trabajo import CronogramaTrabajoComputedRow, CronogramaTrabajoConfig
from app.services.cronograma_trabajo import (
    APU_OPERATIONAL_RESOURCES_METADATA_KEY,
    cronograma_trabajo_service,
)


def test_shift_factor_supports_declared_turns():
    assert cronograma_trabajo_service._resolve_shift_factor("diurno") == Decimal("1")
    assert cronograma_trabajo_service._resolve_shift_factor("vespertino") == Decimal("1")
    assert cronograma_trabajo_service._resolve_shift_factor("nocturno") == Decimal("1")
    assert cronograma_trabajo_service._resolve_shift_factor("doble") == Decimal("2")
    assert cronograma_trabajo_service._resolve_shift_factor("triple") == Decimal("3")
    assert cronograma_trabajo_service._resolve_shift_factor("desconocido") == Decimal("1")


def test_duration_model_metadata_exposes_base_reference_and_remaining_duration():
    metadata = cronograma_trabajo_service._build_duration_model_metadata(
        row_metadata={"turno": "doble", "factor_eficiencia": 0.8},
        progress_pct=25.0,
        jornada=Decimal("8"),
        trabajo_gobernante=Decimal("32"),
        recursos_asumidos=Decimal("2"),
        rendimiento_gobernante_categoria="Mano de Obra",
    )

    assert metadata["governing_category"] == "Mano de Obra"
    assert metadata["turno"] == "doble"
    assert metadata["turno_factor"] == 2.0
    assert metadata["factor_eficiencia"] == 0.8
    assert metadata["avance_real_pct"] == 25.0
    assert metadata["duracion_base_horas"] == 32.0
    assert metadata["duracion_base_dias"] == 4.0
    assert metadata["duracion_referencia_horas"] == 20.0
    assert metadata["duracion_referencia_dias"] == 2.5
    assert metadata["duracion_remanente_horas"] == 15.0
    assert metadata["duracion_remanente_dias"] == 1.875
    assert metadata["editable_en_gantt"] is False


def test_duration_model_finalize_marks_remaining_duration_reconciliation():
    finalized = cronograma_trabajo_service._finalize_duration_model_metadata(
        {
            "avance_real_pct": 25.0,
            "duracion_remanente_dias": 1.875,
        },
        current_duration_days=Decimal("2.0"),
    )

    assert finalized["current_visible_duration_days"] == 2.0
    assert finalized["remaining_duration_delta_days"] == -0.125
    assert finalized["remaining_duration_eligible"] is True
    assert finalized["remaining_duration_reason"] == ""
    assert finalized["remaining_duration_recommendation"] == {
        "source": "apu_duration_reference_v1",
        "eligible": True,
        "reason": "",
        "recommended_duration_days": 1.875,
        "current_duration_days": 2.0,
        "delta_days": -0.125,
        "progress_pct": 25.0,
    }


def test_dual_duration_contract_separates_gantt_and_project_export():
    contract = cronograma_trabajo_service._resolve_dual_duration_contract(
        trabajo_gobernante=Decimal("12"),
        recursos_asumidos=Decimal("3"),
        jornada=Decimal("8"),
    )

    assert contract["gantt_duration_hours"] == Decimal("12")
    assert contract["gantt_duration_days"] == Decimal("1.5")
    assert contract["export_duration_hours"] == Decimal("4")
    assert contract["export_duration_days"] == Decimal("0.5")
    assert contract["export_assumed_resources"] == Decimal("3")


def test_dual_duration_contract_preserves_override_for_both_lanes():
    contract = cronograma_trabajo_service._resolve_dual_duration_contract(
        trabajo_gobernante=Decimal("12"),
        recursos_asumidos=Decimal("3"),
        jornada=Decimal("8"),
        override_duration=Decimal("0.75"),
    )

    assert contract["gantt_duration_hours"] == Decimal("6.00")
    assert contract["gantt_duration_days"] == Decimal("0.75")
    assert contract["export_duration_hours"] == Decimal("6.00")
    assert contract["export_duration_days"] == Decimal("0.75")
    assert contract["export_assumed_resources"] == Decimal("3")


def test_apply_computed_rows_preserves_operational_apu_snapshot():
    row = CronogramaTrabajoComputedRow(
        linea_id=10,
        presupuesto_linea_id=10,
        edt_id=1,
        apu_id=201,
        descripcion="Partida con APU anidado",
        cantidad=1,
        trabajo_total=1,
        cuadrilla_total=1,
        horas_total=1,
        horas_equipos=0,
        horas_mano_obra=1,
        horas_transporte=0,
        recursos_calculados=1,
        dias_utiles=1,
        dias_calendario=1,
        metadata={
            "apu_operational_resources_v1": {
                "status": "anidados_explotados",
                "has_nested": True,
                "resources": [
                    {
                        "recurso_id": 7,
                        "descripcion": "Maestro mayor",
                        "categoria_id": 4,
                        "cantidad": 2,
                        "rendimiento_equivalente": 0.5,
                    }
                ],
            },
            "gantt_operational": {"has_subbars": False},
        },
    )

    updated = cronograma_trabajo_service._apply_computed_rows_to_line_overrides(
        {"10": {"metadata": {"gantt_session": {"status": "draft_session"}}}},
        [row],
    )

    metadata = updated["10"]["metadata"]
    assert metadata["apu_operational_resources_v1"]["status"] == "anidados_explotados"
    assert metadata["apu_operational_resources_v1"]["resources"][0]["recurso_id"] == 7
    assert metadata["gantt_operational"]["has_subbars"] is False


def test_apply_computed_rows_does_not_persist_extreme_automatic_dates():
    row = CronogramaTrabajoComputedRow(
        linea_id=10,
        presupuesto_linea_id=10,
        edt_id=1,
        descripcion="Partida con fin corrupto heredado",
        cantidad=1,
        start_date=datetime(2026, 6, 24, 14, 46, 59),
        end_date=datetime(4492, 11, 13, 14, 46, 59),
        dias_utiles=9411.3824,
        dias_calendario=9411.3824,
        metadata={"gantt_operational": {"has_subbars": False}},
    )

    updated = cronograma_trabajo_service._apply_computed_rows_to_line_overrides(
        {
            "10": {
                "start_date": "2026-06-24T14:46:59",
                "end_date": "4492-11-13T14:46:59",
                "metadata": {
                    "gantt_subbars": [
                        {
                            "source": "gantt_workday_auto_segment",
                            "starts_at": "2026-06-24T14:46:59",
                            "ends_at": "2059-06-12T16:00:00",
                        }
                    ],
                    "gantt_session": {"status": "confirmed_against_budget"},
                },
            }
        },
        [row],
    )

    assert updated["10"]["start_date"] == "2026-06-24T14:46:59"
    assert "end_date" not in updated["10"]
    assert updated["10"]["metadata"]["gantt_subbars"] == []
    assert updated["10"]["metadata"]["gantt_session"]["status"] == "confirmed_against_budget"


def test_workday_auto_segments_are_not_generated_for_extreme_durations():
    config = CronogramaTrabajoConfig(
        jornada_laboral_horas=8,
        hora_inicio_jornada=8,
        dias_laborables_semana=5,
    )

    segments = cronograma_trabajo_service._build_workday_auto_segments(
        budget_line_id="10",
        start_date=datetime(2026, 6, 24, 8, 0, 0),
        duration_days=9411.3824,
        config=config,
        holiday_dates=set(),
    )

    assert segments == []


def test_cpm_duration_prefers_visible_gantt_window_over_technical_duration():
    row = CronogramaTrabajoComputedRow(
        linea_id=122,
        presupuesto_linea_id=122,
        edt_id=1,
        apu_id=201,
        descripcion="Partida con duracion tecnica larga",
        cantidad=1,
        trabajo_total=842.6,
        cuadrilla_total=8.18,
        horas_total=842.6,
        horas_equipos=842.6,
        horas_mano_obra=0,
        horas_transporte=0,
        recursos_calculados=8.18,
        duracion_horas=842.6,
        dias_utiles=105.325,
        dias_calendario=105.325,
        start_date=datetime(2026, 6, 1, 8, 0, 0),
        end_date=datetime(2026, 6, 2, 16, 0, 0),
    )

    duration = cronograma_trabajo_service._resolve_cpm_row_duration_days(
        row,
        CronogramaTrabajoConfig(),
        set(),
    )

    assert duration == 2.0


def test_resolve_project_start_reference_prefers_config_then_project_then_detail():
    project = Proyecto(fecha_inicio=datetime(2026, 3, 24, 0, 0, 0))
    detail = ProyectoDetalle(fecha_inicio=datetime(2026, 3, 25, 0, 0, 0))

    from_config = cronograma_trabajo_service._resolve_project_start_reference(
        config=CronogramaTrabajoConfig(fecha_inicio_proyecto=datetime(2026, 3, 26, 0, 0, 0)),
        proyecto=project,
        detail=detail,
    )
    from_project = cronograma_trabajo_service._resolve_project_start_reference(
        config=CronogramaTrabajoConfig(),
        proyecto=project,
        detail=detail,
    )
    from_detail = cronograma_trabajo_service._resolve_project_start_reference(
        config=CronogramaTrabajoConfig(),
        proyecto=Proyecto(),
        detail=detail,
    )

    assert from_config == datetime(2026, 3, 26, 0, 0, 0)
    assert from_project == datetime(2026, 3, 24, 0, 0, 0)
    assert from_detail == datetime(2026, 3, 25, 0, 0, 0)


def test_resolve_schedule_start_anchor_uses_project_detail_when_project_start_missing():
    config = CronogramaTrabajoConfig()
    detail_start = cronograma_trabajo_service._resolve_project_start_reference(
        config=config,
        proyecto=Proyecto(),
        detail=ProyectoDetalle(fecha_inicio=datetime(2026, 3, 24, 0, 0, 0)),
    )

    anchor = cronograma_trabajo_service._resolve_schedule_start_anchor(config, detail_start)

    assert anchor == datetime(2026, 3, 24, 8, 0, 0)


def test_cost_model_metadata_separates_temporal_and_quantity_costs():
    metadata = cronograma_trabajo_service._build_cost_model_metadata(
        apu=None,
        budget_line_total=Decimal("150"),
        budget_quantity=Decimal("3"),
        unit_cost_breakdown={
            "equipos_herramientas": Decimal("10"),
            "materiales": Decimal("30"),
            "transporte": Decimal("5"),
            "mano_obra": Decimal("5"),
        },
        equipment_ownership_breakdown={
            "owned": Decimal("0"),
            "rented": Decimal("0"),
            "unknown": Decimal("10"),
        },
        current_duration_days=Decimal("2"),
        current_duration_hours=Decimal("16"),
    )

    assert metadata["line_direct_cost"] == 150.0
    assert metadata["price_source"] == "presupuesto_linea"
    assert metadata["official_budget_line_total"] == 150.0
    assert metadata["base_line_direct_cost"] == 0.0
    assert metadata["operational_line_cost"] == 150.0
    assert metadata["time_dependent_cost"] == 60.0
    assert metadata["quantity_dependent_cost"] == 90.0
    assert metadata["time_dependent_share_pct"] == 40.0
    assert metadata["quantity_dependent_share_pct"] == 60.0
    assert metadata["dominant_time_category"] == "Equipos y Herramientas"
    assert metadata["temporal_cost_per_day"] == 30.0
    assert metadata["temporal_cost_per_hour"] == 3.75
    assert metadata["equipment_cost_traceability_gap"] is True
    assert metadata["economic_confidence_level"] == "proxy_equipment"
    assert metadata["missing_inputs"] == ["equipment_ownership_kind"]
    assert metadata["blocked_for_real_crashing"] is True
    assert metadata["blocking_reason"] == "pending_equipment_ownership_model"
    assert metadata["next_required_capability"] == "resource_equipment_ownership_model"
    assert metadata["crashing_ready"] is True
    assert metadata["equipment_owned_cost"] == 0.0
    assert metadata["equipment_rented_cost"] == 0.0
    assert metadata["equipment_unknown_cost"] == 30.0


def test_cost_model_metadata_declares_apu_base_price_source_without_budget_line_total():
    metadata = cronograma_trabajo_service._build_cost_model_metadata(
        apu=SimpleNamespace(costo_directo=Decimal("25")),
        budget_line_total=Decimal("0"),
        budget_quantity=Decimal("4"),
        unit_cost_breakdown={
            "equipos_herramientas": Decimal("5"),
            "materiales": Decimal("10"),
            "transporte": Decimal("0"),
            "mano_obra": Decimal("10"),
        },
        current_duration_days=Decimal("2"),
        current_duration_hours=Decimal("16"),
    )

    assert metadata["price_source"] == "apu_base"
    assert metadata["unit_direct_cost"] == 25.0
    assert metadata["base_line_direct_cost"] == 100.0
    assert metadata["official_budget_line_total"] == 100.0
    assert metadata["operational_line_cost"] == 100.0
    assert metadata["line_direct_cost"] == 100.0


def test_cost_model_metadata_marks_zero_duration_as_not_crashing_ready():
    metadata = cronograma_trabajo_service._build_cost_model_metadata(
        apu=None,
        budget_line_total=Decimal("40"),
        budget_quantity=Decimal("1"),
        unit_cost_breakdown={
            "equipos_herramientas": Decimal("0"),
            "materiales": Decimal("40"),
            "transporte": Decimal("0"),
            "mano_obra": Decimal("0"),
        },
        current_duration_days=Decimal("0"),
        current_duration_hours=Decimal("0"),
    )

    assert metadata["time_dependent_cost"] == 0.0
    assert metadata["quantity_dependent_cost"] == 40.0
    assert metadata["official_budget_line_total"] == 40.0
    assert metadata["operational_line_cost"] == 40.0
    assert metadata["equipment_cost_traceability_gap"] is False
    assert metadata["economic_confidence_level"] == "traceable"
    assert metadata["missing_inputs"] == []
    assert metadata["blocked_for_real_crashing"] is False
    assert metadata["blocking_reason"] == ""
    assert metadata["next_required_capability"] == ""
    assert metadata["crashing_ready"] is False


def test_cost_model_metadata_marks_declared_equipment_ownership_as_traceable():
    metadata = cronograma_trabajo_service._build_cost_model_metadata(
        apu=None,
        budget_line_total=Decimal("150"),
        budget_quantity=Decimal("3"),
        unit_cost_breakdown={
            "equipos_herramientas": Decimal("10"),
            "materiales": Decimal("30"),
            "transporte": Decimal("5"),
            "mano_obra": Decimal("5"),
        },
        equipment_ownership_breakdown={
            "owned": Decimal("4"),
            "rented": Decimal("6"),
            "unknown": Decimal("0"),
        },
        current_duration_days=Decimal("2"),
        current_duration_hours=Decimal("16"),
    )

    assert metadata["equipment_ownership_supported"] is True
    assert metadata["equipment_cost_traceability_gap"] is False
    assert metadata["economic_confidence_level"] == "traceable"
    assert metadata["missing_inputs"] == []
    assert metadata["blocked_for_real_crashing"] is False
    assert metadata["equipment_owned_cost"] == 12.0
    assert metadata["equipment_rented_cost"] == 18.0
    assert metadata["equipment_unknown_cost"] == 0.0


def test_crashing_review_metadata_estimates_one_more_resource_window():
    metadata = cronograma_trabajo_service._build_crashing_review_metadata(
        trabajo_gobernante=Decimal("12"),
        recursos_asumidos=Decimal("3"),
        jornada=Decimal("8"),
        current_export_duration_days=Decimal("0.5"),
        temporal_cost_per_day=Decimal("30"),
        dominant_time_category="Equipos y Herramientas",
        dominant_category_line_cost=Decimal("24"),
        dominant_category_crew_units=Decimal("2"),
        equipment_ownership_breakdown={
            "owned": Decimal("0"),
            "rented": Decimal("0"),
            "unknown": Decimal("24"),
        },
    )

    assert metadata["review_ready"] is True
    assert metadata["current_assumed_resources"] == 3.0
    assert metadata["next_assumed_resources"] == 4.0
    assert metadata["current_export_duration_days"] == 0.5
    assert metadata["next_export_duration_days"] == 0.375
    assert metadata["days_saved_with_next_resource"] == 0.125
    assert metadata["temporal_cost_release"] == 3.75
    assert metadata["incremental_resource_daily_cost_proxy"] == 24.0
    assert metadata["incremental_resource_total_cost_proxy"] == 9.0
    assert metadata["net_crashing_cost_delta_proxy"] == 5.25
    assert metadata["incremental_cost_per_day_saved_proxy"] == 42.0
    assert metadata["dominant_time_category"] == "Equipos y Herramientas"
    assert metadata["equipment_cost_traceability_gap"] is True
    assert metadata["economic_confidence_level"] == "proxy_equipment"
    assert metadata["missing_inputs"] == ["equipment_ownership_kind"]
    assert metadata["blocked_for_real_crashing"] is True
    assert metadata["blocking_reason"] == "pending_equipment_ownership_model"
    assert metadata["next_required_capability"] == "resource_equipment_ownership_model"


def test_crashing_review_metadata_uses_only_rented_equipment_as_incremental_cost():
    metadata = cronograma_trabajo_service._build_crashing_review_metadata(
        trabajo_gobernante=Decimal("12"),
        recursos_asumidos=Decimal("3"),
        jornada=Decimal("8"),
        current_export_duration_days=Decimal("0.5"),
        temporal_cost_per_day=Decimal("30"),
        dominant_time_category="Equipos y Herramientas",
        dominant_category_line_cost=Decimal("24"),
        dominant_category_crew_units=Decimal("2"),
        equipment_ownership_breakdown={
            "owned": Decimal("6"),
            "rented": Decimal("18"),
            "unknown": Decimal("0"),
        },
    )

    assert metadata["equipment_cost_traceability_gap"] is False
    assert metadata["economic_confidence_level"] == "traceable"
    assert metadata["blocked_for_real_crashing"] is False
    assert metadata["incremental_resource_daily_cost_proxy"] == 18.0
    assert metadata["incremental_resource_total_cost_proxy"] == 6.75
    assert metadata["net_crashing_cost_delta_proxy"] == 3.0
    assert metadata["incremental_cost_per_day_saved_proxy"] == 24.0


def test_governing_resource_selection_prefers_highest_work_hours():
    winner = cronograma_trabajo_service._select_governing_resource_candidate([
        {
            "recurso_id": 10,
            "nombre": "Operador A",
            "categoria": "Mano de Obra",
            "categoria_detalle": "mano_obra_no_especializada",
            "categoria_detalle_label": "Mano de obra no especializada",
            "priority": 4,
            "trabajo_horas": Decimal("12"),
            "costo_hora": Decimal("4"),
            "order_index": 1,
        },
        {
            "recurso_id": 11,
            "nombre": "Excavadora",
            "categoria": "Equipos y Herramientas",
            "categoria_detalle": "equipo_maquinaria",
            "categoria_detalle_label": "Equipo / Maquinaria",
            "priority": 1,
            "trabajo_horas": Decimal("18"),
            "costo_hora": Decimal("10"),
            "order_index": 2,
        },
    ])

    assert winner["recurso_id"] == 11
    assert winner["criterio_aplicado"] == "1-rendimiento"


def test_governing_resource_candidate_uses_governing_rendimiento_not_crew_quantity():
    linea = SimpleNamespace(
        id=1,
        apu_hijo_id=None,
        recurso_id=10,
        cantidad=Decimal("2"),
        rendimiento=Decimal("0.02"),
        descripcion="Peón",
        recurso=SimpleNamespace(
            id=10,
            descripcion="Peón",
            codigo="4-001",
            governing_resource_kind="mano_obra_no_especializada",
        ),
        subtotal=None,
        precio_congelado=None,
    )

    candidate = cronograma_trabajo_service._build_governing_resource_candidate(
        linea=linea,
        inherited_factor=Decimal("112.62"),
        order_index=1,
    )

    assert candidate is not None
    assert candidate["rendimiento_horas_unidad"] == Decimal("0.02")
    assert candidate["cantidad_total"] == Decimal("112.62")
    assert candidate["cantidad_cuadrilla"] == Decimal("2")
    assert candidate["trabajo_horas"] == Decimal("2.2524")


def test_operational_apu_snapshot_consolidates_nested_resources_with_relative_work():
    resource = SimpleNamespace(
        id=10,
        codigo="4-001",
        descripcion="Peón",
        precio=Decimal("5"),
        unidad=SimpleNamespace(simbolo="h"),
    )
    material = SimpleNamespace(
        id=11,
        codigo="2-001",
        descripcion="Agua",
        precio=Decimal("1"),
        unidad=SimpleNamespace(simbolo="l"),
    )
    child_apu = SimpleNamespace(
        id=200,
        codigo="5-001",
        descripcion="Hormigon simple",
        unidad="m3",
        lineas=[
            SimpleNamespace(
                id=3,
                apu_id=200,
                apu_hijo_id=None,
                recurso_id=10,
                recurso=resource,
                cantidad=Decimal("3"),
                rendimiento=Decimal("0.4"),
                precio_congelado=None,
                orden=1,
            ),
            SimpleNamespace(
                id=4,
                apu_id=200,
                apu_hijo_id=None,
                recurso_id=11,
                recurso=material,
                cantidad=Decimal("8"),
                rendimiento=Decimal("1"),
                precio_congelado=None,
                orden=2,
            )
        ],
    )
    parent_apu = SimpleNamespace(
        id=100,
        codigo="5-002",
        descripcion="Hormigon ciclopeo",
        unidad="m3",
        lineas=[
            SimpleNamespace(
                id=1,
                apu_id=100,
                apu_hijo_id=None,
                recurso_id=10,
                recurso=resource,
                cantidad=Decimal("2"),
                rendimiento=Decimal("0.5"),
                precio_congelado=None,
                orden=1,
            ),
            SimpleNamespace(
                id=2,
                apu_id=100,
                apu_hijo_id=200,
                apu_hijo=child_apu,
                cantidad=Decimal("0.25"),
                rendimiento=Decimal("1"),
                orden=2,
            ),
        ],
    )

    snapshot = cronograma_trabajo_service._build_apu_operational_resources_metadata(parent_apu)

    assert snapshot["status"] == "anidados_explotados"
    assert snapshot["has_nested"] is True
    assert len(snapshot["resources"]) == 2
    resource_snapshot = next(item for item in snapshot["resources"] if item["recurso_id"] == resource.id)
    assert resource_snapshot["origin"] == "consolidado"
    assert resource_snapshot["cantidad"] == 5.0
    assert resource_snapshot["trabajo_relativo"] == 1.3
    assert round(resource_snapshot["rendimiento_equivalente"], 6) == round(1.3 / 5, 6)
    parent_source = next(source for source in resource_snapshot["source_lines"] if not source["nested"])
    nested_source = next(source for source in resource_snapshot["source_lines"] if source["nested"])
    assert parent_source["cantidad"] == 2.0
    assert nested_source["cantidad"] == 3.0
    assert nested_source["trabajo_relativo"] == 0.3
    assert parent_source["apu_descripcion"] == "Hormigon ciclopeo"
    assert parent_source["apu_unidad"] == "m3"
    assert nested_source["apu_descripcion"] == "Hormigon simple"
    assert nested_source["apu_unidad"] == "m3"
    material_snapshot = next(item for item in snapshot["resources"] if item["recurso_id"] == material.id)
    assert material_snapshot["origin"] == "anidado"
    assert material_snapshot["cantidad"] == 2.0


def test_active_apu_resource_modification_overrides_base_snapshot_and_work():
    apu = SimpleNamespace(id=100, lineas=[])
    snapshot = {
        "status": "anidados_explotados",
        "resources": [
            {
                "id": "10|4|h|5",
                "recurso_id": 10,
                "descripcion": "Peón modificado",
                "categoria_id": 4,
                "unidad": "h",
                "cantidad": 4,
                "rendimiento_equivalente": 0.25,
                "origin": "consolidado",
            }
        ],
    }
    config = CronogramaTrabajoConfig(
        apu_resource_modifications_v1={
            "100": {
                "id": "mod-100",
                "active": True,
                "state": "confirmada",
                "apu_operativo_snapshot": snapshot,
            }
        }
    )

    resolved = cronograma_trabajo_service._resolve_active_apu_operational_snapshot(
        apu=apu,
        config=config,
        row_metadata={},
    )
    calculation = cronograma_trabajo_service._build_operational_calculation_from_snapshot(
        resolved,
        Decimal("12"),
    )

    assert resolved["source"] == "apu_resource_modifications_v1"
    assert resolved["active_modification_id"] == "mod-100"
    assert calculation["unit_breakdown"]["mano_obra"] == Decimal("1.00")
    assert calculation["breakdown"]["mano_obra"] == Decimal("12.00")
    assert calculation["governing_resource"]["trabajo_horas"] == Decimal("12.00")


def test_line_metadata_snapshot_is_rebuilt_from_apu_when_base_is_available():
    resource = SimpleNamespace(
        id=10,
        codigo="4-001",
        descripcion="Peón",
        precio=Decimal("5"),
        unidad=SimpleNamespace(simbolo="h"),
    )
    child_apu = SimpleNamespace(
        id=200,
        codigo="5-001",
        descripcion="Hormigon simple",
        unidad="m3",
        lineas=[
            SimpleNamespace(
                id=3,
                apu_id=200,
                apu_hijo_id=None,
                recurso_id=10,
                recurso=resource,
                cantidad=Decimal("3"),
                rendimiento=Decimal("0.6"),
                precio_congelado=None,
                orden=1,
            )
        ],
    )
    parent_apu = SimpleNamespace(
        id=100,
        codigo="5-002",
        descripcion="Hormigon ciclopeo",
        unidad="m3",
        lineas=[
            SimpleNamespace(
                id=1,
                apu_id=100,
                apu_hijo_id=None,
                recurso_id=10,
                recurso=resource,
                cantidad=Decimal("2"),
                rendimiento=Decimal("0.5"),
                precio_congelado=None,
                orden=1,
            ),
            SimpleNamespace(
                id=2,
                apu_id=100,
                apu_hijo_id=200,
                apu_hijo=child_apu,
                cantidad=Decimal("0.25"),
                rendimiento=Decimal("1"),
                orden=2,
            ),
        ],
    )
    stale_metadata = {
        APU_OPERATIONAL_RESOURCES_METADATA_KEY: {
            "status": "anidados_explotados",
            "has_nested": True,
            "resources": [
                {
                    "recurso_id": 10,
                    "descripcion": "Peón",
                    "categoria_id": 4,
                    "cantidad": 3.1,
                    "trabajo_relativo": 1.86,
                    "rendimiento_equivalente": 0.6,
                    "origin": "anidado",
                    "source_lines": [
                        {
                            "linea_id": 3,
                            "nested": True,
                            "native_cantidad": 3,
                            "original_cantidad": 0.75,
                            "cantidad": 3.1,
                            "rendimiento": 0.6,
                            "trabajo_relativo": 1.86,
                        }
                    ],
                }
            ],
        }
    }

    resolved = cronograma_trabajo_service._resolve_active_apu_operational_snapshot(
        apu=parent_apu,
        config=CronogramaTrabajoConfig(),
        row_metadata=stale_metadata,
    )
    resource_snapshot = resolved["resources"][0]
    nested_source = next(source for source in resource_snapshot["source_lines"] if source["nested"])

    assert resource_snapshot["cantidad"] == 5.0
    assert resource_snapshot["trabajo_relativo"] == 1.45
    assert nested_source["cantidad"] == 3.0
    assert nested_source["native_cantidad"] == 3.0
    assert nested_source["original_cantidad"] == 3.0


def test_exploded_resource_quantity_change_preserves_source_work_and_derives_performance():
    apu = SimpleNamespace(id=100, lineas=[])
    snapshot = {
        "status": "anidados_explotados",
        "has_nested": True,
        "resources": [
            {
                "id": "10|4|h|5",
                "recurso_id": 10,
                "descripcion": "Peon consolidado",
                "categoria_id": 4,
                "unidad": "h",
                "cantidad": 4,
                "trabajo_relativo": 4,
                "rendimiento_equivalente": 1,
                "origin": "consolidado",
                "source_lines": [
                    {
                        "linea_id": 1,
                        "nested": False,
                        "cantidad": 1,
                        "rendimiento": 0.5,
                        "trabajo_relativo": 0.5,
                    },
                    {
                        "linea_id": 2,
                        "nested": True,
                        "cantidad": 1,
                        "rendimiento": 0.5,
                        "trabajo_relativo": 0.5,
                    },
                ],
            }
        ],
    }
    config = CronogramaTrabajoConfig(
        apu_resource_modifications_v1={
            "100": {
                "id": "mod-100",
                "active": True,
                "state": "confirmada",
                "apu_operativo_snapshot": snapshot,
            }
        }
    )

    resolved = cronograma_trabajo_service._resolve_active_apu_operational_snapshot(
        apu=apu,
        config=config,
        row_metadata={},
    )
    resource = resolved["resources"][0]
    calculation = cronograma_trabajo_service._build_operational_calculation_from_snapshot(
        resolved,
        Decimal("12"),
    )

    assert resource["cantidad"] == 4
    assert resource["trabajo_relativo"] == 1
    assert resource["rendimiento_equivalente"] == 0.25
    assert calculation["unit_breakdown"]["mano_obra"] == Decimal("1.00")
    assert calculation["breakdown"]["mano_obra"] == Decimal("12.00")


def test_governing_resource_selection_uses_hierarchy_when_work_hours_tie():
    winner = cronograma_trabajo_service._select_governing_resource_candidate([
        {
            "recurso_id": 20,
            "nombre": "Herramientas varias",
            "categoria": "Equipos y Herramientas",
            "categoria_detalle": "herramientas",
            "categoria_detalle_label": "Herramientas",
            "priority": 5,
            "trabajo_horas": Decimal("16"),
            "costo_hora": Decimal("2"),
            "order_index": 1,
        },
        {
            "recurso_id": 21,
            "nombre": "Topógrafo",
            "categoria": "Mano de Obra",
            "categoria_detalle": "mano_obra_especializada",
            "categoria_detalle_label": "Mano de obra especializada",
            "priority": 2,
            "trabajo_horas": Decimal("16"),
            "costo_hora": Decimal("2"),
            "order_index": 2,
        },
    ])

    assert winner["recurso_id"] == 21
    assert winner["criterio_aplicado"] == "2-jerarquia"


def test_governing_resource_selection_uses_cost_when_work_and_hierarchy_tie():
    winner = cronograma_trabajo_service._select_governing_resource_candidate([
        {
            "recurso_id": 30,
            "nombre": "Cadenero A",
            "categoria": "Mano de Obra",
            "categoria_detalle": "mano_obra_semiespecializada",
            "categoria_detalle_label": "Mano de obra semiespecializada",
            "priority": 3,
            "trabajo_horas": Decimal("14"),
            "costo_hora": Decimal("6"),
            "order_index": 1,
        },
        {
            "recurso_id": 31,
            "nombre": "Cadenero B",
            "categoria": "Mano de Obra",
            "categoria_detalle": "mano_obra_semiespecializada",
            "categoria_detalle_label": "Mano de obra semiespecializada",
            "priority": 3,
            "trabajo_horas": Decimal("14"),
            "costo_hora": Decimal("8"),
            "order_index": 2,
        },
    ])

    assert winner["recurso_id"] == 31
    assert winner["criterio_aplicado"] == "3-costo"
