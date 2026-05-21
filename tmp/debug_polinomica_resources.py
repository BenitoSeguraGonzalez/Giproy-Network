from app.core.database import SessionLocal
from app.services.formula_polinomica import formula_polinomica_service
import json

def debug_resources():
    db = SessionLocal()
    # Usando el presupuesto 2 que sé que tiene datos
    presupuesto_id = 2
    try:
        resources = formula_polinomica_service.get_formula_resources(db, presupuesto_id)
        print(f"Total recursos encontrados: {len(resources)}")
        
        # Agrupar por subcategoria_codigo para ver qué está llegando
        stats = {}
        for r in resources:
            sc = r['subcategoria_codigo']
            stats[sc] = stats.get(sc, 0) + 1
        
        print("Estadísticas por subcategoria_codigo:")
        print(json.dumps(stats, indent=2))
        
        if resources:
            print("\nEjemplo del primer recurso:")
            print(json.dumps(resources[0], indent=2))
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    debug_resources()
