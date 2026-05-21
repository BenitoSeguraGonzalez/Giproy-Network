from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.stakeholder import Stakeholder, Rol, ProyectoStakeholder
from app.models.proyecto import Proyecto
from app.schemas.stakeholder import StakeholderCreate, StakeholderUpdate, RolCreate, RolUpdate

class StakeholderRepository:
    def _build_next_code(self, db: Session, model, prefix: str, empresa_id: int) -> str:
        last_obj = (
            db.query(model)
            .filter(model.empresa_id == empresa_id)
            .order_by(model.id.desc())
            .first()
        )
        next_num = 1
        last_code = getattr(last_obj, "codigo", "") if last_obj else ""
        if last_code.startswith(f"{prefix}-"):
            try:
                next_num = int(last_code.split("-")[1]) + 1
            except Exception:
                next_num = 1
        return f"{prefix}-{next_num:04d}"

    # --- STAKEHOLDERS ---
    def get_by_id(self, db: Session, id: int):
        return db.query(Stakeholder).filter(Stakeholder.id == id).first()

    def _get_root_project(self, db: Session, proyecto_id: int) -> Optional[Proyecto]:
        proyecto = db.query(Proyecto).filter(Proyecto.id == proyecto_id).first()
        if not proyecto:
            return None

        root_code = proyecto.codigo_root or proyecto.codigo
        return db.query(Proyecto).filter(
            Proyecto.empresa_id == proyecto.empresa_id,
            Proyecto.codigo_root == root_code
        ).order_by(
            Proyecto.revision.asc(),
            Proyecto.codigo.asc(),
            Proyecto.id.asc()
        ).first()

    def _resolve_root_codigo(self, db: Session, empresa_id: int, codigo_or_root: str) -> str:
        proyecto = db.query(Proyecto).filter(
            Proyecto.empresa_id == empresa_id,
            (Proyecto.codigo_root == codigo_or_root) | (Proyecto.codigo == codigo_or_root)
        ).order_by(
            Proyecto.revision.asc(),
            Proyecto.codigo.asc(),
            Proyecto.id.asc()
        ).first()
        if not proyecto:
            return codigo_or_root
        return proyecto.codigo_root or proyecto.codigo

    def _resolve_root_project_id(self, db: Session, proyecto_id: int) -> int:
        root_project = self._get_root_project(db, proyecto_id)
        if not root_project:
            raise ValueError("Proyecto no encontrado")
        return root_project.id

    def get_by_project_root(self, db: Session, codigo_root: str, empresa_id: int, proyecto_id: Optional[int] = None):
        """
        Obtiene todos los stakeholders de la empresa para este proyecto raíz.
        Si se pasa proyecto_id (revisión específica), resuelve su proyecto raíz
        e inyecta el estado 'assigned' y el 'rol' compartidos por el grupo raíz.
        """
        resolved_codigo_root = self._resolve_root_codigo(db, empresa_id, codigo_root)
        stks = db.query(Stakeholder).filter(
            Stakeholder.proyecto_codigo_root == resolved_codigo_root,
            Stakeholder.empresa_id == empresa_id
        ).order_by(Stakeholder.fecha_creacion.asc()).all()

        if proyecto_id:
            root_project_id = self._resolve_root_project_id(db, proyecto_id)
            assignments = db.query(ProyectoStakeholder).filter(
                ProyectoStakeholder.proyecto_id == root_project_id
            ).all()
            
            assign_map = {a.stakeholder_id: a for a in assignments}
            
            for s in stks:
                if s.id in assign_map:
                    s.assigned = True
                    s.rol_id = assign_map[s.id].rol_id
                    s.rol_nombre = assign_map[s.id].rol.nombre if assign_map[s.id].rol else None
                else:
                    s.assigned = False
                    s.rol_id = None
                    s.rol_nombre = None
        
        return stks

    def create(self, db: Session, obj_in: StakeholderCreate, empresa_id: int):
        payload = obj_in.model_dump()
        payload["proyecto_codigo_root"] = self._resolve_root_codigo(
            db,
            empresa_id,
            payload["proyecto_codigo_root"],
        )
        db_obj = Stakeholder(
            **payload,
            codigo=self._build_next_code(db, Stakeholder, "STK", empresa_id),
            empresa_id=empresa_id
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, db_obj: Stakeholder, obj_in: StakeholderUpdate):
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_delete_block_reason(self, db: Session, stakeholder_id: int) -> Optional[str]:
        from app.models.edo import EdoNode
        from app.models.edt import EdtNode

        has_edo_usage = db.query(EdoNode.id).filter(
            EdoNode.stakeholder_id == stakeholder_id
        ).first() is not None
        has_edt_usage = db.query(EdtNode.id).filter(
            EdtNode.stakeholder_id == stakeholder_id
        ).first() is not None
        has_role_assignment = db.query(ProyectoStakeholder.id).filter(
            ProyectoStakeholder.stakeholder_id == stakeholder_id,
            ProyectoStakeholder.rol_id.isnot(None),
        ).first() is not None

        if has_edo_usage or has_edt_usage or has_role_assignment:
            sources = []
            if has_edo_usage:
                sources.append("EDO")
            if has_edt_usage:
                sources.append("EDT")
            if has_role_assignment and not sources:
                sources.append("EDO/EDT")
            return (
                "No se puede eliminar este stakeholder porque tiene un rol o uso activo en "
                f"{' y '.join(sources)}. Primero debe liberarse en EDO/EDT."
            )
        return None

    def delete(self, db: Session, id: int):
        obj = db.query(Stakeholder).get(id)
        if obj:
            block_reason = self.get_delete_block_reason(db, id)
            if block_reason:
                raise ValueError(block_reason)
            db.delete(obj)
            db.commit()
        return obj

    # --- ROLES ---
    def get_roles(self, db: Session, empresa_id: int):
        return db.query(Rol).filter(Rol.empresa_id == empresa_id).all()

    def get_rol_by_id(self, db: Session, id: int):
        return db.query(Rol).filter(Rol.id == id).first()

    def create_rol(self, db: Session, obj_in: RolCreate, empresa_id: int):
        db_obj = Rol(
            **obj_in.model_dump(),
            codigo=self._build_next_code(db, Rol, "ROL", empresa_id),
            empresa_id=empresa_id
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update_rol(self, db: Session, db_obj: Rol, obj_in: RolUpdate):
        for field, value in obj_in.model_dump(exclude_unset=True).items():
            setattr(db_obj, field, value)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def delete_rol(self, db: Session, id: int):
        obj = db.query(Rol).get(id)
        if obj:
            db.delete(obj)
            db.commit()
        return obj

    # --- ASSIGNMENTS ---
    def assign_to_project(self, db: Session, proyecto_id: int, stakeholder_id: int, rol_id: Optional[int] = None):
        self.sync_role_from_project_structure(
            db,
            proyecto_id=proyecto_id,
            stakeholder_id=stakeholder_id,
            rol_id=rol_id,
        )
        db.commit()
        return True

    def sync_role_from_project_structure(
        self,
        db: Session,
        proyecto_id: int,
        stakeholder_id: int,
        rol_id: Optional[int] = None,
    ) -> bool:
        """
        Sincroniza el rol consolidado del directorio Stakeholders desde EDO/EDT.
        No hace commit: debe ejecutarse dentro de la transaccion del guardado origen.
        """
        root_project = self._get_root_project(db, proyecto_id)
        stakeholder = self.get_by_id(db, stakeholder_id)
        if not root_project or not stakeholder:
            raise ValueError("Proyecto o stakeholder no encontrado")

        root_code = root_project.codigo_root or root_project.codigo
        if stakeholder.proyecto_codigo_root != root_code:
            raise ValueError("El stakeholder no pertenece al proyecto raíz seleccionado")

        if rol_id is not None:
            role = self.get_rol_by_id(db, rol_id)
            if not role or role.empresa_id != root_project.empresa_id:
                raise ValueError("El rol no pertenece a la empresa del proyecto")

        existing = db.query(ProyectoStakeholder).filter(
            ProyectoStakeholder.proyecto_id == root_project.id,
            ProyectoStakeholder.stakeholder_id == stakeholder_id
        ).first()

        if existing:
            existing.rol_id = rol_id
            db.add(existing)
        else:
            new_assign = ProyectoStakeholder(
                proyecto_id=root_project.id,
                stakeholder_id=stakeholder_id,
                rol_id=rol_id
            )
            db.add(new_assign)

        return True

    def unassign_from_project(self, db: Session, proyecto_id: int, stakeholder_id: int):
        root_project_id = self._resolve_root_project_id(db, proyecto_id)
        db.query(ProyectoStakeholder).filter(
            ProyectoStakeholder.proyecto_id == root_project_id,
            ProyectoStakeholder.stakeholder_id == stakeholder_id
        ).delete()
        db.commit()
        return True

stakeholder_repo = StakeholderRepository()
