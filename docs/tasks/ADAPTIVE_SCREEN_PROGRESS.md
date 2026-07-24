# Seguimiento pantalla por pantalla de la adecuacion adaptativa

Estado general: EN CURSO  
Mapa maestro: `docs/architecture/ADAPTIVE_SCREEN_APPROVAL_MAP.md`  
Version de trabajo: `3.1.0-beta.6`  
Despliegue: NO REALIZADO; la beta publica permanece en `3.1.0-beta.5`

## Estados

- PENDIENTE: aun no observada individualmente.
- ANALIZANDO: capturas y DOM en revision.
- PROPUESTA: solucion definida, pendiente de implementacion.
- IMPLEMENTADA: cambio local realizado.
- VERIFICADA LOCALMENTE: capturas, DOM y build aprobados.
- CERTIFICADA FISICAMENTE: confirmada en dispositivos reales requeridos.
- BLOQUEADA: existe una dependencia documentada.

## G00.1 - Shell protegido

Estado: **VERIFICADA LOCALMENTE**  
Fecha: 2026-07-24

### Superficie observada

- Cabecera global protegida.
- Marca y version.
- Contexto de empresa, licencia y base tecnica.
- Acciones de distribucion, usuario y salida.
- Viewport de la pagina consumidora.
- Composicion horizontal y vertical.

### Problema observado

El perfil portable utilizaba una unica fila para cualquier orientacion. En
tablet vertical intentaba conservar marca, contexto y acciones en el mismo eje,
reduciendo el espacio informativo y dependiendo del truncado. Era una
compactacion del escritorio, no una composicion especifica de tablet.

### Adecuacion aplicada

- Escritorio y tablet horizontal conservan una sola fila.
- Tablet vertical usa dos filas estructurales:
  - primera: marca/version y acciones globales;
  - segunda: contexto operativo, licencia y base tecnica.
- El contexto dispone de desplazamiento horizontal propio solo si datos reales
  excepcionalmente largos exceden el ancho.
- El viewport de la pagina sigue siendo el unico propietario del scroll del
  contenido; la cabecera no se desplaza con las listas internas.
- La marca se convirtio en un boton semantico sin cambiar su accion.
- No se aplico zoom, `transform: scale` ni reduccion global de tipografia.

### Perfiles verificados

- Windows FHD 100 %, 125 % y 150 %.
- Windows 4K/DPR 2.
- Tablet Full HD horizontal y vertical.
- Tablet 2K horizontal y vertical.
- Lenovo P12 3K horizontal y vertical.

Resultado: **10/10 PASS**.

### Verificaciones

- Build Vite de produccion: PASS.
- `validate-adaptive-app-layout-dom.mjs`: PASS en diez perfiles.
- Marca y acciones no se solapan.
- En vertical, el contexto ocupa una segunda fila geometrica real.
- Cabecera completamente dentro del viewport.
- Sin overflow de documento.
- Inicio y final del contenido alcanzables desde el viewport de pagina.

### Evidencia

- Antes:
  `artifacts/visual-certification/2026-07-24T23-19-32-300Z`.
- Despues:
  `artifacts/visual-certification/2026-07-24T23-24-36-270Z`.
- Captura Full HD vertical:
  `tablet-fhd-portrait/adaptive-app-layout-harness.png`.
- Captura Full HD horizontal:
  `tablet-fhd-landscape/adaptive-app-layout-harness.png`.
- Capturas equivalentes 2K y Lenovo incluidas en el mismo directorio.

### Archivos tratados

- `frontend/src/layouts/AppLayout.jsx`.
- `frontend/scripts/validate-adaptive-app-layout-dom.mjs`.
- `frontend/scripts/generate-visual-surface-inventory.mjs`.
- `docs/architecture/visual-surface-inventory.json`.
- `docs/architecture/ADAPTIVE_SCREEN_APPROVAL_MAP.md`.

### Detector visual

La ejecucion unica de Impeccable no encontro errores bloqueantes y registro tres
avisos que se conservan para tratamiento explicito:

1. `border-accent-on-rounded` en la marca, por el borde inferior naranja de 2 px.
   Es parte del tratamiento visual actual; debe decidirse dentro de G00.4/G00.5.
2. `gray-on-color` en un estado hover naranja.
3. `gray-on-color` en un estado hover rojo.

Los avisos de color requieren medicion de contraste en G00.10. No se alteraron
silenciosamente durante la correccion estructural del shell.

### Pendiente de cierre

- Confirmacion en navegadores de tablet fisica.
- Estado final futuro: CERTIFICADA FISICAMENTE.

## Siguiente unidad

`G00.2 - Navegacion global`: PENDIENTE.
