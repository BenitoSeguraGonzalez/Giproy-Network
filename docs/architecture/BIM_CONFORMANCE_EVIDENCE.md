# Evidencia de conformidad BIM

Fecha de corte: 2026-07-20
Estado: conformidad interna verificada; no certificacion formal

## Alcance

Este expediente mapea evidencia ejecutable de GiProy BIM contra la serie ISO
19650 y los contratos openBIM usados por el producto. No reproduce texto
normativo ni declara certificaciones que solo pueden emitir terceros.

La referencia vigente incluye ISO 19650 partes 1 a 6. ISO 19650-6:2025 se
incorpora expresamente para salud y seguridad. IFC2X3, IFC4 e IFC4X3_ADD2 se
verifican internamente con corpus oficial buildingSMART; la certificacion por
version/producto sigue siendo externa. IDS 1.0 y BCF-XML 2.1 tienen evidencia
interna, pero buildingSMART no ofrece hoy certificacion de software IDS/BCF.

## Resultado

- 9 controles con conformidad interna verificada.
- 0 brechas internas openBIM declaradas en este expediente.
- 1 accion externa de certificacion.
- 1 control BCF verificado internamente con limite externo declarado.
- Gate E humano: pendiente.
- Gate K/certificacion formal: pendiente externa.

## Fuentes oficiales

- ISO 19650: https://www.iso.org/sectors/building-construction/building-information-modelling
- IFC: https://www.buildingsmart.org/standards/bsi-standards/industry-foundation-classes/
- IDS: https://www.buildingsmart.org/standards/bsi-standards/information-delivery-specification-ids/
- Certificacion: https://www.buildingsmart.org/compliance/software-certification/

El contrato machine-readable vive en
`docs/architecture/bim_conformance_evidence.json` y se valida con
`python tools/ai_tools/validate_bim_conformance_evidence.py`.
