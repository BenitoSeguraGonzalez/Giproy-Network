# Plan de Acción y Estado de Completación

Este documento rastrea qué partes de la refactorización arquitectónica (Service Layer / Clean Architecture) y qué flujos de la auditoría inicial han culminado, y sirven como mapa de ruta (Roadmap) ejecutable para etapas futuras de programación.

---

## 🟢 FASE 1: AUDITORÍA INICIAL (100% COMPLETADO)
- [x] Análisis del Backend Python, enrutamiento, servicios, ORM y BD.
- [x] Análisis del Frontend React.
- [x] Análisis del modelo de datos PostgreSQL.
- [x] Evaluación de seguridad y escalabilidad de dependencias.

## 🟢 FASE 2: RESOLUCIÓN DE INCIDENCIAS CRÍTICAS (100% COMPLETADO)
- [x] Re-asentamiento de la base de datos PostgreSQL caída. Reconfiguración y resiembra del archivo `.env`. (Contraseña `CEE9846B4CFDA0E7...` y usuario PostgreSQL reinstanciados en local).
- [x] Resolución de corrupciones Hash de contraseña al hacer login bajando versión de la sub-dependencia `bcrypt` a `< 4.0.0` emparejada a `passlib`.
- [x] Modificación y sembrado de clave forzada en Superadmin (`Kathiana96!a!`) vía script automatizado.
- [x] Blindaje transversal de CORS.

## 🟡 FASE 3: REFACTORIZACIÓN A SERVICE LAYER (EN PROGRESO)
El objetivo de esta fase es sacar las validaciones de negocio pesadas y código repetitivo de los Endpoints hacia módulos propios `/services/`. Permite crear funciones atómicas para tests en un futuro.

**Estado por Módulo:**
- [x] **Usuarios** (`usuarios.py`). Migrado a `services/usuario.py`. Control de subroles y peticiones RUC 100% aislados.
- [x] **Empresas** (`empresas.py`). Migrado a `services/empresa.py`. Lógica de negocio y cuotas 100% aisladas.
- [x] **Presupuestos** (`presupuestos.py`). Migrado a `services/presupuesto.py` y `repositories/presupuesto.py`.
- [x] **Proyectos** (`proyectos.py`). Migrado a `services/proyecto.py` y `repositories/proyecto.py`.
- [x] **Recursos** (`recursos.py`). Migrado.
    - [x] Recursos (TASK-0129)
    - [x] Apus (TASK-0130)
    - [x] Dispositivos (TASK-0131)
    - [x] Subcategorías (TASK-0172)
- [x] **Apus** (`apus.py`). Migrado.
- [x] **Dispositivos** (`dispositivos.py`). Migrado a un `services/dispositivo.py`. Gran parte se efectúa en Auth todavía.

## 🟡 FASE 4: DOCUMENTACIÓN CON OPENAPI Y GENERACIÓN DE CLIENTES (EN PROGRESO)
Actualmente Frontend (`src/api/` vía Axios) depende de estar escrito a mano e idéntico a Pydantic en Python.
- [x] Configurar TypeScript o exportación estricta desde FastAPI (`/openapi.json`) a Vite/React para prevenir inconsistencias de Frontend-Backend al meter nuevas tablas en la Fase 3.
- [x] Exportación estática de `openapi.json` para auditoría y generación.
- [ ] Limpiar warnings pasivos en la terminal de Node de lado de React.

## 🟢 FASE 5: DOMINIO MARKETPLACE (100% COMPLETADO)
- [x] Arquitectura y modelos base (TASK-0472).
- [x] Sistema de permisos aditivos (TASK-0473).
- [x] Publicación referenciada, Catálogo y Detalles (TASK-0474 a TASK-0476).
- [x] Checkout, Fulfillment y Clonación (TASK-0477 a TASK-0478).
- [x] Dashboards Comprador, Vendedor y Admin Marketplace (TASK-0479 a TASK-0481).
- [x] Hardening y validación integral (TASK-0482).

---
*Para actualizar o consultar este plan, simplemente indícale a la IA "Inicia los pasos requeridos según el documento de FASE 3 del plan de acción" y de inmediato sabrá en qué situación nos encontramos sin reanalizar todo.*
