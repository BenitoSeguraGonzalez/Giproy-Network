# Matriz de aplicación UX BIM

Fecha: 2026-08-03
Estado: activa; sustituye la aceptación visual basada únicamente en presencia de componentes

## Propósito

Esta matriz convierte el benchmark de productos BIM en reglas comprobables para
GiProy. Una función no se considera rediseñada porque compile, esté registrada o
quepa dentro del shell. Debe integrarse en un recorrido reconocible, conservar el
contexto tridominio y usar la superficie correcta.

## Patrones de referencia

| Producto | Patrón observado | Aplicación obligatoria en GiProy | Lo que no se copiará |
| --- | --- | --- | --- |
| Autodesk Model Coordination | Entrada por modelo, vista, choque o incidencia; el visor carga únicamente el contexto solicitado | Coordinación abre una tarea concreta y restaura versión, selección, cámara y evidencia | Navegación de producto Autodesk o separación de costes en otro módulo |
| Autodesk Issues / Revizto | La incidencia conserva viewpoint, geometría y conversación | Incidencias, RFI y revisiones nacen de la selección y vuelven al mismo contexto | Formularios aislados del modelo o bandejas sin ubicación |
| Navisworks TimeLiner | Importar tareas → vincular geometría → validar → simular → comparar plan/real | El flujo 4D sigue ese orden y distingue borrador Gantt de baseline | Ventana de escritorio saturada de pestañas y barras |
| Bentley SYNCHRO | Modelo, WBS, cantidades, zonas, recursos, plazo y coste operan sobre una referencia común | Presupuesto/APU gobierna 5D, Gantt gobierna 4D y BIM gobierna geometría; la coordinación no sobrescribe dominios | Duplicar el presupuesto o el Gantt dentro de BIM |
| Trimble Connect | Visor central con paneles invocables para modelos, vistas, tareas y datos | Una tarea activa por panel; catálogo bajo demanda y vistas restaurables | Mostrar simultáneamente todos los paneles disponibles |
| Dalux | Propiedades, filtros, tareas e inspecciones parten de objeto y ubicación | Selección contextual compartida para propiedades, campo, filtros y evidencias | Reducir GiProy a un producto móvil o sólo de campo |

## Recorrido rector GiProy

`Preparar referencia → Vincular → Validar → Simular → Proponer → Revisar → Aprobar → Aplicar → Seguir → Informar`

Cada paso debe declarar:

1. rol o capacidad efectiva;
2. contexto de entrada;
3. fuente de verdad;
4. acción principal;
5. resultado y estado;
6. forma de retorno;
7. superficie: visor, lateral, inferior, workbench o modal acotado.

## Familias de trabajo

| Flujo | Tareas principales | Referencia dominante | Superficie normal |
| --- | --- | --- | --- |
| Planificación y costes | vincular 4D/5D, revisar ejecución, preparar producción, controlar costes, intercambiar | TimeLiner + SYNCHRO + Cost Management | visor + inferior; lateral para selección breve; workbench para valoración |
| Modelo | consultar selección, organizar modelo y restaurar vistas | Trimble + Dalux | visor + un lateral reemplazable |
| Coordinación | referencia coordinada, detectar/resolver, revisar cambios, colaborar, preparar modelos | Autodesk + Revizto | visor + un lateral; workbench para referencia y comparación compleja |
| Seguimiento | registrar obra, controlar obra y reunir evidencia | SYNCHRO Perform + Dalux | visor + lateral contextual; formularios largos en workbench |
| Entrega | preparar entrega, cerrar pendientes y transferir información | Autodesk + SYNCHRO | workbench para as-built, commissioning, punch, dossier y transición; lateral sólo para consulta breve |

El catálogo ejecutable vive en
`frontend/src/components/bim/bimWorkflowCatalog.js`. Toda herramienta nueva debe
tener grupo, propósito, patrón de referencia y superficie antes de aparecer en
la interfaz.

## Criterios de rechazo

- selector plano que mezcle más de una familia de trabajo;
- panel cuya cabecera repita el nombre del módulo sin expresar la tarea;
- acción sin contexto, resultado o recuperación comprensible;
- controles técnicos del motor presentados como funciones del usuario;
- tabla, formulario o master-detail que imponga un ancho privado;
- modal usado para navegación o trabajo sostenido;
- aprobación económica derivada de administrar BIM;
- prueba visual basada sólo en ancho del visor o ausencia de overflow.

## Estado real

- Benchmark y reglas: 100% documentados.
- Catálogo inicial de funciones: implementado; requiere auditoría de cobertura en
  cada panel.
- Panel de trabajo: migrado de selector plano a tareas agrupadas bajo demanda.
- Herramientas internas: pendientes de migración por familias.
- Proyecto `#SantiagoBermeo-2026-001`: pendiente de validación humana completa.
