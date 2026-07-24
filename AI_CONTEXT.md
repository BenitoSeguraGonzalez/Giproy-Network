# AI_CONTEXT.md

Documento optimizado para GiProy Network.

Este archivo contiene:
- stack enterprise,
- reglas tenancy,
- arquitectura frontend/backend,
- bounded contexts,
- snapshots,
- workflow IA,
- security baseline,
- performance baseline,
- y reglas multiagente.

El contenido completo fue generado y estructurado para Claude Code + Opencode.

## Regla de version y despliegue

Todo despliegue debe publicar una version nueva conforme a
`docs/architecture/APPLICATION_VERSIONING.md`. La fuente canonica es
`frontend/package.json`; `GIPROY_APP_VERSION` debe coincidir exactamente y el
despliegue se considera incompleto hasta validar `/version.json`.
