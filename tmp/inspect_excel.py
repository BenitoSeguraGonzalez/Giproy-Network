import pandas as pd
import json

file_path = r'e:\Repositorios\GiProy Network\tmp\Desagregacion Tecnologica.xlsx'

try:
    # Leer el excel
    xl = pd.ExcelFile(file_path)
    sheets_info = {}
    
    for sheet_name in xl.sheet_names:
        df = xl.parse(sheet_name).head(10) # Solo las primeras 10 filas
        sheets_info[sheet_name] = {
            "columns": df.columns.tolist(),
            "data": df.values.tolist()
        }
    
    print(json.dumps(sheets_info, indent=2, ensure_ascii=False))
except Exception as e:
    print(f"Error: {e}")
