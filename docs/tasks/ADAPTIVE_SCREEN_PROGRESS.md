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

## C04.7 - Cronogramas

Estado: **EN INVENTARIO Y ADECUACIÓN**
Fecha de inicio: 2026-07-25

### Mapa de superficies confirmado en código

#### Shell y vistas principales

1. Cabecera del módulo, selector Gantt/Valorado/Recursos y acciones de reporte.
2. Gantt operativo: grilla de actividades + escala temporal.
3. Cronograma valorado: tabla de porcentajes.
4. Cronograma valorado: valores económicos.
5. Cronograma valorado: flujo de caja.
6. Cronograma valorado: Curva S.
7. Uso de recursos en modo lectura/análisis.

#### Configuración, menús y paneles del valorado/recursos

8. Banda de configuración expandida/colapsada.
9. Menú de tipo de periodo.
10. Menú de modo de distribución.
11. Configurador de columnas.
12. Menú de reportes Gantt.
13. Menú de reportes valorados.
14. Menú de reportes de recursos.
15. Diálogo de reporte de recursos por rango.
16. Previsualización de reporte.
17. Generación de reporte.
18. Configuración de impresión clásica Gantt.
19. Configuración de impresión clásica Curva S.

#### Herramientas y estados internos Gantt

20. Menú de herramientas.
21. Menú/selector de escala temporal y zoom.
22. Panel de configuración Gantt.
23. Panel de historial/undo-redo.
24. Menú de interoperabilidad MS Project.
25. Calendario laboral y festivos.
26. Pareto temporal.
27. Menú contextual de actividad/segmento.
28. Alta rápida de sucesora.
29. División de segmento.
30. Ajuste fino de inicio de segmento.
31. Comparación/reconciliación.
32. Señales de planificación APU.
33. Selector de representación de duración.
34. Editor operativo de recurso.
35. Contribución de recurso.
36. Selector de gobernanza y tipo de subcontrato.

Este mapa es inicial pero vinculante: una superficie solo puede retirarse si se
demuestra que no tiene importador, ruta ni disparador alcanzable. El harness
`gantt-ff-harness.html` existente no basta como certificación global porque
depende de un fixture externo ausente y no abre los estados anteriores.

### C04.7.1 - Gantt operativo, escala/zoom y desplazamiento sincronizado

Estado: **CERTIFICADA EN 10/10 PERFILES**

Alcance tratado:

- superficie principal dividida: grilla de actividades + timeline;
- selector `Tabla / Dividida / Gantt`;
- activación de edición táctil;
- búsqueda y avance entre coincidencias;
- navegación de ruta crítica;
- escala temporal, bloqueo, zoom, ajuste al viewport y confirmación;
- desplazamiento vertical y horizontal interno sincronizado;
- estado inicial y estado al final del desplazamiento.

Adecuación aplicada:

- por debajo de `1600px` lógicos los controles operativos abandonan la fila
  rígida compartida con el selector de vista y ocupan una banda completa;
- por debajo de `1400px` lógicos el grupo de escala/zoom se convierte en una
  tercera banda funcional, sin reducir el lienzo ni los controles;
- por debajo de `900px` lógicos búsqueda y navegación crítica se presentan en
  bandas independientes de ancho completo;
- no se aplicó `zoom`, `transform: scale()` ni reducción global de tipografía;
- la tabla y el timeline conservan sus propios viewports y el documento no se
  convierte en el contenedor de desplazamiento.

Diagnóstico y errores preservados:

1. Ejecución inicial Lenovo horizontal
   `2026-07-25T05-37-32-442Z`: **FAIL**, `125px` de overflow documental y tres
   controles finales recortados. La captura demostró que la causa era la barra
   superior rígida, no el lienzo Gantt.
2. Primera corrección
   `2026-07-25T05-40-31-429Z`: **PASS** Lenovo horizontal; se inspeccionaron
   manualmente captura inicial y captura al final del scroll.
3. Intento de matriz
   `2026-07-25T05-41-23-602Z`: lote **NO VÁLIDO** por caída del servidor Vite
   (`ERR_CONNECTION_RESET/REFUSED`). No se contabiliza como fallo visual.
4. Matriz aislada por perfil: detectó fallos reales residuales en
   escritorio 150 %, tabletas horizontales y retrato. Las capturas mostraron
   que los grupos internos aún competían por la misma fila.
5. Segunda corrección: escritorio 150 %, tablet FHD horizontal, tablet 2K
   horizontal y Lenovo retrato pasaron; FHD/2K retrato conservaron `50px/15px`
   de overflow.
6. Tercera corrección: la captura FHD retrato confirmó que búsqueda y
   navegación crítica crecían a unos `380px` cada una. Se separaron únicamente
   por debajo de `900px`.

Evidencia final representativa:

- Lenovo P12 horizontal:
  `artifacts/visual-certification/2026-07-25T05-43-05-248Z/`;
- escritorio FHD a 150 %:
  `artifacts/visual-certification/2026-07-25T05-43-58-572Z/`;
- tablet FHD horizontal:
  `artifacts/visual-certification/2026-07-25T05-44-02-970Z/`;
- tablet 2K horizontal:
  `artifacts/visual-certification/2026-07-25T05-44-13-247Z/`;
- Lenovo P12 retrato:
  `artifacts/visual-certification/2026-07-25T05-44-23-556Z/`;
- tablet FHD retrato:
  `artifacts/visual-certification/2026-07-25T05-45-15-492Z/`;
- tablet 2K retrato:
  `artifacts/visual-certification/2026-07-25T05-45-20-371Z/`.

Resultado visual confirmado:

- `10/10` perfiles sin overflow documental ni controles recortados;
- en horizontal se conserva la vista dividida y los paneles se desplazan;
- en retrato se prioriza la tabla y únicamente su viewport permite alcanzar
  columnas no visibles;
- barra operativa completa y estable tanto al inicio como al final del scroll.

Pendiente dentro de C04.7: abrir, adecuar y certificar una a una las superficies
3 a 36 del inventario anterior. Esta certificación no cierra Cronogramas.

### C04.7.2 - Menú Herramientas del Gantt

Estado: **CERTIFICADA EN 10/10 PERFILES**

Superficie real abierta y revisada:

- Undo de la versión anterior;
- restauración del estado inicial;
- acceso a Configuración;
- acceso a Historial;
- acción destructiva Factory reset.

Decisión UX:

- el menú mantiene un ancho contenido y se ancla al disparador;
- en retrato se abre hacia el interior del viewport sin recortar acciones;
- las acciones mantienen una altura mínima de `46px`;
- las acciones no disponibles conservan legibilidad como estado deshabilitado;
- Factory reset se diferencia semánticamente mediante tratamiento destructivo,
  sin competir con Configuración e Historial.

Contrato de prueba añadido:

- `gantt-tools-harness.html` monta el componente real con fixture determinista;
- Playwright abre `Herramientas del Gantt`, espera `Factory reset` y estaciona
  el puntero fuera de superficies hover;
- el primer contrato movía el puntero al centro y activaba accidentalmente el
  tooltip de una actividad en retrato. La evidencia fue rechazada y el
  contrato se corrigió antes de la matriz final.

Evidencia final:

- matriz completa entre
  `artifacts/visual-certification/2026-07-25T05-47-53-691Z/` y
  `artifacts/visual-certification/2026-07-25T05-48-41-915Z/`;
- captura final Lenovo horizontal:
  `artifacts/visual-certification/2026-07-25T05-48-36-132Z/`;
- captura final Lenovo retrato:
  `artifacts/visual-certification/2026-07-25T05-48-41-915Z/`.

Resultado: `10/10` perfiles, sin overflow documental, clipping interactivo ni
hover ajeno a la subpantalla.

### C04.7.3 - Panel Configuración de Gantt

Estado: **CERTIFICADA EN 10/10 PERFILES**

Contenido inspeccionado:

- preferencias visuales;
- fechas de inicio y objetivo;
- días y horas laborables;
- inicio de jornada;
- resumen y acceso al calendario laboral.

Adecuación/verificación:

- panel anclado, con altura máxima y scroll vertical propio;
- campos apilados en retrato sin reducir tipografía ni escalar el panel;
- cierre aumentado de `32x32` a `44x44` en entornos coarse/touch;
- acción primaria de calendario ocupa el ancho disponible;
- el lienzo Gantt permanece inmóvil detrás del panel.

Contrato: `gantt-config-harness.html`, abierto desde Herramientas mediante el
flujo real. Evidencia final entre
`2026-07-25T05-52-49-691Z` y `2026-07-25T05-53-42-092Z`.
Capturas inspeccionadas manualmente: Lenovo horizontal
`2026-07-25T05-53-35-928Z` y Lenovo retrato
`2026-07-25T05-53-42-092Z`.

Resultado: `10/10` perfiles.

### C04.7.5 - Calendario laboral y festivos

Estado: **CERTIFICADA EN 10/10 PERFILES**

Flujo real: Herramientas -> Configuración -> Abrir calendario laboral.

Contenido tratado:

- rango operativo de 106 días;
- estadísticas de laborables, no laborables, festivos oficiales y manuales;
- leyenda, día seleccionado y navegación al Gantt;
- meses julio, agosto y septiembre;
- parámetros base;
- creador de horarios;
- alta y listado de festivos manuales.

Errores detectados mediante captura y rechazados:

1. El fixture usaba claves inglesas y el modal aparecía sin rango ni meses,
   aunque el DOM daba PASS. Se corrigió con las claves persistidas reales,
   rango objetivo y festivos deterministas.
2. En retrato, el grid de altura fija comprimía sus filas automáticas y el
   bloque `Parámetros base` se superponía al calendario. La primera propuesta
   de flujo único seguía cruzando contenido y también fue rechazada.
3. El certificador genérico desplazaba el Gantt subyacente por tener mayor
   delta vertical. Se añadió un marcador explícito para certificar el extremo
   del viewport del modal.

Adecuación aplicada:

- dos columnas y viewports independientes solo en `xl`;
- una columna en tablet/retrato con filas `max-content` y un único scroll
  vertical del modal;
- cierre y acciones del día seleccionado a `44x44`;
- cabecera y estadísticas permanecen fijas mientras el contenido operativo se
  desplaza;
- ningún scroll del documento ni del Gantt se usa para alcanzar el final del
  calendario.

Contrato: `gantt-calendar-harness.html` y
`data-gantt-calendar-viewport="true"`.

Evidencia final completa entre
`2026-07-25T06-02-02-097Z` y `2026-07-25T06-02-54-568Z`.
Capturas inspeccionadas:

- Lenovo horizontal inicio:
  `artifacts/visual-certification/2026-07-25T06-02-48-443Z/`;
- Lenovo retrato inicio y extremo:
  `artifacts/visual-certification/2026-07-25T06-02-54-568Z/`.

Resultado: `10/10` perfiles sin overflow, clipping ni superposición.

### C04.7.6 - Pareto temporal del Gantt

Estado: **CERTIFICADA EN 10/10 PERFILES**

Contenido tratado:

- modos Integrado, Tiempo y Costo;
- Top 10/20/50 y filtro de actividades críticas;
- filtro EDT, ventana de fechas y búsqueda;
- seis métricas resumen;
- tabla Pareto de 20 actividades con desplazamiento horizontal;
- detalle financiero/temporal, navegación al Gantt y dominante actual;
- acción de reporte y cierre.

Adecuación aplicada:

- escritorio `xl`: maestro–detalle simultáneo, con scrolls internos separados;
- tablet y retrato: un único flujo vertical del modal, lista completa seguida
  del detalle, manteniendo solo el scroll horizontal de la tabla;
- métricas en `2/3/6` columnas según espacio real;
- controles, fechas, filtros, cierre y CTA con objetivo táctil mínimo de `44px`;
- modal elevado a `z-index: 1200` para quedar por encima de todos los portales
  y controles del Gantt;
- fixture API determinista de 20 actividades con pesos normalizados a `100%`.

Errores detectados y rechazados mediante captura/prueba:

1. El primer render mostraba un control negro del Gantt sobre el modal porque
   Pareto usaba una capa inferior. Se corrigió la jerarquía modal.
2. El fixture inicial generaba acumulados superiores a `100%`; se normalizaron
   los pesos antes de aceptar evidencia.
3. La primera matriz completa falló en tablet FHD/2K retrato: la tabla y el
   viewport maestro tenían scroll vertical anidado y el gesto quedaba atrapado.
   Se eliminó el scroll vertical interno fuera de `xl` y se añadió el contrato
   de un único viewport vertical.

Contrato: `gantt-pareto-harness.html` y
`data-gantt-pareto-viewport="true"`.

Evidencia final completa entre
`2026-07-27T12-46-38-576Z` y `2026-07-27T12-47-26-950Z`.
Capturas revisadas manualmente:

- Lenovo horizontal:
  `artifacts/visual-certification/2026-07-27T12-47-21-392Z/`;
- Lenovo retrato:
  `artifacts/visual-certification/2026-07-27T12-47-26-950Z/`;
- tablet FHD retrato, inicio y extremo:
  `artifacts/visual-certification/2026-07-27T12-46-02-236Z/`.

Resultado: `10/10` perfiles; detector Impeccable sin hallazgos.

### C04.7.24 - Interoperabilidad Microsoft Project

Estado: **CERTIFICADA EN 30/30 COMBINACIONES VISUALES**

Contenido tratado:

- menú desplazable de Herramientas y grupo Interoperabilidad;
- exportación XML Project;
- exportación directa `.mpp` condicionada por capacidad real del servidor;
- importación XML MS Project;
- confirmación previa de importación;
- aviso de generador `.mpp` no disponible;
- estados de carga, deshabilitado y alternativa XML.

Adecuación aplicada:

- se conectaron al menú los manejadores que existían pero no tenían ningún
  control visible, restaurando el acceso real a la funcionalidad;
- las tres acciones se separaron semánticamente y mantienen objetivos táctiles
  de `46px` dentro de un viewport propio del menú;
- se añadió un contrato de desplazamiento interno
  `data-gantt-tools-scroll="true"`, sin desplazar el documento ni el Gantt;
- el proveedor global de diálogos recibió `role="dialog"`, `aria-modal`, título
  enlazado, cierre etiquetado y controles de al menos `44px`;
- el harness del Gantt monta ahora el mismo proveedor de diálogos que producción;
- el mensaje de disponibilidad `.mpp` distingue capacidad real, motivo del
  servidor y carril alternativo sin contradicciones ni duplicación.

Errores detectados y corregidos mediante captura/prueba:

1. Los manejadores MS Project eran código inaccesible: no existían botones que
   los invocaran en el Gantt.
2. El menú inicial solo mostraba parte del grupo nuevo; una superficie específica
   confirmó por captura el extremo inferior y el alcance táctil del scroll.
3. La primera matriz modal expiró porque el harness no montaba el proveedor real
   y el componente global carecía de semántica de diálogo. Se corrigieron ambos.
4. El primer aviso `.mpp` decía simultáneamente disponible y no disponible.
5. La segunda redacción repetía dos veces la alternativa XML; se simplificó antes
   de aceptar la evidencia final.

Contratos:

- `gantt-ms-project-harness.html`: extremo inferior del menú;
- `gantt-ms-project-import-harness.html`: confirmación de importación;
- `gantt-ms-project-mpp-unavailable-harness.html`: aviso de capacidad;
- inventario visual: `120` harnesses.

Evidencia aceptada:

- menú superior: `2026-07-27T14-16-05-359Z` (`10/10`);
- menú desplazado: `2026-07-27T14-18-08-523Z` (`10/10`);
- confirmación de importación: `2026-07-27T14-28-27-998Z` (`10/10`);
- aviso `.mpp` final: `2026-07-27T14-29-38-727Z` (`10/10`).

Evidencia rechazada y conservada:

- `2026-07-27T14-22-35-260Z`: diálogo inexistente en el harness;
- `2026-07-27T14-26-53-688Z`: contradicción de disponibilidad;
- `2026-07-27T14-28-27-998Z`, aviso `.mpp`: texto alternativo duplicado;
  la confirmación de importación de esta misma ejecución sí es válida.

Hallazgos Impeccable pendientes, asignados a sus unidades visuales y no omitidos:

- `CronogramaGantt.jsx:19022`: gris sobre fondo naranja;
- `CronogramaGantt.jsx:20760`: gris sobre fondo celeste;
- `CronogramaGantt.jsx:22649`: gris sobre fondo rosa;
- `CronogramaGantt.jsx:23430`: gris sobre fondo celeste.

Resultado: interoperabilidad accesible y verificable; `30/30` combinaciones
aceptadas entre menú, confirmación y aviso final.

### C04.7.27 - Menú contextual de tarea y segmento

Estado: **CERTIFICADA EN 30/30 COMBINACIONES VISUALES**

Contenido tratado:

- disparadores del menú en tabla densa, barra de tarea y subtramo;
- cabecera con referencia, descripción, periodo y selección múltiple;
- ajuste fino, contexto, undo/redo, dependencia rápida y movimiento vertical;
- generación, división, unión, reagrupación y agrupación de tramos;
- estados habilitado, deshabilitado y tarea/segmento activo.

Adecuación aplicada:

- el menú pasó a ser un contenedor contextual semántico `role="menu"` con
  etiqueta accesible por tarea;
- altura máxima ligada al viewport (`100dvh - 2rem`), cabecera fija y cuerpo con
  scroll vertical propio y `overscroll-contain`;
- ancho protegido por el viewport en retrato;
- todas las acciones del menú tienen objetivo táctil mínimo de `44px`;
- disparadores de tarea en tabla y timeline ampliados a `44px` y etiquetados;
- el affordance visual de segmento conserva su tamaño compacto, pero amplía su
  área táctil efectiva a `44px` sin deformar la barra;
- contratos DOM de candidato, alineación y envolvente de subtramos para detectar
  fixtures visualmente inválidos.

Errores detectados y corregidos mediante captura/DOM:

1. El diseño original contenía hasta once acciones de `32px`, sin viewport
   interno y con una altura estimada fija de `332px`; podía cortar el final.
2. El primer fixture de segmento no contenía subtramos operativos.
3. La respuesta API y el fallback local divergían; se aseguró una fuente
   determinista para la superficie especializada.
4. Los subtramos existían (`SEL 1`) pero su envolvente no coincidía con la barra,
   por lo que el renderer los ocultaba correctamente. Diagnóstico exacto:
   barra `21.33/85.33px`, envolvente inicial `16.38/73.14px`.
5. El tooltip interceptaba el gesto sintético; la prueba usa el botón accesible
   real sin forzar coordenadas visuales.
6. En tablet retrato la vista inicial es Tabla y el segmento queda fuera del
   viewport. La certificación reproduce el flujo correcto: seleccionar tarea,
   cambiar a Gantt y abrir el tramo visible.

Contratos:

- `data-gantt-task-action-menu="true"`;
- `data-gantt-candidate-subbars`, `data-gantt-subbars-aligned`,
  `data-gantt-subbar-envelope`;
- `gantt-task-menu-harness.html` y `gantt-task-menu-end-harness.html`;
- `gantt-segment-menu-harness.html`;
- inventario visual: `123` harnesses.

Evidencia aceptada:

- menú de tarea, inicio y final: `2026-07-27T14-36-34-511Z` (`20/20`);
- segmento Lenovo horizontal: `2026-07-27T14-58-54-662Z`;
- corrección retrato: `2026-07-27T15-00-17-738Z` (`3/3`);
- regresión final de segmento: `2026-07-27T15-00-45-146Z` (`10/10`).

Evidencia rechazada y conservada:

- `2026-07-27T14-40-10-482Z`, `14-42-42-984Z`, `14-43-46-822Z`,
  `14-44-38-986Z` y `14-45-35-645Z`: fixture sin segmento materializado;
- `2026-07-27T14-56-24-735Z`: diagnóstico de envolvente desalineado;
- `2026-07-27T14-56-52-187Z`: tooltip interceptando el clic;
- `2026-07-27T14-57-54-997Z`: asunción incorrecta sobre etiqueta de periodo;
- `2026-07-27T14-59-12-800Z`: tres retratos intentaban actuar desde Tabla.

Resultado: tarea y segmento accesibles, desplazables y completos; `30/30`.

### C04.7.28 - Creación rápida de sucesora

Estado: **CERTIFICADA EN 40/40 COMBINACIONES VISUALES**

Contenido tratado:

- diálogo de creación desde tarea origen;
- referencia por ID/código EDT y resolución de destino;
- tipo FC/CC/FF/CF, shortcode, desfase y unidad;
- estado resuelto, referencia inválida y mensaje de error;
- transición a selección visual de tarea destino;
- acciones cancelar/crear en viewports de poca altura.

Adecuación aplicada:

- diálogo semántico con título accesible, `aria-modal` y contrato DOM;
- altura máxima por `dvh`, scroll vertical único y overscroll contenido;
- padding/radio adaptados sin escalar tipografía ni componentes;
- acciones y sugerencias con objetivo táctil mínimo de `44px`;
- al elegir destino se cambia automáticamente a vista Gantt, garantizando que
  origen y candidatos sean visibles también en tablet retrato;
- contratos explícitos para error y tarea origen de selección visual.

Errores detectados y corregidos mediante captura/prueba:

1. El diálogo original no tenía límite de viewport, scroll ni rol accesible.
2. En tablet FHD horizontal las acciones inferiores quedaban parcialmente bajo
   el borde; una superficie desplazada confirmó su alcance completo.
3. La primera matriz de selección visual falló en los tres retratos: el modal se
   cerraba pero la app permanecía en Tabla, dejando el origen en un timeline
   oculto. La acción ahora abre Gantt antes de solicitar el destino.

Contratos:

- `data-gantt-quick-successor-dialog="true"`;
- `data-gantt-quick-successor-error="true"`;
- `data-gantt-quick-successor-source="true"`;
- cuatro harnesses de estado; inventario visual: `127` harnesses.

Evidencia aceptada:

- resuelta/inicio: `2026-07-27T15-07-23-180Z` (`10/10`);
- extremo inferior: `2026-07-27T15-08-37-546Z` (`10/10`);
- referencia inválida: `2026-07-27T15-13-58-607Z` (`10/10`);
- selección visual final: `2026-07-27T15-13-15-962Z` (`10/10`);
- corrección retrato inspeccionada: `2026-07-27T15-12-47-278Z` (`3/3`).

Evidencia rechazada y conservada:

- `2026-07-27T15-10-15-810Z`: selección visual inoperable en los tres retratos.

Resultado: flujo directo y visual completo; `40/40` combinaciones aceptadas.

### C04.7.29 - División controlada de segmentos

Estado: **CERTIFICADA EN 30/30 COMBINACIONES VISUALES**

Contenido tratado:

- cabecera y métricas Disponible/Monto/Asignado/Balance;
- número de partes, actualización y modo secuencial;
- tabla de porcentaje, duración, inicio y acciones;
- desplazamiento vertical del cuerpo y horizontal de la tabla;
- reordenamiento, eliminación, cancelar y aplicar división.

Adecuación aplicada:

- modal semántico con título accesible y altura basada en `dvh`;
- cabecera y pie fijos, con cuerpo vertical propietario;
- tabla técnica preservada a `58rem`, con scroll bidimensional propio y
  cabecera sticky; no se comprimieron columnas ni tipografía;
- ancho del panel ampliado hasta `52rem` cuando existe espacio;
- controles y acciones con objetivo táctil mínimo de `44px`;
- columna de acciones ampliada para alojar tres botones sin solapamiento;
- botón eliminar convertido a tono destructivo coherente y contrastado.

Errores detectados y corregidos:

1. El modal original carecía de rol accesible y usaba `overflow-hidden` en el
   cuerpo, pudiendo ocultar tabla y mensajes.
2. La tabla superaba ampliamente el ancho del panel, pero su contenedor cortaba
   el contenido sin scroll horizontal.
3. Controles de modo, filas y acciones medían entre `28px` y `40px`.
4. El detector señaló gris sobre el estado rosa del botón eliminar; se corrigió
   dentro de esta unidad. Permanecen tres hallazgos ya asignados a otras unidades.

Contratos:

- `data-gantt-split-dialog="true"`;
- `data-gantt-split-dialog-body="true"`;
- `data-gantt-split-table="true"`;
- tres harnesses; inventario visual: `130` harnesses.

Evidencia aceptada:

- prueba Lenovo retrato inicial: `2026-07-27T15-47-27-949Z` (`3/3`);
- matriz inicio/cuerpo/tabla: `2026-07-27T15-48-05-417Z` (`30/30`);
- regresión del extremo de acciones tras contraste:
  `2026-07-27T15-50-29-382Z` (`10/10`).

Resultado: modal y tabla completos, desplazables y táctiles; `30/30`.

### C04.7.30 - Ajuste fino de tarea y subtramo

Estado: **CERTIFICADA EN 30/30 COMBINACIONES VISUALES**

Contenido tratado:

- ajuste exacto del inicio de un subtramo mediante modal;
- validación de fecha/hora ausente y recuperación del error;
- ajuste del inicio global de una tarea dentro de la tabla dividida;
- calendario, hora, cancelar, aplicar, limpiar y cerrar;
- confirmación de seguridad CPM previa a la edición manual.

Adecuación aplicada:

- modal semántico con título accesible, altura basada en `dvh`, scroll propio y
  objetivos táctiles mínimos de `44px`;
- acción explícita `Limpiar fecha`, para permitir corregir o retirar el valor y
  exponer la validación sin depender de teclado físico;
- alerta de validación con rol y contrato DOM estable;
- editor de tarea con ancho útil mínimo, etiqueta accesible y objetivo táctil;
- apertura real del editor y calendario en diseño dividido, tanto con ratón
  como con interacción táctil;
- retirada de la animación de salida incompatible de `AnimatedDateInput`,
  conservando la animación de entrada y eliminando el aviso de runtime común.

Errores detectados y corregidos:

1. En diseño dividido, `Ajuste fino` intentaba enfocar el calendario antes de
   montar el editor; en tablet la acción no producía un control editable.
2. El selector no ofrecía una vía visual para vaciar una fecha, por lo que el
   usuario táctil no podía recuperar ese estado sin teclado.
3. El modal original carecía de semántica de diálogo y usaba acciones de
   `36px`.
4. La transición de salida del calendario emitía un aviso React/Framer Motion
   al desmontar el popover.
5. El tooltip envolvía un hijo que cambiaba de botón a editor y dejaba una capa
   fija transitoria fuera del viewport; se separaron ambos estados.

Contratos:

- `data-gantt-subbar-fine-tune="true"`;
- `data-gantt-subbar-fine-tune-error="true"`;
- `data-gantt-task-fine-tune="true"`;
- tres harnesses; inventario visual: `133` harnesses.

Evidencia rechazada y conservada:

- `2026-07-27T15-54-57-605Z`: corrida incompleta por timeout antes de finalizar
  la matriz;
- `2026-07-27T15-57-39-303Z`: ausencia de vaciado UI y editor no montado;
- `2026-07-27T16-01-22-189Z`, `2026-07-27T16-02-35-587Z` y
  `2026-07-27T16-03-28-442Z`: iteraciones de corrección con selector ambiguo,
  tooltip recortado y aviso de runtime.

Evidencia aceptada:

- Lenovo horizontal/vertical: `2026-07-27T16-04-11-200Z` (`6/6`);
- matriz completa: `2026-07-27T16-04-37-106Z` (`30/30`).

Capturas inspeccionadas manualmente: error en tablet Full HD retrato, modal en
Lenovo P12 retrato y editor/calendario en escritorio Full HD al `150%`.

Resultado: los dos recorridos de ajuste fino son editables, recuperables,
accesibles y visibles sin recortes; `30/30`.

### C04.7.31 - Comparación y reconciliación

Estado: **CERTIFICADA EN 40/40 COMBINACIONES VISUALES**

Contenido tratado:

- confirmación del tanteo actual como nueva referencia del cronograma;
- resumen dinámico de tareas, recursos, subtramos, conflictos, impactos
  económicos, tanteos CPM y ajustes de recursos;
- aviso de conflicto por cambios productivos en Presupuesto;
- comparación Presupuesto/Gantt con métricas agregadas, origen del cambio,
  partidas nuevas/modificadas, deltas temporales, cantidades, horas útiles,
  motor dominante y dependencias;
- estados inicial y extremo final desplazado de ambos recorridos.

Adecuación aplicada:

- ambos paneles son diálogos semánticos con título accesible y contratos DOM;
- altura basada en `dvh`, cabecera y pie fijos y cuerpo vertical propietario;
- el resumen de confirmación usa dos columnas en el ancho mínimo y tres cuando
  existe espacio, sin reducir tipografía ni ocultar métricas;
- la comparativa usa dos, tres o seis columnas según el ancho útil real;
- métricas y partidas comparten el mismo cuerpo desplazable, evitando que el
  resumen expulse el detalle o el pie fuera de pantalla;
- acciones apiladas en el ancho estrecho y alineadas horizontalmente cuando hay
  espacio; todos los botones y cierres alcanzan al menos `44px`;
- espaciado progresivo en cabecera, cuerpo y pie para retrato, paisaje y DPI
  alto de Windows.

Errores detectados y corregidos:

1. La confirmación no tenía rol de diálogo, carecía de altura máxima y su cuerpo
   no podía desplazarse si aparecían muchas métricas.
2. La comparativa mantenía el bloque de seis métricas fuera del scroll; en
   retrato podía consumir la altura y hacer inaccesible el detalle.
3. El resumen saltaba de una a seis columnas en función de un único breakpoint,
   sin etapa intermedia adecuada para tablet.
4. Los cierres y acciones medían entre `32px` y `40px`.
5. El pie flexible podía envolver texto y acciones sin preservar una zona de
   decisión estable.

Contratos:

- `data-gantt-approval-dialog="true"`;
- `data-gantt-approval-dialog-body="true"`;
- `data-gantt-compare-dialog="true"`;
- `data-gantt-compare-dialog-body="true"`;
- cuatro harnesses; inventario visual: `137` harnesses.

Evidencia aceptada:

- Lenovo horizontal/vertical, inicio y extremo:
  `2026-07-27T16-10-36-016Z` (`8/8`);
- matriz completa: `2026-07-27T16-11-20-678Z` (`40/40`).

Capturas inspeccionadas manualmente: confirmación en Lenovo P12 retrato,
comparativa final en Lenovo P12 retrato y comparativa inicial en Lenovo P12
horizontal.

Resultado: confirmación y conflicto Presupuesto/Gantt mantienen jerarquía,
detalle y decisiones siempre alcanzables; `40/40`.

### C04.7.32 - Señales de planificación APU

Estado: **CERTIFICADA EN 40/40 COMBINACIONES VISUALES**

Contenido tratado:

- panel flotante de semáforos del APU seleccionado;
- estado disponible con capacidad, recursos y costo unitario;
- cinco validaciones técnicas con estados correcto, revisar, inconsistente o sin
  datos;
- estado no calculable con explicación causal;
- fijar/desacoplar, apertura desde barra superior y accesos de fila;
- arrastre y recolocación limitada al viewport;
- estado inicial y extremo vertical desplazado.

Adecuación aplicada:

- recuperación visual de las validaciones que el modelo ya calculaba pero la UI
  no mostraba, incluyendo etiqueta, semáforo y detalle numérico/causal;
- panel con semántica de diálogo no modal, título accesible y cuerpo de scroll
  propietario;
- métricas en una o dos columnas según el ancho útil, sin truncar sus etiquetas;
- tipografía tabular reforzada para valores y unidades;
- acción fijar/desacoplar elevada a `44px`;
- accesos rápidos de fila conservan su densidad con ratón, pero alcanzan `44px`
  y permanecen visibles cuando el puntero es coarse/táctil;
- el arrastre mantiene el panel completamente dentro de los cuatro límites del
  viewport y el cuerpo conserva su scroll independiente.

Errores detectados y corregidos:

1. Las cinco validaciones de integridad se calculaban, pero nunca se renderizaban
   en el panel; el usuario solo veía un estado global sin explicación.
2. La acción de fijado medía `32px` y los accesos de fila `20px`.
3. Los accesos de fila dependían de `hover`, estado inexistente o inestable en
   tablet.
4. Las etiquetas de métricas usaban truncado incluso cuando podían reorganizarse
   en una columna.
5. El primer fixture “sin datos” era inválido porque un fallback reconstruía el
   ciclo gobernante; se rechazó y se creó un caso realmente no calculable.

Contratos:

- `data-gantt-apu-planning-signals="true"`;
- `data-gantt-apu-planning-signals-body="true"`;
- cuatro harnesses; inventario visual: `141` harnesses.

Evidencia rechazada y conservada:

- `2026-07-27T16-16-57-801Z`: selector de prueba ambiguo;
- `2026-07-27T16-17-33-496Z`: el estado no disponible recibía datos por fallback
  y el tooltip del disparador contaminaba la captura.

Evidencia aceptada:

- Lenovo horizontal/vertical, cuatro estados:
  `2026-07-27T16-18-35-393Z` (`8/8`);
- matriz completa: `2026-07-27T16-19-12-290Z` (`40/40`).

Capturas inspeccionadas manualmente: disponible y extremo en Lenovo P12 retrato,
arrastrado en Lenovo P12 horizontal y estado sin datos en Lenovo P12 retrato.

Resultado: métricas, validaciones, ausencia de datos, fijado, arrastre y scroll
son comprensibles y alcanzables en todos los perfiles; `40/40`.

### C04.7.4 - Panel Historial confirmado

Estado: **CERTIFICADA EN 10/10 PERFILES**

Estados tratados:

- historial poblado con dos confirmaciones;
- versión, fecha/hora, número de partidas, duración, trazas CPM y origen
  confirmado/restaurado;
- estado vacío inspeccionado inicialmente y preservado como contrato válido.

Correcciones de certificación:

- el fixture inicial solo alcanzaba el estado vacío; se añadieron metadatos
  deterministas de confirmación para revisar el contenido real;
- cierre aumentado de `32x32` a `44x44` en coarse/touch;
- el listado usa scroll propio cuando supera la altura disponible.

Contrato: `gantt-history-harness.html`, abierto desde Herramientas mediante el
flujo real. Evidencia final entre
`2026-07-25T05-53-47-955Z` y `2026-07-25T05-54-39-601Z`.
Capturas inspeccionadas manualmente: Lenovo horizontal
`2026-07-25T05-54-33-432Z` y Lenovo retrato
`2026-07-25T05-54-39-601Z`.

Resultado: `10/10` perfiles.
