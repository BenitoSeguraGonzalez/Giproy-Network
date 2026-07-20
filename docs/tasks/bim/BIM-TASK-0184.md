# BIM-TASK-0184 - Expediente verificable de conformidad internacional

Fecha: 2026-07-20
Estado: Cerrada tecnicamente; certificacion externa pendiente
Modo: GIPROY BIM

## Objetivo

Consolidar evidencia ejecutable de conformidad interna para ISO 19650 y
openBIM, diferenciandola de una certificacion formal emitida por terceros.

## Alcance ejecutado

- Se crea un contrato JSON con diez controles ordenados, evidencia local y
  estado verificable.
- Se cubren ISO 19650-1 a 19650-6; la parte 6:2025 se incorpora al baseline por
  ser la referencia vigente de informacion colaborativa de salud y seguridad.
- IFC declara expresamente la brecha IFC4.3 y certificacion oficial; GiProy
  conserva conformidad interna limitada a importacion IFC2X3/IFC4.
- IDS 1.0 y BCF-XML 2.1 quedan como conformidad interna, sin inventar una
  certificacion buildingSMART que actualmente no esta disponible para IDS/BCF.
- El validador exige fuentes HTTPS oficiales ISO/buildingSMART, comprueba todas
  las evidencias y bloquea claims formales o gates externos cerrados en falso.

## Evidencia

- `BIM_CONFORMANCE_OK total=10 counts={'verified_internal': 8,
  'scope_gap': 1, 'external_pending': 1}`.
- Validador focal: 3 pruebas correctas.
- Suites fuente IFC, IDS, BCF, CDE, operaciones, seguridad y safety: 40 pruebas
  correctas.
- Warnings Pydantic preexistentes: conocidos y no bloqueantes.

## No interferencia clasica

El expediente y su validador no cambian backend productivo, frontend, DB, API,
auth, tenant ni modulos clasicos. TASK-1807 y la UX con BIM apagado permanecen
intactos.

## Rollback

Retirar el JSON, documento, validador, pruebas y referencias de esta TASK. No
hay migracion, dato ni despliegue que revertir.

## Limite declarado

H08 permanece parcial: la evidencia interna no equivale a certificacion IFC
por version/producto, auditoria ISO competente ni Gate K aprobado. Gate E
humano tambien sigue pendiente.

## Porcentaje

Paridad: 89,17%, 52 completas, 3 parciales y 5 ausentes. Programa: 58/61
slices, 95,08% realizado y 4,92% pendiente.
