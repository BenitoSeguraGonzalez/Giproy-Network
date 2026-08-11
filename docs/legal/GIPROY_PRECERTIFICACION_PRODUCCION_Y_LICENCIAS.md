# GiProy Network

## Informe de precertificacion de licencias y preparacion para produccion

**Fecha de corte:** 11 de agosto de 2026  
**Artefacto examinado:** despliegue beta publicado  
**URL declarada:** `giproy.excomconsultores.com`  
**Estado del documento:** PRECERTIFICACION; NO CONSTITUYE CERTIFICADO FINAL

### 1. Objeto

Este informe identifica el artefacto de GiProy Network publicado en el servidor
beta, delimita los componentes examinados y registra la evidencia que debe
cerrarse antes de declarar que el mismo artefacto esta preparado para produccion
y cumple las obligaciones conocidas de licenciamiento de terceros.

No se auditan como parte distribuida las herramientas internas que no fueron
copiadas a las imagenes ni entregadas al navegador.

### 2. Identificacion inmutable del artefacto

| Componente | Identificador comprobado | Estado de captura |
|---|---|---|
| Backend GiProy publicado | `sha256:804761c88253b2bad60b73e09afcd1dd5258cfab688119245e2f216af00af64a` | Healthy |
| Frontend GiProy | `sha256:09b8911cadb269df1960fd1b7f01748416bca4477f8f180f34205631f6252278` | Healthy |
| PostgreSQL 18 | `sha256:4aabea78cf39b90e834caf3af7d602a18565f6fe2508705c8d01aa63245c2e20` | Healthy |
| OWASP ModSecurity CRS | `sha256:dc68fb3684bd5e68d0b59a4b27a4b41847c16815e0bd4f9dac4c74b8d5c4028b` | Healthy |

Hash agregado de los archivos servidos por Nginx:
`74b568b17cdee1c46cb1e522944f6fd93fcddfcef0b05f06649d84cfd2ec3631`.

El servidor no contiene metadatos Git. En consecuencia, un commit local no
identifica por si solo este despliegue y no debe sustituir los hashes anteriores.

### 3. Alcance publicado y exclusiones

Se incluyen:

- JavaScript, CSS, WASM, fuentes e imagenes enviados al navegador.
- Codigo y paquetes Python instalados en la imagen backend.
- Imagenes base y servicios de PostgreSQL y WAF del stack.
- Configuracion que determina la frontera publica del servicio.

Se excluyen, mientras se mantenga evidencia de que no llegan a las imagenes:

- dependencias `devDependencies` no incorporadas al bundle final;
- tests, harness, linters, Playwright y utilidades locales;
- launchers, historiales, dumps, logs y respaldos;
- el directorio local `Complementos` y su contenido Aspose.

La inspeccion dentro del backend publicado no encontro archivos Aspose ni
archivos `.lic`. Los Dockerfiles copian rutas expresas y no copian
`Complementos/`.

### 4. Hallazgos de licenciamiento

#### 4.1 Frontend distribuido

El lockfile de produccion registra mayoritariamente componentes MIT, ISC,
Apache-2.0 y BSD. Requieren tratamiento especifico:

| Componente | Licencia declarada | Tratamiento requerido |
|---|---|---|
| `web-ifc@0.0.77` | MPL-2.0 | Conservar aviso y licencia; documentar modificaciones a archivos MPL, si existen. |
| `react-leaflet@4.2.1` | Hippocratic-2.1 | Revision juridica de condiciones y compatibilidad con los usos ofrecidos. |
| `@react-leaflet/core@2.1.0` | Hippocratic-2.1 | Igual tratamiento que `react-leaflet`. |
| `jszip@3.10.1` | MIT OR GPL-3.0-or-later | Registrar expresamente la opcion MIT y conservar su aviso. |
| `pako` | MIT AND Zlib | Conservar ambos avisos aplicables. |

El campo `license: UNLICENSED` del paquete raiz indica que el codigo propio no
se publica bajo una licencia npm abierta; no acredita por si mismo titularidad
ni sustituye los avisos de terceros.

#### 4.2 Backend ejecutado en el servidor

El inventario runtime incluye principalmente licencias permisivas. Requieren
revision explicita:

| Componente | Licencia declarada | Observacion |
|---|---|---|
| `language_tool_python@2.9.4` | GPLv3 | Backend SaaS; verificar si fue modificado, que artefactos descarga y si existe cualquier entrega de copias. |
| `certifi` | MPL-2.0 | Conservar licencia y avisos cuando corresponda. |
| `tqdm` | MPL-2.0 AND MIT | Registrar la expresion y avisos aplicables. |
| `psycopg2-binary` | LGPL con excepciones | Conservar texto y documentar la excepcion aplicable. |
| `pdfplumber` | metadata sin licencia legible | Resolver contra distribucion oficial antes del cierre. |

La mera interaccion remota con software GPL ordinario no equivale por si sola a
entrega de una copia. Esta conclusion no debe extrapolarse a AGPL ni al
JavaScript efectivamente enviado al navegador.

### 5. Hallazgos de preparacion para produccion

Evidencia favorable:

- backend, frontend, PostgreSQL y WAF estaban saludables;
- imagen WAF fijada mediante digest;
- frontend y backend no estan expuestos directamente por puertos publicos;
- el WAF registra detecciones sin cuerpos ni cabeceras segun TASK-2043;
- existe estrategia documentada de backup y rollback beta.

Bloqueos actuales:

1. `TASK-2044` no completa su ventana hasta el 17 de agosto de 2026 y no ha
   alcanzado aun sus gates humanos y de volumen.
2. El WAF permanece en `DetectionOnly`; no existe decision sustentada de paso a
   bloqueo ni matriz final de falsos positivos.
3. No existe un paquete de avisos de terceros demostrado dentro de la interfaz
   o junto al bundle distribuido.
4. El registro exige aceptar una politica de privacidad, pero no se encontro un
   texto legal enlazado desde el checkbox de alta.
5. Falta acreditar cadena de titularidad del codigo, marca, imagenes, fuentes,
   documentos, datasets y aportes de colaboradores.
6. Falta repetir baseline, backup/restore, migraciones y smoke end-to-end sobre
   la candidata final de produccion.

### 6. Dictamen tecnico a la fecha de corte

**NO CERTIFICABLE TODAVIA COMO LISTO PARA PRODUCCION.**

El beta es identificable y operativo, pero existen gates de seguridad,
licenciamiento, privacidad y titularidad pendientes. Este informe no detecto
evidencia de Aspose dentro del artefacto publicado y no detecto una dependencia
AGPL en los inventarios iniciales; esas dos conclusiones estan limitadas a la
captura descrita y deben repetirse sobre la candidata final.

### 7. Condicion para herencia 1:1 hacia produccion

Produccion solo podra invocar este expediente si:

- los cuatro IDs de imagen y el hash agregado del frontend coinciden;
- no cambian paquetes, assets, Dockerfiles ni configuracion relevante;
- los avisos legales y textos aprobados tambien se despliegan;
- los gates pendientes quedan cerrados antes de la fecha de firma;
- se adjunta una comparacion automatizada beta-produccion sin diferencias.

### 8. Firmas requeridas para el certificado final

- Responsable tecnico: ____________________  Fecha: __________
- Titular o representante legal: __________  Fecha: __________
- Abogado/agente de propiedad intelectual: _  Fecha: __________

Este documento es evidencia tecnica y no sustituye la resolucion de SENADI, una
opinion legal profesional ni la certificacion emitida por una autoridad publica.
> Nota de identidad: la etiqueta mutable `giproy-beta-backend:beta` apunta ahora
> a `sha256:d2a0ff...`, pero el contenedor efectivamente publicado continúa
> ejecutando `sha256:804761...`. El certificado usa siempre `.Image` del
> contenedor, no la etiqueta.
