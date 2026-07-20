# HANDOFF

## 2026-07-20 - Despliegue beta y certificacion remota CDE

- `BIM-TASK-0181` despliega la ola 0173-0180 con backup de DB, fuentes e
  imagenes y conserva la allowlist `1,3`.
- Beta queda saludable en `de2057`; home HTTP 200 y rutas protegidas HTTP 401.
- Dos sesiones HTTPS pasan concurrencia, cursor, expiracion, reconexion y
  metricas; cleanup final 0/0/0. H03 queda completa.
- Paridad: 89,17%. Programa: 55/61, 90,16% realizado y 9,84% pendiente.
- Siguiente limite no simulable: Gate E humano; Gate K tambien sigue abierto.

## 2026-07-20 - Drenaje resiliente del feed CDE

- `BIM-TASK-0180` incorpora `has_more` aditivo y hasta cinco paginas por ciclo.
- Una rafaga de 205 eventos se drena `100/100/5` sin cursor estancado.
- Playwright pasa en 1920x900 y 2560x1300; H03 espera evidencia beta real.
- Paridad: 88,33%. Programa: 54/61, 88,52% realizado y 11,48% pendiente.

## 2026-07-20 - Escala del feed colaborativo CDE

- `BIM-TASK-0179` valida 100.000 eventos, pagina 100 e indice compuesto.
- Sesenta lecturas dan p95 local `1,939 ms`; un senuelo intercalado de otra
  empresa confirma aislamiento tenant/proyecto y el cleanup queda limpio.
- H03 permanece parcial hasta repetir la evidencia en beta y red real.
- Paridad: 88,33%. Programa: 53/61, 86,89% realizado y 13,11% pendiente.

## 2026-07-20 - Probe remoto de colaboracion CDE

- `BIM-TASK-0178` prepara el ensayo beta de dos sesiones sin persistir tokens.
- Cubre cursor, expiracion, reconexion, metricas y salida limpia; la prueba
  simulada pasa y la ejecucion real espera el despliegue de la ola.
- H03 permanece parcial hasta obtener `BIM_CDE_REMOTE_OK` en beta.
- Paridad: 88,33%. Programa: 52/61, 85,25% realizado y 14,75% pendiente.

## 2026-07-20 - Recuperacion de red y aislamiento CDE

- `BIM-TASK-0177` recupera actividad al volver online/visible, evita polls
  solapados y descarta respuestas tardias de otro empresa/proyecto.
- Build, 35 smokes BIM y capturas 1920x900/2560x1300 pasan sin overflow.
- H03 sigue parcial hasta repetir desconexion/reconexion en servidor real.
- Paridad: 88,33%. Programa: 51/61, 83,61% realizado y 16,39% pendiente.

## 2026-07-20 - Observabilidad operativa de colaboracion CDE

- `BIM-TASK-0176` añade al endpoint administrativo BIM metricas sanitizadas de
  presencia, eventos, cursor y lag por empresa/proyecto.
- No cambia rutas ni persistencia y no expone contenido sensible.
- Tests focales: 6 correctos. H03 sigue parcial hasta telemetria desplegada.
- Paridad: 88,33%. Programa: 50/61, 81,97% realizado y 18,03% pendiente.

## 2026-07-20 - Resiliencia concurrente de colaboracion CDE

- `BIM-TASK-0175` evita duplicados ante heartbeats concurrentes de una misma
  sesion mediante savepoint y recuperacion de la fila ganadora.
- PostgreSQL valida 12 workers, dos sesiones, expiracion, reconexion y cursor.
- Tests focales: 7 correctos; migracion reversible `de2057` correcta.
- H03 sigue parcial hasta repetir la evidencia desplegada con red real.
- Paridad: 88,33%. Programa: 49/61, 80,33% realizado y 19,67% pendiente.

## 2026-07-20 - Colaboracion CDE multiusuario incremental

- `BIM-TASK-0174` añade presencia por sesion, expiracion y feed CDE por cursor.
- Revisiones CDE emiten eventos dentro de su transaccion y la UX vive en
  Coordinacion > Actividad, bajo las puertas BIM vigentes.
- `de2057a1b2c3` agrega dos tablas BIM aditivas y reversibles.
- Build, 35 smokes BIM, PostgreSQL reversible, DR, anti-BIM y baseline pasan.
- Paridad: 88,33%. Programa: 48/61, 78,69% realizado y 21,31% pendiente.
- H03 sigue parcial hasta probar usuarios concurrentes y reconexion desplegada.

## 2026-07-20 - Gateway de integracion empresarial BIM

- `BIM-TASK-0173` completa B06 con suscripciones HTTPS, secretos cifrados,
  firmas HMAC-SHA256 y outbox recuperable sobre el paquete ERP H06.
- `de2056a1b2c3` agrega dos tablas BIM tenant-aware, aditivas y reversibles.
- Build, PostgreSQL reversible, 6 pruebas focales, 34 smokes BIM, anti-BIM y
  baseline enterprise pasan. Sin cambios ni dependencias clasicas.
- Paridad: 87,50%. Programa: 47/61, 77,05% realizado y 22,95% pendiente.

## 2026-07-20 - Intercambio gobernado BIM hacia ERP

- `BIM-TASK-0172` completa H06 con paquetes versionados de avance y horas BIM
  para consumo ERP.
- `de2055a1b2c3` agrega persistencia tenant-aware, checksum y lock optimista;
  solo paquetes publicados exponen contenido.
- No se escribe Cronogramas, APUs, personal ni contabilidad clasicos.
- Paridad: 85,83%. Programa: 46/61, 75,41% realizado y 24,59% pendiente.

## 2026-07-20 - Resincronización del editor light APU Gantt

- `TASK-2029` corrige el estado local retenido al cancelar o restaurar el editor
  light de APUs en Gantt clásico.
- Cada apertura monta una sesión limpia y Restaurar fuerza resincronización de
  rendimientos, cantidades, líneas fuente y política de trabajo.
- Se conserva el preview vivo y la guarda transaccional de `TASK-1983`.
- Build, smoke Cronogramas, semáforos APU y anti-BIM pasan. Sin deploy.

## 2026-07-20 - Semáforos APU por actividad en Gantt clásico

- `TASK-2028` agrega junto a la rueda de configuración de cada actividad APU un
  acceso al mismo panel de semáforos disponible en el rail general.
- El acceso funciona por hover/foco y clic fijado en ambos layouts del Gantt;
  reutiliza modelo, portal y estados de TASK-2021.
- No cambia backend, DB, API, Presupuesto, BIM ni guardas de TASK-1807.
- Build, smoke focal, frontera API de Cronogramas y anti-BIM pasan. Sin deploy.

## 2026-07-20 - Servicios cartograficos BIM

- `BIM-TASK-0171` completa H05 con catalogos XYZ/WMS revisados por
  empresa/proyecto y controles reales sobre Leaflet.
- `de2054a1b2c3` persiste capas base y overlays sin PostGIS ni dependencias
  desde GiProy Clasico.
- 6 tests, PostgreSQL reversible, build, 32 smokes, Playwright, anti-BIM y
  baseline enterprise pasan.
- Paridad: 84,17% (49 completas, 3 parciales, 8 ausentes). Programa: 45/61,
  73,77% realizado y 26,23% pendiente. Sin deploy.
- Siguiente slice: `BIM-TASK-0172`, contrato aislado H06 de intercambio de
  progreso y horas con ERP, sin escribir Cronograma ni personal clasicos.

## 2026-07-17 - Ensayo DR del dominio BIM

- `BIM-TASK-0170` completa H07 con backup/restore real de las 79 tablas
  `bim_*`, conteos y checksum SHA-256 exactos.
- El contexto clásico permanece idéntico y las bases `_test` se eliminan.
- Ensayo: 2 filas, checksum
  `86c98a641c0172299c1da899494030689ad26a371ed2caa6e43678178c33816f`,
  17,165 segundos locales.
- Paridad: 82,50% (48 completas, 3 parciales, 9 ausentes). Programa: 44/61,
  72,13% realizado y 27,87% pendiente. Sin deploy.
- Siguiente slice: `BIM-TASK-0171`, servicios de mapas BIM H05 sobre el
  georreferenciado existente, sin depender de Proyectos clásico.

## 2026-07-17 - Matriz operacional de alertas BIM

- `BIM-TASK-0169` completa H04 con niveles próximo, vencido y escalado para
  RFI, submittals y revisiones CDE.
- `de2053a1b2c3` persiste alertas deduplicadas, tenant-aware, resolubles y con
  acuse exclusivo del destinatario.
- 6 tests, PostgreSQL, build, 32 smokes, Playwright, anti-BIM y baseline pasan.
- Paridad: 81,67% (47 completas, 4 parciales, 9 ausentes). Programa: 43/61,
  70,49% realizado y 29,51% pendiente. Sin deploy.
- Siguiente slice: `BIM-TASK-0170`, ensayo de backup y recuperación del
  dominio BIM para completar H07 sin reabrir infraestructura productiva.

## 2026-07-17 - Activación gobernada de transición BIM a Operaciones

- `BIM-TASK-0168` completa G05 mediante revalidación exacta del dossier y
  baseline operativo antes de la decisión.
- `de2052a1b2c3` garantiza una única transición aceptada vigente y conserva el
  historial como `superseded`.
- 4 tests, PostgreSQL, build, 32 smokes, Playwright, anti-BIM y baseline pasan.
- Paridad: 80,83% (46 completas, 5 parciales, 9 ausentes). Programa: 42/61,
  68,85% realizado y 31,15% pendiente. Sin deploy.
- Siguiente slice: `BIM-TASK-0169`, iniciar D01 con superficie de Campo PWA
  aislada y sin alterar la política desktop del workspace principal.

## 2026-07-16 - Baseline de transición BIM a Operaciones

- `BIM-TASK-0167` inicia G05 con un baseline SHA-256 de activos y sistemas
  derivado del dossier digital aceptado.
- `de2051a1b2c3` conserva receptor, responsable, fecha y criterios sin tocar
  mantenimiento, inventario ni datos clásicos.
- 3 tests, PostgreSQL, build, 32 smokes, Playwright, anti-BIM y baseline pasan.
- Paridad: 80,00% (45 completas, 6 parciales, 9 ausentes). Programa: 41/61,
  67,21% realizado y 32,79% pendiente. Sin deploy.
- Siguiente slice: `BIM-TASK-0168`, completar G05 con activación y revalidación
  gobernada del baseline operativo.

## 2026-07-16 - Aceptación gobernada del dossier digital BIM

- `BIM-TASK-0166` completa G04 con revalidación exacta del manifiesto y
  decisión auditable bajo locks.
- `de2050a1b2c3` garantiza un único dossier aceptado vigente y conserva el
  historial anterior como `superseded`.
- 5 tests, PostgreSQL, build, 31 smokes, Playwright, anti-BIM y baseline pasan.
- Paridad: 79,17% (45 completas, 5 parciales, 10 ausentes). Programa: 40/61,
  65,57% realizado y 34,43% pendiente. Sin deploy.
- Siguiente slice: `BIM-TASK-0167`, iniciar G05 con transición gobernada del
  gemelo digital a Operaciones.

## 2026-07-16 - Ensamblado gobernado del dossier digital BIM

- `BIM-TASK-0165` inicia G04 con un manifiesto SHA-256 que referencia as-built,
  punch, commissioning y revisiones CDE aceptadas/vigentes.
- `de2049a1b2c3` es aditiva, tenant-aware y conserva las fuentes con claves
  restrictivas; el workspace incorpora `Dossier digital` bajo Entrega.
- 4 tests, PostgreSQL, build, 31 smokes, Playwright, anti-BIM y baseline pasan.
- Paridad: 78,33% (44 completas, 6 parciales, 10 ausentes). Programa: 39/61,
  63,93% realizado y 36,07% pendiente. Sin deploy.
- Siguiente slice: `BIM-TASK-0166`, completar G04 con aceptación y
  revalidación formal del manifiesto.

## 2026-07-16 - Cierre gobernado de punch list BIM

- `BIM-TASK-0164` completa G03 congelando y revalidando la punch list BIM
  cerrada contra la aceptación as-built vigente.
- `de2048a1b2c3` persiste IDs, métricas, criterios y SHA-256 sin duplicar ni
  mutar hallazgos de Campo.
- Entrega incorpora `Cierre punch`; 3 tests, PostgreSQL, build, 30 smokes,
  Playwright, anti-BIM y baseline pasan.
- Paridad: 77,50% (44 completas, 5 parciales, 11 ausentes). Programa: 38/61,
  62,30% realizado y 37,70% pendiente. Sin deploy.
- Siguiente slice: `BIM-TASK-0165`, iniciar G04 con dossier digital gobernado.

## 2026-07-16 - Aceptacion tecnica de commissioning BIM

- `BIM-TASK-0163` completa G02 con protocolos, resultados y decisiones
  tenant-aware por activo, seguidos de aceptacion del sistema completo.
- `de2047a1b2c3` agrega JSON, timestamps y locks de forma aditiva y reversible;
  fallos o protocolos pendientes bloquean la aceptacion.
- Commissioning conserva una sola superficie con modos Activo, Sistema y
  Prueba; 6 tests, PostgreSQL, build, 29 smokes, Playwright, anti-BIM y baseline
  pasan.
- Paridad: 76,67% (43 completas, 6 parciales, 11 ausentes). Programa: 37/61,
  60,66% realizado y 39,34% pendiente. Sin deploy.
- Siguiente slice: `BIM-TASK-0164`, completar G03 con cierre de punch list de
  entrega gobernado.

## 2026-07-16 - Registro de commissioning BIM

- `BIM-TASK-0162` registra sistemas y activos tenant-aware con tag, GlobalId,
  version, elemento y sistema IFC de origen.
- `de2046a1b2c3` es aditiva y reversible; las referencias restrictivas evitan
  perder la trazabilidad de activos de commissioning.
- Entrega incorpora `Commissioning`; 3 tests focales, PostgreSQL, build, 29
  smokes BIM, Playwright 1920x900/2560x1300, anti-BIM y baseline pasan.
- G02 queda parcial hasta protocolos de prueba y aceptacion. Paridad: 75,83%
  (42 completas, 7 parciales, 11 ausentes). Programa: 36/61, 59,02% realizado
  y 40,98% pendiente. Sin deploy.
- Siguiente slice: `BIM-TASK-0163`, completar G02 con protocolos, resultados y
  aceptacion tecnica gobernada.

## 2026-07-16 - Aceptacion de modelo as-built BIM

- `BIM-TASK-0161` cierra G01 con presentación y decisión gobernadas sobre una
  versión BIM inmutable, lista y con reporte IFC no fallido.
- La solicitud congela versión, archivo, checksum, calidad y criterios; la
  aceptación revalida el checksum y sustituye la aceptación anterior.
- `de2045a1b2c3` es aditiva y reversible; BIM V2 incorpora el área `Entrega`.
- 3 tests focales, PostgreSQL, build, 28 smokes BIM, Playwright
  1920x900/2560x1300, anti-BIM y baseline pasan.
- Paridad: 75,00% (42 completas, 6 parciales, 12 ausentes). Programa: 35/61,
  57,38% realizado y 42,62% pendiente. Sin deploy.
- Siguiente slice: `BIM-TASK-0162`, iniciar G02 con registro de activos y
  sistemas de commissioning, manteniendo el dominio aislado.

## 2026-07-16 - Forecast de coste final BIM

- `BIM-TASK-0160` cierra F07 con revisiones que congelan presupuesto aprobado,
  compromiso, coste real, ETC, EAC y variacion por moneda.
- La aprobacion sustituye solo el forecast aprobado anterior de la misma moneda
  y no modifica ninguna fuente monetaria.
- `de2044a1b2c3` es aditiva y reversible; Produccion incorpora `Forecast`.
- Build, 27 smokes BIM, PostgreSQL, Playwright 1920x900/2560x1300 y baseline
  pasan. GiProy Clasico permanece intacto con BIM apagado.
- Paridad: 74,17% (41 completas, 7 parciales, 12 ausentes). Programa: 34/61,
  55,74% realizado y 44,26% pendiente. Sin deploy.

## 2026-07-16 - Ledger de coste real desde Campo BIM

- `BIM-TASK-0159` cierra F06 con un asiento inmutable por parte de Campo y
  calculo incremental respecto al coste acumulado anterior de la actividad.
- La captura y sincronizacion historica bloquean disminuciones y mezclas de
  moneda; los eventos validados se muestran como excepciones fuera del total
  para impedir doble contabilizacion.
- `de2043a1b2c3` agrega moneda a partes BIM y crea el ledger de forma aditiva y
  reversible; no toca nomina, inventario, Presupuestos o contabilidad clasicos.
- Produccion incorpora `Reales`; build, 26 smokes BIM, PostgreSQL, Playwright
  1920x900/2560x1300 y baseline pasan.
- Paridad: 73,33% (40 completas, 8 parciales, 12 ausentes). Programa: 33/61,
  54,10% realizado y 45,90% pendiente.
- Siguiente slice: `BIM-TASK-0160`, completar F07 con forecast versionado de
  coste final.
- Esta ola no se ha desplegado.

## 2026-07-16 - Ordenes de cambio BIM gobernadas

- `BIM-TASK-0158` cierra F05 con PCO tenant-aware, envio, aprobacion, rechazo y
  cancelacion auditables sobre contratos BIM activos.
- Una aprobacion actualiza el compromiso contractual en la misma transaccion,
  invalida el SOV aprobado y no permite reducir el contrato por debajo de pagos
  reservados.
- `de2042a1b2c3` es aditiva y reversible; no toca contratos, Presupuestos,
  Cronogramas, facturacion ni contabilidad clasicos.
- Produccion incorpora `Cambios`; build, 25 smokes BIM, PostgreSQL, Playwright
  1920x900/2560x1300 y baseline pasan.
- Paridad: 72,50% (39 completas, 9 parciales, 12 ausentes). Programa: 32/61,
  52,46% realizado y 47,54% pendiente.
- Siguiente slice: `BIM-TASK-0159`, completar F06 con ledger gobernado de coste
  real desde Campo.
- Esta ola no se ha desplegado.

## 2026-07-16 - Schedule of Values BIM gobernado

- `BIM-TASK-0157` cierra F04 con asignacion lineal versionada cuya suma debe
  coincidir exactamente con el compromiso del contrato BIM.
- `de2041a1b2c3` es aditiva y reversible; no toca EDT, APUs, Presupuestos ni
  contratos clasicos.
- Produccion incorpora `Valores`; build, 24 smokes BIM, PostgreSQL, Playwright
  1920x900/2560x1300 y baseline pasan.
- Paridad: 70,83% (38 completas, 9 parciales, 13 ausentes). Programa: 31/61,
  50,82% realizado y 49,18% pendiente.
- Siguiente slice: `BIM-TASK-0158`, completar F05 con potenciales ordenes y
  ordenes de cambio BIM gobernadas.
- Esta ola no se ha desplegado.

## 2026-07-16 - Solicitudes y certificaciones de pago BIM

- `BIM-TASK-0156` cierra F03 con solicitud, envio y certificacion contra
  contratos BIM activos, dentro de sus limites monetarios.
- `de2040a1b2c3` es aditiva y reversible; no ejecuta pagos ni toca facturacion,
  tesoreria o contabilidad clasicas.
- Produccion incorpora `Pagos`; build, 23 smokes BIM, PostgreSQL, Playwright
  1920x900/2560x1300 y baseline pasan.
- Paridad: 69,17% (37 completas, 9 parciales, 14 ausentes). Programa: 30/61,
  49,18% realizado y 50,82% pendiente.
- Siguiente slice: `BIM-TASK-0157`, completar F04 con Schedule of Values
  versionado y gobernado por contrato BIM.
- Esta ola no se ha desplegado.

## 2026-07-16 - Contratos BIM de coste gobernados

- `BIM-TASK-0155` cierra F02 con compromisos tenant-aware derivados solo de
  estimaciones BIM aprobadas y cuyo acumulado se limita por su subtotal.
- `de2039a1b2c3` es aditiva y reversible; no toca proveedores, compras,
  contratos, Presupuestos ni contabilidad clasicos.
- Produccion incorpora `Contratos`; build, 22 smokes BIM, PostgreSQL,
  Playwright 1920x900/2560x1300 y baseline pasan.
- Paridad: 67,50% (36 completas, 9 parciales, 15 ausentes). Programa: 29/61,
  47,54% realizado y 52,46% pendiente.
- Siguiente slice: `BIM-TASK-0156`, completar F03 con solicitudes y
  certificaciones de pago BIM contra contratos activos.
- Esta ola no se ha desplegado.

## 2026-07-16 - Estimacion BIM gobernada

- `BIM-TASK-0154` cierra F01 con estimaciones versionadas derivadas solo de
  QTO aprobado, precios unitarios completos y subtotal decimal reproducible.
- `de2038a1b2c3` es tenant-aware y reversible; no toca Presupuestos, APUs,
  contratos ni contabilidad clasicos.
- Produccion incorpora `Estimacion`; build, 21 smokes BIM, PostgreSQL,
  Playwright 1920x900/2560x1300 y baseline pasan.
- Paridad: 65,83% (35 completas, 9 parciales, 16 ausentes). Programa: 28/61,
  45,90% realizado y 54,10% pendiente.
- Siguiente slice: `BIM-TASK-0155`, iniciar F02 con contratos BIM/Cost
  aislados, sin acoplamiento contractual clasico.
- Esta ola no se ha desplegado.

## 2026-07-16 - Cuadrillas y partes de horas BIM

- `BIM-TASK-0153` cierra E08 con directorio de cuadrillas sin identidades
  personales y partes diarios ligados a actividad y frente BIM.
- La revision aditiva `de2037a1b2c3` es tenant-aware y reversible; no toca
  personal, contratos, nomina ni contabilidad clasicos.
- Campo incorpora la tab `Cuadrillas` con vistas `Partes` y `Directorio`;
  build, 20 smokes BIM, PostgreSQL, Playwright 1920x900/2560x1300 y baseline
  pasan.
- Paridad: 65,00% (34 completas, 10 parciales, 16 ausentes). Programa: 27/61
  slices, 44,26% realizado y 55,74% pendiente.
- Siguiente slice: `BIM-TASK-0154`, iniciar F01 con estimacion BIM gobernada
  desde snapshots QTO aprobados, sin escribir Presupuestos clasicos.
- Esta ola no se ha desplegado.

## 2026-07-16 - Materiales y equipos de Campo

- `BIM-TASK-0152` cierra E07 con recepcion, consumo y retorno sobre recursos
  BIM material/equipo, ligados opcionalmente a frente y actividad.
- La revision aditiva `de2036a1b2c3` es tenant-aware y reversible; bloquea
  consumos que producirian saldo negativo.
- Campo incorpora la tab `Materiales`; build, 19 smokes BIM, 14 pruebas
  PostgreSQL, ciclo Alembic, Playwright 1920x900/2560x1300 y baseline pasan.
- Paridad: 63,33% (33 completas, 10 parciales, 17 ausentes). Programa: 26/61
  slices, 42,62% realizado y 57,38% pendiente.
- Siguiente slice: `BIM-TASK-0153`, completar partes de horas y directorio de
  cuadrillas BIM para E08, sin escribir nomina ni personal clasico.
- Esta ola no se ha desplegado.

## 2026-07-16 - Eventos no planificados con impacto real

- `BIM-TASK-0151` cierra E04 con eventos de plazo y coste real ligados a
  actividad y frente BIM, sin escribir Cronogramas ni Presupuestos clasicos.
- La revision aditiva `de2035a1b2c3` es tenant-aware y reversible; la decision
  única valida o anula el evento conservando trazabilidad.
- Produccion incorpora la tab `Eventos`; build, 18 smokes BIM, 12 pruebas
  PostgreSQL, ciclo Alembic, Playwright 1920x900/2560x1300 y baseline pasan.
- Paridad: 62,50% (32 completas, 11 parciales, 17 ausentes). Programa: 25/61
  slices, 40,98% realizado y 59,02% pendiente.
- Siguiente slice: `BIM-TASK-0152`, ciclo de recepcion y consumo de materiales
  y recursos de Campo para completar E07.
- Esta ola no se ha desplegado.

## 2026-07-16 - Inspecciones, checklists y punch lists de Campo

- `BIM-TASK-0150` cierra D07 con checklist estructurado e histórico sobre
  inspecciones de riesgo 4D y punch items correctivos gobernados.
- La tab `Inspecciones` sustituye `Riesgos` y conserva zona WebGL, exposicion,
  controles, resultados y workflow correctivo en una sola superficie.
- La revision aditiva `de2034a1b2c3` es tenant-aware y reversible; no modifica
  tablas ni contratos clasicos.
- PostgreSQL pasa 10 pruebas y ciclo reversible; build, 17 smokes BIM,
  Playwright 1920x900/2560x1300 y baseline enterprise pasan.
- Paridad: 61,67% (31 completas, 12 parciales, 17 ausentes). Programa: 24/61
  slices, 39,34% realizado y 60,66% pendiente.
- Siguiente slice: `BIM-TASK-0151`, completar capacidades Perform priorizadas
  sin introducir alcance movil/offline contrario al contrato desktop.
- Esta ola no se ha desplegado.

## 2026-07-16 - Diario de obra consolidado de Campo

- `BIM-TASK-0149` cierra D05 y E05 reutilizando partes 4D, `daily_log` y su
  evidencia como fuentes unicas del diario.
- Campo BIM V2 incorpora agrupacion diaria, busqueda, frente, rango temporal,
  resumen, lista/detalle, metricas y evidencia descargable.
- No hay endpoint, tabla ni migracion nueva; las cantidades instaladas no se
  agregan entre unidades incompatibles.
- PostgreSQL pasa 8 pruebas y ciclo reversible hasta `de2033`; build, 16
  smokes BIM, Playwright 1920x900/2560x1300 y baseline enterprise pasan.
- Paridad: 60,83% (30 completas, 13 parciales, 17 ausentes). Programa: 23/61
  slices, 37,70% realizado y 62,30% pendiente.
- Siguiente slice: `BIM-TASK-0150`, inspecciones, checklists y punch lists de
  Campo sobre contratos BIM existentes.
- Esta ola no se ha desplegado.

## 2026-07-16 - Incidencias y evidencia fotografica de Campo

- `BIM-TASK-0148` cierra D04 reutilizando incidencias BCF como fuente unica y
  agregando fotos integras por checksum en `bim_issue_attachments`.
- La revision `de2033a1b2c3` es aditiva y tenant-aware; upload y descarga
  validan empresa/proyecto, firma JPEG/PNG/WebP, 10 MB y duplicados.
- Campo BIM V2 incorpora lista/detalle, busqueda, estados, creacion contextual,
  comentarios y galeria responsive de escritorio.
- PostgreSQL pasa 8 pruebas y ciclo reversible `de2010/de2033`; build, 15
  smokes BIM, Playwright 1920x900/2560x1300 y baseline enterprise pasan.
- Paridad: 59,17% (28 completas, 15 parciales, 17 ausentes). Programa: 22/61
  slices, 36,07% realizado y 63,93% pendiente.
- Siguiente slice: `BIM-TASK-0149`, diario de obra consolidado sobre partes 4D
  existentes, sin duplicar progreso ni actividades clasicas.
- Esta ola no se ha desplegado.

## 2026-07-16 - Documentos CDE disponibles en Campo

- `BIM-TASK-0147` cierra D03 con listado, busqueda, filtro y descarga de la
  revision CDE vigente desde Campo BIM V2, siempre mediante ACL existente.
- No duplica documentos ni permisos y no incorpora escritura, cache, PWA,
  movil u offline; se mantiene el contrato de escritorio minimo 1920x1080.
- Build, 14 smokes BIM agregados, Playwright en viewport util 1920x900 y
  expansion 2560x1300, 8 pruebas CDE/ACL sobre PostgreSQL, validador reversible
  y baseline enterprise pasan.
- Paridad: 58,33% (27 completas, 16 parciales, 17 ausentes). Programa: 21/61
  slices, 34,43% realizado y 65,57% pendiente.
- Siguiente slice: `BIM-TASK-0148`, incidencias y evidencia de Campo sobre los
  contratos BIM existentes, sin tocar GiProy Clasico.
- Esta ola no se ha desplegado.

## 2026-07-16 - Dashboard CDE operacional

- `BIM-TASK-0146` cierra C08 con metricas ACL-aware, vencimientos, carga por
  responsable y cola priorizada en la primera tab de Coordinacion BIM V2.
- Usuarios ordinarios ven solo documentos autorizados y trabajo donde
  participan; el superadministrador conserva alcance de proyecto.
- No hay migracion nueva. PostgreSQL real pasa 25 pruebas CDE y el validador
  reversible hasta `de2032`; build, Playwright 1920x1080, workspace V2,
  anti-BIM y baseline enterprise pasan.
- Paridad: 56,67% (26 completas, 16 parciales, 18 ausentes). Programa: 20/61
  slices, 32,79% realizado y 67,21% pendiente.
- Siguiente ola: Field, comenzando por `BIM-TASK-0147`, respetando el contrato
  vigente de escritorio minimo 1920x1080 y sin declarar soporte movil falso.
- Esta ola no se ha desplegado.

## 2026-07-13 - Revision CDE contextual y notificaciones BIM

- `BIM-TASK-0145` cierra C07 con hilos sobre revision documental exacta,
  contexto por elemento/viewpoint, responsable y decisiones auditables.
- Las notificaciones son internas al dominio BIM, deduplicadas y con lectura;
  no se acoplan a correo ni al sistema clasico.
- PostgreSQL real pasa `de2032` upgrade/downgrade; 44 pruebas, build,
  Playwright 1920x1080, workspace, anti-BIM y baseline pasan.
- Paridad: 55,83% (25 completas, 17 parciales, 18 ausentes). Programa: 19/61
  slices, 31,15% realizado y 68,85% pendiente.
- Siguiente slice: `BIM-TASK-0146`, dashboard CDE operacional.
- Esta ola no se ha desplegado.

## 2026-07-13 - Geolocalizacion BIM modelo-mapa

- `BIM-TASK-0144` cierra C05 con ancla BIM versionada, transformación local
  ENU, mapa operativo y selección sincronizada de versiones federadas.
- Revisiones R2/R3 con el mismo `codigo_root` mantienen ubicaciones separadas
  por `proyecto_id`; GiProy Clasico no se consulta ni modifica.
- PostgreSQL real pasa `de2031` upgrade/downgrade; 41 pruebas seleccionadas,
  build, Playwright 1920x1080, workspace, anti-BIM y baseline pasan.
- Paridad: 55,00% (24 completas, 18 parciales, 18 ausentes). Programa: 18/61
  slices, 29,51% realizado y 70,49% pendiente.
- Siguiente slice: `BIM-TASK-0145`, notificaciones y asignaciones CDE.
- Esta ola no se ha desplegado.

## 2026-07-13 - ACL documental granular BIM

- `BIM-TASK-0143` cierra C04 con permisos jerarquicos para ver, descargar,
  revisar y administrar documentos CDE por usuario.
- Tras la primera concesion, revocar todas las ACL mantiene el documento
  restringido; creador, superadmin y administradores ACL conservan gobierno.
- PostgreSQL real pasa `de2030` upgrade/downgrade, `BOOLEAN` y `TIMESTAMPTZ`;
  43 pruebas, build, Playwright 1920x1080, workspace, anti-BIM y baseline pasan.
- Paridad: 53,33% (23 completas, 18 parciales, 19 ausentes). Programa: 17/61
  slices, 27,87% realizado y 72,13% pendiente.
- Siguiente slice: `BIM-TASK-0144`, geolocalizacion modelo-mapa.
- Esta ola no se ha desplegado.

## 2026-07-13 - Submittals y planos de ingenieria

- `BIM-TASK-0142` cierra C03 con expedientes revisionados, documento CDE
  fijado, revisor, fecha requerida y decisiones auditables.
- Rechazo y reenvio exigen una nueva revision CDE; la revision previa queda
  superseded sin borrar historial ni archivos.
- PostgreSQL real pasa `de2029` upgrade/downgrade y `TIMESTAMPTZ`; 39 pruebas,
  build, Playwright 1920x1080, workspace, anti-BIM y baseline pasan.
- Paridad: 52,50% (22 completas, 19 parciales, 19 ausentes). Programa: 16/61
  slices, 26,23% realizado y 73,77% pendiente.
- Siguiente slice: `BIM-TASK-0143`, ACL documental granular.
- Esta ola no se ha desplegado.

## 2026-07-13 - Workflow RFI integral

- `BIM-TASK-0141` cierra C02 con solicitudes numeradas, responsables,
  vencimientos, documento/elemento contextual y eventos auditables.
- El workflow `draft -> submitted -> answered -> closed`, la anulacion y el
  bloqueo optimista operan solo en tablas y endpoints BIM.
- PostgreSQL real pasa `de2028` upgrade/downgrade y `TIMESTAMPTZ`; 35 pruebas,
  build, Playwright 1920x1080, workspace, anti-BIM y baseline pasan.
- Paridad: 50,83% (21 completas, 19 parciales, 20 ausentes). Programa: 15/61
  slices, 24,59% realizado y 75,41% pendiente.
- Siguiente slice: `BIM-TASK-0142`, submittals y planos de ingenieria.
- Esta ola no se ha desplegado.

## 2026-07-13 - CDE documental versionado

- `BIM-TASK-0140` cierra C01 con documentos/revisiones inmutables, checksum,
  almacenamiento confinado, descarga verificada y archivo logico.
- El CDE BIM usa tablas y rutas propias; no depende de Documentos de Proyecto
  clasico ni cambia su UX con BIM apagado.
- PostgreSQL real pasa `de2027` upgrade/downgrade e indice vigente parcial; 45
  pruebas, build, Playwright 1920x1080, workspace, anti-BIM y baseline pasan.
- Paridad: 50,00% (20 completas, 20 parciales, 20 ausentes). Programa: 14/61
  slices, 22,95% realizado y 77,05% pendiente.
- Siguiente slice: `BIM-TASK-0141`, workflow RFI integral sobre CDE.
- Esta ola no se ha desplegado.

## 2026-07-13 - Scheduling/Modeler cerrado hasta BIM-TASK-0139

- `BIM-TASK-0139` publica import-preview y exportacion MSPDI/P6 XML dentro del
  Workspace BIM V2, con errores/perdidas visibles y revisiones gobernadas.
- Guardar, aprobar, rechazar o hacer rollback opera solo en tablas BIM; no hay
  accion para aplicar al Cronograma clasico.
- Export XML, 17 pruebas focales, build, Playwright 1920x1080, workspace V2,
  anti-BIM y baseline enterprise pasan.
- B04 queda completa. Paridad: 49,17% (19 completas, 21 parciales, 20
  ausentes). Programa: 13/61 slices, 21,31% realizado y 78,69% pendiente.
- Siguiente ola: `BIM-TASK-0140` a `0146`, Control/CDE.
- Esta ola no se ha desplegado.

## 2026-07-13 - Nivelacion 4D aislada por revision de proyecto

- `BIM-TASK-0137/0138` cierran A09 con escenarios CPM reversibles y UX de
  simulacion/gobierno a 1920x1080.
- Las revisiones de proyecto que comparten `codigo_root` mantienen Gantt,
  linea base, recursos y escenarios separados por `proyecto_id`; el intento de
  mezclar R2 y R3 se rechaza por contrato y prueba.
- PostgreSQL real `giproy_bim_test` pasa migracion/downgrade `de2026a1b2c3`,
  tipos temporales e indice activo unico. SQLite queda limitado a unit tests.
- 41 pruebas acumuladas, build, smokes BIM/anti-BIM y baseline enterprise
  pasan. Paridad: 48,33% (18 completas, 22 parciales, 20 ausentes).
- Programa: 12/61 slices, 19,67% realizado y 80,33% pendiente.
- Siguiente bloque: `BIM-TASK-0139`, cierre restante de scheduling/Modeler.
- Esta ola no se ha desplegado.

## 2026-07-13 - QTO BIM aprobado y paquete 5D

- `BIM-TASK-0135/0136` cierran snapshots QTO IFC, cobertura, gobierno de
  aprobacion y paquete 5D sin escritura clasica.
- Rama BIM `de2025a1b2c3`; 31 pruebas acumuladas, build, Playwright 1920x1080,
  anti-BIM, matriz y baseline enterprise pasan.
- A04 queda completa. Paridad integral: 47,50% (17 completas, 23 parciales,
  20 ausentes). Programa: 10/61 slices, 16,39%.
- Siguiente slice: A09, nivelacion CPM de recursos reversible en BIM.
- No se ha desplegado esta ola.

## 2026-07-13 - Revision y rollback de scheduling BIM

- `BIM-TASK-0134` persiste previews canonicos BIM y permite
  aprobar/rechazar/superseder/revertir sin escribir Cronograma clasico.
- Migracion BIM `de2023a1b2c3`, 43 pruebas y baseline enterprise pasan.
- Comparacion semantica P6/MSPDI ignora remapeos tecnicos de IDs.
- Paridad integral permanece en 46,67%; no se ha desplegado esta ola.
- Siguiente bloque: cerrar Modeler/QTO A04/A07-A10.

## 2026-07-13 - Gate de formatos propietarios de scheduling

- `BIM-TASK-0133` cierra sin parser XER: capacidades versionadas mantienen
  XER, MPP y PP condicionados a corpus/adaptador autorizado.
- MSPDI XML, P6 XML y canonical JSON son los canales disponibles.
- 16 pruebas pasan; paridad integral sin cambio en 46,67%.
- El siguiente slice es `BIM-TASK-0134`, preview, aprobacion y rollback.

## 2026-07-13 - Intercambio Primavera P6 XML BIM

- `BIM-TASK-0132` cierra localmente P6 PMXML import-preview/export sin
  persistencia ni escritura clasica.
- Suite combinada: 36 pruebas verdes; XER y round-trip Oracle siguen abiertos.
- B02 pasa a parcial y la paridad integral demostrada queda en 46,67%.
- El siguiente slice es `BIM-TASK-0133`, XER condicionado a corpus autorizado.
- No se ha desplegado esta ola.

## 2026-07-13 - Intercambio MSPDI XML BIM

- `BIM-TASK-0131` cierra localmente import-preview y exportacion MSPDI sobre el
  contrato canonico BIM, sin escritura en Cronograma clasico.
- WBS anidada, excepciones de calendario, dependencias y asignaciones tienen
  round-trip interno; baselines y perdidas se reportan explicitamente.
- Pycompile, 30 pruebas ampliadas, matriz y baseline enterprise pasan.
- El siguiente slice es `BIM-TASK-0132`, import/export P6 XML.
- No se ha desplegado esta ola; la paridad integral demostrada sigue en 45,83%.

## 2026-07-13 - Inicio adecuacion integral SYNCHRO

- `BIM-TASK-0127` a `0130` cierran contrato, validador, factibilidad y
  preflight canonico de scheduling.
- La paridad integral demostrada parte de 45,83% (16 completas, 23 parciales,
  21 ausentes); el nucleo 4D previo conserva su 100%.
- El siguiente slice es `BIM-TASK-0131`, import/export MSPDI XML.
- No se ha realizado deploy de esta nueva ola; Gate E humano sigue abierto.

## 2026-07-13 - Planificacion 4D bidireccional desplegada

- `BIM-TASK-0126` integra timeline, Gantt y modelo en una superficie unica.
- Actividad -> GlobalIds y elemento -> actividades operan muchos-a-muchos sobre
  snapshots BIM, sin modificar Cronograma clasico.
- Deploy beta frontend-only completado; frontend, backend y PostgreSQL healthy.
- Dominio publico y chunk `BimTab-DIFbSNXO.js` responden `200`; endpoint BIM sin
  token responde `401` y los marcadores bidireccionales estan en el bundle.
- `BimTab` queda en `276630` bytes y el stack 3D en el chunk separado
  `bim-3d-JAfuxNS3.js`, evitando la regresion de bundle detectada en pre-cierre.
- Allowlist vigente sin cambios: `is_enabled=true`, `superadmin_only=false`,
  empresas `1,3`.
- Rollback remoto: `deploy/backups/bim-task-0126-20260713-195506` e imagen
  `giproy-beta-frontend:bim-task-0126-predeploy-20260713-195506`.
- Gate E humano continua pendiente.

## 2026-07-13 - Entitlement comercial BIM y licencias piloto

- `TASK-2027` y `BIM-TASK-0123` quedan cerradas y desplegadas en beta.
- BIM se incluye en Empresarial, Tester, Academica y Capacitacion; Estandar y
  Profesional pueden comprarlo por USD 99.99/mes; Express queda excluida.
- La activacion exige entitlement comercial y allowlist. Estado comprobado:
  empresas `1/3=true`, empresa `2=false` tanto local como en beta.
- Administradores Generales y Santiago Bermeo son Enterprise con vigencia
  original `2026-03-17` a `2027-03-12` preservada.
- Producto Marketplace activo: `sistema-pack-bim-mensual`, USD 99.99.
- Beta saludable y dominio publico HTTP 200. Gate E humano sigue pendiente.
- Rollback beta: dump/fuentes/asignaciones en `deploy/backups` con sello
  `20260713-2118` e imagenes `bim-commercial-predeploy-20260713-2118`.

## 2026-07-13 - Activación BIM exclusiva para empresas piloto

- `TASK-2026` activa BIM para `Administradores Generales` (`empresa_id=1`) y
  `Santiago Bermeo` (`empresa_id=3`) mediante `system_bim_settings`.
- Estado vigente: `is_enabled=true`, `superadmin_only=false`,
  `allowed_company_ids=1,3`.
- Una empresa no permitida queda denegada incluso con rol superadministrador;
  Proyectos oculta BIM al consumir la misma puerta backend.
- Auditoría `bim_pilot_allowlist_activated` conserva el estado previo para
  rollback. No se modificaron contratos ni datos clásicos.
- Gate E aún no inicia sus diez jornadas: faltan coordinador, usuario de
  negocio, fechas y dos revisiones reales. `bim_rollout_plans` no existe aún en
  la base local y requiere migración de despliegue separada.

## 2026-07-13 - Semáforos de planificación APU en Gantt clásico

- `TASK-2021` agrega un botón contextual en el rail superior del Gantt para la
  actividad/APU seleccionada.
- Hover abre temporalmente; clic fija; un segundo clic o `Desacoplar` recupera
  el modo hover. `Escape` cierra el panel.
- Se muestran ciclo y producción, `Fp`, duraciones, trabajo, cuadrilla nominal
  y equivalente, equipos, costos y cinco validaciones semánticas.
- El ejemplo documental pasa con `Pt=50`, `Pp=42,5`, `Dp=2,7205 h`,
  `Neq=3,3` y costo directo plan `0,9356`.
- Frontend puro y observacional: sin API/DB, auth, tenant, BIM ni cambios sobre
  la gobernanza actual. Build, smokes clásicos/anti-BIM y baseline pasan.
- La suite Gantt ampliada conserva dos fallos previos ajenos en dependencias;
  consultar TASK-2021 para la evidencia exacta.
- Despliegue local y beta completado como frontend-only. El dominio público y
  OpenAPI responden HTTP 200; frontend/backend/PostgreSQL quedan saludables y
  `BIM_ENABLED=false`.
- Rollback remoto preparado en
  `deploy/backups/task-2021-20260713-105655` y en la imagen
  `giproy-beta-frontend:task2021-predeploy-20260713-105655`.

## 2026-07-13 - Catálogo nacional RUC SRI

- `TASK-2020` retira EcuadorAPI y mueve la verificación fiscal a PostgreSQL,
  alimentado por los CSV oficiales del SRI.
- Beta tiene 24 provincias activas, 6.843.565 RUC, 0 rechazados y 0 conflictos;
  `0102260858001` queda verificado y aparece una sola vez.
- RUC empresarial obligatorio, único e inmutable en DB/API; revisión manual no
  crea empresa ni usuario hasta aprobación.
- Sincronización diaria activa a las 02:15 Ecuador mediante crontab persistente;
  las unidades systemd quedan preparadas a falta de sudo global.
- QA final: 29 pruebas focales, build, smokes clásicos/anti-BIM y baseline
  enterprise en verde. Suite global: 680 pasan y 15 fallos ajenos al slice.
- Backup predeploy y restore rehearsal verificados; consultar TASK-2020 para
  checksum y rollback exacto.

## 2026-07-13 - Hotfix de validacion RUC EcuadorAPI

- `TASK-2019` corrige el falso rechazo de RUC validos en el registro publico.
- EcuadorAPI responde la ficha bajo `data`; el backend esperaba campos en la
  raiz. El parser acepta ahora ambos contratos.
- QA focal: `5 passed`, baseline enterprise y anti-BIM en verde.
- Desplegado solo el backend beta; contenedor saludable y RUC autorizado
  confirmado mediante el endpoint publico.
- EcuadorAPI opera ahora con credito inicial temporal, no con free tier
  recurrente. La alternativa gratuita verificada es importar el catastro CSV
  oficial del SRI; queda pendiente una TASK independiente para el fallback.

## 2026-07-11 - BIM-TASK-0103 Productividad 4D/5D

- Cantidad BIM verificada alimenta rendimiento, cuadrilla, duracion y recurso.
- Metadatos de normalizacion y formula quedan persistidos en PostgreSQL de2015.
- Aprobacion es BIM-only y no escribe fuentes clasicas.
- `104` pruebas BIM, harness responsive, anti-BIM y baseline pasan.
- Siguiente: `BIM-TASK-0104`, evidencia y avance de campo.

## 2026-07-11 - BIM-TASK-0100/0102 Frentes y escenarios

- Frentes y componentes logicos referencian version, elementos y actividades.
- What-if persiste supuestos/metricas sin editar baseline, IFC ni Cronograma.
- Motor detecta violaciones FS/SS/FF/SF y conserva fechas fuente.
- PostgreSQL `de2014`, `102` pruebas BIM, harness y baseline pasan.
- Siguiente: `BIM-TASK-0103`, propuestas 4D/5D.

## 2026-07-11 - BIM-TASK-0098/0099 Plan-real 4D

- Baselines y dependencias son snapshots inmutables en PostgreSQL `de2013`.
- Desviacion usa metodologia lineal declarada y evidencia de progreso por corte.
- Viewpoints enfocan GUIDs dentro de BIM sin navegacion clasica.
- Panel responsive crea baseline/dependencias y consulta plan-real.
- `100` pruebas BIM, build, anti-BIM y baseline enterprise pasan.
- Siguiente: `BIM-TASK-0100`, frentes y areas BIM.

## 2026-07-11 - BIM-TASK-0095/0097 Simulacion 4D

- Progreso inmutable y timeline por fecha de corte permanecen en dominio BIM.
- Perfiles temporales controlan visibilidad/color de Fragments por GUID real.
- El modo 4D es explicito, reversible y apagado por defecto.
- PostgreSQL 18 valida upgrade/downgrade y servicios sobre base `_test` aislada.
- `99` pruebas BIM, build, harness desktop/movil, anti-BIM y baseline pasan.
- Siguiente: `BIM-TASK-0098`, baseline y desviacion plan-real.

## 2026-07-11 - BIM-TASK-0091/0094 Fundacion 4D

- Snapshots de actividad versionados evitan duplicar el cronograma fuente.
- Propuestas N:M vinculan actividad, version, elemento y GUID con decision.
- Capacidades 4D y auditoria permanecen dentro del dominio BIM.
- Panel 4D compacto pasa harness Chrome desktop/mobile sin overflow.
- `98` tests BIM, build, smokes anti-BIM y baseline enterprise pasan.
- Siguiente: `BIM-TASK-0095`, motor de estado temporal Fragments.

## 2026-07-11 - BIM-TASK-0087/0090 Enterprise y rollout local

- Capacidades BIM por empresa, auditoria, metricas sanitizadas y correlation id
  quedan implementados sin modificar auth/JWT ni permisos clasicos.
- Rollout exige todos los gates y ensayo de rollback antes de readiness.
- Rendimiento: Chrome/Edge desktop/tablet, 60 FPS, render maximo 848 ms,
  memoria estable y disposal correcto.
- `95` tests BIM, build, smokes BIM/anti-BIM y baseline enterprise pasan.
- 0086 sigue bloqueada por integracion clasica no autorizada; piloto real y
  Gate E siguen abiertos.

## 2026-07-11 - BIM-TASK-0085 Cantidades y propuestas 5D

- Cantidades muestran fuente, valor/unidad original y presentada, version,
  GUID, conversion y redondeo.
- Propuestas a EDT/Presupuesto/APU se aprueban o rechazan solo en tablas BIM.
- No se modifica ninguna fuente clasica; `90` tests BIM y anti-BIM pasan.
- `BIM-TASK-0086` requiere TASK clasica separada para activar retorno visible.

## 2026-07-11 - BIM-TASK-0083/0084 Incidencias BCF

- Topics BIM conservan GUID, version, viewpoint, seleccion, responsable,
  prioridad, estado, comentarios e historial.
- Import/export BCF-XML 2.1 roundtrip pasa.
- UX crea desde viewer, reabre contexto, asigna, comenta, revisa y cierra.
- `89` tests BIM, build, harness movil y anti-BIM pasan.
- Siguiente: `BIM-TASK-0085`, cantidades y vinculos 5D.

## 2026-07-11 - BIM-TASK-0082 IDS y cierre Gate C

- Perfiles IDS XML se persisten y ejecutan por version BIM.
- Hallazgos identifican requisito, severidad y GUID; excepciones conservan
  motivo, usuario y fecha.
- Panel importa, valida, enfoca, exceptua y exporta CSV.
- `86` tests BIM, migracion reversible, harness UI, build y anti-BIM pasan.
- Gate C cerrado. Siguiente: `BIM-TASK-0083`, incidencias BCF-compatible.

## 2026-07-11 - BIM-TASK-0081 Federacion por disciplina

- Federaciones y miembros se persisten en tablas BIM mediante migracion
  aditiva; cada cambio crea revision inmutable con autor y justificacion.
- Cada version conserva disciplina, transform, CRS, origen, unidades y estado.
- El viewport Fragments carga varias versiones y alterna disciplinas sin
  perder camara/seleccion cuando solo cambia visibilidad.
- Caso arquitectura + estructura + MEP alineado/desalineado, `83` tests BIM,
  harness WebGL, build y smokes BIM/anti-BIM pasan.
- Siguiente: `BIM-TASK-0082`, IDS y reglas de informacion.

## 2026-07-10 - BIM-TASK-0080 Comparacion de versiones

- Change set por GUID clasifica altas, bajas, geometria y propiedades.
- GUID cambiado usa fallback semantico unico y siempre declarado.
- Panel BIM filtra tipos y enfoca el elemento afectado.
- Dataset A/B, aislamiento tenant, build y anti-BIM pasan.
- Siguiente: `BIM-TASK-0081`, federacion por disciplina.

## 2026-07-10 - BIM-TASK-0079 Vistas reproducibles y Gate B

- Contrato `giproy_bim_view_state_v2` persiste y reproduce el viewer completo.
- Replay restaura camara, seleccion, visibilidad, colores, filtros, ghost,
  clipping, medicion y unidades; version cruzada queda incompatible.
- Roundtrip backend y harness WebGL pasan; vistas legacy siguen compatibles.
- 62 tests BIM y corpus real hasta 17.9 MB pasan; anti-BIM correcto.
- Gate B queda cerrado localmente. Siguiente: `BIM-TASK-0080`.

## 2026-07-10 - BIM-TASK-0078 Herramientas de revision

- Viewport Fragments incorpora ocultar, aislar, ghost, clipping, medicion,
  proyeccion y reset sobre APIs reales.
- Medicion usa volumen/caja Fragments y conserva unidades m/mm.
- Camara perspectiva/ortografica queda enlazada al worker y OrbitControls.
- Smokes desktop/movil por herramienta y matriz de producto pasan.
- Siguiente slice: `BIM-TASK-0079`, vistas reproducibles y cierre Gate B.

## 2026-07-10 - BIM-TASK-0077 Explorer BIM sincronizado

- Nuevo endpoint de busqueda BIM paginada conserva el listado anterior.
- Busca GUID, nombre, clase, nivel, sistema, clasificacion y propiedades JSON.
- Explorer alterna arbol/tabla, pagina 100 filas y comparte seleccion global.
- Raycast resuelve GUID aunque no este entre los 120 elementos precargados.
- 60 tests BIM, harness 1.005 elementos, build y smokes pasan.
- Siguiente slice: `BIM-TASK-0078`, herramientas de revision.

## 2026-07-10 - BIM-TASK-0076 Shell UX profesional

- `BimShellContextBar` mantiene empresa, proyecto, modelo y version visibles.
- Toolbar real alterna Fragments/2D, explorer e inspector y ejecuta reset/refresh.
- La carga administrativa queda colapsada y solo disponible al rol autorizado.
- Playwright desktop/tablet/mobile valida teclado, acciones, canvas y overflow.
- Build, smoke BIM, anti-BIM y guardas frontend pasan.
- Siguiente slice: `BIM-TASK-0077`, arbol, tabla y busqueda sincronizados.

## 2026-07-10 - BIM-TASK-0075 Viewport Fragments de producto

- `BimWorkspace` carga bytes Fragments desde el registry BIM y sincroniza
  seleccion nativa por GlobalId.
- ResizeObserver, OrbitControls, WebGL recovery y disposal quedan operativos.
- El viewer Three.js previo permanece como fallback sin artifact Fragments.
- Playwright desktop/tablet/mobile valida canvas no vacio, seleccion y overflow.
- Todos los procesos de validacion se monitorizaron y cerraron por PID.
- Siguiente slice: `BIM-TASK-0076`, shell UX profesional.

## 2026-07-10 - BIM-TASK-0074 Lifecycle artifacts y Gate A

- `de2004a1b2c3` agrega registro generacional para source IFC, viewer JSON e
  indices y Fragments con contratos/checksums.
- Hay regeneracion idempotente, escritura atomica, corrupcion/incompatibilidad
  detectable y rollback validado.
- API BIM permite listar, registrar derivados, validar y revertir artifacts.
- Gate A procesa corpus real S/M/L por jobs: 13/144/926 elementos, versiones
  inactivas, reportes sin errores y source artifacts trazables.
- Validacion: 70 pytest BIM, prueba Gate A 3.35 s, build y smokes correctos.
- Siguiente slice: `BIM-TASK-0075`, viewport Fragments de producto.

## 2026-07-10 - BIM-TASK-0073 Conformidad IFC y calidad base

- Se agrega contrato `giproy_bim_ifc_quality_v1`, sin claim de certificacion.
- STEP, schema y semantica GiProy quedan separados con findings vinculables.
- `de2003a1b2c3` persiste un reporte unico por version y tenant/proyecto.
- Jobs invalidos conservan analisis accionable; jobs exitosos persisten reporte
  dentro del savepoint de la version.
- API y `BimQualityReportPanel` exponen calidad de la version seleccionada.
- Validacion: 58 pytest BIM, build Vite, smoke BIM y anti-BIM correctos.
- Siguiente slice: `BIM-TASK-0074`, lifecycle versionado de artifacts.

## 2026-07-10 - BIM-TASK-0072 Job IFC observable

- Se agrega `bim_import_jobs` mediante migracion Alembic aditiva
  `de2002a1b2c3`, siempre acotada por `proyecto_id` y `empresa_id`.
- La importacion IFC dispone de API `202`, estado, etapa, progreso, intentos,
  cancelacion, error y resultado persistidos.
- La idempotencia usa tenant, proyecto, modelo, disciplina, version y checksum.
- La persistencia de version usa savepoint: un fallo no publica contenido
  parcial ni desactiva la version activa previa.
- Las versiones exitosas quedan `ready_for_review` e inactivas.
- `BimImportJobsPanel` incorpora carga, progreso, error, cancelar y reintentar
  con polling acotado a jobs activos y cleanup al desmontar.
- Validacion: 49 pytest BIM, py_compile, build Vite, smoke BIM positivo y smoke
  anti-BIM correctos.
- GiProy Clasico, TASK-1807, auth, tenant e infraestructura permanecen intactos.
- Siguiente slice: `BIM-TASK-0073`, conformidad IFC y calidad base.

## 2026-07-10 - BIM-TASK-0071 Corpus IFC real licenciado

Modo: GIPROY BIM.

Resultado:

- Cinco IFC oficiales buildingSMART CC BY 4.0 quedan registrados fisicamente
  con manifiesto y checksum: tres PCERT IFC4 y dos Duplex IFC2x3.
- Se cubren arquitectura, estructura y MEP en tiers de regresion S/M/L y una
  federacion de cinco miembros.
- El corpus detecto y corrigio la omision de clases MEP genericas IFC2x3 en el
  parser textual BIM.
- Parser: 20954197 bytes, 1103 elementos; Fragments: cinco conversiones reales
  no vacias con `IfcImporter` y WASM local.

Validacion:

- 49 pytest BIM, py_compile, smoke BIM positivo, smoke de corpus real, smoke
  anti-BIM y build Vite en verde.
- Warnings conocidos no bloqueantes conservados.

No interferencia:

- Sin cambios clasicos, DB real, auth, tenant, TASK-1807 o infraestructura.

Siguiente slice:

- `BIM-TASK-0072`: job de importacion observable, persistente e idempotente.

## 2026-07-10 - BIM-TASK-0070 Benchmark y plan de adecuacion final BIM

Modo: GIPROY BIM.

Alcance:

- Benchmark oficial de productos BIM y estandares openBIM.
- Adecuacion final backend, frontend, datos, UX/UI y operacion.
- Trabajo solo documental.

Resultado:

- `docs/architecture/BIM_FINAL_ADEQUACY_PLAN.md` consolida las brechas reales
  de GiProy frente a buildingSMART/ISO y patrones de Autodesk, Trimble, Dalux,
  Solibri y Bentley.
- Se diferencia certificacion IFC formal de conformidad demostrada; no se
  atribuye certificacion actual a GiProy.
- Se propone backlog vertical `BIM-TASK-0071` a `BIM-TASK-0090` y gates A-E.
- Tras revision guiada se confirman 29 decisiones de producto y arquitectura,
  consolidadas como baseline vinculante en la seccion 12 del plan.
- Las decisiones cubren alcance BIM 1.0, usuario principal, corpus real, jobs,
  versionado, IFC, Fragments, UX/mobile, gates, BCF, GUID, federacion, permisos,
  retencion, rendimiento, visual, conformidad, rollout, vistas, quantities,
  issues, observabilidad, piloto, reportes y unidades.
- El 100% queda condicionado a un piloto real de al menos 10 dias habiles y dos
  revisiones de modelo; esta aprobacion documental no cambia el estado del codigo.
- El orden inmediato queda: datasets reales, job observable, viewport
  Fragments final y shell UX profesional.
- `BIM-TASK-0008` queda alineada como parcialmente implementada, sin confundir
  los smokes existentes con la matriz de liberacion todavia pendiente.

Validacion:

- Fuentes oficiales enlazadas directamente desde el plan.
- Indices BIM, CHANGELOG, HANDOFF y TASK BIM actualizados.
- Sin cambios JSON productivos; referencias Markdown verificadas.

No interferencia clasica:

- Sin frontend/backend, DB real, auth, tenant, rutas o contratos API.
- Sin cambios en TASK-1807 ni sus guardas.
- Sin Docker, Coolify, CI/CD, staging, produccion o deploy.

Pendiente recomendado:

- Abrir `BIM-TASK-0071` solo cuando exista autorizacion para incorporar los
  datasets IFC reales con licencia/procedencia trazables.

## 2026-07-10 - BIM-TASK-0069 Seleccion por puntero en canvas fragments nativo

Modo: GIPROY BIM.

Alcance:

- Frontend BIM aislado.
- Harness fragments nativo.
- Smokes BIM/DOM.

Cambios:

- `BimFragmentsHarness.jsx` registra `pointerdown` sobre el canvas WebGL
  fragments nativo.
- El evento ejecuta `model.raycast` con coordenadas reales del puntero y
  actualiza `localId`, `GlobalId`, `ItemData`, visibilidad y operacion.
- El harness expone `data-bim-fragments-native-pointer-selection="enabled"` y
  chip compacto `Puntero activo`.
- `validate-bim-viewer-dom.mjs` dispara `PointerEvent` real y valida seleccion,
  `GlobalId`, claves `ItemData` y canvas no vacio en desktop/mobile.

Validacion:

- `cmd /c node frontend\scripts\smoke-bim-workspace-positive.mjs`: OK.
- `cmd /c node scripts\validate-bim-viewer-dom.mjs` desde `frontend`: OK.
- `cmd /c node scripts\smoke-classic-no-bim-contamination.mjs` desde
  `frontend`: OK.
- `cmd /c npm run build` desde `frontend`: OK, con warning conocido de chunks
  grandes Vite/CronogramaGantt.
- `rg "console\.log" frontend/src -n`: sin resultados.
- `rg "axiosConfig" frontend/src/components frontend/src/hooks frontend/src/context frontend/src/features frontend/src/pages -n`: sin resultados.

No interferencia clasica:

- No se tocaron rutas, contratos API, tenant, auth ni pantallas clasicas.
- BIM sigue en harness/componentes BIM aislados.
- La guarda anti-BIM con flag apagada queda validada.

Pendiente recomendado:

- Avanzar a dataset IFC real autorizado o integrar seleccion/propiedades
  nativas del canvas fragments en el viewer 3D BIM maduro fuera del harness.

## 2026-07-09 - BIM-TASK-0068 Filtro de categoria en canvas fragments nativo

Modo: GIPROY BIM.

Alcance:

- Frontend BIM aislado.
- Harness fragments nativo.
- Smokes BIM/DOM.

Cambios:

- `BimFragmentsHarness.jsx` agrega control compacto `Solo cat.` para aislar la
  categoria IFC activa en el canvas fragments nativo.
- El filtro usa `getLocalIds`, `getItemsOfCategories`, `resetVisible` y
  `toggleVisible` sobre localIds reales de `FragmentsModels`.
- El harness expone estado trazable con
  `data-bim-fragments-native-category-filter` y
  `data-bim-fragments-native-category-filtered-local-ids`.
- `validate-bim-viewer-dom.mjs` pulsa el filtro, valida categoria aislada,
  localIds reales y reset a filtro total.

Validacion:

- `cmd /c node frontend\scripts\smoke-bim-workspace-positive.mjs`: OK.
- `cmd /c node scripts\validate-bim-viewer-dom.mjs` desde `frontend`: OK.
- `cmd /c node scripts\smoke-classic-no-bim-contamination.mjs` desde
  `frontend`: OK.
- `cmd /c npm run build` desde `frontend`: OK, con warning conocido de chunks
  grandes Vite/CronogramaGantt.
- `rg "console\.log" frontend/src -n`: sin resultados.
- `rg "axiosConfig" frontend/src/components frontend/src/hooks frontend/src/context frontend/src/features frontend/src/pages -n`: sin resultados.

No interferencia clasica:

- No se tocaron rutas, contratos API, tenant, auth ni pantallas clasicas.
- BIM sigue en harness/componentes BIM aislados.
- La guarda anti-BIM con flag apagada queda validada.

Pendiente recomendado:

- Avanzar a dataset IFC real autorizado o madurar el viewer fragments final con
  seleccion/propiedades nativas integradas fuera del harness.

## 2026-07-09 - BIM-TASK-0067 Visibilidad por categoria en canvas fragments nativo

Modo: GIPROY BIM.

Estado: cerrado localmente.

Resultado:

- `BimFragmentsHarness.jsx` re-renderiza el canvas fragments nativo tras
  alternar/restaurar visibilidad por categoria IFC.
- Los controles de categoria exponen atributos DOM para toggle y reset.
- El smoke DOM valida reduccion de visibles, aumento de ocultos, restauracion y
  operacion trazable.

Validacion:

- `cmd /c node frontend\scripts\smoke-bim-workspace-positive.mjs`: OK.
- `cmd /c node scripts\validate-bim-viewer-dom.mjs` desde `frontend`: OK.
- `cmd /c node scripts\smoke-classic-no-bim-contamination.mjs` desde
  `frontend`: OK.
- `cmd /c npm run build` desde `frontend`: OK, con warning conocido de chunks
  grandes Vite/CronogramaGantt.
- `rg "console\.log" frontend/src -n`: sin resultados.
- `rg "axiosConfig" frontend/src/components frontend/src/hooks frontend/src/context frontend/src/features frontend/src/pages -n`: sin resultados.

No interferencia:

- Trabajo solo local; sin deploy a `giproy.excomconsultores.com`.
- Sin backend, migraciones, DB real, Docker/Coolify ni UX clasica nueva.
- `Proyectos.jsx` conserva BIM forzado apagado por `CLASSIC_BIM_ACCESS_DISABLED`.

Pendiente recomendado:

- Evolucionar las acciones nativas fragments hacia propiedades/filtros del
  canvas real y sumar datasets IFC reales autorizados.

## 2026-07-09 - BIM-TASK-0066 Visibilidad de seleccion nativa fragments en harness BIM

Modo: GIPROY BIM.

Estado: cerrado localmente.

Resultado:

- `BimFragmentsHarness.jsx` alterna visibilidad del `localId` seleccionado por
  raycasting nativo con `model.toggleVisible([localId])`.
- El harness expone `data-bim-fragments-native-selection-visible` y re-renderiza
  el canvas nativo tras el cambio.
- La UI agrega control compacto `Sel.` alineado con Proyectos.

Validacion:

- `cmd /c node frontend\scripts\smoke-bim-workspace-positive.mjs`: OK.
- `cmd /c node scripts\validate-bim-viewer-dom.mjs` desde `frontend`: OK.
- `cmd /c node scripts\smoke-classic-no-bim-contamination.mjs` desde
  `frontend`: OK.
- `cmd /c npm run build` desde `frontend`: OK, con warning conocido de chunks
  grandes Vite/CronogramaGantt.
- `rg "console\.log" frontend/src -n`: sin resultados.
- `rg "axiosConfig" frontend/src/components frontend/src/hooks frontend/src/context frontend/src/features frontend/src/pages -n`: sin resultados.

No interferencia:

- Trabajo solo local; sin deploy a `giproy.excomconsultores.com`.
- Sin backend, migraciones, DB real, Docker/Coolify ni UX clasica nueva.
- `Proyectos.jsx` conserva BIM forzado apagado por `CLASSIC_BIM_ACCESS_DISABLED`.

Pendiente recomendado:

- Evolucionar seleccion/visibilidad nativas hacia propiedades y filtros del
  viewer fragments real, y sumar datasets IFC reales autorizados.

## 2026-07-09 - BIM-TASK-0065 Seleccion ItemData nativa fragments en harness BIM

Modo: GIPROY BIM.

Estado: cerrado localmente.

Resultado:

- `BimFragmentsHarness.jsx` conecta el hit de `model.raycast` con
  `model.getItemsData([localId])`.
- El harness expone claves, nombre, tipo y categoria de la seleccion nativa en
  DOM.
- La UI agrega bloque `Seleccion fragments` compacto y alineado con Proyectos.

Validacion:

- `cmd /c node frontend\scripts\smoke-bim-workspace-positive.mjs`: OK.
- `cmd /c node scripts\validate-bim-viewer-dom.mjs` desde `frontend`: OK.
- `cmd /c node scripts\smoke-classic-no-bim-contamination.mjs` desde
  `frontend`: OK.
- `cmd /c npm run build` desde `frontend`: OK, con warning conocido de chunks
  grandes Vite/CronogramaGantt.
- `rg "console\.log" frontend/src -n`: sin resultados.
- `rg "axiosConfig" frontend/src/components frontend/src/hooks frontend/src/context frontend/src/features frontend/src/pages -n`: sin resultados.

No interferencia:

- Trabajo solo local; sin deploy a `giproy.excomconsultores.com`.
- Sin backend, migraciones, DB real, Docker/Coolify ni UX clasica nueva.
- `Proyectos.jsx` conserva BIM forzado apagado por `CLASSIC_BIM_ACCESS_DISABLED`.

Pendiente recomendado:

- Evolucionar esta seleccion nativa hacia propiedades/filtros/visibilidad del
  canvas fragments real y sumar datasets IFC reales autorizados.

## 2026-07-09 - BIM-TASK-0064 Raycasting nativo fragments en harness BIM

Modo: GIPROY BIM.

Estado: cerrado localmente.

Resultado:

- `BimFragmentsHarness.jsx` monta `model.object` de `FragmentsModels` en canvas
  WebGL aislado.
- El harness registra la camara con `model.useCamera(camera)` y ejecuta
  `model.raycast({ camera, mouse, dom })` con coordenadas reales del canvas.
- El resultado expone hit, `localId` y `GlobalId` en DOM.
- La UI agrega bloque `Raycast fragments` compacto y alineado con Proyectos.

Validacion:

- `cmd /c node frontend\scripts\smoke-bim-workspace-positive.mjs`: OK.
- `cmd /c node scripts\validate-bim-viewer-dom.mjs` desde `frontend`: OK.
- `cmd /c node scripts\smoke-classic-no-bim-contamination.mjs` desde
  `frontend`: OK.
- `cmd /c npm run build` desde `frontend`: OK, con warning conocido de chunks
  grandes Vite/CronogramaGantt.

No interferencia:

- Trabajo solo local; sin deploy a `giproy.excomconsultores.com`.
- Sin backend, migraciones, DB real, Docker/Coolify ni UX clasica nueva.
- `Proyectos.jsx` conserva BIM forzado apagado por `CLASSIC_BIM_ACCESS_DISABLED`.

Pendiente recomendado:

- Conectar el raycasting nativo validado a seleccion, propiedades, filtros y
  visibilidad del viewer fragments real, y sumar datasets IFC reales
  autorizados.

## 2026-07-09 - BIM-TASK-0063 ItemData batch por categoria IFC en fragments

Modo: GIPROY BIM.

Estado: cerrado localmente.

Resultado:

- `BimFragmentsHarness.jsx` consulta `ItemData` batch sobre una muestra de
  localIds reales de la categoria IFC activa.
- El harness expone conteo de items, conteo de claves y nombres de claves en
  DOM.
- La UI agrega bloque `ItemData categoria` compacto y alineado con Proyectos.

Validacion:

- `cmd /c node frontend\scripts\smoke-bim-workspace-positive.mjs`: OK.
- `cmd /c node scripts\validate-bim-viewer-dom.mjs` desde `frontend`: OK.
- `cmd /c node scripts\smoke-classic-no-bim-contamination.mjs` desde
  `frontend`: OK.
- `cmd /c npm run build` desde `frontend`: OK, con warning conocido de chunks
  grandes Vite/CronogramaGantt.

No interferencia:

- Trabajo solo local; sin deploy a `giproy.excomconsultores.com`.
- Sin backend, migraciones, DB real, Docker/Coolify ni UX clasica nueva.
- `Proyectos.jsx` conserva BIM forzado apagado por `CLASSIC_BIM_ACCESS_DISABLED`.

Pendiente recomendado:

- Conectar esta lectura batch a seleccion/raycasting nativo de `FragmentsModels`
  y datasets IFC reales autorizados.

## 2026-07-09 - BIM-TASK-0062 Trazabilidad GUID bidireccional en fragments

Modo: GIPROY BIM.

Estado: cerrado localmente.

Resultado:

- `BimFragmentsHarness.jsx` valida roundtrip `localId -> GlobalId -> localId`
  mediante `getGuidsByLocalIds` y `getLocalIdsByGuids`.
- El harness expone GUID, localId resuelto y match en DOM.
- La UI agrega bloque `Trazabilidad GUID` compacto y alineado con Proyectos.

Validacion:

- `cmd /c node frontend\scripts\smoke-bim-workspace-positive.mjs`: OK.
- `cmd /c node scripts\validate-bim-viewer-dom.mjs` desde `frontend`: OK.
- `cmd /c node scripts\smoke-classic-no-bim-contamination.mjs` desde
  `frontend`: OK.
- `cmd /c npm run build` desde `frontend`: OK, con warning conocido de chunks
  grandes Vite/CronogramaGantt.

No interferencia:

- Trabajo solo local; sin deploy a `giproy.excomconsultores.com`.
- Sin backend, migraciones, DB real, Docker/Coolify ni UX clasica nueva.
- `Proyectos.jsx` conserva BIM forzado apagado por `CLASSIC_BIM_ACCESS_DISABLED`.

Pendiente recomendado:

- Usar esta trazabilidad para raycasting nativo de `FragmentsModels` y datasets
  IFC reales autorizados.

## 2026-07-09 - BIM-TASK-0061 Subset fragments por categoria IFC

Modo: GIPROY BIM.

Estado: cerrado localmente.

Resultado:

- `BimFragmentsHarness.jsx` genera subset binario de la categoria IFC activa
  mediante `getSubsetBuffer(localIds, false)`.
- El harness expone bytes del subset en DOM con
  `data-bim-fragments-category-subset-bytes`.
- La UI agrega bloque `Subset fragments` compacto y alineado con Proyectos.

Validacion:

- `cmd /c node frontend\scripts\smoke-bim-workspace-positive.mjs`: OK.
- `cmd /c node scripts\validate-bim-viewer-dom.mjs` desde `frontend`: OK.
- `cmd /c node scripts\smoke-classic-no-bim-contamination.mjs` desde
  `frontend`: OK.
- `cmd /c npm run build` desde `frontend`: OK, con warning conocido de chunks
  grandes Vite/CronogramaGantt.

No interferencia:

- Trabajo solo local; sin deploy a `giproy.excomconsultores.com`.
- Sin backend, migraciones, DB real, Docker/Coolify ni UX clasica nueva.
- `Proyectos.jsx` conserva BIM forzado apagado por `CLASSIC_BIM_ACCESS_DISABLED`.

Pendiente recomendado:

- Conectar subsets/seleccion a viewer 3D maduro sobre fragments y datasets IFC
  reales autorizados.

## 2026-07-09 - BIM-TASK-0060 Medicion por categoria IFC en fragments

Modo: GIPROY BIM.

Estado: cerrado localmente.

Resultado:

- `BimFragmentsHarness.jsx` mide la categoria IFC activa desde
  `FragmentsModels`.
- El harness expone volumen, caja fusionada disponible y definiciones de
  material de la categoria en DOM.
- La UI agrega bloque `Medicion categoria` compacto y alineado con Proyectos.

Validacion:

- `cmd /c node frontend\scripts\smoke-bim-workspace-positive.mjs`: OK.
- `cmd /c node scripts\validate-bim-viewer-dom.mjs` desde `frontend`: OK.
- `cmd /c node scripts\smoke-classic-no-bim-contamination.mjs` desde
  `frontend`: OK.
- `cmd /c npm run build` desde `frontend`: OK, con warning conocido de chunks
  grandes Vite/CronogramaGantt.

No interferencia:

- Trabajo solo local; sin deploy a `giproy.excomconsultores.com`.
- Sin backend, migraciones, DB real, Docker/Coolify ni UX clasica nueva.
- `Proyectos.jsx` conserva BIM forzado apagado por `CLASSIC_BIM_ACCESS_DISABLED`.

Pendiente recomendado:

- Avanzar con trazabilidad fragments por subset/categoria o datasets IFC reales
  autorizados antes de declarar viewer 3D maduro.

## 2026-07-09 - BIM-TASK-0059 Geometria y medicion fragments en harness BIM

Modo: GIPROY BIM.

Estado: cerrado localmente.

Resultado:

- `BimFragmentsHarness.jsx` consulta geometria y medicion nativa desde
  `FragmentsModels`.
- El harness expone items con geometria, cajas, volumen y definiciones de
  material en DOM.
- La UI agrega bloque `Geometria fragments` compacto y alineado con Proyectos.

Validacion:

- `cmd /c node frontend\scripts\smoke-bim-workspace-positive.mjs`: OK.
- `cmd /c node scripts\validate-bim-viewer-dom.mjs` desde `frontend`: OK.
- `cmd /c node scripts\smoke-classic-no-bim-contamination.mjs` desde
  `frontend`: OK.
- `cmd /c npm run build` desde `frontend`: OK, con warning conocido de chunks
  grandes Vite/CronogramaGantt.

No interferencia:

- Trabajo solo local; sin deploy a `giproy.excomconsultores.com`.
- Sin backend, migraciones, DB real, Docker/Coolify ni UX clasica nueva.
- `Proyectos.jsx` conserva BIM forzado apagado por `CLASSIC_BIM_ACCESS_DISABLED`.

Pendiente recomendado:

- Conectar mediciones fragments al inspector 3D maduro y a datasets IFC reales
  autorizados.

## 2026-07-09 - BIM-TASK-0058 Estructura espacial real en harness fragments

Modo: GIPROY BIM.

Estado: cerrado localmente.

Resultado:

- `BimFragmentsHarness.jsx` consulta `getSpatialStructure()` desde
  `FragmentsModels`.
- El harness expone nodos, profundidad, hijos de raiz y nombre/tipo raiz en DOM.
- La UI agrega bloque `Estructura espacial` compacto y alineado con Proyectos.

Validacion:

- `cmd /c node frontend\scripts\smoke-bim-workspace-positive.mjs`: OK.
- `cmd /c node scripts\validate-bim-viewer-dom.mjs` desde `frontend`: OK.
- `cmd /c node scripts\smoke-classic-no-bim-contamination.mjs` desde
  `frontend`: OK.
- `cmd /c npm run build` desde `frontend`: OK, con warning conocido de chunks
  grandes Vite/CronogramaGantt.

No interferencia:

- Trabajo solo local; sin deploy a `giproy.excomconsultores.com`.
- Sin backend, migraciones, DB real, Docker/Coolify ni UX clasica nueva.
- `Proyectos.jsx` conserva BIM forzado apagado por `CLASSIC_BIM_ACCESS_DISABLED`.

Pendiente recomendado:

- Usar estructura espacial nativa para arbol/filtro maduro del viewer 3D sobre
  dataset real autorizado.

## 2026-07-09 - BIM-TASK-0057 Inspector ItemData profundo en fragments

Modo: GIPROY BIM.

Estado: cerrado localmente.

Resultado:

- `BimFragmentsHarness.jsx` muestra inspector `ItemData` con claves reales,
  `GlobalId` resuelto y tipo/clase IFC.
- Cuando el `ItemData` no trae `ObjectType` o `PredefinedType`, el tipo se
  resuelve contra `getCategories` y `getItemsOfCategories`.
- El inspector expone `data-bim-fragments-sample-*` para verificacion DOM.

Validacion:

- `cmd /c node frontend\scripts\smoke-bim-workspace-positive.mjs`: OK.
- `cmd /c node scripts\validate-bim-viewer-dom.mjs` desde `frontend`: OK.
- `cmd /c node scripts\smoke-classic-no-bim-contamination.mjs` desde
  `frontend`: OK.
- `cmd /c npm run build` desde `frontend`: OK, con warning conocido de chunks
  grandes Vite/CronogramaGantt.

No interferencia:

- Trabajo solo local; sin deploy a `giproy.excomconsultores.com`.
- Sin backend, migraciones, DB real, Docker/Coolify ni UX clasica nueva.
- `Proyectos.jsx` conserva BIM forzado apagado por `CLASSIC_BIM_ACCESS_DISABLED`.

Pendiente recomendado:

- Conectar raycasting nativo de `FragmentsModels` y propiedades nativas sobre
  dataset real autorizado.

## 2026-07-09 - BIM-TASK-0056 Visibilidad IFC 3D operativa en viewer BIM

Modo: GIPROY BIM.

Estado: cerrado localmente.

Resultado:

- `BimThreeViewer.jsx` permite ocultar/restaurar clases IFC en la escena 3D.
- Los controles `Visibilidad 3D` exponen clases ocultas, visibles y elementos
  filtrados en DOM.
- El harness DOM/WebGL pulsa un control real de visibilidad y valida reset.

Validacion:

- `cmd /c node frontend\scripts\smoke-bim-workspace-positive.mjs`: OK.
- `cmd /c node scripts\validate-bim-viewer-dom.mjs` desde `frontend`: OK.
- `cmd /c node frontend\scripts\smoke-classic-no-bim-contamination.mjs`: OK.
- `npm run build` desde `frontend`: OK, con warning conocido de chunks grandes
  Vite/CronogramaGantt.

No interferencia:

- Trabajo solo local; sin deploy a `giproy.excomconsultores.com`.
- Sin backend, migraciones, DB real, Docker/Coolify ni UX clasica nueva.
- `Proyectos.jsx` conserva BIM forzado apagado por `CLASSIC_BIM_ACCESS_DISABLED`.

Pendiente recomendado:

- Migrar visibilidad a `FragmentsModels` nativo cuando exista dataset real
  autorizado y selector fragments maduro.

## 2026-07-09 - BIM-TASK-0055 Filtro IFC 3D operativo en viewer BIM

Modo: GIPROY BIM.

Estado: cerrado localmente.

Resultado:

- `BimThreeViewer.jsx` filtra la escena 3D por clase IFC real.
- El filtro 3D expone filtro activo, elementos filtrados y cantidad de filtros
  en DOM.
- Los controles `IFC 3D` siguen lenguaje compacto alineado con Proyectos.

Validacion:

- `cmd /c node frontend\scripts\smoke-bim-workspace-positive.mjs`: OK.
- `cmd /c node scripts\validate-bim-viewer-dom.mjs` desde `frontend`: OK.
- `cmd /c node frontend\scripts\smoke-classic-no-bim-contamination.mjs`: OK.
- `npm run build` desde `frontend`: OK, con warning conocido de chunks grandes
  Vite/CronogramaGantt.

No interferencia:

- Trabajo solo local; sin deploy a `giproy.excomconsultores.com`.
- Sin backend, migraciones, DB real, Docker/Coolify ni UX clasica nueva.
- `Proyectos.jsx` conserva BIM forzado apagado por `CLASSIC_BIM_ACCESS_DISABLED`.

Pendiente recomendado:

- Trasladar filtros y visibilidad a `FragmentsModels` nativo con dataset real
  autorizado.

## 2026-07-09 - BIM-TASK-0054 Inspector 3D contextual del viewer BIM

Modo: GIPROY BIM.

Estado: cerrado localmente.

Resultado:

- `BimThreeViewer.jsx` muestra inspector 3D contextual para hover/seleccion.
- El inspector expone elemento, `GlobalId` y conteo de propiedades en DOM.
- El panel usa datos reales del elemento BIM o del artefacto viewer, no mocks.

Validacion:

- `cmd /c node frontend\scripts\smoke-bim-workspace-positive.mjs`: OK.
- `cmd /c node scripts\validate-bim-viewer-dom.mjs` desde `frontend`: OK.
- `cmd /c node frontend\scripts\smoke-classic-no-bim-contamination.mjs`: OK.
- `npm run build` desde `frontend`: OK, con warning conocido de chunks grandes
  Vite/CronogramaGantt.

No interferencia:

- Trabajo solo local; sin deploy a `giproy.excomconsultores.com`.
- Sin backend, migraciones, DB real, Docker/Coolify ni UX clasica nueva.
- `Proyectos.jsx` conserva BIM forzado apagado por `CLASSIC_BIM_ACCESS_DISABLED`.

Pendiente recomendado:

- Conectar propiedades nativas de `FragmentsModels` y raycasting nativo sobre
  fragments cuando exista dataset real autorizado.

## 2026-07-09 - BIM-TASK-0053 Hover 3D con raycasting trazable

Modo: GIPROY BIM.

Estado: cerrado localmente.

Resultado:

- `BimThreeViewer.jsx` detecta hover de elementos BIM sobre el canvas WebGL con
  `THREE.Raycaster`.
- El hover 3D expone elemento, `GlobalId` y clase IFC en DOM.
- El harness DOM/WebGL dispara `pointermove` real y valida el hover trazable.

Validacion:

- `cmd /c node frontend\scripts\smoke-bim-workspace-positive.mjs`: OK.
- `cmd /c node scripts\validate-bim-viewer-dom.mjs` desde `frontend`: OK.

No interferencia:

- Trabajo solo local; sin deploy a `giproy.excomconsultores.com`.
- Sin backend, migraciones, DB real, Docker/Coolify ni UX clasica nueva.
- `Proyectos.jsx` conserva BIM forzado apagado por `CLASSIC_BIM_ACCESS_DISABLED`.

Pendiente recomendado:

- Hover/raycasting nativo de `FragmentsModels` con dataset real autorizado.
- Propiedades conectadas al hit fragments.

## 2026-07-09 - BIM-TASK-0052 Foco 3D de elemento seleccionado

Modo: GIPROY BIM.

Estado: cerrado localmente.

Resultado:

- `BimThreeViewer.jsx` enfoca el elemento BIM seleccionado ajustando camara y
  `OrbitControls.target`.
- El foco 3D expone elemento y `GlobalId` de forma trazable en DOM.
- El harness DOM/WebGL hace click real sobre `Enfocar elemento` y valida el
  foco.

Validacion:

- `cmd /c node frontend\scripts\smoke-bim-workspace-positive.mjs`: OK.
- `cmd /c node scripts\validate-bim-viewer-dom.mjs` desde `frontend`: OK.

No interferencia:

- Trabajo solo local; sin deploy a `giproy.excomconsultores.com`.
- Sin backend, migraciones, DB real, Docker/Coolify ni UX clasica nueva.
- `Proyectos.jsx` conserva BIM forzado apagado por `CLASSIC_BIM_ACCESS_DISABLED`.

Pendiente recomendado:

- Foco y propiedades sobre `FragmentsModels` con dataset real autorizado.
- Pruebas de rendimiento de viewer 3D maduro.

## 2026-07-09 - BIM-TASK-0051 Navegacion 3D profesional con OrbitControls

Modo: GIPROY BIM.

Estado: cerrado localmente.

Resultado:

- `BimThreeViewer.jsx` usa `OrbitControls` de Three.js para orbitar, panear y
  navegar la escena 3D.
- Se elimina la dependencia de autorrotacion demostrativa.
- Se agrega `Reset vista 3D` con lenguaje visual compacto alineado con
  Proyectos.
- El harness DOM/WebGL exige navegacion OrbitControls y control visible.

Validacion:

- `cmd /c node frontend\scripts\smoke-bim-workspace-positive.mjs`: OK.
- `cmd /c node scripts\validate-bim-viewer-dom.mjs` desde `frontend`: OK.

No interferencia:

- Trabajo solo local; sin deploy a `giproy.excomconsultores.com`.
- Sin backend, migraciones, DB real, Docker/Coolify ni UX clasica nueva.
- `Proyectos.jsx` conserva BIM forzado apagado por `CLASSIC_BIM_ACCESS_DISABLED`.

Pendiente recomendado:

- Raycasting nativo de `FragmentsModels` conectado a propiedades reales.
- Dataset real autorizado y pruebas de rendimiento.

## 2026-07-09 - BIM-TASK-0050 Seleccion 3D con raycasting en viewer BIM

Modo: GIPROY BIM.

Estado: cerrado localmente.

Resultado:

- `BimThreeViewer.jsx` selecciona mallas BIM renderizadas mediante
  `THREE.Raycaster`.
- El hit 3D expone elemento, `GlobalId` y clase IFC de forma trazable en DOM.
- El viewer 3D sincroniza la seleccion con el estado BIM compartido.
- El harness DOM/WebGL hace clicks reales sobre el canvas 3D y valida el hit.

Validacion:

- `cmd /c node frontend\scripts\smoke-bim-workspace-positive.mjs`: OK.
- `cmd /c node scripts\validate-bim-viewer-dom.mjs` desde `frontend`: OK.

No interferencia:

- Trabajo solo local; sin deploy a `giproy.excomconsultores.com`.
- Sin backend, migraciones, DB real, Docker/Coolify ni UX clasica nueva.
- `Proyectos.jsx` conserva BIM forzado apagado por `CLASSIC_BIM_ACCESS_DISABLED`.

Pendiente recomendado:

- Raycasting nativo de `FragmentsModels` conectado a propiedades reales.
- Dataset real autorizado y pruebas de rendimiento.

## 2026-07-09 - BIM-TASK-0049 Filtro operativo IFC en canvas BIM

Modo: GIPROY BIM.

Estado: cerrado localmente.

Resultado:

- `BimCanvasViewer.jsx` filtra elementos reales del canvas por clase IFC.
- Los controles compactos `Todas` y clases IFC detectadas siguen el patron
  visual de chips/botones usado en Proyectos.
- El harness DOM expone filtro activo, clases disponibles y elementos filtrados.
- El smoke BIM positivo protege el filtro como comportamiento operativo, no como
  texto decorativo.

Validacion:

- `cmd /c node frontend\scripts\smoke-bim-workspace-positive.mjs`: OK.
- `cmd /c node scripts\validate-bim-viewer-dom.mjs` desde `frontend`: OK.
- `cmd /c node frontend\scripts\smoke-classic-no-bim-contamination.mjs`: OK.
- `npm run build` desde `frontend`: OK, warning conocido por chunk
  `CronogramaGantt`.

No interferencia:

- Trabajo solo local; sin deploy a `giproy.excomconsultores.com`.
- Sin backend, migraciones, DB real, Docker/Coolify ni UX clasica nueva.
- `Proyectos.jsx` conserva BIM forzado apagado por `CLASSIC_BIM_ACCESS_DISABLED`.

Pendiente recomendado:

- Viewer 3D maduro sobre fragments con seleccion/raycasting y propiedades.
- Dataset real autorizado y pruebas de rendimiento.

## 2026-07-09 - BIM-TASK-0048 Inspector y controles frontend de fragments

Modo: GIPROY BIM.

Estado: cerrado localmente.

Resultado:

- `BimFragmentsHarness.jsx` muestra un inspector operativo alineado con el look
  & feel de Proyectos.
- El harness expone localId, GlobalId, `ItemData`, categorias IFC, categoria
  activa, localIds, visibles, ocultos y totales de visibilidad.
- Se agregan controles reales sobre `FragmentsModels`: seleccion de categoria,
  alternar visibilidad y reset.
- El smoke DOM exige controles visibles, datos reales y ausencia de overflow en
  desktop/mobile.

Validacion:

- `cmd /c node frontend\scripts\smoke-bim-workspace-positive.mjs`: OK.
- `cmd /c node scripts\validate-bim-viewer-dom.mjs` desde `frontend`: OK.
- `cmd /c node frontend\scripts\smoke-classic-no-bim-contamination.mjs`: OK.
- `npm run build` desde `frontend`: OK, warning conocido por chunk
  `CronogramaGantt`.

No interferencia:

- Trabajo solo local; sin deploy a `giproy.excomconsultores.com`.
- Sin backend, migraciones, DB real, Docker/Coolify ni UX clasica nueva.
- `Proyectos.jsx` conserva BIM forzado apagado por `CLASSIC_BIM_ACCESS_DISABLED`.

Pendiente recomendado:

- Viewer 3D maduro sobre fragments con seleccion/raycasting conectada al canvas.
- Dataset real autorizado y pruebas de rendimiento.

## 2026-07-09 - BIM-TASK-0047 Consulta ItemData desde FragmentsModels

Modo: GIPROY BIM.

Estado: cerrado localmente.

Resultado:

- `BimFragmentsHarness.jsx` consulta `getItemsData` sobre el primer localId.
- El harness expone item data, localId y GlobalId de muestra en DOM.
- `validate-bim-viewer-dom.mjs` exige datos consultables en desktop/mobile.

Validacion:

- `cmd /c node scripts\validate-bim-viewer-dom.mjs` desde `frontend`: OK.
- `cmd /c node frontend\scripts\smoke-bim-workspace-positive.mjs`: OK.

No interferencia:

- Trabajo solo local; sin deploy a `giproy.excomconsultores.com`.
- Sin backend, migraciones, DB real, Docker/Coolify ni UX clasica nueva.

Pendiente recomendado:

- Renderer fragments maduro o puente visual avanzado.
- Dataset real autorizado y pruebas de rendimiento.

## 2026-07-09 - BIM-TASK-0046 Simulacion IFC/fragments de volumen local

Modo: GIPROY BIM.

Estado: cerrado localmente.

Resultado:

- `bimFragmentsVolumeIfc.js` genera un IFC sintetico de 25 muros.
- `smoke-bim-fragments-volume.mjs` procesa el IFC con `IfcImporter` real.
- El smoke valida que el fragments de volumen sea mayor que el fixture base.

Validacion:

- `cmd /c node scripts\smoke-bim-fragments-volume.mjs` desde `frontend`: OK,
  25 walls, 2460 bytes.
- `cmd /c node frontend\scripts\smoke-bim-workspace-positive.mjs`: OK.

No interferencia:

- Trabajo solo local; sin deploy a `giproy.excomconsultores.com`.
- Sin backend, migraciones, DB real, Docker/Coolify ni UX clasica nueva.

Pendiente recomendado:

- Dataset real autorizado o fixture representativo de mayor fidelidad.
- Renderer fragments maduro o puente visual avanzado.

## 2026-07-09 - BIM-TASK-0043 Dataset IFC geometrico representativo local

Modo: GIPROY BIM.

Estado: cerrado localmente.

Resultado:

- `BimFragmentsHarness.jsx` espera `model.getLocalIds()` y `model.getGuids()`.
- `validate-bim-viewer-dom.mjs` exige localIds y GlobalIds consultables en el
  harness fragments.
- El fixture geometrico local valida carga fragments con identificadores, pero
  no sustituye datasets reales/de volumen.

Validacion:

- `cmd /c node scripts\validate-bim-viewer-dom.mjs` desde `frontend`: OK.

No interferencia:

- Trabajo solo local; sin deploy a `giproy.excomconsultores.com`.
- Sin backend, migraciones, DB real, Docker/Coolify ni UX clasica nueva.

Pendiente recomendado:

- Simulaciones de volumen con datasets reales/representativos.
- Renderer fragments maduro o puente visual avanzado.

## 2026-07-09 - BIM-TASK-0044 Quantities, materiales y sistemas IFC

Modo: GIPROY BIM.

Estado: cerrado localmente.

Resultado:

- `ifc_parser.py` extrae quantities desde `IFCELEMENTQUANTITY` /
  `IFCQUANTITY*`.
- Materiales directos `IFCMATERIAL` quedan en `metadata_json.ifc_materials`.
- Sistemas `IFCSYSTEM` quedan en `system_name` y metadata.
- La simulacion S5 cubre quantities, materiales y sistemas sin nuevas tablas.

Validacion:

- `python -m py_compile backend\app\services\bim\ifc_parser.py backend\app\tests\test_bim_ifc_simulations.py`: OK.
- `..\.venv\Scripts\python.exe -m pytest app\tests\test_bim_ifc_simulations.py`
  desde `backend`: OK, 5 passed, warnings Pydantic conocidos.
- `node frontend\scripts\smoke-classic-no-bim-contamination.mjs`: OK.
- `cmd /c node frontend\scripts\smoke-bim-workspace-positive.mjs`: OK.

No interferencia:

- Trabajo solo local; sin deploy a `giproy.excomconsultores.com`.
- Sin migraciones, DB real, Docker/Coolify ni UX clasica nueva.

Pendiente recomendado:

- `BIM-TASK-0045`: renderer fragments maduro o puente visual avanzado.
- Simulaciones de volumen con datasets representativos.

## 2026-07-09 - BIM-TASK-0042 Carga de fragments con FragmentsModels en harness

Modo: GIPROY BIM.

Estado: cerrado localmente.

Resultado:

- `BimFragmentsHarness.jsx` carga bytes fragments con `FragmentsModels.load`.
- El harness BIM expone estado DOM verificable:
  `data-bim-fragments-state`, bytes y modelos cargados.
- `BimViewerHarness.jsx` monta el harness fragments junto al viewer 2D/3D.

Validacion:

- `cmd /c node scripts\validate-bim-viewer-dom.mjs` desde `frontend`: OK.
- `cmd /c node frontend\scripts\smoke-bim-workspace-positive.mjs`: OK.
- `node frontend\scripts\smoke-classic-no-bim-contamination.mjs`: OK.
- `npm run build`: OK, warning conocido por chunk `CronogramaGantt`.

No interferencia:

- Trabajo solo local; sin deploy a `giproy.excomconsultores.com`.
- Sin backend, migraciones, DB, Docker/Coolify ni UX clasica nueva.

Pendiente recomendado:

- `BIM-TASK-0043`: dataset IFC con geometria consultable real.
- `BIM-TASK-0045`: renderer fragments maduro o puente visual avanzado.

## 2026-07-09 - BIM-TASK-0041 Smoke local de fragments binarios

Modo: GIPROY BIM.

Estado: cerrado localmente.

Resultado:

- `frontend/scripts/smoke-bim-fragments-importer.mjs` produce bytes fragments
  mediante `IfcImporter` de `@thatopen/fragments`.
- El smoke usa WASM local de `web-ifc` y valida `Uint8Array` no vacio.
- `smoke-bim-workspace-positive.mjs` protege la existencia del smoke binario.

Validacion:

- `cmd /c node scripts\smoke-bim-fragments-importer.mjs` desde `frontend`: OK,
  fragments binario no vacio.
- `cmd /c node frontend\scripts\smoke-bim-workspace-positive.mjs`: OK.
- `node frontend\scripts\smoke-classic-no-bim-contamination.mjs`: OK.

No interferencia:

- Trabajo solo local; sin deploy a `giproy.excomconsultores.com`.
- Sin backend, migraciones, DB, Docker/Coolify ni UX clasica nueva.

Pendiente recomendado:

- `BIM-TASK-0042`: carga de fragments con `FragmentsModels` en harness aislado.
- dataset IFC representativo y simulaciones de volumen.
- renderer fragments maduro o puente visual avanzado.

## 2026-07-09 - BIM-TASK-0040 Consumo de artefacto viewer en harness 3D

Modo: GIPROY BIM.

Estado: cerrado localmente.

Resultado:

- `bimViewerArtifactAdapter.js` transforma artefactos
  `giproy_bim_viewer_artifact` en elementos consumibles por `BimThreeViewer`.
- `BimThreeViewer.jsx` acepta `viewerArtifact`, conserva fallback a elementos
  BIM y expone `data-bim-artifact-source` / `data-bim-artifact-elements`.
- `BimViewerHarness.jsx` usa un artefacto representativo para validar el flujo
  artefacto viewer -> Three.js -> WebGL.

Validacion:

- `cmd /c node frontend\scripts\smoke-bim-workspace-positive.mjs`: OK.
- `node frontend\scripts\smoke-classic-no-bim-contamination.mjs`: OK.
- `cmd /c node scripts\validate-bim-viewer-dom.mjs` desde `frontend`: OK.
- `npm run build`: OK, warning conocido por chunk `CronogramaGantt`.

No interferencia:

- Trabajo solo local; sin deploy a `giproy.excomconsultores.com`.
- Sin backend, migraciones, DB, Docker/Coolify ni UX clasica nueva.

Pendiente recomendado:

- `BIM-TASK-0041`: fragments binarios con stack That Open.
- `BIM-TASK-0042`: carga de fragments con `FragmentsModels`.
- dataset IFC representativo y simulaciones de volumen.

## 2026-07-09 - BIM-TASK-0039 Artefacto optimizado para viewer BIM

Modo: GIPROY BIM.

Estado: cerrado localmente.

Resultado:

- `artifact_service.py` genera un artefacto JSON local
  `giproy_bim_viewer_artifact`.
- El endpoint `/api/v1/bim/projects/{project_id}/versions/{version_id}/artifacts/viewer`
  queda bajo feature flag, tenant y rol `superadministrador`.
- El artefacto incluye indices por storey, clase IFC, propiedades y bounds 2D.
- `frontend/src/api/bimModels.js` expone `generateViewerArtifact(...)`.

Validacion:

- `..\.venv\Scripts\python.exe -m pytest app\tests\test_bim_foundation.py app\tests\test_bim_ifc_simulations.py -q`:
  OK, 44 passed.
- `python -m py_compile app\services\bim\artifact_service.py app\services\bim\ifc_storage.py app\services\bim\ifc_parser.py app\services\bim\import_service.py app\api\endpoints\bim_models.py app\schemas\bim_model.py app\core\config.py`:
  OK.
- `cmd /c node frontend\scripts\smoke-bim-workspace-positive.mjs`: OK.
- `node frontend\scripts\smoke-classic-no-bim-contamination.mjs`: OK.
- `npm run build`: OK, warning conocido por chunk `CronogramaGantt`.

No interferencia:

- Trabajo solo local; sin deploy a `giproy.excomconsultores.com`.
- Sin migraciones nuevas, sin UX clasica, sin Docker/Coolify.

Pendiente recomendado:

- `BIM-TASK-0040`: consumo del artefacto desde harness/viewer 3D.
- `BIM-TASK-0041`: fragments binarios con stack That Open.

## 2026-07-09 - BIM-TASK-0038 Parsing IFC profundo inicial

Modo: GIPROY BIM.

Estado: cerrado localmente.

Resultado:

- `ifc_parser.py` ahora resuelve relaciones espaciales simples desde
  `IFCRELCONTAINEDINSPATIALSTRUCTURE`.
- El parser lee property sets simples mediante `IFCRELDEFINESBYPROPERTIES`,
  `IFCPROPERTYSET` e `IFCPROPERTYSINGLEVALUE`.
- Los `BimElement` importados pueden recibir `storey_name`, propiedades
  semanticas y `ifc_property_count`.
- Se agrega simulacion S4 para validar storey + property sets.

Validacion:

- `..\.venv\Scripts\python.exe -m pytest app\tests\test_bim_ifc_simulations.py -q`:
  OK, 4 passed.
- `..\.venv\Scripts\python.exe -m pytest app\tests\test_bim_foundation.py app\tests\test_bim_ifc_simulations.py -q`:
  OK, 42 passed.
- `python -m py_compile app\services\bim\ifc_storage.py app\services\bim\ifc_parser.py app\services\bim\import_service.py app\api\endpoints\bim_models.py app\schemas\bim_model.py app\core\config.py`:
  OK.

No interferencia:

- Trabajo solo local; sin deploy a `giproy.excomconsultores.com`.
- Sin cambios DB, migraciones ni modulos clasicos.
- Sin UX visible nueva ni navegacion cruzada.

Pendiente recomendado:

- `BIM-TASK-0039`: fragments/artefactos optimizados y viewer 3D maduro.
- `BIM-TASK-0040`: simulaciones con datasets IFC reales/representativos.

## 2026-07-09 - BIM-TASK-0037 Storage local IFC controlado

Modo: GIPROY BIM.

Estado: cerrado localmente.

Resultado:

- Se agrega `BIM_LOCAL_STORAGE_DIR` y storage local BIM bajo
  `uploads/bim/{empresa_id}/{project_id}`.
- El endpoint `/api/v1/bim/projects/{project_id}/imports/ifc-file` acepta
  archivos `.ifc`, calcula checksum, guarda artifact local, parsea IFC textual
  inicial y registra `artifact_path` en `bim_model_versions`.
- `frontend/src/api/bimModels.js` expone `importIfcFile(...)` con `FormData`.
- Tests usan `tmp_path`; no escriben en runtime real.

Validacion:

- `..\.venv\Scripts\python.exe -m pytest app\tests\test_bim_foundation.py app\tests\test_bim_ifc_simulations.py -q`:
  OK, 41 passed.
- `python -m py_compile app\services\bim\ifc_storage.py app\services\bim\ifc_parser.py app\services\bim\import_service.py app\api\endpoints\bim_models.py app\schemas\bim_model.py app\core\config.py`:
  OK.
- `cmd /c node frontend\scripts\smoke-bim-workspace-positive.mjs`: OK.
- `node frontend\scripts\smoke-classic-no-bim-contamination.mjs`: OK.
- `npm run build`: OK, warning conocido por chunk `CronogramaGantt`.

No interferencia:

- Trabajo solo local; sin deploy a `giproy.excomconsultores.com`.
- Sin migracion DB nueva ni cambios destructivos.
- Sin UX BIM visible nueva, sin navegacion clasica, sin Docker/Coolify.

Pendiente recomendado:

- `BIM-TASK-0038`: parsing IFC profundo de relaciones espaciales, property
  sets, quantities y clasificaciones.
- `BIM-TASK-0039`: fragments/artefactos optimizados y viewer 3D maduro.

## 2026-07-09 - BIM-TASK-0036 Parsing IFC semantico inicial local

Modo: GIPROY BIM.

Estado: cerrado localmente.

Resultado:

- Se agrega parser STEP/IFC textual inicial para convertir IFC en storeys y
  elementos BIM persistidos.
- El endpoint `/api/v1/bim/projects/{project_id}/imports/ifc-text` queda bajo
  feature flag BIM, tenant y rol `superadministrador`.
- El import reutiliza el dominio existente: `bim_models`,
  `bim_model_versions`, `bim_storeys` y `bim_elements`.
- `frontend/src/api/bimModels.js` expone `importIfcText(...)` sin imports
  directos de axios fuera de `frontend/src/api`.
- `backend/app/tests/test_bim_ifc_simulations.py` agrega simulaciones S1/S2/S3
  sinteticas para parser IFC inicial.
- No se activa UX BIM visible ni navegacion cruzada con modulos clasicos.

Validacion:

- `..\.venv\Scripts\python.exe -m pytest app\tests\test_bim_foundation.py app\tests\test_bim_ifc_simulations.py -q`:
  OK, 39 passed.
- `..\.venv\Scripts\python.exe -m pytest app\tests\test_bim_ifc_simulations.py -q`:
  OK, 3 passed.
- `python -m py_compile app\services\bim\ifc_parser.py app\services\bim\import_service.py app\api\endpoints\bim_models.py app\schemas\bim_model.py`:
  OK.
- `cmd /c node frontend\scripts\smoke-bim-workspace-positive.mjs`: OK.
- `node frontend\scripts\smoke-classic-no-bim-contamination.mjs`: OK.
- `npm run build`: OK, warning conocido por chunk `CronogramaGantt`.

No interferencia:

- Trabajo solo local; sin deploy a `giproy.excomconsultores.com`.
- Sin migracion DB nueva, cambios destructivos ni backend separado.
- Sin cambios en auth/JWT/tenant clasico, EDT, APUs, Presupuesto,
  Cronogramas ni rutas clasicas.

Pendiente recomendado:

- `BIM-TASK-0037`: storage local IFC controlado y simulaciones con datasets IFC
  reales/representativos.
- `BIM-TASK-0038`: parsing IFC profundo de relaciones espaciales, property
  sets, quantities y clasificaciones.
- `BIM-TASK-0039`: fragments/artefactos optimizados y viewer 3D maduro.

## 2026-07-09 - BIM-TASK-0035 IFC/3D como fundamento de cierre BIM

Modo: GIPROY BIM.

Estado: cerrado localmente.

Resultado:

- IFC/3D queda elevado a requisito central del cierre BIM; ya no se considera
  aceptable cerrar BIM con visor placeholder o solo manifest.
- Se instala localmente el stack autorizado `three`, `web-ifc`,
  `@thatopen/components`, `@thatopen/components-front` y `@thatopen/fragments`.
- Se agrega `frontend/src/components/bim/BimThreeViewer.jsx` como viewer WebGL
  aislado con escena Three.js generada desde datos BIM existentes.
- `BimWorkspace` y `BimViewerHarness` montan el viewer 3D solo dentro del
  perimetro BIM.
- Los documentos BIM y la plantilla `Prompt Modo BIM.txt` quedan actualizados
  con el nuevo estado: 2D tecnico + fundacion 3D local; pendiente parsing IFC
  semantico, fragments/artefactos optimizados y simulaciones representativas.

Validacion:

- `..\.venv\Scripts\python.exe -m pytest app\tests\test_bim_foundation.py app\tests\test_bim_alembic_migration.py`: OK, 36 passed.
- `cmd /c node frontend\scripts\smoke-bim-workspace-positive.mjs`: OK.
- `node frontend\scripts\smoke-classic-no-bim-contamination.mjs`: OK.
- `cmd /c node scripts\validate-bim-viewer-dom.mjs`: OK.
- `npm run build`: OK, warning conocido por chunk `CronogramaGantt`.

No interferencia:

- Sin deploy a `giproy.excomconsultores.com`; trabajo solo local.
- Sin cambios backend funcionales, migraciones DB, auth/JWT/tenant ni permisos.
- Sin endpoints clasicos, contratos EDT/APUs/Presupuesto/Cronogramas ni UX
  visible fuera de BIM.
- Sin crear Dockerfiles, compose, pipelines ni configuracion Coolify.

Pendiente recomendado:

- `BIM-TASK-0036`: pipeline local IFC real con carga, checksum, parsing
  semantico y persistencia BIM aislada.
- `BIM-TASK-0037`: simulaciones locales S1/S2/S3 con datasets IFC
  representativos, metricas de carga y estabilidad del viewer 3D.

## 2026-07-08 - TASK-2018 Extender superficie visual del Gantt clasico con pocas lineas

Modo: GIPROY CLASICO.

Estado: cerrado localmente.

Resultado:

- Se corrige un problema puramente visual del Gantt clasico: con pocas lineas,
  el workspace se recortaba a la altura real de esas filas y daba sensacion de
  proyecto incompleto.
- `CronogramaGantt.jsx` deja de derivar `ganttWorkspaceHeight` desde
  `rows.length`.
- El workspace usa toda la altura disponible medida para el modulo, conservando
  un minimo visual.
- Se agrega `visualBottomFillPx` y `rowVirtualBottomSpacerPx` para extender el
  ultimo spacer cuando las filas reales no llenan el viewport.
- La tabla izquierda y el timeline derecho comparten el mismo alto de relleno,
  sin crear filas falsas ni modificar datos.
- Se refuerza `smoke-classic-cronogramas-api-boundary.mjs` para evitar
  regresion al calculo por cantidad de lineas.
- Se agrega `PRODUCT.md` minimo como contexto de producto requerido por la skill
  de UI, inferido desde la documentacion enterprise existente.

Validacion:

- `node frontend/scripts/smoke-classic-cronogramas-api-boundary.mjs`: OK.
- `node frontend/scripts/smoke-classic-no-bim-contamination.mjs`: OK.
- `npm run build`: OK, con warning conocido de chunk grande
  `CronogramaGantt`.

No interferencia:

- Sin cambios backend funcionales, migraciones DB, auth/JWT/tenant ni permisos.
- Sin cambios de contratos API, rutas, EDT, presupuestos, cronogramas ni datos.
- Sin UX BIM ni dependencia BIM.
- Sin tocar guardas del baseline TASK-1807.
- Sin crear Dockerfiles, compose, pipelines ni configuracion Coolify.

## 2026-07-08 - TASK-2017 Optimizar presentacion clasica de APUs

Modo: GIPROY CLASICO.

Estado: desplegado en beta existente y validado.

Resultado:

- Se continua la auditoria de cuellos de botella de presentacion en
  Precios Unitarios/APUs.
- `APUs.jsx` deja de cargar eager modales secundarios que no son necesarios para
  el primer render:
  - `BulkDeleteConfirmModal`
  - `ResourceEditorModal`
  - `CommonReportPreviewModal`
  - `ReportGenerationModal`
- Cada modal pasa a `React.lazy(...)` y se monta bajo
  `React.Suspense fallback={null}` solo cuando su estado de apertura esta
  activo.
- El listado principal de APUs usa `apusApi.getAll(..., { summary: true })`.
- El selector de APUs de una base fuente para importacion usa
  `apusApi.getAll(..., { summary: true })`.
- `nestedApusCatalog` se mantiene completo, sin `summary`, porque sus `lineas`
  se usan para construir el grafo que valida ciclos entre APUs.
- Resultado build local:
  - `APUs-bNoW1s9L.js` ~107,4 KB, gzip ~27,8 KB.
  - Chunks diferidos:
    `ResourceEditorModal` ~11,9 KB, gzip ~3,7 KB;
    `CommonReportPreviewModal` ~30,2 KB, gzip ~8,0 KB;
    `BulkDeleteConfirmModal` ~3,6 KB, gzip ~1,3 KB;
    `ReportGenerationModal` ~1,6 KB, gzip ~0,8 KB.
- Se actualiza `smoke-classic-precios-unitarios-ui-guards.mjs` para evitar
  regresion a imports eager y proteger que el catalogo anidado completo no se
  convierta accidentalmente a resumen.

Validacion:

- `node frontend/scripts/smoke-classic-precios-unitarios-ui-guards.mjs`: OK.
- `node frontend/scripts/smoke-classic-presupuesto-api-boundary.mjs`: OK.
- `node frontend/scripts/smoke-classic-cronogramas-api-boundary.mjs`: OK.
- `node frontend/scripts/smoke-classic-no-bim-contamination.mjs`: OK.
- `npm run build`: OK, warning conocido por chunk `CronogramaGantt`.
- `python tools/ai_tools/validate_enterprise_baseline.py --include-frontend`:
  OK.
- Servidor: `giproy-beta-frontend` healthy; `giproy-beta-backend` healthy.
- Verificacion remota:
  - `APUs.jsx` contiene lazy imports de modales secundarios.
  - `APUs.jsx` contiene `summary: true` en listado principal y selector de base
    fuente.
  - Frontend responde HTML desde nginx.

No interferencia:

- Sin cambios backend funcionales, migraciones DB, auth/JWT/tenant ni permisos.
- Sin cambios de contratos API ni rutas.
- Sin UX BIM ni dependencia BIM.
- Sin tocar guardas del baseline TASK-1807.
- Sin crear Dockerfiles, compose, pipelines ni configuracion Coolify.

Backups servidor:

- Sufijo por archivo: `bak-task2017-20260708-124517`.
- Archivos cubiertos:
  `frontend/src/pages/APUs.jsx`,
  `frontend/scripts/smoke-classic-precios-unitarios-ui-guards.mjs`,
  `docs/CHANGELOG.md`,
  `docs/HANDOFF.md`.
- `docs/tasks/TASK-2017.md` era archivo nuevo en servidor.

## 2026-07-08 - TASK-2016 Lazy-load de Tanteo y editor APU en Presupuesto clasico

Modo: GIPROY CLASICO.

Estado: desplegado en beta existente y validado.

Resultado:

- Se continua la auditoria de cuellos de botella de presentacion en el modulo
  `Presupuesto`.
- `PresupuestoDetail.jsx` deja de cargar eager dos superficies que no son
  necesarias para el primer render:
  - `TanteoTab`
  - `ApuEditorModal`
- `ApuEditorModal` arrastra `ApuBudgetEditor`, por lo que diferirlo retira del
  chunk inicial el editor especializado hasta que el usuario edita una linea
  APU.
- Ambos componentes pasan a `React.lazy(...)` y se montan bajo
  `React.Suspense fallback={null}` solo cuando `tanteoVisible` o
  `editingApuId` estan activos.
- Resultado build local:
  - Antes: `PresupuestoDetail-DMac5zt2.js` ~153,8 KB, gzip ~42,5 KB.
  - Despues: `PresupuestoDetail-Bxs_xn9M.js` ~104,1 KB, gzip ~29,8 KB.
  - Chunks diferidos:
    `ApuEditorModal` ~34,4 KB, gzip ~10,3 KB;
    `TanteoTab` ~16,9 KB, gzip ~5,5 KB.
- Se actualiza `smoke-classic-presupuesto-api-boundary.mjs` para evitar
  regresion a imports eager de estos componentes.
- Se reconstruyo solo `frontend` beta existente; `backend` no fue reconstruido.

Validacion:

- `node frontend/scripts/smoke-classic-presupuesto-api-boundary.mjs`: OK.
- `node frontend/scripts/smoke-classic-no-bim-contamination.mjs`: OK.
- `npm run build`: OK, warning conocido por chunk `CronogramaGantt`.
- `python tools/ai_tools/validate_enterprise_baseline.py --include-frontend`:
  OK.
- Servidor: `giproy-beta-frontend` healthy; `giproy-beta-backend` healthy.

No interferencia:

- Sin cambios backend funcionales, migraciones DB, auth/JWT/tenant ni permisos.
- Sin cambios de contratos API, rutas, EDT, presupuestos, cronogramas ni datos.
- Sin UX BIM ni dependencia BIM.
- Sin tocar guardas del baseline TASK-1807.
- Sin crear Dockerfiles, compose, pipelines ni configuracion Coolify.

Backups servidor:

- Sufijo por archivo: `bak-task2016-20260708-123556`.
- Archivos cubiertos:
  `frontend/src/components/presupuestos/PresupuestoDetail.jsx`,
  `frontend/scripts/smoke-classic-presupuesto-api-boundary.mjs`.

Pendiente recomendado para continuar el objetivo global:

- Revisar cargas internas en `APUs.jsx` y/o una extraccion controlada del editor
  de recursos Gantt, que sigue siendo el mayor chunk funcional.

## 2026-07-08 - TASK-2015 Lazy-load de modales secundarios en Presupuesto clasico

Modo: GIPROY CLASICO.

Estado: desplegado en beta existente y validado.

Resultado:

- Se continua la auditoria de cuellos de botella de presentacion en el modulo
  `Presupuesto`.
- `PresupuestoDetail.jsx` deja de cargar eager modales secundarios que no son
  necesarios para el primer render:
  - `IndirectosModal`
  - `ParetoModal`
  - `NotasGeneralesModal`
  - `CommonReportPreviewModal`
  - `ReportGenerationModal`
- Cada modal pasa a `React.lazy(...)` y se monta bajo
  `React.Suspense fallback={null}` solo cuando su estado de apertura esta
  activo.
- Resultado build local:
  - Antes: `PresupuestoDetail-TDUm-XHb.js` ~198,6 KB.
  - Despues: `PresupuestoDetail-DMac5zt2.js` ~153,8 KB, gzip ~42,5 KB.
  - Chunks diferidos:
    `IndirectosModal` ~27,9 KB,
    `CommonReportPreviewModal` ~30,2 KB,
    `ParetoModal` ~13,6 KB,
    `NotasGeneralesModal` ~8,8 KB,
    `ReportGenerationModal` ~1,6 KB.
- Se actualiza `smoke-classic-presupuesto-api-boundary.mjs` para evitar
  regresion a imports eager de estos modales.
- Se reconstruyo solo `frontend` beta existente; `backend` no fue reconstruido.

Validacion:

- `node frontend/scripts/smoke-classic-presupuesto-api-boundary.mjs`: OK.
- `node frontend/scripts/smoke-classic-no-bim-contamination.mjs`: OK.
- `npm run build`: OK, warning conocido por chunk `CronogramaGantt`.
- `python tools/ai_tools/validate_enterprise_baseline.py --include-frontend`:
  OK.
- Servidor: `giproy-beta-frontend` healthy; `giproy-beta-backend` healthy.

No interferencia:

- Sin cambios backend funcionales, migraciones DB, auth/JWT/tenant ni permisos.
- Sin cambios de contratos API, rutas, EDT, presupuestos, cronogramas ni datos.
- Sin UX BIM ni dependencia BIM.
- Sin tocar guardas del baseline TASK-1807.
- Sin crear Dockerfiles, compose, pipelines ni configuracion Coolify.

Backups servidor:

- Sufijo por archivo: `bak-task2015-20260708-122309`.
- Archivos cubiertos:
  `frontend/src/components/presupuestos/PresupuestoDetail.jsx`,
  `frontend/scripts/smoke-classic-presupuesto-api-boundary.mjs`.

Pendiente recomendado para continuar el objetivo global:

- Revisar lazy-load interno de `TanteoTab`, `ApuEditorModal` o extraccion
  controlada del editor de recursos Gantt si se autoriza un slice mas amplio.

## 2026-07-08 - TASK-2014 Lazy-load interno de Pareto en Gantt clasico

Modo: GIPROY CLASICO.

Estado: desplegado en beta existente y validado.

Resultado:

- Se continua la auditoria de cuellos de botella de presentacion sobre el mayor
  chunk funcional restante: `CronogramaGantt`.
- `GanttParetoModal` deja de importarse eager desde `CronogramaGantt.jsx`.
- El modal pasa a `React.lazy(() => import('./GanttParetoModal'))` y solo se
  monta cuando `paretoOpen=true`, envuelto en `React.Suspense fallback={null}`.
- No se altera el primer render del Gantt ni se introduce UI nueva.
- Resultado build local:
  - Antes: `CronogramaGantt-CiQmrXxs.js` ~567,2 KB, gzip ~149,1 KB.
  - Despues: `CronogramaGantt-C6oDG05d.js` ~550,6 KB, gzip ~144,8 KB.
  - Nuevo chunk: `GanttParetoModal-lpHQzzPy.js` ~17,7 KB, gzip ~5,2 KB.
- Resultado build servidor beta:
  - `CronogramaGantt-CHd0PN9h.js` ~550,6 KB, gzip ~144,8 KB.
  - `GanttParetoModal-CBPsWeAr.js` ~17,7 KB, gzip ~5,2 KB.
- Se actualiza `smoke-classic-cronogramas-api-boundary.mjs` para evitar regresion
  a import eager del modal Pareto.
- Se reconstruyo solo `frontend` beta existente; `backend` no fue reconstruido.

Validacion:

- `node frontend/scripts/smoke-classic-cronogramas-api-boundary.mjs`: OK.
- `node frontend/scripts/smoke-classic-no-bim-contamination.mjs`: OK.
- `npm run build`: OK, warning conocido por chunk `CronogramaGantt`.
- `python tools/ai_tools/validate_enterprise_baseline.py --include-frontend`:
  OK.
- Servidor: `giproy-beta-frontend` healthy; `giproy-beta-backend` healthy.

No interferencia:

- Sin cambios backend funcionales, migraciones DB, auth/JWT/tenant ni permisos.
- Sin UX BIM ni dependencia BIM.
- Sin crear Dockerfiles, compose, pipelines ni configuracion Coolify.

Backups servidor:

- Sufijo por archivo: `bak-task2014-20260708-101711`.
- Archivos cubiertos:
  `frontend/src/components/projects/CronogramaGantt.jsx`,
  `frontend/scripts/smoke-classic-cronogramas-api-boundary.mjs`.

Pendiente recomendado para continuar el objetivo global:

- El siguiente ahorro grande en Gantt requiere extraer/diferir
  `GanttResourceEditorModal`, actualmente embebido dentro de
  `CronogramaGantt.jsx`; hacerlo como TASK separada por su acoplamiento con
  helpers, estados y callbacks internos.
- Seguir luego con modales/reporting eager en `PresupuestoDetail`,
  `Cronogramas`, `APUs`, `Settings`, `Community` y
  `MarketplaceAdminDashboard`.

## 2026-07-08 - TASK-2013 Lazy-load de rutas protegidas clasicas

Modo: GIPROY CLASICO.

Estado: desplegado en beta existente y validado.

Resultado:

- Se continua la auditoria transversal de cuellos de botella frontend.
- El build mostraba `index-*.js` como chunk inicial de ~638,8 KB, porque
  `AppRouter.jsx` importaba eager rutas protegidas que no son necesarias para
  login ni para todas las entradas.
- Se pasan a `lazyWithChunkRecovery(...)`:
  - `Dashboard`
  - `Proyectos`
  - `BasesTrabajo`
  - `Subcategorias`
  - `OtrosServicios`
- Las rutas publicas siguen directas:
  `Login`, `ForgotPassword`, `ResetPassword`, `VerifyRegistration`.
- Resultado build local:
  - `index`: ~638,8 KB -> ~260,4 KB.
  - `Proyectos`: chunk propio ~220,2 KB.
  - `Dashboard`: chunk propio ~5,6 KB.
  - `BasesTrabajo`: chunk propio ~41,2 KB.
  - `Subcategorias`: chunk propio ~30,3 KB.
- Resultado build servidor beta:
  - `index-lIz9EAku.js`: ~260,4 KB, gzip ~84,5 KB.
  - `Proyectos-CItiunBC.js`: ~220,2 KB, gzip ~55,9 KB.
  - `CronogramaGantt-CLJ8mdPr.js`: ~567,2 KB, gzip ~149,1 KB.
- Se agrega `frontend/scripts/smoke-classic-route-lazy-boundary.mjs` y se
  incorpora a `tools/ai_tools/validate_enterprise_baseline.py`.
- Se reconstruyo solo `frontend` beta existente; `backend` no fue reconstruido.

Validacion:

- `npm run build`: OK, warning conocido por chunk `CronogramaGantt`.
- `node frontend/scripts/smoke-classic-route-lazy-boundary.mjs`: OK.
- `node frontend/scripts/smoke-classic-no-bim-contamination.mjs`: OK.
- `node frontend/scripts/smoke-classic-api-boundaries.mjs`: OK.
- `python tools/ai_tools/validate_enterprise_baseline.py --include-frontend`:
  OK.
- Servidor: `giproy-beta-frontend` healthy; `giproy-beta-backend` healthy.

No interferencia:

- Sin cambios backend funcionales, migraciones DB, auth/JWT/tenant ni permisos.
- Sin UX BIM ni dependencia BIM.
- Sin crear Dockerfiles, compose, pipelines ni configuracion Coolify.

Backups servidor:

- Sufijo por archivo: `bak-task2013-20260708-072434`.
- Archivos cubiertos:
  `frontend/src/routes/AppRouter.jsx`,
  `frontend/scripts/smoke-classic-route-lazy-boundary.mjs`,
  `tools/ai_tools/validate_enterprise_baseline.py`.

Pendiente recomendado para continuar el objetivo global:

- `CronogramaGantt` sigue siendo el mayor chunk funcional (~567 KB). Revisar
  diferido interno de modales/herramientas que no participan en el primer render
  del Gantt.
- Revisar `PresupuestoDetail`, `Cronogramas`, `APUs`, `Settings`, `Community` y
  `MarketplaceAdminDashboard` por imports internos diferibles y cargas API
  iniciales no necesarias.

## 2026-07-08 - TASK-2012 Lazy metadata Gantt y catalogos APU resumidos

Modo: GIPROY CLASICO.

Estado: desplegado en beta existente y validado.

Resultado:

- Se completa el segundo slice de rendimiento pedido para Gantt y Presupuesto,
  sin cambiar contratos por defecto.
- `GET /cronogramas-trabajo/{presupuesto_id}` acepta
  `metadata_mode=summary` opt-in junto con `compact=true`.
- La carga inicial de Gantt mantiene metadata suficiente para pintar/navegar,
  marca filas con `metadata_lazy=true` y difiere metadata pesada de edicion.
- Nuevo endpoint opt-in:
  `GET /cronogramas-trabajo/{presupuesto_id}/lineas/{linea_id}/metadata`.
- `CronogramaGantt.jsx` hidrata metadata completa al seleccionar una linea lazy
  o abrir editor, sin escribir en `drafts` para evitar cambios pendientes
  falsos.
- `GET /apus/` acepta `summary=true` opt-in.
- Catalogo APU y listados laterales de `ApuBudgetEditor` usan APUs resumidos;
  la edicion sigue pidiendo detalle completo con `getById(...)`.
- Medicion servidor beta, caso `presupuesto_id=29`, `empresa_id=1`,
  `base_trabajo_id=48`, `revision=0`:
  - Gantt compact full metadata: ~2,65-2,71 s, ~364 KB gzip.
  - Gantt compact summary metadata: ~2,40-2,47 s, ~153 KB gzip.
  - Metadata de una linea bajo demanda: ~2,29-2,39 s, ~2,7 KB gzip.
  - APUs full: ~405-525 ms, ~45,9 KB gzip.
  - APUs summary: ~22-23 ms, ~8,2 KB gzip.
- Se reconstruyeron `backend` y `frontend` beta existentes; ambos quedaron
  healthy.

Validacion:

- `python -m py_compile app/api/endpoints/cronogramas_trabajo.py app/api/endpoints/apus.py`: OK.
- `pytest` focal backend Cronograma Trabajo/APU overlay: 58 passed.
- `node frontend/scripts/smoke-classic-cronogramas-api-boundary.mjs`: OK.
- `node frontend/scripts/smoke-classic-presupuesto-api-boundary.mjs`: OK.
- `node frontend/scripts/smoke-classic-no-bim-contamination.mjs`: OK.
- `npm run build`: OK, con warning conocido de chunks grandes Vite.
- Servidor: `py_compile` backend dentro de contenedor y medicion HTTP interna
  autenticada: OK.

No interferencia:

- Sin migraciones DB, cambios destructivos, auth/JWT/tenant ni permisos.
- Sin UX BIM ni dependencia BIM.
- Opciones nuevas opt-in; rutas existentes conservan comportamiento por defecto.
- Sin crear Dockerfiles, compose, pipelines ni configuracion Coolify.

Backups servidor:

- Sufijo por archivo: `bak-task2012-20260708-071124`.
- Archivos cubiertos:
  `cronogramas_trabajo.py`, `apus.py`, `cronogramas.js`, `apus.js`,
  `Cronogramas.jsx`, `CronogramaGantt.jsx`, `CatalogoApuTab.jsx`,
  `ApuBudgetEditor.jsx` y smokes de Cronogramas/Presupuesto.

## 2026-07-08 - TASK-2011 Optimizacion de carga Gantt clasico en servidor

Modo: GIPROY CLASICO.

Estado: desplegado en beta existente y validado.

Resultado:

- Se atiende el reporte de lentitud en `giproy.excomconsultores.com`, donde
  Gantt tarda cerca de 30 s y Presupuesto tambien se percibe lento.
- La medicion servidor del caso `presupuesto_id=29` mostro que el calculo
  interno no era el unico cuello: `_build_response` estaba en ~2,24-2,47 s, pero
  el HTTP publico de `GET /cronogramas-trabajo/29` enviaba ~10,46 MB y tardaba
  ~6,46-18,27 s.
- El payload duplicaba datos pesados: `rows` ~6,43 MB y `schedule_data`
  ~4,78 MB.
- `cronograma_trabajo.py` usa `_WORKDAY_CALC_CACHE` contextual por respuesta
  para cachear `_uses_advanced_calendar`, `_is_workday`,
  `_resolve_workday_day_start` y `_align_to_workday_start`.
- Se habilita `GZipMiddleware` y se agrega `compact=true` opt-in al endpoint de
  Cronograma Trabajo.
- `Cronogramas.jsx` pide `getTrabajo(..., { compact: true })` en la carga
  clasica de Gantt, sin cambiar la respuesta completa por defecto.
- Resultado servidor posterior:
  - Respuesta completa compatible: ~3,68-3,79 s, ~556 KB comprimidos.
  - Respuesta compacta frontend: ~3,02-3,76 s, ~364 KB comprimidos, 224 filas.
  - Waterfall HTTP autenticado de Cronogramas: ~8,18-8,71 s.
- Se reconstruyeron `backend` y `frontend` beta existentes; ambos quedaron
  healthy.

Validacion:

- `python -m py_compile app/main.py app/api/endpoints/cronogramas_trabajo.py app/services/cronograma_trabajo.py`: OK.
- `pytest` focal backend Cronograma Trabajo: 56 passed.
- `npm run build`: OK, con warning conocido de chunks grandes Vite.
- `tools/ai_tools/validate_enterprise_baseline.py --include-frontend`: OK.
- HTTP autenticado contra dominio publico: OK.
- Smoke anti-BIM/imports/logs focal en `frontend/src`: sin hallazgos.

No interferencia:

- Sin migraciones DB, rutas, contratos API, auth/JWT/tenant ni permisos.
- Sin UX BIM ni dependencia BIM.
- Sin crear Dockerfiles, compose, pipelines ni configuracion Coolify.
- Solo se uso la instalacion Docker beta existente para reconstruir servicios.

Backups servidor:

- `/home/benito/docker/apps/giproy-beta/backend/app/main.py.bak-task2011-20260708-065321`
- `/home/benito/docker/apps/giproy-beta/backend/app/api/endpoints/cronogramas_trabajo.py.bak-task2011-20260708-065321`
- `/home/benito/docker/apps/giproy-beta/backend/app/services/cronograma_trabajo.py.bak-task2011-20260708-065321`
- `/home/benito/docker/apps/giproy-beta/frontend/src/api/cronogramas.js.bak-task2011-20260708-065321`
- `/home/benito/docker/apps/giproy-beta/frontend/src/components/projects/Cronogramas.jsx.bak-task2011-20260708-065321`

## 2026-07-07 - TASK-2010 Saneamiento de fechas y subtramos automaticos Gantt clasico

Modo: GIPROY CLASICO.

Estado: cerrado.

Resultado:

- Se analiza la creacion automatica de fechas/subtramos del Gantt clasico.
- La causa raiz no era solo el valor extremo del `end_date`: el generador de
  subtramos automaticos podia devolver una secuencia parcial si el guard de
  iteracion no consumia toda la duracion.
- `_build_workday_auto_segments(...)` ahora solo devuelve subtramos cuando
  representan el 100% de la duracion solicitada.
- `_apply_computed_rows_to_line_overrides(...)` evita persistir fechas
  automaticas fuera de horizonte y limpia subtramos renovables obsoletos o
  masivos.
- Se sanea en servidor `cronogramas_trabajo.id=3` / presupuesto `29`, con
  backup DB y backup JSON especifico previos.
- Se sanea tambien la DB local `giproy_erp`, mismo cronograma/presupuesto, para
  evitar que un futuro dump local vuelva a propagar el defecto.
- Resultado del saneamiento: 22 fechas fuera de horizonte y 26 grupos de
  subtramos automaticos masivos retirados tanto en servidor como en local.
- Medicion servidor posterior: `_build_response` presupuesto `29` ~2,786 s,
  224 filas, 0 fechas persistidas >= 2100, 0 subtramos masivos y 0 fechas
  imposibles en respuesta.
- Medicion local posterior: `_build_response` presupuesto `29` ~1,852 s,
  224 filas, mismos contadores en cero.

Validacion:

- `python -m py_compile backend/app/services/cronograma_trabajo.py`: OK.
- `pytest` focal backend: 4 passed.
- Backend beta reconstruido y healthy.

Backups servidor:

- DB: `/home/benito/docker/apps/giproy-beta/deploy/backups/giproy-beta-20260707-202925.sql.gz`
- JSON cronograma: `/home/benito/docker/apps/giproy-beta/deploy/backups/cronograma_trabajo_3_schedule_data_20260707-203008.json`
- DB local: `backups/local_gantt_sanitize/giproy_erp_before_task_2010_20260707-203615.dump`
- JSON local: `backups/local_gantt_sanitize/cronograma_trabajo_3_schedule_data_20260707-203615.json`

No interferencia:

- Sin migraciones DB, rutas, auth/JWT/tenant ni contratos API.
- Sin UX BIM ni dependencia BIM.
- No se modifica fecha de inicio de proyecto para forzar el saneamiento.

## 2026-07-07 - TASK-2009 Optimizacion de timeout Gantt clasico en servidor

Modo: GIPROY CLASICO.

Estado: cerrado.

Resultado:

- Se diagnostica el timeout de Gantt en `giproy.excomconsultores.com`.
- El cuello principal no estaba en presupuesto: refresco y serializacion del
  presupuesto `29` quedan en milisegundos.
- La causa raiz estaba en calendario Gantt: `schedule_data` contenia fechas fin
  extremas (`3719`, `4492`), por lo que el snapshot de feriados intentaba cubrir
  2467 anos.
- `_estimate_calendar_window` ahora ignora candidatos fuera de un horizonte
  operativo de 3650 dias desde el inicio del cronograma.
- Se agrega cache contextual para resolver overrides de linea y fast-path para
  metadata Gantt ya normalizada.
- `_resolve_rows_dates` ignora overrides temporales explicitos fuera del mismo
  horizonte para no devolver filas en anos imposibles al frontend.
- El caso pesado baja de ~68 s a ~6-8 s en servidor.

Validacion:

- `python -m py_compile backend/app/services/cronograma_trabajo.py`: OK.
- Backend reconstruido y recreado en servidor: OK.
- `backend`, `frontend`, `postgres`: healthy.
- `https://giproy.excomconsultores.com/api/v1/openapi.json`: HTTP 200.
- Medicion directa de `_build_response` para presupuesto `29`: ~6,4 s con
  224 rows tras el saneamiento final.

No interferencia:

- Sin cambios DB, migraciones, rutas, auth/JWT/tenant ni contratos API.
- Sin UX BIM ni dependencia BIM.
- Sin limpiar datos historicos de `calendar_holidays`.
- Docker/Coolify no se reabre funcionalmente; solo se recrea el backend
  existente por solicitud explicita de servidor.

Pendiente recomendado:

- Crear TASK focal para sanear el origen de `end_date` extremos en
  `schedule_data`.
- Crear TASK focal, con backup, para limpiar anos imposibles de
  `calendar_holidays` si se confirma que son residuo de esta regresion.

## 2026-07-07 - TASK-2008 Toolhint de Modo Trabajo en editor light APU Gantt

Modo: GIPROY CLASICO.

Estado: cerrado.

Resultado:

- Se agrega un `AppHint` junto al label `Modo Trabajo` del editor light de APUs
  en Gantt.
- El hint define `Fijo` y `Variable`, explica su impacto operativo y recuerda la
  regla por defecto para APUs con/sin anidados.
- No se modifica la logica de calculo ni persistencia del editor light.

Validacion:

- `npm run build` en `frontend`: OK, con warning conocido de chunks grandes.
- `node frontend/scripts/smoke-classic-cronogramas-api-boundary.mjs`: OK.
- `node frontend/scripts/smoke-classic-no-bim-contamination.mjs`: OK.
- Guardas `axiosConfig` fuera de `frontend/src/api` y `console.log` productivos
  fuera de `api`: sin resultados.

No interferencia:

- Sin backend, DB, API, auth/JWT/tenant ni Docker/Coolify.
- Sin UX BIM ni dependencia BIM.
- Sin tocar guardas del baseline TASK-1807.

## 2026-07-07 - TASK-2007 Refresco de revisiones y Pareto Gantt clasico

Modo: GIPROY CLASICO.

Estado: cerrado.

Resultado:

- Se corrige la regresion visual al eliminar una revision: ya no queda en cache
  hasta refrescar la pagina.
- Se centraliza el refresco de familia de revisiones en `Proyectos.jsx` para
  actualizar historial inline, presupuestos, selector Kanban y calendario.
- Se restaura el boton `Clonar Proyecto Completo` en la columna de acciones del
  portafolio/listado.
- Se compacta la zona superior de Proyectos integrando los KPI como chips en la
  toolbar de busqueda/filtros/vistas; la lista gana altura util.
- Si se elimina la revision actualmente abierta, la vista vuelve a R000 o se
  cierra si no existe fallback.
- El clonado completo de proyecto/presupuesto usa el mismo refresco de familia,
  evitando listas incoherentes tras crear la revision.
- Se corrige el crash de Pareto Gantt por `AnimatedSelectedIcon` no definido.

Validacion:

- `node frontend/scripts/smoke-classic-proyectos-logging-boundary.mjs`: OK.
- `node frontend/scripts/smoke-classic-cronogramas-api-boundary.mjs`: OK.
- `node frontend/scripts/smoke-classic-no-bim-contamination.mjs`: OK.
- `npm run build` en `frontend`: OK, con warning conocido de chunks grandes.
- Guardas `axiosConfig` fuera de `frontend/src/api` y `console.log` productivos
  fuera de `api`: sin resultados.

No interferencia:

- Sin UX BIM ni dependencia BIM.
- Sin backend, DB, API, auth/JWT/tenant ni Docker/Coolify.
- Sin tocar guardas del baseline TASK-1807.

## 2026-07-07 - TASK-2006 Clonado de dependencias Gantt en revisiones

Modo: GIPROY CLASICO.

Estado: cerrado.

Resultado:

- Se corrige la regresion del Gantt al entrar en una revision clonada.
- `ProyectoService.create_revision` ahora clona tambien
  `cronogramas_trabajo.schedule_data` del presupuesto original.
- El clonado remapea IDs de lineas de presupuesto en claves, predecesoras,
  dependencias y metadata Gantt conocida.
- La revision local ya creada `Proyecto Prueba Compartir 1` R001
  (`proyecto_id=36`, `presupuesto_id=43`, `cronograma_trabajo_id=8`) fue
  reparada desde R000 y queda con 187 lineas operativas y 29 filas con
  dependencias.

Validacion:

- `cronograma_trabajo_service.get_schedule(...)` sobre `presupuesto_id=43`:
  OK, 187 rows y 29 filas con dependencias.
- `..\.venv\Scripts\python.exe -m pytest app\tests\test_proyecto_service.py::test_create_revision app\tests\test_presupuesto_base_scope_guardrails.py::test_create_revision_remaps_budget_apus_to_new_revision_base -q`:
  OK, 2 passed.
- `..\.venv\Scripts\python.exe -m pytest app\tests\test_proyecto_service.py -q`:
  OK, 7 passed.
- `..\.venv\Scripts\python.exe -m py_compile app\services\proyecto.py app\tests\test_proyecto_service.py`:
  OK.
- `node frontend/scripts/smoke-classic-no-bim-contamination.mjs`: OK.

No interferencia:

- Sin UX BIM ni dependencia BIM.
- Sin cambios frontend productivos, API, auth/JWT/tenant ni Docker/Coolify.
- Sin tocar baseline TASK-1807 ni sus guardas.

## 2026-07-07 - TASK-2005 Restauracion de clonado completo de Proyecto

Modo: GIPROY CLASICO.

Estado: cerrado.

Resultado:

- Se corrige la regresion reportada en `Proyectos`.
- La accion del header del proyecto vuelve a mostrarse como
  `Clonar Proyecto Completo`.
- La creacion de revision ya no queda esperando una recarga manual: el handler
  usa el objeto retornado por `proyectosApi.createRevision`, refresca portafolio
  y familias de revision, cierra el modal si aplica y activa la nueva revision.
- Causa raiz: el cliente API ya devolvia `response.data`, pero el frontend
  intentaba usar `res.data`, por lo que activaba `undefined`.

Validacion:

- `node frontend/scripts/smoke-classic-proyectos-logging-boundary.mjs`: OK.
- `node frontend/scripts/smoke-classic-no-bim-contamination.mjs`: OK.
- Guardas `axiosConfig` fuera de `frontend/src/api` y `console.log` productivos
  fuera de `api`: sin resultados.
- `npm run build` en `frontend`: OK, con warning conocido de chunks grandes
  Vite.
- `..\.venv\Scripts\python.exe -m pytest app\tests\test_proyecto_service.py::test_create_revision app\tests\test_presupuesto_base_scope_guardrails.py::test_create_revision_remaps_budget_apus_to_new_revision_base -q`:
  OK, 2 passed.

No interferencia:

- Sin BIM ni UX BIM.
- Sin backend, DB, API, auth/JWT/tenant ni Docker/Coolify.
- Sin tocar guardas del baseline TASK-1807.

## 2026-07-07 - TASK-2004 Restauracion de empresas asociadas en Transferencias

Modo: GIPROY CLASICO.

Estado: cerrado.

Resultado:

- Se diagnostica la regresion reportada en `Otros Servicios > Envios y
  Transferencias`.
- La UI y la API estaban usando correctamente `selectedEmpresa.id`; el problema
  era dato local ausente en `transfer_allowed_company_recipients`.
- Se comparo la base actual contra el backup de TASK-1955
  `tmp/transfer_all_activity_cleanup_20260619_155124.json`.
- Se restauraron dos asociaciones historicas faltantes mediante el servicio de
  dominio:
  - `Administradores Generales -> Santiago Bermeo`.
  - `Santiago Bermeo -> Jesus Benito Segura Gonzalez`.
- Se mantiene la relacion ya existente
  `Jesus Benito Segura Gonzalez -> Santiago Bermeo`.
- No se tocaron envios, importaciones, snapshots, codigos publicos, licencias ni
  packs Conecta.

Validacion:

- Endpoint `/api/v1/transferencias/recipients` con `empresa_id=1`: OK,
  `Santiago Bermeo`.
- Endpoint `/api/v1/transferencias/recipients` con `empresa_id=2`: OK,
  `Santiago Bermeo`.
- Endpoint `/api/v1/transferencias/recipients` con `empresa_id=3`: OK,
  `Jesus Benito Segura Gonzalez`.
- `..\.venv\Scripts\python.exe -m pytest app\tests\test_transferencias_recipients.py app\tests\test_transferencias_tray.py -q`:
  OK, 15 passed.
- `node frontend/scripts/smoke-classic-transferencias-ui.mjs`: OK.
- `node frontend/scripts/smoke-classic-no-bim-contamination.mjs`: OK.

No interferencia:

- Sin cambios de codigo, API, auth/JWT/tenant, Marketplace, BIM ni
  Docker/Coolify.
- Sin tocar baseline TASK-1807 ni sus guardas.

## 2026-07-07 - TASK-2003 Endurecimiento del editor light APU en Gantt clasico

Modo: GIPROY CLASICO.

Estado: cerrado.

Resultado:

- Se corrige el origen del precio mostrado en el footer del editor light de
  APUs dentro de `Cronogramas > Gantt`.
- En APUs anidados con modo de trabajo `Fijo`, cambiar cantidad recalcula el
  rendimiento contra el trabajo relativo bloqueado y mantiene estable el
  subtotal operativo.
- El footer ya no usa el preview temporal del Gantt para el precio del editor;
  ahora suma los subtotales activos de recursos visibles.
- En empate de gobernante, Mano de Obra tiene prioridad sobre Equipos y
  Herramientas.
- Se eliminan la card superior `Cantidad` y el contador redundante de recursos
  visibles.
- El selector queda compacto, rotulado como `Modo Trabajo`.
- `Cuadrilla` queda como valor calculado y no editable desde el card.
- En una segunda pasada visual, el header del modal y las metricas superiores
  quedan fusionados en una sola fila para recuperar altura util.
- La banda operativa de gobernante/cuadrilla/duracion/rendimiento queda mas
  densa, con menor altura, padding y radio.
- El selector manual de gobernante deja de mostrar la opcion de categoria
  `Mano de Obra`; solo muestra automatico y recursos reales candidatos.
- El modal de cantidades sube por encima de la banda operativa y muestra siempre
  el APU padre antes que los hijos.
- El boton de recarga/restauracion del editor light vuelve a reconstruir desde
  el estado base porque borra tambien drafts de cantidad, lineas fuente y
  politica de trabajo.
- El menu `Herramientas` del Gantt queda corregido: el popover en portal ya no
  se cierra por blur del trigger antes de ejecutar las acciones.

Validacion:

- `npm run build` en `frontend`: OK, con warning conocido de chunks Vite.
- `node frontend/scripts/smoke-classic-no-bim-contamination.mjs`: OK.
- `node frontend/scripts/smoke-classic-cronogramas-api-boundary.mjs`: OK.
- Guardas rapidas de `axiosConfig` fuera de `frontend/src/api` y `console.log`
  productivos fuera de `api`: sin resultados.
- Segunda pasada: `npm run build`, smoke anti-BIM, smoke Cronogramas y guardas
  `axiosConfig`/`console.log`: OK.
- Fix de recarga del editor light: `npm run build`, smoke anti-BIM y smoke
  Cronogramas: OK.
- Fix del menu `Herramientas`: `npm run build`, smoke anti-BIM y smoke
  Cronogramas: OK.

No interferencia:

- Sin BIM ni UX BIM.
- Sin backend, DB, API, auth/JWT/tenant ni Docker/Coolify.
- Sin tocar guardas del baseline TASK-1807.

## 2026-07-07 - TASK-2002 Compactacion del editor light APU en Gantt clasico

Modo: GIPROY CLASICO.

Estado: cerrado.

Resultado:

- Se ajusta el editor light de APUs dentro de `Cronogramas > Gantt`.
- El portal del modal queda elevado con `GANTT_RESOURCE_EDITOR_MODAL_Z_INDEX`
  para superar el header/layout en resoluciones o DPI problematicos.
- El modal gana altura util (`max-h-[96vh]`) y reduce padding exterior.
- Header, botones superiores, tarjetas de resumen y footer/totales quedan mas
  compactos sin cambiar calculos ni persistencia.
- El modal interno de ajuste trazable conserva una jerarquia local estable
  dentro del editor.

Validacion:

- `npm run build` en `frontend`: OK, con warning conocido de chunks Vite.
- `node frontend/scripts/smoke-classic-no-bim-contamination.mjs`: OK.
- `node frontend/scripts/smoke-classic-cronogramas-api-boundary.mjs`: OK.
- Guardas rapidas de `axiosConfig` fuera de `frontend/src/api` y `console.log`
  productivos fuera de `api`: sin resultados.

No interferencia:

- Sin BIM ni UX BIM.
- Sin backend, DB, API, auth/JWT/tenant ni Docker/Coolify.
- Sin tocar guardas del baseline TASK-1807.

## 2026-07-03 - TASK-2001 Docker beta automatizable para servidor clasico

Modo: GIPROY CLASICO.

Estado: cerrado para beta inicial automatizable con datos locales importados.

Resultado:

- Se inventaria el servidor `192.168.18.106` por SSH en modo lectura.
- Capacidades observadas: Ubuntu 24.04.4, 12 cores, 7.6 GiB RAM, 81 GiB libres,
  Docker 29.6.0, Docker Compose v5.2.0.
- Infra existente: Traefik v2.11 en `127.0.0.1:80`, Cloudflared activo,
  Portainer, Gitea, Grafana, Prometheus, Uptime Kuma y Redis.
- Redes existentes reutilizables: `proxy` y `backend`.
- `~/docker/apps` esta libre para la app beta.
- PostgreSQL systemd existe pero el cluster local esta apagado; el despliegue
  nuevo usa PostgreSQL containerizado dedicado para no depender de ese estado.
- Se crea `.dockerignore`, Dockerfiles backend/frontend, Nginx frontend,
  `deploy/docker-compose.beta.yml`, `.env.example`, scripts de preflight,
  backup y despliegue, y documentacion `deploy/README.md`.
- El primer build remoto detecto que `@react-leaflet/core@2.1.1` no existe en
  npm; se corrigio a `2.1.0`, se regenero lock y el build frontend local paso.
- El primer intento de migracion detecto multiples heads Alembic; el servicio
  `migrate` queda ajustado a `alembic upgrade heads`.
- El segundo intento mostro que la migracion inicial es baseline y no crea una
  DB vacia completa; se agrega bootstrap controlado para DB vacia seguido de
  `alembic stamp heads`.
- Aclaracion posterior del usuario: la beta debe iniciar con los datos actuales
  de la base local. Se genera `tmp/giproy-local-seed.sql` desde PostgreSQL 18.4
  local y se alinea el compose a `postgres:18`.
- PostgreSQL 18 exige montar volumen en `/var/lib/postgresql`; el montaje
  anterior `/var/lib/postgresql/data` dejaba el contenedor reiniciando.
- Se importa la base local actual como semilla inicial en el PostgreSQL 18
  containerizado.
- Resultado remoto validado:
  - `giproy-beta-postgres`: healthy.
  - `giproy-beta-backend`: healthy.
  - `giproy-beta-frontend`: healthy.
  - `https://giproy.excomconsultores.com`: HTTP 200.
  - `/api/v1/openapi.json`: responde.
  - Conteos: `usuarios=6`, `empresas=3`, `proyectos=5`, `presupuestos=5`,
    `alembic_version=8`.
  - Flags: `BIM_ENABLED=false`, `CREATE_TABLES_ON_STARTUP=false`.
- Archivos sensibles remotos `.env`, semilla SQL y logs de importacion quedan
  con permisos `600`.
- Se agrega `deploy/scripts/giproy-beta-import-seed.sh` para repetir la carga de
  semilla local sobre el stack beta de forma automatizada.
- El flujo queda aislado bajo `~/docker/apps/giproy-beta`, usa
  `deploy/docker-compose.beta.yml` y publica por Traefik usando `GIPROY_HOST`.

Riesgos/pendientes:

- Hay secretos expuestos previamente en archivos/compose del servidor y en el
  canal de trabajo; rotar credenciales antes de considerar el servidor seguro.
- Rotar credenciales expuestas en el canal de trabajo y en archivos legacy del
  servidor.
- Definir rutina de backup externo antes de considerar esta beta como entorno
  persistente de larga vida.

No interferencia:

- Sin UX BIM ni dependencia nueva hacia BIM.
- Sin cambios funcionales en API, auth/JWT/tenant, cronogramas, presupuestos ni
  frontend clasico.
- Sin tocar contenedores existentes ni borrar DB.

## 2026-06-30 - TASK-2000 Editor light Gantt trazable para recursos explotados

Modo: GIPROY CLASICO.

Estado: slice de editor light implementado y validado focalmente. Goal
transversal completo sigue activo.

Resultado:

- Se retira del editor light de APU en Gantt el selector `APU / Presupuesto`.
- La tabla de recursos vuelve a una unica lectura operativa del APU.
- La tarjeta `Cantidad presupuesto` queda como referencia informativa, sin
  actuar como modo de lectura ni cambiar persistencia.
- En recursos de APUs anidados explotados, la cantidad ya no se edita inline:
  abre un modal de ajuste trazable por aportes APU base/APUs anidados.
- El editor light permite elegir `Trabajo fijo` o `Trabajo variable` como
  politica unica del APU abierto.
- En `Trabajo fijo`, el trabajo relativo queda fijo y el rendimiento se calcula
  al modificar cantidad.
- En `Trabajo variable`, cantidad y rendimiento son editables y el trabajo/costo
  preview puede variar.
- Las lineas fuente ajustadas y la politica elegida se conservan en metadatos
  del borrador Gantt.
- La intencion de borrador explicita politicas de trabajo y lineas fuente.
- El resumen de modificacion funcional preserva `work_policy` junto a
  `source_lines` para auditoria.
- Al aplicar globalmente Gantt, los aportes trazables aceptados actualizan
  `apu_lineas` reales por `linea_id`.
- Para APUs hijos anidados, la aplicacion distingue contrato nuevo y legado:
  `Materiales`/`Transporte` convierten cantidad equivalente del padre mediante
  `inherited_factor`, mientras `Equipos y Herramientas`/`Mano de Obra`
  preservan la cantidad nativa del APU origen y aplican el factor al
  trabajo/rendimiento relativo.
- Si un snapshot operativo existente no trae `inherited_factor`, el backend lo
  infiere desde la jerarquia real del APU raiz de la linea de presupuesto antes
  de escribir `apu_lineas`, protegiendo borradores/snapshots antiguos.
- Se recalculan APUs afectados y padres antes de crear la modificacion funcional
  activa.
- El resumen oficial expone `operational_apu_application`.
- La auditoria distingue `affected_line_ids` de presupuesto y
  `affected_apu_line_ids`; `affected_apu_ids` incluye hijos/padres recalculados.
- Recursos de cronograma y reportes de uso de recursos quedan cubiertos con
  pruebas focales que leen las `apu_lineas` materializadas tras una aplicacion
  global Gantt, consolidando padre/hijo desde la fuente oficial.
- Se agrega preflight comun de APUs con recursos listos: Gantt, Cronograma
  Recursos y Reportes de Uso de Recursos bloquean con `apu_resources_incomplete`
  si una linea de presupuesto apunta a un APU sin recursos hoja alcanzables.
- La vista de Cronogramas normaliza ese error estructurado en un mensaje
  operativo conciso, con primeras lineas/APUs afectados, evitando renderizar
  objetos tecnicos en la UI.
- En el editor light, `Trabajo fijo` / `Trabajo variable` queda como politica
  unica del APU abierto, visible con `ProjectSegmentedSwitch`; el modal de
  aportes trazables ya no permite selector por recurso.
- El modal de aportes trazables queda compacto, sin texto auxiliar largo, sin
  desbordar por ancho minimo y con botones alineados a la politica visual de
  modales de Proyectos.
- Los totales del modal trazable quedan alineados bajo las columnas `Cantidad`
  y `Trabajo` para reducir ambiguedad visual.
- Correccion posterior de recuperacion: `CronogramaGantt.jsx` queda reconstruido
  con modal trazable, selector global de trabajo del APU, total de rendimiento
  visible bajo `Rend.`, precio oficial en `Precio en presupuesto`, preview
  operativo separado y guardas de foco/cancelacion/persistencia diferida.
- Correccion de trazabilidad del modal: cuando el APU tiene snapshot
  `apu_operational_resources_v1` con anidados, el editor light alimenta la
  tabla desde los recursos operativos consolidados y sus `source_lines`, no
  desde las lineas planas del APU padre.
- Las `source_lines` operativas ahora transportan descripcion, codigo y unidad
  del APU origen; el modal de cantidades muestra esa lectura funcional y deja
  los IDs solo como fallback para snapshots antiguos.
- La explosion clasica queda centralizada en
  `backend/app/services/apu_explosion.py`; Gantt, Cronograma Recursos y
  Reportes de Uso de Recursos consumen la misma rutina para evitar formulas
  divergentes.
- Los snapshots historicos guardados en `row.metadata` se tratan como cache
  regenerable: si el APU/base oficial esta disponible, el backend reconstruye
  el snapshot operacional desde la fuente vigente y no muestra cantidades
  equivalentes obsoletas en recursos de rendimiento.
- Se restauran las guardas de calendario oficial fusionado, APUs hijos dentro
  de Materiales, color sobrio de anidados, preflight de aplicacion global,
  intencion acumulada de borrador y bloqueo colaborativo de edicion Gantt.

Validacion ejecutada:

- `npm run build` en `frontend`: OK, con warning conocido de chunks Vite.
- `node frontend/scripts/smoke-classic-cronogramas-api-boundary.mjs`: OK.
- `node frontend/scripts/smoke-classic-no-bim-contamination.mjs`: OK.
- `node frontend/scripts/smoke-classic-presupuesto-api-boundary.mjs`: OK.
- `pytest app/tests/test_cronograma_trabajo_budget_price_application.py
  app/tests/test_project_functional_modification_service.py`: OK.
- `pytest app/tests/test_cronograma_trabajo_duration_model.py`: OK.
- `pytest app/tests/test_cronograma_recursos_service.py
  app/tests/test_reporting_cronograma_integrated_reports.py`: OK.
- `pytest app/tests/test_cronograma_recursos_service.py
  app/tests/test_reporting_cronograma_integrated_reports.py
  app/tests/test_cronograma_trabajo_budget_price_application.py`: OK.
- `pytest app/tests/test_cronograma_trabajo_budget_price_application.py
  app/tests/test_project_functional_modification_service.py
  app/tests/test_cronograma_trabajo_duration_model.py`: OK.
- `tools/ai_tools/validate_enterprise_baseline.py --include-frontend`: OK, con
  warnings conocidos de Pydantic BIM `model_name/model_id` y chunks Vite.
- Ajuste politica global APU/editor light: `npm run build`, smoke Cronogramas y
  smoke anti-BIM OK, con warning conocido de chunks Vite.
- Correccion de recuperacion del editor light: `npm run build`, smoke
  Cronogramas y smoke anti-BIM OK, con warning conocido de chunks Vite. El
  reinicio de `GiProy-Backend` y `GiProy-Frontend` no pudo ejecutarse desde la
  sesion por permisos del servicio Windows.
- Correccion modal trazable padre/hijos: `npm run build`, smoke Cronogramas y
  smoke anti-BIM OK, con warning conocido de chunks Vite.
- Correccion descripcion/unidad de APU origen en modal trazable: `py_compile`
  focal OK, `pytest app/tests/test_cronograma_trabajo_duration_model.py` OK,
  build frontend OK, smokes de fronteras/Cronogramas/anti-BIM OK y baseline
  enterprise con frontend OK, con warnings conocidos.
- Regla unica de explosion clasica: `py_compile` focal OK para
  `apu_explosion.py`, `cronograma_trabajo.py`, `cronograma_recursos.py`,
  `reporting.py` y `cronogramas_trabajo.py`; pytest focal OK con
  `test_cronograma_trabajo_duration_model.py`,
  `test_cronograma_trabajo_budget_price_application.py`,
  `test_cronograma_recursos_service.py` y
  `test_reporting_cronograma_integrated_reports.py` (`60 passed`, warnings
  Pydantic conocidos).
- Validacion real solo lectura `Santiago Bermeo`: empresa `3`, proyecto `7`,
  presupuesto `13`, cronograma trabajo `1`, APU `794` Hormigon ciclopeo con
  APUs hijos `608` y `617`; snapshot operacional produce `16` recursos y
  consolida `Peon` desde padre/hijos.
- Reinicio de `GiProy-Backend` y `GiProy-Frontend`: intentado con
  `Restart-Service` y `sc.exe stop`, incluido intento elevado; Windows devuelve
  `Cannot open service` / `Acceso denegado`. Ambos servicios estan `Running`,
  pero el runtime servido requiere reinicio administrativo externo para cargar
  backend/frontend nuevos.
- El usuario reinicio backend/frontend y se certifico que el frontend servido en
  `localhost:3010` ya carga el bundle correcto: contiene `Trabajo fijo`,
  `Trabajo variable` y `gantt_resource_source_lines_drafts_v1`, y no contiene
  `APU / Presupuesto`. Despues de esa certificacion se hizo el endurecimiento
  backend de `inherited_factor` inferido y preflight `apu_resources_incomplete`,
  por lo que el backend requiere un reinicio adicional para certificar runtime
  de esas ultimas protecciones.

Pendiente explicito para cerrar el goal:

- Certificar que la aplicacion global de Gantt propaga las lineas fuente y la
  politica de trabajo hacia la fuente oficial proyecto/revision.
- Verificar reflejo coherente en datos reales: Presupuesto, APUs, Cronogramas
  valorados, Recursos y reportes tras reinicio administrativo del runtime.
- Validar invalidaciones por regla de ultimo cambio determinista.
- Realizar prueba funcional con datos reales de `Santiago Bermeo`.

No interferencia:

- Sin BIM ni UX BIM.
- Sin DB, auth/JWT/tenant ni Docker/Coolify.
- Sin cambios en explosion de materiales.

## 2026-06-30 - TASK-1999 Incidencia presupuesto operativo/Gantt

Modo: GIPROY CLASICO.

Estado: cerrado.

Resultado:

- Se reproduce la incidencia reportada: Presupuesto y Gantt no podian resolver
  el presupuesto operativo para `Santiago Bermeo`, proyecto `Proyecto Prueba
  Compartir 1`, revision `0`.
- La causa no era el proyecto ni el presupuesto: existian `presupuesto_id=13` y
  `cronograma_trabajo_id=1`.
- La causa raiz era una migracion pendiente en la DB real: faltaban
  `cronogramas_gantt_drafts`, `cronogramas_gantt_edit_locks` y
  `project_functional_modifications`.
- Se ejecuto `alembic upgrade de1991a1b2c3`, creando solo tablas/indices no
  destructivos de la rama necesaria.

Validacion:

- Tablas nuevas verificadas en PostgreSQL: OK.
- Presupuesto operativo `13` serializa `201` lineas: OK.
- Gantt trabajo serializa `187` filas: OK.

No interferencia:

- Sin cambios BIM ni UX BIM.
- Sin Docker/Coolify/CI/CD/staging/produccion.
- Sin cambios destructivos DB ni auth/JWT/tenant.

## 2026-06-29 - TASK-1998 Endurecimiento transversal de fuente oficial APU/reportes

Modo: GIPROY CLASICO.

Estado: implementado, validado focalmente y cerrado con baseline enterprise.

Resultado:

- La resolucion de precios APU oficiales por proyecto/revision/base queda en el
  servicio de modificacion funcional, no duplicada en endpoints.
- Reportes APU y `Presupuesto + APUs` aplican la fuente oficial activa.
- Las caches de reportes incluyen la firma de fuente oficial para evitar
  artefactos generados con una modificacion anterior.
- Ediciones directas de APU, movimientos de lineas y tanteos de presupuesto
  registran modificacion funcional activa y desplazan la fuente previa.
- Los borradores Gantt relacionados se invalidan por APU afectado, no de forma
  global.

Validacion:

- `py_compile` focal backend: OK.
- `pytest` fuente oficial/APUs/reporting/Gantt workflow: OK, `29 passed`.
- `pytest` reporting focal: OK, `28 passed`.
- `npm run build`: OK, warning conocido de chunks grandes Vite.
- Smokes clasicos clave y anti-BIM: OK.
- Baseline enterprise `validate_enterprise_baseline.py --include-frontend`: OK.

No interferencia:

- Sin cambios BIM ni UX BIM.
- Sin Docker/Coolify/CI/CD/staging/produccion.
- Sin cambios destructivos DB ni auth/JWT/tenant.

## 2026-06-29 - TASK-1997 Overlay oficial contextual en APUs de proyecto

Modo: GIPROY CLASICO.

Estado: implementado y validado focalmente. El goal global sigue abierto.

Resultado:

- APUs puede leer precio oficial activo cuando la consulta viene con
  `proyecto_id` y revision/base.
- El catalogo puro sin contexto de proyecto conserva la lectura base.
- `ApuBudgetEditor` y `APUs.jsx` envian contexto de proyecto cuando trabajan
  desde proyecto/presupuesto activo.
- `APUResponse` agrega metadatos no destructivos de fuente oficial.

Validacion:

- `py_compile` focal backend: OK.
- `pytest` focal APUs + presupuesto/Gantt + modificacion funcional: OK,
  `9 passed`.
- `npm run build`: OK, con warning conocido de chunks grandes Vite.
- `smoke-classic-precios-unitarios-ui-guards`: OK.
- `smoke-classic-presupuesto-api-boundary`: OK.
- `smoke-classic-cronogramas-api-boundary`: OK.
- `smoke-classic-no-bim-contamination`: OK.

No interferencia:

- Sin cambios BIM, sin UX BIM y sin acoplamientos nuevos hacia BIM.
- Sin Docker/Coolify/CI/CD/staging/produccion.
- No se certifican aun todos los reportes ni el flujo Valorados -> Recursos.

## 2026-06-29 - TASK-1996 Endurecimiento inicial de precio oficial Gantt-Presupuesto

Modo: GIPROY CLASICO.

Estado: implementado y validado focalmente. El goal global sigue abierto.

Resultado:

- `mark_gantt_draft_applied` aplica `price_preview` a `PresupuestoDetalle`
  usando la politica Decimal oficial.
- `refresh_presupuesto_prices(...)` respeta la modificacion oficial activa y no
  pisa precios determinados por Gantt al refrescar desde APUs base.
- Presupuesto crea modificacion funcional activa de origen `presupuesto` en
  cambios deterministas de lineas.
- La modificacion de presupuesto supersede la previa del mismo
  proyecto/revision/base, cumpliendo la regla de ultima modificacion.

Validacion:

- `py_compile` focal backend: OK.
- `pytest` focal modificacion funcional + aplicacion precio presupuesto: OK,
  `8 passed`.
- `smoke-classic-cronogramas-api-boundary`: OK.
- `smoke-classic-presupuesto-api-boundary`: OK.
- `smoke-classic-no-bim-contamination`: OK.

No interferencia:

- Sin cambios BIM, sin UX BIM y sin acoplamientos nuevos hacia BIM.
- Sin Docker/Coolify/CI/CD/staging/produccion.
- Sin cambios auth/JWT/tenant ni cambios destructivos PostgreSQL.
- No se certifica aun APUs/APU Analysis/reportes/Valorados/Recursos como cierre
  global.

## 2026-06-29 - TASK-1995 Contrato normalizado de modificacion oficial activa

Modo: GIPROY CLASICO.

Estado: implementado y validado focalmente.

Resultado:

- `resolve_official_source(...)` devuelve una `summary` normalizada.
- La `summary` identifica lineas, APUs y recursos afectados.
- La `summary` conserva `line_payload_map` y `operational_snapshots` del editor
  light, con cantidades, rendimientos, precios y origen.
- `CronogramaGantt` adjunta `price_preview` en la intencion del editor light,
  conservando precio directo, indirecto, total unitario y total antes/despues.
- El fallback `base_proyecto` devuelve contrato vacio estable.

Validacion:

- `py_compile` focal backend: OK.
- `pytest app/tests/test_project_functional_modification_service.py`: OK,
  `4 passed`.
- `smoke-classic-no-bim-contamination`: OK.
- `npm run build`: OK, con warning conocido de chunks grandes Vite.

No interferencia:

- Sin cambios BIM, sin UX BIM y sin acoplamientos nuevos hacia BIM.
- Sin Docker/Coolify/CI/CD/staging/produccion.
- Sin recalcular precios oficiales ni modificar Presupuesto/APUs.

## 2026-06-29 - TASK-1994 Registro de modificacion activa al aplicar Gantt global

Modo: GIPROY CLASICO.

Estado: implementado y validado focalmente.

Resultado:

- `mark_gantt_draft_applied` crea `ProjectFunctionalModification` tras validar
  y marcar aplicado el borrador Gantt.
- La modificacion activa conserva fuente `gantt`, referencia al draft,
  cronograma, `work_origin`, intenciones, lineas persistidas y snapshot.
- El audit log del draft aplicado recibe `active_modification_id`.
- Se infiere `base_trabajo_id` desde las lineas APU del presupuesto con fallback
  seguro a `None`.

Validacion:

- `py_compile` focal backend: OK.
- `pytest` focal Gantt workflow + modificacion funcional: OK, `20 passed`.
- `smoke-classic-cronogramas-api-boundary`: OK.

No interferencia:

- Sin cambios BIM, sin UX BIM y sin acoplamientos nuevos hacia BIM.
- Sin Docker/Coolify/CI/CD/staging/produccion.
- Sin recalcular precios oficiales ni modificar Presupuesto/APUs.

## 2026-06-29 - TASK-1993 Resolvedor de fuente oficial determinada

Modo: GIPROY CLASICO.

Estado: implementado y validado focalmente.

Resultado:

- `project_functional_modification_service.resolve_official_source(...)`
  implementa la regla:
  `modificacion_activa si existe; si no, base_proyecto`.
- Devuelve `snapshot`, `patch`, `source_ref`, `origin`,
  `active_modification_id` y alcance normalizado.
- No se migran todavia consumidores ni se recalculan precios.

Validacion:

- `py_compile` focal backend: OK.
- `pytest` focal de modificacion funcional: OK, `3 passed`.

No interferencia:

- Sin cambios BIM, sin UX BIM y sin acoplamientos nuevos hacia BIM.
- Sin Docker/Coolify/CI/CD/staging/produccion.
- Sin cambios auth/JWT/tenant ni cambios destructivos PostgreSQL.
- Sin alterar Presupuesto/APUs/Gantt visible.

## 2026-06-29 - TASK-1992 Contrato persistente de modificacion activa

Modo: GIPROY CLASICO.

Estado: implementado y validado focalmente.

Resultado:

- Se crea `ProjectFunctionalModification`.
- Se crea migracion no destructiva
  `de1991a1b2c3_project_functional_modifications.py`.
- Se crea `project_functional_modification_service`.
- `create_active(...)` supersede la modificacion activa previa del mismo
  alcance sin borrarla.
- El alcance incluye empresa, proyecto, presupuesto, base de trabajo y revision.

Validacion:

- `py_compile` focal backend: OK.
- `pytest` focal de modificacion funcional + fuente funcional + duracion
  cronogramas: OK, `26 passed`.

No interferencia:

- Sin cambios BIM, sin UX BIM y sin acoplamientos nuevos hacia BIM.
- Sin Docker/Coolify/CI/CD/staging/produccion.
- Sin recalcular precios oficiales ni modificar Presupuesto/APUs.
- Sin cambios auth/JWT/tenant.

## 2026-06-29 - TASK-1991 Resolvedor comun inicial de fuente funcional APU

Modo: GIPROY CLASICO.

Estado: implementado y validado focalmente.

Resultado:

- Se crea `backend/app/services/functional_source.py` como primer punto comun
  para resolver fuente funcional APU.
- Se extrae la lectura de `apu_resource_modifications_v1` desde
  `cronograma_trabajo_service`.
- `cronograma_trabajo_service` conserva la misma salida operacional, pero ya no
  contiene internamente la decision de fuente activa APU.

Validacion:

- `py_compile` focal backend: OK.
- `pytest` focal `test_functional_source.py` +
  `test_cronograma_trabajo_duration_model.py`: OK, `24 passed`.

No interferencia:

- Sin cambios BIM, sin UX BIM y sin acoplamientos nuevos hacia BIM.
- Sin Docker/Coolify/CI/CD/staging/produccion.
- Sin cambios auth/JWT/tenant ni cambios destructivos PostgreSQL.
- Sin recalcular precios oficiales ni modificar Presupuesto/APUs.

## 2026-06-29 - TASK-1990 Control de estado real de politica transversal

Modo: GIPROY CLASICO.

Estado: control cerrado; implementacion transversal pendiente por fases.

Resultado:

- Se verifica que el workspace esta completo.
- Se separa lo implementado de lo planificado para la politica universal de
  cronogramas/precios:
  - implementado: borrador Gantt persistente, lock, preflight, invalidaciones,
    firma de persistencia y firma de origen;
  - pendiente: fuente oficial determinada comun, modificacion activa,
    aplicacion todo-o-nada, origen `valorados`, panel comun y grid trazable de
    APUs anidados.
- Se crea `docs/tasks/TASK-1990.md` como control de estado real y lista de
  modificaciones necesarias.

Validacion:

- `verify_workspace_completeness.py`: OK, `COMPLETE_WORKSPACE`.
- `py_compile` focal backend: OK.
- `pytest` focal Gantt workflow: OK, `17 passed`.
- `smoke-classic-cronogramas-api-boundary`: OK.
- `smoke-classic-no-bim-contamination`: OK.
- baseline enterprise con frontend: OK, con warnings conocidos.

No interferencia:

- Sin cambios BIM, sin UX BIM y sin acoplamientos nuevos hacia BIM.
- Sin Docker/Coolify/CI/CD/staging/produccion.
- Sin cambios auth/JWT/tenant ni cambios destructivos PostgreSQL.

## 2026-06-29 - TASK-1989 Firma de origen para trabajo no aprobado

Modo: GIPROY CLASICO.

Estado: implementado y validado focalmente.

Resultado:

- `gantt_workflow_service` normaliza y persiste `work_origin` en el
  `base_snapshot` de cada borrador Gantt.
- Un cronograma con trabajo no aprobado activo no puede aceptar otro origen
  operativo en el mismo borrador.
- Las intenciones heredan el origen del borrador y se rechazan si declaran un
  origen distinto.
- El preflight y la aplicacion global exponen/verifican `work_origin`.
- La aplicacion global con intenciones pendientes exige
  `application_result.work_origin`; `CronogramaGantt` lo envia junto a
  `persisted_line_ids`.
- No se recalculan precios ni se modifica la explosion de APUs anidados.

Validacion:

- `verify_workspace_completeness.py`: OK, `COMPLETE_WORKSPACE`.
- `py_compile` focal backend: OK.
- `pytest` focal Gantt workflow: OK, `17 passed`.
- `smoke-classic-cronogramas-api-boundary`: OK.

No interferencia:

- Sin cambios BIM, sin UX BIM y sin acoplamientos nuevos hacia BIM.
- Sin Docker/Coolify/CI/CD/staging/produccion.
- Sin cambios auth/JWT/tenant ni cambios destructivos PostgreSQL.
- Sin aplicar precios oficiales ni tocar Presupuesto/APUs.

## 2026-06-27 - TASK-1988 Firma backend de aplicacion global Gantt

Modo: GIPROY CLASICO.

Estado: implementado y validado.

Resultado:

- `CronogramaGanttDraftApplyRequest` incorpora `application_result`.
- `gantt_workflow_service.mark_draft_applied(...)` exige una firma de
  persistencia global con `persisted_line_ids` si el borrador contiene
  intenciones pendientes.
- `CronogramaGantt` envia esa firma solo despues de persistir filas y
  sincronizar el Valorado.
- El cierre del borrador conserva la firma en auditoria.
- No se recalculan precios ni se modifica la explosion de APUs anidados.

Validacion:

- `py_compile` focal backend: OK.
- `pytest` focal Gantt workflow: OK, `13 passed`.
- `smoke-classic-cronogramas-api-boundary`: OK.
- `smoke-classic-no-bim-contamination`: OK.
- `npm run build`: OK, con warning conocido de chunks grandes Vite.
- baseline enterprise con frontend: OK, con warnings conocidos Pydantic BIM
  `model_name/model_id` y chunks grandes Vite.

No interferencia:

- Sin cambios BIM, sin UX BIM y sin acoplamientos nuevos hacia BIM.
- Sin Docker/Coolify/CI/CD/staging/produccion.
- Sin cambios auth/JWT/tenant ni cambios destructivos PostgreSQL.
- Sin aplicar precios oficiales ni tocar la explosion de materiales/APUs
  anidados.

## 2026-06-27 - TASK-1987 Cancelacion de borradores Gantt por cambio de estado de proyecto

Modo: GIPROY CLASICO.

Estado: implementado y validado.

Resultado:

- `gantt_workflow_service.cancel_active_drafts_for_project(...)` cancela
  borradores Gantt activos por proyecto/empresa.
- Al cambiar realmente `Proyecto.estado`, `proyecto_service.update_proyecto(...)`
  cancela los borradores Gantt no propagados del proyecto.
- La cancelacion conserva auditoria y marca intenciones pendientes/invalidadas/
  pendientes de reajuste como `cancelled`.
- No se aplican valores Gantt, no se recalculan precios y no se propaga nada a
  Presupuesto/APUs/Cronogramas derivados.

Validacion:

- `py_compile` focal backend: OK.
- `pytest` focal Gantt workflow: OK, `12 passed`.
- `smoke-classic-no-bim-contamination`: OK.
- `npm run build`: OK, con warning conocido de chunks grandes Vite.
- baseline enterprise con frontend: OK, con warnings conocidos Pydantic BIM
  `model_name/model_id` y chunks grandes Vite.

No interferencia:

- Sin cambios BIM, sin UX BIM y sin acoplamientos nuevos hacia BIM.
- Sin Docker/Coolify/CI/CD/staging/produccion.
- Sin cambios auth/JWT/tenant ni cambios destructivos PostgreSQL.
- Sin aplicar ni propagar borradores Gantt.

## 2026-06-27 - TASK-1986 Advertencias de borrador Gantt en reportes oficiales

Modo: GIPROY CLASICO.

Estado: implementado y validado.

Resultado:

- Los reportes de `cronograma_valorado` pueden incluir una advertencia cuando
  existe un borrador Gantt activo no propagado.
- La advertencia cubre intenciones `pending`, `invalidated` y
  `adjustment_required`.
- Los calculos oficiales no incorporan borradores Gantt: la Base de Proyecto /
  revision activa sigue siendo la fuente oficial.
- La clave de cache de export de Cronogramas incluye la firma del borrador Gantt
  para no reutilizar un reporte sin advertencia si cambia el estado del
  borrador.
- `CommonReportPreviewModal` muestra una banda ambar sobria para advertencias
  de reporte.
- El reporte especializado de Uso de Recursos muestra advertencia en preview,
  XLSX y PDF sin desplazar sus columnas clave.

Validacion:

- `py_compile` focal backend: OK.
- `pytest` focal de reporting cronogramas: OK, `22 passed`.
- `smoke-classic-cronogramas-api-boundary`: OK.
- `smoke-classic-no-bim-contamination`: OK.
- `npm run build`: OK, con warning conocido de chunks grandes Vite.
- baseline enterprise con frontend: OK, con warnings conocidos Pydantic BIM
  `model_name/model_id` y chunks grandes Vite.

No interferencia:

- Sin cambios BIM, sin UX BIM y sin acoplamientos nuevos hacia BIM.
- Sin Docker/Coolify/CI/CD/staging/produccion.
- Sin cambios auth/JWT/tenant ni cambios destructivos PostgreSQL.
- Sin aplicar ni propagar borradores Gantt.

## 2026-06-26 - TASK-1985 Borradores Gantt backend y lock de edicion

Modo: GIPROY CLASICO.

Estado: implementado y validado focalmente.

Resultado:

- Se crea el carril backend para borradores Gantt persistentes sin propagacion
  global.
- Se crea lock exclusivo de edicion por cronograma, permitiendo lectura
  concurrente y bloqueando edicion simultanea.
- `cronogramas-trabajo` expone endpoints para:
  - leer borrador Gantt;
  - guardar intencion confirmada del editor light;
  - ejecutar preflight de aplicacion global del borrador;
  - marcar el borrador como aplicado despues de confirmar globalmente;
  - adquirir lock;
  - renovar heartbeat;
  - solicitar liberacion del lock activo;
  - liberar lock.
- `cronogramasApi` expone metodos de dominio para todos esos endpoints.
- `Cronogramas.jsx` carga borrador Gantt persistente junto al cronograma
  operativo y muestra indicador discreto de borrador no propagado.
- `CronogramaGantt.jsx` toma lock antes de abrir el editor light, conserva
  heartbeat y libera lock al cancelar o aceptar.
- Si otro usuario tiene el lock, la UI mantiene lectura, permite solicitar
  liberacion y muestra al propietario una accion discreta para liberar sin
  transferencia automatica del lock.
- Aceptar en el editor light guarda intencion de borrador Gantt acumulada; ya no
  escribe una modificacion confirmada ni propaga valores oficiales.
- Confirmar globalmente el Gantt valida automaticamente el borrador antes de
  aplicar: si hay lineas invalidadas, se bloquea con causa operativa; si el
  flujo clasico aplica y sincroniza, el borrador se cierra como `applied`.
- Presupuesto invalida parcialmente el borrador Gantt activo cuando cambia la
  fuente oficial:
  - ediciones y bulk de cantidad por linea invalidan solo esa linea;
  - fusiones invalidan linea destino y absorbida;
  - tanteos oficiales invalidan por `apu_id`;
  - `affected_line_ids` participa en la deteccion de relacion.
- La UI de Gantt muestra el conteo de invalidadas y permite descartarlas con
  confirmacion, limpiando sus previews sin afectar intenciones pendientes
  compatibles.
- La UI tambien permite preparar reajuste de invalidadas: conserva solo la
  intencion operativa compatible, elimina previews/snapshots derivados antiguos,
  marca las lineas como `adjustment_required` y bloquea la aplicacion global
  hasta que el usuario reabra y acepte el editor light desde la base vigente.
- Reaceptar el editor light reemplaza la intencion stale relacionada y no apila
  estados ambiguos.
- `CronogramaGantt` limpia de memoria local las lineas gestionadas por backend
  que ya no existen en `preview_snapshot.line_payload_map`, evitando fugas de
  preview tras descartar o preparar reajuste.
- El smoke de frontera Cronogramas cubre el nuevo contrato API y la politica de
  borrador del editor light.

Validacion:

- `py_compile` focal backend: OK.
- `pytest` focal Gantt workflow: 11 passed.
- `smoke-classic-cronogramas-api-boundary`: OK.
- `smoke-classic-no-bim-contamination`: OK.
- `npm run build`: OK, con warning conocido de chunks grandes Vite.
- Baseline enterprise con frontend: OK, con warnings conocidos Pydantic BIM
  `model_name/model_id` y chunks grandes Vite.

Pendiente:

- Continuar con el siguiente slice de aplicacion global real del borrador Gantt
  hacia los modulos oficiales, manteniendo el preflight como barrera.

No interferencia:

- Sin cambios BIM, UX BIM, Docker/Coolify, CI/CD, staging ni produccion.
- Sin duplicar la aplicacion global: la persistencia productiva sigue en el
  flujo clasico existente y este slice solo gobierna el estado del borrador.
- Sin recalcular Presupuesto ni precios oficiales.
- Sin cambios destructivos PostgreSQL.
- Sin reabrir `TASK-1807`.

## 2026-06-25 - TASK-1983 Cancelacion transaccional del editor light Gantt

Modo: GIPROY CLASICO.

Estado: implementado y validado.

Resultado:

- El `X` superior invalida la sesion del editor antes de restaurar el borrador
  capturado al abrir.
- Cantidad, rendimiento, gobernanza y snapshot operativo no sobreviven al
  cierre sin Aceptar.
- Las sincronizaciones tardias del modal desmontandose quedan ignoradas.
- El rollback utiliza una copia profunda y limpia referencias temporales.

Validacion:

- Smoke Cronogramas y smoke anti-BIM: OK.
- `npm run build`: OK, con warning conocido de chunks grandes Vite.
- Baseline enterprise con frontend: OK, con warnings conocidos Pydantic BIM
  `model_name/model_id`.

No interferencia:

- Sin cambios en formulas de explosion, trabajo relativo, cantidad de
  presupuesto, backend, DB, API, auth/JWT, tenant, EDT, BIM,
  Docker/Coolify, CI/CD, staging, produccion ni `TASK-1807`.

## 2026-06-25 - TASK-1982 Invariante de trabajo fijo en recursos explotados de Gantt

Modo: GIPROY CLASICO.

Estado: implementado y validado.

Resultado:

- Se localiza la ruptura en el estado reactivo del editor light, que trataba
  cantidad y rendimiento de recursos explotados como variables independientes.
- `trabajo_relativo` pasa a ser la fuente de verdad.
- Al editar cantidad, el rendimiento se deriva en vivo mediante
  `trabajo_relativo / cantidad`.
- La persistencia de cantidad y rendimiento queda atomica.
- Backend normaliza snapshots explotados antiguos desde sus `source_lines`.
- La solucion es comun para todas las empresas y consumidores de Cronogramas.
- Santiago Bermeo confirma 18 snapshots anidados y 230 recursos sin corrupcion
  persistida; el fallo era de comportamiento durante la edicion.

Validacion:

- `py_compile` focal: OK.
- `pytest` focal: 21 passed.
- Smoke Cronogramas y smoke anti-BIM: OK.
- `npm run build`: OK, con warning conocido de chunks grandes Vite.
- Baseline enterprise con frontend: OK, con warnings conocidos Pydantic BIM
  `model_name/model_id`.
- `GiProy-Frontend` sirve `frontend/dist` mediante `vite preview`; el build
  actualizado queda en el directorio servido.
- El reinicio de los servicios NSSM fue bloqueado por permisos locales, por lo
  que la nueva defensa backend requiere el siguiente reinicio administrativo
  de `GiProy-Backend`.

No interferencia:

- Sin cambios en cantidad de presupuesto, explosion recursiva base, APUs
  contractuales, DB, auth/JWT, tenant, EDT, BIM, Docker/Coolify, CI/CD,
  staging, produccion ni guardas de `TASK-1807`.

## 2026-06-24 - TASK-1981 Entrada natural en cantidad y rendimiento del editor light Gantt

Modo: GIPROY CLASICO.

Estado: implementado y validado.

Resultado:

- `frontend/src/components/projects/CronogramaGantt.jsx` separa la escritura
  cruda de `Cantidad` y `Rendimiento` de la persistencia de metadata.
- Mientras el usuario escribe, el modal mantiene el texto tal como se introduce
  y recalcula con el valor parseado local.
- Al salir del campo, el valor se normaliza visualmente y se persiste en
  `gantt_resource_drafts_v1` o `gantt_resource_quantity_drafts_v1`.
- `frontend/scripts/smoke-classic-cronogramas-api-boundary.mjs` queda reforzado
  para exigir que la persistencia ocurra en `blur`, no durante cada `onChange`.
- La sincronizacion interna del modal conserva el texto del input enfocado y
  evita reinyectar `formatoCantidad` durante la escritura.
- Al recibir foco, los inputs `Cantidad` y `Rendimiento` seleccionan todo el
  valor para permitir reemplazo directo.
- `Escape` cancela la edicion sin persistir el valor parcial.
- `resourceLines` queda estabilizado con `useMemo` para evitar re-render loops
  al entrar o interactuar con Gantt.
- El build corregido esta generado, pero el reinicio de servicios Windows desde
  esta sesion fue bloqueado por permisos locales:
  `OpenService ERROR 5: Acceso denegado`.

Validacion:

- `cmd /c node frontend\scripts\smoke-classic-cronogramas-api-boundary.mjs`: OK.
- `cmd /c node frontend\scripts\smoke-classic-no-bim-contamination.mjs`: OK.
- `npm run build`: OK, con warning conocido de chunks grandes Vite.
- `.\.venv\Scripts\python.exe tools\ai_tools\validate_enterprise_baseline.py --include-frontend`:
  OK, con warnings conocidos Pydantic BIM `model_name/model_id`.

No interferencia:

- Sin cambios en explosion de APUs anidados, consolidacion de recursos,
  snapshots operativos, ruta critica, backend, DB, API, auth/JWT, tenant, EDT,
  Presupuestos base, BIM, Docker/Coolify, CI/CD, staging, produccion ni
  reapertura de `TASK-1807`.

## 2026-06-24 - TASK-1980 Ajuste color anidado en editor light Gantt

Modo: GIPROY CLASICO.

Estado: implementado y validado.

Resultado:

- `frontend/src/components/projects/CronogramaGantt.jsx` cambia el color del
  origen operativo `anidado` de rojo/naranja a ocre sobrio.
- El color se aplica a descripcion, unidad de medida y etiqueta del recurso en
  el editor light.
- El rojo se mantiene disponible para estados que si comunican alerta o
  conflicto, como `no_fusionado`.
- `frontend/scripts/smoke-classic-cronogramas-api-boundary.mjs` queda reforzado
  para exigir el color sobrio en `anidado` y evitar que vuelva al rojo/naranja.

Validacion:

- `cmd /c node frontend\scripts\smoke-classic-cronogramas-api-boundary.mjs`: OK.
- `cmd /c node frontend\scripts\smoke-classic-no-bim-contamination.mjs`: OK.
- `npm run build`: OK, con warning conocido de chunks grandes Vite.
- `.\.venv\Scripts\python.exe tools\ai_tools\validate_enterprise_baseline.py --include-frontend`:
  OK, con warnings conocidos Pydantic BIM `model_name/model_id`.

No interferencia:

- Sin cambios en explosion de APUs anidados, consolidacion de recursos,
  snapshots operativos, ruta critica, backend, DB, API, auth/JWT, tenant, EDT,
  Presupuestos base, BIM, Docker/Coolify, CI/CD, staging, produccion ni
  reapertura de `TASK-1807`.

## 2026-06-24 - TASK-1979 Restaurar doble click para editar APU desde lineas de presupuesto

Modo: GIPROY CLASICO.

Estado: implementado y validado focalmente.

Resultado:

- `frontend/src/components/presupuestos/LineasPresupuestoTab.jsx` recupera
  `onDoubleClick` sobre lineas de presupuesto con `apu_id`.
- El doble click vuelve a llamar `onEditApu(linea)` y abre
  `ApuEditorModal` desde `PresupuestoDetail`.
- La guarda evita activar el editor desde inputs, botones o handle de arrastre.
- Se cubren tanto las lineas renderizadas dentro del arbol EDT como las filas
  virtualizadas/compactas.
- `frontend/scripts/smoke-classic-presupuesto-api-boundary.mjs` queda reforzado
  para exigir el doble click en lineas APU.

Validacion:

- `cmd /c node frontend\scripts\smoke-classic-presupuesto-api-boundary.mjs`: OK.
- `cmd /c node frontend\scripts\smoke-classic-cronogramas-api-boundary.mjs`: OK.
- `cmd /c node frontend\scripts\smoke-classic-no-bim-contamination.mjs`: OK.
- `npm run build` desde `frontend`: OK, con warning conocido de chunks grandes.

No interferencia:

- Sin backend, DB, API, auth/JWT, tenant, EDT, Presupuestos base, BIM,
  Docker/Coolify, CI/CD, staging, produccion ni reapertura de `TASK-1807`.
- No se modifica la explosion de materiales en Gantt ni
  `apu_operational_resources_v1`.

## 2026-06-24 - TASK-1978 Correccion categoria APUs hijos en editor APU desde Presupuestos

Modo: GIPROY CLASICO.

Estado: implementado y validado.

Resultado:

- `frontend/src/components/presupuestos/ApuBudgetEditor.jsx` separa la categoria
  de catalogo lateral de la categoria funcional de linea.
- Los APUs siguen visibles como familia agregable en el catalogo lateral del
  editor embebido, pero al entrar en el analisis del APU se clasifican como
  `Materiales` (`categoria_id = 2`).
- Al cargar APUs existentes desde Presupuestos, las lineas con `apu_hijo_id`
  caen en Materiales.
- Al agregar un APU hijo desde Presupuestos, la linea nueva cae en Materiales.
- Se elimina la seccion visual `APUs Relacionados (Hijos)` para no crear una
  categoria principal incorrecta.
- El guardado conserva `apu_hijo_id`; no cambia contrato API ni transforma el
  APU hijo en recurso.
- `frontend/scripts/smoke-classic-presupuesto-api-boundary.mjs` queda reforzado
  para detectar la regresion.
- No se modifica la explosion de materiales en Gantt ni los snapshots
  operativos `apu_operational_resources_v1`.

Validacion:

- `cmd /c node frontend\scripts\smoke-classic-presupuesto-api-boundary.mjs`: OK.
- `cmd /c node frontend\scripts\smoke-classic-cronogramas-api-boundary.mjs`: OK.
- `cmd /c node frontend\scripts\smoke-classic-no-bim-contamination.mjs`: OK.
- `npm run build` desde `frontend`: OK, con warning conocido de chunks grandes.
- `.\.venv\Scripts\python.exe tools\ai_tools\validate_enterprise_baseline.py --include-frontend`:
  OK, con warnings conocidos.

No interferencia:

- Sin backend, DB, API, auth/JWT, tenant, EDT, Presupuestos base, BIM,
  Docker/Coolify, CI/CD, staging, produccion ni reapertura de `TASK-1807`.

## 2026-06-24 - TASK-1977 Ajuste visual de metricas y origen de recursos en Gantt

Modo: GIPROY CLASICO.

Estado: implementado y validado.

Resultado:

- `frontend/src/components/projects/CronogramaGantt.jsx` mueve
  `Precio en presupuesto` a la fila principal de tarjetas del editor ligero de
  recursos.
- La fila principal queda con cinco tarjetas en escritorio:
  `Cantidad`, `Cantidad presupuesto`, `Trabajo gobernante`, `Jornada` y
  `Precio en presupuesto`.
- Se retira la tarjeta inferior duplicada para que el resumen conserve jerarquia
  visual y no disperse la lectura.
- Se agrega una resolucion local de estilos por origen operativo de recurso:
  directo, anidado, consolidado, no fusionado y modificacion activa.
- Descripcion, unidad de medida y etiqueta del recurso heredan el color del
  origen operativo. El recurso gobernante conserva su realce propio.

Validacion:

- `npm run build` desde `frontend`: OK, con warning conocido de chunks grandes.
- `cmd /c node frontend\scripts\smoke-classic-no-bim-contamination.mjs`: OK.
- `cmd /c node frontend\scripts\smoke-classic-cronogramas-api-boundary.mjs`: OK.

No interferencia:

- Sin cambios backend, DB, API, auth/JWT, tenant, EDT, Presupuestos base, BIM,
  Docker/Coolify, CI/CD, staging, produccion ni reapertura de `TASK-1807`.

## 2026-06-24 - TASK-1976 Saneamiento global Gantt por snapshots operativos de APUs anidados

Modo: GIPROY CLASICO.

Estado: implementado, aplicado sobre la base local y validado.

Resultado:

- `backend/app/services/cronograma_trabajo.py` preserva
  `apu_operational_resources_v1` al aplicar filas computadas a `schedule_data`.
- La respuesta de Cronograma Trabajo devuelve lineas con snapshot operativo
  saneado aun cuando el cronograma historico no lo tuviera persistido.
- Se agrega `backend/scripts/sanitize_gantt_operational_apu_snapshots.py`.
- Se ejecuto saneamiento global sobre todos los cronogramas existentes:
  - cronogramas revisados: 4;
  - lineas con snapshot operativo despues: 422;
  - lineas con APUs anidados explotados despues: 46;
  - snapshots faltantes despues: 0.
- Santiago Bermeo queda saneado como parte del global:
  - empresa `3`;
  - presupuesto `13`;
  - cronograma `1`;
  - 187 lineas con snapshot;
  - 18 lineas con APUs anidados explotados.
- La correccion de ruta critica es universal en el motor comun de Cronograma
  Trabajo: CPM usa la duracion visible `start_date/end_date` cuando existe y
  solo cae a la duracion tecnica del APU explotado si no hay ventana visible.
  Santiago Bermeo fue el caso que evidencio la regresion, no un alcance
  especifico.
- `frontend/src/components/projects/CronogramaGantt.jsx` evita que el editor
  ligero de recursos reinyecte indefinidamente el mismo
  `apu_operational_resources_v1`, corrigiendo el React #185 y permitiendo que
  la ruta critica visual se estabilice en rojo cuando el CPM la marca.
- `frontend/src/components/projects/CronogramaGantt.jsx` expone atributos QA
  estables `data-gantt-task-bar`, `data-gantt-subbar`,
  `data-critical-path` y `data-gantt-bar-tone` para certificar visualmente la
  ruta critica sin depender de clases Tailwind.
- Se agrega `frontend/scripts/validate-gantt-santiago-critical-visual-dom.mjs`
  como certificacion DOM real: toma Santiago Bermeo desde backend, renderiza el
  Gantt con Playwright, recorre el viewport virtual y valida que las barras
  criticas sean rojas.

Backups:

- `tmp/gantt_operational_apu_snapshot_backup_task_1976_20260624_144658.json`.
- `tmp/gantt_operational_apu_snapshot_backup_task_1976_20260624_145110.json`.

Validacion:

- `py_compile` focal: OK.
- `pytest` focal Cronogramas: 24 passed.
- Auditoria directa DB: 422 lineas, 0 snapshots faltantes, 46 anidados
  explotados.
- Dry-run final del script: 4 cronogramas revisados, 0 actualizaciones
  pendientes.
- Validacion Santiago Bermeo post-ajuste CPM: ruta critica recalculada con 30
  lineas, sin tarea aislada eclipsando la cadena.
- Certificacion visual Santiago Bermeo:
  `backend_critical_count=30`, `rendered_critical_count=30`,
  `missing_critical_count=0`, `non_red_critical_count=0`,
  `unexpected_critical_count=0`, `normal_red_count=0`.
- Validador rutas Santiago Bermeo: 29 dependencias, 29 rutas, 0 incidencias.
- `npm run build` frontend: OK, con warning conocido de chunks grandes.
- Smokes frontend Cronogramas y anti-BIM: OK.
- Baseline enterprise con frontend: OK, con warnings conocidos.

No interferencia:

- Sin cambios destructivos PostgreSQL, migraciones, auth/JWT, tenant, EDT,
  Presupuestos base, APUs contractuales, BIM, Docker/Coolify, CI/CD, staging,
  produccion ni reapertura de `TASK-1807`.

## 2026-06-23 - TASK-1975 Ajuste operativo de recursos por APUs anidados en Cronogramas

Modo: GIPROY CLASICO.

Estado: implementado con validacion focal.

Resultado:

- `backend/app/services/cronograma_trabajo.py` genera
  `apu_operational_resources_v1` por fila calculada.
- `CronogramaTrabajoConfig` incorpora `apu_resource_modifications_v1` como base
  funcional de modificaciones activas por revision.
- El resolvedor de Cronograma Trabajo prioriza:
  modificacion activa confirmada -> metadata de linea -> base de proyecto.
- El snapshot explota APUs anidados, consolida recursos por clave fuerte y
  calcula rendimiento equivalente desde trabajo relativo.
- `backend/app/services/cronograma_recursos.py` consume el snapshot operativo
  antes de usar el fallback recursivo historico.
- `frontend/src/components/projects/CronogramaGantt.jsx` muestra recursos
  funcionales en el editor ligero, permite editar cantidad de recurso, bloquea
  rendimiento en APUs con anidados explotados y muestra indicador discreto.
- `frontend/src/utils/operationalNumbers.js` permite cantidad simulada en
  `resolveApuLineSimulatedSubtotal` para que el subtotal visual siga el cambio
  de cantidad de recurso.
- La aceptacion del editor exige confirmacion explicita de alcance global para
  el APU en la revision activa y guarda la modificacion en config antes de
  sincronizar las lineas afectadas.
- `frontend/src/components/projects/Cronogramas.jsx` conserva
  `apu_resource_modifications_v1` al editar configuracion del cronograma.
- Se refuerza `frontend/scripts/smoke-classic-cronogramas-api-boundary.mjs`.

Validacion:

- `.\.venv\Scripts\python.exe -m py_compile backend\app\services\cronograma_trabajo.py backend\app\services\cronograma_recursos.py backend\app\schemas\cronograma_trabajo.py`: OK.
- `..\.venv\Scripts\python.exe -m pytest app\tests\test_cronograma_recursos_service.py app\tests\test_cronograma_trabajo_duration_model.py`
  desde `backend`: 22 passed.
- `npm run build` desde `frontend`: OK, con warning conocido de chunks grandes
  Vite.
- `cmd /c node frontend\scripts\smoke-classic-cronogramas-api-boundary.mjs`:
  OK.
- `node frontend\scripts\smoke-classic-no-bim-contamination.mjs`: OK.
- `.\.venv\Scripts\python.exe tools\ai_tools\validate_enterprise_baseline.py --include-frontend`:
  OK, con warnings conocidos de Pydantic BIM `model_name/model_id` y chunks
  grandes Vite.
- Guardas frontend:
  - sin imports directos de `axiosConfig` fuera de `frontend/src/api`;
  - sin `console.log` productivos en `frontend/src` fuera de api.

No interferencia:

- Sin migraciones DB, cambios destructivos PostgreSQL, auth/JWT, tenant, EDT,
  Presupuestos base, BIM, Docker/Coolify, CI/CD, staging, produccion ni
  reapertura de `TASK-1807`.

## 2026-06-23 - TASK-1974 Diagnostico documental de APUs anidados en tiempo y recursos

Modo: GIPROY CLASICO.

Estado: documentado.

Resultado:

- Se analiza `docs/anidados-tiempo/conversacion-1`.
- Se analiza `docs/anidados-tiempo/conversacion-2`.
- Se revisa el Excel
  `docs/anidados-tiempo/Analisis para Project - Nueva Version 2026.xlsx`.
- Se crea
  `docs/anidados-tiempo/PROBLEMA_APUS_ANIDADOS_TIEMPO_RECURSOS.md`.
- El diagnostico formula que APUs anidados comprometen duracion, recursos por
  periodo, histogramas, flujo de caja y cronogramas cuando se usan como fuente
  automatica de planificacion.
- Se deja evidencia de que el APU anidado y el APU explotado no son
  matematicamente equivalentes.
- Se documenta el plan funcional inferido:
  - base de modificaciones por base de trabajo, proyecto, revision y APU origen;
  - snapshot operativo ejecutable + delta auditable;
  - solo una modificacion activa confirmada;
  - explosion de anidados a recursos funcionales consolidados;
  - rendimiento equivalente por trabajo relativo;
  - indicador visual discreto en Gantt/Cronogramas para APUs base, anidados no
    explotados, anidados explotados y modificaciones activas;
  - microindicador por recurso funcional directo, anidado, consolidado o no
    fusionado;
  - resolvedor unico para propagacion funcional.

Validacion:

- Lectura local de fuentes completada.
- Cambio limitado a documentacion Markdown.
- No se ejecutan builds ni tests porque no hubo cambios productivos.

No interferencia:

- Sin backend, frontend, DB, API, auth/JWT, tenant, EDT, Presupuestos,
  Cronogramas, BIM, Docker/Coolify, CI/CD, staging, produccion ni reapertura de
  `TASK-1807`.

## 2026-06-22 - TASK-1973 Prioridad Mano de Obra en empate de gobernanza Gantt

Modo: GIPROY CLASICO.

Estado: implementado y validado.

Resultado:

- `Gantt > editor ligero de APU > Recursos operativos` ajusta el desempate de
  gobernanza automatica.
- Cuando Mano de Obra y Equipos y Herramientas empatan en rendimiento, la
  seleccion automatica prioriza Mano de Obra.
- La jerarquia interna existente se conserva despues de la prioridad de
  categoria.
- El selector automatico informa `Desempate por categoria` cuando aplica.

Validacion:

- `npm run build` desde `frontend`: OK, con warning conocido de chunks grandes
  Vite.
- `cmd /c node frontend\scripts\smoke-classic-no-bim-contamination.mjs`: OK.
- `cmd /c node frontend\scripts\smoke-classic-cronogramas-api-boundary.mjs`:
  OK.

No interferencia:

- Sin backend, DB, auth/JWT, tenant, contratos API, EDT, Presupuestos,
  Cronograma Valorado, BIM, Docker/Coolify, CI/CD, staging, produccion ni
  reapertura de `TASK-1807`.

## 2026-06-22 - TASK-1972 Separacion visual del modal de recursos Gantt

Modo: GIPROY CLASICO.

Estado: implementado y validado.

Resultado:

- `Gantt > editor ligero de APU > Rendimientos operativos` corrige el
  solapamiento visual con el header global en equipos con DPI/escalado distinto.
- El overlay del modal queda por encima del header sticky de `AppLayout`.
- El panel se alinea desde arriba con respiracion superior estable en desktop.
- La altura maxima del modal se calcula contra el viewport para mantener scroll
  controlado.

Validacion:

- `npm run build` desde `frontend`: OK, con warning conocido de chunks grandes
  Vite.
- `cmd /c node frontend\scripts\smoke-classic-no-bim-contamination.mjs`: OK.
- `cmd /c node frontend\scripts\smoke-classic-cronogramas-api-boundary.mjs`:
  OK.

No interferencia:

- Sin cambios funcionales, backend, DB, auth/JWT, tenant, contratos API, EDT,
  Presupuestos, Cronograma Valorado, BIM, Docker/Coolify, CI/CD, staging,
  produccion ni reapertura de `TASK-1807`.

## 2026-06-22 - TASK-1971 Gobernanza operativa Mano de Obra en Gantt clasico

Modo: GIPROY CLASICO.

Estado: implementado y validado.

Resultado:

- `Gantt > editor ligero de APU > Recursos operativos` vuelve a considerar
  Mano de Obra como candidato valido de gobernanza junto con Equipos y
  Herramientas.
- La seleccion visible prioriza el calculo operativo del modal antes de usar
  metadata previa del backend.
- El selector manual de gobernanza muestra candidatos validos de Equipos y Mano
  de Obra cuando comparten rendimiento gobernante.
- La columna `Tiempo` del modal pasa a `Trabajo`.
- El rendimiento fijo `1` de Materiales y Transporte se oculta visualmente.

Validacion:

- `npm run build` desde `frontend`: OK, con warning conocido de chunks grandes
  Vite.
- `cmd /c node frontend\scripts\smoke-classic-no-bim-contamination.mjs`: OK.
- `cmd /c node frontend\scripts\smoke-classic-cronogramas-api-boundary.mjs`:
  OK.

No interferencia:

- Sin backend, DB, auth/JWT, tenant, contratos API, EDT, Presupuestos,
  Cronograma Valorado, BIM, Docker/Coolify, CI/CD, staging, produccion ni
  reapertura de `TASK-1807`.

## 2026-06-22 - TASK-1970 Baja purgada y recuperacion SaaS por backup cliente

Modo: GIPROY CLASICO.

Estado: implementado y validacion focal en verde.

Resultado:

- `Administracion Global > Empresas` permite preparar baja purgada, descargar
  backup, cargar la copia validada y ejecutar baja con frase final.
- Empresas en `lifecycle_status=baja_purgada` muestran accion `Recuperar` y
  exigen backup validado antes de restaurar.
- `Empresa` conserva solo ficha minima de recuperacion y auditoria de baja:
  estado, hash/manifiesto de backup, conteos purgados, solicitante y flag de
  recuperacion requerida.
- `DELETE /empresas/{id}` deja de hacer hard delete y devuelve instruccion de
  usar baja purgada.
- Restore queda bloqueado cuando la licencia resuelve `readonly`; backup sigue
  permitido.
- Identidad de backup expone `fiscal_identity` como fundamento funcional y
  conserva fingerprint tecnico.

Validacion:

- `..\.venv\Scripts\python.exe -m pytest app\tests\test_company_backup_preflight.py`
  desde `backend`: 18 passed.
- `cmd /c node frontend\scripts\smoke-classic-saas-empresas-boundary.mjs`: OK.
- `.\.venv\Scripts\python.exe -m py_compile` sobre backend tocado: OK.

No interferencia:

- Sin BIM, Docker/Coolify, CI/CD, staging, produccion, rutas operativas de
  proyectos/EDT/presupuestos/cronogramas ni reapertura de `TASK-1807`.

## 2026-06-22 - TASK-1969 Ocultar derechos SaaS no operativos en Settings Empresa

Modo: GIPROY CLASICO.

Estado: validado.

Resultado:

- `Settings Empresa > Mi Empresa > Licencia y SaaS` deja de mostrar `Equipo`,
  `Fusion` y `Migracion` como derechos efectivos visibles.
- `Equipo` queda gobernado por el sistema de licencias, sin chip redundante en
  Settings.
- `Fusion` y `Migracion` se ocultan por obsoletas/no funcionales.
- El backend, catalogo SaaS y resolvedor de capacidades quedan intactos.
- Se refuerza `smoke-classic-settings-empresa-visual-structure.mjs` para
  bloquear la reaparicion de esas etiquetas.
- Se documenta la TASK en `docs/tasks/TASK-1969.md`.

Validacion:

- `cmd /c node frontend\scripts\smoke-classic-settings-empresa-visual-structure.mjs`: OK.
- `cmd /c node frontend\scripts\smoke-classic-no-bim-contamination.mjs`: OK.
- `npm run build`: OK, con warning conocido de chunks grandes Vite.
- `.\.venv\Scripts\python.exe tools\ai_tools\validate_enterprise_baseline.py --include-frontend`: OK, con warnings conocidos Pydantic BIM `model_name/model_id` y chunks grandes Vite.

No interferencia:

- Sin backend, DB, auth/JWT, tenant, EDT, presupuestos, cronogramas, BIM,
  Docker/Coolify, CI/CD, staging, produccion ni reapertura de `TASK-1807`.

## 2026-06-22 - TASK-1968 Retiro de gestion operativa Conecta desde Settings Empresa

Modo: GIPROY CLASICO.

Estado: validado.

Resultado:

- `Settings Empresa > Mi Empresa` deja de exponer `Cupos usuario-usuario`.
- `Settings.jsx` deja de importar `conectaApi` y deja de cargar/asignar/liberar
  cupos Conecta.
- La zona visible queda como `Licencia y SaaS`, conservando licencia, acciones
  Marketplace y derechos SaaS.
- `Envios y Transferencias` queda sin cambios funcionales y mantiene la gestion
  de Conecta como flujo empresa-a-empresa.
- Se refuerzan smokes de Settings y Conecta API para bloquear el retorno de
  gestion Conecta usuario-usuario en Settings.
- Se documenta la TASK en `docs/tasks/TASK-1968.md`.

Validacion:

- `cmd /c node frontend\scripts\smoke-classic-settings-empresa-visual-structure.mjs`: OK.
- `cmd /c node frontend\scripts\smoke-classic-conecta-api-boundary.mjs`: OK.
- `cmd /c node frontend\scripts\smoke-classic-transferencias-ui.mjs`: OK.
- `cmd /c node frontend\scripts\smoke-classic-no-bim-contamination.mjs`: OK.
- `npm run build`: OK, con warning conocido de chunks grandes Vite.
- `.\.venv\Scripts\python.exe tools\ai_tools\validate_enterprise_baseline.py --include-frontend`: OK, con warnings conocidos Pydantic BIM `model_name/model_id` y chunks grandes Vite.

No interferencia:

- Sin backend, DB, auth/JWT, tenant, EDT, presupuestos, cronogramas, BIM,
  Docker/Coolify, CI/CD, staging, produccion ni reapertura de `TASK-1807`.

## 2026-06-22 - TASK-1967 Compactacion visual de Licencia y Conecta

Modo: GIPROY CLASICO.

Estado: validado.

Resultado:

- `Settings Empresa > Mi Empresa > Licencia y Conecta` queda compactado
  visualmente.
- El bloque conserva funcionalidad y handlers existentes de licencia,
  Marketplace, productos SaaS y cupos Conecta.
- Se reutiliza `ProjectSectionIconButton` para acciones compactas en linea con
  Proyectos.
- Se reducen cards grandes, copy descriptivo largo, espaciado vertical y
  contadores sobredimensionados.
- Se agregan marcadores compactos para smoke:
  `data-settings-license-conecta-compact`, `data-settings-license-summary`,
  `data-settings-license-actions`, `data-settings-saas-rights` y
  `data-settings-conecta-panel`.
- Se documenta la TASK en `docs/tasks/TASK-1967.md`.

Validacion:

- `cmd /c node frontend\scripts\smoke-classic-settings-empresa-visual-structure.mjs`: OK.
- `cmd /c node frontend\scripts\smoke-classic-no-bim-contamination.mjs`: OK.
- `npm run build`: OK, con warning conocido de chunks grandes Vite.
- `.\.venv\Scripts\python.exe tools\ai_tools\validate_enterprise_baseline.py --include-frontend`: OK, con warnings conocidos Pydantic BIM `model_name/model_id` y chunks grandes Vite.

No interferencia:

- Sin backend, DB, auth/JWT, tenant, EDT, presupuestos, cronogramas, BIM,
  Docker/Coolify, CI/CD, staging, produccion ni reapertura de `TASK-1807`.

## 2026-06-22 - TASK-1966 Migracion de Ajuste SaaS fuera de Settings Empresa

Modo: GIPROY CLASICO.

Estado: validado.

Resultado:

- `Settings Empresa` deja de exponer la opcion lateral `Ajuste SaaS`.
- `Administracion Global > Superadministradores` vive en
  `/admin-global/superadministradores`.
- `Administracion Global > Integraciones` vive en
  `/admin-global/integraciones`.
- La key `EcuadorAPI` se administra desde Integraciones mediante
  `adminConfigApi`.
- Las cuentas superadministradoras se administran desde Superadministradores
  mediante `usuariosApi`.
- La lectura/edicion global de superadministradores usa operaciones tenantless
  controladas `usuariosApi.getAllGlobal` y `usuariosApi.updateGlobal`.
- Se conserva redireccion legacy desde `/settings?tab=superadmins`.
- La edicion del perfil propio superadministrador pasa por
  `/admin-global/superadministradores?edit_user=me`.
- Se agrega `frontend/scripts/smoke-classic-saas-settings-migration.mjs`.
- El baseline enterprise ejecuta la nueva smoke.
- Se documenta la TASK en `docs/tasks/TASK-1966.md`.

Validacion:

- `cmd /c node frontend\scripts\smoke-classic-saas-settings-migration.mjs`: OK.
- `cmd /c node frontend\scripts\smoke-classic-admin-config-email-boundary.mjs`: OK.
- `cmd /c node frontend\scripts\smoke-classic-saas-empresas-boundary.mjs`: OK.
- `cmd /c node frontend\scripts\smoke-classic-settings-empresa-visual-structure.mjs`: OK.
- `cmd /c node frontend\scripts\smoke-classic-no-bim-contamination.mjs`: OK.
- `npm run build`: OK, con warning conocido de chunks grandes Vite.
- `.\.venv\Scripts\python.exe tools\ai_tools\validate_enterprise_baseline.py --include-frontend`: OK, con warnings conocidos Pydantic BIM `model_name/model_id` y chunks grandes Vite.

No interferencia:

- Sin backend, DB, auth/JWT, tenant, EDT, presupuestos, cronogramas, BIM,
  Docker/Coolify, CI/CD, staging, produccion ni reapertura de `TASK-1807`.

## 2026-06-22 - TASK-1965 Depuracion de console.error productivo frontend clasico

Modo: GIPROY CLASICO.

Estado: validado.

Resultado:

- Se retira `console.error(` productivo de `frontend/src`.
- Se agrega `frontend/src/utils/clientErrorReporter.js` como reporter cliente
  interno.
- `frontend/src/main.jsx` instala el reporter en `globalThis.reportClientError`.
- Las llamadas runtime pasan a `globalThis.reportClientError?.(...)`.
- El reporter no escribe en consola; conserva un buffer corto
  `globalThis.__giproyClientErrors` y emite el evento interno
  `giproy:client-error`.
- Se refuerza `frontend/scripts/smoke-classic-api-boundaries.mjs` para recorrer
  `frontend/src` y bloquear reintroducciones de `console.error(`.
- Se documenta la TASK en `docs/tasks/TASK-1965.md`.

Validacion:

- `rg -n "console\.error" frontend\src`: OK, sin coincidencias.
- `cmd /c node frontend\scripts\smoke-classic-api-boundaries.mjs`: OK.
- `cmd /c node frontend\scripts\smoke-classic-no-bim-contamination.mjs`: OK.
- `npm run build`: OK, con warning conocido de chunks grandes Vite.
- `.\.venv\Scripts\python.exe tools\ai_tools\validate_enterprise_baseline.py --include-frontend`: OK, con warnings conocidos Pydantic BIM `model_name/model_id` y chunks grandes Vite.

No interferencia:

- Sin backend, DB, auth/JWT, tenant, EDT, presupuestos, cronogramas, BIM,
  Docker/Coolify, CI/CD, staging, produccion ni reapertura de `TASK-1807`.

## 2026-06-22 - TASK-1964 Autoridad temporal Gantt/Datos Proyecto

Modo: GIPROY CLASICO.

Estado: validado.

Resultado:

- Se implementa autoridad temporal alterna entre `Datos Proyecto.fecha_inicio`
  y Gantt clasico:
  - cambio en Datos Proyecto desplaza automaticamente el Gantt;
  - cambio posterior dentro de Gantt deja Gantt como guia operativa;
  - nuevo cambio en Datos Proyecto vuelve a dirigir y desplaza el Gantt.
- `CronogramaTrabajoConfig` agrega campos aditivos:
  - `fecha_inicio_referencia_proyecto`;
  - `fecha_inicio_autoridad`.
- El backend reutiliza el desplazamiento existente por delta para lineas,
  ventanas manuales y subbarras.
- Se alinean etiquetas focales hacia `periodo`/`Pn` en Cronograma Valorado y
  Gantt.
- Se agrega `docs/architecture/GANTT_DURATION_AND_CRITICAL_PATH.md` para fijar
  duracion, anidados y ruta critica.
- Se documenta la TASK en `docs/tasks/TASK-1964.md`.

Validacion:

- `.\.venv\Scripts\python.exe -m py_compile backend\app\services\cronograma_trabajo.py backend\app\schemas\cronograma_trabajo.py backend\app\services\test_cronograma_trabajo_fixed.py`: OK.
- `cd backend && ..\.venv\Scripts\python.exe -m pytest app\services\test_cronograma_trabajo_fixed.py -q`: OK, 15 passed.
- `cmd /c node frontend\scripts\smoke-classic-cronogramas-api-boundary.mjs`: OK.
- `node frontend\scripts\smoke-classic-no-bim-contamination.mjs`: OK.
- `npm run build`: OK, con warning conocido de chunks grandes Vite.
- `.\.venv\Scripts\python.exe tools\ai_tools\validate_enterprise_baseline.py --include-frontend`: OK, con warnings conocidos Pydantic BIM `model_name/model_id` y chunks grandes Vite.

No interferencia:

- Sin BIM, Docker/Coolify, CI/CD, staging, produccion, DB destructiva,
  auth/JWT, tenant global ni reapertura de `TASK-1807`.

## 2026-06-21 - TASK-1963 Reporte Uso de Recursos por Rango clasico

Modo: GIPROY CLASICO.

Estado: validado.

Resultado:

- `Proyecto > Cronogramas > Recursos` ahora tiene un menu de reportes:
  - `Uso de Recursos completo`;
  - `Uso de Recursos por rango`.
- La variante nueva es `resources_range` sobre `cronograma_valorado`.
- El modal de rango solicita fecha inicio/final y precarga el periodo completo
  del cronograma/proyecto.
- El backend acepta `filters` para preview/export y los incluye en la cache de
  exportacion.
- El calculo del rango prorratea cantidades/costos por solape temporal de los
  periodos seleccionados.
- El reporte por rango genera preview, Excel, PDF ejecutivo y PDF desde Excel.
- `Settings > Plantillas` fue ampliado para mostrar las salidas clasicas
  actuales de Cronogramas y variantes faltantes de VAE/Formula Polinomica.
- Se agrega `docs/reportes/cronograma_uso_recursos_rango.config.json`.

Validacion:

- `.\.venv\Scripts\python.exe -m py_compile backend\app\schemas\reporting.py backend\app\api\endpoints\reporting.py backend\app\services\reporting.py backend\app\tests\test_reporting_cronograma_integrated_reports.py`: OK.
- `..\.venv\Scripts\python.exe -m pytest app\tests\test_reporting_cronograma_integrated_reports.py -q`: OK, 18 passed, 1 warning Pydantic conocido.
- `cmd /c node frontend\scripts\smoke-classic-cronogramas-api-boundary.mjs`: OK.
- `cmd /c node frontend\scripts\smoke-classic-settings-empresa-visual-structure.mjs`: OK.
- `cmd /c node frontend\scripts\smoke-classic-no-bim-contamination.mjs`: OK.
- JSON config `docs/reportes/cronograma_uso_recursos_rango.config.json`: OK.
- `npm run build`: OK, con warning conocido de chunks grandes Vite.
- `.\.venv\Scripts\python.exe tools\ai_tools\validate_enterprise_baseline.py --include-frontend`: OK, con warnings conocidos Pydantic BIM `model_name/model_id` y chunks grandes Vite.

No interferencia:

- Sin DB destructiva, auth/JWT, tenant, permisos, EDT, presupuestos, BIM,
  Docker/Coolify, CI/CD, staging, produccion ni reapertura de `TASK-1807`.

## 2026-06-21 - TASK-1962 Reporte visible en Cronogramas Recursos clasico

Modo: GIPROY CLASICO.

Estado: validado.

Resultado:

- `Proyecto > Cronogramas > Recursos` ahora muestra un boton directo
  `Reporte de Uso de Recursos`.
- El boton reutiliza el flujo existente
  `handleOpenCronogramaValoradoReport('resources')`.
- No se crea backend, endpoint, contrato API ni variante nueva.
- La variante `resources` ya existia y sigue soportada por preview, Excel y PDF.
- El reporte consolida recursos finales del cronograma valorado por
  categoria/subcategoria, cantidades, costos, periodos, periodo pico y recursos
  gobernantes.
- `frontend/scripts/smoke-classic-cronogramas-api-boundary.mjs` protege que el
  boton visible permanezca en la pestaña Recursos.

Validacion:

- `cmd /c node frontend\scripts\smoke-classic-cronogramas-api-boundary.mjs`: OK.
- `cmd /c node frontend\scripts\smoke-classic-no-bim-contamination.mjs`: OK.
- `npm run build`: OK, con warning conocido de chunks grandes Vite.

No interferencia:

- Sin backend, DB, auth/JWT, tenant, EDT, presupuestos, BIM, Docker/Coolify,
  CI/CD, staging, produccion ni reapertura de `TASK-1807`.

## 2026-06-20 - TASK-1961 Rediseño visual global de Settings empresa clasico

Modo: GIPROY CLASICO.

Estado: validado.

Resultado:

- Se cierra el grill-me funcional del alcance Settings empresa.
- Se documenta `docs/tasks/TASK-1961.md` como TASK paraguas del rediseño visual global de Settings empresa.
- Se confirma que el alcance no es el menu de control SaaS global.
- Se confirma que usuarios permanece dentro de Settings empresa y queda limitado a usuarios de la empresa activa.
- Se inicia el rediseño visual de `Mi Empresa` separando:
  - `Datos empresa`.
  - `Licencia y Conecta`.
- Se inicia el rediseño visual de `Usuarios Empresa`:
  - resumen compacto de usuarios de la empresa activa.
  - tabs por rol/estado.
  - bloqueo si superadministrador no tiene empresa activa seleccionada.
- Se compactan las secciones restantes:
  - `Preferencias Empresa`.
  - `Codigos Proyecto`.
  - `Plantillas`.
- Backup Empresa / Restore Empresa queda marcado como zona visual de empresa completa y conserva tabs internas.
- El header visible pasa de `Ajustes Globales` a `Settings Empresa`.
- Se agrega smoke focal `frontend/scripts/smoke-classic-settings-empresa-visual-structure.mjs`.
- Se agrega harness/validador renderizado:
  - `frontend/settings-empresa-harness.html`.
  - `frontend/src/settings-empresa-harness.jsx`.
  - `frontend/scripts/validate-settings-empresa-visual-dom.mjs`.
- El harness compila con `npm run build`.
- `node frontend/scripts/validate-settings-empresa-visual-dom.mjs` certifica el render DOM/geometry de Settings empresa en viewports `desktop` y `wide`.

Seguimiento opcional:

- Revision manual final en navegador vivo si se quiere contrastar con datos reales no fixture.

## 2026-06-20 - TASK-1960 Settings Backup Empresa / Restore Empresa y auditoria cross-company

Se ajusto el flujo clasico de backup-restauracion de empresa para eliminar la
ambiguedad visual y registrar desde el primer momento los intentos de usar
copias de otra empresa.

Cambio:
- `Settings` ya no muestra backup/restore dentro del bloque largo de `Mi
  Empresa`; queda como opcion propia del menu izquierdo: `Backup Empresa`.
- Dentro del panel hay zonas internas `Backup Empresa` y `Restore Empresa`.
- `Restore Empresa` solo pide una confirmacion final:
  `CONFIRMO IMPORTACION`.
- La copia automatica interna previa se crea automaticamente en backend al
  confirmar un restore externo; no hay accion manual visible para
  administradores.
- Las copias automaticas internas permanecen visibles y recuperables solo para
  superadministrador.
- El preflight bloquea restaurar copias de otra empresa y registra auditoria
  critica `company_backup_cross_company_restore_attempt`.
- Nuevo endpoint superadmin:
  `GET /api/v1/company-backups/restore/cross-company-attempts`.
- El contrato backend declara confirmacion final unica:
  `final_confirmation_required=true`,
  `triple_confirmation_required=false`,
  `user_email_confirmation_required=false`.

Estado:
- Backup Empresa 1:1: implementado.
- Restore Empresa 1:1 con copia interna automatica: implementado.
- Recuperacion de copias automaticas internas superadmin: implementada.
- Auditoria/listado superadmin de intentos cross-company: implementado.
- UX BIM/Docker/Coolify/CI/CD/staging/produccion: sin cambios.

Validacion:
- `py_compile` focal backend: OK.
- `pytest app\tests\test_company_backup_preflight.py -q`: OK, 16 passed.
- `smoke-classic-company-backup-settings.mjs`: OK.
- `smoke-classic-no-bim-contamination.mjs`: OK.
- `npm run build`: OK, con warning conocido de chunks grandes Vite.
- `tools/ai_tools/validate_enterprise_baseline.py --include-frontend`: OK.

## 2026-06-20 - TASK-1959 Fase 6/Fase 7 restauracion destructiva y recovery interno

Se implemento la ejecucion destructiva controlada de restauracion 1:1 desde
archivo externo `.giproybackup`, siempre con copia automatica interna previa y
triple confirmacion backend.

Cambio:
- `backend/app/services/company_backup.py` agrega
  `execute_destructive_restore`, reescritura de datos restaurables, restauracion
  de archivos declarados y politica Marketplace protegida.
- `POST /api/v1/company-backups/restore/execute` queda disponible solo para
  `superadministrador`.
- La operacion exige:
  - copia interna previa `available`, no expirada, existente y con hash
    coincidente;
  - `BORRAR DATOS ACTUALES`;
  - nombre exacto de empresa;
  - email autenticado;
  - `CONFIRMO RESTAURAR Y BORRAR DATOS`.
- La restauracion incluye empresa, proyectos, bases, papelera/borrado logico,
  Comunidad, archivos y tablas restaurables del snapshot.
- Se protegen auditoria, operaciones de backup y compras Marketplace.
- Los productos propios actuales que no existan en la copia se marcan
  `cancelled`/`activo=false` y quedan conservados para auditoria/superadmin.
- La copia interna usada queda `restored` con `cleanup_after` a 7 dias; copias
  internas anteriores se marcan `superseded`.
- `POST /api/v1/company-backups/restore/internal-artifact/execute` restaura
  directamente desde una copia automatica interna registrada, sin subir archivo.
- `Settings` agrega bloque rojo de triple confirmacion, boton final
  `Ejecutar restauracion destructiva` y accion `Restaurar interna`, visibles
  solo para superadministrador.
- `frontend/src/api/companyBackups.js` expone `executeRestore`.
- `frontend/src/api/companyBackups.js` expone `executeInternalArtifactRestore`.
- El listado de internas ejecuta housekeeping: vencidas a 30 dias y restauradas
  con `cleanup_after` cumplido desaparecen y eliminan archivo.

Estado:
- Export `.giproybackup`: implementado.
- Preflight de restauracion: implementado.
- Copia automatica previa interna: implementada.
- Restauracion destructiva desde archivo externo: implementada.
- Restauracion directa desde copia automatica interna sin subir archivo:
  implementada.
- Purga/ocultacion de artefactos internos expirados/restaurados al listar:
  implementada.

Validacion:
- `py_compile` focal backend: OK.
- `pytest app\tests\test_company_backup_preflight.py -q`: OK, 16 passed.
- `cmd /c node frontend\scripts\smoke-classic-company-backup-settings.mjs`: OK.
- `cmd /c node frontend\scripts\smoke-classic-no-bim-contamination.mjs`: OK.
- `npm run build`: OK, con warning conocido de chunks grandes Vite.

Siguiente paso recomendado:
- Si se habilita infraestructura de jobs, mover el housekeeping de copias
  internas a una tarea periodica; actualmente se ejecuta al listar internas.

## 2026-06-20 - TASK-1959 Fase 5A copia automatica previa interna

Se implemento la red de seguridad obligatoria previa a cualquier restauracion
1:1 destructiva de empresa.

Cambio:
- `backend/app/services/company_backup.py` agrega generacion de copia interna
  cifrada reutilizando el formato `.giproybackup`.
- La copia interna se almacena bajo `backend/backups/company_internal` y queda
  registrada en `company_backup_internal_artifacts`.
- `POST /api/v1/company-backups/restore/prepare-internal-safety-backup`
  valida la copia subida, exige `superadministrador`, genera backup del estado
  actual y devuelve el siguiente paso como triple confirmacion pendiente.
- `GET /api/v1/company-backups/internal-artifacts` lista copias internas solo
  para `superadministrador`.
- `Settings` agrega `Preparar copia interna` y listado de copias automaticas
  internas con fecha, usuario, expiracion, hash, tamano y conteos.

Estado:
- Export `.giproybackup`: implementado.
- Preflight de restauracion: implementado.
- Copia automatica previa interna: implementada.
- Restauracion destructiva 1:1: no implementada todavia.
- Restauracion desde copia automatica interna: no implementada todavia.

Validacion:
- `py_compile` focal backend: OK.
- `pytest app\tests\test_company_backup_preflight.py -q`: OK, 12 passed.
- `cmd /c node frontend\scripts\smoke-classic-company-backup-settings.mjs`: OK.
- `cmd /c node frontend\scripts\smoke-classic-no-bim-contamination.mjs`: OK.
- `npm run build`: OK, con warning conocido de chunks grandes Vite.

Siguiente paso recomendado:
- Fase 6: triple confirmacion backend y restauracion destructiva 1:1
  controlada, siempre verificando copia interna previa vigente.

## 2026-06-20 - TASK-1959 Plan de backup-restauracion completa 1:1 de empresa

Se documenta una TASK de control y se implementan las fases no destructivas de
export y preflight de restauracion para construir un time-backup controlado de
empresa en GiProy Clasico.

Artefactos:
- `docs/tasks/TASK-1959.md`.
- `docs/architecture/COMPANY_FULL_BACKUP_RESTORE_PLAN.md`.
- `backend/app/models/company_backup.py`.
- `backend/app/schemas/company_backup.py`.
- `backend/app/services/company_backup.py`.
- `backend/app/api/endpoints/company_backups.py`.
- `backend/alembic/versions/de1959a1b2c3_company_backup_foundation.py`.
- `backend/app/tests/test_company_backup_preflight.py`.
- `frontend/src/api/companyBackups.js`.
- `frontend/scripts/smoke-classic-company-backup-settings.mjs`.

Decisiones cerradas:
- Backup completo 1:1 de empresa, con datos, papelera, documentacion, binarios,
  Comunidad y politica especial Marketplace.
- Restauracion destructiva 1:1 solo si el backup pertenece a la misma empresa.
- Toda restauracion requiere triple confirmacion, correo del usuario autenticado
  y boton final separado para evitar activacion accidental.
- Antes de borrar/restaurar se genera una copia automatica previa interna
  obligatoria.
- Las copias automaticas internas viven 30 dias.
- Solo superadministradores pueden listar/restaurar copias automaticas internas.
- Si se restaura una copia automatica, queda pendiente de eliminacion a una
  semana y se purgan las copias anteriores a su fecha.
- Marketplace conserva compras/licencias; articulos propios fuera del backup se
  cancelan/despublican, quedan fuera del acceso operativo de la empresa y se
  conservan solo para auditoria superadmin.
- Referencias a archivos fisicos rotas bloquean generacion/restauracion.

Estado:
- Fase 1, Fase 2 y Fase 3A/Fase 4 preflight implementadas y validadas.
- Existe contrato/preflight de exportacion sin borrado.
- Existe export `.giproybackup` cifrado/descargable desde Ajustes.
- Existe preflight de restauracion por subida de `.giproybackup`, sin borrado.
- La migracion `de1959a1b2c3` esta aplicada como head local.
- Existe copia automatica previa interna no destructiva desde Fase 5A.
- No existe todavia restauracion destructiva.
- No se toca runtime, BIM, Docker/Coolify/CI/CD ni guardas TASK-1807.

Export actual:
- Endpoint `POST /api/v1/company-backups/export`.
- Media type `application/vnd.giproy.company-backup`.
- Archivo con cabecera propia `GIPROYBACKUP1`.
- Payload ZIP comprimido y cifrado con Fernet.
- Incluye `manifest.json`, `data/tables/*.json` y `files/*`.
- La clave se deriva de `COMPANY_BACKUP_SECRET` si existe o `SECRET_KEY` en
  entorno local.
- Comunidad queda incluida en el snapshot logico.
- La exportacion se bloquea ante archivos referenciados inexistentes o hash
  cambiado durante la generacion.

Preflight de restauracion actual:
- Endpoint `POST /api/v1/company-backups/preflight/restore`.
- Subida multipart de `.giproybackup`.
- Descifra y valida cabecera, ZIP interno, manifest, version, alcance, hash de
  datos, archivos declarados y hash de archivos.
- Verifica misma empresa por fingerprint.
- Calcula conteos actuales vs conteos de la copia.
- Bloquea copias de otra empresa.
- No crea copia interna, no restaura y no borra datos.

Validacion:
- `py_compile` focal backend: OK.
- `pytest app\tests\test_company_backup_preflight.py -q`: OK, 9 passed.
- `cmd /c node frontend\scripts\smoke-classic-company-backup-settings.mjs`: OK.
- `node frontend\scripts\smoke-classic-no-bim-contamination.mjs`: OK.
- `npm run build`: OK, con warning conocido de chunks grandes Vite.
- `tools/ai_tools/validate_enterprise_baseline.py --include-frontend`: OK, con
  warnings conocidos de Pydantic BIM.

Siguiente paso recomendado:
- Fase 6: triple confirmacion backend y restauracion destructiva 1:1
  controlada, con validacion previa de copia interna vigente.

## 2026-06-19 - TASK-1958 Orden por ultima revision en listado de Proyectos

Se ajusto el listado clasico de Proyectos para priorizar trabajos activos por
ultima actualizacion.

Cambio:
- `frontend/src/pages/Proyectos.jsx` agrega helpers locales para resolver fecha
  de actualizacion, formatear `Rev. X: dd/mm/yy hh:mm` y ordenar de mas
  reciente a mas antiguo.
- La vista moderna de portafolio agrega columna `Actualizacion`.
- La rama legacy conserva ancho total `1560px` y redistribuye columnas para
  mostrar tambien `Actualizacion`.
- El bloque de Proyecto prioriza nombre y descripcion visible.
- La accion destructiva por fila cambia de `Trash2` a `ArchiveX` con tono rojo.
- La accion global `Papelera` conserva `Trash2`.
- `frontend/scripts/smoke-classic-proyectos-logging-boundary.mjs` valida
  ordenacion local, columna de actualizacion y uso de `ArchiveX`.

Validacion:
- `cmd /c node frontend\scripts\smoke-classic-proyectos-logging-boundary.mjs`: OK.
- `cmd /c node frontend\scripts\smoke-classic-no-bim-contamination.mjs`: OK.
- `npm run build`: OK, con warning conocido de chunks grandes Vite.

Sin backend, DB, contratos API, auth/JWT, tenant, EDT, presupuestos,
cronogramas, BIM, Docker/Coolify/CI/CD ni guardas TASK-1807.

## 2026-06-19 - TASK-1957 Cards compactos y legibles en Bases de Trabajo

Se ajusto visualmente el card clasico de BasesTrabajo para que el nombre de la
base y la descripcion principal sean legibles desde la ficha sin depender del
hint.

Cambio:
- `frontend/src/pages/BasesTrabajo.jsx` compacta padding, radio y separaciones
  del card.
- `activeBase.nombre` deja de usar `truncate` y permite salto de linea seguro.
- `activeBase.descripcion` deja de usar `line-clamp-2`; queda en area interna
  con altura controlada y scroll propio para textos largos.
- Las metricas inferiores reducen padding para conservar la altura visual.
- `AppHint` se mantiene como apoyo.
- `frontend/scripts/smoke-classic-bases-trabajo-api-boundary.mjs` agrega guardas
  contra reintroducir el recorte principal.

Validacion:
- `cmd /c node frontend\scripts\smoke-classic-bases-trabajo-api-boundary.mjs`: OK.
- `cmd /c node frontend\scripts\smoke-classic-no-bim-contamination.mjs`: OK.
- `npm run build`: OK, con warning conocido de chunks grandes Vite.

Sin backend, DB, contratos API, auth/JWT, tenant, EDT, presupuestos,
cronogramas, BIM, Docker/Coolify/CI/CD ni guardas TASK-1807.

## 2026-06-19 - TASK-1956 Indicador compacto de nuevos Envios y Transferencias

Se compacto el indicador de Transferencias del header clasico a icono con badge
de nuevos pendientes.

Cambio:
- `frontend/src/layouts/AppLayout.jsx` agrega `hasNewTransferSignal`.
- El indicador se mantiene visible solo para `administrador` y
  `superadministrador`.
- El header ya no muestra textos visibles `Comunicación` ni `Nuevos`; solo
  icono y badge con `transferSignal.nuevos`.
- Si `transferSignal.nuevos > 0`, el icono aplica borde emerald, ring, sombra
  luminosa y `animate-pulse`.
- El click sigue navegando a
  `/servicios/envios-transferencias?bandeja=entrada`.
- El click emite `giproy:transfer-signal-opened` para que una bandeja ya abierta
  cambie a entrada y refresque filtros.
- `EnviosTransferencias.jsx` refresca la bandeja cada 30 segundos.

Frecuencia actual:
- `transferenciasApi.getTraySummary(selectedEmpresa?.id ?? null)` se ejecuta
  al montar/cambiar usuario o empresa activa.
- Luego se refresca cada `30` segundos con
  `window.setInterval(loadTransferSignal, 30000)`.

Validacion:
- `cmd /c node frontend\scripts\smoke-classic-transfer-header-signal.mjs`: OK.
- `cmd /c node frontend\scripts\smoke-classic-transferencias-ui.mjs`: OK.
- `cmd /c node frontend\scripts\smoke-classic-no-bim-contamination.mjs`: OK.
- `npm run build`: OK, warning conocido de chunks grandes Vite.

Sin backend, DB, contratos API, auth/JWT, tenant, EDT, presupuestos,
cronogramas, BIM, Docker/Coolify/CI/CD ni guardas TASK-1807.

## 2026-06-19 - TASK-1955 Limpieza global de Envios y Transferencias

Se dejo `Envios y Transferencias` en blanco para pruebas locales de todos los
usuarios/empresas, sin borrar activos ya materializados ni datos comerciales.

Ejecucion:
- Script nuevo: `backend/scripts/cleanup_all_transfer_activity.py`.
- Dry-run previo:
  `tmp/transfer_all_activity_cleanup_20260619_155119.json`.
- Apply:
  `tmp/transfer_all_activity_cleanup_20260619_155124.json`.
- Verificacion posterior:
  `tmp/transfer_all_activity_cleanup_20260619_155132.json`.

Eliminado:
- `transfer_shipments`: 5
- `transfer_shipment_items`: 5
- `transfer_import_results`: 5
- `transfer_import_references`: 5
- `transfer_audit_events`: 19
- `transfer_allowed_company_recipients`: 3
- `transfer_code_attempt_guards`: 3
- `transfer_marketplace_requirements`: 0
- `transfer_extra_recipient_packs_slots_reset`: 0

Estado posterior:
- Todas las tablas operativas de Transferencias quedan en `0`.
- Se conservan empresas, usuarios, codigos publicos, proyectos, bases, APUs,
  EDT, presupuestos, cronogramas, compras Marketplace, licencias y packs.

Validacion:
- `py_compile` del script OK.
- `cmd /c node frontend\scripts\smoke-classic-transferencias-ui.mjs`: OK.
- `cmd /c node frontend\scripts\smoke-classic-no-bim-contamination.mjs`: OK.
- `cmd /c node frontend\scripts\smoke-classic-conecta-api-boundary.mjs`: OK.
- `pytest app\tests\test_transferencias_tray.py app\tests\test_transferencias_recipients.py -q`: 15 passed.

Rollback:
- Restaurar desde `tmp/transfer_all_activity_cleanup_20260619_155124.json` en
  orden inverso al borrado.

Sin BIM, Docker/Coolify/CI/CD, cambios API, auth/JWT, tenant global, EDT,
presupuestos, cronogramas ni guardas TASK-1807.

## 2026-06-19 - TASK-1954 Reactivacion de papelera clasica en backend vivo

Se diagnostico y corrigio la causa real del fallo al abrir la papelera de
Proyectos. El mensaje generico era solo el sintoma visible.

Causa raiz funcional:
- El backend vivo en `localhost:3001` estaba desfasado frente al repo.
- Antes del reinicio, `GET /api/v1/openapi.json` no exponia
  `/api/v1/proyectos/papelera` ni `delete_project_base`.
- El codigo local del repo si exponia las rutas y parametros de TASK-1951 y
  TASK-1952.
- Por eso la UI clasica llamaba una papelera que el proceso vivo no tenia
  cargada y recibia `422`.

Correccion:
- Se reinicio `GiProy-Backend` mediante el launcher oficial
  `tools/launcher/main.py --elevated-action restart_services` y luego
  `start_services`.
- El backend quedo `RUNNING` con PID nuevo.
- El OpenAPI vivo ya expone `/api/v1/proyectos/papelera` y
  `delete_project_base`.
- `GiProy-Frontend` quedo `RUNNING` y `localhost:5173` responde `200`.

Estado de datos:
- En `Santiago Bermeo` (`empresa_id=3`) la BD local muestra
  `projects_deleted=0`, `bases_deleted=0`, `projects_active=1`,
  `bases_active=2`.
- Proyecto activo restante: `id=7`, `Proyecto Prueba Compartir 1`,
  `SantiagoBermeo-2026-001`.
- Los proyectos borrados durante la prueba no quedaron en papelera. Si deben
  recuperarse, abrir TASK separada de recuperacion desde backup/snapshot
  verificable; no se hizo saneamiento de datos en TASK-1954.

Validacion:
- `GET /api/v1/proyectos/papelera` sin token: `401 Not authenticated`, no
  `422`.
- `GET /api/v1/proyectos/papelera?empresa_id=3` con token valido: `200`, `[]`.
- OpenAPI vivo expone tambien `/api/v1/bases-trabajo/papelera`.
- `GET /api/v1/bases-trabajo/papelera?empresa_id=3` con token valido:
  `200`, `[]`.
- `npm run build`: OK, warning conocido de chunks grandes Vite.
- `node frontend/scripts/smoke-classic-no-bim-contamination.mjs`: OK.
- `cmd /c node frontend\scripts\smoke-classic-app-dialog-message-boundary.mjs`:
  OK.
- `cmd /c node frontend\scripts\smoke-classic-project-manager-api-boundary.mjs`:
  OK.

Cambio secundario:
- `frontend/src/components/ui/AppDialogProvider.jsx` normaliza tambien
  `detail`, `description`, `error`, `Error.message` y listas de validacion para
  evitar que futuros errores pierdan el detalle util.
- Se agrega `frontend/scripts/smoke-classic-app-dialog-message-boundary.mjs`.

Sin BIM, Docker/Coolify/CI/CD, cambios destructivos de DB, auth/JWT, tenant,
permisos, EDT, presupuestos, cronogramas ni guardas TASK-1807.

## 2026-06-18 - TASK-1953 Snapshot inmutable en importacion de Proyectos transferidos

Se corrigio una brecha en `Envios y Transferencias`: aunque el snapshot actual
de Proyecto ya acota la Base de Proyecto a los APUs usados por el presupuesto,
la importacion todavia podia preferir el clonado vivo si el Proyecto fuente
seguia existiendo en la misma DB.

Causa raiz:
- `_import_project_payload` intentaba `clone_project_to_company` antes de usar
  el payload exportado.
- Si el Proyecto fuente cambiaba despues de creado el envio, la importacion
  podia incorporar APUs que no estaban en el snapshot.
- Esto rompia la inmutabilidad del envio y podia inflar la Base importada.

Caso local auditado:
- `Proyecto id=32` (`Test Apus Optimizado`) tiene Base `57` con 177 APUs.
- Su presupuesto `id=39` tiene 5 APUs operativos enlazados.
- El codigo actual genera snapshot acotado: 5 APUs, 10 recursos, 11
  subcategorias.
- El envio historico `id=9` fue creado con preflight anterior de 177 APUs y ya
  esta importado; no se modifica retroactivamente.

Cambio:
- Los payloads modernos de Proyecto con `base_trabajo` o `apus` se importan
  desde el snapshot.
- El clonado vivo queda solo como fallback legacy cuando el payload no trae
  grafo Base/APU.

Guardas agregadas:
- Base de Proyecto de 177 APUs + presupuesto de 5 APUs con `tipo=None`.
- Snapshot no exporta APUs no usados.
- Importacion no clona la base completa.
- Importacion respeta el snapshot aunque el Proyecto fuente cambie despues del
  envio.

Validacion:
- `pytest app/tests/test_transferencias_import.py::test_transfer_import_project_uses_immutable_snapshot_even_if_source_project_changes_after_send -q`: OK.
- `pytest app/tests/test_transferencias_import.py app/tests/test_transferencias_preflight_snapshot.py -q`: 28 passed.
- `py_compile` focal de `transferencias.py` y tests: OK.

Sin BIM, frontend, DB, migraciones, rutas API, auth/JWT, tenant global,
Docker/Coolify/CI/CD ni guardas TASK-1807.

## 2026-06-18 - TASK-1952 Decision de Base de Proyecto al borrar Proyecto

Se ajusto la papelera de Proyectos para que el usuario decida explicitamente
que hacer con la Base de Proyecto asociada al eliminar un Proyecto.

Contrato backend:
- `DELETE /api/v1/proyectos/{id}` acepta `delete_project_base`.
- `delete_project_base=true` por defecto:
  - Proyecto a papelera.
  - Base de Proyecto a papelera.
- `delete_project_base=false`:
  - Proyecto a papelera.
  - Base asociada viva como `Base Maestra`.
  - La base queda disponible como Base de Trabajo reutilizable.

Reglas especiales:
- Si se restaura el Proyecto, una base preservada vuelve a tiparse como
  `Base de Proyecto`.
- Si se purga definitivamente un Proyecto cuya base fue preservada, la base no
  se elimina.
- Auditoria de `project_moved_to_recycle_bin` registra `delete_project_base`,
  `recycled_base_ids` y `preserved_base_ids`.

Frontend:
- `frontend/src/api/proyectos.js` envia la decision mediante cliente de
  dominio.
- `frontend/src/pages/Proyectos.jsx` muestra una opcion explicita en el modal
  de eliminacion:
  - mover tambien la Base de Proyecto,
  - conservarla como Base Maestra.

Validacion:
- `py_compile` focal backend: OK.
- `pytest app/tests/test_project_delete_endpoint.py app/tests/test_base_trabajo_recycle_bin.py`: 5 passed.
- `npm run build`: OK, warning conocido de chunks grandes Vite.
- `smoke-classic-project-manager-api-boundary`: OK.
- `smoke-classic-api-boundaries`: OK.
- `smoke-classic-no-bim-contamination`: OK.
- `validate_enterprise_baseline.py --include-frontend`: OK.
- Busqueda manual:
  - sin imports directos de `axiosConfig` fuera de `frontend/src/api`.
  - sin `console.log` productivos fuera de `frontend/src/api`.

Sin BIM, Docker/Coolify, CI/CD, migracion nueva, auth/JWT, tenant global ni
guardas del baseline TASK-1807.

## 2026-06-18 - TASK-1951 Papelera de reciclaje para Proyectos y Bases de Trabajo

Se implemento papelera clasica de 7 dias para evitar borrados fisicos
inmediatos de Proyectos y Bases de Trabajo.

Cambios principales:
- Migracion aditiva:
  `backend/alembic/versions/de1951a1b2c3_project_base_recycle_bin.py`.
- Proyectos:
  - `DELETE /proyectos/{id}` mueve a papelera.
  - `GET /proyectos/papelera`
  - `POST /proyectos/papelera/{id}/restore`
  - `DELETE /proyectos/papelera/{id}/purge`
  - `POST /proyectos/papelera/purge-expired`
- Bases de Trabajo:
  - `DELETE /bases-trabajo/{id}` mueve a papelera.
  - rutas equivalentes bajo `/bases-trabajo/papelera`.
- UI clasica:
  - boton `Papelera` en Proyectos.
  - boton `Papelera` en Bases de Trabajo.
  - modal con fecha de eliminacion, expiracion, restaurar y borrado
    definitivo.

Reglas operativas:
- Listados normales excluyen `deleted_at`.
- La retencion es de 7 dias.
- El Proyecto mueve tambien su Base de Proyecto asociada.
- La restauracion valida conflictos de nombre/codigo antes de reactivar.
- El borrado definitivo se hace solo desde papelera.

Migracion aplicada localmente:
- `alembic upgrade de1951a1b2c3`: OK.

Validacion:
- `py_compile` focal backend: OK.
- `pytest app/tests/test_project_delete_endpoint.py app/tests/test_base_trabajo_recycle_bin.py`: 4 passed.
- `npm run build`: OK, warning conocido de chunks grandes Vite.
- `smoke-classic-bases-trabajo-api-boundary`: OK.
- `smoke-classic-project-manager-api-boundary`: OK.
- `smoke-classic-no-bim-contamination`: OK.
- `validate_enterprise_baseline.py --include-frontend`: OK.

Sin cambios BIM, Docker/Coolify, CI/CD, auth/JWT, tenant global ni guardas del
baseline TASK-1807.

## 2026-06-18 - TASK-1950 Recuperacion correcta de proyecto historico en Santiago Bermeo

Se corrigio la recuperacion de Proyecto para `Santiago Bermeo` despues de que
el usuario aclarara que el borrado era reciente, pero el Proyecto tenia una
fecha de creacion de meses atras.

Proyecto recuperado:
- `proyecto_id=7`
- nombre: `Proyecto Prueba Compartir 1`
- codigo: `SantiagoBermeo-2026-001`
- `empresa_id=3`
- `base_trabajo_id=34`
- `presupuesto_id=13`

Fuente:
- `db_backup.json`.
- Script focal idempotente:
  `backend/scripts/recover_santiago_project7_from_backup.py`.
- Reporte de aplicacion:
  `tmp/santiago_project7_recovery_apply_20260618_173219.json`.

Datos restaurados:
- 15 nodos EDT.
- 201 lineas de presupuesto.
- 177 APUs.
- 866 lineas de APU.
- 216 recursos.
- Cronograma de trabajo.
- Cronograma valorado.
- Formula polinomica.
- Snapshot de calendario.

Validacion:
- `py_compile` del script: OK.
- `--dry-run`: OK.
- `--apply`: OK.
- `classic_asset_portability_service.assert_project_budget_apu_integrity`: OK.
- 0 lineas operativas sin APU.
- 0 APUs fuera de la Base de Proyecto `34`.
- Auditoria `project_recovered_from_backup` para `entity_id=7`.

Nota operativa:
- TASK-1949 recupero un candidato reciente (`proyecto_id=30`) que no era el
  Proyecto buscado. No se elimina automaticamente para evitar una accion
  destructiva sin autorizacion explicita.

Sin cambios BIM, frontend, rutas API, auth, JWT, tenant global,
Docker/Coolify/CI/CD ni guardas del baseline TASK-1807.

## 2026-06-18 - TASK-1949 Recuperacion operativa de proyecto borrado en Santiago Bermeo

Se analizo y recupero un Proyecto borrado por el administrador de la empresa
`Santiago Bermeo`.

Causa raiz operativa:
- El borrado clasico de Proyectos es fisico/destructivo, sin papelera logica.
- La tabla `proyectos` solo conservaba vivos los Proyectos `26` y `29` para
  `empresa_id=3`.
- Snapshots de comunicaciones mostraban copias importadas previas `23`, `24` y
  `25`, ya ausentes. El candidato mas reciente recuperable era la importacion
  `target_entity_id=25` desde `shipment_id=4`.

Recuperacion ejecutada:
- Backup previo:
  `tmp/project_recovery_santiago_before_20260618_172159.json`.
- Clonacion transaccional desde el Proyecto fuente vivo `22` de
  `Administradores Generales` hacia `Santiago Bermeo`.
- Nuevo Proyecto:
  - `proyecto_id=30`
  - `base_trabajo_id=55`
  - nombre: `compras publicas prueba1.pdf - recibido 4 - recuperado`
  - codigo: `Giproy-2026-000000018-TRF4REC`
- Auditoria estructurada `project_recovered_manual` para `proyecto_id=30`.

Validacion:
- `classic_asset_portability_service.assert_project_budget_apu_integrity`: OK.
- 23 nodos EDT, 1 presupuesto, 247 lineas, 212 APUs y 287 recursos.
- 0 lineas operativas sin APU.
- 0 APUs fuera de la Base de Proyecto recuperada.

Sin cambios de codigo, frontend, rutas API, auth, JWT, tenant global, BIM,
Docker/Coolify ni CI/CD. No se reabre TASK-1807.

## 2026-06-18 - TASK-1947 Reconexion de Nuevo Proyecto con empresa activa

Se corrigio la desconexion del flujo `Nuevo proyecto` en `Proyectos`.

Causa raiz:
- La rama visual activa `PROJECTS_HTML_REFERENCE_LANDING` tenia el boton, pero
  no montaba el modal `showCreateModal`; el modal solo existia en la rama
  legacy.
- `Proyectos.jsx` ya llamaba `proyectosApi.create(payload, empId)`.
- El cliente `frontend/src/api/proyectos.js` ignoraba el segundo argumento y
  hacia `POST /proyectos/` sin `withTenantConfig`, perdiendo empresa activa.

Cambios:
- El modal de creacion se extrae a `renderCreateProjectModal()`.
- La rama `PROJECTS_HTML_REFERENCE_LANDING` monta `renderCreateProjectModal()`.
- `proyectosApi.create` acepta `empresaId = null`.
- La creacion usa `withTenantConfig({}, empresaId)`.
- El smoke `smoke-classic-proyectos-logging-boundary.mjs` protege que el
  modal este montado en la rama activa y que el cliente preserve tenant en
  creacion.

Validaciones:
- `cmd /c node frontend\\scripts\\smoke-classic-proyectos-logging-boundary.mjs`: OK.
- `cmd /c node frontend\\scripts\\smoke-classic-project-manager-api-boundary.mjs`: OK.
- `node frontend\\scripts\\smoke-classic-no-bim-contamination.mjs`: OK.
- `npm run build`: OK, con warning conocido de chunks grandes Vite.

Sin backend, DB, rutas, auth, permisos, EDT, presupuestos, cronogramas, BIM,
Docker/Coolify ni CI/CD. No se reabre TASK-1807.

## 2026-06-18 - TASK-1946 Alineacion de encabezados del grid de presupuesto

Se corrigio la regresion visual en `Proyectos > Presupuesto`: los encabezados
del listado de items no quedaban alineados con las columnas reales.

Causa raiz:
- `LineasPresupuestoTab` tenia anchos de columnas repetidos.
- La columna `ACCIONES` de las filas ya usaba `144px`, pero el encabezado y
  algunos placeholders conservaban el ancho legacy `96px`.

Cambios:
- `BUDGET_COLUMN_WIDTH` centraliza los anchos del grid.
- Header, capitulos, lineas y placeholders reutilizan esos tokens.
- Encabezados visibles normalizados: `CÓD. EDT`, `UNIDAD`, `P. UNITARIO`.
- Smoke focal de Presupuestos protege la centralizacion sin hardcodear una
  cadena completa de clases Tailwind.

Validaciones:
- `cmd /c node frontend\\scripts\\smoke-classic-presupuesto-api-boundary.mjs`: OK.
- `node frontend\\scripts\\smoke-classic-no-bim-contamination.mjs`: OK.
- `npm run build`: OK, con warning conocido de chunks grandes Vite.

Sin backend, API, DB, auth, tenant, EDT, calculos de presupuesto, BIM,
Docker/Coolify ni CI/CD. No se reabre TASK-1807.

## 2026-06-18 - TASK-1948 Proyecto transferido con Base/APUs acotados al presupuesto

Se optimizo `Envios y Transferencias` para que un Proyecto enviado/importado no
arrastre la totalidad de su Base de Proyecto. El sistema calcula el grafo
transitivo desde los APUs usados por las lineas operativas del presupuesto e
incluye solo:

- APUs directos del presupuesto.
- APUs hijos anidados por `APULinea.apu_hijo_id`.
- Recursos usados por esos APUs.
- Unidades de esos recursos.
- Categorias y subcategorias necesarias para mantener alineamiento tecnico.

Cambios principales:

- `classic_asset_portability_service` incorpora colector de dependencias de
  base y clonado parcial de Base de Proyecto por contexto.
- `TransferenciasService._build_project_snapshot` llama a `_build_base_snapshot`
  con `apu_scope_ids` para exportar solo la base acotada al presupuesto.
- La importacion viva de Proyecto por Transferencias usa
  `restrict_base_to_budget_apus=True`.
- Las transferencias de Base de Trabajo siguen exportando/importando contenido
  completo.
- Plan funcional actualizado en
  `docs/Plan de Negocio/PLAN_ENVIOS_TRANSFERENCIAS.md`.

Validacion ejecutada:

- `py_compile` focal de servicios y test de Transferencias: OK.
- `pytest` focal de 4 casos criticos de importacion/snapshot: OK.
- `pytest app/tests/test_transferencias_import.py app/tests/test_transferencias_preflight_snapshot.py`: OK, 25 tests.
- `pytest app/tests/test_marketplace_checkout.py app/tests/test_public_procurement_project_materializer.py`: OK, 12 tests.
- Smoke anti-BIM clasico: OK.
- `tools/ai_tools/validate_enterprise_baseline.py --include-frontend`: OK.
  Warnings conocidos no bloqueantes: chunks grandes Vite y Pydantic BIM
  `model_name/model_id`.

No se toca BIM, Docker/Coolify/CI-CD, auth/JWT, tenant global ni rutas API
visibles.

## 2026-06-18 - TASK-1945 Correccion de codigo publico de empresa local

Se corrigio el error visible `No se pudo cargar el codigo publico de empresa`
en `Otros Servicios > Envios y Transferencias`.

Causa raiz:
- La base PostgreSQL local no tenia aplicada la migracion aditiva
  `de1933a1b2c3_transfer_company_public_codes.py`.
- El backend ya consultaba `TransferCompanyPublicCode`, por lo que el endpoint
  de codigo publico fallaba al no existir `transfer_company_public_codes`.

Acciones:
- Aplicada la migracion Alembic `de1933a1b2c3`.
- Ejecutado `transferencias_service.sanitize_company_public_codes(db)`.

Resultado:
- Tabla `transfer_company_public_codes` creada.
- `alembic_version` contiene `de1933a1b2c3`.
- 3 empresas escaneadas, 3 codigos creados.
- Codigos actuales:
  - `Administradores Generales`: `DVB - KPY`
  - `Jesus Benito Segura Gonzalez`: `QJ0 - XA9`
  - `Santiago Bermeo`: `Q4J - L36`

Validaciones:
- `pytest app\\tests\\test_transferencias_recipients.py -q`: 13 passed.
- `node frontend\\scripts\\smoke-classic-no-bim-contamination.mjs`: OK.

No se modifico frontend, API, auth, tenant, Marketplace, proyectos, BIM,
Docker/Coolify ni CI/CD.

## 2026-06-18 - TASK-1944 Limpieza de comunicaciones entre empresas de prueba

Se limpiaron todas las comunicaciones de `Envios y Transferencias` entre
`Administradores Generales` (`empresa_id=1`) y `Santiago Bermeo`
(`empresa_id=3`) en la base local. La limpieza se limito a relaciones de
transferencias entre ambas empresas: envios, payloads, resultados/referencias
de importacion, eventos de auditoria asociados, destinatario habilitado y guarda
de validacion de codigo relacionada.

Backup de aplicacion:
`tmp/transfer_company_communications_cleanup_20260618_124624.json`.

Resultado aplicado:
- Eliminados 4 `transfer_shipments`.
- Eliminados 4 `transfer_shipment_items`.
- Eliminados 3 `transfer_import_results`.
- Eliminadas 3 `transfer_import_references`.
- Eliminados 15 `transfer_audit_events`.
- Eliminado 1 `transfer_allowed_company_recipients`.
- Eliminado 1 `transfer_code_attempt_guards`.
- Ajustados 0 paquetes Conecta.

Verificacion posterior:
- Dry-run final con 0 coincidencias en todas las tablas de comunicaciones entre
  ambas empresas.
- `py_compile` del script OK.

Nota operativa: esta base local no contiene aun la tabla
`transfer_company_public_codes`; el script detecta esa ausencia y usa la tabla
legacy `transfer_admin_public_codes` para identificar guardas de codigo, sin
aplicar migraciones ni cambiar esquema.

No se borraron empresas, codigos publicos, proyectos, bases, APUs, EDT,
presupuestos, compras Marketplace ni licencias. Sin BIM, Docker, Coolify, CI/CD
ni cambios de contratos API/auth/tenant.

## 2026-06-18 - TASK-1943 Retirada de funcion Portatil del header clasico

Se elimina la funcion visible `Portatil` del header clasico. `AppLayout` ya no
lee ni escribe el override manual de `Portable Workspace`, `APUs` deja de
engancharse a ese override y el helper legacy queda inerte para que una clave
antigua en `localStorage` no reactive compactaciones. El responsive real por
viewport se conserva donde ya existia. Sin backend, DB, auth, tenant, BIM,
Docker/Coolify ni CI/CD.

Fecha
2026-06-17

Motor IA utilizado
Codex

TASK cerrada
TASK-1941: motor comun de portabilidad clasica en Transferencias.

Resultado actual
`Envios y Transferencias` ya no reconstruye proyectos vivos con una rutina
aislada que pierde `PresupuestoDetalle.apu_id`. La importacion de proyectos
referenciados por un envio usa `classic_asset_portability_service`, que clona
Base de Proyecto, APUs, EDT y Presupuesto conservando el mapa `APU origen ->
APU destino` y valida que las lineas operativas queden dentro de la base de la
empresa receptora.

El snapshot de Proyecto tambien embebe Base de Proyecto, unidades, recursos y
APUs. Si el proyecto origen ya no se puede resolver como activo vivo, el
fallback de importacion por snapshot reconstruye el mapa de APUs y conserva
`PresupuestoDetalle.apu_id`.

Regla vigente reforzada: un Proyecto transferible no puede existir sin Base de
Proyecto y APUs. Datos de Proyecto + EDT + Presupuesto solo son suficientes si
el Presupuesto esta enlazado a APUs de esa Base de Proyecto.

Marketplace tambien usa el mismo motor comun para copiar Proyectos
referenciados/materializados: la entrega conserva sus extensiones propias
detalle/EDO/cronogramas, pero la copia Proyecto/Base/APU/EDT/Presupuesto ya no
vive como rutina independiente.

Cambios TASK-1941:
- Nuevo servicio comun `backend/app/services/classic_asset_portability.py`.
- `backend/app/services/transferencias.py` usa el motor comun para proyectos
  vivos y conserva fallback legacy para snapshots antiguos.
- `backend/app/services/marketplace_checkout.py` delega la copia de Proyecto al
  motor comun y conserva solo extensiones propias de Marketplace.
- El snapshot de proyecto queda completo para importacion inmutable con
  Base/APUs/unidades.
- El preflight bloquea proyectos sin Base de Proyecto, sin APUs o con lineas
  operativas de presupuesto sin `apu_id`.
- `backend/app/repositories/base_trabajo.py` permite `commit=False` en
  `create` para operaciones atomicas y conserva `commit=True` por defecto.
- El clonado profundo de bases clona unidades no globales al contexto destino.
- Corregida referencia interna `new_base.id` inexistente en el log de clonado.
- Test focal confirma que un proyecto importado por Transferencias conserva
  `apu_id` enlazado a APU de la base clonada.
- Sin BIM, sin Docker/Coolify/CI-CD, sin cambios destructivos ni auth/JWT.

Validaciones TASK-1941:
- `py_compile` focal OK.
- `pytest app/tests/test_transferencias_import.py app/tests/test_transferencias_preflight_snapshot.py -q` OK, 23 passed.
- `pytest app/tests/test_public_procurement_project_materializer.py app/tests/test_public_procurement_import_certifier.py -q` OK, 7 passed.
- `pytest app/tests/test_marketplace_checkout.py app/tests/test_project_marketplace_exporter.py -q` OK, 13 passed.
- `pytest` combinado Transferencias + Compras Publicas + Marketplace OK, 45
  passed.
- `node frontend/scripts/smoke-classic-no-bim-contamination.mjs` OK.
- `node frontend/scripts/smoke-classic-transferencias-ui.mjs` OK.
- `tools/ai_tools/validate_enterprise_baseline.py --include-frontend` OK.

TASK anterior relevante
TASK-1940: saneamiento de recepcion en envios actuales.

Resultado TASK-1940
Se saneo el envio existente `id=2`, que estaba ya realizado como `enviado` pero
sin marca `received_at`. Ahora no quedan envios activos enviados sin recepcion
registrada. El saneamiento dejo backup en
`tmp/transfer_sent_receipts_backup_20260617_191619.json` y evento de auditoria
`transfer_shipment_receipt_sanitized`, visible en castellano como
`Recepcion saneada por el sistema`.

Cambios TASK-1940:
- Nuevo script reproducible
  `backend/scripts/sanitize_transfer_sent_receipts.py`.
- Dry-run detecto 1 envio pendiente de saneamiento.
- Ejecucion con `--apply` actualizo `received_at` del envio `id=2`.
- Verificacion posterior: 0 pendientes y 1 evento de auditoria.
- Sin migraciones ni cambios destructivos.

TASK anterior relevante
TASK-1939: estado visible contextual en bandeja de Transferencias.

Resultado TASK-1939
La bandeja de `Otros Servicios > Envios y Transferencias` distingue el estado
visible segun empresa operativa. Un envio persistido como `enviado` sigue
siendo `enviado` internamente, pero se muestra como `Enviado` para la empresa
emisora y como `Recibido` para la empresa receptora. Esto elimina la confusion
sin alterar filtros, auditoria, acciones ni persistencia.

Cambios TASK-1939:
- `serialize_tray_item` calcula `status_label`/`status_color` segun
  `direction`.
- `status=enviado` + `direction=entrada` se presenta como `Recibido`.
- `status=enviado` + `direction=salida` se presenta como `Enviado`.
- Pytest focal cubre el caso emisor/receptor.

TASK anterior relevante
TASK-1938: historico de Transferencias en castellano.

Resultado TASK-1938
El historico de `Otros Servicios > Envios y Transferencias` ya no muestra
codigos tecnicos ni etiquetas generadas en ingles. El backend devuelve
`label`/`type_label` en castellano para estados y eventos auditados; el frontend
mantiene fallback castellano para datos legados y el modal no renderiza
`event.type` crudo.

Cambios TASK-1938:
- Diccionario backend de etiquetas castellanas para timeline.
- `shipment_timeline` deja de derivar labels desde
  `event_type.replace("_", " ")`.
- Modal `ShipmentTimelineModal` usa `type_label`/fallback castellano.
- Smoke frontend bloquea volver a pintar `{event.type}` como texto visible.
- Pytest valida que `transfer_shipment_cancelled` se muestra como
  `Envio cancelado por el emisor`.

TASK anterior relevante
TASK-1937: cancelacion emisora, historico y saneamiento de importacion en
Transferencias.

Resultado TASK-1937
`Otros Servicios > Envios y Transferencias` permite a la empresa emisora
cancelar un envio mientras no haya sido importado por la receptora. Entrada y
salida tienen accion `Historial` para revisar la trazabilidad por fecha/hora.
Tras una importacion completada, el envio no puede volver a importarse; el
backend conserva resultado idempotente, referencias y auditoria, pero sanea el
payload pesado del item dejando solo metadata, hash y contrato para ahorrar
espacio.

Cambios TASK-1937:
- `transferenciasApi.cancelShipment` opera con empresa activa explicita.
- `EnviosTransferencias.jsx` muestra `Cancelar envio` en salidas no importadas.
- `EnviosTransferencias.jsx` muestra `Historial` para entradas y salidas.
- Nuevo modal de cancelacion con motivo opcional.
- Nuevo modal de trazabilidad de transferencia.
- `import_shipment` sanea `payload_json` tras importacion completada.
- Pytest cubre cancelacion antes de importar, bloqueo despues de importar e
  importacion idempotente con payload saneado.
- El plan documenta importacion/exportacion como motor universal regido por
  contexto para ventas publicas, Marketplace y envios directos.

TASK anterior relevante
TASK-1936: retirada de accion Abrir en Transferencias.

Resultado TASK-1936
`Otros Servicios > Envios y Transferencias` ya no tiene accion `Abrir`. El
receptor trabaja con `Importar`, `Rechazar` o `Revalidar compras`; Marketplace
bloquea importacion/uso, no una apertura intermedia. El emisor puede cancelar
mientras el envio no haya sido importado.

Cambios TASK-1936:
- Retirado boton `Abrir` en la bandeja.
- Eliminado `openShipment` del cliente frontend.
- Eliminado endpoint backend `POST /transferencias/shipments/{shipment_id}/open`.
- Eliminado `open_shipment` del servicio.
- `can_open_or_import` renombrado a `can_import_or_use`.
- `abierto` sale del contrato de estados nuevos.
- `opened_at` queda solo como campo legacy, sin timeline ni accion.
- Smoke de transferencias prohíbe reintroducir `Abrir`/`openShipment`.

TASK anterior relevante
TASK-1935: refresco global por cambio de empresa activa.

Resultado TASK-1935
El cambio de empresa activa como Superadministrador remonta el contenido
protegido bajo `AppLayout` usando una key derivada de `selectedEmpresa.id`.
Esto evita que cualquier modulo clasico conserve datos visibles del tenant
anterior hasta refrescar el navegador. `AuthContext` mantiene la limpieza de
base/proyecto y emite el evento comun `giproy:working-company-changed`.

Cambios TASK-1935:
- `frontend/src/api/tenant.js` expone evento y dispatcher de cambio de empresa.
- `AuthContext` emite la senal al seleccionar empresa.
- `AppLayout` remonta el contenido operativo al cambiar `selectedEmpresa.id`.
- `STYLE_GUIDE` documenta la norma transversal de remonte visual por tenant.
- Smoke `smoke-classic-superadmin-tenant-context.mjs` cubre la regresion.

TASK anterior relevante
TASK-1934: cierre multitenant Superadmin Transferencias.

Resultado TASK-1934
`Otros Servicios > Envios y Transferencias` opera ya contra la empresa
seleccionada por el Superadministrador. La pagina no conserva bandeja vieja al
cambiar empresa y el semaforo del header consulta `tray-summary` con empresa
operativa explicita.

Cambios TASK-1934:
- `transferenciasApi` acepta `empresaId` explicito en rutas sensibles.
- `EnviosTransferencias.jsx` usa `AuthContext.selectedEmpresa`.
- Cambio de empresa limpia bandeja, red de destinatarios, modales y rechazo
  pendiente.
- Acciones de apertura/importacion/rechazo/revalidacion pasan empresa activa.
- `AppLayout` pasa `selectedEmpresa?.id` al semaforo de transferencias.
- Test de regresion: mismo superadministrador ve `salida` desde
  `Administradores Generales` y `entrada` desde `Santiago Bermeo`.

Validacion ejecutada TASK-1934:
- `.\\.venv\\Scripts\\python.exe -m py_compile backend\\app\\api\\endpoints\\transferencias.py backend\\app\\services\\transferencias.py` OK.
- `..\\.venv\\Scripts\\python.exe -m pytest app\\tests\\test_transferencias_tray.py -q` OK, 2 passed.
- `..\\.venv\\Scripts\\python.exe -m pytest app\\tests\\test_transferencias_recipients.py -q` OK, 13 passed.
- `node frontend/scripts/smoke-classic-transferencias-ui.mjs` OK.
- `node frontend/scripts/smoke-classic-no-bim-contamination.mjs` OK.
- Guardas focales `rg`: sin `axiosConfig`/`console.log` fuera de API en el
  slice y sin menciones BIM en archivos tocados.
- `npm run build` OK.
- `tools/ai_tools/validate_enterprise_baseline.py --include-frontend` OK.
- Warnings conocidos no bloqueantes: chunks grandes Vite y Pydantic BIM
  `model_name` / `model_id`.
- Reinicio local de servicios intentado, pero Windows deniega detener
  `GiProy-Backend` y `GiProy-Frontend` desde esta sesion. Ambos servicios
  permanecen `Running`; si no hay hot reload, reiniciar con permisos elevados
  antes de retestar manualmente.

No interferencia:
- Sin UX BIM, sin dependencia BIM, sin Docker/Coolify/CI-CD/staging/produccion.
- Sin cambios auth/JWT globales.

---

Fecha
2026-06-17

Motor IA utilizado
Codex

TASK cerrada
TASK-1933: codigo publico de empresa Transferencias.

Resultado actual
El codigo `XXX - XXX` de `Otros Servicios > Envios y Transferencias` queda
corregido como identidad publica de empresa. Un mismo superadministrador puede
operar `Administradores Generales` y `Santiago Bermeo` sin reutilizar el mismo
codigo, porque el backend resuelve la empresa operativa seleccionada.

Cambios TASK-1933:
- Nuevo modelo `TransferCompanyPublicCode`.
- Migracion aditiva `de1933a1b2c3_transfer_company_public_codes.py`.
- Servicio de saneamiento por empresa y fallback legacy por usuario.
- Endpoints de transferencias con `empresa_id` operativo validado.
- Endpoint superadmin `/transferencias/admin/sanitize-company-codes`.
- UI rotulada como `Codigo publico de empresa`.
- Tests focales para codigos distintos por empresa y bloqueo no-superadmin.

Validacion ejecutada TASK-1933:
- `.\\.venv\\Scripts\\python.exe -m py_compile backend\\app\\models\\transferencia.py backend\\app\\schemas\\transferencia.py backend\\app\\services\\transferencias.py backend\\app\\api\\endpoints\\transferencias.py backend\\alembic\\versions\\de1933a1b2c3_transfer_company_public_codes.py` OK.
- `..\\.venv\\Scripts\\python.exe -m pytest app\\tests\\test_transferencias_recipients.py -q` OK, 13 passed.
- `..\\.venv\\Scripts\\python.exe -m pytest app\\tests\\test_transferencias_preflight_snapshot.py -q` OK, 7 passed.
- `..\\.venv\\Scripts\\python.exe -m pytest app\\tests\\test_transferencias_conecta_marketplace.py -q` OK, 3 passed.
- `node frontend/scripts/smoke-classic-transferencias-ui.mjs` OK.
- `node frontend/scripts/smoke-classic-no-bim-contamination.mjs` OK.
- `npm run build` OK.
- `tools/ai_tools/validate_enterprise_baseline.py --include-frontend` OK.
- Warnings conocidos no bloqueantes: chunks grandes Vite y Pydantic BIM
  `model_name` / `model_id`.

No interferencia:
- Sin UX BIM, sin dependencia BIM, sin Docker/Coolify/CI-CD/staging/produccion.
- Sin cambios destructivos de PostgreSQL ni eliminacion de guardas TASK-1807.

---

Fecha
2026-06-16

Motor IA utilizado
Codex

TASK cerrada
TASK-1932: normalizacion de combobox Transferencias.

Resultado actual
Los combobox de `Otros Servicios > Envios y Transferencias` quedan corregidos
para seguir el patron visual de `Proyectos > Datos Proyecto > Tipo de
Proyecto`: trigger blanco, borde fino, radio amplio, altura estable, texto
centrado verticalmente y flecha alineada a la derecha.

Cambios TASK-1932:
- `TRANSFER_SELECT_TRIGGER_CLASS` vuelve a definir estructura completa del
  trigger de `SearchableSelect`.
- Buscador, codigo, fechas y selectores comparten altura/radio/superficie.
- Smoke focal protege alineacion `items-center justify-between` y truncado del
  valor visible.

Validacion ejecutada TASK-1932:
- `node frontend/scripts/smoke-classic-transferencias-ui.mjs` OK.
- `node frontend/scripts/smoke-classic-no-bim-contamination.mjs` OK.
- `npm run build` OK.
- `tools/ai_tools/validate_enterprise_baseline.py --include-frontend` OK.
- Warnings conocidos no bloqueantes: chunks grandes Vite y Pydantic BIM
  `model_name` / `model_id`.

No interferencia:
- Sin backend, DB, migraciones, auth/JWT/tenant/permisos, Marketplace, UX BIM
  ni Docker/Coolify/CI-CD.

---

Fecha
2026-06-16

Motor IA utilizado
Codex

TASK cerrada
TASK-1931: semaforizacion compacta y gestion visible de empresas.

Resultado actual
`Otros Servicios > Envios y Transferencias` ahora muestra la gestion de
empresas como accion propia antes de `Nuevo envio`. La barra principal integra
semaforos compactos estilo `Cronogramas > Gantt`, y el modal `Nuevo envio`
queda enfocado en seleccionar destinatario y enviar.

Cambios TASK-1931:
- Boton `Empresas` en cabecera.
- Modal `Empresas para comunicarse` con codigo propio, alta por codigo,
  confirmacion, fijas, adicionales `Conecta` y expiracion.
- Semaforos compactos en barra: Empresas, Enviados, Recibidos, Nuevos y
  Bloqueados.
- Se retira la fila grande de KPIs.
- `/transferencias/recipients` agrega campos aditivos para capacidad fija y
  Conecta.
- Test focal cubre capacidad Conecta en destinatarios.

Validacion ejecutada TASK-1931:
- `.\\.venv\\Scripts\\python.exe -m py_compile backend\\app\\schemas\\transferencia.py backend\\app\\services\\transferencias.py backend\\app\\api\\endpoints\\transferencias.py` OK.
- `..\\.venv\\Scripts\\python.exe -m pytest app\\tests\\test_transferencias_recipients.py -q` OK, 10 passed.
- `node frontend/scripts/smoke-classic-transferencias-ui.mjs` OK.
- `node frontend/scripts/smoke-classic-no-bim-contamination.mjs` OK.
- `npm run build` OK.
- `tools/ai_tools/validate_enterprise_baseline.py --include-frontend` OK.
- Warnings conocidos no bloqueantes: chunks grandes Vite y Pydantic BIM
  `model_name` / `model_id`.

No interferencia:
- Sin migraciones, sin cambios auth/JWT/tenant/permisos, sin UX BIM y sin
  Docker/Coolify/CI-CD.

---

Fecha
2026-06-16

Motor IA utilizado
Codex

TASK cerrada
TASK-1930: empresas para comunicarse por codigo.

Resultado actual
El modal `Nuevo envio` de `Otros Servicios > Envios y Transferencias` ya expone
la estructura funcional de destinatarios por codigo publico: listado de
empresas habilitadas, resumen de slots fijos/adicionales, entrada de codigo,
validacion contra backend, vista previa de empresa detectada y confirmacion
explicita para asociarla y seleccionarla como destinataria.

Cambios TASK-1930:
- `transferenciasApi` agrega `resolveRecipientCode` y `createRecipient`.
- `EnviosTransferencias.jsx` incorpora bloque funcional de empresas para
  comunicarse dentro del modal de nuevo envio.
- El listado distingue destinatarios fijos y adicionales.
- La validacion muestra solo empresa/alias/nombre legal, sin exponer usuario
  propietario del codigo.
- El smoke focal protege la entrada por codigo y los metodos API.

Validacion ejecutada TASK-1930:
- `node frontend/scripts/smoke-classic-transferencias-ui.mjs` OK.
- `node frontend/scripts/smoke-classic-no-bim-contamination.mjs` OK.
- `npm run build` OK.
- `tools/ai_tools/validate_enterprise_baseline.py --include-frontend` OK.
- Warnings conocidos no bloqueantes: chunks grandes Vite y Pydantic BIM
  `model_name` / `model_id`.

No interferencia:
- Sin backend nuevo, DB, migraciones, auth, tenant, licencias, Marketplace
  funcional, UX BIM ni Docker/Coolify/CI-CD.
- Sin reabrir baseline local clasico TASK-1807.

---

Fecha
2026-06-16

Motor IA utilizado
Codex

TASK cerrada
TASK-1929: implementacion visual Proyectos en Transferencias.

Resultado actual
La pantalla `Otros Servicios > Envios y Transferencias` queda visualmente
homologada con el lenguaje operativo de `Proyectos` y `Datos de Proyecto`:
toolbar soft, segmentado de bandeja, buscador limpiable, filtros compactos,
KPIs ligeros, lista densa, microacciones y modales tecnicos.

Cambios TASK-1929:
- `EnviosTransferencias.jsx` reutiliza `ProjectHeaderActionButton`,
  `ProjectSegmentedSwitch`, `ClearSearchField`, `LiquidButton`,
  `SearchableSelect` y `AnimatedDateInput`.
- `Nuevo envio` y `Refrescar` pasan a botones tecnicos soft.
- `Todos / Entrada / Salida` queda como segmentado operacional.
- Las metricas se compactan y la bandeja reduce altura visual.
- Acciones de fila pasan a microbotones soft.
- Modales de nuevo envio y rechazo quedan en estructura tecnica clasica.
- Smoke focal de transferencias refuerza guardas visuales de TASK-1929.

Validacion ejecutada TASK-1929:
- `node frontend/scripts/smoke-classic-transferencias-ui.mjs` OK.
- `node frontend/scripts/smoke-classic-no-bim-contamination.mjs` OK.
- `npm run build` OK.
- `tools/ai_tools/validate_enterprise_baseline.py --include-frontend` OK.
- Warning conocido no bloqueante: chunks grandes Vite.

No interferencia:
- Sin backend, DB, API, auth, tenant, licencias ni Marketplace funcional.
- Sin Docker/Coolify/CI-CD/staging/produccion.
- Sin UX BIM.
- Sin dependencia nueva hacia BIM.
- Sin reabrir ni romper baseline local clasico TASK-1807.

---

Fecha
2026-06-16

Motor IA utilizado
Codex

TASK cerrada
TASK-1928: control de adecuacion visual Proyectos en Transferencias.

TASK pendiente
TASK-1929: implementacion visual Proyectos en Transferencias.

Resultado actual
Se documenta que `Otros Servicios > Envios y Transferencias` esta funcional,
pero requiere una adecuacion visual adicional para alinearse realmente con
`Proyectos`: toolbar, botones, filtros/combobox, KPIs, listado, acciones de fila
y modales.

Cambios TASK-1928:
- Se agrega adenda visual en
  `docs/Plan de Negocio/PLAN_ENVIOS_TRANSFERENCIAS.md`.
- Se crea `docs/tasks/TASK-1928.md` como control documental cerrado.
- Se crea `docs/tasks/TASK-1929.md` como implementacion pendiente.

Alcance TASK-1929:
- Solo frontend clasico.
- Referencia visual principal: `Proyectos` y `Datos de Proyecto`.
- Componentes objetivo: `ProjectSegmentedSwitch`, `ProjectHeaderActionButton`,
  `LiquidButton`, `ClearSearchField`, `SearchableSelect`, `AnimatedSelect` y
  `AnimatedDateInput`.
- Sin backend, DB, API, auth, tenant, licencias, Marketplace funcional, BIM ni
  Docker/Coolify/CI-CD.

Validacion TASK-1928:
- Documentacion y TASKs creadas.
- Sin cambios de codigo productivo.

No interferencia:
- Sin Docker/Coolify/CI-CD/staging/produccion.
- Sin UX BIM.
- Sin dependencia nueva hacia BIM.
- Sin cambios destructivos de PostgreSQL.
- Sin reabrir ni romper baseline local clasico TASK-1807.

---

Fecha
2026-06-16

Motor IA utilizado
Codex

TASK cerrada
TASK-1927: saneamiento operativo bandeja Transferencias.

Resultado actual
Se corrige el fallo runtime `No se pudo cargar la bandeja` en
`Otros Servicios > Envios y Transferencias`. La causa raiz no era frontend: la
base PostgreSQL local no tenia aplicada la migracion Alembic
`de1917a1b2c3_transferencias_foundation.py` y el backend fallaba al consultar
`transfer_shipments`.

Cambios TASK-1927:
- Se aplica la migracion Alembic existente y aditiva `de1917a1b2c3`.
- Quedan creadas las tablas `transfer_*` del modulo de Envios y Transferencias.
- No se modifica codigo frontend/backend ni contratos funcionales.

Validacion ejecutada TASK-1927:
- `alembic current` muestra `de1917a1b2c3 (head)`.
- Inspector SQLAlchemy confirma las tablas `transfer_*`.
- `transferencias_service.list_tray(...)` responde `total=0`, metricas a cero e
  `items=[]` sin error.

No interferencia:
- Sin Docker/Coolify/CI-CD/staging/produccion.
- Sin UX BIM.
- Sin dependencia nueva hacia BIM.
- Sin cambios destructivos de PostgreSQL.
- Sin reabrir ni romper baseline local clasico TASK-1807.

---

Fecha
2026-06-16

Motor IA utilizado
Codex

TASK cerrada
TASK-1926: baseline enterprise Envios y Transferencias.

Resultado actual
El plan completo de `Otros Servicios > Envios y Transferencias` queda cerrado
al 100% en GiProy Clasico. Se implementaron y validaron backend, Marketplace
Conecta, bandeja, semaforo header, UI clasica y guardas enterprise.

Cambios TASK-1926:
- Se refuerzan tests de licencias bloqueadas para `EXPRESS`, `TESTER`,
  `ACADEMIC` y `TRAINING`.
- Las licencias bloqueadas no pueden resolver/asociar destinatarios.
- Un receptor con licencia bloqueada no puede abrir ni importar envios.
- Se confirma importacion idempotente, fallo recuperable, bloqueo Marketplace,
  compra completa obligatoria y Conecta acumulable.
- Se confirma ruta frontend `/servicios/envios-transferencias`, card de Otros
  Servicios, semaforo header, bandeja, preflight y guardas UI.

Validacion ejecutada TASK-1926:
- `python -m py_compile` backend focal OK.
- `pytest` focal transferencias/Marketplace/licencias OK (`54 passed`).
- `npm run build` OK.
- `node frontend/scripts/smoke-classic-no-bim-contamination.mjs` OK.
- `cmd /c node frontend\scripts\smoke-classic-transfer-header-signal.mjs` OK.
- `cmd /c node frontend\scripts\smoke-classic-transferencias-ui.mjs` OK.
- `tools/ai_tools/validate_enterprise_baseline.py --include-frontend` OK.
- Warnings conocidos no bloqueantes: Pydantic BIM `model_name/model_id`,
  deprecations de Pydantic/httpx en tests y chunks grandes Vite.

Porcentaje del plan `Envios y Transferencias`
100% dentro del alcance aprobado. No quedan TASKs abiertas de este plan.

No interferencia:
- Sin Docker/Coolify/CI-CD/staging/produccion.
- Sin UX BIM.
- Sin dependencia nueva hacia BIM.
- Sin cambios destructivos de PostgreSQL.
- Sin reabrir ni romper baseline local clasico TASK-1807.

---

Fecha
2026-06-16

Motor IA utilizado
Codex

TASK cerrada
TASK-1925: UI clasica de Envios y Transferencias.

Resultado actual
Queda implementado el octavo slice de `Otros Servicios > Envios y
Transferencias`: bandeja frontend clasica, ruta real desde Otros Servicios,
semaforo header conectado a la bandeja de entrada y modal tecnico de nuevo
envio/preflight.

Cambios TASK-1925:
- Nueva pagina `frontend/src/pages/EnviosTransferencias.jsx`.
- Ruta protegida `/servicios/envios-transferencias`.
- Card `Envios y Transferencias` de `Otros Servicios` pasa de placeholder a
  bandeja activa.
- `AppLayout` navega desde el semaforo a
  `/servicios/envios-transferencias?bandeja=entrada`.
- Bandeja compacta con filtros entrada/salida, estado, busqueda omni y rango
  de fechas.
- Toolbar operativa con `Nuevo envio` y `Refrescar`.
- Modal tecnico de nuevo envio con destinatario, activo, descripcion
  obligatoria, preflight, hash de snapshot y confirmacion Marketplace.
- Acciones de recepcion: abrir, importar, rechazar con motivo obligatorio y
  revalidar compras Marketplace.
- Timeline resumido y aviso visual de compra Marketplace obligatoria.
- Se reemplazaron controles nativos por `SearchableSelect` y
  `AnimatedDateInput`; no hay `window.prompt`.
- Nuevo smoke `frontend/scripts/smoke-classic-transferencias-ui.mjs`.

Checklist visual TASK-1925:
- Referencia principal: `Proyectos` / `Datos de Proyecto`.
- Primera pantalla operativa, no landing.
- Listado compacto, superficies soft y toolbar tecnica clasica.
- Modal tecnico, sin apariencia SaaS global.
- Sin UX BIM, sin texto BIM y sin acoplamientos nuevos hacia BIM.

Validacion ejecutada TASK-1925:
- `npm run build` OK.
- `node frontend/scripts/smoke-classic-no-bim-contamination.mjs` OK.
- `cmd /c node frontend\scripts\smoke-classic-transfer-header-signal.mjs` OK.
- `cmd /c node frontend\scripts\smoke-classic-transferencias-ui.mjs` OK.
- `tools/ai_tools/validate_enterprise_baseline.py --include-frontend` OK.
- Guarda focal sin `axiosConfig`, `console.log`, `<select>`, `window.prompt`
  ni `input type="date"` en la nueva pantalla.
- Warning conocido no bloqueante: chunks grandes Vite.

Porcentaje del plan `Envios y Transferencias`
90%. Queda pendiente `TASK-1926`: cierre enterprise/E2E final con validacion
integrada del plan completo.

---

Fecha
2026-06-16

Motor IA utilizado
Codex

TASK cerrada
TASK-1924: producto Conecta para destinatarios adicionales.

Resultado actual
Queda implementado el septimo slice de `Otros Servicios > Envios y
Transferencias`: producto Marketplace `Conecta` para ampliar destinatarios
adicionales, con paquetes independientes de 3 empresas destino por 30 dias. No
se activa todavia UI final de bandeja.

Cambios TASK-1924:
- Catalogo sistema define `Conecta` como producto unico de Envios y
  Transferencias.
- Precio inicial `24,99 USD`.
- `commercial_code=CONECTA_TRANSFERENCIAS`.
- Metadata comercial: `recipient_slots=3`, `duration_days=30`,
  acumulable, compra independiente y nueva asociacion requerida.
- Checkout activa `TransferExtraRecipientPack` por cada item de pedido
  confirmado.
- Cada pack conserva `marketplace_order_item_id`, `purchased_at`, `expires_at`,
  `slots_total` y `slots_used`.
- Compra con cantidad mayor a 1 genera packs independientes.
- Packs expirados no habilitan nuevos destinatarios adicionales ni reactivan
  relaciones expiradas automaticamente.
- El antiguo Conecta mensual se reutiliza por legacy slug; el anual queda fuera
  del catalogo activo en bootstrap.

Cambios TASK-1923:
- Nuevo cliente `frontend/src/api/transferencias.js` para
  `GET /api/v1/transferencias/tray-summary`.
- `AppLayout` muestra indicador `Comunicación` / `Nuevos` para
  Administrador/Superadministrador.
- Indicador visual: circulo gris sin novedades y verde con pulso si hay nuevos
  envios.
- Polling cada 60 segundos, sin WebSocket/SSE y sin desplegable complejo.
- Click a `/servicios?modulo=envios-transferencias&bandeja=entrada`, dejando
  preparado el destino para TASK-1925.
- Sin import directo de `axiosConfig` fuera de `frontend/src/api` y sin
  `console.log` productivo.

Cambios TASK-1922:
- Endpoints:
  `POST /api/v1/transferencias/shipments/{shipment_id}/open`,
  `POST /api/v1/transferencias/shipments/{shipment_id}/reject`,
  `POST /api/v1/transferencias/shipments/{shipment_id}/import`.
- Abrir/importar exige rol Administrador/Superadministrador, licencia habilitada
  y que el envio pertenezca a la empresa receptora activa.
- `bloqueado_marketplace` impide abrir/importar hasta completar/revalidar
  compra de todos los productos obligatorios.
- Rechazo exige motivo, marca `rechazado`, conserva motivo y emite evento
  auditable para empresa emisora.
- Importacion crea copia nueva:
  - Proyecto: cabecera, EDT y presupuestos desde snapshot.
  - Base de Trabajo: cabecera y catalogo clasico cuando existe en payload.
- `TransferImportResult` controla idempotencia; repetir importacion completada
  devuelve la misma entidad sin duplicar.
- `TransferImportReference` conserva envio, empresa emisora, entidad origen y
  entidad importada.
- `fallo_importacion` persiste como resultado fallido y permite reintento
  controlado sin duplicar activos.
- Visibilidad inicial documentada en metadata como `admins_and_superadmins`.

Cambios TASK-1921:
- API de bandeja:
  `GET /api/v1/transferencias/tray`.
- API de resumen para futuro semaforo header:
  `GET /api/v1/transferencias/tray-summary`.
- API de timeline:
  `GET /api/v1/transferencias/shipments/{shipment_id}/timeline`.
- Filtros soportados: `todos`, `entrada`, `salida`, estado, fecha inicio,
  fecha fin, paginacion y busqueda omni.
- Rango por defecto: ultimos 30 dias hasta fecha/hora actual.
- Orden por fecha/hora de recepcion descendente, con fallback a `sent_at` y
  `created_at` cuando el envio aun no tiene `received_at`.
- Busqueda omni por nombre legal, alias, descripcion y nombre del activo.
- Alias de empresa como display preferente sin perder nombre legal.
- Estados con label/color y `status_recoverable`; `fallo_importacion` queda
  recuperable y auditable.
- Metricas: enviados, recibidos, nuevos, bloqueados, listos, importados,
  rechazados, cancelados, expirados y fallos de importacion.
- Timeline resumido por hitos de fecha y eventos de auditoria vinculados.

Cambios TASK-1920:
- Evaluacion backend de requisitos Marketplace por envio y empresa receptora.
- Todos los productos son obligatorios; sin compra completa no hay apertura,
  importacion ni uso.
- Precio vigente tomado de `MarketplaceProduct.precio` al consultar/revalidar.
- Compra validada por empresa receptora mediante pedidos `completed` de usuarios
  de esa empresa.
- Revalidacion actualiza requisitos y mueve el envio de
  `bloqueado_marketplace` a `listo_para_importar` si todo fue adquirido.
- Respuesta preparada para UI con `purchase_url`, `checkout_items`,
  `total_pending_price` y ayuda contextual compacta.
- Endpoints:
  `GET /api/v1/transferencias/shipments/{shipment_id}/marketplace-requirements`,
  `POST /api/v1/transferencias/shipments/{shipment_id}/marketplace-requirements/revalidate`.

Cambios TASK-1919:
- Adaptador de transferencia separado de venta/publicacion Marketplace.
- Preflight `dry-run` para Proyecto y Base de Trabajo.
- Snapshot con `contract_version=transfer-v1`, hash SHA-256 canonico y payload
  exportable en `transfer_shipment_items`.
- Proyecto exporta solo datos de proyecto, EDT y presupuestos con
  detalles/indirectos.
- Base de Trabajo exporta catalogo clasico completo: categorias,
  subcategorias, recursos, APUs y lineas APU.
- Exclusiones contractuales: cronogramas, Gantt, planificacion temporal,
  documentos y uploads.
- Deteccion de dependencias Marketplace por origen adquirido o flags de compra.
  Si existen, se exige confirmacion doble y el envio queda
  `bloqueado_marketplace`.
- Cancelacion permitida solo antes de apertura.
- Endpoints:
  `POST /api/v1/transferencias/preflight`,
  `POST /api/v1/transferencias/shipments`,
  `POST /api/v1/transferencias/shipments/{shipment_id}/cancel`.

Cambios TASK-1918:
- Servicio `app.services.transferencias` con generacion unica de codigos,
  saneamiento, resolucion segura y alta confirmada de destinatarios.
- Endpoints:
  `GET /api/v1/transferencias/my-code`,
  `POST /api/v1/transferencias/recipient-code/resolve`,
  `GET /api/v1/transferencias/recipients`,
  `POST /api/v1/transferencias/recipients`,
  `POST /api/v1/transferencias/admin/sanitize-codes`.
- Hook en `usuario_service` para generar codigo al crear o promocionar usuarios
  `administrador` / `superadministrador`.
- Script operativo no destructivo
  `backend/scripts/sanitize_transfer_admin_codes.py`.
- Resolucion de codigo sin exponer identidad del administrador propietario:
  solo empresa, nombre legal, alias y display preferente.
- Limite de 3 destinatarios fijos; soporte preparado para destinatarios
  adicionales mediante `transfer_extra_recipient_packs`.
- Anti-enumeracion y abuso: 3 fallos consecutivos pausan 5 minutos; 12 fallos
  en 24 horas bloquean 7 dias; auditoria en `transfer_audit_events`.

Cambios TASK-1917:
- Modelos backend `transfer_*` para codigos publicos, destinatarios, paquetes
  adicionales, envios, items, requisitos Marketplace, auditoria, resultados de
  importacion y referencias de origen.
- Contrato API `GET /api/v1/transferencias/contract` con version `transfer-v1`,
  estados aprobados, roles permitidos, licencias bloqueadas y garantias
  tecnicas de dry-run, snapshot hash, adaptador separado de venta Marketplace,
  compra completa e idempotencia.
- Migracion Alembic no destructiva
  `backend/alembic/versions/de1917a1b2c3_transferencias_foundation.py`,
  encadenada tras `de1912a1b2c3`, solo con tablas nuevas `transfer_*`.
- Test focal `backend/app/tests/test_transferencias_contract.py`.

Queda documentado fisicamente el plan rector de `Otros Servicios > Envios y
Transferencias` en `docs/Plan de Negocio/PLAN_ENVIOS_TRANSFERENCIAS.md`.

El plan define transferencia de Bases de Trabajo y Proyectos entre empresas,
solo para Administrador y Superadministrador, no disponible para
EXPRESS/prueba. Incluye destinatarios fijos, destinatarios adicionales por
paquetes Marketplace, codigo publico `XXX - XXX`, bandeja entrada/salida,
preflight, snapshot inmutable, dependencias Marketplace, importacion
idempotente, timeline/auditoria y semaforo de recepcion en header.

Adenda visual: la futura UI debe tomar la seccion `Proyectos` y
`Datos de Proyecto` como referencia principal de look & feel. No debe parecer
una vista SaaS ni un modulo ajeno; debe usar bandeja operativa inicial, toolbar
compacta, filtros segmentados, superficies soft, chips/semaforos sobrios,
modales/paneles tecnicos y componentes comunes del sistema clasico.

Adenda funcional: quedan documentadas las primeras decisiones cerradas. La
funcionalidad base solo queda para `STANDARD` y `PROFESSIONAL`; `EXPRESS`,
`TESTER`, `ACADEMIC` y `TRAINING` quedan bloqueadas. Los destinatarios son
empresas destino, validadas mediante codigo publico de un administrador de la
empresa destino. `Conecta` pasa a requerir adecuacion como producto Marketplace
de ampliacion: 3 empresas destino adicionales, 30 dias desde compra, acumulable
y precio inicial `24,99`. El envio queda fijado como uno a uno, un solo activo,
descripcion obligatoria precargada y cancelacion solo antes de apertura.

Adenda de contenido transferible: Proyecto solo transmite datos del proyecto,
EDT y presupuestos; no transmite cronogramas, Gantt, planificacion,
documentacion ni uploads. Base de Trabajo se transmite completa, igualmente sin
documentacion/uploads externos. Solo se permiten Proyectos aptos, completos y
exportables. Los Proyectos completos comprados u originados en Marketplace
pueden transmitirse con advertencia al emisor y obligacion de compra para el
receptor si no los posee.

Adenda Marketplace cerrada: `Conecta` es producto exclusivo de
`Envios y Transferencias`; cada compra agrega 3 empresas destino por 30 dias
desde fecha/hora exacta, con precio inicial `24,99 USD`. Cada compra es
independiente y sus destinatarios quedan asociados al paquete concreto. Todos
los productos Marketplace incluidos en un activo enviado son obligatorios para
la empresa receptora; sin compra completa no hay apertura, importacion ni uso.
El precio aplicable al receptor es el vigente de Marketplace al momento de su
compra.

Adenda Recepcion/Importacion: el receptor puede rechazar el envio con motivo y
el emisor debe ser informado. La importacion siempre crea copia nueva, sin
fusion con activos existentes, conserva referencia al envio/origen y deja
trazabilidad de pendiente, bloqueado, rechazado, listo, importado y resultado.
El activo importado queda inicialmente solo para administradores y
superadministradores hasta que se den permisos por las herramientas normales.

Adenda Estados/Bandeja: se confirman estados compartidos por emisor/receptor
con acciones por rol y se agrega `fallo_importacion` como contingencia tecnica
auditable. La bandeja debe tener selector/filtro de estado con colores,
busqueda omni por nombre legal, alias, descripcion y activo, y filtros de fecha
inicio/fin. Por defecto muestra desde un mes atras hasta hoy. El historico se
conserva siempre. Si existe alias de empresa, sustituye visualmente al nombre
legal en listados/tarjetas/etiquetas, conservando ambos valores para busqueda,
auditoria y detalle.

Adenda Semaforo header: para Administrador/Superadministrador debe mostrarse
siempre, con conteo total y conteo de nuevos, ejemplo `Comunicacion: 14` y
`Nuevos: 2`. La alerta debe ser visual y simple, tipo circulo/parpadeo o
equivalente sobrio. Debe refrescar cada 30 o 60 segundos mientras se opera y
no debe incluir desplegable complejo ni resumen avanzado en la primera
implementacion.

Adenda Caducidad: el envio caduca a los 60 dias. Si expira, solo se notifica
por canales normales del sistema; no puede reenviarse ni reactivarse desde el
historico. Para compartir el mismo activo de nuevo debe crearse un envio nuevo
desde el flujo normal, si licencia/destinatario lo permiten. El historico debe
indicar si fue importado y conservar siempre la trazabilidad completa.

Adenda UX Visual: no basta copiar el aspecto de `Proyectos`; deben reutilizarse
tambien componentes y funcionamiento existente cuando aplique. La bandeja debe
ser una lista compacta con informacion necesaria, toolbar con `Nuevo envio` y
`Refrescar`, y preflight en modal tecnico. Se acepta ayuda contextual
Marketplace compacta para bloqueos por productos obligatorios: debe explicar
que no se puede abrir/importar/usar hasta comprar todos, mostrar lista de
productos, estado adquirido/pendiente, precio vigente estimado, compra y
`Revalidar compras`, sin convertirse en manual ni pantalla comercial.

Adenda cierre final: no quedan decisiones funcionales abiertas dentro del
alcance actual. El baneo por abuso de codigos queda fijado en 12 intentos
fallidos en 24 horas por empresa emisora, con baneo de 7 dias. `Conecta` queda
como nombre comercial visible y `Envios y Transferencias` como
contexto/subtitulo cuando haga falta claridad.

Adenda optimizaciones: quedan incorporados como criterios obligatorios el
`dry-run` de preflight, `contract_version`, hash/huella de snapshot, adaptador
de transferencia separado de venta, timeline visible resumido, metricas
minimas, reintento controlado de `fallo_importacion`, E2E con empresa mockup,
guarda anti-regresion de licencias bloqueadas y checklist visual contra
`Proyectos`.

TASKs fisicas creadas para implementacion controlada: `TASK-1917` contrato
tecnico, `TASK-1918` codigos/destinatarios, `TASK-1919` preflight/snapshot,
`TASK-1920` requisitos Marketplace, `TASK-1921` bandeja API, `TASK-1922`
importacion idempotente, `TASK-1923` semaforo header, `TASK-1924` producto
`Conecta`, `TASK-1925` UI clasica y `TASK-1926` baseline enterprise.

La implementacion queda preparada para continuar por `TASK-1921`
bandeja API de entrada/salida.

Validacion ejecutada
- `py_compile` focal backend para servicio/schemas/router/tests Marketplace de
  transferencias.
- `pytest` focal `test_transferencias_contract.py`,
  `test_transferencias_recipients.py` y
  `test_transferencias_preflight_snapshot.py` OK (`15 passed`).
- `py_compile` focal backend para servicio/schemas/router/tests de preflight.
- `pytest` focal `test_transferencias_contract.py`,
  `test_transferencias_recipients.py` y
  `test_transferencias_preflight_snapshot.py` OK (`13 passed`).
- JSON documental principal OK.
- Smoke anti-BIM clasico OK.
- Baseline enterprise sin frontend OK.
- Guardas focales por `rg`: sin referencias BIM en codigo nuevo, sin
  `axiosConfig` ni `console.log` fuera de `frontend/src/api`.
- `py_compile` focal backend para servicio/schemas/router/usuario/tests/script
  de transferencias.
- `pytest` focal `test_transferencias_contract.py` y
  `test_transferencias_recipients.py` OK (`8 passed`).
- JSON documental principal OK.
- Smoke anti-BIM clasico OK.
- Baseline enterprise sin frontend OK.
- Guardas focales por `rg`: sin referencias BIM en codigo nuevo, sin
  `axiosConfig` ni `console.log` fuera de `frontend/src/api`.
- `py_compile` focal backend para modelos/schemas/router/migracion de
  transferencias.
- `pytest` focal `test_transferencias_contract.py` OK.
- JSON documental principal OK.
- Smoke anti-BIM clasico OK.
- Baseline enterprise sin frontend OK.
- Guardas focales por `rg`: sin referencias BIM en codigo nuevo, sin
  `axiosConfig` ni `console.log` fuera de `frontend/src/api`.
- Warnings conocidos: Pydantic BIM `model_name/model_id` y deprecations de
  dependencias de test.

Impacto
Documentacion de planificacion. Sin backend, frontend funcional, DB,
migraciones, auth/JWT, tenant, BIM, Docker/Coolify/CI-CD, EDT, presupuestos,
cronogramas ni datos runtime.

---

Fecha
2026-06-16

Motor IA utilizado
Codex

TASK cerrada
TASK-1915: cierre documental del plan SaaS email, alias y empresas.

Resultado actual
Quedan cerradas documentalmente `TASK-1911` a `TASK-1914`. El plan de alias de
empresa, email corporativo SaaS, soporte Gmail, URL publica editable, gestion
SaaS de empresas, filtro por estado, doble confirmacion de suspension y pulido
visual de `Empresas SaaS` no mantiene TASKs tecnicas abiertas.

La unica accion restante es operativa: cargar credenciales reales SMTP/Gmail
desde `Administracion Global > Email corporativo` cuando el superadministrador
disponga de ellas. Esa accion no reabre implementacion.

Validacion ejecutada
- Validacion documental de TASKs 1911-1915.
- `WORK_MODE_STATE.active_task` permanece en `null`.

Impacto
Documentacion de control. Sin backend, frontend funcional, DB, migraciones,
auth/JWT, tenant, BIM, Docker/Coolify/CI-CD, EDT, presupuestos, cronogramas ni
datos runtime.

---

Fecha
2026-06-15

Motor IA utilizado
Codex

TASK cerrada
TASK-1914: ajuste visual de toolbar en Empresas SaaS.

Resultado actual
`Administracion Global > Empresas SaaS` ya no muestra filtros, buscador y
actualizacion como bloques apilados de gran anchura. La cabecera usa una
toolbar compacta con buscador, filtros segmentados con contador por estado y
boton `Actualizar` integrado.

La logica de seguridad de `TASK-1913` permanece intacta: la vista sigue
viviendo solo en `/admin-global/empresas`, mantiene empresas pendientes de
validacion, filtro por estado y doble confirmacion al suspender.

Validacion ejecutada
- `node scripts/smoke-classic-saas-empresas-boundary.mjs` OK.
- `npm run build` OK, con warning conocido de chunks grandes Vite.
- `node scripts/smoke-classic-no-bim-contamination.mjs` OK.

Impacto
Frontend clasico SaaS y smoke focal. Sin backend, DB, auth/JWT, tenant, BIM,
Docker/Coolify/CI-CD, EDT, presupuestos ni cronogramas.

---

Fecha
2026-06-15

Motor IA utilizado
Codex

TASK cerrada
TASK-1913: aislamiento SaaS de gestion de empresas.

Resultado actual
La card `Empresas` de `Administracion Global` abre exclusivamente
`/admin-global/empresas`. `Settings` ya no renderiza la rama de gestion SaaS de
empresas y cualquier acceso directo a `/settings?tab=empresas` redirige a
`/admin-global/empresas`.

La vista SaaS de empresas lista empresas activas, suspendidas y pendientes de
validacion. El backend agrega `registration_status` en `EmpresaResponse`,
derivado de tokens de registro pendientes, para mostrar `Pendiente validacion`
cuando una empresa aun no valido email.

Validacion ejecutada
- `py_compile` focal backend OK.
- `pytest app/tests/test_public_registration_verification.py -q` OK.
- `node scripts/smoke-classic-saas-empresas-boundary.mjs` OK.
- `npm run build` OK.
- `validate_enterprise_baseline.py --include-frontend` OK.

Impacto
Frontend/backend clasico de administracion SaaS. Sin BIM, Docker/Coolify/CI-CD,
EDT, presupuestos, cronogramas ni datos runtime.

---

Fecha
2026-06-15

Motor IA utilizado
Codex

TASK cerrada
TASK-1911/TASK-1912: plan e implementacion de alias de empresa y email
corporativo SaaS clasico.

Resultado actual
GiProy Clasico soporta alias opcional de empresa. El alias se captura en el
registro publico y en alta/edicion de empresa; cuando existe, se usa como nombre
visible en puntos clasicos tocados sin sustituir el nombre legal almacenado.

El menu SaaS `Administracion Global` incorpora una card `Email corporativo` y
una pagina dedicada `/admin-global/email-corporativo`, exclusiva para
superadministrador. Permite editar backend de email, remitente, URL publica de
activacion, servidor SMTP, puerto, usuario, password, TLS/SSL, aplicar preset
Gmail y enviar un email de prueba. La URL publica inicial es
`https://giproy-network.excompc.dpdns.org`, pero queda persistida y editable.
`Settings` queda sin gestion de email corporativo SaaS; cualquier email de
empresa que se agregue alli pertenece a otro alcance.
QA visual detecto un enlace cruzado: la card `Email corporativo` llevaba a
`Settings`. Queda corregido: `Superadministradores` conserva
`/settings?tab=superadmins` y `Email corporativo` apunta a
`/admin-global/email-corporativo`.
La pagina `Email corporativo` incluye boton `Ayuda` con configuraciones
soportadas: Gmail 587/STARTTLS, Gmail 465/SSL, SMTP generico y URL publica de
activacion.
La pantalla detecta automaticamente cuentas `@gmail.com` y `@googlemail.com`
en remitente o usuario SMTP y completa backend `smtp`, host `smtp.gmail.com`,
puerto `587`, STARTTLS activo y SSL directo desactivado. La password no se
autocompleta: para Gmail debe usarse contrasena de aplicacion con verificacion
en 2 pasos. La prueba Gmail se bloquea con aviso claro si no existe password
nueva ni password SMTP previamente configurada, y la ayuda enlaza a la
documentacion oficial de Google para contrasenas de aplicacion. El backend
traduce el error Gmail `535 5.7.8 Username and Password not accepted` a guia
operativa para revisar usuario completo, verificacion en 2 pasos y contrasena
de aplicacion. Al guardar password Gmail, el backend elimina espacios del codigo
de aplicacion pegado.

La configuracion efectiva de email se resuelve desde `SystemConfig` con fallback
a variables de entorno. `EMAIL_BACKEND=mock` ya no se considera entrega real
para el registro pendiente, por lo que el alta publica requiere SMTP valido para
enviar la confirmacion.
`email-validator==2.2.0` queda declarado en `backend/requirements.txt` e
instalado localmente para evitar validacion degradada de campos email.

Validacion ejecutada
- `py_compile` backend focal OK.
- `app.main` import OK y OpenAPI generado OK con `email-validator` instalado.
- `pytest app/tests/test_public_registration_verification.py
  app/tests/test_admin_config_email_settings.py app/tests/test_email_utils.py
  -q` OK (`12 passed`).
- `npm run build` OK, warning conocido de chunks grandes Vite.
- `node scripts/smoke-classic-no-bim-contamination.mjs` OK.
- `node scripts/smoke-classic-api-boundaries.mjs` OK.
- `node scripts/smoke-classic-admin-config-email-boundary.mjs` OK e integrado
  en `validate_enterprise_baseline.py --include-frontend`.
- `node scripts/smoke-classic-company-alias-display.mjs` OK e integrado en
  `validate_enterprise_baseline.py --include-frontend`.
- Guardas frontend OK: sin imports directos de `axiosConfig` fuera de
  `frontend/src/api` y sin `console.log` productivos en `frontend/src` fuera de
  `frontend/src/api`.
- `python tools/ai_tools/validate_enterprise_baseline.py --include-frontend`
  OK, con warnings conocidos de Pydantic BIM `model_name/model_id` y chunks
  grandes Vite.
- PostgreSQL local: `alembic upgrade de1912a1b2c3` aplicado; `empresas.alias`
  e `ix_empresas_alias` existen fisicamente y `alembic current` incluye
  `de1912a1b2c3`.
- Suite backend completo: `pytest app/tests -q` deja `440 passed` y `7 failed`
  en cronogramas/base de trabajo ajenos al plan activo.

Impacto
Backend comun clasico, registro publico, empresas, configuracion SaaS y UI
clasica de Settings/Login/AppLayout. Sin cambios en auth/JWT, tenant,
permisos, EDT, presupuestos, cronogramas, BIM, Docker/Coolify/CI-CD ni datos
runtime.

Pendiente operativo
Configurar credenciales reales SMTP desde
`Administracion Global > Email corporativo`. Para Gmail usar cuenta Gmail,
contrasena de aplicacion, host `smtp.gmail.com`, puerto `587`, STARTTLS activo
y SSL desactivado.

Diagnostico SMTP local
La lectura de configuracion efectiva muestra `EMAIL_BACKEND=mock`, sin
`SMTP_HOST` ni `SMTP_USERNAME`. En DB ya esta persistido
`FRONTEND_PUBLIC_URL=https://giproy-network.excompc.dpdns.org`.
El envio real externo queda pendiente de cargar credenciales SMTP/Gmail; el
adaptador SMTP queda cubierto por prueba automatizada con STARTTLS, login y
envio simulado.

---

Fecha
2026-06-15

Motor IA utilizado
Claude Code

TASK cerrada
TASK-1870: cierre formal. WORK_MODE_STATE sanitizado, active_task=null. Sin cambios productivos.

Validacion
Sin cambios productivos. TASK-1870 ya estaba completada desde 2026-06-11 (HANDOFF anterior).
Solo se actualizo WORK_MODE_STATE.json con generated_at actual y active_task=null.

Impacto
WORK_MODE_STATE.json actualizado. Sin cambios en auth/JWT, tenant, EDT, presupuestos, cronogramas, BIM, Docker/Coolify/CI-CD.

---

Fecha
2026-06-11

Motor IA utilizado
Claude Code

TASK cerrada
Sistema de validacion RUC Ecuador en registro publico con configuracion SaaS.

Resultado actual
El modal de registro publico valida RUC ecuatoriano: estructura (13 digitos, provincia
01-24, digito verificador modulo 10, sufijo 001), feedback visual al perder foco
(borde rojo, fondo rojo, mensaje), consulta a EcuadorAPI para auto-llenar nombres/
apellidos/nombre_completo. Se bloquea la creacion de empresa si el pais es Ecuador
y el RUC no esta validado (tanto en frontend como backend).

Se creo modelo SystemConfig (tabla system_config) con endpoints GET/PUT /admin-config
para superadmins. UI de configuracion en Settings > Ajuste SaaS con key enmascarada y
modal de edicion. La key por defecto se seedea en DB desde main.py.

El modal de registro ademas detecta el pais por geolocalizacion IP del cliente via
ipapi.co, y auto-selecciona el pais.

Validacion ejecutada
- `py_compile` backend OK (config.py, main.py, auth.py, usuario.py)
- Tests de auth: 10 passed
- Sin referencias a archivos externos (EcuadorAPi.txt eliminado)

Impacto
Backend: nuevo modelo SystemConfig, endpoint publico GET /register/validar-ruc,
endpoints admin-config, validacion RUC en POST /register.
Frontend: rucValidator.js, adminConfig.js, config UI en Settings, geolocalizacion en
RegisterModal.
Sin cambios en auth/JWT, tenant, EDT, presupuestos, cronogramas, BIM, Docker/Coolify/CI-CD.

---

Fecha
2026-06-10

Motor IA utilizado
Codex

TASK cerrada
`TASK-1909`: validacion visual de contrasenas en registro publico.

Resultado actual
El modal clasico de crear cuenta permite ver/ocultar `Contraseña` y
`Confirmar Contraseña`. Al salir de cualquiera de los dos campos, si ambos
tienen datos y no coinciden, se muestra aviso inline y resaltado visual.

Validacion ejecutada
- `npm run build` OK, warning conocido de chunks grandes Vite.
- `node scripts/smoke-classic-no-bim-contamination.mjs` OK.
- `node scripts/smoke-classic-api-boundaries.mjs` OK.
- Guarda focal: sin logs productivos en archivos frontend tocados; `axiosConfig`
  solo aparece en `frontend/src/api/publicAuth.js`, dentro de la capa permitida.

Impacto
Frontend clasico de registro publico. Sin backend, DB, auth/JWT, tenant, EDT,
presupuestos, cronogramas, BIM, Docker/Coolify/CI/CD ni datos runtime.

---

Fecha
2026-06-10

Motor IA utilizado
Codex

TASK cerrada
`TASK-1908`: validacion email obligatoria en registro publico.

Resultado actual
El registro publico clasico vuelve a requerir validacion de email antes de
activar empresa y administrador inicial. Una empresa pendiente no validada en
5 horas debe eliminarse completamente, incluyendo usuario, token y RUC
asociado.

Implementacion realizada
`POST /api/v1/register` deja de devolver token de sesion. Ahora crea
`Empresa` y `Usuario` administrador como inactivos, persiste el RUC/email en la
empresa y emite un `RegistrationVerificationToken` con caducidad de 5 horas.
El email se envia mediante `send_registration_verification_email`, construido
sobre `send_transactional_email`. `GET /api/v1/register/verify?token=...`
activa empresa y usuario si el token sigue vigente.

El registro bloquea una segunda empresa para el mismo RUC de administrador con
mensaje controlado. Antes de validar duplicados, purga pendientes caducados del
mismo email/RUC para permitir reintentos limpios despues de las 5 horas.
Se agrega la migracion no destructiva
`de1908a1b2c3_registration_verification_tokens.py` y el runner
`backend/scripts/cleanup_expired_registration_verifications.py` para programar
la eliminacion completa de pendientes vencidos.
En PostgreSQL local `giproy_erp` la tabla `registration_verification_tokens`
queda creada de forma no destructiva para poder probar el flujo real. A
peticion expresa de QA, se elimina la empresa historica
`giproyecuador@gmail.com` (`empresa_id=7`) junto con su usuario administrador y
asignacion de licencia, dejando el email libre para repetir el alta.

Frontend clasico: `RegisterModal` muestra la instruccion de validar email y ya
no auto-inicia sesion. Se agrega pagina publica `/verify-registration`.

Validacion ejecutada
- `.\.venv\Scripts\python.exe -m py_compile backend\app\api\endpoints\auth.py backend\app\models\registration_verification.py backend\app\utils\email_utils.py backend\app\schemas\usuario.py backend\scripts\cleanup_expired_registration_verifications.py backend\alembic\versions\de1908a1b2c3_registration_verification_tokens.py` OK.
- `..\.venv\Scripts\python.exe -m pytest app\tests\test_public_registration_verification.py -q` OK: 3 passed.
- Guardas focales de archivos frontend tocados: sin `axiosConfig` fuera de
  `frontend/src/api` y sin `console.log/error/warn`.

Impacto
Backend/frontend clasicos de autenticacion publica. Sin cambios en login de
usuarios ya activos, JWT, tenant operativo, EDT, presupuestos, cronogramas,
BIM, Docker/Coolify/CI/CD ni datos runtime.

Pendiente
- Programar externamente
  `backend/scripts/cleanup_expired_registration_verifications.py`.
- Configurar SMTP real fuera de `EMAIL_BACKEND=mock`.
- Saneamiento manual controlado de altas historicas ya creadas antes de la
  correccion, solo si se autoriza.

---

Fecha
2026-06-09

Motor IA utilizado
Codex

TASK cerrada
`TASK-1898/TASK-1899`: plan y fundacion de avisos de ciclo de vida de licencias.

Resultado actual
Queda documentado el plan SaaS de licencias para bienvenida, aviso 7 dias,
solo lectura, recordatorios, cierre, backup, retirada operativa y recuperacion
superadministrador. Se crea la cadena `TASK-1898` a `TASK-1906`.

Implementacion realizada
Se agrega una cola/auditoria no destructiva `license_notification_events`
mediante modelo `LicenseNotificationEvent`, migracion Alembic
`de1899f0a1b2_license_notification_events.py` y servicio
`license_notifications`. Marketplace registra `purchase_formalized` para
cualquier compra completada por PayPal/confirmacion online, transferencia
validada o checkout clasico. Cuando `assign_license_to_company` crea una
licencia comercial pagada/confirmada, registra ademas eventos pendientes
`license_welcome` para administradores de empresa, con deduplicacion por
licencia/usuario/canal. Para productos con `product_meta.duration_months` se
agrega fundacion `purchase_lifecycle_ended` cuando la compra llega a su fecha
de fin. Tambien registra auditoria `license_welcome_notifications_queued` en
`license_events`.
Los payloads transaccionales quedan optimizados para cliente con `title`,
`subject`, `body`, `severity`, `action_label` y datos estructurados.
La API `license-notifications` permite listar avisos internos pendientes del
usuario, marcarlos como leidos y despachar emails pendientes en modo mock
superadministrador hasta conectar SMTP real.
`AppLayout` consume esos avisos internos en el header principal. Los avisos de
una sola vez se marcan leidos al cerrar; los recurrentes (`display_once=false`)
se pueden cerrar durante la sesion sin perder la posibilidad de reaparecer en
futuros logins.
`email_utils` incorpora `send_transactional_email` con backend `mock` por
defecto y `smtp` configurable por entorno. El dispatcher registra evidencia
`email_dispatch` y marca `sent` o `failed` segun el resultado.
El despacho manual, housekeeping y runner soportan `retry_failed` para
recuperar eventos `failed` despues de corregir SMTP, sin mezclar esos eventos
en el despacho normal por defecto.
Tambien expone housekeeping superadministrador para fin de compra con vigencia:
detecta productos comprados vencidos, genera `purchase_lifecycle_ended` y puede
despachar email mock opcional.
Se agrega ademas `/api/v1/license-notifications/housekeeping/run`, endpoint
integral superadministrador para probar desde API el barrido de fin de compra,
caducidad de licencia, solo lectura, ultimo dia de disponibilidad y despacho
opcional.
El housekeeping integral ejecuta primero el housekeeping de licencias para que
una licencia activa ya vencida pase a `expired/read_only` antes de colar avisos
`license_readonly`. En PostgreSQL local `giproy_erp` queda creada de forma no
destructiva la tabla `license_notification_events`; las simulaciones `dry-run`
con `2027-03-05` y `2027-03-13` validan respectivamente
`license_expiring_soon` y `license_readonly` sin persistir eventos.
Se agrega `backend/scripts/license_notification_housekeeping.py` como runner
operativo para invocacion externa/programada: detecta fin de compra con
vigencia, caducidad de licencia, solo lectura y ultimo dia de disponibilidad;
puede despachar emails pendientes de compra/licencia y soporta
`--dry-run`, `--empresa-id`, `--today`, `--dispatch-email`, `--dispatch-limit`
y `--notification-type`.

Validacion ejecutada
- `.\.venv\Scripts\python.exe -m py_compile ...` OK.
- `.\.venv\Scripts\python.exe -m py_compile backend\scripts\license_notification_housekeeping.py` OK.
- `..\.venv\Scripts\python.exe -m pytest app\tests\test_license_lifecycle_notifications.py -q` OK: 13 passed.
- `..\.venv\Scripts\python.exe -m pytest app\tests\test_marketplace_saas_policy_e2e.py -q` OK: 1 passed, warnings conocidos.
- `npm run build` OK, warning conocido de chunks grandes Vite.
- `cmd /c node frontend\scripts\smoke-classic-no-bim-contamination.mjs` OK.
- `cmd /c node frontend\scripts\smoke-classic-api-boundaries.mjs` OK.
- Guardas textuales de `axiosConfig` directo fuera de `frontend/src/api` y
  `console.log` productivo fuera de API: OK, sin resultados.

Impacto
Backend clasico de licencias, Marketplace y documentacion. Se agrega API nueva
`/api/v1/license-notifications` sin modificar contratos existentes. Sin frontend productivo, sin
auth/JWT/tenant, sin cambios destructivos en
PostgreSQL, sin EDT, presupuestos, cronogramas, BIM, Docker/Coolify/CI/CD ni
archivos runtime. La configuracion SMTP real, la UI SaaS de recuperacion,
backup/cuarentena y purga fisica quedan separados en TASKs pendientes. El aviso
de fin de compra y caducidad de licencia ya tiene fundacion backend, runner y
UI interna basica; queda pendiente scheduler real y desactivacion del derecho
comprado cuando aplique.

Rollback
Revertir `backend/app/models/license_notification_event.py`,
`backend/scripts/license_notification_housekeeping.py`,
`backend/app/services/license_notifications.py`,
`backend/app/utils/email_utils.py`,
`frontend/src/api/licenseNotifications.js`,
`backend/alembic/versions/de1899f0a1b2_license_notification_events.py`,
los cambios en `backend/app/models/__init__.py`,
`backend/app/services/license.py`,
`backend/app/services/marketplace_checkout.py`,
`backend/app/api/endpoints/license_notifications.py`,
`backend/app/schemas/license_notification.py`,
el montaje en `backend/app/api/api.py`,
`backend/app/tests/test_license_lifecycle_notifications.py`,
`backend/app/tests/test_marketplace_saas_policy_e2e.py`,
`docs/architecture/LICENSE_LIFECYCLE_NOTIFICATION_PLAN.md`,
`docs/tasks/TASK-1898.md` a `TASK-1907.md`, `docs/CHANGELOG.md` y
`docs/HANDOFF.md`.

Fecha
2026-06-09

Motor IA utilizado
Codex

TASK cerrada
`TASK-1897`: licencia activa visible en header principal.

Resultado actual
El header principal clasico ahora muestra el contexto en el orden solicitado:
`Contexto Operativo -> Empresa -> Licencia activa`. La lectura usa
`licenseInfo` ya provisto por `AuthContext`, muestra `Licencia activa: <plan>`
y, en escritorio, agrega el estado compacto con los helpers existentes de
`licenseStatusUi`.

Validacion ejecutada
- `npm run build` OK, con warning conocido de chunks grandes Vite.
- `cmd /c node frontend\scripts\smoke-classic-no-bim-contamination.mjs` OK.
- `cmd /c node frontend\scripts\smoke-classic-api-boundaries.mjs` OK.
- Guardas textuales de `axiosConfig` directo fuera de `frontend/src/api` y
  `console.log` productivo fuera de API: OK, sin resultados.

Impacto
Frontend clasico en `AppLayout`. Sin backend, DB, migraciones, auth/JWT/tenant,
contratos API, EDT, presupuestos, cronogramas, BIM, Docker/Coolify/CI/CD ni
archivos runtime.

Rollback
Revertir `frontend/src/layouts/AppLayout.jsx`, `docs/tasks/TASK-1897.md`,
`docs/CHANGELOG.md` y `docs/HANDOFF.md`.

Fecha
2026-06-09

Motor IA utilizado
Codex

TASK cerrada
`TASK-1896`: plantilla Modo BIM alineada al baseline clasico.

Resultado actual
`docs/plantillas prompt/Prompt Modo BIM.txt` queda actualizado para operar con
la misma estructura de gobierno del Modo Clasico, pero ajustada al carril BIM.
La plantilla incorpora baseline `TASK-1807`, Fase 6 solo documental, pausa
Docker/Coolify/CI/CD, reglas de no reapertura sin TASK explicita, backend unico
con dominio BIM aislado, frontend BIM desacoplado, feature flags/allowlists,
rollback limpio, estructura TASK BIM propia independiente del carril clasico y
validacion obligatoria de GiProy Clasico con BIM apagado. Se crea el carril
documental paralelo `docs/tasks/bim` con `BIM_TASK_INDEX.md`, `README.md` y
`BIM-TASK-0000` a `BIM-TASK-0014`; `BIM_INDEX`, `BIM_EXECUTION_ROADMAP`,
`BIM_MASTER_PLAN`, `BIM_PARALLEL_IMPLEMENTATION_STRATEGY` y
`BIM_VALIDATION_PLAN` quedan alineados a esa estructura.

Validacion ejecutada
- Lectura comparativa de `Prompt Modo Clasico.txt` y `Prompt Modo BIM.txt`.
- Revision de documentos maestros BIM y busqueda textual de referencias
  `TASK-054`/`TASK-055`, dejando solo menciones legacy.
- Cambio documental acotado a plantilla BIM, gobierno TASK BIM paralelo,
  arquitectura documental BIM, TASK, CHANGELOG y HANDOFF.

Impacto
Documentacion operativa de sesiones IA para el carril BIM. Sin backend,
frontend productivo, DB, migraciones, auth/JWT/tenant, EDT, presupuestos,
cronogramas, BIM runtime, Docker/Coolify/CI/CD ni archivos runtime.

Rollback
Revertir `docs/plantillas prompt/Prompt Modo BIM.txt`, `docs/tasks/bim`,
los ajustes en `docs/architecture/BIM_*.md`, `docs/tasks/TASK-1896.md`,
`docs/CHANGELOG.md` y `docs/HANDOFF.md`.

Fecha
2026-06-09

Motor IA utilizado
Codex

TASK cerrada
`TASK-1895`: adecuacion del registro publico de empresa administradora.

Resultado actual
El registro publico queda alineado con el contrato real de negocio: crea una
empresa nueva y el usuario administrador inicial. La UI ya no muestra `Rol de
Colaborador`, el label de email pasa a `Email (login)`, credenciales quedan en
flujo compacto de email en una fila y contrasena/confirmacion debajo, y la
ubicacion se ordena como `Pais -> Provincia -> Canton -> Ciudad` reutilizando
`maestrosApi` y `SearchableSelect`, con `Ecuador` preseleccionado por defecto.
El formulario usa `MotionScrollbar` en vez del scrollbar generico y exige todos
los datos visibles antes de enviar excepto `alias`, con advertencias mediante
`appAlert`.

Validacion ejecutada
- `npm run build` OK, con warning conocido de chunks grandes Vite.
- `cmd /c node frontend\scripts\smoke-classic-no-bim-contamination.mjs` OK.
- `cmd /c node frontend\scripts\smoke-classic-api-boundaries.mjs` OK.

Impacto
Frontend clasico de registro publico y variante acotada de
`PersonnelFormFields`. Sin backend, DB, migraciones, auth/JWT/tenant, EDT,
presupuestos, cronogramas, BIM, Docker/Coolify/CI/CD ni archivos runtime.

Rollback
Revertir `frontend/src/components/RegisterModal.jsx`,
`frontend/src/components/PersonnelFormFields.jsx`, `docs/tasks/TASK-1895.md`,
`docs/CHANGELOG.md` y `docs/HANDOFF.md`.

Fecha
2026-06-09

Motor IA utilizado
Codex

TASK cerrada
`TASK-1894`: politica global de formas de pago comerciales.

Resultado actual
Las formas de pago de Marketplace quedan tratadas como metodos comerciales
globales para toda compra disponible del checkout clasico, incluyendo productos
publicos, licencias base, packs SaaS, modulos y productos sistema vendibles. El
backend ahora impide crear `checkout_drafts` con metodos inexistentes,
inactivos o incompletos, y transferencia bancaria se revalida tambien al
reportar comprobante para evitar drafts antiguos si el metodo se desactiva.
La base local queda con `bank_transfer` activo y `production_ready`; PayPhone y
PayPal permanecen registrados pero inactivos/incompletos hasta configurar
credenciales.

Validacion ejecutada
- `py_compile` sobre `marketplace.py`, `marketplace_checkout.py` y
  `test_marketplace_saas_policy_e2e.py` OK.
- `pytest app\tests\test_marketplace_saas_policy_e2e.py -q` OK: 1 passed.
- `cmd /c node frontend\scripts\smoke-classic-no-bim-contamination.mjs` OK.
- `.\.venv\Scripts\python.exe tools\ai_tools\validate_enterprise_baseline.py --include-frontend` OK.
- Consulta local de `marketplace_payment_methods`: `bank_transfer=True/production_ready/manual`, `payphone=False/incomplete/sandbox`, `paypal=False/incomplete/sandbox`.

Warnings conocidos no bloqueantes: Pydantic BIM `model_name/model_id`,
deprecations legacy/TestClient/SQLAlchemy y chunks grandes Vite.

Impacto
Backend clasico Marketplace/SaaS y configuracion local de metodo de pago.
Sin migraciones nuevas, sin cambios destructivos, sin auth/JWT/tenant, sin EDT,
presupuestos, cronogramas, BIM, Docker/Coolify/CI/CD ni archivos runtime de
uploads/logs/dumps/backups.

Rollback
Revertir `backend/app/services/marketplace.py`,
`backend/app/services/marketplace_checkout.py`,
`backend/app/tests/test_marketplace_saas_policy_e2e.py`,
`docs/tasks/TASK-1894.md`, `docs/CHANGELOG.md`, `docs/HANDOFF.md` y la
actualizacion del plan de negocio. En datos locales, poner
`marketplace_payment_methods.is_active=false` para `bank_transfer` si se quiere
desactivar el metodo.

Fecha
2026-06-08

Motor IA utilizado
Codex

TASK cerrada
`TASK-1893`: Equipo Slice 2 - MVP operativo de cupos, asignacion EDT, locks y propuestas.

Resultado actual
Equipo avanza de MVP anti-fuga a producto SaaS operativo MVP. Se agregan tablas
nuevas no destructivas para asientos, asignaciones EDT, locks y propuestas; el
servicio `saas_equipo_service` resuelve cupos desde capacidades comerciales y
`PACK_EQUIPO`, asigna/libera asientos, sincroniza permisos EDT con
`ProyectoAsignacion`, revoca alcance, gestiona locks y permite propuestas con
revision admin. Las propuestas aprobadas aplican solo campos seguros de linea de
presupuesto. Se expone `/api/v1/equipo` con contexto y lectura operacional. En
`SaaS / Superadministrador` ya se puede ver Equipo por empresa, crear asignacion
colaborador -> proyecto -> EDT, revocar alcance, liberar locks y aprobar o
rechazar propuestas. En `Presupuesto` se agrega MVP de uso diario para crear
locks de linea y propuestas de cantidad via `equipoApi`/`appPrompt`, sin
escritura directa del presupuesto.

Validacion ejecutada
- `python -m py_compile` sobre modelos, servicio, schemas, endpoint, router,
  tests y migracion Equipo OK.
- `$env:PYTHONPATH='.'; pytest app/tests/test_saas_equipo_endpoints.py -q` OK: 1 passed.
- `$env:PYTHONPATH='.'; pytest app/tests/test_saas_equipo_endpoints.py app/tests/test_equipo_edt_mvp.py app/tests/test_marketplace_saas_policy_e2e.py -q` OK: 3 passed.
- `npm run build` OK.
- `node frontend/scripts/smoke-classic-no-bim-contamination.mjs` OK.
- `node frontend/scripts/smoke-classic-equipo-api-boundary.mjs` OK.
- `node frontend/scripts/smoke-classic-presupuesto-api-boundary.mjs` OK.
- `.\.venv\Scripts\python.exe tools\ai_tools\validate_enterprise_baseline.py --include-frontend` OK.
- Guarda textual de `axiosConfig` directo y `console.log` productivo fuera de
  `frontend/src/api`: OK, sin resultados.

Warnings conocidos no bloqueantes: Pydantic legacy/deprecations, SQLAlchemy
legacy en tests existentes y chunks grandes Vite.

Impacto
Backend clasico Equipo, migracion no destructiva, cliente API clasico y
visibilidad en `SaaS / Superadministrador`. Sin BIM, sin Docker/Coolify/CI/CD,
sin auth/JWT nuevo, sin datos runtime reales y sin tocar cronogramas/reporting.

Pendiente siguiente
El goal Equipo queda cubierto como MVP operativo. Queda fuera de este MVP la
extension a cronogramas/reporting y una bandeja local por empresa distinta de
SaaS/Superadministrador, ambas solo bajo TASK explicita y guardas equivalentes.

Rollback
Revertir `backend/app/models/saas_equipo.py`,
`backend/app/services/saas_equipo.py`, `backend/app/schemas/saas_equipo.py`,
`backend/app/api/endpoints/equipo.py`, montaje `/equipo` en
`backend/app/api/api.py`, migracion `cd1893e4f5a6_saas_equipo_collaboration.py`,
`backend/app/tests/test_saas_equipo_endpoints.py`, `frontend/src/api/equipo.js`,
`frontend/src/pages/AdminGlobalLicencias.jsx`,
`frontend/scripts/smoke-classic-equipo-api-boundary.mjs` y documentacion
asociada.

Fecha
2026-06-08

Motor IA utilizado
Codex

TASK cerrada
`TASK-1892`: MVP Equipo Slice 1 - perimetro EDT anti-fuga.

Resultado actual
Se implementa el primer slice seguro de `Equipo colaborativo por EDT` en modo
clasico y read-only para colaboradores. `GET /api/v1/edt/project/{proyecto_id}`
usa `ProyectoAsignacion` para usuarios no administradores: sin asignacion
directa devuelve `403`; con asignacion EDT restringida devuelve arbol podado a
la rama asignada, descendientes y contexto ancestro minimo; administradores y
superadministradores conservan vista completa. Las mutaciones EDT quedan
reservadas a administradores/superadministradores durante el MVP.

Validacion ejecutada
- `python -m py_compile backend/app/api/endpoints/edt.py backend/app/tests/test_equipo_edt_mvp.py` OK.
- `$env:PYTHONPATH='.'; pytest app/tests/test_equipo_edt_mvp.py -q` OK: 1 passed.
- `$env:PYTHONPATH='.'; pytest app/tests/test_equipo_edt_mvp.py app/tests/test_marketplace_saas_policy_e2e.py -q` OK: 2 passed.
- `node frontend/scripts/smoke-classic-no-bim-contamination.mjs` OK.
- `.\.venv\Scripts\python.exe tools\ai_tools\validate_enterprise_baseline.py --include-frontend` OK.

Warnings conocidos no bloqueantes: Pydantic BIM `model_name/model_id`,
deprecations legacy/TestClient y chunks grandes Vite.

Impacto
Backend clasico EDT y prueba focal con empresa mockup. Sin Marketplace nuevo,
sin compra/entrega `PACK_EQUIPO`, sin frontend, sin migraciones, sin auth/JWT
nuevo, sin locks/aprobacion, sin BIM, Docker/Coolify/CI/CD ni datos runtime.

Pendiente siguiente
Ejecutar validaciones enterprise ampliadas y, en TASK futuro, implementar la
entrega comercial `PACK_EQUIPO` separada de los permisos operativos por EDT.

Rollback
Revertir `backend/app/api/endpoints/edt.py`,
`backend/app/tests/test_equipo_edt_mvp.py`, `docs/tasks/TASK-1892.md`,
`docs/tasks/TASK-1884.md`, `docs/CHANGELOG.md`, `docs/HANDOFF.md` y la
actualizacion del plan de negocio.

Fecha
2026-06-08

Motor IA utilizado
Codex

TASK cerrada
`TASK-1891`: certificacion end-to-end Marketplace SaaS con empresa mockup.

Resultado actual
El plan de nuevas politicas de negocio queda certificado en aplicacion clasica
con empresa mockup transaccional. La prueba E2E usa rutas reales `/api/v1`:
catalogo Marketplace, checkout draft, transferencia bancaria, confirmacion
manual de superadministrador, entrega de licencia base como `empresa_licencia`,
entrega de Pack Conecta como `saas_right`, lectura de licencia/productos SaaS
por empresa y operacion de cupos Conecta. Se confirma que los productos SaaS
administrados no son editables por administradores compradores y si por
superadministradores.

Correccion derivada
La certificacion detecto que una edicion parcial superadministradora podia
perder metadata comercial de productos SaaS (`delivery_kind`,
`commercial_code`). Se ajusto `backend/app/services/marketplace.py` para
preservar metadata existente/nueva durante normalizacion, evitando que una
edicion de precio deje de computar derechos SaaS comprados.

Validacion ejecutada
- `..\.venv\Scripts\python.exe -m pytest app\tests\test_marketplace_saas_policy_e2e.py -q` OK: 1 passed.
- `..\.venv\Scripts\python.exe -m py_compile app\services\marketplace.py app\tests\test_marketplace_saas_policy_e2e.py app\tests\test_marketplace_bootstrap_contract.py app\tests\test_license_service_special_flags.py app\tests\test_saas_conecta_endpoints.py` OK.
- `..\.venv\Scripts\python.exe -m pytest app\tests\test_marketplace_saas_policy_e2e.py app\tests\test_marketplace_bootstrap_contract.py app\tests\test_license_service_special_flags.py app\tests\test_saas_conecta_service.py app\tests\test_saas_conecta_endpoints.py -q` OK: 39 passed.
- `npm run build` OK, con warning conocido de chunks grandes Vite.
- Smokes frontend OK: frontera API clasica, Marketplace Admin, Conecta,
  anti-BIM y tenant superadmin.
- Guarda textual de `axiosConfig` directo y `console.log` productivo fuera de
  `frontend/src/api`: OK, sin resultados.
- `.\.venv\Scripts\python.exe tools\ai_tools\validate_enterprise_baseline.py --include-frontend` OK.

Warnings conocidos no bloqueantes: Pydantic BIM `model_name/model_id`,
deprecations legacy/TestClient y chunks grandes Vite.

Impacto
Backend clasico Marketplace/SaaS y cobertura E2E. Sin migraciones nuevas, sin
auth/JWT/tenant nuevo, sin EDT, presupuestos, cronogramas funcionales, BIM,
Docker/Coolify/CI/CD ni datos runtime reales.

Pendiente siguiente
El plan comercial SaaS queda cerrado al 100% para el alcance implementado. Los
pendientes futuros son fases separadas: `Equipo` colaborativo por EDT,
alertas/recordatorios/KPIs avanzados y cualquier despliegue Docker/Coolify solo
bajo solicitud explicita.

Rollback
Revertir `backend/app/services/marketplace.py`,
`backend/app/tests/test_marketplace_saas_policy_e2e.py`,
`docs/tasks/TASK-1891.md`, `docs/CHANGELOG.md`, `docs/HANDOFF.md` y la
actualizacion del plan de negocio.

Fecha
2026-06-08

Motor IA utilizado
Codex

TASK cerrada
`TASK-1890`: auditoria y KPIs Conecta admin.

Resultado actual
`Conecta` ya tiene resumen administrativo clasico en `GET /api/v1/conecta/admin/summary`, protegido para `superadministrador`. El endpoint informa cupos contratados/usados/disponibles, empresas habilitadas, slots activos, liberados, bloqueados por regla de 30 dias y liberaciones excepcionales. `SaaS / Superadministrador` consume `conectaApi.getAdminSummary()` y muestra KPI global Conecta. Se mantiene auditoria en `LicenseEvent` y no hay housekeeping destructivo.

Validacion ejecutada
- `.\.venv\Scripts\python.exe -m py_compile backend\app\api\endpoints\conecta.py backend\app\schemas\saas_conecta.py backend\app\tests\test_saas_conecta_endpoints.py` OK.
- `..\.venv\Scripts\python.exe -m pytest app\tests\test_saas_conecta_service.py app\tests\test_saas_conecta_endpoints.py -q` OK: 12 passed.
- `node scripts\smoke-classic-conecta-api-boundary.mjs` OK.
- `node scripts\smoke-classic-no-bim-contamination.mjs` OK.
- `npm run build` OK, con warning conocido de chunks grandes Vite.
- `.\.venv\Scripts\python.exe tools\ai_tools\validate_enterprise_baseline.py --include-frontend` OK, con warnings conocidos Pydantic BIM `model_name/model_id` y chunks grandes Vite.

Impacto
Backend comun y frontend clasico SaaS/Superadministrador. Sin DB/migraciones nuevas, sin auth/JWT/tenant nuevo, sin EDT, presupuestos, cronogramas, BIM, Docker/Coolify/CI/CD ni datos runtime.

Pendiente siguiente
Ejecutar `TASK-1891`: certificacion end-to-end de aplicacion completa con empresa mockup, compra/venta Marketplace, entrega SaaS, visibilidad de productos por empresa, permisos superadmin y flujo Conecta operativo. No cerrar el plan comercial al 100% hasta ejecutar esa certificacion.

Rollback
Revertir `backend/app/api/endpoints/conecta.py`, `backend/app/schemas/saas_conecta.py`, `backend/app/tests/test_saas_conecta_endpoints.py`, `frontend/src/api/conecta.js`, `frontend/src/pages/AdminGlobalLicencias.jsx`, `frontend/scripts/smoke-classic-conecta-api-boundary.mjs`, `docs/tasks/TASK-1890.md`, `docs/CHANGELOG.md`, `docs/HANDOFF.md` y la actualizacion del plan de negocio.

Fecha
2026-06-08

Motor IA utilizado
Codex

TASK cerrada
`TASK-1889`: UI clasica Conecta en SaaS/Settings/AdminGlobal.

Resultado actual
`Conecta` queda visible en la capa clasica sin activar BIM ni tocar proyectos: `Settings` muestra cupos contratados, usados, disponibles, invitaciones/asignaciones y liberacion normal; `SaaS / Superadministrador` en `AdminGlobalLicencias` muestra cupos por empresa y permite liberacion excepcional `force=true` solo al superadministrador. La UI consume exclusivamente `frontend/src/api/conecta.js`, sin imports directos de `axiosConfig` en las paginas.

Validacion ejecutada
- `node scripts\smoke-classic-conecta-api-boundary.mjs` OK.
- `node scripts\smoke-classic-api-boundaries.mjs` OK.
- `node scripts\smoke-classic-no-bim-contamination.mjs` OK.
- `node scripts\smoke-classic-superadmin-tenant-context.mjs` OK.
- `npm run build` OK, con warning conocido de chunks grandes Vite.
- `.\.venv\Scripts\python.exe tools\ai_tools\validate_enterprise_baseline.py --include-frontend` OK, con warnings conocidos Pydantic BIM `model_name/model_id` y chunks grandes Vite.

Impacto
Frontend clasico y cliente API clasico. Sin cambios de backend, DB, migraciones, auth/JWT/tenant, EDT, presupuestos, cronogramas, BIM, Docker/Coolify/CI/CD ni datos runtime.

Pendiente siguiente
Ejecutar `TASK-1890` para auditoria/KPIs Conecta y preparar certificacion end-to-end de aplicacion completa con empresa mockup antes de cerrar el plan comercial al 100%.

Rollback
Revertir `frontend/src/api/conecta.js`, `frontend/src/pages/Settings.jsx`, `frontend/src/pages/AdminGlobalLicencias.jsx`, `frontend/scripts/smoke-classic-conecta-api-boundary.mjs`, `docs/tasks/TASK-1889.md`, `docs/CHANGELOG.md`, `docs/HANDOFF.md` y la actualizacion del plan de negocio.

Fecha
2026-06-08

Motor IA utilizado
Codex

TASK cerrada
`TASK-1888`: endpoints clasicos Conecta y frontera API.

Resultado actual
`Conecta` expone la frontera backend clasica `/api/v1/conecta` con lectura de limites, listado de slots, creacion de slots y liberacion. La API consume `saas_conecta_service`, por lo que conserva cupos efectivos desde `commercial_capabilities_service`, bloqueo de 30 dias y auditoria en `LicenseEvent`. Usuarios normales operan sobre su empresa activa; `superadministrador` puede indicar `empresa_id` y es el unico rol que puede usar `force=true` para liberar anticipadamente. No se concede acceso automatico a proyectos, EDT, presupuestos ni cronogramas.

Validacion ejecutada
- `.\.venv\Scripts\python.exe -m py_compile backend\app\api\endpoints\conecta.py backend\app\schemas\saas_conecta.py backend\app\tests\test_saas_conecta_endpoints.py` OK.
- `..\.venv\Scripts\python.exe -m pytest app\tests\test_saas_conecta_service.py app\tests\test_saas_conecta_endpoints.py -q` OK: 10 passed.

Impacto
Backend clasico API. Sin frontend, sin Marketplace nuevo, sin auth/JWT/tenant nuevo, sin EDT, presupuestos, cronogramas, BIM, Docker/Coolify/CI/CD ni datos runtime.

Pendiente siguiente
Ejecutar `TASK-1889` para UI clasica Conecta en SaaS/Settings/AdminGlobal, consumiendo `/api/v1/conecta` mediante cliente en `frontend/src/api` y smokes de frontera API.

Rollback
Revertir `backend/app/api/endpoints/conecta.py`, `backend/app/schemas/saas_conecta.py`, `backend/app/api/api.py`, `backend/app/tests/test_saas_conecta_endpoints.py`, `docs/tasks/TASK-1888.md`, `docs/CHANGELOG.md`, `docs/HANDOFF.md` y la actualizacion del plan de negocio.

Fecha
2026-06-08

Motor IA utilizado
Codex

TASK cerrada
`TASK-1887`: backend Conecta, cupos y regla de 30 dias.

Resultado actual
`Conecta` ya tiene base persistente clasica con `SaasConectaSlot`, migracion Alembic y `saas_conecta_service`. El servicio resuelve cupos efectivos desde `commercial_capabilities_service`, permite asignar cupos por usuario existente o email invitado, bloquea empresas sin cupos o cupos agotados, impide autoasignacion, aplica regla de no liberacion/reasignacion antes de 30 dias y permite excepcion anticipada solo con `actor_is_superadmin=True`, dejando auditoria en `LicenseEvent`. No se otorga acceso automatico a proyectos, EDT, presupuestos, cronogramas ni colaboracion federada.

Validacion ejecutada
- `.\.venv\Scripts\python.exe -m py_compile backend\app\models\saas_conecta.py backend\app\services\saas_conecta.py backend\app\tests\test_saas_conecta_service.py backend\alembic\versions\ba1c2d3e4f50_saas_conecta_slots.py` OK.
- `..\.venv\Scripts\python.exe -m pytest app\tests\test_saas_conecta_service.py -q` OK: 5 passed.

Impacto
Backend clasico y migracion. Sin frontend, sin endpoints API, sin checkout nuevo, sin auth/JWT/tenant, sin EDT, presupuestos, cronogramas, BIM, Docker/Coolify/CI/CD ni datos runtime.

Pendiente siguiente
Ejecutar `TASK-1888` para endpoints/frontera API de Conecta, manteniendo permisos de superadministrador para excepciones y sin abrir acceso a proyectos.

Rollback
Revertir `backend/app/models/saas_conecta.py`, `backend/app/services/saas_conecta.py`, `backend/app/models/__init__.py`, `backend/alembic/versions/ba1c2d3e4f50_saas_conecta_slots.py`, `backend/app/tests/test_saas_conecta_service.py`, `docs/tasks/TASK-1887.md`, `docs/CHANGELOG.md` y `docs/HANDOFF.md`.

Fecha
2026-06-08

Motor IA utilizado
Codex

TASK cerrada
`TASK-1883`: contrato Conecta MVP y TASKs de ejecucion.

Resultado actual
`Conecta` queda definido como MVP usuario-usuario dentro de empresa activa. No concede acceso automatico a proyectos, EDT, presupuestos, cronogramas, archivos ni colaboracion federada. Los cupos deben resolverse server-side desde `commercial_capabilities_service`, respetando licencia/derechos SaaS y regla de no reasignacion antes de 30 dias salvo excepcion superadministrador auditada. Se crean `TASK-1887`, `TASK-1888`, `TASK-1889` y `TASK-1890` para ejecutar backend, endpoints, UI y auditoria/KPIs por slices separados.

Validacion ejecutada
- Revision documental de `TASK-1883`, plan de negocio y dependencias `TASK-1879`/`TASK-1880`.
- Sin build/test funcional porque el cambio es solo documental.

Impacto
Documentacion de planificacion SaaS clasica. Sin backend, sin frontend, sin DB, sin migraciones, sin endpoints, sin auth/JWT/tenant, sin EDT, presupuestos, cronogramas, BIM, Docker/Coolify/CI/CD ni datos runtime.

Rollback
Revertir `docs/tasks/TASK-1883.md`, eliminar `docs/tasks/TASK-1887.md` a `docs/tasks/TASK-1890.md`, y revertir las entradas en `docs/Plan de Negocio/PLAN_ADECUACION_MARKETPLACE_PRODUCTOS.md`, `docs/CHANGELOG.md` y `docs/HANDOFF.md`.

Fecha
2026-06-08

Motor IA utilizado
Codex

TASK cerrada
`TASK-1881 Slice 2`: marca de agua PDF server-side en reporting SaaS.

Resultado actual
`TASK-1881` queda cerrada. `/reporting/export` usa `commercial_capabilities_service` para bloquear `xlsx` y `pdf_excel` cuando `excel_exports=false`, y para aplicar marca de agua visible en PDF cuando `requires_watermark=true`. La marca se dibuja server-side en PDFs comunes, PDF documental EDO/EDT, PDF ejecutivo de Uso de Recursos y conversion `pdf_excel`. El cache de exportacion moderna incorpora el marcador de marca de agua para evitar PDFs obsoletos despues de cambios de licencia. No se cambia UI ni contratos API.

Validacion ejecutada
- `.\.venv\Scripts\python.exe -m py_compile backend\app\api\endpoints\reporting.py backend\app\services\reporting.py backend\app\tests\test_reporting_cronograma_integrated_reports.py` OK.
- `..\.venv\Scripts\python.exe -m pytest app\tests\test_reporting_cronograma_integrated_reports.py -q` OK: 16 passed, 1 warning Pydantic conocido.
- `node scripts\smoke-classic-no-bim-contamination.mjs` OK.
- `.\.venv\Scripts\python.exe tools\ai_tools\validate_enterprise_baseline.py` OK, con warnings conocidos Pydantic BIM `model_name/model_id`.

Impacto
Backend clasico de reporting y prueba focal. Sin frontend, sin DB, sin migraciones, sin auth/JWT/tenant, sin EDT, presupuestos, cronogramas funcionales, BIM, Docker/Coolify/CI/CD ni datos runtime.

Rollback
Revertir `backend/app/api/endpoints/reporting.py`, `backend/app/services/reporting.py`, `backend/app/tests/test_reporting_cronograma_integrated_reports.py`, `docs/tasks/TASK-1881.md`, `docs/Plan de Negocio/PLAN_ADECUACION_MARKETPLACE_PRODUCTOS.md`, `docs/CHANGELOG.md` y `docs/HANDOFF.md`.

Fecha
2026-06-08

Motor IA utilizado
Codex

TASK avance previo
`TASK-1881 Slice 1`: guarda backend de Excel en reporting SaaS.

Resultado actual
`/reporting/export` consulta `commercial_capabilities_service` antes de construir exportaciones modernas. Los formatos `xlsx` y `pdf_excel` quedan bloqueados con `403` si la capacidad efectiva `excel_exports` es falsa. Se conserva la guarda comercial previa para no relajar PDF no comercial hasta implementar marca de agua server-side. `TASK-1881` queda en progreso: Excel backend implementado; PDF watermark pendiente.

Validacion ejecutada
- `.\.venv\Scripts\python.exe -m py_compile backend\app\api\endpoints\reporting.py backend\app\tests\test_reporting_cronograma_integrated_reports.py` OK.
- `..\.venv\Scripts\python.exe -m pytest app\tests\test_reporting_cronograma_integrated_reports.py -q` OK: 14 passed, 1 warning Pydantic conocido.
- `node scripts\smoke-classic-no-bim-contamination.mjs` OK.

Impacto
Backend clasico de reporting y prueba focal. Sin frontend, sin DB, sin migraciones, sin auth/JWT/tenant, sin EDT, presupuestos, cronogramas funcionales, BIM, Docker/Coolify/CI/CD ni datos runtime.

Pendiente siguiente
Implementar marca de agua PDF server-side para licencias no comerciales/academicas/training o con `watermark_reports=true`, con pytest focal y smoke anti-BIM.

Rollback
Revertir `backend/app/api/endpoints/reporting.py`, `backend/app/tests/test_reporting_cronograma_integrated_reports.py`, `docs/tasks/TASK-1881.md`, `docs/Plan de Negocio/PLAN_ADECUACION_MARKETPLACE_PRODUCTOS.md`, `docs/CHANGELOG.md` y `docs/HANDOFF.md`.

Fecha
2026-06-08

Motor IA utilizado
Codex

TASK cerrada
`TASK-1882 Slice 4`: guia de renovacion y cambio de plan SaaS.

Resultado actual
`TASK-1882` queda cerrada. `Settings / Mi Empresa` muestra una franja contextual de gestion de plan que prioriza renovacion cuando la licencia esta en gracia, solo lectura o estado vencido. Los CTAs `Renovar plan actual` y `Evaluar cambio` navegan a Marketplace con `?saas=1&q=...&intent=...`, enfocando el producto oficial correspondiente. Marketplace lee `q` desde la URL y aplica busqueda inicial dentro del catalogo SaaS oficial. No se cambia checkout, entrega, permisos, backend, DB ni contratos API.

Validacion ejecutada
- `npm run build` OK, con warning conocido de chunks grandes Vite.
- `node scripts/smoke-classic-no-bim-contamination.mjs` OK.
- `node scripts/smoke-classic-api-boundaries.mjs` OK.
- `node scripts/smoke-classic-marketplace-admin-api-boundary.mjs` OK.
- Guarda textual en `Settings.jsx` y `Marketplace.jsx`: sin `axiosConfig`, sin `console.log` productivo y sin referencia BIM.

Impacto
Frontend clasico de Settings y Marketplace. Sin backend, sin API nueva, sin DB, sin auth/JWT/tenant, sin EDT, presupuestos, cronogramas, BIM, Docker/Coolify/CI/CD ni datos runtime.

Rollback
Revertir `frontend/src/pages/Settings.jsx`, `frontend/src/pages/Marketplace.jsx`, `docs/tasks/TASK-1882.md`, `docs/Plan de Negocio/PLAN_ADECUACION_MARKETPLACE_PRODUCTOS.md`, `docs/CHANGELOG.md` y `docs/HANDOFF.md`.

Fecha
2026-06-08

Motor IA utilizado
Codex

TASK cerrada
`TASK-1882 Slice 3`: estado SaaS visible en Settings.

Resultado actual
`Settings / Mi Empresa` ahora muestra una lectura de productos SaaS adicionales, derechos efectivos y capacidades comerciales resueltas por backend usando `commercial_capabilities` ya disponible en `licenseInfo`. La licencia de funcionamiento queda separada de packs/modulos comprados. Settings no permite editar estos productos. El CTA `Ver planes en Marketplace` navega a `/marketplace?saas=1`, y Marketplace activa automaticamente el filtro `Planes SaaS` con ese parametro.

Validacion ejecutada
- `npm run build` OK, con warning conocido de chunks grandes Vite.
- `node scripts/smoke-classic-no-bim-contamination.mjs` OK.
- `node scripts/smoke-classic-api-boundaries.mjs` OK.
- `node scripts/smoke-classic-marketplace-admin-api-boundary.mjs` OK.
- Guarda textual en `Settings.jsx` y `Marketplace.jsx`: sin `axiosConfig`, sin `console.log` productivo y sin referencia BIM.

Impacto
Frontend clasico de Settings y Marketplace. Sin backend, sin API nueva, sin DB, sin auth/JWT/tenant, sin EDT, presupuestos, cronogramas, BIM, Docker/Coolify/CI/CD ni datos runtime.

Rollback
Revertir `frontend/src/pages/Settings.jsx`, `frontend/src/pages/Marketplace.jsx`, `docs/tasks/TASK-1882.md`, `docs/Plan de Negocio/PLAN_ADECUACION_MARKETPLACE_PRODUCTOS.md`, `docs/CHANGELOG.md` y `docs/HANDOFF.md`.

Fecha
2026-06-08

Motor IA utilizado
Codex

TASK cerrada
`TASK-1882 Slice 2`: catalogo SaaS oficial visible en Marketplace.

Resultado actual
Marketplace clasico ahora incluye acceso `Planes SaaS` para filtrar licencias, packs y modulos oficiales vendibles. Los productos oficiales se identifican desde `product_meta.requires_superadmin_edit` y `commercial_code` con prefijos `LIC_`, `PACK_` o `MOD_`. Las fichas muestran badge comercial (`Licencia SaaS`, `Pack SaaS`, `Modulo SaaS`), la busqueda contempla el codigo comercial y el panel lateral muestra conteo/acceso rapido al catalogo SaaS oficial. No se modifica checkout, entrega, permisos, backend, DB ni contratos API. Settings y la UX guiada de renovacion/cambio de plan quedan pendientes dentro de `TASK-1882`.

Validacion ejecutada
- `npm run build` OK, con warning conocido de chunks grandes Vite.
- `node scripts/smoke-classic-no-bim-contamination.mjs` OK.
- `node scripts/smoke-classic-marketplace-admin-api-boundary.mjs` OK.
- `node scripts/smoke-classic-api-boundaries.mjs` OK.
- Guarda textual en `Marketplace.jsx`: sin `axiosConfig`, sin `console.log` productivo y sin referencia BIM.

Impacto
Frontend clasico de Marketplace. Sin backend, sin API nueva, sin DB, sin auth/JWT/tenant, sin EDT, presupuestos, cronogramas, BIM, Docker/Coolify/CI/CD ni datos runtime.

Rollback
Revertir `frontend/src/pages/Marketplace.jsx`, `docs/tasks/TASK-1882.md`, `docs/Plan de Negocio/PLAN_ADECUACION_MARKETPLACE_PRODUCTOS.md`, `docs/CHANGELOG.md` y `docs/HANDOFF.md`.

Fecha
2026-06-08

Motor IA utilizado
Codex

TASK cerrada
`TASK-1882 Slice 1`: UI Superadministrador de capacidades SaaS por empresa.

Resultado actual
`SaaS / Superadministrador / Empresas` ahora muestra una franja `Capacidades comerciales efectivas` por empresa, alimentada por `commercial_capabilities` del backend. La pantalla separa licencia de funcionamiento, productos SaaS adicionales y capacidades resueltas. Se muestran derechos efectivos, capacidades habilitadas, exportes permitidos y restricciones como marca de agua, no comercial o solo lectura. No se implementan aun compras, renovaciones, upgrades ni cambios de plan desde Marketplace/Settings.

Validacion ejecutada
- `npm run build` OK, con warning conocido de chunks grandes Vite.
- `node scripts/smoke-classic-no-bim-contamination.mjs` OK.
- `node scripts/smoke-classic-marketplace-admin-api-boundary.mjs` OK.
- `node scripts/smoke-classic-api-boundaries.mjs` OK.
- Guarda textual en `AdminGlobalLicencias.jsx`: sin `axiosConfig`, sin `console.log` productivo y sin referencia BIM.

Impacto
Frontend clasico de Superadministracion/Licencias. Sin backend, sin API nueva, sin DB, sin auth/JWT/tenant, sin EDT, presupuestos, cronogramas, BIM, Docker/Coolify/CI/CD ni datos runtime.

Rollback
Revertir `frontend/src/pages/AdminGlobalLicencias.jsx`, `docs/tasks/TASK-1882.md`, `docs/Plan de Negocio/PLAN_ADECUACION_MARKETPLACE_PRODUCTOS.md`, `docs/CHANGELOG.md` y `docs/HANDOFF.md`.

Fecha
2026-06-08

Motor IA utilizado
Codex

TASK cerrada
`TASK-1880`: resolvedor backend de capacidades comerciales SaaS.

Resultado actual
Se implemento `commercial_capabilities_service` como capa backend comun para resolver capacidades efectivas por empresa a partir de licencia base, packs incluidos, productos SaaS comprados y restricciones comerciales. `SaaS / Superadministrador / Empresas` conserva los productos SaaS adicionales separados de las licencias de funcionamiento y ahora recibe tambien `commercial_capabilities`. Los codigos vendibles se normalizan a derechos efectivos (`PACK_PLANIFICA`, `PACK_LICITA`, `PACK_CONECTA`, `PACK_EQUIPO`, `MOD_FUSION`, `MOD_MIGRACION`). La capa queda en modo lectura/contrato y no bloquea todavia modulos sensibles.

Validacion ejecutada
- `python -m py_compile backend/app/services/commercial_capabilities.py backend/app/api/endpoints/admin_licenses.py backend/app/tests/test_license_service_special_flags.py` OK.
- `pytest app/tests/test_license_service_special_flags.py app/tests/test_marketplace_bootstrap_contract.py -q` OK, 26 passed.
- `node scripts/smoke-classic-no-bim-contamination.mjs` OK.
- `tools/ai_tools/validate_enterprise_baseline.py --include-frontend` OK, con warnings conocidos de chunks grandes Vite y Pydantic BIM `model_name/model_id`.

Impacto
Backend clasico de Licencias/Marketplace/Superadministracion. Sin migraciones, sin cambios destructivos de DB, sin cambios en auth, JWT, tenant, permisos, EDT, presupuestos, cronogramas, BIM, Docker/Coolify/CI/CD ni datos runtime.

Rollback
Revertir `backend/app/services/commercial_capabilities.py`, `backend/app/api/endpoints/admin_licenses.py`, `backend/app/tests/test_license_service_special_flags.py`, `docs/tasks/TASK-1880.md`, `docs/Plan de Negocio/PLAN_ADECUACION_MARKETPLACE_PRODUCTOS.md`, `docs/CHANGELOG.md` y `docs/HANDOFF.md`.

Fecha
2026-06-08

Motor IA utilizado
Codex

TASK cerrada
`TASK-1873/TASK-1874/TASK-1879`: derechos SaaS para packs/modulos y visibilidad por empresa.

Resultado actual
Se cerro la matriz/contrato de productos SaaS y se implemento el derecho minimo para packs/modulos. Los productos Marketplace con `product_meta.delivery_kind` que contiene `saas_right` se entregan como `MarketplaceOrderItem.delivered_entity_type = "saas_right"` y registran `LicenseEvent` `saas_right_marketplace_purchase_activated`. El resumen de Superadministracion/Licencias ahora incluye `saas_products` por empresa y la UI clasica muestra un bloque `Productos SaaS adicionales` separado de la licencia de funcionamiento.

Validacion ejecutada
- `python -m py_compile backend/app/services/marketplace_checkout.py backend/app/api/endpoints/admin_licenses.py` OK.
- `pytest app/tests/test_license_service_special_flags.py app/tests/test_marketplace_bootstrap_contract.py -q` OK, 24 passed.
- `npm run build` OK, con warning conocido de chunks grandes Vite.
- `node scripts/smoke-classic-no-bim-contamination.mjs` OK.
- `tools/ai_tools/validate_enterprise_baseline.py --include-frontend` OK, con warnings conocidos de chunks grandes Vite y Pydantic BIM `model_name/model_id`.

Impacto
Backend clasico de Marketplace/licencias y frontend clasico de Superadministracion/Licencias. Sin migraciones, sin cambios destructivos de DB, sin cambios de API publica externa, auth, JWT, tenant, EDT, presupuestos, cronogramas, BIM, Docker/Coolify/CI/CD ni datos operativos.

Rollback
Revertir `backend/app/services/marketplace_checkout.py`, `backend/app/api/endpoints/admin_licenses.py`, `backend/app/tests/test_license_service_special_flags.py`, `frontend/src/pages/AdminGlobalLicencias.jsx`, `docs/tasks/TASK-1873.md`, `docs/tasks/TASK-1874.md`, `docs/tasks/TASK-1879.md`, `docs/Plan de Negocio/PLAN_ADECUACION_MARKETPLACE_PRODUCTOS.md`, `docs/CHANGELOG.md` y `docs/HANDOFF.md`.

Fecha
2026-06-08

Motor IA utilizado
Codex

TASK cerrada
`TASK-1878`: renovacion, upgrade y downgrade desde Marketplace.

Resultado actual
La entrega de licencias desde Marketplace clasifica la transicion comercial antes de asignar la licencia: `new_subscription`, `renewal_queued`, `upgrade_immediate`, `upgrade_queued`, `downgrade_queued` o `plan_change_queued`. Upgrade desde `EXPRESS` queda inmediato; renovacion y cambios entre planes comerciales quedan en cola si hay licencia activa no Express; downgrade no reduce capacidades del periodo vigente. La clasificacion queda en `EmpresaLicencia.detalles.marketplace_delivery.transition_kind` y en `LicenseEvent`.

Validacion ejecutada
- `python -m py_compile backend/app/services/marketplace_checkout.py backend/app/services/license.py` OK.
- `pytest app/tests/test_license_service_special_flags.py app/tests/test_marketplace_bootstrap_contract.py -q` OK, 23 passed.
- Warnings conocidos: Pydantic deprecation.

Impacto
Backend clasico de Marketplace/licencias. Sin cambios de API publica, auth, tenant, permisos, EDT, presupuestos, cronogramas, BIM, Docker/Coolify/CI/CD ni datos operativos. Sin prorrateos ni derechos de packs/modulos.

Rollback
Revertir `backend/app/services/marketplace_checkout.py`, `backend/app/tests/test_license_service_special_flags.py`, `docs/tasks/TASK-1878.md`, `docs/CHANGELOG.md`, `docs/HANDOFF.md` y la actualizacion del plan de negocio.

Fecha
2026-06-08

Motor IA utilizado
Codex

TASK cerrada
`TASK-1875`: politica de retencion, vencimiento y renovacion SaaS.

Resultado actual
Se cerro documentalmente la politica mixta para resolver la contradiccion del plan aprobado: dia 0 bloqueo de escritura; dias 1-15 solo lectura; dias 16-30 datos retenidos sin operacion normal; dia 30 cola de eliminacion auditada. Renovacion, upgrade y downgrade quedan gobernados por continuidad/cola sin prorrateos implicitos ni eliminacion de datos. La eliminacion irreversible se reserva para TASK futura con aprobacion explicita.

Validacion ejecutada
- Revision documental contra `docs/Plan de Negocio/PLAN_ADECUACION_MARKETPLACE_PRODUCTOS.md`.
- Sin build/test por no cambiar codigo.

Impacto
Documentacion de politica SaaS clasica. Sin backend, frontend, API, DB, auth, tenant, permisos, EDT, presupuestos, cronogramas, BIM, Docker/Coolify/CI/CD ni datos runtime.

Rollback
Revertir `docs/tasks/TASK-1875.md`, `docs/Plan de Negocio/PLAN_ADECUACION_MARKETPLACE_PRODUCTOS.md`, `docs/CHANGELOG.md` y `docs/HANDOFF.md`.

Fecha
2026-06-08

Motor IA utilizado
Codex

TASK cerrada
`TASK-1877`: entrega idempotente de licencias base desde Marketplace.

Resultado actual
Se endurecio la entrega de productos `licencia` en Marketplace. Los flujos de pago confirmado, transferencia bancaria validada y checkout clasico legado crean primero el `MarketplaceOrderItem` y entregan despues la licencia usando `marketplace_order_item_id` como huella de idempotencia. La asignacion queda en `EmpresaLicencia` con `source="marketplace_order"` y metadata `marketplace_delivery`; se registra el evento `license_marketplace_purchase_activated`.

Validacion ejecutada
- `python -m py_compile backend/app/services/marketplace_checkout.py backend/app/services/license.py` OK.
- `pytest app/tests/test_license_service_special_flags.py app/tests/test_marketplace_bootstrap_contract.py -q` OK, 21 passed.
- Warnings conocidos: Pydantic deprecation.

Impacto
Backend clasico de Marketplace/licencias. Sin cambios de API publica, auth, tenant, EDT, presupuestos, cronogramas, BIM, Docker/Coolify/CI/CD ni datos operativos. No implementa aun packs/modulos, renovacion avanzada, upgrade/downgrade ni prorrateos.

Rollback
Revertir `backend/app/services/marketplace_checkout.py`, `backend/app/tests/test_license_service_special_flags.py`, `docs/tasks/TASK-1877.md`, `docs/CHANGELOG.md`, `docs/HANDOFF.md` y la actualizacion del plan de negocio.

Fecha
2026-06-08

Motor IA utilizado
Codex

TASK cerrada
`TASK-1886`: empresas actuales alineadas a politica SaaS Marketplace.

Resultado actual
Se alineo el catalogo local de licencias y las asignaciones activas de empresas al plan SaaS Marketplace aprobado. `EXPRESS`, `STANDARD`, `PROFESSIONAL`, `TESTER`, `ACADEMIC` y `TRAINING` quedan como licencias oficiales activas. `EXPRES` y `ENTERPRISE` quedan inactivas como legacy. La empresa `Administradores Generales` se alinea de `ENTERPRISE` a `PROFESSIONAL`, con detalle de rollback en `EmpresaLicencia.detalles` y evento `license_saas_policy_alignment`. Las empresas `Jesús Benito Segura González` y `Santiago Bermeo` conservan `STANDARD` y `PROFESSIONAL` respectivamente.

Validacion ejecutada
- `python -m py_compile backend/app/services/license.py backend/scripts/align_companies_to_saas_policy.py` OK.
- `pytest app/tests/test_saas_policy_alignment.py app/tests/test_marketplace_bootstrap_contract.py -q` OK, 13 passed.
- `pytest app/tests/test_license_service_special_flags.py -q` OK, 8 passed.
- `node scripts/smoke-classic-no-bim-contamination.mjs` OK.
- Verificacion DB local de licencias, asignaciones y evento de alineacion OK.

Impacto
Backend clasico de licencias y datos locales de asignacion de licencia. Sin cambios de API, auth, tenant, EDT, presupuestos, cronogramas, BIM, Docker/Coolify/CI/CD ni datos funcionales de proyecto. Sin migraciones destructivas.

Rollback
Reactivar `ENTERPRISE`, reasignar `Administradores Generales` a `ENTERPRISE` si fuera necesario y revertir `backend/app/services/license.py`, `backend/scripts/align_companies_to_saas_policy.py`, `backend/app/tests/test_saas_policy_alignment.py` y documentacion asociada.

Fecha
2026-06-08

Motor IA utilizado
Codex

TASK cerrada
`TASK-1876`: catalogo SaaS Marketplace alineado al plan aprobado.

Resultado actual
Se adecuo el catalogo sistema de Marketplace al plan aprobado. El bootstrap crea/actualiza categorias `Packs SaaS` y `Modulos y servicios`, reutiliza productos sistema existentes con `legacy_slugs`, desactiva productos sistema antiguos fuera del plan y deja activos para venta 14 productos: licencias Estandar/Profesional mensual-anual, packs Planifica/Licita/Conecta/Equipo mensual-anual y modulos Fusion/Migracion. Las entradas Express Trial, Tester, Academica y Capacitacion quedan como control no vendible. Todos los productos SaaS llevan metadata comercial y `requires_superadmin_edit`.

Validacion ejecutada
- `python -m py_compile backend/app/services/marketplace_catalog_bootstrap.py backend/app/services/marketplace_bootstrap.py` OK.
- `pytest app/tests/test_marketplace_bootstrap_contract.py -q` OK, 12 passed.
- `backend/scripts/seed_marketplace_system_categories.py` OK.
- `backend/scripts/seed_marketplace_system_catalog.py` OK.
- Verificacion DB: 14 productos sistema activos del plan aprobado; productos sistema antiguos fuera del plan inactivos.
- `node scripts/smoke-classic-no-bim-contamination.mjs` OK.

Impacto
Backend clasico de bootstrap Marketplace y datos locales de catalogo Marketplace. Sin cambios de API, auth, tenant, EDT, presupuestos, cronogramas, BIM, Docker/Coolify/CI/CD. No se implementa entrega automatica nueva para packs/modulos.

Rollback
Revertir `backend/app/services/marketplace_catalog_bootstrap.py`, `backend/app/services/marketplace_bootstrap.py`, `backend/app/tests/test_marketplace_bootstrap_contract.py`, documentacion asociada y restaurar/reetiquetar productos sistema en DB si se requiere.

Fecha
2026-06-08

Motor IA utilizado
Codex

TASK cerrada
`TASK-1872`: programa SaaS Marketplace aceptado y TASKs de ejecucion.

Resultado actual
Se adapto `docs/Plan de Negocio/PLAN_ADECUACION_MARKETPLACE_PRODUCTOS.md` para dejar aceptada la direccion inicial: Marketplace vende, Licencias gobierna acceso, packs/modulos viven como derechos SaaS y la activacion post-compra debe ser backend, idempotente y auditada. Se crearon TASKs de control y ejecucion futura `TASK-1872` a `TASK-1885`, sin implementar codigo.

Validacion ejecutada
- Revisión documental del plan de adecuacion.
- Creacion de TASK madre y TASKs hijas de contrato/ejecucion.
- Sin build/test porque el cambio es solo documental.

Impacto
Documentacion de planificacion clasica. Sin backend, frontend, API, DB, auth, tenant, EDT, presupuestos, cronogramas, BIM, Docker/Coolify/CI/CD ni datos runtime. No reabre el baseline `TASK-1807`.

Rollback
Revertir la adaptacion del plan, `docs/tasks/TASK-1872.md` a `docs/tasks/TASK-1885.md` y las entradas de `docs/CHANGELOG.md` / `docs/HANDOFF.md`.

Fecha
2026-06-08

Motor IA utilizado
Codex

TASK cerrada
`TASK-1871`: plan de adecuacion Marketplace para productos SaaS.

Resultado actual
Se analizo `docs/Plan de Negocio/Plan Aprobado V1.docx` y se genero el plan documental `docs/Plan de Negocio/PLAN_ADECUACION_MARKETPLACE_PRODUCTOS.md`. El documento resume el modelo aprobado de licencias, packs, modulos independientes, retencion, precios, alertas y KPIs; lo contrasta con los dominios existentes de Licencias y Marketplace; identifica brechas y contradicciones; y propone una ruta por fases para vender licencias, packs y modulos desde Marketplace sin escribir codigo.

Validacion ejecutada
- Extraccion de texto del DOCX fuente mediante lectura de `word/document.xml`.
- Revisión documental de `Licencia`, `EmpresaLicencia`, servicio de licencias, modelos Marketplace, endpoints Marketplace y cliente API Marketplace.
- Sin validaciones de build/test porque el cambio es solo documental.

Impacto
Documentacion de planificacion clasica. Sin backend, frontend, API, DB, auth, tenant, EDT, presupuestos, cronogramas, BIM, Docker/Coolify/CI/CD ni datos runtime. No reabre el baseline `TASK-1807`.

Rollback
Revertir `docs/Plan de Negocio/PLAN_ADECUACION_MARKETPLACE_PRODUCTOS.md`, `docs/tasks/TASK-1871.md` y las entradas de `docs/CHANGELOG.md` / `docs/HANDOFF.md`.

Fecha
2026-06-04

Motor IA utilizado
Codex

TASK cerrada
`TASK-1870`: FC con caida vertical despejada sobre cabeza de flecha.

Resultado actual
La ruta visual `FC/FS` mantiene el punto final exacto sobre el borde superior de la barra sucesora, pero el tramo horizontal previo sube de `10px` a `16px` sobre el destino. Con esto la cabeza de flecha queda despejada y la llegada se lee como una caida vertical limpia, alineada con la referencia visual solicitada. No se modifican fechas, calendario laboral, dependencias reales, DB, backend ni API.

Validacion ejecutada
- `node scripts/smoke-cronogramas-gantt-dependencies.mjs` OK.
- `node scripts/smoke-cronogramas-gantt-sequence-commit.mjs` OK.
- `node scripts/smoke-classic-cronogramas-api-boundary.mjs` OK.
- `node scripts/smoke-classic-no-bim-contamination.mjs` OK.
- Guardas por `rg`: sin imports directos de `axiosConfig` fuera de `frontend/src/api`; sin `console.log` productivos en `frontend/src`.
- `npm run build` OK, con warning conocido de chunks grandes Vite.
- `tools/ai_tools/validate_enterprise_baseline.py --include-frontend` OK completo. Solo warnings conocidos: chunks grandes Vite y Pydantic BIM `model_name/model_id`.

Impacto
Frontend clasico Gantt: `cronogramasGanttDependencies.js` y guarda focal en `smoke-cronogramas-gantt-dependencies`. Sin BIM, sin backend, sin API, sin datos, sin Docker/Coolify/CI/CD.

Rollback
Restaurar `DEPENDENCY_TOP_ENTRY_CLEARANCE_PX` a `10px` y revertir la asercion focal del smoke.

Fecha
2026-06-04

Motor IA utilizado
Codex

TASK cerrada
`TASK-1868/TASK-1869`: separacion superior FC y panel de dependencia sin scroll horizontal.

Resultado actual
La ruta visual `FC/FS` conserva salida desde el fin del predecesor y llegada al borde superior exacto del sucesor, pero el tramo horizontal previo queda ahora `10px` por encima de la barra destino para que la cabeza de flecha tenga aire y no invada el Gantt. El panel de dependencia seleccionada usa ancho responsive `min(440px, calc(100vw - 2rem))`, bloquea desplazamiento horizontal interno y permite ver encabezado/restriccion calculada en varias lineas. No se modifican fechas, calendario laboral, dependencias reales, DB, backend ni API.

Validacion ejecutada
- `node scripts/smoke-cronogramas-gantt-dependencies.mjs` OK.
- `node scripts/smoke-cronogramas-gantt-sequence-commit.mjs` OK.
- `node scripts/smoke-classic-cronogramas-api-boundary.mjs` OK.
- `node scripts/smoke-classic-no-bim-contamination.mjs` OK.
- Guardas por `rg`: sin imports directos de `axiosConfig` fuera de `frontend/src/api`; sin `console.log` productivos en `frontend/src`.
- `npm run build` OK, con warning conocido de chunks grandes Vite.
- `tools/ai_tools/validate_enterprise_baseline.py --include-frontend` OK completo. Solo warnings conocidos: chunks grandes Vite y Pydantic BIM `model_name/model_id`.

Impacto
Frontend clasico Gantt: `cronogramasGanttDependencies.js`, `CronogramaGantt.jsx` y guarda focal en `smoke-cronogramas-gantt-dependencies`. Sin BIM, sin backend, sin API, sin datos, sin Docker/Coolify/CI/CD.

Rollback
Restaurar `DEPENDENCY_TOP_ENTRY_CLEARANCE_PX` a `4px`, revertir las clases del panel en `CronogramaGantt.jsx` y las aserciones focales del smoke.

Fecha
2026-06-04

Motor IA utilizado
Codex

TASK cerrada
`TASK-1866/TASK-1867`: UX compacta de dependencia seleccionada en Gantt clasico.

Resultado actual
La accion flotante sobre una dependencia seleccionada ya no usa `X` ni ejecuta ruptura directa; ahora muestra `Pencil` y mantiene la semantica de editar dependencia seleccionada. El panel de dependencia queda compacto con shortcode/contexto minimo, relacion, desfase, unidad y acciones por icono: `Trash2` para romper, `Check` para guardar y `X` solo para cerrar. No se modifican fechas, calendario laboral, dependencias reales, DB, backend ni API.

Validacion ejecutada
- `node scripts/smoke-cronogramas-gantt-dependencies.mjs` OK.
- `node scripts/smoke-cronogramas-gantt-sequence-commit.mjs` OK.
- `node scripts/smoke-classic-cronogramas-api-boundary.mjs` OK.
- `node scripts/smoke-classic-no-bim-contamination.mjs` OK.
- Guardas por `rg`: sin imports directos de `axiosConfig` fuera de `frontend/src/api`; sin `console.log` productivos en `frontend/src`.
- `npm run build` OK, con warning conocido de chunks grandes Vite.
- `tools/ai_tools/validate_enterprise_baseline.py --include-frontend` OK completo. Solo warnings conocidos: chunks grandes Vite y Pydantic BIM `model_name/model_id`.

Impacto
Frontend clasico Gantt: `CronogramaGantt.jsx` y guarda focal en `smoke-cronogramas-gantt-dependencies`. Sin BIM, sin backend, sin API, sin datos, sin Docker/Coolify/CI/CD.

Rollback
Revertir el CTA flotante y el panel compacto en `frontend/src/components/projects/CronogramaGantt.jsx`, mas las aserciones focales agregadas al smoke.

Fecha
2026-06-04

Motor IA utilizado
Codex

TASK cerrada
`TASK-1864/TASK-1865`: micro-codos MS Project y llegada superior `FC` en Gantt clasico.

Resultado actual
La representacion de dependencias del Gantt clasico se acerca al patron visual de MS Project: codos base de `8px`, lineas de enlace mas finas y rutas ortogonales compactas. La relacion `FC/FS` conserva salida desde el fin del predecesor, pero llega por el borde superior de la barra sucesora mediante una caida vertical final con separacion minima previa. `CC/SS`, `FF` y `CF/SF` conservan anclas laterales centro. Los hitos mantienen el centro del rombo como ancla visual; en hito -> tarea `FC`, la tarea sucesora recibe por arriba. No se modifican fechas, calendario laboral, dependencias reales, DB, backend ni API.

Validacion ejecutada
- `node scripts/smoke-cronogramas-gantt-dependencies.mjs` OK.

Impacto
Frontend clasico Gantt: `cronogramasGanttDependencies.js`, `CronogramaGantt.jsx` y guarda de smoke. Sin BIM, sin backend, sin API, sin datos, sin Docker/Coolify/CI/CD.

Rollback
Revertir el codo base/grosor visual y la rama especial `FC/FS` en `frontend/src/components/projects/cronogramasGanttDependencies.js` / `CronogramaGantt.jsx`, mas las aserciones focales del smoke.

Fecha
2026-06-03

Motor IA utilizado
Codex

TASK cerrada
`TASK-1863`: entrada lateral al item sucesor desde hitos Gantt.

Resultado actual
Los hitos del Gantt clasico conservan el centro del rombo como ancla visual correcta. La relacion hito -> tarea ahora mantiene salida desde el centro del hito, pero entra al item sucesor por el lateral centro correspondiente, con codo horizontal compacto y sin caida vertical sobre el borde de la barra destino. No se modifican fechas, calendario laboral, dependencias, DB, backend ni API.

Validacion ejecutada
- `node scripts/smoke-cronogramas-gantt-dependencies.mjs` OK.

Impacto
Frontend clasico Gantt: `cronogramasGanttDependencies.js` y guarda de smoke. Sin BIM, sin backend, sin API, sin datos, sin Docker/Coolify/CI/CD.

Rollback
Revertir el ajuste de entrada hito -> tarea en `frontend/src/components/projects/cronogramasGanttDependencies.js` y las aserciones de hito del smoke.

Fecha
2026-06-03

Motor IA utilizado
Codex

TASK cerrada
`TASK-1862`: carril lateral anti-caida vertical en dependencias Gantt.

Resultado actual
El Gantt clasico corrige el caso limite observado con zoom cuando una relacion `FC/FS` queda alineada por fecha (`source.right === target.left`). El tronco vertical ya no cae sobre el borde izquierdo del destino: se desplaza al carril lateral de salida y, si el tramo cruzaria el cuerpo de la barra destino, usa la evasion superior/inferior antes de entrar por el lateral centro con codo compacto de 14px. No se modifican fechas, calendario laboral, dependencias, DB, backend ni API.

Validacion ejecutada
- `node scripts/smoke-cronogramas-gantt-dependencies.mjs` OK.

Impacto
Frontend clasico Gantt: `cronogramasGanttDependencies.js` y guarda de smoke. Sin BIM, sin backend, sin API, sin datos, sin Docker/Coolify/CI/CD.

Rollback
Revertir el ajuste focal en `frontend/src/components/projects/cronogramasGanttDependencies.js` y el caso nuevo del smoke.

Fecha
2026-06-03

Motor IA utilizado
Codex

TASK cerrada
`TASK-1861`: codos compactos en lineas de secuenciacion del Gantt clasico.

Resultado actual
La geometria de dependencias del Gantt clasico sale y entra por el centro del lateral semantico de cada barra (`FC/FS`, `CC/SS`, `FF`, `CF/SF`). Cuando hay salto vertical, la ruta usa codos horizontales compactos de 14px en salida/entrada para dejar visible un tramo antes de la cabeza de flecha, evita caidas verticales sobre esquinas o marcadores superiores/inferiores, y desvía el tramo largo por fuera si cruzaria el cuerpo de una barra. No se modifican fechas, dependencias, calendario laboral, DB ni backend.

Validacion ejecutada
- `node scripts/smoke-cronogramas-gantt-dependencies.mjs` OK.
- `node scripts/smoke-cronogramas-gantt-sequence-commit.mjs` OK.
- `node scripts/smoke-classic-cronogramas-api-boundary.mjs` OK.
- `node scripts/smoke-classic-no-bim-contamination.mjs` OK.
- `npm run build` OK, con warning conocido de chunks grandes Vite.
- `tools/ai_tools/validate_enterprise_baseline.py --include-frontend` OK completo. Solo warnings conocidos: chunks grandes Vite y Pydantic BIM `model_name/model_id`.

Impacto
Frontend clasico Gantt: `cronogramasGanttDependencies.js` y guardas de smoke. Sin BIM, sin backend, sin API, sin datos, sin Docker/Coolify/CI/CD.

Rollback
Revertir `frontend/src/components/projects/cronogramasGanttDependencies.js` y las aserciones actualizadas de smokes.

Fecha
2026-06-03

Motor IA utilizado
Codex

TASK cerrada
`TASK-1860`: calendario oficial en Gantt clasico y saneamiento FF Santiago Bermeo.

Resultado actual
El Gantt clasico ahora deriva un `scheduleConfig` efectivo fusionando `configDraft` con `trabajo.holiday_calendar`, para que los calculos locales de dependencias, barras, subbarras, validaciones, drag/preview y paneles usen los mismos feriados oficiales que backend. Se saneo el cronograma real de Santiago Bermeo (empresa 3, proyecto 7, presupuesto 13) con backup previo en `tmp/gantt_schedule_backup_task_1860_20260603_080501.json`; se recalcularon 187 lineas retirando `end_date` persistido como override y dejando que el servicio clasico recalculara finales/cascadas con calendario laboral y festivos. Linea 118 queda en `2026-05-06T11:11:22` y linea 119 con `118FF` en `2026-05-06T11:11:21`; linea 106/108 conserva `106FF` con fin `2026-05-15T11:10:59/58`.

Validacion ejecutada
- Audit DB post-saneamiento: 0 discrepancias entre fechas superiores y subbarras `gantt_workday_auto_segment`; 0 limites en fin de semana, feriado o fuera de jornada; 5 relaciones FF verificadas con delta maximo de 1 segundo.
- Guardas frontend por `rg`: sin imports directos de `axiosConfig` fuera de `frontend/src/api`; sin `console.log` productivos en `frontend/src`.
- `npm run build` OK en `frontend/`, con warning conocido de chunks grandes Vite.
- `node scripts/smoke-classic-no-bim-contamination.mjs` OK.
- `node scripts/smoke-classic-cronogramas-api-boundary.mjs` OK; guarda ahora tambien que `CronogramaGantt` use `scheduleConfig` con `trabajo.holiday_calendar` en dependencias, finales, subbarras y geometria.
- `node scripts/smoke-cronogramas-gantt-dependencies.mjs` OK.
- `node scripts/smoke-cronogramas-gantt-sequence-commit.mjs` OK.
- `tools/ai_tools/validate_enterprise_baseline.py --include-frontend` OK completo. Solo warnings conocidos: chunks grandes Vite y Pydantic BIM `model_name/model_id`.

Impacto
Frontend clasico `CronogramaGantt.jsx` y datos locales del cronograma Santiago Bermeo. Sin backend nuevo, sin cambios de API/auth/tenant, sin BIM, sin UX BIM, sin Docker/Coolify/CI/CD.

Rollback
Revertir `frontend/src/components/projects/CronogramaGantt.jsx` y restaurar `cronogramas_trabajo.schedule_data` del cronograma `id=1` desde `tmp/gantt_schedule_backup_task_1860_20260603_080501.json`.

Fecha
2026-05-08

Motor IA utilizado
Codex

TASK en progreso
`TASK-1603` / `TASK-1604`: motor inicial de laminas graficas clasicas, implementado y validado para testeo/pulido.

Resultado actual
Se crea el contrato de impresion grafica clasica y una primera implementacion funcional sin backend nuevo. El boton `Reporte` de `EDO` y `EDT` ahora distingue `Reporte documental` y `Lamina grafica`. `Cronogramas` incorpora `Lamina Curva S` y `Lamina Gantt completo` dentro de sus menus de reporte. El motor comun permite `A0` a `A4`, orientacion horizontal/vertical, preflight compacto y genera un `Blob application/pdf` con descarga directa, sin ventana tecnica ni dialogo de impresion del navegador. Las laminas no incluyen controles de UI y usan datos extendidos: jerarquia grafica con tarjetas/conectores en EDO/EDT, periodos completos en Curva S y grid izquierdo + timeline reconstruidos desde datos en Gantt. Hotfix posterior: se corrige la salida inicial tipo rejilla y el mojibake `þÿ` del PDF directo. Pulido Gantt PDF: se retira la franja naranja artificial, se eliminan los rotulos flotantes `FS`/`FF`/etc. y el grid izquierdo suma `Pred.`, `Inicio`, `Fin` y `Dur.`. Saneamiento posterior acotado solo a impresion: las relaciones PDF se dibujan solo desde `dependencies` explicitas y la lamina deja de convertir tareas de ancho pequeno en hitos, evitando diamantes y rutas que no existen en la vista real.

Validacion ejecutada
- `npm run build` OK desde `frontend/`.
- `node scripts/smoke-cronogramas-gantt-dependencies.mjs` OK desde `frontend/`.
- `node scripts/smoke-classic-no-bim-contamination.mjs` OK desde `frontend/`.
- Parseo JSON de `docs/project_state.json` y `docs/runtime/WORK_MODE_STATE.json` OK.

Validacion manual pendiente
Prueba manual de descarga PDF directa para EDO, EDT, Curva S y Gantt.

Impacto
Frontend clasico de `EDO`, `EDT` y `Cronogramas`, mas componentes/utilidades comunes de reporting visual clasico. Sin backend, sin persistencia, sin rutas BIM, sin UX BIM ni acoplamientos BIM.

TASK en progreso
`TASK-1602`: revision y alineacion de reportes EDO/EDT, implementada y validada.

Resultado actual
La reportería de `EDO` y `EDT` queda conectada al visor comun de reportes. `EDO` ahora tiene `report_type: edo`, preview/export, nombres de descarga y servicio `generate_edo_report(...)` usando `001 - EDO.xlsx`. `EDT` corrige el generador para usar `EdtNode` y los placeholders reales de sus plantillas (`#CODIGOEDT`, `#DESCRIPCION_CUENTA_PAQUETE`, `#NOMBRE_RESPONSABLE`, `#CODIGO_STKR`, `#DEFINICION`, `#SUBTOTAL_CUENTA`). Los botones de reporte de ambas secciones abren `CommonReportPreviewModal` y permiten Excel, PDF nativo y PDF desde Excel. Hotfix posterior: `Stakeholders` resuelve roles para preview y Excel con la misma politica, usando asignacion consolidada y fallback directo a roles operativos en `EDO` / `EDT`; se invalida cache de exportacion.

Validacion ejecutada
- `python -m py_compile backend/app/services/reporting.py backend/app/api/endpoints/reporting.py backend/app/schemas/reporting.py` OK.
- `python -m pytest app/tests/test_reporting_edo_edt_reports.py -q` OK desde `backend/`, 2 passed.
- `python -m pytest app/tests/test_reporting_stakeholders_excel_pdf.py -q` OK desde `backend/`, 6 passed.
- `python -m pytest app/tests/test_stakeholder_role_sync.py -q` OK desde `backend/`, 6 passed.
- `npm run build` OK desde `frontend/`.
- `node scripts/smoke-classic-no-bim-contamination.mjs` OK desde `frontend/`.

Impacto
Reportería clásica y entrada frontend clásica de EDO/EDT. Sin rutas BIM, UX BIM, modelos BIM ni acoplamientos BIM.

TASK en progreso
`TASK-1600` / `TASK-1601`: adecuacion visual de EDT al patron EDO, implementada y validada.

Resultado actual
EDT adopta el lenguaje visual clasico homologado: header principal claro/soft con identidad verde, selector `Grafico / Arbol` junto al reporte, rail operativo oscuro con accion de nueva cuenta, busqueda unica, metricas economicas como chips/semaforos y acciones por lote siempre visibles pero desactivadas cuando no hay seleccion. En grafico, los chips de estructura y valoracion quedan agrupados en el mismo bloque y los botones se separan a la derecha. La vista grafica usa toolbar externa y busqueda externa de `HierarchyGraphView`; el arbol queda como grid compacto con header unico, columnas para selector/codigo/descripcion/subvalores/acciones, filas mas densas, acciones soft por hover de fila y hints para textos truncados. Los modales de cuenta, participante y mover seleccion adoptan header negro, cuerpo claro, footer plano, cierre blanco/soft y `SearchableSelect` animado. `SoftSelectToggle` gana tono `green` reutilizable para EDT.

Validacion ejecutada
- `npm run build` OK desde `frontend/`.
- `node scripts/smoke-classic-no-bim-contamination.mjs` OK desde `frontend/`.

Impacto
Frontend clasico de EDT y variante visual reutilizable de `SoftSelectToggle`. Sin backend, sin cambios de persistencia, sin rutas BIM, UX BIM ni acoplamientos BIM.

TASK en progreso
`TASK-1599`: reportería de Stakeholders con roles sincronizados en exportaciones, implementada y validada.

Resultado actual
Las exportaciones del reporte `Stakeholders` ya no reutilizan una versión cacheada sin roles cuando la vista previa/resumen muestra roles sincronizados desde EDO/EDT. La clave de caché de exportación incorpora proyecto raíz, stakeholders, asignaciones `proyecto_stakeholders`, `rol_id`, nombre y marca temporal del rol. Esto cubre Excel y PDF desde Excel, manteniendo el fallback `Sin rol asignado` cuando no hay rol consolidado.

Validacion ejecutada
- `python -m py_compile backend/app/services/reporting.py` OK.
- `python -m pytest app/tests/test_stakeholder_role_sync.py -q` OK desde `backend/`, 5 passed.

Impacto
Backend común de reporting clásico. Sin frontend, sin cambios de persistencia, sin rutas BIM, UX BIM ni acoplamientos BIM.

TASK en progreso
`TASK-1598`: compactacion visual del arbol EDO, implementada y validada.

Resultado actual
El arbol EDO reduce densidad vertical y adopta una estructura visual grid alineada con `Stakeholders`: toolbar y cabecera de columnas viven en un unico header oscuro, con columnas fijas para selector/codigo/acciones y columna principal fluida. La indentacion jerarquica se aplica solo sobre `Descripcion / Responsable`, evitando desplazar toda la fila y recuperando espacio util. La guia de drop a raiz deja de mostrar una franja crema permanente y solo aparece coloreada durante el arrastre. El contador de seleccion masiva vive como chip/semaforo siempre visible en el header y sus acciones usan botones iconograficos soft desactivados hasta tener seleccion. Chips y botones del rail oscuro quedan centralizados en `frontend/src/components/ui/darkRailControls.jsx` y son compartidos por `Grafico` y `Arbol`. El modal de mover seleccion EDO queda mas compacto, sin paneles internos redundantes y con una variante limpia del `SearchableSelect` animado. El scrollbar queda anclado al cuerpo scrolleable visible. La seleccion multiple sigue usando `SoftSelectToggle` y se preservan busqueda, expansion, acciones, drag/drop y sincronizacion con Stakeholders.

Validacion ejecutada
- `npm run build` OK desde `frontend/`.
- `node scripts/smoke-classic-no-bim-contamination.mjs` OK desde `frontend/`.
- Parseo JSON OK.

Impacto
Frontend clasico de EDO. Sin backend, sin cambios de persistencia, sin modo grafico, sin UX BIM, rutas BIM ni acoplamientos BIM.

TASK en progreso
`TASK-1597`: selectores operativos migrados a `SoftSelectToggle`, implementada y validada.

Resultado actual
Los selectores multiples discretos usan ahora `SoftSelectToggle` en `EDO`, `EDT`, `Subcategorias`, `Recursos`, `APUs`, empresas destinatarias de `Comunicados` y dias laborables del calendario avanzado de `CronogramaGantt`. El componente queda definido como led circular pequeno con area clicable ampliada y variante `as="span"` para indicadores dentro de botones compuestos. Se dejan fuera de esta migracion los checkboxes booleanos de formularios, consentimientos, preferencias, configuracion, activo/inactivo y BIM. El patron queda documentado en `docs/STYLE_GUIDE.md`.

Validacion ejecutada
- `npm run build` OK desde `frontend/`.
- `node scripts/smoke-classic-no-bim-contamination.mjs` OK desde `frontend/`.
- Parseo JSON OK.

Impacto
Frontend clasico visual. Sin backend, sin cambios de reglas de negocio, sin UX BIM, rutas BIM ni acoplamientos BIM.

TASK en progreso
`TASK-1593` a `TASK-1596`: adecuacion visual de EDO implementada y validada.

Resultado actual
EDO adopta el lenguaje visual clasico homologado: header principal claro/soft con selector `Grafico / Arbol` junto al reporte, workbench soft, rail operativo oscuro, busqueda local sin acentos compartida por modo grafico y modo arbol, botones de fila con skin soft, hints para textos largos y modales internos con header negro, cuerpo claro, footer plano y cierre X blanco/soft. La vista grafica queda integrada en el mismo workbench; sus controles superiores se proyectan al rail oscuro, se elimina el buscador duplicado interno y las metricas quedan siempre visibles como chips/semaforos en el rail sin boton `Resumen`. En modo arbol, expandir/contraer queda solo en los nodos, alineado con el grupo derecho de acciones, el hover de acciones queda aislado por fila para no activar hijos y la seleccion multiple usa `SoftSelectToggle` como led circular reutilizable con area clicable ampliada. El selector de cabecera alterna seleccion/limpieza de todos los nodos visibles. En `Stakeholders`, el subtitulo del header cambia a `Directorio común del proyecto`.
Hotfix aplicado: se corrige el `ReferenceError` en runtime y se limpia el rail arbol de acciones redundantes.

Validacion ejecutada
- `npm run build` OK desde `frontend/`.
- `node scripts/smoke-classic-no-bim-contamination.mjs` OK desde `frontend/`.

Impacto
Frontend clasico de EDO y ajuste literal visual en Stakeholders. Sin backend, sin cambios de persistencia EDO/EDT, sin rutas BIM ni UX BIM.

TASK en progreso
`TASK-1592`: cierre visual de modales de reportes, implementada y validada.

Resultado actual
El visor comun de reportes conserva el `onClose` funcional y usa el patron visual de `ProjectSectionReportButton`: 40px, radio contenido, sombra soft clara, hover con acento azul, escala activa e inset shadow. `AppModalHeader` queda preparado con props opcionales para personalizar el cierre sin cambiar el default global.

Validacion ejecutada
- `npm run build` OK desde `frontend/`.
- `node scripts/smoke-classic-no-bim-contamination.mjs` OK desde `frontend/`.

Impacto
Frontend clasico de reporting. Sin backend, plantillas, EDO/EDT, rutas BIM, UX BIM ni acoplamientos BIM.

TASK en progreso
`TASK-1591`: politica de borrado seguro de Stakeholders, implementada y validada.

Resultado actual
`Stakeholders` ya no permite borrar un responsable si tiene rol consolidado o uso activo en `EDO`/`EDT`. El backend bloquea el `DELETE /stakeholders/{id}` con `409 Conflict` y el frontend muestra el detalle: primero debe liberarse en EDO/EDT. La regla vive en repositorio backend para evitar huerfanos o cascadas destructivas aunque se llame la API directamente.

Validacion ejecutada
- `python -m py_compile app/repositories/stakeholder.py app/api/endpoints/stakeholders.py` OK.
- `python -m pytest app/tests/test_stakeholder_role_sync.py -q` OK, 4 passed.
- `npm run build` OK desde `frontend/`.
- `node scripts/smoke-classic-no-bim-contamination.mjs` OK desde `frontend/`.

Impacto
Backend comun de Stakeholders/EDO/EDT y frontend clasico de Stakeholders. Sin reporting, UX BIM, rutas BIM ni acoplamientos BIM.

TASK en progreso
`TASK-1587`: boton nuevo de Stakeholders en toolbar oscura, implementada y validada.

Resultado actual
La accion `Nuevo` sale de la cabecera principal de `Stakeholders` y se reubica en el header oscuro del directorio, junto al buscador. El boton queda circular, compacto, sin label visible, con icono `+` en morado y sombra contenida alineada con la familia visual de `Datos de Proyecto`.

Validacion ejecutada
- `npm run build` OK desde `frontend/`.
- `node scripts/smoke-classic-no-bim-contamination.mjs` OK desde `frontend/`.

Impacto
Frontend clasico de Stakeholders. Sin backend, persistencia, reportes, EDO/EDT, UX BIM, rutas BIM ni acoplamientos BIM.

TASK en progreso
`TASK-1586`: toolbar oscura del directorio Stakeholders, implementada y validada.

Resultado actual
El header interno del listado de `Stakeholders` retira los chips `registrados`, `visibles` y el texto auxiliar de busqueda. La franja del buscador pasa a skin oscuro, el campo queda a la izquierda y se conserva la busqueda natural sin acentos como comportamiento no visible.

Validacion ejecutada
- `npm run build` OK desde `frontend/`.
- `node scripts/smoke-classic-no-bim-contamination.mjs` OK desde `frontend/`.

Impacto
Frontend clasico de Stakeholders. Sin backend, persistencia, reportes, EDO/EDT, UX BIM, rutas BIM ni acoplamientos BIM.

TASK en progreso
`TASK-1584` / `TASK-1585`: roles de Stakeholders sincronizados desde EDO/EDT, implementado y validado.

Resultado actual
`Stakeholders` ya no muestra el boton `Roles` ni conserva el modal local de gestion de roles. El catalogo de roles permanece disponible para `EDO` y `EDT`, que son ahora el origen operativo del rol. Al crear o actualizar un nodo stakeholder en EDO/EDT, el backend comun sincroniza `proyecto_stakeholders.rol_id` para que el directorio comun y el reporte de stakeholders muestren el rol consolidado. El fallback visible/documental pasa a `Sin rol asignado`.

Saneamiento ejecutado
Empresa `Santiago Bermeo` (`id=3`), proyecto raiz `SantiagoBermeo-2026-001`: `2` stakeholders sincronizados, `0` sin rol. Backup: `tmp/santiago_bermeo_stakeholder_roles_backup_20260507_192720.json`.

Validacion ejecutada
- `python -m py_compile app/repositories/stakeholder.py app/repositories/edo.py app/repositories/edt.py app/services/reporting.py scripts/sync_santiago_bermeo_stakeholder_roles.py` OK.
- `python -m pytest app/tests/test_stakeholder_role_sync.py app/tests/test_reporting_stakeholders_excel_pdf.py -q` OK, 8 passed.
- `npm run build` OK desde `frontend/`.
- `node scripts/smoke-classic-no-bim-contamination.mjs` OK desde `frontend/`.

Impacto
Frontend clasico de Stakeholders, backend comun de EDO/EDT/Stakeholders y reporting `stakeholders`. Sin UX BIM, rutas BIM, modelos BIM ni acoplamientos BIM.

TASK en progreso
`TASK-1583`: adecuacion visual de Stakeholders al estilo base clasico, implementada y validada.

Resultado actual
Stakeholders adopta una cabecera clara/soft equivalente a `Datos de Proyecto`, workbench soft, toolbar compacta, chips de conteo, busqueda natural y tabla mas densa con header sticky oscuro. Se conserva el morado como identidad en icono y label `Stakeholders`. El modal de alta/edicion queda reorganizado en Identidad, Contacto, Perfil profesional y Ubicacion, con inputs compactos y footer sobrio.

Validacion ejecutada
- `npm run build` OK.
- `node scripts/smoke-classic-no-bim-contamination.mjs` OK desde `frontend/`.
- Busqueda focal en `Stakeholders.jsx` sin referencias BIM.

Impacto
Visual/UX en Stakeholders clasico. Sin backend, persistencia, reportes generados, plantillas, UX BIM, rutas BIM ni acoplamientos nuevos.

TASK en progreso
`TASK-1582`: hotfix de carga de la ruta Proyectos, implementada y validada.

Resultado actual
`/proyectos` vuelve a import directo en `AppRouter.jsx`, eliminando el chunk dinamico `assets/Proyectos-*.js` que provoco `Failed to fetch dynamically imported module` en el entorno publicado. Las secciones internas pesadas del proyecto permanecen con carga diferida.

Validacion ejecutada
- `npm run build` OK.
- El build nuevo ya no genera `assets/Proyectos-*.js`.
- `node scripts/smoke-classic-no-bim-contamination.mjs` OK desde `frontend/`.

Impacto
Frontend clasico, carga de ruta principal de Proyectos. Sin backend, persistencia, reportes, plantillas, UX BIM, rutas BIM ni acoplamientos nuevos.

TASK en progreso
`TASK-1581`: prueba de skin oscuro en cabeceras plegables de Datos de Proyecto, implementada y validada.

Resultado actual
Las cabeceras plegables de Datos de Proyecto usan un skin oscuro tipo Gantt y la cabecera lateral `8. Documentos e imagenes / Repositorio visual del proyecto` queda alineada con el mismo skin. Esa cabecera lateral queda `sticky` dentro del panel derecho para mantenerse visible durante scroll. El cambio queda centralizado en constantes de `DatosProyecto.jsx` para poder revertirlo facilmente. El boton circular de despliegue conserva tamano, forma y animacion; se redujo solo el halo exterior para que no quede difuso sobre el header oscuro. El despliegue ahora usa `CollapsibleSectionBody` con transicion de altura/opacidad, evitando el salto brusco anterior.

Validacion ejecutada
- `npm run build` OK.
- JSON documental OK.
- `node scripts/smoke-classic-no-bim-contamination.mjs` OK desde `frontend/`.

Impacto
Visual/UX en Datos de Proyecto clasico. Sin backend, persistencia, reportes, plantillas, UX BIM, rutas BIM ni acoplamientos nuevos.

TASK en progreso
`TASK-1580`: hints en listados largos de Objetivos, Restricciones y Supuestos en Datos de Proyecto, implementada y validada.

Resultado actual
Los inputs de `Objetivos clave`, `Restricciones conocidas` y `Supuestos iniciales` usan el componente estandar `AppHint` cuando el texto capturado es largo, mostrando el contenido completo sin alterar edicion, serializacion, persistencia, backend ni reportes.

Validacion ejecutada
- `npm run build` OK.
- `node scripts/smoke-classic-no-bim-contamination.mjs` OK desde `frontend/`.

Impacto
Visual/UX en Datos de Proyecto clasico. Sin cambios de backend, persistencia, reportes generados, plantillas, UX BIM, rutas BIM ni acoplamientos nuevos.

TASK en progreso
`TASK-1579`: ajuste visual del footer del visor comun de reportes y alineacion de Especificaciones Tecnicas, implementada y validada.

Resultado actual
El visor comun de reportes vuelve a un pie plano y ligero: `CommonReportPreviewModal` usa `AppModalFooter variant="flat"` con separador sutil y botones de exportacion menos pesados. La variante inset permanece como comportamiento por defecto para otros modales. En Datos de Proyecto, `Normativa aplicable` y `Nivel de complejidad` quedan en la misma linea visual dentro de `2. Especificaciones tecnicas`, con normativa ocupando dos columnas y complejidad la tercera.

Validacion ejecutada
- `npm run build` OK.
- `node scripts/smoke-classic-no-bim-contamination.mjs` OK desde `frontend/`.

Impacto
Visual, frontend clasico. Sin cambios de backend, persistencia, reportes generados, plantillas, UX BIM, rutas BIM ni acoplamientos nuevos.

TASK en progreso
`TASK-1578`: nivel de complejidad en Datos de Proyecto y Acta de Constitucion, implementada y validada.

Resultado actual
Datos de Proyecto clasico incorpora `Nivel de complejidad` en `2. Especificaciones tecnicas` con las opciones Baja, Media, Alta y Muy Alta. El backend guarda el dato en `ProyectoDetalle.nivel_complejidad`, la migracion `ac7d8e9f10a1` ya fue aplicada y el Acta usa ese campo para `#COMPLEJIDAD`, dejando de reutilizar `descripcion_unidad`. `Cliente / Contratante` y `Fuente de financiamiento` permanecen en `4. Informacion contractual y financiera` y alimentan reportes desde sus campos reales.

Validacion ejecutada
- `python -m py_compile backend/app/models/proyecto_detalle.py backend/app/schemas/proyecto_detalle.py backend/app/services/reporting.py backend/app/services/marketplace_checkout.py backend/alembic/versions/ac7d8e9f10a1_add_project_detail_complexity_level.py` OK.
- `python -m pytest app/tests/test_reporting_stakeholders_excel_pdf.py -q` OK, 6 passed.
- `alembic upgrade ac7d8e9f10a1` OK.
- `npm run build` OK.
- `node scripts/smoke-classic-no-bim-contamination.mjs` OK desde `frontend/`.

Impacto
Datos de Proyecto clasico, backend comun de detalle de proyecto y reporte Acta de Constitucion. Sin UX BIM, rutas BIM, modelos BIM ni acoplamientos nuevos.

TASK en progreso
`TASK-1576` / `TASK-1577`: correccion visual real del Acta PDF desde Excel, implementada y validada.

TASK de control asociada
`TASK-1576`: reapertura por salida real no conforme en visor.

Slice actual
`TASK-1577`: imagenes integradas a bloque completo, compactacion universal de cola residual y cache de render `pdf-formal-v7`.

Resultado actual
El PDF desde Excel del Acta ya no dibuja imagenes por su tamano bruto anclado ni como lienzo blanco centrado: calcula el rango real de celdas del placeholder y ocupa el bloque completo. La paginacion queda reforzada con prueba explicita: pagina 1 termina en fila 30 y pagina 2 empieza en fila 31 con `ESPECIFICACIONES TECNICAS Y CONTRACTUALES`. El conversor comun compacta suavemente cualquier reporte cuando la ultima pagina es residual para evitar paginas finales con una sola linea.
El endpoint `/reporting/export` expone `X-GiProy-Report-Render-Version` para verificar que el backend activo ya carga `pdf-formal-v7`.

Validacion ejecutada
- `python -m py_compile backend/app/services/reporting.py` OK.
- `python -m py_compile backend/app/api/endpoints/reporting.py backend/app/services/reporting.py` OK.
- `python -m pytest app/tests/test_reporting_stakeholders_excel_pdf.py -q` OK, 6 passed.
- `node scripts/smoke-classic-no-bim-contamination.mjs` OK.

Impacto
PDF desde Excel en reportes clasicos. Sin cambios en frontend, contratos API, plantillas, modelos, persistencia, UX BIM ni rutas BIM.

TASK en progreso
`TASK-1574` / `TASK-1575`: secciones indivisibles en PDF desde Excel, implementado y validado.

TASK de control asociada
`TASK-1574`: control de cortes de seccion formal en Acta de Constitucion.

Slice actual
`TASK-1575`: agrupacion de cabeceras oscuras y cache de render `pdf-formal-v4`.

Resultado actual
El conversor PDF desde Excel detecta cabeceras oscuras/titulos conocidos y mantiene cada seccion junta cuando cabe en una pagina. En el Acta, `ESPECIFICACIONES TECNICAS Y CONTRACTUALES` queda agrupada de la fila 31 a la 37, evitando que solo se muestre la segunda mitad del bloque.

Validacion ejecutada
- `python -m py_compile backend/app/services/reporting.py` OK.
- `python -m pytest app/tests/test_reporting_stakeholders_excel_pdf.py -q` OK, 4 passed.
- `npm run build` OK.
- `node scripts/smoke-classic-no-bim-contamination.mjs` OK.

Impacto
PDF desde Excel en reportes clasicos. Sin cambios en frontend, contratos API, plantillas, modelos, persistencia, UX BIM ni rutas BIM.

TASK en progreso
`TASK-1572` / `TASK-1573`: proporcion de imagenes en Acta de Constitucion, implementado y validado.

TASK de control asociada
`TASK-1572`: control de imagenes georreferenciacion/referencial dentro del area de pagina.

Slice actual
`TASK-1573`: composicion proporcional de imagenes en placeholders y cache de render `pdf-formal-v3`.

Resultado actual
Las imagenes del Acta se componen ahora en un lienzo del tamano exacto del rango destino, con escala proporcional `contain`, centradas y con margen interno. Esto evita deformaciones y desbordes en PDF desde Excel. La cache de exportaciones queda invalidada por nueva version de render.

Validacion ejecutada
- `python -m py_compile backend/app/services/reporting.py` OK.
- `python -m pytest app/tests/test_reporting_stakeholders_excel_pdf.py -q` OK, 3 passed.
- `npm run build` OK.
- `node scripts/smoke-classic-no-bim-contamination.mjs` OK.

Impacto
Reporte clasico Datos de Proyecto / Acta de Constitucion y PDF desde Excel. Sin cambios en frontend, contratos API, plantillas, modelos, persistencia, UX BIM ni rutas BIM.

TASK en progreso
`TASK-1570` / `TASK-1571`: footer del visor comun de reportes y cache versionada, implementado y validado.

TASK de control asociada
`TASK-1570`: control del pie visual del modal de impresion/reportes.

Slice actual
`TASK-1571`: `CommonReportPreviewModal` compacto y version de cache de exportacion en reporting.

Resultado actual
El footer del visor comun de reportes elimina el texto largo y usa acciones compactas `PDF`, `PDF Excel` y `Excel` con material visual comun, hints y `aria-label`. El cache key de exportaciones incorpora una version de render para que los PDF anteriores al ajuste formal no se reutilicen.

Validacion ejecutada
- `python -m py_compile backend/app/services/reporting.py` OK.
- `python -m pytest app/tests/test_reporting_stakeholders_excel_pdf.py -q` OK, 2 passed.
- `npm run build` OK.
- `node scripts/smoke-classic-no-bim-contamination.mjs` OK.

Impacto
Reportes clasicos y visor comun. Sin cambios en contratos API, plantillas, modelos, persistencia, UX BIM, rutas BIM ni modelos BIM.

TASK en progreso
`TASK-1568` / `TASK-1569`: ajuste formal de salidas PDF en reportes clasicos, implementado y validado.

TASK de control asociada
`TASK-1568`: control de PDF directo vertical y PDF desde Excel ajustado sin recortes.

Slice actual
`TASK-1569`: backend comun de reporting con PDF directo A4 vertical, anchos responsivos y bloques formales agrupados.

Resultado actual
El PDF directo ya no se genera apaisado: usa A4 vertical y calcula resumen, campos, imagenes y tablas contra el ancho real del documento. Excel a PDF conserva apaisado cuando la hoja lo requiere y ajusta alturas efectivas de filas para texto envuelto, reduciendo cortes de informacion. Los bloques principales se agrupan para evitar saltos en mitad de secciones formales cuando hay espacio para moverlos completos.

Validacion ejecutada
- `python -m py_compile backend/app/services/reporting.py` OK.
- `python -m pytest app/tests/test_reporting_stakeholders_excel_pdf.py -q` OK, 2 passed.
- `node scripts/smoke-classic-no-bim-contamination.mjs` OK.

Impacto
Reportes clasicos en backend comun. Sin cambios en frontend, plantillas, contratos API, PostgreSQL, modelos BIM, UX BIM ni rutas BIM.

TASK en progreso
`TASK-1566` / `TASK-1567`: correccion de listados incrementales de Objetivos, Restricciones y Supuestos, implementada y validada.

TASK de control asociada
`TASK-1566`: control de edicion con espacios, alta visible y boton iconico.

Slice actual
`TASK-1567`: parseo/serializacion editable para los tres listados y boton `+` compacto.

Resultado actual
Los campos de Objetivos, Restricciones y Supuestos permiten escribir frases con espacios. El boton `+` crea una fila nueva visible porque las filas vacias se conservan durante la edicion. El boton `+ Agregar` queda reducido al simbolo `+` con `title` y `aria-label`.

Validacion ejecutada
- Prueba focal de serializacion OK.
- `npm run build` OK.
- `npm run smoke:gantt-classic` OK, incluyendo `smoke-classic-no-bim-contamination`.

Impacto
Datos de Proyecto clasico. Sin cambios en backend, reportes documentales, plantillas, modelos BIM, UX BIM ni rutas BIM.

TASK en progreso
`TASK-1564` / `TASK-1565`: precision de intersecciones georreferenciadas en Datos de Proyecto, implementada y validada.

TASK de control asociada
`TASK-1564`: control para evitar posiciones genericas o parciales en busquedas de interseccion.

Slice actual
`TASK-1565`: Overpass como primera via para intersecciones ecuatorianas y limpieza de encabezado del modal.

Resultado actual
El modal de georreferenciacion ya no duplica coordenadas en el encabezado; el titulo queda con mayor jerarquia y las coordenadas permanecen en el panel lateral. Para direcciones tipo `calle principal y calle de interseccion`, el frontend consulta Overpass antes de aceptar respuestas del backend activo; backend comun y fallback frontend tambien cruzan geometrias OSM de ambas calles y solo aceptan resultados que contienen ambas calles. El caso `Miguel Velez y Rafael Maria Arizaga, Cuenca` devuelve `-2.8895224, -79.010998`, `zoom=18`, `source=overpass`.

Validacion ejecutada
- Validacion focal real Overpass OK.
- `python -m py_compile backend/app/api/endpoints/proyecto_detalles.py backend/app/schemas/proyecto_detalle.py` OK.
- `npm run build` OK.
- `npm run smoke:gantt-classic` OK, incluyendo `smoke-classic-no-bim-contamination`.

Impacto
Datos de Proyecto clasico y geocodificacion comun. Sin cambios en reportes documentales, plantillas, modelos BIM, UX BIM ni rutas BIM.

TASK en progreso
`TASK-1562` / `TASK-1563`: busqueda editable y tolerante a acentos en georreferenciacion de Datos de Proyecto, implementada y validada.

TASK de control asociada
`TASK-1562`: control de redefinicion de busqueda dentro del modal de georreferenciacion.

Slice actual
`TASK-1563`: input editable junto a `Localizar`, apertura con busqueda inmediata y variantes con/sin acentos.

Resultado actual
El boton de mapa junto a `Direccion Exacta` abre la vista completa y ejecuta la localizacion sin segundo clic. El modal de georreferenciacion incluye un campo editable junto a `Localizar`; al pulsar Enter o el boton se busca con ese texto. Backend comun y fallback temporal de navegador expanden variantes con y sin diacriticos, incluyendo aliases como `Simon`/`Simón` y `Bolivar`/`Bolívar`.

Validacion ejecutada
- `python -m py_compile backend/app/api/endpoints/proyecto_detalles.py backend/app/schemas/proyecto_detalle.py` OK.
- Prueba focal de candidatos con `Av. Simon Bolivar y Av. Loja` y `Av. Simón Bolívar y Av. Loja` OK.
- `npm run build` OK.
- `npm run smoke:gantt-classic` OK, incluyendo `smoke-classic-no-bim-contamination`.

Impacto
Datos de Proyecto clasico y geocodificacion comun. Sin cambios en modelos, reportes documentales, plantillas, UX BIM, rutas BIM ni acoplamientos BIM.

TASK en progreso
`TASK-1560` / `TASK-1561`: compatibilidad de localizacion asistida ante backend activo sin reinicio, en validacion visual del usuario.

TASK de control asociada
`TASK-1560`: control del 405 `Method Not Allowed` en `geocode-address`.

Slice actual
`TASK-1561`: fallback de navegador para `Localizar` cuando el backend devuelve `404` o `405`.

Resultado actual
El codigo backend del endpoint nuevo esta correcto, pero el servicio activo en `localhost:3001` no lo tenia cargado y respondia 405. No se pudo reiniciar por permisos del sistema. `DatosProyecto` ahora intenta primero `proyectoDetalleApi.geocodeAddress`; si el backend devuelve `404` o `405`, usa un fallback modular de navegador con las mismas variantes de direccion ecuatoriana.

Validacion ejecutada
- `npm run build` OK.
- `npm run smoke:gantt-classic` OK, incluyendo `smoke-classic-no-bim-contamination`.

Impacto
Datos de Proyecto clasico, compatibilidad temporal de geocodificacion. Sin cambios en modelo, persistencia, reportes, cache oficial, plantillas ni BIM.

TASK en progreso
`TASK-1558` / `TASK-1559`: mejora de geocodificacion para direcciones ecuatorianas por interseccion en validacion visual del usuario.

TASK de control asociada
`TASK-1558`: control del patron Ecuador `calle principal + interseccion`.

Slice actual
`TASK-1559`: backend de `geocode-address` genera variantes de interseccion y reordena consultas de direccion.

Resultado actual
El backend reconoce direcciones como `Av. 12 de Abril y Av. Loja` dentro del campo unico `direccion`, genera variantes con `y`, `&`, `con`, `/` y coma, y agrega fallbacks por calle principal/calle de interseccion. Tambien deduplica contexto para evitar `Cuenca, Cuenca` cuando ciudad y canton coinciden.

Validacion ejecutada
- `python -m py_compile backend/app/api/endpoints/proyecto_detalles.py backend/app/schemas/proyecto_detalle.py` OK.
- Prueba focal de candidatos para `Av. 12 de Abril y Av. Loja`, `Cuenca`, `Azuay`, `Ecuador`: OK.
- `npm run build` OK.
- `npm run smoke:gantt-classic` OK, incluyendo `smoke-classic-no-bim-contamination`.

Impacto
Datos de Proyecto clasico y backend comun de geocodificacion. Sin cambios en modelo, persistencia, cache de reportes, plantillas, UX BIM ni acoplamientos BIM.

TASK en progreso
`TASK-1556` / `TASK-1557`: recuperacion de localizacion asistida por direccion en Datos de Proyecto en validacion visual del usuario.

TASK de control asociada
`TASK-1556`: control de geocodificacion asistida desde backend comun.

Slice actual
`TASK-1557`: endpoint backend `POST /proyecto-detalles/geocode-address` y frontend consumiendo `proyectoDetalleApi.geocodeAddress`.

Resultado actual
La accion `Localizar` ya no llama directamente a `nominatim.openstreetmap.org` desde el navegador. El backend comun construye candidatos de direccion, consulta Nominatim con `User-Agent`/`Referer` de GiProy y devuelve latitud, longitud, zoom y mensaje de precision. `DatosProyecto` actualiza coordenadas/zoom y marca la cache del mapa como `pending` para regeneracion posterior.

Validacion ejecutada
- `python -m py_compile backend/app/api/endpoints/proyecto_detalles.py backend/app/schemas/proyecto_detalle.py` OK.
- `npm run build` OK.
- `npm run smoke:gantt-classic` OK, incluyendo `smoke-classic-no-bim-contamination`.

Impacto
Datos de Proyecto clasico y backend comun de proyecto-detalles. Sin cambios en UX BIM, rutas BIM, modelos BIM, reportes documentales, plantillas ni acoplamientos hacia BIM.

TASK en progreso
`TASK-1554` / `TASK-1555`: limpieza visual de georreferenciacion lateral en Datos de Proyecto en validacion visual del usuario.

TASK de control asociada
`TASK-1554`: control de retirada de labels laterales y ampliacion de mapa.

Slice actual
`TASK-1555`: Datos de Proyecto clasico amplia el mapa lateral y conserva feedback solo en vista completa.

Resultado actual
La tarjeta lateral de georreferenciacion ya no muestra el bloque `Resultado de localizacion` ni la nota auxiliar bajo el mapa. El contenedor del mapa lateral pasa de `270px` a `350px`. La vista completa mantiene el resultado de localizacion para no perder feedback durante la edicion.

Validacion ejecutada
- `npm run build` OK.
- `npm run smoke:gantt-classic` OK, incluyendo `smoke-classic-no-bim-contamination`.
- Busqueda focal confirma que `Resultado de localizacion` permanece solo en la vista completa.

Impacto
Datos de Proyecto clasico, UX puntual de georreferenciacion lateral. Sin cambios en backend, reportes, cache georreferenciada, plantillas, persistencia, permisos ni BIM.

TASK en progreso
`TASK-1552` / `TASK-1553`: plantilla ampliada de Datos de Proyecto / Acta de Constitucion en validacion visual del usuario.

TASK de control asociada
`TASK-1552`: control de sustitucion de plantilla productiva y cobertura de placeholders.

Slice actual
`TASK-1553`: copia de plantilla ampliada a `docs/reportes` y ajuste del backend para sus 32 placeholders.

Resultado actual
`docs/reportes/001 - Acta de Constitucion - General.xlsx` queda sustituida por la plantilla ampliada de `tmp/adicionar`. `backend/app/services/reporting.py` cubre los nuevos placeholders de alcance, medicion, presupuesto, cliente, objetivos, restricciones y supuestos, e inserta georreferenciacion/imagen referencial antes del reemplazo textual para que Excel y PDF desde Excel mantengan imagenes.

Validacion ejecutada
- `python -m py_compile backend/app/services/reporting.py` OK.
- Validacion focal de plantilla ampliada: 32 placeholders cubiertos, 2 imagenes insertadas y 0 placeholders residuales.
- Generacion real proyecto `7`, empresa `3`: `tmp/acta_constitucion_ampliada_validacion.xlsx`, 83 KB, 2 imagenes y 0 placeholders residuales.
- Preview real `acta_constitucion` proyecto `7`: OK, 27 campos, mapa e imagen disponibles.
- `npm run smoke:gantt-classic` OK, incluyendo `smoke-classic-no-bim-contamination`.

Impacto
Reporte clasico Datos de Proyecto / Acta de Constitucion y plantilla Excel productiva. Sin cambios BIM, sin UX BIM y sin acoplamientos nuevos.

TASK en progreso
`TASK-1550` / `TASK-1551`: cache universal de mapa georreferenciado por proyecto en validacion visual del usuario.

TASK de control asociada
`TASK-1550`: control de referencia georreferenciada unica por proyecto.

Slice actual
`TASK-1551`: persistencia y refresco recuperable de `georreferenciacion.png` para reportes de Datos de Proyecto.

Resultado actual
Datos de Proyecto clasico guarda metadatos de cache georreferenciada en `proyecto_detalles`. Al guardar coordenadas/zoom se intenta generar `uploads/proyectos/{empresa_id}/{codigo_root}/georef/georreferenciacion.png`; si falla, queda `pending` con error trazable y se reintenta al leer el detalle o generar reportes. Reporting usa primero la imagen cacheada vigente y solo despues recompone mapa/fallbacks.

Validacion ejecutada
- `python -m py_compile backend/app/services/reporting.py backend/app/api/endpoints/proyecto_detalles.py backend/app/models/proyecto_detalle.py backend/app/schemas/proyecto_detalle.py backend/alembic/versions/ab6c7d8e9f10_project_georef_map_cache.py` OK.
- `alembic upgrade ab6c7d8e9f10` OK sobre la rama de georreferenciacion.
- `npm run build` OK.
- `npm run smoke:gantt-classic` OK, incluyendo `smoke-classic-no-bim-contamination`.

Impacto
Backend comun y Datos de Proyecto clasico. La georreferenciacion es unica por proyecto, no por usuario ni por revision. Sin cambio de proveedor de mapas y sin tocar BIM.

TASK en progreso
`TASK-1548` / `TASK-1549`: georreferenciacion real en reportes de Datos de Proyecto en validacion visual del usuario.

TASK de control asociada
`TASK-1548`: control de imagen real de mapa para Acta de Constitucion.

Slice actual
`TASK-1549`: backend reporting compone mapa desde teselas OSM usando `latitud`, `longitud` y `map_zoom` del proyecto.

Resultado actual
`backend/app/services/reporting.py` intenta ahora generar primero un PNG real con teselas `tile.openstreetmap.org`, centrado en la coordenada del proyecto y con el zoom guardado por el usuario. El static map externo queda como segunda via y el snapshot sintetico queda solo como ultimo fallback. Se cachean teselas e imagen final.

Validacion ejecutada
- `python -m py_compile backend/app/services/reporting.py` OK.
- Prueba focal con red: `_build_project_osm_tile_map_bytes(...)` genero PNG real de `85606` bytes.
- `npm run smoke:gantt-classic` OK, incluyendo `smoke-classic-no-bim-contamination`.

Impacto
Backend comun de reporting para Datos de Proyecto clasico. Sin cambios en modelo de datos, APIs publicas, frontend, plantillas, permisos, persistencia ni BIM.

TASK en progreso
`TASK-1546` / `TASK-1547`: cierre de homogeneidad de hints visuales con `AppHint` en validacion visual del usuario.

TASK de control asociada
`TASK-1546`: control del segundo pase de hints visuales restantes.

Slice actual
`TASK-1547`: migracion de Curva S/chips de Cronogramas, descripcion de Bases de Trabajo, `MarketplaceOriginBadgeSet` y ayuda de tramos automaticos a `AppHint`.

Resultado actual
El sistema visual de hints queda concentrado en `AppHint` con variantes clara y oscura. Los casos visuales detectados fuera del primer pase ya no mantienen tooltips propios ni portales locales. Los `title` nativos restantes se consideran fallback accesible en botones, modales, campos o celdas truncadas, no un sistema visual paralelo.

Validacion ejecutada
- `npm run build` OK.
- `npm run smoke:gantt-classic` OK, incluyendo `smoke-classic-no-bim-contamination`.

Impacto
Frontend clasico y componentes comunes no BIM. Sin cambios en backend, APIs, PostgreSQL, calculos, reportes documentales, exportaciones, permisos, persistencia ni BIM.

TASK en progreso
`TASK-1544` / `TASK-1545`: estandarizacion transversal de hints claros y oscuros en validacion del usuario; no cerrar sin confirmacion visual expresa.

TASK de control asociada
`TASK-1544`: control del patron comun `AppHint` para hints visuales clasicos.

Slice actual
`TASK-1545`: helper `AppHint` y migracion de wrappers existentes en Gantt, rail oscuro, presupuesto, catalogo lateral y boton generico de reportes.

Resultado actual
Se crea `frontend/src/components/ui/AppHint.jsx` con variantes `light` y `dark`, portal y parametros de posicionamiento. `GanttHeaderTooltip`, `ControlRailTooltip`, `BudgetToolbarTooltip`, `CatalogSidebarCard` y `ProjectSectionReportButton` usan el helper comun para una lectura homogenea. El boton generico de reportes mantiene `aria-label` y evita tooltip nativo visible cuando ya hay hint visual.

Validacion ejecutada
- `npm run build` OK.
- `npm run smoke:gantt-classic` OK, incluyendo `smoke-classic-no-bim-contamination`.

Impacto
Frontend clasico, patron visual transversal de hints/tooltips. Sin cambios en calculos, reportes documentales, preview/export, backend, APIs, PostgreSQL, permisos, persistencia ni BIM. No cerrar hasta confirmacion visual expresa del usuario.

TASK en progreso
`TASK-1542` / `TASK-1543`: compactacion transversal de botones de reportes de Proyecto en validacion del usuario; no cerrar sin confirmacion visual expresa.

TASK de control asociada
`TASK-1542`: control del patron icon-only compacto para reportes en subsecciones principales de Proyecto.

Slice actual
`TASK-1543`: `ProjectSectionReportButton` icon-only y Presupuesto alineado al boton comun.

Resultado actual
`ProjectSectionReportButton` ya no renderiza el boton stacked grande con label `Reporte`; ahora muestra solo el icono de reporte en un boton compacto con `title`/`aria-label`. `PresupuestoDetail` adopta el mismo componente comun y conserva su funcionalidad de abrir la configuracion de reporte profesional.

Validacion ejecutada
- `npm run build` OK.
- `npm run smoke:gantt-classic` OK, incluyendo `smoke-classic-no-bim-contamination`.

Impacto
Proyecto clasico frontend, solo patron visual y reutilizacion del boton de reportes. Sin cambios en preview/export, reporting service, backend, plantillas, calculos, persistencia ni BIM. No cerrar hasta confirmacion visual expresa del usuario.

TASK en progreso
`TASK-1540` / `TASK-1541`: limpieza visual del header de Cronograma Valorado en validacion del usuario; no cerrar sin confirmacion visual expresa.

TASK de control asociada
`TASK-1540`: control de retiro de labels no operativos del header oscuro de Cronograma Valorado.

Slice actual
`TASK-1541`: retiro del titulo `Cronograma valorado` y subtitulo `Matriz base del presupuesto`.

Resultado actual
El header oscuro de Cronograma Valorado ya no muestra el bloque textual superior. Se conserva la barra operativa de controles y acciones, sin cambios en reportes, Gantt, cash flow, footer, calculos, backend ni persistencia.

Validacion ejecutada
- `npm run build` OK.
- `npm run smoke:gantt-classic` OK, incluyendo `smoke-classic-no-bim-contamination`.

Impacto
Cronogramas clasicos frontend, solo limpieza visual de header en Cronograma Valorado. Sin UX BIM, rutas BIM ni acoplamientos nuevos. No cerrar hasta confirmacion visual expresa del usuario.

TASK en progreso
`TASK-1538` / `TASK-1539`: compactacion de bordes del rail de proyecto clasico en validacion del usuario; no cerrar sin confirmacion visual expresa.

TASK de control asociada
`TASK-1538`: control de alineacion del rail lateral con botones de trabajo clasicos.

Slice actual
`TASK-1539`: reversion del boton suave intermedio, refuerzo de bordes, compactacion del estado colapsado, prueba modular de reveal del label, suavizado de apertura del panel y estabilizacion de caja interna de botones.

Resultado actual
El rail vertical de `Proyectos` conserva el boton anterior con activo oscuro. Se descarta la version intermedia mas pesada, se agregan bordes sutiles al boton y al contenedor del icono, el boton mantiene `w-full h-[58px]` en colapsado y expandido para evitar salto horizontal interno, se muestra el punto de color del modulo activo centrado verticalmente sobre el borde derecho en colapsado, se prueba una animacion modular de reveal del label al expandir y el contenedor abre/cierra con `MotionAside` por `spring`.

Diagnostico actual
La brusquedad no venia del `spring` del panel, sino del cambio inmediato de clases internas del boton: de caja fija centrada (`mx-auto w-[58px]`) a caja expandida (`w-full justify-start px-4`). Se estabiliza esa caja para que el boton crezca junto al panel.

Validacion ejecutada
- `npm run build` OK.
- `npm run smoke:gantt-classic` OK, incluyendo `smoke-classic-no-bim-contamination`.
- `npx eslint src/pages/Proyectos.jsx src/components/projects/ProjectSectionNavButton.jsx` quedo bloqueado en una pasada intermedia por deuda previa de `Proyectos.jsx` no relacionada con este slice.

Impacto
Proyectos clasico frontend, solo capa visual del rail de secciones. Sin cambios en permisos, rutas, reportes de cronogramas, backend, persistencia ni BIM. No cerrar hasta confirmacion visual expresa del usuario.

TASK en progreso
`TASK-1536` / `TASK-1537`: selector explicito de reportes de Cronogramas clasicos en validacion del usuario; no cerrar sin confirmacion expresa.

TASK de control asociada
`TASK-1536`: control de adecuacion de accesos a reportes de cronogramas.

Slice actual
`TASK-1537`: menu explicito de variantes de reporte documental.

Resultado actual
El boton `Reporte` de Cronograma Valorado deja de depender de una pestaña visible `flujo_caja` ya retirada y abre opciones explicitas: `Cronograma valorado`, `Flujo de caja` y `Reporte integrado`. En Gantt, el menu separa `Reporte Gantt`, `Reporte integrado` y `MS Project`, manteniendo la interoperabilidad MS Project como accion aparte. La exportacion usa la variante real del preview cuando existe.

Validacion ejecutada
- `npm run build` OK.
- `npm run smoke:gantt-classic` OK, incluyendo `smoke-classic-no-bim-contamination`.

Impacto
Cronogramas clasicos frontend, solo acceso/seleccion de variantes de reporte. Sin cambios backend, `reporting_service`, `cash_flow`, `footer`, calculos, Gantt, Cronograma Valorado, Presupuesto/APU, persistencia ni BIM. No cerrar hasta confirmacion expresa del usuario en UI real.

TASK en progreso
`TASK-1534` / `TASK-1535`: buscador claro en Desagregacion dentro de rail oscuro en validacion del usuario; no cerrar sin confirmacion expresa.

TASK de control asociada
`TASK-1534`: control visual de buscador claro en Desagregacion.

Slice actual
`TASK-1535`: ajuste conservador del `ClearSearchField` principal de Desagregacion.

Resultado actual
El buscador principal de Desagregacion mantiene el rail oscuro, pero el campo de edicion pasa a fondo blanco explicito con borde claro, inset shadow, texto oscuro, placeholder gris e icono con foco naranja. Se conserva el boton `Sgte`, el contador y la navegacion de coincidencias.

Validacion ejecutada
- `npm run build` OK.
- `npm run smoke:gantt-classic` OK, incluyendo `smoke-classic-no-bim-contamination`.

Impacto
Desagregacion clasica frontend, solo capa visual. Sin cambios de busqueda funcional, CPC, VAE, reportes, persistencia, backend ni BIM. No cerrar hasta confirmacion expresa del usuario en UI real.

TASK en progreso
`TASK-1532` / `TASK-1533`: altura uniforme de islas del rail superior en Gantt clasico en validacion del usuario; no cerrar sin confirmacion expresa.

TASK de control asociada
`TASK-1532`: control visual de altura uniforme en islas de funciones del rail Gantt.

Slice actual
`TASK-1533`: normalizacion conservadora de altura vertical en rail superior Gantt.

Resultado actual
Las tres islas principales del rail superior oscuro de Gantt comparten una altura visual comun de `60px`. Las secciones internas ocupan el alto completo para que busqueda, navegacion critica y herramientas/zoom queden alineadas verticalmente sin cambiar iconos, acciones, tooltips ni comportamiento.

Validacion ejecutada
- `npm run build` OK.
- `npm run smoke:gantt-classic` OK, incluyendo `smoke-classic-no-bim-contamination`.

Impacto
Gantt clasico frontend, solo capa visual. Sin cambios de calculo, dependencias, rutas, drag, zoom funcional, persistencia, backend, Presupuesto/APU, Cronograma Valorado ni BIM. No cerrar hasta confirmacion expresa del usuario en UI real.

TASK en progreso
`TASK-1530` / `TASK-1531`: subbarra financiera operativa en Cronograma Valorado clasico en validacion del usuario; no cerrar sin confirmacion expresa.

TASK de control asociada
`TASK-1530`: control de subbarra financiera compacta, operativa y sin choque de controles.

Slice actual
`TASK-1531`: el boton universal del rail superior alterna resumen compacto/completo y la subbarra financiera queda siempre visible.

Resultado actual
Se elimina el boton circular local de la subbarra financiera y su funcionalidad pasa al boton universal. La subbarra queda en una sola linea con chips operativos de `Estado`, `Origen`, `Total`, `Pico` y `Riesgo`/`Pendiente`, siguiendo una semantica visual compacta similar a Presupuesto y llevando el detalle secundario a tooltips. Correccion posterior: el `Resumen compacto` inferior adopta tambien chips compactos tipo Presupuesto, alineados a la derecha, con datos operativos visibles y conserva su skin oscuro. El bloque `Impacto reconciliacion` pasa a `Semaforo reconciliacion` con estados `OK`, `Impacto` y `Revisar`. La cabecera refuerza `Cronograma valorado` como titulo principal y deja `Matriz base del presupuesto` como descripcion secundaria. Las tabs del valorado quedan alineadas a la derecha dentro del rail y la busqueda se reubica entre grupos de acciones con mayor ancho util. La subbarra superior de chips de `Inversion` adopta gris neutro operativo. Las opciones de configuracion del valorado quedan compactadas e integradas como banda oscura bajo el header general del panel; el semaforo de reconciliacion se une al grupo de chips de lectura y los controles quedan agrupados a la derecha como acciones independientes. El expansor de `Curva S` queda contenido en la zona de trabajo entre header oscuro y footer oscuro, se contrae al cambiar de seccion y la linea acumulada cruza sus puntos de inflexion. El mando del resumen inferior usa icono de lista/detalle.

Validacion ejecutada
- `npm run build` OK.
- `npm run smoke:gantt-classic` OK, incluyendo `smoke-classic-no-bim-contamination`.

Impacto
Cronograma Valorado clasico frontend. Sin backend, sin cambios de calculo, sin cambios en `footer`, `cash_flow`, `Gantt -> Valorado -> Caja`, `Recalcular desde Gantt`, Presupuesto/APU, `CronogramaGantt`, licencias ni BIM. No cerrar hasta confirmacion expresa del usuario en UI real.

TASK en progreso
`TASK-1528` / `TASK-1529`: resumen economico compacto/completo en Cronograma Valorado clasico en validacion del usuario; no cerrar sin confirmacion expresa.

TASK de control asociada
`TASK-1528`: control de resumen economico mixto compacto/completo.

Slice actual
`TASK-1529`: el boton circular de la franja financiera alterna el resumen inferior compacto/completo.

Resultado actual
El resumen economico inferior queda en modo compacto por defecto con una sola linea de total, pico, avance y cantidad de periodos. El boton circular existente de la franja `Lectura financiera` deja de plegar esa franja y ahora despliega o repliega el resumen completo de 4 filas. La franja financiera permanece siempre compacta en una sola linea.

Validacion ejecutada
- `npm run build` OK.
- `npm run smoke:gantt-classic` OK, incluyendo `smoke-classic-no-bim-contamination`.

Impacto
Cronograma Valorado clasico frontend. Sin backend, sin cambios de calculo, sin cambios en `footer`, `cash_flow`, `Gantt -> Valorado -> Caja`, `Recalcular desde Gantt`, Presupuesto/APU, `CronogramaGantt`, licencias ni BIM. No cerrar hasta confirmacion expresa del usuario en UI real.

TASK en progreso
`TASK-1526` / `TASK-1527`: unificacion visual de `Inversion` y `Flujo caja` en Cronograma Valorado clasico en validacion del usuario; no cerrar sin confirmacion expresa.

TASK de control asociada
`TASK-1526`: control de unificacion visual inversion/caja dentro de Cronograma Valorado.

Slice actual
`TASK-1527`: `Inversion` absorbe la lectura financiera de caja sin tocar calculos ni contratos backend.

Resultado actual
Se retira la pestaña visible separada `Flujo caja` y se integra su lectura como bloque plegable `Lectura financiera` dentro de `Inversion`. Ajuste posterior: la franja queda reducida a una sola linea horizontal con indicadores semaforizados, datos secundarios en tooltip nativo y acciones en botones de icono. Se conserva internamente `cash_flow` para origen, total, pico, horas efectivas, categorias, consistencia, restriccion financiera, propuestas y reportes. El pie de la matriz queda como lectura economica unica: `Inversion periodo`, `Inversion acumulada`, `% periodo` y `% acumulado`.

Validacion ejecutada
- `npm run build` OK.
- `npm run smoke:gantt-classic` OK, incluyendo `smoke-classic-no-bim-contamination`.
- Validacion repetida tras compactar la franja financiera: `npm run build` OK y `npm run smoke:gantt-classic` OK.

Impacto
Cronograma Valorado clasico frontend. Sin backend, sin cambios de calculo, sin cambios en `Gantt -> Valorado -> Caja`, sin cambios en `Recalcular desde Gantt`, sin Presupuesto/APU, sin `CronogramaGantt`, sin licencias y sin BIM. No cerrar hasta confirmacion expresa del usuario en UI real.

TASK en progreso
`TASK-1524` / `TASK-1525`: guia visual de inicio y fin de proyecto en Gantt clasico en validacion del usuario; no cerrar sin confirmacion expresa.

TASK de control asociada
`TASK-1524`: control de guia visual de limites de proyecto del Gantt clasico.

Slice actual
`TASK-1525`: el timeline del Gantt clasico muestra lineas verticales sutiles para inicio y fin de proyecto y atenúa las zonas fuera del rango del proyecto.

Resultado actual
Se incorpora una capa visual no interactiva sobre el timeline: atenua el tiempo anterior al inicio y posterior al fin del proyecto, y marca ambos limites con lineas finas. La capa usa `pointer-events: none`, queda separada del motor de dependencias y no modifica fechas, calendario, reglas `FS/SS/FF/SF`, preview, commit, backend ni datos persistidos. Ajuste posterior: las lineas se pintan como cajas reales de `1px` clampadas dentro del timeline para que no se recorten en el borde visible, el zoom por slider fuerza refresco estable de viewport/rutas en doble frame, el rango visual añade aire dinamico antes/despues del proyecto desde un minimo de `96px`, simetrico para inicio y fin, y las guias bajan a plano de fondo para no competir con rutas/hitos cuando coinciden. Ajuste posterior de hito: las rutas que entran o salen de hitos usan siempre el centro del rombo como ancla temporal; inicio/fin exacto de proyecto solo afecta a la representacion visual del rombo frente a la guia.

Validacion ejecutada
- `node scripts/smoke-cronogramas-gantt-zoom.mjs` OK.
- `node scripts/smoke-cronogramas-gantt-manual-milestone-drag.mjs` OK.
- `node scripts/smoke-cronogramas-gantt-dependencies.mjs` OK.
- `node scripts/smoke-cronogramas-gantt-manual-milestone-dependencies.mjs` OK.
- `npm run smoke:gantt-classic` OK, incluyendo `smoke-classic-no-bim-contamination`.
- `npm run build` OK.

Impacto
Gantt clasico frontend, solo capa visual. Sin backend nuevo, sin Presupuesto/APU, sin Cronograma Valorado directo, sin licencias y sin BIM. No cerrar hasta confirmacion expresa del usuario.

TASK en progreso
`TASK-1522` / `TASK-1523`: saneamiento visual de zoom fluido del Gantt clasico en validacion del usuario; no cerrar sin confirmacion expresa.

TASK de control asociada
`TASK-1522`: control de zoom fluido y foco temporal del Gantt clasico.

Slice actual
`TASK-1523`: el zoom del Gantt clasico mantiene foco en el inicio temporal de la tarea/hito seleccionado, agrupa cambios por frame y refresca rutas despues de estabilizar viewport/virtualizacion.

Resultado actual
Se corrige la causa visual de rutas incoherentes tras zoom: `dependencyPaths` podia medir DOM con zoom nuevo pero `scrollLeft`/ventana virtual anterior, y solo quedaba bien al desplazar el viewport. `captureTimelineAnchor(...)` prioriza el inicio temporal de la tarea/hito seleccionado y mantiene el centro visible si no hay seleccion. Los cambios por rueda/slider se agrupan por `requestAnimationFrame`; la rueda acumula contra el zoom pendiente, no contra un `zoomLevel` antiguo. Tras aplicar el `scrollLeft` anclado se fuerzan snapshots horizontal/vertical y refresco de rutas en doble frame. No se tocan reglas `FS/SS/FF/SF`, `buildDependentScheduleDrafts`, `previewCommitContract`, calendario laboral, backend ni datos reales.

Refuerzo actual
El zoom con seleccion centra el inicio visual real de la tarea/hito/subtramo seleccionado, incluyendo `gantt_subbars`, para que una pieza mayor que el viewport mantenga visible su punto de entrada. Las rutas `hito -> tarea` sin lag evitan rodeos heredados, la capa interactiva de dependencias se desactiva durante scroll/zoom reducido y los hitos se elevan por encima del SVG de rutas para no perder captura de drag tras zoom.

Correccion posterior
En escala hora/zoom alto, el rombo del hito seguia pareciendo fuera de posicion porque su `left` visual coincidia con la fecha real. Se centra el rombo sobre esa fecha, de modo que el centro del hito y la salida de la ruta representan el mismo instante temporal.

Validacion ejecutada
- `node scripts/smoke-cronogramas-gantt-dependencies.mjs` OK.
- `node scripts/smoke-cronogramas-gantt-manual-milestone-drag.mjs` OK.
- `node scripts/smoke-cronogramas-gantt-manual-milestone-dependencies.mjs` OK.
- `node scripts/smoke-cronogramas-gantt-zoom.mjs` OK.
- `node scripts/smoke-gantt-preview-commit-double-blind.mjs` OK con `1326` comprobaciones.
- `npm run smoke:gantt-classic` OK, incluyendo `smoke-classic-no-bim-contamination`.
- `npm run build` OK.

Impacto
Gantt clasico frontend y QA visual de zoom; sin cambio de calculo, sin backend nuevo, sin Presupuesto/APU, sin Cronograma Valorado directo, sin licencias y sin BIM. No cerrar hasta confirmacion expresa del usuario.

Nota de datos
Santiago Bermeo queda coherente tras el undo defectuoso observado: hito manual `hm-mok8sj9c-j04f` en `2026-05-12T08:00:00`, sucesora `49` en `2026-05-12T08:00:00 -> 2026-05-12T10:18:43`; backup `tmp/santiago_bermeo_gantt_manual_boundary_backup_20260506_185537.json`.

Nota operativa
No se pudo reiniciar `GiProy-Frontend` desde Codex: Windows devolvio `Acceso denegado` al servicio. El build queda generado con bundle `CronogramaGantt-BF4h7_AQ.js`; si la UI servida conserva codigo anterior, hay que reiniciar el frontend fuera de esta sesion o refrescar la instancia que sirve Vite.

TASK en progreso
`TASK-1515`: saneamiento integral preview/commit de movimiento Gantt clasico sigue en validacion del usuario; se corrigio el borde negativo de fin de jornada y duracion cero.

TASK en progreso
`TASK-1516`: saneamiento real del Gantt de `Santiago Bermeo` ejecutado y pendiente de confirmacion expresa del usuario.

TASK de control asociada
`TASK-1511`: frente Gantt clasico en validacion del usuario, no cerrado.

Slice actual
`TASK-1516`: reparacion de datos reales despues de que el hito manual `hm-mok8sj9c-j04f` quedara huerfano (`successor_dependencies: []`) y desplazado a `2026-06-02T08:00:00`.

Resultado actual
Se ejecuto `tmp/rebuild_santiago_gantt_dependencies_clean.py`. El script creo backup `tmp/santiago_bermeo_gantt_clean_rebuild_backup_20260506_113203.json` y snapshot `tmp/santiago_bermeo_gantt_relations_snapshot_20260506_113203.json`; restauro el hito a `2026-03-24T08:00:00`, reinyecto la relacion manual `FS -> linea 49` y recalculo `187` filas. La linea `49` queda `2026-03-24T08:00:00 -> 2026-03-24T10:18:43`.

Validacion ejecutada
- `python tmp/audit_santiago_gantt_full.py` OK: `187` filas, `0` tareas antes del inicio, `0` incidencias.
- `python tmp/validate_santiago_gantt_integrity.py` OK: `dependency_issue_count=0`.
- `python tmp/validate_santiago_gantt_rules_independent.py` OK: `29` dependencias linea-linea (`28 FS`, `1 FF`), `1` hito-linea, `manual_dependency_checks=1`, `issues_count=0`.
- `python tmp/audit_santiago_gantt_links.py` OK: hito enlazado contra linea `49`.
- `npm run smoke:gantt-classic` OK, incluyendo `smoke-classic-no-bim-contamination`.

Impacto
Datos reales del Gantt clasico de `Santiago Bermeo`; sin UX BIM, sin rutas BIM, sin dependencias BIM y sin acoplamientos nuevos. No cerrar hasta confirmacion expresa del usuario.

TASK en progreso
`TASK-1511` / `TASK-1515`: saneamiento integral preview/commit de movimiento Gantt clasico pendiente de confirmacion expresa del usuario.

TASK de control asociada
`TASK-1511`: en validacion del usuario, no cerrada.

Slice actual
`TASK-1515`: saneamiento integral preview/commit de movimiento Gantt aplicado y pendiente de validacion visual/funcional del usuario. `TASK-1512` y `TASK-1513` quedan como diagnostico/implementacion previa absorbidos. `TASK-1514` no se usa como evidencia DOM por instruccion expresa.

Resultado actual
Se aplica saneamiento del calculo integral de movimiento en Gantt clasico y de la frontera entre modos de interaccion. La causa no era solo dibujo: preview y commit podian reinterpretar la red completa con `buildDependentScheduleDrafts(...)` y, ademas, el cuerpo del hito manual podia activar `beginDependencyLinkFromDragInteraction(...)` por deriva vertical, mezclando preview de movimiento con preview de enlace/lag. Ahora el preview guarda `previewCommitContract`; al soltar se recalcula el commit y se bloquea si difiere. El hito manual usa `resolveManualMilestoneMovePreview(...)`, traslada cascada con `buildManualMilestoneCascadeShiftDrafts(...)`, conserva `start_date === end_date`, muestra fecha-hora y delta real en el helper, apaga el preview si `effectiveLaborDelta` es cero, no inicia dependencias desde el cuerpo, desactiva la capa interactiva/guia generica incompatible durante ese modo y limpia previews incompatibles al cambiar entre drag y enlace explicito. Correccion posterior: el commit de hito manual usa la version efectiva con overlays de `successor_dependencies`, preserva sucesoras al mover y cancela si un hito con sucesoras no genera cascada dependiente.

Validacion ejecutada
- `node scripts/smoke-cronogramas-gantt-manual-milestone-drag.mjs` OK.
- `node scripts/smoke-gantt-preview-commit-double-blind.mjs` OK con `1326` comprobaciones: `78` temporales + `1248` de puntero/escala/scroll, cubriendo `6` nodos movidos, `13` deltas temporales (`0 min`, minutos, horas, media jornada, dias completos, cruce de fin de semana y desplazamientos negativos), escalas dia/semana/mes, scroll virtual, ruido subpixel, tareas, hitos, duracion cero y `FS/SS/FF/SF`.
- `npm run smoke:gantt-classic` OK, incluyendo `smoke-classic-no-bim-contamination`.
- `npm run build` OK.
- Sin DOM como evidencia de cierre por instruccion expresa del usuario y por comportamiento no fiable en este caso.
- No cerrado: queda pendiente la confirmacion expresa del usuario.

Impacto
UI/calculo de interaccion Gantt clasico; sin backend nuevo, sin datos productivos, sin Presupuesto/APU, sin Cronograma Valorado directo, sin licencias y sin BIM.

TASK en progreso
Sin TASK activa real.

TASK de control asociada
`TASK-1510`: completada al 100%.

Slice actual
`TASK-1510`: correccion en Gantt clasico para que el drag/drop de hitos manuales use el delta horizontal real del puntero al soltar y para que las rutas SVG durante el preview usen la geometria calculada de las sucesoras movidas por `activeMovePreviewDrafts`, no la caja DOM anterior o en transicion.

Resultado actual
`CronogramaGantt.jsx` mantiene la barra activa del hito siguiendo el puntero, clasifica `pointerup` de hitos manuales por `lastHorizontalDeltaPx`, y para sucesoras en preview fuerza geometria calculada desde el draft temporal antes de rutear dependencias. El helper visible muestra `Moviendo hito` y la fecha real del draft temporal.

Validacion ejecutada
- `node scripts/smoke-cronogramas-gantt-manual-milestone-drag.mjs` OK.
- `npm run smoke:gantt-classic` OK, incluyendo `smoke-classic-no-bim-contamination`.
- `npm run build` OK.

Impacto
UI Gantt clasico; sin backend, sin datos productivos, sin Presupuesto/APU, sin Cronograma Valorado directo, sin licencias y sin BIM.

TASK de control asociada
`TASK-1508`: completada al 100%.

Slice actual
`TASK-1509`: implementacion y saneamiento limpio completados al 100%. Se toma snapshot de relaciones, se borran datos antiguos de dependencias/predecesoras/fechas y se reconstruye la red real de `Santiago Bermeo`.

Resultado actual
`CronogramaGantt.jsx` deja de desplazar cascadas antiguas por delta al mover un hito manual y usa la relacion autoritativa para preview y commit. El Gantt real de `Santiago Bermeo`, proyecto `7`, presupuesto `13`, queda saneado con hito inicial `hm-mok8sj9c-j04f` en `2026-03-24T08:00:00` y sucesora `49` en `2026-03-24T08:00:00 -> 2026-03-24T10:18:43`.

Validacion ejecutada
- Backup: `tmp/santiago_bermeo_gantt_clean_rebuild_backup_20260505_160910.json`.
- Snapshot: `tmp/santiago_bermeo_gantt_relations_snapshot_20260505_160910.json`.
- `python tmp/audit_santiago_gantt_links.py` OK: hito `2026-03-24T08:00:00`, linea `49` `2026-03-24T08:00:00 -> 2026-03-24T10:18:43`.
- `python tmp/audit_santiago_gantt_full.py` OK: `187` filas, `0` tareas antes del inicio, `0` incidencias.
- `python tmp/validate_santiago_gantt_integrity.py` OK: `dependency_issue_count=0`.
- `python tmp/validate_santiago_gantt_rules_independent.py` OK: validador externo sin motor, `187` filas, `29` dependencias linea-linea (`28 FS`, `1 FF`), `1` hito-linea, `0` divergencias.
- `node scripts/validate-gantt-santiago-route-all.mjs` OK: `30/30` rutas, `0` incidencias.
- `npm run smoke:gantt-classic` OK.
- `npm run build` OK.

Impacto
Gantt clasico y datos reales de `Santiago Bermeo`; sin Presupuesto/APU, sin Cronograma Valorado directo, sin licencias y sin BIM.

TASK de control asociada
`TASK-1504`: completada al 100%.

Slice actual
`TASK-1505`: implementacion y saneamiento real completados al 100%. Se protege el commit de hito manual para no reinterpretar la cascada como una nueva planificacion completa que pueda vulnerar el inicio del proyecto.

Resultado actual
`CronogramaGantt.jsx` traslada la cascada de sucesores del hito por el delta laboral real del movimiento y mantiene la validacion de no guardar tareas antes de la fecha/hora de inicio del proyecto. El Gantt real de `Santiago Bermeo`, proyecto `7`, presupuesto `13`, fue recalculado con backup `tmp/santiago_bermeo_gantt_full_rebuild_backup_20260505_154838.json`.

Validacion ejecutada
- `python tmp/validate_santiago_gantt_integrity.py` OK: `187` filas, `0` tareas antes de `2026-03-24T08:00:00`, `0` incidencias de dependencias.
- `python tmp/audit_santiago_gantt_full.py` OK: `manual_milestone_count=1`, `FS=28`, `FF=1`, `before_project_start_count=0`, `dependency_issue_count=0`, `manual_issue_count=0`.
- `node scripts/validate-gantt-santiago-route-all.mjs` OK: `30/30` rutas, `0` incidencias.
- `npm run smoke:gantt-classic` OK.
- `npm run build` OK.

Impacto
Gantt clasico y datos reales de `Santiago Bermeo`; sin Presupuesto/APU, sin Cronograma Valorado directo, sin licencias y sin BIM.

TASK de control asociada
`TASK-1502`: completada al 100%.

Slice actual
`TASK-1503`: implementacion completada al 100%. Se corrige el movimiento por horas del hito manual y se evita rehidratacion parcial de cascada tras soltar.

Resultado actual
`CronogramaGantt.jsx` deja de tratar el hito manual como movimiento entero de dias. En escala `HORA`, la fecha/hora del hito se resuelve desde el pixel real del timeline y se guarda como `start_date/end_date`. La cascada de sucesores de hito manual fuerza refresco completo del Gantt para que la vista no quede parcial hasta recargar.

Validacion ejecutada
- `node scripts/validate-gantt-manual-milestone-drag-preview-dom.mjs` OK con `Santiago Bermeo`, presupuesto `13`: hito `hm-mok8sj9c-j04f`, `bar_delta_px=220`, `pointer_drag_px=220`, `target_delta_px=220`.
- `python tmp/audit_santiago_gantt_full.py` OK: `187` filas, `0` incidencias.
- `node scripts/validate-gantt-santiago-route-all.mjs` OK: `30/30` rutas, `0` incidencias.
- `node scripts/validate-gantt-santiago-full-dom.mjs` OK: `0` diagonales, `0` rutas directas indebidas, `0` rutas vacias.
- `npm run smoke:gantt-classic` OK.
- `npm run build` OK.

Impacto
UI Gantt clasico; sin backend, sin datos productivos, sin Presupuesto/Valorado directo, sin licencias y sin BIM.

TASK de control asociada
`TASK-1500`: completada al 100%.

Slice actual
`TASK-1501`: implementacion completada al 100%. Se corrige el preview no fluido del hito manual y se evita que un drag rechazado deje patches locales sucios hasta refrescar.

Resultado actual
`CronogramaGantt.jsx` pinta el hito manual activo con el delta real del puntero, por lo que en escala `HORA` y zoom alto el rombo sigue al raton. Ademas, si una persistencia optimista de drag devuelve `null` por validacion funcional, `drafts` vuelve al snapshot previo y no queda una representacion falsa hasta recargar.

Validacion ejecutada
- `node scripts/validate-gantt-manual-milestone-drag-preview-dom.mjs` OK con `Santiago Bermeo`, presupuesto `13`: hito `hm-mok8sj9c-j04f`, `bar_delta_px=220`, `pointer_drag_px=220`.
- `node scripts/validate-gantt-manual-milestone-drag-release-dom.mjs` OK: bloqueo seguro cuando la cascada real viola inicio de proyecto.
- `python tmp/audit_santiago_gantt_full.py` OK: `187` filas, `0` incidencias.
- `node scripts/validate-gantt-ff-predecessor-dom.mjs` OK: no rehidrata fechas de febrero.
- `node scripts/validate-gantt-santiago-route-all.mjs` OK: `30/30` rutas, `0` incidencias.
- `node scripts/validate-gantt-santiago-full-dom.mjs` OK: `0` diagonales, `0` rutas directas indebidas, `0` rutas vacias.
- `npm run smoke:gantt-classic` OK.
- `npm run build` OK.

Impacto
UI Gantt clasico; sin backend, sin datos productivos, sin Presupuesto/Valorado directo, sin licencias y sin BIM.

TASK de control asociada
`TASK-1498`: completada al 100%.

Slice actual
`TASK-1499`: saneamiento real completado al 100% sobre `Santiago Bermeo`, proyecto `7`, presupuesto `13`.

Resultado actual
El hito manual `hm-mok8sj9c-j04f` habia quedado visible pero huerfano, sin `successor_dependencies`, por lo que no gobernaba la ruta. Se creo backup `tmp/santiago_bermeo_gantt_manual_link_backup_20260505_105254.json`, se restauro el hito a `2026-03-24T08:00:00`, se enlazo como `FS -> linea 49` y se reconstruyo `schedule_data` con el motor oficial.

Validacion ejecutada
- `python tmp/audit_santiago_gantt_full.py` OK: `187` filas, `0` incidencias.
- `python tmp/validate_santiago_gantt_integrity.py` OK: relacion `1.1.6 -> 1.1.7` conserva `FF`, `0` incidencias.
- `python tmp/audit_santiago_gantt_links.py` OK: hito `hm-mok8sj9c-j04f` enlazado a linea `49`.
- `node scripts/validate-gantt-santiago-route-all.mjs` OK: `30/30` rutas, `0` incidencias.
- `node scripts/validate-gantt-manual-milestone-route-dom.mjs` OK: `route_d="M 12 166 L 12 106"`.
- `node scripts/validate-gantt-santiago-full-dom.mjs` OK: `0` diagonales, `0` rutas directas indebidas, `0` rutas vacias.
- `npm run smoke:gantt-classic` OK.

Impacto
Datos Gantt clasico de `Santiago Bermeo`; sin codigo funcional nuevo, sin Presupuesto/Valorado directo, sin licencias y sin BIM.

TASK de control asociada
`TASK-1496`: completada al 100%.

Slice actual
`TASK-1497`: implementacion completada al 100%. Se sincroniza el preview y el commit del hito manual para que hito, sucesora y ruta se muevan/calculen juntos.

Resultado actual
Durante el drag de un hito manual se construyen patches de sucesores y la capa de dependencias usa el estado temporal completo. Al soltar, el commit guarda hito y sucesora con el mismo inicio cuando la relacion `FS` sin lag lo exige.

Validacion ejecutada
- `node scripts/validate-gantt-manual-milestone-drag-preview-dom.mjs` OK con `Santiago Bermeo`, presupuesto `13`: hito movido `-292.56px`, sucesora `-320px`, ruta actualizada.
- `node scripts/validate-gantt-manual-milestone-drag-release-dom.mjs` OK: hito `hm-mok8sj9c-j04f` y linea `49` guardados en `2026-06-01T08:00:00`, ruta final con `2` comandos.
- `node scripts/validate-gantt-santiago-route-all.mjs` OK: `30/30` rutas calculadas, `0` incidencias.
- `python tmp/audit_santiago_gantt_full.py` OK: `187` filas, `0` incidencias.
- `npm run smoke:gantt-classic` OK.
- `npm run build` OK en `frontend`.

Impacto
UI Gantt clasico; sin backend, sin datos productivos, sin Presupuesto/Valorado directo, sin licencias y sin BIM.

TASK de control asociada
`TASK-1494`: completada al 100%.

Slice actual
`TASK-1495`: implementacion completada al 100%. Se recupera el movimiento real del hito manual inicial y se conserva la regla visual de linea vertical limpia cuando la dependencia hito -> tarea esta practicamente alineada.

Resultado actual
El hito manual vuelve a recibir `pointerdown` por encima de la capa SVG de dependencias. Las rutas con hito casi alineado colapsan a una X unica, evitando diagonales cortas o micro-codos.

Validacion ejecutada
- `node scripts/validate-gantt-manual-milestone-route-dom.mjs` OK con `Santiago Bermeo`, presupuesto `13`: `route_d="M 579 166 L 579 106"`.
- `node scripts/validate-gantt-manual-milestone-drag-preview-dom.mjs` OK: hito `hm-mok8sj9c-j04f` movido `310.86px` y ruta estable `M 579 166 L 579 106`.
- `node scripts/validate-gantt-santiago-route-all.mjs` OK: `30/30` rutas calculadas, `0` incidencias.
- `python tmp/audit_santiago_gantt_full.py` OK: `187` filas, `0` incidencias.
- `npm run smoke:gantt-classic` OK.
- `npm run build` OK en `frontend`.

Impacto
UI Gantt clasico; sin backend, sin datos productivos, sin Presupuesto/Valorado directo, sin licencias y sin BIM.

TASK de control asociada
`TASK-1492`: completada al 100%.

Slice actual
`TASK-1493`: implementacion completada al 100%. Se estabiliza el preview de arrastre de hito manual para que mover el hito no deforme la red de dependencias confirmada ni genere codos/ghosts temporales en el Gantt estable.

Resultado actual
El hito manual puede moverse visualmente durante el drag, pero `dependencyPaths` deja de recalcularse con `activeMovePreviewDrafts` y el drag de hito manual ya no genera cascada visual temporal. La cascada real se mantiene en el flujo de soltar/guardar.

Validacion ejecutada
- `node scripts/validate-gantt-manual-milestone-drag-preview-dom.mjs` OK con `Santiago Bermeo`, presupuesto `13`: hito `hm-mok8sj9c-j04f` movido `310.86px`, ruta estable `M 414.5 166 L 414.5 106`.
- `node scripts/validate-gantt-manual-milestone-route-dom.mjs` OK.
- `node scripts/validate-gantt-santiago-route-all.mjs` OK: `30/30` rutas calculadas, `0` incidencias.
- `python tmp/audit_santiago_gantt_full.py` OK: `187` filas, `0` incidencias.
- `npm run smoke:gantt-classic` OK.
- `npm run build` OK en `frontend`.

Impacto
UI Gantt clasico; sin backend, sin datos productivos, sin Presupuesto/Valorado directo, sin licencias y sin BIM.

TASK de control asociada
`TASK-1490`: completada al 100%.

Slice actual
`TASK-1491`: saneamiento real completado al 100% sobre `Santiago Bermeo`, proyecto `7`, presupuesto `13`. Se reconstruyo `schedule_data` desde el motor oficial con backup previo `tmp/santiago_bermeo_gantt_full_rebuild_backup_20260502_201515.json` y se ajusto el router visual para que una dependencia con hito alineado use linea vertical limpia, sin codo lateral.

Resultado actual
El cronograma servido por backend queda consistente: `187` filas, `0` filas antes del inicio del proyecto y `0` incidencias de dependencias. La relacion `1.1.6 -> 1.1.7` queda persistida como `FF` (`source_id=71`, `target_id=73`) y visualmente el hito alineado ya no se dibuja como linea directa ni como codo lateral.

Validacion ejecutada
- `python tmp/audit_santiago_gantt_full.py` OK: `187` filas, `0` incidencias, `30` relaciones auditadas por contrato.
- `node scripts/validate-gantt-manual-milestone-route-dom.mjs` OK con `route_command_count=2` y `route_d="M 149.5 166 L 149.5 106"`.
- `node scripts/validate-gantt-santiago-route-all.mjs` OK: `30/30` rutas calculadas, `0` incidencias.
- `node scripts/validate-gantt-santiago-full-dom.mjs` OK: `0` diagonales, `0` rutas manuales invalidas, `0` rutas vacias en DOM renderizado.
- `npm run smoke:gantt-classic` OK.
- `npm run build` OK en `frontend`.

Impacto
Datos Gantt clasico de `Santiago Bermeo` y ruteo visual acotado; sin licencias nuevas, sin Presupuesto/Valorado directo y sin BIM.

TASK de control asociada
`TASK-1488`: completada al 100%.

Slice actual
`TASK-1489`: implementacion completada al 100%. Se corrige el flujo de soltar hitos manuales en Gantt: primero se intenta persistir la cascada de sucesores y solo si esa cascada pasa se guarda `manual_milestones`.

Resultado actual
Mover un hito manual ya no puede dejar guardado el hito en una posicion nueva si sus sucesores no pudieron persistirse. Esto evita la rehidratacion incoherente que generaba rutas visuales sin significado.

Validacion ejecutada
- `node scripts/validate-gantt-manual-milestone-drag-release-dom.mjs` OK con `Santiago Bermeo`, presupuesto `13`: la cascada real queda bloqueada por una violacion previa de inicio de proyecto y el hito no se guarda solo.
- `node scripts/validate-gantt-manual-milestone-route-dom.mjs` OK.
- `npm run smoke:gantt-classic` OK.
- `npm run build` OK en `frontend`.

Impacto
Gantt clasico; sin cambio visual, sin Presupuesto/Valorado directo, sin licencias nuevas y sin BIM.

TASK de control asociada
`TASK-1486`: completada al 100%.

Slice actual
`TASK-1487`: saneamiento real completado al 100% sobre `Santiago Bermeo`, proyecto `7`, presupuesto `13`. Se detecto que el hito manual `hm-mok8sj9c-j04f` habia quedado sin `successor_dependencies` y fechado en `2026-03-30T08:00:00`; se creo backup `tmp\santiago_bermeo_gantt_saneamiento_hito_backup_20260502_184030.json` y se restauro el hito a `2026-03-24T08:00:00` con relacion `FS` hacia la linea `49`.

Resultado actual
El hito manual inicial vuelve a gobernar la primera tarea visible del bloque sin tocar fechas de tareas ni relaciones tarea-tarea existentes. La linea `49` permanece `2026-03-24T08:00:00 -> 2026-03-24T10:19:00`.

Validacion ejecutada
- Consulta directa a base OK: `manual-milestone:hm-mok8sj9c-j04f -> 49` persistido.
- `node scripts/validate-gantt-manual-milestone-route-dom.mjs` OK con `Santiago Bermeo`, presupuesto `13`: `manual-milestone:hm-mok8sj9c-j04f-49` renderiza `route_command_count=5`.

Impacto
Datos Gantt clasico de `Santiago Bermeo`; sin codigo funcional nuevo, sin Presupuesto, sin Cronograma Valorado, sin licencias nuevas y sin BIM.

TASK de control asociada
`TASK-1484`: completada al 100%.

Slice actual
`TASK-1485`: implementacion completada al 100%. Gantt corrige la representacion visual de dependencias con hitos: el router deja de convertir `sourceIsMilestone` / `targetIsMilestone` sin lag en una linea directa punto a punto y usa el ruteo ortogonal general del cronograma.

Resultado actual
Mover un hito manual ya no debe producir una diagonal directa como secuenciacion visual. La dependencia hito -> tarea se representa por codos ortogonales y anclajes de Gantt.

Validacion ejecutada
- `node scripts/smoke-cronogramas-gantt-manual-milestone-dependencies.mjs` OK.
- Validacion focal del router hito -> tarea OK (`commandCount > 2`).
- `npm run smoke:gantt-classic` OK.
- `node scripts/validate-gantt-manual-milestone-route-dom.mjs` OK con fixture de `Santiago Bermeo`, presupuesto `13`: `manual-milestone:hm-mok8sj9c-j04f-49` renderiza `route_command_count = 5`.
- `node scripts/validate-gantt-manual-milestone-default-time-dom.mjs` OK.
- `npm run build` OK en `frontend`.

Impacto
UI Gantt clasico; sin cambios de calculo, sin datos productivos, sin Cronograma Valorado, sin Presupuesto, sin licencias nuevas y sin BIM.

TASK de control asociada
`TASK-1482`: completada al 100%.

Slice actual
`TASK-1483`: saneamiento real completado al 100% sobre `Santiago Bermeo`, proyecto `7`, presupuesto `13`. El hito manual `hm-mok8sj9c-j04f` estaba en `2026-04-01T08:00:00` mientras la linea sucesora `49` seguia en `2026-03-24T08:00:00`; se creo backup `tmp_santiago_gantt_manual_milestone_route_backup_20260502_133651.json`, se alineo la linea `49` con el hito y el motor backend propago `30` lineas por cascada.

Resultado actual
La relacion hito -> linea `49` queda `aligned=true`; no quedan diferencias entre `schedule_data` persistido y calculo backend; no hay filas antes del inicio del proyecto. Cronograma Valorado permanece en modo `gantt` con `0` overrides, por lo que deriva del Gantt vigente.

Validacion ejecutada
- Validacion real sobre `Santiago Bermeo`: `187` filas servidas, `29` con dependencias, `0` diferencias persistido/calculado, `0` filas antes del inicio.
- `npm run smoke:gantt-classic` OK.
- `node scripts/smoke-cronogramas-gantt-manual-milestone-drag.mjs` OK.
- `node scripts/validate-gantt-manual-milestone-default-time-dom.mjs` OK.
- `npm run build` OK en `frontend`.

Impacto
Datos Gantt clasico de `Santiago Bermeo`; sin cambios de licencias, sin UI nueva, sin backend BIM y sin UX BIM.

TASK de control asociada
`TASK-1478`: completada al 100%.

Slice previo
`TASK-1479`: implementacion completada al 100%. La opcion `Aceptar` del Gantt confirma las lineas pendientes como lote unico mediante `onSaveTrabajoDraftBatch(...)` cuando esta disponible, limpia drafts/historial de lineas confirmadas y mantiene una unica sincronizacion final `Gantt -> Valorado -> Caja`.

Resultado actual
`Aceptar` ya no confirma linea a linea como experiencia principal. Las etiquetas de descripcion pasan de forma atomica desde `Pendiente aprobar` / `Programacion ajustada` hacia `Confirmado` / `Sincronizado` segun metadata persistida, sin resincronizacion economica intermedia por fila. La politica sigue alineada: `Presupuesto` es fuente productiva base, `Gantt` gobierna la dimension temporal, `Cronograma Valorado` deriva del Gantt vigente en modo `gantt` y `Flujo de Caja` deriva del Valorado vigente.

Validacion ejecutada
- `npm run smoke:gantt-classic` OK.
- `npm run build` OK en `frontend`.
- Verificacion estatica: `persistConfirmedRowsBatch(...)` usa `onSaveTrabajoDraftBatch(...)`, `approvalMode: confirmed` y `skipValoradoSync: true`.
- Verificacion estatica: `Guardando linea` / `Guardando línea` no queda renderizado en `CronogramaGantt.jsx` ni en bundle.

Impacto
Gantt clasico y sincronizacion derivada `Gantt -> Valorado -> Caja`; sin backend nuevo, sin cambios de calculo, sin licencias nuevas, sin backend BIM y sin UX BIM.

TASK de control asociada
`TASK-1476`: completada al 100%.

Slice previo
`TASK-1477`: implementacion completada al 100%. Gantt retira el letrero tecnico `Guardando linea ...` del rail oscuro y refuerza la aprobacion/restauracion por lote: las lineas se persisten sin sincronizacion economica intermedia y `Cronograma Valorado` / `Flujo de Caja` se sincronizan una sola vez al cierre del lote.

TASK de control asociada
`TASK-1474`: completada al 100%.

Slice previo
`TASK-1475`: implementacion completada al 100%. Formula Polinomica repara el contrato de asignaciones para que cada cambio de `Termino` guarde, regenere y devuelva la formula calculada completa antes de refrescar recursos. Se mantiene una unica columna `Termino`, sin restaurar la columna duplicada `Asignacion`.

TASK de control asociada
`TASK-1472`: completada al 100%.

Slice actual
`TASK-1473`: implementacion completada al 100%. El grid izquierdo del Gantt incorpora columnas `Holg. total` y `Holg. libre`, gestionables por el panel de columnas y alimentadas por `metadata.cpm.total_float_days` / `metadata.cpm.free_float_days`, sin tocar calculos CPM, dependencias, calendario laboral, backend ni BIM.

Slice previo
`TASK-1471`: implementacion completada al 100%. Cronograma Trabajo consume la capacidad restante de la jornada laboral antes de saltar al siguiente dia laborable, genera subtramos automaticos `gantt_workday_auto_segment` para cortes de jornada y sanea el Gantt real de `Santiago Bermeo` sin romper las politicas `FS/SS/FF/SF`. Refuerzo posterior: `update_schedule` y `commit-delta` persisten fechas/subtramos calculados en `schedule_data` tras cada recalculo para mantener sincronizados grid izquierdo y timeline derecho.

Subajuste visual posterior
`TASK-1471`: Gantt une los subtramos automaticos consecutivos con una linea sutil calculada desde la posicion visual real del final de un tramo hasta el inicio del siguiente, sin cambiar calculos, dependencias ni persistencia.

Slice previo
`TASK-1469`: hotfix UI Formula Polinomica completado al 100%. Se incorpora un separador vertical redimensionable entre el grid de recursos y el grid de coeficientes/indices, con limites minimos por panel y fallback responsive en viewport compacto.

Slice previo
`TASK-1468`: hotfix Gantt completado al 100%. Los scrollbars horizontales inferiores del grid izquierdo y timeline derecho quedan balanceados en inicio y fin corrigiendo el recorrido del selector en `MotionScrollbar` y reservando simetricamente `left: 24` / `right: 24` en `CronogramaGantt`.

Slice previo
`TASK-1467`: homogeneizacion visual de Desagregacion completada al 100%. La cabecera, card, buscador, selector `Por EDT / Consolidado`, KPIs e Integridad CPC adoptan la piel soft de `Datos de Proyecto`.

Slice anterior
`TASK-1465`: hotfix Desagregacion completado al 100%. El boton general `Reporte` ejecuta el reporte VAE existente y se retira el boton duplicado `Reporte VAE` de la zona de funciones.

Referencia anterior
`TASK-1464`: hotfix Gantt completado al 100%. Al navegar con cursor arriba/abajo en la columna `Predecesoras`, la celda editable y la tarea seleccionada quedan sincronizadas.

Referencia anterior
`TASK-1463`: completada al 100%. `Desagregacion` incorpora CPC de APUs a nivel de proyecto raiz, separado del CPC universal de recursos. Los APUs anidados en modo recurso quedan con CPC en blanco, no cuentan como faltantes y usan el VAE total calculado de su APU normal.

Subajuste visual posterior: el CPC de APU ya no se presenta como columna independiente; queda como chip accionable en la segunda linea bajo la descripcion del rubro, usando el mismo modal y guardado.

Control actual
Sin pendientes de cierre.

Validacion ejecutada
- Validacion real `TASK-1473`: `Santiago Bermeo`, proyecto `7`, presupuesto `13`; `cronograma_trabajo_service.get_schedule(...)` devuelve `187` filas y las `187` incluyen `metadata.cpm.total_float_days` y `metadata.cpm.free_float_days`. Muestras: linea `49` `HT=0.0 / HL=0.0`, linea `102` `HT=36.1241 / HL=0.0`, linea `118` `HT=9.166 / HL=0.0`.
- `npm run smoke:gantt-classic` OK para `TASK-1473`.
- `npm run build` OK en `frontend` para `TASK-1473`.
- `python -m pytest app/tests/test_cronograma_trabajo_advanced_calendar_config.py -q` OK para `TASK-1471`: `15 passed`.
- `python -m py_compile app/services/cronograma_trabajo.py app/tests/test_cronograma_trabajo_advanced_calendar_config.py` OK para `TASK-1471`.
- Validacion real `Santiago Bermeo`, proyecto `7`, presupuesto `13`: calendario real contiene `2026-04-30` y `2026-05-01` como no laborables; lineas `93`, `94`, `95` quedan persistidas y servidas con fechas coherentes y subtramos `gantt_workday_auto_segment`.
- Validacion de recalculo `Santiago Bermeo`: `commit-delta` real recalcula `187` filas y deja persistidos los subtramos automaticos en `schedule_data`.
- `npm run smoke:gantt-classic` OK para `TASK-1471`.
- `npm run build` OK para `TASK-1471`.
- `node scripts/smoke-formula-polinomica-responsive.mjs` OK para `TASK-1469`.
- `node scripts/validate-formula-responsive-dom.mjs` OK para `TASK-1469` a `1920x1080`.
- `npm run build` OK para `TASK-1469`.
- Validacion visual real del usuario para `TASK-1469`: scrollbars y slider vertical entre grids de Formula Polinomica correctos.
- `npm run build` OK para `TASK-1468`.
- `npm run smoke:gantt-classic` OK para `TASK-1468`.
- `node scripts/smoke-project-scrollbars.mjs` OK para `TASK-1468`.
- `node scripts/validate-gantt-scrollbar-geometry.mjs` OK para `TASK-1468`: DOM con datos reales de `Santiago Bermeo`, grid izquierdo y timeline derecho con `leftClearance=24` y `rightClearance=24`.
- `npm run build` OK para `TASK-1467`.
- `node frontend/scripts/smoke-classic-no-bim-contamination.mjs` OK para `TASK-1467`.
- `npm run build` OK para `TASK-1465`.
- `node frontend/scripts/smoke-classic-no-bim-contamination.mjs` OK para `TASK-1465`.
- `npm run build` OK para `TASK-1464`.
- `npm run smoke:gantt-classic` OK para `TASK-1464`.
- Validacion real reversible sobre `Santiago Bermeo`, proyecto `7`, presupuesto `13`, linea `49`, APU `349`: asignacion temporal CPC `011200011` persiste en `proyecto_apu_cpc` por root `SantiagoBermeo-2026-001` y no modifica el CPC del recurso.
- Validacion real de APU anidado: linea `1630`, APU padre `538`, APU hijo `110`, `resource_id = None`, `vae_total = 0.2877643678160919540229885057`; no debe mostrar `Sin CPC` ni entrar en faltantes.
- `alembic upgrade ad9e0f1a2b3c` aplicado en base local.
- `python -m py_compile app/models/apu.py app/models/proyecto_apu_cpc.py app/schemas/apu.py app/api/endpoints/apus.py app/repositories/apu.py` OK.
- `python -m pytest app/tests/test_nested_apu_integrity.py app/tests/test_project_base_reconciliation.py -q` OK: `12 passed`.
- `npm run build` OK.
- `node frontend/scripts/smoke-classic-no-bim-contamination.mjs` OK.

Validacion previa
- Validacion DOM real sobre `Santiago Bermeo`, presupuesto `13`, linea `73`: `9FF` queda visible sin fechas de febrero y con `start_date = 2026-04-06T10:49:01`, `end_date = 2026-04-07T12:06:14`.
- Validacion real de datos `Santiago Bermeo`: frontera `2026-03-24T08:00:00`, filas calculables antes del inicio `0`, relaciones `FF` desalineadas `0`.
- `npm run build` OK.
- `npm run smoke:gantt-classic` OK.
- `node scripts/validate-gantt-ff-predecessor-dom.mjs` OK.

Validacion previa relacionada
- Validacion real reversible sobre `Santiago Bermeo`, presupuesto `13`, lineas `71 -> 73`: `FS`, `SS`, `FF` y `SF` cumplen su semantica. Caso negativo `49 -> 73 FF` rechazado porque iniciaria antes de `2026-03-24T08:00:00`.
- Saneamiento real `Santiago Bermeo`: backup `tmp_santiago_gantt_dependency_dates_backup_20260430.json`; `29` filas dependientes con fechas persistidas obsoletas actualizadas; `remaining_stale_dependency_rows = []`.
- `python -m py_compile app/services/cronograma_trabajo.py app/tests/test_cronograma_trabajo_cpm_metadata.py` OK.
- `python -m pytest app/tests/test_cronograma_trabajo_cpm_metadata.py app/tests/test_cronograma_trabajo_advanced_calendar_config.py -q` OK: `21 passed`.
- `npm run smoke:gantt-classic` OK.
- `node scripts/validate-gantt-ff-predecessor-dom.mjs` OK.
- `npm run build` OK.
- `node frontend/scripts/smoke-classic-no-bim-contamination.mjs` OK.

Auditoria relacionada
Sin pendientes. Pueden quedar `custom-scrollbar` en contenedores secundarios como modales o dropdowns internos, fuera del alcance de grids principales.

Pendiente para 100%
Ninguno.

Última TASK completada
`TASK-1463`: CPC de APUs por proyecto en Desagregacion. `TASK-1457`: asignacion masiva CPC en Recursos.

Nota operativa CPC/APU
El CPC de APU no debe copiarse al recurso ni a APUs anidados usados como recurso. La tabla rectora es `proyecto_apu_cpc`, con clave logica `empresa + proyecto_root_codigo + apu`. Para APUs anidados, la celda CPC queda vacia y el VAE usado es `APU.vae_total`.

Nota operativa Gantt
`FF` valido debe alinear fin con fin. Si al retrocalcular la duracion la sucesora tendria que iniciar antes del proyecto, la secuenciacion debe rechazarse; no se debe guardar una relacion degradada ni mover la barra al inicio del proyecto.

Nota operativa Formula Polinomica
Se retira el bloqueo fijo `X <= 0.200`: `X` puede actuar como termino residual cuando el presupuesto real lo requiera. En `Santiago Bermeo`, proyecto `7`, presupuesto `13`, la formula vuelve a regenerar con monomios en `SIN_DESGLOSE` y `CON_DESGLOSE`.

Slice anterior cerrado
`TASK-1451`: implementacion normativa de `Formula Polinomica` segun DOCX, Excel y Delphi. TASK de control `TASK-1450` tambien cerrada al 100%.

Último slice ejecutado
`TASK-1444`: Desagregacion queda al 99.8% con CPC directo/batch, ruta inversa CPC y sincronizacion base maestra -> base proyecto validadas. Hotfix reciente: `execute_sync_operation(...)` sincroniza todos los recursos compartidos en modos `apu_values` e `integral`, no solo recursos de APUs tocados, para que el CPC del recurso maestro se copie aunque el APU no cambie. Proteccion adicional: `PUT /recursos/{id}` ya no borra CPC si recibe `cod_cpc_id: null` por payload incompleto; solo borra con `clear_cod_cpc: true`. Saneamiento real en `Santiago Bermeo`: base proyecto `34` contra maestra `32`, `111` CPC restaurados, backup `tmp_santiago_base34_cpc_repair_backup_20260430.json`; base proyecto queda `216/216` con CPC y presupuesto `13` queda con `164` APUs / `747` lineas de recurso sin faltantes CPC. Validacion anti-borrado real: recurso `428` conserva `17767 / 432540011` tras update incompleto. Pendiente QA visual/desplegada general para cierre al 100%.

Slice aparcado
`TASK-1449`: busqueda CPC flexible en asignacion de recursos al 98%. Implementacion: `CodCPCRepository.search` sube limite por defecto a 200, busca por codigo/descripcion/frase completa y por todos los terminos aunque no formen frase exacta, y ordena por relevancia. `GET /recursos/cpc/search` acepta `limit` entre 1 y 500 con 200 por defecto. Validado con `py_compile`, pytest focalizado `test_codcpc_search.py` (3 passed) y lectura real de base configurada: `hierro` devuelve 200 resultados con 11 coincidencias `VARILLAS` + `HIERRO`; `estruct` devuelve 200 resultados con 132 coincidencias `ESTRUCTURAL`. Pendiente QA visual en UI servida del dropdown. Sin cambios de guardado, licencias ni BIM.

Slice previo aparcado
`TASK-1448`: filtro de recursos sin CPC en Precios Unitarios clasico al 95%. Implementacion: `Recursos.jsx` agrega helper robusto para detectar CPC por `cod_cpc_id`, objeto `cpc` o `cod_cpc_codigo` plano; incorpora boton compacto `Sin CPC` con contador en el alcance activo, filtra `visibleRecursos` por categoria/subcategoria activa, hace que la busqueda global respete el filtro activo y limpia seleccion masiva al cambiar modo. Validado con comprobacion estatica focalizada, simulacion funcional del criterio CPC y `npm run build`. Pendiente QA visual en UI servida para cierre al 100%. Sin cambios backend, licencias ni BIM.

Slice anterior aparcado
`TASK-1447`: hotfix y mejora de grid izquierdo del Gantt clasico al 99.9995%. Diagnostico: al borrar la ultima predecesora, el commit textual eliminaba el borrador local antes de esperar al backend; durante ese hueco el input volvia a leer la fila persistida anterior y repintaba el numero viejo. Implementacion: `CronogramaGantt.jsx` mantiene el shortcode optimista, aplica el parche local antes del `await` backend y hace que `gantt_predecessor_shortcode` use `deferValoradoSync: true` para entrar por el commit delta/diferido. Hotfix secuenciador hito -> tarea: el parser textual conserva endpoints `manual-milestone:*`, no los convierte a `Number/NaN`, persiste relaciones hito -> tarea en `manual_milestones[].successor_dependencies`, el mapa secuenciable usa `rows` ya fusionado con hitos manuales y el borrador optimista de `Predecesoras` no se borra hasta que el persistido coincide semanticamente. Hotfix borrado tarea -> tarea: el borrador optimista vacio se conserva hasta que el persistido coincide semanticamente con vacio, evitando que el numero antiguo se rehidrate. Hotfix FF/lag: `Cronogramas.jsx` y backend conservan `FF`, aliases visibles (`FC`/`CC`/`CF`) y unidades `minute`/`percent`, evitando que `9FF-50%` se convierta en dias o en `CC`. Hotfix adicional `FF`: backend y preview frontend aplican el inicio del proyecto como suelo obligatorio, por lo que una relacion `FF` ya no puede derivar el inicio del destino antes del inicio del proyecto por duracion del destino. Hotfix visual `FF`: `buildDependencyRoute(...)` conserva el calculo temporal pero representa fin-fin con salida desde el fin de la predecesora y llegada vertical al fin de la sucesora. Hotfix hitos: los hitos nuevos nacen en hora laboral; en `Santiago Bermeo`, cronograma `1`, presupuesto `13`, se saneo `hm-mok8sj9c-j04f` de `2026-03-24T00:00:00` a `2026-03-24T08:00:00`, con backup `tmp_santiago_manual_milestones_midnight_backup_20260430.json`. Validacion real reversible sobre `Santiago Bermeo`, empresa `3`, proyecto `7`, presupuesto `13`: escribir `3` en la predecesora del item 4 (`line_id=49`) mantiene `3` tras 7 segundos; borrar `9` en la predecesora del item 8 (`Cobertura de plástico`) mantiene la celda vacia tras 7 segundos con `commit-delta 200`; escribir `9FF-50%` conserva `9FF-50%` tras 7 segundos; `diagnose_santiago_gantt_ff_item10.py` guarda `71 -> 73` con `FF`; la respuesta de servicio devuelve el hito saneado a `08:00` y quedan 0 hitos manuales a medianoche. Validado con pytest backend, `node scripts/smoke-cronogramas-gantt-dependencies.mjs`, `npm run smoke:gantt-classic`, `node scripts/validate-gantt-ff-predecessor-dom.mjs` y `npm run build`. Pendiente QA visual/percibida en UI servida principal tras desplegar/reiniciar frontend para cierre al 100%. Sin cambios en Valorado/Caja, Presupuesto, licencias ni BIM.

Slice previo cerrado
`TASK-1446` queda cerrada al 100%: optimizacion conservadora del commit de secuenciacion en Gantt clasico. Objetivo cumplido: aceptar una secuenciacion confirma rapido el Gantt y no espera de forma bloqueante la resincronizacion silenciosa del Cronograma Valorado cuando el modo es `gantt`. Implementacion: `Cronogramas.jsx` difiere la sincronizacion silenciosa del Valorado con debounce de 900 ms cuando el commit del Gantt llega con `deferValoradoSync`, estabiliza `CronogramaTrabajoResponse`, y usa `PUT /cronogramas-trabajo/{presupuesto_id}/commit-delta` solo para secuenciacion diferida. El endpoint delta valida/persiste igual que el completo pero devuelve filas livianas, `schedule_data` cambiado y resumen, manteniendo intacto el `PUT` completo existente. Perfilado real `Santiago Bermeo`, empresa `3`, proyecto `7`, presupuesto `13`: payload completo `1,935,288` bytes frente a delta `505,951` bytes (`-73.9%`); commit completo ~454.3 ms frente a delta ~299.7-370.9 ms. Validado con `py_compile`, ruta FastAPI, `npm run smoke:gantt-classic`, `npm run build` y confirmacion UI servida del usuario tras reinicio backend/frontend. Sin tocar CPM backend, Valorado/Caja ni BIM.

Slice previo aparcado
`TASK-1445`: ruta critica coherente en Gantt clasico queda al 96% pendiente de QA visual/desplegada. Diagnostico real sobre `Santiago Bermeo`, proyecto `7`, presupuesto `13`: backend CPM devuelve `30` nodos criticos calculables y `29` arcos criticos en `metadata.cpm_network.critical_paths`; el frontend pintaba enlaces rojos pero mantenia barras/semaforos `RC=0` porque el nodo CPM backend usado por `displayPlanningMap` no reconstruia `criticalOutgoingKeys` / `criticalIncomingKeys`. Implementacion focalizada: `cronogramasGanttCriticalPath.js` normaliza rutas criticas backend y `CronogramaGantt.jsx` enriquece los nodos CPM con pertenencia critica para que barras/subbarras y contadores usen el mismo criterio. Hotfix posterior: el drag vertical de hitos manuales recien creados usa una referencia viva del resolver de drop. Validado con smoke focalizado, smoke de hito manual, `npm run smoke:gantt-classic`, build, smoke no BIM y verificacion real `Santiago Bermeo`: `rows=187`, `backend_is_critical_rows=30`, `nodes_from_critical_paths=30`, `edges_from_critical_paths=29`, `frontend_expected_rc_after_fix=30`.

Slice documental previo
`TASK-1437`: saneamiento documental posterior al cierre `TASK-1435` / `TASK-1436`; `WORK_MODE_STATE`, `HANDOFF`, `TODO`, `project_state` y `CHANGELOG` quedan alineados y el runtime vuelve a `sin TASK activa real`.

Saneamiento documental 2026-04-28
- `TASK-1435` y `TASK-1436` ya estaban cerradas y registradas en `CHANGELOG`, pero el snapshot rector seguía citando `TASK-1433` / `TASK-1434` como último cierre.
- Se crea y cierra `TASK-1437` como control documental, sin cambios funcionales.
- El consenso operativo queda en `SIN_TASK_ACTIVA_REAL`.
- Impacto en licencias: ninguno.
- Impacto UI: ninguno.
- No interferencia BIM: confirmada; sin UX BIM ni acoplamientos nuevos.

Saneamiento documental posterior
- `TASK-1089`, `TASK-1090`, `TASK-1091` y `TASK-1092` dejan de actuar como frente activo real y quedan archivadas como slices históricos superados.
- `TASK-1414` deja de figurar como tarea activa real residual del runtime; `TASK-1415` / `TASK-1416`, `TASK-1417` / `TASK-1418`, `TASK-1419` / `TASK-1420`, `TASK-1421` / `TASK-1422`, `TASK-1423` / `TASK-1424`, `TASK-1425` / `TASK-1426`, `TASK-1427` / `TASK-1428`, `TASK-1429` / `TASK-1430` y `TASK-1431` / `TASK-1432` quedan como slices históricos cerrados del frente Gantt clásico del 2026-04-26.

Pendiente operativo real
- Continuar `TASK-1444` hasta QA visual/desplegada y cierre documental.
- No reabrir `TASK-1443` salvo bug explícito de mezcla EDT/APU en `Desagregación`.
- No reabrir `TASK-1442` salvo bug explicito de carga batch o cache de `Desagregación`.
- No reabrir `TASK-1441` salvo bug explicito de sincronización CPC en `Desagregación` o contrato de recurso APU.
- No reabrir `TASK-1440` salvo ajuste visual explícito del Gantt clásico sobre altura o rombo de hitos manuales.
- No reabrir `TASK-1439` salvo ajuste visual explícito del Gantt clásico sobre hitos manuales.
- No reabrir `TASK-1438` salvo ajuste visual explícito del landing de Proyectos.
- No reactivar `TASK-1435` / `TASK-1436` salvo bug explícito del frente de drag horizontal.
- `TASK-presupuesto-module-access-repair` queda cerrada; no reabrir salvo evidencia de endpoint sin `_verify_module_access`.
- La adecuación Delphi de `Fórmula Polinómica` queda validada con datos reales sobre `Santiago Bermeo`.
- La persistencia del carril de hitos manuales queda probada con datos reales sobre `Santiago Bermeo`.
- El movimiento vertical de hitos secuenciados queda probado con un hito real de `Santiago Bermeo`.
- El frente de calendario laboral unificado queda cerrado.
- `TASK-1230` y `TASK-1232` quedan cerradas documentalmente como frentes históricos absorbidos por el cierre visual posterior.
- El frente de secuenciación gráfica `TASK-1243` a `TASK-1245` queda cerrado al 100%.
- El hotfix visual `TASK-1246` a `TASK-1248` queda cerrado al 100%.
- El hotfix funcional `TASK-1249` a `TASK-1251` queda cerrado al 100%.
- La mejora UX `TASK-1252` a `TASK-1254` queda cerrada al 100%.
- El ajuste geométrico `TASK-1255` a `TASK-1257` queda cerrado al 100%.
- El ajuste de dismiss `TASK-1258` a `TASK-1260` queda cerrado al 100%.
- El ajuste geométrico complementario `TASK-1261` a `TASK-1263` queda cerrado al 100%.
- El hotfix del carril `TASK-1264` a `TASK-1266` queda cerrado al 100%.
- El hotfix funcional `TASK-1267` a `TASK-1269` queda cerrado al 100%.
- El hotfix UX/consistencia `TASK-1270` a `TASK-1272` queda cerrado al 100%.
- El hotfix funcional `TASK-1273` a `TASK-1275` queda cerrado al 100%.
- El hotfix UX de drag `TASK-1276` a `TASK-1278` queda cerrado al 100%.
- El hotfix UX de foco `TASK-1279` a `TASK-1281` queda cerrado al 100%.
- La corrección estructural de viewport `TASK-1282` a `TASK-1284` queda cerrada al 100%.
- La corrección estructural horizontal `TASK-1285` a `TASK-1287` queda cerrada al 100%.
- La corrección de regresión por affordances invisibles `TASK-1288` a `TASK-1290` queda cerrada al 100%.
- La separación estricta click/drag `TASK-1291` a `TASK-1293` queda cerrada al 100%.
- La eliminación de autoposiciones restantes `TASK-1294` a `TASK-1296` queda cerrada al 100%.
- La selección pasiva en grid izquierdo `TASK-1297` a `TASK-1299` queda cerrada al 100%.
- `TASK-1300` a `TASK-1302` quedan como intento exploratorio sobre `ProjectManager` y no como adopción final del selector.
- `TASK-1303` a `TASK-1305` quedan cerradas: la adecuación visual alineada a la referencia HTML vive ahora en `Proyectos.jsx`, con `Lista / Kanban / Calendario`, historial inline y `ProjectManager` devuelto a standby por flag.
- `TASK-1306` a `TASK-1308` quedan cerradas: el fondo base del landing nuevo de `/proyectos` se alinea con el color institucional `#F2F4F7` del shell principal.
- `TASK-1309` a `TASK-1311` quedan cerradas: el bloque superior del landing pierde el copy descriptivo, reduce altura y acerca tipografía/acciones al patrón corporativo del style guide.
- `TASK-1312` a `TASK-1314` quedan cerradas: los KPIs dejan de mostrarse como cuatro cards grandes y pasan a una banda estadística compacta con separadores internos.
- `TASK-1315` a `TASK-1317` quedan cerradas: la banda KPI se reemplaza por cuatro cards compactas con badge superior y lectura vertical simple, como prueba visual inspirada en Uiverse.
- `TASK-1318` a `TASK-1320` quedan cerradas: la familia KPI se refina otra vez para acercarse más al patrón de card seleccionado, sustituyendo badges genéricos por iconografía técnica, valor fuerte y pie compacto sin cambiar métricas ni comportamiento.
- `TASK-1321` a `TASK-1323` quedan cerradas: la familia KPI cambia a una versión horizontal, más baja y compacta, con icono lateral, valor dominante y pie corto, manteniendo intacta la lógica del selector.
- `TASK-1324` a `TASK-1326` quedan cerradas: la toolbar del landing reduce altura, elimina el tono beige dominante y adopta controles blancos/zinc con estados activos naranjas más próximos al patrón de `Cronogramas`.
- `TASK-1327` a `TASK-1329` quedan cerradas: el selector `Lista / Kanban / Calendario` deja el patrón manual temporal, adopta `ProjectSegmentedSwitch` y se alinea al borde derecho sin aumentar tamaño.
- `TASK-1330` a `TASK-1332` quedan cerradas: `Volver`, `Gestión de personal`, `Nuevo proyecto` y `Filtros` comparten ya una misma familia de botones suaves con borde claro, relieve leve y tipografía consistente.
- `TASK-1333` a `TASK-1335` quedan cerradas: las acciones principales del landing pasan a botones iconográficos descriptivos y `Filtros` sustituye la expansión inferior por un dropdown contextual anclado al botón.
- `TASK-1336` a `TASK-1338` quedan cerradas: se recupera el material `soft-action` de esa botonera y del dropdown de filtros, manteniendo iconografía descriptiva e interacción contextual.
- `TASK-1339` a `TASK-1341` quedan cerradas: el landing reduce gap y padding vertical entre header, KPIs, toolbar y tabla para aumentar el área de trabajo visible.
- `TASK-1342` a `TASK-1344` quedan cerradas: la tabla de `/proyectos` sustituye el acceso directo por despliegue inline del historial, siembra la revisión `0` cuando no hay más versiones, elimina la columna `Avance` y rebaja la paleta cálida del grid hacia neutros y azul corporativo.
- `TASK-1345` a `TASK-1347` quedan cerradas: el historial de revisiones deja de empujar filas y pasa a overlay anclado al item padre dentro del scroller del listado; la columna `Acciones` desaparece y solo queda borrado contextual condicionado por rol.
- `TASK-1348` a `TASK-1350` quedan cerradas: el overlay de revisiones recibe altura máxima y scroll interno, reforzando que el crecimiento vertical ocurra dentro del panel y no en la página.
- `TASK-1351` a `TASK-1353` quedan cerradas: el expansor del historial y las papeleras contextuales pasan a una familia compacta `soft-action`, sin crecer ni perder la animación de giro del chevron.
- `TASK-1354` a `TASK-1356` quedan cerradas: las revisiones del overlay se recompensan a dos líneas, reducen altura y redistribuyen metadatos para que el panel gane densidad.
- `TASK-1357` a `TASK-1359` quedan cerradas: el overlay de revisiones ajusta altura máxima y reserva inferior para no quedar pegado al borde bajo de la ventana.
- `TASK-1360` a `TASK-1362` quedan cerradas: `Kanban` deja de ser un dashboard estático, adopta columnas-lista con scroll interno, separa fase operativa de `Con revisiones` y permite mover proyectos entre fases persistiendo `estado`.
- `TASK-1363` a `TASK-1365` quedan cerradas: `Proyectos.jsx` recupera el import del icono `Play` usado en el workspace y elimina el `ReferenceError` que impedía abrir el módulo.
- `TASK-1366` a `TASK-1368` quedan cerradas: en `Kanban` desaparece el lápiz, `Pre-factibilidad` no ofrece entrada, `Planificación` abre un microlistado de revisiones y las fases de la derecha entran directo a la revisión vigente.
- `TASK-1369` a `TASK-1371` quedan cerradas: al pasar de `Planificación` a `Licitación`, si existe más de una revisión el sistema exige elegir cuál queda aprobada; esa decisión se persiste en `plantillas_config` del proyecto raíz y las fases posteriores abren siempre esa revisión.
- `TASK-1372` a `TASK-1374` quedan cerradas: si un proyecto con presupuesto retrocede de `Planificación` a `Pre-Factibilidad`, el `Kanban` exige confirmación explícita de proyecto retraído antes de persistir el cambio de fase.
- `TASK-1375` a `TASK-1377` quedan cerradas: el badge de estado visible deja de mostrar semánticas paralelas como `Con revisiones` y pasa a reflejar en lista, overlay de revisiones y calendario el estado operativo del proyecto raíz que gobierna `Kanban`.
- `TASK-1378` a `TASK-1380` quedan cerradas: el `Calendario` del selector deja el segmentado principal y pasa a un modal mensual navegable.
- `TASK-1381` a `TASK-1383` quedan cerradas: `Anterior`, `Siguiente`, `Hoy` y la cápsula de `Mes operativo` del calendario modal reducen altura y anchura para ganar superficie útil sin perder jerarquía ni navegación.
- `TASK-1384` a `TASK-1386` quedan cerradas: el calendario modal del portafolio entra en modo mixto y combina ya eventos operativos, anotaciones compartidas de administración, notas privadas por usuario y comunicados visibles para toda la empresa, con persistencia dedicada y permisos diferenciados por rol.
- `TASK-1387` a `TASK-1389` quedan cerradas como base de densificación UX del calendario mensual; su patrón lateral inicial queda posteriormente sustituido por el modelo embebido cerrado en `TASK-1396` a `TASK-1398`.
- `TASK-1390` a `TASK-1392` quedan cerradas: el calendario añade hitos automáticos múltiples por proyecto y revisión, incluyendo alta, inicio operativo, fin estimado, creación de revisiones y revisión aprobada cuando aplica, visibles para todos los usuarios del portafolio.
- `TASK-1393` a `TASK-1395` quedan cerradas: cuando el backend activo no soporta aún `calendar-entries`, el calendario deja de lanzar un aviso bloqueante y pasa a modo degradado, manteniendo operativos los hitos automáticos y mostrando la indisponibilidad de la capa manual dentro del modal.
- `TASK-1396` a `TASK-1398` quedan cerradas: el calendario mensual del selector `/proyectos` retira el panel lateral, convierte cada día en un microlistado embebido con cabecera `Eventos: X`, resuelve el detalle por hover local y mueve el alta de anotaciones/notas/comunicados a un modal corto.
- `TASK-1399` a `TASK-1401` quedan cerradas: el calendario mensual compacta su cabecera en una sola banda horizontal y aprovecha la columna derecha para una bandeja privada de `Pendientes personales`, persistidos por usuario y sin fecha.
- `TASK-1402` a `TASK-1404` quedan cerradas: si el backend activo todavía no soporta `usuarios/personal-todos`, la bandeja `Pendientes personales` pasa automáticamente a modo local por usuario/empresa, sigue permitiendo crear, editar, completar y borrar, y sustituye el error duro por un aviso contextual no bloqueante.
- `TASK-1405` a `TASK-1407` quedan cerradas: la cabecera embebida de cada día del calendario mensual reduce contraste, altura, peso tipográfico y tamaño del botón `+`, manteniendo intacto el microlistado y el conteo de eventos.
- `TASK-1408` queda cerrada al 100% con build frontend en verde.
- Tras el cierre, no queda una TASK activa real consensuada; el siguiente trabajo debe abrir una TASK nueva antes de reanudar implementación.

Saneamiento documental
- `docs/runtime/WORK_MODE_STATE.json` apuntaba erróneamente a `TASK-1217`.
- `TASK-1217` está completada y pertenece al frente cerrado `TASK-1216` a `TASK-1222`.
- El consenso documental actual deja `TASK-1230` y `TASK-1232` como slices históricos ya absorbidos por el cierre posterior de `TASK-1234` a `TASK-1239`.
- La TASK activa real queda saneada a `sin TASK activa` tras archivar `TASK-1089` y asociadas como frente superado.

Índice BIM
- El programa BIM ya tiene un punto de entrada único y oficial en `docs/architecture/BIM_INDEX.md`.
- Cualquier reactivación del frente BIM debe arrancar desde ese índice y no desde documentación dispersa.

Estado operativo inmediato
- Los secuenciadores del `Gantt` clásico ya deben caer sobre la tarea o el hito contenedor aunque el puntero toque una subbarra o una zona pequeña del carril.
- Las secuenciaciones `hito <-> tarea` del `Gantt` clásico ya deben completar el commit real tras soltar y no quedarse en una línea continua provisional sin persistencia.
- Los hitos manuales ya no deben reanclarse al final del cronograma cuando se mueven hacia una fila superior.
- Las secuenciaciones entre hitos y tareas del `Gantt` clásico ya deben quedar persistidas y dibujadas como relaciones completas, no solo como ajuste de fecha.
- Los hitos manuales ya pueden volver a subir o bajar de línea desde menú y `drag'n'drop` cuando origen y destino están libres de secuenciadores.
- `TASK-1243`, `TASK-1244` y `TASK-1245` quedan cerradas: el Gantt clásico ya expone un botón hover de secuenciación hermano de `Opciones`, crea `FS` por defecto por arrastre tarea-a-tarea, serializa shortcuts por comas en `Predecesoras` y mantiene editor gráfico de la relación.
- `TASK-1246`, `TASK-1247` y `TASK-1248` quedan cerradas: el editor gráfico de dependencias pasa a portal fijo con clamp al viewport del módulo y deja de quedar recortado por el plano scrollable o la barra horizontal inferior.
- `TASK-1249`, `TASK-1250` y `TASK-1251` quedan cerradas: al romper una dependencia, la tarea destino sin predecesoras vuelve al inicio operativo del proyecto y la cascada sucesora se recalcula desde ese arranque libre.
- `TASK-1252`, `TASK-1253` y `TASK-1254` quedan cerradas: el mismo botón hover `Link2` ya permite tanto arrastrar una dependencia como fijar una tarea origen por click y completar la relación con click sobre una tarea lejana tras hacer scroll.
- `TASK-1255`, `TASK-1256` y `TASK-1257` quedan cerradas: el botón `X` de ruptura deja de usar la punta del path y pasa al punto medio real del recorrido polilineal.
- `TASK-1258`, `TASK-1259` y `TASK-1260` quedan cerradas: si la dependencia está seleccionada y el usuario pulsa fuera del diálogo y fuera del propio enlace, el editor y el botón `X` desaparecen; `Escape` también cierra la selección.
- `TASK-1261`, `TASK-1262` y `TASK-1263` quedan cerradas: el anclaje del botón `X` se recalcula desde el centro visual del bounding box del enlace proyectado sobre la polilínea real, evitando que el control reaparezca en la punta final en rutas con codos.
- `TASK-1264`, `TASK-1265` y `TASK-1266` quedan cerradas: el carril ya no filtra dependencias cuando la predecesora está por debajo de la tarea destino y `dependencyPaths` conserva también `actionX/actionY` para que el botón `X` use el anclaje medio real.
- `TASK-1267`, `TASK-1268` y `TASK-1269` quedan cerradas: al romper una dependencia, tanto origen como destino vuelven al inicio del proyecto solo si quedan sin ninguna relación activa, evitando mover tareas que aún conservan enlaces entrantes o salientes.
- `TASK-1270`, `TASK-1271` y `TASK-1272` quedan cerradas: el grid izquierdo ya no selecciona la fila ni provoca centrado accidental al pulsar vacío, y quitar una relación desde `Predecesoras` cae en la misma lógica completa de `removeDependencyLink(...)`.
- `TASK-1273`, `TASK-1274` y `TASK-1275` quedan cerradas: el commit textual de `Predecesoras` detecta relaciones retiradas y aplica también la regla de volver al inicio cuando origen o destino quedan totalmente libres.
- `TASK-1276`, `TASK-1277` y `TASK-1278` quedan cerradas: el drag de barras bloquea el viewport visible durante el gesto y el preview de movimiento deja de usar una sombra ancha que hacía parecer que la tarea cambiaba de tamaño.
- `TASK-1279`, `TASK-1280` y `TASK-1281` quedan cerradas: las acciones normales del Gantt dejan de centrar fila/timeline automáticamente, la política por defecto pasa a `nearest` y la selección de subbarras elimina el `scrollIntoView(...)` automático, revelando el tramo solo si estaba fuera de vista.
- `TASK-1282`, `TASK-1283` y `TASK-1284` quedan cerradas: la sincronización vertical deja de ejecutarse en `useLayoutEffect` tras cambios de selección/draft/layout y pasa a depender solo de scroll real del usuario.
- `TASK-1294`, `TASK-1295` y `TASK-1296` quedan cerradas: las acciones normales del timeline dejan de ejecutar cualquier autoposición residual (`scrollIntoView` / `scrollRowIntoViewById`) y los affordances flotantes del propio Gantt salen del foco nativo con `tabIndex={-1}` para evitar saltos horizontales espurios.
- `TASK-1297`, `TASK-1298` y `TASK-1299` quedan cerradas: el grid izquierdo ya puede seleccionar la fila desde celdas pasivas, pero respeta intactos botones, inputs, labels, enlaces y acciones inline existentes.
- `TASK-1300`, `TASK-1301` y `TASK-1302` quedan archivadas como exploración sobre `ProjectManager`; el modelo nuevo no se adopta allí y el flag vuelve a `legacy`.
- `TASK-1342`, `TASK-1343` y `TASK-1344` quedan cerradas: el selector `/proyectos` usa ya el panel inline como entrada primaria al historial de revisiones y limpia la lectura del grid sin columna `Avance`.
- `TASK-1345`, `TASK-1346` y `TASK-1347` quedan cerradas: el historial del selector `/proyectos` se monta como overlay dentro del listado y deja la interacción reducida a selección de revisión y borrado contextual por rol.
- `TASK-1303`, `TASK-1304` y `TASK-1305` quedan cerradas: `Proyectos.jsx` adopta la estructura del HTML de referencia sobre el selector real, suma vistas `Lista / Kanban / Calendario`, expansiones inline de revisiones y conserva intacta la rama de detalle del proyecto.
- `cronogramasGanttDependencies.js` alinea la llegada vertical de rutas con el marcador de gobierno esperado y deja el smoke geométrico de dependencias en verde.
- `TASK-1089`, `TASK-1090`, `TASK-1091` y `TASK-1092` quedan cerradas documentalmente como frente histórico ya superado.
- Sus entregables útiles permanecen absorbidos en el estado actual del Gantt clásico, pero ya no gobiernan continuidad operativa ni deben figurar como pendientes.
- `TASK-1240`, `TASK-1241` y `TASK-1242` quedan cerradas como hotfix UI del Gantt clásico: cuando la geometría visible es demasiado pequeña, el botón de opciones sale del área draggable para dejar una zona limpia de agarre en hitos, barras pequeñas y subtramos.
- El siguiente slice recomendado debe abrirse como TASK nueva y no reactivar este frente histórico.
- El dominio `Marketplace` ya es completamente funcional para publicar, buscar y adquirir APUs, reportes o proyectos.
- `Configuración de Gantt` ya mantiene el header visible durante el scroll.
- `Calendario laboral ampliado` pasa a nombrarse `Calendario laboral personalizado`.
- El acceso a la capa personalizada del calendario ya usa botón iconográfico contextual.
- `Calendario de Festivos` ya puede abrir un modal visual del calendario laboral del proyecto usando la franja operativa real.
- El nuevo frente activo busca unificar `Calendario laboral personalizado` y `Calendario de Festivos` bajo un solo módulo visible de calendario laboral del proyecto, sin sustituir el motor actual.
- El build del frontend vuelve a estar limpio; la rama JSX heredada e inactiva del panel de Gantt fue saneada sin cambiar el comportamiento activo.
- El rail superior de opciones del Gantt ya no debe desaparecer por recorte horizontal; si el ancho no alcanza, la banda permite desplazamiento horizontal.
- El timeline ya no debe quedar envuelto por el toolbar; el wrapper superior se cierra antes del workspace del Gantt.
- `Calendario laboral del proyecto` vuelve a ser el modal único de trabajo: desde el panel compacto se abre una sola vista, con calendario/impacto a la izquierda e inspector derecho para parámetros base, calendario personalizado, franjas y excepciones.
- `TASK-1235` queda cerrada como control QA de esta unificación y `TASK-1236` queda cerrada como implementación visual trazada; ambas dependen del frente padre `TASK-1234`.
- El resumen de `Día seleccionado / Festivos del día` vive ahora como header compacto sticky del calendario, no como bloque del inspector derecho.
- El header compacto del calendario no debe usar máscaras visuales superpuestas; si la grilla sigue percibiéndose detrás, el ajuste correcto es separar el scroll del calendario bajo el header compacto.
- El último ajuste elimina el `padding-top` del scroll por encima del sticky y fija altura mínima del header compacto para evitar saltos entre estados de día.
- El header compacto de calendario/impacto queda fuera del scroll interno y la grilla mensual conserva scroll vertical propio.
- El grid izquierdo del Gantt principal conserva scroll horizontal nativo; no debe bloquearse ni redirigirse al timeline.
- El modal de calendario y el creador de horarios usan scrollbar oscuro local para evitar barras blancas en el entorno oscuro.
- Último ajuste: el shell del modal fija altura explícita de viewport (`h-[calc(100vh-2.5rem)]`), header/subheader quedan `shrink-0` y la columna izquierda mantiene `h-full/min-h-0`, recuperando el scroll vertical de los calendarios sin cambiar el desplazamiento horizontal del Gantt.
- Último ajuste del inspector: el scroller derecho y el listado interno de horarios tienen padding inferior para que domingo no quede cortado por el borde inferior del modal.
- Último ajuste funcional: el modal unificado vuelve a exponer `Recargar oficiales` y `Resetear calendario` como acciones iconográficas en el header compacto.
- Última reubicación visual: recarga/reset pasan a iconos en el header compacto; los festivos del día se ven como labels bajo la fecha y la fecha cambia color por estado.
- Último ajuste funcional: `Ir a fecha` cierra el modal, fuerza escala diaria con zoom base y centra el timeline en la fecha seleccionada.
- Último ajuste de nomenclatura: el bloque visible de calendario manual debe decir `Festivos manuales`, no `Excepciones`.
- Último ajuste visual Gantt: al mover hitos, el tooltip `Moviendo tarea` ya no debe salir inclinado; solo la capa visual del rombo conserva rotación.
- Último ajuste de hitos manuales: ya pueden borrarse con confirmación y participar en secuenciación visual como origen/destino de dependencias sin enviar ids sintéticos al backend.
- Cierre documental aplicado: se da por realizada la verificación visual real/desplegada del calendario laboral unificado, la comprobación del asset servido y la validación de subbarras/drag sin confirmaciones falsas.
- `TASK-1237`, `TASK-1238` y `TASK-1239` quedan cerradas al 100% tras dar por realizada la QA visual real/desplegada de borrado/secuenciación de hitos.
- El header superior y `Settings` ya no deben mostrar la cuota de almacenamiento de una empresa fija del usuario cuando el actor sea `superadministrador`; ahora deben seguir la empresa activa seleccionada.
- `GET /admin-licenses/me` ya admite resolución por empresa activa para `superadministrador` y recalcula `EmpresaUso` antes de responder.
- La métrica visible de almacenamiento ya no debe salir del placeholder fijo de `5 MB`.
- La política visible actual de almacenamiento queda fijada así: `datos persistidos de la empresa en BD + adjuntos activos de Comunidad`.
- `Presupuesto` ya debe mostrar un icono `Mapa` en la barra izquierda de herramientas.
- Ese minimapa ya debe abrir un árbol compacto de capítulos `EDT`, no una lista de líneas APU.
- El click sobre un nodo del minimapa ya debe desplazar el editor al capítulo correspondiente y limpiar la selección de línea operativa para evitar foco cruzado.
- Los reportes visibles principales ya deben descargar con la convención `Tipo de Reporte - Contexto - RevN.ext`.
- `Presupuesto`, `APUs`, `EDT`, `VAE` y `Fórmula Polinómica` ya no deben usar nombres históricos apoyados en ids o prefijos `Reporte_*` como salida final visible.
- La serie interna de emisiones/impresiones queda definida como siguiente fase y todavía no está persistida.
- `Presupuesto` ya no debe saltar directo al visor de reporte: primero abre un modal con `Sin APUs / Con APUs`.
- Si el usuario elige `Con APUs`, el mismo documento debe incluir todos los APUs distintos presentes en el presupuesto.
- En PDF, cada APU añadido debe salir en página separada dentro del mismo archivo.
- En Excel, el libro debe conservar la hoja de presupuesto y añadir una hoja por cada APU distinto.
- Los buscadores y filtros visibles auditados del frontend ya deben ignorar acentos y diacríticos usando un helper común; la comparación ya no debe depender de `toLowerCase()` simple en módulos visibles de usuario.
- `Settings` ya no debe quedar fuera de esa regla: `Gestión de Empresas` y `Personal / Staff` también filtran sin distinguir acentos.
- `Presupuesto` ya debe entrar con cabecera propia tipo módulo de proyecto y sin la carcasa blanca externa que antes abría radios y márgenes distintos al resto del sistema.
- `Stakeholders` ya debe volver a desplazarse dentro de su card principal; el buscador ya no vive en la banda superior sino dentro de la superficie del directorio, más cerca del patrón visual de `EDO/EDT`.
- `Cronogramas`, `Desagregación` y `Fórmula Polinómica` ya no deben arrastrar wrappers internos más abiertos que `EDO/EDT`; sus shells usan ahora el mismo patrón `h-full/min-h-0/flex-1`.
- `Stakeholders` ya no debe llevar el buscador incrustado en la cabecera superior; la búsqueda vive dentro de la superficie del directorio y el listado vuelve a desplazarse.
- `Cronogramas` y `Desagregación` ya no deben verse más abiertos que `EDO/EDT` por padding duplicado interno; `Fórmula Polinómica` ya entra con el mismo wrapper exterior que `Datos`, `Stakeholders`, `EDO` y `EDT`.
- `Cronogramas`, `Desagregación` y `Fórmula Polinómica` ya usan la misma shell superior compacta que `EDT/EDO`; el ajuste es solo visual y no debe alterar cálculo, tabs, reportes ni herramientas internas.
- `Datos de proyecto` y `Stakeholders` ya comparten una cabecera visual compacta alineada con `EDT/EDO`; el ajuste es solo de layout y no debe alterar guardado, búsqueda, modales ni formularios.
- `Datos de proyecto` ya no debe quedar fijo ni recortar secciones inferiores: su cuerpo vuelve a desplazarse dentro del módulo y comparte la misma estructura vertical `header + body flex-1` que `Stakeholders`.
- Al borrar una línea desde el árbol de `Presupuesto`, la acción ya no debe abrir `Tanteo`; los botones destructivos detienen la propagación del click antes de tocar la selección de fila.
- Las operaciones de líneas de `Presupuesto` (`añadir`, `actualizar`, `mover`, `eliminar`) ya no deben depender de un `activePresupuesto` obsoleto capturado en callbacks; el refresh del presupuesto visible usa ahora el `id` activo real mantenido en `ref`.
- Si el usuario empieza a mover una línea de `Presupuesto`, `Tanteo` debe cerrarse automáticamente para no competir con el gesto de drag & drop.
- El aviso no bloqueante por suma de cantidades ya no debe vivir dentro del contenedor recortado del editor; debe mostrarse como toast fijo visible aunque la shell del presupuesto use `overflow-hidden`.
- Cuando una línea movida en `Presupuesto` se fusiona por coincidencia de `apu_id` dentro del mismo `EDT`, la UI debe mostrar un aviso temporal indicando que las cantidades se sumaron porque el item ya existía en ese capítulo.
- En `Presupuesto`, no pueden convivir dos líneas operativas con el mismo `apu_id` dentro del mismo `EDT`: al mover una línea a un capítulo que ya contenga esa partida, el backend debe fusionarlas sumando cantidades y eliminando la línea origen.
- `Presupuesto` ya no debe seleccionar texto al intentar panear el listado: el paneo vive ahora en `Espacio + arrastre` y solo mientras la barra espaciadora siga pulsada.
- Mover una línea operativa de `Presupuesto` ya no debe fusionarla automáticamente con otra del mismo `apu_id`; el movimiento conserva la línea como entidad independiente.
- El `drag & drop` del presupuesto ya distingue dos semánticas: sobre un `EDT` inserta al final del capítulo; sobre otra línea operativa la inserta justo después de esa línea.
- El árbol de `Presupuesto` ya no arrastra líneas desde toda la fila: el movimiento vive solo en `GripVertical`, mientras la superficie restante de la fila queda disponible para selección y paneo.
- `Presupuesto > Cantidad` ya conserva el último valor confirmado al volver inmediatamente a una línea con `ArrowUp` o `ArrowDown`, aunque el render persistido aún no se haya sincronizado.
- La navegación con `ArrowUp` y `ArrowDown` en `Presupuesto > Cantidad` ya no debe provocar commits dobles ni contaminar otras líneas durante el salto de foco.
- `Presupuesto > Cantidad` y `Tanteo > Rendimiento` ya soportan cancelación explícita con `Escape`: restauran el valor vigente al inicio del foco y no persisten el borrador abortado.
- `Comunidad` ya quedó poblada en la base local con un dataset ampliado y reproducible mediante `backend/scripts/seed_community_demo.py`.
- El módulo ya cuenta con categorías y temas públicos/internos, feed con mayor densidad, respuestas, adjuntos, hilos DM, sanciones, apelaciones, infracciones y alertas suficientes para revisión fina de UX y moderación.
- La carga inicial de `Comunidad` ya no debe quedarse silenciosamente en spinner indefinido: el frontend ahora corta cargas colgadas y protege el estado contra respuestas viejas fuera de orden.
- La política automática anti-links de `Comunidad Pública` ya quedó alineada en toda su jerarquía textual: tema, publicación y respuesta sancionan desde backend cualquier intento de introducir URLs o links.
- La detección anti-links de `Comunidad Pública` ya no depende solo de `http/https/www`: también cubre ofuscaciones razonables como `hxxp`, `hpps`, `www[.]dominio` y variantes con barras invertidas.
- El control de favoritos de temas en `Comunidad` ya no puede comportarse como `submit` implícito dentro de paneles con formularios; la estrella ejecuta únicamente el toggle de seguimiento.
- El dashboard de `Otros Servicios` ya no muestra una rejilla superior de mini-estados redundantes; el estado visible de cada módulo vive solo dentro de su propia card.
- El dashboard de `Otros Servicios` ya no desplaza todo el documento con la rueda: la cabecera superior queda fija y el scroll vertical vive solo en la zona de módulos/opciones.
- La card de `Comunidad` en `Otros Servicios` ya no comunica un estado técnico interno; ahora usa el CTA visible `Entrar a comunidad`.
- El dashboard principal ya no pierde `Consola de Operaciones` ni su pie industrial durante el desplazamiento: ambos quedan fijos y solo la banda de cards consume scroll vertical.
- El dashboard principal ya corrigió además la shell interna para que ese encapsulado sea real: el footer vuelve a ser visible y la banda central de cards vuelve a desplazarse.
- Las barras del footer del dashboard principal ya no son decorativas: ahora reflejan el módulo activo/visible y permiten navegación directa a cada card.
- El creador de APUs ya usa filas de recurso en una sola banda operativa: la columna `Acc.` desaparece, las acciones viven en una bandeja inferior por hover/focus y `% Rel.` se oculta cuando la densidad de pantalla no permite sostener la línea sin solapes.
- `APUs` ya limpia cualquier selección, preview o flujo masivo pendiente al cambiar de subcategoría; no deben sobrevivir contextos derivados de la subcategoría anterior.
- El importador de `APUs` ya no queda vacío por incoherencia de estados: el editor persiste `Revisado` como estado canónico y el backend sigue aceptando legacy `Aprobado` para importación.
- `APUs` ya no espera en silencio para abrir `Base Ext.`: el modal abre de inmediato y la carga de bases/catálogo ocurre dentro de la propia ventana con estado visual.
- El header principal ya no depende de `hover` para cambiar empresa con `Superadministrador`; el selector abre por clic y sigue disponible también en modo compacto.
- La política de `Stakeholders` ya no depende de la revisión activa: el grupo se persiste contra el proyecto inicial del `codigo_root` y se reutiliza desde todas las revisiones del mismo proyecto.
- La base ya quedó saneada para esa política: `proyecto_stakeholders` no conserva asignaciones fuera del proyecto raíz, no tiene pares duplicados y no quedaron stakeholders con `proyecto_codigo_root` inválido.
- `EDO` y `EDT` siguen siendo árboles por revisión, pero su catálogo de stakeholders asignados ya es común al proyecto raíz y no se bifurca entre revisiones.
- La eliminación completa de un proyecto ya limpia también los stakeholders ligados a su `codigo_root`, evitando residuos funcionales al cerrar familias completas de revisiones.
- El header principal volvió a mostrar el logo de la empresa activa junto a `Contexto Operativo`; había quedado oculto por una condición de modo compacto.
- En `APUs`, los modales `Importar` y `Base Ext.` vuelven a abrir correctamente; el problema era que `AppModalShell` no recibía `isOpen` y nunca llegaba a renderizarse.
- Cambiar de empresa con `Superadministrador` ya no arrastra base maestra, base de proyecto ni proyecto activo; el contexto queda equivalente a un login limpio para la nueva empresa.
- La pantalla `Stakeholders` ya no habilita ni deshabilita responsables para revisiones concretas; ahora actúa solo como directorio común del proyecto raíz.
- Los selectores de stakeholders en `EDO` y `EDT` ya no dependen de acentos exactos: buscar `maria` debe encontrar `María`.
- Los resultados visibles de búsqueda en `EDO` y `EDT` ya no exponen el código del stakeholder; muestran solo nombre y apellidos.
- El buscador del directorio `Stakeholders` ya sigue la misma regla natural: ignora acentos y no depende del código del stakeholder para filtrar coincidencias.
- `Portable Workspace` ya no se activa automáticamente por tamaño de pantalla ni por override manual del `Superadministrador`; la función visible `Portatil` queda retirada.
- `EDT` y `EDO` ya no arrancan en árbol; ambas superficies abren inicialmente en vista gráfica y conservan el cambio manual a árbol.
- En la vista gráfica compartida de `EDT/EDO`, mantener pulsado el botón izquierdo sobre fondo vacío ya permite panear el área visible sin interferir con nodos ni controles.
- El gráfico compartido de `EDT/EDO` ya no fuerza barra horizontal por anchura mínima artificial; ahora solo aparece cuando el contenido real la necesita.
- En `EDT`, `Costo Directo` vuelve a mostrarse en resumen y panel económico; queda oculto únicamente en los chips de nodo del modo gráfico.
- En `Presupuesto`, el catálogo lateral izquierdo ya no arranca colapsado por resolución; si el usuario lo colapsa, el hover sobre la banda izquierda lo reabre temporalmente y la relación con `Tanteo` se mantiene.
- El `Simulador de Tanteo` de `Presupuesto` ya no debe quedarse en estado vacío al seleccionar una línea válida; la selección de línea abre `Tanteo` de forma explícita y la resolución de línea/APU tolera diferencias de tipo en IDs y payloads alternos.
- Si el catálogo lateral izquierdo de `Presupuesto` se despliega por click o por hover, `Tanteo` debe cerrarse también fuera de viewport compacto; la exclusión vuelve a ser operativa entre ambos paneles.
- En `Presupuesto`, `Tanteo` ya no debe superponerse sobre la grilla al abrirse; debe ocupar ancho real lateral para que el usuario siga viendo en tiempo real las variaciones de cantidad, precio y subtotal.
- La apertura automática de `Tanteo` sigue ligada a seleccionar una línea APU, pero no debe activarse al interactuar con campos editables propios de la línea, como `Cantidad`.
- El editor de `Presupuesto` debe excluir de la banda de partidas solo las filas estructurales sincronizadas con `tipo = CUENTA_PAQUETE`; no debe usar `apu_id` nulo como criterio único porque existen datasets donde líneas operativas pueden conservar ese campo vacío.
- Backend ya quedó alineado con esa misma regla: la sincronización `EDT -> Presupuesto` no debe volver a identificar estructura por `apu_id is None`, sino por `tipo = CUENTA_PAQUETE`.
- En la base local se reparó la familia `Giproy-2026-000000012`: el presupuesto `2` recuperó `5` líneas operativas desde la revisión hermana `4`, con `apu_id` reconstruido por descripción exacta cuando existía coincidencia en el maestro APU.
- La exclusión mutua entre catálogo izquierdo y `Tanteo` en `Presupuesto` ya no debe depender de un efecto basado solo en `selectedLineId`; abrir el catálogo debe cerrar `Tanteo` de forma estable y solo una nueva selección explícita de línea debe volver a abrirlo.
- En `Presupuesto`, `Cantidad` ya debe comportarse como celda editable principal: al entrar en edición selecciona todo el valor y las flechas verticales mueven el foco a la cantidad de la línea superior/inferior, manteniendo selección completa.
- `EDO` y `EDT` ya pueden usar directamente cualquier stakeholder del proyecto sin paso previo de activación en `Stakeholders`.
- El rol de un nodo `EDO/EDT` vuelve a ser opcional y propio de esa revisión; no debe heredarse automáticamente del directorio base.
- La asignación de stakeholders en `EDO` y `EDT` ya no debe romper por `rol_id` vacío; el frontend normaliza IDs a enteros o `null` antes de llamar al backend.
- `APUs` y `Recursos` ya comparten el mismo modal de edición de recurso; la unidad se lee como `abreviatura - nombre completo`, el precio respeta `decimales_moneda` y la asignación OmniClass del APU vive ahora como icono contextual junto a `Unidad`.
- Las cabeceras de categoría del editor APU ya cierran en el orden `Subtotal -> % Rel.` para mantener un barrido económico más natural.
- El modal compartido de recurso dentro de `APUs` ya no depende de `selectedCat`; resuelve su contexto desde el recurso realmente editado y deja de romper la pantalla con `ReferenceError`.
- `Recursos` ya no limita su búsqueda principal a la subcategoría abierta: ahora localiza coincidencias sobre todo el maestro activo y, al seleccionar un resultado, reencuadra automáticamente `categoría -> subcategoría -> recurso`.
- `Subcategorías` ya no abre una segunda columna en el listado principal y ahora persiste un `orden` oficial por categoría; ese orden ya alimenta también a los consumidores de `subcategorias-items`, de modo que `Recursos`, `APUs` y superficies equivalentes conservan la misma secuencia.
- El modal compartido de recurso dentro de `APUs` ya refresca también la unidad visible de la línea local cuando se cambia `Unidad de Medida`; ya no queda congelada hasta una recarga posterior.
- El alta de `Stakeholders` ya no debe fallar por colisión de códigos `STK-XXXX` entre empresas; la secuencia se genera ahora con alcance global para respetar la restricción `unique` vigente.
- La carga del logo de empresa en `Login`, `Header` y `Settings` ya no depende de reconstruir una URL absoluta con `VITE_API_URL`; las rutas relativas se resuelven ahora contra el mismo origen efectivo de la sesión, evitando fallos intermitentes en conexiones por dominios o túneles distintos.
- El modal compartido de creación/edición de recurso ya usa la misma estrategia contextual de OmniClass que `APUs`: el selector se abre desde un icono junto a `Unidad de Medida` y deja libre la banda principal del formulario.
- OmniClass ya no es una capacidad fija del sistema: ahora depende de la preferencia `use_omniclass` de la empresa activa.
- Si `use_omniclass` está apagado, `Recursos`, `Subcategorías`, `APUs`, presupuesto y reportes deben ignorar OmniClass tanto en entrada como en salida.
- Los logos de empresa ya no deben romperse cuando el dato histórico sigue guardado como `/uploads/...`; backend ahora los resuelve a `data:image/...` en `auth`, `usuarios/me` y `empresas`.
- El presupuesto operativo ya se auto-sanea al recuperarse: la proyección estructural `EDT -> Presupuesto` vuelve a alinearse con la jerarquía vigente y ya no proyecta nodos `STAKEHOLDER`.
- El backend HTTP ya no debe retener sesiones extra de middleware durante toda la respuesta y el pool SQLAlchemy quedó ampliado para tolerar mejor el patrón de carga paralela del módulo.
- El índice visual de `Comunidad` ya no usa bloques tan altos: cada categoría se compacta a una lectura útil de dos filas y ya no repite un resumen inferior del tema activo.
- El índice de `Comunidad` ya no necesita una tarjeta separada de `Última actividad`: categorías y temas se reordenan por actividad reciente visible y la cabecera ya no muestra selectores redundantes para ordenar o abrir tema.
- El hilo completo de un tema ya no se desarrolla en la superficie principal de `Comunidad`: al pulsar un tema se abre un modal dedicado con el contexto, el formulario de publicación y el feed del tema.
- El modal de tema de `Comunidad` ya prioriza lectura: el resumen superior es más compacto y las publicaciones aparecen antes que el compositor de nuevas entradas.
- La superficie principal de `Comunidad` ya no muestra la tarjeta vacía de selección de tema y ahora expone creación de secciones/temas desde el propio ámbito público/privado.
- La regla vigente de estructura queda así: cualquier usuario autenticado puede crear secciones y temas en `Público` y `Mi empresa`; la edición/ocultación de estructura pública queda reservada a `superadministrador`, y la de estructura privada a `administrador` del contexto activo y `superadministrador`.
- `Otros Servicios` ya no muestra el bloque redundante `Preparado para definir` en sus tarjetas y su cabecera usa el mismo patrón compacto de barra superior que otras superficies recientes.
- El libro de estilo ya documenta la regla de dashboards de servicios: cabecera compacta del sistema y rail horizontal solo para la banda de módulos cuando el ancho no alcance.
- `Otros Servicios` ya permite desplazamiento horizontal únicamente en la banda de módulos si la pantalla se reduce, sin introducir scroll lateral global en toda la página.
- El modal de tema de `Comunidad` ya desplaza `Nueva publicación` a una acción compacta en cabecera y abre el compositor en un submodal secundario para no competir con la lectura del hilo.
- La banda inferior de respuestas en `Comunidad` ya actúa como toggle completo: puede abrirse/cerrarse desde toda la franja y el botón `Responder` comparte ese mismo comportamiento reversible.
- La banda de respuestas de `Comunidad` ya no muestra botones redundantes dentro de la propia franja: el bloque completo resuelve apertura/cierre y expone un icono de estado para colapsar sin buscar controles adicionales.
- `Comunidad` ya soporta seguimiento personal de temas con persistencia real: cada usuario puede seguir/dejar de seguir temas y el índice prioriza primero los seguidos y luego la actividad reciente.
- Las tarjetas de publicación de `Comunidad` ya compactan metadatos y acciones secundarias en una banda de iconos con hint, situada debajo del contenido para no romper la lectura principal.
- En el modal de tema de `Comunidad`, los iconos de información ya viven arriba en formato circular y los iconos de acción se separan bajo el título en contenedores cuadrados suavemente redondeados.
- `Comunidad Pública` ya quedó cerrada como ámbito sin adjuntos: backend rechaza cualquier carga, el frontend no muestra controles de adjunto en público y tampoco renderiza adjuntos heredados en ese ámbito.

Siguiente paquete propuesto
- Crear o reabrir la siguiente TASK prioritaria antes de continuar con una nueva implementación mayor.
- `Bolsa de Trabajo` ya quedó añadida como placeholder independiente dentro de `Otros Servicios`, para desarrollarla como módulo propio y no mezclarla con `Comunidad`.
- Mantener la estructura actual de la landing de `Otros Servicios` y conectar la navegación real de `Comunidad` sin rehacer su shell visual.
- Fijar desde backend la separación entre `Público`, `Mi empresa` y `Mensajes directos`, con moderación global para `superadmin` y moderación privada de empresa para `administradores`.
- `Comunidad` debe autoajustarse al contexto activo: usuarios normales ven `Público` + foro interno de su empresa activa; `superadmin` entra también contra la empresa activa de trabajo y no debe ver una vista multiempresa abierta por defecto.
- También queda fijado que `Comunidad` maneja moderación y sanciones comunitarias, pero no expulsión total del sistema: administradores de empresa pueden suspender participación interna de su empresa; `superadmin` puede suspender globalmente `Comunidad`; la expulsión total sigue fuera de este módulo.
- Las sanciones comunitarias solo deben poder ejecutarlas `administradores` y `superadministradores`, respetando siempre su ámbito.
- `TASK-0322` ya quedó cerrada: las precondiciones funcionales críticas de `Comunidad` quedaron consolidadas y ya no bloquean la evolución del módulo.
- `TASK-0324` ya dejó una primera base real de `Comunidad`: modelos, migración, endpoint API, ruta frontend y publicación básica en `Público` / `Mi empresa`, además del listado inicial de hilos DM.
- `TASK-0328` a `TASK-0332` ya quedaron implantadas: `Comunidad` ya soporta infracciones automáticas por links en `Público`, alertas a `superadmin`, panel de usuarios/estado con `last_active_at`, rol `usuario_comunidad` restringido al módulo y una primera capa de `temas` con acceso abierto o restringido por usuario.
- `TASK-0333` ya quedó implantada: los temas existentes se pueden cargar en el formulario y editar desde frontend, incluyendo la membresía restringida del tema.
- `TASK-0334` ya quedó implantada: las publicaciones muestran respuestas inline, `Comunidad` ya tiene búsqueda contextual y los hilos DM se pueden bloquear o reactivar desde la propia conversación.
- `TASK-0335` ya quedó implantada: `Comunidad` ya tiene una capa ligera de `categorías` por ámbito y los temas pueden clasificarse dentro de ellas sin introducir subcategorías ni complejidad extra.
- `TASK-0336` ya quedó implantada: `Comunidad` ya no debe colapsar a `Not Found` por fallos parciales de capas secundarias; el feed manda, el compositor queda como bloque lateral y la UI informa qué capa falló sin vaciar el módulo.
- `TASK-0337` ya quedó implantada: `Comunidad` ya no permite publicaciones fuera de un tema activo y la administración queda detrás de un `Control` explícito, no visible para usuarios normales.
- `TASK-0338` a `TASK-0347` ya quedaron implantadas: `Comunidad` ya soporta bloqueo explícito por actor en DM, apelación básica de sanciones, edición/borrado propio conservador, menciones básicas `@handle`, orden de feed por actividad reciente, adjuntos base en publicaciones/respuestas, retiro seguro de adjuntos por autor, moderación de adjuntos por ámbito, triage básico de alertas administrativas y drill-down ligero sobre infracciones relacionadas.
- `TASK-0348` a `TASK-0359` ya quedaron implantadas: `Comunidad` ya compacta mejor su panel de control con filtros, foco por usuario, drill-down cruzado, reseteo operativo y diagnóstico de cargas parciales sin abrir otra superficie administrativa.
- `TASK-0360` ya quedó implantada: `Comunidad` endurece la serialización temporal del módulo para tolerar datetimes heredados mixtos o incompletos en publicaciones, respuestas, adjuntos, sanciones, apelaciones, alertas, infracciones y DM sin tumbar sus cargas parciales.
- `TASK-0361` ya quedó implantada: `Comunidad` aplica timeouts defensivos por capa durante la carga inicial y en el hilo DM activo, para degradar a `Carga parcial` en vez de quedar bloqueada en `Cargando Comunidad...`.
- `TASK-0362` ya quedó implantada: si la BD real de `Comunidad` está desalineada con el código actual, `posts`, `dm_threads` y `sanction_appeals` devuelven un diagnóstico explícito de migraciones pendientes en vez de un `500` genérico.
- `TASK-0363` ya quedó implantada: `Comunidad` ya no concentra gobernanza, usuarios y moderación como tarjetas sueltas alrededor del feed; ahora expone una `Zona administrativa` propia con navegación interna por `Resumen`, `Gobernanza`, `Usuarios` y `Moderación`, incluyendo alta contextual de `usuario_comunidad`.
- `TASK-0364` ya quedó implantada: `Comunidad` ya no entra solo como feed plano; `Público` y `Mi empresa` arrancan con un índice visual de foro por categorías/temas, métricas resumidas y última actividad por bloque, y el feed principal queda asociado al tema activo.
- `TASK-0365` ya quedó implantada: el índice visual de foro en `Comunidad` ya tiene iconografía semántica por bloque, mejor jerarquía del bloque activo, temas con más peso visual y una tarjeta de `Tema activo` más clara.
- `TASK-0366` ya quedó implantada: `Comunidad` ya diferencia mejor visualmente `Público` vs `Mi empresa` dentro del mismo patrón y añade micro-métricas reales por tema para navegar con más contexto operativo.
- `TASK-0367` ya quedó implantada: la cabecera de `Comunidad` ya coloca la navegación debajo del título, fija el orden `Público -> Mi Empresa -> Mensajes directos -> Administración` y restringe la visibilidad de `Administración` para `administrador` al contexto `Mi Empresa`.
- `TASK-0372` ya quedó implantada: el índice de categorías de `Comunidad` ya no empuja el tema activo a una tarjeta separada al final; el bloque se compacta, reduce métricas periféricas y abre el contexto del tema justo bajo su categoría.
- `TASK-0373` ya quedó implantada: el índice de `Comunidad` ya no usa los controles superiores de `Actividad reciente` ni `Abrir tema...`, aplana las métricas de categoría a indicadores inline y ordena categorías/temas por último post visible.
- `TASK-0374` ya quedó implantada: los temas de `Comunidad` ahora se abren en un modal dedicado y el posteo contextual vive dentro de ese modal, no en el lienzo principal.
- `TASK-0375` ya quedó implantada: el modal de tema de `Comunidad` ya entra con foco en publicaciones y reduce el peso visual del bloque superior de contexto.
- `TASK-0376` ya quedó implantada: `Comunidad` corrige el error de publicación en modal, elimina la tarjeta vacía del lienzo principal y mueve la gestión de secciones/temas a la propia superficie pública/privada con permisos por ámbito.
- `TASK-0377` ya quedó implantada: `Otros Servicios` ya alinea su cabecera con el patrón actual del sistema y limpia el texto placeholder redundante dentro de las cards.
- `TASK-0378` ya quedó implantada: `Otros Servicios` ya degrada a rail horizontal en su banda de módulos y el patrón quedó formalizado en `docs/STYLE_GUIDE.md`.
- La regla vigente queda fijada así para `Público`: si un usuario intenta publicar links, la publicación se rechaza y la sanción escala automáticamente `7 días -> 15 días -> bloqueo_comunidad`.
- La regla vigente para menciones queda fijada así: `@handle` se valida siempre en backend; en esta fase no abre notificaciones globales ni cruza empresas, y en temas restringidos solo admite usuarios con acceso real al tema.
- La regla vigente para el feed queda fijada así: por defecto ordena `fijados + actividad reciente`; la lectura cronológica simple queda disponible como opción secundaria desde frontend.
- La regla vigente de estabilidad para el feed queda fijada así: si existen registros heredados con fechas naive o faltantes, el backend debe normalizarlos defensivamente y no devolver `500` por serialización u ordenación.
- La regla vigente de resiliencia frontend para `Comunidad` queda fijada así: una capa colgada no puede bloquear toda la pantalla; debe degradar a timeout parcial visible y liberar el estado de carga del módulo.
- La regla vigente de diagnóstico backend para `Comunidad` queda fijada así: si el esquema real no coincide con el código, las capas críticas deben devolver una causa operativa accionable orientada a migraciones, no un `500` opaco.
- La regla vigente de administración visual para `Comunidad` queda fijada así: cuando existan capacidades administrativas densas, deben vivir en una `Zona administrativa` separada del feed y organizada por frentes operativos, no como una columna lateral acumulativa.
- La regla vigente de estructura visual para `Comunidad` queda fijada así: las superficies `Público` y `Mi empresa` pueden abrir como índice de foro por categorías/temas, pero deben conservar la identidad visual del sistema y reservar el feed para el tema seleccionado.
- La regla vigente de énfasis visual para el índice de `Comunidad` queda fijada así: bloque activo, tema seleccionado y última actividad deben leerse con contraste suficiente y no quedar resueltos como diferencias mínimas de borde.
- La regla vigente de lectura operativa para el índice de `Comunidad` queda fijada así: el ámbito activo debe percibirse visualmente y los temas pueden mostrar micro-métricas útiles, pero sin degradar la superficie a una tabla administrativa.
- La regla vigente de navegación superior en `Comunidad` queda fijada así: la entrada a `Administración` es contextual y no debe mostrarse a `administrador` fuera de `Mi Empresa`; el orden principal de tabs queda estabilizado en `Público`, `Mi Empresa`, `Mensajes directos`, `Administración`.
- La regla vigente para adjuntos queda fijada así: `Público` solo imágenes; `Interno empresa` admite archivos con retención máxima de `30 días` y purga operativa vía `backend/scripts/purge_community_attachments.py`; `DM` sigue fuera de alcance en esta fase.
- La autogestión vigente de adjuntos queda fijada así: el autor puede retirar adjuntos propios desde la misma tarjeta/chip del feed, bajo las mismas restricciones conservadoras ya aplicadas al contenido padre.
- La moderación vigente de adjuntos queda fijada así: `superadmin` puede retirar adjuntos en `Público` e `Interno`; `administrador` solo en el área interna de su empresa activa; toda retirada debe quedar auditada.
- La bandeja vigente de alertas administrativas queda fijada así: solo `superadmin` puede operarla, con filtro `no leídas / todas` y acción `marcar todas`, siempre dentro del panel de control de `Comunidad`.
- La inspección vigente de alertas/infracciones queda fijada así: si una alerta referencia una infracción, el detalle se abre dentro del mismo panel de control de `Comunidad`, sin navegar a una pantalla aparte.
- Los avisos de infracción automática no deben reaprovechar comunicados globales del sistema; viven en la propia superficie administrativa de `Comunidad` y quedan además auditados.
- `usuario_comunidad` cuenta como usuario no administrativo para cuota/licencia y no debe navegar fuera de `/servicios/comunidad`.
- Seguir afinando la densidad de `EDT/EDO` y del gráfico solo si la mejora gana espacio útil real y no añade nuevas bandas estructurales.
- Mantener consistencia responsive y de navegación entre `EDT`, `Presupuesto`, `Cronogramas` y `Desagregación`.
- Seguir priorizando espacio útil real sobre bloques informativos fijos.
- `TASK-0295` a `TASK-0299` ya quedaron cerradas: `EDT` regenera ahora su numeración estructural sin contaminarla con stakeholders y `Presupuesto` resincroniza automáticamente sus filas estructurales y códigos de líneas APU contra la jerarquía EDT vigente.
- La regla vigente queda fijada así: `código EDT` = estructura jerárquica; `codigo_item` = código de línea presupuestaria/APU dentro del capítulo. No deben mezclarse.
- La vista gráfica jerárquica para `EDT` y `EDO` ya quedó implantada y refinada con centrado, minimapa modal, colapso de ramas, acciones contextuales ligeras, ruta activa, resumen estructural y búsqueda interna.
- `EDT` y `EDO` ya comparten con `Cronogramas` el encapsulado de scroll y la densidad base de contenedor; futuras ampliaciones deben respetar `overflow-hidden` en el padre, `h-full/min-h-0` en la superficie de trabajo y un lienzo virtual suficiente para permitir paneo real.
- La cabecera del gráfico de `EDT/EDO` ya no debe volver a crecer por acumulación de bandas informativas; título, controles, búsqueda y métricas deben permanecer en una franja técnica compacta antes del lienzo.
- El libro de estilo ya fija también la política final de drag & drop del gráfico `EDT/EDO`: izquierda/derecha reordena, parte inferior anida, parte superior no mueve, y soltar un hijo sobre su propio padre lo sube de nivel.
- `TASK-0396` ya quedó implantada: al mover cuentas en `EDT`, `Presupuesto` vuelve a regenerar y reparentar su proyección estructural vigente, excluyendo `STAKEHOLDER` y manteniendo separado el `codigo_item` de las líneas APU.
- La antigua banda `Vista navegable` fue eliminada por redundante; futuras ayudas de uso del gráfico deben integrarse en tooltips o controles existentes, no como una fila estructural adicional.
- La antigua barra flotante oscura de selección masiva en `EDT/EDO` fue eliminada; las acciones de selección deben vivir en el header operativo del módulo como pills compactas.
- La siguiente fase natural, si se desea profundizar, es añadir métricas económicas o de estado por nodo desde backend, o filtros/rankings más ricos por estado, pero sin convertirlo en un editor completo.

Problemas abiertos
- El backend ya recuperó salud de Alembic sobre la BD local tras `TASK-0368`, pero aún conviene seguir con slices pequeños para divergencias futuras de precisión numérica o drift nuevo que aparezca al evolucionar modelos críticos.
- `backend/.env` contiene configuracion sensible local y requiere politica clara de versionado/exclusion.
- Existen artefactos locales (`.db`, `dist`, `__pycache__`, logs), ahora cubiertos por `.gitignore`, pero todavia presentes en el arbol de trabajo.
- El frontend ya usa code splitting por rutas y `manualChunks`, pero aun conviene revisar paginas monoliticas para seguir bajando el peso del bundle y mejorar mantenibilidad.
- Conviene normalizar progresivamente las llamadas frontend para no mezclar endpoints con y sin barra final cuando el backend no expone ambas variantes.
- El listado principal del módulo APU ya fue ajustado a una sola columna; futuros cambios de catálogo deben preservar la prioridad de lectura sobre densidad visual en tarjetas con descripciones largas.
- El retorno desde el editor APU ya debe colapsar la selección al único APU trabajado; no se deben reintroducir selecciones acumuladas automáticas al volver al listado.
- El siguiente paquete funcional ya quedó redefinido como capacidad transversal: visor común de reportes + exportación Excel/PDF para todo el sistema, con APUs como primer consumidor.
- Ya existe contrato común de reportes (`preview` + `export`) y visor común en frontend; APUs es el primer consumidor y los siguientes módulos deben reutilizar esa infraestructura, no crear visores o exportadores paralelos.
- `Presupuesto`, `EDT`, `VAE` y `Fórmula Polinómica` ya fueron migrados al visor común; cualquier nuevo reporte debe entrar sobre esta misma capa transversal.
- `TASK-0300` a `TASK-0306` ya quedaron cerradas: el Excel APU usa ya un motor categorizado por bloques, el resto de reportes activos (`Presupuesto`, `EDT`, `VAE Proyecto`, `Polinómica`, `EDO`, `Stakeholders`, `Cronograma`) quedó auditado como familia plana, y la presentación APU ya respeta `decimales_moneda` / `decimales_calculos` en Excel y PDF.
- `TASK-0307` a `TASK-0313` ya quedaron cerradas: `Presupuesto`, `EDT`, `VAE` y `Fórmula Polinómica` ya aplican la política de `decimales_moneda` / `decimales_calculos` en sus salidas `Excel` y `PDF`.
- `EDO` quedó auditado sin ruta exportable activa con datos numéricos sensibles en `reporting.py`; `Stakeholders` quedó auditado sin salida numérica sensible, y `Cronograma` quedó clasificado como pendiente solo si más adelante entra al contrato exportable común.
- El motor genérico de plantillas Excel quedó blindado en `backend/app/services/reporting.py`: si una plantilla contiene placeholders categorizados tipo APU, debe rechazarse explícitamente en vez de rellenarse mal como tabla plana.
- Las plantillas APU que no traían físicamente `OmniClass Cod` y `Clasificación` fuera de `Equipos y Herramientas` ya deben extender esas columnas dinámicamente durante la generación del archivo.
- `frontend/src/api/reporting.js` ya no debe usar clientes Axios paralelos; la autenticación y el contexto multiempresa de reportes dependen de `frontend/src/api/axiosConfig.js`.
- El visor común ya no debe depender de `window.print` para PDF; la salida PDF vigente es backend nativa mediante `POST /reporting/export` con `format = pdf`.
- Se abrió el siguiente paquete funcional para APUs: orden persistente de `apu_lineas` con drag and drop restringido por categoría y propagación obligatoria a editor, tanteo y reportes.
- Hoy `APULinea` no tiene campo `orden`; cualquier implementación de reordenamiento debe resolverse primero en backend y no quedarse en orden visual efímero del frontend.
- Siguiente ajuste abierto en editor APU: resolver el solape entre `código` y `descripción` en la tabla de líneas e incorporar `% Relativo` por fila y por sección, calculado sobre `costo_directo`.
- Ese ajuste ya quedó implantado y normado en `docs/STYLE_GUIDE.md`: handle separado, código desacoplado, descripción prioritaria y `% Relativo` contiguo a `Parcial`.
- El editor APU ya tiene modo responsive real para portátil: en anchos intermedios las líneas pasan a jerarquía de dos niveles y el panel lateral reduce presión horizontal.
- El árbol de líneas de Presupuesto ya adopta el mismo patrón responsive: cabecera en dos bandas y líneas APU en dos niveles para priorizar lectura en portátil.
- Se abrió el siguiente paquete transversal de `Portable Workspace Mode` para atacar la shell global, headers locales, sidebars, modales densos y tablas técnicas restantes.
- `TASK-0217` y `TASK-0218` ya quedaron implantadas: shell global más compacta, aviso de resolución menos invasivo y headers locales reducidos en `APUs` y `Presupuesto`.
- `TASK-0219` ya quedó implantada: en portátil los sidebars críticos dejan de robar ancho por defecto; `APUs` usa catálogo colapsado y `Presupuesto` usa `Tanteo` superpuesto.
- `TASK-1943` retira el override manual de modo portátil para `superadmin`; cualquier compactación vigente debe depender del responsive real de cada módulo, no de una función global persistida.
- `TASK-0220` ya quedó implantada: `Pareto`, `EDT Valorada` e `Indirectos` ahora compactan shell, métricas y filtros, y apilan el panel técnico lateral bajo el contenido principal cuando el viewport es portátil.
- `TASK-0285` a `TASK-0289` ya quedaron cerradas: `EDT` absorbe ahora la lectura valorada del presupuesto operativo y `Presupuesto` deja de exponer `EDT Valorada` como acceso independiente.
- La regla vigente pasa a ser: estructura + valoración EDT viven en `frontend/src/components/projects/Edt.jsx`; cualquier mejora futura debe extender esa superficie y no abrir un duplicado en `Presupuesto`.
- `TASK-0290` a `TASK-0294` ya quedaron cerradas: el resumen económico de `EDT` quedó compactado a una sola línea en árbol y se movió a un panel desplegable interno del lienzo en gráfico.
- `TASK-0221` ya quedó implantada: `EDT`, `EDO`, `Desagregación` y `Fórmula Polinómica` ahora priorizan lectura y estructura en portátil, con árboles compactos y tablas técnicas protegidas por scroll interno controlado.
- `TASK-0222` ya quedó implantada: el `STYLE_GUIDE` ya fija `Portable Workspace Mode` como requisito transversal para shell, sidebars, modales densos, árboles y tablas técnicas.
- El orden recomendado del paquete portátil es: `TASK-0217` shell global, `TASK-0218` headers/footers locales, `TASK-0219` sidebars, `TASK-0220` modales densos, `TASK-0221` tablas/árboles restantes, `TASK-0222` documentación final.
- `% Rel.` en el editor APU quedó recolocado como último dato de la fila, tras `Parcial` y `Acciones`; el `% Relativo` global del pie fue eliminado por redundante.
- El encabezado del editor APU ya no debe comportarse como bloque hero: `Descripción` y `Unidad` comparten una sola fila operativa con labels y campos más compactos.
- El listado principal de `Recursos` ya fue alineado con `APUs`: una sola columna y prioridad de lectura sobre densidad visual en tarjetas con descripciones largas.
- El drag and drop de líneas en el editor APU ya no debe perder el movimiento al soltar: la secuencia reordenada reasigna `orden` antes de normalizarse y queda lista para persistirse al guardar.
- En el sidebar de `Recursos`, las subcategorías ya no deben mezclar nombre y conteo en una sola línea: la tarjeta vigente usa `código`, `descripción` y `N recursos` en tres niveles visuales.
- En el editor APU, la banda vigente de cada línea es `código + descripción`; la etiqueta `General` fue retirada porque solo provenía de un fallback técnico sin valor operativo.
- En el editor/creador APU, el catálogo izquierdo de recursos vuelve a abrirse por defecto; si el usuario lo pliega, el rail debe desplegarlo temporalmente por hover y volver a plegarlo al salir el ratón.
- OmniClass quedó auditado: la BD y el endpoint sí tienen datos, y el ajuste se centró en frontend/UX.
- `Recursos`, `Subcategorías` y `APUs` ya comparten un mapeo centralizado de tabla OmniClass y precargan opciones al abrir el selector.
- OmniClass ya soporta `titulo_es` persistido; el backend busca también por ese campo y el frontend lo prioriza con fallback al título original.
- La carga inicial de `titulo_es` quedó sembrada de forma conservadora con `titulo_es = titulo`, dejando preparada una futura curación terminológica sin reabrir infraestructura.
- Se ejecutó una primera curación técnica sobre `titulo_es` mediante script batch; el resultado mejora parte del vocabulario, pero todavía admite una segunda pasada por familias terminológicas para pulir traducciones compuestas.
- `TASK-0241` y `TASK-0242` ampliaron esa curación en fases 2 y 3: la capa persistida `titulo_es` ya tiene `4410` filas distintas de `titulo` y mejoró notablemente en subestructura, cerramientos, cielos rasos, mantenimiento, obras exteriores y aberturas.
- Los residuos mixtos de OmniClass ES ya no están concentrados en obra general, sino sobre todo en familias de seguridad electrónica, automatización, HVAC industrial y algunos productos muy específicos; futuras pasadas deben hacerse por familia y no por reemplazo masivo ciego.
- `TASK-0243` abrió una pasada específica para materiales y recubrimientos de alta visibilidad operativa. El subgrupo de cementos que seguía visible en inglés en la tabla `23-13 13 11 11` ya quedó traducido en `titulo_es`.
- `TASK-0244` abrió una pasada específica para tuberías y accesorios. Las familias `Pipe Fittings`, `Pipe Flanges`, `Pipe Adapters`, `Pipe Couplings`, `Pipe Elbows`, `Pipe Caps` y `Pipe Heat Tape` ya quedaron persistidas en castellano dentro de `titulo_es`.
- `TASK-0245` abrió una pasada específica para tratamiento de líquidos y aire. Las familias `Liquid Treatment`, `Liquid Filters`, `Liquid Deaerators`, `Liquid Strainers`, `Gas Treatment`, `Air Scrubbers`, `Air Filters` y `Air Treatment Components` ya quedaron persistidas en castellano dentro de `titulo_es`.
- `TASK-0246` abrió una pasada específica para seguridad electrónica y automatización asociada. Los bloques principales de `Access Control`, `Intrusion Detection`, `Video Surveillance`, `Fire Detection and Alarm`, `Gas Detection and Alarm`, `Electronic Monitoring and Control` y automatización integrada ya quedaron persistidos en castellano dentro de `titulo_es`.
- `TASK-0247` abrió una pasada específica para HVAC residual. Los bloques base de HVAC, mantenimiento, piping, ductos, plénums, salidas/entradas de aire, fan coils, unidades split y difusores de ventilación ya quedaron persistidos en castellano dentro de `titulo_es`.
- `TASK-0248` ejecutó una limpieza residual sobre compuestos mixtos aún visibles en paneles, dispositivos, automatización integrada, comunicaciones distribuidas y términos transversales. El residuo OmniClass ES sigue existiendo, pero ya está desplazado hacia casos mucho más de nicho.
- `TASK-0249` remató otra capa residual sobre accesos, marcos, gabinetes, herrajes, operadores automáticos, glazing especial y louvers/vents. Los casos más visibles de esa familia ya quedaron persistidos en castellano dentro de `titulo_es`.
- `TASK-0250` ejecutó otro lote residual sobre protección, obras temporales, evaluaciones técnicas, residuos/limpieza e instalaciones de soporte. Los casos más visibles de esa familia ya quedaron persistidos en castellano dentro de `titulo_es`.
- `TASK-0251` ejecutó otro lote residual sobre acabados arquitectónicos, accesorios de cubierta, drenaje, evaluaciones existentes y soporte constructivo. Los casos más visibles de esa familia ya quedaron persistidos en castellano dentro de `titulo_es`.
- La regla operativa vigente en proyectos queda fijada y saneada: cada binomio `proyecto/revisión` debe tener exactamente `1` presupuesto operativo; cualquier flujo nuevo debe resolverlo de forma directa y no reintroducir listados intermedios por revisión.
- `APUService` ya valida que la subcategoría seleccionada pertenezca a la misma base del APU; nuevas evoluciones de catálogo no deben reintroducir combinaciones cruzadas `APU -> subcategoría`.
- Existe ahora el saneador técnico `backend/scripts/sanitize_apu_cross_integrity.py` para revisar y corregir contaminación de `apu_lineas` con recursos o APUs hijos fuera de contexto.
- Ese control ya quedó promovido al toolkit oficial: `backend/scripts/audit_data_integrity.py` y `backend/scripts/sanitize_data_integrity.py` cubren también cruces `APU/subcategoría`, `APU/recurso` y `APU/APU hijo`.
- En `Santiago Bermeo` se descartó orfandad APU clásica; el problema adicional encontrado fue degradación del catálogo de la base de proyecto `34` respecto a la base `32`.
- `backend/scripts/repair_santiago_apu_catalog.py` restauró los APUs faltantes y las composiciones vacías claramente recuperables sin sobreescribir los `4` códigos aún divergentes en descripción.
- La regla de contexto técnico queda explicitada también en frontend: `revision` solo existe para `Bases de Proyecto`; `Bases Maestras` no deben enviarla al API ni mostrar badge `REV`.
- Se corrigió el APU `Material filtrante para drenes, suministro y colocación` en `Santiago Bermeo`: ya no vive en `5-001`, sino en `5-003`, tanto en base maestra como en base de proyecto.
- `APUService` ahora valida también la coherencia entre el prefijo del código APU y el código de la subcategoría seleccionada al crear registros nuevos.
- Se ejecutó además saneamiento conservador sobre `4` códigos divergentes en `Santiago Bermeo`, alineando la base de proyecto `34` con la base maestra `32` solo en APUs sin líneas ni referencias activas.
- En `Administradores Generales` se renumeraron `3` APUs legacy de la base maestra `1` para eliminar colisiones de `mismo código / distinta descripción` con los APUs mock del proyecto de prueba, preservando los mismos `apu_id`.
- El frontend operativo ya no debe usar `window.confirm` ni `window.prompt`; `TASK-0064` sustituyó las confirmaciones pendientes por la capa visual común y dejó la regla fijada en `STYLE_GUIDE.md`.
- `window.alert` queda interceptado por la capa de diálogo del producto, pero los nuevos desarrollos deben preferir explícitamente `appAlert`/`appConfirm` y no introducir llamadas nativas ad-hoc.
- `TASK-0065` cerró también la migración explícita de avisos: ya no quedan `alert(...)` en `frontend/src` fuera de la propia infraestructura de diálogo (`AppDialogProvider` / `appDialog`).
- `Indirectos` ya no usa popup del navegador para crear cuentas personalizadas; ahora emplea un compositor inline integrado en el propio modal, con validación de requerido y duplicado por categoría activa.
- `TASK-0066` ya unificó visualmente los modales legacy más visibles del sistema bajo `frontend/src/components/ui/app-modal.jsx`; nuevos modales del producto deben reutilizar esta shell y no crear overlays/paneles ad-hoc salvo justificación clara.
- El `STYLE_GUIDE` ya fija tambien la regla de compositores inline para altas ligeras dentro de modales; no se deben abrir popups nativos ni segundos modales ajenos al lenguaje visual del sistema para capturas breves.
- `TASK-0067` amplió además el `STYLE_GUIDE` con la norma de densidad y ritmo interno de modales: padding uniforme, gaps consistentes, formularios compactos, tablas densas con scroll interno y footers visualmente integrados.
- `Datos del Proyecto` ya permite georreferenciación asistida por dirección: el formulario puede localizar una dirección completa y recentrar automáticamente el mapa antes del ajuste manual fino.
- La georreferenciación manual no desaparece; el flujo vigente pasa a ser `localizar por dirección -> afinar punto en mapa`.
- La georreferenciación asistida ya no depende de una sola búsqueda exacta: `TASK-0071` añadió una cascada descendente por precisión hasta llegar, si hace falta, a referencia territorial por cantón o provincia.
- El disparador de geolocalización ya no vive en una fila aparte; ahora está integrado junto al campo `Dirección Exacta` con icono y `hint` descriptivo.
- `TASK-0072` añadió persistencia de `map_zoom` en `ProyectoDetalle`; el mapa de `DatosProyecto` ya no debe volver a vista general cuando el usuario recoloca el marcador manualmente.
- El zoom del mapa pasa a ser un dato global del proyecto, igual que `latitud` y `longitud`, y se reabre en el nivel usado por el usuario.
- El pie del login ya muestra la autoría del sistema: `Ing. Benito Segura` e `Ing. Santiago Bermeo`.
- `Administración Global` ya tiene shell activa y el submódulo `Comunicados` evolucionado operativamente.
- `Comunicados` permite a `Superadministrador` crear avisos `info`, `warning` y `critical`, con alcance global o multiempresa, publicación programada por fecha/hora y permanencia configurable.
- `AdminGlobalComunicados` ya filtra por estado (`Todos`, `Vigentes`, `Próximos`, `Caducados`), tipo, empresa destinataria, texto y rangos de fecha/hora.
- `AppLayout` ya no muestra varios comunicados a la vez: los presenta en serie tras cada login, una sola vez por sesión visual; los temporales avanzan solos y los indefinidos requieren cierre manual.
- `TASK-0084` ya fijó la clasificación de funciones de `Settings`: `Gestión de Empresas` queda como capacidad exclusiva de `Superadministrador`; `Usuarios`, `Configuración de Proyecto` y `Plantillas` se mantienen híbridas; `Preferencias` queda como función de empresa para `administrador`.
- La navegación de `Settings` ya no ofrece `Gestión de Empresas`; esa entrada sale desde `Administración Global`, aunque por ahora la vista siga reutilizando el flujo existente con `Settings?tab=empresas`.
- `TASK-0085` ya preparó el submódulo `Gobernanza` dentro de `Administración Global`.
- `Gobernanza` muestra resúmenes y accesos controlados para `Empresas`, `Usuarios globales` y `Políticas`, sin mover todavía acciones híbridas destructivas fuera de `Settings`.
- `TASK-0086` ya implementó el submódulo `Auditoría` dentro de `Administración Global`.
- La auditoría actual es operativa y honesta: consolida logs existentes (`auth_debug.log`, `fatal_errors.log`), métricas administrativas y backlog explícito de eventos aún no estructurados.
- `TASK-0087` ya implementó el submódulo `Herramientas` dentro de `Administración Global`.
- `Herramientas` no ejecuta scripts: clasifica saneamiento, diagnóstico, mantenimiento técnico y soporte interno, con nivel de riesgo explícito y sin abrir acciones destructivas desde la UI.
- `TASK-0081` queda cerrada: `Administración Global` ya opera como módulo exclusivo de `Superadministrador` con shell, `Comunicados`, `Gobernanza`, `Auditoría` y `Herramientas`.
- Se abrió un nuevo bloque de evolución de `Superadministrador` bajo `TASK-0088`, orientado a operación real de plataforma.
- Las subtareas previstas del siguiente paquete son:
  - `TASK-0089`: Estado del sistema
  - `TASK-0090`: Sesiones activas y revocación
  - `TASK-0091`: Modo mantenimiento
  - `TASK-0092`: Licencias y cuotas
  - `TASK-0093`: Auditoría estructurada
  - `TASK-0094`: Consola de empresa auditada / soporte operativo
- `TASK-0088` queda como nueva task madre de coordinación; no debe ejecutarse como bloque único.
- El orden recomendado del siguiente paquete es: `Estado del sistema`, `Sesiones`, `Modo mantenimiento`, `Licencias`, `Auditoría estructurada` y `Consola de empresa auditada`.
- `TASK-0089` ya quedó resuelta: `Administración Global` ya dispone del submódulo `Estado del sistema`.
- `Estado del sistema` ofrece lectura real y no mock de backend, base de datos, migraciones, sesiones activas, empresas activas, comunicados activos y señales básicas de logs.
- `TASK-0090` ya quedó resuelta: `Administración Global` ya dispone del submódulo `Sesiones activas`.
- La plataforma ya guarda metadatos de sesión (`current_session_started_at`, `current_session_device_id`) y dispone de `POST /login/logout` para invalidación limpia al cerrar sesión.
- `Superadministrador` ya puede listar sesiones activas por usuario y empresa, ver el último dispositivo conocido y revocar una sesión concreta.
- La revocación invalida la sesión única guardada en backend y deja trazabilidad en `auth_debug.log`.
- `TASK-0091` ya quedó resuelta: `Administración Global` ya dispone del submódulo `Modo mantenimiento`.
- El mantenimiento ya tiene persistencia propia y dos modos reales:
  - `readonly`
  - `restricted`
- `readonly` bloquea operaciones mutantes para usuarios no superadministradores.
- `restricted` bloquea el uso operativo general no exento para usuarios no superadministradores, manteniendo acceso de recuperación para `Superadministrador`.
- `AppLayout` ya muestra banner de mantenimiento activo y overlay de bloqueo cuando el modo es `restricted`.
- `TASK-0092` ya quedó resuelta: `Administración Global` ya dispone del submódulo `Licencias y cuotas`.
- La plataforma ya expone `GET /api/v1/admin-licenses/summary` para consolidar límites, consumo y estado de ocupación por empresa.
- La vista de `Licencias` ya permite lectura consolidada y edición rápida de cuotas por empresa para `Superadministrador`.
- `TASK-0110` endureció además la política de cuotas, añadió vigencia de licencia por empresa y adaptó alertas/estados del módulo a castellano.
- `TASK-0111` quedó resuelta: el rol legacy `supervisor` ya no forma parte del contrato funcional del sistema.
- `Licencias y cuotas` ahora opera solo con `administradores` y `usuarios`.
- `dispositivos` ya no acepta `supervisor`; el permiso operativo intermedio queda unificado en `administrador`.
- `TASK-0112` refinó `Licencias y cuotas` sin tocar el contrato backend: ya existe buscador por nombre de empresa, filtro de estado (`Todos`, `Vigentes`, `Vencidas`, `Pendientes`) y propuesta automática de `Fecha Fin = Fecha Inicio + 360 días`.
- El guardado del editor de licencias usa ahora doble confirmación dentro del modal.
- La persistencia backend de fechas quedó comprobada con edición real y restauración inmediata; si una fecha no se veía reflejada antes, el problema venía del flujo de edición, no de la API.
- `TASK-0113` añadió aviso preventivo de vencimiento de licencia en login: si faltan 7 días o menos para la fecha fin, el sistema autentica normalmente pero muestra una advertencia con la fecha exacta de caducidad.
- El aviso se emite en cada login exitoso dentro de esa ventana, sin sustituir el bloqueo actual cuando la licencia ya está vencida o todavía no está vigente.
- `TASK-0114` refinó `Sesiones activas` con filtrado operativo en frontend: búsqueda textual por usuario/correo, selector por empresa y selector por usuario sobre las sesiones cargadas.
- `TASK-0115` añadió feedback visible al usuario cuando una sesión es revocada por administración: al siguiente `401`, el login muestra el mensaje `Un administrador le ha cerrado la sesión. Vuelva a iniciarla.`
- La plataforma sigue distinguiendo ese caso de la invalidación por sesión única en otro dispositivo.
- `TASK-0116` amplió `Comunicados` con duración configurable, targeting multiempresa, filtros operativos y cola secuencial post-login ligada a `sessionStorage`.
- `TASK-0117` aplicó además el patrón obligatorio de corrector ortográfico asistido al campo `Mensaje` de `Comunicados`, reutilizando `utils/spellcheck` y confirmación explícita antes de aplicar cambios.
- `TASK-0118` corrigió el falso negativo más grave del servicio `utils/spellcheck`: ya no debe informar “sin errores” ante textos con faltas reales; cuando no existe sugerencia automática fiable, `Comunicados` pide revisión manual en vez de afirmar que el texto está correcto.
- `TASK-0093` ya quedó resuelta: `Administración Global` ya dispone de auditoría estructurada por evento.
- La plataforma ya persiste eventos críticos en `system_audit_events`.
- La auditoría estructurada ya cubre autenticación, empresas, mantenimiento, comunicados y revocación de sesiones.
- `AdminGlobalAuditoria` ya consulta eventos estructurados con filtros y mantiene los logs legacy solo como apoyo de diagnóstico.
- El siguiente paso recomendado del paquete de plataforma es `TASK-0094`: `Consola de empresa auditada / soporte operativo`.
- `Precios Unitarios` ya soporta borrado masivo atómico en `Subcategorías`, `Recursos` y `APUs`, con confirmación modal en dos pasos conforme al libro de estilo.
- Las reglas de borrado masivo reutilizan las restricciones actuales del borrado unitario; si un elemento falla validación, no se borra ninguno de la selección.
- `Precios Unitarios` ya soporta además selección masiva sobre elementos visibles y limpieza rápida de selección en `Subcategorías`, `Recursos` y `APUs`.
- La selección maestra opera sobre el subconjunto visible según búsqueda y contexto activo, no sobre todo el módulo.
- La importación por copy/paste en `Subcategorías`, `Recursos` y `APUs` ya fue endurecida para manejar mejor datos pegados desde Excel con columnas auxiliares o numeración al inicio.
- `Recursos` ya tiene expuesto de nuevo el endpoint backend `POST /api/v1/recursos/import`, alineado con el cliente frontend existente.
- Los modales de importación de `Subcategorías`, `Recursos` y `APUs` ya muestran un previo interpretado antes de confirmar la operación.
- Las filas inválidas se muestran como `Omitida` en el previo y no habilitan confirmación si no existe al menos una fila válida.
- Los previews de importación ya muestran motivo de omisión y detectan duplicados antes de confirmar.
- `APUs` ya no acepta importación con solo descripción: ahora exige `descripción + unidad` y la unidad debe existir en el catálogo válido del sistema.
- Los previews de importación ya tienen resumen técnico superior, badges compactos de estado y mejor legibilidad visual.
- En `APUs`, el preview expone además las unidades válidas cargadas, para reducir errores de captura antes de confirmar.
- La exclusión de `APU` en el modal de importación de `Subcategorías` introducida en `TASK-0044` fue revertida; el selector volvió a mostrar todas las categorías.
- Al cambiar de empresa como `Superadministrador`, el contexto ahora invalida `base de trabajo` y `proyecto activo` para evitar contaminación entre empresas.
- `APUs` ya recarga también al cambiar de empresa y dejó de depender de `codigo.startsWith('5-')` para detectar subcategorías APU; ahora usa `subcategoria_codigo == 5` y revalida la subcategoría seleccionada.
- El sistema de proyectos ya tiene indirectos operativos por presupuesto/revisión persistidos en backend; el modal `Indirectos` ya no depende de `localStorage`.
- Los 11 conceptos `fijo = 1` del catálogo legacy se siembran automáticamente como base obligatoria de cada presupuesto/revisión.
- La política vigente del sistema de proyectos es: `subtotal directo + indirectos de presupuesto/revisión + IVA`; `BaseTrabajo.porcentaje_indirectos` queda solo como referencia y ya no gobierna el cálculo del presupuesto.
- El presupuesto ahora toma `costo_directo` del APU como precio base de línea; el indirecto de proyecto se aplica a nivel presupuesto y no desde `APUs`.
- El editor de presupuestos ya muestra semáforo visual de indirectos: `0% = rojo`, `>0% y <10% = ámbar`, `>=10% = verde`, aplicado al botón `Indirectos`, al pie y al modal.
- `presupuesto_estimado` y la fecha global de presentación siguen siendo datos de proyecto, no de revisión; ya se editan desde `Proyectos` y `Presupuestos` sin duplicarlos por cada revisión.
- La actualización de `presupuesto_estimado` se sincroniza ahora a todas las revisiones del mismo `codigo_root`, evitando divergencias entre proyecto raíz y revisiones.
- El listado inicial de proyectos ya no trata `Indirectos` ni `Presupuesto` como datos globales; solo los muestra como apoyo compacto cuando el proyecto tiene una única revisión.
- La vista `Presupuestos` ya separa un bloque global del proyecto (`Presupuesto estimado`, `Fecha global de presentación`) del listado de revisiones, donde viven `Indirectos` y `Presupuesto` reales.
- Los buscadores y filtros textuales ya tienen una regla transversal de saneado visual: el estado vacío visible debe ser siempre `''`; `null` y `undefined` no deben renderizarse en inputs.
- `frontend/src/utils/normalizeInputValue.js` centraliza esta normalización y ya está aplicado en buscadores operativos de `Subcategorías`, `Recursos`, `Stakeholders`, `Catálogo APU`, `Pareto`, `Indirectos` y `SearchableSelect`.
- El modal `Indirectos` ya consulta con `empresa_id` de contexto y dejó de arrancar en una categoría sin fijos; ahora abre mostrando una categoría con conceptos base ya sembrados a `0.00%`.
- La lectura operativa vigente es: los conceptos fijos deben aparecer precargados en el listado de indirectos aunque su porcentaje inicial sea `0.00`; todos los indirectos del modal se tratan siempre como porcentaje.
- La norma vigente de indirectos queda fijada así: el listado es global por presupuesto operativo y se resuelve por `empresa + proyecto/revisión + presupuesto`; las categorías solo organizan y agrupan las cuentas.
- El backend ya bloquea la creación de más de un presupuesto operativo para el mismo `proyecto/revisión`, alineando el flujo de revisiones con la regla anterior.
- La UI de `Presupuestos` ya no sugiere múltiples presupuestos paralelos para una misma revisión; las nuevas revisiones deben seguir naciendo desde el flujo de `Proyecto/Revisión`, no desde presupuestos duplicados.
- El programa maestro `TASK-0055` quedó cerrado: el saneamiento multiempresa de `Proyectos`, `Presupuestos` y `Precios Unitarios` ya cubre frontend, backend, modelo de datos y QA transversal.
- Las subtareas completadas del cierre multiempresa son `TASK-0056` (frontend tenant-aware), `TASK-0057` (Proyectos), `TASK-0058` (Presupuestos/editor), `TASK-0059` (Precios Unitarios), `TASK-0060` (`ProyectoDetalle` con `empresa_id`) y `TASK-0061` (QA anti-contaminacion).
- La regla operativa que debe cumplirse a partir de ahora es: ningun flujo de negocio para `Superadministrador` puede ejecutarse sin `empresa` activa ni resolver datos fuera de ese tenant.
- `TASK-0056` ya dejó implantada la base frontend tenant-aware: `axiosConfig` inyecta `empresa_id` automáticamente en requests operativas y los endpoints globales deben marcarse con bypass explícito.
- `AppLayout` ya bloquea pantallas operativas para `Superadministrador` sin empresa activa, evitando aperturas ambiguas mientras se termina el saneamiento por módulos.
- `TASK-0058` ya reencaminó el editor de presupuestos y la vista `Presupuestos` a clientes tenant-aware; la franja crítica dejó de depender de `api` directo para notas, líneas, `EDT`, catálogo APU y tanteos.
- Al cambiar de empresa o fallar una recarga del presupuesto bajo otro tenant, el editor limpia el contexto activo y evita seguir mostrando datos viejos.
- `TASK-0059` ya cerró `Precios Unitarios` sobre la capa tenant-aware, especialmente `APUs`, que dejó de construir requests manuales con `empresa_id` en query string.
- En `Precios Unitarios`, la excepción global aceptada sigue siendo `/paises/`, marcada explícitamente como endpoint sin tenant.
- `TASK-0057` ya endureció el frontend de `Proyectos`: listados, revisiones, `Stakeholders`, `EDT`, `EDO` y `DatosProyecto` usan la empresa activa del contexto.
- `TASK-0060` ya cerró el aislamiento estructural de `ProyectoDetalle`: el backend lo resuelve por `empresa_id + codigo_root`, valida pertenencia del proyecto dentro del tenant objetivo y dejó respaldada la estructura en Alembic con la revisión `f4c6d9b8a1e2`.
- El residuo legacy tolerado en `proyecto_detalles` tras `TASK-0060` ya fue eliminado en `TASK-0062`; la tabla quedó sin filas con `empresa_id IS NULL`.
- `TASK-0063` dejó rutinas reproducibles de auditoría y saneamiento de datos en `backend/scripts/`, alineadas con las reglas nuevas de multiempresa, presupuesto único por revisión e indirectos operativos.
- La auditoría local de `TASK-0063` validó `14` reglas y no encontró incidencias activas; el saneamiento quedó en modo conservador y solo reaseguró indirectos obligatorios sobre el presupuesto existente.
- `TASK-0061` ya validó la no interferencia multiempresa con `23` comprobaciones y `0` fallos entre las empresas `1` y `3`, cubriendo `Bases`, `Proyectos`, `ProyectoDetalle`, `Presupuestos`, `Indirectos`, `Pareto`, `Notas`, `Subcategorías`, `Recursos` y `APUs`.
- Durante esa matriz se corrigió una regresión residual en `read_presupuesto_indirectos`, que rompía por una referencia inválida a `presupuesto_in`.
- Conviene revisar otras acciones importantes del editor de presupuestos para asegurar que las operaciones globales esten en la franja superior y no enterradas en paneles secundarios.
- Conviene seguir refinando densidad y jerarquia visual del editor de presupuestos, especialmente en toolbar y header, ahora que las acciones principales ya se estan consolidando.
- El libro de estilo ya documenta el patron de botones compactos de herramientas con y sin label; conviene reutilizarlo en futuras secciones antes de crear variantes nuevas.
- El editor de presupuestos ya tiene exclusion bidireccional entre catalogo APU y tanteo en viewports compactos; cualquier ajuste futuro debe respetar la excepcion del estado fijado (`Fix`).
- El sistema de notas de presupuesto ya es funcional para ambito general y de linea, con indicadores de novedades por usuario basados en la ultima apertura del presupuesto.
- La opcion `Indirectos` ya no es placeholder: existe un selector tecnico por presupuesto/revision conectado al backend y apoyado en el catalogo local legacy.
- La opcion `Pareto` del editor ya no es placeholder: soporta vista `Global` por lineas y vista `Capítulos` con drilldown interno a lineas del capitulo.
- En el drilldown de capitulo, los porcentajes se recalculan contra el total del capitulo seleccionado, no contra el total global.
- El modal Pareto ya permite doble clic para navegar al editor sobre lineas; si el destino es una linea, queda seleccionada para tanteo.
- El modal Pareto fue refinado visualmente para quedar mas compacto, tecnico y alineado con el resto del editor de presupuestos.
- La antigua opción `EDT Valorada` ya no debe reaparecer en `Presupuesto`; la lectura valorada quedó consolidada directamente en `EDT`.
- `TASK-0073` rehizo el pie del presupuesto como banda homogénea de métricas: ahora todos los indicadores comparten formato técnico compacto.
- El pie ya muestra carga de APUs (`total` y `diferentes`) y compara `Total Presupuesto` contra `Objetivo Proyecto`, con estado visual distinto si el presupuesto queda por debajo, igualado o por encima.
- `TASK-0074` corrigió una regresión en la importación masiva desde Excel: las heurísticas de "etiqueta de fila" ya no reinterpretan palabras cortas válidas como si fueran códigos, especialmente en `Recursos`.
- El parser de `Recursos` vuelve a priorizar el tabulado real de Excel para mapear correctamente `descripción`, `precio`, `unidad` y `CPC`; la misma heurística endurecida quedó alineada en `Subcategorías` y `APUs`.
- `TASK-0075` añadió un segundo nivel de robustez a las importaciones de `Precios Unitarios`: si el pegado llega sin `TAB` limpio, el sistema intenta reconstruir columnas desde el final de la fila.
- En `Recursos`, el fallback reconstruye `precio`, `unidad` y `CPC`; en `APUs`, intenta casar la unidad desde el catálogo real; en `Subcategorías`, tolera mejor filas simples y observaciones compactadas.
- `TASK-0076` cerró una regla funcional pendiente: las subcategorías de la categoría principal `APU` no aceptan recursos creados, importados, movidos ni duplicados manualmente.
- Aunque la UI de `Recursos` ya mostraba solo categorías `1..4`, ahora el backend también bloquea cualquier llamada indirecta o estado legado que intente introducir recursos bajo `subcategoria_codigo = 5`.
- `TASK-0077` afinó el parser de `Subcategorías`: si el pegado viene como una sola columna, la línea completa se conserva como descripción y no se trocea por guiones o paréntesis.
- La separación `descripción + observaciones` en `Subcategorías` debe hacerse solo cuando existen columnas reales por `TAB`; cualquier inferencia semántica adicional quedó descartada para evitar previos engañosos y falsos duplicados.
- `TASK-0078` unificó la banda visual de "formato esperado" en los tres importadores de `Precios Unitarios`.
- La ayuda de `Subcategorías`, `Recursos` y `APUs` ya usa un mismo componente visual y el copy se mantiene sincronizado con la lógica real de cada parser.
- `TASK-0079` sustituyó el favicon público de la aplicación por el archivo `assets/favico.png`, manteniendo la ruta servida `/favicon.png`.
- `TASK-0080` ajustó la respuesta responsive de los modales de importación de `Precios Unitarios`: el footer de acciones ya no debe quedar fuera de pantalla en viewport `1920x1080`.
- El cierre y reapertura de importadores ya limpia el texto pegado en `Subcategorías`, `Recursos` y `APUs`, también al cerrar con `X` o `Escape`.
- Se abrió el programa modular `TASK-0081` a `TASK-0087` para el nuevo módulo `Administración Global`, exclusivo de `Superadministrador`.
- La secuencia prevista es:
  - `TASK-0082`: shell del módulo y navegación
  - `TASK-0083`: comunicados
  - `TASK-0084`: migración de funciones superadmin desde `Settings`
  - `TASK-0085`: gobernanza
  - `TASK-0086`: auditoría
  - `TASK-0087`: herramientas técnicas
- `TASK-0081` queda como task madre de seguimiento y no debe ejecutarse como implementación monolítica.
- El programa de `Administración Global` debe respetar expresamente las funciones híbridas entre `Administrador` y `Superadministrador`; la reorganización visual no puede redefinir por sí sola los permisos reales del sistema.
- `TASK-0082` ya quedó resuelta: existe la shell inicial de `Administración Global`, accesible solo para `Superadministrador`, sin mover aún funciones híbridas desde `Settings`.
- El siguiente slice natural es `TASK-0083` para `Comunicados`, ya apoyado sobre la nueva ruta `/admin-global`.
- El libro de estilo ya documenta el patron de corrector ortografico asistido; al extender notas y campos largos debe reutilizarse `utils/spellcheck` en lugar de introducir soluciones paralelas.
- El modal de notas ya integra corrector ortografico asistido y `spellCheck` nativo; cualquier nuevo campo largo de texto en presupuestos debe seguir exactamente ese patron.
- El copy del corrector ortografico en notas ya fue afinado; mantener este tono tecnico en futuras confirmaciones y mensajes de ayuda relacionados con texto libre.
- Las notas de QA sembradas anteriormente sobre el presupuesto `2` fueron eliminadas; si se necesita volver a probar semaforos, resembrar datos de forma controlada sobre `Administradores Generales > Proyecto de prueba 001`.
- El presupuesto huerfano del proyecto `Administradores Generales > Proyecto de prueba 001` ya fue eliminado; el proyecto conserva solo el presupuesto operativo `2`.
- Las notas de QA resembradas sobre el presupuesto `2` ya fueron eliminadas nuevamente, junto con el estado de vistas del usuario de pruebas asociado.
- Los semaforos de notas ya se apagan por ambito al abrir su vista correspondiente, pero este ajuste requiere backend reiniciado para entrar en vigor si el servidor en `3000` sigue con codigo previo.
- El subsistema de notas de presupuesto ya cuenta con migracion Alembic propia (`dcc7c6a3f3f1`) y dejo de depender de creacion de tablas/columnas en runtime.
- `TASK-0088` queda ya cerrada como task madre del segundo paquete de `Administración Global`.
- `TASK-0089` implementó `Estado del sistema` con lectura real de backend, base de datos, migraciones, sesiones, comunicados y logs.
- `TASK-0090` implementó `Sesiones activas y revocación`, incluyendo persistencia de metadatos de sesión y revocación administrativa.
- `TASK-0091` implementó `Modo mantenimiento` con persistencia propia y bloqueo real `readonly/restricted`.
- `TASK-0092` implementó `Licencias y cuotas` con resumen consolidado y edición rápida de límites por empresa.
- `TASK-0093` implementó auditoría estructurada por evento sobre `system_audit_events`, con filtros y cobertura real para autenticación, empresas, mantenimiento, comunicados y revocación de sesiones.
- `TASK-0094` implementó la `Consola de empresa auditada`, separando claramente la empresa operativa actual de la empresa auditada y dejando trazabilidad explícita de su apertura.
- `Administración Global` queda ya operativa como módulo real de plataforma para `Superadministrador`, con submódulos:
  - estado
  - sesiones
  - mantenimiento
  - licencias
  - comunicados
  - gobernanza
  - auditoría
  - herramientas
  - empresa auditada

Próximo paso recomendado
Continuar el paquete `Comunidad` con búsqueda rica, respuestas visibles por post, bloqueos entre usuarios y la siguiente capa de UX/moderación fina.

- `TASK-0324` ya no es solo scaffold: `Comunidad` tiene módulo base operativo con posts públicos, posts internos por empresa, respuestas, hilos DM `1 a 1` y tablas de sanciones.
- `TASK-0325` dejó datos de prueba reproducibles en la base local mediante `backend/scripts/seed_community_demo.py`; el entorno ya cuenta con `3` posts públicos, `2` internos, `3` respuestas, `3` hilos DM, `6` mensajes y `2` sanciones de prueba.
- `TASK-0326` activó moderación y sanciones base en backend:
  - moderación de publicaciones
  - sanciones por ámbito
  - aplicación real de restricciones sobre publicación, respuesta y DM
- `TASK-0327` dejó la mensajería directa usable en frontend:
  - selección de usuarios del contexto activo
  - apertura/lectura de hilos
  - envío de mensajes
- Queda fijada además la política de adjuntos de `Comunidad` antes de implementar esa capa:
  - `Público`: solo imágenes, sin archivos ni links
  - `Interno`: archivos permitidos con expiración automática a `30 días`
- El paquete `Comunidad` sigue abierto: faltan búsqueda rica, respuestas visibles dentro del feed, bloqueos usuario-a-usuario, apelaciones y pulido final de UX.

- `TASK-0181` queda cerrada: la auditoría oficial de integridad ya cubre `apu_lineas` huérfanas y la base local validada el 2026-03-20 no presentó incidencias activas para ese caso (`0` filas afectadas).
- El saneamiento quedó integrado en `backend/scripts/sanitize_data_integrity.py`; no se dependió del script suelto con credenciales embebidas para cerrar la TASK.
- Se abrió `TASK-0184` para abordar de forma separada el saneamiento ampliado detectado por la auditoría (`presupuestos` duplicados, cruces multiempresa e indirectos desalineados), ya que excede el alcance de `TASK-0181`.
- `TASK-0185` corrigió un bug del editor APU: con `Rendimiento Global` activo, las nuevas líneas de `Equipos y Herramientas` y `Mano de Obra` ya heredan el rendimiento global vigente del APU en lugar de crearse con `1`.
- `TASK-0186` restauró a `Administradores Generales` los proyectos de prueba que habían quedado desalineados en empresa `2`; `Proyectos` vuelve a mostrar `2` raíces y `Proyecto de prueba 001` vuelve a exponer `2` revisiones bajo empresa `1`.
- Tras esta restauración, la auditoría oficial ya no reporta cruces multiempresa en `indirectos`, `subcategorías`, `recursos` ni `APUs`; permanecen abiertas solo las duplicidades de presupuestos por revisión y un presupuesto sin indirectos fijos.
- `TASK-0187` endureció el editor APU: si `Rendimiento Global` está activo y aún no existen líneas elegibles, la UI exige definir un `Rendimiento Base Global` antes de permitir la carga de `Equipos y Herramientas` o `Mano de Obra`.

- `TASK-0095` refinó la jerarquía visual del editor de presupuestos: las acciones globales principales ya viven también en la franja superior y no quedan enterradas solo en la botonera lateral.
- El sidebar del presupuesto conserva los accesos iconográficos como atajos secundarios; cualquier ajuste futuro debe mantener esa doble capa (`header operativo` + `shortcut rail`) y no volver a esconder acciones críticas.
- `TASK-0096` añadió bandas de contexto operativo dentro de `Líneas` y `Catálogo APU`; futuros ajustes del editor deben respetar este patrón de lectura rápida (`contexto superior` -> `atajos laterales` -> `detalle operativo`).
- `TASK-0097` añadió contexto compartido del nodo EDT seleccionado en `PresupuestoContext`; los paneles auxiliares del editor ya deben consumir `selectedNodeMeta` y no volver a renderizar ids crudos del capítulo activo.
- `TASK-0098` ya propagó `selectedNodeMeta` a la cabecera del editor y al panel de tanteo; cualquier nueva herramienta del presupuesto debe reutilizar ese contexto para mantener lectura operativa consistente.
- `TASK-0099` alineó la vista de revisiones con la lógica económica del editor: las tarjetas de `Presupuestos` ya comparan cada revisión contra el objetivo global del proyecto y exponen semántica `debajo / igualado / sobre`.
- `TASK-0100` eliminó `HerramientasTab` como deuda legacy del módulo; cualquier nueva acción global del presupuesto debe entrar ya en la cabecera operativa o en un modal dedicado, no en paneles paralelos heredados.
- `TASK-0101` añadió búsqueda y filtros en la vista de revisiones de `Presupuestos`; futuros crecimientos del listado deben reutilizar esta barra operativa y no volver a dispersar filtros o contadores.
- `TASK-0102` completó la barra operativa de revisiones con ordenación por revisión, modificación, total y estado económico; cualquier ampliación futura del listado debe entrar en esta misma superficie de control.
- `TASK-0103` corrigió un error de hooks en `LineasPresupuestoTab`; al tocar el editor de presupuestos, mantener todos los hooks por encima de retornos tempranos (`loading`, estados vacíos) para no reintroducir `Rendered more hooks than during the previous render`.
- `TASK-0104` revirtió el sobrepeso visual reciente del editor de presupuestos sin retirar funcionalidad operativa.
- La pauta vigente del editor vuelve a ser `espacio útil primero`: evitar tarjetas y bandas contextuales redundantes cuando la misma información ya está disponible en otra superficie del módulo.
- `TASK-0105` consolidó `AIU`, `Pareto`, `EDT Valorada` y `Notas` en una sola superficie operativa: la botonera lateral.
- La cabecera superior del editor ya no debe duplicar acciones presentes en el rail lateral salvo justificación funcional clara.
- `TASK-0106` corrigió una regresión de `PresupuestoDetail`: el estado visual de `AIU` del rail lateral sigue dependiendo de `indirectosStatus`, aunque esa acción ya no esté duplicada en la cabecera.
- `TASK-0107` retiró `Simular Tanteo` de la cabecera del editor porque su apertura ya es automática al seleccionar línea.
- `Borrar Tanteos` sigue siendo una acción global sobre toda la revisión, pero ahora vive como acción compacta de cabecera y solo aparece cuando el presupuesto tiene tanteos activos.
- `TASK-0108` corrigió una regresión de `PresupuestoDetail`: la cabecera compacta de `Borrar Tanteos` depende también de `tanteoSession`, por lo que cualquier futura condición visual similar debe consumir explícitamente ese estado desde `PresupuestoContext`.
- `TASK-0109` eliminó la duplicación interna de revisión, estado y códigos dentro de `PresupuestoDetail`; la fuente visual principal de esos metadatos debe seguir siendo la cabecera contenedora del flujo.
- La representación de revisiones en `Presupuestos` ya no debe asumir `1` por defecto cuando el dato real es `0`; la revisión `0` es válida y debe mostrarse tal cual.
- `TASK-0110` añadió vigencia de licencia por empresa en `Administración Global > Licencias y cuotas`.
- La regla vigente de plataforma pasa a ser estricta: ninguna cuota puede excederse por creación, edición o cambio de rol; `warning` significa cuota completa y no margen restante.
- Las empresas existentes quedaron inicializadas con vigencia `2026-03-01` a `2027-03-01`.
- La UI de licencias ya muestra vigencia y estados de cuota en castellano; los mensajes funcionales del módulo deben conservar ese idioma.
- `TASK-0119` profesionalizó el corrector ortográfico asistido: `utils/spellcheck` usa `LanguageTool` local para castellano y conserva fallback al corrector artesanal.
- El flujo de `Comunicados` no cambia, pero las sugerencias son más fiables y las autocorrecciones solo se aplican cuando la sustitución es segura.
- `TASK-0120` abrió la primera fase real de `Cronogramas` dentro de `Proyectos`.
- El módulo ya tiene tabs propios para `Cronograma Valorado` y `Cronograma de Trabajo`; el valorado consume datos reales de proyecto y presupuesto y calcula una periodización inicial en frontend.
- La siguiente fase natural es persistir configuración y distribución por línea/periodo en backend, habilitando ajuste manual después de la aplicación global.
- `TASK-0121` ya completó esa siguiente fase: existe persistencia backend `cronogramas_valorados`, API propia y consumo real desde frontend.
- El `Cronograma Valorado` ya soporta configuración global (`Homogéneo` / `Definido por usuario`), aplicación por presupuesto y ajustes manuales por línea con restauración al reparto global.
- El cambio de `tipo de periodo` limpia overrides por línea solo tras confirmación explícita.
- La siguiente fase natural de `Cronogramas` es profundizar `Cronograma de Trabajo` y, en el valorado, afinar UX gráfica y edición más rica por celda si se necesita.
- `TASK-0122` eliminó la selección redundante dentro de `Cronogramas`: el módulo ya no debe comportarse como selector de revisión o presupuesto.
- La fuente de verdad para `Cronogramas` pasa a ser la revisión activa abierta en `Proyectos`; dentro del módulo solo se informa del presupuesto operativo asociado.
- `TASK-0266` ya quedó implantada: la vista gráfica de `EDT` y `EDO` ahora soporta minimapa lateral y colapso/expansión de ramas, manteniendo la edición principal en el árbol y sin introducir una segunda superficie de edición paralela.
- `TASK-0267` ya quedó implantada: la vista gráfica de `EDT` y `EDO` ahora permite `Editar` y `Añadir hijo` sobre el nodo seleccionado, pero siempre reencaminando al árbol y reutilizando los modales existentes.
- `TASK-0268` ya quedó implantada: la vista gráfica de `EDT` y `EDO` ahora expone la `ruta activa` del nodo seleccionado y resalta su cadena jerárquica para mejorar orientación en estructuras profundas.
- `TASK-0269` ya quedó implantada: la vista gráfica de `EDT` y `EDO` ahora permite filtrar por tipo de nodo y muestra métricas ligeras (`Hijos`, `Desc.`) dentro de las tarjetas para una lectura analítica más rápida.
- `TASK-0270` deja fijada esa evolución como capa analítica ligera oficial: la vista gráfica ya sirve para lectura estructural, orientación y filtrado, pero sigue sin depender de contratos backend nuevos ni sustituir el árbol editable.
- `TASK-0271` ya quedó implantada: la vista gráfica de `EDT` y `EDO` ahora expone un resumen estructural del conjunto visible (`nodos`, `raíces`, `principales`, `responsables`) y la profundidad del nodo activo.
- `TASK-0272` ya quedó implantada: la vista gráfica de `EDT` y `EDO` ahora soporta búsqueda, ciclo entre coincidencias y foco automático, reabriendo además la ruta de nodos que estén bajo ramas colapsadas.
- `TASK-0273` ya quedó implantada: la vista gráfica de `EDT` y `EDO` ahora permite alternar entre `Vista total` y `Rama activa`, aislando el subárbol del nodo seleccionado sin romper filtros, búsqueda ni resumen estructural.
- `TASK-0274` ya quedó implantada: la vista gráfica de `EDT` y `EDO` ahora incorpora `Centrar selección` y `Restablecer vista` para recuperar contexto visual tras navegar con zoom, filtros o ramas colapsadas.
- `TASK-0275` ya quedó implantada: la vista gráfica de `EDT` y `EDO` ahora tiene minimapa colapsable con botón lateral, paneo con botón central restringido al viewport del gráfico y una compactación adicional de todas las bandas superiores para maximizar altura útil.
- `TASK-0276` ya quedó implantada: la vista gráfica de `EDT` y `EDO` ahora permite plegar `Vista navegable`, `Ruta activa` y `Filtros y raíces`, priorizando aún más el lienzo de trabajo sin perder navegación ni contexto.
- `TASK-0277` ya quedó implantada: la vista gráfica de `EDT` y `EDO` ahora persiste por sesión el estado de sus superficies plegables y permite zoom fino con `Ctrl + rueda` directamente sobre el lienzo.
- `TASK-0278` ya quedó implantada: la vista gráfica de `EDT` y `EDO` ahora mueve el minimapa a un modal flotante, endurece el paneo con botón central dentro del viewport y añade una leyenda visual plegable por tipo/estado de nodo.
- `TASK-0348` amplió la lectura operativa de moderación en `Comunidad` sin crear rutas nuevas:
  - alertas administrativas con filtro por tipo, manteniendo `No leídas / Todas`
  - infracciones con métricas rápidas (`total`, `público`, `interno`, `escaladas`)
  - búsqueda y filtro por ámbito dentro del mismo panel de control
- `TASK-0349` enlazó mejor sanciones, apelaciones e infracciones dentro de `Comunidad`:
  - apelaciones pendientes con salto directo a la sanción base
  - lista de sanciones con estado seleccionado y panel de detalle contextual
  - enlace desde sanción a infracción automática asociada cuando existe
- `TASK-0350` añadió filtros compactos para cola de moderación en `Comunidad`:
  - apelaciones con `Abiertas / Todas / Resueltas` y búsqueda inline
  - sanciones filtrables por ámbito y texto
  - apelaciones resueltas siguen visibles con su nota, sin abrir otra pantalla histórica
- `TASK-0351` añadió foco de moderación por usuario en `Comunidad`:
  - selección desde `Usuarios y estado`
  - filtrado compartido sobre infracciones, sanciones y apelaciones
  - contexto visible y reversible dentro del mismo panel administrativo
- `TASK-0352` cerró esta pasada del panel administrativo de `Comunidad`:
  - resumen consolidado de alertas, infracciones, apelaciones y sanciones visibles
  - acción única para limpiar foco y filtros compactos
  - sin abrir dashboards ni rutas nuevas fuera del mismo panel
- `TASK-0353` endureció el diagnóstico de carga parcial en `Comunidad`:
  - chips por capa fallida
  - detalle inline de la capa seleccionada
  - el feed sigue operativo aunque fallen superficies secundarias
- `TASK-0354` cerró la coherencia del foco de moderación en `Comunidad`:
  - las alertas automáticas ya respetan el usuario enfocado cuando existe `target_user`
  - infracciones, sanciones, apelaciones y alertas quedan alineadas bajo el mismo filtro
- `TASK-0355` cerró el cruce contextual restante de moderación en `Comunidad`:
  - el detalle de infracción ya puede saltar directamente a la sanción vinculada
  - el drill-down queda completo entre alertas, infracciones y sanciones dentro del mismo panel
- `TASK-0356` conectó el foco de usuario con la acción administrativa principal:
  - enfocar usuario ahora precarga el destinatario de sanción
  - la tarjeta del usuario muestra si ya arrastra sanciones activas
- `TASK-0357` conectó la revisión de infracciones con la acción manual posterior:
  - el detalle de infracción ya permite preparar una sanción sobre ese usuario
  - se reutiliza el mismo formulario administrativo, sin abrir otra superficie
- `TASK-0358` afinó ese traspaso operativo:
  - la preparación de sanción desde infracción ya carga usuario, tipo sugerido y motivo borrador contextual
  - el moderador conserva edición manual completa antes de emitir la sanción
- `TASK-0359` convirtió el foco de usuario en una ficha operativa real:
  - conteos de alertas, infracciones, apelaciones y sanciones del usuario enfocado
  - chips con sanciones activas visibles en la misma tarjeta

[2026-06-01 16:51:47]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.

[2026-06-01 16:52:36]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-01 16:52:46]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-01 16:53:15]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-01 16:54:50]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-01 18:22:34]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.

[2026-06-11 09:40:51]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-11 09:50:13]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-11 10:34:16]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-11 10:34:24]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-11 10:34:32]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-11 10:34:39]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-11 10:34:50]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-11 10:34:59]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-11 10:35:08]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-11 10:35:29]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-11 17:02:12]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-11 17:04:55]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-11 17:05:22]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-11 17:05:32]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-11 17:05:50]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-12 10:35:43]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-12 10:36:20]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-15 07:43:02]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-15 07:46:15]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-15 07:46:58]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-15 07:49:25]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-15 07:49:33]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-15 07:49:41]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-15 07:53:49]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-15 07:54:06]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-15 08:00:36]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-15 08:00:48]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-15 08:00:51]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-15 08:00:54]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-15 08:02:09]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-15 08:02:36]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-15 08:03:10]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-15 08:03:37]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-15 08:04:07]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-15 08:06:49]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-15 08:07:19]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-15 08:07:33]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-15 08:07:56]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-15 08:08:11]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-15 08:08:58]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-15 08:09:44]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-15 09:18:38]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-15 09:18:41]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-15 09:19:04]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-15 09:23:04]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-15 09:24:34]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-15 09:24:59]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-15 09:25:10]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-15 09:25:20]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-15 09:32:46]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-15 09:32:53]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-15 09:33:01]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-15 09:33:10]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-15 09:33:20]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-15 09:33:28]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-15 09:35:57]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-15 09:41:38]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-15 09:41:45]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-15 09:41:54]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-15 09:42:11]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-15 09:43:01]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-15 09:43:13]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-15 09:59:00]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-15 09:59:20]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.

[2026-06-24 11:53:15]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-24 11:53:27]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-24 12:05:19]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-24 12:34:27]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-24 13:59:09]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-24 14:14:36]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-24 14:14:42]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-24 14:15:00]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-24 14:28:22]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-24 14:28:31]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-24 16:47:11]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-24 16:54:24]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-24 16:54:31]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-24 16:54:43]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-24 16:54:49]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-24 16:54:59]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-24 17:03:57]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-24 17:04:12]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-24 17:04:19]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-24 17:10:17]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.


[2026-06-24 17:21:26]

Cambio detectado por Claude Code.
Validar TASK activa y CHANGELOG.
## 2026-07-11 - Campo BIM 4D/5D

- `BIM-TASK-0104` y `BIM-TASK-0105` cerradas localmente.
- PostgreSQL operacional queda en `de2021a1b2c3`; evidencia usa `BYTEA` y
  fechas `TIMESTAMPTZ`.
- `106` pruebas BIM, validador PostgreSQL reversible, harness responsive,
  anti-BIM y baseline enterprise pasan.
- `BIM-TASK-0106` cierra playback profesional y `BIM-TASK-0107` recursos,
  asignaciones, capacidad e histogramas nativos.
- Los slices posteriores `0106-0112` quedaron cerrados en el bloque de cierre
  BIM 4D del 12 de julio.
## 2026-07-11 - Correccion de alcance SYNCHRO

- SYNCHRO es benchmark funcional, no integracion ni conector.
- Se retiraron OAuth, iTwin/iModel, endpoints, UX y tablas Bentley.
- Durante la retirada del conector, PostgreSQL volvió temporalmente a
  `de2016a1b2c3`; el head vigente posterior es `de2017a1b2c3`.
- Se conservan las capacidades 4D/5D nativas `0091-0105`.
- `0106-0112` se redefinen como playback, recursos, conflictos, Gantt,
  informes, madurez y liberacion completamente nativos.

## 2026-07-12 - Cierre plan BIM 4D nativo 0091-0112

- `BIM-TASK-0109`: Gantt BIM con dependencias, ruta crítica, foco GUID y corte
  temporal sincronizado con playback/Fragments.
- `BIM-TASK-0110`: informes reproducibles JSON/CSV para Gantt, plan-real,
  recursos, conflictos, productividad y campo/EVM.
- `BIM-TASK-0111`: cinco IFC reales S/M/L, 20.95 MB y 1,103 elementos;
  Fragments no vacíos y 60 FPS Chrome/Edge desktop/tablet.
- `BIM-TASK-0112`: `109 passed`, PostgreSQL reversible hasta `de2017a1b2c3`,
  build, smokes BIM/anti-BIM y baseline enterprise completos.
- GiProy Clásico, TASK-1807, auth, tenant y contratos clásicos permanecen
  intactos. SYNCHRO es solo benchmark y no existe conexión Bentley.
- Plan de paridad funcional BIM 4D nativa `0091-0112`: `100%`.

## 2026-07-12 - Apertura paridad avanzada del nucleo BIM 4D

- Se adopta el nucleo 4D como siguiente alcance; Perform, Control, Field e IA
  quedan fuera hasta autorizacion independiente.
- `BIM-TASK-0113` a `0117` separan particion/preview, materializacion,
  equipos/trayectorias, seguridad/riesgos y escalabilidad/entregables.
- El código actual tiene componentes lógicos y `getSubsetBuffer`, pero no corte
  CSG materializado; no se declara esa capacidad hasta cerrar `0114`.
- `BIM-TASK-0113` queda cerrada con especificaciones de particion reversibles,
  preview WebGL real desktop/mobile y `111 passed`; la fuente IFC permanece
  intacta y la geometria no esta materializada.
- `BIM-TASK-0114` queda cerrada con artefactos parametricos
  `bounding_box_v1`, cantidades, checksum y render WebGL; `113 passed`. La
  fuente IFC sigue intacta y no se declara CSG exacto.
- `BIM-TASK-0115` queda cerrada con equipos BIM, trayectorias ligadas a
  actividad, playback, geometria temporal y conflictos; `115 passed`. No se
  declara GPS ni telemetria real.
- `BIM-TASK-0116` queda cerrada con riesgos, controles, inspecciones, zonas 3D
  y exposicion de trayectorias; `117 passed`.
- `BIM-TASK-0117` queda cerrada con 50k actividades, 300 frames deterministas,
  corpus de cinco IFC reales y federacion WebGL de cinco modelos Fragments a
  60 FPS; `117 passed` y baseline enterprise en verde.
- Plan avanzado `0113-0117`: `100%` dentro del nucleo 4D definido. No equivale
  a paridad de todo SYNCHRO ni incluye Perform/Control/Field, Bentley o CSG IFC
  exacto.
  geométrico no destructivo.

## 2026-07-13 - Gate CSG exacto aislado BIM-TASK-0118

- Se incorpora `three-bvh-csg` exclusivamente al perímetro BIM.
- El harness genera un muro perforado por sustracción y dos particiones
  complementarias por intersección; no usa clipping ni `bounding_box_v1`.
- La prueba DOM verifica volumen, delta inferior a `0.00001 m3`, triangulación,
  canvas WebGL no vacío, desktop/mobile y ausencia de overflow.
- Build, smoke BIM positivo, smoke anti-BIM y baseline enterprise están verdes.
- La TASK no persiste geometría ni afirma compatibilidad universal con IFC; el
  siguiente slice es materialización versionada PostgreSQL del resultado CSG.
- GiProy Clásico, TASK-1807, auth, tenant y contratos clásicos permanecen
  intactos. No existe conexión Bentley.

## 2026-07-13 - Persistencia CSG versionada BIM-TASK-0119

- Nueva tabla BIM aditiva `bim_4d_partition_csg_artifacts`, revisión
  `de2022a1b2c3`, aplicada en PostgreSQL operativo.
- El backend recalcula volumen desde posiciones/índices y rechaza geometría
  manipulada, no finita, fuera de rango o sin conservación volumétrica.
- POST/GET usan permisos BIM, empresa/proyecto activos y artefactos inmutables
  por revisión; el frontend consume únicamente `bimModelsApi`.
- Harness verifica POST + GET por SHA-256. Suite BIM `120 passed`, validador
  PostgreSQL reversible, smokes y baseline enterprise en verde.
- Pendiente real siguiente: ejecutar la misma cadena sobre geometría obtenida de
  un IFC real convertido a Fragments, no solo sobre malla manifold controlada.

## 2026-07-13 - CSG sobre IFC real BIM-TASK-0120

- El smoke usa buildingSMART PCERT Architecture con licencia/atribución del
  corpus y SHA-256 `3ff9b10b...e7e70d5` verificado.
- La fuente genera `18,439` bytes Fragments y expone un sólido real mediante
  web-ifc: ExpressId `448`, GlobalId `1yP7NInQz5uQzbiOpVFFJr`.
- La partición CSG conserva `143.555999 m3` con delta `0.000000926 m3`.
- El conflicto UMD/ESM entre Fragments y CSG en Node queda aislado mediante un
  subproceso de conversión reproducible; Vite conserva su import público.
- El siguiente gate es extraer la triangulación desde
  `FragmentsModels.getItemsGeometry` y alimentar CSG con ese round-trip.

## 2026-07-13 - Round-trip FragmentsModels CSG BIM-TASK-0121

- El IFC buildingSMART PCERT Architecture se convierte a Fragments y se carga
  mediante `FragmentsModels` dentro de un harness BIM aislado.
- `getItemsGeometry([464])` entrega la malla y
  `getGuidsByLocalIds([464])` resuelve `3_4VN63S96DfWiJjgG8j1C`.
- CSG conserva `6.345857 m3` con delta `0` a seis decimales y genera un payload
  `giproy_bim_4d_csg_artifact_v1` verificado por POST/GET y checksum.
- El canvas pasa desktop/mobile y el cleanup libera Fragments, renderer,
  controles, geometrías y materiales.
- Suite BIM `120 passed`, PostgreSQL reversible, build, smoke BIM, anti-BIM y
  baseline enterprise quedan en verde. GiProy Clasico y TASK-1807 no cambian.
- Siguiente gate local: consumo/render del artefacto CSG persistido en el panel
  BIM de producto. Gate D y el piloto real Gate E siguen abiertos.

## 2026-07-13 - CSG persistido en producto BIM-TASK-0122

- El panel de particiones BIM carga la revision CSG mas reciente mediante el
  cliente de dominio y reconstruye mallas Three.js desde el contrato persistido.
- `exact_bvh_csg_v1` tiene prioridad visual; `bounding_box_v1` permanece como
  fallback y rollback, sin sobrescribir IFC ni fuentes clasicas.
- Revision, checksum, metodo y volumen quedan trazables en la UX BIM.
- Smokes paramétrico y CSG exacto pasan desktop/mobile con canvas no vacio;
  build, smoke positivo BIM, anti-BIM y baseline enterprise quedan verdes.
- Avance técnico local estimado: `97%`. No es liberacion: 0086/Gate D requiere
  autorizacion clasica y 0090/Gate E exige piloto real minimo de diez dias
  habiles, dos revisiones y usuarios reales.
# Continuidad BIM Gate D/E - 2026-07-13

- `TASK-2022` a `TASK-2025` cierran Gate D local: puerta bajo flags, foco EDT,
  foco Presupuesto y retorno APU sin modificar contratos clásicos.
- Suite BIM `120 passed`; viewer, shell, replay, issues, federación, Fragments y
  rendimiento Chrome/Edge desktop/tablet están revalidados.
- Implementación técnica local: 100%. Liberación: 99%.
- Único pendiente no simulable: piloto humano Gate E de diez jornadas hábiles,
  dos revisiones reales, coordinador BIM y usuario de negocio. No declararlo
  ejecutado sin evidencia real.
- Beta queda desplegada con la rama BIM `de2022a1b2c3`, backend/frontend BIM
  actuales y allowlist exclusiva `empresa_id=1,3`. Empresa `2` fue validada
  como denegada incluso para superadministrador.
- Evidencias beta: PostgreSQL/backend/frontend saludables, home `200`, endpoint
  BIM sin token `401`, chunk `BimTab-Dk4eBf8p.js` publico `200`.
- Rollback beta: dump `giproy-beta-20260713-145438.sql.gz`, fuentes
  `task2026-bim-source-20260713-200303.tar.gz` e imagen backend
  `task2026-predeploy-20260713-200303`.

## Adecuacion SYNCHRO - QTO BIM 2026-07-13

- `BIM-TASK-0135` queda cerrada localmente con snapshots QTO inmutables,
  cobertura, checksum y agrupacion de cantidades IFC reales.
- El panel BIM presenta QTO y cantidad por elemento en tabs; Playwright valida
  1920x1080, codigos WBS/coste y ausencia de overflow.
- La rama BIM agrega la migracion aditiva `de2024a1b2c3`; no se tocaron tablas,
  contratos ni fuentes de verdad clasicas.
- Build, 29 pruebas acumuladas, smokes BIM V2, anti-BIM y baseline enterprise
  pasan. No se ha desplegado este slice.
- Siguiente slice: gobierno de revision QTO, aprobacion y aplicacion 5D
  controlada. Programa de adecuacion: 9/61 slices, 14,75% realizado.

## Adecuacion SYNCHRO - Gobierno QTO 2026-07-13

- `BIM-TASK-0136` cierra A04 con aprobacion unica, control optimista y paquete
  5D versionado sobre QTO con cobertura WBS/coste completa.
- No se escriben EDT, APU, Presupuesto ni Cronograma; F01 sigue parcial.
- Rama BIM `de2025a1b2c3`, 31 pruebas acumuladas, build, Playwright 1920x1080,
  anti-BIM, matriz y baseline enterprise estan verdes.
- Paridad demostrada: 47,50%. Programa: 10/61 slices, 16,39% realizado y
  83,61% pendiente. No se ha desplegado esta ola.
