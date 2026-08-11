"""
Build the Lyfe Place Abuja position note for Dr Itunu Akinware.

Two pages. Current on everything as of this build, and written to supersede the
earlier engagement note and summary, both of which now carry stale figures (the
NGN 132M Alameda licence, equity-based returns, the conversion hub as a near-term
line).

The finding it exists to deliver: with the conversion clinic paused and Medlyfe
displaced from the guest chalet by the laboratory, THERE IS NO CONTRACTED INCOME
LEFT. Break-even moves to about 35% of stabilised plaza revenue, all of it
usage-based. Earlier notes quoted 6% and then 26%, both on lease income that no
longer exists. That reframes the critical path from lease terms to proven demand,
and is why the consultant survey matters.

Output: docs/lyfeplace-abuja/lyfeplace-abuja-position-cfa.pdf
House style matches the CFA repo. Naira shown as NGN. No em dashes.

Run:
  python3 scripts/build-lyfeplace-position.py
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
OUT = DOCS / "lyfeplace-abuja-position-cfa.pdf"

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
                alignment=TA_LEFT, spaceAfter=5)
    base.update(kw)
    return ParagraphStyle(name, **base)


Q = style("q", fontName="Helvetica-Bold", fontSize=11.5, leading=14.5, textColor=NAVY,
          spaceBefore=8, spaceAfter=4)
H2 = style("h2", fontName="Helvetica-Bold", fontSize=9.6, leading=12.6, textColor=TEAL,
           spaceBefore=7, spaceAfter=3)
P = style("p")
SMALL = style("small", fontSize=7.5, leading=10, textColor=MUTED)
CELL = style("cell", fontSize=8.2, leading=10.8)
CELL_R = style("cellr", fontSize=8.2, leading=10.8, alignment=2)
CELL_B = style("cellb", fontSize=8.2, leading=10.8, fontName="Helvetica-Bold", textColor=NAVY)
CELL_BR = style("cellbr", fontSize=8.2, leading=10.8, fontName="Helvetica-Bold",
                textColor=NAVY, alignment=2)
CELL_W = style("cellw", fontSize=8.2, leading=10.8, fontName="Helvetica-Bold", textColor=white)
CELL_WR = style("cellwr", fontSize=8.2, leading=10.8, fontName="Helvetica-Bold",
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
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 20, "Where we are  /  Consult for Africa")
    c.setFillColor(GOLD)
    c.rect(MARGIN, 26, 20, 2, fill=1, stroke=0)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 7.4)
    c.drawString(MARGIN, 15, "Private and confidential  /  Prepared for Dr Itunu Akinware, Group CEO")
    c.drawRightString(PAGE_W - MARGIN, 15, "Page %d of 2" % doc.page)
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
        ("TOPPADDING", (0, 0), (-1, -1), 3.2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3.2),
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


def build():
    doc = BaseDocTemplate(
        str(OUT), pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN, topMargin=44, bottomMargin=32,
        title="Lyfe Place Abuja - where we are",
        author="Consult for Africa",
    )
    doc.addPageTemplates([PageTemplate(
        id="p", frames=[Frame(MARGIN, 32, FULLW, PAGE_H - 44 - 32, id="f")], onPage=page_bg)])

    el = []
    el.append(Paragraph("Lyfe Place Abuja",
                        style("t", fontName="Helvetica-Bold", fontSize=19, leading=22,
                              textColor=NAVY, spaceAfter=2)))
    el.append(Paragraph("Where we are, and the one number that has changed.",
                        style("st", fontName="Helvetica-Oblique", fontSize=11, leading=14,
                              textColor=GOLD, spaceAfter=7)))

    el.append(Paragraph("1.  What the building gives you", Q))
    el.append(Paragraph(
        "Four structures, 711 sqm gross, 519 sqm of usable rooms. Measured from the as-built "
        "drawings and to be confirmed against the CAD.", P))
    el.append(tbl(
        [["Consulting rooms", "9", "7 upstairs, 2 on the ground floor"],
         ["Hair transplant suite", "1", "All-day single-patient cases"],
         ["Procedure rooms", "2", "One sedation-capable, ground floor, level ambulance access"],
         ["Imaging", "3", "Digital X-ray, ultrasound, echocardiography"],
         ["Laboratory", "1", "The guest chalet, in full"],
         ["Pharmacy", "1", "The boys' quarters, with a collection point in the main building"],
         ["Ceiling", "98 a day", "What one reception can move across a 07:00 to 21:00 window"]],
        ["", "", ""], [128, 62, 277], aligns=["r", "l"], hi={6}))
    el.append(Spacer(1, 3))
    el.append(Paragraph(
        "That is a serious ambulatory facility. What the building will not support, at any budget, "
        "is a theatre, an inpatient bed, or sedation above ground level, because there is no lift "
        "and a sedated patient must be evacuated horizontally.", P))

    el.append(Paragraph("2.  What it costs, and what it returns", Q))
    el.append(tbl(
        [["Head rent, two years in advance", "100"],
         ["Agency, legal and caution at 15%", "15"],
         ["Fit-out, light-touch on a sound building", "232"],
         ["Power, 25KVA hybrid solar", "33"],
         ["Laboratory and pharmacy units", "52"],
         ["Working capital, six months", "95"],
         ["Total capital", "527"]],
        ["Capital, NGN M", "Amount"], [383, 84], total_row=True))
    el.append(Spacer(1, 3))
    el.append(tbl(
        [["Sessions, 9 rooms at 41% fill", "280.3"],
         ["Memberships, 60 at NGN 2.5M", "150.0"],
         ["Procedure and treatment rooms", "101.6"],
         ["Revenue at stabilisation", "531.9"],
         ["Fixed annual cost base", "(185.5)"],
         ["Contribution", "346.4"]],
        ["Stabilised trading, NGN M", "Amount"], [383, 84], total_row=True, hi={3}))
    el.append(Spacer(1, 3))
    el.append(Paragraph(
        "<b>Payback is about 1.5 years from stabilisation</b>, or roughly three and a half years "
        "including the ramp. On its own that is a good return.", P))
    el.append(PageBreak())

    el.append(Paragraph("3.  The number that has changed", Q))
    el.append(tbl(
        [["Original plan", "6%", "Alameda, Medlyfe, diagnostics and pharmacy all paying rent"],
         ["After diagnostics and pharmacy became facility", "26%", "Two payers left"],
         ["Now, with the conversion clinic paused", "<b>35%</b>",
          "<b>No payers left. Nothing is contracted</b>"]],
        ["Break-even, as a share of stabilised plaza revenue", "Fill", "Why"],
        [214, 46, 207], aligns=["r", "l"], hi={2}))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>Every naira of the NGN 532M is now usage-based.</b> Pausing the conversion clinic removed "
        "the last anchor tenant, and the laboratory taking the guest chalet displaced Medlyfe, which "
        "was the other one. There is no longer a single contracted lease line in the model. The "
        "campus is sound at 35% utilisation, but it has to earn that from a standing start rather "
        "than inherit it from a lease.", bg=ALERT, rule=RUST))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "This does not make the project worse. It makes the risk a different shape. It has moved from "
        "<b>lease risk</b>, which is settled by negotiation, to <b>demand risk</b>, which is settled "
        "by evidence. Which changes what should happen next.", P))

    el.append(Paragraph("4.  So the next step is evidence, not documents", Q))
    el.append(Paragraph(
        "Two assumptions carry 81% of campus revenue and both are borrowed from our Lagos work and "
        "unvalidated for Abuja: that consultants will fill 41% of sessions, and that 60 of them will "
        "pay NGN 2.5M a year to belong.", P))
    el.append(card(
        "<b>A survey is ready to go out to Abuja consultants now.</b> It tests session demand by time "
        "band, willingness to pay using a proper price-sensitivity method rather than a yes or no, "
        "and membership pricing. It carries no branding, mentions no partner, and promises nothing. "
        "It also doubles as the first approach to a founding group. <b>Forty responses would tell us "
        "more than another month of modelling.</b>", bg=PANEL))

    el.append(Paragraph("5.  Three decisions, and only the first is urgent", Q))
    el.append(tbl(
        [["1", "Extend the head lease to five plus five before any fit-out money moves",
          "NGN 232M amortised over two years breaks the model. Over five plus five it is "
          "comfortable. If the landlord will not move, this building does not support the plan and "
          "the money should not be spent. <b>Nothing else should be committed until this lands</b>"],
         ["2", "Decide Medlyfe explicitly",
          "It has no home now the laboratory has the chalet. Recommend it buys sessions rather than "
          "takes space: three first-floor rooms would yield NGN 26M on a lease against NGN 88M sold "
          "sessionally"],
         ["3", "Whether and when to re-open the conversion clinic",
          "Paused, not closed. The structuring work is done and holds. It would restore a contracted "
          "anchor worth NGN 95M a year, and the case for it is stronger now that nothing else is "
          "contracted"]],
        ["", "Decision", "Why"], [16, 168, 283], aligns=["l", "l"], hi={0}))
    el.append(Spacer(1, 5))
    el.append(Paragraph("Attached", H2))
    el.append(tbl(
        [["The campus", "Every room across all four structures, and what the building can carry"],
         ["Rental review and flex", "What each rate should be, and how far each can move"],
         ["Fit-out and forecast", "The NGN 232M built up package by package"],
         ["Space allocation drawing", "PDF and DXF, ready for an architect"]],
        ["Document", "What it covers"], [148, 319], aligns=["l"]))
    el.append(Spacer(1, 6))
    el.append(card(
        "<b>Debo Odulana</b> &nbsp; Consult for Africa &nbsp; / &nbsp; +234 913 813 8553 &nbsp; / "
        "&nbsp; hello@consultforafrica.com", bg=NAVY, fg=white))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "Supersedes the earlier engagement note and summary, which carry figures since revised. "
        "Areas are measured from the as-built drawings and need confirming against the CAD. Fit-out "
        "is built up by package and needs a quantity surveyor. Fill and membership assumptions are "
        "carried from the Lagos work and are what the survey exists to test. Not a binding offer.",
        SMALL))

    doc.build(el)
    print("wrote %s" % OUT)


if __name__ == "__main__":
    build()
