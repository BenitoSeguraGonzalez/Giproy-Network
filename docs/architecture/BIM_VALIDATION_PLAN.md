# Plan de Validación BIM - GiProy Network

## 1. Objetivo

Definir el conjunto completo de pruebas requerido para certificar una implantación BIM madura, profesional y utilizable en GiProy. Este documento no ejecuta pruebas; congela la estrategia de validación.

## 2. Niveles de prueba

### A. Smoke Tests

Pruebas rápidas para confirmar salud básica del módulo.

### B. Validación funcional

Pruebas de negocio y navegación real.

### C. Validación de integración

Pruebas de consistencia entre BIM y módulos existentes.

### D. Simulación

Pruebas con datasets y escenarios representativos.

### E. No funcional

Rendimiento, memoria, estabilidad y regresión.

## 3. Smoke Tests mínimos

1. El módulo BIM aparece dentro de `Proyecto`.
2. El viewer abre sin error con proyecto válido.
3. Un modelo se puede cargar.
4. La selección de elemento funciona.
5. El panel de propiedades responde.
6. El árbol BIM carga.
7. La versión activa se reconoce.
8. No hay error fatal al cerrar o reabrir el módulo.

## 4. Validación funcional obligatoria

### Viewer y modelo

1. Importar modelo IFC.
2. Registrar versión del modelo.
3. Activar versión vigente.
4. Visualizar modelo.
5. Seleccionar elementos.
6. Aislar y mostrar nuevamente.
7. Filtrar por storey.
8. Consultar propiedades.

### Vínculo con EDT

1. Vincular elemento BIM a nodo EDT.
2. Navegar desde viewer a EDT.
3. Navegar desde EDT a viewer.
4. Validar persistencia del vínculo.

### Vínculo con APU

1. Vincular elemento BIM a APU.
2. Navegar desde viewer a APU.
3. Navegar desde APU a viewer.
4. Validar persistencia del vínculo.

### Vínculo con Presupuesto

1. Vincular elemento BIM a línea/capítulo de presupuesto.
2. Navegar desde viewer a presupuesto.
3. Navegar desde presupuesto a viewer.
4. Validar persistencia del vínculo.

## 5. Simulación obligatoria

### Dataset S1

- proyecto pequeño
- 1 IFC simple
- 3 storeys
- < 5k elementos

### Dataset S2

- proyecto medio
- 1 modelo constructivo realista
- 10k a 50k elementos
- 10+ vínculos con `EDT/APUs`

### Dataset S3

- proyecto grande
- múltiples versiones de modelo
- navegación y filtros intensivos

### Escenarios simulados

1. Cambio de versión de modelo.
2. Cambio de base activa.
3. Cambio de revisión de proyecto.
4. Vínculos múltiples por elemento.
5. Elementos sin vínculo.
6. EDT con vínculo sin modelo activo.
7. Presupuesto con línea vinculada y modelo actualizado.

## 6. Validación de rendimiento

### Métricas a registrar

- tiempo de carga inicial
- tiempo de apertura de proyecto con pestaña BIM
- tiempo de selección
- tiempo de filtrado por storey
- consumo de memoria del navegador
- FPS aproximado en navegación

### Criterios mínimos de aceptación

- apertura razonable del módulo sin bloqueo total de UI
- interacción fluida en dataset medio
- degradación controlada en dataset grande

## 7. Validación de estabilidad

1. Abrir/cerrar viewer repetidamente.
2. Cambiar de pestañas del proyecto.
3. Cambiar entre versiones del modelo.
4. Reabrir un proyecto con viewer ya persistido.
5. Cambiar de empresa/proyecto y confirmar limpieza de contexto.

## 8. Validación de permisos

1. Usuario sin permiso BIM no accede.
2. Usuario con permiso de consulta no puede mutar vínculos.
3. Usuario con permiso de edición sí puede crear vínculos.
4. Multiempresa respeta aislamiento.

## 9. Smoke suite operativa recomendada

- `BIM-SMOKE-001`: abrir módulo BIM
- `BIM-SMOKE-002`: cargar modelo vigente
- `BIM-SMOKE-003`: seleccionar elemento
- `BIM-SMOKE-004`: abrir propiedades
- `BIM-SMOKE-005`: saltar a EDT
- `BIM-SMOKE-006`: volver al viewer

## 10. Certificación interna

No puede declararse “100% funcional” si falla cualquiera de estos grupos:

- smoke
- viewer básico
- vínculos EDT
- vínculos APUs
- vínculos Presupuesto
- versionado
- permisos
- estabilidad

## 11. Artefactos de cierre esperados

- matriz de pruebas ejecutadas
- incidencias encontradas
- incidencias corregidas
- evidencias visuales
- datasets usados
- criterio final de liberación

## 12. Trazabilidad documental paralela

Toda validacion BIM debe quedar asociada a una TASK del carril
`docs/tasks/bim` con ID `BIM-TASK-*`.

Las evidencias de smoke, simulacion, permisos, rendimiento y estabilidad deben
referenciarse desde la TASK BIM correspondiente y, cuando agreguen nuevos
artefactos permanentes, enlazarse tambien desde `BIM_INDEX.md`.
