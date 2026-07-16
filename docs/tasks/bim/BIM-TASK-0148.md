# BIM-TASK-0148 - Incidencias y evidencia fotografica de Campo

Estado: Cerrada localmente

## Objetivo

Completar el flujo de incidencias de Campo en escritorio mediante la entidad
BCF existente, evidencia fotografica integra y una experiencia lista/detalle,
sin crear otra fuente de incidencias ni tocar modulos clasicos.

## Cambios

- Tabla BIM aditiva `bim_issue_attachments` mediante revision Alembic
  `de2033a1b2c3`.
- Evidencia JPEG, PNG y WebP validada por firma real, limitada a 10 MB,
  persistida en PostgreSQL `BYTEA` y deduplicada por SHA-256 dentro del issue.
- Upload y lectura protegidos por empresa, proyecto y capacidades BIM; cada
  alta agrega evento al issue y auditoria BIM.
- Respuesta de incidencia ampliada con adjuntos sin cambiar el contrato BCF.
- Tab `Incidencias` en Campo BIM V2 con lista, busqueda, estado, creacion
  contextual, comentarios, transiciones y galeria fotografica.
- Cliente de dominio, harness y smoke interactivo en `1920x900` y
  `2560x1300`.

## Criterios verificados

- Una empresa o proyecto ajeno no puede resolver la evidencia.
- Tipo MIME declarado y firma binaria deben coincidir con un formato admitido.
- Un mismo binario no se registra dos veces en la misma incidencia.
- La foto conserva nombre, tamano, checksum, autor y fecha; el evento conserva
  su referencia auditable.
- La incidencia sigue siendo la entidad BIM/BCF existente y puede enfocar su
  viewpoint en el visor.
- No se agrega PWA, cache, sincronizacion offline ni soporte movil.

## Validacion

- Compilacion Python y build Vite: OK.
- Pruebas focales PostgreSQL de issue, BCF, evidencia y partes: `8 passed`.
- Alembic PostgreSQL `de2010 -> de2033 -> de2010 -> de2033`: OK;
  `BYTEA/TIMESTAMPTZ` verificados.
- Smoke Campo interactivo y 15 smokes Workspace BIM V2 encadenados: OK.
- Playwright `1920x900` y `2560x1300`: OK; sin overflow, solapamientos ni
  errores de consola.
- Baseline enterprise con frontend y anti-BIM: OK.
- Matriz: D04 completa, `59,17%`.

## Rollback

Retirar tab, panel, harness, smoke, metodos cliente, endpoints, schema,
servicio y modelo; ejecutar downgrade `de2033a1b2c3 -> de2032a1b2c3` para
eliminar solo adjuntos de incidencias. BCF, GiProy Clasico y TASK-1807
permanecen intactos.
