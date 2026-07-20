# BIM-TASK-0174 - Colaboracion CDE multiusuario incremental

Fecha: 2026-07-20
Estado: Cerrada localmente; pendiente de evidencia multiusuario desplegada
Modo: GIPROY BIM

## Objetivo

Reducir la brecha H03 con presencia activa y actividad incremental real dentro
del CDE BIM, sin introducir infraestructura cloud prematura ni dependencias
desde GiProy Clasico.

## Alcance ejecutado

- Migracion aditiva `de2057a1b2c3` para presencias y eventos tenant-aware.
- Heartbeat idempotente por sesion, expiracion a 45 segundos y salida explicita.
- Feed ordenado por cursor, recuperable y limitado, sin perdida ni duplicacion
  al sondear cambios posteriores.
- Eventos de creacion, comentario y transicion de revisiones CDE persistidos en
  la misma transaccion del workflow de origen.
- Contratos API protegidos por feature flag, capability y empresa/proyecto.
- Pestaña `Actividad` en Coordinacion con usuarios conectados y feed CDE,
  mediante polling incremental y limpieza al desmontar.

## Validacion

- `py_compile` y 6 tests focales de colaboracion/revisiones: correctos.
- PostgreSQL `de2057` con downgrade a `de2010` y re-upgrade: correcto.
- Build y smoke DOM en `1920x900` y `2560x1300`: correctos.
- 35 smokes BIM, anti-BIM y baseline enterprise: correctos.
- Ensayo DR: 85 tablas BIM restauradas y fingerprint clasico intacto.

## No interferencia clasica

Toda persistencia vive en `bim_cde_collaboration_*`; la UI solo se monta dentro
del workspace BIM autorizado. No cambia rutas, contratos, datos ni experiencia
de Cronogramas, Proyectos, APUs o Presupuesto clasicos.

## Limite declarado

H03 pasa de ausente a parcial. La presencia y el feed son funcionales localmente,
pero la capacidad cloud/CDE completa exige prueba desplegada con usuarios
concurrentes, observabilidad y evidencia de reconexion bajo red real.

## Rollback

Retirar la pestaña, endpoints, servicio y modelos, y revertir `de2057a1b2c3`.
Revisiones, documentos y demas contratos CDE existentes permanecen intactos.

## Resultado

Paridad: 88,33%. Programa: 48/61 slices, 78,69% realizado y 21,31% pendiente.
