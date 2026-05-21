import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.services.license import license_service


def main():
    db = SessionLocal()
    try:
        result = license_service.run_license_housekeeping_for_all_companies(db)
        print(result)
    finally:
        db.close()


if __name__ == "__main__":
    main()
