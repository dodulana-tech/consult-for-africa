"""
Build "Medlyfe Aesthetics - Target Operating Model" for BOTH founding partners,
Dr Chinwe Kpaduwa (KP Plastics) and Dr Itunu Akinware (Medbury Healthcare Group),
with C4A as operating partner.

Comprehensive, richly-fleshed, flowing (no per-section page breaks). Spine: build
Medlyfe Aesthetics into a premium aesthetics and cosmetic surgery INSTITUTION under
Dr Kpaduwa's standard, director-led and team-delivered. Includes the surgical
pathway (partner theatres + privileges), Dr Kpaduwa's Nigerian licensing, a full
What C4A Delivers section, an equipment/clinic section (to her specification), and
a detailed go-to-market and marketing plan. Written to read comfortably for both
principals: celebratory of Dr Kpaduwa's leadership, substantive for Dr Akinware,
no personal circumstances, nothing framing anyone as a risk. CFA house style. NGN.
No em dashes.

Run:
  python3 scripts/build-medlyfe-pilot-tom.py
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
OUT = DOCS / "medlyfe-aesthetics-pilot-tom-cfa.pdf"

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
    base = dict(fontName="Helvetica", fontSize=10.5, leading=15.5, textColor=BODY, alignment=TA_LEFT, spaceAfter=7)
    base.update(kw)
    return ParagraphStyle(name, **base)


EYEBROW = style("eyebrow", fontName="Helvetica-Bold", fontSize=9, leading=12, textColor=GOLD, spaceBefore=6, spaceAfter=3)
H1 = style("h1", fontName="Helvetica-Bold", fontSize=14.5, leading=18, textColor=NAVY, spaceAfter=6)
H2 = style("h2", fontName="Helvetica-Bold", fontSize=10.8, leading=14, textColor=TEAL, spaceBefore=7, spaceAfter=3)
P = style("p")
LEDE = style("lede", fontSize=11, leading=16.5, textColor=HexColor("#374151"))
SMALL = style("small", fontSize=8.5, leading=12, textColor=MUTED)
CAP = style("cap", fontName="Helvetica-Bold", fontSize=8.5, leading=11, textColor=TEAL, spaceBefore=5, spaceAfter=3)
CELL = style("cell", fontSize=9, leading=12)
CELL_B = style("cellb", fontSize=9, leading=12, fontName="Helvetica-Bold", textColor=NAVY)
CELL_W = style("cellw", fontSize=9, leading=12, fontName="Helvetica-Bold", textColor=white)


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
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 23, "Medlyfe Aesthetics  /  Target Operating Model")
    c.setFillColor(GOLD); c.rect(MARGIN, 30, 24, 2, fill=1, stroke=0)
    c.setFillColor(MUTED); c.setFont("Helvetica", 8)
    c.drawString(MARGIN, 18, "Private and confidential  /  Draft")
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


def grid(rows, heads, widths):
    data = [[Paragraph(heads[0], CELL_W)] + [Paragraph(h, CELL_W) for h in heads[1:]]]
    for r in rows:
        data.append([Paragraph(r[0], CELL_B)] + [Paragraph(v, CELL) for v in r[1:]])
    t = Table(data, colWidths=widths)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY), ("LINEBELOW", (0, 0), (-1, 0), 2, GOLD),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 8), ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, SURFACE]),
    ]))
    return t


def sec(el, num, eyebrow, title, first=False):
    if not first:
        el.append(Spacer(1, 13))
    el.append(KeepTogether([Paragraph(num + "  /  " + eyebrow, EYEBROW), Paragraph(title, H1)]))


def build():
    doc = BaseDocTemplate(str(OUT), pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN,
                          topMargin=50, bottomMargin=40, title="Medlyfe Aesthetics - Target Operating Model",
                          author="Consult for Africa")
    doc.addPageTemplates([
        PageTemplate(id="cover", frames=[Frame(MARGIN, 150, FULLW, PAGE_H - 300, id="cover")], onPage=cover_bg),
        PageTemplate(id="content", frames=[Frame(MARGIN, 40, FULLW, PAGE_H - 50 - 40, id="content")], onPage=content_bg),
    ])
    el = [Spacer(1, 34)]
    el.append(Paragraph("THE AESTHETICS PILOT  /  MEDLYFE AESTHETICS",
                        ParagraphStyle("ce", fontName="Helvetica-Bold", fontSize=9.5, leading=13, textColor=GOLD, spaceAfter=12)))
    el.append(Paragraph("Target Operating Model", ParagraphStyle("ct", fontName="Helvetica-Bold", fontSize=25, leading=30, textColor=white)))
    el.append(Spacer(1, 12))
    el.append(Paragraph("Building a premium aesthetics and cosmetic surgery institution, under Dr Kpaduwa's standard.",
                        ParagraphStyle("cs", fontName="Helvetica-Bold", fontSize=12.5, leading=17, textColor=GOLD)))
    el.append(Spacer(1, 24))
    for lb, v in [("PREPARED FOR", "Dr Chinwe Kpaduwa (KP Plastics) and Dr Itunu Akinware (Medbury Healthcare Group)"),
                  ("BY", "Consult for Africa"),
                  ("PERIOD", "Pilot: July to November 2026"),
                  ("STATUS", "Draft for discussion")]:
        el.append(Paragraph(lb, ParagraphStyle("clbl", fontName="Helvetica-Bold", fontSize=8, leading=11, textColor=GOLD, spaceBefore=7, spaceAfter=1)))
        el.append(Paragraph(v, ParagraphStyle("cval", fontName="Helvetica", fontSize=10.5, leading=14, textColor=white)))
    el.append(NextPageTemplate("content"))
    el.append(PageBreak())

    # 01 The vision
    sec(el, "01", "THE VISION", "More than a clinic.", first=True)
    el.append(Paragraph(
        "The ambition is to build Medlyfe Aesthetics into an institution: a premium aesthetics and "
        "cosmetic surgery practice and a school of practitioners, around Dr Kpaduwa's standard.", LEDE))
    el.append(Paragraph(
        "Lagos has a deep and growing appetite for premium aesthetic and cosmetic care, and too few "
        "places that deliver it to a genuinely high, medically-led standard. The opportunity is not "
        "another clinic. It is an institution: a name that means a standard, staffed by clinicians "
        "trained to it, that patients trust and practitioners aspire to join.", P))
    el.append(Paragraph(
        "What makes it distinctive is how it is built. It grows through Dr Kpaduwa's standard and the "
        "team who carry it, through her leadership rather than her hours, so it scales on her own terms. "
        "The next three months bring it to life, so that by November the three of us can grow it into a "
        "standalone centre with genuine conviction.", P))
    el.append(card(
        "An institution is more than a clinic. It is a standard, a team that carries it, and a pipeline "
        "that extends it, so excellent care reaches more people and the practice grows year on year.", bg=PANEL))

    # 02 The partnership
    sec(el, "02", "THE PARTNERSHIP", "Two founding partners, and an operating partner.")
    el.append(Paragraph(
        "Medlyfe Aesthetics is founded by Dr Chinwe Kpaduwa of KP Plastics and Dr Itunu Akinware of "
        "Medbury Healthcare Group. Together they build it into a sustainable and scalable institution, "
        "each bringing what the other cannot, and Consult for Africa makes it run.", P))
    el.append(Paragraph("Dr Chinwe Kpaduwa  ·  KP Plastics", H2))
    el.append(Paragraph(
        "As <b>co-founder and clinical director</b>, she builds a practice and a school of practitioners "
        "in her standard and her name. It grows through the team she trains, not the hours she puts in, "
        "so she creates something significant and lasting, with the leverage a leading surgeon wants and "
        "on her own terms. She is building an institution, not simply doing sessions.", P))
    el.append(Paragraph("Dr Itunu Akinware  ·  Medbury Healthcare Group", H2))
    el.append(Paragraph(
        "As <b>co-founder</b>, she brings the Medlyfe platform and Medbury's reach, its patients and "
        "corporate base, and its resources. Joined to Dr Kpaduwa's standard, that builds a premium "
        "institution with real depth of capability, one that grows, serves more patients, and scales to "
        "further sites over time, an asset that compounds for those who build it.", P))
    el.append(Paragraph("Consult for Africa  ·  Operating partner", H2))
    el.append(Paragraph(
        "C4A designs the model, stands up the operation, runs the day-to-day and the marketing, and "
        "carries the reporting, so the founders give their attention to the standard and the platform, "
        "not the administration. Its full remit is set out in section 05.", P))
    el.append(card(
        "Together, KP Plastics and Medbury make Medlyfe Aesthetics more than a clinic: a standard, a "
        "team that carries it, and a pipeline that extends it. That is what makes it worth building, for "
        "both.", bg=SURFACE))

    # 03 The capability engine
    sec(el, "03", "THE CAPABILITY ENGINE", "A credentialed core, and a pipeline that extends it.")
    el.append(Paragraph(
        "An institution needs more than one gifted pair of hands. It needs a standard, a team "
        "credentialed to it, and a pipeline that keeps extending it. Three components make that engine.", P))
    el.append(grid(
        [["Core clinical team", "Two to five clinicians, doctors and nurses, credentialed to Dr Kpaduwa's standard. The core of delivery."],
         ["Fellowship pipeline", "One to two early-career doctors in a structured aesthetics fellowship under her direction. The talent bench for scale."],
         ["Dr Kpaduwa, clinical director", "Sets the curriculum, protocols and standard; trains, supervises and signs off. The source of the standard the whole practice runs on."]],
        ["Component", "What it is"],
        [132, FULLW - 132]))
    el.append(Paragraph(
        "Fellows credential to a recognised competency milestone under Dr Kpaduwa, observed then "
        "supervised then independent, adding capacity as they qualify and carrying the standard onward. "
        "Trained aesthetic clinicians are scarce in Nigeria, so a structured programme under a leading "
        "surgeon is a genuine draw, and in time becomes a talent engine the whole institution is built on.", P))
    el.append(card(
        "The fellowship is what turns a practice into an institution: a growing community of "
        "practitioners carrying the standard, and an asset in its own right.", bg=PANEL))

    # 04 The clinical model
    sec(el, "04", "THE CLINICAL MODEL", "Director-led, team-delivered.")
    el.append(Paragraph(
        "Dr Kpaduwa leads as co-founder and clinical director. She sets the standard, the protocols and "
        "the curriculum, trains and credentials the team, and delivers signature and complex work. The "
        "clinical team delivers the day-to-day to her standard, and she oversees and mentors it, in "
        "person and remotely. This is how the finest consultant-led practices work: the standard is set "
        "by the leader and carried by a team trained in it.", LEDE))
    el.append(bullet("<b>She defines the standard:</b> the protocols, the curriculum, and the competency each clinician is signed off against."))
    el.append(bullet("<b>The team delivers to that standard;</b> she reviews and mentors, in person and remotely, on a rhythm that suits the practice."))
    el.append(bullet("<b>Her influence reaches every patient</b> through the people she has shaped, not only those she treats herself."))
    el.append(Paragraph("The surgical pathway", H2))
    el.append(Paragraph(
        "Consultations, aesthetics and non-surgical work happen at the practice. Cosmetic surgery, Dr "
        "Kpaduwa's core discipline, is delivered at partner hospital theatres where she holds operating "
        "privileges, arranged as part of set-up. This gives patients the full aesthetics and cosmetic "
        "surgery pathway under one standard, while keeping the practice itself asset-light.", P))
    el.append(card(
        "For the patient, this shows up as consistency: the same assessment, the same standard, the same "
        "care on every visit, from clinicians trained and signed off by the same hand. That is what a "
        "premium reputation is built on, and what a single, unscalable diary can never guarantee.", bg=SURFACE))

    # 05 What C4A delivers
    sec(el, "05", "WHAT C4A DELIVERS", "The build, and the run.")
    el.append(Paragraph(
        "Consult for Africa carries the work that turns an agreement into a running institution, the "
        "setup and the day-to-day, so the founders focus on the standard and the platform.", P))
    el.append(grid(
        [["Structuring and legal", "The JV structure, the shareholder and commercial agreements, and company incorporation."],
         ["Registrations and licensing", "Formal facility registrations, and Dr Kpaduwa's Nigerian practice licence, temporary and, in time, permanent."],
         ["Surgical sites and privileges", "Securing partner hospital theatres for surgical cases and arranging Dr Kpaduwa's operating privileges."],
         ["Equipment and supply", "Sourcing, procuring and installing the equipment and consumables to Dr Kpaduwa's specification, and managing lead times."],
         ["Recruitment", "Identifying and vetting the clinical team and the fellows, from within Medbury and externally."],
         ["Technology", "Standing up HospitlOS for booking, records, billing and reporting."],
         ["Marketing", "Building the brand, executing the go-to-market plan, and driving inbound enquiries."],
         ["Operations", "Running the day-to-day, the supply chain, the reporting and the monthly reviews."]],
        ["Workstream", "What it covers"],
        [150, FULLW - 150]))
    el.append(card(
        "C4A carries the build and the run, so the practice opens on time and to standard, and the "
        "founders are freed to lead.", bg=PANEL))

    # 06 Equipment and the clinic
    sec(el, "06", "EQUIPMENT AND THE CLINIC", "To Dr Kpaduwa's plastic-surgery standard.")
    el.append(Paragraph(
        "The equipment specification is Dr Kpaduwa's, to plastic-surgery standard. It divides in two: "
        "the clinic itself, which the pilot fits out for consultation, aesthetics and minor procedures, "
        "and the surgical instrument set she uses for cosmetic surgery at the partner theatre, where the "
        "theatre, anaesthesia and recovery are the hospital's. C4A sources, procures and installs to her "
        "list, starting with the long-lead and imported items.", P))
    el.append(grid(
        [["Reception and consultation", "Reception and records, patient seating, and a consultation room with digital imaging and a privacy-screened workstation."],
         ["Exam room", "Power exam table, exam lamp, scale and body-composition, and diagnostic instruments (blood pressure, pulse oximetry, thermometry, Woods lamp)."],
         ["Aesthetic room", "Treatment couch and adjustable stool, magnifying light, injectables station, skin and energy-based devices and digital imaging; laser and eye protection added as demand builds."],
         ["Minor procedure and recovery", "Minor-procedure setup and a recovery recliner, with the emergency essentials: crash cart and oxygen, AED, vital-signs monitor and anaphylaxis kit."],
         ["Sterilisation and utility", "Autoclave with printer, ultrasonic cleaner and instrument care, and clean and dirty utility with biohazard and sharps management."],
         ["Surgical instrument set", "Dr Kpaduwa's general plastics set, retractors, scissors, clamps, forceps and needle drivers, plus liposuction cannulas, for cosmetic surgery at the partner theatre."],
         ["Consumables and supplies", "Injectables and aesthetic supplies, dressings and disposables, infection control and compression garments, and skincare for resale, stocked ahead of demand."]],
        ["Area", "What it includes"],
        [140, FULLW - 140]))
    el.append(Paragraph(
        "The item-level lists, the office set-up, the med-surg supplies and the general plastics "
        "instrument set, are held to Dr Kpaduwa's specification. Some items are imported, so C4A begins "
        "procurement early to protect the launch timeline.", SMALL))

    # 07 Go-to-market and marketing
    sec(el, "07", "GO-TO-MARKET AND MARKETING", "Credibility first, warm audiences first.")
    el.append(Paragraph(
        "Aesthetics and cosmetic care are sold on trust and on results. The plan leads every time with "
        "medical credibility, Dr Kpaduwa and the standard, and converts the audiences Medbury already "
        "owns before spending on cold reach.", P))
    el.append(Paragraph("Positioning", H2))
    el.append(Paragraph(
        "Medlyfe Aesthetics is the premium, medically-led home of aesthetics and cosmetic surgery in "
        "Lagos: clinician-delivered, surgeon-led and safety-first, for discerning patients who want "
        "genuine results from a trusted hand, not a high-street clinic. The regenerative and wellness "
        "dimension ties it naturally to the Medlyfe brand.", P))
    el.append(Paragraph("Who we speak to", H2))
    el.append(bullet("High-net-worth Lagos women and men, broadly 30 to 60, who value discretion, quality and safety."))
    el.append(bullet("The existing Medlyfe patient base and Medbury's corporate clients, the warm first channel."))
    el.append(bullet("Diaspora, referrers, and concierge and lifestyle networks."))
    el.append(Paragraph("The sequence: warm, then wide", H2))
    el.append(Paragraph(
        "We open to the people who already trust Medbury, prove the funnel, then widen it, so spend "
        "follows evidence rather than hope.", P))
    el.append(grid(
        [["Owned audiences first", "The Medlyfe list and the corporate clients, activated directly by email, in-clinic and a corporate wellness tie-in."],
         ["Social, led by credibility", "Instagram-led: consented before-and-afters, education, and Dr Kpaduwa features. The primary demand channel for aesthetics."],
         ["Referral and events", "A launch event, practitioner and concierge referrals, and testimonial seeding."],
         ["Paid, once proven", "Targeted Lagos social and search, scaled only once the funnel converts."],
         ["Retention", "Recall cycles, a membership trial, and a retail skincare regimen that keeps patients on a rhythm."]],
        ["Channel", "How we use it"],
        [140, FULLW - 140]))
    el.append(Paragraph("The launch calendar", CAP))
    el.append(grid(
        [["July", "Foundations: the brand, the story and the standard defined; content and channels prepared"],
         ["August", "Build the pipeline: warm-base activation and inbound drive; content live; enquiries built ahead of launch"],
         ["September", "Launch: campaigns live, Dr Kpaduwa featured, the pipeline converted to bookings"],
         ["October onward", "Scale and retain: referral, membership and retention; paid scaled on proven conversion"]],
        ["When", "Focus"],
        [92, FULLW - 92]))
    el.append(Paragraph(
        "We track leads and cost per lead, enquiry-to-booking conversion, revenue and average value, and "
        "repeat and referral rates, reviewed weekly so spend always follows what is working.", SMALL))
    el.append(card(
        "Every campaign leads with the surgeon and the standard, because credibility is what premium "
        "patients buy, and converts a warm audience first, because that is the fastest, cheapest path "
        "to a full diary.", bg=PANEL))

    # 08 The three months
    sec(el, "08", "THE THREE MONTHS", "From agreement to a living practice.")
    el.append(Paragraph(
        "How the next months take Medlyfe Aesthetics from agreement, to design, to a live practice, and "
        "on to the decision about the standalone.", P))
    el.append(grid(
        [["To end July", "Conclude the high-level vision, the contracts and the paperwork, including the JV establishment and the formal registrations", "Agreement, structure and registrations in place"],
         ["August", "Recruit the team, from within the Medbury group and externally; Dr Kpaduwa leads the practice design, protocols and virtual consultations, supported by C4A; the C4A and Medbury teams drive marketing and inbound enquiries", "Team, protocols and demand taking shape"],
         ["September", "The practice goes live: the team delivers to Dr Kpaduwa's standard; the first patients and the first revenue; the diary builds", "Live and delivering"],
         ["Into November", "The practice grows; review the demand, the economics and the model; decide together on the standalone", "An evidenced decision to grow"]],
        ["Period", "What we build", "The milestone"],
        [72, (FULLW - 72) * 0.58, (FULLW - 72) * 0.42]))
    el.append(card(
        "Above all, the pilot lets Dr Kpaduwa see the model work to her standard: that it grows through "
        "the team she builds, not the hours she gives, so she can create something significant here "
        "with full conviction. That confidence is the foundation the whole partnership rests on.", bg=CREAM))

    # 09 The operating model
    sec(el, "09", "THE OPERATING MODEL", "How it runs, day to day.")
    el.append(Paragraph("Delivery and the patient journey", H2))
    el.append(Paragraph(
        "The clinical team delivers the menu to Dr Kpaduwa's protocols; she delivers signature and "
        "complex work and holds the standard. Every patient follows one journey, consultation and "
        "assessment, a written plan, treatment, and structured follow-up, run on HospitlOS for booking, "
        "records and recall, so the experience feels the same wherever and whenever they come.", P))
    el.append(Paragraph("Safety and oversight", H2))
    el.append(bullet("A resident doctor holds prescribing and complication management on site, with the essential consumables and emergency inventory stocked. Good clinical governance for any injectable practice."))
    el.append(bullet("Competency sign-off before independent practice; nothing is assumed."))
    el.append(bullet("Dr Kpaduwa reviews cases and audits standards, in person and remotely; C4A runs weekly operations and a monthly review with the principals."))

    # 10 What we measure
    sec(el, "10", "WHAT WE MEASURE", "What success looks like.")
    el.append(Paragraph(
        "Progress is measured, not assumed, on four simple dimensions, reviewed every month so the "
        "picture is always current.", P))
    el.append(grid(
        [["Demand", "Bookings, revenue and repeat visits"],
         ["Quality and safety", "Outcomes, patient satisfaction, and adherence to the standard"],
         ["Capability", "The growing strength and depth of the clinical team and the fellowship"],
         ["Growth", "The trajectory toward a scalable standalone"]],
        ["What we measure", "The signal"],
        [140, FULLW - 140]))
    el.append(card(
        "A healthy, growing practice with a strong team and happy patients is the whole signal. If "
        "those are true by November, the case to build the standalone makes itself.", bg=PANEL))

    # 11 Beyond November
    sec(el, "11", "BEYOND NOVEMBER", "The bigger picture.")
    el.append(Paragraph(
        "If November says go, the standalone follows: a dedicated centre, and in time the cosmetic "
        "surgery arm that is Dr Kpaduwa's core, built on the team and the standard the pilot has already "
        "created. The team and the fellowship are exactly what such a centre is built on, so the "
        "practice is ready to grow the moment the decision is made.", P))
    el.append(Paragraph(
        "From there the fellowship becomes a permanent talent engine, for further sites, for Medlyfe's "
        "wider clinical needs, and for a reputation that compounds. Dr Kpaduwa's role as clinical "
        "director, and her standard, anchor a growing institution that carries her name.", P))
    el.append(card(
        "The pilot does not just test whether to build the standalone. It builds the foundation the "
        "standalone stands on: the standard, the people, and the evidence to back them.", bg=SURFACE))
    el.append(Spacer(1, 10))
    el.append(card(
        "<b>Consult for Africa</b> &nbsp; Structuring and operating partner<br/>"
        "hello@consultforafrica.com &nbsp; / &nbsp; +234 913 813 8553 &nbsp; / &nbsp; consultforafrica.com",
        bg=NAVY, fg=white))
    el.append(Spacer(1, 5))
    el.append(Paragraph(
        "Draft target operating model shared in confidence with Dr Chinwe Kpaduwa and Dr Itunu Akinware. "
        "The month-by-month plan, capex, working capital and financials sit in the companion execution "
        "plan. Prepared by Consult for Africa.", SMALL))

    doc.build(el)
    print(f"wrote {OUT}")


if __name__ == "__main__":
    build()
