from app.core.security import verify_password, get_password_hash

password = "Cocoliso.1"
hashed = get_password_hash(password)
print(f"Password: {password}")
print(f"Hashed: {hashed}")

match = verify_password(password, hashed)
print(f"Verification Match: {match}")

# Prueba con un hash conocido si lo tenemos, o simplemente verificar si falla por error de libreria
try:
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    print("Passlib CryptContext initialized.")
except Exception as e:
    print(f"Passlib Init Error: {e}")
