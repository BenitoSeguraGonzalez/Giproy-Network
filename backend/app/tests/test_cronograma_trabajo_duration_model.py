from decimal import Decimal
from datetime import datetime
from types import SimpleNamespace

from app.models.proyecto import Proyecto
from app.models.proyecto_detalle import ProyectoDetalle
from app.schemas.cronograma_trabajo import CronogramaTrabajoConfig
from app.services.cronograma_trabajo import cronograma_trabajo_service


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
