# GiProy Project Bridge

Bridge local para Windows que permite a la web de GiProy:

- detectar Microsoft Project en la máquina final;
- comprobar si la sesión interactiva puede automatizarlo;
- abrir un cronograma MSPDI/XML en Microsoft Project y guardar el `.mpp`.

## Instalación

Ejecuta:

```powershell
powershell -ExecutionPolicy Bypass -File .\install_bridge.ps1
```

Esto:

- copia el bridge a `%LOCALAPPDATA%\GiProyProjectBridge`
- registra la tarea programada `GiProy Project Bridge`
- la arranca al iniciar sesión de Windows

## Endpoints localhost

- `GET http://127.0.0.1:45731/health`
- `GET http://127.0.0.1:45731/status`
- `POST http://127.0.0.1:45731/open-msproject-from-xml`

## Seguridad

El bridge escucha solo en `127.0.0.1` / `localhost`.
