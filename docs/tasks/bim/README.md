# Gobierno TASK BIM

Este directorio es la estructura operativa independiente para el carril
`GIPROY BIM`.

## Regla principal

- Las nuevas sesiones BIM deben documentarse aqui, no en la secuencia clasica
  `docs/tasks/TASK-####.md`.
- Las TASK clasicas historicas `TASK-0545` a `TASK-0559` quedan como evidencia
  legacy de planificacion inicial, pero no deben reutilizarse ni renumerarse
  para cerrar trabajo BIM nuevo.
- Si una implementacion BIM requiere tocar GiProy Clasico, debe abrirse una
  TASK de integracion controlada separada y enlazarse desde la TASK BIM.

## Indice operativo

- `BIM_TASK_INDEX.md`: mapa oficial del programa BIM paralelo.
- `BIM-TASK-0000.md`: TASK madre del programa BIM.
- `BIM-TASK-0001.md` a `BIM-TASK-0014.md`: slices estructurales iniciales.
- `BIM-TASK-0015.md`: saneamiento documental del estado real BIM ya presente
  en codigo.
- `BIM-TASK-0016.md`: migracion Alembic del dominio BIM principal.
- `BIM-TASK-0017.md`: gobierno runtime de esquema BIM y tests focales.
- `BIM-TASK-0018.md`: contratos API BIM bajo flags y tenant.
- `BIM-TASK-0019.md`: importacion JSON BIM y workspace activo.
- `BIM-TASK-0020.md`: links BIM latentes con EDT.
- `BIM-TASK-0021.md`: links BIM latentes con APUs y Presupuesto.
- `BIM-TASK-0022.md`: smoke frontend BIM positivo aislado.
- `BIM-TASK-0023.md`: smoke visual DOM del viewer BIM aislado.
- `BIM-TASK-0024.md`: validacion controlada de migracion Alembic BIM.
- `BIM-TASK-0025.md`: importacion JSON batch transaccional.
- `BIM-TASK-0026.md`: guarda UX de validacion previa a importacion BIM.
- `BIM-TASK-0027.md`: permisos de duplicacion de vistas BIM compartidas.
- `BIM-TASK-0028.md`: guarda backend de validacion previa a importacion BIM.
- `BIM-TASK-0029.md`: cobertura de workspace context BIM por usuario.
- `BIM-TASK-0030.md`: restriccion de scopes publicos en vistas BIM.
- `BIM-TASK-0031.md`: registro de manifiesto IFC BIM versionado.
- `BIM-TASK-0032.md`: cliente frontend BIM para manifiesto IFC.
- `BIM-TASK-0033.md`: bloqueo de etiquetas IFC duplicadas.
- `BIM-TASK-0034.md`: bloqueo de etiquetas JSON BIM duplicadas.
- `BIM-TASK-0035.md`: IFC/3D como fundamento de cierre BIM.
- `BIM-TASK-0036.md`: parsing IFC semantico inicial local.
- `BIM-TASK-0037.md`: storage local IFC controlado.
- `BIM-TASK-0038.md`: parsing IFC profundo inicial.
- `BIM-TASK-0039.md`: artefacto optimizado para viewer BIM.
- `BIM-TASK-0040.md`: consumo de artefacto viewer en harness 3D.
- `BIM-TASK-0041.md`: smoke local de fragments binarios.
- `BIM-TASK-0042.md`: carga de fragments con FragmentsModels en harness.

## Estado real vigente

Desde 2026-07-01 el carril BIM debe asumirse como incubacion funcional parcial,
no como ejecucion no iniciada. La fotografia oficial esta en
`docs/architecture/BIM_CODE_STATE.md`.

## Politica de cierre

Ninguna TASK BIM puede cerrarse si:

- rompe GiProy Clasico con BIM apagado;
- expone UX BIM sin feature flag o allowlist;
- crea dependencia prematura desde modulos clasicos hacia BIM;
- omite rollback;
- no actualiza `docs/architecture/BIM_INDEX.md` cuando agrega artefactos BIM.
