from app.core.database import SessionLocal
from app.core.text_formatting import (
    normalize_lowercase_label,
    normalize_sentence_case,
    normalize_uppercase_label,
)
from app.core.utils import normalize_string
from app.models.apu import APU
from app.models.recurso import Recurso
from app.models.subcategoria_item import SubcategoriaItem
from app.models.unidad import Unidad


def main():
    with SessionLocal() as db:
        apus = db.query(APU).all()
        recursos = db.query(Recurso).all()
        subcategorias = db.query(SubcategoriaItem).all()
        unidades = db.query(Unidad).all()

        counts = {
            "apus": 0,
            "recursos": 0,
            "subcategorias": 0,
            "unidades_sigla": 0,
            "unidades_completa": 0,
        }

        for apu in apus:
            next_desc = normalize_sentence_case(apu.descripcion)
            next_norm = normalize_string(next_desc)
            if apu.descripcion != next_desc or apu.descripcion_normalizada != next_norm:
                apu.descripcion = next_desc
                apu.descripcion_normalizada = next_norm
                counts["apus"] += 1

        for recurso in recursos:
            next_desc = normalize_sentence_case(recurso.descripcion)
            next_norm = normalize_string(next_desc)
            if recurso.descripcion != next_desc or recurso.descripcion_normalizada != next_norm:
                recurso.descripcion = next_desc
                recurso.descripcion_normalizada = next_norm
                counts["recursos"] += 1

        for item in subcategorias:
            next_desc = normalize_uppercase_label(item.descripcion)
            if item.descripcion != next_desc:
                item.descripcion = next_desc
                counts["subcategorias"] += 1

        for unidad in unidades:
            next_sigla = normalize_lowercase_label(unidad.descripcion)
            next_full = normalize_lowercase_label(unidad.descripcion_completa) if unidad.descripcion_completa else unidad.descripcion_completa
            if unidad.descripcion != next_sigla:
                unidad.descripcion = next_sigla
                counts["unidades_sigla"] += 1
            if unidad.descripcion_completa != next_full:
                unidad.descripcion_completa = next_full
                counts["unidades_completa"] += 1

        db.commit()

    print(counts)


if __name__ == "__main__":
    main()
