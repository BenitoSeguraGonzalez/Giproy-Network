import jwt
from datetime import datetime, timedelta
from app.core.config import settings

def create_access_token(subject: str, expires_delta: timedelta = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

# ID de Benito Segura es 1 (usualmente el primero)
# Vamos a buscarlo por email para estar seguros
from app.core.database import SessionLocal
from app.models.usuario import Usuario

db = SessionLocal()
user = db.query(Usuario).filter(Usuario.email == 'benito.segura@gmail.com').first()
if user:
    token = create_access_token(user.id)
    print(token)
else:
    print("User not found")
db.close()
