"""
Build the Medbury Group Strategy Office proposal PDF for Consult for Africa.

Source narrative: docs/medbury-group-strategy-office-cfa.md
Output:          docs/medbury-group-strategy-office-cfa.pdf

Group-level proposal to Dr Itunu Akinware. Centrepiece principle: C4A provides
senior capacity that supports the CEO and does NOT override business unit leads.
House style matches the CFA repo (brand-guide-cfa palette, c4a-icon logomark).
No em dashes anywhere.

Run:
  python3 scripts/build-medbury-group-strategy-office.py
"""

from __future__ import annotations

from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.utils import ImageReader
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
OUT = DOCS / "medbury-group-strategy-office-cfa.pdf"

# ---- brand palette (source: docs/brand-guide-cfa.pdf) ----------------------
NAVY = HexColor("#0B3C5D")
DEEP_NAVY = HexColor("#081521")
GOLD = HexColor("#D4AF37")
TEAL = HexColor("#1F7A8C")
BODY = HexColor("#1F2937")
MUTED = HexColor("#6B7280")
SURFACE = HexColor("#F1F5F9")
LIGHT = HexColor("#C9D6E0")
PANEL = HexColor("#EAF1F4")

PAGE_W, PAGE_H = A4
MARGIN = 46

ss = getSampleStyleSheet()


def style(name, **kw):
    base = dict(fontName="Helvetica", fontSize=10.5, leading=15.5, textColor=BODY,
                alignment=TA_LEFT, spaceAfter=7)
    base.update(kw)
    return ParagraphStyle(name, **base)


EYEBROW = style("eyebrow", fontName="Helvetica-Bold", fontSize=9, leading=12,
                textColor=GOLD, spaceAfter=3)
H1 = style("h1", fontName="Helvetica-Bold", fontSize=15, leading=19, textColor=NAVY,
           spaceBefore=14, spaceAfter=8)
H2 = style("h2", fontName="Helvetica-Bold", fontSize=11.5, leading=15, textColor=TEAL,
           spaceBefore=8, spaceAfter=4)
P = style("p")
LEDE = style("lede", fontSize=11, leading=16.5, textColor=HexColor("#374151"))
SMALL = style("small", fontSize=8.5, leading=12, textColor=MUTED)
CELL = style("cell", fontSize=9.5, leading=13)
CELL_B = style("cellb", fontSize=9.5, leading=13, fontName="Helvetica-Bold", textColor=NAVY)
CELL_W = style("cellw", fontSize=9.5, leading=13, fontName="Helvetica-Bold", textColor=white)


def cover_bg(c, doc):
    c.saveState()
    c.setFillColor(NAVY)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.setFillColor(DEEP_NAVY)
    c.rect(0, 0, PAGE_W, 10, fill=1, stroke=0)
    c.rect(0, PAGE_H - 10, PAGE_W, 10, fill=1, stroke=0)
    x = MARGIN
    c.setFillColor(GOLD)
    c.rect(x, PAGE_H - 150, 40, 3, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(GOLD)
    c.drawString(x + 50, PAGE_H - 153, "CONSULT FOR AFRICA")
    c.setFillColor(LIGHT)
    c.setFont("Helvetica", 10)
    c.drawString(x + 50 + c.stringWidth("CONSULT FOR AFRICA", "Helvetica-Bold", 10) + 10,
                 PAGE_H - 153, "/  HEALTHCARE TRANSFORMATION")
    c.setFillColor(GOLD)
    c.rect(x, 150, 60, 3, fill=1, stroke=0)
    c.setFillColor(LIGHT)
    c.setFont("Helvetica", 9)
    c.drawString(x, 128, "hello@consultforafrica.com   /   +234 913 813 8553   /   consultforafrica.com")
    c.drawString(x, 112, "Lagos and Abuja, Nigeria")
    c.restoreState()


def content_bg(c, doc):
    c.saveState()
    c.setFillColor(NAVY)
    c.rect(0, PAGE_H - 34, PAGE_W, 34, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(0, PAGE_H - 37, PAGE_W, 3, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(MARGIN, PAGE_H - 23, "CONSULT FOR AFRICA")
    c.setFillColor(LIGHT)
    c.setFont("Helvetica", 8.5)
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 23, "Medbury Healthcare  /  Group Strategy Office")
    c.setFillColor(GOLD)
    c.rect(MARGIN, 30, 24, 2, fill=1, stroke=0)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8)
    c.drawString(MARGIN, 18, "Private and confidential  /  Prepared for Dr Itunu Akinware, Group CEO")
    c.drawRightString(PAGE_W - MARGIN, 18, "Page %d" % doc.page)
    try:
        _ic = ImageReader(str(DOCS / "c4a-icon.png"))
        _iw, _ih = _ic.getSize()
        _h = 22.0
        _w = _h * _iw / _ih
        c.drawImage(_ic, PAGE_W - MARGIN - _w, PAGE_H - 61, width=_w, height=_h, mask="auto")
    except Exception:
        pass
    c.restoreState()


def card(text, bg=SURFACE, fg=BODY, bold=False):
    st = ParagraphStyle("c", parent=P, textColor=fg, leftIndent=8, rightIndent=8,
                        spaceBefore=4, spaceAfter=4,
                        fontName="Helvetica-Bold" if bold else "Helvetica")
    t = Table([[Paragraph(text, st)]], colWidths=[PAGE_W - 2 * MARGIN])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("LINEBEFORE", (0, 0), (0, -1), 3, GOLD),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
    ]))
    return t


def build():
    doc = BaseDocTemplate(
        str(OUT), pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=52, bottomMargin=42,
        title="Medbury Group Strategy Office - Consult for Africa Proposal",
        author="Consult for Africa",
    )
    content_frame = Frame(MARGIN, 42, PAGE_W - 2 * MARGIN, PAGE_H - 52 - 42, id="content")
    cover_frame = Frame(MARGIN, 170, PAGE_W - 2 * MARGIN, PAGE_H - 330, id="cover")
    doc.addPageTemplates([
        PageTemplate(id="cover", frames=[cover_frame], onPage=cover_bg),
        PageTemplate(id="content", frames=[content_frame], onPage=content_bg),
    ])

    el = []

    # ---------------- COVER ----------------
    el.append(Spacer(1, 34))
    el.append(Paragraph("A PROPOSAL FOR",
                        ParagraphStyle("ceyebrow", fontName="Helvetica-Bold", fontSize=10,
                                       leading=13, textColor=GOLD, spaceAfter=12)))
    el.append(Paragraph("A Group Strategy Office<br/>for Medbury Healthcare",
                        ParagraphStyle("ct", fontName="Helvetica-Bold", fontSize=27,
                                       leading=33, textColor=white)))
    el.append(Spacer(1, 16))
    el.append(Paragraph(
        "Senior capacity that sits with the Chief Executive, carries the group agenda, and "
        "leaves each business unit lead in charge of their own.",
        ParagraphStyle("cs", fontName="Helvetica-Bold", fontSize=13.5, leading=19,
                       textColor=GOLD)))
    el.append(Spacer(1, 30))
    for label, value in [
        ("PREPARED FOR", "Dr Itunu Akinware, Group Chief Executive, Medbury Healthcare Group"),
        ("PREPARED BY", "Debo Odulana, Founding Partner, Consult for Africa"),
        ("DATE", "July 2026"),
        ("STATUS", "Private and confidential. NDA available on request."),
    ]:
        el.append(Paragraph(label, ParagraphStyle("clbl", fontName="Helvetica-Bold",
                                                  fontSize=8, leading=11, textColor=GOLD,
                                                  spaceBefore=8, spaceAfter=1)))
        el.append(Paragraph(value, ParagraphStyle("cval", fontName="Helvetica",
                                                  fontSize=10.5, leading=14, textColor=white)))
    el.append(NextPageTemplate("content"))
    el.append(PageBreak())

    # ---------------- PAGE 1: A note from Debo ----------------
    el.append(Paragraph("A NOTE FROM DEBO", EYEBROW))
    el.append(Paragraph("The capacity problem is at the top, not the middle.", H1))
    el.append(Paragraph(
        "Itunu, across our conversations one thing has held steady: the group is moving faster "
        "than any one person can hold, and most of what lands on your desk is not a business "
        "unit problem, it is a group problem that only you can carry. You have also been clear, "
        "and you are right, that you will not reach over your business unit leads to run their "
        "units for them.", LEDE))
    el.append(Paragraph(
        "This proposal is built entirely around that. It puts senior capacity next to you, at "
        "the group level, on the decisions and ventures that genuinely sit on your table. It "
        "leaves each unit lead in charge of their own patch. The office manages the load that "
        "would otherwise fall on you. It does not manage your business units.", P))
    el.append(Spacer(1, 4))
    el.append(card(
        "A Group Strategy Office does not sit above your leaders. It sits beside you. Its whole "
        "job is to take the group agenda off one desk, yours, so the pace the group is already "
        "running at stops depending on your personal bandwidth.", bg=PANEL))
    el.append(PageBreak())

    # ---------------- PAGE 2: What sits on your desk ----------------
    el.append(Paragraph("01  /  WHAT ACTUALLY SITS ON YOUR DESK", EYEBROW))
    el.append(Paragraph("Three things only you can carry.", H1))
    el.append(Paragraph("The growth ventures.", H2))
    el.append(Paragraph(
        "The aesthetics partnership at The Lyfe Place, a premium address in Ikoyi, and the "
        "Abuja conversion clinic each need structuring, "
        "coordination, and follow-through at principal level. Right now there is no one but you "
        "to carry them, so they move at the speed of your calendar.", P))
    el.append(Paragraph("Group visibility.", H2))
    el.append(Paragraph(
        "You need a clean read across the business units, performance and risk, without sitting "
        "inside them. That view does not exist in one place today, so the only way to see it is "
        "to go into each unit, which is exactly the thing you are trying not to do.", P))
    el.append(Paragraph("Decision load.", H2))
    el.append(Paragraph(
        "Too many decisions reach you with the analysis still undone, so you end up assembling "
        "the picture before you can decide it. The decision is yours. The assembly should not be.", P))
    el.append(Spacer(1, 6))
    el.append(card(
        "<b>A note on your business unit leads.</b>&nbsp; Nothing in this proposal overrides "
        "them. Unit-level work is proposed to the unit lead directly and engaged separately, on "
        "their terms. This office exists to support you at the group level, not to sit over your "
        "leadership.", bg=SURFACE))
    el.append(PageBreak())

    # ---------------- PAGE 3: What the office is ----------------
    el.append(Paragraph("02  /  WHAT THE GROUP STRATEGY OFFICE IS", EYEBROW))
    el.append(Paragraph("A small senior team, embedded with the Office of the CEO.", H1))
    el.append(Paragraph(
        "Two to three senior Consult for Africa operators sitting with the Office of the CEO, "
        "five days a week, carrying the group agenda under your direction. What they hold:", LEDE))
    el.append(Spacer(1, 4))
    for head, txt in [
        ("Venture structuring and coordination.",
         "Carry the aesthetics JV, the Ikoyi premium address, and "
         "the Abuja clinic from concept to committed: the parties, the models, and the paperwork "
         "coordinated so each moves without waiting on you."),
        ("Decision support.",
         "Every decision that reaches you arrives with the analysis done and the options framed. "
         "You decide. You do not assemble."),
        ("Group commercial visibility.",
         "One group-level view across the business units, so you see what is happening without "
         "being in the weeds. Visibility, not control."),
        ("A read on your leadership bench, when you want it.",
         "The office brings in C4A's leadership assessment through Maarova for the senior roles "
         "you want an objective view on, coordinated as part of the group agenda rather than a "
         "separate vendor conversation."),
        ("Operating rhythm.",
         "A weekly status brief and a monthly strategic review, so the group runs to a cadence "
         "rather than to firefighting."),
    ]:
        el.append(Paragraph("<b>" + head + "</b>&nbsp; " + txt, P))
    el.append(PageBreak())

    # ---------------- PAGE 4: How we run it ----------------
    el.append(Paragraph("03  /  HOW WE RUN IT, AND WHO RUNS IT", EYEBROW))
    el.append(Paragraph("The same discipline we bring everywhere, pointed at your back office.", H1))
    el.append(Paragraph(
        "Consult for Africa engagements follow a deliberate model: Diagnose, Design, Deploy, "
        "Deliver, Transfer. Here it stands the office up in weeks, installs the cadence, and over "
        "time can transfer into an internal capability you own, if and when you want that. The "
        "office is provided by C4A from day one so you get senior capacity immediately, not after "
        "a hiring cycle.", P))
    el.append(Paragraph("Debo Odulana, Founding Partner, leads the relationship.", H2))
    el.append(Paragraph(
        "Former Chief Executive of Cedarcrest Hospitals, Abuja; former Chief Innovation and "
        "Strategy Officer at Evercare Hospital, Lekki; founder of a Nigerian digital health "
        "company built and exited in 2023; President of the Doctors Foundation for Care, a "
        "network of diaspora-trained Nigerian physicians. The monthly strategic review with you "
        "sits with him directly.", P))
    el.append(Paragraph("Two to three senior consultants carry the day-to-day.", H2))
    el.append(Paragraph(
        "A lead consultant who is your primary interface, supported by commercial and operations "
        "specialists. Specific people are briefed and confirmed with you before the office starts.", P))
    el.append(PageBreak())

    # ---------------- PAGE 5: Commercials and next steps ----------------
    el.append(Paragraph("04  /  COMMERCIALS AND NEXT STEPS", EYEBROW))
    el.append(Paragraph("Priced plainly, at the group level only.", H1))
    el.append(Paragraph(
        "The Group Strategy Office is a single monthly retainer. Venture-specific structuring "
        "(the JV, the Ikoyi address) and any business unit "
        "engagements are scoped and priced separately as each is confirmed, so this line stays "
        "clean and you are never paying for work that has not started.", P))
    el.append(Spacer(1, 4))
    prows = [
        [Paragraph("Item", CELL_W), Paragraph("Basis", CELL_W), Paragraph("Fee", CELL_W)],
        [Paragraph("Group Strategy Office", CELL_B),
         Paragraph("2 to 3 senior consultants, 5 days a week, plus Founding Partner oversight "
                   "and monthly review", CELL),
         Paragraph("N4,500,000<br/>per month", CELL_B)],
    ]
    pt = Table(prows, colWidths=[120, PAGE_W - 2 * MARGIN - 120 - 105, 105])
    pt.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("BACKGROUND", (0, 1), (-1, 1), SURFACE),
        ("LINEBELOW", (0, 0), (-1, 0), 2, GOLD),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ]))
    el.append(pt)
    el.append(Spacer(1, 10))
    el.append(Paragraph("Next steps", H2))
    for line in [
        "<b>1.</b>&nbsp; A short engagement letter covering the office, the reporting line, and the retainer.",
        "<b>2.</b>&nbsp; We mobilise within a week, embed with the Office of the CEO, and start taking the venture agenda off your desk.",
        "<b>3.</b>&nbsp; First monthly strategic review at week four, against a group agenda we set together in week one.",
    ]:
        el.append(Paragraph(line, P))
    el.append(Spacer(1, 10))
    el.append(card(
        "<b>Contact</b><br/>"
        "Debo Odulana, Consult for Africa &nbsp; / &nbsp; Lagos and Abuja<br/>"
        "+234 913 813 8553<br/>"
        "hello@consultforafrica.com &nbsp; / &nbsp; consultforafrica.com",
        bg=NAVY, fg=white))
    el.append(Spacer(1, 8))
    el.append(Paragraph(
        "This document is shared in confidence with Dr Itunu Akinware and Medbury Healthcare "
        "Group leadership for the purpose of discussing a potential engagement. It is not a "
        "binding offer; scope and commercials will be agreed in writing before any work begins. "
        "NDA available on request.", SMALL))

    doc.build(el)
    print(f"wrote {OUT}")


if __name__ == "__main__":
    build()
