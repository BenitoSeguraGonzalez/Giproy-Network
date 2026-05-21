from app.core.database import SessionLocal
from app.models.recurso import CategoriaRecurso

def seed_categories():
    db = SessionLocal()
    categories = [
        { 'id': 1, 'nombre': 'Equipos y Herramientas' },
        { 'id': 2, 'nombre': 'Materiales' },
        { 'id': 3, 'nombre': 'Transporte' },
        { 'id': 4, 'nombre': 'Mano de Obra' },
        { 'id': 5, 'nombre': 'Análisis de Precios Unitarios' },
    ]
    
    try:
        for cat_data in categories:
            cat = db.query(CategoriaRecurso).filter(CategoriaRecurso.id == cat_data['id']).first()
            if not cat:
                new_cat = CategoriaRecurso(**cat_data)
                db.add(new_cat)
        db.commit()
        print("Categorías sembradas correctamente.")
    except Exception as e:
        db.rollback()
        print(f"Error sembrando categorías: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_categories()
