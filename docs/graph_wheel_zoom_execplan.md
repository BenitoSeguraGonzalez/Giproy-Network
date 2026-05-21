# ExecPlan: Zoom Con Rueda En Grafo EDO/EDT

## Objetivo funcional
Permitir que el zoom del entorno gráfico de `EDO` y `EDT` responda directamente a la rueda del ratón, sin requerir `Ctrl`, manteniendo el paneo existente por arrastre.

## Estado actual
- El gráfico solo hace zoom con `Ctrl + wheel`.
- La rueda del ratón se interpreta como desplazamiento vertical del viewport.
- Esto hace más lenta la navegación fina del grafo.

## Diseño propuesto
- La rueda del ratón dentro del viewport gráfico controlará el zoom.
- Se interceptará el scroll nativo para que no compita con el zoom.
- El paneo seguirá resolviéndose por arrastre del lienzo.
- El nivel de zoom seguirá limitado por `clampZoom`.

## Fases
1. Documentar el cambio de interacción.
2. Sustituir `Ctrl + wheel` por zoom directo con rueda.
3. Mantener intactos paneo, centrado y minimapa.
4. Validar compilación.

## Riesgos y mitigación
- Riesgo: pérdida de scroll vertical esperado.
  Mitigación: el lienzo ya dispone de paneo por arrastre y centrado contextual.
- Riesgo: zoom demasiado sensible.
  Mitigación: conservar incremento pequeño y límites actuales.

## Validaciones
- La rueda aumenta o reduce zoom dentro del grafo.
- El scroll nativo no interfiere mientras el puntero está en el viewport.
- `npm run build` pasa.
