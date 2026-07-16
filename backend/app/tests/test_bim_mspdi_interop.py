from pathlib import Path

import pytest

from app.services.bim.mspdi_interop_service import export_mspdi_xml, parse_mspdi_xml


FIXTURE = Path(__file__).parent / "fixtures" / "bim" / "scheduling" / "mspdi-basic.xml"


def test_mspdi_import_preview_maps_schedule_without_persistence():
    result = parse_mspdi_xml(
        FIXTURE.read_bytes(),
        source_filename=FIXTURE.name,
        timezone_name="America/Bogota",
    )
    document = result["document"]
    assert result["preflight"]["valid"] is True
    assert document.project_name == "MSPDI Interoperable"
    assert document.calendars[0].exceptions[0].date.isoformat() == "2026-07-24"
    assert len(document.wbs) == 1
    assert [activity.code for activity in document.activities] == ["1.1", "1.2"]
    assert document.activities[0].activity_type == "start_milestone"
    assert document.dependencies[0].dependency_type == "FS"
    assert document.dependencies[0].predecessor_id == document.activities[0].id
    assert document.assignments[0].planned_work_hours == 40
    assert document.assignments[0].actual_cost == 100


def test_mspdi_export_round_trip_preserves_supported_semantics():
    imported = parse_mspdi_xml(
        FIXTURE.read_bytes(),
        source_filename=FIXTURE.name,
        timezone_name="America/Bogota",
    )["document"]
    exported = export_mspdi_xml(imported)
    round_trip = parse_mspdi_xml(
        exported,
        source_filename="round-trip.xml",
        timezone_name="America/Bogota",
    )
    document = round_trip["document"]
    assert round_trip["preflight"]["valid"] is True
    assert len(document.activities) == 2
    assert len(document.dependencies) == 1
    assert len(document.resources) == 1
    assert len(document.assignments) == 1
    assert document.calendars[0].exceptions[0].date.isoformat() == "2026-07-24"
    assert document.activities[1].duration_hours == 40
    assert document.dependencies[0].dependency_type == "FS"


def test_mspdi_export_preserves_nested_wbs_levels():
    document = parse_mspdi_xml(
        FIXTURE.read_bytes(),
        source_filename=FIXTURE.name,
        timezone_name="America/Bogota",
    )["document"]
    nested = document.wbs[0].model_copy(
        update={
            "id": "WBS-NESTED",
            "code": "1.1",
            "name": "Nested",
            "parent_id": document.wbs[0].id,
        }
    )
    document.wbs.append(nested)
    document.activities[0] = document.activities[0].model_copy(
        update={"wbs_id": nested.id}
    )

    round_trip = parse_mspdi_xml(
        export_mspdi_xml(document),
        source_filename="nested.xml",
        timezone_name="America/Bogota",
    )["document"]

    nested_round_trip = next(node for node in round_trip.wbs if node.code == "1.1")
    activity_round_trip = next(
        item for item in round_trip.activities if item.code == document.activities[0].code
    )
    assert nested_round_trip.parent_id is not None
    assert activity_round_trip.wbs_id == nested_round_trip.id


def test_mspdi_reports_unresolved_and_baseline_source_semantics():
    xml_payload = FIXTURE.read_text(encoding="utf-8").replace(
        "</Project>",
        "<Baselines><Baseline><Number>0</Number></Baseline></Baselines></Project>",
    ).replace(
        "<PredecessorUID>2</PredecessorUID>",
        "<PredecessorUID>999</PredecessorUID>",
    )
    document = parse_mspdi_xml(
        xml_payload.encode("utf-8"),
        source_filename="losses.xml",
        timezone_name="America/Bogota",
    )["document"]

    assert "Baseline" in document.unsupported_source_fields
    assert any(
        "PredecessorUID:999" in item
        for item in document.unsupported_source_fields
    )


def test_mspdi_export_rejects_wbs_cycles():
    document = parse_mspdi_xml(
        FIXTURE.read_bytes(),
        source_filename=FIXTURE.name,
        timezone_name="America/Bogota",
    )["document"]
    first = document.wbs[0]
    second = first.model_copy(
        update={"id": "WBS-CYCLE", "code": "CYCLE", "parent_id": first.id}
    )
    document.wbs[0] = first.model_copy(update={"parent_id": second.id})
    document.wbs.append(second)

    with pytest.raises(ValueError, match="errores"):
        export_mspdi_xml(document)


def test_mspdi_rejects_xml_entities_and_invalid_timezone():
    malicious = b'<?xml version="1.0"?><!DOCTYPE x [<!ENTITY x "boom">]><Project><Name>&x;</Name><Tasks /></Project>'
    with pytest.raises(ValueError, match="inseguras"):
        parse_mspdi_xml(
            malicious,
            source_filename="malicious.xml",
            timezone_name="America/Bogota",
        )
    with pytest.raises(ValueError, match="zona horaria"):
        parse_mspdi_xml(
            FIXTURE.read_bytes(),
            source_filename=FIXTURE.name,
            timezone_name="Invalid/Timezone",
        )


def test_mspdi_enforces_upload_budget(monkeypatch):
    from app.services.bim import mspdi_interop_service

    monkeypatch.setattr(mspdi_interop_service, "MAX_MSPDI_BYTES", 32)
    with pytest.raises(ValueError, match="supera el limite"):
        parse_mspdi_xml(
            FIXTURE.read_bytes(),
            source_filename=FIXTURE.name,
            timezone_name="America/Bogota",
        )


def test_mspdi_endpoints_are_registered_inside_bim_router():
    from app.api.endpoints.bim_models import router

    paths = {route.path: route.methods for route in router.routes}
    assert paths["/projects/{project_id}/4d/schedule-interchange/mspdi/import-preview"] == {"POST"}
    assert paths["/projects/{project_id}/4d/schedule-interchange/mspdi/export"] == {"POST"}
