"""
Lyfe Place Abuja: the campus model.

This supersedes the fixed demise model in build-lyfeplace-model.py. The difference is
structural, not cosmetic:

  * downstairs is a RENT line. The conversion clinic is a tenant, so its clinical
    revenue is not ours and does not appear here. Only what it pays us does.
  * upstairs is a SESSIONAL business. Rooms are typed rather than demised, and the
    same six rooms carry our own clinics in the working day and visiting consultants
    in the evenings and on Saturdays.
  * the driver is CONSULTANTS SIGNED, not floor area let. Capacity is prime-time
    room hours, which run out at about fifty consultants on the current room count.

Pricing comes from the premium medipark consultant survey, n=20, run 12 to 19 August
2026. Where the survey speaks, it wins. Where it is silent, the assumption is tagged
JUDGEMENT in ASSUMPTIONS and is meant to be argued with.

    python3 scripts/lyfeplace_campus.py        # prints the reconciliation

Import `build()` for the monthly series and `metrics()` for returns. NGN millions,
revenue positive, cost negative, month 1 is the month the setup programme is instructed.
"""

from __future__ import annotations

HORIZON = 60


# =============================================================================
# GEOMETRY. Measured from the as-built CAD by scripts/lyfeplace_survey.py.
# =============================================================================
GROUND_NET, FIRST_NET, CHALET_NET, BQ_NET = 282.2, 284.1, 61.0, 37.0
NET = GROUND_NET + FIRST_NET + CHALET_NET + BQ_NET          # 664.3
GROSS = 2 * (24.695 * 16.317) + 96.0 + 52.0                 # 953.9

# ---- ground floor. Reception is shared services and the theatre is the campus's.
# Everything else down here is rentable to the conversion clinic. Diagnostics sits in
# the guest chalet and the pharmacy in the boys' quarters, so neither takes ground
# floor area from the clinic.
GF_SHARED = 105.2        # reception 42.0, spine 14.0, stair, staff, vestibule, porch, WCs, utilities
GF_LETTABLE = GROUND_NET - GF_SHARED                                    # 177.0
THEATRE_SQM = 64.0       # theatre 32.8, recovery 19.2, dirty utility 6.9, scrub 5.1
CONV_SQM = GF_LETTABLE - THEATRE_SQM                                    # 113.0 with a theatre

# ---- first floor, typed rather than demised
ROOMS_CONSULT = 3        # the 41.8 living room subdivided into 2, plus the 18.9 bedroom
ROOMS_PROC = 3           # 26.1 with 360 degree access, 21.1, 20.8
INFUSION_SQM = 33.4      # 4 bays, dedicated. Leaves the bookable pool
RELAX_SQM = 32.9         # the living room at the head of the stair
CONNECT_SQM = 15.4       # the playroom
FF_SUPPORT = FIRST_NET - (41.8 + 18.9 + 26.1 + 21.1 + 20.8
                          + INFUSION_SQM + RELAX_SQM + CONNECT_SQM)     # 73.7

BOOKABLE = ROOMS_CONSULT + ROOMS_PROC
WEEKS = 50
PRIME_H_WK = 4 * 5 + 8   # weekday 17:00-21:00 plus Saturday 09:00-17:00
DAY_H_WK = 8 * 5         # weekday 09:00-17:00
PRIME_CAP_WK = PRIME_H_WK * BOOKABLE


# =============================================================================
# PRICING. From the survey where it speaks.
# =============================================================================
# van Westendorp on a 4 hour block: too cheap 20k, good value 60k, OPP 65k,
# IPP 85k, getting expensive 100k, too expensive 200k. A 2 hour unit at the
# 35,000 rack lands at 70,000, which sits on the optimal price point.
UNIT_H = 2
RACK_HR = 35_000
PROC_MULT = 2.00         # procedure couch, operating light, suction, monitor, sterile field.
                         # Double the consulting room, which is a rate card anyone can remember
# The theatre is quoted as a rate, not a multiple: NGN 150,000 an hour, which happens to
# be about 4.3 times the consulting room. Anaesthesia, HEPA, scrub, two recovery bays.
# It is a published rate for ad hoc use; theatre lists are sold by the session and are
# priced in THEATRE_OWN and THEATRE_EXT_FEE, which is what the model actually runs on.
THEATRE_HR = 150_000
THEATRE_MULT = THEATRE_HR / RACK_HR
BLOCK_DISC, DAY_DISC = 0.82, 0.72

# tiers, weighted by the survey's own membership distribution (Q13)
TIERS = [
    ("Guest, no membership", 0.25, 1.00, 0,
     "25% said they would not pay a membership at all"),
    ("Entry, NGN 350k", 0.38, 0.90, 350_000, "38% sit under NGN 500k"),
    ("Practice, NGN 750k", 0.19, 0.80, 750_000, "19% sit at NGN 500k to 1M"),
    ("Founding, NGN 1.5M", 0.19, 0.70, 1_500_000, "19% would pay NGN 1M or more"),
]
TIER_FACTOR = sum(w * f for _n, w, f, _m, _d in TIERS)
MEMBERSHIP_PER_CONSULTANT = sum(w * m for _n, w, _f, m, _d in TIERS)

CONSULT_SHARE = 0.65     # Q15: a real share of them need procedure space, not a desk
EQUIP_ATTACH = 0.35      # JUDGEMENT
EQUIP_PER_SESSION = 30_000
EQUIP_TIER_FACTOR = 0.94  # founding tier only, so barely tapered

SESS_PER_CONSULTANT_WK = 1.65      # Q5: none 1, one 9, two 6, three 4
LET_COST_HR = 9_000                # reception, booking, billing and a nurse against a let hour

BLEND_HR = CONSULT_SHARE * RACK_HR + (1 - CONSULT_SHARE) * RACK_HR * PROC_MULT
SESSION_PRICE = BLEND_HR * UNIT_H * TIER_FACTOR


# =============================================================================
# THE BUSINESSES
# =============================================================================
# Downstairs is rent. NGN per sqm per year, all in.
TENANTS = [
    # Built up from cost rather than picked: rent 111,771 (head rent at a 35% landlord
    # margin), fit-out recovery 71,413 (its 40.3 M share over a 5 year term), service
    # charge 149,029 (17% of power, security, cleaning, facilities, insurance,
    # regulatory, reception and ICT). Cost of housing them is 332,214. At the old
    # 285,000 the campus was subsidising them by about 5.3 M a year.
    ("Alameda Conversion Clinic", CONV_SQM, 400_000, 6,
     "The whole ground floor bar reception and the theatre. A tenant, so its clinical "
     "revenue is not ours. Rent, fit-out recovery and service charge, quoted as three "
     "lines rather than one number"),
    ("Medbury Diagnostics", CHALET_NET + 4.6, 240_000, 3,
     "Laboratory and imaging in the guest chalet, plus a draw point upstairs"),
    ("Medbury Pharmaceuticals", BQ_NET, 200_000, 3,
     "Dispensary, retail and cold chain in the boys' quarters"),
]

# Our own clinics upstairs. hours is room hours a year, which is what they cost us.
OWN_CLINICS = [
    ("Medlyfe Aesthetics and Regenerative", 285.0, 82.0, 1187, 3, 15, 0.51,
     "About 1,580 treatments at 45 minutes. Runs in the working day"),
    ("Lyfe Place Hair Restoration", 220.0, 55.0, 1056, 3, 15, 1.00,
     "132 FUE cases at 8 hours. Occupies one procedure room for most of three days"),
    # GLP-1 95.2 (122 patients), swallowable balloons 96.0 (24 cases at 4.0 M, placed
    # without endoscopy or sedation so they open with the campus), endoscopic balloon and
    # sleeve gastroplasty 60.0 (12 at 5.0 M, from month 9 when the stack lands), gastric
    # botox and minor endoscopic 12.0. Surgery is separate and gated on the theatre.
    ("Bariatric, Metabolic and Endoscopic", 263.0, 66.0, 1450, 3, 15, 0.70,
     "GLP-1 and dietetics, swallowable balloons from month 3, endoscopic balloon, sleeve "
     "gastroplasty and gastric botox from month 9. Surgery only if the theatre is built"),
    ("Medlyfe Longevity and Infusion", 240.0, 71.0, 0, 3, 12, 1.00,
     "Four dedicated bays, so it does not compete for the bookable rooms"),
]

# Theatre lists. Own use is ours; external use is the growth line and the survey
# evidences it: 30% of respondents perform procedures needing a full theatre.
THEATRE_OWN = [("Bariatric surgery", 34, 600_000), ("Aesthetic day surgery", 120, 350_000),
               ("Hair restoration long cases", 66, 250_000)]
THEATRE_SESSIONS_YR = 2 * 6 * WEEKS               # 600
THEATRE_EXT_FEE = 450_000
THEATRE_EXT_SHARE = 0.30       # Q15, share of signed consultants who do theatre work
THEATRE_LISTS_PER_SURGEON = 12
THEATRE_OPEN_M, THEATRE_RAMP = 11, 18
THEATRE_RUN_COST = 18.0

# ---- consultants signed. The single number the upstairs runs on.
# 45 against a prime capacity ceiling of ~50, reached 18 months after opening. The
# 18 months is not free: it assumes the business development officer is in post from
# month 4 and the NGN 9 M a year recruitment line is actually spent. At 30 months the
# whole programme is marginal, so this is the assumption to defend or abandon.
CONSULTANTS_TARGET = 45
CONSULTANTS_OPEN_M = 3
CONSULTANTS_RAMP_M = 18        # months from opening to target
CONSULTANTS_CAP = int(PRIME_CAP_WK / (SESS_PER_CONSULTANT_WK * UNIT_H))   # ~50


# =============================================================================
# CAMPUS COST AND CAPITAL
# =============================================================================
CAMPUS_COST = [
    ("Head rent", 55.0, 1, 1, "In the P&L from month 1, not in cash until month 25"),
    ("Power and utilities", 32.0, 2, 6, "From commissioning, not from the first patient"),
    ("Reception, concierge and booking", 18.0, 2, 6, "The front of house the survey values at 85%"),
    ("Nursing and chaperone pool", 20.0, 3, 9, "85% called it important or essential"),
    ("Security, cleaning and grounds", 16.0, 1, 3, "Contracted. 954 sqm gross plus the compound"),
    ("Front office, billing and collections", 16.0, 2, 6, "75% called billing handled important"),
    ("Equipment lease", 14.0, 5, 3, "Laser and IPL platform"),
    ("Facilities and maintenance", 13.0, 3, 9, "Planned and reactive"),
    ("Sterilising, waste and linen", 10.2, 3, 12, ""),
    ("ICT, booking platform and connectivity", 11.0, 1, 3, "Session booking is 65% important"),
    ("Insurance", 6.0, 1, 1, ""),
    ("Care coordination", 6.0, 3, 6, ""),
    ("Brand, digital and demand generation", 30.0, 1, 4,
     "Consultant acquisition 12, brand, content, PR and partnerships 8, shared digital "
     "platform and campus level paid 10. The clinics' own patient acquisition, roughly "
     "NGN 67 to 84 M a year, already sits inside their margins and is not counted twice here"),
    ("Business development and consultant recruitment", 9.0, 1, 3,
     "In post from month 1, before the doors open. The consultant ramp is the whole\n     business and it cannot start after opening"),
    ("Regulatory, permits and waste licence", 3.0, 1, 1, ""),
    ("Other direct", 1.0, 3, 6, ""),
]

# The fit-out after the line by line review of 24 August. NGN 216.0 M base plus 10 per
# cent contingency. NGN 85.3 M out of the original schedule, and nothing statutory or
# clinical was touched. Section by section against the original:
#   A  preliminaries      21.2 -> 12.8   site set up repriced to a 2 month programme,
#                                        strip out only what we fit, two openings not three
#   B  partitions, doors  44.5 -> 22.3   six bookable rooms day one, not sixteen
#   C  finishes           59.6 -> 52.3   clinical vinyl to the theatre and procedure rooms only
#   D  electrical         35.8 -> 17.9   lighting and small power phased with occupancy
#   E  cooling            29.4 -> 29.4   all 28 units on day one, deliberately not phased
#   F  plumbing           16.4 ->  9.4   fewer points, but clinical infrastructure stays
#   G  fire and security  25.1 -> 20.8   CCTV kept on capital, access control halved
#   J  external works     20.8 -> 10.4   car park, painting and compound deferred
#   K  statutory          19.7 -> 19.7   12.0 of it is the architect, M&E and QS at cost
FIT_LEAN, FIT_SCHEDULED_FULL = 237.2, 323.0

# Clinical and basic equipment the CAMPUS must own. Not in the fit-out, whose furniture
# line is explicitly non clinical, and not in the clinical companies' capital, which is
# their own kit. The six rooms are let by the hour rather than demised, so whoever books
# one expects to find it equipped.
EQUIPMENT = [
    # (item, qty, unit cost NGN, group)
    ("Hydraulic 3 section procedure couch", 3, 1_600_000, "Procedure rooms"),
    ("Mobile LED procedure light", 3, 1_100_000, "Procedure rooms"),
    ("Vital signs monitor", 3, 1_200_000, "Procedure rooms"),
    ("Suction unit", 3, 400_000, "Procedure rooms"),
    ("Instrument trolley and Mayo stand", 3, 350_000, "Procedure rooms"),
    ("Stainless prep trolley", 3, 250_000, "Procedure rooms"),
    ("Minor procedure instrument sets, 3 per room", 9, 200_000, "Procedure rooms"),
    ("Examination couch", 3, 600_000, "Consulting rooms"),
    ("Mobile examination light", 3, 350_000, "Consulting rooms"),
    ("Diagnostic set: BP, otoscope, ophthalmoscope", 3, 450_000, "Consulting rooms"),
    ("Scale and stadiometer", 3, 200_000, "Consulting rooms"),
    ("Dressing trolley", 3, 150_000, "Consulting rooms"),
    ("Resuscitation trolley and defibrillator", 1, 2_500_000, "Shared clinical"),
    ("Autoclave, class B, and instrument washer", 1, 3_000_000, "Shared clinical"),
    ("ECG, 12 lead", 1, 800_000, "Shared clinical"),
    ("Drug refrigerator with temperature logging", 1, 900_000, "Shared clinical"),
    ("Emergency drugs and clinical consumables, opening stock", 1, 1_200_000, "Shared clinical"),
    ("Nebuliser and small devices", 1, 150_000, "Shared clinical"),
    ("Wheelchairs and patient transfer chair", 3, 200_000, "Patient handling"),
    ("Bariatric weighing chair", 1, 400_000, "Patient handling"),
    ("Linen trolleys", 4, 75_000, "Patient handling"),
    ("Sharps, clinical waste bins, spill kits, PPE stock", 1, 550_000, "Patient handling"),
    ("Workstations and monitors", 8, 120_000, "Front office"),
    ("Printers, scanners and card readers", 6, 120_000, "Front office"),
    ("Practice management and booking software, year one", 1, 2_500_000, "Front office"),
]
SESSIONAL_EQUIPMENT = sum(q * c for _n, q, c, _g in EQUIPMENT) / 1e6

# Launch marketing, one off, drawn across the three months to opening. Brand and
# identity 10, website and booking front end 8, photography and virtual tour 4,
# launch event and consultant open evenings 8. The 45 consultant ramp is not
# credible without it, and the ramp is the whole business.
MARKETING_LAUNCH = 30.0

# The infusion suite's own kit (4 chairs, pumps, bay monitors, warming cabinet, about
# NGN 9.7 M) sits inside Medlyfe Longevity's capital, not here, because that suite is
# dedicated to one company rather than let by the hour. If it is ever let sessionally
# it moves across to this list.
FIT_SCHEDULED = FIT_LEAN
FLOAT, COMMITTED, CONTRIB_TOTAL = 35.0, 115.0, 61.1
CFA_FEE, CFA_MOB = 45.50, 25.0
THEATRE_CAPITAL = 157.0
OWN_CLINIC_CAPITAL = {"Medlyfe Aesthetics and Regenerative": 41.4,
                      "Lyfe Place Hair Restoration": 14.9,
                      "Bariatric, Metabolic and Endoscopic": 67.0,
                      "Medlyfe Longevity and Infusion": 25.7}
# Two months on site, opening in month 3. Design and strip out run together in month 1,
# the build is months 1 and 2, and month 3 is commissioning and opening. Nothing in the
# construction blocks this. Two things outside the contractor's control do:
#   1. long lead items, 6 to 12 weeks. They must be ordered on day one, not when the
#      contractor mobilises. Cooling, medical gas, nurse call.
#   2. the FCT facility licence, the fire certificate and the waste permit. You cannot
#      open a clinical facility without them and they are not in our gift.
# If the licence slips, this whole schedule slips with it and nothing else recovers it.
FIT_SPEND = {1: .30, 2: .45, 3: .25}
FEE_SPEND = {1: CFA_MOB / CFA_FEE}
for _m in range(2, 11):
    FEE_SPEND[_m] = (1 - CFA_MOB / CFA_FEE) / 9
# CFA operates the campus. The fee is subordinated to Medbury's return of capital:
# the lower rate applies until the money is home, the higher one after.
MGMT_FEE_BEFORE = 0.075       # of campus revenue, until capital is returned
MGMT_FEE_AFTER = 0.100
MGMT_FEE_START_M = 3          # from the month it opens, not from instruction

HEAD_RENT, RENT_PREPAID_TO, RENT_ESC = 55.0, 24, 0.12
DISCOUNT = 0.25


# =============================================================================
# ENGINE
# =============================================================================
def ramp(i, n):
    """Smoothstep 0 to 1 over n months. i is months since opening, 1 based."""
    if i <= 0:
        return 0.0
    if i >= n:
        return 1.0
    x = i / n
    return x * x * (3 - 2 * x)


def series(annual, open_m, full_m):
    return [annual / 12 * ramp(m - open_m + 1, full_m) if m >= open_m else 0.0
            for m in range(1, HORIZON + 1)]


def consultants_signed():
    """Signed consultants by month, capped by prime time capacity."""
    out = []
    for m in range(1, HORIZON + 1):
        n = CONSULTANTS_TARGET * ramp(m - CONSULTANTS_OPEN_M + 1, CONSULTANTS_RAMP_M)
        out.append(min(n, CONSULTANTS_CAP))
    return out


def build():
    ms = list(range(1, HORIZON + 1))
    cons = consultants_signed()

    # ---------------------------------------------------------------- upstairs
    sessions = [c * SESS_PER_CONSULTANT_WK * WEEKS / 12 for c in cons]      # a month
    room_fees = [s * SESSION_PRICE / 1e6 for s in sessions]
    equip = [s * EQUIP_ATTACH * EQUIP_PER_SESSION * EQUIP_TIER_FACTOR / 1e6 for s in sessions]
    membership = [c * MEMBERSHIP_PER_CONSULTANT / 1e6 / 12 for c in cons]
    let_cost = [-s * UNIT_H * LET_COST_HR / 1e6 for s in sessions]
    sessional_rev = [room_fees[i] + equip[i] + membership[i] for i in range(HORIZON)]

    # ---------------------------------------------------------------- downstairs
    rent_lines = {n: series(a * r / 1e6, o, 3) for n, a, r, o, _d in TENANTS}
    rent = [sum(rent_lines[n][i] for n in rent_lines) for i in range(HORIZON)]

    # ---------------------------------------------------------------- own clinics
    own_rev, own_eb = {}, {}
    for n, rev, eb, _h, o, f, _s, _d in OWN_CLINICS:
        r = series(rev, o, f)
        own_rev[n] = r
        margin = eb / rev
        own_eb[n] = [r[i] * margin * (0.35 + 0.65 * ramp(m - o + 1, f)) if m >= o else 0.0
                     for i, m in enumerate(ms)]

    # ---------------------------------------------------------------- theatre
    own_lists = sum(n * fee for _l, n, fee in THEATRE_OWN) / 1e6
    ext_lists = [c * THEATRE_EXT_SHARE * THEATRE_LISTS_PER_SURGEON for c in cons]
    theatre_rev = []
    for i, m in enumerate(ms):
        r = ramp(m - THEATRE_OPEN_M + 1, THEATRE_RAMP)
        ext = min(ext_lists[i], THEATRE_SESSIONS_YR - sum(n for _l, n, _f in THEATRE_OWN))
        theatre_rev.append((own_lists * r + ext * THEATRE_EXT_FEE / 1e6 * r) / 12)
    theatre_cost = series(THEATRE_RUN_COST, THEATRE_OPEN_M, 12)

    # ---------------------------------------------------------------- campus cost
    cost_lines = {n: series(v, o, f) for n, v, o, f, _d in CAMPUS_COST}
    campus_cost = [-sum(cost_lines[n][i] for n in cost_lines) - theatre_cost[i]
                   + let_cost[i] for i in range(HORIZON)]

    campus_rev = [rent[i] + sessional_rev[i] + theatre_rev[i] for i in range(HORIZON)]
    # management fee steps up once cumulative cash turns positive
    mgmt = []
    run = 0.0
    for i, mth in enumerate(ms):
        rate = MGMT_FEE_BEFORE if run < 0 or mth < MGMT_FEE_START_M else MGMT_FEE_AFTER
        mgmt.append(-campus_rev[i] * rate if mth >= MGMT_FEE_START_M else 0.0)
        run += campus_rev[i] + campus_cost[i]
    campus_cost = [campus_cost[i] + mgmt[i] for i in range(HORIZON)]
    campus_eb = [campus_rev[i] + campus_cost[i] for i in range(HORIZON)]

    # ---------------------------------------------------------------- capital
    rent_cash = []
    for m in ms:
        if m <= RENT_PREPAID_TO:
            rent_cash.append(0.0)
        else:
            rent_cash.append(-HEAD_RENT / 12 * (1 + RENT_ESC) ** ((m - RENT_PREPAID_TO - 1) // 12))
    rent_adj = [rent_cash[i] + cost_lines["Head rent"][i] for i in range(HORIZON)]

    capex = [-FIT_SCHEDULED * FIT_SPEND.get(m, 0.0) for m in ms]
    p2 = [-THEATRE_CAPITAL / 3 if m in (13, 14, 15) else 0.0 for m in ms]
    own_capex = [0.0] * HORIZON
    for n, cap in OWN_CLINIC_CAPITAL.items():
        o = next(x[4] for x in OWN_CLINICS if x[0] == n)
        own_capex[o - 2] -= cap
    sess_equip = [-SESSIONAL_EQUIPMENT if m == CONSULTANTS_OPEN_M - 1 else 0.0 for m in ms]
    mkt_launch = [-MARKETING_LAUNCH / 3 if m <= 3 else 0.0 for m in ms]
    contrib = [CONTRIB_TOTAL / 2 if m in (5, 8) else 0.0 for m in ms]
    fee = [-CFA_FEE * FEE_SPEND.get(m, 0.0) for m in ms]
    float_ = [-FLOAT if m == 6 else 0.0 for m in ms]
    committed = [-COMMITTED if m == 1 else 0.0 for m in ms]

    own_eb_tot = [sum(own_eb[n][i] for n in own_eb) for i in range(HORIZON)]
    own_rev_tot = [sum(own_rev[n][i] for n in own_rev) for i in range(HORIZON)]

    group_eb = [campus_eb[i] + own_eb_tot[i] for i in range(HORIZON)]
    group_rev = [campus_rev[i] + own_rev_tot[i] for i in range(HORIZON)]
    cash = [group_eb[i] + rent_adj[i] + capex[i] + p2[i] + own_capex[i] + sess_equip[i]
            + mkt_launch[i] + contrib[i] + fee[i] + float_[i] + committed[i]
            for i in range(HORIZON)]

    attr_eb = [campus_eb[i] + sum(own_eb[n][i] * s for n, _r, _e, _h, _o, _f, s, _d in OWN_CLINICS)
               for i in range(HORIZON)]

    return dict(months=ms, consultants=cons, sessions=sessions, room_fees=room_fees,
                equip=equip, membership=membership, sessional_rev=sessional_rev,
                let_cost=let_cost, rent=rent, rent_lines=rent_lines,
                own_rev=own_rev, own_eb=own_eb, own_rev_tot=own_rev_tot,
                own_eb_tot=own_eb_tot, theatre_rev=theatre_rev, theatre_cost=theatre_cost,
                cost_lines=cost_lines, mgmt=mgmt, campus_rev=campus_rev, campus_cost=campus_cost,
                campus_eb=campus_eb, group_rev=group_rev, group_eb=group_eb,
                attr_eb=attr_eb, cash=cash, capex=capex, p2=p2, own_capex=own_capex,
                contrib=contrib, fee=fee, float_=float_, committed=committed,
                sess_equip=sess_equip, mkt_launch=mkt_launch,
                rent_adj=rent_adj)


def npv(rate_a, flows):
    r = (1 + rate_a) ** (1 / 12) - 1
    return sum(f / (1 + r) ** (i + 1) for i, f in enumerate(flows))


def irr(flows):
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


def metrics(flows):
    cum, r = [], 0.0
    for f in flows:
        r += f
        cum.append(r)
    peak = -min(cum)
    pay = next((i + 1 for i, v in enumerate(cum) if v >= 0), None)
    return dict(irr=irr(flows), npv=npv(DISCOUNT, flows), payback=pay, peak=peak,
                cum=cum, trough_m=cum.index(min(cum)) + 1,
                coc=(sum(flows) + peak) / peak if peak else None)


if __name__ == "__main__":
    M = build()
    m = metrics(M["cash"])
    a = lambda k: M[k][-1] * 12
    print("LYFE PLACE ABUJA, campus model\n")
    print("  bookable rooms      %d consulting + %d procedure, plus a %d bay infusion suite"
          % (ROOMS_CONSULT, ROOMS_PROC, 4))
    print("  prime capacity      %d hours a week, so about %d consultants"
          % (PRIME_CAP_WK, CONSULTANTS_CAP))
    print("  consultants signed  %.0f at run rate (target %d, cap %d)"
          % (M["consultants"][-1], CONSULTANTS_TARGET, CONSULTANTS_CAP))
    print()
    print("  session price       NGN %s blended, 2 hour unit" % format(int(SESSION_PRICE), ","))
    print("  sessions a year     %s" % format(int(M["sessions"][-1] * 12), ","))
    print()
    print("  RUN RATE, NGN M a year")
    for lbl, k in [("rent, downstairs", "rent"), ("sessional upstairs", "sessional_rev"),
                   ("theatre", "theatre_rev"), ("campus revenue", "campus_rev"),
                   ("campus EBITDA", "campus_eb"), ("own clinics revenue", "own_rev_tot"),
                   ("own clinics EBITDA", "own_eb_tot"), ("GROUP revenue", "group_rev"),
                   ("GROUP EBITDA", "group_eb"), ("attributable to Medbury", "attr_eb")]:
        print("    %-26s %8.1f" % (lbl, a(k)))
    print()
    print("  RETURNS")
    print("    peak funding             %8.0f   trough month %d" % (m["peak"], m["trough_m"]))
    print("    payback                  %8s   month %s from opening"
          % (m["payback"], (m["payback"] - 6) if m["payback"] else "-"))
    print("    IRR                      %8.1f%%" % (100 * m["irr"]) if m["irr"] else "    IRR n/a")
    print("    NPV at %d%%                %8.0f" % (100 * DISCOUNT, m["npv"]))
    print("    cash on cash             %8.1fx" % m["coc"])
