# Guía de Estilos y UX/UI (GiProy Network)

## Reglas de Layout y Scroll

### 1. Barras de Herramientas (Toolbars) vs Contenedores con Scroll
**Problema histórico:** Los botones de acciones principales (ej. "NUEVA SUBCATEGORÍA", "Nuevo Recurso") se cortaban visualmente al hacer scroll porque estaban dentro del mismo contenedor `overflow-y-auto` que la lista de ítems. Al subir la lista, el botón chocaba con el padding superior o se escondía "limpiamente" creando un efecto visual de estar "cortado" por un espacio en blanco.

**Regla de Oro:**
Cualquier barra de herramientas (Toolbar) que contenga acciones primarias, buscadores o filtros de un listado, **debe estar SIEMPRE fuera del contenedor que hace scroll**. 

**Implementación Correcta (Flexbox):**
```jsx
// CORRECTO:
<div className="flex-1 flex flex-col overflow-hidden bg-[#F8FAFC]">
    {/* 1. El Toolbar es un bloque fijo sin scroll (flex-shrink-0) */}
    <div className="flex items-center justify-between px-8 py-6 flex-shrink-0 border-b border-zinc-100">
        <h2>Listado</h2>
        <button>Nueva Acción</button>
    </div>

    {/* 2. El listado tiene su propio scroll independiente (overflow-y-auto) */}
    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        {items.map(...)}
    </div>
</div>
```

**Implementación Incorrecta (No hacer):**
```jsx
// INCORRECTO:
<div className="flex-1 flex flex-col overflow-hidden">
    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        {/* El Toolbar está dentro del scroll y desaparecerá o se cortará al bajar */}
        <div className="flex items-center justify-between mb-6">
            <h2>Listado</h2>
            <button>Nueva Acción</button>
        </div>
        
        {items.map(...)}
    </div>
</div>
```

---

### 2. Agrupación de Acciones (Grouped Actions)
Para acciones relacionadas como **Importar / Exportar / Búsqueda**, se debe seguir una jerarquía visual clara:

- **Contenedor de Grupo**: Fondo blanco, borde `zinc-200`, padding `p-1` y `rounded-xl`.
- **Separadores**: Líneas verticales de `1px` de ancho, `4` de alto (`h-4`), color `zinc-200`.
- **Botones de Acción**: 
    - Estilo: `text-[10px] font-black uppercase flex items-center gap-2`.
    - Colores: `text-zinc-500` para secundarios, `#F39200` para primarios o activos.
- **Botón Principal (Call to Action)**: Siempre usar `LiquidButton` para la acción principal de la pantalla (Crear Nuevo), separado del grupo anterior para darle aire y relevancia.

**Ejemplo Visual:**
```jsx
<div className="flex items-center gap-4">
    {/* Botones Agrupados */}
    <div className="flex items-center gap-1 bg-white border border-zinc-200 p-1 rounded-xl">
        <button className="..."> <ImportIcon /> Importar </button>
        <div className="w-px h-4 bg-zinc-200 mx-1" />
        <button className="..."> <ExportIcon /> Exportar </button>
    </div>

    {/* Buscador Contextual */}
    <div className="relative group w-64">
        <Search className="absolute left-3 top-1/2 ..." />
        <Input placeholder="Buscar..." className="..." />
    </div>

    {/* Acción Principal */}
    <LiquidButton className="h-10 px-6 rounded-xl">
        <Plus className="..." /> Nueva Entidad
    </LiquidButton>
</div>
```

---

### 3. Jerarquía de Encabezados en Módulos Maestros
Para una navegación consistente en módulos tipo catálogo (Recursos, Subcategorías, Apus), se debe seguir esta estructura de capas:

1. **Header Contextual (Fijo - Negro)**:
   - Muestra metadatos globales como la **Base de Trabajo Activa**.
   - Color: `bg-zinc-900`.
   - Elementos: `Database` icon, nombre de la base, botón "Cambiar Base".

2. **Header Global de Navegación (Fijo - Blanco)**:
   - Contiene la navegación principal de la sección.
   - Color: `bg-white border-b border-zinc-200`.
   - Elementos: 
     - Botón **Volver** (`ArrowLeft` p-2 rounded-xl).
     - **Título del Módulo** (ej: "BANCO DE RECURSOS").
     - **Subtítulo** descriptivo en color `#F39200`.
     - (Opcional) Selectores de categoría globales.

3. **Área de Contenido (Split View)**:
   - **Sidebar**: Para navegar por el árbol de categorías/subcategorías.
   - **Main Content Area**:
     - **Toolbar de Acción (Fijo)**: Título del ítem seleccionado, contador, botones de acción agrupados (Import/Export), buscador y LiquidButton (CTA principal).
     - **Inner Content**: El listado scrollable de datos.

---

### 4. Navbar Principal (App Layout)
El Navbar superior global debe mantener una estructura de **Grid estricta** para el Contexto Operativo y la Base Técnica. Esto es fundamental para asegurar que las etiquetas superiores y los valores inferiores estén perfectamente alineados de forma vertical en formato de columnas, evitando apilamientos asimétricos.

**Estructura del "Contexto Operativo":**
- **Contenedor Principal**: `hidden lg:grid grid-cols-[auto_auto_auto] gap-x-8 gap-y-1 items-center`.
- **Fila 1 (Etiquetas)**: Pequeñas y sutiles (`text-[7px] text-zinc-400 font-black uppercase tracking-[0.2em] leading-none`).
- **Fila 2 (Valores)**: Grandes y destacados (`text-[11px] text-zinc-800 font-black uppercase tracking-tight`).
- **Separación**: El espaciado se maneja con `gap-x-8` en el grid para dar espacio entre las columnas (Contexto Operativo vs Proyecto vs Base Técnica).

**Ejemplo Visual:**
```jsx
<div className="hidden lg:grid grid-cols-[auto_auto_auto] gap-x-8 gap-y-1 items-center">
    {/* Fila 1: Etiquetas (Labels) */}
    <div className="flex items-center gap-2">
        <span className="text-[7px] text-zinc-400 uppercase">Contexto Operativo</span>
    </div>
    <div className="flex items-center gap-2">
        <span className="text-[7px] text-zinc-400 uppercase">Base Técnica</span>
    </div>

    {/* Fila 2: Valores e Interacciones */}
    <div className="flex items-center gap-2">
        <h2 className="text-[11px] font-black uppercase text-zinc-800">Administradores Generales</h2>
    </div>
    <div className="flex items-center gap-2">
        <span className="text-[10px] font-black uppercase text-zinc-800 italic">Base: Proyecto de Prueba 001</span>
    </div>
</div>
```

*Nota: Esta guía debe ser consultada antes de construir nuevos módulos de listados y catálogos en el aplicativo.*
