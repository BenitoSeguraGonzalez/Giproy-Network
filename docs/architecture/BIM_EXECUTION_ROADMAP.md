# Roadmap de Ejecución BIM - GiProy Network

## 1. Supuestos de planificación

### Modalidad de trabajo

- ejecución en modo `vibecoding`
- slices pequeños, fuertemente documentados
- validación continua por fase

### Equipo mínimo recomendado

- 1 perfil full-stack principal
- 1 perfil de apoyo con foco frontend/3D o backend/datos

## 2. Estimación global

### Tramo 1 - Base funcional BIM

- 3 a 5 semanas

### Tramo 2 - Integración sólida con negocio

- 6 a 10 semanas acumuladas

### Tramo 3 - Capa BIM madura

- 3 a 5 meses acumulados

## 3. Orden de ejecución recomendado

### Ola 1

- `BIM-TASK-0001`
- `BIM-TASK-0002`
- `BIM-TASK-0003`
- `BIM-TASK-0010`

Resultado:
- dominio BIM definido
- backend/base preparados
- viewer base dentro de `Proyecto`
- identidad visual BIM alineada con GiProy

### Ola 2

- `BIM-TASK-0004`
- `BIM-TASK-0006`
- `BIM-TASK-0011`

Resultado:
- importación/versionado
- metadata y artefactos
- estados y vistas persistidas
- activación BIM controlada por flags

### Ola 3

- `BIM-TASK-0005`

Resultado:
- integración real con `EDT`, `APUs` y `Presupuesto`

### Ola 4

- `BIM-TASK-0007`
- `BIM-TASK-0008`

Resultado:
- endurecimiento multiempresa/seguridad
- validación funcional y técnica

### Ola 5

- `BIM-TASK-0009`

Resultado:
- rollout
- documentación final
- checklist de liberación

## 4. Gating de avance

No se debe avanzar a la siguiente ola si falla cualquiera de estos gates:

Todas las olas deben documentarse en `docs/tasks/bim` con IDs `BIM-TASK-*`.
Las TASK historicas `TASK-0545` a `TASK-0559` solo son referencia legacy de
planificacion y no deben usarse para cerrar ejecucion BIM nueva.

### Gate A

- licencia aceptada
- arquitectura aprobada
- dominio BIM congelado
- índice BIM único actualizado y navegable

### Gate B

Estado local: cerrado el 2026-07-10 mediante `BIM-TASK-0075` a `0079`.

- backend y migraciones BIM consistentes
- modelo/versionado persistibles

### Gate C

- viewer integrado en `Proyecto`
- selección y propiedades operativas
- paridad visual y funcional básica con la shell GiProy

### Gate D

- vínculos reales BIM <-> negocio
- navegación cruzada funcional
- la experiencia clásica sigue intacta con flags BIM apagadas

### Gate E

- smoke suite aprobada
- pruebas funcionales aprobadas
- rendimiento mínimo aprobado

Actualizacion 2026-07-13: `BIM-TASK-0124` despliega el Workspace BIM V2 en
beta con viewer >= 65%, canvas real, cero overflow a 1920x1080 y rollback por
flag. Esta evidencia cierra el slice UX tecnico, pero no cierra el piloto humano
de Gate E.

## 5. Riesgos principales a vigilar

- crecimiento de alcance hacia authoring BIM
- pipeline de importación sin estrategia de artefacto optimizado
- degradación de rendimiento con modelos medianos/grandes
- desacople entre viewer BIM y módulos `EDT/APUs/Presupuesto`
- problemas de contexto multiempresa y revisión

## 6. Definition of Done de la capa BIM madura

La capa BIM se considerará lista para liberación cuando:

- la arquitectura aprobada coincida con la implantación
- el viewer BIM sea módulo nativo de `Proyecto`
- la shell BIM se sienta parte de GiProy y no un producto visual ajeno
- existan modelos y versiones persistidas
- existan vínculos con `EDT`, `APUs` y `Presupuesto`
- la navegación cruzada sea bidireccional
- la batería de pruebas BIM esté aprobada
- el rollout esté documentado y reversible
