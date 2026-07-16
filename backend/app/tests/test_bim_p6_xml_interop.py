from pathlib import Path

import pytest

from app.services.bim.p6_xml_interop_service import export_p6_xml, parse_p6_xml


FIXTURE = Path(__file__).parent / "fixtures" / "bim" / "scheduling" / "p6-basic.xml"


def test_p6_xml_import_preview_maps_supported_schedule_without_persistence():
    result = parse_p6_xml(
        FIXTURE.read_bytes(),
        source_filename=FIXTURE.name,
        timezone_name="America/Bogota",
    )
    document = result["document"]

    assert result["preflight"]["valid"] is True
    assert document.project_name == "P6 Interoperable"
    assert len(document.wbs) == 2
    assert document.wbs[1].parent_id == document.wbs[0].id
    assert document.calendars[0].exceptions[0].date.isoformat() == "2026-07-24"
    assert [item.code for item in document.activities] == ["A1000", "A1010"]
    assert document.activities[0].activity_type == "start_milestone"
    assert document.activities[1].constraint_type == "start_no_earlier_than"
    assert document.dependencies[0].dependency_type == "FS"
    assert document.dependencies[0].lag_hours == 8
    assert document.assignments[0].planned_cost == 1000
    assert "BaselineProject" in document.unsupported_source_fields


def test_p6_xml_internal_round_trip_preserves_supported_semantics():
    imported = parse_p6_xml(
        FIXTURE.read_bytes(),
        source_filename=FIXTURE.name,
        timezone_name="America/Bogota",
    )["document"]
    imported.calendars[0].exceptions[0] = imported.calendars[0].exceptions[0].model_copy(
        update={"working": True}
    )
    round_trip = parse_p6_xml(
        export_p6_xml(imported),
        source_filename="p6-round-trip.xml",
        timezone_name="America/Bogota",
    )
    document = round_trip["document"]

    assert round_trip["preflight"]["valid"] is True
    assert len(document.wbs) == 2
    assert len(document.activities) == 2
    assert len(document.dependencies) == 1
    assert len(document.resources) == 1
    assert len(document.assignments) == 1
    assert document.activities[1].duration_hours == 40
    assert document.dependencies[0].lag_hours == 8
    assert document.calendars[0].exceptions[0].date.isoformat() == "2026-07-24"
    assert document.calendars[0].exceptions[0].working is True


def test_p6_xml_rejects_unsafe_xml_invalid_timezone_and_multiple_projects():
    malicious = b'<?xml version="1.0"?><!DOCTYPE x [<!ENTITY x "boom">]><APIBusinessObjects><Project><Name>&x;</Name></Project></APIBusinessObjects>'
    with pytest.raises(ValueError, match="inseguras"):
        parse_p6_xml(
            malicious,
            source_filename="malicious.xml",
            timezone_name="America/Bogota",
        )
    with pytest.raises(ValueError, match="zona horaria"):
        parse_p6_xml(
            FIXTURE.read_bytes(),
            source_filename=FIXTURE.name,
            timezone_name="Invalid/Timezone",
        )
    duplicated = FIXTURE.read_text(encoding="utf-8").replace(
        "</Project>",
        "</Project><Project><ObjectId>2</ObjectId><Id>P2</Id><Name>P2</Name><DataDate>2026-07-13T08:00:00-05:00</DataDate></Project>",
        1,
    )
    with pytest.raises(ValueError, match="exactamente un proyecto"):
        parse_p6_xml(
            duplicated.encode("utf-8"),
            source_filename="multi.xml",
            timezone_name="America/Bogota",
        )


def test_p6_xml_reports_unresolved_relationships():
    payload = FIXTURE.read_text(encoding="utf-8").replace(
        "<PredecessorActivityObjectId>1000</PredecessorActivityObjectId>",
        "<PredecessorActivityObjectId>9999</PredecessorActivityObjectId>",
    )
    document = parse_p6_xml(
        payload.encode("utf-8"),
        source_filename="unresolved.xml",
        timezone_name="America/Bogota",
    )["document"]
    assert any("UnresolvedReference:9999:1001" in item for item in document.unsupported_source_fields)


def test_p6_xml_enforces_upload_budget(monkeypatch):
    from app.services.bim import p6_xml_interop_service

    monkeypatch.setattr(p6_xml_interop_service, "MAX_P6_XML_BYTES", 32)
    with pytest.raises(ValueError, match="supera el limite"):
        parse_p6_xml(
            FIXTURE.read_bytes(),
            source_filename=FIXTURE.name,
            timezone_name="America/Bogota",
        )


def test_p6_xml_endpoints_are_registered_inside_bim_router():
    from app.api.endpoints.bim_models import router

    paths = {route.path: route.methods for route in router.routes}
    assert paths["/projects/{project_id}/4d/schedule-interchange/p6/import-preview"] == {"POST"}
    assert paths["/projects/{project_id}/4d/schedule-interchange/p6/export"] == {"POST"}
