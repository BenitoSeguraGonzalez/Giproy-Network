from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class BimCommissioningSystemCreate(BaseModel):
    system_code: str = Field(min_length=1, max_length=100)
    name: str = Field(min_length=1, max_length=255)
    discipline: str | None = Field(default=None, max_length=100)
    description: str | None = Field(default=None, max_length=2000)


class BimCommissioningAssetCreate(BaseModel):
    system_id: int = Field(gt=0)
    version_id: int = Field(gt=0)
    element_id: int = Field(gt=0)
    asset_tag: str = Field(min_length=1, max_length=100)
    name: str = Field(min_length=1, max_length=255)
    asset_type: str = Field(min_length=1, max_length=100)
    manufacturer: str | None = Field(default=None, max_length=255)
    model_reference: str | None = Field(default=None, max_length=255)
    serial_number: str | None = Field(default=None, max_length=255)


class BimCommissioningSystemResponse(BaseModel):
    id: int
    system_code: str
    name: str
    discipline: str | None
    description: str | None
    status: Literal["registered", "commissioning", "accepted", "retired"]
    asset_count: int
    created_by: int | None
    created_at: datetime


class BimCommissioningAssetResponse(BaseModel):
    id: int
    system_id: int
    version_id: int
    element_id: int
    asset_tag: str
    name: str
    asset_type: str
    global_id: str
    source_system_name: str | None
    manufacturer: str | None
    model_reference: str | None
    serial_number: str | None
    status: Literal["registered", "testing", "accepted", "rejected", "retired"]
    created_by: int | None
    created_at: datetime


class BimCommissioningRegistryResponse(BaseModel):
    contract_version: str = "giproy_bim_commissioning_registry_v1"
    project_id: int
    company_id: int
    systems: list[BimCommissioningSystemResponse]
    assets: list[BimCommissioningAssetResponse]
