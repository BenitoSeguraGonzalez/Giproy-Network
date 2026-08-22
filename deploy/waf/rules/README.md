# Reglas WAF de GiProy

Los archivos 900/999 son puntos de tuning compatibles con OWASP CRS. Se montan
en solo lectura y no contienen exclusiones globales.

Una exclusión solo puede añadirse cuando el estudio horario demuestre un falso
positivo reproducible. Debe limitarse simultáneamente por ruta, método,
variable y `ruleId`; nunca se desactiva una familia CRS completa para todo el
sitio.

## Gate para pasar a bloqueo

1. Siete días completos de observación.
2. Al menos 500 requests totales y 200 requests API en la muestra agregada.
3. Revisión humana de todos los pares `ruta normalizada + ruleId` repetidos.
4. Exclusiones focales acompañadas por smoke de regresión.
5. Smokes de login, CRUD REST, uploads, reportes, WebSocket y BIM/IFC.
6. Backup del Compose y cambio separado de `DetectionOnly` a `On`.
7. Ventana de rollback vigilada; nunca promoción automática.

El informe vive en `deploy/runtime/waf-study/latest.json` del servidor. No se
versiona y no conserva query strings, IP, cabeceras ni cuerpos.
