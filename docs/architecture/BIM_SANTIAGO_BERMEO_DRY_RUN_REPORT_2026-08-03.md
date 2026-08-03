# Informe de dry-run BIM coordinado

Fecha: 2026-08-03  
Proyecto canónico: `#SantiagoBermeo-2026-001`  
Empresa: `Santiago Bermeo`  
Modo: solo lectura, sin escrituras

## 1. Resultado ejecutivo

El inventario confirma que el proyecto puede adecuarse al contrato coordinado
Presupuesto <-> Gantt <-> BIM sin inferir enlaces ni clasificaciones. El proyecto
tiene una única revisión de origen, un presupuesto, un cronograma asociado y una
versión BIM activa. La base de datos consultada todavía no contiene las tablas
nuevas del núcleo coordinado; por tanto, no se ha intentado aplicar datos.

**Escrituras realizadas: 0.** Las migraciones y la adecuación real permanecen
bloqueadas hasta que este informe sea revisado y exista autorización expresa.

## 2. Inventario conciliado

| Dominio | Evidencia encontrada |
| --- | --- |
| Proyecto | id `7`, código raíz `SantiagoBermeo-2026-001`, revisión `0` |
| Empresa | id `3`, `Santiago Bermeo`, OmniClass actualmente desactivado |
| Presupuesto 5D | id `13`, revisión `0`, `Presupuesto Base (Rev 0)`, `En Elaboración`, total `130089.96` |
| Partidas | `201` líneas; `0` con código OmniClass actual |
| Planificación 4D | cronograma id `1`, vinculado al presupuesto `13`, `187` tareas y configuración presente |
| BIM | modelo id `1`, disciplina arquitectura, activo |
| Versión BIM | id `1`, `Demostración IFC2X3 · Rev 0`, estado `ready`, activa |
| Asignaciones | `0` asignaciones explícitas de proyecto |

## 3. Estado de esquema

El historial Alembic genera correctamente SQL PostgreSQL transaccional en ambos
sentidos para el tramo `de2057a1b2c3` -> `de2059a1b2c3`, pero no se ha ejecutado
contra la base real. El preflight detectó como pendientes:

- `project_capability_grants`
- `project_coordination_sets`
- `coordination_links`
- `coordination_proposals`
- `coordination_conflicts`
- `bim_classification_resolutions`
- `coordination_import_stages`

## 4. Transformación propuesta, no ejecutada

1. Habilitar OmniClass para la empresa `3`, manteniendo las clasificaciones de
   origen y mostrando la advertencia contractual correspondiente.
2. Crear un conjunto de coordinación para proyecto `7` que fije presupuesto
   `13` revisión `0`, cronograma `1` y versión BIM `1`.
3. Crear capacidades y asignaciones explícitas conforme a la matriz aprobada;
   la ausencia actual de asignaciones no autoriza privilegios implícitos.
4. Mantener las `201` partidas como no clasificadas hasta que exista resolución
   revisada. No se crearán enlaces automáticos por coincidencia de texto.
5. Registrar cada transformación mediante la envolvente común de auditoría y un
   identificador de correlación único.

## 5. Gates del dry-run

| Gate | Resultado |
| --- | --- |
| Referencia con o sin `#` normalizada | aprobado |
| Única revisión de proyecto de origen | aprobado |
| Único presupuesto identificable | aprobado |
| Único cronograma identificable | aprobado |
| Versión BIM activa | aprobado |
| Prohibición de enlaces automáticos sin evidencia | aprobado |
| Esquema coordinado instalado | pendiente |
| Segundo dry-run idempotente | aprobado: misma huella y cero escrituras |
| Mecanismo backup/restore sobre copia aislada | aprobado en 2 pruebas focales |
| Backup real inmediatamente anterior a S18 | aprobado: dump PostgreSQL 18 verificado |
| Autorización para datos reales | aprobada por el usuario para migración completa |

## 6. Rollback previsto

Antes de cualquier escritura se requiere backup verificable. La migración de
esquema es aditiva y su SQL de downgrade fue generado correctamente. La carga de
datos debe ejecutarse como operación correlacionada e idempotente; si falla un
gate, el conjunto no se convierte en referencia oficial y los datos clásicos
permanecen operativos con BIM al margen.

## 7. Progreso previo a la aplicación

El segundo dry-run, ejecutado tras añadir el staging coordinado, reprodujo los
mismos conteos y referencias, detectó las siete tablas pendientes y volvió a
informar `writes_performed: 0`. La repetición de seguridad posterior generó en
ambas ejecuciones la huella
`dc01afe017d76cd1287bbfa9684df21bd4cc698766aa01aa09b97ec723ccaa41`
y la clave de idempotencia
`bim-coordinated-v1:7:dc01afe017d76cd1287bbfa9684df21bd4cc698766aa01aa09b97ec723ccaa41`.
El manifiesto fija siete migraciones por nombre, tamaño y SHA-256, incluida la
persistencia de decisiones de reconciliación BIM. Se creó un dump completo
previo, SHA-256
`b87527cf5695fa20ab6b74bd7523f56394cefd9e70509cc0fe846715b7c04766`, y se
restauró en una base aislada. Los conteos coincidieron y la base temporal se
eliminó después de la verificación.

Slice/TASK: S17 - Migración aditiva y dry-run  
Avance parcial del slice: **100%**  
Peso del slice en el programa: **4%**  
Aporte acumulado del slice: **4,00%**  
Avance de la fase E: **26,67%**  
Avance total del programa coordinado: **89,00%**  
Estado de gates: inventario, SQL offline, manifiesto e idempotencia del dry-run
aprobados; backup/restore real verificado en copia aislada. La aplicación S18
permanece pendiente.

## 8. Informe posterior a la migración autorizada

La autorización expresa fue recibida y la escritura real se realizó únicamente
después de verificar la restauración del dump PostgreSQL. El esquema quedó en
`de2064a1b2c3`. Antes de aplicar sobre la base real, el mismo proceso se ejecutó
dos veces sobre una restauración aislada; la base temporal fue eliminada al
terminar.

| Resultado real | Valor verificado |
| --- | ---: |
| OmniClass del tenant | activo |
| Snapshots 4D | 187 |
| Baselines | 1 (`SB-2026-R0`) |
| Federación activa | 1 |
| Versiones factuales federadas | 1 (arquitectura, versión `1`) |
| Conjuntos de coordinación activos | 1 |
| Grants `administrador_bim` | 2 |
| Conflictos controlados abiertos | 4 |
| Enlaces automáticos | 0 |

Las dos ejecuciones reales devolvieron la misma huella de resultado:
`a8b06602fa9439e3f0696856ba2a7837f4deec2c66d3bb61acecd838d4b06b92`.
La segunda ejecución no duplicó snapshots, baseline, federación, conjunto,
grants ni conflictos. Cada invocación sí conserva un evento de auditoría propio,
como evidencia de operación.

La aceptación de “federación multidisciplinar” se resuelve sin fabricar datos:
el proyecto solo dispone hoy de arquitectura. La federación contiene esa única
versión real y el conflicto `missing_bim_disciplines` mantiene visible la brecha
hasta incorporar modelos revisados de otras disciplinas. De igual forma,
`unclassified_budget_lines`, `missing_functional_role_assignments` y
`unlinked_coordination_entities` impiden interpretar ausencia de evidencia como
coordinación aprobada.

Slice/TASK: S18 - Adecuación de SantiagoBermeo-2026-001  
Avance parcial del slice: **100%**  
Peso del slice en el programa: **4%**  
Aporte acumulado del slice: **4,00%**  
Avance de la fase E: **53,33%**  
Avance total del programa coordinado: **93,00%**  
Estado de gates: migración real, ensayo aislado, idempotencia funcional,
auditoría y conflictos explícitos aprobados; certificación S19 y piloto S20
permanecen pendientes.
