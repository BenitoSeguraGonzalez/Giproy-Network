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

## Siguiente unidad

`C02.2 - Precios Unitarios`: EN CURSO.
