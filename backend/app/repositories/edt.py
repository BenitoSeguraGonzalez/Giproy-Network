from sqlalchemy.orm import Session, joinedload
from app.models.edt import EdtNode, TipoNodoEdt
from app.schemas.edt import EdtNodeCreate, EdtNodeUpdate, EdtNodeMove
from typing import List, Optional

class EdtRepository:
    def _sync_stakeholder_role(self, db: Session, node: EdtNode, empresa_id: int) -> None:
        if node.tipo_nodo != TipoNodoEdt.STAKEHOLDER or not node.stakeholder_id:
            return
        from app.repositories.stakeholder import stakeholder_repo
        stakeholder_repo.sync_role_from_project_structure(
            db,
            proyecto_id=node.proyecto_id,
            stakeholder_id=node.stakeholder_id,
            rol_id=node.rol_id,
        )

    def get_tree(self, db: Session, proyecto_id: int, empresa_id: int) -> List[EdtNode]:
        """Devuelve los nodos raíz (parent_id = None). FastAPI serializará los hijos recursivamente."""
        return db.query(EdtNode)\
            .options(joinedload(EdtNode.stakeholder), joinedload(EdtNode.rol))\
            .filter(EdtNode.proyecto_id == proyecto_id, 
                    EdtNode.empresa_id == empresa_id,
                    EdtNode.parent_id == None)\
            .order_by(EdtNode.orden.asc())\
            .all()

    def _get_branch_prefix(self, db: Session, parent_id: Optional[int], empresa_id: int) -> str:
        if not parent_id:
            return ""
        padre = db.query(EdtNode).filter(
            EdtNode.id == parent_id,
            EdtNode.empresa_id == empresa_id
        ).first()
        return padre.codigo if padre else ""

    def _build_codigo(self, prefix: str, tipo_nodo: TipoNodoEdt, cuenta_idx: int, stakeholder_idx: int) -> str:
        if tipo_nodo == TipoNodoEdt.CUENTA_PAQUETE:
            return f"{prefix}.{cuenta_idx}" if prefix else str(cuenta_idx)
        return f"{prefix}.R{stakeholder_idx}" if prefix else f"R{stakeholder_idx}"

    def _sync_presupuesto_codes(self, db: Session, proyecto_id: int, empresa_id: int) -> None:
        from app.services.presupuesto import sync_presupuesto_codes_with_edt
        sync_presupuesto_codes_with_edt(db, proyecto_id, empresa_id)
            
    def _recalcular_rama(self, db: Session, parent_id: Optional[int], proyecto_id: int, prefix: str, empresa_id: int):
        """Actualiza recursivamente los códigos y orden en una rama específica"""
        hijos = db.query(EdtNode)\
                  .filter(EdtNode.proyecto_id == proyecto_id,
                          EdtNode.empresa_id == empresa_id,
                          EdtNode.parent_id == parent_id)\
                  .order_by(EdtNode.orden.asc(), EdtNode.id.asc())\
                  .all()
        cuenta_idx = 0
        stakeholder_idx = 0
        for idx, hijo in enumerate(hijos):
            # Normalizar el orden (0, 1, 2...)
            hijo.orden = idx
            if hijo.tipo_nodo == TipoNodoEdt.CUENTA_PAQUETE:
                cuenta_idx += 1
            else:
                stakeholder_idx += 1
            nuevo_codigo = self._build_codigo(prefix, hijo.tipo_nodo, cuenta_idx, stakeholder_idx)
            hijo.codigo = nuevo_codigo
            
            # Recursión
            self._recalcular_rama(db, hijo.id, proyecto_id, nuevo_codigo, empresa_id)

    def create(self, db: Session, obj_in: EdtNodeCreate, empresa_id: int) -> EdtNode:
        # 1. Encontrar el último orden en este nivel (parent_id)
        ultimo = db.query(EdtNode)\
                   .filter(EdtNode.proyecto_id == obj_in.proyecto_id,
                           EdtNode.empresa_id == empresa_id,
                           EdtNode.parent_id == obj_in.parent_id)\
                   .order_by(EdtNode.orden.desc())\
                   .first()
        nuevo_orden = ultimo.orden + 1 if ultimo else 0

        db_obj = EdtNode(
            proyecto_id=obj_in.proyecto_id,
            parent_id=obj_in.parent_id,
            tipo_nodo=obj_in.tipo_nodo,
            orden=nuevo_orden,
            codigo="TBD",
            nombre=obj_in.nombre,
            definicion=obj_in.definicion,
            stakeholder_id=obj_in.stakeholder_id,
            rol_id=obj_in.rol_id,
            actividades_claves=obj_in.actividades_claves,
            empresa_id=empresa_id
        )
        db.add(db_obj)
        db.flush()
        parent_prefix = self._get_branch_prefix(db, obj_in.parent_id, empresa_id)
        self._recalcular_rama(db, obj_in.parent_id, obj_in.proyecto_id, parent_prefix, empresa_id)
        self._sync_stakeholder_role(db, db_obj, empresa_id)
        self._sync_presupuesto_codes(db, obj_in.proyecto_id, empresa_id)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, id: int, obj_in: EdtNodeUpdate, empresa_id: int) -> Optional[EdtNode]:
        db_obj = db.query(EdtNode).filter(EdtNode.id == id, EdtNode.empresa_id == empresa_id).first()
        if not db_obj:
            return None
        
        update_data = obj_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)

        self._sync_stakeholder_role(db, db_obj, empresa_id)
        self._sync_presupuesto_codes(db, db_obj.proyecto_id, empresa_id)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def move(self, db: Session, id: int, obj_in: EdtNodeMove, empresa_id: int) -> Optional[EdtNode]:
        db_obj = db.query(EdtNode).filter(EdtNode.id == id, EdtNode.empresa_id == empresa_id).first()
        if not db_obj:
            return None
            
        old_parent_id = db_obj.parent_id
        proyecto_id = db_obj.proyecto_id
        
        # 1. Cambiar el padre y forzar el orden a un número alto temporal
        db_obj.parent_id = obj_in.new_parent_id
        db_obj.orden = obj_in.new_orden
        db.commit() # Guardar el cambio jerárquico

        # 2. Arreglar huecos en la rama antigua (si se movió de rama)
        if old_parent_id != obj_in.new_parent_id:
            prefijo_antiguo = self._get_branch_prefix(db, old_parent_id, empresa_id)
            self._recalcular_rama(db, old_parent_id, proyecto_id, prefijo_antiguo, empresa_id)
            
        # 3. Arreglar cruces y huecos en la rama nueva.
        prefijo_nuevo = self._get_branch_prefix(db, obj_in.new_parent_id, empresa_id)
            
        # Aquí la re-ordenacion puede dar colisiones (dos con orden=1).
        # Un enfoque simple es leer todos los hijos *excepto* el nuestro
        hijos = db.query(EdtNode)\
                  .filter(EdtNode.proyecto_id == proyecto_id,
                          EdtNode.empresa_id == empresa_id,
                          EdtNode.parent_id == obj_in.new_parent_id,
                          EdtNode.id != id)\
                  .order_by(EdtNode.orden.asc())\
                  .all()
                  
        # Insertar nuestro nodo en la posición deseada de la lista Python
        # y luego escribir a la BD y recalcular todo.
        hijos.insert(obj_in.new_orden, db_obj)
        
        for idx, hijo in enumerate(hijos):
            hijo.orden = idx
        self._recalcular_rama(db, obj_in.new_parent_id, proyecto_id, prefijo_nuevo, empresa_id)
            
        self._sync_presupuesto_codes(db, proyecto_id, empresa_id)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def delete(self, db: Session, id: int, empresa_id: int):
        db_obj = db.query(EdtNode).filter(EdtNode.id == id, EdtNode.empresa_id == empresa_id).first()
        if not db_obj:
            return False
            
        parent_id = db_obj.parent_id
        proyecto_id = db_obj.proyecto_id
        
        db.delete(db_obj) # El ON DELETE CASCADE borrará los hijos
        db.commit()
        
        # Recalcular códigos de la rama donde estaba para no dejar huecos
        prefijo = self._get_branch_prefix(db, parent_id, empresa_id)
        self._recalcular_rama(db, parent_id, proyecto_id, prefijo, empresa_id)
        self._sync_presupuesto_codes(db, proyecto_id, empresa_id)
        db.commit()
        
        return True


    def delete_multiple(self, db: Session, ids: List[int], empresa_id: int):
        nodes = db.query(EdtNode).filter(EdtNode.id.in_(ids), EdtNode.empresa_id == empresa_id).all()
        if not nodes:
            return
            
        affected_parents = {node.parent_id for node in nodes}
        proyecto_id = nodes[0].proyecto_id
        
        # Borrar de forma masiva
        db.query(EdtNode).filter(EdtNode.id.in_(ids), EdtNode.empresa_id == empresa_id).delete(synchronize_session=False)
        db.commit()
        
        # Recalcular ramas afectadas
        for p_id in affected_parents:
            if p_id in ids:
                continue
                
            prefijo = self._get_branch_prefix(db, p_id, empresa_id)
            self._recalcular_rama(db, p_id, proyecto_id, prefijo, empresa_id)
        self._sync_presupuesto_codes(db, proyecto_id, empresa_id)
        db.commit()

    def move_multiple(self, db: Session, ids: List[int], new_parent_id: Optional[int], empresa_id: int):
        nodes = db.query(EdtNode).filter(EdtNode.id.in_(ids), EdtNode.empresa_id == empresa_id).all()
        if not nodes:
            return

        affected_old_parents = {node.parent_id for node in nodes if node.parent_id != new_parent_id}
        proyecto_id = nodes[0].proyecto_id

        # 1. Mover todos al nuevo padre
        ultimo = db.query(EdtNode).filter(
            EdtNode.proyecto_id == proyecto_id,
            EdtNode.empresa_id == empresa_id,
            EdtNode.parent_id == new_parent_id
        ).order_by(EdtNode.orden.desc()).first()
        base_orden = (ultimo.orden + 1) if ultimo else 0

        for idx, node in enumerate(nodes):
            node.parent_id = new_parent_id
            node.orden = base_orden + idx
        db.commit()

        # 2. Recalcular ramas antiguas
        for p_id in affected_old_parents:
            prefijo = self._get_branch_prefix(db, p_id, empresa_id)
            self._recalcular_rama(db, p_id, proyecto_id, prefijo, empresa_id)

        # 3. Recalcular rama nueva
        prefijo_nuevo = self._get_branch_prefix(db, new_parent_id, empresa_id)
        self._recalcular_rama(db, new_parent_id, proyecto_id, prefijo_nuevo, empresa_id)
        self._sync_presupuesto_codes(db, proyecto_id, empresa_id)
        
        db.commit()

edt_repo = EdtRepository()
