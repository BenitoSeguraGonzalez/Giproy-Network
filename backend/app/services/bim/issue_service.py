import hashlib
import io
import uuid
import zipfile
import xml.etree.ElementTree as ET

from fastapi import HTTPException
from sqlalchemy.orm import joinedload

from app.models.bim_issue import BimIssue, BimIssueAttachment, BimIssueComment, BimIssueEvent
from app.models.bim_model import BimModel
from app.models.bim_model_version import BimModelVersion
from app.models.usuario import Usuario
from app.schemas.bim_issue import BimIssueAttachmentResponse, BimIssueCreateRequest, BimIssueResponse


MAX_ISSUE_ATTACHMENT_BYTES = 10 * 1024 * 1024
ISSUE_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}


def _serialize_attachment(attachment):
    return BimIssueAttachmentResponse(
        id=attachment.id, issue_id=attachment.bim_issue_id,
        filename=attachment.filename, content_type=attachment.content_type,
        byte_size=attachment.byte_size, checksum_sha256=attachment.checksum_sha256,
        uploaded_by=attachment.uploaded_by, uploaded_at=attachment.uploaded_at,
    )


def _serialize(issue):
    return BimIssueResponse(
        id=issue.id, topic_guid=issue.topic_guid, project_id=issue.proyecto_id, company_id=issue.empresa_id,
        version_id=issue.bim_model_version_id, title=issue.title, description=issue.description,
        priority=issue.priority, status=issue.status, assigned_to=issue.assigned_to, created_by=issue.created_by,
        viewpoint=issue.viewpoint_json or {}, snapshot_path=issue.snapshot_path, created_at=issue.fecha_creacion,
        updated_at=issue.fecha_actualizacion,
        comments=[{"id": x.id, "body": x.body, "created_by": x.created_by, "created_at": x.fecha_creacion} for x in sorted(issue.comments, key=lambda x: x.id)],
        events=[{"id": x.id, "event_type": x.event_type, "payload": x.payload_json or {}, "created_by": x.created_by, "created_at": x.fecha_creacion} for x in sorted(issue.events, key=lambda x: x.id)],
        attachments=[_serialize_attachment(x) for x in sorted(issue.attachments, key=lambda x: x.id)],
    )


def _query(db, project_id, company_id):
    return db.query(BimIssue).options(joinedload(BimIssue.comments), joinedload(BimIssue.events), joinedload(BimIssue.attachments)).filter(BimIssue.proyecto_id == project_id, BimIssue.empresa_id == company_id)


def _is_valid_image(content_type, content):
    if content_type == "image/jpeg":
        return content.startswith(b"\xff\xd8\xff")
    if content_type == "image/png":
        return content.startswith(b"\x89PNG\r\n\x1a\n")
    if content_type == "image/webp":
        return len(content) >= 12 and content[:4] == b"RIFF" and content[8:12] == b"WEBP"
    return False


def _validate_refs(db, project_id, company_id, version_id=None, assigned_to=None):
    if version_id and not db.query(BimModelVersion).join(BimModel).filter(BimModelVersion.id == version_id, BimModel.proyecto_id == project_id, BimModel.empresa_id == company_id).first():
        raise HTTPException(status_code=404, detail="Version BIM fuera del proyecto activo.")
    if assigned_to and not db.query(Usuario).filter(Usuario.id == assigned_to, Usuario.empresa_id == company_id).first():
        raise HTTPException(status_code=404, detail="Responsable fuera de la empresa activa.")


def get_issue(db, *, issue_id, project_id, company_id):
    issue = _query(db, project_id, company_id).filter(BimIssue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Incidencia BIM no encontrada.")
    return _serialize(issue)


def list_issues(db, *, project_id, company_id):
    return [_serialize(item) for item in _query(db, project_id, company_id).order_by(BimIssue.id.desc()).all()]


def create_issue(db, *, project_id, company_id, user_id, payload, topic_guid=None):
    _validate_refs(db, project_id, company_id, payload.version_id, payload.assigned_to)
    issue = BimIssue(topic_guid=topic_guid or str(uuid.uuid4()), proyecto_id=project_id, empresa_id=company_id, bim_model_version_id=payload.version_id, title=payload.title, description=payload.description, priority=payload.priority, status="assigned" if payload.assigned_to else "open", assigned_to=payload.assigned_to, created_by=user_id, viewpoint_json=payload.viewpoint.model_dump(mode="json"))
    db.add(issue)
    db.flush()
    db.add(BimIssueEvent(bim_issue_id=issue.id, event_type="created", payload_json={"status": issue.status}, created_by=user_id))
    db.commit()
    return get_issue(db, issue_id=issue.id, project_id=project_id, company_id=company_id)


def update_issue(db, *, issue_id, project_id, company_id, user_id, payload):
    issue = _query(db, project_id, company_id).filter(BimIssue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Incidencia BIM no encontrada.")
    values = payload.model_dump(exclude_unset=True)
    _validate_refs(db, project_id, company_id, assigned_to=values.get("assigned_to"))
    changes = {}
    for key, value in values.items():
        previous = getattr(issue, key)
        if previous != value:
            setattr(issue, key, value)
            changes[key] = {"from": previous, "to": value}
    if changes:
        db.add(BimIssueEvent(bim_issue_id=issue.id, event_type="updated", payload_json=changes, created_by=user_id))
    db.commit()
    return get_issue(db, issue_id=issue.id, project_id=project_id, company_id=company_id)


def add_issue_comment(db, *, issue_id, project_id, company_id, user_id, body):
    issue = _query(db, project_id, company_id).filter(BimIssue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Incidencia BIM no encontrada.")
    db.add(BimIssueComment(bim_issue_id=issue.id, body=body, created_by=user_id))
    db.add(BimIssueEvent(bim_issue_id=issue.id, event_type="commented", payload_json={}, created_by=user_id))
    db.commit()
    return get_issue(db, issue_id=issue.id, project_id=project_id, company_id=company_id)


def add_issue_attachment(db, *, issue_id, project_id, company_id, user_id, filename, content_type, content):
    issue = _query(db, project_id, company_id).filter(BimIssue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Incidencia BIM no encontrada.")
    normalized_type = (content_type or "").lower().split(";", 1)[0].strip()
    if normalized_type not in ISSUE_IMAGE_TYPES or not _is_valid_image(normalized_type, content):
        raise HTTPException(status_code=415, detail="La evidencia debe ser una imagen JPEG, PNG o WebP valida.")
    if not content or len(content) > MAX_ISSUE_ATTACHMENT_BYTES:
        raise HTTPException(status_code=413, detail="La evidencia debe tener entre 1 byte y 10 MB.")
    checksum = hashlib.sha256(content).hexdigest()
    if db.query(BimIssueAttachment).filter(BimIssueAttachment.bim_issue_id == issue.id, BimIssueAttachment.checksum_sha256 == checksum).first():
        raise HTTPException(status_code=409, detail="La evidencia ya fue registrada en esta incidencia.")
    safe_filename = (filename or "evidencia").replace("\\", "/").rsplit("/", 1)[-1][:255] or "evidencia"
    attachment = BimIssueAttachment(
        bim_issue_id=issue.id, filename=safe_filename, content_type=normalized_type,
        byte_size=len(content), checksum_sha256=checksum, content=content, uploaded_by=user_id,
    )
    db.add(attachment)
    db.flush()
    db.add(BimIssueEvent(
        bim_issue_id=issue.id, event_type="attachment_added",
        payload_json={"attachment_id": attachment.id, "filename": safe_filename, "checksum_sha256": checksum},
        created_by=user_id,
    ))
    db.commit()
    db.refresh(attachment)
    return _serialize_attachment(attachment)


def get_issue_attachment(db, *, attachment_id, issue_id, project_id, company_id):
    attachment = db.query(BimIssueAttachment).join(BimIssue).filter(
        BimIssueAttachment.id == attachment_id,
        BimIssueAttachment.bim_issue_id == issue_id,
        BimIssue.proyecto_id == project_id,
        BimIssue.empresa_id == company_id,
    ).first()
    if not attachment:
        raise HTTPException(status_code=404, detail="Evidencia de incidencia BIM no encontrada.")
    return attachment


def export_issue_bcf(issue):
    markup = ET.Element("Markup")
    topic = ET.SubElement(markup, "Topic", {"Guid": issue.topic_guid, "TopicStatus": issue.status})
    ET.SubElement(topic, "Title").text = issue.title
    ET.SubElement(topic, "Priority").text = issue.priority
    ET.SubElement(topic, "Description").text = issue.description or ""
    view_guid = str(uuid.uuid5(uuid.NAMESPACE_URL, issue.topic_guid))
    ET.SubElement(ET.SubElement(markup, "Viewpoints"), "Viewpoint", {"Guid": view_guid}).text = "viewpoint.bcfv"
    viewpoint = ET.Element("VisualizationInfo", {"Guid": view_guid})
    selection = ET.SubElement(ET.SubElement(viewpoint, "Components"), "Selection")
    for guid in issue.viewpoint.selected_guids:
        ET.SubElement(selection, "Component", {"IfcGuid": guid})
    output = io.BytesIO()
    with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("bcf.version", '<?xml version="1.0"?><Version VersionId="2.1"/>')
        archive.writestr(f"{issue.topic_guid}/markup.bcf", ET.tostring(markup, encoding="utf-8", xml_declaration=True))
        archive.writestr(f"{issue.topic_guid}/viewpoint.bcfv", ET.tostring(viewpoint, encoding="utf-8", xml_declaration=True))
    return output.getvalue()


def import_issue_bcf(db, *, content, project_id, company_id, user_id, version_id=None):
    try:
        with zipfile.ZipFile(io.BytesIO(content)) as archive:
            markup_name = next(name for name in archive.namelist() if name.endswith("markup.bcf"))
            root = ET.fromstring(archive.read(markup_name))
            topic = root.find("Topic")
            ref = root.find("./Viewpoints/Viewpoint")
            selected = []
            if ref is not None and ref.text:
                view = ET.fromstring(archive.read(f"{markup_name.rsplit('/', 1)[0]}/{ref.text}"))
                selected = [item.get("IfcGuid") for item in view.findall("./Components/Selection/Component") if item.get("IfcGuid")]
    except (zipfile.BadZipFile, StopIteration, ET.ParseError, KeyError) as exc:
        raise HTTPException(status_code=400, detail="Archivo BCF 2.1 invalido o incompleto.") from exc
    if topic is None:
        raise HTTPException(status_code=400, detail="BCF sin Topic.")
    guid = topic.get("Guid") or str(uuid.uuid4())
    existing = _query(db, project_id, company_id).filter(BimIssue.topic_guid == guid).first()
    if existing:
        return _serialize(existing)
    priority = (topic.findtext("Priority") or "normal").lower()
    payload = BimIssueCreateRequest(title=topic.findtext("Title") or "Incidencia BCF", description=topic.findtext("Description"), version_id=version_id, priority=priority if priority in {"low", "normal", "high", "critical"} else "normal", viewpoint={"source_version_id": version_id, "selected_guids": selected})
    return create_issue(db, project_id=project_id, company_id=company_id, user_id=user_id, payload=payload, topic_guid=guid)
