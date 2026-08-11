"""
Build "Lyfe Place Abuja: Engagement, management and 5-year outlook" PDF.

Answers Dr Itunu Akinware's three questions directly:
  1. What will this cost?          NGN 282.5M to 584M depending on the capital route
  2. Money back in 1 year?         No. 1.6 to 3.2 years. The gap cannot be structured away
  3. What is the 5-year outlook?   Cumulative net NGN 1.42bn conservative, NGN 2.53bn base

And defines the engagement:
  C4A   diagnostics and structuring, interior design, fit-out delivery. NGN 55M
  MEZO  management from practical completion. 6% of revenue base plus 10% of GOP
        above NGN 250M, combined capped at 10% of revenue

Space plan revised on the steer that Medbury Diagnostics and Pharmaceuticals take
the guest chalet and boys' quarters, keeping only patient-facing touchpoints in
the main building. That frees the ground floor for the Conversion Clinic SPV
(46 sqm -> 132 sqm). Medlyfe is not in Abuja phase 1; it can come in later as a
first-floor tenant taking rooms as an infusion bay, or as a session buyer.

Two deep dives, as requested:
  - The Conversion Clinic SPV: balanced, but Medbury's return sits in host
    economics rather than equity
  - The private medical plaza on the first floor: the main focus

Output: docs/lyfeplace-abuja-engagement-cfa.pdf

House style matches the CFA repo. Naira shown as NGN. No em dashes anywhere.

Run:
  python3 scripts/build-lyfeplace-engagement.py
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
OUT = DOCS / "lyfeplace-abuja-engagement-cfa.pdf"

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
MARGIN = 44
FULLW = PAGE_W - 2 * MARGIN

ss = getSampleStyleSheet()


def style(name, **kw):
    base = dict(fontName="Helvetica", fontSize=9.1, leading=12.4, textColor=BODY,
                alignment=TA_LEFT, spaceAfter=6)
    base.update(kw)
    return ParagraphStyle(name, **base)


EYEBROW = style("eyebrow", fontName="Helvetica-Bold", fontSize=8.4, leading=11,
                textColor=GOLD, spaceAfter=2)
H1 = style("h1", fontName="Helvetica-Bold", fontSize=13.5, leading=17, textColor=NAVY,
           spaceBefore=7, spaceAfter=5)
H2 = style("h2", fontName="Helvetica-Bold", fontSize=10, leading=13, textColor=TEAL,
           spaceBefore=8, spaceAfter=3)
P = style("p")
LEDE = style("lede", fontSize=9.9, leading=14.2, textColor=HexColor("#374151"))
SMALL = style("small", fontSize=7.8, leading=10.5, textColor=MUTED)
CELL = style("cell", fontSize=8.3, leading=10.8)
CELL_R = style("cellr", fontSize=8.3, leading=10.8, alignment=2)
CELL_B = style("cellb", fontSize=8.3, leading=10.8, fontName="Helvetica-Bold", textColor=NAVY)
CELL_BR = style("cellbr", fontSize=8.3, leading=10.8, fontName="Helvetica-Bold",
                textColor=NAVY, alignment=2)
CELL_W = style("cellw", fontSize=8.3, leading=10.8, fontName="Helvetica-Bold", textColor=white)
CELL_WR = style("cellwr", fontSize=8.3, leading=10.8, fontName="Helvetica-Bold",
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
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 20,
                      "Engagement, management and 5-year outlook")
    c.setFillColor(GOLD)
    c.rect(MARGIN, 26, 20, 2, fill=1, stroke=0)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 7.4)
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
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ]))
    return t


def tbl(rows, labels, widths, total_row=False, aligns=None, hi=None):
    ncols = len(labels)
    if aligns is None:
        aligns = ["r"] * (ncols - 1)
    hi = hi or set()
    data = [[Paragraph(labels[0], CELL_W)] +
            [Paragraph(t, CELL_WR if aligns[j] == "r" else CELL_W)
             for j, t in enumerate(labels[1:])]]
    for i, r in enumerate(rows):
        emph = (total_row and i == len(rows) - 1) or i in hi
        cells = [Paragraph(r[0], CELL_B if emph else CELL)]
        for j, v in enumerate(r[1:]):
            if aligns[j] == "r":
                cells.append(Paragraph(v, CELL_BR if emph else CELL_R))
            else:
                cells.append(Paragraph(v, CELL_B if emph else CELL))
        data.append(cells)
    t = Table(data, colWidths=widths)
    st = [
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("LINEBELOW", (0, 0), (-1, 0), 1.6, GOLD),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 3.4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3.4),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("ROWBACKGROUNDS", (0, 1), (-1, -2 if total_row else -1), [white, SURFACE]),
    ]
    if total_row:
        st.append(("BACKGROUND", (0, -1), (-1, -1), CREAM))
        st.append(("LINEABOVE", (0, -1), (-1, -1), 1, GOLD))
    for i in hi:
        st.append(("BACKGROUND", (0, i + 1), (-1, i + 1), PANEL))
    t.setStyle(TableStyle(st))
    return t


def sec(el, num, eyebrow, title):
    el.append(Paragraph(num + "  /  " + eyebrow, EYEBROW))
    el.append(Paragraph(title, H1))


def build():
    doc = BaseDocTemplate(
        str(OUT), pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN, topMargin=42, bottomMargin=30,
        title="Lyfe Place Abuja - Engagement, management and 5-year outlook",
        author="Consult for Africa",
    )
    doc.addPageTemplates([PageTemplate(
        id="p", frames=[Frame(MARGIN, 30, FULLW, PAGE_H - 42 - 30, id="f")],
        onPage=page_bg)])

    el = []

    el.append(Paragraph("Engagement, management and 5-year outlook",
                        style("t", fontName="Helvetica-Bold", fontSize=17.5, leading=21,
                              textColor=NAVY, spaceAfter=2)))
    el.append(Paragraph("C4A builds it. Mezo Health runs it. Medbury owns it.",
                        style("st", fontName="Helvetica-Oblique", fontSize=10.5, leading=13,
                              textColor=GOLD, spaceAfter=7)))

    # ================= 01 THE THREE ANSWERS =================
    sec(el, "01", "YOUR THREE QUESTIONS", "Cost, payback, and the five years.")
    el.append(tbl(
        [["What will it cost?",
          "NGN 282.5M to NGN 584M, depending on how the capital is structured"],
         ["Money back in one year?",
          "No. 2.1 to 3.9 years. The gap cannot be closed by structuring"],
         ["Five-year outlook?",
          "Cumulative net NGN 1.29bn conservative, NGN 2.18bn base, before tax"]],
        ["Question", "Answer"], [138, 329], aligns=["l"]))
    el.append(Spacer(1, 5))
    el.append(card(
        "<b>On the one-year payback, plainly.</b> Year-one net contribution is NGN 4M on the base "
        "case, because the sessional diary and the membership roll both take time to fill. A "
        "twelve-month payback would need total capital at or below NGN 4M. The leanest defensible "
        "route is NGN 282.5M. The gap is NGN 279M and no amount of structuring closes it. What is "
        "achievable is <b>29 to 41 months</b> on the optimised route, and the single largest lever "
        "is not prepaying two years of rent.", bg=ALERT, rule=RUST))
    el.append(Spacer(1, 5))
    el.append(Paragraph(
        "Two further honesties on the figures. They are <b>before tax</b>: companies income tax at "
        "30% and the capital allowances available on the fit-out need a tax adviser, and post-tax "
        "payback runs roughly 25% to 30% longer. And the model carries <b>no FF&amp;E reserve</b>. "
        "At the standard 2% of revenue that is NGN 5M rising to NGN 21M a year, and it pushes "
        "payback out about two months.", P))

    # ================= 02 SPACE PLAN =================
    sec(el, "02", "THE SPACE PLAN", "Diagnostics and pharmacy move out of the main building.")
    el.append(Paragraph(
        "Medbury Diagnostics and Medbury Pharmaceuticals keep only their patient-facing touchpoints "
        "in the main building. Everything else moves to the outbuildings. This is the right call and "
        "it unlocks the ground floor.", LEDE))
    el.append(tbl(
        [["Main building, ground", "Conversion Clinic SPV demise", "104",
          "Was 46. Consulting, MDT, observation"],
         ["Main building, ground", "Shared clean procedure room and recovery bay", "28",
          "Bookable by the SPV and by plaza members. See section 07"],
         ["Main building, ground", "Imaging suite, diagnostics-branded", "55",
          "Patient-facing. Cannot move: weight, shielding, no lift"],
         ["Main building, both floors", "Phlebotomy draw points and medication hatches", "28",
          "The branded presence. Carved from lobby and circulation"],
         ["Main building, first", "5 consulting rooms, procedure room, FUE suite, members' lounge, coordinator room", "162",
          "Deliberately not room-maximised. The lounge and the coordinator room are what make the memberships and the hub sellable"],
         ["Guest chalet", "Medbury Diagnostics laboratory and back of house", "80",
          "Lab 40, specimen reception 10, cold chain 8, reporting 10, circulation 12"],
         ["Boys' quarters", "Medbury Pharmaceuticals dispensary and back of house", "45",
          "Dispensary 25, controlled drugs 5, cold chain 5, office 8"]],
        ["Where", "What", "sqm", "Note"],
        [98, 130, 32, 207], aligns=["l", "r", "l"], hi={0}))
    el.append(Spacer(1, 5))
    el.append(card(
        "<b>The gain: the Conversion Clinic SPV demise more than doubles, from 46 to 104 sqm, for the "
        "same NGN 132M licence, and it now has a clean procedure room on its own floor.</b> That removes Alameda's strongest objection and makes the price "
        "far easier to hold. Medlyfe is not in the Abuja phase 1 plan and no figure in this note "
        "relies on it. It can come in later as a first-floor tenant, taking two or three rooms as an "
        "infusion bay once the plaza is established, or simply buying sessions like any other member.",
        bg=PANEL))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "One judgement to confirm: I have treated <b>imaging as patient-facing</b> and left it in "
        "the main building, on the same logic as phlebotomy. It cannot practically go to the chalet "
        "in any case, because the laboratory alone fills all 80 sqm.", P))

    el.append(Paragraph("The as-built rooms, and what each becomes", H2))
    el.append(Paragraph(
        "Read off the as-built drawings. Two things stand out: the existing en-suite bathrooms mean "
        "most consulting rooms come with a private WC, which is a premium feature that would be "
        "expensive to create; and the two existing kitchens already have water and drainage, so they "
        "should take the wet functions rather than fighting the building.", P))
    el.append(tbl(
        [["Living Room", "8776 x 6615", "58", "Reception, waiting and concierge. Front of house, "
          "at the entrance"],
         ["Bedroom, largest", "5690 x 3385", "19", "Clean procedure room. The en-suite becomes "
          "the scrub"],
         ["Kitchen", "5306 x 3435", "18", "Phlebotomy and specimen handling. Existing water "
          "and drainage"],
         ["Bedrooms x 3", "8 to 14 each", "32", "SPV consulting and MDT rooms, each with its own WC"],
         ["Dining", "3170 x 4095", "13", "Records and cashier"],
         ["Store", "3170 x 1905", "6", "Medication collection hatch and drug store"]],
        ["Ground floor, as built", "mm", "sqm", "Becomes"],
        [104, 82, 36, 245], aligns=["l", "r", "l"]))
    el.append(Spacer(1, 4))
    el.append(tbl(
        [["Living Room 2", "8285 x 6228", "52", "3 consulting rooms"],
         ["Living Room 1", "5930 x 5740", "34", "2 consulting rooms"],
         ["Bedrooms x 4", "10 to 19 each", "56", "4 consulting rooms, each with an en-suite WC"],
         ["Playroom", "7270 x 3080", "22", "Treatment room. Right size and right position"],
         ["Kitchen", "4700 x 3148", "15", "Sterilising and staff beverage. Existing services"],
         ["Store and balcony", "-", "9", "Linen and consumables, and a member terrace"]],
        ["First floor, as built", "mm", "sqm", "Becomes"],
        [104, 82, 36, 245], aligns=["l", "r", "l"]))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>Nine to ten consulting rooms is what the first floor actually yields</b>, from four "
        "bedrooms plus three from the larger living room and two from the smaller. The ten-room "
        "assumption in this model is confirmed by the drawings rather than assumed. The staircase "
        "sits in the right-hand block and there is no lift, which is what rules out day case "
        "surgery upstairs.", bg=PANEL))

    el.append(Paragraph("Operating hours and one reception", H2))
    el.append(Paragraph(
        "<b>08:00 to 22:00, Monday to Saturday.</b> Nothing meaningful happens at 07:00 in Abuja and "
        "an early band would not have filled. Anything before 08:00 is planned, paid overtime for "
        "only the staff involved, never a standing shift. A single reception serves both floors: one "
        "arrival point, one concierge team, one standard, which is how a premium medical address "
        "should feel and is cheaper than two.", P))
    el.append(tbl(
        [["08:00 to 11:30", "58,000", "30%", "4.3 / hour", "Full-time private practitioners only"],
         ["11:30 to 15:00", "58,000", "30%", "4.3 / hour", "Same, and the weakest band"],
         ["15:00 to 18:30", "80,000", "50%", "7.1 / hour", "Consultants arriving from their hospital day"],
         ["18:30 to 22:00", "88,000", "60%", "8.6 / hour", "Prime private practice window"]],
        ["Four 3.5-hour blocks", "NGN", "Fill", "Arrivals", "Who uses it"],
        [96, 56, 34, 60, 221], aligns=["r", "r", "r", "l"], hi={3}))
    el.append(Spacer(1, 4))
    el.append(tbl(
        [["Stagger within the evening band", "Room starts at 18:30 and 19:15 rather than all at "
          "once. Takes the 8.6 peak back under 7"],
         ["Cap Alameda at 40 arrivals a day", "Which means about 67 clinic days a year to deliver "
          "2,688 consults, not 48. Six drives of 11 days, or eight of 8 or 9"],
         ["Suppress plaza bands 1 and 2 on drive days", "Alameda's 09:00 to 17:00 covers those bands. "
          "Costs about NGN 23M a year in foregone sessions and is already in the figures"]],
        ["Calendar rule Mezo owns", "How it works"], [172, 295], aligns=["l"]))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>The campus is throughput-constrained, not space-constrained.</b> Single-reception "
        "sustained capacity is about <b>98 arrivals a day</b> at 7 an hour across the 14-hour window. "
        "Year-three average is 87, but a peak drive day runs at <b>95</b>, which is 97% of capacity. "
        "That is the real design limit, and it is why the reception and waiting area should be sized "
        "generously and why Alameda's daily cap is not negotiable.<br/><br/>"
        "<b>Two waiting zones, one desk.</b> A senior specialist's private patient and a screening "
        "queue should not share seating. One arrival experience, then a quiet plaza lounge and a "
        "separate general waiting area. A layout decision, not a cost.", bg=PANEL))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>Extending to 23:00 is worth about NGN 16M a year and I would hold it back.</b> Five "
        "3-hour blocks instead of four 3.5-hour blocks adds a fifth sellable block, but it lifts the "
        "17:00 to 20:00 band to 9 arrivals an hour, pushes the campus to its throughput ceiling, and "
        "adds security and staffing cost. Prove 20:00 demand in year two, then extend.",
        bg=SURFACE))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "Let-bearing area is 294 sqm of 619 net internal, or 47%, unchanged from the previous plan.", P))

    # ================= 03 THREE PARTY MAP =================
    sec(el, "03", "THE THREE PARTIES", "What each one wants, and how each one gets it.")
    el.append(Paragraph(
        "Three organisations have to be satisfied for this to work, and their interests are aligned "
        "in most places and opposed in a few. Both are set out below, because the places they are "
        "opposed are where the agreements have to do the work.", LEDE))

    el.append(Paragraph("Medbury Healthcare Group", H2))
    el.append(tbl(
        [["Capital returned quickly", "Route B at NGN 403.5M, payback 20 to 24 months. The mechanism "
          "is prepayment: Alameda 12 months in advance, memberships annual in advance"],
         ["A revenue engine with no clinical payroll",
          "Campus revenue NGN 192M in year one to NGN 1,190M in year five. Members and tenants, "
          "never employees"],
         ["Volume for Diagnostics and Pharmaceuticals",
          "17,145 patient contacts a year past their touchpoints at stabilisation, with a first-call "
          "obligation in every user agreement. NGN 147M contribution by year five"],
         ["A replicable Medical Infrastructure model",
          "The rate and area assumptions note is the blueprint: 13 planning assumptions ready to "
          "apply to the next site"],
         ["Brand elevation", "Lyfe Place as the master brand, The Cloister as the membership"],
         ["Not to be exposed by the Alameda JV",
          "Property never enters the SPV. Return sits in host economics, not equity. Nine "
          "amendments to the agreement"],
         ["Not to have to run it herself",
          "Mezo manages, on a KPI-linked fee with a two-year performance termination right"]],
        ["What Itunu wants", "How she gets it"], [148, 319], aligns=["l"]))

    el.append(Paragraph("Mezo Health", H2))
    el.append(tbl(
        [["A management contract with real scale",
          "NGN 12M in year one rising to NGN 119M in year five. About NGN 338M across five years"],
         ["Fee certainty, not only upside",
          "The 6% base is payable on revenue regardless of profit. The incentive sits on top"],
         ["A reference asset",
          "The first Mezo-managed medical park. Right to reference it, and a right of first offer on "
          "the next two Medbury parks"],
         ["Authority to actually deliver",
          "An approved annual budget, then autonomy inside it. Mezo employs and directs the on-site "
          "team"],
         ["A term long enough to earn out mobilisation",
          "Five years, coterminous with the head lease"],
         ["Not to carry costs it cannot control",
          "Medbury carries rent, power, capex, insurance and statutory. On-site payroll is reimbursed "
          "at cost"]],
        ["What Mezo wants", "How Mezo gets it"], [148, 319], aligns=["l"]))

    el.append(Paragraph("Consult for Africa", H2))
    el.append(tbl(
        [["Paid for the diagnostics and structuring already done",
          "NGN 20M, phase one, payable 40% on appointment"],
         ["The design and delivery mandate",
          "NGN 35M across interior design and fit-out delivery, phases two and three"],
         ["A continuing position rather than a one-off",
          "Four options, to be chosen: a success fee on the founding cohort, a revenue share in the "
          "plaza business, retained advisory on the next park, or a clean exit at practical "
          "completion"],
         ["The model proven so it can be taken to other clients",
          "Agree upfront what CFA may reuse. The methodology is CFA IP, the Medbury figures are not"],
         ["Attribution", "Named as structuring and design adviser on the campus"]],
        ["What C4A wants", "How C4A gets it"], [148, 319], aligns=["l"]))
    el.append(PageBreak())

    el.append(Paragraph("Where the three are opposed, and what settles it", H2))
    el.append(tbl(
        [["Mezo is paid on revenue. Medbury earns on profit",
          "A fee on revenue rewards topline even if cost grows faster",
          "10% of GOP as the incentive, and the combined fee capped at 10% of revenue"],
         ["C4A's fee could scale with fit-out spend. Medbury wants lower capital",
          "A percentage-of-spend fee pays C4A to specify more",
          "C4A's NGN 55M is a fixed lump sum, not a percentage of the fit-out"],
         ["Mezo wants a long term. Medbury wants a performance exit",
          "Five years of a weak operator is expensive",
          "Five-year term, but two consecutive years of missed KPIs gives Medbury a termination right"],
         ["C4A hands the building to Mezo. A poor handover costs Medbury",
          "Neither party owns the gap between completion and operation",
          "A 90-day joint mobilisation overlap, and C4A's final 30% released only on commissioning "
          "sign-off"],
         ["Alameda's interests sit outside this triangle",
          "Treatment revenue lands in Cairo where Medbury does not participate",
          "Medbury's return is taken in host economics, which do not depend on Alameda's margin"]],
        ["Tension", "Why it matters", "What settles it"],
        [140, 138, 189], aligns=["l", "l"]))
    el.append(Spacer(1, 5))
    el.append(card(
        "<b>One governance point to settle before anything is signed.</b> C4A specifies and delivers "
        "the asset that Mezo is then paid to manage. If there is any common ownership, control or "
        "economic interest between C4A and Mezo, it should be disclosed to Medbury in writing now "
        "and the two agreements negotiated and priced independently. Declaring it early costs "
        "nothing and protects the relationship. Discovering it later does not.",
        bg=ALERT, rule=RUST))
    el.append(Spacer(1, 5))
    el.append(Paragraph("What each party actually puts in", H2))
    el.append(tbl(
        [["Medbury", "The property, all capital, all opex, both support businesses, the licences and "
          "the regulatory pathway", "NGN 403.5M and the balance sheet"],
         ["Mezo", "The management team, systems, specialist recruitment and the operating discipline",
          "Mobilisation cost and reputation"],
         ["C4A", "The structure, the commercial model, the design and the delivery of the asset",
          "NGN 55M of fee at risk against milestones"],
         ["Alameda", "A clinical brand, visiting specialists and a conversion pipeline",
          "USD 25,000 of budget and 51% of a thin SPV"]],
        ["Party", "Contribution", "At stake"], [70, 240, 157], aligns=["l", "l"]))

    # ================= 04 THE ENGAGEMENT =================
    sec(el, "04", "THE ENGAGEMENT", "C4A to practical completion, Mezo thereafter.")
    el.append(Paragraph("C4A scope and fee", H2))
    el.append(tbl(
        [["1. Diagnostics and structuring",
          "Commercial model, SPV structuring and JV amendments, tariff model, business plan, "
          "licensing and regulatory pathway", "20"],
         ["2. Interior design",
          "Concept and detailed design, FF&amp;E specification, brand integration across both "
          "floors and the outbuildings", "15"],
         ["3. Fit-out delivery",
          "Tender, contractor selection, supervision, snagging, commissioning and handover", "20"],
         ["Total C4A engagement", "", "55"]],
        ["Phase", "Scope", "NGN M"], [128, 279, 60], total_row=True, aligns=["l", "r"]))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "Payable 40% on appointment, 30% at design sign-off, 30% at practical completion. NGN 35M of "
        "this sits inside the fit-out capital as design and project management; the NGN 20M "
        "diagnostics phase is advisory and expensed. Handover to Mezo at practical completion, with "
        "a 90-day joint mobilisation overlap so the operating team is trained on the building before "
        "C4A leaves.", P))

    el.append(Paragraph("What management means", H2))
    el.append(Paragraph(
        "Three models exist and the fee only makes sense once you pick one. Your 7.5% to 10% sits "
        "between two of them.", P))
    el.append(tbl(
        [["A. Overlay only", "Mezo provides the management team. All on-site staff are Medbury's "
                             "payroll", "5% to 7%", ""],
         ["B. Fully bundled", "Mezo employs and pays everyone on site out of its fee",
          "12% to 16%", ""],
         ["C. Recommended", "Mezo provides the management team and systems from its fee. On-site "
                            "operating payroll is engaged by Mezo and reimbursed at cost by Medbury",
          "6% plus incentive", "Recommended"]],
        ["Model", "What the fee covers", "Fee range", "View"],
        [86, 245, 78, 58], aligns=["l", "l", "l"], hi={2}))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "Model C is the standard owner-operator structure and it is the only one of the three that "
        "aligns Mezo with margin rather than headcount. Under A, Medbury carries the hiring risk and "
        "Mezo has no reason to run lean. Under B, Mezo has every reason to under-staff.", P))

    el.append(Paragraph("The fee", H2))
    el.append(tbl(
        [["Base fee", "6% of campus revenue"],
         ["Incentive fee", "10% of gross operating profit above NGN 250M"],
         ["Combined cap", "10% of campus revenue, so it never exceeds your ceiling"],
         ["Effective rate", "6.0% in year 1, 8.6% in year 2, 10.0% from year 3"]],
        ["Component", "Basis"], [110, 357], aligns=["l"]))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "That shape is deliberate. Mezo earns least while the campus is ramping and most once it "
        "performs, which is the opposite of a flat percentage of revenue. A flat 7.5% to 10% would "
        "pay Mezo NGN 21M to NGN 27M in year one for a building that is barely trading, and would "
        "reward topline growth even if operating cost grew faster.", P))
    el.append(PageBreak())

    el.append(Paragraph("Who pays for what", H2))
    el.append(tbl(
        [["Head rent, fit-out, capex, FF&amp;E reserve at 2% of revenue", "Medbury Lyfe Place", ""],
         ["Power, water, diesel", "Medbury Lyfe Place", ""],
         ["Security, cleaning, waste disposal", "Medbury Lyfe Place", ""],
         ["Building insurance and public liability", "Medbury Lyfe Place", ""],
         ["Maintenance and biomedical materials", "Medbury Lyfe Place", ""],
         ["Statutory fees, licences, rates", "Medbury Lyfe Place", ""],
         ["Marketing spend, against an approved budget", "Medbury Lyfe Place", "Mezo executes"],
         ["On-site operating payroll, about 17 people", "Medbury Lyfe Place, at cost",
          "Mezo employs and manages"],
         ["General Manager and management team salaries", "Mezo, from the fee", ""],
         ["Finance, billing, collections, monthly reporting", "Mezo, from the fee", ""],
         ["Booking platform, billing and reporting systems", "Mezo, from the fee", ""],
         ["Staff app: chaperone calls, specimen collection, room turnaround",
          "Mezo, from the fee", "Live at practical completion"],
         ["Specialist recruitment and member relations", "Mezo, from the fee", ""],
         ["Clinical governance coordination and licence compliance", "Mezo, from the fee", ""],
         ["Professional indemnity for clinicians", "Each member or tenant", ""]],
        ["Item", "Who carries it", "Note"],
        [243, 122, 102], aligns=["l", "l"]))
    el.append(Spacer(1, 5))
    el.append(Paragraph("The on-site team, reimbursed at cost", H2))
    el.append(Paragraph(
        "The number that matters is not headcount, it is shift coverage. <b>08:00 to 22:00 across six "
        "days is 84 operating hours a week</b>, and one full-time employee covers about 40. Every "
        "position that has to be continuously staffed therefore needs 2.1 people, not one. That is "
        "what my earlier NGN 45M figure missed.", P))
    el.append(tbl(
        [["Reception and cashier", "1.9", "4", "180,000", "Two positions at peak, one off-peak"],
         ["Registered nurses", "2.9", "6", "350,000", "Two on the plaza floor, one on the ground "
          "floor for procedures and the SPV"],
         ["Housekeeping", "1.9", "4", "90,000", "Room turnaround between blocks is constant"],
         ["Concierge and patient navigator", "1.0", "2", "220,000", "One position, both floors"],
         ["Facilities technician", "1.0", "2", "280,000", "One position plus on-call"],
         ["Porter and orderly", "1.0", "2", "120,000", "One position"],
         ["Records officer", "day", "1", "200,000", "Day role only, no shift cover needed"],
         ["Total", "", "21", "4,620,000", "per month"]],
        ["Role", "Positions", "FTE", "NGN each", "Basis"],
        [128, 48, 34, 62, 195], total_row=True, aligns=["r", "r", "r", "l"]))
    el.append(Spacer(1, 4))
    el.append(tbl(
        [["Direct payroll", "55.4"],
         ["Statutory loading at 15%: pension, NHF, ITF, NSITF, group life", "8.3"],
         ["Recruitment, uniforms and training", "3.0"],
         ["Loaded annual cost at full staffing", "66.7"]],
        ["Cost build", "NGN M / yr"], [407, 60], total_row=True))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>Correction to my earlier figure.</b> I used NGN 45M a year, which is annual not monthly, "
        "but it was too low. Properly built on shift coverage and loaded with statutory costs it is "
        "<b>NGN 66.7M a year at full staffing</b>. It does not start there: 12 FTE in year one at "
        "about NGN 38M, 17 in year two at NGN 54M, 21 from year three. Every figure in this note has "
        "been rebuilt on that.", bg=ALERT, rule=RUST))
    el.append(Spacer(1, 5))
    el.append(Paragraph("One systems dependency worth naming", H2))
    el.append(Paragraph(
        "This is an ambulatory centre, so there is no nurse call system. Patient-facing emergency "
        "call buttons and WC pull cords are hardwired as a safety floor, but everything operational "
        "that a nurse call system would have carried, chaperone requests, specimen collection, "
        "next-patient calls and room turnaround, moves into the EMR or a staff app. That is the "
        "right design, and it creates a dependency that hardware would not have.", P))
    el.append(tbl(
        [["Hardware works on the day it is commissioned",
          "A staff app depends on the EMR being live, configured and adopted. It can be late in a "
          "way a call button cannot"],
         ["The EMR choice becomes critical path",
          "If the selected EMR cannot route tasks between clinician and support staff, a separate "
          "staff comms tool is needed. Confirm this before selection closes"],
         ["Mezo owns the go-live",
          "Staff app functionality live at practical completion, as a named deliverable tied to the "
          "commissioning sign-off"],
         ["Have the low-tech fallback ready",
          "If the app is not live on opening day, the facility runs on handheld radios or a paging "
          "app. Cheap, unglamorous, and it works"]],
        ["Why it matters", "What to do"], [176, 291], aligns=["l"]))

    el.append(Paragraph("Governance", H2))
    el.append(tbl(
        [["Term", "5 years, coterminous with the head lease"],
         ["Budget", "Annual budget approved by Medbury. Mezo cannot exceed it without consent"],
         ["Reporting", "Monthly pack, quarterly owner's meeting"],
         ["KPIs", "Sessional fill, member count, collection days, patient satisfaction, "
                  "licence compliance"],
         ["Performance right", "Two consecutive years of missed KPIs gives Medbury a termination right"],
         ["Termination", "By Medbury for convenience on 6 months' notice plus 6 months' base fee. "
                         "Immediately for cause"]],
        ["Term", "Provision"], [104, 363], aligns=["l"]))
    el.append(PageBreak())

    # ================= 04 THE SPV =================
    sec(el, "05", "THE CONVERSION HUB", "Alameda is the anchor, not the only tenant.")
    el.append(Paragraph(
        "The ground floor is not Alameda's clinic. It is the <b>Lyfe Place International Clinic</b>, a "
        "conversion hub that Alameda anchors and that other international hospital groups also use. "
        "Nigeria's outbound medical tourism runs to well over a billion dollars a year and India, "
        "Turkey, the Gulf, Egypt and Germany all compete for it, almost entirely through agents' "
        "offices and hotel conference rooms. A purpose-built floor with consulting rooms, imaging and "
        "a laboratory is genuinely differentiated: more credible to a patient than an agent's office, "
        "and cheaper for the group than flying a team to a hotel.", LEDE))
    el.append(Paragraph(
        "Alameda uses 67 clinic days a year, leaving 209 of the 276 operating days sellable to other "
        "groups. At the same NGN 2.0M per drive day that Alameda's licence implies:", P))
    el.append(tbl(
        [["Alameda, anchor", "67", "132", "67", "132", "67", "132"],
         ["Group 2", "30", "59", "50", "99", "55", "108"],
         ["Group 3", "15", "30", "40", "79", "45", "89"],
         ["Group 4", "-", "-", "-", "-", "30", "59"],
         ["Ground floor total", "112", "221", "157", "309", "197", "388"]],
        ["Conversion hub", "Days", "NGN M", "Days", "NGN M", "Days", "NGN M"],
        [128, 52, 62, 52, 62, 52, 59], total_row=True))
    el.append(Spacer(1, 3))
    el.append(Paragraph(
        "Columns are conservative, base and developed. Utilisation runs 41%, 57% and 71% of available "
        "days, so even the developed case leaves the floor idle more than a quarter of the year.", SMALL))
    el.append(Spacer(1, 5))
    el.append(card(
        "<b>The hub is worth NGN 221M to NGN 388M from the ground floor, against NGN 132M from "
        "Alameda alone.</b> Credentialing becomes a real line too: three or four groups means 50 to "
        "65 visiting doctors a year needing MDCN temporary registration, indemnity verification and "
        "immigration support at NGN 600,000 to NGN 1M each, so NGN 30M to NGN 65M a year for work the "
        "campus has to do anyway.", bg=PANEL))
    el.append(Spacer(1, 5))
    el.append(Paragraph("What the hub model requires", H2))
    el.append(tbl(
        [["No exclusivity to anyone, ever",
          "Stated to every group at the outset so nobody is surprised. This is why the non-compete "
          "had to go, and why it cannot come back in any form"],
         ["Neutral campus branding",
          "The floor is Lyfe Place International Clinic. Groups operate within it under a booking, "
          "not a demise. No group gets signage or naming rights"],
         ["Non-overlapping drive windows",
          "One group on site at a time, on a published calendar Mezo controls. Prime windows carry "
          "a premium"],
         ["Each group owns its patients and records",
          "The campus sells rooms, imaging, laboratory and coordination. It does not own the referral "
          "or the onward treatment relationship"],
         ["Identical terms and mutual confidentiality",
          "Every group signs the same template. Competitors sharing a building only works if the "
          "terms are visibly even"],
         ["Per-destination compliance",
          "MDCN temporary registration for every visiting clinician, and an NDPR cross-border "
          "transfer agreement for each destination country"]],
        ["Requirement", "Why"], [148, 319], aligns=["l"]))
    el.append(Spacer(1, 5))
    el.append(card(
        "<b>And this settles the equity question.</b> If the ground floor is a hub rather than "
        "Alameda's clinic, Medbury is not a minority partner in its own building. It is the operator "
        "of a floor Alameda rents 67 days a year. The 49% in the Alameda SPV stops mattering very "
        "much, because the SPV becomes one customer of the hub rather than the hub itself.",
        bg=ALERT, rule=RUST))
    el.append(PageBreak())

    sec(el, "05b", "THE ALAMEDA SPV", "Medbury wins on host economics, not on equity.")
    el.append(Paragraph(
        "Medbury contributes the property, the fit-out, the diagnostics, the pharmacy, the "
        "management, the licences and the entire regulatory pathway. Alameda contributes a clinical "
        "brand, visiting specialists and a conversion pipeline. A 51% holding in Alameda's favour "
        "does not reflect that. But the answer is not to fight over the equity.", LEDE))
    el.append(card(
        "<b>Medbury does not need SPV equity to win. It needs host economics.</b> The 49% is "
        "tolerable precisely because the money sits outside the SPV, in the licence fee, the "
        "diagnostics and pharmacy capture, and the management fee on the SPV's own revenue. Fighting "
        "for 51% risks the deal to win the least valuable of the four.", bg=PANEL))
    el.append(Spacer(1, 5))
    el.append(tbl(
        [["Licence fee, ground floor demise of 132 sqm", "132.0", "51%, Medbury owns 49% of the payer"],
         ["Diagnostics capture from SPV patients", "~28", "100% Medbury"],
         ["Pharmacy capture from SPV patients", "~8", "100% Medbury"],
         ["Management fee on SPV revenue, through Mezo", "in campus fee", "100% Medbury"]],
        ["Medbury's return from hosting", "NGN M / yr", "Efficiency"],
        [232, 90, 145], aligns=["r", "l"]))
    el.append(Spacer(1, 5))
    el.append(card(
        "<b>On dropping the non-compete.</b> An earlier draft proposed barring a competing conversion "
        "clinic in Nigeria. That was wrong on two counts. It clashes with the first floor, where "
        "independent specialists rent rooms and many hold their own foreign referral relationships: "
        "Lyfe Place cannot give undertakings on their behalf, and vetting them for it would exclude a "
        "large share of exactly the consultants being recruited. And a restraint binds both ways, so "
        "it would have locked Medbury out of running conversion pathways with Indian, Turkish or Gulf "
        "groups from its own building. <b>Removing it is not a concession, it is optionality "
        "retained.</b> Alameda contributes USD 25,000 of budget and a brand; it should not also "
        "receive a free franchise protection.", bg=PANEL))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "Nothing in the agreement should restrict any clinician, on either floor, from referring a "
        "patient to any provider anywhere on clinical grounds. That is a professional duty and a "
        "patient-safety matter, and a clause fettering it would be both improper and unenforceable.", P))
    el.append(Paragraph("Terms: balanced, but optimised for the host", H2))
    el.append(tbl(
        [["Property", "Never enters the SPV. PropCo, wholly Medbury owned, leases to the SPV"],
         ["Equity", "49 / 51 stands, on condition the property stays out"],
         ["Officers", "Medbury nominates MD, Finance Director and Company Secretary, as clause 5.2 "
                      "already provides. Hard-wire it into the Articles"],
         ["Reserved matters", "Medbury veto over budget, capex above NGN 10M, related-party "
                              "contracts, borrowing, new shares, lease changes, dividend policy, "
                              "MD and FD appointment, competing ventures, asset sales, winding up"],
         ["Clause 24.I", "Deleted. No termination for convenience before year five"],
         ["Break fee", "Unamortised fit-out plus the remaining licence term on early exit"],
         ["No non-compete", "Deliberately none. It would clash with the independent specialists "
          "upstairs, and it would lock Medbury out of running conversion pathways with other foreign "
          "groups from its own building"],
         ["Mutual non-solicitation", "Neither party solicits the other's contracted physicians, "
          "members or corporate accounts for a separate venture, during the term and for 12 months "
          "after. This protects relationships, not a market"],
         ["Preferred pathway, not exclusivity", "Where a campus patient needs treatment abroad, the "
          "Alameda route is presented as the campus default. The clinician and patient remain free to "
          "choose otherwise. Commercial benefit to Alameda, no fetter on anyone's clinical judgement"],
         ["Deadlock", "Escalation, then a shoot-out, with the property expressly carved out"],
         ["Payment", "Licence fee 12 months in advance, in USD, escalating 12%"]],
        ["Term", "Provision"], [104, 363], aligns=["l"]))
    el.append(PageBreak())

    # ================= 05 THE PLAZA =================
    sec(el, "06", "THE PRIVATE MEDICAL PLAZA", "The main event: the first floor.")
    el.append(Paragraph(
        "Abuja's senior specialists have private patients and nowhere premium to see them. They use "
        "a room attached to their hospital, a rented room in a small clinic, or they do house calls. "
        "The first floor is the first shared address in the city built to their standing: an "
        "ambulatory outpatient facility they belong to and use by the session, with no lease and no "
        "payroll.", LEDE))
    el.append(Paragraph("What actually decides it for a senior consultant", H2))
    el.append(tbl(
        [["1", "A room that matches their standing. This is the first filter and it is not negotiable"],
         ["2", "Power and cooling that never fail, and a quiet room"],
         ["3", "A trained chaperone, not a receptionist who doubles as one"],
         ["4", "Same-visit bloods and scripts, which the campus has on site"],
         ["5", "Billing and collection handled for them. Most consultants dislike collecting money"],
         ["6", "A diary that is filled. They do not want to market"],
         ["7", "Discreet parking and a waiting area their patients are comfortable in"],
         ["8", "One to three sessions a week, with no lease and no commitment to staff"]],
        ["", "In the order it is weighed"], [18, 449], aligns=["l"]))
    el.append(Spacer(1, 4))
    el.append(Paragraph("Three-part revenue", H2))
    el.append(tbl(
        [["Associate", "1,500,000", "Address and listing, member session rates, 1 included session "
                                    "a month, shared chaperone"],
         ["Full", "3,000,000", "Plus a priority booking window, 3 included sessions a month, named "
                               "room preference"],
         ["Senior Fellow", "5,000,000", "Plus a named room, priority on the early and evening bands, "
                                        "5 included sessions, procedure room at member rate, "
                                        "inclusion in campus marketing"]],
        ["1. Membership, annual and prepaid", "NGN / yr", "Includes"],
        [96, 74, 297], aligns=["r", "l"]))
    el.append(Spacer(1, 3))
    el.append(tbl(
        [["08:00 to 11:30", "3.5 hours", "58,000", "30%"],
         ["11:30 to 15:00", "3.5 hours", "58,000", "30%"],
         ["15:00 to 18:30", "3.5 hours", "80,000", "50%"],
         ["18:30 to 22:00", "3.5 hours", "88,000", "60%"],
         ["Treatment room, first floor", "per session", "180,000", "30%"],
         ["Clean procedure room, ground floor", "per session", "320,000", "25%"],
         ["Guest and ad hoc", "any band", "about 2x member", ""]],
        ["2. Sessions, per block", "Block", "NGN", "Target fill"],
        [160, 76, 116, 115], aligns=["l", "r", "r"]))
    el.append(Spacer(1, 3))
    el.append(Paragraph(
        "<b>3. Capture.</b> Every plaza patient is a candidate for a draw at the phlebotomy point and "
        "a script at the collection hatch, both of which are Medbury's own businesses at 100%. This "
        "is why the specialty mix matters more than prestige.", P))
    el.append(PageBreak())

    el.append(Paragraph("Recruit for diagnostic intensity, not for prestige", H2))
    el.append(tbl(
        [["Cardiology, endocrinology, nephrology", "High repeat visits, heaviest laboratory and "
                                                   "imaging basket on the campus"],
         ["Obstetrics, gynaecology, fertility", "Ultrasound intensive, highest willingness to pay"],
         ["Orthopaedics, rheumatology", "Imaging plus the procedure room"],
         ["ENT, dermatology, ophthalmology", "Procedure room volume, short consults, high turnover"],
         ["Gastroenterology, urology", "Diagnostics heavy, strong follow-up pattern"],
         ["Paediatrics", "Feeds the Cloister family membership"],
         ["Neurology, psychiatry", "Long consults that fill the evening bands others will not take"]],
        ["Specialty cluster", "Why it earns its room"], [178, 289], aligns=["l"]))
    el.append(Spacer(1, 5))
    el.append(Paragraph("Getting the address populated, without promising patients", H2))
    el.append(card(
        "<b>Never sell patient volume.</b> Lyfe Place builds and runs the capture mechanisms, the "
        "campus marketing, the Cloister referral flow, the diagnostics and pharmacy walk-in traffic "
        "and the corporate accounts. All of it is real and it is how the diary fills. But it belongs "
        "in the sale as what the campus does, never as a number a consultant is owed. A volume "
        "promise creates a liability Medbury cannot control and it will be produced against you at "
        "the first quiet quarter.", bg=ALERT, rule=RUST))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "The founding offer de-risks their decision through price and status instead, which costs "
        "Medbury nothing it does not already control.", P))
    el.append(Paragraph(
        "<b>One discipline to hold.</b> The membership fee is not a deposit against sessions and must "
        "never be creditable against them. Membership buys the address, the standing and the benefits "
        "listed in the tier. Sessions are paid for as they are used. The two-part tariff is the whole "
        "product, and crediting one against the other collapses it into a prepaid room rental, which "
        "is a different and much weaker business. Included sessions inside a tier are a membership "
        "benefit and are not the same thing.", P))
    el.append(tbl(
        [["Founding rate held for three years", "The first 20 pay 40% off the membership, held flat "
          "while the published rate rises. Price certainty, not a volume guarantee"],
         ["Founding session rate, for as long as they stay", "A permanently discounted per-session "
          "rate. It lowers the cost of using the address without touching what the membership is"],
         ["No minimum term in year one", "Month to month for founding members"],
         ["Named room and band priority", "First choice of room and of the early and evening bands. "
          "Status, which this buyer values highly"],
         ["Founding Fellow designation", "Permanent, on the wall and in the campus marketing"],
         ["Onboarding included", "Credentialing, billing setup, records, listing and professional "
          "photography"]],
        ["Founding cohort term", "What it is"], [152, 315], aligns=["l"]))
    el.append(Spacer(1, 5))
    el.append(Paragraph("The operating targets that make it work", H2))
    el.append(tbl(
        [["Consulting rooms", "5", "5", "5"],
         ["Members", "30", "50", "60"],
         ["Average membership fee, NGN M", "1.8", "2.3", "2.5"],
         ["Blocks sold in the year", "536", "1,180", "2,145"],
         ["Average room fill across four bands", "10%", "21%", "39%"],
         ["Conversion hub drive days sold", "40", "80", "115"],
         ["Theatre sessions", "21", "62", "138"],
         ["Campus arrivals per day, average", "18", "40", "62"],
         ["Campus arrivals on a peak drive day", "-", "-", "78"]],
        ["Target", "Year 1", "Year 2", "Year 3"],
        [239, 76, 76, 76], hi={3}))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "The 39% average fill is the assumption the whole model rests on. It is borrowed from the "
        "Harley Street in Ikoyi work and is unvalidated for Abuja. Note that it is weighted heavily "
        "to the two afternoon and evening bands at 50% and 60%, and only 30% in the mornings, which "
        "is the realistic shape for a city where senior consultants hold day jobs.", P))
    el.append(PageBreak())

    # ================= 06 PROCEDURE =================
    sec(el, "07", "PROCEDURE AND DAY CASE", "Two graded rooms, and a ground-floor theatre.")
    el.append(Paragraph(
        "A procedure room and a day case theatre are different facilities with different ventilation, "
        "power, staffing and regulation. Conflating them is how clinical projects get into trouble.", LEDE))
    el.append(tbl(
        [["Anaesthesia", "Local and topical", "Local with sedation, or general"],
         ["Ventilation", "Comfort cooling and filtered fresh air", "Positive pressure, HEPA, "
          "15 to 25 air changes an hour. Central plant"],
         ["Layout", "Single room", "Theatre plus scrub, prep, monitored recovery, dirty utility"],
         ["Recovery", "Chair, 15 to 30 minutes", "Trolley bay, monitored, 1 to 4 hours"],
         ["Staffing", "Doctor and nurse", "Surgeon, anaesthetist, scrub and circulating nurse, "
          "recovery nurse"],
         ["Space needed", "20 to 28 sqm", "55 to 80 sqm including support"],
         ["Capital", "NGN 8M to 35M", "NGN 60M to 120M"]],
        ["", "Procedure room", "Day case theatre"],
        [86, 168, 213], aligns=["l", "l"]))
    el.append(Spacer(1, 5))
    el.append(card(
        "<b>The stopper is not cost, it is evacuation.</b> A patient under sedation who deteriorates "
        "must be moved horizontally on a trolley. The first floor has no lift and stairs are not an "
        "option. <b>No sedation-dependent day case work can be done on the first floor of this "
        "building, at any budget.</b> Positive-pressure ventilation with HEPA also requires the "
        "central plant, ductwork and plant room that a converted house does not have, and isolated "
        "power supply panels are a different order of electrical work again.",
        bg=ALERT, rule=RUST))
    el.append(Spacer(1, 5))
    el.append(Paragraph("What to build instead: two graded rooms", H2))
    el.append(tbl(
        [["A. Treatment room", "First floor, 20 sqm",
          "Dermatology excisions and biopsies, cryotherapy, joint and soft-tissue injections, wound "
          "care, catheterisation, ear microsuction, IUD insertion, suture removal. Local and topical "
          "only. Procedure couch, adjustable lighting, minor sets, diathermy, clinical waste. "
          "Recovery in the chair", "8 to 12"],
         ["B. Clean procedure room", "Ground floor, 28 sqm with recovery bay",
          "Everything above, plus work needing a cleaner field, light sedation and a longer "
          "recovery. Ground floor gives level trolley access to an ambulance. Filtered supply at "
          "modest positive pressure from a dedicated unit, not theatre plant. Piped or cylinder "
          "oxygen and suction, resuscitation trolley, two recovery bays. Shared between the "
          "Conversion Clinic SPV and plaza members", "25 to 35"]],
        ["Room", "Where", "Scope and specification", "NGN M"],
        [92, 96, 219, 60], aligns=["l", "l", "r"]))
    el.append(Spacer(1, 4))
    el.append(tbl(
        [["Treatment room, first floor", "552", "30%", "180,000", "29.8"],
         ["Clean procedure room, ground floor", "552", "25%", "320,000", "44.2"],
         ["Total procedure revenue at stabilisation", "", "", "", "74.0"]],
        ["Room", "Sessions available", "Fill", "NGN / session", "NGN M / yr"],
        [163, 82, 46, 88, 88], total_row=True))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "That is NGN 74M against NGN 41M on a single room, and the shared ground-floor room earns its "
        "28 sqm out of the SPV demise because the SPV needs procedure capability for its own "
        "conversion workups.", P))
    el.append(Spacer(1, 4))
    el.append(Paragraph("If day case surgery is genuinely wanted", H2))
    el.append(tbl(
        [["Partner a nearby hospital for day case lists",
          "Recommended for phases 1 and 2. Keeps Lyfe Place to consultation, diagnostics and minor "
          "procedures, which is what the building supports", "nil"],
         ["Modular theatre unit sited on the grounds",
          "Solves ventilation, power and level access in one. Only if list volume justifies it, "
          "which it will not in the first two years", "90 to 150"],
         ["Build a theatre inside the main building",
          "Not viable. Consumes three or four of the highest-yielding rooms on the campus and still "
          "fails the evacuation test", "not recommended"]],
        ["Option", "Assessment", "NGN M"], [163, 244, 60], aligns=["l", "r"], hi={0}))

    # ================= 07 CAPITAL =================
    sec(el, "08", "CAPITAL", "Three routes, and what each costs in payback.")
    el.append(tbl(
        [["Head rent", "100", "50", "nil"],
         ["Agency, legal and caution at 15%", "15", "7.5", "7.5"],
         ["PropCo fit-out, main building", "208", "150", "120"],
         ["C4A diagnostics and structuring", "20", "20", "20"],
         ["Power system, 25KVA hybrid", "33", "8", "8"],
         ["Medbury Diagnostics: chalet, laboratory, imaging suite", "75", "75", "60"],
         ["Medbury Pharmaceuticals: boys' quarters, dispensary", "38", "38", "30"],
         ["Working capital", "95", "55", "37"],
         ["Total capital", "584", "403.5", "282.5"]],
        ["NGN M", "A  Full", "B  Optimised", "C  Minimum"],
        [239, 76, 76, 76], total_row=True))
    el.append(Spacer(1, 4))
    el.append(tbl(
        [["Payback, base case", "2.8 yrs", "2.4 yrs", "2.1 yrs"],
         ["Payback, base case plus the theatre unit at NGN 120M", "3.1 yrs", "2.6 yrs", "2.4 yrs"],
         ["Payback, conservative case", "3.9 yrs", "3.4 yrs", "3.0 yrs"]],
        ["Payback from year 0", "A  Full", "B  Optimised", "C  Minimum"],
        [239, 76, 76, 76]))
    el.append(Spacer(1, 5))
    el.append(Paragraph("The three levers between A and C", H2))
    el.append(tbl(
        [["Do not prepay two years of rent",
          "Offer a bank guarantee or a corporate guarantee for year two instead", "50 to 100"],
         ["Phase the fit-out",
          "Ground floor and six plaza rooms first, the rest funded from trading", "58 to 88"],
         ["Finance the power system",
          "Lease over five years rather than buying outright", "25"],
         ["Working capital on three months, not six",
          "Viable only because the licence fee and memberships are prepaid", "40"]],
        ["Lever", "How", "NGN M released"], [188, 219, 60], aligns=["l", "r"]))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>Route B is the recommendation.</b> Route C strips working capital and fit-out to a point "
        "where a slow first two quarters becomes a cash problem, and a half-finished plaza is the "
        "wrong first impression for the exact buyer you are recruiting. Route A prepays two years of "
        "rent for no commercial return and adds four months to payback on its own.",
        bg=ALERT, rule=RUST))
    el.append(PageBreak())

    # ================= 07 FIVE YEARS =================
    sec(el, "09", "FIVE-YEAR OUTLOOK", "Base and conservative.")
    el.append(Paragraph("Base case", H2))
    el.append(tbl(
        [["Campus revenue", "192", "445", "760", "972", "1,190"],
         ["of which the conversion hub", "80", "179", "289", "407", "519"],
         ["Mezo management fee", "12", "34", "76", "97", "119"],
         ["Mezo fee as % of revenue", "6.0%", "7.7%", "10.0%", "10.0%", "10.0%"],
         ["Campus contribution", "65", "267", "454", "620", "789"],
         ["Diagnostics and pharmacy, net of staff", "(22)", "24", "99", "122", "147"],
         ["Net contribution to Medbury", "4", "217", "471", "649", "833"],
         ["Cumulative", "4", "221", "692", "1,342", "2,175"]],
        ["NGN M", "Yr 1", "Yr 2", "Yr 3", "Yr 4", "Yr 5"],
        [186, 56, 56, 56, 56, 57], total_row=True, hi={6}))
    el.append(Spacer(1, 5))
    el.append(Paragraph("Conservative case, at 70% of the membership and fill assumptions", H2))
    el.append(tbl(
        [["Campus revenue", "158", "327", "551", "701", "857"],
         ["Mezo management fee", "9", "22", "51", "70", "86"],
         ["Campus contribution", "36", "173", "296", "412", "531"],
         ["Diagnostics and pharmacy, net of staff", "(38)", "(3)", "51", "68", "85"],
         ["Net contribution to Medbury", "(41)", "111", "281", "406", "531"],
         ["Cumulative", "(41)", "70", "351", "757", "1,288"]],
        ["NGN M", "Yr 1", "Yr 2", "Yr 3", "Yr 4", "Yr 5"],
        [186, 56, 56, 56, 56, 57], total_row=True, hi={4}))
    el.append(Spacer(1, 5))
    el.append(Paragraph(
        "Escalation of 12% a year is applied throughout. Head rent is nil in years one and two "
        "because it is prepaid at year zero, and returns from year three. Diagnostics and pharmacy "
        "are negative in year one because their staffing is in place before the patient volume "
        "arrives, which is unavoidable and should be expected.", P))
    el.append(Spacer(1, 4))
    el.append(card(
        "Both cases are <b>before companies income tax and before an FF&amp;E reserve</b>. Applying "
        "30% CIT and a 2% reserve takes the base five-year cumulative from NGN 2.18bn to roughly "
        "NGN 1.4bn, and the conservative from NGN 1.29bn to roughly NGN 0.86bn. Capital allowances "
        "on the fit-out will soften the first two years and need a tax adviser to quantify.",
        bg=SURFACE))

    # ================= 08 WHAT HAS TO BE TRUE =================
    sec(el, "10", "WHAT HAS TO BE TRUE", "In order of how much it matters.")
    el.append(tbl(
        [["1", "Sessional fill reaches 39% across 5 rooms by year three",
          "The single largest sensitivity. Borrowed from the Ikoyi model, unvalidated for Abuja. "
          "The conservative case runs it at 27%"],
         ["2", "60 senior specialists pay to belong",
          "Untested at this price point in Abuja. The three-year founding rate and the permanent "
          "founding session rate are the de-risking mechanisms, neither of which promises "
          "volume or discounts the membership itself"],
         ["3", "The head lease extends to five plus five",
          "Still the gate before any fit-out capital is released"],
         ["4", "Alameda signs at NGN 132M for the ground floor",
          "Much easier now the demise is 104 sqm rather than 46, with procedure room access. "
          "Floor remains NGN 114M"],
         ["5", "Diagnostics attach reaches 40% at a NGN 40,000 basket",
          "Validate against Medbury Diagnostics' own trading data before this is relied on"],
         ["6", "Mezo can recruit and hold a general manager of the right calibre",
          "The whole management case rests on one appointment"],
         ["7", "Change of use, FCT registration, NNRA licence, MDCN registration",
          "All conditions precedent, all unchanged from the commercial model"]],
        ["", "Assumption", "Status"], [18, 165, 284], aligns=["l", "l"]))
    el.append(Spacer(1, 6))
    el.append(Paragraph("Immediate decisions", H2))
    el.append(tbl(
        [["Capital route", "A, B or C. Recommend B at NGN 403.5M"],
         ["Mezo fee model", "Confirm model C, 6% base plus 10% of GOP, capped at 10%"],
         ["C4A appointment", "NGN 55M across three phases, 40 / 30 / 30"],
         ["Founding cohort", "Approve the 40% founding membership rate and the permanent founding session rate"],
         ["Procedure rooms", "Approve two graded rooms and rule out a theatre in this building"]],
        ["Decision", "What is needed"], [116, 351], aligns=["l"]))
    el.append(Spacer(1, 8))
    el.append(card(
        "<b>Debo Odulana</b> &nbsp; Consult for Africa &nbsp; / &nbsp; +234 913 813 8553 &nbsp; / "
        "&nbsp; hello@consultforafrica.com", bg=NAVY, fg=white))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "Figures are estimates before tax, to be set against a quantity surveyor's take-off, live "
        "session comparables and Medbury Diagnostics' own trading data. Not a binding offer, and "
        "not legal or tax advice. Companions: the commercial model, the two-page summary, the "
        "fit-out and forecast note, and the rate and area assumptions. FX USD/NGN 1,550.", SMALL))

    doc.build(el)
    print("wrote %s" % OUT)


if __name__ == "__main__":
    build()
