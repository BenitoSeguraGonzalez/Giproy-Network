# Marketplace Admin Buyer Seller Visual Alignment Execplan

## Objetivo
Alinear `Mis compras` y `Mis ventas` con la gramática visual ya consolidada en `Tienda > Panel Administrador`, sin romper la estética del marketplace clásico ni la operatividad actual de buyer y seller.

## Problema
- `Panel Administrador` ya opera con una entrada visual clara: cabecera sticky, identidad de módulo y tarjetas modulares de acceso.
- `Mis compras` y `Mis ventas` usan partes del visual system, pero siguen entrando como cockpit clásico y no como panel modular.
- Eso crea una percepción de producto inconsistente entre tres superficies que deberían sentirse del mismo sistema.

## Criterios UX
- Mantener el lenguaje visual actual de Tienda clásica.
- Reutilizar patrón de cabecera sticky y módulos grandes tipo panel.
- No eliminar información operativa madura de buyer y seller.
- Mejorar lectura inicial y jerarquía de navegación.
- Mantener responsive y continuidad funcional.

## Plan de actualización
1. Extraer del `Panel Administrador` el patrón visual reusable:
   - cabecera sticky de módulo
   - tarjetas grandes de acceso principal
2. Aplicar ese patrón a `Mis compras`:
   - cabecera sticky
   - módulos principales para biblioteca, pedidos, continuidad y retorno a Tienda
3. Aplicar ese patrón a `Mis ventas`:
   - cabecera sticky
   - módulos principales para contexto, catálogo, ventas y moderación
4. Mantener debajo las superficies operativas ya existentes.
5. Validar responsive y coherencia visual transversal.

## Tasks asociadas
- `TASK-0776`: Alinear visualmente `Mis compras` con el patrón modular del `Panel Administrador`.
- `TASK-0777`: Alinear visualmente `Mis ventas` con el patrón modular del `Panel Administrador`.

## Validación
- `Mis compras` y `Mis ventas` deben sentirse parte del mismo sistema que `Panel Administrador`.
- La cabecera debe mantenerse sticky y usable.
- Las acciones principales deben quedar visibles desde el primer viewport.
- `npm run build` debe compilar sin regresiones.
