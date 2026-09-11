"""
Build a HIGH-LEVEL TWO-PAGER of the Lyfe Place Aesthetics JV, for ALL PARTIES to
read before the meeting. No cover page; straight into content so it can be read
in two minutes. Shared-safe economics (structure, capital, revenue scale, margin,
payback, indicative value) but no C4A management-fee detail.

Same tri-party aubergine + rose-gold + ivory palette. NGN. No em dashes.

Run:
  python3 scripts/build-lyfe-aesthetics-summary.py
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

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
OUT = DOCS / "medbury-lyfe-aesthetics-summary.pdf"

NAVY = HexColor("#3B2A45")
GOLD = HexColor("#C79A73")
TEAL = HexColor("#8A5E7E")
BODY = HexColor("#2C2530")
MUTED = HexColor("#8A8288")
SURFACE = HexColor("#F6F1EA")
LIGHT = HexColor("#E3D3DE")
PANEL = HexColor("#F1E9EE")
CREAM = HexColor("#F7EEDF")

PAGE_W, PAGE_H = A4
MARGIN = 46
FULLW = PAGE_W - 2 * MARGIN


def stl(name, **kw):
    base = dict(fontName="Helvetica", fontSize=10, leading=14, textColor=BODY,
                alignment=TA_LEFT, spaceAfter=5)
    base.update(kw)
    return ParagraphStyle(name, **base)


TITLE = stl("title", fontName="Helvetica-Bold", fontSize=21, leading=24, textColor=NAVY, spaceAfter=2)
SUBT = stl("subt", fontName="Helvetica-Bold", fontSize=11.5, leading=15, textColor=TEAL, spaceAfter=3)
META = stl("meta", fontSize=8.5, leading=12, textColor=MUTED, spaceAfter=8)
EY = stl("ey", fontName="Helvetica-Bold", fontSize=8.5, leading=11, textColor=GOLD, spaceBefore=7, spaceAfter=2)
H1 = stl("h1", fontName="Helvetica-Bold", fontSize=12.5, leading=15, textColor=NAVY, spaceAfter=4)
P = stl("p")
SMALL = stl("small", fontSize=8, leading=11, textColor=MUTED)
CELL = stl("cell", fontSize=9, leading=12)
CELL_B = stl("cellb", fontSize=9, leading=12, fontName="Helvetica-Bold", textColor=NAVY)
CELL_W = stl("cellw", fontSize=9, leading=12, fontName="Helvetica-Bold", textColor=white)


def bg(c, doc):
    c.saveState()
    c.setFillColor(NAVY); c.rect(0, PAGE_H - 30, PAGE_W, 30, fill=1, stroke=0)
    c.setFillColor(GOLD); c.rect(0, PAGE_H - 33, PAGE_W, 3, fill=1, stroke=0)
    c.setFillColor(white); c.setFont("Helvetica-Bold", 8); c.drawString(MARGIN, PAGE_H - 20, "THE LYFE PLACE AESTHETICS")
    c.setFillColor(LIGHT); c.setFont("Helvetica", 8)
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 20, "Two-page summary  ·  Private")
    c.setFillColor(GOLD); c.rect(MARGIN, 28, 22, 2, fill=1, stroke=0)
    c.setFillColor(MUTED); c.setFont("Helvetica", 7.5)
    c.drawString(MARGIN, 17, "Private and confidential  /  Medbury, KP Plastics and Consult for Africa")
    c.drawRightString(PAGE_W - MARGIN, 17, "Page %d of 2" % doc.page)
    c.restoreState()


def card(text, bg_c=SURFACE, fg=BODY):
    s = ParagraphStyle("c", parent=P, textColor=fg, leftIndent=8, rightIndent=8)
    t = Table([[Paragraph(text, s)]], colWidths=[FULLW])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg_c), ("LINEBEFORE", (0, 0), (0, -1), 3, GOLD),
        ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LEFTPADDING", (0, 0), (-1, -1), 11), ("RIGHTPADDING", (0, 0), (-1, -1), 11),
    ]))
    return t


def grid(rows, heads, widths, aligns):
    data = [[Paragraph(heads[0], CELL_W)] + [Paragraph(h, CELL_W) for h in heads[1:]]]
    for r in rows:
        data.append([Paragraph(r[0], CELL_B)] + [Paragraph(v, CELL) for v in r[1:]])
    t = Table(data, colWidths=widths)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY), ("LINEBELOW", (0, 0), (-1, 0), 1.5, GOLD),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 9), ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, SURFACE]),
    ]))
    return t


def sec(el, ey, title):
    el.append(Paragraph(ey, EY))
    el.append(Paragraph(title, H1))


def bullet(text):
    return Paragraph("<font color='#C79A73'>&bull;</font>&nbsp; " + text,
                     ParagraphStyle("b", parent=P, leftIndent=12, spaceAfter=3))


def build():
    doc = BaseDocTemplate(str(OUT), pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN,
                          topMargin=40, bottomMargin=34,
                          title="The Lyfe Place Aesthetics - Two-page summary",
                          author="Consult for Africa")
    doc.addPageTemplates([PageTemplate(id="c", frames=[
        Frame(MARGIN, 34, FULLW, PAGE_H - 40 - 34, id="c")], onPage=bg)])
    el = []

    # Title block
    el.append(Paragraph("The Lyfe Place Aesthetics", TITLE))
    el.append(Paragraph("A premium cosmetic-surgery and aesthetics partnership, in one read.", SUBT))
    el.append(Paragraph("Medbury Healthcare  ·  KP Plastics  ·  Consult for Africa      |      For the partnership meeting, July 2026", META))

    # 01 The idea
    sec(el, "01  /  THE IDEA", "A practice you already run, with a platform behind it.")
    el.append(Paragraph(
        "A surgery-led premium aesthetics business, built on Dr Chinwe Kpaduwa's plastic-surgery "
        "practice, Medbury's site, capital and patient base, and Consult for Africa running the "
        "day-to-day. Cosmetic and plastic surgery is the anchor, with injectables, skin and "
        "dermatology alongside. It is not a new venture to learn; it formalises a practice that "
        "already exists, at a scale none of the three partners reaches alone.", P))

    # 02 The partnership
    sec(el, "02  /  THE PARTNERSHIP", "Three partners, complementary roles.")
    el.append(grid(
        [["Medbury Healthcare Group", "51%", "The site, the capital, and the patient and corporate base."],
         ["KP Plastics (Dr Kpaduwa)", "34%", "The practice, capability, credentials and following. The clinical anchor."],
         ["Consult for Africa", "15%", "Structures the partnership and runs the operation."]],
        ["Partner", "Stake", "What they bring"],
        [145, 44, FULLW - 189], aligns=["l", "l"]))

    # 03 The theatre model
    sec(el, "03  /  THE THEATRE MODEL", "Consult at The Lyfe Place, operate at a partner hospital.")
    el.append(Paragraph(
        "The Lyfe Place in Lekki holds the consulting rooms and a procedure room, for consultations, "
        "injectables, skin, dermatology and minor procedures. Major surgery is done at a partner "
        "hospital's theatre under a use-of-facilities agreement, so the host provides the theatre, "
        "anaesthesia, recovery, overnight beds and an ICU backstop. This is the lightest on capital "
        "and the safest for post-op care. A standalone theatre of our own can follow once the "
        "surgical lists are consistently full.", P))

    # 04 The economics
    sec(el, "04  /  THE ECONOMICS", "Cash-pay, high-value, and it already has patients.")
    el.append(grid(
        [["Start-up capital", "about NGN 260M (partner-theatre base, includes a 20% contingency)"],
         ["Revenue", "about NGN 1.66Bn by Year 3, rising to about NGN 2.1Bn by Year 5"],
         ["Steady EBITDA margin", "about 31 to 32%, with a full and honest cost load"],
         ["Payback", "inside two years"],
         ["Indicative value (base)", "about NGN 1.7Bn; stakes worth about 877 / 585 / 258 (NGN M)"]],
        ["Headline", "Figure"],
        [150, FULLW - 150], aligns=["l"]))
    el.append(Spacer(1, 3))
    el.append(Paragraph(
        "The business is cash-pay and launches into an existing base, Dr Kpaduwa's following, the Lyfe "
        "Place patients and Medbury's corporate clients, so the diary fills faster than a cold start. "
        "Full costs, capital and projections are in the detailed model.", SMALL))

    # 05 Decide together
    sec(el, "05  /  WHAT WE DECIDE TOGETHER", "A few decisions, made together.")
    el.append(bullet("<b>Scope:</b> surgery-led, with injectables, skin and dermatology alongside."))
    el.append(bullet("<b>The brand:</b> a JV brand with Dr Kpaduwa as named clinical principal."))
    el.append(bullet("<b>Cover when she travels:</b> a resident clinical lead plus associate surgeons."))
    el.append(bullet("<b>The theatre:</b> a partner hospital to start, a standalone of our own later."))
    el.append(bullet("<b>The split:</b> 51 / 34 / 15 as proposed, to confirm."))

    # 06 Next
    sec(el, "06  /  NEXT STEPS", "From this read to a signed partnership.")
    el.append(bullet("Settle the questions above and confirm the split at the meeting."))
    el.append(bullet("C4A drafts the commercial term sheet, then the shareholder agreement."))
    el.append(bullet("Incorporate, secure the theatre partner, fit out, recruit, and soft-launch to the Medbury base."))
    el.append(Spacer(1, 6))
    el.append(card(
        "<b>Debo Odulana</b> &nbsp; Consult for Africa &nbsp; / &nbsp; +234 913 813 8553 &nbsp; / &nbsp; "
        "hello@consultforafrica.com<br/>"
        "A two-page summary for the partners. The full pre-read and financial model sit behind it. "
        "Shareholding and terms are as proposed and to be agreed in writing. Not a binding offer.",
        bg_c=NAVY, fg=white))

    doc.build(el)
    print(f"wrote {OUT}")


if __name__ == "__main__":
    build()
