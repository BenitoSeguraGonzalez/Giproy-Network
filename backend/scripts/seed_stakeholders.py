import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.stakeholder import Stakeholder, Rol
from app.models.usuario import Usuario
from app.models.proyecto import Proyecto

def seed():
    db = SessionLocal()
    try:
        # Obtener una empresa real (la primera del primer usuario activo)
        user = db.query(Usuario).first()
        proyecto = db.query(Proyecto).first()

        if not user or not proyecto:
            print("Faltan usuarios o proyectos en la DB para inicializar seed.")
            return
        
        empresa_id = user.empresa_id
        codigo_root_activo = proyecto.codigo_root
        
        # 1. Crear Roles Iniciales
        roles_data = [
            ("Fiscalizador", "Responsable de supervisar la ejecución técnica y cumplimiento del contrato."),
            ("Director de Obra", "Líder técnico del proyecto en sitio."),
            ("Residente de Obra", "Ingeniero responsable del día a día en la construcción."),
            ("Especialista Estructural", "Consultor encargado de la integridad del diseño estructural."),
            ("Gestor Ambiental", "Asegura el cumplimiento de normativas de impacto ambiental."),
            ("Coordinador de Seguridad", "Responsable de SSO (Seguridad y Salud Ocupacional).")
        ]
        
        roles_objs = []
        for i, (nombre, desc) in enumerate(roles_data):
            codigo = f"ROL-{i+1:04d}"
            # Evitar duplicados por código
            exists = db.query(Rol).filter(Rol.codigo == codigo, Rol.empresa_id == empresa_id).first()
            if not exists:
                r = Rol(codigo=codigo, nombre=nombre, descripcion=desc, empresa_id=empresa_id)
                db.add(r)
                roles_objs.append(r)
            else:
                roles_objs.append(exists)
        
        db.commit()

        # 2. Crear 10 Stakeholders Ficticios Reales
        stks_data = [
            {"nombre": "Carlos", "apellidos": "Mendoza Ruiz", "email": "c.mendoza@ingenieria.ec", "movil": "0987456123", "profesion": "Ingeniero Civil", "institucion": "Mendoza & Asociados", "provincia": "Pichincha", "canton": "Quito", "ciudad": "Quito", "direccion_detalle": "Av. Shyris N34-12 y Gaspar de Villarroel", "proyecto_codigo_root": codigo_root_activo},
            {"nombre": "María Elena", "apellidos": "Vinueza Castro", "email": "mvinueza@municipioq.gob.ec", "movil": "0995544332", "profesion": "Arquitecta Urbanista", "institucion": "Municipio de Quito", "provincia": "Pichincha", "canton": "Quito", "ciudad": "Quito", "direccion_detalle": "Venezuela y Chile (Centro Histórico)", "proyecto_codigo_root": codigo_root_activo},
            {"nombre": "Roberto", "apellidos": "Solórzano Zambrano", "email": "r.solorzano@geoproy.com", "movil": "0912233445", "profesion": "Ingeniero Eléctrico", "institucion": "Cnel EP", "provincia": "Guayas", "canton": "Guayaquil", "ciudad": "Guayaquil", "direccion_detalle": "Malecón Simón Bolívar 123", "proyecto_codigo_root": codigo_root_activo},
            {"nombre": "Lucía", "apellidos": "Paredes Holguín", "email": "lparedes@ambiente.gob.ec", "movil": "0988776655", "profesion": "Ingeniera Ambiental", "institucion": "Ministerio del Ambiente", "provincia": "Pichincha", "canton": "Quito", "ciudad": "Quito", "direccion_detalle": "Calle Madrid y Tolosa", "proyecto_codigo_root": codigo_root_activo},
            {"nombre": "Fernando", "apellidos": "Gómez Jurado", "email": "fgomez@constructora.ec", "movil": "0965544332", "profesion": "Maestro Mayor", "institucion": "Construcciones Gómez", "provincia": "Azuay", "canton": "Cuenca", "ciudad": "Cuenca", "direccion_detalle": "Calle Larga y Huayna Cápac", "proyecto_codigo_root": codigo_root_activo},
            {"nombre": "Andrea", "apellidos": "Salazar Ortega", "email": "asalazar@fiscalia.ec", "movil": "0934455667", "profesion": "Abogada", "institucion": "Estudio Salazar & Co", "provincia": "Pichincha", "canton": "Quito", "ciudad": "Quito", "direccion_detalle": "Amazonas y Naciones Unidas", "proyecto_codigo_root": codigo_root_activo},
            {"nombre": "Jorge", "apellidos": "Icaza Martínez", "email": "jicaza@hidro.ec", "movil": "0977889900", "profesion": "Ingeniero Mecánico", "institucion": "Hidroeléctrica Paute", "provincia": "Azuay", "canton": "Paute", "ciudad": "Paute", "direccion_detalle": "Central Molino", "proyecto_codigo_root": codigo_root_activo},
            {"nombre": "Patricio", "apellidos": "Cevallos León", "email": "pcevallos@seguridad.ec", "movil": "0923344556", "profesion": "Técnico SSO", "institucion": "Safety First S.A.", "provincia": "Guayas", "canton": "Daule", "ciudad": "La Aurora", "direccion_detalle": "Vía a Salitre km 12", "proyecto_codigo_root": codigo_root_activo},
            {"nombre": "Silvia", "apellidos": "Moreno Duque", "email": "smoreno@banco.com", "movil": "0956677889", "profesion": "Financiera", "institucion": "Banco del Pichincha", "provincia": "Pichincha", "canton": "Quito", "ciudad": "Quito", "direccion_detalle": "Av. 10 de Agosto y Bogotá", "proyecto_codigo_root": codigo_root_activo},
            {"nombre": "Marco", "apellidos": "Tulio Restrepo", "email": "mtulio@logistica.com", "movil": "0945566778", "profesion": "Gestor Logístico", "institucion": "Logística Nacional", "provincia": "Manabí", "canton": "Manta", "ciudad": "Manta", "direccion_detalle": "Puerto de Manta Muelle 4", "proyecto_codigo_root": codigo_root_activo}
        ]

        for i, data in enumerate(stks_data):
            codigo = f"STK-{i+1:04d}"
            exists = db.query(Stakeholder).filter(Stakeholder.codigo == codigo, Stakeholder.empresa_id == empresa_id).first()
            if not exists:
                s = Stakeholder(**data, codigo=codigo, empresa_id=empresa_id)
                db.add(s)
        
        db.commit()
        print("Seed completado: 6 Roles y 10 Stakeholders creados.")

    finally:
        db.close()

if __name__ == "__main__":
    seed()
