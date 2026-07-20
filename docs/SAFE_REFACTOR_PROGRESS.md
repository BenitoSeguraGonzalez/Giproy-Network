# Progreso del plan seguro enterprise

Fecha: 2026-05-22
Modo: GIPROY CLASICO  
Alcance: profesionalizacion incremental sin cambios destructivos

## Resumen ejecutivo

El tramo de gobierno, inventarios, logging seguro y baseline reproducible queda completo para continuar con slices futuros sin reanalizar todo el repositorio.

Porcentaje del tramo actual: 100%.

Este porcentaje no significa que toda la modernizacion enterprise este terminada. Significa que el bloque habilitador previo a refactors de mayor riesgo ya tiene documentacion, snapshots, politica y validacion reproducible.

Estado operativo actual: baseline local clasico cerrado. El trabajo de despliegue queda planificado y pausado hasta instruccion explicita.

## Estado por fase

| Fase | Estado | Evidencia | Proximo criterio |
|---|---:|---|---|
| Fase 0 - Gobierno y linea base | 100% | `AI_CONTEXT.md`, `docs/project_state.json`, `WORK_MODE_STATE`, TASK/CHANGELOG | Mantener actualizado por slice |
| Fase 1 - Higiene sin movimiento funcional | 100% inicial | `docs/REPO_HYGIENE_INVENTORY.md`, `docs/repo_hygiene_inventory.json`, `.gitignore`, auditoria de indice Git | Abrir lotes de saneamiento solo con decision explicita de indice |
| Fase 2 - Snapshots IA | 100% inicial | `docs/project_state.json`, `docs/logging_inventory.json`, `ai_tooling` | Regenerar solo cuando el slice lo requiera |
| Fase 3 - Validacion tecnica base | 100% inicial | `docs/TECHNICAL_VALIDATION_BASELINE.md`, `validate_enterprise_baseline.py`, runbook | Ejecutar baseline antes de fases nuevas |
| Fase 4 - Modularizacion backend | 100% | micro-limpiezas logging/imports, cobertura/fixes de helpers puros/contratos de datos y cierre formal validado | Mantener congelada salvo bug focal o slice backend autorizado |
| Fase 5 - Modularizacion frontend | 100% | auditoria inicial, mapa de dependencias/API, inventario reproducible, cola de slices seguros, clientes tenantless/globales, cliente publico auth, transport de trazas de sesion, cliente Formula Polinomica, lecturas globales de paises, cliente ProjectManager clasico, cliente externo de geocodificacion, alta Comunidad via usuariosApi, fixture Gantt FF via cliente, lecturas iniciales Settings, escrituras basicas de empresa, escrituras de usuarios, Settings sin llamadas API directas, AuthContext via cliente auth, inventario de tamaño frontend, guarda arquitectonica frontend, smokes focales de fronteras API clasicas, logo de empresa, ProjectManager, Formula Polinomica, Community, Marketplace Admin, Presupuestos, Cronogramas/Gantt, BasesTrabajo, DatosProyecto, ApuBudgetEditor, Proyectos y AuthContext en baseline; sin imports directos de axiosConfig fuera de frontend/src/api; frontend/src sin console.log productivos fuera de api; cierre formal TASK-1804 validado | Mantener congelada salvo bug focal o slice frontend autorizado |
| Fase 6 - Entornos y Docker | 10% | preflight documental `docs/ENVIRONMENT_DOCKER_PREFLIGHT.md`; contrato local observado backend `3001`, frontend `3010`, proxy `/api`, PostgreSQL separado y BIM desactivado por defecto; despliegue pausado hasta solicitud explicita | En espera; no crear `.dockerignore`, Dockerfiles ni imagenes sin nueva instruccion |
| Fase 7 - CI/CD y Coolify | 0% | no iniciada; planificada pero pausada hasta solicitud explicita | Depende de Docker/staging y autorizacion explicita |
| Fase 8 - Produccion SaaS | 0% | no iniciada | Depende de CI/CD, backups y observabilidad |

## Cierre operativo actual

- Refactor local clasico: 100%.
- Preparacion documental de despliegue: 10%.
- Despliegue Docker/Coolify/staging/produccion: pausado por instruccion del usuario.
- Porcentaje global practico: 98%, porque las fases de despliegue permanecen fuera de alcance activo.

## TASKs cerradas en el tramo

- `TASK-1700`: analisis enterprise, plan seguro, contexto IA y snapshot.
- `TASK-1701`: inventario documental de higiene.
- `TASK-1702`: inventario reproducible de higiene.
- `TASK-1703`: baseline tecnico inicial.
- `TASK-1704`: validador baseline reproducible.
- `TASK-1705`: logging conservador en endpoints clasicos.
- `TASK-1706`: logging conservador en bases y proyecto.
- `TASK-1707`: limpieza mecanica de imports backend clasico.
- `TASK-1708`: redaccion conservadora de logs de autenticacion.
- `TASK-1709`: politica conservadora de logging seguro.
- `TASK-1710`: inventario reproducible de logging.
- `TASK-1711`: baseline valida inventario de logging.
- `TASK-1712`: contexto IA incorpora snapshots de logging.
- `TASK-1713`: runbook de validacion enterprise.
- `TASK-1714`: plan seguro incorpora artefactos de control.
- `TASK-1715`: progreso del plan seguro enterprise.
- `TASK-1716`: cobertura focal de helpers puros core.
- `TASK-1717`: cobertura ampliada de helpers puros core.
- `TASK-1718`: cobertura focal de estado de revision APU.
- `TASK-1719`: cobertura focal de redondeo core.
- `TASK-1720`: cobertura focal de politica de calculo.
- `TASK-1721`: cobertura focal de permisos Marketplace.
- `TASK-1722`: cobertura focal de politica de origen Marketplace.
- `TASK-1723`: cobertura focal de perfil Marketplace.
- `TASK-1724`: cobertura focal de contrato de categorias Marketplace.
- `TASK-1725`: cobertura focal de configuracion de catalogo Marketplace.
- `TASK-1726`: cobertura focal de contrato tecnico Compras Publicas.
- `TASK-1727`: cobertura focal de acceso a importador Compras Publicas.
- `TASK-1728`: cobertura focal de diagnosticos de perfiles Compras Publicas.
- `TASK-1729`: cobertura focal de persistencia aislada de perfiles Compras Publicas.
- `TASK-1730`: cobertura focal de clonado y estado de perfiles Compras Publicas.
- `TASK-1731`: cobertura focal de enriquecimiento de perfiles Compras Publicas.
- `TASK-1732`: cobertura focal de delegacion tecnica Compras Publicas.
- `TASK-1733`: cobertura focal de helpers puros Comunidad.
- `TASK-1734`: cobertura focal de politica de autor Comunidad.
- `TASK-1735`: cobertura focal de vigencia de sanciones Comunidad.
- `TASK-1736`: cobertura focal de estado por sanciones Comunidad.
- `TASK-1737`: cobertura focal de acceso a temas Comunidad.
- `TASK-1738`: cobertura focal de scope de categorias Comunidad.
- `TASK-1739`: cobertura focal de visibilidad de publicaciones Comunidad.
- `TASK-1740`: cobertura focal de acceso a conversaciones DM Comunidad.
- `TASK-1741`: cobertura focal de revision de apelaciones Comunidad.
- `TASK-1742`: cobertura focal de emision de sanciones Comunidad.
- `TASK-1743`: cobertura focal de normalizacion datetime Comunidad.
- `TASK-1744`: cobertura focal de actividad visible Comunidad.
- `TASK-1745`: cobertura focal de ordenacion de publicaciones Comunidad.
- `TASK-1746`: cobertura focal de politica de adjuntos Comunidad.
- `TASK-1747`: cobertura focal de listado de adjuntos Comunidad.
- `TASK-1748`: cobertura focal de serializacion de categorias Comunidad.
- `TASK-1751`: cobertura focal de serializacion de temas Comunidad.
- `TASK-1752`: correccion focal de deteccion de links ofuscados Comunidad.
- `TASK-1753`: cobertura focal de serializacion de infracciones y alertas Comunidad.
- `TASK-1754`: cobertura focal de serializacion de respuestas Comunidad.
- `TASK-1755`: cobertura focal de serializacion de publicaciones Comunidad.
- `TASK-1756`: cobertura focal de serializacion de conversaciones DM Comunidad.
- `TASK-1757`: cobertura focal de serializacion de mensajes DM Comunidad.
- `TASK-1758`: cobertura focal de serializacion de menciones Comunidad.
- `TASK-1759`: cobertura focal de helpers de rol y empresa activa Comunidad.
- `TASK-1760`: cobertura focal de expiracion de adjuntos Comunidad.
- `TASK-1761`: cierre formal de Fase 4 backend seguro.
- `TASK-1762`: auditoria conservadora de indice Git y artefactos trackeados.
- `TASK-1763`: auditoria inicial de modularizacion frontend clasica.
- `TASK-1764`: mapa de dependencias frontend clasico y llamadas API directas.
- `TASK-1765`: inventario reproducible de dependencias frontend.
- `TASK-1766`: cola priorizada de slices frontend seguros.
- `TASK-1767`: cliente global tenantless para paises en lecturas simples.
- `TASK-1768`: cliente admin tenantless para catalogo de licencias.
- `TASK-1769`: cliente admin global tenantless para gobernanza.
- `TASK-1770`: reutilizacion adminGlobalApi en empresa auditada y comunicados.
- `TASK-1771`: reutilizacion adminGlobalApi en selector de empresa del layout.
- `TASK-1772`: cliente publico auth para recuperacion/reset de password.
- `TASK-1773`: consulta publica de cuentas por email en `publicAuthApi`.
- `TASK-1774`: registro publico en `publicAuthApi`.
- `TASK-1775`: transporte API para trazas de sesion.
- `TASK-1776`: cliente API para Formula Polinomica.
- `TASK-1777`: lecturas globales de paises en Community y Marketplace.
- `TASK-1778`: lectura global de paises en Settings.
- `TASK-1779`: cliente API para ProjectManager clasico.
- `TASK-1780`: cliente externo de geocodificacion clasica.
- `TASK-1781`: alta de usuario Comunidad via usuariosApi.
- `TASK-1782`: fixture local Gantt FF via cliente API.
- `TASK-1783`: lecturas iniciales de Settings via clientes API.
- `TASK-1784`: escrituras basicas de empresa en Settings via empresasApi.
- `TASK-1785`: escrituras de usuarios en Settings via usuariosApi.
- `TASK-1786`: Settings sin llamadas API directas.
- `TASK-1787`: AuthContext via cliente auth.
- `TASK-1788`: inventario reproducible de tamaño frontend.
- `TASK-1789`: guarda arquitectonica frontend en baseline.
- `TASK-1790`: smoke focal de fronteras API clasicas.
- `TASK-1791`: smoke focal de logo de empresa clasico.
- `TASK-1792`: smoke focal de ProjectManager clasico.
- `TASK-1793`: smoke focal de Formula Polinomica clasica.
- `TASK-1794`: smoke focal de Community clasica.
- `TASK-1795`: smoke focal de Marketplace Admin clasico.
- `TASK-1796`: smoke focal de Presupuestos clasico.
- `TASK-1797`: smoke focal de Cronogramas/Gantt clasico.
- `TASK-1798`: BasesTrabajo sin import directo de axiosConfig.
- `TASK-1799`: BasesTrabajo sin trazas DEBUG productivas.
- `TASK-1800`: DatosProyecto sin console.log productivos.
- `TASK-1801`: ApuBudgetEditor sin console.log productivos.
- `TASK-1802`: Proyectos sin console.log productivos.
- `TASK-1803`: AuthContext sin console.log productivos.
- `TASK-1804`: cierre formal de Fase 5 frontend seguro.
- `TASK-1805`: preflight Fase 6 entornos y Docker.
- `TASK-1806`: pausa explicita de despliegue Docker/Coolify.
- `TASK-1807`: cierre documental del baseline local clasico sin despliegue.
- `TASK-1808`: plantilla Modo Clasico actualizada para conservar el baseline seguro.

## Pendiente recomendado

Siguiente bloque seguro:

1. Esperar solicitud explicita del usuario antes de continuar Docker/Coolify/staging/produccion.
2. Cuando se solicite, en Fase 6 crear primero solo `.dockerignore` conservador antes de Dockerfiles.
3. No crear imagenes ni `docker-compose` hasta validar que el build context excluye uploads, logs, dumps, backups y `.env` reales.
4. Antes de saneamiento Git, decidir explicitamente si se sacan artefactos ya trackeados con `git rm --cached` por lote revisable.
5. Evitar auth, tenant, licencias, sesiones, presupuestos, EDT, cronogramas, Settings, ProjectManager, Community y Marketplace salvo bug focal o smoke claro.
6. No activar CI/CD, Coolify, staging ni produccion hasta cerrar Docker local aislado y recibir autorizacion explicita.

## No interferencia BIM

Durante este tramo:

- No se modifico codigo BIM.
- No se activo UX BIM.
- No se agregaron dependencias BIM.
- El smoke anti-BIM paso en el baseline completo.

## Warnings conocidos

- Pydantic advierte campos BIM `model_name` y `model_id`; se documenta y no se corrige en MODO 1.
- Vite advierte chunks grandes; es deuda tecnica controlada y no bloquea build.
