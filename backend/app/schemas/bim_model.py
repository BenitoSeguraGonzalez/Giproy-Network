from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field


class BimModelVersionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    bim_model_id: int
    version_label: str
    source_filename: Optional[str] = None
    artifact_path: Optional[str] = None
    status: str
    is_active: bool
    element_count: Optional[int] = None
    storey_count: Optional[int] = None
    notes: Optional[str] = None
    fecha_creacion: datetime
    fecha_actualizacion: Optional[datetime] = None


class BimModelResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    proyecto_id: int
    empresa_id: int
    nombre: str
    descripcion: Optional[str] = None
    disciplina: Optional[str] = None
    archivo_fuente: Optional[str] = None
    activo: bool
    fecha_creacion: datetime
    fecha_actualizacion: Optional[datetime] = None
    versions: list[BimModelVersionResponse] = []


class BimWorkspaceSummaryResponse(BaseModel):
    feature: str = "bim"
    ready: bool = False
    tables_ready: bool = False
    project_id: int
    company_id: int
    models: list[BimModelResponse] = []
    active_version_id: Optional[int] = None
    active_version_label: Optional[str] = None
    tree_nodes: list[dict] = []
    property_groups: list[dict] = []
    link_summary: list[dict] = []


class BimImportStoreyPayload(BaseModel):
    nombre: str = Field(min_length=1, max_length=255)
    codigo: Optional[str] = Field(default=None, max_length=100)
    orden: Optional[int] = None


class BimImportElementPayload(BaseModel):
    global_id: str = Field(min_length=1, max_length=255)
    ifc_class: Optional[str] = Field(default=None, max_length=100)
    nombre: Optional[str] = Field(default=None, max_length=255)
    storey_name: Optional[str] = Field(default=None, max_length=255)
    system_name: Optional[str] = Field(default=None, max_length=255)
    classification: Optional[str] = Field(default=None, max_length=255)
    descripcion: Optional[str] = None
    properties: Optional[dict[str, Any]] = None
    metadata_json: Optional[dict[str, Any]] = None
    geometry_2d: Optional[dict[str, Any]] = None


class BimJsonImportRequest(BaseModel):
    model_name: str = Field(min_length=1, max_length=255)
    discipline: Optional[str] = Field(default=None, max_length=100)
    description: Optional[str] = None
    source_filename: Optional[str] = Field(default=None, max_length=255)
    version_label: str = Field(min_length=1, max_length=50)
    notes: Optional[str] = None
    activate: bool = True
    storeys: list[BimImportStoreyPayload] = []
    elements: list[BimImportElementPayload] = []


class BimJsonImportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    model_id: int
    version_id: int
    model_name: str
    version_label: str
    created_storeys: int
    created_elements: int
    activated: bool


class BimJsonImportBatchRequest(BaseModel):
    packages: list[BimJsonImportRequest] = Field(default_factory=list)


class BimJsonImportBatchResponse(BaseModel):
    results: list[BimJsonImportResponse] = Field(default_factory=list)
    imported_count: int = 0


class BimJsonValidationIssue(BaseModel):
    severity: str
    code: str
    message: str
    path: Optional[str] = None


class BimJsonGeometrySummary(BaseModel):
    rect_count: int = 0
    line_count: int = 0
    polygon_count: int = 0
    derived_count: int = 0


class BimJsonValidationSummary(BaseModel):
    model_name: str
    version_label: str
    storey_count: int = 0
    element_count: int = 0
    issue_count: int = 0
    error_count: int = 0
    warning_count: int = 0
    geometry_summary: BimJsonGeometrySummary = Field(default_factory=BimJsonGeometrySummary)
    issues: list[BimJsonValidationIssue] = Field(default_factory=list)


class BimJsonValidationBatchResponse(BaseModel):
    results: list[BimJsonValidationSummary] = Field(default_factory=list)
    package_count: int = 0
    total_issues: int = 0
    total_errors: int = 0
    total_warnings: int = 0
