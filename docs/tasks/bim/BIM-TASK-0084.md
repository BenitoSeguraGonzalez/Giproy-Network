# BIM-TASK-0084 - UX de incidencias

Estado: Cerrada localmente

## Implementacion

- Panel compacto crea incidencias desde camara, seleccion, visibilidad y corte
  reales del viewport.
- Reabrir incidencia aplica version y viewpoint; elementos faltantes quedan
  sujetos al manejo de incompatibilidad del view state.
- Flujo operativo: autoasignar, comentar, revisar, resolver, cerrar y exportar
  BCF, sin paneles ni datos simulados en producto.

## Validacion

- Harness creador/responsable/revisor completo en viewport movil: OK.
- Sin overflow, build Vite, smoke BIM y anti-BIM: OK.
- Suite BIM acumulada tras `0083/0084`: `89 passed`.

## Rollback

Retirar `BimIssuesPanel` y cliente; el dominio BCF permanece aislado e
invisible si se conserva para interoperabilidad.
