from sqlalchemy import inspect, or_
from sqlalchemy.orm import Session

from app.models.bim_view_state import BimViewState

WORKSPACE_CONTEXT_SCOPE = "workspace_context"
WORKSPACE_CONTEXT_NAME = "__last_workspace_context__"


def ensure_bim_view_state_table(db: Session) -> None:
    bind = db.get_bind()
    if bind is None:
        return
    BimViewState.__table__.create(bind=bind, checkfirst=True)


def bim_view_state_table_ready(db: Session) -> bool:
    ensure_bim_view_state_table(db)
    inspector = inspect(db.bind)
    return "bim_view_states" in set(inspector.get_table_names())


def list_view_states_for_project(
    db: Session,
    *,
    project_id: int,
    company_id: int,
    user_id: int,
) -> list[BimViewState]:
    if not bim_view_state_table_ready(db):
        return []

    return (
        db.query(BimViewState)
        .filter(
            BimViewState.proyecto_id == project_id,
            BimViewState.empresa_id == company_id,
            BimViewState.scope != WORKSPACE_CONTEXT_SCOPE,
            or_(BimViewState.usuario_id == user_id, BimViewState.scope == "company"),
        )
        .order_by(BimViewState.scope.asc(), BimViewState.fecha_creacion.desc(), BimViewState.id.desc())
        .all()
    )


def get_view_state_for_project(
    db: Session,
    *,
    project_id: int,
    company_id: int,
    user_id: int,
    view_state_id: int,
) -> BimViewState | None:
    if not bim_view_state_table_ready(db):
        return None

    return (
        db.query(BimViewState)
        .filter(
            BimViewState.id == view_state_id,
            BimViewState.proyecto_id == project_id,
            BimViewState.empresa_id == company_id,
            BimViewState.scope != WORKSPACE_CONTEXT_SCOPE,
            or_(BimViewState.usuario_id == user_id, BimViewState.scope == "company"),
        )
        .first()
    )


def upsert_named_view_state_for_project(
    db: Session,
    *,
    project_id: int,
    company_id: int,
    user_id: int,
    name: str,
    scope: str,
    bim_model_version_id: int | None,
    payload: dict,
) -> BimViewState:
    ensure_bim_view_state_table(db)

    normalized_name = (name or "").strip()
    normalized_scope = (scope or "personal").strip() or "personal"

    state = (
        db.query(BimViewState)
        .filter(
            BimViewState.proyecto_id == project_id,
            BimViewState.empresa_id == company_id,
            BimViewState.scope == normalized_scope,
            BimViewState.nombre == normalized_name,
            or_(BimViewState.usuario_id == user_id, BimViewState.scope == "company"),
        )
        .first()
    )
    if state is None:
        state = BimViewState(
            proyecto_id=project_id,
            empresa_id=company_id,
            usuario_id=user_id,
            bim_model_version_id=bim_model_version_id,
            nombre=normalized_name,
            scope=normalized_scope,
            payload=payload,
        )
        db.add(state)
    else:
        state.bim_model_version_id = bim_model_version_id
        state.payload = payload
        db.add(state)

    db.commit()
    db.refresh(state)
    return state


def delete_view_state_for_project(
    db: Session,
    *,
    project_id: int,
    company_id: int,
    user_id: int,
    view_state_id: int,
) -> bool:
    state = get_view_state_for_project(
        db,
        project_id=project_id,
        company_id=company_id,
        user_id=user_id,
        view_state_id=view_state_id,
    )
    if state is None:
        return False

    db.delete(state)
    db.commit()
    return True


def rename_view_state_for_project(
    db: Session,
    *,
    project_id: int,
    company_id: int,
    user_id: int,
    view_state_id: int,
    name: str,
) -> BimViewState | None:
    state = get_view_state_for_project(
        db,
        project_id=project_id,
        company_id=company_id,
        user_id=user_id,
        view_state_id=view_state_id,
    )
    if state is None:
        return None

    normalized_name = (name or "").strip()
    if not normalized_name:
        return None

    conflict = (
        db.query(BimViewState)
        .filter(
            BimViewState.id != view_state_id,
            BimViewState.proyecto_id == project_id,
            BimViewState.empresa_id == company_id,
            BimViewState.scope == state.scope,
            BimViewState.nombre == normalized_name,
            or_(BimViewState.usuario_id == user_id, BimViewState.scope == "company"),
        )
        .first()
    )
    if conflict is not None:
        return conflict

    state.nombre = normalized_name
    db.add(state)
    db.commit()
    db.refresh(state)
    return state


def duplicate_view_state_for_project(
    db: Session,
    *,
    project_id: int,
    company_id: int,
    user_id: int,
    view_state_id: int,
    name: str | None = None,
    target_scope: str | None = None,
) -> BimViewState | None:
    source_state = get_view_state_for_project(
        db,
        project_id=project_id,
        company_id=company_id,
        user_id=user_id,
        view_state_id=view_state_id,
    )
    if source_state is None:
        return None

    normalized_scope = (target_scope or source_state.scope or "personal").strip() or "personal"
    base_name = (name or "").strip() or f"{source_state.nombre} copia"
    candidate_name = base_name
    suffix = 2

    while (
        db.query(BimViewState)
        .filter(
            BimViewState.proyecto_id == project_id,
            BimViewState.empresa_id == company_id,
            BimViewState.scope == normalized_scope,
            BimViewState.nombre == candidate_name,
            or_(BimViewState.usuario_id == user_id, BimViewState.scope == "company"),
        )
        .first()
        is not None
    ):
        candidate_name = f"{base_name} {suffix}"
        suffix += 1

    duplicated_state = BimViewState(
        proyecto_id=source_state.proyecto_id,
        empresa_id=source_state.empresa_id,
        usuario_id=user_id,
        bim_model_version_id=source_state.bim_model_version_id,
        nombre=candidate_name,
        scope=normalized_scope,
        payload=source_state.payload,
    )
    db.add(duplicated_state)
    db.commit()
    db.refresh(duplicated_state)
    return duplicated_state


def get_workspace_context_for_project(
    db: Session,
    *,
    project_id: int,
    company_id: int,
    user_id: int,
) -> BimViewState | None:
    if not bim_view_state_table_ready(db):
        return None

    return (
        db.query(BimViewState)
        .filter(
            BimViewState.proyecto_id == project_id,
            BimViewState.empresa_id == company_id,
            BimViewState.usuario_id == user_id,
            BimViewState.scope == WORKSPACE_CONTEXT_SCOPE,
            BimViewState.nombre == WORKSPACE_CONTEXT_NAME,
        )
        .order_by(BimViewState.id.desc())
        .first()
    )


def upsert_workspace_context_for_project(
    db: Session,
    *,
    project_id: int,
    company_id: int,
    user_id: int,
    bim_model_version_id: int | None,
    payload: dict,
) -> BimViewState:
    ensure_bim_view_state_table(db)

    state = get_workspace_context_for_project(
        db,
        project_id=project_id,
        company_id=company_id,
        user_id=user_id,
    )
    if state is None:
        state = BimViewState(
            proyecto_id=project_id,
            empresa_id=company_id,
            usuario_id=user_id,
            bim_model_version_id=bim_model_version_id,
            nombre=WORKSPACE_CONTEXT_NAME,
            scope=WORKSPACE_CONTEXT_SCOPE,
            payload=payload,
        )
        db.add(state)
    else:
        state.bim_model_version_id = bim_model_version_id
        state.payload = payload
        db.add(state)

    db.commit()
    db.refresh(state)
    return state
