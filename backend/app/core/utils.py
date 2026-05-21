import unicodedata

def normalize_string(s: str) -> str:
    """
    Normaliza una cadena para comparación:
    - Convierte a minúsculas.
    - Elimina acentos y diacríticos.
    - Elimina espacios en blanco extra.
    """
    if not s:
        return ""
    
    # Convertir a minúsculas y quitar espacios extra
    s = s.strip().lower()
    
    # Descomponer caracteres con acentos
    normalized = unicodedata.normalize('NFD', s)
    
    # Filtrar solo los caracteres que no son diacríticos (acentos)
    result = "".join(c for c in normalized if unicodedata.category(c) != 'Mn')

    return " ".join(result.split())

# Diccionario técnico básico para auto-corrección rápida
TECHNICAL_TERMS = {
    "camion": "Camión",
    "hormigon": "Hormigón",
    "volquete": "Volquete",
    "excavadora": "Excavadora",
    "cemento": "Cemento",
    "ladrillo": "Ladrillo",
    "tubería": "Tubería",
    "tuberia": "Tubería",
    "instalacion": "Instalación",
    "electricidad": "Electricidad",
    "construccion": "Construcción",
    "ingenieria": "Ingeniería",
    "subcategoria": "Subcategoría",
    "categoria": "Categoría",
    "descripción": "Descripción",
    "descripcion": "Descripción",
    "observación": "Observación",
    "observacion": "Observación",
    "codigo": "Código",
}
