# Plan de ajuste - Precio vivo de APUs en presupuesto

## Contexto
Las líneas de presupuesto almacenan datos propios (`descripcion`, `unidad`, `precio_unitario`, `precio_total`) para mantener integridad operativa.  
Sin embargo, el usuario necesita que el precio mostrado no se comporte como snapshot, sino como lectura viva del APU actual.

## Objetivo
Hacer que el precio del presupuesto se recalcule siempre contra el APU vigente al abrir o consultar el presupuesto y al generar reportes.

## Alcance
- Recalcular precios de presupuesto al leer un presupuesto individual.
- Recalcular precios al obtener el presupuesto operativo de un proyecto.
- Recalcular precios antes de construir reportes de presupuesto.
- Mantener intacto el contrato actual de cantidades, códigos y descripción salvo precio/subtotal.

## Criterios de cierre
- Una modificación de costo directo en el APU se refleja al volver a abrir el presupuesto.
- El preview y la exportación de reportes usan el mismo precio vivo.
- No se rompe el flujo actual de indirectos funcionales del presupuesto.
