from pathlib import Path

import pytest
from pydantic import ValidationError

from app.models.sri_ruc import SriRucRecord
from app.schemas.empresa import EmpresaUpdate
from app.services.sri_ruc import import_file, lookup_ruc


CSV_HEADER = (
    "NUMERO_RUC|RAZON_SOCIAL|CODIGO_JURISDICCION|ESTADO_CONTRIBUYENTE|CLASE_CONTRIBUYENTE|"
    "FECHA_INICIO_ACTIVIDADES|FECHA_ACTUALIZACION|FECHA_SUSPENSION_DEFINITIVA|FECHA_REINICIO_ACTIVIDADES|"
    "OBLIGADO|TIPO_CONTRIBUYENTE|NUMERO_ESTABLECIMIENTO|NOMBRE_FANTASIA_COMERCIAL|ESTADO_ESTABLECIMIENTO|"
    "DESCRIPCION_PROVINCIA_EST|DESCRIPCION_CANTON_EST|DESCRIPCION_PARROQUIA_EST|CODIGO_CIIU|"
    "ACTIVIDAD_ECONOMICA|AGENTE_RETENCION|ESPECIAL\n"
)


def _row(establishment: str, activity: str) -> str:
    return (
        f"0102260858001|EMPRESA OFICIAL|01|ACTIVO|OTRO|2000-01-01||||NO|PERSONA NATURAL|{establishment}|"
        f"|ABIERTO|AZUAY|CUENCA|CUENCA|F4100|{activity}|NO|NO\n"
    )


def test_import_consolidates_primary_establishment_and_queries_database(db, tmp_path: Path):
    source = tmp_path / "azuay.csv"
    source.write_text(CSV_HEADER + _row("002", "SECUNDARIA") + _row("001", "PRINCIPAL"), encoding="utf-8")

    version = import_file(db, province_code="01", path=source)
    result = lookup_ruc(db, "0102260858001")

    assert version.status == "active"
    assert version.row_count == 2
    assert version.accepted_count == 1
    assert db.query(SriRucRecord).count() == 1
    assert result["business_name"] == "EMPRESA OFICIAL"
    assert result["economic_activity"] == "PRINCIPAL"


def test_empresa_update_rejects_ruc_and_legal_name_changes():
    with pytest.raises(ValidationError):
        EmpresaUpdate(ruc="0102260858001")
    with pytest.raises(ValidationError):
        EmpresaUpdate(nombre="OTRA RAZON SOCIAL")
