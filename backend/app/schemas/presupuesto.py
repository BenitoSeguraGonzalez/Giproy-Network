from pydantic import BaseModel, ConfigDict, computed_field
from typing import Dict, List, Optional
from decimal import Decimal
from datetime import datetime

class PresupuestoDetalleBase(BaseModel):
    edt_id: int
    apu_id: Optional[int] = None
    parent_id: Optional[int] = None
    tipo: Optional[str] = None
    codigo_item: Optional[str] = None
    descripcion: str
    unidad: Optional[str] = None
    cantidad: Decimal = 1.0
    precio_unitario: Decimal = 0.0
    precio_total: Decimal = 0.0
    notas: Optional[str] = None
    orden: int = 0
    omniclass_codigo: Optional[str] = None
    omniclass_titulo: Optional[str] = None
    tanteo_activo: bool = False

class PresupuestoDetalleCreate(PresupuestoDetalleBase):
    after_linea_id: Optional[int] = None

class PresupuestoDetalleUpdate(BaseModel):
    edt_id: Optional[int] = None
    parent_id: Optional[int] = None
    tipo: Optional[str] = None
    cantidad: Optional[Decimal] = None
    notas: Optional[str] = None
    precio_unitario: Optional[Decimal] = None
    descripcion: Optional[str] = None
    unidad: Optional[str] = None
    orden: Optional[int] = None
    after_linea_id: Optional[int] = None


class PresupuestoBulkCantidadItem(BaseModel):
    linea_id: int
    cantidad: Decimal


class PresupuestoBulkCantidadUpdate(BaseModel):
    items: List[PresupuestoBulkCantidadItem] = []

class PresupuestoDetalleResponse(PresupuestoDetalleBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    presupuesto_id: int


class PresupuestoMoveMergeInfo(BaseModel):
    apu_codigo: Optional[str] = None
    descripcion: str
    unidad: Optional[str] = None
    cantidad_inicial: Decimal
    cantidad_movida: Decimal
    cantidad_total: Decimal


class PresupuestoMoveResponse(BaseModel):
    linea: PresupuestoDetalleResponse
    merged: bool = False
    message: Optional[str] = None
    merge_info: Optional[PresupuestoMoveMergeInfo] = None


class PresupuestoNotaCreate(BaseModel):
    texto: str


class PresupuestoNotaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    presupuesto_id: int
    linea_presupuesto_id: Optional[int] = None
    autor_usuario_id: Optional[int] = None
    autor_nombre_snapshot: str
    tipo: str
    texto: str
    fecha_creacion: datetime

class PresupuestoLineNoteSummary(BaseModel):
    total: int = 0
    nuevas: int = 0


class PresupuestoNotasSummaryResponse(BaseModel):
    general_total: int = 0
    general_nuevas: int = 0
    lineas: Dict[int, PresupuestoLineNoteSummary] = {}
    last_opened_at: Optional[datetime] = None


class PresupuestoParetoItemResponse(BaseModel):
    id: int
    item_type: str = "linea"
    codigo: Optional[str] = None
    descripcion: str
    unidad: Optional[str] = None
    cantidad: Decimal
    precio_unitario: Decimal
    valor: Decimal
    porcentaje: float
    porcentaje_acumulado: float
    ranking: int
    apu_id: Optional[int] = None
    edt_id: int
    linea_id: Optional[int] = None


class PresupuestoParetoResponse(BaseModel):
    presupuesto_id: int
    view: str
    total: Decimal
    total_items: int
    visible_items: int
    visible_acumulado: float
    scope_item_type: Optional[str] = None
    scope_id: Optional[int] = None
    scope_codigo: Optional[str] = None
    scope_descripcion: Optional[str] = None
    items: List[PresupuestoParetoItemResponse]


class PresupuestoIndirectoItemBase(BaseModel):
    concepto_codigo: str
    concepto_id: Optional[int] = None
    categoria_codigo: str
    nombre: str
    porcentaje: Decimal = Decimal("0.0")
    observaciones: Optional[str] = None
    fijo: bool = False
    usuario: bool = False
    custom: bool = False


class PresupuestoIndirectoItemUpdate(PresupuestoIndirectoItemBase):
    pass


class PresupuestoIndirectoItemResponse(PresupuestoIndirectoItemBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


class PresupuestoIndirectosUpdate(BaseModel):
    items: List[PresupuestoIndirectoItemUpdate] = []
    iva_aplicado: Optional[Decimal] = None


class PresupuestoIndirectosResponse(BaseModel):
    presupuesto_id: int
    subtotal_directo: Decimal
    indirectos_porcentaje: Decimal
    indirectos_total: Decimal
    iva_aplicado: Decimal
    impuestos: Decimal
    total: Decimal
    items: List[PresupuestoIndirectoItemResponse]

class PresupuestoBase(BaseModel):
    descripcion: str
    proyecto_id: int
    revision: int = 1
    moneda: str = "USD"
    estado: str = "En Elaboración"
    iva_aplicado: Decimal = 15.00
    dec_moneda: int = 2
    dec_calculos: int = 4

class PresupuestoCreate(PresupuestoBase):
    lineas: List[PresupuestoDetalleCreate] = []

class PresupuestoUpdate(BaseModel):
    descripcion: Optional[str] = None
    revision: Optional[int] = None
    estado: Optional[str] = None
    moneda: Optional[str] = None
    iva_aplicado: Optional[Decimal] = None
    dec_moneda: Optional[int] = None
    dec_calculos: Optional[int] = None

class PresupuestoResponse(PresupuestoBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    codigo: Optional[str]
    subtotal: Decimal
    indirectos_total: Decimal
    impuestos: Decimal
    total: Decimal
    indirectos_porcentaje: Decimal = Decimal("0.0")
    empresa_id: int
    fecha_creacion: datetime
    ultima_modificacion: Optional[datetime]
    detalle: List[PresupuestoDetalleResponse] = []

    @computed_field
    @property
    def created_at(self) -> datetime:
        return self.fecha_creacion

    @computed_field
    @property
    def updated_at(self) -> datetime:
        return self.ultima_modificacion or self.fecha_creacion

    @computed_field
    @property
    def total_lineas(self) -> int:
        return len(self.detalle)
