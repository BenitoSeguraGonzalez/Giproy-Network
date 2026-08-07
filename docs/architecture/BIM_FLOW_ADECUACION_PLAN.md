# Plan de adecuación BIM: flujo operativo nuevo

## Decisión de arquitectura

La superficie BIM existente queda congelada y no se elimina ni se usa como base visual de esta adecuación. Se incorpora una sección nueva, aislada en `BimFlowWorkspace`, para validar el flujo de negocio antes de retirar la implementación anterior.

## Resultado que debe producir la nueva sección

El usuario debe poder entender en menos de un minuto qué estado tiene el proyecto, cuál es la siguiente acción y qué resultado alimentará la etapa posterior. BIM es opcional: un proyecto sin BIM puede continuar con presupuesto y Gantt, pero la sección debe informar qué relaciones no pueden completarse.

## Flujo coordinado

La entrada es un centro de trabajo. Desde ahí se pasa por Modelo, Presupuesto 5D, Planificación 4D, Coordinación, Seguimiento y Entrega. El orden recomendado es validar el modelo, construir vínculos 5D/4D, resolver la coordinación y cerrar la entrega. El visor 3D queda limitado a la etapa de modelo y a contextos explícitos de selección; no es el fallback universal.

## Contrato de estados

Cada etapa debe exponer `pendiente`, `en revisión`, `bloqueada`, `lista` o `cerrada`, además de su siguiente acción. La oficialización de una relación requiere trazabilidad de origen, clasificación OmniClass compatible y cobertura comprobable entre presupuesto, Gantt y BIM.

## Tri-sincronización

Una partida puede navegar hacia sus actividades y elementos; una actividad hacia sus partidas y elementos; y un elemento hacia su partida y actividad. Las relaciones deben distinguir borrador, propuesta, validada, oficial, rechazada y reconciliación pendiente.

## Criterios de aceptación

- La primera pantalla no es un visor 3D.
- Cada etapa tiene una superficie y una acción diferenciadas.
- No se puede interpretar una pantalla vacía como una funcionalidad disponible.
- El estado OmniClass y la cobertura de vínculos son visibles.
- La superficie antigua permanece intacta durante la validación.
- Solo tras validar recorridos reales, permisos, errores y resolución 1920×1080 se planificará la retirada de la implementación anterior.

## Fases

1. Centro de trabajo y estados de entrada.
2. Modelo y validación de versiones.
3. Presupuesto 5D y propuestas de cantidades.
4. Planificación 4D y baselines.
5. Bandeja de coordinación y reconciliación.
6. Seguimiento y entrega.
7. Migración de accesos y retirada controlada de la sección antigua.

## Estado de implementación

La primera entrega de la sección nueva ya está activa en la pestaña BIM. Incluye el centro de trabajo, el estado de entrada y superficies propias para presupuesto 5D, planificación 4D, coordinación, seguimiento y entrega. La superficie anterior permanece intacta. La siguiente iteración debe completar la selección BIM contextual y la navegación bidireccional entre partida, actividad y elemento antes de considerar válida la sustitución.
