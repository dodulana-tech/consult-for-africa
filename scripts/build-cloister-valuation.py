"""
Build "The Cloister -- Financial Projection & Valuation" PDF for Medbury.

A 5-year projection and DCF valuation of the two-business institution
(the address + the family-practice OpCo, consolidated; intra-company OpCo
tenancy eliminated). Companion to the concept note
docs/medbury-harley-street-ikoyi-cfa.pdf.

All figures in NGN millions unless stated. Illustrative, assumption-driven;
every driver is stated so it can be tuned. Premium Cloister palette (emerald +
champagne gold + ivory). No em dashes.

Run:
  python3 scripts/build-cloister-valuation.py
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
OUT = DOCS / "medbury-cloister-valuation-cfa.pdf"

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
CELL = style("cell", fontSize=9, leading=12)
CELL_R = style("cellr", fontSize=9, leading=12, alignment=2)
CELL_B = style("cellb", fontSize=9, leading=12, fontName="Helvetica-Bold", textColor=NAVY)
CELL_BR = style("cellbr", fontSize=9, leading=12, fontName="Helvetica-Bold", textColor=NAVY, alignment=2)
CELL_W = style("cellw", fontSize=9, leading=12, fontName="Helvetica-Bold", textColor=white)
CELL_WR = style("cellwr", fontSize=9, leading=12, fontName="Helvetica-Bold", textColor=white, alignment=2)


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
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 56, "FINANCIAL PROJECTION & VALUATION")
    draw_colonnade(c, cw, PAGE_H - 305, n=7, color=GOLD)
    c.setFillColor(white); c.setFont("Helvetica-Bold", 42); c.drawCentredString(cw, PAGE_H - 362, "The Cloister")
    c.setFillColor(GOLD); c.setFont("Helvetica-Oblique", 16); c.drawCentredString(cw, PAGE_H - 393, "Care worth staying home for.")
    c.setStrokeColor(GOLD); c.setLineWidth(0.8); c.line(cw - 36, PAGE_H - 410, cw + 36, PAGE_H - 410)
    c.setFillColor(LIGHT); c.setFont("Helvetica", 10.5)
    c.drawCentredString(cw, PAGE_H - 430, "Financial projection and DCF valuation  ·  a five-year model")
    c.setStrokeColor(GOLD); c.setLineWidth(0.6); c.line(cw - 26, 120, cw + 26, 120)
    c.setFillColor(LIGHT); c.setFont("Helvetica", 9.5)
    c.drawCentredString(cw, 102, "Prepared for Dr Itunu Akinware, Group CEO, Medbury Healthcare Group")
    c.setFillColor(MUTED); c.setFont("Helvetica", 8)
    c.drawCentredString(cw, 87, "A Consult for Africa concept  ·  July 2026  ·  NGN millions  ·  Private")
    c.restoreState()


def content_bg(c, doc):
    c.saveState()
    c.setFillColor(NAVY); c.rect(0, PAGE_H - 34, PAGE_W, 34, fill=1, stroke=0)
    c.setFillColor(GOLD); c.rect(0, PAGE_H - 37, PAGE_W, 3, fill=1, stroke=0)
    c.setFillColor(white); c.setFont("Helvetica-Bold", 8.5); c.drawString(MARGIN, PAGE_H - 23, "THE CLOISTER")
    c.setFillColor(LIGHT); c.setFont("Helvetica", 8.5)
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 23, "Financial Projection & Valuation")
    c.setFillColor(GOLD); c.rect(MARGIN, 30, 24, 2, fill=1, stroke=0)
    c.setFillColor(MUTED); c.setFont("Helvetica", 8)
    c.drawString(MARGIN, 18, "Private and confidential  /  Illustrative, assumption-driven")
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
    st = [
        ("BACKGROUND", (0, 0), (-1, 0), NAVY), ("LINEBELOW", (0, 0), (-1, 0), 2, GOLD),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 8), ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, SURFACE]),
    ]
    for i in total_rows:
        st.append(("BACKGROUND", (0, i + 1), (-1, i + 1), CREAM))
        st.append(("LINEABOVE", (0, i + 1), (-1, i + 1), 1.0, GOLD))
    for i in subtotal_rows:
        st.append(("LINEABOVE", (0, i + 1), (-1, i + 1), 0.5, LIGHT))
    t.setStyle(TableStyle(st))
    return t


def build():
    doc = BaseDocTemplate(str(OUT), pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN,
                          topMargin=52, bottomMargin=42,
                          title="The Cloister - Financial Projection & Valuation",
                          author="Consult for Africa")
    doc.addPageTemplates([
        PageTemplate(id="cover", frames=[Frame(MARGIN, 170, PAGE_W - 2 * MARGIN, PAGE_H - 330, id="cover")], onPage=cover_bg),
        PageTemplate(id="content", frames=[Frame(MARGIN, 42, PAGE_W - 2 * MARGIN, PAGE_H - 52 - 42, id="content")], onPage=content_bg),
    ])
    FULLW = PAGE_W - 2 * MARGIN
    YW = 72
    LW = FULLW - 5 * YW  # label width for 5-year grids
    YRS = ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5"]
    el = []

    # ---- COVER ----
    el.append(Spacer(1, 2))
    el.append(NextPageTemplate("content"))
    el.append(PageBreak())

    # ---- 01 Assumptions ----
    el.append(Paragraph("01  /  THE MODEL AND ITS DRIVERS", EYEBROW))
    el.append(Paragraph("What the projection assumes.", H1))
    el.append(Paragraph(
        "The Cloister is modelled as one consolidated institution of two businesses, the address "
        "and the family-practice OpCo, with the intra-company OpCo tenancy eliminated. The address "
        "opens and ramps in Year 1; the membership launches alongside it. Every driver below can "
        "be tuned, and the valuation moves with them.", LEDE))
    el.append(grid(
        [["The address, external revenue at run-rate", "NGN 339M", "Specialist membership, sessions and BQ office leases"],
         ["Membership blended fee", "NGN 2.38M / member / yr", "Weighted across Individual, Family and Executive tiers"],
         ["Membership ramp (members)", "180 to 680", "Year 1 launch to Year 5, panels of ~350 per physician"],
         ["OpCo direct cost of care", "50% of OpCo revenue", "Physicians, nurses, annual screens, admin and marketing"],
         ["Operator fee to C4A", "20% of institution EBITDA", "C4A builds and runs both businesses"],
         ["Tax and maintenance", "~30% effective", "Nigerian company tax and maintenance capex"],
         ["Discount rate (NGN nominal)", "28%", "Nigerian cost of capital"],
         ["Terminal growth (NGN nominal)", "12%", "Long-run nominal, below inflation-plus-real growth"]],
        ["Driver", "Assumption", "Note"],
        [150, 118, FULLW - 268], aligns=["l", "l"]))
    el.append(Spacer(1, 5))
    el.append(Paragraph(
        "Figures are in NGN nominal, priced to Lagos cash-pay demand and benchmarked to premium "
        "London and Lagos practice (concept note, sections 05 and 06). The naira is inflationary, "
        "so the 28% discount rate and 12% terminal growth are stated together and should be tuned "
        "as a pair.", SMALL))
    el.append(PageBreak())

    # ---- 02 Revenue ----
    el.append(Paragraph("02  /  REVENUE", EYEBROW))
    el.append(Paragraph("Two engines, ramping. NGN millions.", H1))
    el.append(grid(
        [["The address (membership, sessions, offices)", "186", "339", "380", "407", "427"],
         ["Membership members (count)", "180", "380", "500", "600", "680"],
         ["The membership OpCo (revenue)", "428", "905", "1,190", "1,428", "1,618"],
         ["Total institution revenue", "614", "1,244", "1,570", "1,835", "2,045"]],
        ["Revenue (NGN M)"] + YRS, [LW] + [YW] * 5, total_rows={3}))
    el.append(Spacer(1, 6))
    el.append(Paragraph(
        "The address reaches its run-rate by Year 2 and grows modestly on sell-through and rate. "
        "The membership is the growth engine: it launches at about 180 members, hits its Year-2 "
        "target of 380, and builds toward 680 as the panels fill. By Year 5 the institution is "
        "turning over more than NGN 2 billion a year, the great majority of it recurring.", P))
    el.append(PageBreak())

    # ---- 03 EBITDA ----
    el.append(Paragraph("03  /  PROFITABILITY", EYEBROW))
    el.append(Paragraph("From revenue to Medbury's earnings. NGN millions.", H1))
    el.append(grid(
        [["Total institution revenue", "614", "1,244", "1,570", "1,835", "2,045"],
         ["Less: building hold cost", "(92)", "(97)", "(102)", "(107)", "(112)"],
         ["Less: OpCo cost of care (50%)", "(214)", "(453)", "(595)", "(714)", "(809)"],
         ["Institution EBITDA", "308", "694", "873", "1,014", "1,124"],
         ["Less: operator fee to C4A (20%)", "(62)", "(139)", "(175)", "(203)", "(225)"],
         ["Medbury EBITDA", "246", "555", "698", "811", "899"]],
        ["Profit (NGN M)"] + YRS, [LW] + [YW] * 5, total_rows={5}, subtotal_rows={3}))
    el.append(Spacer(1, 6))
    el.append(Paragraph(
        "The address covers its own building cost from a light base; the margin comes from the "
        "sessions and, above all, the membership, which carries a healthy contribution once the "
        "panels are full. After C4A's operator fee, Medbury's own EBITDA runs from about NGN 246M "
        "in the launch year to nearly NGN 900M by Year 5, on an upfront investment of roughly "
        "NGN 150M across the address fit-out and the OpCo launch.", P))
    el.append(Spacer(1, 6))
    el.append(Paragraph("The clinical headcount is lean.", H2))
    el.append(grid(
        [["Members", "180", "380", "500", "600", "680"],
         ["Family physicians (employed)", "2", "2", "2", "3", "3"],
         ["Panel per physician (members)", "90", "190", "250", "200", "227"],
         ["Nurses and coordinators", "3", "4", "4", "5", "5"],
         ["Specialists on roster (affiliated)", "15", "25", "30", "35", "40"]],
        ["Staffing and panels"] + YRS, [LW] + [YW] * 5, subtotal_rows={1}))
    el.append(Spacer(1, 5))
    el.append(Paragraph(
        "The institution employs only two to three family physicians, on premium panels held "
        "deliberately small, plus a handful of nurses and coordinators. The specialists are a "
        "paid-us roster of affiliated members, not payroll, which is the whole margin lever. On "
        "space, the family practice holds two to three of the seven rooms; 500 members is the "
        "point at which a second address is triggered, not the building overcrowded.", SMALL))
    el.append(PageBreak())

    # ---- 04 DCF ----
    el.append(Paragraph("04  /  VALUATION", EYEBROW))
    el.append(Paragraph("Discounted cash flow. NGN millions.", H1))
    el.append(grid(
        [["Medbury EBITDA", "246", "555", "698", "811", "899"],
         ["Free cash flow (after tax, maintenance)", "172", "389", "489", "568", "629"],
         ["Discount factor at 28%", "0.78", "0.61", "0.48", "0.37", "0.29"],
         ["Present value of free cash flow", "134", "237", "233", "212", "183"]],
        ["Discounted cash flow (NGN M)"] + YRS, [LW] + [YW] * 5, subtotal_rows={1}))
    el.append(Spacer(1, 8))
    el.append(grid(
        [["Sum of PV, Years 1 to 5 free cash flow", "NGN 999M"],
         ["Terminal value at end of Year 5 (12% growth)", "NGN 4,403M"],
         ["Present value of terminal value", "NGN 1,281M"],
         ["Enterprise value of The Cloister", "NGN 2,280M"]],
        ["Valuation build", "Amount"], [FULLW - 150, 150], total_rows={3}))
    el.append(Spacer(1, 6))
    el.append(card(
        "On these assumptions The Cloister is worth about <b>NGN 2.3 billion</b>, against an upfront "
        "investment of roughly NGN 150M. The institution pays that upfront back inside the first "
        "year of run-rate and compounds from there, and the valuation still excludes the "
        "diagnostics, pharmacy and procedure revenue the two engines drive into the wider Medbury "
        "network.", bg=PANEL))
    el.append(PageBreak())

    # ---- 05 Scenario analysis ----
    el.append(Paragraph("05  /  SCENARIO ANALYSIS", EYEBROW))
    el.append(Paragraph("Three ways it could go.", H1))
    el.append(Paragraph(
        "The base case is deliberately conservative. The value turns most on how fast the "
        "membership fills and how hard the rooms are used, so the model is run in three scenarios "
        "that flex those operational drivers together. The discount rate is held at 28% across all "
        "three; the grid overleaf varies it separately.", P))
    el.append(grid(
        [["Members by Year 5", "500", "680", "1,050"],
         ["Consulting sell-through", "~45%", "~55%", "~65%"],
         ["OpCo cost of care", "52%", "50%", "48%"],
         ["Membership ramp", "Slow", "Steady", "Fast"]],
        ["Scenario drivers", "Bear", "Base", "Bull"],
        [FULLW - 3 * 110, 110, 110, 110]))
    el.append(Spacer(1, 8))
    el.append(grid(
        [["Year-5 total revenue (NGN Bn)", "1.5", "2.0", "3.0"],
         ["Year-5 Medbury EBITDA (NGN M)", "611", "899", "1,366"],
         ["Enterprise value (NGN Bn)", "1.5", "2.3", "3.4"]],
        ["Outcome", "Bear", "Base", "Bull"],
        [FULLW - 3 * 110, 110, 110, 110], total_rows={2}))
    el.append(Spacer(1, 6))
    el.append(card(
        "Even the bear case, a slow membership build with rooms half empty, values the institution "
        "at about NGN 1.5 billion, some ten times the upfront. The bull case, a fast fill toward a "
        "thousand members, reaches NGN 3.4 billion. The downside is protected by the recurring "
        "memberships, offices and OpCo tenancy, which cover the building before a room is used.",
        bg=PANEL))
    el.append(PageBreak())

    # ---- 06 Sensitivity + caveats ----
    el.append(Paragraph("06  /  SENSITIVITY", EYEBROW))
    el.append(Paragraph("What moves the number.", H1))
    el.append(Paragraph(
        "The valuation is most sensitive to the discount rate and the terminal growth, the pair "
        "that captures the naira's inflation and Nigeria's cost of capital, and to the membership "
        "ramp. The grid shows the enterprise value, in NGN billions, across a reasonable range of "
        "the first two.", P))
    el.append(grid(
        [["Discount 25%", "2.5", "2.8", "3.3"],
         ["Discount 28% (base)", "2.1", "2.3", "2.6"],
         ["Discount 32%", "1.6", "1.7", "1.9"]],
        ["Enterprise value (NGN Bn)", "Growth 10%", "Growth 12%", "Growth 14%"],
        [FULLW - 3 * 110, 110, 110, 110], subtotal_rows={1}))
    el.append(Spacer(1, 6))
    el.append(Paragraph(
        "Across the range the institution is worth between roughly NGN 1.6 billion and NGN 3.3 "
        "billion, with a central case near NGN 2.3 billion. The membership ramp is the other lever: "
        "reaching the Year-2 target of 380 members a year earlier, or building past 680, lifts every "
        "figure above.", P))
    el.append(Paragraph("A note on the assumptions.", H2))
    el.append(Paragraph(
        "This is an illustrative model, not a diligence-grade one. The revenue drivers are "
        "benchmarked to premium London and Lagos practice and to the concept note; the cost of "
        "care, the operator fee, the discount rate and the terminal growth are stated so they can "
        "be set against real figures once a building is shortlisted, the Med Lyfe rates are live, "
        "and the OpCo staffing is priced. The intra-company OpCo tenancy is eliminated in "
        "consolidation. Figures are NGN nominal.", P))
    el.append(Spacer(1, 8))
    el.append(card(
        "<b>Debo Odulana</b> &nbsp; Consult for Africa &nbsp; / &nbsp; Lagos and Abuja<br/>"
        "+234 913 813 8553 &nbsp; / &nbsp; hello@consultforafrica.com &nbsp; / &nbsp; consultforafrica.com",
        bg=NAVY, fg=white))

    doc.build(el)
    print(f"wrote {OUT}")


if __name__ == "__main__":
    build()
