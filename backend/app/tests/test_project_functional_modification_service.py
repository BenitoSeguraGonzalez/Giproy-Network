from datetime import datetime, timezone

from app.models.project_functional_modification import ProjectFunctionalModification
from app.services.project_functional_modification import (
    FUNCTIONAL_MODIFICATION_STATUS_ACTIVE,
    FUNCTIONAL_MODIFICATION_STATUS_SUPERSEDED,
    project_functional_modification_service,
)


def test_create_active_functional_modification_supersedes_previous_scope(db):
    first = project_functional_modification_service.create_active(
        db,
        empresa_id=3,
        proyecto_id=7,
        presupuesto_id=13,
        base_trabajo_id=34,
        revision=1,
        source="gantt",
        source_ref={"draft_id": 10},
        patch={"lines": [69]},
        snapshot={"total": "100.65"},
        user_id=11,
        now=datetime(2026, 6, 29, tzinfo=timezone.utc),
    )
    second = project_functional_modification_service.create_active(
        db,
        empresa_id=3,
        proyecto_id=7,
        presupuesto_id=13,
        base_trabajo_id=34,
        revision=1,
        source="presupuesto",
        source_ref={"linea_id": 69},
        snapshot={"total": "132.79"},
        user_id=12,
        now=datetime(2026, 6, 29, 1, tzinfo=timezone.utc),
    )

    assert first.id != second.id
    assert first.active is False
    assert first.status == FUNCTIONAL_MODIFICATION_STATUS_SUPERSEDED
    assert first.superseded_by_id == 12
    assert second.active is True
    assert second.status == FUNCTIONAL_MODIFICATION_STATUS_ACTIVE
    assert second.source == "presupuesto"
    assert db.query(ProjectFunctionalModification).count() == 2

    active = project_functional_modification_service.get_active(
        db,
        empresa_id=3,
        proyecto_id=7,
        presupuesto_id=13,
        base_trabajo_id=34,
        revision=1,
    )
    assert active.id == second.id


def test_active_functional_modification_scope_is_revision_and_base_specific(db):
    project_functional_modification_service.create_active(
        db,
        empresa_id=3,
        proyecto_id=7,
        presupuesto_id=13,
        base_trabajo_id=34,
        revision=1,
        source="gantt",
    )
    project_functional_modification_service.create_active(
        db,
        empresa_id=3,
        proyecto_id=7,
        presupuesto_id=13,
        base_trabajo_id=35,
        revision=1,
        source="valorados",
    )
    project_functional_modification_service.create_active(
        db,
        empresa_id=3,
        proyecto_id=7,
        presupuesto_id=13,
        base_trabajo_id=34,
        revision=2,
        source="presupuesto",
    )

    assert db.query(ProjectFunctionalModification).count() == 3
    assert project_functional_modification_service.get_active(
        db,
        empresa_id=3,
        proyecto_id=7,
        presupuesto_id=13,
        base_trabajo_id=34,
        revision=1,
    ).source == "gantt"
    assert project_functional_modification_service.get_active(
        db,
        empresa_id=3,
        proyecto_id=7,
        presupuesto_id=13,
        base_trabajo_id=35,
        revision=1,
    ).source == "valorados"
    assert project_functional_modification_service.get_active(
        db,
        empresa_id=3,
        proyecto_id=7,
        presupuesto_id=13,
        base_trabajo_id=34,
        revision=2,
    ).source == "presupuesto"


def test_resolve_official_source_prefers_active_modification_over_base_snapshot(db):
    base_snapshot = {"base_trabajo_id": 34, "total": "132.79"}

    without_active = project_functional_modification_service.resolve_official_source(
        db,
        empresa_id=3,
        proyecto_id=7,
        presupuesto_id=13,
        base_trabajo_id=34,
        revision=1,
        base_snapshot=base_snapshot,
    )

    assert without_active["source"] == "base_proyecto"
    assert without_active["snapshot"] == base_snapshot
    assert without_active["active_modification_id"] is None

    active = project_functional_modification_service.create_active(
        db,
        empresa_id=3,
        proyecto_id=7,
        presupuesto_id=13,
        base_trabajo_id=34,
        revision=1,
        source="gantt",
        source_ref={"draft_id": 99},
        patch={"line_ids": [69]},
        snapshot={"total": "100.65"},
    )

    resolved = project_functional_modification_service.resolve_official_source(
        db,
        empresa_id=3,
        proyecto_id=7,
        presupuesto_id=13,
        base_trabajo_id=34,
        revision=1,
        base_snapshot=base_snapshot,
    )

    assert resolved["source"] == "modificacion_activa"
    assert resolved["active_modification_id"] == active.id
    assert resolved["origin"] == "gantt"
    assert resolved["source_ref"] == {"draft_id": 99}
    assert resolved["patch"] == {"line_ids": [69]}
    assert resolved["snapshot"] == {"total": "100.65"}
    assert resolved["summary"] == {
        "affected_line_ids": [],
        "affected_apu_ids": [],
        "affected_apu_line_ids": [],
        "affected_resource_ids": [],
        "line_payload_map": {},
        "line_payload_count": 0,
        "intention_count": 0,
        "resource_intention_count": 0,
        "schedule_intention_count": 0,
        "operational_snapshots": [],
        "operational_apu_application": {},
        "price_previews": [],
    }


def test_resolve_official_source_exposes_functional_summary_for_gantt_application(db):
    project_functional_modification_service.create_active(
        db,
        empresa_id=3,
        proyecto_id=7,
        presupuesto_id=13,
        base_trabajo_id=34,
        revision=1,
        source="gantt",
        patch={
            "intentions": [
                {
                    "type": "resource_editor",
                    "linea_presupuesto_id": 69,
                    "apu_id": 501,
                    "affected_line_ids": [69, "70", None],
                    "operational_snapshot": {
                        "status": "anidados_explotados",
                        "has_nested": True,
                        "resources": [
                            {
                                "recurso_id": 9001,
                                "codigo": "4-0001-00001",
                                "descripcion": "Peon",
                                "categoria_id": 4,
                                "unidad": "h",
                                "precio_unitario": 4.23,
                                "cantidad": 5,
                                "rendimiento_equivalente": 0.5,
                                "trabajo_relativo": 2.5,
                                "work_policy": "fixed",
                                "origin": "consolidado",
                                "source_lines": [{"apu_id": 501}, {"apu_id": 502}],
                            }
                        ],
                    },
                    "price_preview": {
                        "currency": "USD",
                        "money_decimals": 2,
                        "direct_unit_price": 83.18,
                        "indirect_unit_price": 17.47,
                        "total_unit_price": 100.65,
                        "budget_quantity": 16.58,
                        "budget_line_total_before": 2201.66,
                        "budget_line_total_after": 1668.78,
                        "price_delta": -532.88,
                        "indirect_percent": 21,
                        "visible_temporal_price": 0,
                    },
                },
                {
                    "type": "schedule_editor",
                    "line_id": 71,
                },
            ],
            "persisted_line_ids": [69, 70, 71],
            "operational_apu_application": {
                "updated_line_ids": [7001, 7003],
                "updated_apu_ids": [501, 502],
                "count": 2,
            },
        },
        snapshot={
            "preview_snapshot": {
                "line_payload_map": {
                    "69": {"duration": 8, "assumed_resource_units": 2},
                    "70": {"duration": 5, "assumed_resource_units": 3},
                    "bad": {"duration": 1},
                    "71": "invalid",
                }
            }
        },
    )

    resolved = project_functional_modification_service.resolve_official_source(
        db,
        empresa_id=3,
        proyecto_id=7,
        presupuesto_id=13,
        base_trabajo_id=34,
        revision=1,
    )

    assert resolved["summary"]["affected_line_ids"] == [69, 70, 71]
    assert resolved["summary"]["affected_apu_ids"] == [501, 502]
    assert resolved["summary"]["affected_apu_line_ids"] == [7001, 7003]
    assert resolved["summary"]["affected_resource_ids"] == [9001]
    assert resolved["summary"]["line_payload_map"] == {
        "69": {"duration": 8, "assumed_resource_units": 2},
        "70": {"duration": 5, "assumed_resource_units": 3},
    }
    assert resolved["summary"]["line_payload_count"] == 2
    assert resolved["summary"]["intention_count"] == 2
    assert resolved["summary"]["resource_intention_count"] == 1
    assert resolved["summary"]["schedule_intention_count"] == 1
    assert resolved["summary"]["operational_snapshots"] == [
        {
            "linea_presupuesto_id": 69,
            "apu_id": 501,
            "status": "anidados_explotados",
            "has_nested": True,
            "resource_count": 1,
            "resources": [
                {
                    "recurso_id": 9001,
                    "codigo": "4-0001-00001",
                    "descripcion": "Peon",
                    "categoria_id": 4,
                    "unidad": "h",
                    "precio_unitario": 4.23,
                    "cantidad": 5,
                    "rendimiento_equivalente": 0.5,
                    "trabajo_relativo": 2.5,
                    "work_policy": "fixed",
                    "origin": "consolidado",
                    "source_lines": [{"apu_id": 501}, {"apu_id": 502}],
                }
            ],
        }
    ]
    assert resolved["summary"]["operational_apu_application"] == {
        "updated_line_ids": [7001, 7003],
        "updated_apu_ids": [501, 502],
        "count": 2,
    }
    assert resolved["summary"]["price_previews"] == [
        {
            "linea_presupuesto_id": 69,
            "apu_id": 501,
            "currency": "USD",
            "money_decimals": 2,
            "direct_unit_price": 83.18,
            "indirect_unit_price": 17.47,
            "total_unit_price": 100.65,
            "budget_quantity": 16.58,
            "budget_line_total_before": 2201.66,
            "budget_line_total_after": 1668.78,
            "price_delta": -532.88,
            "indirect_percent": 21,
            "visible_temporal_price": 0,
        }
    ]
