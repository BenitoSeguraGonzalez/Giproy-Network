# Gantt: duracion, anidados y ruta critica

## Alcance

Este documento fija la regla clasica para calcular fechas y duraciones en el Gantt de GiProy. Aplica al cronograma de trabajo y a su relacion con Datos Proyecto y Cronograma Valorado. No activa UX BIM ni crea dependencia hacia BIM.

## Autoridad de fecha de inicio

- `Datos Proyecto.fecha_inicio` es la autoridad externa del proyecto.
- Cuando cambia `fecha_inicio` en Datos Proyecto, el Gantt se desplaza automaticamente por la diferencia entre la referencia anterior y la nueva.
- Si despues el usuario cambia la fecha de inicio dentro de Gantt, esa fecha pasa a ser la guia operativa del Gantt.
- Si posteriormente vuelve a cambiar `fecha_inicio` en Datos Proyecto, Datos Proyecto vuelve a dirigir y el Gantt se autoajusta otra vez.
- El ajuste desplaza fechas operativas existentes; no recalcula importes, porcentajes ni contratos de presupuesto.

## Duracion base

La duracion de una linea se calcula desde su ventana operativa:

- `start_date`: inicio operativo de la linea.
- `end_date`: fin operativo de la linea.
- `metadata.manual_temporal_window`: ventana manual, si existe.
- `metadata.gantt_subbars`: periodos operativos visibles, cuando la linea esta segmentada.

La duracion se expresa contra el calendario laboral vigente: hora de inicio, horas de jornada, dias laborables por semana/mes, festivos y excepciones del calendario del proyecto.

## Lineas anidadas

En estructuras anidadas, la duracion del padre no se suma por aritmetica simple. El padre hereda la envolvente temporal de sus hijos:

- Inicio del padre: menor inicio valido de sus hijos.
- Fin del padre: mayor fin valido de sus hijos.
- Duracion del padre: tiempo laboral entre inicio y fin de esa envolvente.

Esto evita duplicar duraciones cuando varios hijos trabajan en paralelo. Si dos hijos duran 5 dias y se ejecutan al mismo tiempo, el padre dura 5 dias, no 10. Si se ejecutan en secuencia, el padre refleja la ventana completa de la secuencia.

## Periodos operativos

El termino visual unico para segmentacion temporal es `periodo`. Cronograma Valorado y Gantt deben mostrar la misma nomenclatura para evitar que un usuario interprete que `tramo` y `periodo` son conceptos distintos.

Los periodos pueden venir de:

- distribucion inicial del Cronograma Valorado;
- ventana manual del Gantt;
- division operativa de una linea;
- reagrupacion entre periodos.

## Ruta critica

La ruta critica identifica las tareas que no tienen holgura suficiente sin mover la fecha final del cronograma.

Reglas:

- Una tarea es critica cuando su holgura total es cero o negativa dentro del calendario laboral vigente.
- Las dependencias entre tareas definen la propagacion de fechas tempranas y tardias.
- Los anidados heredan criticidad cuando su envolvente depende de hijos criticos.
- Las ediciones manuales en Gantt pueden cambiar la ruta critica si modifican inicios, fines o dependencias.
- El cambio de `Datos Proyecto.fecha_inicio` desplaza el cronograma, pero no cambia por si solo las relaciones logicas; por tanto mantiene la forma de la ruta critica salvo que el calendario laboral introduzca cambios por festivos o dias no laborables.

## Validaciones esperadas

- Ninguna linea calculada debe quedar antes del inicio vigente del proyecto.
- El desplazamiento por cambio de fecha de inicio debe conservar duraciones relativas.
- La edicion posterior desde Gantt debe quedar registrada como guia operativa hasta el siguiente cambio en Datos Proyecto.
- La nomenclatura visible debe usar `periodo` en Gantt y Cronograma Valorado.
