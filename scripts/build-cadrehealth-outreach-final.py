#!/usr/bin/env python3
"""
Build final CadreHealth outreach list:
  - Start with /tmp/nma_net_new_clean.csv (6,051 net-new after internal dedupe)
  - Add back the 11 name-matches judged "likely different people"
  - Drop the 24 name-matches judged "same person" or "likely same person"
  - Park the 6 uncertain name-matches in a separate review file

Output:
  /tmp/cadrehealth_outreach_final.csv  — ready to import
  /tmp/cadrehealth_outreach_review.csv — 6 uncertain name-matches needing human call
"""
import csv

CLEAN_IN = "/tmp/nma_net_new_clean.csv"
NAME_MATCH_IN = "/tmp/nma_duplicates_name.csv"
FINAL_OUT = "/tmp/cadrehealth_outreach_final.csv"
REVIEW_OUT = "/tmp/cadrehealth_outreach_review.csv"

# Triage decisions keyed by 1-based row index in the original
# /tmp/nma_duplicates_name.csv (41 rows total)
LIKELY_DIFFERENT = {1, 4, 6, 7, 9, 23, 28, 32, 37, 39, 41}
UNCERTAIN = {13, 15, 18, 21, 36, 38}
# Everything else (1..41 minus the above) = same/likely-same -> drop

assert not (LIKELY_DIFFERENT & UNCERTAIN), "overlap in triage sets"

name_match_rows = list(csv.DictReader(open(NAME_MATCH_IN)))
assert len(name_match_rows) == 41, f"expected 41 name-match rows, got {len(name_match_rows)}"

likely_different_rows = [name_match_rows[i - 1] for i in sorted(LIKELY_DIFFERENT)]
uncertain_rows = [name_match_rows[i - 1] for i in sorted(UNCERTAIN)]

# Final = clean net-new + likely-different
clean_rows = list(csv.DictReader(open(CLEAN_IN)))
print(f"Clean net-new (pre-add): {len(clean_rows)}")
print(f"Adding likely-different:  {len(likely_different_rows)}")

# Normalize likely-different rows into the clean-file schema
clean_fields = ["name", "email", "phone", "place", "specialty", "sheet",
                "alt_emails", "alt_phones", "alt_names", "merged_count"]

for r in likely_different_rows:
    clean_rows.append({
        "name": (r.get("new_name") or "").strip(),
        "email": (r.get("new_email") or "").strip(),
        "phone": (r.get("new_phone") or "").strip(),
        "place": (r.get("new_place") or "").strip(),
        "specialty": (r.get("new_specialty") or "").strip(),
        "sheet": r.get("new_sheet") or "",
        "alt_emails": "",
        "alt_phones": "",
        "alt_names": "",
        "merged_count": 1,
    })

print(f"Final total:              {len(clean_rows)}")

with open(FINAL_OUT, "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=clean_fields)
    w.writeheader()
    w.writerows(clean_rows)

with open(REVIEW_OUT, "w", newline="", encoding="utf-8") as f:
    fieldnames = list(uncertain_rows[0].keys()) if uncertain_rows else []
    if fieldnames:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(uncertain_rows)

print()
print(f"Outreach-ready: {FINAL_OUT}  ({len(clean_rows)} rows)")
print(f"Needs review:   {REVIEW_OUT}  ({len(uncertain_rows)} rows)")
