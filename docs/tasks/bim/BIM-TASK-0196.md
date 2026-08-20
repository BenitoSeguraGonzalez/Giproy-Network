# BIM-TASK-0196 - Modelo 3D productivo con geometria IFC real

Fecha: 2026-08-20

Estado: IN_PROGRESS

Relacionado: TASK-2062

## Objetivo

Cerrar la brecha entre el pipeline IFC versionado y la pantalla productiva
`BimFlowWorkspace`: el visor debe consumir un artifact Fragments activo o
convertir el artifact IFC fuente de la version seleccionada; los datos BIM
incompletos deben expresarse como estado vacío/indisponible, nunca como un
modelo sintético.

## Alcance

- Reutilizar `BimFragmentsViewport` y el lifecycle de artifacts BIM existente.
- Convertir IFC fuente a bytes Fragments en cliente solo cuando no exista un
  artifact Fragments activo.
- Montar el viewport en la etapa Modelo sin exponerlo fuera de la guarda BIM.
- Mostrar estado vacío explícito en 2D y 3D cuando no exista selección o datos.
- Sincronizar seleccion por GlobalId y refrescar tras aceptar/activar versiones.

## No interferencia clasica

- Sin cambios en Auth, JWT, empresa activa, permisos clasicos, EDT, APUs,
  Presupuesto, Cronogramas o revisiones.
- Con BIM apagado no se monta el workspace ni se solicita ningun artifact BIM.
- Los errores de carga BIM quedan contenidos en el fallback de la capa BIM.

## Verificacion requerida

- Smoke de contrato y DOM del workspace BIM.
- Smoke de conversion IFC -> Fragments y carga `FragmentsModels`.
- Build Vite y lint focal.
- Smoke anti-BIM y fronteras API clasicas.
- Verificacion visual del canvas WebGL y de seleccion por GUID cuando exista
  un artifact real disponible.

## Rollback

Volver a `BimThreeViewer` en Modelo 3D y conservar los endpoints/artifacts BIM
sin cambios.
