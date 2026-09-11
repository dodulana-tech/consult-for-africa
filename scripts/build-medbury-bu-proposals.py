"""
Build the individual Medbury business-unit proposals, issued VIA the Office of the
Group Chief Executive to each BU head, with Consult for Africa as the support
partner. This operationalises the autonomy principle: the CEO's office enables,
the BU head decides.

Four proposals, each its own PDF, in the CFA house style (navy/gold/teal):
  1. Corporate Wellness turnaround   -> Corporate Wellness / Medical Services head
  2. Diagnostics growth + AI          -> Medbury Diagnostics (Lifecheck) head
  3. Abuja Conversion Clinic          -> Dr John, Hospitals Division
  4. Functional Medicine forward brief -> the Group CEO to sponsor (no head yet)

Run:
  python3 scripts/build-medbury-bu-proposals.py
"""

from __future__ import annotations

from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.utils import ImageReader
from reportlab.platypus import (
    BaseDocTemplate, Frame, NextPageTemplate, PageBreak, PageTemplate,
    Paragraph, Spacer, Table, TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"

# ---- CFA house palette (source: docs/brand-guide-cfa.pdf) ----
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
CELL = style("cell", fontSize=9.5, leading=13)
CELL_B = style("cellb", fontSize=9.5, leading=13, fontName="Helvetica-Bold", textColor=NAVY)
CELL_W = style("cellw", fontSize=9.5, leading=13, fontName="Helvetica-Bold", textColor=white)


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


def card(text, bg=SURFACE, fg=BODY):
    st = ParagraphStyle("c", parent=P, textColor=fg, leftIndent=8, rightIndent=8, spaceBefore=4, spaceAfter=4)
    t = Table([[Paragraph(text, st)]], colWidths=[PAGE_W - 2 * MARGIN])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg), ("LINEBEFORE", (0, 0), (0, -1), 3, GOLD),
        ("TOPPADDING", (0, 0), (-1, -1), 8), ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 12), ("RIGHTPADDING", (0, 0), (-1, -1), 12),
    ]))
    return t


def commercial_table(rows):
    data = [[Paragraph("Item", CELL_W), Paragraph("Basis", CELL_W)]]
    for a, b in rows:
        data.append([Paragraph(a, CELL_B), Paragraph(b, CELL)])
    t = Table(data, colWidths=[190, PAGE_W - 2 * MARGIN - 190])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY), ("LINEBELOW", (0, 0), (-1, 0), 2, GOLD),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, SURFACE]), ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LEFTPADDING", (0, 0), (-1, -1), 9), ("RIGHTPADDING", (0, 0), (-1, -1), 9),
    ]))
    return t


def cover_story(title, subtitle, prepared_for):
    el = []
    el.append(Spacer(1, 34))
    el.append(Paragraph("A PROPOSAL VIA THE OFFICE OF THE GROUP CHIEF EXECUTIVE",
                        ParagraphStyle("ce", fontName="Helvetica-Bold", fontSize=9.5, leading=13, textColor=GOLD, spaceAfter=12)))
    el.append(Paragraph(title, ParagraphStyle("ct", fontName="Helvetica-Bold", fontSize=25, leading=31, textColor=white)))
    el.append(Spacer(1, 14))
    el.append(Paragraph(subtitle, ParagraphStyle("cs", fontName="Helvetica-Bold", fontSize=13, leading=18, textColor=GOLD)))
    el.append(Spacer(1, 26))
    for lb, v in [("PREPARED FOR", prepared_for),
                  ("VIA", "The Office of the Group Chief Executive, Medbury Healthcare Group"),
                  ("SUPPORTED BY", "Consult for Africa"),
                  ("DATE", "July 2026")]:
        el.append(Paragraph(lb, ParagraphStyle("clbl", fontName="Helvetica-Bold", fontSize=8, leading=11, textColor=GOLD, spaceBefore=8, spaceAfter=1)))
        el.append(Paragraph(v, ParagraphStyle("cval", fontName="Helvetica", fontSize=10.5, leading=14, textColor=white)))
    el.append(NextPageTemplate("content"))
    el.append(PageBreak())
    return el


def contact_and_note(el):
    el.append(Spacer(1, 10))
    el.append(card(
        "<b>Consult for Africa</b> &nbsp; Healthcare transformation partner<br/>"
        "hello@consultforafrica.com &nbsp; / &nbsp; +234 913 813 8553 &nbsp; / &nbsp; consultforafrica.com",
        bg=NAVY, fg=white))
    el.append(Spacer(1, 6))
    el.append(Paragraph(
        "This proposal is offered as support through the Office of the Group Chief Executive. The "
        "business unit head owns the unit and the decision; scope and commercials are agreed in "
        "writing before any work begins.", SMALL))


def build_one(out_name, header_label, story):
    OUT = DOCS / out_name

    def content_bg(c, doc):
        c.saveState()
        c.setFillColor(NAVY); c.rect(0, PAGE_H - 34, PAGE_W, 34, fill=1, stroke=0)
        c.setFillColor(GOLD); c.rect(0, PAGE_H - 37, PAGE_W, 3, fill=1, stroke=0)
        c.setFillColor(white); c.setFont("Helvetica-Bold", 8.5); c.drawString(MARGIN, PAGE_H - 23, "CONSULT FOR AFRICA")
        c.setFillColor(LIGHT); c.setFont("Helvetica", 8.5)
        c.drawRightString(PAGE_W - MARGIN, PAGE_H - 23, header_label)
        c.setFillColor(GOLD); c.rect(MARGIN, 30, 24, 2, fill=1, stroke=0)
        c.setFillColor(MUTED); c.setFont("Helvetica", 8)
        c.drawString(MARGIN, 18, "Private and confidential  /  Via the Office of the Group CEO, Medbury")
        c.drawRightString(PAGE_W - MARGIN, 18, "Page %d" % doc.page)
        try:
            _ic = ImageReader(str(DOCS / "c4a-icon.png"))
            _iw, _ih = _ic.getSize(); _h = 22.0; _w = _h * _iw / _ih
            c.drawImage(_ic, PAGE_W - MARGIN - _w, PAGE_H - 61, width=_w, height=_h, mask="auto")
        except Exception:
            pass
        c.restoreState()

    doc = BaseDocTemplate(str(OUT), pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN,
                          topMargin=52, bottomMargin=42, title=header_label, author="Consult for Africa")
    doc.addPageTemplates([
        PageTemplate(id="cover", frames=[Frame(MARGIN, 170, PAGE_W - 2 * MARGIN, PAGE_H - 330, id="cover")], onPage=cover_bg),
        PageTemplate(id="content", frames=[Frame(MARGIN, 42, PAGE_W - 2 * MARGIN, PAGE_H - 52 - 42, id="content")], onPage=content_bg),
    ])
    doc.build(story)
    print(f"wrote {OUT}")


def sec(el, num, eyebrow, title):
    el.append(Paragraph(num + "  /  " + eyebrow, EYEBROW))
    el.append(Paragraph(title, H1))


# ================================================================ 1. Corporate Wellness
def corporate_wellness():
    el = cover_story(
        "Turning around Corporate Wellness",
        "A commercial fix for a business unit with the right reach and the wrong margins.",
        "The Business Unit Head, Corporate Wellness (Medbury Medical Services)")
    sec(el, "01", "THE SITUATION", "The reach is real. The margins are not managed.")
    el.append(Paragraph(
        "Corporate Wellness sits inside Nigeria's most established occupational health company, with "
        "a national footprint and a share of the group's 785 corporate clients. The asset is real. "
        "The arm is nonetheless making losses, and the cause is commercial rather than structural: "
        "pricing and margin are not being actively managed, and there is no client-by-client read on "
        "where the unit makes and loses money.", LEDE))
    el.append(Paragraph(
        "This is a solvable problem with the right commercial hand and the right data, not a "
        "restructuring. The offer below is support from the Group CEO's office to fix it, run at "
        "your direction.", P))
    sec(el, "02", "WHAT WE PROPOSE", "A commercial audit, a pricing redesign, and the discipline to hold it.")
    for h, t in [
        ("A commercial audit, first 60 days.",
         "Pricing, margin structure, cost base and client-by-client profitability, so the losses "
         "have a name and a number."),
        ("A pricing and margin redesign.",
         "Repricing where the unit is underwater, a clear margin floor, and a service and cost mix "
         "that the catchment and the contracts support."),
        ("Implementation support.",
         "C4A works alongside your team to install the new pricing and the reporting discipline that "
         "keeps it, rather than handing over a document."),
        ("A commercial lead, if you want one.",
         "If the unit needs a dedicated commercial manager, C4A sources and vets candidates through "
         "Maarova. Your call, not a condition."),
    ]:
        el.append(Paragraph("<b>" + h + "</b>&nbsp; " + t, P))
    sec(el, "03", "HOW IT WORKS, AND WHAT IT COSTS", "Support, not a takeover.")
    el.append(Paragraph(
        "This comes through the Office of the Group CEO as support. You own the unit and the "
        "decisions; C4A brings the commercial capability, the analysis and the hands. The audit "
        "carries no fee within the group engagement; implementation is scoped against the plan it "
        "produces.", P))
    el.append(commercial_table([
        ("Corporate Wellness commercial audit", "Complimentary within the group engagement (market value NGN 1,000,000)"),
        ("Pricing redesign and implementation support", "Scoped against the audit findings and the plan agreed with you"),
        ("Commercial lead search (optional)", "Via Maarova, 15% of first-year total compensation if taken up"),
    ]))
    sec(el, "04", "NEXT STEPS", "A short start, a fast read.")
    for line in [
        "<b>1.</b>&nbsp; A 30-minute kickoff to align on the unit's contracts and the data we need.",
        "<b>2.</b>&nbsp; The 60-day commercial audit, with a written read on where the losses are.",
        "<b>3.</b>&nbsp; The pricing redesign and the implementation plan, delivered with you.",
    ]:
        el.append(Paragraph(line, P))
    contact_and_note(el)
    build_one("medbury-bu-corporate-wellness-cfa.pdf", "Corporate Wellness  /  Proposal", el)


# ================================================================ 2. Diagnostics growth + AI
def diagnostics():
    el = cover_story(
        "Growing Diagnostics, and reading it with AI",
        "Turning national reach into national revenue, and adding AI-enabled interpretation.",
        "The Business Unit Head, Medbury Diagnostics (Lifecheck)")
    sec(el, "01", "THE SITUATION", "National reach, commercial output below it.")
    el.append(Paragraph(
        "The Lifecheck network and its partner labs give Medbury Diagnostics reach across Nigeria that "
        "its commercial output does not yet reflect. Two gaps explain most of the gap. There is no "
        "structured, product-led growth engine, clear packages, transparent pricing, digital booking. "
        "And interpretation is still fully manual, when AI can now assist it. Both are addressable now, "
        "and both are at your direction.", LEDE))
    sec(el, "02", "WHAT WE PROPOSE", "A growth engine, and an AI reading layer.")
    el.append(Paragraph("Product-led growth", H2))
    for h, t in [
        ("Product architecture and pricing.",
         "A clear package set, wellness screens, executive health, condition-specific panels, with "
         "simple names, transparent pricing and online booking. The product has to be understandable "
         "before it can be marketed."),
        ("National digital marketing and cross-sell.",
         "Search and social campaigns across the Lifecheck cities, and a structured cross-sell of the "
         "group's 785 corporate clients into diagnostics packages."),
        ("One brand, one booking system.",
         "Brand, pricing and booking harmonised across the centres and partner labs, carried on "
         "HospitlOS, so a patient gets one Medbury Diagnostics experience wherever they engage."),
    ]:
        el.append(Paragraph("<b>" + h + "</b>&nbsp; " + t, P))
    el.append(Paragraph("AI-enabled interpretation", H2))
    el.append(Paragraph(
        "In parallel, C4A works with your team to add AI-assisted interpretation of diagnostic "
        "results, imaging, pathology and multi-panel biochemistry. The brief covers evaluation of "
        "the available platforms, a clinical-governance framework so the clinician stays in charge, "
        "and a structured pilot before any group-wide rollout.", P))
    sec(el, "03", "HOW IT WORKS, AND WHAT IT COSTS", "At your direction.")
    el.append(Paragraph(
        "This comes through the Office of the Group CEO as support. The strategy work is complimentary "
        "within the group engagement; the marketing execution runs on a monthly retainer; the AI pilot "
        "is scoped only after the platform evaluation, so nothing is committed on faith.", P))
    el.append(commercial_table([
        ("Diagnostics growth strategy", "Complimentary within the group engagement (market value NGN 1,500,000)"),
        ("Marketing execution", "Monthly retainer from NGN 1,500,000; advertising budgets contracted by Medbury"),
        ("AI interpretation pilot", "Scoped after the platform evaluation and the governance framework"),
    ]))
    sec(el, "04", "NEXT STEPS", "Package first, then market, then read.")
    for line in [
        "<b>1.</b>&nbsp; Agree the package architecture and pricing for the first wave.",
        "<b>2.</b>&nbsp; Launch the national digital campaign and the corporate cross-sell.",
        "<b>3.</b>&nbsp; Evaluate the AI platforms and design the governed pilot.",
    ]:
        el.append(Paragraph(line, P))
    contact_and_note(el)
    build_one("medbury-bu-diagnostics-growth-cfa.pdf", "Medbury Diagnostics  /  Proposal", el)


# ================================================================ 3. Abuja Conversion Clinic
def abuja_clinic():
    el = cover_story(
        "The Abuja Conversion Clinic",
        "A premium HNI clinic and medical-tourism funnel, delivered end to end.",
        "Dr John, Hospitals Division")
    sec(el, "01", "THE CONCEPT", "A premium address that filters and refers.")
    el.append(Paragraph(
        "A premium conversion clinic in a converted Asokoro or Maitama townhouse, serving high-net-worth "
        "Abuja, the diplomatic community and returning diaspora. On the surface a real clinic where "
        "consultation, investigation and entry-point treatment happen. Underneath, the qualification "
        "front-end for two outbound pathways, Alameda in Egypt for complex traditional care and Medeeze "
        "in Thailand for regenerative, and the first phase of a hospital co-owned with the partners.", LEDE))
    el.append(Paragraph(
        "The full strategy, model of care, referral architecture and property brief are in the companion "
        "working document. This is the proposal for how Consult for Africa delivers it, for your decision "
        "as the Hospitals lead.", P))
    sec(el, "02", "WHAT C4A DELIVERS", "From an empty townhouse to a running clinic.")
    for h, t in [
        ("Location search and site evaluation.",
         "C4A engages Abuja agents and its own network, visits and filters against the conversion "
         "criteria, and returns a shortlist with a comparative evaluation. Your shortlist feeds it too, "
         "and the final site decision is yours."),
        ("Renovation project management.",
         "The clinical and commercial fit-out brief, the interior partner (O'cubed or Anfani, or your "
         "preferred), and end-to-end programme management to snagging and handover."),
        ("The model of care and the referral engine.",
         "The closed-circuit, doctor-to-doctor referral architecture that replaces walk-in marketing, "
         "and the case-routing between Nigeria, Alameda and Medeeze."),
        ("Technology and equipment.",
         "HospitlOS configured before the first patient, and the equipment schedule for the conversion "
         "brief."),
    ]:
        el.append(Paragraph("<b>" + h + "</b>&nbsp; " + t, P))
    sec(el, "03", "COMMERCIALS", "Priced to the work, and to your call.")
    el.append(Paragraph(
        "Priced so the facility economics rest on delivery, not on a search fee. The final site decision, "
        "and the go or no-go, sit with you.", P))
    el.append(commercial_table([
        ("Location search and engagement management", "NGN 750,000 mobilisation. Agency and legal fees contracted directly by Medbury"),
        ("Renovation project management", "12% of project cost, billed in three tranches: brief, practical completion, handover"),
        ("Model of care and referral design", "Included in the engagement"),
    ]))
    sec(el, "04", "NEXT STEPS", "Sites first, within the month.")
    for line in [
        "<b>1.</b>&nbsp; Confirm the search brief and the Asokoro or Maitama envelope.",
        "<b>2.</b>&nbsp; C4A returns three to five shortlisted townhouses, assessed against the conversion criteria, within five working days of each visit.",
        "<b>3.</b>&nbsp; On your selected site, a costed lease-and-renovation plan.",
    ]:
        el.append(Paragraph(line, P))
    contact_and_note(el)
    build_one("medbury-bu-abuja-clinic-cfa.pdf", "Abuja Conversion Clinic  /  Proposal", el)


# ================================================================ 4. Functional Medicine forward brief
def functional_medicine():
    el = cover_story(
        "The Functional Medicine and Longevity venture",
        "The scale play that needs a leader before it needs a building.",
        "The Office of the Group Chief Executive (to sponsor)")
    sec(el, "01", "THE OPPORTUNITY", "The group's most exciting thesis, moving too slowly.")
    el.append(Paragraph(
        "The functional-medicine and longevity vision, supplements, regenerative and rejuvenation "
        "therapies, longevity protocols and medical-tourism conversion, is the group's most exciting "
        "growth thesis. It is moving slowly for one reason: the people and the facilities to execute it "
        "are not yet in place. The Abuja conversion clinic and The Lyfe Place are its scale plays, and "
        "both are waiting on the same missing piece.", LEDE))
    sec(el, "02", "WHAT IT NEEDS FIRST", "A COO, before a building.")
    el.append(Paragraph(
        "This is a concierge, high-end business, and it needs a Chief Operating Officer who has run "
        "exactly that: someone who understands the patient journey from first enquiry through "
        "investigation, programme design and follow-up, who can lead a multi-modality clinical team, "
        "and who can make a premium concierge experience repeatable. The building can wait. The leader "
        "cannot.", P))
    el.append(Paragraph(
        "Consult for Africa sources and vets that COO through Maarova and CadreHealth, inside and "
        "outside Nigeria, and designs the venture and the model of care in parallel, so the moment the "
        "leader lands there is something ready for them to run.", P))
    sec(el, "03", "HOW IT FITS", "Sponsored at the top, transferred to the COO.")
    el.append(Paragraph(
        "Because there is no business unit head for this yet, it sits with the Office of the Group CEO "
        "to sponsor, and transfers to the Functional Medicine COO the moment they are in post. C4A "
        "carries the search and the design in the meantime, so the group loses no time waiting.", P))
    el.append(card(
        "The sequence is deliberate. Define the role and the model of care now, recruit into clarity, "
        "and let the Abuja clinic and The Lyfe Place become the first two homes for the venture rather "
        "than orphan projects.", bg=PANEL))
    sec(el, "04", "NEXT STEPS", "Brief the role, open the search.")
    for line in [
        "<b>1.</b>&nbsp; Agree the COO brief: scope, scorecard, non-negotiables.",
        "<b>2.</b>&nbsp; C4A opens the search through Maarova and CadreHealth, inside and outside Nigeria.",
        "<b>3.</b>&nbsp; The model of care is designed alongside the Abuja clinic, ready for the COO to inherit.",
    ]:
        el.append(Paragraph(line, P))
    contact_and_note(el)
    build_one("medbury-bu-functional-medicine-cfa.pdf", "Functional Medicine  /  Forward brief", el)


if __name__ == "__main__":
    corporate_wellness()
    diagnostics()
    abuja_clinic()
    functional_medicine()
