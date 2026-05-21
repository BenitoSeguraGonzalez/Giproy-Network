"""
Schemas Pydantic para Items de Subcategoría de Precios Unitarios
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SubcategoriaItemBase(BaseModel):
    """Base schema para items de subcategoría"""
    codigo: Optional[str] = None
    descripcion: str
    observaciones: Optional[str] = None
    subcategoria_codigo: int  # 1=Equipos, 2=Materiales, 3=Transporte, 4=ManoObra, 5=PreciosUnitarios
    omniclass_codigo: Optional[str] = None
    omniclass_titulo: Optional[str] = None


class SubcategoriaItemCreate(SubcategoriaItemBase):
    """Schema para crear un item - código se genera automáticamente"""
    codigo: Optional[str] = None


class SubcategoriaItemUpdate(BaseModel):
    """Schema para actualizar un item - código no editable"""
    descripcion: Optional[str] = None
    observaciones: Optional[str] = None
    # Nota: subcategoria_codigo y codigo no se pueden cambiar


class SubcategoriaItemResponse(SubcategoriaItemBase):
    """Schema de respuesta"""
    id: int
    orden: int = 0
    base_trabajo_id: int
    empresa_id: int
    revisado: bool
    items_count: int = 0
    fecha_creacion: datetime
    ultima_modificacion: Optional[datetime] = None

    class Config:
        from_attributes = True


class SubcategoriaItemDuplicate(BaseModel):
    """Schema para duplicar un item"""
    item_id: int


class SubcategoriaItemImport(BaseModel):
    """Schema para importar items desde portapeles"""
    subcategoria_codigo: int
    items: list[dict]  # [{"descripcion": "...", "observaciones": "..."}]


class SubcategoriaItemExport(BaseModel):
    """Schema para exportar items a portapeles"""
    item_ids: list[int]


class SubcategoriaItemBulkDelete(BaseModel):
    """Schema para borrado masivo atómico"""
    item_ids: list[int]


class SubcategoriaItemBulkDeleteResponse(BaseModel):
    """Resumen de borrado masivo"""
    deleted_ids: list[int]
    deleted_count: int
    message: str


class SubcategoriaItemMove(BaseModel):
    """Schema para mover un item de categoría"""
    target_subcategoria_codigo: int


class SubcategoriaItemReorder(BaseModel):
    """Schema para reordenar un item dentro de la categoría actual"""
    target_item_id: int
    place_after: bool = False


# Constantes para subcategorías
SUBCATEGORIAS = {
    1: {"nombre": "Equipos y Herramientas", "prefijo": "1"},
    2: {"nombre": "Materiales", "prefijo": "2"},
    3: {"nombre": "Transporte", "prefijo": "3"},
    4: {"nombre": "Mano de Obra", "prefijo": "4"},
    5: {"nombre": "APU", "prefijo": "5"},
}
