import psycopg2
from app.core.config import settings

def check():
    try:
        conn = psycopg2.connect(settings.sync_database_url)
        cur = conn.cursor()
        
        print("--- Tables named 'usuarios' ---")
        cur.execute("SELECT table_schema, table_name FROM information_schema.tables WHERE table_name='usuarios'")
        tables = cur.fetchall()
        for t in tables:
            print(f"Schema: {t[0]}, Table: {t[1]}")
            
            # Check columns in this schema
            cur.execute(f"SELECT column_name FROM information_schema.columns WHERE table_schema='{t[0]}' AND table_name='usuarios'")
            cols = [c[0] for c in cur.fetchall()]
            print(f"  Columns: {cols}")
            print("-" * 20)
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check()
