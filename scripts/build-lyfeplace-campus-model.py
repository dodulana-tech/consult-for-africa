"""
Write the Lyfe Place Abuja campus model to a workbook.

    python3 scripts/build-lyfeplace-campus-model.py

All numbers come from scripts/lyfeplace_campus.py. Nothing is typed twice here.
"""

from __future__ import annotations

import datetime as _dt
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter

import lyfeplace_campus as C

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "lyfeplace-abuja" / "lyfeplace-abuja-campus-model.xlsx"
START = _dt.date(2026, 9, 1)

NAVY, LIGHT, BAND = "0F3D2E", "EFF4F1", "F7F5EF"
H = Font(bold=True, color="FFFFFF", size=9.5)
B = Font(bold=True, size=9.5)
N = Font(size=9.5)
SM = Font(size=8.5, color="6B7280", italic=True)
FH, FT, FB = PatternFill("solid", fgColor=NAVY), PatternFill("solid", fgColor=LIGHT), \
    PatternFill("solid", fgColor=BAND)
NUM = '#,##0.0;[Red](#,##0.0);"-"'
NUM0 = '#,##0;[Red](#,##0);"-"'
PCT = '0.0%'
MONEY = '#,##0'


def mlabel(m):
    y = START.year + (START.month - 1 + m - 1) // 12
    mo = (START.month - 1 + m - 1) % 12 + 1
    return "%s m%d" % (_dt.date(y, mo, 1).strftime("%b%y"), m)


def sheet(wb, title, widths=None, freeze="B4"):
    ws = wb.create_sheet(title)
    ws.sheet_view.showGridLines = False
    ws.freeze_panes = freeze
    for i, w in enumerate(widths or [], start=1):
        ws.column_dimensions[get_column_letter(i)].width = w
    return ws


def head(ws, text, sub=""):
    ws["A1"] = text
    ws["A1"].font = Font(bold=True, size=13, color=NAVY)
    if sub:
        ws["A2"] = sub
        ws["A2"].font = SM
    return 4


def hdr(ws, r, labels, wrap=False):
    for j, l in enumerate(labels, start=1):
        c = ws.cell(row=r, column=j, value=l)
        c.font = H
        c.fill = FH
        if wrap:
            c.alignment = Alignment(wrap_text=True, vertical="top")
    return r + 1


def row(ws, r, label, vals, fmt=NUM, bold=False, band=False, col=2, note=None):
    c = ws.cell(row=r, column=1, value=label)
    c.font = B if bold else N
    if band:
        c.fill = FT
    for j, v in enumerate(vals):
        cc = ws.cell(row=r, column=col + j, value=round(v, 2) if isinstance(v, float) else v)
        cc.font = B if bold else N
        cc.number_format = fmt
        if band:
            cc.fill = FT
    if note:
        ws.cell(row=r, column=col + len(vals) + 1, value=note).font = SM
    return r + 1


def months_hdr(ws, r):
    ws.cell(row=r, column=1, value="NGN M").font = H
    ws.cell(row=r, column=1).fill = FH
    for j in range(C.HORIZON):
        c = ws.cell(row=r, column=2 + j, value=mlabel(j + 1))
        c.font = H
        c.fill = FH
        c.alignment = Alignment(horizontal="right")
    return r + 1


def annual(v):
    return [sum(v[i * 12:(i + 1) * 12]) for i in range(C.HORIZON // 12)]


def scenario(**kw):
    import importlib
    mod = importlib.reload(C)
    for k, v in kw.items():
        setattr(mod, k, v)
    if "RACK_HR" in kw:
        mod.BLEND_HR = mod.CONSULT_SHARE * mod.RACK_HR + (1 - mod.CONSULT_SHARE) * mod.RACK_HR * mod.PROC_MULT
        mod.SESSION_PRICE = mod.BLEND_HR * mod.UNIT_H * mod.TIER_FACTOR
    M = mod.build()
    return M, mod.metrics(M["cash"])


def build_workbook():
    M = C.build()
    m = C.metrics(M["cash"])
    rr = lambda k: M[k][-1] * 12
    wb = Workbook()
    wb.remove(wb.active)

    # ---------------------------------------------------------------- cover
    ws = sheet(wb, "Cover", [44, 18, 76], freeze="A1")
    r = head(ws, "Lyfe Place Abuja: the campus",
             "Monthly model, 60 months, NGN millions. Downstairs is rent. Upstairs is a "
             "sessional business driven by consultants signed. Prepared for Dr Itunu Akinware.")
    for label, val, note in [
        ("THE BUILDING", "", ""),
        ("Net internal area", "%.1f sqm" % C.NET, "Measured from the as-built CAD, not the brief"),
        ("Lettable ground floor", "%.1f sqm" % C.GF_LETTABLE,
         "After shared services 105.2. Diagnostics is in the chalet, pharmacy in the boys' quarters"),
        ("Bookable rooms upstairs", "%d" % C.BOOKABLE,
         "%d consulting and %d procedure, plus a dedicated 4 bay infusion suite"
         % (C.ROOMS_CONSULT, C.ROOMS_PROC)),
        ("Prime capacity", "%d hrs a week" % C.PRIME_CAP_WK,
         "Weekday 17:00 to 21:00 plus Saturday. This is the real constraint"),
        ("Consultant ceiling", "%d" % C.CONSULTANTS_CAP, "Where prime time runs out"),
        ("", "", ""),
        ("THE BUSINESS AT RUN RATE", "", ""),
        ("Consultants signed", "%.0f" % M["consultants"][-1], "Target %d" % C.CONSULTANTS_TARGET),
        ("Sessions a year", "%s" % format(int(M["sessions"][-1] * 12), ","),
         "2 hour unit, %.2f a week each" % C.SESS_PER_CONSULTANT_WK),
        ("Rent, downstairs", "%.0f" % rr("rent"), "The conversion clinic is a tenant, not a business we own"),
        ("Sessional, upstairs", "%.0f" % rr("sessional_rev"), "Room fees, equipment and membership"),
        ("Theatre", "%.0f" % rr("theatre_rev"), "Own lists plus external surgeons"),
        ("Campus revenue", "%.0f" % rr("campus_rev"), ""),
        ("Campus EBITDA", "%.0f" % rr("campus_eb"), "%.0f%% margin" % (100 * rr("campus_eb") / rr("campus_rev"))),
        ("Our own clinics, revenue", "%.0f" % rr("own_rev_tot"), "Aesthetics, hair, bariatric medical, infusion"),
        ("Our own clinics, EBITDA", "%.0f" % rr("own_eb_tot"), ""),
        ("GROUP REVENUE", "%.0f" % rr("group_rev"), ""),
        ("GROUP EBITDA", "%.0f" % rr("group_eb"), "%.0f%% margin" % (100 * rr("group_eb") / rr("group_rev"))),
        ("Attributable to Medbury", "%.0f" % rr("attr_eb"), "After partner equity shares"),
        ("", "", ""),
        ("THE MONEY", "", ""),
        ("Peak funding", "%.0f" % m["peak"], "Deepest the bank balance goes, month %d" % m["trough_m"]),
        ("Payback", "month %d" % m["payback"], "%d months from opening" % (m["payback"] - 6)),
        ("IRR, 5 year", "%.0f%%" % (100 * m["irr"]), "Nominal naira, no terminal value"),
        ("NPV at %d%%" % (100 * C.DISCOUNT), "%.0f" % m["npv"], "Five years only, so a floor"),
        ("Cash on cash", "%.1fx" % m["coc"], "Returned over peak invested"),
    ]:
        if not label:
            r += 1
            continue
        c = ws.cell(row=r, column=1, value=label)
        c.font = B
        if label.isupper():
            c.fill = FT
        cc = ws.cell(row=r, column=2, value=val)
        cc.font = B
        cc.alignment = Alignment(horizontal="right")
        ws.cell(row=r, column=3, value=note).font = SM
        r += 1

    # ---------------------------------------------------------------- drivers
    ws = sheet(wb, "Drivers", [46, 18, 74], freeze="A4")
    r = head(ws, "Drivers", "Change anything here and the whole model moves.")
    r = hdr(ws, r, ["Driver", "Value", "Note"])
    for label, val, note in [
        ("Rack rate, consulting room, per hour", C.RACK_HR, "Survey: a 2 hour unit at this rate is NGN 70,000, the optimal price point"),
        ("Procedure room multiple", C.PROC_MULT, "Procedure couch, operating light, suction, monitor, sterile field"),
        ("Theatre multiple", C.THEATRE_MULT, "Anaesthesia, HEPA, scrub, two recovery bays"),
        ("Bookable unit, hours", C.UNIT_H, "A consultant off a hospital day books 2 hours, not 4"),
        ("Blended session price", C.SESSION_PRICE, "After the tier taper"),
        ("Tier taper, blended", C.TIER_FACTOR, "Weighted by the survey's own membership distribution"),
        ("Membership per consultant", C.MEMBERSHIP_PER_CONSULTANT, "Blended across tiers, a year"),
        ("Sessions per consultant a week", C.SESS_PER_CONSULTANT_WK, "Survey Q5"),
        ("Procedure share of sessions", 1 - C.CONSULT_SHARE, "Survey Q15"),
        ("Equipment attach rate", C.EQUIP_ATTACH, "JUDGEMENT. Not evidenced by the survey"),
        ("Equipment, per session", C.EQUIP_PER_SESSION, "Ultrasound, sterile set, laser, blended"),
        ("Cost of a let hour", C.LET_COST_HR, "Reception, booking, billing and a nurse"),
        ("Consultants target", C.CONSULTANTS_TARGET, "Against a ceiling of %d" % C.CONSULTANTS_CAP),
        ("Months to reach target", C.CONSULTANTS_RAMP_M, "THE most sensitive driver in the model"),
        ("Theatre, external share of consultants", C.THEATRE_EXT_SHARE, "Survey Q15: 30% need a full theatre"),
        ("Theatre, lists per surgeon a year", C.THEATRE_LISTS_PER_SURGEON, "One a month"),
        ("Theatre, external fee per list", C.THEATRE_EXT_FEE, "Facility fee, excluding the surgeon"),
        ("Category A fit-out", C.FIT_SCHEDULED, "Lean variant %.1f" % C.FIT_LEAN),
        ("Already committed", C.COMMITTED, "Two years' head rent and fees, spent"),
        ("Occupier contributions on grant", C.CONTRIB_TOTAL, ""),
        ("Theatre capital", C.THEATRE_CAPITAL, "Phase two"),
        ("Setup programme fee", C.CFA_FEE, "Of which %.0f on mobilisation" % C.CFA_MOB),
        ("Head rent", C.HEAD_RENT, "Prepaid to month %d" % C.RENT_PREPAID_TO),
        ("Discount rate", C.DISCOUNT, "Naira nominal"),
    ]:
        ws.cell(row=r, column=1, value=label).font = N
        c = ws.cell(row=r, column=2, value=val)
        c.font = N
        c.number_format = PCT if isinstance(val, float) and val < 1.5 else MONEY
        c.alignment = Alignment(horizontal="right")
        ws.cell(row=r, column=3, value=note).font = SM
        r += 1

    # ---------------------------------------------------------------- space
    ws = sheet(wb, "Space and capacity", [40, 14, 14, 66], freeze="A4")
    r = head(ws, "Space and capacity", "What is there, and what limits it.")
    r = hdr(ws, r, ["", "sqm", "rooms", "Note"])
    for lbl, sqm, rooms, note in [
        ("GROUND FLOOR", C.GROUND_NET, "", "Measured"),
        ("  Shared services", C.GF_SHARED, "", "Reception 42.0, spine 14.0, stair, staff, vestibule, porch, WCs"),
        ("  Lettable ground floor", C.GF_LETTABLE, "", "Everything bar reception and the theatre is rentable"),
        ("    of which theatre suite", C.THEATRE_SQM, "", "Theatre 32.8, recovery 19.2, dirty utility 6.9, scrub 5.1"),
        ("    of which conversion clinic", C.CONV_SQM, "",
         "The rest of the ground floor. Diagnostics and pharmacy take no space down here"),
        ("FIRST FLOOR", C.FIRST_NET, "", "Typed by space, not divided by business"),
        ("  Consulting type", 41.8 + 18.9, C.ROOMS_CONSULT, "The 41.8 living room subdivided into 2, plus the 18.9"),
        ("  Procedure type", 26.1 + 21.1 + 20.8, C.ROOMS_PROC, "26.1 has 360 degree access"),
        ("  Infusion suite", C.INFUSION_SQM, "", "4 bays, dedicated. Leaves the bookable pool"),
        ("  Relaxation", C.RELAX_SQM, "", "The living room at the head of the stair"),
        ("  Connect", C.CONNECT_SQM, "", "The playroom"),
        ("  Support and circulation", C.FF_SUPPORT, "", "Sterilising, linen, WCs, stair, draw point"),
        ("CHALET AND BOYS' QUARTERS", C.CHALET_NET + C.BQ_NET, "", "Laboratory and ultrasound, dispensary and cold chain"),
        ("NET INTERNAL", C.NET, "", ""),
    ]:
        strong = lbl.isupper() or "Lettable" in lbl
        c = ws.cell(row=r, column=1, value=lbl)
        c.font = B if strong else N
        if lbl.isupper():
            for j in range(1, 5):
                ws.cell(row=r, column=j).fill = FT
        cc = ws.cell(row=r, column=2, value=sqm)
        cc.font = B if strong else N
        cc.number_format = NUM
        if rooms:
            ws.cell(row=r, column=3, value=rooms).font = N
        ws.cell(row=r, column=4, value=note).font = SM
        r += 1
    r += 1
    ws.cell(row=r, column=1, value="THE BINDING CONSTRAINT").font = B
    r += 1
    for line in [
        "Prime hours are weekday 17:00 to 21:00 plus Saturday: %d a week per room, %d across the floor."
        % (C.PRIME_H_WK, C.PRIME_CAP_WK),
        "A consultant books %.2f sessions a week at %d hours, so %.1f hours."
        % (C.SESS_PER_CONSULTANT_WK, C.UNIT_H, C.SESS_PER_CONSULTANT_WK * C.UNIT_H),
        "Prime therefore runs out at about %d consultants. That is the ceiling on this room count."
        % C.CONSULTANTS_CAP,
        "Our own clinics need about %d room hours a year and run in the working day, when the "
        "consultants do not want the rooms. The two uses do not collide until prime is full."
        % sum(h for _n, _r, _e, h, _o, _f, _s, _d in C.OWN_CLINICS),
    ]:
        ws.cell(row=r, column=1, value=line).font = SM
        r += 1

    # ---------------------------------------------------------------- opcos
    ws = sheet(wb, "OpCos", [38, 30, 26, 12, 12, 10, 12, 52], freeze="A4")
    r = head(ws, "The operating companies", "What exists, what it needs, what it generates. NGN M a year at run rate.")
    r = hdr(ws, r, ["Company", "What it is", "Ownership", "Revenue", "EBITDA", "Margin",
                    "To Medbury", "Note"], wrap=True)
    ENT = [("Lyfe Place Ltd", "Division holding and management", "Medbury 100%", 0, 0, 1.0,
            "Owns the brand, rate card, protocols, systems and supplier book. Licences them to each site"),
           ("Lyfe Place Abuja Ltd", "The campus operating company", "Medbury 100%",
            rr("campus_rev"), rr("campus_eb"), 1.0,
            "Holds the head lease and the fit-out, lets downstairs, runs the sessional business "
            "and the theatre, and sells shared services")]
    for n, rev, eb, _h, _o, _f, s, d in C.OWN_CLINICS:
        ENT.append((n, "Clinical OpCo, upstairs",
                    "Medbury %.0f%%" % (100 * s), rev, eb, s, d))
    for n, a, rate, _o, d in C.TENANTS:
        ENT.append((n, "Tenant, not a company we own", "Third party or existing",
                    0, 0, 1.0, "%s. Pays NGN %.1f M a year in rent" % (d, a * rate / 1e6)))
    for name, kind, own, rev, eb, share, note in ENT:
        vals = [name, kind, own, rev or None, eb or None,
                (eb / rev) if rev else None, (eb * share) if rev else None, note]
        for j, v in enumerate(vals, start=1):
            c = ws.cell(row=r, column=j, value=v)
            c.font = N
            c.alignment = Alignment(wrap_text=True, vertical="top")
            if j in (4, 5, 7):
                c.number_format = NUM
            if j == 6:
                c.number_format = PCT
            if j == 8:
                c.font = SM
        r += 1
    r = row(ws, r, "GROUP", [rr("group_rev"), rr("group_eb"),
                             rr("group_eb") / rr("group_rev"), rr("attr_eb")],
            bold=True, band=True, col=4)
    ws.cell(row=r - 1, column=6).number_format = PCT

    # ---------------------------------------------------------------- assumptions
    ws = sheet(wb, "Assumptions", [34, 20, 15, 60, 56], freeze="A4")
    r = head(ws, "Assumptions register",
             "MEASURED and CONTRACTED are facts. SURVEY is evidenced at n=20. "
             "JUDGEMENT is where to push back, and it is shaded.")
    r = hdr(ws, r, ["Assumption", "Value", "Basis", "What it rests on", "What it moves if wrong"], wrap=True)
    A = [
        ("Net internal area", "%.1f sqm" % C.NET, "MEASURED",
         "Extracted from the as-built CAD to about 10 mm. Both floors return 70% efficiency.",
         "The fit-out is priced on this. 145 sqm more than the brief assumed."),
        ("Lettable ground floor", "%.1f sqm" % C.GF_LETTABLE, "MEASURED",
         "282.2 less shared services. Everything else down here lets to the clinic.",
         "The theatre takes 64.0 of it, leaving %.1f sqm to the clinic." % C.CONV_SQM),
        ("Bookable rooms", "%d" % C.BOOKABLE, "MEASURED",
         "3 consulting from the 41.8 subdivided plus the 18.9, and 3 procedure.",
         "Every capacity number follows from this."),
        ("Session price", "NGN %s" % format(int(C.RACK_HR * C.UNIT_H), ","), "SURVEY",
         "van Westendorp: good value 60k, optimal 65k, indifference 85k on a block.",
         "The single biggest revenue driver. A 10% cut is about NGN 36 M a year."),
        ("Sessions per consultant", "%.2f a week" % C.SESS_PER_CONSULTANT_WK, "SURVEY",
         "Q5: none 1, one 9, two 6, three 4. 50% want two or more.",
         "Sets how many consultants are needed for a given revenue."),
        ("Membership tiers", "350k to 1.5M", "SURVEY",
         "Q13: 25% would not join, 38% under 500k, 19% at 500k to 1M, 19% at 1M+.",
         "The old 1.2M / 2.4M / 4.2M tiers do not survive this sample."),
        ("Theatre demand", "%.0f%% of consultants" % (100 * C.THEATRE_EXT_SHARE), "SURVEY",
         "Q15: 30% perform procedures needing a full operating theatre, 24% need sedation.",
         "Without the theatre the whole programme returns 18% rather than 37%."),
        ("Consultants signed", "%d over %d months" % (C.CONSULTANTS_TARGET, C.CONSULTANTS_RAMP_M),
         "JUDGEMENT",
         "Assumes the business development officer is in post from month 4 and the "
         "NGN 9 M recruitment line is spent.",
         "THE most sensitive driver. At 30 months instead of 18 the NPV goes to zero."),
        ("Equipment attach", "%.0f%%" % (100 * C.EQUIP_ATTACH), "JUDGEMENT",
         "Not asked in the survey.",
         "About NGN 37 M a year at run rate."),
        ("Cost of a let hour", "NGN %s" % format(C.LET_COST_HR, ","), "JUDGEMENT",
         "Reception, booking, billing and a nurse apportioned to a let hour.",
         "At 5,000 rather than 9,000 the EBITDA is NGN 27 M better."),
        ("Own clinic revenue", "NGN %.0f M" % sum(x[1] for x in C.OWN_CLINICS), "JUDGEMENT",
         "Built from room hours and price lists, not from comparable audited accounts. "
         "Aesthetics at 285 is the least evidenced number in the pack.",
         "20% below plan costs about 4 months of payback."),
        ("Category A fit-out", "NGN %.1f M" % C.FIT_SCHEDULED, "SCHEDULED",
         "74 measured lines, AACE class 4, minus 15 to plus 30 per cent.",
         "A 15% overrun costs about one month of payback."),
        ("Head rent", "NGN %.1f M" % C.HEAD_RENT, "CONTRACTED",
         "Two years already paid inside the NGN %.0f M committed." % C.COMMITTED,
         "Fixed. Only the escalation treatment is open."),
        ("Discount rate", "%.0f%%" % (100 * C.DISCOUNT), "JUDGEMENT",
         "Naira nominal, five years, no terminal value.",
         "Moves NPV, not payback."),
    ]
    for name, val, basis, rests, moves in A:
        for j, v in enumerate([name, val, basis, rests, moves], start=1):
            c = ws.cell(row=r, column=j, value=v)
            c.font = B if j == 1 else N
            c.alignment = Alignment(wrap_text=True, vertical="top")
            if j == 3:
                c.font = Font(bold=True, size=9,
                              color={"MEASURED": "0F6B3D", "CONTRACTED": "0F6B3D",
                                     "SURVEY": "1D4ED8", "SCHEDULED": "8A6D1F"}.get(v, "9B2C2C"))
        if basis == "JUDGEMENT":
            for j in range(1, 6):
                ws.cell(row=r, column=j).fill = FB
        r += 1

    # ---------------------------------------------------------------- monthly
    ws = sheet(wb, "Upstairs monthly", [38] + [11] * C.HORIZON)
    r = head(ws, "Upstairs, month by month", "The sessional business. Driven by consultants signed.")
    r = months_hdr(ws, r)
    r = row(ws, r, "Consultants signed", M["consultants"], fmt=NUM0)
    r = row(ws, r, "Sessions", M["sessions"], fmt=NUM0)
    r = row(ws, r, "Room fees", M["room_fees"])
    r = row(ws, r, "Equipment", M["equip"])
    r = row(ws, r, "Membership", M["membership"])
    r = row(ws, r, "Sessional revenue", M["sessional_rev"], bold=True, band=True)
    r = row(ws, r, "Cost of let hours", M["let_cost"])

    ws = sheet(wb, "Downstairs monthly", [38] + [11] * C.HORIZON)
    r = head(ws, "Downstairs, month by month", "Rent only. These are tenants, not businesses we own.")
    r = months_hdr(ws, r)
    for n in M["rent_lines"]:
        r = row(ws, r, n, M["rent_lines"][n])
    r = row(ws, r, "Rent", M["rent"], bold=True, band=True)

    ws = sheet(wb, "Own clinics monthly", [38] + [11] * C.HORIZON)
    r = head(ws, "Our own clinics, month by month", "Upstairs, in the working day.")
    r = months_hdr(ws, r)
    for n in M["own_rev"]:
        r = row(ws, r, n + ", revenue", M["own_rev"][n])
        r = row(ws, r, n + ", EBITDA", M["own_eb"][n])
    r = row(ws, r, "Own clinics revenue", M["own_rev_tot"], bold=True, band=True)
    r = row(ws, r, "Own clinics EBITDA", M["own_eb_tot"], bold=True, band=True)

    ws = sheet(wb, "Campus P&L monthly", [38] + [11] * C.HORIZON)
    r = head(ws, "The campus company, month by month", "Rent, sessions, theatre, less the cost of running it.")
    r = months_hdr(ws, r)
    r = row(ws, r, "Rent", M["rent"])
    r = row(ws, r, "Sessional", M["sessional_rev"])
    r = row(ws, r, "Theatre", M["theatre_rev"])
    r = row(ws, r, "Campus revenue", M["campus_rev"], bold=True, band=True)
    for n in M["cost_lines"]:
        r = row(ws, r, n, [-x for x in M["cost_lines"][n]])
    r = row(ws, r, "Theatre running", [-x for x in M["theatre_cost"]])
    r = row(ws, r, "Cost of let hours", M["let_cost"])
    r = row(ws, r, "CFA management fee", M["mgmt"])
    r = row(ws, r, "Campus cost", M["campus_cost"], bold=True, band=True)
    r = row(ws, r, "Campus EBITDA", M["campus_eb"], bold=True, band=True)

    ws = sheet(wb, "Group monthly", [38] + [11] * C.HORIZON)
    r = head(ws, "Group, month by month", "The campus plus our own clinics, and the cash.")
    r = months_hdr(ws, r)
    r = row(ws, r, "Group revenue", M["group_rev"], bold=True, band=True)
    r = row(ws, r, "Group EBITDA", M["group_eb"], bold=True, band=True)
    r = row(ws, r, "Attributable EBITDA", M["attr_eb"], bold=True)
    r = row(ws, r, "Head rent, cash timing", M["rent_adj"])
    r = row(ws, r, "Category A fit-out", M["capex"])
    r = row(ws, r, "Theatre capital", M["p2"])
    r = row(ws, r, "Own clinic capital", M["own_capex"])
    r = row(ws, r, "Contributions on grant", M["contrib"])
    r = row(ws, r, "Setup programme fee", M["fee"])
    r = row(ws, r, "Working capital float", M["float_"])
    r = row(ws, r, "Already committed", M["committed"])
    r = row(ws, r, "Net cash flow", M["cash"], bold=True, band=True)
    r = row(ws, r, "Cumulative cash", m["cum"], bold=True)

    # ---------------------------------------------------------------- annual
    ws = sheet(wb, "Annual summary", [40] + [16] * 5)
    r = head(ws, "Annual summary", "Year 1 is months 1 to 12 from instruction, not from opening.")
    r = hdr(ws, r, ["NGN M"] + ["Year %d" % (i + 1) for i in range(C.HORIZON // 12)])
    for lbl, k, bold in [("Rent, downstairs", "rent", False),
                         ("Sessional, upstairs", "sessional_rev", False),
                         ("Theatre", "theatre_rev", False),
                         ("Campus revenue", "campus_rev", True),
                         ("Campus EBITDA", "campus_eb", True),
                         ("Own clinics revenue", "own_rev_tot", False),
                         ("Own clinics EBITDA", "own_eb_tot", False),
                         ("Group revenue", "group_rev", True),
                         ("Group EBITDA", "group_eb", True),
                         ("Attributable EBITDA", "attr_eb", True),
                         ("Net cash flow", "cash", True)]:
        r = row(ws, r, lbl, annual(M[k]), bold=bold, band=bold)
    r = row(ws, r, "Consultants signed, year end",
            [M["consultants"][min((i + 1) * 12 - 1, C.HORIZON - 1)] for i in range(C.HORIZON // 12)],
            fmt=NUM0)

    # ---------------------------------------------------------------- returns
    ws = sheet(wb, "Returns", [42, 18, 66], freeze="A4")
    r = head(ws, "Returns", "No terminal value anywhere, so every figure is a floor.")
    r = hdr(ws, r, ["Measure", "Value", "Note"])
    for lbl, v, fmt, note in [
        ("Peak funding", m["peak"], NUM, "Deepest the bank balance goes, month %d" % m["trough_m"]),
        ("Payback from instruction", m["payback"], NUM0, "Months"),
        ("Payback from opening", m["payback"] - 6, NUM0, "Opening is month 7"),
        ("IRR, 5 year", m["irr"], PCT, "Nominal naira"),
        ("NPV at %d%%" % (100 * C.DISCOUNT), m["npv"], NUM, "Five years only"),
        ("Cash on cash", m["coc"], NUM, "Returned over peak invested"),
        ("Group EBITDA at run rate", rr("group_eb"), NUM, ""),
        ("Attributable at run rate", rr("attr_eb"), NUM, "After partner equity"),
    ]:
        ws.cell(row=r, column=1, value=lbl).font = B
        c = ws.cell(row=r, column=2, value=round(v, 3) if isinstance(v, float) else v)
        c.font = N
        c.number_format = fmt
        c.alignment = Alignment(horizontal="right")
        ws.cell(row=r, column=3, value=note).font = SM
        r += 1

    # ---------------------------------------------------------------- funding
    ws = sheet(wb, "Funding", [46, 16, 20, 62], freeze="A4")
    r = head(ws, "Who funds what",
             "The capital table is what it costs. The peak is what has to be available.")
    r = hdr(ws, r, ["Item", "NGN M", "Who", "Note"])
    own_cap = sum(C.OWN_CLINIC_CAPITAL.values())
    partner = {"Medlyfe Aesthetics and Regenerative": 0.49, "Bariatric and Metabolic, medical": 0.30}
    med = sum(v * (1 - partner.get(k, 0)) for k, v in C.OWN_CLINIC_CAPITAL.items())
    par = own_cap - med
    trading = (C.COMMITTED + C.FIT_SCHEDULED + C.FLOAT + C.CFA_FEE + own_cap
               + C.THEATRE_CAPITAL - C.CONTRIB_TOTAL) - m["peak"]
    for lbl, v, who, note in [
        ("Already committed", C.COMMITTED, "Spent", "Two years' head rent and fees"),
        ("Category A fit-out", C.FIT_SCHEDULED, "Itunu", "Lean variant NGN %.1f M" % C.FIT_LEAN),
        ("Working capital float", C.FLOAT, "Itunu", "To cash positive"),
        ("Setup programme fee", C.CFA_FEE, "Itunu", "Real cash, often left out of capital tables"),
        ("Own clinic capital, Medbury share", med, "Itunu", "Equipment, opening stock, working capital"),
        ("Own clinic capital, partners", par, "Partners", "Their equity share"),
        ("Theatre capital", C.THEATRE_CAPITAL, "Itunu or trading", "Month 13 to 15"),
        ("Contributions on grant", -C.CONTRIB_TOTAL, "Occupiers", "On grant of each sub lease"),
        ("Trading before the trough", -trading, "The campus", "What it earns on the way down"),
        ("PEAK FUNDING REQUIREMENT", m["peak"], "", "Month %d" % m["trough_m"]),
    ]:
        strong = lbl.isupper()
        c = ws.cell(row=r, column=1, value=lbl)
        c.font = B if strong else N
        cc = ws.cell(row=r, column=2, value=round(v, 1))
        cc.font = B if strong else N
        cc.number_format = NUM
        ws.cell(row=r, column=3, value=who).font = N
        ws.cell(row=r, column=4, value=note).font = SM
        if lbl.isupper():
            for j in range(1, 5):
                ws.cell(row=r, column=j).fill = FT
        r += 1

    r += 2
    ws.cell(row=r, column=1, value="THE LEANEST CHEQUE TO OPEN AND RUN SIX MONTHS").font = B
    r += 1
    opex = [-M["campus_cost"][i] for i in range(C.HORIZON)]
    pre6, trade6, rev6 = sum(opex[:6]), sum(opex[6:12]), sum(M["campus_rev"][6:12])
    minopen = [("Lean category A fit-out", C.FIT_LEAN, "Itunu", "Same opening date"),
               ("Setup programme fee", C.CFA_FEE, "Itunu", "NGN %.0f M on mobilisation" % C.CFA_MOB),
               ("Pre-opening opex, months 1 to 6", pre6, "Itunu", "Front office and site in post before opening"),
               ("Opex, first 6 trading months", trade6, "Itunu", "Months 7 to 12, management fee included"),
               ("Own clinic capital", own_cap, "Itunu and partners", "The four clinics upstairs"),
               ("Less revenue, months 7 to 12", -rev6, "The campus", ""),
               ("Less contributions on grant", -C.CONTRIB_TOTAL, "Occupiers", "")]
    tot = sum(v for _l, v, _w, _n in minopen)
    for lbl, v, who, note in minopen:
        ws.cell(row=r, column=1, value=lbl).font = N
        cc = ws.cell(row=r, column=2, value=round(v, 1)); cc.font = N; cc.number_format = NUM
        ws.cell(row=r, column=3, value=who).font = N
        ws.cell(row=r, column=4, value=note).font = SM
        r += 1
    ws.cell(row=r, column=1, value="MINIMUM TO OPEN AND RUN SIX MONTHS").font = B
    cc = ws.cell(row=r, column=2, value=round(tot, 1)); cc.font = B; cc.number_format = NUM
    ws.cell(row=r, column=4, value="Building only, without the four clinics: NGN %.1f M" % (tot - own_cap)).font = SM
    for j in range(1, 5):
        ws.cell(row=r, column=j).fill = FT
    r += 2
    ws.cell(row=r, column=1, value="WHEN IT FUNDS ITSELF, management fee included").font = B
    r += 1
    def firstm(cond):
        return next((i + 1 for i in range(C.HORIZON) if cond(i)), None)
    for lbl, mm in [("Campus revenue covers campus opex", firstm(lambda i: M["campus_rev"][i] >= opex[i])),
                    ("Campus EBITDA positive", firstm(lambda i: M["campus_eb"][i] >= 0)),
                    ("Group EBITDA positive", firstm(lambda i: M["group_eb"][i] >= 0)),
                    ("Trough of the bank balance", m["trough_m"]),
                    ("Full payback", m["payback"])]:
        ws.cell(row=r, column=1, value=lbl).font = N
        cc = ws.cell(row=r, column=2, value=mm); cc.font = N; cc.number_format = NUM0
        ws.cell(row=r, column=4, value="month %d, %d from opening" % (mm, mm - 6)).font = SM
        r += 1

    # ---------------------------------------------------------------- sensitivity
    ws = sheet(wb, "Sensitivity", [46] + [14] * 6, freeze="A4")
    r = head(ws, "Sensitivity", "One driver at a time. The ramp dominates everything else.")
    r = hdr(ws, r, ["Case", "Group rev", "Group EBITDA", "Peak", "Payback/open", "IRR", "NPV"])
    CASES = [("Base case", {}),
             ("Consultant ramp 30 months not 18", {"CONSULTANTS_RAMP_M": 30}),
             ("Consultant ramp 12 months", {"CONSULTANTS_RAMP_M": 12}),
             ("Target 50, the prime ceiling", {"CONSULTANTS_TARGET": 50}),
             ("Target 30 consultants", {"CONSULTANTS_TARGET": 30}),
             ("Lean fit-out", {"FIT_SCHEDULED": C.FIT_LEAN}),
             ("Rack 45k an hour", {"RACK_HR": 45_000}),
             ("Rack 28k an hour", {"RACK_HR": 28_000}),
             ("No theatre at all", {"THEATRE_CAPITAL": 0.0, "THEATRE_OWN": [], "THEATRE_EXT_SHARE": 0.0}),
             ("Own clinics 20% below plan", {"OWN_CLINICS": [(n, rv * .8, e * .8, h, o, f, s, d)
                                                             for n, rv, e, h, o, f, s, d in C.OWN_CLINICS]}),
             ]
    for lbl, kw in CASES:
        MM, mm = scenario(**kw)
        vals = [MM["group_rev"][-1] * 12, MM["group_eb"][-1] * 12, mm["peak"],
                (mm["payback"] - 6) if mm["payback"] else None, mm["irr"], mm["npv"]]
        ws.cell(row=r, column=1, value=lbl).font = B if not kw else N
        for j, v in enumerate(vals, start=2):
            c = ws.cell(row=r, column=j, value=round(v, 4) if isinstance(v, float) else v)
            c.font = N
            c.number_format = PCT if j == 6 else (NUM0 if j == 5 else NUM)
            c.alignment = Alignment(horizontal="right")
        if not kw:
            for j in range(1, 8):
                ws.cell(row=r, column=j).fill = FT
        r += 1
    r += 1
    for line in [
        "The consultant ramp is the whole business. 18 months to 45 signed returns 37%. "
        "30 months returns 25% and an NPV of about zero.",
        "The theatre is not optional any more. Without it the programme returns 18% and the NPV is negative.",
        "Price matters less than pace: moving the rack rate 10 k an hour moves the IRR less "
        "than moving the ramp by a year.",
    ]:
        ws.cell(row=r, column=1, value=line).font = SM
        r += 1

    OUT.parent.mkdir(parents=True, exist_ok=True)
    wb.save(OUT)
    return M, m


if __name__ == "__main__":
    M, m = build_workbook()
    print("wrote %s" % OUT.name)
    print("  group rev %.0f  EBITDA %.0f  attributable %.0f"
          % (M["group_rev"][-1] * 12, M["group_eb"][-1] * 12, M["attr_eb"][-1] * 12))
    print("  peak %.0f  payback m%d (%d from opening)  IRR %.0f%%  NPV %.0f"
          % (m["peak"], m["payback"], m["payback"] - 6, 100 * m["irr"], m["npv"]))
