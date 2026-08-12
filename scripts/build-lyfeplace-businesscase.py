"""
Build the Lyfe Place Abuja business case PDF.

One consolidated document for Dr Itunu Akinware: the building, the product, the
pricing, the capital, the operating costs and the financials. Supersedes the
position note and the product note.

Client-facing. No process commentary, no revision history, no working shown that
does not help the reader decide.

Output: docs/lyfeplace-abuja/lyfeplace-abuja-business-case-cfa.pdf
House style matches the CFA repo. Naira shown as NGN. No em dashes.

Run:
  python3 scripts/build-lyfeplace-businesscase.py
"""

from __future__ import annotations

from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import (
    BaseDocTemplate, Frame, PageBreak, PageTemplate, Paragraph, Spacer, Table, TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs" / "lyfeplace-abuja"
OUT = DOCS / "lyfeplace-abuja-business-case-cfa.pdf"

NAVY = HexColor("#0F3D2E")
GOLD = HexColor("#C6A15B")
TEAL = HexColor("#2F6B52")
BODY = HexColor("#23302B")
MUTED = HexColor("#7C7C74")
SURFACE = HexColor("#F5F2EA")
LIGHT = HexColor("#CBDDD1")
PANEL = HexColor("#E9F0EA")
CREAM = HexColor("#F6EFDD")
ALERT = HexColor("#FBF0E4")
RUST = HexColor("#B8763A")

PAGE_W, PAGE_H = A4
MARGIN = 42
FULLW = PAGE_W - 2 * MARGIN

ss = getSampleStyleSheet()


def style(name, **kw):
    base = dict(fontName="Helvetica", fontSize=8.8, leading=11.8, textColor=BODY,
                alignment=TA_LEFT, spaceAfter=5)
    base.update(kw)
    return ParagraphStyle(name, **base)


EYEBROW = style("eyebrow", fontName="Helvetica-Bold", fontSize=8.0, leading=10.5,
                textColor=GOLD, spaceAfter=2)
H1 = style("h1", fontName="Helvetica-Bold", fontSize=13, leading=16.5, textColor=NAVY,
           spaceBefore=6, spaceAfter=5)
H2 = style("h2", fontName="Helvetica-Bold", fontSize=9.6, leading=12.5, textColor=TEAL,
           spaceBefore=7, spaceAfter=3)
P = style("p")
LEDE = style("lede", fontSize=9.5, leading=13.4, textColor=HexColor("#374151"))
SMALL = style("small", fontSize=7.3, leading=9.8, textColor=MUTED)
CELL = style("cell", fontSize=7.9, leading=10.2)
CELL_R = style("cellr", fontSize=7.9, leading=10.2, alignment=2)
CELL_B = style("cellb", fontSize=7.9, leading=10.2, fontName="Helvetica-Bold", textColor=NAVY)
CELL_BR = style("cellbr", fontSize=7.9, leading=10.2, fontName="Helvetica-Bold",
                textColor=NAVY, alignment=2)
CELL_W = style("cellw", fontSize=7.9, leading=10.2, fontName="Helvetica-Bold", textColor=white)
CELL_WR = style("cellwr", fontSize=7.9, leading=10.2, fontName="Helvetica-Bold",
                textColor=white, alignment=2)


def page_bg(c, doc):
    c.saveState()
    c.setFillColor(NAVY)
    c.rect(0, PAGE_H - 30, PAGE_W, 30, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(0, PAGE_H - 33, PAGE_W, 3, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(MARGIN, PAGE_H - 20, "LYFE PLACE ABUJA")
    c.setFillColor(LIGHT)
    c.setFont("Helvetica", 8)
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 20, "Business case")
    c.setFillColor(GOLD)
    c.rect(MARGIN, 26, 20, 2, fill=1, stroke=0)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 7.3)
    c.drawString(MARGIN, 15, "Private and confidential  /  Prepared for Dr Itunu Akinware, Group CEO")
    c.drawRightString(PAGE_W - MARGIN, 15, "Page %d" % doc.page)
    c.restoreState()


def card(text, bg=SURFACE, fg=BODY, rule=GOLD):
    st = ParagraphStyle("c", parent=P, textColor=fg, leftIndent=6, rightIndent=6,
                        spaceBefore=2, spaceAfter=2)
    t = Table([[Paragraph(text, st)]], colWidths=[FULLW])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("LINEBEFORE", (0, 0), (0, -1), 2.5, rule),
        ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 10), ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ]))
    return t


def tbl(rows, labels, widths, total_row=False, aligns=None, hi=None, sub=None):
    ncols = len(labels)
    if aligns is None:
        aligns = ["r"] * (ncols - 1)
    hi = hi or set()
    sub = sub or set()
    data = [[Paragraph(labels[0], CELL_W)] +
            [Paragraph(t, CELL_WR if aligns[j] == "r" else CELL_W) for j, t in enumerate(labels[1:])]]
    for i, r in enumerate(rows):
        emph = (total_row and i == len(rows) - 1) or i in hi or i in sub
        cells = [Paragraph(r[0], CELL_B if emph else CELL)]
        for j, v in enumerate(r[1:]):
            cells.append(Paragraph(v, (CELL_BR if emph else CELL_R) if aligns[j] == "r"
                                   else (CELL_B if emph else CELL)))
        data.append(cells)
    t = Table(data, colWidths=widths)
    st = [
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("LINEBELOW", (0, 0), (-1, 0), 1.5, GOLD),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 2.9), ("BOTTOMPADDING", (0, 0), (-1, -1), 2.9),
        ("LEFTPADDING", (0, 0), (-1, -1), 6), ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("ROWBACKGROUNDS", (0, 1), (-1, -2 if total_row else -1), [white, SURFACE]),
    ]
    if total_row:
        st += [("BACKGROUND", (0, -1), (-1, -1), CREAM), ("LINEABOVE", (0, -1), (-1, -1), 1, GOLD)]
    for i in hi:
        st.append(("BACKGROUND", (0, i + 1), (-1, i + 1), PANEL))
    for i in sub:
        st.append(("LINEABOVE", (0, i + 1), (-1, i + 1), 0.6, GOLD))
    t.setStyle(TableStyle(st))
    return t


def sec(el, num, eyebrow, title):
    el.append(Paragraph(num + "  /  " + eyebrow, EYEBROW))
    el.append(Paragraph(title, H1))


def build():
    doc = BaseDocTemplate(
        str(OUT), pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=42, bottomMargin=30,
        title="Lyfe Place Abuja - business case", author="Consult for Africa")
    doc.addPageTemplates([PageTemplate(
        id="p", frames=[Frame(MARGIN, 30, FULLW, PAGE_H - 42 - 30, id="f")], onPage=page_bg)])
    el = []

    el.append(Paragraph("Lyfe Place Abuja",
                        style("t", fontName="Helvetica-Bold", fontSize=19, leading=22,
                              textColor=NAVY, spaceAfter=2)))
    el.append(Paragraph("Business case.",
                        style("st", fontName="Helvetica-Oblique", fontSize=11, leading=14,
                              textColor=GOLD, spaceAfter=7)))

    # 01 PROPOSITION
    sec(el, "01", "THE PROPOSITION", "A private ambulatory medical campus.")
    el.append(Paragraph(
        "A four-structure residential compound in Abuja converted into a medical park under "
        "Medbury's Medical Infrastructure Division. Senior specialists hold sessions there without "
        "taking a lease. Families buy bundled care. Aesthetic and day-case surgery anchors the "
        "identity. A laboratory, imaging and a pharmacy sit on site, so a patient is consulted, "
        "worked up, treated and dispensed to in a single visit and goes home the same day.", LEDE))
    el.append(tbl(
        [["Campus", "711 sqm gross across four structures, 519 sqm of usable rooms"],
         ["Clinical capacity", "5 sessional consulting rooms, a day-case theatre, a treatment room, "
          "a hair transplant suite, three imaging modalities, a laboratory and a pharmacy"],
         ["Capital", "NGN 647M, including two years of rent in advance. NGN 526M on the reduced fit-out"],
         ["Revenue at stabilisation", "NGN 584M campus revenue, base case"],
         ["Return", "NGN 356M a year to Medbury, payback 1.8 years from stabilisation. 1.4 years on the reduced fit-out"]],
        ["", ""], [110, 357], aligns=["l"], hi={4}))

    # 02 BUILDING
    sec(el, "02", "THE BUILDING", "Four structures, and what each becomes.")
    el.append(tbl(
        [["Main building, ground", "286", "182", "Arrival, theatre suite, conversion clinic, imaging"],
         ["Main building, first", "277", "239", "The consulting plaza, hair transplant, treatment room"],
         ["Guest chalet", "96", "61", "Laboratory and specimen handling"],
         ["Boys' quarters", "52", "37", "Pharmacy: dispensary, retail, controlled drugs, cold chain"],
         ["Campus", "711", "519", "73% of gross is usable room"]],
        ["Structure", "Gross sqm", "Rooms sqm", "Becomes"],
        [118, 58, 58, 233], total_row=True))
    el.append(Spacer(1, 4))
    el.append(Paragraph("Ground floor, 182 sqm of rooms", H2))
    el.append(tbl(
        [["Theatre", "24.7", "Theatre suite", "Level trolley access, HEPA ventilation, isolated power"],
         ["Monitored recovery, 2 bays", "13.0", "Theatre suite", "Adjoins the theatre"],
         ["Sterile store and dirty utility", "7.8", "Theatre suite", "One-way dirty to clean"],
         ["Conversion clinic, consulting 1", "19.3", "Conversion clinic", ""],
         ["Conversion clinic, consulting 2", "18.2", "Conversion clinic", "Existing water and drainage"],
         ["Digital X-ray, lead shielded", "14.1", "Campus", "Cannot be sited elsewhere"],
         ["Phlebotomy draw point", "10.4", "Campus", "Specimens routed to the chalet"],
         ["Medication collection point", "6.0", "Campus", "Serving hatch to the waiting area"],
         ["Reception, waiting, concierge", "58.1", "Common", "Two waiting zones, scrub recess"],
         ["Patient WCs", "10.4", "Common", ""]],
        ["Room", "sqm", "Zone", "Note"], [148, 40, 82, 197], sub={3, 5, 8}))
    el.append(Spacer(1, 3))
    el.append(Paragraph(
        "The theatre suite is ring-fenced as a sole-use zone entered off the lobby. The conversion "
        "clinic and the campus diagnostics sit outside it.", P))
    el.append(PageBreak())

    el.append(Paragraph("First floor, 239 sqm of rooms", H2))
    el.append(tbl(
        [["Consulting rooms 1, 2 and 3", "51.6", "Sessional pool", "New partitions off a central spine"],
         ["Consulting room 4", "19.8", "Sessional pool", "En-suite WC"],
         ["Consulting room 5", "19.8", "Sessional pool", "En-suite WC"],
         ["Consulting room 6", "22.4", "Family practice", "The bundled-care service"],
         ["Hair transplant suite", "24.3", "Anchor", "All-day single-patient cases"],
         ["Treatment room", "14.8", "Anchor", "Local anaesthesia, existing water and drainage"],
         ["Ultrasound and echocardiography", "13.7", "Campus", "Beside the consultants who order it"],
         ["Phlebotomy draw point", "5.7", "Campus", "So patients do not descend for bloods"],
         ["Doctors' and members' lounge", "34.0", "Common", "Part of what membership buys"],
         ["Sterilising", "9.4", "Common", "Existing water and drainage"],
         ["Linen and consumables", "9.9", "Common", ""],
         ["Patient WC and terrace", "13.3", "Common", ""]],
        ["Room", "sqm", "Zone", "Note"], [148, 40, 82, 197], sub={4, 6, 8}))
    el.append(Spacer(1, 3))
    el.append(card(
        "<b>Five rooms make up the sessional pool.</b> That is what the campus can let by the "
        "session once the theatre, the conversion clinic, the family practice and the anchor have "
        "their space. At four bands a day over six days it is 5,520 half-day blocks a year.",
        bg=PANEL))

    # 03 PRODUCT
    sec(el, "03", "THE PRODUCT", "Three revenue lines, two capture businesses.")
    el.append(tbl(
        [["Panel and membership", "Specialists", "Access to rooms and an address without a lease. "
          "Panel for breadth, membership for the committed", "Fees and sessions"],
         ["Family practice", "Families and corporates", "Bundled annual care with quarterbacked "
          "referral into the panel. The campus's own demand engine", "Packages"],
         ["Day case and aesthetics", "Cash-pay patients", "Aesthetic medicine and surgery, "
          "dermatology, hair transplant", "Theatre, treatment and suite fees"],
         ["Conversion clinic", "Alameda", "Two ground-floor rooms and campus services",
          "Licence"],
         ["Medbury Diagnostics", "All of the above", "Laboratory, X-ray, ultrasound, echo", "Per test"],
         ["Medbury Pharmaceuticals", "All of the above", "Dispensing and retail", "Per script"]],
        ["Line", "Sold to", "What it is", "Revenue"],
        [104, 84, 210, 69], aligns=["l", "l", "l"], hi={1}))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "The family practice is what makes the rest work. A panel of specialists with no patients is "
        "an empty building. Bundled care generates first contact, refers into the panel, and drives "
        "the diagnostics and pharmacy volume. It is the only line the campus controls end to end.", P))
    el.append(PageBreak())

    # 04 PRICING
    sec(el, "04", "PRICING", "Sessions, memberships, packages.")
    el.append(Paragraph("Sessions", H2))
    el.append(tbl(
        [["Early, 07:00 to 09:00", "2 hours", "44,000", "66,000"],
         ["Morning, 09:00 to 13:00", "4 hours", "61,000", "91,500"],
         ["Afternoon, 13:00 to 17:00", "4 hours", "61,000", "91,500"],
         ["Evening, 17:00 to 21:00", "4 hours", "94,000", "141,000"],
         ["Treatment room", "per session", "180,000", "270,000"],
         ["Day-case theatre", "per half-day list", "750,000", "1,125,000"]],
        ["Band", "Length", "Member", "Panel or guest"], [163, 92, 106, 106], hi={5}))
    el.append(Spacer(1, 3))
    el.append(Paragraph("Anaesthetist fees are billed through to the operating clinician with a "
                        "coordination margin, not carried by the campus.", SMALL))
    el.append(Spacer(1, 4))
    el.append(Paragraph("Membership ladder", H2))
    el.append(tbl(
        [["Panel", "400,000", "Guest rates", "Credentialing, directory listing, booking access"],
         ["Associate", "1,200,000", "20% off guest", "Pays for itself at 0.8 sessions a week"],
         ["Full", "2,400,000", "35% off guest", "Priority booking, named room preference, lounge"],
         ["Fellow", "4,200,000", "35% off guest", "A standing weekly slot, directory prominence, "
          "inclusion in campus marketing"],
         ["Group", "2,000,000 each", "35% off guest", "Three or more from one practice. Shared named "
          "room, pooled blocks, one invoice"],
         ["Partnership", "Revenue share", "n/a", "For anchor lines. The campus provides room, "
          "equipment and marketing, the clinician provides the practice"]],
        ["Tier", "NGN a year", "Session rate", "What it buys"],
        [72, 84, 82, 229], aligns=["r", "l", "l"], hi={5}))
    el.append(Spacer(1, 4))
    el.append(Paragraph("Family practice packages", H2))
    el.append(tbl(
        [["Individual", "600,000", "Unlimited GP access, annual screen, vaccinations, chronic "
          "disease management, quarterbacked referral"],
         ["Family, up to four", "1,500,000", "As above for the household, with paediatric cover"],
         ["Corporate, per head", "400,000", "Executive screen, occupational health, priority access"]],
        ["Package", "NGN a year", "What is included"], [116, 74, 277], aligns=["r", "l"]))

    # 05 CAPITAL
    sec(el, "05", "CAPITAL", "NGN 647M, and where it goes.")
    el.append(tbl(
        [["Head rent, two years in advance", "100.0", "100.0"],
         ["Agency, legal and caution deposit at 15%", "15.0", "15.0"],
         ["Building fit-out", "232.0", "162.4"],
         ["Theatre suite", "120.0", "84.0"],
         ["Power, 25KVA hybrid solar", "33.0", "33.0"],
         ["Medbury Diagnostics unit", "28.0", "19.6"],
         ["Medbury Pharmaceuticals unit", "24.0", "16.8"],
         ["Working capital, six months", "95.0", "95.0"],
         ["Total capital", "647.0", "525.8"]],
        ["Capital, NGN M", "As costed", "At 70%"], [321, 73, 73], total_row=True))
    el.append(Spacer(1, 3))
    el.append(card(
        "<b>The second column carries every fit-out line at 30% below the costed figure.</b> It is a "
        "reasonable target on builder's work, finishes and sourced furniture, which together are "
        "about 46% of the building package: local sourcing, retained joinery and doors, and "
        "good-commercial rather than premium-clinical finishes all pull in that direction. It is far "
        "less likely on the theatre, which is <b>88% equipment</b>. An air handling unit, an "
        "anaesthetic machine and an isolated power panel have hard prices and do not negotiate down "
        "by a third.", bg=PANEL))
    el.append(Spacer(1, 4))
    el.append(Paragraph("Building fit-out, NGN 232M", H2))
    el.append(tbl(
        [["Cooling, about 28 split units and cassettes", "24.0", "16.8"],
         ["ICT: cabling, network, CCTV, access control, emergency call, room status", "15.0", "10.5"],
         ["Electrical: boards, solar and grid zoning, medical circuits, emergency lighting", "14.0", "9.8"],
         ["Joinery: reception, nurse stations, room casework", "14.0", "9.8"],
         ["Interior decoration: painting, window treatments, soft finishes", "12.0", "8.4"],
         ["Fire: detection, alarm, escape lighting", "9.0", "6.3"],
         ["Clinical flooring, welded and coved vinyl", "9.0", "6.3"],
         ["Ceilings and lighting", "9.0", "6.3"],
         ["Partitioning to form the consulting rooms", "8.0", "5.6"],
         ["Procedure room: scrub and clinical services", "7.0", "4.9"],
         ["Signage and wayfinding", "7.0", "4.9"],
         ["Mechanical fresh air and extract", "6.0", "4.2"],
         ["Plumbing: clinical hand-wash, condensate", "6.0", "4.2"],
         ["Doors and ironmongery", "5.0", "3.5"],
         ["Medical waste holding and route", "3.0", "2.1"],
         ["FF&E: consulting rooms, reception, waiting, lounge", "30.0", "21.0"],
         ["External: car park, lighting, drainage, gate house", "10.0", "7.0"],
         ["Water: treatment, storage, pressure, hot water", "5.0", "3.5"],
         ["Design, project management and approvals", "14.0", "9.8"],
         ["Contingency at 12%", "25.0", "17.5"],
         ["Building fit-out", "232.0", "162.4"]],
        ["Package", "As costed", "At 70%"], [321, 73, 73], total_row=True))
    el.append(Spacer(1, 3))
    el.append(Paragraph("Theatre suite, NGN 120M", H2))
    el.append(tbl(
        [["Ventilation: AHU, HEPA, ductwork, external plant", "32.0", "22.4", "Equipment"],
         ["Theatre lighting, pendant, operating table", "32.0", "22.4", "Equipment"],
         ["Anaesthetic machine and full monitoring", "20.0", "14.0", "Equipment"],
         ["Scrub, sterile store and dirty utility fit-out", "15.0", "10.5", "Builder's work"],
         ["Isolated power supply panel and UPS", "11.0", "7.7", "Equipment"],
         ["Recovery, two monitored stations", "10.0", "7.0", "Equipment"],
         ["Theatre suite", "120.0", "84.0", ""]],
        ["Package", "As costed", "At 70%", "Nature"], [235, 66, 66, 100], total_row=True))
    el.append(PageBreak())

    # 06 OPERATING COSTS
    sec(el, "06", "OPERATING COSTS", "NGN 312M a year at stabilisation.")
    el.append(tbl(
        [["Reimbursed on-site payroll: front office, nursing, records", "45.0", "3.75"],
         ["Family practice: two physicians, nurse, administration", "45.0", "3.75"],
         ["Power", "28.0", "2.33"],
         ["Theatre running: scrub nurse, operating department practitioner, consumables", "18.0", "1.50"],
         ["Security, cleaning, waste, insurance, internet", "15.0", "1.25"],
         ["Maintenance and biomedical", "8.0", "0.67"],
         ["Campus marketing and concierge", "8.0", "0.67"],
         ["Operating costs", "167.0", "13.92"],
         ["Mezo Health management fee, 6% of revenue plus incentive, capped at 10%", "51.7", "4.31"],
         ["Head rent", "55.0", "4.58"],
         ["Amortisation of fit-out and power over ten years", "38.5", "3.21"],
         ["Total", "312.2", "26.02"]],
        ["Cost", "NGN M a year", "NGN M a month"], [307, 80, 80], total_row=True, sub={7}))
    el.append(Spacer(1, 3))
    el.append(Paragraph(
        "<b>All figures are annual, with the monthly equivalent alongside. The campus runs at about "
        "NGN 26M a month at stabilisation</b>, of which NGN 14M is operating cost, NGN 4.6M is rent, "
        "NGN 4.3M is the management fee and NGN 3.2M is amortisation rather than cash. On the reduced "
        "fit-out the amortisation falls to NGN 2.3M a month.", P))
    el.append(Spacer(1, 3))
    el.append(Paragraph(
        "Mezo Health manages the campus. The fee is 6% of campus revenue plus 10% of gross operating "
        "profit above a threshold, capped at 10% of revenue, so it rises only when the campus "
        "performs. On-site operating staff are engaged by Mezo and reimbursed at cost.", P))

    # 07 FINANCIALS
    sec(el, "07", "FINANCIALS", "Three cases, at stabilisation.")
    el.append(tbl(
        [["Members, all tiers", "19", "31", "42"],
         ["Panel specialists", "30", "45", "55"],
         ["Family practice members", "100", "150", "200"],
         ["Sessional blocks sold", "1,550", "2,855", "4,288"],
         ["Room fill", "28%", "52%", "78%"],
         ["Membership and panel fees", "49.2", "81.6", "109.6"],
         ["Sessions", "133.5", "241.4", "361.2"],
         ["Treatment room", "29.8", "29.8", "29.8"],
         ["Day-case theatre", "62.1", "103.5", "132.5"],
         ["Family practice packages", "85.0", "127.5", "170.0"],
         ["Campus revenue", "359.6", "583.8", "803.1"],
         ["Operating costs", "(167.0)", "(167.0)", "(167.0)"],
         ["Mezo management fee", "(21.6)", "(51.7)", "(80.3)"],
         ["Head rent", "(55.0)", "(55.0)", "(55.0)"],
         ["Amortisation", "(38.5)", "(38.5)", "(38.5)"],
         ["Campus contribution", "77.5", "271.6", "462.3"],
         ["Diagnostics and pharmacy, net of staff", "20.4", "84.4", "153.9"],
         ["Total to Medbury", "98.0", "356.0", "616.2"]],
        ["NGN M a year, stabilised", "Low", "Base", "High"],
        [239, 76, 76, 76], total_row=True, sub={5, 10, 11, 16}, hi={10, 15}))
    el.append(Spacer(1, 4))
    el.append(tbl(
        [["Capital, as costed", "647", "647", "647"],
         ["Payback from stabilisation", "6.6 yrs", "1.8 yrs", "1.1 yrs"],
         ["Capital, reduced fit-out", "526", "526", "526"],
         ["Payback from stabilisation", "5.1 yrs", "1.4 yrs", "0.8 yrs"],
         ["Break-even, share of campus revenue", "76%", "52%", "41%"]],
        ["", "Low", "Base", "High"], [239, 76, 76, 76], hi={2, 3}))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>The high case runs the sessional pool at 78% fill, which is at the practical ceiling for "
        "a booked facility.</b> Cancellations, band preferences and no-shows mean a diary cannot be "
        "held much above three quarters full. Treat the high case as the top of what the building "
        "can physically deliver rather than as a stretch target, and note that further growth "
        "requires more rooms rather than more effort.", bg=ALERT, rule=RUST))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "The conversion clinic licence is excluded from all three cases. If it proceeds it adds "
        "approximately NGN 60M a year for the two ground-floor rooms and campus services, and it is "
        "the only contracted lease line in the model.", P))

    # 08 RAMP
    sec(el, "08", "THE RAMP", "What Medbury carries before the campus carries itself.")
    el.append(Paragraph(
        "Every figure above is at stabilisation. Getting there takes 24 months from opening, and the "
        "campus loses money for part of that. This is what has to be funded in the meantime.", LEDE))
    el.append(tbl(
        [["Pre-opening", "-", "-", "25.0", "(25.0)", "(25.0)"],
         ["Q1", "15%", "21.9", "38.4", "(16.5)", "(41.5)"],
         ["Q2", "25%", "36.5", "39.8", "(3.3)", "(44.8)"],
         ["Q3", "40%", "58.4", "41.7", "16.6", "(28.2)"],
         ["Q4", "55%", "80.3", "46.5", "33.7", "5.6"],
         ["Q5", "70%", "102.2", "48.5", "53.6", "59.2"],
         ["Q6", "82%", "119.7", "48.1", "71.6", "130.8"],
         ["Q7", "92%", "134.3", "49.4", "84.8", "215.6"],
         ["Q8", "100%", "145.9", "50.5", "95.4", "311.0"]],
        ["Quarter from opening", "Ramp", "Cash in", "Cash out", "Net", "Cumulative"],
        [116, 52, 66, 66, 66, 76], hi={2, 3}))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>The campus turns cash positive in month 9 and repays the whole ramp by month 12.</b> The "
        "deepest point is <b>NGN 45M</b> at the end of Q2, against the NGN 95M of working capital in "
        "the capital plan. Two things make that possible: rent is prepaid two years, so no rent cash "
        "leaves during the ramp; and NGN 209M of the NGN 584M stabilised revenue is memberships and "
        "family practice packages, which are annual and paid up front, so the money arrives ahead of "
        "the use it pays for.", bg=PANEL))
    el.append(Spacer(1, 4))
    el.append(Paragraph("If the ramp disappoints", H2))
    el.append(tbl(
        [["Brisk, 100% by month 24", "45", "72", "Month 9"],
         ["Slow, 82% by month 24", "71", "116", "Month 12 to 15"],
         ["Very slow, 66% by month 24", "93", "150", "Month 15 to 18"]],
        ["Ramp speed", "Funding, rent prepaid", "Funding, rent monthly", "Cash break-even"],
        [148, 106, 106, 107], hi={2}))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>The NGN 95M provision holds in every case except one: a very slow ramp combined with "
        "rent not prepaid, which needs NGN 150M.</b> Those two are linked, and that is the useful "
        "part. A landlord who will not take two years up front is the same landlord who will not "
        "give five plus five, and without five plus five the project should not proceed at all. The "
        "lease negotiation therefore protects the ramp as well as the amortisation.",
        bg=ALERT, rule=RUST))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "Cash out during the ramp excludes rent, which is prepaid, and amortisation, which is not "
        "cash. Marketing runs at double the stabilised rate until the campus reaches 80% of base "
        "case, because demand has to be built before it can be served.", SMALL))
    el.append(PageBreak())

    # 09 CONDITIONS
    sec(el, "09", "CONDITIONS", "In order of when they bind.")
    el.append(tbl(
        [["1", "Head lease extended to five plus five",
          "NGN 352M of fit-out amortised over two years does not work. Over five plus five it is "
          "comfortable. Nothing else should be committed until this lands"],
         ["2", "Change of use approval, and the landlord's written consent",
          "Before the NGN 115M of rent and fees is paid"],
         ["3", "A quantity surveyor's take-off",
          "The fit-out is built up by package at Nigerian clinical rates. It is the largest line in "
          "the project and needs measuring before commitment"],
         ["4", "Consultant demand evidenced",
          "Membership and fill assumptions carry most of the revenue. A survey is in the field and "
          "forty responses will settle them"],
         ["5", "Theatre registration and NNRA licence",
          "Facility registration to reflect surgical and sedation capability, and a radiation "
          "licence before imaging installs"],
         ["6", "A written transfer agreement",
          "With a hospital holding theatre and intensive care capability, for the case that "
          "deteriorates. A licensing expectation and an insurance condition"]],
        ["", "Condition", "Why"], [18, 158, 291], aligns=["l", "l"], hi={0}))
    el.append(Spacer(1, 6))
    el.append(card(
        "<b>Debo Odulana</b> &nbsp; Consult for Africa &nbsp; / &nbsp; +234 913 813 8553 &nbsp; / "
        "&nbsp; hello@consultforafrica.com", bg=NAVY, fg=white))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "Room areas are measured from the as-built drawings and are to be confirmed against the CAD. "
        "Fit-out is built up by package and requires a quantity surveyor's take-off. Session rates "
        "are derived from comparable Lagos practice. Membership uptake, room fill and family "
        "practice panel size are assumptions the consultant survey is designed to test. Not a "
        "binding offer, and not legal or tax advice. FX reference USD/NGN 1,550.", SMALL))

    doc.build(el)
    print("wrote %s" % OUT)


if __name__ == "__main__":
    build()
