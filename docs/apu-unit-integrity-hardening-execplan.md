# APU Unit Integrity Hardening Execplan

## Objetivo
Eliminar contaminación entre catálogos de unidades en los editores APU y endurecer el dominio para que un APU solo se guarde con una unidad válida del catálogo APU de su base activa.

## Alcance
- Editor maestro de `APUs`.
- Editor de APU desde `Presupuesto`.
- Servicio backend de creación/actualización de APUs.
- Validación automatizada para evitar regresiones.

## Decisiones
- Las unidades del APU y las unidades del modal de recurso deben vivir en estados separados.
- El APU seguirá persistiendo `unidad` como string por compatibilidad, pero el valor se resolverá y validará contra el catálogo APU (`subcategoria_codigo = 5`) de la base activa.
- La unidad mostrada/guardada debe salir de helpers comunes de resolución, no de búsquedas ad hoc.

## Resultado esperado
- Cancelar o guardar un recurso ya no puede alterar la unidad seleccionada del APU.
- Crear/editar APUs con unidades inexistentes en el catálogo APU queda bloqueado desde backend.
- Los dos editores APU usan una regla homogénea para resolver unidad visible y unidad persistida.
