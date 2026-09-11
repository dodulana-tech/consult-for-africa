"""
Build the Medbury Healthcare operational and leadership proposal PDF for
Consult for Africa.

Source narrative: docs/medbury-operational-leadership-proposal-cfa.md
Output:          docs/medbury-operational-leadership-proposal-cfa.pdf

House style matches the rest of the CFA repo (brand-guide-cfa palette,
c4a-icon logomark). No em dashes anywhere in the copy.

Run:
  python3 scripts/build-medbury-proposal.py
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
    Flowable,
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
OUT = DOCS / "medbury-operational-leadership-proposal-cfa.pdf"

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

# ---------------------------------------------------------------- styles -----
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
QUOTE = style("quote", fontName="Helvetica-Oblique", fontSize=11, leading=16.5,
              textColor=NAVY, leftIndent=6, rightIndent=6)
TRACK_LABEL = style("tracklabel", fontName="Helvetica-Bold", fontSize=9, leading=12,
                    textColor=GOLD, spaceAfter=3)
TRACK_H = style("trackh", fontName="Helvetica-Bold", fontSize=12, leading=15,
                textColor=NAVY, spaceAfter=5)
TRACK_P = style("trackp", fontSize=9.5, leading=14, textColor=BODY, spaceAfter=6)
TRACK_SUB = style("tracksub", fontName="Helvetica-Bold", fontSize=9, leading=12,
                  textColor=TEAL, spaceBefore=2, spaceAfter=3)
TRACK_LI = style("trackli", fontSize=9.5, leading=13, textColor=BODY, spaceAfter=5)


# --------------------------------------------------------- execution model ---
class StageStrip(Flowable):
    """Five navy pills joined by gold arrows: Diagnose > ... > Transfer."""

    STAGES = ["Diagnose", "Design", "Deploy", "Deliver", "Transfer"]

    def __init__(self, width, height=34):
        super().__init__()
        self.width = width
        self.height = height

    def wrap(self, availW, availH):
        return (self.width, self.height)

    def draw(self):
        c = self.canv
        n = len(self.STAGES)
        gap = 12
        pill_w = (self.width - gap * (n - 1)) / n
        pill_h = 26
        y = (self.height - pill_h) / 2
        for i, stage in enumerate(self.STAGES):
            x = i * (pill_w + gap)
            c.setFillColor(NAVY)
            c.roundRect(x, y, pill_w, pill_h, 13, stroke=0, fill=1)
            c.setFillColor(white)
            c.setFont("Helvetica-Bold", 9.5)
            c.drawCentredString(x + pill_w / 2, y + pill_h / 2 - 3.3, stage)
            if i < n - 1:
                cy = y + pill_h / 2
                c.setStrokeColor(GOLD)
                c.setLineWidth(1.6)
                c.line(x + pill_w + 1.5, cy, x + pill_w + gap - 2.5, cy)
                c.setFillColor(GOLD)
                p = c.beginPath()
                p.moveTo(x + pill_w + gap - 1.5, cy)
                p.lineTo(x + pill_w + gap - 5.5, cy - 3)
                p.lineTo(x + pill_w + gap - 5.5, cy + 3)
                p.close()
                c.drawPath(p, stroke=0, fill=1)


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
    # gold rule bottom + contact strip
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
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 23, "Medbury Healthcare  /  Proposal")
    # footer
    c.setFillColor(GOLD)
    c.rect(MARGIN, 30, 24, 2, fill=1, stroke=0)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8)
    c.drawString(MARGIN, 18, "Private and confidential  /  Prepared for Dr Itunu Akinware, Medbury Healthcare")
    c.drawRightString(PAGE_W - MARGIN, 18, "Page %d" % doc.page)
    # logomark, top-right of each white content page
    try:
        _ic = ImageReader(str(DOCS / "c4a-icon.png"))
        _iw, _ih = _ic.getSize()
        _h = 22.0
        _w = _h * _iw / _ih
        c.drawImage(_ic, PAGE_W - MARGIN - _w, PAGE_H - 61, width=_w, height=_h, mask="auto")
    except Exception:
        pass
    c.restoreState()


# ------------------------------------------------------------------ helpers --
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


def track_column(label, heading, blurb, bullets, bg):
    cell = [
        Paragraph(label, TRACK_LABEL),
        Paragraph(heading, TRACK_H),
        Paragraph(blurb, TRACK_P),
        Paragraph("What you get", TRACK_SUB),
    ]
    for b in bullets:
        cell.append(Paragraph("&bull;&nbsp;&nbsp;" + b, TRACK_LI))
    inner = Table([[cell]], colWidths=[(PAGE_W - 2 * MARGIN - 14) / 2])
    inner.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 12),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
        ("LEFTPADDING", (0, 0), (-1, -1), 13),
        ("RIGHTPADDING", (0, 0), (-1, -1), 13),
        ("LINEBEFORE", (0, 0), (0, -1), 3, GOLD),
    ]))
    return inner


def build():
    doc = BaseDocTemplate(
        str(OUT), pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=52, bottomMargin=42,
        title="Medbury Healthcare - Consult for Africa Proposal",
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
    el.append(Paragraph("Operational and leadership<br/>support for Medbury Healthcare",
                        ParagraphStyle("ct", fontName="Helvetica-Bold", fontSize=27,
                                       leading=33, textColor=white)))
    el.append(Spacer(1, 16))
    el.append(Paragraph(
        "Getting the Chief Executive out of operations and the sector leaders into their seats.",
        ParagraphStyle("cs", fontName="Helvetica-Bold", fontSize=13.5, leading=19,
                       textColor=GOLD)))
    el.append(Spacer(1, 30))
    for label, value in [
        ("PREPARED FOR", "Dr Itunu Akinware, Chief Executive, Medbury Healthcare"),
        ("PREPARED BY", "Debo Odulana, Founding Partner, Consult for Africa"),
        ("DATE", "April 2026"),
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
    el.append(Paragraph("Picking up where we left off.", H1))
    el.append(Paragraph(
        "Itunu, when we spoke a couple of weeks ago, the picture you painted was familiar: a "
        "capable Chief Executive being pulled into operations because the bench underneath isn't "
        "holding. One strong sector lead carrying more than her share. The other sectors either "
        "under-performing or quietly draining your time.", LEDE))
    el.append(Paragraph(
        "I promised to help. This document is what that help looks like: short on paper, weighted "
        "towards action. It's also a reminder that you don't have to fix this alone.", P))
    el.append(Spacer(1, 4))
    el.append(card(
        "&ldquo;At Consult for Africa we implement, we don't just advise. The binding constraint "
        "in most mid-sized healthcare groups isn't strategy or capital. It's the quality of the "
        "operating layer one level below the CEO. Fix that layer and the CEO gets their job "
        "back.&rdquo;", bg=PANEL))
    el.append(Spacer(1, 6))
    el.append(Paragraph("What's inside", H2))
    for line in [
        "<b>1. How we see the problem.</b> A short reframe of the challenge you described.",
        "<b>2. Two tracks of support.</b> Leadership bench and operational diagnostics, designed to run in parallel.",
        "<b>3. Our execution model.</b> How Consult for Africa moves from diagnosis to sustained performance.",
        "<b>4. About us and next steps.</b> Who's behind this, and how to start.",
    ]:
        el.append(Paragraph(line, P))
    el.append(PageBreak())

    # ---------------- PAGE 2: The problem, reframed ----------------
    el.append(Paragraph("01  /  THE PROBLEM, REFRAMED", EYEBROW))
    el.append(Paragraph("Three things are happening at once.", H1))
    el.append(Paragraph("A thin leadership layer.", H2))
    el.append(Paragraph(
        "Only one sector lead is currently performing at the level you need. The others are "
        "either in post but under-delivering, or structurally absent. Every vacancy or weak seat "
        "routes escalation back to the CEO.", P))
    el.append(Paragraph("A CEO absorbing operational load.", H2))
    el.append(Paragraph(
        "When sector leads don't hold, the Chief Executive becomes the default Chief Operating "
        "Officer. That's expensive in three ways: your time, the decisions that don't get made "
        "because you're in the weeds, and the signal it sends to the rest of the organisation "
        "about who really owns outcomes.", P))
    el.append(Paragraph("No current read on where the real leverage is.", H2))
    el.append(Paragraph(
        "Without a structured diagnostic at each sector, it's genuinely hard to tell whether a "
        "sector is failing because of its leader, its systems, its market, or some combination. "
        "Hiring without that answer is expensive. You either over-pay for a saviour who inherits "
        "a broken system, or under-hire into a role that was always going to need senior weight.", P))
    el.append(Spacer(1, 6))
    el.append(card(
        "<b>The implication.</b>&nbsp; Talent and diagnostics have to move together. Hire without "
        "understanding the operational reality, and you'll cycle through leaders. Diagnose without "
        "a talent pipeline ready, and insight won't convert into change.", bg=SURFACE))
    el.append(PageBreak())

    # ---------------- PAGE 3: How we can help (two tracks) ----------------
    el.append(Paragraph("02  /  HOW WE CAN HELP", EYEBROW))
    el.append(Paragraph("Two tracks, designed to run in parallel.", H1))
    el.append(Paragraph(
        "Each track stands on its own, but they are far stronger when sequenced together. The "
        "diagnostic sharpens the brief. The brief sharpens the hire. The hire sticks.", LEDE))
    el.append(Spacer(1, 6))
    left = track_column(
        "TRACK ONE", "Leadership and embedded operators",
        "Access to the Consult for Africa network of senior healthcare operators and sector "
        "leads: people who have actually run services at scale in this market.",
        [
            "Role briefs co-developed with you: scope, scorecard, non-negotiables.",
            "Pre-screened shortlists per role, with warm introductions.",
            "Reference conversations handled discreetly through our network.",
            "Optional embedded-operator engagements to hold a seat until a permanent hire lands.",
        ],
        bg=PANEL)
    right = track_column(
        "TRACK TWO", "Performance diagnostic and turnaround",
        "A structured review of one or two of your under-performing business units, followed by "
        "a prioritised intervention roadmap we can help you deliver.",
        [
            "Independent read on what is actually broken versus what looks broken.",
            "Written findings and a prioritised intervention roadmap.",
            "A clear view on whether the sector needs a new leader, new systems, or both.",
            "Optional embedded execution to deliver the roadmap, not just hand it over.",
        ],
        bg=SURFACE)
    tracks = Table([[left, "", right]],
                   colWidths=[(PAGE_W - 2 * MARGIN - 14) / 2, 14, (PAGE_W - 2 * MARGIN - 14) / 2])
    tracks.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    el.append(tracks)
    el.append(Spacer(1, 10))
    el.append(Paragraph(
        "<b>A note on commercials.</b> Track 1 is offered on a warm-introduction basis between "
        "us, no placement fees. Track 2 is a formal Consult for Africa engagement, scoped and "
        "priced against the specific units in view. We scope it together before anything starts.", P))
    el.append(PageBreak())

    # ---------------- PAGE 4: Execution model ----------------
    el.append(Paragraph("03  /  OUR EXECUTION MODEL", EYEBROW))
    el.append(Paragraph("Five stages. One operating discipline.", H1))
    el.append(Paragraph(
        "Consult for Africa engagements follow a deliberate five-stage model. It is the same "
        "discipline we bring whether the engagement is a three-week diagnostic or a twelve-month "
        "embedded turnaround. The point is to leave the institution stronger, not dependent.", LEDE))
    el.append(Spacer(1, 12))
    el.append(StageStrip(PAGE_W - 2 * MARGIN, height=34))
    el.append(Spacer(1, 14))
    stages = [
        ("Diagnose",
         "Independent, on-site read of the business unit: governance, clinical operations, "
         "revenue cycle, people, digital. Triangulated from interviews, observation, and data."),
        ("Design",
         "Prioritised intervention roadmap co-owned with your leadership. Clear sequencing, "
         "accountability, and measurable outcomes."),
        ("Deploy",
         "We move from paper to execution. Embedded operators, interim leadership, or programme "
         "management as the roadmap requires."),
        ("Deliver",
         "Performance cadence installed: KPIs, dashboards, weekly operating rhythm. Outcomes "
         "measured against the baseline agreed at scoping."),
        ("Transfer",
         "Capabilities handed to permanent leadership. We leave behind systems and habits that "
         "outlast the engagement."),
    ]
    CELL = style("cell", fontSize=9.5, leading=13)
    CELL_B = style("cellb", fontSize=9.5, leading=13, fontName="Helvetica-Bold", textColor=NAVY)
    srows = [[Paragraph(a, CELL_B), Paragraph(b, CELL)] for a, b in stages]
    st = Table(srows, colWidths=[95, PAGE_W - 2 * MARGIN - 95])
    st.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [white, SURFACE]),
        ("LINEBELOW", (0, 0), (-1, -2), 0.4, LIGHT),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ]))
    el.append(st)
    el.append(Spacer(1, 8))
    el.append(Paragraph(
        "For Medbury, a single-unit engagement typically sits inside a four-week "
        "Diagnose-and-Design window, with Deploy, Deliver, and Transfer scoped separately once "
        "findings are on the table.", SMALL))
    el.append(PageBreak())

    # ---------------- PAGE 5: About and next steps ----------------
    el.append(Paragraph("04  /  ABOUT AND NEXT STEPS", EYEBROW))
    el.append(Paragraph("Who's behind this, and how to begin.", H1))
    el.append(Paragraph("About Consult for Africa", H2))
    el.append(Paragraph(
        "Consult for Africa is an Africa-focused healthcare management and transformation firm "
        "supporting operators, investors, and institutions to strengthen performance, governance, "
        "and execution. The network brings together 60+ years of combined senior leadership: "
        "former hospital CEOs, clinicians who have led accreditation and quality programmes at "
        "scale, revenue-cycle and HMO specialists, and digital operators who have deployed HIS "
        "and EMR platforms in resource-constrained environments.", P))
    el.append(Paragraph("Our model is execution-led. We implement, we don't just advise.", P))
    el.append(Paragraph("About the lead", H2))
    el.append(Paragraph(
        "Debo is a senior healthcare executive with a track record spanning hospital "
        "commissioning, revenue growth, and digital transformation. He splits his time between "
        "Lagos and Abuja and brings a perspective shaped by running operations, not just advising "
        "on them. His engagement model on this work is personal: he leads the diagnostic and "
        "stays close throughout the intervention.", P))
    el.append(Spacer(1, 6))
    el.append(card(
        "<b>NEXT STEPS: three small moves to get started.</b>"
        "<br/><br/>"
        "<b>1. A 30-minute call.</b> To align on priorities, sequence the two tracks, and agree "
        "which business unit goes first.<br/><br/>"
        "<b>2. Role briefs.</b> Send what you have, even rough drafts, for the sector-lead roles "
        "you're most concerned about. We'll start sourcing.<br/><br/>"
        "<b>3. A scoping note.</b> We'll come back with a short scoping note for the "
        "Diagnose-and-Design phase: unit, access, timeline, fee.", bg=PANEL))
    el.append(Spacer(1, 10))
    el.append(card(
        "<b>Contact</b><br/>"
        "Debo Odulana, Consult for Africa &nbsp; / &nbsp; Lagos and Abuja<br/>"
        "+234 913 813 8553<br/>"
        "hello@consultforafrica.com &nbsp; / &nbsp; consultforafrica.com<br/>"
        "Executive response within 48 hours",
        bg=NAVY, fg=white))
    el.append(Spacer(1, 8))
    el.append(Paragraph(
        "This document is shared in confidence with Dr Itunu Akinware and Medbury Healthcare "
        "leadership for the purpose of discussing a potential engagement. It is not a binding "
        "offer; scope and commercials will be agreed in writing before any work begins. NDA "
        "available on request.", SMALL))

    doc.build(el)
    print(f"wrote {OUT}")


if __name__ == "__main__":
    build()
