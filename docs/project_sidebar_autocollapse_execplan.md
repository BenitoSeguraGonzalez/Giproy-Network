# ExecPlan: Sidebar Autocolapsable en Proyectos

## Objetivo

Convertir la navegación lateral interna del módulo `Proyectos` en una barra autocolapsable con opción de fijado abierto, manteniendo la estabilidad del layout y permitiendo que la zona de trabajo se reajuste automáticamente al ancho disponible.

## Estado actual

- La sidebar de secciones usa un ancho fijo amplio.
- El contenido principal siempre convive con esa anchura, incluso cuando el usuario no necesita ver los labels.
- No existe modo compacto ni persistencia de preferencia de apertura.

## Diseño propuesto

- Sidebar compacta por defecto en estado no fijado.
- Expansión automática al hacer `hover` o recibir foco dentro.
- Colapso automático al salir, siempre que no esté fijada.
- Botón de fijado visible en la propia sidebar.
- Ajuste del área de trabajo usando el layout flex existente, sin overlays ni reposicionamiento absoluto.

## Fases

1. Añadir estado de expansión/fijado con persistencia local.
2. Rediseñar la sidebar para soportar modo compacto y expandido.
3. Adaptar items para mostrar solo iconos en colapsado y labels en expandido.
4. Añadir control de fijado/desfijado.
5. Verificar que el contenido principal responda correctamente al cambio de anchura.

## Riesgos

- Pérdida de discoverability en modo compacto.
- Solapamiento visual si las transiciones no respetan el layout.
- Estados inconsistentes al cambiar de proyecto o recargar.

## Mitigación

- Mantener tooltips nativos en modo colapsado.
- Basar el ajuste en `flex` y transición de ancho, no en posicionamiento absoluto.
- Persistir preferencia de fijado en `localStorage`.

## Validación

- Sidebar se expande al pasar el ratón.
- Sidebar se colapsa al salir si no está fijada.
- Sidebar se mantiene abierta si está fijada.
- El contenido principal gana y pierde espacio sin romper scroll ni overflow.
- Build frontend correcta.
