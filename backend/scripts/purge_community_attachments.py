from app.api.endpoints.community import purge_expired_community_attachments
from app.core.database import SessionLocal


def main() -> None:
    db = SessionLocal()
    try:
        purged = purge_expired_community_attachments(db)
        print({"purged_attachments": purged})
    finally:
        db.close()


if __name__ == "__main__":
    main()
