import pandas as pd
import json

file_path = r'e:\Repositorios\GiProy Network\tmp\Desagregacion Tecnologica.xlsx'

try:
    df = pd.read_excel(file_path, sheet_name='Formulario 1', header=None).head(20)
    print(json.dumps(df.values.tolist(), indent=2, ensure_ascii=False))
except Exception as e:
    print(f"Error: {e}")
