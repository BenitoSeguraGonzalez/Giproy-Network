# Seguimiento pantalla por pantalla de la adecuacion adaptativa

Estado general: EN CURSO  
Mapa maestro: `docs/architecture/ADAPTIVE_SCREEN_APPROVAL_MAP.md`  
Version de trabajo: `3.1.0-beta.6`  
Despliegue: NO REALIZADO; la beta publica permanece en `3.1.0-beta.5`

## Estados

- PENDIENTE: aun no observada individualmente.
- ANALIZANDO: capturas y DOM en revision.
- PROPUESTA: solucion definida, pendiente de implementacion.
- IMPLEMENTADA: cambio local realizado.
- VERIFICADA LOCALMENTE: capturas, DOM y build aprobados.
- CERTIFICADA FISICAMENTE: confirmada en dispositivos reales requeridos.
- BLOQUEADA: existe una dependencia documentada.

## G00.1 - Shell protegido

Estado: **VERIFICADA LOCALMENTE**  
Fecha: 2026-07-24

### Superficie observada

- Cabecera global protegida.
- Marca y version.
- Contexto de empresa, licencia y base tecnica.
- Acciones de distribucion, usuario y salida.
- Viewport de la pagina consumidora.
- Composicion horizontal y vertical.

### Problema observado

El perfil portable utilizaba una unica fila para cualquier orientacion. En
tablet vertical intentaba conservar marca, contexto y acciones en el mismo eje,
reduciendo el espacio informativo y dependiendo del truncado. Era una
compactacion del escritorio, no una composicion especifica de tablet.

### Adecuacion aplicada

- Escritorio y tablet horizontal conservan una sola fila.
- Tablet vertical usa dos filas estructurales:
  - primera: marca/version y acciones globales;
  - segunda: contexto operativo, licencia y base tecnica.
- El contexto dispone de desplazamiento horizontal propio solo si datos reales
  excepcionalmente largos exceden el ancho.
- El viewport de la pagina sigue siendo el unico propietario del scroll del
  contenido; la cabecera no se desplaza con las listas internas.
- La marca se convirtio en un boton semantico sin cambiar su accion.
- No se aplico zoom, `transform: scale` ni reduccion global de tipografia.

### Perfiles verificados

- Windows FHD 100 %, 125 % y 150 %.
- Windows 4K/DPR 2.
- Tablet Full HD horizontal y vertical.
- Tablet 2K horizontal y vertical.
- Lenovo P12 3K horizontal y vertical.

Resultado: **10/10 PASS**.

### Verificaciones

- Build Vite de produccion: PASS.
- `validate-adaptive-app-layout-dom.mjs`: PASS en diez perfiles.
- Marca y acciones no se solapan.
- En vertical, el contexto ocupa una segunda fila geometrica real.
- Cabecera completamente dentro del viewport.
- Sin overflow de documento.
- Inicio y final del contenido alcanzables desde el viewport de pagina.

### Evidencia

- Antes:
  `artifacts/visual-certification/2026-07-24T23-19-32-300Z`.
- Despues:
  `artifacts/visual-certification/2026-07-24T23-24-36-270Z`.
- Captura Full HD vertical:
  `tablet-fhd-portrait/adaptive-app-layout-harness.png`.
- Captura Full HD horizontal:
  `tablet-fhd-landscape/adaptive-app-layout-harness.png`.
- Capturas equivalentes 2K y Lenovo incluidas en el mismo directorio.

### Archivos tratados

- `frontend/src/layouts/AppLayout.jsx`.
- `frontend/scripts/validate-adaptive-app-layout-dom.mjs`.
- `frontend/scripts/generate-visual-surface-inventory.mjs`.
- `docs/architecture/visual-surface-inventory.json`.
- `docs/architecture/ADAPTIVE_SCREEN_APPROVAL_MAP.md`.

### Detector visual

La ejecucion unica de Impeccable no encontro errores bloqueantes y registro tres
avisos que se conservan para tratamiento explicito:

1. `border-accent-on-rounded` en la marca, por el borde inferior naranja de 2 px.
   Es parte del tratamiento visual actual; debe decidirse dentro de G00.4/G00.5.
2. `gray-on-color` en un estado hover naranja.
3. `gray-on-color` en un estado hover rojo.

Los avisos de color requieren medicion de contraste en G00.10. No se alteraron
silenciosamente durante la correccion estructural del shell.

### Pendiente de cierre

- Confirmacion en navegadores de tablet fisica.
- Estado final futuro: CERTIFICADA FISICAMENTE.

## G00.2 - Navegacion global

Estado: **VERIFICADA LOCALMENTE**  
Fecha: 2026-07-24

### Superficie observada

- Selector de empresa de la cabecera protegida.
- Control de distribucion adaptable.
- Apertura, cierre exterior y cierre por teclado.
- Retorno de foco al disparador.
- Limites del menu frente al viewport visual.
- Contenido realista con nombres de empresa extensos.

### Problema observado

Los desplegables globales dependian principalmente del clic en su disparador.
No existia un contrato completo de cierre exterior, tecla Escape y restitucion
de foco. Sus dimensiones tampoco estaban limitadas simultaneamente por ancho y
alto del viewport, por lo que una tablet vertical o una ventana con DPI elevado
podia dejar acciones fuera del area visible.

### Adecuacion aplicada

- Ambos controles se cierran con interaccion exterior basada en `pointerdown`,
  valida para raton, lapiz y tactil.
- Escape cierra el desplegable y devuelve el foco al boton que lo abrio.
- Los disparadores exponen relaciones ARIA con sus paneles.
- Los paneles tienen ancho y alto acotados por el viewport dinamico.
- El contenido extenso se desplaza dentro del panel, no desplaza la pagina.
- El selector de empresa se verifico con dos empresas y un nombre largo.
- El harness usa el rol de maxima densidad para no ocultar acciones globales.
- No se aplico escalado global ni reduccion artificial del sistema.

### Perfiles verificados

- Windows FHD 100 %, 125 % y 150 %.
- Windows 4K/DPR 2.
- Tablet Full HD horizontal y vertical.
- Tablet 2K horizontal y vertical.
- Lenovo P12 3K horizontal y vertical.

Resultado: **10/10 PASS**.

### Verificaciones

- Build Vite de produccion: PASS.
- `validate-adaptive-app-layout-dom.mjs`: PASS.
- Paneles completamente contenidos en el viewport.
- Desplazamiento interno disponible cuando el contenido lo requiere.
- Cierre exterior funcional con entrada de puntero.
- Cierre con Escape y retorno de foco: PASS.
- Selector de empresa con datos realistas: PASS.
- `git diff --check`: PASS.

### Evidencia

- Matriz de navegacion abierta:
  `artifacts/visual-certification/g00-2-navigation-2026-07-24`.
- Incluye diez capturas, una por perfil certificado.

### Archivos tratados

- `frontend/src/layouts/AppLayout.jsx`.
- `frontend/src/components/ui/AdaptiveLayoutControl.jsx`.
- `frontend/src/features/adaptive/AdaptiveAppLayoutHarness.jsx`.
- `frontend/scripts/validate-adaptive-app-layout-dom.mjs`.
- `docs/architecture/ADAPTIVE_SCREEN_APPROVAL_MAP.md`.

### Detector visual

La ejecucion unica de Impeccable no encontro errores bloqueantes. Registro:

1. `border-accent-on-rounded` en la marca global, ya inventariado en G00.1.
2. Dos avisos `gray-on-color` en estados de AppLayout.
3. Dos avisos `gray-on-color` en AdaptiveLayoutControl.

Los avisos de contraste quedan registrados para medicion y resolucion conjunta
en G00.10; no se ignoran ni se alteran sin comprobar el sistema cromatico.

### Pendiente de cierre

- Confirmacion tactil en los navegadores de las tabletas fisicas.
- Estado final futuro: CERTIFICADA FISICAMENTE.

## G00.3 - Pie y version

Estado: **VERIFICADA LOCALMENTE**
Fecha: 2026-07-24

### Superficie observada

- Version del shell protegido.
- Version y pie de la Consola de Operaciones.
- Pie alcanzable del login.
- Indicadores de navegacion del pie.
- Manifiesto compilado `version.json`.
- Fuente canonica y archivos de bloqueo de dependencias.

### Problema observado

El texto de version ya procedia de la fuente canonica, pero el contrato de
prueba solo cubria tres viewports y no comprobaba conjuntamente el header
protegido, el pie del dashboard, el manifiesto compilado ni la coherencia del
lock. Ademas, los indicadores del pie eran barras de 4 px usadas directamente
como botones: visibles con raton, pero inadecuadas como objetivos tactiles.

Durante la validacion se detecto tambien que `/version.json` no existe en el
servidor Vite de desarrollo porque el plugin lo emite en `generateBundle`.
La prueba se corrigio en su raiz: localmente valida el artefacto real de
`dist`, y contra un entorno publicado valida la URL HTTP sin cache.

### Adecuacion aplicada

- Los indicadores conservan su barra visual, pero disponen ahora de un objetivo
  tactil real de 44 x 44 px o superior.
- Se incorporo foco visible y `touch-manipulation`.
- El grupo de indicadores tiene semantica de navegacion entre modulos.
- Metadatos, version y estado pueden recomponerse sin desbordamiento.
- La version visible del dashboard dispone de un marcador verificable propio.
- La prueba valida `package.json`, `package-lock.json`, `dist/version.json`,
  login, header protegido y dashboard en una misma version.
- No se introdujo una version paralela ni un release alternativo.

### Perfiles verificados

- Windows FHD 100 %, 125 % y 150 %.
- Windows 4K/DPR 2.
- Tablet Full HD horizontal y vertical.
- Tablet 2K horizontal y vertical.
- Lenovo P12 3K horizontal y vertical.

Resultado: **10/10 PASS**.

### Verificaciones

- Build Vite de produccion: PASS.
- `validate-release-visibility-dom.mjs`: PASS en diez perfiles.
- Fuente canonica, lock y manifiesto compilado: coinciden en `3.1.0-beta.6`.
- Version visible en login, shell y dashboard: coincide.
- Footer contenido en viewport: PASS.
- Sin overflow horizontal del documento: PASS.
- Objetivos tactiles de indicadores >= 44 x 44 px: PASS.
- Matriz visual del dashboard: 10/10 PASS.

### Evidencia

- Antes:
  `artifacts/visual-certification/g00-3-footer-before-2026-07-24`.
- Despues:
  `artifacts/visual-certification/g00-3-footer-after-2026-07-24`.
- Ambos directorios contienen los diez perfiles.

### Archivos tratados

- `frontend/src/pages/Dashboard.jsx`.
- `frontend/scripts/validate-release-visibility-dom.mjs`.
- `docs/architecture/ADAPTIVE_SCREEN_APPROVAL_MAP.md`.
- `docs/tasks/ADAPTIVE_SCREEN_PROGRESS.md`.

### Detector visual

La ejecucion unica de Impeccable sobre `Dashboard.jsx` devolvio cero hallazgos.

### Pendiente de cierre

- Confirmacion de la version y los objetivos tactiles en tablet fisica despues
  del despliegue final.
- Estado final futuro: CERTIFICADA FISICAMENTE.

## G00.4 - Sistema tipografico

Estado: **VERIFICADA LOCALMENTE**
Fecha: 2026-07-24

### Superficie observada

- Marca y version del shell protegido.
- Etiquetas de empresa, proyecto, licencia y base tecnica.
- Selector global de empresa.
- Texto operativo, metadatos, truncado y altura de linea.
- Comportamiento con DPR y viewport CSS en diez perfiles.

### Problema observado

La cabecera mezclaba metadatos de 7, 8 y 9 px con `leading-none` y tracking
amplio. Windows con DPI alto no convierte una resolucion fisica grande en mas
espacio CSS; por ello estos textos seguian siendo pequeños y algunos dependian
del recorte para caber.

El inventario completo ha localizado 1.356 declaraciones explicitas inferiores
a 10 px en el frontend: 1 de 5 px, 1 de 6 px, 10 de 6,5 px, 78 de 7 px, 13 de
7,5 px, 466 de 8 px, 7 de 8,5 px, 777 de 9 px y 3 de 9,5 px. No se sustituyen
masivamente: cada consumidor se corregira en su unidad para evitar destruir
tablas, diagramas o jerarquias especializadas. El inventario queda registrado,
no ignorado.

### Adecuacion aplicada

- Metadatos operativos de la cabecera suben a 10 px.
- Version visible sube a 9 px con contraste reforzado.
- Selector de empresa usa texto de 10 px y altura propia.
- Licencia, proyecto y base usan alturas de linea que permiten glifos completos.
- El color naranja informativo se oscurece donde contiene texto pequeño.
- La fila contextual vertical pasa a dimensionarse por contenido real.
- Se añade una prueba que detecta cualquier descendiente textual recortado.
- Marca, acciones y contexto deben quedar contenidos por la cabecera.
- No se cambia el tamaño raiz, el zoom ni la escala global.

### Incidencia encontrada durante la inspeccion

La primera elevacion tipografica hizo visible que la segunda fila conservaba
una altura fija de 44 px. El DOM general seguia pasando, pero la captura Full HD
vertical revelo recorte de glifos. Se detuvo la unidad, se corrigio la fila a
un minimo de 52 px gobernado por contenido y se incorporo la regresion al test.

### Perfiles verificados

- Windows FHD 100 %, 125 % y 150 %.
- Windows 4K/DPR 2.
- Tablet Full HD horizontal y vertical.
- Tablet 2K horizontal y vertical.
- Lenovo P12 3K horizontal y vertical.

Resultado final: **10/10 PASS**.

### Verificaciones

- Build Vite de produccion: PASS.
- `validate-adaptive-app-layout-dom.mjs`: PASS.
- Texto contextual sin clipping: PASS.
- Regiones de cabecera contenidas verticalmente: PASS.
- Sin solapamiento entre marca y acciones: PASS.
- Sin overflow del documento: PASS.
- Inspeccion visual vertical Full HD y 2K: PASS tras correccion.

### Evidencia

- Captura que permitio detectar el recorte:
  `artifacts/visual-certification/g00-4-typography-2026-07-24`.
- Resultado corregido:
  `artifacts/visual-certification/g00-4-typography-final-2026-07-24`.

### Archivos tratados

- `frontend/src/layouts/AppLayout.jsx`.
- `frontend/scripts/validate-adaptive-app-layout-dom.mjs`.
- `docs/architecture/ADAPTIVE_SCREEN_APPROVAL_MAP.md`.
- `docs/tasks/ADAPTIVE_SCREEN_PROGRESS.md`.

### Detector visual

La ejecucion unica de Impeccable no encontro errores bloqueantes. Reitero los
tres avisos ya inventariados: acento inferior de marca y dos combinaciones de
color en estados hover. Permanecen asignados a G00.10 para medicion objetiva.

### Regla para las unidades consumidoras

Cada pantalla corregira sus textos inferiores a 10 px segun su funcion:
metadato, dato tabular, etiqueta, diagrama o adorno. Ninguna sustitucion global
se considerara una solucion valida.

## G00.5 - Densidad y espaciado

Estado: **VERIFICADA LOCALMENTE**
Fecha: 2026-07-24

### Superficie observada

- Clasificador de entorno adaptativo.
- Shell protegido y Consola de Operaciones.
- Separaciones exteriores, ritmo entre secciones y objetivos de control.
- Windows con escalado y tablets tactiles con el mismo viewport CSS.

### Problema observado

La aplicacion distinguia perfiles de composicion, pero no publicaba un contrato
de densidad separado. Como consecuencia, cada pantalla podia interpretar
`compact` como texto pequeño o confundir DPR alto con espacio disponible.
Ademas, el dashboard mantenia gutters ligados exclusivamente a breakpoints.

### Adecuacion aplicada

- Se crean tres densidades semanticas:
  - `comfortable`: escritorio con espacio CSS amplio;
  - `compact`: escritorio con espacio CSS limitado por ventana o escalado;
  - `touch`: entrada tactil, independientemente del DPR.
- El shell publica `data-adaptive-density`.
- Se definen variables de gutter, ritmo y objetivo interactivo por densidad.
- Dashboard consume gutters y separación vertical semanticos.
- Touch conserva 44 px; compact no reduce tipografia ni escala componentes.
- DPR deja de intervenir en la densidad; solo representa nitidez fisica.

### Incidencia encontrada durante la prueba

La primera asercion del DOM consultaba `touch` en un perfil local cuyo campo se
llama `hasTouch`. La aplicacion clasificaba correctamente, pero el test esperaba
`compact`. Se corrigio la prueba para usar el contrato real y se repitio toda
la cadena. No se rebajo ni omitio la asercion.

### Perfiles verificados

- Windows FHD 100 %, 125 % y 150 %.
- Windows 4K/DPR 2.
- Tablet Full HD horizontal y vertical.
- Tablet 2K horizontal y vertical.
- Lenovo P12 3K horizontal y vertical.

Resultado: **20/20 PASS** sobre shell y dashboard.

### Verificaciones

- Clasificador unitario: PASS.
- Validador DOM del shell: PASS.
- Build Vite de produccion: PASS.
- Matriz visual de dos superficies por diez perfiles: PASS.
- Sin overflow horizontal, clipping fijo ni escalado global.

### Evidencia

- `artifacts/visual-certification/g00-5-density-2026-07-24`.

### Archivos tratados

- `frontend/src/utils/adaptiveLayout.js`.
- `frontend/src/layouts/AppLayout.jsx`.
- `frontend/src/index.css`.
- `frontend/src/pages/Dashboard.jsx`.
- `frontend/scripts/smoke-adaptive-layout-profiles.mjs`.
- `frontend/scripts/validate-adaptive-app-layout-dom.mjs`.
- `docs/architecture/ADAPTIVE_SCREEN_APPROVAL_MAP.md`.
- `docs/tasks/ADAPTIVE_SCREEN_PROGRESS.md`.

### Detector visual

La ejecucion unica de Impeccable no encontro errores bloqueantes. Registro los
tres avisos ya conocidos de AppLayout y uno sobre la fuente Inter global. La
fuente no se sustituye durante una adecuacion de densidad: hacerlo afectaria
metricas de todas las pantallas sin su certificacion individual.

## G00.6 - Tablas y listas

Estado: **VERIFICADA LOCALMENTE**
Fecha: 2026-07-24

### Superficie observada

- Componente compartido `Table`.
- Tabla ancha del harness operativo.
- Listado real de proyectos con doce registros representativos.
- Controles superiores, scroll vertical, scroll horizontal y cabecera.

### Problema observado

El componente comun exponia un `overflow-auto` anonimo, sin nombre accesible,
foco de teclado ni declaracion del eje que le pertenece. En Proyectos, la lista
ya tenia scroll propio tras la correccion anterior, pero su cabecera desaparecia
al recorrer registros y la region no era alcanzable por teclado como unidad.

### Adecuacion aplicada

- `Table` declara por defecto propiedad del eje horizontal.
- Permite solicitar ambos ejes de forma explicita con `scrollAxis="both"`.
- La region de scroll tiene nombre accesible, foco visible y teclado.
- Se pueden configurar clases y atributos del viewport sin envolver la tabla
  con contenedores paralelos.
- El harness utiliza el componente compartido con datos y números tabulares.
- Proyectos identifica su lista como region desplazable.
- La cabecera de columnas permanece fija dentro de la lista.
- Los controles del portafolio permanecen fuera del scroll de registros.

### Contrato verificado

- Scroll vertical de una lista no mueve los controles.
- Scroll horizontal no mueve el viewport de pagina.
- Tabla horizontal no secuestra el eje vertical.
- Inicio y final permanecen alcanzables.
- Cabecera de Proyectos permanece alineada al borde superior de su viewport.
- Las superficies anchas sin ancestro desplazable se consideran error.

### Perfiles verificados

- Windows FHD 100 %, 125 % y 150 %.
- Windows 4K/DPR 2.
- Tablet Full HD horizontal y vertical.
- Tablet 2K horizontal y vertical.
- Lenovo P12 3K horizontal y vertical.

Resultado final: **20/20 PASS** sobre tabla compartida y Proyectos.

### Verificaciones

- Auditoria estatica: 38 rutas y 166 superficies JSX, PASS.
- Validador DOM del shell y tabla: PASS.
- Matriz Playwright con gesto tactil real en Proyectos: PASS.
- Scroll vertical interno y controles inmoviles: PASS.
- Scroll horizontal alcanzable: PASS.
- Cabecera sticky dentro del listado: PASS.
- Build Vite de produccion: PASS.

### Evidencia

- Primera matriz:
  `artifacts/visual-certification/g00-6-table-list-2026-07-24`.
- Matriz final con cabecera fija y contrato ampliado:
  `artifacts/visual-certification/g00-6-table-list-final-2026-07-24`.

### Archivos tratados

- `frontend/src/components/ui/table.jsx`.
- `frontend/src/features/adaptive/AdaptiveAppLayoutHarness.jsx`.
- `frontend/src/pages/Proyectos.jsx`.
- `frontend/scripts/validate-adaptive-app-layout-dom.mjs`.
- `frontend/scripts/certify-visual-surface-matrix.mjs`.
- `docs/architecture/ADAPTIVE_SCREEN_APPROVAL_MAP.md`.
- `docs/tasks/ADAPTIVE_SCREEN_PROGRESS.md`.

### Detector visual

Las ejecuciones unicas por objetivo de Impeccable devolvieron cero hallazgos
para el componente compartido, el harness y Proyectos.

## G00.7 - Formularios

Estado: **VERIFICADA LOCALMENTE**
Fecha: 2026-07-24

### Superficie observada

- `Input`, `Textarea` y `Label` compartidos.
- Formulario representativo con campos cortos, texto largo y dos acciones.
- Reflujo de una y dos columnas.
- Reduccion del viewport visual equivalente a teclado virtual.

### Problema observado

Los inputs comunes fijaban 36 px de alto incluso en touch. El foco era de un
solo pixel y no existia tratamiento compartido para `aria-invalid`. Los
formularios consumidores podian recomponer columnas, pero el control base no
garantizaba un objetivo tactil compatible con la densidad detectada.

### Adecuacion aplicada

- Input consume el objetivo de control de la densidad semantica.
- Touch obtiene un minimo real de 44 px.
- Textarea conserva 60 px como minimo y puede crecer verticalmente.
- Foco visible de 2 px con offset.
- `aria-invalid` obtiene borde y anillo de error sin depender de una pantalla.
- El harness incluye etiquetas asociadas, reflujo, textarea y acciones.
- La accion primaria se desplaza al area visible al reducirse el viewport.
- No se aplica zoom, cambio de tamaño raiz ni compresion tipografica.

### Perfiles verificados

- Windows FHD 100 %, 125 % y 150 %.
- Windows 4K/DPR 2.
- Tablet Full HD horizontal y vertical.
- Tablet 2K horizontal y vertical.
- Lenovo P12 3K horizontal y vertical.

Resultado: **10/10 PASS**.

### Verificaciones

- Todos los controles quedan dentro del viewport: PASS.
- Controles touch >= 44 px: PASS.
- Accion primaria alcanzable con altura reducida al 55 %: PASS.
- Build Vite de produccion: PASS.
- Validador DOM: PASS.
- Matriz visual: PASS.

### Evidencia

- `artifacts/visual-certification/g00-7-forms-2026-07-24`.

### Archivos tratados

- `frontend/src/components/ui/input.jsx`.
- `frontend/src/components/ui/textarea.jsx`.
- `frontend/src/features/adaptive/AdaptiveAppLayoutHarness.jsx`.
- `frontend/scripts/validate-adaptive-app-layout-dom.mjs`.
- `docs/architecture/ADAPTIVE_SCREEN_APPROVAL_MAP.md`.
- `docs/tasks/ADAPTIVE_SCREEN_PROGRESS.md`.

### Detector visual

La ejecucion unica de Impeccable devolvio cero hallazgos.

## G00.8 - Overlays

Estado: **VERIFICADA LOCALMENTE**
Fecha: 2026-07-24

### Superficie observada

- `AppModalShell`, header, body y footer compartidos.
- Modal con contenido extenso.
- Overlay frente al shell protegido.
- Foco inicial, ciclo de Tab, Escape y restitucion del foco.
- Scroll interno en diez perfiles.

### Problemas observados

- El panel completo era el propietario del scroll: header y footer podian
  desaparecer con contenido largo.
- Faltaban `role="dialog"`, `aria-modal`, nombre accesible y trampa de foco.
- Escape no pertenecia a la shell comun.
- El z-index por defecto era 120 y la cabecera global usa 500. La captura real
  demostro que el modal quedaba por debajo del header, aunque su geometria
  estuviera dentro del viewport.

### Adecuacion aplicada

- Panel modal pasa a estructura flex vertical acotada por `100dvh`.
- Solo `AppModalBody` posee el scroll vertical.
- Header y footer son regiones persistentes y no encogibles.
- Footer puede recomponer acciones en varias lineas.
- Dialogo expone semantica y nombre accesible.
- Foco inicial contenido, ciclo de Tab, Escape y retorno al disparador.
- Boton de cierre recibe nombre accesible.
- Overlay por defecto sube a `z-[1000]`, por encima del shell global.
- El test compara de forma explicita ambos niveles de apilamiento.

### Incidencias encontradas durante la prueba

1. La primera medida se tomo durante la animacion de 180 ms y produjo un falso
   desplazamiento de cinco pixeles. Se sincronizo con el fin de la animacion.
2. El contenido inicial no excedia un monitor alto de 1440 px. Se amplio el
   dataset del harness para probar scroll en todos los perfiles.
3. La inspeccion visual descubrio el modal bajo la cabecera. Se corrigio el
   z-index global y se genero una segunda matriz de capturas.

### Perfiles verificados

- Windows FHD 100 %, 125 % y 150 %.
- Windows 4K/DPR 2.
- Tablet Full HD horizontal y vertical.
- Tablet 2K horizontal y vertical.
- Lenovo P12 3K horizontal y vertical.

Resultado: **10/10 PASS**.

### Verificaciones

- Modal contenido por el viewport: PASS.
- Cuerpo con scroll propio: PASS.
- Header y footer inmoviles al recorrer el cuerpo: PASS.
- Overlay sobre cabecera global: PASS.
- Escape y retorno de foco: PASS.
- Build Vite de produccion: PASS.

### Evidencia

- Evidencia que descubrio el error de apilamiento:
  `artifacts/visual-certification/g00-8-overlays-2026-07-24`.
- Evidencia final corregida:
  `artifacts/visual-certification/g00-8-overlays-final-2026-07-24`.

### Archivos tratados

- `frontend/src/components/ui/app-modal.jsx`.
- `frontend/src/features/adaptive/AdaptiveAppLayoutHarness.jsx`.
- `frontend/scripts/validate-adaptive-app-layout-dom.mjs`.
- `docs/architecture/ADAPTIVE_SCREEN_APPROVAL_MAP.md`.
- `docs/tasks/ADAPTIVE_SCREEN_PROGRESS.md`.

### Detector visual

La ejecucion unica de Impeccable devolvio cero hallazgos.

## G00.9 - Estados asincronos

Estado: **VERIFICADA LOCALMENTE**
Fecha: 2026-07-24

### Superficie observada

- Carga previa al shell protegido.
- Estados compartidos de carga, vacio, error, sin conexion y permisos
  insuficientes.
- Accion de recuperacion con entrada tactil.
- Mensajes extensos y recomposicion en diez perfiles.

### Problemas observados

- No existia un contrato visual y semantico comun para estados asincronos.
- La carga de `ProtectedRoute` era una composicion aislada, sin region viva ni
  descripcion del proceso.
- Los consumidores podian improvisar alturas fijas, spinners y acciones sin
  objetivo tactil coherente.
- El movimiento del spinner no respetaba `prefers-reduced-motion`.

### Adecuacion aplicada

- Nuevo `AsyncState` compartido con variantes `loading`, `empty`, `error`,
  `offline` y `forbidden`.
- La carga declara `aria-busy` y region viva; el error usa alerta inmediata.
- Contenedor fluido, texto con reflujo y alturas minimas, sin bloquear el alto
  completo de la pantalla.
- Accion opcional con objetivo semantico de 44 px en entorno tactil.
- Spinner se inmoviliza cuando el usuario solicita movimiento reducido.
- `ProtectedRoute` adopta el contrato global.
- La migracion de estados particulares se ejecutara pantalla a pantalla para
  conservar su significado y sus acciones; no se hizo un reemplazo masivo
  ciego.

### Incidencias encontradas durante la prueba

1. La primera invocacion del detector se ejecuto desde `frontend` con rutas que
   repetian ese directorio. El proceso aviso que no podia leer los tres
   objetivos; su salida vacia fue invalidada y no se considero un resultado.
2. Se repitio la auditoria con las rutas reales. Esta ejecucion valida devolvio
   cero hallazgos.
3. El build conserva el aviso previo de chunks superiores a 500 kB. Es deuda de
   rendimiento documentada y no un fallo geometrico de esta unidad.

### Perfiles verificados

- Windows FHD 100 %, 125 % y 150 %.
- Windows 4K/DPR 2.
- Tablet Full HD horizontal y vertical.
- Tablet 2K horizontal y vertical.
- Lenovo P12 3K horizontal y vertical.

Resultado: **10/10 PASS**.

### Verificaciones

- Estados contenidos por el viewport: PASS.
- Carga y error con semantica anunciable: PASS.
- Reintento tactil de al menos 44 px: PASS.
- Sin overflow del documento: PASS.
- Reduced motion en spinner: PASS por inspeccion del contrato CSS.
- Build Vite de produccion: PASS.

### Evidencia

- `artifacts/visual-certification/g00-9-async-states-final-2026-07-24`.

### Archivos tratados

- `frontend/src/components/ui/async-state.jsx`.
- `frontend/src/components/ProtectedRoute.jsx`.
- `frontend/src/features/adaptive/AdaptiveAppLayoutHarness.jsx`.
- `frontend/scripts/validate-adaptive-app-layout-dom.mjs`.
- `docs/architecture/ADAPTIVE_SCREEN_APPROVAL_MAP.md`.
- `docs/tasks/ADAPTIVE_SCREEN_PROGRESS.md`.

### Detector visual

La ejecucion valida de Impeccable devolvio cero hallazgos.

## Siguiente unidad

`G00.10 - Accesibilidad operativa`: EN CURSO.
