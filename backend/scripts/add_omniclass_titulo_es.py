import psycopg2

DB_NAME = "giproy_erp"
DB_USER = "postgres"
DB_PASS = "CEE9846B4CFDA0E7E14E3722BE702C88"
DB_HOST = "localhost"
DB_PORT = "5432"


def main():
    conn = psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASS,
        host=DB_HOST,
        port=DB_PORT,
    )
    conn.autocommit = False
    cur = conn.cursor()
    try:
        cur.execute(
            """
            ALTER TABLE omniclass_maestro
            ADD COLUMN IF NOT EXISTS titulo_es VARCHAR(500)
            """
        )
        cur.execute(
            """
            UPDATE omniclass_maestro
            SET titulo_es = titulo
            WHERE titulo_es IS NULL OR btrim(titulo_es) = ''
            """
        )
        conn.commit()
        cur.execute("SELECT COUNT(*) FROM omniclass_maestro WHERE titulo_es IS NOT NULL AND btrim(titulo_es) <> ''")
        count = cur.fetchone()[0]
        print(f"OmniClass titulo_es populated rows: {count}")
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    main()
