# TASK - Reparacion de acceso en modulos de presupuestos

## Estado

- **Estado:** `CERRADO`
- **Modo:** `GIPROY CLASICO`
- **Cerrada:** 2026-04-28
- **Porcentaje TASK:** 100%
- **Porcentaje Frente Permisos/Licencias Backend:** 100%
- **Porcentaje Global Proyecto:** ~99%

## Resultado

La auditoria del snapshot real confirma que el backend ya aplica helpers comunes de acceso por modulo en `presupuestos.py` para lectura/escritura de indirectos, notas, tanteo y lineas, y que `cronogramas_trabajo.py` exige acceso al modulo `cronogramas` en lectura, edicion, calendario laboral, Pareto e import/export MS Project.

## Validacion ejecutada

- `python -m py_compile backend/app/api/endpoints/presupuestos.py backend/app/api/endpoints/cronogramas_trabajo.py` -> OK

## Impacto

- **Licencias/permisos:** validaciones backend centralizadas confirmadas; no se habilita bypass.
- **UI:** sin cambios visuales.
- **BIM:** sin UX BIM, sin dependencias BIM y sin acoplamientos nuevos.

## TASK-01 Audit de endpoints de presupuesto

- Objetivo: localizar diferencias entre lectura y escritura en validacion de permisos.
- Archivos afectados: `backend/app/api/endpoints/presupuestos.py`
- Dependencias: ninguna
- Validacion: matriz de rutas revisada y documentada
- Estado: completada en snapshot real.

## TASK-02 Homogeneizar acceso por modulo en presupuesto

- Objetivo: exigir acceso al modulo `presupuestos` en indirectos, notas, tanteo y lineas.
- Archivos afectados: `backend/app/api/endpoints/presupuestos.py`
- Dependencias: TASK-01
- Validacion: helpers comunes aplicados a lectura y escritura
- Estado: completada en snapshot real.

## TASK-03 Endurecer cronograma de trabajo

- Objetivo: exigir acceso al modulo `cronogramas` para lectura y edicion del cronograma de trabajo.
- Archivos afectados: `backend/app/api/endpoints/cronogramas_trabajo.py`
- Dependencias: TASK-01
- Validacion: lectura y actualizacion protegidas por permiso de modulo
- Estado: completada en snapshot real.

## TASK-04 Validacion tecnica

- Objetivo: comprobar que los cambios compilan y no rompen el backend.
- Archivos afectados: sin cambios funcionales
- Dependencias: TASK-02, TASK-03
- Validacion: `py_compile` exitoso
- Estado: completada el 2026-04-28.
