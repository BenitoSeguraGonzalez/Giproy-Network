from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class RucManualRequestIn(BaseModel):
    ruc: str = Field(min_length=13, max_length=13)
    email: EmailStr
    certificate_code: str = Field(min_length=4, max_length=500)


class RucManualRequestResponse(BaseModel):
    status: str
    message: str


class RucManualStatusResponse(BaseModel):
    status: str
    message: str
    approval_expires_at: Optional[datetime] = None


class RucManualDecisionIn(BaseModel):
    approved: bool
    business_name: Optional[str] = Field(default=None, max_length=4000)
    taxpayer_status: Optional[str] = Field(default=None, max_length=100)
    taxpayer_type: Optional[str] = Field(default=None, max_length=150)
    start_date: Optional[str] = Field(default=None, max_length=50)
    economic_activity: Optional[str] = None
    rejection_reason: Optional[str] = Field(default=None, max_length=80)
    rejection_note: Optional[str] = None


class SriRucQualityActivationIn(BaseModel):
    justification: str = Field(min_length=12, max_length=1000)
