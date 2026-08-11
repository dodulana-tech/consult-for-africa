"""
Build "Lyfe Place Abuja: rental review and flex" PDF.

A review of the whole plan as it now stands, focused on what the rentals should
be and how much room there is to move.

Two consequences of recent decisions that had not been carried through:
  1. Medbury Diagnostics took the guest chalet, which was Medlyfe's. Medlyfe now
     has no home and its NGN 36.5M lease has silently left the model.
  2. With Medlyfe gone and diagnostics and pharmacy treated as facility rather
     than tenants, only TWO occupiers pay rent. Break-even moves from about 6% of
     stabilised plaza utilisation to about 26%.

Three pricing findings:
  A. The Conversion Clinic at NGN 68M sits BELOW its allocated cost of NGN 70M.
     It is underpriced, not overpriced. The SPV waterfall supports NGN 95M to
     112M at a 15% conversion fee.
  B. Band pricing is inverted against the Ikoyi benchmark (NGN 18,167/hr).
     Evening is 29% above Lagos per hour and carries 46% of session revenue.
     Daytime and afternoon are 16% below.
  C. Memberships are 25% of campus revenue on no benchmark at all.

Net flex position: NGN 43M of upward room in the underpriced lines covers the
NGN 36M of downward room likely to be conceded on the overpriced ones.

Output: docs/lyfeplace-abuja/lyfeplace-abuja-rentals-cfa.pdf
House style matches the CFA repo. Naira shown as NGN. No em dashes. FX USD/NGN 1,550.

Run:
  python3 scripts/build-lyfeplace-rentals.py
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
OUT = DOCS / "lyfeplace-abuja-rentals-cfa.pdf"

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
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 20, "Rental review and flex")
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
        title="Lyfe Place Abuja - Rental review and flex",
        author="Consult for Africa",
    )
    doc.addPageTemplates([PageTemplate(
        id="p", frames=[Frame(MARGIN, 30, FULLW, PAGE_H - 42 - 30, id="f")],
        onPage=page_bg)])

    el = []
    el.append(Paragraph("Rental review and flex",
                        style("t", fontName="Helvetica-Bold", fontSize=18, leading=21,
                              textColor=NAVY, spaceAfter=2)))
    el.append(Paragraph("What the rates should be, and how far they can move.",
                        style("st", fontName="Helvetica-Oblique", fontSize=10.5, leading=13,
                              textColor=GOLD, spaceAfter=7)))

    # 01
    sec(el, "01", "TWO LOOSE ENDS", "Consequences of recent decisions, not yet carried through.")
    el.append(card(
        "<b>Medlyfe has no home.</b> Medbury Diagnostics took the guest chalet, which was Medlyfe's. "
        "The laboratory alone fills all 80 sqm, so there is nothing left in it. Medlyfe's NGN 36.5M "
        "lease has quietly left the model and nobody decided that it should.", bg=ALERT, rule=RUST))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "The obvious fix is worse than the problem. Three first-floor rooms at NGN 456,000 per sqm "
        "would yield about NGN 26M, but those same rooms sold sessionally earn about NGN 88M. "
        "<b>Leasing to Medlyfe would destroy NGN 62M of value.</b> Recommend Medlyfe does not take "
        "space in phase one and buys sessions like every other user, which is the same conclusion "
        "already reached for The Cloister.", P))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>Break-even has moved a long way.</b> With Medlyfe gone and diagnostics and pharmacy "
        "treated as facility rather than tenants, only two occupiers pay anything. Fixed lease income "
        "is now the Conversion Clinic alone at NGN 68M against a fixed cost base of NGN 185.5M. "
        "Break-even moves from the 6% of stabilised plaza utilisation quoted earlier to about "
        "<b>26%</b>. Still safe, but a materially different risk profile, and the earlier headline "
        "should not be repeated.", bg=ALERT, rule=RUST))

    # 02
    sec(el, "02", "WHAT PAYS", "Two occupiers, and the cost each has to carry.")
    el.append(tbl(
        [["The Conversion Clinic", "132", "38%", "70.2", "68.0", "(2.2)"],
         ["Plaza, 9 consulting rooms", "169", "48%", "89.8", "430.3", "340.5"],
         ["Clean procedure room", "28", "8%", "14.9", "44.2", "29.3"],
         ["Treatment room", "20", "6%", "10.6", "29.8", "19.2"],
         ["", "349", "", "185.5", "572.3", "386.8"]],
        ["Occupier", "sqm", "share", "Allocated cost", "Revenue", "Margin"],
        [148, 44, 44, 82, 74, 74], total_row=True, hi={0}))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>The Conversion Clinic at NGN 68M sits below its allocated cost of NGN 70M.</b> That "
        "figure was set in the SPV waterfall as a plausible-looking number and never tested against "
        "what the space costs to provide. It is underpriced, not overpriced, and the fit-out is why.",
        bg=ALERT, rule=RUST))
    el.append(Spacer(1, 5))
    el.append(Paragraph("Why the fit-out changes the benchmark", H2))
    el.append(Paragraph(
        "The standard lease terms in the original Medbury deck say <b>fit-out is tenant funded</b>. "
        "Here The Lyfe Place funds it. So a conventional per-sqm comparable is the wrong benchmark "
        "entirely, because the comparable tenant paid for its own. The rent has to carry that "
        "capital and earn a return on it.", P))
    el.append(tbl(
        [["Share of PropCo fit-out", "61.3", "Ground floor is 40% of the building, the Conversion "
          "Clinic 66% of the ground floor"],
         ["Share of the 25KVA power system", "12.5", "By let-bearing area"],
         ["Share of rent prepay, agency, legal and caution", "43.5", "By let-bearing area"],
         ["Capital attributable to its space", "117.3", "Deployed by The Lyfe Place, not by the SPV"]],
        ["Capital deployed", "NGN M", "Basis"], [176, 52, 239], total_row=True, aligns=["r", "l"]))
    el.append(Spacer(1, 4))
    el.append(Paragraph("Three derivations, independently", H2))
    el.append(tbl(
        [["A", "Allocated operating cost plus a return on capital",
          "NGN 70.2M + 20% on NGN 117.3M", "93.7"],
         ["B", "Bare lease plus fit-out annuity plus the serviced element",
          "NGN 56.1M at NGN 425k/sqm + NGN 14.6M fit-out over 10 years at 20% + NGN 22M for "
          "reception, nursing, credentialing and imaging access", "92.7"],
         ["C", "What the SPV waterfall carries at a 15% conversion fee",
          "From the structuring note", "95 to 112"],
         ["", "<b>Recommend NGN 95M</b>", "NGN 719,700 per sqm, or 1.7x a conventional medical "
          "suite, which the serviced element and the landlord-funded fit-out both justify", "95.0"]],
        ["", "Method", "Working", "NGN M"], [16, 148, 240, 63], total_row=True, aligns=["l", "l", "r"]))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>But rent and conversion fee are coupled, and the rent cannot be raised in isolation.</b> "
        "At NGN 95M the clinic needs at least a <b>13% conversion fee</b> to leave anything behind to "
        "sustain itself. At a 10% fee the residual is negative by NGN 6M and the clinic cannot carry "
        "its own rent. Negotiate the two together or neither number means anything.", bg=PANEL))

    # 03
    sec(el, "03", "BAND PRICING", "Inverted against the only benchmark we have.")
    el.append(Paragraph(
        "The Ikoyi work priced a six-hour consulting session at NGN 109,000, which is NGN 18,167 an "
        "hour. That is the only comparable in the house and Abuja should not sit far from it.", P))
    el.append(tbl(
        [["Early, 07:00 to 09:00", "44,000", "2", "22,000", "+21%", "36,300", "38.3"],
         ["Daytime, 09:00 to 13:00", "61,000", "4", "15,250", "-16%", "72,700", "60.6"],
         ["Afternoon, 13:00 to 17:00", "61,000", "4", "15,250", "-16%", "72,700", "53.0"],
         ["Evening, 17:00 to 21:00", "94,000", "4", "23,500", "+29%", "72,700", "128.4"]],
        ["Band", "Rate", "Hrs", "NGN/hr", "vs Ikoyi", "Parity", "NGN M/yr"],
        [116, 56, 30, 54, 56, 56, 98], hi={3}))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "<b>Evening is 29% above Lagos per hour and carries 46% of session revenue.</b> It is "
        "simultaneously the least defensible rate and the one the model leans on hardest, which is "
        "the wrong combination. Daytime and afternoon sit 16% below Lagos, and that is correct rather "
        "than an error: they are the weak bands at 35% to 40% fill and they need to be cheap. Do not "
        "raise them to close the gap, because price is not what is holding them back.", P))

    # 04
    sec(el, "04", "FLEX, LINE BY LINE", "Floor, target, ceiling.")
    el.append(tbl(
        [["Conversion Clinic licence", "NGN 70M", "NGN 68M", "NGN 112M",
          "<b>None down. NGN 44M up.</b> Below its own cost, and the SPV waterfall carries NGN 95M "
          "to 112M at a 15% conversion fee"],
         ["Evening block", "NGN 40k", "NGN 94k", "NGN 73k",
          "<b>NGN 21k down.</b> Target already exceeds the defensible ceiling. Full concession costs "
          "NGN 28.7M a year"],
         ["Early block", "NGN 19k", "NGN 44k", "NGN 36k",
          "<b>NGN 8k down.</b> Also above Lagos per hour. Full concession costs NGN 7.0M"],
         ["Daytime and afternoon", "NGN 26k", "NGN 61k", "NGN 73k",
          "NGN 12k up on paper, but do not take it. These bands are demand-constrained, not "
          "price-constrained"],
         ["Clean procedure session", "NGN 108k", "NGN 480k", "NGN 550k",
          "<b>NGN 70k up.</b> Cost-plus with the anaesthetist passed through. Worth NGN 9.7M"],
         ["Treatment room session", "NGN 64k", "NGN 180k", "NGN 220k",
          "<b>NGN 40k up.</b> Worth NGN 6.6M"],
         ["Membership, per member", "n/a", "NGN 2.5M", "unknown",
          "Untested in either direction. 25% of campus revenue resting on no benchmark at all"]],
        ["Line", "Floor", "Target", "Ceiling", "Flex, and what it is worth"],
        [110, 48, 50, 50, 253], aligns=["r", "r", "r", "l"], hi={0, 6}))
    el.append(Spacer(1, 5))
    el.append(card(
        "<b>The net position is comfortable.</b> There is about <b>NGN 43M of upward room</b> in the "
        "underpriced lines, against about <b>NGN 36M of downward room</b> likely to be conceded on "
        "the overpriced ones. The raises more than cover the concessions, so the campus can absorb a "
        "full negotiation on session rates without moving break-even, provided the Conversion Clinic "
        "licence is corrected at the same time.", bg=PANEL))

    # 05
    sec(el, "05", "CONCENTRATION", "Where the revenue actually sits.")
    el.append(tbl(
        [["All four session bands", "280.3", "47%", "Fill assumptions borrowed from Ikoyi, "
          "unvalidated for Abuja"],
         ["Memberships", "150.0", "25%", "60 members at NGN 2.5M. No benchmark, no pilot, no "
          "signed member"],
         ["Evening band alone", "128.4", "21%", "The single most exposed line: highest rate, "
          "thinnest justification"],
         ["Clean procedure room", "71.8", "12%", "Depends on the anaesthetist roster being filled"],
         ["The Conversion Clinic", "68.0", "11%", "Contracted, but below cost and dependent on the "
          "conversion fee being agreed at all"]],
        ["Line", "NGN M", "Share", "Exposure"],
        [122, 50, 44, 295], aligns=["r", "r", "l"], hi={1}))
    el.append(Spacer(1, 3))
    el.append(Paragraph(
        "<b>Memberships and the evening band together are 46% of campus revenue</b>, and both rest on "
        "the same unproven proposition: that Abuja's senior consultants will pay a premium to hold an "
        "evening list at a private address. If that is wrong, it is wrong for both lines at once. "
        "That correlation is the real risk in this model, not the break-even percentage.", P))

    # 06
    sec(el, "06", "WHAT TO DO", "Four moves, in order.")
    el.append(tbl(
        [["1", "Raise the Conversion Clinic licence to NGN 95M, against a 13% floor on the conversion fee",
          "From NGN 68M. Three independent derivations land between NGN 93M and 96M. The two numbers move together, so do not concede the fee and hold the rent"],
         ["2", "Hold the evening rate at NGN 94,000 but expect to concede",
          "Open there, keep NGN 21k in reserve, and concede it against a longer membership commitment "
          "rather than for nothing"],
         ["3", "Decide Medlyfe explicitly",
          "Recommend it buys sessions rather than takes space. Do not let a NGN 36.5M line disappear "
          "by accident"],
         ["4", "Pilot the membership before the model relies on it",
          "Ten founding members signed at NGN 2.5M before fit-out completes would validate a quarter "
          "of campus revenue. Nothing else in the plan is cheaper to test"]],
        ["", "Move", "Why"], [20, 168, 279], aligns=["l", "l"]))
    el.append(Spacer(1, 5))
    el.append(card(
        "<b>Debo Odulana</b> &nbsp; Consult for Africa &nbsp; / &nbsp; +234 913 813 8553 &nbsp; / "
        "&nbsp; hello@consultforafrica.com", bg=NAVY, fg=white))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "Cost allocation is by let-bearing sqm, a convention rather than the only defensible one. The "
        "Ikoyi rate is a Lagos figure and the only in-house comparable. Fill, membership pricing and "
        "conversion volumes remain unvalidated for Abuja. Not a binding offer. FX USD/NGN 1,550.", SMALL))

    doc.build(el)
    print("wrote %s" % OUT)


if __name__ == "__main__":
    build()
