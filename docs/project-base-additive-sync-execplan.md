## Objetivo

Implementar una sincronización manual y aditiva entre una `Base de Proyecto` y su `Base Maestra` de origen desde `Precios Unitarios > Bases de Trabajo`.

La operación debe:

- estar disponible solo para bases de proyecto
- usar la dependencia ya referenciada (`source_base_id` o inferencia segura)
- añadir únicamente faltantes
- no modificar valores ni estructuras que ya existan en la base de proyecto
- pedir confirmación antes de ejecutarse

## Estado actual

- ya existe trazabilidad de origen en `BaseTrabajo.source_base_id`
- ya existe un reconciliador en `backend/app/services/project_base_reconciliation.py`
- la reconciliación actual (`reconcile_base`) no es apta para esta UX porque puede marcar o reparar divergencias
- no existe aún una operación explícita de sincronización aditiva desde la UI de bases

## Diseño propuesto

### Backend

Añadir una operación específica de sincronización aditiva:

- `sync_missing_only`

Reglas:

- solo acepta `Base de Proyecto`
- requiere `source_base_id` persistido o inferido de forma segura
- crea subcategorías faltantes
- crea recursos faltantes
- crea APUs faltantes y sus dependencias faltantes
- no toca ningún recurso/APU/subcategoría ya existente en la base de proyecto
- no borra, no reemplaza, no repara divergencias

### Frontend

En `BasesTrabajo`:

- añadir botón exclusivo de sincronización para bases de proyecto derivadas
- icono propio junto a clonar / editar / eliminar
- pedir confirmación con texto explícito
- mostrar resumen simple del resultado

## Riesgos

- reutilizar la reconciliación completa y tocar divergencias
- crear contenido huérfano en líneas APU
- permitir sincronización sobre bases maestras
- permitir sincronización sin origen claro

## Mitigación

- endpoint separado, no reutilizar `reconcile_base` como operación pública
- creación recursiva solo de faltantes
- validación estricta de tipo `Base de Proyecto`
- retorno de resumen antes/después

## Validación

- una base maestra no muestra botón de sincronización
- una base de proyecto con origen sí lo muestra
- al confirmar, solo se agregan faltantes
- no cambian los APUs/recursos ya existentes
- no se generan líneas APU huérfanas
- el resultado devuelve conteo de añadidos
