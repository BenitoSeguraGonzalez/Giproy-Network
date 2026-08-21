# Plan: visor IFC BIM sin bloqueo del navegador

## Alcance

- Aislar la conversión `source_ifc` a `fragments` en un Web Worker del perímetro BIM.
- Conservar la carga directa de artefactos `fragments` sin cambios.
- Mantener el desmontaje del visor mientras está abierto el panel de importación.
- Añadir una guarda focal y verificar build, smoke BIM y lint del perímetro cambiado.

## Criterios verificables

1. `BimFragmentsViewport` no ejecuta `IfcImporter.process` en el hilo principal.
2. La conversión fuente se puede cancelar al cambiar de versión o desmontar el componente.
3. El canvas Fragments sigue montándose cuando la conversión termina correctamente.
4. Un fallo del worker muestra error dentro del panel BIM y no bloquea el shell clásico.
5. La ruta de artefacto `fragments` registrada conserva su comportamiento actual.

## Secuencia

1. Añadir smoke contractual inicialmente fallido.
2. Implementar worker y adaptador de conversión cancelable.
3. Ajustar estados visibles de carga/error sin modificar contratos clásicos.
4. Ejecutar smoke, build, lint focal y revisar diff/documentación.
