#!/usr/bin/env python3
"""
De-duplicate /tmp/nma_unique_new.csv against itself.

Same doctor often appears in NMA multiple times with slight variations
(different email, "Prof" vs "Dr", trailing spaces, etc.). Collapse those.

Match priority for grouping a record into an existing bucket:
  1. normalized email (case-insensitive, trimmed)
  2. normalized phone (last 10 digits, requires >=9 digits to count)
  3. exact normalized full name

When multiple records collapse into one, pick the "best" representative:
  - prefer records with both email and phone present
  - prefer longer Place of Work
  - prefer non-generic specialty (anything other than "General Medical Practice")
  - prefer "Dr"/"Prof" prefix retained
Other emails/phones are kept in `alt_emails` / `alt_phones` columns so nothing is lost.
"""
import csv
import re
from collections import OrderedDict

IN = "/tmp/nma_unique_new.csv"
OUT = "/tmp/nma_net_new_clean.csv"
COLLAPSED = "/tmp/nma_net_new_collapsed.csv"


def norm_email(e):
    if not e:
        return ""
    return str(e).strip().lower().replace("\xa0", "").replace(" ", "")


def norm_phone(p):
    if not p:
        return ""
    d = re.sub(r"\D", "", str(p))
    if d.startswith("234"):
        d = d[3:]
    if d.startswith("0"):
        d = d[1:]
    if len(d) < 9:
        return ""
    return d[-10:]


def norm_name(n):
    if not n:
        return ""
    s = str(n).strip().lower()
    s = re.sub(r"^(prof\.?|dr\.?|doctor)\s+", "", s)
    s = re.sub(r"^(prof\.?|dr\.?|doctor)\s+", "", s)  # second pass for "Prof Dr ..."
    s = re.sub(r"[^\w\s]", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


rows = list(csv.DictReader(open(IN)))
print(f"Input: {len(rows)} rows")

# Union-Find for grouping
parent = list(range(len(rows)))


def find(i):
    while parent[i] != i:
        parent[i] = parent[parent[i]]
        i = parent[i]
    return i


def union(a, b):
    ra, rb = find(a), find(b)
    if ra != rb:
        parent[rb] = ra


# Build indexes
email_to_idx = {}
phone_to_idx = {}
name_to_idx = {}

for i, r in enumerate(rows):
    e = norm_email(r.get("email"))
    p = norm_phone(r.get("phone"))
    n = norm_name(r.get("name"))

    if e:
        if e in email_to_idx:
            union(email_to_idx[e], i)
        else:
            email_to_idx[e] = i
    if p:
        if p in phone_to_idx:
            union(phone_to_idx[p], i)
        else:
            phone_to_idx[p] = i
    if n:
        if n in name_to_idx:
            union(name_to_idx[n], i)
        else:
            name_to_idx[n] = i

# Collect groups
groups = OrderedDict()
for i in range(len(rows)):
    root = find(i)
    groups.setdefault(root, []).append(i)

print(f"Groups: {len(groups)}  (collapsed {len(rows) - len(groups)} duplicate rows)")


def score(r):
    """Higher = better representative."""
    s = 0
    if r.get("email", "").strip():
        s += 10
    if r.get("phone", "").strip():
        s += 10
    s += min(len(r.get("place", "")), 80) / 10
    spec = (r.get("specialty") or "").strip().lower()
    if spec and spec != "general medical practice":
        s += 5
    name = (r.get("name") or "").strip()
    if name.lower().startswith(("dr ", "prof ", "dr.", "prof.")):
        s += 2
    return s


clean_rows = []
collapsed_log = []

for root, idxs in groups.items():
    members = [rows[i] for i in idxs]
    members.sort(key=score, reverse=True)
    best = members[0]
    others = members[1:]

    alt_emails = sorted({m["email"].strip() for m in others if m.get("email", "").strip() and norm_email(m["email"]) != norm_email(best.get("email", ""))})
    alt_phones = sorted({m["phone"].strip() for m in others if m.get("phone", "").strip() and norm_phone(m["phone"]) != norm_phone(best.get("phone", ""))})
    alt_names = sorted({m["name"].strip() for m in others if m.get("name", "").strip() and norm_name(m["name"]) != norm_name(best.get("name", ""))})

    clean_rows.append({
        "name": best.get("name", "").strip(),
        "email": best.get("email", "").strip(),
        "phone": best.get("phone", "").strip(),
        "place": best.get("place", "").strip(),
        "specialty": best.get("specialty", "").strip(),
        "sheet": best.get("sheet", ""),
        "alt_emails": "; ".join(alt_emails),
        "alt_phones": "; ".join(alt_phones),
        "alt_names": "; ".join(alt_names),
        "merged_count": len(members),
    })

    if len(members) > 1:
        collapsed_log.append({
            "kept_name": best.get("name", ""),
            "kept_email": best.get("email", ""),
            "kept_phone": best.get("phone", ""),
            "merged_count": len(members),
            "all_names": " || ".join(m.get("name", "") for m in members),
            "all_emails": " || ".join(m.get("email", "") for m in members),
            "all_phones": " || ".join(m.get("phone", "") for m in members),
        })

# Sort output by name for easier review
clean_rows.sort(key=lambda r: norm_name(r["name"]))

with open(OUT, "w", newline="", encoding="utf-8") as f:
    fieldnames = ["name", "email", "phone", "place", "specialty", "sheet", "alt_emails", "alt_phones", "alt_names", "merged_count"]
    w = csv.DictWriter(f, fieldnames=fieldnames)
    w.writeheader()
    w.writerows(clean_rows)

with open(COLLAPSED, "w", newline="", encoding="utf-8") as f:
    fieldnames = ["kept_name", "kept_email", "kept_phone", "merged_count", "all_names", "all_emails", "all_phones"]
    w = csv.DictWriter(f, fieldnames=fieldnames)
    w.writeheader()
    w.writerows(collapsed_log)

print()
print(f"Clean net-new:   {len(clean_rows)}  -> {OUT}")
print(f"Collapsed log:   {len(collapsed_log)}  -> {COLLAPSED}")
print()
# Stats
multi = [r for r in clean_rows if r["merged_count"] > 1]
print(f"Rows that absorbed >=1 duplicate: {len(multi)}")
print(f"Largest merge groups:")
for r in sorted(multi, key=lambda x: -x["merged_count"])[:5]:
    print(f"  {r['merged_count']}x  {r['name']}  ({r['email'] or r['phone']})")
