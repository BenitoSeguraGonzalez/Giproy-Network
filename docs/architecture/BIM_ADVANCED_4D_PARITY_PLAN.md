# Plan de Paridad Avanzada del Nucleo BIM 4D

Fecha: 2026-07-12

## Alcance

Completar capacidades avanzadas del nucleo 4D tomando plataformas
profesionales solo como benchmark funcional. No incluye conectores Bentley,
SYNCHRO Perform, Control, Field ni IA externa.

## Puertas

1. `BIM-TASK-0113`: particiones constructivas no destructivas y preview real.
2. `BIM-TASK-0114`: materializacion geometrica y cantidades por particion.
3. `BIM-TASK-0115`: equipos, trayectorias y geometria temporal 4D.
4. `BIM-TASK-0116`: seguridad y riesgos vinculados al modelo/cronograma.
5. `BIM-TASK-0117`: escalabilidad, animaciones y gate avanzado.

## Reglas

- PostgreSQL es la unica persistencia operativa.
- La geometria fuente IFC/Fragments es inmutable.
- Toda particion es versionada, reversible y trazable al elemento/GlobalId.
- Un preview por clipping no se declara geometria materializada.
- GiProy Clasico no depende de este carril y BIM apagado no cambia.

## Finalizacion

`100%` de las cinco puertas avanzadas cerradas: `BIM-TASK-0113` a
`BIM-TASK-0117` validadas. El porcentaje pertenece exclusivamente al nucleo 4D
avanzado definido en este documento; no equivale a paridad completa con todo el
ecosistema Bentley SYNCHRO ni elimina los limites declarados en `0117`.
