# ExecPlan: Reubicación de "Objeto del Contrato" a ancho completo

## Objetivo funcional

Hacer que `Datos del proyecto > Objeto del Contrato` ocupe el ancho total del formulario, repartido entre las dos columnas principales, en lugar de quedar restringido a la columna derecha bajo `Imagen Referencial`.

## Estado actual

- el layout divide el contenido en:
  - columna izquierda principal
  - columna derecha con mapa, imagen y objeto del contrato
- `Objeto del Contrato` está anidado dentro de la columna derecha
- resultado: el campo queda visualmente estrecho y desbalanceado respecto a su importancia funcional

## Diseño propuesto

Reestructuración mínima del grid:

- mantener la columna izquierda intacta
- mantener la columna derecha con `Geo-Referenciación` e `Imagen Referencial`
- mover `Objeto del Contrato` fuera de la columna derecha
- ubicarlo como una fila independiente con `col-span-12`

## Fases

### Fase 1. Discovery

- localizar el bloque del grid en `DatosProyecto`
- confirmar jerarquía actual de mapa, imagen y objeto

### Fase 2. Reparación de layout

- sacar `Objeto del Contrato` del contenedor derecho
- convertirlo en bloque a ancho completo

### Fase 3. Validación

- compilar frontend
- revisar que no se alteren mapa ni imagen

## Riesgos

- romper el cierre de columnas o el flujo visual del formulario

## Mitigación

- editar solo el tramo del grid afectado
- no tocar lógica ni bindings del campo

## Validaciones

- `Objeto del Contrato` ocupa el ancho completo
- `Geo-Referenciación` e `Imagen Referencial` permanecen en columna derecha
- `npm run build`
