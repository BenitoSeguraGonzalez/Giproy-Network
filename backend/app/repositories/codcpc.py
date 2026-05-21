"""
Repositorio para el Catálogo CPC
"""
from sqlalchemy.orm import Session
from sqlalchemy import and_, case, or_
from app.models.codcpc import CodCPC

class CodCPCRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, cpc_id: int):
        return self.db.query(CodCPC).get(cpc_id)

    def search(self, query: str, limit: int = 200):
        """
        Busca por código o descripción.
        Ideal para el autocompletado en el frontend.
        """
        normalized_query = (query or "").strip()
        if not normalized_query:
            return self.db.query(CodCPC).order_by(CodCPC.codCPC.asc()).limit(limit).all()

        terms = [term for term in normalized_query.split() if term]
        phrase_pattern = f"%{normalized_query}%"
        all_terms_filter = and_(*[
            or_(
                CodCPC.codCPC.ilike(f"%{term}%"),
                CodCPC.descripcion.ilike(f"%{term}%")
            )
            for term in terms
        ])
        search_filter = or_(
            CodCPC.codCPC.ilike(phrase_pattern),
            CodCPC.descripcion.ilike(phrase_pattern),
            all_terms_filter
        )
        relevance_order = case(
            (CodCPC.codCPC.ilike(f"{normalized_query}%"), 0),
            (CodCPC.descripcion.ilike(f"{normalized_query}%"), 1),
            (all_terms_filter, 2),
            else_=3,
        )
        return (
            self.db.query(CodCPC)
            .filter(search_filter)
            .order_by(relevance_order, CodCPC.codCPC.asc())
            .limit(limit)
            .all()
        )

    def get_by_code(self, code: str):
        return self.db.query(CodCPC).filter(CodCPC.codCPC == code).first()
