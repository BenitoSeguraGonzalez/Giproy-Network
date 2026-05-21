# Especificación Funcional - Sincronización Real Cronograma Valorado <-> Gantt

## 1. Estado Del Documento

- Estado: Activo
- Modo: GIPROY CLASICO
- Naturaleza: Especificación funcional rectora
- Alcance: `Proyecto > Cronogramas > Cronograma Valorado` y `Proyecto > Cronogramas > Gantt`
- Exclusiones explícitas:
  - Sin código BIM
  - Sin UX BIM
  - Sin dependencias nuevas hacia BIM
  - Sin cambio de backend separado

## 2. Propósito

Congelar el contrato funcional para sincronizar realmente `Cronograma Valorado` y `Gantt` bajo una lógica temporal coherente con:

- fechas reales de proyecto
- horas reales de jornada
- inicios parciales de periodo
- distinta longitud de meses y periodos
- representación económica en `Valorado`
- representación operativa fragmentada en `Gantt`

El objetivo es evitar que futuras sesiones reconstruyan criterios desde cero o mezclen reglas parciales incompatibles.

## 3. Problema Actual

El sistema ya tiene:

- `Gantt` como fuente temporal dominante
- `Cronograma Valorado` como periodización económica derivada
- soporte de `hora_inicio_jornada`
- modo `Desde Gantt`

Pero aún no existe un contrato suficientemente cerrado para:

1. derivar el `Valorado` desde una secuencia temporal realmente consistente cuando el proyecto no inicia al comienzo de un mes o periodo visible;
2. distinguir entre:
   - base temporal interna
   - formato de presentación visible
   - redistribución homogénea real;
3. representar en `Gantt` una línea económica fragmentada en varios periodos no nulos como subtramos dentro de una misma fila;
4. impedir que la fragmentación operativa del `Gantt` supere el mandato económico-temporal fijado por el `Valorado`.

## 4. Decisión Rectora

La sincronización `Valorado <-> Gantt` se congela bajo este principio:

> La unidad base interna de cálculo será el día operativo efectivo.  
> Toda vista visible por `mes`, `quincena`, `semana`, etc. será una agregación derivada de esa base diaria.  
> `Cronograma Valorado` fija el mandato económico-temporal por periodo visible.  
> `Gantt` representa ese mandato mediante subbarras por periodo y puede subdividirlo operativamente sin superarlo.

## 5. Modelo Conceptual

Se distinguen tres capas obligatorias.

### 5.1 Capa A - Secuencia Base Interna

Unidad base:

- `día operativo efectivo`

Cada línea calculable debe poder expresarse internamente como una secuencia diaria con:

- `date`
- `start_at`
- `end_at`
- `work_hours`
- `weight_percent`
- `weight_amount`

Notas:

- `start_at` y `end_at` deben respetar `hora_inicio_jornada` y `jornada_laboral_horas`.
- un proyecto puede iniciar en cualquier día del mes;
- un periodo parcial al inicio o al fin no debe ser redondeado artificialmente a “mes completo”.

### 5.2 Capa B - Agregación Visible

La vista visible del `Cronograma Valorado` no calcula directamente “por mes” o “por quincena” como base primaria.

Debe:

1. tomar la secuencia diaria interna;
2. reagrupar los días en el tipo de periodo solicitado;
3. sumar pesos diarios para producir el porcentaje y monto del periodo.

### 5.3 Capa C - Representación Operativa

`Gantt` no debe limitarse a una barra única por línea cuando el `Valorado` tiene múltiples periodos no nulos.

Debe poder representar:

- una fila
- múltiples subbarras
- una subbarra por periodo con valor económico/porcentual positivo

## 6. Reglas Funcionales Congeladas

### 6.1 Regla Base De Periodización

La periodización inicial debe construirse así:

1. tomar `start_date` y `end_date` efectivos de la línea en Gantt;
2. expandir la línea a días operativos efectivos;
3. distribuir el peso homogéneamente sobre esos días;
4. reagrupar esos días al formato visible solicitado.

Consecuencia:

- si el proyecto inicia el día `17` de un mes, el primer mes no se trata como un mes completo teórico;
- el peso de ese primer periodo depende solo de los días efectivos realmente contenidos.

### 6.2 Regla De Longitud Real Del Periodo

Los periodos visibles deben respetar su longitud real.

Ejemplos:

- febrero no equivale a marzo;
- una quincena parcial no equivale a una quincena completa;
- un periodo visible que contiene solo parte del trabajo no debe recibir una cuota homogénea ficticia ajena a sus días efectivos.

### 6.3 Regla De Hora Efectiva

La base temporal debe respetar:

- `hora_inicio_jornada`
- `jornada_laboral_horas`
- ventanas reales de trabajo

La secuencia diaria no se apoya solo en medianoches civiles.

### 6.4 Regla De Cambio De Presentación

Cambiar el tipo de periodo visible:

- `mensual`
- `quincenal`
- `semanal`
- etc.

no debe equivaler automáticamente a recalcular una distribución nueva.

Debe significar:

- reagrupación de la misma base diaria existente

### 6.5 Regla De Rehacer Homogéneo

La acción `rehacer fragmentación homogénea` sí debe regenerar la secuencia base diaria.

Debe entenderse como:

- descartar la distribución diaria derivada vigente;
- volver a construir una nueva secuencia homogénea diaria desde el estado temporal actual del Gantt.

### 6.6 Regla De Override Manual

Una vez generado el `Cronograma Valorado`, el usuario puede ajustar manualmente cantidades o porcentajes.

Ese ajuste:

- no redefine la base diaria homogénea histórica;
- crea un estado derivado manual sobre la línea o periodo;
- debe quedar trazable como override explícito.

### 6.7 Regla De Líneas Solo Materiales Y Duración Temporal Manual

Debe reconocerse explícitamente la casuística de líneas presupuestarias/APU compuestas solo por recursos tipo `Materiales`.

En ese caso:

- la duración productiva derivada desde `Presupuesto/APU` puede ser `0`;
- esa duración `0` no debe interpretarse como imposibilidad de programar la línea;
- la línea debe poder recibir una duración temporal manual dentro del carril operativo clásico;
- esa duración temporal manual debe poder expandirse a la base diaria y reagruparse dentro de los periodos visibles del `Cronograma Valorado`.

Interpretación funcional congelada:

- la línea representa adquisición, suministro o subcontratación sin rendimiento productivo gobernante;
- el tiempo operativo no nace de `cantidad x rendimiento`;
- la temporalidad nace de una decisión manual de programación;
- esa decisión manual no crea ni simula rendimiento productivo donde no existe.

Contrato obligatorio:

1. la línea conserva su vínculo con la línea de `Presupuesto/APU` origen;
2. la línea conserva duración productiva `0` como dato de origen presupuestario cuando corresponda;
3. la duración temporal manual vive como dato operativo de programación;
4. la línea puede entrar en `Cronograma Valorado` y en `Gantt` usando esa duración temporal manual;
5. cualquier aceptación de sesión debe seguir dejando trazable que se trata de una temporalidad manual sobre una línea sin duración productiva gobernante.

### 6.8 Matriz De Entrada Temporal Por Tipo De Línea

La entrada temporal inicial de una línea debe obedecer esta matriz:

1. línea con rendimiento gobernante válido
   - fuente temporal base: cálculo productivo vigente + programación Gantt
   - duración productiva: `> 0`
   - duración temporal manual: no dominante por defecto
2. línea `solo materiales` sin duración manual definida
   - fuente temporal base: no programable todavía para derivación valorada real
   - duración productiva: `0`
   - estado esperado: requiere definición manual de ventana temporal
3. línea `solo materiales` con duración manual definida
   - fuente temporal base: ventana temporal manual operativa
   - duración productiva: `0`
   - duración temporal manual: dominante para periodización y representación

Regla obligatoria:

- el motor de derivación no debe intentar homogeneizar una línea `solo materiales` sin ventana temporal manual como si tuviera duración productiva implícita.

### 6.9 Regla De Recalculo Para Líneas Solo Materiales

Cuando exista una línea `solo materiales`, las acciones de recalculo deben comportarse así:

- `Recalcular desde Gantt`
  - si la línea ya tiene ventana temporal manual vigente en Gantt, esa ventana se usa como base temporal;
  - si la línea no tiene ventana temporal manual, no debe inventarse una duración.
- `Recalcular desde presupuesto`
  - no debe convertir una línea `solo materiales` en línea productiva ni fabricarle rendimiento;
  - puede limpiar o invalidar la temporalidad manual solo si el usuario ejecuta una acción explícita de reconciliación que así lo indique.
- `Rehacer homogéneo`
  - si la línea es productiva, regenera desde su temporalidad vigente;
  - si la línea es `solo materiales`, solo puede operar sobre una ventana manual ya existente, nunca crear una duración ficticia desde `0`.
- `Homogéneo` / `Definido por usuario`
  - si el `Cronograma Valorado` sale de `Desde Gantt`, las líneas con ventana temporal manual válida no pierden esa ventana en `Gantt`;
  - dicha ventana queda preservada solo como referencia operativa;
  - mientras el Valorado no vuelva a `Desde Gantt`, la distribución económica visible queda gobernada por el modo valorado activo y no por esas ventanas manuales.

### 6.10 Regla De Aceptación De Sesión Para Líneas Solo Materiales

Aceptar una sesión que incluya líneas `solo materiales` debe significar:

- consolidar la temporalidad manual operativa de esa línea;
- conservar la distinción entre temporalidad operativa y duración productiva del APU;
- dejar trazable el origen `manual_temporal_material_only` o equivalente de negocio;
- permitir la derivación del `Cronograma Valorado` y la representación en `Gantt` sobre esa base manual.

No debe significar:

- convertir la línea a productiva;
- escribir rendimiento gobernante inexistente;
- mutar la duración productiva del presupuesto maestro.

## 7. Contrato Entre Valorado Y Gantt

## 7.1 Valorado Como Mandato Económico-Temporal

`Cronograma Valorado` fija para cada línea y periodo visible:

- porcentaje asignado
- monto asignado
- ventana temporal visible

Ese valor actúa como techo operativo para `Gantt`.

## 7.2 Gantt Como Representación Operativa Fragmentada

Cada línea del Gantt puede mostrar múltiples subbarras en la misma fila.

Regla:

- se dibuja una subbarra por cada periodo del `Valorado` con peso `> 0`

Ejemplo:

- línea: `Replanteo y nivelación`
- periodos no nulos: `P1`, `P2`, `P3`, `P4`, `P5`
- representación esperada: cinco subbarras en la misma fila

## 7.3 Regla De Tope Por Periodo

Para cada línea y para cada periodo visible:

> la suma de subbarras operativas del Gantt en ese periodo no puede superar el porcentaje/monto asignado en el Cronograma Valorado.

Ejemplo:

- periodo mensual con `12%`
- el usuario puede dividir ese `12%` en varias subbarras internas
- pero la suma de todas las subbarras de ese mes nunca puede superar `12%`

## 7.4 Regla De Subdivisión Operativa

Se distinguen dos niveles:

- `subbarra madre`: representa el cupo del periodo valorado
- `subbarras hijas`: subdivisión operativa opcional dentro del mismo periodo

Contrato:

- si no existe subdivisión manual, se renderiza una única subbarra por periodo;
- si existe subdivisión manual, el total agregado de hijas no supera la madre;
- el periodo visible sigue siendo la unidad de control superior.

## 8. Comportamientos Que Deben Quedar Diferenciados

Para evitar ambigüedad funcional, el sistema debe distinguir estas acciones:

### 8.1 Cambiar Tipo De Periodo

- acción de presentación
- no redistribuye desde cero
- reagrupa la base diaria existente

### 8.2 Rehacer Homogéneo

- acción de regeneración
- reconstruye la base diaria homogénea desde el estado temporal vigente del Gantt

### 8.3 Editar Manualmente El Valorado

- acción de override
- modifica una línea o periodo visible
- no debe confundirse con reagrupación ni con rehacer homogéneo

### 8.4 Dividir Operativamente En Gantt

- acción operativa sobre la representación temporal
- subdivide internamente un cupo visible ya fijado en el `Valorado`
- no puede crear cantidad superior al mandato del periodo

## 9. Estados Funcionales Requeridos

Cada línea debe poder caer en alguno de estos estados conceptuales:

- `Sincronizado desde Gantt`
- `Reagrupado por presentación`
- `Rehecho homogéneo`
- `Override manual en Valorado`
- `Fragmentado operativamente en Gantt`
- `En conflicto de reconciliación`

Estos estados no obligan todavía a una UI definitiva, pero sí a un contrato claro de negocio y trazabilidad.

## 10. Casos Borde Obligatorios

La implementación futura deberá cubrir explícitamente:

1. proyecto que inicia a mitad de mes;
2. proyecto que termina a mitad de mes;
3. meses con distinta cantidad de días;
4. periodos con inicio/final parcial;
5. tareas de duración cero o hitos;
6. tareas con fecha-hora efectiva;
7. líneas con override manual previo;
8. cambio de presentación sin rehacer homogéneo;
9. rehacer homogéneo tras overrides;
10. división operativa en Gantt dentro de un periodo ya valorizado.

## 11. Restricciones De Persistencia Y Gobierno

La implementación futura deberá respetar estas restricciones:

- backend único y común;
- no crear backend BIM separado;
- no contaminar BIM;
- no introducir UX BIM;
- no romper reporting existente sin una migración controlada;
- no borrar silenciosamente overrides o fragmentaciones operativas previas.

Además:

- cambiar la presentación de periodos no debe destruir datos manuales;
- rehacer homogéneo sí puede reemplazar la distribución derivada, pero debe ser acción explícita y confirmada;
- las subdivisiones operativas del Gantt deben quedar sujetas a validación contra el cupo del `Valorado`.
- aceptar cambios de una sesión de trabajo no puede romper el contrato ya aprobado con `Presupuesto/APU`.

## 11.1 Contrato Obligatorio Con Presupuesto Al Aceptar Cambios De Sesión

Toda futura implementación de este frente debe mantener vigente el contrato de gobierno `Gantt <-> Presupuesto/APU` ya fijado en las TASKs `0969` a `0977`.

Esto implica:

1. aceptar cambios de una sesión de trabajo en `Gantt` o en la sincronización `Valorado <-> Gantt` no puede mutar silenciosamente `Presupuesto/APU`;
2. cualquier reconciliación con `Presupuesto/APU` debe seguir siendo explícita, trazable y confirmada por el usuario;
3. la aceptación de sesión no puede invalidar en silencio:
   - cantidades presupuestarias
   - rendimiento operativo
   - duración gobernada por recursos
   - referencias de línea presupuestaria
4. si existe conflicto entre la fragmentación temporal aceptada y el contrato productivo vigente de `Presupuesto/APU`, el sistema debe dejarlo en estado explícito de reconciliación, nunca resolverlo en silencio.

Excepción funcional explícita:

- en líneas `solo materiales`, la aceptación de sesión puede consolidar una duración temporal manual operativa sin convertirla en duración productiva del APU maestro;
- esa consolidación debe quedar trazada como programación manual de suministro/subcontratación, no como mutación del rendimiento del presupuesto.

## 11.2 Regla De Cierre De Sesión

Aceptar una sesión de trabajo debe significar:

- consolidar el estado temporal/valorado autorizado;
- preservar el vínculo con la línea de `Presupuesto` origen;
- mantener la trazabilidad de qué cambió en programación y qué no ha sido reconciliado todavía contra `Presupuesto/APU`.

No debe significar:

- sobrescribir automáticamente el presupuesto maestro;
- recalcular silenciosamente rendimientos del APU maestro;
- borrar conflictos pendientes de conciliación;
- reinterpretar una sesión temporal aprobada como si fuera una aceptación productiva del presupuesto.

## 12. Invariantes Funcionales

Estos invariantes quedan congelados.

1. La suma total por línea en `Cronograma Valorado` debe seguir siendo `100%`.
2. La suma monetaria total por línea debe conservar consistencia con el presupuesto vigente.
3. El cambio de vista visible no debe reinterpretar arbitrariamente la economía de la línea.
4. `Valorado` manda el cupo económico-temporal por periodo visible.
5. `Gantt` no puede superar el cupo del `Valorado` dentro de cada periodo.
6. La base temporal real toma como referencia días operativos efectivos, no meses teóricos planos.
7. Aceptar cambios de sesión no rompe el contrato de sincronización explícita con `Presupuesto/APU`.
8. Ninguna aceptación de sesión puede producir mutación silenciosa del presupuesto maestro ni del APU maestro.
9. Una línea `solo materiales` con duración productiva `0` puede tener duración temporal manual operativa sin romper el contrato con `Presupuesto/APU`, siempre que ambas lecturas queden diferenciadas y trazables.

## 13. Estrategia De Implementación Recomendada

La evolución futura debe hacerse por etapas:

### Etapa 1 - Contrato Temporal Interno

- formalizar la base diaria
- formalizar reagrupación visible
- formalizar `rehacer homogéneo`

### Etapa 2 - Motor De Valorado Diario

- recalcular `Cronograma Valorado` desde secuencia diaria
- respetar `hora_inicio_jornada`
- soportar periodos parciales
- soportar líneas `solo materiales` con duración temporal manual aunque su duración productiva siga siendo `0`

### Etapa 3 - Gobierno De Overrides

- distinguir reagrupación, override y regeneración
- preservar trazabilidad

### Etapa 4 - Gantt Segmentado

- representar subbarras por periodo visible
- soportar múltiples barras en una sola fila

### Etapa 5 - Restricción Operativa

- bloquear excesos frente al mandato del `Valorado`
- permitir subdivisión interna controlada

### Etapa 6 - QA Y Reporting

- validar casos borde
- validar reporting
- validar contrato de aceptación de sesión contra `Presupuesto/APU`
- validar no interferencia BIM

## 14. Decisiones Ya Congeladas Por Esta Especificación

Quedan aprobadas para futuras TASKs:

- la base temporal interna será diaria;
- el formato visible es una agregación derivada;
- `rehacer homogéneo` no es lo mismo que cambiar el tipo de periodo;
- `Cronograma Valorado` fija el mandato por periodo;
- `Gantt` lo representa y puede subdividirlo sin superarlo;
- el proyecto puede iniciar fuera del inicio de mes y eso debe afectar la periodización real;
- una línea `solo materiales` puede programarse manualmente en tiempo sin inventar rendimiento productivo.

## 15. Persistencia Y Modelo Operativo De Subbarras

La implementación futura deberá persistir la fragmentación operativa sin romper el contrato actual del `Gantt` ni la referencia a la línea presupuestaria origen.

### 15.1 Unidad De Persistencia

La entidad operativa primaria sigue siendo la línea calculable del Gantt.

La fragmentación por subbarras no crea una nueva “tarea maestra” ajena al presupuesto.

Debe entenderse como:

- una línea presupuestaria origen;
- una secuencia de fragmentos operativos hijos dentro de esa misma línea;
- un mandato superior fijado por los periodos del `Cronograma Valorado`.

### 15.2 Alcance De La Persistencia

La persistencia futura de subbarras debe vivir dentro del carril común de `cronogramas-trabajo`, no en una estructura paralela desconectada.

Debe conservar como mínimo:

- `budget_line_id`
- `period_id` o referencia inequívoca al periodo visible del valorado
- `fragment_id`
- `starts_at`
- `ends_at`
- `work_hours`
- `percent_allocated`
- `amount_allocated` cuando aplique
- `origin`
- `status`
- `created_from_session`
- `updated_at`

### 15.3 Tipos De Fragmento

Cada subbarra futura debe poder clasificarse como:

- `derived`
  - fragmento generado automáticamente a partir del mandato del `Valorado`
- `manual_split`
  - fragmento creado por división manual dentro de un periodo ya existente
- `manual_adjustment`
  - fragmento ajustado manualmente sin alterar la línea origen
- `conflict`
  - fragmento que entra en tensión con el contrato de `Valorado` o con `Presupuesto/APU`

### 15.4 Regla De Identidad

La identidad de una subbarra no debe sustituir la identidad de la línea presupuestaria.

Debe cumplirse:

- la línea origen sigue siendo el ancla funcional principal;
- los fragmentos son hijos operativos de esa línea;
- toda navegación, historial y reconciliación debe poder volver siempre a la línea origen.

### 15.5 Regla De Rehidratación

Al recargar el módulo, el sistema debe ser capaz de reconstruir:

- la barra madre por periodo visible;
- las subdivisiones manuales existentes;
- su estado de sincronización con el `Valorado`;
- su estado de reconciliación con `Presupuesto/APU`.

Queda prohibido que la recarga colapse silenciosamente todas las subbarras a una única barra si ya existía división operativa persistida.

### 15.6 Regla De Mandato Superior

Cada conjunto de fragmentos hijos debe quedar siempre ligado a un periodo visible del `Valorado`.

La comprobación funcional obligatoria es:

`sum(fragmentos_hijos_del_periodo) <= cupo_del_periodo_valorado`

Si esa condición falla:

- no debe persistirse como estado válido silencioso;
- debe registrarse como conflicto o validación fallida.

### 15.7 Regla De Sesión De Trabajo

Durante una sesión de trabajo pueden existir fragmentaciones temporales todavía no aceptadas.

La persistencia futura debe distinguir entre:

- `draft_session`
- `accepted_session`
- `confirmed_against_budget` cuando exista reconciliación superior

Esto es obligatorio para no mezclar:

- edición operativa local;
- aceptación temporal de la sesión;
- aceptación productiva sobre `Presupuesto/APU`.

## 16. Flujo Exacto De Interacción En Gantt

La futura UX de subbarras debe insertarse en el flujo actual del Gantt y conservar su gramática operativa.

### 16.1 Entrada Principal

La división de una barra debe poder iniciarse desde puntos ya esperables del Gantt:

- barra seleccionada;
- `Contexto de tarea`;
- acción contextual sobre el tramo;
- `Herramientas` del Gantt cuando el usuario ya esté en edición de una tarea.

La entrada principal recomendada queda así:

1. el usuario selecciona una tarea;
2. identifica visualmente sus subbarras derivadas por periodo;
3. sobre una subbarra activa una acción contextual de división;
4. el sistema abre un flujo ligero de ajuste dentro del propio lenguaje del Gantt.

### 16.2 Secuencia Operativa Mínima

La secuencia mínima debe ser:

1. **Lectura**
   - ver subbarras ya generadas por periodo
2. **Selección**
   - seleccionar una subbarra concreta
3. **Acción**
   - dividir
   - ajustar
   - reagrupar
4. **Validación**
   - comprobar cupo máximo del periodo
5. **Resultado**
   - guardar como borrador de sesión
   - aceptar sesión
   - dejar conflicto explícito si excede el mandato

### 16.3 Regla De División

Dividir una subbarra no debe requerir una UI pesada.

El comportamiento futuro esperado es:

- seleccionar tramo;
- invocar acción de división;
- generar dos o más fragmentos dentro del mismo periodo visible;
- redistribuir el cupo interno del periodo;
- validar inmediatamente que la suma no supera el mandato superior.

### 16.4 Regla De Reagrupación

Si el usuario ha dividido un tramo y después quiere simplificarlo, debe existir una acción de reagrupación.

La reagrupación:

- actúa solo dentro del periodo visible;
- no altera el mandato del `Valorado`;
- reconstruye una barra consolidada equivalente cuando la suma sea compatible.

### 16.5 Regla De Ajuste Fino

El ajuste fino de subbarras debe seguir la lógica ya existente del Gantt:

- arrastre controlado;
- edición contextual ligera;
- feedback inmediato;
- sin overlays pesados ajenos al módulo.

Si el ajuste pretende invadir el cupo de otro periodo o exceder el mandato visible:

- debe mostrarse conflicto o bloqueo inmediato;
- no debe esperarse al guardado final para descubrir el error.

### 16.6 Regla De Feedback Visual

El usuario debe entender rápidamente:

- qué subbarra está seleccionada;
- qué parte del periodo ya está ocupada;
- cuánto cupo queda disponible;
- si el tramo editado entra en conflicto.

Este feedback debe resolverse con el mismo lenguaje del Gantt actual:

- contraste sobrio;
- tooltip o microleyenda;
- contexto lateral o contextual liviano;
- sin cards nuevas decorativas.

### 16.7 Regla De Integración Con Cambios E Historial

Toda operación sobre subbarras debe convivir con los carriles ya existentes:

- `Cambios`
- `Historial`
- confirmación
- volver al confirmado

Eso implica:

- una división manual genera cambio visible en la bandeja `Cambios`;
- la aceptación de sesión no la convierte automáticamente en reconciliación presupuestaria;
- el historial debe poder identificar que hubo fragmentación operativa de una línea.

### 16.8 Regla De Integración Con Dependencias

Las subbarras no deben romper el modelo principal de dependencias de la tarea.

Por ahora, y salvo decisión futura distinta, el nodo de dependencia dominante sigue siendo la tarea/línea principal.

Consecuencia:

- una división de subbarra no crea automáticamente dependencias nuevas de bajo nivel;
- las dependencias siguen colgando de la línea/tarea maestra, salvo fase futura autorizada.

### 16.9 Regla De Reconciliación Con Valorado

Cuando el usuario edite subbarras, el sistema debe poder explicar:

- si sigue dentro del mandato del `Valorado`;
- si ya agotó el cupo del periodo;
- si necesita reequilibrio entre fragmentos del mismo periodo;
- si la acción provocaría conflicto con la distribución visible.

### 16.10 Regla De Reconciliación Con Presupuesto/APU

Toda edición de subbarras debe seguir subordinada al gobierno ya congelado de `Presupuesto/APU`.

Eso significa:

- fragmentar temporalmente no equivale a modificar el APU maestro;
- aceptar una sesión con subbarras no equivale a aceptar un cambio productivo del presupuesto;
- si una subbarra intenta forzar una lectura incompatible con cantidad/rendimiento/duración gobernada, debe abrir conflicto explícito de reconciliación.

### 16.11 Regla De Entrada UX Para Líneas Solo Materiales

La línea `solo materiales` no debe obligar al usuario a falsear recursos, rendimientos o duración productiva para poder programarla.

La entrada UX congelada para este caso debe ser:

1. la línea se identifica como `solo materiales` dentro del Gantt clásico;
2. desde las opciones ya existentes del Gantt se habilita una acción compacta de `Definir tiempo` o equivalente alineado al lenguaje actual del módulo;
3. el usuario define una ventana temporal manual operativa;
4. esa ventana entra en la base diaria y en la periodización visible;
5. la línea pasa a poder representarse en `Gantt` y `Cronograma Valorado` sin alterar el APU maestro.

Reglas UX obligatorias:

- la acción debe vivir dentro de `Contexto`, `Herramientas` o flujo equivalente ya existente del Gantt;
- no debe abrir una shell paralela ni un editor ajeno al sistema;
- debe dejar claro que se está definiendo programación manual, no rendimiento productivo;
- el feedback visual debe ser profesional, compacto y consistente con el resto del módulo.

## 17. Política De Reconciliación Y Estados Visibles

La implementación futura debe exponer una política de reconciliación explícita y profesional, alineada con los patrones ya aprobados en `Gantt`, `Valorado` y el gobierno `Presupuesto/APU`.

### 17.1 Principio General

Ningún conflicto entre:

- `Gantt`
- `Cronograma Valorado`
- `Presupuesto/APU`

debe resolverse en silencio.

El usuario siempre debe ver:

- qué cambió;
- qué capa manda en ese momento;
- qué impacto tiene aceptar, mantener o recalcular;
- qué queda pendiente de reconciliación.

### 17.2 Tipos De Conflicto

El sistema debe distinguir al menos estos tipos:

- `conflict_valued_period_cap`
  - la edición de subbarras supera el cupo del periodo visible del `Valorado`
- `conflict_valued_distribution`
  - la fragmentación operativa ya no coincide con la distribución visible esperada
- `conflict_budget_governance`
  - la lectura temporal aceptada entra en tensión con cantidad, rendimiento o duración gobernada por `Presupuesto/APU`
- `manual_temporal_material_only`
  - la línea tiene duración temporal manual válida sobre una base productiva `0` por tratarse de suministro/subcontratación sin rendimiento gobernante
- `conflict_pending_recalculation`
  - el `Valorado` o el `Gantt` requieren recalcular/reagrupar antes de aceptar
- `conflict_session_vs_confirmed`
  - la sesión actual difiere del último estado confirmado

### 17.3 Estados Visibles De Línea

Cada línea deberá poder mostrar estados visibles coherentes con el lenguaje actual del sistema.

Estados conceptuales congelados:

- `Sincronizado`
  - la línea coincide con su mandato valorado y no tiene conflicto activo
- `Fragmentado`
  - la línea tiene subbarras operativas válidas dentro del cupo permitido
- `Pendiente`
  - la línea tiene cambios de sesión no aceptados
- `En conflicto`
  - la línea excede cupo, rompe distribución esperada o queda en tensión con `Presupuesto/APU`
- `Pendiente APU`
  - la línea entra en conflicto con el gobierno de recursos/rendimiento del presupuesto
- `Programación manual`
  - la línea no tiene duración productiva gobernante y su ventana temporal viene dada manualmente para poder programarse y periodizarse
- `Confirmado`
  - la línea quedó consolidada en el último estado confirmado

No se congela todavía el texto exacto de cada microestado en UI, pero sí su semántica.

### 17.4 Estados Visibles De Subbarra

Cada subbarra futura debe poder leerse como:

- `Derivada`
- `Manual`
- `Seleccionada`
- `Ajustada`
- `Excedida`
- `Bloqueada`

Propósito:

- que el usuario entienda si el tramo viene del cálculo base, de una intervención manual o de un conflicto operativo.

### 17.5 Estado Visible De Sesión

La sesión de trabajo completa debe poder caer en uno de estos estados:

- `Sesión limpia`
  - no hay cambios respecto al estado vigente
- `Sesión con cambios`
  - existen subbarras o ajustes pendientes de aceptar
- `Sesión con conflicto`
  - existe al menos una incompatibilidad con `Valorado` o `Presupuesto/APU`
- `Sesión aceptada`
  - el estado temporal/valorado fue aceptado como sesión operativa
- `Sesión confirmada`
  - además del estado aceptado, se consolidó en el carril de confirmación vigente del cronograma

### 17.6 Acciones Permitidas Frente A Conflicto

Ante un conflicto, el sistema no debe improvisar acciones nuevas fuera del lenguaje ya aprendido.

Las familias de acción válidas quedan congeladas así:

- `Mantener sesión`
  - conserva el borrador operativo actual
- `Reequilibrar`
  - redistribuye internamente fragmentos dentro del mismo cupo del periodo
- `Reagrupar`
  - consolida tramos cuando sea posible sin cambiar el mandato superior
- `Recalcular desde Gantt`
  - regenera el `Valorado` desde la temporalidad vigente cuando esa sea la decisión explícita
- `Recalcular desde presupuesto`
  - trae el gobierno productivo cuando el conflicto venga de `Presupuesto/APU`
- `Volver al confirmado`
  - restaura el último estado confirmado del cronograma

### 17.7 Regla De Impacto Antes De Aceptar

Antes de aceptar una sesión con cambios o conflictos, el sistema debe poder mostrar impacto resumido.

El impacto mínimo requerido es:

- líneas afectadas;
- periodos afectados;
- tramos excedidos o reequilibrados;
- diferencia frente al último confirmado;
- impacto potencial sobre `Presupuesto/APU` cuando aplique.

### 17.8 Regla De Prioridad Entre Capas

La prioridad funcional queda así:

1. `Presupuesto/APU` gobierna cantidad, rendimiento y duración productiva.
2. `Cronograma Valorado` gobierna el cupo económico-temporal por periodo visible.
3. `Gantt` gobierna la representación y fragmentación operativa dentro de esos límites.

Matiz congelado:

- cuando una línea sea `solo materiales` y su duración productiva de origen sea `0`, `Presupuesto/APU` sigue gobernando la naturaleza no productiva de la línea;
- la duración temporal manual permitida en `Gantt/Valorado` pasa a ser una excepción operativa controlada de programación, no una duración productiva recalculada.

Si dos capas entran en tensión:

- no se resuelve automáticamente;
- se presenta conflicto;
- el usuario decide la reconciliación explícita.

### 17.9 Regla De Feedback Profesional

El feedback de conflicto debe usar el mismo patrón sobrio del sistema:

- indicadores compactos;
- panel contextual o resumen ligero;
- lectura clara de impacto;
- sin alarmismo visual ni widgets ajenos al módulo.

### 17.10 QA Funcional Obligatoria

La futura implementación deberá validar, como mínimo:

1. subbarra que excede el cupo del periodo;
2. línea fragmentada válida sin conflicto;
3. sesión con cambios pendientes;
4. sesión aceptada sin confirmación presupuestaria;
5. conflicto `Presupuesto/APU -> Gantt`;
6. vuelta al confirmado tras fragmentación manual;
7. `Recalcular desde Gantt` con subbarras previas;
8. `Recalcular desde presupuesto` con sesión fragmentada activa.
9. línea `solo materiales` con duración productiva `0` y duración temporal manual válida.
10. aceptación de sesión de línea `solo materiales` sin mutar rendimiento ni duración productiva del APU maestro.

## 18. Decisiones Ya Congeladas Por Esta Especificación

Quedan aprobadas para futuras TASKs:

- la base temporal interna será diaria;
- el formato visible es una agregación derivada;
- `rehacer homogéneo` no es lo mismo que cambiar el tipo de periodo;
- `Cronograma Valorado` fija el mandato por periodo;
- `Gantt` lo representa y puede subdividirlo sin superarlo;
- el proyecto puede iniciar fuera del inicio de mes y eso debe afectar la periodización real;
- las subbarras seguirán siendo hijas operativas de una línea origen, no tareas maestras nuevas;
- la división/reagrupación debe vivir dentro del propio Gantt y entrar en `Cambios` e `Historial`;
- los conflictos entre `Valorado`, `Gantt` y `Presupuesto/APU` deben resolverse solo mediante reconciliación explícita.

## 19. Criterios UX/UI Congelados

La futura implementación de subbarras debe mantenerse estrictamente alineada con el lenguaje actual del sistema y, en particular, con el `Gantt` clásico ya implantado.

### 16.1 Regla De Lenguaje Visual

Queda prohibido resolver este frente como si fuera un subproducto nuevo dentro de `Cronogramas`.

No se debe:

- inventar labels ajenos al lenguaje actual;
- introducir cards nuevas que no existan en el patrón del módulo;
- rehacer la shell visual del Gantt;
- convertir la fragmentación en una UI experimental separada del resto del workspace.

La solución debe sentirse como una extensión natural del `Gantt` clásico actual.

### 16.2 Regla De Integración En Gantt

La división de subbarras debe entrar dentro de las opciones y superficies que el Gantt ya tiene hoy.

Puntos válidos de integración futura:

- toolbar superior ya existente;
- menú `Herramientas`;
- `Contexto` de tarea;
- acciones contextuales ya presentes en fila o barra;
- paneles operativos ya existentes de la tarea seleccionada.

Puntos no válidos:

- un módulo paralelo dentro de `Cronogramas`;
- una shell nueva de edición;
- overlays o paneles que parezcan de otro producto;
- duplicar acciones en otra banda si ya existe un punto lógico en el Gantt actual.

### 16.3 Regla De Descubribilidad

La división de subbarras debe ser intuitiva.

Eso implica:

- el usuario debe poder descubrirla desde la interacción normal del Gantt;
- la acción debe vivir donde ya espera operar sobre una barra o sobre una tarea;
- no debe depender de nomenclatura técnica críptica;
- no debe obligar a memorizar una ruta escondida distinta del resto del módulo.

### 16.4 Regla De Densidad Visual

La fragmentación no debe degradar el Gantt a una superficie recargada o caótica.

La UI futura debe:

- preservar la lectura de la fila principal;
- mantener la jerarquía actual `fila -> barra -> acciones`;
- usar el mismo patrón de botones compactos, tooltips y paneles ligeros ya aprobado;
- evitar badges, chips o bloques decorativos si no aportan decisión operativa real.

### 16.5 Regla De Etiquetado

Las etiquetas visibles deben derivar del lenguaje ya asentado en el sistema:

- terminología corta;
- mayúsculas técnicas cuando ya existan en el módulo;
- micro-labels y tooltips discretos;
- sin naming marketiniano ni semántica ajena al dominio.

Antes de introducir cualquier etiqueta nueva, la implementación futura deberá comprobar si el concepto puede resolverse con:

- `Contexto`
- `Herramientas`
- `Configuración`
- `Cambios`
- `Historial`
- `Dependencias`

o con otra familia ya existente en el Gantt clásico.

### 16.6 Regla De Interacción Para Subbarras

La interacción futura debe seguir esta progresión:

1. lectura pasiva de subbarras en la misma fila;
2. selección clara del tramo;
3. acceso a acción contextual para dividir, ajustar o reagrupar;
4. validación inmediata contra el cupo del `Valorado`.

La división no debe sentirse como edición estructural compleja tipo CAD, sino como una operación operativa natural del cronograma.

### 16.7 Regla De Profesionalidad Visual

El resultado debe transmitir una lectura profesional, técnica y sobria.

Por tanto:

- prioridad a claridad operativa sobre efectos;
- mismo colorido base del sistema (`#F39200`, `#136191`, grises y blancos del módulo);
- mismos bordes, densidades y tipografía del Gantt actual;
- sin dramatizar la fragmentación con una visualidad distinta al resto del producto.

### 16.8 Regla De Compatibilidad Con El Estado Actual Del Gantt

La futura UX de subbarras debe convivir con:

- `Configuración`
- `Historial`
- `Pareto`
- `MS Project`
- `Cambios`
- `Contexto de tarea`
- `Dependencias`

sin duplicar carriles ni desplazar herramientas ya aprendidas por el usuario.

### 16.9 Regla De Implementación UX Por Fases

La UX de subbarras deberá madurar por fases:

- Fase UX 1:
  - lectura visual de subbarras por periodo
  - selección de tramo
  - tooltip/contexto básico

- Fase UX 2:
  - división intuitiva desde acciones ya existentes del Gantt
  - validación de topes por periodo
  - feedback visible de exceso o conflicto

- Fase UX 3:
  - reagrupación y ajuste fino
  - estados de reconciliación con `Valorado`
  - reporting y trazabilidad visual refinada

## 20. No Interferencia BIM

Esta especificación es exclusiva de `GiProy Clásico`.

Queda prohibido usarla para:

- activar módulos BIM
- introducir componentes BIM
- acoplar `Valorado/Gantt` a carriles BIM
- alterar feature flags BIM

## 21. Punto Oficial De Reentrada

Toda futura implementación de este frente debe reentrar desde:

- este documento
- la TASK activa asociada
- `docs/runtime/WORK_MODE_STATE.json`

Queda desaconsejado retomar el trabajo basándose solo en memoria de sesión o interpretación libre del histórico.

## 22. Adecuación Del Modelo De Tramos Iniciales

Tras revisar la implementación inicial cerrada en `TASK-1070`, se congela una corrección funcional importante:

- el `Gantt` no debe operar solo con `subbarras persistidas`;
- debe operar sobre una entidad madre explícita: `tramo inicial valorado`;
- las subdivisiones operativas pasan a ser hijas de ese tramo madre;
- la unión entre tramos de distinto origen ya no puede resolverse como una simple reagrupación visual.

### 22.1 Tramo Inicial Valorado

Para cada línea calculable derivada desde `Cronograma Valorado`, el sistema debe considerar como unidad base operativa:

- `tramo_inicial_valorado`

Definición:

- representa el mandato económico-temporal inicial de un periodo visible del `Valorado`;
- nace del reparto diario y de su reagrupación por periodo visible;
- conserva su `percent`, `amount`, `starts_at`, `ends_at` y `period_id` de origen;
- debe existir antes de cualquier subdivisión manual del `Gantt`.

### 22.2 Siembra Inicial Obligatoria En Gantt

Cuando una línea del `Gantt` participe en el carril derivado desde `Valorado`, su representación inicial esperada no es una barra monolítica:

- debe nacer ya con los `tramos iniciales valorados` activos en esa línea.

Ejemplo:

- duración base: `180 días`
- visualización: `mensual`
- fecha de inicio de obra con corte parcial de mes
- resultado esperado: `6` o `7` tramos iniciales según el calendario real

Cada tramo inicial debe tomar:

- el porcentaje acumulado de sus días efectivos dentro del total homogéneo diario;
- el monto correspondiente a ese porcentaje;
- la ventana temporal del periodo visible real.

### 22.3 Regla De Subdivisión Interna

Un `tramo inicial valorado` puede dividirse en varios subtramos operativos.

Contrato:

- todos los hijos conservan referencia al mismo padre;
- la suma de `percent` de los hijos debe ser exactamente igual al `percent` del padre;
- la suma de `amount` de los hijos debe ser exactamente igual al `amount` del padre;
- la subdivisión no modifica por sí sola el `Cronograma Valorado`.

### 22.4 Regla De Reagrupación Dentro Del Mismo Padre

Si se fusionan subtramos que pertenecen al mismo `tramo inicial valorado`:

- la operación es una reagrupación interna;
- no se modifica el `Cronograma Valorado`;
- solo cambia la representación operativa del `Gantt`.

### 22.5 Regla De Fusión Entre Padres Distintos

Si el usuario intenta unir subtramos que pertenecen a distintos `tramos iniciales valorados`:

- el sistema debe detener la operación silenciosa;
- debe pedir confirmación explícita;
- debe explicar que la unión implica mover mandato económico-temporal entre periodos iniciales;
- si el usuario confirma, el sistema debe reajustar el `Cronograma Valorado`.

Reajuste mínimo esperado:

- restar el `%/monto` absorbido del tramo inicial de origen;
- sumarlo al tramo inicial de destino;
- persistir el nuevo mandato del `Valorado`;
- rehidratar el `Gantt` con el nuevo mapa de tramos iniciales.

### 22.6 Regla De Gobierno

Queda congelada esta jerarquía:

1. `Presupuesto/APU`
2. `Cronograma Valorado`
3. `Gantt operativo`

Pero con un matiz:

- dentro del `Gantt`, el nivel superior ya no es la subbarra arbitraria;
- es el `tramo inicial valorado` como unidad madre.

### 22.7 Implicación Sobre La Implementación Ya Cerrada

La implementación previa del frente `TASK-1070` se considera:

- útil como base técnica,
- válida en persistencia, lectura y edición local básica,
- pero funcionalmente incompleta respecto a este contrato corregido.

Por tanto, cualquier continuación deberá tratar el siguiente frente como una adecuación y no como una simple mejora cosmética.
