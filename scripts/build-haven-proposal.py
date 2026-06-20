"""
Build the Haven Paediatric Centre proposal PDF for Consult For Africa.

Source narrative: docs/haven-paediatric-proposal-cfa.md
Output:          docs/haven-paediatric-proposal-cfa.pdf  (A4, multi-page, branded)

Run:
  python3 scripts/build-haven-proposal.py
"""

from __future__ import annotations

from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
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
OUT = DOCS / "haven-paediatric-proposal-cfa.pdf"

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

# ---------------------------------------------------------------- styles -----
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


# ----------------------------------------------------------- page furniture --
def cover_bg(c, doc):
    c.saveState()
    c.setFillColor(NAVY)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.setFillColor(DEEP_NAVY)
    c.rect(0, 0, PAGE_W, 10, fill=1, stroke=0)
    c.rect(0, PAGE_H - 10, PAGE_W, 10, fill=1, stroke=0)
    # eyebrow
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
    # gold rule bottom
    c.setFillColor(GOLD)
    c.rect(x, 150, 60, 3, fill=1, stroke=0)
    c.setFillColor(LIGHT)
    c.setFont("Helvetica", 9)
    c.drawString(x, 128, "hello@consultforafrica.com   /   +234 913 813 8553   /   consultforafrica.com")
    c.drawString(x, 112, "Lagos and Abuja, Nigeria")
    c.restoreState()


def content_bg(c, doc):
    c.saveState()
    # header band
    c.setFillColor(NAVY)
    c.rect(0, PAGE_H - 34, PAGE_W, 34, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(0, PAGE_H - 37, PAGE_W, 3, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(MARGIN, PAGE_H - 23, "CONSULT FOR AFRICA")
    c.setFillColor(LIGHT)
    c.setFont("Helvetica", 8.5)
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 23, "Haven Paediatric Centre  /  Proposal")
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
        leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=52, bottomMargin=42,
        title="Haven Paediatric Centre - Consult For Africa Proposal",
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

    el = []

    # ---------------- COVER ----------------
    el.append(Spacer(1, 40))
    el.append(Paragraph("Haven Paediatric Centre",
                        ParagraphStyle("ct", fontName="Helvetica-Bold", fontSize=30,
                                       leading=34, textColor=white)))
    el.append(Spacer(1, 10))
    el.append(Paragraph("Proposal for operational turnaround, culture, and growth",
                        ParagraphStyle("cs", fontName="Helvetica-Bold", fontSize=15,
                                       leading=20, textColor=GOLD)))
    el.append(Spacer(1, 26))
    el.append(Paragraph(
        "Building the culture, standards of work, and incentives that make good "
        "care self-sustaining. Then reengineering the operations and unlocking growth.",
        ParagraphStyle("cp", fontName="Helvetica", fontSize=11.5, leading=18, textColor=LIGHT)))
    el.append(Spacer(1, 30))
    for line in [
        "Date:  11 June 2026",
        "For:  Kabir Aregbesola, Dr Shakira Saliu (Aregbesola), Dr Odedina",
        "From:  Dr Debo Odulana, Founding Partner, Consult for Africa",
    ]:
        el.append(Paragraph(line, ParagraphStyle("cm", fontName="Helvetica", fontSize=10.5,
                                                  leading=18, textColor=white)))
    el.append(NextPageTemplate("content"))
    el.append(PageBreak())

    # ---------------- 1 ----------------
    el.append(Paragraph("1.  Why we are having this conversation", H1))
    el.append(Paragraph(
        "Haven Paediatric Centre was built to raise the standard of paediatric care in "
        "Nigeria. Fifteen months in, it is funding its own salaries, holding a steady "
        "patient base, and earning a real reputation in Ikeja. That is a genuine "
        "achievement for a young facility.", LEDE))
    el.append(Paragraph(
        "Last month it also recorded its first patient mortality. A sick child could not "
        "be resuscitated because critical medication was missing from the crash cart. That "
        "is the reason leadership reached out, and it is the right reason. It is also the "
        "moment to be honest about what it signals.", P))
    el.append(Paragraph(
        "This proposal sets out how Consult for Africa would help, the shape of my own "
        "involvement, and exactly what it costs, at full transparency.", P))

    # ---------------- 2 ----------------
    el.append(Paragraph("2.  The honest diagnosis: a culture problem, not a crash cart problem", H1))
    el.append(card(
        "A crash cart is empty because no shift-level routine exists to check it, and that "
        "routine does not exist because the culture and incentives that produce that "
        "discipline were never established. The missing drug is the symptom. The absent "
        "culture is the disease.", bg=SURFACE, bold=True))
    el.append(Spacer(1, 4))
    el.append(Paragraph("The same root cause shows up across the business:", P))
    for b in [
        "Nursing routines are not consistently established, which is a direct quality and "
        "safety risk.",
        "Margins are thin despite reasonable revenue, because there is no ownership culture "
        "pushing efficiency and yield.",
        "Two items already on the board's own decision list, the staff commission structure "
        "and the JDS and KPIs, are exactly the incentive and accountability tools a strong "
        "culture runs on. The report is already pointing at the answer.",
    ]:
        el.append(Paragraph("•&nbsp;&nbsp;" + b, P))
    el.append(Paragraph(
        "So the work is not to patch processes. It is to build the culture, the standards "
        "of work, and the incentives that make good processes self-sustaining, then "
        "reengineer the processes themselves so the culture has something solid to run on.", P))

    # ---------------- 3 ----------------
    el.append(Paragraph("3.  What the last management report already tells us", H1))
    el.append(Paragraph("The cash problem is a working capital problem, not a profit problem.", H2))
    el.append(Paragraph(
        "Leadership feels there is “barely anything left” after salaries. The report "
        "shows why: roughly N4.2M sits in HMO receivables (Leadway and NEM alone are the "
        "whole balance), close to a full period's revenue, and a further N2.77M sits in "
        "pharmacy stock. That is around N7M of working capital locked up. The money is not "
        "missing. It is on the shelf and in the HMO ledgers.", P))
    el.append(Paragraph("NICU is the growth engine and the clinical risk, in one initiative.", H2))
    el.append(Paragraph(
        "At a N3M deposit per admission against three beds, NICU is the single highest-yield "
        "lever in the building. It is also where the resuscitation risk concentrates. Haven "
        "cannot safely scale NICU admissions until the safety culture is established. Fix "
        "governance, then fill NICU safely, and the revenue follows. That is the through-line "
        "of the whole engagement.", P))
    el.append(Paragraph("The reporting layer is immature, and that is itself a finding.", H2))
    el.append(Paragraph(
        "The visit-type counts do not reconcile to total encounters, the receivables table "
        "does not foot, and a 201 percent pharmacy “profit” is actually a markup, not a "
        "margin. None of this is incompetence. It is the absence of a senior operator. You "
        "cannot manage what you cannot measure reliably.", P))

    # ---------------- 4 ----------------
    el.append(Paragraph("4.  Proposed involvement and engagement structure", H1))
    el.append(Paragraph(
        "A single board-led turnaround with five workstreams. The first four are the core "
        "project. The fifth is an optional, ongoing oversight retainer leadership can opt into.", P))
    ws = [
        ("1.  Diagnostic audit (4 weeks)",
         "A detailed audit across clinical governance, operations and SOP adherence, finance "
         "and working capital, procurement and inventory, HMO economics, staffing, and the "
         "reporting layer. Two quick wins run from week one: a checklist-governed crash cart, "
         "and an immediate recovery push on the Leadway and NEM receivables."),
        ("2.  Culture, incentives, and clinical standards of work",
         "The spine of the engagement. Establish the shift-level routines whose absence caused "
         "the mortality, the nursing standards of work, and the safety-huddle cadence. Redesign "
         "incentives: the commission structure and the JDS and KPIs already awaiting board "
         "approval, aligned to quality and ownership rather than activity alone."),
        ("3.  Process reengineering and operations",
         "Move procurement and inventory to a vendor-managed model. My specific recommendation "
         "is to engage Medbury Pharma for vendor-managed inventory, which ends the stockouts "
         "that caused the death and lifts pharmacy margin at once. Build the receivables "
         "recovery process and a reliable management reporting layer."),
        ("4.  Revenue and growth optimisation",
         "Internal growth (NICU activation, pricing review, pharmacy attach, HMO yield) and "
         "external growth (corporate tie-ups, school partnerships such as Toddler Town, and a "
         "referral pipeline)."),
        ("5.  Board-level management oversight (optional retainer)",
         "Up to two days per month of partner-level oversight from me or a delegate, continuing "
         "after the core project. The ongoing governance layer, offered as an opt-in."),
    ]
    for title, desc in ws:
        el.append(Paragraph(title, H2))
        el.append(Paragraph(desc, P))

    # ---------------- 5 ----------------
    el.append(Paragraph("5.  The senior operations leader", H1))
    el.append(Paragraph(
        "One thing I advised early still holds, and leadership is now ready for it: Haven "
        "needs a senior, experienced operations leader running the facility day to day. The "
        "audit defines that role and its KPIs first, so the hire lands into clarity rather "
        "than chaos. Consult for Africa can source and vet that person through CadreHealth, "
        "our workforce platform, including diaspora and senior operator profiles. Define the "
        "role during the engagement, then recruit into it.", P))

    el.append(PageBreak())

    # ---------------- 6 timeline ----------------
    el.append(Paragraph("6.  Timeline", H1))
    tl = [["Phase", "Timing", "Focus"],
          ["Stabilise", "Weeks 1 to 2", "Crash-cart standard and checklist, receivables recovery push"],
          ["Diagnostic audit", "Weeks 1 to 4", "Full audit across all functions"],
          ["Culture and process build", "Months 2 to 4", "Standards of work, incentives, procurement, reporting"],
          ["Growth", "Months 3 to 6", "NICU activation, pricing, corporate and HMO tie-ups"],
          ["Oversight", "Ongoing (optional)", "Board-level management retainer"]]
    rows = [[Paragraph(c, CELL_W if i == 0 else (CELL_B if j == 0 else CELL))
             for j, c in enumerate(r)] for i, r in enumerate(tl)]
    t = Table(rows, colWidths=[120, 95, PAGE_W - 2 * MARGIN - 215])
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

    # ---------------- 7 commercials ----------------
    el.append(Paragraph("7.  Commercials, in full transparency", H1))
    el.append(Paragraph(
        "We price every workstream at standard Consult for Africa rates so the board sees the "
        "real value, then show a single partner discount line, then the net. Nothing is hidden "
        "in the rate. Given our longstanding relationship, and that I have been invited to "
        "Haven's board, the facility receives a 40 percent discount on every line.", P))
    pricing = [
        ["Workstream", "Standard rate", "Partner rate (40% off)"],
        ["1.  Diagnostic audit (4 weeks)", "N3,500,000", "N2,100,000"],
        ["2.  Culture, incentives and standards", "N5,000,000", "N3,000,000"],
        ["3.  Process reengineering and operations", "N4,000,000", "N2,400,000"],
        ["4.  Revenue and growth optimisation", "N4,500,000", "N2,700,000"],
        ["Core project total", "N17,000,000", "N10,200,000"],
    ]
    prows = []
    for i, r in enumerate(pricing):
        last = (i == len(pricing) - 1)
        head = (i == 0)
        prows.append([
            Paragraph(r[0], CELL_W if head else (CELL_B if last else CELL)),
            Paragraph(r[1], CELL_W if head else (CELL_B if last else CELL)),
            Paragraph(r[2], CELL_W if head else (CELL_B if last else CELL)),
        ])
    pt = Table(prows, colWidths=[PAGE_W - 2 * MARGIN - 230, 115, 115])
    pt.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("BACKGROUND", (0, -1), (-1, -1), HexColor("#FBF6E6")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -2), [white, SURFACE]),
        ("LINEBELOW", (0, 0), (-1, 0), 2, GOLD),
        ("LINEABOVE", (0, -1), (-1, -1), 1.5, GOLD),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
    ]))
    el.append(pt)
    el.append(Spacer(1, 6))
    el.append(Paragraph(
        "The discount is a N6,800,000 concession, shown in full rather than buried in a lower "
        "headline rate.", SMALL))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>Optional ongoing oversight (Workstream 5):</b>&nbsp; standard N1,000,000 per month, "
        "partner rate <b>N600,000 per month</b>, for up to two days per month of "
        "partner-level oversight. Priced to senior-partner value and offered as an opt-in "
        "alongside the core project.", bg=HexColor("#EAF1F4")))
    el.append(Spacer(1, 6))
    el.append(Paragraph(
        "<b>Payment schedule:</b> a mobilisation fee on signing, then the balance spread in "
        "equal monthly installments, so cost tracks delivery and is comfortably covered by the "
        "receivables and margin the early work unlocks.", P))
    sched = [
        ["Payment", "When", "Amount"],
        ["Mobilisation (diagnostic audit)", "On signing", "N2,100,000"],
        ["Monthly installment (x5)", "Months 1 to 5", "N1,620,000 each"],
        ["Core project total", "", "N10,200,000"],
    ]
    srows = []
    for i, r in enumerate(sched):
        head = (i == 0)
        last = (i == len(sched) - 1)
        srows.append([Paragraph(c, CELL_W if head else (CELL_B if last else CELL)) for c in r])
    st_tbl = Table(srows, colWidths=[PAGE_W - 2 * MARGIN - 230, 115, 115])
    st_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("BACKGROUND", (0, -1), (-1, -1), HexColor("#FBF6E6")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -2), [white, SURFACE]),
        ("LINEBELOW", (0, 0), (-1, 0), 2, GOLD),
        ("LINEABOVE", (0, -1), (-1, -1), 1.5, GOLD),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
    ]))
    el.append(st_tbl)
    el.append(Spacer(1, 5))
    el.append(Paragraph(
        "The optional oversight retainer, if taken up, is billed monthly and separately from "
        "the schedule above.", SMALL))

    # ---------------- 8 governance ----------------
    el.append(Paragraph("8.  A note on governance", H1))
    el.append(Paragraph(
        "I have been invited to Haven's board, and Consult for Africa would be a paid partner "
        "to the company. That overlap is common and entirely workable, and I am raising it "
        "precisely because formalising your governance is part of this work. The pricing and the "
        "discount are disclosed in full to all owners, and the engagement is structured as clean "
        "fixed fees plus an optional retainer, with no success fee tied to outcomes I would "
        "oversee. Transparency here is part of the standard we are setting for the facility.", P))

    # ---------------- 9 outcomes ----------------
    el.append(Paragraph("9.  What good looks like in six months", H1))
    for b in [
        "A safety culture in which the crash cart, and every critical routine, is checked "
        "every shift, by habit, not by reminder.",
        "The N4.2M in receivables recovered and a working-capital discipline that keeps cash moving.",
        "A vendor-managed inventory model that ends stockouts and lifts pharmacy margin.",
        "NICU admissions growing safely against a governance standard the team trusts.",
        "A senior operations leader in post, running a facility that measures itself honestly.",
        "Incentives that reward quality and ownership, so the culture sustains itself after we "
        "step back.",
    ]:
        el.append(Paragraph("•&nbsp;&nbsp;" + b, P))

    # ---------------- 10 next steps ----------------
    el.append(Paragraph("10.  Next steps", H1))
    el.append(Paragraph(
        "If the board is content with the direction, the first step is to commission the "
        "diagnostic audit. From there, the audit findings shape the detail of the culture, "
        "process and growth work, and the timeline firms up around real data.", P))
    el.append(Spacer(1, 10))
    el.append(card(
        "<b>Consult for Africa</b> &nbsp; Healthcare transformation partner<br/>"
        "hello@consultforafrica.com &nbsp; / &nbsp; +234 913 813 8553 &nbsp; / &nbsp; "
        "consultforafrica.com<br/>Lagos and Abuja, Nigeria",
        bg=NAVY, fg=white))

    doc.build(el)
    print(f"wrote {OUT}")


if __name__ == "__main__":
    build()
