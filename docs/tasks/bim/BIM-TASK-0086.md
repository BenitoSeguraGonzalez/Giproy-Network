# BIM-TASK-0086 - Navegacion bidireccional controlada

Estado: Cerrada localmente mediante TASK-2022/2023/2024/2025

## Resultado del analisis

- El dominio BIM ya conserva links latentes, GUID, version y viewpoints.
- Activar navegacion visible de ida/vuelta exige modificar Proyectos, EDT, APUs
  o Presupuesto clasico y abrir una TASK clasica de integracion por modulo.
- La restriccion vigente prohibe tocar GiProy Clasico, por lo que no se monta
  una navegacion falsa ni se declara Gate D cerrado.

## Autorizacion y primer slice

El 2026-07-13 se autoriza expresamente iniciar Gate D y E de forma conservadora.
`TASK-2022` habilita una unica puerta en Proyectos mediante los feature flags y
allowlists BIM existentes, con lazy mount y retorno a EDT, Presupuesto o APU.

## Cierre Gate D local

- La puerta Proyectos <-> BIM pasa build, smokes flag off/on y baseline.
- EDT recibe y enfoca el nodo exacto mediante su contrato existente.
- Presupuesto recibe y enfoca la línea exacta mediante su contrato existente.
- APUs abre el `apu_id` y retorna al proyecto/BIM con protección de cambios.
- GiProy Clasico conserva secciones, rutas y comportamiento con BIM apagado.

## Rollback

Retirar el wiring controlado documentado en `TASK-2022`; backend, datos BIM y
modulos clasicos permanecen intactos.

Avance Gate D local: 100%. La validación temporal con usuarios pertenece al
piloto Gate E y no reabre este gate técnico.
