"""enforce base scope integrity for presupuesto details and apu lines

Revision ID: c2d4e6f8a0b1
Revises: e2f3a4b5c6d7, a9b8c7d6e5f4
Create Date: 2026-04-04 10:35:00.000000
"""

from alembic import op


# revision identifiers, used by Alembic.
revision = "c2d4e6f8a0b1"
down_revision = ("e2f3a4b5c6d7", "a9b8c7d6e5f4")
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE OR REPLACE FUNCTION enforce_presupuesto_detalle_scope_integrity()
        RETURNS trigger AS $$
        DECLARE
            v_presupuesto_proyecto_id integer;
            v_presupuesto_empresa_id integer;
            v_project_base_id integer;
            v_apu_base_id integer;
            v_apu_empresa_id integer;
            v_edt_proyecto_id integer;
            v_edt_empresa_id integer;
            v_parent_presupuesto_id integer;
        BEGIN
            SELECT p.proyecto_id, p.empresa_id, pr.base_trabajo_id
            INTO v_presupuesto_proyecto_id, v_presupuesto_empresa_id, v_project_base_id
            FROM presupuestos p
            JOIN proyectos pr ON pr.id = p.proyecto_id
            WHERE p.id = NEW.presupuesto_id;

            IF NOT FOUND THEN
                RAISE EXCEPTION 'Presupuesto % no encontrado para validar presupuesto_detalles', NEW.presupuesto_id;
            END IF;

            IF NEW.apu_id IS NOT NULL THEN
                SELECT a.base_trabajo_id, a.empresa_id
                INTO v_apu_base_id, v_apu_empresa_id
                FROM apus a
                WHERE a.id = NEW.apu_id;

                IF NOT FOUND THEN
                    RAISE EXCEPTION 'APU % no encontrado para validar presupuesto_detalles', NEW.apu_id;
                END IF;

                IF v_apu_empresa_id IS DISTINCT FROM v_presupuesto_empresa_id THEN
                    RAISE EXCEPTION 'El APU % no pertenece a la empresa del presupuesto %', NEW.apu_id, NEW.presupuesto_id;
                END IF;

                IF v_project_base_id IS NULL THEN
                    RAISE EXCEPTION 'El proyecto del presupuesto % no tiene base_trabajo activa y no puede referenciar APUs', NEW.presupuesto_id;
                END IF;

                IF v_apu_base_id IS DISTINCT FROM v_project_base_id THEN
                    RAISE EXCEPTION 'El APU % pertenece a la base % y no a la base activa % del proyecto del presupuesto %',
                        NEW.apu_id, v_apu_base_id, v_project_base_id, NEW.presupuesto_id;
                END IF;
            END IF;

            IF NEW.edt_id IS NOT NULL THEN
                SELECT e.proyecto_id, e.empresa_id
                INTO v_edt_proyecto_id, v_edt_empresa_id
                FROM edt_nodes e
                WHERE e.id = NEW.edt_id;

                IF NOT FOUND THEN
                    RAISE EXCEPTION 'EDT % no encontrado para validar presupuesto_detalles', NEW.edt_id;
                END IF;

                IF v_edt_proyecto_id IS DISTINCT FROM v_presupuesto_proyecto_id
                   OR v_edt_empresa_id IS DISTINCT FROM v_presupuesto_empresa_id THEN
                    RAISE EXCEPTION 'La EDT % no pertenece al mismo proyecto/empresa del presupuesto %', NEW.edt_id, NEW.presupuesto_id;
                END IF;
            END IF;

            IF NEW.parent_id IS NOT NULL THEN
                SELECT pd.presupuesto_id
                INTO v_parent_presupuesto_id
                FROM presupuesto_detalles pd
                WHERE pd.id = NEW.parent_id;

                IF NOT FOUND THEN
                    RAISE EXCEPTION 'La línea padre % no existe para presupuesto_detalles', NEW.parent_id;
                END IF;

                IF v_parent_presupuesto_id IS DISTINCT FROM NEW.presupuesto_id THEN
                    RAISE EXCEPTION 'La línea padre % pertenece a otro presupuesto', NEW.parent_id;
                END IF;
            END IF;

            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        """
    )
    op.execute("DROP TRIGGER IF EXISTS trg_presupuesto_detalle_scope_integrity ON presupuesto_detalles;")
    op.execute(
        """
        CREATE TRIGGER trg_presupuesto_detalle_scope_integrity
        BEFORE INSERT OR UPDATE OF presupuesto_id, apu_id, edt_id, parent_id
        ON presupuesto_detalles
        FOR EACH ROW
        EXECUTE FUNCTION enforce_presupuesto_detalle_scope_integrity();
        """
    )

    op.execute(
        """
        CREATE OR REPLACE FUNCTION enforce_apu_line_scope_integrity()
        RETURNS trigger AS $$
        DECLARE
            v_owner_base_id integer;
            v_owner_empresa_id integer;
            v_recurso_base_id integer;
            v_recurso_empresa_id integer;
            v_child_base_id integer;
            v_child_empresa_id integer;
        BEGIN
            SELECT a.base_trabajo_id, a.empresa_id
            INTO v_owner_base_id, v_owner_empresa_id
            FROM apus a
            WHERE a.id = NEW.apu_id;

            IF NOT FOUND THEN
                RAISE EXCEPTION 'APU % no encontrado para validar apu_lineas', NEW.apu_id;
            END IF;

            IF NEW.recurso_id IS NOT NULL THEN
                SELECT r.base_trabajo_id, r.empresa_id
                INTO v_recurso_base_id, v_recurso_empresa_id
                FROM recursos r
                WHERE r.id = NEW.recurso_id;

                IF NOT FOUND THEN
                    RAISE EXCEPTION 'Recurso % no encontrado para validar apu_lineas', NEW.recurso_id;
                END IF;

                IF v_recurso_empresa_id IS DISTINCT FROM v_owner_empresa_id
                   OR v_recurso_base_id IS DISTINCT FROM v_owner_base_id THEN
                    RAISE EXCEPTION 'El recurso % no pertenece a la misma base/empresa del APU %', NEW.recurso_id, NEW.apu_id;
                END IF;
            END IF;

            IF NEW.apu_hijo_id IS NOT NULL THEN
                SELECT a.base_trabajo_id, a.empresa_id
                INTO v_child_base_id, v_child_empresa_id
                FROM apus a
                WHERE a.id = NEW.apu_hijo_id;

                IF NOT FOUND THEN
                    RAISE EXCEPTION 'APU hijo % no encontrado para validar apu_lineas', NEW.apu_hijo_id;
                END IF;

                IF v_child_empresa_id IS DISTINCT FROM v_owner_empresa_id
                   OR v_child_base_id IS DISTINCT FROM v_owner_base_id THEN
                    RAISE EXCEPTION 'El APU hijo % no pertenece a la misma base/empresa del APU %', NEW.apu_hijo_id, NEW.apu_id;
                END IF;
            END IF;

            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        """
    )
    op.execute("DROP TRIGGER IF EXISTS trg_apu_line_scope_integrity ON apu_lineas;")
    op.execute(
        """
        CREATE TRIGGER trg_apu_line_scope_integrity
        BEFORE INSERT OR UPDATE OF apu_id, recurso_id, apu_hijo_id
        ON apu_lineas
        FOR EACH ROW
        EXECUTE FUNCTION enforce_apu_line_scope_integrity();
        """
    )


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS trg_apu_line_scope_integrity ON apu_lineas;")
    op.execute("DROP FUNCTION IF EXISTS enforce_apu_line_scope_integrity();")
    op.execute("DROP TRIGGER IF EXISTS trg_presupuesto_detalle_scope_integrity ON presupuesto_detalles;")
    op.execute("DROP FUNCTION IF EXISTS enforce_presupuesto_detalle_scope_integrity();")
