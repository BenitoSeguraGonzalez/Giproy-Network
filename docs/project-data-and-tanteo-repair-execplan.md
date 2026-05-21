# ExecPlan: Reparacion Datos de Proyecto + Tanteo

## Objetivo

Corregir dos fallos persistentes de interfaz:

1. En `Datos de Proyecto`, cuando `Geo-referenciacion` e `Imagen referencial` son completamente visibles en la columna derecha, la rueda del raton debe desplazar solo la columna izquierda. Si el bloque derecho deja de estar completamente visible, el desplazamiento debe volver a ser conjunto.
2. En `Tanteo`, los valores `Costo Unitario Original` y `Costo Simulado` deben quedar exactamente alineados, con unidad visible en ambos lados y semaforizacion intacta.

## Estado actual

### Datos de Proyecto

- El comportamiento se intento resolver solo dentro de `DatosProyecto.jsx`.
- El scroll real tambien depende del contenedor principal en `Proyectos.jsx`.
- Resultado: aunque la columna derecha este totalmente visible, la rueda sigue desplazando el layout conjunto.

### Tanteo

- Se aplicaron varios ajustes cosmeticos sobre dos layouts distintos.
- El bloque sigue mezclando valor, unidad y delta de forma desigual entre columnas.
- Resultado: el numero de la derecha mantiene desfase visual respecto al de la izquierda.

## Diseno propuesto

### Datos de Proyecto

- Controlar el `wheel` en el contenedor real del detalle de proyecto.
- Detectar en tiempo real si el bloque derecho completo esta visible dentro del viewport efectivo del detalle.
- Si esta visible:
  - bloquear scroll vertical del contenedor conjunto
  - redirigir el `wheel` a la columna izquierda
- Si no esta visible:
  - restaurar scroll conjunto normal

### Tanteo

- Sustituir el comparador actual por una sola tarjeta contenedora con una grilla fija de dos columnas.
- Cada columna debe compartir la misma estructura:
  - etiqueta
  - fila del valor
  - fila de unidad
  - fila auxiliar de delta o placeholder
- El valor nunca debe compartir linea con contenido que altere su baseline.

## Fases

1. Localizar y gobernar el contenedor real de scroll del detalle de proyecto.
2. Implementar detector de visibilidad completa del panel derecho.
3. Redirigir `wheel` solo a la izquierda cuando aplique.
4. Rehacer el comparador de `Tanteo` con grilla y filas simetricas.
5. Validar build y dejar criterios de prueba manual.

## Riesgos

- Interferir con scroll natural del layout general de proyectos.
- Capturar `wheel` en un nivel incorrecto.
- Mantener el problema de alineacion si Tanteo conserva diferencias estructurales.

## Mitigacion

- Resolver scroll desde `Proyectos.jsx` y no solo desde el hijo.
- Usar medicion real del bloque derecho visible.
- Eliminar layouts paralelos en Tanteo y dejar una sola estructura.

## Validaciones

- Caso A:
  - bloque derecho completamente visible
  - rueda del raton desplaza solo la izquierda
- Caso B:
  - bloque derecho no visible completamente
  - rueda desplaza todo
- Tanteo:
  - valores original y simulado quedan alineados en varias lineas/APUs
  - unidad visible en ambos lados
  - color neutro/rojo/verde intacto

