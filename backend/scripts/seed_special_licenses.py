import os
import sys

# Añadir el directorio raíz al path para poder importar la app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.licencia import Licencia

def seed_special_licenses():
    db: Session = SessionLocal()
    try:
        # 1. Buscar licencias base
        pro_plus = db.query(Licencia).filter(Licencia.codigo == "PRO").first()
        pro_indiv = db.query(Licencia).filter(Licencia.codigo == "STANDARD").first()
        
        if not pro_plus or not pro_indiv:
            # Fallback a buscar por nombre si los códigos no coinciden
            pro_plus = db.query(Licencia).filter(Licencia.nombre.ilike("%Profesional%")).first()
            pro_indiv = db.query(Licencia).filter(Licencia.nombre.ilike("%Estándar%")).first()
            
            if not pro_plus:
                print("Error: No se encontró la licencia base 'Profesional Plus'.")
                return
            if not pro_indiv:
                print("Error: No se encontró la licencia base 'Profesional Individual'.")
                return

        special_licenses = [
            {
                "nombre": "Comunidad (Tester)",
                "codigo": "COMMUNITY_TESTER",
                "descripcion": "Licencia orientada a usuarios de comunidad que prueban nuevas funcionalidades.",
                "limites": {
                    "usuarios": 5,
                    "proyectos": 100,
                    "almacenamiento_gb": 20,
                    "modulos_permitidos": ["*"],
                    "is_tester": True,
                    "is_commercial": False
                },
                "es_especial": True,
                "base_licencia_id": pro_plus.id
            },
            {
                "nombre": "Campus (Universidades)",
                "codigo": "CAMPUS_ACADEMIC",
                "descripcion": "Licencia para universidades, centros educativos y uso académico.",
                "limites": {
                    "usuarios": 50,
                    "proyectos": 999999,  # Ilimitados simbólicamente
                    "almacenamiento_gb": 50,
                    "modulos_permitidos": ["*"],
                    "is_academic": True,
                    "is_commercial": False
                },
                "es_especial": True,
                "base_licencia_id": pro_plus.id
            },
            {
                "nombre": "Academy (Formación)",
                "codigo": "ACADEMY_TRAINING",
                "descripcion": "Licencia para formación, cursos, capacitaciones y entornos de aprendizaje guiado.",
                "limites": {
                    "usuarios": 20,
                    "proyectos": 50,
                    "almacenamiento_gb": 10,
                    "modulos_permitidos": ["*"],
                    "is_training": True,
                    "is_commercial": False,
                    "reset_periodical": True
                },
                "es_especial": True,
                "base_licencia_id": pro_indiv.id
            }
        ]

        for lic_data in special_licenses:
            existing = db.query(Licencia).filter(Licencia.codigo == lic_data["codigo"]).first()
            if not existing:
                nueva = Licencia(**lic_data)
                db.add(nueva)
                print(f"Añadiendo licencia: {lic_data['nombre']}")
            else:
                print(f"La licencia {lic_data['nombre']} ya existe.")
        
        db.commit()
        print("Seeding de licencias especiales completado con éxito.")
        
    except Exception as e:
        db.rollback()
        print(f"Error durante el seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_special_licenses()
