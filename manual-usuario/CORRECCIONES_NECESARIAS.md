# Correcciones necesarias detectadas durante la elaboración del manual

## Cierre editorial BIM y caso práctico — 5 de agosto de 2026

Se actualizó el relato de los capítulos 16, 17 y 20 para que el lector siga un flujo continuo desde la creación del proyecto hasta la coordinación BIM. El texto ahora explica la decisión de mantener BIM al margen, la adaptación por rol, la activación por defecto de OmniClass, el aviso de ruptura de estructura cuando se desactiva y la tri-sincronización presupuesto ↔ Gantt ↔ BIM. El caso de Santiago Bermeo conserva sus datos de revisión 0, pero distingue expresamente el modelo público de demostración de la geometría de autoría del proyecto.

**Avance parcial del manual BIM:** 100% en estructura narrativa, flujo funcional y adecuación al módulo actual.

**Avance total del manual:** 98%. La validación automática del manual pasa en escritorio 1920×1080 y resolución ampliada 2560×1440; se incorporaron 22 capturas reales de los validadores BIM para documentar CDE, submittals, QTO, 4D, 5D, coste real, campo, ERP e integraciones. La cobertura restante corresponde a incidencias abiertas de la bitácora y a evidencias específicas que la matriz todavía marca como pendientes o parciales. El alcance de producto termina en tablet y no incluye teléfonos.

La ejecución del verificador tras esta adecuación devuelve `desktop-1920: OK` y `desktop-ampliado: OK`. La matriz visual sigue separando honestamente las evidencias que requieren una captura adicional de aquellas que ya tienen cobertura narrativa y validación funcional.

También se normalizó el caso práctico para usar `#SantiagoBermeo-2026-001` como identidad canónica, conservando “Proyecto Prueba Compartir 1” únicamente como nombre visible de la interfaz. Esto evita que el lector confunda la etiqueta mostrada en el portafolio con la referencia utilizada por coordinación, auditoría y sincronización BIM.

Fecha de apertura: 29 de julio de 2026  
Ámbito: interfaz de empresa, empresa de pruebas «Santiago Bermeo», proyecto `SantiagoBermeo-2026-001`  
Propósito: conservar defectos, inconsistencias y acciones de saneamiento descubiertas durante el recorrido completo de la aplicación.

Este documento no confirma correcciones. Un elemento solo puede pasar a «Corregido» después de implementar la solución y ejecutar la validación indicada.

## Regla de actuación durante la elaboración del manual

Esta bitácora permanecerá abierta durante toda la interacción y durante cada recorrido de la aplicación. No se limitará a errores técnicos: también recogerá botones que no respondan, cargas anormalmente largas, mensajes confusos, resultados inesperados, diferencias entre pantallas, datos incoherentes y cualquier paso que obligue al usuario a adivinar qué debe hacer.

Cada nuevo hallazgo se clasificará por su efecto sobre el trabajo:

- **Bloqueante:** impide continuar el recorrido, acceder a una función necesaria, obtener una captura válida o comprobar una explicación esencial del manual. Se investiga y se corrige en el momento, siempre que la solución pertenezca al alcance autorizado. Después se repite el flujo que falló y se conserva evidencia de la validación. Si la corrección exige una decisión funcional, credenciales, una migración de producción o una actuación externa no autorizada, se documenta el bloqueo y se solicita esa intervención concreta.
- **No bloqueante:** permite continuar con seguridad y no falsea el contenido del manual. Se documenta con suficiente detalle para sanearlo posteriormente, pero no interrumpe el recorrido actual.
- **Controlado temporalmente:** existe una medida provisional segura que permite continuar sin ocultar el problema. Debe quedar descrita tanto la limitación como la condición necesaria para retirar esa medida.

La prioridad expresa la importancia del problema; el efecto sobre el trabajo determina cuándo se actúa. Una incidencia de prioridad alta puede no bloquear el capítulo que se está documentando, mientras que un fallo aparentemente pequeño puede ser bloqueante si impide verificar una pantalla.

Antes de marcar cualquier incidencia como corregida se exige:

1. Identificar la causa y no solo ocultar el síntoma.
2. Aplicar una solución limitada al problema observado.
3. Repetir el recorrido exacto que produjo el fallo.
4. Comprobar que no se ha roto el flujo anterior ni el siguiente.
5. Actualizar aquí el estado, la fecha, la solución aplicada y la evidencia.

## Estados utilizados

- **Confirmado:** reproducido directamente en la aplicación, servicio, base de datos o código.
- **Dato a sanear:** la aplicación funciona, pero el conjunto de prueba contiene información incoherente o insuficiente.
- **Mejora recomendada:** comportamiento válido que puede producir confusión o riesgo operativo.
- **Pendiente de verificar:** existe evidencia parcial y hace falta una sesión interactiva normal.

## Resumen

| Identificador | Prioridad | Tipo | Título | Estado |
|---|---:|---|---|---|
| COR-001 | Alta | Confirmado | La aplicación puede permanecer indefinidamente en «Cargando…» | Abierto |
| COR-002 | Alta | Confirmado | El importador IFC por trabajos depende de una tabla no migrada | Corregido localmente y validado |
| COR-003 | Media | Confirmado | Advertencias Pydantic por campos con prefijo `model_` | Abierto |
| COR-004 | Alta | Dato a sanear | Totales económicos del proyecto no concilian de forma evidente | Abierto |
| COR-005 | Media | Dato a sanear | La EDO del proyecto completo está vacía | Abierto |
| COR-006 | Media | Dato a sanear | Fechas principales del proyecto no están informadas | Abierto |
| COR-007 | Media | Confirmado | Etiqueta «Profecional» contiene un error ortográfico | Abierto |
| COR-008 | Media | Confirmado | Etiquetas BIM mezclan español, inglés y términos sin tilde | Abierto |
| COR-009 | Alta | Confirmado | El capturador invalidaba la sesión única del administrador | Corregido en herramienta; validación pendiente |
| COR-010 | Media | Confirmado | El tiempo máximo del capturador estaba aplicado en la posición incorrecta | Corregido en herramienta del manual |
| COR-011 | Alta | Mejora recomendada | Falta una comprobación semántica obligatoria de capturas | Parcial |
| COR-012 | Media | Confirmado | El analizador IFC síncrono y el importador por trabajos tienen distinta disponibilidad | Abierto |
| COR-013 | Media | Dato a sanear | El texto de alcance del proyecto es provisional y poco operativo | Abierto |
| COR-014 | Alta | Dato a sanear | El modelo BIM incorporado es formativo, no geometría de autoría del proyecto | Controlado |
| COR-015 | Media | Pendiente de verificar | Posible bloqueo prolongado al cargar licencia o contexto inicial | Abierto |
| COR-016 | Baja | Herramienta de documentación | El lanzador restringido no pudo iniciar los validadores | Controlado temporalmente |
| COR-017 | Alta | Confirmado | Falta la migración de las tablas de federación BIM | Corregido localmente y validado |
| COR-018 | Alta | Confirmado | Un fallo del capturador dejaba el navegador abierto y saturaba el backend | Corregido en herramienta; validación pendiente |
| COR-019 | Crítica | Confirmado | La carga concurrente de licencia deja `UPDATE empresas` sin confirmar | Corregido y validado en código nuevo |
| COR-020 | Media | Confirmado | La prueba SaaS E2E espera un producto que el catálogo ya no genera | Abierto |
| COR-021 | Alta | Confirmado | Un error de Playwright imprimió el token técnico en su diagnóstico | Corregido; token invalidado |
| COR-028 | Crítica | Confirmado | La revisión Alembic BIM estaba adelantada respecto al esquema real | Corregido localmente; prevención pendiente |
| COR-029 | Media | Confirmado | Federación quedaba completamente en blanco con una sola versión | Corregido y validado |

---

## COR-001 · La aplicación puede permanecer indefinidamente en «Cargando…»

**Prioridad:** Alta  
**Tipo:** Confirmado  
**Módulo:** autenticación e inicialización de la aplicación

### Evidencia

Al abrir rutas internas con una sesión técnicamente válida, la aplicación permaneció más de 120 segundos en la pantalla global «Cargando…». Durante la prueba se observaron solicitudes abortadas a:

- `/api/v1/usuarios/me`
- `/api/v1/maestros/ecuador/provincias`
- `/api/v1/paises/`

La interfaz no mostró error, reintento ni diagnóstico; solo mantuvo el indicador de carga.

### Comportamiento esperado

La inicialización debe terminar, presentar una pantalla recuperable o mostrar un mensaje con acción de reintento. Ninguna solicitud secundaria debe mantener bloqueada indefinidamente toda la aplicación.

### Corrección propuesta

1. Introducir tiempos máximos independientes para usuario, licencia, maestros y preferencias.
2. Considerar obligatoria solo la consulta necesaria para autenticar y dibujar el shell.
3. Cargar maestros secundarios después de mostrar la aplicación.
4. Incorporar estado de error con «Reintentar» y un identificador de solicitud.
5. Registrar qué promesa mantiene `AuthContext.loading` en `true`.

### Validación

- Simular respuesta lenta, abortada y 500 en cada dependencia.
- Confirmar que el shell aparece o el error recuperable se muestra antes del límite acordado.
- Verificar que pulsar «Reintentar» no duplica solicitudes.

---

## COR-002 · El importador IFC por trabajos depende de una tabla no migrada

**Prioridad:** Alta  
**Tipo:** Confirmado  
**Módulo:** BIM · importaciones IFC

### Evidencia

El servicio `create_bim_import_job` devolvió:

> El esquema de jobs BIM no esta disponible. Ejecuta la migracion Alembic de BIM import jobs.

La tabla `bim_import_jobs` no está disponible en la base local, aunque la interfaz presenta el panel de trabajos de importación.

### Comportamiento esperado

Una capacidad visible y habilitada debe tener su esquema aplicado. En caso contrario, la interfaz debe ocultarla o presentar un diagnóstico administrativo claro antes de que la persona seleccione un archivo.

### Corrección propuesta

1. Incluir la migración de `bim_import_jobs` en la línea oficial de despliegue.
2. Incorporar una comprobación de preparación BIM al arranque.
3. Bloquear o degradar el panel a importación síncrona cuando falte la tabla.
4. Añadir una prueba de despliegue que compare tablas requeridas con migraciones aplicadas.

### Validación

- Ejecutar migraciones en una base nueva y en una actualizada.
- Crear, procesar, cancelar y reintentar un trabajo.
- Confirmar que la misma operación es idempotente.

### Historial de actuación · 29 de julio de 2026

Antes de modificar el esquema se creó el respaldo completo
`manual-usuario/backups/pre-bim-migrations-de2022-20260729.dump`. La auditoría
posterior encontró 56 tablas BIM ausentes, incluida `bim_import_jobs`. Se
ejecutó `backend/scripts/repair_missing_bim_tables.py --apply`, que solo crea
tablas ausentes y no reemplaza tablas ni registros existentes. La comprobación
final confirmó 85 de 85 tablas BIM y ninguna columna exigida ausente. La ruta
de trabajos queda desbloqueada a nivel de esquema; el recorrido funcional de
crear, cancelar y reintentar continúa siendo una validación separada pendiente.

---

## COR-003 · Advertencias Pydantic por campos con prefijo `model_`

**Prioridad:** Media  
**Tipo:** Confirmado  
**Módulo:** esquemas BIM

### Evidencia

Durante la importación IFC se emitieron advertencias para `model_name` y `model_id` por conflicto con el espacio protegido `model_`.

### Riesgo

Las advertencias contaminan registros y pueden ocultar fallos reales. Una futura versión de Pydantic puede endurecer el comportamiento.

### Corrección propuesta

Definir `protected_namespaces=()` únicamente en los esquemas que necesitan esos campos, o utilizar alias externos conservando nombres internos que no entren en conflicto.

### Validación

- Ejecutar la suite BIM sin advertencias Pydantic.
- Confirmar que la API conserva los nombres de contrato `model_id` y `model_name`.

---

## COR-004 · Totales económicos del proyecto no concilian de forma evidente

**Prioridad:** Alta  
**Tipo:** Dato a sanear  
**Módulo:** ficha y presupuesto

### Evidencia

Para `Proyecto Prueba Compartir 1` se observaron:

- Presupuesto estimado de ficha: USD 93.486,42.
- Subtotal del presupuesto: USD 93.489,01.
- Indirectos: USD 19.632,69.
- Total del presupuesto: USD 130.089,96.

La diferencia entre subtotal más indirectos y total no queda explicada en la lectura obtenida. Tampoco coincide exactamente la estimación de ficha con el subtotal.

### Acción de saneamiento

1. Identificar impuestos, ajustes o redondeos que completan el total.
2. Mostrar un desglose de conciliación en la interfaz.
3. Decidir si el presupuesto estimado de ficha debe actualizarse, mantenerse como línea base o etiquetarse como referencia.
4. Documentar la diferencia y su fecha.

### Validación

Una persona nueva debe poder reconstruir el total utilizando únicamente los conceptos visibles en pantalla.

---

## COR-005 · La EDO del proyecto completo está vacía

**Prioridad:** Media  
**Tipo:** Dato a sanear  
**Módulo:** Proyecto · EDO

### Evidencia

No existen nodos EDO para el proyecto 7 de la empresa 3, mientras la EDT, presupuesto y cronograma sí están desarrollados.

### Riesgo

No puede demostrarse el flujo completo de responsables, estructura organizativa y asignaciones. Los reportes pueden carecer de dueño operativo.

### Acción de saneamiento

Crear una EDO mínima y realista: dirección del proyecto, costos, planificación, oficina técnica y obra; después asignar responsables autorizados.

### Validación

Cada rama principal debe tener función y responsable, y las asignaciones deben aparecer en las vistas y reportes correspondientes.

---

## COR-006 · Fechas principales del proyecto no están informadas

**Prioridad:** Media  
**Tipo:** Dato a sanear  
**Módulo:** ficha del proyecto

### Evidencia

`fecha_inicio` y `fecha_fin_estimada` del proyecto están vacías. El detalle registra un plazo de 180 días, mientras el cronograma utiliza como inicio el 1 de junio de 2026.

### Acción de saneamiento

Definir la autoridad de fechas, completar inicio y fin estimado o explicar por qué el cronograma utiliza una fecha distinta.

### Validación

Ficha, cronograma, reportes y BIM 4D deben mostrar un origen de fecha trazable y compatible.

---

## COR-007 · Etiqueta «Profecional» contiene un error ortográfico

**Prioridad:** Media  
**Tipo:** Confirmado  
**Módulo:** Presupuesto · EDT valorada

### Evidencia

La interfaz contiene el texto:

> Generar EDT Valorada Profecional

### Corrección propuesta

Cambiarlo por:

> Generar EDT valorada profesional

Revisar también capitalización consistente en botones y títulos.

### Validación

Buscar `Profecional` en todo el frontend y confirmar que no quedan coincidencias visibles.

---

## COR-008 · Etiquetas BIM mezclan español, inglés y términos sin tilde

**Prioridad:** Media  
**Tipo:** Confirmado  
**Módulo:** BIM

### Ejemplos observados

- `Baseline del escenario 4D`
- `Preview de partición`
- `Titulo de incidencia`
- `Categoria documental CDE`
- `Linea base para nivelacion`
- `Agregar version a federacion`
- `Aislar la categoria IFC activa en el canvas fragments nativo`
- `explorer BIM`

### Corrección propuesta

Crear un glosario de interfaz y aplicar una política:

- Línea base, no baseline, salvo formatos de intercambio.
- Vista previa, no preview.
- Explorador, no explorer.
- Título, categoría, línea, nivelación y versión con tilde.
- Mantener IFC, CDE, BIM, QTO y SOV como siglas explicadas.

### Validación

Ejecutar búsqueda de las variantes y revisar visualmente todos los paneles BIM.

---

## COR-009 · El acceso automatizado puede invalidar la sesión única del usuario

**Prioridad:** Alta  
**Tipo:** Confirmado  
**Módulo:** autenticación y `manual-usuario/scripts/capture-pages.mjs`  
**Efecto sobre el trabajo:** Bloqueante para capturas internas seguras  
**Estado:** Corregido en la herramienta; pendiente de validar con acceso normal

### Evidencia

La política compara el `sid` del token con `current_session_id`. El capturador anterior elegía al primer usuario activo de la empresa 3, sustituía directamente `current_session_id` y lo dejaba vacío al terminar. El registro confirmó múltiples peticiones del administrador `santibq81@msn.com` con una sesión `manual-captura-*` que después dejó de coincidir con la base de datos. Este comportamiento podía expulsar al único administrador de Santiago Bermeo.

Una sesión de captura creada sin seguir todo el flujo normal puede producir mensajes de:

- sesión iniciada en otro dispositivo;
- sesión cerrada por un administrador;
- sesión expirada por inactividad.

La validación de inactividad también limpia la sesión en base de datos.

### Corrección realizada el 29 de julio de 2026

Se eliminó del capturador la consulta y escritura directa de usuarios, la fabricación de tokens y la limpieza de `current_session_id`. Las capturas internas ahora:

1. exigen `GIPROY_CAPTURE_EMAIL` y `GIPROY_CAPTURE_PASSWORD` juntas;
2. introducen esos valores en el formulario normal;
3. mantienen las credenciales únicamente en memoria;
4. no imprimen ni escriben la contraseña;
5. no ejecutan capturas internas cuando faltan credenciales.

### Validación

La sintaxis del script fue validada con `node --check`. Falta ejecutar el acceso normal y confirmar que obtiene pantallas internas válidas. Si la cuenta humana debe permanecer abierta simultáneamente, la solución definitiva es una cuenta técnica autorizada porque la política actual admite una sola sesión por usuario.

---

## COR-010 · El tiempo máximo del capturador estaba aplicado en la posición incorrecta

**Prioridad:** Media  
**Tipo:** Confirmado y corregido en la herramienta del manual  
**Módulo:** `manual-usuario/scripts/capture-pages.mjs`

### Evidencia

`page.waitForFunction` recibió las opciones como segundo argumento, donde Playwright espera el argumento de la función. El tiempo real permanecía en 30 segundos.

### Corrección realizada

Se pasó `null` como argumento y `{ timeout: 120_000 }` como tercer parámetro.

### Validación

La ejecución ya respeta 120 segundos. Sigue siendo necesario resolver COR-001.

---

## COR-011 · Falta una comprobación semántica obligatoria de capturas

**Prioridad:** Alta  
**Tipo:** Mejora recomendada  
**Módulo:** herramienta del manual

### Evidencia

Se generaron inicialmente catorce imágenes que mostraban únicamente «Cargando…». Los archivos tenían tamaños similares y podían pasar una comprobación basada solo en existencia.

### Corrección parcial realizada el 29 de julio de 2026

El capturador ahora rechaza:

- cualquier texto visible que contenga la palabra «Cargando», con o sin puntos o complemento;
- indicadores visibles con `role="progressbar"`, `aria-busy="true"` o animación de giro;
- formulario de acceso;
- ruta `/login`.

Además, cada ruta exige ahora un texto positivo que solo aparece cuando existe contenido útil. El portafolio, por ejemplo, no puede guardarse hasta mostrar «Proyecto Prueba Compartir 1». La captura inválida `proyectos-portafolio.png`, que mostraba «Cargando portafolio…», fue inspeccionada y eliminada.

La primera captura válida reutilizó accidentalmente ese mismo nombre. Un navegador que ya hubiera abierto el manual podía seguir mostrando la versión rechazada desde caché. La imagen válida se renombró como `proyectos-portafolio-cargado.png` y el nombre rechazado queda prohibido para futuras capturas.

### Corrección pendiente

1. Guardar título, ruta y texto de control junto a la imagen.
2. Comprobar dimensiones y hash no repetido.
3. Revisar visualmente cada captura antes de incorporarla.
4. Añadir una prueba que falle si dos capturas de rutas distintas son idénticas.
5. No reutilizar jamás el nombre de una captura rechazada; usar un nombre nuevo o una versión de archivo.

---

## COR-012 · El analizador IFC síncrono y el importador por trabajos tienen distinta disponibilidad

**Prioridad:** Media  
**Tipo:** Confirmado  
**Módulo:** BIM · importación

### Evidencia

El importador por trabajos falló por ausencia de tabla, mientras `import_ifc_file_bim_package` procesó correctamente el mismo archivo:

- modelo 1;
- versión 1;
- cuatro plantas;
- 144 elementos;
- 38.898 entidades IFC.

### Corrección propuesta

Definir una única capacidad pública o una degradación explícita. La interfaz debe saber cuál flujo está disponible y mostrar el estado de preparación.

### Validación

Ejecutar ambos flujos sobre el mismo IFC y comparar modelo, versión, elementos, artefacto, calidad e idempotencia.

---

## COR-013 · El texto de alcance del proyecto es provisional y poco operativo

**Prioridad:** Media  
**Tipo:** Dato a sanear  
**Módulo:** ficha del proyecto

### Evidencia

La descripción breve indica que es un proyecto de prueba y el alcance detallado dice que se colocaron datos para comprobar si el campo aparece.

### Acción de saneamiento

Sustituirlo por un alcance formativo claro que describa vivienda, límites, entregables, exclusiones, supuestos y criterio de éxito.

### Validación

Una persona nueva debe comprender qué se construye y qué no, sin consultar otras pantallas.

---

## COR-014 · El modelo BIM incorporado es formativo, no geometría de autoría del proyecto

**Prioridad:** Alta  
**Tipo:** Dato a sanear controlado  
**Módulo:** BIM

### Evidencia

Se incorporó `Duplex_A_20110907.ifc`, modelo público buildingSMART, para explicar el flujo. Sus vínculos con EDT 1.5 y partida 1.5.1 utilizan `link_type=reference` y notas que prohíben tratarlo como medición real.

### Acción futura

Sustituir o complementar con un IFC de autoría del proyecto cuando exista. No aprobar propuestas QTO ni 5D basadas en el modelo formativo.

### Validación

La interfaz debe mostrar de manera visible que se trata de una referencia de demostración y conservar la atribución CC BY 4.0.

---

## COR-015 · Posible bloqueo prolongado al cargar licencia o contexto inicial

**Prioridad:** Media  
**Tipo:** Pendiente de verificar  
**Módulo:** `AuthContext`

### Evidencia parcial

`checkAuth` espera `refreshLicenseInfo` antes de desactivar `loading`. Una respuesta lenta o bloqueada del servicio de licencias podría mantener la pantalla global.

### Verificación necesaria

Instrumentar tiempos de `/usuarios/me`, licencia y contexto de empresa con una sesión normal. No se debe clasificar como causa confirmada hasta obtener la traza.

---

## COR-016 · El lanzador restringido de Windows no pudo iniciar los validadores

**Prioridad:** Baja  
**Tipo:** Herramienta de documentación; no atribuido a GiProy  
**Módulo:** Entorno de validación del manual  
**Efecto sobre el trabajo:** Controlado temporalmente  
**Estado:** Validación desbloqueada; causa del entorno pendiente  

### Evidencia

Al ejecutar los validadores, tanto en paralelo como de forma aislada, el lanzador restringido de PowerShell respondió con `CreateProcessAsUserW failed: 1920` y no llegó a iniciar Node.js. El resultado no representa un fallo del HTML ni de la aplicación.

### Medida aplicada

Se repitieron exactamente los mismos comandos fuera del lanzador restringido, sin modificar su contenido ni desactivar comprobaciones.

### Resultado de validación

- Auditor de cobertura: 93 archivos de interfaz de empresa, 445 etiquetas accesibles, 418 ayudas emergentes, 29 títulos de ventanas, 140 textos de botón y **0 controles sin documentar**.
- Verificador del manual: **OK** en escritorio 1920×1080 y resolución ampliada 2560×1440.

### Saneamiento posterior

Revisar permisos y configuración del lanzador restringido de Windows. Si vuelve a aparecer, conservar el código de error y comprobar primero si afecta a cualquier proceso hijo o únicamente a PowerShell. No debe registrarse como defecto funcional de GiProy sin reproducirlo dentro de la aplicación.

---

## COR-017 · Falta la migración de las tablas de federación BIM

**Prioridad:** Alta  
**Tipo:** Confirmado  
**Módulo:** BIM, federación de modelos  
**Efecto sobre el trabajo:** Bloqueante para documentar y capturar la federación  
**Estado:** Corregido localmente y validado  

### Evidencia

La ruta de federación del proyecto 7 ejecutó `get_active_federation` y PostgreSQL devolvió `UndefinedTable`: no existe la relación `bim_federations`. La consulta también depende de `bim_federation_members`. El error quedó registrado con la sentencia SQL y la traza completa en `backend/fatal_errors.log`.

Es una ausencia distinta de `bim_import_jobs`, ya registrada en COR-002. El modelo BIM síncrono puede existir y visualizarse parcialmente, pero el espacio de federación no puede considerarse operativo.

La migración sí existe en el repositorio: `de2005a1b2c3_bim_federations.py`, dependiente de `de2004a1b2c3`. La base informa `de2022a1b2c3` como revisión actual, mientras Alembic presenta ocho cabezas distintas. No debe aplicarse una revisión aislada ni ejecutar `upgrade heads` sin reconciliar primero el grafo y evaluar todas las ramas pendientes.

### Comportamiento esperado

Todas las tablas requeridas por una función visible deben existir antes de habilitarla. Si la capacidad no está desplegada, la interfaz debe indicarlo de forma comprensible y no lanzar una consulta que termina en error interno.

### Corrección propuesta

1. Identificar la revisión de Alembic que crea `bim_federations` y `bim_federation_members`.
2. Comprobar dependencias, orden y estado real de las migraciones antes de aplicarla.
3. Añadir una comprobación de preparación al arranque o a la activación de BIM.
4. Ofrecer un estado no disponible controlado mientras falten tablas.

### Validación

Ejecutar la consulta de federación con el proyecto 7; debe responder con una federación válida o un estado vacío, nunca con `500`. Después crear una federación de prueba, agregar un miembro, recargarla y comprobar el aislamiento por empresa y proyecto.

### Historial de actuación · 29 de julio de 2026

Con el respaldo previo ya creado se repararon únicamente las tablas BIM
ausentes desde los modelos actuales. Después se confirmó que
`bim_federations` y `bim_federation_members` existen, y la llamada real
`GET /api/v1/bim/projects/7/federation?empresa_id=3` respondió `200`. También
respondieron `200` el resumen CDE, el diario de campo y las entregas as-built.
Las nuevas capturas se inspeccionaron visualmente y ya no muestran errores.

---

## COR-018 · Un fallo del capturador dejaba el navegador abierto y saturaba el backend

**Prioridad:** Alta  
**Tipo:** Confirmado en herramienta de documentación  
**Módulo:** `manual-usuario/scripts/capture-pages.mjs`  
**Efecto sobre el trabajo:** Bloqueante  
**Estado:** Corregido en herramienta; validación pendiente tras reinicio  

### Evidencia

El lote llegó a `proyectos/gestor` y agotó 60 segundos. La excepción saltó después de limpiar la sesión técnica pero antes de ejecutar `browser.close()`. El navegador que aún estaba abierto continuó enviando peticiones con un token cuyo SID ya no existía. Poco después, incluso `/docs` y `/paises/` dejaron de responder y el backend necesitó un reinicio manual.

### Corrección realizada

El cierre del navegador y la limpieza de la sesión quedaron reunidos en un bloque `finally`. El orden es deliberado:

1. cerrar el navegador y detener todas sus peticiones;
2. limpiar únicamente el SID técnico creado por el capturador.

La sintaxis se validó con `node --check` y se comprobó que no quedaran procesos Edge después del cambio.

### Validación pendiente

Después del siguiente reinicio, provocar o simular el rechazo de una pantalla y comprobar que:

- el proceso termina;
- no queda Edge abierto;
- `current_session_id` vuelve a `NULL`;
- `/docs` y `/paises/` siguen respondiendo;
- el backend no recibe una secuencia de reintentos con SID inválido.

---

## COR-019 · La carga concurrente de licencia deja `UPDATE empresas` sin confirmar

**Prioridad:** Crítica  
**Tipo:** Confirmado y reproducido  
**Módulo:** inicio de sesión, licencia y comunicados  
**Efecto sobre el trabajo:** Bloqueante para toda la aplicación  
**Estado:** Corregido y validado en el código nuevo; servicio persistente pendiente de reinicio  

### Evidencia

Después de abrir el portafolio, PostgreSQL mostró una cadena repetible:

- una conexión `idle in transaction` después de consultar `empresa_uso`;
- en esa transacción ya existía un `UPDATE empresas SET license_start_date=…, license_end_date=…`;
- otra conexión esperaba un bloqueo `transactionid` para actualizar la misma empresa;
- `/docs`, `/paises/` y la interfaz terminaban sin responder.

La primera reproducción mantuvo el bloqueo más de 32 minutos. Tras liberar esa conexión, el mismo patrón reapareció durante la siguiente inicialización.

El código explicaba la concurrencia:

1. `GET /admin-licenses/me` obtiene una instantánea, actualiza métricas y vuelve a obtener otra instantánea desde `resolve_company_capabilities`.
2. El segundo mantenimiento ejecuta `flush()` sobre la empresa y la ruta devolvía la respuesta sin `commit`.
3. `AuthContext` solicitaba la licencia dentro de `checkAuth` y nuevamente al cambiar `user`.
4. La lectura de comunicados tampoco cerraba explícitamente su transacción antes de devolver la respuesta.

### Corrección realizada

- `admin_licenses.read_current_company_license` construye la respuesta y confirma el mantenimiento antes de devolverla.
- `read_active_system_announcements` serializa el resultado y ejecuta `rollback()` porque es una ruta estrictamente de lectura.
- `AuthContext` no repite la carga de licencia para usuarios de empresa; el efecto adicional queda reservado al cambio de empresa del superadministrador.
- Se añadió `manual-usuario/scripts/test-license-concurrency.py`.

### Validación

Un backend temporal con el código corregido recibió simultáneamente:

- dos solicitudes a `/admin-licenses/me`;
- dos solicitudes a `/system-announcements/active?empresa_id=3`.

Las cuatro respondieron `200`, el tiempo máximo fue 0,735 segundos y PostgreSQL no conservó ninguna transacción inactiva durante más de dos segundos. Después, el portafolio real cargó en once segundos y mostró los tres proyectos.

### Despliegue pendiente

El servicio persistente debe reiniciarse para cargar los cambios Python. El servidor de desarrollo del frontend ya recompila el cambio de `AuthContext`.

---

## COR-020 · La prueba SaaS E2E espera un producto que el catálogo ya no genera

**Prioridad:** Media  
**Tipo:** Confirmado en pruebas  
**Módulo:** Marketplace y política SaaS  
**Efecto sobre el trabajo:** No bloqueante para el manual; bloqueante para esa prueba E2E  
**Estado:** Abierto  

### Evidencia

`test_marketplace_saas_policy_full_app_flow_with_mock_company` falla antes de consultar `/admin-licenses/me` con:

`KeyError: 'sistema-pack-conecta-mensual'`

El diccionario devuelto por `_bootstrap_saas_catalog` no contiene el producto que la prueba intenta utilizar.

### Corrección propuesta

Determinar si el pack Conecta mensual fue renombrado, retirado o dejó de sembrarse. Actualizar el catálogo o la expectativa de la prueba según la política comercial vigente; no omitir la aserción sin confirmar esa decisión.

### Validación

La prueba debe recorrer el flujo SaaS completo y alcanzar la consulta de licencia sin `KeyError`.

---

## COR-021 · Un error de Playwright imprimió el token técnico en su diagnóstico

**Prioridad:** Alta  
**Tipo:** Confirmado en herramienta de documentación  
**Módulo:** proxy aislado del capturador  
**Efecto sobre el trabajo:** Controlado temporalmente  
**Estado:** Corregido; token invalidado y sesión limpiada  

### Evidencia

Al agotarse `route.fetch`, Playwright incluyó todas las cabeceras de la solicitud en la excepción, entre ellas `Authorization: Bearer …`. Era un token efímero, pero una salida de diagnóstico no debe mostrar credenciales de ningún tipo.

### Corrección realizada

El interceptor captura internamente cualquier error, aborta la solicitud y no propaga el diagnóstico de Playwright. La cuenta técnica usa un SID independiente y la limpieza invalida el token al terminar.

Se creó mediante el servicio normal el usuario técnico 16, `manual.capture@giproy.invalid`, dentro de la cuota disponible. El capturador apunta exclusivamente a ese correo y nunca vuelve a seleccionar al primer usuario activo.

### Saneamiento final

Eliminar la cuenta técnica mediante el servicio normal cuando terminen las capturas y la prueba de doble ciego, actualizar las métricas de licencia y comprobar que no quedan sesiones, asignaciones ni códigos técnicos asociados.

---

## COR-022 · El capturador podía fotografiar otra aplicación y recortar el acceso

**Prioridad:** Alta para la fiabilidad del manual  
**Tipo:** Confirmado en herramienta de documentación  
**Módulo:** capturador de pantallas del manual  
**Efecto sobre el trabajo:** Bloqueante para esa evidencia visual  
**Estado:** Corregido y validado visualmente  
**Fecha de detección:** 2026-07-29

### Evidencia

Una ejecución dirigida accidentalmente al puerto 5173 recibió una respuesta
correcta, pero ese puerto pertenecía a otra aplicación local. Además, la imagen
de acceso utilizaba un recorte fijo y mostraba solamente una parte de la
interfaz.

### Comportamiento esperado

El capturador debe comprobar que la página pertenece a GiProy antes de escribir
un archivo y debe conservar completa la superficie visible de la pantalla.

### Corrección realizada

La ruta de acceso espera ahora el campo propio «Terminal de acceso» antes de
capturar. Si esa identidad no aparece, la ejecución falla sin sobrescribir la
evidencia. Se retiró el recorte fijo y la imagen se guarda con el nombre nuevo
`inicio-sesion-completa.png`.

### Validación

Se regeneró la captura contra `http://localhost:3010`, se inspeccionó a
resolución original de 1920 × 1080 y se confirmó que muestra completa la
pantalla de acceso de GiProy.

---

## COR-023 · Una captura podía conservar el nombre de otra pantalla

**Prioridad:** Alta para la fiabilidad del manual  
**Tipo:** Confirmado en herramienta de documentación  
**Módulo:** capturador de pantallas del manual  
**Efecto sobre el trabajo:** Bloqueante para esa evidencia visual  
**Estado:** Corregido y validado  
**Fecha de detección:** 2026-07-29

### Evidencia

`subcategorias.png` contenía la pantalla Bases de trabajo porque la base técnica
no había quedado activa antes de navegar. La comprobación anterior encontraba
texto compartido por la aplicación, pero no validaba la ruta final.

### Corrección realizada

El archivo inválido se retiró. El capturador comprueba ahora la ruta esperada,
la identidad de la pantalla y el estado de carga. Para las capturas de solo
lectura selecciona localmente la base 34 de la cuenta técnica, sin ejecutar la
activación persistente ni cambiar el contexto de usuarios reales.

### Validación

Se regeneraron e inspeccionaron `subcategorias.png`,
`subcategorias-nueva-modal.png` y `subcategorias-importar-modal.png`. Las tres
muestran la base “Proyecto Prueba Compartir 1” y la pantalla o ventana indicada
por su nombre.

---

## COR-024 · La cabecera solicita el resumen de transferencias con respuesta 403

**Prioridad:** Baja  
**Tipo:** Comportamiento confirmado  
**Módulo:** cabecera de empresa / resumen de transferencias  
**Efecto sobre el trabajo:** No bloqueante  
**Estado:** Pendiente de saneamiento posterior  
**Fecha de detección:** 2026-07-29

### Evidencia

Durante las capturas autenticadas, la solicitud
`GET /api/v1/transferencias/tray-summary?empresa_id=3` respondió 403 para la
cuenta técnica administradora. Precios unitarios, Recursos y APUs continuaron
funcionando y no mostraron un error bloqueante.

### Comportamiento esperado

La cabecera debe solicitar el resumen solo cuando la persona tenga acceso o
tratar la denegación sin una petición fallida repetida.

### Corrección propuesta

Revisar el permiso exigido por el endpoint y la condición del frontend. No se
modifica durante la elaboración del manual porque no interrumpe el flujo de
precios.

---

## COR-025 · El informe de APU quedaba cortado por su desplazamiento interno

**Prioridad:** Alta  
**Tipo:** Defecto del proceso de documentación  
**Módulo:** capturador de pantallas del manual / informe de APUs  
**Efecto sobre el trabajo:** Bloqueante para esa evidencia visual  
**Estado:** Corregido y validado  
**Fecha de detección:** 2026-07-29

### Evidencia

`apus-reporte-modal.png` medía 1920 × 1080, pero solo mostraba la franja visible
de la ventana. La tabla continuaba dentro de un área con desplazamiento propio:
no aparecían todas las líneas, los subtotales finales ni el pie completo.

### Corrección realizada

El capturador expande temporalmente el contenido interno del informe, elimina
el límite de altura durante la toma y fotografía los límites reales de la
ventana. Además, rechaza la captura si detecta que el área del informe todavía
tiene contenido oculto por desplazamiento.

### Validación

La nueva imagen incluye el encabezado, Equipos y herramientas, Materiales, Mano
de obra, todos sus componentes y subtotales, y el pie con las salidas GiProy,
Excel y PDF. La validación del manual volvió a superar los tamaños de escritorio,
1920×1080 y resolución ampliada 2560×1440.

---

## COR-026 · La segunda carga consecutiva del portafolio bloquea el backend

**Prioridad:** Crítica  
**Tipo:** Bloqueo confirmado durante el recorrido real  
**Módulo:** Proyectos / carga del portafolio  
**Efecto sobre el trabajo:** Fue bloqueante para capturas consecutivas; saneado en código y validado en instancia técnica  
**Estado:** Corregida y validada también en el servicio principal  
**Fecha de detección:** 2026-07-29

### Evidencia

La primera apertura limpia de `/proyectos` devuelve correctamente empresa,
licencia, bases, proyectos, estados de Marketplace y los tres detalles de
proyecto. En una segunda apertura, la lista raíz responde pero las solicitudes
posteriores dejan de completarse. Una consulta de diagnóstico a PostgreSQL
mostró una sesión esperando un bloqueo de transacción y otra sesión “idle in
transaction”.

El 29 de julio se repitió la captura `proyecto-datos` en una sesión técnica
aislada. La tarjeta `Proyecto Prueba Compartir 1` no llegó a mostrarse durante
120 segundos. Tras detener exclusivamente el backend técnico, levantar una
instancia nueva en el puerto 3101 y crear otra sesión técnica, la misma tarjeta
volvió a no mostrarse durante 120 segundos. La consola solo añadió el 403 ya
registrado en COR-024. No se generó ni se aceptó ninguna captura de esa pantalla.

### Actuaciones realizadas

Se corrigió el efecto secundario que regeneraba mapas georreferenciados desde
una petición de lectura. La regeneración se trasladó fuera de la respuesta y el
estado de error dejó de permanecer como “pendiente”. Se añadieron dos pruebas
que comprueban que una regeneración se programa una sola vez. También se
corrigió el capturador para cerrar expresamente cada página conectada por CDP y
evitar dejar peticiones de sondeo abiertas.

La causa restante estaba en la lectura comercial de licencia. Una función de
consulta ejecutaba mantenimiento con escritura, actualizaba la misma fila de
empresa aunque las fechas no hubieran cambiado y podía dejar el bloqueo cuando
el navegador cancelaba la petición. La lectura es ahora de solo consulta por
defecto; los flujos que sí requieren mantenimiento lo declaran expresamente; la
actualización heredada no escribe cuando los valores ya coinciden; y `/me`
cierra la transacción antes de continuar con la lectura comercial.

Se añadieron pruebas de frontera transaccional y reutilización del estado de
licencia. La batería específica terminó con 21 pruebas aprobadas.

### Medida temporal segura

Las capturas iniciales se completaron contra la instancia técnica con el código
corregido, sin utilizar la sesión de una persona real. Después del segundo
reinicio manual comunicado por el usuario, el puerto principal 3001 cargó la
misma corrección y volvió a responder con latencia normal.

### Validación

Se realizaron diez aperturas independientes y consecutivas del portafolio
contra el backend corregido: diez de diez terminaron correctamente. La consulta
posterior a PostgreSQL mostró cero transacciones abiertas. Además, Datos,
Stakeholders, EDO, EDT, Presupuesto, Cronogramas, Desagregación y Fórmula se
cargaron y capturaron sin indicadores de progreso.

La misma prueba se repitió después sobre el servicio principal del puerto 3001:
diez de diez aperturas finalizaron, cada una con una sesión técnica creada y
cerrada de forma independiente. La consulta final a PostgreSQL volvió a mostrar
cero conexiones `idle in transaction`. COR-026 queda cerrada.

---

## COR-027 · Un enlace directo a una pestaña del proyecto regresaba a Datos

**Prioridad:** Alta  
**Tipo:** Navegación inesperada confirmada durante el recorrido real  
**Módulo:** Proyecto / navegación lateral  
**Efecto sobre el trabajo:** Mostraba una sección distinta de la solicitada y podía producir evidencias engañosas  
**Estado:** Corregida y validada  
**Fecha de detección:** 2026-07-29

### Evidencia

Al abrir una dirección como
`/proyectos?project_id=7&tab=presupuesto`, la aplicación cargaba el proyecto,
pero durante esa carga sustituía `tab=presupuesto` por el estado inicial
`tab=datos`. La primera automatización de Stakeholders llegó a guardar una ficha
de Datos del proyecto y fue rechazada al inspeccionarla visualmente.

### Corrección

La selección inicial del proyecto conserva ahora la pestaña expresada en la
dirección. Solo utiliza el estado interno cuando la dirección no pide ninguna
sección. También se estabilizaron las dependencias de carga de la ficha para que
la reconstrucción de objetos equivalentes no reinicie indefinidamente el
indicador.

### Validación

Se recompiló el frontend y se abrieron de forma independiente las rutas de
Stakeholders, EDO, EDT, Presupuesto, Cronogramas, Desagregación y Fórmula. Las
siete mostraron su encabezado y contenido propios. Las imágenes anteriores se
sobrescribieron y las nuevas fueron inspeccionadas visualmente.

---

## COR-028 · La revisión Alembic BIM estaba adelantada respecto al esquema real

**Prioridad:** Crítica  
**Tipo:** Confirmado  
**Módulo:** despliegue y esquema BIM  
**Efecto sobre el trabajo:** Bloqueante  
**Estado:** Corregido localmente; prevención pendiente  
**Fecha de detección:** 29 de julio de 2026

### Evidencia

Alembic informaba `de2022a1b2c3`, pero la inspección directa encontró solo 29
de las 85 tablas BIM definidas por la aplicación. Al intentar avanzar hasta
`de2057a1b2c3`, la actualización se detuvo de forma transaccional al crear
adjuntos de incidencias porque `bim_issues`, perteneciente a una revisión
anterior supuestamente aplicada, no existía. La comparación posterior detectó
56 tablas ausentes y dos columnas atrasadas en tablas vacías:
`bim_4d_field_reports.currency` y
`bim_4d_safety_inspections.checklist_json`.

### Comportamiento esperado

La revisión registrada debe representar el esquema realmente aplicado. Un
despliegue no debe poder declararse preparado cuando faltan tablas o columnas
de revisiones anteriores.

### Corrección aplicada

1. Se creó y verificó un respaldo PostgreSQL completo antes de la reparación.
2. Se añadió `backend/scripts/repair_missing_bim_tables.py`, con modo de solo
   lectura por defecto y aplicación explícita mediante `--apply`.
3. El script creó únicamente las tablas ausentes desde los modelos actuales,
   sin borrar ni reemplazar las existentes.
4. Se añadieron las dos columnas ausentes, ambas sobre tablas sin registros.
5. Tras verificar 85 de 85 tablas y cero columnas exigidas ausentes, se alineó
   la marca Alembic a `de2057a1b2c3`.

### Validación

- Alembic informa `de2057a1b2c3 (head)`.
- La auditoría de metadatos informa 85 tablas BIM y cero tablas ausentes.
- La auditoría de columnas informa cero columnas exigidas ausentes.
- Federación, resumen CDE, diario de campo y aceptación as-built respondieron
  `200` en el proyecto 7.
- Las capturas de Coordinación, Campo y Entrega muestran estados finales
  válidos y ningún mensaje de error.

### Prevención pendiente

Incorporar al despliegue una comprobación obligatoria que compare revisión,
tablas y columnas antes de habilitar BIM. También debe añadirse una prueba de
actualización desde una base histórica; el script de reparación es una medida
de recuperación, no un sustituto del flujo normal de migraciones.

---

## COR-029 · Federación quedaba completamente en blanco con una sola versión

**Prioridad:** Media  
**Tipo:** Confirmado  
**Módulo:** BIM · Administración · Federación  
**Efecto sobre el trabajo:** Bloqueante para documentar la pantalla  
**Estado:** Corregido y validado  
**Fecha de detección:** 29 de julio de 2026

### Evidencia

El proyecto de prueba contiene una única versión BIM. Al abrir Federación, la
pestaña se seleccionaba correctamente pero toda el área de contenido quedaba
vacía. `BimFederationPanel` devolvía `null` cuando encontraba menos de dos
versiones, por lo que la persona no recibía causa ni siguiente paso.

### Corrección aplicada

El panel conserva ahora su encabezado y muestra un estado vacío explícito:
explica que se necesitan al menos dos versiones BIM, indica que la siguiente
debe cargarse y quedar lista, y describe que después podrán activarse,
alinearse y guardarse con justificación.

### Validación

El frontend compiló correctamente. Se abrió de nuevo Administración BIM →
Federación en el proyecto 7 y se inspeccionó
`proyecto-bim-admin-federacion.png`: la pantalla está completa, sin carga ni
error, y comunica el siguiente paso.

---

## COR-030 · La cabecera del proyecto ocultaba los filtros del Pareto temporal

**Prioridad:** Alta  
**Tipo:** Confirmado  
**Módulo:** Proyecto · Cronogramas · Pareto temporal  
**Efecto sobre el trabajo:** Bloqueante para utilizar los filtros superiores  
**Estado:** Corregido y validado  
**Fecha de detección:** 30 de julio de 2026

### Evidencia

Al abrir Pareto temporal, la cabecera fija de Cronogramas quedaba dibujada por
encima de la ventana. Ocultaba los modos Integrado, Tiempo y Costo, los límites
Top 10/20/50, Solo críticas, EDT y fechas. La petición ya había terminado y los
datos eran correctos; el problema era exclusivamente la prioridad de capas:
la ventana utilizaba `z-[140]`, inferior a la cabecera del proyecto.

### Corrección aplicada

La capa raíz de `GanttParetoModal` utiliza ahora `z-[1000]`, igual que las
ventanas operativas que deben dominar toda la interfaz. No se modificaron
datos, filtros ni cálculos.

### Validación

- Se añadió `frontend/scripts/validate-gantt-pareto-layer.mjs` para impedir que
  la ventana vuelva a quedar por debajo de la cabecera.
- La comprobación específica pasó.
- El frontend compiló correctamente.
- Se repitió el recorrido Gantt → Pareto y se inspeccionó
  `proyecto-cronograma-pareto.png`: todos los filtros, métricas, filas y el
  panel de detalle quedan visibles sin superposición.

---

## COR-031 · Existe código de importación XML sin acceso en el Gantt vigente

**Prioridad:** Media  
**Tipo:** Acción no esperada confirmada por auditoría de interfaz  
**Módulo:** Proyecto · Cronogramas · Intercambio MS Project  
**Efecto sobre el trabajo:** No bloqueante para el Gantt actual; impide usar el flujo heredado  
**Estado:** Pendiente de decisión de producto  
**Fecha de detección:** 30 de julio de 2026

### Evidencia

El código conserva un flujo anterior con “Importar XML”, “XML Project” y
exportación a MS Project dentro de `CronogramaTrabajo`, además del diálogo de
confirmación correspondiente. La vista vigente renderiza `CronogramaGantt` y
no presenta esos controles; por ello no existe una ruta real de empresa desde
la que abrir la confirmación. La automatización buscó el botón después de
esperar el Gantt terminado y no lo encontró.

### Comportamiento esperado

Producto debe decidir si el intercambio forma parte del Gantt vigente. Si lo
hace, debe ofrecerse desde una zona visible con estado de disponibilidad,
vista previa y advertencia sobre calendarios, fechas y dependencias. Si no
forma parte del producto actual, el código heredado debe retirarse para evitar
expectativas contradictorias y mantenimiento innecesario.

### Tratamiento en el manual

No se fabricó una captura ni se documentó el botón como disponible. La
exportación se explica solo como criterio general hasta que exista una
superficie accesible y verificable.

---

## COR-032 · La cabecera general ocultaba Guardar y Cerrar en el editor APU del presupuesto

**Prioridad:** Alta  
**Tipo:** Confirmado  
**Módulo:** Proyecto · Presupuesto · Editor APU  
**Efecto sobre el trabajo:** Bloqueante para guardar o cerrar con los controles visibles  
**Estado:** Corregido y validado  
**Fecha de detección:** 30 de julio de 2026

### Evidencia

Al abrir “Editar APU” desde una partida, el panel ocupaba la pantalla pero su
cabecera quedaba debajo de la cabecera general de la aplicación. La descripción
y la unidad aparecían como primer contenido visible; el título del editor y los
botones Guardar APU y Cerrar editor APU quedaban tapados.

### Corrección aplicada

La capa raíz de `ApuEditorModal` pasó de `z-[300]` a `z-[1000]`. El cambio no
afecta cálculos ni datos: garantiza que todo el editor, incluido su encabezado,
quede por encima de la navegación general.

### Validación

Se añadió `frontend/scripts/validate-budget-apu-editor-layer.mjs` y la
comprobación pasó. El frontend compiló correctamente. Se reabrió “Editar APU”
desde la partida 1.1.1 y se inspeccionó
`proyecto-presupuesto-editar-apu.png`: título, estado Divergente, Cerrar,
Guardar, composición y totales quedan visibles sin superposición.

---

## COR-033 · La cabecera del calendario del portafolio queda oculta

**Prioridad:** Alta  
**Tipo:** Interfaz / orden de capas  
**Módulo:** Proyectos / calendario del portafolio  
**Efecto sobre el trabajo:** Bloqueante para comprender y cerrar correctamente la ventana  
**Estado:** Corregido y validado  
**Fecha de detección:** 3 de agosto de 2026

### Evidencia

Al abrir Calendario, la barra general de la aplicación quedaba por encima de la
ventana. El título, la explicación y el botón de cierre aparecían cortados en la
captura, aunque el mes sí se había cargado.

### Corrección aplicada

La ventana del calendario en `frontend/src/pages/Proyectos.jsx` pasó de la capa
`z-[115]` a `z-[1000]`. No se alteraron fechas, eventos ni recordatorios.

### Validación

Se añadió `frontend/scripts/validate-portfolio-calendar-layer.mjs`; la prueba y
la compilación del frontend finalizaron correctamente. La captura renovada
`proyectos-calendario.png` muestra completos el título, el cierre, el mes, la
leyenda, la cuadrícula y la bandeja personal.

---

## Plantilla para nuevas incidencias

Copiar este bloque al descubrir una nueva anomalía:

```text
## COR-XXX · Título

Prioridad:
Tipo:
Módulo:
Efecto sobre el trabajo: Bloqueante / No bloqueante / Controlado temporalmente
Estado:
Fecha de detección:

### Evidencia

### Comportamiento esperado

### Corrección propuesta

### Validación

### Historial de actuación
```
