# Plan transversal - Politica de precios, borradores Gantt y modificaciones activas

## Contexto

GiProy Clasico permite editar APUs desde Presupuesto, realizar tanteos y ajustar
rendimientos operativos desde Gantt. La convivencia de estos flujos exige una
politica unica para evitar que un costo operativo temporal se presente como
precio oficial, o que un borrador pendiente contamine Presupuesto, APUs,
cronogramas o reportes.

## Objetivo

Implementar una politica universal de precios que garantice:

- una sola fuente funcional activa por proyecto/revision;
- separacion estricta entre precio oficial, tanteo y borrador Gantt;
- propagacion controlada solo tras confirmacion global;
- auditoria completa de intenciones y snapshots;
- eliminacion de ambiguedad en Gantt, Presupuesto, APUs y reportes.

## Principios

1. La fuente oficial es la modificacion activa; si no existe, Base Proyecto.
2. La modificacion activa es unica por empresa/proyecto/base/revision.
3. Todo precio debe declarar origen y estado.
4. Gantt puede simular, pero no propaga sin confirmacion global.
5. Presupuesto y Tanteos confirmados prevalecen sobre borradores Gantt
   relacionados.
6. Los reportes oficiales excluyen pendientes, pero advierten que existen.
7. Toda aplicacion global ejecuta preflight automatico.

## Estados de precio

- `base`: calculado desde Base Proyecto.
- `modificacion_activa`: snapshot oficial vigente para proyecto/revision.
- `tanteo`: escenario no confirmado.
- `borrador_gantt`: trabajo Gantt pendiente no propagado.
- `preview_editor`: cambio local no confirmado dentro del editor.
- `invalidado`: pendiente obsoleto por cambio oficial relacionado.

## Matriz de opciones cerradas

| Flujo | Persistencia inmediata | Propaga a otros modulos | Puede cancelarse | Observacion |
| --- | --- | --- | --- | --- |
| Preview del editor light Gantt | No | No | Si, al cerrar/cancelar | Solo vive en memoria del editor |
| Confirmar editor light Gantt | Si, como borrador backend | No | Si, como borrador | Permite retomar sesiones |
| Aplicar Gantt global | Si, como modificacion activa | Si | Solo con nueva modificacion auditada | Requiere preflight |
| Editar APU en Presupuesto | Si, en proyecto/revision | Si | Solo con nueva modificacion auditada | Invalida borradores relacionados |
| Tanteo abierto | Si, como escenario | No | Si | No entra en reportes |
| Tanteo aceptado | Si, como modificacion activa | Si | Solo con nueva modificacion auditada | Invalida pendientes relacionados |

## Reglas de propagacion

La propagacion oficial solo ocurre cuando se crea o actualiza la modificacion
activa del proyecto/revision. A partir de ese momento deben recalcularse:

- APUs funcionales del proyecto/revision;
- lineas de Presupuesto;
- cronograma Gantt oficial;
- cronograma valorado;
- cronograma de recursos;
- reportes y exportaciones oficiales;
- cache o snapshots derivados si existen.

Los borradores Gantt y tanteos pendientes no se propagan. Solo se muestran como
trabajo pendiente y quedan fuera de totales oficiales.

## Reglas de invalidacion parcial

Cuando Presupuesto, APUs o Tanteos aceptados cambian una fuente oficial, el
sistema debe localizar pendientes relacionados y marcarlos como invalidados.
La invalidacion es parcial: no se borra todo el borrador Gantt si solo una
parte queda obsoleta.

Una linea invalidada conserva:

- intencion operativa original;
- base snapshot anterior;
- motivo de invalidacion;
- referencia al cambio oficial que la invalido;
- estado `invalidado`.

No conserva como aplicables:

- precios derivados antiguos;
- rendimientos derivados antiguos incompatibles;
- trabajos recalculados desde snapshot viejo;
- totales operativos antiguos.

Antes de aplicar Gantt global, toda linea invalidada debe resolverse con una de
estas opciones:

- descartar;
- ajustar/regenerar contra la fuente funcional activa.

## Reglas de APUs anidados en Gantt

Gantt no debe tratar un APU anidado como recurso simple. Debe explotarlo,
fusionar sus recursos con pares del APU padre y calcular rendimiento efectivo
por trabajo relativo.

```text
trabajo_relativo = cantidad * rendimiento
rendimiento_efectivo = suma(trabajo_relativo) / suma(cantidad)
```

Para recursos provenientes de APUs anidados explotados:

- el trabajo relativo es el valor fijo de control;
- cambiar cantidad recalcula rendimiento;
- el rendimiento no se bloquea por UI solamente, sino por regla de dominio.

Para recursos directos sin anidados:

- cantidad y rendimiento pueden cambiar;
- el trabajo relativo se recalcula.

## Reglas de concurrencia

El Gantt permite lectura concurrente y edicion exclusiva.

- Lock de edicion por `proyecto + revision + cronograma`.
- El lock registra usuario, heartbeat, expiracion y auditoria.
- Otro usuario con permisos puede ver el Gantt en modo solo lectura.
- Si intenta editar, debe ver quien posee el lock.
- Puede solicitar liberacion mediante notificaciones.
- Al liberarse o expirar el lock, el solicitante debe ser notificado.
- Un lock expirado puede reclamarse con advertencia.
- Los cambios confirmados como borrador backend sobreviven a expiracion del
  lock; los cambios locales no confirmados se descartan.

## Resolucion de precio oficial

```text
resolver_precio_oficial(contexto):
    si existe modificacion_activa(contexto):
        return modificacion_activa
    return base_proyecto
```

Ningun modulo debe calcular una verdad paralela.

## Flujo Gantt

### Apertura

- Tomar lock exclusivo si el usuario entra en modo edicion.
- Cargar fuente funcional activa.
- Cargar borrador Gantt pendiente si existe.
- Marcar visualmente filas modificadas, invalidadas o limpias.

### Editor light

- Al abrir, crear `snapshot_inicial` y `draft_local`.
- Los inputs solo mutan `draft_local`.
- Cancelar o cerrar descarta `draft_local`.
- Confirmar editor light guarda intencion en borrador Gantt backend.

### Confirmacion global

- Ejecutar preflight automatico.
- Resolver invalidados antes de aplicar.
- Reproducir intenciones sobre base funcional activa.
- Crear modificacion activa con patch + snapshot recalculado.
- Recalcular Presupuesto, APUs, cronograma valorado, cronograma recursos y
  reportes.
- Marcar borrador como aplicado.

## Flujo Presupuesto

- Editar APU desde Presupuesto modifica el APU funcional activo del
  proyecto/revision.
- Debe crear intencion estructurada y snapshot oficial recalculado.
- Debe invalidar borradores Gantt y tanteos relacionados, no todo el borrador.
- Debe recalcular consumidores oficiales.

## Flujo Tanteos

- Tanteo abierto vive como escenario no oficial.
- Tanteo aceptado se convierte en modificacion activa.
- Tanteo aceptado invalida borradores Gantt relacionados.
- Si Gantt global se aplica primero, invalida tanteos relacionados pendientes.

## Invalidacion

Una invalidacion ocurre cuando un escenario pendiente queda basado en una fuente
oficial anterior.

Se invalida por dependencia real:

- misma linea de presupuesto;
- mismo APU funcional;
- recurso afectado;
- APU hijo explotado afectado;
- cantidad de partida afectada;
- porcentaje de indirectos aplicable.

Una invalidacion no se aplica automaticamente. El usuario debe:

- descartar;
- ajustar/regenerar desde la base activa.

## Ajuste o regeneracion

Solo se conserva la intencion operativa compatible:

- cantidad objetivo;
- rendimiento objetivo;
- cambio de recurso compatible;
- decision de trabajo fijo cuando aplique.

No se conservan:

- costos derivados antiguos;
- precios antiguos;
- duraciones derivadas antiguas;
- trabajos recalculados del snapshot viejo.

## Identidad de recursos

La identidad debe ser compuesta:

- origen operativo;
- `recurso_id`;
- codigo;
- unidad;
- categoria normalizada;
- `apu_origen_id`;
- `apu_hijo_id`;
- path de anidacion;
- clave de consolidacion si aplica.

Una fila consolidada en editor light se edita como consolidado completo.

## Locks de Gantt

- Lectura multiusuario permitida.
- Edicion exclusiva por lock.
- Lock con usuario, heartbeat y expiracion.
- Solicitud de liberacion mediante notificaciones.
- Borrador backend sobrevive a expiracion de lock.
- Inputs locales no confirmados no sobreviven.

## Estados de proyecto

- Planificacion: permite cambios.
- Aprobado/Contratado: requiere permiso superior o revision autorizada.
- Ejecucion: cambios controlados y auditados.
- Cerrado/Archivado: solo lectura.

Cambio de estado general cancela pendientes no aplicados con auditoria.

## Reportes

Los reportes oficiales:

- usan fuente funcional activa;
- excluyen borradores y tanteos pendientes;
- advierten si existen pendientes.

## Implementacion por fases

### Fase 1 - Contrato y auditoria

- Definir tipos de origen/estado de precio.
- Crear servicio/resolver de fuente funcional activa.
- Agregar auditoria de intencion + snapshot.
- Tests unitarios de resolucion.

### Fase 2 - Borrador Gantt backend

- Crear entidad de borrador Gantt.
- Persistir intenciones por linea/APU/recurso.
- Crear estados pendiente, invalidado, aplicado, cancelado.
- Exponer API de guardar, listar, revertir y resolver.

### Fase 3 - Locks Gantt

- Lock exclusivo por proyecto/revision/cronograma.
- Heartbeat.
- Solicitud de liberacion con notificaciones.
- Modo solo lectura si lock pertenece a otro usuario.

### Fase 4 - Gantt UI

- Separar preview local, borrador pendiente y precio oficial.
- Marcar filas modificadas/invalidadas.
- Resolver invalidados antes de aplicar globalmente.
- Evitar que "Precio en presupuesto" lea preview operativo.

### Fase 5 - Presupuesto y Tanteos

- Ediciones confirmadas escriben intencion + snapshot.
- Tanteos aceptados siguen misma politica.
- Invalidacion parcial de borradores Gantt relacionados.

### Fase 6 - Reportes y exportaciones

- Consumir solo fuente funcional activa.
- Mostrar advertencia de pendientes.
- No incluir pendientes en calculos oficiales.

### Fase 7 - Saneamiento universal

- Auditar datos existentes.
- Clasificar inconsistencias.
- Recalcular solo casos deterministas.
- Marcar casos manuales.
- Conservar trazabilidad.

## Criterios de cierre

- Presupuesto, APUs y Gantt muestran el mismo precio oficial tras aplicar una
  modificacion.
- Borradores Gantt no contaminan Presupuesto antes de confirmacion global.
- Cancelar editor light descarta draft local.
- Confirmar editor light persiste borrador backend.
- Confirmar global propaga al sistema tras preflight.
- Cambios oficiales de Presupuesto invalidan solo borradores relacionados.
- Reportes oficiales excluyen pendientes y advierten su existencia.
- Cambio de estado general cancela pendientes con auditoria.
- Smoke anti-BIM en verde.
- Baseline enterprise con frontend en verde.

## Fuera de alcance inicial

- Cambios BIM.
- Docker/Coolify/CI/CD/staging/produccion.
- Migraciones destructivas.
- Edicion por origen individual dentro de filas consolidadas del editor light.
