"""
Build the Lyfe Place Abuja business case PDF.

One consolidated document for Dr Itunu Akinware. Supersedes the position note
and the product note.

Structured MECE on a single axis, asset to risk. Each section answers a question
no other section answers:

  01 THE ASSET       what we have        four structures, room by room
  02 THE OFFER       what we sell        product lines and their prices together
  03 THE MARKET      who buys it         demand required, evidenced and not
  04 THE OPERATOR    who runs it         Mezo, the fee, the responsibility split
  05 THE INVESTMENT  what goes in        capital, both fit-out cases
  06 THE RETURN      what comes out      revenue, costs, contribution in one place
  07 THE PATH        how we get there    ramp, funding, cash break-even
  08 THE RISKS       what could stop it  risks and conditions precedent

Client-facing. No process commentary and no revision history.

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
    t = Table(data, colWidths=widths, repeatRows=1)
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

    # ---------------- SUMMARY ----------------
    el.append(Paragraph("SUMMARY", EYEBROW))
    el.append(Paragraph("A private ambulatory medical campus.", H1))
    el.append(Paragraph(
        "A four-structure residential compound in Abuja converted into a medical park under "
        "Medbury's Medical Infrastructure Division. Senior specialists hold sessions there without "
        "taking a lease. Families buy bundled care. Aesthetic and day-case surgery anchors the "
        "identity. A laboratory, imaging and a pharmacy sit on site, so a patient is consulted, "
        "worked up, treated and dispensed to in a single visit and goes home the same day.", LEDE))
    el.append(tbl(
        [["Asset", "711 sqm gross across four structures, 519 sqm of usable rooms"],
         ["Capacity", "5 sessional consulting rooms, a day-case theatre, a treatment room, a hair "
          "transplant suite, three imaging modalities, a laboratory and a pharmacy"],
         ["Investment", "NGN 647M as costed, NGN 526M on a reduced fit-out"],
         ["Return", "NGN 517M campus revenue and NGN 273M a year to Medbury at stabilisation"],
         ["Payback", "2.4 years from stabilisation, 1.9 on the reduced fit-out"],
         ["Ramp funding", "NGN 45M at its deepest, cash positive in month 9"]],
        ["", ""], [104, 363], aligns=["l"], hi={5}))

    # ---------------- 01 THE ASSET ----------------
    sec(el, "01", "THE ASSET", "What we have.")
    el.append(tbl(
        [["Main building, ground", "286", "182", "Arrival, theatre suite, conversion clinic, imaging"],
         ["Main building, first", "277", "239", "The consulting plaza, hair transplant, treatment room"],
         ["Guest chalet", "96", "61", "Laboratory and specimen handling"],
         ["Boys' quarters", "52", "37", "Pharmacy: dispensary, retail, controlled drugs, cold chain"],
         ["Campus", "711", "519", "73% of gross is usable room"]],
        ["Structure", "Gross sqm", "Rooms sqm", "Use"],
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
         ["Sterilising, linen, WC, terrace", "32.6", "Common", ""]],
        ["Room", "sqm", "Zone", "Note"], [148, 40, 82, 197], sub={4, 6, 8}))
    el.append(Spacer(1, 3))
    el.append(card(
        "<b>Five rooms make up the sessional pool</b>, once the theatre, the conversion clinic, the "
        "family practice and the anchor have their space. At four bands a day over six days that is "
        "5,520 half-day blocks a year, and it is the ceiling on how much the campus can let.",
        bg=PANEL))

    # ---------------- 02 THE OFFER ----------------
    sec(el, "02", "THE OFFER", "What we sell.")
    el.append(tbl(
        [["Panel and membership", "Specialists", "Access to rooms and an address without a lease",
          "Fees and sessions"],
         ["Family practice", "Families and corporates", "Bundled annual care with quarterbacked "
          "referral into the panel", "Packages"],
         ["Day case and aesthetics", "Cash-pay patients", "Aesthetic medicine and surgery, "
          "dermatology, hair transplant", "Theatre and suite fees"],
         ["Conversion clinic", "Alameda", "Two ground-floor rooms and campus services", "Licence"],
         ["Diagnostics and pharmacy", "All of the above", "Laboratory, imaging, dispensing, retail",
          "Per test, per script"]],
        ["Line", "Sold to", "What it is", "Revenue"],
        [104, 84, 210, 69], aligns=["l", "l", "l"], hi={1}))
    el.append(Spacer(1, 3))
    el.append(Paragraph(
        "The family practice is what makes the rest work. A panel of specialists with no patients is "
        "an empty building. Bundled care generates first contact, refers into the panel, and drives "
        "diagnostics and pharmacy volume. It is the only line the campus controls end to end.", P))
    el.append(Spacer(1, 4))
    el.append(Paragraph("Sessions", H2))
    el.append(tbl(
        [["Early, 07:00 to 09:00", "2 hours", "44,000", "66,000"],
         ["Morning, 09:00 to 13:00", "4 hours", "61,000", "91,500"],
         ["Afternoon, 13:00 to 17:00", "4 hours", "61,000", "91,500"],
         ["Evening, 17:00 to 21:00", "4 hours", "94,000", "141,000"],
         ["Treatment room", "per session", "180,000", "270,000"],
         ["Day-case theatre", "per half-day list", "750,000", "1,125,000"]],
        ["Band", "Length", "Member", "Panel or guest"], [163, 92, 106, 106], hi={5}))
    el.append(Spacer(1, 2))
    el.append(Paragraph("Anaesthetist fees are billed through to the operating clinician with a "
                        "coordination margin, not carried by the campus.", SMALL))
    el.append(Spacer(1, 4))
    el.append(Paragraph("Membership ladder", H2))
    el.append(tbl(
        [["Panel", "200,000", "400,000", "Guest rates", "Credentialing, directory listing, "
          "booking access"],
         ["Associate", "600,000", "1,200,000", "20% off guest", "Pays for itself at 0.8 sessions "
          "a week"],
         ["Full", "1,500,000", "2,400,000", "35% off guest", "Priority booking, named room "
          "preference, lounge"],
         ["Fellow", "2,500,000", "4,200,000", "35% off guest", "A standing weekly slot, directory "
          "prominence, inclusion in campus marketing"],
         ["Group", "1,200,000 each", "2,000,000 each", "35% off guest", "Three or more from one "
          "practice. Shared named room, pooled blocks, one invoice"],
         ["Partnership", "Revenue share", "Revenue share", "n/a", "For anchor lines. The campus "
          "provides room, equipment and marketing, the clinician provides the practice"]],
        ["Tier", "Launch", "Mature", "Session rate", "What it buys"],
        [66, 74, 74, 70, 183], aligns=["r", "r", "l", "l"], hi={5}))
    el.append(Spacer(1, 3))
    el.append(card(
        "<b>Launch rates run for the first two years and are held for three years for anyone who "
        "joins in year one.</b> That is the reason to join early, and it costs less than an empty "
        "diary costs. Mature rates apply to everyone joining from year three, at which point the "
        "address is established and the ladder pays for itself on usage: Associate at 0.8 sessions "
        "a week, Full at 1.2, Fellow at 2.2.", bg=PANEL))
    el.append(Spacer(1, 4))
    el.append(Paragraph("Family practice packages", H2))
    el.append(tbl(
        [["Individual", "600,000", "Unlimited GP access, annual screen, vaccinations, chronic "
          "disease management, quarterbacked referral"],
         ["Family, up to four", "1,500,000", "As above for the household, with paediatric cover"],
         ["Corporate, per head", "400,000", "Executive screen, occupational health, priority access"]],
        ["Package", "NGN a year", "What is included"], [116, 74, 277], aligns=["r", "l"]))
    el.append(PageBreak())

    # ---------------- 03 THE MARKET ----------------
    sec(el, "03", "THE MARKET", "Who buys it, and what is evidenced.")
    el.append(Paragraph(
        "The base case requires the following. Each is stated so it can be checked rather than "
        "assumed.", LEDE))
    el.append(tbl(
        [["25 members across the tiers", "Specialists committing annually", "Not yet evidenced",
          "Survey in the field"],
         ["35 panel specialists", "Credentialed, booking at guest rates", "Not yet evidenced",
          "Survey in the field"],
         ["41% room fill", "2,270 half-day blocks sold a year", "Borrowed from comparable Lagos "
          "practice", "Survey in the field"],
         ["150 family practice members", "Households and corporate heads", "Not yet evidenced",
          "Needs its own panel model"],
         ["25% theatre fill", "138 half-day lists a year", "Judgement for a new day-case theatre",
          "Anchor clinician discussions"],
         ["13,300 patient contacts", "Across all lines, about 53 arrivals a day", "Within the "
          "single-reception ceiling of 98", "Arithmetic, not assumption"]],
        ["What the base case needs", "Meaning", "Status", "How it gets settled"],
        [122, 122, 116, 107], aligns=["l", "l", "l"], hi={5}))
    el.append(Spacer(1, 4))
    el.append(Paragraph("How large the pool actually is", H2))
    el.append(tbl(
        [["Consultants in the FCT with meaningful private practice", "300 to 600"],
         ["In specialties an ambulatory plaza suits, needing no theatre or beds", "x 60%"],
         ["Who would pay for a private address rather than use hospital rooms", "x 15 to 25%"],
         ["Addressable", "36 to 72"],
         ["Converted within two years at 30% to 50%", "12 to 36"]],
        ["Sizing the specialist market", "Count"], [383, 84], total_row=True, hi={3}))
    el.append(Spacer(1, 3))
    el.append(Paragraph(
        "The base case needs 60 names in total, 25 of them paying members. That sits inside the "
        "addressable pool rather than consuming it, and the low case at 32 names is comfortably "
        "within two years of ordinary conversion.", P))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>Membership uptake and room fill together carry most of the revenue, and neither is yet "
        "evidenced.</b> A survey is in the field with Abuja consultants testing session demand by "
        "time band, willingness to pay, and membership pricing. Forty responses will settle both. "
        "Nothing else in the plan is cheaper to test or more consequential if wrong.", bg=ALERT,
        rule=RUST))

    # ---------------- 04 THE OPERATOR ----------------
    sec(el, "04", "THE OPERATOR", "Who runs it.")
    el.append(tbl(
        [["Medbury Healthcare", "Owner", "Holds the head lease, the fit-out and the campus. Owns "
          "the diagnostics and pharmacy businesses. Carries the capital and the operating cost"],
         ["Mezo Health", "Manager", "Runs the campus day to day: bookings, front office, patient "
          "navigation, billing and collection, tenant relations, compliance and reporting"],
         ["Consult for Africa", "Delivery", "Diagnostics phase, interior design and fit-out "
          "delivery. Hands over to Mezo at practical completion"]],
        ["Party", "Role", "Scope"], [116, 62, 289], aligns=["l", "l"]))
    el.append(Spacer(1, 4))
    el.append(tbl(
        [["Base fee", "6% of campus revenue", "Paid monthly"],
         ["Incentive", "10% of gross operating profit above a threshold", "Rises only when the "
          "campus performs"],
         ["Cap", "10% of campus revenue combined", "Protects the owner if profit runs ahead of "
          "revenue"],
         ["On-site staff", "Engaged by Mezo, reimbursed at cost", "Front office, nursing, records"],
         ["At base case", "NGN 51.7M a year", "8.9% of campus revenue"]],
        ["Management fee", "Basis", "Note"], [116, 176, 175], aligns=["l", "l"], hi={4}))

    # ---------------- 05 THE INVESTMENT ----------------
    sec(el, "05", "THE INVESTMENT", "What goes in.")
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
    el.append(Paragraph("Release it in two phases", H2))
    el.append(Paragraph(
        "Fit-out and power amortise over ten years. The campus is expected to hold the building well "
        "beyond the initial term, and equipment can move to another balance sheet within the group "
        "if it does not. Phasing the release is about capital efficiency rather than accounting: "
        "there is no reason to expose the whole sum before the campus is trading.", P))
    el.append(tbl(
        [["Phase 1, on the two-year certainty already agreed", "470",
          "Rent, fees, working capital, power, the diagnostics and pharmacy units, and enough "
          "building fit-out to open and trade"],
         ["Phase 2, released once a longer term is documented", "177",
          "The balance of the building fit-out, and the whole theatre suite"],
         ["Total", "647", "Unchanged. What changes is when NGN 177M is exposed"]],
        ["Phase", "NGN M", "What it covers"], [186, 56, 225],
        total_row=True, aligns=["r", "l"], hi={0}))
    el.append(Spacer(1, 3))
    el.append(card(
        "<b>Phase 1 trades on its own.</b> Without the theatre it earns NGN 414M of campus revenue "
        "and returns NGN 205M a year on NGN 470M, a 2.3 year payback. The theatre carries the least "
        "certain demand on the campus, so it is the natural thing to hold until the surgical anchor "
        "is signed rather than built on expectation.", bg=PANEL))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>The second column carries every fit-out line at 30% below the costed figure.</b> It is a "
        "reasonable target on builder's work, finishes and sourced furniture, which are about 46% of "
        "the building package. It is far less likely on the theatre, which is <b>88% equipment</b>: "
        "an air handling unit, an anaesthetic machine and an isolated power panel have hard prices "
        "and do not negotiate down by a third.", bg=PANEL))
    # No page break here. The capital tables ran to a little over half a page and left the
    # rest of it empty; letting the fit-out schedule flow on fills it. Tables carry their
    # header row across the split, see repeatRows in tbl().
    el.append(Spacer(1, 4))
    el.append(Paragraph("Building fit-out", H2))
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
    el.append(Paragraph("Theatre suite", H2))
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

    # ---------------- 06 THE RETURN ----------------
    sec(el, "06", "THE RETURN", "What comes out, at stabilisation.")
    el.append(tbl(
        [["Members, paying tiers", "12", "25", "35"],
         ["Panel specialists", "20", "35", "45"],
         ["Family practice members", "100", "150", "200"],
         ["Sessional blocks sold", "1,130", "2,270", "3,150"],
         ["Room fill", "20%", "41%", "57%"],
         ["Membership and panel fees", "31.4", "65.0", "91.8"],
         ["Sessions", "97.2", "191.4", "262.5"],
         ["Treatment room", "29.8", "29.8", "29.8"],
         ["Day-case theatre", "nil", "103.5", "132.5"],
         ["Family practice packages", "85.0", "127.5", "170.0"],
         ["Campus revenue", "243.4", "517.2", "686.6"],
         ["Payroll, front office, nursing, records", "(32.0)", "(45.0)", "(45.0)"],
         ["Family practice: physicians, nurse, administration", "(28.0)", "(45.0)", "(45.0)"],
         ["Power", "(24.0)", "(28.0)", "(28.0)"],
         ["Theatre running: scrub, ODP, consumables", "nil", "(18.0)", "(18.0)"],
         ["Security, cleaning, waste, insurance, internet", "(14.0)", "(15.0)", "(15.0)"],
         ["Maintenance, biomedical, marketing, concierge", "(16.0)", "(16.0)", "(16.0)"],
         ["Mezo management fee", "(14.6)", "(41.1)", "(68.2)"],
         ["Head rent", "(55.0)", "(55.0)", "(55.0)"],
         ["Amortisation over ten years", "(20.8)", "(38.5)", "(38.5)"],
         ["Campus contribution", "39.0", "215.7", "357.9"],
         ["Diagnostics and pharmacy, net of staff", "19.6", "57.4", "101.4"],
         ["Total to Medbury", "58.6", "273.1", "459.4"]],
        ["NGN M a year, stabilised", "Low", "Base", "High"],
        [239, 76, 76, 76], total_row=True, sub={5, 10, 11, 20, 21}, hi={10, 20}))
    el.append(Spacer(1, 3))
    el.append(Paragraph(
        "Costs total NGN 301.6M a year at the base case, which is NGN 25.1M a month. Of that, "
        "NGN 13.9M is operating cost, NGN 4.6M rent, NGN 3.4M the management fee and NGN 3.2M "
        "amortisation, which is not cash.", P))
    el.append(Spacer(1, 3))
    el.append(tbl(
        [["Capital committed", "470", "647", "647"],
         ["Payback from stabilisation", "8.0 yrs", "2.4 yrs", "1.4 yrs"],
         ["On the reduced fit-out", "372", "526", "526"],
         ["Payback from stabilisation", "6.3 yrs", "1.9 yrs", "1.1 yrs"],
         ["Break-even, share of campus revenue", "84%", "58%", "48%"]],
        ["", "Low", "Base", "High"], [239, 76, 76, 76], hi={2, 3}))
    el.append(Spacer(1, 3))
    el.append(card(
        "<b>The low case is Phase 1 only.</b> A campus that recruits slowly does not release Phase 2, "
        "so there is no theatre to build, to run, or to amortise, and the capital at risk is NGN 470M "
        "rather than NGN 647M. Costs flex with it: a quieter campus runs fewer front-office shifts "
        "and one family physician rather than two, and the laboratory is not staffed for volume that "
        "has not arrived. Marketing is the one line that holds, because a slow start is exactly when "
        "it is needed.", bg=PANEL))
    el.append(Spacer(1, 3))
    el.append(Paragraph(
        "The conversion clinic licence is excluded from all three cases. If it proceeds it adds "
        "approximately NGN 60M a year and is the only contracted lease line in the model.", P))
    el.append(PageBreak())

    # ---------------- 07 THE PATH ----------------
    sec(el, "07", "THE PATH", "How we get there, and what it costs to.")
    el.append(Paragraph(
        "Stabilisation is 24 months from opening. The campus loses money for part of that, and this "
        "is what has to be funded in the meantime.", LEDE))
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
        [116, 52, 66, 66, 66, 76], hi={2, 4}))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>The campus turns cash positive in month 9 and repays the whole ramp by month 12.</b> The "
        "deepest point is <b>NGN 45M</b>, against NGN 95M of working capital. Two things make that "
        "work. <b>The two years of rent paid in advance cover the entire 24-month ramp</b>, so no "
        "rent cash leaves the business before stabilisation. And NGN 209M of the NGN 584M stabilised "
        "revenue is memberships and family practice packages, which are annual and collected up "
        "front, so the money arrives ahead of the use it pays for.", bg=PANEL))
    el.append(Spacer(1, 4))
    el.append(Paragraph("If the ramp disappoints", H2))
    el.append(tbl(
        [["Brisk, 100% by month 24", "45", "Month 9", "Comfortable"],
         ["Slow, 82% by month 24", "71", "Month 12", "Inside the provision"],
         ["Very slow, 66% by month 24", "93", "Month 15", "Inside, but almost no headroom"]],
        ["Ramp speed", "Funding needed, NGN M", "Cash break-even", "Against NGN 95M provision"],
        [136, 106, 90, 135], hi={2}))
    el.append(Spacer(1, 4))
    el.append(Paragraph("Term and payment are different questions", H2))
    el.append(Paragraph(
        "Two years is what has been discussed and what the agreement is drawn up on. A five-year "
        "term is a fresh conversation to be raised, and for now the sensible step is to communicate "
        "the intent and obtain verbal approval rather than to reopen a settled document. Medbury "
        "does not need to, and should not, prepay five years in any case. <b>The term drives the "
        "amortisation; the payment schedule is a separate matter.</b> Two years up front and "
        "annually thereafter is the right shape, whatever term is eventually agreed.", P))
    el.append(Spacer(1, 3))
    el.append(card(
        "<b>One event to plan for: rent becomes a cash cost for the first time in month 25.</b> The "
        "prepayment runs out exactly as the ramp ends. At stabilisation the campus generates about "
        "NGN 95M a quarter net, so NGN 13.75M of quarterly rent is absorbed comfortably, but it is a "
        "step and it should not arrive as a surprise.", bg=ALERT, rule=RUST))
    el.append(Spacer(1, 3))
    el.append(Paragraph(
        "Cash out during the ramp excludes rent, which is prepaid, and amortisation, which is not "
        "cash. Marketing runs at double the stabilised rate until the campus reaches 80% of base "
        "case, because demand has to be built before it can be served.", SMALL))
    el.append(PageBreak())

    # ---------------- 08 THE RISKS ----------------
    sec(el, "08", "THE RISKS", "What could stop it.")
    el.append(tbl(
        [["Demand", "High", "Membership uptake and room fill carry most of the revenue and neither "
          "is evidenced", "Survey in the field. Ten founding members signed before fit-out "
          "completes would settle a quarter of it"],
         ["Cost", "Medium", "Fit-out is the largest line and has not been measured",
          "Quantity surveyor's take-off before commitment. The reduced column shows the downside "
          "is manageable"],
         ["Concentration", "Medium", "The evening band and memberships together are a large share "
          "of revenue and rest on the same proposition", "If the survey finds evening demand thin, "
          "both fail together. Test them as one question, not two"],
         ["Capacity", "Medium", "The building caps at about 78% fill and 98 arrivals a day",
          "Growth beyond the high case needs more rooms, not more effort. Plan the second site "
          "rather than over-promise this one"],
         ["Regulatory", "Medium", "Theatre registration, radiation licence, practitioner "
          "credentialing", "All are process rather than obstacle, but each has a lead time and none "
          "can be compressed"],
         ["Key clinician", "Medium", "The anchor lines depend on named individuals",
          "Partnership terms rather than session lets, so the clinician is invested in the campus "
          "rather than renting from it"],
         ["Lease term", "Medium", "The agreement drawn up is for two years and a longer term has "
          "yet to be raised", "Communicate the intent early and secure verbal approval. Phase the "
          "capital so the larger commitments follow the conversation"]],
        ["Risk", "Level", "What it is", "What reduces it"],
        [76, 46, 172, 173], aligns=["l", "l", "l"], hi={0}))
    el.append(Spacer(1, 5))
    el.append(Paragraph("Conditions precedent, in the order they bind", H2))
    el.append(tbl(
        [["1", "Pay the two years as agreed, on time",
          "The agreement is drawn up and the terms are settled. Prompt payment is also what earns "
          "the standing to ask for anything further: a longer term cannot be negotiated from behind "
          "on rent"],
         ["2", "Raise the five-year intent and obtain verbal approval",
          "A fresh conversation, not a variation of what is signed. Verbal comfort is enough to "
          "proceed with Phase 1. It must be documented before Phase 2 capital is released"],
         ["3", "Change of use approval and the landlord's written consent",
          "Before the NGN 115M of rent and fees is paid"],
         ["4", "Consultant demand evidenced",
          "Forty survey responses, or ten founding members signed"],
         ["5", "Facility registration and radiation licence",
          "Registration to reflect surgical and sedation capability. NNRA licence before imaging "
          "installs"],
         ["6", "A written transfer agreement",
          "With a hospital holding theatre and intensive care capability. A licensing expectation "
          "and an insurance condition"]],
        ["", "Condition", "Why"], [18, 176, 273], aligns=["l", "l"], hi={0}))
    el.append(Spacer(1, 6))
    el.append(card(
        "<b>Debo Odulana</b> &nbsp; Consult for Africa &nbsp; / &nbsp; +234 913 813 8553 &nbsp; / "
        "&nbsp; hello@consultforafrica.com", bg=NAVY, fg=white))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "Room areas are measured from the as-built drawings and are to be confirmed against the CAD. "
        "Fit-out is built up by package. Session rates "
        "are derived from comparable Lagos practice. Membership uptake, room fill and family "
        "practice panel size are assumptions the consultant survey is designed to test. Not a "
        "binding offer, and not legal or tax advice. FX reference USD/NGN 1,550.", SMALL))

    doc.build(el)
    print("wrote %s" % OUT)


if __name__ == "__main__":
    build()
