from sqlalchemy import inspect
from sqlalchemy.orm import Session

from app.models.system_bim_setting import SystemBimSetting


def ensure_system_bim_settings_table(db: Session) -> None:
    bind = db.get_bind()
    if bind is None:
        return
    SystemBimSetting.__table__.create(bind=bind, checkfirst=True)


def system_bim_settings_table_ready(db: Session) -> bool:
    inspector = inspect(db.bind)
    return "system_bim_settings" in set(inspector.get_table_names())


def get_or_create_system_bim_setting(db: Session) -> SystemBimSetting:
    ensure_system_bim_settings_table(db)

    config = db.query(SystemBimSetting).order_by(SystemBimSetting.id.asc()).first()
    if config:
        return config

    config = SystemBimSetting(
        titulo="Activación BIM",
        descripcion="Semilla inicial BIM para trabajo controlado de superadministración dentro de GiProy.",
        is_enabled=True,
        superadmin_only=True,
        allowed_company_ids=None,
    )
    db.add(config)
    db.commit()
    db.refresh(config)
    return config
