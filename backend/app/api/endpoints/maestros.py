from typing import Any, List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.omniclass import OmniClassMaestro
from app.schemas.omniclass import OmniClassMaestro as OmniClassSchema

router = APIRouter()

# Datos Maestros de Tipos de Proyecto.
# Catálogo operativo usado por Datos de Proyecto.
TIPOS_PROYECTO = [
    {"id": 1, "codigo": "01", "descripcion": "Comercial"},
    {"id": 2, "codigo": "02", "descripcion": "Centro médico"},
    {"id": 3, "codigo": "03", "descripcion": "Institucional"},
    {"id": 4, "codigo": "04", "descripcion": "Residencial"},
    {"id": 5, "codigo": "05", "descripcion": "Infraestructura"},
    {"id": 6, "codigo": "06", "descripcion": "Paisaje, Urbanismo y Transporte"},
    {"id": 7, "codigo": "07", "descripcion": "Industria y Energía"},
    {"id": 8, "codigo": "08", "descripcion": "Proyectos de ejemplo"},
    {"id": 9, "codigo": "09", "descripcion": "Sin clasificación"},
]

# Categorías por Tipo de Proyecto.
CATEGORIAS = [
    # Comercial (01)
    {"id": 1, "tipo_id": 1, "descripcion": "Aparcamientos/Garaje"},
    {"id": 2, "tipo_id": 1, "descripcion": "Oficinas"},
    {"id": 3, "tipo_id": 1, "descripcion": "Locales Comerciales"},
    {"id": 4, "tipo_id": 1, "descripcion": "Hotel/Motel/Hostal"},
    {"id": 5, "tipo_id": 1, "descripcion": "Comercio"},
    {"id": 6, "tipo_id": 1, "descripcion": "Música/entretenimiento"},
    {"id": 7, "tipo_id": 1, "descripcion": "Teatro"},
    {"id": 8, "tipo_id": 1, "descripcion": "Restaurante"},
    {"id": 9, "tipo_id": 1, "descripcion": "Estadio"},
    {"id": 10, "tipo_id": 1, "descripcion": "Parque temático"},
    {"id": 11, "tipo_id": 1, "descripcion": "Bodega/Almacén"},
    {"id": 12, "tipo_id": 1, "descripcion": "Mall"},
    {"id": 13, "tipo_id": 1, "descripcion": "Supermercado"},
    {"id": 14, "tipo_id": 1, "descripcion": "Mercado público"},
    {"id": 15, "tipo_id": 1, "descripcion": "Centro convenciones"},
    {"id": 16, "tipo_id": 1, "descripcion": "Centro de datos"},
    # Centro médico (02)
    {"id": 17, "tipo_id": 2, "descripcion": "Residencia geriátrica"},
    {"id": 18, "tipo_id": 2, "descripcion": "Hospital"},
    {"id": 19, "tipo_id": 2, "descripcion": "Clínica"},
    {"id": 20, "tipo_id": 2, "descripcion": "Laboratorio médico"},
    {"id": 21, "tipo_id": 2, "descripcion": "Consultorio"},
    {"id": 22, "tipo_id": 2, "descripcion": "Cirugía ambulatoria"},
    {"id": 23, "tipo_id": 2, "descripcion": "Centro médico general"},
    # Institucional (03)
    {"id": 24, "tipo_id": 3, "descripcion": "Instituciones educativas"},
    {"id": 25, "tipo_id": 3, "descripcion": "Centro enseñanza"},
    {"id": 26, "tipo_id": 3, "descripcion": "Edificio gubernamental"},
    {"id": 27, "tipo_id": 3, "descripcion": "Biblioteca"},
    {"id": 28, "tipo_id": 3, "descripcion": "Instalación militar"},
    {"id": 29, "tipo_id": 3, "descripcion": "Museo"},
    {"id": 30, "tipo_id": 3, "descripcion": "Centro penitenciario"},
    {"id": 31, "tipo_id": 3, "descripcion": "Centro ocio"},
    {"id": 32, "tipo_id": 3, "descripcion": "Edificio religioso"},
    {"id": 33, "tipo_id": 3, "descripcion": "Laboratorio investigación"},
    # Residencial (04)
    {"id": 34, "tipo_id": 4, "descripcion": "Vivienda unifamiliar"},
    {"id": 35, "tipo_id": 4, "descripcion": "Vivienda plurifamiliar"},
    {"id": 36, "tipo_id": 4, "descripcion": "Edificio departamentos"},
    {"id": 37, "tipo_id": 4, "descripcion": "Urbanización"},
    {"id": 38, "tipo_id": 4, "descripcion": "Condominio"},
    {"id": 39, "tipo_id": 4, "descripcion": "Casa de campo/Quinta"},
    # Infraestructura (05)
    {"id": 40, "tipo_id": 5, "descripcion": "Aeropuerto"},
    {"id": 41, "tipo_id": 5, "descripcion": "Puente"},
    {"id": 42, "tipo_id": 5, "descripcion": "Canal/Vial fluvial"},
    {"id": 43, "tipo_id": 5, "descripcion": "Presas/Embalses"},
    {"id": 44, "tipo_id": 5, "descripcion": "Puertos"},
    {"id": 45, "tipo_id": 5, "descripcion": "Encauce ríos"},
    {"id": 46, "tipo_id": 5, "descripcion": "Estabilización suelo"},
    {"id": 47, "tipo_id": 5, "descripcion": "Ferrocarril/Tren"},
    {"id": 48, "tipo_id": 5, "descripcion": "Puerto marítimo"},
    {"id": 49, "tipo_id": 5, "descripcion": "Calle/Carretera/Autopista"},
    {"id": 50, "tipo_id": 5, "descripcion": "Edificio transporte"},
    {"id": 51, "tipo_id": 5, "descripcion": "Túnel"},
    {"id": 52, "tipo_id": 5, "descripcion": "Paso vial deprimido"},
    {"id": 53, "tipo_id": 5, "descripcion": "Alcantarillado"},
    {"id": 54, "tipo_id": 5, "descripcion": "Suministro agua"},
    # Paisaje, Urbanismo y Transporte (06)
    {"id": 55, "tipo_id": 6, "descripcion": "Parque/Plaza"},
    {"id": 56, "tipo_id": 6, "descripcion": "Caminera/Ciclovía"},
    {"id": 57, "tipo_id": 6, "descripcion": "Aerovía"},
    {"id": 58, "tipo_id": 6, "descripcion": "Estación transporte"},
    {"id": 59, "tipo_id": 6, "descripcion": "Jardín/Vegetación"},
    # Industria y Energía (07)
    {"id": 60, "tipo_id": 7, "descripcion": "Manufactura/Fábrica"},
    {"id": 61, "tipo_id": 7, "descripcion": "Instalación minera"},
    {"id": 62, "tipo_id": 7, "descripcion": "Petróleo y gas"},
    {"id": 63, "tipo_id": 7, "descripcion": "Planta industrial"},
    {"id": 64, "tipo_id": 7, "descripcion": "Central eléctrica"},
    {"id": 65, "tipo_id": 7, "descripcion": "Parque solar"},
    {"id": 66, "tipo_id": 7, "descripcion": "Servicios"},
    {"id": 67, "tipo_id": 7, "descripcion": "Parque eólico"},
    # Proyectos de ejemplo (08)
    {"id": 68, "tipo_id": 8, "descripcion": "Proyecto demostración"},
    {"id": 69, "tipo_id": 8, "descripcion": "Plantilla"},
    {"id": 70, "tipo_id": 8, "descripcion": "Formación"},
    # Sin clasificación (09)
    {"id": 71, "tipo_id": 9, "descripcion": "No categorizado"},
]

# Listado simplificado de Provincias de Ecuador
PROVINCIAS_ECUADOR = [
    "Azuay", "Bolívar", "Cañar", "Carchi", "Chimborazo", "Cotopaxi", "El Oro", "Esmeraldas",
    "Galápagos", "Guayas", "Imbabura", "Loja", "Los Ríos", "Manabí", "Morona Santiago",
    "Napo", "Orellana", "Pastaza", "Pichincha", "Santa Elena", "Santo Domingo de los Tsáchilas",
    "Sucumbíos", "Tungurahua", "Zamora Chinchipe"
]

@router.get("/tipos-proyecto")
def get_tipos_proyecto() -> Any:
    return TIPOS_PROYECTO

@router.get("/categorias/{tipo_id}")
def get_categorias(tipo_id: int) -> Any:
    return [c for c in CATEGORIAS if c["tipo_id"] == tipo_id]

@router.get("/ecuador/provincias")
def get_provincias() -> Any:
    return PROVINCIAS_ECUADOR

# Listado de Cantones de Ecuador por Provincia
CANTONES = {
    "Azuay": ["Cuenca", "Gualaceo", "Paute", "Sigsig", "Chordeleg", "Girón", "Santa Isabel", "Nabón", "Pucará", "San Fernando", "Oña", "Camilo Ponce Enríquez", "Guachapala", "Sevilla de Oro", "El Pan"],
    "Bolívar": ["Guaranda", "Chillanes", "Chimbo", "Echeandía", "San Miguel", "Caluma", "Las Naves"],
    "Cañar": ["Azogues", "Biblián", "Cañar", "La Troncal", "El Tambo", "Deleg", "Suscal"],
    "Carchi": ["Tulcán", "Bolívar", "Espejo", "Mira", "Montúfar", "San Pedro de Huaca"],
    "Chimborazo": ["Riobamba", "Alausi", "Colta", "Chambo", "Chunchi", "Guamote", "Guano", "Pallatanga", "Penipe", "Cumandá"],
    "Cotopaxi": ["Latacunga", "La Maná", "Pangua", "Pujilí", "Salcedo", "Saquisilí", "Sigchos"],
    "El Oro": ["Machala", "Arenillas", "Atahualpa", "Balsas", "Chilla", "El Guabo", "Huaquillas", "Marcabelí", "Pasaje", "Piñas", "Portovelo", "Santa Rosa", "Zaruma", "Las Lajas"],
    "Esmeraldas": ["Esmeraldas", "Eloy Alfaro", "Muisne", "Quinindé", "San Lorenzo", "Atacames", "Rioverde", "La Concordia"],
    "Galápagos": ["San Cristóbal", "Isabela", "Santa Cruz"],
    "Guayas": ["Guayaquil", "Alfredo Baquerizo Moreno", "Balao", "Balzar", "Colimes", "Daule", "Durán", "El Empalme", "El Triunfo", "Milagro", "Samborondón", "Santa Lucía", "Salitre", "Pedro Carbo", "Marcelino Maridueña", "Nobol", "Lomas de Sargentillo", "Antonio Elizalde", "Isidro Ayora"],
    "Imbabura": ["Ibarra", "Antonio Ante", "Cotacachi", "Otavalo", "Pimampiro", "San Miguel de Urcuquí"],
    "Loja": ["Loja", "Calvas", "Catamayo", "Celica", "Chaguarpamba", "Espíndola", "Gonzanamá", "Macará", "Paltas", "Puyango", "Saraguro", "Sozoranga", "Zapotillo", "Pindal", "Quilanga", "Olmedo"],
    "Los Ríos": ["Babahoyo", "Baba", "Montalvo", "Puebloviejo", "Quevedo", "Urdaneta", "Ventanas", "Vinces", "Palenque", "Buena Fé", "Valencia", "Mocache", "Quinsaloma"],
    "Manabí": ["Portoviejo", "Bolívar", "Chone", "El Carmen", "Flavio Alfaro", "Jipijapa", "Junín", "Manta", "Montecristi", "Paján", "Pichincha", "Rocafuerte", "Santa Ana", "Sucre", "Tosagua", "24 de Mayo", "Pedernales", "Olmedo", "Puerto López", "Jama", "Jaramijó"],
    "Morona Santiago": ["Macas", "Gualaquiza", "Limón Indanza", "Palora", "Santiago", "Sucúa", "Huamboya", "San Juan Bosco", "Taisha", "Logroño", "Pablo Sexto", "Tiwintza"],
    "Napo": ["Tena", "Archidona", "El Chaco", "Quijos", "Carlos Julio Arosemena Tola"],
    "Orellana": ["Francisco de Orellana", "Aguarico", "La Joya de los Sachas", "Loreto"],
    "Pastaza": ["Puyo", "Mera", "Santa Clara", "Arajuno"],
    "Pichincha": ["Quito", "Cayambe", "Mejía", "Pedro Moncayo", "Pedro Vicente Maldonado", "Puerto Quito", "Rumiñahui", "San Miguel de los Bancos"],
    "Santa Elena": ["Santa Elena", "La Libertad", "Salinas"],
    "Santo Domingo de los Tsáchilas": ["Santo Domingo"],
    "Sucumbíos": ["Nueva Loja", "Cascales", "Cuyabeno", "Gonzalo Pizarro", "Putumayo", "Shushufindi", "Lago Agrio"],
    "Tungurahua": ["Ambato", "Baños de Agua Santa", "Cevallos", "Mocha", "Patate", "Quero", "San Pedro de Pelileo", "Santiago de Píllaro", "Tisaleo"],
    "Zamora Chinchipe": ["Zamora", "Chinchipe", "Nangaritza", "Yacuambi", "Yantzaza", "El Pangui", "Centinela del Cóndor", "Palanda", "Paquisha"]
}

@router.get("/ecuador/cantones/{provincia}")
def get_cantones(provincia: str) -> Any:
    # Búsqueda robusta (case-insensitive y sin espacios)
    provincia_clean = provincia.strip().lower()
    for key in CANTONES.keys():
        if key.lower() == provincia_clean:
            return CANTONES[key]
    return []

# --- Endpoints OmniClass ---

@router.get("/omniclass/search", response_model=List[OmniClassSchema])
def search_omniclass(
    q: str = Query(..., min_length=2),
    tabla: Optional[str] = None,
    db: Session = Depends(get_db)
) -> Any:
    """Búsqueda global en el maestro OmniClass."""
    query = db.query(OmniClassMaestro)
    
    if tabla:
        query = query.filter(OmniClassMaestro.tabla == tabla)
    
    # Búsqueda por código o título (insensible a mayúsculas)
    search_filter = f"%{q}%"
    query = query.filter(
        (OmniClassMaestro.codigo.ilike(search_filter)) |
        (OmniClassMaestro.titulo.ilike(search_filter)) |
        (OmniClassMaestro.titulo_es.ilike(search_filter))
    )
    
    return query.order_by(OmniClassMaestro.codigo).limit(50).all()

@router.get("/omniclass/tabla/{tabla_id}", response_model=List[OmniClassSchema])
def get_omniclass_tabla(
    tabla_id: str,
    nivel: Optional[int] = None,
    parent_id: Optional[int] = None,
    db: Session = Depends(get_db)
) -> Any:
    """Obtener items de una tabla específica, opcionalmente filtrados por nivel o padre."""
    query = db.query(OmniClassMaestro).filter(OmniClassMaestro.tabla == tabla_id)
    
    if nivel is not None:
        query = query.filter(OmniClassMaestro.nivel == nivel)
    if parent_id is not None:
        query = query.filter(OmniClassMaestro.parent_id == parent_id)
        
    return query.order_by(OmniClassMaestro.codigo).limit(200).all()
