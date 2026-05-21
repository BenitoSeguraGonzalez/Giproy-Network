from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.system_maintenance import SystemMaintenance


def get_or_create_system_maintenance(db: Session) -> SystemMaintenance:
    config = db.query(SystemMaintenance).order_by(SystemMaintenance.id.asc()).first()
    if config:
        return config

    config = SystemMaintenance(
        titulo="Mantenimiento del sistema",
        mensaje="Se están aplicando tareas de mantenimiento. Guarde su trabajo y vuelva a intentarlo en unos minutos.",
        mode="readonly",
        is_enabled=False,
    )
    db.add(config)
    db.commit()
    db.refresh(config)
    return config


def is_system_maintenance_active(config: SystemMaintenance | None, now: datetime | None = None) -> bool:
    if not config or not config.is_enabled:
        return False

    now = now or datetime.now(timezone.utc)
    if config.starts_at and config.starts_at > now:
        return False
    if config.ends_at and config.ends_at < now:
        return False
    return True
