from sqlalchemy.orm import Session
from app.models.licencia import Licencia
from app.core.database import SessionLocal, engine, Base
import app.models # Asegura que todos los modelos se registren en Base

def seed_licenses():
    # Crear tablas si no existen
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        licenses = [
            {
                "nombre": "Exprés",
                "codigo": "EXPRES",
                "descripcion": "Ideal para profesionales independientes",
                "limites": {
                    "usuarios": 1,
                    "proyectos": 3,
                    "almacenamiento_gb": 0.5,
                    "modulos_permitidos": ["*"]
                }
            },
            {
                "nombre": "Estándar",
                "codigo": "STANDARD",
                "descripcion": "Para equipos pequeños en crecimiento",
                "limites": {
                    "usuarios": 1,
                    "proyectos": 20,
                    "almacenamiento_gb": 5,
                    "modulos_permitidos": ["*"]
                }
            },
            {
                "nombre": "Profesional",
                "codigo": "PRO",
                "descripcion": "Para medianas empresas con múltiples proyectos",
                "limites": {
                    "usuarios": 5,
                    "proyectos": 100,
                    "almacenamiento_gb": 20,
                    "modulos_permitidos": ["*"]
                }
            },
            {
                "nombre": "Empresarial",
                "codigo": "ENTERPRISE",
                "descripcion": "Solución ilimitada para grandes corporaciones",
                "limites": {
                    "usuarios": 100, # Representa 'ilimitado' práctico
                    "proyectos": 1000,
                    "almacenamiento_gb": 100,
                    "modulos_permitidos": ["*"]
                }
            }
        ]

        for lic_data in licenses:
            existing = db.query(Licencia).filter(Licencia.codigo == lic_data["codigo"]).first()
            if not existing:
                db.add(Licencia(**lic_data))
        
        db.commit()
        print("Licencias inicializadas con éxito.")
    except Exception as e:
        print(f"Error al inicializar licencias: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_licenses()
