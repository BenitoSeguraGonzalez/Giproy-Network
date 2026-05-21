# Analisis del Repositorio - GiProy Network

Fecha: 2026-05-20  
Modo: GIPROY CLASICO  
Alcance: analisis enterprise sin cambios funcionales

## Resumen ejecutivo

GiProy Network es un ERP SaaS vivo con backend FastAPI, frontend React/Vite y PostgreSQL. El repositorio ya no corresponde al snapshot historico minimo: contiene dominios clasicos maduros, Marketplace, Comunidad, Administracion Global, reporting, cronogramas avanzados y una capa BIM ya presente pero aislada por feature flags.

La conclusion principal es conservadora: antes de modularizar o dockerizar se debe estabilizar higiene de repositorio, clasificar scripts temporales, proteger secretos/artefactos y mantener gates de validacion por modulo. No se recomienda mover codigo productivo ni fusionar duplicaciones sin evidencia runtime.

## Estructura real observada

- `backend/app/main.py`: entrada FastAPI, CORS, middleware, mantenimiento y router v1.
- `backend/app/api/api.py`: agregador de rutas bajo `/api/v1`.
- `backend/app/api/endpoints/`: endpoints por dominio, incluyendo clasicos, administracion, Marketplace, Comunidad, reporting, cronogramas y BIM.
- `backend/app/models/`: modelos SQLAlchemy. Incluye dominios ERP clasicos, Marketplace, Comunidad, licencias, auditoria, calendario, BIM y cronogramas.
- `backend/app/schemas/`: contratos Pydantic.
- `backend/app/services/`: logica de negocio. Algunos servicios son grandes y concentran reglas criticas.
- `backend/app/repositories/`: acceso a datos, aun con imports diferidos en puntos de acoplamiento.
- `backend/alembic/`: migraciones existentes con baseline y revisiones posteriores.
- `backend/app/tests/`: pruebas focales por modulo critico.
- `frontend/src/routes/AppRouter.jsx`: rutas principales React.
- `frontend/src/api/`: clientes API por dominio y utilidades de tenant.
- `frontend/src/pages/`: paginas de primer nivel; varias son modulos grandes.
- `frontend/src/components/projects/`: shell clasica de Proyectos, EDT, EDO, Cronogramas, BIM tab y utilidades Gantt.
- `frontend/src/components/marketplace/`, `frontend/src/components/reporting/`, `frontend/src/components/bim/`: dominios frontend especializados.
- `docs/`: arquitectura, tareas, handoff, changelog, runtime y planes historicos.
- `tmp/`, `DBDump/`, `backups/`, scripts raiz y perfiles Edge: artefactos operativos, debug, dumps y evidencia de QA que no deben entrar en Git productivo sin clasificacion.

## Superficie API

Prefijo comun: `/api/v1`.

Routers montados:

- `auth`
- `usuarios`
- `proyectos`
- `proyecto-detalles`
- `stakeholders`
- `roles`
- `maestros`
- `empresas`
- `paises`
- `recursos`
- `apus`
- `presupuestos`
- `bases-trabajo`
- `subcategorias`
- `subcategorias-items`
- `dispositivos`
- `edo`
- `edt`
- `utils`
- `system-announcements`
- `proyectos/calendar-entries`
- `usuarios/personal-todos`
- `admin-audit`
- `admin-system`
- `admin-import-models`
- `admin-maintenance`
- `admin-bim`
- `admin-licenses`
- `cronogramas`
- `polinomica`
- `bim`
- `cronogramas-trabajo`
- `reporting`
- `community`
- `marketplace`

## Modulos criticos

- Autenticacion, JWT, sesiones, dispositivos y recuperacion de contrasena.
- Multiempresa/tenant: `empresa_id`, empresa activa, permisos por rol y superadministracion.
- Proyectos, revisiones, detalle de proyecto, documentos y calendario.
- Bases de trabajo, subcategorias, recursos, APUs y presupuestos.
- EDT, EDO, Stakeholders y sincronizacion de roles.
- Cronogramas, Gantt, cronograma valorado, flujo de caja y reporting integrado.
- Marketplace: productos, compras, ventas, devoluciones, origen de activos y bloqueo de republicacion.
- Compras publicas SOCE/SERCOP: preview, materializacion, trazabilidad y exportacion.
- Administracion Global: auditoria, licencias, mantenimiento, sesiones y modelos de importacion.
- Comunidad: posts, temas, DM, sanciones, apelaciones, adjuntos y moderacion.
- BIM: dominio aislado con endpoints, modelos y feature flags; no debe contaminar el flujo clasico.

## Dependencias principales

Backend:

- FastAPI, Uvicorn, SQLAlchemy, Alembic, Pydantic, PostgreSQL via `psycopg2-binary`.
- `python-multipart` para uploads.
- `openpyxl`, `xlrd`, `reportlab`, `pdfplumber` para importacion/reporting.
- `language-tool-python` para corrector asistido.
- `pywin32` condicionado a Windows para integracion MS Project.

Frontend:

- React 18, Vite, React Router 7.
- Axios con inyeccion de tenant.
- Framer Motion, Lucide, Radix primitives, Leaflet.
- Playwright como herramienta de QA.

## Acoplamientos detectados

- Backend comun concentra dominios clasicos, Marketplace, Comunidad y BIM dentro del mismo router v1.
- `cronograma_trabajo.py` contiene logica extensa y usa imports diferidos para evitar ciclos, senal de alta sensibilidad.
- `apu.py`, `presupuesto.py`, `bases_trabajo.py`, `proyectos.py` y reporting cruzan varios dominios clasicos.
- Frontend `Proyectos.jsx`, `CronogramaGantt.jsx`, paginas de Precios Unitarios y Marketplace son superficies grandes con alta probabilidad de efectos colaterales.
- BIM existe en backend/frontend, pero debe permanecer aislado por `BIM_ENABLED` y rutas/UX especificas.

## Riesgos detectados

- El repositorio contiene dumps, backups, bases `.db`, logs, perfiles de navegador temporales y archivos comprimidos.
- `docs/db_credentials.txt`, tokens de Cloudflared y dumps SQL requieren revision manual antes de GitHub privado.
- Existen muchos scripts `check_*`, `verify_*`, `fix_*`, `debug_*`, `tmp_*` en raiz, backend, scripts y tmp.
- Hay artefactos binarios de QA en `frontend/tmp_*.png`, perfiles Edge bajo `tmp/edge-*` y archivos generados.
- `backend/app/main.py` aun permite `Base.metadata.create_all` si `CREATE_TABLES_ON_STARTUP=true`; debe mantenerse apagado en entornos controlados.
- Hay dependencias legacy o de transicion como `pymysql` aunque el sistema actual documenta PostgreSQL.
- Existen dominios nuevos no reflejados completamente en snapshots previos.
- La capa BIM ya tiene presencia real; cualquier validacion clasica debe incluir smoke de no contaminacion BIM.

## Artefactos peligrosos para Git

- `DBDump/*.sql`, `DBDump/*.dump`
- `backups/`
- `deploy.tar.gz`
- `*.db`, `*.sqlite`, `*.sqlite3`
- `auth_session_trace.jsonl`, `backend/auth_session_trace.jsonl`
- `fatal_errors.log`, `auth_debug.log`, `backend/*.log`
- `tmp/edge-*`, `tmp/*backup*.json`, `tmp/*.pdf`, `tmp/*.xlsx`, `tmp/*.docx`
- `frontend/tmp_*.png`, `frontend/*lint*.txt`, `frontend/*lint*.json`
- `CloudFlared-bkp/*token*.txt`
- `Complementos/Aspose.Tasks...` por licencia/binarios externos
- `docs/db_credentials.txt`

## Duplicaciones y deuda tecnica

- Scripts de verificacion y reparacion duplicados entre raiz, `backend/`, `backend/scripts/`, `scripts/` y `tmp/`.
- Pruebas manuales con prefijo `test_` fuera de `backend/app/tests/`, mezcladas con tests reales.
- Paginas frontend grandes aun concentran UI, estado y orquestacion de dominio.
- Algunos endpoints son muy extensos, especialmente Comunidad, Marketplace, Cronogramas y Proyecto Detalles.
- Documentacion historica abundante; requiere indice de vigencia para distinguir decision activa vs registro historico.

## Recomendaciones seguras

1. Congelar una fase de higiene sin mover codigo productivo.
2. Clasificar scripts en inventario antes de moverlos a `tools/debug` o `scripts/debug`.
3. Ampliar `.gitignore` para evitar nuevos artefactos, sin borrar archivos ya existentes.
4. Mantener validaciones focales por modulo antes de cualquier movimiento.
5. No fusionar duplicaciones hasta confirmar equivalencia funcional y referencias dinamicas.
6. Dockerizar solo despues de validar imports, builds y variables de entorno.
7. Mantener BIM aislado: feature flag apagable, rutas propias y sin dependencia desde flujo clasico.
8. Crear una matriz de modulos sensibles y gates de rollback por fase.

