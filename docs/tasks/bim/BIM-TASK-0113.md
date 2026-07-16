# BIM-TASK-0113 - Particiones constructivas y preview

Estado: Cerrada y validada

## Objetivo

Persistir especificaciones de particion no destructivas por elemento BIM y
previsualizarlas con planos de corte reales, manteniendo GlobalId, tenant,
version, rollback y geometria fuente intacta.

## Gate

- Migracion PostgreSQL aditiva y reversible.
- Contratos tenant/proyecto/version/elemento probados.
- Preview WebGL no vacio y claramente marcado como no materializado.

## Resultado

- Especificaciones de particion persistidas en PostgreSQL por tenant, proyecto,
  version y elemento mediante la migracion aditiva `de2018a1b2c3`.
- Alta, consulta y eliminacion protegidas, con fuente IFC y GlobalId intactos.
- Preview WebGL real por eje y segmentos, validado en desktop y mobile.
- La geometria sigue explicitamente no materializada; ese alcance corresponde a
  `BIM-TASK-0114`.

## Validacion

- `111 passed` en la suite BIM.
- `npm run build` y smokes BIM/anti-BIM en verde.
- Harness WebGL de particiones no vacio, sin overflow ni errores de pagina.
- Baseline enterprise con frontend en verde.
- PostgreSQL operacional y reversible en `de2018a1b2c3`.
