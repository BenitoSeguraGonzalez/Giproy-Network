# GiProy Network

## Matriz de pendientes para cumplimiento de licenciamiento y registro de software

**Fecha de emisión:** 11 de agosto de 2026  
**Versión examinada:** despliegue beta publicado  
**URL de referencia:** `giproy.excomconsultores.com`  
**TASK de trazabilidad:** `TASK-2045`  
**Estado:** documento de trabajo para regularización; no constituye dictamen legal

---

## 1. Objeto

Este documento identifica las actuaciones pendientes para:

1. acreditar la autoría y titularidad de GiProy Network;
2. cumplir las licencias de los componentes de terceros incorporados al
   artefacto publicado;
3. preparar un ejemplar identificable y reproducible para el registro como
   programa de ordenador ante SENADI;
4. evitar que herramientas internas, secretos, datos personales o materiales
   sin derecho de distribución formen parte del depósito;
5. habilitar posteriormente un certificado técnico final de composición y
   cumplimiento de licencias.

GiProy puede mantenerse como software propietario. No es necesario licenciar
todo el sistema bajo GNU GPL para registrarlo. Las obligaciones copyleft se
analizan por componente, forma de integración, modificaciones y existencia o no
de distribución.

---

## 2. Resumen ejecutivo de pendientes

| Prioridad | Frente | Estado actual | Condición de cierre |
|---|---|---|---|
| Crítica | Cadena de titularidad | No acreditada documentalmente | Contratos, cesiones y acta de titularidad firmados |
| Crítica | React Leaflet / Hippocratic-2.1 | Incluido en frontend publicado | Sustitución o dictamen jurídico favorable escrito |
| Crítica | Política de privacidad aceptada | Checkbox sin texto legal enlazado comprobado | Texto versionado, accesible y aceptación trazable |
| Alta | Avisos de terceros | No existe paquete final demostrado | `THIRD_PARTY_NOTICES` y textos completos publicados |
| Alta | SBOM de producción | Inventario inicial, no expediente final | SBOM SPDX/CycloneDX generado desde imágenes finales |
| Alta | OpenStreetMap | Atribución inconsistente | Atribución y políticas de uso verificadas en todos los flujos |
| Alta | Backend GPL/LGPL/MPL | Componentes identificados | Clasificación, avisos y distribución documentadas |
| Alta | Ejemplar SENADI | No congelado | Paquete sin secretos ni datos reales, firmado por hashes |
| Media | Assets y datasets | Evidencia parcial | Proveniencia y permisos por cada familia de activos |
| Media | Datos societarios | Pendientes | Razón social, RUC, domicilio y representante confirmados |
| Media | Revisión profesional | Pendiente | Abogado ecuatoriano revisa y firma el expediente final |

---

## 3. Titularidad del código y de la obra

### 3.1 Documentos necesarios

- [ ] Identificar a todas las personas autoras de partes sustanciales del
  sistema, incluida la base histórica o migrada.
- [ ] Obtener contratos laborales con cláusulas suficientes sobre derechos
  patrimoniales del software creado dentro de la relación laboral.
- [ ] Obtener cesiones expresas de derechos patrimoniales de contratistas,
  proveedores y colaboradores externos.
- [ ] Confirmar titularidad o licencia del código heredado de versiones Delphi.
- [ ] Identificar código recibido de clientes, socios, repositorios externos o
  ejemplos de terceros y separarlo del código propio.
- [ ] Elaborar una declaración interna sobre el uso de asistentes de IA y la
  revisión humana de los resultados incorporados.
- [ ] Aprobar mediante acta la razón social que figurará como titular o
  productor y la versión exacta que será depositada.

### 3.2 Información societaria pendiente

- Razón social: ______________________________
- Nombre comercial: __________________________
- RUC: ______________________________________
- Domicilio legal: ___________________________
- Representante legal: _______________________
- Correo contractual: ________________________
- Teléfono: __________________________________
- Autores declarados: ________________________

### 3.3 Evidencia de cierre

- Copias firmadas de contratos o cesiones.
- Acta de titularidad y autorización de registro.
- Matriz `autor -> módulo/aporte -> relación -> documento habilitante`.
- Declaración de originalidad limitada al código y materiales propios.

---

## 4. Componentes frontend que requieren regularización

### 4.1 React Leaflet y `@react-leaflet/core`

**Versiones observadas:** `react-leaflet@4.2.1` y
`@react-leaflet/core@2.1.0`.  
**Licencia declarada:** Hippocratic-2.1.  
**Prioridad:** crítica.

Acción requerida, eligiendo una ruta documentada:

- [ ] Sustituir ambos paquetes por una implementación con licencia permisiva;
  o
- [ ] Obtener un dictamen jurídico escrito que confirme la aceptación y el
  cumplimiento de Hippocratic-2.1 para todos los usos ofrecidos por GiProy.

La sustitución no debe eliminar la atribución ni las condiciones propias de
Leaflet, que declara BSD-2-Clause.

### 4.2 `web-ifc`

**Versión observada:** `0.0.77`.  
**Licencia:** MPL-2.0.  
**Prioridad:** alta.

- [ ] Incluir el texto completo MPL-2.0 y los avisos del componente.
- [ ] Comprobar si GiProy modificó archivos originales de `web-ifc`.
- [ ] Si existen archivos MPL modificados y distribuidos, conservarlos
  disponibles bajo MPL-2.0 con su código fuente correspondiente.
- [ ] Documentar que la obligación es por archivo y no convierte
  automáticamente todo GiProy en MPL.
- [ ] Registrar JavaScript, workers y WASM efectivamente incluidos en el bundle.

### 4.3 JSZip y Pako

- [ ] Declarar por escrito que `jszip@3.10.1` se utiliza bajo la alternativa
  MIT de su expresión `(MIT OR GPL-3.0-or-later)`.
- [ ] Conservar el aviso MIT de JSZip.
- [ ] Conservar los avisos MIT y Zlib que correspondan a Pako.

### 4.4 Dependencias permisivas

Para MIT, BSD, ISC, Apache-2.0, 0BSD y otras licencias permisivas:

- [ ] Registrar nombre, versión, licencia SPDX, copyright y URL oficial.
- [ ] Incorporar el texto de cada licencia al paquete de avisos.
- [ ] Conservar archivos `NOTICE` exigibles, especialmente bajo Apache-2.0.
- [ ] Identificar modificaciones locales relevantes.

---

## 5. Componentes backend que requieren regularización

### 5.1 `language_tool_python`

**Versión observada:** `2.9.4`.  
**Licencia:** GPL-3.0-only.  
**Uso observado:** backend SaaS no enviado al navegador.

- [ ] Confirmar que la librería Python no fue modificada.
- [ ] Conservar licencia, copyright, URL oficial, versión y hash.
- [ ] Documentar que el componente se ejecuta en el servidor y no se entrega al
  usuario final en el funcionamiento normal del SaaS.
- [ ] Identificar la versión y licencia del núcleo Java LanguageTool descargado
  o ejecutado por la librería.
- [ ] Documentar si alguna imagen backend se entrega a clientes, operadores o
  terceros; si se entrega, revisar las obligaciones de distribución y código
  fuente correspondiente antes de hacerlo.
- [ ] Evaluar como medida de simplificación su aislamiento como servicio o su
  sustitución por una alternativa permisiva.

### 5.2 Otros paquetes con tratamiento especial

- [ ] `psycopg2-binary@2.9.9`: archivar LGPL y su excepción aplicable.
- [ ] `certifi`: archivar MPL-2.0 y avisos.
- [ ] `tqdm`: resolver y registrar la expresión `MPL-2.0 AND MIT`.
- [ ] `pdfplumber@0.11.9`: completar la licencia desde la distribución oficial,
  ya que la metadata runtime no presentó una expresión legible.
- [ ] Inventariar Python, Java runtime y librerías del sistema operativo de la
  imagen final.

### 5.3 Servicios e imágenes de infraestructura

- [ ] Registrar licencia y digest de PostgreSQL 18.
- [ ] Registrar licencia y digest de Nginx.
- [ ] Registrar licencia, digest y avisos de OWASP ModSecurity CRS.
- [ ] Registrar las imágenes base `python:3.12-slim`, `node:22-alpine` y
  `nginx:1.27-alpine` usadas en la construcción.
- [ ] Diferenciar herramientas de build de componentes presentes en runtime.

---

## 6. Mapas, servicios y atribuciones

### 6.1 OpenStreetMap

- [ ] Añadir atribución visible y enlazada en `DatosProyecto`, donde el
  `TileLayer` observado no declara atribución explícita.
- [ ] Confirmar atribución visible en el panel cartográfico BIM.
- [ ] Revisar los mapas generados en reportes PDF y añadir la atribución que
  corresponda.
- [ ] Cumplir la política de uso de teselas de OpenStreetMap.
- [ ] Cumplir la política de Nominatim para geocodificación.
- [ ] Añadir identificación HTTP adecuada, límites, caché y proveedor alterno
  cuando el volumen productivo lo requiera.
- [ ] Registrar condiciones de cualquier capa XYZ o WMS añadida por usuarios.

### 6.2 Servicios externos

- [ ] Inventariar correo, DNS, proxy, almacenamiento, pagos, mapas, descarga de
  datos públicos y cualquier API externa usada en producción.
- [ ] Archivar términos aplicables, región de tratamiento, subencargado y base
  contractual de cada servicio.

---

## 7. Assets, datasets y materiales documentales

### 7.1 Corpus buildingSMART

- [ ] Mantener la licencia CC BY 4.0.
- [ ] Conservar autor, editor, título, URL y atribución de cada IFC.
- [ ] Indicar si un modelo fue modificado.
- [ ] Separar los modelos de prueba del material declarado como creación propia.
- [ ] Confirmar si el corpus se incluye realmente en el ejemplar o solo en tests.

### 7.2 Datos del SRI

- [ ] Documentar procedencia oficial, fecha y versión del dataset.
- [ ] Documentar condiciones de reutilización y límites de responsabilidad.
- [ ] Excluir del depósito datos personales o empresariales productivos.
- [ ] Entregar únicamente esquema, migraciones y fixtures ficticios mínimos.

### 7.3 Marca, logos, imágenes y documentos

- [ ] Acreditar titularidad o licencia del nombre y logo GiProy.
- [ ] Revisar imágenes de Marketplace, licencias comerciales y documentación.
- [ ] Revisar iconos, SVG, fuentes, plantillas Excel/PDF y ejemplos importados.
- [ ] Retirar cualquier material sin autor o procedencia verificable.
- [ ] Separar marcas de terceros de la titularidad del programa.

### 7.4 Exclusión obligatoria de Aspose

El repositorio local contiene un directorio denominado como copia retail con
clave de licencia de Aspose. No apareció dentro de las imágenes beta auditadas.

- [ ] Mantener `Complementos/Aspose...` fuera de todo build, SBOM, depósito,
  respaldo entregable y paquete de producción.
- [ ] Eliminarlo del índice Git mediante una TASK de saneamiento autorizada o
  acreditar documentalmente una licencia comercial válida y su alcance.
- [ ] No incluir claves `.lic` en ningún expediente.
- [ ] Añadir una guarda de build que impida su incorporación accidental.

---

## 8. Avisos y documentos de licenciamiento que deben generarse

- [ ] `LICENSE-PROPRIETARY.md`: condiciones del código propio de GiProy.
- [ ] `THIRD_PARTY_NOTICES.md`: tabla completa de componentes runtime.
- [ ] Directorio `licenses/`: copia íntegra de textos aplicables.
- [ ] SBOM frontend en formato SPDX o CycloneDX.
- [ ] SBOM backend e imágenes runtime en formato SPDX o CycloneDX.
- [ ] Matriz de obligaciones por licencia.
- [ ] Declaración de modificaciones de componentes copyleft.
- [ ] Declaración de componentes excluidos y herramientas internas.
- [ ] Página o modal accesible de “Licencias de terceros” dentro del producto.
- [ ] Procedimiento para regenerar SBOM y avisos en cada release.

El archivo raíz `frontend/package.json` puede continuar con
`"license": "UNLICENSED"` si el código propio será propietario, pero el
expediente debe explicar esa decisión y aportar una licencia contractual de uso
del SaaS para los clientes.

---

## 9. Privacidad y aceptación legal antes de producción

El sistema registra aceptación de una política de privacidad, pero no se
encontró el texto legal enlazado desde los controles de registro examinados.

- [ ] Redactar y aprobar Términos y Condiciones.
- [ ] Redactar y aprobar Política de Privacidad.
- [ ] Preparar acuerdo de tratamiento de datos para empresas cliente.
- [ ] Preparar política de cookies y tecnologías equivalentes a partir de un
  inventario técnico real.
- [ ] Separar aceptación contractual, información de privacidad y autorización
  opcional de publicidad.
- [ ] Mostrar enlaces accesibles antes de aceptar.
- [ ] Registrar versión del documento, fecha de vigencia, usuario, empresa,
  momento de aceptación y evidencia técnica proporcionada.
- [ ] Implementar retirada o gestión del consentimiento cuando sea aplicable.
- [ ] Publicar contacto para derechos de protección de datos.

Estos documentos no sustituyen el cumplimiento de licencias, pero son un gate
separado para declarar el servicio listo para producción.

---

## 10. Preparación del ejemplar para SENADI

### 10.1 Contenido recomendado

- [ ] Solicitud y comprobantes exigidos por SENADI.
- [ ] Código fuente de la versión congelada.
- [ ] Ejecutable o artefacto reproducible aplicable.
- [ ] Memoria descriptiva y arquitectura.
- [ ] Manual técnico y manual de usuario.
- [ ] Instrucciones de instalación o construcción.
- [ ] Migraciones de base de datos sin datos productivos.
- [ ] SBOM y avisos de terceros.
- [ ] Declaración de autoría, titularidad y cesiones.
- [ ] Hashes SHA-256 del paquete y sus anexos.
- [ ] Acta que relaciona versión, commit, imágenes y fecha de depósito.

### 10.2 Exclusiones obligatorias

- [ ] `.env`, tokens, contraseñas, certificados y claves API.
- [ ] Dumps, backups, uploads, logs e historiales.
- [ ] Datos reales de usuarios, empresas, proyectos o transacciones.
- [ ] Claves de licencia de terceros.
- [ ] Herramientas internas no integrantes de la obra depositada.
- [ ] Dependencias descargables completas cuando baste identificarlas y aportar
  sus avisos, salvo que su licencia o el formato de entrega exija otra cosa.

---

## 11. Secuencia recomendada de regularización

### Fase 1 - Bloqueos jurídicos

1. Confirmar titular y autores.
2. Cerrar contratos y cesiones.
3. Resolver React Leaflet/Hippocratic-2.1.
4. Excluir o regularizar definitivamente Aspose.

### Fase 2 - Cumplimiento de terceros

1. Generar SBOM desde imágenes.
2. Resolver licencias y metadata incompleta.
3. Crear avisos y directorio de licencias.
4. Verificar modificaciones MPL/GPL/LGPL.
5. Corregir atribuciones de mapas y datasets.

### Fase 3 - Documentación contractual y privacidad

1. Aprobar Términos y Condiciones.
2. Aprobar Política de Privacidad y acuerdo de tratamiento.
3. Integrar textos versionados y aceptación trazable.
4. Ejecutar revisión de protección de datos.

### Fase 4 - Congelación y depósito

1. Cerrar TASK-2044 y gates técnicos de producción.
2. Construir la candidata final.
3. Generar SBOM, avisos y hashes nuevamente.
4. Preparar paquete limpio de SENADI.
5. Obtener revisión jurídica y firmas.
6. Presentar el registro.

---

## 12. Criterio de cumplimiento completo

No se considerará cerrado el licenciamiento hasta que:

- toda dependencia runtime tenga licencia, versión, fuente y obligación
  identificadas;
- todos los avisos exigibles estén incorporados al artefacto o documentación;
- las obligaciones copyleft estén cumplidas por componente;
- los materiales propios tengan cadena de titularidad;
- los materiales externos tengan permiso y atribución;
- el ejemplar depositado no contenga secretos ni datos reales;
- la versión examinada coincida mediante hashes con la entregada;
- un abogado ecuatoriano revise las cesiones y declaraciones jurídicas.

---

## 13. Estado estimado al 11 de agosto de 2026

| Área | Avance estimado |
|---|---:|
| Identificación del beta | 100% |
| Inventario técnico inicial | 80% |
| Cadena documental de titularidad | 0% acreditado |
| Avisos y textos de terceros | 20% |
| Resolución de licencias sensibles | 25% |
| Atribuciones de mapas y datasets | 50% |
| Privacidad y aceptación versionada | 20% |
| Paquete depositable SENADI | 10% |
| Cumplimiento global estimado | 40% |

Los porcentajes son una medida operativa del expediente, no una conclusión
jurídica ni una garantía de aceptación por SENADI.

---

## 14. Aprobaciones de cierre

- Responsable técnico: ____________________  Fecha: __________
- Responsable de seguridad: _______________  Fecha: __________
- Titular/representante legal: _____________  Fecha: __________
- Abogado de propiedad intelectual: ________  Fecha: __________

