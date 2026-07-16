from sqlalchemy.orm import Session

from app.models.marketplace import MarketplaceProductCategory


FIXED_MARKETPLACE_CATEGORIES = [
    {
        "nombre": "Licencias",
        "slug": "tienda-licencias",
        "descripcion": "Productos comerciales del sistema orientados a licenciamiento.",
        "visibility_scope": "all",
        "sort_order": 10,
        "activa": True,
    },
    {
        "nombre": "Packs SaaS",
        "slug": "tienda-packs-saas",
        "descripcion": "Packs comerciales SaaS que amplian capacidades sobre licencias base.",
        "visibility_scope": "all",
        "sort_order": 15,
        "activa": True,
    },
    {
        "nombre": "Modulos y servicios",
        "slug": "tienda-modulos-servicios",
        "descripcion": "Modulos independientes y servicios comerciales de pago unico o activacion manual.",
        "visibility_scope": "all",
        "sort_order": 18,
        "activa": True,
    },
    {
        "nombre": "APUs",
        "slug": "tienda-apus",
        "descripcion": "Productos de tipo APU. Su flujo posterior podrá especializarse.",
        "visibility_scope": "all",
        "sort_order": 20,
        "activa": True,
    },
    {
        "nombre": "Bases Maestras",
        "slug": "tienda-bases-maestras",
        "descripcion": "Productos de tipo base maestra para catálogo técnico o comercial.",
        "visibility_scope": "all",
        "sort_order": 30,
        "activa": True,
    },
    {
        "nombre": "Proyectos",
        "slug": "tienda-proyectos",
        "descripcion": "Productos orientados a proyectos completos dentro del marketplace.",
        "visibility_scope": "all",
        "sort_order": 40,
        "activa": True,
    },
    {
        "nombre": "Portal de compras públicas",
        "slug": "tienda-portal-compras-publicas",
        "descripcion": "Productos ligados al portal de compras públicas y sus servicios asociados.",
        "visibility_scope": "all",
        "sort_order": 50,
        "activa": True,
    },
]


def bootstrap_system_marketplace_categories(db: Session) -> list[MarketplaceProductCategory]:
    created_or_updated: list[MarketplaceProductCategory] = []
    fixed_slugs = {item["slug"] for item in FIXED_MARKETPLACE_CATEGORIES}

    for item in FIXED_MARKETPLACE_CATEGORIES:
        category = (
            db.query(MarketplaceProductCategory)
            .filter(MarketplaceProductCategory.slug == item["slug"])
            .first()
        )

        if category is None:
            category = MarketplaceProductCategory(**item)
        else:
            category.nombre = item["nombre"]
            category.descripcion = item["descripcion"]
            category.visibility_scope = item["visibility_scope"]
            category.sort_order = item["sort_order"]
            category.activa = item["activa"]

        db.add(category)
        created_or_updated.append(category)

    (
        db.query(MarketplaceProductCategory)
        .filter(MarketplaceProductCategory.slug.notin_(fixed_slugs))
        .update({"activa": False}, synchronize_session=False)
    )

    db.commit()

    for category in created_or_updated:
        db.refresh(category)

    return created_or_updated
