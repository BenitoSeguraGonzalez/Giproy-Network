# GiProy Control Center (Windows)

Launcher GUI para operar GiProy en entorno Windows.

## Funciones

- Estado de servicios Backend/Frontend.
- Estado de puertos (3001 / 3010 / 8080).
- Iniciar, parar y borrar servicios con elevacion UAC.
- Monitoreo en tiempo real:
  - CPU, RAM, Disco, Red
  - clientes conectados al backend
  - actividad de autenticacion reciente (login OK/FAIL e IPs)
  - metricas de proceso backend/frontend (CPU, RAM, hilos, uptime)
- Salud API por modulos con latencia.
- Alertas de log (ERROR/WARN en ventana reciente).
- Alertas operativas por umbral (CPU/RAM/Disco/latencia p95).
- Configuracion persistente de refresco y umbrales (`.runtime/launcher_settings.json`).
- Modo NOC (solo lectura) para operacion segura.
- Historial de alertas persistido en `.runtime/monitor/alerts.jsonl`.
- Snapshots de metricas en `.runtime/monitor/metrics.jsonl` y export CSV desde UI.
- Export JSON de alertas desde UI.
- Filtros de alertas por severidad y texto.
- KPI operativos: disponibilidad API en ventana y estado OpenAPI.
- KPI de endpoint mas inestable (pondera 5xx sobre 4xx).
- Limpieza controlada de historico de monitor desde UI.
- Tendencias ASCII para CPU/RAM/p95 API.
- Columna SLA por endpoint en salud API.
- Reglas configurables por endpoint: SLA minimo y p95 maximo.
- Export de reporte ejecutivo (JSON + HTML).
- Exportacion de diagnostico en ZIP.
- Visor integrado de logs:
  - `.runtime/logs/backend-service.log`
  - `.runtime/logs/frontend-service.log`
  - `.runtime/logs/launcher.log`

## Ejecutar

```bat
tools\launcher\scripts\run_launcher.bat
```

## Validar (sin empaquetar .exe)

```powershell
powershell -ExecutionPolicy Bypass -File tools\launcher\scripts\validate_launcher.ps1
```

Sin tests:

```powershell
powershell -ExecutionPolicy Bypass -File tools\launcher\scripts\validate_launcher.ps1 -WithTests:$false
```

## Dependencias

- Python (.venv del proyecto)
- PySide6
- psutil

Instalacion automatica incluida en `run_launcher.bat`.
