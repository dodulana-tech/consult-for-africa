"""
Build the internal Haven engagement & audit guide for Tito Ipinmoye (co-lead).

Source: docs/haven-audit-guide-tito.md
Output: docs/haven-audit-guide-tito-cfa.pdf  (A4, branded, internal)

Run: python3 scripts/build-haven-guide.py
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
OUT = DOCS / "haven-audit-guide-tito-cfa.pdf"

NAVY = HexColor("#0B3C5D"); GOLD = HexColor("#D4AF37"); TEAL = HexColor("#1F7A8C")
BODY = HexColor("#1F2937"); MUTED = HexColor("#6B7280"); SURFACE = HexColor("#F1F5F9")
LIGHT = HexColor("#C9D6E0"); CREAM = HexColor("#FBF6E6")
ALERTBG = HexColor("#FBEEE9"); ALERTLINE = HexColor("#B0392B"); ALERTTX = HexColor("#7A2F2F")
PANEL = HexColor("#EAF1F4")
PAGE_W, PAGE_H = A4
MARGIN = 46


def sy(name, **kw):
    base = dict(fontName="Helvetica", fontSize=9.8, leading=13.8, textColor=BODY, alignment=TA_LEFT, spaceAfter=4)
    base.update(kw); return ParagraphStyle(name, **base)


H1 = sy("h1", fontName="Helvetica-Bold", fontSize=12.5, leading=15, textColor=NAVY, spaceBefore=13, spaceAfter=5)
H2 = sy("h2", fontName="Helvetica-Bold", fontSize=10.5, leading=13, textColor=TEAL, spaceBefore=7, spaceAfter=2)
P = sy("p")
LEDE = sy("lede", fontSize=10.2, leading=15, textColor=HexColor("#374151"))
SMALL = sy("small", fontSize=8.4, leading=11.5, textColor=MUTED)
CW = sy("cw", textColor=white)
CELL = sy("cell", fontSize=9, leading=12)
CELLB = sy("cellb", fontSize=9, leading=12, fontName="Helvetica-Bold")
CELLW = sy("cellw", fontSize=9, leading=12, fontName="Helvetica-Bold", textColor=white)


def furniture(c, doc):
    c.saveState()
    c.setFillColor(NAVY); c.rect(0, PAGE_H - 34, PAGE_W, 34, fill=1, stroke=0)
    c.setFillColor(GOLD); c.rect(0, PAGE_H - 37, PAGE_W, 3, fill=1, stroke=0)
    c.setFillColor(white); c.setFont("Helvetica-Bold", 8.5)
    c.drawString(MARGIN, PAGE_H - 23, "CONSULT FOR AFRICA")
    c.setFillColor(LIGHT); c.setFont("Helvetica", 8.5)
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 23, "Haven Paediatric Centre  /  Engagement & Audit Guide")
    c.setFillColor(GOLD); c.rect(MARGIN, 30, 24, 2, fill=1, stroke=0)
    c.setFillColor(MUTED); c.setFont("Helvetica", 8)
    c.drawString(MARGIN, 18, "Internal  /  For Tito Ipinmoye, co-lead  /  Not for the client")
    c.drawRightString(PAGE_W - MARGIN, 18, "Page %d" % doc.page)
    try:
        _ic = ImageReader(str(DOCS / "c4a-icon.png")); _iw, _ih = _ic.getSize()
        _h = 22.0; _w = _h * _iw / _ih
        c.drawImage(_ic, PAGE_W - MARGIN - _w, PAGE_H - 61, width=_w, height=_h, mask="auto")
    except Exception:
        pass
    c.restoreState()


def callout(text, variant="gold"):
    bg, spine, col, fn = CREAM, GOLD, NAVY, "Helvetica-Bold"
    if variant == "teal": bg, spine, col, fn = PANEL, TEAL, NAVY, "Helvetica"
    elif variant == "alert": bg, spine, col, fn = ALERTBG, ALERTLINE, ALERTTX, "Helvetica-Bold"
    elif variant == "navy": bg, spine, col, fn = NAVY, GOLD, white, "Helvetica"
    stl = ParagraphStyle("co", parent=P, fontName=fn, textColor=col, leading=13.8)
    t = Table([[Paragraph(text, stl)]], colWidths=[PAGE_W - 2 * MARGIN])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg), ("LINEBEFORE", (0, 0), (0, -1), 3, spine),
        ("TOPPADDING", (0, 0), (-1, -1), 8), ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 12), ("RIGHTPADDING", (0, 0), (-1, -1), 12),
    ]))
    return t


def bullets(items):
    return [Paragraph("•&nbsp;&nbsp;" + b, P) for b in items]


def numbered(items):
    return [Paragraph(f"{i}.&nbsp;&nbsp;" + b, P) for i, b in enumerate(items, 1)]


def dtable(header, rows, fracs):
    cw = PAGE_W - 2 * MARGIN
    widths = [cw * f for f in fracs]
    data = [[Paragraph(h, CELLW) for h in header]]
    for r in rows:
        data.append([Paragraph(c, CELLB if j == 0 else CELL) for j, c in enumerate(r)])
    t = Table(data, colWidths=widths)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY), ("LINEBELOW", (0, 0), (-1, 0), 1.5, GOLD),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, SURFACE]),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8), ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("LINEBELOW", (0, 1), (-1, -1), 0.4, LIGHT),
    ]))
    return t


def build():
    doc = BaseDocTemplate(str(OUT), pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN,
                          topMargin=50, bottomMargin=40, title="Haven Engagement & Audit Guide — Tito Ipinmoye",
                          author="Consult For Africa")
    frame = Frame(MARGIN, 40, PAGE_W - 2 * MARGIN, PAGE_H - 50 - 40, id="f")
    doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=furniture)])
    e = []

    e.append(Paragraph("Engagement &amp; Audit Guide", ParagraphStyle("t", fontName="Helvetica-Bold", fontSize=19, leading=22, textColor=NAVY, spaceAfter=1)))
    e.append(Paragraph("Haven Paediatric Centre — for Tito Ipinmoye, co-lead", ParagraphStyle("s", fontName="Helvetica-Bold", fontSize=12, leading=15, textColor=TEAL, spaceAfter=5)))
    e.append(Paragraph("Prepared by Dr Debo Odulana, Consult for Africa  ·  Internal — not for the client", SMALL))
    e.append(Spacer(1, 7))
    e.append(Paragraph(
        "Welcome to Haven. You're championing this one alongside me, and this guide is everything you need to "
        "run it well: the context, the sensitivities that matter most, and a week-by-week playbook for the "
        "diagnostic audit. Read section 2 before anything else — on this engagement, <i>how</i> we carry "
        "ourselves matters as much as <i>what</i> we find.", LEDE))

    e.append(Paragraph("1.  Your role, and how we split it", H1))
    e.append(Paragraph(
        "You are the engagement lead on the ground. You own the day-to-day: the schedule, the point-of-contact "
        "relationship at Haven, issuing and chasing the data request, running the survey, driving interviews and "
        "observation, and pulling the findings together. I hold partner oversight, the board relationship, the "
        "commercial conversation, and the senior clinical and strategic judgement. When in doubt, over-communicate "
        "to me — daily quick check-ins during fieldwork.", P))
    e.append(callout("Route to Debo, always: anything about money or payment; anything involving the board or the "
                     "owners' relationships; anything touching the May 2026 incident; and any decision that changes "
                     "scope or price.", "teal"))

    e.append(Paragraph("2.  Read this first — the sensitivities that govern everything", H1))
    e.append(Paragraph("This is not a normal turnaround. Internalise these before you speak to anyone at Haven.", P))
    e.append(Paragraph("The incident — how we hold it", H2))
    e.append(Paragraph(
        "In May 2026 Haven lost a child. The child was referred in already critically ill and may not have been "
        "saveable under any circumstances; the loss is not attributable to the facility. It is what prompted "
        "leadership to call us.", P))
    e.append(callout("We do not raise it. Ever — in writing or in conversation. Not in the data request, the "
                     "interviews, the report, or a message. If a staff member raises it, listen with care, do not "
                     "probe for blame, and move on.", "alert"))
    e.append(Spacer(1, 2))
    e.extend(bullets([
        "<b>Every client-facing word is forward-looking:</b> we are here because a strong young facility is putting "
        "world-class systems under its growth — not because something went wrong. That is the honest, respectful "
        "and legally sound framing.",
        "<b>Why it's this strict:</b> documents travel and are discoverable. A written record linking a death to any "
        "facility gap is a liability for Haven and for us, and it reopens a wound for a grieving board — one owner "
        "is a former co-founder of mine. The audit stands entirely on its own without ever invoking the loss.",
    ]))
    e.append(Paragraph("The relationship &amp; governance", H2))
    e.extend(bullets([
        "I was <b>invited to Haven's board from inception but do not formally sit on it.</b> Say “invited to the "
        "board,” never “sits on the board.” The board is not yet formally constituted.",
        "CFA is a <b>paid partner</b> to a company I'm close to — handled with total transparency: pricing disclosed "
        "to all owners, clean fixed fees, <b>no success fee.</b> Never imply special treatment or leverage.",
    ]))
    e.append(Paragraph("The commercials &amp; the thesis", H2))
    e.extend(bullets([
        "Fee is <b>N9.3M</b> (negotiated from a standard N17M — a large concession already made). Do not use the "
        "discount as leverage or discuss it as a favour. If payment comes up, it comes to me.",
        "This is a <b>culture and systems build, not a set of process patches.</b> Strong routines, standards of work "
        "and incentives are what make safe, efficient care self-sustaining. <b>“Culture is the multiplier”</b> "
        "is the line — everything we recommend ladders up to it.",
    ]))

    e.append(Paragraph("3.  What Haven is", H1))
    e.append(Paragraph(
        "A ~15-month-old private facility in GRA Ikeja: 5 general-paediatric beds + a 3-bed NICU. Owners: Kabir "
        "Aregbesola, Mrs Abisodun Alli, Dr Shakirah Saliu, and Dr Odedina (consultant "
        "neonatologist). It funds its own salaries and has a real local reputation — a genuine achievement this "
        "young. It is now scaling into more complex care (NICU), exactly when the systems beneath it must be "
        "deliberate rather than assumed.", P))
    e.append(Paragraph("The three business truths shaping our work:", P))
    e.extend(numbered([
        "<b>The cash problem is a working-capital problem, not a profit problem.</b> ~N4.2M is locked in HMO "
        "receivables (Leadway + NEM ≈ a full period's revenue) and ~N2.77M in pharmacy stock — roughly N7M tied "
        "up. Freeing it is our fastest, most visible win.",
        "<b>NICU is the growth engine</b> (≈N3M deposit per admission, 3 beds) — and scales safely only once "
        "governance and standards are in place. Fix the foundation, then fill NICU.",
        "<b>The reporting layer is immature, and that itself is a finding</b> — visit counts don't reconcile, the "
        "receivables table doesn't foot, a “201% pharmacy profit” is a markup not a margin. A senior "
        "operations leader (recruited via CadreHealth) is part of the answer.",
    ]))

    e.append(Paragraph("4.  The audit playbook — four weeks", H1))
    e.append(Paragraph(
        "Your toolkit is already built, in <font face='Helvetica-Oblique'>docs/</font>: the Information &amp; Data "
        "Request (the branded PDF goes to their point person), the staff safety-culture survey (online form), the "
        "fieldwork kit (your interview guides + observation checklist), and the crash-cart standard (the day-one "
        "quick win).", P))
    e.append(dtable(
        ["Week", "Where", "What you drive"],
        [["1", "Kick-off + remote", "Get a named point person (push for Head of Operations). Issue the data request; flag the 12 Week-1 critical items. Launch the survey. Put the crash-cart standard live. Start the Leadway/NEM receivables push. Begin reconciling the management accounts."],
         ["2", "On site", "Interviews (owners, clinical lead, neonatology, matron, pharmacy, front desk, accounts) using the fieldwork guides. Observation across shifts. SOP walk-throughs. NICU readiness."],
         ["3", "On site + remote", "Finance & working capital; procurement & inventory (physical spot-counts vs system); HMO economics; reporting-integrity reconciliation. Close the survey."],
         ["4", "Remote + board", "Synthesise into a prioritised, costed plan. Present the two deliverables in a board working session."]],
        [0.09, 0.18, 0.73]))
    e.append(Spacer(1, 3))
    e.append(Paragraph(
        "<b>Two deliverables:</b> (1) Operational &amp; Clinical Governance Audit Report; (2) Working Capital &amp; "
        "Receivables Recovery Plan — walked through with the board, never just emailed to file.", P))

    e.append(Paragraph("5.  How we work — the posture", H1))
    e.extend(bullets([
        "<b>Collaborative, not audit-by-ambush.</b> The team is a partner in the findings, not a target. Say so at the "
        "start of every interview. We diagnose a system, never blame a person.",
        "<b>“Nothing here is a test.”</b> Partial or messy records are themselves a finding. Take what exists.",
        "<b>Observe the real operating day</b> — a handover, a drug round, a patient from arrival to billing.",
        "<b>Reconcile numbers against each other.</b> Where visit counts, receivables and stock disagree is where the "
        "story is.",
        "<b>Protect the survey's anonymity fiercely.</b> Haven is small; report only grouped totals, never anything "
        "that could identify a respondent, and never let management see raw responses.",
        "<b>Confidentiality throughout</b> — one secure, read-only shared folder; data used only for this audit.",
    ]))

    e.append(Paragraph("6.  What to look for", H1))
    e.extend(bullets([
        "<b>Free the cash:</b> size the receivables precisely, get Leadway/NEM recovery moving in week 1, quantify how "
        "much of the N2.77M stock is releasable working capital.",
        "<b>Real pharmacy margin</b> vs the markup illusion; where margin leaks; the case for vendor-managed inventory "
        "(we lean toward Medbury Pharma).",
        "<b>Reporting you can trust:</b> what it takes to give the board numbers that reconcile.",
        "<b>Culture &amp; incentives as the lever:</b> the commission structure and JDS/KPIs awaiting board approval "
        "are the exact tools a strong culture runs on; the survey shows where the gaps are.",
        "<b>NICU safe-scaling</b> and <b>shift-level routines</b> (crash-cart check, handover) — the visible proof the "
        "culture is changing.",
    ]))

    e.append(Paragraph("7.  Practical logistics", H1))
    e.extend(bullets([
        "<b>Cadence:</b> daily 10-minute check-in with me during fieldwork; a short written end-of-week summary.",
        "<b>Escalate to me:</b> payment, board/owner relationships, the incident, scope/price, anything that feels off.",
        "<b>Comms tone with Haven:</b> warm, precise, confident, forward-looking — the calm, credible partner, never "
        "the auditor come to catch them out.",
    ]))

    e.append(Paragraph("8.  Do / Don't", H1))
    e.append(dtable(
        ["Do", "Don't"],
        [["Frame everything forward: building systems for growth", "Reference the May 2026 loss, in writing or speech"],
         ["Say “Dr Odulana was invited to the board”", "Say or imply he “sits on the board”"],
         ["Treat staff as partners in the findings", "Make anyone feel blamed or tested"],
         ["Report survey results as grouped totals only", "Let management see individual responses"],
         ["Route money / board / incident matters to Debo", "Negotiate price or discuss the discount yourself"],
         ["Lead with “culture is the multiplier”", "Sell the work as a set of process fixes"]],
        [0.5, 0.5]))

    e.append(Spacer(1, 8))
    e.append(callout("Welcome aboard, Tito. Do this one well and it becomes the template for how CFA runs a facility "
                     "turnaround. Any question at all, ask me early rather than late.  —  Debo", "navy"))
    doc.build(e)
    print(f"wrote {OUT}")


if __name__ == "__main__":
    build()
