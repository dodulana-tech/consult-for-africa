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
         ["Capital", "NGN 647M, including two years of rent in advance"],
         ["Revenue at stabilisation", "NGN 584M campus revenue, base case"],
         ["Return", "NGN 356M a year to Medbury, payback 1.8 years from stabilisation"]],
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
        [["Head rent, two years in advance", "100.0"],
         ["Agency, legal and caution deposit at 15%", "15.0"],
         ["Building fit-out", "232.0"],
         ["Theatre suite", "120.0"],
         ["Power, 25KVA hybrid solar", "33.0"],
         ["Medbury Diagnostics unit", "28.0"],
         ["Medbury Pharmaceuticals unit", "24.0"],
         ["Working capital, six months", "95.0"],
         ["Total capital", "647.0"]],
        ["Capital, NGN M", "Amount"], [383, 84], total_row=True))
    el.append(Spacer(1, 4))
    el.append(Paragraph("Building fit-out, NGN 232M", H2))
    el.append(tbl(
        [["Cooling, about 28 split units and cassettes", "24.0"],
         ["ICT: cabling, network, CCTV, access control, emergency call, room status", "15.0"],
         ["Electrical: boards, solar and grid zoning, medical circuits, emergency lighting", "14.0"],
         ["Joinery: reception, nurse stations, room casework", "14.0"],
         ["Interior decoration: painting, window treatments, soft finishes", "12.0"],
         ["Fire: detection, alarm, escape lighting", "9.0"],
         ["Clinical flooring, welded and coved vinyl", "9.0"],
         ["Ceilings and lighting", "9.0"],
         ["Partitioning to form the consulting rooms", "8.0"],
         ["Procedure room: scrub and clinical services", "7.0"],
         ["Signage and wayfinding", "7.0"],
         ["Mechanical fresh air and extract", "6.0"],
         ["Plumbing: clinical hand-wash, condensate", "6.0"],
         ["Doors and ironmongery", "5.0"],
         ["Medical waste holding and route", "3.0"],
         ["FF&E: consulting rooms, reception, waiting, lounge", "30.0"],
         ["External: car park, lighting, drainage, gate house", "10.0"],
         ["Water: treatment, storage, pressure, hot water", "5.0"],
         ["Design, project management and approvals", "14.0"],
         ["Contingency at 12%", "25.0"],
         ["Building fit-out", "232.0"]],
        ["Package", "NGN M"], [383, 84], total_row=True))
    el.append(Spacer(1, 3))
    el.append(Paragraph("Theatre suite, NGN 120M", H2))
    el.append(tbl(
        [["Ventilation: AHU, HEPA, ductwork, external plant", "32.0"],
         ["Theatre lighting, pendant, operating table", "32.0"],
         ["Anaesthetic machine and full monitoring", "20.0"],
         ["Scrub, sterile store and dirty utility fit-out", "15.0"],
         ["Isolated power supply panel and UPS", "11.0"],
         ["Recovery, two monitored stations", "10.0"],
         ["Theatre suite", "120.0"]],
        ["Package", "NGN M"], [383, 84], total_row=True))
    el.append(PageBreak())

    # 06 OPERATING COSTS
    sec(el, "06", "OPERATING COSTS", "NGN 312M a year at stabilisation.")
    el.append(tbl(
        [["Reimbursed on-site payroll: front office, nursing, records", "45.0"],
         ["Family practice: two physicians, nurse, administration", "45.0"],
         ["Power", "28.0"],
         ["Theatre running: scrub nurse, operating department practitioner, consumables", "18.0"],
         ["Security, cleaning, waste, insurance, internet", "15.0"],
         ["Maintenance and biomedical", "8.0"],
         ["Campus marketing and concierge", "8.0"],
         ["Operating costs", "167.0"],
         ["Mezo Health management fee, 6% of revenue plus incentive, capped at 10%", "51.7"],
         ["Head rent", "55.0"],
         ["Amortisation of fit-out and power over ten years", "38.5"],
         ["Total", "312.2"]],
        ["Cost, NGN M a year", "Amount"], [383, 84], total_row=True, sub={7}))
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
        [["Capital", "647", "647", "647"],
         ["Payback from stabilisation", "6.6 yrs", "1.8 yrs", "1.1 yrs"],
         ["Break-even, share of campus revenue", "78%", "53%", "42%"]],
        ["", "Low", "Base", "High"], [239, 76, 76, 76]))
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

    # 08 CONDITIONS
    sec(el, "08", "CONDITIONS", "In order of when they bind.")
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
