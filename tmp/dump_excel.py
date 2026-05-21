import pandas as pd
import json
import os

files = [
    r'e:\Repositorios\GiProy Network\tmp\Formula Polinómica - con desglose de equipo.xlsx',
    r'e:\Repositorios\GiProy Network\tmp\Formula Polinómica - sin desglose de equipo.xlsx'
]

results = {}

for f in files:
    if not os.path.exists(f):
        print(f"File not found: {f}")
        continue
    
    basename = os.path.basename(f)
    results[basename] = {}
    
    xl = pd.ExcelFile(f)
    for sheet_name in xl.sheet_names[:5]: # Primero 5 sheets para no saturar
        df = pd.read_excel(f, sheet_name=sheet_name, header=None).head(30)
        results[basename][sheet_name] = df.fillna("").values.tolist()

with open(r'e:\Repositorios\GiProy Network\tmp\excel_dump.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, indent=2, ensure_ascii=False)

print("Dump complete")
