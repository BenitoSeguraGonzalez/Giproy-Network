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

## G00.10 - Accesibilidad operativa

Estado: **VERIFICADA LOCALMENTE**
Fecha: 2026-07-24

### Superficie observada

- Foco de teclado sobre controles dentro del shell adaptativo.
- Objetivos tactiles declarados por componentes.
- Contraste de acciones primarias y de recuperacion.
- Animaciones y transiciones con preferencia de movimiento reducido.
- Orden operativo de tabulacion en shell, formulario, tabla y modal.

### Problemas observados

- El foco dependia de reglas locales y en varios componentes era de solo 1 px.
- No existia una politica adaptativa global para `prefers-reduced-motion`.
- El naranja corporativo `#F39200` con texto blanco no es valido para texto
  normal; no debe utilizarse como fondo de acciones textuales pequeñas.
- Aplicar 44x44 de manera indiscriminada a todo elemento interactivo altera
  composiciones internas, como chips dentro del contexto de empresa.

### Adecuacion aplicada

- Foco global adaptativo de 3 px, con separacion de 2 px, para elementos
  interactivos alcanzados por teclado.
- Movimiento y transiciones se reducen a una duracion efectiva minima cuando
  el sistema operativo lo solicita.
- Las acciones de prueba con texto blanco usan `#B45309`, conservando la
  identidad naranja con contraste operativo suficiente.
- El contrato tactil se aplica explicitamente mediante
  `data-adaptive-touch-target`; cada pantalla declara sus controles durante su
  adecuacion, sin agrandar indiscriminadamente todos los elementos.
- El validador mide geometria tactil, foco no dependiente solo del color,
  contraste minimo 4.5:1 y comportamiento bajo reduced motion.

### Incidencias encontradas durante la prueba

1. La primera asercion de reduced motion comparaba el texto literal de la
   duracion. Chromium normalizo la unidad y genero un falso negativo. El test
   se corrigio para medir milisegundos efectivos o ausencia de animacion.
2. La primera regla de objetivos tactiles alcanzaba todos los botones. La
   matriz detecto que el selector de empresa crecia y rebasaba la cabecera en
   tablet Full HD horizontal. La regla se retiro y se sustituyo por contrato
   explicito por componente. La matriz corregida pasa completa.
3. Impeccable marco `Inter` como fuente muy utilizada. Es una decision
   tipografica existente de producto; cambiarla globalmente excederia esta
   unidad y alteraria metricas de todas las pantallas. El hallazgo queda
   documentado para decision de identidad visual.
4. Permanece el aviso previo de chunks de produccion superiores a 500 kB.

### Perfiles verificados

- Windows FHD 100 %, 125 % y 150 %.
- Windows 4K/DPR 2.
- Tablet Full HD horizontal y vertical.
- Tablet 2K horizontal y vertical.
- Lenovo P12 3K horizontal y vertical.

Resultado final: **10/10 PASS**.

### Verificaciones

- Foco visible de al menos 2 px y separado del control: PASS.
- Controles declarados tactiles de al menos 44x44: PASS.
- Accion representativa con contraste de al menos 4.5:1: PASS.
- Reduced motion efectivo: PASS.
- Sin regresion geometrica del header: PASS.
- Build Vite de produccion: PASS.

### Evidencia

- Matriz que descubrio la regresion:
  `artifacts/visual-certification/g00-10-accessibility-final-2026-07-24`.
- Matriz final corregida:
  `artifacts/visual-certification/g00-10-accessibility-corrected-2026-07-24`.

### Archivos tratados

- `frontend/src/index.css`.
- `frontend/src/components/ui/async-state.jsx`.
- `frontend/src/features/adaptive/AdaptiveAppLayoutHarness.jsx`.
- `frontend/scripts/validate-adaptive-app-layout-dom.mjs`.
- `docs/architecture/ADAPTIVE_SCREEN_APPROVAL_MAP.md`.
- `docs/tasks/ADAPTIVE_SCREEN_PROGRESS.md`.

### Detector visual

Impeccable devolvio un aviso por uso de `Inter`, documentado arriba.

## C01.1 - Acceso `/login`

Estado: **VERIFICADA LOCALMENTE**
Fecha: 2026-07-24

### Superficies observadas

- Paso de correo y recordar credenciales.
- Error de sesion.
- Seleccion entre multiples empresas, incluida cuenta suspendida.
- Paso de contraseña, visibilidad y cambio de empresa.
- Estado de carga de ambos formularios.
- Footer y version.
- Modal completo de registro y formulario de personal.
- Viewport reducido a 540 px como simulacion de teclado virtual.

### Problemas observados

- Tarjeta con alto minimo rigido de 340 px y espaciado excesivo en alturas
  restringidas.
- Enlaces y textos operativos de 8 a 10 px.
- Accion naranja clara con texto blanco sin contraste suficiente.
- Botones de volver y mostrar contraseña sin nombre accesible.
- Lista de empresas con scroll visual, pero sin region accesible ni contrato
  explicito de propiedad.
- Modal de registro sin semantica de dialogo ni limite de `100dvh`.
- Formulario del registro podia empujar cabecera, accion y cierre fuera del
  viewport.

### Adecuacion aplicada

- Espaciado y logo se recomponen por espacio disponible, sin escalar el
  conjunto.
- Se elimina el alto minimo de contenido; el viewport de login conserva el
  scroll de pagina solo cuando footer o teclado lo requieren.
- Textos operativos aumentan y acciones textuales naranjas usan tono oscuro.
- Botones de icono reciben nombre y objetivo tactil.
- Lista de empresas es una region enfocables con scroll vertical propio,
  `overscroll-contain` y `touch-action: pan-y`.
- Errores usan `role="alert"` y superficie uniforme.
- Modal de registro queda acotado por `100dvh`, con dialogo nombrado y cierre
  accesible.
- Cabecera y accion del registro permanecen fuera del cuerpo desplazable; solo
  los datos extensos poseen scroll cuando realmente exceden el espacio.

### Incidencias encontradas durante la prueba

1. La matriz general solo admite harnesses y rechazo correctamente
   `route:/login`. Se creo un validador interactivo especifico de la ruta.
2. El primer selector de tarjeta esperaba un atributo inexistente. Se agrego
   `data-login-card` como ancla de prueba estable.
3. El test calculaba `bottom` sobre `boundingBox`, propiedad que Playwright no
   devuelve. La geometria real demostraba que el footer estaba dentro; se
   corrigio a `y + height`.
4. Una segunda ejecucion reutilizo un puerto ocupado y termino sin producir
   matriz valida. El validador usa ahora un puerto aislado y la ejecucion final
   produjo diez resultados explicitos.
5. La primera regla del modal exigia scroll incluso cuando todo cabia en FHD
   alto. Se corrigio el contrato: scroll real solo cuando hay exceso, contenido
   completo visible cuando no lo hay.
6. Impeccable marco el antiguo borde lateral grueso del error. Fue retirado.
   La auditoria especifica del modal de registro devolvio cero hallazgos.

### Perfiles verificados

- Windows FHD 100 %, 125 % y 150 %.
- Windows 4K/DPR 2.
- Tablet Full HD horizontal y vertical.
- Tablet 2K horizontal y vertical.
- Lenovo P12 3K horizontal y vertical.

Resultado final: **10/10 PASS**.

### Verificaciones

- Tarjeta y dialogo dentro del viewport: PASS.
- Footer alcanzable: PASS.
- Lista de empresas con scroll propio: PASS.
- Contraseña y acciones accesibles: PASS.
- Objetivos tactiles declarados de 44x44: PASS.
- Accion primaria alcanzable con viewport de 540 px: PASS.
- Formulario de registro con scroll condicionado por exceso: PASS.
- Sin overflow horizontal del documento: PASS.
- Build Vite de produccion: PASS.

### Evidencia

- `artifacts/visual-certification/c01-1-login-final-2026-07-24`.

### Archivos tratados

- `frontend/src/pages/Login.jsx`.
- `frontend/src/components/RegisterModal.jsx`.
- `frontend/scripts/validate-login-adaptive-dom.mjs`.
- `docs/architecture/ADAPTIVE_SCREEN_APPROVAL_MAP.md`.
- `docs/tasks/ADAPTIVE_SCREEN_PROGRESS.md`.

## C01.2 - Recuperacion `/forgot-password`

Estado: **VERIFICADA LOCALMENTE**
Fecha: 2026-07-24

### Problemas observados y adecuacion

- La pantalla ocultaba overflow vertical; pasa a viewport `100dvh` con scroll
  vertical condicionado por contenido o teclado.
- Tarjeta, logo y paddings se recomponen por espacio disponible.
- Etiqueta y campo quedan asociados mediante `for/id`.
- Exito usa region de estado y error usa alerta.
- Se eliminan bordes laterales decorativos y se aumenta legibilidad.
- Accion primaria adopta naranja operativo con contraste; acciones y retorno
  declaran objetivo tactil.

### Pruebas

- Solicitud correcta y confirmacion con retorno.
- Respuesta 503 simulada y error anunciado.
- Tarjeta dentro del ancho y sin overflow horizontal.
- Viewport de 540 px heredado en perfiles tactiles para comprobar altura
  reducida.
- Windows FHD 100/125/150 %, Windows 4K/DPR 2, tablet Full HD y 2K en ambas
  orientaciones, Lenovo P12 en ambas orientaciones.

Resultado: **10/10 PASS**. Build Vite: **PASS**. Impeccable: **0 hallazgos**.

### Evidencia

- `artifacts/visual-certification/c01-1-login-final-2026-07-24/*-forgot-password.png`.

### Archivos tratados

- `frontend/src/pages/ForgotPassword.jsx`.
- `frontend/scripts/validate-login-adaptive-dom.mjs`.
- `docs/architecture/ADAPTIVE_SCREEN_APPROVAL_MAP.md`.
- `docs/tasks/ADAPTIVE_SCREEN_PROGRESS.md`.

## C01.3 - Nueva clave `/reset-password`

Estado: **VERIFICADA LOCALMENTE**
Fecha: 2026-07-24

### Problemas observados y adecuacion

- Se sustituye el viewport bloqueado por `100dvh` con scroll vertical
  condicionado y recomposicion de paddings/logo.
- Campos quedan asociados a sus etiquetas.
- Error, token ausente y confirmacion correcta reciben semantica anunciable.
- El token ausente ya no se expresa solo con un boton deshabilitado: se explica
  la causa y la necesidad de solicitar otro enlace.
- Accion principal usa contraste operativo y los controles declaran objetivo
  tactil.

### Pruebas

- Token valido, claves discrepantes, correccion y respuesta exitosa.
- Token ausente, accion bloqueada y explicacion visible.
- Tarjeta contenida, sin overflow horizontal.
- Diez perfiles obligatorios, incluidos viewport tactil reducido y Lenovo P12.

Resultado: **10/10 PASS**. Build Vite: **PASS**. Impeccable: **0 hallazgos**.

### Evidencia

- `artifacts/visual-certification/c01-1-login-final-2026-07-24/*-reset-password.png`.

### Archivos tratados

- `frontend/src/pages/ResetPassword.jsx`.
- `frontend/scripts/validate-login-adaptive-dom.mjs`.
- `docs/architecture/ADAPTIVE_SCREEN_APPROVAL_MAP.md`.
- `docs/tasks/ADAPTIVE_SCREEN_PROGRESS.md`.

## C01.4 - Verificacion `/verify-registration`

Estado: **VERIFICADA LOCALMENTE**
Fecha: 2026-07-24

- Viewport público recompuesto con `100dvh` y scroll condicionado.
- Estados carga, aprobado, expirado y token ausente migrados a `AsyncState`.
- Mensajes del servidor se conservan y se anuncian semánticamente.
- Acción de retorno solo aparece cuando finaliza la consulta.
- Diez perfiles: **10/10 PASS**. Build: **PASS**.

## C01.5 - Revision fiscal `/ruc-review`

Estado: **VERIFICADA LOCALMENTE**
Fecha: 2026-07-24

- Se diferencian visual y semánticamente pendiente, aprobado y rechazado.
- Error de consulta y token ausente poseen estado recuperable y retorno.
- Se elimina el estado ambiguo que mostraba reloj también para rechazo.
- Tarjeta y mensajes se recomponen sin overflow horizontal.
- Diez perfiles, estados pending/approved/rejected/error/sin token:
  **10/10 PASS**.

### Evidencia C01.4-C01.5

- `artifacts/visual-certification/c01-1-login-final-2026-07-24/*-verify-registration.png`.
- `artifacts/visual-certification/c01-1-login-final-2026-07-24/*-ruc-review.png`.
- Impeccable: cero hallazgos.

### Archivos tratados

- `frontend/src/pages/VerifyRegistration.jsx`.
- `frontend/src/pages/RucReviewStatus.jsx`.
- `frontend/src/components/ui/async-state.jsx`.
- `frontend/scripts/validate-login-adaptive-dom.mjs`.
- `docs/architecture/ADAPTIVE_SCREEN_APPROVAL_MAP.md`.
- `docs/tasks/ADAPTIVE_SCREEN_PROGRESS.md`.

## C02.1 - Consola de Operaciones `/` y `/dashboard`

Estado: **VERIFICADA VISUALMENTE**
Fecha: 2026-07-24

### Problemas observados y adecuacion

- Las tarjetas eran contenedores con clic sin semantica nativa. Cada modulo es
  ahora un boton real, navegable por teclado, con foco visible y objetivo
  tactil.
- La region de modulos declara propiedad de scroll vertical, contencion de
  sobre-desplazamiento y gesto `pan-y`; header y footer permanecen fuera.
- El breakpoint anterior imponia tres columnas a tablet vertical de 800-920 px.
  La captura revelo tarjetas excesivamente estrechas aunque el DOM no
  registraba clipping. La composicion pasa a una columna base, dos en tablet
  vertical, tres en horizontal y cuatro solamente en escritorio amplio.
- Se incorporo el estado superadministrador de cuatro modulos al harness. La
  cobertura anterior solo mostraba el estado administrador de tres modulos.
- El certificador genera tambien captura al final del desplazamiento vertical,
  no solo cuando existe desplazamiento horizontal.

### Revision visual obligatoria

- Se abrieron y revisaron las veinte capturas iniciales: dos permisos por diez
  perfiles.
- Se abrieron y revisaron las siete capturas adicionales de final de scroll.
- Administrador: jerarquia, textos, acciones, version y footer completos.
- Superadministrador: cuatro tarjetas legibles; la segunda fila queda dentro de
  la region de modulos y es alcanzable sin mover la pagina exterior.
- Tablet vertical: dos columnas, sin textos amputados ni solapamientos.
- Tablet horizontal y Windows HiDPI: densidad proporcionada, sin escalado global
  ni perdida de objetivos tactiles.

Resultado: **20/20 PASS** en matriz; **27 capturas revisadas**. Build Vite:
**PASS**. Detector Impeccable especifico: **0 hallazgos**.

### Evidencia

- `artifacts/visual-certification/c02-1-dashboard-visual-reviewed-2026-07-24`.
- `visual-review-admin-contact-sheet.png`.
- `visual-review-superadmin-contact-sheet.png`.
- `visual-review-scroll-end-contact-sheet.png`.

### Archivos tratados

- `frontend/src/pages/Dashboard.jsx`.
- `frontend/src/__classic_primary_pages_harness.jsx`.
- `frontend/classic-dashboard-superadmin-harness.html`.
- `frontend/scripts/certify-visual-surface-matrix.mjs`.
- `docs/architecture/visual-surface-inventory.json`.
- `docs/tasks/ADAPTIVE_SCREEN_PROGRESS.md`.

## C02.2 - Precios Unitarios `/precios-unitarios`

Estado: **VERIFICADA VISUALMENTE**
Fecha: 2026-07-24

### Problemas observados y adecuacion

- Las cuatro tarjetas eran `div` con clic: pasan a botones nativos con foco
  visible, navegacion por teclado y estado `disabled` real.
- El retorno era menor de 44 px y carecia de nombre accesible; ahora declara
  accion, objetivo tactil y anillo de foco.
- El contenido extenso queda bajo una unica region de scroll vertical propia,
  con contencion y gesto `pan-y`; la cabecera del modulo permanece fija.
- Se incorpora el estado real sin base tecnica: Bases de Trabajo permanece
  disponible y Subcategorias, Recursos y APU explican y aplican el bloqueo.
- Las tarjetas mantienen dos columnas en tablet, sin reducir globalmente la
  interfaz ni depender de la resolucion fisica.

### Revision visual obligatoria

- Se abrieron y revisaron veinte capturas iniciales: base activa y sin base por
  cada uno de los diez perfiles.
- Se revisaron las capturas de final de scroll generadas en perfiles con exceso
  vertical.
- Lenovo P12 vertical conserva cuatro tarjetas completas en dos columnas.
- Full HD vertical permite alcanzar la ultima fila mediante el scroll de
  contenido, sin desplazar la cabecera global ni cortar acciones.
- Los badges `Base requerida` no invaden icono, titulo, descripcion o accion.

Resultado: **20/20 PASS**; build Vite: **PASS**. Impeccable conserva un aviso
estatico `gray-on-color` documentado en QI-007: las clases denunciadas
pertenecen a estados mutuamente excluyentes y la combinacion no se renderiza.

### Incidencias de prueba documentadas

1. La primera ejecucion se lanzo desde la raiz con una ruta relativa propia de
   `frontend`; fallo antes de probar y no se considero evidencia.
2. La matriz baseline tuvo un `ERR_NO_BUFFER_SPACE` transitorio en un perfil.
   La matriz final aislada completo las veinte combinaciones sin error.
3. El detector relaciona clases de dos ramas condicionales como si coexistieran;
   la inspeccion de capturas activa/sin base valida el estilo realmente
   renderizado.

### Evidencia

- `artifacts/visual-certification/c02-2-precios-certified-2026-07-24`.
- `visual-review-active-base-contact-sheet.png`.
- `visual-review-no-base-contact-sheet.png`.
- `visual-review-scroll-end-contact-sheet.png`.

### Archivos tratados

- `frontend/src/pages/PreciosUnitarios.jsx`.
- `frontend/src/__classic_primary_pages_harness.jsx`.
- `frontend/classic-precios-unitarios-no-base-harness.html`.
- `docs/architecture/visual-surface-inventory.json`.
- `docs/quality/KNOWN_ISSUES_ADAPTIVE_RELEASE.md`.
- `docs/tasks/ADAPTIVE_SCREEN_PROGRESS.md`.

## C02.3 - Otros Servicios `/servicios`

Estado: **VERIFICADA VISUALMENTE**
Fecha: 2026-07-24

### Problemas observados y adecuacion

- Las tarjetas activas eran `div` con clic; pasan a botones nativos con foco
  visible y objetivo tactil.
- Bolsa de Trabajo y Certificaciones carecen de ruta, pero mostraban hover,
  elevacion y flecha como si fueran accionables. Ahora son articulos de estado,
  sin falsa affordance, y muestran `En desarrollo`.
- El retorno aumenta de 40 a 44 px, recibe nombre accesible y foco visible.
- Se elimina el `h-screen` anidado dentro del shell protegido. La pantalla usa
  el alto disponible y la region de catalogo es la unica propietaria del scroll
  cuando exista exceso.
- La composicion adopta dos columnas desde tablet vertical y tres en horizontal
  o escritorio con capacidad suficiente.

### Revision visual obligatoria

- Se abrieron y revisaron las diez capturas finales.
- Lenovo P12 vertical: cinco servicios completos, dos columnas, estados futuros
  diferenciados y sin desplazamiento innecesario.
- Full HD vertical: textos, estados y acciones permanecen legibles; no hay
  solapamiento con la cabecera global.
- Perfiles horizontales y Windows HiDPI: tres columnas proporcionadas, sin
  crecimiento por resolucion fisica.

Resultado: **10/10 PASS**; build Vite: **PASS**; Impeccable:
**0 hallazgos**.

### Evidencia

- `artifacts/visual-certification/c02-3-servicios-certified-2026-07-24`.
- `visual-review-contact-sheet.png`.

### Archivos tratados

- `frontend/src/pages/Placeholders.jsx`.
- `frontend/src/__classic_primary_pages_harness.jsx`.
- `frontend/classic-servicios-harness.html`.
- `docs/architecture/visual-surface-inventory.json`.
- `docs/tasks/ADAPTIVE_SCREEN_PROGRESS.md`.

## C02.4 - Hub de Administracion Global `/admin-global`

Estado: **VERIFICADA VISUALMENTE**
Fecha: 2026-07-24

### Problemas observados y adecuacion

- El hub no tenia evidencia de sus dos permisos. Se incorporan harnesses de
  superadministrador y acceso denegado para administrador.
- Padding fijo de 48 px y rejilla desde `md` producian una columna excesivamente
  grande en tablet Full HD vertical. Se aplican espacios fluidos y dos columnas
  desde capacidad tablet.
- Cada tarjeta dependia de un boton de flecha de 40 px. La tarjeta completa es
  ahora un boton nativo, con foco visible y objetivo tactil.
- Retorno y accion de estado alcanzan 44 px y poseen nombre accesible.
- El hub y el estado denegado declaran una unica region vertical con
  `overscroll-contain` y `pan-y`; la cabecera global queda fuera.
- El acceso restringido usa semantica de alerta y padding adaptable.

### Revision visual obligatoria

- Se abrieron y revisaron veinte capturas iniciales: hub y acceso denegado en
  los diez perfiles.
- Se abrieron y revisaron las capturas de final de scroll del hub.
- La ultima fila, Relacion con Ajustes y Estado del Sistema son alcanzables sin
  mover el shell exterior.
- Tablet vertical muestra dos tarjetas por fila; horizontal y Windows HiDPI
  usan tres o cuatro segun capacidad real.

Resultado: **20/20 PASS**; build Vite: **PASS**; Impeccable:
**0 hallazgos**.

### Evidencia

- `artifacts/visual-certification/c02-4-admin-global-certified-2026-07-24`.
- `visual-review-hub-contact-sheet.png`.
- `visual-review-denied-contact-sheet.png`.
- `visual-review-scroll-end-contact-sheet.png`.

### Archivos tratados

- `frontend/src/pages/AdminGlobal.jsx`.
- `frontend/src/__classic_primary_pages_harness.jsx`.
- `frontend/classic-admin-global-harness.html`.
- `frontend/classic-admin-global-denied-harness.html`.
- `docs/architecture/visual-surface-inventory.json`.
- `docs/tasks/ADAPTIVE_SCREEN_PROGRESS.md`.

## C03.1 - Proyectos: listado `/proyectos`

Estado: **RECERTIFICADA VISUALMENTE**
Fecha: 2026-07-24

### Contrato comprobado

- Empresa Santiago Bermeo, busqueda, filtros, resumen y selector de vista
  permanecen fuera del viewport desplazable.
- La tabla posee desplazamiento vertical y horizontal exclusivo, gesto tactil
  real y cabecera sticky.
- El shell y los controles cambian exactamente 0 px durante el gesto de lista.
- Se alcanzan proyecto 12, columnas finales y acciones sin mover la pagina
  interior completa.

### Revision visual obligatoria

- Diez capturas iniciales abiertas y revisadas.
- Diez capturas de final de scroll abiertas y revisadas.
- Tablet Full HD y 2K, Lenovo P12 y Windows HiDPI conservan controles visibles,
  filas legibles y acciones alcanzables.
- No se aplica escalado global; la densidad de tabla se conserva y el exceso
  pertenece al contenedor de datos.

Resultado: **10/10 PASS**; contrato tactil y sticky:
**PASS**. No se necesito cambiar el componente: la recertificacion confirma la
correccion estructural ya aplicada.

### Evidencia

- `artifacts/visual-certification/c03-1-projects-recertification-2026-07-24`.
- `visual-review-contact-sheet.png`.
- `visual-review-scroll-end-contact-sheet.png`.

## C03.2 - Proyectos: vista Kanban

Estado: **VERIFICADA VISUALMENTE**
Fecha: 2026-07-24

### Problemas observados y adecuacion

- Se incorpora un harness que activa realmente Kanban; la evidencia previa solo
  cubria la vista Lista.
- El tablero conserva sus cinco fases y usa desplazamiento bidireccional propio,
  en lugar de reducir o deformar los carriles.
- Mover fase y abrir revisiones usaban controles de 28x28 px. Todos pasan a
  44x44 px, con estados deshabilitados conservados.
- El viewport Kanban declara region, nombre, foco y gesto `pan-x pan-y`.

### Revision visual obligatoria

- Diez capturas iniciales abiertas y revisadas.
- Diez capturas de final de desplazamiento abiertas y revisadas.
- Tablet vertical mantiene un carril legible por vez y permite recorrer fases
  horizontalmente; dentro de cada fase se alcanza el ultimo proyecto.
- Tablet horizontal y Windows HiDPI muestran las cinco fases sin alterar
  tipografia ni densidad de las tarjetas.
- Controles globales permanecen fuera del desplazamiento del tablero.

Resultado: **10/10 PASS**; build Vite: **PASS**; Impeccable:
**0 hallazgos**.

### Evidencia

- `artifacts/visual-certification/c03-2-projects-kanban-certified-2026-07-24`.
- `visual-review-contact-sheet.png`.
- `visual-review-scroll-end-contact-sheet.png`.

### Archivos tratados

- `frontend/src/pages/Proyectos.jsx`.
- `frontend/scripts/certify-visual-surface-matrix.mjs`.
- `frontend/classic-projects-kanban-harness.html`.
- `docs/architecture/visual-surface-inventory.json`.
- `docs/tasks/ADAPTIVE_SCREEN_PROGRESS.md`.

## C03.3 - Proyectos: crear y editar

Estado: **VERIFICADA VISUALMENTE**
Fecha: 2026-07-24

### Crear proyecto

- El formulario estaba dentro de un shell con altura limitada, pero su cuerpo
  no era desplazable. En alturas reducidas los campos finales y las acciones
  podian quedar recortados.
- El encabezado permanece estable y el cuerpo del formulario pasa a ser el
  unico propietario del desplazamiento vertical.
- En paisaje conserva dos columnas; en retrato adapta el formulario a una
  columna sin escalar tipografia, campos ni botones.

### Editar proyecto

- Se certifica el estado real `Datos de Proyecto`, no solamente el portafolio.
- En paisaje y escritorio HiDPI el formulario tecnico y la informacion
  geografica se mantienen en paralelo.
- En tablet vertical se apilan como dos areas funcionales, cada una con scroll
  tactil propio. Se alcanzan identificacion, especificaciones, cronograma,
  ubicacion, objetivos, documentos e imagen sin desplazar el shell completo.
- Los dos viewports declaran `overscroll-contain`, gesto vertical y marcadores
  de certificacion.

### Incidencias de la prueba

- El certificador intentaba desplazar la tabla oscurecida detras del modal de
  alta. Se corrige la deteccion para probar solo superficies alcanzables en el
  punto de contacto.
- El dato simulado de proyecto no incluia `revision` y provocaba un error al
  entrar directamente en edicion. Se completa el contrato del harness con
  `revision: 0`; no se oculto el fallo de ejecucion.

### Revision visual obligatoria

- Alta: diez capturas iniciales y diez capturas de final abiertas y revisadas.
- Edicion: diez capturas iniciales y diez capturas de final abiertas y
  revisadas.
- Resultado alta: **10/10 PASS**.
- Resultado edicion: **10/10 PASS**.

### Evidencia

- `artifacts/visual-certification/2026-07-25T01-15-00-543Z`.
- `artifacts/visual-certification/2026-07-25T01-18-18-729Z`.
- `create-certified-contact-sheet.png`.
- `create-certified-end-contact-sheet.png`.
- `edit-certified-contact-sheet.png`.
- `edit-certified-end-contact-sheet.png`.

### Archivos tratados

- `frontend/src/pages/Proyectos.jsx`.
- `frontend/src/components/projects/DatosProyecto.jsx`.
- `frontend/src/__classic_primary_pages_harness.jsx`.
- `frontend/scripts/certify-visual-surface-matrix.mjs`.
- `frontend/classic-projects-create-harness.html`.
- `frontend/classic-projects-edit-harness.html`.
- `docs/architecture/visual-surface-inventory.json`.
- `docs/tasks/ADAPTIVE_SCREEN_PROGRESS.md`.

## C03.4 - Proyectos: acciones, revisiones y papelera

Estado: **VERIFICADA VISUALMENTE**
Fecha: 2026-07-24

### Estados tratados

- Historial expandido con ocho revisiones y desplazamiento tactil propio.
- Final del historial R007 alcanzable sin desplazar los controles del
  portafolio.
- Confirmacion real de clonado completo mediante el proveedor global de
  dialogos.
- Eliminacion en dos pasos: alcance del borrado y confirmacion final.
- Papelera con siete proyectos, retencion, restauracion, borrado, refresco y
  footer fijo.
- Entrada y salida del proyecto ya quedan cubiertas por C03.3.

### Adecuaciones

- Los cuerpos de confirmacion y selector de revisiones pasan a ser propietarios
  del scroll dentro de `AppModalShell`.
- El historial declara `overscroll-contain` y gesto vertical.
- Restaurar y Borrar pasan de 36 px a 44 px de altura tactil.
- El harness incorpora `AppDialogProvider`; anteriormente el click de clonado
  se ejecutaba sin renderizar el dialogo y la captura no demostraba el estado.
- La auditoria tactil prueba primero los contenedores anidados para impedir que
  el desplazamiento del portafolio oculte el historial antes de comprobarlo.

### Incidencias registradas

- La accion accesible `Papelera` coincidia tambien con doce acciones de fila.
  La interaccion de prueba se corrige con coincidencia exacta.
- Dos perfiles detectaron falsos negativos al probar primero el scroll padre;
  se corrige el orden por profundidad y se repite la matriz completa.
- Durante la conversion de cuerpos modales se detectaron cierres JSX
  inconsistentes mediante build. Fueron corregidos antes de certificar; no se
  acepto ninguna captura con runtime roto.

### Revision visual obligatoria

- Cinco estados por diez perfiles: **50/50 PASS**.
- Se abrieron y revisaron las cinco hojas de contacto iniciales.
- Se abrio y reviso la hoja de final del historial, confirmando R005-R007.
- Build Vite: **PASS**.

### Evidencia

- `artifacts/visual-certification/2026-07-25T01-47-37-230Z`.
- `classic-projects-clone-confirm-harness-contact-sheet.png`.
- `classic-projects-delete-step1-harness-contact-sheet.png`.
- `classic-projects-delete-step2-harness-contact-sheet.png`.
- `classic-projects-recycle-harness-contact-sheet.png`.
- `classic-projects-revisions-harness-contact-sheet.png`.
- `classic-projects-revisions-end-contact-sheet.png`.

### Archivos tratados

- `frontend/src/pages/Proyectos.jsx`.
- `frontend/src/__classic_primary_pages_harness.jsx`.
- `frontend/scripts/certify-visual-surface-matrix.mjs`.
- Cinco harnesses especificos de acciones C03.4.
- `docs/architecture/visual-surface-inventory.json`.
- `docs/tasks/ADAPTIVE_SCREEN_PROGRESS.md`.

## C03.5 - Gestor de personal: proyectos

Estado: **VERIFICADA VISUALMENTE**
Fecha: 2026-07-24

- Cabecera, busqueda y selector Proyectos/Bases quedan fuera del scroll.
- La tabla es el unico viewport bidireccional, posee cabecera sticky y gesto
  tactil.
- Se alcanzan proyectos 9-12 y las acciones de cobertura sin mover la pagina.
- Volver, Ver equipo y Asignar personal cumplen 44 px.
- Resultado: **10/10 PASS**; capturas iniciales y finales abiertas.

## C03.6 - Gestor de personal: bases maestras

Estado: **VERIFICADA VISUALMENTE**
Fecha: 2026-07-24

- La misma arquitectura preserva el selector y controles al cambiar de vista.
- Retrato conserva columnas operativas mediante scroll propio; no comprime ni
  escala la tabla.
- Se alcanzan bases 7-10 y Asignar personal en el extremo derecho.
- Resultado: **10/10 PASS**; capturas iniciales y finales abiertas.

### Evidencia C03.5-C03.6

- `artifacts/visual-certification/2026-07-25T02-07-08-431Z`.
- `classic-project-manager-projects-harness-contact-sheet.png`.
- `classic-project-manager-projects-harness-scroll-end-contact-sheet.png`.
- `classic-project-manager-bases-harness-contact-sheet.png`.
- `classic-project-manager-bases-harness-scroll-end-contact-sheet.png`.

### Archivos tratados

- `frontend/src/pages/ProjectManager.jsx`.
- `frontend/src/__classic_primary_pages_harness.jsx`.
- `frontend/scripts/certify-visual-surface-matrix.mjs`.
- Harnesses de gestor Proyectos y Bases.
- `docs/architecture/visual-surface-inventory.json`.

## C03.7 - Modal de asignacion

Estado: **VERIFICADA VISUALMENTE**
Fecha: 2026-07-24

- Se elimino la composicion rigida de tres columnas y altura fija.
- En escritorio ancho se conservan EDT, disponibles y asignados simultaneos.
- En tablet retrato la configuracion/EDT precede a una zona de personal en dos
  paneles; cada lista conserva desplazamiento propio sin escalar componentes.
- Cabecera y `Finalizar Gestion` permanecen fijos; el cuerpo es el unico
  viewport general cuando la composicion necesita apilarse.
- Selectores y acciones de asignar/desasignar cumplen 44 px y los nombres/correos
  largos truncan dentro de su panel sin producir desbordamiento de documento.
- Resultado: **10/10 PASS**; capturas iniciales y de final de scroll abiertas.

### Evidencia C03.7

- `artifacts/visual-certification/2026-07-25T02-18-33-693Z`.
- `assign-initial-contact-sheet.png`.
- `assign-scroll-end-contact-sheet.png`.

### Archivos tratados

- `frontend/src/pages/ProjectManager.jsx`.
- `frontend/classic-project-manager-assign-harness.html`.
- `frontend/scripts/certify-visual-surface-matrix.mjs`.
- `docs/architecture/visual-surface-inventory.json`.

### Incidencias documentadas

- La implementacion anterior imponia `h-[75dvh]` y tres columnas incluso cuando
  el ancho CSS efectivo de una tablet no permite ese reparto.
- Los controles de alcance, modulo, asignar y desasignar quedaban por debajo del
  minimo tactil de 44 px.

## Siguiente unidad

`C03.8 - Dashboard de equipo`: **VERIFICADA VISUALMENTE**.

## C03.8 - Dashboard de equipo y resumen de colaborador

Estado: **VERIFICADA VISUALMENTE**
Fecha: 2026-07-24

- El mapa jerarquico dispone de un viewport vertical propio; la cabecera y la
  salida del visor no participan en su desplazamiento.
- Las ramas pasan de fila horizontal a bloque operativo en anchos estrechos,
  manteniendo nombre, estado y `Gestionar personal` sin recortes.
- Los colaboradores son botones accesibles de al menos 44 px y el acceso al
  resumen ya no depende de `hover`.
- El resumen de colaborador adapta avatar, identidad, cargo, correo,
  responsabilidades y actividad a una o dos columnas segun el ancho efectivo.
- Nombres profesionales extensos se ajustan sin invadir acciones ni tarjetas.
- Se corrigio un defecto previo adicional: el componente utilizaba `motion`
  sin importarlo explicitamente, potencial error de ejecucion al renderizar.
- Resultado: **20/20 PASS** entre mapa y resumen; cuatro hojas de capturas
  inicial/final abiertas e inspeccionadas.

### Evidencia C03.8

- `artifacts/visual-certification/2026-07-25T02-23-00-267Z`.
- `classic-project-manager-team-dashboard-harness-contact-sheet.png`.
- `classic-project-manager-team-dashboard-harness-scroll-end-contact-sheet.png`.
- `classic-project-manager-team-summary-harness-contact-sheet.png`.
- `classic-project-manager-team-summary-harness-scroll-end-contact-sheet.png`.

### Incidencias de certificacion

- El primer intento, `2026-07-25T02-22-21-392Z`, no es evidencia valida: el
  certificador invoco `document` fuera del navegador. Se corrigio el contexto
  Playwright y se repitieron los veinte casos desde cero.
- Las dos advertencias de contraste heredadas de C03.7 se corrigieron antes de
  cerrar el conjunto: avatar disponible y accion de desasignar.

### Archivos tratados

- `frontend/src/components/TeamDashboardModal.jsx`.
- `frontend/src/pages/ProjectManager.jsx`.
- Harnesses de dashboard y resumen de colaborador.
- `frontend/scripts/certify-visual-surface-matrix.mjs`.
- `docs/architecture/visual-surface-inventory.json`.

## Siguiente unidad

`C04.1 - Cabecera y selector del proyecto`: **VERIFICADA VISUALMENTE**.

## C04.1 - Cabecera y selector del espacio de trabajo

Estado: **VERIFICADA VISUALMENTE**
Fecha: 2026-07-24

- La identidad del proyecto admite nombres extensos sin expulsar revision,
  retorno ni acciones; el nombre se trunca con titulo completo accesible.
- En tablet retrato las acciones forman una segunda fila contextual; en
  paisaje/escritorio permanecen en la misma linea cuando el ancho lo permite.
- Retorno, fijacion del selector y acciones compactas cumplen 44 px.
- La navegacion conserva dos estados funcionales: rail compacto para maximizar
  area de trabajo y panel fijado con etiquetas completas para exploracion.
- El contenido interior recibe padding por contexto, sin zoom ni escalado global.
- Resultado: **20/20 PASS**; hojas de cabecera y navegacion expandida abiertas.

### Evidencia C04.1

- `artifacts/visual-certification/2026-07-25T02-32-01-653Z`.
- `classic-project-workspace-header-harness-contact-sheet.png`.
- `classic-project-workspace-navigation-harness-contact-sheet.png`.

### Incidencias de certificacion

- `2026-07-25T02-29-29-842Z` paso geometria, pero se rechazo visualmente:
  el mock de permisos ocultaba las secciones y no ejercitaba el selector.
- Se corrigio el contrato a `allowed_modules: ['todos']` y se repitieron los
  veinte casos completos; solo la segunda ejecucion es evidencia valida.

### Archivos tratados

- `frontend/src/pages/Proyectos.jsx`.
- `frontend/src/components/projects/ProjectHeaderActionButton.jsx`.
- `frontend/src/__classic_primary_pages_harness.jsx`.
- Harnesses de cabecera y navegacion del workspace.
- `frontend/scripts/certify-visual-surface-matrix.mjs`.
- `docs/architecture/visual-surface-inventory.json`.

## Siguiente unidad

`C04.2 - Datos del proyecto`: **VERIFICADA VISUALMENTE**.

## C04.2 - Datos del proyecto

Estado: **VERIFICADA VISUALMENTE**
Fecha: 2026-07-24

- Los controles contextuales quedan fuera de los viewports de datos.
- En escritorio y tablet paisaje se mantienen formulario y documentos en
  paralelo; en tablet retrato se reparten en dos filas con alturas explícitas
  3/2 y desplazamiento independiente, evitando una pagina interior interminable.
- Se verificaron identificación, especificaciones, alcance, contratación,
  cronograma, ubicación, objetivos/restricciones/supuestos, mapa, imagen y
  adjuntos tanto al inicio como al final de cada panel.
- Los acordeones, normativa, alertas, altas/bajas de listas, mapa, imagen y
  adjuntos cumplen el objetivo táctil mínimo de 44 px.
- No se aplica zoom global; campos y mapa conservan tamaño legible y estructura.
- Resultado: **10/10 PASS**; capturas iniciales/finales abiertas.

### Evidencia C04.2

- `artifacts/visual-certification/2026-07-25T02-47-35-246Z`.
- `classic-project-workspace-data-harness-contact-sheet.png`.
- `classic-project-workspace-data-harness-scroll-end-contact-sheet.png`.

### Incidencias de certificacion

- `2026-07-25T02-44-17-915Z` se rechazo como evidencia final porque las acciones
  de apertura desplazaban automáticamente el formulario antes de la captura
  inicial. Se restablecieron ambos viewports a cero y se repitieron diez casos.

### Archivos tratados

- `frontend/src/components/projects/DatosProyecto.jsx`.
- `frontend/classic-project-workspace-data-harness.html`.
- `frontend/scripts/certify-visual-surface-matrix.mjs`.
- `docs/architecture/visual-surface-inventory.json`.

## Siguiente unidad

`C04.3 - Stakeholders`: **VERIFICADA VISUALMENTE**.

## C04.3 - Stakeholders

Estado: **VERIFICADA VISUALMENTE**
Fecha: 2026-07-24

- El listado dispone de un viewport propio con desplazamiento vertical y
  horizontal táctil; la cabecera del workspace permanece estable y las acciones
  de fila siguen disponibles al alcanzar el extremo derecho.
- La tabla conserva su estructura informativa en lugar de comprimir nombres,
  cargos, organizaciones, datos de contacto y acciones hasta volverlos ilegibles.
- Alta y edición utilizan un diálogo adaptativo por encima del shell global:
  encabezado y pie permanecen fijos, mientras únicamente el cuerpo del
  formulario se desplaza.
- En tablet retrato el formulario ocupa el ancho útil y mantiene campos,
  selectores y agrupaciones legibles; en paisaje y escritorio recupera una
  composición más compacta sin aplicar zoom global.
- Botones de alta, cierre, acciones de fila, búsqueda y controles del formulario
  cumplen el objetivo táctil mínimo de 44 px.
- Se verificaron datos extensos, tabla completa, alta vacía, edición poblada,
  ubicación y acciones finales en las cinco geometrías contractuales.
- Resultado: **30/30 PASS** entre listado, alta y edición; seis hojas de
  capturas inicial/final abiertas e inspeccionadas.

### Evidencia C04.3

- Listado: `artifacts/visual-certification/2026-07-25T03-10-37-099Z`.
- Alta: `artifacts/visual-certification/2026-07-25T03-18-56-140Z`.
- Edición: `artifacts/visual-certification/2026-07-25T03-20-20-520Z`.
- `classic-project-workspace-stakeholders-harness-contact-sheet.png`.
- `classic-project-workspace-stakeholders-harness-scroll-end-contact-sheet.png`.
- `classic-project-workspace-stakeholder-create-harness-contact-sheet.png`.
- `classic-project-workspace-stakeholder-create-harness-scroll-end-contact-sheet.png`.
- `classic-project-workspace-stakeholder-edit-harness-contact-sheet.png`.
- `classic-project-workspace-stakeholder-edit-harness-scroll-end-contact-sheet.png`.

### Incidencias de certificacion

- La primera ejecución conjunta quedó bloqueada y se descartó; se cerraron
  únicamente los procesos Vite/npm de esa ejecución y se dividió la
  certificación por superficie.
- `2026-07-25T03-01-30-204Z` obtuvo PASS geométrico, pero se rechazó al abrir
  las capturas: mostraba `Datos` en lugar de `Stakeholders`.
- `2026-07-25T03-05-49-126Z` confirmó mediante captura y timeout del localizador
  que el parámetro de pestaña no activaba de forma fiable la sección. El
  certificador pasó a seleccionar explícitamente la entrada de navegación.
- `2026-07-25T03-11-43-595Z` también pasó geometría, pero se rechazó visualmente:
  en tablet Full HD retrato el header global cubría el encabezado del diálogo de
  alta. Se corrigió la capa del diálogo y se repitieron desde cero alta y edición.
- Solo las tres ejecuciones enumeradas como evidencia se consideran válidas.

### Archivos tratados

- `frontend/src/components/projects/Stakeholders.jsx`.
- Harnesses de listado, alta y edición de stakeholders.
- `frontend/scripts/certify-visual-surface-matrix.mjs`.
- `docs/architecture/visual-surface-inventory.json`.

## Siguiente unidad

`C04.4 - EDT/WBS`: **VERIFICADA VISUALMENTE**.

## C04.4 - EDT/WBS

Estado: **VERIFICADA VISUALMENTE**
Fecha: 2026-07-24

- La vista árbol dispone de un único viewport bidireccional propio. Cabecera,
  filas, profundidad jerárquica, subvalores y acciones se desplazan de forma
  sincronizada sin mover el shell ni la página del proyecto.
- La tabla jerárquica conserva un ancho informativo mínimo de 800 px en tablet
  retrato, evitando comprimir códigos, descripciones, métricas y controles hasta
  hacerlos ilegibles.
- En superficies táctiles las acciones de nodo permanecen visibles; ya no
  dependen de un estado `hover` inexistente o inestable.
- Acciones de expansión, reordenación, alta de cuenta, asignación, edición y
  eliminación cumplen el objetivo táctil mínimo de 44 px.
- La vista gráfica conserva navegación, profundidad, minimapa, búsqueda,
  métricas y tarjetas legibles en retrato, paisaje y densidades altas.
- Los diálogos de cuenta, participante y movimiento utilizan la capa modal
  global, con encabezado y pie estables y cuerpo desplazable cuando la altura
  efectiva disminuye por el escalado de Windows.
- Se verificaron nueve raíces, tres niveles, participantes, nombres extensos,
  desplazamiento a ambos extremos y estados de selección.
- Resultado final: **50/50 PASS** entre árbol, gráfico y tres diálogos; hojas de
  capturas abiertas e inspeccionadas, incluida evidencia inicial/final.

### Evidencia C04.4

- Árbol: `artifacts/visual-certification/2026-07-25T03-35-25-171Z`.
- Gráfico: `artifacts/visual-certification/2026-07-25T03-36-40-601Z`.
- Cuenta: `artifacts/visual-certification/2026-07-25T03-48-33-819Z`.
- Participante: `artifacts/visual-certification/2026-07-25T03-46-54-534Z`.
- Movimiento: `artifacts/visual-certification/2026-07-25T03-49-53-776Z`.
- `classic-project-workspace-edt-tree-harness-contact-sheet.png`.
- `classic-project-workspace-edt-tree-harness-scroll-end-contact-sheet.png`.
- `classic-project-workspace-edt-graph-harness-contact-sheet.png`.
- `classic-project-workspace-edt-graph-harness-scroll-end-contact-sheet.png`.
- `classic-project-workspace-edt-account-harness-contact-sheet.png`.
- `classic-project-workspace-edt-participant-harness-contact-sheet.png`.
- `classic-project-workspace-edt-participant-harness-scroll-end-contact-sheet.png`.
- `classic-project-workspace-edt-move-harness-contact-sheet.png`.

### Incidencias de certificacion

- La invocación inicial con el alias npm `certify:visual` no llegó a ejecutar
  pruebas porque ese script no existe; se utilizó el certificador oficial
  directamente.
- `2026-07-25T03-31-03-395Z` quedó incompleta al usar un rol incorrecto para el
  selector segmentado (`button` en lugar de `tab`). Se cerraron solo sus procesos
  y `2026-07-25T03-33-50-420Z` aisló la causa en un perfil táctil.
- `2026-07-25T03-39-02-799Z` se rechazó: el auto-scroll de Playwright colocaba
  el botón de asignación bajo la cabecera sticky en dos perfiles de escritorio.
- `2026-07-25T03-41-02-166Z` obtuvo PASS, pero las capturas mostraron el diálogo
  ausente en dos perfiles; el click forzado no garantizaba la apertura. Se pasó
  a activación DOM y aserción explícita del encabezado.
- `2026-07-25T03-42-36-199Z` y `2026-07-25T03-44-54-911Z` también se rechazaron
  visualmente: a 150% el header global cubría el encabezado del diálogo por una
  capa `z-110`. Los tres diálogos EDT se alinearon con la capa modal global y
  se repitieron las matrices afectadas.
- El detector estético mantiene una advertencia sobre el borde lateral de cuatro
  píxeles. Se conserva deliberadamente como codificación jerárquica de cuenta y
  participante; no afecta adaptación, contraste ni interacción.
- Solo las cinco ejecuciones enumeradas como evidencia se consideran válidas.

### Archivos tratados

- `frontend/src/components/projects/Edt.jsx`.
- Harnesses de árbol, gráfico, cuenta, participante y movimiento.
- `frontend/scripts/certify-visual-surface-matrix.mjs`.
- `docs/architecture/visual-surface-inventory.json`.

## Siguiente unidad

`C04.5 - EDO/OBS`: **VERIFICADA VISUALMENTE**.

## C04.5 - EDO/OBS

Estado: **VERIFICADA VISUALMENTE**
Fecha: 2026-07-24

- El árbol EDO utiliza un viewport bidireccional propio para cabecera, hitos,
  responsables y acciones, sin transferir el desplazamiento a la página.
- Se conserva un ancho informativo mínimo de 720 px en tablet retrato para que
  código, jerarquía, nombres, roles y controles no se compriman ni solapen.
- Las acciones de nodos permanecen visibles en contexto táctil y se activan
  también al seleccionar un nodo en escritorio.
- Alta, expansión, reordenación, asignación, edición y eliminación cumplen el
  objetivo táctil mínimo de 44 px.
- La vista gráfica adapta sus columnas, controles, minimapa y profundidad a
  paisaje y retrato sin zoom global ni pérdida de contenido.
- Los diálogos de hito, responsable y movimiento comparten la capa modal global,
  con encabezado y pie estables y cuerpo desplazable cuando sea necesario.
- Se probaron nueve hitos raíz, tres niveles, responsables, nombres extensos,
  selección y ambos extremos del desplazamiento.
- Resultado: **50/50 PASS** entre árbol, gráfico y tres diálogos; capturas
  iniciales/finales abiertas e inspeccionadas.

### Evidencia C04.5

- Árbol: `artifacts/visual-certification/2026-07-25T03-57-22-353Z`.
- Gráfico: `artifacts/visual-certification/2026-07-25T03-58-58-660Z`.
- Hito: `artifacts/visual-certification/2026-07-25T04-00-44-158Z`.
- Responsable: `artifacts/visual-certification/2026-07-25T04-02-13-469Z`.
- Movimiento: `artifacts/visual-certification/2026-07-25T04-04-22-916Z`.
- `classic-project-workspace-edo-tree-harness-contact-sheet.png`.
- `classic-project-workspace-edo-tree-harness-scroll-end-contact-sheet.png`.
- `classic-project-workspace-edo-graph-harness-contact-sheet.png`.
- `classic-project-workspace-edo-graph-harness-scroll-end-contact-sheet.png`.
- `classic-project-workspace-edo-milestone-harness-contact-sheet.png`.
- `classic-project-workspace-edo-participant-harness-contact-sheet.png`.
- `classic-project-workspace-edo-participant-harness-scroll-end-contact-sheet.png`.
- `classic-project-workspace-edo-move-harness-contact-sheet.png`.

### Incidencias y deuda visual

- No se produjeron ejecuciones inválidas en la matriz final de esta unidad; las
  aserciones de apertura de cada diálogo formaron parte del contrato.
- El detector estético mantiene una advertencia sobre el borde lateral de cuatro
  píxeles. Se conserva como codificación semántica de hito/responsable, coherente
  con EDT; no afecta accesibilidad, adaptación ni interacción.

### Archivos tratados

- `frontend/src/components/projects/Edo.jsx`.
- Harnesses de árbol, gráfico, hito, responsable y movimiento.
- `frontend/scripts/certify-visual-surface-matrix.mjs`.
- `docs/architecture/visual-surface-inventory.json`.

## Siguiente unidad

`C04.6 - Presupuesto`: **VERIFICADA VISUALMENTE**.

## C04.6 - Presupuesto

Estado: **VERIFICADA VISUALMENTE**
Fecha: 2026-07-25

- El shell del presupuesto conserva cabecera, herramientas y resumen económico
  fijos. El listado es el único viewport bidireccional y mantiene sincronizadas
  cabecera y filas; la página interior no se usa como sustituto del scroll.
- El catálogo APU es persistente únicamente cuando existe ancho útil. En
  perfiles compactos comienza como rail de 64 px y se abre como drawer
  superpuesto de 320/384 px, sin reducir por escala el editor principal.
- La tabla mantiene ancho informativo mínimo y desplazamiento táctil horizontal
  y vertical reales. Unidad, cantidad, precio, subtotal y acciones siguen siendo
  alcanzables; las cinco acciones de línea disponen de objetivos de 44 x 44 px.
- El editor APU prioriza la tabla en tablet, conserva totales fijos y convierte
  su catálogo de recursos en drawer. La prueba exige ancho abierto mínimo y
  buscador visible para impedir falsos positivos de rail colapsado.
- Tanteo usa composición maestro-detalle, con lista y edición independientes.
  Indirectos, Pareto, notas generales, notas de línea y doble confirmación
  conservan encabezado/pie y desplazan solo su cuerpo cuando es necesario.
- El minimapa se abre sin dejar otro drawer activo detrás, puede minimizarse y
  mantiene controles táctiles de 44 px.
- El menú de reportes usa posicionamiento limitado al viewport en perfiles
  compactos. El visor de reporte apila título y resumen económico en retrato,
  mantiene tabla y acciones dentro del modal y ofrece objetivos táctiles de
  44 px. El estado de generación también fue certificado.
- Se probaron 63 líneas operativas, nueve raíces, jerarquía profunda, nombres
  extensos, notas, recursos, costes, estados de tanteo y ambos extremos de
  desplazamiento.
- Resultado final: **170/170 combinaciones válidas** entre 17 superficies y 10
  perfiles. Todas las hojas de contacto relevantes y capturas de regresiones
  fueron abiertas e inspeccionadas; un fallo de infraestructura se repitió en
  proceso limpio y quedó documentado, no convertido silenciosamente en PASS.

### Superficies C04.6

1. Presupuesto principal.
2. Catálogo y herramientas abierto.
3. Indirectos e IVA.
4. Pareto.
5. Notas generales.
6. Notas de línea.
7. Minimapa abierto.
8. Minimapa minimizado.
9. Borrado de tanteos, confirmación 1.
10. Borrado de tanteos, confirmación 2.
11. Tanteo maestro-detalle.
12. Editor APU.
13. Catálogo de recursos APU abierto.
14. Editor de recurso.
15. Menú de reportes.
16. Previsualización de reporte.
17. Generación de reporte.

### Evidencia C04.6

- Matriz conjunta de 17 superficies:
  `artifacts/visual-certification/2026-07-25T05-10-49-205Z`.
- Repetición aislada APU Lenovo P12 retrato:
  `artifacts/visual-certification/2026-07-25T05-17-57-020Z`.
- Catálogo APU con contrato de estado abierto:
  `artifacts/visual-certification/2026-07-25T05-06-07-447Z`.
- Visor de reporte corregido:
  `artifacts/visual-certification/2026-07-25T05-08-16-117Z`.
- Visor en los tres perfiles retrato:
  `artifacts/visual-certification/2026-07-25T05-09-39-870Z`.
- Tabla y notas después de ampliar objetivos táctiles:
  `artifacts/visual-certification/2026-07-25T05-21-33-628Z`.
- Hojas `*-contact-sheet.png` y captura `*-scroll-end.png` de las
  ejecuciones anteriores.

### Incidencias de certificación C04.6

- Las primeras capturas de la superficie principal detectaron acciones
  recortadas y herramientas demasiado pequeñas pese al PASS geométrico.
- En retrato el catálogo persistente consumía cerca del 40 % del editor. Se
  sustituyó por rail + drawer; no se aplicó zoom ni escalado global.
- La primera prueba de desplazamiento encontró cabecera y cuerpo desincronizados.
  La causa era un efecto que se ejecutaba mientras el componente mostraba el
  estado de carga y no volvía a enlazar las referencias. Se corrigió el ciclo de
  enlace y se añadió un contrato explícito de sincronización.
- La primera composición APU dividía editor y catálogo aproximadamente al 50 %;
  fue rechazada visualmente aunque la geometría pasaba.
- El minimapa dejó inicialmente el drawer del catálogo detrás; se corrigió el
  cierre de superficies mutuamente excluyentes.
- El menú de reportes quedó fuera del viewport en paisaje compacto en dos
  iteraciones y además tuvo un localizador de prueba incorrecto. Ambas
  incidencias están preservadas en las ejecuciones previas y el resultado final
  usa posicionamiento limitado al viewport.
- La primera hoja del catálogo de recursos APU mostraba rail colapsado en varios
  perfiles aunque el escenario daba PASS. Se corrigió la carrera de
  inicialización del perfil y el certificador ahora exige drawer >= 280 px y
  buscador visible.
- La primera hoja del visor de reporte mostró tarjetas económicas comprimidas
  en retrato. Se cambió la composición por contenido, apilando hasta `xl`, y se
  repitieron los perfiles afectados.
- La matriz conjunta terminó con 169 PASS y un
  `net::ERR_NO_BUFFER_SPACE` al cargar el último APU en Lenovo retrato. La
  combinación se repitió sola en un navegador limpio y pasó con captura real;
  se clasifica como fallo de infraestructura del intento, no como PASS original.
- El detector Impeccable conserva un aviso `side-tab` en
  `EdtValoradaModal.jsx`. El archivo no tiene importadores ni ruta activa; queda
  inventariado como componente huérfano y no se presenta como superficie
  certificada.
- Los avisos `gray-on-color` sobre clases `hover:*` de acciones son falsos
  positivos de ramas de Tailwind: el color base y el fondo hover no se renderizan
  como la combinación descrita. El subtotal activo sí fue corregido a
  `text-emerald-950`.

### Archivos tratados

- `frontend/src/components/presupuestos/PresupuestoDetail.jsx`.
- `frontend/src/components/presupuestos/LineasPresupuestoTab.jsx`.
- `frontend/src/components/presupuestos/ApuBudgetEditor.jsx`.
- `frontend/src/components/presupuestos/TanteoTab.jsx`.
- `frontend/src/components/presupuestos/IndirectosModal.jsx`.
- `frontend/src/components/presupuestos/ParetoModal.jsx`.
- `frontend/src/components/presupuestos/NotasGeneralesModal.jsx`.
- `frontend/src/components/reporting/CommonReportPreviewModal.jsx`.
- `frontend/src/components/projects/ProjectSectionReportButton.jsx`.
- `frontend/src/__classic_budget_harness.jsx` y 17 harnesses C04.6.
- `frontend/scripts/certify-visual-surface-matrix.mjs`.
- `docs/architecture/visual-surface-inventory.json`.

## Siguiente unidad

`C04.7 - Cronogramas`: EN CURSO.
