import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.proyecto import Proyecto
from app.services.proyecto import proyecto_service
from app.models.usuario import Usuario

def test_proyectos_refactor():
    db = SessionLocal()
    try:
        # 1. Test List (get_projects_roots)
        # Getting a sample enterprise ID from an existing project
        sample_proj = db.query(Proyecto).first()
        if not sample_proj:
            print("No projects found in database to test with.")
            return

        empresa_id = sample_proj.empresa_id
        print(f"Testing with enterprise ID: {empresa_id}")

        roots = proyecto_service.get_projects_roots(db=db, empresa_id=empresa_id)
        print(f"Successfully fetched {len(roots)} project roots.")
        if roots:
            first_root = roots[0]
            print(f"First project: {first_root.nombre}, Revisions: {first_root.num_revisiones}")

        # 2. Test Get by ID (via Endpoint function if possible or just service check)
        # We'll mock the user and call the service/repo logic
        class MockUser:
            def __init__(self, id, empresa_id, rol):
                self.id = id
                self.empresa_id = empresa_id
                self.rol = rol

        mock_user = MockUser(id=1, empresa_id=empresa_id, rol="Superadministrador")
        
        # Testing service update logic
        from app.schemas.proyecto import ProyectoUpdate
        update_in = ProyectoUpdate(descripcion=sample_proj.descripcion + " (Checked)")
        updated = proyecto_service.update_proyecto(db=db, proyecto_id=sample_proj.id, obj_in=update_in, empresa_id=empresa_id)
        print(f"Updated project description successfully: {updated.descripcion}")

        # Testing service revision creation (might be slow if there are many details, but let's try)
        print("Testing revision creation...")
        new_rev = proyecto_service.create_revision(db=db, proyecto_id=sample_proj.id, empresa_id=empresa_id)
        if new_rev:
            print(f"Successfully created revision: {new_rev.codigo}")
            # Clean up the test revision? Maybe better to keep it if it's a dev DB or just log it.
            # But the task says "Verification", let's be careful.
        
    except Exception as e:
        print(f"Error during verification: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_proyectos_refactor()
