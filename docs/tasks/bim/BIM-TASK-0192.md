# BIM-TASK-0192 - Fundacion adaptativa BIM escritorio y tablet

Fecha: 2026-07-24

Estado: Desplegado en beta; certificacion fisica pendiente

Modo: INTEGRACION CONTROLADA GIPROY CLASICO <-> GIPROY BIM

## Objetivo

Adoptar el contrato comun de capacidades visuales sin convertir BIM en
dependencia del shell clasico y preparar la adecuacion posterior del workspace,
viewer y herramientas BIM para escritorio escalado y tablet.

## Trazabilidad clasica

Relacionado con `TASK-2039`.

## Alcance

- Consumir exclusivamente el contrato frontend comun y estable.
- Separar capacidad de layout de resolucion fisica.
- Mantener gates BIM acumulativos intactos.
- Preparar perfiles wide, compact, tablet landscape/portrait y constrained.
- Agregar harness que pruebe montaje BIM bajo flags y sin overflow de pagina.

## No alcance

- Redisenar aun los paneles BIM individuales.
- Cambiar modelos, schemas, endpoints, PostgreSQL o Alembic.
- Activar BIM para empresas o usuarios no autorizados.
- Declarar certificada la Lenovo Tab P12 sin prueba real.

## Criterios de aceptacion

- BIM apagado no carga ni muestra UX BIM.
- BIM encendido conserva licencia, entitlement, flags, allowlist, tenant y rol.
- Una pantalla 3K con viewport CSS compacto no recibe layout wide.
- El canvas no se escala mediante CSS global.
- El fallo o restriccion BIM no bloquea GiProy Clasico.
- Build, smoke BIM, anti-BIM y baseline enterprise pasan.

## Rollback

Desactivar la flag adaptativa y revertir el consumidor BIM, harness, pruebas y
documentacion. No hay cambios de datos ni migraciones.

## Checklist

- [x] Contrato y trazabilidad cruzada
- [x] Baseline y rollback 1:1 verificados
- [x] Consumo del detector comun
- [x] Harness de perfiles BIM
- [x] Smoke BIM positivo y anti-BIM
- [x] Certificacion automatizada local, build y baseline enterprise
- [x] Despliegue beta reversible y comprobacion de salud
- [ ] Certificacion fisica Tab P12 con modelo representativo
