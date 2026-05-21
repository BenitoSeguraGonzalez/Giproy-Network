from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.api import deps
from app.schemas.pais import PaisResponse
from app.services.pais import pais_service

router = APIRouter()

@router.get("/", response_model=List[PaisResponse])
def read_paises(
    db: Session = Depends(deps.get_db),
    q: Optional[str] = Query(None, description="Buscar por nombre de país"),
    skip: int = 0,
    limit: int = 100,
):
    """
    Lista los países disponibles. Permite búsqueda por nombre.
    """
    return pais_service.get_paises(db=db, skip=skip, limit=limit, q=q)

@router.get("/{pais_id}", response_model=PaisResponse)
def read_pais(
    pais_id: int,
    db: Session = Depends(deps.get_db),
):
    """
    Obtiene los detalles de un país por su ID, incluyendo prefijo y moneda.
    """
    return pais_service.get_pais_by_id(db=db, pais_id=pais_id)
