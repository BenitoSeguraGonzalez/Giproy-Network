# BIM-TASK-0097 - Perfiles temporales Fragments

Estado: Cerrada localmente

## Resultado

- El viewport Fragments aplica visibilidad y color 4D mediante GUIDs reales.
- La secuencia se activa con toggle explicito y queda apagada por defecto.
- Las herramientas de revision se bloquean durante 4D y recuperan su estado al
  salir, evitando interferencias entre modos.
- Fecha de corte, reproduccion, avance diario, reset y conteos usan controles
  compactos alineados con la gramatica de GiProy.

## Validacion

- Harness Chrome desktop `1280x820` y movil `390x844`: canvas no vacio,
  activacion/desactivacion, ocultamiento/color, bloqueo de controles y cero
  overflow.
- Fragments product harness, build, smokes BIM/anti-BIM y baseline enterprise:
  OK.

## Rollback

Desactivar el toggle retira el perfil temporal y restaura la revision. Retirar
panel y prop `temporalProfile` devuelve el viewport anterior.
