"""
Build the Medbury / Medlyfe recruitment engagement invoice.

SEQUENCE MATTERS AND IT IS THE WHOLE POINT OF THIS SCRIPT.
The fee is 15% of first-year total package, so the invoice CANNOT be raised until
the brief has stated the package. The flow is:

    brief submitted  ->  invoice raised  ->  funds received  ->  search opens

So this script is parameterised and left on DRAFT. When the brief lands at
/recruitment/brief, put the real package figures into ROLES below, set
DRAFT = False, rerun, and send. While DRAFT is True the PDF carries a visible
stamp and the packages are marked as unconfirmed, so it cannot be sent by
accident.

An interim secondment, if taken, is invoiced separately at NGN 3M a month on a six
month minimum and is not part of the search fee below.

Sibling of scripts/build-medbury-search-invoice.py, which is the Abuja PROPERTY
search invoice and a different matter entirely. Same entity and bank details.

Output: docs/medlyfe-recruitment-invoice-cfa.pdf

Run:
  python3 scripts/build-medlyfe-recruitment-invoice.py
"""

from __future__ import annotations

from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import (
    BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer, Table, TableStyle,
)

# ---------------------------------------------------------------- parameters
DRAFT = True                     # <-- set False once the brief confirms the packages

INVOICE_NO = "CFA-2026-0817-MLR"
INVOICE_DATE = "17 August 2026"
PAYMENT_TERMS = "Due on receipt. The search opens when funds clear."

CLIENT = ["Medbury Healthcare Group", "Attention: Dr Itunu Akinware, Group Chief Executive"]
MATTER = "Executive and specialist search  /  Medlyfe"

FEE_PCT = 0.15
ENGAGEMENT_PCT = 0.40
SHORTLIST_PCT = 0.30
OFFER_PCT = 0.30

# package = first-year total package: base + guaranteed allowances + guaranteed bonus.
# COO placeholder is NGN 2.5M a month all-in, which is Itunu's ceiling. At 30M the 15%
# calculation lands exactly on the 4.5M minimum, so the minimum binds and the fee is 4.5M
# whether or not allowances are added on top. Confirm from the submitted brief.
ROLES = [
    {"title": "Chief Operating Officer, Medlyfe", "package": 30_000_000, "min_fee": 4_500_000},
    {"title": "Health coach, Medlyfe",            "package": 12_000_000, "min_fee": 1_800_000},
]

BANK = [
    ("Bank", "Zenith Bank"),
    ("Account name", "Consult for Africa Management Services Limited"),
    ("Account number", "1312352157"),
]

# ---------------------------------------------------------------- style
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "medlyfe-recruitment-invoice-cfa.pdf"

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
MARGIN = 46
FULLW = PAGE_W - 2 * MARGIN
ss = getSampleStyleSheet()


def style(name, **kw):
    base = dict(fontName="Helvetica", fontSize=9.0, leading=12.2, textColor=BODY,
                alignment=TA_LEFT, spaceAfter=5)
    base.update(kw)
    return ParagraphStyle(name, **base)


EYEBROW = style("eyebrow", fontName="Helvetica-Bold", fontSize=8.2, leading=10.8,
                textColor=GOLD, spaceAfter=2)
H1 = style("h1", fontName="Helvetica-Bold", fontSize=13, leading=16.5, textColor=NAVY,
           spaceBefore=7, spaceAfter=5, keepWithNext=True)
H2 = style("h2", fontName="Helvetica-Bold", fontSize=9.8, leading=12.8, textColor=TEAL,
           spaceBefore=8, spaceAfter=3, keepWithNext=True)
P = style("p")
SMALL = style("small", fontSize=7.5, leading=10.0, textColor=MUTED)
CELL = style("cell", fontSize=8.2, leading=10.6)
CELL_R = style("cellr", fontSize=8.2, leading=10.6, alignment=2)
CELL_B = style("cellb", fontSize=8.2, leading=10.6, fontName="Helvetica-Bold", textColor=NAVY)
CELL_BR = style("cellbr", fontSize=8.2, leading=10.6, fontName="Helvetica-Bold",
                textColor=NAVY, alignment=2)
CELL_W = style("cellw", fontSize=8.2, leading=10.6, fontName="Helvetica-Bold", textColor=white)
CELL_WR = style("cellwr", fontSize=8.2, leading=10.6, fontName="Helvetica-Bold",
                textColor=white, alignment=2)


def ngn(v: float) -> str:
    return "NGN %s" % format(int(round(v)), ",")


def page_bg(c, doc):
    c.saveState()
    c.setFillColor(NAVY)
    c.rect(0, PAGE_H - 30, PAGE_W, 30, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(0, PAGE_H - 33, PAGE_W, 3, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(MARGIN, PAGE_H - 20, "CONSULT FOR AFRICA")
    c.setFillColor(LIGHT)
    c.setFont("Helvetica", 8)
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 20, "Invoice %s" % INVOICE_NO)
    c.setFillColor(GOLD)
    c.rect(MARGIN, 26, 20, 2, fill=1, stroke=0)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 7.4)
    c.drawString(MARGIN, 15, "Consult for Africa Management Services Limited")
    c.drawRightString(PAGE_W - MARGIN, 15, "Page %d" % doc.page)
    if DRAFT:
        c.saveState()
        c.setFont("Helvetica-Bold", 62)
        c.setFillColor(HexColor("#B8763A"))
        c.setFillAlpha(0.13)
        c.translate(PAGE_W / 2, PAGE_H / 2)
        c.rotate(34)
        c.drawCentredString(0, 0, "DRAFT")
        c.restoreState()
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
        ("TOPPADDING", (0, 0), (-1, -1), 3.4), ("BOTTOMPADDING", (0, 0), (-1, -1), 3.4),
        ("LEFTPADDING", (0, 0), (-1, -1), 7), ("RIGHTPADDING", (0, 0), (-1, -1), 7),
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


def build():
    for r in ROLES:
        r["fee"] = max(r["package"] * FEE_PCT, r["min_fee"])
        r["at_min"] = r["fee"] > r["package"] * FEE_PCT
    total_fee = sum(r["fee"] for r in ROLES)
    engagement = total_fee * ENGAGEMENT_PCT

    doc = BaseDocTemplate(
        str(OUT), pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=42, bottomMargin=30,
        title="Invoice %s - Medlyfe recruitment engagement" % INVOICE_NO,
        author="Consult for Africa")
    doc.addPageTemplates([PageTemplate(
        id="p", frames=[Frame(MARGIN, 30, FULLW, PAGE_H - 42 - 30, id="f")], onPage=page_bg)])
    el = []

    el.append(Paragraph("Invoice", style("t", fontName="Helvetica-Bold", fontSize=19, leading=22,
                                         textColor=NAVY, spaceAfter=2)))
    el.append(Paragraph("Recruitment engagement tranche.",
                        style("st", fontName="Helvetica-Oblique", fontSize=10.5, leading=13,
                              textColor=GOLD, spaceAfter=8)))

    el.append(tbl(
        [["Invoiced to", "<br/>".join(CLIENT)],
         ["Matter", MATTER],
         ["Invoice number", INVOICE_NO],
         ["Invoice date", INVOICE_DATE],
         ["Terms", PAYMENT_TERMS]],
        ["", ""], [104, FULLW - 104], aligns=["l"]))

    if DRAFT:
        el.append(Spacer(1, 5))
        el.append(card(
            "<b>DRAFT. Not for issue.</b> The fee is a percentage of first-year total package, so the "
            "figures below cannot be finalised until the recruitment brief states the package. Confirm "
            "the packages from the submitted brief, set DRAFT to False in the builder, and reissue.",
            bg=ALERT, rule=RUST))

    # ---- the fee ----
    el.append(Paragraph("01  /  THE FEE", EYEBROW))
    el.append(Paragraph("Retained search, 15% of first-year total package.", H1))
    rows = []
    for r in ROLES:
        rows.append([r["title"], ngn(r["package"]), "15%", ngn(r["fee"])
                     + (" <font size='7'>(minimum)</font>" if r["at_min"] else "")])
    rows.append(["Total fee", "", "", ngn(total_fee)])
    el.append(tbl(rows, ["Role", "First-year package", "Rate", "Fee"],
                  [FULLW - 96 - 46 - 88, 96, 46, 88], total_row=True))
    el.append(Spacer(1, 3))
    el.append(Paragraph(
        "First-year total package means base salary plus guaranteed allowances and any guaranteed bonus "
        "for the first twelve months. It excludes discretionary bonus, equity and benefits in kind. "
        "Where 15% of the package falls below the minimum fee for the role, the minimum applies and is "
        "marked above.", SMALL))

    # ---- due now ----
    el.append(Paragraph("02  /  DUE NOW", EYEBROW))
    el.append(Paragraph("The engagement tranche.", H1))
    el.append(tbl(
        [["Engagement tranche, 40% of the total fee", ngn(engagement)],
         ["Amount due now", ngn(engagement)]],
        ["", "NGN"], [FULLW - 128, 128], total_row=True, hi={0}))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>The search opens when these funds clear, and not before.</b> The engagement tranche is "
        "non-refundable. It funds the search team, the market mapping and the evidenced package "
        "benchmark, all of which are delivered before a single candidate is approached.", bg=PANEL))

    # ---- balance ----
    el.append(Paragraph("03  /  THE BALANCE", EYEBROW))
    el.append(Paragraph("Invoiced as the search delivers.", H1))
    el.append(tbl(
        [["On delivery of the shortlist", "30%", ngn(total_fee * SHORTLIST_PCT),
          "Three to four assessed candidates with written profiles and a leadership assessment on each"],
         ["On acceptance of offer", "30%", ngn(total_fee * OFFER_PCT),
          "Payable when the candidate signs, not when they start"],
         ["Balance to follow", "60%", ngn(total_fee * (SHORTLIST_PCT + OFFER_PCT)), ""]],
        ["Stage", "Share", "NGN", "Note"],
        [138, 44, 88, FULLW - 270], total_row=True, aligns=["r", "r", "l"]))
    el.append(Spacer(1, 3))
    el.append(Paragraph(
        "If the person resigns or is dismissed for cause within six months of starting, the search is "
        "re-run for the balance of out-of-pocket costs only and no second fee arises, provided the "
        "role, the package and the reporting line are unchanged.", SMALL))

    # ---- payment ----
    el.append(Paragraph("04  /  PAYMENT", EYEBROW))
    el.append(Paragraph("Where to send it.", H1))
    el.append(tbl([[k, v] for k, v in BANK], ["", ""], [116, FULLW - 116], aligns=["l"]))
    el.append(Spacer(1, 3))
    el.append(Paragraph(
        "Please quote invoice number %s on the transfer. Withholding tax, where applicable, should be "
        "deducted at the statutory rate and the remittance evidence sent to "
        "finance@consultforafrica.com." % INVOICE_NO, SMALL))

    el.append(Spacer(1, 8))
    el.append(card(
        "<b>Debo Odulana</b> &nbsp; Consult for Africa &nbsp; / &nbsp; +234 913 813 8553 &nbsp; / "
        "&nbsp; hello@consultforafrica.com", bg=NAVY, fg=white))

    doc.build(el)
    print("wrote %s" % OUT)
    print("  total fee      %s" % ngn(total_fee))
    print("  due now (40%%)  %s" % ngn(engagement))
    if DRAFT:
        print("  DRAFT: confirm packages from the submitted brief, set DRAFT = False, rerun.")


if __name__ == "__main__":
    build()
