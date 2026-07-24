# Plan de certificacion visual adaptativa GiProy

## Objetivo vinculante

Certificar todas las superficies visuales Classic y BIM en escritorio, Windows
HiDPI/zoom y Lenovo Tab P12 horizontal/vertical. Una superficie solo se acepta
si se renderiza con el perfil previsto, conserva identidad grafica, no corta
contenido, permite alcanzar su inicio/final y mantiene operables todos sus
controles, overlays y scrolls necesarios.

## Fuentes de verdad

- Rutas: `frontend/src/routes/AppRouter.jsx`.
- Superficies internas: exports de `frontend/src/pages` y
  `frontend/src/components`, incluidos modal, dialog, drawer, popover, tabla,
  workspace y panel.
- Harnesses: HTML/JSX existentes bajo `frontend/` y `frontend/src/features`.
- Configuracion beta: `deploy/.env` validada por preflight, sin secretos en
  artefactos.
- Evidencia: capturas PNG, metricas JSON y resultado funcional por
  superficie/perfil.

## Matriz minima

| Perfil | Viewport CSS | DPR/entrada | Proposito |
|---|---:|---|---|
| Full HD | 1920x1080 | DPR 1, mouse | minimo de escritorio |
| Windows 125% | 1536x864 | DPR 1.25, mouse/touch opcional | HiDPI habitual |
| Windows 150% | 1280x720 | DPR 1.5, mouse | altura reducida |
| Windows 200% | 960x540 | DPR 2, mouse | zoom/accesibilidad |
| QHD/4K | 2560x1440 | DPR 1.5/2 | limite superior sin expansion destructiva |
| Lenovo landscape | medicion Android real | touch/coarse | Opera/Chrome horizontal |
| Lenovo portrait | medicion Android real | touch/coarse | Opera/Chrome vertical |

El AVD Android y BlueStacks son evidencia complementaria. La Lenovo fisica es
obligatoria para el cierre.

## Invariantes automatizables por superficie

1. Perfil adaptativo habilitado y esperado; no se permite fallback silencioso.
2. Sin overflow de pagina no declarado.
3. Todo overflow interno tiene scroll real en el eje correspondiente.
4. Primer y ultimo contenido alcanzables.
5. Cabecera global visible, no colapsada y sin cubrir contenido.
6. Controles interactivos visibles, habilitados y con area tactil suficiente.
7. Modales dentro del viewport, cuerpo desplazable y acciones alcanzables.
8. Sin errores de pagina/consola ni fallos de chunks.
9. Version UI, bundle y `/version.json` coincidentes.
10. Captura y metricas guardadas con ruta, perfil, commit y version.

## Fases y criterios de aceptacion

### Fase 1 - Inventario y configuracion

- Inventario reproducible de rutas, harnesses y overlays.
- Build, test y deploy comparten `VITE_ADAPTIVE_UI_ENABLED=true`.
- Los tests no usan `localStorage` para ocultar un flag de build ausente.
- Preflight bloquea configuracion adaptativa ausente o falsa.

### Fase 2 - Runner visual

- Sesion autenticada/fixture representativa y navegacion de todas las rutas.
- Captura por ruta y perfil, incluyendo overlays activables.
- Metricas de geometria y alcanzabilidad en JSON.
- Reporte consolidado con PASS/FAIL, nunca solo ausencia de excepciones.

### Fase 3 - Correccion por familias

Orden: shell/publicas, hubs/cards, tablas/catalogos, proyectos/Gantt,
formularios/settings, marketplace/comunidad, administracion, BIM 2D/3D y
overlays. Cada familia repite la matriz completa antes de pasar a la siguiente.

### Fase 4 - Android y beta

- Ejecutar el runner en AVD y, cuando aporte cobertura, BlueStacks.
- Desplegar una unica beta versionada con rollback.
- Repetir capturas contra HTTPS publico sin activaciones locales ocultas.
- Ejecutar Lenovo fisica horizontal/vertical en Chrome y Opera.

## Condicion de cierre

No se cierra por build verde ni por muestreo. Debe existir una fila PASS con
evidencia para cada superficie inventariada en cada perfil aplicable, cero P0/P1
visuales abiertos y confirmacion fisica Lenovo. Cualquier evidencia ausente se
considera no certificada.
