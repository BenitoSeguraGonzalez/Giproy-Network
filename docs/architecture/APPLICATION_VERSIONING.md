# Versionado de la aplicacion GiProy

## Contrato

La fuente canonica de la version es `frontend/package.json`. Se usa SemVer:

- `MAJOR`: cambio incompatible de plataforma o contratos publicos.
- `MINOR`: nueva capacidad funcional compatible.
- `PATCH`: correccion compatible.
- `-beta.N`: despliegue beta previo a promocion estable.

Cada despliegue debe usar una version distinta a la que ya esta activa. La
excepcion `ALLOW_SAME_VERSION_REDEPLOY=1` queda reservada a una recuperacion o
rollback explicito y documentado; no forma parte del flujo ordinario.

## Flujo obligatorio de lanzamiento

1. Elegir la nueva version segun el alcance de la release.
2. Actualizar `version` en `frontend/package.json` y `frontend/package-lock.json`.
3. Configurar exactamente el mismo valor en `GIPROY_APP_VERSION` dentro del
   `.env` no versionado del entorno.
4. Ejecutar las pruebas y el build. Vite inyecta la version en la interfaz y
   genera `dist/version.json`.
5. Ejecutar el script de despliegue. El preflight rechaza valores no SemVer,
   discrepancias con el paquete y la reutilizacion de la version activa.
6. Confirmar que `/version.json` devuelve el valor esperado sin cache y que la
   portada muestra esa misma version.
7. Registrar version, commit, imagen, entorno y resultado en la TASK, CHANGELOG
   y acta de despliegue.

El manifiesto solo contiene un identificador publico de release; no debe
incluir secretos, variables internas, ramas privadas ni datos del servidor.

## Diagnostico de cliente

La version visible y `https://<host>/version.json` permiten distinguir entre
un defecto funcional y contenido antiguo en navegador, proxy o CDN. El HTML y
el manifiesto se sirven con `no-store`; los assets con hash se sirven como
inmutables porque una nueva compilacion produce nuevas URLs.
