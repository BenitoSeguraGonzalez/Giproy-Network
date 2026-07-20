# Protocolo operativo Gate E

Fecha de corte: 2026-07-20
Estado: autorizado, no iniciado

## Alcance

El piloto se limita a las empresas `1` y `3` en beta. No comienza hasta que se
registren dos personas distintas: coordinador BIM y usuario de negocio.

## Evidencia minima

- diez fechas habiles unicas dentro del periodo declarado;
- evidencia diaria para cada fecha;
- dos revisiones de modelos/versiones reales;
- importacion IFC, publicacion de version, comparacion, issues, IDS, revision
  CDE, reapertura y rollback, todos aprobados con evidencia;
- cero incidencias criticas abiertas;
- decision humana final con responsable, fecha y evidencia.

El ledger no genera jornadas, revisiones ni aprobaciones. Solo acepta evidencia
humana registrada. La ejecucion se conserva en
`docs/architecture/bim_gate_e_pilot.json` y se valida con:

```powershell
python tools/ai_tools/validate_bim_gate_e_pilot.py
python tools/ai_tools/validate_bim_gate_e_pilot.py --require-approved
```

El primer comando valida la estructura pendiente. El segundo debe fallar hasta
que el piloto real cumpla todas las condiciones.

## Stop y rollback

Una incidencia critica, mezcla tenant, exposicion fuera de allowlist, fallo de
auth, corrupcion de datos o regresion clasica detiene el piloto. El rollback
inmediato es cerrar la puerta BIM; el rollback definitivo usa las imagenes y
dump predeploy ya restaurados en `BIM-TASK-0183`.
