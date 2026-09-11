"""
The Lyfe Place Abuja campus, as a readable document rather than a spreadsheet.

Every figure comes from scripts/lyfeplace_campus.py, including the stress test and the
breakevens, which are solved here rather than typed.

    python3 scripts/build-lyfeplace-campus-doc.py
"""

from __future__ import annotations

import importlib
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate, CondPageBreak, Frame, KeepTogether, PageTemplate, Paragraph,
    Spacer, Table, TableStyle,
)

import lyfeplace_campus as C

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "lyfeplace-abuja" / "lyfeplace-campus-plan.pdf"

NAVY = colors.HexColor("#0F3D2E")
GOLD = colors.HexColor("#C9A227")
TEAL = colors.HexColor("#2F6F5E")
BODY = colors.HexColor("#1F2937")
MUTED = colors.HexColor("#6B7280")
LIGHT = colors.HexColor("#EFF4F1")
CREAM = colors.HexColor("#FBF7EC")
ALERT = colors.HexColor("#FDF3E3")
RULE = colors.HexColor("#D8DEDA")
PW, PH = A4
MARGIN = 17 * mm
FULLW = PW - 2 * MARGIN


def style(name, **kw):
    base = dict(name=name, fontName="Helvetica", fontSize=8.9, leading=12.6,
                textColor=BODY, alignment=TA_LEFT)
    base.update(kw)
    return ParagraphStyle(**base)


P = style("p", spaceAfter=6)
SMALL = style("sm", fontSize=7.7, leading=10.4, textColor=MUTED, spaceAfter=4)
H1 = style("h1", fontName="Helvetica-Bold", fontSize=13.6, leading=16.4,
           textColor=NAVY, spaceBefore=2, spaceAfter=5)
H2 = style("h2", fontName="Helvetica-Bold", fontSize=10, leading=13,
           textColor=TEAL, spaceBefore=8, spaceAfter=4)
EYEBROW = style("eb", fontName="Helvetica-Bold", fontSize=7.4, leading=9.6,
                textColor=GOLD, spaceBefore=6, spaceAfter=1)
CELLW = style("cw", fontSize=8.2, leading=10.8, textColor=colors.white,
              fontName="Helvetica-Bold")


def m(x, dp=1):
    return ("{:,.%df}" % dp).format(x)


def sec(el, num, eyebrow, title):
    el.append(CondPageBreak(190))
    el.append(KeepTogether([Paragraph("%s  /  %s" % (num, eyebrow), EYEBROW),
                            Paragraph(title, H1)]))


def tbl(rows, labels, widths, total_row=False, aligns=None, hi=None, tiny=False):
    cs = style("c", fontSize=7.7 if tiny else 8.2, leading=10.2 if tiny else 10.8)
    csb = style("cb", fontSize=7.7 if tiny else 8.2, leading=10.2 if tiny else 10.8,
                fontName="Helvetica-Bold")
    data = [[Paragraph(str(l), CELLW) for l in labels]]
    for r in rows:
        data.append([Paragraph(str(c), csb if (total_row and r is rows[-1]) else cs) for c in r])
    t = Table(data, colWidths=widths, repeatRows=1)
    cmds = [("BACKGROUND", (0, 0), (-1, 0), NAVY), ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LINEBELOW", (0, 0), (-1, -1), 0.4, RULE),
            ("TOPPADDING", (0, 0), (-1, -1), 3.4), ("BOTTOMPADDING", (0, 0), (-1, -1), 3.4),
            ("LEFTPADDING", (0, 0), (-1, -1), 5), ("RIGHTPADDING", (0, 0), (-1, -1), 5)]
    for i in range(1, len(data)):
        if i % 2 == 0:
            cmds.append(("BACKGROUND", (0, i), (-1, i), colors.HexColor("#FAFBFA")))
    for j, a in enumerate(aligns or []):
        if a == "r":
            cmds.append(("ALIGN", (j + 1, 0), (j + 1, -1), "RIGHT"))
    if total_row:
        cmds += [("BACKGROUND", (0, len(data) - 1), (-1, len(data) - 1), CREAM),
                 ("LINEABOVE", (0, len(data) - 1), (-1, len(data) - 1), 0.8, GOLD)]
    for i in (hi or []):
        cmds.append(("BACKGROUND", (0, i + 1), (-1, i + 1), LIGHT))
    t.setStyle(TableStyle(cmds))
    return t


def card(text, bg=LIGHT, rule=GOLD):
    t = Table([[Paragraph(text, style("cd", fontSize=8.5, leading=11.9))]], colWidths=[FULLW])
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), bg),
                           ("LINEBEFORE", (0, 0), (0, -1), 2.2, rule),
                           ("LEFTPADDING", (0, 0), (-1, -1), 9), ("RIGHTPADDING", (0, 0), (-1, -1), 9),
                           ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7)]))
    return t


def furniture(canv, doc):
    canv.saveState()
    canv.setFillColor(NAVY)
    canv.rect(0, PH - 15 * mm, PW, 15 * mm, stroke=0, fill=1)
    canv.setFillColor(colors.white)
    canv.setFont("Helvetica-Bold", 8.2)
    canv.drawString(MARGIN, PH - 10 * mm, "LYFE PLACE")
    canv.setFont("Helvetica", 8.2)
    canv.drawRightString(PW - MARGIN, PH - 10 * mm, "Abuja campus  /  the plan and the numbers")
    canv.setFillColor(GOLD)
    canv.rect(0, PH - 16.4 * mm, PW, 1.4 * mm, stroke=0, fill=1)
    canv.setStrokeColor(GOLD)
    canv.setLineWidth(1.2)
    canv.line(MARGIN, 14 * mm, MARGIN + 11 * mm, 14 * mm)
    canv.setFillColor(MUTED)
    canv.setFont("Helvetica", 7.2)
    canv.drawString(MARGIN, 10 * mm,
                    "Private and confidential  /  Prepared for Dr Itunu Akinware, Group CEO")
    canv.drawRightString(PW - MARGIN, 10 * mm, "Page %d" % doc.page)
    canv.restoreState()


# ---------------------------------------------------------------- model + scenarios
M = C.build()
MET = C.metrics(M["cash"])
OPEN_M = C.CONSULTANTS_OPEN_M
rr = lambda k: M[k][-1] * 12
ANN = lambda v: [sum(v[i * 12:(i + 1) * 12]) for i in range(5)]
FROM_OPEN = lambda mth: mth - OPEN_M + 1


def scenario(**kw):
    mod = importlib.reload(C)
    for k, v in kw.items():
        setattr(mod, k, v)
    mod.BLEND_HR = mod.CONSULT_SHARE * mod.RACK_HR + (1 - mod.CONSULT_SHARE) * mod.RACK_HR * mod.PROC_MULT
    mod.SESSION_PRICE = mod.BLEND_HR * mod.UNIT_H * mod.TIER_FACTOR
    mod.CONSULTANTS_CAP = int(mod.PRIME_CAP_WK / (mod.SESS_PER_CONSULTANT_WK * mod.UNIT_H))
    MM = mod.build()
    return MM, mod.metrics(MM["cash"])


NO_TH = dict(THEATRE_CAPITAL=0.0, THEATRE_OWN=[], THEATRE_EXT_SHARE=0.0)
STRESS = [
    ("Base case", {}),
    ("Only 30 consultants, and 30 months to get them",
     dict(CONSULTANTS_TARGET=30, CONSULTANTS_RAMP_M=30)),
    ("The survey was optimistic: 1.2 sessions a week, 28k an hour",
     dict(SESS_PER_CONSULTANT_WK=1.2, RACK_HR=28_000)),
    ("No theatre, ever", NO_TH),
    ("Alameda walks away, no ground floor tenant",
     dict(TENANTS=[t for t in C.TENANTS if "Alameda" not in t[0]])),
    ("Our own clinics land 30 per cent below plan",
     dict(OWN_CLINICS=[(n, rv * .7, e * .7, h, o, f, s, d)
                       for n, rv, e, h, o, f, s, d in C.OWN_CLINICS])),
    ("Fit-out 25 per cent over and opening three months late",
     dict(FIT_SCHEDULED=C.FIT_LEAN * 1.25, CONSULTANTS_OPEN_M=OPEN_M + 3)),
    ("Two demand failures together",
     dict(CONSULTANTS_TARGET=30, CONSULTANTS_RAMP_M=30,
          SESS_PER_CONSULTANT_WK=1.2, RACK_HR=28_000)),
    ("Three together, with no theatre",
     dict(CONSULTANTS_TARGET=30, CONSULTANTS_RAMP_M=30,
          SESS_PER_CONSULTANT_WK=1.2, RACK_HR=28_000, **NO_TH)),
]
BASE_VALS = dict(CONSULTANTS_TARGET=C.CONSULTANTS_TARGET, RACK_HR=C.RACK_HR,
                 SESS_PER_CONSULTANT_WK=C.SESS_PER_CONSULTANT_WK,
                 CONSULTANTS_RAMP_M=C.CONSULTANTS_RAMP_M, FIT_SCHEDULED=C.FIT_SCHEDULED)


def solve(key, lo, hi, integer=False, higher_is_worse=False):
    for _ in range(36):
        mid = (lo + hi) / 2
        v = int(round(mid)) if integer else mid
        good = scenario(**{key: v})[1]["npv"] > 0
        if higher_is_worse:
            (lo, hi) = (mid, hi) if good else (lo, mid)
        else:
            (lo, hi) = (lo, mid) if good else (mid, hi)
    return (lo + hi) / 2


def build():
    doc = BaseDocTemplate(str(OUT), pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN,
                          topMargin=22 * mm, bottomMargin=18 * mm,
                          title="Lyfe Place Abuja: the campus plan and the numbers",
                          author="Consult for Africa")
    doc.addPageTemplates([PageTemplate(
        id="m", frames=[Frame(MARGIN, 18 * mm, FULLW, PH - 40 * mm, id="f")],
        onPage=furniture)])
    el = []
    el.append(Paragraph("The Abuja campus",
                        style("t", fontName="Helvetica-Bold", fontSize=19, leading=22,
                              textColor=NAVY, spaceAfter=2)))
    el.append(Paragraph("What it is, what it costs, what it returns, and what would "
                        "have to go wrong.",
                        style("st", fontName="Helvetica-Oblique", fontSize=11, leading=14,
                              textColor=GOLD, spaceAfter=8)))

    # ---------------------------------------------------------------- letter
    el.append(Paragraph("Dr Itunu Akinware, Group Chief Executive, Medbury Medical Services",
                        style("lt", fontName="Helvetica-Bold", fontSize=9.4, leading=12,
                              textColor=NAVY, spaceAfter=5)))
    for para in [
        "Itunu, this is the whole campus: six companies incorporated around a converted "
        "%s sqm building across four structures, opened in month %d and run as a sessional "
        "medical business." % (m(C.NET), C.CONSULTANTS_OPEN_M),
        "The shape has changed. <b>Downstairs is rent.</b> The conversion clinic is a tenant, "
        "so its revenue is not ours. <b>Upstairs is the business</b>, and it is sessional: six "
        "rooms carrying our own clinics in the working day and visiting consultants in the "
        "evenings and on Saturdays.",
        "So the number this runs on is not square metres let. It is <b>consultants signed</b>. "
        "At %d it produces NGN %s M of revenue and NGN %s M of EBITDA, NGN %s M of it "
        "attributable to you. Prime time runs out at about %d, so we are planning just under "
        "the ceiling."
        % (C.CONSULTANTS_TARGET, m(rr("group_rev"), 0), m(rr("group_eb"), 0),
           m(rr("attr_eb"), 0), C.CONSULTANTS_CAP),
        "Pricing comes from the consultant survey, not from us. Lean fit-out and six months of "
        "running costs is <b>NGN %s M</b>, peaking at NGN %s M in month %d. Capital home in "
        "month %d, %.0f per cent return, NPV NGN %s M at 25 per cent."
        % (m(MINOPEN, 0), m(MET["peak"], 0), MET["trough_m"], MET["payback"],
           100 * MET["irr"], m(MET["npv"], 0)),
        "Section 08 is the stress test. You can overrun the building by %.0f per cent and still "
        "make money; you can only miss the consultant target by %.0f per cent. This is a demand "
        "risk, not a construction one." % (FIT_HEADROOM, CONS_HEADROOM),
    ]:
        el.append(Paragraph(para, P))
    el.append(Paragraph(
        "Debo Odulana<br/><font size=8 color='#6b7280'>Founding Partner, Consult for Africa</font>",
        style("sig", fontName="Helvetica-Bold", fontSize=9.4, leading=13, textColor=NAVY,
              spaceBefore=6, spaceAfter=9)))

    # ---------------------------------------------------------------- summary
    el.append(Paragraph("SUMMARY", EYEBROW))
    el.append(Paragraph("The campus on one page.", H1))
    el.append(tbl(
        [["Opens", "Month %d" % OPEN_M, "Two months on site. Month 1 design and long lead orders, months 1 and 2 build"],
         ["Lean fit-out", "NGN %s M" % m(C.FIT_LEAN, 1), "Nothing clinical, statutory or structural comes out"],
         ["Minimum to open and run six months", "NGN %s M" % m(MINOPEN, 0), "Including the four clinics and our fee"],
         ["Peak funding", "NGN %s M" % m(MET["peak"], 0), "Month %d, then it climbs out" % MET["trough_m"]],
         ["Consultants signed at run rate", "%d" % C.CONSULTANTS_TARGET,
          "Against a prime time ceiling of %d. This is the number the business runs on" % C.CONSULTANTS_CAP],
         ["Group revenue", "NGN %s M" % m(rr("group_rev"), 0), "Rent %s, sessional %s, theatre %s, own clinics %s"
          % (m(rr("rent"), 0), m(rr("sessional_rev"), 0), m(rr("theatre_rev"), 0), m(rr("own_rev_tot"), 0))],
         ["Group EBITDA", "NGN %s M" % m(rr("group_eb"), 0), "%.0f%% margin, after our management fee"
          % (100 * rr("group_eb") / rr("group_rev"))],
         ["Attributable to Medbury", "NGN %s M" % m(rr("attr_eb"), 0), "After partner equity in the clinics"],
         ["Stops burning cash", "Month %d" % GRP_POS, "%d months after opening" % FROM_OPEN(GRP_POS)],
         ["Capital returned", "Month %d" % MET["payback"], "%d months after opening" % FROM_OPEN(MET["payback"])],
         ["Return", "%.0f%% IRR" % (100 * MET["irr"]),
          "NPV NGN %s M at 25%%, %.1f times cash back over five years" % (m(MET["npv"], 0), MET["coc"])]],
        ["", "", "Note"], [150, 78, FULLW - 228], aligns=["r", "l"], hi={2, 3, 10}))

    # ---------------------------------------------------------------- 01 building
    sec(el, "01", "THE BUILDING", "What is there, and what limits it.")
    el.append(tbl(
        [["Ground floor", m(C.GROUND_NET), "Reception and shared services %s, theatre %s, "
          "conversion clinic %s" % (m(C.GF_SHARED), m(C.THEATRE_SQM), m(C.CONV_SQM))],
         ["First floor", m(C.FIRST_NET), "%d consulting and %d procedure rooms, a %d bay infusion "
          "suite, relaxation and connect" % (C.ROOMS_CONSULT, C.ROOMS_PROC, 4)],
         ["Guest chalet", m(C.CHALET_NET), "Diagnostics: laboratory and imaging"],
         ["Boys' quarters", m(C.BQ_NET), "Pharmacy: dispensary, retail and cold chain"],
         ["Net internal", m(C.NET), "Measured from the as-built CAD, not the brief"]],
        ["", "sqm", "What is in it"], [128, 56, FULLW - 184], aligns=["r", "l"], total_row=True))
    el.append(card(
        "<b>The constraint is prime time, not floor area.</b> Consultants want weekday evenings "
        "and Saturday mornings, which the survey shows plainly. That is %d hours a week per "
        "room and %d across the six bookable rooms. At %.2f sessions a week each, prime runs "
        "out at about <b>%d consultants</b>. Our own clinics need about %s room hours a year "
        "and run in the working day, so the two uses do not collide until prime is full. Above "
        "%d you would need the ground floor back, which is an argument for a break clause in "
        "the conversion clinic's lease rather than a longer building."
        % (C.PRIME_H_WK, C.PRIME_CAP_WK, C.SESS_PER_CONSULTANT_WK, C.CONSULTANTS_CAP,
           m(sum(h for _n, _r, _e, h, _o, _f, _s, _d in C.OWN_CLINICS), 0), C.CONSULTANTS_CAP)))

    # ---------------------------------------------------------------- 02 how it earns
    sec(el, "02", "HOW IT EARNS", "Four lines, and only one of them is rent.")
    el.append(tbl(
        [["Rent, downstairs", m(rr("rent"), 1), "%.0f%%" % (100 * rr("rent") / rr("group_rev")),
          "The conversion clinic on %s sqm, diagnostics in the chalet, pharmacy in the boys' "
          "quarters. Contracted, no demand risk" % m(C.CONV_SQM)],
         ["Sessional, upstairs", m(rr("sessional_rev"), 1), "%.0f%%" % (100 * rr("sessional_rev") / rr("group_rev")),
          "Room fees, equipment and membership from %d consultants" % C.CONSULTANTS_TARGET],
         ["Theatre", m(rr("theatre_rev"), 1), "%.0f%%" % (100 * rr("theatre_rev") / rr("group_rev")),
          "Our own lists plus external surgeons. %.0f%% of surveyed consultants need one"
          % (100 * C.THEATRE_EXT_SHARE)],
         ["Our own clinics", m(rr("own_rev_tot"), 1), "%.0f%%" % (100 * rr("own_rev_tot") / rr("group_rev")),
          "Aesthetics, hair restoration, bariatric medicine, longevity and infusion"],
         ["Group revenue", m(rr("group_rev"), 1), "100%", ""]],
        ["", "NGN M", "Share", "What it is"], [116, 52, 44, FULLW - 212],
        aligns=["r", "r", "l"], total_row=True))
    el.append(Paragraph("The rate card, and where it comes from", H2))
    el.append(tbl(
        [["Consulting room, per hour", "NGN %s" % m(C.RACK_HR, 0),
          "A 2 hour session is NGN %s, which is the survey's optimal price point"
          % m(C.RACK_HR * C.UNIT_H, 0)],
         ["Procedure room, per hour", "NGN %s" % m(C.RACK_HR * C.PROC_MULT, 0),
          "Procedure couch, operating light, suction, monitor, sterile field"],
         ["Day case theatre, per hour", "NGN %s" % m(C.RACK_HR * C.THEATRE_MULT, 0),
          "Anaesthesia, HEPA, scrub, two recovery bays"],
         ["Equipment, added per hour", "18,000 to 55,000",
          "Ultrasound, sterile set, laser or IPL. Never discounted to members"],
         ["Membership", "350k to 1.5M a year",
          "Four tiers taken straight off the survey's own distribution. It discounts the room, "
          "not the equipment, which is the only version where the fee pays for itself"]],
        ["", "", "Note"], [136, 84, FULLW - 220], aligns=["r", "l"]))

    # ---------------------------------------------------------------- 03 opcos
    sec(el, "03", "THE OPERATING COMPANIES", "Who exists, and what each one produces.")
    rows = [["Lyfe Place Abuja Ltd", "Medbury 100%", m(rr("campus_rev"), 1), m(rr("campus_eb"), 1),
             "The campus. Holds the head lease and the fit-out, lets downstairs, runs the "
             "sessional business and the theatre"]]
    for n, rev, eb, _h, _o, _f, s, d in C.OWN_CLINICS:
        rows.append([n, "Medbury %.0f%%" % (100 * s), m(rev, 1), m(eb, 1), d])
    for n, a, rate, _o, d in C.TENANTS:
        rows.append([n, "Tenant", "rent %s" % m(a * rate / 1e6, 1), "n/a", d])
    rows.append(["Group", "", m(rr("group_rev"), 1), m(rr("group_eb"), 1),
                 "Attributable to Medbury NGN %s M" % m(rr("attr_eb"), 1)])
    el.append(tbl(rows, ["Company", "Ownership", "Revenue", "EBITDA", "What it is"],
                  [104, 62, 50, 44, FULLW - 260], aligns=["r", "r", "r", "l"],
                  total_row=True, tiny=True))

    # ---------------------------------------------------------------- 04 by year
    sec(el, "04", "THE FINANCIALS", "Every line, by year, then month by month.")
    YRS = ["Year %d" % (i + 1) for i in range(5)]

    el.append(Paragraph("Revenue, every line", H2))
    rev_rows = [["Rent: %s" % n, ] + [m(v, 1) for v in ANN(M["rent_lines"][n])]
                for n in M["rent_lines"]]
    rev_rows += [["Sessional: room fees"] + [m(v, 1) for v in ANN(M["room_fees"])],
                 ["Sessional: equipment hire"] + [m(v, 1) for v in ANN(M["equip"])],
                 ["Sessional: membership"] + [m(v, 1) for v in ANN(M["membership"])],
                 ["Theatre and lists"] + [m(v, 1) for v in ANN(M["theatre_rev"])],
                 ["Campus revenue"] + [m(v, 1) for v in ANN(M["campus_rev"])]]
    rev_rows += [[n] + [m(v, 1) for v in ANN(M["own_rev"][n])] for n in M["own_rev"]]
    rev_rows += [["Group revenue"] + [m(v, 1) for v in ANN(M["group_rev"])]]
    el.append(tbl(rev_rows, ["NGN M"] + YRS, [FULLW - 285] + [57] * 5,
                  aligns=["r"] * 5, total_row=True, hi={len(M["rent_lines"]) + 4}, tiny=True))

    el.append(Paragraph("Operating cost, every line", H2))
    cost_rows = [[n] + [m(-v, 1) for v in ANN(M["cost_lines"][n])] for n in M["cost_lines"]]
    cost_rows += [["Theatre running"] + [m(-v, 1) for v in ANN(M["theatre_cost"])],
                  ["Cost of let hours"] + [m(v, 1) for v in ANN(M["let_cost"])],
                  ["CFA management fee"] + [m(v, 1) for v in ANN(M["mgmt"])],
                  ["Campus operating cost"] + [m(v, 1) for v in ANN(M["campus_cost"])],
                  ["Our own clinics, cost"] + [m(-(a_ - b_), 1) for a_, b_ in
                                               zip(ANN(M["own_rev_tot"]), ANN(M["own_eb_tot"]))],
                  ["Group operating cost"] + [m(v - (a_ - b_), 1) for v, a_, b_ in
                                              zip(ANN(M["campus_cost"]), ANN(M["own_rev_tot"]),
                                                  ANN(M["own_eb_tot"]))]]
    el.append(tbl(cost_rows, ["NGN M"] + YRS, [FULLW - 285] + [57] * 5,
                  aligns=["r"] * 5, total_row=True, tiny=True))

    el.append(Paragraph("Profit and cash", H2))
    el.append(tbl(
        [["Campus EBITDA"] + [m(v, 1) for v in ANN(M["campus_eb"])],
         ["Our own clinics EBITDA"] + [m(v, 1) for v in ANN(M["own_eb_tot"])],
         ["Group EBITDA"] + [m(v, 1) for v in ANN(M["group_eb"])],
         ["Attributable to Medbury"] + [m(v, 1) for v in ANN(M["attr_eb"])],
         ["Head rent, cash timing"] + [m(v, 1) for v in ANN(M["rent_adj"])],
         ["Category A fit-out"] + [m(v, 1) for v in ANN(M["capex"])],
         ["Clinical and basic equipment"] + [m(v, 1) for v in ANN(M["sess_equip"])],
         ["Launch marketing"] + [m(v, 1) for v in ANN(M["mkt_launch"])],
         ["Theatre capital"] + [m(v, 1) for v in ANN(M["p2"])],
         ["Clinical company capital"] + [m(v, 1) for v in ANN(M["own_capex"])],
         ["Contributions on grant"] + [m(v, 1) for v in ANN(M["contrib"])],
         ["Setup programme fee"] + [m(v, 1) for v in ANN(M["fee"])],
         ["Working capital float"] + [m(v, 1) for v in ANN(M["float_"])],
         ["Already committed"] + [m(v, 1) for v in ANN(M["committed"])],
         ["Net cash flow"] + [m(v, 1) for v in ANN(M["cash"])]],
        ["NGN M"] + YRS, [FULLW - 285] + [57] * 5, aligns=["r"] * 5,
        total_row=True, hi={2, 3}, tiny=True))

    el.append(Paragraph("Month by month, the 18 months that decide it", H2))
    MM = 18
    mh = [str(i) for i in range(1, MM + 1)]
    cum = MET["cum"]
    el.append(tbl(
        [["Consultants"] + ["%.0f" % v for v in M["consultants"][:MM]],
         ["Campus rev"] + ["%.0f" % v for v in M["campus_rev"][:MM]],
         ["Clinics rev"] + ["%.0f" % v for v in M["own_rev_tot"][:MM]],
         ["EBITDA"] + ["%.0f" % v for v in M["group_eb"][:MM]],
         ["Cash flow"] + ["%.0f" % v for v in M["cash"][:MM]],
         ["Cumulative"] + ["%.0f" % v for v in cum[:MM]]],
        ["Month"] + mh, [FULLW - MM * 26.0] + [26.0] * MM,
        aligns=["r"] * MM, hi={5}, tiny=True))
    el.append(Paragraph(
        "Opening is month %d. The trough is month %d at NGN %s M, driven by the theatre "
        "capital landing in months 11 to 13 while the consultant ramp is still young. "
        "Group EBITDA turns positive in month %d."
        % (OPEN_M, MET["trough_m"], m(MET["peak"], 0), GRP_POS), SMALL))

    el.append(Paragraph("Each operating company at run rate", H2))
    opco = [["Lyfe Place Abuja Ltd, the campus", "Medbury 100%", m(rr("campus_rev"), 1),
             m(rr("campus_eb"), 1), "%.0f%%" % (100 * rr("campus_eb") / rr("campus_rev")),
             m(rr("campus_eb"), 1)]]
    for n, rev, eb, _h, _o, _f, sh, _d in C.OWN_CLINICS:
        opco.append([n, "Medbury %.0f%%" % (100 * sh), m(rev, 1), m(eb, 1),
                     "%.0f%%" % (100 * eb / rev), m(eb * sh, 1)])
    opco.append(["Group", "", m(rr("group_rev"), 1), m(rr("group_eb"), 1),
                 "%.0f%%" % (100 * rr("group_eb") / rr("group_rev")), m(rr("attr_eb"), 1)])
    el.append(tbl(opco, ["Company", "Ownership", "Revenue", "EBITDA", "Margin", "To Medbury"],
                  [FULLW - 300, 66, 56, 54, 48, 66], aligns=["r", "r", "r", "r", "r"],
                  total_row=True, tiny=True))

    # ---------------------------------------------------------------- 05 money
    sec(el, "05", "THE MONEY", "What has to be available, and when it comes back.")
    el.append(tbl(
        [[lbl, m(v, 1), note] for lbl, v, note in MINROWS] +
        [["Minimum to open and run six months", m(MINOPEN, 1),
          "Building only, without the four clinics: NGN %s M" % m(MINOPEN - OWNCAP, 1)]],
        ["", "NGN M", "Note"], [176, 56, FULLW - 232], aligns=["r", "l"], total_row=True))
    el.append(Spacer(1, 4))
    el.append(tbl(
        [["Campus revenue covers campus opex", "Month %d" % CAMP_POS, "%d months after opening" % FROM_OPEN(CAMP_POS)],
         ["Group EBITDA turns positive", "Month %d" % GRP_POS, "%d months after opening" % FROM_OPEN(GRP_POS)],
         ["Trough of the bank balance", "Month %d" % MET["trough_m"], "NGN %s M under water" % m(MET["peak"], 0)],
         ["Capital returned in full", "Month %d" % MET["payback"], "%d months after opening" % FROM_OPEN(MET["payback"])]],
        ["When it funds itself", "", "Note"], [176, 56, FULLW - 232], aligns=["r", "l"], hi={1}))

    # ---------------------------------------------------------------- 06 assumptions
    sec(el, "06", "ASSUMPTIONS", "Where each number comes from, and which ones to argue with.")
    el.append(tbl(ASSUMPTIONS, ["Assumption", "Value", "Basis", "What it rests on"],
                  [104, 70, 68, FULLW - 242], aligns=["r", "r", "l"], tiny=True))
    el.append(Paragraph(
        "MEASURED comes from the as-built drawings. SURVEY comes from the consultant survey, "
        "n=20, run 12 to 19 August 2026, against a target of 40 to 60, so read it with care. "
        "SCHEDULED comes from the 74 line fit-out estimate. JUDGEMENT is ours and is where you "
        "should push.", SMALL))

    # ---------------------------------------------------------------- 07 returns
    sec(el, "07", "RETURNS", "With no terminal value anywhere, so these are floors.")
    el.append(tbl(
        [["Internal rate of return, five years", "%.0f%%" % (100 * MET["irr"]), "Nominal naira"],
         ["Net present value at 25%", "NGN %s M" % m(MET["npv"], 0), "Five years only, nothing beyond"],
         ["Cash returned per naira in", "%.1f times" % MET["coc"], "Over the peak ever invested"],
         ["Payback from opening", "%d months" % FROM_OPEN(MET["payback"]), "Month %d on the programme clock" % MET["payback"]],
         ["Peak funding", "NGN %s M" % m(MET["peak"], 0), "Month %d" % MET["trough_m"]]],
        ["", "", "Note"], [176, 74, FULLW - 250], aligns=["r", "l"], hi={0}))

    # ---------------------------------------------------------------- 08 stress
    sec(el, "08", "THE STRESS TEST", "What would have to go wrong, and how wrong.")
    el.append(tbl(
        [[lbl, "%.0f" % s["peak"], ("%.0f%%" % (100 * s["irr"])) if s["irr"] else "n/a",
          "%.0f" % s["npv"], str(s["pay"]) if s["pay"] else "never"]
         for lbl, s in STRESS_OUT],
        ["Case", "Peak", "IRR", "NPV", "Payback"], [FULLW - 240, 58, 52, 58, 62],
        aligns=["r", "r", "r", "r"], hi={0}, tiny=True))
    el.append(Paragraph("How far each number can fall before the NPV goes negative", H2))
    el.append(tbl(BREAKEVENS, ["Driver", "Base", "Breaks at", "Room to move"],
                  [FULLW - 260, 78, 80, 102], aligns=["r", "r", "r"], tiny=True))
    el.append(card(
        "<b>No single failure kills this, and two demand failures together do.</b> Losing "
        "Alameda entirely still returns %.0f per cent, because the ground floor rent is a small "
        "part of a NGN %s M business. Losing the theatre is survivable too. But 30 "
        "consultants arriving slowly, combined with the survey being optimistic on price and "
        "frequency, takes the return to single figures.<br/><br/>"
        "The asymmetry is the point. You can overrun the fit-out by %.0f per cent and still make "
        "money. You can only miss the consultant target by %.0f per cent. <b>This is a demand "
        "risk wearing a construction project's clothes</b>, and the thinnest margin in it rests "
        "on 20 survey responses. Widening that survey before you commit the fit-out is the "
        "cheapest risk reduction available."
        % (100 * ALAMEDA_IRR, m(rr("group_rev"), 0), FIT_HEADROOM, CONS_HEADROOM), bg=ALERT))

    # ---------------------------------------------------------------- 09 decisions
    sec(el, "09", "DECISIONS", "What is needed now, and what can wait.")
    el.append(tbl(
        [["1", "Accept the measured areas and the lean fit-out", "This week",
          "NGN %s M against a scheduled NGN %s M, same opening date" % (m(C.FIT_LEAN, 1), m(C.FIT_SCHEDULED_FULL, 1))],
         ["2", "Approve the design sprint and place the long lead orders", "Week 1",
          "Cooling, medical gas and nurse call have 6 to 12 week lead times. Ordered "
          "late, no amount of labour recovers month %d" % OPEN_M],
         ["3", "Start the FCT licence application in week one", "Week 1",
          "The facility licence, fire certificate and waste permit are the real gate on "
          "opening. They are not in our gift or the contractor's"],
         ["4", "Settle the conversion clinic lease, with a break at year three", "This month",
          "NGN %s M a year on %s sqm, quoted as three lines: rent 111,771, fit-out recovery "
          "71,413, service charge 149,029. Housing them costs 332,214 a sqm, so anything "
          "below that is a subsidy. The break matters because if consultants sign faster "
          "than %d, that floor is worth more as bookable rooms"
          % (m(_CONV_RENT, 1), m(C.CONV_SQM), C.CONSULTANTS_CAP)],
         ["5", "Fund NGN %s M to open and run six months" % m(MINOPEN, 0), "This month",
          "Peak exposure is NGN %s M in month %d" % (m(MET["peak"], 0), MET["trough_m"])],
         ["6", "Widen the consultant survey past 20 responses", "Next 6 weeks",
          "It is the thinnest assumption in the pack and the cheapest one to firm up"],
         ["7", "Open the surgical anchor conversation", "This month",
          "The theatre is worth NGN %s M of EBITDA and it needs a surgeon with his own list"
          % m(rr("theatre_rev"), 0)]],
        ["", "Decision", "By", "Why now"], [20, 176, 58, FULLW - 254], aligns=["r", "l", "l"], tiny=True))
    el.append(card(
        "<b>The single sentence version.</b> Two months to fit out and open in month %d; NGN %s M "
        "to open and run six months, peaking at NGN %s M; %d consultants signed makes it a NGN "
        "%s M business producing NGN %s M attributable to Medbury; the money is home in month %d "
        "and returns %.0f per cent. The building is not the risk. Signing the consultants is."
        % (OPEN_M, m(MINOPEN, 0), m(MET["peak"], 0), C.CONSULTANTS_TARGET,
           m(rr("group_rev"), 0), m(rr("attr_eb"), 0), MET["payback"], 100 * MET["irr"]), bg=CREAM))

    el.append(Spacer(1, 8))
    f = Table([[Paragraph("Debo Odulana   Consult for Africa   /   +234 913 813 8553   /   "
                          "hello@consultforafrica.com", CELLW)]], colWidths=[FULLW])
    f.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), NAVY),
                           ("LEFTPADDING", (0, 0), (-1, -1), 9),
                           ("TOPPADDING", (0, 0), (-1, -1), 7),
                           ("BOTTOMPADDING", (0, 0), (-1, -1), 7)]))
    el.append(f)
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "Areas measured from the as-built CAD to about 10 mm; the chalet and boys' quarters have "
        "no as-built drawing and remain estimates. Pricing from the premium medipark consultant "
        "survey, n=20, 12 to 19 August 2026. The fit-out is an AACE class 4 estimate, minus 15 "
        "to plus 30 per cent, before a tendered bill of quantities. Revenue and EBITDA for the "
        "clinics carry the assumptions in section 06, of which aesthetics volume, membership "
        "uptake and the bariatric case rate are the least evidenced. Related party charges are "
        "subject to a transfer pricing opinion. Not a binding offer, and not legal or tax "
        "advice. FX reference USD/NGN 1,550.", SMALL))
    doc.build(el)


if __name__ == "__main__":
    # ---- derived figures the document needs before it is written
    opex = [-x for x in M["campus_cost"]]
    OWNCAP = sum(C.OWN_CLINIC_CAPITAL.values())
    pre = sum(opex[:OPEN_M - 1])
    trade6 = sum(opex[OPEN_M - 1:OPEN_M + 5])
    rev6 = sum(M["campus_rev"][OPEN_M - 1:OPEN_M + 5])
    MINROWS = [
        ("Category A fit-out, after the line by line review", C.FIT_LEAN, "Two months on site"),
        ("Clinical and basic equipment for the six let rooms", C.SESSIONAL_EQUIPMENT,
         "Couches, procedure lights, monitors, autoclave, resus trolley, front office"),
        ("Launch marketing", C.MARKETING_LAUNCH,
         "Brand and identity, website and booking front end, photography, launch and "
         "consultant open evenings. Drawn across the three months to opening"),
        ("Setup programme fee", C.CFA_FEE, "NGN %s M of it on mobilisation" % m(C.CFA_MOB, 0)),
        ("Pre-opening operating cost", pre, "Months 1 to %d" % (OPEN_M - 1)),
        ("Operating cost, first six trading months", trade6, "Management fee included"),
        ("Capital for the four clinics", OWNCAP, "Equipment, opening stock, working capital"),
        ("Less revenue, first six trading months", -rev6, ""),
        ("Less contributions on grant", -C.CONTRIB_TOTAL, "Occupier cash on grant of each sub lease"),
    ]
    MINOPEN = sum(v for _l, v, _n in MINROWS)
    _CONV_RENT = next(a * r / 1e6 for n, a, r, _o, _d in C.TENANTS if "Alameda" in n)
    first = lambda c: next((i + 1 for i in range(C.HORIZON) if c(i)), None)
    CAMP_POS = first(lambda i: M["campus_eb"][i] >= 0)
    GRP_POS = first(lambda i: M["group_eb"][i] >= 0)

    STRESS_OUT = []
    for lbl, kw in STRESS:
        _MM, _me = scenario(**kw)
        STRESS_OUT.append((lbl, dict(peak=_me["peak"], irr=_me["irr"], npv=_me["npv"],
                                     pay=(_me["payback"] - OPEN_M + 1) if _me["payback"] else None)))
    ALAMEDA_IRR = dict(STRESS_OUT)["Alameda walks away, no ground floor tenant"]["irr"]

    be_cons = solve("CONSULTANTS_TARGET", 20, C.CONSULTANTS_TARGET, integer=True)
    be_rack = solve("RACK_HR", 18_000, C.RACK_HR)
    be_sess = solve("SESS_PER_CONSULTANT_WK", 0.9, C.SESS_PER_CONSULTANT_WK)
    be_ramp = solve("CONSULTANTS_RAMP_M", C.CONSULTANTS_RAMP_M, 48, integer=True, higher_is_worse=True)
    be_fit = solve("FIT_SCHEDULED", C.FIT_LEAN, 700.0, higher_is_worse=True)
    CONS_HEADROOM = 100 * (BASE_VALS["CONSULTANTS_TARGET"] - be_cons) / BASE_VALS["CONSULTANTS_TARGET"]
    FIT_HEADROOM = 100 * (be_fit - C.FIT_LEAN) / C.FIT_LEAN
    BREAKEVENS = [
        ["Consultants signed", "%d" % BASE_VALS["CONSULTANTS_TARGET"], "%.0f" % be_cons,
         "%.0f%% below plan" % CONS_HEADROOM],
        ["Rack rate an hour", m(BASE_VALS["RACK_HR"], 0), m(be_rack, 0),
         "%.0f%% below plan" % (100 * (BASE_VALS["RACK_HR"] - be_rack) / BASE_VALS["RACK_HR"])],
        ["Sessions per consultant a week", "%.2f" % BASE_VALS["SESS_PER_CONSULTANT_WK"], "%.2f" % be_sess,
         "%.0f%% below plan" % (100 * (BASE_VALS["SESS_PER_CONSULTANT_WK"] - be_sess) / BASE_VALS["SESS_PER_CONSULTANT_WK"])],
        ["Months to reach the target", "%d" % BASE_VALS["CONSULTANTS_RAMP_M"], "%.0f" % be_ramp,
         "%.0f months of slack" % (be_ramp - BASE_VALS["CONSULTANTS_RAMP_M"])],
        ["Category A fit-out", m(C.FIT_LEAN, 1), m(be_fit, 1),
         "%.0f%% over budget" % FIT_HEADROOM],
    ]
    ASSUMPTIONS = [
        ["Net internal area", "%s sqm" % m(C.NET), "MEASURED", "As-built CAD to about 10 mm. Both floors return 70% efficiency"],
        ["Lettable ground floor", "%s sqm" % m(C.GF_LETTABLE), "MEASURED", "282.2 less shared services. Everything else lets to the clinic"],
        ["Bookable rooms upstairs", "%d" % C.BOOKABLE, "MEASURED", "%d consulting and %d procedure. The infusion suite is dedicated" % (C.ROOMS_CONSULT, C.ROOMS_PROC)],
        ["Session price", "NGN %s" % m(C.RACK_HR * C.UNIT_H, 0), "SURVEY", "Optimal price point 65,000, indifference 85,000, on a 2 hour unit"],
        ["Sessions per consultant", "%.2f a week" % C.SESS_PER_CONSULTANT_WK, "SURVEY", "Q5. Half of them want two or more"],
        ["Membership tiers", "350k to 1.5M", "SURVEY", "Q13. The old 1.2M to 4.2M tiers do not survive this sample"],
        ["Theatre demand", "%.0f%%" % (100 * C.THEATRE_EXT_SHARE), "SURVEY", "Q15. 30% need a full theatre, 24% need sedation"],
        ["Consultants signed", "%d in %d months" % (C.CONSULTANTS_TARGET, C.CONSULTANTS_RAMP_M), "JUDGEMENT",
         "Assumes the business development officer is in post from month 2 and the recruitment line is spent"],
        ["Equipment attach rate", "%.0f%%" % (100 * C.EQUIP_ATTACH), "JUDGEMENT", "Not asked in the survey"],
        ["Own clinic revenue", "NGN %s M" % m(sum(x[1] for x in C.OWN_CLINICS), 0), "JUDGEMENT",
         "Built from room hours and price lists, not comparable audited accounts"],
        ["Category A fit-out", "NGN %s M" % m(C.FIT_LEAN, 1), "SCHEDULED", "74 measured lines, AACE class 4, minus 15 to plus 30 per cent"],
        ["Head rent", "NGN %s M" % m(C.HEAD_RENT, 1), "CONTRACTED", "Two years already paid inside the NGN 115 M committed"],
        ["Discount rate", "%.0f%%" % (100 * C.DISCOUNT), "JUDGEMENT", "Naira nominal, five years, no terminal value"],
    ]
    importlib.reload(C)
    build()
    print("wrote %s" % OUT.name)
    print("  opens m%d | min to open %.0f | peak %.0f | IRR %.0f%% | NPV %.0f | payback m%d"
          % (OPEN_M, MINOPEN, MET["peak"], 100 * MET["irr"], MET["npv"], MET["payback"]))
