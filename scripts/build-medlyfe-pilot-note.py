"""
Build a short, warm DRAFT progress note for Dr Itunu Akinware, to show the
aesthetics pilot work is in progress. High-level; the full heads of terms and
operating model sit behind it. CFA house style. NGN. No em dashes.

Run:
  python3 scripts/build-medlyfe-pilot-note.py
"""

from __future__ import annotations

from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer, Table, TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
OUT = DOCS / "medlyfe-aesthetics-pilot-progress-note-cfa.pdf"

NAVY = HexColor("#0B3C5D")
GOLD = HexColor("#D4AF37")
TEAL = HexColor("#1F7A8C")
BODY = HexColor("#1F2937")
MUTED = HexColor("#6B7280")
SURFACE = HexColor("#F1F5F9")
LIGHT = HexColor("#C9D6E0")
PANEL = HexColor("#EAF1F4")

PAGE_W, PAGE_H = A4
MARGIN = 48
FULLW = PAGE_W - 2 * MARGIN


def s(name, **kw):
    base = dict(fontName="Helvetica", fontSize=10.5, leading=15, textColor=BODY, alignment=TA_LEFT, spaceAfter=7)
    base.update(kw)
    return ParagraphStyle(name, **base)


TITLE = s("title", fontName="Helvetica-Bold", fontSize=20, leading=24, textColor=NAVY, spaceAfter=2)
SUBT = s("subt", fontName="Helvetica-Bold", fontSize=11.5, leading=15, textColor=TEAL, spaceAfter=3)
META = s("meta", fontSize=8.5, leading=12, textColor=MUTED, spaceAfter=10)
EY = s("ey", fontName="Helvetica-Bold", fontSize=8.5, leading=11, textColor=GOLD, spaceBefore=8, spaceAfter=2)
H1 = s("h1", fontName="Helvetica-Bold", fontSize=12.5, leading=15, textColor=NAVY, spaceAfter=4)
P = s("p")
SMALL = s("small", fontSize=8, leading=11, textColor=MUTED)


def bg(c, doc):
    c.saveState()
    c.setFillColor(NAVY); c.rect(0, PAGE_H - 30, PAGE_W, 30, fill=1, stroke=0)
    c.setFillColor(GOLD); c.rect(0, PAGE_H - 33, PAGE_W, 3, fill=1, stroke=0)
    c.setFillColor(white); c.setFont("Helvetica-Bold", 8); c.drawString(MARGIN, PAGE_H - 20, "CONSULT FOR AFRICA")
    c.setFillColor(LIGHT); c.setFont("Helvetica", 8)
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 20, "The Aesthetics Pilot  ·  Draft")
    c.setFillColor(GOLD); c.rect(MARGIN, 28, 22, 2, fill=1, stroke=0)
    c.setFillColor(MUTED); c.setFont("Helvetica", 7.5)
    c.drawString(MARGIN, 17, "Private and confidential  /  Work in progress")
    c.drawRightString(PAGE_W - MARGIN, 17, "Consult for Africa")
    c.restoreState()


def card(text, bg_c=SURFACE, fg=BODY):
    st = ParagraphStyle("c", parent=P, textColor=fg, leftIndent=8, rightIndent=8)
    t = Table([[Paragraph(text, st)]], colWidths=[FULLW])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg_c), ("LINEBEFORE", (0, 0), (0, -1), 3, GOLD),
        ("TOPPADDING", (0, 0), (-1, -1), 8), ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 11), ("RIGHTPADDING", (0, 0), (-1, -1), 11),
    ]))
    return t


def bullet(text):
    return Paragraph("<font color='#D4AF37'>&bull;</font>&nbsp; " + text,
                     ParagraphStyle("b", parent=P, leftIndent=13, spaceAfter=3))


def sec(el, ey, title):
    el.append(Paragraph(ey, EY))
    el.append(Paragraph(title, H1))


def build():
    doc = BaseDocTemplate(str(OUT), pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN,
                          topMargin=40, bottomMargin=34, title="The Aesthetics Pilot - Progress Note (Draft)",
                          author="Consult for Africa")
    doc.addPageTemplates([PageTemplate(id="c", frames=[Frame(MARGIN, 34, FULLW, PAGE_H - 40 - 34, id="c")], onPage=bg)])
    el = []

    el.append(Paragraph("The Aesthetics Pilot", TITLE))
    el.append(Paragraph("Where we are, and what we are putting in place.", SUBT))
    el.append(Paragraph("Prepared for Dr Itunu Akinware  ·  by Consult for Africa  ·  July 2026  ·  Draft, work in progress", META))

    el.append(Paragraph(
        "Itunu, thank you again for a lovely session. Following our conversation, here is where the "
        "pilot stands and what we are already putting in place. This is the shape; the full detail "
        "follows in a heads of terms and an operating plan, both in draft.", P))

    sec(el, "01  /  WHAT WE ARE BUILDING", "A light pilot, July to November.")
    el.append(Paragraph(
        "A premium non-surgical aesthetics service inside your Medlyfe Wellness brand, as a Regenerative "
        "Aesthetics line, starting in the iFitness Admiralty clinic. Dr Kpaduwa sets and leads the "
        "clinical standard; Consult for Africa stands up and runs the operation. No standalone company "
        "and no capital yet, we test it properly first, and decide on the bigger build in November.", P))

    sec(el, "02  /  BUILT SO MEDLYFE IS NEVER EXPOSED", "Your point, and it is designed in.")
    el.append(Paragraph(
        "The concern you raised, that we should not build around one person, is the backbone of how "
        "this is structured:", P))
    el.append(bullet("The local team is trained and credentialed to deliver the core service independently, so the capability lives in the clinic."))
    el.append(bullet("Medlyfe owns the brand, the systems, the patient data and the protocols throughout."))
    el.append(bullet("If Dr Kpaduwa ever steps back, Medlyfe continues the service internally with the team already trained. Nothing collapses."))

    sec(el, "03  /  ALREADY IN PROGRESS", "The work is underway.")
    el.append(bullet("<b>Heads of terms</b> for the July to November collaboration, drafted."))
    el.append(bullet("<b>Operating plan</b> drafted: service menu and pricing, patient journey, the team and its training, consumables, tests, and the marketing plan."))
    el.append(bullet("<b>Dr Kpaduwa's positioning</b> as Aesthetics Lead (Visiting) and a Medlyfe Advisory Board member, credible to patients, honest about a visiting arrangement."))
    el.append(bullet("<b>Launch plan</b> to soft-launch to your Medlyfe and corporate base first, before any cold spend."))

    sec(el, "04  /  NEXT STEPS", "Small and fast.")
    el.append(bullet("Debo views the iFitness Admiralty clinic this week and confirms the space."))
    el.append(bullet("We tune the pricing against your Medlyfe list and Dr Kpaduwa's view, and agree the simple pilot revenue split."))
    el.append(bullet("Introduce Dr Kpaduwa, train the team, and soft-launch."))

    el.append(Spacer(1, 8))
    el.append(card(
        "The pilot is the cheapest way to prove this works, and to build your confidence in it, before "
        "anyone commits capital. I am genuinely looking forward to building it with you and Chinwe.<br/>"
        "<b>Debo Odulana</b> &nbsp; Consult for Africa &nbsp; / &nbsp; +234 913 813 8553 &nbsp; / &nbsp; hello@consultforafrica.com",
        bg_c=NAVY, fg=white))
    el.append(Spacer(1, 5))
    el.append(Paragraph(
        "Draft shared in confidence with Dr Itunu Akinware to show work in progress. Details to be "
        "confirmed together.", SMALL))

    doc.build(el)
    print(f"wrote {OUT}")


if __name__ == "__main__":
    build()
