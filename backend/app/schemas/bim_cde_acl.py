from datetime import datetime

from pydantic import BaseModel, Field


class BimCdeDocumentAclSave(BaseModel):
    user_id: int = Field(gt=0)
    can_view: bool = True
    can_download: bool = False
    can_revise: bool = False
    can_manage: bool = False
    active: bool = True


class BimCdeDocumentAclResponse(BaseModel):
    id: int
    document_id: int
    user_id: int
    user_name: str
    user_email: str
    can_view: bool
    can_download: bool
    can_revise: bool
    can_manage: bool
    active: bool
    granted_by: int | None
    created_at: datetime
    updated_at: datetime
