"""
Build a HIGH-LEVEL version of the Lyfe Place Aesthetics JV, purely for
Dr Chinwe Kpaduwa (the clinical partner). Warm, partner-to-partner, centred on
her role and the clinical proposition. Keeps the economics high-level: shows the
51/34/15 structure and the scale of the opportunity, but NOT the cost schedules,
the C4A management fee, or the full valuation (those live in the detailed model
that stays with Medbury/Itunu).

Same tri-party aubergine + rose-gold + ivory palette. NGN. No em dashes.

Run:
  python3 scripts/build-lyfe-aesthetics-chinwe.py
"""

from __future__ import annotations

from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import (
    BaseDocTemplate, Frame, NextPageTemplate, PageBreak, PageTemplate,
    Paragraph, Spacer, Table, TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
OUT = DOCS / "medbury-lyfe-aesthetics-chinwe.pdf"

# ---- tri-party palette: aubergine + rose-gold + ivory ----
NAVY = HexColor("#3B2A45")
DEEP_NAVY = HexColor("#291C31")
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
ss = getSampleStyleSheet()


def style(name, **kw):
    base = dict(fontName="Helvetica", fontSize=10.5, leading=15.5, textColor=BODY,
                alignment=TA_LEFT, spaceAfter=7)
    base.update(kw)
    return ParagraphStyle(name, **base)


EYEBROW = style("eyebrow", fontName="Helvetica-Bold", fontSize=9, leading=12, textColor=GOLD, spaceAfter=3)
H1 = style("h1", fontName="Helvetica-Bold", fontSize=15, leading=19, textColor=NAVY, spaceBefore=12, spaceAfter=8)
P = style("p")
LEDE = style("lede", fontSize=11, leading=16.5, textColor=HexColor("#3C333B"))
SMALL = style("small", fontSize=8.5, leading=12, textColor=MUTED)
CELL = style("cell", fontSize=9.5, leading=12.5)
CELL_B = style("cellb", fontSize=9.5, leading=12.5, fontName="Helvetica-Bold", textColor=NAVY)
CELL_W = style("cellw", fontSize=9.5, leading=12.5, fontName="Helvetica-Bold", textColor=white)


def cover_bg(c, doc):
    c.saveState()
    cw = PAGE_W / 2.0
    c.setFillColor(NAVY); c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.setStrokeColor(GOLD); c.setLineWidth(0.6); c.line(MARGIN, PAGE_H - 62, PAGE_W - MARGIN, PAGE_H - 62)
    c.setFillColor(LIGHT); c.setFont("Helvetica", 8)
    c.drawString(MARGIN, PAGE_H - 56, "A THREE-PARTY PARTNERSHIP")
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 56, "PERSONAL  ·  PRIVATE")
    c.setStrokeColor(GOLD); c.setLineWidth(0.9); c.line(cw - 34, PAGE_H - 322, cw + 34, PAGE_H - 322)
    c.setFillColor(white); c.setFont("Helvetica-Bold", 34); c.drawCentredString(cw, PAGE_H - 366, "The Lyfe Place")
    c.setFillColor(white); c.setFont("Helvetica-Bold", 34); c.drawCentredString(cw, PAGE_H - 402, "Aesthetics")
    c.setFillColor(GOLD); c.setFont("Helvetica-Oblique", 14); c.drawCentredString(cw, PAGE_H - 432, "A partnership built around your practice.")
    c.setStrokeColor(GOLD); c.setLineWidth(0.7); c.line(cw - 30, PAGE_H - 450, cw + 30, PAGE_H - 450)
    c.setFillColor(LIGHT); c.setFont("Helvetica", 9.5)
    c.drawCentredString(cw, PAGE_H - 470, "Medbury Healthcare  ·  KP Plastics  ·  Consult for Africa")
    c.setStrokeColor(GOLD); c.setLineWidth(0.6); c.line(cw - 26, 120, cw + 26, 120)
    c.setFillColor(LIGHT); c.setFont("Helvetica", 9.5)
    c.drawCentredString(cw, 102, "Prepared for Dr Chinwe Kpaduwa")
    c.setFillColor(MUTED); c.setFont("Helvetica", 8)
    c.drawCentredString(cw, 87, "By Debo Odulana, Consult for Africa  ·  July 2026  ·  Private and confidential")
    c.restoreState()


def content_bg(c, doc):
    c.saveState()
    c.setFillColor(NAVY); c.rect(0, PAGE_H - 34, PAGE_W, 34, fill=1, stroke=0)
    c.setFillColor(GOLD); c.rect(0, PAGE_H - 37, PAGE_W, 3, fill=1, stroke=0)
    c.setFillColor(white); c.setFont("Helvetica-Bold", 8.5); c.drawString(MARGIN, PAGE_H - 23, "THE LYFE PLACE AESTHETICS")
    c.setFillColor(LIGHT); c.setFont("Helvetica", 8.5)
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 23, "For Dr Chinwe Kpaduwa")
    c.setFillColor(GOLD); c.rect(MARGIN, 30, 24, 2, fill=1, stroke=0)
    c.setFillColor(MUTED); c.setFont("Helvetica", 8)
    c.drawString(MARGIN, 18, "Private and confidential")
    c.drawRightString(PAGE_W - MARGIN, 18, "Page %d" % doc.page)
    c.restoreState()


def card(text, bg=SURFACE, fg=BODY):
    st = ParagraphStyle("c", parent=P, textColor=fg, leftIndent=8, rightIndent=8, spaceBefore=4, spaceAfter=4)
    t = Table([[Paragraph(text, st)]], colWidths=[FULLW])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg), ("LINEBEFORE", (0, 0), (0, -1), 3, GOLD),
        ("TOPPADDING", (0, 0), (-1, -1), 8), ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 12), ("RIGHTPADDING", (0, 0), (-1, -1), 12),
    ]))
    return t


def grid(rows, col_labels, widths, aligns):
    data = [[Paragraph(col_labels[0], CELL_W)] + [Paragraph(t, CELL_W) for t in col_labels[1:]]]
    for r in rows:
        data.append([Paragraph(r[0], CELL_B)] + [Paragraph(v, CELL) for v in r[1:]])
    t = Table(data, colWidths=widths)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY), ("LINEBELOW", (0, 0), (-1, 0), 2, GOLD),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 9), ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, SURFACE]),
    ]))
    return t


def sec(el, num, eyebrow, title):
    el.append(Paragraph(num + "  /  " + eyebrow, EYEBROW))
    el.append(Paragraph(title, H1))


def build():
    doc = BaseDocTemplate(str(OUT), pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN,
                          topMargin=52, bottomMargin=42,
                          title="The Lyfe Place Aesthetics - For Dr Chinwe Kpaduwa",
                          author="Consult for Africa")
    doc.addPageTemplates([
        PageTemplate(id="cover", frames=[Frame(MARGIN, 170, PAGE_W - 2 * MARGIN, PAGE_H - 330, id="cover")], onPage=cover_bg),
        PageTemplate(id="content", frames=[Frame(MARGIN, 42, PAGE_W - 2 * MARGIN, PAGE_H - 52 - 42, id="content")], onPage=content_bg),
    ])
    el = []
    el.append(Spacer(1, 2))
    el.append(NextPageTemplate("content"))
    el.append(PageBreak())

    # 01 The idea
    sec(el, "01", "THE IDEA", "Your practice, with a platform behind it.")
    el.append(Paragraph(
        "Lagos has real and growing demand at the top of cosmetic and plastic surgery, and the "
        "aesthetics around it. You already do this work, and you do it well. The idea is simple: take "
        "the practice you already run and put a serious platform behind it, Medbury's site, its "
        "capital and its patient base, and a team that runs the business day to day, so you can give "
        "your time to the clinical work rather than the admin.", LEDE))
    el.append(Spacer(1, 3))
    el.append(card(
        "This is not a new venture to learn. It formalises what you already do, on a site Medbury "
        "already holds, into a partnership the three of us own together, at a scale none of us reaches "
        "alone.", bg=PANEL))
    el.append(PageBreak())

    # 02 Your role
    sec(el, "02", "YOUR ROLE", "Clinical anchor and named principal.")
    el.append(Paragraph(
        "You are the clinical and surgical lead, and the face of the clinical brand. Cosmetic and "
        "plastic surgery is the anchor, with injectables, skin and dermatology alongside, all within "
        "your range. The service is built around your standards, and around your diary.", P))
    el.append(Paragraph(
        "Clinical leadership is yours. When you travel, a resident clinical lead and associate surgeons "
        "carry continuity, so the service holds and your name is protected, and you lead the signature "
        "and complex cases in blocks when you are in Lagos. The partnership carries your name as clinical "
        "principal, so the practice builds lasting value that outlasts any one diary, including your own.", P))
    el.append(Spacer(1, 3))
    el.append(card(
        "You focus on the surgery and the standards. Medbury holds the platform and the capital. C4A "
        "runs the business. Each of us does what we do best.", bg=SURFACE))
    el.append(PageBreak())

    # 03 The partnership
    sec(el, "03", "THE PARTNERSHIP", "Three partners, complementary roles.")
    el.append(Paragraph(
        "Each partner brings what the others cannot. Your 34% is earned through your practice, your "
        "goodwill and your capability, the quality anchor of the whole thing, not cash you put in.", P))
    el.append(grid(
        [["Medbury Healthcare Group", "51%", "The Lyfe Place site, the capital, and the patient and corporate base."],
         ["KP Plastics (you)", "34%", "The practice, the capability, the credentials and the following. The quality anchor."],
         ["Consult for Africa", "15%", "Structures the partnership and runs the day-to-day operation."]],
        ["Partner", "Stake", "What they bring"],
        [150, 46, FULLW - 196], aligns=["l", "l"]))
    el.append(Spacer(1, 5))
    el.append(Paragraph(
        "We have talked about building something like this in Lagos before, in the Doctoora days. This "
        "is that idea, now with a real platform and real backing behind it.", SMALL))
    el.append(PageBreak())

    # 04 How you'll work
    sec(el, "04", "HOW YOU WILL WORK", "Consult here, operate at a partner hospital.")
    el.append(Paragraph(
        "The Lyfe Place in Lekki holds your consulting rooms and a procedure room, for consultations, "
        "injectables, skin, dermatology and minor procedures. Surgery under general anaesthetic is done "
        "at a partner hospital's theatre, where you operate on privileges and the hospital provides the "
        "theatre, anaesthesia, recovery, overnight beds and an ICU backstop.", P))
    el.append(Paragraph(
        "That means your patients are properly cared for after surgery, inside a full hospital, without "
        "the partnership having to build and run a theatre of its own to start. It is the safest and "
        "fastest way to open. A theatre of our own can come later, once the lists are consistently "
        "full.", P))
    el.append(PageBreak())

    # 05 The shape of it
    sec(el, "05", "THE SHAPE OF IT", "Cash-pay, high-value, and it already has patients.")
    el.append(Paragraph(
        "The business is surgery-led, cash-pay and high-value. Its biggest advantage is that the "
        "patients already exist: your following, the Lyfe Place patients, and Medbury's corporate base "
        "are the first channel, so the diary fills faster than a cold start ever could.", LEDE))
    el.append(Paragraph(
        "It reaches meaningful scale quickly, a business on track for well over NGN 1.6Bn in annual "
        "revenue within three years, and it is attractive by every measure. C4A brings the full "
        "numbers, the costs, the capital and the projections, to the table so every partner sees the "
        "same picture; this note keeps it high-level for you.", P))
    el.append(Spacer(1, 3))
    el.append(card(
        "Your stake grows with the practice you already own, turned into lasting, transferable value, "
        "for none of your own capital at risk.", bg=PANEL))
    el.append(PageBreak())

    # 06 What we decide together
    sec(el, "06", "WHAT WE DECIDE TOGETHER", "A few decisions, made together.")
    el.append(Paragraph("None of these are settled; they are for the three of us to agree.", P))
    el.append(grid(
        [["Scope", "Surgery-led, with injectables, skin and dermatology alongside."],
         ["The brand", "A JV brand carrying you as named clinical principal."],
         ["Cover when you travel", "A resident clinical lead and associate surgeons, with you on the signature cases."],
         ["The theatre", "A partner hospital's theatre and recovery to start; a standalone of our own later."]],
        ["The decision", "Where it is heading"],
        [150, FULLW - 150], aligns=["l"]))
    el.append(PageBreak())

    # 07 Next
    sec(el, "07", "NEXT", "Let's build it.")
    el.append(Paragraph(
        "You are in Lagos this month, so the timing is right. Let us sit down with Itunu, agree the "
        "shape and settle the few questions above, and then C4A turns it into a term sheet and the "
        "shareholder agreement for all three of us to review and sign.", P))
    el.append(Paragraph(
        "I have wanted to build something proper with you for a long time. This is a good one, and the "
        "pieces are finally in place. I am looking forward to it.", P))
    el.append(Spacer(1, 8))
    el.append(card(
        "<b>Debo Odulana</b> &nbsp; Consult for Africa &nbsp; / &nbsp; Lagos and Abuja<br/>"
        "+234 913 813 8553 &nbsp; / &nbsp; hello@consultforafrica.com &nbsp; / &nbsp; consultforafrica.com",
        bg=NAVY, fg=white))
    el.append(Spacer(1, 6))
    el.append(Paragraph(
        "Shared in confidence with Dr Chinwe Kpaduwa as a personal high-level summary. Shareholding and "
        "terms are as proposed and to be agreed in writing. Not a binding offer.", SMALL))

    doc.build(el)
    print(f"wrote {OUT}")


if __name__ == "__main__":
    build()
