
from app.core.database import SessionLocal
from app.models.usuario import Usuario
from app.models.proyecto import Proyecto
from app.repositories.proyecto import ProyectoRepository

proyecto_repo = ProyectoRepository()

def simulate_api_calls():
    db = SessionLocal()
    try:
        users = db.query(Usuario).all()
        for u in users:
            print(f"\nSIMULATING FOR USER: {u.nombre_completo} (Rol: {u.rol}, EmpresaID: {u.empresa_id})")
            
            # 1. Project List (Roots)
            target_empresa_id = u.empresa_id
            # Note: No empresa_id override simulated here for simplicity unless it's superadmin
            
            proyectos = proyecto_repo.get_roots(db=db, empresa_id=target_empresa_id)
            print(f"  Projects found in root list: {[p.nombre for p in proyectos]}")
            
            # 2. Revisions for Project 5
            # We know Project 5 exists. Let's see if this user can see its revisions.
            proj5 = db.query(Proyecto).filter(Proyecto.id == 5).first()
            if proj5:
                revisions = proyecto_repo.get_revisions_by_codigo_root(db=db, codigo_root=proj5.codigo_root, empresa_id=u.empresa_id)
                print(f"  Revisions found for Project 5 (root: {proj5.codigo_root}): {len(revisions)}")
            
    finally:
        db.close()

if __name__ == "__main__":
    simulate_api_calls()
