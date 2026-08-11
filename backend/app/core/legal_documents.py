"""Identidad inmutable de los documentos aceptados durante el registro.

Los hashes corresponden al texto canónico publicado por el frontend. Cambiar un
texto exige una versión nueva y actualizar estos valores de forma explícita.
"""

import hashlib
import json


TERMS_VERSION = "2026-08-11"
PRIVACY_VERSION = "2026-08-11"

TERMS_CONTENT = {
    "title": "Términos y Condiciones",
    "intro": "Regulan el acceso y uso de GiProy Network como plataforma de gestión de proyectos.",
    "sections": [
        ["Objeto y cuenta", "El usuario debe proporcionar información veraz, proteger sus credenciales y usar el servicio dentro de las facultades concedidas por su organización."],
        ["Servicio", "GiProy ofrece funciones de planificación, presupuesto, colaboración y gestión documental. Las funciones beta pueden cambiar y se identificarán como tales."],
        ["Contenido del cliente", "El cliente conserva sus derechos sobre la información que incorpora y concede únicamente los permisos técnicos necesarios para alojarla, procesarla y respaldarla durante la prestación."],
        ["Uso permitido", "No se permite vulnerar seguridad, eludir controles, infringir derechos de terceros ni utilizar el servicio para actividades ilícitas."],
        ["Disponibilidad y responsabilidad", "Los niveles de servicio, soporte, precio, vigencia y límites aplicables son los indicados en la orden o contrato del cliente, dentro de los límites permitidos por la ley ecuatoriana."],
        ["Terminación y ley aplicable", "La terminación, exportación y eliminación de datos se rigen por el contrato y la normativa ecuatoriana aplicable."],
    ],
}
PRIVACY_CONTENT = {
    "title": "Política de Privacidad",
    "intro": "Describe el tratamiento de datos personales asociado a GiProy Network conforme al marco ecuatoriano.",
    "sections": [
        ["Datos tratados", "Datos de identificación, contacto, empresa, acceso, seguridad, soporte y uso estrictamente necesarios para operar y proteger el servicio."],
        ["Finalidades", "Crear y administrar cuentas, prestar el servicio, verificar identidad empresarial, prevenir fraude, atender soporte y cumplir obligaciones legales. La publicidad requiere autorización separada."],
        ["Base y conservación", "El tratamiento se sustenta según corresponda en consentimiento, relación contractual, obligación legal o interés legítimo. Los datos se conservan sólo durante el plazo necesario y los periodos legales aplicables."],
        ["Destinatarios y encargados", "Pueden intervenir proveedores de infraestructura y soporte sujetos a instrucciones, confidencialidad y medidas de seguridad. No se venden datos personales."],
        ["Derechos", "El titular puede solicitar información, acceso, rectificación, actualización, eliminación, oposición, portabilidad o suspensión cuando proceda legalmente."],
        ["Seguridad e incidentes", "Se aplican controles técnicos y organizativos proporcionales al riesgo, junto con procedimientos de gestión y notificación de incidentes."],
    ],
}

TERMS_CANONICAL = json.dumps(TERMS_CONTENT, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
PRIVACY_CANONICAL = json.dumps(PRIVACY_CONTENT, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def _sha256(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


TERMS_SHA256 = _sha256(TERMS_CANONICAL)
PRIVACY_SHA256 = _sha256(PRIVACY_CANONICAL)


def public_legal_manifest() -> dict[str, dict[str, str]]:
    return {
        "terms": {"version": TERMS_VERSION, "sha256": TERMS_SHA256, "url": "/legal/terminos", **TERMS_CONTENT},
        "privacy": {"version": PRIVACY_VERSION, "sha256": PRIVACY_SHA256, "url": "/legal/privacidad", **PRIVACY_CONTENT},
        "third_party": {"version": TERMS_VERSION, "url": "/legal/licencias"},
    }
