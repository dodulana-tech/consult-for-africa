"""
Build the "Lyfe Place Aesthetics" JV pre-read (read-me) PDF.

A shared pre-read for the three-party conversation between Dr Itunu Akinware
(Medbury), Dr Chinwe Kpaduwa (KP Plastics) and Consult for Africa, ahead of
settling the partnership. Sets out the parties and shareholding, what is already
agreed, the open questions to decide together, the operating model, and next
steps. The full financial model and feasibility are a companion document.

Source facts: the Kpaduwa pre-read, the three-party meeting slide, and section 08
of the Medbury Group Transformation proposal.

Distinct tri-party palette (aubergine + rose-gold + ivory), deliberately neither
the CFA navy nor the Cloister emerald. NGN. No em dashes.

Run:
  python3 scripts/build-lyfe-aesthetics-jv.py
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
OUT = DOCS / "medbury-lyfe-aesthetics-jv-readme.pdf"

# ---- tri-party palette: aubergine + rose-gold + ivory ----
NAVY = HexColor("#3B2A45")      # deep aubergine (cover, headers, table heads)
DEEP_NAVY = HexColor("#291C31")  # darker aubergine
GOLD = HexColor("#C79A73")      # rose / champagne gold
TEAL = HexColor("#8A5E7E")      # mauve (H2 accent)
BODY = HexColor("#2C2530")      # warm dark ink
MUTED = HexColor("#8A8288")     # warm grey
SURFACE = HexColor("#F6F1EA")   # warm ivory
LIGHT = HexColor("#E3D3DE")     # pale mauve (light text on aubergine)
PANEL = HexColor("#F1E9EE")     # pale mauve panel
CREAM = HexColor("#F7EEDF")     # pale gold total rows

PAGE_W, PAGE_H = A4
MARGIN = 46
ss = getSampleStyleSheet()


def style(name, **kw):
    base = dict(fontName="Helvetica", fontSize=10.5, leading=15.5, textColor=BODY,
                alignment=TA_LEFT, spaceAfter=7)
    base.update(kw)
    return ParagraphStyle(name, **base)


EYEBROW = style("eyebrow", fontName="Helvetica-Bold", fontSize=9, leading=12, textColor=GOLD, spaceAfter=3)
H1 = style("h1", fontName="Helvetica-Bold", fontSize=15, leading=19, textColor=NAVY, spaceBefore=12, spaceAfter=8)
H2 = style("h2", fontName="Helvetica-Bold", fontSize=11.5, leading=15, textColor=TEAL, spaceBefore=8, spaceAfter=4)
P = style("p")
LEDE = style("lede", fontSize=11, leading=16.5, textColor=HexColor("#3C333B"))
SMALL = style("small", fontSize=8.5, leading=12, textColor=MUTED)
CELL = style("cell", fontSize=9.5, leading=12.5)
CELL_R = style("cellr", fontSize=9.5, leading=12.5, alignment=2)
CELL_B = style("cellb", fontSize=9.5, leading=12.5, fontName="Helvetica-Bold", textColor=NAVY)
CELL_BR = style("cellbr", fontSize=9.5, leading=12.5, fontName="Helvetica-Bold", textColor=NAVY, alignment=2)
CELL_W = style("cellw", fontSize=9.5, leading=12.5, fontName="Helvetica-Bold", textColor=white)
CELL_WR = style("cellwr", fontSize=9.5, leading=12.5, fontName="Helvetica-Bold", textColor=white, alignment=2)


def cover_bg(c, doc):
    c.saveState()
    cw = PAGE_W / 2.0
    c.setFillColor(NAVY); c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.setStrokeColor(GOLD); c.setLineWidth(0.6); c.line(MARGIN, PAGE_H - 62, PAGE_W - MARGIN, PAGE_H - 62)
    c.setFillColor(LIGHT); c.setFont("Helvetica", 8)
    c.drawString(MARGIN, PAGE_H - 56, "A THREE-PARTY PARTNERSHIP")
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 56, "PRE-READ  ·  PRIVATE")
    # small gold rule motif above title
    c.setStrokeColor(GOLD); c.setLineWidth(0.9); c.line(cw - 34, PAGE_H - 322, cw + 34, PAGE_H - 322)
    c.setFillColor(white); c.setFont("Helvetica-Bold", 34); c.drawCentredString(cw, PAGE_H - 366, "The Lyfe Place")
    c.setFillColor(white); c.setFont("Helvetica-Bold", 34); c.drawCentredString(cw, PAGE_H - 402, "Aesthetics")
    c.setFillColor(GOLD); c.setFont("Helvetica-Oblique", 14); c.drawCentredString(cw, PAGE_H - 432, "Premium aesthetics and cosmetic medicine, in Lekki.")
    c.setStrokeColor(GOLD); c.setLineWidth(0.7); c.line(cw - 30, PAGE_H - 450, cw + 30, PAGE_H - 450)
    c.setFillColor(LIGHT); c.setFont("Helvetica", 9.5)
    c.drawCentredString(cw, PAGE_H - 470, "Medbury Healthcare  ·  KP Plastics  ·  Consult for Africa")
    # footer
    c.setStrokeColor(GOLD); c.setLineWidth(0.6); c.line(cw - 26, 120, cw + 26, 120)
    c.setFillColor(LIGHT); c.setFont("Helvetica", 9.5)
    c.drawCentredString(cw, 102, "A pre-read for Dr Itunu Akinware and Dr Chinwe Kpaduwa")
    c.setFillColor(MUTED); c.setFont("Helvetica", 8)
    c.drawCentredString(cw, 87, "Prepared by Consult for Africa  ·  July 2026  ·  Private and confidential")
    c.restoreState()


def content_bg(c, doc):
    c.saveState()
    c.setFillColor(NAVY); c.rect(0, PAGE_H - 34, PAGE_W, 34, fill=1, stroke=0)
    c.setFillColor(GOLD); c.rect(0, PAGE_H - 37, PAGE_W, 3, fill=1, stroke=0)
    c.setFillColor(white); c.setFont("Helvetica-Bold", 8.5); c.drawString(MARGIN, PAGE_H - 23, "THE LYFE PLACE AESTHETICS")
    c.setFillColor(LIGHT); c.setFont("Helvetica", 8.5)
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 23, "A three-party partnership")
    c.setFillColor(GOLD); c.rect(MARGIN, 30, 24, 2, fill=1, stroke=0)
    c.setFillColor(MUTED); c.setFont("Helvetica", 8)
    c.drawString(MARGIN, 18, "Private and confidential  /  Pre-read")
    c.drawRightString(PAGE_W - MARGIN, 18, "Page %d" % doc.page)
    c.restoreState()


def card(text, bg=SURFACE, fg=BODY):
    st = ParagraphStyle("c", parent=P, textColor=fg, leftIndent=8, rightIndent=8, spaceBefore=4, spaceAfter=4)
    t = Table([[Paragraph(text, st)]], colWidths=[PAGE_W - 2 * MARGIN])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg), ("LINEBEFORE", (0, 0), (0, -1), 3, GOLD),
        ("TOPPADDING", (0, 0), (-1, -1), 8), ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 12), ("RIGHTPADDING", (0, 0), (-1, -1), 12),
    ]))
    return t


def grid(rows, col_labels, widths, total_rows=None, aligns=None):
    total_rows = total_rows or set()
    ncols = len(col_labels)
    if aligns is None:
        aligns = ["r"] * (ncols - 1)
    data = [[Paragraph(col_labels[0], CELL_W)] + [Paragraph(t, CELL_WR if aligns[j] == "r" else CELL_W)
                                                  for j, t in enumerate(col_labels[1:])]]
    for i, r in enumerate(rows):
        emph = i in total_rows
        cells = [Paragraph(r[0], CELL_B if emph else CELL)]
        for j, v in enumerate(r[1:]):
            if aligns[j] == "r":
                cells.append(Paragraph(v, CELL_BR if emph else CELL_R))
            else:
                cells.append(Paragraph(v, CELL_B if emph else CELL))
        data.append(cells)
    t = Table(data, colWidths=widths)
    stl = [
        ("BACKGROUND", (0, 0), (-1, 0), NAVY), ("LINEBELOW", (0, 0), (-1, 0), 2, GOLD),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 9), ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, SURFACE]),
    ]
    for i in total_rows:
        stl.append(("BACKGROUND", (0, i + 1), (-1, i + 1), CREAM))
        stl.append(("LINEABOVE", (0, i + 1), (-1, i + 1), 1.0, GOLD))
    t.setStyle(TableStyle(stl))
    return t


def sec(el, num, eyebrow, title):
    el.append(Paragraph(num + "  /  " + eyebrow, EYEBROW))
    el.append(Paragraph(title, H1))


def build():
    doc = BaseDocTemplate(str(OUT), pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN,
                          topMargin=52, bottomMargin=42,
                          title="The Lyfe Place Aesthetics - JV Pre-read",
                          author="Consult for Africa")
    doc.addPageTemplates([
        PageTemplate(id="cover", frames=[Frame(MARGIN, 170, PAGE_W - 2 * MARGIN, PAGE_H - 330, id="cover")], onPage=cover_bg),
        PageTemplate(id="content", frames=[Frame(MARGIN, 42, PAGE_W - 2 * MARGIN, PAGE_H - 52 - 42, id="content")], onPage=content_bg),
    ])
    FULLW = PAGE_W - 2 * MARGIN
    el = []

    el.append(Spacer(1, 2))
    el.append(NextPageTemplate("content"))
    el.append(PageBreak())

    # 01 The opportunity
    sec(el, "01", "THE OPPORTUNITY", "A premium aesthetics service, built on what already works.")
    el.append(Paragraph(
        "Lagos has real, growing demand at the top of the cosmetic and plastic surgery market, and "
        "the aesthetics around it: body and breast surgery, liposuction and contouring, injectables "
        "and skin, and medical dermatology, from a trusted and credentialed hand. This partnership "
        "brings three things together to serve it. The Lyfe Place in Lekki is the site and the "
        "platform. Dr Chinwe Kpaduwa of KP Plastics is the clinical anchor: a plastic surgeon who "
        "covers cosmetic surgery, aesthetics and dermatology, with an established practice and a "
        "patient following. Consult for Africa structures the arrangement and runs the day-to-day.", LEDE))
    el.append(Paragraph(
        "This pre-read is for the three of us to read before we sit down. It sets out where the "
        "partnership stands, what is already agreed, and the handful of things we decide together. "
        "The full financial model, the start-up capital projection and the feasibility are the "
        "companion document.", P))
    el.append(Spacer(1, 3))
    el.append(card(
        "This is not a new business to learn. It formalises a service Dr Kpaduwa already runs, on "
        "a site Medbury already owns, into a partnership the three of us hold together.", bg=PANEL))
    el.append(PageBreak())

    # 02 The parties
    sec(el, "02", "THE PARTNERSHIP", "Three parties, complementary roles.")
    el.append(Paragraph(
        "Each party brings the thing the others cannot. The shareholding below reflects the "
        "proposal as it stands; the split itself is one of the items we settle together.", P))
    el.append(grid(
        [["Medbury Healthcare Group", "51%",
          "Majority shareholder and capital. The Lyfe Place site, the platform, and the existing patient and 785-corporate-client base."],
         ["KP Plastics (Dr Chinwe Kpaduwa)", "34%",
          "Clinical and surgical lead: a plastic surgeon covering cosmetic surgery, aesthetics and dermatology. The capability, the credentials and the patient following. The quality anchor."],
         ["Consult for Africa", "15%",
          "Operating partner and deal architect. Structures the arrangement and carries the ongoing operation."]],
        ["Party", "Stake", "What they bring"],
        [150, 46, FULLW - 196], aligns=["l", "l"]))
    el.append(Spacer(1, 5))
    el.append(Paragraph(
        "The professional relationship behind this is established: Dr Kpaduwa and Debo Odulana "
        "planned a Lagos practice together in the Doctoora period. This formalises that within the "
        "Medbury ecosystem, with C4A as the operational anchor.", SMALL))
    el.append(PageBreak())

    # 03 Already settled
    sec(el, "03", "ALREADY SETTLED", "What we have already agreed in principle.")
    for h, t in [
        ("KP Plastics is the clinical anchor.",
         "The partnership builds on the practice Dr Kpaduwa already runs, rather than starting from "
         "scratch. Her clinical brand is the quality anchor of the service."),
        ("The model works around Dr Kpaduwa's travel.",
         "Dr Kpaduwa is not permanently resident in Nigeria. Clinical leadership is hers; the "
         "day-to-day runs through the Medbury and C4A teams on the ground, so the service holds "
         "when she is abroad."),
        ("Medbury provides the site, capital and distribution.",
         "The Lyfe Place, the capital position, and the patient and corporate base are the platform "
         "the partnership launches from."),
        ("C4A produces the numbers.",
         "The start-up capital projection, the financial model and the feasibility are C4A's to "
         "prepare, as the companion to this read, so every party sees the same figures before we "
         "commit."),
    ]:
        el.append(Paragraph("<b>" + h + "</b>&nbsp; " + t, P))
    el.append(PageBreak())

    # 04 Open questions
    sec(el, "04", "WHAT WE DECIDE TOGETHER", "Five questions for the conversation.")
    el.append(Paragraph(
        "Everything else is detail once these five are settled. Each carries a lean, but the "
        "decision is the three of us together.", P))
    el.append(grid(
        [["Service scope", "Surgery-led with aesthetics and dermatology alongside, or aesthetics-led with selective surgery.",
          "Surgery-led, on Dr Kpaduwa's core capability, with injectables, skin and dermatology compounding the diary."],
         ["The brand face", "Dr Kpaduwa personally, or a JV-branded line with her as clinical principal.",
          "A JV brand with Dr Kpaduwa as named clinical principal, so it outlasts any one diary."],
         ["Cover when abroad", "How clinical oversight, scheduling and case escalation run during travel.",
          "A resident clinical lead plus associate surgeons for continuity, with Dr Kpaduwa leading the signature and complex cases in blocks."],
         ["C4A's remit", "Full operation including marketing and sales, or a narrower scope.",
          "Full operation, so one party owns the P&L and the growth."],
         ["The theatre", "Consulting and procedure rooms at The Lyfe Place; the theatre at a partner hospital, or later a standalone of our own.",
          "Start on a partner hospital's theatre and recovery, lightest on capital and best for post-op; build a standalone once the lists are full. Never a theatre at The Lyfe Place."]],
        ["The decision", "The choice", "Our lean"],
        [95, (FULLW - 95) * 0.5, (FULLW - 95) * 0.5], aligns=["l", "l"]))
    el.append(PageBreak())

    # 05 Operating model
    sec(el, "05", "THE OPERATING MODEL", "Clinically led, operationally held.")
    el.append(Paragraph(
        "Clinical leadership sits with Dr Kpaduwa. The day-to-day sits with C4A and the Medbury "
        "team on the ground, so the service runs whether or not she is in the country. The consulting "
        "and procedure rooms sit at The Lyfe Place, and surgery is done at a partner hospital's "
        "theatre, so the partnership runs a front and a surgical list without owning a theatre. C4A "
        "carries the booking and scheduling, the clinical-team coordination, billing and collections, "
        "supplier management, marketing execution and the monthly reporting, on the HospitlOS "
        "platform.", P))
    el.append(Paragraph(
        "The partnership plugs into what Medbury already has. Staff are recruited and vetted "
        "through Maarova. Supply runs through Medbury Pharma. And the distribution is built in from "
        "day one: The Lyfe Place patient base and Medbury's 785 corporate clients are the first "
        "channel, with the cross-sell wired into the booking and CRM from the start.", P))
    el.append(Spacer(1, 3))
    el.append(card(
        "Dr Kpaduwa focuses on the clinical work. Medbury holds the platform and the capital. C4A "
        "makes the business run. Each does what they are best at, and the service does not depend "
        "on any one person being in the building.", bg=PANEL))
    el.append(PageBreak())

    # 06 Economics
    sec(el, "06", "THE SHAPE OF THE ECONOMICS", "Surgery-led, cash-pay, high-value.")
    el.append(Paragraph(
        "The economics are attractive by shape, and the full model follows. The revenue spine is "
        "surgery-led and cash-pay: cosmetic and plastic surgery as the anchor, with injectables, "
        "skin, body contouring and dermatology compounding around it. Surgery carries a full cost "
        "load, the theatre hired from a partner hospital, consumables and implants, indemnity and a "
        "skilled team, so once costed honestly the margin sits in the low thirties, but on a much "
        "larger base than a pure-aesthetics clinic. The patient base to fill it already exists in the "
        "Medbury book.", P))
    el.append(Paragraph(
        "C4A is preparing the full start-up capital projection, a five-year financial model, and "
        "the feasibility, as the companion to this read, so every party comes to the conversation "
        "with the same numbers. The purpose of the meeting is to settle the five questions and the "
        "split; the model turns those decisions into figures.", P))
    el.append(Spacer(1, 3))
    el.append(card(
        "The one number still to fix before we commit is the start-up capital, which is exactly "
        "what the companion model sizes, against the scope and the space we choose together.", bg=SURFACE))
    el.append(PageBreak())

    # 07 Next steps
    sec(el, "07", "NEXT STEPS", "From this read to a signed partnership.")
    for h, t in [
        ("The three-party conversation.",
         "Itunu, Dr Kpaduwa and C4A settle the five questions and confirm the split. C4A "
         "facilitates. Dr Kpaduwa is in Lagos this month, so the timing is right."),
        ("The financial model.",
         "C4A brings the start-up capital projection, the five-year model and the feasibility to "
         "the table, built against the scope and space we agree."),
        ("Term sheet, then agreement.",
         "On alignment, C4A drafts the commercial term sheet, then the shareholder agreement "
         "through its legal partners, reviewed and executed by all three parties."),
        ("Incorporate and launch.",
         "The JV company is incorporated, the space fitted out, the team recruited through Maarova "
         "and onboarded on HospitlOS, and the service soft-launched to the Medbury base."),
    ]:
        el.append(Paragraph("<b>" + h + "</b>&nbsp; " + t, P))
    el.append(Spacer(1, 8))
    el.append(card(
        "<b>Debo Odulana</b> &nbsp; Consult for Africa &nbsp; / &nbsp; Lagos and Abuja<br/>"
        "+234 913 813 8553 &nbsp; / &nbsp; hello@consultforafrica.com &nbsp; / &nbsp; consultforafrica.com",
        bg=NAVY, fg=white))
    el.append(Spacer(1, 6))
    el.append(Paragraph(
        "Shared in confidence with Dr Itunu Akinware, Dr Chinwe Kpaduwa and Medbury Healthcare "
        "Group leadership, as a pre-read for the partnership conversation. Shareholding and terms "
        "are as proposed and to be agreed in writing. Not a binding offer.", SMALL))

    doc.build(el)
    print(f"wrote {OUT}")


if __name__ == "__main__":
    build()
