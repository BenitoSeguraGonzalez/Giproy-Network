# Plan Maestro BIM - GiProy Network

## 1. Propósito

Definir una hoja de ruta completa para incorporar una capa BIM madura, profesional y operativa en GiProy Network. Este documento congela la arquitectura objetivo, las fases, los módulos, las entidades, las integraciones y la estrategia de validación.

Estado actualizado 2026-07-01: el programa BIM ya no esta solo en planificacion. Existe una incubacion funcional parcial en codigo, documentada en `BIM_CODE_STATE.md`. Este plan sigue siendo la referencia de madurez objetivo, pero el punto de partida real debe leerse desde ese estado de codigo.

## 2. Decisión tecnológica congelada

### Stack BIM recomendado

- `three.js`
- `web-ifc`
- `@thatopen/components`
- `@thatopen/components-front`
- `@thatopen/fragments` / `engine_fragment`

### Motivo de selección

Esta combinación ofrece el mejor equilibrio entre:

- licencias abiertas utilizables sin coste de licencia de producto
- encaje con `React + Vite`
- libertad para construir una capa BIM propia, profundamente integrada con `EDT`, `APUs` y `Presupuesto`
- soporte técnico razonable para una evolución por fases

### Fuentes oficiales de referencia

- Three.js: `MIT`
  - https://github.com/mrdoob/three.js
  - https://threejs.org/docs/
- That Open Components: `MIT`
  - https://github.com/ThatOpen/engine_components
- That Open Fragments: `MIT`
  - https://github.com/ThatOpen/engine_fragment
- web-ifc: `MPL-2.0`
  - https://github.com/ThatOpen/engine_web-ifc
  - https://thatopen.github.io/engine_web-ifc/docs/

### Alternativas descartadas como base principal

- `xeokit / xeokit-bim-viewer`
  - motivo: `AGPLv3` / licencia comercial para uso propietario
  - fuente: https://github.com/xeokit/xeokit-sdk
- `web-ifc-three`
  - motivo: biblioteca oficialmente marcada como `deprecated`
  - fuente: https://github.com/ThatOpen/web-ifc-three

## 3. Diagnóstico de adecuación de GiProy

### Fortalezas existentes

- Shell de proyecto madura y modular en `frontend/src/pages/Proyectos.jsx`
- Dominio fuerte y valioso para BIM:
  - `EDT`
  - `Presupuesto`
  - `APUs`
  - `Cronogramas`
  - `Desagregación`
  - `Fórmula Polinómica`
- Backend FastAPI + PostgreSQL adecuado para versionado, metadata y vínculos

### Estado real actual

- Existe dominio BIM backend aislado con modelos, schemas, servicios y endpoints.
- Existen clientes API, hooks y componentes frontend BIM en perimetros dedicados.
- La experiencia BIM visible en `Proyectos` permanece apagada mediante `CLASSIC_BIM_ACCESS_DISABLED`.
- Existen links BIM latentes hacia `EDT`, `APUs` y `Presupuesto`, pero no navegacion clasica visible habilitada.
- Existe importacion JSON para incubacion, no importacion IFC madura.
- Existe viewer tecnico/demostrativo 2D y una fundacion local 3D con Three.js
  sobre el stack BIM/3D autorizado; no aun viewer IFC maduro con parsing
  semantico, fragments ni artefactos optimizados.
- La persistencia principal BIM ya cuenta con migracion Alembic inicial; queda pendiente validar su aplicacion local y reducir fallbacks runtime `checkfirst` desde servicios.

### Huecos actuales para madurez

- No existe viewer IFC maduro; ya hay parsing semantico inicial, fragments
  cargados en harness aislado y faltan datasets reales/representativos.
- Las dependencias BIM/3D ya estan activas en frontend como fundacion local,
  pero falta integrarlas al pipeline IFC real.
- Falta validar en DB local la migracion Alembic principal BIM y decidir la retirada o reduccion de creacion runtime `checkfirst`.
- Existe pipeline IFC inicial con manifiesto, storage, checksum, parsing
  semantico y artefacto viewer JSON; falta madurez con datasets reales,
  fragments de produccion y simulaciones de volumen.
- No existe navegacion cruzada visible con modulos clasicos bajo TASK de integracion controlada.
- Existe smoke suite BIM parcial; falta suite completa con datasets reales,
  rendimiento y viewer 3D maduro.

## 3.1 Estrategia de convivencia congelada

La implantación BIM no se hará como sustitución de `GiProy Clásico`, sino como capa paralela.

La estrategia oficial queda fijada así:

- backend único y común
- dominio BIM aislado dentro del backend
- frontend BIM desacoplado dentro del mismo frontend del producto
- activación mediante `feature flags`
- integración visible solo cuando la capa BIM sea madura

Se descarta explícitamente:

- crear un backend BIM separado
- construir un producto BIM completamente ajeno a la shell de GiProy
- mezclar de forma temprana las interacciones BIM en `EDT`, `APUs` o `Presupuesto`

## 4. Objetivo funcional de la capa BIM madura

La capa BIM madura de GiProy debe permitir:

1. Cargar y versionar modelos BIM por empresa, base y proyecto.
2. Visualizar modelos con navegación fluida y estructura semántica.
3. Consultar propiedades y clasificación de elementos.
4. Navegar por niveles, disciplinas, sistemas y grupos.
5. Vincular elementos BIM con:
   - `EDT`
   - `APUs`
   - líneas o agrupaciones de `Presupuesto`
6. Propagar navegación cruzada:
   - desde viewer al negocio
   - desde negocio al viewer
7. Persistir vistas, estados y configuraciones del viewer.
8. Soportar versionado de modelos y gobernanza operativa.

## 5. Alcance de madurez objetivo

### Incluido en la visión madura

- Importación IFC
- Conversión/preparación para visualización eficiente
- Árbol BIM
- Propiedades
- Selección y resaltado
- Aislamiento por conjuntos
- Niveles / storeys
- Vistas persistidas
- Vínculos con `EDT/APUs/Presupuesto`
- Navegación bidireccional negocio-modelo
- Permisos y auditoría básica

### Fuera del alcance inicial

- Authoring geométrico BIM
- Edición de geometría IFC
- Detección avanzada de colisiones
- CDE documental completo
- BCF colaborativo completo en la primera ola

## 6. Fases de implantación

### Fase 0 - Fundaciones y gobierno

- validar licencias y política interna
- introducir el dominio BIM en arquitectura
- preparar storage, versionado y estados

### Fase 1 - Viewer base

- pestaña BIM dentro de `Proyecto`
- carga de modelo
- render, selección y propiedades
- árbol semántico básico

### Fase 2 - Estructura BIM operativa

- niveles
- clasificación por tipos
- filtros básicos
- estados persistidos del viewer

### Fase 3 - Integración negocio

- vínculos BIM <-> `EDT`
- vínculos BIM <-> `APUs`
- navegación cruzada

### Fase 4 - Integración presupuestaria

- vínculos BIM <-> `Presupuesto`
- navegación visual de líneas presupuestarias
- resaltado de elementos y grupos

### Fase 5 - Madurez de producción

- versionado robusto
- rendimiento
- auditoría
- operaciones
- pruebas reales
- documentación y rollout

## 7. Criterios de madurez

Una capa BIM se considerará madura cuando cumpla simultáneamente:

- modelos medianos/grandes se visualizan con estabilidad
- el viewer se integra en la shell actual de `Proyecto`
- existe persistencia de modelos, versiones y estados
- existen vínculos reales y útiles con `EDT`, `APUs` y `Presupuesto`
- la navegación cruzada funciona en ambos sentidos
- existe batería de pruebas funcionales, smoke y simulación
- existe trazabilidad operativa y criterio de rollback

## 8. Módulos y dominios nuevos requeridos

### Backend

- `backend/app/models/bim_model.py`
- `backend/app/models/bim_model_version.py`
- `backend/app/models/bim_element.py`
- `backend/app/models/bim_storey.py`
- `backend/app/models/bim_view_state.py`
- `backend/app/models/bim_link_edt.py`
- `backend/app/models/bim_link_apu.py`
- `backend/app/models/bim_link_presupuesto.py`
- `backend/app/services/bim/`
- `backend/app/api/endpoints/bim_models.py`
- `backend/app/api/endpoints/bim_links.py`

### Frontend

- `frontend/src/components/projects/BimTab.jsx`
- `frontend/src/components/bim/`
- `frontend/src/hooks/bim/`
- `frontend/src/api/bimModels.js`
- `frontend/src/api/bimLinks.js`
- `frontend/src/context/BimViewerContext.jsx`
- `frontend/src/features/bim/` como perímetro lógico opcional si la implantación crece

### Infraestructura lógica

- almacenamiento de archivos fuente IFC
- almacenamiento de artefactos optimizados
- estados persistidos del viewer por usuario/proyecto

## 9. Integraciones obligatorias

- `Proyecto` como host principal del módulo
- `EDT`
- `APUs`
- `Presupuesto`
- `Cronogramas` opcional en segunda ola
- `Desagregación` opcional en segunda ola

## 10. Restricciones

- No forzar una segunda shell visual fuera de `Proyecto`
- No romper el patrón actual de navegación por módulos
- No mezclar BIM con Marketplace en la primera ola
- No introducir dependencias con licencia ambigua o copyleft fuerte no aceptado
- No introducir divergencia visual entre la shell BIM y la identidad actual de GiProy
- No hacer que `GiProy Clásico` dependa funcionalmente de BIM durante la incubación
- No activar navegación cruzada visible en módulos clásicos hasta pasar gates de madurez BIM

## 11. Entregables documentales de esta planificación

- `docs/architecture/BIM_INDEX.md`
- `docs/architecture/BIM_CODE_STATE.md`
- `docs/architecture/BIM_MASTER_PLAN.md`
- `docs/architecture/BIM_CONCEPT_MAP.md`
- `docs/architecture/BIM_INSERTION_MAP.md`
- `docs/architecture/BIM_VALIDATION_PLAN.md`
- `docs/architecture/BIM_EXECUTION_ROADMAP.md`
- `docs/architecture/BIM_PARALLEL_IMPLEMENTATION_STRATEGY.md`
- `docs/tasks/bim/BIM_TASK_INDEX.md`
- `docs/tasks/bim/BIM-TASK-0000.md` a `BIM-TASK-0014.md`

Las TASK historicas `TASK-0545` a `TASK-0559` quedan como planificacion legacy
previa a la separacion documental del carril BIM.
