def search_paises():
    file_path = "E:/Repositorios/GiProy Network/DBDump/giproynet.sql"
    try:
        with open(file_path, 'r', encoding='utf8', errors='ignore') as f:
            for i, line in enumerate(f):
                if "INSERT INTO" in line and "paises" in line.lower():
                    print(f"Línea {i+1}: {line[:200]}...")
                if "INSERT INTO" in line and "moneda" in line.lower():
                    print(f"Línea {i+1}: {line[:200]}...")
                if "ecuador" in line.lower() or "colombia" in line.lower() or "españa" in line.lower():
                    if "INSERT INTO" in line:
                        print(f"Línea {i+1} (Contenido): {line[:200]}...")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    search_paises()
