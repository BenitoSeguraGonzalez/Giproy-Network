import re
from collections import Counter

def analyze_inserts():
    file_path = "E:/Repositorios/GiProy Network/DBDump/giproynet.sql"
    insert_pattern = re.compile(r"INSERT INTO\s+`?(\w+)`?", re.IGNORECASE)
    table_counts = Counter()
    
    try:
        with open(file_path, 'r', encoding='utf8', errors='ignore') as f:
            for line in f:
                match = insert_pattern.search(line)
                if match:
                    table_counts[match.group(1).lower()] += 1
        
        print("\nTablas con inserciones encontradas:")
        for table, count in table_counts.most_common():
            print(f" - {table}: {count} inserciones")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    analyze_inserts()
