# Problema tecnico de APUs anidados en tiempo y recursos

Fecha: 2026-06-23

Modo: GIPROY CLASICO

## Objetivo del documento

Formalizar el problema detectado al usar APUs anidados dentro de APUs padre
cuando el sistema necesita calcular duracion, recursos por periodo, histogramas,
flujo de caja o cronogramas derivados.

Este documento no autoriza cambios de backend, frontend, API, base de datos ni
contratos funcionales. Su alcance es diagnostico y sirve como base para una
TASK futura de diseno funcional o implementacion controlada.

## Fuentes revisadas

- `docs/anidados-tiempo/conversacion-1`
- `docs/anidados-tiempo/conversacion-2`
- `docs/anidados-tiempo/Analisis para Project - Nueva Version 2026.xlsx`
- `docs/anidados-tiempo/gao-20-195g.pdf` queda identificado como referencia de
  buenas practicas pendiente de lectura especifica si se abre una TASK normativa
  posterior.

## Caso base observado

El ejemplo central del Excel trabaja con:

- APU padre: `Mamposteria de bloque e=15cm`, unidad `m2`.
- APU hijo anidado: `Mortero de cemento 1:3`, unidad `m3`.
- Cantidad del hijo dentro del padre: `0.02 m3/m2`.

En la hoja `4(APU)`, el mortero entra en el padre como material:

- precio directo del mortero en el padre: `2.22`;
- duracion del padre: `0.60 horas/m2`;
- costo directo del padre: `14.28`;
- costo total del padre: `15.99`.

En la hoja `4(APU anidado)`, el mortero existe como APU independiente:

- duracion propia del mortero: `0.90 horas/m3`;
- costo directo del mortero: `110.95`;
- trabajo total de mano de obra del mortero: `2.97 horas` por `m3`;
- herramientas: `1.80 horas` por `m3`.

En la hoja `4(APU anidado con cantidad)`, el mortero escalado por `0.02`
muestra:

- duracion escalada: `0.018 horas/m2`;
- costo directo escalado: `2.22`;
- trabajo de mano de obra escalado: `0.0594 horas/m2`;
- herramientas escaladas: `0.036 horas/m2`.

En la hoja `4(APU unificado)`, al intentar explotar/unificar el hijo dentro del
padre, el resultado deja de ser equivalente:

- duracion del APU unificado: `0.3089 horas/m2`;
- costo directo del APU unificado: `21.9724`;
- costo total del APU unificado: `24.6124`;
- trabajo de mano de obra: `3.24 horas/m2`.

La evidencia muestra que el APU anidado y el APU explotado no son
representaciones matematicamente equivalentes.

## Problema central

El APU anidado introduce una contradiccion estructural entre tres modelos que
GiProy necesita mantener coherentes:

1. modelo de costo;
2. modelo de duracion;
3. modelo de recursos por periodo.

Cuando el APU hijo se incorpora al padre como un material o partida compuesta,
su costo puede conservarse como precio directo, pero su mano de obra, equipos,
herramientas, rendimiento y trabajo quedan ocultos para los calculos operativos
del padre.

Cuando el sistema intenta recuperar esos recursos mediante explosion del hijo,
aparece otro problema: al insertar nuevamente cuadrillas, rendimientos y trabajo
del hijo dentro del padre, el costo y la duracion dejan de coincidir con el APU
contractual original.

Por tanto, el problema no es solo de formula. Es una incompatibilidad entre la
forma tradicional de presupuestar con anidados y la necesidad moderna de generar
cronogramas, histogramas y curvas confiables desde recursos reales.

## Por que la duracion queda comprometida

El calculo actual del padre toma la duracion desde los recursos directos visibles
del APU padre. En el ejemplo:

- el padre ve herramientas, peon, albanil y maestro propios;
- el padre no ve el trabajo interno del mortero porque el mortero entro como
  material;
- la duracion queda en `0.60 horas/m2`.

Sin embargo, el mortero anidado contiene trabajo propio:

- `0.018 horas/m2` de duracion escalada;
- `0.0594 horas/m2` de trabajo de mano de obra escalado;
- `0.036 horas/m2` de herramientas escaladas.

En este caso puntual, la duracion escalada del hijo es pequena frente al padre.
Pero la regla implicita es peligrosa: el sistema no sabe si el hijo opera en
paralelo, en serie, con la misma cuadrilla, con otra cuadrilla o como proceso
externo/subcontratado.

Sin una decision explicita, cualquier duracion calculada puede ser una inferencia
no verificable.

## Por que el costo queda comprometido al explotar

La explosion del APU hijo no es una simple transformacion algebraica.

En el modelo anidado, el mortero entra al padre por un precio directo escalado:

- `0.02 * 110.95 = 2.22`.

En el modelo unificado, los recursos internos del mortero se mezclan con los
recursos del padre:

- herramientas pasan de `1` a `3`;
- peon pasa de `1` a `3`;
- albanil pasa de `1` a `2`;
- maestro pasa de `1` a `2`;
- el costo directo sube de `14.28` a `21.9724`.

Esto demuestra que "desanidar" no conserva el costo del APU original. La
explosion cambia el modelo productivo, no solo la presentacion.

## Por que los recursos por periodo quedan comprometidos

El motor de recursos por periodo depende de:

- cantidad de obra;
- rendimiento/duracion de la actividad;
- recursos visibles del APU;
- periodo asignado desde la duracion del padre.

Si el padre contiene APUs anidados y el sistema solo toma recursos directos del
padre, se produce:

- subconteo de horas-hombre;
- subconteo de equipos y herramientas;
- histogramas incompletos;
- curva S y flujo de caja derivados sobre una base parcial;
- periodizacion potencialmente errada, porque la ventana nace de una duracion
  que no incluye la realidad del hijo.

Si el sistema intenta sumar recursos del hijo, debe decidir donde ocurren esos
recursos en el tiempo. Esa ubicacion no puede deducirse solo del costo:

- pueden ocurrir dentro del mismo periodo del padre;
- pueden ocurrir antes;
- pueden ocurrir despues;
- pueden tener traslapes;
- pueden pertenecer a la misma cuadrilla o a una cuadrilla distinta.

En el ejemplo conversado, el mortero y la mamposteria pueden ser hechos por la
misma cuadrilla, pero son dos actividades diferentes. Ese caso no tiene una
solucion matematica limpia si se quiere conservar simultaneamente costo,
duracion, alcance y recursos reales.

## Riesgo legal y contractual

El APU puede convertirse en parte de una licitacion, contrato, presupuesto
oficial o cronograma contractual. Por eso, el software no debe alterar
silenciosamente:

- costo;
- duracion;
- cuadrilla;
- cantidad;
- rendimiento;
- alcance.

Una correccion automatica puede cambiar la triple restriccion del proyecto y
crear responsabilidad tecnica o legal si el resultado se usa para contratar,
programar o reclamar.

El problema debe tratarse como una condicion tecnica visible y auditable, no
como un detalle interno de calculo.

## Formulacion precisa del problema

Un APU padre con APUs hijos anidados contiene informacion suficiente para
presupuesto de costo directo, pero informacion ambigua o contradictoria para
planificacion temporal y recursos por periodo.

El anidado permite que el costo del hijo viaje como precio compuesto, pero no
declara de forma contractual ni operacional:

- si el hijo es actividad independiente o insumo compuesto;
- si se ejecuta en serie o paralelo con el padre;
- si usa la misma cuadrilla o una cuadrilla distinta;
- si sus recursos deben entrar al histograma;
- en que periodo deben ubicarse esos recursos;
- si su rendimiento propio debe mantenerse, ignorarse o reinterpretarse frente
  al rendimiento del padre.

Sin esos datos, el sistema no puede calcular una duracion total ni una demanda
de recursos por periodo que sea simultaneamente fiel al costo, al tiempo y al
alcance.

## Conclusiones

1. Los APUs anidados son compatibles con presupuestos tradicionales, pero no son
   directamente compatibles con cronogramas y recursos por periodo sin reglas
   adicionales.
2. El APU anidado y el APU explotado no son equivalentes; la explosion puede
   cambiar costo, duracion y cuadrilla.
3. Calcular solo con recursos directos del padre subestima recursos y puede
   omitir trabajo real contenido en hijos.
4. Sumar recursos del hijo sin contexto puede duplicar o distorsionar trabajo,
   rendimiento y costo.
5. El problema no debe resolverse mediante correcciones silenciosas.
6. Cualquier solucion futura debe obligar a declarar la naturaleza operacional
   del anidado y mantener trazabilidad de responsabilidad del ingeniero.

## Recomendacion documental para una TASK futura

Abrir una TASK separada, no implementativa al inicio, para definir una politica
funcional de APUs anidados en GiProy Clasico. Esa politica deberia decidir:

- si GiProy permite anidados solo como costo compuesto;
- si bloquea calculos automaticos de duracion/recursos cuando existan anidados
  sin clasificacion operacional;
- que advertencias deben mostrarse;
- que reporte tecnico debe emitir el sistema;
- que validacion o aceptacion explicita debe registrar el usuario;
- si habra una vista analitica de explosion sin reemplazar el APU contractual;
- como se documenta la responsabilidad tecnica del ingeniero que mantiene el
  anidado.

Hasta que esa politica exista, la posicion conservadora es no usar APUs anidados
como fuente automatica confiable para duracion, recursos por periodo,
histogramas, flujo de caja ni cronogramas contractuales.

## Plan funcional inferido

La resolucion funcional propuesta para una TASK futura es crear una base de
modificaciones por revision que se sobrepone a la base de proyecto global sin
alterarla.

La regla de autoridad queda:

```text
Base de proyecto global
  = fuente estable del proyecto.

Base de modificaciones
  = capa funcional superior por base_trabajo + proyecto + revision + APU origen.

Resolver APU operativo:
  si existe modificacion confirmada y activa para la revision:
      usar snapshot operativo de la modificacion
  si no:
      usar APU de la base de proyecto global
```

La modificacion nace desde el editor ligero de recursos del Gantt, pero su
alcance no es local a una barra. Si el usuario confirma, la modificacion aplica
globalmente a todos los usos de ese APU dentro de la revision activa.

La confirmacion debe ser explicita y no puede presentarse como un guardado
simple. La accion debe comunicar alcance global, por ejemplo:

```text
Aplicar modificacion del APU a toda la revision
```

Antes de confirmar debe mostrarse un preview de impacto con:

- APU afectado;
- revision activa;
- lineas de presupuesto afectadas;
- actividades Gantt afectadas;
- impacto en duracion;
- impacto en costo;
- impacto en recursos;
- impacto en Cronograma Valorado, Recursos, Flujo de Caja y reportes;
- advertencia de que la base global no se modifica.

## Estados de la base de modificaciones

La base de modificaciones debe manejar estados. Solo una modificacion
`confirmada` y `activa` manda sobre la base de proyecto.

```text
borrador
pendiente_confirmacion
confirmada
reemplazada
revertida
anulada
```

Reglas:

- Puede existir historial versionado.
- Solo una modificacion activa manda por `base_trabajo + proyecto + revision +
  APU origen`.
- Confirmar una nueva version desactiva/reemplaza la version activa anterior.
- Revertir puede volver a una version confirmada anterior o a la base de
  proyecto global.

## Snapshot ejecutable y delta auditable

Cada modificacion debe guardar dos vistas complementarias:

```text
apu_operativo_snapshot
  = APU funcional plano, listo para que lo consuman Gantt, Valorado, Recursos,
    Flujo y reportes.

delta_respecto_base
  = explicacion auditable de lo que cambio frente a la base de proyecto global.
```

No conviene guardar solo deltas porque cada pantalla tendria que reconstruir el
APU y un cambio posterior en la base global podria alterar resultados
historicos. Tampoco conviene guardar solo el snapshot porque se perderia la
explicacion tecnica del cambio.

## Transformacion de APUs anidados

Cuando el APU tiene anidados y se trabaja desde Cronogramas/Gantt:

1. El sistema toma el APU padre y sus APUs anidados como origen.
2. Explota recursivamente los recursos de los APUs anidados.
3. Fusiona los recursos anidados con sus pares del APU padre.
4. Calcula trabajo relativo por recurso.
5. Calcula rendimiento equivalente.
6. Genera un APU funcional plano para Cronogramas.

Formula base:

```text
trabajo_relativo = cantidad_recurso * rendimiento_recurso

cantidad_consolidada = suma(cantidades equivalentes padre + anidados)

trabajo_relativo_total = suma(trabajo_relativo padre + anidados)

rendimiento_equivalente = trabajo_relativo_total / cantidad_consolidada
```

En la capa de Cronogramas, los APUs anidados dejan de operar como anidados. Se
convierten en recursos funcionales consolidados del APU padre. La trazabilidad
del origen se conserva en el delta auditable, no en la lectura operativa diaria.

## Reglas del editor ligero de Gantt

El editor ligero de recursos del Gantt es la superficie donde el usuario inicia
la modificacion.

Reglas:

- No cambia la cantidad de obra del presupuesto.
- La cantidad editable es cantidad de recurso dentro del APU.
- Si el APU no tiene anidados, puede permitir editar cantidad de recurso y
  rendimiento segun la logica vigente.
- Si el APU tiene anidados, debe explotar y consolidar recursos.
- En APUs con anidados, el rendimiento manual queda bloqueado porque pasa a ser
  rendimiento equivalente calculado.
- Al confirmar, el resultado se guarda en la base de modificaciones de la
  revision y se propaga globalmente para ese APU en la revision activa.

## Consolidacion segura de recursos

La fusion de recursos no debe hacerse solo por nombre visible. La clave de
consolidacion debe ser fuerte:

```text
recurso_id + categoria + unidad + precio_base
```

Si dos recursos parecen pares pero tienen distinta unidad, categoria o precio,
el sistema no debe fusionarlos silenciosamente. Debe registrar conflicto o
mantenerlos separados hasta que exista una decision explicita.

## Indicador visual discreto

Gantt y las secciones de Cronogramas deben mostrar un indicador discreto cuando
el APU operativo proviene de una modificacion confirmada o de una explosion de
anidados.

Objetivo del indicador:

- advertir sin saturar la interfaz;
- diferenciar APUs base de APUs operativos modificados;
- mostrar si los recursos anidados fueron explotados;
- permitir inspeccionar el delta/auditoria cuando haga falta.

Estados sugeridos:

```text
Base
  APU sin modificacion activa.

Modificado
  APU resuelto desde base de modificaciones confirmada.

Anidados explotados
  APU con anidados convertido a recursos funcionales consolidados.

Conflicto
  Explosion/consolidacion requiere revision por unidad, precio, categoria o
  recurso no equivalente.
```

Visualmente debe ser un chip o icono tecnico pequeno junto al nombre del APU o
en el editor ligero, no una alerta dominante. El detalle debe abrirse bajo
demanda y mostrar origen, transformacion y resultado operativo.

## Indicador de explosion por APU y recurso

La mejora visual del plan es separar dos lecturas:

- estado del APU en la fila o actividad;
- origen de cada recurso funcional dentro del editor ligero.

El indicador del APU debe responder rapidamente si el usuario esta viendo:

```text
Base sin anidados
  APU consumido desde la base de proyecto, sin anidados detectados.

Base con anidados no explotados
  APU contiene hijos, pero todavia no existe snapshot operativo confirmado para
  esa revision.

Anidados explotados
  APU con hijos convertido a recursos funcionales consolidados para Cronogramas.

Modificacion activa
  APU resuelto desde la base de modificaciones confirmada de la revision.

Conflicto de explosion
  La consolidacion encontro unidades, precios, categorias o recursos no
  equivalentes y requiere revision explicita.
```

Dentro del editor ligero, cada recurso funcional tambien debe tener un origen
discreto:

```text
Directo
  Recurso proveniente del APU padre.

Anidado
  Recurso proveniente solo de APUs hijos explotados.

Consolidado
  Recurso que suma aportes del APU padre y de APUs hijos.

No fusionado
  Recurso parecido a otro, pero separado por diferencia de unidad, categoria,
  precio base o identificador.
```

Este indicador no debe bloquear la operacion por si mismo. Su funcion es
hacer visible si el sistema esta usando la base original, una modificacion
global de revision o una explosion funcional. El bloqueo operativo solo aplica
cuando el estado es `Conflicto de explosion` o cuando el APU con anidados intenta
editar manualmente un rendimiento que ahora debe ser calculado por trabajo
relativo.

El detalle bajo demanda debe mostrar:

- APU origen;
- revision activa;
- si existe modificacion activa;
- recursos directos del padre;
- recursos aportados por anidados;
- recursos consolidados;
- formula aplicada al rendimiento equivalente;
- advertencia de alcance global cuando se confirme desde el editor ligero.

## Propagacion funcional

Una modificacion confirmada debe propagarse de forma consistente a todas las
secciones dependientes de Cronogramas y presupuesto de la revision activa:

- Gantt / Cronograma de Trabajo;
- Cronograma Valorado;
- Cronograma Recursos;
- Flujo de Caja;
- reportes e histogramas;
- snapshots de confirmacion y rollback.

La propagacion debe consumir un resolvedor unico de APU operativo por revision,
evitando que cada modulo implemente su propia regla de fallback.

```text
resolver_apu_operativo(base_trabajo, proyecto, revision, apu_origen)
```

Ese resolvedor debe ser la frontera conceptual entre la base global y la base de
modificaciones.

## No interferencia BIM

Este documento pertenece al carril de GiProy Clasico. No activa UX BIM, no crea
dependencias BIM, no modifica componentes BIM y no cambia la estrategia de
implementacion paralela.

## Impacto sobre TASK-1807

No reabre el baseline local clasico cerrado en `TASK-1807`, no elimina guardas
del refactor seguro y no cambia contratos API ni runtime.
