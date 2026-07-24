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

## QI-005 - El listado de Proyectos no respondia al gesto vertical

- Estado: CORREGIDO EN `3.1.0-beta.5`; pendiente de confirmacion fisica.
- Severidad: bloqueante; contenido visible pero inaccesible en Lenovo Tab P12.
- Reproduccion original: abrir Proyectos para Santiago Bermeo y arrastrar
  verticalmente sobre la tabla. La prueba programatica alcanzaba el final, pero
  el gesto tactil real no desplazaba el listado.
- Causa raiz: habia dos propietarios verticales anidados. La tabla declaraba
  desplazamiento tactil horizontal y consumia el gesto antes de que llegara al
  viewport vertical de la pagina.
- Correccion: la pagina es el unico propietario del desplazamiento vertical; la
  tabla conserva el desplazamiento horizontal y permite que el gesto vertical
  encadene hacia su ancestro. Se reforzaron ademas los contratos compartidos de
  modales, dialogos y selectores desplegables para `dvh`, `visualViewport`,
  teclado virtual, overscroll y tacto.
- Regresion automatizada: el certificador emite gestos tactiles CDP reales y
  verifica movimiento efectivo, no solo asignaciones de `scrollTop`.
- Evidencia: Proyectos PASS en Lenovo horizontal y vertical; matriz general
  354/354 PASS (59 superficies por 6 perfiles) excluyendo dos harnesses con
  validadores de fixture dedicados.
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
