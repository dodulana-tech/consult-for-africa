"""
Build the STRUCTURE-OPTIONS doc for Dr Itunu Akinware: three ways to structure
Medlyfe Aesthetics, judged first on stability and honest service scope, then on
economics. Menu of A / B / C, each backing Dr Kpaduwa with no cash. Aubergine +
rose-gold + ivory house style. NGN. No em dashes.

Run:
  python3 scripts/build-medlyfe-structure-options.py
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
OUT = DOCS / "medlyfe-aesthetics-structure-options-cfa.pdf"
SHARE = DOCS / "Medlyfe Aesthetics - Structure Options (Draft).pdf"

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
EY = stl("ey", fontName="Helvetica-Bold", fontSize=8.5, leading=11, textColor=GOLD, spaceBefore=8, spaceAfter=2)
H1 = stl("h1", fontName="Helvetica-Bold", fontSize=12.5, leading=15, textColor=NAVY, spaceAfter=4)
OPT = stl("opt", fontName="Helvetica-Bold", fontSize=11.5, leading=14, textColor=NAVY, spaceBefore=6, spaceAfter=3)
P = stl("p")
SMALL = stl("small", fontSize=8, leading=11, textColor=MUTED)
CELL = stl("cell", fontSize=8.5, leading=11.5)
CELL_B = stl("cellb", fontSize=8.5, leading=11.5, fontName="Helvetica-Bold", textColor=NAVY)
CELL_W = stl("cellw", fontSize=8.5, leading=11.5, fontName="Helvetica-Bold", textColor=white)


def bg(c, doc):
    c.saveState()
    c.setFillColor(NAVY); c.rect(0, PAGE_H - 30, PAGE_W, 30, fill=1, stroke=0)
    c.setFillColor(GOLD); c.rect(0, PAGE_H - 33, PAGE_W, 3, fill=1, stroke=0)
    c.setFillColor(white); c.setFont("Helvetica-Bold", 8); c.drawString(MARGIN, PAGE_H - 20, "MEDLYFE AESTHETICS")
    c.setFillColor(LIGHT); c.setFont("Helvetica", 8)
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 20, "Structure options  ·  Private")
    c.setFillColor(GOLD); c.rect(MARGIN, 28, 22, 2, fill=1, stroke=0)
    c.setFillColor(MUTED); c.setFont("Helvetica", 7.5)
    c.drawString(MARGIN, 17, "Private and confidential  /  Prepared for Dr Itunu Akinware, Medbury Healthcare Group")
    c.drawRightString(PAGE_W - MARGIN, 17, "Page %d" % doc.page)
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


def grid(rows, heads, widths):
    data = [[Paragraph(h, CELL_W) for h in heads]]
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
                          title="Medlyfe Aesthetics - Structure options",
                          author="Consult for Africa")
    doc.addPageTemplates([PageTemplate(id="c", frames=[
        Frame(MARGIN, 34, FULLW, PAGE_H - 40 - 34, id="c")], onPage=bg)])
    el = []

    # Title block
    el.append(Paragraph("Medlyfe Aesthetics", TITLE))
    el.append(Paragraph("Three ways to structure it.", SUBT))
    el.append(Paragraph("Prepared for Dr Itunu Akinware, Medbury Healthcare Group  ·  Consult for Africa  ·  Draft, July 2026", META))

    # 01 What this is
    sec(el, "01  /  WHAT THIS IS", "Three clean structures, judged on what matters.")
    el.append(Paragraph(
        "Three ways to structure Medlyfe Aesthetics with Dr Kpaduwa, set side by side. Each is built to "
        "pass the two tests that matter most: it produces a <b>stable service</b> that runs consistently, "
        "and it promises only what it can <b>honestly deliver</b>. Capital and ownership follow from those "
        "two, they do not lead. All three are designed so that every party, Medbury, Dr Kpaduwa and "
        "Consult for Africa, can name what they gained.", P))

    # 02 The service
    sec(el, "02  /  FIRST, THE THING WE ARE BUILDING", "A service in two honest layers.")
    el.append(Paragraph(
        "Before the deal, the service. A clinic is only worth structuring if it holds together week to "
        "week. So the design has two layers, and we are honest about each.", P))
    el.append(card(
        "<b>The core layer, always on.</b> &nbsp;Toxin, standard filler, skin boosters, PRP, peels, "
        "microneedling, medical facials, aftercare. Delivered by a trained resident team, a medical "
        "officer and nurse-injectors, working to Dr Kpaduwa's signed-off protocols under a resident "
        "prescriber. It runs the same every week. This is the stable annuity of the business."))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>The advanced layer, scheduled.</b> &nbsp;Threads, complex full-face work, and cosmetic "
        "surgery, led by Dr Kpaduwa in planned sessions with associate-clinician cover. Booked around a "
        "calendar, not promised as walk-in-anytime.", bg_c=PANEL))
    el.append(Spacer(1, 5))
    el.append(Paragraph(
        "Stability comes from one principle: the standard lives in the <b>institution and the trained "
        "team</b>, carried under Dr Kpaduwa's clinical leadership, not in any single diary. That is also "
        "what turns her standard into a business rather than a personal practice, which is the whole "
        "point of building it with a partner. A clinic that says plainly \"here is what runs every day, "
        "and here is what runs in scheduled sessions with cover\" is a clinic that holds.", P))

    # 03 The number
    sec(el, "03  /  A REALISTIC PILOT NUMBER", "Fund it as a real launch, not a soft opening.")
    el.append(Paragraph(
        "The earlier working figure of about NGN 40M under-counted the one line new clinics always "
        "under-count: marketing. A premium clinic opening cold does not fill a diary on word of mouth. "
        "Built honestly, with launch-intensity marketing, the staffing that must be paid before revenue "
        "catches up, and a proper consumables buffer for FX and import lead times, the pilot funding "
        "sits closer to <b>NGN 60M to NGN 75M all-in</b>, the single biggest correction being marketing "
        "rising from about NGN 7M to roughly NGN 15M to NGN 20M across the launch. These figures adapt "
        "international benchmarks to Lagos, since no reliable local data exists, so treat them as a sound "
        "planning range to tune, not gospel.", P))

    # 04 The three structures
    sec(el, "04  /  THE THREE STRUCTURES", "A menu, all three backing Dr Kpaduwa with no cash.")

    el.append(Paragraph("A.  One institution, backed founder", OPT))
    el.append(Paragraph(
        "One company holds everything. Dr Kpaduwa is co-founder and clinical director with <b>real "
        "equity earned for her name, goodwill and clinical leadership, no cash asked of her</b>. Her "
        "stake grows as the institution grows, a reward that builds rather than a lock that traps. "
        "Medbury funds the capital, holds control, owns the platform, brand, systems and data, and takes "
        "a preferred return that puts its money first.", P))
    el.append(bullet("<b>Stability:</b> high. One balance sheet, one board, clear control."))
    el.append(bullet("<b>Dr Kpaduwa wins:</b> ownership of an institution in her name, none of her cash at risk this season."))
    el.append(bullet("<b>Medbury wins:</b> control, platform ownership, first money back, a co-founder who is genuinely bought in."))
    el.append(bullet("<b>Trade-off:</b> simplest to agree, but clinical and business sit under one entity, less tidy than separating them."))

    el.append(Paragraph("B.  Practice and platform (two entities)", OPT))
    el.append(Paragraph(
        "The structure that maximises stability, borrowed from how durable clinician partnerships are "
        "built worldwide. Two companies: a <b>clinical practice</b> led by Dr Kpaduwa, which owns the "
        "standard, the protocols, the sign-off and clinical quality; and a <b>platform company owned by "
        "Medbury</b>, which owns the brand, systems, data, marketing, premises and trained team, and "
        "runs the business day to day. The platform earns a clear, fixed management fee, not a slice of "
        "clinical income, which keeps it clean and fair. Dr Kpaduwa holds <b>equity in the platform for "
        "her goodwill</b>, so she shares in the thing that scales.", P))
    el.append(bullet("<b>Stability:</b> highest. Clinical quality anchored to a named clinical lead; business continuity owned by Medbury and surviving independently. Neither side can hollow out the other."))
    el.append(bullet("<b>Dr Kpaduwa wins:</b> she owns and leads the clinical practice, plus equity upside in the platform, no cash in."))
    el.append(bullet("<b>Medbury wins:</b> it owns the durable platform outright, and the service continues on that platform regardless of any one clinician's calendar."))
    el.append(bullet("<b>Trade-off:</b> two entities and an agreement between them, a little more legal work to set up."))

    el.append(Paragraph("C.  Core and advanced (split by service)", OPT))
    el.append(Paragraph(
        "Split the business along the line of what each partner most wants to own. <b>Medbury owns the "
        "always-on core service outright</b>, the bench-delivered annuity, stable and scalable. "
        "<b>Dr Kpaduwa owns and leads the advanced and surgical layer</b> as her craft, with a stake in "
        "it and a <b>royalty on the core menu she trains and standardises</b>, so she keeps earning from "
        "the part she hands to the team.", P))
    el.append(bullet("<b>Stability:</b> high on the core, which Medbury fully owns and can run and scale without dependence; the advanced layer is honestly episodic by design."))
    el.append(bullet("<b>Dr Kpaduwa wins:</b> she keeps the craft she loves, sheds the daily work she would rather not run, and still earns from it through the royalty."))
    el.append(bullet("<b>Medbury wins:</b> outright ownership of the scalable, always-on line, with the episodic part sitting where episodic is normal."))
    el.append(bullet("<b>Trade-off:</b> needs a clean revenue and brand boundary between the two lines."))

    # 05 Comparison
    sec(el, "05  /  HOW THEY COMPARE", "On the two things that matter, then the rest.")
    el.append(grid(
        [["A. One institution", "High", "Equity for goodwill, no cash", "You want the simplest yes"],
         ["B. Practice + platform", "Highest", "Platform equity for goodwill", "Stability is the priority"],
         ["C. Core + advanced", "High on the core", "Owns surgery, royalty on core", "You want to own the annuity cleanly"]],
        ["Structure", "Stability", "How Dr Kpaduwa is backed", "Best when"],
        [108, 66, 150, FULLW - 324]))

    # 06 Tonight
    sec(el, "06  /  WHAT I WOULD AGREE TONIGHT", "Lock the principles; the entity can follow.")
    el.append(Paragraph(
        "The entity choice, A, B or C, can follow with the lawyers. What is worth locking now is the "
        "<b>set of principles all three share</b>, because those are what make it stable, honest and fair.", P))
    el.append(bullet("The service is built in <b>two honest layers</b>, core always-on and advanced scheduled, so we never over-promise presence."))
    el.append(bullet("<b>Continuity lives in the platform and the trained team</b>, owned by Medbury, so the service holds regardless of any single calendar."))
    el.append(bullet("<b>Dr Kpaduwa is a backed co-founder, not a hire:</b> real equity for her goodwill and leadership, no cash asked of her this season. A bought-in founder is a more committed and more stable partner than a paid one, which is why this is the stability play, not a giveaway."))
    el.append(bullet("<b>Medbury is protected by what it owns and controls</b>, the platform, the brand, the data and a preferred return, not by trying to tie down a person."))
    el.append(Spacer(1, 6))
    el.append(card(
        "<b>Debo Odulana</b> &nbsp; Consult for Africa &nbsp; / &nbsp; +234 913 813 8553 &nbsp; / &nbsp; "
        "hello@consultforafrica.com<br/>"
        "A working draft for Dr Akinware. The pilot economics sit in the companion execution plan. "
        "Structures and terms are as proposed and to be agreed in writing. Not a binding offer.",
        bg_c=NAVY, fg=white))

    doc.build(el)
    print(f"wrote {OUT}")

    import shutil
    shutil.copyfile(OUT, SHARE)
    print(f"wrote {SHARE}")


if __name__ == "__main__":
    build()
