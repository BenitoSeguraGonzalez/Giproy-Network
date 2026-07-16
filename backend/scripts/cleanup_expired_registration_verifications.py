from __future__ import annotations

from app.api.endpoints.auth import _purge_expired_pending_registration_tokens
from app.core.database import SessionLocal


def main() -> None:
    db = SessionLocal()
    try:
        purged = _purge_expired_pending_registration_tokens(db)
        print(f"expired_pending_registrations_purged={purged}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
