from app.core.database import SessionLocal, engine, Base
import app.models
from app.models.empresa import Empresa

# Forzar creación de tablas con los nuevos campos
Base.metadata.create_all(bind=engine)

def seed_test_company():
    db = SessionLocal()
    try:
        # Buscar si ya existe
        empresa = db.query(Empresa).filter(Empresa.nombre == "Empresa de prueba 001").first()
        if not empresa:
            empresa = Empresa(
                nombre="Empresa de prueba 001",
                codigo="TEST-001",
                ruc="12345678901",
                direccion="Calle Falsa 123, Distrito de Ingeniería",
                localidad="Madrid",
                provincia="Madrid",
                pais="España",
                telefono="+34 912 345 678",
                email="info@test001.com",
                contacto_nombre="Juan Pérez",
                contacto_email="jperez@test001.com",
                contacto_telefono="+34 600 000 000",
                logo_url="https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a?q=80&w=200&auto=format&fit=crop",
                activa=True
            )
            db.add(empresa)
            db.commit()
            print("Empresa de prueba 001 CREADA.")
        else:
            print("Empresa de prueba 001 ya existe.")
    finally:
        db.close()

if __name__ == "__main__":
    seed_test_company()
