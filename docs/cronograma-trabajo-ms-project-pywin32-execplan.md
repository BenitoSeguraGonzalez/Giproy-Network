# Cronograma De Trabajo - Pywin32 MS Project Export ExecPlan

## Objetivo
Convertir la exportación directa `.mpp` de `Cronograma de Trabajo` en un carril premium real y mantenible, apoyado en `pywin32` y automatización COM de Microsoft Project, manteniendo XML como salida universal.

## Diagnóstico
- El módulo ya exportaba XML interoperable y negociaba capacidades del entorno.
- La primera ruta `.mpp` directa se apoyó en PowerShell embebido para automatizar `MSProject.Application`.
- Ese enfoque era válido como prueba, pero poco limpio para mantenimiento backend y con menor control desde Python.
- En este entorno Windows ya existe Microsoft Project instalado y plantilla `.mpp` disponible.

## Enfoque
1. Formalizar el slice `.mpp` premium dentro del plan general de `Cronograma de Trabajo`.
2. Añadir `pywin32` como dependencia condicional de Windows.
3. Detectar de forma honesta:
   - Windows
   - presencia de `WINPROJ.EXE`
   - plantilla `.mpp`
   - disponibilidad de `win32com`
4. Reemplazar la automatización PowerShell por COM directo desde Python.
5. Mantener XML como fallback universal cuando `.mpp` no sea viable.

## Resultado esperado
- La UI puede habilitar `.mpp` con base en capacidades reales.
- El backend produce `.mpp` real mediante Microsoft Project y `pywin32`.
- El carril premium queda mejor alineado con la evolución del módulo y con la plantilla `.mpp`.
