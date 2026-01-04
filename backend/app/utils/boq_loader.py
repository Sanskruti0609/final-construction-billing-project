from pathlib import Path
from functools import lru_cache
import json

BASE_DIR = Path(__file__).resolve().parent.parent
BOQ_JSON_PATH = BASE_DIR / "sample_data" / "BOQ.json"


def _normalize(text: str) -> str:
    if not text:
        return ""
    # collapse whitespace and lowercase
    return " ".join(str(text).split()).strip().lower()


@lru_cache(maxsize=1)
def _load_boq_data():
    """
    Load BOQ.json once and cache it.
    Expected: list of dict rows with keys like:
      - "BOQ_Item_No." or "BOQ Item No"
      - "Description of Work"
    """
    try:
        with open(BOQ_JSON_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []

    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        rows = data.get("rows") or data.get("data") or []
        if isinstance(rows, list):
            return rows
    return []


def fetch_boq_item_no(description: str) -> str | None:
    """
    Given an item description, try to find a match in BOQ.json and return the BOQ item no.
    Match rule: normalized exact string match on "Description of Work".
    """
    target = _normalize(description)
    if not target:
        return None

    for row in _load_boq_data():
        desc = (
            row.get("Description of Work")
            or row.get("Description_of_Work")
            or row.get("Description")
            or ""
        )
        if _normalize(desc) == target:
            return (
                row.get("BOQ_Item_No.")
                or row.get("BOQ Item No")
                or row.get("BOQ_Item_No")
            )

    return None
