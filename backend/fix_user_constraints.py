from app.core.database import engine
from sqlalchemy import text

def fix_constraints():
    print("🚀 Ajustando restricciones de la tabla usuarios...")
    
    queries = [
        # Intentar eliminar la restricción única existente del email
        # El nombre por defecto en SQLAlchemy/Postgres suele ser 'usuarios_email_key'
        "ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_email_key",
        
        # Agregar la nueva restricción compuesta
        "ALTER TABLE usuarios ADD CONSTRAINT uq_usuario_email_empresa UNIQUE (email, empresa_id)"
    ]
    
    with engine.connect() as conn:
        for query in queries:
            try:
                print(f"Ejecutando: {query}")
                conn.execute(text(query))
                conn.commit()
                print(f"✅ Éxito: {query}")
            except Exception as e:
                print(f"⚠️ Aviso en {query}: {e}")
                conn.rollback()

    print("🏁 Proceso finalizado.")

if __name__ == "__main__":
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    fix_constraints()
