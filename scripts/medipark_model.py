"""Check the medipark model arithmetic before it goes into the PDF."""

# ---------------- ROOM ALLOCATION ----------------
ground = {
    "Theatre suite (theatre 24.7, recovery 13.0, sterile/dirty 7.8)": 45.5,
    "Conversion clinic, two consulting rooms": 37.5,
    "Digital X-ray": 14.1,
    "Phlebotomy draw point": 10.4,
    "Medication collection point": 6.0,
    "Reception, waiting, concierge": 58.1,
    "Patient WCs": 10.4,
}
first = {
    "Consulting 1, 2, 3 (sessional panel)": 51.6,
    "Consulting 4 + treatment room (aesthetics)": 19.8 + 14.8,
    "Consulting 5, four infusion bays (longevity)": 19.8,
    "Consulting 6 (family practice)": 22.4,
    "Hair transplant suite": 24.3,
    "Ultrasound and echocardiography": 13.7,
    "Phlebotomy draw point": 5.7,
    "Doctors' and members' lounge": 34.0,
    "Sterilising, linen, WC, terrace": 32.6,
}
print("ground", round(sum(ground.values()), 1), "vs 182")
print("first ", round(sum(first.values()), 1), "vs 239")
print("chalet 61 (laboratory), BQ 37 (pharmacy)")
print("campus rooms", round(sum(ground.values()) + sum(first.values()) + 61 + 37, 1), "vs 519")
print()

# ---------------- BUSINESS UNITS (stabilised, NGN M) ----------------
units = {}

units["Medlyfe Aesthetics and Regenerative"] = dict(
    owner=0.51,
    rev=[("Consultations, 60k x 900", 54), ("Injectables, 320k x 480", 154),
         ("Skin and laser, 150k x 560", 84), ("Regenerative and boosters, 280k x 240", 67),
         ("Day case in the campus theatre, 2.2M x 42", 92), ("Retail", 24)],
    cost=[("Cost of care, 30%", 143), ("Clinical team", 78), ("Theatre hire to the campus", 24),
          ("Facility and services to the campus", 72), ("Marketing, 6%", 29),
          ("Insurance, indemnity, service contracts", 22), ("Admin, software, clinical waste", 10)],
)
units["Lyfe Place Hair Restoration"] = dict(
    owner=1.0,
    rev=[("125 cases at 1.8M", 225)],
    cost=[("Surgeon case fee, 25%", 56), ("Technicians and nurse", 24),
          ("Grafts, punches, consumables, 250k a case", 31),
          ("Facility and services to the campus", 34), ("Marketing, 8%", 18), ("Admin and waste", 6)],
)
units["Medlyfe Longevity and Infusion"] = dict(
    owner=1.0,
    rev=[("Infusion therapy, 120k x 900", 108), ("Longevity programmes, 1.2M x 60", 72),
         ("Metabolic and weight management, 250k x 240", 60)],
    cost=[("Consumables and infusates, 35%", 84), ("Physician, 0.5 FTE", 18),
          ("Two infusion nurses", 19), ("Facility and services to the campus", 30),
          ("Marketing, 5%", 12), ("Admin and waste", 6)],
)
units["Medbury Family Practice"] = dict(
    owner=1.0,
    rev=[("150 members, blended 850k", 128)],
    cost=[("1.5 family physicians", 36), ("Practice nurse", 9), ("Administration", 6),
          ("Facility and services to the campus", 34), ("Marketing", 8),
          ("Screening and consumables", 10)],
)
units["Medbury Diagnostics"] = dict(
    owner=1.0,
    rev=[("Conversion clinic", 33), ("Longevity panels", 30), ("Family practice screens", 20),
         ("Aesthetics and panel", 26), ("Walk-in and corporate", 36)],
    cost=[("Reagents and consumables, 32%", 46), ("Scientists and radiographer", 34),
          ("Equipment service and QC", 8)],
)
units["Medbury Pharmaceuticals"] = dict(
    owner=1.0,
    rev=[("Dispensing to all units, GLP-1, aesthetic product retail", 120)],
    cost=[("Cost of goods, 72%", 86), ("Pharmacist and technician", 14)],
)

for name, u in units.items():
    r = sum(v for _, v in u["rev"])
    c = sum(v for _, v in u["cost"])
    u["r"], u["c"], u["e"] = r, c, r - c
    u["to_medbury"] = (r - c) * u["owner"]
    print(f"{name:38s} rev {r:6.0f} cost {c:6.0f} EBITDA {r-c:5.0f} "
          f"({(r-c)/r*100:4.1f}%)  to Medbury {u['to_medbury']:5.0f}")
print()

# ---------------- THE CAMPUS ----------------
facility_charges = 72 + 34 + 30 + 34            # aesthetics, hair, longevity, family practice
campus_rev = [("Facility and services charges from the four Medbury businesses", facility_charges),
              ("Conversion Clinic SPV, blended annual licence", 132),
              ("Theatre hire, aesthetics 24 and external lists 90", 114),
              ("Sessional lettings, membership and panel fees", 142)]
campus_cost = [("Head rent", 55), ("Power", 28), ("Front office, nursing pool, records", 45),
               ("Theatre running: scrub, ODP, consumables", 18),
               ("Security, cleaning, waste, insurance, internet", 15),
               ("Maintenance, biomedical, campus marketing, concierge", 16),
               ("Mezo management fee", 48), ("Amortisation over ten years", 39)]
CR = sum(v for _, v in campus_rev)
CC = sum(v for _, v in campus_cost)
print(f"campus rev {CR}  cost {CC}  contribution {CR-CC}")
print(f"  Mezo fee as % of campus revenue: {48/CR*100:.1f}%")
print()

# ---------------- CONSOLIDATION ----------------
internal = facility_charges + 24                 # facility charges + aesthetics theatre hire
gross = sum(u["r"] for u in units.values()) + CR
external = gross - internal
to_medbury = sum(u["to_medbury"] for u in units.values()) + (CR - CC) + 25   # +25 host & brand fee
print(f"gross of all lines {gross}  less internal {internal}  = campus-wide revenue {external}")
print(f"TO MEDBURY {to_medbury:.0f} a year  =  {to_medbury/12:.1f} a month")
print(f"  as a share of campus-wide revenue: {to_medbury/external*100:.0f}%")
print(f"  consolidated cost {external - to_medbury:.0f}")
print(f"  vs the landlord model's 273  =  {to_medbury/273:.1f}x")
print()

# ---------------- CAPITAL ----------------
cap = [("Head rent, two years in advance  (PAID)", 100, 100),
       ("Agency, legal and caution deposit  (PAID)", 15, 15),
       ("Building fit-out", 232, 162),
       ("Theatre suite", 120, 84),
       ("Power, 25KVA hybrid solar", 33, 33),
       ("Medbury Diagnostics unit", 28, 20),
       ("Medbury Pharmaceuticals unit", 24, 17),
       ("Aesthetics unit: equipment and clinical fit-out", 55, 43),
       ("Hair restoration suite", 35, 27),
       ("Longevity and infusion bays", 18, 14),
       ("Opening inventory across the units", 22, 22),
       ("Working capital", 95, 95)]
paid = sum(a for n, a, b in cap if "PAID" in n)
deploy_c = sum(a for n, a, b in cap if "PAID" not in n)
deploy_r = sum(b for n, a, b in cap if "PAID" not in n)
print(f"paid {paid}   still to deploy: as costed {deploy_c}, reduced {deploy_r}")
print(f"total capital: as costed {paid+deploy_c}, reduced {paid+deploy_r}")
print(f"payback from stabilisation on capital to deploy: "
      f"{deploy_c/to_medbury:.2f} yrs / {deploy_r/to_medbury:.2f} yrs")
print(f"payback from stabilisation on total capital:     "
      f"{(paid+deploy_c)/to_medbury:.2f} yrs / {(paid+deploy_r)/to_medbury:.2f} yrs")
print()

# ---------------- RAMP AND CUMULATIVE CASH ----------------
cash_stab = to_medbury + 39                      # add back amortisation
var_share = 0.55
cash_cost = (external - to_medbury) - 39
var, fixed = cash_cost * var_share, cash_cost * (1 - var_share)
print(f"stabilised cash to Medbury {cash_stab:.0f}; cash costs {cash_cost:.0f} "
      f"(variable {var:.0f}, fixed {fixed:.0f})")

ramp = [0.30, 0.50, 0.68, 0.82, 0.92, 1.00, 1.00, 1.00, 1.00, 1.00]
cum, rows = -30.0, []                            # pre-opening 30
for i, p in enumerate(ramp, 1):
    rv, vc, fc = external * p / 4, var * p / 4, fixed / 4
    net = rv - vc - fc
    cum += net
    rows.append((i, p, rv, net, cum))
    if i <= 8:
        print(f"  Q{i} ramp {p:4.0%} rev {rv:6.1f} net {net:7.1f} cum {cum:8.1f}")

def crossing(target):
    prev = -30.0
    for i, p, rv, net, cum in rows:
        if cum >= target:
            frac = (target - prev) / net
            return (i - 1) * 3 + frac * 3
        prev = cum
    return None

for label, t in [("capital to deploy, as costed", deploy_c),
                 ("capital to deploy, reduced", deploy_r),
                 ("total capital, as costed", paid + deploy_c)]:
    print(f"  cumulative cash covers {label} ({t}) at month {crossing(t):.0f}")
print(f"  deepest cash point {min(r[4] for r in rows):.0f}; "
      f"cumulative turns positive in month {crossing(0):.0f}")
print()

# ---------------- THE THEATRE, ON ITS OWN ----------------
theatre_rev, theatre_run = 114, 18
aes_daycase_uplift = 92 - 28 - 24                # revenue less cost of care less theatre hire
print(f"theatre: {theatre_rev} hire less {theatre_run} running = {theatre_rev-theatre_run}, "
      f"plus 51% of {aes_daycase_uplift} aesthetics uplift = "
      f"{theatre_rev-theatre_run + aes_daycase_uplift*0.51:.0f} against 120 of capital "
      f"= {120/(theatre_rev-theatre_run + aes_daycase_uplift*0.51):.2f} yrs")
print()

# ---------------- SENSITIVITY: AESTHETICS AT HALF VOLUME ----------------
a = units["Medlyfe Aesthetics and Regenerative"]
half_rev = a["r"] / 2
half_cost = 143/2 + 78 + 24/2 + 72 + 29/2 + 22 + 10
print(f"aesthetics at half volume: rev {half_rev:.0f} cost {half_cost:.0f} "
      f"EBITDA {half_rev-half_cost:.0f}")
fixed_a = 78 + 72 + 22 + 10
cm = 1 - 0.30 - 0.06 - (24 / a["r"])
print(f"aesthetics break-even revenue {fixed_a/cm:.0f} = {fixed_a/cm/a['r']*100:.0f}% of plan")
