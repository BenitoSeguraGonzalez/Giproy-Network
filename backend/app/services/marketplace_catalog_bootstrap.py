import random
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.marketplace import MarketplaceProduct, MarketplaceProductCategory
from app.models.usuario import Usuario


def _license_product(
    *,
    slug: str,
    title: str,
    summary: str,
    monthly: bool,
    plan_kind: str,
    license_code: str,
    license_name: str,
    price: str,
    description: str,
    included_packs: list[str] | None = None,
    legacy_slugs: list[str] | None = None,
) -> dict:
    billing_cycle = "monthly" if monthly else "annual"
    duration_months = 1 if monthly else 12
    period_label = "mensual" if monthly else "anual"
    return {
        "slug": slug,
        "legacy_slugs": legacy_slugs or [],
        "titulo": title,
        "resumen": summary,
        "descripcion": description,
        "incluye": (
            f"Licencia {license_name} {period_label}, activacion comercial tras pago confirmado, "
            "vigencia controlada por Licencias y auditoria de cambio de plan."
        ),
        "no_incluye": "Packs no indicados como incluidos, servicios asistidos, migraciones especiales ni soporte fuera del alcance del plan.",
        "product_type": "licencia",
        "precio": Decimal(price),
        "category_slug": "tienda-licencias",
        "etiquetas": ["licencia", plan_kind, billing_cycle, "saas"],
        "commercial_meta": {
            "commercial_code": f"LIC_{license_code}_{billing_cycle.upper()}",
            "commercial_family": "base_license",
            "billing_period": billing_cycle,
            "duration_months": duration_months,
            "delivery_kind": "empresa_licencia",
            "activation_policy": "marketplace_order_confirmed",
            "requires_superadmin_edit": True,
            "included_packs": included_packs or [],
        },
        "license_offer": {
            "plan_kind": plan_kind,
            "license_code": license_code,
            "license_name": license_name,
            "billing_cycle": billing_cycle,
            "duration_months": duration_months,
        },
    }


def _addon_product(
    *,
    slug: str,
    title: str,
    summary: str,
    price: str,
    annual: bool = False,
    code: str,
    description: str,
    requires_base_plan: list[str],
    includes: str,
    category_slug: str = "tienda-packs-saas",
    tags: list[str] | None = None,
    activation_policy: str = "future_saas_right",
    delivery_kind: str = "saas_right",
    extra_commercial_meta: dict | None = None,
    sales_config: dict | None = None,
    legacy_slugs: list[str] | None = None,
) -> dict:
    billing_cycle = "annual" if annual else "monthly"
    duration_months = 12 if annual else 1
    return {
        "slug": slug,
        "legacy_slugs": legacy_slugs or [],
        "titulo": title,
        "resumen": summary,
        "descripcion": description,
        "incluye": includes,
        "no_incluye": "Activacion automatica de permisos fuera de la entrega SaaS controlada; integraciones a medida.",
        "product_type": "addon",
        "precio": Decimal(price),
        "category_slug": category_slug,
        "etiquetas": tags or ["pack", code.lower(), billing_cycle, "saas"],
        "sales_config": sales_config,
        "commercial_meta": {
            "commercial_code": code,
            "commercial_family": "pack",
            "billing_period": billing_cycle,
            "duration_months": duration_months,
            "delivery_kind": delivery_kind,
            "activation_policy": activation_policy,
            "requires_base_plan": requires_base_plan,
            "requires_superadmin_edit": True,
            **dict(extra_commercial_meta or {}),
        },
    }


def _service_product(
    *,
    slug: str,
    title: str,
    summary: str,
    price: str,
    code: str,
    description: str,
    includes: str,
    tags: list[str] | None = None,
    legacy_slugs: list[str] | None = None,
) -> dict:
    return {
        "slug": slug,
        "legacy_slugs": legacy_slugs or [],
        "titulo": title,
        "resumen": summary,
        "descripcion": description,
        "incluye": includes,
        "no_incluye": "Suscripcion base, packs SaaS, soporte continuo o desarrollos no contratados expresamente.",
        "product_type": "adicional",
        "precio": Decimal(price),
        "category_slug": "tienda-modulos-servicios",
        "etiquetas": tags or ["modulo", code.lower(), "pago-unico"],
        "commercial_meta": {
            "commercial_code": code,
            "commercial_family": "independent_module",
            "billing_period": "one_time",
            "duration_months": None,
            "delivery_kind": "manual_service_or_future_saas_right",
            "activation_policy": "manual_admin_control",
            "requires_superadmin_edit": True,
        },
    }


SYSTEM_MARKETPLACE_PRODUCTS = [
    {
        "slug": "sistema-licencia-express-trial-control",
        "titulo": "Licencia Express Trial",
        "resumen": "Entrada de control del trial/freemium de 30 dias asignado al registro.",
        "descripcion": "Producto de control para documentar la licencia Express. No se vende desde checkout porque su asignacion es automatica al registrar empresa.",
        "incluye": "Trial de 30 dias, limites bajos, marca de agua y ruta de conversion comercial.",
        "no_incluye": "Compra directa desde Marketplace ni renovacion comercial.",
        "product_type": "licencia",
        "precio": Decimal("0.00"),
        "category_slug": "tienda-licencias",
        "etiquetas": ["licencia", "express", "trial", "control"],
        "activo": False,
        "estado": "approved",
        "commercial_meta": {
            "commercial_code": "LIC_EXPRESS_TRIAL_CONTROL",
            "commercial_family": "base_license_control",
            "billing_period": "trial",
            "duration_months": 1,
            "delivery_kind": "system_default_registration",
            "activation_policy": "registration_only",
            "requires_superadmin_edit": True,
            "checkout_enabled": False,
        },
    },
    _license_product(
        slug="sistema-licencia-estandar-mensual",
        title="Licencia Estándar Mensual",
        summary="Plan SaaS mensual comercial base para operación regular.",
        monthly=True,
        plan_kind="estandar",
        license_code="STANDARD",
        license_name="Estándar",
        price="25.00",
        description="Licencia comercial base para empresas que necesitan APUs y presupuestos sin capacidades premium incluidas.",
        legacy_slugs=["sistema-licencia-obra-esencial"],
    ),
    _license_product(
        slug="sistema-licencia-estandar-anual",
        title="Licencia Estándar Anual",
        summary="Plan SaaS anual Estándar con ahorro frente al pago mensual.",
        monthly=False,
        plan_kind="estandar",
        license_code="STANDARD",
        license_name="Estándar",
        price="250.00",
        description="Licencia comercial anual Estándar para continuidad operativa con precio anual consolidado.",
        legacy_slugs=["sistema-licencia-control-presupuestario"],
    ),
    _license_product(
        slug="sistema-licencia-profesional-mensual",
        title="Licencia Profesional Mensual",
        summary="Plan SaaS mensual premium con Planifica y Licita incluidos.",
        monthly=True,
        plan_kind="profesional",
        license_code="PROFESSIONAL",
        license_name="Profesional",
        price="40.00",
        description="Licencia comercial premium para operacion avanzada con packs Planifica y Licita incluidos segun el plan aprobado.",
        included_packs=["PACK_PLANIFICA", "PACK_LICITA"],
        legacy_slugs=["sistema-licencia-profesional-plus"],
    ),
    _license_product(
        slug="sistema-licencia-profesional-anual",
        title="Licencia Profesional Anual",
        summary="Plan SaaS anual Profesional con Planifica y Licita incluidos.",
        monthly=False,
        plan_kind="profesional",
        license_code="PROFESSIONAL",
        license_name="Profesional",
        price="400.00",
        description="Licencia comercial anual Profesional para continuidad premium y precio anual consolidado.",
        included_packs=["PACK_PLANIFICA", "PACK_LICITA"],
        legacy_slugs=["sistema-licencia-gestion-ejecutiva"],
    ),
    {
        "slug": "sistema-licencia-tester-control",
        "titulo": "Licencia Tester",
        "resumen": "Entrada de control para empresas tester con feedback y canal directo.",
        "descripcion": "Licencia especial no publica; su asignacion debe permanecer bajo control administrativo.",
        "incluye": "Acceso especial de feedback, canal directo y modulos experimentales segun aprobacion.",
        "no_incluye": "Compra publica desde Marketplace.",
        "product_type": "licencia",
        "precio": Decimal("0.00"),
        "category_slug": "tienda-licencias",
        "etiquetas": ["licencia", "tester", "control"],
        "activo": False,
        "commercial_meta": {
            "commercial_code": "LIC_TESTER_CONTROL",
            "commercial_family": "special_license_control",
            "billing_period": "manual",
            "delivery_kind": "manual_admin_assignment",
            "activation_policy": "superadmin_only",
            "requires_superadmin_edit": True,
            "checkout_enabled": False,
        },
    },
    {
        "slug": "sistema-licencia-academica-control",
        "titulo": "Licencia Académica",
        "resumen": "Entrada de control para licencias educativas de 6 a 12 meses.",
        "descripcion": "Licencia especial educativa con restricciones comerciales y reportes con marca de agua.",
        "incluye": "Uso academico controlado, duracion limitada y restricciones de exportacion comercial.",
        "no_incluye": "Compra publica sin aprobacion administrativa.",
        "product_type": "licencia",
        "precio": Decimal("0.00"),
        "category_slug": "tienda-licencias",
        "etiquetas": ["licencia", "academica", "control"],
        "activo": False,
        "commercial_meta": {
            "commercial_code": "LIC_ACADEMIC_CONTROL",
            "commercial_family": "special_license_control",
            "billing_period": "manual",
            "delivery_kind": "manual_admin_assignment",
            "activation_policy": "superadmin_only",
            "requires_superadmin_edit": True,
            "checkout_enabled": False,
        },
    },
    {
        "slug": "sistema-licencia-capacitacion-control",
        "titulo": "Licencia Capacitación",
        "resumen": "Entrada de control para alumnos y capacitaciones de 30 dias.",
        "descripcion": "Licencia especial de entrenamiento con retencion y limpieza operativa controlada.",
        "incluye": "Uso de capacitacion limitado, reportes con marca de agua y restricciones comerciales.",
        "no_incluye": "Compra publica sin aprobacion administrativa.",
        "product_type": "licencia",
        "precio": Decimal("0.00"),
        "category_slug": "tienda-licencias",
        "etiquetas": ["licencia", "capacitacion", "control"],
        "activo": False,
        "commercial_meta": {
            "commercial_code": "LIC_TRAINING_CONTROL",
            "commercial_family": "special_license_control",
            "billing_period": "manual",
            "delivery_kind": "manual_admin_assignment",
            "activation_policy": "superadmin_only",
            "requires_superadmin_edit": True,
            "checkout_enabled": False,
        },
    },
    _addon_product(
        slug="sistema-pack-planifica-mensual",
        title="Pack Planifica Mensual",
        summary="Pack mensual para Cronogramas, Fórmula Polinómica y Desagregación.",
        price="10.00",
        code="PACK_PLANIFICA_MONTHLY",
        description="Pack comercial para habilitar capacidades de planificación sobre una licencia Estándar o superior.",
        requires_base_plan=["STANDARD", "PROFESSIONAL"],
        includes="Cronogramas, Fórmula Polinómica y Desagregación según la matriz comercial aprobada.",
        legacy_slugs=["sistema-addon-actualizacion-presupuestos"],
    ),
    _addon_product(
        slug="sistema-pack-planifica-anual",
        title="Pack Planifica Anual",
        summary="Pack anual de planificación para empresas con operación continua.",
        price="100.00",
        annual=True,
        code="PACK_PLANIFICA_ANNUAL",
        description="Vigencia anual del pack Planifica con precio consolidado.",
        requires_base_plan=["STANDARD", "PROFESSIONAL"],
        includes="Cronogramas, Fórmula Polinómica y Desagregación según la matriz comercial aprobada.",
        legacy_slugs=["sistema-addon-actualizacion-apus"],
    ),
    _addon_product(
        slug="sistema-pack-licita-mensual",
        title="Pack Licita Mensual",
        summary="Pack mensual para preparación y operación de licitaciones.",
        price="10.00",
        code="PACK_LICITA_MONTHLY",
        description="Pack comercial orientado a flujos de licitación, oferta y preparación documental.",
        requires_base_plan=["STANDARD", "PROFESSIONAL"],
        includes="Capacidades comerciales de licitación según contrato funcional vigente.",
        legacy_slugs=["sistema-addon-pack-reportes-ejecutivos"],
    ),
    _addon_product(
        slug="sistema-pack-licita-anual",
        title="Pack Licita Anual",
        summary="Pack anual para operación continua de licitaciones.",
        price="100.00",
        annual=True,
        code="PACK_LICITA_ANNUAL",
        description="Vigencia anual del pack Licita con precio consolidado.",
        requires_base_plan=["STANDARD", "PROFESSIONAL"],
        includes="Capacidades comerciales de licitación según contrato funcional vigente.",
        legacy_slugs=["sistema-addon-actualizacion-proyectos"],
    ),
    _addon_product(
        slug="sistema-conecta-transferencias",
        title="Conecta",
        summary="Amplia empresas destino para Envios y Transferencias.",
        price="24.99",
        code="CONECTA_TRANSFERENCIAS",
        description="Producto exclusivo de Envios y Transferencias para ampliar empresas destino adicionales durante 30 dias.",
        requires_base_plan=["STANDARD", "PROFESSIONAL"],
        includes="Tres empresas destino adicionales para envios, vigencia de 30 dias desde fecha y hora de compra, acumulable por compras independientes.",
        tags=["conecta", "envios", "transferencias", "destinatarios", "saas"],
        activation_policy="transfer_extra_recipients_30_days",
        delivery_kind="transfer_extra_recipients_saas_right",
        extra_commercial_meta={
            "context": "Envios y Transferencias",
            "recipient_slots": 3,
            "duration_days": 30,
            "accumulative": True,
            "independent_purchase": True,
            "requires_new_recipient_association": True,
        },
        sales_config={
            "sale_mode": "pack",
            "min_quantity": 1,
            "default_quantity": 1,
            "quantity_step": 1,
            "max_quantity": 20,
        },
        legacy_slugs=["sistema-pack-conecta-mensual", "sistema-addon-pack-catalogo-tecnico"],
    ),
    _addon_product(
        slug="sistema-pack-bim-mensual",
        title="Módulo BIM Mensual",
        summary="Acceso mensual al entorno BIM y 4D de GiProy.",
        price="99.99",
        code="PACK_BIM_MONTHLY",
        description="Módulo comercial mensual para habilitar GiProy BIM en empresas con licencia Estándar o Profesional.",
        requires_base_plan=["STANDARD", "PROFESSIONAL"],
        includes="Workspace BIM, visor IFC/Fragments, coordinación, revisión, incidencias y capacidades 4D habilitadas por el rollout vigente.",
        tags=["bim", "ifc", "4d", "modulo", "mensual", "saas"],
        activation_policy="marketplace_order_confirmed",
        sales_config={
            "sale_mode": "unit",
            "min_quantity": 1,
            "default_quantity": 1,
            "quantity_step": 1,
            "max_quantity": 1,
        },
    ),
    _addon_product(
        slug="sistema-pack-equipo-colaborador-mensual",
        title="Pack Equipo Colaborador Mensual",
        summary="Derecho mensual por colaborador para futura colaboración federada.",
        price="15.00",
        code="PACK_EQUIPO_COLLAB_MONTHLY",
        description="Entrada vendible por colaborador para la futura capa Equipo, reservada a titulares Profesional.",
        requires_base_plan=["PROFESSIONAL"],
        includes="Derecho comercial por colaborador; la colaboracion por EDT se activara solo cuando la fase Equipo este implementada.",
        activation_policy="future_team_collaboration_right",
        legacy_slugs=["sistema-servicio-onboarding-equipo"],
    ),
    _addon_product(
        slug="sistema-pack-equipo-colaborador-anual",
        title="Pack Equipo Colaborador Anual",
        summary="Derecho anual por colaborador para futura colaboración federada.",
        price="150.00",
        annual=True,
        code="PACK_EQUIPO_COLLAB_ANNUAL",
        description="Vigencia anual del derecho Equipo por colaborador.",
        requires_base_plan=["PROFESSIONAL"],
        includes="Derecho comercial por colaborador; la colaboracion por EDT se activara solo cuando la fase Equipo este implementada.",
        activation_policy="future_team_collaboration_right",
        legacy_slugs=["sistema-servicio-soporte-prioritario-mensual"],
    ),
    _service_product(
        slug="sistema-modulo-fusion",
        title="Módulo Fusión",
        summary="Módulo independiente de pago único para procesos de fusión.",
        price="150.00",
        code="MOD_FUSION",
        description="Producto independiente previsto para capacidades de fusion de informacion o servicios asistidos asociados.",
        includes="Derecho comercial o servicio de activacion manual para Fusión, sujeto a contrato funcional final.",
        tags=["modulo", "fusion", "pago-unico"],
        legacy_slugs=["sistema-servicio-revision-operativa"],
    ),
    _service_product(
        slug="sistema-modulo-migracion",
        title="Módulo Migración",
        summary="Módulo independiente de pago único para migraciones controladas.",
        price="200.00",
        code="MOD_MIGRACION",
        description="Producto independiente para migracion controlada y regularizacion de informacion dentro de GiProy.",
        includes="Derecho comercial o servicio de activacion manual para Migración, sujeto a contrato funcional final.",
        tags=["modulo", "migracion", "pago-unico"],
        legacy_slugs=["sistema-addon-pack-migracion-clasica"],
    ),
]

LEGACY_SYSTEM_LICENSE_SLUGS = {
    "sistema-licencia-profesional-plus",
    "sistema-licencia-obra-esencial",
    "sistema-licencia-control-presupuestario",
    "sistema-licencia-gestion-ejecutiva",
    "sistema-licencia-multiempresa-control",
    "sistema-licencia-empresarial-mensual",
    "sistema-licencia-empresarial-anual",
    "sistema-addon-actualizacion-presupuestos",
    "sistema-addon-actualizacion-apus",
    "sistema-addon-actualizacion-proyectos",
    "sistema-addon-pack-catalogo-tecnico",
    "sistema-addon-pack-reportes-ejecutivos",
    "sistema-addon-pack-migracion-clasica",
    "sistema-servicio-onboarding-equipo",
    "sistema-servicio-revision-operativa",
    "sistema-servicio-parametrizacion-base",
    "sistema-servicio-acompanamiento-puesta-marcha",
    "sistema-servicio-limpieza-catalogo",
    "sistema-servicio-ajuste-marketplace",
    "sistema-servicio-soporte-prioritario-mensual",
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
    superadmin_id = (
        db.query(Usuario.id)
        .filter(Usuario.rol.ilike("superadministrador"))
        .order_by(Usuario.id.asc())
        .limit(1)
        .scalar()
    )
    if not superadmin_id:
        raise ValueError("No existe un superadministrador disponible para bootstrapear el catálogo de Sistema.")

    categories = {
        category.slug: category
        for category in db.query(MarketplaceProductCategory).all()
    }

    created_or_updated: list[MarketplaceProduct] = []
    active_system_slugs = {item["slug"] for item in SYSTEM_MARKETPLACE_PRODUCTS}
    reusable_legacy_slugs = {
        legacy_slug
        for item in SYSTEM_MARKETPLACE_PRODUCTS
        for legacy_slug in item.get("legacy_slugs", [])
    }
    legacy_system_products = (
        db.query(MarketplaceProduct)
        .filter(MarketplaceProduct.slug.like("sistema-%"))
        .all()
    )
    for legacy_product in legacy_system_products:
        if legacy_product.slug not in active_system_slugs and legacy_product.slug not in reusable_legacy_slugs:
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

        if product is None and item.get("legacy_slugs"):
            product = (
                db.query(MarketplaceProduct)
                .filter(MarketplaceProduct.slug.in_(item["legacy_slugs"]))
                .order_by(MarketplaceProduct.id.asc())
                .first()
            )

        if product is None:
            product = MarketplaceProduct(
                seller_user_id=superadmin_id,
                approved_by_user_id=superadmin_id,
                product_kind="manual",
                source_type=None,
                source_id=None,
                moneda="USD",
                requiere_aprobacion=False,
                ventas_count=0,
                rating_promedio=Decimal("0"),
            )

        product.slug = item["slug"]
        product.titulo = item["titulo"]
        product.resumen = item["resumen"]
        product.descripcion = item["descripcion"]
        product.incluye = item["incluye"]
        product.no_incluye = item["no_incluye"]
        product.product_type = item["product_type"]
        product.precio = item["precio"]
        product.category_id = category.id
        product.etiquetas = list(item["etiquetas"])
        product.activo = bool(item.get("activo", True))
        product.estado = str(item.get("estado", "approved"))
        product.requiere_aprobacion = bool(item.get("requiere_aprobacion", False))
        product.approved_by_user_id = superadmin_id
        product.seller_user_id = superadmin_id

        product_meta = {
            "codigo": item["slug"].upper().replace("-", "_"),
            "precio_con_iva": f"{Decimal(item['precio']):.2f}",
            "fecha_inicio_publicacion": publication_start,
            "fecha_fin_publicacion": publication_end,
            "creador": "Sistema",
            **dict(item.get("commercial_meta") or {}),
        }
        if item["product_type"] == "licencia" and item.get("license_offer"):
            product_meta["license_offer"] = dict(item.get("license_offer") or {})

        product.vista_previa = {
            "kind": "system_saas_catalog",
            "category": category.nombre,
            "seller_label": "Sistema",
            "sales_config": dict(item.get("sales_config") or build_sample_sales_config(index, item["product_type"])),
            "product_meta": product_meta,
        }

        db.add(product)
        created_or_updated.append(product)

    db.commit()

    for product in created_or_updated:
        db.refresh(product)

    return created_or_updated
