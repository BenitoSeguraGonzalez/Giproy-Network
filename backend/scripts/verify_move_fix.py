
from app.core.database import SessionLocal
from app.repositories.recurso import RecursoRepository
from app.models.recurso import Recurso

def test_move():
    db = SessionLocal()
    repo = RecursoRepository(db)
    
    try:
        # Buscamos dos subcategorías con recursos
        recs = db.query(Recurso).filter(Recurso.base_trabajo_id == 1).all()
        if len(recs) < 10:
            print("No hay suficientes recursos para probar el movimiento")
            return
            
        r1 = recs[0]
        r1_id = r1.id
        old_subcat = r1.subcategoria_item_id
        
        # Encontramos otra subcategoría
        other_subcat = next(r.subcategoria_item_id for r in recs if r.subcategoria_item_id != old_subcat)
        
        print(f"Probando mover Recurso ID: {r1_id} de Subcat: {old_subcat} a Subcat: {other_subcat}")
        
        # Realizamos el movimiento
        moved = repo.move(r1_id, other_subcat)
        
        if moved and moved.subcategoria_item_id == other_subcat:
            print("¡Movimiento exitoso 1!")
            
            # Movemos de vuelta para asegurar que la re-numeración en origen y destino funcionó
            repo.move(r1_id, old_subcat)
            print("¡Movimiento exitoso de vuelta!")
        else:
            print("Fallo en el movimiento")
            
    except Exception as e:
        print(f"ERROR DURANTE LA PRUEBA: {str(e)}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    test_move()
