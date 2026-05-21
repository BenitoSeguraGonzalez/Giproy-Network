# Plan Maestro De Adecuacion Del Modulo Gantt Clasico A Programacion De Obras

## Contexto

Fuente de verdad: `docs/adicionales/Módulo de Programación de Obras.docx`.

Objetivo ejecutivo: transformar `Proyectos > Cronogramas > Gantt` desde una vista de cronograma clasica hacia un modulo integral de programacion y control de obra, manteniendo:
- `Modo 1: GIPROY CLASICO`
- backend comun
- cero dependencia visible con BIM
- coherencia con APU, presupuesto, cronograma valorado y exportacion Project

## Principios Rectores

1. El backend es la autoridad unica del calculo.
2. Presupuesto y programacion se tratan como un mismo modelo operativo.
3. La UX no puede adelantar capacidades que el motor aun no soporte.
4. Recursos, costo y plazo deben recalcularse juntos.
5. Toda preparacion futura para BIM debe ser invisible y no interferente.

## Releases Optimizados

### Release 1 - Programacion Confiable
- `TASK-1024`
- `TASK-1025`
- `TASK-1031`

Entregables:
- motor CPM/PDM autoritativo en backend
- restricciones de fecha completas
- multiples rutas criticas
- holgura total y libre
- duracion desde APU, cuadrillas, turno, eficiencia y avance real
- contrato dual entre duracion visible del Gantt clasico y duracion exportable a Project

Go/No-Go:
- `ES/EF/LS/LF/HT/HL` consistentes
- ciclos detectados con mensaje claro
- duracion no editable arbitrariamente fuera del modelo APU

### Release 2 - Recursos Ejecutables
- `TASK-1026`

Entregables:
- modelo real de recursos de construccion
- equipos propios vs alquilados
- histogramas de carga
- deteccion de sobreasignacion
- nivelacion con recalcule CPM

Go/No-Go:
- no hay fraccionamiento artificial de equipos/cuadrillas
- conflictos de capacidad visibles y trazables

### Release 3 - Costo Y Optimizacion
- `TASK-1027`
- `TASK-1028`

Entregables:
- costos tiempo-dependientes vs cantidad-dependientes
- costo inactivo de equipo propio
- crashing con costo incremental real
- PV, EV, AC, SPI, CPI, EAC
- curva S y alertas de control

Go/No-Go:
- materiales no cambian costo por cambios de duracion
- actividades criticas pueden priorizarse por costo/dia ganado
- indicadores EVM coherentes con cronograma y presupuesto

### Release 4 - UX Tecnica E Interoperabilidad
- `TASK-1029`
- `TASK-1030`

Entregables:
- vista PDM/AON sincronizada con Gantt
- coloreo normativo y paneles tecnicos
- histogramas y alertas operativas
- import/export alineados al motor definitivo
- suite de QA matematica y checklist final

Go/No-Go:
- PDM y Gantt no se contradicen
- exportaciones no distorsionan la logica interna
- rendimiento aceptable en proyectos medianos y grandes

## Dependencias Criticas

1. `TASK-1024` bloquea todo el programa.
2. `TASK-1025` debe cerrar antes de nivelacion, EVM y crashing.
3. `TASK-1031` debe cerrar antes de endurecer interoperabilidad y antes de usar exportación Project como referencia operativa.
4. `TASK-1026` debe existir antes de crashing real.
5. `TASK-1027` debe preceder a `TASK-1028`.
6. `TASK-1029` no debe adelantarse a la matematica backend.
7. `TASK-1030` cierra el programa y no debe ejecutarse de forma aislada.
8. `TASK-1032` abre una fase nueva posterior a `TASK-1026`, centrada en nivelacion asistida controlada de sesion, sin automatizacion masiva.

## Riesgos Principales

- Duplicidad de logica entre frontend y backend.
- UX avanzada antes de cerrar el motor.
- Nivelacion sobre un modelo de recursos incompleto.
- EVM calculado sobre duraciones/costos aun inestables.
- Interoperabilidad Project condicionando la logica interna.

## Criterios De Exito

- La duracion sale automaticamente del APU y es auditable.
- La ruta critica y las holguras son matematicamente confiables.
- La nivelacion no inventa recursos inexistentes.
- El costo cambia correctamente con la duracion segun tipo de recurso.
- El valor ganado se integra con plazo y costo.
- El crashing propone decisiones economicas validas.
- La capa BIM no es tocada ni contaminada.

# Implementación del Módulo de Fórmula Polinómica (TASK-POLINOMICA)

Este plan detalla la implementación del módulo de Fórmula Polinómica, 100% dependiente de la revisión de un proyecto (Presupuesto) y alineado visualmente con el módulo de Desagregación.

## User Review Required

> [!IMPORTANT]
> - Se crearán nuevas tablas en la base de datos para manejar los Índices INEC y la estructura de la Fórmula Polinómica.
> - El módulo requiere que los recursos estén agrupados por símbolos (B, C, D, E...) para el cálculo de coeficientes.
> - Se implementará una lógica de "Cuadrilla Tipo" específica para el monomio de Mano de Obra (B).

# OmniClass Standardization & APU Coding Fixes

Standardizing the entire project (Resources, Subcategories, APUs, Budgets) using the OmniClass classification system while fixing immediate APU coding and numeric calculation issues.

## OmniClass Mapping Architecture

| OmniClass Table | GiProy Entity | Use Case |
| :--- | :--- | :--- |
| **Table 21: Elements** | APUs / Budget Details | Classification of "Elements" being built (e.g., Walls, Slabs). |
| **Table 22: Work Results** | Subcategories | Standardizing "Activity" types (e.g., Excavation, Concretes). |
| **Table 23: Products** | Resources (Materials/Equipment) | Standardizing "What" is purchased (e.g., Cement, Excavator). |
| **Table 34: Roles** | Mano de Obra (Labor) | Standardizing personnel roles (e.g., Carpenter, Engineer). |

## Proposed Changes

### Database Migration

#### [NEW] [create_omniclass_maestro.py](file:///e:/Repositorios/GiProy Network/backend/scripts/create_omniclass_maestro.py)
- Create a new `omniclass_maestro` table to store standardized codes/titles.
- Add `omniclass_codigo` and `omniclass_titulo` to `subcategorias_items`, `recursos`, `apus`, and `presupuesto_detalles`.

### APU & Resource Modules

#### [MODIFY] [APUs.jsx](file:///e:/Repositorios/GiProy Network/frontend/src/pages/APUs.jsx)
- Fix NaN display and numeric input restrictions (numbers, dots, commas).
- Fix yield truncation in save payload.
- Update `getNextApuCode` to the requested `5-SSS-NNNN` format.
- Add OmniClass selector to the APU editor.

#### [MODIFY] [RecursoModal.jsx](file:///e:/Repositorios/GiProy Network/frontend/src/components/RecursoModal.jsx)
- Add OmniClass selector (Table 23/34) to resource creation/edition.

### Backend Services

#### [MODIFY] [apu.py](file:///e:/Repositorios/GiProy Network/backend/app/services/apu.py)
- Update code generation and handle OmniClass metadata.

#### [NEW] [migrate_omniclass_apu_codes.py](file:///e:/Repositorios/GiProy Network/backend/scripts/migrate_omniclass_apu_codes.py)
- Unified script to migrate existing APUs to `5-SSS-NNNN` format and optionally initialize OmniClass fields.

## Verification Plan

### Manual Verification
- Verify that Resource and APU modals now show OmniClass fields.
- Verify that APU coding accurately follows `5-SSS-NNNN` after migration.
- Verify that Budget lines inherit OmniClass codes from APUs.
- Confirm all calculation bugs (NaN, yield truncation) are resolved.

## Proposed Changes

### [Backend]

#### [MODIFY] [polinomica.py](file:///e:/Repositorios/GiProy%20Network/backend/app/models/polinomica.py)
- Añadido campo `tipo` (String: `SIN_DESGLOSE`, `CON_DESGLOSE`).
- Añadido campo `config_desglose` (JSON) para porcentajes de equipo.

#### [MODIFY] [formula_polinomica.py](file:///e:/Repositorios/GiProy%20Network/backend/app/services/formula_polinomica.py)
- Lógica de redistribución: Si es `CON_DESGLOSE`, el costo de la categoría "Equipos" se divide en B (10%), C (10%), E (70%), R (10%).
- Adaptar `regenerate_formula` para aceptar el parámetro `tipo`.

---

### [Frontend]

#### [NEW] [FormulaPolinomicaTab.jsx](file:///e:/Repositorios/GiProy%20Network/frontend/src/components/projects/FormulaPolinomicaTab.jsx)
- Selector de "Tipo de Fórmula" (Sin Desglose vs Con Desglose de Equipo).
- Visualización de la división del monomio de equipo cuando corresponda.

#### [MODIFY] [Proyectos.jsx](file:///e:/Repositorios/GiProy%20Network/frontend/src/pages/Proyectos.jsx)
- Integrar la pestaña de Fórmula Polinómica en el navegador de pestañas del proyecto.

---

### [Database]
- Crear migración Alembic para las nuevas tablas de la fórmula polinómica e índices INEC.

## Verification Plan

### Automated Tests
- Verificar integridad de tipos y cálculos con scripts de prueba en `tmp`.
- Compilación de backend: `python -m py_compile backend/app/api/endpoints/polinomica.py`

### Manual Verification
1.  Acceder a un proyecto -> Pestaña Fórmula Polinómica.
2.  Verificar que el total cargado coincida con el presupuesto (Costo Directo).
3.  Asignar índices a los grupos de recursos.
4.  Validar que la suma de coeficientes sea exactamente 1.000.
5.  Verificar que el cambio en la revisión del proyecto actualice el cálculo de la fórmula.
