from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.project_capability_grant import ProjectCapabilityGrant
from app.models.proyecto import Proyecto
from app.models.proyecto_asignacion import ProyectoAsignacion
from app.models.usuario import Usuario


PROJECT_CAPABILITIES = {
    "project.view",
    "project.manage",
    "project.audit.view",
    "project.audit.export",
    "budget.view",
    "budget.edit",
    "budget.propose",
    "budget.approve",
    "schedule.view",
    "schedule.edit",
    "schedule.baseline.propose",
    "schedule.baseline.approve",
    "bim.view",
    "bim.review",
    "bim.coordinate",
    "bim.publish",
    "bim.admin",
    "bim.schedule.view",
    "bim.schedule.link",
    "bim.progress.report",
    "bim.classification.view",
    "bim.classification.resolve",
    "bim.classification.approve",
    "coordination.view",
    "coordination.edit",
    "coordination.propose",
    "coordination.review",
    "coordination.approve",
    "coordination.apply",
    "coordination.recover",
    "coordination.import",
    "coordination.migration.dry_run",
    "coordination.migration.apply",
}

# Canonical action inventory consumed by API clients. Roles suggest a starting
# profile; this registry is the authority for what each user action requires.
PROJECT_ACTION_CAPABILITIES = {
    "project.open": {"domain": "project", "capability": "project.view", "bim_required": False, "risk": "read"},
    "project.configure": {"domain": "project", "capability": "project.manage", "bim_required": False, "risk": "controlled_write"},
    "project.audit.view": {"domain": "project", "capability": "project.audit.view", "bim_required": False, "risk": "read"},
    "project.audit.export": {"domain": "project", "capability": "project.audit.export", "bim_required": False, "risk": "export"},
    "budget.open": {"domain": "budget", "capability": "budget.view", "bim_required": False, "risk": "read"},
    "budget.edit": {"domain": "budget", "capability": "budget.edit", "bim_required": False, "risk": "write"},
    "budget.propose": {"domain": "budget", "capability": "budget.propose", "bim_required": False, "risk": "proposal"},
    "budget.approve": {"domain": "budget", "capability": "budget.approve", "bim_required": False, "risk": "approval"},
    "schedule.open": {"domain": "schedule", "capability": "schedule.view", "bim_required": False, "risk": "read"},
    "schedule.edit": {"domain": "schedule", "capability": "schedule.edit", "bim_required": False, "risk": "write"},
    "schedule.baseline.propose": {"domain": "schedule", "capability": "schedule.baseline.propose", "bim_required": False, "risk": "proposal"},
    "schedule.baseline.approve": {"domain": "schedule", "capability": "schedule.baseline.approve", "bim_required": False, "risk": "approval"},
    "bim.open": {"domain": "bim", "capability": "bim.view", "bim_required": True, "risk": "read"},
    "bim.review": {"domain": "bim", "capability": "bim.review", "bim_required": True, "risk": "write"},
    "bim.coordinate": {"domain": "bim", "capability": "bim.coordinate", "bim_required": True, "risk": "write"},
    "bim.publish": {"domain": "bim", "capability": "bim.publish", "bim_required": True, "risk": "approval"},
    "bim.admin": {"domain": "bim", "capability": "bim.admin", "bim_required": True, "risk": "administration"},
    "bim.schedule.open": {"domain": "coordination", "capability": "bim.schedule.view", "bim_required": True, "risk": "read"},
    "bim.schedule.link": {"domain": "coordination", "capability": "bim.schedule.link", "bim_required": True, "risk": "proposal"},
    "bim.progress.report": {"domain": "coordination", "capability": "bim.progress.report", "bim_required": True, "risk": "write"},
    "classification.open": {"domain": "classification", "capability": "bim.classification.view", "bim_required": True, "risk": "read"},
    "classification.resolve": {"domain": "classification", "capability": "bim.classification.resolve", "bim_required": True, "risk": "write"},
    "classification.approve": {"domain": "classification", "capability": "bim.classification.approve", "bim_required": True, "risk": "approval"},
    "coordination.open": {"domain": "coordination", "capability": "coordination.view", "bim_required": False, "risk": "read"},
    "coordination.edit": {"domain": "coordination", "capability": "coordination.edit", "bim_required": False, "risk": "write"},
    "coordination.propose": {"domain": "coordination", "capability": "coordination.propose", "bim_required": False, "risk": "proposal"},
    "coordination.review": {"domain": "coordination", "capability": "coordination.review", "bim_required": False, "risk": "review"},
    "coordination.approve": {"domain": "coordination", "capability": "coordination.approve", "bim_required": False, "risk": "approval"},
    "coordination.apply": {"domain": "coordination", "capability": "coordination.apply", "bim_required": False, "risk": "controlled_write"},
    "coordination.recover": {"domain": "coordination", "capability": "coordination.recover", "bim_required": False, "risk": "controlled_write"},
    "coordination.import": {"domain": "coordination", "capability": "coordination.import", "bim_required": False, "risk": "staging"},
    "migration.dry_run": {"domain": "migration", "capability": "coordination.migration.dry_run", "bim_required": False, "risk": "read"},
    "migration.apply": {"domain": "migration", "capability": "coordination.migration.apply", "bim_required": False, "risk": "critical"},
}

PROFILE_CAPABILITIES = {
    "consultor_integral": PROJECT_CAPABILITIES,
    "costes": {
        "project.view", "budget.view", "budget.edit", "budget.propose",
        "coordination.view", "coordination.edit", "coordination.propose", "coordination.import",
        "bim.view", "bim.schedule.view", "bim.classification.view",
    },
    "planificador": {
        "project.view", "schedule.view", "schedule.edit", "schedule.baseline.propose",
        "coordination.view", "coordination.edit", "coordination.propose", "coordination.import",
        "bim.view", "bim.schedule.view", "bim.schedule.link",
    },
    "coordinador_bim": {
        "project.view", "bim.view", "bim.review", "bim.coordinate", "bim.publish",
        "bim.schedule.view", "bim.schedule.link", "bim.classification.view",
        "bim.classification.resolve", "coordination.view", "coordination.edit",
        "coordination.propose", "coordination.review", "coordination.import",
    },
    "produccion_campo": {
        "project.view", "schedule.view", "bim.view", "bim.review",
        "bim.schedule.view", "bim.progress.report", "coordination.view",
    },
    "revisor": {
        "project.view", "budget.view", "schedule.view", "bim.view", "bim.review",
        "bim.schedule.view", "bim.classification.view", "coordination.view",
        "coordination.review",
    },
    "administrador_bim": {
        "project.view", "project.manage", "project.audit.view", "bim.view", "bim.review",
        "bim.coordinate", "bim.publish", "bim.admin", "bim.schedule.view",
        "bim.schedule.link", "bim.progress.report", "bim.classification.view",
        "bim.classification.resolve", "coordination.view", "coordination.edit",
        "coordination.propose", "coordination.review", "coordination.apply",
        "coordination.recover", "coordination.import", "coordination.migration.dry_run",
    },
}

# Complete the machine-readable responsibility matrix after profiles exist.
# This is served to administration UX and is also a release-time contract: an
# action without a responsible profile or backend enforcement is invalid.
for _action in PROJECT_ACTION_CAPABILITIES.values():
    _action["owner"] = _action["domain"]
    _action["enforcement"] = "backend"
    _action["status"] = "active"
    _action["responsible_profiles"] = sorted(
        profile for profile, capabilities in PROFILE_CAPABILITIES.items()
        if _action["capability"] in capabilities
    )

MODULE_BASE_CAPABILITIES = {
    "presupuestos": {"project.view", "budget.view"},
    "presupuesto": {"project.view", "budget.view"},
    "cronogramas": {"project.view", "schedule.view"},
    "planificacion": {"project.view", "schedule.view"},
    "bim": {"project.view", "bim.view", "bim.review", "bim.schedule.view", "coordination.view"},
    "stakeholders": {"project.view"},
    "formula_polinomica": {"project.view", "budget.view"},
    "desagregacion": {"project.view", "budget.view"},
}

# Administrators retain the technical/BIM profile, plus read access to the
# classic economic and planning modules. Mutating/approval capabilities remain
# explicit and are intentionally not inherited here.
TECHNICAL_OPERATOR_CAPABILITIES = set(PROFILE_CAPABILITIES["administrador_bim"]) | {
    "budget.view",
    "schedule.view",
}


@dataclass(frozen=True)
class ResolvedProjectCapabilities:
    capabilities: frozenset[str]
    edt_ids: tuple[int, ...]
    modules: tuple[str, ...]
    source: str


def _role_key(role: str | None) -> str:
    return (role or "").strip().lower()


def _scope_key(edt_id: int | None) -> str:
    return f"edt:{int(edt_id)}" if edt_id is not None else "project"


def _validate_capabilities(capabilities: Iterable[str]) -> set[str]:
    normalized = {str(item).strip() for item in capabilities if str(item).strip()}
    invalid = normalized - PROJECT_CAPABILITIES
    if invalid:
        raise HTTPException(status_code=400, detail=f"Capacidades de proyecto invalidas: {sorted(invalid)}")
    return normalized


def resolve_project_capabilities(
    db: Session,
    *,
    project_id: int,
    user_id: int,
    company_id: int,
    role: str | None,
    edt_id: int | None = None,
) -> ResolvedProjectCapabilities:
    project = db.query(Proyecto).filter(Proyecto.id == project_id, Proyecto.empresa_id == company_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto fuera de la empresa activa.")

    role_key = _role_key(role)
    if role_key in {"administrador", "superadministrador"}:
        return ResolvedProjectCapabilities(
            capabilities=frozenset(TECHNICAL_OPERATOR_CAPABILITIES),
            edt_ids=(),
            modules=("todos",),
            source="technical_operator",
        )

    assignments = db.query(ProyectoAsignacion).filter(
        ProyectoAsignacion.proyecto_id == project_id,
        ProyectoAsignacion.usuario_id == user_id,
    ).all()
    if not assignments:
        return ResolvedProjectCapabilities(frozenset(), (), (), "unassigned")

    applicable = [item for item in assignments if item.edt_id is None or edt_id is None or item.edt_id == edt_id]
    modules = {item.modulo or "todos" for item in applicable}
    edt_ids = {int(item.edt_id) for item in applicable if item.edt_id is not None}
    base: set[str] = {"project.view"}
    if "todos" in modules:
        base.update({"budget.view", "schedule.view", "bim.view", "bim.review", "bim.schedule.view", "coordination.view"})
    for module in modules:
        base.update(MODULE_BASE_CAPABILITIES.get(module, set()))

    grants_query = db.query(ProjectCapabilityGrant).filter(
        ProjectCapabilityGrant.empresa_id == company_id,
        ProjectCapabilityGrant.proyecto_id == project_id,
        ProjectCapabilityGrant.usuario_id == user_id,
        ProjectCapabilityGrant.active.is_(True),
    )
    grants = grants_query.all()
    for grant in grants:
        if grant.edt_id is None or edt_id is None or int(grant.edt_id) == int(edt_id):
            base.update(set(grant.capabilities_json or []) & PROJECT_CAPABILITIES)

    return ResolvedProjectCapabilities(
        capabilities=frozenset(base),
        edt_ids=tuple(sorted(edt_ids)),
        modules=tuple(sorted(modules)),
        source="assignment_and_grants",
    )


def require_project_capability(db: Session, *, capability: str, **scope) -> ResolvedProjectCapabilities:
    resolved = resolve_project_capabilities(db, **scope)
    if capability not in resolved.capabilities:
        raise HTTPException(status_code=403, detail=f"Capacidad de proyecto requerida: {capability}.")
    return resolved


def require_project_user_capability(
    db: Session, *, project_id: int, user_id: int, capability: str
) -> ResolvedProjectCapabilities:
    """Fail-closed bridge for classic endpoints that currently receive user IDs."""
    project = db.query(Proyecto).filter(Proyecto.id == project_id).first()
    user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not project or not user:
        raise HTTPException(status_code=404, detail="Usuario o proyecto no encontrado.")
    return require_project_capability(
        db,
        capability=capability,
        project_id=project.id,
        user_id=user.id,
        company_id=project.empresa_id,
        role=user.rol,
    )


def save_project_capability_grant(
    db: Session,
    *,
    project_id: int,
    company_id: int,
    user_id: int,
    capabilities: Iterable[str],
    granted_by: int,
    edt_id: int | None = None,
    profile_code: str | None = None,
) -> ProjectCapabilityGrant:
    project = db.query(Proyecto).filter(Proyecto.id == project_id, Proyecto.empresa_id == company_id).first()
    user = db.query(Usuario).filter(Usuario.id == user_id, Usuario.empresa_id == company_id).first()
    if not project or not user:
        raise HTTPException(status_code=404, detail="Usuario o proyecto fuera de la empresa activa.")
    if profile_code and profile_code not in PROFILE_CAPABILITIES:
        raise HTTPException(status_code=400, detail="Perfil funcional de proyecto invalido.")
    requested = _validate_capabilities(capabilities)
    if profile_code:
        requested.update(PROFILE_CAPABILITIES[profile_code])
    scope_key = _scope_key(edt_id)
    grant = db.query(ProjectCapabilityGrant).filter(
        ProjectCapabilityGrant.empresa_id == company_id,
        ProjectCapabilityGrant.proyecto_id == project_id,
        ProjectCapabilityGrant.usuario_id == user_id,
        ProjectCapabilityGrant.scope_key == scope_key,
    ).first()
    if not grant:
        grant = ProjectCapabilityGrant(
            empresa_id=company_id,
            proyecto_id=project_id,
            usuario_id=user_id,
            edt_id=edt_id,
            scope_key=scope_key,
        )
        db.add(grant)
    grant.profile_code = profile_code
    grant.capabilities_json = sorted(requested)
    grant.granted_by = granted_by
    grant.active = True
    db.commit()
    db.refresh(grant)
    return grant
