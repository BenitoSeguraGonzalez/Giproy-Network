# Guía QA Funcional - Ruta Crítica en Gantt Clásico

## Objetivo

Validar el frente CPM del Gantt clásico desde la óptica operativa del usuario, no solo desde smokes técnicos.

## Alcance

- Solo `GiProy Clásico`
- Sin BIM
- Sin activar reporting nuevo
- Sobre proyectos reales o snapshots equivalentes con:
  - tareas críticas
  - tareas con holgura negativa
  - tareas restringidas
  - tareas con subtramos
  - tareas con ventana manual

## Escenarios mínimos

### 1. Navegación CPM

- Abrir `Proyecto > Cronogramas > Gantt`
- Verificar que los focos:
  - `CPM`
  - `HT-`
  - `REST`
  - `CPM+`
  muestran conteo coherente
- Pulsar `Sgte` varias veces y comprobar:
  - foco en fila correcta
  - scroll correcto
  - resaltado consistente entre grid y timeline

### 2. Lectura por fila

- Elegir una tarea crítica
- Confirmar presencia y coherencia de chips:
  - ruta crítica
  - holgura negativa si aplica
  - restricción si aplica
  - `CPM` por deriva visible si aplica
  - `CPM+` si existe tanteo o traza

### 3. Acción guiada CPM

- Seleccionar una tarea con recomendación CPM elegible
- Revisar panel `Ruta crítica`
- Aplicar `Aplicar tanteo CPM`
- Confirmar:
  - aparece como borrador local
  - no se aprueba automáticamente
  - aparece señal visible de trabajo CPM

### 4. Reversión CPM

- Sobre la misma tarea, pulsar `Quitar tanteo CPM`
- Confirmar:
  - desaparece el tanteo activo
  - la traza histórica sigue siendo legible
  - no se rompe la selección ni el timeline

### 5. Compatibilidad con subtramos

- Elegir una tarea con `gantt_subbars`
- Aplicar tanteo CPM
- Confirmar:
  - se desplaza la envolvente
  - se preservan orden y duraciones internas
  - no se pierde la microprogramación

### 6. Compatibilidad con ventana manual

- Elegir una tarea con ventana manual operativa
- Aplicar tanteo CPM
- Confirmar:
  - la ventana se desplaza de forma coherente
  - no se destruye la condición manual

### 7. Guardarraíl de edición manual

- En una tarea con trabajo CPM ya presente:
  - abrir edición manual del inicio
  - abrir ajuste fino de subtramo
- Confirmar:
  - aparece advertencia previa
  - cancelar no altera nada
  - continuar abre la edición sin crash

### 8. Confirmación e historial

- Confirmar cronograma con al menos una línea CPM
- Revisar modal de confirmación
- Revisar historial confirmado
- Confirmar:
  - el resumen cuenta tanteos CPM
  - el historial muestra `n tanteo(s) CPM`
  - no se rompe la lectura de batches previos

## Criterios de aceptación

- Sin errores runtime
- Sin pérdida de drag actual
- Sin pérdida de persistencia ya estabilizada
- Sin contaminación BIM
- Sin cambios automáticos fuera del borrador local y de la aprobación explícita

## Criterios de rechazo

- El foco CPM no coincide con las filas reales
- El tanteo CPM guarda sin aprobación
- La edición manual fina sobrescribe sin advertencia
- Se rompen subtramos, ventana manual o timeline
- El historial pierde legibilidad o mezcla semánticas
