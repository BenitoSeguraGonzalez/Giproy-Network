from decimal import Decimal
import sys
import os

# Añadir el path del backend para importar el core
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.core.rounding import redondeo_cascada

def test_rounding():
    # Caso Testigo 1
    val1 = 1.23456
    rounded1 = redondeo_cascada(val1, 2)
    print(f"Test 1: {val1} -> {rounded1} (Esperado: 1.24)")
    
    # Caso Discrepancia Subtotal (0.17 + 0.10 + 0.03 = 0.30)
    # Supongamos que los parciales raw eran algo que redondeaba a 0.17, 0.10, 0.03
    # Ejemplo: 0.165, 0.095, 0.025
    p1_raw = 0.165
    p2_raw = 0.095
    p3_raw = 0.025
    
    # Redondeo en cada paso (como se hace ahora)
    p1 = redondeo_cascada(p1_raw, 2)
    p2 = redondeo_cascada(p2_raw, 2)
    p3 = redondeo_cascada(p3_raw, 2)
    
    total = p1 + p2 + p3
    print(f"Test 2: Parciales redondeados {p1} + {p2} + {p3} = {total} (Esperado: 0.30)")

    # Caso en el que sumando RAW y redondeando al final daba 0.29
    # 0.165 + 0.095 + 0.025 = 0.285. RedondeoCascada(0.285, 2) = 0.29
    raw_sum = p1_raw + p2_raw + p3_raw
    final_rounded = redondeo_cascada(raw_sum, 2)
    print(f"Test 3: Suma RAW ({raw_sum}) redondeada al final = {final_rounded} (Esto era lo que daba 0.29)")

if __name__ == "__main__":
    test_rounding()
