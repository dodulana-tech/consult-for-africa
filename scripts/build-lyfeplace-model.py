"""
Lyfe Place Abuja: a monthly financial model for the medical infrastructure division.

Sixty months, month zero being the day the setup programme is instructed. Everything is
driven off the DRIVERS block: nothing downstream is typed twice, so changing an opening
month or a ramp length moves the P&L, the cash flow, the returns and the sensitivities
together. The document in build-lyfeplace-division.py states positions at stabilisation;
this states the path to them, which is where a one year question is actually answered.

    python3 scripts/build-lyfeplace-model.py

Writes docs/lyfeplace-abuja/lyfeplace-abuja-financial-model.xlsx with eleven tabs, and
prints the reconciliation against the division document so the two cannot drift apart.

Conventions. NGN millions throughout. Revenue positive, cost negative, so every column
sums. Month 1 is the first month of the programme; trading months are labelled by the
same clock, which is why "month 7" means the same thing here as in the document.
"""

from __future__ import annotations

import datetime as _dt
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "lyfeplace-abuja" / "lyfeplace-abuja-financial-model.xlsx"

HORIZON = 60          # months modelled
START = _dt.date(2026, 9, 1)   # month 1. Passed in rather than derived, so runs repeat


# =============================================================================
# DRIVERS. Every assumption in the model lives here and nowhere else.
# =============================================================================

# ---- programme
FIT_SCHEDULED = 322.9         # category A fit-out, as scheduled
FIT_LEAN = 290.1              # the lean variant, same opening date
FLOAT = 35.0                  # medipark working capital float
COMMITTED = 115.0             # already spent: two years' head rent and fees
CONTRIB_TOTAL = 61.1          # occupier contributions on grant
PHASE_TWO = 157.0             # theatre suite, gated on a signed surgical anchor
CFA_FEE = 87.1                # setup programme, payable
CFA_MOB = 25.0

FIT_SPEND = {                 # month: share of the fit-out drawn down
    1: 0.06, 2: 0.10, 3: 0.14, 4: 0.16, 5: 0.15,
    6: 0.13, 7: 0.09, 8: 0.07, 9: 0.06, 10: 0.04,
}
FEE_SPEND = {1: CFA_MOB / CFA_FEE}   # the balance spreads evenly to month 10
for _m in range(2, 11):
    FEE_SPEND[_m] = (1 - CFA_MOB / CFA_FEE) / 9

HEAD_RENT = 55.0              # a year
RENT_PREPAID_TO = 24          # months 1 to 24 are already paid, in COMMITTED
RENT_ESCALATION = 0.12        # a year
# Does the 12% compound through the two prepaid years, or does the prepayment fix the
# rent so escalation only starts once cash rent begins? The lease decides this and we
# have not seen it. False is the softer reading and is what the document carries; True
# puts month 25 at 55.0 x 1.12^2 = 69.0 and costs about NGN 42 M over the horizon. It
# does not move peak funding, because the trough is month 15, before any rent is paid.
RENT_COMPOUNDS_IN_PREPAY = False

# THE GROUND FLOOR DECISION. The lettable ground floor is 133.5 sqm once shared services
# (105.2), the fixed imaging suite (38.3) and the pharmacy hatch (5.2) come out of 282.2.
# A theatre suite takes 64.0 of that 133.5, so it halves the conversion clinic.
THEATRE_ON_GROUND = True
GROUND_LETTABLE = 133.5
THEATRE_SUITE_SQM = 64.0
CONV_SQM = GROUND_LETTABLE - (THEATRE_SUITE_SQM if THEATRE_ON_GROUND else 0.0)
CONV_RATE = 285_000          # all in, per sqm per year
CONV_REV_PER_ROOM = 35.0     # NGN M, from 175 across 5 rooms
CONV_ROOM_SQM = 14.0
CONV_UTIL_HAIRCUT = 0.90     # a 9 room clinic does not fill every room like a 5 room one

MP_INTERCO = 266.8 / 316.8    # share of medipark revenue billed inside the group
DISCOUNT = 0.25               # naira nominal cost of capital, base case
TAX = 0.30                    # companies income tax on taxable profit
CAP_ALLOW_YEARS = 5           # straight line writing down for the fit-out


def ramp(i: int, n: int) -> float:
    """Smoothstep from 0 to 1 over n months. i is months since opening, 1 based."""
    if i <= 0:
        return 0.0
    if i >= n:
        return 1.0
    x = i / n
    return x * x * (3 - 2 * x)


# ---- the businesses. rev and ebitda are NGN M a year at stabilisation.
#      open: first trading month. full: months from opening to run rate.
#      share: Medbury's equity. dr/cr/st: debtor, creditor and stock days.
BUSINESSES = [
    dict(key="MEDIPARK", name="Lyfe Place Abuja, the medipark", rev=316.8, ebitda=78.3,
         open=7, full=14, share=1.00, dr=15, cr=30, st=0, capex=0.0, capex_m=0,
         note="Modelled line by line below rather than as a single margin"),
    dict(key="AESTH", name="Medlyfe Aesthetics and Regenerative", rev=285.0, ebitda=82.0,
         open=7, full=15, share=0.51, dr=5, cr=30, st=45, capex=41.4, capex_m=6,
         note="Injectables led at launch, body from month 9 on a leased platform"),
    dict(key="LONG", name="Medlyfe Longevity and Infusion", rev=240.0, ebitda=71.0,
         open=7, full=12, share=1.00, dr=5, cr=30, st=30, capex=25.7, capex_m=6,
         note="Programme based and pre-sellable, so it ramps faster than the rest"),
    dict(key="BARIA_MED", name="Bariatric and Metabolic, medical", rev=95.0, ebitda=26.0,
         open=7, full=12, share=0.70, dr=5, cr=30, st=30, capex=22.0, capex_m=6,
         note="GLP-1, dietetics and metabolic monitoring. Needs no theatre"),
    dict(key="BARIA_SURG", name="Bariatric and Metabolic, surgical", rev=185.0, ebitda=52.0,
         open=15, full=18, share=0.70, dr=20, cr=30, st=30, capex=0.0, capex_m=0,
         note="Capital sits in phase two. About 34 cases a year at maturity"),
    dict(key="HAIR", name="Lyfe Place Hair Restoration", rev=220.0, ebitda=55.0,
         open=7, full=15, share=1.00, dr=5, cr=30, st=30, capex=14.9, capex_m=6,
         note="About 132 single patient cases a year. Partner brings instruments"),
    dict(key="CONV", name="Alameda Conversion Clinic", rev=175.0, ebitda=35.0,
         open=10, full=15, share=0.49, dr=45, cr=30, st=30, capex=21.3, capex_m=9,
         note="Opens with the ground floor. Corporate and scheme work, so it collects slower"),
    dict(key="DIAG", name="Medbury Diagnostics, on this campus", rev=160.0, ebitda=60.0,
         open=7, full=18, share=1.00, dr=30, cr=30, st=30, capex=0.0, capex_m=0,
         note="Incremental to the existing business. Throughput manufactured by the campus"),
    dict(key="PHARM", name="Medbury Pharmaceuticals, on this campus", rev=145.0, ebitda=26.0,
         open=7, full=18, share=1.00, dr=20, cr=45, st=60, capex=0.0, capex_m=0,
         note="Incremental. Repeat monthly scripts are the best line a pharmacy can carry"),
]
BY_KEY = {b["key"]: b for b in BUSINESSES}

# ---- the medipark, built from its own lines rather than a margin
# The medipark is two businesses, not one, and Itunu is right to want them separated.
# PROP is the landlord: it holds the head lease and the fit-out and collects rent.
# SERV is the operating business: service charge, theatre and equipment, shared clinical
# services and the front office. The fourth column is which company the line belongs to.
MP_REVENUE = [
    ("Rent, on the sub leases", 69.4, 7, 3, "PROP",
     "The rent half of the rate card, contracted from the month each occupier moves in"),
    ("Service charge", 42.5, 7, 3, "SERV",
     "The service charge half of the rate card. Recovers the campus common cost"),
    ("Theatre and equipment hire", 102.0, 9, 18, "SERV",
     "Laser and IPL from month 9 at NGN 22 M, theatre lists NGN 80 M from month 15"),
    ("Shared clinical services", 60.0, 7, 14, "SERV",
     "Nursing pool, sterilising, care coordination, clinical waste, linen"),
    ("Front office and revenue cycle", 37.0, 7, 14, "SERV",
     "4% of occupier collections. Booking, registration, cashiering, claims, collection"),
    ("Car park, signage and concession", 6.0, 7, 12, "SERV",
     "Non clinical income against the compound"),
]
MP_COST = [
    ("Head rent", 55.0, 1, 1, "PROP", "In the P&L from month 1. Not in cash until month 25"),
    ("Power and utilities", 32.0, 6, 6, "SERV", "From commissioning, not from first patient"),
    ("Theatre running", 18.0, 15, 12, "SERV", "Nil until the theatre opens"),
    ("Nursing pool", 17.3, 7, 9, "SERV", "Six nurses plus oncosts, recruited ahead of the ramp"),
    ("Front office and revenue cycle team", 16.0, 6, 6, "SERV", "Five posts"),
    ("Reception and concierge", 16.0, 6, 6, "SERV", "Three positions plus concierge"),
    ("Security, cleaning and grounds", 16.0, 3, 3, "SERV", "Contracted, 954 sqm gross plus compound"),
    ("Equipment lease", 14.0, 9, 3, "SERV", "Laser and IPL platform, from month 9"),
    ("Facilities, reactive", 8.0, 7, 9, "SERV", "Day to day. Recovered in the service charge"),
    ("Facilities, planned and structural", 5.0, 7, 9, "PROP", "The landlord's obligation"),
    ("Sterilising, waste and linen", 10.2, 7, 12, "SERV", "Recharged as a service"),
    ("ICT, systems and connectivity", 9.0, 5, 3, "SERV", "Fibre, LTE failover, licences, support"),
    ("Insurance, building", 4.0, 5, 1, "PROP", "The landlord's policy"),
    ("Insurance, contents and liability", 2.0, 5, 1, "SERV", "Occupiers carry their own clinical cover"),
    ("Care coordinator", 6.0, 7, 6, "SERV", "The campus differentiator"),
    ("Business development officer", 6.0, 4, 3, "SERV", "One, on a territory mandate"),
    ("Regulatory, permits and waste licence", 3.0, 3, 1, "PROP", "Facility registration is the building's"),
    ("Other direct", 1.0, 7, 6, "SERV", ""),
]
MP_COMPANIES = {
    "PROP": ("Lyfe Place Abuja Properties", "The landlord. Head lease, fit-out, sub leases"),
    "SERV": ("Lyfe Place Abuja Services", "The operating business. Everything the occupiers buy"),
}



# =============================================================================
# THE OPCOs. What exists, what each one needs, and what each one generates.
# =============================================================================
# key maps to the model. heads is establishment at run rate, not at opening.
ENTITIES = [
    dict(key=None, name="Lyfe Place Ltd", kind="Division holding and management",
         status="Incorporate, weeks 3 to 6", own="Medbury 100%",
         heads=[("Division lead", 1), ("Finance and reporting", 1)],
         space="None. Sits above the sites.",
         assets="The brand, the rate card, the service charge model, the clinical protocol "
                "set, the operating systems, the supplier book, the regulatory file template",
         licences="Trademark filings. Nothing clinical.",
         capital=0.0,
         why="It exists so Lagos is a fit-out and a licence rather than a second start. "
             "Everything expensive is built once here and licensed to each site."),
    dict(key="MP_PROP", name="Lyfe Place Abuja Properties", kind="Operating company, the rentals business",
         status="Incorporate, weeks 3 to 6", own="Medbury 100%",
         heads=[("Property and lease administration", 1)],
         space="Holds all 664.3 sqm under the head lease",
         assets="The head lease, the whole category A fit-out, the building services",
         licences="Facility registration, fire certificate, environmental and waste permit, signage",
         capital=None,
         why="This is the OpCo you asked to see separately, and separating it is the most "
             "useful thing in this pack. It carries every naira of building capital and "
             "earns a 3 per cent margin. The building is not a rental business."),
    dict(key="MP_SERV", name="Lyfe Place Abuja Services", kind="Operating company, the medipark",
         status="Incorporate, weeks 3 to 6", own="Medbury 100%",
         heads=[("Reception and concierge", 4), ("Front office and revenue cycle", 5),
                ("Nursing pool", 6), ("Care coordination", 1), ("Business development", 1),
                ("Facilities", 1)],
         space="Occupies the campus common areas it services",
         assets="Laser and IPL platform on lease, sterilising plant, nurse call, ICT",
         licences="Covered by the building's facility registration",
         capital=None,
         why="Where the money actually is. It holds almost no capital and earns a 31 per "
             "cent margin selling what every SPV would otherwise have to build itself."),
    dict(key="AESTH", name="Medlyfe Aesthetics and Regenerative", kind="Clinical SPV, the core",
         status="Incorporate, weeks 3 to 6", own="Medbury 51%, clinical partner 49%",
         heads=[("Aesthetic physicians", 2), ("Therapists", 3), ("Clinic coordinator", 1)],
         space="83.7 sqm, four rooms upstairs",
         assets="Injectables stock, skin devices, opening stock. Body platform is leased "
                "from Services rather than bought",
         licences="Practice registration, controlled product handling",
         capital=None,
         why="The anchor of the aesthetics core and the line that makes Lagos coherent."),
    dict(key="LONG", name="Medlyfe Longevity and Infusion", kind="Clinical SPV",
         status="Incorporate, weeks 3 to 6", own="Medbury 100%",
         heads=[("Clinical lead", 1), ("Programme coordinator", 1)],
         space="33.4 sqm, four infusion bays",
         assets="Infusion chairs, pumps, monitoring. Nurses come from the Services pool",
         licences="Practice registration",
         capital=None,
         why="Highest revenue per sqm on the campus and the only line that can be sold "
             "before the doors open."),
    dict(key=["BARIA_MED", "BARIA_SURG"], name="Bariatric and Metabolic Medicine", kind="Clinical SPV",
         status="Incorporate, weeks 3 to 6", own="Medbury 70%, clinical partner 30%",
         heads=[("Physician", 1), ("Dietitian", 1), ("Metabolic nurse", 1),
                ("Surgeon, sessional", 0)],
         space="34.3 sqm, two rooms upstairs",
         assets="Body composition analyser, clinic equipment. Theatre is hired from Services",
         licences="Practice registration. Theatre use sits on the building's licence.",
         capital=None,
         why="Launches medical on GLP-1 from month 7 with no theatre, which turns the most "
             "capital hungry line into one of the fastest. Surgery only when Dr Timi signs."),
    dict(key="HAIR", name="Lyfe Place Hair Restoration", kind="Clinical SPV",
         status="Incorporate, weeks 3 to 6", own="Medbury 100%, partner on revenue share",
         heads=[("FUE technicians", 3), ("Surgeon, revenue share", 0)],
         space="26.1 sqm, one suite",
         assets="Suite fit-out. The operating partner brings the instruments",
         licences="Practice registration",
         capital=None,
         why="The smallest capital line on the campus because the partner brings the kit."),
    dict(key="CONV", name="Alameda Conversion Clinic", kind="Joint venture SPV, ground floor anchor",
         status="Subject to alignment with the Alameda side", own="Medbury 49%, Alameda 51%",
         heads=[("Clinicians and clinic staff", 8)],
         space="69.5 sqm, five rooms on the ground floor",
         assets="Its own clinical equipment",
         licences="Practice registration",
         capital=None,
         why="The anchor. It is why the campus has contracted income from month ten, and "
             "it is the one entity whose existence is not yet in your gift."),
    dict(key="DIAG", name="Medbury Diagnostics", kind="Existing business, occupier",
         status="No new company. Sub lease at weeks 3 to 6", own="Medbury 100%",
         heads=[("Laboratory and imaging staff on this campus", 6)],
         space="103.9 sqm across the chalet, ground floor and a draw point upstairs",
         assets="Existing equipment, relocated. No new capital in this programme",
         licences="Existing, extended to this site",
         capital=0.0,
         why="Gains a captive market it does not have to sell for. Every business upstairs "
             "manufactures its throughput."),
    dict(key="PHARM", name="Medbury Pharmaceuticals", kind="Existing business, occupier",
         status="No new company. Sub lease at weeks 3 to 6", own="Medbury 100%",
         heads=[("Pharmacists and dispensary staff", 4)],
         space="42.2 sqm, boys' quarters plus a collection hatch",
         assets="Existing stock and shelving. No new capital in this programme",
         licences="PCN premises registration, controlled drugs",
         capital=0.0,
         why="Weight management and aesthetic product are repeat monthly scripts, which "
             "is the best revenue a pharmacy can carry."),
    dict(key=None, name="Lyfe Place Lagos Ltd", kind="Operating company, site two",
         status="Not in this programme", own="Medbury 100%",
         heads=[], space="The KP Plastics space", assets="Nothing yet",
         licences="Lagos State, when it incorporates", capital=0.0,
         why="Named here because the Abuja structure is being built so that this one is "
             "cheap. It is a decision for later, not a cost now."),
]


# ---- assumptions register. basis: MEASURED, SCHEDULED, CONTRACTED, BENCHMARK, JUDGEMENT
ASSUMPTIONS = [
    ("Net internal area", "664.3 sqm", "MEASURED",
     "Extracted from the as-built CAD to about 10 mm. Both floors independently return 70 "
     "per cent efficiency on a 402.9 sqm plate, which is the check that it is right.",
     "The fit-out is priced on this. It is 145 sqm more than the brief assumed."),
    ("Lettable area", "393.1 sqm", "MEASURED",
     "Allocated room by measured room. 31 per cent of net is campus common, which a "
     "converted residence with two staircases and a porch cannot avoid.",
     "The rent roll is priced on this and it did not move when the building got bigger."),
    ("Category A fit-out", "NGN 322.9 M", "SCHEDULED",
     "74 measured lines with quantities and unit rates. AACE class 4, minus 15 to plus 30 "
     "per cent. A tendered bill of quantities settles it in two weeks.",
     "A 15 per cent overrun costs about one month of payback."),
    ("Head rent", "NGN 55.0 M a year", "CONTRACTED",
     "Two years already paid and sitting inside the NGN 115 M committed.",
     "Fixed. The open question is only whether escalation compounds through the prepaid years."),
    ("Rate card", "NGN 200 to 330 k per sqm", "BENCHMARK",
     "All in, rent plus service charge, on the net demise. Every occupier is a related "
     "party, so each rate has to stand up as an arm's length charge.",
     "A 10 per cent cut to the card takes about NGN 11 M a year off the campus."),
    ("Occupier contributions on grant", "NGN 61.1 M", "JUDGEMENT",
     "NGN 100 to 180 k per sqm by band. Not yet agreed with a single occupier.",
     "If nobody pays it, Properties finds NGN 61 M more on day one."),
    ("Aesthetics revenue at run rate", "NGN 285 M", "JUDGEMENT",
     "The least evidenced number in the pack. Built from room hours and a price list, not "
     "from a comparable clinic's audited accounts.",
     "20 per cent below plan moves group payback from 29 months to 33."),
    ("Time to run rate", "12 to 18 months", "JUDGEMENT",
     "Smoothstep ramp from each opening month. Infusion is fastest because programmes "
     "pre-sell; diagnostics and pharmacy are slowest because they follow everyone else.",
     "After opening date, the most sensitive driver in the model."),
    ("Bariatric surgical volume", "34 cases a year", "JUDGEMENT",
     "At maturity, from month 15, and entirely dependent on a surgical anchor who has not "
     "yet been approached.",
     "No anchor means no theatre, no NGN 185 M of revenue and no NGN 157 M of capital."),
    ("Front office fee", "4% of collections", "BENCHMARK",
     "Booking, registration, cashiering, claims and collection, sold as a service rather "
     "than built five times.",
     "84 per cent of Services revenue is billed to Medbury companies, so this needs a "
     "transfer pricing file built alongside the sub leases."),
    ("Equity shares", "49 to 100%", "JUDGEMENT",
     "Aesthetics 51 inside the existing joint venture, bariatrics 70 with a clinical "
     "partner, the conversion clinic 49 with Alameda.",
     "Where the aesthetics company sits moves attributable EBITDA by about NGN 33 M a year."),
    ("Discount rate", "25% nominal naira", "BENCHMARK",
     "Applied to five years of cash flow with no terminal value anywhere.",
     "Moves NPV, not payback. At 20 per cent the NPV rises materially."),
    ("Debtor days", "5 to 45", "JUDGEMENT",
     "The aesthetics core is cash paying at 5 days. The conversion clinic carries corporate "
     "and scheme work at 45.",
     "Working capital, not profit. It moves the trough rather than the return."),
    ("Rent escalation in the prepaid years", "Does not compound", "JUDGEMENT",
     "We have not seen the lease. The softer reading is that the prepayment fixes the rent "
     "to month 24 and escalation starts after.",
     "Worth about NGN 21 M of NPV. It does not move payback or peak funding."),
]


# =============================================================================
# ENGINE
# =============================================================================

def months():
    return list(range(1, HORIZON + 1))


def month_label(m: int) -> str:
    y = START.year + (START.month - 1 + m - 1) // 12
    mo = (START.month - 1 + m - 1) % 12 + 1
    return "%s-%02d" % (_dt.date(y, mo, 1).strftime("%b %y"), m)


def series(annual: float, open_m: int, full_m: int) -> list[float]:
    """Monthly series that ramps to annual/12 over full_m months from open_m."""
    return [annual / 12 * ramp(m - open_m + 1, full_m) if m >= open_m else 0.0
            for m in months()]


def medipark_lines():
    rev = {n: series(v, o, f) for n, v, o, f, _c, _ in MP_REVENUE}
    cost = {n: series(v, o, f) for n, v, o, f, _c, _ in MP_COST}
    return rev, cost


def split_by_company(lines, spec):
    """Sum the monthly series belonging to each of PROP and SERV."""
    out = {}
    for co in MP_COMPANIES:
        keys = [r[0] for r in spec if r[4] == co]
        out[co] = [sum(lines[k][i] for k in keys) for i in range(HORIZON)]
    return out


def working_capital(rev: list[float], cost: list[float], dr: int, cr: int, st: int):
    """Balance of debtors less creditors plus stock, and the monthly movement in it."""
    bal = []
    for m in range(HORIZON):
        d = rev[m] * 12 / 365 * dr
        c = abs(cost[m]) * 12 / 365 * cr
        s = abs(cost[m]) * 12 / 365 * st * 0.45   # stock is on consumables, not all cost
        bal.append(d + s - c)
    move = [bal[0]] + [bal[m] - bal[m - 1] for m in range(1, HORIZON)]
    return bal, move


def build():
    ms = months()
    out = {}

    # ---------------------------------------------------------------- medipark
    mp_rev_lines, mp_cost_lines = medipark_lines()
    mp_rev = [sum(mp_rev_lines[n][i] for n in mp_rev_lines) for i in range(HORIZON)]
    mp_cost = [-sum(mp_cost_lines[n][i] for n in mp_cost_lines) for i in range(HORIZON)]
    mp_ebitda = [mp_rev[i] + mp_cost[i] for i in range(HORIZON)]

    # head rent is in the P&L from month 1 but paid from month 25, escalating
    rent_pl = [-mp_cost_lines["Head rent"][i] for i in range(HORIZON)]
    rent_cash = []
    for i, m in enumerate(ms):
        if m <= RENT_PREPAID_TO:
            rent_cash.append(0.0)
        else:
            yrs = (m - RENT_PREPAID_TO - 1) // 12
            if RENT_COMPOUNDS_IN_PREPAY:
                yrs += RENT_PREPAID_TO // 12
            rent_cash.append(-HEAD_RENT / 12 * (1 + RENT_ESCALATION) ** yrs)
    # the P&L already carries flat rent; cash differs by prepayment and escalation
    mp_rent_adj = [rent_cash[i] - rent_pl[i] for i in range(HORIZON)]

    mp_capex = [-FIT_SCHEDULED * FIT_SPEND.get(m, 0.0) for m in ms]
    mp_contrib = [CONTRIB_TOTAL * (0.5 if m == 5 else 0.5 if m == 8 else 0.0) for m in ms]
    mp_fee = [-CFA_FEE * FEE_SPEND.get(m, 0.0) for m in ms]
    mp_float = [-FLOAT if m == 6 else 0.0 for m in ms]
    mp_wc_bal, mp_wc_move = working_capital(mp_rev, mp_cost, 15, 30, 0)

    mp_op_cash = [mp_ebitda[i] + mp_rent_adj[i] - mp_wc_move[i] for i in range(HORIZON)]
    mp_cash = [mp_op_cash[i] + mp_capex[i] + mp_contrib[i] + mp_fee[i] + mp_float[i]
               for i in range(HORIZON)]

    mp_rev_co = split_by_company(mp_rev_lines, MP_REVENUE)
    mp_cost_co = split_by_company(mp_cost_lines, MP_COST)
    for co in MP_COMPANIES:
        r = mp_rev_co[co]
        c = [-x for x in mp_cost_co[co]]
        out["MP_" + co] = dict(rev=r, cost=c, ebitda=[r[i] + c[i] for i in range(HORIZON)],
                               capex=[0.0] * HORIZON, cash=[0.0] * HORIZON, share=1.00)

    out["MEDIPARK"] = dict(rev=mp_rev, cost=mp_cost, ebitda=mp_ebitda, capex=mp_capex,
                           cash=mp_cash, op_cash=mp_op_cash, wc=mp_wc_move,
                           rev_lines=mp_rev_lines, cost_lines=mp_cost_lines,
                           contrib=mp_contrib, fee=mp_fee, rent_adj=mp_rent_adj,
                           float_=mp_float, share=1.00)

    # ------------------------------------------------------------- the SPVs
    for b in BUSINESSES:
        if b["key"] == "MEDIPARK":
            continue
        rev = series(b["rev"], b["open"], b["full"])
        # margin is thinner through the ramp: fixed cost lands before volume does
        eb = []
        for i, m in enumerate(ms):
            r = ramp(m - b["open"] + 1, b["full"])
            margin = b["ebitda"] / b["rev"] if b["rev"] else 0.0
            eb.append(rev[i] * margin * (0.35 + 0.65 * r) if r > 0 else 0.0)
        cost = [eb[i] - rev[i] for i in range(HORIZON)]
        capex = [-b["capex"] if m == b["capex_m"] else 0.0 for m in ms]
        wc_bal, wc_move = working_capital(rev, cost, b["dr"], b["cr"], b["st"])
        cash = [eb[i] - wc_move[i] + capex[i] for i in range(HORIZON)]
        out[b["key"]] = dict(rev=rev, cost=cost, ebitda=eb, capex=capex, cash=cash,
                             op_cash=[eb[i] - wc_move[i] for i in range(HORIZON)],
                             wc=wc_move, share=b["share"])

    # ------------------------------------------------------- phase two theatre
    # funded from trading, gated on a signed anchor, drawn months 13 to 15
    p2 = [-PHASE_TWO * s if m in (13, 14, 15) else 0.0
          for m in ms for s in [1 / 3] if True]
    out["MEDIPARK"]["capex"] = [out["MEDIPARK"]["capex"][i] + p2[i] for i in range(HORIZON)]
    out["MEDIPARK"]["cash"] = [out["MEDIPARK"]["cash"][i] + p2[i] for i in range(HORIZON)]
    out["MEDIPARK"]["phase_two"] = p2

    # ------------------------------------------------------------ consolidated
    keys = [b["key"] for b in BUSINESSES]
    grp = {}
    for f in ("rev", "ebitda", "capex", "cash", "op_cash"):
        grp[f] = [sum(out[k][f][i] for k in keys) for i in range(HORIZON)]
    # the medipark bills the occupiers, so most of its revenue is a cost inside the same
    # group. Gross revenue double counts it; external revenue is what leaves the campus.
    grp["gross_rev"] = list(grp["rev"])
    grp["intercompany"] = [-mp_rev[i] * MP_INTERCO for i in range(HORIZON)]
    grp["rev"] = [grp["gross_rev"][i] + grp["intercompany"][i] for i in range(HORIZON)]
    grp["committed"] = [-COMMITTED if m == 1 else 0.0 for m in ms]
    grp["cash"] = [grp["cash"][i] + grp["committed"][i] for i in range(HORIZON)]

    att = {}
    for f in ("rev", "ebitda", "capex", "cash"):
        att[f] = [sum(out[k][f][i] * BY_KEY[k]["share"] for k in keys) for i in range(HORIZON)]
    att["rev"] = [att["rev"][i] + grp["intercompany"][i] for i in range(HORIZON)]
    att["cash"] = [att["cash"][i] + grp["committed"][i] for i in range(HORIZON)]

    out["GROUP"], out["ATTRIB"] = grp, att
    return out


# ------------------------------------------------------------------- returns
def npv(rate_a: float, flows: list[float]) -> float:
    r = (1 + rate_a) ** (1 / 12) - 1
    return sum(f / (1 + r) ** (i + 1) for i, f in enumerate(flows))


def irr(flows: list[float]) -> float | None:
    """Annualised IRR by bisection. None if it never turns positive."""
    if sum(flows) <= 0:
        return None
    lo, hi = -0.95, 10.0
    if npv(lo, flows) < 0:
        return None
    for _ in range(200):
        mid = (lo + hi) / 2
        if npv(mid, flows) > 0:
            lo = mid
        else:
            hi = mid
    return (lo + hi) / 2


def payback(flows: list[float]) -> int | None:
    c = 0.0
    for i, f in enumerate(flows):
        c += f
        if c >= 0:
            return i + 1
    return None


LEVERED = dict(fit=FIT_LEAN, ramp_f=0.7, rev_f=1.05)
"""The document's three levers: open lean, ramp faster off pre-selling, and pre-sell the
annual lines. Opening at week 24 is already in the base case, so it is not a lever here."""


def scenario(fit=None, ramp_f=None, rev_f=None, delay=0):
    """Re-run the whole model with drivers moved, then put the drivers back."""
    global FIT_SCHEDULED
    keep_fit = FIT_SCHEDULED
    keep = [dict(b) for b in BUSINESSES]
    if fit:
        FIT_SCHEDULED = fit
    for b in BUSINESSES:
        if ramp_f:
            b["full"] = max(1, int(round(b["full"] * ramp_f)))
        if rev_f and b["key"] != "MEDIPARK":
            b["rev"] *= rev_f
            b["ebitda"] *= rev_f
        b["open"] += delay
    m = build()
    res = (metrics(m["GROUP"]["cash"], ""), metrics(m["ATTRIB"]["cash"], ""), m)
    FIT_SCHEDULED = keep_fit
    for i, b in enumerate(keep):
        BUSINESSES[i].update(b)
    return res


def metrics(flows: list[float], label: str) -> dict:
    cum = []
    r = 0.0
    for f in flows:
        r += f
        cum.append(r)
    invested = -min(cum)
    return dict(label=label, irr=irr(flows), npv=npv(DISCOUNT, flows),
                payback=payback(flows), peak=invested, cum=cum,
                coc=(sum(flows) + invested) / invested if invested else None)


# =============================================================================
# WORKBOOK
# =============================================================================
NAVY = "0F3D2E"
GOLD = "C9A227"
LIGHT = "EFF4F1"
BAND = "F7F5EF"

H = Font(bold=True, color="FFFFFF", size=9.5, name="Calibri")
B = Font(bold=True, size=9.5, name="Calibri")
N = Font(size=9.5, name="Calibri")
SM = Font(size=8.5, color="6B7280", name="Calibri", italic=True)
FILL_H = PatternFill("solid", fgColor=NAVY)
FILL_T = PatternFill("solid", fgColor=LIGHT)
FILL_B = PatternFill("solid", fgColor=BAND)
THIN = Side(style="thin", color="D8DEDA")
BOX = Border(top=THIN, bottom=THIN)
NUM = '#,##0.0;[Red](#,##0.0);"-"'
NUM0 = '#,##0;[Red](#,##0);"-"'
PCT = '0.0%'


def sheet(wb, title, widths=None, freeze="B3"):
    ws = wb.create_sheet(title)
    ws.sheet_view.showGridLines = False
    ws.freeze_panes = freeze
    if widths:
        for i, w in enumerate(widths, start=1):
            ws.column_dimensions[get_column_letter(i)].width = w
    return ws


def title_row(ws, text, sub="", span=14):
    ws["A1"] = text
    ws["A1"].font = Font(bold=True, size=13, color=NAVY, name="Calibri")
    if sub:
        ws["A2"] = sub
        ws["A2"].font = SM
    return 4


def month_header(ws, row, first_col=2, span=HORIZON, every=1):
    ws.cell(row=row, column=1, value="NGN M").font = H
    ws.cell(row=row, column=1).fill = FILL_H
    for j in range(span):
        c = ws.cell(row=row, column=first_col + j, value=month_label(j + 1))
        c.font = H
        c.fill = FILL_H
        c.alignment = Alignment(horizontal="right")
    return row + 1


def data_row(ws, row, label, vals, bold=False, band=False, fmt=NUM, first_col=2, note=None):
    c = ws.cell(row=row, column=1, value=label)
    c.font = B if bold else N
    if band:
        c.fill = FILL_T
    for j, v in enumerate(vals):
        cc = ws.cell(row=row, column=first_col + j, value=round(v, 2) if isinstance(v, float) else v)
        cc.font = B if bold else N
        cc.number_format = fmt
        if band:
            cc.fill = FILL_T
    if note:
        cc = ws.cell(row=row, column=first_col + len(vals) + 1, value=note)
        cc.font = SM
    return row + 1


def annual(vals):
    """Twelve month blocks. Year 1 is months 1 to 12."""
    return [sum(vals[i * 12:(i + 1) * 12]) for i in range(HORIZON // 12)]


def write(model):
    wb = Workbook()
    wb.remove(wb.active)
    grp, att, mp = model["GROUP"], model["ATTRIB"], model["MEDIPARK"]

    # ---------------------------------------------------------------- 1 cover
    ws = sheet(wb, "Cover", [46, 20, 78], freeze="A1")
    r = title_row(ws, "Lyfe Place Abuja: medical infrastructure division",
                  "Monthly financial model, 60 months. NGN millions. Prepared for "
                  "Dr Itunu Akinware, Group CEO.")
    g = metrics(grp["cash"], "Group")
    a = metrics(att["cash"], "Attributable")
    rows = [
        ("Model horizon", "%d months" % HORIZON, "Month 1 is the month the setup programme is instructed"),
        ("First trading month", "Month 7", "The first floor opens at week 24 and trades while the ground floor finishes"),
        ("Ground floor complete", "Month 10", "The conversion clinic opens with it"),
        ("Theatre", "Month 15", "Gated on a signed surgical anchor. Capital sits in phase two"),
        ("", "", ""),
        ("Group revenue, run rate", "%.0f" % (grp["rev"][HORIZON - 1] * 12), "Seven businesses plus the medipark's external income"),
        ("Group EBITDA, run rate", "%.0f" % (grp["ebitda"][HORIZON - 1] * 12), "Before any management fee"),
        ("Attributable EBITDA, run rate", "%.0f" % (att["ebitda"][HORIZON - 1] * 12), "At Medbury's equity share of each company"),
        ("", "", ""),
        ("Peak cash out, group", "%.0f" % g["peak"], "The most the programme is ever under water"),
        ("Group payback", "month %s" % g["payback"], "From month 1, not from opening"),
        ("Group IRR, 5 year", "%.1f%%" % (g["irr"] * 100) if g["irr"] else "n/a", "Nominal naira, no terminal value"),
        ("Group NPV at %.0f%%" % (DISCOUNT * 100), "%.0f" % g["npv"], "No terminal value, so this is the floor"),
        ("", "", ""),
        ("Peak cash out, attributable", "%.0f" % a["peak"], "Medbury's share of capex plus the committed cash"),
        ("Attributable payback", "month %s" % a["payback"], ""),
        ("Attributable IRR, 5 year", "%.1f%%" % (a["irr"] * 100) if a["irr"] else "n/a", ""),
    ]
    for label, val, note in rows:
        if not label:
            r += 1
            continue
        ws.cell(row=r, column=1, value=label).font = B
        c = ws.cell(row=r, column=2, value=val)
        c.font = B
        c.alignment = Alignment(horizontal="right")
        ws.cell(row=r, column=3, value=note).font = SM
        r += 1
    r += 1
    ws.cell(row=r, column=1, value="Every number in this workbook is driven from the Drivers "
            "tab. Nothing is typed twice.").font = SM

    # -------------------------------------------------------------- 2 drivers
    ws = sheet(wb, "Drivers", [40, 12, 12, 10, 10, 10, 8, 8, 8, 60], freeze="A4")
    r = title_row(ws, "Drivers", "Change anything here and the whole model moves.")
    hdr = ["Business", "Revenue", "EBITDA", "Margin", "Opens", "To run rate",
           "Medbury", "Debtor d", "Creditor d", "Note"]
    for j, h in enumerate(hdr, start=1):
        c = ws.cell(row=r, column=j, value=h)
        c.font = H
        c.fill = FILL_H
    r += 1
    for b in BUSINESSES:
        vals = [b["name"], b["rev"], b["ebitda"],
                b["ebitda"] / b["rev"] if b["rev"] else 0,
                "m%d" % b["open"], "%d m" % b["full"], b["share"], b["dr"], b["cr"], b["note"]]
        for j, v in enumerate(vals, start=1):
            c = ws.cell(row=r, column=j, value=v)
            c.font = N
            if j in (2, 3):
                c.number_format = NUM
            if j in (4, 7):
                c.number_format = PCT
            if j == 10:
                c.font = SM
        r += 1
    r += 2
    ws.cell(row=r, column=1, value="Programme").font = B
    r += 1
    for label, val, note in [
        ("Category A fit-out, as scheduled", FIT_SCHEDULED, "74 measured lines, AACE class 4"),
        ("Category A fit-out, lean", FIT_LEAN, "Same opening date, balance funded from trading"),
        ("Working capital float", FLOAT, "To cash positive"),
        ("Already committed", COMMITTED, "Two years' head rent and fees, spent"),
        ("Occupier contributions on grant", CONTRIB_TOTAL, "Received on grant of each sub lease"),
        ("Phase two, theatre", PHASE_TWO, "Gated on a signed surgical anchor, funded from trading"),
        ("Setup programme fee", CFA_FEE, "Of which %.0f on mobilisation" % CFA_MOB),
        ("Head rent", HEAD_RENT, "Prepaid to month %d, escalating %.0f%% a year" % (RENT_PREPAID_TO, RENT_ESCALATION * 100)),
        ("Discount rate", DISCOUNT, "Naira nominal"),
        ("Rent escalates through the prepaid years", 1.0 if RENT_COMPOUNDS_IN_PREPAY else 0.0,
         "0 = prepayment fixes the rent to month %d. 1 = month %d starts at %.1f. "
         "Worth about NGN 42 M over the horizon. Check the lease"
         % (RENT_PREPAID_TO, RENT_PREPAID_TO + 1, HEAD_RENT * (1 + RENT_ESCALATION) ** 2)),
    ]:
        ws.cell(row=r, column=1, value=label).font = N
        c = ws.cell(row=r, column=2, value=val)
        c.font = N
        c.number_format = PCT if label == "Discount rate" else NUM
        ws.cell(row=r, column=10, value=note).font = SM
        r += 1

    # ------------------------------------------------------- 2b the OpCo schedule
    ws = sheet(wb, "OpCos", [34, 30, 26, 30, 26, 13, 13, 11, 13, 54], freeze="A4")
    r = title_row(ws, "The operating companies",
                  "What will exist, what each one needs, and what each one generates. "
                  "NGN M a year at run rate.")
    hdr = ["Company", "What it is", "Status", "Ownership", "Establishment at run rate",
           "Revenue", "EBITDA", "Margin", "To Medbury", "Why it exists"]
    for j, h in enumerate(hdr, start=1):
        c = ws.cell(row=r, column=j, value=h)
        c.font = H
        c.fill = FILL_H
        c.alignment = Alignment(wrap_text=True, vertical="top")
    r += 1
    for e in ENTITIES:
        ks = e["key"] if isinstance(e["key"], list) else ([e["key"]] if e["key"] else [])
        rev = sum(model[k]["rev"][-1] * 12 for k in ks)
        eb = sum(model[k]["ebitda"][-1] * 12 for k in ks)
        share = BY_KEY[ks[0]]["share"] if ks and ks[0] in BY_KEY else 1.0
        heads = sum(n for _t, n in e["heads"])
        establishment = ", ".join("%s %d" % (t, n) for t, n in e["heads"] if n) or "None"
        vals = [e["name"], e["kind"], e["status"], e["own"],
                "%s%s" % (establishment, "" if not heads else "  (%d posts)" % heads),
                rev or None, eb or None, (eb / rev) if rev else None,
                (eb * share) if rev else None, e["why"]]
        for j, v in enumerate(vals, start=1):
            c = ws.cell(row=j and r, column=j, value=v)
            c.font = N
            c.alignment = Alignment(wrap_text=True, vertical="top")
            if j in (6, 7, 9):
                c.number_format = NUM
            if j == 8:
                c.number_format = PCT
            if j == 10:
                c.font = SM
        r += 1
    interco = -model["GROUP"]["intercompany"][-1] * 12
    for label, rv, eb2, note in [
        ("All companies, gross", sum(model[k]["rev"][-1] for k in model
                                     if k in BY_KEY) * 12, grp["ebitda"][-1] * 12,
         "Before eliminating what the campus bills itself"),
        ("Less charged between these companies", -interco, 0.0,
         "Rent, service charge and shared services are a cost to the occupier and revenue "
         "to Properties and Services. It nets off on consolidation"),
        ("Group, external", grp["rev"][-1] * 12, grp["ebitda"][-1] * 12,
         "What actually leaves the campus"),
    ]:
        ws.cell(row=r, column=1, value=label).font = B
        ws.cell(row=r, column=10, value=note).font = SM
        for j, v in ((6, rv), (7, eb2 or None)):
            c = ws.cell(row=r, column=j, value=v)
            c.font = B
            c.number_format = NUM
        c = ws.cell(row=r, column=9, value=att["ebitda"][-1] * 12 if "external" in label else None)
        c.font = B
        c.number_format = NUM
        for j in range(1, 11):
            ws.cell(row=r, column=j).fill = FILL_T
        r += 1
    r += 1
    ws.cell(row=r, column=1, value="What the split says").font = B
    r += 1
    pr = model["MP_PROP"]["ebitda"][-1] * 12
    prv = model["MP_PROP"]["rev"][-1] * 12
    sv = model["MP_SERV"]["ebitda"][-1] * 12
    svv = model["MP_SERV"]["rev"][-1] * 12
    for line in [
        "Separating the rentals business is the most useful thing in this pack. Properties earns "
        "NGN %.1f M on NGN %.1f M of rent, a %.0f per cent margin, and it carries every naira of the "
        "NGN %.0f M fit-out and the head lease." % (pr, prv, 100 * pr / prv, FIT_SCHEDULED),
        "Services earns NGN %.0f M on NGN %.0f M, a %.0f per cent margin, and holds almost no capital."
        % (sv, svv, 100 * sv / svv),
        "So the building is not a rental business with services attached. It is a services business "
        "with a lease attached, and the rent exists to cover the lease rather than to make a return.",
        "That is the argument for keeping them as two companies: you can see which one is working, "
        "and Properties can be refinanced or sold later without disturbing the operating business.",
    ]:
        ws.cell(row=r, column=1, value=line).font = SM
        r += 1

    # -------------------------------------------------------- 2c assumptions
    ws = sheet(wb, "Assumptions", [34, 20, 17, 62, 58], freeze="A4")
    r = title_row(ws, "Assumptions register",
                  "Every driver, what it rests on, and what it moves if it is wrong. "
                  "MEASURED and CONTRACTED are facts. JUDGEMENT is where to push back.")
    for j, h in enumerate(["Assumption", "Value", "Basis", "What it rests on",
                           "What it moves if wrong"], start=1):
        c = ws.cell(row=r, column=j, value=h)
        c.font = H
        c.fill = FILL_H
        c.alignment = Alignment(wrap_text=True, vertical="top")
    r += 1
    for name, val, basis, rests, moves in ASSUMPTIONS:
        for j, v in enumerate([name, val, basis, rests, moves], start=1):
            c = ws.cell(row=r, column=j, value=v)
            c.font = B if j == 1 else N
            c.alignment = Alignment(wrap_text=True, vertical="top")
            if j == 3:
                c.font = Font(bold=True, size=9, name="Calibri",
                              color={"MEASURED": "0F6B3D", "CONTRACTED": "0F6B3D",
                                     "SCHEDULED": "8A6D1F", "BENCHMARK": "8A6D1F"}.get(v, "9B2C2C"))
        if basis == "JUDGEMENT":
            for j in range(1, 6):
                ws.cell(row=r, column=j).fill = FILL_B
        r += 1
    r += 1
    n_j = sum(1 for a in ASSUMPTIONS if a[2] == "JUDGEMENT")
    ws.cell(row=r, column=1, value="%d of %d assumptions are judgement rather than fact, and they "
            "are shaded. Those are the ones to argue about." % (n_j, len(ASSUMPTIONS))).font = SM

    # ------------------------------------------------- 3 medipark, monthly
    ws = sheet(wb, "Medipark monthly", [40] + [11] * HORIZON)
    r = title_row(ws, "The medipark, month by month",
                  "Entity one. It carries the head rent, so it is tested first.")
    r = month_header(ws, r)
    for n, _v, _o, _f, _co, note in MP_REVENUE:
        r = data_row(ws, r, n, mp["rev_lines"][n], note=note)
    r = data_row(ws, r, "Revenue", mp["rev"], bold=True, band=True)
    r += 1
    for n, _v, _o, _f, _co, note in MP_COST:
        r = data_row(ws, r, n, [-x for x in mp["cost_lines"][n]], note=note)
    r = data_row(ws, r, "Operating cost", mp["cost"], bold=True, band=True)
    r = data_row(ws, r, "EBITDA", mp["ebitda"], bold=True, band=True)
    r += 1
    r = data_row(ws, r, "Head rent, cash timing adjustment", mp["rent_adj"],
                 note="Prepaid to month %d, then escalating" % RENT_PREPAID_TO)
    r = data_row(ws, r, "Movement in working capital", [-x for x in mp["wc"]])
    r = data_row(ws, r, "Operating cash flow", mp["op_cash"], bold=True, band=True)
    r += 1
    r = data_row(ws, r, "Category A fit-out", [mp["capex"][i] - mp["phase_two"][i] for i in range(HORIZON)])
    r = data_row(ws, r, "Phase two, theatre", mp["phase_two"], note="Gated on a signed surgical anchor")
    r = data_row(ws, r, "Occupier contributions on grant", mp["contrib"])
    r = data_row(ws, r, "Setup programme fee", mp["fee"])
    r = data_row(ws, r, "Working capital float", mp["float_"])
    r = data_row(ws, r, "Net cash flow", mp["cash"], bold=True, band=True)
    cum, run = [], 0.0
    for v in mp["cash"]:
        run += v
        cum.append(run)
    r = data_row(ws, r, "Cumulative cash", cum, bold=True)

    # ------------------------------------------------------ 4 SPVs, monthly
    ws = sheet(wb, "Clinical SPVs monthly", [40] + [11] * HORIZON)
    r = title_row(ws, "The clinical companies, month by month",
                  "Each opens on its own clock and ramps on its own curve.")
    r = month_header(ws, r)
    for b in BUSINESSES:
        if b["key"] == "MEDIPARK":
            continue
        d = model[b["key"]]
        ws.cell(row=r, column=1, value=b["name"]).font = B
        ws.cell(row=r, column=1).fill = FILL_B
        r += 1
        r = data_row(ws, r, "   Revenue", d["rev"])
        r = data_row(ws, r, "   EBITDA", d["ebitda"])
        r = data_row(ws, r, "   Capex", d["capex"])
        r = data_row(ws, r, "   Net cash flow", d["cash"], bold=True)
        r += 1

    # ----------------------------------------------------------- 5 group
    ws = sheet(wb, "Group monthly", [40] + [11] * HORIZON)
    r = title_row(ws, "Group, month by month", "All seven businesses plus the medipark, at 100%.")
    r = month_header(ws, r)
    r = data_row(ws, r, "Revenue", grp["rev"], bold=True, band=True)
    r = data_row(ws, r, "EBITDA", grp["ebitda"], bold=True, band=True)
    r = data_row(ws, r, "Capex", grp["capex"])
    r = data_row(ws, r, "Cash already committed", grp["committed"])
    r = data_row(ws, r, "Net cash flow", grp["cash"], bold=True, band=True)
    r = data_row(ws, r, "Cumulative cash", g["cum"], bold=True)
    r += 1
    r = data_row(ws, r, "Attributable revenue", att["rev"])
    r = data_row(ws, r, "Attributable EBITDA", att["ebitda"], bold=True)
    r = data_row(ws, r, "Attributable net cash flow", att["cash"], bold=True, band=True)
    r = data_row(ws, r, "Attributable cumulative", a["cum"], bold=True)

    # ---------------------------------------------------------- 6 annual
    ws = sheet(wb, "Annual summary", [40] + [16] * 6, freeze="B4")
    r = title_row(ws, "Annual summary", "Year 1 is months 1 to 12 from instruction, not from opening.")
    ws.cell(row=r, column=1, value="NGN M").font = H
    ws.cell(row=r, column=1).fill = FILL_H
    for j in range(HORIZON // 12):
        c = ws.cell(row=r, column=2 + j, value="Year %d" % (j + 1))
        c.font = H
        c.fill = FILL_H
        c.alignment = Alignment(horizontal="right")
    r += 1
    for label, vals, bold in [
        ("Group revenue", annual(grp["rev"]), True),
        ("Group EBITDA", annual(grp["ebitda"]), True),
        ("Medipark revenue", annual(mp["rev"]), False),
        ("Medipark EBITDA", annual(mp["ebitda"]), False),
        ("Capex", annual(grp["capex"]), False),
        ("Group net cash flow", annual(grp["cash"]), True),
        ("Attributable EBITDA", annual(att["ebitda"]), True),
        ("Attributable net cash flow", annual(att["cash"]), True),
    ]:
        r = data_row(ws, r, label, vals, bold=bold, band=bold)

    # --------------------------------------------------------- 7 returns
    ws = sheet(wb, "Returns", [42, 18, 18, 62], freeze="A4")
    r = title_row(ws, "Returns", "No terminal value anywhere, so every figure here is a floor.")
    for j, h in enumerate(["Measure", "Group, 100%", "Attributable", "Note"], start=1):
        c = ws.cell(row=r, column=j, value=h)
        c.font = H
        c.fill = FILL_H
    r += 1
    rows = [
        ("Peak cash out", g["peak"], a["peak"], "The most the programme is ever under water", NUM),
        ("Payback, from instruction", g["payback"], a["payback"], "In months. Month 1 is instruction, month 7 is opening", None),
        ("Payback, from opening", (g["payback"] or 0) - 6, (a["payback"] or 0) - 6, "The number the one year question is really about", None),
        ("IRR, 5 year", g["irr"], a["irr"], "Nominal naira, no terminal value", PCT),
        ("NPV at %.0f%%" % (DISCOUNT * 100), g["npv"], a["npv"], "Five years only", NUM),
        ("Cash on cash, 5 year", g["coc"], a["coc"], "Total returned over peak invested", NUM),
        ("Run rate EBITDA", grp["ebitda"][HORIZON - 1] * 12, att["ebitda"][HORIZON - 1] * 12, "Annualised from the last modelled month", NUM),
    ]
    for label, gv, av, note, fmt in rows:
        ws.cell(row=r, column=1, value=label).font = B
        for j, v in ((2, gv), (3, av)):
            c = ws.cell(row=r, column=j, value=round(v, 3) if isinstance(v, float) else v)
            c.font = N
            if fmt:
                c.number_format = fmt
            c.alignment = Alignment(horizontal="right")
        ws.cell(row=r, column=4, value=note).font = SM
        r += 1

    # ------------------------------------------------------ 8 sensitivities
    ws = sheet(wb, "Sensitivity", [42] + [15] * 7, freeze="A4")
    r = title_row(ws, "Sensitivity", "One driver moved at a time, everything else held.")

    def rerun(**kw):
        g_, a_, _ = scenario(fit=kw.get("fit"), ramp_f=kw.get("ramp"),
                             rev_f=kw.get("rev"), delay=kw.get("delay", 0))
        return g_, a_

    cases = [
        ("Base case", {}),
        ("Fit-out lean, %.0f not %.0f" % (FIT_LEAN, FIT_SCHEDULED), dict(fit=FIT_LEAN)),
        ("Fit-out 15% over", dict(fit=FIT_SCHEDULED * 1.15)),
        ("Ramp 50% slower", dict(ramp=1.5)),
        ("Ramp 25% faster", dict(ramp=0.75)),
        ("Revenue 20% below plan", dict(rev=0.8)),
        ("Revenue 10% above plan", dict(rev=1.1)),
        ("Opening three months late", dict(delay=3)),
        ("All three levers together", dict(fit=FIT_LEAN, ramp=0.7, rev=1.05)),
    ]
    for j, h in enumerate(["Case", "Peak out", "Payback m", "IRR", "NPV",
                           "Att. payback", "Att. IRR"], start=1):
        c = ws.cell(row=r, column=j, value=h)
        c.font = H
        c.fill = FILL_H
    r += 1
    for label, kw in cases:
        gg, aa = rerun(**kw)
        ws.cell(row=r, column=1, value=label).font = B if not kw else N
        for j, v, fmt in ((2, gg["peak"], NUM), (3, gg["payback"], NUM0),
                          (4, gg["irr"], PCT), (5, gg["npv"], NUM),
                          (6, aa["payback"], NUM0), (7, aa["irr"], PCT)):
            c = ws.cell(row=r, column=j, value=round(v, 4) if isinstance(v, float) else v)
            c.font = N
            c.number_format = fmt
            c.alignment = Alignment(horizontal="right")
        if not kw:
            for j in range(1, 8):
                ws.cell(row=r, column=j).fill = FILL_T
        r += 1

    r += 2
    ws.cell(row=r, column=1, value="What the table says").font = B
    r += 1
    for line in [
        "The programme is far more sensitive to the ramp and to opening date than it is to the fit-out number.",
        "A three month delay costs more than a 15 per cent fit-out overrun, which is why the two week design sprint is the critical path.",
        "The lean fit-out improves payback without touching the opening date, so it is close to free.",
    ]:
        ws.cell(row=r, column=1, value=line).font = SM
        r += 1

    # ------------------------------------------------------- 9 funding bridge
    ws = sheet(wb, "Funding", [54, 16, 66], freeze="A4")
    r = title_row(ws, "What actually has to be funded",
                  "The document adds up the capital items. This is the trough of the bank balance, "
                  "which is a different and larger number.")
    for j, h in enumerate(["Item", "NGN M", "Note"], start=1):
        c = ws.cell(row=r, column=j, value=h)
        c.font = H
        c.fill = FILL_H
    r += 1
    doc_total = COMMITTED + FIT_SCHEDULED + FLOAT + 125.3
    trading_in = doc_total + CFA_FEE + PHASE_TWO - CONTRIB_TOTAL - g["peak"]
    bridge = [
        ("Cash already committed", COMMITTED, "Two years' head rent and fees, spent", False),
        ("Category A fit-out", FIT_SCHEDULED, "74 measured lines", False),
        ("Working capital float", FLOAT, "Medipark, to cash positive", False),
        ("The five clinical companies", 125.3, "Equipment, category B, opening stock, working capital", False),
        ("Capital table in the document", doc_total, "This is the NGN 598 M figure", True),
        ("Setup programme fee", CFA_FEE, "Not in the capital table, but it is cash out", False),
        ("Phase two, the theatre", PHASE_TWO, "Described as funded from trading, but trading has to reach it first", False),
        ("Occupier contributions on grant", -CONTRIB_TOTAL, "Cash in, on grant of each sub lease", False),
        ("Trading cash before the trough", -trading_in, "What the campus earns on the way down", False),
        ("Peak funding requirement", g["peak"], "The most the bank balance is ever under water, in month %d"
         % (g["cum"].index(min(g["cum"])) + 1), True),
    ]
    for label, val, note, bold in bridge:
        c = ws.cell(row=r, column=1, value=label)
        c.font = B if bold else N
        cc = ws.cell(row=r, column=2, value=round(val, 1))
        cc.font = B if bold else N
        cc.number_format = NUM
        cc.alignment = Alignment(horizontal="right")
        ws.cell(row=r, column=3, value=note).font = SM
        if bold:
            for j in range(1, 4):
                ws.cell(row=r, column=j).fill = FILL_T
        r += 1
    r += 1
    for line in [
        "The capital table and the funding requirement are not the same question. The table answers "
        "what the programme costs. This answers what has to be available, and it is about NGN %.0f M higher."
        % (g["peak"] - doc_total),
        "Two items drive the gap: the setup fee is real cash that the capital table does not carry, and "
        "the theatre is described as funded from trading, which is true only once trading has arrived.",
        "On the lean fit-out the trough is shallower. On a three month delay it is deeper, because the "
        "head rent runs whether or not anyone is in the building.",
    ]:
        ws.cell(row=r, column=1, value=line).font = SM
        r += 1

    # ----------------------------------------------------- 9 reconciliation
    ws = sheet(wb, "Reconciliation", [50, 16, 16, 16, 50], freeze="A4")
    r = title_row(ws, "Reconciliation to the division document",
                  "If these do not tie, one of the two is wrong.")
    for j, h in enumerate(["Item", "Document", "Model", "Difference", "Note"], start=1):
        c = ws.cell(row=r, column=j, value=h)
        c.font = H
        c.fill = FILL_H
    r += 1
    checks = [
        ("Group revenue at stabilisation", 1555.0, grp["rev"][HORIZON - 1] * 12,
         "Model annualises the last month; the document states run rate"),
        ("Attributable EBITDA", 404.0, att["ebitda"][HORIZON - 1] * 12, ""),
        ("Medipark revenue", 316.8, mp["rev"][HORIZON - 1] * 12, ""),
        ("Medipark EBITDA", 78.3, mp["ebitda"][HORIZON - 1] * 12, ""),
        ("Total programme cash", 598.0, g["peak"],
         "Document adds the components; model takes the true peak, which nets trading in"),
    ]
    for label, doc, mod, note in checks:
        ws.cell(row=r, column=1, value=label).font = N
        for j, v in ((2, doc), (3, mod), (4, mod - doc)):
            c = ws.cell(row=r, column=j, value=round(v, 1))
            c.font = N
            c.number_format = NUM
            c.alignment = Alignment(horizontal="right")
        ws.cell(row=r, column=5, value=note).font = SM
        r += 1

    wb.save(OUT)
    return g, a, grp, att, mp


if __name__ == "__main__":
    model = build()
    g, a, grp, att, mp = write(model)
    print("wrote %s" % OUT.name)
    print("  group      peak out %.0f  payback m%s (m%s from opening)  IRR %.1f%%  NPV %.0f"
          % (g["peak"], g["payback"], g["payback"] - 6, g["irr"] * 100, g["npv"]))
    print("  attrib     peak out %.0f  payback m%s (m%s from opening)  IRR %.1f%%  NPV %.0f"
          % (a["peak"], a["payback"], a["payback"] - 6, a["irr"] * 100, a["npv"]))
    print("  run rate   group rev %.0f  EBITDA %.0f  attributable %.0f"
          % (grp["rev"][-1] * 12, grp["ebitda"][-1] * 12, att["ebitda"][-1] * 12))
    print("  medipark   rev %.0f  EBITDA %.0f"
          % (mp["rev"][-1] * 12, mp["ebitda"][-1] * 12))
