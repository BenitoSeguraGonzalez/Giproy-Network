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

## Siguiente unidad

`G00.5 - Densidad y espaciado`: PENDIENTE.
