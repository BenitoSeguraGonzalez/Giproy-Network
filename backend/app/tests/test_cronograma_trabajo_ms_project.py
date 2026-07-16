from decimal import Decimal
from datetime import datetime, timezone
import xml.etree.ElementTree as ET
from io import BytesIO
import os
from pathlib import Path
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from app.api.deps import get_current_active_user
from app.core.database import get_db
from app.main import app
from app.models.apu import APU
from app.models.base_trabajo import BaseTrabajo
from app.models.edt import EdtNode, TipoNodoEdt
from app.models.empresa import Empresa
from app.models.presupuesto import Presupuesto, PresupuestoDetalle
from app.models.proyecto import Proyecto
from app.models.usuario import Usuario
from app.schemas.cronograma_trabajo import (
    CronogramaTrabajoDependency,
    CronogramaTrabajoLinea,
    CronogramaTrabajoUpdate,
)
from app.services.cronograma_trabajo import cronograma_trabajo_service


def _build_work_schedule_fixture(db, sample_empresa):
    base = BaseTrabajo(
        codigo_unico="BASE-GANTT-QA",
        nombre="Base Gantt QA",
        empresa_id=sample_empresa.id,
        activa=True,
    )
    db.add(base)
    db.commit()
    db.refresh(base)

    proyecto = Proyecto(
        nombre="Proyecto Gantt QA",
        codigo="GANTT-QA",
        codigo_root="GANTT-QA",
        revision=1,
        fecha_inicio=datetime(2026, 4, 1, 8, 0, tzinfo=timezone.utc),
        empresa_id=sample_empresa.id,
        base_trabajo_id=base.id,
    )
    db.add(proyecto)
    db.commit()
    db.refresh(proyecto)

    edt = EdtNode(
        proyecto_id=proyecto.id,
        tipo_nodo=TipoNodoEdt.CUENTA_PAQUETE,
        orden=0,
        codigo="1",
        nombre="Capitulo Gantt QA",
        empresa_id=sample_empresa.id,
    )
    db.add(edt)
    db.commit()
    db.refresh(edt)

    apu_1 = APU(
        codigo="5-001-0001",
        descripcion="Predecesora QA",
        descripcion_normalizada="predecesora qa",
        unidad="u",
        costo_directo=Decimal("1.0000"),
        precio_unitario_total=Decimal("1.0000"),
        empresa_id=sample_empresa.id,
        base_trabajo_id=base.id,
    )
    apu_2 = APU(
        codigo="5-001-0002",
        descripcion="Sucesora QA",
        descripcion_normalizada="sucesora qa",
        unidad="u",
        costo_directo=Decimal("1.0000"),
        precio_unitario_total=Decimal("1.0000"),
        empresa_id=sample_empresa.id,
        base_trabajo_id=base.id,
    )
    db.add_all([apu_1, apu_2])
    db.commit()
    db.refresh(apu_1)
    db.refresh(apu_2)

    presupuesto = Presupuesto(
        codigo="PRES-GANTT-QA",
        revision=1,
        descripcion="Presupuesto Gantt QA",
        subtotal=Decimal("2.0000"),
        total=Decimal("2.0000"),
        proyecto_id=proyecto.id,
        empresa_id=sample_empresa.id,
    )
    db.add(presupuesto)
    db.commit()
    db.refresh(presupuesto)

    line_1 = PresupuestoDetalle(
        presupuesto_id=presupuesto.id,
        apu_id=apu_1.id,
        edt_id=edt.id,
        codigo_item="1.1",
        descripcion=apu_1.descripcion,
        unidad="u",
        cantidad=Decimal("1.000000"),
        precio_unitario=Decimal("1.0000"),
        precio_total=Decimal("1.0000"),
        orden=1,
    )
    line_2 = PresupuestoDetalle(
        presupuesto_id=presupuesto.id,
        apu_id=apu_2.id,
        edt_id=edt.id,
        codigo_item="1.2",
        descripcion=apu_2.descripcion,
        unidad="u",
        cantidad=Decimal("1.000000"),
        precio_unitario=Decimal("1.0000"),
        precio_total=Decimal("1.0000"),
        orden=2,
    )
    db.add_all([line_1, line_2])
    db.commit()
    db.refresh(line_1)
    db.refresh(line_2)
    db.refresh(presupuesto)
    return proyecto, presupuesto, line_1, line_2


def test_ms_project_duration_and_lag_parsing_uses_workday_hours():
    config = cronograma_trabajo_service._resolve_config({"jornada_laboral_horas": 8})

    assert cronograma_trabajo_service._parse_ms_project_duration_hours("PT12H30M0S") == 12.5
    assert cronograma_trabajo_service._parse_ms_project_duration_hours("P1DT4H0M0S") == 28.0
    assert cronograma_trabajo_service._parse_ms_project_dependency_type("0") == "FF"
    assert cronograma_trabajo_service._parse_ms_project_dependency_type("2") == "SS"
    assert cronograma_trabajo_service._parse_ms_project_lag_days("4800", config) == 1.0
    assert cronograma_trabajo_service._parse_ms_project_lag_days("-2400", config) == -0.5


def test_ms_project_runtime_duration_falls_back_to_start_finish_delta():
    task = {
        "duration_hours": 0.0,
        "start": "ignored",
        "finish": "ignored",
    }
    start = __import__("datetime").datetime(2026, 4, 10, 8, 0, 0)
    finish = __import__("datetime").datetime(2026, 4, 10, 16, 0, 0)
    task["start"] = start
    task["finish"] = finish

    assert cronograma_trabajo_service._resolve_ms_project_task_duration_hours(task) == 8.0


def test_mpp_runtime_xml_payload_removes_resources_and_assignments():
    xml_payload = b"""<?xml version='1.0' encoding='utf-8'?>
<Project xmlns="http://schemas.microsoft.com/project">
  <Tasks><Task><UID>1</UID><Name>T1</Name></Task></Tasks>
  <Resources><Resource><UID>1</UID><Name>R1</Name></Resource></Resources>
  <Assignments><Assignment><UID>1</UID></Assignment></Assignments>
</Project>"""

    runtime_payload = cronograma_trabajo_service._build_mpp_runtime_xml_payload(xml_payload)
    root = ET.fromstring(runtime_payload)
    ns = {"msp": "http://schemas.microsoft.com/project"}

    assert root.find("msp:Tasks", ns) is not None
    assert root.find("msp:Resources", ns) is None
    assert root.find("msp:Assignments", ns) is None


def test_ms_project_xml_export_can_skip_resources_and_assignments(db, sample_empresa):
    proyecto, presupuesto, line_1, line_2 = _build_work_schedule_fixture(db, sample_empresa)

    cronograma_trabajo_service.update_schedule(
        db,
        presupuesto_id=presupuesto.id,
        proyecto_id=proyecto.id,
        empresa_id=sample_empresa.id,
        obj_in=CronogramaTrabajoUpdate(
            schedule_data={
                str(line_1.id): CronogramaTrabajoLinea(
                    start_date="2026-04-01T08:00:00",
                    end_date="2026-04-01T16:00:00",
                    duration=1,
                    progress_pct=0,
                ),
                str(line_2.id): CronogramaTrabajoLinea(
                    start_date="2026-04-02T08:00:00",
                    end_date="2026-04-02T16:00:00",
                    duration=1,
                    progress_pct=0,
                ),
            }
        ),
    )

    xml_buffer = cronograma_trabajo_service.export_ms_project_xml(
        db,
        presupuesto_id=presupuesto.id,
        proyecto_id=proyecto.id,
        empresa_id=sample_empresa.id,
        include_resources=False,
    )
    root = ET.fromstring(xml_buffer.getvalue())
    ns = {"msp": "http://schemas.microsoft.com/project"}

    assert root.find("msp:Tasks", ns) is not None
    assert root.find("msp:Resources", ns) is None
    assert root.find("msp:Assignments", ns) is None


def test_ms_project_xml_export_and_controlled_import_roundtrip(db, sample_empresa):
    proyecto, presupuesto, line_1, line_2 = _build_work_schedule_fixture(db, sample_empresa)

    dependency = CronogramaTrabajoDependency(
        source_id=line_1.id,
        target_id=line_2.id,
        type="SS",
        lag_days=1.5,
        lag_unit="day",
    )
    cronograma_trabajo_service.update_schedule(
        db,
        presupuesto_id=presupuesto.id,
        proyecto_id=proyecto.id,
        empresa_id=sample_empresa.id,
        obj_in=CronogramaTrabajoUpdate(
            schedule_data={
                str(line_1.id): CronogramaTrabajoLinea(
                    start_date="2026-04-01T08:00:00",
                    end_date="2026-04-01T17:00:00",
                    duration=1,
                    progress_pct=0,
                ),
                str(line_2.id): CronogramaTrabajoLinea(
                    start_date="2026-04-03T08:00:00",
                    end_date="2026-04-04T17:00:00",
                    duration=2,
                    progress_pct=10,
                    predecessors=[line_1.id],
                    dependencies=[dependency],
                ),
            }
        ),
    )

    xml_buffer = cronograma_trabajo_service.export_ms_project_xml(
        db,
        presupuesto_id=presupuesto.id,
        proyecto_id=proyecto.id,
        empresa_id=sample_empresa.id,
    )
    root = ET.fromstring(xml_buffer.getvalue())
    ns = {"msp": "http://schemas.microsoft.com/project"}
    line_2_task = next(
        task
        for task in root.findall(".//msp:Task", ns)
        if task.findtext("msp:Text1", namespaces=ns) == f"line-{line_2.id}"
    )
    predecessor = line_2_task.find("msp:PredecessorLink", ns)

    assert line_2_task.findtext("msp:Text1", namespaces=ns) == f"line-{line_2.id}"
    assert predecessor.findtext("msp:Type", namespaces=ns) == "2"
    assert predecessor.findtext("msp:LinkLag", namespaces=ns) == str(720 * 10)

    line_2_task.find("msp:Start", ns).text = "2026-04-08T08:00:00"
    line_2_task.find("msp:Duration", ns).text = "PT24H0M0S"
    percent = line_2_task.find("msp:PercentComplete", ns)
    if percent is None:
        percent = ET.SubElement(line_2_task, "{http://schemas.microsoft.com/project}PercentComplete")
    percent.text = "55"

    imported = cronograma_trabajo_service.import_ms_project_xml(
        db,
        presupuesto_id=presupuesto.id,
        proyecto_id=proyecto.id,
        empresa_id=sample_empresa.id,
        xml_payload=ET.tostring(root, encoding="utf-8", xml_declaration=True),
    )
    imported_line = imported.schedule_data[str(line_2.id)]

    assert imported_line.start_date.isoformat().startswith("2026-04-02T12:00:00")
    assert imported_line.duration == 3.0
    assert imported_line.progress_pct == 55
    assert imported_line.dependencies[0].type == "SS"
    assert imported_line.dependencies[0].lag_days == 1.5
    assert imported_line.metadata["ms_project_import"]["source"] == "xml"


def _ensure_java_mpp_environment_or_skip():
    type(cronograma_trabajo_service)._detect_ms_project_environment.cache_clear()
    environment = cronograma_trabajo_service._detect_ms_project_environment()
    if not environment.get("available"):
        pytest.skip(environment.get("reason") or "El entorno Java .mpp no está disponible.")
    return environment


def test_ms_project_mpp_capabilities_detect_java_runner():
    environment = _ensure_java_mpp_environment_or_skip()
    capabilities = cronograma_trabajo_service.get_export_capabilities()

    assert environment["provider"] == "aspose_tasks_java"
    assert capabilities.direct_mpp_available is True
    assert "mpp" in capabilities.available_formats
    assert capabilities.preferred_format == "mpp"
    assert capabilities.template_name


def test_ms_project_mpp_export_generates_binary_file(db, sample_empresa):
    proyecto, presupuesto, line_1, line_2 = _build_work_schedule_fixture(db, sample_empresa)
    _ensure_java_mpp_environment_or_skip()

    dependency = CronogramaTrabajoDependency(
        source_id=line_1.id,
        target_id=line_2.id,
        type="FS",
        lag_days=0.5,
        lag_unit="day",
    )
    cronograma_trabajo_service.update_schedule(
        db,
        presupuesto_id=presupuesto.id,
        proyecto_id=proyecto.id,
        empresa_id=sample_empresa.id,
        obj_in=CronogramaTrabajoUpdate(
            schedule_data={
                str(line_1.id): CronogramaTrabajoLinea(
                    start_date="2026-04-01T08:00:00",
                    end_date="2026-04-01T17:00:00",
                    duration=1,
                    progress_pct=25,
                ),
                str(line_2.id): CronogramaTrabajoLinea(
                    start_date="2026-04-02T08:00:00",
                    end_date="2026-04-03T17:00:00",
                    duration=2,
                    progress_pct=10,
                    predecessors=[line_1.id],
                    dependencies=[dependency],
                ),
            }
        ),
    )

    mpp_buffer = cronograma_trabajo_service.export_ms_project_mpp(
        db,
        presupuesto_id=presupuesto.id,
        proyecto_id=proyecto.id,
        empresa_id=sample_empresa.id,
    )
    payload = mpp_buffer.getvalue()

    assert len(payload) > 1024
    assert not payload.startswith(b"<?xml")


def test_ms_project_mpp_capabilities_report_missing_java_runner(monkeypatch):
    monkeypatch.setenv("ASPOSE_TASKS_JAVA_BIN", "__missing_java_binary__")
    type(cronograma_trabajo_service)._detect_ms_project_environment.cache_clear()

    capabilities = cronograma_trabajo_service.get_export_capabilities()

    assert capabilities.direct_mpp_available is False
    assert capabilities.preferred_format == "xml"
    assert capabilities.available_formats == ["xml"]
    assert "java" in str(capabilities.direct_export_reason).lower()

    monkeypatch.delenv("ASPOSE_TASKS_JAVA_BIN", raising=False)
    type(cronograma_trabajo_service)._detect_ms_project_environment.cache_clear()


def test_compiled_runner_is_preferred_when_class_exists(tmp_path, monkeypatch):
    runner_path = tmp_path / "aspose_tasks_mpp_runner.java"
    runner_path.write_text("class placeholder {}", encoding="utf-8")
    jar_path = tmp_path / "aspose-tasks.jar"
    jar_path.write_text("", encoding="utf-8")
    build_dir = tmp_path / "build"
    build_dir.mkdir()
    class_path = build_dir / "aspose_tasks_mpp_runner.class"
    class_path.write_bytes(b"class-bytes")

    monkeypatch.setattr(
        cronograma_trabajo_service,
        "_resolve_aspose_tasks_java_build_dir",
        lambda: build_dir,
    )
    monkeypatch.setattr(
        cronograma_trabajo_service,
        "_resolve_javac_bin",
        lambda: "javac",
    )

    command_prefix, runner_mode = cronograma_trabajo_service._ensure_compiled_aspose_tasks_runner(
        "java",
        jar_path,
        runner_path,
    )

    assert runner_mode == "compiled"
    assert command_prefix[:3] == ["java", "-cp", f"{build_dir}{os.pathsep}{jar_path}"]
    assert command_prefix[3] == "aspose_tasks_mpp_runner"


def test_mpp_cache_roundtrip(tmp_path, monkeypatch):
    monkeypatch.setattr(
        cronograma_trabajo_service,
        "_resolve_mpp_cache_dir",
        lambda: tmp_path,
    )
    monkeypatch.setattr(
        cronograma_trabajo_service,
        "_resolve_mpp_cache_ttl_seconds",
        lambda: 3600,
    )

    cronograma_trabajo_service._store_mpp_in_cache("abc123", b"cached-mpp")
    payload = cronograma_trabajo_service._load_mpp_from_cache("abc123")

    assert payload is not None
    assert payload.getvalue() == b"cached-mpp"


def _build_admin_user(db, sample_empresa):
    user = Usuario(
        email="admin-gantt@test.local",
        hashed_password="x",
        nombre_completo="Admin Gantt",
        rol="administrador",
        activo=True,
        empresa_id=sample_empresa.id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def test_ms_project_mpp_export_endpoint_returns_attachment(db, sample_empresa, monkeypatch):
    proyecto, presupuesto, _, _ = _build_work_schedule_fixture(db, sample_empresa)
    current_user = _build_admin_user(db, sample_empresa)

    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_current_active_user] = lambda: current_user
    monkeypatch.setattr(
        "app.api.endpoints.cronogramas_trabajo._verify_module_access",
        lambda *args, **kwargs: None,
    )
    monkeypatch.setattr(
        "app.api.endpoints.cronogramas_trabajo.apu_resource_readiness_service.ensure_budget_ready",
        lambda *args, **kwargs: None,
    )
    monkeypatch.setattr(
        "app.api.endpoints.cronogramas_trabajo.license_service.ensure_commercial_exports_allowed",
        lambda *args, **kwargs: None,
    )
    monkeypatch.setattr(
        "app.api.endpoints.cronogramas_trabajo.cronograma_trabajo_service.get_export_capabilities",
        lambda: SimpleNamespace(
            direct_mpp_available=True,
            direct_export_reason=None,
            available_formats=["xml", "mpp"],
            preferred_format="mpp",
            template_name="Cronograma de trabajo.mpp",
        ),
    )
    monkeypatch.setattr(
        "app.api.endpoints.cronogramas_trabajo.cronograma_trabajo_service.export_ms_project_mpp",
        lambda *args, **kwargs: BytesIO(b"FAKE-MPP-BINARY-CONTENT"),
    )

    try:
        with TestClient(app) as client:
            response = client.get(
                f"/api/v1/cronogramas-trabajo/{presupuesto.id}/export/ms-project",
                params={"format": "mpp", "empresa_id": sample_empresa.id},
            )
    finally:
        app.dependency_overrides.clear()

    assert proyecto.id == presupuesto.proyecto_id
    assert response.status_code == 200, response.text
    assert response.headers["content-type"].startswith("application/vnd.ms-project")
    assert f"Cronograma_Trabajo_Project_{presupuesto.id}.mpp" in response.headers["content-disposition"]
    assert response.content == b"FAKE-MPP-BINARY-CONTENT"


def test_ms_project_mpp_export_endpoint_reports_unavailable_capability(db, sample_empresa, monkeypatch):
    _, presupuesto, _, _ = _build_work_schedule_fixture(db, sample_empresa)
    current_user = _build_admin_user(db, sample_empresa)

    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_current_active_user] = lambda: current_user
    monkeypatch.setattr(
        "app.api.endpoints.cronogramas_trabajo._verify_module_access",
        lambda *args, **kwargs: None,
    )
    monkeypatch.setattr(
        "app.api.endpoints.cronogramas_trabajo.license_service.ensure_commercial_exports_allowed",
        lambda *args, **kwargs: None,
    )
    monkeypatch.setattr(
        "app.api.endpoints.cronogramas_trabajo.cronograma_trabajo_service.get_export_capabilities",
        lambda: SimpleNamespace(
            direct_mpp_available=False,
            direct_export_reason="Java/Aspose no disponible en este entorno.",
            available_formats=["xml"],
            preferred_format="xml",
            template_name=None,
        ),
    )

    try:
        with TestClient(app) as client:
            response = client.get(
                f"/api/v1/cronogramas-trabajo/{presupuesto.id}/export/ms-project",
                params={"format": "mpp", "empresa_id": sample_empresa.id},
            )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 409
    assert response.json()["detail"] == "Java/Aspose no disponible en este entorno."


def test_read_cronograma_trabajo_allows_superadmin_without_explicit_empresa_id(db, sample_empresa, monkeypatch):
    proyecto, presupuesto, _, _ = _build_work_schedule_fixture(db, sample_empresa)

    other_empresa = Empresa(
        nombre="Empresa Control Superadmin",
        codigo="EMP-SA-QA",
        ruc="0999999999001",
        activa=True,
        limite_administradores=1,
        limite_usuarios=1,
    )
    db.add(other_empresa)
    db.commit()
    db.refresh(other_empresa)

    current_user = Usuario(
        email="superadmin-gantt@example.com",
        hashed_password="not-used",
        nombre_completo="Superadmin Gantt QA",
        rol="superadministrador",
        activo=True,
        empresa_id=other_empresa.id,
    )
    db.add(current_user)
    db.commit()
    db.refresh(current_user)

    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_current_active_user] = lambda: current_user
    monkeypatch.setattr(
        "app.api.endpoints.cronogramas_trabajo._verify_module_access",
        lambda *args, **kwargs: None,
    )
    monkeypatch.setattr(
        "app.api.endpoints.cronogramas_trabajo.apu_resource_readiness_service.ensure_budget_ready",
        lambda *args, **kwargs: None,
    )

    try:
        with TestClient(app) as client:
            response = client.get(f"/api/v1/cronogramas-trabajo/{presupuesto.id}")
    finally:
        app.dependency_overrides.clear()

    assert proyecto.id == presupuesto.proyecto_id
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["presupuesto_id"] == presupuesto.id
    assert payload["empresa_id"] == sample_empresa.id
