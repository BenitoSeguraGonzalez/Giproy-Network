from app.models.base_trabajo import BaseTrabajo
from app.models.subcategoria_item import SubcategoriaItem
from app.models.unidad import Unidad
from app.schemas.apu import APUCreate, APUUpdate
from app.services.apu import apu_service


def _seed_base_context(db, empresa_id: int):
    base = BaseTrabajo(
        codigo_unico="BASE-UNIT",
        nombre="Base Unidades",
        tipo="Base Maestra",
        empresa_id=empresa_id,
        activa=True,
    )
    db.add(base)
    db.flush()

    subcat = SubcategoriaItem(
        codigo="5-001",
        descripcion="APUs",
        subcategoria_codigo=5,
        base_trabajo_id=base.id,
        empresa_id=empresa_id,
        revisado=True,
        orden=1,
    )
    db.add(subcat)

    unidad = Unidad(
        descripcion="m2",
        descripcion_completa="metro cuadrado",
        subcategoria_codigo=5,
        es_global=False,
        base_trabajo_id=base.id,
        empresa_id=empresa_id,
    )
    db.add(unidad)
    db.commit()
    db.refresh(base)
    db.refresh(subcat)
    db.refresh(unidad)
    return base, subcat, unidad


def test_create_apu_requires_catalog_unit(db, sample_empresa):
    base, subcat, unidad = _seed_base_context(db, sample_empresa.id)

    apu = apu_service.create_apu(
        db,
        APUCreate(
            codigo="5-001-0001",
            descripcion="Replanteo",
            unidad="Metro cuadrado",
            subcategoria_item_id=subcat.id,
            base_trabajo_id=base.id,
            lineas=[],
        ),
        sample_empresa.id,
    )

    assert apu.unidad == unidad.descripcion


def test_create_apu_rejects_unknown_unit(db, sample_empresa):
    base, subcat, _ = _seed_base_context(db, sample_empresa.id)

    try:
        apu_service.create_apu(
            db,
            APUCreate(
                codigo="5-001-0001",
                descripcion="Replanteo",
                unidad="sem",
                subcategoria_item_id=subcat.id,
                base_trabajo_id=base.id,
                lineas=[],
            ),
            sample_empresa.id,
        )
        assert False, "Expected ValueError for unknown APU unit"
    except ValueError as exc:
        assert "no existe en el catálogo de unidades APU" in str(exc)


def test_update_apu_rejects_unknown_unit(db, sample_empresa):
    base, subcat, unidad = _seed_base_context(db, sample_empresa.id)

    apu = apu_service.create_apu(
        db,
        APUCreate(
            codigo="5-001-0001",
            descripcion="Replanteo",
            unidad=unidad.descripcion,
            subcategoria_item_id=subcat.id,
            base_trabajo_id=base.id,
            lineas=[],
        ),
        sample_empresa.id,
    )

    try:
        apu_service.update_apu(
            db,
            apu.id,
            APUUpdate(
                descripcion="Replanteo actualizado",
                unidad="sem",
                subcategoria_item_id=subcat.id,
                lineas=[],
            ),
            sample_empresa.id,
        )
        assert False, "Expected ValueError for unknown APU unit on update"
    except ValueError as exc:
        assert "no existe en el catálogo de unidades APU" in str(exc)
