import pandas as pd
import json

file_path = r"e:\Repositorios\GiProy Network\tmp\Formula Polinómica - con desglose de equipo.xlsx"

try:
    xl = pd.ExcelFile(file_path)
    sheet = "Desglose Equipo y Transporte"
    if sheet in xl.sheet_names:
        df = xl.parse(sheet)
        print(f"Sheet: {sheet}")
        print(df.head(30).to_string())
    else:
        print(f"Sheet {sheet} not found")
except Exception as e:
    print(f"Error: {e}")
