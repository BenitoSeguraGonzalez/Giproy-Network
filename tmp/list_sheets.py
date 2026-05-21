import pandas as pd
file_path = r'e:\Repositorios\GiProy Network\tmp\Desagregacion Tecnologica.xlsx'
try:
    xl = pd.ExcelFile(file_path)
    print(xl.sheet_names)
except Exception as e:
    print(f"Error: {e}")
