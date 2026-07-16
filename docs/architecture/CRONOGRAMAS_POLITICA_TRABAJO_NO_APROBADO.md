# Politica de cronogramas: trabajo no aprobado y fuente unica

## Principio rector

GiProy Clasico opera con una sola fuente de verdad por ambito.

- Cronogramas puede trabajar con datos no aprobados para proyecto.
- El resto del sistema consume solo datos determinados.

El trabajo no aprobado es una hipotesis operativa persistida dentro del ambito Cronogramas. No es oficial hasta aplicar al proyecto.

## Ambitos

### Ambito Cronogramas

Incluye:

- Gantt.
- Reportes de Gantt.
- Cronogramas valorados.
- Recursos del proyecto asociados al cronograma.

Estas vistas pueden calcular y mostrar trabajo no aprobado.

### Ambito Proyecto determinado

Incluye:

- Presupuestos.
- APUs.
- Analisis de Precios Unitarios.
- Base funcional proyecto/revision.
- Recursos oficiales.
- Reportes oficiales.
- Exportaciones.

Estas vistas no consumen trabajo no aprobado. Solo pueden informar que existe.

## Origenes de trabajo no aprobado

### `gantt`

Flujo completo:

`Gantt <-> Cronogramas valorados -> Recursos`

Puede incluir dependencias, ruta critica, duraciones, recursos y valorados.

### `valorados`

Flujo simple:

`Cronogramas valorados -> Recursos`

No tiene ruta critica ni dependencias Gantt. Recursos se calcula desde la periodificacion de Valorados.

## Conversion de flujo

`valorados -> gantt` requiere accion explicita y preflight.

El preflight debe:

- conservar trabajo simple ya realizado;
- preparar estructura Gantt inicial;
- bloquear conversion si no puede generar una estructura coherente;
- mantener intacto el trabajo no aprobado de Valorados si falla.

## Trabajo no aprobado

Debe mostrarse con una UI sutil:

`Trabajo no aprobado para proyecto`

Solo aparece si existen cambios pendientes.

Debe abrir un panel desplegable comun con:

- origen del trabajo: Gantt o Valorados;
- resumen operativo;
- ver detalle contextual;
- aplicar al proyecto;
- descartar trabajo.

## Aplicacion al proyecto

Aplicar al proyecto es transaccional:

1. Preflight.
2. Conversion de intenciones a modificaciones oficiales.
3. Recalculo de APUs directos y derivados.
4. Recalculo de cronograma/valorados/recursos oficiales.
5. Invalidacion de trabajos relacionados.
6. Auditoria.
7. Cierre del trabajo no aprobado.

Si falla, no debe mutar estado oficial y debe conservar el trabajo no aprobado.

## Ultima actualizacion determinante

Cualquier cambio determinado en proyecto/revision prevalece sobre trabajo no aprobado relacionado.

Si afecta a un editor light abierto:

- el editor se recarga desde la fuente vigente;
- descarta cambios locales no aceptados;
- muestra aviso inline ligero;
- registra evento tecnico, no modificacion funcional.

Si afecta a trabajo no aprobado ya aceptado:

- se invalidan solo las lineas/APUs relacionados;
- el preflight exige resolver antes de aplicar al proyecto.

## APUs anidados y trazabilidad

Cuando un recurso aparece en APU padre y APU hijo:

- la vista consolidada muestra un unico recurso;
- la edicion debe conservar desglose por origen;
- al determinar, los cambios se aplican globalmente al APU correspondiente;
- si se modifica una fila de hijo desde el editor del padre, funcionalmente es modificacion del hijo con auditoria contextual.

## Trabajo fijo y trabajo variable

### Trabajo fijo

- Cantidad editable.
- Trabajo por origen conservado.
- Rendimiento recalculado.
- Costo conservado salvo cambios indirectos validos.

### Trabajo variable

- Cantidad editable.
- Rendimiento editable.
- Trabajo recalculado.
- Costo puede cambiar.

Si cambia costo al aceptar editor light, debe haber confirmacion con antes/despues.

## Requisitos de calidad

- Ningun modulo debe implementar calculos divergentes.
- Backend es autoridad final.
- Frontend no determina valores oficiales.
- Tests de paridad transversal obligatorios.
- Preflight debe bloquear discrepancias reales.
- Auditoria obligatoria para cambios funcionales.
