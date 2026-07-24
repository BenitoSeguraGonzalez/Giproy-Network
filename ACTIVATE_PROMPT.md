PROMPT DE ACTIVACIÓN

Leer primero:

AI_CONTEXT.md
docs/project_state.json
docs/HANDOFF.md
docs/tasks

Usar project_state.json como snapshot.

Evitar reanalizar todo el repositorio.

Registrar cambios como TASKS.

Antes de cualquier despliegue, aplicar obligatoriamente el contrato de
`docs/architecture/APPLICATION_VERSIONING.md`: incrementar la version SemVer en
`frontend/package.json`, sincronizar `GIPROY_APP_VERSION`, verificar
`/version.json` y documentar la release. Nunca reutilizar una version activa.
