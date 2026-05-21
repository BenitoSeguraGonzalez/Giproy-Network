# Plan Maestro Consolidado - Integracion Generica de Compras Publicas

## 1. Objetivo

Definir una integracion completa, generica y tolerante a variaciones para el producto clasico `Portal de compras publicas`, cubriendo cuatro escenarios documentales reales de entrada, la generacion posterior de `Excel` y `GIPROY`, y las reglas obligatorias de propiedad, trazabilidad y acceso comercial.

Este plan:
- aplica solo a `GiProy Clasico`
- no introduce UX BIM
- no crea acoplamientos funcionales hacia BIM
- mantiene backend comun
- no implementa codigo todavia

## 2. Casos reales confirmados

Tras revisar los ejemplos reales de `docs/adicionales`, quedan fijados estos escenarios de negocio:

1. `Documento integrado`
- Un unico archivo contiene `presupuesto` y, a continuacion, `APUs` con sus `recursos`.
- Puede venir en `pdf`, `xls` o `xlsx`.

2. `Documento APUs/VAE`
- Un unico archivo contiene `APUs`, presupuesto asociado y `desagregacion tecnologica / VAE`.
- Puede venir en `pdf`, `xls` o `xlsx`.

3. `Documentos desacoplados`
- Un documento contiene el `presupuesto`.
- Otro documento contiene los `APUs` con sus `recursos`.
- Ambos pueden venir en `pdf`, `xls` o `xlsx`.

4. `Solo presupuesto`
- Solo se entrega el documento de `presupuesto`.
- El sistema debe generar un `APU` por cada linea de presupuesto distinta.
- Esos `APUs` nacen sin recursos y en estado `Pendiente`.

## 3. Principios rectores

### 3.1 No usar reglas fijas por plantilla

La integracion no debe depender de:
- nombres de archivo
- posiciones fijas de columnas
- un layout exacto de pagina
- una sola variante documental por extension

Debe basarse en:
- evidencias semanticas detectadas
- bloques funcionales
- encabezados y patrones textuales
- proximidad estructural entre codigo, descripcion, unidad, cantidad, rendimiento y precio

### 3.2 Separacion por capas

La solucion se organizara en cuatro capas:

1. `Deteccion documental`
2. `Normalizacion tecnica`
3. `Generacion de entregables`
4. `Propiedad, licenciamiento y acceso`

### 3.3 Bundle canonico unico

Toda fuente analizada debe converger a un `analysis_bundle` canonico antes de producir salidas.

Ese bundle debe poder contener:
- `document_sources`
- `budget_items`
- `apus`
- `resources`
- `apu_links`
- `vae_entries`
- `portal_metadata`
- `origin_metadata`
- `ownership_metadata`
- `warnings`
- `confidence_map`

## 4. Pipeline objetivo

## 4.1 Ingesta

Recepcion de uno o varios archivos `pdf`, `xls` y `xlsx`, sin asumir rol previo obligatorio por nombre o extension.

## 4.2 Clasificacion documental por evidencias

Cada archivo debe clasificarse por contenido detectado:
- contiene presupuesto
- contiene APUs
- contiene recursos
- contiene desagregacion tecnologica / VAE
- contiene mezcla de varias capas

Salida minima por archivo:
- `document_kind`
- `detected_sections`
- `confidence`
- `source_format`
- `warnings`

## 4.3 Extraccion por secciones

No se parsea un archivo como una unica estructura monolitica. Se extraen secciones funcionales:
- presupuesto
- APUs
- recursos
- VAE / desagregacion
- metadatos de licitacion

## 4.4 Normalizacion canonica

La extraccion aterriza en entidades canonicas:
- items de presupuesto
- APUs
- recursos simples
- referencias a APUs
- metadatos de producto
- cobertura documental

## 4.5 Fusion de fuentes

El motor fusiona varias fuentes por contenido, no por archivo.

Reglas:
- si una fuente aporta presupuesto y otra APUs, se complementan
- si un archivo integrado aporta ambas capas, puede cubrir el bundle completo
- si hay duplicidad, no se suma ciegamente
- la conciliacion debe usar codigo, descripcion normalizada, unidad y contexto

## 4.6 Emision de preview

El preview administrativo debe mostrar:
- que detecto el sistema en cada fuente
- nivel de completitud
- warnings
- cobertura del bundle
- rol inferido de cada archivo

## 5. Matriz funcional por escenario

## 5.1 Documento integrado

Resultado esperado:
- extraer presupuesto
- extraer APUs
- extraer recursos
- construir bundle completo o casi completo

## 5.2 Documento APUs/VAE

Resultado esperado:
- extraer APUs
- extraer recursos
- extraer VAE / desagregacion tecnologica
- asociar lo detectado al bundle tecnico

## 5.3 Documentos desacoplados

Resultado esperado:
- extraer presupuesto desde una fuente
- extraer APUs y recursos desde otra
- fusionar por correspondencia tecnica

## 5.4 Solo presupuesto

Resultado esperado:
- extraer presupuesto
- crear un `APU` automatico por cada linea de presupuesto distinta
- crear esos APUs sin recursos
- marcar cada APU como `Pendiente`
- conservar trazabilidad `generated_from_budget_only`

Cada linea distinta debe resolverse con una clave robusta:
- codigo si existe
- descripcion normalizada
- unidad
- contexto de capitulo/subcapitulo cuando aplique

## 6. APUs anidados

El modelo debe soportar que un recurso sea otro `APU`.

Cada insumo detectado debe clasificarse como:
- `material`
- `mano_obra`
- `equipo`
- `subcontrato` si aplica
- `apu_referenciado`

Esto obliga a modelar los APUs como grafo tecnico, no como lista plana.

El sistema debe contemplar:
- referencias a APUs definidos en la misma fuente
- referencias a APUs definidos en otra fuente del bundle
- referencias aun no resueltas
- referencias ambiguas
- deteccion de ciclos

Estados minimos para enlaces:
- `resolved`
- `pending_reference`
- `ambiguous_reference`

## 7. Niveles de completitud

No debe existir solo `completo / incompleto`. Se fija esta gradacion:

- `solo_presupuesto`
- `presupuesto + apus_base`
- `presupuesto + apus + recursos`
- `presupuesto + apus + recursos + vae`

Esto debe servir para:
- preview admin
- criterios de calidad de salida
- futuras reglas comerciales
- soporte operativo

## 8. Correccion manual asistida

La deteccion automatica no debe ser la unica via.

El panel admin debe poder:
- mostrar el rol propuesto de cada archivo
- permitir correccion manual del rol
- confirmar que un archivo es `presupuesto`
- confirmar que un archivo es `APUs/recursos`
- confirmar que un archivo es `VAE/desagregacion`
- mostrar bundle `completo`, `parcial`, `solo presupuesto` o `inconsistente`

## 9. Reimportacion e incrementalidad

La arquitectura debe contemplar reimportaciones futuras:
- subir una version mejor del mismo documento
- añadir APUs despues
- sustituir un `pdf` por un `excel`
- enriquecer un bundle ya existente sin duplicar entidades

Se debe diseñar desde el inicio para:
- reanalisis incremental
- conciliacion

## 10. Reorganizacion visual del editor clasico

La evolucion funcional del importador deja de tener sentido si la superficie administrativa sigue mezclando configuracion, ingesta y resultado en un mismo bloque visual. Por tanto, se incorpora un frente UX especifico para reordenar el editor clasico del portal.

### 10.1 Problema detectado

La seccion actual de `Archivos tecnicos de entrada`:
- mezcla configuracion del producto con carga documental
- mezcla controles con mensajes de ayuda
- no comunica bien el flujo `cargar -> revisar -> analizar`
- resuelve mal el estado vacio
- hace que el analisis tecnico compita visualmente con la subida de archivos

### 10.2 Nueva estructura objetivo

El editor clasico debe reordenarse en tres bloques:

1. `Configuracion hibrida`
- version
- modalidad de entrega
- origen tecnico
- codigo / referencia tecnica

2. `Fuente documental`
- seleccion de archivos
- estado inmediato
- lista de archivos cargados
- accion de analizar
- ayuda breve de formatos soportados

3. `Resultado tecnico`
- clasificacion
- cobertura
- warnings
- metricas del bundle
- muestras tecnicas

### 10.3 Principios UX de la nueva seccion

- La accion principal debe ser evidente.
- La gestion multiarchivo debe apoyarse en una lista clara, no en chips residuales.
- El estado vacio debe ser limpio y explicito.
- `Analizar` debe sentirse como accion contextual, no como boton competidor del selector.
- El resultado tecnico debe vivir separado de la zona de carga.

### 10.4 Paquete de ejecucion asociado

Este frente UX se divide en:
- `TASK-0732`: reorganizacion estructural del editor
- `TASK-0733`: flujo UX del bloque de ingesta multiarchivo
- `TASK-0734`: estado vacio y lista operativa de archivos
- `TASK-0735`: separacion visual entre `Fuente documental` y `Resultado tecnico`
- no duplicacion
- actualizacion controlada

## 10. Salidas diferenciadas por destino

## 10.1 Excel

En `Excel` solo se mostraran los datos genericos al principio del documento.

No se replica la estructura interna de `Proyecto > Datos de proyecto`.

## 10.2 GIPROY

La salida `Proyecto GIPROY generado` debe mapear metadatos especificos:

- `Codigo / referencia tecnica` -> `Proyecto > Datos de proyecto > Cod. Referencial`
- localizacion definida en el portal -> `Proyecto > Datos de proyecto > Localizacion`
- la geolocalizacion de ese apartado debe ajustarse automaticamente

Esto no debe mezclarse con la plantilla de `Excel`. Son transformaciones de salida distintas.

## 11. Marcado obligatorio de procedencia

Todo proyecto generado desde la compra de este producto debe quedar marcado estructuralmente.

Debe marcarse:
- el proyecto principal
- sus bases de trabajo
- futuras derivaciones dependientes de esa base cuando corresponda

Metadatos minimos de procedencia:
- `origin_type = public_procurement_purchase`
- `origin_product_id`
- `origin_product_kind`
- `origin_order_id` o referencia de compra
- `origin_reference_code`
- `generated_from_marketplace = true`

## 12. Regla obligatoria de propiedad y acceso

Esto es un producto de venta. Por tanto:

- no debe importarse en ninguna empresa si no se ha realizado la compra
- no debe generarse un proyecto sin compra valida
- cada vez que se abra un proyecto marcado como compra, debe verificarse que la empresa actual es propietaria
- la misma regla aplica a las bases de trabajo derivadas

La validacion debe ser backend-first y transversal.

Puntos minimos de enforcement:
- generacion del proyecto
- apertura del proyecto
- apertura de bases de trabajo
- operaciones derivadas relevantes

Metadatos minimos de ownership:
- `is_purchase_bound`
- `owner_company_id`
- `current_company_id`
- `ownership_valid`

## 13. Trazabilidad fuerte

Ademas del ownership, todo bundle y toda generacion deberian conservar:
- producto origen
- compra origen
- empresa propietaria
- version del parser
- fecha de generacion
- documentos fuente utilizados

## 14. Roadmap y slices de implementacion

### TASK-0721
Consolidar el plan maestro de integracion generica y fijar taxonomia de los cuatro escenarios reales.

### TASK-0722
Diseñar el clasificador documental por evidencias para presupuesto, APUs, recursos y VAE.

### TASK-0723
Diseñar el `analysis_bundle` canonico, su modelo de fusion y la persistencia de metadatos de origen.

### TASK-0724
Diseñar la extraccion tolerante a variaciones para `pdf`, `xls` y `xlsx`, sin reglas fijas de plantilla.

### TASK-0725
Diseñar la UX del bloque de importacion para composicion de bundle, clasificacion visible y correccion manual asistida.

### TASK-0726
Diseñar la politica de completitud documental, degradacion funcional y readiness por nivel de cobertura.

### TASK-0727
Diseñar la generacion automatica de APUs `Pendiente` cuando solo exista presupuesto.

### TASK-0728
Diseñar el soporte formal de `APUs anidados` como insumos referenciados dentro del bundle tecnico.

### TASK-0729
Diseñar el mapeo de metadatos del portal hacia salidas diferenciadas `GIPROY` y `Excel`, incluyendo `Cod. Referencial`, `Localizacion` y geolocalizacion automatica para `GIPROY`.

### TASK-0730
Diseñar el marcado estructural de procedencia para proyectos y bases de trabajo generados desde compras publicas.

### TASK-0731
Diseñar el enforcement de propiedad empresarial para importacion, generacion, apertura y uso de proyectos/bases derivados de una compra.

## 15. Criterios de cierre de la fase de planificacion

La fase de planificacion solo se dara por bien cerrada cuando:
- los cuatro escenarios esten modelados sin reglas fijas por plantilla
- el caso `solo presupuesto` contemple APUs `Pendiente`
- los `APUs anidados` esten formalmente soportados
- la salida `GIPROY` y la salida `Excel` tengan contratos separados
- la procedencia y el ownership queden definidos como obligatorios
- no exista contaminacion BIM ni dependencia prematura hacia BIM

## 16. No interferencia BIM

- El plan se limita al `Portal de compras publicas` de la capa clasica.
- No habilita UX BIM.
- No introduce dependencias funcionales hacia BIM.
- Cualquier preparacion futura debe permanecer invisible y no interferente.
