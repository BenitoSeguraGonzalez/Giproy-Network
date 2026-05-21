from pydantic import BaseModel
from typing import Optional

class PaisBase(BaseModel):
    nombre: str
    codigo: Optional[str] = None
    prefijo: Optional[str] = None
    moneda: Optional[str] = None
    simbolo_moneda: Optional[str] = None

class PaisCreate(PaisBase):
    pass

class PaisResponse(PaisBase):
    id: int

    class Config:
        from_attributes = True
