from pydantic import BaseModel, Field
from typing import List, Literal, Optional


class ReportPreviewRequest(BaseModel):
    report_type: Literal["apu", "presupuesto", "edo", "edt", "vae", "polinomica", "acta_constitucion", "stakeholders", "cronograma_valorado"]
    entity_ids: List[int] = Field(min_length=1)
    template_id: Optional[str] = "001"
    variant: Optional[str] = None


class ReportExportRequest(BaseModel):
    report_type: Literal["apu", "presupuesto", "edo", "edt", "vae", "polinomica", "acta_constitucion", "stakeholders", "cronograma_valorado"]
    entity_ids: List[int] = Field(min_length=1)
    template_id: Optional[str] = "001"
    format: Literal["xlsx", "pdf", "pdf_excel"] = "xlsx"
    variant: Optional[str] = None
