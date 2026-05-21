from sqlalchemy.orm import Session

from app.models.bim_element import BimElement
from app.models.bim_model import BimModel
from app.models.bim_model_version import BimModelVersion
from app.models.bim_storey import BimStorey
from app.models.bim_view_state import BimViewState
from app.services.bim.model_registry import ensure_bim_domain_tables


STOREYS = [
    ("Nivel 01", "L01", "0.00", 0),
    ("Nivel 02", "L02", "3.60", 1),
    ("Cubierta", "ROOF", "7.20", 2),
]

ELEMENT_TEMPLATES = [
    ("IFCWALL", "Muro perimetral norte", "Nivel 01", "Arquitectura", "21-02 10 11"),
    ("IFCWALL", "Muro perimetral sur", "Nivel 01", "Arquitectura", "21-02 10 11"),
    ("IFCWINDOW", "Ventana fachada norte", "Nivel 01", "Arquitectura", "21-03 10 20"),
    ("IFCDOOR", "Puerta acceso principal", "Nivel 01", "Arquitectura", "21-03 20 10"),
    ("IFCSLAB", "Losa entrepiso", "Nivel 02", "Estructura", "21-04 10 00"),
    ("IFCBEAM", "Viga eje A-1", "Nivel 02", "Estructura", "21-04 20 10"),
    ("IFCCOLUMN", "Columna eje B-2", "Nivel 02", "Estructura", "21-04 30 10"),
    ("IFCROOF", "Cubierta inclinada", "Cubierta", "Arquitectura", "21-05 10 00"),
    ("IFCFLOWSEGMENT", "Tubería impulsión principal", "Nivel 02", "MEP", "23-11 13 13"),
]


def bootstrap_demo_bim_project(
    db: Session,
    *,
    project_id: int,
    company_id: int,
    user_id: int,
) -> dict:
    ensure_bim_domain_tables(db)

    model = (
        db.query(BimModel)
        .filter(BimModel.proyecto_id == project_id, BimModel.empresa_id == company_id, BimModel.nombre == "Modelo Demo BIM")
        .first()
    )
    if not model:
        model = BimModel(
            proyecto_id=project_id,
            empresa_id=company_id,
            nombre="Modelo Demo BIM",
            descripcion="Modelo BIM de demostración para bootstrap controlado del workspace paralelo.",
            disciplina="Multidisciplina",
            archivo_fuente="demo://bootstrap/modelo-demo.ifc",
            activo=True,
        )
        db.add(model)
        db.flush()

    version = (
        db.query(BimModelVersion)
        .filter(BimModelVersion.bim_model_id == model.id, BimModelVersion.version_label == "v1-demo")
        .first()
    )
    if not version:
        db.query(BimModelVersion).filter(BimModelVersion.bim_model_id == model.id).update({"is_active": False})
        version = BimModelVersion(
            bim_model_id=model.id,
            version_label="v1-demo",
            source_filename="modelo-demo.ifc",
            artifact_path="demo://bootstrap/modelo-demo.ifc",
            status="published",
            is_active=True,
            notes="Versión demo creada para poblar el workspace BIM durante la incubación.",
        )
        db.add(version)
        db.flush()

    existing_storeys = db.query(BimStorey).filter(BimStorey.bim_model_version_id == version.id).count()
    if existing_storeys == 0:
        for nombre, codigo, elevation, orden in STOREYS:
            db.add(
                BimStorey(
                    bim_model_version_id=version.id,
                    nombre=nombre,
                    codigo=codigo,
                    elevation=elevation,
                    orden=orden,
                )
            )

    existing_elements = db.query(BimElement).filter(BimElement.bim_model_version_id == version.id).count()
    if existing_elements == 0:
        for index, (ifc_class, nombre, storey_name, system_name, classification) in enumerate(ELEMENT_TEMPLATES, start=1):
            db.add(
                BimElement(
                    bim_model_version_id=version.id,
                    global_id=f"DEMO-{project_id}-{index:03d}",
                    ifc_class=ifc_class,
                    nombre=nombre,
                    storey_name=storey_name,
                    system_name=system_name,
                    classification=classification,
                    descripcion=f"Elemento demo {index} del bootstrap BIM paralelo.",
                    properties={
                        "Nombre": nombre,
                        "Clase IFC": ifc_class,
                        "Nivel": storey_name,
                        "Sistema": system_name,
                    },
                    metadata_json={
                        "source": "demo_bootstrap",
                        "project_id": project_id,
                        "index": index,
                    },
                )
            )

    db.flush()

    version.element_count = db.query(BimElement).filter(BimElement.bim_model_version_id == version.id).count()
    version.storey_count = db.query(BimStorey).filter(BimStorey.bim_model_version_id == version.id).count()

    existing_view = (
        db.query(BimViewState)
        .filter(
            BimViewState.proyecto_id == project_id,
            BimViewState.empresa_id == company_id,
            BimViewState.usuario_id == user_id,
            BimViewState.nombre == "Vista demo inicial",
        )
        .first()
    )
    if not existing_view:
        db.add(
            BimViewState(
                proyecto_id=project_id,
                empresa_id=company_id,
                usuario_id=user_id,
                bim_model_version_id=version.id,
                nombre="Vista demo inicial",
                scope="personal",
                payload={
                    "camera": {"x": 18, "y": 11, "z": 22},
                    "selection": [],
                    "storey": "Nivel 01",
                    "theme": "giproy-demo",
                },
            )
        )

    db.commit()
    db.refresh(model)
    db.refresh(version)

    return {
        "model_id": model.id,
        "version_id": version.id,
        "created_elements": version.element_count or 0,
        "created_storeys": version.storey_count or 0,
    }
