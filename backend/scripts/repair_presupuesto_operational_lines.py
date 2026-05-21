from decimal import Decimal

import psycopg2


DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "dbname": "giproy_erp",
    "user": "postgres",
    "password": "CEE9846B4CFDA0E7E14E3722BE702C88",
}


def find_matching_apu_id(cur, descripcion: str):
    cur.execute(
        """
        select id
        from apus
        where descripcion = %s
        order by id asc
        limit 1
        """,
        (descripcion,),
    )
    row = cur.fetchone()
    return row[0] if row else None


def recalculate_codes(cur, presupuesto_id: int):
    cur.execute(
        """
        select id, codigo_item
        from presupuesto_detalles
        where presupuesto_id = %s
          and tipo = 'CUENTA_PAQUETE'
        order by id asc
        """,
        (presupuesto_id,),
    )
    chapter_codes = {row[0]: row[1] for row in cur.fetchall()}

    for structural_id, chapter_code in chapter_codes.items():
        cur.execute(
            """
            select id
            from presupuesto_detalles
            where presupuesto_id = %s
              and parent_id = %s
              and (tipo is null or tipo <> 'CUENTA_PAQUETE')
            order by orden asc, id asc
            """,
            (presupuesto_id, structural_id),
        )
        line_ids = [row[0] for row in cur.fetchall()]
        for index, line_id in enumerate(line_ids, start=1):
            cur.execute(
                """
                update presupuesto_detalles
                set codigo_item = %s, orden = %s
                where id = %s
                """,
                (f"{chapter_code}.{index}", index - 1, line_id),
            )


def main():
    conn = psycopg2.connect(**DB_CONFIG)
    conn.autocommit = False
    cur = conn.cursor()

    cur.execute(
        """
        select p.codigo_root, pb.id as presupuesto_target_id, ps.id as presupuesto_source_id
        from proyectos p
        join presupuestos pb on pb.proyecto_id = p.id
        join (
            select p2.codigo_root, pr2.id
            from proyectos p2
            join presupuestos pr2 on pr2.proyecto_id = p2.id
            join presupuesto_detalles d2 on d2.presupuesto_id = pr2.id
            group by p2.codigo_root, pr2.id
            having sum(case when d2.tipo is distinct from 'CUENTA_PAQUETE' then 1 else 0 end) > 0
        ) ps on ps.codigo_root = p.codigo_root and ps.id <> pb.id
        join presupuesto_detalles d on d.presupuesto_id = pb.id
        group by p.codigo_root, pb.id, ps.id
        having sum(case when d.tipo is distinct from 'CUENTA_PAQUETE' then 1 else 0 end) = 0
        order by p.codigo_root, pb.id, ps.id
        """
    )
    candidates = cur.fetchall()

    repaired = []
    for codigo_root, target_budget_id, source_budget_id in candidates:
        cur.execute(
            """
            select id, edt_id, descripcion, unidad, cantidad, precio_unitario, precio_total,
                   notas, omniclass_codigo, omniclass_titulo
            from presupuesto_detalles
            where presupuesto_id = %s
              and (tipo is null or tipo <> 'CUENTA_PAQUETE')
            order by id asc
            """,
            (source_budget_id,),
        )
        source_lines = cur.fetchall()
        if not source_lines:
            continue

        cur.execute(
            """
            select edt_id, id
            from presupuesto_detalles
            where presupuesto_id = %s
              and tipo = 'CUENTA_PAQUETE'
            order by id asc
            """,
            (target_budget_id,),
        )
        structural_rows = {row[0]: row[1] for row in cur.fetchall()}
        if not structural_rows:
            continue

        inserted = 0
        for (
            _source_id,
            edt_id,
            descripcion,
            unidad,
            cantidad,
            precio_unitario,
            precio_total,
            notas,
            omniclass_codigo,
            omniclass_titulo,
        ) in source_lines:
            parent_id = structural_rows.get(edt_id)
            if not parent_id:
                continue

            apu_id = find_matching_apu_id(cur, descripcion)
            cur.execute(
                """
                insert into presupuesto_detalles (
                    presupuesto_id, apu_id, parent_id, tipo, edt_id, codigo_item, descripcion,
                    unidad, cantidad, precio_unitario, precio_total, orden,
                    omniclass_codigo, omniclass_titulo, notas, tanteo_activo
                ) values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    target_budget_id,
                    apu_id,
                    parent_id,
                    None,
                    edt_id,
                    None,
                    descripcion,
                    unidad,
                    cantidad if cantidad is not None else Decimal("1.0"),
                    precio_unitario if precio_unitario is not None else Decimal("0.0"),
                    precio_total if precio_total is not None else Decimal("0.0"),
                    inserted,
                    omniclass_codigo,
                    omniclass_titulo,
                    notas,
                    False,
                ),
            )
            inserted += 1

        if inserted:
            recalculate_codes(cur, target_budget_id)
            repaired.append((codigo_root, target_budget_id, source_budget_id, inserted))

    conn.commit()
    for item in repaired:
        print("REPAIRED", item)
    if not repaired:
        print("NO_REPAIRS")

    cur.close()
    conn.close()


if __name__ == "__main__":
    main()
