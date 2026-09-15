"""
Build the internal Haven engagement brief for Abigail, joining the project.

Successor to the Tito enablement guide, updated to where the work actually is:
the audit has landed with the board, the founders' survey is out, and the
strategy session and transformation programme are next.

Output: docs/haven-brief-abigail-cfa.pdf  (A4, branded, INTERNAL)

Run: python3 scripts/build-haven-brief-abigail.py
"""
from __future__ import annotations
from pathlib import Path
from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.platypus import (
    BaseDocTemplate, Frame, KeepTogether, PageBreak, PageTemplate, Paragraph,
    Spacer, Table, TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
OUT = DOCS / "haven-brief-abigail-cfa.pdf"

NAVY = HexColor("#0B3C5D"); GOLD = HexColor("#D4AF37"); TEAL = HexColor("#1F7A8C")
BODY = HexColor("#1F2937"); MUTED = HexColor("#6B7280"); SURFACE = HexColor("#F1F5F9")
LIGHT = HexColor("#C9D6E0"); CREAM = HexColor("#FBF6E6")
ALERTBG = HexColor("#FBEEE9"); ALERTLINE = HexColor("#B0392B"); ALERTTX = HexColor("#7A2F2F")
PANEL = HexColor("#EAF1F4")
PAGE_W, PAGE_H = A4
MARGIN = 46
CW = PAGE_W - 2 * MARGIN


def sy(name, **kw):
    base = dict(fontName="Helvetica", fontSize=9.8, leading=13.8, textColor=BODY,
                alignment=TA_LEFT, spaceAfter=4)
    base.update(kw); return ParagraphStyle(name, **base)


H1 = sy("h1", fontName="Helvetica-Bold", fontSize=12.5, leading=15, textColor=NAVY,
        spaceBefore=13, spaceAfter=5)
H2 = sy("h2", fontName="Helvetica-Bold", fontSize=10.5, leading=13, textColor=TEAL,
        spaceBefore=8, spaceAfter=2)
P = sy("p")
LEDE = sy("lede", fontSize=10.2, leading=15, textColor=HexColor("#374151"))
SMALL = sy("small", fontSize=8.4, leading=11.5, textColor=MUTED)
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
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 23,
                      "Haven Paediatrics  /  Engagement Brief")
    c.setFillColor(GOLD); c.rect(MARGIN, 30, 24, 2, fill=1, stroke=0)
    c.setFillColor(MUTED); c.setFont("Helvetica", 8)
    c.drawString(MARGIN, 18, "Internal  /  For Abigail  /  Not for the client")
    c.drawRightString(PAGE_W - MARGIN, 18, "Page %d" % doc.page)
    try:
        ic = ImageReader(str(DOCS / "c4a-icon.png")); iw, ih = ic.getSize()
        h = 22.0
        c.drawImage(ic, PAGE_W - MARGIN - h * iw / ih, PAGE_H - 61,
                    width=h * iw / ih, height=h, mask="auto")
    except Exception:
        pass
    c.restoreState()


def callout(text, variant="gold"):
    bg, spine, col, fn = CREAM, GOLD, NAVY, "Helvetica-Bold"
    if variant == "teal": bg, spine, col, fn = PANEL, TEAL, NAVY, "Helvetica"
    elif variant == "alert": bg, spine, col, fn = ALERTBG, ALERTLINE, ALERTTX, "Helvetica-Bold"
    stl = ParagraphStyle("co", parent=P, fontName=fn, textColor=col, leading=13.8)
    t = Table([[Paragraph(text, stl)]], colWidths=[CW])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg), ("LINEBEFORE", (0, 0), (0, -1), 3, spine),
        ("TOPPADDING", (0, 0), (-1, -1), 8), ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 12), ("RIGHTPADDING", (0, 0), (-1, -1), 12),
    ]))
    return t


def bullets(items):
    return [Paragraph("&bull;&nbsp;&nbsp;" + b, P) for b in items]


def dtable(header, rows, fracs):
    widths = [CW * f for f in fracs]
    data = [[Paragraph(h, CELLW) for h in header]]
    for r in rows:
        data.append([Paragraph(c, CELLB if j == 0 else CELL) for j, c in enumerate(r)])
    t = Table(data, colWidths=widths, repeatRows=1)
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
                          topMargin=50, bottomMargin=40,
                          title="Haven Paediatrics - Engagement Brief for Abigail",
                          author="Consult For Africa")
    frame = Frame(MARGIN, 40, CW, PAGE_H - 50 - 40, id="f")
    doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=furniture)])
    e = []

    e.append(Paragraph("Haven Paediatrics", ParagraphStyle(
        "t", fontName="Helvetica-Bold", fontSize=19, leading=22, textColor=NAVY, spaceAfter=1)))
    e.append(Paragraph("Engagement brief for Abigail", ParagraphStyle(
        "s", fontName="Helvetica-Bold", fontSize=12, leading=15, textColor=TEAL, spaceAfter=5)))
    e.append(Paragraph(
        "Prepared by Dr Debo Odulana, Consult for Africa  &middot;  Internal, not for the "
        "client  &middot;  August 2026", SMALL))
    e.append(Spacer(1, 7))
    e.append(Paragraph(
        "Welcome to Haven. You are joining at the hinge point: the audit has landed with the "
        "board, and the transformation work has not started. This brief is what you need to "
        "be useful in the first week. Read section 3 before you speak to anyone at Haven or "
        "write a word that could reach them. On this engagement, how we carry ourselves "
        "matters as much as what we find.", LEDE))

    # ---------------------------------------------------------------- 1
    e.append(Paragraph("1.  Where the project actually is", H1))
    e.append(Paragraph(
        "One sentence: we have told a young hospital that its care is excellent and the "
        "systems underneath it are not, and we are now waiting on the founders before we "
        "build the fix.", P))
    e.append(dtable(
        ["Stage", "Status", "What it means for you"],
        [["Diagnostic audit", "Complete",
          "Four evidence streams, reported at 101 pages plus a 21-slide board deck"],
         ["Report delivered", "Sent 30 Aug 2026",
          "Five individual emails to the founders, cc Debo. They also had it on WhatsApp first"],
         ["Founders' survey", "Live, awaiting responses",
          "Your first live task. Nobody has completed it yet"],
         ["Strategy session", "Not yet scheduled",
          "Cannot be designed until the survey is in. The survey is what makes it worth holding"],
         ["Transformation programme", "Not started",
          "Scoped in the report as five decisions and a 90-day plan. Waits on the session"]],
        [0.22, 0.2, 0.58]))
    e.append(Spacer(1, 4))
    e.append(callout(
        "The critical path runs through five people answering a twenty minute survey. "
        "Until that happens the strategy session cannot be designed and the transformation "
        "cannot start. Treat chasing it as real work, not admin.", "teal"))

    # ---------------------------------------------------------------- 2
    e.append(Paragraph("2.  What Haven is", H1))
    e.append(Paragraph(
        "A private paediatric facility in GRA Ikeja, about eighteen months old. Five general "
        "paediatric beds and a three-bed neonatal unit. It funds its own salaries, holds a "
        "real local reputation, and is scaling into more complex care, which is exactly when "
        "the systems beneath a facility have to become deliberate rather than assumed.", P))
    e.append(Paragraph("The five owners", H2))
    e.append(Paragraph(
        "Kabir Aregbesola, Mrs Abisodun Alli, Dr Shakirah Saliu, Dr Odedina (Medical "
        "Director), Ogochukwu Odum. Use those names and spellings exactly; several have been "
        "written wrongly in the past and corrected. Dr Shakirah Saliu is a former co-founder "
        "of Debo's from Doctoora Health, which is why the relationship is close and why the "
        "tone of everything we send matters more than usual.", P))
    e.append(Paragraph("The operating reality you should know cold", H2))
    e.append(dtable(
        ["Measure", "Position", "Why it matters"],
        [["Patient experience", "4.60 of 5, 16 caregivers",
          "13 of 15 would definitely recommend. This is the asset the whole plan protects"],
         ["Staff safety grade", "22 of 23 very good or excellent",
          "Staff rate the care they give highly, anonymously, with nothing to gain"],
         ["Staff tenure", "12 of 16 under a year, none beyond two",
          "The multiplier on every other problem. Nothing compounds"],
         ["Organisational maturity", "2.5 of 5, down from 3.0",
          "Patient-facing workstreams rose. Everything supporting them fell"],
         ["Registered nurses in H1", "Four",
          "Eight days in July had two people covering a 24-hour hospital"],
         ["Tariff lines priced at zero", "1,952 of 2,413",
          "Four fifths of the price list carries no price"]],
        [0.24, 0.26, 0.50]))

    e.append(PageBreak())

    # ---------------------------------------------------------------- 3
    e.append(Paragraph("3.  Read this before anything else", H1))
    e.append(Paragraph(
        "Four rules govern this engagement. They are not style preferences. Three of them "
        "exist because a consultant's written document is discoverable and can end up in "
        "front of a regulator, a claimant or a journalist.", P))

    e.append(Paragraph("3.1  The incident, and how we hold it", H2))
    e.append(callout(
        "In May 2026 Haven lost a child. The child was referred in already critically ill "
        "and may not have been saveable under any circumstances. The loss is not "
        "attributable to the facility. It is what prompted leadership to call us.", "alert"))
    e.append(Spacer(1, 3))
    e += bullets([
        "<b>We do not raise it. Ever.</b> Not in writing, not in conversation, not in a "
        "WhatsApp message. If a staff member raises it, listen with care, do not probe for "
        "blame, and move on.",
        "<b>Every client-facing word is forward-looking.</b> We are here because a strong "
        "young facility is putting proper systems under its growth. Not because something "
        "went wrong.",
        "<b>Why it is this strict.</b> A written record linking a death to any facility gap "
        "is a liability for Haven and for us, and it reopens a wound for a grieving board. "
        "Every finding we have stands on its own without ever invoking the loss.",
    ])

    e.append(Paragraph("3.2  The reporting question, and how we frame it", H2))
    e.append(Paragraph(
        "This is the newest and most delicate thing on the engagement, and it did not exist "
        "when the last brief was written. The audit found that Haven's board reporting does "
        "not reconcile to its own transaction record at monthly level: January overstated by "
        "N8.00M, March understated by N7.87M, while the half-year total lands within 0.14 "
        "percent of correct.", P))
    e.append(callout(
        "The report deliberately does not draw a conclusion from this, and neither do you. "
        "It states the facts, notes that each item has an innocent explanation available, "
        "says the pattern of them together needs one, and recommends an independent "
        "reconciliation done outside the operations function. Procedural, never accusatory.",
        "alert"))
    e.append(Spacer(1, 3))
    e += bullets([
        "<b>Individuals are referred to by role, never by name.</b> The Head of Operations. "
        "A pharmacy technician. The evidence packs name people; our client documents do not.",
        "<b>Do not harden the language.</b> Not in a slide, not in an email, not verbally in "
        "a meeting. If someone at Haven presses you for a view on it, the answer is that the "
        "reconciliation will settle it and we are not going to prejudge it.",
        "<b>If this escalates, it goes to Debo.</b> Immediately and only.",
    ])

    e.append(Paragraph("3.3  The relationship and governance", H2))
    e += bullets([
        "Debo was <b>invited to Haven's board from inception but does not formally sit on "
        "it.</b> Say invited to the board, never sits on the board. The board is not yet "
        "formally constituted.",
        "CFA is a paid partner to a company Debo is close to. A related-party situation "
        "handled with total transparency: pricing disclosed to all owners, clean fixed fees, "
        "no success fee. You do not manage this, but know it, and never imply special "
        "treatment or leverage.",
    ])

    e.append(Paragraph("3.4  The commercials", H2))
    e.append(Paragraph(
        "The fee is N9.3M, negotiated down from a standard N17M. A large concession has "
        "already been made. Do not use the discount as leverage or discuss it as a favour. "
        "If payment comes up in any form, it comes to Debo.", P))

    # ---------------------------------------------------------------- 4
    e.append(Paragraph("4.  What the audit found", H1))
    e.append(Paragraph(
        "The thesis in one line: the care is ahead of the systems holding it up. Haven is "
        "not underperforming; it is a hospital whose performance rests on particular people "
        "rather than on systems that would survive their leaving.", P))
    e.append(Paragraph("The three things the board has to close first", H2))
    e.append(dtable(
        ["", "Finding", "Where it stands"],
        [["01", "Regulatory currency. Monthly reports recorded the facility as "
                "unregistered every month January to April, when registration was in fact "
                "held.",
          "Largely closed. Registration confirmed by Debo; this year's renewal pending. "
          "Survives as a reporting finding, not a licensing one"],
         ["02", "The establishment does not match the hospital. Four nurses through the "
                "half year, no pharmacist rostered on any day, eight days with two people "
                "covering 24 hours.",
          "Open. The most pressing of the three and the most straightforward to fix"],
         ["03", "The revenue record is a nursing handover sheet. The nursing procedure has "
                "nurses filling the revenue spreadsheets from memory at end of shift.",
          "Open. Fix is to let the clinical record system be the record and retire the "
          "manual layer"]],
        [0.05, 0.45, 0.50]))
    e.append(Spacer(1, 5))
    e.append(Paragraph("Underneath those", H2))
    e += bullets([
        "<b>People systems rate 1.4 of 5</b>, the lowest score anywhere in the work. No "
        "performance management, no structured induction, no training calendar, no exit "
        "interviews. Staff were told to write their own indicators.",
        "<b>Processes exist and are not followed</b>, for four reasons: nobody was taught "
        "them, nobody measures them, the workforce is mostly new, and several cannot be "
        "followed as written because they assign work to posts that do not exist.",
        "<b>Owner alignment is unresolved.</b> Two legitimate instincts, one weighted to "
        "protecting staff and one to commercial discipline, never reconciled into a rule. "
        "This is what the strategy session exists to settle.",
        "<b>The commercial gap is yield, not demand.</b> The neonatal unit and the "
        "laboratory are the two highest-value assets and neither is managed for yield.",
    ])

    e.append(PageBreak())

    # ---------------------------------------------------------------- 5
    e.append(Paragraph("5.  A methodological lesson, learned the hard way", H1))
    e.append(Paragraph(
        "Read this one carefully, because it will save you from the mistake I made twice.", P))
    e.append(Paragraph(
        "Much of the documentary analysis was built from evidence packs that catalogued 74 "
        "findings across 34 client documents. Two of those findings were wrong, and both "
        "failed the same way: the pack read <b>absent from the documents supplied</b> as "
        "<b>does not exist in reality</b>.", P))
    e.append(dtable(
        ["The claim", "The truth", "How it surfaced"],
        [["No consultant rota exists",
          "A consultant rota does exist. It simply was not among the documents supplied",
          "Debo corrected it from direct knowledge after reading the draft"],
         ["The facility is unlicensed",
          "Registration is held. Only this year's renewal is pending",
          "Debo corrected it from direct knowledge after reading the draft"]],
        [0.26, 0.38, 0.36]))
    e.append(Spacer(1, 5))
    e.append(callout(
        "Any finding of the form <i>X does not exist</i> is a claim about the world built "
        "from a gap in a folder. Before it goes in front of a client, either confirm it with "
        "someone who would know, or write it as what it actually is: we asked for X and did "
        "not receive it.", "alert"))
    e.append(Spacer(1, 4))
    e.append(Paragraph(
        "Both corrections were absorbed cleanly because they came before the report went "
        "out. The cost of the same error after delivery would have been the credibility of "
        "everything else in a 101-page document. That is the asymmetry to hold in mind.", P))

    # ---------------------------------------------------------------- 6
    e.append(Paragraph("6.  What happens next, and your part in it", H1))
    e.append(dtable(
        ["Step", "What it involves", "Owner"],
        [["Chase the founders' survey",
          "Five founders, twenty minutes each, live now. Completion is visible on the admin "
          "page and Debo gets an email on each submission. Chase warmly and individually, "
          "never as a group message",
          "You, with Debo on the relationship"],
         ["Synthesise the five",
          "The instrument is built on forced trade-offs, constant-sum allocations and a "
          "section asking each founder what they think the others believe. The divergence is "
          "the output, not the average",
          "You draft, Debo edits"],
         ["Circulate the pattern before the session",
          "So nobody walks in cold and nobody is ambushed by a finding about their own "
          "position",
          "Debo sends"],
         ["Design and run the strategy session",
          "Built around the five decisions in the report: growth axis, operating model, "
          "workforce proposition, service portfolio, funding",
          "Joint"],
         ["Scope the transformation programme",
          "The 90-day plan and the initiative register are already written. They need "
          "sequencing against whatever the board actually decides",
          "Joint"]],
        [0.22, 0.55, 0.23]))

    # ---------------------------------------------------------------- 7
    e.append(Paragraph("7.  How we write here", H1))
    e.append(Paragraph(
        "Client documents are partner-level counsel to founders Debo knows personally, not "
        "audit papers written for a file. The register matters as much as the content.", P))
    e += bullets([
        "<b>Write to them, not about them.</b> Your nurses, your tariff, what we found, our "
        "judgement. Third-person audit prose puts distance between us and a client who "
        "invited us in.",
        "<b>Never let a systems finding read as a personal one.</b> Name people by role, and "
        "warmly. Your business development team, which is working genuinely hard.",
        "<b>Say what you cannot tell them.</b> Candour about the limits of the evidence "
        "reads as integrity and protects the firm.",
        "<b>No em dashes anywhere.</b> House rule, applies to every document, email and "
        "slide. Use a comma, a full stop or a colon.",
        "<b>Do not name our platforms in client body copy.</b> Describe what is done, not "
        "the product that does it.",
        "<b>Short paragraphs, one idea each.</b> Debo's register is declarative. State the "
        "position and stop. No rhetorical build, no sentimentality, no performed humility.",
    ])

    e.append(PageBreak())

    # ---------------------------------------------------------------- 8
    e.append(Paragraph("8.  Where everything lives", H1))
    e.append(dtable(
        ["Artefact", "Path", "Note"],
        [["Audit report", "docs/haven-organisational-audit-report-cfa.pdf",
          "101pp. Built by scripts/build-haven-audit-report.py"],
         ["Board deck", "docs/haven-audit-findings-deck-cfa.pdf",
          "21 landscape slides, same numbers as the report"],
         ["Survey results", "docs/haven-survey-results-cfa.pdf",
          "Staff and caregiver surveys in full"],
         ["Founders' survey", "consultforafrica.com/haven-leadership-survey.html",
          "Live. Responses land in AuditSurveyResponse"],
         ["Live results page", "/admin/haven-survey",
          "Completion tracker, allocations, tensions, perception gaps"],
         ["Survey analysis cache", "docs/data/haven-survey-analysis.json",
          "So the report and deck rebuild without database access"],
         ["Evidence packs", "~/Downloads/HAVEN_PAEDIATRIC_AUDIT_DATA_PACK*.md",
          "74 findings from 34 client documents. Read section 5 first"],
         ["Send script", "scripts/send-haven-audit-report.ts",
          "Dry-run by default. Never Zoho SMTP, ZeptoMail HTTP API only"]],
        [0.20, 0.42, 0.38]))

    # ---------------------------------------------------------------- 9
    e.append(Paragraph("9.  Do and do not", H1))
    e.append(dtable(
        ["Do", "Do not"],
        [["Frame everything forward: building systems for growth",
          "Reference the May 2026 loss, in writing or in speech"],
         ["Say Debo was invited to the board",
          "Say or imply he sits on the board"],
         ["Keep the reporting finding procedural and role-based",
          "Name an individual, or offer a view on what the pattern means"],
         ["Write <i>we asked for X and did not receive it</i>",
          "Write <i>X does not exist</i> without confirming it"],
         ["Report survey results as grouped totals",
          "Let management see any individual staff response"],
         ["Chase the founders one by one, warmly",
          "Send a group chaser that lets four people wait for the fifth"],
         ["Route money, board and incident matters to Debo",
          "Negotiate price or discuss the discount yourself"],
         ["Lead with: the care is ahead of the systems",
          "Sell the work as a set of process fixes"]],
        [0.5, 0.5]))

    e.append(Spacer(1, 10))
    e.append(callout(
        "Welcome aboard. The thing that makes this engagement unusual is that the client is "
        "good at the hard part and weak at the easy part, which is a far better problem than "
        "the reverse and a much more satisfying one to fix. Ask me early rather than late, "
        "on anything at all.", "gold"))
    e.append(Spacer(1, 8))
    e.append(Paragraph(
        "<b>Consult for Africa</b> &middot; hello@consultforafrica.com &middot; "
        "+234 913 813 8553 &middot; consultforafrica.com", SMALL))

    doc.build(e)
    print(f"wrote {OUT.relative_to(ROOT)}  ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    build()
