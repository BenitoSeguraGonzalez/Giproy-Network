from pathlib import Path

import pytest

from app.services.bim.p6_xer_interop_service import export_p6_xer, parse_p6_xer


FIXTURE = Path(__file__).parent / "fixtures" / "bim" / "scheduling" / "p6-basic.xer"


def test_p6_xer_import_preview_maps_official_tables_without_persistence():
    result = parse_p6_xer(
        FIXTURE.read_bytes(),
        source_filename=FIXTURE.name,
        timezone_name="America/Bogota",
    )
    document = result["document"]

    assert result["preflight"]["valid"] is True
    assert document.source_format == "p6_xer"
    assert document.project_name == "P6 XER Interoperable"
    assert len(document.wbs) == 2
    assert document.wbs[1].parent_id == document.wbs[0].id
    assert [item.code for item in document.activities] == ["A1000", "A1010"]
    assert document.activities[0].activity_type == "start_milestone"
    assert document.activities[1].constraint_type == "start_no_earlier_than"
    assert document.dependencies[0].dependency_type == "FS"
    assert document.dependencies[0].lag_hours == 8
    assert document.resources[0].unit_cost == 25
    assert document.assignments[0].planned_cost == 1000
    assert "Table:UDFVALUE" in document.unsupported_source_fields
    assert "CALENDAR[10].clndr_data" in document.unsupported_source_fields


def test_p6_xer_internal_round_trip_preserves_supported_semantics():
    imported = parse_p6_xer(
        FIXTURE.read_bytes(),
        source_filename=FIXTURE.name,
        timezone_name="America/Bogota",
    )["document"]
    round_trip = parse_p6_xer(
        export_p6_xer(imported),
        source_filename="p6-round-trip.xer",
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
    assert document.activities[1].percent_complete == 25
    assert document.dependencies[0].lag_hours == 8
    assert document.assignments[0].actual_cost == 200


def test_p6_xer_rejects_invalid_markers_timezone_and_multiple_projects():
    payload = FIXTURE.read_bytes()
    with pytest.raises(ValueError, match="ERMHDR"):
        parse_p6_xer(payload.replace(b"ERMHDR", b"INVALID", 1), source_filename="invalid.xer", timezone_name="America/Bogota")
    with pytest.raises(ValueError, match="zona horaria"):
        parse_p6_xer(payload, source_filename=FIXTURE.name, timezone_name="Invalid/Timezone")
    duplicate = payload.replace(
        b"%T\tCALENDAR",
        b"%R\t2\tP6-XER-2\t2026-07-13 08:00\t2026-07-13 08:00\t2026-07-18 17:00\t10\r\n%T\tCALENDAR",
        1,
    )
    with pytest.raises(ValueError, match="exactamente un proyecto"):
        parse_p6_xer(duplicate, source_filename="multi.xer", timezone_name="America/Bogota")


def test_p6_xer_reports_unresolved_relationships_and_enforces_budget(monkeypatch):
    payload = FIXTURE.read_bytes().replace(b"\t1000\t1\t1\tPR_FS", b"\t9999\t1\t1\tPR_FS")
    document = parse_p6_xer(payload, source_filename="unresolved.xer", timezone_name="America/Bogota")["document"]
    assert any("UnresolvedReference:9999:1001" in item for item in document.unsupported_source_fields)

    from app.services.bim import p6_xer_interop_service

    monkeypatch.setattr(p6_xer_interop_service, "MAX_P6_XER_BYTES", 32)
    with pytest.raises(ValueError, match="supera el limite"):
        parse_p6_xer(FIXTURE.read_bytes(), source_filename=FIXTURE.name, timezone_name="America/Bogota")


def test_p6_xer_does_not_fold_external_project_relationships_into_local_schedule():
    payload = FIXTURE.read_bytes().replace(b"\t1000\t1\t1\tPR_FS", b"\t1000\t1\t2\tPR_FS")
    document = parse_p6_xer(payload, source_filename="external.xer", timezone_name="America/Bogota")["document"]

    assert document.dependencies == []
    assert any("ExternalProject:2:1" in item for item in document.unsupported_source_fields)


def test_p6_xer_endpoints_are_registered_inside_bim_router():
    from app.api.endpoints.bim_models import router

    paths = {route.path: route.methods for route in router.routes}
    assert paths["/projects/{project_id}/4d/schedule-interchange/p6-xer/import-preview"] == {"POST"}
    assert paths["/projects/{project_id}/4d/schedule-interchange/p6-xer/export"] == {"POST"}
