from functools import lru_cache
from pathlib import Path
from typing import Dict, List, Optional, Set

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.api import deps
from app.core.utils import TECHNICAL_TERMS, normalize_string
from app.models.usuario import Usuario

try:
    import language_tool_python
except Exception:  # pragma: no cover - optional runtime dependency fallback
    language_tool_python = None

router = APIRouter()


class SpellCheckRequest(BaseModel):
    text: str


class SpellCheckResponse(BaseModel):
    original: str
    corrected: str
    suggestions: List[str]
    has_errors: bool


TECHNICAL_DICTIONARY = list(TECHNICAL_TERMS.values())
EXTRAS = ["Andamio", "Mezcladora", "Seguridad", "Normativa", "APU"]
for item in EXTRAS:
    if item not in TECHNICAL_DICTIONARY:
        TECHNICAL_DICTIONARY.append(item)
TECHNICAL_NORMALIZED = {normalize_string(item) for item in TECHNICAL_DICTIONARY}

SPANISH_DICTIONARY: Set[str] = set()
NORMALIZED_SPANISH_DICTIONARY: Dict[str, str] = {}
NORMALIZED_BUCKETS: Dict[str, List[str]] = {}


def load_spanish_dictionary() -> None:
    global SPANISH_DICTIONARY, NORMALIZED_SPANISH_DICTIONARY, NORMALIZED_BUCKETS
    if SPANISH_DICTIONARY:
        return

    dict_path = Path(__file__).parent.parent.parent / "resources" / "diccionario_es.txt"
    if not dict_path.exists():
        return

    try:
        with open(dict_path, "r", encoding="utf-8") as handle:
            words = {line.strip() for line in handle if line.strip()}
        SPANISH_DICTIONARY = words
        normalized_dictionary: Dict[str, str] = {}
        normalized_buckets: Dict[str, List[str]] = {}
        for word in sorted(words):
            normalized = normalize_string(word)
            current = normalized_dictionary.get(normalized)
            if current is None or (len(word), word) < (len(current), current):
                normalized_dictionary[normalized] = word
            bucket_key = f"{normalized[:1]}:{len(normalized)}"
            normalized_buckets.setdefault(bucket_key, []).append(normalized)
        NORMALIZED_SPANISH_DICTIONARY = normalized_dictionary
        NORMALIZED_BUCKETS = normalized_buckets
    except Exception:
        SPANISH_DICTIONARY = set()
        NORMALIZED_SPANISH_DICTIONARY = {}
        NORMALIZED_BUCKETS = {}


def _restore_casing(original_word: str, replacement: str) -> str:
    if original_word.isupper():
        return replacement.upper()
    if original_word[:1].isupper():
        return replacement[:1].upper() + replacement[1:]
    return replacement


def _levenshtein_distance(a: str, b: str) -> int:
    if a == b:
        return 0
    if not a:
        return len(b)
    if not b:
        return len(a)

    previous_row = list(range(len(b) + 1))
    for i, char_a in enumerate(a, start=1):
        current_row = [i]
        for j, char_b in enumerate(b, start=1):
            insertions = previous_row[j] + 1
            deletions = current_row[j - 1] + 1
            substitutions = previous_row[j - 1] + (char_a != char_b)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row
    return previous_row[-1]


def _common_suffix_length(a: str, b: str) -> int:
    count = 0
    for char_a, char_b in zip(reversed(a), reversed(b)):
        if char_a != char_b:
            break
        count += 1
    return count


def _find_general_suggestion(clean_word: str) -> Optional[str]:
    normalized_word = normalize_string(clean_word)

    exact_normalized = NORMALIZED_SPANISH_DICTIONARY.get(normalized_word)
    if exact_normalized:
        return exact_normalized

    candidate_pool: List[str] = []
    first_char = normalized_word[:1]
    first_two = normalized_word[:2]
    word_length = len(normalized_word)
    for length in range(max(1, word_length - 2), word_length + 3):
        candidate_pool.extend(NORMALIZED_BUCKETS.get(f"{first_char}:{length}", []))

    if not candidate_pool and first_char:
        for bucket_key, bucket_words in NORMALIZED_BUCKETS.items():
            if bucket_key.startswith(f"{first_char}:"):
                candidate_pool.extend(bucket_words)

    if not candidate_pool:
        return None

    if first_two:
        candidate_pool = [candidate for candidate in candidate_pool if candidate.startswith(first_two)]
    if not candidate_pool or len(normalized_word) <= 5:
        return None

    ranked_candidates = []
    for candidate in candidate_pool:
        distance = _levenshtein_distance(normalized_word, candidate)
        length_gap = abs(len(candidate) - len(normalized_word))
        suffix_score = _common_suffix_length(normalized_word, candidate)
        ranked_candidates.append((distance, -suffix_score, -len(candidate), length_gap, candidate))

    ranked_candidates.sort()
    best_distance, _, _, _, best_candidate = ranked_candidates[0]
    max_distance = 1 if word_length <= 6 else 2
    if best_distance > max_distance:
        return None

    return NORMALIZED_SPANISH_DICTIONARY.get(best_candidate)


def _fallback_spellchecker(text: str) -> Dict:
    load_spanish_dictionary()
    words = text.split()
    corrected_words: List[str] = []
    all_suggestions: List[str] = []
    has_errors = False

    for word in words:
        clean_word = word.strip(".,;:()[]{}!¡?¿\"'")
        if not clean_word:
            corrected_words.append(word)
            continue

        normalized_word = normalize_string(clean_word)

        tech_matches = [candidate for candidate in TECHNICAL_DICTIONARY if normalize_string(candidate) == normalized_word]
        if tech_matches:
            best_match = tech_matches[0]
            if clean_word != best_match:
                has_errors = True
                corrected_words.append(word.replace(clean_word, best_match))
                all_suggestions.append(f"{clean_word} -> {best_match}")
            else:
                corrected_words.append(word)
            continue

        if clean_word in SPANISH_DICTIONARY:
            corrected_words.append(word)
            continue

        normalized_exact = NORMALIZED_SPANISH_DICTIONARY.get(normalized_word)
        if normalized_exact:
            suggested_word = _restore_casing(clean_word, normalized_exact)
            if clean_word.lower() == suggested_word.lower():
                corrected_words.append(word)
                continue
            if clean_word != suggested_word:
                has_errors = True
                corrected_words.append(word.replace(clean_word, suggested_word))
                all_suggestions.append(f"{clean_word} -> {suggested_word}")
            else:
                corrected_words.append(word)
            continue

        general_suggestion = _find_general_suggestion(clean_word)
        if general_suggestion:
            has_errors = True
            best_suggestion = _restore_casing(clean_word, general_suggestion)
            corrected_words.append(word.replace(clean_word, best_suggestion))
            all_suggestions.append(f"{clean_word} -> {best_suggestion}")
        else:
            corrected_words.append(word)
            if clean_word.isalpha() and len(normalized_word) > 5:
                has_errors = True
                all_suggestions.append(f"{clean_word} -> revisar manualmente")

    return {
        "original": text,
        "corrected": " ".join(corrected_words),
        "suggestions": all_suggestions,
        "has_errors": has_errors,
    }


@lru_cache(maxsize=1)
def _get_language_tool():
    if language_tool_python is None:
        raise RuntimeError("LanguageTool no está disponible en el entorno actual.")
    return language_tool_python.LanguageTool("es")


def _word_distance_limit(length: int) -> int:
    if length <= 4:
        return 1
    if length <= 8:
        return 2
    return 3


def _is_safe_replacement(original: str, replacement: str) -> bool:
    original_clean = original.strip()
    replacement_clean = replacement.strip()
    if not original_clean or not replacement_clean:
        return False
    if " " in original_clean or " " in replacement_clean:
        return False

    normalized_original = normalize_string(original_clean)
    normalized_replacement = normalize_string(replacement_clean)
    if not normalized_original or not normalized_replacement:
        return False

    if normalized_original == normalized_replacement:
        return True

    distance = _levenshtein_distance(normalized_original, normalized_replacement)
    return distance <= _word_distance_limit(len(normalized_original))


def _format_suggestion(original: str, replacement: Optional[str]) -> str:
    if replacement:
        return f"{original} -> {replacement}"
    return f"{original} -> revisar manualmente"


def _run_language_tool_spellchecker(text: str) -> Dict:
    tool = _get_language_tool()
    matches = sorted(tool.check(text), key=lambda match: match.offset)
    if not matches:
        return {
            "original": text,
            "corrected": text,
            "suggestions": [],
            "has_errors": False,
        }

    corrected_parts: List[str] = []
    suggestions: List[str] = []
    cursor = 0
    has_errors = False

    for match in matches:
        start = match.offset
        end = match.offset + match.errorLength
        if start < cursor:
            continue

        fragment = text[start:end]
        normalized_fragment = normalize_string(fragment)
        if normalized_fragment in TECHNICAL_NORMALIZED:
            corrected_parts.append(text[cursor:end])
            cursor = end
            continue

        replacements = [replacement for replacement in match.replacements if replacement]
        best_replacement = replacements[0] if replacements else None
        issue_type = (match.ruleIssueType or "").lower()
        auto_apply = (
            issue_type in {"misspelling", "typographical"}
            and best_replacement is not None
            and _is_safe_replacement(fragment, best_replacement)
        )

        corrected_parts.append(text[cursor:start])
        if auto_apply:
            replacement = _restore_casing(fragment, best_replacement)
            corrected_parts.append(replacement)
            suggestions.append(_format_suggestion(fragment, replacement))
        else:
            corrected_parts.append(fragment)
            suggestions.append(_format_suggestion(fragment, None))

        cursor = end
        has_errors = True

    corrected_parts.append(text[cursor:])
    corrected = "".join(corrected_parts)

    return {
        "original": text,
        "corrected": corrected,
        "suggestions": suggestions,
        "has_errors": has_errors,
    }


def professional_spellchecker(text: str) -> Dict:
    try:
        return _run_language_tool_spellchecker(text)
    except Exception:
        return _fallback_spellchecker(text)


@router.post("/spellcheck", response_model=SpellCheckResponse)
def spellcheck_text(
    req: SpellCheckRequest,
    current_user: Usuario = Depends(deps.get_current_active_user)
):
    """
    Servicio de corrección ortográfica asistida para castellano técnico.
    """
    result = professional_spellchecker(req.text)
    return result
