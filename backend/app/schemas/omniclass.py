from pydantic import BaseModel
from typing import Optional, List

class OmniClassMaestroBase(BaseModel):
    tabla: str
    codigo: str
    titulo: str
    titulo_es: Optional[str] = None
    nivel: int
    parent_id: Optional[int] = None

class OmniClassMaestroCreate(OmniClassMaestroBase):
    pass

class OmniClassMaestro(OmniClassMaestroBase):
    id: int

    class Config:
        from_attributes = True
