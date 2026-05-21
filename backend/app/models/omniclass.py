from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base

class OmniClassMaestro(Base):
    """Maestro de códigos OmniClass estándar (Tablas 21, 22, 23, 34)"""
    __tablename__ = "omniclass_maestro"

    id = Column(Integer, primary_key=True)
    tabla = Column(String(10), nullable=False) # 21, 22, 23, 34
    codigo = Column(String(50), nullable=False) # ej: 23-10 10 11
    titulo = Column(String(500), nullable=False)
    titulo_es = Column(String(500), nullable=True)
    nivel = Column(Integer, nullable=False)
    parent_id = Column(Integer, ForeignKey("omniclass_maestro.id", ondelete="CASCADE"), nullable=True)

    parent = relationship("OmniClassMaestro", remote_side=[id], backref="children")

    __table_args__ = (
        UniqueConstraint("tabla", "codigo", name="uq_omniclass_tabla_codigo"),
    )
