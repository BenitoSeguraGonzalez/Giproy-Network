from app.schemas.bim_schedule_interop import BimScheduleInteropCapabilitiesResponse


def get_schedule_interop_capabilities() -> BimScheduleInteropCapabilitiesResponse:
    return BimScheduleInteropCapabilitiesResponse.model_validate(
        {
            "formats": [
                {
                    "format": "canonical_json",
                    "status": "available",
                    "import_preview": True,
                    "export": True,
                    "native_extension": ".json",
                },
                {
                    "format": "mspdi_xml",
                    "status": "available",
                    "import_preview": True,
                    "export": True,
                    "native_extension": ".xml",
                },
                {
                    "format": "p6_xml",
                    "status": "available",
                    "import_preview": True,
                    "export": True,
                    "native_extension": ".xml",
                },
                {
                    "format": "p6_xer",
                    "status": "conditional",
                    "import_preview": True,
                    "export": True,
                    "native_extension": ".xer",
                    "reason": "Subconjunto XER basado en el mapa oficial Oracle; la validacion round-trip contra una instancia P6 sigue siendo externa.",
                    "requires_authorized_corpus": True,
                },
                {
                    "format": "mpp",
                    "status": "conditional",
                    "import_preview": False,
                    "export": False,
                    "native_extension": ".mpp",
                    "reason": "Formato propietario disponible solo mediante adaptador licenciado.",
                    "requires_licensed_adapter": True,
                },
                {
                    "format": "powerproject_pp",
                    "status": "conditional",
                    "import_preview": False,
                    "export": False,
                    "native_extension": ".pp",
                    "reason": "Formato propietario disponible solo mediante adaptador Elecosoft autorizado.",
                    "requires_licensed_adapter": True,
                },
            ]
        }
    )
