# BIM-TASK-0081 - Federacion por disciplina

Estado: Cerrada localmente

## Supuestos y alcance

- Una federacion fija versiones BIM existentes; no modifica fuentes IFC ni
  coordenadas originales.
- Cada guardado crea una revision inmutable con autor y justificacion.
- GiProy Clasico, auth, JWT, roles globales y contratos TASK-1807 quedan fuera.

## Implementacion

- Migracion Alembic aditiva `de2005a1b2c3` para federaciones y miembros.
- Contrato `giproy_bim_federation_v1`, tenant/project scoped, con version,
  disciplina, orden, estado, transform, CRS, origen y unidades por miembro.
- Servicio de revisiones inmutables; la revision anterior queda `superseded`.
- Diagnostico de alineacion por CRS y origen efectivo convertido a metros.
- API `GET/PUT /bim/projects/{project_id}/federation` bajo la guarda BIM.
- Panel compacto para agregar versiones, activar disciplinas, ajustar
  traslacion y justificar la nueva revision.
- Viewport Fragments multiversion: carga artifacts registrados, aplica
  transforms no destructivos y alterna visibilidad sin reconstruir camara ni
  seleccion cuando no cambia la geometria de la federacion.

## Validacion

- Arquitectura, estructura y MEP con caso alineado/desalineado: OK.
- Revision inmutable, desactivacion y rechazo cross-project/tenant: OK.
- Migracion upgrade/downgrade aislada: OK.
- Suite BIM acumulada: `83 passed`.
- Harness WebGL federado: tres modelos, canvas no vacio y toggle 3/2/3: OK.
- Matriz Fragments de producto, build Vite, smoke BIM, anti-BIM y fronteras
  API clasicas: OK.
- Warnings conocidos no bloqueantes: Pydantic `model_id/model_name` y chunk
  grande Vite.

## Rollback

1. Desactivar la federacion desde el estado BIM o retirar panel/props del
   workspace para volver al viewport de una version.
2. Revertir endpoint, cliente, servicio, schemas y modelos BIM.
3. Ejecutar downgrade `de2005a1b2c3` solo con autorizacion de base de datos.

No existe dependencia desde GiProy Clasico hacia estas tablas o componentes.
