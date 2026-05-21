# Cronograma Trabajo MS Project Auto Open

## Objetivo
Hacer que la exportación `.mpp` del `Cronograma de Trabajo` intente abrir automáticamente Microsoft Project con el archivo recién generado cuando la instancia backend dispone de una sesión COM interactiva válida.

## Alcance
- Añadir soporte `open_after_export` al endpoint de exportación.
- Mantener la descarga del archivo para el usuario.
- Abrir la instancia de `MS Project` y dejar visible el `.mpp` generado.
- No romper el fallback honesto a `XML` cuando no existe sesión COM utilizable.

## Resultado
- El frontend solicita `open_after_export=true` al pedir `.mpp`.
- El backend genera el `.mpp`, lo deja en una ruta temporal persistente y mantiene Microsoft Project abierto con el archivo cargado.
- Si la instancia no puede usar COM, la UI conserva el diagnóstico visible y el fallback `XML`.
