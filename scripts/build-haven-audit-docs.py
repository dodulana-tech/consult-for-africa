"""
Build two branded audit-pack PDFs so the whole set is uniform:
  - docs/haven-safety-culture-survey-cfa.pdf   (staff survey instrument)
  - docs/haven-audit-fieldwork-kit-cfa.pdf     (internal: interview guides, observation, plan)

Run: python3 scripts/build-haven-audit-docs.py
"""
from __future__ import annotations
from pathlib import Path
from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.platypus import (
    BaseDocTemplate, Frame, KeepTogether, PageTemplate, Paragraph, Spacer, Table, TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
NAVY = HexColor("#0B3C5D"); GOLD = HexColor("#D4AF37"); TEAL = HexColor("#1F7A8C")
BODY = HexColor("#1F2937"); MUTED = HexColor("#6B7280"); SURFACE = HexColor("#F1F5F9")
LIGHT = HexColor("#C9D6E0"); CREAM = HexColor("#FBF6E6"); PANEL = HexColor("#EAF1F4")
PAGE_W, PAGE_H = A4
MARGIN = 46


def sy(name, **kw):
    base = dict(fontName="Helvetica", fontSize=9.7, leading=13.4, textColor=BODY, alignment=TA_LEFT, spaceAfter=3)
    base.update(kw); return ParagraphStyle(name, **base)


H1 = sy("h1", fontName="Helvetica-Bold", fontSize=12, leading=14.5, textColor=NAVY, spaceBefore=12, spaceAfter=4)
H2 = sy("h2", fontName="Helvetica-Bold", fontSize=10.3, leading=13, textColor=TEAL, spaceBefore=8, spaceAfter=2)
P = sy("p"); SMALL = sy("small", fontSize=8.3, leading=11.5, textColor=MUTED)
ITEM = sy("item", fontSize=9.7, leading=12.8, spaceAfter=2)
CELL = sy("cell", fontSize=9, leading=12); CELLB = sy("cellb", fontSize=9, leading=12, fontName="Helvetica-Bold")
CELLW = sy("cellw", fontSize=9, leading=12, fontName="Helvetica-Bold", textColor=white)


def make_furniture(right_label, foot_label):
    def furniture(c, doc):
        c.saveState()
        c.setFillColor(NAVY); c.rect(0, PAGE_H - 34, PAGE_W, 34, fill=1, stroke=0)
        c.setFillColor(GOLD); c.rect(0, PAGE_H - 37, PAGE_W, 3, fill=1, stroke=0)
        c.setFillColor(white); c.setFont("Helvetica-Bold", 8.5)
        c.drawString(MARGIN, PAGE_H - 23, "CONSULT FOR AFRICA")
        c.setFillColor(LIGHT); c.setFont("Helvetica", 8.5)
        c.drawRightString(PAGE_W - MARGIN, PAGE_H - 23, right_label)
        c.setFillColor(GOLD); c.rect(MARGIN, 30, 24, 2, fill=1, stroke=0)
        c.setFillColor(MUTED); c.setFont("Helvetica", 8)
        c.drawString(MARGIN, 18, foot_label)
        c.drawRightString(PAGE_W - MARGIN, 18, "Page %d" % doc.page)
        try:
            _ic = ImageReader(str(DOCS / "c4a-icon.png")); _iw, _ih = _ic.getSize()
            _h = 22.0; _w = _h * _iw / _ih
            c.drawImage(_ic, PAGE_W - MARGIN - _w, PAGE_H - 61, width=_w, height=_h, mask="auto")
        except Exception:
            pass
        c.restoreState()
    return furniture


def doc_for(out, title, right_label, foot_label):
    d = BaseDocTemplate(str(out), pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN,
                        topMargin=50, bottomMargin=40, title=title, author="Consult For Africa")
    d.addPageTemplates([PageTemplate(id="main", frames=[Frame(MARGIN, 40, PAGE_W - 2 * MARGIN, PAGE_H - 90, id="f")],
                                     onPage=make_furniture(right_label, foot_label))])
    return d


def callout(text, bg=CREAM, spine=GOLD, col=NAVY, fn="Helvetica-Bold"):
    stl = ParagraphStyle("co", parent=P, fontName=fn, textColor=col, leading=13.4)
    t = Table([[Paragraph(text, stl)]], colWidths=[PAGE_W - 2 * MARGIN])
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), bg), ("LINEBEFORE", (0, 0), (0, -1), 3, spine),
                           ("TOPPADDING", (0, 0), (-1, -1), 8), ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                           ("LEFTPADDING", (0, 0), (-1, -1), 12), ("RIGHTPADDING", (0, 0), (-1, -1), 12)]))
    return t


def checkitems(items):
    rows = [[Paragraph("", P), Paragraph(t, CELL)] for t in items]
    t = Table(rows, colWidths=[15, PAGE_W - 2 * MARGIN - 15])
    ts = [("VALIGN", (0, 0), (-1, -1), "TOP"), ("TOPPADDING", (0, 0), (-1, -1), 3),
          ("BOTTOMPADDING", (0, 0), (-1, -1), 3), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 6)]
    for i in range(len(rows)):
        ts.append(("BOX", (0, i), (0, i), 0.8, NAVY)); ts.append(("TOPPADDING", (0, i), (0, i), 3))
    t.setStyle(TableStyle(ts)); return t


def dtable(header, rows, fracs):
    cw = PAGE_W - 2 * MARGIN
    data = [[Paragraph(h, CELLW) for h in header]] + [[Paragraph(c, CELLB if j == 0 else CELL) for j, c in enumerate(r)] for r in rows]
    t = Table(data, colWidths=[cw * f for f in fracs])
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), NAVY), ("LINEBELOW", (0, 0), (-1, 0), 1.5, GOLD),
                           ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, SURFACE]), ("VALIGN", (0, 0), (-1, -1), "TOP"),
                           ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                           ("LEFTPADDING", (0, 0), (-1, -1), 8), ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                           ("LINEBELOW", (0, 1), (-1, -1), 0.4, LIGHT)]))
    return t


# ─────────────────────────────── SURVEY ──────────────────────────────────────
SURVEY = [
    ("Your area & teamwork  (agree 1–5)", [
        "Staff in my area treat each other with respect.",
        "When the workload is heavy, we work together as a team to get it done.",
        "In this area, people support one another.",
        "During busy or difficult moments, we have the staff we need to handle the work.",
        "The work pace here is so high that it feels unsafe.",
    ]),
    ("Communication & openness", [
        "Staff feel free to question the decisions or actions of those with more authority.",
        "Staff speak up if they see something that might negatively affect patient care.",
        "Staff are afraid to ask questions when something does not seem right.",
        "When staff make an error, we talk about it so we can learn from it.",
        "We are told about changes to procedures and about mistakes that happen here.",
    ]),
    ("Response to mistakes", [
        "Staff feel that their mistakes are held against them.",
        "When an event is reported, it feels like the person is blamed, not the problem fixed.",
        "When we make mistakes, we are treated fairly.",
        "Repeated problems are dealt with constructively, not just punished.",
    ]),
    ("Reporting & learning", [
        "When a mistake is caught before it reaches a patient, it is reported.",
        "When a mistake reaches a patient but causes no harm, it is reported.",
        "We are given feedback about changes made because of what gets reported.",
        "After a problem, this area actually changes how it works to prevent it recurring.",
        "I know how to report a patient-safety concern here.",
    ]),
    ("Management & supervisor support", [
        "My supervisor / matron seriously considers staff suggestions for improving safety.",
        "My supervisor / matron overlooks safety problems that happen over and over.",
        "Management provides the resources (staff, equipment, drugs) needed to give safe care.",
        "Management's actions show that patient safety is a top priority.",
        "Management only seems interested in patient safety after something goes wrong.",
    ]),
    ("Handovers between shifts", [
        "Important patient-care information is shared clearly across shifts.",
        "Things fall between the cracks when patients are handed over between shifts or staff.",
        "Shift changes are a risky time for patients here.",
    ]),
    ("Emergency readiness & routines  (how often 1–5)", [
        "The crash cart / emergency tray is fully stocked and ready.",
        "There is a routine, every shift, for checking emergency drugs and equipment.",
        "If a child needed emergency resuscitation right now, we would have what we need.",
        "Essential drugs or consumables are out of stock when we need them.",
    ]),
    ("Emergency readiness — about you  (agree 1–5)", [
        "I have had recent resuscitation training (BLS / PALS / NRP) for the patients I care for.",
    ]),
    ("Fairness, incentives & ownership", [
        "I understand clearly what I am responsible for and what good performance looks like in my role.",
        "The way pay, commission or rewards work here is fair and clear.",
        "The rewards and recognition here encourage good, safe, careful work — not just speed or volume.",
        "I feel a sense of ownership for how well Haven runs, not just my own tasks.",
    ]),
]


def build_survey():
    out = DOCS / "haven-safety-culture-survey-cfa.pdf"
    d = doc_for(out, "Haven Staff Safety Culture Survey", "Haven Paediatric Centre  /  Staff Safety Culture Survey",
                "Anonymous  /  Consult for Africa  /  Also available as an online form")
    e = []
    e.append(Paragraph("Staff Safety Culture &amp; Climate Survey", ParagraphStyle("t", fontName="Helvetica-Bold", fontSize=18, leading=21, textColor=NAVY, spaceAfter=2)))
    e.append(Paragraph("Haven Paediatric Centre  ·  based on AHRQ HSOPS 2.0, adapted", ParagraphStyle("s", fontName="Helvetica-Bold", fontSize=11, leading=14, textColor=TEAL, spaceAfter=6)))
    e.append(callout("Your answers are anonymous and confidential. They go to Consult for Africa, not to Haven "
                     "management, and are reported only as grouped totals — never in a way that identifies you. There "
                     "are no right answers; honesty is the whole point. About 10 minutes."))
    e.append(Spacer(1, 3))
    e.append(Paragraph("For each statement, choose how much you agree — or how often it happens — from <b>1</b> "
                       "(strongly disagree / never) to <b>5</b> (strongly agree / always). Every item also has "
                       "<b>N/A · Don't know</b>.", P))
    n = 0
    for title, items in SURVEY:
        block = [Paragraph(title, H2)]
        for it in items:
            n += 1
            block.append(Paragraph(f"<b>{n}.</b>&nbsp;&nbsp;{it}", ITEM))
        e.append(KeepTogether(block) if len(items) <= 5 else block[0])
        if len(items) > 5:
            e.extend(block[1:])
    e.append(Paragraph("Overall", H2))
    e.extend([Paragraph("<b>37.</b>&nbsp;&nbsp;Overall grade for Haven on patient safety: Excellent / Very good / Acceptable / Poor / Failing.", ITEM),
              Paragraph("<b>38.</b>&nbsp;&nbsp;I would recommend Haven as a place to receive care. (1–5)", ITEM),
              Paragraph("<b>39.</b>&nbsp;&nbsp;I would recommend Haven as a place to work. (1–5)", ITEM)])
    e.append(Paragraph("About you  (optional — helps us group answers, never to identify you)", H2))
    e.extend([Paragraph("Primary area: Nursing / Medical / Pharmacy / Front desk / Admin / Operations / Other.", ITEM),
              Paragraph("Time at Haven: under 6 months / 6–12 months / 1–2 years / 2 years+.", ITEM)])
    e.append(Paragraph("Two open questions  (optional)", H2))
    e.extend([Paragraph("The one thing that would make Haven safer for patients:", ITEM),
              Paragraph("The one thing that would make Haven a better place to work:", ITEM)])
    e.append(Spacer(1, 8))
    e.append(callout("This survey is deployed as an anonymous online form (mobile-first). Staff receive a link; "
                     "responses are stored securely and reported only in aggregate.", bg=PANEL, spine=TEAL, fn="Helvetica"))
    d.build(e); print(f"wrote {out}")


# ───────────────────────────── FIELDWORK ─────────────────────────────────────
INTERVIEWS = [
    ("Owners / board (Kabir, Mrs Abisodun)", [
        "What does success for Haven in 12 months look like? What worries you most?",
        "Walk me through the money: a good month vs a bad month, and why.",
        "Where do you feel cash disappears? What have you tried?",
        "How are decisions made day to day, and who runs the facility operationally?",
        "Appetite for a senior operations hire, and for the incentive / commission redesign?",
    ]),
    ("Clinical lead / Medical (Dr Shakirah)", [
        "Talk me through clinical governance: protocols, incident review, M&amp;M.",
        "Where do you feel clinical risk concentrates?",
        "How ready is NICU to safely take more admissions? What would you need first?",
        "How are clinical standards set, taught and checked? What slips under pressure?",
    ]),
    ("Medical Director / Neonatology (Dr Odedina)", [
        "NICU case mix, admission criteria, staffing model, equipment readiness.",
        "What does safe scaling of NICU require — people, kit, protocols, cover?",
        "Where are the near-misses you worry about?",
    ]),
    ("Nursing lead / Matron", [
        "Walk me through a shift, start to finish. Where does it break down?",
        "Which routines are meant to happen every shift, and which actually do?",
        "Staffing levels vs workload — where is it thin, and when?",
        "How is performance recognised or addressed on your team?",
    ]),
    ("Pharmacy lead", [
        "How is stock ordered, received, stored, dispensed and counted?",
        "How often do you stock out, and of what? What drives it?",
        "How is pharmacy margin worked out? Where is it lost?",
        "What would vendor-managed inventory change for you?",
    ]),
    ("Front desk / Customer service", [
        "Walk me through a patient from arrival to billing.",
        "Where do patients wait, get frustrated, or fall through the cracks?",
        "Booking, deposits, HMO verification — how does it actually work?",
    ]),
    ("Accounts / Admin", [
        "How are the numbers produced? What system, what reconciliations, what's manual?",
        "Receivables: how are HMO claims tracked, chased and reconciled?",
        "What do you not trust in the current reporting, and why?",
    ]),
]

OBSERVE = [
    ("Emergency readiness", ["Crash cart located, sealed, contents vs a standard list, expiry dates",
                             "Evidence of a shift-level check routine (log, sign-off)",
                             "Emergency drugs accessible; oxygen, suction, resuscitaire (NICU) functional",
                             "Staff can state where things are and what to do"]),
    ("Clinical & nursing routines", ["Handover observed — structured? information lost?",
                                     "Drug administration and charting practice",
                                     "Hand hygiene / IPC in practice; documentation completeness on live charts"]),
    ("Patient flow", ["Registration → triage → consult → admission/discharge → billing, timed",
                      "Bottlenecks, queues, rework; booking system used as intended?"]),
    ("Pharmacy & stock", ["Storage conditions, organisation, expiry management",
                          "Physical spot-count vs system on a sample of lines; reorder discipline in practice"]),
    ("Facility & environment", ["Bed configuration vs records; NICU environment",
                                "Signage, cleanliness, safety hazards; equipment vs asset register on a sample"]),
]


def build_fieldwork():
    out = DOCS / "haven-audit-fieldwork-kit-cfa.pdf"
    d = doc_for(out, "Haven Diagnostic Audit — Fieldwork Kit", "Haven Paediatric Centre  /  Fieldwork Kit",
                "Internal — CFA audit team  /  Not for the client")
    e = []
    e.append(Paragraph("Diagnostic Audit — Fieldwork Kit", ParagraphStyle("t", fontName="Helvetica-Bold", fontSize=18, leading=21, textColor=NAVY, spaceAfter=2)))
    e.append(Paragraph("Interview guides · observation checklist · fieldwork plan", ParagraphStyle("s", fontName="Helvetica-Bold", fontSize=11, leading=14, textColor=TEAL, spaceAfter=6)))
    e.append(callout("Collaborative posture throughout: we are a partner in the findings, not an inspector. Open each "
                     "interview with reassurance, listen more than we talk, and never make frontline staff feel blamed "
                     "for the system's gaps.", bg=PANEL, spine=TEAL, fn="Helvetica"))
    e.append(Paragraph("1.  Interview guides  (30–45 min each)", H1))
    e.append(Paragraph("<i>Common opener:</i> “Thank you for the time. This is not about individuals — it's about how "
                       "the place works and how to make it stronger. Nothing you say is attributed to you by name.”", P))
    for role, qs in INTERVIEWS:
        block = [Paragraph(role, H2)] + [Paragraph("•&nbsp;&nbsp;" + q, ITEM) for q in qs]
        e.append(KeepTogether(block))
    e.append(Paragraph("2.  On-site observation checklist", H1))
    for grp, items in OBSERVE:
        e.append(Paragraph(grp, H2)); e.append(checkitems(items))
    e.append(Paragraph("3.  Fieldwork plan", H1))
    e.append(dtable(["Week", "On-site / remote", "Focus"],
                    [["1", "Kick-off + remote", "Nominate point person; issue data request; launch staff survey; crash-cart standard live; begin Leadway/NEM receivables push; start reconciling management accounts"],
                     ["2", "On site", "Leadership + frontline interviews; observation across shifts; SOP walk-throughs; NICU readiness"],
                     ["3", "On site + remote", "Finance & working capital; procurement & inventory spot-counts; HMO economics; reporting-integrity reconciliation; close survey"],
                     ["4", "Remote + board", "Synthesis; prioritised, costed recommendations; board presentation of the two deliverables"]],
                    [0.09, 0.2, 0.71]))
    e.append(Spacer(1, 4))
    e.append(Paragraph("<b>Deliverables:</b> (1) Operational &amp; Clinical Governance Audit Report; (2) Working Capital "
                       "&amp; Receivables Recovery Plan.", P))
    d.build(e); print(f"wrote {out}")


PATIENT = [
    ("Getting seen", [
        "It was easy to book and be seen at Haven.",
        "I did not wait too long to be attended to.",
    ]),
    ("The team & how they treated us", [
        "Staff treated me and my child with respect and kindness.",
        "The doctor or nurse explained my child's care in a way I understood.",
        "I felt listened to, and able to ask questions.",
        "I always knew what was happening with my child's care.",
    ]),
    ("Safety & the place", [
        "The facility was clean and comfortable.",
        "I felt my child was safe and well cared for here.",
        "I had confidence in the medical team.",
    ]),
    ("Cost", [
        "Charges and payments were explained to me clearly.",
    ]),
]


def build_patient():
    out = DOCS / "haven-patient-survey-cfa.pdf"
    d = doc_for(out, "Haven Patient / Caregiver Experience Survey",
                "Haven Paediatric Centre  /  Patient Experience Survey",
                "Anonymous  /  Consult for Africa on behalf of Haven  /  Also an online form")
    e = []
    e.append(Paragraph("Patient / Caregiver Experience Survey", ParagraphStyle("t", fontName="Helvetica-Bold", fontSize=18, leading=21, textColor=NAVY, spaceAfter=2)))
    e.append(Paragraph("Haven Paediatric Centre  ·  for parents and caregivers", ParagraphStyle("s", fontName="Helvetica-Bold", fontSize=11, leading=14, textColor=TEAL, spaceAfter=6)))
    e.append(callout("Thank you for trusting us with your child. This short survey is anonymous — we do not ask "
                     "your name. Please be honest; it is how we make Haven better and safer for every family. "
                     "About 5 minutes."))
    e.append(Spacer(1, 3))
    e.append(Paragraph("For each statement, choose how much you agree, from <b>1</b> (strongly disagree) to "
                       "<b>5</b> (strongly agree). On the online form these are simple faces from sad to happy.", P))
    nn = 0
    for title, items in PATIENT:
        block = [Paragraph(title, H2)]
        for it in items:
            nn += 1
            block.append(Paragraph(f"<b>{nn}.</b>&nbsp;&nbsp;{it}", ITEM))
        e.append(KeepTogether(block))
    e.append(Paragraph("Overall", H2))
    e.extend([Paragraph("<b>11.</b>&nbsp;&nbsp;Overall, how would you rate your experience at Haven? Excellent / Very good / Good / Fair / Poor.", ITEM),
              Paragraph("<b>12.</b>&nbsp;&nbsp;Would you recommend Haven to other parents? Definitely / Probably / Not sure / Probably not / No.", ITEM),
              Paragraph("<b>13.</b>&nbsp;&nbsp;What is the one thing we could do better? (optional)", ITEM)])
    e.append(Spacer(1, 8))
    e.append(callout("Deployed as an anonymous, mobile-first online form. Offer a tablet or a QR code at discharge; "
                     "a staff member may read it aloud where a caregiver prefers, without influencing the answers.",
                     bg=PANEL, spine=TEAL, fn="Helvetica"))
    d.build(e); print(f"wrote {out}")


if __name__ == "__main__":
    build_survey()
    build_fieldwork()
    build_patient()
