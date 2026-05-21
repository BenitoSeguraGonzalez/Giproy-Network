import re
import os
from sqlalchemy import create_engine, text
from app.core.config import settings
from app.core.database import Base
from app.models.unidad import Unidad
from app.models.codcpc import CodCPC
from app.models.recurso import Recurso, CategoriaRecurso
from app.models.subcategoria_item import SubcategoriaItem
from app.models.base_trabajo import BaseTrabajo
from app.models.empresa import Empresa
from sqlalchemy.orm import sessionmaker

def parse_sql_line(line):
    """
    Parses a single SQL INSERT INTO line and returns a list of values.
    Handles single-quote escaped strings and commas.
    """
    if "VALUES" not in line:
        return None
    
    # Extract everything inside the first ( and last )
    start = line.find("(")
    end = line.rfind(")")
    if start == -1 or end == -1:
        return None
    
    content = line[start+1:end]
    
    values = []
    current = ""
    in_string = False
    i = 0
    while i < len(content):
        char = content[i]
        
        if char == "'":
            # Check for escaped single quote ''
            if i + 1 < len(content) and content[i+1] == "'":
                current += "'"
                i += 1
            else:
                in_string = not in_string
        elif char == "," and not in_string:
            values.append(current.strip())
            current = ""
        else:
            current += char
        i += 1
    
    values.append(current.strip())
    
    # Clean up values (remove extra quotes, convert NULL)
    cleaned = []
    for v in values:
        if v.upper() == "NULL":
            cleaned.append(None)
        elif v.startswith("'") and v.endswith("'"):
            cleaned.append(v[1:-1])
        else:
            cleaned.append(v)
    return cleaned

def seed_all():
    engine = create_engine(settings.sync_database_url)
    
    print("--- Creando Tablas si no existen ---")
    Base.metadata.create_all(engine)
    
    Session = sessionmaker(bind=engine)
    session = Session()

    # Determinar ruta del archivo basándose en la ubicación del script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    base_dir = os.path.dirname(script_dir) # backend/
    project_root = os.path.dirname(base_dir) # e:/Repositorios/GiProy Network/
    
    print(f"Raíz del proyecto detectada: {project_root}")

    print("--- Cargando Unidades ---")
    unidades_file = os.path.join(project_root, "DBDump", "unidades.sql")
    if os.path.exists(unidades_file):
        print(f"Archivo encontrado: {unidades_file}")
        with open(unidades_file, "r", encoding="utf-8") as f:
            count = 0
            for line in f:
                if "INSERT INTO" in line and "VALUES" in line:
                    vals = parse_sql_line(line)
                    if not vals or len(vals) < 4: continue
                    
                    try:
                        subcat_orig = int(vals[3])
                        subcat_new = None
                        if subcat_orig <= 4:
                            subcat_new = subcat_orig
                        elif subcat_orig == 6:
                            subcat_new = 5
                        
                        if subcat_new:
                            unidad = Unidad(
                                descripcion=vals[1],
                                descripcion_completa=vals[2],
                                subcategoria_codigo=subcat_new,
                                es_global=True
                            )
                            session.add(unidad)
                            count += 1
                    except Exception as e:
                        print(f"Error procesando línea: {line[:50]}... {e}")
            session.commit()
            print(f"✅ {count} unidades cargadas.")
    else:
        print(f"❌ Archivo NO encontrado: {unidades_file}")

    print("\n--- Cargando Catálogo CPC ---")
    cpc_file = os.path.join(project_root, "DBDump", "codcpc.sql")
    if os.path.exists(cpc_file):
        print(f"Archivo encontrado: {cpc_file}")
        with open(cpc_file, "r", encoding="utf-8") as f:
            count = 0
            batch = []
            for line in f:
                if "INSERT INTO" in line and "VALUES" in line:
                    vals = parse_sql_line(line)
                    if not vals or len(vals) < 5: continue
                    
                    try:
                        batch.append(CodCPC(
                            codCPC=vals[1],
                            descripcion=vals[2],
                            tipo=vals[3],
                            porcentaje=float(vals[4]) if (len(vals) > 4 and vals[4] and vals[4].lower() != 'null') else None
                        ))
                        count += 1
                        
                        if len(batch) >= 1000:
                            session.bulk_save_objects(batch)
                            session.commit()
                            batch = []
                            print(f"... {count} registros procesados")
                    except Exception as e:
                        print(f"Error procesando línea CPC: {line[:30]}... {e}")
            
            if batch:
                session.bulk_save_objects(batch)
                session.commit()
            print(f"✅ {count} registros CPC cargados.")
    else:
        print(f"❌ Archivo NO encontrado: {cpc_file}")

if __name__ == "__main__":
    seed_all()
