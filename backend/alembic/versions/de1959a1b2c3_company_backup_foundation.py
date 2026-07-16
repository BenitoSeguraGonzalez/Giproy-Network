"""company backup foundation

Revision ID: de1959a1b2c3
Revises: de1951a1b2c3
Create Date: 2026-06-20
"""

from alembic import op
import sqlalchemy as sa


revision = "de1959a1b2c3"
down_revision = "de1951a1b2c3"
branch_labels = None
depends_on = None


def _table_exists(table_name: str) -> bool:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return table_name in inspector.get_table_names()


def upgrade() -> None:
    if not _table_exists("company_backup_internal_artifacts"):
        op.create_table(
            "company_backup_internal_artifacts",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("empresa_id", sa.Integer(), nullable=False),
            sa.Column("created_by_operation_id", sa.Integer(), nullable=True),
            sa.Column("created_by_user_id", sa.Integer(), nullable=True),
            sa.Column("created_by_email", sa.String(length=255), nullable=True),
            sa.Column("created_by_role", sa.String(length=100), nullable=True),
            sa.Column("reason", sa.String(length=120), server_default="pre_restore_safety", nullable=False),
            sa.Column("status", sa.String(length=40), server_default="available", nullable=False),
            sa.Column("artifact_path", sa.String(length=1024), nullable=False),
            sa.Column("backup_hash", sa.String(length=128), nullable=False),
            sa.Column("backup_format_version", sa.String(length=40), server_default="company-full-backup-v1", nullable=False),
            sa.Column("size_bytes", sa.Integer(), server_default="0", nullable=False),
            sa.Column("counts_json", sa.JSON(), nullable=True),
            sa.Column("manifest_summary_json", sa.JSON(), nullable=True),
            sa.Column("restored_by_operation_id", sa.Integer(), nullable=True),
            sa.Column("restored_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("cleanup_after", sa.DateTime(timezone=True), nullable=True),
            sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("deletion_reason", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(["created_by_user_id"], ["usuarios.id"], ondelete="SET NULL"),
            sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_company_backup_internal_artifacts_id"), "company_backup_internal_artifacts", ["id"], unique=False)
        op.create_index(op.f("ix_company_backup_internal_artifacts_empresa_id"), "company_backup_internal_artifacts", ["empresa_id"], unique=False)
        op.create_index(op.f("ix_company_backup_internal_artifacts_created_by_operation_id"), "company_backup_internal_artifacts", ["created_by_operation_id"], unique=False)
        op.create_index(op.f("ix_company_backup_internal_artifacts_created_by_user_id"), "company_backup_internal_artifacts", ["created_by_user_id"], unique=False)
        op.create_index(op.f("ix_company_backup_internal_artifacts_created_by_email"), "company_backup_internal_artifacts", ["created_by_email"], unique=False)
        op.create_index(op.f("ix_company_backup_internal_artifacts_reason"), "company_backup_internal_artifacts", ["reason"], unique=False)
        op.create_index(op.f("ix_company_backup_internal_artifacts_status"), "company_backup_internal_artifacts", ["status"], unique=False)
        op.create_index(op.f("ix_company_backup_internal_artifacts_backup_hash"), "company_backup_internal_artifacts", ["backup_hash"], unique=False)
        op.create_index(op.f("ix_company_backup_internal_artifacts_expires_at"), "company_backup_internal_artifacts", ["expires_at"], unique=False)
        op.create_index(op.f("ix_company_backup_internal_artifacts_cleanup_after"), "company_backup_internal_artifacts", ["cleanup_after"], unique=False)
        op.create_index(op.f("ix_company_backup_internal_artifacts_deleted_at"), "company_backup_internal_artifacts", ["deleted_at"], unique=False)
        op.create_index(op.f("ix_company_backup_internal_artifacts_created_at"), "company_backup_internal_artifacts", ["created_at"], unique=False)

    if not _table_exists("company_backup_operations"):
        op.create_table(
            "company_backup_operations",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("empresa_id", sa.Integer(), nullable=False),
            sa.Column("requested_by_user_id", sa.Integer(), nullable=True),
            sa.Column("requested_by_email", sa.String(length=255), nullable=True),
            sa.Column("requested_by_role", sa.String(length=100), nullable=True),
            sa.Column("operation_type", sa.String(length=50), nullable=False),
            sa.Column("source", sa.String(length=40), server_default="external", nullable=False),
            sa.Column("scope", sa.String(length=80), server_default="company-full-1to1", nullable=False),
            sa.Column("status", sa.String(length=40), server_default="preflight", nullable=False),
            sa.Column("backup_hash", sa.String(length=128), nullable=True),
            sa.Column("backup_format_version", sa.String(length=40), nullable=True),
            sa.Column("backup_filename", sa.String(length=255), nullable=True),
            sa.Column("internal_artifact_id", sa.Integer(), nullable=True),
            sa.Column("preflight_json", sa.JSON(), nullable=True),
            sa.Column("confirmations_json", sa.JSON(), nullable=True),
            sa.Column("counts_json", sa.JSON(), nullable=True),
            sa.Column("file_manifest_json", sa.JSON(), nullable=True),
            sa.Column("marketplace_impact_json", sa.JSON(), nullable=True),
            sa.Column("warnings_json", sa.JSON(), nullable=True),
            sa.Column("blockers_json", sa.JSON(), nullable=True),
            sa.Column("metadata_json", sa.JSON(), nullable=True),
            sa.Column("failure_reason", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["internal_artifact_id"], ["company_backup_internal_artifacts.id"], ondelete="SET NULL"),
            sa.ForeignKeyConstraint(["requested_by_user_id"], ["usuarios.id"], ondelete="SET NULL"),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_company_backup_operations_id"), "company_backup_operations", ["id"], unique=False)
        op.create_index(op.f("ix_company_backup_operations_empresa_id"), "company_backup_operations", ["empresa_id"], unique=False)
        op.create_index(op.f("ix_company_backup_operations_requested_by_user_id"), "company_backup_operations", ["requested_by_user_id"], unique=False)
        op.create_index(op.f("ix_company_backup_operations_requested_by_email"), "company_backup_operations", ["requested_by_email"], unique=False)
        op.create_index(op.f("ix_company_backup_operations_operation_type"), "company_backup_operations", ["operation_type"], unique=False)
        op.create_index(op.f("ix_company_backup_operations_source"), "company_backup_operations", ["source"], unique=False)
        op.create_index(op.f("ix_company_backup_operations_status"), "company_backup_operations", ["status"], unique=False)
        op.create_index(op.f("ix_company_backup_operations_backup_hash"), "company_backup_operations", ["backup_hash"], unique=False)
        op.create_index(op.f("ix_company_backup_operations_internal_artifact_id"), "company_backup_operations", ["internal_artifact_id"], unique=False)
        op.create_index(op.f("ix_company_backup_operations_created_at"), "company_backup_operations", ["created_at"], unique=False)

    bind = op.get_bind()
    inspector = sa.inspect(bind)
    artifact_fks = {
        fk["name"]
        for fk in inspector.get_foreign_keys("company_backup_internal_artifacts")
        if fk.get("name")
    }
    if "fk_company_backup_internal_artifacts_created_operation" not in artifact_fks:
        op.create_foreign_key(
            "fk_company_backup_internal_artifacts_created_operation",
            "company_backup_internal_artifacts",
            "company_backup_operations",
            ["created_by_operation_id"],
            ["id"],
            ondelete="SET NULL",
        )
    if "fk_company_backup_internal_artifacts_restored_operation" not in artifact_fks:
        op.create_foreign_key(
            "fk_company_backup_internal_artifacts_restored_operation",
            "company_backup_internal_artifacts",
            "company_backup_operations",
            ["restored_by_operation_id"],
            ["id"],
            ondelete="SET NULL",
        )


def downgrade() -> None:
    if _table_exists("company_backup_operations"):
        op.drop_constraint("fk_company_backup_internal_artifacts_restored_operation", "company_backup_internal_artifacts", type_="foreignkey")
        op.drop_constraint("fk_company_backup_internal_artifacts_created_operation", "company_backup_internal_artifacts", type_="foreignkey")
        op.drop_index(op.f("ix_company_backup_operations_created_at"), table_name="company_backup_operations")
        op.drop_index(op.f("ix_company_backup_operations_internal_artifact_id"), table_name="company_backup_operations")
        op.drop_index(op.f("ix_company_backup_operations_backup_hash"), table_name="company_backup_operations")
        op.drop_index(op.f("ix_company_backup_operations_status"), table_name="company_backup_operations")
        op.drop_index(op.f("ix_company_backup_operations_source"), table_name="company_backup_operations")
        op.drop_index(op.f("ix_company_backup_operations_operation_type"), table_name="company_backup_operations")
        op.drop_index(op.f("ix_company_backup_operations_requested_by_email"), table_name="company_backup_operations")
        op.drop_index(op.f("ix_company_backup_operations_requested_by_user_id"), table_name="company_backup_operations")
        op.drop_index(op.f("ix_company_backup_operations_empresa_id"), table_name="company_backup_operations")
        op.drop_index(op.f("ix_company_backup_operations_id"), table_name="company_backup_operations")
        op.drop_table("company_backup_operations")

    if _table_exists("company_backup_internal_artifacts"):
        op.drop_index(op.f("ix_company_backup_internal_artifacts_created_at"), table_name="company_backup_internal_artifacts")
        op.drop_index(op.f("ix_company_backup_internal_artifacts_deleted_at"), table_name="company_backup_internal_artifacts")
        op.drop_index(op.f("ix_company_backup_internal_artifacts_cleanup_after"), table_name="company_backup_internal_artifacts")
        op.drop_index(op.f("ix_company_backup_internal_artifacts_expires_at"), table_name="company_backup_internal_artifacts")
        op.drop_index(op.f("ix_company_backup_internal_artifacts_backup_hash"), table_name="company_backup_internal_artifacts")
        op.drop_index(op.f("ix_company_backup_internal_artifacts_status"), table_name="company_backup_internal_artifacts")
        op.drop_index(op.f("ix_company_backup_internal_artifacts_reason"), table_name="company_backup_internal_artifacts")
        op.drop_index(op.f("ix_company_backup_internal_artifacts_created_by_email"), table_name="company_backup_internal_artifacts")
        op.drop_index(op.f("ix_company_backup_internal_artifacts_created_by_user_id"), table_name="company_backup_internal_artifacts")
        op.drop_index(op.f("ix_company_backup_internal_artifacts_created_by_operation_id"), table_name="company_backup_internal_artifacts")
        op.drop_index(op.f("ix_company_backup_internal_artifacts_empresa_id"), table_name="company_backup_internal_artifacts")
        op.drop_index(op.f("ix_company_backup_internal_artifacts_id"), table_name="company_backup_internal_artifacts")
        op.drop_table("company_backup_internal_artifacts")
