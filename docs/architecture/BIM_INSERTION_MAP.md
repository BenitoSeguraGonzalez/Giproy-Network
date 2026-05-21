# Mapa de Inserción BIM - GiProy Network

## 1. Inserción en frontend

### Punto de entrada principal

- `frontend/src/pages/Proyectos.jsx`

### Inserción recomendada

- nueva sección de proyecto: `bim`
- nueva pestaña/componente:
  - `frontend/src/components/projects/BimTab.jsx`

### Componentes nuevos

- `frontend/src/components/bim/BimViewerShell.jsx`
- `frontend/src/components/bim/BimCanvas.jsx`
- `frontend/src/components/bim/BimPropertiesPanel.jsx`
- `frontend/src/components/bim/BimTreePanel.jsx`
- `frontend/src/components/bim/BimLinksPanel.jsx`
- `frontend/src/components/bim/BimViewStateToolbar.jsx`
- `frontend/src/components/bim/BimVersionSelector.jsx`

### Hooks nuevos

- `frontend/src/hooks/bim/useBimModelLoader.js`
- `frontend/src/hooks/bim/useBimSelection.js`
- `frontend/src/hooks/bim/useBimProperties.js`
- `frontend/src/hooks/bim/useBimLinks.js`
- `frontend/src/hooks/bim/useBimViewState.js`

### APIs nuevas

- `frontend/src/api/bimModels.js`
- `frontend/src/api/bimLinks.js`
- `frontend/src/api/bimViewStates.js`

## 2. Inserción en backend

### Modelos nuevos

- `backend/app/models/bim_model.py`
- `backend/app/models/bim_model_version.py`
- `backend/app/models/bim_element.py`
- `backend/app/models/bim_storey.py`
- `backend/app/models/bim_view_state.py`
- `backend/app/models/bim_link_edt.py`
- `backend/app/models/bim_link_apu.py`
- `backend/app/models/bim_link_presupuesto.py`

### Schemas nuevos

- `backend/app/schemas/bim_model.py`
- `backend/app/schemas/bim_link.py`
- `backend/app/schemas/bim_view_state.py`

### Servicios nuevos

- `backend/app/services/bim/model_registry.py`
- `backend/app/services/bim/model_storage.py`
- `backend/app/services/bim/model_metadata.py`
- `backend/app/services/bim/link_service.py`
- `backend/app/services/bim/view_state_service.py`
- `backend/app/services/bim/version_service.py`

### Endpoints nuevos

- `backend/app/api/endpoints/bim_models.py`
- `backend/app/api/endpoints/bim_links.py`
- `backend/app/api/endpoints/bim_view_states.py`

## 3. Inserción en base de datos

### Tablas nuevas

- `bim_models`
- `bim_model_versions`
- `bim_elements`
- `bim_storeys`
- `bim_view_states`
- `bim_link_edt`
- `bim_link_apu`
- `bim_link_presupuesto`

### Relaciones clave

- `proyecto 1 -> n bim_models`
- `bim_model 1 -> n bim_model_versions`
- `bim_model_version 1 -> n bim_elements`
- `bim_model_version 1 -> n bim_storeys`
- `bim_element n -> n edt`
- `bim_element n -> n apu`
- `bim_element n -> n presupuesto_detalle`

## 4. Inserción en shell funcional existente

### Proyecto

- anfitrión principal del módulo BIM

### EDT

- navegación desde nodo EDT a elementos BIM vinculados

### APUs

- navegación desde APU a elementos o grupos BIM asociados

### Presupuesto

- navegación desde línea presupuestaria a selección/resaltado BIM

## 5. Inserción operativa

### Storage lógico

- carpeta/objeto de fuente IFC
- carpeta/objeto de artefactos optimizados
- miniaturas/metadata opcionales

### Auditoría

- altas
- nuevas versiones
- cambios de vínculos
- activación de modelo vigente

