# app/utils/ssr_loader.py

import os
import json
from functools import lru_cache
from difflib import SequenceMatcher

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
DATA_DIR = os.path.join(BASE_DIR, "sample_data")

# SSR + BOQ JSON paths
SSR_JSON = os.path.join(DATA_DIR, "ssr_data.json")
BOQ_JSON = os.path.join(DATA_DIR, "BOQ.json")


def _normalise(text: str) -> str:
  """
  Normalise for matching:

  - convert to string
  - lowercase
  - replace newlines/tabs with spaces
  - collapse multiple spaces to one

  So Excel multiline and JSON with \\n become equivalent.
  """
  if text is None:
      return ""
  # replace all whitespace (spaces, newlines, tabs) with single spaces
  return " ".join(str(text).lower().split())


@lru_cache(maxsize=1)
def _load_ssr_data():
  """
  Load SSR data from JSON once and precompute a normalised field.

  Each JSON record should look like (new structure):
    {
      "ssr_item_no": "...",
      "reference_no": "...",
      "description": "...",
      "additional_specification": "...",
      "unit": "...",
      "rate": 123.45
    }
  """
  if not os.path.exists(SSR_JSON):
      raise FileNotFoundError(f"SSR JSON file not found: {SSR_JSON}")

  with open(SSR_JSON, "r", encoding="utf-8") as f:
      raw = json.load(f)

  data = []
  for item in raw:
      desc = item.get("description", "")
      add_spec = item.get("additional_specification", "")

      # robust rate parsing
      rate_raw = item.get("rate", 0) or 0
      try:
          rate_val = float(rate_raw)
      except (TypeError, ValueError):
          rate_val = 0.0

      data.append(
          {
              "ssr_item_no": str(item.get("ssr_item_no", "")).strip(),
              "reference_no": str(item.get("reference_no", "")).strip(),
              "description": desc,
              "additional_specification": add_spec,
              "unit": str(item.get("unit", "")).strip(),
              "rate": rate_val,
              "_norm": _normalise(desc),
              "_norm_add_spec": _normalise(add_spec),
          }
      )

  print(f"Loaded {len(data)} SSR records from JSON.")
  return data


@lru_cache(maxsize=1)
def _load_boq_data():
  """
  Load BOQ data from JSON once and precompute normalised fields.

  BOQ.json records should have:
    {
      "BOQ_Item_No.": "...",
      "Description of Work": "...",
      "Quantity": ...,
      "BOQ_Reference_Page No": "..."
    }
  """
  if not os.path.exists(BOQ_JSON):
      # If BOQ doesn't exist, we simply won't attach a BOQ item no.
      print(f"BOQ JSON file not found: {BOQ_JSON}")
      return []

  with open(BOQ_JSON, "r", encoding="utf-8") as f:
      raw = json.load(f)

  data = []
  for item in raw:
      desc = item.get("Description of Work", "")
      ref_page = item.get("BOQ_Reference_Page No", "")

      data.append(
          {
              "boq_item_no": str(item.get("BOQ_Item_No.", "")).strip(),
              "description": desc,
              "quantity": item.get("Quantity", None),
              "boq_ref_page": ref_page,
              "_norm_desc": _normalise(desc),
              "_norm_ref_page": _normalise(ref_page),
          }
      )

  print(f"Loaded {len(data)} BOQ records from JSON.")
  return data


def fetch_ssr_rate(description: str, quantity: float = 1.0):
  """
  Look up SSR rate by description using JSON data.

  Strategy (SSR behaviour is EXACTLY your old logic):

  1) Normalise user description.
  2) EXACT normalised match (and rate > 0) → use that.
  3) If not found, FUZZY match with a SAFE THRESHOLD:
       - compute similarity on normalised text
       - if best_score >= 0.80 and rate > 0 → use it
       - else → treat as NOT FOUND → return None.
  4) For SSR ITEM (match found):
       - compute base_rate, gst_rate, final_rate, total_amount
       - THEN try to find BOQ item number by:
           a) same normalised description in BOQ
           b) if multiple BOQ rows:
               compare SSR.additional_specification (normalised)
               with BOQ_Reference_Page No (normalised)
               if equal → pick that BOQ item
               else → fall back to first BOQ candidate.
  5) If nothing acceptable is found → return None (NON SSR handled by caller).
  """
  ssr_data = _load_ssr_data()
  boq_data = _load_boq_data()
  query = _normalise(description)

  if not query:
      return None

  # 1) Exact match on normalised text, only with valid rate
  exact_matches = [
      item for item in ssr_data if item["_norm"] == query and item["rate"] > 0
  ]

  if exact_matches:
      best = exact_matches[0]
      # print("EXACT SSR MATCH:", best["ssr_item_no"])
  else:
      # 2) Fuzzy match with threshold, only on items with a valid rate
      best = None
      best_score = 0.0

      for item in ssr_data:
          if item["rate"] <= 0:
              continue
          s = SequenceMatcher(None, item["_norm"], query).ratio()
          if s > best_score:
              best_score = s
              best = item

      # Threshold – if too low, treat as NOT FOUND
      if best is None or best_score < 0.80:
          # print("NO GOOD SSR MATCH, best_score:", best_score)
          return None

      print(
          f"FUZZY MATCH USED (JSON, score={best_score:.3f}): "
          f"{best['_norm'][:80]} ..."
      )

  base = best["rate"]
  if base <= 0:
      # safety: if somehow rate is 0, consider as not usable
      return None

  # ---- compute SSR amounts (same as before) ----
  gst = round(base * 0.05, 2)
  final = round(base + gst, 2)
  total = round(final * (quantity or 0.0), 2)

  # ---- NEW PART: find BOQ item number using description + extra columns ----
  boq_item_no = ""

  if boq_data:
      # a) Match by same normalised description
      norm_ssr_desc = best["_norm"]
      boq_candidates = [b for b in boq_data if b["_norm_desc"] == norm_ssr_desc]

      if boq_candidates:
          if len(boq_candidates) == 1:
              # single BOQ row with same description
              boq_item_no = boq_candidates[0]["boq_item_no"]
          else:
              # multiple BOQ rows with same description
              # use SSR.additional_specification vs BOQ_Reference_Page No
              ssr_norm_add = best.get("_norm_add_spec", "")

              if ssr_norm_add:
                  matched = None
                  for b in boq_candidates:
                      if b["_norm_ref_page"] == ssr_norm_add:
                          matched = b
                          break

                  if matched:
                      boq_item_no = matched["boq_item_no"]
                  else:
                      # no exact match on extra columns → fall back to first
                      boq_item_no = boq_candidates[0]["boq_item_no"]
              else:
                  # no additional_specification in SSR → just use first candidate
                  boq_item_no = boq_candidates[0]["boq_item_no"]

  # ---- return payload (same SSR fields + extra BOQ item no) ----
  return {
      "ssr_item_no": best["ssr_item_no"],
      "unit": best["unit"],
      "base_rate": base,
      "gst_rate": gst,
      "final_rate": final,
      "total_amount": total,
      "boq_item_no": boq_item_no,  # may be "" if not found / no BOQ
      "non_ssr": False,            # still an SSR item; NON SSR = handled by None
  }
