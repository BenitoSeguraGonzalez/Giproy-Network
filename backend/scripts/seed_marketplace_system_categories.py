import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.services.marketplace_bootstrap import bootstrap_system_marketplace_categories


def main() -> None:
    db = SessionLocal()
    try:
        categories = bootstrap_system_marketplace_categories(db)
        print("Bootstrap de categorías Marketplace Sistema completado.")
        for category in categories:
            print(
                f"id={category.id} slug={category.slug} nombre={category.nombre} "
                f"scope={category.visibility_scope} activa={category.activa}"
            )
    finally:
        db.close()


if __name__ == "__main__":
    main()
