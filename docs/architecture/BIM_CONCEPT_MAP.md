# Mapa Conceptual BIM - GiProy Network

## 1. Capa BIM objetivo

`Modelo BIM` -> `Versión BIM` -> `Elementos BIM` -> `Vínculos de negocio` -> `Operación GiProy`

## 2. Núcleos conceptuales

### Núcleo geométrico

- escena 3D
- render
- cámara
- selección
- aislamiento
- clipping

### Núcleo semántico BIM

- IFC
- storeys
- tipos de elemento
- propiedades
- sistemas
- clasificación

### Núcleo de negocio GiProy

- proyecto
- base de trabajo
- EDT
- APUs
- Presupuesto
- revisión

### Núcleo de enlace

- `Elemento BIM -> EDT`
- `Elemento BIM -> APU`
- `Elemento BIM -> Línea/Capítulo de Presupuesto`

### Núcleo operativo

- carga y versionado
- permisos
- auditoría
- persistencia de vistas
- navegación cruzada

## 3. Flujo lógico de uso

1. Usuario entra al proyecto
2. Abre pestaña BIM
3. Carga versión de modelo activa
4. Navega por árbol / niveles / propiedades
5. Selecciona elemento o grupo BIM
6. Consulta o crea vínculo con `EDT`, `APU` o `Presupuesto`
7. Salta a módulo de negocio relacionado
8. Puede volver al modelo desde el negocio

## 4. Capas técnicas

### Frontend

- viewer BIM
- panel de propiedades
- árbol del modelo
- panel de vínculos
- navegación cruzada

### Backend

- modelos
- versiones
- elementos
- vistas guardadas
- vínculos
- auditoría

### Persistencia

- archivos fuente IFC
- artefactos optimizados
- metadata
- enlaces de negocio
- estados de viewer

## 5. Principios rectores

- el viewer BIM es un módulo de `Proyecto`, no una aplicación aparte
- BIM no sustituye a `EDT`, `APUs` ni `Presupuesto`; los conecta
- el vínculo BIM debe ayudar a operar costos, no solo a visualizar geometría
- toda integración BIM debe mantener gobernanza multiempresa y versionado por revisión

