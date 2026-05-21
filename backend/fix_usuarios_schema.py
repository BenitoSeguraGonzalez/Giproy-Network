import psycopg2
import os

# Database configuration from .env
DB_NAME = "giproy_erp"
DB_USER = "postgres"
DB_PASS = "CEE9846B4CFDA0E7E14E3722BE702C88"
DB_HOST = "localhost"
DB_PORT = "5432"

try:
    conn = psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASS,
        host=DB_HOST,
        port=DB_PORT
    )
    cur = conn.cursor()
    
    # Check columns of usuarios table
    cur.execute("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'usuarios'
    """)
    columns = [row[0] for row in cur.fetchall()]
    print(f"Columns in 'usuarios': {columns}")
    
    # Check for missing columns
    required = [
        'ruc', 'nombres', 'apellidos', 'alias', 'nacionalidad', 'profesion',
        'ciudad', 'provincia', 'canton', 'pais', 'movil',
        'acepta_politica_privacidad', 'acepta_politicas_comunicacion', 'autoriza_publicidad',
        'fecha_aceptacion_politica_privacidad', 'fecha_aceptacion_politicas_comunicacion',
        'fecha_autorizacion_publicidad', 'ruc_verificado', 'razon_social_ruc',
        'estado_contribuyente', 'clase_contribuyente', 'fecha_inicio_actividades',
        'actividad_economica', 'fecha_expiracion', 'current_session_id',
        'current_session_started_at', 'current_session_expires_at', 'last_active_at',
        'current_session_device_id'
    ]
    missing = [c for c in required if c not in columns]
    print(f"Missing columns in 'usuarios': {missing}")
    
    if missing:
        print("Adding missing columns to 'usuarios'...")
        for col in missing:
            if col.startswith('acepta') or col.startswith('autoriza') or col == 'ruc_verificado':
                cur.execute(f"ALTER TABLE usuarios ADD COLUMN {col} BOOLEAN DEFAULT FALSE")
            elif col.startswith('fecha_') or col.endswith('_at'):
                cur.execute(f"ALTER TABLE usuarios ADD COLUMN {col} TIMESTAMPTZ")
            elif col == 'actividad_economica':
                cur.execute(f"ALTER TABLE usuarios ADD COLUMN {col} TEXT")
            else:
                cur.execute(f"ALTER TABLE usuarios ADD COLUMN {col} VARCHAR(255)")
        conn.commit()
        print("Columns added successfully.")
    
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
