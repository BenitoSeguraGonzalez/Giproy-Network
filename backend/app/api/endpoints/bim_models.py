from pathlib import Path
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse, Response
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_db
from app.models.proyecto import Proyecto
from app.models.usuario import Usuario
from app.schemas.bim_model import (
    BimIfcManifestRequest,
    BimIfcManifestResponse,
    BimIfcFileImportResponse,
    BimIfcTextImportRequest,
    BimIfcTextImportResponse,
    BimIfcQualityReportResponse,
    BimArtifactResponse,
    BimImportJobResponse,
    BimJsonImportBatchRequest,
    BimJsonImportBatchResponse,
    BimJsonImportRequest,
    BimJsonImportResponse,
    BimJsonValidationBatchResponse,
    BimModelResponse,
    BimViewerArtifactResponse,
    BimWorkspaceSummaryResponse,
)
from app.services.bim.artifact_service import generate_viewer_artifact
from app.services.bim.demo_bootstrap import bootstrap_demo_bim_project
from app.services.bim.feature_flags import resolve_bim_feature_access
from app.services.bim.import_service import (
    import_json_bim_batch,
    import_json_bim_package,
    import_ifc_file_bim_package,
    import_ifc_text_bim_package,
    register_ifc_bim_manifest,
    validate_json_bim_batch,
)
from app.services.bim.import_job_service import (
    create_bim_import_job,
    get_bim_import_job,
    list_bim_import_jobs,
    process_bim_import_job,
    request_bim_import_job_cancellation,
    retry_bim_import_job,
    serialize_bim_import_job,
)
from app.schemas.bim_version_compare import BimVersionCompareResponse
from app.schemas.bim_federation import BimFederationResponse, BimFederationSaveRequest
from app.services.bim.federation_service import get_active_federation, save_federation_revision
from app.schemas.bim_ids import (
    BimIdsExceptionRequest,
    BimIdsProfileImportRequest,
    BimIdsProfileResponse,
    BimIdsValidationResponse,
)
from app.services.bim.ids_service import (
    exempt_ids_finding,
    export_ids_validation_csv,
    get_ids_validation,
    import_ids_profile,
    list_ids_profiles,
    parse_ids,
    run_ids_validation,
)
from app.schemas.bim_issue import BimIssueAttachmentResponse, BimIssueCommentRequest, BimIssueCreateRequest, BimIssueResponse, BimIssueUpdateRequest
from app.services.bim.issue_service import MAX_ISSUE_ATTACHMENT_BYTES, add_issue_attachment, add_issue_comment, create_issue, export_issue_bcf, get_issue, get_issue_attachment, import_issue_bcf, list_issues, update_issue
from app.schemas.bim_quantity import BimQuantityCandidate, BimQuantityDecisionRequest, BimQuantityProposalCreate, BimQuantityProposalResponse
from app.services.bim.quantity_proposal_service import create_proposal, decide_proposal, quantity_candidates
from app.schemas.bim_qto import (
    BimCostEstimateCreate,
    BimCostEstimateDecision,
    BimCostEstimateResponse,
    BimQto5dPackageResponse,
    BimQtoDecisionRequest,
    BimQtoSnapshotCreate,
    BimQtoSnapshotResponse,
)
from app.services.bim.cost_estimate_service import create_cost_estimate, decide_cost_estimate, list_cost_estimates
from app.schemas.bim_cost_contract import BimCostContractCreate, BimCostContractResponse, BimCostContractTransition
from app.services.bim.cost_contract_service import create_cost_contract, list_cost_contracts, transition_cost_contract
from app.schemas.bim_cost_payment import (
    BimCostPaymentApplicationCreate,
    BimCostPaymentApplicationDecision,
    BimCostPaymentApplicationResponse,
    BimCostPaymentApplicationSubmit,
)
from app.services.bim.cost_payment_service import create_payment_application, decide_payment_application, list_payment_applications, submit_payment_application
from app.services.bim.qto_service import (
    create_qto_snapshot,
    decide_qto_snapshot,
    get_qto_5d_package,
    list_qto_snapshots,
)
from app.schemas.bim_cde import BimCdeArchiveRequest, BimCdeDocumentResponse, BimCdeRevisionResponse
from app.services.bim.cde_document_service import (
    MAX_CDE_DOCUMENT_BYTES,
    archive_document,
    create_document_revision,
    get_revision_file,
    list_document_revisions,
    list_documents,
)
from app.schemas.bim_cde_rfi import BimCdeRfiAssigneeResponse, BimCdeRfiCreate, BimCdeRfiResponse, BimCdeRfiTransition
from app.services.bim.cde_rfi_service import create_rfi, list_rfi_assignees, list_rfis, transition_rfi
from app.schemas.bim_cde_submittal import BimCdeSubmittalCreate, BimCdeSubmittalResponse, BimCdeSubmittalRevisionCreate, BimCdeSubmittalTransition
from app.services.bim.cde_submittal_service import create_submittal, create_submittal_revision, list_submittals, transition_submittal
from app.schemas.bim_cde_acl import BimCdeDocumentAclResponse, BimCdeDocumentAclSave
from app.services.bim.cde_acl_service import list_document_acl, save_document_acl
from app.schemas.bim_site_georeference import BimSiteGeoreferenceResponse, BimSiteGeoreferenceSave
from app.services.bim.site_georeference_service import get_active_site_georeference, save_site_georeference
from app.schemas.bim_cde_review import (
    BimCdeReviewCommentCreate,
    BimCdeReviewCreate,
    BimCdeReviewNotificationResponse,
    BimCdeReviewResponse,
    BimCdeReviewTransition,
)
from app.services.bim.cde_review_service import (
    add_review_comment,
    create_review,
    list_review_notifications,
    list_reviews,
    mark_review_notification_read,
    transition_review,
)
from app.schemas.bim_cde_dashboard import BimCdeDashboardResponse
from app.services.bim.cde_dashboard_service import get_cde_dashboard
from app.schemas.bim_security import BimCapabilityResponse, BimGrantRequest
from app.services.bim.capability_service import require_bim_capability, resolve_bim_capabilities, save_bim_grant
from app.services.audit_event import record_audit_event
from app.services.bim.operational_metrics import get_bim_operational_metrics
from app.schemas.bim_rollout import BimRolloutPlanRequest, BimRolloutPlanResponse
from app.services.bim.rollout_service import (
    get_rollout_plan,
    rehearse_rollout_rollback,
    save_rollout_plan,
)
from app.schemas.bim_4d import (
    Bim4dActivitySnapshotCreate,
    Bim4dActivitySnapshotResponse,
    Bim4dBaselineCreate,
    Bim4dBaselineResponse,
    Bim4dDeviationResponse,
    Bim4dLinkDecisionRequest,
    Bim4dLinkProposalCreate,
    Bim4dLinkProposalResponse,
    Bim4dProgressSnapshotCreate,
    Bim4dProgressSnapshotResponse,
    Bim4dTimelineResponse,
    Bim4dGanttResponse,
)
from app.services.bim.schedule_4d_service import (
    create_activity_snapshot,
    create_link_proposal,
    decide_link_proposal,
    list_activity_snapshots,
    list_link_proposals,
    build_timeline,
    build_plan_actual_deviation,
    create_baseline,
    create_progress_snapshot,
    list_baselines,
    build_gantt,
)
from app.schemas.bim_schedule_interop import (
    BimScheduleComparisonRequest,
    BimScheduleComparisonResponse,
    BimScheduleImportDecisionRequest,
    BimScheduleImportRevisionResponse,
    BimScheduleImportRollbackRequest,
    BimScheduleInteropCapabilitiesResponse,
    BimScheduleInterchangeDocument,
    BimScheduleImportPreviewResponse,
    BimSchedulePreflightResponse,
)
from app.services.bim.mspdi_interop_service import export_mspdi_xml, parse_mspdi_xml
from app.services.bim.p6_xml_interop_service import export_p6_xml, parse_p6_xml
from app.services.bim.schedule_interop_service import preflight_schedule_interchange
from app.services.bim.schedule_interop_capability_service import get_schedule_interop_capabilities
from app.services.bim.schedule_import_revision_service import (
    compare_schedule_interchange,
    create_import_revision,
    decide_import_revision,
    list_import_revisions,
    rollback_import_revision,
)
from app.schemas.bim_4d_planning import (
    Bim4dConstructibleComponentCreate,
    Bim4dConstructibleComponentResponse,
    Bim4dScenarioCreate,
    Bim4dScenarioResponse,
    Bim4dSpaceTimeConflictResponse,
    Bim4dWorkAreaCreate,
    Bim4dWorkAreaResponse,
)
from app.services.bim.planning_4d_service import (
    create_constructible_component,
    create_scenario,
    create_work_area,
    list_constructible_components,
    list_scenarios,
    list_work_areas,
    analyze_space_time_conflicts,
)
from app.schemas.bim_4d_productivity import Bim4dProductivityDecision, Bim4dProductivityProposalCreate, Bim4dProductivityProposalResponse
from app.services.bim.productivity_4d_service import create_productivity_proposal, decide_productivity_proposal, list_productivity_proposals
from app.schemas.bim_4d_field import Bim4dFieldEvidenceResponse, Bim4dFieldReportCreate, Bim4dFieldReportResponse
from app.services.bim.field_4d_service import add_field_evidence, create_field_report, get_field_evidence, list_field_reports
from app.schemas.bim_4d_resources import Bim4dCrewCreate, Bim4dCrewResponse, Bim4dFieldResourceMovementCreate, Bim4dFieldResourceMovementResponse, Bim4dResourceAssignmentCreate, Bim4dResourceAssignmentResponse, Bim4dResourceCreate, Bim4dResourceHistogramResponse, Bim4dResourceResponse, Bim4dTimecardCreate, Bim4dTimecardResponse
from app.services.bim.resource_4d_service import build_histogram, create_assignment, create_crew, create_field_resource_movement, create_resource, create_timecard, list_crews, list_field_resource_movements, list_resources, list_timecards
from app.schemas.bim_4d_leveling import Bim4dLevelingCreate, Bim4dLevelingDecision, Bim4dLevelingResponse
from app.services.bim.resource_leveling_service import create_leveling_scenario, decide_leveling_scenario, list_leveling_scenarios
from app.services.bim.report_4d_service import build_report, report_csv
from app.schemas.bim_4d_partition import Bim4dPartitionArtifactResponse, Bim4dPartitionCsgArtifactCreate, Bim4dPartitionCsgArtifactResponse, Bim4dPartitionSpecCreate, Bim4dPartitionSpecResponse
from app.services.bim.partition_4d_service import create_partition_csg_artifact, create_partition_spec, delete_partition_spec, get_partition_artifact, list_partition_csg_artifacts, list_partition_specs, materialize_partition
from app.schemas.bim_4d_equipment import Bim4dEquipmentConflictResponse, Bim4dEquipmentCreate, Bim4dEquipmentMotionCreate, Bim4dEquipmentMotionResponse, Bim4dEquipmentPlaybackResponse, Bim4dEquipmentResponse
from app.services.bim.equipment_4d_service import conflicts as equipment_conflicts, create_equipment, create_motion_plan, list_equipment, list_motion_plans, playback as equipment_playback
from app.schemas.bim_4d_safety import Bim4dSafetyExposureResponse, Bim4dSafetyInspectionCreate, Bim4dSafetyInspectionResponse, Bim4dSafetyPunchCreate, Bim4dSafetyPunchResponse, Bim4dSafetyPunchUpdate, Bim4dSafetyRiskCreate, Bim4dSafetyRiskResponse
from app.services.bim.safety_4d_service import add_inspection as add_safety_inspection, create_punch_item as create_safety_punch_item, create_risk as create_safety_risk, evaluate_exposure as evaluate_safety_exposure, list_inspections as list_safety_inspections, list_punch_items as list_safety_punch_items, list_risks as list_safety_risks, update_punch_item as update_safety_punch_item
from app.schemas.bim_4d_event import Bim4dUnplannedEventCreate, Bim4dUnplannedEventDecision, Bim4dUnplannedEventResponse
from app.services.bim.unplanned_event_service import create_event as create_unplanned_event, decide_event as decide_unplanned_event, list_events as list_unplanned_events
from app.services.bim.version_compare_service import compare_bim_versions
from app.services.bim.ifc_quality_service import (
    generate_ifc_quality_report,
    get_ifc_quality_report,
    serialize_ifc_quality_report,
)
from app.services.bim.artifact_registry import (
    get_artifact,
    list_artifacts,
    rollback_artifact,
    serialize_artifact,
    store_artifact_bytes,
    validate_artifact,
)
from app.services.bim.model_registry import get_workspace_summary, list_models_for_project

router = APIRouter()


def _raise_if_json_validation_has_errors(validation: BimJsonValidationBatchResponse) -> None:
    if validation.total_errors <= 0:
        return

    raise HTTPException(
        status_code=400,
        detail={
            "message": "El paquete BIM contiene errores de validacion y no puede importarse.",
            "total_errors": validation.total_errors,
            "total_warnings": validation.total_warnings,
            "results": [result.model_dump() for result in validation.results],
        },
    )


def _resolve_project(db: Session, project_id: int, current_user: Usuario, empresa_id: Optional[int]) -> Proyecto:
    resolved_company_id = current_user.empresa_id
    if current_user.rol.lower() == "superadministrador" and empresa_id:
        resolved_company_id = empresa_id

    project = (
        db.query(Proyecto)
        .filter(Proyecto.id == project_id, Proyecto.empresa_id == resolved_company_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado para el contexto BIM.")
    return project


@router.get("/projects/{project_id}/workspace", response_model=BimWorkspaceSummaryResponse)
def get_bim_workspace(
    project_id: int,
    empresa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    access = resolve_bim_feature_access(
        db=db,
        user_id=current_user.id,
        company_id=project.empresa_id,
        role=current_user.rol,
    )
    if not access.enabled:
        raise HTTPException(status_code=403, detail="La capa BIM no está habilitada para este contexto.")

    return get_workspace_summary(db, project_id=project.id, company_id=project.empresa_id)


@router.get("/projects/{project_id}/models", response_model=list[BimModelResponse])
def list_bim_models(
    project_id: int,
    empresa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    access = resolve_bim_feature_access(
        db=db,
        user_id=current_user.id,
        company_id=project.empresa_id,
        role=current_user.rol,
    )
    if not access.enabled:
        raise HTTPException(status_code=403, detail="La capa BIM no está habilitada para este contexto.")

    models = list_models_for_project(db, project_id=project.id, company_id=project.empresa_id)
    return [BimModelResponse.model_validate(model, from_attributes=True) for model in models]


@router.get("/projects/{project_id}/versions/compare", response_model=BimVersionCompareResponse)
def compare_project_bim_versions(
    project_id: int,
    base_version_id: int,
    target_version_id: int,
    empresa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    access = resolve_bim_feature_access(
        db=db,
        user_id=current_user.id,
        company_id=project.empresa_id,
        role=current_user.rol,
    )
    if not access.enabled:
        raise HTTPException(status_code=403, detail="La capa BIM no esta habilitada para este contexto.")
    return compare_bim_versions(
        db,
        project_id=project.id,
        company_id=project.empresa_id,
        base_version_id=base_version_id,
        target_version_id=target_version_id,
    )


@router.get("/projects/{project_id}/federation", response_model=BimFederationResponse | None)
def get_project_bim_federation(
    project_id: int,
    empresa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    access = resolve_bim_feature_access(db=db, user_id=current_user.id, company_id=project.empresa_id, role=current_user.rol)
    if not access.enabled:
        raise HTTPException(status_code=403, detail="La capa BIM no esta habilitada para este contexto.")
    return get_active_federation(db, project_id=project.id, company_id=project.empresa_id)


@router.put("/projects/{project_id}/federation", response_model=BimFederationResponse)
def save_project_bim_federation(
    project_id: int,
    payload: BimFederationSaveRequest,
    empresa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    access = resolve_bim_feature_access(db=db, user_id=current_user.id, company_id=project.empresa_id, role=current_user.rol)
    if not access.enabled:
        raise HTTPException(status_code=403, detail="La capa BIM no esta habilitada para este contexto.")
    require_bim_capability(db, user_id=current_user.id, company_id=project.empresa_id, role=current_user.rol, capability="bim.coordinate")
    return save_federation_revision(
        db,
        project_id=project.id,
        company_id=project.empresa_id,
        user_id=current_user.id,
        payload=payload,
    )


@router.get("/projects/{project_id}/site-georeference", response_model=BimSiteGeoreferenceResponse | None)
def get_project_bim_site_georeference(
    project_id: int,
    empresa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    access = resolve_bim_feature_access(db=db, user_id=current_user.id, company_id=project.empresa_id, role=current_user.rol)
    if not access.enabled:
        raise HTTPException(status_code=403, detail="La capa BIM no esta habilitada para este contexto.")
    return get_active_site_georeference(db, project_id=project.id, company_id=project.empresa_id)


@router.put("/projects/{project_id}/site-georeference", response_model=BimSiteGeoreferenceResponse)
def save_project_bim_site_georeference(
    project_id: int,
    payload: BimSiteGeoreferenceSave,
    empresa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    access = resolve_bim_feature_access(db=db, user_id=current_user.id, company_id=project.empresa_id, role=current_user.rol)
    if not access.enabled:
        raise HTTPException(status_code=403, detail="La capa BIM no esta habilitada para este contexto.")
    require_bim_capability(db, user_id=current_user.id, company_id=project.empresa_id, role=current_user.rol, capability="bim.coordinate")
    return save_site_georeference(
        db,
        project_id=project.id,
        company_id=project.empresa_id,
        project_root_code=project.codigo_root,
        project_revision=project.revision or 0,
        user_id=current_user.id,
        payload=payload,
    )


@router.get("/projects/{project_id}/cde/reviews", response_model=list[BimCdeReviewResponse])
def list_project_bim_cde_reviews(project_id: int, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    access = resolve_bim_feature_access(db=db, user_id=current_user.id, company_id=project.empresa_id, role=current_user.rol)
    if not access.enabled:
        raise HTTPException(status_code=403, detail="La capa BIM no esta habilitada para este contexto.")
    return list_reviews(db, project_id=project.id, company_id=project.empresa_id, user_id=current_user.id, can_override=current_user.rol.lower() == "superadministrador")


@router.post("/projects/{project_id}/cde/reviews", response_model=BimCdeReviewResponse, status_code=status.HTTP_201_CREATED)
def create_project_bim_cde_review(project_id: int, payload: BimCdeReviewCreate, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    access = resolve_bim_feature_access(db=db, user_id=current_user.id, company_id=project.empresa_id, role=current_user.rol)
    if not access.enabled:
        raise HTTPException(status_code=403, detail="La capa BIM no esta habilitada para este contexto.")
    require_bim_capability(db, user_id=current_user.id, company_id=project.empresa_id, role=current_user.rol, capability="bim.coordinate")
    return create_review(db, project_id=project.id, company_id=project.empresa_id, user_id=current_user.id, payload=payload)


@router.post("/projects/{project_id}/cde/reviews/{review_id}/comments", response_model=BimCdeReviewResponse)
def comment_project_bim_cde_review(project_id: int, review_id: int, payload: BimCdeReviewCommentCreate, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    access = resolve_bim_feature_access(db=db, user_id=current_user.id, company_id=project.empresa_id, role=current_user.rol)
    if not access.enabled:
        raise HTTPException(status_code=403, detail="La capa BIM no esta habilitada para este contexto.")
    require_bim_capability(db, user_id=current_user.id, company_id=project.empresa_id, role=current_user.rol, capability="bim.coordinate")
    return add_review_comment(db, review_id=review_id, project_id=project.id, company_id=project.empresa_id, user_id=current_user.id, can_override=current_user.rol.lower() == "superadministrador", payload=payload)


@router.post("/projects/{project_id}/cde/reviews/{review_id}/transition", response_model=BimCdeReviewResponse)
def transition_project_bim_cde_review(project_id: int, review_id: int, payload: BimCdeReviewTransition, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    access = resolve_bim_feature_access(db=db, user_id=current_user.id, company_id=project.empresa_id, role=current_user.rol)
    if not access.enabled:
        raise HTTPException(status_code=403, detail="La capa BIM no esta habilitada para este contexto.")
    require_bim_capability(db, user_id=current_user.id, company_id=project.empresa_id, role=current_user.rol, capability="bim.coordinate")
    return transition_review(db, review_id=review_id, project_id=project.id, company_id=project.empresa_id, user_id=current_user.id, can_override=current_user.rol.lower() == "superadministrador", payload=payload)


@router.get("/projects/{project_id}/cde/review-notifications", response_model=list[BimCdeReviewNotificationResponse])
def list_project_bim_cde_review_notifications(project_id: int, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    access = resolve_bim_feature_access(db=db, user_id=current_user.id, company_id=project.empresa_id, role=current_user.rol)
    if not access.enabled:
        raise HTTPException(status_code=403, detail="La capa BIM no esta habilitada para este contexto.")
    return list_review_notifications(db, project_id=project.id, company_id=project.empresa_id, user_id=current_user.id)


@router.post("/projects/{project_id}/cde/review-notifications/{notification_id}/read", response_model=BimCdeReviewNotificationResponse)
def read_project_bim_cde_review_notification(project_id: int, notification_id: int, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    access = resolve_bim_feature_access(db=db, user_id=current_user.id, company_id=project.empresa_id, role=current_user.rol)
    if not access.enabled:
        raise HTTPException(status_code=403, detail="La capa BIM no esta habilitada para este contexto.")
    return mark_review_notification_read(db, notification_id=notification_id, project_id=project.id, company_id=project.empresa_id, user_id=current_user.id)


@router.get("/projects/{project_id}/ids/profiles", response_model=list[BimIdsProfileResponse])
def list_project_ids_profiles(project_id: int, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    access = resolve_bim_feature_access(db=db, user_id=current_user.id, company_id=project.empresa_id, role=current_user.rol)
    if not access.enabled:
        raise HTTPException(status_code=403, detail="La capa BIM no esta habilitada para este contexto.")
    profiles = list_ids_profiles(db, project_id=project.id, company_id=project.empresa_id)
    return [BimIdsProfileResponse(id=item.id, name=item.name, source_filename=item.source_filename, ids_version=item.ids_version, checksum_sha256=item.checksum_sha256, specification_count=len({req.specification_name for req in parse_ids(item.xml_content)[1]}), created_at=item.fecha_creacion) for item in profiles]


@router.post("/projects/{project_id}/ids/profiles", response_model=BimIdsProfileResponse)
def import_project_ids_profile(project_id: int, payload: BimIdsProfileImportRequest, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    access = resolve_bim_feature_access(db=db, user_id=current_user.id, company_id=project.empresa_id, role=current_user.rol)
    if not access.enabled:
        raise HTTPException(status_code=403, detail="La capa BIM no esta habilitada para este contexto.")
    require_bim_capability(db, user_id=current_user.id, company_id=project.empresa_id, role=current_user.rol, capability="bim.coordinate")
    profile, count = import_ids_profile(db, project_id=project.id, company_id=project.empresa_id, user_id=current_user.id, payload=payload)
    return BimIdsProfileResponse(id=profile.id, name=profile.name, source_filename=profile.source_filename, ids_version=profile.ids_version, checksum_sha256=profile.checksum_sha256, specification_count=count, created_at=profile.fecha_creacion)


@router.post("/projects/{project_id}/versions/{version_id}/ids/{profile_id}/validate", response_model=BimIdsValidationResponse)
def validate_project_version_ids(project_id: int, version_id: int, profile_id: int, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    access = resolve_bim_feature_access(db=db, user_id=current_user.id, company_id=project.empresa_id, role=current_user.rol)
    if not access.enabled:
        raise HTTPException(status_code=403, detail="La capa BIM no esta habilitada para este contexto.")
    return run_ids_validation(db, profile_id=profile_id, version_id=version_id, project_id=project.id, company_id=project.empresa_id, user_id=current_user.id)


@router.post("/projects/{project_id}/ids/findings/{finding_id}/exception", response_model=BimIdsValidationResponse)
def exempt_project_ids_finding(project_id: int, finding_id: int, payload: BimIdsExceptionRequest, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    access = resolve_bim_feature_access(db=db, user_id=current_user.id, company_id=project.empresa_id, role=current_user.rol)
    if not access.enabled:
        raise HTTPException(status_code=403, detail="La capa BIM no esta habilitada para este contexto.")
    require_bim_capability(db, user_id=current_user.id, company_id=project.empresa_id, role=current_user.rol, capability="bim.coordinate")
    return exempt_ids_finding(db, finding_id=finding_id, project_id=project.id, company_id=project.empresa_id, user_id=current_user.id, reason=payload.reason)


@router.get("/projects/{project_id}/ids/validations/{validation_id}.csv")
def export_project_ids_validation(project_id: int, validation_id: int, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    access = resolve_bim_feature_access(db=db, user_id=current_user.id, company_id=project.empresa_id, role=current_user.rol)
    if not access.enabled:
        raise HTTPException(status_code=403, detail="La capa BIM no esta habilitada para este contexto.")
    validation = get_ids_validation(db, validation_id=validation_id, project_id=project.id, company_id=project.empresa_id)
    return Response(content=export_ids_validation_csv(validation), media_type="text/csv; charset=utf-8", headers={"Content-Disposition": f'attachment; filename="bim-ids-validation-{validation_id}.csv"'})


def _require_bim_access(db, project, current_user, capability="bim.view"):
    access = resolve_bim_feature_access(db=db, user_id=current_user.id, company_id=project.empresa_id, role=current_user.rol)
    if not access.enabled:
        raise HTTPException(status_code=403, detail="La capa BIM no esta habilitada para este contexto.")
    require_bim_capability(db, user_id=current_user.id, company_id=project.empresa_id, role=current_user.rol, capability=capability)


@router.get("/projects/{project_id}/cde/dashboard", response_model=BimCdeDashboardResponse)
def get_project_bim_cde_dashboard(project_id: int, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    _require_bim_access(db, project, current_user, "bim.review")
    can_override = current_user.rol.lower() == "superadministrador"
    return get_cde_dashboard(
        db,
        project_id=project.id,
        company_id=project.empresa_id,
        user_id=current_user.id,
        requester_role=current_user.rol,
        can_override=can_override,
    )


@router.get("/projects/{project_id}/cde/rfi-assignees", response_model=list[BimCdeRfiAssigneeResponse])
def list_project_bim_cde_rfi_assignees(project_id: int, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    _require_bim_access(db, project, current_user, "bim.review")
    return list_rfi_assignees(db, company_id=project.empresa_id)


@router.get("/projects/{project_id}/cde/rfis", response_model=list[BimCdeRfiResponse])
def list_project_bim_cde_rfis(project_id: int, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    _require_bim_access(db, project, current_user, "bim.review")
    return list_rfis(db, project_id=project.id, company_id=project.empresa_id)


@router.post("/projects/{project_id}/cde/rfis", response_model=BimCdeRfiResponse, status_code=status.HTTP_201_CREATED)
def create_project_bim_cde_rfi(project_id: int, payload: BimCdeRfiCreate, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    _require_bim_access(db, project, current_user, "bim.review")
    return create_rfi(db, project_id=project.id, company_id=project.empresa_id, user_id=current_user.id, payload=payload)


@router.post("/projects/{project_id}/cde/rfis/{rfi_id}/transition", response_model=BimCdeRfiResponse)
def transition_project_bim_cde_rfi(project_id: int, rfi_id: int, payload: BimCdeRfiTransition, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    _require_bim_access(db, project, current_user, "bim.review")
    return transition_rfi(db, rfi_id=rfi_id, project_id=project.id, company_id=project.empresa_id, user_id=current_user.id, can_override=current_user.rol.lower() == "superadministrador", payload=payload)


@router.get("/projects/{project_id}/cde/submittals", response_model=list[BimCdeSubmittalResponse])
def list_project_bim_cde_submittals(project_id: int, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    _require_bim_access(db, project, current_user, "bim.review")
    return list_submittals(db, project_id=project.id, company_id=project.empresa_id)


@router.post("/projects/{project_id}/cde/submittals", response_model=BimCdeSubmittalResponse, status_code=status.HTTP_201_CREATED)
def create_project_bim_cde_submittal(project_id: int, payload: BimCdeSubmittalCreate, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    _require_bim_access(db, project, current_user, "bim.review")
    return create_submittal(db, project_id=project.id, company_id=project.empresa_id, user_id=current_user.id, payload=payload)


@router.post("/projects/{project_id}/cde/submittals/{submittal_id}/revisions", response_model=BimCdeSubmittalResponse, status_code=status.HTTP_201_CREATED)
def create_project_bim_cde_submittal_revision(project_id: int, submittal_id: int, payload: BimCdeSubmittalRevisionCreate, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    _require_bim_access(db, project, current_user, "bim.review")
    return create_submittal_revision(db, submittal_id=submittal_id, project_id=project.id, company_id=project.empresa_id, user_id=current_user.id, can_override=current_user.rol.lower() == "superadministrador", payload=payload)


@router.post("/projects/{project_id}/cde/submittals/{submittal_id}/transition", response_model=BimCdeSubmittalResponse)
def transition_project_bim_cde_submittal(project_id: int, submittal_id: int, payload: BimCdeSubmittalTransition, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    _require_bim_access(db, project, current_user, "bim.review")
    return transition_submittal(db, submittal_id=submittal_id, project_id=project.id, company_id=project.empresa_id, user_id=current_user.id, can_override=current_user.rol.lower() == "superadministrador", payload=payload)


@router.get("/projects/{project_id}/cde/documents", response_model=list[BimCdeDocumentResponse])
def list_project_bim_cde_documents(
    project_id: int,
    include_archived: bool = False,
    empresa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    _require_bim_access(db, project, current_user, "bim.view")
    return list_documents(db, project_id=project.id, company_id=project.empresa_id, include_archived=include_archived, requester_id=current_user.id, requester_role=current_user.rol)


@router.get("/projects/{project_id}/cde/acl-users", response_model=list[BimCdeRfiAssigneeResponse])
def list_project_bim_cde_acl_users(project_id: int, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    _require_bim_access(db, project, current_user, "bim.coordinate")
    return list_rfi_assignees(db, company_id=project.empresa_id)


@router.post("/projects/{project_id}/cde/documents", response_model=BimCdeDocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_project_bim_cde_document(
    project_id: int,
    document_code: str = Form(...),
    title: str = Form(...),
    category: str = Form(...),
    version_label: str = Form(...),
    notes: str = Form(""),
    file: UploadFile = File(...),
    empresa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    _require_bim_access(db, project, current_user, "bim.coordinate")
    content = await file.read(MAX_CDE_DOCUMENT_BYTES + 1)
    try:
        document = create_document_revision(
            db,
            project_id=project.id,
            company_id=project.empresa_id,
            user_id=current_user.id,
            document_code=document_code,
            title=title,
            category=category,
            version_label=version_label,
            notes=notes,
            source_filename=file.filename or "document.bin",
            media_type=file.content_type,
            content=content,
            requester_role=current_user.rol,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    record_audit_event(db, module="bim", event_type="bim_cde_document_revision_created", message="Revision documental CDE BIM registrada.", actor=current_user, empresa_id=project.empresa_id, entity_type="bim_cde_document", entity_id=document["id"], payload={"document_code": document["document_code"], "revision": document["current_revision"]})
    return document


@router.get("/projects/{project_id}/cde/documents/{document_id}/revisions", response_model=list[BimCdeRevisionResponse])
def list_project_bim_cde_document_revisions(
    project_id: int,
    document_id: int,
    empresa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    _require_bim_access(db, project, current_user, "bim.view")
    return list_document_revisions(db, document_id=document_id, project_id=project.id, company_id=project.empresa_id, requester_id=current_user.id, requester_role=current_user.rol)


@router.get("/projects/{project_id}/cde/revisions/{revision_id}/content")
def download_project_bim_cde_revision(
    project_id: int,
    revision_id: int,
    empresa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    _require_bim_access(db, project, current_user, "bim.view")
    revision, path = get_revision_file(db, revision_id=revision_id, project_id=project.id, company_id=project.empresa_id, requester_id=current_user.id, requester_role=current_user.rol)
    return FileResponse(path, filename=revision.source_filename, media_type=revision.media_type, headers={"X-BIM-CDE-Checksum": revision.checksum_sha256})


@router.post("/projects/{project_id}/cde/documents/{document_id}/archive", response_model=BimCdeDocumentResponse)
def archive_project_bim_cde_document(
    project_id: int,
    document_id: int,
    payload: BimCdeArchiveRequest,
    empresa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    _require_bim_access(db, project, current_user, "bim.coordinate")
    document = archive_document(db, document_id=document_id, project_id=project.id, company_id=project.empresa_id, requester_id=current_user.id, requester_role=current_user.rol)
    record_audit_event(db, module="bim", event_type="bim_cde_document_archived", message="Documento CDE BIM archivado.", actor=current_user, empresa_id=project.empresa_id, entity_type="bim_cde_document", entity_id=document_id, payload={"reason": payload.reason})
    return document


@router.get("/projects/{project_id}/cde/documents/{document_id}/acl", response_model=list[BimCdeDocumentAclResponse])
def list_project_bim_cde_document_acl(project_id: int, document_id: int, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    _require_bim_access(db, project, current_user, "bim.coordinate")
    return list_document_acl(db, document_id=document_id, project_id=project.id, company_id=project.empresa_id, requester_id=current_user.id, requester_role=current_user.rol)


@router.put("/projects/{project_id}/cde/documents/{document_id}/acl", response_model=BimCdeDocumentAclResponse)
def save_project_bim_cde_document_acl(project_id: int, document_id: int, payload: BimCdeDocumentAclSave, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    _require_bim_access(db, project, current_user, "bim.coordinate")
    grant = save_document_acl(db, document_id=document_id, project_id=project.id, company_id=project.empresa_id, requester_id=current_user.id, requester_role=current_user.rol, payload=payload)
    record_audit_event(db, module="bim", event_type="bim_cde_document_acl_saved", message="ACL documental CDE BIM actualizada.", actor=current_user, empresa_id=project.empresa_id, entity_type="bim_cde_document", entity_id=document_id, payload={"user_id": payload.user_id, "active": payload.active})
    return grant


@router.get("/projects/{project_id}/issues", response_model=list[BimIssueResponse])
def list_project_bim_issues(project_id: int, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user)
    return list_issues(db, project_id=project.id, company_id=project.empresa_id)


@router.post("/projects/{project_id}/issues", response_model=BimIssueResponse)
def create_project_bim_issue(project_id: int, payload: BimIssueCreateRequest, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.review")
    return create_issue(db, project_id=project.id, company_id=project.empresa_id, user_id=current_user.id, payload=payload)


@router.patch("/projects/{project_id}/issues/{issue_id}", response_model=BimIssueResponse)
def update_project_bim_issue(project_id: int, issue_id: int, payload: BimIssueUpdateRequest, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.review")
    return update_issue(db, issue_id=issue_id, project_id=project.id, company_id=project.empresa_id, user_id=current_user.id, payload=payload)


@router.post("/projects/{project_id}/issues/{issue_id}/comments", response_model=BimIssueResponse)
def comment_project_bim_issue(project_id: int, issue_id: int, payload: BimIssueCommentRequest, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.review")
    return add_issue_comment(db, issue_id=issue_id, project_id=project.id, company_id=project.empresa_id, user_id=current_user.id, body=payload.body)


@router.post("/projects/{project_id}/issues/{issue_id}/attachments", response_model=BimIssueAttachmentResponse)
async def upload_project_bim_issue_attachment(project_id: int, issue_id: int, file: UploadFile = File(...), empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.review")
    attachment = add_issue_attachment(db, issue_id=issue_id, project_id=project.id, company_id=project.empresa_id, user_id=current_user.id, filename=file.filename or "evidencia", content_type=file.content_type or "application/octet-stream", content=await file.read(MAX_ISSUE_ATTACHMENT_BYTES + 1))
    record_audit_event(db, module="bim", event_type="bim_issue_attachment_added", message="Evidencia fotografica agregada a incidencia BIM.", actor=current_user, empresa_id=project.empresa_id, entity_type="bim_issue", entity_id=issue_id, payload={"attachment_id": attachment.id, "checksum_sha256": attachment.checksum_sha256})
    return attachment


@router.get("/projects/{project_id}/issues/{issue_id}/attachments/{attachment_id}/content")
def download_project_bim_issue_attachment(project_id: int, issue_id: int, attachment_id: int, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user)
    attachment = get_issue_attachment(db, attachment_id=attachment_id, issue_id=issue_id, project_id=project.id, company_id=project.empresa_id)
    return Response(content=attachment.content, media_type=attachment.content_type, headers={"Content-Disposition": "inline", "X-Content-Type-Options": "nosniff"})


@router.get("/projects/{project_id}/issues/{issue_id}.bcf")
def export_project_bim_issue(project_id: int, issue_id: int, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user)
    issue = get_issue(db, issue_id=issue_id, project_id=project.id, company_id=project.empresa_id)
    return Response(content=export_issue_bcf(issue), media_type="application/zip", headers={"Content-Disposition": f'attachment; filename="{issue.topic_guid}.bcf"'})


@router.post("/projects/{project_id}/issues/import-bcf", response_model=BimIssueResponse)
async def import_project_bim_issue(project_id: int, file: UploadFile = File(...), version_id: Optional[int] = Form(None), empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user)
    return import_issue_bcf(db, content=await file.read(), project_id=project.id, company_id=project.empresa_id, user_id=current_user.id, version_id=version_id)


@router.get("/projects/{project_id}/elements/{element_id}/quantity-candidates", response_model=list[BimQuantityCandidate])
def get_project_bim_quantity_candidates(project_id: int, element_id: int, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user)
    return quantity_candidates(db, element_id=element_id, project_id=project.id, company_id=project.empresa_id)[1]


@router.post("/projects/{project_id}/quantity-proposals", response_model=BimQuantityProposalResponse)
def create_project_bim_quantity_proposal(project_id: int, payload: BimQuantityProposalCreate, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.review")
    return create_proposal(db, project_id=project.id, company_id=project.empresa_id, user_id=current_user.id, payload=payload)


@router.post("/projects/{project_id}/quantity-proposals/{proposal_id}/decision", response_model=BimQuantityProposalResponse)
def decide_project_bim_quantity_proposal(project_id: int, proposal_id: int, payload: BimQuantityDecisionRequest, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.coordinate")
    return decide_proposal(db, proposal_id=proposal_id, project_id=project.id, company_id=project.empresa_id, user_id=current_user.id, decision=payload.decision, reason=payload.reason)


@router.post(
    "/projects/{project_id}/qto-snapshots",
    response_model=BimQtoSnapshotResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_project_bim_qto_snapshot(
    project_id: int,
    payload: BimQtoSnapshotCreate,
    empresa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    _require_bim_access(db, project, current_user, "bim.review")
    try:
        return create_qto_snapshot(
            db,
            project_id=project.id,
            company_id=project.empresa_id,
            user_id=current_user.id,
            payload=payload,
        )
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.get(
    "/projects/{project_id}/qto-snapshots",
    response_model=list[BimQtoSnapshotResponse],
)
def list_project_bim_qto_snapshots(
    project_id: int,
    version_id: Optional[int] = None,
    empresa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    _require_bim_access(db, project, current_user, "bim.view")
    return list_qto_snapshots(
        db,
        project_id=project.id,
        company_id=project.empresa_id,
        version_id=version_id,
    )


@router.post(
    "/projects/{project_id}/qto-snapshots/{snapshot_id}/decision",
    response_model=BimQtoSnapshotResponse,
)
def decide_project_bim_qto_snapshot(
    project_id: int,
    snapshot_id: int,
    payload: BimQtoDecisionRequest,
    empresa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    _require_bim_access(db, project, current_user, "bim.coordinate")
    try:
        return decide_qto_snapshot(
            db,
            snapshot_id=snapshot_id,
            project_id=project.id,
            company_id=project.empresa_id,
            user_id=current_user.id,
            decision=payload.decision,
            reason=payload.reason,
            expected_lock_version=payload.expected_lock_version,
        )
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.get(
    "/projects/{project_id}/qto-snapshots/{snapshot_id}/5d-package",
    response_model=BimQto5dPackageResponse,
)
def get_project_bim_qto_5d_package(
    project_id: int,
    snapshot_id: int,
    empresa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    _require_bim_access(db, project, current_user, "bim.view")
    try:
        return get_qto_5d_package(
            db,
            snapshot_id=snapshot_id,
            project_id=project.id,
            company_id=project.empresa_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.get("/projects/{project_id}/cost-estimates", response_model=list[BimCostEstimateResponse])
def list_project_bim_cost_estimates(project_id: int, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.view")
    return list_cost_estimates(db, project_id=project.id, company_id=project.empresa_id)


@router.post("/projects/{project_id}/cost-estimates", response_model=BimCostEstimateResponse, status_code=status.HTTP_201_CREATED)
def create_project_bim_cost_estimate(project_id: int, payload: BimCostEstimateCreate, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.review")
    return create_cost_estimate(db, project_id=project.id, company_id=project.empresa_id, user_id=current_user.id, payload=payload)


@router.post("/projects/{project_id}/cost-estimates/{estimate_id}/decision", response_model=BimCostEstimateResponse)
def decide_project_bim_cost_estimate(project_id: int, estimate_id: int, payload: BimCostEstimateDecision, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.coordinate")
    return decide_cost_estimate(db, estimate_id=estimate_id, project_id=project.id, company_id=project.empresa_id, user_id=current_user.id, payload=payload)


@router.get("/projects/{project_id}/cost-contracts", response_model=list[BimCostContractResponse])
def list_project_bim_cost_contracts(project_id: int, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.view")
    return list_cost_contracts(db, project_id=project.id, company_id=project.empresa_id)


@router.post("/projects/{project_id}/cost-contracts", response_model=BimCostContractResponse, status_code=status.HTTP_201_CREATED)
def create_project_bim_cost_contract(project_id: int, payload: BimCostContractCreate, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.review")
    return create_cost_contract(db, project_id=project.id, company_id=project.empresa_id, user_id=current_user.id, payload=payload)


@router.post("/projects/{project_id}/cost-contracts/{contract_id}/transition", response_model=BimCostContractResponse)
def transition_project_bim_cost_contract(project_id: int, contract_id: int, payload: BimCostContractTransition, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.coordinate")
    return transition_cost_contract(db, contract_id=contract_id, project_id=project.id, company_id=project.empresa_id, user_id=current_user.id, payload=payload)


@router.get("/projects/{project_id}/payment-applications", response_model=list[BimCostPaymentApplicationResponse])
def list_project_bim_payment_applications(project_id: int, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.view")
    return list_payment_applications(db, project_id=project.id, company_id=project.empresa_id)


@router.post("/projects/{project_id}/payment-applications", response_model=BimCostPaymentApplicationResponse, status_code=status.HTTP_201_CREATED)
def create_project_bim_payment_application(project_id: int, payload: BimCostPaymentApplicationCreate, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.review")
    return create_payment_application(db, project_id=project.id, company_id=project.empresa_id, user_id=current_user.id, payload=payload)


@router.post("/projects/{project_id}/payment-applications/{application_id}/submit", response_model=BimCostPaymentApplicationResponse)
def submit_project_bim_payment_application(project_id: int, application_id: int, payload: BimCostPaymentApplicationSubmit, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.review")
    return submit_payment_application(db, application_id=application_id, project_id=project.id, company_id=project.empresa_id, user_id=current_user.id, payload=payload)


@router.post("/projects/{project_id}/payment-applications/{application_id}/decision", response_model=BimCostPaymentApplicationResponse)
def decide_project_bim_payment_application(project_id: int, application_id: int, payload: BimCostPaymentApplicationDecision, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.coordinate")
    return decide_payment_application(db, application_id=application_id, project_id=project.id, company_id=project.empresa_id, user_id=current_user.id, payload=payload)


@router.get("/projects/{project_id}/capabilities", response_model=BimCapabilityResponse)
def get_project_bim_capabilities(project_id: int, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project=_resolve_project(db,project_id,current_user,empresa_id);_require_bim_access(db,project,current_user)
    return {"capabilities":sorted(resolve_bim_capabilities(db,user_id=current_user.id,company_id=project.empresa_id,role=current_user.rol))}


@router.put("/projects/{project_id}/capability-grants/{user_id}", response_model=BimCapabilityResponse)
def put_project_bim_capability_grant(project_id:int,user_id:int,payload:BimGrantRequest,empresa_id:Optional[int]=None,db:Session=Depends(get_db),current_user:Usuario=Depends(get_current_active_user)):
    project=_resolve_project(db,project_id,current_user,empresa_id);_require_bim_access(db,project,current_user,"bim.admin")
    grant=save_bim_grant(db,company_id=project.empresa_id,user_id=user_id,capabilities=payload.capabilities,granted_by=current_user.id)
    record_audit_event(db,module="bim",event_type="bim_capabilities_updated",message="Capacidades BIM actualizadas.",actor=current_user,empresa_id=project.empresa_id,entity_type="bim_access_grant",entity_id=grant.id,payload={"target_user_id":user_id,"capabilities":grant.capabilities_json})
    return {"capabilities":grant.capabilities_json}


@router.get("/projects/{project_id}/operational-metrics")
def get_project_bim_operational_metrics(project_id:int,empresa_id:Optional[int]=None,db:Session=Depends(get_db),current_user:Usuario=Depends(get_current_active_user)):
    project=_resolve_project(db,project_id,current_user,empresa_id);_require_bim_access(db,project,current_user,"bim.admin")
    return get_bim_operational_metrics(db,project_id=project.id,company_id=project.empresa_id)


@router.get("/projects/{project_id}/rollout", response_model=BimRolloutPlanResponse | None)
def get_project_bim_rollout(project_id: int, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    _require_bim_access(db, project, current_user, "bim.admin")
    return get_rollout_plan(db, company_id=project.empresa_id)


@router.put("/projects/{project_id}/rollout", response_model=BimRolloutPlanResponse)
def put_project_bim_rollout(project_id: int, payload: BimRolloutPlanRequest, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    _require_bim_access(db, project, current_user, "bim.admin")
    result = save_rollout_plan(db, company_id=project.empresa_id, user_id=current_user.id, payload=payload)
    record_audit_event(
        db,
        module="bim",
        event_type="bim_rollout_updated",
        message="Plan de rollout BIM actualizado.",
        actor=current_user,
        empresa_id=project.empresa_id,
        entity_type="bim_rollout_plan",
        entity_id=result["id"],
        payload={"stage": result["stage"], "status": result["status"], "ready_for_activation": result["ready_for_activation"]},
    )
    return result


@router.post("/projects/{project_id}/rollout/rehearse-rollback", response_model=BimRolloutPlanResponse)
def rehearse_project_bim_rollout_rollback(project_id: int, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    _require_bim_access(db, project, current_user, "bim.admin")
    result = rehearse_rollout_rollback(db, company_id=project.empresa_id, user_id=current_user.id)
    record_audit_event(
        db,
        module="bim",
        event_type="bim_rollout_rollback_rehearsed",
        message="Rollback BIM ensayado.",
        actor=current_user,
        empresa_id=project.empresa_id,
        entity_type="bim_rollout_plan",
        entity_id=result["id"],
        payload={"stage": result["stage"], "ready_for_activation": result["ready_for_activation"]},
    )
    return result


@router.get("/projects/{project_id}/4d/activities", response_model=list[Bim4dActivitySnapshotResponse])
def list_project_bim_4d_activities(project_id: int, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    _require_bim_access(db, project, current_user, "bim.schedule.view")
    return list_activity_snapshots(db, project_id=project.id, company_id=project.empresa_id)


@router.post(
    "/projects/{project_id}/4d/schedule-interchange/preflight",
    response_model=BimSchedulePreflightResponse,
)
def preflight_project_bim_schedule_interchange(
    project_id: int,
    payload: BimScheduleInterchangeDocument,
    empresa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    _require_bim_access(db, project, current_user, "bim.schedule.link")
    return preflight_schedule_interchange(payload)


@router.get(
    "/projects/{project_id}/4d/schedule-interchange/capabilities",
    response_model=BimScheduleInteropCapabilitiesResponse,
)
def read_project_bim_schedule_interop_capabilities(
    project_id: int,
    empresa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    _require_bim_access(db, project, current_user, "bim.schedule.view")
    return get_schedule_interop_capabilities()


@router.post(
    "/projects/{project_id}/4d/schedule-interchange/compare",
    response_model=BimScheduleComparisonResponse,
)
def compare_project_bim_schedule_interchange(
    project_id: int,
    payload: BimScheduleComparisonRequest,
    empresa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    _require_bim_access(db, project, current_user, "bim.schedule.link")
    return compare_schedule_interchange(payload.left, payload.right)


@router.post(
    "/projects/{project_id}/4d/schedule-interchange/revisions",
    response_model=BimScheduleImportRevisionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_project_bim_schedule_import_revision(
    project_id: int,
    payload: BimScheduleInterchangeDocument,
    empresa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    _require_bim_access(db, project, current_user, "bim.schedule.link")
    try:
        return create_import_revision(
            db,
            project_id=project.id,
            company_id=project.empresa_id,
            user_id=current_user.id,
            document=payload,
        )
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.get(
    "/projects/{project_id}/4d/schedule-interchange/revisions",
    response_model=list[BimScheduleImportRevisionResponse],
)
def list_project_bim_schedule_import_revisions(
    project_id: int,
    empresa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    _require_bim_access(db, project, current_user, "bim.schedule.view")
    return list_import_revisions(db, project_id=project.id, company_id=project.empresa_id)


@router.post(
    "/projects/{project_id}/4d/schedule-interchange/revisions/{revision_id}/decision",
    response_model=BimScheduleImportRevisionResponse,
)
def decide_project_bim_schedule_import_revision(
    project_id: int,
    revision_id: int,
    payload: BimScheduleImportDecisionRequest,
    empresa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    _require_bim_access(db, project, current_user, "bim.schedule.link")
    try:
        return decide_import_revision(
            db,
            revision_id=revision_id,
            project_id=project.id,
            company_id=project.empresa_id,
            user_id=current_user.id,
            decision=payload.decision,
            reason=payload.reason,
            expected_version=payload.expected_version,
        )
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.post(
    "/projects/{project_id}/4d/schedule-interchange/revisions/{revision_id}/rollback",
    response_model=BimScheduleImportRevisionResponse,
)
def rollback_project_bim_schedule_import_revision(
    project_id: int,
    revision_id: int,
    payload: BimScheduleImportRollbackRequest,
    empresa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    _require_bim_access(db, project, current_user, "bim.schedule.link")
    try:
        return rollback_import_revision(
            db,
            revision_id=revision_id,
            project_id=project.id,
            company_id=project.empresa_id,
            user_id=current_user.id,
            reason=payload.reason,
            expected_version=payload.expected_version,
        )
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.post(
    "/projects/{project_id}/4d/schedule-interchange/mspdi/import-preview",
    response_model=BimScheduleImportPreviewResponse,
)
async def preview_project_bim_mspdi_import(
    project_id: int,
    file: UploadFile = File(...),
    timezone_name: str = Form(...),
    currency: str = Form("USD"),
    empresa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    _require_bim_access(db, project, current_user, "bim.schedule.link")
    if not (file.filename or "").lower().endswith(".xml"):
        raise HTTPException(status_code=400, detail="MSPDI requiere un archivo .xml.")
    try:
        return parse_mspdi_xml(
            await file.read(),
            source_filename=file.filename or "schedule.xml",
            timezone_name=timezone_name,
            currency=currency.upper(),
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/projects/{project_id}/4d/schedule-interchange/mspdi/export")
def export_project_bim_mspdi(
    project_id: int,
    payload: BimScheduleInterchangeDocument,
    empresa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    _require_bim_access(db, project, current_user, "bim.schedule.link")
    try:
        content = export_mspdi_xml(payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return Response(
        content=content,
        media_type="application/xml",
        headers={"Content-Disposition": 'attachment; filename="giproy-bim-schedule.xml"'},
    )


@router.post(
    "/projects/{project_id}/4d/schedule-interchange/p6/import-preview",
    response_model=BimScheduleImportPreviewResponse,
)
async def preview_project_bim_p6_xml_import(
    project_id: int,
    file: UploadFile = File(...),
    timezone_name: str = Form(...),
    currency: str = Form("USD"),
    empresa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    _require_bim_access(db, project, current_user, "bim.schedule.link")
    if not (file.filename or "").lower().endswith(".xml"):
        raise HTTPException(status_code=400, detail="P6 XML requiere un archivo .xml.")
    try:
        return parse_p6_xml(
            await file.read(),
            source_filename=file.filename or "schedule-p6.xml",
            timezone_name=timezone_name,
            currency=currency.upper(),
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/projects/{project_id}/4d/schedule-interchange/p6/export")
def export_project_bim_p6_xml(
    project_id: int,
    payload: BimScheduleInterchangeDocument,
    empresa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    _require_bim_access(db, project, current_user, "bim.schedule.link")
    try:
        content = export_p6_xml(payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return Response(
        content=content,
        media_type="application/xml",
        headers={"Content-Disposition": 'attachment; filename="giproy-bim-schedule-p6.xml"'},
    )


@router.post("/projects/{project_id}/4d/activities", response_model=Bim4dActivitySnapshotResponse)
def create_project_bim_4d_activity(project_id: int, payload: Bim4dActivitySnapshotCreate, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    _require_bim_access(db, project, current_user, "bim.schedule.link")
    result = create_activity_snapshot(db, project_id=project.id, company_id=project.empresa_id, user_id=current_user.id, payload=payload)
    record_audit_event(db, module="bim", event_type="bim_4d_activity_snapshot_created", message="Snapshot de actividad 4D registrado.", actor=current_user, empresa_id=project.empresa_id, entity_type="bim_4d_activity_snapshot", entity_id=result["id"], payload={"source_kind": result["source_kind"], "source_ref": result["source_ref"], "snapshot_revision": result["snapshot_revision"]})
    return result


@router.get("/projects/{project_id}/4d/link-proposals", response_model=list[Bim4dLinkProposalResponse])
def list_project_bim_4d_link_proposals(project_id: int, element_id: Optional[int] = None, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    _require_bim_access(db, project, current_user, "bim.schedule.view")
    return list_link_proposals(db, project_id=project.id, company_id=project.empresa_id, element_id=element_id)


@router.post("/projects/{project_id}/4d/link-proposals", response_model=Bim4dLinkProposalResponse)
def create_project_bim_4d_link_proposal(project_id: int, payload: Bim4dLinkProposalCreate, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    _require_bim_access(db, project, current_user, "bim.schedule.link")
    result = create_link_proposal(db, project_id=project.id, company_id=project.empresa_id, user_id=current_user.id, payload=payload)
    record_audit_event(db, module="bim", event_type="bim_4d_link_proposed", message="Vínculo BIM 4D propuesto.", actor=current_user, empresa_id=project.empresa_id, entity_type="bim_4d_link_proposal", entity_id=result["id"], payload={"element_id": result["element_id"], "activity_snapshot_id": result["activity"]["id"], "link_type": result["link_type"]})
    return result


@router.post("/projects/{project_id}/4d/link-proposals/{proposal_id}/decision", response_model=Bim4dLinkProposalResponse)
def decide_project_bim_4d_link_proposal(project_id: int, proposal_id: int, payload: Bim4dLinkDecisionRequest, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    _require_bim_access(db, project, current_user, "bim.schedule.link")
    result = decide_link_proposal(db, proposal_id=proposal_id, project_id=project.id, company_id=project.empresa_id, user_id=current_user.id, decision=payload.decision, reason=payload.reason)
    record_audit_event(db, module="bim", event_type="bim_4d_link_decided", message="Vínculo BIM 4D decidido.", actor=current_user, empresa_id=project.empresa_id, entity_type="bim_4d_link_proposal", entity_id=result["id"], payload={"decision": result["status"], "element_id": result["element_id"], "activity_snapshot_id": result["activity"]["id"]})
    return result


@router.post("/projects/{project_id}/4d/progress", response_model=Bim4dProgressSnapshotResponse)
def create_project_bim_4d_progress(project_id: int, payload: Bim4dProgressSnapshotCreate, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    _require_bim_access(db, project, current_user, "bim.progress.report")
    result = create_progress_snapshot(db, project_id=project.id, company_id=project.empresa_id, user_id=current_user.id, payload=payload)
    record_audit_event(db, module="bim", event_type="bim_4d_progress_reported", message="Progreso BIM 4D registrado.", actor=current_user, empresa_id=project.empresa_id, entity_type="bim_4d_progress_snapshot", entity_id=result["id"], payload={"activity_snapshot_id": result["activity_snapshot_id"], "progress_percent": result["progress_percent"], "reported_at": result["reported_at"].isoformat()})
    return result


@router.get("/projects/{project_id}/4d/timeline", response_model=Bim4dTimelineResponse)
def get_project_bim_4d_timeline(project_id: int, cutoff: datetime, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    _require_bim_access(db, project, current_user, "bim.schedule.view")
    return build_timeline(db, project_id=project.id, company_id=project.empresa_id, cutoff=cutoff)


@router.get("/projects/{project_id}/4d/baselines", response_model=list[Bim4dBaselineResponse])
def list_project_bim_4d_baselines(project_id: int, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    _require_bim_access(db, project, current_user, "bim.schedule.view")
    return list_baselines(db, project_id=project.id, company_id=project.empresa_id)


@router.get("/projects/{project_id}/4d/baselines/{baseline_id}/gantt", response_model=Bim4dGanttResponse)
def get_project_bim_4d_gantt(project_id: int, baseline_id: int, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.schedule.view")
    return build_gantt(db, baseline_id=baseline_id, project_id=project.id, company_id=project.empresa_id)


@router.post("/projects/{project_id}/4d/baselines", response_model=Bim4dBaselineResponse)
def create_project_bim_4d_baseline(project_id: int, payload: Bim4dBaselineCreate, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    _require_bim_access(db, project, current_user, "bim.schedule.link")
    result = create_baseline(db, project_id=project.id, company_id=project.empresa_id, user_id=current_user.id, payload=payload)
    record_audit_event(db, module="bim", event_type="bim_4d_baseline_created", message="Linea base BIM 4D registrada.", actor=current_user, empresa_id=project.empresa_id, entity_type="bim_4d_baseline", entity_id=result["id"], payload={"revision": result["revision"], "activity_count": len(result["activities"]), "dependency_count": len(result["dependencies"])})
    return result


@router.get("/projects/{project_id}/4d/baselines/{baseline_id}/deviation", response_model=Bim4dDeviationResponse)
def get_project_bim_4d_deviation(project_id: int, baseline_id: int, cutoff: datetime, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    _require_bim_access(db, project, current_user, "bim.schedule.view")
    return build_plan_actual_deviation(db, baseline_id=baseline_id, project_id=project.id, company_id=project.empresa_id, cutoff=cutoff)


@router.get("/projects/{project_id}/4d/work-areas", response_model=list[Bim4dWorkAreaResponse])
def list_project_bim_4d_work_areas(project_id: int, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.schedule.view")
    return list_work_areas(db, project_id=project.id, company_id=project.empresa_id)


@router.post("/projects/{project_id}/4d/work-areas", response_model=Bim4dWorkAreaResponse)
def create_project_bim_4d_work_area(project_id: int, payload: Bim4dWorkAreaCreate, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.schedule.link")
    result = create_work_area(db, project_id=project.id, company_id=project.empresa_id, user_id=current_user.id, payload=payload)
    record_audit_event(db, module="bim", event_type="bim_4d_work_area_created", message="Frente BIM 4D registrado.", actor=current_user, empresa_id=project.empresa_id, entity_type="bim_4d_work_area", entity_id=result["id"], payload={"code": result["code"]})
    return result


@router.get("/projects/{project_id}/4d/constructible-components", response_model=list[Bim4dConstructibleComponentResponse])
def list_project_bim_4d_components(project_id: int, work_area_id: Optional[int] = None, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.schedule.view")
    return list_constructible_components(db, project_id=project.id, company_id=project.empresa_id, work_area_id=work_area_id)


@router.post("/projects/{project_id}/4d/constructible-components", response_model=Bim4dConstructibleComponentResponse)
def create_project_bim_4d_component(project_id: int, payload: Bim4dConstructibleComponentCreate, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.schedule.link")
    result = create_constructible_component(db, project_id=project.id, company_id=project.empresa_id, user_id=current_user.id, payload=payload)
    record_audit_event(db, module="bim", event_type="bim_4d_component_created", message="Componente construible BIM registrado.", actor=current_user, empresa_id=project.empresa_id, entity_type="bim_4d_constructible_component", entity_id=result["id"], payload={"code": result["code"], "work_area_id": result["work_area_id"], "element_count": len(result["element_ids"])})
    return result


@router.get("/projects/{project_id}/4d/scenarios", response_model=list[Bim4dScenarioResponse])
def list_project_bim_4d_scenarios(project_id: int, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.schedule.view")
    return list_scenarios(db, project_id=project.id, company_id=project.empresa_id)


@router.get("/projects/{project_id}/4d/space-time-conflicts", response_model=Bim4dSpaceTimeConflictResponse)
def get_project_bim_4d_space_time_conflicts(project_id: int, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.schedule.view")
    return analyze_space_time_conflicts(db, project_id=project.id, company_id=project.empresa_id)


@router.post("/projects/{project_id}/4d/scenarios", response_model=Bim4dScenarioResponse)
def create_project_bim_4d_scenario(project_id: int, payload: Bim4dScenarioCreate, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.schedule.link")
    result = create_scenario(db, project_id=project.id, company_id=project.empresa_id, user_id=current_user.id, payload=payload)
    record_audit_event(db, module="bim", event_type="bim_4d_scenario_created", message="Escenario what-if BIM registrado.", actor=current_user, empresa_id=project.empresa_id, entity_type="bim_4d_scenario", entity_id=result["id"], payload={"revision": result["revision"], "baseline_id": result["baseline_id"], "metrics": result["metrics"]})
    return result


@router.get("/projects/{project_id}/4d/productivity-proposals", response_model=list[Bim4dProductivityProposalResponse])
def list_project_bim_4d_productivity(project_id: int, element_id: Optional[int] = None, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.schedule.view")
    return list_productivity_proposals(db, project_id=project.id, company_id=project.empresa_id, element_id=element_id)


@router.get("/projects/{project_id}/4d/resources", response_model=list[Bim4dResourceResponse])
def list_project_bim_4d_resources(project_id: int, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.schedule.view")
    return list_resources(db, project_id=project.id, company_id=project.empresa_id)


@router.get("/projects/{project_id}/4d/partition-specs", response_model=list[Bim4dPartitionSpecResponse])
def list_project_bim_4d_partition_specs(project_id: int, element_id: Optional[int] = None, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.schedule.view")
    return list_partition_specs(db, project_id=project.id, company_id=project.empresa_id, element_id=element_id)


@router.post("/projects/{project_id}/4d/partition-specs", response_model=Bim4dPartitionSpecResponse)
def create_project_bim_4d_partition_spec(project_id: int, payload: Bim4dPartitionSpecCreate, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.schedule.link")
    return create_partition_spec(db, project_id=project.id, company_id=project.empresa_id, user_id=current_user.id, payload=payload)


@router.delete("/projects/{project_id}/4d/partition-specs/{spec_id}", status_code=204)
def delete_project_bim_4d_partition_spec(project_id: int, spec_id: int, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.schedule.link")
    delete_partition_spec(db, spec_id=spec_id, project_id=project.id, company_id=project.empresa_id)
    return Response(status_code=204)


@router.post("/projects/{project_id}/4d/partition-specs/{spec_id}/materialize", response_model=Bim4dPartitionArtifactResponse)
def materialize_project_bim_4d_partition(project_id: int, spec_id: int, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.schedule.link")
    return materialize_partition(db, spec_id=spec_id, project_id=project.id, company_id=project.empresa_id, user_id=current_user.id)


@router.get("/projects/{project_id}/4d/partition-specs/{spec_id}/artifact", response_model=Bim4dPartitionArtifactResponse)
def get_project_bim_4d_partition_artifact(project_id: int, spec_id: int, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.schedule.view")
    return get_partition_artifact(db, spec_id=spec_id, project_id=project.id, company_id=project.empresa_id)


@router.post("/projects/{project_id}/4d/partition-specs/{spec_id}/csg-artifacts", response_model=Bim4dPartitionCsgArtifactResponse)
def create_project_bim_4d_partition_csg_artifact(project_id: int, spec_id: int, payload: Bim4dPartitionCsgArtifactCreate, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.schedule.link")
    return create_partition_csg_artifact(db, spec_id=spec_id, project_id=project.id, company_id=project.empresa_id, user_id=current_user.id, payload=payload)


@router.get("/projects/{project_id}/4d/partition-specs/{spec_id}/csg-artifacts", response_model=list[Bim4dPartitionCsgArtifactResponse])
def list_project_bim_4d_partition_csg_artifacts(project_id: int, spec_id: int, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.schedule.view")
    return list_partition_csg_artifacts(db, spec_id=spec_id, project_id=project.id, company_id=project.empresa_id)


@router.get("/projects/{project_id}/4d/equipment", response_model=list[Bim4dEquipmentResponse])
def list_project_bim_4d_equipment(project_id: int, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.schedule.view")
    return list_equipment(db, project_id=project.id, company_id=project.empresa_id)


@router.post("/projects/{project_id}/4d/equipment", response_model=Bim4dEquipmentResponse)
def create_project_bim_4d_equipment(project_id: int, payload: Bim4dEquipmentCreate, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.schedule.link")
    return create_equipment(db, project_id=project.id, company_id=project.empresa_id, user_id=current_user.id, payload=payload)


@router.get("/projects/{project_id}/4d/equipment-motion", response_model=list[Bim4dEquipmentMotionResponse])
def list_project_bim_4d_equipment_motion(project_id: int, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.schedule.view")
    return list_motion_plans(db, project_id=project.id, company_id=project.empresa_id)


@router.post("/projects/{project_id}/4d/equipment-motion", response_model=Bim4dEquipmentMotionResponse)
def create_project_bim_4d_equipment_motion(project_id: int, payload: Bim4dEquipmentMotionCreate, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.schedule.link")
    return create_motion_plan(db, project_id=project.id, company_id=project.empresa_id, user_id=current_user.id, payload=payload)


@router.get("/projects/{project_id}/4d/equipment-motion/{motion_plan_id}/playback", response_model=Bim4dEquipmentPlaybackResponse)
def get_project_bim_4d_equipment_playback(project_id: int, motion_plan_id: int, percent: float = 0, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.schedule.view")
    return equipment_playback(db, motion_plan_id=motion_plan_id, project_id=project.id, company_id=project.empresa_id, percent=percent)


@router.get("/projects/{project_id}/4d/equipment-motion/{motion_plan_id}/conflicts", response_model=list[Bim4dEquipmentConflictResponse])
def get_project_bim_4d_equipment_conflicts(project_id: int, motion_plan_id: int, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.schedule.view")
    return equipment_conflicts(db, motion_plan_id=motion_plan_id, project_id=project.id, company_id=project.empresa_id)


@router.get("/projects/{project_id}/4d/safety-risks", response_model=list[Bim4dSafetyRiskResponse])
def list_project_bim_4d_safety_risks(project_id: int, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.schedule.view")
    return list_safety_risks(db, project_id=project.id, company_id=project.empresa_id)


@router.post("/projects/{project_id}/4d/safety-risks", response_model=Bim4dSafetyRiskResponse)
def create_project_bim_4d_safety_risk(project_id: int, payload: Bim4dSafetyRiskCreate, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.schedule.link")
    return create_safety_risk(db, project_id=project.id, company_id=project.empresa_id, user_id=current_user.id, payload=payload)


@router.post("/projects/{project_id}/4d/safety-risks/{risk_id}/inspections", response_model=Bim4dSafetyInspectionResponse)
def create_project_bim_4d_safety_inspection(project_id: int, risk_id: int, payload: Bim4dSafetyInspectionCreate, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.schedule.link")
    return add_safety_inspection(db, risk_id=risk_id, project_id=project.id, company_id=project.empresa_id, user_id=current_user.id, payload=payload)


@router.get("/projects/{project_id}/4d/safety-risks/{risk_id}/inspections", response_model=list[Bim4dSafetyInspectionResponse])
def list_project_bim_4d_safety_inspections(project_id: int, risk_id: int, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.schedule.view")
    return list_safety_inspections(db, risk_id=risk_id, project_id=project.id, company_id=project.empresa_id)


@router.get("/projects/{project_id}/4d/safety-risks/{risk_id}/punch-items", response_model=list[Bim4dSafetyPunchResponse])
def list_project_bim_4d_safety_punch_items(project_id: int, risk_id: int, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.schedule.view")
    return list_safety_punch_items(db, risk_id=risk_id, project_id=project.id, company_id=project.empresa_id)


@router.post("/projects/{project_id}/4d/safety-risks/{risk_id}/punch-items", response_model=Bim4dSafetyPunchResponse)
def create_project_bim_4d_safety_punch_item(project_id: int, risk_id: int, payload: Bim4dSafetyPunchCreate, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.schedule.link")
    return create_safety_punch_item(db, risk_id=risk_id, project_id=project.id, company_id=project.empresa_id, user_id=current_user.id, payload=payload)


@router.patch("/projects/{project_id}/4d/safety-risks/{risk_id}/punch-items/{punch_id}", response_model=Bim4dSafetyPunchResponse)
def update_project_bim_4d_safety_punch_item(project_id: int, risk_id: int, punch_id: int, payload: Bim4dSafetyPunchUpdate, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.schedule.link")
    return update_safety_punch_item(db, punch_id=punch_id, risk_id=risk_id, project_id=project.id, company_id=project.empresa_id, user_id=current_user.id, payload=payload)


@router.get("/projects/{project_id}/4d/safety-risks/{risk_id}/exposure", response_model=list[Bim4dSafetyExposureResponse])
def get_project_bim_4d_safety_exposure(project_id: int, risk_id: int, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.schedule.view")
    return evaluate_safety_exposure(db, risk_id=risk_id, project_id=project.id, company_id=project.empresa_id)


@router.get("/projects/{project_id}/4d/unplanned-events", response_model=list[Bim4dUnplannedEventResponse])
def list_project_bim_4d_unplanned_events(project_id: int, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.schedule.view")
    return list_unplanned_events(db, project_id=project.id, company_id=project.empresa_id)


@router.post("/projects/{project_id}/4d/unplanned-events", response_model=Bim4dUnplannedEventResponse)
def create_project_bim_4d_unplanned_event(project_id: int, payload: Bim4dUnplannedEventCreate, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.schedule.link")
    return create_unplanned_event(db, project_id=project.id, company_id=project.empresa_id, user_id=current_user.id, payload=payload)


@router.post("/projects/{project_id}/4d/unplanned-events/{event_id}/decision", response_model=Bim4dUnplannedEventResponse)
def decide_project_bim_4d_unplanned_event(project_id: int, event_id: int, payload: Bim4dUnplannedEventDecision, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.schedule.link")
    return decide_unplanned_event(db, event_id=event_id, project_id=project.id, company_id=project.empresa_id, user_id=current_user.id, payload=payload)


@router.post("/projects/{project_id}/4d/resources", response_model=Bim4dResourceResponse)
def create_project_bim_4d_resource(project_id: int, payload: Bim4dResourceCreate, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.schedule.link")
    return create_resource(db, project_id=project.id, company_id=project.empresa_id, user_id=current_user.id, payload=payload)


@router.get("/projects/{project_id}/4d/field-resource-movements", response_model=list[Bim4dFieldResourceMovementResponse])
def list_project_bim_4d_field_resource_movements(project_id: int, resource_id: Optional[int] = None, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.schedule.view")
    return list_field_resource_movements(db, project_id=project.id, company_id=project.empresa_id, resource_id=resource_id)


@router.post("/projects/{project_id}/4d/field-resource-movements", response_model=Bim4dFieldResourceMovementResponse)
def create_project_bim_4d_field_resource_movement(project_id: int, payload: Bim4dFieldResourceMovementCreate, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.schedule.link")
    return create_field_resource_movement(db, project_id=project.id, company_id=project.empresa_id, user_id=current_user.id, payload=payload)


@router.get("/projects/{project_id}/4d/crews", response_model=list[Bim4dCrewResponse])
def list_project_bim_4d_crews(project_id: int, active_only: bool = False, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.schedule.view")
    return list_crews(db, project_id=project.id, company_id=project.empresa_id, active_only=active_only)


@router.post("/projects/{project_id}/4d/crews", response_model=Bim4dCrewResponse)
def create_project_bim_4d_crew(project_id: int, payload: Bim4dCrewCreate, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.schedule.link")
    return create_crew(db, project_id=project.id, company_id=project.empresa_id, user_id=current_user.id, payload=payload)


@router.get("/projects/{project_id}/4d/timecards", response_model=list[Bim4dTimecardResponse])
def list_project_bim_4d_timecards(project_id: int, crew_id: Optional[int] = None, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.schedule.view")
    return list_timecards(db, project_id=project.id, company_id=project.empresa_id, crew_id=crew_id)


@router.post("/projects/{project_id}/4d/timecards", response_model=Bim4dTimecardResponse)
def create_project_bim_4d_timecard(project_id: int, payload: Bim4dTimecardCreate, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.schedule.link")
    return create_timecard(db, project_id=project.id, company_id=project.empresa_id, user_id=current_user.id, payload=payload)


@router.post("/projects/{project_id}/4d/resource-assignments", response_model=Bim4dResourceAssignmentResponse)
def create_project_bim_4d_resource_assignment(project_id: int, payload: Bim4dResourceAssignmentCreate, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.schedule.link")
    return create_assignment(db, project_id=project.id, company_id=project.empresa_id, user_id=current_user.id, payload=payload)


@router.get("/projects/{project_id}/4d/resources/{resource_id}/histogram", response_model=Bim4dResourceHistogramResponse)
def get_project_bim_4d_resource_histogram(project_id: int, resource_id: int, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.schedule.view")
    return build_histogram(db, resource_id=resource_id, project_id=project.id, company_id=project.empresa_id)


@router.post("/projects/{project_id}/4d/resource-leveling", response_model=Bim4dLevelingResponse, status_code=status.HTTP_201_CREATED)
def create_project_bim_4d_resource_leveling(project_id: int, payload: Bim4dLevelingCreate, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.schedule.link")
    return create_leveling_scenario(db, project_id=project.id, company_id=project.empresa_id, user_id=current_user.id, payload=payload)


@router.get("/projects/{project_id}/4d/resource-leveling", response_model=list[Bim4dLevelingResponse])
def list_project_bim_4d_resource_leveling(project_id: int, baseline_id: Optional[int] = None, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.schedule.view")
    return list_leveling_scenarios(db, project_id=project.id, company_id=project.empresa_id, baseline_id=baseline_id)


@router.post("/projects/{project_id}/4d/resource-leveling/{scenario_id}/decision", response_model=Bim4dLevelingResponse)
def decide_project_bim_4d_resource_leveling(project_id: int, scenario_id: int, payload: Bim4dLevelingDecision, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.schedule.link")
    return decide_leveling_scenario(db, scenario_id=scenario_id, project_id=project.id, company_id=project.empresa_id, user_id=current_user.id, decision=payload.decision, reason=payload.reason, expected_lock_version=payload.expected_lock_version)


@router.post("/projects/{project_id}/4d/productivity-proposals", response_model=Bim4dProductivityProposalResponse)
def create_project_bim_4d_productivity(project_id: int, payload: Bim4dProductivityProposalCreate, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.schedule.link")
    result = create_productivity_proposal(db, project_id=project.id, company_id=project.empresa_id, user_id=current_user.id, payload=payload)
    record_audit_event(db, module="bim", event_type="bim_4d_productivity_proposed", message="Propuesta BIM 4D/5D registrada.", actor=current_user, empresa_id=project.empresa_id, entity_type="bim_4d_productivity_proposal", entity_id=result["id"], payload={"activity_snapshot_id": result["activity_snapshot_id"], "target_type": result["target_type"], "target_id": result["target_id"], "calculated_duration_days": result["calculated_duration_days"]})
    return result


@router.post("/projects/{project_id}/4d/productivity-proposals/{proposal_id}/decision", response_model=Bim4dProductivityProposalResponse)
def decide_project_bim_4d_productivity(project_id: int, proposal_id: int, payload: Bim4dProductivityDecision, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.schedule.link")
    result = decide_productivity_proposal(db, proposal_id=proposal_id, project_id=project.id, company_id=project.empresa_id, user_id=current_user.id, decision=payload.decision, reason=payload.reason)
    record_audit_event(db, module="bim", event_type="bim_4d_productivity_decided", message="Propuesta BIM 4D/5D decidida.", actor=current_user, empresa_id=project.empresa_id, entity_type="bim_4d_productivity_proposal", entity_id=result["id"], payload={"decision": result["status"]})
    return result


@router.get("/projects/{project_id}/4d/field-reports", response_model=list[Bim4dFieldReportResponse])
def list_project_bim_4d_field_reports(project_id: int, activity_snapshot_id: Optional[int] = None, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.schedule.view")
    return list_field_reports(db, project_id=project.id, company_id=project.empresa_id, activity_snapshot_id=activity_snapshot_id)


@router.get("/projects/{project_id}/4d/reports/{report_type}")
def get_project_bim_4d_report(project_id: int, report_type: str, format: str = "json", baseline_id: Optional[int] = None, resource_id: Optional[int] = None, cutoff: Optional[datetime] = None, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.schedule.view")
    report = build_report(db, report_type=report_type, project_id=project.id, company_id=project.empresa_id, baseline_id=baseline_id, resource_id=resource_id, cutoff=cutoff)
    if format == "csv":
        return Response(content=report_csv(report), media_type="text/csv; charset=utf-8", headers={"Content-Disposition": f'attachment; filename="bim-4d-{report_type}-{project.id}.csv"'})
    if format != "json": raise HTTPException(status_code=422, detail="Formato de informe no soportado.")
    return report


@router.post("/projects/{project_id}/4d/field-reports", response_model=Bim4dFieldReportResponse)
def create_project_bim_4d_field_report(project_id: int, payload: Bim4dFieldReportCreate, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.progress.report")
    result = create_field_report(db, project_id=project.id, company_id=project.empresa_id, user_id=current_user.id, payload=payload)
    record_audit_event(db, module="bim", event_type="bim_4d_field_report_created", message="Reporte de campo BIM registrado.", actor=current_user, empresa_id=project.empresa_id, entity_type="bim_4d_field_report", entity_id=result["id"], payload={"activity_snapshot_id": result["activity_snapshot_id"], "progress_percent": result["progress_percent"], "spi": result["schedule_performance_index"], "cpi": result["cost_performance_index"]})
    return result


@router.post("/projects/{project_id}/4d/field-reports/{report_id}/evidence", response_model=Bim4dFieldEvidenceResponse)
async def upload_project_bim_4d_field_evidence(project_id: int, report_id: int, file: UploadFile = File(...), empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.progress.report")
    result = add_field_evidence(db, report_id=report_id, project_id=project.id, company_id=project.empresa_id, user_id=current_user.id, filename=file.filename or "evidencia", content_type=file.content_type or "application/octet-stream", content=await file.read())
    record_audit_event(db, module="bim", event_type="bim_4d_field_evidence_uploaded", message="Evidencia de campo BIM registrada.", actor=current_user, empresa_id=project.empresa_id, entity_type="bim_4d_field_evidence", entity_id=result["id"], payload={"field_report_id": report_id, "byte_size": result["byte_size"], "checksum_sha256": result["checksum_sha256"]})
    return result


@router.get("/projects/{project_id}/4d/field-evidence/{evidence_id}/content")
def download_project_bim_4d_field_evidence(project_id: int, evidence_id: int, empresa_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    project = _resolve_project(db, project_id, current_user, empresa_id); _require_bim_access(db, project, current_user, "bim.schedule.view")
    evidence = get_field_evidence(db, evidence_id=evidence_id, project_id=project.id, company_id=project.empresa_id)
    return Response(content=evidence.content, media_type=evidence.content_type, headers={"Content-Disposition": f'inline; filename="{evidence.filename}"', "X-Content-SHA256": evidence.checksum_sha256})


@router.post("/projects/{project_id}/bootstrap-demo")
def bootstrap_demo_workspace(
    project_id: int,
    empresa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    access = resolve_bim_feature_access(
        db=db,
        user_id=current_user.id,
        company_id=project.empresa_id,
        role=current_user.rol,
    )
    if not access.enabled:
        raise HTTPException(status_code=403, detail="La capa BIM no está habilitada para este contexto.")
    if (current_user.rol or "").lower() != "superadministrador":
        raise HTTPException(status_code=403, detail="Solo superadministrador puede bootstrapear el workspace BIM.")

    result = bootstrap_demo_bim_project(
        db,
        project_id=project.id,
        company_id=project.empresa_id,
        user_id=current_user.id,
    )
    return {
        "message": "Bootstrap BIM demo materializado.",
        **result,
    }


@router.post("/projects/{project_id}/imports/json-package", response_model=BimJsonImportResponse)
def import_json_package(
    project_id: int,
    payload: BimJsonImportRequest,
    empresa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    access = resolve_bim_feature_access(
        db=db,
        user_id=current_user.id,
        company_id=project.empresa_id,
        role=current_user.rol,
    )
    if not access.enabled:
        raise HTTPException(status_code=403, detail="La capa BIM no está habilitada para este contexto.")
    if (current_user.rol or "").lower() != "superadministrador":
        raise HTTPException(status_code=403, detail="Solo superadministrador puede importar paquetes BIM.")

    validation = validate_json_bim_batch([payload])
    _raise_if_json_validation_has_errors(validation)

    try:
        return import_json_bim_package(
            db,
            project_id=project.id,
            company_id=project.empresa_id,
            payload=payload,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/projects/{project_id}/imports/json-batch", response_model=BimJsonImportBatchResponse)
def import_json_batch(
    project_id: int,
    payload: BimJsonImportBatchRequest,
    empresa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    access = resolve_bim_feature_access(
        db=db,
        user_id=current_user.id,
        company_id=project.empresa_id,
        role=current_user.rol,
    )
    if not access.enabled:
        raise HTTPException(status_code=403, detail="La capa BIM no está habilitada para este contexto.")
    if (current_user.rol or "").lower() != "superadministrador":
        raise HTTPException(status_code=403, detail="Solo superadministrador puede importar paquetes BIM.")
    if not payload.packages:
        raise HTTPException(status_code=400, detail="No se recibieron paquetes BIM para importar.")

    validation = validate_json_bim_batch(payload.packages)
    _raise_if_json_validation_has_errors(validation)

    try:
        return import_json_bim_batch(
            db,
            project_id=project.id,
            company_id=project.empresa_id,
            packages=payload.packages,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/projects/{project_id}/imports/ifc-manifest", response_model=BimIfcManifestResponse)
def register_ifc_manifest(
    project_id: int,
    payload: BimIfcManifestRequest,
    empresa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    access = resolve_bim_feature_access(
        db=db,
        user_id=current_user.id,
        company_id=project.empresa_id,
        role=current_user.rol,
    )
    if not access.enabled:
        raise HTTPException(status_code=403, detail="La capa BIM no está habilitada para este contexto.")
    if (current_user.rol or "").lower() != "superadministrador":
        raise HTTPException(status_code=403, detail="Solo superadministrador puede registrar manifiestos IFC BIM.")

    try:
        return register_ifc_bim_manifest(
            db,
            project_id=project.id,
            company_id=project.empresa_id,
            payload=payload,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/projects/{project_id}/imports/ifc-text", response_model=BimIfcTextImportResponse)
def import_ifc_text(
    project_id: int,
    payload: BimIfcTextImportRequest,
    empresa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    access = resolve_bim_feature_access(
        db=db,
        user_id=current_user.id,
        company_id=project.empresa_id,
        role=current_user.rol,
    )
    if not access.enabled:
        raise HTTPException(status_code=403, detail="La capa BIM no está habilitada para este contexto.")
    if (current_user.rol or "").lower() != "superadministrador":
        raise HTTPException(status_code=403, detail="Solo superadministrador puede importar IFC BIM.")

    try:
        return import_ifc_text_bim_package(
            db,
            project_id=project.id,
            company_id=project.empresa_id,
            payload=payload,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/projects/{project_id}/imports/ifc-file", response_model=BimIfcFileImportResponse)
async def import_ifc_file(
    project_id: int,
    model_name: str = Form(...),
    version_label: str = Form(...),
    discipline: Optional[str] = Form(default=None),
    description: Optional[str] = Form(default=None),
    notes: Optional[str] = Form(default=None),
    activate: bool = Form(default=True),
    file: UploadFile = File(...),
    empresa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    access = resolve_bim_feature_access(
        db=db,
        user_id=current_user.id,
        company_id=project.empresa_id,
        role=current_user.rol,
    )
    if not access.enabled:
        raise HTTPException(status_code=403, detail="La capa BIM no está habilitada para este contexto.")
    if (current_user.rol or "").lower() != "superadministrador":
        raise HTTPException(status_code=403, detail="Solo superadministrador puede importar IFC BIM.")

    try:
        return import_ifc_file_bim_package(
            db,
            project_id=project.id,
            company_id=project.empresa_id,
            model_name=model_name,
            version_label=version_label,
            source_filename=file.filename or "modelo.ifc",
            content=await file.read(),
            discipline=discipline,
            description=description,
            notes=notes,
            activate=activate,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post(
    "/projects/{project_id}/imports/ifc-jobs",
    response_model=BimImportJobResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def create_ifc_import_job(
    project_id: int,
    background_tasks: BackgroundTasks,
    model_name: str = Form(...),
    version_label: str = Form(...),
    discipline: Optional[str] = Form(default=None),
    description: Optional[str] = Form(default=None),
    notes: Optional[str] = Form(default=None),
    file: UploadFile = File(...),
    empresa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    access = resolve_bim_feature_access(
        db=db,
        user_id=current_user.id,
        company_id=project.empresa_id,
        role=current_user.rol,
    )
    if not access.enabled:
        raise HTTPException(status_code=403, detail="La capa BIM no está habilitada para este contexto.")
    if (current_user.rol or "").lower() != "superadministrador":
        raise HTTPException(status_code=403, detail="Solo superadministrador puede importar IFC BIM.")

    try:
        job = create_bim_import_job(
            db,
            project_id=project.id,
            company_id=project.empresa_id,
            requested_by=current_user.id,
            model_name=model_name,
            version_label=version_label,
            source_filename=file.filename or "modelo.ifc",
            content=await file.read(),
            discipline=discipline,
            description=description,
            notes=notes,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    if job.status == "queued":
        background_tasks.add_task(process_bim_import_job, job.id)
    return serialize_bim_import_job(job)


@router.get("/projects/{project_id}/imports/jobs", response_model=list[BimImportJobResponse])
def list_ifc_import_jobs(
    project_id: int,
    empresa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    access = resolve_bim_feature_access(
        db=db,
        user_id=current_user.id,
        company_id=project.empresa_id,
        role=current_user.rol,
    )
    if not access.enabled:
        raise HTTPException(status_code=403, detail="La capa BIM no está habilitada para este contexto.")
    if (current_user.rol or "").lower() != "superadministrador":
        raise HTTPException(status_code=403, detail="Solo superadministrador puede consultar jobs IFC BIM.")
    try:
        jobs = list_bim_import_jobs(db, project_id=project.id, company_id=project.empresa_id)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return [serialize_bim_import_job(job) for job in jobs]


@router.get(
    "/projects/{project_id}/imports/jobs/{job_id}",
    response_model=BimImportJobResponse,
)
def get_ifc_import_job(
    project_id: int,
    job_id: int,
    empresa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    access = resolve_bim_feature_access(
        db=db,
        user_id=current_user.id,
        company_id=project.empresa_id,
        role=current_user.rol,
    )
    if not access.enabled:
        raise HTTPException(status_code=403, detail="La capa BIM no está habilitada para este contexto.")
    if (current_user.rol or "").lower() != "superadministrador":
        raise HTTPException(status_code=403, detail="Solo superadministrador puede consultar jobs IFC BIM.")
    try:
        job = get_bim_import_job(
            db,
            job_id=job_id,
            project_id=project.id,
            company_id=project.empresa_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return serialize_bim_import_job(job)


@router.post(
    "/projects/{project_id}/imports/jobs/{job_id}/cancel",
    response_model=BimImportJobResponse,
)
def cancel_ifc_import_job(
    project_id: int,
    job_id: int,
    empresa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    access = resolve_bim_feature_access(
        db=db,
        user_id=current_user.id,
        company_id=project.empresa_id,
        role=current_user.rol,
    )
    if not access.enabled:
        raise HTTPException(status_code=403, detail="La capa BIM no está habilitada para este contexto.")
    if (current_user.rol or "").lower() != "superadministrador":
        raise HTTPException(status_code=403, detail="Solo superadministrador puede cancelar jobs IFC BIM.")
    try:
        job = request_bim_import_job_cancellation(
            db,
            job_id=job_id,
            project_id=project.id,
            company_id=project.empresa_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return serialize_bim_import_job(job)


@router.post(
    "/projects/{project_id}/imports/jobs/{job_id}/retry",
    response_model=BimImportJobResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
def retry_ifc_import_job(
    project_id: int,
    job_id: int,
    background_tasks: BackgroundTasks,
    empresa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    access = resolve_bim_feature_access(
        db=db,
        user_id=current_user.id,
        company_id=project.empresa_id,
        role=current_user.rol,
    )
    if not access.enabled:
        raise HTTPException(status_code=403, detail="La capa BIM no está habilitada para este contexto.")
    if (current_user.rol or "").lower() != "superadministrador":
        raise HTTPException(status_code=403, detail="Solo superadministrador puede reintentar jobs IFC BIM.")
    try:
        job = retry_bim_import_job(
            db,
            job_id=job_id,
            project_id=project.id,
            company_id=project.empresa_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    if job.status == "queued":
        background_tasks.add_task(process_bim_import_job, job.id)
    return serialize_bim_import_job(job)


@router.post("/projects/{project_id}/versions/{version_id}/artifacts/viewer", response_model=BimViewerArtifactResponse)
def generate_bim_viewer_artifact(
    project_id: int,
    version_id: int,
    empresa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    access = resolve_bim_feature_access(
        db=db,
        user_id=current_user.id,
        company_id=project.empresa_id,
        role=current_user.rol,
    )
    if not access.enabled:
        raise HTTPException(status_code=403, detail="La capa BIM no está habilitada para este contexto.")
    if (current_user.rol or "").lower() != "superadministrador":
        raise HTTPException(status_code=403, detail="Solo superadministrador puede generar artefactos BIM.")

    try:
        return generate_viewer_artifact(
            db,
            project_id=project.id,
            company_id=project.empresa_id,
            version_id=version_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post(
    "/projects/{project_id}/versions/{version_id}/quality-report",
    response_model=BimIfcQualityReportResponse,
)
def generate_bim_ifc_quality_report(
    project_id: int,
    version_id: int,
    empresa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    access = resolve_bim_feature_access(
        db=db,
        user_id=current_user.id,
        company_id=project.empresa_id,
        role=current_user.rol,
    )
    if not access.enabled:
        raise HTTPException(status_code=403, detail="La capa BIM no está habilitada para este contexto.")
    if (current_user.rol or "").lower() != "superadministrador":
        raise HTTPException(status_code=403, detail="Solo superadministrador puede generar calidad IFC BIM.")
    try:
        report = generate_ifc_quality_report(
            db,
            version_id=version_id,
            project_id=project.id,
            company_id=project.empresa_id,
        )
    except (ValueError, FileNotFoundError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return serialize_ifc_quality_report(report)


@router.get(
    "/projects/{project_id}/versions/{version_id}/quality-report",
    response_model=BimIfcQualityReportResponse,
)
def read_bim_ifc_quality_report(
    project_id: int,
    version_id: int,
    empresa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    access = resolve_bim_feature_access(
        db=db,
        user_id=current_user.id,
        company_id=project.empresa_id,
        role=current_user.rol,
    )
    if not access.enabled:
        raise HTTPException(status_code=403, detail="La capa BIM no está habilitada para este contexto.")
    try:
        report = get_ifc_quality_report(
            db,
            version_id=version_id,
            project_id=project.id,
            company_id=project.empresa_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return serialize_ifc_quality_report(report)


@router.get(
    "/projects/{project_id}/versions/{version_id}/artifacts",
    response_model=list[BimArtifactResponse],
)
def list_bim_artifacts(
    project_id: int,
    version_id: int,
    empresa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    access = resolve_bim_feature_access(db=db, user_id=current_user.id, company_id=project.empresa_id, role=current_user.rol)
    if not access.enabled:
        raise HTTPException(status_code=403, detail="La capa BIM no está habilitada para este contexto.")
    try:
        artifacts = list_artifacts(db, version_id=version_id, project_id=project.id, company_id=project.empresa_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return [serialize_artifact(artifact) for artifact in artifacts]


@router.post(
    "/projects/{project_id}/versions/{version_id}/artifacts",
    response_model=BimArtifactResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register_bim_artifact(
    project_id: int,
    version_id: int,
    artifact_type: str = Form(...),
    source_checksum_sha256: Optional[str] = Form(default=None),
    file: UploadFile = File(...),
    empresa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    access = resolve_bim_feature_access(db=db, user_id=current_user.id, company_id=project.empresa_id, role=current_user.rol)
    if not access.enabled:
        raise HTTPException(status_code=403, detail="La capa BIM no está habilitada para este contexto.")
    if (current_user.rol or "").lower() != "superadministrador":
        raise HTTPException(status_code=403, detail="Solo superadministrador puede registrar artifacts BIM.")
    try:
        artifact = store_artifact_bytes(
            db,
            version_id=version_id,
            project_id=project.id,
            company_id=project.empresa_id,
            artifact_type=artifact_type,
            content=await file.read(),
            source_filename=file.filename or "artifact.bin",
            source_checksum_sha256=source_checksum_sha256,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return serialize_artifact(artifact)


@router.post(
    "/projects/{project_id}/artifacts/{artifact_id}/validate",
    response_model=BimArtifactResponse,
)
def validate_bim_artifact(
    project_id: int,
    artifact_id: int,
    empresa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    access = resolve_bim_feature_access(db=db, user_id=current_user.id, company_id=project.empresa_id, role=current_user.rol)
    if not access.enabled:
        raise HTTPException(status_code=403, detail="La capa BIM no está habilitada para este contexto.")
    try:
        artifact = get_artifact(db, artifact_id=artifact_id, project_id=project.id, company_id=project.empresa_id)
        return serialize_artifact(validate_artifact(db, artifact))
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.post(
    "/projects/{project_id}/artifacts/{artifact_id}/rollback",
    response_model=BimArtifactResponse,
)
def rollback_bim_artifact(
    project_id: int,
    artifact_id: int,
    empresa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    access = resolve_bim_feature_access(db=db, user_id=current_user.id, company_id=project.empresa_id, role=current_user.rol)
    if not access.enabled:
        raise HTTPException(status_code=403, detail="La capa BIM no está habilitada para este contexto.")
    if (current_user.rol or "").lower() != "superadministrador":
        raise HTTPException(status_code=403, detail="Solo superadministrador puede hacer rollback de artifacts BIM.")
    try:
        artifact = rollback_artifact(db, artifact_id=artifact_id, project_id=project.id, company_id=project.empresa_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return serialize_artifact(artifact)


@router.get("/projects/{project_id}/artifacts/{artifact_id}/content")
def download_bim_artifact(
    project_id: int,
    artifact_id: int,
    empresa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    access = resolve_bim_feature_access(db=db, user_id=current_user.id, company_id=project.empresa_id, role=current_user.rol)
    if not access.enabled:
        raise HTTPException(status_code=403, detail="La capa BIM no está habilitada para este contexto.")
    try:
        artifact = get_artifact(db, artifact_id=artifact_id, project_id=project.id, company_id=project.empresa_id)
        artifact = validate_artifact(db, artifact)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    if artifact.status != "active":
        raise HTTPException(status_code=409, detail="El artifact BIM no supera integridad y contrato.")
    return FileResponse(
        artifact.artifact_path,
        filename=Path(artifact.artifact_path).name,
        media_type="application/octet-stream",
        headers={"X-BIM-Artifact-Checksum": artifact.checksum_sha256},
    )


@router.post("/projects/{project_id}/imports/json-validate", response_model=BimJsonValidationBatchResponse)
def validate_json_batch(
    project_id: int,
    payload: BimJsonImportBatchRequest,
    empresa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    access = resolve_bim_feature_access(
        db=db,
        user_id=current_user.id,
        company_id=project.empresa_id,
        role=current_user.rol,
    )
    if not access.enabled:
        raise HTTPException(status_code=403, detail="La capa BIM no está habilitada para este contexto.")
    if (current_user.rol or "").lower() != "superadministrador":
        raise HTTPException(status_code=403, detail="Solo superadministrador puede validar paquetes BIM.")
    if not payload.packages:
        raise HTTPException(status_code=400, detail="No se recibieron paquetes BIM para validar.")

    return validate_json_bim_batch(payload.packages)
