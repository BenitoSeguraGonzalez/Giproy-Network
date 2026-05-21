# Plan Integral - Control Gantt Compatible Con MS Project

## Modo
GIPROY CLASICO

## Objetivo
Convertir el Gantt oficial de `Proyecto > Cronogramas` en un control de planificación compatible conceptualmente con Microsoft Project, manteniendo backend común, capa clásica estable y BIM sin interferencia.

## Estado Actual
- `Cronograma de Trabajo` ya calcula duración desde presupuesto/APU vivo.
- `Gantt` ya es vista oficial clásica sobre el mismo contrato `cronogramas-trabajo`.
- Existe exportación MS Project XML y carril `.mpp` condicionado por Microsoft Project/COM o Project Bridge.
- Las predecesoras persisten hoy como lista simple de IDs en `CronogramaTrabajoLinea.predecessors`.
- Las sucesoras se derivan en frontend desde las predecesoras.
- Todavía no existe entidad rica de dependencia con tipo, lag, calendario, baseline o ruta crítica.

## Principios De Diseño
- Backend único y común.
- Sin dependencia BIM ni UX BIM.
- Evolución incremental y reversible.
- Mantener compatibilidad con cronogramas existentes.
- No sustituir el cálculo actual hasta que el nuevo motor pueda convivir y validarse.
- Exportación/importación MS Project basada primero en XML interoperable; `.mpp` queda como integración asistida por entorno Windows compatible.
- Fuente temporal principal: el `Gantt` manda fechas, dependencias, calendarios, hitos y recursos/asignaciones.
- Temporalidad expandida a fecha-hora: la jornada debe anclarse en `hora_inicio_jornada` y todos los cálculos deben respetar horas efectivas, no solo fechas civiles.
- Valorización derivada: `Cronograma Valorado` interpreta el `Gantt` por periodos, cantidades y costos.
- Caja derivada: `Flujo de Caja` interpreta el valorado periodizado como costos por periodo y acumulados.
- Bidireccionalidad controlada: `Gantt <-> Valorado <-> Caja` existe como ajuste explícito y trazable; los cambios inversos no deben pisar automáticamente la programación.
- La relación `duración <-> cuadrilla <-> rendimiento` deja de ser motor dominante del cronograma y queda como cálculo auxiliar de recursos/APU cuando aplique.
- Cambio de fecha/momento = solo programación.
- Cambio de duración = solo mediante editor de recursos/rendimientos del APU operativo de la línea.
- Persistencia de cronogramas y reconciliación con presupuesto sujetas a aprobación explícita del usuario.
- Debe existir `undo` para volver al último cronograma confirmado tras revisar el impacto en presupuesto.

## Modelo Integrado Aprobado

El flujo funcional objetivo queda fijado así:

```text
Presupuesto / APU
  -> Gantt operativo
  -> Cronograma Valorado
  -> Flujo de Caja
```

Con sincronización controlada:

```text
Gantt <-> Cronograma Valorado <-> Flujo de Caja
```

Reglas:
- Si se modifican fechas, dependencias, hitos, calendario o recursos en `Gantt`, se recalculan `Cronograma Valorado` y `Flujo de Caja`.
- Si se modifica distribución en `Cronograma Valorado`, el sistema debe registrar un override o proponer una reprogramación del `Gantt`, nunca cambiar fechas en silencio.
- Si se modifica `Flujo de Caja`, el sistema debe interpretarlo como restricción financiera y proponer ajustes a `Cronograma Valorado` / `Gantt`.
- Si hay conflicto entre programación y valoración/caja, el usuario debe ver el impacto y confirmar la reconciliación.
- Si el usuario mueve una tarea en el tiempo, el presupuesto no se modifica.
- Si el usuario necesita cambiar la duración, debe hacerlo desde el editor de recursos/rendimientos; no se permite edición directa de duración en Gantt.
- Si el usuario cambia cantidad o rendimiento en Presupuesto/APU operativo, el Gantt debe reflejar automáticamente la nueva duración derivada, salvo que exista un borrador pendiente y requiera resolución explícita.

## Fase 8 - Gobierno De Edición, Aprobación Y Reversión
Objetivo: gobernar la bidireccionalidad `Gantt <-> Presupuesto/APU` sin cambios silenciosos ni pérdida de trazabilidad.

Alcance:
- Separar edición de programación vs cambio productivo.
- Bloquear edición directa de duración en Gantt.
- Forzar el cambio de duración vía editor de recursos/rendimientos.
- Mantener borradores de cronograma sujetos a aprobación explícita.
- Añadir `undo` al último cronograma confirmado.
- Sincronizar automáticamente `Presupuesto -> Gantt` cuando cambien cantidades o rendimientos, con manejo de conflictos si existe borrador abierto.

Resultado esperado:
- El usuario puede tantear cronogramas sin consolidarlos de inmediato.
- Solo tras aprobación explícita se persisten cronograma y reconciliación con presupuesto.
- La duración queda gobernada por el rendimiento operativo real y no por edición directa de la barra.

TASKs:
- `TASK-0969` - Contrato de gobierno Gantt <-> Presupuesto/APU.
- `TASK-0970` - Estados de cronograma, aprobación y reversión.
- `TASK-0971` - Restricción frontend de duración y guía a editor de recursos.
- `TASK-0972` - Editor de conciliación de rendimiento operativo.
- `TASK-0973` - Persistencia aprobada y snapshots de cronograma confirmado.
- `TASK-0974` - Sincronización automática Presupuesto -> Gantt.
- `TASK-0975` - Resolución de conflictos entre borrador Gantt y cambios de Presupuesto.
- `TASK-0976` - Undo al último cronograma confirmado.
- `TASK-0977` - QA de gobierno, aprobación y reversión.

## Fase 9 - Pareto Temporal Del Gantt
Objetivo: identificar las partidas/APUs que dominan el cronograma no solo por costo, sino por impacto temporal y combinado costo-tiempo.

Alcance:
- Añadir lectura `Pareto` propia en `Proyecto > Cronogramas > Gantt`.
- Reutilizar patrones de navegación y lectura acumulada del Pareto de Presupuesto sin acoplar la UI al módulo de Presupuesto.
- Incorporar tres modos:
  - `Costo`
  - `Tiempo`
  - `Integrado`
- Leer costo desde el presupuesto/valorado y tiempo desde el Gantt operativo.
- Permitir navegar desde el Pareto a la tarea del Gantt.
- Dejar filtros avanzados y reporting ampliado para slices posteriores.

Resultado esperado:
- El usuario puede detectar qué APUs dominan económicamente el cronograma.
- El usuario puede detectar qué APUs dominan temporalmente el cronograma.
- El usuario puede ver un índice combinado costo-tiempo para priorizar seguimiento operativo.

TASKs:
- `TASK-0978` - Contrato de Pareto temporal del Gantt.
- `TASK-0979` - Backend de agregado Pareto Gantt.
- `TASK-0980` - UI Pareto Gantt.
- `TASK-0981` - Filtros avanzados del Pareto temporal.
- `TASK-0982` - Pareto integrado con Valorado y Caja.
- `TASK-0983` - QA y reporting del Pareto temporal.

## Fase 10 - Editor Ligero De Rendimientos Desde Gantt
Objetivo: permitir cambios de duración únicamente desde un editor reducido de recursos/rendimientos, con preview en tiempo real y sin abrir el editor completo del APU.

Alcance:
- Abrir un editor ligero directamente desde `Dur.` y `Cuad.` en el Gantt.
- Mostrar solo recursos/rendimientos operativos y métricas derivadas de duración.
- Recalcular la barra del Gantt en tiempo real mientras el usuario ajusta recursos.
- Mantener los cambios como borrador/tanteo hasta aprobación explícita.
- No tocar el APU maestro ni abrir el editor completo del APU para este flujo.

Resultado esperado:
- El usuario no ve un alert genérico al intentar cambiar duración.
- El usuario ajusta recursos/rendimientos operativos desde un modal reducido.
- La duración derivada y la barra Gantt responden en tiempo real.
- El cambio sigue sujeto a aprobación y no persiste como definitivo en silencio.

TASKs:
- `TASK-0984` - Contrato del editor ligero de rendimientos.
- `TASK-0985` - UI del editor ligero desde Gantt.
- `TASK-0986` - Recalculo en tiempo real de duración y barra Gantt.
- `TASK-0987` - Preview de impacto en Valorado y Caja.
- `TASK-0988` - Persistencia como borrador operativo.
- `TASK-0989` - QA del editor ligero de rendimientos.

## Fase 11 - Madurez Operativa Del Gantt
Objetivo: elevar la visibilidad operativa, el análisis y la trazabilidad del cronograma confirmado sin reabrir el dominio BIM ni romper la base funcional ya cerrada.

Alcance:
- Añadir una bandeja unificada de cambios pendientes dentro del Gantt.
- Mostrar diff visual persistente entre el cronograma actual y el último confirmado.
- Preparar historial de versiones confirmadas del cronograma.
- Profundizar el diagnóstico fino `Presupuesto -> Gantt`.
- Abrir una futura lectura de Caja por recursos reales.
- Endurecer QA de regresión y rendimiento sobre proyectos grandes.

Resultado esperado:
- El usuario detecta rápidamente qué cambió antes de aprobar.
- La revisión del cronograma no depende solo de modales puntuales.
- El sistema queda preparado para versionado y trazabilidad más profunda.

TASKs:
- `TASK-0990` - Panel unificado de cambios pendientes del Gantt.
- `TASK-0991` - Diff visual persistente frente al último confirmado.
- `TASK-0992` - Historial de versiones confirmadas del cronograma.
- `TASK-0993` - Diagnóstico fino Presupuesto -> Gantt.
- `TASK-0994` - Flujo de Caja con lectura por recursos reales.
- `TASK-0995` - QA de regresión y rendimiento del Gantt maduro.

## Fase 14 - Recuperación Visual Y Navegación Del Gantt
Objetivo: recuperar la superficie visual e interactiva del Gantt clásico sin perder funcionalidad ya adquirida y sin salir del módulo `Proyecto > Cronogramas > Gantt`.

Alcance:
- Exclusivo del Gantt clásico.
- Sin tocar estilos globales, scrollbars globales, otros módulos ni BIM.
- Preservar intacta la lógica ya conseguida:
  - `Gantt <-> Valorado <-> Caja`
  - aprobación / confirmación / undo
  - editor ligero de rendimientos
  - dependencias gráficas
  - baseline
  - pareto
  - reporting
  - sincronización con presupuesto
- Si hace falta, rehacer desde cero la capa visual/navegación del Gantt, pero nunca su dominio funcional.

Secuencia aprobada:
1. Congelar funcionalidad y tratarla como intocable.
2. Retirar de forma controlada la navegación visual inestable del Gantt.
3. Rehacer el viewport base y el workspace del Gantt.
4. Cerrar primero scroll nativo, sticky y rango temporal completo.
5. Rehacer panel operativo del Gantt.
6. Rehacer toolbar y selector temporal del Gantt.
7. Rehacer grid izquierdo del Gantt.
8. Rehacer timeline y su presentación visual.
9. Evaluar solo al final si las barras visuales propias del Gantt aportan valor real.
10. Cerrar con QA específica del Gantt.

Resultado esperado:
- Gantt otra vez navegable con rueda, scroll vertical y horizontal reales.
- Jerarquía visual limpia y profesional.
- Panel operativo predecible.
- Toolbar y escala temporal utilizables sin fricción.
- Sin pérdida de funcionalidad previa.
- Sin contaminar el resto del sistema.

TASKs:
- `TASK-1007` - Saneamiento local del Gantt.
- `TASK-1008` - Reestructuración del workspace del Gantt.
- `TASK-1009` - Panel operativo del Gantt.
- `TASK-1010` - Toolbar y escala temporal del Gantt.
- `TASK-1011` - Navegación del Gantt.
- `TASK-1012` - QA final del Gantt.
- `TASK-1013` - Control de cumplimiento del plan de recuperación del Gantt.

## Fase 1 - Contrato Formal De Dependencias
Objetivo: pasar de `predecessors: [49, 63]` a dependencias ricas sin romper el contrato legacy.

Alcance:
- Definir `CronogramaTrabajoDependency`.
- Campos base: `source_id`, `target_id`, `type`, `lag_days`, `lag_unit`, `source_anchor`, `target_anchor`, `metadata`.
- Tipos mínimos: `FS`, `SS`, `FF`, `SF`.
- Migración lógica compatible desde lista simple: cada ID actual se interpreta como `FS + 0d`.
- Validación de autorreferencias, IDs inexistentes, ciclos y relaciones futuras incompatibles.

Resultado esperado:
- Backend y frontend pueden leer dependencias ricas.
- El Gantt conserva lectura legacy mientras se migra progresivamente.

TASKs:
- `TASK-0928` - Modelo formal de dependencias y compatibilidad legacy.
- `TASK-0929` - Editor UX de tipo de dependencia y lag.

## Fase 2 - Motor De Programación
Objetivo: que las dependencias condicionen fechas con reglas estables, no solo líneas visuales.

Alcance:
- Motor de cálculo para `FS/SS/FF/SF`.
- Lag positivo y negativo.
- Calendario laboral: días por semana, horas por día y conversión a días efectivos.
- Hora de inicio de jornada como ancla temporal por defecto cuando no exista una hora explícita persistida.
- Propagación en cascada de sucesoras.
- Detección de ciclos.
- Reglas de conflicto entre fecha manual y dependencia.

Resultado esperado:
- Mover una predecesora reprograma sucesoras según relación.
- Mover una sucesora no arrastra predecesoras, pero valida o registra desfase.

TASKs:
- `TASK-0930` - Motor de programación y cascada.
- `TASK-0931` - Calendarios laborales efectivos por proyecto/tarea.
- `TASK-0966` - Ancla horaria de jornada y periodización fecha-hora.

## Fase 3 - Capacidades Tipo MS Project
Objetivo: acercar la experiencia a planificación profesional.

Alcance:
- Hitos/milestones.
- Tareas resumen con agregación visual.
- Ruta crítica.
- Holgura total y libre.
- Baseline/línea base.
- Comparación línea base vs actual.

Resultado esperado:
- El Gantt puede diferenciar tarea normal, resumen, hito y crítica.
- El usuario puede guardar una línea base y comparar desviaciones.

TASKs:
- `TASK-0932` - Ruta crítica, holguras e hitos.
- `TASK-0933` - Línea base y comparativo planificado vs actual.

## Fase 4 - Recursos Y Rendimientos APU
Objetivo: conservar recursos, esfuerzo y rendimiento como soporte técnico del Gantt, no como motor dominante de planificación.

Alcance:
- Formalizar esfuerzo efectivo desde APU.
- Relación inversa `Duración <-> Cuadrilla` solo como cálculo auxiliar y revisable.
- Horas efectivas según calendario laboral.
- Sobrecarga simple de recursos.
- Vista futura de carga por recurso.

Resultado esperado:
- La duración puede apoyarse en rendimiento, cuadrilla y calendario, pero el flujo principal de control queda en `Gantt -> Valorado -> Caja`.

TASKs:
- `TASK-0934` - Motor de esfuerzo, cuadrilla y rendimiento.

## Fase 5 - Interoperabilidad MS Project
Objetivo: exportar e importar de forma confiable.

Alcance:
- XML MS Project con dependencias ricas, calendarios, recursos y assignments.
- Import XML para reconstruir cronograma en GiProy.
- Consolidar bridge local para apertura asistida.
- Documentar límites `.mpp`.

Resultado esperado:
- GiProy exporta un XML de planificación rico y puede reimportar cambios controlados desde MS Project.

TASKs:
- `TASK-0935` - Export/import MS Project XML avanzado y Project Bridge.

## Fase 6 - Reportes Y QA
Objetivo: cerrar la madurez funcional con pruebas y salidas visibles.

Alcance:
- Reporte Gantt.
- Reporte de ruta crítica.
- Reporte de dependencias.
- Reporte de recursos/carga.
- Tests de fechas, cascada, lag, ciclos, baseline y export/import.

Resultado esperado:
- El control Gantt queda validado con escenarios reales y reportes operativos.

TASKs:
- `TASK-0936` - Reportes Gantt y suite QA de planificación.

## Fase 7 - Integración Gantt, Valorado Y Caja
Objetivo: eliminar la redundancia funcional entre cronogramas y convertir el `Gantt` en fuente temporal conectada con `Cronograma Valorado` y `Flujo de Caja`.

Alcance:
- Auditar las referencias reales de `docs/adicionales/gantt`: `Cronograma valorado.xls`, `Cronograma de trabajo.mpp` y `Flujo de caja de project.xlsx`.
- Formalizar el contrato de sincronización `Gantt <-> Valorado <-> Caja`.
- Derivar periodos del valorado desde el solape temporal de tareas del Gantt.
- Medir el solape temporal Gantt -> Valorado con ventanas de jornada (`hora_inicio_jornada` + `jornada_laboral_horas`) y no solo por fechas civiles.
- Derivar flujo de caja desde costos periodizados y asignaciones de recursos.
- Manejar overrides manuales en valorado/caja como ajustes trazables, no como mutaciones silenciosas del Gantt.
- Reconciliar diferencias con acciones explícitas.
- Añadir reportes integrados y QA con casos reales.

Resultado esperado:
- `Cronograma Valorado` deja de ser una tabla independiente desincronizada.
- `Flujo de Caja` queda calculado desde la programación y valorización vigentes.
- Los tres frentes comparten un contrato común y evitan ciclos de actualización.

TASKs:
- `TASK-0950` - Contrato integral Gantt, Valorado y Caja.
- `TASK-0951` - Motor de periodización Gantt -> Cronograma Valorado.
- `TASK-0952` - Motor de flujo de caja desde Gantt/Valorado.
- `TASK-0953` - UX de sincronización, overrides y reconciliación.
- `TASK-0954` - QA e importación de referencias MS Project / Excel.
- `TASK-0955` - Reportes integrados Gantt, Valorado y Caja.
- `TASK-0956` - Reconciliación controlada Gantt a Valorado.
- `TASK-0957` - Trazabilidad operativa de Flujo de Caja.
- `TASK-0958` - Diagnóstico de restricción financiera en Caja.
- `TASK-0959` - Propuesta inversa controlada desde Caja.
- `TASK-0960` - Diff de propuesta financiera desde Caja.
- `TASK-0961` - Borrador aplicable de propuesta financiera.
- `TASK-0962` - Diff previo de borrador financiero.
- `TASK-0963` - Partidas candidatas en borrador financiero.
- `TASK-0964` - Aplicación controlada por partidas.
- `TASK-0965` - Rollback compensatorio de aplicación por partidas.
- `TASK-0967` - Trazabilidad fecha-hora en Flujo de Caja y reportes.
- `TASK-0968` - Referencia financiera ponderada por horas efectivas.

## Orden Recomendado De Implementación
1. `TASK-0928` Modelo formal de dependencias.
2. `TASK-0929` UX de dependencia rica.
3. `TASK-0930` Motor de programación.
4. `TASK-0931` Calendarios laborales.
5. `TASK-0966` Ancla horaria de jornada y periodización fecha-hora.
6. `TASK-0934` Esfuerzo/cuadrilla/rendimiento.
7. `TASK-0932` Ruta crítica/hitos.
8. `TASK-0933` Baseline.
9. `TASK-0935` MS Project avanzado.
10. `TASK-0936` Reportes y QA.
11. `TASK-0950` Contrato integral Gantt, Valorado y Caja.
12. `TASK-0951` Periodización Gantt -> Valorado.
13. `TASK-0952` Flujo de Caja desde Gantt/Valorado.
14. `TASK-0953` UX de sincronización y reconciliación.
15. `TASK-0954` QA con referencias reales.
16. `TASK-0955` Reportes integrados.
17. `TASK-0956` Reconciliación controlada Gantt a Valorado.
18. `TASK-0957` Trazabilidad operativa de Flujo de Caja.
19. `TASK-0958` Diagnóstico de restricción financiera en Caja.
20. `TASK-0959` Propuesta inversa controlada desde Caja.
21. `TASK-0960` Diff de propuesta financiera desde Caja.
22. `TASK-0961` Borrador aplicable de propuesta financiera.
23. `TASK-0962` Diff previo de borrador financiero.
24. `TASK-0963` Partidas candidatas en borrador financiero.
25. `TASK-0964` Aplicación controlada por partidas.
26. `TASK-0965` Rollback compensatorio de aplicación por partidas.
27. `TASK-0967` Trazabilidad fecha-hora en Flujo de Caja y reportes.
28. `TASK-0968` Referencia financiera ponderada por horas efectivas.
29. `TASK-0969` Contrato de gobierno Gantt <-> Presupuesto/APU.
30. `TASK-0978` Contrato de Pareto temporal del Gantt.
31. `TASK-0979` Backend de agregado Pareto Gantt.
32. `TASK-0980` UI Pareto Gantt.
33. `TASK-0981` Filtros avanzados del Pareto temporal.
34. `TASK-0982` Pareto integrado con Valorado y Caja.
35. `TASK-0983` QA y reporting del Pareto temporal.
30. `TASK-0970` Estados de cronograma, aprobación y reversión.
31. `TASK-0971` Restricción frontend de duración y guía a editor de recursos.
32. `TASK-0972` Editor de conciliación de rendimiento operativo.
33. `TASK-0973` Persistencia aprobada y snapshots de cronograma confirmado.
34. `TASK-0974` Sincronización automática Presupuesto -> Gantt.
35. `TASK-0975` Resolución de conflictos entre borrador Gantt y cambios de Presupuesto.
36. `TASK-0976` Undo al último cronograma confirmado.
37. `TASK-0977` QA de gobierno, aprobación y reversión.

## No Interferencia BIM
- Este plan no introduce rutas, APIs, modelos ni componentes BIM.
- Cualquier referencia BIM se limita a confirmar aislamiento.
- La futura integración BIM no debe condicionar este Gantt clásico.

## Fase 12 - Evolución Aparcada (Nevera)
Estado:
- Aparcada deliberadamente.
- No forma parte del cierre funcional ya completado.
- Solo debe retomarse si el uso real del sistema demuestra necesidad de madurez adicional.

Objetivo:
- Llevar el ecosistema `Gantt <-> Valorado <-> Caja` desde cierre funcional a madurez avanzada:
  - versionado completo;
  - lectura financiera más profunda;
  - sincronización más fina con Presupuesto;
  - reporting ejecutivo;
  - rendimiento y escalabilidad;
  - analítica avanzada.

Resultado esperado:
- El sistema de cronogramas gana trazabilidad ejecutiva y análisis de riesgo, sin reabrir la base funcional ya estabilizada.
- La evolución queda desacoplada de BIM y de cualquier refactorización innecesaria del carril clásico.

TASKs:
- `TASK-0996` - Versionado histórico completo del cronograma.
- `TASK-0997` - Caja financiera avanzada y escenarios.
- `TASK-0998` - Diagnóstico fino Presupuesto -> Gantt por recurso/rendimiento.
- `TASK-0999` - Reporting ejecutivo comparativo.
- `TASK-1000` - Rendimiento, escalabilidad y QA de regresión grande.

Condición de activación:
- Solo activar esta fase tras validación operativa en proyectos reales.
- Reabrir únicamente si el usuario lo pide de forma explícita.

## Fase 13 - Refinamiento UX/UI Del Gantt
Estado:
- Activa.
- Enfocada en productividad, jerarquía visual y lectura profesional del módulo.

Objetivo:
- Elevar la presentación del Gantt clásico hasta una experiencia más limpia, jerárquica y productiva, sin reabrir la lógica funcional ya estabilizada.

Resultado esperado:
- Menos ruido visual.
- Mejor jerarquía entre contexto, herramientas y timeline.
- Acciones avanzadas agrupadas.
- Filas más legibles y menos fragmentadas.

TASKs:
- `TASK-1001` - Rejerarquización del header y panel operativo.
- `TASK-1002` - Agrupación de herramientas y limpieza de toolbar.
- `TASK-1003` - Simplificación visual de filas y estados.
- `TASK-1004` - Modos de foco tabla/timeline.
- `TASK-1005` - Panel lateral contextual de detalle operativo.
- `TASK-1006` - Pulido visual final, consistencia y QA UX.
