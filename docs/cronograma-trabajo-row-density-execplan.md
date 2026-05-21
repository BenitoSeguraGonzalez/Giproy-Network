# Cronograma Trabajo Row Density Execplan

## Objetivo
Reducir la altura efectiva de cada fila calculable del workbench de `Cronograma de Trabajo`, eliminando metadatos irrelevantes y ocultando identificadores técnicos internos.

## Alcance
- `frontend/src/components/projects/Cronogramas.jsx`
- Fila calculable del workbench de trabajo
- Limpieza visual de códigos internos como `linea-900`

## Decisiones
- Cada partida calculable debe presentarse en una sola línea visual.
- Se eliminan del render primario etiquetas técnicas sin valor operativo:
  - `APU simple` y variantes
  - `EH/MO/TR`
  - `Hijos`, `Líneas`, `Trabajo propio`, `Trabajo hijos`
- La unidad solo se muestra cuando aplica a una partida real.
- Los identificadores internos deben ocultarse si llegan al frontend.

## Resultado esperado
- Más filas visibles por pantalla.
- Menos ruido operativo.
- Ningún `linea-xxx` visible para usuario final.
