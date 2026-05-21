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

- `TASK-0546`
- `TASK-0547`
- `TASK-0548`
- `TASK-0555`

Resultado:
- dominio BIM definido
- backend/base preparados
- viewer base dentro de `Proyecto`
- identidad visual BIM alineada con GiProy

### Ola 2

- `TASK-0549`
- `TASK-0551`
- `TASK-0556`

Resultado:
- importación/versionado
- metadata y artefactos
- estados y vistas persistidas
- activación BIM controlada por flags

### Ola 3

- `TASK-0550`

Resultado:
- integración real con `EDT`, `APUs` y `Presupuesto`

### Ola 4

- `TASK-0552`
- `TASK-0553`

Resultado:
- endurecimiento multiempresa/seguridad
- validación funcional y técnica

### Ola 5

- `TASK-0554`

Resultado:
- rollout
- documentación final
- checklist de liberación

## 4. Gating de avance

No se debe avanzar a la siguiente ola si falla cualquiera de estos gates:

### Gate A

- licencia aceptada
- arquitectura aprobada
- dominio BIM congelado
- índice BIM único actualizado y navegable

### Gate B

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
