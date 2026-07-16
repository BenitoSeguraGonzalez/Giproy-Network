# Inventario de tamaño frontend clasico

Fecha: 2026-05-25

Modo: GIPROY CLASICO

## Objetivo

Registrar de forma reproducible las superficies frontend grandes antes de cualquier extraccion o modularizacion interna. Este documento evita tocar archivos voluminosos sin evidencia y sin validacion focal.

## Snapshot reproducible

Generado con:

```powershell
.\.venv\Scripts\python.exe tools\ai_tools\frontend_size_inventory.py
```

Salida:

- `docs/frontend_size_inventory.json`

## Totales vigentes

- Archivos fuente escaneados: 219.
- Lineas fuente escaneadas: 120733.
- Bytes fuente escaneados: 6713248.

## Archivos mas grandes

| Archivo | Lineas | Bytes | Riesgo |
|---|---:|---:|---|
| `frontend/src/components/projects/CronogramaGantt.jsx` | 23648 | 1441405 | Muy alto: Gantt, interacciones, reportes, estados densos |
| `frontend/src/pages/Proyectos.jsx` | 5901 | 371797 | Alto: shell principal de proyectos y lazy views |
| `frontend/src/components/projects/Cronogramas.jsx` | 6317 | 365990 | Alto: puente Gantt/Valorado/Caja |
| `frontend/src/pages/MarketplaceAdminDashboard.jsx` | 5408 | 356445 | Alto: Marketplace admin |
| `frontend/src/api/schema.d.ts` | 10412 | 310113 | Generado/contrato; no refactorizar manualmente |
| `frontend/src/pages/Community.jsx` | 3939 | 305009 | Alto: comunidad, moderacion, adjuntos y permisos |
| `frontend/src/pages/APUs.jsx` | 4228 | 262490 | Alto: APUs y edicion de recursos |
| `frontend/src/components/projects/DatosProyecto.jsx` | 2895 | 166752 | Medio-alto: datos de proyecto, mapa y geocodificacion |
| `frontend/src/pages/SellerDashboard.jsx` | 2435 | 162515 | Medio-alto: marketplace vendedor |
| `frontend/src/pages/Marketplace.jsx` | 2570 | 153047 | Medio-alto: marketplace comprador |

## Reglas para siguientes slices

- No dividir `CronogramaGantt.jsx` en bloque.
- No mover rutas ni shells principales como `Proyectos.jsx` sin smoke focal.
- Priorizar extracciones puras, reversibles y sin cambios visuales.
- Si un archivo toca auth, tenant, permisos, pagos, presupuestos, EDT, cronogramas o Marketplace, exigir validacion focal ademas del baseline.
- `schema.d.ts` se considera contrato/generado; no editar manualmente salvo regeneracion controlada.

## Candidatos seguros relativos

1. Documentar contratos internos antes de extraer helpers en archivos grandes.
2. Extraer helpers puros ya aislables solo si no dependen de estado React ni de DOM.
3. Crear smokes focales antes de tocar Gantt, Marketplace admin, Community o APUs.
4. Mantener BIM fuera del alcance.

## No interferencia BIM

- Este inventario no modifica codigo BIM.
- No activa UX BIM.
- No crea dependencias desde la capa clasica hacia BIM.
