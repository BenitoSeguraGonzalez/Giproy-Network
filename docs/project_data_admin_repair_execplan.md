# ExecPlan: Reparación de permisos en Datos de Proyecto para Administrador de empresa

## Objetivo funcional

Restaurar la capacidad de edición en `Proyectos > Datos de proyecto` para el rol `administrador` de la empresa activa, manteniendo el comportamiento actual de `superadministrador` y sin ampliar permisos a `usuario`.

## Estado actual

- `superadministrador` puede editar correctamente.
- `administrador` de empresa queda bloqueado en frontend y/o backend en ciertos flujos del módulo de proyectos.
- El módulo mezcla dos estrategias de validación de rol:
  - normalización correcta con `rol.toLowerCase()`
  - comparaciones exactas con `Administrador` / `Superadministrador`

## Causa raíz

Existen comparaciones sensibles a mayúsculas/minúsculas en el módulo de proyectos. Cuando el usuario autenticado trae `rol = "administrador"` en minúsculas, la UI lo trata como no editor y el endpoint de `proyecto_detalle` también puede rechazar el guardado.

## Diseño propuesto

Reparación no invasiva por normalización:

- centralizar en cada componente la variable `normalizedRole`
- reemplazar comparaciones exactas por checks en minúsculas
- alinear el endpoint `proyecto_detalles` con la misma regla
- revisar puntos adyacentes del módulo de proyectos donde el mismo patrón puede volver a bloquear al administrador

## Fases

### Fase 1. Discovery

- localizar comparaciones de rol exactas en `Proyectos`, `DatosProyecto`, `Stakeholders`, `EDO` y `EDT`
- verificar backend de `proyecto_detalle`

### Fase 2. Reparación funcional

- corregir `DatosProyecto` para edición y autosave
- corregir endpoint backend de guardado de detalle
- corregir controles visibles del módulo de proyectos donde aplique

### Fase 3. Validación

- validar sintaxis backend
- compilar frontend
- revisar que `administrador` y `superadministrador` mantengan acceso esperado

## Riesgos

- dejar comparaciones antiguas en otros tabs del módulo
- cambiar visibilidad de acciones exclusivas de superadmin por error

## Mitigación

- diferenciar acciones híbridas (`administrador` + `superadministrador`) de acciones exclusivas de `superadministrador`
- tocar solo comparaciones de rol defectuosas

## Validaciones

- administrador de empresa puede editar `Datos de proyecto`
- superadministrador mantiene edición
- usuario estándar sigue sin edición
- build frontend y `py_compile` backend correctos
