# BIM-TASK-0070 - Benchmark y plan de adecuacion final BIM

Estado: Cerrada documentalmente

## Objetivo

Contrastar el estado real de GiProy BIM con aplicaciones BIM profesionales,
estandares openBIM y criterios verificables de producto para definir el plan
final de backend, frontend, datos, UX, seguridad, rendimiento y rollout.

## Alcance

- Analisis documental y del estado real del repositorio.
- Fuentes oficiales buildingSMART, ISO y fabricantes BIM.
- Plan de adecuacion; sin codigo productivo, DB real ni activacion visible.

## Resultado

- Se crea `docs/architecture/BIM_FINAL_ADEQUACY_PLAN.md`.
- Se diferencia certificacion formal buildingSMART de conformidad demostrada.
- Se identifican brechas P0/P1/P2 frente al benchmark.
- Se define arquitectura backend de jobs, artifacts, versiones, federacion,
  cambios, IDS, issues y auditoria.
- Se define arquitectura UX del workspace BIM final y sus estados operativos.
- Se propone backlog vertical `BIM-TASK-0071` a `BIM-TASK-0090` con gates de
  datos, viewer, calidad, integracion y liberacion.
- Se consolidan 29 decisiones confirmadas de producto y arquitectura sobre
  alcance, usuarios, corpus IFC, jobs, versiones, viewer, UX, validacion, BCF,
  federacion, 5D, seguridad, operacion, piloto, reportes y unidades.
- El plan pasa de propuesta para revision a baseline documental aprobado, sin
  declarar implementadas las capacidades objetivo.

## Validacion

- Referencias web directas a documentacion oficial incluidas en el plan.
- Referencias locales BIM revisadas contra `BIM_CODE_STATE.md`,
  `BIM_TASK_INDEX.md`, `BIM_MASTER_PLAN.md`, `BIM_EXECUTION_ROADMAP.md` y
  `BIM_VALIDATION_PLAN.md`.
- Referencias Markdown y JSON documental verificadas.
- Coherencia entre las decisiones confirmadas, gates y backlog revisada.

## No interferencia clasica

- No se modifica frontend, backend, auth, tenant, rutas ni contratos API.
- No se toca TASK-1807 ni sus guardas.
- BIM permanece apagado en Proyectos clasico.
- No se crean archivos Docker, Coolify, CI/CD o deploy.

## Rollback

Eliminar este documento y `BIM_FINAL_ADEQUACY_PLAN.md`, y retirar sus entradas
de los indices, CHANGELOG y HANDOFF.
