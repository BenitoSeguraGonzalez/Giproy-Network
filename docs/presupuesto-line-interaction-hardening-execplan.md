# Presupuesto Line Interaction Hardening ExecPlan

## Objetivo
Mejorar la operativa de `Proyecto > Presupuesto` sin romper el workbench visual existente.

## Ajustes
- alta de APU por `click simple`
- selección múltiple de líneas con `Ctrl/Cmd`
- selección por rango con `Shift`
- movimiento grupal entre nodos EDT con confirmación modal
- pegado masivo de cantidades desde portapapeles con confirmación

## Reglas
- si se mueve una sola línea, no se pide confirmación
- si se mueven varias líneas, se pide confirmación con `appConfirm`
- las reglas actuales de fusión siguen aplicándose por línea
- el pegado de cantidades exige una lista numérica válida
- el pegado se aplica desde la línea seleccionada inclusive y respeta el orden visible
- el look & feel del presupuesto no se rediseña

## Resultado esperado
- menor fricción al presupuestar
- movimiento operativo en bloque
- continuidad al pegar mediciones desde Excel o texto plano
- continuidad visual con el resto del módulo
