# ExecPlan - Reparacion de acceso en modulos de presupuestos

## Objetivo funcional

Alinear todo el bloque de presupuestos para que `administrador` y `superadministrador` operen con la misma logica de permisos del proyecto, evitando diferencias entre lectura y escritura en presupuesto y cronogramas.

## Estado actual

- `DatosProyecto` ya fue reparado por normalizacion de rol.
- En presupuestos no aparecio el mismo bug de mayusculas/minusculas.
- Si aparecio una inconsistencia de autorizacion:
  - algunas rutas de `presupuestos` validan acceso al modulo y otras no
  - `cronogramas_trabajo` no valida acceso al modulo del proyecto
- Esto permite comportamientos distintos entre vistas y operaciones segun la ruta utilizada.

## Diseño propuesto

Aplicar una reparacion no invasiva en backend:

- centralizar verificacion de acceso por modulo usando helpers existentes
- validar acceso al modulo `presupuestos` para todo endpoint funcional del presupuesto
- validar acceso al modulo `cronogramas` en `cronogramas_trabajo`
- mantener intacta la logica actual de empresa, EDT y rol

## Fases de implementacion

1. Auditar endpoints de presupuesto y cronogramas relacionados.
2. Documentar hallazgos y tasks.
3. Endurecer `presupuestos.py` con control homogéneo de acceso por modulo.
4. Endurecer `cronogramas_trabajo.py` con el mismo criterio.
5. Validar compilacion backend.

## Riesgos y mitigacion

- Riesgo: bloquear rutas que hoy funcionaban por omision.
  - Mitigacion: reutilizar exactamente la misma resolucion de permisos ya usada en `read_presupuesto` y `cronogramas.py`.
- Riesgo: introducir regresiones por chequeos duplicados.
  - Mitigacion: encapsular helpers por presupuesto y por linea.

## Validaciones

- `py_compile` sobre endpoints modificados
- comprobacion de que lectura y escritura usan el mismo control de acceso
- revision puntual de rutas de notas, indirectos, tanteo y lineas
