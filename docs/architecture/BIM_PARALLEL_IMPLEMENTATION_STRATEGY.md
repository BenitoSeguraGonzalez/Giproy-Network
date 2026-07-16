# Estrategia de Implementación Paralela BIM - GiProy Network

## 1. Objetivo

Definir la forma correcta de desarrollar la nueva capa BIM en paralelo a `GiProy Clásico`, manteniendo independencia operativa durante la incubación y preparando una integración final limpia, sin ruptura visual ni funcional.

## 2. Principio rector

La implantación BIM debe seguir el modelo:

- `backend común`
- `dominio BIM aislado`
- `frontend BIM desacoplado`
- `feature flags`
- `integración final progresiva`

Esto significa que:

- `GiProy Clásico` sigue funcionando sin depender de BIM
- `GiProy BIM` puede construirse y madurar sin interferir con la experiencia vigente
- ambos comparten la misma fuente de verdad de negocio
- la unión visible se activa solo cuando BIM ya sea maduro

## 3. Decisión arquitectónica

### Backend

Debe ser único.

Razón:

- proyecto, revisión, empresa, EDT, APUs y presupuesto no deben duplicarse
- la integración futura exige una sola fuente de verdad
- separar backends generaría sincronización artificial, riesgo de drift y más complejidad

### Frontend

Debe existir como una capa separada lógicamente dentro del mismo frontend del producto.

Razón:

- permite evolucionar BIM con libertad
- evita contaminar la experiencia actual
- conserva la identidad del producto
- facilita una integración final limpia

### Qué se descarta

- backend BIM separado
- aplicación BIM totalmente ajena al producto principal
- mezcla temprana de flujos BIM en las pantallas clásicas

## 4. Modelo operativo recomendado

### GiProy Clásico

Sigue siendo la experiencia principal y estable del sistema:

- Proyectos
- EDT
- APUs
- Presupuesto
- Cronogramas
- Desagregación
- Fórmula Polinómica

### GiProy BIM

Se desarrolla como experiencia paralela y desacoplada:

- pestaña o workspace BIM
- viewer
- árbol
- propiedades
- vínculos
- vistas
- versionado

Durante la incubación, esta experiencia BIM no condiciona el uso del flujo clásico.

## 5. Regla de paridad visual y funcional

Aunque BIM se desarrolle como capa paralela, no puede sentirse como “otro producto”.

Debe mantener:

- misma identidad visual
- misma jerarquía de cabeceras
- mismas superficies blancas y lenguaje de módulos
- mismos patrones de botones, filtros, badges y paneles
- mismo comportamiento general de navegación

La independencia no debe convertirse en divergencia visual.

## 6. Cómo se consigue esa paridad

### Tokens compartidos

La capa BIM debe reutilizar:

- paleta actual
- sistema tipográfico
- componentes `ui` existentes cuando aplique
- espaciado y shells de módulo vigentes

### Shell propia, lenguaje común

El módulo BIM puede tener una shell más técnica o más densa, pero debe seguir hablando el idioma visual de GiProy.

### Componentes equivalentes

Si BIM necesita paneles laterales, toolbars, pills, buscadores, badges o modales, estos deben derivar del lenguaje del sistema, no reinventarse como un microproducto separado.

## 7. Arquitectura frontend paralela recomendada

### Capa clásica

- `frontend/src/pages/Proyectos.jsx`
- módulos actuales de proyecto

### Capa BIM nueva

- `frontend/src/components/projects/BimTab.jsx`
- `frontend/src/components/bim/`
- `frontend/src/hooks/bim/`
- `frontend/src/context/BimViewerContext.jsx`
- `frontend/src/api/bim*.js`

### Regla de aislamiento

La UI clásica no depende de la BIM.

La UI BIM sí puede consumir datos del dominio clásico cuando sea necesario.

## 8. Estrategia de activación

La activación debe hacerse por `feature flags`.

### Niveles sugeridos

- por entorno
- por empresa
- por usuario
- por módulo

### Usos

- pruebas internas
- pilotos controlados
- activación progresiva
- rollback sin retirar la base BIM

## 9. Integración final planificada

La cohesión final no debe hacerse como una gran fusión.

Debe materializarse en activaciones puntuales:

- `Proyecto` muestra la pestaña BIM al público objetivo
- `EDT` expone navegación al modelo
- `APUs` expone vínculos BIM
- `Presupuesto` expone navegación/resaltado BIM

Es decir, la integración final se construye como suma de puertas ya previstas, no como reescritura del sistema.

## 10. Carriles de trabajo paralelos

### Carril A - Clásico

Continuidad evolutiva de GiProy actual sin dependencia BIM.

### Carril B - Fundaciones BIM

Dominio, storage, versionado, metadata y APIs BIM.

### Carril C - Experiencia BIM

Viewer, árbol, propiedades, filtros, vistas y vínculos.

### Carril D - Cohesión futura

Preparación de contratos, rutas y vínculos latentes que aún no se exponen en el producto clásico.

### Carril documental BIM

La documentacion operativa BIM tambien debe correr en paralelo al carril
clasico.

- Las TASKs BIM viven en `docs/tasks/bim` con IDs `BIM-TASK-*`.
- Las TASKs historicas `TASK-0545` a `TASK-0559` quedan como planificacion
  legacy, no como carril operativo nuevo.
- Toda sesion BIM debe actualizar `docs/architecture/BIM_INDEX.md` cuando cree
  nuevos documentos, TASKs, scripts, smokes o artefactos de gobierno.
- Si una TASK BIM toca GiProy Clasico, debe enlazar una TASK de integracion
  controlada separada en vez de mezclar cierres en la TASK BIM.
- `CHANGELOG.md` y `HANDOFF.md` pueden registrar el cierre global de sesion,
  pero la evidencia de detalle BIM debe quedar en la estructura paralela BIM.

## 11. Gates de no interferencia

Antes de fusionar cualquier avance BIM en ramas funcionales principales debe comprobarse:

- que `GiProy Clásico` sigue sin depender de BIM
- que los módulos clásicos no cambian de UX si la flag BIM está apagada
- que el backend clásico no se rompe si no existen modelos BIM para un proyecto
- que no se introducen regresiones visuales fuera del perímetro BIM

## 12. Definition of Done del modo paralelo

La estrategia paralela se considerará correctamente implantada cuando:

- BIM pueda evolucionar sin romper la experiencia clásica
- la shell BIM conserve identidad GiProy
- backend siga siendo una sola fuente de verdad
- la integración final pueda activarse por puertas controladas
- existan feature flags y rollback limpio
