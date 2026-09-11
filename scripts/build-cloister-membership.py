"""
Build "The Cloister -- The Family-Practice Membership" product brief PDF.

Companion to the concept note and the valuation model. Sets out the patient-side
product: a Medbury operating company selling concierge family medicine with an
embedded annual executive wellness screen and quarterbacked specialist access.

Grounded in deep research: concierge / DPC / family-medicine membership taxonomy;
HCA UK GP-subscription template (annual screen embedded at each tier); Duchess
(N83k-478k exec checks + N4M Royal) and Reddington (premium screen content) as
Lagos anchors; concierge panels of 300-600; the annual screen as the benefit that
anchors a recurring fee and drives downstream diagnostics.

Cloister brand (emerald + champagne gold + ivory). NGN. No em dashes.

Run:
  python3 scripts/build-cloister-membership.py
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
OUT = DOCS / "medbury-cloister-membership-brief-cfa.pdf"

NAVY = HexColor("#0F3D2E")
DEEP_NAVY = HexColor("#08261C")
GOLD = HexColor("#C6A15B")
TEAL = HexColor("#2F6B52")
BODY = HexColor("#23302B")
MUTED = HexColor("#7C7C74")
SURFACE = HexColor("#F5F2EA")
LIGHT = HexColor("#CBDDD1")
PANEL = HexColor("#E9F0EA")
CREAM = HexColor("#F6EFDD")

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
LEDE = style("lede", fontSize=11, leading=16.5, textColor=HexColor("#374151"))
SMALL = style("small", fontSize=8.5, leading=12, textColor=MUTED)
CELL = style("cell", fontSize=9.5, leading=12.5)
CELL_R = style("cellr", fontSize=9.5, leading=12.5, alignment=2)
CELL_B = style("cellb", fontSize=9.5, leading=12.5, fontName="Helvetica-Bold", textColor=NAVY)
CELL_BR = style("cellbr", fontSize=9.5, leading=12.5, fontName="Helvetica-Bold", textColor=NAVY, alignment=2)
CELL_W = style("cellw", fontSize=9.5, leading=12.5, fontName="Helvetica-Bold", textColor=white)
CELL_WR = style("cellwr", fontSize=9.5, leading=12.5, fontName="Helvetica-Bold", textColor=white, alignment=2)


def draw_colonnade(c, cx, cy, n=7, aw=13, gap=8, legh=12, color=GOLD, lw=1.0):
    total = n * aw + (n - 1) * gap
    x0 = cx - total / 2.0
    c.setStrokeColor(color); c.setLineWidth(lw)
    for i in range(n):
        x = x0 + i * (aw + gap)
        c.line(x, cy, x, cy + legh); c.line(x + aw, cy, x + aw, cy + legh)
        p = c.beginPath(); p.arc(x, cy + legh - aw / 2.0, x + aw, cy + legh + aw / 2.0, 0, 180)
        c.drawPath(p, stroke=1, fill=0)
    c.setLineWidth(lw * 0.8); c.line(x0 - 4, cy, x0 + total + 4, cy)


def cover_bg(c, doc):
    c.saveState()
    cw = PAGE_W / 2.0
    c.setFillColor(NAVY); c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.setStrokeColor(GOLD); c.setLineWidth(0.6); c.line(MARGIN, PAGE_H - 62, PAGE_W - MARGIN, PAGE_H - 62)
    c.setFillColor(LIGHT); c.setFont("Helvetica", 8)
    c.drawString(MARGIN, PAGE_H - 56, "THE CLOISTER")
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 56, "THE FAMILY-PRACTICE MEMBERSHIP")
    draw_colonnade(c, cw, PAGE_H - 305, n=7, color=GOLD)
    c.setFillColor(white); c.setFont("Helvetica-Bold", 42); c.drawCentredString(cw, PAGE_H - 362, "The Cloister")
    c.setFillColor(GOLD); c.setFont("Helvetica-Oblique", 16); c.drawCentredString(cw, PAGE_H - 393, "Care worth staying home for.")
    c.setStrokeColor(GOLD); c.setLineWidth(0.8); c.line(cw - 36, PAGE_H - 410, cw + 36, PAGE_H - 410)
    c.setFillColor(LIGHT); c.setFont("Helvetica", 10.5)
    c.drawCentredString(cw, PAGE_H - 430, "The family-practice membership  ·  a Medbury operating company")
    c.setStrokeColor(GOLD); c.setLineWidth(0.6); c.line(cw - 26, 120, cw + 26, 120)
    c.setFillColor(LIGHT); c.setFont("Helvetica", 9.5)
    c.drawCentredString(cw, 102, "Prepared for Dr Itunu Akinware, Group CEO, Medbury Healthcare Group")
    c.setFillColor(MUTED); c.setFont("Helvetica", 8)
    c.drawCentredString(cw, 87, "A Consult for Africa concept  ·  July 2026  ·  Private and confidential")
    c.restoreState()


def content_bg(c, doc):
    c.saveState()
    c.setFillColor(NAVY); c.rect(0, PAGE_H - 34, PAGE_W, 34, fill=1, stroke=0)
    c.setFillColor(GOLD); c.rect(0, PAGE_H - 37, PAGE_W, 3, fill=1, stroke=0)
    c.setFillColor(white); c.setFont("Helvetica-Bold", 8.5); c.drawString(MARGIN, PAGE_H - 23, "THE CLOISTER")
    c.setFillColor(LIGHT); c.setFont("Helvetica", 8.5)
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 23, "The Family-Practice Membership")
    c.setFillColor(GOLD); c.rect(MARGIN, 30, 24, 2, fill=1, stroke=0)
    c.setFillColor(MUTED); c.setFont("Helvetica", 8)
    c.drawString(MARGIN, 18, "Private and confidential  /  A Medbury operating company")
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


def grid(rows, col_labels, widths, total_rows=None, subtotal_rows=None, aligns=None):
    total_rows = total_rows or set()
    subtotal_rows = subtotal_rows or set()
    ncols = len(col_labels)
    if aligns is None:
        aligns = ["r"] * (ncols - 1)
    data = [[Paragraph(col_labels[0], CELL_W)] + [Paragraph(t, CELL_WR if aligns[j] == "r" else CELL_W)
                                                  for j, t in enumerate(col_labels[1:])]]
    for i, r in enumerate(rows):
        emph = i in total_rows or i in subtotal_rows
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
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 9), ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, SURFACE]),
    ]
    for i in total_rows:
        stl.append(("BACKGROUND", (0, i + 1), (-1, i + 1), CREAM))
        stl.append(("LINEABOVE", (0, i + 1), (-1, i + 1), 1.0, GOLD))
    for i in subtotal_rows:
        stl.append(("LINEABOVE", (0, i + 1), (-1, i + 1), 0.5, LIGHT))
    t.setStyle(TableStyle(stl))
    return t


def sec(el, num, eyebrow, title):
    el.append(Paragraph(num + "  /  " + eyebrow, EYEBROW))
    el.append(Paragraph(title, H1))


def build():
    doc = BaseDocTemplate(str(OUT), pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN,
                          topMargin=52, bottomMargin=42,
                          title="The Cloister - The Family-Practice Membership",
                          author="Consult for Africa")
    doc.addPageTemplates([
        PageTemplate(id="cover", frames=[Frame(MARGIN, 170, PAGE_W - 2 * MARGIN, PAGE_H - 330, id="cover")], onPage=cover_bg),
        PageTemplate(id="content", frames=[Frame(MARGIN, 42, PAGE_W - 2 * MARGIN, PAGE_H - 52 - 42, id="content")], onPage=content_bg),
    ])
    FULLW = PAGE_W - 2 * MARGIN
    YW = 72
    LW = FULLW - 5 * YW
    YRS = ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5"]
    el = []

    el.append(Spacer(1, 2))
    el.append(NextPageTemplate("content"))
    el.append(PageBreak())

    # 01 The product
    sec(el, "01", "THE PRODUCT", "A family physician, an annual check, and the specialists on call.")
    el.append(Paragraph(
        "The Cloister is a members' address on both sides. This brief is the patient side: a "
        "membership sold to Lagos families, run through a dedicated Medbury operating company. It "
        "is concierge family medicine, the model HCA runs in London and MDVIP in the United "
        "States, priced to Lagos.", LEDE))
    el.append(Paragraph(
        "Each member gets a dedicated family physician who holds a small panel and actually knows "
        "them, unlimited priority care in person and by phone, an annual executive wellness screen "
        "built into the membership, and specialist access the family physician coordinates and "
        "expedites at the address. It is sold as an annual membership, in three tiers, and it turns "
        "a one-off check-up into a relationship that stays in Lagos.", P))
    el.append(Spacer(1, 3))
    el.append(card(
        "The membership is the product that keeps the patient, and the family physician is the "
        "front door to everything else The Cloister and the wider Medbury network can do.", bg=PANEL))
    el.append(PageBreak())

    # 02 Who it is for
    sec(el, "02", "THE MARKET", "Who it is for, and why they will pay.")
    el.append(Paragraph(
        "More than three quarters of Nigerian health spending is out of pocket, and the wealthiest "
        "families take their serious care abroad. They are not flying for the procedure. They are "
        "flying for the relationship: a doctor who knows them, a trusted address, a specialist on "
        "call. Lagos sells them the one-off check, Duchess from NGN 83,000 to NGN 478,000 and a "
        "flagship check at NGN 4M, but no one sells them the continuous membership.", P))
    el.append(Paragraph(
        "The buyers are the same people The Cloister's address is built for: HNI families and "
        "executives, the diaspora who spend part of the year in Lagos, and the corporate "
        "principals in Medbury's existing book. They pay, in cash, out of pocket, for exactly this "
        "kind of trusted, unhurried care. The membership is how Medbury holds that relationship "
        "instead of losing it to a plane ticket.", P))
    el.append(PageBreak())

    # 03 The tiers
    sec(el, "03", "THE TIERS", "Three memberships, clearly defined.")
    el.append(Paragraph(
        "Every tier carries a dedicated family physician, unlimited priority primary care in "
        "person and by telemedicine, an annual executive wellness screen, quarterbacked specialist "
        "access at member rates, and Medbury diagnostics and pharmacy benefits. The tiers differ "
        "by who is covered and how deep the annual screen and the access go.", P))
    el.append(grid(
        [["Individual", "NGN 1,500,000 / yr",
          "One member. Premium annual screen, priority primary care, specialist access"],
         ["Family (up to four)", "NGN 3,500,000 / yr",
          "The household. Annual screens for the two principals; paediatric and women's health"],
         ["Executive / Elite", "NGN 6,000,000 / yr",
          "Per principal. Advanced annual screen, 24/7 physician line, home visits, a dedicated concierge"]],
        ["Membership tier", "Per year", "What it includes"],
        [118, 108, FULLW - 226], aligns=["l", "l"]))
    el.append(Spacer(1, 5))
    el.append(Paragraph(
        "Pricing sits between HCA UK's family GP membership, roughly NGN 1.2M a year with a basic "
        "screen, and the US concierge band of NGN 3M to 8M, and is anchored to what Duchess and "
        "Reddington already charge Lagos families for the annual screen alone. It is a relationship "
        "priced for people who currently spend far more on the plane ticket.", SMALL))
    el.append(PageBreak())

    # 04 The annual screen
    sec(el, "04", "THE ANNUAL SCREEN", "The check that anchors the membership.")
    el.append(Paragraph(
        "The annual executive wellness screen is the benefit that makes a membership worth more "
        "than a one-off check. It recurs, it catches disease early, and it is the engine that "
        "drives diagnostics volume back into the Medbury network. It follows the local premium "
        "standard that Reddington and Duchess already sell, delivered through Lifecheck.", P))
    el.append(grid(
        [["Clinical", "Full physical, resting and stress ECG, lung function, hearing and vision"],
         ["Laboratory", "Full blood count, kidney and liver function, glucose, lipids, urinalysis"],
         ["Imaging", "Chest imaging, abdominopelvic ultrasound, mammography"],
         ["Cancer screening", "Breast, prostate (PSA), cervical (Pap), colorectal (FOBT)"],
         ["Executive tier adds", "Advanced imaging, cardiology work-up, and longevity markers"]],
        ["The annual screen", "What it covers"],
        [140, FULLW - 140], aligns=["l"]))
    el.append(Spacer(1, 5))
    el.append(Paragraph(
        "Because the screen runs through Lifecheck, the diagnostics revenue it generates lands "
        "inside Medbury, not with a competitor. A member who joins for the annual check becomes a "
        "year-round relationship, and every finding routes to a Cloister specialist down the "
        "corridor.", SMALL))
    el.append(PageBreak())

    # 05 Specialist access
    sec(el, "05", "SPECIALIST ACCESS", "The family physician quarterbacks the specialists.")
    el.append(Paragraph(
        "The member never hunts for a specialist. The family physician quarterbacks the whole "
        "pathway: identifies the need, books one of the Cloister's specialists, briefs them, sits "
        "in where it helps, and follows up afterwards. Priority access and member rates come with "
        "the membership. This is the concierge model that Cleveland Clinic and the top US "
        "practices run, and it is what makes the membership feel like the London or Dubai "
        "experience, at home.", P))
    el.append(Paragraph(
        "It is also what closes the loop on the address. The specialists practise at The Cloister "
        "because the memberships bring them booked patients; the members join because the "
        "specialists they would fly to see are on call. When surgery or intensive care is needed, "
        "the tertiary partner in Ikoyi carries it, and the member stays inside one coordinated "
        "system from first call to recovery.", P))
    el.append(PageBreak())

    # 06 The economics
    sec(el, "06", "THE ECONOMICS", "A recurring product that feeds the network.")
    el.append(Paragraph("The membership builds by tier. NGN, members.", H2))
    el.append(grid(
        [["Individual", "130", "250", "330", "400", "450"],
         ["Family", "40", "100", "130", "155", "180"],
         ["Executive / Elite", "10", "30", "40", "45", "50"],
         ["Total members", "180", "380", "500", "600", "680"]],
        ["Membership build"] + YRS, [LW] + [YW] * 5, total_rows={3}))
    el.append(Spacer(1, 6))
    el.append(Paragraph("The OpCo profit and loss, at the Year-2 target. NGN millions.", H2))
    el.append(grid(
        [["Membership revenue (380 members)", "905"],
         ["Cost of care (physicians, nurses, screens, coordination)", "(360)"],
         ["Facility tenancy, to The Cloister address", "(48)"],
         ["Admin, marketing and technology", "(90)"],
         ["OpCo contribution", "407"]],
        ["The membership OpCo (Year 2)", "NGN M"], [FULLW - 120, 120], total_rows={4}))
    el.append(Spacer(1, 5))
    el.append(Paragraph(
        "The OpCo runs at roughly a 45% contribution once the panels fill, on a lean core of two "
        "to three family physicians and a few nurses. On top of that, it is the single best feeder "
        "of the Medbury network: the annual screens drive Lifecheck diagnostics, the prescriptions "
        "drive the pharmacy, and the referrals fill the Cloister specialists' rooms, so a large "
        "further slice of value lands elsewhere in Medbury at Medbury's own margins.", P))
    el.append(PageBreak())

    # 07 Structure and rollout
    sec(el, "07", "STRUCTURE AND ROLLOUT", "Who owns it, and how it starts.")
    el.append(Paragraph(
        "Medbury owns and funds the operating company. C4A builds and runs it, recruits the family "
        "physicians through Maarova, brings the specialist bench through the Doctors Foundation for "
        "Care, and it operates from The Cloister address as a tenant. The OpCo's setup capital is "
        "modest, the first physicians and the launch, roughly NGN 40M alongside the address "
        "fit-out.", P))
    for h, t in [
        ("Launch.",
         "Open the membership to Medbury's existing HNI patients and corporate principals, with the "
         "annual screen as the opening hook. Two family physicians, a nurse team, one health record."),
        ("Year 1.",
         "Build to about 180 members, seat them with their physicians, and run the first cycle of "
         "annual screens through Lifecheck."),
        ("Year 2.",
         "Reach the 380-member target, add a third physician as panels fill, and switch on the "
         "referral flow from the family physicians into the Cloister specialists."),
        ("Year 3 and beyond.",
         "Grow toward 680 members. At 500 the family practice takes a second room block or moves "
         "with the second address, so service quality never slips."),
    ]:
        el.append(Paragraph("<b>" + h + "</b>&nbsp; " + t, P))
    el.append(Spacer(1, 6))
    el.append(card(
        "<b>What we need from you.</b><br/>"
        "1.&nbsp; Confirm the product, the tiers and the direction of pricing.<br/>"
        "2.&nbsp; C4A recruits the founding family physicians and readies the annual-screen pathway "
        "through Lifecheck.<br/>"
        "3.&nbsp; We open the membership to your HNI base alongside The Cloister address.",
        bg=PANEL))
    el.append(Spacer(1, 8))
    el.append(card(
        "<b>Debo Odulana</b> &nbsp; Consult for Africa &nbsp; / &nbsp; Lagos and Abuja<br/>"
        "+234 913 813 8553 &nbsp; / &nbsp; hello@consultforafrica.com &nbsp; / &nbsp; consultforafrica.com",
        bg=NAVY, fg=white))
    el.append(Spacer(1, 6))
    el.append(Paragraph(
        "Figures are illustrative, priced to Lagos cash-pay demand and benchmarked to premium "
        "London and Lagos practice. Companion to The Cloister concept note and financial model. "
        "Not a binding offer.", SMALL))

    doc.build(el)
    print(f"wrote {OUT}")


if __name__ == "__main__":
    build()
