# ExecPlan: Responsables Embebidos En Grafo EDO/EDT

## Objetivo funcional
Replantear la representacion grafica de `EDO` y `EDT` para que los responsables o participantes no aparezcan como nodos hijos independientes, sino integrados dentro del nodo estructural principal, manteniendo sus acciones operativas y la navegacion del grafo.

## Estado actual
- `EDO` y `EDT` renderizan el arbol completo, incluyendo responsables como nodos hijos.
- La lectura del grafo se hace mas larga y vertical de lo necesario.
- La relacion responsable-hito o participante-cuenta se percibe como jerarquia estructural, cuando realmente es una asociacion operativa del nodo.
- Los filtros `Todos / Hitos-Cuentas / Responsables` trabajan sobre tipos de nodo, no sobre una proyeccion visual mas limpia.

## Diseno propuesto
- Mantener el arbol fuente sin cambios.
- Crear una proyeccion grafica derivada:
  - `EDO`: solo nodos `HITO`.
  - `EDT`: solo nodos `CUENTA_PAQUETE`.
- Los responsables se embeben en cada nodo estructural como lista compacta interna.
- Cada responsable embebido podra abrir sus propias acciones al pulsarlo.
- La barra superior seguira siendo de navegacion y vista; las acciones operativas seguiran contextuales.

## Reglas de visualizacion
- `Todos`: muestra nodos estructurales completos con responsables embebidos.
- `Hitos` o `Cuentas`: muestra solo el contenido estructural, sin responsables embebidos.
- `Responsables`: muestra solo los nodos estructurales que tienen responsables, priorizando visualmente el bloque embebido.
- El nombre del responsable tendra peso tipografico principal.
- El rol o actividad tendra tipografia secundaria, ligera y de menor tamano.

## Fases de implementacion
1. Crear proyeccion estructural del grafo.
2. Redisenar tarjeta grafica para bloque interno de responsables.
3. Conectar acciones propias del responsable embebido.
4. Adaptar filtros `Todos / Hitos-Cuentas / Responsables`.
5. Adaptar busqueda y minimapa a la nueva proyeccion.
6. Validar seleccion, centrado, drag/drop y build.

## Riesgos y mitigacion
- Riesgo: romper drag/drop al quitar nodos secundarios del render.
  Mitigacion: mantener drag/drop solo para nodos estructurales y no tocar el arbol fuente.
- Riesgo: perder acciones de responsables en grafico.
  Mitigacion: usar seleccion embebida con menu contextual propio.
- Riesgo: desalinear `EDO` y `EDT`.
  Mitigacion: resolverlo en `HierarchyGraphView` con reglas por `moduleType`.

## Validaciones
- En `Todos` se ve la tarjeta completa con responsables embebidos.
- En `Hitos` o `Cuentas` desaparece el bloque de responsables.
- En `Responsables` solo quedan nodos estructurales con responsables visibles.
- Pulsar un responsable embebido abre sus opciones.
- El minimapa y la busqueda encuentran hitos/cuentas y responsables.
- `npm run build` debe pasar.
