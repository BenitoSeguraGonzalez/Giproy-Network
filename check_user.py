from app.core.database import SessionLocal
from app.models.usuario import Usuario

db = SessionLocal()
user = db.query(Usuario).filter(Usuario.email.ilike('benito.segura@gmail.com')).first()
if user:
    print(f"User found: {user.email}")
    print(f"Active: {user.activo}")
    print(f"Role: {user.rol}")
    print(f"Hashed password starts with: {user.hashed_password[:10]}...")
else:
    print("User not found")
db.close()
