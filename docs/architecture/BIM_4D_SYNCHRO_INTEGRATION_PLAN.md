# Plan de Paridad Funcional BIM 4D tipo SYNCHRO

Fecha: 2026-07-11

## Objetivo

Incorporar en GiProy BIM capacidades comparables a una plataforma profesional
de planificacion y control 4D, tomando SYNCHRO solo como benchmark funcional.
GiProy no se conecta a Bentley, no usa iTwin/iModel, no requiere licencias
externas y no almacena credenciales de terceros.

## Principios

- PostgreSQL es la persistencia operacional unica.
- Fragments/Three.js es el motor geometrico propio.
- Cronograma clasico conserva su fuente de verdad; BIM usa snapshots y
  resultados derivados sin escribir automaticamente modulos clasicos.
- Toda funcionalidad vive bajo flags/capacidades BIM y rollback limpio.
- La equivalencia es funcional, no copia de marca, UI ni formatos propietarios.

## Fases

1. **Gobierno y vinculos (`0091-0094`)**: snapshots, capacidades y links N:M.
2. **Simulacion (`0095-0097`)**: estados temporales y perfiles Fragments.
3. **Plan-real (`0098-0099`)**: baselines, dependencias y desviaciones.
4. **Frentes y escenarios (`0100-0102`)**: areas, componentes y what-if.
5. **4D/5D y campo (`0103-0105`)**: productividad, avance, evidencia y EVM.
6. **Playback profesional (`0106`)**: play/pause, velocidad, scrubber y foco.
7. **Recursos (`0107`)**: asignaciones, capacidad e histogramas 4D.
8. **Conflictos (`0108`)**: deteccion espacio-tiempo entre trabajos.
9. **Gantt BIM (`0109`)**: navegacion temporal sincronizada con el viewport.
10. **Informes (`0110`)**: reportes/exportacion 4D/5D reproducibles.
11. **Madurez (`0111`)**: datasets reales, rendimiento y UX de campo.
12. **Liberacion (`0112`)**: gate nativo, flags, rollback y cero criticos.

## Estado

- `0091-0105` cerradas localmente y certificadas sobre PostgreSQL.
- Cualquier conector Bentley creado por interpretacion previa fue retirado.
- `BIM-TASK-0091` a `BIM-TASK-0112` cerradas y validadas.
- Plan de paridad funcional BIM 4D nativa: `100%` del alcance definido.
- SYNCHRO permanece únicamente como benchmark; no existe conexión Bentley.
