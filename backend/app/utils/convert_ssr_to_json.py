import pandas as pd
import json
import os

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
DATA_DIR = os.path.join(BASE_DIR, "sample_data")

SSR_FILE = os.path.join(DATA_DIR, "SSR 2022-2023.xlsx")
OUT_FILE = os.path.join(DATA_DIR, "ssr_data.json")

df = pd.read_excel(SSR_FILE)

# Pick only needed columns
df = df[[
    "SSR Item\nNo.",
    "Description of the item",
    "Unit",
    "Completed\nRate for\n2022-23\nexcluding\nGST\nIn Rs."
]]

records = []

for _, row in df.iterrows():
    records.append({
        "ssr_item_no": str(row["SSR Item\nNo."]),
        "description": str(row["Description of the item"]).strip(),
        "unit": str(row["Unit"]).strip(),
        "rate": float(row["Completed\nRate for\n2022-23\nexcluding\nGST\nIn Rs."])
    })

with open(OUT_FILE, "w", encoding="utf-8") as f:
    json.dump(records, f, indent=2, ensure_ascii=False)

print(f"JSON saved: {OUT_FILE}")
