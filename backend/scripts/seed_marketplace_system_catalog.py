import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.services.marketplace_catalog_bootstrap import bootstrap_system_marketplace_catalog


def main() -> None:
    db = SessionLocal()
    try:
        products = bootstrap_system_marketplace_catalog(db)
        print("Bootstrap de catálogo Marketplace Sistema completado.")
        for product in products:
            print(
                f"id={product.id} slug={product.slug} titulo={product.titulo} "
                f"type={product.product_type} seller={product.seller_user_id} category_id={product.category_id}"
            )
    finally:
        db.close()


if __name__ == "__main__":
    main()
