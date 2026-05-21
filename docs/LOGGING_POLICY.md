# Politica de logging seguro - GiProy Clasico

Fecha: 2026-05-21  
Modo: GIPROY CLASICO  
Alcance: backend comun, frontend clasico y tooling local sin activar UX BIM

## Objetivo

Establecer una regla conservadora para reducir exposicion sensible en logs sin alterar contratos funcionales, autenticacion, multi-tenant, permisos, DB ni flujos ERP.

## Regla principal

La estabilidad funcional manda sobre la limpieza. Si un log puede estar acoplado a diagnostico operativo, scripts historicos o soporte local, primero se documenta y se valida antes de cambiarlo.

## Datos que no deben registrarse

- Passwords, longitud de password o hashes.
- Tokens JWT, refresh tokens, reset tokens, API keys o secretos.
- Cabeceras `Authorization` completas.
- Session IDs, device IDs o cookies sin redaccion explicita.
- Emails de usuario en logs de autenticacion productiva, salvo que exista una necesidad auditada y se aplique redaccion.
- Payloads completos de requests/responses que puedan contener datos de tenant, presupuesto, documentos o credenciales.

## Backend productivo

- Endpoints, services y repositories deben usar `logging.getLogger(__name__)`.
- Evitar `print()` en codigo productivo del backend.
- Preferir mensajes operativos con contexto minimo: id tecnico ya autorizado, modulo, accion, estado y excepcion.
- No cambiar respuestas API, status codes, DB, permisos, tenant ni auditoria solo para limpiar logs.
- Cualquier cambio en auth, licencias, sesiones o tenant requiere validacion focal y baseline completo.

## Excepciones permitidas

Estas excepciones no se eliminan automaticamente:

- Scripts CLI, seeders, migraciones manuales o verificadores locales que usan stdout como interfaz.
- Mock email de desarrollo mientras no exista proveedor real configurado.
- Fallbacks de emergencia cuando falla el propio writer de trazas/logs.
- Herramientas de launcher o mantenimiento local que comunican resultados al operador.

Toda excepcion debe mantenerse fuera de logs productivos sensibles o documentarse antes de refactorizar.

## Frontend clasico

- `console.error` y `console.warn` se revisan por modulo antes de reducirlos.
- No registrar tokens, cabeceras de autenticacion, datos completos de usuario, tenant o payloads voluminosos.
- No sustituir consola masivamente sin validar flujos de soporte, build y smoke anti-BIM.

## BIM

En sesiones MODO 1 no se modifican logs, schemas, rutas, feature flags ni UX BIM. Los avisos o deuda detectados en BIM se documentan como riesgo no bloqueante y se dejan para una sesion BIM autorizada.

## Validaciones minimas

- Cambios Python: `py_compile` focal del archivo tocado.
- Cambios backend compartido: import de `app.main` o validador baseline.
- Cambios frontend: `npm run build` y smoke anti-BIM.
- Cambios documentales: JSON documental valido cuando aplique.
- Cierre enterprise: `tools/ai_tools/validate_enterprise_baseline.py --include-frontend` cuando el slice pueda afectar runtime.
