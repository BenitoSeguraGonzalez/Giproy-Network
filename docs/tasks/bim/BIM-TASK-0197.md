# BIM-TASK-0197 - Apertura no bloqueante del cargador IFC

Fecha: 2026-08-20

Estado: IN_PROGRESS

Relacionado: `TASK-2063`

## Problema

`BimFlowWorkspace` seleccionaba implicitamente la version activa del backend.
Cuando esa version solo tenia `source_ifc`, `BimFragmentsViewport` iniciaba la
conversion IFC en el hilo principal. El trabajo podia impedir que React
montara el dialogo `Nueva carga IFC` y dejaba el navegador aparentemente
bloqueado.

## Correccion autorizada

- La version activa del backend no se considera seleccion del usuario.
- El visor 3D solo se monta despues de una seleccion explicita en Versiones.
- El viewport pesado se desmonta al abrir Importar IFC.
- El escenario sin seleccion sigue mostrando estado vacio, sin geometria ni
  datos BIM fallback.

## No interferencia clasica

No cambia API, base de datos, autenticacion, permisos, empresa activa,
proyectos, revisiones, EDT, APUs, presupuestos ni cronogramas. BIM sigue
aislado y apagable.

## Verificacion

- Smoke DOM verde: el panel Importar IFC no mantiene el viewport montado y el
  dialogo se abre.
- Smoke de contrato BIM verde.
- Build Vite verde.
- ESLint focal verde; solo permanece el warning preexistente del harness
  ignorado por la configuracion.

## Pendiente

La conversion IFC explicita sigue siendo una operacion pesada de cliente; una
conversion en Web Worker es un slice posterior y no forma parte de esta TASK.
La validacion visual autenticada y el deploy quedan pendientes de autorizacion.
