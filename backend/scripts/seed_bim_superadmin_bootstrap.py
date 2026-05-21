from app.core.database import SessionLocal
from app.services.system_bim_setting import get_or_create_system_bim_setting


def main() -> None:
    db = SessionLocal()
    try:
        config = get_or_create_system_bim_setting(db)
        print("BIM bootstrap listo")
        print(f"id={config.id}")
        print(f"is_enabled={config.is_enabled}")
        print(f"superadmin_only={config.superadmin_only}")
        print(f"allowed_company_ids={config.allowed_company_ids}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
