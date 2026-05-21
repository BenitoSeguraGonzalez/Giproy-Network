from sqlalchemy import create_engine, text

engine = create_engine('postgresql://postgres:admin123@localhost:5432/giproy_erp')

update_query = text("""
    UPDATE empresas 
    SET 
        ruc = '20123456789',
        codigo = 'PRU-001',
        direccion = 'Av. Industrial 456, Parque Tecnológico',
        localidad = 'Lima',
        provincia = 'Lima',
        pais = 'Perú',
        telefono = '+51 987 654 321',
        email = 'contacto@pruebas001.com',
        contacto_nombre = 'Juan Pérez',
        contacto_email = 'jperez@pruebas001.com',
        contacto_telefono = '+51 999 888 777'
    WHERE nombre = 'Empresa de prueba 001'
""")

with engine.connect() as conn:
    conn.execute(update_query)
    conn.commit()
    print("Datos de 'Empresa de prueba 001' actualizados correctamente.")
