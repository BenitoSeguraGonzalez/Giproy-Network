"""bim quantity proposals

Revision ID: de2008a1b2c3
Revises: de2007a1b2c3
Create Date: 2026-07-11
"""
from alembic import op
import sqlalchemy as sa
revision="de2008a1b2c3"; down_revision="de2007a1b2c3"; branch_labels=None; depends_on=None

def upgrade():
    op.create_table("bim_quantity_proposals", sa.Column("id",sa.Integer(),primary_key=True),sa.Column("proyecto_id",sa.Integer(),nullable=False),sa.Column("empresa_id",sa.Integer(),nullable=False),sa.Column("bim_model_version_id",sa.Integer(),nullable=False),sa.Column("bim_element_id",sa.Integer(),nullable=False),sa.Column("target_type",sa.String(30),nullable=False),sa.Column("target_id",sa.Integer(),nullable=False),sa.Column("quantity_name",sa.String(255),nullable=False),sa.Column("source_kind",sa.String(50),nullable=False),sa.Column("original_value",sa.Float(),nullable=False),sa.Column("original_unit",sa.String(30),nullable=False),sa.Column("presented_value",sa.Float(),nullable=False),sa.Column("presented_unit",sa.String(30),nullable=False),sa.Column("conversion_factor",sa.Float(),nullable=False),sa.Column("rounding_digits",sa.Integer(),nullable=False),sa.Column("normalization_rule",sa.String(255),nullable=False),sa.Column("status",sa.String(30),nullable=False),sa.Column("decision_reason",sa.Text()),sa.Column("created_by",sa.Integer()),sa.Column("decided_by",sa.Integer()),sa.Column("fecha_creacion",sa.DateTime(timezone=True),server_default=sa.func.now(),nullable=False),sa.Column("fecha_decision",sa.DateTime(timezone=True)),sa.ForeignKeyConstraint(["proyecto_id"],["proyectos.id"],ondelete="CASCADE"),sa.ForeignKeyConstraint(["empresa_id"],["empresas.id"],ondelete="CASCADE"),sa.ForeignKeyConstraint(["bim_model_version_id"],["bim_model_versions.id"],ondelete="CASCADE"),sa.ForeignKeyConstraint(["bim_element_id"],["bim_elements.id"],ondelete="CASCADE"),sa.ForeignKeyConstraint(["created_by"],["usuarios.id"],ondelete="SET NULL"),sa.ForeignKeyConstraint(["decided_by"],["usuarios.id"],ondelete="SET NULL"))
    op.create_index("ix_bim_quantity_proposals_scope_status","bim_quantity_proposals",["proyecto_id","empresa_id","status"])
def downgrade(): op.drop_table("bim_quantity_proposals")
