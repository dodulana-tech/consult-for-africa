"""
Build the Haven Paediatric Centre diagnostic audit scope (one-pager) for CFA.

Source narrative: docs/haven-diagnostic-audit-scope-cfa.md
Output:          docs/haven-diagnostic-audit-scope-cfa.pdf  (A4, branded)

Run:
  python3 scripts/build-haven-audit-scope.py
"""

from __future__ import annotations

from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "haven-diagnostic-audit-scope-cfa.pdf"

NAVY = HexColor("#0B3C5D")
GOLD = HexColor("#D4AF37")
TEAL = HexColor("#1F7A8C")
BODY = HexColor("#1F2937")
MUTED = HexColor("#6B7280")
SURFACE = HexColor("#F1F5F9")
LIGHT = HexColor("#C9D6E0")

PAGE_W, PAGE_H = A4
MARGIN = 46


def st(name, **kw):
    base = dict(fontName="Helvetica", fontSize=9.7, leading=14, textColor=BODY,
                alignment=TA_LEFT, spaceAfter=5)
    base.update(kw)
    return ParagraphStyle(name, **base)


H1 = st("h1", fontName="Helvetica-Bold", fontSize=12, leading=15, textColor=NAVY,
        spaceBefore=10, spaceAfter=5)
P = st("p")
SMALL = st("small", fontSize=8.3, leading=11.5, textColor=MUTED)
CELL = st("cell", fontSize=9, leading=12.5)
CELL_B = st("cellb", fontSize=9, leading=12.5, fontName="Helvetica-Bold")
CELL_W = st("cellw", fontSize=9, leading=12.5, fontName="Helvetica-Bold", textColor=white)


def furniture(c, doc):
    c.saveState()
    # top header band
    c.setFillColor(NAVY)
    c.rect(0, PAGE_H - 34, PAGE_W, 34, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(0, PAGE_H - 37, PAGE_W, 3, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(MARGIN, PAGE_H - 23, "CONSULT FOR AFRICA")
    c.setFillColor(LIGHT)
    c.setFont("Helvetica", 8.5)
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 23, "Haven Paediatric Centre  /  Diagnostic Audit Scope")
    # footer
    c.setFillColor(GOLD)
    c.rect(MARGIN, 30, 24, 2, fill=1, stroke=0)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8)
    c.drawString(MARGIN, 18, "Confidential  /  Prepared for the Haven Paediatric Centre board")
    c.drawRightString(PAGE_W - MARGIN, 18, "Page %d" % doc.page)
    c.restoreState()


def build():
    doc = BaseDocTemplate(
        str(OUT), pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN, topMargin=50, bottomMargin=40,
        title="Haven Paediatric Centre - Diagnostic Audit Scope",
        author="Consult For Africa",
    )
    frame = Frame(MARGIN, 40, PAGE_W - 2 * MARGIN, PAGE_H - 50 - 40, id="f")
    doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=furniture)])

    def bullets(items):
        out = []
        for b in items:
            out.append(Paragraph("•&nbsp;&nbsp;" + b, P))
        return out

    def chip_table(rows, header):
        data = [[Paragraph(header[0], CELL_W), Paragraph(header[1], CELL_W)]]
        for a, b in rows:
            data.append([Paragraph(a, CELL_B), Paragraph(b, CELL)])
        t = Table(data, colWidths=[60, PAGE_W - 2 * MARGIN - 60])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), NAVY),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, SURFACE]),
            ("LINEBELOW", (0, 0), (-1, 0), 2, GOLD),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 9),
            ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ]))
        return t

    el = []

    # ---- title block ----
    el.append(Paragraph("Diagnostic Audit",
                        ParagraphStyle("t", fontName="Helvetica-Bold", fontSize=21,
                                       leading=24, textColor=NAVY, spaceAfter=2)))
    el.append(Paragraph("Scope of Work  ·  Haven Paediatric Centre",
                        ParagraphStyle("s", fontName="Helvetica-Bold", fontSize=11,
                                       leading=15, textColor=TEAL, spaceAfter=6)))
    meta = ("Workstream 1 of the Consult for Africa engagement&nbsp;&nbsp;|&nbsp;&nbsp;"
            "Duration 4 weeks&nbsp;&nbsp;|&nbsp;&nbsp;Fee N2,100,000 (mobilisation, on signing)")
    el.append(Paragraph(meta, SMALL))
    el.append(Spacer(1, 2))
    el.append(Table([[""]], colWidths=[PAGE_W - 2 * MARGIN], rowHeights=[2],
                    style=TableStyle([("BACKGROUND", (0, 0), (-1, -1), GOLD)])))

    # ---- objective ----
    el.append(Paragraph("Objective", H1))
    el.append(Paragraph(
        "To establish, from evidence rather than impression, exactly where Haven stands across "
        "clinical safety, culture, operations, and cash, and to leave the board with a "
        "prioritised, costed plan of action. The audit is the foundation that shapes every "
        "workstream that follows. Two safety and cash quick wins are implemented during the "
        "audit, not after it.", P))

    # ---- what we examine ----
    el.append(Paragraph("What we will examine", H1))
    el.extend(bullets([
        "<b>Clinical governance and patient safety.</b> Incident review including the recent "
        "mortality, crash-cart and emergency readiness, clinical protocols, NICU readiness, and "
        "the safety routines that should run every shift.",
        "<b>Culture, routines, and incentives.</b> How work actually gets done, where nursing "
        "and operational routines break down, and whether the commission structure, JDS and KPIs "
        "reward quality and ownership.",
        "<b>Operations and SOP adherence.</b> Patient flow, customer service and booking, and the "
        "gaps between documented SOPs and what happens.",
        "<b>Finance and working capital.</b> Revenue mix and yield (private versus HMO), margins, "
        "the ~N4.2M in HMO receivables, the ~N2.77M in pharmacy stock, and where cash is locked.",
        "<b>Procurement and inventory.</b> Stock management, procurement reliability, pharmacy "
        "margin, and the case for a vendor-managed inventory model.",
        "<b>HMO economics.</b> Contract terms, claims and ageing, and yield per HMO versus private.",
        "<b>People and structure.</b> Staffing ratio, roles, and the specification for the senior "
        "operations leader role.",
        "<b>Management reporting integrity.</b> Whether the numbers the board sees can be trusted, "
        "starting with the reconciliation gaps in the current report.",
    ]))

    # ---- how we work ----
    el.append(Paragraph("How we will work", H1))
    el.append(Paragraph(
        "Structured interviews with leadership and frontline staff (nursing, pharmacy, customer "
        "service, operations), direct observation on site, review of financial, clinical and "
        "operational records, and a short data request issued in week one. The approach is "
        "collaborative, not audit-by-ambush. The team is a partner in the findings.", P))

    # ---- quick wins ----
    el.append(Paragraph("Quick wins delivered during the audit", H1))
    el.extend(bullets([
        "A stocked, sealed, checklist-governed crash cart with a shift-level check routine, live "
        "in week one.",
        "An immediate recovery push on the largest HMO receivables (Leadway and NEM), so cash "
        "starts moving before the audit even reports.",
    ]))

    # ---- deliverables ----
    el.append(Paragraph("Deliverables", H1))
    el.extend(bullets([
        "<b>Operational and Clinical Governance Audit Report.</b> Findings across every area "
        "above, with prioritised, costed recommendations.",
        "<b>Working Capital and Receivables Recovery Plan.</b> A concrete plan to unlock the cash "
        "tied up in receivables and stock.",
    ]))
    el.append(Paragraph(
        "Both are presented to the board in a working session at the end of week four.", SMALL))

    # ---- timeline ----
    el.append(KeepTogether([
        Paragraph("Timeline", H1),
        chip_table([
            ("Week 1", "Mobilise, interviews, data request, crash-cart standard live, receivables push begins"),
            ("Week 2", "Clinical governance and safety, culture and routines, operations and SOP walkthrough"),
            ("Week 3", "Finance and working capital, procurement and inventory, HMO economics, reporting integrity"),
            ("Week 4", "Synthesis, prioritised recommendations, board presentation"),
        ], ("Week", "Focus")),
    ]))

    # ---- what we need ----
    el.append(Paragraph("What we will need from Haven", H1))
    el.extend(bullets([
        "A named point person for the engagement (we suggest the Head of Operations).",
        "Read access to financial records, pharmacy stock data, HMO contracts, the staff roster "
        "and job descriptions, clinical incident records, and existing SOPs.",
        "Time with leadership and the nursing, pharmacy, and customer-service leads.",
        "Walk-through access to the facility.",
    ]))

    # ---- fee ----
    el.append(Paragraph("Fee and next step", H1))
    fee = Table([[Paragraph(
        "The diagnostic audit is the mobilisation phase of the engagement: "
        "<b>N2,100,000, payable on signing</b> (standard rate N3,500,000, at the 40 percent "
        "partner discount). On the board's go-ahead, we mobilise within the week.",
        ParagraphStyle("fee", parent=P, textColor=white))]],
        colWidths=[PAGE_W - 2 * MARGIN])
    fee.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NAVY),
        ("LINEBEFORE", (0, 0), (0, -1), 3, GOLD),
        ("TOPPADDING", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
    ]))
    el.append(fee)
    el.append(Spacer(1, 6))
    el.append(Paragraph(
        "Consult for Africa&nbsp;&nbsp;·&nbsp;&nbsp;hello@consultforafrica.com&nbsp;&nbsp;·"
        "&nbsp;&nbsp;+234 913 813 8553&nbsp;&nbsp;·&nbsp;&nbsp;consultforafrica.com", SMALL))

    doc.build(el)
    print(f"wrote {OUT}")


if __name__ == "__main__":
    build()
