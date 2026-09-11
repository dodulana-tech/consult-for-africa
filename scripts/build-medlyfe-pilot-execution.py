"""
Build "Medlyfe Aesthetics - Execution Plan and Financials", the numbers companion
to the TOM. Synced to the agreed sequence: July concludes the deal (vision,
contracts, JV, registrations); August is setup and demand (recruit, design,
protocols, virtual consultations, marketing); September the practice goes live and
revenue begins; decision in November. Financials re-run so revenue starts in
September. No personal circumstances; same warm, sensitive tone as the TOM. CFA
house style. NGN. Benchmark figures for tuning. No em dashes.

Run:
  python3 scripts/build-medlyfe-pilot-execution.py
"""

from __future__ import annotations

from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.platypus import (
    BaseDocTemplate, Frame, KeepTogether, NextPageTemplate, PageBreak,
    PageTemplate, Paragraph, Spacer, Table, TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
OUT = DOCS / "medlyfe-aesthetics-pilot-execution-plan-cfa.pdf"

NAVY = HexColor("#0B3C5D")
DEEP_NAVY = HexColor("#081521")
GOLD = HexColor("#D4AF37")
TEAL = HexColor("#1F7A8C")
BODY = HexColor("#1F2937")
MUTED = HexColor("#6B7280")
SURFACE = HexColor("#F1F5F9")
LIGHT = HexColor("#C9D6E0")
PANEL = HexColor("#EAF1F4")
CREAM = HexColor("#FBF6E6")

PAGE_W, PAGE_H = A4
MARGIN = 46
FULLW = PAGE_W - 2 * MARGIN


def style(name, **kw):
    base = dict(fontName="Helvetica", fontSize=10.5, leading=15, textColor=BODY, alignment=TA_LEFT, spaceAfter=6)
    base.update(kw)
    return ParagraphStyle(name, **base)


EYEBROW = style("eyebrow", fontName="Helvetica-Bold", fontSize=9, leading=12, textColor=GOLD, spaceBefore=6, spaceAfter=3)
H1 = style("h1", fontName="Helvetica-Bold", fontSize=14.5, leading=18, textColor=NAVY, spaceAfter=6)
P = style("p")
LEDE = style("lede", fontSize=11, leading=16, textColor=HexColor("#374151"))
SMALL = style("small", fontSize=8.5, leading=12, textColor=MUTED)
CAP = style("cap", fontName="Helvetica-Bold", fontSize=8.5, leading=11, textColor=TEAL, spaceBefore=5, spaceAfter=3)
CELL = style("cell", fontSize=9, leading=12)
CELL_R = style("cellr", fontSize=9, leading=12, alignment=2)
CELL_B = style("cellb", fontSize=9, leading=12, fontName="Helvetica-Bold", textColor=NAVY)
CELL_BR = style("cellbr", fontSize=9, leading=12, fontName="Helvetica-Bold", textColor=NAVY, alignment=2)
CELL_W = style("cellw", fontSize=9, leading=12, fontName="Helvetica-Bold", textColor=white)
CELL_WR = style("cellwr", fontSize=9, leading=12, fontName="Helvetica-Bold", textColor=white, alignment=2)


def cover_bg(c, doc):
    c.saveState()
    c.setFillColor(NAVY); c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.setFillColor(DEEP_NAVY); c.rect(0, 0, PAGE_W, 10, fill=1, stroke=0); c.rect(0, PAGE_H - 10, PAGE_W, 10, fill=1, stroke=0)
    x = MARGIN
    c.setFillColor(GOLD); c.rect(x, PAGE_H - 150, 40, 3, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 10); c.setFillColor(GOLD); c.drawString(x + 50, PAGE_H - 153, "CONSULT FOR AFRICA")
    c.setFillColor(LIGHT); c.setFont("Helvetica", 10)
    c.drawString(x + 50 + c.stringWidth("CONSULT FOR AFRICA", "Helvetica-Bold", 10) + 10, PAGE_H - 153, "/  HEALTHCARE TRANSFORMATION")
    c.setFillColor(GOLD); c.rect(x, 150, 60, 3, fill=1, stroke=0)
    c.setFillColor(LIGHT); c.setFont("Helvetica", 9)
    c.drawString(x, 128, "hello@consultforafrica.com   /   +234 913 813 8553   /   consultforafrica.com")
    c.drawString(x, 112, "Lagos and Abuja, Nigeria")
    c.restoreState()


def content_bg(c, doc):
    c.saveState()
    c.setFillColor(NAVY); c.rect(0, PAGE_H - 34, PAGE_W, 34, fill=1, stroke=0)
    c.setFillColor(GOLD); c.rect(0, PAGE_H - 37, PAGE_W, 3, fill=1, stroke=0)
    c.setFillColor(white); c.setFont("Helvetica-Bold", 8.5); c.drawString(MARGIN, PAGE_H - 23, "CONSULT FOR AFRICA")
    c.setFillColor(LIGHT); c.setFont("Helvetica", 8.5)
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 23, "Medlyfe Aesthetics  /  Execution Plan and Financials")
    c.setFillColor(GOLD); c.rect(MARGIN, 30, 24, 2, fill=1, stroke=0)
    c.setFillColor(MUTED); c.setFont("Helvetica", 8)
    c.drawString(MARGIN, 18, "Private and confidential  /  Draft, benchmark figures")
    c.drawRightString(PAGE_W - MARGIN, 18, "Page %d" % doc.page)
    try:
        _ic = ImageReader(str(DOCS / "c4a-icon.png"))
        _iw, _ih = _ic.getSize(); _h = 20.0; _w = _h * _iw / _ih
        c.drawImage(_ic, PAGE_W - MARGIN - _w, PAGE_H - 59, width=_w, height=_h, mask="auto")
    except Exception:
        pass
    c.restoreState()


def card(text, bg=SURFACE, fg=BODY):
    st = ParagraphStyle("c", parent=P, textColor=fg, leftIndent=8, rightIndent=8, spaceBefore=3, spaceAfter=3)
    t = Table([[Paragraph(text, st)]], colWidths=[FULLW])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg), ("LINEBEFORE", (0, 0), (0, -1), 3, GOLD),
        ("TOPPADDING", (0, 0), (-1, -1), 8), ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 12), ("RIGHTPADDING", (0, 0), (-1, -1), 12),
    ]))
    return t


def bullet(text):
    return Paragraph("<font color='#D4AF37'>&bull;</font>&nbsp; " + text,
                     ParagraphStyle("b", parent=P, leftIndent=13, spaceAfter=3))


def grid(rows, heads, widths, aligns=None, total_rows=None, sub_rows=None):
    total_rows = total_rows or set()
    sub_rows = sub_rows or set()
    if aligns is None:
        aligns = ["l"] * (len(heads) - 1)
    data = [[Paragraph(heads[0], CELL_W)] + [Paragraph(h, CELL_WR if aligns[j] == "r" else CELL_W) for j, h in enumerate(heads[1:])]]
    for i, r in enumerate(rows):
        emph = i in total_rows or i in sub_rows
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
        ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 8), ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, SURFACE]),
    ]
    for i in sub_rows:
        stl.append(("BACKGROUND", (0, i + 1), (-1, i + 1), PANEL))
        stl.append(("LINEABOVE", (0, i + 1), (-1, i + 1), 0.6, TEAL))
    for i in total_rows:
        stl.append(("BACKGROUND", (0, i + 1), (-1, i + 1), CREAM))
        stl.append(("LINEABOVE", (0, i + 1), (-1, i + 1), 1.0, GOLD))
    t.setStyle(TableStyle(stl))
    return t


def sec(el, num, eyebrow, title, first=False):
    if not first:
        el.append(Spacer(1, 12))
    el.append(KeepTogether([Paragraph(num + "  /  " + eyebrow, EYEBROW), Paragraph(title, H1)]))


def build():
    doc = BaseDocTemplate(str(OUT), pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN,
                          topMargin=50, bottomMargin=40, title="Medlyfe Aesthetics - Execution Plan and Financials",
                          author="Consult for Africa")
    doc.addPageTemplates([
        PageTemplate(id="cover", frames=[Frame(MARGIN, 150, FULLW, PAGE_H - 300, id="cover")], onPage=cover_bg),
        PageTemplate(id="content", frames=[Frame(MARGIN, 40, FULLW, PAGE_H - 50 - 40, id="content")], onPage=content_bg),
    ])
    el = [Spacer(1, 34)]
    el.append(Paragraph("THE AESTHETICS PILOT  /  MEDLYFE AESTHETICS",
                        ParagraphStyle("ce", fontName="Helvetica-Bold", fontSize=9.5, leading=13, textColor=GOLD, spaceAfter=12)))
    el.append(Paragraph("Execution Plan and Financials", ParagraphStyle("ct", fontName="Helvetica-Bold", fontSize=24, leading=29, textColor=white)))
    el.append(Spacer(1, 12))
    el.append(Paragraph("Month by month, the gaps to close, and what it takes.",
                        ParagraphStyle("cs", fontName="Helvetica-Bold", fontSize=12.5, leading=17, textColor=GOLD)))
    el.append(Spacer(1, 24))
    for lb, v in [("PREPARED FOR", "Dr Chinwe Kpaduwa (KP Plastics) and Dr Itunu Akinware (Medbury Healthcare Group)"),
                  ("BY", "Consult for Africa"),
                  ("HORIZON", "Next 3 months (July to September), decision in November"),
                  ("STATUS", "Draft for discussion  ·  benchmark figures for tuning")]:
        el.append(Paragraph(lb, ParagraphStyle("clbl", fontName="Helvetica-Bold", fontSize=8, leading=11, textColor=GOLD, spaceBefore=7, spaceAfter=1)))
        el.append(Paragraph(v, ParagraphStyle("cval", fontName="Helvetica", fontSize=10.5, leading=14, textColor=white)))
    el.append(NextPageTemplate("content"))
    el.append(PageBreak())

    # 01 The plan month by month
    sec(el, "01", "THE PLAN, MONTH BY MONTH", "From agreement to a living practice.", first=True)
    el.append(Paragraph(
        "The companion to the operating model, focused on sequence, gaps and numbers. Each month has a "
        "clear purpose and a visible milestone, so the decision in November rests on what has actually "
        "been built.", LEDE))
    el.append(grid(
        [["To end July", "Conclude the vision, the contracts and the paperwork, including the JV establishment and the formal registrations", "Agreement, structure and registrations in place"],
         ["August", "Recruit the team, from within Medbury and externally; Dr Kpaduwa leads the practice design, protocols and virtual consultations, supported by C4A; the C4A and Medbury teams drive marketing and inbound enquiries", "Team, protocols and demand taking shape"],
         ["September", "The practice goes live: the team delivers to Dr Kpaduwa's standard; the first patients and the first revenue", "Live and delivering"],
         ["Into November", "The practice grows; review the demand, the economics and the model; decide together on the standalone", "Go or no-go on the standalone"]],
        ["Period", "Focus", "Milestone"],
        [72, (FULLW - 72) * 0.58, (FULLW - 72) * 0.42]))
    el.append(Paragraph("The next 15 days: conclude the deal", CAP))
    el.append(bullet("Finalise and sign the collaboration heads of terms."))
    el.append(bullet("Establish the JV and begin the formal facility registrations."))
    el.append(bullet("Confirm the venue, agree the menu pricing and the pilot revenue split."))
    el.append(bullet("Begin early procurement of the long-lead and imported equipment, to Dr Kpaduwa's specification."))
    el.append(bullet("Agree Dr Kpaduwa's licensing pathway and the partner-theatre arrangement for surgical cases."))

    # 02 The key gaps
    sec(el, "02", "THE KEY GAPS TO CLOSE", "What stands between us and launch.")
    el.append(Paragraph("Named honestly, with an owner and a moment each is closed.", P))
    el.append(grid(
        [["The financials", "Sized in this document; to firm on the equipment list and the venue.", "Closed here, to firm"],
         ["JV and registrations", "Establish the JV, and the formal facility registrations.", "July"],
         ["Licensing and privileges", "Dr Kpaduwa's Nigerian practice licence, and partner-theatre operating privileges for surgical cases.", "July onward"],
         ["Equipment procurement", "Long-lead and imported items to Dr Kpaduwa's specification, ordered early.", "Starts now"],
         ["Pricing and revenue split", "The menu pricing, and the pilot revenue split between the partners.", "By end July"],
         ["The team", "Recruit the resident doctor and nurse or nurses, from within Medbury and externally.", "August"]],
        ["Gap", "What it is", "When it closes"],
        [128, FULLW - 128 - 92, 92]))

    # 03 Capital and working capital
    sec(el, "03", "SETUP CAPITAL AND WORKING CAPITAL", "What it takes to open.")
    el.append(Paragraph(
        "The pilot uses the existing Medlyfe clinic, so there is no build. The money is a modest setup "
        "spend, fit-out and the equipment to Dr Kpaduwa's specification, plus a working-capital float to "
        "carry the pre-revenue months before the practice goes live in September.", P))
    el.append(Paragraph("Setup capital (one-off)", CAP))
    el.append(grid(
        [["Clinic fit-out and finishing", "5"],
         ["Equipment to Dr Kpaduwa's specification (clinical, aesthetic, diagnostic, sterilisation, instrument set)", "12"],
         ["HospitlOS, IT, branding and pre-opening", "4"],
         ["Build subtotal", "21"],
         ["Contingency (20%)", "4"],
         ["Total setup capital", "25"]],
        ["Item", "NGN M"],
        [FULLW - 70, 70], aligns=["r"], total_rows={5}, sub_rows={3}))
    el.append(Paragraph(
        "Equipment is the swing, procured to Dr Kpaduwa's specification; laser and heavier devices are "
        "added later from cashflow, so capital follows demand. Some items are imported, so procurement "
        "starts now to protect the September launch.", SMALL))
    el.append(Paragraph("Working capital (float through the pre-revenue build)", CAP))
    el.append(grid(
        [["Operating float through July and August, before revenue", "12"],
         ["Opening consumables and inventory", "3"],
         ["Total working capital", "15"]],
        ["Item", "NGN M"],
        [FULLW - 70, 70], aligns=["r"], total_rows={2}))
    el.append(card(
        "<b>Total pilot funding requirement: about NGN 40M</b> (setup capital plus working capital). "
        "Because the practice goes live in September, most of the spend comes before the first revenue; "
        "peak cash out is about NGN 35M by end September, recovering through the fourth quarter as the "
        "diary builds.", bg=CREAM))

    # 04 The financials
    sec(el, "04", "THE FINANCIALS, MONTH BY MONTH", "In cash, honestly.")
    el.append(Paragraph(
        "The clinic-level cash view. July and August are investment, the deal, the setup and the "
        "marketing build; revenue begins in September when the practice opens. Figures are benchmarks, "
        "to firm on the pricing and the warm-base response.", P))
    el.append(grid(
        [["Revenue", "0", "0", "8", "8"],
         ["Cost of care (about 30%)", "0", "0", "(2.4)", "(2.4)"],
         ["Staff and clinic team", "(1.0)", "(2.5)", "(2.5)", "(6.0)"],
         ["Marketing", "(1.0)", "(3.0)", "(3.0)", "(7.0)"],
         ["Facility and admin", "(0.5)", "(1.0)", "(1.0)", "(2.5)"],
         ["Operating cash flow", "(2.5)", "(6.5)", "(0.9)", "(9.9)"],
         ["Setup capex", "(15)", "(10)", "-", "(25)"],
         ["Net cash flow", "(17.5)", "(16.5)", "(0.9)", "(34.9)"],
         ["Cumulative cash", "(17.5)", "(34.0)", "(34.9)", ""]],
        ["NGN M", "July", "August", "September", "3-month"],
        [150, (FULLW - 150) / 4, (FULLW - 150) / 4, (FULLW - 150) / 4, (FULLW - 150) / 4],
        aligns=["r", "r", "r", "r"], total_rows={5, 7}))
    el.append(bullet("<b>The operating cash flow is before the revenue split.</b> The margin is shared among the partners per the pilot split, to be agreed; Medbury funds the setup and the float."))
    el.append(bullet("<b>Revenue begins in September</b> and builds through the fourth quarter; the September figure is the opening month of the launch, into the warm base."))
    el.append(bullet("<b>This is an investment window, not a profit engine.</b> The point is a live, credible practice and the evidence for the November decision, at the lowest sensible cost."))

    # 05 Governance and the gate
    sec(el, "05", "GOVERNANCE AND THE GATE", "How we stay on track, and decide.")
    el.append(bullet("<b>Weekly</b> operations review on setup progress, then bookings and delivery once live; <b>monthly</b> a principals' review against the plan and the numbers."))
    el.append(bullet("<b>In November</b> the partners review the practice, the demand, the economics and the model, and decide together on the standalone."))
    el.append(Paragraph("The November decision", CAP))
    el.append(grid(
        [["If it works", "Form the standalone SPV, a dedicated centre with the cosmetic surgery arm, built on the team and the standard the pilot has created; the fuller structure is settled on the pilot's real numbers."],
         ["If not yet", "Medlyfe continues the aesthetics service with the trained team, and the relationship stays open. Nothing is stranded."]],
        ["Outcome", "What happens"],
        [88, FULLW - 88]))
    el.append(Spacer(1, 8))
    el.append(card(
        "<b>Consult for Africa</b> &nbsp; Structuring and operating partner<br/>"
        "hello@consultforafrica.com &nbsp; / &nbsp; +234 913 813 8553 &nbsp; / &nbsp; consultforafrica.com",
        bg=NAVY, fg=white))
    el.append(Spacer(1, 5))
    el.append(Paragraph(
        "Draft execution plan and financials shared in confidence with Dr Chinwe Kpaduwa and Dr Itunu "
        "Akinware. Capital, working capital and revenue are benchmark estimates, to firm on the "
        "equipment specification, the venue and the agreed pricing. The strategy sits in the companion "
        "target operating model. Prepared by Consult for Africa.", SMALL))

    doc.build(el)
    print(f"wrote {OUT}")


if __name__ == "__main__":
    build()
