# Cronograma Trabajo MPP Server-Side Con Aspose.Tasks Java

## Modo
GIPROY CLASICO

## Contexto
La hipotesis previa de generacion `.mpp` via `Aspose.Tasks` en Python no cierra con la licencia disponible en el repositorio. La validacion tecnica de esta sesion confirma:

- `Aspose.Total.lic` no habilita `aspose-tasks` en Python.
- `Aspose.Total.lic` si es aceptada por `Aspose.Tasks for Java 20.2`.
- La ruta Java puede abrir y volver a guardar un `.mpp` real sin usar Microsoft Project.
- La estrategia debe permanecer en backend comun y no exponer la licencia al cliente.

## Objetivo
Restaurar la exportacion `.mpp` del cronograma clasico mediante un carril server-side controlado `Python -> Java Aspose.Tasks -> .mpp`, manteniendo `XML Project` como fallback estable y sin introducir dependencias hacia BIM.

## Restricciones Operativas
- No usar COM, `Project Bridge` ni Microsoft Project desktop.
- No exponer `Aspose.Total.lic` al navegador ni a la maquina cliente.
- No tocar componentes, rutas, flags ni UX BIM.
- Conservar el backend comun como orquestador principal.
- Mantener un fallback XML explicito cuando el carril `.mpp` no este disponible.

## Hallazgos Validados
1. La licencia incluida en `Complementos` no es valida para `Aspose.Tasks` Python.
2. La misma licencia si funciona con `Aspose.Tasks for Java 20.2`.
3. La activacion correcta para nuestro producto es `com.aspose.tasks.License#setLicense(...)`; la referencia a `Aspose.Words` del archivo `How to activate.txt` es generica y no debe copiarse literalmente.
4. El carril seguro para GiProy es backend-only: el cliente solo descarga el binario `.mpp`.

## Arquitectura Propuesta
1. `CronogramaTrabajoService` sigue siendo el punto comun desde Python.
2. El backend prepara una carga intermedia del cronograma clasico ya normalizada.
3. Un conversor Java interno, ejecutado localmente en el servidor, carga:
   - licencia privada;
   - plantilla `.mpp` semilla valida;
   - payload intermedio del cronograma.
4. El conversor reescribe tareas, dependencias, fechas y metadatos del proyecto.
5. El backend devuelve el `.mpp` final al frontend como descarga.
6. Si el conversor, la licencia o la plantilla no estan disponibles, el sistema mantiene `XML Project` y comunica el motivo operativo real.

## Slices Propuestos

### Slice 1 - Motor Java Y Contrato Privado
- Formalizar un runner Java interno para `Aspose.Tasks`.
- Cargar licencia y plantilla semilla desde configuracion privada del servidor.
- Definir payload intermedio minimo para tareas, fechas y dependencias.

### Slice 2 - Integracion Backend Comun
- Integrar el runner Java dentro de `CronogramaTrabajoService`.
- Reemplazar el intento Python actual para `.mpp`.
- Endurecer diagnostico de capacidades reales (`mpp` / `xml`).

### Slice 3 - Contrato API Y Frontend Clasico
- Mantener `MS Project` como CTA de descarga `.mpp` solo cuando el backend lo soporte.
- Mantener `XML Project` como salida explicita y estable.
- Comunicar motivos reales cuando `.mpp` no este habilitado.

### Slice 4 - QA, Validacion Y Documentacion
- Validar generacion `.mpp` sin Microsoft Project instalado.
- Verificar no interferencia BIM.
- Documentar configuracion privada de licencia y plantilla semilla.

## Riesgos A Gestionar
- La plantilla `.mpp` semilla debe ser valida y estable para reescritura.
- La version Java 20.2 puede imponer limites sobre que campos se pueden construir desde cero.
- La orquestacion Python/Java debe manejar errores operativos sin devolver `500` opacos.
- El diagnostico del frontend no debe prometer `.mpp` si el backend no lo puede generar en ese entorno.

## Criterios De Cierre
- `.mpp` generado completamente por GiProy en backend, sin Microsoft Project.
- Licencia privada y no expuesta al cliente.
- `MS Project` y `XML Project` comunican carriles reales y consistentes.
- Sin contaminacion BIM y sin ruptura del backend comun.

## No Interferencia BIM
- Sin cambios en feature flags BIM.
- Sin cambios en rutas BIM.
- Sin cambios en componentes BIM ni UX BIM.
- Sin acoplamientos nuevos hacia modelos o servicios BIM.
