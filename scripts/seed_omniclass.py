import openpyxl
import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv(dotenv_path='e:/Repositorios/GiProy Network/backend/.env')

DATABASE_URL = f"postgresql://{os.getenv('POSTGRES_USER')}:{os.getenv('POSTGRES_PASSWORD')}@{os.getenv('POSTGRES_SERVER')}:{os.getenv('POSTGRES_PORT')}/{os.getenv('POSTGRES_DB')}"

# Diccionario de traducción heurística (Términos comunes AEC)
TRANSLATIONS = {
    # Nombres de Tablas
    "Work Results": "Resultados del Trabajo",
    "Elements": "Elementos",
    "Products": "Productos",
    "Organizational Roles": "Roles Organizacionales",
    
    # Categorías Nivel 1 & 2 (Tabla 22)
    "General Requirements": "Requisitos Generales",
    "Existing Conditions": "Condiciones Existentes",
    "Concrete": "Hormigón / Concreto",
    "Masonry": "Albañilería / Mampostería",
    "Metals": "Metales",
    "Wood, Plastics, and Composites": "Madera, Plásticos y Compuestos",
    "Thermal and Moisture Protection": "Protección Térmica y frente a la Humedad",
    "Openings": "Aberturas / Huecos",
    "Finishes": "Acabados / Revestimientos",
    "Specialties": "Especialidades",
    "Equipment": "Equipos",
    "Furnishings": "Mobiliario",
    "Special Construction": "Construcción Especial",
    "Conveying Equipment": "Equipos de Transporte",
    "Fire Suppression": "Supresión de Incendios",
    "Plumbing": "Fontanería / Plomería",
    "HVAC": "HVAC (Calefacción, Ventilación y Aire Acondicionado)",
    "Integrated Automation": "Automatización Integrada",
    "Electrical": "Electricidad",
    "Communications": "Comunicaciones",
    "Electronic Safety and Security": "Seguridad Electrónica",
    "Earthwork": "Movimiento de Tierras",
    "Exterior Improvements": "Mejoras Exteriores",
    "Utilities": "Servicios Públicos / Instalaciones",
    "Transportation": "Transporte / Vialidad",
    "Waterway and Marine Construction": "Construcción Marítima y Fluvial",
    "Process Integration": "Integración de Procesos",
    "Material Processing and Handling Equipment": "Equipos de Procesamiento y Manejo de Materiales",
    "Process Heating, Cooling, and Drying Equipment": "Equipos de Proceso de Calor, Frío y Secado",
    "Process Gas and Liquid Handling, Purification and Storage Equipment": "Equipos de Manejo, Purificación y Almacenamiento de Gases y Líquidos",
    "Pollution and Waste Control Equipment": "Equipos de Control de Contaminación y Residuos",
    "Industry-Specific Manufacturing Equipment": "Equipos de Fabricación Específicos de la Industria",
    "Electrical Power Generation": "Generación de Energía Eléctrica",
    
    # Términos técnicos recurrentes
    "Excavation": "Excavación",
    "Backfill": "Relleno",
    "Foundations": "Cimentaciones / Fundaciones",
    "Slabs": "Losas",
    "Walls": "Muros / Paredes",
    "Roofing": "Cubiertas / Techos",
    "Flooring": "Pisos / Pavimentos",
    "Painting": "Pintura",
    "Structural": "Estructural",
    "Reinforcement": "Refuerzo",
    "Maintenance": "Mantenimiento",
    "Demolition": "Demolición",
    "Installation": "Instalación",
    "Formwork": "Encofrado",
    "Precast": "Prefabricado",
    "Cast-in-Place": "Vaceado in situ",
    "Aggregates": "Agregados / Áridos",
    "Cement": "Cemento",
    "Steel": "Acero",
    "Aluminum": "Aluminio",
    "Timber": "Madera técnica",
    "Doors": "Puertas",
    "Windows": "Ventanas",
    "Hardware": "Herrajes",
    "Ceilings": "Cielos Rasos / Tumbados",
    "Valves": "Válvulas",
    "Pipes": "Tuberías",
    "Cables": "Cables / Conductores",
    "Pumps": "Bombas",
    "Tanks": "Tanques",
    "Sensors": "Sensores",
    "Alarms": "Alarmas",
    "Bridges": "Puentes",
    "Railroads": "Ferrocarriles",
    "Underground": "Subterráneo",
    "Earth": "Tierra",
    "Soil": "Suelo",
    "Rock": "Roca",
    "Water": "Agua",
    "Gas": "Gas",
    "Sewer": "Alcantarillado",
    "Power": "Energía / Potencia",
    "Lighting": "Iluminación"
}

def translate_best_effort(text):
    if not text: return ""
    # Si ya está en el diccionario directo
    if text in TRANSLATIONS:
        return TRANSLATIONS[text]
    
    # Intento de traducción por palabras (fragmentos)
    words = text.split()
    translated_words = []
    for word in words:
        clean_word = word.strip(",().").capitalize()
        if clean_word in TRANSLATIONS:
            translated_words.append(TRANSLATIONS[clean_word])
        else:
            # Mantener original si no hay traducción
            translated_words.append(word)
    
    return " ".join(translated_words)

def seed_table(sheet_name, tabla_id, wb, session):
    print(f"Procesando {sheet_name}...")
    sheet = wb[sheet_name]
    count = 0
    total_rows = sheet.max_row
    
    # Limpiar tabla previa si es necesario (opcional)
    # session.execute(text(f"DELETE FROM omniclass_maestro WHERE tabla = '{tabla_id}'"))
    
    # Mapeo de padres para reconstruir jerarquía (opcional, el modelo tiene parent_id)
    # parent_map = {} # codigo -> db_id
    
    for row_idx in range(8, total_rows + 1):
        codigo = sheet.cell(row=row_idx, column=1).value
        titulo_en = sheet.cell(row=row_idx, column=2).value
        nivel = sheet.cell(row=row_idx, column=3).value
        
        if not codigo or not titulo_en:
            continue
            
        titulo_es = translate_best_effort(titulo_en)
        
        # Insertar usando SQL directo por velocidad en bulk
        try:
            session.execute(
                text("""
                    INSERT INTO omniclass_maestro (tabla, codigo, titulo, nivel)
                    VALUES (:tabla, :codigo, :titulo, :nivel)
                    ON CONFLICT (tabla, codigo) DO UPDATE 
                    SET titulo = EXCLUDED.titulo, nivel = EXCLUDED.nivel
                """),
                {
                    "tabla": tabla_id,
                    "codigo": str(codigo),
                    "titulo": titulo_es,
                    "nivel": int(nivel) if nivel else 1
                }
            )
            count += 1
            if count % 500 == 0:
                print(f"  {count} registros insertados...")
                session.commit()
        except Exception as e:
            print(f"Error en fila {row_idx}: {e}")
            session.rollback()

    session.commit()
    print(f"Finalizado {sheet_name}: {count} registros.")

def main():
    try:
        engine = create_engine(DATABASE_URL)
        Session = sessionmaker(bind=engine)
        session = Session()
        
        excel_path = 'e:/Repositorios/GiProy Network/tmp/omniclass.xlsx'
        wb = openpyxl.load_workbook(excel_path, data_only=True)
        
        # Mapeo de hojas a IDs de tabla
        mapeo = [
            ('OmniClass Table 21', '21'),
            ('OmniClass Table 22', '22'),
            ('OmniClass Table 23', '23'),
            ('OmniClass Table 34', '34')
        ]
        
        for sheet_name, tabla_id in mapeo:
            if sheet_name in wb.sheetnames:
                seed_table(sheet_name, tabla_id, wb, session)
            else:
                print(f"Hoja {sheet_name} no encontrada.")
                
        session.close()
        print("Carga de OmniClass completada con éxito.")
        
    except Exception as e:
        print(f"Error general: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
