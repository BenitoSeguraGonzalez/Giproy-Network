from app.core.config import settings

def send_reset_password_email(email: str, token: str):
    # En desarrollo, imprimimos en consola
    reset_link = f"http://localhost:3000/reset-password?token={token}"
    print("\n" + "="*50)
    print(f"EMAIL MOCK PARA: {email}")
    print(f"Para restablecer su contraseña, use el siguiente enlace:")
    print(reset_link)
    print("="*50 + "\n")
    
    # Aquí iría la lógica real con smtplib o FastAPI-Mail
    return True
