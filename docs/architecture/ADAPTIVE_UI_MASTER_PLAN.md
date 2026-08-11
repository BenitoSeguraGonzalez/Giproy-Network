# Plan maestro de adecuacion visual escritorio y tablet

Fecha: 2026-07-24

Modo: INTEGRACION CONTROLADA GIPROY CLASICO <-> GIPROY BIM

Estado: APROBADO PARA EJECUCION INCREMENTAL

## Objetivo

Adecuar integralmente GiProy Clasico y GiProy BIM para que conserven su
identidad, geometria, funcionalidad y fuentes de verdad en escritorios con
distintas escalas de Windows y en tablets, incluida Lenovo Tab P12, sin usar
zoom global, `transform: scale()` ni reduccion indiscriminada de componentes.

## Principios vinculantes

1. La resolucion fisica no decide el layout.
2. La composicion se decide con viewport CSS, visual viewport, contenedor,
   orientacion, puntero, hover y touch.
3. La resolucion fisica y el DPR solo gobiernan nitidez y presupuesto grafico.
4. La interfaz se reorganiza; no se miniaturiza.
5. GiProy Clasico mantiene funcionalidad completa en tablet horizontal y
   vertical.
6. GiProy BIM mantiene funcionalidad completa certificada en tablet horizontal;
   en vertical solo monta superficies certificadas y orienta al usuario cuando
   una herramienta compleja requiere horizontal.
7. Ninguna funcionalidad, dato critico o accion autorizada se elimina por el
   viewport. El contenido secundario puede usar divulgacion progresiva.
8. BIM apagado conserva GiProy Clasico visual y funcionalmente sin UX BIM.
9. Cada slice se activa bajo flag, tiene rollback propio y exige aprobacion
   humana antes de ampliar rollout.

## Baseline y rollback verificados

- Commit local: `424aace7b6fd9db53dd8cc7c8ff979404970181e`.
- Rama: `main`, dos commits por delante de `gitea/main`.
- Copia 1:1: `E:\Repositorios\GiProy Network.rar`.
- Tamano: `844671554` bytes.
- SHA-256:
  `E0199DD189963469D917FAC1B19FE41B7726342AE79A5B07A9E38341AD8B7358`.
- Prueba interna RAR: OK.
- Restauracion aislada: OK.
- Archivos Git rastreados: `4445` en original y restauracion.
- Archivos `frontend/src`: `359` en original y restauracion.
- Baseline enterprise con frontend ejecutado en original y restauracion: OK.
- Warning aceptado: chunks Vite grandes ya documentados.

El RAR es rollback de ultimo recurso. Cada TASK debe conservar ademas rollback
por commit y feature flag. Los cambios preexistentes del worktree no se limpian,
revierten ni mezclan sin trazabilidad.

## Contrato de medicion

El estado adaptativo comun debe observar, sin telemetria central inicial:

- `window.innerWidth` y `window.innerHeight`;
- `visualViewport.width`, `height`, `offsetLeft`, `offsetTop` y `scale`;
- `screen.width`, `screen.height`, `availWidth` y `availHeight` solo como
  diagnostico;
- `devicePixelRatio` solo como densidad, nunca como capacidad de layout;
- orientacion;
- `pointer: fine/coarse`, `hover: hover/none` y `maxTouchPoints`;
- tamaño real de cada workspace mediante `ResizeObserver`;
- safe areas y reducciones de altura por navegador o teclado virtual.

El detector no debe identificar Lenovo, Android o Windows para decidir la
composicion. El dispositivo es evidencia de prueba, no condicion de negocio.

## Perfiles de composicion

| Perfil | Condicion | Comportamiento |
|---|---|---|
| `wide` | El contenedor satisface la geometria completa | Layout actual completo |
| `compact` | Falta espacio para contenido secundario simultaneo | Toolbars agrupadas y paneles alternables |
| `tablet-landscape` | Touch/coarse y geometria horizontal intermedia | Dos regiones o region principal con drawers |
| `tablet-portrait` | Touch/coarse y geometria vertical | Una region principal y detalle progresivo |
| `constrained` | La funcion no puede operar con seguridad | Bloqueo focal, explicacion y recuperacion automatica |

Los umbrales son content-driven y pueden diferir por workspace. No se usan
breakpoints genericos como certificacion de que una herramienta cabe.

## Control de usuario

- Modo por defecto: `automatic`.
- Alternativas: `compact` y `wide` solo cuando la geometria sea segura.
- Una preferencia manual nunca fuerza overflow o clipping.
- Preferencias separadas por usuario, proyecto y clase de viewport.
- Accion obligatoria: `Restablecer distribucion`.

## Invariantes graficos

- Sin escalado global de la aplicacion.
- Tipografia, iconos, colores, bordes y jerarquia desktop se conservan.
- Acciones primarias y navegacion touch usan areas interactivas cercanas a
  `44x44` CSS px sin agrandar necesariamente el grafico interior.
- El texto y zoom del usuario se respetan hasta 200% en superficies
  compatibles.
- El scroll pertenece al contenedor funcional, no a la pagina completa cuando
  se trate de tablas, arboles, Gantt, viewer o ledgers.
- Modales: header/footer persistentes y cuerpo desplazable; teclado virtual no
  puede ocultar la accion principal.
- Tablas: identidad, estado, valor principal y accion critica permanecen; el
  resto usa scroll, selector de columnas o detalle, sin perdida de datos.

## Contrato BIM/WebGL

- El canvas CSS coincide exactamente con su contenedor.
- La resolucion interna WebGL es independiente del layout.
- Calidad inicial: `automatic`, con perfiles `performance` y `high`.
- DPR efectivo limitado y gobernado por rendimiento, inicialmente entre 1 y 2.
- Resize, rotacion y cambio de monitor recalculan renderer y camara sin perder
  seleccion, GUID, filtros, visibilidad ni estado.
- Tablet no se certifica con escena vacia: requiere datasets representativos,
  raycasting, memoria y fluidez verificables.

## Matriz funcional por modulo

### Capa comun

- AppLayout: branding, empresa, licencia, usuario, avisos, mantenimiento y
  transferencias.
- UI: modales, dialogs, selects, date inputs, hints, tablas, toolbars, scroll y
  reporting preview.

### GiProy Clasico

- Acceso: Login, ForgotPassword, ResetPassword, VerifyRegistration y RUC.
- Inicio: Dashboard y OtrosServicios.
- Proyectos: cartera lista/Kanban, calendario, tareas, revisiones y modales.
- Gestor: proyectos, bases y asignaciones.
- Proyecto: Datos, Stakeholders, EDO/OBS, EDT/WBS, Presupuesto, Cronogramas,
  Desagregacion y Formula Polinomica.
- Precios: landing, BasesTrabajo, Subcategorias, Recursos y APUs.
- Presupuesto: catalogo, lineas, tanteo, indirectos, notas, Pareto y editor APU.
- Servicios: Community, EnviosTransferencias y Marketplace comprador/vendedor/
  administrador.
- Settings: empresa, backup, usuarios, plantillas, proyecto y preferencias.
- AdminGlobal: todos sus submodulos.

### GiProy BIM

- Shell: contexto, busqueda, workspaces, herramientas, explorer, viewer,
  inspector y drawer temporal.
- Viewer: fragments, navegacion, seleccion, hover alternativo, filtros,
  visibilidad, vistas y propiedades.
- Coordinacion: CDE, documentos, RFI, submittals, revisiones, incidencias,
  calidad, IDS, comparacion, federacion, ubicacion y conflictos.
- Planificacion: links, intercambio y secuencia 4D.
- Produccion: plan-real, ERP, integraciones, costes, contratos, pagos, SOV,
  cambios, reales, forecast, eventos, frentes, cantidades, productividad,
  recursos, particiones y equipos.
- Campo: diario, cuadrillas, materiales, documentos, incidencias, avance e
  inspecciones.
- Entrega: as-built, commissioning, punch, dossier y O&M.
- Administracion: IFC, modelos/versiones, federacion, ubicacion, calidad e IDS.

## Orden de ejecucion

1. `TASK-2039` / `BIM-TASK-0192`: contrato, detector, perfiles, flags y harness
   de matriz.
2. Shell y UI compartida.
3. Acceso, Dashboard, Proyectos y Settings.
4. Precios, APUs, Presupuesto, Cronogramas y Gantt.
5. Community, Marketplace, Envios y AdminGlobal.
6. BIM shell/viewer.
7. BIM Coordinacion, 4D, Produccion/5D, Campo, Entrega y administracion.
8. Certificacion integral local y preflight beta.

Cada paso debe subdividirse en TASKs focales antes de editar los modulos
correspondientes.

## Matriz de certificacion

- Full HD: 100%, 125% y 150%.
- QHD: 100%, 125% y 150%.
- 4K: 100%, 150% y 200%.
- Zoom navegador: 80%, 100%, 125%, 150% y 200% cuando aplique.
- Viewports CSS: 1920x1080, 1536x864, 1366x768, 1280x800, tablet horizontal
  equivalente a Lenovo Tab P12 y tablet vertical.
- Windows 10/11 Chrome y Edge.
- Chrome Android real en Lenovo Tab P12.
- Firefox Windows secundario para Clasico.
- Touch, raton, teclado, rotacion, pantalla dividida y teclado virtual.

## Gate por slice

1. Captura baseline antes del cambio.
2. Funciones visibles inventariadas y comprobadas.
3. Prueba focal que falla sin la adecuacion.
4. Build y smokes del modulo.
5. Smoke anti-BIM.
6. BIM positivo cuando aplique.
7. Baseline enterprise con frontend.
8. Comparacion visual desktop sin alteracion no autorizada.
9. Tablet real y aprobacion humana antes del rollout.
10. Rollback documentado y probado.

## Rollout

- Flags maestras y por modulo, apagadas inicialmente.
- Flag maestra de build: `VITE_ADAPTIVE_UI_ENABLED`; piloto local reversible:
  `giproy_adaptive_ui_pilot`.
- Flags por slice mediante `VITE_ADAPTIVE_UI_MODULES` o el JSON local
  `giproy_adaptive_ui_modules`. Una desactivacion explicita restaura solo el
  slice afectado; `global:false` desactiva todos.
- Slices iniciales: `shell`, `project-structure`, `desagregacion`,
  `formula-polinomica`, `presupuesto`, `apus`, `cronogramas`, `gantt` y `bim`.
- Piloto: equipo interno, allowlist de empresa/usuario, beta y luego ampliacion.
- La deteccion adaptativa no usa allowlist; la flag controla el rollout.
- Produccion requiere autorizacion separada.
- No se modifican Docker, Coolify, CI/CD ni infraestructura en este programa sin
  TASK explicita.

## Criterio de cierre

El programa solo termina cuando todas las rutas y estados inventariados pasan la
matriz aplicable, GiProy Clasico es equivalente con BIM apagado, BIM mantiene
sus gates y canvas operativo, la Lenovo Tab P12 real queda aprobada en ambas
orientaciones segun su matriz, y el preflight de despliegue no deja pendientes.

## Ejecucion y rollback operativo

Validacion local repetible desde `frontend`:

1. `npm run smoke:adaptive-all`
2. `npm run smoke:gantt-classic`
3. `npm run smoke:bim-workspace-v2`
4. `npm run build`
5. Desde la raiz: `python tools/ai_tools/validate_enterprise_baseline.py --include-frontend`

Activacion piloto: definir `VITE_ADAPTIVE_UI_ENABLED=true` en beta o usar
`giproy_adaptive_ui_pilot=true` localmente. Los slices pueden limitarse con
`VITE_ADAPTIVE_UI_MODULES` o `giproy_adaptive_ui_modules`.

El build Docker transmite ambas variables como argumentos de Vite. Su valor
por defecto es `false`, de modo que reconstruir o desplegar sin configuracion
explicita conserva el layout legacy. Para un piloto por navegador se mantiene
la flag de build apagada y se activa solo `giproy_adaptive_ui_pilot` en el
perfil autorizado.

Rollback inmediato y sin perdida de datos: apagar la flag maestra. Rollback
focal: establecer el slice afectado en `false`. La adecuacion no incorpora
migraciones, cambios de API ni conversiones persistentes de datos. La copia
1:1 externa permanece como recuperacion integral independiente.

Estado local al 2026-07-24: matrices automatizadas, build, Classic, BIM y
baseline enterprise verdes. La promocion de beta a produccion permanece
bloqueada hasta completar la lista fisica de la Lenovo Tab P12.

Preflight beta ejecutado en `excomsvr`: recursos, redes `proxy`/`backend`,
Compose, `.env`, frontend, backend y PostgreSQL saludables. El contenedor
frontend se construyo de forma aislada en el servidor con flags adaptativas,
Nginx valido y bundles con flags verificadas; el artefacto temporal fue
eliminado sin tocar el stack beta activo.

Gate de dependencias: Axios `1.18.1` y `form-data` `4.0.6`. El smoke
`npm run smoke:deployment-security` impide regresiones y solo admite el aviso
de React Router relativo a RSC mientras el codigo conserve arquitectura SPA
sin APIs RSC. React Router DOM queda en `7.18.2`, version validada y bloqueada
disponible y validada por las suites del proyecto.

## Lista de certificacion fisica Lenovo Tab P12

Con depuracion USB autorizada y una unica tablet visible en `adb devices`,
ejecutar desde `frontend` primero `npm run certify:lenovo:landscape` y luego
`npm run certify:lenovo:portrait`. Cada comando verifica Chrome Android real y
genera capturas e informe en `artifacts/device-certification/`.

- Chrome Android actualizado, zoom del sitio al 100% y fuentes del sistema en
  valor normal; registrar cualquier ajuste distinto.
- Ejecutar horizontal y vertical, rotar con cada workspace abierto y probar
  pantalla dividida.
- Verificar Shell, EDO, EDT, Desagregacion, Formula, Presupuesto, APUs,
  Cronogramas, Gantt, Settings, Community, Marketplace y Transferencias.
- Confirmar que no existe scroll horizontal de pagina; el scroll horizontal de
  tablas debe permanecer dentro de la tabla.
- Abrir/cerrar modales, invocar teclado virtual, guardar/cancelar y confirmar
  que ninguna accion queda oculta ni se pierde informacion introducida.
- En Gantt, verificar Tabla/Dividida/Gantt y que el arrastre tactil solo actua
  tras activar edicion.
- En BIM horizontal, cargar un IFC representativo, seleccionar elementos,
  inspeccionar propiedades, alternar paneles y calidades, rotar y volver sin
  perder seleccion. En vertical debe aparecer la restriccion certificada.
- Registrar capturas, modelo Android/Chrome, orientacion, resultado y aprobador.
