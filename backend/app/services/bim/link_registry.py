from typing import Optional

from fastapi import HTTPException
from sqlalchemy import String, cast, or_
from sqlalchemy.orm import Session

from app.models.apu import APU
from app.models.bim_element import BimElement
from app.models.bim_link_apu import BimLinkApu
from app.models.bim_link_edt import BimLinkEdt
from app.models.bim_link_presupuesto import BimLinkPresupuesto
from app.models.bim_model import BimModel
from app.models.bim_model_version import BimModelVersion
from app.models.edt import EdtNode
from app.models.presupuesto import Presupuesto, PresupuestoDetalle
from app.schemas.bim_link import BimElementOptionResponse, BimElementPageResponse, BimLinkCreateRequest, BimLinkResponse
from app.services.bim.model_registry import ensure_bim_domain_tables


def _element_query(db: Session, *, project_id: int, company_id: int):
    return (
        db.query(BimElement)
        .join(BimModelVersion, BimModelVersion.id == BimElement.bim_model_version_id)
        .join(BimModel, BimModel.id == BimModelVersion.bim_model_id)
        .filter(BimModel.proyecto_id == project_id, BimModel.empresa_id == company_id)
    )


def list_elements_for_project(
    db: Session,
    *,
    project_id: int,
    company_id: int,
    version_id: Optional[int] = None,
    limit: int = 120,
) -> list[BimElementOptionResponse]:
    ensure_bim_domain_tables(db)
    query = _element_query(db, project_id=project_id, company_id=company_id)
    if version_id is not None:
        query = query.filter(BimElement.bim_model_version_id == version_id)
    else:
        query = query.order_by(BimElement.id.desc())

    elements = query.limit(limit).all()
    return [BimElementOptionResponse.model_validate(element, from_attributes=True) for element in elements]


def search_elements_for_project(
    db: Session,
    *,
    project_id: int,
    company_id: int,
    version_id: Optional[int] = None,
    query_text: Optional[str] = None,
    page: int = 1,
    page_size: int = 100,
) -> BimElementPageResponse:
    ensure_bim_domain_tables(db)
    query = _element_query(db, project_id=project_id, company_id=company_id)
    if version_id is not None:
        query = query.filter(BimElement.bim_model_version_id == version_id)

    normalized_query = (query_text or "").strip()
    if normalized_query:
        pattern = f"%{normalized_query}%"
        query = query.filter(
            or_(
                BimElement.global_id.ilike(pattern),
                BimElement.nombre.ilike(pattern),
                BimElement.ifc_class.ilike(pattern),
                BimElement.storey_name.ilike(pattern),
                BimElement.system_name.ilike(pattern),
                BimElement.classification.ilike(pattern),
                BimElement.descripcion.ilike(pattern),
                cast(BimElement.properties, String).ilike(pattern),
            )
        )

    total = query.count()
    safe_page_size = max(1, min(page_size, 200))
    safe_page = max(1, page)
    pages = max(1, (total + safe_page_size - 1) // safe_page_size)
    safe_page = min(safe_page, pages)
    elements = (
        query.order_by(BimElement.storey_name.asc(), BimElement.ifc_class.asc(), BimElement.nombre.asc(), BimElement.id.asc())
        .offset((safe_page - 1) * safe_page_size)
        .limit(safe_page_size)
        .all()
    )
    return BimElementPageResponse(
        items=[BimElementOptionResponse.model_validate(element, from_attributes=True) for element in elements],
        total=total,
        page=safe_page,
        page_size=safe_page_size,
        pages=pages,
    )


def _resolve_element_for_project(db: Session, *, project_id: int, company_id: int, element_id: int) -> BimElement:
    element = _element_query(db, project_id=project_id, company_id=company_id).filter(BimElement.id == element_id).first()
    if not element:
        raise HTTPException(status_code=404, detail="Elemento BIM no encontrado para el proyecto.")
    return element


def _target_label_for_edt(target: EdtNode) -> str:
    code = target.codigo or f"EDT-{target.id}"
    name = target.nombre or "Nodo EDT"
    return f"{code} - {name}"


def _target_label_for_apu(target: APU) -> str:
    code = target.codigo or f"APU-{target.id}"
    name = target.descripcion or "APU"
    return f"{code} - {name}"


def _target_label_for_presupuesto(target: PresupuestoDetalle) -> str:
    code = target.codigo_item or f"DET-{target.id}"
    name = target.descripcion or "Línea de presupuesto"
    return f"{code} - {name}"


def _serialize_edt_link(link: BimLinkEdt) -> BimLinkResponse:
    return BimLinkResponse(
        id=link.id,
        target_type="edt",
        bim_element_id=link.bim_element_id,
        bim_element_global_id=link.element.global_id,
        bim_element_nombre=link.element.nombre,
        target_id=link.edt_node_id,
        target_label=_target_label_for_edt(link.edt_node),
        link_type=link.link_type,
        notes=link.notes,
        created_by=link.created_by,
        fecha_creacion=link.fecha_creacion,
    )


def _serialize_apu_link(link: BimLinkApu) -> BimLinkResponse:
    return BimLinkResponse(
        id=link.id,
        target_type="apu",
        bim_element_id=link.bim_element_id,
        bim_element_global_id=link.element.global_id,
        bim_element_nombre=link.element.nombre,
        target_id=link.apu_id,
        target_label=_target_label_for_apu(link.apu),
        link_type=link.link_type,
        notes=link.notes,
        created_by=link.created_by,
        fecha_creacion=link.fecha_creacion,
    )


def _serialize_presupuesto_link(link: BimLinkPresupuesto) -> BimLinkResponse:
    return BimLinkResponse(
        id=link.id,
        target_type="presupuesto",
        bim_element_id=link.bim_element_id,
        bim_element_global_id=link.element.global_id,
        bim_element_nombre=link.element.nombre,
        target_id=link.presupuesto_detalle_id,
        target_label=_target_label_for_presupuesto(link.presupuesto_detalle),
        link_type=link.link_type,
        notes=link.notes,
        created_by=link.created_by,
        fecha_creacion=link.fecha_creacion,
    )


def _map(serializer, rows):
    return [serializer(row) for row in rows]


def list_links_for_project(
    db: Session,
    *,
    project_id: int,
    company_id: int,
    limit: int = 80,
) -> list[BimLinkResponse]:
    ensure_bim_domain_tables(db)

    edt_links = (
        db.query(BimLinkEdt)
        .join(BimElement, BimElement.id == BimLinkEdt.bim_element_id)
        .join(BimModelVersion, BimModelVersion.id == BimElement.bim_model_version_id)
        .join(BimModel, BimModel.id == BimModelVersion.bim_model_id)
        .join(EdtNode, EdtNode.id == BimLinkEdt.edt_node_id)
        .filter(BimModel.proyecto_id == project_id, BimModel.empresa_id == company_id)
        .order_by(BimLinkEdt.fecha_creacion.desc(), BimLinkEdt.id.desc())
        .limit(limit)
        .all()
    )
    apu_links = (
        db.query(BimLinkApu)
        .join(BimElement, BimElement.id == BimLinkApu.bim_element_id)
        .join(BimModelVersion, BimModelVersion.id == BimElement.bim_model_version_id)
        .join(BimModel, BimModel.id == BimModelVersion.bim_model_id)
        .join(APU, APU.id == BimLinkApu.apu_id)
        .filter(BimModel.proyecto_id == project_id, BimModel.empresa_id == company_id)
        .order_by(BimLinkApu.fecha_creacion.desc(), BimLinkApu.id.desc())
        .limit(limit)
        .all()
    )
    presupuesto_links = (
        db.query(BimLinkPresupuesto)
        .join(BimElement, BimElement.id == BimLinkPresupuesto.bim_element_id)
        .join(BimModelVersion, BimModelVersion.id == BimElement.bim_model_version_id)
        .join(BimModel, BimModel.id == BimModelVersion.bim_model_id)
        .join(PresupuestoDetalle, PresupuestoDetalle.id == BimLinkPresupuesto.presupuesto_detalle_id)
        .join(Presupuesto, Presupuesto.id == PresupuestoDetalle.presupuesto_id)
        .filter(
            BimModel.proyecto_id == project_id,
            BimModel.empresa_id == company_id,
            Presupuesto.proyecto_id == project_id,
            Presupuesto.empresa_id == company_id,
        )
        .order_by(BimLinkPresupuesto.fecha_creacion.desc(), BimLinkPresupuesto.id.desc())
        .limit(limit)
        .all()
    )

    serialized = [
        *_map(_serialize_edt_link, edt_links),
        *_map(_serialize_apu_link, apu_links),
        *_map(_serialize_presupuesto_link, presupuesto_links),
    ]
    serialized.sort(key=lambda item: (item.fecha_creacion, item.id), reverse=True)
    return serialized[:limit]


def create_link_for_project(
    db: Session,
    *,
    project_id: int,
    company_id: int,
    user_id: int,
    payload: BimLinkCreateRequest,
) -> BimLinkResponse:
    ensure_bim_domain_tables(db)
    element = _resolve_element_for_project(
        db,
        project_id=project_id,
        company_id=company_id,
        element_id=payload.bim_element_id,
    )

    if payload.target_type == "edt":
        target = (
            db.query(EdtNode)
            .filter(
                EdtNode.id == payload.target_id,
                EdtNode.proyecto_id == project_id,
                EdtNode.empresa_id == company_id,
            )
            .first()
        )
        if not target:
            raise HTTPException(status_code=404, detail="Nodo EDT no encontrado para el proyecto.")
        link = (
            db.query(BimLinkEdt)
            .filter(BimLinkEdt.bim_element_id == element.id, BimLinkEdt.edt_node_id == target.id)
            .first()
        )
        if not link:
            link = BimLinkEdt(
                bim_element_id=element.id,
                edt_node_id=target.id,
                link_type=payload.link_type,
                notes=payload.notes,
                created_by=user_id,
            )
            db.add(link)
            db.commit()
            db.refresh(link)
        return _serialize_edt_link(link)

    if payload.target_type == "apu":
        target = db.query(APU).filter(APU.id == payload.target_id, APU.empresa_id == company_id).first()
        if not target:
            raise HTTPException(status_code=404, detail="APU no encontrado para la empresa activa.")
        link = (
            db.query(BimLinkApu)
            .filter(BimLinkApu.bim_element_id == element.id, BimLinkApu.apu_id == target.id)
            .first()
        )
        if not link:
            link = BimLinkApu(
                bim_element_id=element.id,
                apu_id=target.id,
                link_type=payload.link_type,
                notes=payload.notes,
                created_by=user_id,
            )
            db.add(link)
            db.commit()
            db.refresh(link)
        return _serialize_apu_link(link)

    target = (
        db.query(PresupuestoDetalle)
        .join(Presupuesto, Presupuesto.id == PresupuestoDetalle.presupuesto_id)
        .filter(
            PresupuestoDetalle.id == payload.target_id,
            Presupuesto.proyecto_id == project_id,
            Presupuesto.empresa_id == company_id,
        )
        .first()
    )
    if not target:
        raise HTTPException(status_code=404, detail="Línea de presupuesto no encontrada para el proyecto.")
    link = (
        db.query(BimLinkPresupuesto)
        .filter(
            BimLinkPresupuesto.bim_element_id == element.id,
            BimLinkPresupuesto.presupuesto_detalle_id == target.id,
        )
        .first()
    )
    if not link:
        link = BimLinkPresupuesto(
            bim_element_id=element.id,
            presupuesto_detalle_id=target.id,
            link_type=payload.link_type,
            notes=payload.notes,
            created_by=user_id,
        )
        db.add(link)
        db.commit()
        db.refresh(link)
    return _serialize_presupuesto_link(link)


def delete_link_for_project(
    db: Session,
    *,
    project_id: int,
    company_id: int,
    target_type: str,
    link_id: int,
) -> None:
    ensure_bim_domain_tables(db)
    if target_type == "edt":
        link = (
            db.query(BimLinkEdt)
            .join(BimElement, BimElement.id == BimLinkEdt.bim_element_id)
            .join(BimModelVersion, BimModelVersion.id == BimElement.bim_model_version_id)
            .join(BimModel, BimModel.id == BimModelVersion.bim_model_id)
            .filter(BimLinkEdt.id == link_id, BimModel.proyecto_id == project_id, BimModel.empresa_id == company_id)
            .first()
        )
    elif target_type == "apu":
        link = (
            db.query(BimLinkApu)
            .join(BimElement, BimElement.id == BimLinkApu.bim_element_id)
            .join(BimModelVersion, BimModelVersion.id == BimElement.bim_model_version_id)
            .join(BimModel, BimModel.id == BimModelVersion.bim_model_id)
            .filter(BimLinkApu.id == link_id, BimModel.proyecto_id == project_id, BimModel.empresa_id == company_id)
            .first()
        )
    elif target_type == "presupuesto":
        link = (
            db.query(BimLinkPresupuesto)
            .join(BimElement, BimElement.id == BimLinkPresupuesto.bim_element_id)
            .join(BimModelVersion, BimModelVersion.id == BimElement.bim_model_version_id)
            .join(BimModel, BimModel.id == BimModelVersion.bim_model_id)
            .filter(
                BimLinkPresupuesto.id == link_id,
                BimModel.proyecto_id == project_id,
                BimModel.empresa_id == company_id,
            )
            .first()
        )
    else:
        raise HTTPException(status_code=400, detail="Tipo de vínculo BIM no soportado.")

    if not link:
        raise HTTPException(status_code=404, detail="Vínculo BIM no encontrado.")

    db.delete(link)
    db.commit()
