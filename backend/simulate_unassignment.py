import sys
import os

# Añadir el directorio root al path para poder importar app
sys.path.append(os.getcwd())

from app.core.database import SessionLocal
from app.services.proyecto import proyecto_service
from app.repositories.base_trabajo import base_trabajo_repo
from app.models.usuario import Usuario
from app.models.proyecto import Proyecto
from app.models.base_trabajo import BaseTrabajo
from app.models.proyecto_asignacion import ProyectoAsignacion
from app.models.base_trabajo_asignacion import BaseTrabajoAsignacion

def test_unassignment():
    db = SessionLocal()
    try:
        # Buscar un usuario colaborador (Santiago Bermeo con rol usuario)
        user = db.query(Usuario).filter(Usuario.nombre_completo == "Santiago Bermeo", Usuario.rol == "usuario").first()
        if not user:
            print("ERROR: Usuario 'Santiago Bermeo' (usuario) no encontrado.")
            return

        # Buscar un proyecto que tenga esta asignación
        asignacion = db.query(ProyectoAsignacion).filter(ProyectoAsignacion.usuario_id == user.id).first()
        if asignacion:
            proyecto_id = asignacion.proyecto_id
            print(f"Probando DESASIGNACIÓN de Usuario ID {user.id} del Proyecto ID {proyecto_id}...")
            try:
                res = proyecto_service.unassign_user(db, proyecto_id=proyecto_id, usuario_id=user.id)
                print(f"RESULTADO PROYECTO: Éxito ({res})")
                
                # Verificar si se borró
                still_exists = db.query(ProyectoAsignacion).filter(ProyectoAsignacion.proyecto_id == proyecto_id, ProyectoAsignacion.usuario_id == user.id).first()
                if not still_exists:
                    print("VERIFICACIÓN: La asignación de proyecto ha sido eliminada correctamente.")
                else:
                    print("ERROR: La asignación de proyecto sigue existiendo en la DB.")
            except Exception as e:
                print(f"ERROR EN DESASIGNACIÓN DE PROYECTO: {str(e)}")
        else:
            print("AVISO: No se encontró ninguna asignación de proyecto para este usuario para probar el borrado.")

        # Probar desasignación de base
        asignacion_base = db.query(BaseTrabajoAsignacion).filter(BaseTrabajoAsignacion.usuario_id == user.id).first()
        if asignacion_base:
            base_id = asignacion_base.base_trabajo_id
            print(f"Probando DESASIGNACIÓN de Usuario ID {user.id} de la Base ID {base_id}...")
            try:
                res_base = base_trabajo_repo.unassign_user(db, base_id=base_id, usuario_id=user.id)
                print(f"RESULTADO BASE: Éxito ({res_base})")
                
                # Verificar si se borró
                still_exists_base = db.query(BaseTrabajoAsignacion).filter(BaseTrabajoAsignacion.base_trabajo_id == base_id, BaseTrabajoAsignacion.usuario_id == user.id).first()
                if not still_exists_base:
                    print("VERIFICACIÓN: La asignación de base ha sido eliminada correctamente.")
                else:
                    print("ERROR: La asignación de base sigue existiendo en la DB.")
            except Exception as e:
                print(f"ERROR EN DESASIGNACIÓN DE BASE: {str(e)}")
        else:
            print("AVISO: No se encontró ninguna asignación de base para este usuario para probar el borrado.")

    finally:
        db.close()

if __name__ == "__main__":
    test_unassignment()
