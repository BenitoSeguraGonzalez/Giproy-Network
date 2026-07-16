from datetime import datetime, timezone

from app.models.sri_ruc import SriRucDatasetVersion, SriRucRecord
from app.services.usuario import usuario_service


def test_validar_ruc_public_uses_active_postgresql_catalog(db):
    version = SriRucDatasetVersion(
        province_code="01",
        province_name="Azuay",
        source_url="https://descargas.sri.gob.ec/download/datosAbiertos/SRI_RUC_Azuay.csv",
        checksum_sha256="a" * 64,
        status="active",
        is_active=True,
        row_count=1,
        accepted_count=1,
        activated_at=datetime.now(timezone.utc),
    )
    db.add(version)
    db.flush()
    db.add(SriRucRecord(
        version_id=version.id,
        ruc="0102260858001",
        business_name="EMPRESA DE PRUEBA",
        taxpayer_status="ACTIVO",
        taxpayer_type="PERSONA NATURAL",
        economic_activity="CONSTRUCCION",
        establishment_number="001",
    ))
    db.commit()

    result = usuario_service.validar_ruc_public("0102260858001", db=db)

    assert result.valido is True
    assert result.razon_social == "EMPRESA DE PRUEBA"
    assert result.estado_contribuyente == "ACTIVO"
    assert result.source == "sri_dataset"
    assert result.requires_manual_review is False


def test_validar_ruc_public_offers_manual_review_when_absent(db):
    result = usuario_service.validar_ruc_public("0102260858001", db=db)

    assert result.valido is False
    assert result.verification_status == "manual_review_available"
    assert result.requires_manual_review is True
