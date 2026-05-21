from pydantic import BaseModel
from typing import Optional
from datetime import date

class LicenseAssignment(BaseModel):
    empresa_id: int
    licencia_id: int
    months: int = 12
    start_on: Optional[date] = None
    force_immediate: bool = False
    notes: Optional[str] = None
