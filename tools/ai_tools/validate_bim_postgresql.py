from __future__ import annotations

import argparse
import sys
from pathlib import Path

from alembic import command
from alembic.config import Config
from alembic.script import ScriptDirectory
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url


ROOT = Path(__file__).resolve().parents[2]
BACKEND = ROOT / "backend"
sys.path.insert(0, str(BACKEND))

from app.core.config import settings  # noqa: E402
from app.core.database import Base  # noqa: E402
import app.models  # noqa: E402,F401


BIM_TABLES = {
    "bim_4d_activity_snapshots",
    "bim_4d_baseline_activities",
    "bim_4d_baselines",
    "bim_4d_dependency_snapshots",
    "bim_4d_link_proposals",
    "bim_4d_progress_snapshots",
    "bim_4d_work_areas",
    "bim_4d_constructible_components",
    "bim_4d_scenarios",
    "bim_4d_productivity_proposals",
    "bim_4d_field_reports",
    "bim_4d_field_evidence",
    "bim_4d_resources",
    "bim_4d_resource_assignments",
    "bim_4d_partition_specs",
    "bim_4d_partition_artifacts",
    "bim_4d_partition_csg_artifacts",
    "bim_4d_equipment",
    "bim_4d_equipment_motion_plans",
    "bim_4d_safety_risks",
    "bim_4d_safety_inspections",
    "bim_4d_safety_punch_items",
    "bim_4d_unplanned_events",
    "bim_4d_field_resource_movements",
    "bim_4d_crews",
    "bim_4d_timecards",
    "bim_cost_estimates",
    "bim_cost_contracts",
    "bim_cost_payment_applications",
    "bim_cost_schedules_of_values",
    "bim_cost_change_orders",
    "bim_schedule_import_revisions",
    "bim_qto_snapshots",
    "bim_4d_resource_leveling_scenarios",
    "bim_cde_documents",
    "bim_cde_document_revisions",
    "bim_cde_rfis",
    "bim_cde_rfi_events",
    "bim_cde_submittals",
    "bim_cde_submittal_revisions",
    "bim_cde_submittal_events",
    "bim_cde_document_acls",
    "bim_site_georeferences",
    "bim_cde_reviews",
    "bim_cde_review_comments",
    "bim_cde_review_notifications",
    "bim_issue_attachments",
}


def _config(database_url: str) -> Config:
    config = Config(str(BACKEND / "alembic.ini"))
    config.set_main_option("sqlalchemy.url", database_url)
    return config


def validate(database_name: str) -> None:
    if not database_name.endswith("_test"):
        raise RuntimeError("La base de validacion debe terminar en _test.")

    source_url = make_url(settings.sync_database_url)
    if source_url.database == database_name:
        raise RuntimeError("La base de validacion no puede ser la base operativa.")

    admin_engine = create_engine(
        source_url.set(database="postgres"), isolation_level="AUTOCOMMIT"
    )
    with admin_engine.connect() as connection:
        connection.execute(
            text(
                "select pg_terminate_backend(pid) from pg_stat_activity "
                "where datname=:database and pid <> pg_backend_pid()"
            ),
            {"database": database_name},
        )
        connection.execute(text(f'DROP DATABASE IF EXISTS "{database_name}"'))
        connection.execute(text(f'CREATE DATABASE "{database_name}"'))

    target_url = source_url.set(database=database_name)
    target_url_text = target_url.render_as_string(hide_password=False)
    engine = create_engine(target_url)
    baseline_tables = [
        table for table in Base.metadata.sorted_tables if table.name not in BIM_TABLES
    ]
    Base.metadata.create_all(engine, tables=baseline_tables)

    config = _config(target_url_text)
    script = ScriptDirectory.from_config(config)
    baseline_heads = [
        head for head in script.get_heads() if head != "de2042a1b2c3"
    ] + ["de2010a1b2c3"]
    command.stamp(config, baseline_heads)
    command.upgrade(config, "de2042a1b2c3")

    with engine.connect() as connection:
        current_database = connection.execute(text("select current_database()" )).scalar_one()
        if current_database != database_name:
            raise RuntimeError("Alembic no respeto la base PostgreSQL de validacion.")
        for table_name in BIM_TABLES:
            if connection.execute(
                text("select to_regclass(:table_name)"), {"table_name": table_name}
            ).scalar_one() != table_name:
                raise RuntimeError(f"No se creo {table_name}.")
        reported_at_type = connection.execute(
            text(
                "select data_type from information_schema.columns "
                "where table_name='bim_4d_progress_snapshots' "
                "and column_name='reported_at'"
            )
        ).scalar_one()
        if reported_at_type != "timestamp with time zone":
            raise RuntimeError("reported_at no usa TIMESTAMP WITH TIME ZONE.")
        leveling_decided_type = connection.execute(
            text(
                "select data_type from information_schema.columns "
                "where table_name='bim_4d_resource_leveling_scenarios' "
                "and column_name='decided_at'"
            )
        ).scalar_one()
        if leveling_decided_type != "timestamp with time zone":
            raise RuntimeError("leveling.decided_at no usa TIMESTAMP WITH TIME ZONE.")
        project_revision_type = connection.execute(
            text(
                "select data_type from information_schema.columns "
                "where table_name='bim_4d_resource_leveling_scenarios' "
                "and column_name='project_revision'"
            )
        ).scalar_one()
        if project_revision_type != "integer":
            raise RuntimeError("La nivelacion no persiste project_revision entero.")
        active_index = connection.execute(
            text(
                "select indexdef from pg_indexes where tablename="
                "'bim_4d_resource_leveling_scenarios' and indexname="
                "'uq_bim_4d_leveling_active'"
            )
        ).scalar_one()
        if "UNIQUE INDEX" not in active_index or "status" not in active_index or "approved" not in active_index:
            raise RuntimeError("Indice parcial de nivelacion aprobada invalido.")
        cde_created_type = connection.execute(
            text(
                "select data_type from information_schema.columns "
                "where table_name='bim_cde_document_revisions' "
                "and column_name='created_at'"
            )
        ).scalar_one()
        if cde_created_type != "timestamp with time zone":
            raise RuntimeError("cde.created_at no usa TIMESTAMP WITH TIME ZONE.")
        cde_current_index = connection.execute(
            text(
                "select indexdef from pg_indexes where tablename="
                "'bim_cde_document_revisions' and indexname="
                "'uq_bim_cde_document_current_revision'"
            )
        ).scalar_one()
        if "UNIQUE INDEX" not in cde_current_index or "status" not in cde_current_index or "current" not in cde_current_index:
            raise RuntimeError("Indice parcial de revision CDE vigente invalido.")
        rfi_due_type = connection.execute(
            text(
                "select data_type from information_schema.columns "
                "where table_name='bim_cde_rfis' and column_name='due_at'"
            )
        ).scalar_one()
        rfi_answered_type = connection.execute(
            text(
                "select data_type from information_schema.columns "
                "where table_name='bim_cde_rfis' and column_name='answered_at'"
            )
        ).scalar_one()
        if rfi_due_type != "timestamp with time zone" or rfi_answered_type != "timestamp with time zone":
            raise RuntimeError("El workflow RFI no usa TIMESTAMP WITH TIME ZONE.")
        submittal_required_type = connection.execute(
            text(
                "select data_type from information_schema.columns "
                "where table_name='bim_cde_submittals' and column_name='required_at'"
            )
        ).scalar_one()
        submittal_reviewed_type = connection.execute(
            text(
                "select data_type from information_schema.columns "
                "where table_name='bim_cde_submittal_revisions' and column_name='reviewed_at'"
            )
        ).scalar_one()
        if submittal_required_type != "timestamp with time zone" or submittal_reviewed_type != "timestamp with time zone":
            raise RuntimeError("El workflow submittal no usa TIMESTAMP WITH TIME ZONE.")
        acl_active_type = connection.execute(
            text(
                "select data_type from information_schema.columns "
                "where table_name='bim_cde_document_acls' and column_name='active'"
            )
        ).scalar_one()
        acl_updated_type = connection.execute(
            text(
                "select data_type from information_schema.columns "
                "where table_name='bim_cde_document_acls' and column_name='updated_at'"
            )
        ).scalar_one()
        if acl_active_type != "boolean" or acl_updated_type != "timestamp with time zone":
            raise RuntimeError("La ACL documental no usa BOOLEAN/TIMESTAMP WITH TIME ZONE.")
        site_created_type = connection.execute(
            text(
                "select data_type from information_schema.columns "
                "where table_name='bim_site_georeferences' and column_name='created_at'"
            )
        ).scalar_one()
        site_project_revision_type = connection.execute(
            text(
                "select data_type from information_schema.columns "
                "where table_name='bim_site_georeferences' and column_name='project_revision'"
            )
        ).scalar_one()
        site_active_index = connection.execute(
            text(
                "select indexdef from pg_indexes where tablename='bim_site_georeferences' "
                "and indexname='uq_bim_site_georeference_active'"
            )
        ).scalar_one()
        if site_created_type != "timestamp with time zone" or site_project_revision_type != "integer":
            raise RuntimeError("La georreferencia BIM no usa TIMESTAMPTZ/revision entera.")
        if "UNIQUE INDEX" not in site_active_index or "status" not in site_active_index or "active" not in site_active_index:
            raise RuntimeError("Indice parcial de georreferencia BIM activa invalido.")
        review_due_type = connection.execute(
            text(
                "select data_type from information_schema.columns "
                "where table_name='bim_cde_reviews' and column_name='due_at'"
            )
        ).scalar_one()
        notification_read_type = connection.execute(
            text(
                "select data_type from information_schema.columns "
                "where table_name='bim_cde_review_notifications' and column_name='read_at'"
            )
        ).scalar_one()
        if review_due_type != "timestamp with time zone" or notification_read_type != "timestamp with time zone":
            raise RuntimeError("Las revisiones CDE no usan TIMESTAMP WITH TIME ZONE.")
        attachment_uploaded_type = connection.execute(
            text(
                "select data_type from information_schema.columns "
                "where table_name='bim_issue_attachments' and column_name='uploaded_at'"
            )
        ).scalar_one()
        attachment_content_type = connection.execute(
            text(
                "select data_type from information_schema.columns "
                "where table_name='bim_issue_attachments' and column_name='content'"
            )
        ).scalar_one()
        if attachment_uploaded_type != "timestamp with time zone" or attachment_content_type != "bytea":
            raise RuntimeError("La evidencia de incidencias no usa TIMESTAMPTZ/BYTEA.")
        punch_due_type = connection.execute(
            text(
                "select data_type from information_schema.columns "
                "where table_name='bim_4d_safety_punch_items' and column_name='due_at'"
            )
        ).scalar_one()
        checklist_type = connection.execute(
            text(
                "select data_type from information_schema.columns "
                "where table_name='bim_4d_safety_inspections' and column_name='checklist_json'"
            )
        ).scalar_one()
        if punch_due_type != "timestamp with time zone" or checklist_type != "json":
            raise RuntimeError("Inspecciones/punch BIM no usan TIMESTAMPTZ/JSON.")
        event_occurred_type = connection.execute(
            text(
                "select data_type from information_schema.columns "
                "where table_name='bim_4d_unplanned_events' and column_name='occurred_at'"
            )
        ).scalar_one()
        if event_occurred_type != "timestamp with time zone":
            raise RuntimeError("Los eventos no planificados no usan TIMESTAMPTZ.")
        movement_occurred_type = connection.execute(
            text(
                "select data_type from information_schema.columns "
                "where table_name='bim_4d_field_resource_movements' and column_name='occurred_at'"
            )
        ).scalar_one()
        if movement_occurred_type != "timestamp with time zone":
            raise RuntimeError("Los movimientos de recursos de Campo no usan TIMESTAMPTZ.")
        timecard_date_type = connection.execute(
            text(
                "select data_type from information_schema.columns "
                "where table_name='bim_4d_timecards' and column_name='work_date'"
            )
        ).scalar_one()
        if timecard_date_type != "date":
            raise RuntimeError("Los partes BIM no usan DATE para la jornada.")
        estimate_subtotal_type = connection.execute(
            text(
                "select data_type from information_schema.columns "
                "where table_name='bim_cost_estimates' and column_name='subtotal'"
            )
        ).scalar_one()
        if estimate_subtotal_type != "numeric":
            raise RuntimeError("La estimacion BIM no usa NUMERIC para el subtotal.")
        contract_amount_type = connection.execute(
            text(
                "select data_type from information_schema.columns "
                "where table_name='bim_cost_contracts' and column_name='committed_amount'"
            )
        ).scalar_one()
        contract_start_type = connection.execute(
            text(
                "select data_type from information_schema.columns "
                "where table_name='bim_cost_contracts' and column_name='start_date'"
            )
        ).scalar_one()
        if contract_amount_type != "numeric" or contract_start_type != "date":
            raise RuntimeError("El contrato BIM no usa NUMERIC/DATE para importe y periodo.")
        payment_gross_type = connection.execute(
            text(
                "select data_type from information_schema.columns "
                "where table_name='bim_cost_payment_applications' and column_name='gross_requested'"
            )
        ).scalar_one()
        payment_period_type = connection.execute(
            text(
                "select data_type from information_schema.columns "
                "where table_name='bim_cost_payment_applications' and column_name='period_start'"
            )
        ).scalar_one()
        payment_decided_type = connection.execute(
            text(
                "select data_type from information_schema.columns "
                "where table_name='bim_cost_payment_applications' and column_name='decided_at'"
            )
        ).scalar_one()
        if payment_gross_type != "numeric" or payment_period_type != "date" or payment_decided_type != "timestamp with time zone":
            raise RuntimeError("Las solicitudes de pago BIM no usan NUMERIC/DATE/TIMESTAMPTZ.")
        sov_total_type = connection.execute(
            text(
                "select data_type from information_schema.columns "
                "where table_name='bim_cost_schedules_of_values' and column_name='total_scheduled_value'"
            )
        ).scalar_one()
        sov_active_index = connection.execute(
            text(
                "select indexdef from pg_indexes where tablename='bim_cost_schedules_of_values' "
                "and indexname='uq_bim_cost_sov_active_approval'"
            )
        ).scalar_one()
        if sov_total_type != "numeric":
            raise RuntimeError("El SOV BIM no usa NUMERIC para el valor programado.")
        if "UNIQUE INDEX" not in sov_active_index or "status" not in sov_active_index or "approved" not in sov_active_index:
            raise RuntimeError("Indice parcial de SOV BIM aprobado invalido.")
        change_cost_type = connection.execute(
            text(
                "select data_type from information_schema.columns "
                "where table_name='bim_cost_change_orders' and column_name='requested_cost_delta'"
            )
        ).scalar_one()
        change_decided_type = connection.execute(
            text(
                "select data_type from information_schema.columns "
                "where table_name='bim_cost_change_orders' and column_name='decided_at'"
            )
        ).scalar_one()
        if change_cost_type != "numeric" or change_decided_type != "timestamp with time zone":
            raise RuntimeError("Las ordenes de cambio BIM no usan NUMERIC/TIMESTAMPTZ.")

    command.downgrade(config, "de2010a1b2c3")
    with engine.connect() as connection:
        remaining = [
            table_name
            for table_name in BIM_TABLES
            if connection.execute(
                text("select to_regclass(:table_name)"), {"table_name": table_name}
            ).scalar_one_or_none()
        ]
        if remaining:
            raise RuntimeError(f"Downgrade incompleto: {', '.join(sorted(remaining))}.")

    command.upgrade(config, "de2042a1b2c3")
    print(
        f"BIM_POSTGRESQL_OK database={database_name} "
        "upgrade=de2042a1b2c3 downgrade=de2010a1b2c3 "
        "timezone=TIMESTAMPTZ revision_scope=project_revision "
        "unique_active=partial_index cde_current=partial_index "
        "rfi_workflow=TIMESTAMPTZ submittal_workflow=TIMESTAMPTZ "
        "document_acl=BOOLEAN site_georeference=TIMESTAMPTZ cde_reviews=TIMESTAMPTZ "
        "issue_attachments=BYTEA/TIMESTAMPTZ field_inspections=JSON/TIMESTAMPTZ "
        "unplanned_events=TIMESTAMPTZ field_resources=TIMESTAMPTZ crews_timecards=DATE "
        "cost_estimates=NUMERIC cost_contracts=NUMERIC/DATE cost_payments=NUMERIC/DATE/TIMESTAMPTZ "
        "cost_sov=NUMERIC/partial_index cost_changes=NUMERIC/TIMESTAMPTZ"
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--database", default="giproy_bim_test")
    args = parser.parse_args()
    validate(args.database)


if __name__ == "__main__":
    main()
