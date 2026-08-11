import os
import sys
from decimal import Decimal
from pprint import pprint

# Script diagnóstico manual que usa la base configurada; no pertenece a la
# suite aislada de pytest.
__test__ = False

# Añadir el raíz del backend al path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.apu import APU, APULinea
from app.models.recurso import Recurso
from app.models.empresa import Empresa
from app.services.apu import calculate_apu_price, update_apu_price_cascade, check_circular_reference
from app.api.endpoints.apus import create_apu, update_apu
from app.schemas.apu import APUCreate, APULineaCreate

def test_apu_logic():
    db = SessionLocal()
    try:
        print("====== Iniciando Pruebas de Lógica APU ======")
        
        # 1. Preparar datos
        # Obtener primera empresa
        empresa = db.query(Empresa).first()
        if not empresa:
            print("No hay empresas, abortando.")
            return

        # Limpiar datos previos de prueba
        db.query(APULinea).filter(APULinea.apu.has(APU.codigo.like("TEST_%"))).delete(synchronize_session=False)
        db.query(APU).filter(APU.codigo.like("TEST_%")).delete(synchronize_session=False)
        db.query(Recurso).filter(Recurso.codigo.like("TEST_%")).delete(synchronize_session=False)
        db.commit()

        # Crear Datos Necesarios
        from app.models.subcategoria_item import SubcategoriaItem
        subcat = db.query(SubcategoriaItem).first()
        if not subcat:
            subcat = SubcategoriaItem(id=1, codigo="0101", descripcion="Subcategoria Prueba")
            db.add(subcat)
            db.commit()
            db.refresh(subcat)

        # Crear Recursos de Prueba
        rec1 = Recurso(
            codigo="TEST_R1", descripcion="Recurso Prueba 1", descripcion_normalizada="recurso prueba 1", precio=10.0,
            unidad_id=1, subcategoria_item_id=subcat.id, base_trabajo_id=1, empresa_id=empresa.id
        )
        rec2 = Recurso(
            codigo="TEST_R2", descripcion="Recurso Prueba 2", descripcion_normalizada="recurso prueba 2", precio=20.0,
            unidad_id=1, subcategoria_item_id=subcat.id, base_trabajo_id=1, empresa_id=empresa.id
        )
        db.add(rec1)
        db.add(rec2)
        db.commit()
        db.refresh(rec1)
        db.refresh(rec2)

        print(f"✅ Recursos de prueba creados: {rec1.precio}, {rec2.precio}")

        # 2. Crear APU Base (Hijo)
        hijo_in = APUCreate(
            codigo="TEST_APU_HIJO",
            descripcion="APU Hijo de Prueba",
            unidad="m3",
            rendimiento_estandar=Decimal("1.0"),
            estado_revision="Aprobado",
            lineas=[
                APULineaCreate(recurso_id=rec1.id, cantidad=Decimal("2.0"), rendimiento=Decimal("1.0")),
                APULineaCreate(recurso_id=rec2.id, cantidad=Decimal("1.0"), rendimiento=Decimal("1.0"))
            ]
        )
        
        # Usamos un mock de current_user
        class MockUser:
            def __init__(self, emp_id):
                self.empresa_id = int(emp_id)
                self.rol = "Superadministrador"
                
        user = MockUser(empresa.id)
        
        apu_hijo = create_apu(db=db, current_user=user, apu_in=hijo_in, empresa_id=empresa.id)
        print(f"✅ APU Hijo creado: {apu_hijo.id} - Costo: {apu_hijo.precio_unitario_total} (Esperado: (2*10*1 * 1.0) + (1*20*1 * 1.0) = 40)")
        assert round(apu_hijo.precio_unitario_total, 2) == Decimal("40.00"), f"Error en costo directo: {apu_hijo.precio_unitario_total}"

        print("Añadiendo test de duplicados semánticos...")
        from fastapi import HTTPException
        hijo_clon = APUCreate(
            codigo="TEST_APU_CLON",
            descripcion="äpú hIjó  de :prüEba",
            unidad="m3", # Misma unidad
            estado_revision="Borrador"
        )
        try:
            create_apu(db=db, current_user=user, apu_in=hijo_clon, empresa_id=empresa.id)
            assert False, "Debería haber levantado una excepción por APU duplicado"
        except HTTPException as e:
            print(f"✅ Excepción de duplicado levantada con éxito: {e.detail}")

        # 3. Crear APU Padre que usa al APU Hijo con rendimiento global 2.0
        padre_in = APUCreate(
            codigo="TEST_APU_PADRE",
            descripcion="APU Padre de Prueba",
            unidad="m2",
            rendimiento_estandar=Decimal("2.0"),
            estado_revision="Por Validar",
            lineas=[
                APULineaCreate(apu_hijo_id=apu_hijo.id, cantidad=Decimal("3.0"), rendimiento=Decimal("1.0")),
            ]
        )
        apu_padre = create_apu(db=db, current_user=user, apu_in=padre_in, empresa_id=empresa.id)
        # Costo Padre = (Costo_Hijo * Cantidad * Rend_Global_Padre) => 40 * 3.0 * 2.0 = 240
        print(f"✅ APU Padre creado: {apu_padre.id} - Costo: {apu_padre.precio_unitario_total} (Esperado: 3*40*2 = 240.0)")
        assert round(apu_padre.precio_unitario_total, 2) == Decimal("240.00"), f"Error en cascada inicial: {apu_padre.precio_unitario_total}"

        # 4. Chequeo de Circularidad
        print("Buscando referencia circular (APU Hijo intentando usarse a sí mismo)...")
        circular = check_circular_reference(db, apu_hijo.id, apu_hijo.id)
        print(f"  -> Resultado (Mismo ID): {'Detectado' if circular else 'No Detectado'} (Esperado: Detectado)")
        assert circular == True
        
        print("Buscando referencia circular (APU Padre intentando usarse a sí mismo)...")
        circular2 = check_circular_reference(db, apu_padre.id, apu_padre.id)
        print(f"  -> Resultado (Mismo ID): {'Detectado' if circular2 else 'No Detectado'} (Esperado: Detectado)")
        assert circular2 == True

        print("Buscando referencia circular (APU Padre en APU Hijo - Loop Inverso)...")
        # El padre tiene ID apu_padre.id. Queremos meter al padre dentro del hijo. target_id = el hijo que vamos a actualizar. id_to_find = el padre que viene como línea
        circular3 = check_circular_reference(db, target_id=apu_padre.id, id_to_find=apu_hijo.id)
        # Wait, check_circular_reference traces down FROM target, to find id_to_find.
        # Si queremos meter a `padre` como linea de `hijo`: `target` sería `padre` (el nuevo hijo que estamos integrando) y `id_to_find` sería `hijo` (el actual apu).
        circular_adv = check_circular_reference(db, target_id=apu_padre.id, id_to_find=apu_hijo.id)
        print(f"  -> Resultado (Deep): {'Detectado' if circular_adv else 'No Detectado'} (Esperado: Detectado)")
        assert circular_adv == True

        # 5. Probar Actualización Múltiple en Cascada
        print("Actualizando precio del Recurso 1 (de 10 a 50)...")
        rec1.precio = 50.0
        db.commit()
        
        # Simulamos que un usuario edita el APU Hijo para reflejar cambios y dispara la cascada
        hijo_update = APUCreate(
            codigo="TEST_APU_HIJO",
            descripcion="APU Hijo Actualizado",
            unidad="m3",
            estado_revision="Aprobado",
            lineas=[
                APULineaCreate(recurso_id=rec1.id, cantidad=Decimal("2.0"), rendimiento=Decimal("1.0")),
                APULineaCreate(recurso_id=rec2.id, cantidad=Decimal("1.0"), rendimiento=Decimal("1.0"))
            ]
        )
        update_apu(id=apu_hijo.id, db=db, current_user=user, apu_in=hijo_update)
        
        db.refresh(apu_hijo)
        print(f"✅ APU Hijo post-update: {apu_hijo.precio_unitario_total} (Esperado: 2*50 + 1*20 = 120)")
        assert apu_hijo.precio_unitario_total == Decimal("120.0000")
        
        db.refresh(apu_padre)
        print(f"✅ APU Padre (Cascada Automática): {apu_padre.precio_unitario_total} (Esperado: 3*120*2 = 720.0)")
        assert round(apu_padre.precio_unitario_total, 2) == Decimal("720.00")

        print("====== PRUEBAS EXITOSAS ======")

    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
    finally:
        # Limpiar
        db.query(APULinea).filter(APULinea.apu.has(APU.codigo.like("TEST_%"))).delete(synchronize_session=False)
        db.query(APU).filter(APU.codigo.like("TEST_%")).delete(synchronize_session=False)
        db.query(Recurso).filter(Recurso.codigo.like("TEST_%")).delete(synchronize_session=False)
        db.commit()
        db.close()

if __name__ == "__main__":
    test_apu_logic()
