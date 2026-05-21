# Presupuesto Clipboard Quantity Paste ExecPlan

## Objetivo
Añadir una acción operativa en `Proyecto > Presupuesto` para reemplazar cantidades desde el portapapeles, manteniendo el look & feel y la seguridad del flujo actual.

## Alcance
- nueva acción en la barra lateral izquierda del presupuesto
- lectura de cantidades desde texto plano o pegado de Excel
- aplicación secuencial desde la línea seleccionada inclusive
- confirmación obligatoria antes de recalcular

## Reglas
- debe existir una línea de presupuesto seleccionada
- el portapapeles debe contener únicamente valores numéricos válidos
- si hay más cantidades que líneas visibles desde la selección, los valores extra no se aplican
- la acción recalcula el presupuesto al finalizar
- la confirmación debe usar los modales compartidos de la aplicación

## Resultado esperado
- menor fricción para pegar mediciones o cantidades externas
- continuidad visual con las herramientas actuales del presupuesto
- validación clara antes de tocar el presupuesto
