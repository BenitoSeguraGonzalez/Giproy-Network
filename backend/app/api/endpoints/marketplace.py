from typing import Any, List, Optional

import hashlib

import io
import json
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Body, Request
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session, joinedload
from starlette.concurrency import run_in_threadpool

from app.api.deps import get_current_active_user, get_db
from app.models.marketplace import MarketplaceProduct, MarketplaceProductCategory
from app.models.usuario import Usuario
from app.schemas.marketplace import (
    MarketplaceAdminPaymentOrderSummaryResponse,
    MarketplaceBankTransferCheckoutCreate,
    MarketplaceCheckoutDraftCreate,
    MarketplaceCheckoutDraftResponse,
    MarketplaceCheckoutRequest,
    MarketplaceAssetOriginResponse,
    MarketplaceBuyerAssetResponse,
    MarketplaceCategoryResponse,
    MarketplaceCategoryCreate,
    MarketplaceCategoryUpdate,
    MarketplaceOrderResponse,
    MarketplaceOrderDownloadResponse,
    MarketplacePaymentHousekeepingSummaryResponse,
    MarketplacePaymentMethodConfigUpdate,
    MarketplacePaymentMethodResponse,
    MarketplacePayPhoneConfirmRequest,
    MarketplacePayPhoneConfirmResponse,
    MarketplacePayPhonePrepareRequest,
    MarketplacePayPhonePrepareResponse,
    MarketplacePayPalCaptureRequest,
    MarketplacePayPalCaptureResponse,
    MarketplacePayPalCreateOrderRequest,
    MarketplacePayPalCreateOrderResponse,
    MarketplacePayPalPrepareRequest,
    MarketplacePayPalPrepareResponse,
    MarketplacePermissionSummary,
    MarketplaceManualPaymentAction,
    MarketplaceRefundRequest,
    MarketplaceProductCreate,
    MarketplaceProductResponse,
    MarketplaceReviewCreate,
    MarketplaceReviewResponse,
    MarketplaceSourceOptionResponse,
    MarketplaceProductUpdate,
)
from app.services.marketplace_asset_origin import marketplace_asset_origin_service
from app.services.marketplace_checkout import marketplace_checkout_service
from app.services.marketplace import marketplace_service
from app.services.public_procurement_technical_analysis import (
    public_procurement_technical_analysis_service as public_procurement_portal_import_service,
)
from app.services.marketplace_permissions import (
    has_marketplace_permission,
    resolve_marketplace_permissions,
)

router = APIRouter()

MARKETPLACE_IMAGE_UPLOAD_DIR = Path("uploads/marketplace")
MARKETPLACE_IMAGE_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
MARKETPLACE_IMAGE_EXTENSIONS = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}


@router.get("/permissions/me", response_model=MarketplacePermissionSummary)
def get_marketplace_permissions_me(
    current_user: Usuario = Depends(get_current_active_user),
) -> Any:
    return {"marketplace_permissions": resolve_marketplace_permissions(current_user)}


@router.get("/categories", response_model=List[MarketplaceCategoryResponse])
def read_marketplace_categories(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> Any:
    if not has_marketplace_permission(current_user, "marketplace.view"):
        raise HTTPException(status_code=403, detail="No tiene permisos para ver el marketplace.")

    return (
        db.query(MarketplaceProductCategory)
        .filter(MarketplaceProductCategory.activa == True)
        .order_by(MarketplaceProductCategory.sort_order.asc(), MarketplaceProductCategory.nombre.asc())
        .all()
    )


@router.get("/payment-methods", response_model=List[MarketplacePaymentMethodResponse])
def read_marketplace_payment_methods(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> Any:
    return marketplace_service.list_public_payment_methods(db, current_user)


@router.get("/products", response_model=List[MarketplaceProductResponse])
def read_marketplace_products(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    q: Optional[str] = Query(None),
    product_type: Optional[str] = Query(None),
    category_id: Optional[int] = Query(None),
    seller_user_id: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
) -> Any:
    if not has_marketplace_permission(current_user, "marketplace.view"):
        raise HTTPException(status_code=403, detail="No tiene permisos para ver el marketplace.")
    marketplace_service._backfill_missing_fixed_category_ids(db)

    query = (
        db.query(MarketplaceProduct)
        .options(joinedload(MarketplaceProduct.seller), joinedload(MarketplaceProduct.category))
        .filter(
            MarketplaceProduct.estado == "approved",
            MarketplaceProduct.activo == True,
        )
    )

    if q:
        pattern = f"%{q.strip()}%"
        query = query.filter(MarketplaceProduct.titulo.ilike(pattern))
    if product_type:
        query = query.filter(MarketplaceProduct.product_type == product_type)
    if category_id:
        query = query.filter(MarketplaceProduct.category_id == category_id)
    if seller_user_id:
        query = query.filter(MarketplaceProduct.seller_user_id == seller_user_id)

    products = query.order_by(MarketplaceProduct.fecha_creacion.desc()).offset(skip).limit(limit).all()
    return [product for product in products if marketplace_service._is_product_in_publication_window(product)]


@router.get("/products/{product_id}", response_model=MarketplaceProductResponse)
def read_marketplace_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> Any:
    if not has_marketplace_permission(current_user, "marketplace.view"):
        raise HTTPException(status_code=403, detail="No tiene permisos para ver el marketplace.")
    marketplace_service._backfill_missing_fixed_category_ids(db)

    product = (
        db.query(MarketplaceProduct)
        .options(joinedload(MarketplaceProduct.seller), joinedload(MarketplaceProduct.category))
        .filter(MarketplaceProduct.id == product_id)
        .first()
    )
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado.")
    if (
        product.estado != "approved"
        or not product.activo
        or not marketplace_service._is_product_in_publication_window(product)
    ):
        raise HTTPException(status_code=404, detail="Producto no disponible.")
    return product


@router.get("/products/{product_id}/reviews", response_model=List[MarketplaceReviewResponse])
def read_marketplace_product_reviews(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> Any:
    if not has_marketplace_permission(current_user, "marketplace.view"):
        raise HTTPException(status_code=403, detail="No tiene permisos para ver el marketplace.")
    return marketplace_service.list_product_reviews(db, product_id)


@router.post("/products/{product_id}/reviews", response_model=MarketplaceReviewResponse)
def create_marketplace_product_review(
    product_id: int,
    payload: MarketplaceReviewCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> Any:
    review = marketplace_service.create_review(db, product_id, payload.rating, payload.comment, current_user)
    return {
        "id": review.id,
        "product_id": review.product_id,
        "order_id": review.order_id,
        "buyer_user_id": review.buyer_user_id,
        "buyer_name": current_user.nombre_completo,
        "rating": review.rating,
        "comment": review.comment,
        "created_at": review.created_at,
    }


@router.post("/products", response_model=MarketplaceProductResponse)
def create_marketplace_product(
    payload: MarketplaceProductCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> Any:
    return marketplace_service.create_product(db, payload, current_user)


@router.post("/admin/products/upload-image")
async def upload_marketplace_admin_product_image(
    file: UploadFile = File(...),
    current_user: Usuario = Depends(get_current_active_user),
) -> Any:
    marketplace_service._validate_marketplace_admin_access(current_user)
    content_type = (file.content_type or "").lower()
    extension = MARKETPLACE_IMAGE_EXTENSIONS.get(content_type)
    if not extension:
        raise HTTPException(status_code=400, detail="El archivo debe ser una imagen JPG, PNG, WEBP o GIF.")

    contents = await file.read()
    max_size = 5 * 1024 * 1024
    if len(contents) > max_size:
        raise HTTPException(status_code=400, detail="La imagen no puede superar 5 MB.")

    filename = f"marketplace_{uuid4().hex}{extension}"
    target_path = MARKETPLACE_IMAGE_UPLOAD_DIR / filename
    target_path.write_bytes(contents)

    return {"url": f"/api/v1/marketplace/media/images/{filename}"}


@router.get("/media/images/{filename}")
def read_marketplace_product_image(filename: str) -> Any:
    safe_filename = Path(filename).name
    if safe_filename != filename:
        raise HTTPException(status_code=400, detail="Nombre de imagen no permitido.")
    target_path = MARKETPLACE_IMAGE_UPLOAD_DIR / safe_filename
    if not target_path.exists() or not target_path.is_file():
        raise HTTPException(status_code=404, detail="Imagen no encontrada.")
    return FileResponse(str(target_path))


@router.get("/seller/products", response_model=List[MarketplaceProductResponse])
def read_seller_products(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> Any:
    return marketplace_service.list_seller_products(db, current_user)


@router.get("/company/products", response_model=List[MarketplaceProductResponse])
def read_company_products(
    empresa_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> Any:
    return marketplace_service.list_company_products(db, current_user, empresa_id=empresa_id)


@router.get("/seller/source-options", response_model=List[MarketplaceSourceOptionResponse])
def read_seller_source_options(
    source_type: str = Query(...),
    q: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> Any:
    return marketplace_service.list_source_options(db, current_user, source_type, q=q, limit=limit)


@router.put("/seller/products/{product_id}", response_model=MarketplaceProductResponse)
def update_seller_product(
    product_id: int,
    payload: MarketplaceProductUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> Any:
    return marketplace_service.update_seller_product(db, product_id, payload, current_user)


@router.post("/seller/products/{product_id}/clone", response_model=MarketplaceProductResponse)
def clone_seller_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> Any:
    return marketplace_service.clone_seller_product(db, product_id, current_user)


@router.delete("/seller/products/{product_id}")
def delete_seller_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> Any:
    marketplace_service.delete_seller_product(db, product_id, current_user)
    return {"ok": True}


@router.get("/origins", response_model=List[MarketplaceAssetOriginResponse])
def read_marketplace_asset_origins(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    entity_type: Optional[str] = Query(None),
    entity_id: Optional[int] = Query(None),
) -> Any:
    if entity_type and entity_id is not None:
        origin = marketplace_asset_origin_service.get_origin(
            db,
            empresa_id=current_user.empresa_id,
            entity_type=entity_type,
            entity_id=entity_id,
        )
        return [origin] if origin else []
    return marketplace_asset_origin_service.list_company_origins(db, empresa_id=current_user.empresa_id)


@router.post("/checkout", response_model=MarketplaceOrderResponse)
def checkout_marketplace(
    payload: MarketplaceCheckoutRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> Any:
    return marketplace_checkout_service.checkout(db, payload, current_user)


@router.post("/checkout/drafts", response_model=MarketplaceCheckoutDraftResponse)
def create_marketplace_checkout_draft(
    payload: MarketplaceCheckoutDraftCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> Any:
    return marketplace_checkout_service.create_checkout_draft(db, payload, current_user)


@router.get("/checkout/drafts", response_model=List[MarketplaceCheckoutDraftResponse])
def read_own_marketplace_checkout_drafts(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> Any:
    return marketplace_checkout_service.list_own_checkout_drafts(db, current_user)


@router.post("/checkout/bank-transfer", response_model=MarketplaceOrderResponse)
def submit_marketplace_bank_transfer_checkout(
    payload: MarketplaceBankTransferCheckoutCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> Any:
    return marketplace_checkout_service.submit_bank_transfer_checkout(db, payload, current_user)


@router.post("/checkout/payphone/prepare", response_model=MarketplacePayPhonePrepareResponse)
def prepare_marketplace_payphone_checkout(
    payload: MarketplacePayPhonePrepareRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> Any:
    return marketplace_checkout_service.prepare_payphone_checkout(db, payload.checkout_draft_id, current_user)


@router.post("/checkout/payphone/confirm", response_model=MarketplacePayPhoneConfirmResponse)
def confirm_marketplace_payphone_checkout(
    payload: MarketplacePayPhoneConfirmRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> Any:
    return marketplace_checkout_service.confirm_payphone_checkout(
        db,
        payphone_id=payload.id,
        client_transaction_id=payload.client_transaction_id,
        current_user=current_user,
    )


@router.post("/checkout/paypal/prepare", response_model=MarketplacePayPalPrepareResponse)
def prepare_marketplace_paypal_checkout(
    payload: MarketplacePayPalPrepareRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> Any:
    return marketplace_checkout_service.prepare_paypal_checkout(db, payload.checkout_draft_id, current_user)


@router.post("/checkout/paypal/create-order", response_model=MarketplacePayPalCreateOrderResponse)
def create_marketplace_paypal_order(
    payload: MarketplacePayPalCreateOrderRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> Any:
    return marketplace_checkout_service.create_paypal_order(
        db,
        checkout_draft_id=payload.checkout_draft_id,
        current_user=current_user,
    )


@router.post("/checkout/paypal/capture", response_model=MarketplacePayPalCaptureResponse)
def capture_marketplace_paypal_order(
    payload: MarketplacePayPalCaptureRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> Any:
    return marketplace_checkout_service.capture_paypal_order(
        db,
        paypal_order_id=payload.paypal_order_id,
        current_user=current_user,
    )


@router.get("/orders", response_model=List[MarketplaceOrderResponse])
def read_own_marketplace_orders(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> Any:
    return marketplace_checkout_service.list_own_orders(db, current_user)


@router.get("/orders/{order_id}", response_model=MarketplaceOrderResponse)
def read_own_marketplace_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> Any:
    return marketplace_checkout_service.get_own_order(db, order_id, current_user)


@router.post("/orders/{order_id}/refund", response_model=MarketplaceOrderResponse)
def request_own_marketplace_order_refund(
    order_id: int,
    payload: MarketplaceRefundRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> Any:
    return marketplace_checkout_service.request_order_refund(db, order_id, payload, current_user)


@router.get("/orders/{order_id}/downloads", response_model=List[MarketplaceOrderDownloadResponse])
def read_own_marketplace_order_downloads(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> Any:
    return marketplace_checkout_service.list_order_downloads(db, order_id, current_user)


@router.get("/orders/{order_id}/downloads/{order_item_id}/portal-excel")
def download_own_marketplace_order_portal_excel(
    order_id: int,
    order_item_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> Any:
    buffer, filename = marketplace_checkout_service.generate_portal_order_excel(db, order_id, order_item_id, current_user)
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/orders/{order_id}/invoice")
def download_own_marketplace_order_invoice(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> Any:
    buffer, filename = marketplace_checkout_service.generate_order_invoice_pdf(db, order_id, current_user)
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/buyer/library", response_model=List[MarketplaceBuyerAssetResponse])
def read_buyer_library(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> Any:
    return marketplace_checkout_service.list_buyer_library(db, current_user)


@router.get("/seller/stats")
def read_seller_marketplace_stats(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> Any:
    return marketplace_service.get_seller_stats(db, current_user)


@router.get("/company/stats")
def read_company_marketplace_stats(
    empresa_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> Any:
    return marketplace_service.get_company_stats(db, current_user, empresa_id=empresa_id)


@router.get("/seller/sales")
def read_seller_marketplace_sales(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> Any:
    return marketplace_service.list_seller_sales(db, current_user)


@router.get("/company/sales")
def read_company_marketplace_sales(
    empresa_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> Any:
    return marketplace_service.list_company_sales(db, current_user, empresa_id=empresa_id)


@router.get("/admin/orders", response_model=List[MarketplaceAdminPaymentOrderSummaryResponse])
def read_marketplace_admin_orders(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> Any:
    return marketplace_checkout_service.list_admin_orders(db, current_user)


@router.get("/admin/payments/housekeeping", response_model=MarketplacePaymentHousekeepingSummaryResponse)
def read_marketplace_admin_payment_housekeeping(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> Any:
    return marketplace_checkout_service.get_payment_housekeeping_summary(db, current_user, run_actions=False)


@router.post("/admin/payments/housekeeping/run", response_model=MarketplacePaymentHousekeepingSummaryResponse)
def run_marketplace_admin_payment_housekeeping(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> Any:
    return marketplace_checkout_service.get_payment_housekeeping_summary(db, current_user, run_actions=True)


@router.post("/admin/orders/{order_id}/confirm-bank-transfer", response_model=MarketplaceOrderResponse)
def confirm_marketplace_admin_bank_transfer(
    order_id: int,
    payload: MarketplaceManualPaymentAction,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> Any:
    return marketplace_checkout_service.confirm_bank_transfer_order(db, order_id, payload.admin_notes, current_user)


@router.post("/admin/orders/{order_id}/reject-bank-transfer", response_model=MarketplaceOrderResponse)
def reject_marketplace_admin_bank_transfer(
    order_id: int,
    payload: MarketplaceManualPaymentAction,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> Any:
    return marketplace_checkout_service.reject_bank_transfer_order(db, order_id, payload.admin_notes, current_user)


@router.post("/admin/orders/{order_id}/refund", response_model=MarketplaceOrderResponse)
def refund_marketplace_admin_order(
    order_id: int,
    payload: MarketplaceRefundRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> Any:
    return marketplace_checkout_service.admin_force_refund_order(db, order_id, payload, current_user)


@router.get("/admin/categories", response_model=List[MarketplaceCategoryResponse])
def read_marketplace_admin_categories(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> Any:
    return marketplace_service.list_admin_categories(db, current_user)


@router.get("/admin/products", response_model=List[MarketplaceProductResponse])
def read_marketplace_admin_products(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> Any:
    return marketplace_service.list_admin_products(db, current_user)


@router.post("/admin/products", response_model=MarketplaceProductResponse)
def create_marketplace_admin_product(
    payload: MarketplaceProductCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> Any:
    return marketplace_service.create_admin_product(db, payload, current_user)


@router.get("/admin/payment-methods", response_model=List[MarketplacePaymentMethodResponse])
def read_marketplace_admin_payment_methods(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> Any:
    return marketplace_service.list_admin_payment_methods(db, current_user)


@router.put("/admin/payment-methods/{slug}", response_model=MarketplacePaymentMethodResponse)
def update_marketplace_admin_payment_method(
    slug: str,
    payload: MarketplacePaymentMethodConfigUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> Any:
    return marketplace_service.update_admin_payment_method(db, slug, payload, current_user)


@router.post("/admin/portal-import/preview")
async def preview_marketplace_admin_portal_import(
    request: Request,
    current_user: Usuario = Depends(get_current_active_user),
) -> Any:
    marketplace_service._validate_marketplace_admin_access(current_user)

    form = await request.form()

    def form_text(name: str) -> str | None:
        value = form.get(name)
        if value is None or hasattr(value, "read"):
            return None
        return str(value)

    source_roles_json = form_text("source_roles_json")
    existing_analysis_json = form_text("existing_analysis_json")
    output_kind = form_text("output_kind")
    analysis_json = form_text("analysis_json")
    article_title = form_text("article_title")
    export_context_json = form_text("export_context_json")

    if (output_kind or "").strip().lower() == "excel":
        try:
            analysis = json.loads(analysis_json) if analysis_json else {}
        except json.JSONDecodeError as exc:
            raise HTTPException(status_code=400, detail="El análisis importado del portal no tiene un formato JSON válido.") from exc

        if not isinstance(analysis, dict) or not analysis:
            raise HTTPException(status_code=400, detail="No existe un análisis importado válido para generar el Excel de salida.")

        try:
            export_context = json.loads(export_context_json) if export_context_json else {}
        except json.JSONDecodeError as exc:
            raise HTTPException(status_code=400, detail="El contexto de exportación del portal no tiene un formato JSON válido.") from exc

        try:
            excel_bytes, filename = await run_in_threadpool(
                public_procurement_portal_import_service.build_excel_bytes,
                analysis,
                str(article_title or "portal_compras_publicas").strip() or "portal_compras_publicas",
                export_context if isinstance(export_context, dict) else {},
            )
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(
                status_code=500,
                detail=f"No se pudo construir el Excel del portal: {exc}",
            ) from exc

        return StreamingResponse(
            io.BytesIO(excel_bytes),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )

    uploaded_files: list[tuple[str, bytes]] = []
    seen_uploads: set[tuple[str, str]] = set()
    requested_files = [
        uploaded
        for uploaded in [*form.getlist("files"), *form.getlist("file")]
        if hasattr(uploaded, "read")
    ]
    for uploaded in requested_files:
        filename = (uploaded.filename or "portal_fuente").strip()
        content = await uploaded.read()
        if content:
            fingerprint = hashlib.sha1(content).hexdigest()
            dedupe_key = (filename, fingerprint)
            if dedupe_key in seen_uploads:
                continue
            seen_uploads.add(dedupe_key)
            uploaded_files.append((filename, content))
    if not uploaded_files:
        raise HTTPException(status_code=400, detail="Debes subir al menos un archivo válido para analizar el portal de compras públicas.")
    source_role_hints: dict[str, str] = {}
    if source_roles_json:
        try:
            parsed = json.loads(source_roles_json)
            if isinstance(parsed, dict):
                source_role_hints = {
                    str(key): str(value)
                    for key, value in parsed.items()
                    if str(value).strip()
                }
        except Exception as exc:
            raise HTTPException(status_code=400, detail="No se pudieron interpretar los roles manuales de archivos.") from exc
    existing_analysis = None
    if existing_analysis_json:
        try:
            parsed_existing = json.loads(existing_analysis_json)
            if isinstance(parsed_existing, dict):
                existing_analysis = parsed_existing
        except Exception as exc:
            raise HTTPException(status_code=400, detail="No se pudo interpretar el bundle existente para reimportación incremental.") from exc
    analysis = await run_in_threadpool(
        public_procurement_portal_import_service.analyze_uploads,
        uploaded_files,
        source_role_hints,
        existing_analysis,
    )
    return {
        "import_source_kind": "archivo_base",
        "import_source_reference": analysis.get("source_filename"),
        "import_analysis": analysis,
    }


@router.post("/admin/portal-import/excel-preview")
async def download_marketplace_admin_portal_excel_preview(
    payload: dict[str, Any] = Body(...),
    current_user: Usuario = Depends(get_current_active_user),
) -> Any:
    marketplace_service._validate_marketplace_admin_access(current_user)
    analysis = dict(payload.get("import_analysis") or {})
    if not analysis:
        raise HTTPException(status_code=400, detail="No existe un análisis importado válido para generar el Excel de salida.")
    article_title = str(payload.get("article_title") or "portal_compras_publicas").strip() or "portal_compras_publicas"
    export_context = dict(payload.get("export_context") or {})
    try:
        excel_bytes, filename = await run_in_threadpool(
            public_procurement_portal_import_service.build_excel_bytes,
            analysis,
            article_title,
            export_context,
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"No se pudo construir el Excel del portal: {exc}",
        ) from exc
    return StreamingResponse(
        io.BytesIO(excel_bytes),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.put("/admin/products/{product_id}", response_model=MarketplaceProductResponse)
def update_marketplace_admin_product(
    product_id: int,
    payload: MarketplaceProductUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> Any:
    return marketplace_service.update_admin_product(db, product_id, payload, current_user)


@router.delete("/admin/products/{product_id}")
def delete_marketplace_admin_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> Any:
    marketplace_service.delete_admin_product(db, product_id, current_user)
    return {"ok": True}


@router.post("/admin/categories", response_model=MarketplaceCategoryResponse)
def create_marketplace_admin_category(
    payload: MarketplaceCategoryCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> Any:
    return marketplace_service.create_category(db, payload, current_user)


@router.put("/admin/categories/{category_id}", response_model=MarketplaceCategoryResponse)
def update_marketplace_admin_category(
    category_id: int,
    payload: MarketplaceCategoryUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> Any:
    return marketplace_service.update_category(db, category_id, payload, current_user)


@router.delete("/admin/categories/{category_id}")
def delete_marketplace_admin_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> Any:
    marketplace_service.delete_category(db, category_id, current_user)
    return {"ok": True}
