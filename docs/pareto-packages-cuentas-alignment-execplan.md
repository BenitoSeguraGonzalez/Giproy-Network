# Pareto Packages-Cuentas Alignment Execplan

## Objetivo
Corregir el modal de `Pareto` para que:

- `Paquetes` analice solo partidas/APUs del presupuesto.
- `Cuentas` analice solo capítulos/EDT agregados.
- la tabla central gane legibilidad real en la columna `Descripción`.
- la semántica del modal quede alineada con el lenguaje operativo del producto.

## Alcance
- Backend `Presupuesto`: separar universo de análisis `global` hacia solo filas con `apu_id`.
- Frontend `ParetoModal`: renombrar labels y textos de apoyo.
- Frontend `ParetoModal`: redistribuir columnas de la tabla central para hacer reconocible la descripción.
- Documentación y trazabilidad del slice.

## Decisiones
- Se conserva el parámetro técnico `view=global` por compatibilidad de API, pero en UI pasa a llamarse `Paquetes`.
- `Capítulos` se renombra visualmente a `Cuentas`.
- El detalle lateral y el copy del modal deben hablar de `partidas` o `cuentas` según el modo activo.
- No se aumenta el tamaño general del modal.

## Validación
- `Paquetes` no debe mostrar filas estructurales/capítulos.
- `Cuentas` debe mantener el comportamiento actual por capítulos.
- La columna `Descripción` debe mostrar suficiente texto para reconocer la partida sin depender del panel derecho.
