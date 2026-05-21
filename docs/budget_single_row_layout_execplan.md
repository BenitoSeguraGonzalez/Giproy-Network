# ExecPlan: Presupuesto en Fila Única

## Objetivo

Mantener siempre las líneas del presupuesto en una sola fila visual, priorizando el ancho de la columna de descripción y compactando primero las columnas secundarias.

## Estado actual

- `LineasPresupuestoTab` activa un modo compacto por viewport.
- Ese modo convierte capítulos y líneas en bloques apilados.
- Con escalado alto del sistema operativo, el ancho efectivo entra prematuramente en ese modo.

## Diseño propuesto

- Eliminar el modo multilinea para las líneas del presupuesto.
- Mantener una única cabecera y una única estructura horizontal de fila.
- Priorizar `Descripción`.
- Compactar `Unidad`, `Cantidad`, `P. Unit.`, `Subtotal` y `Acciones`.
- Añadir scroll horizontal controlado al lienzo del editor si el ancho no alcanza.

## Fases

1. Desacoplar compactación general del viewport del layout de filas.
2. Normalizar cabecera y filas a un esquema horizontal único.
3. Reducir anchuras de columnas secundarias.
4. Añadir `min-width` del editor y `overflow-x-auto`.
5. Validar con sidebar del proyecto y catálogo del presupuesto.

## Validación

- Ninguna línea operativa se parte en varias filas.
- La descripción conserva el mayor espacio disponible.
- En anchos reducidos aparece scroll horizontal del editor.
- Build frontend correcta.
