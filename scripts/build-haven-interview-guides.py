"""
Haven Diagnostic Audit — Interview Guides (internal, for Debo & Tito).
Hypothesis-driven, mapped to the MECE domain set, split by who leads each interview.

Output: docs/haven-interview-guides-cfa.pdf
Run:    python3 scripts/build-haven-interview-guides.py
"""
from __future__ import annotations
from pathlib import Path
from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.platypus import BaseDocTemplate, Frame, KeepTogether, PageTemplate, Paragraph, Spacer, Table, TableStyle

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
OUT = DOCS / "haven-interview-guides-cfa.pdf"
NAVY = HexColor("#0B3C5D"); GOLD = HexColor("#D4AF37"); TEAL = HexColor("#1F7A8C")
BODY = HexColor("#1F2937"); MUTED = HexColor("#6B7280"); SURFACE = HexColor("#F1F5F9")
LIGHT = HexColor("#C9D6E0"); CREAM = HexColor("#FBF6E6"); PANEL = HexColor("#EAF1F4")
PAGE_W, PAGE_H = A4
M = 46


def sy(n, **kw):
    b = dict(fontName="Helvetica", fontSize=9.6, leading=13, textColor=BODY, alignment=TA_LEFT, spaceAfter=3)
    b.update(kw); return ParagraphStyle(n, **b)


H1 = sy("h1", fontName="Helvetica-Bold", fontSize=12, leading=14.5, textColor=NAVY, spaceBefore=12, spaceAfter=4)
P = sy("p"); SMALL = sy("s", fontSize=8.3, leading=11.5, textColor=MUTED)
Q = sy("q", fontSize=9.7, leading=13, spaceAfter=3)
SHARP = sy("sharp", fontSize=9.7, leading=13, spaceAfter=3, textColor=HexColor("#7A2F2F"))
CELL = sy("cell", fontSize=8.6, leading=11); CELLW = sy("cw", fontSize=8.6, leading=11, fontName="Helvetica-Bold", textColor=white)


def furn(c, doc):
    c.saveState()
    c.setFillColor(NAVY); c.rect(0, PAGE_H - 34, PAGE_W, 34, fill=1, stroke=0)
    c.setFillColor(GOLD); c.rect(0, PAGE_H - 37, PAGE_W, 3, fill=1, stroke=0)
    c.setFillColor(white); c.setFont("Helvetica-Bold", 8.5); c.drawString(M, PAGE_H - 23, "CONSULT FOR AFRICA")
    c.setFillColor(LIGHT); c.setFont("Helvetica", 8.5)
    c.drawRightString(PAGE_W - M, PAGE_H - 23, "Haven Paediatric Centre  /  Interview Guides")
    c.setFillColor(GOLD); c.rect(M, 30, 24, 2, fill=1, stroke=0)
    c.setFillColor(MUTED); c.setFont("Helvetica", 8)
    c.drawString(M, 18, "Internal  /  For Dr Debo Odulana & Tito Ipinmoye  /  Not for the client")
    c.drawRightString(PAGE_W - M, 18, "Page %d" % doc.page)
    try:
        ic = ImageReader(str(DOCS / "c4a-icon.png")); iw, ih = ic.getSize(); h = 22.0; w = h * iw / ih
        c.drawImage(ic, PAGE_W - M - w, PAGE_H - 61, width=w, height=h, mask="auto")
    except Exception:
        pass
    c.restoreState()


def callout(text, bg=CREAM, spine=GOLD, col=NAVY, fn="Helvetica-Bold"):
    t = Table([[Paragraph(text, ParagraphStyle("c", parent=P, fontName=fn, textColor=col, leading=13.2))]], colWidths=[PAGE_W - 2 * M])
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), bg), ("LINEBEFORE", (0, 0), (0, -1), 3, spine),
                           ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                           ("LEFTPADDING", (0, 0), (-1, -1), 11), ("RIGHTPADDING", (0, 0), (-1, -1), 11)]))
    return t


# interviewee: (title, lead, domains, opener?, core[], sharp[])
GUIDES = [
    ("1.  Owners & board  (Mr Kabir Aregbesola, Mrs Abisodun Alli, Mr Ogochukwu Odum)", "Lead: Debo",
     "Domains: Demand & Market · Finance & Capital · People/Leadership · Governance & Compliance",
     ["What does success for Haven in 12 months look like, and what worries you most?",
      "Walk me through the money — what does a good month vs a bad month look like, and why?",
      "How are decisions made day to day, and who actually runs the facility operationally?",
      "How is the board constituted and how are owner decisions taken today?",
      "Appetite for a senior operations hire, and for the commission / incentive redesign?"],
     ["Is Haven a business that happens to do medicine, or a clinical practice that hasn't yet become a business? What in the numbers tells you which?",
      "If you had to dominate ONE segment in 18 months — premium paeds, HMO volume, or referral NICU — which, and does today's model serve it?",
      "Could the owners step away for a month and Haven still run? If not, what breaks?"]),
    ("2.  Medical Director  (Dr Odedina)", "Lead: Debo + Tito",
     "Domains: Clinical Care & Governance · Infrastructure/Equipment · People (clinical) · Risk & Safety",
     ["Talk me through clinical governance — protocols, incident review, M&M, how standards are set and checked.",
      "How ready is NICU to safely take more admissions? People, kit, protocols, cover — what's needed first?",
      "How is medical staffing structured — employed vs visiting consultants — and who is accountable to whom?",
      "Biomedical equipment and life support (incubators, ventilators, oxygen) — reliability, maintenance, backup?",
      "Power, oxygen and water resilience for NICU — what happens on an outage?"],
     ["Is safety currently a system, or a set of good individuals? What would fail if the best nurse were off?",
      "Would Haven survive a second serious adverse event during a growth push — clinically, reputationally, financially?",
      "Can you standardise safety and scale NICU on sessional consultants who run their own protocols?"]),
    ("3.  Founder & clinician  (Dr Shakirah Saliu)", "Lead: Debo",
     "Domains: Governance · Strategy & Vision · Clinical perspective · Culture (lens)",
     ["What was the original vision for Haven, and how do you feel it is tracking against it?",
      "As both an owner and a clinician, where do you see the biggest risks — clinical and operational?",
      "How are decisions taken among the owners, and where do you want Haven to be in two to three years?"],
     ["Are the owners genuinely aligned on what Haven is trying to win at, or pulling in different directions?",
      "Does how people are paid and recognised reward quality and ownership — or only activity and volume?"]),
    ("4.  Nursing lead / Matron", "Lead: Tito",
     "Domains: Clinical Care & Governance · People & Organisation · Access & Patient Flow · Culture/Safety (lens)",
     ["Walk me through a shift start to finish — where does it break down?",
      "Which routines are meant to happen every shift, and which actually do? (handover, drug checks, emergency readiness)",
      "Staffing vs workload — where is it thin, and when?",
      "How is good or poor performance recognised or addressed on your team?"],
     ["If catching a safety problem slowed throughput, would a nurse be rewarded or penalised for stopping the line?",
      "When the person who 'knows how it works' is on leave, does the process survive — or does it depend on them?"]),
    ("5.  Pharmacy lead", "Lead: Tito",
     "Domains: Pharmacy & Supply Chain · Finance (margin) · Working capital (lens)",
     ["How is stock ordered, received, stored, dispensed and counted? Walk me through it.",
      "How often do you stock out, of what, and what drives it?",
      "How is pharmacy margin worked out, and where is it lost between purchase and sale?",
      "What would a vendor-managed inventory model change for you?"],
     ["How much cash is sitting on the shelf right now that the business can't use — and who owns that number?",
      "Is the reported pharmacy 'profit' a real margin or just a markup? Show me a line."]),
    ("6.  Front desk / Customer service", "Lead: Tito",
     "Domains: Access & Patient Flow · Revenue Cycle (front-end) · Demand (experience, lens)",
     ["Walk me through a patient from arrival to billing — where do they wait, get frustrated, or fall through?",
      "Booking, deposits and HMO verification — how does it actually work?",
      "What do patients complain about most, and what happens to that feedback?"],
     ["Where in the front-end journey do we lose patients — or lose the claim before it's even submitted?"]),
    ("7.  Accounts / Finance", "Lead: Tito + Debo",
     "Domains: Finance & Capital · Revenue Cycle · Digital & Data (reporting, lens)",
     ["How are the numbers produced — what system, what's automated, what's manual, what reconciliations run?",
      "Receivables: how are HMO claims tracked, chased and reconciled? Which HMOs, how aged?",
      "What in the current reporting do you NOT trust, and why?",
      "What is the cash-conversion cycle — how long from service delivered to cash in the bank?"],
     ["Can you produce a P&L by service line, today, that foots? If NICU doubled tomorrow, would you know within a week if it was profitable?",
      "Which HMOs are actually profitable after denials, delay and cost-to-collect — and which should Haven fire?"]),
    ("8.  Facilities / biomedical / IT", "Lead: Tito",
     "Domains: Infrastructure, Equipment & Utilities · Digital & Technology",
     ["Power, water and medical-gas (oxygen) supply — sources, backup, and what happens on failure?",
      "Biomedical equipment inventory — what's critical, is it maintained, calibrated, and is there redundancy?",
      "What clinical and billing systems (EMR/HMIS) are in use, who supports them, and what data can they export?"],
     ["If the grid dropped during a NICU resuscitation tonight, what exactly stands between that and a catastrophe?"]),
    ("9.  Visiting consultants", "Lead: Tito",
     "Domains: People (consultants) · Clinical Care · Demand (they drive admissions)",
     ["What brings you to Haven, and what would make you bring more of your patients here?",
      "Are you bound by Haven's clinical protocols and safety routines, or do you run your own?",
      "How do the economics work for you — sessional fees, payment timeliness?"],
     ["What share of your admissions could move elsewhere tomorrow — and what would trigger that?",
      "If Haven asked you to follow its shift-level safety routines to the letter, would you — or would you push back?"]),
]


def build():
    doc = BaseDocTemplate(str(OUT), pagesize=A4, leftMargin=M, rightMargin=M, topMargin=50, bottomMargin=40,
                          title="Haven Interview Guides", author="Consult For Africa")
    doc.addPageTemplates([PageTemplate(id="m", frames=[Frame(M, 40, PAGE_W - 2 * M, PAGE_H - 90, id="f")], onPage=furn)])
    e = []
    e.append(Paragraph("Diagnostic Audit — Interview Guides", ParagraphStyle("t", fontName="Helvetica-Bold", fontSize=18, leading=21, textColor=NAVY, spaceAfter=2)))
    e.append(Paragraph("For Dr Debo Odulana & Tito Ipinmoye  ·  hypothesis-driven, mapped to the MECE domains", ParagraphStyle("s", fontName="Helvetica-Bold", fontSize=11, leading=14, textColor=TEAL, spaceAfter=6)))
    e.append(callout("Every interview is trying to CONFIRM or KILL a hypothesis, not just gather colour. Open collaboratively "
                     "(\"this is about how the place works, not about individuals; nothing is attributed to you\"), listen more than "
                     "you talk, and never make anyone feel blamed. <b>Sharp questions are in red — use judgement on tone and timing.</b>"))
    e.append(Spacer(1, 3))
    e.append(callout("Coverage is MECE by design: across the nine interviews, all ten domains are covered with no gaps — "
                     "D1 Demand &amp; Market, D2 Access &amp; Patient Flow, D3 Clinical Care &amp; Governance, D4 Pharmacy &amp; "
                     "Supply Chain, D5 Revenue Cycle, D6 Finance &amp; Capital, D7 People &amp; Organisation, D8 Infrastructure "
                     "&amp; Utilities, D9 Digital &amp; Technology, D10 Governance &amp; Compliance — each examined through the "
                     "cross-cutting lenses (culture, cash, data, risk, stakeholder voice, scalability).",
                     bg=PANEL, spine=TEAL, fn="Helvetica"))

    for title, lead, domains, core, sharp in GUIDES:
        block = [Paragraph(title, H1),
                 Paragraph(f"<b>{lead}</b>", ParagraphStyle("ld", parent=P, textColor=TEAL)),
                 Paragraph(domains, SMALL),
                 Paragraph("<b>Core</b>", ParagraphStyle("cr", parent=P, fontName="Helvetica-Bold", textColor=NAVY, spaceBefore=3))]
        block += [Paragraph("•&nbsp;&nbsp;" + q, Q) for q in core]
        block.append(Paragraph("<b>Sharp / hypothesis-testing</b>", ParagraphStyle("sh", parent=P, fontName="Helvetica-Bold", textColor=HexColor("#7A2F2F"), spaceBefore=3)))
        block += [Paragraph("•&nbsp;&nbsp;" + q, SHARP) for q in sharp]
        e.append(KeepTogether(block))
        e.append(Spacer(1, 4))

    e.append(Paragraph("A note on who's missing", H1))
    e.append(Paragraph("Clinical leadership sits with the Medical Director (Dr Odedina, guide 2) and the nursing lead / matron "
                       "(guide 4); Dr Shakirah is a founder-clinician, not the clinical lead. If Haven has a distinct Head of "
                       "Operations, Head of Nursing, or HR/People lead, add a short guide — but the nine above already cover all "
                       "ten domains, so any addition is depth, not a gap.", P))
    doc.build(e); print(f"wrote {OUT}")


if __name__ == "__main__":
    build()
