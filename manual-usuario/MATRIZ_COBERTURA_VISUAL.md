# Matriz de cobertura visual del manual de empresa

Fecha de apertura: 29 de julio de 2026  
Empresa de demostración: Santiago Bermeo  
Proyecto de demostración: `SantiagoBermeo-2026-001`, revisión 0  

Esta matriz controla las evidencias visuales del manual. No sustituye la cobertura textual. Una pantalla puede estar explicada y seguir pendiente de captura.

## Condiciones para aceptar una captura

Una imagen solo pasa a **Válida** cuando cumple todas estas condiciones:

1. procede de una ruta real de la interfaz de empresa;
2. muestra el contenido operativo esperado y no solamente el armazón de la página;
3. no contiene «Cargando», esqueletos, indicadores de progreso ni peticiones pendientes que condicionen el contenido principal;
4. no ha sido redirigida al acceso ni contiene mensajes de sesión expirada;
5. utiliza 1920 × 1080 como mínimo y no muestra el aviso de resolución;
6. no revela contraseña, token, identificadores de sesión ni datos personales innecesarios;
7. fue inspeccionada visualmente después de generarse;
8. su pie en el manual explica qué debe mirar el lector y para qué sirve;
9. si una ventana modifica datos, se abre con información de demostración y se cierra sin confirmar, salvo que el recorrido exija guardar;
10. la bitácora recoge cualquier error o comportamiento inesperado observado durante su obtención.

Estados: **Válida**, **Pendiente**, **Bloqueada**, **Repetir** o **No necesaria**.

## Acceso y orientación

| Evidencia | Contenido que debe demostrar | Estado | Archivo / observación |
|---|---|---|---|
| Inicio de sesión | Correo, recordar credenciales, recuperación, creación de cuenta y Continuar | Válida | `inicio-sesion-completa.png` |
| Crear cuenta | Bloques completos del alta y acción Crear mi cuenta ahora | Válida | `crear-cuenta.png` |
| Recuperar contraseña | Correo, Enviar enlace y regreso al acceso | Válida | `recuperar-contrasena.png` |
| Inicio de empresa | Santiago Bermeo, licencia, usuario y tres módulos principales | Válida | `inicio-empresa.png` |
| Cabecera y contexto | Empresa, licencia, almacenamiento, usuario, avisos, ajustes y salida | Pendiente | Puede resolverse con recorte anotado de inicio |
| Cambio o selección de empresa | Selección cuando un correo pertenece a varias empresas | Pendiente | Requiere cuenta de demostración con más de una empresa; no fabricar datos |

## Portafolio y administración del proyecto

| Evidencia | Contenido que debe demostrar | Estado | Validación positiva |
|---|---|---|---|
| Portafolio en lista | Nombre visible Proyecto Prueba Compartir 1, identidad canónica `#SantiagoBermeo-2026-001`, estado, presupuesto y acciones | Válida | `proyectos-portafolio-cargado.png`; el manual explica la diferencia entre nombre visible e identidad canónica |
| Portafolio Kanban | Columnas por estado y tarjeta del proyecto | Válida | `proyectos-kanban.png`; cinco fases y tres tarjetas reales cargadas |
| Filtros | Estado, revisión, fechas u opciones reales y aplicación del filtro | Válida | `proyectos-filtros.png`; panel abierto sobre la tabla cargada |
| Calendario | Vista mensual, leyenda, hitos y anotaciones | Parcial | `proyectos-calendario.png`; mes, leyenda y bandeja cargados, pero la empresa de prueba no contiene eventos en agosto de 2026 |
| Nuevo proyecto | Todos los campos, ayuda previa y consecuencias de Crear proyecto | Válida | `proyectos-nuevo-modal.png`; ventana completa sin guardar |
| Importación SOCE/SERCOP | Selección, análisis previo, progreso y resultado esperado | Fuera del alcance | El código la limita a superadministrador; no debe aparecer en el manual de empresa |
| Diagnóstico SOCE/SERCOP | Estado técnico y acciones disponibles | Fuera del alcance | Depende del importador exclusivo del superadministrador |
| Revisiones | Lista, estados, entrada a aprobada, nueva revisión y eliminación | Parcial | `proyectos-revisiones.png`; REV-000 real visible, faltan estados con varias revisiones y sus confirmaciones |
| Papelera | Retención, restauración y eliminación definitiva | Válida | `proyectos-papelera-modal.png`; estado vacío terminado y retención de siete días |
| Gestión de personal | Proyectos, equipo y asignaciones | Válida | `gestor-proyecto.png`; `Equipos de Trabajo` sin `Cargando Datos` |

## Ficha y estructura del proyecto completo

Todas estas capturas deben abrir `/proyectos?project_id=7&tab=…` y conservar visible el nombre o código del proyecto.

| Pestaña / ventana | Contenido que debe demostrar | Estado | Validación positiva |
|---|---|---|---|
| Datos del proyecto | Identificación, ubicación, alcance, fechas y edición | Válida | `proyecto-datos.png`; ficha, mapa, documentos e imagen terminados |
| Stakeholders | Personas, responsabilidades, búsqueda, alta y edición | Válida | `proyecto-stakeholders.png`; directorio terminado con identidad y contacto anonimizados |
| EDO/OBS | Árbol organizativo, creación y relación con responsabilidades | Válida | `proyecto-edo.png`; estado vacío real con acción para el primer hito |
| EDT/WBS | Diez ramas principales y rama 1.5 Mamposterías y enlucidos | Válida | `proyecto-edt.png`; árbol gráfico con cuentas, valores e indicadores |
| Presupuesto integrado | Presupuesto Base Rev 0 y sus importes | Válida | `proyecto-presupuesto.png`; 187 APUs, partidas y resumen económico |
| Cronogramas | Cronograma 1, 187 actividades y comienzo 01/06/2026 | Válida | `proyecto-cronogramas.png`; tabla y Gantt real renderizados |
| Desagregación | Componentes y origen de valores | Válida | `proyecto-desagregacion.png`; rubros, VAE e integridad CPC calculados |
| Fórmula polinómica | Coeficientes, agrupaciones y comprobación | Válida | `proyecto-formula.png`; recursos, índices, coeficientes y pendientes visibles |
| Navegación lateral | Pestañas, expansión, proyecto y revisión activos | Válida | Presente en las ocho capturas anteriores; entrada directa corregida y verificada |

## Precios unitarios

| Evidencia | Contenido que debe demostrar | Estado | Validación positiva |
|---|---|---|---|
| Página de entrada | Bases, subcategorías, recursos y APUs | Validada | `precios-unitarios.png`: cuatro accesos y bloqueo Base requerida |
| Bases de trabajo | Base maestra/proyecto, tipo, región, acciones y contexto | Validada | `bases-trabajo.png`: cinco bases reales |
| Nueva base | Nombre, tipo, ubicación, parámetros y guardado | Validada | `bases-nueva-modal.png`: ventana completa |
| Editar o clonar base | Diferencia entre modificar y crear una copia | Validada | `bases-editar-modal.png` y `bases-clonar-modal.png` |
| Sincronización e historial | Faltantes, origen, resultado e historial | Validada | `bases-sincronizacion-completa.png` y `bases-historial-completo.png` |
| Papelera de bases | Retención, restauración y eliminación | Validada | `bases-papelera-modal.png`: estado vacío cargado y retención |
| Subcategorías | Catálogo, filtros, jerarquía y acciones | Validada | `subcategorias.png`: cinco categorías y registros reales |
| Crear/editar subcategoría | Código, descripción, observaciones y guardado | Validada | `subcategorias-nueva-modal.png` y `subcategorias-editar-modal.png` |
| Importar subcategorías | Formato, destino, datos y confirmación | Validada | `subcategorias-importar-modal.png` |
| Borrado masivo de subcategorías | Selección, cantidad, identidad y doble confirmación | Validada | `subcategorias-borrado-masivo-modal.png`, sin continuar al borrado |
| Banco de recursos | Búsqueda, tipo, unidad, precio y procedencia | Validada | `recursos.png`: 216 recursos y estados reales |
| Crear/editar recurso | Campos, precio, unidad, propiedad, CPC y ficha | Validada | `recursos-nuevo-modal.png` y `recursos-editar-modal.png` |
| Importar recursos | Formato, columnas, datos y confirmación | Validada | `recursos-importar-modal.png` |
| Asignación CPC masiva | Selección múltiple, búsqueda oficial y reemplazo advertido | Validada | `recursos-cpc-masivo-modal.png`: dos recursos, sin asignar |
| Borrado masivo de recursos | Selección, dependencias y doble confirmación | Validada | `recursos-borrado-masivo-modal.png`, sin continuar al borrado |
| Índice global de recursos | Búsqueda transversal, ubicación y navegación | Validada | `recursos-indice-global.png`: “cemento” devuelve cinco coincidencias de Materiales desde Equipos |
| Listado de APUs | Código, descripción, unidad, precio y acciones | Validada | `apus.png`: 177 APUs y un análisis revisado |
| Editor de APU | Componentes, cantidades, rendimientos, parciales y total | Validada | `apus-mamposteria-editor.png`: siete líneas y total 24,88 |
| Editor de APU vacío | Identidad, unidad, rendimiento, estado y guardado | Validada | `apus-nuevo-editor.png` |
| Unidad de APU | Abreviatura, nombre, alcance y guardado | Validada | `apus-unidad-modal.png` |
| APU anidado | Incorporación de otro análisis y efecto en el total | Validada | Mortero 1:3 visible dentro de `apus-mamposteria-editor.png` |
| Importación masiva de APUs | Descripción, unidad, destino y confirmación | Validada | `apus-importar-modal.png` |
| Importación desde base | Origen, gobernanza, búsqueda, selección y conflictos | Validada | `apus-importar-base-modal.png`, `apus-importar-base-paso-2.png` y `apus-importar-conflictos-modal.png`; la comparación fue en seco |
| Borrado masivo de APUs | Selección, dependencia superior y doble confirmación | Validada | `apus-borrado-masivo-modal.png`, sin continuar al borrado |
| Exportación de costos | Selección, vista previa y formatos | Validada | `apus-reporte-modal.png`: vista previa sin confirmar |

## Presupuesto

| Evidencia | Contenido que debe demostrar | Estado | Validación positiva |
|---|---|---|---|
| Presupuestos del proyecto | Presupuesto Base Rev 0, estado y total | Válida | `proyecto-presupuesto.png`; presupuesto operativo integrado |
| Detalle completo | Capítulos, partidas, cantidades, precios y total | Válida | `proyecto-presupuesto.png`; estructura, partidas y totales visibles |
| Edición de partida | Cantidad, precio, APU y efecto económico | Válida | `proyecto-presupuesto-editar-apu.png`; editor completo, composición y total sin guardar |
| Totales e indirectos | Subtotal, indirectos y total con explicación | Válida | `proyecto-presupuesto.png` y `proyecto-presupuesto-indirectos.png`; banda y configuración completas |
| Importación/exportación | Formato, vista previa, errores y confirmación | Pendiente | Vista previa terminada |
| Reportes | Presupuesto, presupuesto con APUs e indirectos | Válida | `proyecto-presupuesto-reportes.png`; menú real abierto |
| Pareto económico | Ranking, acumulado, detalle y navegación | Válida | `proyecto-presupuesto-pareto.png`; 20 partidas y detalle terminados |
| Eliminación y confirmaciones | Alcance de la acción y posibilidad de recuperación | Válida | `proyecto-presupuesto-eliminar-linea.png`; ventana abierta sin confirmar |

## Planificación, avance y control

| Evidencia | Contenido que debe demostrar | Estado | Validación positiva |
|---|---|---|---|
| Lista de cronogramas | Cronograma vinculado al presupuesto | Pendiente | Cronograma 1 visible |
| Gantt | Actividades, escala, dependencias y ruta crítica | Válida | `proyecto-cronogramas.png`; barras, escala, actividades y relaciones renderizadas |
| Configuración del Gantt | Fecha inicial, objetivo, jornada y efecto calculado | Válida | `proyecto-cronograma-configuracion.png`; panel abierto sobre el Gantt terminado |
| Calendario laboral | Jornada, días hábiles, feriados y efecto | Válida | `proyecto-cronograma-calendario.png`; ventana completa de junio de 2026 a enero de 2027 |
| Dependencias | Predecesora, sucesora, tipo y desfase | Válida | `proyecto-cronograma-dependencia.png`; creador completo de 1.1.1 sin confirmar |
| Historial confirmado / línea base | Versiones aprobadas y condición previa para comparar | Parcial | `proyecto-cronograma-historial.png`; estado final sin versiones. Falta crear una versión autorizada |
| Cronograma valorado | Reparto por periodos, origen, total, pico, riesgo y avance | Válida | `proyecto-cronograma-valorado.png`; matriz real terminada |
| Recursos por periodo | Categorías, cantidades, costos, capacidad y sobrecargas | Válida | `proyecto-cronograma-recursos.png`; 214 recursos y seis periodos |
| Avance y reprogramación | Real frente a plan, causas y nueva previsión | Parcial | `proyecto-cronograma-valorado.png` muestra avance calculado; falta un corte real con evidencia y reprogramación |
| Pareto y análisis | Concentración de costo/plazo y lectura recomendada | Válida | `proyecto-cronograma-pareto.png`; filtros, veinte partidas y detalle terminados |

## BIM del proyecto

Todas las imágenes BIM deben mantener visible que el modelo es una demostración pública buildingSMART, no la geometría de autoría del proyecto.

### Auditoría de cobertura del flujo actual — 5 de agosto de 2026

La cobertura visual incorporada se ha contrastado con el flujo vigente del módulo: contexto y permisos, administración de modelos, visor, CDE, coordinación, planificación 4D, producción 5D, campo, entrega e intercambio. Las evidencias marcadas como **Válida** proceden de capturas reales o de harnesses DOM ejecutados a 1920×1080; las marcas **Parcial** y **Pendiente** no son fallos del manual, sino estados que requieren una nueva condición de datos, una segunda versión BIM, una línea base o una demostración que todavía no existe en el proyecto canónico. No se reutiliza una captura de estado vacío para afirmar una función de aprobación o coordinación que no haya ocurrido.

| Evidencia | Contenido que debe demostrar | Estado | Validación positiva |
|---|---|---|---|
| Espacio BIM y selector de modelo | Modelo 1, versión 1, cuatro plantas y 144 elementos | Válida | `proyecto-bim.png`; modelo, versión, árbol, 144 elementos y cuatro niveles visibles |
| Visor 3D | Geometría cargada, árbol, propiedades, selección y controles | Válida | `proyecto-bim-visor.png`; escena alternativa con 120 elementos visibles y controles completos |
| Planta y elemento | Nivel 1 y muro CMU seleccionado | Pendiente | Propiedades del elemento visibles |
| Vínculo con EDT | Elemento 2 relacionado con EDT 35 como referencia | Pendiente | Relación y nota visibles |
| Vínculo con presupuesto | Elemento 2 relacionado con partida 118 | Pendiente | Relación y nota visibles |
| Importación IFC | Nombre, versión, disciplina, archivo, progreso y resultado | Parcial | `proyecto-bim-admin-importar.png`; formulario inicial válido. Falta evidenciar un trabajo procesado sin alterar el modelo activo |
| Versiones del modelo | Versión activa, fuente, checksum, atribución y cambio | Válida | `proyecto-bim-admin-versiones.png`; versión, estado, 144 elementos, cuatro niveles, origen y atribución visibles |
| Federación | Modelos, disciplinas, transformaciones y activación | Parcial | `proyecto-bim-admin-federacion.png`; condición previa final con una versión. Falta el panel con dos miembros |
| Georreferenciación | Sistema, origen, orientación y comprobación | Válida | `proyecto-bim-admin-ubicacion.png`; mapa, catálogo, coordenadas, origen, rumbo y estado del ancla visibles |
| Calidad e IDS | Reglas, validación, incidencias y resultado | Parcial | `proyecto-bim-admin-calidad.png`; estado inicial sin reporte. Falta un resultado generado e IDS |
| Resumen de coordinación CDE | Indicadores, carga, pendientes y alertas | Válida | `proyecto-bim-coordinacion.png`; estado vacío final, sin carga ni mensaje de error |
| Coordinación y colisiones | Conjuntos, tolerancia, detección y seguimiento | Pendiente | Resultado o estado vacío final |
| CDE y documentos | Carpetas, estados, versiones y permisos | Válida | `giproy-bim-cde-documents-1920x1080.png`; revisión documental visible en repositorio CDE |
| RFI | Pregunta, responsable, vencimiento, respuesta y cierre | Válida | `giproy-bim-cde-rfi-1920x1080.png`; expediente RFI validado en harness |
| Revisiones y aprobaciones | Flujo, comentarios, decisión y trazabilidad | Válida | `giproy-bim-cde-review-1920x1080.png`; revisión y decisión visibles |
| Colaboración | Comentarios, menciones, participantes y actividad | Válida | `giproy-bim-cde-collaboration-1920x900.png`; actividad colaborativa visible |
| 4D: actividades | Asociación con cronograma y modelo | Válida | `giproy-bim-timeline-4d-1920x1080.png`; actividades y corte temporal visibles |
| 4D: simulación | Fecha, reproducción, colores y lectura | Válida | `giproy-bim-timeline-4d-1920x1080.png`; controles de secuencia visibles |
| 4D: línea base | Revisión, dependencias y comparación | Válida | `proyecto-bim-planificacion.png`; estado inicial terminado y secuencia desactivada por no existir línea base |
| Producción: plan frente a real | Línea base, fecha de corte y lectura inicial | Válida | `proyecto-bim-produccion.png`; panel final sin comparación por falta de línea base |
| 5D: cantidades y costo | Cantidad BIM, partida, diferencia y decisión | Válida | `giproy-bim-qto-1920x1080.png` y `giproy-bim-cost-control-1920x1080.png`; snapshot QTO y control económico visibles |
| Campo: incidencias | Ubicación, responsable, prioridad, fecha y cierre | Válida | `giproy-bim-field-issues-1920x900.png`; incidencia de campo visible |
| Campo: documentos | Documento, versión, ubicación y disponibilidad | Válida | `giproy-bim-field-documents-1920x900.png`; documentos de campo visibles |
| Campo: diario | Jornadas, partes, filtros y detalle | Válida | `proyecto-bim-campo.png`; estado vacío final y filtros visibles, sin mensaje de error |
| Campo: recursos | Planificado, presente y desviación | Pendiente | Panel terminado |
| Campo: inspecciones | Lista, resultado, evidencia y seguimiento | Válida | `giproy-bim-field-inspections-1920x900.png`; inspección validada en harness |
| Campo: imprevistos | Evento, impacto, respuesta y cierre | Pendiente | Formulario o registro |
| Entrega as-built | Versión, revisión, criterios, declaración y presentación | Válida | `proyecto-bim-entrega.png`; formulario inicial completo, sin mensaje de error |
| Entrega y activos | Activo, documentación, mantenimiento y entrega | Pendiente | Panel terminado |
| Informes BIM | Tipo, vista previa y exportación tabular | Válida | `proyecto-bim-informes.png`; selector, Vista previa y CSV visibles |
| Intercambio ERP | Paquete, validación, exportación y resultado | Válida | `giproy-bim-erp-exchange-1920x900.png`; paquete ERP visible sin exponer secretos |
| Integraciones | Conector, eventos, estado y secreto de una sola visualización | Válida | `giproy-bim-integration-gateway-1920x900.png`; estado del conector visible sin mostrar el secreto |

## Servicios, comunidad, transferencias y mercado

| Evidencia | Contenido que debe demostrar | Estado | Validación positiva |
|---|---|---|---|
| Otros servicios | Accesos disponibles y finalidad | Válida | `servicios.png`; tres tarjetas activas y dos funciones próximas |
| Comunidad | Ámbito, publicaciones, búsqueda, reacciones y moderación de empresa | Válida | `comunidad.png`; categorías, temas y contexto Santiago Bermeo terminados |
| Nueva publicación | Texto, adjuntos, destinatarios y publicación | Pendiente | Ventana sin publicar |
| Envíos y transferencias | Código público, bandejas, capacidad y estados | Válida | `envios-transferencias.png`; bandeja final y restricción real de licencia |
| Nuevo envío | Destinatario, contenido, autorización y confirmación | Pendiente | Ventana sin enviar |
| Mercado | Productos, categorías, búsqueda, precio y filtros | Válida | `marketplace.png`; 14 productos, categorías, precios y filtros cargados |
| Detalle de producto | Alcance, licencia, vendedor, precio y compra | Pendiente | Producto real de demostración |
| Área compradora | Pedidos, descargas, estados y reclamaciones | Pendiente | Panel terminado |
| Área vendedora | Catálogo, publicación, ventas y liquidación | Pendiente | Panel terminado |
| Administración del mercado de empresa | Categorías propias, pagos y transferencias | Pendiente | Panel terminado; no superadministrador |

## Ajustes de empresa

| Evidencia | Contenido que debe demostrar | Estado | Validación positiva |
|---|---|---|---|
| Mi empresa | Identidad, ubicación, contacto y datos visibles | Pendiente | Santiago Bermeo visible |
| Usuarios de empresa | Personas, función, vigencia y acciones | Pendiente | Usuario administrador visible sin datos innecesarios |
| Alta/edición de usuario | Datos, función, permisos y vigencia | Pendiente | Ventana completa sin guardar |
| Preferencias | Moneda, decimales, región y comportamiento | Válida | `ajustes-empresa.png`; decimales, sesión, OmniClass y guardado sin datos personales |
| Códigos de proyecto | Regla, ejemplo y siguiente código | Pendiente | Configuración cargada |
| Plantillas | Creación, edición, aplicación y eliminación | Pendiente | Tabla o estado vacío final |
| Copias de seguridad | Alcance, creación, descarga, restauración y riesgo | Pendiente | Panel terminado |
| Eliminación de empresa | Doble confirmación y consecuencias | Pendiente | Solo ventanas; nunca confirmar |

## Control global

- Capturas funcionales distintas, válidas y referenciadas por el HTML: **63**.
- Capturas internas válidas y referenciadas: **60**.
- Capturas públicas válidas y referenciadas: **3**.
- Referencias visuales totales dentro del HTML: **67**; algunas imágenes se
  reutilizan deliberadamente en el caso práctico para mantener la continuidad.
- Capturas rechazadas y eliminadas durante esta sesión: **1** (`proyectos-portafolio.png`).
- Capturas BIM bloqueadas por migraciones: **0**. La deriva del esquema se
  reparó con respaldo previo y se verificaron 85 de 85 tablas BIM.
- Las capturas de ficha, presupuesto y pestañas principales del proyecto ya
  están incorporadas. Permanecen pendientes las superficies detalladas que la
  propia matriz conserva con estado `Pendiente`.
- La portada del manual no cuenta como evidencia funcional.

Esta cifra debe actualizarse después de cada lote y antes de la auditoría de doble ciego.
