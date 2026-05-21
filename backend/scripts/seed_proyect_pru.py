from sqlalchemy import create_engine, text

engine = create_engine('postgresql://postgres:admin123@localhost:5432/giproy_erp')

with engine.connect() as conn:
    # 1. Obtener ID de Empresa de prueba 001
    emp_res = conn.execute(text("SELECT id FROM empresas WHERE nombre = 'Empresa de prueba 001'"))
    emp_id = emp_res.fetchone()[0]
    
    # 2. Insertar proyecto si no existe
    proy_res = conn.execute(text(f"SELECT id FROM proyectos WHERE empresa_id = {emp_id}"))
    if not proy_res.fetchone():
        insert_proy = text("""
            INSERT INTO proyectos (nombre, codigo, descripcion, estado, presupuesto_estimado, moneda, empresa_id)
            VALUES ('Habilitación Urbana Sector A', 'PROY-001', 'Proyecto de infraestructura vial y servicios básicos', 'Planificación', 500000.00, 'USD', :emp_id)
        """)
        conn.execute(insert_proy, {"emp_id": emp_id})
        conn.commit()
        print("Proyecto de prueba creado para Empresa de prueba 001.")
    else:
        print("La empresa ya tiene proyectos registrados.")
