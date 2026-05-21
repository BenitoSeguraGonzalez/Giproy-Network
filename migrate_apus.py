
import sys
import os
from sqlalchemy import create_engine, text

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.core.config import settings

engine = create_engine(settings.sync_database_url)

def migrate():
    with engine.connect() as conn:
        # Check if column exists
        res = conn.execute(text("PRAGMA table_info(apus);")).fetchall()
        columns = [row[1] for row in res]
        
        if "subcategoria_item_id" not in columns:
            print("Adding subcategoria_item_id column to apus table...")
            conn.execute(text("ALTER TABLE apus ADD COLUMN subcategoria_item_id INTEGER REFERENCES subcategorias_items(id);"))
            print("Column added successfully.")
        else:
            print("Column subcategoria_item_id already exists.")

        # Assign a default subcategory if there are APUs without one
        # Find the first subcategory for Cat 5
        subcat = conn.execute(text("SELECT id FROM subcategorias_items WHERE subcategoria_codigo = 5 LIMIT 1;")).fetchone()
        if subcat:
            subcat_id = subcat[0]
            print(f"Assigning default subcategory ID {subcat_id} to APUs without one...")
            conn.execute(text(f"UPDATE apus SET subcategoria_item_id = {subcat_id} WHERE subcategoria_item_id IS NULL;"))
            print("Default subcategory assigned.")
        else:
            print("No subcategory for Cat 5 found. Please create one manually later.")
        
        conn.commit()

if __name__ == "__main__":
    migrate()
