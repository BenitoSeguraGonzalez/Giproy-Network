# Protocolo Gate K y liberacion general

Fecha de corte: 2026-07-20
Estado: bloqueado

## Condiciones acumulativas

- 60 capacidades de la matriz en estado completa, score 100%;
- Gate E humano aprobado con diez jornadas y dos revisiones reales;
- certificacion IFC por version/producto y auditoria ISO externa registradas;
- baseline anti-BIM, restore, HTTPS, seguridad tenant, observabilidad y soporte
  verificados;
- aprobacion final de tres personas distintas: producto, BIM y seguridad.

El estado actual es `blocked`. La validacion estructural debe pasar, pero la
liberacion sigue fallando de forma deliberada:

```powershell
python tools/ai_tools/validate_bim_gate_k.py
python tools/ai_tools/validate_bim_gate_k.py --require-approved
```

El segundo comando solo puede quedar verde con evidencia real. Gate K no
expande la allowlist automaticamente; una liberacion aprobada requiere una
operacion de rollout posterior, auditable y reversible.
