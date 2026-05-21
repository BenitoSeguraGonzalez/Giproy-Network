import sys
import os

# Añadir el directorio root al path para poder importar app
sys.path.append(os.getcwd())

from app.core.database import SessionLocal
from app.services.proyecto import proyecto_service
from app.models.proyecto import Proyecto
from app.models.edt import EdtNode

def test_edt_assignment():
    db = SessionLocal()
    try:
        # 1. Buscar un proyecto con EDT
        project = db.query(Proyecto).first()
        if not project:
            print("No hay proyectos.")
            return
            
        edt_node = db.query(EdtNode).filter(EdtNode.proyecto_id == project.id).first()
        if not edt_node:
            print(f"El proyecto {project.nombre} no tiene nodos EDT. No se puede probar Rama.")
            return
            
        usuario_id = 5 # Santiago Bermeo v2
        admin_id = 1
        
        print(f"Probando asignación a Rama EDT {edt_node.codigo} del proyecto {project.nombre}...")
        
        # Asignar a rama
        asig = proyecto_service.assign_user(db, proyecto_id=project.id, usuario_id=usuario_id, asignado_por_id=admin_id, edt_id=edt_node.id)
        print(f"Asignación a rama EXITOSA. ID: {asig.id}, EDT_ID: {asig.edt_id}")
        
        # Verificar listado filtrado por rama
        users_branch = proyecto_service.get_assigned_users(db, proyecto_id=project.id, edt_id=edt_node.id)
        if any(u.id == usuario_id for u in users_branch):
            print("VERIFICACIÓN LISTADO RAMA: Correcto.")
        else:
            print("VERIFICACIÓN LISTADO RAMA: FALLIDA.")
            
        # Verificar listado global (no debería estar ahí si no fue asignado globalmente)
        users_global = proyecto_service.get_assigned_users(db, proyecto_id=project.id, edt_id=None)
        if any(u.id == usuario_id for u in users_global):
            print("VERIFICACIÓN LISTADO GLOBAL (Negativo): El usuario aparece en global pero solo se asignó a rama (esto puede ser normal si estaba asignado de antes).")
        else:
            print("VERIFICACIÓN LISTADO GLOBAL: Correcto (no aparece en global).")

        # Limpiar
        proyecto_service.unassign_user(db, proyecto_id=project.id, usuario_id=usuario_id, edt_id=edt_node.id)
        print("Desasignación de rama EXITOSA.")

    finally:
        db.close()

if __name__ == "__main__":
    test_edt_assignment()
