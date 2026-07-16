# BIM-TASK-0153 - Partes de horas y directorio de cuadrillas BIM

Fecha: 2026-07-16
Estado: Cerrada localmente
Modo: GIPROY BIM

## Objetivo

Completar E08 con un directorio operativo de cuadrillas y partes diarios de
horas ligados a actividad y frente BIM, sin duplicar personal ni nomina.

## Alcance ejecutado

- Migracion aditiva y reversible `de2037a1b2c3` para `bim_4d_crews` y
  `bim_4d_timecards`.
- Directorio tenant/project-aware con codigo, especialidad, tamano, estado y
  nota; no almacena identidades personales.
- Parte diario con horas regulares/extra, produccion, unidad, actividad,
  frente y fecha; unicidad por cuadrilla, actividad y jornada.
- Endpoints protegidos por capacidades BIM, cliente de dominio y tab
  `Cuadrillas` en Campo V2 con vistas `Partes` y `Directorio`.
- Ninguna lectura o escritura en personal, contratos, nomina o contabilidad
  clasicos.

## Validacion

- `py_compile`: correcto.
- Tests focales: 10 correctos en el conjunto Campo/recursos; 2 propios.
- PostgreSQL: ciclo `de2010 -> de2037 -> de2010 -> de2037` correcto.
- `npm run build`: correcto; warning conocido de chunks Vite.
- Playwright: 1920x900 y 2560x1300, sin overflow ni errores de consola.
- Smoke agregado BIM y baseline enterprise: correctos.

## Rollback

1. Ocultar BIM mediante las guardas vigentes.
2. Retirar la herramienta `Cuadrillas` del workspace V2.
3. Revertir `de2037a1b2c3`; solo elimina tablas BIM nuevas.

## Resultado

E08 queda completa. Paridad SYNCHRO: 65,00% (34 completas, 10 parciales y 16
ausentes). Programa: 27/61 slices, 44,26% realizado y 55,74% pendiente. La ola
permanece local y no se despliega.
