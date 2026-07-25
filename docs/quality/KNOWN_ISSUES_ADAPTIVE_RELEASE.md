# Incidencias conocidas - adecuacion adaptativa

Este registro impide que un fallo observado se pierda o se trate como aprobado.
La evidencia detallada de ESLint vive en `FRONTEND_ESLINT_BASELINE.md`.

## QI-001 - Baseline ESLint frontend

- Estado: ABIERTO.
- Severidad: deuda tecnica; contiene hallazgos potencialmente funcionales que
  deben triarse antes de corregirse por lotes.
- Reproduccion: `cd frontend && npm run lint`.
- Evidencia: 315 errores y 96 avisos en 111 archivos (411 hallazgos).
- Registro individual: `docs/quality/FRONTEND_ESLINT_BASELINE.md` incluye cada
  archivo, linea, columna, severidad, regla y mensaje.
- Regla de mantenimiento: el baseline se regenera con
  `npm run quality:eslint:baseline`; una release no puede aumentar el conteo sin
  una incidencia nueva y una justificacion explicita.
- Criterio de cierre: cero errores, avisos aceptados explicitamente o corregidos,
  y `npm run lint` con codigo de salida 0.

## QI-002 - Validadores Gantt dependientes de PostgreSQL local

- Estado: BLOQUEO DE ENTORNO ABIERTO.
- Severidad: alta para certificacion, sin evidencia actual de regresion funcional.
- Reproduccion: ejecutar `validate-gantt-layout-dom.mjs`,
  `validate-gantt-scrollbar-geometry.mjs` o
  `validate-gantt-ff-predecessor-dom.mjs` sin una conexion local valida.
- Resultado: PostgreSQL en `localhost:5432` rechaza la autenticacion y no puede
  generarse la respuesta enriquecida real de Santiago Bermeo.
- Cobertura disponible: `smoke:gantt-classic` pasa 1326 comprobaciones de
  dependencias, puntero, escala y scroll; no sustituye el fixture real.
- Criterio de cierre: restaurar una conexion autorizada, ejecutar los tres
  validadores con el fixture real y guardar capturas/reportes PASS.

## QI-003 - Certificacion Lenovo fisica pendiente

- Estado: PENDIENTE DE RETEST FISICO EN BETA 5.
- Severidad: bloqueante para cerrar TASK-2048.
- Cobertura disponible: AVD Android 2944x1840, DPR 2, 59/59 superficies PASS en
  horizontal y 59/59 en vertical.
- Criterio de cierre: desplegar la misma version sobre la beta actual y obtener
  PASS en Lenovo Tab P12 fisica, Chrome y Opera, horizontal y vertical.

## QI-005 - Propiedad incorrecta del scroll en Proyectos

- Estado: CORREGIDO EN `3.1.0-beta.6`; pendiente de confirmacion fisica.
- Severidad: bloqueante; contenido visible pero inaccesible en Lenovo Tab P12.
- Reproduccion original: abrir Proyectos para Santiago Bermeo y arrastrar
  verticalmente sobre la tabla. La prueba programatica alcanzaba el final, pero
  el gesto tactil real no desplazaba el listado.
- Causa raiz: habia dos propietarios verticales anidados. La tabla declaraba
  desplazamiento tactil horizontal y consumia el gesto antes de que llegara al
  viewport vertical de la pagina.
- Correccion beta 5 rechazada: trasladaba el desplazamiento al contenido
  completo y movia tambien cabecera y controles. No cumple la interaccion
  solicitada.
- Correccion beta 6: el marco de pagina usa `overflow-hidden`; cabecera y
  controles son regiones fijas, y el viewport del listado es el unico
  propietario de los desplazamientos vertical y horizontal.
- Regresion automatizada: el certificador emite gestos tactiles CDP reales y
  verifica movimiento efectivo, no solo asignaciones de `scrollTop`.
- Evidencia: gesto iniciado sobre las filas desplaza el listado 528 px en
  horizontal y 527 px en vertical, mientras la posicion de los controles cambia
  exactamente 0 px en ambas orientaciones Lenovo.
- Criterio de cierre: confirmacion en Lenovo fisica sobre la beta 5.

## QI-006 - Dos harnesses requieren infraestructura especializada

- Estado: CONTROLADO.
- `bim-fragments-csg-harness` no puede ejecutarse con el mock JSON generico de
  la matriz porque consume un artefacto binario Fragments. Su validador dedicado
  aprobo 18 437 bytes, geometria real y conservacion de volumen con delta 0.
- `gantt-ff-harness` requiere la respuesta enriquecida de PostgreSQL de Santiago
  Bermeo. La indisponibilidad de autenticacion local permanece registrada en
  QI-002; no se declara como PASS ni se oculta dentro de la matriz.

## QI-007 - Avisos de contraste del detector visual

- Estado: ABIERTO Y DOCUMENTADO; no introducido por el saneamiento de scroll.
- El detector Impeccable registro siete avisos `gray-on-color`: uno en
  `FormulaPolinomicaTab.jsx:653` y seis en `Cronogramas.jsx` (`3378`, `3612` y
  `3620`, con dos combinaciones detectadas por linea).
- No son cortes ni bloqueos de interaccion. Se conservan como deuda verificable
  y deben resolverse mediante medicion de contraste antes de alterar la paleta
  aprobada de esos estados.

La ejecucion unica posterior a la adecuacion BIM beta 6 anadio diez avisos
`gray-on-color` ya presentes en estados seleccionados de Aceptacion as-built,
Commissioning, Ordenes de cambio, Contratos, Pagos, SOV, Dossier y Punch, y un
aviso `overused-font` sobre Inter en el sistema tipografico global. No son
cortes, cambios de tamaño ni bloqueos tactiles. Se conservan en esta incidencia
para medir contraste y evaluar tipografia como una decision de diseno separada,
sin alterar silenciosamente la identidad visual durante la correccion
adaptativa.

La certificacion C02.2 registra ademas un aviso estatico en
`PreciosUnitarios.jsx:146`. Es un falso positivo verificable causado por ramas
de clase mutuamente excluyentes dentro del mismo template: el estado
deshabilitado usa texto zinc sobre fondo zinc, mientras el estado activo usa
texto `#B45309` sobre el hover `amber-50`. Las capturas de ambos estados y los
atributos `disabled` confirman que la combinacion denunciada no llega a
renderizarse. Se conserva el aviso para no silenciar reglas globales.

## QI-008 - Workbenches BIM con columnas rigidas

- Estado: CORREGIDO EN `3.1.0-beta.6`; pendiente de confirmacion fisica.
- Severidad original: alta en tablet vertical y paneles BIM redimensionados.
- Superficies afectadas: aceptacion as-built, commissioning, ordenes de cambio,
  partes de cuadrilla, contratos, SOV, pagos, estimacion, forecast, cierre punch,
  dossier de entrega, transicion a Operaciones y colaboracion CDE.
- Causa raiz: la composicion declaraba columnas laterales fijas de 280 a 520 px
  en funcion del viewport. El espacio real pertenece al panel BIM anidado, no a
  la ventana, por lo que resolucion fisica y DPR no garantizaban espacio util.
- Correccion: contrato comun basado en `container-type: inline-size`. Por debajo
  de 64 rem, formulario y registro se apilan a ancho completo; por encima,
  recuperan dos columnas con ancho lateral propio de cada herramienta. Los
  registros anchos conservan desplazamiento bidireccional independiente.
- Evidencia visual revisada: matriz posterior de 118/118 combinaciones PASS en
  Lenovo P12 horizontal y vertical, con capturas completas en
  `artifacts/visual-certification/2026-07-24T22-56-04-266Z`.
- Evidencia DOM: trece validadores dedicados de las superficies modificadas y
  el contrato `validate-bim-workspace-v2-dom.mjs` pasan. Este ultimo se actualizo
  para exigir el perfil adaptable compacto a 1366x768, en lugar de una guarda
  heredada que rechazaba la interfaz.
- Criterio de cierre: confirmar la misma composicion en Lenovo fisica, Chrome y
  Opera, tras desplegar exactamente beta 6.

## QI-004 - Advisories npm del frontend

- Estado: ABIERTO Y DOCUMENTADO.
- Reproduccion: `cd frontend && npm audit --json`.
- Evidencia: 13 paquetes afectados; 2 de severidad baja, 1 moderada, 10 alta
  y 0 critica. El conteo corresponde a paquetes, no al numero de GHSA.
- Contexto de runtime: el frontend publicado es contenido estatico Nginx; Vite,
  Rollup, Babel y ESLint no se ejecutan en el contenedor final. Esto reduce la
  exposicion, pero no elimina la obligacion de actualizar la cadena de build.

| Paquete | Severidad | Directa | Advisories asociados |
|---|---|---|---|
| `@babel/core` | baja | no | GHSA-4x5r-pxfx-6jf8 |
| `@redocly/openapi-core` | moderada | no | heredado de `js-yaml` |
| `brace-expansion` | alta | no | GHSA-f886-m6hf-6m8v; GHSA-3jxr-9vmj-r5cp |
| `esbuild` | baja | no | GHSA-g7r4-m6w7-qqqr |
| `flatted` | alta | no | GHSA-25h7-pfq9-p65f; GHSA-rf6f-7fwh-wjgh |
| `js-yaml` | alta | no | GHSA-h67p-54hq-rp68; GHSA-52cp-r559-cp3m |
| `minimatch` | alta | no | GHSA-3ppc-4f35-3m26; GHSA-7r86-cg39-jmmj; GHSA-23c5-xmqv-rm74 |
| `picomatch` | alta | no | GHSA-3v7f-55p6-f55p; GHSA-c2c7-rcm5-vvqj |
| `postcss` | alta | si | GHSA-qx2v-qp2m-jg93; GHSA-6g55-p6wh-862q; GHSA-r28c-9q8g-f849 |
| `react-router` | alta | no | GHSA-qwww-vcr4-c8h2 |
| `react-router-dom` | alta | si | heredado de `react-router` |
| `rollup` | alta | no | GHSA-mw96-cpmx-2vgc |
| `vite` | alta | si | GHSA-4w7w-66w2-5vf9; GHSA-v2wj-q39q-566r; GHSA-p9ff-h696-f583; GHSA-v6wh-96g9-6wx3; GHSA-fx2h-pf6j-xcff |

- Excepcion conocida: GHSA-qwww-vcr4-c8h2 afecta acciones RSC; GiProy es una
  SPA sin superficie RSC. El smoke de seguridad verifica explicitamente esa
  ausencia, pero el advisory permanece abierto hasta disponer de una version
  corregida compatible.
- Criterio de cierre: actualizar dependencias sin `--force`, ejecutar build,
  matriz visual, smokes Classic/BIM y `npm audit`; documentar por separado
  cualquier advisory que deba conservarse temporalmente.
