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

- Estado: PENDIENTE DE BETA.
- Severidad: bloqueante para cerrar TASK-2048.
- Cobertura disponible: AVD Android 2944x1840, DPR 2, 59/59 superficies PASS en
  horizontal y 59/59 en vertical.
- Criterio de cierre: desplegar la misma version sobre la beta actual y obtener
  PASS en Lenovo Tab P12 fisica, Chrome y Opera, horizontal y vertical.
