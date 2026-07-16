"""bim access grants

Revision ID: de2009a1b2c3
Revises: de2008a1b2c3
Create Date: 2026-07-11
"""
from alembic import op
import sqlalchemy as sa
revision="de2009a1b2c3";down_revision="de2008a1b2c3";branch_labels=None;depends_on=None
def upgrade():
    op.create_table("bim_access_grants",sa.Column("id",sa.Integer(),primary_key=True),sa.Column("empresa_id",sa.Integer(),nullable=False),sa.Column("usuario_id",sa.Integer(),nullable=False),sa.Column("capabilities_json",sa.JSON(),nullable=False),sa.Column("active",sa.Boolean(),nullable=False),sa.Column("granted_by",sa.Integer()),sa.Column("fecha_creacion",sa.DateTime(timezone=True),server_default=sa.func.now(),nullable=False),sa.Column("fecha_actualizacion",sa.DateTime(timezone=True)),sa.ForeignKeyConstraint(["empresa_id"],["empresas.id"],ondelete="CASCADE"),sa.ForeignKeyConstraint(["usuario_id"],["usuarios.id"],ondelete="CASCADE"),sa.ForeignKeyConstraint(["granted_by"],["usuarios.id"],ondelete="SET NULL"),sa.UniqueConstraint("empresa_id","usuario_id",name="uq_bim_access_grant_company_user"))
    op.create_index("ix_bim_access_grants_scope","bim_access_grants",["empresa_id","usuario_id","active"])
def downgrade():op.drop_table("bim_access_grants")
