# Presupuesto - Reconfiguración de lanzadores de selección y tanteo

## Objetivo
Separar de forma explícita las dos intenciones operativas del árbol de presupuesto:
- `Selección múltiple`
- `Tanteo`

## Problema detectado
- pulsar una línea abría tanteo demasiado pronto
- `Shift` estaba compartido con selección por rango
- la intención de `seleccionar` y la intención de `tantear` no quedaban separadas

## Criterio de ajuste
- `Ctrl/Cmd` sobre una línea debe entrar en flujo de selección
- `Shift` sobre una línea debe abrir tanteo
- debe existir un botón superior específico para `Tanteo`
- el botón `Seleccionar` se mantiene
- ambos modos deben respetar el look & feel actual del presupuesto

## Alcance
- ajustar el comportamiento de click de filas en `LineasPresupuestoTab`
- añadir botón `Tanteo`
- hacer compatibles ambos modos sin ambigüedad operativa
- mantener navegación ya existente del tanteo

## Resultado
- click simple: selecciona foco de línea, sin abrir tanteo
- `Ctrl/Cmd + click`: activa o usa selección múltiple
- `Shift + click`: abre tanteo
- `Modo tanteo` activo: click simple sigue el flujo de tanteo actual
- `Modo selección` y `Modo tanteo` no compiten entre sí
