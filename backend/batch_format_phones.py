import re
import sys
import os

# Añadir el directorio actual al path para que reconozca el módulo 'app'
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.empresa import Empresa
from app.models.usuario import Usuario
from app.models.pais import Pais

def format_phone_python(phone: str, prefix: str) -> str:
    """
    Lógica de formateo internacional para Python.
    Espejo de formatInternationalPhone en JS.
    """
    if not phone:
        return ""
    
    # Limpiar todo lo que no sea dígito
    clean = re.sub(r'\D', '', phone)
    
    # Limpiar prefijo
    clean_prefix = re.sub(r'\D', '', prefix) if prefix else "593"

    # Si ya empieza con el prefijo, lo quitamos temporalmente para normalizar
    if clean.startswith(clean_prefix):
        clean = clean[len(clean_prefix):]
    
    # Quitar el 0 inicial si existe (típico en formato local)
    if clean.startswith("0"):
        clean = clean[1:]

    # Reconstruir el número internacional limpio
    full_clean = clean_prefix + clean
    
    # Aplicar agrupación según longitud (Ecuador móvil y fijo como base)
    if len(full_clean) == 12:  # Ejemplo: 593 96 416 64 46
        return f"+{full_clean[:3]} {full_clean[3:5]} {full_clean[5:8]} {full_clean[8:10]} {full_clean[10:12]}"
    elif len(full_clean) == 11:  # Ejemplo: 593 2 416 64 46
        return f"+{full_clean[:3]} {full_clean[3:4]} {full_clean[4:7]} {full_clean[7:9]} {full_clean[9:11]}"
    
    # Para otras longitudes, solo añadir el +
    return f"+{full_clean}"

def migrate():
    print("🚀 Iniciando formateo masivo de teléfonos...")
    db = SessionLocal()
    try:
        # Cargar prefijos
        paises_map = {p.id: p.prefijo for p in db.query(Pais).all()}
        paises_name_map = {p.nombre: p.prefijo for p in db.query(Pais).all()}
        
        # 1. Procesar Empresas
        print("Procesando empresas...")
        empresas = db.query(Empresa).all()
        for emp in empresas:
            prefix = paises_name_map.get(emp.pais, "593")
            if emp.telefono:
                emp.telefono = format_phone_python(emp.telefono, prefix)
            if emp.contacto_telefono:
                emp.contacto_telefono = format_phone_python(emp.contacto_telefono, prefix)
        
        # 2. Procesar Ingenieros de costos (Usuarios)
        print("Procesando Ingenieros de costos...")
        usuarios = db.query(Usuario).all()
        for user in usuarios:
            # Los usuarios vinculan el país por nombre en su modelo
            prefix = paises_name_map.get(user.pais, "593")
            if user.movil:
                user.movil = format_phone_python(user.movil, prefix)
                
        db.commit()
        print("✅ Base de datos actualizada con éxito.")
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
