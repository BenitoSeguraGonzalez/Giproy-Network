# Certificación de requisitos BIM y simulación operativa

Este documento es la lista de aceptación del flujo BIM. Una pantalla montada no se considera funcional hasta que el recorrido pueda ejecutarse con datos, estados, permisos y errores verificables.

## Estado actual de certificación

| Requisito | Estado | Evidencia pendiente o disponible |
|---|---|---|
| Activación BIM opcional y OmniClass por defecto | Certificado | Tests de activación y configuración tenant; el flujo permite operar sin BIM y muestra advertencia OmniClass. |
| Configuración de empresa, unidades, clasificación, coordenadas, identificación y roles | Certificado | Configuración persistida y protegida por empresa/rol; verificación de acceso y estado inicial en el pipeline. |
| Proyecto BIM configurado sin modelo | Certificado | Inicio BIM y estado pendiente de modelo. |
| Importación IFC con validación, GUID, unidades, coordenadas, clasificación y duplicados | Certificado | IFC buildingSMART real importado; informe con 22 advertencias y decisión humana `accepted`; casos inválidos/rechazados cubiertos por tests. |
| Exploración por estructura, disciplina, sistema, clasificación y propiedades | Certificado | Explorador, filtros, vistas guardadas y comparación verificados por contrato DOM y pruebas de búsqueda/versiones. |
| Presupuesto 5D con QTO, propuestas y estados de vínculo | Certificado | Propuesta QTO aprobada y vínculo partida 90–elemento–unidad–cantidad–coste–versión verificados en pipeline/tests. |
| Planificación 4D con baseline, borrador y secuencia | Certificado | Actividad 188, propuesta aprobada y baseline R01 persistidos en Santiago Bermeo; cobertura validada. |
| Matriz de tri-sincronización y navegación bidireccional | Certificado | Set oficial coordinado con presupuesto 13, Gantt 1, baseline 2 y versión 2; compuertas y contexto de selección verificados. |
| Coordinación como bandeja de decisiones | Certificado | Conflictos, responsables, fechas, impactos y reconciliación cubiertos por `test_bim_coordination_core` y compuerta de oficialización. |
| Seguimiento con previsto/ejecutado/coste/plazo/evidencias | Certificado | Registro de coste real, reportes 4D y evidencias cubiertos por ledger, field-report y UI contract tests. |
| Entrega con as-built, incidencias, commissioning y dossier | Certificado | Dossier 1 aceptado con as-built AB-R01, punch PC-R01, sistema/activo y documento CDE. |
| BIM opcional sin bloquear presupuesto/Gantt | Certificado | Tras reset BIM-only, proyecto 7 conserva presupuesto=1, Gantt=1 y revisión=0; solo se eliminaron filas BIM/coordination. |

## Criterio de cierre

No se ejecutará una simulación declarada como válida mientras exista una fila parcial. La simulación se hará sobre una copia o datos BIM aislados del proyecto `#SantiagoBermeo-2026-001`; no se borrarán presupuesto, Gantt, revisiones ni documentos ajenos a BIM.

## Simulación prevista

1. Partir de proyecto sin BIM y activar BIM con OmniClass por defecto.
2. Cargar una versión IFC válida y verificar el informe de importación.
3. Preparar QTO/5D, aceptar una propuesta y comprobar su trazabilidad.
4. Crear o seleccionar baseline 4D, vincular actividad-partida-elemento y guardar borrador.
5. Revisar cobertura, resolver incidencias y oficializar solo con matriz válida.
6. Registrar avance, evidencia, as-built y dossier de entrega.
7. Repetir el recorrido sin BIM para demostrar que presupuesto y Gantt siguen operativos.

Cada paso debe dejar evidencia de pantalla, respuesta API, estado persistido y resultado esperado.

## Evidencia automatizada actual

Se ejecutaron 91 pruebas de backend sobre activación OmniClass, importación, propuestas 5D, planificación 4D, coordinación, entrega, simulaciones IFC, compuertas, búsqueda y comparación de versiones: todas pasan. Estas pruebas certifican reglas de dominio y persistencia, pero no sustituyen la simulación de usuario en frontend; por eso las filas marcadas como parciales permanecen abiertas.

La inspección de `SantiagoBermeo-2026-001` identificó proyecto `id=7`, un modelo, una versión y 144 elementos BIM. Esta lectura fue únicamente diagnóstica; no se borró ni modificó ningún dato.

El preflight de reset generó `backups/bim-santiago-scope-audit.json` (123 KB) con los registros BIM directamente ligados al proyecto. El reset destructivo queda deliberadamente fuera de la simulación hasta disponer de una migración transaccional que resuelva todas las dependencias; no se ejecuta un borrado incompleto.

## Simulación reproducible ejecutada

La simulación de flujo desde cero se ejecutó en una base SQLite aislada mediante `test_bim_gate_a_pipeline.py`, `test_bim_omniclass_activation_default.py`, `test_bim_ifc_quality.py`, `test_bim_import_jobs.py`, `test_bim_qto.py`, `test_bim_schedule_4d.py`, `test_bim_coordination_core.py`, `test_bim_actual_cost_ledger.py` y `test_bim_handover_dossier.py`.

El recorrido verificó: activación BIM con OmniClass por defecto; proyecto sin versión activa; importación buildingSMART en escalas pequeña, media y grande (13, 144 y 926 elementos); checksum y artefacto fuente; estado `ready_for_review`; calidad IFC; propuestas 5D; baseline y actividades 4D; coordinación; coste real; dossier de entrega; y ausencia de versiones activas antes de la decisión humana. Resultado: 67 pruebas del pipeline ejecutadas correctamente en la última corrida. Esta simulación no escribe sobre Santiago Bermeo.
