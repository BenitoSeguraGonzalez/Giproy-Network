from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.pais import Pais

def seed_paises():
    db = SessionLocal()
    try:
        # Lista de países (puedes ampliar esta lista)
        paises_data = [
            {"nombre": "Ecuador", "codigo": "EC", "prefijo": "+593", "moneda": "Dólar"},
            {"nombre": "España", "codigo": "ES", "prefijo": "+34", "moneda": "Euro"},
            {"nombre": "Colombia", "codigo": "CO", "prefijo": "+57", "moneda": "Peso Colombiano"},
            {"nombre": "Perú", "codigo": "PE", "prefijo": "+51", "moneda": "Sol"},
            {"nombre": "Argentina", "codigo": "AR", "prefijo": "+54", "moneda": "Peso Argentino"},
            {"nombre": "Chile", "codigo": "CL", "prefijo": "+56", "moneda": "Peso Chileno"},
            {"nombre": "México", "codigo": "MX", "prefijo": "+52", "moneda": "Peso Mexicano"},
            {"nombre": "Venezuela", "codigo": "VE", "prefijo": "+58", "moneda": "Bolívar"},
            {"nombre": "Estados Unidos", "codigo": "US", "prefijo": "+1", "moneda": "Dólar"},
            {"nombre": "Panamá", "codigo": "PA", "prefijo": "+507", "moneda": "Balboa"},
            {"nombre": "Bolivia", "codigo": "BO", "prefijo": "+591", "moneda": "Boliviano"},
            {"nombre": "Uruguay", "codigo": "UY", "prefijo": "+598", "moneda": "Peso Uruguayo"},
            {"nombre": "Paraguay", "codigo": "PY", "prefijo": "+595", "moneda": "Guaraní"},
            {"nombre": "Costa Rica", "codigo": "CR", "prefijo": "+506", "moneda": "Colón"},
            {"nombre": "Honduras", "codigo": "HN", "prefijo": "+504", "moneda": "Lempira"},
            {"nombre": "Guatemala", "codigo": "GT", "prefijo": "+502", "moneda": "Quetzal"},
            {"nombre": "El Salvador", "codigo": "SV", "prefijo": "+503", "moneda": "Dólar"},
            {"nombre": "Nicaragua", "codigo": "NI", "prefijo": "+505", "moneda": "Córdoba"},
            {"nombre": "República Dominicana", "codigo": "DO", "prefijo": "+1-809", "moneda": "Peso"},
        ]

        for data in paises_data:
            exists = db.query(Pais).filter(Pais.nombre == data["nombre"]).first()
            if not exists:
                pais = Pais(**data)
                db.add(pais)
        
        db.commit()
        print(f"Se han cargado {len(paises_data)} países.")
    except Exception as e:
        print(f"Error cargando países: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_paises()
