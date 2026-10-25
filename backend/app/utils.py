import unicodedata


def normalizar(t: str) -> str:
    """Minúsculas y sin tildes, para comparar competencias."""
    t = unicodedata.normalize("NFD", (t or "").lower())
    return "".join(c for c in t if unicodedata.category(c) != "Mn").strip()
