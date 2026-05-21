import sys
import os

# Asegurar que el path sea el de backend
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.database import SessionLocal, engine
from app.models.pais import Pais
from sqlalchemy import text

paises_data = [
    {"nombre": "Afganistán", "codigo": "AF", "prefijo": "+93", "moneda": "Afgani afgano", "simbolo_moneda": "؋"},
    {"nombre": "Albania", "codigo": "AL", "prefijo": "+355", "moneda": "Lek albanés", "simbolo_moneda": "L"},
    {"nombre": "Alemania", "codigo": "DE", "prefijo": "+49", "moneda": "Euro", "simbolo_moneda": "€"},
    {"nombre": "Andorra", "codigo": "AD", "prefijo": "+376", "moneda": "Euro", "simbolo_moneda": "€"},
    {"nombre": "Angola", "codigo": "AO", "prefijo": "+244", "moneda": "Kwanza angoleño", "simbolo_moneda": "Kz"},
    {"nombre": "Antigua y Barbuda", "codigo": "AG", "prefijo": "+1 268", "moneda": "Dólar del Caribe Oriental", "simbolo_moneda": "$"},
    {"nombre": "Arabia Saudita", "codigo": "SA", "prefijo": "+966", "moneda": "Riyal saudí", "simbolo_moneda": "ر.س"},
    {"nombre": "Argelia", "codigo": "DZ", "prefijo": "+213", "moneda": "Dinar argelino", "simbolo_moneda": "د.ج"},
    {"nombre": "Argentina", "codigo": "AR", "prefijo": "+54", "moneda": "Peso argentino", "simbolo_moneda": "$"},
    {"nombre": "Armenia", "codigo": "AM", "prefijo": "+374", "moneda": "Dram armenio", "simbolo_moneda": "֏"},
    {"nombre": "Australia", "codigo": "AU", "prefijo": "+61", "moneda": "Dólar australiano", "simbolo_moneda": "$"},
    {"nombre": "Austria", "codigo": "AT", "prefijo": "+43", "moneda": "Euro", "simbolo_moneda": "€"},
    {"nombre": "Azerbaiyán", "codigo": "AZ", "prefijo": "+994", "moneda": "Manat azerbaiyano", "simbolo_moneda": "₼"},
    {"nombre": "Bahamas", "codigo": "BS", "prefijo": "+1 242", "moneda": "Dólar bahameño", "simbolo_moneda": "$"},
    {"nombre": "Bangladés", "codigo": "BD", "prefijo": "+880", "moneda": "Taka bangladesí", "simbolo_moneda": "৳"},
    {"nombre": "Barbados", "codigo": "BB", "prefijo": "+1 246", "moneda": "Dólar de Barbados", "simbolo_moneda": "$"},
    {"nombre": "Bélgica", "codigo": "BE", "prefijo": "+32", "moneda": "Euro", "simbolo_moneda": "€"},
    {"nombre": "Belice", "codigo": "BZ", "prefijo": "+501", "moneda": "Dólar beliceño", "simbolo_moneda": "$"},
    {"nombre": "Bolivia", "codigo": "BO", "prefijo": "+591", "moneda": "Boliviano", "simbolo_moneda": "Bs."},
    {"nombre": "Brasil", "codigo": "BR", "prefijo": "+55", "moneda": "Real brasileño", "simbolo_moneda": "R$"},
    {"nombre": "Bulgaria", "codigo": "BG", "prefijo": "+359", "moneda": "Lev búlgaro", "simbolo_moneda": "лв"},
    {"nombre": "Canadá", "codigo": "CA", "prefijo": "+1", "moneda": "Dólar canadiense", "simbolo_moneda": "$"},
    {"nombre": "Chile", "codigo": "CL", "prefijo": "+56", "moneda": "Peso chileno", "simbolo_moneda": "$"},
    {"nombre": "China", "codigo": "CN", "prefijo": "+86", "moneda": "Yuan chino", "simbolo_moneda": "¥"},
    {"nombre": "Colombia", "codigo": "CO", "prefijo": "+57", "moneda": "Peso colombiano", "simbolo_moneda": "$"},
    {"nombre": "Corea del Sur", "codigo": "KR", "prefijo": "+82", "moneda": "Won surcoreano", "simbolo_moneda": "₩"},
    {"nombre": "Costa Rica", "codigo": "CR", "prefijo": "+506", "moneda": "Colón costarricense", "simbolo_moneda": "₡"},
    {"nombre": "Cuba", "codigo": "CU", "prefijo": "+53", "moneda": "Peso cubano", "simbolo_moneda": "$"},
    {"nombre": "Dinamarca", "codigo": "DK", "prefijo": "+45", "moneda": "Corona danesa", "simbolo_moneda": "kr"},
    {"nombre": "Ecuador", "codigo": "EC", "prefijo": "+593", "moneda": "Dólar estadounidense", "simbolo_moneda": "$"},
    {"nombre": "Egipto", "codigo": "EG", "prefijo": "+20", "moneda": "Libra egipcia", "simbolo_moneda": "£"},
    {"nombre": "El Salvador", "codigo": "SV", "prefijo": "+503", "moneda": "Dólar estadounidense", "simbolo_moneda": "$"},
    {"nombre": "España", "codigo": "ES", "prefijo": "+34", "moneda": "Euro", "simbolo_moneda": "€"},
    {"nombre": "Estados Unidos", "codigo": "US", "prefijo": "+1", "moneda": "Dólar estadounidense", "simbolo_moneda": "$"},
    {"nombre": "Francia", "codigo": "FR", "prefijo": "+33", "moneda": "Euro", "simbolo_moneda": "€"},
    {"nombre": "Guatemala", "codigo": "GT", "prefijo": "+502", "moneda": "Quetzal guatemalteco", "simbolo_moneda": "Q"},
    {"nombre": "Honduras", "codigo": "HN", "prefijo": "+504", "moneda": "Lempira hondureño", "simbolo_moneda": "L"},
    {"nombre": "India", "codigo": "IN", "prefijo": "+91", "moneda": "Rupia india", "simbolo_moneda": "₹"},
    {"nombre": "Italia", "codigo": "IT", "prefijo": "+39", "moneda": "Euro", "simbolo_moneda": "€"},
    {"nombre": "Japón", "codigo": "JP", "prefijo": "+81", "moneda": "Yen japonés", "simbolo_moneda": "¥"},
    {"nombre": "México", "codigo": "MX", "prefijo": "+52", "moneda": "Peso mexicano", "simbolo_moneda": "$"},
    {"nombre": "Nicaragua", "codigo": "NI", "prefijo": "+505", "moneda": "Córdoba nicaragüense", "simbolo_moneda": "C$"},
    {"nombre": "Panamá", "codigo": "PA", "prefijo": "+507", "moneda": "Balboa panameño", "simbolo_moneda": "B/."},
    {"nombre": "Paraguay", "codigo": "PY", "prefijo": "+595", "moneda": "Guaraní paraguayo", "simbolo_moneda": "₲"},
    {"nombre": "Perú", "codigo": "PE", "prefijo": "+51", "moneda": "Sol peruano", "simbolo_moneda": "S/"},
    {"nombre": "Reino Unido", "codigo": "GB", "prefijo": "+44", "moneda": "Libra esterlina", "simbolo_moneda": "£"},
    {"nombre": "República Dominicana", "codigo": "DO", "prefijo": "+1", "moneda": "Peso dominicano", "simbolo_moneda": "$"},
    {"nombre": "Rusia", "codigo": "RU", "prefijo": "+7", "moneda": "Rublo ruso", "simbolo_moneda": "₽"},
    {"nombre": "Uruguay", "codigo": "UY", "prefijo": "+598", "moneda": "Peso uruguayo", "simbolo_moneda": "$"},
    {"nombre": "Venezuela", "codigo": "VE", "prefijo": "+58", "moneda": "Bolívar", "simbolo_moneda": "Bs."}
]

def seed():
    print("Migrando estructura (ALTER TABLE paises)...")
    try:
        with engine.connect() as connection:
            connection.execute(text("ALTER TABLE paises ADD COLUMN simbolo_moneda VARCHAR(10);"))
            connection.commit()
            print("Columna 'simbolo_moneda' agregada con éxito.")
    except Exception as e:
        print(f"Nota: {e} (quizá la columna ya existía)")

    db = SessionLocal()
    print("Poblando Base de Datos con todos los Países Internacionales...")

    try:
        for p_data in paises_data:
            existente = db.query(Pais).filter(Pais.nombre == p_data["nombre"]).first()
            if existente:
                existente.codigo = p_data["codigo"]
                existente.prefijo = p_data["prefijo"]
                existente.moneda = p_data["moneda"]
                existente.simbolo_moneda = p_data["simbolo_moneda"]
            else:
                nuevo = Pais(**p_data)
                db.add(nuevo)
        
        db.commit()
        print(f"Se insertaron/actualizaron {len(paises_data)} países correctamente con prefijos telefónicos y monedas.")
    except Exception as e:
        db.rollback()
        print(f"Error insertando países: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
