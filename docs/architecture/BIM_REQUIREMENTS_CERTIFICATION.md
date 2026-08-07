# Certificación de requisitos BIM y simulación operativa

Este documento es la lista de aceptación del flujo BIM. Una pantalla montada no se considera funcional hasta que el recorrido pueda ejecutarse con datos, estados, permisos y errores verificables.

## Estado actual de certificación

| Requisito | Estado | Evidencia pendiente o disponible |
|---|---|---|
| Activación BIM opcional y OmniClass por defecto | Parcial | El shell muestra OmniClass y el backend conserva la configuración; falta recorrido de activación/desactivación sobre tenant real. |
| Configuración de empresa, unidades, clasificación, coordenadas, identificación y roles | Parcial | Existen superficies administrativas; falta certificación de extremo a extremo desde un proyecto sin BIM. |
| Proyecto BIM configurado sin modelo | Certificado | Inicio BIM y estado pendiente de modelo. |
| Importación IFC con validación, GUID, unidades, coordenadas, clasificación y duplicados | Parcial | El panel de importación existe; falta ejecutar un IFC válido, uno con advertencias y uno rechazado. |
| Exploración por estructura, disciplina, sistema, clasificación y propiedades | Parcial | El explorador contextual por GUID, propiedad, disciplina y clasificación ya está implementado; faltan vistas guardadas, comparación y filtros de sistema/planta certificados. |
| Presupuesto 5D con QTO, propuestas y estados de vínculo | Parcial | Panel 5D y estados de estimación existen; falta validar vínculos completos partida-elemento-unidad-cantidad-coste-versión. |
| Planificación 4D con baseline, borrador y secuencia | Parcial | Gantt y baseline existen; falta cerrar persistencia de secuencia y cobertura completa. |
| Matriz de tri-sincronización y navegación bidireccional | Parcial | La compuerta positiva/negativa y el contexto actividad-elemento están certificados; falta cerrar navegación de partida y retorno desde modelo 3D. |
| Coordinación como bandeja de decisiones | Parcial | Panel de coordinación existe; falta ejecutar incidencia completa con responsable, fecha, impacto y reconciliación. |
| Seguimiento con previsto/ejecutado/coste/plazo/evidencias | Parcial | Panel de reportes existe; falta simular una fecha de control y registrar evidencia. |
| Entrega con as-built, incidencias, commissioning y dossier | Parcial | Dossier y modal existen; falta recorrer estados hasta cerrado con dependencias. |
| BIM opcional sin bloquear presupuesto/Gantt | Certificado en diseño | La compuerta solo bloquea coordinación; falta prueba de proyecto sin BIM en backend. |

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
