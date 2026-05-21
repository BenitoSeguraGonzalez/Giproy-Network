"""
Endpoints para la gestión de Recursos, Unidades y CPC
Refactorizado para usar Service Layer.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional, Any
from app.schemas.recurso import (
    RecursoCreate, RecursoUpdate, RecursoResponse, 
    CategoriaResponse, RecursoMove,
    RecursoImportRequest, RecursoExportRequest, RecursoImportResponse,
    RecursoBulkDeleteRequest, RecursoBulkDeleteResponse,
    RecursoBulkCpcRequest, RecursoBulkCpcResponse,
)
from app.api.deps import get_db, get_current_active_user
from app.schemas.unidad import UnidadResponse, UnidadCreate
from app.schemas.codcpc import CodCPCResponse
from app.services.recurso import recurso_service
from app.repositories.unidad import UnidadRepository
from app.repositories.codcpc import CodCPCRepository
from app.models.usuario import Usuario
from app.models.recurso import CategoriaRecurso, Recurso
from app.models.subcategoria_item import SubcategoriaItem

router = APIRouter()

@router.get("/", response_model=List[RecursoResponse])
def read_recursos(
    base_trabajo_id: Optional[int] = Query(None),
    base_id: Optional[int] = Query(None),
    subcategoria_item_id: Optional[int] = Query(None),
    revision: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None)
) -> Any:
    """Listar recursos filtrados por base y opcionalmente por subcategoría."""
    effective_base_id = base_id or base_trabajo_id
    if effective_base_id is None:
        raise HTTPException(status_code=422, detail="Debe proporcionar base_id o base_trabajo_id")

    target_empresa_id = current_user.empresa_id
    if current_user.rol.lower() == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id
    
    from app.repositories.recurso import recurso_repo
    recursos = recurso_repo.get_all(
        db,
        base_trabajo_id=effective_base_id, 
        empresa_id=target_empresa_id,
        subcategoria_item_id=subcategoria_item_id,
        revision=revision
    )
    return recursos

@router.post("/", response_model=RecursoResponse)
def create_recurso(
    recurso_in: RecursoCreate,
    base_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None)
):
    """Crear un nuevo recurso con validación de nombre y código automático."""
    target_empresa_id = current_user.empresa_id
    if current_user.rol.lower() == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id
    
    try:
        return recurso_service.create_recurso(db, recurso_in, base_trabajo_id=base_id, empresa_id=target_empresa_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/import", response_model=RecursoImportResponse)
def import_recursos(
    import_in: RecursoImportRequest,
    base_id: int = Query(...),
    revision: Optional[int] = Query(0),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None)
):
    """Importa recursos desde portapapeles en bloque."""
    target_empresa_id = current_user.empresa_id
    if current_user.rol.lower() == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id

    return recurso_service.import_recursos(
        db,
        items=import_in.items,
        base_trabajo_id=base_id,
        empresa_id=target_empresa_id,
        subcategoria_item_id=import_in.subcategoria_item_id,
        revision=revision or 0
    )

@router.put("/bulk-cpc", response_model=RecursoBulkCpcResponse)
def bulk_assign_cpc(
    cpc_in: RecursoBulkCpcRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None)
):
    """Asigna un mismo código CPC a múltiples recursos de la empresa activa."""
    target_empresa_id = current_user.empresa_id
    if current_user.rol.lower() == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id

    try:
        updated_ids = recurso_service.bulk_assign_cpc(
            db,
            cpc_in.recurso_ids,
            cpc_in.cod_cpc_id,
            target_empresa_id,
        )
        return {
            "updated_ids": updated_ids,
            "updated_count": len(updated_ids),
            "cod_cpc_id": cpc_in.cod_cpc_id,
            "message": f"Se asignó el CPC seleccionado a {len(updated_ids)} recursos.",
        }
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.put("/{recurso_id}", response_model=RecursoResponse)
def update_recurso(
    recurso_id: int,
    recurso_in: RecursoUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None)
):
    """Actualiza un recurso existente."""
    target_empresa_id = current_user.empresa_id
    user_role = current_user.rol.lower() if current_user.rol else ""
    if user_role == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id

    recurso = recurso_service.get_recurso(db, recurso_id)
    if not recurso or (recurso.empresa_id != target_empresa_id and user_role != "superadministrador"):
         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recurso no encontrado o acceso denegado.")
    
    if user_role == "superadministrador" and empresa_id and recurso.empresa_id != empresa_id:
         raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="El recurso no pertenece a la empresa especificada.")

    try:
        return recurso_service.update_recurso(db, recurso_id, recurso_in)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/{recurso_id}")
def delete_recurso(
    recurso_id: int,
    revision: Optional[int] = Query(0),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None)
):
    """Elimina un recurso."""
    target_empresa_id = current_user.empresa_id
    if current_user.rol.lower() == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id

    recurso = recurso_service.get_recurso(db, recurso_id)
    if not recurso or recurso.empresa_id != target_empresa_id:
         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recurso no encontrado")

    try:
        recurso_service.delete_recurso(db, recurso_id, revision=revision)
        return {"message": "Recurso eliminado correctamente"}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/bulk-delete", response_model=RecursoBulkDeleteResponse)
def bulk_delete_recursos(
    delete_in: RecursoBulkDeleteRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None)
):
    """Elimina múltiples recursos de forma atómica."""
    target_empresa_id = current_user.empresa_id
    if current_user.rol.lower() == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id

    try:
        deleted_ids = recurso_service.bulk_delete_recursos(db, delete_in.recurso_ids, target_empresa_id)
        return {
            "deleted_ids": deleted_ids,
            "deleted_count": len(deleted_ids),
            "message": f"Se eliminaron {len(deleted_ids)} recursos correctamente."
        }
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/{recurso_id}/duplicate", response_model=RecursoResponse)
def duplicate_recurso(
    recurso_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None)
):
    """Duplica un recurso añadiendo sufijo único."""
    target_empresa_id = current_user.empresa_id
    if current_user.rol.lower() == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id

    recurso_orig = recurso_service.get_recurso(db, recurso_id)
    if not recurso_orig or recurso_orig.empresa_id != target_empresa_id:
         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recurso no encontrado")

    try:
        return recurso_service.duplicate_recurso(db, recurso_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/{recurso_id}/move", response_model=RecursoResponse)
def move_recurso(
    recurso_id: int,
    move_in: RecursoMove,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None)
):
    """Mueve un recurso a otra subcategoría y ajusta códigos."""
    target_empresa_id = current_user.empresa_id
    if current_user.rol.lower() == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id

    recurso_orig = recurso_service.get_recurso(db, recurso_id)
    if not recurso_orig or recurso_orig.empresa_id != target_empresa_id:
         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recurso no encontrado")

    try:
        return recurso_service.move_recurso(db, recurso_id, move_in.target_subcategoria_item_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/unidades", response_model=List[UnidadResponse])
def read_unidades(
    subcategoria_codigo: int = Query(...),
    base_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None)
):
    """Lista unidades disponibles para una categoría específica (globales + personalizadas)."""
    target_empresa_id = current_user.empresa_id
    if current_user.rol.lower() == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id
    repo = UnidadRepository(db)
    return repo.get_available(
        subcategoria_codigo=subcategoria_codigo, 
        base_trabajo_id=base_id, 
        empresa_id=target_empresa_id
    )

@router.post("/unidades", response_model=UnidadResponse)
def create_unidad(
    unidad_in: UnidadCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Crea una nueva unidad personalizada."""
    repo = UnidadRepository(db)
    return repo.create(unidad_in)

@router.get("/cpc/search", response_model=List[CodCPCResponse])
def search_cpc(
    q: Optional[str] = Query(None),
    limit: int = Query(200, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Busca códigos CPC por coincidencia en código o descripción."""
    repo = CodCPCRepository(db)
    return repo.search(query=q, limit=limit)

@router.get("/categorias", response_model=List[CategoriaResponse])
def read_categorias(
    db: Session = Depends(get_db),
    base_id: Optional[int] = Query(None),
    empresa_id: Optional[int] = Query(None),
    revision: Optional[int] = Query(None),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Lista las categorías base de recursos.
    Si se proporciona base_id, devuelve el conteo de recursos por categoría para la revisión indicada.
    """
    categorias = db.query(CategoriaRecurso).order_by(CategoriaRecurso.id).all()
    
    if not base_id:
        return [CategoriaResponse.model_validate(c) for c in categorias]

    target_empresa_id = current_user.empresa_id
    if current_user.rol.lower() == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id

    # Obtener conteos filtrando por base, empresa y REVISIÓN
    results = []
    for cat in categorias:
        count = db.query(Recurso).join(SubcategoriaItem).filter(
            SubcategoriaItem.subcategoria_codigo == cat.id,
            Recurso.base_trabajo_id == base_id,
            Recurso.empresa_id == target_empresa_id
        )
        if revision is not None:
            count = count.filter(Recurso.revision == revision)
        count = count.count()
        
        cat_data = CategoriaResponse.model_validate(cat)
        cat_data.recursos_count = count
        results.append(cat_data)
        
    return results
