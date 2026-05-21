# Índice Único BIM - GiProy Network

## Propósito

Este documento es el punto de entrada único para todo el programa BIM de GiProy Network. Su objetivo es concentrar, en una sola superficie, la arquitectura, la estrategia, las TASKs, los prompts y el tooling necesarios para ejecutar la implantación BIM sin tener que buscar documentación dispersa.

Este índice debe usarse siempre como primera referencia al retomar el programa BIM.

---

## 1. Documentos maestros de arquitectura

- [Plan Maestro BIM](/e:/Repositorios/GiProy%20Network/docs/architecture/BIM_MASTER_PLAN.md)
- [Mapa Conceptual BIM](/e:/Repositorios/GiProy%20Network/docs/architecture/BIM_CONCEPT_MAP.md)
- [Mapa de Inserción BIM](/e:/Repositorios/GiProy%20Network/docs/architecture/BIM_INSERTION_MAP.md)
- [Plan de Validación BIM](/e:/Repositorios/GiProy%20Network/docs/architecture/BIM_VALIDATION_PLAN.md)
- [Roadmap de Ejecución BIM](/e:/Repositorios/GiProy%20Network/docs/architecture/BIM_EXECUTION_ROADMAP.md)
- [Estrategia de Implementación Paralela BIM](/e:/Repositorios/GiProy%20Network/docs/architecture/BIM_PARALLEL_IMPLEMENTATION_STRATEGY.md)
- [Resumen Ejecutivo para Junta de Revisión y Aprobación](/e:/Repositorios/GiProy%20Network/docs/architecture/BIM_EXECUTIVE_SUMMARY_FOR_REVIEW_BOARD.md)

---

## 2. Gobierno por TASKs

### TASK madre de control

- [TASK-0545](/e:/Repositorios/GiProy%20Network/docs/tasks/TASK-0545.md)

### Subtasks del programa BIM

- [TASK-0546](/e:/Repositorios/GiProy%20Network/docs/tasks/TASK-0546.md) - dominio BIM y arquitectura
- [TASK-0547](/e:/Repositorios/GiProy%20Network/docs/tasks/TASK-0547.md) - backend y base de datos BIM
- [TASK-0548](/e:/Repositorios/GiProy%20Network/docs/tasks/TASK-0548.md) - shell frontend BIM
- [TASK-0549](/e:/Repositorios/GiProy%20Network/docs/tasks/TASK-0549.md) - pipeline de importación y versionado
- [TASK-0550](/e:/Repositorios/GiProy%20Network/docs/tasks/TASK-0550.md) - vínculos BIM con negocio
- [TASK-0551](/e:/Repositorios/GiProy%20Network/docs/tasks/TASK-0551.md) - vistas, estado y navegación BIM
- [TASK-0552](/e:/Repositorios/GiProy%20Network/docs/tasks/TASK-0552.md) - seguridad, permisos y operación
- [TASK-0553](/e:/Repositorios/GiProy%20Network/docs/tasks/TASK-0553.md) - validación, simulación y smoke tests
- [TASK-0554](/e:/Repositorios/GiProy%20Network/docs/tasks/TASK-0554.md) - rollout y liberación
- [TASK-0555](/e:/Repositorios/GiProy%20Network/docs/tasks/TASK-0555.md) - paridad visual y funcional BIM
- [TASK-0556](/e:/Repositorios/GiProy%20Network/docs/tasks/TASK-0556.md) - feature flags y activación progresiva
- [TASK-0557](/e:/Repositorios/GiProy%20Network/docs/tasks/TASK-0557.md) - prompt maestro de transición paralela
- [TASK-0558](/e:/Repositorios/GiProy%20Network/docs/tasks/TASK-0558.md) - prompt ejecutivo de activación
- [TASK-0559](/e:/Repositorios/GiProy%20Network/docs/tasks/TASK-0559.md) - tooling de modos, runtime y TASK automática

---

## 3. Prompts operativos

### Prompt maestro de transición

- [Prompt Transición Paralela GiProy BIM](/e:/Repositorios/GiProy%20Network/docs/Prompt%20Transicion%20Paralela%20GiProy%20BIM.txt)

### Prompt ejecutivo de activación

- [Prompt Ejecutivo Activación BIM](/e:/Repositorios/GiProy%20Network/docs/Prompt%20Ejecutivo%20Activacion%20BIM.txt)

### Plantillas por modo

- [Prompt Modo Clásico](/e:/Repositorios/GiProy%20Network/docs/plantillas/Prompt%20Modo%20Clasico.txt)
- [Prompt Modo BIM](/e:/Repositorios/GiProy%20Network/docs/plantillas/Prompt%20Modo%20BIM.txt)
- [Prompt Modo Integración Controlada](/e:/Repositorios/GiProy%20Network/docs/plantillas/Prompt%20Modo%20Integracion%20Controlada.txt)

---

## 4. Tooling de continuidad

- [Lanzador Python de modos](/e:/Repositorios/GiProy%20Network/tools/ai_tools/mode_prompt_launcher.py)
- [Lanzador BAT interno](/e:/Repositorios/GiProy%20Network/tools/ai_tools/mode_prompt_launcher.bat)
- [Lanzador BAT raíz](/e:/Repositorios/GiProy%20Network/mode_prompt_launcher.bat)
- [Estado runtime](/e:/Repositorios/GiProy%20Network/docs/runtime/WORK_MODE_STATE.json)
- [README de runtime](/e:/Repositorios/GiProy%20Network/docs/runtime/README.md)

---

## 5. Regla de uso recomendada

Al retomar el programa BIM, el orden correcto es:

1. leer este índice
2. revisar `BIM_MASTER_PLAN`
3. revisar `BIM_PARALLEL_IMPLEMENTATION_STRATEGY`
4. activar el modo de sesión correspondiente con el lanzador
5. trabajar siempre sobre la TASK activa autogenerada o sobre la TASK del slice aprobado

---

## 6. Estado actual del programa BIM

### Situación actual

- planificación cerrada
- arquitectura congelada
- estrategia paralela definida
- tooling de continuidad operativo
- ejecución aún no iniciada

### Próximo paso natural

Arrancar `Ola 1` del roadmap BIM cuando se autorice la ejecución formal.

---

## 7. Regla de mantenimiento

Todo nuevo documento, TASK o herramienta del programa BIM debe quedar enlazado desde este índice. Si no aparece aquí, se considera documentación incompleta para el programa BIM.

### Política de TASKs autogeneradas

Las TASKs creadas automáticamente por el lanzador de modos se consideran bitácoras operativas de sesión.

La regla vigente es esta:

- toda sesión debe nacer con TASK activa
- si el trabajo madura o se consolida, la TASK autogenerada se promueve y se completa como TASK real del slice
- si el trabajo fue exploratorio o menor, la TASK se conserva como rastro operativo de sesión
- las TASKs estructurales del programa BIM siguen siendo las TASKs maestras y subtasks definidas en este índice

De esta forma se garantiza trazabilidad continua sin convertir las TASKs de sesión en ruido de gobierno.
