
import os
import re
import unicodedata
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.models.subcategoria_item import SubcategoriaItem
from app.models.recurso import Recurso
from app.models.unidad import Unidad
from app.models.codcpc import CodCPC
from app.models.base_trabajo import BaseTrabajo

sql_file = r'e:\Repositorios\GiProy Network\DBDump\giproylocal_2.sql'
TARGET_BASE_ID = 1

def normalize_text(text_val):
    if not text_val: return ""
    text_val = str(text_val).strip()
    if len(text_val) > 1:
        text_val = text_val[0].upper() + text_val[1:]
    return text_val

def normalize_comp(text_val):
    if not text_val: return ""
    text_val = str(text_val).lower().strip()
    text_val = "".join(c for c in unicodedata.normalize('NFD', text_val)
                  if unicodedata.category(c) != 'Mn')
    return text_val

def parse_sql_values(line):
    start = line.find('(')
    end = line.rfind(')')
    if start == -1 or end == -1: return None
    content = line[start+1:end]
    vals = []
    current = []
    in_quotes = False
    i = 0
    while i < len(content):
        c = content[i]
        if c == "'":
            if i + 1 < len(content) and content[i+1] == "'":
                current.append("'")
                i += 1
            else:
                in_quotes = not in_quotes
        elif c == "," and not in_quotes:
            vals.append("".join(current).strip())
            current = []
        else:
            current.append(c)
        i += 1
    vals.append("".join(current).strip())
    processed = []
    for v in vals:
        if v.upper() == 'NULL': processed.append(None)
        elif v.startswith("'") and v.endswith("'"): processed.append(v[1:-1])
        else:
            try:
                if '.' in v: processed.append(float(v))
                else: processed.append(int(v))
            except: processed.append(v)
    return processed

def migrate():
    db = SessionLocal()
    try:
        base = db.get(BaseTrabajo, TARGET_BASE_ID)
        if not base:
            print(f"ERROR: Base {TARGET_BASE_ID} no existe.")
            return
        
        emp_id = base.empresa_id
        print(f"Migrando para Empresa: {emp_id}, Base: {TARGET_BASE_ID}")

        print("Limpiando datos previos...")
        db.execute(text(f"DELETE FROM recursos WHERE base_trabajo_id = {TARGET_BASE_ID}"))
        db.execute(text(f"DELETE FROM subcategorias_items WHERE base_trabajo_id = {TARGET_BASE_ID}"))
        db.commit()

        # 1. Subcategorías
        print("Cargando subcategorías...")
        subcat_map = {} # (orig_cat, orig_ciu) -> new_id
        description_to_id = {} # (new_cat, norm_desc) -> new_id

        with open(sql_file, 'r', encoding='latin-1') as f:
            for line in f:
                if "INSERT INTO `categoriaapus`" in line:
                    vals = parse_sql_values(line)
                    if not vals or len(vals) < 6: continue
                    orig_cat, orig_ciu, desc = vals[2], vals[3], vals[5]
                    
                    if orig_cat not in [1,2,3,4,5,6]: continue
                    new_cat = orig_cat if orig_cat <= 4 else 5
                    
                    norm_desc = normalize_comp(desc)
                    
                    # SI YA EXISTE UNA SUBCATEGORIA CON ESE NOMBRE EN ESA CATEGORIA, LA REUTILIZAMOS
                    if (new_cat, norm_desc) in description_to_id:
                        subcat_map[(orig_cat, orig_ciu)] = description_to_id[(new_cat, norm_desc)]
                        continue
                        
                    code = f"{new_cat}-{str(orig_ciu).zfill(3)}"
                    subcat = SubcategoriaItem(
                        codigo=code,
                        descripcion=normalize_text(desc),
                        subcategoria_codigo=new_cat,
                        base_trabajo_id=TARGET_BASE_ID,
                        empresa_id=emp_id,
                        revisado=True
                    )
                    db.add(subcat)
                    db.flush()
                    
                    subcat_map[(orig_cat, orig_ciu)] = subcat.id
                    description_to_id[(new_cat, norm_desc)] = subcat.id
                    
        print(f"Mapeo de subcategorías completado. Subcategorías únicas creadas: {len(description_to_id)}")

        # 2. Caché de unidades y CPC
        units_by_cat = {(u.subcategoria_codigo, normalize_comp(u.descripcion)): u.id for u in db.query(Unidad).all()}
        units_global = {normalize_comp(u.descripcion): u.id for u in db.query(Unidad).all()}
        cpc_cache = {str(c.codCPC): c.id for c in db.query(CodCPC).all()}

        # 3. Recursos
        print("Cargando recursos...")
        try:
            db.execute(text("ALTER TABLE recursos DROP CONSTRAINT uq_recurso_codigo"))
            db.commit()
        except: pass

        recs_count = 0
        existing_recs = set()

        with open(sql_file, 'r', encoding='latin-1') as f:
            for line in f:
                if "INSERT INTO `recursos`" in line:
                    vals = parse_sql_values(line)
                    if not vals or len(vals) < 19: continue
                    cat_id, subcat_ciu, desc, u_name, price, cpc_code, specs = vals[5], vals[6], vals[7], vals[8], vals[9], vals[15], vals[18]
                    
                    norm_recurso_desc = normalize_comp(desc)
                    # El usuario pide no duplicados globales. Si ya existe, lo saltamos.
                    if norm_recurso_desc in existing_recs: continue

                    sc_id = subcat_map.get((cat_id, subcat_ciu))
                    if not sc_id:
                        # Si no hay subcategoría mapeada, es un recurso huérfano en el dump original o filtrado por categoría
                        continue
                    
                    ncat = cat_id if cat_id <= 4 else 5
                    u_id = units_by_cat.get((ncat, normalize_comp(u_name))) or units_global.get(normalize_comp(u_name))
                    if not u_id:
                        fb = db.query(Unidad).filter(Unidad.subcategoria_codigo == ncat).first()
                        u_id = fb.id if fb else None
                    
                    recurso = Recurso(
                        descripcion=normalize_text(desc),
                        descripcion_normalizada=norm_recurso_desc,
                        precio=float(price or 0.0),
                        unidad_id=u_id,
                        cod_cpc_id=cpc_cache.get(str(cpc_code)),
                        especificaciones=str(specs)[:500] if specs else None,
                        subcategoria_item_id=sc_id,
                        base_trabajo_id=TARGET_BASE_ID,
                        empresa_id=emp_id,
                        revisado=True,
                        codigo=f"TEMP-{recs_count}"
                    )
                    db.add(recurso)
                    existing_recs.add(norm_recurso_desc)
                    recs_count += 1
                    if recs_count % 100 == 0:
                        db.flush()
        
        db.commit()
        print(f"Migración: {recs_count} recursos únicos transferidos.")

        # 4. Re-numerar y Re-activar
        from app.repositories.recurso import RecursoRepository
        repo = RecursoRepository(db)
        print("Renumerando códigos...")
        subcat_ids = [s.id for s in db.query(SubcategoriaItem).filter(SubcategoriaItem.base_trabajo_id == TARGET_BASE_ID).all()]
        for sid in subcat_ids:
            repo._renumber_items(sid)
        db.commit()

        try:
            db.execute(text("ALTER TABLE recursos ADD CONSTRAINT uq_recurso_codigo UNIQUE (codigo, base_trabajo_id)"))
            db.commit()
        except: pass
        print("--- PROCESO FINALIZADO CON ÉXITO ---")
        
    except Exception as e:
        db.rollback()
        print(f"ERROR: {str(e)}")
        import traceback; traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
