# Plan de implementación - Portal de compras públicas - borrador persistible y activación condicionada

## Objetivo
Permitir que el producto `Portal de compras públicas` pueda guardarse aunque esté incompleto, manteniéndolo inactivo hasta completar todos los descriptores obligatorios.

## Alcance
- Modal especializado del panel administrador de Tienda
- Reglas backend de creación y edición del producto
- Sin cambios en BIM

## Política objetivo
- El producto nuevo inicia inactivo.
- El guardado incompleto está permitido.
- El modo activo solo puede manipularse cuando el portal esté completo.
- Si el backend recibe un portal incompleto con `activo=true`, debe persistirlo como inactivo.

## Descriptores mínimos para habilitar activación
- Título comercial
- Descripción corta
- Descripción larga
- Descripción completa
- Inicio y fin de publicación
- País y provincia
- Código de licitación
- Precio de licitación
- Inicio y fin de licitación
- Origen técnico
- Referencia técnica
- Análisis de archivo base cuando el origen sea `archivo_base`

## Implementación prevista
1. Añadir helper de completitud en frontend.
2. Bloquear slider de activación mientras falten descriptores.
3. Añadir guardado de borrador sin exigir previo completo.
4. Mantener `Vista previa` solo para portales completos.
5. Replicar la regla de readiness en backend.
6. Forzar `activo=false` en backend si el portal sigue incompleto.

## Riesgos a evitar
- Perder la capacidad de guardar trabajo parcial.
- Mostrar productos incompletos como activos.
- Crear divergencia entre lo que deja hacer el frontend y lo que persiste el backend.
- Afectar otros tipos de producto del marketplace.

## TASK relacionada
- `TASK-0700.md`
