from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class BimLinkEdt(Base):
    __tablename__ = "bim_link_edt"

    id = Column(Integer, primary_key=True, index=True)
    bim_element_id = Column(Integer, ForeignKey("bim_elements.id", ondelete="CASCADE"), nullable=False, index=True)
    edt_node_id = Column(Integer, ForeignKey("edt_nodes.id", ondelete="CASCADE"), nullable=False, index=True)
    link_type = Column(String(50), nullable=False, default="direct")
    notes = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())

    element = relationship("BimElement", back_populates="edt_links")
    edt_node = relationship("EdtNode")
    creator = relationship("Usuario")
