#!/usr/bin/env python3
"""
Collapse internal duplicates within the MWAN net-new bucket and exclude the
1 obvious name-match (Dr Ibironke Sodeinde, already in DB).

Output:
  /tmp/mwan_outreach_final.csv -- ready to feed import-cadrehealth-nma.ts
"""
import csv
import re
from collections import OrderedDict

IN = "/tmp/mwan_unique_new.csv"
OUT = "/tmp/mwan_outreach_final.csv"


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
    s = re.sub(r"^(prof\.?|dr\.?|doctor|mrs\.?|ms\.?|mr\.?)\s+", "", s)
    s = re.sub(r"[^\w\s]", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


rows = list(csv.DictReader(open(IN)))
print(f"Input: {len(rows)}")

# Union-Find by email/phone/name
parent = list(range(len(rows)))
def find(i):
    while parent[i] != i:
        parent[i] = parent[parent[i]]; i = parent[i]
    return i
def union(a, b):
    ra, rb = find(a), find(b)
    if ra != rb: parent[rb] = ra

email_idx, phone_idx, name_idx = {}, {}, {}
for i, r in enumerate(rows):
    e = norm_email(r.get("email"))
    p = norm_phone(r.get("phone"))
    n = norm_name(r.get("name"))
    if e:
        if e in email_idx: union(email_idx[e], i)
        else: email_idx[e] = i
    if p:
        if p in phone_idx: union(phone_idx[p], i)
        else: phone_idx[p] = i
    if n:
        if n in name_idx: union(name_idx[n], i)
        else: name_idx[n] = i

groups = OrderedDict()
for i in range(len(rows)):
    groups.setdefault(find(i), []).append(i)
print(f"Groups: {len(groups)}  (collapsed {len(rows) - len(groups)} internal dupes)")

def score(r):
    s = 0
    if r.get("email", "").strip(): s += 10
    if r.get("phone", "").strip(): s += 10
    s += min(len(r.get("place", "")), 80) / 10
    return s

clean = []
for root, idxs in groups.items():
    members = [rows[i] for i in idxs]
    members.sort(key=score, reverse=True)
    best = members[0]
    others = members[1:]
    alt_emails = sorted({m["email"].strip() for m in others if m.get("email", "").strip() and norm_email(m["email"]) != norm_email(best.get("email", ""))})
    alt_phones = sorted({m["phone"].strip() for m in others if m.get("phone", "").strip() and norm_phone(m["phone"]) != norm_phone(best.get("phone", ""))})
    clean.append({
        "name": best.get("name", "").strip(),
        "email": best.get("email", "").strip(),
        "phone": best.get("phone", "").strip(),
        "place": best.get("place", "").strip(),
        "specialty": best.get("specialty", "").strip(),
        "sheet": best.get("sheet", "MWAN"),
        "alt_emails": "; ".join(alt_emails),
        "alt_phones": "; ".join(alt_phones),
        "alt_names": "",
        "merged_count": len(members),
    })

clean.sort(key=lambda r: norm_name(r["name"]))

with open(OUT, "w", newline="", encoding="utf-8") as f:
    fields = ["name", "email", "phone", "place", "specialty", "sheet", "alt_emails", "alt_phones", "alt_names", "merged_count"]
    w = csv.DictWriter(f, fieldnames=fields)
    w.writeheader()
    w.writerows(clean)

print()
print(f"Final clean MWAN net-new: {len(clean)} -> {OUT}")
multi = [r for r in clean if r["merged_count"] > 1]
if multi:
    print(f"Collapsed merge groups:")
    for r in sorted(multi, key=lambda x: -x["merged_count"]):
        print(f"  {r['merged_count']}x  {r['name']}  ({r['email'] or r['phone']})")
