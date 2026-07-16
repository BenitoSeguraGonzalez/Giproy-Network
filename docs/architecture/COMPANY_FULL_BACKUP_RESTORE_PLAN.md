# Plan enterprise - Backup y restauracion completa 1:1 de empresa

Fecha: 2026-06-20
Modo: GiProy Clasico
TASK de control: TASK-1959
Estado: Plan completo documentado, restauracion destructiva desde archivo implementada

## Resumen

GiProy debe incorporar una funcionalidad enterprise de backup y restauracion
completa 1:1 de empresa. La copia debe funcionar como un time-backup
controlado: permite entregar un documento de respaldo cifrado de una empresa y,
si es necesario, restaurar esa misma empresa al estado exacto de la copia.

La restauracion es destructiva: borra los datos actuales restaurables de la
empresa y los reemplaza por el contenido de la copia. Por ese motivo debe estar
protegida por preflight, copia automatica previa, auditoria persistente y triple
confirmacion.

## Principios

- GiProy es un ERP vivo; la funcionalidad se implementa de forma incremental.
- El alcance pertenece a GiProy Clasico.
- BIM no debe activarse, mostrarse ni contaminarse.
- El backend sigue siendo unico y comun.
- No se tocan Docker, Coolify, CI/CD, staging ni produccion.
- No se rompen rutinas existentes de importacion/exportacion ni Transferencias.
- La copia 1:1 no puede tener referencias rotas.
- Restaurar siempre es una accion destructiva y auditada.
- Ningun borrado destructivo procede sin copia automatica previa verificada.

## Alcance completo de backup

La copia debe incluir todos los datos y archivos necesarios para reconstruir la
empresa de forma funcional y coherente:

- Datos principales de empresa restaurables.
- Configuracion funcional asociada a la empresa.
- Proyectos.
- Bases de trabajo.
- Presupuestos.
- EDT.
- Cronogramas.
- APUs.
- Recursos.
- Unidades.
- Subcategorias.
- Indirectos y detalles economicos vinculados.
- Datos activos.
- Datos en papelera o borrado logico.
- Documentacion.
- Adjuntos.
- Logos.
- Archivos fisicos referenciados por cualquier entidad incluida.
- Modulo Otros > Comunidad.
- Datos propios de Marketplace bajo la politica especial definida.
- Metadatos de auditoria necesarios para verificar y explicar la copia.

## Exclusion y tratamiento especial de Marketplace

Marketplace no se restaura como si fuera un dominio aislado simple porque puede
contener compras/licencias y relaciones globales.

Reglas:

- Las compras/licencias de la empresa se conservan en su totalidad.
- No se borran compras existentes por restaurar una empresa.
- Los articulos propios de la empresa incluidos en la copia se restauran al
  estado de la copia.
- Los articulos propios actuales de la empresa que no existan en la copia no se
  borran fisicamente.
- Esos articulos se cancelan/despublican, dejan de estar accesibles para el
  usuario/empresa y quedan conservados solo para auditoria superadmin.
- El preflight debe avisar cuantos articulos propios quedaran cancelados o
  despublicados por no estar en la copia.

## Papelera y borrado logico

La copia debe incluir datos activos y datos en papelera.

Restaurar 1:1 significa:

- Lo que estaba activo en la copia vuelve activo.
- Lo que estaba en papelera en la copia vuelve a papelera.
- Fechas y metadatos de borrado logico deben conservarse cuando existan.
- No se deben reactivar accidentalmente elementos eliminados logicamente.

## Archivos y binarios

El backup completo incluye binarios fisicos. No basta con guardar referencias.

Cada archivo incluido debe registrar:

- Identificador logico.
- Entidad propietaria.
- Ruta logica original.
- Ruta restaurable.
- Tamano.
- Hash.
- Tipo de archivo si esta disponible.

Reglas:

- Si una entidad referencia un archivo, el archivo debe existir.
- Si falta un archivo referenciado, se bloquea la generacion.
- Si el `.giproybackup` no contiene un archivo declarado, se bloquea la
  restauracion.
- Si el hash no coincide, se bloquea la restauracion.
- Una copia 1:1 incompleta no es aceptable.

## Formato propuesto

Archivo propio:

- Extension propuesta: `.giproybackup`.
- Contenido comprimido.
- Contenido cifrado.
- Solo usable por GiProy.

Estructura conceptual:

- `manifest.json`: version, empresa, usuario, fecha, alcance, hashes y conteos.
- `data/`: particiones JSON por dominio.
- `files/`: binarios incluidos.
- `indexes/`: mapas de ids, rutas, hashes y dependencias.
- `signatures/`: hash global y metadatos de integridad.

Campos clave del manifest:

- `format_version`.
- `scope: company-full-1to1`.
- `created_at`.
- `created_by_user_id`.
- `created_by_user_email`.
- `company_identity`.
- `includes_deleted_items: true`.
- `includes_files: true`.
- `includes_community: true`.
- `marketplace_policy`.
- `counts`.
- `file_count`.
- `total_file_size`.
- `payload_hash`.
- `backup_hash`.

## Identidad de empresa

La restauracion solo se permite sobre la misma empresa.

La identidad debe comprobar como minimo:

- `empresa_id` de origen/destino cuando aplique.
- Identificador fiscal o estable si existe.
- Nombre normalizado como dato auxiliar.
- Hash/fingerprint de identidad de empresa incluido en manifest.

Si la identidad no coincide, la restauracion se bloquea y se informa el motivo:

> La copia pertenece a otra empresa y no puede restaurarse aqui para evitar
> mezcla o sobrescritura de datos multi-tenant.

## Exportacion

Flujo de exportacion:

1. Usuario administrador o superadministrador accede a Ajustes.
2. Solicita generar backup completo.
3. Backend valida permisos y empresa activa.
4. Preflight recorre dominios y archivos.
5. Si hay referencias rotas, bloquea.
6. Genera snapshot completo por dominios.
7. Empaqueta archivos.
8. Calcula hashes.
9. Comprime y cifra.
10. Registra auditoria de exportacion.
11. Devuelve archivo `.giproybackup`.

## Restauracion desde archivo externo

Flujo:

1. Usuario sube `.giproybackup`.
2. Backend valida formato, cifrado e integridad.
3. Backend valida misma empresa.
4. Preflight calcula impacto.
5. UI muestra resumen completo.
6. Usuario completa triple confirmacion.
7. Backend revalida confirmaciones.
8. Backend genera copia automatica previa interna.
9. Solo si la copia previa es valida, inicia restauracion destructiva.
10. Borra datos restaurables actuales segun dominio.
11. Restaura datos y archivos desde la copia.
12. Aplica politica Marketplace.
13. Registra auditoria final.

## Copia automatica previa

Antes de cualquier restauracion destructiva, el sistema debe crear una copia
automatica previa completa de la empresa actual.

Reglas:

- Es obligatoria.
- Es interna.
- Es cifrada.
- Vive 30 dias.
- No se descarga desde UI normal.
- Bloquea la restauracion si falla.
- Se asocia a la operacion destructiva que la provoco.
- Conserva datos, papelera y archivos 1:1.

## Restauracion de copia automatica interna

Solo superadministradores pueden restaurar copias automaticas internas.

Reglas:

- Debe existir menu superadmin dedicado.
- Debe pedir triple confirmacion.
- Es restauracion destructiva.
- Debe mostrar empresa, fecha, usuario, rol, hash, tamano, conteos, motivo y
  estado.
- Una copia automatica restaurada queda pendiente de eliminacion durante una
  semana.
- Al restaurar una copia automatica, se purgan las copias automaticas anteriores
  a su fecha.

## Retencion

Retencion normal:

- Copias automaticas internas: 30 dias.

Despues de restaurar una copia automatica:

- Esa copia queda disponible solo una semana mas.
- Las copias anteriores a la fecha de la copia restaurada se eliminan/purgan
  segun politica segura.
- La auditoria permanece aunque el archivo se elimine.

## Confirmaciones destructivas

Toda restauracion destructiva requiere tres confirmaciones:

1. Confirmacion de impacto, con resumen de borrado/restauracion.
2. Escritura del nombre exacto de la empresa.
3. Escritura del correo del usuario autenticado y frase:
   `CONFIRMO RESTAURAR Y BORRAR DATOS`.

El boton final:

- No debe llamarse simplemente `Aceptar`.
- Debe decir claramente `Ejecutar restauracion destructiva`.
- Debe estar separado de la zona habitual de confirmacion.
- Debe requerir accion consciente.

## Auditoria

Se deben registrar operaciones de:

- Exportacion.
- Preflight de restauracion.
- Restauracion bloqueada.
- Creacion de copia automatica previa.
- Restauracion destructiva desde archivo externo.
- Restauracion destructiva desde copia automatica.
- Limpieza o purga de copias internas.
- Cancelacion/despublicacion Marketplace por restauracion.

Campos minimos:

- Empresa.
- Usuario.
- Rol.
- Correo autenticado.
- Correo escrito.
- Fecha/hora.
- IP/user agent si el sistema ya tiene patron disponible.
- Hash de backup.
- Tipo de operacion.
- Estado.
- Conteos.
- Impacto Marketplace.
- Motivo de fallo o bloqueo.
- Referencia a copia automatica previa.

## Seguridad

- Cifrado obligatorio.
- Secreto de backup separado de credenciales de usuario.
- Restauracion bloqueada si falta configuracion criptografica.
- No usar logs para volcar payloads ni datos sensibles.
- No permitir restaurar backups de otra empresa.
- No permitir saltar confirmaciones por frontend manipulado.
- Validaciones criticas siempre en backend.

## Implementacion incremental

### Fase 1 - Contrato y auditoria

- Definir manifest.
- Crear modelos/tablas aditivas.
- Registrar operaciones.
- Implementar preflight sin borrado.

Estado: implementada como base no destructiva.

Incluye:

- Contrato `company-full-backup-v1`.
- Alcance `company-full-1to1`.
- Tablas aditivas para operaciones y artefactos internos.
- Endpoint de contrato.
- Endpoint de preflight de exportacion sin borrado.
- Auditoria de operacion de preflight.
- Conteos principales de empresa, proyectos, bases, presupuestos, EDT,
  cronogramas, APUs, recursos, papelera, Comunidad y Marketplace.
- Inventario inicial de archivos referenciados y bloqueo por referencias
  fisicas inexistentes.
- Panel minimo en Ajustes para ejecutar preflight.

No incluye todavia generacion de `.giproybackup`, cifrado, restauracion,
sobrescritura, copia automatica previa ni menu superadmin.

### Fase 2 - Inventario de datos y archivos

- Mapear dominios incluidos.
- Detectar archivos referenciados.
- Validar existencia y hashes.
- Bloquear referencias rotas.

Estado: implementada como snapshot logico/exportable.

Notas:

- Se exportan tablas de alcance empresa por columnas de empresa/contexto y
  tablas dependientes por ids relacionados.
- Comunidad queda incluida en snapshot logico y en conteos/preflight.
- Los archivos fisicos referenciados se incorporan al paquete bajo `files/` con
  hash y ruta de archivo en manifest.
- Si una referencia falta o cambia de hash durante exportacion, la exportacion
  se bloquea.

### Fase 3 - Export cifrado

- Generar snapshot completo.
- Empaquetar archivos.
- Comprimir/cifrar.
- Descargar `.giproybackup`.

Estado: implementada como export no destructivo desde Ajustes.

Formato actual:

- Cabecera propia `GIPROYBACKUP1`.
- Payload ZIP comprimido con `manifest.json`, `data/tables/*.json` y `files/*`.
- Cifrado Fernet.
- Clave derivada de `COMPANY_BACKUP_SECRET` cuando exista, o de `SECRET_KEY` en
  entorno local.
- Operacion y auditoria con hash, filename, tamano, conteos e impacto
  Marketplace.

### Fase 4 - Preflight de restauracion

- Leer backup.
- Validar empresa.
- Validar hashes.
- Calcular impacto.
- Mostrar resumen frontend.

Estado: implementada sin borrado destructivo.

Incluye:

- Endpoint `POST /api/v1/company-backups/preflight/restore`.
- Subida multipart de `.giproybackup`.
- Descifrado con GiProy.
- Validacion de cabecera, ZIP interno, `manifest.json`, version, alcance,
  `data_hash`, archivos declarados, hash de archivos y misma empresa.
- Calculo de conteos actuales frente a conteos de la copia.
- Bloqueo explicito cuando la copia pertenece a otra empresa.
- UI en Ajustes para validar copia sin mostrar accion de restauracion.

La restauracion destructiva sigue bloqueada hasta implementar copia automatica
previa interna y triple confirmacion backend.

### Fase 5 - Copia automatica previa

- Generar backup interno antes de restaurar.
- Retencion 30 dias.
- Auditoria vinculada.
- Bloqueo si falla.

Estado: implementada como preparacion no destructiva.

Incluye:

- Endpoint `POST /api/v1/company-backups/restore/prepare-internal-safety-backup`.
- Endpoint `GET /api/v1/company-backups/internal-artifacts`.
- Reutilizacion del formato cifrado `.giproybackup` para el artefacto interno.
- Almacenamiento interno bajo `backend/backups/company_internal`.
- Registro en `company_backup_internal_artifacts` con usuario, rol, hash,
  tamano, conteos, resumen del manifest y expiracion a 30 dias.
- Auditoria `company_backup_internal_safety_backup_created`.
- Listado visible solo para `superadministrador`.
- Restauracion destructiva sigue bloqueada; el siguiente paso es triple
  confirmacion backend y ejecucion 1:1 controlada.

### Fase 6 - Restauracion destructiva 1:1

- Borrado controlado por dominios.
- Restauracion de datos.
- Restauracion de archivos.
- Politica Marketplace.
- Validacion post-restore.

Estado: implementada para archivo externo `.giproybackup` validado.

Detalles implementados:

- Endpoint `POST /api/v1/company-backups/restore/execute`.
- Solo `superadministrador`.
- Requiere copia automatica interna previa vigente y validada por hash.
- Requiere triple confirmacion backend literal:
  - `BORRAR DATOS ACTUALES`.
  - nombre exacto de la empresa.
  - email autenticado.
  - `CONFIRMO RESTAURAR Y BORRAR DATOS`.
- Reescribe los datos restaurables de empresa desde `data/tables/*.json`.
- Incluye papelera/borrado logico y `Otros > Comunidad`.
- Restaura archivos declarados en manifest y verifica hashes.
- Protege auditoria, operaciones de backup y compras Marketplace.
- Productos Marketplace propios que existen ahora pero no estaban en la copia
  quedan `cancelled` y `activo=false`, con nota administrativa.
- La copia interna usada queda `restored` y con limpieza programada a 7 dias.
- Copias internas anteriores se marcan `superseded`.
- UI en Ajustes muestra bloque rojo de triple confirmacion y boton final
  `Ejecutar restauracion destructiva`.

### Fase 7 - Superadmin recovery

- Menu de copias automaticas internas.
- Restauracion superadmin-only.
- Limpieza de copias antiguas.

Estado: implementada dentro de Ajustes.

Detalles implementados:

- Listado de artefactos internos con fecha, usuario, estado, hash, tamano y
  conteos.
- Endpoint `POST /api/v1/company-backups/restore/internal-artifact/execute`.
- Restauracion directa desde el archivo interno cifrado registrado.
- Triple confirmacion backend equivalente al restore externo.
- Auditoria critica `company_backup_internal_restore_completed`.
- Artefacto restaurado con `cleanup_after` a 7 dias.
- Copias anteriores a la restaurada marcadas `superseded`.
- Housekeeping al listar copias internas:
  - `available` vencidas a 30 dias se ocultan y se elimina su archivo.
  - `restored` con `cleanup_after` cumplido se ocultan y se elimina su archivo.

### Fase 8 - Smokes, baseline y runbook

- Tests backend.
- Smokes frontend.
- Anti-BIM.
- Build.
- Baseline enterprise.
- Documentacion de operacion.

## Validaciones finales esperadas

- `py_compile` backend focal.
- `pytest` focal de backup/restauracion.
- Smokes de Ajustes.
- Smokes superadmin.
- Smoke anti-BIM.
- `npm run build`.
- `tools/ai_tools/validate_enterprise_baseline.py --include-frontend`.

## No alcance

- No Docker.
- No Coolify.
- No CI/CD.
- No staging/produccion.
- No activacion BIM.
- No restauracion entre empresas distintas.
- No borrado fisico de compras Marketplace.
- No backup incompleto con advertencias.

## Siguiente paso recomendado

Opcional operativo posterior:

- mover el housekeeping de copias internas a una tarea periodica cuando se
  habilite infraestructura de jobs;
- ejecutar pruebas manuales con una empresa real en entorno local antes de
  habilitar la opcion a usuarios no tecnicos.
