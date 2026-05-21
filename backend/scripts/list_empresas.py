from sqlalchemy import create_engine, text
engine = create_engine('postgresql://postgres:admin123@localhost:5432/giproy_erp')
with engine.connect() as conn:
    result = conn.execute(text("SELECT nombre FROM empresas"))
    for row in result:
        print(row[0])
