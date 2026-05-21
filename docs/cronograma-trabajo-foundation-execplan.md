# Cronograma De Trabajo Foundation - ExecPlan

## Objetivo
Reemplazar el placeholder de `Cronograma de Trabajo` por un workbench real que calcule horas, duración y días a partir del presupuesto operativo y de la composición viva de los APUs, dejando además preparada la trazabilidad para la futura exportación a Microsoft Project, tanto en carril universal XML como en futuro carril premium `.mpp` directo por entorno.

## Diagnóstico
- `Cronograma de Trabajo` existía solo como placeholder en frontend.
- Backend solo persistía `schedule_data` plano sin motor de cálculo ni respuesta operativa.
- El Excel `Análisis para Cronograma Trabajo.xlsx` ya define la lógica base de horas, duración, cuadrilla y días.
- La plantilla `001 - Cronograma Trabajo - MS Project.mpp` ya fija un objetivo claro de exportación, pero no había todavía contrato intermedio ni payload compatible.
- La exportación vigente era solo XML, sin negociación explícita de formato ni lectura del entorno operativo.

## Enfoque
1. Enriquecer el contrato backend de `cronogramas_trabajo` sin romper la persistencia existente.
2. Calcular filas desde presupuesto/APU vivo, con configuración base editable.
3. Sustituir el placeholder por un workbench inicial usable y coherente con el look & feel del módulo de cronogramas.
4. Dejar la exportación a Microsoft Project abierta como siguiente corte sobre una base ya funcional.
5. Integrar un contrato híbrido de exportación para distinguir:
   - `XML MSPDI` como salida universal estable
   - `.mpp` directo en entornos Windows con Microsoft Project, plantilla válida y `pywin32/win32com`
6. Reforzar el motor de cálculo para que se acerque al Excel de análisis:
   - `trabajo útil` basado en `Equipos y Herramientas + Mano de Obra`
   - `Transporte` visible pero desacoplado de la duración
   - exposición de rendimiento unitario y recursos calculados por línea
7. Afinar la lectura de dotación hacia una noción de `cuadrilla calculada`:
   - suma productiva por `Equipos y Herramientas`
   - suma productiva por `Mano de Obra`
   - exposición de `cuadrilla total` como base sugerida del esfuerzo
8. Endurecer la secuencia del cronograma:
   - validar predecesoras contra partidas calculables reales
   - impedir dependencia sobre la propia línea o sobre partidas posteriores
   - usar el orden real del presupuesto como base de la secuencia operativa
9. Hacer más legible el cálculo anidado:
   - distinguir trabajo y cuadrilla provenientes de líneas propias frente a APUs hijo
   - exponer cantidad de líneas nativas y líneas anidadas por partida
   - dejar trazable la mezcla `propio + heredado` en el workbench para validar mejor los casos complejos del Excel

## Resultado esperado
- `Cronograma de Trabajo` deja de ser un placeholder.
- El usuario puede ver horas totales, días útiles, días calendario y detalle por partida.
- La dotación asumida por línea y la configuración global quedan editables y persistidas.
- La exportación MS Project queda formalizada como siguiente slice sobre este núcleo operativo.
- El workbench conoce las capacidades reales de exportación del entorno y adapta la UX entre `.mpp` directo y `XML` fallback.
- El carril premium `.mpp` queda soportado por automatización COM desde Python (`pywin32`) cuando el entorno lo permite.
- El motor del workbench ya no trata `Transporte` como duración productiva y expone métricas más fieles al Excel de análisis.
- La dotación calculada deja de ser un conteo simplificado y pasa a una lectura más cercana de cuadrilla por partida.
- La secuencia del cronograma ya no acepta predecesoras incoherentes respecto al orden real del presupuesto.
- El workbench ya explica mejor cuándo una partida deriva su esfuerzo desde composición propia y cuándo lo hereda desde APUs hijo.
