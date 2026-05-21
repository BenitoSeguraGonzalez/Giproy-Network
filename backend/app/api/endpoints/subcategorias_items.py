"""
Endpoints API para Items de Subcategoría de Precios Unitarios.
Migrado a Service Layer para centralización de lógica.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Any, Optional
from app.models.usuario import Usuario
from app.api.deps import get_db, get_current_active_user
from app.schemas.subcategoria_item import (
    SubcategoriaItemCreate,
    SubcategoriaItemUpdate,
    SubcategoriaItemResponse,
    SubcategoriaItemImport,
    SubcategoriaItemExport,
    SubcategoriaItemMove,
    SubcategoriaItemReorder,
    SubcategoriaItemBulkDelete,
    SubcategoriaItemBulkDeleteResponse
)
from app.services.subcategoria import subcategoria_service

router = APIRouter()

def get_target_empresa_id(current_user: Usuario, empresa_id: Optional[int]) -> int:
    """Helper para determinar la empresa objetivo según el rol."""
    if current_user.rol.lower() == "superadministrador" and empresa_id:
        return empresa_id
    return current_user.empresa_id

@router.get("/", response_model=List[SubcategoriaItemResponse])
def read_items(
    base_id: Optional[int] = Query(None),
    base_trabajo_id: Optional[int] = Query(None),
    subcategoria_codigo: Optional[int] = Query(None),
    revision: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None)
) -> Any:
    """Listar items de subcategorías de una base."""
    effective_base_id = base_id or base_trabajo_id
    if effective_base_id is None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Debe proporcionar base_id o base_trabajo_id")

    target_id = get_target_empresa_id(current_user, empresa_id)

    if subcategoria_codigo:
        return subcategoria_service.get_items_by_subcategoria(
            db, effective_base_id, target_id, subcategoria_codigo, revision=revision
        )
    return subcategoria_service.get_all_items_by_base(db, effective_base_id, target_id, revision=revision)

@router.post("/", response_model=SubcategoriaItemResponse)
def create_item(
    *,
    db: Session = Depends(get_db),
    item_in: SubcategoriaItemCreate,
    base_id: int = Query(...),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None)
) -> Any:
    """Crear un nuevo item en una subcategoría con generación automática de código."""
    target_id = get_target_empresa_id(current_user, empresa_id)
    try:
        return subcategoria_service.create_item(db, item_in, base_id, target_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.put("/{item_id}", response_model=SubcategoriaItemResponse)
def update_item(
    *,
    db: Session = Depends(get_db),
    item_id: int,
    item_in: SubcategoriaItemUpdate,
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None)
) -> Any:
    """Actualizar un item (descripción y observaciones)."""
    target_id = get_target_empresa_id(current_user, empresa_id)
    try:
        return subcategoria_service.update_item(db, item_id, item_in, target_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND if "encontrado" in str(e) else status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/{item_id}", response_model=SubcategoriaItemResponse)
def delete_item(
    *,
    db: Session = Depends(get_db),
    item_id: int,
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None)
) -> Any:
    """Eliminar un item con re-estructuración automática de códigos."""
    target_id = get_target_empresa_id(current_user, empresa_id)
    try:
        return subcategoria_service.delete_item(db, item_id, target_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/duplicate/{item_id}", response_model=SubcategoriaItemResponse)
def duplicate_item(
    *,
    db: Session = Depends(get_db),
    item_id: int,
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None)
) -> Any:
    """Duplicar un item existente con nuevo código secuencial."""
    target_id = get_target_empresa_id(current_user, empresa_id)
    try:
        return subcategoria_service.duplicate_item(db, item_id, target_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/import")
def import_items(
    *,
    db: Session = Depends(get_db),
    import_data: SubcategoriaItemImport,
    base_id: int = Query(...),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None)
) -> Any:
    """Importar items desde portapapeles (TSV/Excel)."""
    target_id = get_target_empresa_id(current_user, empresa_id)
    result = subcategoria_service.import_items(
        db, base_id, target_id,
        import_data.subcategoria_codigo, import_data.items
    )
    
    if not result["success"] and result["imported"] == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=f"No se pudo importar ningún item. Errores: {result['errors']}"
        )
    
    return result

@router.post("/export")
def export_items(
    *,
    db: Session = Depends(get_db),
    export_data: SubcategoriaItemExport,
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None)
) -> Any:
    """Exportar items seleccionados a formato TSV para Excel."""
    target_id = get_target_empresa_id(current_user, empresa_id)
    items = subcategoria_service.export_items(
        db, target_id, export_data.item_ids
    )
    
    # Formateo TSV para portapapeles
    if items:
        headers = ["Código", "Descripción", "Observaciones"]
        rows = [headers]
        for item in items:
            rows.append([item["codigo"], item["descripcion"], item["observaciones"]])
        
        tsv_content = "\n".join(["\t".join(row) for row in rows])
        
        return {
            "items": items,
            "clipboard": tsv_content,
            "count": len(items)
        }
    
    return {"items": [], "clipboard": "", "count": 0}

@router.post("/bulk-delete", response_model=SubcategoriaItemBulkDeleteResponse)
def bulk_delete_items(
    *,
    db: Session = Depends(get_db),
    delete_data: SubcategoriaItemBulkDelete,
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None)
) -> Any:
    """Borrado masivo atómico validando integridad transversamente."""
    target_id = get_target_empresa_id(current_user, empresa_id)
    try:
        deleted_ids = subcategoria_service.bulk_delete_items(db, delete_data.item_ids, target_id)
        return {
            "deleted_ids": deleted_ids,
            "deleted_count": len(deleted_ids),
            "message": f"Se eliminaron {len(deleted_ids)} subcategorías correctamente."
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/{item_id}/move", response_model=SubcategoriaItemResponse)
def move_item(
    *,
    db: Session = Depends(get_db),
    item_id: int,
    move_in: SubcategoriaItemMove,
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None)
) -> Any:
    """Mover un item a otra categoría y re-numerar."""
    target_id = get_target_empresa_id(current_user, empresa_id)
    try:
        return subcategoria_service.move_item(
            db, item_id, move_in.target_subcategoria_codigo, target_id
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{item_id}/reorder", response_model=SubcategoriaItemResponse)
def reorder_item(
    *,
    db: Session = Depends(get_db),
    item_id: int,
    reorder_in: SubcategoriaItemReorder,
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None)
) -> Any:
    """Reordenar un item dentro de su categoría actual."""
    target_id = get_target_empresa_id(current_user, empresa_id)
    try:
        return subcategoria_service.reorder_item(db, item_id, reorder_in, target_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
