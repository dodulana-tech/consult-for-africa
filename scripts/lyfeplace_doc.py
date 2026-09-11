"""
Shared page furniture and table helpers for the Lyfe Place documents.

Style only. No model, no numbers. Import this, not another copy of it.
"""

from __future__ import annotations

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    CondPageBreak, KeepTogether, Paragraph, Table, TableStyle,
)

NAVY = colors.HexColor("#0F3D2E")
GOLD = colors.HexColor("#C9A227")
TEAL = colors.HexColor("#2F6F5E")
BODY = colors.HexColor("#1F2937")
MUTED = colors.HexColor("#6B7280")
LIGHT = colors.HexColor("#EFF4F1")
CREAM = colors.HexColor("#FBF7EC")
ALERT = colors.HexColor("#FDF3E3")
GREEN = colors.HexColor("#EAF3ED")
RULE = colors.HexColor("#D8DEDA")

PW, PH = A4
MARGIN = 17 * mm
FULLW = PW - 2 * MARGIN


def style(name, **kw):
    base = dict(name=name, fontName="Helvetica", fontSize=8.9, leading=12.6,
                textColor=BODY, alignment=TA_LEFT)
    base.update(kw)
    return ParagraphStyle(**base)


P = style("p", spaceAfter=6)
SMALL = style("sm", fontSize=7.7, leading=10.4, textColor=MUTED, spaceAfter=4)
H1 = style("h1", fontName="Helvetica-Bold", fontSize=13.6, leading=16.4,
           textColor=NAVY, spaceBefore=2, spaceAfter=5)
H2 = style("h2", fontName="Helvetica-Bold", fontSize=10, leading=13,
           textColor=TEAL, spaceBefore=8, spaceAfter=4)
EYEBROW = style("eb", fontName="Helvetica-Bold", fontSize=7.4, leading=9.6,
                textColor=GOLD, spaceBefore=6, spaceAfter=1)
TITLE = style("t", fontName="Helvetica-Bold", fontSize=19, leading=22,
              textColor=NAVY, spaceAfter=2)
SUBTITLE = style("st", fontName="Helvetica-Oblique", fontSize=11, leading=14,
                 textColor=GOLD, spaceAfter=8)
LETTER_TO = style("lt", fontName="Helvetica-Bold", fontSize=9.4, leading=12,
                  textColor=NAVY, spaceAfter=5)
SIG = style("sig", fontName="Helvetica-Bold", fontSize=9.4, leading=13,
            textColor=NAVY, spaceBefore=6, spaceAfter=9)
CELLW = style("cw", fontSize=8.2, leading=10.8, textColor=colors.white,
              fontName="Helvetica-Bold")


def m(x, dp=1):
    return ("{:,.%df}" % dp).format(x)


def sec(el, num, eyebrow, title):
    """Eyebrow and title move together, and a section needs room to start."""
    el.append(CondPageBreak(190))
    el.append(KeepTogether([Paragraph("%s  /  %s" % (num, eyebrow), EYEBROW),
                            Paragraph(title, H1)]))


def tbl(rows, labels, widths, total_row=False, aligns=None, hi=None, tiny=False,
        verdict_col=None):
    """verdict_col colours a PASS / QUALIFIED / FAIL column green, cream or alert."""
    cs = style("c", fontSize=7.7 if tiny else 8.2, leading=10.2 if tiny else 10.8)
    csb = style("cb", fontSize=7.7 if tiny else 8.2, leading=10.2 if tiny else 10.8,
                fontName="Helvetica-Bold")
    data = [[Paragraph(str(l), CELLW) for l in labels]]
    for r in rows:
        data.append([Paragraph(str(c), csb if (total_row and r is rows[-1]) else cs) for c in r])
    t = Table(data, colWidths=widths, repeatRows=1)
    cmds = [("BACKGROUND", (0, 0), (-1, 0), NAVY), ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LINEBELOW", (0, 0), (-1, -1), 0.4, RULE),
            ("TOPPADDING", (0, 0), (-1, -1), 3.4), ("BOTTOMPADDING", (0, 0), (-1, -1), 3.4),
            ("LEFTPADDING", (0, 0), (-1, -1), 5), ("RIGHTPADDING", (0, 0), (-1, -1), 5)]
    for i in range(1, len(data)):
        if i % 2 == 0:
            cmds.append(("BACKGROUND", (0, i), (-1, i), colors.HexColor("#FAFBFA")))
    for j, a in enumerate(aligns or []):
        if a == "r":
            cmds.append(("ALIGN", (j + 1, 0), (j + 1, -1), "RIGHT"))
    if verdict_col is not None:
        for i, r in enumerate(rows, start=1):
            v = str(r[verdict_col]).upper()
            bg = GREEN if v.startswith("PASS") else ALERT if v.startswith("FAIL") else CREAM
            cmds.append(("BACKGROUND", (verdict_col, i), (verdict_col, i), bg))
    if total_row:
        cmds += [("BACKGROUND", (0, len(data) - 1), (-1, len(data) - 1), CREAM),
                 ("LINEABOVE", (0, len(data) - 1), (-1, len(data) - 1), 0.8, GOLD)]
    for i in (hi or []):
        cmds.append(("BACKGROUND", (0, i + 1), (-1, i + 1), LIGHT))
    t.setStyle(TableStyle(cmds))
    return t


def card(text, bg=LIGHT, rule=GOLD):
    t = Table([[Paragraph(text, style("cd", fontSize=8.5, leading=11.9))]], colWidths=[FULLW])
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), bg),
                           ("LINEBEFORE", (0, 0), (0, -1), 2.2, rule),
                           ("LEFTPADDING", (0, 0), (-1, -1), 9),
                           ("RIGHTPADDING", (0, 0), (-1, -1), 9),
                           ("TOPPADDING", (0, 0), (-1, -1), 7),
                           ("BOTTOMPADDING", (0, 0), (-1, -1), 7)]))
    return t


def footer_bar(text="Debo Odulana   Consult for Africa   /   +234 913 813 8553   /   "
                    "hello@consultforafrica.com"):
    t = Table([[Paragraph(text, CELLW)]], colWidths=[FULLW])
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), NAVY),
                           ("LEFTPADDING", (0, 0), (-1, -1), 9),
                           ("TOPPADDING", (0, 0), (-1, -1), 7),
                           ("BOTTOMPADDING", (0, 0), (-1, -1), 7)]))
    return t


def make_furniture(left, right):
    """Page header and footer. left is the brand, right the document name."""
    def furniture(canv, doc):
        canv.saveState()
        canv.setFillColor(NAVY)
        canv.rect(0, PH - 15 * mm, PW, 15 * mm, stroke=0, fill=1)
        canv.setFillColor(colors.white)
        canv.setFont("Helvetica-Bold", 8.2)
        canv.drawString(MARGIN, PH - 10 * mm, left)
        canv.setFont("Helvetica", 8.2)
        canv.drawRightString(PW - MARGIN, PH - 10 * mm, right)
        canv.setFillColor(GOLD)
        canv.rect(0, PH - 16.4 * mm, PW, 1.4 * mm, stroke=0, fill=1)
        canv.setStrokeColor(GOLD)
        canv.setLineWidth(1.2)
        canv.line(MARGIN, 14 * mm, MARGIN + 11 * mm, 14 * mm)
        canv.setFillColor(MUTED)
        canv.setFont("Helvetica", 7.2)
        canv.drawString(MARGIN, 10 * mm,
                        "Private and confidential  /  Prepared for Dr Itunu Akinware, Group CEO")
        canv.drawRightString(PW - MARGIN, 10 * mm, "Page %d" % doc.page)
        canv.restoreState()
    return furniture
