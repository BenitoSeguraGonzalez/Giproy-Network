# BIM-TASK-0178 - Probe remoto de colaboracion CDE

Fecha: 2026-07-20
Estado: Cerrada localmente; ejecucion beta pendiente de despliegue y tokens efimeros
Modo: GIPROY BIM

## Objetivo

Preparar una certificacion remota reproducible de H03 con dos sesiones reales,
sin persistir credenciales ni ampliar la allowlist de empresas piloto.

## Alcance ejecutado

- Cliente HTTP estándar para presencia, feed incremental y metricas BIM.
- Dos heartbeats iniciales concurrentes con sesiones independientes.
- Cambio de contexto y verificacion del delta posterior al cursor.
- Expiracion controlada de una sesion, mantenimiento de la otra y reconexion.
- Confirmacion de telemetria con dos sesiones activas.
- Salida limpia de ambas sesiones en `finally`, incluso ante fallo intermedio.
- Tokens leidos solo desde `BIM_CDE_TOKEN_A` y `BIM_CDE_TOKEN_B`; nunca se
  incluyen en argumentos, salida, excepciones ni archivos.
- Transporte restringido a HTTPS, sin credenciales embebidas ni redirecciones.
- `company_id` limitado expresamente a la allowlist piloto `1,3`.

## Validacion

- `py_compile`: correcto.
- Servidor CDE simulado con reloj controlado: correcto.
- Concurrencia, cursor, expiracion, reconexion, metricas y cleanup: correctos.
- Guarda sin tokens distintos: bloquea antes de acceder a red.

## Ejecucion beta pendiente

Tras desplegar el backend que contiene `BIM-TASK-0174` a `0177`, obtener dos
tokens efimeros de usuarios autorizados. El usuario A debe disponer de
`bim.admin` para consultar metricas operativas; ambos deben tener acceso al
proyecto piloto. Ejecutar:

```powershell
$env:BIM_CDE_TOKEN_A='<token-efimero-a>'
$env:BIM_CDE_TOKEN_B='<token-efimero-b>'
.\.venv\Scripts\python.exe tools\ai_tools\validate_bim_cde_remote.py `
  --company-id 1 --project-id <proyecto-piloto>
```

Eliminar ambas variables al finalizar. No documentar sus valores.

## No interferencia clasica

El probe llama exclusivamente endpoints BIM protegidos. No cambia GiProy
Clasico, autenticacion, tenant, base operativa, allowlist ni contratos API.

## Limite declarado

La herramienta esta certificada localmente, pero H03 sigue parcial hasta que la
salida `BIM_CDE_REMOTE_OK` se obtenga contra beta con dos usuarios reales.

## Rollback

Eliminar el probe, su prueba y sus referencias documentales. No existe cambio
de runtime, base de datos o producto que revertir.

## Resultado

Paridad: 88,33%. Programa: 52/61 slices, 85,25% realizado y 14,75% pendiente.
