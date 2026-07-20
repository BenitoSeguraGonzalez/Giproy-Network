# BIM-TASK-0172 - Intercambio gobernado BIM hacia ERP

Fecha: 2026-07-20
Estado: Cerrada localmente; pendiente de certificacion beta
Modo: GIPROY BIM

## Objetivo

Completar H06 con paquetes versionados y deterministas de avance y horas BIM
para consumo ERP, sin escribir Cronogramas, APUs, personal ni contabilidad
clasicos.

## Alcance ejecutado

- Migracion aditiva `de2055a1b2c3` para paquetes aislados por empresa y
  proyecto, con revision unica, checksum y bloqueo optimista.
- Contrato de creacion por fecha de corte que consolida snapshots 4D, ultimo
  avance disponible y partes de horas BIM.
- Flujo gobernado `draft -> published/revoked`; solo el contenido publicado es
  consumible y una nueva publicacion sustituye la anterior.
- API BIM autenticada para listar, crear, transicionar y consultar paquetes.
- Panel ERP compacto en Produccion para generar, publicar, revocar y descargar
  el contrato, protegido por las mismas puertas BIM del workspace.

## Validacion

- `py_compile`: correcto.
- 3 tests focales PostgreSQL: correctos.
- Build Vite y smoke DOM en `1920x900` y `2560x1300`: correctos.
- PostgreSQL reversible, 33 smokes BIM, anti-BIM y baseline enterprise:
  correctos.

## No interferencia clasica

El servicio solo lee fuentes `bim_*` y persiste en
`bim_erp_exchange_packages`. No cambia contratos, datos ni pantallas de
Cronogramas, APUs, personal o contabilidad clasicos.

## Rollback

Desactivar la puerta BIM, retirar endpoints y servicio, y revertir
`de2055a1b2c3`. La migracion no modifica tablas clasicas.

## Resultado

H06 queda completa. Paridad: 85,83%. Programa: 46/61 slices, 75,41%
realizado y 24,59% pendiente.
