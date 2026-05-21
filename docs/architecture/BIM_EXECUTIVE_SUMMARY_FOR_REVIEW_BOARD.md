# Resumen Ejecutivo para Junta de Revisión y Aprobación
## Propuesta de Integración de Capa BIM en GiProy Network

### Fecha
2026-03-26

### Estado del documento
Documento de revisión ejecutiva para análisis, discusión y eventual aprobación de la implantación de una capa BIM madura dentro de GiProy Network.

---

## 1. Propósito del documento

El objetivo de este documento es explicar, de forma clara y comprensible para perfiles no técnicos, qué significaría incorporar una capa BIM dentro de GiProy Network, por qué esta capacidad tiene sentido para el sistema, qué amplitud tendría la intervención, qué piezas nuevas habría que añadir y cuál sería su valor funcional real para la operación del producto.

Este documento no propone todavía una ejecución inmediata. Su finalidad es servir como base de revisión, discusión y decisión institucional antes de iniciar una implantación técnica.

---

## 2. Qué se quiere conseguir

La propuesta no consiste en añadir un simple visor tridimensional al sistema. El objetivo es mucho más profundo: se plantea convertir el modelo BIM en una parte activa del trabajo operativo del proyecto dentro de GiProy.

En términos sencillos, hoy GiProy ya permite gestionar proyectos, estructurarlos mediante EDT, desarrollar APUs, construir presupuestos, operar cronogramas y analizar desagregaciones. Lo que falta es que toda esa lógica de negocio pueda relacionarse de forma directa con un modelo BIM del proyecto.

Eso significa que el modelo dejaría de ser un archivo externo o un apoyo visual aislado y pasaría a integrarse dentro del entorno de proyecto como una herramienta de consulta, navegación, trazabilidad y apoyo a la toma de decisiones.

La ambición de esta propuesta es que, en una fase madura, un usuario pueda abrir un proyecto en GiProy, entrar en su módulo BIM, visualizar el modelo, seleccionar un elemento del edificio y comprender con claridad a qué parte de la estructura del proyecto pertenece, qué APU está relacionado con él o qué impacto tiene en presupuesto. Del mismo modo, el usuario también podría partir del presupuesto, del EDT o de un APU y navegar hacia la parte del modelo que le corresponde.

En otras palabras, se propone que el BIM y el negocio del proyecto trabajen conectados y no en paralelo.

---

## 3. Por qué esta integración tiene sentido en GiProy

GiProy ya posee una base funcional muy valiosa para una futura capa BIM. El sistema no parte de cero. Ya existe un dominio sólido alrededor del proyecto, de su estructura EDT, de sus análisis de precios unitarios y de sus presupuestos. Eso hace que la integración BIM tenga una utilidad especialmente alta, porque no se estaría construyendo una visualización aislada, sino una nueva capa que enriquecería procesos ya existentes.

El valor de esta integración está en que el modelo BIM no se incorporaría como un elemento decorativo, sino como una fuente adicional de contexto y de relación. El usuario podría entender mejor el alcance físico de una partida, validar con mayor intuición una estructura EDT, localizar visualmente una parte del proyecto o relacionar información de costos con la realidad del modelo.

Esta combinación tiene especial sentido porque el corazón de GiProy no es únicamente la representación del proyecto, sino la organización, descomposición y valoración económica del mismo. Precisamente por eso, una capa BIM bien integrada amplificaría las capacidades del sistema en lugar de duplicarlas.

---

## 4. Alcance general de la propuesta

La implantación planteada es amplia. No se trata de una modificación superficial, sino de una nueva capacidad transversal del sistema.

En la parte visible para el usuario, se añadiría un nuevo módulo BIM dentro de la pantalla de proyecto. Ese módulo tendría su propio espacio de trabajo, pero integrado dentro de la lógica actual del proyecto. No sería una aplicación aparte ni un sistema externo.

En la parte interna, también sería necesario crear nuevas estructuras de información para almacenar los modelos, sus versiones, sus elementos principales, sus vistas guardadas y los enlaces con las piezas de negocio ya existentes. Por tanto, el alcance afecta al frontend, al backend, a la base de datos, al almacenamiento de archivos y a la forma en que el sistema valida y certifica su funcionamiento.

La propuesta, por tanto, no debe verse como una funcionalidad aislada, sino como un nuevo dominio dentro del producto.

---

## 5. Tecnología recomendada y razón de la elección

Tras el análisis realizado, la solución recomendada para una implantación profesional, integrada y libre de problemas graves de licencia es una combinación de tecnologías abiertas compuesta por Three.js, web-ifc y el ecosistema de That Open Engine, incluyendo sus componentes BIM y su capa de fragments.

Esta elección responde a un criterio muy concreto: se ha buscado una solución que permita construir una capa BIM profundamente integrada con GiProy, que no obligue a aceptar licencias cerradas o restrictivas para un producto propietario y que, al mismo tiempo, no convierta el proyecto en una dependencia excesiva de un visor externo rígido.

La tecnología seleccionada permite disponer de una base gráfica tridimensional moderna, de una capacidad real para leer modelos IFC, de componentes BIM ya preparados para acelerar el desarrollo y de una estrategia de visualización eficiente para modelos medianos y grandes.

Lo importante no es solo la tecnología en sí, sino lo que permite conseguir: una capa BIM propia, controlada por GiProy, libre de costes de licencia de producto y suficientemente flexible para integrarse con los módulos de negocio ya existentes.

---

## 6. Qué nuevas piezas se añadirían al frontend

En la parte visible del sistema, la integración BIM introduciría una nueva pestaña o módulo dentro del proyecto. Este sería el punto de entrada natural para trabajar con el modelo.

Dentro de ese módulo existirían varias secciones funcionales. La primera sería el visor BIM, que permitiría ver el modelo en tres dimensiones, navegar dentro de él, acercarse, alejarse y seleccionar sus elementos. Su finalidad no sería solo mostrar geometría, sino servir como superficie principal de trabajo visual.

A un lado del visor se incorporaría un panel de estructura del modelo. Este panel serviría para recorrer el modelo de forma ordenada, por niveles, elementos o agrupaciones, lo que permitiría al usuario orientarse sin depender únicamente de la navegación visual en la escena.

Junto a ello habría un panel de propiedades. Cuando el usuario seleccionara un elemento del modelo, esa zona mostraría su información relevante. Su valor principal radica en que convertiría el modelo en una fuente consultable de datos y no solamente en una representación gráfica.

También se añadiría un panel o zona de vínculos de negocio. Esta pieza sería una de las más importantes, porque permitiría relacionar elementos del modelo con nodos EDT, APUs o líneas de presupuesto. Sin esta capa, BIM se quedaría en visualización. Con ella, se convertiría en una herramienta operativa conectada con la lógica central de GiProy.

Además, el módulo BIM incorporaría controles de estado y navegación, como selector de versión del modelo, filtros, vistas guardadas y otras herramientas necesarias para un uso profesional.

En conjunto, estas nuevas piezas del frontend formarían un módulo coherente y no una suma desordenada de paneles.

---

## 7. Qué nuevas estructuras se añadirían al sistema

Para que la capa BIM funcione de verdad, no basta con dibujar el modelo en pantalla. El sistema debe ser capaz de registrar qué modelo corresponde a qué proyecto, cuántas versiones existen, cuál es la vigente, qué partes del modelo contiene, qué vistas se han guardado y con qué elementos del negocio se ha relacionado.

Por esa razón, la propuesta incluye la creación de nuevas entidades y estructuras de almacenamiento.

Haría falta una entidad principal para el modelo BIM del proyecto. Esta permitiría identificar cada modelo como un activo del sistema y no como un simple archivo cargado.

También haría falta una entidad para las versiones del modelo, porque un proyecto real evoluciona y no trabaja con un único modelo inmutable.

Sería necesario además registrar elementos del modelo y sus agrupaciones principales, para que el sistema pueda relacionarlos después con el EDT, con APUs o con partidas presupuestarias.

Junto a esto se añadiría una estructura para vistas guardadas, que permitiría conservar configuraciones útiles del visor, y varias estructuras de vínculo para conectar el mundo BIM con el mundo de negocio de GiProy.

Estas nuevas estructuras son la base de la madurez del módulo. Sin ellas, no habría trazabilidad, persistencia ni gobernanza.

---

## 8. Cómo se conectaría BIM con los módulos actuales

La integración no se plantea como un bloque aislado. Al contrario, el éxito del módulo BIM depende precisamente de su capacidad para conversar con el resto del sistema.

La relación más clara sería con el proyecto, ya que el módulo BIM se alojaría dentro de esa pantalla. El proyecto actuaría como contexto principal del modelo.

También tendría una relación directa con el EDT. Esto permitiría enlazar partes del modelo con la estructura del proyecto, ayudando a que la organización jerárquica tenga un reflejo visual tangible.

Otra conexión clave sería con los APUs. Esto abriría la puerta a que una solución constructiva o un grupo de elementos del modelo pudiera relacionarse con una composición de precios unitaria concreta.

Y, finalmente, una parte esencial de la madurez del módulo sería la relación con el presupuesto. Gracias a ella, el sistema podría ofrecer una navegación cruzada entre la dimensión visual del proyecto y la dimensión económica.

Esta conexión es la que más valor diferencial aportaría a GiProy frente a una implantación BIM puramente visual.

---

## 9. Qué beneficios funcionales se obtendrían

El primer beneficio sería una mejor comprensión del proyecto. Muchas decisiones que hoy se leen en tablas, árboles o partidas podrían complementarse con una lectura espacial y visual mucho más intuitiva.

El segundo beneficio sería la trazabilidad. El sistema podría mostrar no solo cuánto cuesta algo o dónde está dentro del EDT, sino también qué parte del modelo representa.

El tercer beneficio sería la coherencia entre disciplinas. El usuario dejaría de trabajar con el modelo por un lado y con el presupuesto por otro. Ambos mundos podrían conectarse dentro del mismo entorno.

El cuarto beneficio sería la madurez del producto. GiProy pasaría de ser una plataforma fuerte en organización y costo a convertirse en una plataforma con capacidad de integración BIM real.

El quinto beneficio sería estratégico. La capa BIM no dependería de una solución cerrada ni de un coste de licencia por producto. Eso permitiría evolucionarla con libertad y adaptar su experiencia a la lógica propia de GiProy.

---

## 10. Qué no debe esperarse de la primera implantación

Aunque el plan es ambicioso, conviene dejar claro que la primera implantación no debe confundirse con un sistema completo de authoring BIM, edición geométrica o coordinación multidisciplinar avanzada.

La propuesta se centra en una capa BIM profesional para visualización, navegación, consulta de propiedades, versionado y relación con la estructura y los costos del proyecto.

No se plantea, al menos en la primera gran etapa, convertir a GiProy en una herramienta de modelado ni en un entorno documental BIM integral. La prioridad es construir una capa robusta, útil y alineada con el negocio existente.

---

## 11. Estructura de implantación prevista

El plan de trabajo se ha dividido en una TASK madre de control y varias subtareas especializadas. Esta estructura existe para garantizar orden, gobierno y reducción de riesgo.

La TASK madre actúa como paraguas de control. Su función es asegurar que toda la implantación mantenga coherencia arquitectónica, criterios de validación comunes y trazabilidad completa.

Las subtareas separan el trabajo en bloques claros: arquitectura, dominio de datos, shell frontend del viewer, pipeline de importación y versionado, vínculos con negocio, seguridad y permisos, validación y preparación para salida a producción.

Este enfoque permite que la implantación se ejecute por fases y no como un bloque único de alto riesgo.

---

## 12. Cómo se validaría la implantación

No se plantea liberar esta capacidad solo porque el visor abra un modelo. La validación propuesta es mucho más exigente.

Se han previsto pruebas básicas de salud del módulo, pruebas funcionales reales, pruebas de integración con el resto del sistema, pruebas de simulación con proyectos de distintos tamaños y pruebas no funcionales relacionadas con estabilidad y rendimiento.

La implantación solo podría considerarse madura si el módulo BIM funciona correctamente, si su integración con EDT, APUs y presupuesto es real, si el sistema soporta navegación cruzada sin incoherencias y si la experiencia sigue siendo estable en escenarios representativos.

En otras palabras, el criterio de éxito no será “el modelo se ve”, sino “el modelo trabaja de verdad dentro de GiProy”.

---

## 13. Estado actual de esta propuesta

En este momento no se ha iniciado la implementación del módulo BIM. Lo que sí se ha hecho es dejar preparado un paquete completo de planificación para que la decisión pueda ser evaluada con base sólida.

Ese paquete incluye:

- el plan maestro BIM
- el mapa conceptual
- el mapa de inserción
- el roadmap de ejecución
- el plan de validación
- la TASK madre de control
- las subtareas de trabajo

Por tanto, la propuesta está en estado de “nevera preparada”: completamente planificada, estructurada y lista para ser activada cuando exista aprobación formal para pasar a ejecución.

---

## 14. Recomendación final para la junta

La recomendación es considerar esta iniciativa como un salto estratégico y no como una mejora menor.

La integración BIM puede dar a GiProy una dimensión nueva y muy valiosa, especialmente porque el sistema ya tiene fortaleza en estructura y costos. Sin embargo, su implantación debe abordarse como un programa formal, con fases, control de alcance y validación exigente.

La propuesta aquí presentada ofrece una base seria para esa decisión. Si la junta considera que BIM debe convertirse en una capacidad central del producto, el sistema ya dispone del paquete documental necesario para arrancar de forma ordenada, sin improvisación y con una arquitectura pensada desde el primer día para ser madura, profesional y utilizable.

---

## 15. Referencias oficiales consultadas

- Three.js
  - https://github.com/mrdoob/three.js
  - https://threejs.org/docs/
- web-ifc
  - https://github.com/ThatOpen/engine_web-ifc
  - https://thatopen.github.io/engine_web-ifc/docs/
- That Open Components
  - https://github.com/ThatOpen/engine_components
- That Open Fragments
  - https://github.com/ThatOpen/engine_fragment
- web-ifc-three (deprecado oficialmente)
  - https://github.com/ThatOpen/web-ifc-three
- xeokit SDK (referencia descartada por licencia)
  - https://github.com/xeokit/xeokit-sdk

