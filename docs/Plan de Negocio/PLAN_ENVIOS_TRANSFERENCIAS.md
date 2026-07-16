# Plan funcional: Envios y Transferencias

Fecha: 2026-06-16

Modo: GIPROY CLASICO

Estado: planificacion temprana, sin implementacion de codigo

## 1. Objetivo

El modulo `Otros Servicios > Envios y Transferencias` permitira enviar Bases de
Trabajo o Proyectos entre empresas dentro de GiProy Clasico.

La funcionalidad no es un sistema logistico general ni una mensajeria. Es una
capa controlada de transferencia de activos clasicos entre tenants, con
validacion de licencia, control de destinatarios, bloqueo por dependencias de
Marketplace, trazabilidad y recepcion/importacion segura.

## 2. Alcance autorizado

- Capa clasica de GiProy.
- Backend unico y comun, sin acoplamiento nuevo hacia BIM.
- UX dentro de `Otros Servicios`.
- Usuarios autorizados: `Administrador` y `Superadministrador`.
- Activos transferibles: Bases de Trabajo y Proyectos.
- Validacion obligatoria de licencias, plan activo y productos Marketplace.
- Planificacion documental fisica. No se implementa codigo en esta TASK.

## 3. Fuera de alcance

- No habilitar UX BIM ni dependencias BIM.
- No crear Dockerfiles, compose, pipelines, Coolify, staging ni produccion.
- No modificar contratos API existentes, auth, JWT, tenant, EDT, presupuestos,
  cronogramas ni datos reales sin TASK explicita.
- No mezclar esta funcionalidad con `Conecta` como si fueran lo mismo.
- No mover ni eliminar codigo aparentemente muerto.

## 4. Decisiones funcionales confirmadas

### 4.1 Roles

Solo `Administrador` y `Superadministrador` pueden:

- Ver el modulo.
- Enviar Bases de Trabajo o Proyectos.
- Ver bandeja de entrada/salida.
- Importar activos recibidos.
- Ver el semaforo de recepcion en el header principal.

Usuarios de menor rango no deben tener acceso visual ni operativo.

### 4.2 Licencias

La funcionalidad base esta incluida en la licencia comercial activa de la
empresa.

Licencias habilitadas:

- `STANDARD`.
- `PROFESSIONAL`.

Licencias bloqueadas:

- `EXPRESS`: bloqueo completo. No puede enviar, recibir ni importar
  envios.
- `TESTER`.
- `ACADEMIC`.
- `TRAINING`.

La validacion debe hacerse en backend, aunque el frontend oculte acciones.

La ampliacion de destinatarios se vende en Marketplace como producto comercial
`Conecta`, exclusivo de `Envios y Transferencias`, con precio inicial definido
en `24,99 USD`. Esta compra no habilita la funcionalidad base, sino que amplia
la cantidad de empresas destino disponibles para envios.

### 4.3 Destinatarios fijos

Cada empresa con licencia habilitada puede asociar hasta 3 empresas destino
fijas para envio.

Los destinatarios fijos:

- Permanecen activos mientras el plan siga activo.
- No pueden cambiarse libremente.
- Deben distinguirse de destinatarios temporales.
- Se mantienen al renovar la licencia.
- Si la empresa destino queda sin licencia compatible, el destinatario queda
  bloqueado hasta que retome una licencia valida.
- No limitan la recepcion: una empresa puede recibir envios desde cualquier
  emisor permitido.

La asociacion se valida introduciendo el codigo publico unico de la empresa
destino. Este codigo es visible y usable solo por administradores y
superadministradores, pero no pertenece a un usuario concreto.

Para fijar un destinatario debe existir doble chequeo funcional con tres capas
de verificacion:

- Introduccion del codigo unico.
- Resolucion y muestra de la empresa detectada.
- Confirmacion explicita antes de consumir el slot fijo o adicional.

### 4.4 Destinatarios adicionales

Para enviar a mas destinatarios, la empresa debe adquirir paquetes desde
Marketplace.

Regla comercial inicial:

- Producto Marketplace: `Conecta`.
- Producto exclusivo de `Envios y Transferencias`.
- Nombre comercial visible: `Conecta`.
- Contexto/subtitulo obligatorio donde exista riesgo de ambiguedad:
  `Envios y Transferencias`.
- En Marketplace, carrito, detalle y ayuda contextual debe leerse como producto
  `Conecta` con alcance `Envios y Transferencias`, sin crear nombres duplicados
  ni otro producto comercial.
- Precio inicial: `24,99 USD`.
- Cada compra agrega 3 empresas destino adicionales.
- Duracion: 30 dias desde la fecha/hora exacta de adquisicion del producto.
- Las compras son acumulables. Ejemplo: 3 destinos base + 2 compras `Conecta`
  equivalen a 9 empresas destino habilitadas para envio durante la vigencia de
  los productos adicionales.
- Cada compra es independiente; no existe bolsa comun entre paquetes.
- Los destinatarios adicionales quedan asociados al paquete concreto que los
  habilito.
- Al expirar el producto, los destinatarios adicionales quedan inactivos para
  nuevos envios segun el paquete al que estaban asociados.
- La relacion expirada queda auditada e historica.
- Si la empresa compra otro producto `Conecta`, debe realizar de nuevo el
  proceso completo de asociacion de destinatarios adicionales; no se reactivan
  automaticamente relaciones expiradas.
- Las recepciones historicas no se borran.
- El producto `Conecta` debe estar siempre disponible en Marketplace.

### 4.5 Codigo publico de empresa `XXX - XXX`

Cada empresa debe tener un codigo publico unico con formato:

`XXX - XXX`

Reglas:

- Seis caracteres alfanumericos aleatorios.
- El codigo se genera automaticamente por empresa al entrar al modulo o por
  saneamiento superadministrador.
- Debe ejecutarse saneamiento para generar codigo a empresas existentes que no
  lo tengan.
- El codigo no se regenera manualmente por superadministrador como operacion
  normal.
- El codigo no representa un destinatario usuario-usuario. Sirve para resolver
  exclusivamente la empresa destino.
- El backend debe resolverlo a IDs privados de empresa sin exponerlos.
- Debe evitar enumeracion, abuso y exposicion de datos innecesarios.
- Solo debe ser visible y usable por administradores/superadministradores.
- Al introducir un codigo valido, la UI debe mostrar datos minimos de la
  empresa: descripcion/nombre y alias si existe.
- No debe existir ni mostrarse usuario propietario del codigo.
- Si un superadministrador cambia la empresa operativa, el codigo mostrado debe
  ser el de esa empresa seleccionada, no el de la cuenta superadministradora.
- Dos empresas no pueden compartir el mismo codigo publico.
- Tras 3 intentos fallidos consecutivos, la empresa emisora debe esperar 5
  minutos para nuevos intentos.
- Si una empresa acumula 12 intentos fallidos en una ventana movil de 24 horas,
  queda baneada durante 7 dias para introducir nuevos destinatarios.
- El contador de abuso debe ser por empresa emisora y accion de validacion de
  codigo, no por sesion local del navegador.
- Estos bloqueos deben auditarse.

### 4.6 Envio confirmado

Reglas cerradas de envio:

- Siempre es uno a uno: una empresa emisora hacia una empresa receptora.
- Cada envio contiene un unico activo.
- El activo puede ser un Proyecto o una Base de Trabajo.
- La descripcion del envio es obligatoria.
- La descripcion se precarga por defecto con el nombre del Proyecto o Base de
  Trabajo.
- El emisor puede cancelar el envio mientras el receptor no lo haya importado.
- El emisor puede ver el estado de su envio.
- Si el activo contiene dependencias Marketplace, debe existir doble
  confirmacion antes de enviar.

### 4.7 Contenido transferible

Reglas cerradas de contenido:

- Proyecto: se transfiere solo hasta el alcance de Presupuesto.
- El envio de Proyecto incluye datos del proyecto, EDT y presupuestos.
- Ley funcional de Proyecto: un Proyecto exportable/importable no puede existir
  sin Base de Proyecto y APUs. Datos del proyecto, EDT y presupuesto son el
  minimo visible, pero el minimo tecnico integro exige que el presupuesto este
  enlazado a APUs de su Base de Proyecto.
- Un Proyecto con presupuesto sin lineas operativas enlazadas a APU no es apto
  para envio.
- El envio de Proyecto no incluye cronogramas, Gantt, planificacion temporal ni
  otros bloques posteriores al presupuesto.
- Base de Trabajo: se transfiere completa.
- No se envia documentacion adjunta, archivos, uploads ni documentos de soporte.
- Solo se pueden enviar Proyectos aptos y exportables.
- No se permite enviar Proyectos incompletos.
- Los Proyectos completos comprados en Marketplace pueden transmitirse, pero
  el receptor debera adquirirlos si no los tiene.
- Si el Proyecto tiene origen Marketplace o contiene productos Marketplace, el
  emisor recibe advertencia y el receptor queda obligado a comprar los
  productos requeridos antes de importar o usar el envio.
- Todos los productos Marketplace detectados en el activo enviado son
  obligatorios. No existen productos informativos ni recomendados en este flujo.
- Si el receptor no compra el conjunto completo de productos requeridos, el
  envio queda bloqueado para importacion y uso.
- El precio aplicable al receptor es el precio vigente en Marketplace al
  momento de su compra, no el precio historico pagado por el emisor.

### 4.8 Estados y bandeja

Reglas cerradas de estados y visualizacion:

- Se mantienen estados compartidos entre emisor y receptor cuando representen
  el mismo hito operativo, aunque las acciones disponibles cambien por rol.
- La etiqueta visible del estado debe adaptarse al rol operativo. Un envio con
  estado interno `enviado` se muestra como `Enviado` para la empresa emisora y
  como `Recibido` para la empresa receptora.
- Debe existir estado tecnico `fallo_importacion` aunque no deberia alcanzarse
  si preflight, compra obligatoria e importacion idempotente funcionan
  correctamente.
- La UI debe incluir un selector unificado de estado que aclare el significado
  de cada estado y use colores diferenciados para lectura rapida.
- La bandeja debe permitir filtro por estado.
- La busqueda debe ser omni sobre nombre legal de empresa y alias de empresa.
- Si una empresa tiene alias, el alias sustituye visualmente al nombre legal en
  listados, tarjetas y etiquetas, pero ambos valores deben conservarse para
  busqueda, auditoria y detalle.
- El historico se conserva siempre.
- La bandeja debe ofrecer filtros de fecha inicio y fecha fin.
- Por defecto, la bandeja muestra envios y recepciones desde un mes atras hasta
  la fecha actual.

## 5. Arquitectura funcional propuesta

La funcionalidad se divide en tres capas separadas.

### 5.1 Red de destinatarios

Gestiona:

- Codigo publico de empresa.
- Alta de empresa destinataria mediante codigo `XXX - XXX` de la empresa
  destino.
- Slots fijos.
- Slots adicionales vinculados a compra Marketplace `Conecta`.
- Vigencia de destinatarios adicionales.
- Auditoria de altas, bajas, expiraciones y bloqueos.
- Control anti-enumeracion, pausa por intentos fallidos y baneo temporal.

### 5.2 Bandeja de transferencias

Gestiona:

- Entrada, salida y vista combinada.
- Busqueda omni por empresa, alias, descripcion del envio y activo.
- Orden por fecha/hora de recepcion descendente.
- Filtro por estado.
- Filtro por rango de fechas.
- Estados visuales por semaforo y selector unificado con color.
- Estado visible contextual: `enviado` para salida se lee `Enviado`; `enviado`
  para entrada se lee `Recibido`.
- Acciones permitidas segun estado.
- Descripcion asociada a cada envio.
- Timeline/auditoria visible.

### 5.3 Motor de exportacion/importacion

Debe existir como motor universal de paquete, exportacion e importacion,
reutilizable por todos los contextos que mueven activos entre empresas o
usuarios: ventas de compras publicas, publicaciones y compras de Marketplace,
envios directos entre empresas y futuras entradas equivalentes.

`Envios y Transferencias` no debe duplicar rutinas de serializacion ni de
importacion. Debe invocar el motor comun y aportar su contexto funcional:
permisos, destinatario, limites de licencia, productos Marketplace requeridos,
cancelacion, rechazo, trazabilidad y saneamiento posterior.

El motor comun gestiona:

- Preflight antes del envio.
- Contrato de paquete por tipo de activo.
- Rutinas universales de exportacion/importacion, regidas por adaptadores de
  contexto.
- Snapshot inmutable del activo al momento de enviar.
- Contrato de contenido transferible por tipo de activo.
- Deteccion de dependencias Marketplace obligatorias.
- Bloqueo de importacion si falta cualquier producto obligatorio.
- Importacion idempotente en la empresa receptora.
- Copia consistente de Proyecto, Base de Proyecto, APUs, EDT y Presupuesto,
  preservando el mapa `APU origen -> APU destino` para que las lineas de
  presupuesto no queden desincronizadas.
- Bloqueo de preflight/importacion si un Proyecto no tiene Base de Proyecto,
  no tiene APUs o contiene lineas operativas de presupuesto sin `apu_id`.
- Certificacion de integridad post-importacion: una linea operativa de
  presupuesto importada no puede quedar sin `apu_id` ni apuntar a un APU fuera
  de la base clonada de la empresa receptora.
- Saneamiento del payload pesado tras importacion completada, conservando solo
  metadatos, hash, version de contrato, origen, destino y referencias de
  auditoria.

### 5.4 Arquitectura visual obligatoria

La referencia principal de look & feel para la futura UI es la seccion
`Proyectos`, especialmente su landing operativo y las superficies de
`Datos de Proyecto`.

`Envios y Transferencias` debe leerse como una extension natural del flujo de
Proyectos/Bases, no como una pantalla SaaS ni como un modulo visual aislado.

Reglas visuales obligatorias:

- Mantener el lenguaje soft de Proyectos: fondos claros, superficies blancas o
  calidas muy suaves, bordes finos, sombras ligeras y radio amplio.
- Usar naranja corporativo `#F39200` para acciones principales y acentos de
  estado, negro corporativo `#1A1A1A` para acciones activas/primarias y azul
  blueprint `#136191` para senales tecnicas.
- Reutilizar patrones existentes de Proyectos: header operativo, toolbar
  compacta, filtros segmentados, buscador integrado, chips de estado, tarjetas
  operativas y paneles laterales/modales con lectura tecnica.
- Reutilizar no solo el aspecto, sino tambien el funcionamiento de componentes
  ya definidos explicitamente en Proyectos cuando apliquen: comportamiento de
  busqueda, segmentados, acciones por icono, modales tecnicos, date inputs,
  selectores y botones compactos.
- Usar componentes comunes cuando existan: `LiquidButton`,
  `ProjectHeaderActionButton`, `ProjectSectionIconButton`,
  `ProjectSegmentedSwitch`, `ClearSearchField`, `SearchableSelect`,
  `AnimatedSelect`, `AnimatedDateInput` y botones de reporte comunes si aplica.
- No introducir un lenguaje visual de cards SaaS de Administracion Global para
  esta funcionalidad. El modulo vive en `Otros Servicios`, pero su experiencia
  debe estar visualmente alineada con Proyectos porque transfiere Proyectos y
  Bases de Trabajo.
- No crear una landing explicativa o comercial. La primera pantalla debe ser la
  bandeja operativa real con entrada/salida, busqueda, filtros, estados y CTA
  de nuevo envio.
- La bandeja debe ser principalmente una lista compacta, no un tablero de cards
  grandes. Debe mostrar solo la informacion necesaria para operar rapido:
  empresa/alias, activo, tipo, estado, fecha/hora, sentido, bloqueo
  Marketplace si existe y acciones.
- La toolbar debe incluir boton de `Nuevo envio` y boton de `Refrescar`.
- Los estados de envio deben ser legibles como chips/semaforos sobrios dentro
  del mismo sistema visual de Proyectos, evitando bloques grandes o controles
  apilados de ancho completo.
- El preflight de envio debe resolverse como modal/panel tecnico similar a los
  flujos de importacion/exportacion de Proyectos, con resumen, advertencias y
  confirmacion clara.
- El formato preferente para el preflight es modal tecnico.
- Las advertencias Marketplace deben usar paneles informativos compactos, no
  pantallas negras pesadas ni textos extensos que rompan la operativa.
- Los listados deben priorizar densidad profesional: nombre de empresa,
  activo, tipo, estado, fecha/hora, dependencias Marketplace y acciones por
  icono/boton corto.
- La vista debe respetar responsive desktop/mobile sin solapamientos, con
  toolbar colapsable y tarjetas/lista adaptativas.

La implementacion futura de UI no se dara por aceptada si visualmente parece un
modulo ajeno a Proyectos o rompe la coherencia visual vigente del sistema.

### 5.5 Adenda de adecuacion visual posterior a primera implementacion

Revision visual solicitada el 2026-06-16:

La primera implementacion funcional de `Envios y Transferencias` queda
operativa, pero requiere una adecuacion visual adicional para alinearse de forma
real con `Proyectos`. Esta adenda no reabre contratos backend, reglas
comerciales, licencias, Marketplace, auth ni tenant; solo gobierna la
homologacion frontend clasica.

Diagnostico visual:

- La pantalla actual usa demasiados botones negros grandes para acciones que en
  `Proyectos` se resuelven como botones tecnicos soft.
- Los combobox y filtros estan funcionalmente correctos, pero su integracion
  visual no replica el lenguaje compacto de `Proyectos`.
- El selector `Todos / Entrada / Salida` debe usar el patron de segmentado
  operativo `ProjectSegmentedSwitch` o una variante comun equivalente, no un
  grupo manual de botones.
- El filtro de estado debe leerse como filtro tecnico compacto del toolbar,
  con estados claros y color diferenciado, evitando aspecto de control suelto.
- El buscador debe alinearse con el buscador de portafolio de `Proyectos` o con
  `ClearSearchField`, manteniendo limpieza de valor vacio y busqueda omni.
- `Nuevo envio` y `Refrescar` deben adoptar el lenguaje de botones de
  herramientas de `Proyectos`: relieve gris suave, icono `lucide-react`,
  micro-label uppercase y feedback sutil.
- Las metricas superiores deben reducir su peso visual y funcionar como KPIs
  compactos, no como cards grandes que compitan con la bandeja.
- Las acciones de fila deben resolverse como microbotones soft; el color
  semantico debe estar en icono/borde/estado, no en grandes fondos de color.
- La tabla/lista debe acercarse al listado de portafolio de `Proyectos`:
  cabecera sobria, filas densas, columnas estables, scroll controlado y
  acciones discretas.
- El timeline por envio debe ser compacto o secundario para no aumentar
  excesivamente la altura de cada fila.
- Los modales de nuevo envio y rechazo deben usar estructura tecnica clasica:
  secciones soft, footer consistente, cierre homogeneo, `LiquidButton` para
  acciones principales/destructivas cuando aplique y formularios compactos.

Componentes de referencia obligatoria:

- `ProjectSegmentedSwitch` para direccion de bandeja y otros estados binarios o
  ternarios compactos.
- `ProjectHeaderActionButton` para acciones superiores cuando se requiera
  icono + micro-label.
- `LiquidButton` para acciones principales de modal o confirmaciones criticas.
- `ClearSearchField` o el patron de buscador compacto de `Proyectos` para
  busqueda omni.
- `SearchableSelect` para selectores con busqueda/lista no trivial.
- `AnimatedSelect` para selectores simples sin busqueda, si procede.
- `AnimatedDateInput` en variante compacta para fechas visibles.

Criterio de aceptacion de la adecuacion:

- La pantalla debe poder verse junto a `Proyectos` sin parecer un modulo
  externo ni una pantalla SaaS de Administracion Global.
- No debe haber `<select>` nativo, `input[type="date"]` visible final,
  `window.prompt`, imports directos de `axiosConfig` fuera de `frontend/src/api`
  ni `console.log` productivo.
- No se debe activar ni mostrar UX BIM.
- No se deben modificar API, backend, DB, auth, tenant, licencias ni
  Marketplace funcional.
- La adecuacion debe cerrarse con `npm run build`, smoke de transferencias,
  smoke anti-BIM y baseline enterprise con frontend.

## 6. Flujo de envio

1. El usuario autorizado entra en `Otros Servicios > Envios y Transferencias`.
2. Selecciona `Nuevo envio`.
3. Elige tipo de activo: Base de Trabajo o Proyecto.
4. Selecciona el activo origen.
5. Selecciona empresa destino ya asociada o agrega empresa destino por codigo
   `XXX - XXX` de un administrador de esa empresa.
6. El sistema ejecuta preflight.
7. El usuario ve:
   - Activo a enviar.
   - Alcance transferible del activo.
   - Empresa destino.
   - Si el destinatario usa slot fijo o adicional.
   - Dependencias Marketplace detectadas.
   - Advertencias de uso.
   - Tamano/impacto aproximado si esta disponible.
   - Descripcion obligatoria del envio, precargada con el nombre del activo.
8. El usuario confirma.
9. Si hay dependencias Marketplace, el sistema exige una segunda confirmacion.
10. El backend genera snapshot inmutable y registra auditoria.
11. Los administradores/superadministradores de la empresa receptora ven el
    envio en bandeja y en semaforo del header.

## 7. Preflight obligatorio

Antes de enviar debe validarse:

- Usuario emisor con rol autorizado.
- Empresa emisora con plan compatible y activo.
- Licencia `STANDARD` o `PROFESSIONAL`.
- Bloqueo completo de `EXPRESS`, `TESTER`, `ACADEMIC` y `TRAINING`.
- Destinatario permitido por slot fijo o adicional vigente.
- Activo origen pertenece a la empresa emisora.
- Activo no viola reglas de reventa o transferencia.
- Si es Proyecto, debe estar apto, completo y exportable.
- Si es Proyecto, el snapshot queda limitado a datos del proyecto, EDT y
  presupuestos.
- Si es Base de Trabajo, el snapshot incluye la base completa.
- No se incorporan documentos adjuntos, uploads ni documentacion.
- No se incorporan cronogramas, Gantt ni planificacion temporal.
- Dependencias Marketplace presentes.
- Productos comprados incorporados al activo.
- Todas las dependencias Marketplace se marcan como obligatorias.
- Descripcion obligatoria del envio.
- Estado del snapshot exportable.
- Envio uno a uno y un solo activo por envio.

Si el activo contiene productos Marketplace, el envio puede crearse, pero el
receptor no podra importar ni usar el envio hasta adquirir los productos
obligatorios.

## 8. Requisitos Marketplace

Todo envio debe guardar requisitos estructurados cuando detecte productos de
Marketplace.

La regla tambien aplica a Proyectos completos comprados en Marketplace o
activos con origen Marketplace: pueden transmitirse, pero el receptor debe
adquirir los productos requeridos antes de importar o usar el envio.

Reglas cerradas:

- Todos los productos Marketplace detectados son obligatorios.
- No existen productos informativos, opcionales ni recomendados.
- Si el receptor no compra el conjunto completo requerido, el envio permanece
  bloqueado para importacion y uso.
- La compra de productos requeridos es siempre por empresa receptora, nunca por
  usuario individual.
- El precio mostrado al receptor debe ser el precio vigente de Marketplace en
  el momento de su compra.
- El precio historico pagado por el emisor no gobierna la compra del receptor.
- El receptor debe poder ver metadatos minimos antes de comprar: empresa
  emisora, descripcion, tipo de activo y lista de productos requeridos.
- Debe existir accion `Revalidar compras` desde el flujo de carrito/checkout y
  desde la bandeja de recepcion bloqueada.
- Debe existir ayuda contextual Marketplace compacta dentro del flujo de
  Envios y Transferencias cuando el activo contenga productos requeridos.
- Esta ayuda no es una ayuda general de Marketplace ni una pantalla comercial.
- Debe explicar de forma breve que el envio contiene productos Marketplace
  obligatorios y que no se podra importar ni usar hasta adquirir todos.
- Debe mostrar lista de productos requeridos, estado adquirido/pendiente,
  precio vigente estimado, link/boton de compra y accion `Revalidar compras`.
- Debe mantenerse como panel compacto y accionable, sin manual extenso ni
  textos largos que rompan la operativa.

Campos conceptuales:

- Producto requerido.
- Codigo comercial o slug.
- Tipo: siempre obligatorio.
- Precio vigente al comprar/importar.
- Estado del receptor: adquirido/no adquirido.
- Link de compra.
- Motivo del bloqueo.

Al revisar un envio bloqueado, el receptor debe ver:

- Lista de productos requeridos.
- Link directo de compra de cada producto.
- Resumen de precio total vigente/estimado para compra.
- Accion para volver a verificar adquisiciones.

## 9. Bandeja de entrada/salida

Vista inicial del modulo:

- Listado de entradas y salidas disponibles.
- Filtro `Todos`, `Entrada`, `Salida`.
- Filtro por estado.
- Filtro de fecha inicio y fecha fin.
- Rango por defecto: desde un mes atras hasta la fecha actual.
- Busqueda omni por empresa, alias de empresa, descripcion y activo.
- Orden por fecha/hora de recepcion.
- Semaforo de estado por envio.
- Selector unificado de estado con colores diferenciados y lectura por rol.
- Acciones dependientes del estado.
- Alias de empresa como etiqueta visual preferente cuando exista, conservando
  nombre legal para busqueda, auditoria y detalle.
- Historico permanente; los filtros solo acotan la muestra visible.

Estados iniciales propuestos:

- `borrador_preflight`
- `enviado`
- `recepcionado`
- `bloqueado_marketplace`
- `listo_para_importar`
- `importado`
- `rechazado`
- `cancelado`
- `expirado`
- `fallo_importacion`

Acciones por estado:

- Pendiente Marketplace: `Ver requisitos`, `Ir a comprar`, `Revalidar`.
- Disponible: `Importar`.
- Importado: `Ver importacion`.
- Enviado: `Ver estado`, `Cancelar` si aun no fue importado.
- Rechazado, cancelado o expirado: solo lectura.

## 10. Semaforo de recepcion en header

Visible solo para `Administrador` y `Superadministrador`.

Debe mostrarse siempre para los roles autorizados, incluso cuando no existan
envios nuevos.

Formato funcional esperado:

- Etiqueta compacta de comunicacion/transferencias.
- Conteo total visible.
- Conteo de nuevos visible.
- Ejemplo orientativo: `Comunicacion: 14` y `Nuevos: 2`.
- Indicador visual simple, tipo circulo/parpadeo o equivalente sobrio.

Al pulsar, debe navegar directamente a la bandeja de entrada del modulo.

Si el usuario esta operando y recibe envios, el semaforo debe actualizarse sin
recargar toda la aplicacion.

Reglas de actualizacion:

- Polling ligero cada 30 o 60 segundos.
- Sin panel desplegable complejo en primera implementacion.
- Sin resumen avanzado de estados en header.
- La alerta debe ser solo visual; no debe interrumpir la operacion del usuario.
- WebSocket/SSE queda como mejora posterior si el volumen lo justifica.

## 11. Recepcion e importacion

La empresa receptora puede recibir sin limite de emisores siempre que tenga
licencia habilitada. `EXPRESS`, `TESTER`, `ACADEMIC` y `TRAINING` quedan
bloqueadas tambien para recibir e importar.

Reglas:

- La recepcion aparece aunque existan productos Marketplace pendientes.
- No se puede importar si faltan productos obligatorios.
- Al adquirirlos, el receptor puede revalidar el envio.
- La importacion debe ser idempotente por empresa receptora.
- Doble clic, retry de red o refresco no pueden duplicar proyectos/bases.
- El receptor puede rechazar el envio con motivo escrito.
- El emisor debe ser informado del rechazo y del motivo.
- La importacion siempre crea una copia nueva del Proyecto o Base de Trabajo.
- No existe fusion con Proyecto/Base existente en este flujo.
- El activo importado debe conservar referencia visible y auditable al envio,
  empresa emisora y activo origen.
- Debe existir trazabilidad de estado: pendiente, bloqueado por Marketplace,
  rechazado, listo para importar, importado y resultado de importacion.
- Una vez importado correctamente, no debe poder importarse de nuevo. El
  backend devuelve resultado idempotente y conserva trazabilidad, pero no
  reejecuta la creacion del activo.
- Tras importacion completada debe sanearse el payload pesado del envio para
  ahorrar espacio, manteniendo metadatos minimos: contrato, hash, envio,
  empresa emisora, empresa receptora, activo origen, activo importado, resultado
  de importacion y auditoria.
- Tras importar, el activo queda disponible solo para administradores y
  superadministradores de la empresa receptora, salvo que despues se otorguen
  permisos dentro de las herramientas normales de la aplicacion.

## 12. Snapshot inmutable

Cada envio debe conservar una copia logica del activo al momento de enviar.

El snapshot evita que cambios posteriores del emisor alteren el contenido
recibido. Tambien permite auditoria y reproduccion del import.

Debe contener version de contrato, tipo de activo, metadatos, dependencias
Marketplace, descripcion y payload exportable.

El snapshot completo vive hasta que la importacion termina correctamente. A
partir de ese momento, el sistema debe sustituir el payload pesado por una
metadata saneada para trazabilidad, manteniendo hash y contrato como prueba de
contenido importado.

Contrato de snapshot por tipo:

- Proyecto: datos del proyecto, EDT, presupuestos y la Base de Proyecto/APUs
  necesarios para que el presupuesto conserve integridad. Quedan fuera
  cronogramas, Gantt, planificacion temporal, documentacion adjunta y uploads.
- El snapshot de Proyecto no incorpora toda la Base de Proyecto. Debe exportar
  solo el grafo transitivo que nace en los APUs usados por las lineas
  operativas del presupuesto: APUs directos, APUs hijos anidados, recursos
  usados por esos APUs, unidades, categorias y subcategorias necesarias para
  preservar el alineamiento tecnico.
- Categorias y subcategorias viajan sincronizadas con recursos y APUs. No deben
  quedar recursos importados sin su subcategoria ni APUs con categoria cruzada
  hacia la empresa emisora.
- Base de Trabajo: contenido completo de la base, sin documentacion adjunta ni
  uploads externos.
- Referencia de origen: empresa emisora, activo origen, envio y version de
  snapshot para trazabilidad posterior.

## 13. Auditoria

Cada envio debe tener timeline visible y auditoria interna:

- Creado por.
- Enviado por.
- Recepcionado por sistema.
- Bloqueado por Marketplace.
- Productos adquiridos posteriormente.
- Importado por.
- Resultado de importacion.
- Referencia creada en empresa receptora.
- Rechazado por.
- Motivo de rechazo.
- Cancelado por.
- Expirado por regla automatica.

Todos los estados, eventos y etiquetas visibles del historico deben mostrarse
en castellano. Queda prohibido exponer codigos tecnicos internos como
`transfer_shipment_cancelled` o etiquetas generadas desde nombres de evento en
ingles.

## 14. Caducidad, rechazo y cancelacion

Decision cerrada:

- Caducidad del envio: 60 dias.

Reglas:

- El receptor puede rechazar un envio.
- El rechazo requiere motivo escrito y notificacion al emisor.
- El emisor puede cancelar solo mientras el envio no haya sido importado.
- Despues de importar no debe existir cancelacion funcional, solo trazabilidad.
- Los envios expirados quedan en modo lectura.
- Si un envio expira, se notifica por los canales normales del sistema.
- Un envio expirado no puede reenviarse ni reactivarse desde el historico.
- Para volver a compartir el mismo activo debe crearse un envio nuevo desde el
  flujo normal, si las reglas de destinatario/licencia lo permiten.
- El historico debe indicar si el envio fue importado.
- La trazabilidad del envio, incluyendo importacion, expiracion, rechazo,
  cancelacion y origen, no debe perderse nunca.

## 15. Modelo conceptual de datos

Entidades conceptuales propuestas:

- `transfer_company_public_code`: codigo publico de empresa y estado.
- `transfer_admin_public_code`: tabla legacy de compatibilidad para codigos
  historicos por administrador.
- `transfer_allowed_company_recipient`: empresas destino fijas/adicionales
  asociadas.
- `transfer_extra_recipient_pack`: compras `Conecta` de slots adicionales.
- `transfer_shipment`: cabecera del envio, empresas, usuarios, estado y
  descripcion.
- `transfer_shipment_item`: activo incluido, tipo y referencia de snapshot.
- `transfer_marketplace_requirement`: productos requeridos y estado de compra.
- `transfer_audit_event`: timeline tecnico y visible.
- `transfer_import_result`: resultado idempotente de importacion.
- `transfer_import_reference`: referencia entre envio, activo origen y copia
  creada en la empresa receptora.
- `transfer_code_attempt_guard`: intentos fallidos, pausas y baneos temporales
  por empresa emisora.

Las tablas definitivas deben disenar indices por empresa emisora/receptora,
usuario actor, estado, fecha de recepcion y codigo publico normalizado.

## 16. Relacion con Conecta

`Conecta` queda redefinido en este plan como producto comercial exclusivo de
ampliacion de destinatarios para `Envios y Transferencias`.

Reglas:

- No representa colaboracion, conexion usuario-usuario ni permisos implicitos.
- No concede acceso a Proyectos, EDT, Presupuestos, Cronogramas ni archivos.
- Solo amplia el numero de empresas destino que la empresa emisora puede
  asociar para envios.
- Puede reutilizar infraestructura de Marketplace/derechos SaaS, pero su
  semantica funcional queda limitada a esta seccion.

## 16.1 Optimizaciones obligatorias de implementacion

Estas mejoras quedan incorporadas como criterios de calidad del plan. No
amplian el alcance funcional visible, pero reducen riesgo operativo y facilitan
mantenimiento enterprise:

- El preflight debe soportar modo `dry-run`: informa exportabilidad, contenido,
  bloqueos, dependencias Marketplace y advertencias sin crear envio.
- Todo snapshot debe guardar `contract_version` y hash/huella del payload
  exportable para auditoria, idempotencia y diagnostico.
- La exportacion hacia transferencia debe vivir en un adaptador propio de
  transferencia. Puede reutilizar rutinas de venta/Marketplace, pero no debe
  acoplar envio privado con publicacion o venta.
- La bandeja debe exponer timeline visible resumido por envio: creado,
  enviado, recepcionado, bloqueado, importado, rechazado, cancelado o expirado.
- Deben existir metricas minimas: enviados, recibidos, nuevos, bloqueados por
  Marketplace, listos para importar, importados, rechazados, cancelados,
  expirados y fallos de importacion.
- El estado `fallo_importacion` debe permitir reintento controlado, auditado e
  idempotente, sin duplicar activos.
- La implementacion debe incluir prueba end-to-end con empresa mockup:
  emisor/receptor, con y sin dependencias Marketplace.
- Debe existir guarda anti-regresion que asegure que `EXPRESS`, `TESTER`,
  `ACADEMIC` y `TRAINING` no pueden enviar, recibir ni importar.
- La UI debe cerrar con checklist visual comparativo contra `Proyectos` y
  `Datos de Proyecto`, especialmente densidad, toolbar, modal tecnico y lista
  compacta.

## 17. Roadmap por TASK

### TASK-1916 - Plan funcional fisico

Estado: cerrada en documentacion.

Objetivo: dejar documentado el alcance, riesgos, modelo conceptual y roadmap.

Verificacion:

- Plan fisico creado.
- TASK documental creada.
- CHANGELOG/HANDOFF/WORK_MODE_STATE actualizados.
- JSON documental validado.

### TASK-1917 - Contrato tecnico y modelo de dominio

Objetivo: definir contratos backend/frontend sin implementar UI final.

Aceptacion:

- Contrato de estados aprobado.
- Modelo de permisos y licencia documentado.
- Contrato de snapshot e import idempotente definido.
- `contract_version` y hash/huella de snapshot definidos.
- Adaptador de transferencia separado de venta/publicacion Marketplace
  definido.

Verificacion:

- Tests de contrato si se crea codigo.
- Sin cambios destructivos en DB.

### TASK-1918 - Codigos publicos y destinatarios

Objetivo: implementar codigo publico `XXX - XXX`, destinatarios fijos y
adicionales.

Aceptacion:

- Solo administradores/superadministradores gestionan destinatarios.
- Codigo publico generado para empresas y saneado para empresas existentes.
- El codigo resuelve empresa, no destinatario usuario-usuario.
- Maximo 3 empresas destino fijas por empresa.
- Adicionales vinculados a vigencia de compra `Conecta`.
- Compras `Conecta` acumulables.
- Anti-enumeracion: 3 fallos -> pausa 5 minutos; 12 fallos/24h -> baneo 7
  dias por empresa emisora.
- `EXPRESS`, `TESTER`, `ACADEMIC` y `TRAINING` bloqueados.

Verificacion:

- pytest focal backend.
- smoke de frontera API clasica.

### TASK-1919 - Preflight y snapshot de envio

Objetivo: crear preflight y snapshot inmutable para Base/Proyecto.

Aceptacion:

- Preflight valida permisos, plan, destinatario y activo.
- Preflight soporta modo `dry-run` sin crear envio.
- Proyectos solo aptos/completos/exportables.
- Proyecto limitado a datos del proyecto, EDT y presupuestos.
- Base de Trabajo completa.
- Documentacion adjunta/uploads fuera del envio.
- Cronogramas/Gantt/planificacion fuera del envio.
- Snapshot conserva contrato versionado.
- Snapshot conserva hash/huella de payload exportable.
- Exportacion usa adaptador de transferencia, sin acoplamiento directo a venta.
- Descripcion obligatoria, precargada con el nombre del activo.
- Envio uno a uno y un unico activo por envio.
- Cancelacion permitida solo antes de importacion.
- Doble confirmacion si hay dependencias Marketplace.

Verificacion:

- pytest focal de preflight.
- py_compile backend.

### TASK-1920 - Resolver dependencias Marketplace

Objetivo: detectar productos Marketplace en activo enviado y generar requisitos.

Aceptacion:

- Requisitos estructurados por producto.
- Proyectos completos comprados u originados en Marketplace generan advertencia
  al emisor y obligacion de compra al receptor si no los posee.
- Todos los productos detectados son obligatorios.
- Sin compra completa del conjunto requerido no hay importacion ni uso.
- Precio vigente para el receptor al momento de compra.
- Compra por empresa receptora, no por usuario.
- Accion `Revalidar compras` disponible desde carrito/checkout y bandeja.
- Estado adquirido/no adquirido por receptor.
- Link y precio estimado disponibles.

Verificacion:

- pytest focal Marketplace.
- Sin romper flujos existentes de compra/venta.

### TASK-1921 - Bandeja API entrada/salida

Objetivo: exponer bandeja con filtros, busqueda y estados.

Aceptacion:

- Filtro entrada/salida/todos.
- Filtro por estado.
- Filtro de fecha inicio y fecha fin.
- Rango por defecto: desde un mes atras hasta la fecha actual.
- Busqueda omni por empresa legal, alias, descripcion y activo.
- Orden por fecha/hora recepcion.
- Selector unificado de estados con colores diferenciados.
- Alias de empresa como etiqueta visual preferente, sin perder nombre legal.
- Historico permanente, no purgado por filtros.
- Acciones coherentes por estado.
- Estado `fallo_importacion` representado como estado tecnico recuperable y
  auditable.
- Timeline visible resumido disponible para entrada/salida.
- Metricas minimas disponibles para bandeja y semaforo.

Verificacion:

- pytest endpoints.
- smoke anti imports directos `axiosConfig` fuera de `frontend/src/api` si hay
  frontend.

### TASK-1922 - Importacion idempotente

Objetivo: importar Base/Proyecto recibido una sola vez por empresa receptora.

Aceptacion:

- Retry no duplica.
- Bloqueo Marketplace impide import.
- Importacion crea copia nueva, sin fusion.
- Proyecto/Base importado conserva referencia al envio y origen.
- Rechazo requiere motivo y notifica al emisor.
- Trazabilidad de pendiente/importado/resultado.
- Resultado de importacion queda trazable.
- Reintento controlado solo para `fallo_importacion`, auditado e idempotente.
- Payload pesado saneado tras importacion completada, conservando metadata,
  hash, contrato, origen, destino y referencia importada.
- El motor de importacion/exportacion queda planteado como rutina universal
  regida por contexto, no como logica exclusiva de esta pantalla.

Verificacion:

- pytest focal de import.
- Pruebas con doble envio/retry.

### TASK-1923 - Semaforo header

Objetivo: mostrar recepciones pendientes a Administrador/Superadministrador.

Aceptacion:

- Visible solo para roles autorizados.
- Visible siempre para esos roles, con o sin nuevos envios.
- Muestra conteo total y conteo de nuevos, por ejemplo `Comunicacion: 14` y
  `Nuevos: 2`.
- Usa indicador visual simple tipo circulo/parpadeo sobrio.
- Click abre bandeja de entrada.
- Actualizacion ligera cada 30 o 60 segundos mientras se opera.
- Sin desplegable complejo ni resumen avanzado en header.

Verificacion:

- npm run build.
- smoke no contaminacion BIM.
- smoke de header/roles.

### TASK-1924 - Producto Marketplace Conecta para destinatarios adicionales

Objetivo: adecuar `Conecta` como producto Marketplace de ampliacion para
destinatarios adicionales de Envios y Transferencias.

Aceptacion:

- Producto `Conecta` con precio inicial `24,99 USD`.
- Cada compra activa 3 empresas destino adicionales.
- Producto exclusivo de `Envios y Transferencias`.
- Las compras son acumulables, pero independientes.
- Vigencia de 30 dias desde fecha/hora exacta de adquisicion.
- Destinatarios adicionales asociados a la compra concreta.
- Expiracion inactiva slots adicionales.
- Una nueva compra exige nuevo proceso de asociacion; no reactiva
  automaticamente relaciones expiradas.
- Historico de envios se conserva.

Verificacion:

- pytest focal checkout/licencias.
- Prueba de expiracion.

### TASK-1925 - UI completa de modulo

Objetivo: implementar vista de bandeja, nuevo envio, requisitos y timeline.

Aceptacion:

- UI en `Otros Servicios > Envios y Transferencias`.
- Look & feel alineado con la seccion `Proyectos` como referencia visual
  principal.
- Se reutiliza tambien funcionamiento de componentes existentes de Proyectos
  cuando aplique, no solo su aspecto.
- Primera pantalla operativa, no landing comercial ni placeholder explicativo.
- Bandeja como lista compacta con informacion necesaria para operar.
- Toolbar con `Nuevo envio` y `Refrescar`.
- Filtros y busqueda operativos.
- Estados claros y acciones por estado.
- Selector visual de estados con colores diferenciados.
- Filtro por estado y rango de fechas.
- Busqueda omni con alias de empresa como etiqueta visual preferente.
- Preflight en modal tecnico coherente con importacion/exportacion de Proyectos.
- Ayuda contextual Marketplace compacta para bloqueos por productos
  obligatorios, con lista, estado, precio vigente, compra y revalidacion.
- No se introduce lenguaje visual SaaS de Administracion Global en esta vista.

Verificacion:

- npm run build.
- smoke anti-BIM.
- smoke clasico de fronteras API.
- QA visual comparativa contra `Proyectos`/`Datos de Proyecto`.
- Checklist visual documentado antes de cerrar la TASK.

### TASK-1926 - Baseline enterprise

Objetivo: cerrar implementacion completa con validacion transversal.

Aceptacion:

- Backend/frontend integrados.
- E2E con empresa mockup: emisor/receptor, con y sin dependencias Marketplace.
- Guarda anti-regresion de licencias bloqueadas para enviar, recibir e
  importar.
- Metricas minimas verificadas.
- Sin imports directos de `axiosConfig` fuera de `frontend/src/api`.
- Sin `console.log` productivos fuera de API.
- Sin dependencia BIM.

Verificacion:

- `tools/ai_tools/validate_enterprise_baseline.py --include-frontend`.

### TASK-1928 - Control de adecuacion visual Proyectos

Objetivo: documentar la brecha visual detectada tras la primera implementacion
funcional y fijar criterios concretos de homologacion con `Proyectos`.

Aceptacion:

- Adenda visual fisica incorporada al plan.
- Diagnostico separado de cambios funcionales.
- TASK de implementacion posterior creada con alcance frontend acotado.
- Sin modificar codigo productivo.

Verificacion:

- Revision documental.
- Sin cambios backend/frontend/runtime.

### TASK-1929 - Implementacion visual Proyectos en Transferencias

Objetivo: adecuar `frontend/src/pages/EnviosTransferencias.jsx` para que su
toolbar, filtros, KPIs, listado, acciones de fila y modales adopten el lenguaje
visual de `Proyectos`.

Aceptacion:

- Toolbar superior con botones soft tipo `Proyectos`.
- `Todos / Entrada / Salida` resuelto con `ProjectSegmentedSwitch`.
- Busqueda, estado y fechas integrados como filtros compactos.
- KPIs superiores reducidos a lectura compacta.
- Listado alineado con el portafolio de `Proyectos`.
- Acciones de fila como microbotones soft.
- Modales tecnicos con secciones compactas y acciones coherentes.
- Sin cambios backend, DB, API, auth, tenant, licencias ni Marketplace.
- Sin UX BIM ni dependencia hacia BIM.

Verificacion:

- `npm run build`.
- `node frontend/scripts/smoke-classic-transferencias-ui.mjs`.
- `node frontend/scripts/smoke-classic-no-bim-contamination.mjs`.
- `tools/ai_tools/validate_enterprise_baseline.py --include-frontend`.
- Checklist visual manual contra `Proyectos` y `Datos de Proyecto`.

### TASK-1930 - Alta funcional de empresas para comunicarse

Objetivo: exponer en frontend clasico la estructura funcional ya disponible en
backend para gestionar empresas destino de `Envios y Transferencias`.

Alcance:

- Cliente de dominio `frontend/src/api/transferencias.js`.
- Modal de `Nuevo envio` en `frontend/src/pages/EnviosTransferencias.jsx`.
- Smoke focal de transferencias.
- Documentacion operativa.

Aceptacion:

- El usuario administrador/superadministrador ve el codigo publico de la
  empresa operativa.
- El modal muestra listado de empresas habilitadas para comunicarse.
- El modal muestra uso de destinatarios fijos y adicionales activos.
- Existe entrada para codigo de conexion `XXX - XXX`.
- La entrada valida el codigo contra backend sin exponer usuario propietario.
- La UI muestra empresa detectada con alias/nombre segun contrato.
- La asociacion exige confirmacion explicita.
- Tras confirmar, la empresa queda en el listado y seleccionada como
  destinataria del envio.
- No se modifica backend, DB, auth, tenant, licencias, Marketplace ni BIM.
- El pulido visual fino queda fuera de esta TASK y podra tratarse en una TASK
  posterior.

Verificacion:

- `npm run build`.
- `node frontend/scripts/smoke-classic-transferencias-ui.mjs`.
- `node frontend/scripts/smoke-classic-no-bim-contamination.mjs`.
- `tools/ai_tools/validate_enterprise_baseline.py --include-frontend`.

### TASK-1931 - Semaforizacion compacta y gestion visible de empresas

Objetivo: ajustar la pantalla inicial para que la gestion de empresas para
comunicarse sea una accion visible antes de `Nuevo envio`, y para que los
semaforos del modulo se integren en la barra principal siguiendo la referencia
compacta de `Proyectos > Cronogramas > Gantt`.

Alcance:

- Boton `Empresas` en la cabecera, antes de `Nuevo envio`.
- Modal propio de gestion de empresas.
- Listados separados de empresas fijas incluidas en plan y empresas
  adicionales `Conecta`.
- Expiracion visible para adicionales.
- Contadores usados/disponibles para fijas y Conecta.
- Semaforos compactos en la barra principal.
- Compactacion de combobox/selectores del modulo.
- Contrato backend aditivo para exponer capacidad Conecta.

Aceptacion:

- La gestion de empresas no queda oculta dentro del modal de envio.
- El usuario distingue fijas de adicionales y ve expiraciones.
- La barra principal concentra filtros y semaforos compactos.
- La fila grande de KPIs no duplica la informacion.
- El modal `Nuevo envio` queda enfocado en enviar.
- Sin cambios destructivos de DB ni permisos.
- Sin UX BIM ni dependencia hacia BIM.

Verificacion:

- `py_compile` backend focal.
- `pytest` focal de destinatarios.
- `npm run build`.
- `node frontend/scripts/smoke-classic-transferencias-ui.mjs`.
- `node frontend/scripts/smoke-classic-no-bim-contamination.mjs`.
- `tools/ai_tools/validate_enterprise_baseline.py --include-frontend`.

### TASK-1932 - Normalizacion de combobox Transferencias

Objetivo: corregir los combobox de `Envios y Transferencias` para que el
trigger visible siga el patron de `Proyectos > Datos Proyecto > Tipo de
Proyecto`: campo blanco, borde fino, radio amplio, texto centrado
verticalmente, flecha alineada y altura estable.

Alcance:

- Barra principal de filtros.
- Modales de `Nuevo envio` y gestion de empresas.
- `SearchableSelect` usado desde `EnviosTransferencias`.
- Smoke focal de UI.

Aceptacion:

- Los triggers no pierden `flex`, alineacion vertical, padding ni
  `justify-between`.
- No hay texto/flecha flotante ni solapada con labels.
- No se usan `<select>` nativos.
- Sin cambios backend, DB, auth, tenant, Marketplace ni BIM.

Verificacion:

- `npm run build`.
- `node frontend/scripts/smoke-classic-transferencias-ui.mjs`.
- `node frontend/scripts/smoke-classic-no-bim-contamination.mjs`.
- `tools/ai_tools/validate_enterprise_baseline.py --include-frontend`.

### TASK-1933 - Codigo publico de empresa Transferencias

Objetivo: corregir el codigo `XXX - XXX` para que pertenezca a la empresa
operativa y no al usuario administrador que tiene la sesion abierta.

Alcance:

- Modelo backend clasico de codigo publico por empresa.
- Migracion aditiva sin borrar la tabla legacy de codigos por usuario.
- Servicio de generacion, saneamiento y resolucion por empresa.
- Endpoints de transferencias usando empresa operativa validada.
- UI rotulada como `Codigo publico de empresa`.
- Tests focales de superadministrador operando dos empresas distintas.

Aceptacion:

- `Administradores Generales` y `Santiago Bermeo` obtienen codigos distintos
  aunque los consulte el mismo superadministrador.
- El codigo mostrado corresponde a la empresa seleccionada en el contexto
  operativo.
- Un administrador no superadministrador no puede pedir ni operar transferencias
  para otra empresa.
- La resolucion de destinatario devuelve empresa, no usuario.
- No hay cambios destructivos de DB.
- Sin UX BIM ni dependencia hacia BIM.

Verificacion:

- `py_compile` backend focal.
- `pytest` focal de destinatarios.
- `npm run build`.
- `node frontend/scripts/smoke-classic-transferencias-ui.mjs`.
- `node frontend/scripts/smoke-classic-no-bim-contamination.mjs`.
- `tools/ai_tools/validate_enterprise_baseline.py --include-frontend`.

### TASK-1934 - Cierre multitenant Superadmin Transferencias

Objetivo: cerrar la fuga de contexto operativo detectada cuando un
Superadministrador cambia de empresa y vuelve a la bandeja de transferencias.

Aceptacion:

- La pagina debe usar `selectedEmpresa` de `AuthContext` como empresa
  operativa.
- El cliente API de transferencias debe aceptar `empresaId` explicito en todas
  las rutas sensibles.
- Al cambiar empresa se deben limpiar bandeja, destinatarios, modales y acciones
  pendientes para evitar operar con contexto anterior.
- El semaforo del header debe consultar la empresa seleccionada.
- El mismo envio debe aparecer como `salida` para la empresa emisora y como
  `entrada` para la empresa receptora, aunque el usuario sea el mismo
  Superadministrador.

Verificacion:

- pytest focal de bandeja con caso emisor/receptor y Superadministrador.
- smoke frontend de transferencias.
- build frontend.
- baseline enterprise con frontend.

## 18. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigacion |
|---|---:|---|
| Duplicar importaciones por retry | Alto | Idempotencia por `shipment_id` + empresa receptora |
| Exponer IDs internos por codigo publico | Alto | Resolver codigo en backend y devolver solo datos minimos |
| Enumeracion de codigos publicos | Alto | Pausa tras 3 fallos, baneo 7 dias tras 12 fallos/24h y auditoria |
| Saltarse compra Marketplace | Alto | Bloqueo server-side antes de importar |
| Compra parcial de requisitos Marketplace | Alto | Bloqueo hasta compra completa de todos los productos requeridos |
| Usar precio historico del emisor | Medio | Precio vigente de Marketplace al momento de compra del receptor |
| Enviar Proyectos incompletos | Alto | Preflight exige estado apto/completo/exportable |
| Fusion accidental con datos existentes | Alto | Importacion siempre como copia nueva idempotente |
| Ambiguedad de estados compartidos | Medio | Selector unificado con color, lectura por rol y acciones acotadas |
| Arrastrar cronogramas o documentos por accidente | Medio | Contrato de snapshot por tipo excluye cronogramas, Gantt, documentos y uploads |
| Confundir destinatario usuario con empresa | Alto | Modelar destinatario como empresa; el codigo solo resuelve la empresa |
| Mezclar Conecta operativo con Transferencias | Medio | Adecuar `Conecta` como producto comercial de ampliacion sin conceder permisos implicitos |
| Romper tenants | Alto | Validaciones de empresa emisora/receptora en cada endpoint |
| UX demasiado compleja | Medio | Bandeja simple, estados claros y preflight guiado |
| Romper coherencia visual con Proyectos | Medio | Tomar `Proyectos` y `Datos de Proyecto` como referencia obligatoria de UI |
| Adecuacion visual parcial que mezcle estilos | Medio | Ejecutar TASK-1929 como slice visual completo de la pantalla, no como retoques aislados |
| Paquetes expirados con envios historicos | Medio | Expirar solo permisos de nuevos envios, no historico |

## 19. Estado de cierre del plan

Plan funcional cerrado para iniciar implementacion por TASKs controladas.

No quedan decisiones funcionales abiertas dentro del alcance actual. Cualquier
nueva variacion comercial, visual o tecnica debe abrir TASK nueva antes de
modificar implementacion.

Decisiones finales de cierre:

- Baneo por abuso de codigos: 12 intentos fallidos en 24 horas por empresa
  emisora activa baneo de 7 dias.
- Producto comercial: se muestra como `Conecta`, con contexto/subtitulo
  `Envios y Transferencias` cuando haga falta evitar ambiguedad.
- Sin reabrir Docker, Coolify, staging, produccion ni BIM.
- Sin modificar alcance de contenido transferible ya cerrado.

## 20. Criterios de cierre futuro

La implementacion futura solo podra darse por cerrada si:

- No existe acceso para roles inferiores a Administrador.
- `EXPRESS`, `TESTER`, `ACADEMIC` y `TRAINING` quedan bloqueados en backend.
- Los 3 destinatarios fijos por empresa son inmutables durante el plan activo y
  se mantienen al renovar.
- Los destinatarios adicionales expiran a los 30 dias desde la compra `Conecta`.
- Las compras `Conecta` son acumulables.
- Cada compra `Conecta` es independiente y gobierna sus destinatarios
  asociados.
- `Conecta` se muestra como nombre comercial y `Envios y Transferencias` como
  contexto/subtitulo cuando haga falta claridad.
- El alta de destinatario por codigo aplica pausa tras 3 fallos y baneo de 7
  dias tras 12 fallos en 24 horas por empresa emisora.
- El envio es uno a uno y de un solo activo.
- Proyecto transfiere solo hasta presupuesto, pero incluye obligatoriamente el
  subconjunto de Base de Proyecto/APUs que sostiene ese presupuesto.
- El subconjunto de Base de Proyecto se calcula por grafo transitivo desde los
  APUs presupuestados: incluye APUs anidados, recursos, unidades, categorias y
  subcategorias necesarias, y excluye APUs/recursos no usados.
- Base de Trabajo se transfiere completa.
- No se transfieren cronogramas, Gantt, documentacion ni uploads.
- Solo se envian Proyectos aptos/completos/exportables.
- La descripcion es obligatoria.
- El emisor solo puede cancelar antes de importacion.
- Los envios con cualquier Marketplace faltante no se importan ni usan.
- La compra Marketplace requerida debe ser completa y a precio vigente para la
  empresa receptora.
- La importacion es idempotente.
- La importacion crea copia nueva y conserva referencia de origen.
- El rechazo exige motivo y notifica al emisor.
- El envio caduca a los 60 dias.
- Si un envio expira, solo se notifica por canales normales; no se permite
  reenviar ni reactivar desde el historico.
- El historico indica si fue importado y conserva siempre la trazabilidad.
- La bandeja muestra selector/filtro por estado, colores diferenciados,
  busqueda omni y rango de fechas por defecto de un mes atras a hoy.
- El alias de empresa sustituye visualmente al nombre legal cuando existe, sin
  perder el nombre legal para busqueda, auditoria y detalle.
- El historico de envios/recepciones se conserva siempre.
- El estado `fallo_importacion` existe como contingencia tecnica auditable.
- El semaforo del header respeta roles y navega a entrada.
- La capa BIM no queda contaminada.
- El baseline enterprise clasico sigue pasando.
