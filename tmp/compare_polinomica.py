import pandas as pd
import json

base_path = r"e:\Repositorios\GiProy Network\tmp"
files = [
    "Formula Polinómica - con desglose de equipo.xlsx",
    "Formula Polinómica - sin desglose de equipo.xlsx"
]

results = {}

for f in files:
    full_path = f"{base_path}\\{f}"
    try:
        xl = pd.ExcelFile(full_path)
        results[f] = {
            "sheets": xl.sheet_names
        }
        # Mirar la hoja de resumen o similar si existe
        if "RESUMEN" in xl.sheet_names:
            df = xl.parse("RESUMEN")
            results[f]["summary_sample"] = df.head(20).values.tolist()
    except Exception as e:
        results[f] = {"error": str(e)}

print(json.dumps(results, indent=2))
