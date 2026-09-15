"""
Solace Healthcare, Games Village Abuja: the model.

Five converted residential units, three phases, a monthly cash model over seven
years. Numbers only. No page furniture. The documents import this, not a copy.

Money is NGN millions unless a name says otherwise.
"""

from __future__ import annotations

HORIZON = 84           # months modelled
DAYS = 30.4
HURDLE = 0.25          # naira hurdle for NPV

# ---------------------------------------------------------------- the site ---
UNITS = 5
GROSS_SQM = 1_150.0            # planning assumption, pending measured survey
NET_FACTOR = 0.68
NET_SQM = GROSS_SQM * NET_FACTOR
P1_SQM = 760.0                 # converted in phase one
P2_SQM = GROSS_SQM - P1_SQM    # converted in phase two

# The Lyfe Place lesson: the brief understated gross by this much once measured.
SURVEY_VARIANCE = 0.342

OPEN_P1, OPEN_P2, OPEN_P3 = 9, 17, 22

# ------------------------------------------------------------ revenue lines ---
# name, opens, steady state NGN m/month, half-life months, direct cost ratio, phase
LINES = [
    ("Oncology day therapy",                 9,  121.5, 6.2, 0.66, 1),
    ("Radiology and imaging",                 9,   39.2, 4.0, 0.34, 1),
    ("Laboratory and pathology",              9,   56.3, 4.5, 0.46, 1),
    ("Day surgery, endoscopy, interventions",10,   99.8, 7.5, 0.42, 1),
    ("Family medicine, clinics, corporate",   9,   61.4, 2.8, 0.38, 1),
    ("Pharmacy and retail",                   9,   24.0, 3.5, 0.72, 1),
    ("Rehabilitation and physiotherapy",     11,   16.8, 6.9, 0.40, 1),
    ("Palliative and home based care",       12,   15.4, 8.6, 0.48, 1),
    ("Inpatient, day-of-surgery and HDU",    17,   57.8, 5.3, 0.44, 2),
    ("Renal dialysis",                       22,   34.0, 5.0, 0.52, 3),
]
SPOKE = "Diagnostic and clinic spoke"   # retired: no second property is being taken
SPOKE_CAPEX = 0.0

# Phase 3 is not a new building. It is the same walls worked harder: a six day week,
# evening sessions, more chairs. Only pays if the demand is there to fill it.
INTENSIFY = 1.12
INTENSIFY_LINES = ("Radiology and imaging", "Laboratory and pathology",
                   "Day surgery, endoscopy, interventions", "Family medicine, clinics, corporate")

# How each line's steady state is built. label, driver, unit price NGN '000, sessions
DRIVERS = [
    ("Oncology day therapy", "85 patients on active treatment each month",
     "NGN 1.43m blended per patient-month across cytotoxic, targeted and supportive"),
    ("Radiology and imaging", "24 ultrasound, 16 plain film, 9 breast studies a day",
     "No computed tomography and no magnetic resonance on site. Both go to the flagship"),
    ("Laboratory and pathology", "135 tests a day plus 110 histopathology cases a month",
     "STAT and routine in house, molecular and immunohistochemistry sent out"),
    ("Day surgery, endoscopy, interventions", "80 theatre cases, 105 endoscopies, 70 access procedures a month",
     "two lists a day once the second theatre opens"),
    ("Family medicine, clinics, corporate", "85 clinic visits a day plus 6,500 retained lives",
     "the promoter's own practice is the opening base"),
    ("Pharmacy and retail", "outpatient dispensing attached to clinic and day case volume",
     "excludes oncology drugs, which sit in the oncology line"),
    ("Rehabilitation and physiotherapy", "38 sessions a day",
     "oncology rehabilitation, lymphoedema, post-surgical and musculoskeletal"),
    ("Palliative and home based care", "48 households on an active package",
     "requires a controlled drug licence, which is a phase one filing"),
    ("Inpatient, day-of-surgery and HDU", "20 beds at 55 per cent occupancy",
     "three of them high dependency, four ring-fenced for palliative admissions"),
    ("Renal dialysis", "10 stations, two shifts a day, six days a week",
     "Fits a residential unit without structural work and suits the same patients"),
]

# ------------------------------------------------------------------ payors ---
# name, share of revenue, days to cash
PAYORS = [
    ("Out of pocket and family funded, including diaspora", 0.44, 0),
    ("Corporate self-funded, retainers, missions",          0.21, 38),
    ("Private health maintenance organisations",            0.21, 82),
    ("NHIA formal sector, Cancer Health Fund, vulnerable group fund", 0.10, 135),
    ("Charity, manufacturer access programmes, non-governmental", 0.04, 60),
]
DSO = sum(s * d for _, s, d in PAYORS)
DIO, DPO = 34, 26

# ------------------------------------------------------------------- capex ---
CAPEX = {
    0: [("Measured survey, structural and services investigation", 14.0),
        ("Change of use, planning and development control", 16.0),
        ("Architecture and engineering, design to tender", 32.0),
        ("Corporate formation, shareholders' agreement, legal", 16.0)],
    1: [("Conversion, structure and clinical fit-out, %d sqm" % P1_SQM, 326.8),
        ("Power: transformer, synchronised generation, uninterruptible supply, solar", 96.0),
        ("Ventilation, medical gas, water treatment", 78.0),
        ("Radiology equipment: ultrasound, digital radiography, mammography", 132.0),
        ("Radiology rooms, shielding and regulatory authorisation", 24.0),
        ("Laboratory, reagent rental deposits and histopathology", 54.0),
        ("Oncology day unit, 14 chairs, compounding isolator and clean room", 162.0),
        ("Theatre one, endoscopy suite and sterile services", 296.0),
        ("Rehabilitation gymnasium", 34.0),
        ("Records system, network, furniture, security, signage", 112.0),
        ("Ambulance", 46.0),
        ("Commissioning, licences, radiation authority, staff training", 52.0)],
    2: [("Conversion of the remaining %d sqm" % P2_SQM, 167.7),
        ("Bed lift, external shaft and supporting structure", 104.0),
        ("Ward fit-out, 20 beds including three high dependency", 188.0),
        ("Theatre two", 142.0),
        ("Oxygen plant, services upgrade, additional sterile capacity", 46.0)],
    3: [("Dialysis unit: 10 stations, water treatment, conversion of the last unit", 165.0),
        ("Centre of excellence: accreditation, registry, tumour board, trials unit", 118.0),
        ("Additional infusion chairs and works to support a six day week", 40.0),
        ("Reporting platform and remote multidisciplinary team capability", 44.0)],
}
CAPEX_MONTHS = {0: range(1, 4), 1: range(3, 10), 2: range(11, 18), 3: range(19, 25)}
CAPEX_WEIGHTS = {
    0: [1 / 3, 1 / 3, 1 / 3],
    1: [0.083, 0.146, 0.187, 0.208, 0.194, 0.125, 0.057],
    2: [0.093, 0.170, 0.201, 0.201, 0.170, 0.108, 0.057],
    3: [0.112, 0.179, 0.223, 0.223, 0.156, 0.107],
}
CAPEX_TOTAL = {k: sum(v for _, v in items) for k, items in CAPEX.items()}

# --------------------------------------------------------------- overheads ---
# Fixed monthly cost that does not move with a single line. Excludes CFA fees.
OVERHEAD_STEPS = [(1, 4.0), (4, 9.0), (7, 26.0), (OPEN_P1, 74.0),
                  (OPEN_P2, 106.0), (OPEN_P3, 124.0)]
OVERHEAD_DETAIL = [
    ("Salaried clinical and scientific establishment", 58.0),
    ("Power, fuel and hybrid generation", 14.0),
    ("Estate, security, cleaning, waste and laundry", 9.0),
    ("Equipment service contracts and biomedical engineering", 7.0),
    ("Marketing, business development and referral programme", 9.0),
    ("Indirect consumables", 4.0),
    ("Records system, connectivity and telephony", 3.5),
    ("Insurance and professional indemnity", 3.0),
    ("Professional, regulatory and audit", 2.5),
    ("Facility leadership and administration", 8.0),
]

# ------------------------------------------------------------- CFA fee card ---
RATES = {"Partner": 750, "Principal": 450, "Senior consultant": 300,
         "Consultant": 190, "Analyst": 120}          # NGN '000 a day
GRADES = list(RATES)
PROGRAMME_RATE = 0.10                                 # single structural concession
MOBILISATION = 25.0                                   # NGN m, non-refundable

# phase, workstream, [partner, principal, senior, consultant, analyst]
WORK = [
    (0, "Measured survey, technical feasibility and conversion strategy", [4, 9, 12, 12, 10]),
    (0, "Catchment, demand and competitor mapping", [2, 5, 8, 10, 14]),
    (0, "Service model and clinical pathway design", [6, 10, 12, 8, 5]),
    (0, "Payor strategy, tariff architecture and revenue cycle design", [4, 8, 10, 10, 8]),
    (0, "Financial model, funding plan and investment case", [4, 9, 8, 6, 13]),
    (0, "Regulatory critical path and consents lodged", [3, 6, 9, 10, 6]),
    (0, "Corporate structure, shareholders' agreement, consultant panel", [7, 8, 6, 5, 4]),
    (1, "Design management and technical delivery oversight", [6, 20, 30, 34, 18]),
    (1, "Procurement, managed equipment negotiation, vendor contracting", [6, 16, 22, 26, 20]),
    (1, "Licensing, accreditation and radiation authorisation", [4, 12, 20, 24, 12]),
    (1, "Clinical and management recruitment, credentialing, privileges", [7, 16, 22, 24, 14]),
    (1, "Payor contracting and revenue cycle build", [5, 14, 18, 18, 16]),
    (1, "Commissioning, systems, policies and opening readiness", [6, 14, 16, 14, 16]),
    (2, "Inpatient design, vertical circulation and ward delivery", [5, 14, 20, 24, 14]),
    (2, "Theatre two, sterile services and perioperative model", [4, 12, 18, 22, 12]),
    (2, "Workforce step-up, rostering and night cover", [5, 14, 20, 22, 14]),
    (2, "Working capital control and payor performance management", [8, 20, 26, 28, 20]),
    (3, "Centre of excellence strategy and accreditation programme", [8, 16, 20, 18, 12]),
    (3, "Second site: siting, lease, fit-out and opening", [6, 14, 18, 18, 14]),
    (3, "Outcomes registry, tumour board and training post accreditation", [6, 12, 14, 12, 10]),
    (3, "Group structure, capital raise and investor readiness", [6, 10, 10, 10, 8]),
]
FEE_MONTHS = {0: (1, 3), 1: (3, 11), 2: (10, 18), 3: (18, 27)}

# Build and operate option, tabled separately and not in the base model.
OPERATE = [
    ("Delivery", "NGN 90m fixed, 25 on signature and the balance over 36 trading months",
     "Paid for the programme, not for the size of your building."),
    ("Capital efficiency share", "20 per cent of cash saved against an independently benchmarked budget, capped at NGN 60m",
     "The one fee line where we are paid to spend less of your money."),
    ("Establishment", "NGN 22m per licensed entity plus NGN 6m on each licence granted",
     "Three entities are likely: the hospital, the laboratory, the home care service."),
    ("Management", "9 per cent of contribution, floor NGN 12m a month, plus 20 per cent of earnings above a 22 per cent margin",
     "On contribution, not revenue, because a third of your revenue is drug pass-through."),
    ("Equity", "12 per cent of the operating company", "Only on the build and operate track."),
]

RECRUIT = [
    ("Consultant and clinical lead", "22 per cent of first year total cost", "Floor NGN 3.2m"),
    ("Senior management", "22 per cent of first year total cost", "Floor NGN 2.8m"),
    ("Nursing, scientific and allied", "18 per cent of first year total cost", "Floor NGN 850k"),
    ("Diaspora and emeritus placement", "22 per cent, plus mobilisation at cost", "Floor NGN 3.8m"),
]


# ------------------------------------------------------------------ engine ---
def maturity(month, opens, half_life):
    e = month - opens + 1
    return 0.0 if e < 1 else e / (e + half_life)


def line_rev(month, include_spoke=True):
    out = {}
    for name, opens, steady, hl, _dcr, _ph in LINES:
        if name == SPOKE and not include_spoke:
            continue
        out[name] = steady * maturity(month, opens, hl)
    return out


def overhead(month, delay=0):
    v = 0.0
    for start, amount in OVERHEAD_STEPS:
        if month >= start + (delay if start >= OPEN_P1 else 0):
            v = amount
    return v if month >= 1 else 0.0


def capex_schedule(capex_mult=1.0, delay=0, drop_spoke=False):
    sched = [0.0] * (HORIZON + 1)
    for ph, months in CAPEX_MONTHS.items():
        total = CAPEX_TOTAL[ph] - (SPOKE_CAPEX if (ph == 3 and drop_spoke) else 0.0)
        mult = capex_mult if ph else 1.0
        for w, mth in zip(CAPEX_WEIGHTS[ph], months):
            sched[min(mth + (delay if ph else 0), HORIZON)] += total * w * mult
    return sched


def fee_by_phase():
    out = {}
    for ph in (0, 1, 2, 3):
        gross = sum(sum(d * RATES[g] for d, g in zip(days, GRADES))
                    for p, _w, days in WORK if p == ph) / 1000.0
        out[ph] = gross
    return out


def fee_schedule(delay=0):
    sched = [0.0] * (HORIZON + 1)
    net = {ph: v * (1 - PROGRAMME_RATE) for ph, v in fee_by_phase().items()}
    for ph, (a, b) in FEE_MONTHS.items():
        n = b - a + 1
        for mth in range(a, b + 1):
            sched[min(mth + (delay if ph else 0), HORIZON)] += net[ph] / n
    return sched


def build(line_mult=None, dso=None, capex_mult=1.0, delay=0,
          drop_spoke=False, overhead_mult=1.0, dcr_override=None, intensify=True):
    """One monthly run. Every stress case is this function with different arguments."""
    line_mult = line_mult or {}
    dso = DSO if dso is None else dso
    dcr = {n: d for n, _o, _s, _h, d, _p in LINES}
    dcr.update(dcr_override or {})
    cap = capex_schedule(capex_mult, delay, drop_spoke)
    fee = fee_schedule(delay)
    rev, direct, ovh, ebitda, nwc, cash, cum = ([0.0] * (HORIZON + 1) for _ in range(7))
    prev_nwc = 0.0
    for t in range(1, HORIZON + 1):
        lr = {}
        for name, opens, steady, hl, _d, _p in LINES:
            v = steady * line_mult.get(name, 1.0) * maturity(t, opens + delay, hl)
            if intensify and name in INTENSIFY_LINES and t >= OPEN_P3 + delay:
                v *= INTENSIFY
            lr[name] = v
        r = sum(lr.values())
        d = sum(v * dcr[k] for k, v in lr.items())
        o = overhead(t, delay) * overhead_mult
        rev[t], direct[t], ovh[t] = r, d, o
        ebitda[t] = r - d - o
        nwc[t] = r * dso / DAYS + d * (DIO - DPO) / DAYS
        cash[t] = ebitda[t] - cap[t] - fee[t] - (nwc[t] - prev_nwc)
        prev_nwc = nwc[t]
        cum[t] = cum[t - 1] + cash[t]
    return dict(rev=rev, direct=direct, ovh=ovh, ebitda=ebitda, nwc=nwc,
                cash=cash, cum=cum, capex=cap, fee=fee)


def irr(flows, lo=-0.9, hi=3.0):
    f = lambda r: sum(c / (1 + r) ** (i / 12) for i, c in enumerate(flows))
    if f(lo) * f(hi) > 0:
        return None
    for _ in range(200):
        mid = (lo + hi) / 2
        lo, hi = (mid, hi) if f(mid) > 0 else (lo, mid)
    return (lo + hi) / 2


def metrics(M):
    cum, cash = M["cum"], M["cash"]
    trough = min(range(1, HORIZON + 1), key=lambda t: cum[t])
    payback = next((t for t in range(trough, HORIZON + 1) if cum[t] >= 0), None)
    npv = sum(cash[t] / (1 + HURDLE) ** (t / 12) for t in range(1, HORIZON + 1))
    return dict(peak=-cum[trough], trough_m=trough, payback=payback, npv=npv,
                irr=irr([0.0] + cash[1:]))


def crosses(M, target=400.0):
    return next((t for t in range(1, HORIZON + 1) if M["rev"][t] >= target), None)


# ------------------------------------------------------------ stress suite ---
ONCO, RAD, SURG = ("Oncology day therapy", "Radiology and imaging",
                   "Day surgery, endoscopy, interventions")
DRIFT_DSO = 55.4   # payor mix drifts to 40 per cent HMO
ONCO_DCR_GOOD = 0.60   # drug cost if access programme sourcing lands, against 0.66 planned

STRESS = [
    ("Base case", {}),
    ("Oncology reaches 55 patients a month, not 85", dict(line_mult={ONCO: 55 / 85})),
    ("Payors drift to 40 per cent HMO, cash takes 55 days", dict(dso=DRIFT_DSO)),
    ("Conversion 25 per cent over and three months late", dict(capex_mult=1.25, delay=3)),
    ("The same walls cannot be worked harder", dict(intensify=False)),
    ("Dialysis never happens", dict(line_mult={"Renal dialysis": 0.0})),
    ("The flagship will not take your scans on a timetable", dict(line_mult={SURG: 0.82})),
    ("The flagship opens a lower tier and takes a quarter of oncology",
     dict(line_mult={ONCO: 0.75})),
    ("The flagship hires two of your anchor surgeons", dict(line_mult={SURG: 0.65})),
    ("Oncology short and payors drift together",
     dict(line_mult={ONCO: 55 / 85}, dso=DRIFT_DSO)),
    ("Those two, and no second site",
     dict(line_mult={ONCO: 55 / 85}, dso=DRIFT_DSO, drop_spoke=True)),
]


def solve(fn, lo, hi, higher_is_worse=False, integer=False):
    """Bisect for the value of a single assumption at which NPV turns negative."""
    for _ in range(40):
        mid = (lo + hi) / 2
        v = int(round(mid)) if integer else mid
        good = metrics(build(**fn(v)))["npv"] > 0
        if higher_is_worse:
            lo, hi = (mid, hi) if good else (lo, mid)
        else:
            lo, hi = (lo, mid) if good else (mid, hi)
    return (lo + hi) / 2
