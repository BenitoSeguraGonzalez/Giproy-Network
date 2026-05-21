import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.usuario import Usuario

def update_user_info():
    db = SessionLocal()
    email = "dreams2k@hotmail.com"
    user = db.query(Usuario).filter(Usuario.email == email).first()
    
    if user:
        user.ruc = "1728399856001"
        user.nombres = "Jesús Benito"
        user.apellidos = "Segura González"
        user.alias = "Dreams2K"
        user.movil = "+593 96 416 6446"
        user.profesion = "Ing de Sistemas"
        user.ciudad = "Cuenca"
        user.provincia = "Azuay"
        user.pais = "Ecuador"
        
        db.commit()
        print(f"Usuario {email} actualizado correctamente en la DB.")
    else:
        print(f"Usuario {email} NO encontrado")
        
    db.close()

if __name__ == "__main__":
    update_user_info()
