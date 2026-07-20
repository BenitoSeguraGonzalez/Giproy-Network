from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator


class BimMapLayer(BaseModel):
    key: str = Field(pattern=r"^[a-z0-9][a-z0-9_-]{1,49}$")
    name: str = Field(min_length=2, max_length=100)
    kind: Literal["basemap", "overlay"]
    service_type: Literal["xyz", "wms"]
    url: str = Field(min_length=8, max_length=2000)
    attribution: str = Field(default="", max_length=500)
    layer_name: str | None = Field(default=None, max_length=300)
    min_zoom: int = Field(default=3, ge=0, le=22)
    max_zoom: int = Field(default=22, ge=0, le=24)
    opacity: float = Field(default=1.0, ge=0.1, le=1.0)
    visible: bool = True
    order: int = Field(default=0, ge=0, le=100)

    @field_validator("url")
    @classmethod
    def validate_url(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized.startswith(("https://", "http://")):
            raise ValueError("El servicio cartografico debe usar HTTP o HTTPS.")
        return normalized

    @model_validator(mode="after")
    def validate_service_contract(self):
        if self.min_zoom > self.max_zoom:
            raise ValueError("min_zoom no puede superar max_zoom.")
        if self.service_type == "xyz" and not all(token in self.url for token in ("{z}", "{x}", "{y}")):
            raise ValueError("Un servicio XYZ requiere {z}, {x} y {y}.")
        if self.service_type == "wms" and not (self.layer_name or "").strip():
            raise ValueError("Un servicio WMS requiere layer_name.")
        return self


class BimMapCatalogSave(BaseModel):
    layers: list[BimMapLayer] = Field(min_length=1, max_length=12)
    justification: str = Field(min_length=3, max_length=2000)

    @model_validator(mode="after")
    def validate_catalog(self):
        keys = [layer.key for layer in self.layers]
        if len(keys) != len(set(keys)):
            raise ValueError("Las claves de capa deben ser unicas.")
        basemaps = [layer for layer in self.layers if layer.kind == "basemap"]
        if not basemaps:
            raise ValueError("El catalogo requiere al menos una capa base.")
        if len([layer for layer in basemaps if layer.visible]) != 1:
            raise ValueError("Debe existir exactamente una capa base visible.")
        return self


class BimMapCatalogResponse(BaseModel):
    contract_version: str = "giproy_bim_map_catalog_v1"
    id: int
    project_id: int
    company_id: int
    revision: int
    status: str
    project_root_code: str | None
    project_revision: int
    layers: list[BimMapLayer]
    justification: str
    created_by: int | None
    created_at: datetime
