import pandas as pd
import json
import os

file_path = r'e:\Repositorios\GiProy Network\tmp\Formula Polinómica - con desglose de equipo.xlsx'
target_sheets = ['Agrupación de Recursos', 'Indices y Coeficientes', 'Cuadrilla Tipo', 'Resumen']

results = {}

if os.path.exists(file_path):
    xl = pd.ExcelFile(file_path)
    for s in target_sheets:
        if s in xl.sheet_names:
            df = pd.read_excel(file_path, sheet_name=s, header=None).head(50)
            results[s] = df.fillna('').values.tolist()

with open(r'e:\Repositorios\GiProy Network\tmp\polinomica_logic.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, indent=2, ensure_ascii=False)

print("Inspection complete")
