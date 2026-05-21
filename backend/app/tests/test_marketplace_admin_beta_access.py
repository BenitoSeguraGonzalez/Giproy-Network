from fastapi.testclient import TestClient

from app.api.deps import get_current_active_user
from app.core.database import get_db
from app.main import app
from app.models.usuario import Usuario
from app.services.marketplace_bootstrap import bootstrap_system_marketplace_categories


def _admin_user(db, empresa, *, email="admin@example.com"):
    user = Usuario(
        email=email,
        hashed_password="hash",
        nombre_completo=email.split("@")[0],
        nombres="Santiago",
        apellidos="Bermeo",
        nacionalidad="Ecuatoriana",
        profesion="Ingeniero",
        ciudad="Cuenca",
        provincia="Azuay",
        canton="Cuenca",
        pais="Ecuador",
        movil="+593999999999",
        acepta_politica_privacidad=True,
        rol="administrador",
        empresa_id=empresa.id,
        activo=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    user.empresa = empresa
    return user


def _portal_payload(category_id):
    return {
        "titulo": "Portal QA Santiago",
        "resumen": "Portal de prueba",
        "descripcion": "Portal de compras publicas para QA",
        "product_type": "portal_compras_publicas",
        "product_kind": "manual",
        "category_id": category_id,
        "precio": "1000.00",
        "moneda": "USD",
        "activo": False,
        "requiere_aprobacion": False,
        "product_meta": {
            "descripcion_corta": "Portal de prueba",
            "descripcion_larga": "Portal de compras publicas para QA",
            "descripcion_completa": "Descripcion completa del portal de prueba",
            "fecha_inicio_publicacion": "2026-05-18",
            "fecha_fin_publicacion": "2026-06-18",
        },
        "portal_meta": {
            "pais": "Ecuador",
            "provincia": "Azuay",
            "canton": "Cuenca",
            "direccion": "Cuenca",
            "precio_licitacion": "1000.00",
            "fecha_inicio_licitacion": "2026-05-18",
            "fecha_fin_licitacion": "2026-06-18",
            "delivery_mode": "proyecto_base",
            "codigo_licitacion": "QA-SANTIAGO-001",
            "import_source": {
                "kind": "referencia_manual",
                "reference": "QA-SANTIAGO-001",
            },
            "project_delivery_policy": {
                "create_project_on_purchase": True,
            },
        },
    }


def _post_admin_product(db, current_user, payload):
    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_current_active_user] = lambda: current_user
    try:
        with TestClient(app) as client:
            return client.post("/api/v1/marketplace/admin/products", json=payload)
    finally:
        app.dependency_overrides.clear()


def _post_seller_product(db, current_user, payload):
    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_current_active_user] = lambda: current_user
    try:
        with TestClient(app) as client:
            return client.post("/api/v1/marketplace/products", json=payload)
    finally:
        app.dependency_overrides.clear()


def test_santiago_bermeo_admin_can_create_portal_only_through_admin_endpoint(db, sample_empresa):
    sample_empresa.nombre = "Santiago Bermeo"
    db.add(sample_empresa)
    db.commit()
    categories = bootstrap_system_marketplace_categories(db)
    portal_category = next(category for category in categories if category.slug == "tienda-portal-compras-publicas")
    current_user = _admin_user(db, sample_empresa, email="santiago.admin@example.com")
    payload = _portal_payload(portal_category.id)

    admin_response = _post_admin_product(db, current_user, payload)
    seller_response = _post_seller_product(db, current_user, {**payload, "titulo": "Portal QA Seller"})

    assert admin_response.status_code == 200
    assert admin_response.json()["product_type"] == "portal_compras_publicas"
    assert seller_response.status_code == 403
    assert "APUs, Bases Maestras y Proyectos" in seller_response.json()["detail"]


def test_non_beta_company_admin_cannot_create_portal_through_admin_endpoint(db, sample_empresa):
    categories = bootstrap_system_marketplace_categories(db)
    portal_category = next(category for category in categories if category.slug == "tienda-portal-compras-publicas")
    current_user = _admin_user(db, sample_empresa, email="regular.admin@example.com")

    response = _post_admin_product(db, current_user, _portal_payload(portal_category.id))

    assert response.status_code == 403
    assert response.json()["detail"] == "Solo superadministración puede administrar globalmente el marketplace."
