# BIM-TASK-0128 - Evidencia y validador de paridad SYNCHRO

Estado: Cerrada localmente

## Objetivo

Convertir la matriz de paridad en un contrato machine-readable que impida
subir porcentajes sin consistencia entre estados, evidencia y requisitos de
liberacion.

## Criterios verificables

- JSON valido con 60 IDs ordenados y estados ponderados.
- Markdown y JSON deben expresar los mismos estados.
- Toda capacidad debe incluir evidencia o brecha no vacia.
- El modo `--require-complete` debe fallar hasta alcanzar 100%.
- Gate E, Gate K, anti-BIM y rollback son requisitos obligatorios de release.

## Cambios

- `bim_synchro_parity_matrix.json`: contrato machine-readable.
- `validate_bim_synchro_parity.py`: validacion de IDs, grupos, evidencia,
  estados, score y requisitos de liberacion.
- `test_validate_bim_synchro_parity.py`: cobertura positiva y negativa.

## Validacion

- `python -m unittest tools.ai_tools.test_validate_bim_synchro_parity`
- `python tools/ai_tools/validate_bim_synchro_parity.py`
- `python tools/ai_tools/validate_bim_synchro_parity.py --require-complete`
  debe fallar con score 45,83% mientras el programa este incompleto.

## No impacto clasico

No cambia codigo productivo, DB, API, frontend, auth, tenant ni despliegue.

## Rollback

Eliminar JSON, validador, test y referencias documentales.
