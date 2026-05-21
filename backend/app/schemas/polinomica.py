from pydantic import BaseModel
from typing import List, Optional, Dict
from decimal import Decimal
from datetime import datetime

class IndiceINECBase(BaseModel):
    codigo: str
    descripcion: str
    observaciones: Optional[str] = None

class IndiceINECResponse(IndiceINECBase):
    id: int
    class Config:
        from_attributes = True

class CuadrillaTipoResponse(BaseModel):
    id: int
    recurso_id: int
    recurso_codigo: Optional[str] = None
    recurso_descripcion: Optional[str] = None
    indice_inec_id: Optional[int] = None
    indice_codigo: Optional[str] = None
    indice_descripcion: Optional[str] = None
    salario_minimo: Optional[Decimal] = None
    trabajo: Optional[Decimal] = None
    costo_directo: Optional[Decimal] = None
    cantidad_hh: Optional[Decimal] = None
    coeficiente_incidencia: Decimal
    
    class Config:
        from_attributes = True

class FormulaPolinomicaMonomioResponse(BaseModel):
    id: int
    simbolo: str
    descripcion: Optional[str] = None
    indice_inec_id: Optional[int] = None
    indice_codigo: Optional[str] = None
    indice_descripcion: Optional[str] = None
    subtotal_termino: Optional[Decimal] = None
    coeficiente: Decimal
    
    class Config:
        from_attributes = True

class FormulaPolinomicaResponse(BaseModel):
    id: int
    presupuesto_id: int
    coeficiente_fijo: Decimal
    costo_directo_total: Decimal
    fecha_creacion: datetime
    ultima_modificacion: Optional[datetime]
    
    tipo: str
    config_desglose: Optional[Dict[str, float]] = None
    is_complete: Optional[bool] = None
    resources_detected: Optional[int] = None
    resources_pending: Optional[int] = None
    valor_total_indices: Optional[Decimal] = None
    base_formula: Optional[Decimal] = None
    formula_general: Optional[str] = None
    formula_cuadrilla: Optional[str] = None
    monomios: List[FormulaPolinomicaMonomioResponse] = []
    cuadrilla_tipo: List[CuadrillaTipoResponse] = []
    
    class Config:
        from_attributes = True
