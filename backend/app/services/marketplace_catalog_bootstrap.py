import random
from decimal import Decimal
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.marketplace import MarketplaceProduct, MarketplaceProductCategory
from app.models.usuario import Usuario


SYSTEM_MARKETPLACE_PRODUCTS = [
    {
        "slug": "sistema-licencia-estandar-mensual",
        "titulo": "Licencia Estándar Mensual",
        "resumen": "Plan SaaS mensual para equipos que ya superaron el arranque Express.",
        "descripcion": "Licencia comercial mensual para empresas que necesitan operación funcional estable con un nivel de capacidad superior a Express.",
        "incluye": "Acceso funcional del plan Estándar, vigencia mensual y activación comercial tras pago confirmado.",
        "no_incluye": "Implantación a medida, migraciones asistidas ni soporte prioritario.",
        "product_type": "licencia",
        "precio": Decimal("39.99"),
        "category_slug": "tienda-licencias",
        "etiquetas": ["licencia", "estandar", "mensual", "saas"],
        "license_offer": {
            "plan_kind": "estandar",
            "license_code": "STD",
            "license_name": "Estándar",
            "billing_cycle": "monthly",
            "duration_months": 1,
        },
    },
    {
        "slug": "sistema-licencia-estandar-anual",
        "titulo": "Licencia Estándar Anual",
        "resumen": "Plan SaaS anual Estándar para empresas con operación continua.",
        "descripcion": "Licencia comercial anual del plan Estándar para organizaciones que buscan continuidad operativa con un coste anual consolidado.",
        "incluye": "Acceso funcional del plan Estándar, vigencia anual y activación comercial tras pago confirmado.",
        "no_incluye": "Implantación a medida, migraciones asistidas ni soporte prioritario.",
        "product_type": "licencia",
        "precio": Decimal("399.49"),
        "category_slug": "tienda-licencias",
        "etiquetas": ["licencia", "estandar", "anual", "saas"],
        "license_offer": {
            "plan_kind": "estandar",
            "license_code": "STD",
            "license_name": "Estándar",
            "billing_cycle": "annual",
            "duration_months": 12,
        },
    },
    {
        "slug": "sistema-licencia-profesional-mensual",
        "titulo": "Licencia Profesional Mensual",
        "resumen": "Plan SaaS mensual para operación técnica y administrativa avanzada.",
        "descripcion": "Licencia comercial mensual del plan Profesional, orientada a empresas con una carga operativa más exigente y necesidad de mayor capacidad.",
        "incluye": "Acceso funcional del plan Profesional, vigencia mensual y activación comercial tras pago confirmado.",
        "no_incluye": "Implantación a medida, migraciones asistidas ni soporte prioritario.",
        "product_type": "licencia",
        "precio": Decimal("69.99"),
        "category_slug": "tienda-licencias",
        "etiquetas": ["licencia", "profesional", "mensual", "saas"],
        "license_offer": {
            "plan_kind": "profesional",
            "license_code": "PRO",
            "license_name": "Profesional",
            "billing_cycle": "monthly",
            "duration_months": 1,
        },
    },
    {
        "slug": "sistema-licencia-profesional-anual",
        "titulo": "Licencia Profesional Anual",
        "resumen": "Plan SaaS anual Profesional para continuidad operativa consolidada.",
        "descripcion": "Licencia comercial anual del plan Profesional para equipos que operan de forma sostenida y necesitan una vigencia amplia sin solapes.",
        "incluye": "Acceso funcional del plan Profesional, vigencia anual y activación comercial tras pago confirmado.",
        "no_incluye": "Implantación a medida, migraciones asistidas ni soporte prioritario.",
        "product_type": "licencia",
        "precio": Decimal("755.99"),
        "category_slug": "tienda-licencias",
        "etiquetas": ["licencia", "profesional", "anual", "saas"],
        "license_offer": {
            "plan_kind": "profesional",
            "license_code": "PRO",
            "license_name": "Profesional",
            "billing_cycle": "annual",
            "duration_months": 12,
        },
    },
    {
        "slug": "sistema-licencia-empresarial-mensual",
        "titulo": "Licencia Empresarial Mensual",
        "resumen": "Plan SaaS mensual para operación multiárea y necesidades corporativas.",
        "descripcion": "Licencia comercial mensual del plan Empresarial para organizaciones que requieren una capa de capacidad superior y continuidad comercial fuerte.",
        "incluye": "Acceso funcional del plan Empresarial, vigencia mensual y activación comercial tras pago confirmado.",
        "no_incluye": "Implantación a medida, migraciones asistidas ni soporte prioritario.",
        "product_type": "licencia",
        "precio": Decimal("199.99"),
        "category_slug": "tienda-licencias",
        "etiquetas": ["licencia", "empresarial", "mensual", "saas"],
        "license_offer": {
            "plan_kind": "empresarial",
            "license_code": "EMP",
            "license_name": "Empresarial",
            "billing_cycle": "monthly",
            "duration_months": 1,
        },
    },
    {
        "slug": "sistema-licencia-empresarial-anual",
        "titulo": "Licencia Empresarial Anual",
        "resumen": "Plan SaaS anual Empresarial para continuidad corporativa completa.",
        "descripcion": "Licencia comercial anual del plan Empresarial para organizaciones que operan a escala y necesitan continuidad amplia sin solapes entre periodos.",
        "incluye": "Acceso funcional del plan Empresarial, vigencia anual y activación comercial tras pago confirmado.",
        "no_incluye": "Implantación a medida, migraciones asistidas ni soporte prioritario.",
        "product_type": "licencia",
        "precio": Decimal("2159.99"),
        "category_slug": "tienda-licencias",
        "etiquetas": ["licencia", "empresarial", "anual", "saas"],
        "license_offer": {
            "plan_kind": "empresarial",
            "license_code": "EMP",
            "license_name": "Empresarial",
            "billing_cycle": "annual",
            "duration_months": 12,
        },
    },
    {
        "slug": "sistema-addon-actualizacion-presupuestos",
        "titulo": "Actualización Presupuestos Pro",
        "resumen": "Paquete de mejora para endurecer operación clásica de presupuestos.",
        "descripcion": "Actualización comercial orientada a desplegar mejoras funcionales y de usabilidad sobre el módulo de presupuestos clásico.",
        "incluye": "Mejoras UX, endurecimientos funcionales y ajuste de comportamientos estándar.",
        "no_incluye": "Desarrollos exclusivos por empresa.",
        "product_type": "addon",
        "precio": Decimal("29.00"),
        "category_slug": "tienda-apus",
        "etiquetas": ["actualizacion", "presupuestos", "pro"],
    },
    {
        "slug": "sistema-addon-actualizacion-apus",
        "titulo": "Actualización Editor APU",
        "resumen": "Mejora funcional orientada al creador y editor clásico de APUs.",
        "descripcion": "Paquete pensado para mantener actualizado el flujo clásico de creación, edición y navegación operativa en APUs.",
        "incluye": "Ajustes UX, mejoras de continuidad y endurecimientos de operación.",
        "no_incluye": "Refactorizaciones fuera del alcance estándar.",
        "product_type": "addon",
        "precio": Decimal("24.00"),
        "category_slug": "tienda-apus",
        "etiquetas": ["actualizacion", "apu", "editor"],
    },
    {
        "slug": "sistema-addon-actualizacion-proyectos",
        "titulo": "Actualización Proyectos Control",
        "resumen": "Evolutivo comercial para seguimiento y gestión del módulo Proyectos.",
        "descripcion": "Paquete de actualización orientado a consolidar seguimiento, datos de proyecto y trazabilidad operativa clásica.",
        "incluye": "Mejoras de proyecto, endurecimientos de flujo y ajustes de lectura.",
        "no_incluye": "Cambios estructurales fuera de la capa clásica.",
        "product_type": "addon",
        "precio": Decimal("34.00"),
        "category_slug": "tienda-proyectos",
        "etiquetas": ["actualizacion", "proyectos", "control"],
    },
    {
        "slug": "sistema-addon-pack-catalogo-tecnico",
        "titulo": "Pack Catálogo Técnico",
        "resumen": "Pack evolutivo para mejorar lectura y uso del catálogo técnico clásico.",
        "descripcion": "Pensado para reforzar exploración de bases, catálogos y activos comerciales dentro del entorno GiProy.",
        "incluye": "Ajustes de lectura, navegación y consistencia del catálogo técnico.",
        "no_incluye": "Modelados comerciales a medida.",
        "product_type": "addon",
        "precio": Decimal("27.00"),
        "category_slug": "tienda-bases-maestras",
        "etiquetas": ["pack", "catalogo", "tecnico"],
    },
    {
        "slug": "sistema-addon-pack-reportes-ejecutivos",
        "titulo": "Pack Reportes Ejecutivos",
        "resumen": "Ampliación orientada a lectura ejecutiva y seguimiento comercial.",
        "descripcion": "Complemento comercial enfocado en visibilidad de métricas, estados y recorridos de control dentro del sistema.",
        "incluye": "Bloques de lectura ejecutiva y mejoras sobre superficies de seguimiento.",
        "no_incluye": "BI externo ni integraciones corporativas.",
        "product_type": "addon",
        "precio": Decimal("44.00"),
        "category_slug": "tienda-bases-maestras",
        "etiquetas": ["reportes", "ejecutivo", "addon"],
    },
    {
        "slug": "sistema-addon-pack-migracion-clasica",
        "titulo": "Pack Migración Clásica",
        "resumen": "Paquete comercial para acompañar migraciones controladas dentro del entorno clásico.",
        "descripcion": "Pensado para despliegues que necesitan una mejora operativa en procesos de transición o regularización funcional.",
        "incluye": "Ajustes estándar de transición y acompañamiento funcional base.",
        "no_incluye": "Migración masiva compleja de fuentes externas.",
        "product_type": "addon",
        "precio": Decimal("59.00"),
        "category_slug": "tienda-apus",
        "etiquetas": ["migracion", "clasico", "pack"],
    },
    {
        "slug": "sistema-servicio-onboarding-equipo",
        "titulo": "Onboarding de Equipo",
        "resumen": "Servicio adicional de acompañamiento para adopción inicial del equipo.",
        "descripcion": "Servicio comercial pensado para ayudar al arranque funcional del equipo operativo sobre la capa clásica.",
        "incluye": "Sesión de acompañamiento inicial y revisión base de uso.",
        "no_incluye": "Capacitación extendida por múltiples jornadas.",
        "product_type": "adicional",
        "precio": Decimal("69.00"),
        "category_slug": "tienda-proyectos",
        "etiquetas": ["servicio", "onboarding", "equipo"],
    },
    {
        "slug": "sistema-servicio-revision-operativa",
        "titulo": "Revisión Operativa Inicial",
        "resumen": "Servicio de chequeo base para revisar el estado operativo del entorno.",
        "descripcion": "Permite revisar configuración, estado general y puntos críticos de la operación clásica antes de avanzar.",
        "incluye": "Chequeo funcional, revisión base y devolución inicial.",
        "no_incluye": "Intervención profunda ni rediseño de procesos.",
        "product_type": "adicional",
        "precio": Decimal("79.00"),
        "category_slug": "tienda-proyectos",
        "etiquetas": ["servicio", "revision", "operativa"],
    },
    {
        "slug": "sistema-servicio-parametrizacion-base",
        "titulo": "Parametrización Base",
        "resumen": "Servicio de ajuste inicial de parámetros clave del entorno.",
        "descripcion": "Ayuda a dejar lista la configuración mínima operativa para comenzar a trabajar con mejor control desde el primer día.",
        "incluye": "Revisión y ajuste base de parámetros críticos.",
        "no_incluye": "Configuraciones avanzadas por vertical específica.",
        "product_type": "adicional",
        "precio": Decimal("95.00"),
        "category_slug": "tienda-bases-maestras",
        "etiquetas": ["servicio", "parametrizacion", "base"],
    },
    {
        "slug": "sistema-servicio-acompanamiento-puesta-marcha",
        "titulo": "Acompañamiento Puesta en Marcha",
        "resumen": "Servicio adicional de arranque operativo controlado.",
        "descripcion": "Orientado a acompañar la puesta en marcha del entorno y reducir fricción durante las primeras jornadas de uso.",
        "incluye": "Acompañamiento inicial, chequeo funcional y seguimiento corto de arranque.",
        "no_incluye": "Mesa dedicada continua ni SLA extendido.",
        "product_type": "adicional",
        "precio": Decimal("119.00"),
        "category_slug": "tienda-apus",
        "etiquetas": ["servicio", "puesta-marcha", "acompanamiento"],
    },
    {
        "slug": "sistema-servicio-limpieza-catalogo",
        "titulo": "Limpieza de Catálogo",
        "resumen": "Servicio para ordenar y sanear catálogos clásicos antes de operación intensiva.",
        "descripcion": "Permite abordar de forma controlada problemas de orden, consistencia o ruido en el catálogo comercial y técnico clásico.",
        "incluye": "Revisión de consistencia y propuesta base de saneamiento.",
        "no_incluye": "Reclasificación masiva compleja fuera del estándar.",
        "product_type": "adicional",
        "precio": Decimal("109.00"),
        "category_slug": "tienda-bases-maestras",
        "etiquetas": ["servicio", "catalogo", "saneamiento"],
    },
    {
        "slug": "sistema-servicio-ajuste-marketplace",
        "titulo": "Ajuste Operativo Marketplace",
        "resumen": "Servicio adicional orientado a preparar la operación comercial de tienda.",
        "descripcion": "Pensado para revisar catálogo, estructura comercial y continuidad operativa del Marketplace clásico.",
        "incluye": "Revisión base de tienda, catálogo y estructura de publicación.",
        "no_incluye": "Diseño visual a medida ni automatizaciones especiales.",
        "product_type": "adicional",
        "precio": Decimal("129.00"),
        "category_slug": "tienda-proyectos",
        "etiquetas": ["servicio", "marketplace", "operacion"],
    },
    {
        "slug": "sistema-servicio-soporte-prioritario-mensual",
        "titulo": "Soporte Prioritario Mensual",
        "resumen": "Servicio recurrente de atención funcional prioritaria.",
        "descripcion": "Complemento comercial para organizaciones que requieren una vía más rápida de soporte funcional dentro del alcance estándar.",
        "incluye": "Atención prioritaria, seguimiento funcional y resolución dentro del alcance comercial definido.",
        "no_incluye": "Desarrollo de nuevas capacidades fuera del producto.",
        "product_type": "adicional",
        "precio": Decimal("139.00"),
        "category_slug": "tienda-proyectos",
        "etiquetas": ["soporte", "prioritario", "mensual"],
    },
]

LEGACY_SYSTEM_LICENSE_SLUGS = {
    "sistema-licencia-profesional-plus",
    "sistema-licencia-obra-esencial",
    "sistema-licencia-control-presupuestario",
    "sistema-licencia-gestion-ejecutiva",
    "sistema-licencia-multiempresa-control",
}


PACK_SALES_VARIANTS = [
    {"sale_mode": "pack", "min_quantity": 2, "default_quantity": 2, "quantity_step": 1, "max_quantity": 10},
    {"sale_mode": "pack", "min_quantity": 3, "default_quantity": 3, "quantity_step": 3, "max_quantity": 24},
    {"sale_mode": "pack", "min_quantity": 5, "default_quantity": 5, "quantity_step": 5, "max_quantity": 50},
    {"sale_mode": "pack", "min_quantity": 10, "default_quantity": 10, "quantity_step": 10, "max_quantity": 100},
]


def build_sample_sales_config(index: int, product_type: str) -> dict:
    normalized_type = (product_type or "").strip().lower()
    if normalized_type == "licencia":
        return {
            "sale_mode": "unit",
            "min_quantity": 1,
            "default_quantity": 1,
            "quantity_step": 1,
            "max_quantity": 1,
        }

    if index % 3 == 0:
        return {
            "sale_mode": "unit",
            "min_quantity": 1,
            "default_quantity": 1,
            "quantity_step": 1,
            "max_quantity": 1,
        }

    return dict(PACK_SALES_VARIANTS[index % len(PACK_SALES_VARIANTS)])


def build_sample_publication_window(index: int) -> tuple[str, str]:
    today = datetime.now(timezone.utc).date()
    start_date = today - timedelta(days=1)
    rng = random.Random(20260328 + index)
    end_date = start_date + timedelta(days=rng.randint(14, 180))
    return start_date.isoformat(), end_date.isoformat()


def bootstrap_system_marketplace_catalog(db: Session) -> list[MarketplaceProduct]:
    superadmin = (
        db.query(Usuario)
        .filter(Usuario.rol.ilike("superadministrador"))
        .order_by(Usuario.id.asc())
        .first()
    )
    if not superadmin:
        raise ValueError("No existe un superadministrador disponible para bootstrapear el catálogo de Sistema.")

    categories = {
        category.slug: category
        for category in db.query(MarketplaceProductCategory).all()
    }

    created_or_updated: list[MarketplaceProduct] = []
    active_system_slugs = {item["slug"] for item in SYSTEM_MARKETPLACE_PRODUCTS}
    legacy_system_products = (
        db.query(MarketplaceProduct)
        .filter(MarketplaceProduct.slug.in_(LEGACY_SYSTEM_LICENSE_SLUGS))
        .all()
    )
    for legacy_product in legacy_system_products:
        if legacy_product.slug not in active_system_slugs:
            legacy_product.activo = False
            db.add(legacy_product)

    for index, item in enumerate(SYSTEM_MARKETPLACE_PRODUCTS):
        category = categories.get(item["category_slug"])
        if not category:
            raise ValueError(f"No existe la categoría requerida para bootstrap: {item['category_slug']}")

        publication_start, publication_end = build_sample_publication_window(index)
        product = (
            db.query(MarketplaceProduct)
            .filter(MarketplaceProduct.slug == item["slug"])
            .first()
        )

        if product is None:
            product = MarketplaceProduct(
                slug=item["slug"],
                seller_user_id=superadmin.id,
                approved_by_user_id=superadmin.id,
                product_kind="manual",
                source_type=None,
                source_id=None,
                moneda="USD",
                requiere_aprobacion=False,
                activo=True,
                estado="approved",
                ventas_count=0,
                rating_promedio=Decimal("0"),
            )

        product.titulo = item["titulo"]
        product.resumen = item["resumen"]
        product.descripcion = item["descripcion"]
        product.incluye = item["incluye"]
        product.no_incluye = item["no_incluye"]
        product.product_type = item["product_type"]
        product.precio = item["precio"]
        product.category_id = category.id
        product.etiquetas = list(item["etiquetas"])
        product_meta = {
            "codigo": item["slug"].upper().replace("-", "_"),
            "precio_con_iva": f"{Decimal(item['precio']):.2f}",
            "fecha_inicio_publicacion": publication_start,
            "fecha_fin_publicacion": publication_end,
            "creador": "Sistema",
        }
        if item["product_type"] == "licencia":
            product_meta["license_offer"] = dict(item.get("license_offer") or {})

        product.vista_previa = {
            "kind": "system_catalog",
            "category": category.nombre,
            "seller_label": "Sistema",
            "sales_config": build_sample_sales_config(index, item["product_type"]),
            "product_meta": product_meta,
        }

        db.add(product)
        created_or_updated.append(product)

    db.commit()

    for product in created_or_updated:
        db.refresh(product)

    return created_or_updated
