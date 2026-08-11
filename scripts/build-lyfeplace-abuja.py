"""
Build the "Lyfe Place Abuja" commercial model report PDF for Consult for Africa,
prepared for Dr Itunu Akinware, Group CEO, Medbury Healthcare Group.

The proposition: Medbury takes the Abuja property as head lessee and campus
operator, and lets every clinical line as a tenant. Nobody is on Medbury's
clinical payroll. Three revenue layers:
  1. FIXED LEASES  -- Alameda (blended) and Medlyfe only. NGN 168.5M/yr. Pharmacy
     and diagnostics are sold as FACILITY, not billed as tenants; their NGN 54.1M
     is recovered through the rates the users pay.
  2. SESSIONAL     -- 10 consulting rooms + 1 procedure room sold by the block
     across a 07:00-21:00 Mon-Sat window. ~NGN 331M/yr at stabilisation.
  3. CAPTURE       -- diagnostics and pharmacy margin on ~22,700 patient contacts,
     100% Medbury owned. This is where the return actually is.

The Cloister is a Lyfe Place membership product, not a room. Its physicians buy
blocks from the sessional pool like every other user.

Key corrections carried in this note, all sense checked against the as-built
drawings and the arithmetic:
  - Building is ~711 sqm gross, not the 1,235 sqm the tenant-mix deck assumes
  - Total project capital is ~NGN 527M on a light-touch fit-out, not ~NGN 185M
  - Alameda needs 4 rooms to deliver 56 consults/day; 2 rooms caps at 28
  - Comfort cooling is split units, not HVAC; no central plant in scope
  - Break-even is a LEASING risk, not an operating risk (under 6% sessional fill)

Source thread: Alameda JV agreement, Medbury Wellness Hub tenant-mix deck,
as-built floor plans (ground, first, guest chalet, BQ).
Output: docs/lyfeplace-abuja-commercial-model-cfa.pdf

House style matches the CFA repo. Naira shown as NGN. No em dashes anywhere.
FX reference: USD/NGN ~1,550.

Run:
  python3 scripts/build-lyfeplace-abuja.py
"""

from __future__ import annotations

from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs" / "lyfeplace-abuja"
OUT = DOCS / "lyfeplace-abuja-commercial-model-cfa.pdf"

# Lyfe Place / Cloister palette: deep emerald + champagne gold + warm ivory.
NAVY = HexColor("#0F3D2E")
DEEP_NAVY = HexColor("#08261C")
GOLD = HexColor("#C6A15B")
TEAL = HexColor("#2F6B52")
BODY = HexColor("#23302B")
MUTED = HexColor("#7C7C74")
SURFACE = HexColor("#F5F2EA")
LIGHT = HexColor("#CBDDD1")
PANEL = HexColor("#E9F0EA")
CREAM = HexColor("#F6EFDD")
ALERT = HexColor("#FBF0E4")

PAGE_W, PAGE_H = A4
MARGIN = 46
FULLW = PAGE_W - 2 * MARGIN

ss = getSampleStyleSheet()


def style(name, **kw):
    base = dict(fontName="Helvetica", fontSize=10.5, leading=15.5, textColor=BODY,
                alignment=TA_LEFT, spaceAfter=7)
    base.update(kw)
    return ParagraphStyle(name, **base)


EYEBROW = style("eyebrow", fontName="Helvetica-Bold", fontSize=9, leading=12,
                textColor=GOLD, spaceAfter=3)
H1 = style("h1", fontName="Helvetica-Bold", fontSize=15, leading=19, textColor=NAVY,
           spaceBefore=12, spaceAfter=8)
H2 = style("h2", fontName="Helvetica-Bold", fontSize=11.5, leading=15, textColor=TEAL,
           spaceBefore=10, spaceAfter=4)
P = style("p")
LEDE = style("lede", fontSize=11, leading=16.5, textColor=HexColor("#374151"))
SMALL = style("small", fontSize=8.5, leading=12, textColor=MUTED)
CELL = style("cell", fontSize=9.5, leading=12.5)
CELL_R = style("cellr", fontSize=9.5, leading=12.5, alignment=2)
CELL_B = style("cellb", fontSize=9.5, leading=12.5, fontName="Helvetica-Bold", textColor=NAVY)
CELL_BR = style("cellbr", fontSize=9.5, leading=12.5, fontName="Helvetica-Bold",
                textColor=NAVY, alignment=2)
CELL_W = style("cellw", fontSize=9.5, leading=12.5, fontName="Helvetica-Bold", textColor=white)
CELL_WR = style("cellwr", fontSize=9.5, leading=12.5, fontName="Helvetica-Bold",
                textColor=white, alignment=2)


def draw_colonnade(c, cx, cy, n=7, aw=13, gap=8, legh=12, color=GOLD, lw=1.0):
    """A row of arches, the Cloister motif."""
    total = n * aw + (n - 1) * gap
    x0 = cx - total / 2.0
    c.setStrokeColor(color)
    c.setLineWidth(lw)
    for i in range(n):
        x = x0 + i * (aw + gap)
        c.line(x, cy, x, cy + legh)
        c.line(x + aw, cy, x + aw, cy + legh)
        p = c.beginPath()
        p.arc(x, cy + legh - aw / 2.0, x + aw, cy + legh + aw / 2.0, 0, 180)
        c.drawPath(p, stroke=1, fill=0)
    c.setLineWidth(lw * 0.8)
    c.line(x0 - 4, cy, x0 + total + 4, cy)


def cover_bg(c, doc):
    c.saveState()
    cw = PAGE_W / 2.0
    c.setFillColor(NAVY)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.setStrokeColor(GOLD)
    c.setLineWidth(0.6)
    c.line(MARGIN, PAGE_H - 62, PAGE_W - MARGIN, PAGE_H - 62)
    c.setFillColor(LIGHT)
    c.setFont("Helvetica", 8)
    c.drawString(MARGIN, PAGE_H - 56, "LYFE PLACE ABUJA")
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 56, "COMMERCIAL MODEL")
    draw_colonnade(c, cw, PAGE_H - 300, n=7, color=GOLD)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 40)
    c.drawCentredString(cw, PAGE_H - 357, "Lyfe Place Abuja")
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Oblique", 15)
    c.drawCentredString(cw, PAGE_H - 387, "The address, not the practice.")
    c.setStrokeColor(GOLD)
    c.setLineWidth(0.8)
    c.line(cw - 36, PAGE_H - 404, cw + 36, PAGE_H - 404)
    c.setFillColor(LIGHT)
    c.setFont("Helvetica", 10.5)
    c.drawCentredString(cw, PAGE_H - 424,
                        "Commercial structure, tenancy model and investment case")
    c.setFont("Helvetica", 9.5)
    c.drawCentredString(cw, PAGE_H - 442,
                        "The Cloister by Lyfe Place  /  Alameda specialist clinic  /  campus capture")
    c.setStrokeColor(GOLD)
    c.setLineWidth(0.6)
    c.line(cw - 26, 120, cw + 26, 120)
    c.setFillColor(LIGHT)
    c.setFont("Helvetica", 9.5)
    c.drawCentredString(cw, 102, "Prepared for Dr Itunu Akinware, Group CEO, Medbury Healthcare Group")
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8)
    c.drawCentredString(cw, 87, "Consult for Africa  ·  August 2026  ·  Private and confidential")
    c.restoreState()


def content_bg(c, doc):
    c.saveState()
    c.setFillColor(NAVY)
    c.rect(0, PAGE_H - 34, PAGE_W, 34, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(0, PAGE_H - 37, PAGE_W, 3, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(MARGIN, PAGE_H - 23, "LYFE PLACE ABUJA")
    c.setFillColor(LIGHT)
    c.setFont("Helvetica", 8.5)
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 23, "Commercial model  /  Consult for Africa")
    c.setFillColor(GOLD)
    c.rect(MARGIN, 30, 24, 2, fill=1, stroke=0)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8)
    c.drawString(MARGIN, 18, "Private and confidential  /  Prepared for Dr Itunu Akinware, Group CEO")
    c.drawRightString(PAGE_W - MARGIN, 18, "Page %d" % doc.page)
    c.restoreState()


def card(text, bg=SURFACE, fg=BODY, bold=False, rule=GOLD):
    st = ParagraphStyle("c", parent=P, textColor=fg, leftIndent=8, rightIndent=8,
                        spaceBefore=4, spaceAfter=4,
                        fontName="Helvetica-Bold" if bold else "Helvetica")
    t = Table([[Paragraph(text, st)]], colWidths=[FULLW])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("LINEBEFORE", (0, 0), (0, -1), 3, rule),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
    ]))
    return t


def money_table(rows, col_labels, widths, total_row=False, aligns=None, subtotal_rows=None):
    ncols = len(col_labels)
    if aligns is None:
        aligns = ["r"] * (ncols - 1)
    subtotal_rows = subtotal_rows or set()
    data = []
    header = [Paragraph(col_labels[0], CELL_W)]
    for j, t in enumerate(col_labels[1:]):
        header.append(Paragraph(t, CELL_WR if aligns[j] == "r" else CELL_W))
    data.append(header)
    for i, r in enumerate(rows):
        is_last = total_row and i == len(rows) - 1
        emph = is_last or (i in subtotal_rows)
        lab_style = CELL_B if emph else CELL
        cells = [Paragraph(r[0], lab_style)]
        for j, cval in enumerate(r[1:]):
            if aligns[j] == "r":
                cells.append(Paragraph(cval, CELL_BR if emph else CELL_R))
            else:
                cells.append(Paragraph(cval, CELL_B if emph else CELL))
        data.append(cells)
    t = Table(data, colWidths=widths)
    styles = [
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("LINEBELOW", (0, 0), (-1, 0), 2, GOLD),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("ROWBACKGROUNDS", (0, 1), (-1, -2 if total_row else -1), [white, SURFACE]),
    ]
    if total_row:
        styles.append(("BACKGROUND", (0, -1), (-1, -1), CREAM))
        styles.append(("LINEABOVE", (0, -1), (-1, -1), 1.2, GOLD))
    for i in subtotal_rows:
        styles.append(("BACKGROUND", (0, i + 1), (-1, i + 1), PANEL))
    t.setStyle(TableStyle(styles))
    return t


def sec(el, num, eyebrow, title):
    el.append(Paragraph(num + "  /  " + eyebrow, EYEBROW))
    el.append(Paragraph(title, H1))


def bullets(el, items, style_=P):
    for it in items:
        el.append(Paragraph("&bull;&nbsp;&nbsp;" + it, style_))


def build():
    doc = BaseDocTemplate(
        str(OUT), pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=52, bottomMargin=42,
        title="Lyfe Place Abuja - Commercial Model - Consult for Africa for Medbury",
        author="Consult for Africa",
    )
    content_frame = Frame(MARGIN, 42, FULLW, PAGE_H - 52 - 42, id="content")
    cover_frame = Frame(MARGIN, 170, FULLW, PAGE_H - 330, id="cover")
    doc.addPageTemplates([
        PageTemplate(id="cover", frames=[cover_frame], onPage=cover_bg),
        PageTemplate(id="content", frames=[content_frame], onPage=content_bg),
    ])

    el = []

    # ---------------- COVER ----------------
    el.append(Spacer(1, 2))
    el.append(NextPageTemplate("content"))
    el.append(PageBreak())

    el.append(card(
        "<b>SUPERSEDED IN PART.</b> This was the first full note and it predates several decisions. "
        "Still current: the area reconciliation, the joint venture amendments, the conditions "
        "precedent and the regulatory pathway. <b>Superseded:</b> the financial model, the space "
        "plan, the operating hours and the tenant mix. Mezo Health now manages the campus on a fee, "
        "the first floor yields eight consulting rooms rather than ten, the operating window is 08:00 "
        "to 22:00, a day case theatre is proposed as a ground-level unit, and Medlyfe is out of phase "
        "one. For current figures use the engagement note, and for the space plan use the allocation "
        "drawing.", bg=ALERT, rule=HexColor("#B8763A")))
    el.append(Spacer(1, 6))

    # ---------------- 01 THE RECOMMENDATION ----------------
    sec(el, "01", "THE RECOMMENDATION", "Medbury is the landlord, not the practice.")
    el.append(Paragraph(
        "Medbury takes the Abuja property as head lessee and campus operator, and lets every "
        "clinical line to a tenant. No consultants on Medbury's payroll, no imaging equipment on "
        "Medbury's balance sheet, and no clinical staffing risk. Medbury earns from three layers, "
        "in ascending order of value.", LEDE))
    el.append(money_table(
        [["1. Fixed leases",
          "Alameda and Medlyfe. Pharmacy and diagnostics are facility, not tenants",
          "168.5"],
         ["2. Sessional",
          "10 consulting rooms and 1 procedure room, sold by the block, 07:00 to 21:00 Mon to Sat",
          "330.9"],
         ["3. Capture",
          "Diagnostics and pharmacy margin on roughly 22,700 patient contacts a year",
          "210.0"]],
        ["Revenue layer", "What it is", "NGN M / yr"],
        [96, 300, 107], aligns=["l", "r"]))
    el.append(Spacer(1, 6))
    el.append(card(
        "<b>The single most important number in this note.</b> Two fixed leases produce NGN 168.5M "
        "a year against a fixed cost base of NGN 187M. <b>The campus breaks even at under 6% "
        "sessional fill</b>, about five blocks a week across ten rooms. Everything the sessional "
        "programme and the capture layer produce beyond that is margin.", bg=PANEL))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "That reframes the risk correctly. This is not an operating risk, it is a <b>leasing and "
        "lease-term risk</b>. The question is not whether the campus can trade profitably. It is "
        "whether the leases get signed and whether the head lease can be extended from two years "
        "to five plus five before fit-out capital is committed.", P))
    el.append(Spacer(1, 6))
    el.append(Paragraph("Three corrections to what is currently in view", H2))
    el.append(money_table(
        [["Building area", "1,235 sqm", "~711 sqm gross, ~520 sqm net lettable"],
         ["Total project capital", "~NGN 185M", "~NGN 527M on a light-touch fit-out"],
         ["Head lease term", "2 years", "Must be 5 plus 5 before fit-out capital is released"]],
        ["Item", "Currently assumed", "Corrected"],
        [124, 118, 261], aligns=["r", "l"]))
    el.append(PageBreak())

    # ---------------- 02 WHAT WE ARE BUILDING ----------------
    sec(el, "02", "THE MODEL", "The address, not the practice.")
    el.append(Paragraph(
        "Lyfe Place Abuja is a physicians' address. It is the Harley Street model already worked "
        "up for Ikoyi, on the same asset class and the same lease quantum, with three advantages "
        "Ikoyi does not have: a contracted anchor user from day one, two Medbury-owned support "
        "businesses on site, and imaging capital carried by a partner rather than by Medbury.", LEDE))
    el.append(Paragraph("The tenant classes", H2))
    el.append(money_table(
        [["Users", "Alameda, Doctors Foundation for Care, private consultants, Cloister physicians",
          "Access to patients and an address", "Session tariff or blended licence"],
         ["Facility", "Medbury Diagnostics (lab and imaging), Medbury Pharmaceuticals",
          "Sold as part of the campus offer, not billed as tenants", "Recovered in tenant rates"],
         ["Wellness", "Medlyfe longevity and infusion",
          "A discrete address in the guest chalet", "Base rent"]],
        ["Class", "Who", "What they buy", "Instrument"],
        [58, 175, 145, 125], aligns=["l", "l", "l"]))
    el.append(Spacer(1, 6))
    el.append(Paragraph(
        "Users are priced to <b>fill</b>, not to maximise rent per sqm. An empty session is not "
        "just lost rent, it is a lost diagnostic basket and a lost prescription. The tenant mix "
        "exists to drive patient contacts through the door, because that is where the return is.", P))
    el.append(Paragraph("Two structural decisions", H2))
    el.append(Paragraph(
        "<b>Radiology sits under Medbury Diagnostics.</b> Medbury Diagnostics takes the whole "
        "diagnostics demise, laboratory and imaging together, and contracts the radiology partner "
        "itself. The landlord has one diagnostics counterparty and never has to police who owns "
        "ultrasound. The partner's equipment, shielding and room fit-out are Medbury Diagnostics' "
        "commercial arrangement, not a lease term.", P))
    el.append(Paragraph(
        "<b>Pharmacy and diagnostics are facility, not tenants.</b> Their space is sold as part of "
        "the campus offer and recovered through the rates the users pay. That is a better pitch: "
        "on-site laboratory, imaging and pharmacy is a real reason a consultant picks Lyfe Place "
        "over a room elsewhere, and it turns the first-call obligation from a restriction into a "
        "benefit. Same-visit bloods and scripts, included. Charge the NGN 54.1M internally in the "
        "management accounts anyway, so the numbers stay arm's length for FIRS and for any future "
        "investor in PropCo, and so diagnostics has to justify its 115 sqm.", P))
    el.append(Paragraph(
        "<b>The Cloister is a membership, not a room.</b> No dedicated family-practice suite. Its "
        "physicians buy blocks from the sessional pool like every other user. That avoids a "
        "fit-out commitment against an unproven Abuja panel, lets the membership launch before "
        "the first floor is finished, and keeps the rule that everybody is a tenant.", P))
    el.append(Spacer(1, 4))
    el.append(card(
        "The Cloister membership is also the funding mechanism. Memberships are collected annually "
        "in advance and the head rent is paid in advance. Sixty founding Abuja memberships at a "
        "blended NGN 2.2M is NGN 132M, which covers the NGN 115M of rent and fees outright. "
        "Presell the membership, then pay the landlord.", bg=PANEL))
    el.append(PageBreak())

    # ---------------- 03 THE BUILDING ----------------
    sec(el, "03", "THE BUILDING", "It is roughly half the size the tenant-mix deck assumes.")
    el.append(Paragraph(
        "Measured from the as-built drawings for the main house, guest chalet and boys' quarters. "
        "This needs verifying against the CAD before it goes any further, but if it holds it "
        "re-bases every number in the current plan.", LEDE))
    el.append(money_table(
        [["Main house, ground floor", "440", "286"],
         ["Main house, first floor", "440", "277"],
         ["Guest chalet", "160", "96"],
         ["Boys' quarters", "55", "52"],
         ["Total gross", "1,235", "711"]],
        ["Structure", "Deck assumes (sqm)", "As built (sqm gross)"],
        [223, 140, 140], total_row=True))
    el.append(Spacer(1, 6))
    el.append(Paragraph(
        "Net internal at 87% is about 619 sqm. Net lettable, after reception, waiting, corridors, "
        "stairs, plant and shared toilets in a converted residential house, is about "
        "<b>520 sqm</b>. The deck overstates the building by 74%.", P))
    el.append(Spacer(1, 4))
    el.append(card(
        "The tell: the deck's service charge of NGN 60,000 to NGN 85,000 per sqm. Divide the real "
        "annual operating cost by the phantom 1,235 sqm and you get NGN 61,000. Divide it by the "
        "real 520 and you get a materially higher number. The service charge was back-solved from "
        "an area that does not exist.", bg=ALERT, rule=HexColor("#B8763A")))
    el.append(Spacer(1, 6))
    el.append(Paragraph("Three consequences", H2))
    bullets(el, [
        "The seven-unit tenant mix does not fit. Something has to come out.",
        "Alameda's two consulting rooms and Dr John's 440 sqm specialist centre describe two "
        "different buildings, and neither of them is this one.",
        "Every per sqm figure in the deck needs re-basing on 520 sqm.",
    ])
    el.append(PageBreak())

    # ---------------- 04 CAPITAL ----------------
    sec(el, "04", "CAPITAL", "What it actually costs.")
    el.append(money_table(
        [["Head rent, 2 years paid in advance", "100.0"],
         ["Agency, legal and caution deposit at 15%", "15.0"],
         ["PropCo fit-out", "232.0"],
         ["Power system, 25KVA hybrid solar and lithium", "33.0"],
         ["Medbury Diagnostics unit fit-out", "28.0"],
         ["Medbury Pharmaceuticals unit fit-out", "24.0"],
         ["Working capital, six months", "95.0"],
         ["Total Medbury cash", "527.0"]],
        ["Item", "NGN M"],
        [383, 120], total_row=True))
    el.append(Spacer(1, 6))
    el.append(Paragraph(
        "Against roughly NGN 185M currently in view. On a sound building this is not a conversion, "
        "it is decoration, partitioning, cooling, ICT, fire systems and FF&amp;E. The building "
        "fit-out element is NGN 148M over 711 sqm, about NGN 208,000 per sqm, which is mid-range "
        "for a light-touch clinical conversion in Nigeria. Six packages account for half of it and "
        "would cost the same in a brand new house: cooling at NGN 24M for about 28 units, ICT at "
        "NGN 15M, fire at NGN 9M, partitioning at NGN 8M, mechanical fresh air at NGN 6M and "
        "medical waste at NGN 3M. Full package-by-package breakdown, with a full-conversion and a "
        "lean case alongside, is in the companion fit-out note.", P))
    el.append(Paragraph("Phasing, if capital needs staging", H2))
    el.append(money_table(
        [["Phase 1, to open",
          "Ground floor complete, reception, 6 sessional rooms, all services, fire, cooling, water, power",
          "~400"],
         ["Phase 2, months 7 to 12",
          "Remaining 4 sessional rooms, procedure room, doctors' lounge. Funded from trading",
          "~85"],
         ["Phase 3, year 2",
          "Guest chalet, boys' quarters back of house, external works and signage",
          "~42"]],
        ["Phase", "Scope", "NGN M"],
        [110, 285, 108], aligns=["l", "r"]))
    el.append(Spacer(1, 6))
    el.append(Paragraph(
        "At NGN 232M the case for phasing largely disappears, and doing it in one pass avoids the "
        "cost and disruption of returning contractors to a trading clinical building. Phasing "
        "remains the fallback if capital has to be staged.", P))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>Do not commit fit-out capital against a two-year head lease.</b> NGN 284M of fit-out "
        "over two years is NGN 142M a year of amortisation, which takes the cost base to about "
        "NGN 289M against fixed leases of NGN 168.5M and pushes break-even to 36% sessional fill. "
        "Achievable, but it removes the entire margin of safety. Over a five plus five it is "
        "NGN 28M a year, which the campus carries comfortably.",
        bg=ALERT, rule=HexColor("#B8763A")))
    el.append(PageBreak())

    # ---------------- 04b POWER ----------------
    sec(el, "05", "POWER AND HOURS", "Longer hours are the whole business case.")
    el.append(Paragraph(
        "Nothing in scope needs central plant. Consultations, screening, imaging, point-of-care "
        "laboratory, infusions and minor procedures under local anaesthetic are comfort-cooling "
        "loads, served by zoned inverter split units. Central air handling, pressure cascade and "
        "filtration would only be justified by an operating theatre, day surgery, an isolation "
        "room or a compounding cleanroom, none of which are in scope. If Medlyfe compounds "
        "infusions, the answer is a laminar flow cabinet at NGN 4M to NGN 8M, not a cleanroom.", P))
    el.append(Paragraph("The operating window", H2))
    el.append(Paragraph(
        "At the agreed 15,000 to 18,000 kWh a month, the campus supports <b>07:00 to 21:00, "
        "Monday to Saturday</b>. Against a 9 to 5 weekday operation that is 40 sellable hours per "
        "room per week going to 84, a 110% increase in capacity from the same building.", P))
    el.append(money_table(
        [["Power", "18", "28", "+10"],
         ["Admin and facilities salaries, shift cover", "15", "33", "+18"],
         ["Security, cleaning, waste, insurance, internet", "12", "15", "+3"],
         ["Maintenance and biomedical", "6", "8", "+2"],
         ["Campus marketing and concierge", "6", "8", "+2"],
         ["Incremental cost of extended hours", "", "", "+35"]],
        ["Cost line", "9 to 5 (NGN M)", "Extended (NGN M)", "Delta"],
        [225, 96, 96, 86], total_row=True))
    el.append(Spacer(1, 6))
    el.append(Paragraph(
        "<b>NGN 35M of cost buys roughly NGN 250M of revenue.</b> But the stronger argument is "
        "supply, not demand. Most Abuja specialists hold full-time posts at the federal, teaching "
        "and military hospitals. Evenings and Saturdays are the only windows in which they can do "
        "private practice at all. A 9 to 5 address can only recruit consultants already in "
        "full-time private practice, which in Abuja is a small pool. A 07:00 to 21:00 six-day "
        "address can recruit the city.", P))
    el.append(Paragraph(
        "It also fixes the throughput problem. The same patient volume spread across fourteen "
        "hours instead of eight is a comfortable arrival rate rather than a crowded waiting room, "
        "which is the difference between a premium address and an ordinary one.", P))
    el.append(Spacer(1, 4))
    el.append(card(
        "Four conditions, or the extra hours do not pay. Medbury Diagnostics and Pharmaceuticals "
        "must staff the full window, or every evening consult loses its basket. Size the battery, "
        "not the array, because evenings cannot run on solar. Security and lit parking to 21:00. "
        "And halve the service intervals on the split units, since fourteen hours over six days is "
        "double the duty cycle they are specified for.", bg=PANEL))
    el.append(PageBreak())

    # ---------------- 06 TENANCY STACK ----------------
    sec(el, "06", "THE TENANCY STACK", "Who sits where, and what they pay.")
    el.append(Paragraph("Space plan on the real 520 sqm net lettable", H2))
    el.append(money_table(
        [["Ground", "Medbury Pharmaceuticals", "40"],
         ["Ground", "Medbury Diagnostics, laboratory and imaging", "115"],
         ["Ground", "Alameda priority rooms, 2", "28"],
         ["Ground", "MDT and telemedicine, bookable", "18"],
         ["First", "Sessional consulting rooms, 10 at 14 sqm", "140"],
         ["First", "Procedure room", "22"],
         ["First", "Doctors' lounge and touchdown, common", "27"],
         ["Chalet", "Medlyfe longevity and infusion, whole building", "80"],
         ["BQ", "Back of house: staff, records, medical waste holding, plant", "45"]],
        ["Floor", "Use", "sqm"],
        [70, 353, 80], aligns=["l", "r"]))
    el.append(Spacer(1, 5))
    el.append(Paragraph(
        "Imaging must be on the ground floor. Heavy equipment, lead shielding, no lift. The boys' "
        "quarters goes to back of house rather than an office let, because a fourteen-hour six-day "
        "operation needs staff facilities and a compliant medical waste route and the main house "
        "has nowhere to put either.", P))
    el.append(Paragraph("Rate card", H2))
    el.append(money_table(
        [["Sessional consulting, weekday early 07:00 to 09:00", "2 hours", "44,000"],
         ["Sessional consulting, weekday daytime", "4 hours", "61,000"],
         ["Sessional consulting, weekday evening 17:00 to 21:00", "4 hours", "94,000"],
         ["Sessional consulting, Saturday", "3.3 hours", "83,000"],
         ["Procedure room", "per session", "248,000"],
         ["Guest and ad hoc use", "any band", "about 2x member rate"]],
        ["Sessional tariff", "Block", "NGN per block"],
        [270, 90, 143], aligns=["l", "r"]))
    el.append(Spacer(1, 5))
    el.append(money_table(
        [["Medlyfe, guest chalet", "80", "456,000", "36.5"],
         ["Alameda, blended licence", "see 07", "blended", "132.0"],
         ["Medbury Diagnostics, laboratory and imaging", "115", "facility", "nil"],
         ["Medbury Pharmaceuticals", "40", "facility", "nil"],
         ["Total fixed leases", "", "", "168.5"]],
        ["Fixed lease", "sqm", "NGN / sqm / yr", "NGN M / yr"],
        [225, 60, 118, 100], total_row=True))
    el.append(Spacer(1, 5))
    el.append(Paragraph(
        "Rates carry an uplift of about 11% over a bare-room tariff, which is what the on-site "
        "laboratory, imaging and pharmacy are worth to a consultant running a private list. Evening "
        "and Saturday carry a further premium because they are the hours nobody else in Abuja "
        "offers. Weekday daytime is discounted deliberately, because it is the weakest band and an "
        "empty room earns nothing. With pharmacy and diagnostics treated as facility, <b>56% of the "
        "building is facility and 44% is let</b>, which is what a fully serviced campus looks like "
        "and why the rate per let sqm has to be high.", P))
    el.append(PageBreak())

    # ---------------- 07 ALAMEDA ----------------
    sec(el, "07", "ALAMEDA", "One blended charge, and a hard capacity constraint.")
    el.append(Paragraph(
        "Alameda brings 15 to 20 Egyptian specialists to Nigeria in rotating conversion drives, "
        "not as a standing team. Their access window is 09:00 to 17:00, Monday to Friday, "
        "non-exclusive, to two priority consulting rooms with additional rooms and the procedure "
        "room available during declared drive windows.", LEDE))
    el.append(Paragraph("What actually caps their volume", H2))
    el.append(Paragraph(
        "Four independent limits. Real throughput is the minimum of the four.", P))
    el.append(money_table(
        [["1. Room capacity", "Rooms x 7 productive hours x 2.5 consults per hour x 80% utilisation",
          "2 rooms = 28 &nbsp; 4 rooms = 56"],
         ["2. Clinician capacity", "Specialists x 14 to 16 consults a day, sustained over a drive",
          "2 = 28 &nbsp; 4 = 56 &nbsp; 6 = 84"],
         ["3. Campus throughput", "8 arrivals an hour in a VIP setting x 7 hours",
          "56 a day"],
         ["4. Booked demand", "Appointments generated and shown",
          "20 to 30 early, 50 to 56 mature"]],
        ["Limit", "Basis", "Consults per day"],
        [98, 258, 147], aligns=["l", "l"]))
    el.append(Spacer(1, 5))
    el.append(card(
        "<b>Limits 1 and 2 must match one to one. Four specialists require four rooms.</b> Fifty-six "
        "consultations cannot be delivered through two rooms; two rooms cap at 28. The design point "
        "is four rooms and four specialists at 56 a day, which is also exactly where reception "
        "capacity caps out. Do not allocate a fifth room. It only adds arrivals the building cannot "
        "absorb.", bg=PANEL))
    el.append(Spacer(1, 5))
    el.append(money_table(
        [["Drives per year", "4", "6", "8"],
         ["Clinic days per drive", "6", "8", "10"],
         ["Specialists, and therefore rooms", "2", "4", "4"],
         ["Consults per day", "28", "56", "56"],
         ["Consults per year", "672", "2,688", "4,480"]],
        ["Drive model", "Low", "Base", "High"],
        [223, 93, 93, 94], total_row=True))
    el.append(Spacer(1, 6))
    el.append(Paragraph("The charge", H2))
    el.append(money_table(
        [["Rent, priority rooms and MDT room", "38.75", "25,000"],
         ["Facility and services, laboratory, imaging and pharmacy included", "93.25", "60,000"],
         ["Blended total", "132.00", "85,000"]],
        ["Component", "NGN M / yr", "USD / yr"],
        [263, 120, 120], total_row=True))
    el.append(Spacer(1, 5))
    el.append(Paragraph(
        "One number. No separate drive fee, no mobilisation line, no marketing line, no throughput "
        "charge. Marketing sits inside the service charge undifferentiated and Medbury simply "
        "markets. Payable <b>twelve months in advance in USD</b>, escalating 12% a year. NGN 132M "
        "is the ask and <b>NGN 114M the floor</b>, since Alameda have already named a USD 25,000 "
        "property budget and the uplift for facility recovery is the part they will resist.", P))
    el.append(Paragraph(
        "The rent line takes Alameda's entire stated USD 25,000 property budget, and is set at "
        "market for the demise so it survives an arm's length test under clause 13 of the joint "
        "venture agreement and under Nigeria's transfer pricing regulations. The service charge is "
        "a separate cost centre, so \"the budget is spent\" is not available to them.", P))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>One structural note for the model.</b> The charge is billed to the JV OpCo, of which "
        "Medbury owns 49%. The net economic transfer from Alameda is therefore about NGN 67M, not "
        "NGN 132M. That is a feature of charging a company you part own, and it is the reason the "
        "capture layer matters more than the facility charge. Alameda's patients are worth more to "
        "Medbury Diagnostics than their rent is to PropCo, because capture is 100% Medbury's.",
        bg=ALERT, rule=HexColor("#B8763A")))
    el.append(Spacer(1, 5))
    el.append(Paragraph(
        "<b>The clause that beats the rent argument.</b> Every user agreement, Alameda's included, "
        "must carry a first-call obligation routing diagnostics to Medbury Diagnostics and "
        "prescriptions to Medbury Pharmaceuticals unless clinically unavailable. Conversion drives "
        "generate pre-operative workups, so Alameda's diagnostic attach rate is higher than any "
        "other user on the campus. There is room to move on the facility charge in exchange for "
        "binding first call. There is no room to move on first call.", P))
    el.append(PageBreak())

    # ---------------- 08 INVESTMENT CASE ----------------
    sec(el, "08", "THE INVESTMENT CASE", "Break-even before a session is sold.")
    el.append(money_table(
        [["Head rent, escalated", "55.0"],
         ["Power", "28.0"],
         ["Admin and facilities salaries, shift cover", "33.0"],
         ["Security, cleaning, waste, insurance, internet", "15.0"],
         ["Maintenance and biomedical", "8.0"],
         ["Campus marketing and concierge", "8.0"],
         ["Fit-out and power system amortisation, 10 years", "26.5"],
         ["Fixed cost base", "173.5"]],
        ["Stabilised annual cost", "NGN M"],
        [383, 120], total_row=True))
    el.append(Spacer(1, 5))
    el.append(card(
        "<b>Fixed leases NGN 168.5M against a fixed cost base of NGN 173.5M.</b> The campus breaks "
        "even at 1.5% sessional fill, under two blocks a week across ten rooms. On the tenant view "
        "of pharmacy and diagnostics it is covered outright, with NGN 25M to spare.",
        bg=PANEL))
    el.append(Spacer(1, 6))
    el.append(Paragraph("Sessional programme, at stabilisation", H2))
    el.append(money_table(
        [["Weekday early, 07:00 to 09:00", "35%", "35.4"],
         ["Weekday evening, 17:00 to 21:00", "55%", "118.9"],
         ["Saturday", "45%", "51.5"],
         ["Weekday daytime, non-drive days", "35%", "80.5"],
         ["Procedure room", "", "44.6"],
         ["Total sessional", "", "330.9"]],
        ["Band", "Assumed fill", "NGN M / yr"],
        [263, 120, 120], total_row=True))
    el.append(Spacer(1, 5))
    el.append(Paragraph(
        "Ramp: about 30% of that in year one, 60% in year two, full in year three. Sessional fill "
        "is the single largest sensitivity in the whole model and it is unvalidated for Abuja.", P))
    el.append(Spacer(1, 6))
    el.append(Paragraph("Both views of pharmacy and diagnostics", H2))
    el.append(money_table(
        [["Alameda, blended licence", "114.0", "132.0"],
         ["Medlyfe, guest chalet", "30.4", "36.5"],
         ["Medbury Diagnostics, laboratory and imaging", "39.1", "in the rates"],
         ["Medbury Pharmaceuticals", "15.0", "in the rates"],
         ["Sessional programme", "299.4", "330.9"],
         ["Campus revenue", "497.9", "499.4"],
         ["Net annual contribution to Medbury", "345", "385"]],
        ["Stabilised, NGN M / yr", "As tenants", "As facility"],
        [263, 120, 120], total_row=True))
    el.append(Spacer(1, 5))
    el.append(Paragraph(
        "Campus revenue is the same either way. The facility view is worth about <b>NGN 40M</b> "
        "more to Medbury, and all of it comes from the sessional tariff uplift and Alameda's 51% "
        "share. Medlyfe's uplift is Medbury paying itself and nets to nothing. So the NGN 40M is "
        "conditional on the sessional users accepting about 11% and Alameda accepting about 16%. "
        "If only the sessional uplift sticks, the gain is NGN 31.5M.", P))
    el.append(Paragraph(
        "<b>Run both.</b> The facility view is what tenants and Alameda see, and it is the better "
        "pitch. The tenant view stays in the management accounts, because it costs nothing and it "
        "is the only way to tell whether Medbury Diagnostics earns its 115 sqm, which at 30% of the "
        "building is the largest single space allocation on the campus. It also keeps related-party "
        "pricing arm's length for FIRS and leaves the numbers in the right shape for any future "
        "investor in PropCo or partner in the diagnostics business.", P))
    el.append(PageBreak())
    el.append(Paragraph("Three cases", H2))
    el.append(money_table(
        [["Sessional revenue", "165", "331", "397"],
         ["Fixed leases", "168.5", "168.5", "168.5"],
         ["Less fixed cost base", "(173.5)", "(173.5)", "(173.5)"],
         ["Campus contribution", "160.0", "326.0", "392.0"],
         ["Diagnostics and pharmacy, net of staff, no rent charged", "88", "144", "180"],
         ["Less JV interest in the Alameda charge, and Medlyfe internal", "(70)", "(71)", "(71)"],
         ["Net annual contribution to Medbury", "177", "399", "501"]],
        ["Stabilised, NGN M", "Downside", "Base", "Upside"],
        [223, 93, 93, 94], total_row=True, subtotal_rows={3}))
    el.append(Spacer(1, 5))
    el.append(money_table(
        [["Total capital", "527", "527", "527"],
         ["Simple payback from stabilisation", "3.0 years", "1.3 years", "1.1 years"],
         ["Including a 24 month ramp", "~5.0 years", "~3.3 years", "~3.1 years"]],
        ["Return", "Downside", "Base", "Upside"],
        [223, 93, 93, 94]))
    el.append(Spacer(1, 5))
    el.append(Paragraph(
        "The downside case halves the assumed sessional fill and cuts capture by 40%, and the "
        "project still returns. That is the margin of safety, and it comes from the fixed leases "
        "carrying the cost base on their own.", P))
    el.append(PageBreak())

    # ---------------- 09 THE JV ----------------
    sec(el, "09", "THE JOINT VENTURE", "What must change before signature.")
    el.append(Paragraph(
        "Medbury holds 49% and two of five board seats. Alameda holds 51% and three, with simple "
        "majority voting and no defined reserved matters. Meanwhile Medbury funds the property "
        "outside the venture entirely. The joint venture's total initial capital of USD 152,000 is "
        "about NGN 236M against a project cost of NGN 527M, so the venture is not funding this "
        "campus. Medbury is.", LEDE))
    el.append(Paragraph(
        "The structure we have built resolves that correctly: the property stays in a wholly owned "
        "Medbury PropCo and the joint venture is a tenant paying market rate rent. On that basis "
        "49% is tolerable. What is not tolerable is the drafting.", P))
    el.append(Paragraph("Priority amendments", H2))
    el.append(money_table(
        [["1", "Delete clause 24.I",
          "Termination for convenience on 30 days' notice, against a two-year prepaid rent and a "
          "NGN 284M fit-out, is the most dangerous line in the document. Replace with no "
          "termination for convenience before year five, then twelve months' notice"],
         ["2", "Break fee",
          "On early exit, unamortised fit-out plus remaining head rent. Today there is no route "
          "for Medbury to recover a naira of the fit-out"],
         ["3", "Define the reserved matters",
          "Clause 6(g) refers to \"Shareholders Reserved Matters\" and never defines them. Fill "
          "the hole with a Medbury veto over budget, capex above NGN 10M, related-party contracts, "
          "borrowing, new shares, lease changes, dividend policy, MD and FD appointment, competing "
          "ventures, asset sales and winding up"],
         ["4", "Mutual non-solicitation, and no non-compete",
          "A non-compete is deliberately not sought: it clashes with the independent specialists on "
          "the first floor and would lock Medbury out of conversion pathways with other foreign "
          "groups. What is needed instead is mutual non-solicitation of contracted physicians, "
          "members and corporate accounts, plus preferred-pathway status for Alameda in place of "
          "exclusivity"],
         ["5", "Deadlock mechanism",
          "There is none. Escalation to chief executives, then a shoot-out, with an express "
          "carve-out that the property never moves"],
         ["6", "Currency",
          "Capital is denominated in USD and every cost is in naira. Fix the naira equivalent or "
          "specify the CBN rate at each call, or an FX move silently rewrites who contributed what"],
         ["7", "Tag-along and drag-along",
          "Absent entirely"]],
        ["", "Amendment", "Why"],
        [22, 128, 353], aligns=["l", "l"]))
    el.append(PageBreak())
    el.append(Paragraph("Drafting defects for counsel", H2))
    el.append(Paragraph(
        "These are worth listing because of what they signal about how much care went into the "
        "document Medbury is being asked to sign.", P))
    bullets(el, [
        "The special purpose vehicle is named <b>Allox Kings City Estates Ltd</b>, a real estate "
        "entity. Using a property-named shell as the healthcare joint venture vehicle invites "
        "confusion about who owns the building. Incorporate a purpose-built healthcare SPV.",
        "The cover page says <b>ALAMEDIA</b> Financial Limited. The body says <b>ALAMEDA</b>.",
        "Cites the Companies and Allied Matters Act <b>2004</b>, superseded by CAMA 2020, "
        "including the section 381 cross-reference.",
        "Clause 9 repeatedly refers to \"this Clause 10\".",
        "\"Excluded Person\" is used four times and never defined. Only \"Eligible Person\" is.",
        "Clause 8 requires pro rata funding. Clause 12 exempts shareholders from further "
        "liability. Directly contradictory.",
    ])
    el.append(Spacer(1, 5))
    el.append(card(
        "The agreement names medical tourism conversion as the purpose of the venture and then "
        "provides no referral fee, no revenue share, no volume commitment, no transfer pricing "
        "mechanism and no audit right anywhere in its twenty-three pages. Whatever commercial "
        "position Medbury takes on that, the absence should be a deliberate decision rather than "
        "an oversight.", bg=ALERT, rule=HexColor("#B8763A")))
    el.append(PageBreak())

    # ---------------- 10 CONDITIONS PRECEDENT ----------------
    sec(el, "10", "CONDITIONS AND RISK", "What has to be true before money moves.")
    el.append(money_table(
        [["Change of use approval",
          "This is a residential building. Development Control and AMAC approval plus the "
          "landlord's written consent to change of use",
          "Before the NGN 115M rent and fees are paid"],
         ["Head lease to 5 plus 5",
          "With the fit-out recognised and a reinstatement waiver",
          "Before any fit-out capital is released"],
         ["FCT health facility registration",
          "Campus and each clinical tenant",
          "Before opening"],
         ["NNRA radiation licence",
          "Required for X-ray, together with lead shielding and warning systems",
          "Before imaging installs"],
         ["MDCN temporary registration",
          "Egyptian specialists cannot lawfully see Nigerian patients without it, and it is "
          "Medbury's facility licence at risk, not Alameda's",
          "No certificate, no room key"],
         ["NDPR cross-border transfer",
          "Nigerian patient records reviewed by Egyptian clinicians need a data processing "
          "agreement and a lawful transfer basis",
          "Before the first drive"],
         ["Fire and medical waste",
          "Compartmentation in a house never designed for it, and a compliant waste route",
          "Part of Phase 1"]],
        ["Condition", "What it is", "When"],
        [110, 268, 125], aligns=["l", "l"]))
    el.append(PageBreak())

    # ---------------- 11 VERIFY ----------------
    sec(el, "11", "SENSE CHECK", "What in this note is measured, and what is estimated.")
    el.append(Paragraph(
        "Every figure here is either taken from a document you have supplied or built from a "
        "stated assumption. The assumptions below carry the most weight and should be tested "
        "before this model is used to commit capital.", LEDE))
    el.append(money_table(
        [["Head rent, fees, salaries, solar quote, Alameda's USD 25,000 budget, kWh target",
          "Supplied by Medbury", "Firm"],
         ["Joint venture terms, clause references, party names, capital",
          "Read from the executed draft", "Firm"],
         ["Building areas",
          "Measured from the as-built PDFs, not the CAD",
          "Verify against CAD. Everything re-bases if wrong"],
         ["Electricity tariff",
          "Blended NGN 250 per kWh across grid and diesel top-up",
          "Confirm from an actual AEDC bill"],
         ["Fit-out at NGN 232M",
          "Built up by package, on the building being sound",
          "Needs a condition survey, an electrical load assessment and a QS take-off"],
         ["Sessional fill rates, 35% to 55%",
          "Derived from the Ikoyi Harley Street model",
          "Largest single sensitivity. Unvalidated for Abuja"],
         ["Diagnostics 40% attach at NGN 40,000, pharmacy 45% at NGN 16,000",
          "Illustrative",
          "Validate against Medbury Diagnostics' actual data"],
         ["Alameda drive volumes",
          "Base case of 6 drives, 4 specialists, 8 days, 14 patients each",
          "Confirm with Alameda directly"]],
        ["Input", "Source", "Status"],
        [180, 155, 168], aligns=["l", "l"]))
    el.append(Spacer(1, 5))
    el.append(Paragraph(
        "Ask Alameda for five things before the tariff is finalised: drives a year and the window "
        "for each, specialists per drive and in which specialities, target patients per specialist "
        "per day, their historical consult to travel conversion rate from any market they already "
        "run drives in, and average treatment invoice by speciality. If they will not give you the "
        "last two, that itself tells you what they expect to convert, and the charge should be "
        "priced to stand alone without any conversion upside.", P))
    el.append(PageBreak())

    # ---------------- 12 NEXT ----------------
    sec(el, "12", "NEXT", "Four conversations, in this order.")
    el.append(money_table(
        [["1", "The landlord",
          "Head lease to 5 plus 5, change of use consent, fit-out recognition, reinstatement waiver. "
          "Nothing else can be committed until this lands"],
         ["2", "Alameda",
          "Blended licence at NGN 114M, twelve months in advance in USD, four rooms and 56 a day "
          "capped, first call on diagnostics and pharmacy, and the seven joint venture amendments"],
         ["3", "Medbury Diagnostics",
          "Confirm the combined laboratory and imaging demise, and appoint the radiology partner "
          "under Medbury Diagnostics rather than as a campus tenant"],
         ["4", "Medlyfe",
          "Confirm the guest chalet as a lease at NGN 36.5M a year. It is the second of the two "
          "leases that carry the campus"]],
        ["", "Who", "What"],
        [22, 105, 376], aligns=["l", "l"]))
    el.append(Spacer(1, 8))
    el.append(card(
        "Both fixed leases are unsigned and Medlyfe has not yet been approached. Alongside the head "
        "lease term, that is the critical path and it is the whole of the risk. The trading model "
        "is not in doubt. The leases are.",
        bg=PANEL))
    el.append(Spacer(1, 10))
    el.append(card(
        "<b>Debo Odulana</b> &nbsp; Consult for Africa &nbsp; / &nbsp; Lagos and Abuja<br/>"
        "+234 913 813 8553 &nbsp; / &nbsp; hello@consultforafrica.com &nbsp; / &nbsp; "
        "consultforafrica.com",
        bg=NAVY, fg=white))
    el.append(Spacer(1, 6))
    el.append(Paragraph(
        "Prepared for Dr Itunu Akinware and Medbury Healthcare Group leadership, in confidence. "
        "Areas are measured from as-built drawings and should be confirmed against the CAD. "
        "Fit-out, tariff and attach-rate figures are estimates to be set against a quantity "
        "surveyor's take-off, a live electricity bill and Medbury Diagnostics' own trading data. "
        "Nothing here is a binding offer, and nothing here is legal or tax advice. FX reference "
        "USD/NGN 1,550.", SMALL))

    doc.build(el)
    print("wrote %s" % OUT)


if __name__ == "__main__":
    build()
