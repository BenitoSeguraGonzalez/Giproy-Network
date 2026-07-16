from app.core.config import settings
from app.models.sri_ruc import RucManualVerification, SriRucVerifiedOverride
from app.services import ruc_manual


def test_manual_review_encrypts_code_and_approval_creates_one_use_override(db, monkeypatch):
    messages = []
    monkeypatch.setattr(settings, "RUC_REVIEW_ENCRYPTION_KEY", "test-dedicated-secret")
    monkeypatch.setattr(
        ruc_manual,
        "send_transactional_email",
        lambda **kwargs: messages.append(kwargs) or {"success": True, "backend": "mock"},
    )

    response = ruc_manual.create_or_resume_request(
        db,
        ruc="0102260858001",
        email="admin@example.com",
        certificate_code="CERT-SECRET-123",
    )
    item = db.query(RucManualVerification).one()

    assert response["status"] == "pending"
    assert "CERT-SECRET-123" not in item.encrypted_certificate_code
    assert item.certificate_hash

    decision = ruc_manual.decide_request(
        db,
        item=item,
        approved=True,
        reviewer_id=1,
        data={"business_name": "EMPRESA CERTIFICADA"},
    )
    db.refresh(item)

    assert decision["status"] == "approved"
    assert item.encrypted_certificate_code is None
    assert db.query(SriRucVerifiedOverride).filter_by(ruc="0102260858001").one().business_name == "EMPRESA CERTIFICADA"
    registration_url = messages[-1]["body"].splitlines()[-1]
    raw_token = registration_url.split("ruc_verification_token=", 1)[1]
    approval = ruc_manual.consume_registration_token(
        db,
        raw_token=raw_token,
        ruc="0102260858001",
        email="admin@example.com",
    )
    assert approval.id == item.id
    ruc_manual.mark_registration_token_used(db, approval)
    assert ruc_manual.consume_registration_token(
        db,
        raw_token=raw_token,
        ruc="0102260858001",
        email="admin@example.com",
    ) is None


def test_manual_review_does_not_disclose_request_owned_by_another_email(db, monkeypatch):
    monkeypatch.setattr(settings, "RUC_REVIEW_ENCRYPTION_KEY", "test-dedicated-secret")
    monkeypatch.setattr(ruc_manual, "_send_status_email", lambda *_args: True)
    ruc_manual.create_or_resume_request(
        db, ruc="0102260858001", email="owner@example.com", certificate_code="CERT-1234"
    )

    result = ruc_manual.create_or_resume_request(
        db, ruc="0102260858001", email="other@example.com", certificate_code="CERT-9999"
    )

    assert result["status"] == "received"
    assert db.query(RucManualVerification).count() == 1
