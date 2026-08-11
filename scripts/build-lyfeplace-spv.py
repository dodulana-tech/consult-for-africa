"""
Build "Lyfe Place Abuja: structuring the Alameda SPV" PDF.

The deal logic, as settled:
  - Alameda is a healthcare ASSET MANAGEMENT company with Al Salam in its portfolio,
    and already holds an SPV with Medbury in Port Harcourt. It is building a conversion
    clinic to feed the hospitals it manages. Its value is patient flow, not fee income.
    Conversion fees must therefore be scoped to ANY Alameda-managed facility, not just
    Al Salam, or a patient routed elsewhere in the portfolio triggers no fee at all.
  - Medbury is the Nigerian host, and its brand is what gives the venture validity.
  - The SPV is an OPERATING vehicle, not a profit vehicle. Conversion fees exist to
    sustain the conversion clinic beyond initial investment, not to generate returns.
  - Therefore this is about REVENUE SHARE at SPV level, not equity. Equity ownership
    is irrelevant because nobody intends to measure ROI by equity value.
  - Alameda must fund its share of establishment in cash, including rent and service
    charges. Beyond that the deal does not work.
  - Alameda in Egypt is the CONDUIT guaranteeing conversion fee remittances, rather than
    Al Salam acceding to the agreement. Secured by gross flow direction (Al Salam to SPV,
    then SPV pays Alameda's 10%), by paying that 10% only out of fees actually received,
    and by suspending drive windows on arrears.

Both sides' non-cash contributions get PAID as fees; equity reflects cash only:
  Alameda's patient desk and Al Salam relationship -> 10% BD service fee
  Medbury's brand, reach and Nigerian validity     -> 10% host and brand fee
  Medbury's property and infrastructure            -> rent and service charge

FOUR CONFLICTS WITH THE AGREEMENT AS DRAFTED, all needing fixing before kick-off:
  A. No revenue-share mechanism. Returns run via dividend at AGM (clause 6c) on
     simple majority (6g), which Alameda controls at 51%. It could simply never
     declare a distribution.
  B. Clause 4.3 restricts capital to establishment, incorporation, insurance and
     certification. It does not authorise fit-out, equipment, prepaid rent, service
     charge, working capital or marketing, which is most of the NGN 231M budget.
  C. Clause 8 requires pro rata funding but sets no consequence for failure to pay,
     so "Alameda must match" is unenforceable as drafted.
  D. Clause 25 exit is written for an equity-return model and references a supporting
     document that does not exist.

Output: docs/lyfeplace-abuja/lyfeplace-abuja-spv-structure-cfa.pdf
House style matches the CFA repo. Naira shown as NGN. No em dashes. FX USD/NGN 1,550.

Run:
  python3 scripts/build-lyfeplace-spv.py
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
OUT = DOCS / "lyfeplace-abuja-spv-structure-cfa.pdf"

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
    base = dict(fontName="Helvetica", fontSize=9.0, leading=12.2, textColor=BODY,
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
LEDE = style("lede", fontSize=9.8, leading=14, textColor=HexColor("#374151"))
SMALL = style("small", fontSize=7.6, leading=10.2, textColor=MUTED)
CELL = style("cell", fontSize=8.1, leading=10.5)
CELL_R = style("cellr", fontSize=8.1, leading=10.5, alignment=2)
CELL_B = style("cellb", fontSize=8.1, leading=10.5, fontName="Helvetica-Bold", textColor=NAVY)
CELL_BR = style("cellbr", fontSize=8.1, leading=10.5, fontName="Helvetica-Bold",
                textColor=NAVY, alignment=2)
CELL_W = style("cellw", fontSize=8.1, leading=10.5, fontName="Helvetica-Bold", textColor=white)
CELL_WR = style("cellwr", fontSize=8.1, leading=10.5, fontName="Helvetica-Bold",
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
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 20, "Structuring the Alameda SPV")
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
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
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
        title="Lyfe Place Abuja - Structuring the Alameda SPV",
        author="Consult for Africa",
    )
    doc.addPageTemplates([PageTemplate(
        id="p", frames=[Frame(MARGIN, 30, FULLW, PAGE_H - 42 - 30, id="f")],
        onPage=page_bg)])

    el = []
    el.append(Paragraph("Structuring the Alameda SPV",
                        style("t", fontName="Helvetica-Bold", fontSize=18, leading=21,
                              textColor=NAVY, spaceAfter=2)))
    el.append(Paragraph("Revenue share, not equity. And four things to fix before kick-off.",
                        style("st", fontName="Helvetica-Oblique", fontSize=10.5, leading=13,
                              textColor=GOLD, spaceAfter=7)))

    sec(el, "01", "THE DEAL LOGIC", "The SPV is an operating vehicle, not a profit vehicle.")
    el.append(Paragraph(
        "Alameda is a healthcare asset management company with Al Salam in its portfolio, and it already "
        "holds an SPV with Medbury in Port Harcourt. It is building a conversion clinic to feed the "
        "hospitals it manages, and those hospitals earn the treatment margin entirely outside the SPV. Medbury is the Nigerian host, and its brand is "
        "what gives the venture validity in this market. On that reading the SPV exists to make the "
        "conversion clinic operate, and the conversion fee exists to sustain it beyond initial "
        "investment. It is not there to generate returns for either shareholder.", LEDE))
    el.append(card(
        "<b>Which is why equity is the wrong axis, and I was wrong to keep pushing on it.</b> Neither "
        "party should look to the SPV's bottom line. Alameda's return is the patients delivered to "
        "Cairo. Medbury's return is rent, service charge, a host and brand fee, and the diagnostics "
        "and pharmacy capture, all contracted and all outside the SPV's profit line. Structure it that "
        "way and the 49/51 split can be conceded without losing anything.", bg=PANEL))

    sec(el, "02", "THE REVENUE SHARE", "Both sides' non-cash contributions get paid as fees.")
    el.append(tbl(
        [["Alameda", "The patient desk, protocols, destination coordination, the Al Salam "
          "relationship", "10% BD and patient desk fee"],
         ["Medbury", "Brand, reach, credibility, Nigerian validity", "10% host and brand fee"],
         ["Medbury", "Property, imaging, laboratory, reception, nursing, credentialing",
          "Rent and service charge"],
         ["Both", "Cash into the SPV, pro rata", "Equity, which nobody looks to for return"]],
        ["Party", "Non-cash contribution", "How it is paid"],
        [58, 250, 159], aligns=["l", "l"]))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "<b>The 10 / 10 symmetry is the negotiating position.</b> You take 10% for the patient desk, "
        "we take 10% for the brand and the host platform, and neither of us touches the residual. It "
        "is easy to explain, hard to argue with, and it removes the equity split from the "
        "conversation entirely.", P))
    el.append(Spacer(1, 4))
    el.append(Paragraph("The waterfall, at three conversion fee levels", H2))
    el.append(tbl(
        [["Conversion fee income", "167", "251", "335"],
         ["Alameda BD and patient desk fee, 10%", "(17)", "(25)", "(33)"],
         ["Medbury host and brand fee, 10%", "(17)", "(25)", "(33)"],
         ["Rent and service charge to The Lyfe Place", "(95)", "(95)", "(95)"],
         ["SPV direct operating costs", "(45)", "(45)", "(45)"],
         ["Residual, retained to sustain the clinic", "(6)", "61", "128"],
         ["Medbury contracted take, fee plus rent", "112", "120", "128"],
         ["plus diagnostics and pharmacy capture, 100%", "~40", "~40", "~40"],
         ["MEDBURY TOTAL, none dividend-dependent", "152", "160", "168"]],
        ["NGN M a year, 108 treated cases", "Fee at 10%", "Fee at 15%", "Fee at 20%"],
        [239, 76, 76, 76], total_row=True, hi={5}))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>Rent and conversion fee are coupled and must be negotiated together.</b> The rent is NGN "
        "95M because The Lyfe Place funded the fit-out, and three independent derivations support "
        "it. But at a 10% conversion fee the residual turns negative and the clinic cannot carry "
        "that rent. <b>NGN 95M requires at least a 13% fee.</b> At 15%, mid-range for international "
        "facilitation, it works comfortably. Conceding the fee while holding the rent simply "
        "starves the clinic Medbury is hosting.", bg=ALERT, rule=RUST))
    el.append(PageBreak())

    sec(el, "03", "WHAT KENYA TELLS US", "They own that one outright.")
    el.append(Paragraph(
        "The business plan Alameda shared is for their <b>Kenyan</b> conversion clinic, and it sets "
        "out how that business makes money. Two things about it matter more than the numbers "
        "inside it.", LEDE))
    el.append(tbl(
        [["Kenya", "Alameda owns the clinic outright. No local partner, no joint venture"],
         ["Nigeria", "Alameda wants 51% of a joint venture, with Medbury hosting it, funding half of "
          "it, and lending the brand that makes it credible"]],
        ["", "Structure"], [76, 391], aligns=["l"]))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>That asymmetry is the negotiating position.</b> Medbury is being asked to supply the two "
        "things Alameda did not need to buy in Kenya, a local brand and a local facility, and to take "
        "a minority for doing it. The fair test is straightforward: <b>show us what the Kenyan clinic "
        "earns and costs, and Nigeria will be priced so your economics are comparable after paying "
        "for what you get free in Kenya.</b> That is hard to refuse and it settles the rent and the "
        "fee at the same time.", bg=PANEL))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "It also explains something about the conversion fee. In Kenya the clinic and the hospitals "
        "sit under common ownership, so money moves internally and <b>there may be no conversion fee "
        "at all</b>. Asking what they pay in Kenya may simply get \"we own it\". If so, the fee has "
        "no internal benchmark and has to be constructed rather than copied.", P))
    el.append(Spacer(1, 4))
    el.append(Paragraph("What to extract from the Kenyan plan", H2))
    el.append(tbl(
        [["1", "Is the screening consult free, or billed?",
          "<b>The single most important question in the pile.</b> See below"],
         ["2", "Actual conversion rate, not the projection",
          "The model assumes 4%. If Kenya has two years of trading, its actual rate is worth more "
          "than every other assumption combined"],
         ["3", "Average treatment invoice by specialty",
          "The model assumes USD 10,000 flat. Specialty mix moves this several-fold"],
         ["4", "Local revenue lines beyond conversion",
          "Consultations, diagnostics, procedures. Whatever Kenya bills, Abuja should bill"],
         ["5", "Cost structure and headcount",
          "Tests the NGN 45M of SPV operating cost assumed here"],
         ["6", "Drives per year, specialists per drive, patients per day",
          "Tests the whole drive model and the reception throughput ceiling"]],
        ["", "Extract", "Why"], [16, 172, 279], aligns=["l", "l"]))
    el.append(Spacer(1, 4))
    el.append(Paragraph("Why question 1 decides the conversion fee", H2))
    el.append(tbl(
        [["Consults free, fee at 10%", "167", "nil", "(6)", "Cannot carry the rent"],
         ["Consults free, fee at 13%", "218", "nil", "34", "Works, just"],
         ["Consults billed at NGN 50,000, fee at 10%", "167", "134", "128", "Works comfortably"],
         ["Consults billed at NGN 75,000, fee at 10%", "167", "202", "196", "Works very comfortably"]],
        ["Scenario", "Conv fee", "Local", "Residual", "Verdict"],
        [163, 56, 46, 56, 146], aligns=["r", "r", "r", "l"], hi={0}))
    el.append(Spacer(1, 3))
    el.append(Paragraph("NGN M a year, after Alameda's 10%, Medbury's 10%, NGN 95M rent and NGN 45M "
                        "of operating cost.", SMALL))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>If the screening consult is billed at even NGN 50,000, a 10% conversion fee works and the "
        "13% floor disappears.</b> If it is free, the fee has to be 13% or more simply to cover the "
        "rent. Billed consults also lift the diagnostics capture, which is 100% Medbury's, because a "
        "paying patient completes the workup. Establish this before conceding anything on the fee.",
        bg=ALERT, rule=RUST))
    el.append(PageBreak())

    sec(el, "03", "THE MATCHING TEST", "What Alameda has to bring, in cash.")
    el.append(Paragraph(
        "The property stays in Lyfe Place PropCo and is leased to the SPV, so it is not an equity "
        "contribution at all. Both shareholders then fund establishment in cash, pro rata. This is "
        "what it costs to become operational.", P))
    el.append(tbl(
        [["Working capital: coordinators, nurse, admin, 12 months", "48.0", "21%"],
         ["Service charge cover, 6 months at NGN 71.8M a year", "35.9", "15%"],
         ["Clinical equipment, furniture, IT, telemedicine", "32.0", "14%"],
         ["Pre-opening marketing and referral base building", "30.0", "13%"],
         ["Clinical fit-out of the demise, beyond base building", "24.0", "10%"],
         ["Prepaid rent, 12 months, Alameda's USD 15,000 property line", "23.2", "10%"],
         ["Credentialing, MDCN, immigration, regulatory setup", "18.0", "8%"],
         ["Contingency at 10%", "21.0", "9%"],
         ["Establishment budget", "232.1", ""]],
        ["Where the money goes", "NGN M", "Share"], [325, 66, 76], total_row=True))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>NGN 232M is USD 149,700 against the USD 152,000 already stated in clause 4.2. It fits, "
        "but only because the service charge is paid monthly rather than prepaid.</b> Prepaying "
        "twelve months of the full NGN 95M occupancy pushes the budget to NGN 272M and breaks the "
        "stated capital by NGN 36M. That is a drafting instruction to Medbury's lawyer, not a "
        "renegotiation with Alameda.", bg=PANEL))
    el.append(Spacer(1, 4))
    el.append(tbl(
        [["49 / 51, as drafted", "113.7", "118.4", "76,400"],
         ["50 / 50", "116.0", "116.0", "74,900"]],
        ["Split", "Medbury NGN M", "Alameda NGN M", "Alameda USD"],
        [148, 106, 106, 107]))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>Only NGN 56M of the NGN 232M, or 24%, is capital in the ordinary sense.</b> The rest is "
        "occupancy, working capital and market entry. This is a trading start-up dressed as a capex "
        "project and it should be funded and monitored as one: monthly management accounts against "
        "the drawdown schedule, not a single transfer and an annual audit. <b>Whether Alameda funds "
        "NGN 118M in cash, on schedule, is the test of whether this is real.</b>", bg=ALERT, rule=RUST))

    sec(el, "04", "WHAT THE AGREEMENT SAYS INSTEAD", "Four conflicts, all fixable before kick-off.")
    el.append(tbl(
        [["A", "No revenue-share mechanism exists at all",
          "Returns run through dividends approved at the AGM under clause 6(c), by simple majority "
          "of share capital under 6(g). Alameda controls that at 51% and could simply never declare "
          "a distribution. <b>This alone would defeat the whole structure.</b> Insert the waterfall "
          "as a binding schedule and make the fee agreements conditions of the JV, not side letters"],
         ["B", "Clause 4.3 restricts what the capital may be spent on",
          "It authorises establishment, incorporation, security and insurance, and certification "
          "compliance. It does <b>not</b> authorise fit-out, equipment, prepaid rent, service charge, "
          "working capital or marketing, which is most of the NGN 231M. Rewrite 4.3 to the actual "
          "budget with a drawdown schedule"],
         ["C", "Clause 8 sets no consequence for failing to fund",
          "It requires funding on the agreed contribution ratio and stops there. Without a default "
          "remedy, dilution, a shareholder loan at a commercial rate, or a termination right, "
          "\"Alameda must match\" is unenforceable"],
         ["D", "Clause 25 exit is written for an equity-return model",
          "Exit on \"full recovery of all capital invested and any agreed returns as per the terms of "
          "this Agreement and supporting document\". No such supporting document exists, and if "
          "returns are revenue-share the language creates an unquantifiable obligation"]],
        ["", "Conflict", "What it says, and the fix"], [16, 168, 283], aligns=["l", "l"]))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "Still outstanding from the earlier review and unchanged in importance: clause 24.I gives "
        "termination for convenience on 30 days' notice, and the reserved matters referred to in 6(g) "
        "are never defined.", P))
    el.append(Paragraph("Securing the remittance, with Alameda as the conduit", H2))
    el.append(Paragraph(
        "Alameda guarantees remittance rather than Al Salam acceding to the agreement. That uses a "
        "party who has already signed, and because Alameda manages the paying hospitals it has real "
        "standing to procure payment, which makes the covenant more than a promise. It still needs "
        "teeth.", P))
    el.append(tbl(
        [["1", "Direction of flow",
          "The fee runs <b>Al Salam to the SPV, then the SPV pays Alameda its 10%</b>. Never Al Salam "
          "to Alameda and the net onward. An intermediary's instinct is to receive, deduct and remit the "
          "balance, and if Alameda holds the tap the waterfall is decorative"],
         ["2", "Alameda's 10% paid only from fees received",
          "No receipt, no fee. Self-executing, costs nothing, needs no third party. The single most "
          "effective term available"],
         ["3", "Access suspends on arrears",
          "Drive windows suspended if remittances run more than 30 days overdue. Alameda's whole "
          "purpose is patient access, so this bites the same week. Worth more in practice than the "
          "arbitration clause"],
         ["4", "Joint conversion register, signed monthly",
          "So the amount owed is never in dispute. Established from the first patient, not "
          "reconstructed later"],
         ["5", "Standby LC or Al Salam parent guarantee",
          "A rolling six months of expected fees. Guarantor rather than party is a lighter ask than "
          "accession and more likely to be accepted"],
         ["6", "Arbitration as backstop only",
          "Lagos seat under clause 29, enforceable in Egypt under the New York Convention. Legally "
          "sound but slow and expensive, so it should never be the primary remedy"]],
        ["", "Safeguard", "Why"], [16, 150, 301], aligns=["l", "l"]))
    el.append(Spacer(1, 4))
    el.append(card(
        "One upside worth flagging to the tax adviser: the SPV earns <b>USD income from Egypt</b>. "
        "That is inbound foreign exchange and an export of services from Nigeria, attractive on both "
        "counts and probably VAT zero-rated with the right documentation.", bg=PANEL))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>These are Medbury's own drafting to fix.</b> The agreement was prepared by Medbury's "
        "lawyer, so amendments A to D are an instruction to your own counsel rather than a "
        "negotiation with Alameda. That makes them fast and cheap, and there is no reason for any of "
        "them to survive to signature. <b>Sequence for kick-off.</b> Amendments A to D are conditions "
        "precedent, not post-signature tidying. A, B and C are the ones that decide whether Medbury "
        "ever sees money: without A the residual is Alameda's to withhold, without B the capital "
        "cannot lawfully be spent on what the clinic needs, and without C there is no way to compel "
        "Alameda to fund at all.", bg=ALERT, rule=RUST))
    el.append(PageBreak())

    sec(el, "05", "THE CASH", "How Medbury actually gets paid, not what its shares are worth.")
    el.append(tbl(
        [["Rent and service charge", "The Lyfe Place, wholly owned", "95.0",
          "Lease commencement", "Contracted"],
         ["Medbury Diagnostics capture", "60% attach, NGN 45,000 basket", "32.7",
          "First drive", "Volume"],
         ["Host and brand fee", "10% of conversion fees, at a 15% fee", "25.1",
          "Month 6 to 12", "Fee-dependent"],
         ["Medbury Pharmaceuticals capture", "35% attach, NGN 15,000 basket", "4.0",
          "First drive", "Volume"],
         ["SPV dividend", "Alameda controls distribution at 51%", "nil",
          "Assume never", "Assume zero"],
         ["Total cash to Medbury", "", "156.8", "", ""]],
        ["Channel", "Basis", "NGN M/yr", "Starts", "Nature"],
        [116, 138, 54, 82, 77], total_row=True, aligns=["l", "r", "l", "l"]))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "That is gross cash in. It is not what Medbury keeps, because NGN 70.2M of it is consumed "
        "providing the space. Netting that off, and adding back the NGN 10M of amortisation inside it "
        "which is not a cash cost:", P))
    el.append(tbl(
        [["Gross cash channels, from above", "156.8", ""],
         ["Less cost of providing the space", "(70.2)", "Head rent, power, payroll, maintenance and "
          "amortisation, at the 38% share attributable to the Conversion Clinic"],
         ["Add back amortisation, not a cash cost", "10.0", ""],
         ["Less admin on the brand fee", "(2.0)", ""],
         ["Net cash margin to Medbury", "94.6", ""]],
        ["NGN M a year", "Amount", "Note"], [176, 62, 229], total_row=True, aligns=["r", "l"]))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>NGN 95M of net cash a year, and none of it a dividend.</b> Medbury gets paid as a "
        "landlord and as a diagnostics and pharmacy business, not as a shareholder. Against NGN 113.7M "
        "for its 49% of establishment that is a <b>1.2 year payback</b>. The dividend line is "
        "deliberately nil: Alameda controls distribution at 51% under clause 6(c), and the residual is "
        "meant to sustain the clinic anyway. Plan for zero.", bg=PANEL))
    el.append(Spacer(1, 4))
    el.append(Paragraph("Outside pharmacy and diagnostics", H2))
    el.append(tbl(
        [["Cash margin on rent", "34.9", "NGN 95M less NGN 70.2M of cost, plus NGN 10M of "
          "amortisation added back"],
         ["Host and brand fee, net", "23.1", "Near-pure margin, no direct cost attached"],
         ["Core cash margin", "58.0", "The relationship stripped of the ancillary businesses"],
         ["Diagnostics and pharmacy capture", "36.7", "39% of the total, and Alameda has no claim "
          "on any of it"],
         ["Total", "94.7", ""]],
        ["Line", "NGN M", "Note"], [176, 62, 229], total_row=True, aligns=["r", "l"], hi={2}))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>Thirty-nine percent of Medbury's cash return comes from two businesses that are not in "
        "the agreement at all.</b> Strip them out and the relationship returns NGN 58M a year on "
        "NGN 113.7M of capital: a two year payback and 51% cash-on-cash. Still worth doing, but it is "
        "then a property deal with a brand fee attached rather than a healthcare venture. <b>Which "
        "makes the first-call clause on diagnostics and pharmacy worth more than any term currently "
        "being negotiated in the joint venture.</b> It is not in the draft.", bg=ALERT, rule=RUST))
    el.append(Spacer(1, 4))
    el.append(Paragraph("When the cash actually arrives", H2))
    el.append(Paragraph(
        "Money leaves a joint venture and reaches a shareholder by only a few routes, and most of "
        "them are shut here.", P))
    el.append(tbl(
        [["Dividend", "Clause 6(c), at the AGM, on a simple majority of share capital under 6(g). "
          "<b>Alameda decides at 51%.</b> Medbury cannot compel one", "Assume shut"],
         ["Shareholder loan repayment", "Not available. Clause 4.2 puts the capital in as equity, "
          "not as a loan", "Shut"],
         ["Payment for services", "Rent, service charge and the host and brand fee. The pot paying "
          "a supplier", "<b>Open from day one</b>"],
         ["Return of capital", "Only on winding up, clause 25", "Not an income"],
         ["Share sale or buy-back", "Clause 26. An exit", "Not an income"]],
        ["Route", "Mechanism", "Status"], [110, 279, 78], aligns=["l", "l"], hi={2}))
    el.append(Spacer(1, 4))
    el.append(tbl(
        [["Month 0", "Medbury funds its 49% of the pot", "(113.7)", "(113.7)"],
         ["Month 0", "Pot prepays 12 months rent to The Lyfe Place", "23.2", "(90.5)"],
         ["Months 1 to 12", "Service charge at NGN 5.98M a month", "71.8", "(18.7)"],
         ["Months 6 to 12", "Host and brand fee, few conversions yet", "10.0", "(8.7)"],
         ["Year 2", "Rent 23.2, service charge 71.8, brand fee 25.1", "120.1", "111.4"]],
        ["When", "What", "NGN M", "Cumulative"],
        [82, 245, 66, 74], total_row=True, aligns=["l", "r", "r"]))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>Medbury is out of pocket by only NGN 8.7M at the end of year one, and fully repaid by "
        "about month thirteen.</b> The first cash comes back within weeks, because the pot's first "
        "act is to prepay twelve months of rent. After that it pays roughly NGN 6M a month of "
        "service charge. None of it is a distribution and none of it needs Alameda's agreement, "
        "because it is the pot paying a supplier rather than rewarding a shareholder.", bg=PANEL))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>The pot never has to declare a dividend for Medbury to get its money back. It only has "
        "to stay alive long enough to keep paying rent and service charge.</b> That is a far lower "
        "bar than profitability and distribution, and it is the whole reason for putting Medbury's "
        "return in supplier agreements rather than in equity. The residual accumulating in the pot, "
        "about NGN 61M a year at a 15% fee, should be treated as the clinic's working capital and "
        "not as money coming to Medbury.", bg=ALERT, rule=RUST))
    el.append(Spacer(1, 4))

    el.append(Paragraph("The flaw in calling the rent contracted", H2))
    el.append(Paragraph(
        "Rent is only as good as the SPV's ability to pay it. If conversions do not happen the SPV "
        "has no income and cannot pay, so \"contracted\" is conditional in a way a normal lease is "
        "not. <b>Year one is covered</b>, because the establishment capital carries twelve months of "
        "prepaid rent and six months of service charge, and Alameda co-funds 51% of that. Beyond year "
        "one it is exposed, and one of the following should close it.", P))
    el.append(tbl(
        [["Alameda parent guarantee on the rent", "Cleanest. Ties the covenant to the asset manager "
          "rather than to the trading vehicle"],
         ["A rolling six-month rent and service charge deposit", "Topped up quarterly. Costs Alameda "
          "working capital but needs no parent-level approval"],
         ["A shareholder funding obligation", "With the default remedy from amendment C, so failure "
          "to fund dilutes rather than simply stalls"]],
        ["Option", "Assessment"], [186, 281], aligns=["l"], hi={0}))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "Any of the three converts the rent from something that depends on the clinic trading well "
        "into cash Medbury can bank on. Without one of them, only the diagnostics and pharmacy "
        "capture is genuinely unconditional, and that is NGN 37M rather than NGN 157M.", P))
    el.append(PageBreak())

    sec(el, "05", "FOUR AGREEMENTS", "Each doing one job.")
    el.append(tbl(
        [["1. Conversion Fee Agreement", "Alameda and the SPV",
          "A fee per converted and treated patient as a percentage of the treatment invoice. "
          "Recommend 15% with a USD floor per case. <b>Destination defined as any facility owned, "
          "operated, managed or advised by Alameda or its affiliates</b>, not Al Salam alone, or a "
          "patient routed elsewhere in the portfolio triggers no fee. Alameda covenants as conduit to "
          "procure and guarantee remittance. Joint register, audit rights, minimum volume with a "
          "shortfall payment"],
         ["2. BD and Patient Desk Services", "The SPV and Alameda",
          "The patient desk, protocols, destination coordination and clinical liaison, at 10% of "
          "conversion fees collected. Arm's length and deductible, and it names Alameda for what it is"],
         ["3. Host, Brand and Services Licence", "Lyfe Place and the SPV",
          "Rooms, imaging, laboratory, reception, nursing, credentialing and coordination, plus the "
          "Medbury brand licence. Rent at Alameda's USD 15,000 property line, services and the 10% "
          "host and brand fee charged to the SPV"],
         ["4. Amended and Restated JV", "Medbury and Alameda",
          "Carries amendments A to D, the waterfall schedule, the funding default remedy, defined "
          "reserved matters, and the deletion of clause 24.I"]],
        ["Agreement", "Between", "What it does"],
        [116, 86, 265], aligns=["l", "l"]))

    sec(el, "06", "THE FIRST TWO YEARS", "One relationship, run properly.")
    el.append(Paragraph(
        "The multi-group conversion hub is a year-three option and is deliberately not the focus. Two "
        "years of running Alameda well is what proves the model and earns the right to replicate it.", P))
    el.append(tbl(
        [["Before kick-off", "Amendments A to D signed. Alameda's remittance covenant and the six "
          "safeguards in place. Conversion fee percentage stated. Alameda's NGN 118M committed on a "
          "drawdown schedule with a default remedy"],
         ["Months 1 to 6", "Fit out. Credential the first cohort. Open with two drives. Establish "
          "the conversion register from the first patient, not retrospectively"],
         ["Months 7 to 12", "Four to six drives. Build a local referral base that generates consults "
          "independently of Alameda's own marketing"],
         ["Year 2", "Six to eight drives. Evidence the conversion rate and prove the fee mechanism "
          "actually pays. Measure the diagnostics attach rate properly"],
         ["Year 3", "Only then consider a second international group, on a tested template"]],
        ["Period", "What matters"], [104, 363], aligns=["l"]))
    el.append(Spacer(1, 8))
    el.append(card(
        "<b>Debo Odulana</b> &nbsp; Consult for Africa &nbsp; / &nbsp; +234 913 813 8553 &nbsp; / "
        "&nbsp; hello@consultforafrica.com", bg=NAVY, fg=white))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "Conversion volumes, rates and average treatment invoices are assumptions from the drive model "
        "and must be confirmed with Alameda and Al Salam. The 15% conversion fee is benchmarked to "
        "general international facilitation practice, not to Al Salam's own terms, which have not been "
        "seen. Clause references are to the draft joint venture agreement as supplied. Not a binding "
        "offer, and not legal or tax advice. FX USD/NGN 1,550.", SMALL))

    doc.build(el)
    print("wrote %s" % OUT)


if __name__ == "__main__":
    build()
