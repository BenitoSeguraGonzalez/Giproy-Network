# BIM-TASK-0090 - Rollout controlado

Estado: Allowlist piloto desplegada en beta; piloto temporal pendiente de inicio formal

## Implementacion

- Plan por empresa con etapa, estado, checklist, responsable de soporte,
  criterio de salida y procedimiento de rollback.
- Preparacion bloqueada hasta aprobar Gate A/B/C, seguridad, rendimiento,
  observabilidad, soporte y rollback ensayado.
- Ensayo de rollback registra usuario/fecha y auditoria; activacion sigue usando
  los feature flags/allowlists BIM existentes, sin deploy separado.
- Migracion aditiva `de2010a1b2c3` y cliente API BIM de dominio.

## Validacion

- Readiness falso antes del ensayo y verdadero solo con todos los checks: OK.
- Aislamiento por empresa y migracion no destructiva: OK.
- Suite BIM `95 passed`, build, smokes BIM/anti-BIM y baseline enterprise: OK.

## Pendiente externo

Ejecutar y aprobar el piloto temporal con usuarios reales. Gate E y la
liberacion no se cierran documentalmente antes de esa evidencia.

## Acta de prearranque Gate E

- Fecha de autorizacion: 2026-07-13.
- Puerta funcional previa: `TASK-2022`, sujeta a validacion final.
- Empresas piloto autorizadas: `Administradores Generales` (`empresa_id=1`) y
  `Santiago Bermeo` (`empresa_id=3`).
- Coordinador BIM: pendiente de designacion real.
- Usuario de negocio: pendiente de designacion real.
- Inicio y fin de las 10 jornadas habiles: pendientes.
- Dos revisiones reales del modelo: pendientes.
- Evidencias obligatorias: smoke flag off/on, flujo funcional, rendimiento,
  incidencias, soporte y ensayo de rollback.

El prearranque no activa allowlists, no inicia el conteo temporal y no equivale
a aprobar Gate E.

## Activación controlada 2026-07-13

- `TASK-2026` activa la puerta persistida con `is_enabled=true`,
  `superadmin_only=false` y `allowed_company_ids=1,3`.
- La empresa `2` queda denegada incluso para rol superadministrador; el frontend
  mantiene BIM oculto porque consume la misma resolución backend.
- La activación queda auditada como `bim_pilot_allowlist_activated`, incluyendo
  el estado anterior necesario para rollback.
- La allowlist activa no inicia por sí sola las diez jornadas: coordinador BIM,
  usuario de negocio, fechas y dos revisiones reales siguen pendientes.
- La base local aún no tiene `bim_rollout_plans`. En beta la rama BIM se aplico
  de forma aislada hasta `de2022a1b2c3`, sin arrastrar migraciones clasicas.

## Despliegue beta 2026-07-13

- Se respaldaron base, fuentes e imagen backend antes del cambio.
- BIM permanecio apagado durante build, migracion y recreacion de contenedores.
- Los tres contenedores quedaron saludables y el frontend publica el workspace
  BIM completo; la ruta protegida responde `401` sin autenticacion.
- Resolucion runtime final: empresa `1` habilitada, empresa `3` habilitada y
  empresa `2` denegada incluso como superadministrador.
- Gate E no se considera aprobado: faltan las diez jornadas, dos revisiones y
  responsables humanos reales.

## Revalidación técnica 2026-07-13

- Gate D local: 100%.
- Suite backend BIM: `120 passed` sobre 35 archivos.
- Viewer, shell, replay de vista, issues, federación y Fragments producto: OK.
- Chrome/Edge desktop/tablet: 60 FPS, first render máximo 859 ms, tres ciclos
  mount/unmount y sin errores de página.
- Build, smokes BIM/anti-BIM y baseline enterprise: OK.

La preparación técnica Gate E está al 100%. El gate formal permanece abierto
porque su piloto humano real está al 0%.

## Rollback

Restaurar `is_enabled=false`, `superadmin_only=true` y
`allowed_company_ids=''`. En beta existen dump, respaldo de fuentes e imagen
predeploy; las migraciones BIM son aditivas y la restauracion del dump es el
rollback definitivo. GiProy Clasico conserva rutas y comportamiento.
