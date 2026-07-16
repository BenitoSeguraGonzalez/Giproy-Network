from app.core.database import SessionLocal
from app.services.transferencias import transferencias_service


def main() -> None:
    db = SessionLocal()
    try:
        result = transferencias_service.sanitize_admin_public_codes(db)
        db.commit()
        print(
            "sanitize_transfer_admin_codes:",
            f"scanned_admin_users={result['scanned_admin_users']}",
            f"created_codes={result['created_codes']}",
            f"existing_codes={result['existing_codes']}",
        )
    finally:
        db.close()


if __name__ == "__main__":
    main()
