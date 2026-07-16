# BIM-TASK-0094 - Propuestas de vinculacion 4D

Estado: Cerrada localmente

## Resultado

- API BIM lista snapshots y propuestas por proyecto/elemento.
- Coordinador propone y decide vinculos con motivo obligatorio y auditoria.
- Panel compacto en `BimWorkspace` usa actividades reales del cliente BIM,
  tipos constructivos y botones iconograficos con tooltip.
- Empty, loading, error, pending, approved y rejected quedan cubiertos.

## Validacion

- Harness Chrome desktop/mobile crea y aprueba sin overflow: OK.
- Build, smokes BIM/anti-BIM y baseline enterprise: OK.
- No se monto navegacion ni dependencia desde GiProy Clasico.

## Rollback

Retirar panel, cliente y endpoints 4D; el workspace BIM previo permanece.
