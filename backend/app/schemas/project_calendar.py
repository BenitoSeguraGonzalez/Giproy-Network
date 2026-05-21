from datetime import date, datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field


class ProjectHolidayCalendarItem(BaseModel):
    id: Optional[int] = None
    holiday_date: date
    observed_date: date
    holiday_name: str
    scope_type: Literal["national", "provincial", "cantonal", "project"] = "national"
    scope_label: str = "Nacional"
    origin_type: Literal["official", "manual_add", "manual_disable"] = "official"
    source_name: Optional[str] = None
    source_url: Optional[str] = None
    is_working_day: bool = False
    editable: bool = True
    notes: Optional[str] = None


class ProjectHolidayCalendarResponse(BaseModel):
    country_code: str = "EC"
    province_code: Optional[str] = None
    canton_code: Optional[str] = None
    start_date: date
    end_date: date
    generated_at: Optional[datetime] = None
    local_source_status: Literal["resolved", "partial", "missing"] = "missing"
    local_source_message: Optional[str] = None
    items: List[ProjectHolidayCalendarItem] = Field(default_factory=list)


class ProjectHolidayManualAdd(BaseModel):
    date: date
    name: str
    notes: Optional[str] = None


class ProjectHolidayRemoveRequest(BaseModel):
    date: date
    name: str
