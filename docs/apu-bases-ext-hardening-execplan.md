# ExecPlan: Endurecimiento de "Bases ext." en APUs

## Objetivo funcional
Cerrar correctamente la importación `Bases ext.` en `Análisis de Precios Unitarios` para que funcione de forma consistente con los dos tipos de base del sistema:

- `Base Maestra`: no usa revisión operativa
- `Base de Proyecto`: sí usa revisión efectiva

La importación debe:
- respetar revisión origen y destino
- resolver conflictos con datos completos
- evitar mapeos ambiguos de subcategorías
- presentar solo orígenes coherentes con el contexto de la base destino

## Estado actual
- El flujo UI de `Bases ext.` existe y permite seleccionar base origen, APUs y resolver conflictos.
- Backend soporta importación recursiva con `dry_run`, `skip` y `overwrite`.
- La implementación actual opera de facto con `revision=0`, porque el contrato no envía ni declara revisión.
- El payload de conflictos no incluye fecha, aunque el frontend la consume.
- La resolución de subcategorías se basa solo en descripción, con riesgo de emparejamiento ambiguo.

## Diseño propuesto
### Revisión efectiva
- Si la base origen es `Base Maestra`, `source_revision = 0`
- Si la base origen es `Base de Proyecto`, `source_revision = revision` de esa base
- Si la base destino es `Base Maestra`, `target_revision = 0`
- Si la base destino es `Base de Proyecto`, `target_revision = revision` de la base activa

### Selector de bases origen
- Si la base destino es `Base Maestra`, solo se ofrecerán bases maestras.
- Si la base destino es `Base de Proyecto`, se permitirán bases maestras y bases de proyecto de la misma empresa.
- La UI mostrará tipo y revisión contextual del origen.

### Conflictos
- El backend devolverá `fecha` en origen y destino usando `ultima_modificacion` o `fecha_creacion`.
- La autodecisión del frontend usará ese dato real.

### Subcategorías
- La resolución de subcategorías en destino priorizará:
  1. `subcategoria_codigo + descripcion`
  2. `subcategoria_codigo`
  3. creación nueva si no existe coincidencia segura

## Fases
1. Formalizar contrato `source_revision/target_revision`
2. Ajustar carga de catálogo origen por revisión efectiva
3. Endurecer servicio backend y payload de conflictos
4. Endurecer resolución de subcategorías
5. Filtrar selector de bases origen por contexto
6. Validar build y flujo funcional

## Riesgos
- Importar desde revisión incorrecta en bases de proyecto
- Reusar subcategoría errónea por coincidencia de descripción
- Exponer orígenes no deseados al importar hacia bases maestras

## Mitigación
- Revisión explícita en contrato API
- Resolución determinista de subcategorías
- Filtro conservador para bases maestras

## Validación
- Importar desde base maestra hacia base maestra
- Importar desde base maestra hacia base de proyecto
- Importar desde base de proyecto hacia base de proyecto
- Autodecisión de conflictos con fechas reales
- Sin regresión en `dry_run`, `skip` y `overwrite`
