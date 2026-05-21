## Objetivo

Corregir el catálogo de `APUs Anidadas` en `Análisis de Precios Unitarios (APU)` para que muestre todas las subcategorías pertenecientes a la categoría base `APU` (`subcategoria_codigo = 5`), sin limitarse a la subcategoría actualmente editada, manteniendo además la regla anti-ciclo tanto en frontend como en backend.

## Estado actual

- El módulo principal de APUs carga todas las subcategorías Cat 5 en `frontend/src/pages/APUs.jsx`.
- Sin embargo, el catálogo lateral del editor reutiliza el estado `apus`, que se obtiene con `apusApi.getAll(...)` filtrado por `selectedSubcatId`.
- Como consecuencia, dentro de `Recursos Disponibles > Análisis de Precios Unitarios`, solo aparecen los APUs de la subcategoría seleccionada del APU padre.
- La regla anti-ciclo existe en backend al guardar (`check_circular_reference` en `backend/app/services/apu.py`), pero el catálogo de selección no expone ni filtra candidatos inválidos antes de agregarlos.

## Causa raíz

La lista del catálogo izquierdo y la lista del módulo principal comparten la misma fuente de datos (`apus`) aunque sus necesidades son distintas:

- Vista principal: sí debe poder trabajar por subcategoría seleccionada.
- Editor de APU: necesita catálogo global de APUs Cat 5 de la base activa.

Además, la validación anti-ciclo está concentrada en el guardado final, no en la construcción del catálogo de candidatos.

## Diseño propuesto

### 1. Separar fuentes de datos

Introducir una colección específica para el editor, por ejemplo:

- `nestedApusCatalog`

Esta colección debe:

- traer todos los APUs de la base activa y revisión activa
- no filtrar por `selectedSubcatId`
- seguir agrupándose por todas las subcategorías Cat 5 existentes

La lista principal del módulo seguirá usando `apus` filtrado por subcategoría para no romper la UX existente.

### 2. Anti-ciclo en dos capas

#### Backend

Mantener y endurecer la validación actual:

- un APU no puede contenerse a sí mismo
- un APU no puede contener un APU que ya lo contenga directa o indirectamente

Añadir una rutina reusable para exponer candidatos válidos o marcar exclusiones, en vez de depender solo del error al guardar.

#### Frontend

El catálogo del editor debe:

- excluir el propio APU en edición
- excluir APUs que producirían ciclo
- opcionalmente mostrarlos deshabilitados con motivo en vez de ocultarlos por completo

La recomendación es:

- ocultar el propio APU
- mostrar deshabilitados los APU bloqueados por ciclo con tooltip o motivo breve

Así el usuario entiende por qué ciertos APUs no son insertables.

### 3. Agrupamiento correcto

Para la categoría `5`, el agrupamiento del catálogo izquierdo debe construirse contra:

- todas las subcategorías Cat 5 de la base
- todos los APUs disponibles del catálogo global del editor

No contra la lista `apus` filtrada por subcategoría.

### 4. Protección de regresión

No se debe romper:

- la lista principal de APUs por subcategoría
- el cálculo de costos del editor
- el guardado actual
- la prevención de ciclos en backend
- la lógica de revisión/base activa

## Fases

### Fase 1. Diagnóstico estructural y separación de fuentes

- desacoplar `apus` de `nestedApusCatalog`
- mantener la lista principal actual intacta

### Fase 2. Resolver catálogo global de APUs anidados

- obtener todos los APUs Cat 5 de la base/revisión activa
- agruparlos por todas las subcategorías Cat 5

### Fase 3. Endurecer anti-ciclo

- exponer helper backend para detectar candidatos inválidos
- consumirlo o replicar lectura segura en frontend para marcar exclusiones

### Fase 4. UX del editor

- mostrar todas las subcategorías APU
- ocultar o deshabilitar candidatos inválidos
- explicar por qué un APU no puede añadirse

### Fase 5. Validación integral

- edición de APU con subcategorías distintas
- inserción válida entre subcategorías distintas
- intento de auto-referencia
- intento de ciclo indirecto

## Riesgos

- mezclar de nuevo la lista principal con el catálogo del editor
- permitir ciclos si frontend y backend divergen
- romper rendimiento si se carga el detalle completo de todos los APUs sin necesidad

## Mitigación

- usar un estado separado para el catálogo del editor
- mantener backend como fuente final de verdad anti-ciclo
- si hace falta, exponer un endpoint ligero para candidatos de APUs anidados
- no cargar detalles completos de líneas salvo que el cálculo de ciclo lo requiera

## Validaciones objetivo

- en el editor, `APUs Anidadas` muestra todas las subcategorías Cat 5 de la base activa
- aparecen APUs de subcategorías distintas a la del APU padre
- el propio APU no puede añadirse
- un APU que generaría ciclo no puede añadirse
- el backend sigue rechazando cualquier ciclo si el frontend intentara forzarlo
- la lista principal del módulo continúa filtrando por la subcategoría seleccionada
