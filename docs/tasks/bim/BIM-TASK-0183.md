# BIM-TASK-0183 - Ensayo de rollback beta desde backup pre-ola

Fecha: 2026-07-20
Estado: Cerrada en beta controlada
Modo: GIPROY BIM

## Objetivo

Demostrar que el backup previo al despliegue `0173-0180` es restaurable y
conserva intacto GiProy Clasico, sin interrumpir ni modificar la beta activa.

## Alcance ejecutado

- Se valido la integridad gzip del backup de 385.412.305 bytes.
- Se creo una base PostgreSQL temporal desde `template0` y se restauro el dump
  completo con `ON_ERROR_STOP=1`.
- Se comparo una huella determinista de columnas clasicas entre base activa y
  restaurada, excluyendo solo tablas `bim_*`.
- Se verifico la frontera esperada de la ola: 81 tablas BIM y head `de2055` en
  el backup frente a 85 tablas BIM y head `de2057` en beta activa.
- La base temporal y el log de restauracion se eliminaron al terminar.

## Evidencia

- `BIM_ROLLBACK_RESTORE_OK`.
- Huella clasica activa/restaurada:
  `7cb85c67e07de730209a7a5c43b16134` en ambos lados.
- Backup: 81 tablas BIM, `de2055a1b2c3`.
- Activa: 85 tablas BIM, `de2057a1b2c3`.
- Cleanup: `TEMP_DB_COUNT=0`.
- Beta posterior al ensayo: HTTP 200; 13 GB libres.

## No interferencia clasica

La restauracion ocurrio en otra base y no recibio trafico de aplicacion. No se
reiniciaron contenedores ni se cambiaron rutas, auth, tenant, contratos o datos
clasicos. La huella de esquema demuestra que las migraciones de la ola no
alteraron tablas clasicas.

## Rollback

El procedimiento certificado es: detener escritura, fijar las imagenes
predeploy, restaurar el dump en una base limpia, verificar heads/huellas y
cambiar la conexion durante una ventana aprobada. Este ensayo no ejecuta el
cambio de conexion porque la beta activa esta saludable.

## Limite declarado

El ensayo completa evidencia operacional H07 para esta ola, pero no reemplaza
Gate E humano, Gate K ni un plan organizacional de continuidad aprobado.

## Porcentaje

Paridad: 89,17%, 52 completas, 3 parciales y 5 ausentes. Programa: 57/61
slices, 93,44% realizado y 6,56% pendiente.
