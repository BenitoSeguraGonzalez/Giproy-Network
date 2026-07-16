# BIM-TASK-0105 - Productividad real y valor ganado BIM

Estado: Cerrada localmente

## Resultado

- Cada parte persiste BAC, PV, AC, avance, EV, SPI y CPI reproducibles.
- La metodologia usa `EV = BAC * avance`, `SPI = EV / PV` y `CPI = EV / AC`.
- Cantidad instalada y horas reales quedan disponibles para comparar
  productividad propuesta y ejecutada sin escribir fuentes clasicas.
- El inspector de campo muestra avance y metricas EVM compactas, con estados
  visuales trazables y sin overflow desktop/movil.

## Validacion

- Caso certificado: BAC `1000`, avance `50%`, PV `600`, AC `450` produce EV
  `500`, SPI `0.8333` y CPI `1.1111`.
- Servicio probado en SQLite como unidad rapida y en PostgreSQL como contrato
  operacional; la certificacion de persistencia corresponde a PostgreSQL.
- `106` pruebas BIM y validacion enterprise completa: OK.

## Rollback

Downgrade a `de2015a1b2c3` elimina solo el slice de campo/EVM BIM.
