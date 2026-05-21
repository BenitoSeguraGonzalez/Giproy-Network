
from app.core.database import SessionLocal
from app.repositories.recurso import RecursoRepository
from app.models.recurso import Recurso
from app.models.subcategoria_item import SubcategoriaItem

def heal_db():
    db = SessionLocal()
    repo = RecursoRepository(db)
    try:
        # Encontrar todas las subcategorías en base 1
        subcats = db.query(SubcategoriaItem).filter(SubcategoriaItem.base_trabajo_id == 1).all()
        print(f"Sanando {len(subcats)} subcategorías en Base 1...")
        
        for sc in subcats:
            # Re-numerar cada subcategoría usando el nuevo repositorio robusto
            repo._fix_codes_inner(sc.id)
            print(f"  - Sanada Subcat {sc.codigo}: {sc.descripcion}")
            
        db.commit()
        print("BASE 1 TOTALMENTE SANEADA.")
        
        # Verificar un caso conocido de error
        r46 = db.query(Recurso).get(46)
        if r46:
            print(f"VERIFICACIÓN: Recurso 46 ahora tiene código {r46.codigo} (SubcatID {r46.subcategoria_item_id})")
            
    except Exception as e:
        print(f"ERROR DURANTE SANACIÓN: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    heal_db()
