from sqlalchemy import inspect, text

from app.core.database import engine


def main() -> None:
    inspector = inspect(engine)
    columns = {column["name"] for column in inspector.get_columns("apu_lineas")}

    with engine.begin() as connection:
        if "orden" not in columns:
            connection.execute(text("ALTER TABLE apu_lineas ADD COLUMN orden INTEGER NOT NULL DEFAULT 0"))
            connection.execute(text("CREATE INDEX IF NOT EXISTS ix_apu_lineas_orden ON apu_lineas (orden)"))

        connection.execute(
            text(
                """
                WITH ranked AS (
                    SELECT
                        al.id,
                        ROW_NUMBER() OVER (
                            PARTITION BY al.apu_id
                            ORDER BY
                                CASE
                                    WHEN al.apu_hijo_id IS NOT NULL THEN 1
                                    WHEN split_part(coalesce(r.codigo, ''), '-', 1) = '1' THEN 0
                                    WHEN split_part(coalesce(r.codigo, ''), '-', 1) = '2' THEN 1
                                    WHEN split_part(coalesce(r.codigo, ''), '-', 1) = '3' THEN 2
                                    WHEN split_part(coalesce(r.codigo, ''), '-', 1) = '4' THEN 3
                                    ELSE 4
                                END,
                                coalesce(al.orden, 0),
                                al.id
                        ) - 1 AS normalized_order
                    FROM apu_lineas al
                    LEFT JOIN recursos r ON r.id = al.recurso_id
                )
                UPDATE apu_lineas AS target
                SET orden = ranked.normalized_order
                FROM ranked
                WHERE ranked.id = target.id
                """
            )
        )

    print("apu_lineas.orden listo y normalizado.")


if __name__ == "__main__":
    main()
