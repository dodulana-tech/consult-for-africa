"""
Build the Medlyfe Regenerative Aesthetics PILOT pack (July -> November),
following the 2026-07-14 three-party meeting where the parties chose to run a
light pilot before deciding on a standalone SPV.

Two PDFs, CFA house style (C4A is the structuring/operating partner):
  1. Pilot Heads of Terms  -> the light July-Nov collaboration framework
  2. Pilot Operating Model & Launch Plan -> service, pricing, team + training,
     consumables, tests, marketing, positioning of Dr Chinwe, KPIs, post-Nov.

Pilot facts: runs under Medbury's Medlyfe Wellness brand (Regenerative
Aesthetics), at the iFitness Admiralty clinic, non-surgical only, with Dr Chinwe
Kpaduwa as a visiting/advisory credibility anchor. Structured so the service
continues via a trained local team if she cannot continue. Benchmark figures for
tuning. NGN. No em dashes.

Run:
  python3 scripts/build-medlyfe-pilot-pack.py
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

# ---- CFA house palette ----
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
ss = getSampleStyleSheet()


def style(name, **kw):
    base = dict(fontName="Helvetica", fontSize=10.5, leading=15.5, textColor=BODY,
                alignment=TA_LEFT, spaceAfter=7)
    base.update(kw)
    return ParagraphStyle(name, **base)


EYEBROW = style("eyebrow", fontName="Helvetica-Bold", fontSize=9, leading=12, textColor=GOLD, spaceAfter=3)
H1 = style("h1", fontName="Helvetica-Bold", fontSize=15, leading=19, textColor=NAVY, spaceBefore=10, spaceAfter=7)
H2 = style("h2", fontName="Helvetica-Bold", fontSize=11.5, leading=15, textColor=TEAL, spaceBefore=8, spaceAfter=4)
P = style("p")
LEDE = style("lede", fontSize=11, leading=16.5, textColor=HexColor("#374151"))
SMALL = style("small", fontSize=8.5, leading=12, textColor=MUTED)
CAP = style("cap", fontName="Helvetica-Bold", fontSize=8.5, leading=11, textColor=TEAL, spaceBefore=2, spaceAfter=3)
CELL = style("cell", fontSize=9.5, leading=12.5)
CELL_R = style("cellr", fontSize=9.5, leading=12.5, alignment=2)
CELL_B = style("cellb", fontSize=9.5, leading=12.5, fontName="Helvetica-Bold", textColor=NAVY)
CELL_BR = style("cellbr", fontSize=9.5, leading=12.5, fontName="Helvetica-Bold", textColor=NAVY, alignment=2)
CELL_W = style("cellw", fontSize=9.5, leading=12.5, fontName="Helvetica-Bold", textColor=white)
CELL_WR = style("cellwr", fontSize=9.5, leading=12.5, fontName="Helvetica-Bold", textColor=white, alignment=2)


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


def grid(rows, heads, widths, total_rows=None, aligns=None):
    total_rows = total_rows or set()
    if aligns is None:
        aligns = ["l"] * (len(heads) - 1)
    data = [[Paragraph(heads[0], CELL_W)] + [Paragraph(h, CELL_WR if aligns[j] == "r" else CELL_W) for j, h in enumerate(heads[1:])]]
    for i, r in enumerate(rows):
        emph = i in total_rows
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
        ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 9), ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, SURFACE]),
    ]
    for i in total_rows:
        stl.append(("BACKGROUND", (0, i + 1), (-1, i + 1), CREAM))
        stl.append(("LINEABOVE", (0, i + 1), (-1, i + 1), 1.0, GOLD))
    t.setStyle(TableStyle(stl))
    return t


def sec(el, num, eyebrow, title):
    el.append(Paragraph(num + "  /  " + eyebrow, EYEBROW))
    el.append(Paragraph(title, H1))


def cover_story(title, subtitle, status):
    el = [Spacer(1, 34)]
    el.append(Paragraph("THE AESTHETICS PILOT  /  MEDLYFE WELLNESS x KP x C4A",
                        ParagraphStyle("ce", fontName="Helvetica-Bold", fontSize=9.5, leading=13, textColor=GOLD, spaceAfter=12)))
    el.append(Paragraph(title, ParagraphStyle("ct", fontName="Helvetica-Bold", fontSize=24, leading=30, textColor=white)))
    el.append(Spacer(1, 14))
    el.append(Paragraph(subtitle, ParagraphStyle("cs", fontName="Helvetica-Bold", fontSize=12.5, leading=17, textColor=GOLD)))
    el.append(Spacer(1, 26))
    for lb, v in [("PREPARED FOR", "Dr Itunu Akinware (Medlyfe Wellness / Medbury) and Dr Chinwe Kpaduwa"),
                  ("BY", "Consult for Africa"),
                  ("PERIOD", "Pilot: July to November 2026"),
                  ("STATUS", status)]:
        el.append(Paragraph(lb, ParagraphStyle("clbl", fontName="Helvetica-Bold", fontSize=8, leading=11, textColor=GOLD, spaceBefore=8, spaceAfter=1)))
        el.append(Paragraph(v, ParagraphStyle("cval", fontName="Helvetica", fontSize=10.5, leading=14, textColor=white)))
    el.append(NextPageTemplate("content"))
    el.append(PageBreak())
    return el


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
        c.drawString(MARGIN, 18, "Private and confidential  /  The Aesthetics Pilot")
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
        PageTemplate(id="cover", frames=[Frame(MARGIN, 150, FULLW, PAGE_H - 300, id="cover")], onPage=cover_bg),
        PageTemplate(id="content", frames=[Frame(MARGIN, 42, FULLW, PAGE_H - 52 - 42, id="content")], onPage=content_bg),
    ])
    doc.build(story)
    print(f"wrote {OUT}")


def contact(el):
    el.append(Spacer(1, 10))
    el.append(card(
        "<b>Consult for Africa</b> &nbsp; Structuring and operating partner<br/>"
        "hello@consultforafrica.com &nbsp; / &nbsp; +234 913 813 8553 &nbsp; / &nbsp; consultforafrica.com",
        bg=NAVY, fg=white))


# ================================================================ DOC 1: HEADS OF TERMS
def heads_of_terms():
    el = cover_story(
        "The Aesthetics Pilot",
        "A light July to November collaboration, before we decide on anything bigger.",
        "Heads of terms  /  Draft for discussion")

    sec(el, "01", "THE PILOT IN ONE LINE", "Test it together, keep it light.")
    el.append(Paragraph(
        "From July to November, Dr Chinwe Kpaduwa runs a premium non-surgical aesthetics service "
        "inside Medbury's Medlyfe Wellness brand, at the iFitness Admiralty clinic, with Consult for "
        "Africa structuring and running the operation. No standalone company, no capital commitment, "
        "no long tie-in. The pilot exists to answer one question: does this work, commercially and "
        "between us, well enough to build something bigger after November.", LEDE))
    el.append(card(
        "The spirit of it: we start where we are, on infrastructure Medbury already has, and we test "
        "each other. Everyone keeps their freedom until November; everyone builds real evidence "
        "before anyone commits capital.", bg=PANEL))
    el.append(Spacer(1, 4))
    el.append(card(
        "And the spirit beyond the terms: this is a partnership of support. Dr Kpaduwa brings rare "
        "talent through a season of real growth, a new practice and a new family arriving at once. "
        "Medlyfe brings the experience, the platform and the backing to help her thrive. Held with "
        "care, that support is what turns a four-month pilot into a partnership that lasts.", bg=SURFACE))
    el.append(PageBreak())

    sec(el, "02", "THE PARTIES AND WHAT EACH BRINGS", "Three roles, no one overcommitted.")
    el.append(grid(
        [["Medlyfe Wellness (Medbury)", "The venue, the Medlyfe brand and Regenerative Aesthetics service line, the existing patient and corporate base, and the local team."],
         ["Dr Chinwe Kpaduwa", "The clinical standard: protocols, training and credentialing of the team, and hands-on delivery of signature treatments while resident and on visits."],
         ["Consult for Africa", "Structures the arrangement, stands up the operating model, trains and supports the team, and runs the day-to-day and the marketing."]],
        ["Party", "What they bring to the pilot"],
        [150, FULLW - 150]))
    el.append(PageBreak())

    sec(el, "03", "HOW DR CHINWE IS INTRODUCED", "Credible to patients, light in commitment.")
    el.append(Paragraph(
        "Patients need to trust the hand behind the service, and Dr Kpaduwa's credentials are the "
        "draw. But the introduction must match the reality of a visiting arrangement, so it is honest "
        "and carries no overcommitment on either side.", P))
    el.append(bullet("<b>Title:</b> Consultant Plastic and Aesthetic Surgeon, Aesthetics Lead (Visiting), and a founding member of the Medlyfe Advisory Board."))
    el.append(bullet("<b>The story:</b> she designs the protocols and the standard, trains and credentials the clinical team, and personally delivers signature treatments during her time in Lagos, so patients get her standard continuously and her hands on her visits."))
    el.append(bullet("<b>What it avoids:</b> any claim of permanent daily presence. The visiting-plus-trained-team framing is both true and reassuring, and it protects everyone if plans change."))
    el.append(PageBreak())

    sec(el, "04", "SCOPE AND VENUE", "Non-surgical aesthetics, at the iFitness clinic.")
    el.append(Paragraph(
        "The pilot is non-surgical only, injectables, skin, and regenerative aesthetics, delivered "
        "under the Medlyfe Regenerative Aesthetics service. Surgery is out of scope for the pilot; it "
        "belongs to the post-November conversation. The venue is Medbury's existing aesthetic clinic "
        "at iFitness, Admiralty, Lekki, a decent, ready space that lets us start without a build.", P))
    el.append(card(
        "Debo's longer-term preference is a dedicated address that channels its own footfall; for the "
        "pilot, the iFitness clinic is the right, low-fidelity starting point, and it keeps the test "
        "cheap.", bg=SURFACE))
    el.append(PageBreak())

    sec(el, "05", "COMMITMENT AND AVAILABILITY", "Honest about the diary, covered in the contract.")
    el.append(Paragraph(
        "Dr Kpaduwa is in Nigeria through November and, thereafter, has committed to returning "
        "roughly every three months. The clinical standard is hers; the frequency of her visits will, "
        "in practice, follow the patient pool. Because life is unpredictable, the arrangement is "
        "written so the service does not depend on her being in the building on any given day.", P))
    el.append(bullet("Her presence is scheduled in blocks around demand, and her visit cadence is captured in the terms rather than left to goodwill."))
    el.append(bullet("Between visits, the trained local team delivers the core menu to her protocols, with her on tele-support for complex cases."))
    el.append(PageBreak())

    sec(el, "06", "CONTINUITY", "The service must stand on its own. This is the point.")
    el.append(Paragraph(
        "This is the term that matters most to Medbury, and it is right. The pilot is built so that if "
        "Dr Kpaduwa cannot continue, for any reason, the service continues without disruption. We are "
        "building a capability, not building around a person.", LEDE))
    el.append(bullet("<b>The team is trained and credentialed</b> to deliver the core service independently, so capability lives in the clinic, not only in one diary."))
    el.append(bullet("<b>Medlyfe owns the brand, the systems, the patient data and the protocols.</b> They stay with Medbury regardless of what any individual decides."))
    el.append(bullet("<b>No single point of failure.</b> If she steps back, Medlyfe continues the service internally with the team already trained; nothing collapses."))
    el.append(PageBreak())

    sec(el, "07", "ECONOMICS OF THE PILOT", "Light, revenue-based, no capital at risk.")
    el.append(Paragraph(
        "No one puts in capital for the pilot. Medlyfe provides the venue, the brand and the team; C4A "
        "runs it; Dr Kpaduwa earns from the clinical work she and her protocols generate. The simplest "
        "fair shape is a share of the aesthetics revenue, split between the clinical draw, the "
        "operating cost, and the platform, with the exact percentages set before launch and reviewed "
        "at November.", P))
    el.append(card(
        "Deliberately simple: revenue in, shared three ways by role, no capital, no debt, no lock-in. "
        "The heavier economics, capital, fees and equity, belong to the post-November SPV, not here.", bg=PANEL))
    el.append(PageBreak())

    sec(el, "08", "THE NOVEMBER REVIEW", "A clear gate, and the path beyond it.")
    el.append(Paragraph(
        "In November the three parties review the evidence, demand, delivery, unit economics, and how "
        "well we have worked together, and choose one of two paths.", P))
    el.append(grid(
        [["If it works", "Form a standalone SPV, a Medical Aesthetics and Plastic Surgery Centre, which also provides the aesthetics service to Medlyfe under an outsourcing arrangement (so there is continuity and no conflict of interest). Dr Kpaduwa co-invests capital; the fuller structure, capital, fees, equity and protections, is settled then."],
         ["If it does not", "Medlyfe continues the aesthetics service internally with the trained team, under its own brand. Nothing is stranded, and the relationship stays open."]],
        ["Path", "What happens"],
        [110, FULLW - 110]))
    el.append(PageBreak())

    sec(el, "09", "IF PLANS CHANGE", "A graceful exit for everyone.")
    el.append(Paragraph(
        "If Dr Kpaduwa cannot continue, whether through relocation, family, or simply choosing not to, "
        "the pilot ends cleanly: the service continues under Medlyfe with the trained team, the brand "
        "and data remain Medlyfe's, and each party walks away without loss or claim on the other. A "
        "short confidentiality and non-solicitation understanding protects everyone during and just "
        "after the pilot. No one is trapped, and no one is left exposed.", P))
    el.append(PageBreak())

    sec(el, "10", "NEXT STEPS", "Small, fast, this week.")
    for line in [
        "Confirm these heads of terms and the pilot revenue split.",
        "Debo views the iFitness Admiralty clinic and signs off the space.",
        "C4A finalises the operating model and launch plan (the companion document).",
        "Introduce Dr Kpaduwa under the agreed title, train the team, and soft-launch to the Medlyfe and Medbury base.",
    ]:
        el.append(bullet(line))
    contact(el)
    el.append(Spacer(1, 6))
    el.append(Paragraph(
        "Draft heads of terms for discussion between Dr Itunu Akinware, Dr Chinwe Kpaduwa and Consult "
        "for Africa. Not a binding agreement; terms to be confirmed in writing.", SMALL))

    build_one("medlyfe-aesthetics-pilot-heads-of-terms-cfa.pdf", "Pilot  /  Heads of Terms", el)


# ================================================================ DOC 2: OPERATING MODEL & LAUNCH PLAN
def operating_model():
    el = cover_story(
        "The Aesthetics Pilot",
        "Operating model and launch plan, July to November.",
        "Operating model  /  Benchmark figures for tuning")

    sec(el, "01", "THE GOAL, AND HOW WE MEASURE IT", "What November has to prove.")
    el.append(Paragraph(
        "The pilot succeeds if, by November, four things are true: real demand exists at premium "
        "prices; the local team can deliver to Dr Kpaduwa's standard without her in the room every "
        "day; the working relationship is reliable and easy; and the unit economics justify a "
        "standalone build. Everything below is designed to produce that evidence.", LEDE))
    el.append(grid(
        [["Demand", "Leads, bookings and revenue against a monthly target; enquiry-to-treatment conversion."],
         ["Delivery", "Treatments delivered by the trained team to protocol; complication and redo rates; patient satisfaction (NPS)."],
         ["Economics", "Revenue per treatment, cost of consumables, contribution per month, repeat-visit rate."],
         ["Relationship", "Reliability of visits and tele-support, quality of the collaboration, patient feedback on Dr Kpaduwa."]],
        ["What we test", "How we measure it"],
        [120, FULLW - 120]))
    el.append(PageBreak())

    sec(el, "02", "THE SERVICE PROFILE", "Non-surgical, regenerative, premium.")
    el.append(Paragraph(
        "A focused menu of high-frequency, high-margin non-surgical treatments, grouped into three "
        "lines. Deep enough to be a real service, tight enough to run well in a small clinic.", P))
    el.append(Paragraph("Injectables", H2))
    el.append(bullet("Anti-wrinkle (botulinum toxin), dermal fillers, bio-remodelling (e.g. Profhilo), skin boosters, PDO threads."))
    el.append(Paragraph("Skin and regenerative", H2))
    el.append(bullet("Medical facials, chemical peels, microneedling and RF microneedling, PRP for skin and hair, mesotherapy, laser (skin, pigment, hair)."))
    el.append(Paragraph("Wellness and regenerative add-on", H2))
    el.append(bullet("IV vitamin and wellness infusions, and an optional regenerative wellness screen that ties the aesthetics to Medlyfe's wellness positioning and creates an easy upsell."))
    el.append(PageBreak())

    sec(el, "03", "PRICING", "Premium Lagos benchmarks, to tune.")
    el.append(Paragraph(
        "Indicative price points for the launch menu. Premium but not silly; positioned above mass "
        "clinics and below fly-in-only pricing. Tune against the Medlyfe list and Dr Kpaduwa's view.", P))
    el.append(grid(
        [["Aesthetic consultation", "Assessment, skin analysis, plan", "30,000 to 50,000"],
         ["Anti-wrinkle (per area / full)", "Botulinum toxin", "150,000 to 350,000"],
         ["Dermal filler (per syringe)", "Hyaluronic acid", "350,000 to 600,000"],
         ["Bio-remodelling / skin boosters", "Profhilo and similar", "200,000 to 400,000"],
         ["PDO threads", "Non-surgical lift", "400,000 to 1,000,000"],
         ["Chemical peel / medical facial", "Skin health", "60,000 to 180,000"],
         ["Microneedling / RF microneedling", "Skin and texture", "120,000 to 300,000"],
         ["PRP (skin or hair)", "Regenerative", "200,000 to 400,000"],
         ["Laser (per session)", "Pigment, skin, hair", "80,000 to 250,000"],
         ["IV wellness infusion", "Regenerative add-on", "50,000 to 150,000"]],
        ["Service", "What it is", "Indicative (NGN)"],
        [168, FULLW - 168 - 118, 118], aligns=["l", "r"]))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "A small introductory-member tier (a modest annual fee for discounted rates and priority "
        "booking) can be tested during the pilot to seed repeat behaviour, but it is optional.", SMALL))
    el.append(PageBreak())

    sec(el, "04", "THE PATIENT JOURNEY", "One standard, every visit.")
    el.append(Paragraph(
        "The experience is the product. A single, repeatable journey, run on HospitlOS for booking, "
        "records and follow-up, so it feels the same whether Dr Kpaduwa is in Lagos or not.", P))
    for h, t in [
        ("Enquire and book", "Instagram, referral or the Medlyfe base into an online booking; a coordinator confirms and pre-screens."),
        ("Consult and assess", "Skin analysis, medical history, photographs (consented), and a written plan and quote. Complex cases are scheduled to Dr Kpaduwa's visits."),
        ("Treat", "Core treatments by the trained team to protocol; signature and advanced treatments by Dr Kpaduwa on her visits."),
        ("Follow up and retain", "Structured aftercare, a review appointment, a recall cycle, and a retail skincare regimen."),
    ]:
        el.append(Paragraph("<b>" + h + ".</b>&nbsp; " + t, P))
    el.append(PageBreak())

    sec(el, "05", "THE TEAM AND THE TRAINING", "Build the capability into the clinic.")
    el.append(Paragraph(
        "This is how continuity is delivered in practice. Dr Kpaduwa trains and credentials a small "
        "local team while she is resident, so the service runs to her standard between visits. The "
        "clinic depends on a capability, not on one person's diary.", LEDE))
    el.append(grid(
        [["Aesthetic nurse / injector (1 to 2)", "Core injectables and skin under protocol", "Toxin, basic filler, skin boosters, PRP, complication first-response"],
         ["Aesthetician / therapist (1 to 2)", "Facials, peels, microneedling, laser, devices", "Skin protocols, device operation, aftercare"],
         ["Patient coordinator (1)", "Booking, screening, follow-up, retail", "HospitlOS, consult flow, recall"],
         ["Clinic lead / RN", "Oversight, safety, records", "Governance, emergencies, standards"]],
        ["Role", "In the pilot", "Trained and signed off on"],
        [140, 150, FULLW - 290]))
    el.append(Spacer(1, 5))
    el.append(Paragraph("The training and credentialing plan", CAP))
    el.append(bullet("Dr Kpaduwa builds the SOPs and treatment protocols, and a tiered competency framework: what the team does solo versus what waits for her visits."))
    el.append(bullet("Hands-on training and supervised practice while resident, then a formal competency sign-off before independent delivery."))
    el.append(bullet("Complication management drilled: hyaluronidase for filler, anaphylaxis and emergency protocols, escalation to Dr Kpaduwa on tele-support."))
    el.append(bullet("C4A owns the curriculum, the SOP library and the credentialing records, so the capability is documented and portable."))
    el.append(PageBreak())

    sec(el, "06", "CONSUMABLES AND EQUIPMENT", "What to stock, what to check.")
    el.append(Paragraph("Consumables to stock for the launch menu (buy to demand, keep the emergency kit fully stocked at all times):", P))
    el.append(grid(
        [["Injectables", "Botulinum toxin, hyaluronic-acid fillers, bio-remodelling (Profhilo), skin boosters, PDO threads, mesotherapy cocktails"],
         ["Regenerative", "PRP tubes and kits, centrifuge, microneedling cartridges, RF tips"],
         ["Skin", "Chemical peel solutions, medical-facial and aftercare products, medical-grade retail skincare"],
         ["Disposables", "Needles, cannulas, syringes, gloves, gauze, antiseptic, couch roll, sharps bins, PPE"],
         ["Wellness", "IV fluids, vitamin and infusion kits, giving sets"],
         ["Emergency (always stocked)", "Hyaluronidase (filler reversal), adrenaline and anaphylaxis kit, topical and local anaesthetic"]],
        ["Group", "Items"],
        [130, FULLW - 130]))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "Equipment: confirm what the iFitness clinic already has (treatment couches, a laser or skin "
        "device, sterilisation, fridge for toxin and fillers). The gap list is set on Debo's site "
        "visit; a modest device top-up may be the only spend, funded from pilot cashflow, not capital.", SMALL))
    el.append(PageBreak())

    sec(el, "07", "TESTS AND INVESTIGATIONS", "Safe treatment, and a regenerative upsell.")
    el.append(Paragraph(
        "Two purposes: safety screening before treatment, and a wellness screen that supports the "
        "regenerative positioning and adds revenue. Bloods run through Medbury Diagnostics / Lifecheck.", P))
    el.append(bullet("<b>Safety screen:</b> full blood count and clotting (before threads and deep filler); blood-borne virus screen (HIV, hepatitis B and C) for PRP and staff safety; pregnancy test where a treatment is contraindicated."))
    el.append(bullet("<b>Regenerative wellness screen (optional, upsell):</b> vitamin D, B12, ferritin and iron studies, fasting glucose or HbA1c, lipid profile, thyroid, inflammatory markers, and hormones where indicated, packaged as a premium add-on that ties aesthetics to Medlyfe wellness."))
    el.append(bullet("<b>At the chair:</b> device-based skin analysis at every consultation, to anchor the plan and track progress."))
    el.append(PageBreak())

    sec(el, "08", "THE MARKETING PLAN", "Medically led, credibility first.")
    el.append(Paragraph(
        "Aesthetics is sold on trust and on results. The plan leads with medical credibility, Dr "
        "Kpaduwa as the anchor, and converts the audiences Medbury already owns before spending on "
        "cold reach.", P))
    el.append(grid(
        [["Positioning", "Premium, medically-led regenerative aesthetics under Medlyfe, with a US-trained plastic surgeon behind the standard."],
         ["Owned audiences first", "The Medlyfe patient base and Medbury's 785 corporate clients, warmed by email, in-clinic and a corporate wellness tie-in."],
         ["Social", "Instagram-led: consented before-and-afters, education, and Dr Kpaduwa features while she is resident. Targeted Lagos ads."],
         ["Referral and events", "A launch event, practitioner and concierge referrals, and influencer or testimonial seeding."],
         ["Retention", "Recall cycles, membership trial, and a retail skincare regimen that keeps patients on a schedule."]],
        ["Lever", "What we do"],
        [120, FULLW - 120]))
    el.append(Spacer(1, 5))
    el.append(Paragraph("Launch calendar", CAP))
    el.append(grid(
        [["July", "Set up, train and credential the team, brand and content ready, soft launch to the warm base"],
         ["August to September", "Full launch, campaigns live, Dr Kpaduwa resident and featured, build the diary"],
         ["October", "Push repeat and referral, membership trial, gather the evidence"],
         ["November", "Review against target, decide the standalone path"]],
        ["When", "Focus"],
        [130, FULLW - 130]))
    el.append(PageBreak())

    sec(el, "09", "POSITIONING DR CHINWE", "Wanted, credible, and honestly framed.")
    el.append(Paragraph(
        "She should feel wanted, not auditioned, and patients should feel they are in expert hands. "
        "The framing does both, and stays true to a visiting arrangement.", P))
    el.append(bullet("<b>Public title:</b> Consultant Plastic and Aesthetic Surgeon and Aesthetics Lead (Visiting), Medlyfe Regenerative Aesthetics; founding member of the Medlyfe Advisory Board."))
    el.append(bullet("<b>The narrative:</b> she sets the standard, trains the team and delivers signature treatments in Lagos, so patients get her standard always and her hands on her visits."))
    el.append(bullet("<b>Internally:</b> treat her as a partner being courted, not a hire on trial. Warmth now earns the commitment later."))
    el.append(PageBreak())

    sec(el, "10", "AFTER NOVEMBER", "What the standalone would need.")
    el.append(Paragraph(
        "If the pilot clears the gate, the standalone SPV, a Medical Aesthetics and Plastic Surgery "
        "Centre, is the next build, with Dr Kpaduwa co-investing. That is where capital, a dedicated "
        "premium venue, a theatre partner for surgery, and the fuller commercial structure come back "
        "onto the table. The pilot's numbers become the assumptions for that model, replacing today's "
        "benchmarks with evidence.", P))
    el.append(card(
        "The pilot is the cheapest possible way to earn the right to build the bigger thing, and to "
        "know it will work before anyone risks capital. That is exactly what these four months are for.", bg=PANEL))
    contact(el)
    el.append(Spacer(1, 6))
    el.append(Paragraph(
        "Benchmark operating figures for discussion, to be firmed against the iFitness clinic, the "
        "Medlyfe service and Dr Kpaduwa's clinical view. Prepared by Consult for Africa.", SMALL))

    build_one("medlyfe-aesthetics-pilot-operating-model-cfa.pdf", "Pilot  /  Operating Model", el)


if __name__ == "__main__":
    heads_of_terms()
    operating_model()
