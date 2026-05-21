from fastapi import APIRouter
from app.api.endpoints import (
    auth, usuarios, proyectos, empresas, paises, recursos, apus, 
    presupuestos, bases_trabajo, subcategorias, subcategorias_items, 
    dispositivos, utils, maestros, proyecto_detalles, stakeholders, roles, 
    edo, edt, system_announcements, project_calendar_entries, personal_todos, admin_audit, admin_system, admin_import_models,
    admin_maintenance, admin_licenses, admin_bim, cronogramas, polinomica, bim, bim_models, bim_view_states, bim_links,
    cronogramas_trabajo, reporting, community
)
from app.api.endpoints import marketplace

api_router = APIRouter()

@api_router.get("/")
def api_root():
    return {"status": "Operativo", "message": "API v1 root"}
api_router.include_router(auth.router, tags=["Autenticación"])
api_router.include_router(usuarios.router, prefix="/usuarios", tags=["Usuarios"])
api_router.include_router(proyectos.router, prefix="/proyectos", tags=["Proyectos"])
api_router.include_router(proyecto_detalles.router, prefix="/proyecto-detalles", tags=["Detalles de Proyecto"])
api_router.include_router(stakeholders.router, prefix="/stakeholders", tags=["Stakeholders"])
api_router.include_router(roles.router, prefix="/roles", tags=["Roles"])
api_router.include_router(maestros.router, prefix="/maestros", tags=["Datos Maestros"])
api_router.include_router(empresas.router, prefix="/empresas", tags=["Empresas"])
api_router.include_router(paises.router, prefix="/paises", tags=["Países"])
api_router.include_router(recursos.router, prefix="/recursos", tags=["Recursos"])
api_router.include_router(apus.router, prefix="/apus", tags=["APUs"])
api_router.include_router(presupuestos.router, prefix="/presupuestos", tags=["Presupuestos"])
api_router.include_router(bases_trabajo.router, prefix="/bases-trabajo", tags=["Bases de Trabajo"])
api_router.include_router(subcategorias.router, prefix="/subcategorias", tags=["Subcategorías"])
api_router.include_router(subcategorias_items.router, prefix="/subcategorias-items", tags=["Items Subcategorías"])
api_router.include_router(dispositivos.router, prefix="/dispositivos", tags=["Dispositivos"])
api_router.include_router(edo.router, prefix="/edo", tags=["EDO"])
api_router.include_router(edt.router, prefix="/edt", tags=["EDT"])
api_router.include_router(utils.router, prefix="/utils", tags=["Utilidades"])
api_router.include_router(system_announcements.router, prefix="/system-announcements", tags=["Comunicados del Sistema"])
api_router.include_router(project_calendar_entries.router, prefix="/proyectos/calendar-entries", tags=["Calendario de Proyectos"])
api_router.include_router(personal_todos.router, prefix="/usuarios/personal-todos", tags=["Pendientes personales"])
api_router.include_router(admin_audit.router, prefix="/admin-audit", tags=["Auditoría Administrativa"])
api_router.include_router(admin_system.router, prefix="/admin-system", tags=["Estado del Sistema"])
api_router.include_router(admin_import_models.router, prefix="/admin-import-models", tags=["Modelos de Importacion"])
api_router.include_router(admin_maintenance.router, prefix="/admin-maintenance", tags=["Modo Mantenimiento"])
api_router.include_router(admin_bim.router, prefix="/admin-bim", tags=["Configuración BIM"])
api_router.include_router(admin_licenses.router, prefix="/admin-licenses", tags=["Licencias y Cuotas"])
api_router.include_router(cronogramas.router, prefix="/cronogramas", tags=["Cronogramas"])
api_router.include_router(polinomica.router, prefix="/polinomica", tags=["Fórmula Polinómica"])
api_router.include_router(bim.router, prefix="/bim", tags=["BIM"])
api_router.include_router(bim_models.router, prefix="/bim", tags=["BIM"])
api_router.include_router(bim_view_states.router, prefix="/bim", tags=["BIM"])
api_router.include_router(bim_links.router, prefix="/bim", tags=["BIM"])
api_router.include_router(cronogramas_trabajo.router, prefix="/cronogramas-trabajo", tags=["Cronogramas de Trabajo"])
api_router.include_router(reporting.router, prefix="/reporting", tags=["Reportes Profesionales"])
api_router.include_router(community.router, prefix="/community", tags=["Comunidad"])
api_router.include_router(marketplace.router, prefix="/marketplace", tags=["Marketplace"])
