"""
Build the INTERNAL pricing case PDF for the Lyfe Place Abuja mandate.

Debo asked for a readable copy of docs/lyfeplace-abuja/cfa-medipark-pricing-case-INTERNAL.md.
Same content, CFA house style, but deliberately marked INTERNAL in rust rather
than navy so it cannot be mistaken for the client-facing proposal sitting beside
it in the same folder.

NEVER SEND THIS TO MEDBURY. It contains CFA's cost to serve, its margin, its
floor and the reasoning behind the anchor.

Output: docs/lyfeplace-abuja/cfa-medipark-pricing-case-INTERNAL.pdf

Run:
  python3 scripts/build-cfa-pricing-case.py
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
OUT = DOCS / "cfa-medipark-pricing-case-INTERNAL.pdf"

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
DEEPRUST = HexColor("#7A3F14")

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
                textColor=RUST, spaceAfter=2)
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
    c.setFillColor(DEEPRUST)
    c.rect(0, PAGE_H - 30, PAGE_W, 30, fill=1, stroke=0)
    c.setFillColor(RUST)
    c.rect(0, PAGE_H - 33, PAGE_W, 3, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(MARGIN, PAGE_H - 20, "INTERNAL  /  CFA ONLY  /  NOT FOR MEDBURY")
    c.setFillColor(HexColor("#E8D2BE"))
    c.setFont("Helvetica", 8)
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 20, "Lyfe Place Abuja  /  pricing the mandate")
    c.setFillColor(RUST)
    c.rect(MARGIN, 26, 20, 2, fill=1, stroke=0)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 7.3)
    c.drawString(MARGIN, 15, "Internal to Consult for Africa. Contains cost to serve, margin and the floor.")
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
        title="INTERNAL - Lyfe Place Abuja - pricing the mandate",
        author="Consult for Africa")
    doc.addPageTemplates([PageTemplate(
        id="p", frames=[Frame(MARGIN, 30, FULLW, PAGE_H - 42 - 30, id="f")], onPage=page_bg)])
    el = []

    el.append(Paragraph("What CFA should charge for Lyfe Place Abuja",
                        style("t", fontName="Helvetica-Bold", fontSize=19, leading=22,
                              textColor=NAVY, spaceAfter=2)))
    el.append(Paragraph("And why. The case for the price, argued from CFA's side.",
                        style("st", fontName="Helvetica-Oblique", fontSize=11, leading=14,
                              textColor=RUST, spaceAfter=7)))
    el.append(card(
        "<b>Internal. Debo and CFA only.</b> The client-facing proposal and the negotiation ladder "
        "are separate documents. Rates below are my assumptions and need your correction. They are "
        "set out role by role rather than buried, because the whole case rests on them.",
        bg=ALERT, rule=RUST))

    # ---------------- 01 ----------------
    sec(el, "01", "THE DECISION", "What to charge.")
    el.append(Paragraph(
        "<b>Charge NGN 249M of setup fees, a base of 10% of campus-wide revenue, an incentive of 15% "
        "of contribution above a 20% cash-on-cash hurdle, and take 15% of the holding company.</b> "
        "Over five years that is worth about <b>NGN 967M</b> to CFA: NGN 749M of margin plus roughly "
        "NGN 168M of equity value.", LEDE))
    el.append(tbl(
        [["1", "Ten per cent is derivable, and here is the derivation",
          "Not the benchmark band, which is somebody else's number. <b>A 10% base produces a 38% "
          "gross margin on the cost of running the operation.</b> Eight per cent produces 23%, which "
          "is thin for a services business. Twelve produces 49%, which looks greedy. Professional "
          "services run 35 to 50%. Section 04"],
         ["2", "But at a 10% base the incentive has to come down",
          "Base and incentive are substitutes. A 10% base with a full 20% incentive takes <b>80% of "
          "the value the mandate creates</b>, and she will do that sum. At 15% over a 20% hurdle it "
          "is 74%, CFA still earns more than it would at an 8% base, and the structure survives "
          "scrutiny"],
         ["3", "Your restructure is worth NGN 30M a year at an unchanged fee to her",
          "Committee instead of a campus director, two territory BDOs on the central commercial "
          "function instead of a facility lead, agency retainer into reimbursed marketing. Cost to "
          "serve falls from NGN 135M to NGN 105M. That is not a saving to pass on, it is margin"],
         ["4", "The campus opex in the medipark model was understated by NGN 47M a year",
          "Costing the establishment properly found it. Medbury's take before fee falls from NGN 594M "
          "to NGN 547M, which is better found now than found by her"],
         ["5", "The most valuable term is still not a percentage",
          "It is the right to re-size the team if revenue disappoints, and it is now worth more, "
          "because more of the cost base is CFA's to flex"]],
        ["", "The five things that decide whether it holds", "Why"],
        [16, 168, 283], aligns=["l", "l"], hi={0, 1}))

    # ---------------- 02 ----------------
    sec(el, "02", "MEZO", "Resolved.")
    el.append(Paragraph(
        "Mezo has no company registration, so it runs as a CFA product and service offering. "
        "<b>CFA contracts directly and the mandate is delivered by the Mezo team.</b> No fee split, "
        "no separate vehicle, CFA keeps 100% of the NGN 967M. This supersedes the earlier business "
        "case, which named Mezo Health as manager at 6% plus 10% of gross operating profit.", P))
    el.append(tbl(
        [["Name Mezo in the client-facing proposal as CFA's facility operations practice",
          "It gives the operating capability a name, which is what makes \"CFA is an operator\" "
          "credible rather than assertive. It costs nothing"],
         ["Put an assignment clause in the management agreement",
          "Permitting CFA to novate to a wholly owned subsidiary. When Mezo is incorporated you will "
          "want the contract to move without asking her permission"]],
        ["Both cheap now, expensive to retrofit", "Why"], [186, 281], aligns=["l"]))

    # ---------------- 03 ----------------
    sec(el, "03", "THE FULL ESTABLISHMENT", "Every role, and who carries it.")
    el.append(Paragraph(
        "Business-unit clinical staff, the aesthetic physician, nurse injectors, family physicians, "
        "infusion nurses, FUE technicians, laboratory scientists, radiographer and pharmacist, are "
        "<b>not</b> here. They sit inside each business unit's own P&amp;L.", P))
    el.append(tbl(
        [["Partner and director oversight, chairs the campus committee", "1", "2.20", "26.4", "CFA"],
         ["Central commercial and growth function, 20%", "1", "0.60", "7.2", "CFA"],
         ["Clinical governance and compliance lead, 30%", "1", "0.55", "6.6", "CFA"],
         ["Finance and billing oversight, 30%", "1", "0.36", "4.3", "CFA"],
         ["Analyst and management information, 30%", "1", "0.18", "2.2", "CFA"],
         ["HR and recruitment coordination, 15%", "1", "0.15", "1.8", "CFA"],
         ["Operations manager, senior on-site lead", "1", "1.50", "18.0", "CFA"],
         ["BDO, clinician uptake, territory mandate", "1", "0.45", "5.4", "CFA"],
         ["BDO, patient and corporate uptake, territory mandate", "1", "0.45", "5.4", "CFA"],
         ["On-costs at 25%, travel, systems, office", "", "", "27.3", "CFA"],
         ["CFA cost to serve", "", "", "104.6", ""],
         ["Care coordinator, navigation across the six units", "1", "0.60", "7.2", "Reimbursed"],
         ["Front office supervisor", "1", "0.45", "5.4", "Reimbursed"],
         ["Receptionists and booking clerks", "3", "0.25", "9.0", "Reimbursed"],
         ["Billing and collections clerks", "1.5", "0.30", "5.4", "Reimbursed"],
         ["Medical records clerk", "1", "0.22", "2.6", "Reimbursed"],
         ["Campus nursing pool", "3", "0.45", "16.2", "Reimbursed"],
         ["Healthcare assistants", "2", "0.20", "4.8", "Reimbursed"],
         ["Sterilisation and CSSD technician", "1", "0.28", "3.4", "Reimbursed"],
         ["Facilities and maintenance technician", "1", "0.35", "4.2", "Reimbursed"],
         ["Driver and logistics, specimen runs", "1", "0.20", "2.4", "Reimbursed"],
         ["On-costs at 25%", "", "", "15.2", "Reimbursed"],
         ["Reimbursed to Medbury", "", "", "75.8", ""],
         ["Security, 24/7 including the gate house", "4", "0.20", "9.6", "Contracted"],
         ["Cleaning and housekeeping", "4", "0.15", "7.2", "Contracted"],
         ["Clinical waste collection and disposal", "1", "0.35", "4.2", "Contracted"],
         ["Contracted", "", "", "21.0", ""],
         ["Full campus establishment", "", "", "201.4", ""]],
        ["Role", "Heads", "NGN M/mo", "/yr", "Who pays"],
        [212, 38, 56, 51, 66], total_row=True, aligns=["r", "r", "r", "l"],
        hi={10, 22, 26}, sub={11, 23}))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>Two roles are worth arguing about.</b> The <b>care coordinator</b> is the medipark's "
        "actual differentiator: the person who makes six businesses feel like one visit, and without "
        "it the campus is a building with tenants. It sits in the reimbursed pool because it is "
        "patient-facing and scales with volume, with CFA specifying, recruiting, training and "
        "supervising. That takes NGN 9M off CFA's cost while keeping control. Own it outright and "
        "the base needs half a point more. The <b>two BDOs</b> are at NGN 450k base against a NGN "
        "1.2M market rate, with the balance on commission for clinician sign-ups and membership and "
        "patient volume. That converts NGN 18M of fixed cost into cost that only bites when it is "
        "working, which is the correct instrument for a territory mandate.", bg=PANEL))

    el.append(PageBreak())

    # ---------------- 04 ----------------
    sec(el, "04", "THE BASE FEE", "Derived from what CFA actually runs.")
    el.append(Paragraph("What is under management", H2))
    el.append(tbl(
        [["Campus-wide revenue", "1,697", ""],
         ["Operating expenditure under management", "1,150", "68% of revenue"],
         ["of which cost of goods: drugs, reagents, consumables, implants, stock", "400", ""],
         ["operating expenditure excluding goods", "750", ""],
         ["Contribution the operation produces", "547", ""],
         ["CFA cost to serve", "104.6", "9.1% of the opex under management"]],
        ["", "NGN M", "Note"], [239, 76, 152], aligns=["r", "l"], hi={5}, sub={4}))
    el.append(Spacer(1, 4))
    el.append(Paragraph("What a decent fee on that looks like", H2))
    el.append(tbl(
        [["6%", "101.8", "8.9%", "13.6%", "(2.8)", "(3%)"],
         ["8%", "135.8", "11.8%", "18.1%", "31.2", "23%"],
         ["10%", "169.7", "14.8%", "22.6%", "65.1", "38%"],
         ["12%", "203.6", "17.7%", "27.2%", "99.0", "49%"]],
        ["Base", "NGN M", "% of opex", "% of opex ex-goods", "CFA margin", "Gross margin"],
        [46, 66, 86, 106, 82, 81], hi={2}))
    el.append(Spacer(1, 3))
    el.append(card(
        "<b>The last column is the derivation.</b> Professional services businesses run a 35 to 50% "
        "gross margin. Eight per cent gives CFA 23%, which is thin for a business that carries a "
        "team, an office and delivery risk. Twelve gives 49%, which is at the top and looks it. "
        "<b>Ten gives 38%, and that is where the base should sit.</b> It is derived from CFA's own "
        "cost of running the operation rather than borrowed from a comparator band, which makes it "
        "far easier to defend and impossible to dismiss as a made-up percentage.", bg=PANEL))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "<b>On the opex ratio, a warning.</b> Ten per cent of revenue is 14.8% of the full opex "
        "under management, which is defensible: CFA negotiates the reagent placements, the "
        "consignment terms and the equipment leases, so cost of goods genuinely is under management. "
        "But strip cost of goods out and the same fee is 22.6% of what remains, which is harder to "
        "hold. <b>The percentage of revenue and the gross margin are the two tests that survive "
        "scrutiny. Use the opex ratio as an internal cross-check and do not lead with it in front of "
        "her</b>, because the first thing a finance director does is choose the denominator that "
        "suits them.", P))
    el.append(Spacer(1, 4))
    el.append(Paragraph("Why the incentive must come down when the base goes up", H2))
    el.append(tbl(
        [["8% base, 20% incentive over a 15% hurdle", "208.3", "12.3%", "103.7", "338.7", "71%"],
         ["10% base, 20% incentive over a 15% hurdle", "235.5", "13.9%", "130.9", "311.5", "80%"],
         ["10% base, 15% incentive over a 20% hurdle", "216.6", "12.8%", "112.0", "330.4", "74%"],
         ["10% base, 10% incentive over a 20% hurdle", "201.0", "11.8%", "96.4", "346.0", "68%"],
         ["12% base, flat, no incentive at all", "203.6", "12.0%", "99.0", "343.4", "69%"]],
        ["Structure", "CFA/yr", "% rev", "CFA margin", "Medbury", "CFA share of value created"],
        [148, 52, 46, 62, 56, 103], hi={2}))
    el.append(Spacer(1, 3))
    el.append(card(
        "<b>Base and incentive are substitutes, and the binding constraint is the share of value "
        "created.</b> The mandate creates NGN 294M a year over the session-let alternative. A 10% "
        "base with a full 20% incentive takes 80% of it, and she will run that arithmetic. "
        "<b>Ten plus fifteen over a twenty per cent hurdle takes 74%, still earns CFA more than an "
        "8% base with a richer incentive, and survives the conversation.</b> Note also the last row: "
        "a flat 12% with no incentive earns almost exactly what 8%-plus-incentive earns, with none "
        "of the hurdle risk. Keep it in your pocket for a client who would rather pay a known number "
        "and keep all the upside.", bg=ALERT, rule=RUST))

    # ---------------- 05 ----------------
    sec(el, "05", "THE OPEX CORRECTION", "What honest costing found.")
    el.append(tbl(
        [["On-site payroll", "45.0", "75.8", "30.8"],
         ["Security, cleaning, waste, insurance, internet", "15.0", "31.0", "16.0"],
         ["Campus opex understated by", "", "", "46.8"]],
        ["", "Modelled", "Costed", "Short"], [239, 76, 76, 76], total_row=True))
    el.append(Spacer(1, 3))
    el.append(Paragraph(
        "The old figure assumed a normal clinic. This runs <b>07:00 to 21:00, six days, across two "
        "floors and six businesses</b>, which needs three receptionists rather than one and a real "
        "nursing pool.", P))
    el.append(tbl(
        [["To Medbury before fee", "594", "547"],
         ["Value CFA creates", "321", "274"],
         ["CFA's incentive at stabilisation, at 15% over a 20% hurdle", "56", "47"]],
        ["Consequences, absorbed now rather than discovered later", "Was", "Now"],
        [315, 76, 76]))
    el.append(Spacer(1, 3))
    el.append(card(
        "The honest net of today's two changes: <b>the restructure saves CFA NGN 30M of cost, the "
        "correction costs CFA NGN 9M of incentive. Net plus NGN 21M a year, and a model that will "
        "survive her finance director.</b>", bg=PANEL))

    # ---------------- 06 ----------------
    sec(el, "06", "CFA'S FIVE YEARS", "Revenue, cost, margin.")
    el.append(tbl(
        [["Setup", "252.0", "55.0", "197.0", "78%"],
         ["Year 1", "121.6", "73.2", "48.4", "40%"],
         ["Year 2", "204.6", "104.6", "100.0", "49%"],
         ["Year 3", "252.1", "104.6", "147.5", "59%"],
         ["Year 4", "252.1", "104.6", "147.5", "59%"],
         ["Year 5", "213.8", "104.6", "109.2", "51%"],
         ["Five-year margin", "", "", "749", ""],
         ["Plus equity", "", "", "218", ""],
         ["Total value to CFA", "", "", "967", ""]],
        ["NGN M", "Revenue", "Cost", "Margin", "%"],
        [163, 76, 76, 76, 76], total_row=True, sub={6}, hi={8}))
    el.append(Spacer(1, 3))
    el.append(Paragraph(
        "Year one improves from 22% to 54% because the team is phased against the ramp rather than "
        "hired on day one: the operations manager from month minus two, the first BDO at opening, "
        "the second at month six. <b>Setup is still 24% of the five-year margin and the least risky "
        "part of it. Do not trade setup fees cheaply to win the recurring mandate.</b>", P))

    # ---------------- 07 ----------------
    sec(el, "07", "THE EQUITY", "What the 15% actually attaches to.")
    el.append(tbl(
        [["The campus services company only", "~87", "~43"],
         ["The holding company consolidating all six businesses", "~339", "~168"]],
        ["The 15% is of", "It earns", "15% at 3.3x"], [315, 76, 76], hi={1}))
    el.append(Spacer(1, 3))
    el.append(card(
        "Same words, <b>NGN 125M of difference</b>. Ask for the holding company and expect to be "
        "pushed to something in between, most likely the campus company plus a carried interest in "
        "the clinical entities CFA establishes. <b>Whatever is agreed, define it in the term sheet "
        "and not in the shareholders' agreement, because by then the answer is hers.</b>",
        bg=ALERT, rule=RUST))

    # ---------------- 08 ----------------
    sec(el, "08", "THE DOWNSIDE", "And the term that protects it.")
    el.append(Paragraph(
        "Campus at 60% of plan: revenue about NGN 1,018M, contribution to Medbury about NGN 121M "
        "before fee. The incentive is nil: contribution after the base fee is NGN 19M against a NGN 65M hurdle.", P))
    el.append(tbl(
        [["Old cost base, 134.8", "140.1", "134.8", "+5.3"],
         ["Restructured, 104.6", "140.1", "104.6", "+35.5"],
         ["Restructured, with the team re-sized", "140.1", "68.6", "+71.5"]],
        ["", "CFA revenue", "CFA cost", "CFA margin"], [239, 76, 76, 76], hi={2}))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>A 10% base is what makes the bad case survivable at all.</b> At 8% and the old cost base "
        "this table was a NGN 15M loss. That matters more than the base-case margin, because it is what stops a seven-year lock-in becoming a "
        "seven-year liability. <b>Negotiate hard for the re-sizing right:</b> an explicit ability to "
        "reduce the on-site team against agreed service levels if campus revenue falls more than 20% "
        "below the approved annual plan. It is a clause, not a percentage, it is worth about three "
        "points on the base fee, and if she refuses it the base goes to 10% and you say why at the "
        "time.", bg=PANEL))

    # ---------------- 09 ----------------
    sec(el, "09", "CFA'S CASH", "And the one hard floor.")
    el.append(tbl(
        [["Mobilisation on signature", "25.0"],
         ["Entity establishment kickoff, 4 x 5.5", "22.0"],
         ["Licence fees on grant", "24.0"],
         ["Cash in", "71.0"],
         ["Delivery team, design and procurement, 6 months", "(55.0)"],
         ["Net", "16.0"]],
        ["Setup period", "NGN M"], [383, 84], total_row=True, sub={3}))
    el.append(Spacer(1, 3))
    el.append(card(
        "<b>Mobilisation cannot go below NGN 25M and cannot be refundable.</b> Below that CFA funds "
        "Medbury's design and procurement from its own working capital. Given the Abuja property "
        "search already ran without contractual alignment, hold this term first and hardest.",
        bg=ALERT, rule=RUST))

    el.append(PageBreak())

    # ---------------- 10 ----------------
    sec(el, "10", "WHY IT MATTERS", "Beyond its own P&L.")
    el.append(Paragraph(
        "The Group Strategy Office retainer is NGN 54M a year at roughly 40% margin: about NGN 108M "
        "over five years on comparable senior bandwidth. <b>This mandate is worth about 9.2 times "
        "that.</b>", LEDE))
    el.append(Paragraph(
        "It also does what the retainer cannot. The retainer pays for your attention and ends when "
        "it ends. This builds an operating capability with a name, a team and a track record, which "
        "is the thing you sell again. She has a stated ambition to run a platform of five to ten "
        "hospitals, and the proposal carries a first right over further Medbury facilities.", P))
    el.append(card(
        "<b>Which is why the price here sets five prices.</b> At the anchor, five sites over ten "
        "years is a business. At the floor, it is five loss-making mandates consuming every senior "
        "person CFA has. The first-right clause converts a pricing error into a structural one.",
        bg=PANEL))
    el.append(Spacer(1, 3))
    el.append(Paragraph(
        "If the price cannot be got right, the better outcome is a narrower mandate: delivery and "
        "establishment only, hand over on commissioning, no management fee, no equity, no first "
        "right. Roughly NGN 200M one-off and nothing recurring. <b>Keep it on the table, because it "
        "is what makes the recurring fee negotiable at all.</b>", P))

    el.append(PageBreak())

    # ---------------- 11 ----------------
    sec(el, "11", "THE RATIONALISATION TEST", "Can she say it out loud.")
    el.append(Paragraph(
        "She will want to be fair. That is not the constraint. The constraint is that she has to be "
        "able to <b>explain this</b>, to herself, to her finance director, to a board, and to BU "
        "leads who will ask why an outside firm is being paid to run something Medbury owns. "
        "<b>A price that is defensible under interrogation but cannot be narrated in five sentences "
        "does not get signed.</b>", LEDE))
    el.append(Paragraph("Where the price fails the test as it stands", H2))
    el.append(tbl(
        [["6% base, 20% over a 15% hurdle", "(18)", "407", "348", "Year 2", "181", "77"],
         ["8% base, 15% over a 20% hurdle", "(66)", "374", "341", "Year 2", "188", "83"],
         ["10% base, 15% over a 20% hurdle, as proposed", "(78)", "341", "359", "Year 3", "217", "112"],
         ["12% base, flat, no incentive", "(78)", "308", "325", "Year 3", "204", "99"]],
        ["What Medbury keeps", "Yr 1", "Yr 2", "Yr 3", "Her payback", "CFA fee", "CFA margin"],
        [162, 44, 46, 46, 60, 52, 57], hi={2}))
    el.append(Spacer(1, 3))
    el.append(card(
        "<b>At a 10% base her payback slips from year two to year three, and that is the one thing "
        "that stops this being signed.</b> It has almost nothing to do with the level of the fee. It "
        "is that the NGN 10M monthly floor and the deferred setup instalments both land in year one, "
        "while the campus is still ramping and producing NGN 80M of cash. Getting her capital back "
        "fast is the entire reason she is doing this, so a structure that quietly moves it a year "
        "later fails on the only measure she named.", bg=ALERT, rule=RUST))
    el.append(Spacer(1, 4))
    el.append(Paragraph("The fix costs CFA nothing at stabilisation", H2))
    el.append(tbl(
        [["Drop the year-one base floor from NGN 10M to NGN 7M a month", "The percentage is "
          "unchanged. Only the floor moves, and only in year one"],
         ["Start the deferred delivery and establishment instalments in year two",
          "They currently begin at opening, which is the worst possible month for her"],
         ["Result", "Year 1 (18), Year 2 341, Year 3 312. <b>Payback back inside year two.</b> CFA "
          "still earns NGN 217M a year and NGN 112M of margin at stabilisation"]],
        ["Change", "Effect"], [210, 257], aligns=["l"], hi={2}))
    el.append(Spacer(1, 3))
    el.append(Paragraph(
        "It is <b>pure timing</b>. CFA gives up about NGN 74M of year-one cash and takes it back "
        "across years two to five, and the stabilised economics are identical. In exchange her plan "
        "does the one thing she said she wanted it to do. <b>That is the difference between a "
        "negotiation and a signature</b>, and it is the cheapest concession in the whole structure.",
        P))
    el.append(Spacer(1, 4))
    el.append(Paragraph("The frame to use: five sentences she can say to anyone", H2))
    el.append(tbl(
        [["1", "We put in NGN 284M before the doors open, on top of the rent already paid"],
         ["2", "It returns about NGN 312M a year after paying CFA everything"],
         ["3", "Our capital is back in year two"],
         ["4", "CFA's fee is NGN 217M, of which NGN 105M is the team running the campus. Their "
          "margin is NGN 112M"],
         ["5", "<b>Of what the campus produces for us, we keep 74% and CFA keeps 26%</b>"]],
        ["", "What she says"], [18, 449], aligns=["l"], hi={4}))
    el.append(Spacer(1, 3))
    el.append(Paragraph(
        "The 74 / 26 split is the number to lead with, and it is legitimate rather than a trick: the "
        "NGN 105M of team cost is her campus's operating cost whoever employs those people, so "
        "measuring CFA's margin against her contribution is the fair comparison. Every one of the "
        "five sentences is something she would be comfortable saying in a board meeting.", P))
    el.append(Spacer(1, 4))
    el.append(Paragraph("The frame to drop", H2))
    el.append(card(
        "<b>Take the value-created section out of the client-facing proposal.</b> It was my framing "
        "and it is the weakest thing in the document. It measures the medipark against a session-let "
        "alternative she was never going to execute, because executing it needs the operator "
        "capability she is buying. And run the other way the same arithmetic says <b>CFA takes 74% "
        "of the increment</b>: true, defensible, and completely unsayable in a board meeting. "
        "<b>Never put a number in a document that reads well in only one direction.</b> Her finance "
        "director will find the other one.", bg=ALERT, rule=RUST))

    # ---------------- 12 ----------------
    sec(el, "12", "RECOMMENDATION", "And the floor.")
    el.append(tbl(
        [["Delivery fee, fixed", "90", "78"],
         ["Capital efficiency share", "20% of saving, cap 50", "15%, cap 35"],
         ["Establishment", "22 per entity + 6 on licence", "18, licence folded in"],
         ["Management base", "10%, floor NGN 7M/mo in year one", "8%, floor NGN 7M/mo"],
         ["Incentive", "15% above a 20% hurdle", "10% above a 20% hurdle"],
         ["Equity", "15% of the holding company", "10%, campus company"],
         ["Team re-sizing right", "Required", "Or hold the base at 12% flat"],
         ["Deferred setup instalments", "Start in year two, not at opening", "Non-negotiable. It is what protects her payback"],
         ["Mobilisation", "25, non-refundable", "No floor below this"],
         ["CFA margin, stabilised", "112/yr plus equity", "~62/yr plus equity"]],
        ["", "Recommended", "Floor"], [163, 152, 152],
        total_row=True, aligns=["l", "l"], hi={3, 6}))
    el.append(Spacer(1, 3))
    el.append(Paragraph(
        "<b>The floor has moved up twice today.</b> It was 6%, then 6.5% once the costing got honest, "
        "and it is now 8%, because 8% is the point at which the management service earns a 23% gross "
        "margin and below that CFA is running a NGN 1.7Bn operation for less than it costs a "
        "professional services firm to exist. Note the re-sizing fallback has changed too: if she "
        "will not grant it, take a flat 12% with no incentive rather than a higher base with one, "
        "because in the downside the incentive is worth nothing anyway.", P))

    # ---------------- 12 ----------------
    sec(el, "13", "WHAT I NEED FROM YOU", "To firm this up.")
    el.append(tbl(
        [["1", "The nine CFA rates in section 03",
          "Particularly the operations manager at NGN 1.5M, whether NGN 450k plus commission will "
          "attract two competent BDOs in Abuja, and whether partner oversight at NGN 2.2M a month "
          "reflects what this really takes from you given there is no campus director"],
         ["2", "Who sits on the campus committee, and how often",
          "If it is monthly with a weekly operations call, the partner load is real and probably "
          "more than NGN 2.2M a month. <b>This is the one place your restructure could cost more "
          "than it saves</b>"],
         ["3", "Care coordinator: CFA or reimbursed",
          "NGN 9M, and a question about who owns the campus's differentiating role"],
         ["4", "What the 15% attaches to", "NGN 125M rides on it. Section 07"],
         ["5", "Whether the aesthetics JV's 8% is switched off for Abuja",
          "And if so whether CFA is compensated elsewhere for giving it up"],
         ["6", "The reimbursed and contracted rates in section 03",
          "They are Medbury's cost, not CFA's, but they reduce her contribution and therefore CFA's "
          "incentive, so they are worth getting right on our side before her finance director does "
          "it for us"]],
        ["", "Open", "Why"], [16, 148, 303], aligns=["l", "l"], hi={1, 3}))
    el.append(Spacer(1, 6))
    el.append(card(
        "<b>Companions.</b> &nbsp; cfa-medipark-mandate-cfa.pdf, client-facing, still at a 6% base "
        "and NGN 594M pre-fee, both of which move if you accept sections 04 and 05. &nbsp; "
        "cfa-medipark-pricing-guide-PRIVATE.md, the concession ladder and the answers to her "
        "pushback.", bg=NAVY, fg=white, rule=GOLD))

    doc.build(el)
    print("wrote %s" % OUT)


if __name__ == "__main__":
    build()
