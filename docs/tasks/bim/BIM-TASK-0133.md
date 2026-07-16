# BIM-TASK-0133 - Gate de formatos propietarios de scheduling

Estado: Cerrada localmente sin parser XER

## Objetivo

Impedir que GiProy anuncie o ejecute soporte XER, MPP o Powerproject PP sin
corpus autorizado o adaptador licenciado, conservando una ruta futura limpia.

## Cambios

- Contrato versionado de capacidades de interoperabilidad por formato.
- MSPDI XML, P6 XML y JSON canonico se declaran disponibles.
- P6 XER queda condicionado a corpus autorizado y contrato de equivalencia.
- MPP y Powerproject PP quedan condicionados a adaptadores licenciados.
- Endpoint BIM protegido por `bim.schedule.view` para que frontend y clientes
  no infieran soporte por extension.

## Criterios verificados

- Ningun formato propietario aparece con import-preview o export activo.
- Cada formato condicionado expone razon y requisito desbloqueante.
- No existe parser XER improvisado ni ingenieria inversa.
- El contrato vive solo en el dominio BIM y no modifica Cronograma clasico.

## Validacion

- Capacidades + P6/MSPDI: `16 passed`.
- `py_compile` y baseline enterprise se ejecutan en el cierre de la ola.
- Warnings Pydantic `model_name/model_id`: conocidos y no bloqueantes.

## Estado de paridad

B02 permanece parcial y la matriz queda en 46,67%. El parser XER solo podra
abrirse cuando exista corpus autorizado; P6 XML ya ofrece el puente abierto.

## Rollback

Retirar schemas, servicio, endpoint, tests y referencias documentales. No hay
datos ni migraciones que revertir.
