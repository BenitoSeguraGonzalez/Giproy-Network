# BIM-TASK-0123 - Entitlement comercial y piloto Enterprise

Estado: cerrada localmente y desplegada en beta.

## Objetivo

Impedir que la allowlist BIM sea suficiente por si sola y exigir una licencia o
compra comercial valida antes de habilitar el workspace y los endpoints BIM.

## Contrato implementado

- BIM incluido: Empresarial, Tester, Academica y Capacitacion.
- BIM comprable: Estandar y Profesional, USD 99.99 mensuales.
- BIM excluido: Express.
- Activacion efectiva: `rollout permitido AND entitlement comercial vigente`.
- Piloto actual: exclusivamente empresas `1` y `3`, ambas Enterprise.

## Evidencia

- Compra Marketplace confirmada entrega `PACK_BIM` y habilita la capacidad.
- Una empresa Enterprise fuera de allowlist permanece sin BIM.
- Una empresa allowlisted sin derecho comercial permanece sin BIM.
- Local y beta resuelven `1=true`, `3=true`, `2=false`.
- GiProy Clasico pasa build, anti-BIM y baseline enterprise sin cambios visibles.

## Limite

Esta TASK cierra el contrato tecnico-comercial y su despliegue. No certifica
Gate E: siguen pendientes diez jornadas de piloto humano y dos revisiones reales
de modelo conforme a la Definition of Done vigente.

Porcentaje de finalizacion del slice: 100%.
