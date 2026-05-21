# Plan de saneamiento - Media y reportes de Datos de Proyecto

## Alcance

Saneamiento del flujo clásico `Proyecto > Datos de Proyecto` para que la imagen referencial y la georreferenciación sean coherentes en UI, preview y exportaciones del reporte de datos del proyecto.

## Diagnóstico

- La imagen referencial se guardaba como `/uploads/proyectos/...`.
- El frontend resolvía esa ruta contra `/api/v1/proyecto-detalles/image-proxy`.
- En backend, `/{codigo_root}` estaba declarado antes que `/image-proxy`, por lo que `image-proxy` podía capturarse como código de proyecto.
- El reporting ya intentaba insertar `#IMAGENPROYECTO` y `#GEOREFERENCIACION`, pero la georreferenciación dependía de `staticmap.openstreetmap.de`; si el servicio externo o la red fallaba, el bloque quedaba vacío.
- La resolución local de uploads dependía del directorio de arranque del proceso backend.

## Plan

1. Crear una ruta estable de media de proyecto que no colisione con `/{codigo_root}`.
2. Actualizar el resolvedor frontend para usar esa ruta estable.
3. Reforzar el resolvedor backend de uploads para soportar arranque desde repo raíz o desde `backend`.
4. Mantener el uso de imagen referencial real cuando exista.
5. Añadir una captura técnica local de georreferenciación como fallback determinista para reportes, sin depender de servicios externos.
6. Hacer que preview y PDF nativo puedan consumir la georreferenciación como `data:image/png;base64`.
7. Mantener exportación Excel con placeholders `#IMAGENPROYECTO` y `#GEOREFERENCIACION`.
8. Validar sin tocar BIM, rutas BIM ni UX BIM.

## No alcance

- No se introduce captura de mapa por canvas del navegador.
- No se agregan dependencias nuevas.
- No se modifica el dominio BIM.
- No se cambia el contrato funcional de proyectos, presupuesto ni cronogramas.

## Criterio de cierre

- La imagen referencial cargada en `Datos de Proyecto` se ve desde la URL resuelta.
- El reporte de acta de constitución inserta imagen referencial si existe.
- El reporte inserta georreferenciación aunque falle el proveedor externo de mapa estático.
- La validación no detecta acoplamiento BIM nuevo.
