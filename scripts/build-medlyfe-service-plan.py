"""
Build "Regenerative Aesthetics - Service, Pricing and Training" for Dr Itunu
Akinware: a research-backed service profile, benchmark price list, margins, and a
two-tier (doctor + nurse) delegated-training and safety-governance plan for the
Medlyfe aesthetics pilot. CFA house style. NGN. No em dashes.

Grounded in deep research (task wcvnyqo9g): injectables as the anchor (50-70% GM);
regenerative layer (PRP, Profhilo, IV) as the differentiator; benchmark pricing
from Dubai/SA/US converted to NGN; JCCP/CPSA competency milestone (10 observed +
10 supervised per modality); the absent-lead safety backbone (on-call prescriber,
stocked hyaluronidase, pulsed-hyaluronidase VO protocol). Nigeria-specific
regulation flagged as to-confirm (no reliable local data survived verification).

Run:
  python3 scripts/build-medlyfe-service-plan.py
"""

from __future__ import annotations

from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.platypus import (
    BaseDocTemplate, Frame, NextPageTemplate, PageBreak, PageTemplate,
    Paragraph, Spacer, Table, TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
OUT = DOCS / "medlyfe-aesthetics-service-pricing-training-cfa.pdf"

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


EYEBROW = style("eyebrow", fontName="Helvetica-Bold", fontSize=9, leading=12, textColor=GOLD, spaceAfter=3)
H1 = style("h1", fontName="Helvetica-Bold", fontSize=15, leading=19, textColor=NAVY, spaceBefore=8, spaceAfter=6)
H2 = style("h2", fontName="Helvetica-Bold", fontSize=10.5, leading=14, textColor=TEAL, spaceBefore=7, spaceAfter=3)
P = style("p")
LEDE = style("lede", fontSize=11, leading=16, textColor=HexColor("#374151"))
SMALL = style("small", fontSize=8.5, leading=12, textColor=MUTED)
CAP = style("cap", fontName="Helvetica-Bold", fontSize=8.5, leading=11, textColor=TEAL, spaceBefore=4, spaceAfter=3)
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
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 23, "Regenerative Aesthetics  /  Service, Pricing and Training")
    c.setFillColor(GOLD); c.rect(MARGIN, 30, 24, 2, fill=1, stroke=0)
    c.setFillColor(MUTED); c.setFont("Helvetica", 8)
    c.drawString(MARGIN, 18, "Private and confidential  /  Draft, benchmark figures for tuning")
    c.drawRightString(PAGE_W - MARGIN, 18, "Page %d" % doc.page)
    try:
        _ic = ImageReader(str(DOCS / "c4a-icon.png"))
        _iw, _ih = _ic.getSize(); _h = 22.0; _w = _h * _iw / _ih
        c.drawImage(_ic, PAGE_W - MARGIN - _w, PAGE_H - 61, width=_w, height=_h, mask="auto")
    except Exception:
        pass
    c.restoreState()


def card(text, bg=SURFACE, fg=BODY):
    st = ParagraphStyle("c", parent=P, textColor=fg, leftIndent=8, rightIndent=8, spaceBefore=3, spaceAfter=3)
    t = Table([[Paragraph(text, st)]], colWidths=[FULLW])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg), ("LINEBEFORE", (0, 0), (0, -1), 3, GOLD),
        ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LEFTPADDING", (0, 0), (-1, -1), 11), ("RIGHTPADDING", (0, 0), (-1, -1), 11),
    ]))
    return t


def bullet(text):
    return Paragraph("<font color='#D4AF37'>&bull;</font>&nbsp; " + text,
                     ParagraphStyle("b", parent=P, leftIndent=12, spaceAfter=3))


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


def sec(el, num, eyebrow, title):
    el.append(Paragraph(num + "  /  " + eyebrow, EYEBROW))
    el.append(Paragraph(title, H1))


def build():
    doc = BaseDocTemplate(str(OUT), pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN,
                          topMargin=52, bottomMargin=42, title="Regenerative Aesthetics - Service, Pricing and Training",
                          author="Consult for Africa")
    doc.addPageTemplates([
        PageTemplate(id="cover", frames=[Frame(MARGIN, 150, FULLW, PAGE_H - 300, id="cover")], onPage=cover_bg),
        PageTemplate(id="content", frames=[Frame(MARGIN, 42, FULLW, PAGE_H - 52 - 42, id="content")], onPage=content_bg),
    ])
    el = [Spacer(1, 34)]
    el.append(Paragraph("THE AESTHETICS PILOT  /  MEDLYFE REGENERATIVE AESTHETICS",
                        ParagraphStyle("ce", fontName="Helvetica-Bold", fontSize=9.5, leading=13, textColor=GOLD, spaceAfter=12)))
    el.append(Paragraph("Service, Pricing and Training", ParagraphStyle("ct", fontName="Helvetica-Bold", fontSize=25, leading=30, textColor=white)))
    el.append(Spacer(1, 12))
    el.append(Paragraph("A medically-led menu, benchmark pricing, and the plan to train the team.",
                        ParagraphStyle("cs", fontName="Helvetica-Bold", fontSize=12.5, leading=17, textColor=GOLD)))
    el.append(Spacer(1, 24))
    for lb, v in [("PREPARED FOR", "Dr Itunu Akinware (Medlyfe Wellness / Medbury)"),
                  ("BY", "Consult for Africa"),
                  ("BASIS", "Grounded in benchmark research; figures to firm on local pricing and rules"),
                  ("STATUS", "Draft for discussion")]:
        el.append(Paragraph(lb, ParagraphStyle("clbl", fontName="Helvetica-Bold", fontSize=8, leading=11, textColor=GOLD, spaceBefore=7, spaceAfter=1)))
        el.append(Paragraph(v, ParagraphStyle("cval", fontName="Helvetica", fontSize=10.5, leading=14, textColor=white)))
    el.append(NextPageTemplate("content"))
    el.append(PageBreak())

    # 01 Overview
    sec(el, "01", "THE APPROACH", "Injectables at the core, regenerative as the edge, clinicians only.")
    el.append(Paragraph(
        "The menu anchors on injectables, botulinum toxin and dermal fillers, which are the primary "
        "revenue driver of any serious aesthetics practice, capturing more than half of med-spa "
        "revenue and carrying the best margins (50 to 70 percent gross). Around that sits a "
        "regenerative and wellness layer, PRP, bio-remodelling and IV infusions, that differentiates "
        "the brand and carries strong markup. Everything is delivered by clinicians, doctors and "
        "nurses, which suits a premium, medically-led positioning and is what keeps it safe.", LEDE))
    el.append(card(
        "Pricing here is benchmarked from premium markets (Dubai, South Africa, the US) converted to "
        "naira at about NGN 1,500 to the dollar. NGN is volatile and there is little public Lagos "
        "price data, so treat these as a defensible starting point to validate against the Medlyfe "
        "list, Dr Kpaduwa's view, and one or two local competitors.", bg=PANEL))
    el.append(PageBreak())

    # 02 Service profile
    sec(el, "02", "THE SERVICE PROFILE", "What to launch, and what to differentiate on.")
    el.append(Paragraph("Injectables (the revenue anchor)", H2))
    el.append(bullet("Anti-wrinkle (botulinum toxin), dermal fillers, bio-remodelling (Profhilo), skin boosters and mesotherapy, and PDO threads."))
    el.append(Paragraph("Regenerative and wellness (the differentiator)", H2))
    el.append(bullet("PRP for skin and hair, exosomes as a premium add-on, and IV wellness infusions. Low consumable cost, high perceived value, and a natural tie to the Medlyfe wellness brand."))
    el.append(Paragraph("Skin (the repeat-visit engine)", H2))
    el.append(bullet("Medical facials, chemical peels, microneedling and RF microneedling, and laser. These keep patients on a cycle between injectable appointments."))
    el.append(Spacer(1, 3))
    el.append(card(
        "Launch with the injectables and the regenerative layer, they are the margin and the story. "
        "Add device-heavy lines (advanced laser platforms) only as demand proves out, since they tie "
        "up capital. Exosomes and threads sit with the doctor, not the nurse.", bg=SURFACE))
    el.append(PageBreak())

    # 03 Price list
    sec(el, "03", "THE PRICE LIST", "Indicative Lagos pricing, benchmark-derived.")
    el.append(Paragraph(
        "A premium list, positioned between South African and Dubai price points. The final column "
        "ties each treatment to who delivers it under the training model.", P))
    el.append(grid(
        [["Aesthetic consultation (redeemable)", "50,000", "Doctor or nurse"],
         ["Anti-wrinkle, per area", "180,000", "Nurse or doctor"],
         ["Anti-wrinkle, upper face (3 areas)", "420,000", "Nurse or doctor"],
         ["Dermal filler, per syringe", "450,000", "Doctor; nurse (basic areas)"],
         ["Bio-remodelling (Profhilo), per session", "450,000", "Nurse or doctor"],
         ["Skin boosters / mesotherapy", "250,000", "Nurse"],
         ["PDO threads (non-surgical lift)", "from 700,000", "Doctor / Dr Kpaduwa"],
         ["PRP, skin or hair (per session)", "250,000", "Nurse or doctor"],
         ["Exosomes (premium add-on)", "from 300,000", "Doctor"],
         ["IV wellness infusion", "120,000", "Nurse (doctor prescribes)"],
         ["Medical facial", "90,000", "Nurse"],
         ["Chemical peel", "120,000", "Nurse"],
         ["Microneedling / RF microneedling", "200,000", "Nurse"],
         ["Laser (per session)", "150,000", "Nurse"]],
        ["Treatment", "Indicative (NGN)", "Delivered by"],
        [FULLW - 105 - 128, 105, 128], aligns=["r", "l"]))
    el.append(PageBreak())

    # 04 Margins and consumables
    sec(el, "04", "MARGINS AND CONSUMABLES", "Where the money is, honestly.")
    el.append(Paragraph(
        "Injectables carry 50 to 70 percent gross margin at proper pricing (consumables 30 to 40 "
        "percent of the fee). The regenerative layer is even better on margin; bio-remodelling is the "
        "exception because the product itself is expensive.", P))
    el.append(grid(
        [["Anti-wrinkle (toxin)", "Low per area", "About 70% or better"],
         ["Dermal filler", "About 150,000 to 200,000 / syringe", "About 55 to 65%"],
         ["Bio-remodelling (Profhilo)", "About 286,000 / syringe (pricey)", "About 40%, protect the price"],
         ["PRP", "About 33,000 / treatment", "Very high, 80% or better"],
         ["Skin, peels, facials", "Low", "High"]],
        ["Line", "Indicative consumable cost", "Gross margin"],
        [150, FULLW - 150 - 130, 130], aligns=["l", "l"]))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "These are gross margins before staff, power and overhead. Consumables are imported, so landed "
        "cost carries FX and lead time, order early and price with a buffer. The net margin in a "
        "diesel-powered Lekki clinic is lower than the gross and is what the pilot financials track.", SMALL))
    el.append(PageBreak())

    # 05 Membership
    sec(el, "05", "MEMBERSHIP (OPTIONAL FOR THE PILOT)", "A light way to seed repeat behaviour.")
    el.append(Paragraph(
        "Premium aesthetics elsewhere runs tiered memberships (roughly at 70 to 80 percent of retail, "
        "with a 10 to 25 percent member discount, protecting a 40 percent minimum margin). For the "
        "pilot, keep it to one simple tier to test appetite, not a full programme.", P))
    el.append(bullet("<b>A founders' membership:</b> a modest annual fee for a member discount, priority booking, and a complimentary facial or skin review. Optional, and easy to switch off."))
    el.append(bullet("The point during the pilot is to learn whether members return on a cycle, not to build the full three-tier structure yet."))
    el.append(PageBreak())

    # 06 Training and credentialing
    sec(el, "06", "TRAINING AND CREDENTIALING", "Two tiers, credentialed to a real standard.")
    el.append(Paragraph(
        "This is how the service runs safely to Dr Kpaduwa's standard while she is away. She trains "
        "and credentials a two-tier clinical team, doctor and nurse, against a recognised competency "
        "milestone, and signs off each tier before independent delivery.", LEDE))
    el.append(grid(
        [["Doctor (on-site clinical anchor)", "Advanced filler, threads, cannula work, regenerative procedures, prescribing, and first-line complication management. The accountable clinician when Dr Kpaduwa is abroad.", "Full credentialing + complication management"],
         ["Nurse (core delivery)", "Anti-wrinkle, basic filler, skin boosters, PRP, and the skin treatments (peels, microneedling, facials, laser), all under protocol.", "The 10 + 10 milestone per injectable modality"]],
        ["Tier", "Delivers", "Signed off to"],
        [122, FULLW - 122 - 118, 118]))
    el.append(Spacer(1, 4))
    el.append(Paragraph("The competency milestone (recognised standard)", CAP))
    el.append(bullet("Per the JCCP / CPSA competency framework, each injector logs a minimum of <b>10 observed plus 10 supervised cases per modality</b> (toxin and filler counted separately) before independent practice. Dr Kpaduwa observes, supervises and signs off."))
    el.append(bullet("Written protocols and a tiered scope define exactly what each tier does solo versus what waits for the doctor or for Dr Kpaduwa's visits."))
    el.append(bullet("Delivered in the next two weeks while she is resident, front-loaded before her maternity, then maintained on tele-supervision and audited on her visits."))
    el.append(PageBreak())

    # 07 Safety governance
    sec(el, "07", "SAFETY GOVERNANCE", "Why the doctor is not optional.")
    el.append(Paragraph(
        "The research is unambiguous on one point: a lead who is abroad cannot be the accountable "
        "prescriber. Hyaluronidase, the drug that reverses a filler emergency, is prescription-only, "
        "and remote prescribing for elective cosmetic work is not acceptable practice. So a resident "
        "doctor who can prescribe and manage complications is the safety backbone that makes the whole "
        "delegated model legal and safe. That is the real reason the doctor tier exists.", LEDE))
    el.append(Paragraph("The backbone the clinic must have", CAP))
    el.append(bullet("<b>An accountable on-call prescriber on the ground</b> (the resident doctor), reachable within a defined timescale. Tele-support from Dr Kpaduwa is for oversight and complex cases, not for prescribing or emergencies."))
    el.append(bullet("<b>Hyaluronidase stocked on site at all times</b>, with a documented vascular-occlusion protocol: high-dose pulsed hyaluronidase (about 1,500 units over the affected artery), re-dosed every 15 to 20 minutes on capillary-refill reassessment."))
    el.append(bullet("<b>An anaphylaxis kit and written emergency protocols</b>, with defined escalation and supervisor-contact timescales, drilled with the team."))
    el.append(bullet("<b>Audit and review:</b> Dr Kpaduwa reviews cases remotely and on her visits; competency is re-checked, not assumed."))
    el.append(PageBreak())

    # 08 Nigeria: to confirm
    sec(el, "08", "NIGERIA: WHAT TO CONFIRM BEFORE LAUNCH", "The honest gaps.")
    el.append(Paragraph(
        "The benchmarks and standards above are drawn from Dubai, South Africa, the US and UK best "
        "practice; there is little reliable public Lagos-specific data, so a few things must be "
        "confirmed locally before the price list and the model are final. These are quick to close and "
        "worth closing properly.", P))
    el.append(bullet("<b>Who may legally inject</b> in Nigeria, and the role and registration of the prescriber (MDCN, NMCN)."))
    el.append(bullet("<b>Import and product registration</b> (NAFDAC) for toxin, fillers, hyaluronidase and exosomes, this affects lead time and cost."))
    el.append(bullet("<b>The prescriber question:</b> whether Dr Kpaduwa can be the accountable prescriber from abroad, or a locally-registered doctor must hold and authorise hyaluronidase, this likely confirms the resident-doctor requirement."))
    el.append(bullet("<b>Local pricing and willingness to pay:</b> validate the list against one or two Lagos competitors and the Medlyfe base."))
    el.append(PageBreak())

    # 09 Next steps
    sec(el, "09", "NEXT STEPS", "The two-week training and set-up sprint.")
    for line in [
        "Confirm the launch menu and the price list against the Medlyfe list and Dr Kpaduwa's view.",
        "Assign the resident doctor and the nurse, and start the observed-and-supervised training now, before the maternity break.",
        "Write the protocols and the emergency and vascular-occlusion pack; stock hyaluronidase and the anaphylaxis kit.",
        "Order the imported consumables early, and confirm the Nigerian regulatory points.",
    ]:
        el.append(bullet(line))
    el.append(Spacer(1, 8))
    el.append(card(
        "<b>Consult for Africa</b> &nbsp; Structuring and operating partner<br/>"
        "hello@consultforafrica.com &nbsp; / &nbsp; +234 913 813 8553 &nbsp; / &nbsp; consultforafrica.com",
        bg=NAVY, fg=white))
    el.append(Spacer(1, 5))
    el.append(Paragraph(
        "Pricing is benchmark-derived (Dubai, South Africa, US) converted at about NGN 1,500 per USD "
        "(mid-2026); refresh before publishing. Competency and safety standards follow the JCCP / CPSA "
        "framework and the CMAC hyaluronidase guideline as best-practice proxies, to be aligned with "
        "Nigerian regulation. Draft for Dr Itunu Akinware. Prepared by Consult for Africa.", SMALL))

    doc.build(el)
    print(f"wrote {OUT}")


if __name__ == "__main__":
    build()
