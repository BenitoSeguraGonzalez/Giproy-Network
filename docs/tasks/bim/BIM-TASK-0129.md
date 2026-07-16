# BIM-TASK-0129 - Factibilidad legal y tecnica de scheduling

Estado: Cerrada documentalmente

## Objetivo

Fijar que formatos se implementaran de forma nativa y cuales requieren un
adaptador licenciado antes de iniciar la interoperabilidad de scheduling.

## Resultado

- P6 XML y MSPDI XML quedan como formatos nativos prioritarios.
- XER queda como adaptador opcional sujeto a corpus autorizado.
- MPP y Powerproject PP requieren integracion/SDK autorizado.
- Asta puede interoperar mediante los puentes P6/MSP documentados.
- Se prohibe la escritura directa a Cronograma clasico durante parse/preview.
- Se define un gate de round-trip con reporte de perdida explicito.

## Validacion

- Fuentes oficiales Oracle, Microsoft, Elecosoft y buildingSMART registradas.
- Dependencias y orden `0130-0134` definidos.
- No se agrega libreria, parser, endpoint, migracion ni configuracion.

## No impacto clasico

TASK-1807, Cronogramas, auth, tenant, DB, frontend y despliegue no cambian.

## Rollback

Retirar el documento y sus referencias. No existe rollback tecnico.
