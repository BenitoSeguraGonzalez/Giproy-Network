"""Add BIM commissioning tests and governed acceptance."""
from alembic import op
import sqlalchemy as sa

revision = "de2047a1b2c3"
down_revision = "de2046a1b2c3"
branch_labels = None
depends_on = None


def upgrade():
    for table, columns in (
        ("bim_commissioning_systems", (("decision_reason", sa.Text(), True), ("lock_version", sa.Integer(), False), ("accepted_by", sa.Integer(), True), ("accepted_at", sa.DateTime(timezone=True), True))),
        ("bim_commissioning_assets", (("decision_reason", sa.Text(), True), ("lock_version", sa.Integer(), False), ("decided_by", sa.Integer(), True), ("decided_at", sa.DateTime(timezone=True), True))),
    ):
        for name, type_, nullable in columns:
            kwargs = {"nullable": nullable}
            if name == "lock_version": kwargs["server_default"] = "1"
            op.add_column(table, sa.Column(name, type_, **kwargs))
    op.create_foreign_key("fk_bim_commissioning_systems_accepted_by", "bim_commissioning_systems", "usuarios", ["accepted_by"], ["id"], ondelete="SET NULL")
    op.create_foreign_key("fk_bim_commissioning_assets_decided_by", "bim_commissioning_assets", "usuarios", ["decided_by"], ["id"], ondelete="SET NULL")
    op.create_table(
        "bim_commissioning_tests",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("empresa_id", sa.Integer(), sa.ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False),
        sa.Column("proyecto_id", sa.Integer(), sa.ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False),
        sa.Column("asset_id", sa.Integer(), sa.ForeignKey("bim_commissioning_assets.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("protocol_code", sa.String(100), nullable=False), sa.Column("attempt", sa.Integer(), nullable=False, server_default="1"), sa.Column("protocol_name", sa.String(255), nullable=False),
        sa.Column("checklist_json", sa.JSON(), nullable=False), sa.Column("results_json", sa.JSON(), nullable=False),
        sa.Column("outcome", sa.String(20), nullable=False), sa.Column("evidence_reference", sa.String(500)),
        sa.Column("status", sa.String(30), nullable=False, server_default="submitted"), sa.Column("decision_reason", sa.Text()),
        sa.Column("lock_version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("submitted_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL")),
        sa.Column("decided_by", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL")),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()), sa.Column("decided_at", sa.DateTime(timezone=True)),
        sa.CheckConstraint("outcome IN ('passed','failed')", name="ck_bim_commissioning_test_outcome"),
        sa.CheckConstraint("status IN ('submitted','accepted','rejected')", name="ck_bim_commissioning_test_status"),
        sa.UniqueConstraint("asset_id", "protocol_code", "attempt", name="uq_bim_commissioning_test_protocol_attempt"),
    )
    for column in ("empresa_id", "proyecto_id", "asset_id", "status"):
        op.create_index(f"ix_bim_commissioning_tests_{column}", "bim_commissioning_tests", [column])


def downgrade():
    op.drop_table("bim_commissioning_tests")
    op.drop_constraint("fk_bim_commissioning_assets_decided_by", "bim_commissioning_assets", type_="foreignkey")
    op.drop_constraint("fk_bim_commissioning_systems_accepted_by", "bim_commissioning_systems", type_="foreignkey")
    for column in ("decided_at", "decided_by", "lock_version", "decision_reason"):
        op.drop_column("bim_commissioning_assets", column)
    for column in ("accepted_at", "accepted_by", "lock_version", "decision_reason"):
        op.drop_column("bim_commissioning_systems", column)
