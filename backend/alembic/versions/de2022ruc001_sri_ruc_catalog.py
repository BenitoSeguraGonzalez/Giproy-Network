"""SRI RUC catalog, fiscal identity and manual verification.

Revision ID: de2022ruc001
Revises: de1970a1b2c3
Create Date: 2026-07-13
"""

from alembic import op
import sqlalchemy as sa


revision = "de2022ruc001"
down_revision = "de1970a1b2c3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("DELETE FROM system_config WHERE clave = 'ECUADOR_API_KEY'")
    op.add_column("empresas", sa.Column("is_system_company", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("empresas", sa.Column("fiscal_status", sa.String(100), nullable=True))
    op.add_column("empresas", sa.Column("fiscal_taxpayer_type", sa.String(150), nullable=True))
    op.add_column("empresas", sa.Column("fiscal_start_date", sa.String(50), nullable=True))
    op.add_column("empresas", sa.Column("fiscal_economic_activity", sa.Text(), nullable=True))
    op.add_column("empresas", sa.Column("fiscal_source", sa.String(50), nullable=True))
    op.add_column("empresas", sa.Column("fiscal_source_date", sa.DateTime(timezone=True), nullable=True))
    op.add_column("empresas", sa.Column("fiscal_verified_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index("ix_empresas_is_system_company", "empresas", ["is_system_company"])

    op.add_column("usuarios", sa.Column("ruc_provenance", sa.String(50), nullable=True))
    op.execute(
        """
        UPDATE usuarios AS u
        SET ruc_provenance = 'legacy_company_copy', ruc_verificado = false
        FROM empresas AS e
        WHERE u.empresa_id = e.id
          AND lower(u.rol) = 'administrador'
          AND u.ruc IS NOT NULL
          AND u.ruc = e.ruc
        """
    )

    op.execute(
        """
        UPDATE empresas
        SET is_system_company = true
        WHERE codigo = 'ADMIN-01'
        """
    )
    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (SELECT 1 FROM empresas WHERE ruc IS NULL OR btrim(ruc) = '') THEN
                RAISE EXCEPTION 'No se puede aplicar la identidad fiscal: existen empresas sin RUC.';
            END IF;
            IF EXISTS (
                SELECT 1 FROM empresas
                WHERE NOT is_system_company AND ruc !~ '^[0-9]{13}$'
            ) THEN
                RAISE EXCEPTION 'No se puede aplicar la identidad fiscal: existen empresas comerciales con RUC no canónico.';
            END IF;
        END $$
        """
    )
    op.alter_column("empresas", "ruc", existing_type=sa.String(20), nullable=False)
    op.create_check_constraint(
        "ck_empresas_commercial_ruc_format",
        "empresas",
        "is_system_company OR ruc ~ '^[0-9]{13}$'",
    )
    op.create_check_constraint(
        "ck_empresas_system_company_identity",
        "empresas",
        "NOT is_system_company OR codigo = 'ADMIN-01'",
    )
    op.execute(
        """
        CREATE OR REPLACE FUNCTION prevent_empresa_ruc_change()
        RETURNS trigger AS $$
        BEGIN
            IF OLD.ruc IS DISTINCT FROM NEW.ruc THEN
                RAISE EXCEPTION 'El RUC empresarial es inmutable.' USING ERRCODE = '23514';
            END IF;
            IF OLD.is_system_company IS DISTINCT FROM NEW.is_system_company THEN
                RAISE EXCEPTION 'La condición de empresa de sistema es inmutable.' USING ERRCODE = '23514';
            END IF;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        CREATE TRIGGER trg_prevent_empresa_fiscal_identity_change
        BEFORE UPDATE OF ruc, is_system_company ON empresas
        FOR EACH ROW EXECUTE FUNCTION prevent_empresa_ruc_change();
        """
    )

    op.create_table(
        "sri_ruc_dataset_versions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("province_code", sa.String(2), nullable=False),
        sa.Column("province_name", sa.String(100), nullable=False),
        sa.Column("source_url", sa.String(500), nullable=False),
        sa.Column("source_etag", sa.String(255), nullable=True),
        sa.Column("source_last_modified", sa.String(255), nullable=True),
        sa.Column("checksum_sha256", sa.String(64), nullable=False),
        sa.Column("status", sa.String(30), nullable=False, server_default="staging"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("row_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("accepted_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("rejected_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("conflict_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("error_code", sa.String(100), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("imported_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("activated_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("province_code", "checksum_sha256", name="uq_sri_ruc_version_province_checksum"),
    )
    op.create_index("ix_sri_ruc_versions_province", "sri_ruc_dataset_versions", ["province_code"])
    op.create_index("ix_sri_ruc_versions_status", "sri_ruc_dataset_versions", ["status"])
    op.create_index("ix_sri_ruc_versions_checksum", "sri_ruc_dataset_versions", ["checksum_sha256"])
    op.create_index(
        "uq_sri_ruc_active_province",
        "sri_ruc_dataset_versions",
        ["province_code"],
        unique=True,
        postgresql_where=sa.text("is_active"),
    )

    op.create_table(
        "sri_ruc_records",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("version_id", sa.Integer(), sa.ForeignKey("sri_ruc_dataset_versions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("ruc", sa.String(13), nullable=False),
        sa.Column("business_name", sa.String(500), nullable=False),
        sa.Column("taxpayer_status", sa.String(100), nullable=True),
        sa.Column("taxpayer_type", sa.String(150), nullable=True),
        sa.Column("start_date", sa.String(50), nullable=True),
        sa.Column("economic_activity", sa.Text(), nullable=True),
        sa.Column("establishment_number", sa.String(10), nullable=True),
        sa.Column("identity_conflict", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.UniqueConstraint("version_id", "ruc", name="uq_sri_ruc_record_version_ruc"),
    )
    op.create_index("ix_sri_ruc_records_version", "sri_ruc_records", ["version_id"])
    op.create_index("ix_sri_ruc_records_ruc", "sri_ruc_records", ["ruc"])

    op.create_table(
        "empresa_fiscal_history",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("empresa_id", sa.Integer(), sa.ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False),
        sa.Column("field_name", sa.String(80), nullable=False),
        sa.Column("old_value", sa.Text(), nullable=True),
        sa.Column("new_value", sa.Text(), nullable=True),
        sa.Column("source", sa.String(50), nullable=False),
        sa.Column("source_version_id", sa.Integer(), sa.ForeignKey("sri_ruc_dataset_versions.id", ondelete="SET NULL"), nullable=True),
        sa.Column("changed_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_empresa_fiscal_history_empresa", "empresa_fiscal_history", ["empresa_id"])

    op.create_table(
        "sri_ruc_verified_overrides",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("ruc", sa.String(13), nullable=False, unique=True),
        sa.Column("business_name", sa.String(500), nullable=False),
        sa.Column("taxpayer_status", sa.String(100), nullable=True),
        sa.Column("taxpayer_type", sa.String(150), nullable=True),
        sa.Column("start_date", sa.String(50), nullable=True),
        sa.Column("economic_activity", sa.Text(), nullable=True),
        sa.Column("certificate_hash", sa.String(64), nullable=False),
        sa.Column("verified_by_user_id", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True),
        sa.Column("verified_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("reconciled_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_sri_ruc_override_ruc", "sri_ruc_verified_overrides", ["ruc"], unique=True)

    op.create_table(
        "ruc_manual_verifications",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("ruc", sa.String(13), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("status", sa.String(30), nullable=False, server_default="pending"),
        sa.Column("encrypted_certificate_code", sa.Text(), nullable=True),
        sa.Column("certificate_hash", sa.String(64), nullable=False),
        sa.Column("status_token_hash", sa.String(64), nullable=False, unique=True),
        sa.Column("registration_token_hash", sa.String(64), nullable=True, unique=True),
        sa.Column("business_name", sa.String(500), nullable=True),
        sa.Column("taxpayer_status", sa.String(100), nullable=True),
        sa.Column("taxpayer_type", sa.String(150), nullable=True),
        sa.Column("start_date", sa.String(50), nullable=True),
        sa.Column("economic_activity", sa.Text(), nullable=True),
        sa.Column("rejection_reason", sa.String(80), nullable=True),
        sa.Column("rejection_note", sa.Text(), nullable=True),
        sa.Column("reviewed_by_user_id", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("approval_expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("registration_token_expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("registration_token_used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("email_delivery_status", sa.String(30), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_ruc_manual_verifications_ruc", "ruc_manual_verifications", ["ruc"])
    op.create_index("ix_ruc_manual_verifications_email", "ruc_manual_verifications", ["email"])
    op.create_index("ix_ruc_manual_verifications_status", "ruc_manual_verifications", ["status"])
    op.create_index(
        "uq_ruc_manual_active_ruc",
        "ruc_manual_verifications",
        ["ruc"],
        unique=True,
        postgresql_where=sa.text("status IN ('pending', 'approved')"),
    )

    op.create_table(
        "sri_ruc_lookup_attempts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("ip_hash", sa.String(64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_sri_ruc_lookup_attempts_ip", "sri_ruc_lookup_attempts", ["ip_hash"])
    op.create_index("ix_sri_ruc_lookup_attempts_created", "sri_ruc_lookup_attempts", ["created_at"])


def downgrade() -> None:
    op.drop_table("sri_ruc_lookup_attempts")
    op.drop_table("ruc_manual_verifications")
    op.drop_table("sri_ruc_verified_overrides")
    op.drop_table("empresa_fiscal_history")
    op.drop_table("sri_ruc_records")
    op.drop_table("sri_ruc_dataset_versions")
    op.execute("DROP TRIGGER IF EXISTS trg_prevent_empresa_fiscal_identity_change ON empresas")
    op.execute("DROP FUNCTION IF EXISTS prevent_empresa_ruc_change()")
    op.drop_constraint("ck_empresas_commercial_ruc_format", "empresas", type_="check")
    op.drop_constraint("ck_empresas_system_company_identity", "empresas", type_="check")
    op.alter_column("empresas", "ruc", existing_type=sa.String(20), nullable=True)
    op.drop_column("usuarios", "ruc_provenance")
    op.drop_index("ix_empresas_is_system_company", table_name="empresas")
    for column in (
        "fiscal_verified_at",
        "fiscal_source_date",
        "fiscal_source",
        "fiscal_economic_activity",
        "fiscal_start_date",
        "fiscal_taxpayer_type",
        "fiscal_status",
        "is_system_company",
    ):
        op.drop_column("empresas", column)
