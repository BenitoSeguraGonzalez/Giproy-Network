# Libro de Estilo - GiProy Network

Este documento establece las pautas visuales obligatorias para el desarrollo de módulos en el sistema GiProy. La consistencia es clave para transmitir profesionalismo y orden.

## 1. Paleta de Colores

Se debe utilizar exclusivamente la paleta definida en `index.css`.

| Color | Variable CSS | Valor | Uso Principal |
|-------|--------------|-------|---------------|
| **Naranja Primario** | `--primary-orange` | `#F39200` | Acciones principales, botones de creación, destacados. |
| **Naranja Acento** | `--accent-orange` | `#E94E1B` | Hovers, alertas, estados activos. |
| **Azul Blueprint** | `--blueprint-blue` | `#136191` | Elementos de ingeniería, detalles técnicos. |
| **Negro Corporativo** | `--text-primary` | `#1A1A1A` | Texto principal, fondos oscuros de headers. |
| **Gris Secundario** | `--text-secondary` | `#4B5563` | Texto de apoyo, leyendas, iconos inactivos. |
| **Fondo Claro** | `--bg-light` | `#F2F4F7` | Fondo general de la aplicación. |

### 1.1 Iconografía de Categorías

Para mantener la coherencia en todo el sistema (Recursos y APUs), se deben usar los siguientes emojis y colores obligatorios:

| Categoría | Emoji | Clase CSS (Color) |
| :--- | :---: | :--- |
| Equipos y Herramientas | 🔧 | `text-blue-600` |
| Materiales | 📦 | `text-green-600` |
| Transporte | 🚚 | `text-yellow-600` |
| Mano de Obra | 👥 | `text-purple-600` |
| APUs (Sub-recursos) | 📑 | `text-orange-600` |

---

## 2. Tipografía e Identidad de Botones

- **Fuente Principal:** `Inter`, sans-serif.
- **Títulos de Módulo:**
  - Tamaño: `text-xl` a `text-2xl`.
  - Peso: `font-black`.
  - Transformación: `uppercase`.
  - Tracking: `tracking-tight`.
- **Subtítulos/Labels:**
  - Tamaño: `text-[10px]`.
  - Peso: `font-bold` o `font-black`.
  - Transformación: `uppercase`.
  - Tracking: `tracking-widest`.

## 3. Componentes Estándar

### Botones de Acción Principal (Crear, Guardar)
Deben usar el componente `LiquidButton` con los siguientes lineamientos:
- **Color:** Naranja corporativo (`--primary-orange`) o Negro si es secundario.
- **Icono:** Siempre acompañado de un icono lateral (ej. `Plus` de `lucide-react`).
- **Texto:** Mayúsculas, peso `font-black` o `font-bold`.

### Botones y Menús de Reporte
- **Componente estándar**: Todo botón principal de `Reporte` en módulos clásicos debe usar `ProjectSectionReportButton`.
- **Norma visual**: La referencia vigente es el botón implementado en `Cronogramas > Gantt`: botón cuadrado soft/neumórfico, radio contenido, icono centrado, hover azul y estado activo naranja suave.
- **Menús con opciones**: Todo desplegable de reportes con dos o más opciones debe usar `ProjectReportMenu` y `ProjectReportMenuItem`.
- **Item de menú**: Cada opción debe leerse como cápsula soft con sombra/relieve, texto centrado/estable en mayúsculas, icono a la derecha y separación vertical consistente.
- **No duplicación local**: Queda prohibido recrear clases ad-hoc para menús de reporte en `EDO`, `EDT`, `Cronogramas` u otros módulos. Si se necesita una variación, debe añadirse al componente común.
- **Alcance BIM**: Esta norma pertenece a GiProy Clásico. No debe activar UX BIM ni crear acoplamientos hacia BIM.

### Inputs y Formularios
- Usar el componente `Input` de la carpeta `ui`.
- Estilo: Bordes redondeados (`rounded-xl` o `rounded-[1.25rem]`), fondo suave (`bg-zinc-50`).
- **Normalización obligatoria en búsquedas**: Todo campo de búsqueda o filtro textual debe trabajar con cadena vacía `''` como estado vacío. Queda prohibido renderizar `null` o `undefined` en inputs visibles.
- **Limpieza y Escape**: Si un buscador implementa limpieza manual, reset por contexto o reacción a la tecla `Escape`, el valor visible debe quedar vacío y nunca mostrar el literal `null`.
- **Implementación React**: Los `value` de inputs de búsqueda deben sanearse antes de renderizarse. Reutilizar un helper común de normalización y evitar variantes ad-hoc por módulo.
- **Entradas contextuales ligeras**: Cuando el usuario ya está dentro de un modal o bloque técnico y necesita crear un elemento pequeño (por ejemplo una cuenta personalizada en `Indirectos`), se debe usar un compositor inline o un panel contextual del propio módulo. Queda prohibido recurrir a `window.prompt`.

### Selectores, Combobox y Popovers
- **Componente estándar**: Todo selector con búsqueda o lista no trivial debe usar `SearchableSelect`. Queda prohibido crear combobox ad-hoc si el caso puede resolverse con el componente centralizado.
- **Animación oficial**: Los desplegables de `SearchableSelect` deben abrir y cerrar con `AnimatePresence` + `framer-motion`, usando una transición tipo spring inspirada en `Animate UI / Radix Popover` (`stiffness: 300`, `damping: 25`, escala suave `0.96 -> 1` y desplazamiento vertical corto).
- **Portal obligatorio**: El contenido desplegable debe renderizarse en `document.body` con posicionamiento fijo para evitar recortes por contenedores con `overflow-hidden`, `overflow-auto` o scroll interno.
- **Superficie visual**: El popover debe mantener fondo blanco, borde neutro fino, radio amplio (`rounded-[1.15rem]` o equivalente), sombra suave controlada y lista con lectura limpia. No se permiten desplegables negros, pesados o ajenos al sistema soft actual.
- **Cierre y jerarquía**: Debe cerrar por selección y click exterior, conservar z-index superior al formulario activo y no bloquear controles vecinos.
- **Búsqueda natural**: La búsqueda debe ignorar acentos/diacríticos, trabajar con cadenas saneadas y no renderizar `null` ni `undefined`.
- **Select nativo**: `<select>` nativo queda prohibido en UI productiva. Si el selector no requiere búsqueda, debe usarse `AnimatedSelect`, compatible con `<option>`, `onChange(event)` y selección múltiple. Si requiere búsqueda o listas largas, debe usarse `SearchableSelect`.

### Selectores Operativos De Filas
- **Componente estándar**: Los selectores de filas, tarjetas, árboles y listados con acciones por lote deben usar `SoftSelectToggle`.
- **Comportamiento visual**: El indicador visible debe leerse como un led pequeño con estados apagado/encendido. El área clicable debe ser mayor que el led para no exigir precisión excesiva.
- **Uso correcto**: `SoftSelectToggle` aplica a selección operativa de elementos, selección global de visibles y estados parciales de selección en toolbars.
- **Uso incorrecto**: No sustituye checkboxes de consentimiento, formularios, preferencias o configuración. Esos casos deben conservar un control explícito de formulario o una variante específica futura.
- **Botones compuestos**: Si el selector aparece como indicador dentro de un botón mayor, usar `as="span"` para evitar botones anidados.

### Datepickers y Datetimepickers
- **Componente estándar**: Todo campo visible de fecha o fecha-hora debe usar `AnimatedDateInput`. Queda prohibido usar `input[type="date"]` o `input[type="datetime-local"]` nativo como control visual final en la UI productiva.
- **Trigger visual**: El campo debe leerse como un combobox técnico del sistema: superficie blanca, borde fino neutro, radio amplio, icono de calendario a la izquierda y jerarquía tipográfica coherente con `AnimatedSelect` / `SearchableSelect`.
- **Apertura animada**: El calendario debe abrir en `portal` sobre `document.body`, con `AnimatePresence` y transición `spring`, evitando popups nativos del navegador, recortes por `overflow` y saltos de eje Z.
- **Calendario propio**: El panel debe usar mes en español, navegación por flechas, botón `Hoy`, selección de día sobria y, para `datetime`, edición integrada de hora/minuto.
- **Variante compacta**: En superficies densas (`CronogramaGantt`, filtros compactos, modales técnicos) debe usarse `variant="compact"` manteniendo el mismo lenguaje visual y la misma interacción.
- **Compatibilidad funcional**: El componente debe seguir entregando `onChange(event)` compatible con formularios existentes y mantener foco, teclado, click exterior y cierre controlado.
- **No maquillado parcial**: No se acepta envolver un control nativo con iconos o CSS si el popup sigue siendo el del navegador. El popup visible también debe pertenecer al sistema GiProy.

### Controles de Movimiento: Sliders, Scrollbars y Rails
- **Familia visual obligatoria**: Todo control que mueva posición, zoom, rango o espacio visual debe leerse como una línea guía gris con pieza móvil circular clara y un punto central pequeño en naranja corporativo (`#F39200`).
- **Rail**: La pista debe ser fina, neutra y sobria (`zinc-300` / gris medio). Queda prohibido usar barras gruesas naranjas o azules como protagonista visual salvo justificación funcional explícita.
- **Thumb**: La pieza móvil debe ser circular o visualmente circular, en tonos blancos/grises, con borde gris y micro-sombra suave. El naranja corporativo se reserva para el punto central, no para pintar toda la pieza.
- **Sliders horizontales**: Deben reutilizar la familia `.gantt-zoom-slider` o `.giproy-range-thumb` cuando corresponda. El tramo activo no debe romper la neutralidad del rail.
- **Scrollbars nativas estilizadas**: Cuando se use `custom-scrollbar`, `gantt-native-scroll` o `gantt-dark-scrollbar`, la apariencia debe aproximarse al mismo lenguaje de rail fino y thumb circular/centrado dentro de las limitaciones del navegador.
- **Scrollbars personalizadas**: Si se dibuja una scrollbar propia sobre un scroll real, no puede ser solo decorativa. Debe aceptar click en rail, arrastre del thumb, rueda del ratón y navegación básica por teclado cuando tenga foco.
- **Accesibilidad funcional**: El control debe mantener foco visible, área táctil suficiente y comportamiento real equivalente al desplazamiento o rango que representa.
- **Orientación universal**: La norma aplica a controles horizontales y verticales. La geometría debe rotar, no cambiar de lenguaje visual.

### Datos de Proyecto - Vista Operativa Actual
- **Vista canónica**: La presentación actual de `Datos de Proyecto` es la referencia vigente. La UI antigua queda retirada y no debe reintroducirse salvo nueva TASK explícita.
- **Lenguaje visual**: Debe mantener superficies soft, capítulos colapsables, botones circulares de despliegue discretos y coherencia con el landing de `Proyectos`.
- **Scroll independiente**: La composición en panel principal y panel lateral puede usar scroll independiente, pero ambos deben respetar la familia de controles de movimiento definida en este libro de estilo.
- **Comboboxes**: Todos los selectores de esta vista deben usar el patrón `SearchableSelect` con portal y animación, evitando recortes dentro de secciones colapsables.
- **Normativa aplicable**: En `2. Especificaciones técnicas`, la normativa debe resolverse como multiselección animada, no como `<select>` nativo. La selección vigente se representa con lectura compacta o listado técnico sobrio y se persiste como lista JSON textual en `ProyectoDetalle` para mantener universalidad por empresa/proyecto.
- **Sección 3 alcance y dimensionamiento**: Debe incluir `Descripción breve`, `Alcance detallado`, selector rector `Tipo de medición` y campos dependientes persistidos. El selector gobierna la visibilidad de `Área`, `Longitud`, `Volumen`, `Unidades` o `Mixto`, pero no debe borrar valores previamente capturados al cambiar de tipo.
- **Alertas de consistencia técnica**: La sección 3 debe mostrar avisos suaves cuando detecte choques de datos, por ejemplo `Área de construcción > Área de terreno` o edificación vertical sin niveles informados. Estas alertas son informativas salvo TASK explícita de bloqueo.
- **Resumen técnico automático**: La sección 3 debe exponer una lectura compacta de las magnitudes activas para facilitar revisión y reportes sin abrir todos los campos.
- **Memos y ortografía**: Todo campo memo de `Datos de Proyecto` debe mantener `spellCheck` nativo y, cuando aplique, el corrector ortográfico asistido definido en este documento.
- **Sección 7 universal**: Objetivos clave, restricciones conocidas y supuestos iniciales deben persistirse bajo el modelo universal de `ProyectoDetalle` por empresa/proyecto. Los tres campos se resuelven como listas incrementales persistidas, serializadas en los campos existentes del detalle y compatibles con datos históricos en texto por líneas.
- **Sección 8 documental**: El panel lateral de `Datos de Proyecto` debe ordenar sus bloques como `Geo-referenciación -> Imagen Referencial -> Documentos Adjuntos`. La opción `Croquis` queda retirada de la vista actual.
- **Documentos PDF**: `Documentos Adjuntos` debe funcionar como listado persistido de PDFs por `codigo_root + empresa_id`. La UI debe permitir subir PDF, ver en visor interno autenticado y descargar; no se permiten placeholders ni cargas sin contrato backend.
- **Visor PDF interno**: El visionado de PDFs debe realizarse mediante blob autenticado desde la API, no mediante URL pública directa que pueda saltarse permisos o tenant.
- **Visores ampliados**: `Imagen Referencial` y `Geo-referenciación` deben usar visores de pantalla completa propios sobre una shell visual común. La imagen se muestra como `object-contain`; el mapa mantiene interacción Leaflet, geocodificación asistida y ajuste de punto por clic para usuarios con permisos.
- **Georreferenciación editable solo en pantalla completa**: El mapa lateral de `Geo-referenciación` es informativo. No debe capturar clics, guardar zoom ni modificar coordenadas. Cualquier cambio de posición, geocodificación asistida o ajuste por clic debe ejecutarse exclusivamente dentro del visor de pantalla completa.

### Kanban Operativo de Proyectos
- **Densidad prioritaria**: Las tarjetas Kanban de `Proyectos` deben ser compactas y operativas. El título se limita a una línea, los chips son microchips y los metadatos se agrupan en una grilla corta antes que en filas verticales largas.
- **Datos mínimos visibles**: Cada tarjeta debe mostrar código, nombre, fase, versiones, cliente, presupuesto, plazo, fecha fin y ubicación resumida sin superar una altura operativa razonable.
- **Acciones discretas**: Los controles de cambio de fase y apertura de revisión deben usar microbotones soft coherentes con el sistema, evitando botones grandes que compitan con la lectura del tablero.
- **Columnas utilizables**: El Kanban debe reservar más espacio a las columnas y menos a decoración. Los encabezados de fase y estados vacíos deben mantenerse bajos para favorecer la gestión diaria.
- **Sin regresión a card alta**: No se deben reintroducir tarjetas con cinco o más filas de metadatos apilados salvo una TASK explícita que justifique pérdida de densidad.

### Política Multiempresa y Tenant Operativo
- **Empresa activa obligatoria**: Todo flujo operativo de negocio debe resolverse sobre una `empresa` activa. Para `Superadministrador`, queda prohibido operar en módulos de negocio sin empresa seleccionada.
- **Inyección de tenant**: Las requests de negocio deben inyectar `empresa_id` desde la capa API compartida. No se debe depender de construir query strings manuales por pantalla.
- **Endpoints globales**: Las llamadas globales o de plataforma (`login`, `usuarios/me`, `empresas`, `paises`, `maestros`, utilidades transversales) deben marcarse explícitamente como `sin tenant`.
- **Clientes API obligatorios**: En módulos multiempresa (`Proyectos`, `Presupuestos`, `Bases`, `Subcategorías`, `Recursos`, `APUs`, `EDT`, `EDO`, `Stakeholders`) queda prohibido usar `api.get/post/put/delete(...)` directo si existe o debe existir un cliente API del dominio.
- **Cambios de contexto**: Al cambiar la empresa activa, se deben invalidar todos los contextos derivados que puedan contaminar otro tenant (`base`, `proyecto`, `presupuesto`, caches o selecciones persistidas).
- **Remonte visual por tenant**: Todo módulo clásico protegido debe refrescar su estado visible al cambiar la empresa activa, sin exigir recarga del navegador. El `AppLayout` debe conservar una clave derivada de `selectedEmpresa.id` para remontar el contenido operativo, y los módulos con estado sensible deben seguir usando `selectedEmpresa` o clientes API con `empresa_id` explícito.

### Política de Stakeholders por Proyecto
- **Directorio Común del Proyecto**: `Stakeholders` pertenece al proyecto raíz (`codigo_root`) y se comparte entre todas sus revisiones.
- **Sin Activación Intermedia**: La pantalla `Stakeholders` no debe actuar como paso de habilitación manual para `EDO` o `EDT`. Queda prohibido exigir un toggle previo de activación por revisión.
- **Elegibilidad Total en EDO/EDT**: Todo stakeholder existente en el directorio del proyecto debe ser elegible por defecto al crear nodos en `EDO` y `EDT`.
- **Rol consolidado derivado**: `Stakeholders` no edita roles manualmente. Un stakeholder nuevo inicia como `Sin rol asignado`; cuando `EDO` o `EDT` guardan un rol para ese stakeholder, el backend sincroniza ese rol hacia el directorio común del proyecto para lectura y reportes.
- **EDO/EDT como origen del rol**: El rol sigue asignándose desde el uso operativo en `EDO` o `EDT`. `Stakeholders` muestra y reporta el rol consolidado, pero no abre un editor de catálogo de roles propio.
- **Conflicto de roles**: En operación normal gana el último cambio explícito guardado desde `EDO` o `EDT`. En saneamientos históricos se prioriza `EDO`, luego `EDT`, y finalmente `Sin rol asignado`.
- **Separación de Responsabilidades**: `Stakeholders` define personas/contactos del proyecto. `EDO` y `EDT` definen cómo se usan dentro de una revisión concreta.
- **Búsqueda Natural de Stakeholders**: Los selectores de stakeholders en `EDO` y `EDT` deben buscar por nombre visible ignorando acentos y diacríticos. Queda prohibido depender del código del stakeholder como etiqueta principal de búsqueda.
- **Directorio con la Misma Regla**: La búsqueda de la sección `Stakeholders` debe seguir la misma política natural: coincidencia por nombre visible sin sensibilidad a acentos y sin usar el código como criterio principal.

### Corrector Ortográfico Asistido
Para campos largos de texto libre con impacto colaborativo o documental, se debe habilitar el patrón de revisión ortográfica asistida ya usado en módulos existentes:

- **Ámbitos obligatorios**: notas generales, notas de línea de presupuesto, observaciones técnicas, especificaciones y campos memo equivalentes.
- **Referencia técnica**: reutilizar el cliente `frontend/src/api/utils.js` sobre el endpoint `POST /api/v1/utils/spellcheck`.
- **Patrón visual**: usar una acción secundaria compacta con icono `SpellCheck` de `lucide-react`, texto en mayúsculas y color naranja corporativo (`text-[#F39200]`).
- **Interacción**: la revisión debe ser siempre bajo demanda del usuario; no ejecutar correcciones automáticas en segundo plano.
- **Resultado**: si el servicio devuelve sugerencia, presentar confirmación explícita antes de aplicar el texto corregido.
- **Consistencia**: cuando el campo ya tenga `spellCheck="true"` nativo del navegador, el corrector asistido sigue siendo complementario, no sustitutivo.
- **Reutilización**: cualquier nuevo formulario con campos descriptivos largos debe hacer referencia a esta pauta antes de implementar una variante ad-hoc.

### Botones de Herramienta e Iconografía Operativa
Para barras de herramientas compactas, headers técnicos y paneles laterales, se debe usar el siguiente patrón visual:

- **Formato base:** Botón cuadrado o casi cuadrado, contenido centrado, con `bg-white`, `border border-zinc-200` y `rounded-xl`.
- **Iconografía:** Iconos `lucide-react`, preferiblemente en tamaño `w-4 h-4`.
- **Comportamiento hover:** Cambios sutiles de borde y color (`hover:border-[#F39200]`, `hover:text-[#F39200]`) sin añadir profundidad excesiva.
- **Uso con texto:** Si la acción necesita identificarse rápidamente, el botón debe usar disposición vertical con icono superior y micro-label inferior en `text-[7px] font-black uppercase tracking-widest`.
- **Uso solo icono:** Si la acción es recurrente, secundaria o de estado binario (por ejemplo fijar/desfijar paneles), se permite boton solo con icono, sin texto visible, manteniendo `title` descriptivo obligatorio.
- **Estados activos:** Cuando un control de herramienta represente estado persistente, debe usar el mismo contenedor y variar solo color/borde (`border-[#F39200] text-[#F39200]`) o relleno del icono (`fill-current`) para indicar activacion.
- **Jerarquía:** Las acciones primarias del bloque deben mantener texto o label visible; los controles accesorios de soporte pueden comprimirse a iconografia pura para reducir ruido.
- **Consistencia de layout:** En grupos de herramientas superiores, las acciones del mismo nivel deben convivir en una misma franja. No desplazar una accion principal a una banda secundaria si comparte contexto operativo con las demas.

### Convención de Nombres para Reportes Descargables

Toda exportación visible para el usuario debe usar una convención homogénea, explícita y saneada para filesystem.

- **Formato obligatorio:**
  - `Tipo de Reporte - Contexto - RevN.ext`

- **Ejemplos válidos:**
  - `Presupuesto - Proyecto de Prueba 001 - Rev1.xlsx`
  - `APU - 5-001-0004 - Rev3.pdf`
  - `APUs - Base Norte - Rev2.xlsx`
  - `EDT LISTADO - Torre Centro - Rev4.pdf`
  - `VAE - Torre Centro - Rev4.xlsx`
  - `Formula Polinomica - Proyecto 18 - Rev2.pdf`

- **Reglas:**
  - El contexto debe ser el identificador más útil disponible para el usuario: nombre de proyecto, base, código APU o equivalente.
  - La revisión debe mostrarse siempre como `RevN`.
  - Queda prohibido usar ids desnudos como nombre final principal si existe un contexto legible mejor.
  - Queda prohibido mantener como salida final visible patrones genéricos del tipo `Reporte_X_*`.
  - El nombre debe sanear caracteres inválidos del sistema de archivos.

- **Fase posterior reservada:**
  - La futura serie interna de emisiones (`E01`, `E02`, etc.) se implementará en otra fase con persistencia y auditoría. No debe simularse todavía con contadores locales efímeros.

### Minimapa EDT en Presupuesto

Cuando `Presupuesto` necesite navegación jerárquica rápida, debe usar un minimapa compacto alineado con el lenguaje visual del gráfico `EDT`.

- **Acceso:** el minimapa debe exponerse como acción en la barra izquierda de herramientas, usando el mismo patrón de botón compacto que `AIU`, `Pareto`, `Notas` y `Reporte`.
- **Referencia visual:** la iconografía y el tono del control deben recordar al minimapa de `EDT` gráfico, pero adaptados al contexto de `Presupuesto`.
- **Alcance de datos:** el minimapa debe mostrar exclusivamente nodos estructurales `CUENTA_PAQUETE`. No debe renderizar líneas APU individuales.
- **Interacción:** la acción principal es `click para navegar`. Al seleccionar un nodo, el editor debe desplazarse al capítulo `EDT` correspondiente.
- **No interferencia:** el minimapa no debe abrir `Tanteo`, editar cantidades ni iniciar drag & drop.
- **Cierre de contexto:** al navegar desde el minimapa, se permite limpiar la selección de línea operativa para evitar que el foco de `Tanteo` o de edición contradiga el salto estructural.

## 4. Estética y Efectos Visuales

- **Diseño Flat con profundidad controlada:** Se debe evitar el uso de sombras pesadas (`shadow-lg`, elevaciones duras o relieves dominantes) en botones, listados y contenedores. Se permiten micro-sombras suaves solo en popovers, botones circulares de despliegue, thumbs de sliders/scrollbars e indicadores de movimiento cuando refuercen usabilidad sin romper la limpieza visual.
- **Gradientes:** No utilizar gradientes complejos o profundos en elementos interactivos. Se permiten gradientes lineales muy sutiles en piezas móviles circulares o superficies soft si el resultado sigue siendo neutro.
- **Hovers:** El feedback visual debe limitarse a cambios sutiles de color de fondo, borde, opacidad o microdesplazamiento. No se debe añadir profundidad artificial pesada.

## 4.1 Cards de Previsualización Técnica (Estética Industrial Light)

Para áreas de "Preview" o visualización de formatos generados automáticamente (ej. códigos de proyecto), usar el patrón **Industrial Light**:
- **Fondo:** Blanco puro o `bg-white` con borde `zinc-200`.
- **Cuerpo Técnico:** Contenedor interno en `zinc-50/80` con `backdrop-blur` and bordes redondeados pronunciados (`rounded-3xl`).
- **Iconografía:** Usar iconos de visualización como `Eye` en naranja corporativo (`--primary-orange`).
- **Tipografía:** Para códigos o datos crudos, usar `font-mono`, `font-black` and `tracking-widest` para enfatizar la naturaleza técnica.
- **Leyendas:** Añadir micro-indicadores circulares de color para identificar partes del dato visualizado.

## 4.2 Editores Técnicos de Alta Densidad (Softening Policy)

En módulos con carga de datos extremadamente alta (como el Editor de APUs), el uso excesivo de **Negro Corporativo** (`zinc-900`) en elementos de gran superficie puede resultar agresivo y fatigar la vista. Para estos casos se aplica la política de **Suavizado Industrial**:

- **Headers de Categoría (Sidebar/Catálogo):** Reemplazar `bg-zinc-900` por `bg-[#F2F4F7]` (`--bg-light`) con bordes `zinc-200`. El texto debe pasar de blanco a `zinc-900` (`--text-primary`).
- **Header Contextual (Top Bar Local):** Usar `bg-zinc-100` con borde inferior `zinc-200` en lugar de fondo negro sólido.
- **Selección Activa en Menús Densos:** Sustituir el bloque negro por `bg-zinc-100` con `border-zinc-300` y `shadow-sm`.
- **Cabeceras de Tabla:** Las cabeceras de columnas deben usar `bg-zinc-50/80` con bordes finos, dejando el negro únicamente para elementos de contraste extremo o botones de acción muy específicos.
- **Jerarquía Visual:** Mantener el **Naranja SIRIS** (`#F39200`) para los acentos de iconos y botones primarios, asegurando que el suavizado de fondos no diluya la capacidad del usuario para identificar acciones.

### 4.2.1 Regla Específica para Editor APU

En la tabla interna del editor APU se fija una estructura técnica obligatoria para evitar solapes y mantener legibilidad en filas densas:

- **Handle Separado**: El control de arrastre (`GripVertical`) debe vivir en su propia columna. Nunca debe compartir celda visual con el código del recurso o del APU hijo.
- **Código Integrado**: El código debe convivir con la descripción dentro de la misma banda principal de recurso. No se debe reservar una columna independiente solo para el código.
- **Descripción Prioritaria**: La descripción es el dato dominante de la fila. Debe usar la mayor fracción del ancho disponible y truncar antes de solaparse con columnas numéricas.
- **Acciones Fuera del Grid**: Editar recurso y eliminar no deben ocupar una columna fija `Acc.`. Deben aparecer en una bandeja inferior contextual al hacer `hover` o `focus` sobre la fila y desaparecer al salir.
- **Cierre Económico Adaptativo**: `Parcial` debe permanecer siempre visible como cierre económico principal. `% Relativo` solo debe mostrarse cuando el ancho efectivo permita mantener la fila en una sola línea sin solapes.
- **Sumatorios de Sección**: Cada bloque categórico del editor APU debe mostrar `Subtotal` y `% Relativo` acumulado de sus filas.
- **Orden de Cierre de Sección**: En la cabecera de cada categoría del editor APU, el resumen debe leerse como `Subtotal -> % Rel.` y no a la inversa.
- **Base de Cálculo**: El `% Relativo` de cada línea y de cada sección se calcula exclusivamente contra `Costo Directo`; no debe mezclarse con indirectos ni con `Total de Partida`.
- **Sin Cierre Global Redundante**: El pie del editor APU no debe repetir `% Relativo` a nivel global si ese dato no añade decisión operativa. El cierre económico del pie queda en `Costo Directo`, `Indirectos` y `Total de Partida`.
- **Cabecera Técnica Compacta**: En el editor APU, `Descripción de Partida` y `Unidad` deben convivir en una sola fila operativa siempre que sea viable. La densidad de esta banda debe optimizarse con labels más pequeñas, campos más bajos y menor padding vertical, incluso fuera del modo portátil.
- **OmniClass Contextual en Cabecera**: La asignación OmniClass del APU debe resolverse como icono contextual inmediatamente después de `Unidad`, desplegando su selector dentro de la misma tarjeta. No debe vivir como una banda fija adicional del header.
- **Código Integrado con la Descripción**: En las líneas del editor APU, `código` y `descripción` deben convivir en la misma banda de lectura. No se debe reservar una fila secundaria para metadata irrelevante si no aporta decisión operativa.
- **Sin Fallbacks Vacíos**: Etiquetas genéricas como `General` no deben mostrarse en líneas APU si solo actúan como fallback técnico y no describen un dato real útil para el usuario.
- **Cambio de Subcategoría = Estado Limpio**: Al cambiar de subcategoría en `APUs`, la pantalla debe invalidar selecciones y contextos derivados del listado anterior (`selección masiva`, `preview de reporte`, `borrado masivo`, `selección de importación`, `conflictos de importación`). Queda prohibido arrastrar esas selecciones entre subcategorías.

### 4.2.2 Regla Responsive para Portátil e Intermedios

Cuando el ancho efectivo del editor APU entre en rango portátil o intermedio, la tabla no debe romper la banda principal de lectura si aún puede conservarse en una sola línea. En ese escenario se aplica una densidad responsive obligatoria:

- **Fila Única Primero**: La línea APU debe intentar mantenerse en una sola banda técnica antes de degradar a soluciones de dos niveles.
- **Ocultación Selectiva**: En rango portátil o intermedio, `% Relativo` debe ser el primer candidato a ocultarse para preservar legibilidad.
- **Descripción como Dato Dominante**: La descripción debe conservar lectura limpia y truncar antes de empujar solapes sobre columnas numéricas.
- **Acciones Flotantes**: La edición y borrado deben seguir disponibles mediante bandeja inferior por `hover/focus`, sin volver a abrir una columna fija.
- **Sidebar Menos Invasivo**: El catálogo lateral del editor APU debe estrecharse en este rango para ceder ancho a la composición activa, sin romper buscador ni drag and drop.
- **Sin Dependencia de Scroll Horizontal**: El scroll horizontal puede existir como último recurso, pero no debe ser la solución principal para hacer legible la fila.
- **Continuidad Operativa**: El modo intermedio debe mantener drag and drop, inline editing, subtotales y acciones sin mutar la fila a una tarjeta blanda ajena al lenguaje técnico del módulo.

### 4.2.3 Extensión del Patrón a Presupuesto

El mismo criterio responsive se aplica al árbol de líneas del módulo Presupuesto cuando la vista opera en portátil o ancho intermedio:

- **Cabecera en Dos Bandas**: La cabecera del presupuesto debe separar `código + descripción` de la banda cuantitativa `unidad + cantidad + precio unitario + subtotal`.
- **Línea APU en Dos Niveles**: Cada línea presupuestaria debe priorizar `código + descripción` arriba y desplazar magnitudes económicas a una segunda banda inferior.
- **Prioridad de Lectura**: La descripción del rubro nunca debe truncarse por la presencia simultánea de `cantidad`, `precio` y `subtotal`.
- **Continuidad Técnica**: Notas, drag and drop, edición de cantidad y selección de línea deben mantenerse operativos en modo compacto.
- **Gestos sin Ambigüedad**: En el árbol de `Presupuesto`, la superficie de la fila debe reservarse para selección y paneo. El drag & drop de líneas no puede salir desde toda la fila.
- **Handle Exclusivo**: El movimiento de una línea presupuestaria entre cuentas EDT debe iniciarse solo desde `GripVertical`.
- **Paneo con Modificador**: El listado de `Presupuesto` no debe activar paneo por arrastre libre con botón izquierdo sobre filas porque entra en conflicto con selección de texto, click y drag & drop. El patrón oficial pasa a ser `Espacio + arrastre`, con cursor de mano mientras la barra espaciadora siga pulsada.

### 4.2.3.1 Catálogos Operativos de Lectura Larga

En listados operativos tipo `APUs` y `Recursos`, cuando la tarjeta principal depende de `código + descripción + métricas`, la prioridad debe ser siempre la lectura completa:

- **Una Sola Columna**: El listado principal debe renderizarse en una sola columna. No se debe introducir una segunda columna responsiva si eso degrada la lectura de descripciones largas.
- **Ancho para la Descripción**: El cuerpo textual de la tarjeta debe aprovechar el ancho completo disponible antes de compactar métricas o acciones.
- **Consistencia entre Catálogos**: Si `APUs` ya adopta este patrón por legibilidad, `Recursos` y otros catálogos equivalentes deben mantener la misma regla salvo justificación funcional explícita.

### 4.2.3.2 Sidebars de Subcategorías

En sidebars de selección de subcategorías, la tarjeta debe mantener jerarquía técnica compacta sin degradar el nombre del nodo:

- **Patrón Único Obligatorio**: `APUs`, `Recursos`, `Subcategorías` y catálogos operativos equivalentes deben reutilizar la misma gramática visual para listas laterales homologables.
- **Referencia Maestra**: la sidebar principal de `APUs` es el referente oficial. `Recursos`, `Subcategorías`, `Catálogo APU`, listas internas del editor APU y variantes hermanas deben converger hacia esa misma lectura.
- **Jerarquía Visual Fija**: Cada tarjeta debe leerse como `código -> descripción -> contexto secundario`, manteniendo la descripción como dato dominante y el conteo como metadato operativo visible.
- **Conteo como Badge**: La cantidad de elementos no debe ir incrustada dentro del título. Debe presentarse como `badge` compacto alineado a la derecha, con ancho mínimo, números tabulares y contraste estable en estado normal, hover y seleccionado.
- **Descripción en Una Línea Premium**: La descripción debe priorizar una sola línea con truncado fino y fade lateral. Queda desaconsejado convertir todas las filas en bloques de dos o tres líneas salvo justificación funcional explícita.
- **Micro-línea de Contexto**: La fila activa puede añadir una única línea secundaria inferior del tipo `7 recursos en esta subcategoría` o `3 APUs disponibles` para reforzar contexto sin convertir la lista en un bloque pesado.
- **Texto Principal Reubicado en la Familia Compartida**: En listas que reutilicen `CatalogSidebarCard`, el conteo debe resolverse en el `badge` y la franja inferior debe priorizar el texto principal de lectura. La zona superior queda reservada para la estructura técnica (`icono/código + badge + chevron`). Cuando el nombre oficial ya sea el texto principal, debe mostrarse abajo sin sustituirlo por una reformulación no estándar.
- **Jerarquía de Lectura**: Cuando `CatalogSidebarCard` opere en modo descripción, el texto inferior debe tener más peso visual que la franja técnica superior. Ese texto principal es el que decide si se activa el tooltip contextual.
- **Chevron Separado**: El indicador de navegación/expansión debe permanecer separado del badge numérico para que ambos respiren visualmente y no compitan.
- **Activo Sobrio**: El estado activo oficial de esta familia usa fondo neutro/claro, borde definido y `badge` acentuado. Queda desaconsejado pintar la tarjeta completa con color saturado salvo justificación funcional fuerte.
- **Familia Extendida**: También entran en esta normalización las cabeceras agrupadoras equivalentes de `CatalogoApuTab` y la navegación lateral de `ApuBudgetEditor`.
- **Componente Compartido**: Cuando la gramática coincida, la implementación debe apoyarse en un componente común de sidebar para evitar divergencias por copia manual de clases.
- **Módulos Derivados**: Sidebars funcionales derivadas, como la lista de categorías de `Fórmula Polinómica`, deben reutilizar la misma pieza y no introducir variantes cromáticas o de tamaño ajenas a la familia.
- **Shell de Precios Unitarios**: La portada de `PreciosUnitarios` no es una sidebar, pero debe respirar el mismo sistema: acentos contenidos, badges sobrios y metadatos secundarios claros, evitando tarjetas saturadas ajenas a la familia PU.
- **Hover Card como Patrón Primario**: Cuando la familia use `CatalogSidebarCard`, el apoyo contextual debe presentarse mediante una `hover card` ligera con `código + nombre completo + contexto secundario`.
- **Sin Tooltip Nativo en la Familia**: En sidebars PU, agrupadores homologados y tarjetas de navegación hermanas no debe usarse `title` nativo para títulos o superficies de listado. El apoyo contextual debe resolverse con el patrón visual propio.
- **Reversibilidad de Variante**: Cuando se experimente una evolución visual sobre estas sidebars, la implementación debe quedar encapsulada detrás de un flag o variante local para permitir rollback limpio mientras se valida su adopción transversal.

## 5. Política Obligatoria de Exactitud de Cálculo

Esta política es de cumplimiento obligatorio y no puede obviarse bajo ningún concepto.

- **Fuente de verdad**: Todo importe económico operativo del sistema debe originarse en backend.
- **Backend obligatorio**: Los cálculos persistidos deben realizarse exclusivamente con `Decimal` y redondeo directo oficial (`round_decimal` / política operativa común).
- **Redondeo oficial**: para redondear a `N` decimales se decide una sola vez sobre el valor original. Queda prohibido cualquier redondeo sucesivo o "en cascada".
- **Persistencia económica**: `APUs`, `Presupuestos`, `Cronogramas`, `Desagregación`, `EDT Valorada`, `Fórmula Polinómica` y `Reporting` deben consumir la misma política oficial.
- **Frontend obligatorio**: en módulos económicos críticos solo se puede redondear mediante los helpers comunes (`roundDecimal`, `operationalNumbers`, `cronogramaNumbers`, `edtValuation`).
- **Migraciones de datos**: si cambia la política oficial, todos los importes persistidos derivados deben recalcularse desde sus datos fuente antes de seguir operando.
- **Frontend restringido**: El frontend no puede recalcular importes persistidos libremente. Solo puede:
  - mostrar valores persistidos,
  - recalcular simulaciones explícitas mediante helpers comunes aprobados.
- **Prohibiciones expresas**:
  - usar `float` o `Number` como base de verdad para importes persistidos,
  - usar `toFixed()` o `Math.round()` como regla económica operativa,
  - multiplicar ad hoc `precio * cantidad` o `precio * cantidad * rendimiento` en módulos críticos fuera de la utilidad común.
- **Campos preferentes**:
  - usar `subtotal` persistido cuando exista,
  - usar `precio_congelado` antes que el precio maestro si el flujo requiere reconstrucción operativa,
  - distinguir siempre entre valor `operativo` y valor `simulado`.
- **Módulos críticos sujetos a auditoría obligatoria**:
  - `Presupuesto`
  - `Tanteo`
  - `EDT Valorada`
  - `APUs`
  - `Editor APU de Presupuesto`
- **Cronogramas**:
  - toda distribución persistida debe cerrar exactamente al `100%`,
  - la normalización debe hacerse por helper oficial y nunca con balanceos ad hoc fuera de la política común.
- **Desagregación**:
  - los pesos relativos y VAE deben derivarse de `precio_total` y `subtotal` persistidos.
- **Fórmula Polinómica**:
  - la agregación de recursos debe usar costo operativo persistido del APU (`subtotal` / `precio_congelado`) y no `precio` maestro mutable del recurso.
- **Cumplimiento técnico**: La política debe estar respaldada por pruebas automáticas. Si un módulo crítico vuelve a salirse de la utilidad común, la suite debe fallar.

### 4.2.3.3 Selectores OmniClass

Los selectores OmniClass de `Recursos`, `Subcategorías` y `APUs` deben comportarse como capacidad transversal, no como widgets aislados:

- **Tabla Centralizada**: El mapeo `categoría -> tabla OmniClass` debe salir de una utilidad común. No se deben duplicar reglas distintas por pantalla.
- **Precarga al Abrir**: Al desplegar el selector, deben mostrarse opciones base relevantes aunque el usuario aún no haya escrito.
- **Búsqueda Sobre la Tabla Correcta**: El label visible de tabla y la consulta real deben coincidir siempre.
- **Español Persistido con Fallback**: Si OmniClass dispone de `titulo_es`, la UI debe priorizarlo. Si no existe, debe caer al título original sin romper búsqueda ni selección.
- **Modal Único de Recurso**: Si la ficha de un recurso se abre desde `Recursos` o desde `APUs`, debe reutilizar exactamente el mismo modal y el mismo orden de campos.
- **Unidad y Precio Alineados**: En ese modal unificado, `Unidad de Medida` debe leerse como `abreviatura - nombre completo`, y el precio debe abrirse/editarse con la precisión monetaria vigente del contexto.
- **OmniClass Contextual también en Recurso**: En el modal compartido de recurso, OmniClass no debe ocupar una banda fija del formulario. Debe abrirse como acción contextual junto a `Unidad de Medida`, replicando la estrategia de ocultamiento ya usada en `APUs`.
- **Gobernanza por Empresa**: `OmniClass` debe vivir como preferencia global de empresa en `Ajustes > Preferencias de Aplicación`. Si está apagado, la UI no debe exponer selectores, chips ni columnas OmniClass, y backend/reportes deben ignorar cualquier dato OmniClass entrante o heredado.

### 4.2.3.4 Plantillas Excel de Reportes

Las plantillas Excel activas del sistema se dividen en dos familias y no deben mezclarse:

- **Plantillas planas**: `Presupuesto`, `EDT`, `VAE Proyecto`, `Polinómica`, `EDO`, `Stakeholders` y `Cronograma` usan el motor genérico de tabla plana con una fila marcador homogénea.
- **Plantillas categorizadas APU**: `Analisis - APUS` usa bloques separados por categoría (`1..4`) y placeholders específicos por ítem y subtotal.

Reglas obligatorias:

### 4.2.3.5 Búsqueda Global en Recursos

La búsqueda principal de `Recursos` debe comportarse como un localizador global del maestro y no como un filtro local de la subcategoría abierta:

- **Cobertura Global de Base**: si el usuario escribe una coincidencia textual, la búsqueda debe inspeccionar todos los recursos del `base_trabajo` activo, sin limitarse a la subcategoría seleccionada.
- **Ruta Visible de Resultado**: cada resultado debe exponer contexto suficiente para identificarlo, al menos `categoría -> subcategoría -> recurso`.
- **Búsqueda Posicional**: al seleccionar un resultado, la UI debe reencuadrar automáticamente la vista en la categoría, la subcategoría y el recurso real; no debe quedarse como una lista paralela aislada.
- **Listado Principal Estable**: la búsqueda global no debe vaciar ni sustituir el listado principal de la subcategoría activa; su función es localizar y reposicionar.

### 4.2.3.6 Subcategorías con Orden Persistente

El catálogo de `Subcategorías` debe mantener un orden operativo explícito y compartido por todas las superficies que lo consumen:

- **Columna Única Obligatoria**: el listado principal de `Subcategorías` debe renderizarse siempre en una sola columna para priorizar descripción, código y estado sin repartir el catálogo en dos carriles.
- **Orden Oficial Persistido**: el orden visible no puede depender del código ni de la carga puntual del frontend; debe persistirse en backend mediante un campo de orden entre hermanos.
- **Drag & Drop entre Hermanos**: arrastrar y soltar una fila sobre otra en la categoría activa debe reordenar hermanos y persistir la nueva secuencia.
- **Consumo Compartido**: `Recursos`, `APUs` y cualquier otra vista que lea `subcategorias-items` debe respetar el mismo orden persistido; queda prohibido reordenar localmente por `codigo` si existe orden explícito.
- El reporte APU Excel debe resolver por categoría y fila: `#CODCATn`, `#DESCRIPCIONn`, `#UNIDADn`, `#CANTIDADn`, `#PRECIO n`/`#PRECIO n`, `#RENDIMIENTOn`, `#SUBTOTALn`, `#PORCENTn`, `#OMNICLASS_CODn`, `#OMNICLASS_TITn`.
- El reporte APU Excel debe resolver por categoría: `#TOTALn` y `TOTPORCENTn`.
- Los porcentajes relativos del reporte APU Excel deben calcularse contra `costo_directo`.
- La presentación del reporte APU en Excel y PDF debe usar `decimales_moneda` para importes y porcentajes, y `decimales_calculos` para rendimiento y valores técnicos.
- Si una plantilla APU no trae físicamente `OmniClass Cod` y `Clasificación` en todas las categorías, la generación debe extender esas columnas dinámicamente antes del relleno.
- El motor genérico no debe aceptar una plantilla categorizada tipo APU; si detecta esos placeholders, debe rechazar la ejecución de forma explícita.

### 4.2.3.5 Política Transversal de Decimales en Reportes

La política de decimales no es exclusiva de `APU`. Todo reporte activo con salida numérica sensible debe seguir estas reglas:

- **`decimales_moneda`**: gobierna importes monetarios y porcentajes de presentación.
- **`decimales_calculos`**: gobierna cantidades técnicas, rendimientos, coeficientes y métricas no monetarias.
- **Excel y PDF Consistentes**: `preview PDF` y `export Excel` deben presentar la misma política decimal.
- **Auditoría antes de tocar**: si un reporte no expone datos numéricos sensibles o no tiene ruta activa en `reporting.py`, debe cerrarse por auditoría y no por cambio cosmético.

### 4.2.4 Portable Workspace Mode: Shell y Headers

Cuando el sistema opere en modo portátil o ancho intermedio, la shell global y los headers locales deben comprimirse para maximizar área útil de trabajo:

- **Banner de Resolución Compacto**: El aviso de resolución no debe vivir como franja completa fija en portátil. Debe integrarse como indicador compacto en la shell global o poder descartarse sin consumir una fila estructural.
- **Header Global Reducido**: La barra principal debe bajar altura, reducir gaps y condensar contexto operativo, perfil y acciones sin perder acceso funcional.
- **Contexto Prioritario, No Decorativo**: Empresa y base activa siguen visibles, pero en versión resumida y de una sola línea cuando el viewport lo exija.
- **Headers Locales Más Bajos**: Los módulos operativos deben reducir padding vertical, bloques superiores y tarjetas de contexto antes de sacrificar el área central de trabajo.
- **Footers Fijos Compactos**: Totales y métricas fijas deben adelgazar en portátil; si no caben con dignidad, deben resumirse antes que robar altura estructural.

### 4.2.5 Portable Workspace Mode: Paneles Laterales

En modo portátil, los paneles laterales densos deben dejar de comportarse como columnas fijas permanentes:

- **Colapso por Defecto**: Sidebars técnicos como catálogos, árboles auxiliares o paneles de apoyo deben arrancar colapsados si el viewport entra en rango portátil.
- **Contexto Bajo Demanda**: El usuario debe poder reabrir el panel mediante un control claro de `expandir/contraer`, pero la prioridad inicial es el área central de trabajo.
- **Overlay para Paneles de Apoyo**: Paneles como `Tanteo` o equivalentes analíticos pueden mostrarse como overlay lateral en portátil para no reducir el ancho útil estructural del editor principal.
- **Rail Mínimo Aceptable**: Si un panel colapsado permanece visible, debe hacerlo como rail estrecho con control explícito, no como columna semivacía.
- **Sin Bloqueo del Flujo Central**: El layout no debe exigir tener dos paneles abiertos a la vez en portátil salvo que el usuario lo fuerce.

### 4.2.5.1 Excepción Operativa: Catálogo del Editor APU

El panel izquierdo del editor/creador APU sigue una regla operativa específica:

- **Abierto por Defecto**: El catálogo de recursos debe abrirse al entrar al editor, incluso en portátil.
- **Colapso Solo por Decisión del Usuario**: No debe autocerrarse tras añadir recursos ni por densidad de viewport.
- **Hover de Recuperación**: Si el usuario lo plegó manualmente, al pasar el ratón por el rail debe desplegarse temporalmente.
- **Retorno Automático**: Si el despliegue fue por hover, al salir el ratón debe volver a plegarse.

### 4.2.6 Sin Override Manual de Modo Portátil

El `Portable Workspace Mode` no debe exponerse como función manual del header ni como preferencia persistente de usuario:

- **Sin Control Visible**: Ningún rol debe ver un botón o acción `Portátil` para forzar el layout.
- **Sin Persistencia Local**: No se debe guardar un override de modo portátil en `localStorage` ni reactivarlo entre sesiones.
- **Responsive Real**: Las pantallas que necesiten compactación deben responder al ancho/alto efectivo del módulo o contenedor, no a una función global forzada.
- **Compatibilidad Legacy Inerte**: Si existen helpers técnicos heredados para este override, deben permanecer sin efecto hasta su retirada segura por limpieza focal.

### 4.2.7 Ergonomía del Gráfico EDT/EDO

- **Paneo Sin Autoscroll de Navegador**: dentro del lienzo gráfico de `EDT/EDO`, el botón central debe mover solo el viewport del diagrama. El navegador no debe entrar en modo autoscroll ni desplazar la página completa mientras el cursor está sobre el gráfico.
- **Paneo por Fondo Vacío**: en la vista gráfica de `EDT/EDO`, mantener pulsado el botón izquierdo sobre una zona vacía del lienzo debe permitir panear el viewport. Esta interacción no debe activarse al pulsar sobre nodos o controles.
- **Scroll Horizontal Bajo Demanda**: la barra horizontal del gráfico `EDT/EDO` solo debe aparecer cuando el contenido visible desborde realmente el viewport, ya sea por zoom o por anchura efectiva de nodos/ramas. Queda prohibido forzarla con `min-width` artificial del workspace.
- **Márgenes Alineados con Cronogramas**: `EDT` y `EDO` deben reutilizar la misma densidad base que `Cronogramas` para tarjetas operativas principales: padding contenido (`p-4`) y radios medios (`1.25rem`) antes de abrir márgenes más grandes.
- **Prioridad del Lienzo**: cualquier ajuste futuro en la vista gráfica debe seguir favoreciendo altura y ancho útiles del área de trabajo sobre encabezados y contenedores decorativos.
- **Header Operativo Unificado**: la cabecera del gráfico debe resolverse en una sola banda compacta que combine título, controles primarios, búsqueda y micro-métricas antes de abrir nuevas franjas.
- **Micro-Métricas Horizontales**: `Vista`, `Hitos/Cuentas`, `Responsables`, `Raíces` y `Profundidad` deben expresarse como bloques bajos en una sola fila desplazable, no como tarjetas altas apiladas.
- **Acordeones Informativos Delgados**: `Vista navegable`, `Ruta activa`, `Filtros y raíces` y `Leyenda visual` deben usar padding mínimo y permanecer plegables por defecto para no robar altura estructural al lienzo.
- **Sin Bandas Informativas Redundantes**: si una franja del gráfico no incorpora acción operativa real y solo repite una ayuda de uso, debe eliminarse en lugar de conservarse como bloque estructural.
- **Acciones de Selección Integradas**: en `EDT` y `EDO`, las acciones derivadas de selección (`Mover`, `Eliminar`, `Limpiar selección`) deben integrarse como labels o pills compactas dentro del header operativo. Quedan prohibidas barras flotantes oscuras ajenas al lenguaje visual del sistema.
- **Scroll Encapsulado**: `EDT` y `EDO` no deben vivir bajo un `main` con scroll vertical general cuando estén en modo de trabajo técnico. El padre del módulo debe usar `overflow-hidden`, y el scroll debe quedar encerrado en la superficie interna (`h-full`, `min-h-0`, `flex-1`) para evitar autoscroll residual del navegador.
- **Auto Hover Persistente en Presupuesto**: el catálogo lateral izquierdo de `Presupuesto` debe respetar siempre el colapso manual con reapertura temporal por hover, independientemente de la resolución. La resolución no puede decidir por sí sola el estado base del lateral.
- **Exclusión con Tanteo en Presupuesto**: si el catálogo lateral izquierdo de `Presupuesto` se abre, por click o por hover, el panel `Tanteo` debe cerrarse en cualquier resolución. Del mismo modo, seleccionar una línea APU debe abrir `Tanteo` directamente sin depender solo de efectos secundarios de render.
- **Tanteo Desplaza, No Tapa**: en `Presupuesto`, el panel `Tanteo` debe comportarse como panel lateral real y reducir el ancho disponible del editor; no debe superponerse encima de la grilla porque oculta las variaciones en tiempo real.
- **Excepción por Campo Editable**: la apertura automática de `Tanteo` aplica al click de selección sobre la línea APU, pero no al interactuar con controles editables embebidos de la línea, como el input de `Cantidad`.
- **Separación Estructura vs Partidas en Presupuesto**: en el editor de `Presupuesto`, la banda de partidas debe excluir únicamente las filas estructurales sincronizadas desde `EDT` identificadas por `tipo = CUENTA_PAQUETE`. No se debe usar `apu_id` nulo como criterio único de exclusión, porque puede existir legado operativo sin ese vínculo poblado.
- **Misma Regla en Backend**: cualquier sincronización o saneamiento `EDT -> Presupuesto` debe usar la misma señal (`tipo = CUENTA_PAQUETE`) para filas estructurales. Queda prohibido volver a tratar `apu_id = null` como sinónimo universal de estructura.
- **Exclusión Mutua Real en Presupuesto**: la convivencia entre catálogo izquierdo y `Tanteo` debe resolverse por intención explícita del usuario. Queda prohibido reabrir `Tanteo` desde efectos pasivos basados únicamente en `selectedLineId` si el catálogo acaba de reclamar el foco visual.
- **Semántica de Drop en Presupuesto**: arrastrar una línea operativa sobre una cuenta `EDT` debe insertarla al final de las partidas operativas de ese capítulo. Arrastrarla sobre otra línea operativa debe insertarla justo después de esa línea.
- **Unicidad de APU por EDT**: dentro de un mismo `EDT` no pueden convivir dos líneas operativas con el mismo `apu_id`. Si un movimiento deposita una línea en un capítulo donde ese `APU` ya existe, la política oficial es sumar `cantidad_existente + cantidad_movida`, recalcular subtotales/totales y eliminar la línea origen.
- **Aviso Operativo por Suma**: cuando una línea movida se fusione por coincidencia de `apu_id` en el mismo `EDT`, la UI debe mostrar un aviso temporal no bloqueante. El mensaje debe usar formato operativo completo: `Cod APU - Descripción - Unidad : Cantidad Inicial + Cantidad movida = Cantidad total`, respetando siempre los decimales del proyecto.
- **Cantidad como Campo Primario Editable**: en las líneas de `Presupuesto`, `Cantidad` debe verse inequívocamente editable mediante contraste visual superior al de `P. Unit.`. Al enfocar el control, el valor completo debe quedar seleccionado.
- **Navegación Vertical de Cantidades**: si el usuario está editando `Cantidad`, `ArrowUp` y `ArrowDown` deben mover la edición a la cantidad de la línea superior o inferior y dejar el nuevo valor completamente seleccionado, emulando flujo de hoja de cálculo.
- **Navegación Solo por Inputs Editables**: en `Presupuesto`, la navegación vertical de `Cantidad` debe seguir exclusivamente la secuencia real de inputs editables. Las filas estructurales provenientes de `EDT` no pueden interrumpir ni desviar el recorrido.
- **Cantidad con Formato Diferido**: en `Presupuesto`, el input de `Cantidad` no debe forzar todos los decimales durante la escritura. El completado de precisión del proyecto ocurre únicamente al confirmar la edición o al navegar a otra línea.
- **Cantidad con Tono Económico Neutro**: el input de `Cantidad` en `Presupuesto` debe mantener affordance de edición, pero su caja base debe permanecer cercana al tratamiento visual neutro de `Subtotal`. Queda prohibido sobrerrepresentarlo con una mancha cromática que compita con métricas económicas o parezca un badge de precio.
- **Tanteo por Rendimiento, No por Tarifa**: en `Presupuesto`, el simulador `Tanteo` debe operar sobre el `rendimiento` de cada línea del `APU`. Queda prohibido reutilizar ese flujo para editar o persistir directamente `precio` del recurso.
- **Persistencia de Tanteo en APULínea**: la aceptación del `Tanteo` debe guardarse contra la línea del `APU` (`apu_lineas`) y no contra el maestro `recursos`. La reversión debe restaurar el rendimiento original y recalcular APU y presupuesto en cascada.
- **Decimales de Proyecto en Tanteo**: los inputs de `Tanteo` deben mostrar siempre la precisión de cálculo del proyecto, incluso cuando la parte decimal sea cero.
- **Lienzo Virtual de Trabajo**: el gráfico no debe depender solo del tamaño natural del árbol para permitir movimiento. Debe disponer de un lienzo virtual mayor que el contenido para que el paneo tenga valor operativo incluso en jerarquías pequeñas.

## 5. Consistencia en Módulo

- **Headers:** Todos los módulos deben tener un header con:
  1. Breadcrumb o botón de "Volver" (`ArrowLeft`).
  2. Título en `font-black uppercase`.
  3. Subtítulo descriptivo en naranja (`--primary-orange`).
  4. Barra de búsqueda y botones de acción alineados a la derecha.

- **Tablas/Listas**:
  - Usar `motion.div` de `framer-motion` para transiciones suaves al cargar o filtrar.
  - Los items deben tener bordes redondeados pronunciados (`rounded-[1.5rem]`).
  - Efectos de hover sutiles (ligero cambio de borde).

- **Alineación y Contenedores (Layout Alignment)**:
  - **Identidad de Navegación**: Los headers, breadcrumbs y títulos de sección deben estar **siempre alineados a la izquierda**, respetando el padding lateral estándar (`px-8` o similar).
  - **Evitar Centrado**: No se deben utilizar contenedores de ancho máximo centrados (`max-w-* mx-auto`) para elementos de navegación o cabeceras, ya que rompen la continuidad visual con el sidebar y el contenido del aplicativo.
  - **Consistencia**: El contenido principal debe fluir desde la izquierda para mantener una lectura natural en sistemas de gestión de datos.

---

## 5.1 Identidad de Bases de Trabajo

Para evitar confusiones entre plantillas globales y bases específicas de obra, se deben usar temas de color estrictos:

| Tipo de Base | Nombre Público | Color Primario | Hover / Gglow | Uso |
| :--- | :--- | :--- | :--- | :--- |
| **Base Maestra** | "Base Maestra" | `#F39200` (Naranja) | `hover:border-orange-400` | Plantillas estándar, presupuestos base. |
| **Base de Proyecto** | "Base de Proyecto" | `#3B82F6` (Azul) | `hover:border-blue-400` | Bases exclusivas de una obra/revisión. |

### Reglas de UI:
1.  **Badges**: Usar el color correspondiente según el tipo.
2.  **Iconografía**: El icono de la base debe cambiar al color del tema cuando el ratón está encima (*hover*).
3.  **Terminología**: Queda prohibido el término "Base Padre". Debe usarse siempre "Base Maestra".

---

## 6. Estándar de Direcciones y Selección Geográfica

Para garantizar la integridad de los datos de ubicación, se debe seguir una lógica jerárquica y dinámica:

- **País:** Selección mediante `SearchableSelect`. "Ecuador" es el caso base para validaciones adicionales.
- **Ecuador (Caso Especial):**
    - Se deben cargar dinámicamente las **Provincias** y **Cantones** utilizando `maestrosApi`.
    - Al cambiar el país a Ecuador, se deben limpiar los campos de provincia y cantón.
    - Al cambiar la provincia, se deben cargar los cantones correspondientes y limpiar la selección anterior de cantón.
- **Otros Países:** Los campos de provincia/región y ciudad/cantón pasan a ser de texto libre (`Input`).

---

## 6.1 Estándar de Formato Telefónico

Para garantizar la interoperabilidad y claridad en comunicaciones internacionales, todos los teléfonos corporativos deben seguir el estándar E.164 simplificado:

- **Formato Visual:** `+CC XXXXXXXXX` (donde CC es el código de país).
- **Obligatoriedad:** El teléfono principal de la empresa es un campo **requerido**.
- **Normalización:** El sistema debe limpiar ceros a la izquierda innecesarios (común en Ecuador) antes de anteponer el prefijo.
- **Implementación:** Reutilizar `formatInternationalPhone` de `src/utils/phoneFormatter.js`.

### Implementación en Formularios
1. Importar `maestrosApi`.
2. Usar `useEffect` para reaccionar a cambios en `pais` y `provincia`.
3. Utilizar `SearchableSelect` para todas las listas desplegables geográficas.

---

> [!IMPORTANT]
> Este libro de estilo es de **obligada consulta**. Cualquier nuevo desarrollo debe heredar estas pautas para mantener la armonía del sistema GiProy.
## SIRIS-CID: Sistema de Identificación por Colores

Para mejorar la legibilidad y la estructura jerárquica de los códigos en el módulo de Precios Unitarios (PU), se utiliza un sistema de tres colores (SIRIS-CID).

### Paleta CID

| Segmento | Rol | Color | Hex | Tailwind |
| :--- | :--- | :--- | :--- | :--- |
| **Principal** | Categoría Global / Prefijo | Naranja SIRIS | `#F39200` | `text-[#F39200]` |
| **Referencia** | Subcategoría / Agrupador | Azul SIRIS | `#3B82F6` | `text-blue-500` |
| **Secuencial** | Identificador Final | Púrpura SIRIS | `#A855F7` | `text-purple-500` |

### Aplicación por Tipo de Código

#### 1. Subcategorías (`C-SSS`)
*   **C** (Categoría): Naranja
*   **SSS** (Secuencial): Púrpura
*   *Ejemplo:* <span style="color:#F39200">1</span>-<span style="color:#A855F7">001</span>

#### 2. Recursos (`C-SSSS-RRRRR`)
*   **C** (Categoría): Naranja
*   **SSSS** (Subcategoría): Azul
*   **RRRRR** (Secuencial): Púrpura
*   *Ejemplo:* <span style="color:#F39200">1</span>-<span style="color:#3B82F6">0001</span>-<span style="color:#A855F7">00001</span>

#### 3. APUs (`PRE-XXXX`)
*   **PRE** (Prefijo/Tipo): Naranja
*   **XXXX** (Secuencial): Púrpura
*   *Ejemplo:* <span style="color:#F39200">APU</span>-<span style="color:#A855F7">0001</span>

### Implementación en React
Utilizar el componente `CodeColorizer` para asegurar la consistencia. No aplicar estilos `ad-hoc` en los módulos.

## 7. Identidad Visual de Secciones en Proyecto

Para facilitar la navegación dentro de un proyecto, cada sección tiene asignado un color identificador obligatorio:

| Sección | ID | Color | Clase Tailwind (Icono/Indicator) |
| :--- | :--- | :--- | :--- |
| **Datos del proyecto** | `datos` | Naranja SIRIS | `text-[#F39200]` / `bg-[#F39200]` |
| **Stakeholders** | `stakeholders` | Púrpura | `text-purple-500` / `bg-purple-500` |
| **EDO / OBS** | `edo_obs` | Azul Blueprint | `text-[#136191]` / `bg-[#136191]` |
| **EDT / WBS** | `edt_wbs` | Verde Esmeralda | `text-emerald-500` / `bg-emerald-500` |
| **Presupuesto** | `presupuesto` | Oro / Ámbar | `text-amber-500` / `bg-amber-500` |
| **Cronogramas** | `cronogramas` | Azul Cielo | `text-sky-500` / `bg-sky-500` |
| **Desagregación** | `desagregacion` | Indigo | `text-indigo-500` / `bg-indigo-500` |
| **Fórmula Polinómica** | `formula` | Rose / Rosa | `text-rose-500` / `bg-rose-500` |

### Reglas de Aplicación:
1. **Icono**: El icono de la sección en el sidebar/menú debe usar el color asignado.
2. **Indicador Activo**: El "dot" o línea de sección activa debe reflejar este color.
3. **Consistencia**: No se deben alterar estos colores sin actualizar este libro de estilo.

---

## 8. Estructuras de Árbol (Tree Views)

Al desarrollar componentes jerárquicos interactivos (como la Estructura de Desglose Organizacional EDO o EDT), se debe abandonar la estética de "tarjetas flotantes" a favor de un diseño tabular compacto y listado iterativo, priorizando la legibilidad técnica:

### 8.1 Layout y Jerarquía Visual
- **Estructura Tabular**: Usar contenedores anchos donde los datos fluyen en bloque (tipo tabla).
- **Código Fijo**: La columna de codificación jerárquica (ej. `1.1.2`) debe ir siempre alineada a la izquierda, con fuente `font-mono`, `font-bold` y `tracking-wider`.
- **Líneas Guía (Indentation)**: Los hijos deben desplazarse hacia la derecha utilizando márgenes dinámicos (`marginLeft: level * 1.5rem`), acompañados de una línea guía vertical (`border-l border-dashed border-slate-300`) que identifique claramente su nodo padre.

### 8.2 Diferenciación de Tipos de Nodos
- Identificar cláramente la naturaleza de un nodo mediante:
  1. Íconos distintos (ej. `Folders` vs `UserCog` / `UserPlus`).
  2. Colores de acento diferenciados en el borde izquierdo (`border-l-4`) y textos principales (ej. Azul Blueprint para elementos contenedores/hitos, y Púrpura para hojas/asignaciones).
  3. Para los nodos "hoja" (como usuarios asignados), mostrar campos secundarios relevantes (como el "Rol") en forma de etiquetas sub-compactas (ej. `text-[10px] uppercase font-bold tracking-widest bg-purple-100`).

### 8.3 Interacción y Experiencia de Usuario (UX)
- **Acciones On-Hover**: Para no saturar la vista, los botones de acción CRUD (Añadir, Editar, Eliminar) deben estar alineados a la derecha y con opacidad en `0` o `20%`, revelándose (`group-hover:opacity-100`) solo cuando se posiciona el ratón sobre la fila activa.
- **Edición Rápida**: Habilitar el manejador `onDoubleClick` sobre la fila completa (Row) para lanzar el Modal de edición de manera ágil sin requerir buscar el botón de "Editar".
- **Ordenamiento (Drag & Drop y Flechas)**: 
  - Soportar el arrastre gráfico HTML5 (Drag & Drop iconizado con `GripVertical`).
  - **Obligatorio**: Complementar siempre el API Drag & Drop con botones explícitos de reordenamiento ("Mover Arriba" ⬆️ / "Mover Abajo" ⬇️) en el menú de acciones, asegurando así precisión milimétrica al reordenar nodos al mismo nivel (hermanos).
### 8.4 Gestión de Grandes Volúmenes de Datos (Scroll Interno)
Para evitar que la página principal crezca indefinidamente y se pierda el contexto de navegación, se deben aplicar las siguientes reglas en secciones con listados extensos:
- **Contenedores con Scroll**: Los datos deben estar contenidos en un div con `max-height` (ej. `calc(100vh - 400px)`) y la clase `overflow-y-auto`.
- **Cabeceras Sticky**: Los encabezados de tablas (`thead`) o descriptores de árboles deben usar `sticky top-0 z-20` para permanecer siempre visibles mientras el usuario se desplaza por los datos.
- **Fondo de Cabecera**: Aplicar `bg-white/90` con `backdrop-blur-sm` a las cabeceras sticky para asegurar legibilidad sobre los datos que pasan por debajo.

### 8.5 Foco de Atención (Auto-Focus)
Al crear un nuevo elemento (Stakeholder, Hito, Paquete de Trabajo), el sistema debe asegurar que el usuario localice inmediatamente su creación:
- **Scroll Automático**: Tras una creación exitosa, se debe ejecutar `element.scrollIntoView({ behavior: 'smooth', block: 'center' })` sobre el nuevo nodo o fila.
- **ID Único**: Cada fila o nodo del árbol debe poseer un atributo `id` único (ej. `id={`edo-node-${node.id}`}`) para permitir la referencia directa desde el DOM.
- **Estado de Limpieza**: El ID de referencia (`lastAddedId`) debe limpiarse inmediatamente después de ejecutar el desplazamiento para evitar comportamientos erráticos en re-renderizados posteriores.

## 9. Patrones de Confirmación y Seguridad de Datos

### 9.0 Diálogos del Navegador
Queda prohibido en frontend productivo el uso de:
- `window.alert`
- `window.confirm`
- `window.prompt`

Reglas obligatorias:
- Los avisos y confirmaciones deben pasar por la capa común de diálogos del producto.
- Las confirmaciones simples deben usar el modal técnico compartido del sistema, con tipografía, espaciado y botones alineados con GiProy.
- Las acciones destructivas críticas deben seguir usando doble confirmación según la sección `9.1`.
- Las entradas cortas de texto no deben abrir diálogos nativos del navegador; se resolverán con compositor inline o modal propio del dominio.
- No se deben introducir confirmaciones o avisos ad-hoc por módulo si ya existe una capa común reutilizable.

### 9.0.1 Shell Visual de Modales
Todo modal del producto debe reutilizar una shell visual compartida. Queda prohibido crear overlays, paneles y cabeceras ad-hoc si ya existe un componente base reutilizable.

Reglas obligatorias:
- Los modales funcionales del producto deben montar sobre la shell común (`app-modal` o equivalente vigente), con overlay, panel, header, body y footer consistentes.
- El overlay debe ser uniforme, con oscurecimiento y blur suave; no se deben mezclar variantes arbitrarias por módulo.
- El panel debe mantener radios amplios, borde técnico fino, fondo claro del sistema y jerarquía visual coherente con GiProy.
- La cabecera debe seguir un patrón común: icono opcional, título técnico, subtítulo breve si aporta contexto y cierre alineado a la derecha.
- El footer debe mantener el patrón del sistema para acciones primarias/secundarias; no deben aparecer agrupaciones ni estilos de botones improvisados por modal.
- En los modales de `Analisis de Precio` / `Precios Unitarios`, el footer debe usar botones de accion solo con iconos visibles. Cada boton debe incluir `title` y `aria-label` descriptivos; no se deben mostrar textos como `Cancelar`, `Actualizar`, `Confirmar` o similares dentro del boton.
- Los modales funcionales que conviven con el header operativo deben montar con un z-index superior al header (`z-[1000]` o token equivalente) y centrarse en viewport salvo que el libro de estilo defina una excepcion concreta.
- Si un modal necesita una variante de tamaño, esta debe salir de la propia shell compartida y no de clases copiadas localmente.
- En modales técnicos del módulo Proyectos, las acciones de cierre/confirmación deben reutilizar `ProjectSectionIconButton` con `AppHint`; no se deben crear botones nativos paralelos para iconos de footer. El hover, foco y activo deben ser iguales entre acción secundaria y primaria, cambiando solo el tono/acento.
- Si el modal permite alternar modo o tipo de operación, usar el selector real `ProjectSegmentedSwitch` en cabecera cuando haya espacio. Las etiquetas no deben partirse en dos líneas; si son largas, aumentar `minSegmentWidth`, abreviar el `label` visible y conservar el texto completo en `title`.
- Los modales con contenido condicional por modo deben conservar altura estable. El cambio de modo debe ajustar controles dentro del cuerpo con scroll interno, no redimensionar el panel completo.

### 9.0.1.1 Densidad y Ritmo Interno de Modales
La shell compartida no basta por sí sola. Los cuerpos de modal deben mantener también un ritmo interno homogéneo, técnico y compacto.

Reglas obligatorias:
- El cuerpo del modal debe trabajar con un padding amplio pero controlado, evitando tanto bloques apelmazados como superficies vacías exageradas.
- La separación entre header, body y footer debe ser estable; no se deben mezclar modales con transiciones bruscas entre secciones.
- Los formularios dentro de modales deben usar densidad media/compacta: labels pequeñas, campos alineados y gaps consistentes.
- Los bloques internos deben seguir una jerarquía clara:
  - banda de estado o contexto, si aplica
  - métricas o resumen, si aplica
  - zona de trabajo o formulario principal
  - acciones finales
- Las bandas de estado no deben ocupar una altura hero innecesaria; deben ser informativas y compactas.
- Las grids de métricas dentro de modales deben priorizar lectura rápida, con cards o bloques uniformes y sin alturas dispares arbitrarias.
- Los textos auxiliares y subtítulos deben ser breves; no se debe compensar un layout flojo con párrafos largos.
- Las tablas o listados dentro de modales técnicos deben usar filas compactas, cabeceras limpias y scroll interno antes de hacer crecer el modal verticalmente.
- El footer debe respirar respecto al cuerpo, pero sin parecer desacoplado; las acciones deben sentirse como cierre natural del flujo.

Patrón recomendado:
- `header` compacto técnico
- `body` con padding uniforme
- gaps verticales consistentes entre bloques
- formularios con labels en uppercase compacta
- acciones finales alineadas y visualmente estables

Regla de decisión:
- Si el modal contiene una sola acción breve, priorizar composer inline o layout corto.
- Si el modal contiene análisis técnico o tabla, priorizar densidad y scroll interno antes que aumentar altura de forma indiscriminada.

### 9.0.1.1.1 Marketplace Interno Clasico
Las pantallas internas de Marketplace (`Mis ventas`, `Mis compras` y `Panel administrador`) deben seguir la misma linea de modales y controles de Proyectos, sin afectar el catalogo publico ni el detalle publico de items.

Reglas obligatorias:
- El catalogo publico de Marketplace y la ficha publica de producto quedan fuera de esta piel interna salvo TASK explicita.
- Los dashboards internos deben aplicar una piel encapsulada, por ejemplo `marketplace-internal-page`, para no contaminar el frontend publico de venta de items.
- Los modales internos deben usar `AppModalShell`, `AppModalHeader`, `AppModalBody` y `AppModalFooter`; el header debe ir en piel oscura y el body/footer en superficie clara compacta.
- Los accesos recurrentes de cabecera y footer deben usar `ProjectSectionIconButton` con `AppHint`, no botones textuales improvisados.
- Las acciones por fila o card interna (`editar`, `clonar`, `activar`, `pausar`, `borrar`, `factura`, `devolucion`) deben ser iconograficas con `ProjectSectionIconButton`; el texto explicativo vive en el `AppHint`.
- Los botones textuales se reservan para submit/cancel de formularios o CTAs de componentes tipificados ya existentes.
- Los cambios de modo excluyentes deben usar `ProjectSegmentedSwitch`.
- Los listados internos deben priorizar filas/cards compactas, microsemaforos y scroll interno antes que cards tipo hero.
- Los datepickers, selects y scrollbars deben mantenerse en los componentes tipificados vigentes (`AnimatedDateInput`, `AnimatedSelect`/`SearchableSelect`, `MotionScrollbar`).
- Queda prohibido introducir controles nativos visibles (`input[type=date]`, `<select>`) o overlays paralelos en estas secciones.

### 9.0.1.2 Portable Workspace Mode en Modales Técnicos
Los modales analíticos o de configuración densa deben adoptar también el `Portable Workspace Mode`. No se permite conservar layouts de dos paneles rígidos solo porque vivan dentro de un modal.

Reglas obligatorias:
- En portátil, el overlay y el panel deben reducir padding periférico y radio si eso devuelve espacio útil al contenido.
- Las bandas superiores de estado, métricas y filtros deben compactarse antes de quitar área al cuerpo analítico.
- Los paneles laterales técnicos deben pasar a flujo apilado o bloque inferior; no deben seguir robando ancho estructural fijo.
- Las tablas internas de modales técnicos deben degradar a filas compactas de dos niveles cuando el ancho efectivo no permita lectura fiable.
- Los footers de acciones deben poder apilar botones en portátil sin perder jerarquía entre acción principal y secundaria.
- Si el modal contiene árbol o ranking técnico, debe verse primero el dato principal y después el contexto lateral, nunca al revés.

### 9.0.1.3 Portable Workspace Mode en Árboles y Tablas Técnicas
Las vistas operativas de árbol y tabla del proyecto deben seguir también el `Portable Workspace Mode`. No se admite que `EDT`, `EDO`, `VAE`, `Fórmula Polinómica` o equivalentes mantengan cabeceras rígidas y filas pensadas solo para escritorio amplio.

Reglas obligatorias:
- `Portable Workspace` no debe activarse automáticamente por resolución, densidad ni tamaño de ventana. Su activación es explícita y reservada al `Superadministrador`.
- En portátil, la cabecera superior del módulo debe compactarse antes de sacrificar la lectura de filas técnicas.
- Las filas de árbol deben priorizar `código + descripción` y mover metadatos secundarios a una segunda banda o detalle inferior si el ancho no alcanza.
- Las barras de acciones masivas deben poder apilarse en vertical en portátil y no tapar media pantalla.
- Las tablas densas pueden conservar scroll horizontal técnico, pero solo después de compactar padding, cabeceras y bandas superiores.
- Cuando una tabla siga necesitando ancho mínimo, debe declararlo explícitamente con `min-width` controlado y scroll interno, evitando compresión ilegible de texto.
- Los paneles de detalle inferiores o laterales deben envolver métricas y controles; no deben obligar a mantener una sola línea hero en portátil.

### 9.0.1.3.1 Cabeceras Compactas y Rails Horizontales en Dashboards de Servicios
Los dashboards de entrada a familias de módulos o servicios hermanos deben reutilizar la cabecera compacta del sistema y, en portátil, permitir scroll horizontal solo en la banda de cards cuando el ancho no alcance.

Reglas obligatorias:
- La cabecera superior debe seguir el patrón compacto ya usado en superficies recientes:
  - botón de regreso integrado en la barra
  - título técnico en una línea principal
  - subtítulo breve en uppercase con acento corporativo
- Queda prohibido volver a un enlace suelto tipo `Volver al Dashboard` flotando fuera de la barra superior si la superficie ya usa shell moderna.
- Si un grupo de módulos/cards necesita ancho mínimo para conservar legibilidad, no se debe forzar compresión vertical ni mosaicos rotos.
- En esos casos, la banda de módulos debe declararse como rail horizontal con `overflow-x-auto` y cards con `min-width` o ancho fijo controlado.
- El scroll horizontal debe vivir solo en la banda de módulos; el resto de la página no debe adquirir desplazamiento lateral global.
- Cuando el ancho vuelva a ser suficiente, el rail puede degradar a grid normal de escritorio sin duplicar componentes ni markup alterno.
- Dentro de las cards, debe priorizarse identidad del módulo, descripción y estado actual; no se deben añadir bloques placeholder redundantes para llenar altura.

### 9.0.1.4 Vista Gráfica Jerárquica para EDT y EDO
La representación gráfica jerárquica de `EDT` y `EDO` es una vista complementaria al árbol, no un reemplazo de la edición principal.

Reglas obligatorias:
- `EDT` y `EDO` deben abrir inicialmente en vista gráfica.
- La vista árbol debe seguir disponible como modo operativo alternativo sin pasos extra.

Reglas obligatorias:
- Debe existir un toggle claro `Árbol / Gráfico`.
- La vista gráfica debe priorizar lectura, comprensión jerárquica y navegación visual.
- La edición detallada, drag and drop operativo y acciones destructivas deben seguir viviendo principalmente en el árbol.
- Los nodos deben mostrar como mínimo `código`, `nombre` y una línea secundaria de contexto.
- Los conectores deben ser sobrios y legibles; no se admiten líneas decorativas que compliquen la lectura.
- En portátil, la vista gráfica debe degradar a nodos más compactos con scroll horizontal/vertical controlado y zoom reducido.
- Si la estructura es demasiado ancha, la interfaz debe conservar navegación usable mediante scroll y zoom antes que comprimir nodos hasta volverlos ilegibles.
- La selección de nodo en gráfico debe sincronizarse con el módulo y permitir volver al árbol para continuar edición.
- La vista gráfica puede incorporar navegador rápido por nodos raíz y acción `Abrir en árbol`, pero sin convertir el gráfico en un segundo editor completo.
- Si la jerarquía gana profundidad o ancho relevante, la vista gráfica debe exponer minimapa o navegador lateral compacto.
- El gráfico debe permitir expandir y contraer subramas para reducir ruido visual sin perder contexto estructural.
- Los controles globales `Expandir` / `Contraer` son válidos si no desplazan la lectura principal ni convierten la cabecera del gráfico en una toolbar excesiva.
- Las acciones contextuales ligeras del gráfico (`Editar`, `Añadir hijo` u otras equivalentes) solo son válidas si reutilizan el flujo y los modales del árbol. No se debe construir un editor completo paralelo dentro del gráfico.
- Las acciones de selección (`Mover`, `Eliminar`, `Limpiar selección`) deben integrarse en la misma fila técnica del header del gráfico. Quedan prohibidas barras oscuras flotantes o superficies ajenas al lenguaje visual de GiProy.
- La búsqueda del gráfico debe ser posicional y no bloqueante: no debe sustituir el lienzo por resultados filtrados, sino localizar coincidencias dentro de la jerarquía y permitir navegar entre ellas.
- El estado de búsqueda, navegación por coincidencias y breadcrumb de `ruta activa` debe vivir en la misma banda del buscador, no repartirse en filas adicionales.
- Las micro-métricas superiores (`Vista`, `Hitos/Cuentas`, `Responsables`, `Raíces`, `Profundidad`) deben resolverse en una sola franja horizontal compacta, nunca como tarjetas altas apiladas.
- `Filtros y raíces`, `Leyenda visual` y superficies equivalentes deben integrarse en una banda técnica única o permanecer ocultables bajo un control `Resumen`, para no robar altura útil al lienzo.
- La `Leyenda visual` debe ocultarse automáticamente cuando no haya interacción avanzada real. En reposo, el gráfico debe priorizar lienzo y controles esenciales sobre ayudas explicativas.
- Si el minimapa no es contexto permanente imprescindible, debe salir del layout y abrirse como modal o superficie temporal. No debe robar ancho estructural fijo.
- En `EDT`, las tarjetas de `Cuenta` del gráfico deben mostrar `Dir.`, `Val.` y `%` con microchips compactos, alineados con el árbol y sin invadir el bloque principal de título.
- Si existe nodo seleccionado, la vista gráfica debe poder mostrar su `ruta activa` o breadcrumb jerárquico y destacar también la cadena de ancestros, no solo el nodo final.
- La vista gráfica puede añadir filtros ligeros por tipo de nodo y micro-métricas estructurales (`hijos`, `descendientes`) siempre que no rompa la legibilidad ni convierta la superficie en una tabla analítica.
- La capa analítica del gráfico debe seguir siendo ligera y derivada del árbol ya cargado. Si se requieren métricas económicas, estados o KPIs reales, deben modelarse explícitamente y no improvisarse en frontend.
- Se permite una banda de resumen estructural dentro del gráfico siempre que use métricas derivadas del árbol ya cargado y no desplace la superficie principal de lectura jerárquica.
- Si la estructura gráfica gana tamaño, se permite incorporar búsqueda interna y navegación por coincidencias, siempre que la selección, el foco y la reapertura de ramas se mantengan consistentes con el árbol base.
- Si existe nodo activo, la vista gráfica puede ofrecer un modo `Rama activa` para aislar el subárbol del nodo seleccionado. Este modo debe ser reversible, no sustituye la `Vista total` y no debe perder la coherencia con filtros, búsqueda ni minimapa.
- La vista gráfica puede incorporar controles de reencuadre como `Centrar selección` o `Restablecer vista`, siempre que se mantengan compactos y ayuden a recuperar orientación sin convertir la cabecera en una toolbar pesada.
- Si existe minimapa lateral, debe poder colapsarse a un rail técnico estrecho desde un botón de borde y no robar ancho permanente cuando el usuario está centrado en el lienzo principal.
- El paneo con ratón debe quedar restringido al viewport del gráfico; no se admite depender del desplazamiento general de la página cuando el usuario interactúa con el diagrama.
- Antes de hacer crecer un gráfico jerárquico, deben compactarse todas las bandas previas al lienzo para maximizar la altura útil real de la zona de trabajo.
- Las bandas superiores no críticas del gráfico (`vista navegable`, `ruta activa`, `filtros`, resúmenes auxiliares) pueden y deben plegarse cuando el usuario necesita priorizar lienzo. El estado plegado no debe destruir contexto ni acciones; solo compactarlas.
- Si un gráfico permite plegar superficies auxiliares, ese estado puede persistirse por sesión para no obligar al usuario a recomponer su espacio de trabajo en cada entrada.
- El zoom del gráfico puede admitir `Ctrl + rueda` como atajo fino, pero siempre restringido al propio viewport del lienzo y sin secuestrar la navegación del resto de la página fuera de él.
- Si el minimapa deja de ser crítico como contexto permanente, debe salir del layout y abrirse en modal o superficie superpuesta. No debe seguir robando ancho estructural si el usuario está trabajando sobre el lienzo principal.
- Cuando el navegador ofrezca autoscroll con botón central, el gráfico debe bloquearlo dentro de su viewport y reemplazarlo por paneo propio del lienzo.
- La vista gráfica puede añadir una `Leyenda visual` por tipo y estado de nodo siempre que permanezca compacta, técnica y plegable.
- La política de drag & drop del gráfico debe ser explícita y estable:
  - soltar en el `lado izquierdo` del nodo destino: reordenar `antes`
  - soltar en el `lado derecho` del nodo destino: reordenar `después`
  - soltar en la `parte inferior` del nodo destino: convertir en `hijo`
  - soltar en la `parte superior` del nodo destino: no ejecutar movimiento
- Si un hijo se suelta sobre su propio padre, la semántica correcta es `subir de nivel`: el nodo deja de depender del padre y pasa al mismo nivel que él, quedando inmediatamente después.
- Los movimientos del gráfico deben reutilizar siempre el modal genérico de confirmación del sistema (`appConfirm` o equivalente visual del libro de estilo). Queda prohibido usar `confirm()` nativo o modales del sistema operativo.
- El gráfico no debe permitir movimientos ambiguos: reordenar exige compartir padre; anidar exige bloquear ciclos; mover sobre un descendiente propio debe rechazarse.

### 9.0.1.5 EDT como Superficie Única de Estructura + Valoración
Cuando exista presupuesto operativo con líneas APU asociadas al proyecto, `EDT` debe actuar como superficie única de lectura estructural y económica.

Reglas obligatorias:
- En `EDT`, `Costo Directo` debe retirarse únicamente de los chips económicos de los nodos en modo gráfico. El resumen económico y el panel flotante pueden seguir mostrándolo.
- Los subvalores económicos por nodo deben mostrarse directamente dentro de `EDT`, reutilizando la jerarquía ya cargada.
- `Presupuesto` no debe volver a exponer una vista separada o redundante de `EDT Valorada`.
- Si no existe presupuesto operativo o no hay líneas valoradas, `EDT` debe seguir funcionando como árbol puro sin romper la navegación.
- Las métricas económicas integradas en `EDT` deben mantenerse compactas y compatibles con `Portable Workspace Mode`.
- Cualquier agregación económica mostrada en `EDT` debe derivarse del presupuesto operativo real, no de cálculos paralelos improvisados en frontend.
- En `Modo Árbol`, el resumen económico superior debe vivir en una sola línea compacta (`Dir.`, `Ind.`, `Val.`), sin tarjetas informativas altas.
- En `Modo Gráfico`, el resumen económico no debe ocupar una banda fija del header; debe aparecer como panel desplegable dentro del área de trabajo.

### 9.0.1.6 Sincronización EDT -> Presupuesto
Cuando una cuenta EDT cambie de padre, orden o nombre, `Presupuesto` debe resincronizarse automáticamente contra la jerarquía EDT vigente.

Reglas obligatorias:
- El `código EDT` es estructural y posicional. Si una cuenta pasa a depender de `1.1`, su primer hijo debe quedar como `1.1.1`.
- Los nodos `STAKEHOLDER` no deben contaminar la numeración de `CUENTA_PAQUETE`.
- Los `STAKEHOLDER` no forman parte de la sincronización estructural `EDT -> Presupuesto`.
- `Presupuesto` solo debe reflejar y recalcular capítulos/cuentas derivados de nodos `CUENTA_PAQUETE`.
- Los `STAKEHOLDER` no deben crear capítulos, alterar subtotales ni modificar la jerarquía visible de `Presupuesto`.
- `Presupuesto` debe reflejar el `código EDT` vigente en sus filas estructurales de capítulo/cuenta.
- La obtención del presupuesto operativo debe auto-sanar la proyección estructural antes de entregarla si detecta desalineación con la EDT vigente.
- El `código de línea presupuestaria/APU` (`codigo_item`) es un identificador distinto y debe seguir derivándose del código EDT del capítulo más su secuencia interna de partida.
- Queda prohibido mezclar visual o funcionalmente `código EDT` y `código de línea APU` como si fueran el mismo dato.

### 9.0.2 Altas Ligeras Dentro de Modales
Las acciones de creación corta o captura breve que nacen dentro de otro modal no deben abrir un segundo popup del navegador ni un modal visualmente ajeno.

Reglas obligatorias:
- Para altas ligeras (ej. nueva cuenta personalizada, nombre corto, alias, etiqueta), usar compositor inline o panel contextual dentro del propio modal.
- El compositor inline debe respetar tipografía, espaciado, validaciones y botones del sistema.
- Solo se permitirá un modal secundario si la complejidad del formulario lo exige de verdad; en ese caso también debe usar la shell común del sistema.
- Queda prohibido resolver estas acciones con `prompt`, overlays improvisados o cajas flotantes desconectadas del lenguaje visual principal.

### 9.1 Doble Confirmación (Confirmación en Dos Pasos)
Para acciones críticas o irreversibles (Eliminar Proyectos, Limpiar Tanteos Globales, Borrar Bases de Trabajo), se debe utilizar obligatoriamente un sistema de **Doble Confirmación** mediante Modales de Seguridad:

- **Paso 1: Advertencia Inicial**: Presentar un modal con icono de advertencia (`AlertTriangle` en Naranja) explicando las consecuencias e impacto de la acción.
- **Paso 2: Confirmación Final**: Tras aceptar el paso 1, cambiar el modal a un estado de peligro (Icono `Trash2` o similar en Rojo) y requerir una confirmación definitiva con un botón de acción en color Rojo (`bg-red-600`).
- **Implementación**: Utilizar un estado local `deleteStep` (1 o 2) para gestionar la transición dentro del mismo modal.
- **Consistencia Visual**: Los modales deben usar `AnimatePresence` y `framer-motion` para transiciones fluidas de escala y opacidad.

### 9.2 Comunidad
`Comunidad` debe comportarse como un módulo multiempresa contextual, no como una red social abierta sin ámbito.

Reglas obligatorias:
- La entrada normal se ajusta a la empresa activa de sesión.
- `Público` sigue siendo una superficie compartida del producto, pero la experiencia operativa se resuelve siempre contra el contexto activo.
- `Superadmin` administra globalmente, pero no debe arrancar con una vista multiempresa abierta por defecto.
- `Administrador de empresa` administra solo el área interna de su empresa activa.
- `Comunidad` separa tres superficies distintas y no intercambiables: `Público`, `Mi empresa` y `Mensajes directos`.
- `Mensajes directos` no deben presentarse visual ni funcionalmente como publicaciones del foro.
- El rol `usuario_comunidad` existe como rol dependiente de empresa y queda restringido exclusivamente a `Comunidad`.
- `usuario_comunidad` cuenta como usuario no administrativo para licencias y cuotas.
- `Comunidad` puede organizarse por `temas`; un tema puede ser abierto o restringido a usuarios explícitamente autorizados.
- `Comunidad` debe usar una estructura ligera `ámbito -> categoría -> tema -> publicación -> respuesta`; no se deben introducir subcategorías profundas en fase base.
- La membresía restringida de un tema debe poder editarse desde la propia UI administrativa de `Comunidad`; no se debe dejar como operación solo backend.
- Toda publicación debe pertenecer a un `tema`. Queda prohibido publicar hilos “sueltos” fuera de la estructura `categoría -> tema -> publicación`.
- El compositor de `Nueva publicación` debe responder al `tema activo`; si no hay tema seleccionado, la UI debe bloquear publicación y explicar por qué.
- Las publicaciones de `Comunidad` deben exponer sus respuestas sin sacar al usuario del feed; responder y leer conversación forman parte de la misma tarjeta.
- Si el autor puede editar o borrar su propio contenido, esas acciones deben mantenerse como controles compactos dentro de la propia tarjeta o bloque de respuesta, sin abrir una pantalla paralela.
- La autogestión del autor debe ser conservadora: no puede servir para romper hilos ya respondidos ni para saltarse moderación; las reglas finales de tiempo y elegibilidad deben validarse siempre en backend.
- `Comunidad` puede usar menciones básicas `@handle`, pero su validación es siempre backend y contextual.
- En esta fase, una mención de `Comunidad` no abre notificaciones paralelas ni búsqueda global de usuarios. Solo resuelve usuarios válidos del contexto de empresa de origen y, si el tema interno es restringido, únicamente miembros con acceso real.
- La búsqueda de `Comunidad` debe ser contextual a cada superficie (`Público`, `Mi empresa`, `Mensajes directos`) y no invadir el resto del módulo.
- Las herramientas administrativas de `Comunidad` no deben vivir visibles por defecto ni como laterales permanentes del feed. Deben abrirse bajo un `Panel de control` explícito y fuera del flujo normal de lectura.
- Si la administración de `Comunidad` crece, debe reorganizarse como una `Zona administrativa` propia dentro del módulo, separada del feed y con navegación interna por frentes (`Resumen`, `Gobernanza`, `Usuarios`, `Moderación`), en vez de acumular tarjetas sueltas en una sola columna lateral.
- La `Zona administrativa` de `Comunidad` debe concentrar creación de `usuario_comunidad`, usuarios asignados, categorías, temas, sanciones, apelaciones, alertas e infracciones. El feed no debe seguir siendo la superficie donde se “mezcla” operación normal con gobierno del módulo.
- El bloqueo de DM vive en la propia conversación y debe reflejarse tanto en la lista de hilos como en el compositor de mensajes.
- Si un hilo DM fue bloqueado por un usuario, la UI debe indicar quién ejecutó el bloqueo. Solo ese mismo usuario puede reactivar el canal; la contraparte no debe ver un CTA de desbloqueo operativo.
- En `Público` y `Mi empresa`, la lectura del feed es la superficie principal. El compositor de `Nueva publicación` debe comportarse como bloque secundario o lateral y no ocupar la primera banda hero del módulo.
- La entrada principal de `Público` y `Mi empresa` en `Comunidad` debe poder comportarse como `índice de foro`: categorías visibles, temas navegables por bloque, métricas resumidas y última actividad por grupo, antes de abrir el feed de un tema concreto.
- Aunque se tome como referencia un patrón clásico de foros, `Comunidad` debe seguir usando la identidad visual de GiProy: fondos claros, acentos cálidos/azules del sistema, bordes suaves y tipografía consistente con el resto del producto.
- Si el índice del foro marca un bloque o tema activo, esa jerarquía debe percibirse claramente mediante contraste, iconografía y chips/contexto breve; no basta con un cambio mínimo de borde.
- Si `Público` y `Mi empresa` comparten la misma estructura de foro en `Comunidad`, el ámbito activo debe seguir percibiéndose por tratamiento visual, copy y acentos; no deben parecer la misma pantalla genérica con solo un label distinto.
- Los temas visibles en el índice de `Comunidad` pueden mostrar micro-métricas operativas (`posts`, `respuestas`, actividad reciente, fijados`) siempre que no saturen la lectura ni conviertan el bloque en una tabla.
- La navegación principal de `Comunidad` debe vivir bajo el título de la superficie activa y respetar el orden `Público -> Mi Empresa -> Mensajes directos -> Administración`.
- La entrada `Administración` de `Comunidad` no es universal: para `administrador` solo debe aparecer en contexto `Mi Empresa`; para `superadministrador` puede permanecer visible en cualquier superficie del módulo.
- Las tarjetas de publicación deben priorizar `tema`, `autor`, `fecha`, `título`, `cuerpo` y conversación inline en una sola pieza técnica; no se deben fragmentar en pantallas secundarias para leer o responder.
- El feed de `Comunidad` debe ordenar por defecto `fijados + actividad reciente`; la lectura puramente cronológica puede existir como opción secundaria del usuario, no como criterio dominante fijo.
- Si un tema de `Comunidad` se abre en modal dedicado, ese modal debe priorizar lectura del feed y mover la creación de nuevas publicaciones a una acción compacta de cabecera que abra un submodal o composer secundario del mismo sistema.
- La banda inferior de respuestas en `Comunidad` debe comportarse como toggle completo: toda la superficie de resumen debe poder abrir/cerrar respuestas y el CTA `Responder` no puede quedar como acción de apertura unilateral.
- Si la banda de respuestas ya funciona como toggle completo en `Comunidad`, no se deben duplicar botones `Ver`, `Ocultar` o `Responder` dentro de esa misma franja. El estado expandido/colapsado debe resolverse con copy corto e iconografía de soporte en la propia banda.
- `Comunidad` puede permitir seguimiento personal de temas, pero ese anclaje debe ser estrictamente por usuario. El orden del índice debe resolver primero `seguidos` y después `actividad reciente`, sin convertir la vista en un tablero de favoritos separado.
- El control para seguir/dejar de seguir un tema en `Comunidad` debe ser un icono compacto integrado en la propia fila del tema; no debe abrir paneles auxiliares ni añadir copy redundante.
- En las tarjetas de publicación de `Comunidad`, los metadatos secundarios (`ámbito`, `estado`, `tema`, `sección`, `empresa`) y las acciones compactas de moderación/autor deben resolverse como iconos con hint contextual cuando la versión textual ya esté saturando altura.
- Si esos iconos se usan en `Comunidad`, deben vivir debajo del cuerpo de la publicación y no competir con el título o la lectura principal en la cabecera de la tarjeta.
- Dentro del modal de tema de `Comunidad`, los iconos informativos y los iconos de acción no deben compartir el mismo tratamiento visual: los informativos deben ser más pequeños y circulares en la banda superior del post; los de acción deben ir bajo el título, dentro de cuadrados con borde suavemente redondeado.
- Si el tema ya se abre en un modal dedicado en `Comunidad`, el índice principal no debe añadir una tarjeta o resumen inferior de `tema activo` solo para repetir contexto. La selección debe vivir en la fila del tema y la lectura detallada en el modal.
- La política de `Comunidad Pública` es inmutable: no se permiten adjuntos, archivos ni cargas de ningún tipo. Esa capacidad existe solo en `Mi empresa`.
- Si existieran datos heredados con adjuntos públicos, la UI de `Comunidad` no debe renderizarlos como si fueran válidos.
- La política textual de `Comunidad Pública` también es inmutable: intentar introducir links o URLs en un tema, una publicación o una respuesta debe disparar sanción automática backend.
- Esa detección anti-links en `Comunidad Pública` debe cubrir también variantes ofuscadas razonables (`hxxp`, `hpps`, `www[.]dominio`, barras invertidas o separadores equivalentes) y no depender solo de coincidencias literales `http/https`.
- En dashboards de entrada como `Otros Servicios`, no se deben duplicar mini-tarjetas de estado si cada módulo ya expone su disponibilidad dentro de su propia card. La cabecera debe concentrar orientación, no resúmenes repetidos.
- Si un dashboard de entrada como `Otros Servicios` tiene cabecera superior y banda de módulos, la página no debe desplazar todo el documento con la rueda del ratón. La cabecera debe quedar fija y el scroll vertical debe vivir solo dentro del contenedor de opciones.
- En el dashboard principal del producto, la `hero header` y el pie industrial deben permanecer visibles dentro del viewport. El desplazamiento vertical debe quedar encapsulado únicamente en la banda de cards de navegación.
- Si el footer del dashboard principal muestra barras o indicadores, no pueden ser meramente decorativos: deben reflejar el módulo activo/visible y permitir navegación directa a las cards correspondientes.
- Si un módulo ya está operativo dentro de un dashboard de entrada como `Otros Servicios`, su copy visible debe priorizar intención de acceso (`Entrar`, `Abrir`, etc.) y no estados técnicos internos como `módulo inicial activo`.
- La bandeja de DM debe mantener un patrón de dos capas: lista de hilos + conversación activa. En portátil puede apilarse, pero sin mezclar hilos con el feed del foro.
- `Comunidad` debe tolerar cargas parciales: una caída de categorías, alertas o capas administrativas no debe vaciar el feed ni bloquear la lectura principal.
- Los errores de `Comunidad` deben expresarse como diagnóstico útil y contextual (`qué capa falló`), evitando mensajes genéricos tipo `Not Found` como estado dominante de la pantalla.
- Cuando `Comunidad` entre en carga parcial, el diagnóstico debe permitir identificar la capa fallida y leer su detalle desde la misma banda de aviso, sin abrir un modal técnico ni esconder el feed operativo.
- El control de acceso por tema siempre debe validarse en backend.
- En `Público` no se permiten links ni archivos; solo imágenes.
- Si `Comunidad` muestra adjuntos en el feed, deben vivir como chips o bloques compactos dentro de la propia tarjeta de publicación o respuesta. No se debe abrir una grilla secundaria que rompa el patrón `feed-first`.
- La UI de adjuntos debe dejar explícita la regla de ámbito: en `Público` el selector se comporta como carga de imagen; en `Interno` puede aceptar archivo general con retención de `30 días`.
- Si el autor puede retirar un adjunto propio en `Comunidad`, la acción debe vivir dentro del propio chip del adjunto como control compacto. No se debe abrir una pantalla de gestión separada.
- Si moderación puede retirar un adjunto en `Comunidad`, debe reutilizar el mismo chip compacto del adjunto y variar solo el `title`/intención de la acción; no se debe duplicar un panel específico de archivos moderados dentro del feed.
- La bandeja de alertas administrativas de `Comunidad` puede ofrecer triage básico (`no leídas / todas`, `marcar todas`) para `superadmin`, pero debe permanecer dentro del panel de control del módulo y no mutar a un centro transversal de notificaciones.
- Si una alerta administrativa de `Comunidad` referencia una infracción relacionada, la inspección de detalle debe abrirse dentro del mismo panel de control como drill-down ligero, no como navegación a una pantalla aparte.
- Si crecen alertas e infracciones de `Comunidad`, la superficie administrativa debe absorber filtros compactos por tipo, ámbito o texto dentro del mismo panel de control; no se deben abrir submódulos separados solo para lectura operativa.
- Si `Comunidad` muestra sanciones y apelaciones en la superficie administrativa, su detalle contextual debe resolverse en el mismo panel y poder enlazar con la infracción asociada cuando exista; no se debe forzar al moderador a cruzar listas manualmente.
- Si el volumen de sanciones o apelaciones crece en `Comunidad`, los filtros por estado, ámbito y búsqueda textual deben vivir como controles compactos dentro del mismo panel administrativo; no se debe abrir una vista histórica paralela solo para filtrar.
- Si moderación necesita concentrarse en un usuario concreto dentro de `Comunidad`, el foco debe activarse desde la misma superficie administrativa y reutilizar las listas existentes; no se debe abrir una ficha paralela de usuario solo para revisar sanciones o infracciones.
- Si existe foco de moderación por usuario en `Comunidad`, debe aplicarse de forma coherente a todas las superficies administrativas disponibles, incluidas las alertas automáticas cuando lleven usuario objetivo.
- Si una infracción administrativa de `Comunidad` ya está ligada a una sanción, el detalle debe ofrecer salto directo a esa sanción dentro del mismo panel; no se debe dejar como referencia estática sin navegación contextual.
- Si moderación enfoca un usuario dentro de `Comunidad`, ese mismo foco puede precargar el objetivo del formulario de sanción siempre que no altere permisos ni oculte la selección manual posterior.
- Si una infracción requiere acción manual en `Comunidad`, el detalle puede ofrecer un CTA compacto para preparar la sanción sobre ese usuario, reutilizando el formulario administrativo existente y sin saltarse la validación backend.
- Si ese CTA nace desde una infracción concreta, puede precargar también un borrador contextual de motivo y el tipo de sanción sugerido por ámbito, pero el moderador debe poder editarlo antes de enviar.
- Si existe `foco de moderación` por usuario en `Comunidad`, la ficha resultante debe resumir conteos operativos y sanciones activas dentro de la misma tarjeta, sin obligar a recorrer todas las listas para entender el estado del usuario.
- Si el panel administrativo de `Comunidad` acumula varios filtros simultáneos, debe ofrecer un resumen consolidado y una acción única de restablecimiento dentro de la misma superficie; no se debe obligar al moderador a limpiar estado disperso control por control.
- Si un usuario intenta publicar links en `Público`, la publicación debe rechazarse y la sanción automática escala así:
  - primera infracción: `7 días`
  - segunda infracción: `15 días`
  - tercera y siguientes: `bloqueo_comunidad`
- Cada infracción automática debe:
  - persistirse
  - generar alerta al `superadmin`
  - quedar auditada con usuario, fecha, ámbito y extracto
- `Administrador de empresa` puede moderar y sancionar solo el ámbito interno de su empresa; nunca `Público` global ni empresas ajenas.
- `Superadmin` puede moderar `Público` e `Interno`, pero `Comunidad` no sustituye la expulsión total del sistema ni debe modelarla desde su UI.
- Las sanciones comunitarias válidas son bloqueos de `Público`, `Interno`, `DM` o `Comunidad`; cualquier restricción total del sistema pertenece a administración global.
- Las sanciones visibles para el propio usuario pueden incorporar apelación básica dentro de `Comunidad`, pero esa apelación no sustituye la auditoría: debe quedar ligada a la sanción original y a un estado explícito (`abierta`, `aceptada`, `rechazada`).
- `Administrador de empresa` solo puede resolver apelaciones sobre sanciones internas de su empresa activa. `Superadmin` conserva la resolución global dentro de `Comunidad`.
- Cualquier acceso administrativo excepcional a `Mensajes directos` debe quedar auditado de forma explícita y no puede asumirse como capacidad normal de lectura.
## Headers de Modulos de Proyecto

- `Datos de proyecto`, `Stakeholders`, `EDT` y `EDO` deben usar una shell superior compacta y separada del contenido principal.
- La shell superior debe incluir `icono + titulo` en la primera linea visual y un subtitulo tecnico en tipografia pequena y uppercase.
- Las acciones del modulo deben vivir en la banda derecha de esa cabecera, con wrap controlado en compacto y sin invadir el contenido principal.
- Los ajustes de esta shell no deben mezclar logica funcional con la presentacion; formularios, busquedas, modales y guardados deben permanecer intactos.
- La semaforizacion de cada modulo de proyecto es unica y debe coincidir entre selector lateral, icono de cabecera y titulo de cabecera:
  `Datos de proyecto` usa `#F39200`, `Stakeholders` usa `purple-500`, `EDO/OBS` usa `#136191`, `EDT/WBS` usa `emerald-500`, `Presupuesto` usa `amber-500`, `Cronogramas` usa `sky-500`, `Desagregacion` usa `indigo-500` y `Formula Polinomica` usa `rose-500`.
- Queda prohibido dejar cabeceras internas con azul corporativo por defecto cuando el modulo ya tenga un acento propio declarado en `CLASSIC_SECTIONS`.

## Editores APU

- `APUs` y `ApuBudgetEditor` deben tratarse como dos puntos de entrada del mismo sistema de edición de composición APU.
- Ningún flujo crítico de composición puede existir en uno y faltar en el otro.
- La edición directa de un `recurso normal` desde la lista de composición debe reutilizar el mismo modal y la misma semántica en ambas superficies.
- Si la línea corresponde a un `APU anidado`, la edición exige confirmación explícita y guardado previo del APU actual antes de abrir el hijo.
- Los cambios sobre un `APU anidado` deben propagarse de forma recurrente a todos los APUs padres y a cualquier presupuesto/base de proyecto asociado.
- Si el editor APU tiene cambios sin guardar, cerrar o volver atrás debe requerir confirmación explícita de descarte.
- Cuando se está editando un `APU anidado`, el editor debe mostrar una banda contextual indicando el APU origen y ofrecer retorno visible al padre.
- Si existe un resumen de impacto disponible para un `APU anidado`, la confirmación debe mostrarlo antes de abrir el hijo.

## Cuotas de Almacenamiento

- La cuota visible de almacenamiento en header y `Settings` debe corresponder siempre a la empresa operativa activa.
- Para `superadministrador`, cambiar de empresa activa debe refrescar inmediatamente la licencia y el uso mostrados.
- La politica de almacenamiento es inamovible: el consumo debe medirse como `datos persistidos en BD de la empresa + adjuntos activos de Comunidad`.
- No se permiten valores mock o fijos en superficies visibles de cuota cuando exista una empresa activa resoluble.
