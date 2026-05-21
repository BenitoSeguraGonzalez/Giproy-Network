from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict


class BimElementOptionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    bim_model_version_id: int
    global_id: str
    ifc_class: Optional[str] = None
    nombre: Optional[str] = None
    storey_name: Optional[str] = None
    system_name: Optional[str] = None
    classification: Optional[str] = None
    descripcion: Optional[str] = None
    properties: Optional[dict] = None
    metadata_json: Optional[dict] = None


class BimLinkResponse(BaseModel):
    id: int
    target_type: Literal["edt", "apu", "presupuesto"]
    bim_element_id: int
    bim_element_global_id: str
    bim_element_nombre: Optional[str] = None
    target_id: int
    target_label: str
    link_type: str
    notes: Optional[str] = None
    created_by: Optional[int] = None
    fecha_creacion: datetime


class BimLinkCreateRequest(BaseModel):
    bim_element_id: int
    target_type: Literal["edt", "apu", "presupuesto"]
    target_id: int
    link_type: str = "direct"
    notes: Optional[str] = None
