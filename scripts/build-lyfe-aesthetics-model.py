"""
Build the "Lyfe Place Aesthetics" JV financial model + start-up capital +
feasibility PDF. Companion to the pre-read (scripts/build-lyfe-aesthetics-jv.py).

SURGERY-LED, ASSET-LIGHT THEATRE. Dr Kpaduwa is a plastic surgeon; cosmetic and
plastic surgery is the anchor, with injectables, skin and dermatology alongside.
BASE CASE rents theatre time and recovery from an existing partner hospital
(use-of-facilities) rather than building an in-house theatre, which is lightest
on capital and best for post-op care; in-house and standalone are the heavier
alternatives. Costs are forecast bottom-up with a 20% build contingency.
Benchmark-and-correct; Debo tunes. Tri-party aubergine + rose-gold + ivory. NGN.
No em dashes.

Run:
  python3 scripts/build-lyfe-aesthetics-model.py
"""

from __future__ import annotations

from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import (
    BaseDocTemplate, Frame, NextPageTemplate, PageBreak, PageTemplate,
    Paragraph, Spacer, Table, TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
OUT = DOCS / "medbury-lyfe-aesthetics-model.pdf"

# ---- tri-party palette: aubergine + rose-gold + ivory (matches the pre-read) ----
NAVY = HexColor("#3B2A45")
DEEP_NAVY = HexColor("#291C31")
GOLD = HexColor("#C79A73")
TEAL = HexColor("#8A5E7E")
BODY = HexColor("#2C2530")
MUTED = HexColor("#8A8288")
SURFACE = HexColor("#F6F1EA")
LIGHT = HexColor("#E3D3DE")
PANEL = HexColor("#F1E9EE")
CREAM = HexColor("#F7EEDF")

PAGE_W, PAGE_H = A4
MARGIN = 46
FULLW = PAGE_W - 2 * MARGIN
ss = getSampleStyleSheet()


def style(name, **kw):
    base = dict(fontName="Helvetica", fontSize=10.5, leading=15.5, textColor=BODY,
                alignment=TA_LEFT, spaceAfter=7)
    base.update(kw)
    return ParagraphStyle(name, **base)


EYEBROW = style("eyebrow", fontName="Helvetica-Bold", fontSize=9, leading=12, textColor=GOLD, spaceAfter=3)
H1 = style("h1", fontName="Helvetica-Bold", fontSize=15, leading=19, textColor=NAVY, spaceBefore=12, spaceAfter=8)
H2 = style("h2", fontName="Helvetica-Bold", fontSize=11.5, leading=15, textColor=TEAL, spaceBefore=8, spaceAfter=4)
P = style("p")
LEDE = style("lede", fontSize=11, leading=16.5, textColor=HexColor("#3C333B"))
SMALL = style("small", fontSize=8.5, leading=12, textColor=MUTED)
CAP = style("cap", fontName="Helvetica-Bold", fontSize=8.5, leading=11, textColor=TEAL, spaceBefore=2, spaceAfter=3)
CELL = style("cell", fontSize=9.5, leading=12.5)
CELL_R = style("cellr", fontSize=9.5, leading=12.5, alignment=2)
CELL_B = style("cellb", fontSize=9.5, leading=12.5, fontName="Helvetica-Bold", textColor=NAVY)
CELL_BR = style("cellbr", fontSize=9.5, leading=12.5, fontName="Helvetica-Bold", textColor=NAVY, alignment=2)
CELL_W = style("cellw", fontSize=9.5, leading=12.5, fontName="Helvetica-Bold", textColor=white)
CELL_WR = style("cellwr", fontSize=9.5, leading=12.5, fontName="Helvetica-Bold", textColor=white, alignment=2)


def cover_bg(c, doc):
    c.saveState()
    cw = PAGE_W / 2.0
    c.setFillColor(NAVY); c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.setStrokeColor(GOLD); c.setLineWidth(0.6); c.line(MARGIN, PAGE_H - 62, PAGE_W - MARGIN, PAGE_H - 62)
    c.setFillColor(LIGHT); c.setFont("Helvetica", 8)
    c.drawString(MARGIN, PAGE_H - 56, "A THREE-PARTY PARTNERSHIP")
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 56, "MODEL  ·  PRIVATE")
    c.setStrokeColor(GOLD); c.setLineWidth(0.9); c.line(cw - 34, PAGE_H - 322, cw + 34, PAGE_H - 322)
    c.setFillColor(white); c.setFont("Helvetica-Bold", 34); c.drawCentredString(cw, PAGE_H - 366, "The Lyfe Place")
    c.setFillColor(white); c.setFont("Helvetica-Bold", 34); c.drawCentredString(cw, PAGE_H - 402, "Aesthetics")
    c.setFillColor(GOLD); c.setFont("Helvetica-Oblique", 14); c.drawCentredString(cw, PAGE_H - 432, "Financial model, start-up capital and feasibility.")
    c.setStrokeColor(GOLD); c.setLineWidth(0.7); c.line(cw - 30, PAGE_H - 450, cw + 30, PAGE_H - 450)
    c.setFillColor(LIGHT); c.setFont("Helvetica", 9.5)
    c.drawCentredString(cw, PAGE_H - 470, "Medbury Healthcare  ·  KP Plastics  ·  Consult for Africa")
    c.setStrokeColor(GOLD); c.setLineWidth(0.6); c.line(cw - 26, 120, cw + 26, 120)
    c.setFillColor(LIGHT); c.setFont("Helvetica", 9.5)
    c.drawCentredString(cw, 102, "A companion to the partnership pre-read")
    c.setFillColor(MUTED); c.setFont("Helvetica", 8)
    c.drawCentredString(cw, 87, "Prepared by Consult for Africa  ·  July 2026  ·  Private and confidential")
    c.restoreState()


def content_bg(c, doc):
    c.saveState()
    c.setFillColor(NAVY); c.rect(0, PAGE_H - 34, PAGE_W, 34, fill=1, stroke=0)
    c.setFillColor(GOLD); c.rect(0, PAGE_H - 37, PAGE_W, 3, fill=1, stroke=0)
    c.setFillColor(white); c.setFont("Helvetica-Bold", 8.5); c.drawString(MARGIN, PAGE_H - 23, "THE LYFE PLACE AESTHETICS")
    c.setFillColor(LIGHT); c.setFont("Helvetica", 8.5)
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 23, "Financial model and feasibility")
    c.setFillColor(GOLD); c.rect(MARGIN, 30, 24, 2, fill=1, stroke=0)
    c.setFillColor(MUTED); c.setFont("Helvetica", 8)
    c.drawString(MARGIN, 18, "Private and confidential  /  Benchmark figures for tuning")
    c.drawRightString(PAGE_W - MARGIN, 18, "Page %d" % doc.page)
    c.restoreState()


def card(text, bg=SURFACE, fg=BODY):
    st = ParagraphStyle("c", parent=P, textColor=fg, leftIndent=8, rightIndent=8, spaceBefore=4, spaceAfter=4)
    t = Table([[Paragraph(text, st)]], colWidths=[FULLW])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg), ("LINEBEFORE", (0, 0), (0, -1), 3, GOLD),
        ("TOPPADDING", (0, 0), (-1, -1), 8), ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 12), ("RIGHTPADDING", (0, 0), (-1, -1), 12),
    ]))
    return t


def bullet(text):
    st = ParagraphStyle("b", parent=P, leftIndent=14, bulletIndent=2, spaceAfter=3)
    return Paragraph("<font color='#C79A73'>&bull;</font>&nbsp; " + text, st)


def grid(rows, col_labels, widths, total_rows=None, sub_rows=None, aligns=None):
    total_rows = total_rows or set()
    sub_rows = sub_rows or set()
    ncols = len(col_labels)
    if aligns is None:
        aligns = ["r"] * (ncols - 1)
    data = [[Paragraph(col_labels[0], CELL_W)] + [Paragraph(t, CELL_WR if aligns[j] == "r" else CELL_W)
                                                  for j, t in enumerate(col_labels[1:])]]
    for i, r in enumerate(rows):
        emph = i in total_rows or i in sub_rows
        cells = [Paragraph(r[0], CELL_B if emph else CELL)]
        for j, v in enumerate(r[1:]):
            if aligns[j] == "r":
                cells.append(Paragraph(v, CELL_BR if emph else CELL_R))
            else:
                cells.append(Paragraph(v, CELL_B if emph else CELL))
        data.append(cells)
    t = Table(data, colWidths=widths)
    stl = [
        ("BACKGROUND", (0, 0), (-1, 0), NAVY), ("LINEBELOW", (0, 0), (-1, 0), 2, GOLD),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 9), ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, SURFACE]),
    ]
    for i in sub_rows:
        stl.append(("BACKGROUND", (0, i + 1), (-1, i + 1), PANEL))
        stl.append(("LINEABOVE", (0, i + 1), (-1, i + 1), 0.6, TEAL))
    for i in total_rows:
        stl.append(("BACKGROUND", (0, i + 1), (-1, i + 1), CREAM))
        stl.append(("LINEABOVE", (0, i + 1), (-1, i + 1), 1.0, GOLD))
    t.setStyle(TableStyle(stl))
    return t


def sec(el, num, eyebrow, title):
    el.append(Paragraph(num + "  /  " + eyebrow, EYEBROW))
    el.append(Paragraph(title, H1))


def build():
    doc = BaseDocTemplate(str(OUT), pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN,
                          topMargin=52, bottomMargin=42,
                          title="The Lyfe Place Aesthetics - Financial Model and Feasibility",
                          author="Consult for Africa")
    doc.addPageTemplates([
        PageTemplate(id="cover", frames=[Frame(MARGIN, 170, PAGE_W - 2 * MARGIN, PAGE_H - 330, id="cover")], onPage=cover_bg),
        PageTemplate(id="content", frames=[Frame(MARGIN, 42, PAGE_W - 2 * MARGIN, PAGE_H - 52 - 42, id="content")], onPage=content_bg),
    ])
    el = []
    el.append(Spacer(1, 2))
    el.append(NextPageTemplate("content"))
    el.append(PageBreak())

    # 01 How to read
    sec(el, "01", "HOW TO READ THIS", "A benchmark model, costed bottom-up.")
    el.append(Paragraph(
        "This is the companion to the pre-read. It sizes the start-up capital, projects five years, "
        "and tests whether the partnership stands up. The costs are forecast bottom-up, line by line, "
        "with a 20% contingency over the build. The figures are premium-Lagos benchmarks, meant to be "
        "tuned against the scope and the site we agree.", LEDE))
    el.append(Paragraph(
        "This is a surgery-led business. Dr Kpaduwa is a plastic surgeon, so cosmetic and plastic "
        "surgery is the anchor line, with injectables, skin and dermatology compounding around it. "
        "All figures are in NGN and nominal.", P))
    el.append(Spacer(1, 3))
    el.append(card(
        "The base model rents the theatre and recovery from an existing partner hospital rather than "
        "building them, which is the lightest on capital and the strongest on post-op care. That takes "
        "start-up capital to about NGN 260M. The next page details the arrangement and compares it with "
        "a standalone theatre of our own.", bg=PANEL))
    el.append(PageBreak())

    # 02 The theatre model
    sec(el, "02", "THE THEATRE MODEL", "Rent the theatre, do not build it yet.")
    el.append(Paragraph(
        "A surgery-led model needs an operating theatre and a safe place to recover. The base case "
        "gets both from an existing hospital under a use-of-facilities agreement, rather than building "
        "and staffing a theatre from day one. The Lyfe Place holds only the consulting rooms and a "
        "procedure room, for consultations, injectables, skin, dermatology and minor procedures under "
        "local anaesthetic. Major surgery under general anaesthetic is never done there; it goes to the "
        "partner hospital's theatre.", P))
    el.append(Paragraph("What the partner hospital provides", H2))
    el.append(bullet("A licensed operating theatre and booked theatre time."))
    el.append(bullet("Anaesthesia and theatre nursing support for each list."))
    el.append(bullet("Post-operative recovery, and overnight or short-stay beds."))
    el.append(bullet("An ICU and emergency backstop, so complex recoveries are safe."))
    el.append(Paragraph("How it works", H2))
    el.append(bullet("Dr Kpaduwa and the surgical team hold operating privileges at the partner and bring their own instruments, consumables, implants and patients."))
    el.append(bullet("The partner bills the JV a theatre and facility fee per case, or a block rate for committed sessions, mirroring the members-plus-pay-per-use logic: commit to sessions, pay per use."))
    el.append(bullet("A benchmark fee is about NGN 700k to 1.2M per cosmetic case, covering theatre, anaesthesia, recovery and one to two nights."))
    el.append(bullet("A candidate partner is an Evercare-tier private hospital in Lekki or on the Island with spare theatre capacity and good recovery and ICU."))
    el.append(Spacer(1, 3))
    el.append(card(
        "Why this is the base: it is the lightest on capital, the fastest to open, and post-op is "
        "managed inside a full hospital rather than a converted clinic. It also turns the theatre from "
        "a fixed cost the partnership carries into a variable cost it only pays when it operates. Build "
        "or buy a theatre later, once the surgical volume proves out.", bg=SURFACE))
    el.append(PageBreak())

    # 02b the comparison
    sec(el, "02", "THE THEATRE MODEL", "The two ways to get a theatre.")
    el.append(Paragraph(
        "The same surgery-led model, costed two ways. The Lyfe Place holds the consulting and "
        "procedure rooms in both; only the theatre moves. Capital includes the 20% contingency; margin "
        "is the Year 3 steady state.", P))
    el.append(grid(
        [["Partner hospital theatre (base)", "~260", "Host theatre, recovery, overnight and ICU backstop", "~31%"],
         ["Standalone with own theatre", "~600 + property", "Purpose-built theatre and proper post-op; later, at volume", "~29%"]],
        ["Theatre option", "Capital (NGN M)", "Theatre and post-op", "Yr 3 margin"],
        [132, 92, FULLW - 132 - 92 - 52, 52], aligns=["r", "l", "r"]))
    el.append(Spacer(1, 6))
    el.append(Paragraph(
        "The reading is clear. At the volumes this business runs, renting a theatre is both lighter on "
        "capital and no worse on margin than building a standalone, and it gives better post-op care "
        "from day one. A standalone theatre only earns its keep at much higher surgical volume, and it "
        "is the right move later, not at launch. The Lyfe Place holds the consulting and procedure "
        "rooms in both cases; it never holds the theatre. The Cloister could serve as a second, Ikoyi "
        "front, but it too is not a theatre.", P))
    el.append(card(
        "The lean: launch on the partner-theatre model to prove the surgical volume on the lightest "
        "capital, then revisit a standalone theatre of our own once the lists are consistently full.", bg=PANEL))
    el.append(PageBreak())

    # 03 Assumptions
    sec(el, "03", "REVENUE ASSUMPTIONS", "What the top line is built on.")
    el.append(Paragraph(
        "The revenue spine is surgery-led: cosmetic and plastic surgery is the anchor, with "
        "injectables, body contouring, skin and laser, and medical dermatology alongside, plus "
        "consultations and skincare retail. Prices are premium-Lagos benchmarks; volumes are the "
        "Year 3 steady state, reached on a ramp from launch.", P))
    el.append(Paragraph("Pricing and volume, Year 3 steady state", CAP))
    el.append(grid(
        [["Cosmetic and plastic surgery", "5,000,000", "144", "720"],
         ["Injectables (toxin, fillers, threads)", "300,000", "1,200", "360"],
         ["Body contouring (non-surgical)", "450,000", "360", "162"],
         ["Skin and laser", "130,000", "1,200", "156"],
         ["Dermatology (medical)", "90,000", "900", "81"],
         ["Consultations", "60,000", "1,500", "90"],
         ["Skincare product retail", "by margin", "-", "90"],
         ["Total, Year 3", "", "", "1,659"]],
        ["Service line", "Avg fee (NGN)", "Cases / yr", "Revenue (NGN M)"],
        [176, 104, 88, FULLW - 368], total_rows={7}, aligns=["r", "r", "r"]))
    el.append(Spacer(1, 5))
    el.append(Paragraph(
        "Surgery at about NGN 5.0M is a blended plastic-surgery ticket across liposuction, body and "
        "breast surgery, abdominoplasty and combination cases, done at the partner theatre. Volumes "
        "assume launch into an existing base, Dr Kpaduwa's following, the Lyfe Place patients and the "
        "Medbury corporate book, and associate surgeons extending capacity when she is abroad.", SMALL))
    el.append(PageBreak())

    # 04 Start-up capital
    sec(el, "04", "START-UP CAPITAL", "Costed bottom-up, with 20% contingency.")
    el.append(Paragraph(
        "The capital call to open, on the partner-theatre base case. Because surgery runs at the host "
        "hospital, there is no theatre to build or equip; the spend is the consulting and procedure "
        "front and launch. The 20% contingency sits over the whole build, and the Lyfe Place site is "
        "Medbury's and not in this figure. A standalone theatre of our own, if we build one later, "
        "adds ground-up construction plus rent or acquisition.", P))
    el.append(grid(
        [["Front fit-out (consulting rooms, procedure room, aesthetic treatment rooms, recovery bay)", "45"],
         ["Aesthetic and dermatology equipment (laser, injectables and derm station, RF; body device phased)", "48"],
         ["Minor-procedure and clinical equipment (surgical sets, monitors, autoclave, emergency)", "25"],
         ["Power and infrastructure (over the existing site)", "15"],
         ["Pre-opening (recruitment, licensing, branding, launch)", "30"],
         ["Opening inventory (aesthetic product and consumables; implants bought per case)", "18"],
         ["Build subtotal", "181"],
         ["Contingency (20% of build)", "36"],
         ["Build including contingency", "217"],
         ["Working-capital buffer (about 2 months, cash-pay)", "45"],
         ["Total start-up capital, partner-theatre base", "262"]],
        ["Item", "NGN M"],
        [FULLW - 78, 78], total_rows={10}, sub_rows={6, 8}, aligns=["r"]))
    el.append(Spacer(1, 5))
    el.append(Paragraph(
        "The aesthetic platform is one strong multi-application laser plus the injectables and "
        "dermatology station and RF microneedling, with the body-contouring device phased into Year 2 "
        "from cashflow. The minor-procedure room handles injectables, skin and local-anaesthetic work "
        "at the front; anything needing general anaesthetic goes to the partner theatre. Every line is "
        "a benchmark to firm up on the chosen site.", SMALL))
    el.append(PageBreak())

    # 05 Operating cost
    sec(el, "05", "OPERATING COST", "The full annual cost load, honestly.")
    el.append(Paragraph(
        "Year 3 steady state, built bottom-up. The theatre now shows up here, as a per-case hire "
        "rather than a fixed cost, which is the whole point of the asset-light model.", P))
    el.append(grid(
        [["Cost of care", "514", "31% of revenue: surgical consumables, implants, surgeon fees, aesthetic product"],
         ["Theatre hire and host-hospital fees", "130", "Theatre, anaesthesia, recovery, overnight beds and ICU backstop at the partner, per case"],
         ["Salaries and clinical team", "100", "Clinical lead, aesthetic nurses and injectors, a procedure nurse, therapists, coordinators, manager"],
         ["Marketing", "149", "9% of revenue, digital-led premium creative"],
         ["Occupancy", "55", "Front facility charge to Medbury, power, water, security, cleaning"],
         ["Insurance, maintenance, service", "40", "Surgical indemnity, facility and equipment cover, laser and clinic service contracts"],
         ["Admin, software, clinical waste", "24", "HospitlOS, office, biohazard waste disposal"],
         ["C4A management fee", "133", "8% of revenue; C4A IP licensed in, never contributed as equity"],
         ["Total operating cost", "1,145", ""],
         ["EBITDA", "514", "About 31% of Year 3 revenue"]],
        ["Line", "NGN M", "What it covers"],
        [150, 52, FULLW - 150 - 52], total_rows={8, 9}, aligns=["r", "l"]))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "Surgeon economics are a term to settle: Dr Kpaduwa's return comes largely through her 34% "
        "equity, with a capped clinical fee inside cost of care; associate surgeons are paid per list. "
        "Because the host provides theatre nursing and recovery, the JV carries no in-house theatre "
        "team, which is why salaries are lighter than an owned-theatre model.", SMALL))
    el.append(PageBreak())

    # 06 Five-year P&L
    sec(el, "06", "THE FIVE-YEAR MODEL", "Revenue build to steady-state margin.")
    el.append(Paragraph(
        "Surgery is the anchor from launch, run in blocks around Dr Kpaduwa's diary at the partner "
        "theatre and extended by associate surgeons. Margin ramps from the mid-twenties in the build "
        "year to the low thirties at steady state, carrying the per-case theatre hire in full.", P))
    el.append(grid(
        [["Revenue", "872", "1,372", "1,659", "1,913", "2,101"],
         ["Cost of care (about 31%)", "(270)", "(425)", "(514)", "(593)", "(651)"],
         ["Theatre hire and host fees", "(68)", "(108)", "(130)", "(150)", "(165)"],
         ["Gross profit", "534", "839", "1,015", "1,170", "1,285"],
         ["Salaries and clinical team", "(78)", "(92)", "(100)", "(108)", "(116)"],
         ["Marketing (about 9%)", "(78)", "(123)", "(149)", "(172)", "(189)"],
         ["Occupancy (front, power)", "(44)", "(52)", "(55)", "(60)", "(63)"],
         ["Insurance, maintenance, service", "(30)", "(36)", "(40)", "(44)", "(47)"],
         ["Admin, software, waste", "(18)", "(22)", "(24)", "(26)", "(28)"],
         ["C4A management fee (8%)", "(70)", "(110)", "(133)", "(153)", "(168)"],
         ["EBITDA", "216", "404", "514", "607", "674"],
         ["EBITDA margin", "25%", "29%", "31%", "32%", "32%"]],
        ["NGN M", "Year 1", "Year 2", "Year 3", "Year 4", "Year 5"],
        [150, 70, 70, 70, 70, FULLW - 430], total_rows={3, 10}))
    el.append(Spacer(1, 5))
    el.append(Paragraph(
        "Cumulative EBITDA over the five years is about NGN 2,415M. Year 1 is back-half weighted; the "
        "annual figure already carries the launch ramp. Building a standalone theatre later would lift "
        "the margin at high volume, at the cost of the capital and a fixed team.", SMALL))
    el.append(PageBreak())

    # 07 Feasibility
    sec(el, "07", "FEASIBILITY", "It pays back inside two years.")
    el.append(grid(
        [["Break-even revenue", "about NGN 41M / month", "Below the Year 1 run-rate of about NGN 73M; comfortable headroom."],
         ["Payback on start-up capital", "inside Year 2", "Year 1 EBITDA of about NGN 216M covers most of the roughly NGN 260M capital; cumulative clears it near month 15."],
         ["Steady-state EBITDA margin", "about 31 to 32%", "Full cost load including per-case theatre hire, carried honestly."],
         ["Receivables drag", "minimal", "Cash and card at point of care; no insurance float to finance."]],
        ["Test", "Result", "Why"],
        [138, 118, FULLW - 256], aligns=["l", "l"]))
    el.append(Spacer(1, 5))
    el.append(card(
        "The feasibility rests on things already true or cheap to secure: a credentialed plastic "
        "surgeon as the clinical anchor, an existing patient base to fill the diary, a site the group "
        "already holds, and a theatre rented rather than built. The swing factors are surgical "
        "throughput, which depends on Dr Kpaduwa's availability and theatre access, and securing a "
        "reliable partner hospital on a fair rate.", bg=SURFACE))
    el.append(PageBreak())

    # 08 Valuation and scenarios
    sec(el, "08", "VALUATION AND SCENARIOS", "What the stake is worth.")
    el.append(Paragraph(
        "On a discounted-cash-flow basis, 28% discount rate and 12% terminal growth, NGN nominal, the "
        "Base enterprise value is about NGN 1.72Bn on the partner-theatre case. The scenarios flex "
        "surgical volume, the ramp and the steady-state margin.", P))
    el.append(Paragraph("Scenario analysis", CAP))
    el.append(grid(
        [["Bear", "Slower ramp, fewer surgeries, thin associate cover", "~1.1"],
         ["Base", "Surgery-led from launch, partner theatre, aesthetics and dermatology alongside", "~1.72"],
         ["Bull", "Surgery scales with associate surgeons and medical-tourism inflow", "~2.7"]],
        ["Scenario", "What changes", "EV (NGN Bn)"],
        [68, FULLW - 68 - 92, 92], aligns=["l", "r"]))
    el.append(Spacer(1, 6))
    el.append(Paragraph("Value by stake, Base case", CAP))
    el.append(grid(
        [["Medbury Healthcare Group", "51%", "~877"],
         ["KP Plastics (Dr Chinwe Kpaduwa)", "34%", "~585"],
         ["Consult for Africa", "15%", "~258"],
         ["Enterprise value, Base", "100%", "~1,720"]],
        ["Party", "Stake", "Value (NGN M)"],
        [FULLW - 78 - 108, 78, 108], total_rows={3}, aligns=["r", "r"]))
    el.append(Spacer(1, 6))
    el.append(Paragraph("Sensitivity of EV (NGN Bn) to Year 5 revenue and steady-state margin", CAP))
    el.append(grid(
        [["28%", "1.30", "1.50", "1.70"],
         ["32%", "1.45", "1.70", "1.95"],
         ["36%", "1.65", "1.90", "2.20"]],
        ["EBITDA margin", "Rev 1,800", "Rev 2,100", "Rev 2,400"],
        [140, (FULLW - 140) / 3, (FULLW - 140) / 3, (FULLW - 140) / 3]))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "Against a start-up capital of about NGN 260M on the base case, a Base enterprise value near "
        "NGN 1.72Bn is a strong return on the capital at risk. C4A's 15%, earned largely through "
        "structuring and the licensed platform rather than cash, is worth about NGN 258M at Base.", SMALL))
    el.append(PageBreak())

    # 09 Risks and next steps
    sec(el, "09", "WHAT MOVES THE NUMBERS", "Risks, and the decisions that set them.")
    for h, t in [
        ("The theatre partner is the first thing to lock.",
         "The base model rents theatre and recovery from a host hospital, so securing a reliable "
         "partner with spare capacity and good recovery and ICU, on a fair per-case rate, is the "
         "decisive early move. Mitigated by choosing an Evercare-tier partner and negotiating "
         "block-sessional access; owning a theatre later removes the dependence."),
        ("Surgical throughput is the operating swing factor.",
         "Surgery is the largest revenue line and the most sensitive to Dr Kpaduwa's availability and "
         "theatre access. Mitigated by associate surgeons, a resident clinical lead, and booking "
         "surgery in blocks when she is in-country."),
        ("Costs are forecast in full, not flattered.",
         "The per-case theatre hire is a real line, sized in full, and the build carries a 20% "
         "contingency. The steady margin near 31% reflects that honesty; it is not a number to be "
         "talked upward without cutting real cost."),
        ("Consumables and implants carry FX exposure.",
         "Surgical consumables, implants and devices are imported. Priced in NGN with pass-through, and "
         "stock bought ahead of naira moves; the cost-of-care ratio is the line to watch."),
    ]:
        el.append(Paragraph("<b>" + h + "</b>&nbsp; " + t, P))
    el.append(Spacer(1, 4))
    el.append(Paragraph("Next steps", CAP))
    for line in [
        "<b>1.</b>&nbsp; Secure the theatre partner: agree the host hospital, the per-case rate and the recovery and overnight terms. This anchors the model.",
        "<b>2.</b>&nbsp; C4A firms every capital line on the front fit-out, to a committed budget with the contingency held.",
        "<b>3.</b>&nbsp; Term sheet, then shareholder agreement; incorporate, fit out, recruit, soft-launch.",
    ]:
        el.append(Paragraph(line, P))
    el.append(Spacer(1, 8))
    el.append(card(
        "<b>Debo Odulana</b> &nbsp; Consult for Africa &nbsp; / &nbsp; Lagos and Abuja<br/>"
        "+234 913 813 8553 &nbsp; / &nbsp; hello@consultforafrica.com &nbsp; / &nbsp; consultforafrica.com",
        bg=NAVY, fg=white))
    el.append(Spacer(1, 6))
    el.append(Paragraph(
        "Figures are benchmark estimates for discussion, grounded in Lagos premium cosmetic-surgery "
        "and aesthetics economics, forecast bottom-up with a 20% build contingency, and to be firmed "
        "against the chosen site and theatre partner. Not a forecast, an audit, or a binding offer. "
        "Shared in confidence with Dr Itunu Akinware, Dr Chinwe Kpaduwa and Medbury leadership.", SMALL))

    doc.build(el)
    print(f"wrote {OUT}")


if __name__ == "__main__":
    build()
