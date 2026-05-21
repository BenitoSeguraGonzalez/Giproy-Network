import os
import sys

# Añadir el directorio raíz al path para importar app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.base_trabajo import BaseTrabajo
from app.models.proyecto import Proyecto
from app.models.apu import APU, APULinea
from app.models.recurso import Recurso
from app.models.subcategoria_item import SubcategoriaItem

def cleanup_orphaned_bases():
    db = SessionLocal()
    try:
        print("🔍 Buscando bases de proyecto huérfanas...")
        
        project_bases = db.query(BaseTrabajo).filter(BaseTrabajo.tipo == "Base de Proyecto").all()
        if not project_bases:
            print("✅ No se encontraron bases de tipo 'Base de Proyecto'.")
            return

        referenced_ids = [r[0] for r in db.query(Proyecto.base_trabajo_id).filter(Proyecto.base_trabajo_id.isnot(None)).distinct().all()]
        orphaned_ids = [b.id for b in project_bases if b.id not in referenced_ids]
        
        if not orphaned_ids:
            print(f"✅ Se analizaron {len(project_bases)} bases y ninguna es huérfana.")
            return

        print(f"⚠️ Bases huérfanas identificadas: {orphaned_ids}")

        # 1. Borrar APULineas
        apu_ids = [a.id for a in db.query(APU.id).filter(APU.base_trabajo_id.in_(orphaned_ids)).all()]
        if apu_ids:
            print(f"  - Borrando líneas de {len(apu_ids)} APUs...")
            db.query(APULinea).filter(APULinea.apu_id.in_(apu_ids)).delete(synchronize_session=False)
            db.query(APULinea).filter(APULinea.apu_hijo_id.in_(apu_ids)).delete(synchronize_session=False)
            db.flush()

        # 2. Borrar APUs
        if apu_ids:
            print(f"  - Borrando {len(apu_ids)} APUs...")
            db.query(APU).filter(APU.id.in_(apu_ids)).delete(synchronize_session=False)
            db.flush()

        # 3. Borrar Recursos
        recursos_ids = [r.id for r in db.query(Recurso.id).filter(Recurso.base_trabajo_id.in_(orphaned_ids)).all()]
        if recursos_ids:
            print(f"  - Borrando {len(recursos_ids)} recursos...")
            db.query(Recurso).filter(Recurso.id.in_(recursos_ids)).delete(synchronize_session=False)
            db.flush()

        # VERIFICACIÓN PRE-BORRADO DE SUBCATEGORIAS
        # ¿Hay algún Recurso o APU que todavía apunte a estas subcategorías?
        subcat_ids = [s.id for s in db.query(SubcategoriaItem.id).filter(SubcategoriaItem.base_trabajo_id.in_(orphaned_ids)).all()]
        
        if subcat_ids:
            check_apus = db.query(APU).filter(APU.subcategoria_item_id.in_(subcat_ids)).count()
            check_recursos = db.query(Recurso).filter(Recurso.subcategoria_item_id.in_(subcat_ids)).count()
            
            print(f"  - Verificación: {check_apus} APUs y {check_recursos} Recursos referencian estas subcats.")
            
            if check_apus > 0 or check_recursos > 0:
                print("  ❌ ERROR: Todavía hay referencias. Buscando IDs problemáticos...")
                # Esto no debería pasar si el borrado de arriba funcionó, a menos que haya APUs/Recursos en OTRAS bases apuntando aquí
                if check_apus > 0:
                    ext_apus = db.query(APU.id, APU.base_trabajo_id).filter(APU.subcategoria_item_id.in_(subcat_ids)).all()
                    print(f"    APUs problemáticos (id, base_id): {ext_apus}")
                if check_recursos > 0:
                    ext_recursos = db.query(Recurso.id, Recurso.base_trabajo_id).filter(Recurso.subcategoria_item_id.in_(subcat_ids)).all()
                    print(f"    Recursos problemáticos (id, base_id): {ext_recursos}")
                
                print("  💡 Intentando limpiar referencias externas (poniendo a NULL)...")
                db.query(APU).filter(APU.subcategoria_item_id.in_(subcat_ids)).update({APU.subcategoria_item_id: None}, synchronize_session=False)
                db.query(Recurso).filter(Recurso.subcategoria_item_id.in_(subcat_ids)).update({Recurso.subcategoria_item_id: None}, synchronize_session=False)
                db.flush()

            # 4. Borrar SubcategoriaItems
            print(f"  - Borrando {len(subcat_ids)} items de subcategoría...")
            db.query(SubcategoriaItem).filter(SubcategoriaItem.id.in_(subcat_ids)).delete(synchronize_session=False)
            db.flush()

        # 5. Borrar Bases
        print(f"  - Borrando {len(orphaned_ids)} bases de trabajo...")
        db.query(BaseTrabajo).filter(BaseTrabajo.id.in_(orphaned_ids)).delete(synchronize_session=False)
        
        db.commit()
        print(f"✨ Éxito: Se eliminaron {len(orphaned_ids)} bases huérfanas.")

    except Exception as e:
        db.rollback()
        print(f"❌ Error durante la limpieza: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    cleanup_orphaned_bases()
