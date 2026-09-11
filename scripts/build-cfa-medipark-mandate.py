"""
Build "Setting up and running Lyfe Place Abuja: CFA's commercial proposal" PDF.

THIS IS THE OPENING POSITION, NOT THE SETTLEMENT. Priced to be negotiated down.
The concession ladder, the floor and the answers to pushback live in the private
guide: docs/lyfeplace-abuja/cfa-medipark-pricing-guide-PRIVATE.md. Do not send
that one.

Two frames drive the whole document:

  1. VALUE CREATED, not cost recovery. The same building let by the session
     returns NGN 273M a year. Configured as a medipark and run by CFA it returns
     NGN 594M. CFA creates NGN 321M a year and is paid a share of it.
  2. LEAN CAPITAL. Itunu is keen but will not look at big capital numbers, so
     anything that can be leased, placed, consigned or deferred is. Cash to open
     falls from NGN 662M to NGN 213M; total exposure from NGN 897M to NGN 399M.
     Cost of leaning is NGN 51.5M a year of margin, stated honestly.

THE FEE DESIGN PROBLEM LEANING CREATES, AND THE FIX. A development fee struck as
a % of capital PUNISHES CFA for doing what she asked: 15% of 662 is 99.3, 15% of
213 is 31.9. So the fee is FIXED (NGN 90M) plus a CAPITAL EFFICIENCY SHARE (20%
of cash saved against an independently benchmarked budget, capped 50). That is
the only line where CFA's interest and hers are identical rather than compatible.

  A  Delivery       NGN 90M fixed. 25 on signature, 65 over 48 trading months.
  B  Efficiency     20% of capital saved vs the approved budget, capped 50.
  C  Establishment  NGN 22M per entity + NGN 6M on licence. 5.5 at kickoff,
                    balance over 36 trading months.
  D  Management     base 10% of campus-wide revenue, floor NGN 7M/mo in year one
                    and NGN 10M/mo thereafter, plus 15% of contribution above a
                    20% cash-on-cash hurdle. Indexed 12%. The 10% is DERIVED: it
                    is the rate at which the management service earns a normal
                    professional margin over CFA's NGN 105M cost to serve.
  E  Equity         15% of the campus operating company.

CFA's fee follows the same rule as the capital: only NGN 71M is payable before
trading, against NGN 235M charged conventionally. Keeps year one positive for
Medbury, which a heavier early load did not.

DELIBERATELY NOT OFFERED, because each is a concession to be traded:
subordination of the incentive, any cap on the combined fee, no-mark-up on
reimbursed staff, no-commission on media, a lower hurdle, a shorter term.

The CFA platforms (HospitlOS, CadreHealth, Maarova, DFC) are OUT of the fee stack
at Debo's instruction and sit in the appendix as an addendum to explore
separately. That also keeps "why am I paying for your software" out of the main
negotiation.

Output: docs/lyfeplace-abuja/cfa-medipark-mandate-cfa.pdf
House style matches the Lyfe Place family. Naira as NGN. No em dashes.

Run:
  python3 scripts/build-cfa-medipark-mandate.py
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
OUT = DOCS / "cfa-medipark-mandate-cfa.pdf"

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
           spaceBefore=6, spaceAfter=5, keepWithNext=True)
H2 = style("h2", fontName="Helvetica-Bold", fontSize=9.6, leading=12.5, textColor=TEAL,
           spaceBefore=7, spaceAfter=3, keepWithNext=True)
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
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 20, "Setup and management mandate")
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
    for i, r in enumerate(rows):
        assert len(r) == ncols, "row %d has %d cells, header has %d" % (i, len(r), ncols)
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
        title="Lyfe Place Abuja - setup and management mandate",
        author="Consult for Africa")
    doc.addPageTemplates([PageTemplate(
        id="p", frames=[Frame(MARGIN, 30, FULLW, PAGE_H - 42 - 30, id="f")], onPage=page_bg)])
    el = []

    el.append(Paragraph("Setting up and running Lyfe Place Abuja",
                        style("t", fontName="Helvetica-Bold", fontSize=19, leading=22,
                              textColor=NAVY, spaceAfter=2)))
    el.append(Paragraph("The mandate, the leanest way to fund it, and what Consult for Africa charges.",
                        style("st", fontName="Helvetica-Oblique", fontSize=11, leading=14,
                              textColor=GOLD, spaceAfter=7)))

    # ---------------- SUMMARY ----------------
    el.append(Paragraph("SUMMARY", EYEBROW))
    el.append(Paragraph("Open it for NGN 307M. Earn NGN 547M a year from it.", H1))
    el.append(Paragraph(
        "The same building, let room by room to consultants recruited one at a time, returns about "
        "NGN 273M a year and takes two and a half years to repay. Configured as a medipark, with "
        "Medbury's own clinical businesses moved into it and run as one platform, it returns "
        "<b>NGN 547M a year</b>. And it can be opened for a fraction of what a conventional build "
        "would cost, because almost everything that can be leased, placed, consigned or deferred "
        "should be.", LEDE))
    el.append(tbl(
        [["Cash to open the campus", "307", "Leased, deferred or carried by the business that owns it"],
         ["CFA mobilisation and entity kickoff", "71", "The rest of CFA's setup fee is paid from "
          "trading, or from the capital it saves"],
         ["Cash before trading", "354", "Against NGN 662M on a conventional build"],
         ["Rent and fees already paid", "115", "Two years in advance, already committed"],
         ["Total exposure before a naira of revenue", "469", "Against NGN 897M the conventional way"],
         ["Returns, before the management fee", "547", "A year, at stabilisation"],
         ["Capital back", "Year 2", "Against year 3 letting the same rooms by the session"]],
        ["", "NGN M", "Note"], [211, 56, 200], aligns=["r", "l"], hi={2, 4}))
    el.append(Spacer(1, 3))
    el.append(card(
        "<b>The principle running through this proposal is that capital should be spent last, not "
        "first.</b> Solar comes on a power purchase agreement rather than a purchase. The laboratory "
        "and the pharmacy are equipped and stocked by the Medbury businesses that own them, on their "
        "own budgets. The aesthetics unit opens injectables-led, which needs almost no equipment, and "
        "buys no laser until the volume justifies leasing one. The theatre waits for a signed "
        "surgical anchor. <b>CFA applies the same rule to its own fee: most of it is paid from "
        "trading rather than before it.</b>", bg=PANEL))

    # ---------------- 01 THE MANDATE ----------------
    sec(el, "01", "THE MANDATE", "What is actually being outsourced.")
    el.append(Paragraph(
        "This is not an advisory engagement with a delivery component. It is a build-and-operate "
        "mandate over an asset Medbury owns and has already begun funding. The distinction matters "
        "for pricing, because an adviser is paid for judgement and an operator is paid for outcome.", P))
    el.append(tbl(
        [["Set it up", "Design, fit-out, power, equipping, regulatory approvals, commissioning and "
          "handover of a 711 sqm four-structure campus, on the leanest capital that will carry it",
          "Delivery"],
         ["Stand the businesses up", "Structure, incorporate, licence, credential, write protocols, "
          "recruit and launch each anchor clinical entity", "Establishment"],
         ["Run the facility", "Front office, bookings, billing and collection, patient navigation, "
          "facilities, compliance, clinical governance and reporting", "Management"],
         ["Run the businesses", "Carry the P&amp;L of the anchor clinical entities: pricing, "
          "throughput, clinical staffing, procurement, margin", "Management"],
         ["Maximise the return", "The membership address, the family practice, the sessional letting "
          "business, the diagnostics and pharmacy attach", "Management"]],
        ["The job", "What it means here", "Priced as"],
        [98, 267, 102], aligns=["l", "l"], hi={3}))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>Four anchor clinical entities, plus the initiatives.</b> The anchors are the aesthetics "
        "and regenerative unit, the longevity and infusion unit, hair restoration, and the Alameda "
        "conversion clinic. The initiatives are the specialist membership address, the family "
        "practice, the sessional letting of the remaining rooms, and the diagnostics and pharmacy "
        "capture. <b>The anchors pay for the building. The initiatives are what make the return "
        "exceptional rather than adequate</b>, and they are the part that does not happen unless "
        "somebody is contracted to make it happen.", bg=PANEL))

    # ---------------- 02 THE VALUE ----------------
    sec(el, "02", "WHAT THE MANDATE CREATES", "The difference between two ways of using one building.")
    el.append(tbl(
        [["Rooms let by the session", "5", "3", "Three is enough once businesses occupy the rest"],
         ["Businesses in occupation", "nil", "6", "Each with its own P&amp;L, staff and patients"],
         ["Specialists to recruit before it works", "60", "25", "The businesses arrive already formed"],
         ["Time to stabilisation", "24 months", "12 to 15 months", "The ramp, not the rate card, "
          "decides when the money comes back"],
         ["Campus-wide revenue", "517", "1,697", "NGN M a year"],
         ["To Medbury before any fee", "253", "547", "NGN M a year, on the lean capital structure"],
         ["Cash to open", "647", "307", "NGN M"]],
        ["", "Let by the session", "As a medipark", "Note"],
        [138, 76, 76, 177], aligns=["r", "r", "l"], hi={5, 6}))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>NGN 321M a year of value that does not exist unless somebody builds it and runs it, on "
        "barely a quarter of the capital.</b> That is what this fee is a share of. A management fee "
        "benchmarked against what a facility manager costs to employ would be measuring the wrong "
        "thing: the campus does not need supervising, it needs to be brought into existence, filled "
        "with businesses that do not yet trade, and run as one platform. <b>CFA takes no share at all "
        "of the NGN 273M Medbury would have earned without it.</b>", bg=PANEL))
    el.append(Spacer(1, 4))
    el.append(Paragraph("Where the NGN 1,697M comes from", H2))
    el.append(tbl(
        [["Medlyfe Aesthetics and Regenerative", "2 rooms and theatre access", "475", "97", "51%"],
         ["Medlyfe Longevity and Infusion", "1 room, four infusion bays", "240", "71", "100%"],
         ["Lyfe Place Hair Restoration", "The FUE suite", "225", "56", "100%"],
         ["Medbury Diagnostics", "Laboratory, X-ray, ultrasound, echo", "145", "57", "100%"],
         ["Sessional panel and membership", "3 rooms", "142", "n/a", "100%"],
         ["Alameda Conversion Clinic SPV", "2 ground floor rooms", "132", "25", "49%"],
         ["Medbury Family Practice", "1 room", "128", "25", "100%"],
         ["Medbury Pharmaceuticals", "Boys' quarters and collection point", "120", "20", "100%"],
         ["Theatre lists, external", "The day-case theatre", "90", "n/a", "100%"],
         ["Campus-wide", "", "1,697", "", ""]],
        ["Business", "Where it sits", "Revenue", "EBITDA", "Medbury"],
        [148, 128, 62, 62, 60], total_row=True))
    el.append(Spacer(1, 3))
    el.append(Paragraph(
        "Each business is set out in full, with its service menu, capacity, staffing, price points "
        "and cost structure, in the companion medipark business plan.", SMALL))

    el.append(PageBreak())

    # ---------------- 03 THE SETUP COST ----------------
    sec(el, "03", "THE SETUP COST", "Every line, at the leanest specification that works.")
    el.append(Paragraph(
        "A conventional build of this scope costs about NGN 750M before a patient walks in. Almost "
        "none of that is necessary at the start. The rule applied to every line is simple: <b>if it "
        "can be leased, placed by a supplier, taken on consignment, paid monthly, or deferred until "
        "the revenue that justifies it exists, it is not bought with cash on day one.</b> What "
        "follows is the whole schedule at that specification. Nothing is rolled into a round number.",
        LEDE))
    el.append(tbl(
        [["A  Property and statutory", "", ""],
         ["Change of use approval and development control", "3.5", "One-off"],
         ["Facility registration, FCT health authority", "2.0", "One-off"],
         ["Fire safety certificate", "1.0", "One-off"],
         ["Environmental and clinical waste permit", "0.8", "One-off"],
         ["Signage permit", "0.4", "One-off"],
         ["B  Building works", "", ""],
         ["Partitioning to form the consulting rooms", "8.0", "Capital"],
         ["Joinery: reception desk, nurse stations, room casework", "8.0", "Capital"],
         ["Painting and decoration", "7.0", "Capital"],
         ["Enabling: strip out, minor structural, roof repairs", "6.0", "Capital"],
         ["External: car park, lighting, drainage, gate house", "6.0", "Capital"],
         ["Sanitary and plumbing, clinical hand-wash, condensate", "5.0", "Capital"],
         ["Ceilings", "4.0", "Capital"],
         ["Clinical flooring, welded and coved vinyl, clinical areas only", "4.0", "Capital"],
         ["Doors and ironmongery", "3.0", "Capital"],
         ["C  Building services", "", ""],
         ["Cooling, split units and cassettes", "16.0", "Capital"],
         ["ICT: cabling, network, CCTV, access control, emergency call", "11.0", "Capital"],
         ["Electrical: boards, zoning, medical circuits, emergency lighting", "10.0", "Capital"],
         ["Fire detection, alarm and escape lighting", "8.0", "Capital"],
         ["Mechanical fresh air and extract", "5.0", "Capital"],
         ["Power: changeover and distribution only, array on a PPA", "3.0", "Capital"],
         ["Water: treatment, storage, pressure, hot water", "3.0", "Capital"],
         ["Medical waste holding and route", "3.0", "Capital"],
         ["D  Furniture and fittings, non-clinical", "", ""],
         ["Consulting, treatment and infusion room furniture", "6.0", "Capital"],
         ["Reception, waiting and concierge", "5.0", "Capital"],
         ["Signage and wayfinding", "4.0", "Capital"],
         ["Doctors' and members' lounge", "3.0", "Capital"],
         ["Back of house, records, staff room", "2.0", "Capital"],
         ["E  Clinical equipment", "", ""],
         ["Bought at launch, scheduled item by item in section 04", "45.5", "Capital"],
         ["F  Technology and systems", "", ""],
         ["Workstations, printers, card readers, tablets", "6.0", "Capital"],
         ["Practice management and billing, implementation, on subscription", "2.5", "One-off"],
         ["Website and booking page", "1.5", "One-off"],
         ["Telephony and internet installation", "1.5", "Capital"],
         ["G  Professional and regulatory", "", ""],
         ["Legal: four incorporations, shareholder agreements, leases, supplier contracts",
          "8.0", "One-off"],
         ["Architectural and interior design", "5.0", "One-off"],
         ["M&amp;E consultant", "3.0", "One-off"],
         ["Clinician credentialing, MDCN and NMCN, practice licences", "3.0", "One-off"],
         ["Quantity surveyor, the independent budget benchmark", "2.0", "One-off"],
         ["Insurance, deposit and first instalment, paid monthly thereafter", "2.0", "One-off"],
         ["H  People, before opening", "", ""],
         ["Payroll before revenue, core team phased against opening dates", "10.0", "One-off"],
         ["Training and induction", "4.0", "One-off"],
         ["Recruitment and selection costs", "3.0", "One-off"],
         ["I  Marketing and launch", "", ""],
         ["Pre-opening campaign, three months", "9.0", "One-off"],
         ["Brand, identity, collateral, clinical photography", "5.0", "One-off"],
         ["Launch event and clinician outreach", "4.0", "One-off"],
         ["J  Opening inventory", "", ""],
         ["Aesthetic product and injectables", "4.0", "Capital"],
         ["Clinical consumables, campus", "3.0", "Capital"],
         ["Non-clinical: linen, uniforms, stationery, housekeeping", "2.0", "Capital"],
         ["K  Working capital", "", ""],
         ["Operating float to cash-positive", "45.0", "Working capital"],
         ["Cash to open", "306.7", ""]],
        ["", "NGN M", "Nature"], [327, 60, 80], total_row=True, aligns=["r", "l"],
        sub={0, 6, 16, 25, 31, 33, 38, 45, 49, 53, 57}))
    el.append(Spacer(1, 4))
    el.append(tbl(
        [["Capital, assets that last", "192.0", "Building, services, fittings, equipment, hardware"],
         ["One-off setup cost", "69.7", "Statutory, professional, people, marketing. Expensed, not "
          "capitalised"],
         ["Working capital", "45.0", "The float to cash-positive"],
         ["Cash to open", "306.7", ""],
         ["Rent and fees already paid", "115.0", "Two years in advance, already committed"],
         ["CFA mobilisation and entity kickoff", "47.0", "The rest of CFA's setup fee is paid from "
          "trading, or from the capital it saves"],
         ["Total before trading", "468.7", "Against about NGN 900M the conventional way"]],
        ["", "NGN M", "Note"], [186, 56, 225], total_row=True, aligns=["r", "l"], hi={3}))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>This number is NGN 102M higher than the round figure carried in earlier drafts, and the "
        "difference is not a change of plan.</b> It is the statutory approvals, the professional "
        "fees, the people employed before there is revenue to pay them, and the marketing that has "
        "to run before the doors open. None of it is optional, none of it was in the original "
        "NGN 662M either, and all of it is cash Medbury would have had to find. <b>A setup budget "
        "that omits these is not lean, it is incomplete</b>, and the difference always appears later "
        "as an overrun.", bg=ALERT, rule=RUST))
    el.append(Spacer(1, 4))
    el.append(Paragraph("Where the leanness actually comes from", H2))
    el.append(tbl(
        [["Theatre suite", "120", "nil", "Deferred until a surgical anchor is signed, then leased. "
          "The least evidenced demand on the campus and the largest single line"],
         ["Hybrid solar array", "33", "3", "Power purchase agreement with a lease-to-own tail. A "
          "monthly tariff against the diesel and grid spend it replaces, title transfers in years "
          "five to seven. Only the changeover and distribution is bought"],
         ["Laser, IPL and body contouring", "60", "nil", "Leased from month nine and deferred "
          "respectively. Injectables carry the aesthetics unit and need neither"],
         ["Laboratory and pharmacy", "52", "nil", "Equipped and stocked by Medbury Diagnostics and "
          "Medbury Pharmaceuticals on their own budgets"],
         ["FUE instruments", "14", "nil", "Brought by the hair restoration operator under a revenue "
          "share"],
         ["Ground floor completion", "75", "nil", "Phase two, out of trading"],
         ["Insurance, systems, opening stock", "24", "9", "Monthly instalments, subscription rather "
          "than licence purchase, and supplier terms"],
         ["Taken out of day one", "378", "12", ""]],
        ["Line", "Conventional", "Lean", "How the balance is carried"],
        [110, 56, 40, 261], total_row=True, aligns=["r", "r", "l"], hi={0}))
    el.append(Spacer(1, 4))
    el.append(Paragraph("What leaning costs, stated honestly", H2))
    el.append(tbl(
        [["Equipment lease cost above the amortisation it replaces", "28.0"],
         ["Laboratory and pharmacy financing, decided by those businesses", "17.5"],
         ["Solar tariff above the cost of owning the array", "6.0"],
         ["Annual cost of leaning", "51.5"]],
        ["", "NGN M a year"], [383, 84], total_row=True))
    el.append(Spacer(1, 3))
    el.append(card(
        "<b>NGN 51.5M a year of margin given up to avoid NGN 445M of capital.</b> It would take "
        "nearly nine years of that margin to repay what is not being spent, and Medbury keeps the "
        "cash in the meantime. <b>The amount at risk if the campus disappoints falls from about "
        "NGN 900M to NGN 469M.</b> This is not a cheaper campus. It is the same campus, financed so "
        "that the building proves itself before the balance sheet commits to it. <b>Every lease and "
        "placement carries a buy-out option priced at signature and exercisable from year two</b>, so "
        "the structure is a financing choice Medbury can reverse out of trading cash rather than a "
        "permanent premium.", bg=PANEL))
    el.append(Spacer(1, 4))
    el.append(Paragraph("Phase two, funded from trading and not from a second cheque", H2))
    el.append(tbl(
        [["Ground floor completion and the balance of the fit-out", "75", "Once the first floor is trading"],
         ["Theatre suite, leased, deposit only", "35", "Once a surgical anchor is signed"],
         ["Phase two", "110", "Out of cash flow. No further capital call"]],
        ["", "NGN M", "When"], [239, 56, 172], total_row=True, aligns=["r", "l"]))
    el.append(Spacer(1, 3))
    el.append(Paragraph(
        "Three things should be tested during design and could reduce the cash further: a landlord "
        "contribution or rent-free period against a change of use that improves the property, vendor "
        "finance on the fit-out itself, and whether the hair restoration operator will bring their "
        "own instruments in exchange for a larger revenue share.", P))

    el.append(PageBreak())

    # ---------------- 04 THE EQUIPMENT ----------------
    sec(el, "04", "THE EQUIPMENT", "Scheduled, not estimated.")
    el.append(Paragraph(
        "Equipment is the line most often waved through at a round number and then found to be twice "
        "it. This is the schedule. Four rules decide how each item is acquired: <b>buy what is cheap "
        "and essential, lease what is expensive and productive, defer what depends on demand that is "
        "not yet evidenced, and let a partner bring what only that partner will use.</b>", LEDE))
    el.append(tbl(
        [["Aesthetics and Regenerative", "", "", ""],
         ["Electric treatment couch", "2", "2.4", "Buy"],
         ["Procedure trolleys, mayo stands, stools", "1", "0.8", "Buy"],
         ["Pharmaceutical fridge with data logger", "1", "1.2", "Buy"],
         ["Class B benchtop autoclave", "1", "2.2", "Buy"],
         ["Minor procedure instrument sets", "3", "1.5", "Buy"],
         ["Magnifying lamp and dermatoscope", "1", "0.6", "Buy"],
         ["PRP centrifuge", "1", "1.5", "Buy"],
         ["Standardised clinical photography station", "1", "1.2", "Buy"],
         ["Sharps and clinical waste stations", "1", "0.3", "Buy"],
         ["Laser and IPL platform", "1", "36.0", "Lease"],
         ["Radiofrequency or body contouring device", "1", "24.0", "Defer"],
         ["Longevity and Infusion", "", "", ""],
         ["Infusion recliner", "4", "3.6", "Buy"],
         ["Volumetric infusion pump", "4", "2.4", "Buy"],
         ["Vital signs monitor", "2", "1.8", "Buy"],
         ["Medication fridge", "1", "1.0", "Buy"],
         ["Body composition analyser", "1", "3.5", "Buy"],
         ["Trolleys and consumable stations", "1", "0.7", "Buy"],
         ["Hair Restoration, the FUE suite", "", "", ""],
         ["Motorised FUE punch and control unit", "1", "6.5", "Partner"],
         ["Implanter pens", "4", "2.0", "Partner"],
         ["Stereo microscope for graft preparation", "2", "3.6", "Partner"],
         ["Graft storage chiller", "1", "0.9", "Partner"],
         ["Instrument sets", "1", "1.2", "Partner"],
         ["Reclining procedure chair", "1", "2.5", "Buy"],
         ["Procedure light", "1", "1.8", "Buy"],
         ["Family Practice", "", "", ""],
         ["Examination couch", "1", "0.9", "Buy"],
         ["Vitals, otoscope, ophthalmoscope, spirometer", "1", "1.4", "Buy"],
         ["Vaccine fridge", "1", "1.0", "Buy"],
         ["Campus shared", "", "", ""],
         ["Defibrillator and resuscitation trolley", "1", "3.5", "Buy"],
         ["Emergency oxygen and suction", "1", "1.2", "Buy"],
         ["CSSD washer-disinfector and autoclave", "1", "6.5", "Buy"],
         ["Nurse stations, wheelchairs, patient trolley", "1", "2.0", "Buy"],
         ["Theatre suite", "", "", ""],
         ["AHU, HEPA filtration and ductwork", "1", "32.0", "Defer"],
         ["Theatre light, pendant and operating table", "1", "32.0", "Defer"],
         ["Anaesthetic machine and full monitoring", "1", "20.0", "Defer"],
         ["Isolated power supply panel and UPS", "1", "11.0", "Defer"],
         ["Recovery, two monitored stations", "1", "10.0", "Defer"],
         ["Medbury Diagnostics and Medbury Pharmaceuticals", "", "", ""],
         ["Analysers, X-ray, ultrasound, echo, dispensary and cold chain", "", "n/a",
          "Those businesses"]],
        ["Item", "Qty", "NGN M", "Route"], [278, 38, 62, 89],
        aligns=["r", "r", "l"], sub={0, 12, 19, 27, 31, 36, 42}))
    el.append(Spacer(1, 4))
    el.append(tbl(
        [["Bought at launch", "45.5", "The cheap, essential and shared items. This is the only "
          "equipment line in the capital table"],
         ["Leased from month nine", "36.0", "One laser and IPL platform, at about NGN 1.2M a month "
          "with a buy-out option priced at signature. Not taken until injectable volume justifies it"],
         ["Deferred to phase two", "129.0", "The theatre suite and the body contouring device. Funded "
          "from trading, and the theatre only once a surgical anchor is signed"],
         ["Brought by the partner", "14.2", "The FUE instruments, which only the hair restoration "
          "operator will use. Nil if the partnership is agreed, NGN 14.2M if it is not"],
         ["Carried by the business that owns it", "n/a", "Laboratory and pharmacy, on Medbury "
          "Diagnostics' and Medbury Pharmaceuticals' own budgets"]],
        ["Route", "NGN M", "What it means"], [148, 52, 267], aligns=["r", "l"], hi={0}))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>The aesthetics unit opens injectables-led and buys no energy-based device.</b> Injectables "
        "are the revenue anchor at about a third of the unit's turnover and they need a couch, a cold "
        "chain and an emergency kit. Lasers, IPL, radiofrequency and body contouring are the "
        "capital-heavy items, they are the ones distributors will lease rather than sell, and they "
        "are the ones whose demand is least evidenced in Abuja. <b>Taking the laser at month nine on "
        "a lease with a priced buy-out costs NGN 36M of capital nothing and answers the question with "
        "trading data rather than with an assumption.</b>", bg=PANEL))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "Every lease and placement in this schedule is to carry a <b>buy-out option priced at "
        "signature and exercisable from year two</b>. That keeps the lean structure a financing "
        "choice Medbury can reverse out of trading cash, rather than a permanent premium.", P))

    # ---------------- 05 THE PRINCIPLE ----------------
    sec(el, "05", "THE PRINCIPLE", "Why it is five prices and not one.")
    el.append(tbl(
        [["Delivery", "Fixed", "A fixed fee, so CFA is paid for delivering the campus rather than "
          "for how much of Medbury's money passes through it", "25% on signature, the balance "
          "monthly over the first 48 trading months"],
         ["Capital efficiency", "Share of the saving", "CFA is paid to bring the campus in below "
          "the approved budget. The leaner it is delivered, the more CFA earns", "Quarterly, out of "
          "the saving itself"],
         ["Establishment", "Per entity", "Standing up a licensed clinical business is a fixed piece "
          "of work whatever that business later earns", "25% at kickoff, the balance monthly over "
          "36 months"],
         ["Management, base", "Revenue, with a floor", "Funds and directs the operating team from "
          "the first trading month, when revenue is smallest and the work largest", "Monthly"],
         ["Management, incentive", "Contribution above a hurdle", "Nil unless the campus clears a "
          "15% cash return on the capital deployed", "Annual, in arrears"],
         ["Equity", "The operating company", "The party that builds a business and runs it should "
          "own part of what it builds", "On practical completion"]],
        ["Element", "Basis", "Why that basis", "When it is paid"],
        [76, 84, 180, 127], aligns=["l", "l", "l"], hi={1}))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>The second line is the one worth pausing on.</b> The usual development fee is a "
        "percentage of capital, which pays the developer more for spending more of the owner's "
        "money. On a mandate whose whole purpose is to open for the least possible cash, that is "
        "precisely the wrong incentive. <b>A fixed delivery fee plus a share of the saving reverses "
        "it: every naira CFA keeps off Medbury's balance sheet is a naira CFA is paid a fifth of.</b> "
        "It is the only fee line in this proposal where CFA's interest and Medbury's are identical "
        "rather than merely compatible.", bg=PANEL))

    # ---------------- 05 THE FEES ----------------
    sec(el, "06", "THE FEES", "Each one, priced.")
    el.append(Paragraph("A. Delivery fee, and the capital efficiency share", H2))
    el.append(tbl(
        [["Delivery fee, fixed", "90.0", "Interior and clinical design, M&amp;E coordination, "
          "procurement and negotiation of every equipment package including the leases and placements, "
          "contractor selection and management, the regulatory file, commissioning and handover"],
         ["Mobilisation on signature, non-refundable", "25.0", "Credited against the fee"],
         ["Balance, monthly over the first 48 trading months", "65.0", "NGN 1.35M a month"],
         ["Capital efficiency share", "47.4", "20% of cash capital saved against the approved "
          "budget of NGN 450M, capped at NGN 50M. Paid quarterly out of the saving"]],
        ["", "NGN M", "What it covers"], [186, 46, 235], aligns=["r", "l"], hi={0, 3}))
    el.append(Spacer(1, 3))
    el.append(Paragraph(
        "The budget the efficiency share is measured against is set by an independent quantity "
        "surveyor and approved by Medbury before mobilisation, so it cannot be inflated to "
        "manufacture a saving. As a cross-check, NGN 450M against 711 sqm is NGN 633,000 per sqm, "
        "below the NGN 740,000 per sqm CFA published as the planning assumption for this asset class "
        "before this mandate was contemplated.", SMALL))
    el.append(Spacer(1, 5))
    el.append(Paragraph("B. Entity establishment fee", H2))
    el.append(Paragraph(
        "NGN 22M per anchor clinical entity, plus NGN 6M per entity on the licence being granted. "
        "Distinct from the building, because a licensed clinical business is not a fitted-out room. "
        "It covers the structuring and shareholders' agreement, incorporation, facility registration "
        "and the FCT health licence, MDCN and NMCN credentialing, the clinical protocol and "
        "governance set, the recruitment brief and selection, the opening price list, and ninety days "
        "of operational hand-holding after first patient.", P))
    el.append(tbl(
        [["Medlyfe Aesthetics and Regenerative", "22.0", "6.0", "Includes the NAFDAC and product "
          "import file"],
         ["Medlyfe Longevity and Infusion", "22.0", "6.0", ""],
         ["Lyfe Place Hair Restoration", "22.0", "6.0", "Includes the surgeon engagement terms"],
         ["Alameda Conversion Clinic SPV", "22.0", "6.0", "Includes the four amendments to the joint "
          "venture agreement"],
         ["Four anchor entities", "88.0", "24.0", "A fifth is priced the same way"]],
        ["Entity", "Establishment", "On licence", "Note"],
        [148, 62, 56, 201], total_row=True, aligns=["r", "r", "l"]))
    el.append(Spacer(1, 3))
    el.append(Paragraph(
        "NGN 5.5M per entity is payable at kickoff and the balance monthly over 36 trading months. "
        "The licence fee is payable on the licence being granted. Clinical and management recruitment "
        "is charged separately at 15% of first-year package, and only on placements Medbury accepts.",
        SMALL))
    el.append(Spacer(1, 5))
    el.append(Paragraph("C. Management fee", H2))
    el.append(tbl(
        [["Base", "10% of campus-wide revenue, subject to a floor of NGN 7M a month in year one "
          "and NGN 10M a month thereafter", "Monthly, from the first trading month", "169.7"],
         ["Incentive", "15% of contribution to Medbury above a 20% cash-on-cash return on capital "
          "deployed", "Annual, in arrears", "44.1"],
         ["Indexation", "Both elements indexed at 12% a year, or CPI if higher",
          "Annually on the anniversary", "n/a"],
         ["At stabilisation", "", "12.6% of campus-wide revenue", "213.8"]],
        ["Part", "Basis", "Timing", "NGN M"],
        [58, 214, 128, 67], aligns=["l", "l", "r"], hi={3}))
    el.append(Spacer(1, 3))
    el.append(Paragraph(
        "The hurdle arithmetic at stabilisation: contribution to Medbury after the base fee is "
        "NGN 377M, the 20% cash-on-cash hurdle on NGN 417M of capital deployed is NGN 83M, and 15% "
        "of the NGN 294M above it is NGN 44M. <b>Two things about the base are deliberate.</b> The "
        "rate is set so that the management service earns a normal professional margin over the cost "
        "of fielding the team, rather than a percentage borrowed from a comparator table. And the "
        "floor is lower in year one than thereafter, because year one is when revenue is smallest and "
        "the work is largest, and a floor set at the mature level would take cash out of the campus "
        "in the month it can least afford it.", P))
    el.append(Spacer(1, 3))
    el.append(Paragraph(
        "Campus-wide revenue is the single base for the whole mandate. Where CFA already holds a "
        "management agreement with an entity that trades on this campus, that entity's own fee is "
        "switched off for this site, so no naira of revenue carries two management fees.", P))
    el.append(Spacer(1, 5))
    el.append(Paragraph("D. Equity", H2))
    el.append(Paragraph(
        "Fifteen per cent of the campus operating company, issued on practical completion. The same "
        "proportion CFA holds in the Lyfe Place Aesthetics joint venture, and for the same reason: "
        "the party that designs a business, licenses it, staffs it and runs it should own part of "
        "what it builds. A fee buys CFA's attention for a year. An interest buys it for ten, and it "
        "is the difference between an operator who optimises the current quarter and one still "
        "building the fifth year of the business in the second.", P))

    el.append(PageBreak())

    # ---------------- 06 WHAT IT RETURNS ----------------
    sec(el, "07", "WHAT IT COSTS, AND WHAT IT RETURNS", "Year by year.")
    el.append(tbl(
        [["Campus-wide revenue", "nil", "976", "1,663", "1,697", "1,697"],
         ["Cash before the management fee", "nil", "110", "546", "567", "567"],
         ["Mobilisation and entity kickoff", "47", "nil", "nil", "nil", "nil"],
         ["Management, base", "nil", "98", "166", "170", "170"],
         ["Management, incentive", "nil", "nil", "nil", "44", "44"],
         ["Licence fees, on each licence granted", "nil", "24", "nil", "nil", "nil"],
         ["Deferred delivery and establishment", "nil", "nil", "38", "38", "38"],
         ["Total to CFA", "47", "122", "204", "252", "252"],
         ["Cash to Medbury, after the fee", "nil", "(12)", "342", "315", "315"],
         ["Medbury cumulative", "nil", "(12)", "330", "645", "960"],
         ["Medbury on the alternative, let by the session", "nil", "72", "199", "253", "253"]],
        ["NGN M", "Setup", "Yr 1", "Yr 2", "Yr 3", "Yr 4"],
        [183, 52, 52, 56, 56, 56], sub={7, 8}, hi={7, 9, 10}))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>Medbury's capital comes back during year two.</b> Cumulative cash after paying CFA in "
        "full reaches NGN 389M by the end of year two against NGN 284M put in before trading. On the "
        "session-let alternative the same capital returns in year three, and the capital itself is "
        "more than twice as large. <b>Year one is thin for both parties, and it should be: it is the "
        "year a campus is being built and four licensed businesses are being brought into "
        "existence.</b>", bg=PANEL))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "Only NGN 47M of CFA's setup fee is payable before the campus trades, against NGN 252M if it "
        "were charged conventionally. The balance is carried on the same terms CFA is asking Medbury "
        "to apply to its own equipment: paid out of the revenue it helps create, over 36 to 48 "
        "months, and in the case of the efficiency share, paid out of money that was budgeted and "
        "then not spent.", P))

    # ---------------- 07 THE TESTS ----------------
    sec(el, "08", "THE TESTS", "Whether the price is right.")
    el.append(Paragraph("Test one: what operators charge", H2))
    el.append(tbl(
        [["Full management services organisation", "8% to 20% of collections",
          "The closest comparator, and this mandate is at the fuller end of that scope"],
         ["Hospital and clinic management contracts", "10% to 15% of revenue, plus incentive",
          "Where an operator carries the clinical P&amp;L rather than the building"],
         ["Development management, healthcare fit-out", "10% to 18% of capital",
          "Design, procurement and delivery under one accountable party"],
         ["Facility management only", "4% to 6% of revenue",
          "Buys a building run properly. Buys no clinical P&amp;L and no businesses"],
         ["This mandate", "12.6% of campus-wide revenue", "Mid-band, for a scope at the top of it"]],
        ["Comparator", "Rate", "Note"], [148, 138, 181], aligns=["l", "l"], hi={4}))
    el.append(Spacer(1, 3))
    el.append(Paragraph(
        "Rates are international comparators. There is no reliable Nigerian fee benchmark for this "
        "asset class, so they are offered as a fairness reference rather than as market evidence.",
        SMALL))
    el.append(Spacer(1, 4))
    el.append(Paragraph("Test two: share of the value created", H2))
    el.append(tbl(
        [["What the campus produces for Medbury, after the base fee", "377", ""],
         ["CFA's margin on running it, after its own cost to serve", "109", "26%"],
         ["Medbury keeps", "333", "74%"],
         ["Medbury on the session-let alternative", "253", "On more than twice the capital"]],
        ["NGN M a year", "Amount", "Share"], [268, 62, 137], total_row=True, aligns=["r", "l"], hi={2}))
    el.append(Spacer(1, 4))
    el.append(Paragraph("Test three: alignment", H2))
    el.append(tbl(
        [["CFA opens the campus for less cash", "The efficiency share pays CFA a fifth of the saving",
          "<b>Identical interests, not merely compatible</b>"],
         ["Revenue grows", "The base fee grows with it", "Aligned"],
         ["Contribution grows", "The incentive grows faster", "Aligned"],
         ["The campus clears less than a 15% cash return", "CFA earns no incentive at all", "Aligned"],
         ["The campus is worth more in year ten", "CFA's 15% is worth more",
          "Aligned, and the reason for the equity"],
         ["CFA delivers late", "The deferred fee starts later and the incentive with it",
          "Aligned. CFA is paid out of trading that has not begun"]],
        ["If this happens", "This happens to CFA", "Verdict"],
        [148, 190, 129], aligns=["l", "l"], hi={0}))

    el.append(PageBreak())

    # ---------------- 08 THE VARIANTS ----------------
    sec(el, "09", "THREE WAYS TO STRUCTURE IT", "The same value, in different currency.")
    el.append(Paragraph(
        "These are not three price points. They are three ways to settle the same value, and they "
        "differ in whether Medbury would rather pay in fee or in equity. A lower fee is bought with a "
        "larger interest, and the reverse.", LEDE))
    el.append(tbl(
        [["1. Fee led", "12% base, no incentive, no equity", "204", "nil",
          "The simplest of the three. A known number, and Medbury keeps every naira of the upside "
          "above it and the whole company"],
         ["2. Balanced", "10% base, 15% incentive over a 20% hurdle, 15% of the operating company",
          "214", "218", "<b>Recommended.</b> The structure priced throughout this document"],
         ["3. Equity led", "7% base, 10% incentive over a 20% hurdle, 25% of the operating company",
          "150", "363", "Lowest cash cost by a distance. Medbury gives up a quarter of a company it "
          "expects to be worth about NGN 1.5Bn"]],
        ["Structure", "Terms", "Fee a year", "Equity value", "Assessment"],
        [64, 148, 56, 56, 143], aligns=["l", "r", "r", "l"], hi={1}))
    el.append(Spacer(1, 3))
    el.append(Paragraph(
        "Equity value is the stated share of an operating company earning about NGN 440M a year of "
        "contribution, valued at the 3.3 times multiple the Lyfe Place Aesthetics discounted cash "
        "flow implied. It is indicative and it is not a valuation.", SMALL))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>Option two is the one CFA recommends, and option one is the one to take if simplicity "
        "matters more than alignment.</b> The three cost Medbury within NGN 15M a year of each other "
        "at stabilisation, so this is genuinely a choice of currency rather than of price. What "
        "separates them is the bad year. Option one leaves CFA on a base fee and nothing else, which "
        "is precisely the year an operator is most tempted to reduce the team. Options two and three "
        "leave CFA holding an interest in the recovery, which is the year an owner most needs the "
        "operator to be building rather than defending a margin. <b>The equity is not a fee by "
        "another name. It is what keeps the operator in the room when the fee alone would not.</b>",
        bg=PANEL))

    # ---------------- 09 SCOPE ----------------
    sec(el, "10", "THE BOUNDARY", "What the fee includes, and what it does not.")
    el.append(tbl(
        [["Included", "The management team: campus director, operations, commercial, clinical "
          "governance, finance and billing oversight. CFA employed and directed"],
         ["Included", "Procurement and negotiation of every equipment package, including the lease, "
          "placement and consignment arrangements that keep them off the balance sheet"],
         ["Included", "Monthly management accounts by business unit, a quarterly board pack, and an "
          "annual operating plan and budget"],
         ["Included", "Tenant and entity relations, credentialing, the conversion clinic interface, "
          "and regulatory maintenance"],
         ["Reimbursed", "On-site staff: front office, nursing pool, records, security, cleaning. "
          "Engaged by CFA and reimbursed monthly"],
         ["Reimbursed", "Marketing spend, against a plan approved in the annual budget"],
         ["Charged separately", "Recruitment at 15% of first-year package, on accepted placements only"],
         ["Excluded", "Capital expenditure, lease and tariff payments, rent, utilities, insurance, "
          "clinical consumables, professional indemnity, and the clinicians' own fees"],
         ["Excluded", "Legal, tax, audit and the independent quantity surveyor. CFA instructs and "
          "manages, Medbury pays the adviser directly"],
         ["Excluded", "The CFA platforms. See the appendix"]],
        ["", "Item"], [78, 389], aligns=["l"], hi={9}))

    # ---------------- 10 TERM ----------------
    sec(el, "11", "TERM AND GOVERNANCE", "How long, and how it ends.")
    el.append(tbl(
        [["Term", "Seven years from the first trading month, with a five year option",
          "An operator cannot build a business on a horizon shorter than the asset, and the deferred "
          "fee is paid across the first four years"],
         ["Delivery", "Runs from mobilisation to commissioning, then converts to the management term",
          "One continuous mandate, not two engagements"],
         ["Exclusivity", "CFA is the sole operator of the campus for the term",
          "The mandate cannot be delivered alongside a second operator"],
         ["Further sites", "First right to manage any further Medbury facility on these terms",
          "The platform being built here is what makes the second site cheap"],
         ["Review", "Annual operating plan and budget approved by Medbury before each year",
          "CFA runs the campus. Medbury sets the plan"],
         ["Reserved to Medbury", "Capital expenditure, entity formation, pricing architecture, "
          "senior clinical appointments, any distribution", "The owner's decisions stay the owner's"],
         ["Termination for cause", "90 days to cure a material breach, then immediate", "Both ways"],
         ["Termination for convenience", "After year three, on 12 months' notice, with all deferred "
          "and accrued fees falling due and the equity retained",
          "The deferred fee is CFA's money already earned. It cannot be extinguished by ending the "
          "mandate early"],
         ["On exit", "Orderly handover, records and patient data to Medbury",
          "The clinical data is Medbury's. The platform and the systems are CFA's"]],
        ["", "Term", "Why"], [104, 190, 173], aligns=["l", "l"], hi={7}))

    # ---------------- 11 DECISIONS ----------------
    sec(el, "12", "DECISIONS", "What is needed to move.")
    el.append(tbl(
        [["1", "Confirm the medipark configuration", "The fee, and the value it is measured against, "
          "both assume the businesses move in. A sessional letting building is a different mandate "
          "at a different price"],
         ["2", "Choose the structure", "Option two, balanced, is recommended"],
         ["3", "Approve the benchmarked budget", "The efficiency share is measured against it, so it "
          "must be set independently and agreed before mobilisation"],
         ["4", "Accept the lean financing principle", "Leasing, placement and consignment cost "
          "NGN 51.5M a year of margin and save NGN 449M of capital. That trade has to be a decision, "
          "not an assumption"],
         ["5", "Confirm the rent actually paid", "Sum and term. It sets the amortisation period and "
          "the capital base the hurdle runs on"],
         ["6", "Settle the aesthetics vehicle", "Whether the Abuja unit sits inside the existing "
          "joint venture or is Medbury owned under a brand licence. It moves Medbury's annual take "
          "by about NGN 48M"],
         ["7", "Instruct the delivery", "Design, the regulatory file and the solar and equipment "
          "lease negotiations are the long lead items. Every week of delay is a week of rent already "
          "paid and not trading"]],
        ["", "Decision", "Why it is needed now"], [18, 148, 301], aligns=["l", "l"], hi={3}))
    el.append(Spacer(1, 5))
    el.append(Paragraph("If they are settled this month", H2))
    el.append(tbl(
        [["Weeks 1 to 2", "Mandate signed, mobilisation paid, design instructed, quantity surveyor "
          "appointed"],
         ["Weeks 3 to 10", "Detailed design, regulatory file lodged, contractor selection, solar "
          "power purchase agreement and equipment leases negotiated"],
         ["Weeks 6 to 20", "Fit-out. Entity structuring and licensing run alongside, not after"],
         ["Weeks 14 to 22", "Recruitment, credentialing, protocols, pre-selling of memberships and "
          "programmes"],
         ["Week 24", "First floor opens and trades while the ground floor completes"],
         ["Week 34", "Conversion clinic opens. Theatre follows the surgical anchor"]],
        ["When", "What"], [104, 363], aligns=["l"], hi={4}))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>Opening the first floor at week 24 rather than waiting for the whole campus is worth "
        "about ten weeks of trading, and it is the single largest lever on how fast Medbury's capital "
        "comes back.</b> It is a sequencing decision, not a spending decision, and it is available "
        "only because the businesses moving in upstairs do not depend on the theatre below them.",
        bg=PANEL))

    el.append(PageBreak())

    # ---------------- APPENDIX ----------------
    sec(el, "A", "APPENDIX", "The CFA platforms, available as an addendum.")
    el.append(Paragraph(
        "Four CFA platforms would materially change how this campus is run, and none of them is "
        "included in the fees above. They are set out here so Medbury can decide whether to take "
        "them, separately and later, on their own terms. <b>Nothing in this mandate depends on "
        "them.</b> The campus can be delivered and run without any of the four, using whatever "
        "systems Medbury prefers, and the fees in section 06 assume exactly that.", LEDE))
    el.append(tbl(
        [["HospitlOS", "The operating system for a medical campus: booking and room status across "
          "every business, patient records, billing and collection, and unit-level reporting "
          "consolidated into one board pack",
          "Six businesses each running their own booking, billing and records, reconciled by hand "
          "into a monthly report that arrives too late to act on"],
         ["CadreHealth", "The healthcare workforce platform at oncadre.com: sourcing consultants, "
          "resident clinicians, technicians and nurses, including a diaspora bench of Nigerian "
          "specialists abroad",
          "Agency fees on every hire, a recruiter on payroll, and no access to the senior names the "
          "sessional panel depends on"],
         ["Maarova", "Assessment, selection and development for the management layer and the "
          "clinical leads, calibrated for healthcare rather than generic corporate use",
          "Senior hires made on interview alone, in a campus where two or three wrong appointments "
          "would cost more than the platform ever would"],
         ["The DFC panel", "Access to the Doctors Foundation for Care network of diaspora "
          "physicians, for the specialist panel, visiting clinics and the conversion clinic's "
          "second opinions",
          "Building a specialist panel from cold outreach, which is the slowest and least certain "
          "part of filling the sessional floor"]],
        ["Platform", "What it is, and what it does here", "What it replaces"],
        [70, 218, 179], aligns=["l", "l"]))
    el.append(Spacer(1, 4))
    el.append(tbl(
        [["HospitlOS", "Campus licence, monthly, plus implementation and training", "To be scoped"],
         ["CadreHealth", "Access licence, monthly, plus a placement fee per accepted hire",
          "To be scoped"],
         ["Maarova", "Per assessment, on the current rate card. Coaching priced separately",
          "To be scoped"],
         ["DFC panel", "Network access, monthly, plus an introduction fee per specialist onboarded",
          "To be scoped"]],
        ["Platform", "How it would be priced", "Indicative"],
        [70, 300, 97], aligns=["l", "l"]))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>These are licensed, never contributed.</b> CFA's platforms are its own assets and are "
        "made available to the ventures it operates under licence with operator economics. They are "
        "not part of the management fee, they are not consideration for equity, and they do not "
        "transfer on exit. That principle is applied consistently across every vehicle CFA operates "
        "with Medbury, and it is what keeps the platforms worth having.", bg=ALERT, rule=RUST))
    el.append(Spacer(1, 6))
    el.append(card(
        "<b>Debo Odulana</b> &nbsp; Consult for Africa &nbsp; / &nbsp; +234 913 813 8553 &nbsp; / "
        "&nbsp; hello@consultforafrica.com", bg=NAVY, fg=white))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "Revenue, contribution and capital figures are taken from the Lyfe Place Abuja medipark model "
        "and carry that model's assumptions, of which aesthetics volume and sessional fill are the "
        "least evidenced. Lean capital figures assume lease, placement and consignment terms that are "
        "customary in this market but are not yet quoted, and each is to be confirmed at design "
        "stage. Comparator fee ranges are international and are offered as a fairness reference, not "
        "as Nigerian market evidence. Equity values are indicative and are not a valuation. Not a "
        "binding offer, and not legal or tax advice. FX reference USD/NGN 1,550.", SMALL))

    doc.build(el)
    print("wrote %s" % OUT)


if __name__ == "__main__":
    build()
