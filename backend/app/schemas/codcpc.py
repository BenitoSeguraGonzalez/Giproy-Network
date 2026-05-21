"""
Schemas Pydantic para el Catálogo CPC
"""
from pydantic import BaseModel
from typing import Optional

class CodCPCBase(BaseModel):
    codCPC: str
    descripcion: str
    tipo: Optional[str] = None
    porcentaje: Optional[float] = None

class CodCPCResponse(CodCPCBase):
    id: int

    class Config:
        from_attributes = True

class CodCPCSearch(BaseModel):
    query: str
    limit: int = 20
