from app.services.bim.ifc_parser import parse_ifc_text_to_bim_package


def _ifc_header(body: str) -> str:
    return f"""
ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('GiProy BIM local simulation'),'2;1');
ENDSEC;
DATA;
{body}
ENDSEC;
END-ISO-10303-21;
"""


def test_bim_ifc_simulation_s1_architectural_small_model():
    ifc_text = _ifc_header(
        """
#10=IFCBUILDINGSTOREY('S1-ST01',$,'Nivel 1',$,$,$,$,'Planta baja',.ELEMENT.,0.);
#20=IFCWALL('S1-W001',$,'Muro perimetral A',$,$,$,$,$);
#21=IFCDOOR('S1-D001',$,'Puerta acceso',$,$,$,$,$);
#22=IFCWINDOW('S1-WN001',$,'Ventana fachada',$,$,$,$,$);
"""
    )

    parsed = parse_ifc_text_to_bim_package(
        ifc_text=ifc_text,
        model_name="S1 Arquitectura",
        version_label="s1",
        source_filename="s1-arquitectura.ifc",
    )

    assert parsed.summary.storey_count == 1
    assert parsed.summary.element_count == 3
    assert parsed.summary.ifc_class_counts["IFCWALL"] == 1
    assert parsed.summary.ifc_class_counts["IFCDOOR"] == 1
    assert parsed.summary.ifc_class_counts["IFCWINDOW"] == 1


def test_bim_ifc_simulation_s2_multistorey_mixed_classes():
    storeys = "\n".join(
        f"#{10 + index}=IFCBUILDINGSTOREY('S2-ST{index}',$,'Nivel {index}',$,$,$,$,'Nivel {index}',.ELEMENT.,{index * 3}.);"
        for index in range(1, 4)
    )
    elements = "\n".join(
        [
            "#100=IFCCOLUMN('S2-C001',$,'Columna A1',$,$,$,$,$);",
            "#101=IFCBEAM('S2-B001',$,'Viga A1',$,$,$,$,$);",
            "#102=IFCSLAB('S2-S001',$,'Losa N1',$,$,$,$,$);",
            "#103=IFCSTAIR('S2-STAIR001',$,'Escalera principal',$,$,$,$,$);",
            "#104=IFCWALLSTANDARDCASE('S2-W001',$,'Muro N2',$,$,$,$,$);",
        ]
    )
    parsed = parse_ifc_text_to_bim_package(
        ifc_text=_ifc_header(f"{storeys}\n{elements}"),
        model_name="S2 Coordinacion",
        version_label="s2",
        source_filename="s2-coordinacion.ifc",
    )

    assert parsed.summary.storey_count == 3
    assert parsed.summary.element_count == 5
    assert {"IFCCOLUMN", "IFCBEAM", "IFCSLAB", "IFCSTAIR", "IFCWALLSTANDARDCASE"}.issubset(
        set(parsed.summary.ifc_class_counts)
    )


def test_bim_ifc_simulation_s3_medium_volume_keeps_stable_counts():
    storeys = "\n".join(
        f"#{10 + index}=IFCBUILDINGSTOREY('S3-ST{index}',$,'Nivel {index}',$,$,$,$,'Nivel {index}',.ELEMENT.,{index * 3}.);"
        for index in range(1, 6)
    )
    walls = "\n".join(
        f"#{1000 + index}=IFCWALL('S3-W{index:03d}',$,'Muro simulado {index}',$,$,$,$,$);"
        for index in range(1, 121)
    )
    doors = "\n".join(
        f"#{2000 + index}=IFCDOOR('S3-D{index:03d}',$,'Puerta simulada {index}',$,$,$,$,$);"
        for index in range(1, 31)
    )

    parsed = parse_ifc_text_to_bim_package(
        ifc_text=_ifc_header(f"{storeys}\n{walls}\n{doors}"),
        model_name="S3 Volumen medio",
        version_label="s3",
        source_filename="s3-volumen-medio.ifc",
    )

    assert parsed.summary.storey_count == 5
    assert parsed.summary.element_count == 150
    assert parsed.summary.entity_count == 155
    assert parsed.summary.ifc_class_counts["IFCWALL"] == 120
    assert parsed.summary.ifc_class_counts["IFCDOOR"] == 30
    assert len({element.global_id for element in parsed.payload.elements}) == 150


def test_bim_ifc_simulation_s4_spatial_relations_and_property_sets():
    ifc_text = _ifc_header(
        """
#10=IFCBUILDINGSTOREY('S4-ST01',$,'Nivel tecnico',$,$,$,$,'Nivel tecnico',.ELEMENT.,0.);
#20=IFCWALL('S4-W001',$,'Muro con propiedades',$,$,$,$,$);
#30=IFCPROPERTYSINGLEVALUE('FireRating',$,IFCLABEL('RF-120'),$);
#31=IFCPROPERTYSINGLEVALUE('GrossVolume',$,IFCREAL(12.5),$);
#32=IFCPROPERTYSINGLEVALUE('IsExternal',$,IFCBOOLEAN(.T.),$);
#40=IFCPROPERTYSET('S4-PSET01',$,'Pset_WallCommon',$,(#30,#31,#32));
#50=IFCRELDEFINESBYPROPERTIES('S4-REL-PSET',$,$,$,(#20),#40);
#60=IFCRELCONTAINEDINSPATIALSTRUCTURE('S4-REL-SPATIAL',$,$,$,(#20),#10);
"""
    )

    parsed = parse_ifc_text_to_bim_package(
        ifc_text=ifc_text,
        model_name="S4 Relaciones IFC",
        version_label="s4",
        source_filename="s4-relaciones.ifc",
    )

    assert parsed.summary.storey_count == 1
    assert parsed.summary.element_count == 1
    element = parsed.payload.elements[0]
    assert element.storey_name == "Nivel tecnico"
    assert element.properties["FireRating"] == "RF-120"
    assert element.properties["GrossVolume"] == 12.5
    assert element.properties["IsExternal"] is True
    assert element.metadata_json["ifc_property_count"] == 3


def test_bim_ifc_simulation_s5_quantities_materials_and_systems():
    ifc_text = _ifc_header(
        """
#10=IFCBUILDINGSTOREY('S5-ST01',$,'Nivel instalaciones',$,$,$,$,'Nivel instalaciones',.ELEMENT.,0.);
#20=IFCWALL('S5-W001',$,'Muro tecnico',$,$,$,$,$);
#30=IFCQUANTITYLENGTH('Length',$,$,7.25);
#31=IFCQUANTITYAREA('NetSideArea',$,$,21.75);
#32=IFCQUANTITYVOLUME('NetVolume',$,$,3.48);
#40=IFCELEMENTQUANTITY('S5-QTO01',$,'Qto_WallBaseQuantities',$,$,(#30,#31,#32));
#50=IFCRELDEFINESBYPROPERTIES('S5-REL-QTO',$,$,$,(#20),#40);
#60=IFCMATERIAL('Concreto reforzado',$,$);
#61=IFCRELASSOCIATESMATERIAL('S5-REL-MAT',$,$,$,(#20),#60);
#70=IFCSYSTEM('S5-SYS01',$,'Sistema estructural',$,$);
#71=IFCRELASSIGNSTOGROUP('S5-REL-SYS',$,$,$,(#20),$,#70);
#80=IFCRELCONTAINEDINSPATIALSTRUCTURE('S5-REL-SPATIAL',$,$,$,(#20),#10);
"""
    )

    parsed = parse_ifc_text_to_bim_package(
        ifc_text=ifc_text,
        model_name="S5 Cantidades materiales sistemas",
        version_label="s5",
        source_filename="s5-quantities-materials-systems.ifc",
    )

    assert parsed.summary.storey_count == 1
    assert parsed.summary.element_count == 1
    element = parsed.payload.elements[0]
    assert element.storey_name == "Nivel instalaciones"
    assert element.system_name == "Sistema estructural"
    assert element.properties["Quantity.Qto_WallBaseQuantities.Length"] == 7.25
    assert element.properties["Quantity.Qto_WallBaseQuantities.NetSideArea"] == 21.75
    assert element.properties["Quantity.Qto_WallBaseQuantities.NetVolume"] == 3.48
    assert element.metadata_json["ifc_quantity_count"] == 3
    assert element.metadata_json["ifc_materials"] == ["Concreto reforzado"]
    assert element.metadata_json["ifc_system_name"] == "Sistema estructural"
