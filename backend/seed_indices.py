from app.core.database import SessionLocal
from app.models.polinomica import IndiceINEC

def seed_indices():
    db = SessionLocal()
    indices = [
        { "codigo": "39", "descripcion": "INDEC - Mano de Obra" },
        { "codigo": "19", "descripcion": "INDEC - Cemento Portland" },
        { "codigo": "37", "descripcion": "INDEC - Hierro de Refuerzo" },
        { "codigo": "21", "descripcion": "INDEC - Combustibles" },
        { "codigo": "65", "descripcion": "INDEC - Otros Materiales" },
    ]
    
    try:
        for data in indices:
            exists = db.query(IndiceINEC).filter(IndiceINEC.codigo == data["codigo"]).first()
            if not exists:
                db.add(IndiceINEC(**data))
        db.commit()
        print("Índices INEC sembrados.")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_indices()
