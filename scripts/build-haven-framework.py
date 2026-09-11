"""
Haven Diagnostic Audit — Approach & Framework (for review by Debo & Tito).
The locked two-axis MECE structure, research-backed method + signature KPI per
domain, the hypothesis bank, stakeholder instruments, and honest evidence gaps.

Output: docs/haven-audit-framework-cfa.pdf
Run:    python3 scripts/build-haven-framework.py
"""
from __future__ import annotations
from pathlib import Path
from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.platypus import BaseDocTemplate, Frame, KeepTogether, PageTemplate, Paragraph, Spacer, Table, TableStyle

ROOT = Path(__file__).resolve().parents[1]; DOCS = ROOT / "docs"
OUT = DOCS / "haven-audit-framework-cfa.pdf"
NAVY = HexColor("#0B3C5D"); GOLD = HexColor("#D4AF37"); TEAL = HexColor("#1F7A8C")
BODY = HexColor("#1F2937"); MUTED = HexColor("#6B7280"); SURFACE = HexColor("#F1F5F9")
LIGHT = HexColor("#C9D6E0"); CREAM = HexColor("#FBF6E6"); PANEL = HexColor("#EAF1F4")
ALERTBG = HexColor("#FBEEE9"); ALERTLN = HexColor("#B0392B"); ALERTTX = HexColor("#7A2F2F")
PAGE_W, PAGE_H = A4; M = 46


def sy(n, **kw):
    b = dict(fontName="Helvetica", fontSize=9.6, leading=13, textColor=BODY, alignment=TA_LEFT, spaceAfter=3)
    b.update(kw); return ParagraphStyle(n, **b)


H1 = sy("h1", fontName="Helvetica-Bold", fontSize=12.5, leading=15, textColor=NAVY, spaceBefore=12, spaceAfter=4)
P = sy("p"); SMALL = sy("s", fontSize=8.3, leading=11.5, textColor=MUTED)
CELL = sy("c", fontSize=8.5, leading=10.8); CELLB = sy("cb", fontSize=8.5, leading=10.8, fontName="Helvetica-Bold", textColor=NAVY)
CELLW = sy("cw", fontSize=8.6, leading=11, fontName="Helvetica-Bold", textColor=white)


def furn(c, doc):
    c.saveState()
    c.setFillColor(NAVY); c.rect(0, PAGE_H - 34, PAGE_W, 34, fill=1, stroke=0)
    c.setFillColor(GOLD); c.rect(0, PAGE_H - 37, PAGE_W, 3, fill=1, stroke=0)
    c.setFillColor(white); c.setFont("Helvetica-Bold", 8.5); c.drawString(M, PAGE_H - 23, "CONSULT FOR AFRICA")
    c.setFillColor(LIGHT); c.setFont("Helvetica", 8.5)
    c.drawRightString(PAGE_W - M, PAGE_H - 23, "Haven Paediatric Centre  /  Audit Approach & Framework")
    c.setFillColor(GOLD); c.rect(M, 30, 24, 2, fill=1, stroke=0)
    c.setFillColor(MUTED); c.setFont("Helvetica", 8)
    c.drawString(M, 18, "Internal — for review by Dr Debo Odulana & Tito Ipinmoye  /  Not for the client")
    c.drawRightString(PAGE_W - M, 18, "Page %d" % doc.page)
    try:
        ic = ImageReader(str(DOCS / "c4a-icon.png")); iw, ih = ic.getSize(); h = 22.0; w = h * iw / ih
        c.drawImage(ic, PAGE_W - M - w, PAGE_H - 61, width=w, height=h, mask="auto")
    except Exception:
        pass
    c.restoreState()


def callout(text, bg=CREAM, spine=GOLD, col=NAVY, fn="Helvetica-Bold"):
    t = Table([[Paragraph(text, ParagraphStyle("co", parent=P, fontName=fn, textColor=col, leading=13.2))]], colWidths=[PAGE_W - 2 * M])
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), bg), ("LINEBEFORE", (0, 0), (0, -1), 3, spine),
                           ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                           ("LEFTPADDING", (0, 0), (-1, -1), 11), ("RIGHTPADDING", (0, 0), (-1, -1), 11)]))
    return t


def dtable(header, rows, fracs, small=False):
    cw = PAGE_W - 2 * M
    cellstyle = ParagraphStyle("cc", parent=CELL, fontSize=8.1, leading=10) if small else CELL
    data = [[Paragraph(h, CELLW) for h in header]] + [[Paragraph(x, CELLB if j == 0 else cellstyle) for j, x in enumerate(r)] for r in rows]
    t = Table(data, colWidths=[cw * f for f in fracs])
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), NAVY), ("LINEBELOW", (0, 0), (-1, 0), 1.5, GOLD),
                           ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, SURFACE]), ("VALIGN", (0, 0), (-1, -1), "TOP"),
                           ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                           ("LEFTPADDING", (0, 0), (-1, -1), 7), ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                           ("LINEBELOW", (0, 1), (-1, -1), 0.4, LIGHT)]))
    return t


def build():
    doc = BaseDocTemplate(str(OUT), pagesize=A4, leftMargin=M, rightMargin=M, topMargin=50, bottomMargin=40,
                          title="Haven Audit Approach & Framework", author="Consult For Africa")
    doc.addPageTemplates([PageTemplate(id="m", frames=[Frame(M, 40, PAGE_W - 2 * M, PAGE_H - 90, id="f")], onPage=furn)])
    e = []
    e.append(Paragraph("Diagnostic Audit — Approach &amp; Framework", ParagraphStyle("t", fontName="Helvetica-Bold", fontSize=18, leading=21, textColor=NAVY, spaceAfter=2)))
    e.append(Paragraph("For review: Dr Debo Odulana &amp; Tito Ipinmoye  ·  evidence-based, MECE, hypothesis-driven", ParagraphStyle("s", fontName="Helvetica-Bold", fontSize=10.5, leading=13, textColor=TEAL, spaceAfter=6)))
    e.append(callout("The read, in one line: this is a <b>strategic-alignment diagnosis</b>, not an operational checklist. "
                     "Haven's visible problems are alignment gaps between where it wants to go and how it is built to run. "
                     "Every finding lands as a fit gap, an integration gap, or both. <b>Culture is the multiplier.</b>"))

    e.append(Paragraph("1.  The MECE structure — two axes", H1))
    e.append(Paragraph("<b>Axis A — ten functional domains</b> (mutually exclusive by function, following the value chain): "
                       "1 Demand &amp; Market · 2 Access &amp; Patient Flow · 3 Clinical Care &amp; Governance · 4 Pharmacy &amp; "
                       "Supply Chain · 5 Revenue Cycle · 6 Finance &amp; Capital · 7 People &amp; Organisation · 8 Infrastructure, "
                       "Equipment &amp; Utilities · 9 Digital &amp; Technology · 10 Governance &amp; Compliance.", P))
    e.append(Paragraph("<b>Axis B — six cross-cutting lenses</b> (examined through every domain): culture &amp; incentives · "
                       "cash / working capital · data integrity · risk &amp; safety · stakeholder experience · scalability / "
                       "growth-readiness.", P))
    e.append(Paragraph("The audit is the <b>matrix</b>: each domain read through each lens. Every cell is unique (mutually "
                       "exclusive); the grid is exhaustive. This is what makes \"culture is the multiplier\" structural — culture "
                       "is a lens run through all ten domains, not one competing box.", P))

    e.append(Paragraph("2.  Method &amp; signature KPI per domain  (evidence-based)", H1))
    e.append(dtable(["Domain", "Method / standard we apply", "Signature KPI"], [
        ["1 Demand & Market", "Catchment, referral-source & payer-mix analysis", "Referral volume; win-rate; payer mix"],
        ["2 Access & Patient Flow", "Lean value-stream map + takt-time; stress-test at 2x demand", "Waiting time; lead time; takt vs cycle"],
        ["3 Clinical Care & Governance", "Protocol / incident / M&M audit vs COHSASA / SafeCare", "Adverse events; protocol adherence; outcomes"],
        ["4 Pharmacy & Supply Chain", "Stock spot-count vs system; VMI case; margin decomposition", "Stockout rate; days-of-stock; true margin"],
        ["5 Revenue Cycle", "Claim-to-cash process map; denial analytics", "Clean-claim %; denial %; days-in-AR"],
        ["6 Finance & Capital", "Cash-conversion & working-capital analysis; unit economics", "Cash-conversion cycle; WC locked; contribution / line"],
        ["7 People & Organisation", "McKinsey 7S diagnostic; org & consultant-model review", "Staffing ratios; turnover; 7S soft-element gaps"],
        ["8 Infrastructure, Equipment & Utilities", "WHO oxygen fit-for-use audit; layered-power resilience; biomedical maintenance", "O2 purity (>=82%); outage freq/duration; % kit operational"],
        ["9 Digital & Technology", "Systems / data audit; reporting reconciliation", "Reporting integrity; data availability"],
        ["10 Governance & Compliance", "Board / ownership & regulatory review (HEFAMAA, NDPR)", "Governance maturity; compliance status"],
    ], [0.24, 0.44, 0.32], small=True))

    e.append(callout("<b>Research flag — Infrastructure (Domain 8) is a top-tier CLINICAL risk, not a facilities footnote.</b> "
                     "In Nigerian secondary hospitals only ~3.5% of oxygen concentrators meet WHO fit-for-use; power outages "
                     "interrupt oxygen with ~19% case-fatality among affected patients; paediatric hypoxemia raises death risk "
                     "~5x. We audit medical oxygen (>=82% purity, WHO-UNICEF 2021) and <b>layered power resilience</b> "
                     "(grid + generator + battery — solar alone is not turnkey) as first-order clinical safety, and equipment "
                     "for operability (only 10-30% of donated SSA kit stays operational).", bg=ALERTBG, spine=ALERTLN, col=ALERTTX))

    e.append(Paragraph("3.  How we run it", H1))
    e.append(Paragraph("<b>Process work uses Lean value-stream mapping + takt-time</b> — validated both to redesign a pathway "
                       "and to <b>stress-test it for scale</b> (higher demand shortens takt time, pushing more stages over the "
                       "bottleneck threshold, so we can see what breaks at 2x volume before it does). One caution the evidence is "
                       "clear on: Lean fails in hospitals when it is imposed as a manufacturing tool — staff read it as a threat "
                       "to clinical autonomy — so we run it collaboratively (the culture lens applied to the method itself).", P))
    e.append(Paragraph("<b>Operating-model &amp; growth-readiness</b> use the McKinsey 7S framework (an empirically validated "
                       "hospital diagnostic that surfaces soft-element gaps financials miss) and a <b>staged maturity model</b> "
                       "(3-9 levels) to place Haven today and chart the path to a scalable state.", P))

    e.append(Paragraph("4.  The hypothesis bank — what we are trying to prove or kill", H1))
    e.append(Paragraph("Every interview and data pull tests one of these. Full detail in the interview guides.", SMALL))
    for h in [
        "<b>Clinic, not a business:</b> reporting doesn't reconcile, so leadership flies blind.",
        "<b>Cash conversion, not profit,</b> is the killer — ~N7M trapped; growth consumes WC before it returns it.",
        "<b>Capacity ahead of demand:</b> NICU sold as the engine without a proven referral pipeline.",
        "<b>Visiting-consultant paradox:</b> the model that built Haven caps it — safety can't be standardised on sessional consultants.",
        "<b>Incentives reward the wrong things</b> — activity over quality, safety and ownership; growth scales bad behaviour.",
        "<b>Process fragility:</b> core processes work by heroics; they break, not bend, at scale.",
        "<b>No payer power</b> in a 94-HMO market — Haven is financing the HMOs.",
        "<b>No one's full-time job is to run Haven</b> — owners firefight; systems never get built.",
        "<b>Safety is the licence to grow</b> — until it is a system, every admission adds tail risk.",
        "<b>Infrastructure is the silent existential risk</b> — oxygen + power resilience for NICU (research-validated).",
        "<b>Haven hasn't chosen what it wins at</b> — premium, volume, or referral NICU need different models.",
    ]:
        e.append(Paragraph("•&nbsp;&nbsp;" + h, sy("hb", fontSize=9.5, leading=12.5, spaceAfter=2)))

    e.append(Paragraph("5.  Stakeholder instruments  (the experience lens)", H1))
    e.append(Paragraph("Five validated instruments so results benchmark, not just collect: <b>patients/caregivers</b> "
                       "(Child-HCAHPS / Picker PPE-15) and <b>staff</b> (AHRQ HSOPS 2.0) — <b>both live now</b>; plus "
                       "<b>visiting consultants</b>, <b>payors/HMOs</b> (provider-payer, both directions + claims analytics) and "
                       "<b>referring clinicians</b> (validated referrer surveys + NPS) — to build.", P))

    e.append(Paragraph("6.  Honest evidence gaps  (and how we close them)", H1))
    e.append(callout("Two gaps we are transparent about. (1) <b>No reliable Nigerian revenue-cycle benchmarks</b> exist publicly "
                     "(clean-claim, denial, days-in-AR) — so we set Haven's baseline from its own data and track improvement, not "
                     "against an imported number. (2) <b>\"MECE\" is our analytic architecture</b> — the functional domains are "
                     "well-supported by evidence, but the two-axis matrix is a consulting framing, not an externally certified "
                     "standard; its rigour is in the domain/lens definitions we have locked here.", bg=PANEL, spine=TEAL, fn="Helvetica"))
    e.append(Spacer(1, 6))
    e.append(Paragraph("Companion documents: the <b>Interview Guides</b> (attached), the client-facing <b>Kickoff Deck</b> and "
                       "<b>Information &amp; Data Request</b>, and the two live surveys. Please mark up anything here — especially "
                       "the hypotheses; they are meant to be argued with before we lock them.", P))
    doc.build(e); print(f"wrote {OUT}")


if __name__ == "__main__":
    build()
