# Presupuesto Performance Hardening - ExecPlan

## Objetivo
Reducir al máximo la latencia percibida en `Proyecto > Presupuesto` al:
- añadir APUs,
- pegar cantidades desde portapapeles,
- navegar y editar presupuestos grandes,
sin perder funcionalidades operativas como selección, drag & drop, tanteo, navegación por teclado o merge de líneas.

## Diagnóstico
- El alta de APU había dejado de sentirse instantánea y en algunos casos superaba los `2s`.
- El pegado de cantidades desde portapapeles hacía demasiadas operaciones secuenciales y se degradaba fuertemente al crecer el número de líneas.
- El render del presupuesto seguía construyendo demasiado árbol React para cambios pequeños.
- El doble clic rápido sobre un APU podía generar duplicados en vez de consolidar cantidad.
- En presupuestos grandes, el coste ya no estaba solo en backend; el cliente también estaba recomponiendo demasiado DOM.

## Enfoque
1. Apretar la ruta backend de mutación para que las operaciones sean directas y sin recalculados globales innecesarios.
2. Introducir operaciones bulk reales para el pegado de cantidades.
3. Dejar de refrescar el presupuesto completo tras cada mutación simple y actualizar localmente el estado relevante.
4. Virtualizar el render de líneas para que presupuestos grandes no construyan todo el árbol visible a la vez.
5. Blindar el doble clic y fusionar APU repetido dentro del mismo EDT.
6. Medir el tiempo real del servidor para separar cuello backend de cuello frontend.

## Intervenciones ejecutadas

### Backend
- `POST /presupuestos/{id}/lineas`:
  - acepta `after_linea_id`,
  - inserta con código final,
  - fusiona cuando el APU ya existe en el mismo EDT,
  - evita `add + move + refresh` en cascada.
- `PUT /presupuestos/{id}/lineas/bulk-cantidad`:
  - aplica cantidades en lote,
  - recalcula solo totales,
  - evita repricing completo.
- `refresh_presupuesto_prices(...)`:
  - elimina consultas `N+1`,
  - soporta `commit=False`,
  - deja el backend listo para llamadas más controladas.

### Frontend
- El contexto de presupuesto:
  - ya no hace recarga completa tras altas simples,
  - actualiza líneas y totales localmente,
  - usa `startTransition(...)` para rebajar bloqueo del hilo principal.
- En una segunda fase:
  - se separa en `data`, `selection` y `actions`,
  - los componentes calientes dejan de suscribirse a todo el contexto cuando solo necesitan una parte.
- El catálogo lateral:
  - bloquea doble clic por `apu + destino`,
  - conserva inserción contextual:
    - tras línea activa,
    - al final del EDT activo,
    - o en el primer EDT si no hay selección.
- `LineasPresupuestoTab`:
  - pasa de render recursivo completo a lista plana virtualizada,
  - mantiene selección, drag, scroll y navegación,
  - deja de renderizar miles de filas fuera de viewport,
  - y reduce aún más rerenders al pasar solo banderas booleanas de selección/drag a cada fila visible.
- Virtualización corregida:
  - se descartó la primera ventana por offsets fijos porque podía truncar el presupuesto en EDT largos,
  - se reemplazó por una virtualización progresiva por tramos,
  - el presupuesto renderiza un bloque inicial y amplía más filas según scroll, selección, minimapa o navegación,
  - se añade además un buffer inferior mayor y una comprobación basada en `scrollHeight` real del contenedor para evitar blancos intermedios o “fin prematuro” del presupuesto.
- `PresupuestoDetail`:
  - encapsula y memoiza superficies laterales como catálogo y minimapa,
  - evitando que un cambio de línea reconstruya zonas vecinas del workbench.

## Resultado observado
- El tramo servidor del alta de APU quedó medido en torno a `0.06s`.
- La percepción al añadir APUs y pegar cantidades mejora de forma visible respecto a la regresión anterior.
- El presupuesto deja de duplicar líneas por doble clic rápido y consolida cantidad cuando corresponde.
- La base ya queda preparada para presupuestos de `10.000` líneas con un coste de render mucho más controlado.
- La virtualización deja de cortar visualmente presupuestos reales como `Santiago Bermeo`; la continuidad completa del EDT vuelve a priorizarse sobre una ventana demasiado agresiva.

## Estado actual
- El cuello principal ya no está en backend.
- El árbol ya quedó virtualizado de forma progresiva y el contexto ya fue desacoplado en `data`, `selection` y `actions`.
- Si reaparece latencia perceptible, el siguiente candidato natural es seguir aislando subbloques del workbench o perfilar reconciliación del cliente en caliente sobre presupuestos reales más grandes.

## Resultado esperado
- Presupuesto vuelve a sentirse fluido en operaciones frecuentes.
- El sistema soporta mejor presupuestos grandes sin paseo visual ni repintado completo innecesario.
- El slice queda documentado para poder auditarlo o retomarlo sin reconstruir el razonamiento desde cero.
