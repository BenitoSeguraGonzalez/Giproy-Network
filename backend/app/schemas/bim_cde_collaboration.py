from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class BimCdePresenceHeartbeat(BaseModel):
    session_key: str = Field(min_length=8, max_length=64, pattern=r"^[A-Za-z0-9._:-]+$")
    workspace: Literal["viewer", "coordination", "planning", "production", "field", "handover"]
    context: dict = Field(default_factory=dict)


class BimCdePresenceLeave(BaseModel):
    session_key: str = Field(min_length=8, max_length=64, pattern=r"^[A-Za-z0-9._:-]+$")


class BimCdePresenceResponse(BaseModel):
    id: int
    user_id: int
    user_name: str
    session_key: str
    workspace: str
    context: dict
    last_seen_at: datetime
    current_user: bool


class BimCdeCollaborationEventResponse(BaseModel):
    id: int
    event_type: str
    entity_type: str | None = None
    entity_id: int | None = None
    actor_id: int | None = None
    actor_name: str
    summary: str
    payload: dict
    created_at: datetime


class BimCdeCollaborationFeedResponse(BaseModel):
    contract_version: str = "giproy_bim_cde_collaboration_feed_v1"
    project_id: int
    company_id: int
    cursor: int
    has_more: bool = False
    events: list[BimCdeCollaborationEventResponse]
