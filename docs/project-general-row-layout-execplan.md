# Project General Row Layout - ExecPlan

## Objetivo
Reordenar la fila de `Vista General` en `Proyectos` para que toda la información crítica del proyecto viva en una sola línea horizontal, sin badges secundarios, sin color verde y sin solapamientos visuales.

## Diagnóstico
- La fila del proyecto mezclaba una jerarquía de tabla con una segunda línea de badges bajo `Proyecto`.
- Los chips verdes de presupuesto e indirectos competían con la lectura principal y rompían la comparación entre proyectos.
- `Presupuesto referencial` no reflejaba ya el contrato funcional deseado.
- Faltaban dos datos operativos en cabecera de fila:
  - `Presupuesto calculado`
  - `Tiempo estimado`

## Enfoque
1. Eliminar la segunda línea de chips bajo el nombre del proyecto.
2. Mantener toda la información en una sola línea real mediante tabla fija con anchos explícitos.
3. Introducir las nuevas columnas:
   - `Presupuesto calculado`
   - `Presupuesto entidad`
   - `Tiempo estimado`
4. Tomar como fuente económica el subtotal sin IVA:
   - `subtotal + indirectos_total`
5. Tomar `Tiempo estimado` desde `ProyectoDetalle.plazo_ejecucion`.
6. Mantener `Fecha de presentación` editable sin romper la nueva horizontalidad.

## Resultado esperado
- La fila del proyecto se lee completamente en una sola línea.
- El nombre del proyecto deja de tener elementos secundarios debajo.
- La información económica se integra como columnas comparables.
- Desaparece el lenguaje visual verde de ese bloque.
