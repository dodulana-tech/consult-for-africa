"""
What is due to Consult for Africa on the Lyfe Place Abuja campus.

A standalone fee schedule. Every figure is either a published day rate times days, or
comes from scripts/lyfeplace_campus.py, so it cannot drift from the financial model.

    python3 scripts/build-lyfeplace-cfa-fees.py
"""

from __future__ import annotations

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
OUT = ROOT / "docs" / "lyfeplace-abuja" / "lyfeplace-cfa-fees.pdf"

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
CELL = style("cell", fontSize=8.2, leading=10.8)
CELLB = style("cellb", fontSize=8.2, leading=10.8, fontName="Helvetica-Bold")
CELLW = style("cellw", fontSize=8.2, leading=10.8, textColor=colors.white,
              fontName="Helvetica-Bold")


def m(x, dp=1):
    return ("{:,.%df}" % dp).format(x)


def sec(el, num, eyebrow, title):
    el.append(CondPageBreak(150))
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
    cmds = [("BACKGROUND", (0, 0), (-1, 0), NAVY),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LINEBELOW", (0, 0), (-1, -1), 0.4, RULE),
            ("TOPPADDING", (0, 0), (-1, -1), 3.4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3.4),
            ("LEFTPADDING", (0, 0), (-1, -1), 5),
            ("RIGHTPADDING", (0, 0), (-1, -1), 5)]
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
    t = Table([[Paragraph(text, style("card", fontSize=8.5, leading=11.9))]],
              colWidths=[FULLW])
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), bg),
                           ("LINEBEFORE", (0, 0), (0, -1), 2.2, rule),
                           ("LEFTPADDING", (0, 0), (-1, -1), 9),
                           ("RIGHTPADDING", (0, 0), (-1, -1), 9),
                           ("TOPPADDING", (0, 0), (-1, -1), 7),
                           ("BOTTOMPADDING", (0, 0), (-1, -1), 7)]))
    return t


def furniture(canv, doc):
    canv.saveState()
    canv.setFillColor(NAVY)
    canv.rect(0, PH - 15 * mm, PW, 15 * mm, stroke=0, fill=1)
    canv.setFillColor(colors.white)
    canv.setFont("Helvetica-Bold", 8.2)
    canv.drawString(MARGIN, PH - 10 * mm, "CONSULT FOR AFRICA")
    canv.setFont("Helvetica", 8.2)
    canv.drawRightString(PW - MARGIN, PH - 10 * mm, "Lyfe Place Abuja  /  fee schedule")
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


# =============================================================================
# THE FEE
# =============================================================================
RATES = [
    ("Partner, engagement lead", 750_000, 10),
    ("Principal, workstream lead", 450_000, 35),
    ("Senior consultant", 300_000, 37),
    ("Consultant, including the site engineer", 190_000, 67),
    ("Analyst", 120_000, 29),
]
# days by grade, in RATES order: partner, principal, senior, consultant, analyst
GRID = {
    "1  Fit-out delivery and commissioning":                        [2, 10, 8, 30, 6],
    "2  The operating companies: structure and business case":      [2, 10, 9, 22, 13],
    "3  Commercial: rate card, sessional model, transfer pricing":  [3, 7, 9, 7, 5],
    "4  Clinical governance, campus hiring and the pipeline":       [3, 8, 11, 8, 5],
}
SHORT = {
    "1  Fit-out delivery and commissioning": "1  Fit-out delivery",
    "2  The operating companies: structure and business case": "2  OpCos and business cases",
    "3  Commercial: rate card, sessional model, transfer pricing": "3  Commercial and rate card",
    "4  Clinical governance, campus hiring and the pipeline": "4  Governance and hiring",
}
PROG_DISCOUNT = 0.10
RATE_LIST = [r for _n, r, _d in RATES]
GRADE_NAMES = [n for n, _r, _d in RATES]
WS_DAYS = {k: sum(v) for k, v in GRID.items()}
WS_VALUE = {k: sum(v[i] * RATE_LIST[i] for i in range(5)) / 1e6 for k, v in GRID.items()}
for _n, _r, _d in RATES:
    assert sum(GRID[k][GRADE_NAMES.index(_n)] for k in GRID) == _d, "grid disagrees with %s" % _n

WORKSTREAMS = [
    ("1  Fit-out delivery and commissioning", 0, 0,
     "Design coordination, bill of quantities, tender, contractor selection, a site "
     "engineer on site 2.5 days a week through the build, commissioning, "
     "snagging and handover"),
    ("2  The operating companies: structure and business case", 0, 0,
     "60 discrete instruments: six incorporations with their memoranda, share "
     "allotments, statutory books, tax and bank registrations; two negotiated joint "
     "venture shareholder agreements; three sub leases and four occupancy agreements; "
     "the division licence; six board constitutions. Plus the business case behind each "
     "company, because the objects clause and the revenue model are one conversation. "
     "35 of the 56 days sit at consultant level or below: the filings, the "
     "templated instruments and the business case build. The partner appears only on the "
     "two negotiated joint venture agreements"),
    ("3  Commercial: rate card, sessional model, transfer pricing", 0, 0,
     "Room and equipment rate card, membership tiers, booking and billing rules, lease "
     "documents, and the transfer pricing file that 84 per cent of campus revenue rests on"),
    ("4  Clinical governance, campus hiring and the pipeline", 0, 0,
     "Regulatory file, clinical protocols and governance; the credentialing framework and "
     "the first cohort; 18 campus posts briefed, shortlisted and hired; the consultant "
     "proposition, pipeline and onboarding built and handed to the business development officer"),
]
WORKSTREAMS = [(k, WS_DAYS[k], WS_VALUE[k], d) for k, _dd, _vv, d in WORKSTREAMS]
FEE_GROSS = sum(r * d for _n, r, d in RATES) / 1e6
assert abs(sum(WS_VALUE.values()) - FEE_GROSS) < 0.01
FEE_NET = FEE_GROSS * (1 - PROG_DISCOUNT)
FEE_MOB = 25.0
TOTAL_DAYS = sum(d for _n, _r, d in RATES)
THIRD_PARTY = 12.0

M = C.build()
MET = C.metrics(M["cash"])
ANN = lambda v: [sum(v[i * 12:(i + 1) * 12]) for i in range(5)]
MGMT = [-x for x in M["mgmt"]]
MGMT_Y = ANN(MGMT)
REV_Y = ANN(M["campus_rev"])
MGMT_5 = sum(MGMT_Y)
ATTR_5 = sum(ANN(M["attr_eb"]))
CFA_5 = FEE_NET + MGMT_5


def build():
    doc = BaseDocTemplate(str(OUT), pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN,
                          topMargin=22 * mm, bottomMargin=18 * mm,
                          title="Lyfe Place Abuja: fees due to Consult for Africa",
                          author="Consult for Africa")
    doc.addPageTemplates([PageTemplate(
        id="main",
        frames=[Frame(MARGIN, 18 * mm, FULLW, PH - 40 * mm, id="f")],
        onPage=furniture)])
    el = []

    el.append(Paragraph("What is due to Consult for Africa",
                        style("t", fontName="Helvetica-Bold", fontSize=19, leading=22,
                              textColor=NAVY, spaceAfter=2)))
    el.append(Paragraph("Lyfe Place Abuja. One page of totals, then the build for each one.",
                        style("st", fontName="Helvetica-Oblique", fontSize=11, leading=14,
                              textColor=GOLD, spaceAfter=8)))

    # -------------------------------------------------------------- letter
    el.append(Paragraph("Dr Itunu Akinware, Group Chief Executive, Medbury Medical Services",
                        style("lt", fontName="Helvetica-Bold", fontSize=9.4, leading=12,
                              textColor=NAVY, spaceAfter=5)))
    for para in [
        "Itunu,",
        "Thank you for asking to see our fees on their own. This document covers only that, "
        "and I have set out everything behind both numbers in the pages that follow.",
        "The mandate is a substantial one. Six companies incorporated and structured. A %s "
        "sqm campus across four structures converted, equipped and licensed. 18 people "
        "recruited into it. The doors open in month %d. And the business run thereafter."
        % (m(C.NET), C.CONSULTANTS_OPEN_M),
        "We have priced it as two fees because it is genuinely two pieces of work.",
        "The <b>setup programme</b> covers everything up to opening. It is priced as "
        "resourced time, %d days across five named grades at our published rates, which "
        "comes to NGN %s M gross and NGN %s M after the programme rate. It ends when the "
        "campus opens." % (TOTAL_DAYS, m(FEE_GROSS, 1), m(FEE_NET, 1)),
        "The <b>management fee</b> is for operating the campus once it trades. We have "
        "deliberately subordinated it to your capital: %.1f per cent of campus revenue until "
        "your investment is returned, and %.1f per cent thereafter. It begins in month %d, so "
        "you pay us nothing for it through the fit-out."
        % (100 * C.MGMT_FEE_BEFORE, 100 * C.MGMT_FEE_AFTER, C.MGMT_FEE_START_M),
        "Mobilisation is NGN %s M, payable on instruction. The architect, the mechanical and "
        "electrical engineer and the quantity surveyor are passed through at cost, with no "
        "mark up from us." % m(FEE_MOB, 0),
        "I am happy to take you through any part of it.",
    ]:
        el.append(Paragraph(para, P))
    el.append(Paragraph(
        "Debo Odulana<br/><font size=8 color='#6b7280'>Founding Partner, Consult for Africa</font>",
        style("sig", fontName="Helvetica-Bold", fontSize=9.4, leading=13, textColor=NAVY,
              spaceBefore=6, spaceAfter=9)))

    # -------------------------------------------------------------- summary
    el.append(Paragraph("SUMMARY", EYEBROW))
    el.append(Paragraph("Everything due, on one page.", H1))
    el.append(tbl(
        [["Setup programme, payable", "NGN %s M" % m(FEE_NET, 1), "One off",
          "%d days across five grades, after a %d%% programme rate" % (TOTAL_DAYS, 100 * PROG_DISCOUNT)],
         ["   of which mobilisation", "NGN %s M" % m(FEE_MOB, 1), "On instruction",
          "Non refundable. Starts the two week design sprint"],
         ["   of which balance", "NGN %s M" % m(FEE_NET - FEE_MOB, 1), "Four instalments",
          "Each released on a named deliverable, not on hours. Section 01 lists them"],
         ["Management fee, years 1 to 5", "NGN %s M" % m(MGMT_5, 1), "Monthly, from month %d" % C.MGMT_FEE_START_M,
          "%.1f%% of campus revenue, stepping to %.1f%% once your capital is home"
          % (100 * C.MGMT_FEE_BEFORE, 100 * C.MGMT_FEE_AFTER)],
         ["Total to Consult for Africa, 5 years", "NGN %s M" % m(CFA_5, 1), "",
          "Built once, then a share of what the campus earns"]],
        ["", "NGN M", "When", "Note"], [128, 62, 74, FULLW - 264],
        aligns=["r", "l", "l"], total_row=True, hi={0, 3}))
    el.append(Spacer(1, 3))
    el.append(tbl(
        [["Third party consultants", "NGN %s M" % m(THIRD_PARTY, 1),
          "Architect and interior designer, mechanical and electrical, quantity surveyor. "
          "At cost, no mark up. Sits in the fit-out schedule, not in our fee"]],
        ["Third party, at cost", "NGN M", "Note"],
        [128, 62, FULLW - 190], aligns=["r", "l"]))

    # -------------------------------------------------------------- 01 setup
    sec(el, "01", "THE SETUP PROGRAMME", "Billed as time, at published rates.")
    el.append(Paragraph(
        "This is a resourced programme rather than a retainer, so it is priced the way a "
        "programme should be. Nothing is loaded on the capital value of the building and "
        "nothing is a percentage of your spend.", P))
    el.append(tbl(
        [[n, "NGN %s" % m(r / 1000, 0), str(d), "NGN %s M" % m(r * d / 1e6, 1)] for n, r, d in RATES] +
        [["Programme", "", str(TOTAL_DAYS), "NGN %s M" % m(FEE_GROSS, 2)]],
        ["Grade", "000 / day", "Days", "NGN M"],
        [FULLW - 240, 74, 62, 104], aligns=["r", "r", "r"], total_row=True))
    el.append(Spacer(1, 4))
    el.append(Paragraph("Every day, by grade and by workstream", H2))
    el.append(tbl(
        [[SHORT[k]] +
         [str(GRID[k][i]) for i in range(5)] + [str(WS_DAYS[k]), "NGN %s M" % m(WS_VALUE[k], 1)]
         for k in GRID] +
        [["Days by grade"] + [str(d) for _n, _r, d in RATES] + [str(TOTAL_DAYS), ""]] +
        [["Value by grade"] + ["%s M" % m(r * d / 1e6, 1) for _n, r, d in RATES] +
         ["", "NGN %s M" % m(FEE_GROSS, 2)]],
        ["Workstream", "Ptnr", "Prin", "Snr", "Cons", "Anly", "Days", "NGN M"],
        [FULLW - 300, 34, 34, 34, 36, 36, 40, 62],
        aligns=["r", "r", "r", "r", "r", "r", "r"], total_row=True, tiny=True))
    el.append(Paragraph(
        "Partner NGN 750,000 a day, principal 450,000, senior consultant 300,000, "
        "consultant 190,000, analyst 120,000. Blended across the programme that is "
        "NGN %s a day. Read down a column to see how much of each grade you are buying; "
        "read across a row to see what a workstream costs and why."
        % format(int(FEE_GROSS * 1e6 / TOTAL_DAYS), ","), SMALL))
    el.append(Spacer(1, 4))
    el.append(Paragraph("What each workstream delivers", H2))
    el.append(tbl(
        [[w[0], str(w[1]), "NGN %s M" % m(w[2], 1), w[3]] for w in WORKSTREAMS] +
        [["%d workstreams, one mandate" % len(WORKSTREAMS), str(TOTAL_DAYS), "NGN %s M" % m(FEE_GROSS, 2), ""]],
        ["Workstream", "Days", "NGN M", "What it delivers"],
        [178, 38, 56, FULLW - 272], aligns=["r", "r", "l"], total_row=True, tiny=True))
    el.append(Spacer(1, 4))
    el.append(tbl(
        [["Professional fees at published rates", "NGN %s M" % m(FEE_GROSS, 2),
          "%d days across five grades" % TOTAL_DAYS],
         ["Programme rate", "(NGN %s M)" % m(FEE_GROSS - FEE_NET, 2),
          "%d%%, because this is one continuous mandate and not %d engagements"
          % (100 * PROG_DISCOUNT, len(WORKSTREAMS))],
         ["Payable", "NGN %s M" % m(FEE_NET, 2),
          "Capped at this figure. Released against the deliverables below"]],
        ["", "NGN M", "Note"], [178, 74, FULLW - 252], aligns=["r", "l"], hi={2}))
    el.append(card(
        "<b>Mobilisation, NGN %s M, non refundable.</b> It is %.0f per cent of the payable "
        "fee because month one is %.0f per cent of the programme and all of the risk. "
        "54 of the 178 days land in it: the design sprint, "
        "the tendered bill of quantities, contractor selection, six companies lodged at CAC, "
        "the FCT licence application, and the long lead orders that decide whether you open "
        "in month %d at all.<br/><br/>"
        "By week four you should have the measured site design and room data sheets, a "
        "tendered bill of quantities, a selected contractor, the incorporations lodged, and "
        "the architect, engineer and quantity surveyor appointed. If those are not on your "
        "desk, the conversation about the balance is a different one."
        % (m(FEE_MOB, 0), 100 * FEE_MOB / FEE_NET, 100 * 54 / TOTAL_DAYS,
           C.CONSULTANTS_OPEN_M), bg=ALERT))

    el.append(Paragraph("What releases each instalment", H2))
    _bal = FEE_NET - FEE_MOB
    _q = _bal / 4
    el.append(tbl(
        [["On instruction", "NGN %s M" % m(FEE_MOB, 1),
          "Mobilisation. Non refundable, and it starts the design sprint"],
         ["End of month 1", "NGN %s M" % m(_q, 2),
          "Site design concluded and room data sheets issued. Bill of quantities tendered. "
          "Contractor selected. Six companies lodged at CAC. FCT licence application filed. "
          "Long lead items ordered"],
         ["End of month 2", "NGN %s M" % m(_q, 2),
          "Contractor on site and building to programme. Reception, booking and front office "
          "hired. Rate card, sub leases and occupancy agreements drafted"],
         ["End of month 3", "NGN %s M" % m(_q, 2),
          "Commissioning complete, licence granted, campus open and trading. Nursing pool and "
          "care coordination in post. Credentialing framework live"],
         ["End of month 4", "NGN %s M" % m(_q, 2),
          "Four clinical business cases delivered. Transfer pricing file issued. Consultant "
          "pipeline and onboarding handed to the business development officer"],
         ["Setup programme, total", "NGN %s M" % m(FEE_NET, 2),
          "Capped. Never more than this, whatever the days come to"]],
        ["When", "NGN M", "What has to be delivered first"],
        [90, 62, FULLW - 152], aligns=["r", "l"], total_row=True, tiny=True))
    el.append(Paragraph(
        "No instalment is released on elapsed time or on hours worked. If a deliverable is "
        "late, the instalment waits. If we take more days than we have priced to get there, "
        "that is our problem and the fee is capped regardless.", SMALL))

    # -------------------------------------------------------------- 02 management
    sec(el, "02", "THE MANAGEMENT FEE", "Paid for running it, and only once it runs.")
    el.append(Paragraph(
        "Running a campus, a sessional business and four clinical companies is an operating "
        "job. It cannot be billed by the day for seven years, so it sits on a percentage of "
        "campus revenue. Two things about how it is set matter more than the number itself.", P))
    el.append(tbl(
        [["It starts at month %d" % C.MGMT_FEE_START_M, "Not on instruction",
          "There is nothing to manage until the doors open. You pay nothing for the "
          "%d months of fit-out" % (C.CONSULTANTS_OPEN_M - 1)],
         ["It is subordinated to your capital", "%.1f%% then %.1f%%"
          % (100 * C.MGMT_FEE_BEFORE, 100 * C.MGMT_FEE_AFTER),
          "The lower rate applies until your money is home. We are paid properly only "
          "after you have been"],
         ["It is on campus revenue, not group", "Excludes the clinics",
          "The four clinical companies upstairs pay us nothing. Only the campus company does"]],
        ["How it is set", "", "Why"], [128, 92, FULLW - 220], aligns=["r", "l"]))
    el.append(Spacer(1, 4))
    el.append(tbl(
        [["Year %d" % (i + 1), "NGN %s M" % m(REV_Y[i], 1), "NGN %s M" % m(MGMT_Y[i], 1),
          "%.1f%%" % (100 * MGMT_Y[i] / REV_Y[i]) if REV_Y[i] else "n/a"]
         for i in range(5)] +
        [["Five years", "", "NGN %s M" % m(MGMT_5, 1), ""]],
        ["", "Campus revenue", "Management fee", "Effective rate"],
        [128, 100, 100, FULLW - 328], aligns=["r", "r", "r"], total_row=True))
    el.append(Paragraph(
        "The effective rate rises through year three because that is when cumulative cash "
        "turns and the fee steps from %.1f to %.1f per cent. On the model as it stands your "
        "capital is home in month %d, which is %d months after opening."
        % (100 * C.MGMT_FEE_BEFORE, 100 * C.MGMT_FEE_AFTER, MET["payback"], MET["payback"] - C.CONSULTANTS_OPEN_M + 1),
        SMALL))

    # -------------------------------------------------------------- 03 not charged
    sec(el, "03", "WHAT IS NOT CHARGED", "So the total is the total.")
    el.append(tbl(
        [["Third party consultants", "NGN %s M, at cost" % m(THIRD_PARTY, 1),
          "Architect and interior designer, mechanical and electrical engineer, quantity "
          "surveyor. No mark up from us. They appear in the fit-out schedule"],
         ["Success or promote on the ventures", "Nil",
          "We take no carried interest in the clinical companies under this mandate"],
         ["Fee on the fit-out value", "Nil",
          "Our fee does not move if the bill of quantities comes back higher"],
         ["Recruitment fees per consultant", "Nil",
          "Signing the consultants sits inside workstream 4, not a per placement charge"],
         ["Fee during fit-out", "Nil",
          "The management fee starts at month %d, not on instruction" % C.MGMT_FEE_START_M],
         ["Travel and disbursements", "At cost",
          "Abuja site attendance is inside the day rates. Travel outside Abuja is not, and "
          "is charged at cost with receipts"]],
        ["", "", "Note"], [140, 100, FULLW - 240], aligns=["r", "l"]))
    el.append(card(
        "<b>What this fee does not move with.</b> It does not rise if the bill of quantities "
        "comes back higher, because it is days and not a percentage of your spend. It does "
        "not rise if the campus outperforms, because the setup programme is capped. And it "
        "falls if the campus underperforms, because the management fee is a share of revenue "
        "that only exists once there is revenue. At 30 consultants instead of %d our five "
        "year total is about a quarter lower. We are carrying the demand risk alongside you, "
        "not billing through it." % C.CONSULTANTS_TARGET))

    # -------------------------------------------------------------- 04 terms
    sec(el, "04", "TERMS", "Short, and all of them.")
    el.append(tbl(
        [["1", "Mobilisation of NGN %s M is payable on instruction and is non refundable."
          % m(FEE_MOB, 1)],
         ["2", "The balance of NGN %s M is released in four equal instalments, each on "
          "delivery of the milestone set out in section 01 and not on elapsed time or hours. "
          "Capped at that figure." % m(FEE_NET - FEE_MOB, 1)],
         ["3", "Invoices are payable within 14 days. Work continues while an invoice is "
          "current and pauses if one is 30 days overdue."],
         ["4", "The management fee is invoiced monthly in arrears from month %d at %.1f per "
          "cent of campus revenue, stepping to %.1f per cent in the month after Medbury's "
          "capital is returned."
          % (C.MGMT_FEE_START_M, 100 * C.MGMT_FEE_BEFORE, 100 * C.MGMT_FEE_AFTER)],
         ["5", "Either party may end the management appointment on six months' notice. The "
          "setup programme may be ended on 30 days, with time worked payable."],
         ["6", "Scope changes are agreed in writing as additional days at the same published "
          "rates. Deprioritised workstreams come off at the same rates."],
         ["7", "Third party consultants are engaged in Medbury's name where you prefer, or by "
          "us and passed through at cost with invoices attached."],
         ["8", "This schedule is an offer open for 30 days. It is not legal or tax advice."]],
        ["", ""], [22, FULLW - 22], tiny=True))

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
        "Fee figures are day rates times days and do not depend on the financial model. "
        "Management fee figures are derived from scripts/lyfeplace_campus.py and move with it. "
        "Campus revenue, attributable EBITDA and the payback month are model outputs on the "
        "base case, which assumes %d consultants signed within %d months of opening. Not a "
        "binding offer until countersigned, and not legal or tax advice."
        % (C.CONSULTANTS_TARGET, C.CONSULTANTS_RAMP_M), SMALL))

    doc.build(el)
    print("wrote %s" % OUT.name)
    print("  setup %.2f gross, %.2f payable, %.1f mobilisation, %d days"
          % (FEE_GROSS, FEE_NET, FEE_MOB, TOTAL_DAYS))
    print("  management %.1f over 5 years, total to CFA %.1f" % (MGMT_5, CFA_5))
    print("  which is %.1f%% of the %.0f attributable to Medbury" % (100 * CFA_5 / ATTR_5, ATTR_5))


if __name__ == "__main__":
    build()
