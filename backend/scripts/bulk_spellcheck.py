
import os
import sys
import unicodedata
from pathlib import Path

# Añadir el path raíz al PYTHONPATH
sys.path.append(os.getcwd())

from app.core.database import SessionLocal
from app.models.recurso import Recurso
from app.models.subcategoria_item import SubcategoriaItem
from app.core.utils import normalize_string, TECHNICAL_TERMS

def load_spanish_words():
    print("Cargando diccionario de español...")
    words = {}
    dict_path = Path("app/resources/diccionario_es.txt")
    if not dict_path.exists():
        print(f"ALERTA: No se encontró el diccionario en {dict_path}")
        return {}
    
    try:
        with open(dict_path, "r", encoding="utf-8") as f:
            for line in f:
                word = line.strip()
                if word:
                    # Guardamos normalized -> original mejor escrito
                    norm = normalize_string(word)
                    # Preferimos la versión que empiece con minúscula para que no fuerce capitalización
                    # a menos que sea un nombre propio (pero el diccionario suele tener minúsculas)
                    if norm not in words:
                        words[norm] = word
                    elif word[0].islower() and words[norm][0].isupper():
                        words[norm] = word
    except Exception as e:
        print(f"Error cargando diccionario: {e}")
    
    print(f"Diccionario cargado con {len(words)} entradas únicas normalizadas.")
    return words

def correct_phrase(text, spanish_dict):
    if not text: return text
    
    # Detectar si todo el texto está en mayúsculas (común en importaciones)
    is_all_caps = text.isupper()
    
    words = text.split()
    corrected_words = []
    
    for word in words:
        # Extraer signos de puntuación
        prefix = ""
        while word and word[0] in ".,;:()[]{}!¡?¿\"'":
            prefix += word[0]
            word = word[1:]
            
        suffix = ""
        while word and word[-1] in ".,;:()[]{}!¡?¿\"'":
            suffix = word[-1] + suffix
            word = word[:-1]
            
        if not word:
            corrected_words.append(prefix + suffix)
            continue
            
        norm = normalize_string(word)
        
        # 1. Prioridad: Diccionario Técnico (case insensitive)
        found = False
        if norm in TECHNICAL_TERMS:
            sug = TECHNICAL_TERMS[norm]
            found = True
        # 2. Diccionario General
        elif norm in spanish_dict:
            sug = spanish_dict[norm]
            found = True
            
        if found:
            # Mantener el estilo del original (ALL CAPS o Capitalized)
            if is_all_caps:
                word = sug.upper()
            elif word[0].isupper():
                word = sug[0].upper() + sug[1:]
            else:
                word = sug
        
        corrected_words.append(prefix + word + suffix)
        
    return " ".join(corrected_words)

def bulk_heal_spellcheck():
    db = SessionLocal()
    spanish_dict = load_spanish_words()
    
    try:
        # 1. Procesar Subcategorías
        subcats = db.query(SubcategoriaItem).filter(SubcategoriaItem.base_trabajo_id == 1).all()
        print(f"Procesando {len(subcats)} subcategorías...")
        sc_changes = 0
        for sc in subcats:
            old = sc.descripcion
            new = correct_phrase(old, spanish_dict)
            if old != new:
                sc.descripcion = new
                sc_changes += 1
        
        # 2. Procesar Recursos
        recursos = db.query(Recurso).filter(Recurso.subcategoria_item_id.in_([s.id for s in subcats])).all()
        print(f"Procesando {len(recursos)} recursos...")
        r_changes = 0
        for r in recursos:
            # Corregir descripción
            old_desc = r.descripcion
            new_desc = correct_phrase(old_desc, spanish_dict)
            if old_desc != new_desc:
                r.descripcion = new_desc
                r_changes += 1
                
            # Corregir especificaciones
            if r.especificaciones:
                old_esp = r.especificaciones
                new_esp = correct_phrase(old_esp, spanish_dict)
                if old_esp != new_esp:
                    r.especificaciones = new_esp
                    r_changes += 1
                    
        db.commit()
        print(f"ÉXITO: Se realizaron {sc_changes} cambios en subcategorías y {r_changes} en recursos/especificaciones.")
        
    except Exception as e:
        print(f"ERROR: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    bulk_heal_spellcheck()
