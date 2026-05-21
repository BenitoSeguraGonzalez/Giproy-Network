from decimal import Decimal

from app.models.apu import APU, APULinea
from app.models.base_trabajo import BaseTrabajo
from app.models.codcpc import CodCPC
from app.schemas.recurso import RecursoUpdate
from app.services.recurso import recurso_service
from app.models.edt import EdtNode, TipoNodoEdt
from app.models.presupuesto import Presupuesto, PresupuestoDetalle
from app.models.proyecto import Proyecto
from app.models.proyecto_apu_cpc import ProyectoApuCpc
from app.models.recurso import Recurso
from app.models.subcategoria_item import SubcategoriaItem
from app.models.unidad import Unidad
from app.schemas.apu import APUResponse
from app.schemas.apu import APUUpdate, APULineaCreate
from app.services.apu import apu_service


def _create_basic_base_unit_subcat(db, sample_empresa, suffix):
    base = BaseTrabajo(
        codigo_unico=f"BASE-{suffix}",
        nombre=f"Base {suffix}",
        empresa_id=sample_empresa.id,
        activa=True,
    )
    unidad = Unidad(
        descripcion="u",
        descripcion_completa="Unidad",
        subcategoria_codigo=2,
        base_trabajo_id=None,
        empresa_id=sample_empresa.id,
        es_global=False,
    )
    db.add_all([base, unidad])
    db.commit()
    db.refresh(base)
    unidad.base_trabajo_id = base.id
    db.add(unidad)
    subcat = SubcategoriaItem(
        codigo=f"2-{suffix[-3:]}",
        descripcion=f"MATERIALES {suffix}",
        subcategoria_codigo=2,
        base_trabajo_id=base.id,
        empresa_id=sample_empresa.id,
        revisado=True,
    )
    db.add(subcat)
    db.commit()
    db.refresh(unidad)
    db.refresh(subcat)
    return base, unidad, subcat


def test_project_apu_cpc_persists_by_project_root_not_revision(db, sample_empresa):
    base, _, _ = _create_basic_base_unit_subcat(db, sample_empresa, "APU-CPC-ROOT")
    apu = APU(
        codigo="5-ROOT-0001",
        descripcion="APU CPC RAIZ",
        descripcion_normalizada="apu cpc raiz",
        unidad="u",
        costo_directo=Decimal("1.0000"),
        precio_unitario_total=Decimal("1.0000"),
        empresa_id=sample_empresa.id,
        base_trabajo_id=base.id,
    )
    cpc = CodCPC(codCPC="999000001", descripcion="CPC APU proyecto", tipo="Servicio", porcentaje=50.0)
    proyecto_r0 = Proyecto(nombre="Proyecto CPC", codigo="PCPC-R0", codigo_root="PCPC", revision=0, empresa_id=sample_empresa.id, base_trabajo_id=base.id)
    proyecto_r1 = Proyecto(nombre="Proyecto CPC R1", codigo="PCPC-R1", codigo_root="PCPC", revision=1, empresa_id=sample_empresa.id, base_trabajo_id=base.id)
    db.add_all([apu, cpc, proyecto_r0, proyecto_r1])
    db.commit()
    db.refresh(apu)
    db.refresh(cpc)

    assignment = ProyectoApuCpc(
        empresa_id=sample_empresa.id,
        proyecto_root_codigo=proyecto_r0.codigo_root,
        apu_id=apu.id,
        cod_cpc_id=cpc.id,
    )
    db.add(assignment)
    db.commit()

    root_assignments = db.query(ProyectoApuCpc).filter(
        ProyectoApuCpc.empresa_id == sample_empresa.id,
        ProyectoApuCpc.proyecto_root_codigo == proyecto_r1.codigo_root,
        ProyectoApuCpc.apu_id == apu.id,
    ).all()

    assert len(root_assignments) == 1
    assert root_assignments[0].cod_cpc_id == cpc.id
    assert not hasattr(apu, "cod_cpc_id")


def test_nested_apu_vae_uses_child_vae_without_resource_cpc_requirement(db, sample_empresa):
    base, unidad, subcat = _create_basic_base_unit_subcat(db, sample_empresa, "APU-NESTED-VAE")
    cpc = CodCPC(codCPC="999000002", descripcion="CPC recurso nacional", tipo="Bien", porcentaje=60.0)
    recurso = Recurso(
        codigo="2-9999-00001",
        descripcion="RECURSO NACIONAL",
        descripcion_normalizada="recurso nacional",
        precio=Decimal("100.0000"),
        unidad_id=unidad.id,
        cod_cpc_id=None,
        subcategoria_item_id=subcat.id,
        empresa_id=sample_empresa.id,
        base_trabajo_id=base.id,
        revision=0,
    )
    db.add_all([cpc, recurso])
    db.commit()
    recurso.cod_cpc_id = cpc.id

    child = APU(
        codigo="5-NEST-0001",
        descripcion="APU HIJO VAE",
        descripcion_normalizada="apu hijo vae",
        unidad="u",
        costo_directo=Decimal("100.0000"),
        precio_unitario_total=Decimal("100.0000"),
        empresa_id=sample_empresa.id,
        base_trabajo_id=base.id,
    )
    parent = APU(
        codigo="5-NEST-0002",
        descripcion="APU PADRE VAE",
        descripcion_normalizada="apu padre vae",
        unidad="u",
        costo_directo=Decimal("100.0000"),
        precio_unitario_total=Decimal("100.0000"),
        empresa_id=sample_empresa.id,
        base_trabajo_id=base.id,
    )
    db.add_all([child, parent])
    db.commit()
    db.add(APULinea(
        apu_id=child.id,
        recurso_id=recurso.id,
        cantidad=Decimal("1.000000"),
        rendimiento=Decimal("1.000000"),
        orden=0,
        precio_congelado=Decimal("100.0000"),
        subtotal=Decimal("100.0000"),
    ))
    db.add(APULinea(
        apu_id=parent.id,
        apu_hijo_id=child.id,
        cantidad=Decimal("1.000000"),
        rendimiento=Decimal("1.000000"),
        orden=0,
        precio_congelado=Decimal("100.0000"),
        subtotal=Decimal("100.0000"),
    ))
    db.commit()
    db.expire_all()

    loaded_parent = apu_service.get_apu(db, parent.id, sample_empresa.id)
    response = APUResponse.model_validate(loaded_parent)
    nested_line = response.lineas[0]

    assert nested_line.apu_hijo is not None
    assert nested_line.recurso is None
    assert nested_line.apu_hijo.vae_total == Decimal("0.6")


def test_apu_response_exposes_resource_cpc_for_vae_desagregacion(db, sample_empresa):
    base = BaseTrabajo(
        codigo_unico="BASE-APU-CPC-TEST",
        nombre="Base APU CPC Test",
        empresa_id=sample_empresa.id,
        activa=True,
    )
    db.add(base)
    db.commit()
    db.refresh(base)

    unidad = Unidad(
        descripcion="kg",
        descripcion_completa="Kilogramo",
        subcategoria_codigo=2,
        base_trabajo_id=base.id,
        empresa_id=sample_empresa.id,
        es_global=False,
    )
    cpc = CodCPC(
        codCPC="123456",
        descripcion="Material nacional de prueba",
        tipo="Bien",
        porcentaje=70.0,
    )
    db.add_all([unidad, cpc])
    db.commit()
    db.refresh(unidad)
    db.refresh(cpc)

    subcat = SubcategoriaItem(
        codigo="2-001",
        descripcion="MATERIALES CPC TEST",
        subcategoria_codigo=2,
        base_trabajo_id=base.id,
        empresa_id=sample_empresa.id,
        revisado=True,
    )
    db.add(subcat)
    db.commit()
    db.refresh(subcat)

    recurso = Recurso(
        codigo="2-0001-00001",
        descripcion="CEMENTO CPC",
        descripcion_normalizada="cemento cpc",
        precio=Decimal("10.0000"),
        unidad_id=unidad.id,
        cod_cpc_id=cpc.id,
        subcategoria_item_id=subcat.id,
        empresa_id=sample_empresa.id,
        base_trabajo_id=base.id,
        revision=0,
    )
    apu = APU(
        codigo="5-001-0001",
        descripcion="APU CON CPC",
        descripcion_normalizada="apu con cpc",
        unidad="M2",
        costo_directo=Decimal("10.0000"),
        costo_indirecto=Decimal("0.0000"),
        precio_unitario_total=Decimal("10.0000"),
        empresa_id=sample_empresa.id,
        base_trabajo_id=base.id,
    )
    db.add_all([recurso, apu])
    db.commit()
    db.refresh(recurso)
    db.refresh(apu)

    line = APULinea(
        apu_id=apu.id,
        recurso_id=recurso.id,
        cantidad=Decimal("1.000000"),
        rendimiento=Decimal("1.000000"),
        orden=0,
        precio_congelado=Decimal("10.0000"),
        subtotal=Decimal("10.0000"),
    )
    db.add(line)
    db.commit()
    db.expire_all()

    batch = apu_service.get_apus_by_ids(db, [apu.id], sample_empresa.id)
    response = APUResponse.model_validate(batch[0])

    assert response.lineas[0].recurso is not None
    assert response.lineas[0].recurso.cod_cpc_id == cpc.id
    assert response.lineas[0].recurso.cpc is not None
    assert response.lineas[0].recurso.cpc.codCPC == "123456"
    assert response.lineas[0].recurso.cpc.porcentaje == 70.0


def test_recurso_update_does_not_clear_cpc_from_incomplete_payload_without_explicit_flag(db, sample_empresa):
    unidad = Unidad(
        descripcion="u",
        descripcion_completa="Unidad",
        subcategoria_codigo=2,
        es_global=True,
    )
    cpc = CodCPC(
        codCPC="654321",
        descripcion="CPC protegido",
        porcentaje=70.0,
    )
    db.add_all([unidad, cpc])
    db.flush()

    recurso = Recurso(
        codigo="2-0001-00001",
        descripcion="Recurso con cpc",
        descripcion_normalizada="recurso con cpc",
        precio=1,
        unidad_id=unidad.id,
        cod_cpc_id=cpc.id,
        subcategoria_item_id=1,
        base_trabajo_id=1,
        empresa_id=sample_empresa.id,
        revisado=True,
    )
    db.add(recurso)
    db.commit()
    db.refresh(recurso)

    recurso_service.update_recurso(
        db,
        recurso.id,
        RecursoUpdate(descripcion="Recurso con cpc", precio=1, unidad_id=unidad.id, cod_cpc_id=None),
    )
    db.refresh(recurso)
    assert recurso.cod_cpc_id == cpc.id

    recurso_service.update_recurso(
        db,
        recurso.id,
        RecursoUpdate(cod_cpc_id=None, clear_cod_cpc=True),
    )
    db.refresh(recurso)
    assert recurso.cod_cpc_id is None


def test_bulk_assign_cpc_updates_multiple_company_resources(db, sample_empresa):
    unidad = Unidad(
        descripcion="u",
        descripcion_completa="Unidad",
        subcategoria_codigo=2,
        es_global=True,
    )
    cpc = CodCPC(
        codCPC="987654",
        descripcion="CPC masivo",
        porcentaje=70.0,
    )
    db.add_all([unidad, cpc])
    db.flush()

    recursos = []
    for index in range(2):
        recurso = Recurso(
            codigo=f"2-0001-0000{index + 1}",
            descripcion=f"Recurso masivo {index + 1}",
            descripcion_normalizada=f"recurso masivo {index + 1}",
            precio=1,
            unidad_id=unidad.id,
            cod_cpc_id=None,
            subcategoria_item_id=1,
            base_trabajo_id=1,
            empresa_id=sample_empresa.id,
            revisado=True,
        )
        db.add(recurso)
        recursos.append(recurso)
    db.commit()

    updated_ids = recurso_service.bulk_assign_cpc(
        db,
        [recurso.id for recurso in recursos],
        cpc.id,
        sample_empresa.id,
    )

    assert set(updated_ids) == {recurso.id for recurso in recursos}
    for recurso in recursos:
        db.refresh(recurso)
        assert recurso.cod_cpc_id == cpc.id


def test_nested_apu_response_exposes_direct_cost_for_editor_consumers(db, sample_empresa):
    base = BaseTrabajo(
        codigo_unico="BASE-NESTED-TEST",
        nombre="Base Nested Test",
        empresa_id=sample_empresa.id,
        activa=True,
    )
    db.add(base)
    db.commit()
    db.refresh(base)

    child = APU(
        codigo="5-009-0005",
        descripcion="ENCOFRADO DE MADERA PARA LOSAS (2 USOS)",
        descripcion_normalizada="encofrado de madera para losas 2 usos",
        unidad="M2",
        costo_directo=Decimal("18.5700"),
        costo_indirecto=Decimal("3.8997"),
        precio_unitario_total=Decimal("22.4697"),
        empresa_id=sample_empresa.id,
        base_trabajo_id=base.id,
    )
    db.add(child)
    db.commit()
    db.refresh(child)

    parent = APU(
        codigo="5-007-0001",
        descripcion="PARTIDA PADRE",
        descripcion_normalizada="partida padre",
        unidad="M2",
        costo_directo=Decimal("9.2900"),
        costo_indirecto=Decimal("0.0000"),
        precio_unitario_total=Decimal("9.2900"),
        empresa_id=sample_empresa.id,
        base_trabajo_id=base.id,
    )
    db.add(parent)
    db.commit()
    db.refresh(parent)

    line = APULinea(
        apu_id=parent.id,
        apu_hijo_id=child.id,
        cantidad=Decimal("0.500000"),
        rendimiento=Decimal("1.000000"),
        orden=0,
        precio_congelado=Decimal("18.5700"),
        subtotal=Decimal("9.2900"),
    )
    db.add(line)
    db.commit()
    db.refresh(parent)

    response = APUResponse.model_validate(parent)

    assert response.lineas[0].apu_hijo is not None
    assert response.lineas[0].apu_hijo.costo_directo == Decimal("18.5700")
    assert response.lineas[0].apu_hijo.precio_unitario_total == Decimal("22.4697")


def test_updating_nested_apu_propagates_to_parent_apus_and_associated_budget(db, sample_empresa):
    base = BaseTrabajo(
        codigo_unico="BASE-NESTED-PROP",
        nombre="Base Nested Prop",
        empresa_id=sample_empresa.id,
        activa=True,
        porcentaje_indirectos=Decimal("0.00"),
    )
    db.add(base)
    db.commit()
    db.refresh(base)

    unidad = Unidad(
        descripcion="kg",
        descripcion_completa="Kilogramo",
        subcategoria_codigo=2,
        base_trabajo_id=base.id,
        empresa_id=sample_empresa.id,
        es_global=False,
    )
    unidad_apu = Unidad(
        descripcion="M2",
        descripcion_completa="Metro cuadrado",
        subcategoria_codigo=5,
        base_trabajo_id=base.id,
        empresa_id=sample_empresa.id,
        es_global=False,
    )
    db.add_all([unidad, unidad_apu])
    db.commit()
    db.refresh(unidad)
    db.refresh(unidad_apu)

    subcat_materiales = SubcategoriaItem(
        codigo="2-001",
        descripcion="MATERIALES TEST",
        subcategoria_codigo=2,
        base_trabajo_id=base.id,
        empresa_id=sample_empresa.id,
        revisado=True,
    )
    db.add(subcat_materiales)
    db.commit()
    db.refresh(subcat_materiales)

    recurso = Recurso(
        codigo="2-0001-00001",
        descripcion="ARENA",
        descripcion_normalizada="arena",
        precio=Decimal("10.0000"),
        unidad_id=unidad.id,
        subcategoria_item_id=subcat_materiales.id,
        empresa_id=sample_empresa.id,
        base_trabajo_id=base.id,
        revision=0,
    )
    db.add(recurso)
    db.commit()
    db.refresh(recurso)

    child = APU(
        codigo="5-001-0001",
        descripcion="APU HIJO",
        descripcion_normalizada="apu hijo",
        unidad="M2",
        costo_directo=Decimal("10.0000"),
        costo_indirecto=Decimal("0.0000"),
        precio_unitario_total=Decimal("10.0000"),
        empresa_id=sample_empresa.id,
        base_trabajo_id=base.id,
    )
    db.add(child)
    db.commit()
    db.refresh(child)

    db.add(
        APULinea(
            apu_id=child.id,
            recurso_id=recurso.id,
            cantidad=Decimal("1.000000"),
            rendimiento=Decimal("1.000000"),
            orden=0,
            precio_congelado=Decimal("10.0000"),
            subtotal=Decimal("10.0000"),
        )
    )
    db.commit()

    parent = APU(
        codigo="5-001-0002",
        descripcion="APU PADRE",
        descripcion_normalizada="apu padre",
        unidad="M2",
        costo_directo=Decimal("10.0000"),
        costo_indirecto=Decimal("0.0000"),
        precio_unitario_total=Decimal("10.0000"),
        empresa_id=sample_empresa.id,
        base_trabajo_id=base.id,
    )
    db.add(parent)
    db.commit()
    db.refresh(parent)

    db.add(
        APULinea(
            apu_id=parent.id,
            apu_hijo_id=child.id,
            cantidad=Decimal("1.000000"),
            rendimiento=Decimal("1.000000"),
            orden=0,
            precio_congelado=Decimal("10.0000"),
            subtotal=Decimal("10.0000"),
        )
    )
    db.commit()

    grandparent = APU(
        codigo="5-001-0003",
        descripcion="APU ABUELO",
        descripcion_normalizada="apu abuelo",
        unidad="M2",
        costo_directo=Decimal("10.0000"),
        costo_indirecto=Decimal("0.0000"),
        precio_unitario_total=Decimal("10.0000"),
        empresa_id=sample_empresa.id,
        base_trabajo_id=base.id,
    )
    db.add(grandparent)
    db.commit()
    db.refresh(grandparent)

    db.add(
        APULinea(
            apu_id=grandparent.id,
            apu_hijo_id=parent.id,
            cantidad=Decimal("1.000000"),
            rendimiento=Decimal("1.000000"),
            orden=0,
            precio_congelado=Decimal("10.0000"),
            subtotal=Decimal("10.0000"),
        )
    )
    db.commit()

    proyecto = Proyecto(
        nombre="Proyecto Nested Cascade",
        codigo="TEST-NESTED",
        codigo_root="TEST-NESTED",
        revision=0,
        empresa_id=sample_empresa.id,
        base_trabajo_id=base.id,
    )
    db.add(proyecto)
    db.commit()
    db.refresh(proyecto)

    edt = EdtNode(
        proyecto_id=proyecto.id,
        parent_id=None,
        tipo_nodo=TipoNodoEdt.CUENTA_PAQUETE,
        orden=0,
        codigo="1",
        nombre="Capítulo 1",
        empresa_id=sample_empresa.id,
    )
    db.add(edt)
    db.commit()
    db.refresh(edt)

    presupuesto = Presupuesto(
        descripcion="Presupuesto Nested",
        proyecto_id=proyecto.id,
        empresa_id=sample_empresa.id,
        revision=0,
        estado="En Elaboración",
        moneda="USD",
        iva_aplicado=Decimal("0.00"),
        dec_moneda=2,
        dec_calculos=4,
    )
    db.add(presupuesto)
    db.commit()
    db.refresh(presupuesto)

    linea_presupuesto = PresupuestoDetalle(
        presupuesto_id=presupuesto.id,
        apu_id=grandparent.id,
        edt_id=edt.id,
        tipo=None,
        codigo_item="1.1",
        descripcion=grandparent.descripcion,
        unidad=grandparent.unidad,
        cantidad=Decimal("2.000000"),
        precio_unitario=Decimal("10.000000"),
        precio_total=Decimal("20.000000"),
        orden=0,
    )
    db.add(linea_presupuesto)
    db.commit()

    update_payload = APUUpdate(
        descripcion=child.descripcion,
        unidad=child.unidad,
        estado_revision="Revisado",
        lineas=[
            APULineaCreate(
                recurso_id=recurso.id,
                cantidad=Decimal("2.000000"),
                rendimiento=Decimal("1.000000"),
                orden=0,
            )
        ],
    )

    apu_service.update_apu(db, child.id, update_payload, sample_empresa.id)

    db.refresh(child)
    db.refresh(parent)
    db.refresh(grandparent)
    db.refresh(linea_presupuesto)
    db.refresh(presupuesto)

    assert child.costo_directo == Decimal("20.0000")
    assert parent.costo_directo == Decimal("20.0000")
    assert grandparent.costo_directo == Decimal("20.0000")
    assert linea_presupuesto.precio_unitario == Decimal("20.000000")
    assert linea_presupuesto.precio_total == Decimal("40.000000")
    assert presupuesto.subtotal == Decimal("40.000000")

    impact_summary = apu_service.get_apu_impact_summary(db, child.id, sample_empresa.id)
    assert impact_summary["parent_apus_count"] == 2
    assert impact_summary["affected_apus_count"] == 3
    assert impact_summary["affected_presupuestos_count"] == 1


def test_nested_apu_impact_summary_counts_only_propagable_budget_states(db, sample_empresa):
    base = BaseTrabajo(
        codigo_unico="BASE-NESTED-IMPACT",
        nombre="Base Nested Impact",
        empresa_id=sample_empresa.id,
        activa=True,
        porcentaje_indirectos=Decimal("0.00"),
    )
    db.add(base)
    db.commit()
    db.refresh(base)

    child = APU(
        codigo="5-002-0001",
        descripcion="APU HIJO IMPACTO",
        descripcion_normalizada="apu hijo impacto",
        unidad="M2",
        costo_directo=Decimal("12.5000"),
        costo_indirecto=Decimal("0.0000"),
        precio_unitario_total=Decimal("12.5000"),
        empresa_id=sample_empresa.id,
        base_trabajo_id=base.id,
    )
    db.add(child)
    db.commit()
    db.refresh(child)

    parent = APU(
        codigo="5-002-0002",
        descripcion="APU PADRE IMPACTO",
        descripcion_normalizada="apu padre impacto",
        unidad="M2",
        costo_directo=Decimal("12.5000"),
        costo_indirecto=Decimal("0.0000"),
        precio_unitario_total=Decimal("12.5000"),
        empresa_id=sample_empresa.id,
        base_trabajo_id=base.id,
    )
    db.add(parent)
    db.commit()
    db.refresh(parent)

    db.add(
        APULinea(
            apu_id=parent.id,
            apu_hijo_id=child.id,
            cantidad=Decimal("1.000000"),
            rendimiento=Decimal("1.000000"),
            orden=0,
            precio_congelado=Decimal("12.5000"),
            subtotal=Decimal("12.5000"),
        )
    )
    db.commit()

    proyecto = Proyecto(
        nombre="Proyecto Nested Impact",
        codigo="TEST-IMPACT",
        codigo_root="TEST-IMPACT",
        revision=0,
        empresa_id=sample_empresa.id,
        base_trabajo_id=base.id,
    )
    db.add(proyecto)
    db.commit()
    db.refresh(proyecto)

    edt = EdtNode(
        proyecto_id=proyecto.id,
        parent_id=None,
        tipo_nodo=TipoNodoEdt.CUENTA_PAQUETE,
        orden=0,
        codigo="1",
        nombre="Capítulo Impacto",
        empresa_id=sample_empresa.id,
    )
    db.add(edt)
    db.commit()
    db.refresh(edt)

    presupuesto_elaboracion = Presupuesto(
        descripcion="Presupuesto Elaboracion",
        proyecto_id=proyecto.id,
        empresa_id=sample_empresa.id,
        revision=0,
        estado="En Elaboración",
        moneda="USD",
        iva_aplicado=Decimal("0.00"),
        dec_moneda=2,
        dec_calculos=4,
    )
    presupuesto_aprobado = Presupuesto(
        descripcion="Presupuesto Aprobado",
        proyecto_id=proyecto.id,
        empresa_id=sample_empresa.id,
        revision=0,
        estado="Aprobado",
        moneda="USD",
        iva_aplicado=Decimal("0.00"),
        dec_moneda=2,
        dec_calculos=4,
    )
    db.add_all([presupuesto_elaboracion, presupuesto_aprobado])
    db.commit()
    db.refresh(presupuesto_elaboracion)
    db.refresh(presupuesto_aprobado)

    db.add_all([
        PresupuestoDetalle(
            presupuesto_id=presupuesto_elaboracion.id,
            apu_id=parent.id,
            edt_id=edt.id,
            tipo=None,
            codigo_item="1.1",
            descripcion=parent.descripcion,
            unidad=parent.unidad,
            cantidad=Decimal("1.000000"),
            precio_unitario=Decimal("12.500000"),
            precio_total=Decimal("12.500000"),
            orden=0,
        ),
        PresupuestoDetalle(
            presupuesto_id=presupuesto_aprobado.id,
            apu_id=parent.id,
            edt_id=edt.id,
            tipo=None,
            codigo_item="1.2",
            descripcion=parent.descripcion,
            unidad=parent.unidad,
            cantidad=Decimal("1.000000"),
            precio_unitario=Decimal("12.500000"),
            precio_total=Decimal("12.500000"),
            orden=0,
        ),
    ])
    db.commit()

    impact_summary = apu_service.get_apu_impact_summary(db, child.id, sample_empresa.id)

    assert impact_summary["parent_apus_count"] == 1
    assert impact_summary["affected_apus_count"] == 2
    assert impact_summary["affected_presupuestos_count"] == 1
