# ExecPlan: Reparación de Clonación de Base al Crear Proyecto

## 1. Objetivo funcional
Garantizar que la `Base de Proyecto` creada desde una `Base Maestra` quede en un estado auditable, consistente y recuperable, de forma que:

- el proyecto nazca con una foto completa de su base origen;
- la relación entre `Base Maestra` y `Base de Proyecto` quede trazada explícitamente;
- las divergencias posteriores puedan diagnosticarse y, cuando proceda, sincronizarse o repararse;
- los proyectos ya existentes con bases desalineadas puedan sanearse sin romper presupuestos ni ediciones propias.

## 2. Estado actual del sistema

### Flujo de creación
La creación del proyecto ocurre en [backend/app/services/proyecto.py](e:/Repositorios/GiProy%20Network/backend/app/services/proyecto.py):

1. Se genera el código del proyecto.
2. Si `source_base_id` viene informado, se crea una `Base de Proyecto`.
3. Esa base nueva se crea vía [backend/app/repositories/base_trabajo.py](e:/Repositorios/GiProy%20Network/backend/app/repositories/base_trabajo.py).
4. La clonación profunda actual copia:
   - `subcategorias_items`
   - `recursos`
   - `apus`
   - `apu_lineas`
5. Después se crea el encabezado del proyecto y se inicializa el presupuesto.

### Limitaciones estructurales detectadas
- `bases_trabajo` no guarda `source_base_id`.
- No existe `cloned_at`, `last_sync_at`, `sync_mode` ni snapshot de conteos.
- La clonación es una foto muda: una vez creada la base de proyecto, el sistema ya no sabe de qué base vino ni cómo compararla.
- El frontend del presupuesto en:
  - [frontend/src/components/presupuestos/CatalogoApuTab.jsx](e:/Repositorios/GiProy%20Network/frontend/src/components/presupuestos/CatalogoApuTab.jsx)
  - [frontend/src/components/presupuestos/ApuBudgetEditor.jsx](e:/Repositorios/GiProy%20Network/frontend/src/components/presupuestos/ApuBudgetEditor.jsx)
  
  hace fallback silencioso cuando no encuentra contenido en la revisión pedida. Eso reduce visibilidad del problema real.

## 3. Hallazgos reales en datos

Se auditó la empresa `Santiago Bermeo` (`empresa_id = 3`) y el proyecto:

- Proyecto: `Proyecto Prueba Compartir 1`
- `proyecto_id = 7`
- `codigo = SantiagoBermeo-2026-001`
- Fecha de creación del proyecto: `2026-03-16 17:04`
- Base de proyecto: `base_trabajo_id = 34`
- Base maestra origen analizada: `base_trabajo_id = 32` (`Base Vivienda con Losa Cimentación`)

### Diferencias actuales entre base 32 y base 34
- Base 32:
  - `70` subcategorías
  - `211` recursos
  - `50` APUs
- Base 34:
  - `70` subcategorías
  - `209` recursos
  - `34` APUs

### Diferencias clasificadas

#### Grupo A: altas posteriores a la creación del proyecto
Se detectaron `16` APUs y `2` recursos presentes en la base maestra pero ausentes en la base del proyecto. Todos fueron creados después del `2026-03-16`, es decir, después de crear el proyecto.

Eso indica que, al menos para esos registros, no estamos ante una clonación fallida inicial sino ante ausencia de mecanismo de sincronización posterior.

Ejemplos:
- `5-003-0003`
- `5-003-0004`
- `5-004-0002`
- `5-005-0002`
- `5-010-0002`
- recurso `1-0003-00005`
- recurso `2-0003-00002`

#### Grupo B: APUs comunes con deriva entre base maestra y base del proyecto
Se detectaron `10` APUs con mismo código en ambas bases pero distinto estado funcional.

Casos relevantes:
- `5-005-0001`
- `5-006-0001`
- `5-007-0001`
- `5-008-0001`
- `5-009-0001`
- `5-010-0001`

En la base de proyecto esos APUs existen pero con:
- `0` líneas
- `costo_directo = 0`
- `precio_unitario_total = 0`

Mientras que en la base maestra actual sí tienen líneas y costos.

### Conclusión técnica de los hallazgos
No hay una sola causa:

1. Hay divergencia normal de snapshot:
   la base maestra siguió evolucionando después de crear el proyecto.

2. Hay divergencia funcional no trazada:
   algunos APUs que hoy están completos en la base maestra aparecen vacíos en la base del proyecto.

La explicación más probable es que esos APUs existían como cabeceras cuando se clonó el proyecto y luego fueron completados en la base maestra, o que hubo ediciones posteriores no propagadas. Como no existe trazabilidad de origen/snapshot, hoy el sistema no puede distinguirlo formalmente.

## 4. Diseño propuesto

### Principio
La `Base de Proyecto` debe comportarse como un snapshot controlado, no como una copia huérfana.

### Cambios de modelo
Añadir trazabilidad de clonación a `bases_trabajo`:

- `source_base_id`
- `cloned_from_project_id` opcional
- `clone_created_at`
- `sync_mode`
  - `snapshot_locked`
  - `manual_sync`
  - `follow_source`
- `last_reconciled_at`
- `snapshot_subcategories_count`
- `snapshot_resources_count`
- `snapshot_apus_count`

### Cambios de servicio
Crear un servicio de reconciliación que compare `Base Maestra` vs `Base de Proyecto` y clasifique:

- faltantes
- divergencias de cabecera
- divergencias de detalle
- APUs vacíos en proyecto pero completos en origen
- recursos faltantes que bloquean APUs

### Cambios operativos
No hacer sobrescritura ciega.

La reparación debe tener tres modos:
- `dry-run`
- `sync_missing_only`
- `repair_empty_apus`

La sobrescritura de APUs ya editados en la base de proyecto debe requerir una acción explícita posterior; no debe entrar en la reparación automática inicial.

## 5. Fases de implementación

### Fase 1. Trazabilidad
- Persistir relación de origen entre base maestra y base de proyecto.
- Guardar snapshot inicial de conteos.

### Fase 2. Diagnóstico
- Implementar comparador backend.
- Exponer diagnóstico por API o script administrativo.

### Fase 3. Reparación de datos existentes
- Detectar bases de proyecto sin trazabilidad.
- Inferir su base origen cuando sea seguro.
- Aplicar sincronización de faltantes.
- Reparar APUs vacíos solo si no tienen señales de edición local.

### Fase 4. Hardening del frontend
- El presupuesto no debe ocultar la inconsistencia con fallback silencioso sin marcarla.
- Debe avisar si la base del proyecto está desalineada o incompleta.

## 6. Riesgos y mitigación

### Riesgo 1
Sobrescribir APUs editados específicamente para un proyecto.

Mitigación:
- fase inicial solo `missing_only` + `empty_apus_only`
- no sobrescribir APUs con líneas locales o costos no nulos sin confirmación posterior

### Riesgo 2
Inferir mal la base origen en proyectos históricos.

Mitigación:
- solo inferir automáticamente si hay match fuerte por:
  - empresa
  - nombre esperado
  - fecha
  - mayor similitud de estructura
- si no, dejar el caso en revisión manual

### Riesgo 3
Romper presupuestos operativos ya vinculados.

Mitigación:
- no tocar `presupuesto_detalle`
- la reparación se limita a completar maestros de la base del proyecto
- recalcular APUs reparados antes de exponerlos

## 7. Validaciones

### Validación de código
- Crear proyecto nuevo desde base maestra y verificar conteos snapshot.
- Completar base maestra después y validar que el proyecto no cambie solo.
- Ejecutar reconciliación `dry-run` y verificar diferencias esperadas.

### Validación de datos
Para `Santiago Bermeo`:
- base 34 debe recuperar al menos los `16` APUs faltantes y `2` recursos faltantes detectados.
- los APUs vacíos deben quedar clasificados en reporte como `repair_empty_apus`.

### Validación funcional
- el catálogo de APUs del presupuesto debe mostrar exactamente los APUs de la base del proyecto.
- si la base del proyecto está desalineada, debe poder diagnosticarse sin revisar SQL manualmente.

## 8. Resultado esperado
Al finalizar:

- el sistema sabrá de qué base viene cada `Base de Proyecto`;
- las diferencias entre origen y proyecto serán auditables;
- los datos ya creados podrán sanearse de forma controlada;
- se eliminará la ambigüedad actual entre “clonación fallida” y “base maestra evolucionada después”.
