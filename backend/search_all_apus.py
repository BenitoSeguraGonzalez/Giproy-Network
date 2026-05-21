
from sqlalchemy import text
import sys
from pathlib import Path
sys.path.append(str(Path.cwd()))
from app.core.database import engine

def search_all_apus():
    with engine.connect() as conn:
        print("--- All APUs with Code 5-001-001 ---")
        res = conn.execute(text("SELECT id, codigo, descripcion, empresa_id, base_trabajo_id, costo_directo FROM apus WHERE codigo = '5-001-001'")).all()
        for r in res:
            e_name = conn.execute(text(f"SELECT nombre FROM empresas WHERE id={r[3]}")).scalar()
            print(f"ID: {r[0]} | Desc: {r[2]} | Empresa: {r[3]} ({e_name}) | Base: {r[4]} | Costo: {r[5]}")

if __name__ == "__main__":
    search_all_apus()
