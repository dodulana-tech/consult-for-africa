"""
Build the Junior Analyst (NYSC) job description PDF for Consult For Africa.

Output: docs/cfa-junior-analyst-jd-cfa.pdf  (A4, branded, cover + content)

Run:
  python3 scripts/build-cfa-junior-analyst-jd.py
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
OUT = DOCS / "cfa-junior-analyst-jd-cfa.pdf"

# ---- brand palette (source: docs/brand-guide-cfa.pdf) ----------------------
NAVY = HexColor("#0B3C5D")
DEEP_NAVY = HexColor("#081521")
GOLD = HexColor("#D4AF37")
TEAL = HexColor("#1F7A8C")
BODY = HexColor("#1F2937")
MUTED = HexColor("#6B7280")
SURFACE = HexColor("#F1F5F9")
LIGHT = HexColor("#C9D6E0")

PAGE_W, PAGE_H = A4
MARGIN = 46

ss = getSampleStyleSheet()


def style(name, **kw):
    base = dict(fontName="Helvetica", fontSize=10.5, leading=15.5, textColor=BODY,
                alignment=TA_LEFT, spaceAfter=7)
    base.update(kw)
    return ParagraphStyle(name, **base)


H1 = style("h1", fontName="Helvetica-Bold", fontSize=15, leading=19, textColor=NAVY,
           spaceBefore=14, spaceAfter=8)
H2 = style("h2", fontName="Helvetica-Bold", fontSize=11.5, leading=15, textColor=TEAL,
           spaceBefore=8, spaceAfter=4)
P = style("p")
LEDE = style("lede", fontSize=11, leading=16.5, textColor=HexColor("#374151"))
SMALL = style("small", fontSize=8.5, leading=12, textColor=MUTED)
CELL = style("cell", fontSize=9.5, leading=13)
CELL_B = style("cellb", fontSize=9.5, leading=13, fontName="Helvetica-Bold")
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
                 PAGE_H - 153, "/  CAREERS")
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
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 23, "Junior Analyst  /  Role brief")
    c.setFillColor(GOLD)
    c.rect(MARGIN, 30, 24, 2, fill=1, stroke=0)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8)
    c.drawString(MARGIN, 18, "Junior Analyst (NYSC)  /  Consult for Africa")
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


def build():
    doc = BaseDocTemplate(
        str(OUT), pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=52, bottomMargin=42,
        title="Junior Analyst (NYSC) - Consult For Africa",
        author="Consult For Africa",
    )
    content_frame = Frame(MARGIN, 42, PAGE_W - 2 * MARGIN, PAGE_H - 52 - 42, id="content")
    cover_frame = Frame(MARGIN, 170, PAGE_W - 2 * MARGIN, PAGE_H - 330, id="cover")
    doc.addPageTemplates([
        PageTemplate(id="cover", frames=[cover_frame], onPage=cover_bg),
        PageTemplate(id="content", frames=[content_frame], onPage=content_bg),
    ])

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

    def bullets(items):
        for b in items:
            el.append(Paragraph("&#8226;&nbsp;&nbsp;" + b, P))

    el = []

    # ---------------- COVER ----------------
    el.append(Spacer(1, 40))
    el.append(Paragraph("Junior Analyst",
                        ParagraphStyle("ct", fontName="Helvetica-Bold", fontSize=32,
                                       leading=36, textColor=white)))
    el.append(Spacer(1, 8))
    el.append(Paragraph("NYSC placement, one to two corps members",
                        ParagraphStyle("cs", fontName="Helvetica-Bold", fontSize=15,
                                       leading=20, textColor=GOLD)))
    el.append(Spacer(1, 24))
    el.append(Paragraph(
        "Work alongside our consultants on live healthcare strategy, turnaround, and "
        "workforce engagements across Nigeria. A serving year built to teach you how real "
        "advisory work is done, not to fetch and file.",
        ParagraphStyle("cp", fontName="Helvetica", fontSize=11.5, leading=18, textColor=LIGHT)))
    el.append(Spacer(1, 28))
    for line in [
        "Role:  Junior Analyst (Corps Member, NYSC)",
        "Team:  Consult for Africa, Advisory",
        "Location:  Lagos, hybrid",
        "Reports to:  Founding Partner and senior consultants",
    ]:
        el.append(Paragraph(line, ParagraphStyle("cm", fontName="Helvetica", fontSize=10.5,
                                                  leading=18, textColor=white)))
    el.append(NextPageTemplate("content"))
    el.append(PageBreak())

    # ---------------- ABOUT ----------------
    el.append(Paragraph("About Consult for Africa", H1))
    el.append(Paragraph(
        "Consult for Africa (C4A) is a healthcare transformation partner. We work with "
        "hospitals, clinics, and health ventures across Nigeria on strategy, operational "
        "turnaround, governance, and growth. Our work also runs through two platforms we "
        "build and operate: CadreHealth, a healthcare workforce marketplace, and Maarova, "
        "a leadership assessment and coaching service.", LEDE))
    el.append(Paragraph(
        "You would sit close to that work. On any given week our consultants might be "
        "diagnosing why a paediatric centre is losing margin, structuring a multi-sector "
        "group under new tax rules, or standing up a governance model for a hospital board. "
        "As a junior analyst you help make that work happen.", P))

    # ---------------- THE ROLE ----------------
    el.append(Paragraph("The role", H1))
    el.append(Paragraph(
        "This is a hands-on analyst seat, not a shadowing internship. You will own real "
        "pieces of live engagements under close supervision, and your output will reach "
        "clients. The role suits a sharp, curious recent graduate serving their NYSC year "
        "who wants to learn how strategy and operations work is actually delivered.", P))
    el.append(Paragraph("What you would do", H2))
    bullets([
        "Desk research on healthcare markets, competitors, regulation, and clinical models, "
        "turned into clear, usable briefs.",
        "Build and clean datasets, and support financial models and pricing work in "
        "Excel and Google Sheets.",
        "Draft sections of proposals, decks, and reports, and help shape them into the "
        "C4A house style.",
        "Sit in on client calls, capture the discussion, and turn notes into structured "
        "synthesis and action lists.",
        "Support product work on CadreHealth and Maarova, including surveys, candidate "
        "data, and analysis of responses.",
        "Keep project trackers, files, and follow-ups tidy so nothing slips.",
    ])

    # ---------------- WHO ----------------
    el.append(Paragraph("Who we are looking for", H1))
    el.append(Paragraph(
        "We care more about how you think than what you studied. Graduates of medicine, "
        "the sciences, economics, business, engineering, and the social sciences are all "
        "welcome to apply.", P))
    el.append(Paragraph("Essential", H2))
    bullets([
        "A recent graduate currently serving, or about to begin, the NYSC year, and posted "
        "to Lagos.",
        "Strong analytical thinking: you can break a messy problem into parts and reason it "
        "through.",
        "Clear, precise writing in English.",
        "Comfortable with spreadsheets and slides, and quick to learn new tools.",
        "Organised, reliable, and careful with detail.",
        "Discreet and trustworthy with confidential client information.",
    ])
    el.append(Paragraph("A plus", H2))
    bullets([
        "Genuine interest in healthcare, business, or public policy in Africa.",
        "Any exposure to data analysis, research, or financial modelling.",
        "Comfort drafting and designing in Google Workspace or similar.",
    ])

    el.append(PageBreak())

    # ---------------- WHAT YOU GAIN ----------------
    el.append(Paragraph("What you would gain", H1))
    bullets([
        "Direct exposure to real consulting across healthcare, workforce, and multi-sector "
        "strategy, at a pace you will not get in most first roles.",
        "Close mentorship from the founding partner and senior consultants, with honest "
        "feedback on your work.",
        "A portfolio of substantial work you can point to after your service year.",
        "A serious look at a full-time analyst role for those who excel.",
    ])

    # ---------------- TERMS ----------------
    el.append(Paragraph("Terms", H1))
    terms = [
        ["Item", "Detail"],
        ["Engagement", "NYSC Place of Primary Assignment (PPA), for the service year"],
        ["Positions", "One to two corps members"],
        ["Location", "Lagos, hybrid (mix of in-person and remote)"],
        ["Stipend", "A monthly stipend, in addition to the NYSC federal allowance"],
        ["Start", "Aligned to your service year and current batch"],
    ]
    rows = [[Paragraph(c, CELL_W if i == 0 else (CELL_B if j == 0 else CELL))
             for j, c in enumerate(r)] for i, r in enumerate(terms)]
    t = Table(rows, colWidths=[130, PAGE_W - 2 * MARGIN - 130])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, SURFACE]),
        ("LINEBELOW", (0, 0), (-1, 0), 2, GOLD),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
    ]))
    el.append(t)

    # ---------------- HOW TO APPLY ----------------
    el.append(Paragraph("How to apply", H1))
    el.append(Paragraph(
        "Apply online. The form takes about ten minutes: your details, your degree and NYSC "
        "status, your CV, and a short note (250 to 500 words) on why this role interests you "
        "and one problem you have enjoyed thinking through. No cover letter to a hidden inbox, "
        "and applications are reviewed on a rolling basis.", P))
    el.append(Spacer(1, 4))
    el.append(card(
        "Apply at <b>consultforafrica.com/careers/apply?track=NYSC</b><br/>"
        "Select the <b>NYSC Corper</b> track when the form opens. You will hear from us "
        "within five business days.",
        bg=HexColor("#EAF1F4")))
    el.append(Spacer(1, 12))
    el.append(card(
        "<b>Consult for Africa</b> &nbsp; Healthcare transformation partner<br/>"
        "hello@consultforafrica.com &nbsp; / &nbsp; +234 913 813 8553 &nbsp; / &nbsp; "
        "consultforafrica.com<br/>Lagos and Abuja, Nigeria",
        bg=NAVY, fg=white))

    doc.build(el)
    print(f"wrote {OUT}")


if __name__ == "__main__":
    build()
