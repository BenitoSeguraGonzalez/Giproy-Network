from app.services.bim.schedule_interop_capability_service import (
    get_schedule_interop_capabilities,
)


def test_schedule_interop_capabilities_report_controlled_proprietary_adapters():
    response = get_schedule_interop_capabilities()
    formats = {item.format: item for item in response.formats}

    assert formats["mspdi_xml"].status == "available"
    assert formats["p6_xml"].status == "available"
    assert formats["p6_xer"].status == "conditional"
    assert formats["p6_xer"].import_preview is True
    assert formats["p6_xer"].export is True
    assert formats["p6_xer"].requires_authorized_corpus is True
    assert formats["mpp"].requires_licensed_adapter is True
    assert formats["powerproject_pp"].requires_licensed_adapter is True


def test_schedule_interop_capabilities_endpoint_is_inside_bim_router():
    from app.api.endpoints.bim_models import router

    paths = {route.path: route.methods for route in router.routes}
    assert paths["/projects/{project_id}/4d/schedule-interchange/capabilities"] == {"GET"}
