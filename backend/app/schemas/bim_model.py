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
    coordination_stage_id: Optional[int] = Field(default=None, gt=0)
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
    coordination_stage_id: Optional[int] = Field(default=None, gt=0)
    packages: list[BimJsonImportRequest] = Field(default_factory=list)


class BimJsonImportBatchResponse(BaseModel):
    results: list[BimJsonImportResponse] = Field(default_factory=list)
    imported_count: int = 0


class BimIfcManifestRequest(BaseModel):
    coordination_stage_id: Optional[int] = Field(default=None, gt=0)
    model_name: str = Field(min_length=1, max_length=255)
    version_label: str = Field(min_length=1, max_length=50)
    source_filename: str = Field(min_length=1, max_length=255)
    artifact_path: Optional[str] = Field(default=None, max_length=500)
    discipline: Optional[str] = Field(default=None, max_length=100)
    description: Optional[str] = None
    notes: Optional[str] = None
    checksum_sha256: Optional[str] = Field(default=None, max_length=64)
    file_size_bytes: Optional[int] = Field(default=None, ge=0)
    activate: bool = False


class BimIfcManifestResponse(BaseModel):
    model_id: int
    version_id: int
    model_name: str
    version_label: str
    source_filename: str
    artifact_path: Optional[str] = None
    status: str
    activated: bool


class BimIfcTextImportRequest(BaseModel):
    coordination_stage_id: Optional[int] = Field(default=None, gt=0)
    model_name: str = Field(min_length=1, max_length=255)
    version_label: str = Field(min_length=1, max_length=50)
    source_filename: str = Field(min_length=1, max_length=255)
    ifc_text: str = Field(min_length=1)
    discipline: Optional[str] = Field(default=None, max_length=100)
    description: Optional[str] = None
    notes: Optional[str] = None
    activate: bool = True


class BimIfcTextImportResponse(BaseModel):
    model_id: int
    version_id: int
    model_name: str
    version_label: str
    source_filename: str
    checksum_sha256: str
    created_storeys: int
    created_elements: int
    parsed_entity_count: int
    parsed_ifc_classes: list[str] = Field(default_factory=list)
    activated: bool


class BimIfcFileImportResponse(BimIfcTextImportResponse):
    artifact_path: str
    file_size_bytes: int


class BimImportJobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    correlation_id: str
    project_id: int = Field(validation_alias="proyecto_id")
    company_id: int = Field(validation_alias="empresa_id")
    requested_by: Optional[int] = None
    version_id: Optional[int] = Field(default=None, validation_alias="bim_model_version_id")
    model_name: str
    version_label: str
    discipline: Optional[str] = None
    source_filename: str
    checksum_sha256: str
    file_size_bytes: int
    status: str
    stage: str
    progress: int
    attempt_count: int
    max_attempts: int
    cancellation_requested: bool
    error_code: Optional[str] = None
    error_message: Optional[str] = None
    result: Optional[dict[str, Any]] = Field(default=None, validation_alias="result_json")
    created_at: datetime = Field(validation_alias="fecha_creacion")
    started_at: Optional[datetime] = Field(default=None, validation_alias="fecha_inicio")
    finished_at: Optional[datetime] = Field(default=None, validation_alias="fecha_finalizacion")
    updated_at: Optional[datetime] = Field(default=None, validation_alias="fecha_actualizacion")


class BimIfcQualityFinding(BaseModel):
    domain: str
    severity: str
    code: str
    message: str
    entity_ref: Optional[str] = None


class BimIfcQualityReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    version_id: int = Field(validation_alias="bim_model_version_id")
    project_id: int = Field(validation_alias="proyecto_id")
    company_id: int = Field(validation_alias="empresa_id")
    contract_version: str
    source_checksum_sha256: str
    schema_identifier: Optional[str] = None
    step_status: str
    schema_status: str
    semantic_status: str
    overall_status: str
    error_count: int
    warning_count: int
    findings: list[BimIfcQualityFinding] = Field(default_factory=list)
    summary: dict[str, Any] = Field(validation_alias="summary_json")
    generated_at: datetime = Field(validation_alias="fecha_generacion")
    updated_at: Optional[datetime] = Field(default=None, validation_alias="fecha_actualizacion")


class BimViewerArtifactResponse(BaseModel):
    artifact_id: int
    version_id: int
    artifact_path: str
    artifact_type: str
    contract_version: str
    generation: int
    checksum_sha256: str
    file_size_bytes: int
    status: str
    element_count: int
    storey_count: int
    ifc_class_count: int
    property_key_count: int


class BimArtifactResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    version_id: int = Field(validation_alias="bim_model_version_id")
    project_id: int = Field(validation_alias="proyecto_id")
    company_id: int = Field(validation_alias="empresa_id")
    artifact_type: str
    contract_version: str
    generation: int
    artifact_path: str
    checksum_sha256: str
    file_size_bytes: int
    source_checksum_sha256: Optional[str] = None
    status: str
    metadata: dict[str, Any] = Field(validation_alias="metadata_json")
    created_at: datetime = Field(validation_alias="fecha_creacion")
    updated_at: Optional[datetime] = Field(default=None, validation_alias="fecha_actualizacion")


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
