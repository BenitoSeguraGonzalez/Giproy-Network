from typing import Literal, Optional

from pydantic import BaseModel, Field


class BimVersionChangeItem(BaseModel):
    change_type: Literal["added", "removed", "geometry", "properties", "geometry_and_properties", "unchanged"]
    match_strategy: Literal["guid", "semantic_fallback", "unmatched"]
    base_element_id: Optional[int] = None
    target_element_id: Optional[int] = None
    base_guid: Optional[str] = None
    target_guid: Optional[str] = None
    ifc_class: Optional[str] = None
    name: Optional[str] = None
    geometry_changed: bool = False
    properties_changed: bool = False


class BimVersionCompareResponse(BaseModel):
    contract_version: str = "giproy_bim_version_compare_v1"
    base_version_id: int
    target_version_id: int
    summary: dict[str, int] = Field(default_factory=dict)
    changes: list[BimVersionChangeItem] = Field(default_factory=list)
