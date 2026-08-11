"""
Build "Lyfe Place Abuja: specialists and procedure breadth" PDF.

Answers the question directly: which specialists can this facility attract, and
what breadth of procedures can each of them actually do here.

Written against the decided configuration:
  GROUND FLOOR   Alameda / Medbury Conversion Clinic SPV, 3 rooms, 54.4 sqm
                 plus imaging as campus facility (X-ray, ultrasound, echo) and
                 phlebotomy
  FIRST FLOOR    private medical plaza: 8 consulting rooms, a treatment room
                 (Playroom, 22.4 sqm) and one FUE hair transplant suite
  GUEST CHALET   Medbury Diagnostics laboratory
  BOYS' QUARTERS Medbury Pharmaceuticals
  PROPOSED       day case theatre suite, new ground-level unit on the grounds

Structural constraint carried throughout: no wall removal. Rooms are used as they
stand, subdivision is by added stud partition, light breaking for door openings only.

The three capability tiers are set by anaesthesia and recovery, not by specialty:
  TIER 1  topical or none      treatment room
  TIER 2  local infiltration   treatment room or a clean procedure space
  TIER 3  sedation or general  theatre with level trolley evacuation

Output: docs/lyfeplace-abuja/lyfeplace-abuja-specialties-cfa.pdf

House style matches the CFA repo. Naira shown as NGN. No em dashes anywhere.

Run:
  python3 scripts/build-lyfeplace-specialties.py
"""

from __future__ import annotations

from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import (
    BaseDocTemplate, Frame, PageBreak, PageTemplate, Paragraph, Spacer, Table, TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs" / "lyfeplace-abuja"
OUT = DOCS / "lyfeplace-abuja-specialties-cfa.pdf"

NAVY = HexColor("#0F3D2E")
GOLD = HexColor("#C6A15B")
TEAL = HexColor("#2F6B52")
BODY = HexColor("#23302B")
MUTED = HexColor("#7C7C74")
SURFACE = HexColor("#F5F2EA")
LIGHT = HexColor("#CBDDD1")
PANEL = HexColor("#E9F0EA")
CREAM = HexColor("#F6EFDD")
ALERT = HexColor("#FBF0E4")
RUST = HexColor("#B8763A")

PAGE_W, PAGE_H = A4
MARGIN = 42
FULLW = PAGE_W - 2 * MARGIN

ss = getSampleStyleSheet()


def style(name, **kw):
    base = dict(fontName="Helvetica", fontSize=9.0, leading=12.2, textColor=BODY,
                alignment=TA_LEFT, spaceAfter=6)
    base.update(kw)
    return ParagraphStyle(name, **base)


EYEBROW = style("eyebrow", fontName="Helvetica-Bold", fontSize=8.4, leading=11,
                textColor=GOLD, spaceAfter=2)
H1 = style("h1", fontName="Helvetica-Bold", fontSize=13.5, leading=17, textColor=NAVY,
           spaceBefore=7, spaceAfter=5)
H2 = style("h2", fontName="Helvetica-Bold", fontSize=10, leading=13, textColor=TEAL,
           spaceBefore=8, spaceAfter=3)
P = style("p")
LEDE = style("lede", fontSize=9.8, leading=14, textColor=HexColor("#374151"))
SMALL = style("small", fontSize=7.6, leading=10.2, textColor=MUTED)
CELL = style("cell", fontSize=8.0, leading=10.4)
CELL_R = style("cellr", fontSize=8.0, leading=10.4, alignment=2)
CELL_B = style("cellb", fontSize=8.0, leading=10.4, fontName="Helvetica-Bold", textColor=NAVY)
CELL_BR = style("cellbr", fontSize=8.0, leading=10.4, fontName="Helvetica-Bold",
                textColor=NAVY, alignment=2)
CELL_W = style("cellw", fontSize=8.0, leading=10.4, fontName="Helvetica-Bold", textColor=white)
CELL_WR = style("cellwr", fontSize=8.0, leading=10.4, fontName="Helvetica-Bold",
                textColor=white, alignment=2)


def page_bg(c, doc):
    c.saveState()
    c.setFillColor(NAVY)
    c.rect(0, PAGE_H - 30, PAGE_W, 30, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(0, PAGE_H - 33, PAGE_W, 3, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(MARGIN, PAGE_H - 20, "LYFE PLACE ABUJA")
    c.setFillColor(LIGHT)
    c.setFont("Helvetica", 8)
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 20, "Specialists and procedure breadth")
    c.setFillColor(GOLD)
    c.rect(MARGIN, 26, 20, 2, fill=1, stroke=0)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 7.4)
    c.drawString(MARGIN, 15, "Private and confidential  /  Prepared for Dr Itunu Akinware, Group CEO")
    c.drawRightString(PAGE_W - MARGIN, 15, "Page %d" % doc.page)
    c.restoreState()


def card(text, bg=SURFACE, fg=BODY, rule=GOLD):
    st = ParagraphStyle("c", parent=P, textColor=fg, leftIndent=6, rightIndent=6,
                        spaceBefore=2, spaceAfter=2)
    t = Table([[Paragraph(text, st)]], colWidths=[FULLW])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("LINEBEFORE", (0, 0), (0, -1), 2.5, rule),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ]))
    return t


def tbl(rows, labels, widths, total_row=False, aligns=None, hi=None):
    ncols = len(labels)
    if aligns is None:
        aligns = ["r"] * (ncols - 1)
    hi = hi or set()
    data = [[Paragraph(labels[0], CELL_W)] +
            [Paragraph(t, CELL_WR if aligns[j] == "r" else CELL_W)
             for j, t in enumerate(labels[1:])]]
    for i, r in enumerate(rows):
        emph = (total_row and i == len(rows) - 1) or i in hi
        cells = [Paragraph(r[0], CELL_B if emph else CELL)]
        for j, v in enumerate(r[1:]):
            if aligns[j] == "r":
                cells.append(Paragraph(v, CELL_BR if emph else CELL_R))
            else:
                cells.append(Paragraph(v, CELL_B if emph else CELL))
        data.append(cells)
    t = Table(data, colWidths=widths)
    st = [
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("LINEBELOW", (0, 0), (-1, 0), 1.6, GOLD),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 3.4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3.4),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("ROWBACKGROUNDS", (0, 1), (-1, -2 if total_row else -1), [white, SURFACE]),
    ]
    if total_row:
        st.append(("BACKGROUND", (0, -1), (-1, -1), CREAM))
        st.append(("LINEABOVE", (0, -1), (-1, -1), 1, GOLD))
    for i in hi:
        st.append(("BACKGROUND", (0, i + 1), (-1, i + 1), PANEL))
    t.setStyle(TableStyle(st))
    return t


def sec(el, num, eyebrow, title):
    el.append(Paragraph(num + "  /  " + eyebrow, EYEBROW))
    el.append(Paragraph(title, H1))


# ---------------------------------------------------------------- content
SURGICAL = [
    ("Plastic and aesthetic surgery",
     "Injectables, fillers, peels, lasers, HIFU, cryolipolysis, PRP, thread lifts",
     "Lesion and mole excision, earlobe repair, scar revision, upper-lid blepharoplasty, "
     "labiaplasty, small lipoma",
     "Liposuction, abdominoplasty, breast augmentation and reduction, gynaecomastia, fat "
     "transfer, facelift, rhinoplasty"),
    ("Hair restoration",
     "PRP scalp, scalp micropigmentation, mesotherapy",
     "FUE and FUT hair transplant, 6 to 10 hours, dedicated suite",
     "Not required"),
    ("General surgery",
     "Wound care, dressings",
     "Lipoma, sebaceous cyst, ingrowing toenail, lymph node biopsy, breast lump excision",
     "Inguinal and umbilical hernia, haemorrhoidectomy, pilonidal sinus, adult circumcision"),
    ("Urology",
     "Bladder scan, uroflowmetry",
     "Flexible cystoscopy, prostate biopsy under ultrasound, vasectomy",
     "Hydrocele and varicocele repair, circumcision, TURP-lite selected cases"),
    ("Ophthalmology",
     "Intravitreal injections, YAG and SLT laser, retinal imaging",
     "Chalazion, pterygium, minor lid lesions",
     "Cataract phacoemulsification, full blepharoplasty, ptosis repair"),
    ("ENT",
     "Microsuction, nasal endoscopy, audiology",
     "Nasal cautery, minor polypectomy",
     "Septoplasty, turbinate reduction, grommets, tonsillectomy in selected patients"),
    ("Orthopaedics and sports medicine",
     "Joint and soft-tissue injections, PRP, ultrasound-guided injection",
     "Ganglion excision, trigger finger release",
     "Carpal tunnel release, knee arthroscopy, removal of metalwork"),
    ("Obstetrics, gynaecology and fertility",
     "Colposcopy, IUD insertion and removal, pessary, ultrasound",
     "Endometrial biopsy, Bartholin cyst, LLETZ, hysteroscopy without sedation",
     "Hysteroscopy and polypectomy under sedation, oocyte retrieval, dilatation and curettage"),
    ("Dermatology",
     "Cryotherapy, laser, phototherapy, patch testing, dermoscopy",
     "Punch and excisional biopsy, curettage, skin cancer excision",
     "Wide local excision with flap or graft"),
    ("Vascular",
     "Duplex scanning, sclerotherapy",
     "Ambulatory phlebectomy, port and PICC insertion",
     "Endovenous laser or radiofrequency ablation of varicose veins"),
    ("Oral and maxillofacial, dental",
     "Restorative, hygiene, whitening, smile design",
     "Simple extractions, implant placement, bone grafting",
     "Surgical third molars, multiple implants under sedation"),
    ("Pain medicine",
     "Trigger point and joint injections",
     "Peripheral nerve blocks under ultrasound",
     "Epidural and facet injections, radiofrequency ablation with image guidance"),
]

NON_SURGICAL = [
    ("Cardiology", "Echo, ECG, Holter, ambulatory BP, exercise tolerance testing. Also provides "
                   "pre-operative clearance for every Tier 3 case on the campus"),
    ("Endocrinology and metabolic", "Diabetes, thyroid, obesity and GLP-1 programmes. Heaviest "
                                    "laboratory basket on the campus"),
    ("Nephrology", "Chronic kidney disease monitoring, hypertension, transplant follow-up"),
    ("Respiratory", "Spirometry, sleep screening, asthma and COPD review"),
    ("Neurology", "EEG, nerve conduction studies, headache and epilepsy clinics"),
    ("Rheumatology", "Inflammatory arthritis, biologics monitoring, joint injection in the "
                     "treatment room"),
    ("Gastroenterology", "Consultation and follow-up. Endoscopy needs a dedicated decontamination "
                         "room and is a separate future decision, not part of the theatre"),
    ("Paediatrics", "General paediatrics, growth and development, allergy. Feeds The Cloister "
                    "family membership"),
    ("Psychiatry and psychology", "Long consultations that fill the evening bands. Also provides "
                                  "body-image and bariatric psychological clearance, which surgical "
                                  "aesthetics genuinely requires"),
    ("Medical oncology and haematology", "Consultation, surveillance and survivorship. Infusion "
                                         "if Medlyfe takes first-floor rooms later"),
    ("Nutrition and dietetics", "Pre and post-surgical optimisation, weight programmes"),
    ("Physiotherapy", "Post-operative rehabilitation and lymphatic drainage after liposuction"),
]


def build():
    doc = BaseDocTemplate(
        str(OUT), pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN, topMargin=42, bottomMargin=30,
        title="Lyfe Place Abuja - Specialists and procedure breadth",
        author="Consult for Africa",
    )
    doc.addPageTemplates([PageTemplate(
        id="p", frames=[Frame(MARGIN, 30, FULLW, PAGE_H - 42 - 30, id="f")],
        onPage=page_bg)])

    el = []
    el.append(Paragraph("Specialists and procedure breadth",
                        style("t", fontName="Helvetica-Bold", fontSize=18, leading=21,
                              textColor=NAVY, spaceAfter=2)))
    el.append(Paragraph("Who we can attract, and what each of them can actually do here.",
                        style("st", fontName="Helvetica-Oblique", fontSize=10.5, leading=13,
                              textColor=GOLD, spaceAfter=7)))

    # ---------------- 01 ----------------
    sec(el, "01", "WHAT SETS THE LIMIT", "Anaesthesia and recovery, not specialty.")
    el.append(Paragraph(
        "No specialty is admitted or excluded as a whole. What decides whether a given procedure can "
        "be done here is the anaesthesia it needs and the recovery it demands. Three tiers, and the "
        "facility either has the room or it does not.", LEDE))
    el.append(tbl(
        [["Tier 1", "Topical or none", "None to 15 min, ambulant",
          "Treatment room, first floor, Playroom 22.4 sqm", "Yes, today"],
         ["Tier 2", "Local infiltration", "30 to 60 min, walks out",
          "Treatment room, or the FUE suite for all-day work", "Yes, today"],
         ["Tier 3", "Sedation or general", "2 to 6 hours, monitored",
          "Theatre with level trolley evacuation to an ambulance", "Only with the new unit"]],
        ["Tier", "Anaesthesia", "Recovery", "Room required", "Available?"],
        [38, 74, 88, 178, 89], aligns=["l", "l", "l", "l"], hi={2}))
    el.append(Spacer(1, 5))
    el.append(card(
        "<b>The ground floor is Alameda's, so the theatre is a new unit on the grounds.</b> That is "
        "the right answer anyway. A theatre needs positive-pressure ventilation with HEPA filtration "
        "at 15 to 25 air changes an hour, isolated power supply panels, and ceiling height for the "
        "ductwork and operating light. A residential room cannot give you any of the three without "
        "structural work, and we are holding to no wall removal. A purpose-built ground-level unit "
        "solves ventilation, power and evacuation together, at NGN 90M to 150M.",
        bg=ALERT, rule=RUST))

    # ---------------- 02 ----------------
    sec(el, "02", "SURGICAL AND PROCEDURAL SPECIALTIES", "Twelve specialties, tier by tier.")
    el.append(Paragraph(
        "Read across. Columns 2 and 3 are deliverable now. Column 4 requires the theatre.", P))
    el.append(tbl(
        [[a, b, c, d] for a, b, c, d in SURGICAL],
        ["Specialty", "Tier 1  treatment room", "Tier 2  local anaesthesia",
         "Tier 3  theatre only"],
        [92, 125, 132, 118], aligns=["l", "l", "l"]))
    el.append(PageBreak())

    # ---------------- 03 ----------------
    sec(el, "03", "CONSULTING AND DIAGNOSTIC SPECIALTIES", "Twelve more that need no procedure room.")
    el.append(Paragraph(
        "These fill the eight first-floor consulting rooms and drive the laboratory and imaging "
        "baskets. Several are not optional: a surgical campus cannot run without cardiology for "
        "pre-operative clearance, psychology for body-image and bariatric assessment, and "
        "physiotherapy for post-operative rehabilitation.", P))
    el.append(tbl(
        [[a, b] for a, b in NON_SURGICAL],
        ["Specialty", "What they do here, and why they belong"], [138, 329], aligns=["l"]))
    el.append(Spacer(1, 5))
    el.append(card(
        "<b>Twenty-four specialties in total, and the second twelve are what make the first twelve "
        "work.</b> Recruit for the pathway, not for prestige. A surgical aesthetics practice that "
        "has to send patients out for a cardiology clearance, a psychological assessment and six "
        "weeks of lymphatic drainage is a worse practice, and every one of those referrals is "
        "revenue leaving the building.", bg=PANEL))

    # ---------------- 04 ----------------
    sec(el, "04", "WHAT THE THEATRE ADDS", "Including for Alameda.")
    el.append(tbl(
        [["Alameda Conversion Clinic",
          "Cases that do not need tertiary care get done in Abuja instead of flying to Cairo. "
          "Alameda earns locally on the surgery, Medbury earns the theatre fee, and Cairo is "
          "reserved for complex and inpatient work where it genuinely adds value. This makes the "
          "conversion proposition stronger, not weaker"],
         ["Aesthetic and plastic surgeons",
          "Liposuction, abdominoplasty, augmentation and rhinoplasty become possible. Without a "
          "theatre the anchor can only sell injectables, devices and minor excision"],
         ["Ophthalmology",
          "Cataract surgery is the highest-volume day case in the world and it is a single "
          "theatre list. On its own it can fill two days a week"],
         ["General surgery and urology",
          "Hernia, haemorrhoids, hydrocele and circumcision are bread-and-butter day cases with "
          "reliable demand"],
         ["Fertility",
          "Oocyte retrieval needs sedation and a theatre. Without one, an IVF service cannot be "
          "complete"],
         ["The plaza as a whole",
          "A theatre is the single strongest recruitment argument available. A surgeon chooses an "
          "address where they can operate"]],
        ["Who benefits", "How"], [128, 339], aligns=["l"]))

    # ---------------- 05 ----------------
    sec(el, "05", "RECRUITMENT ORDER", "Who to sign first, and why.")
    el.append(tbl(
        [["1", "Aesthetic or plastic surgeon", "The anchor and the theme. Sets the campus identity "
          "and uses every tier"],
         ["2", "Hair restoration, FUE", "Best yield per sqm in the building, one patient a day, no "
          "theatre needed. Its own dedicated suite"],
         ["3", "Dermatology", "The clinical spine of an aesthetics theme, and it brings Tier 2 "
          "surgical volume of its own"],
         ["4", "Cardiology", "Not optional. Pre-operative clearance for every Tier 3 case, and it "
          "carries the echo utilisation"],
         ["5", "Endocrinology and weight management", "Fastest-growing adjacency in the GLP-1 era, "
          "and the heaviest laboratory basket"],
         ["6", "Ophthalmology", "The theatre's most reliable list. Sign once the theatre is funded"],
         ["7", "Obstetrics, gynaecology and fertility", "High willingness to pay, ultrasound "
          "intensive, and a theatre user"],
         ["8", "Psychology and physiotherapy", "Complete the surgical pathway and stop referral "
          "leakage"]],
        ["", "Specialty", "Why in this order"], [18, 148, 301], aligns=["l", "l"]))
    el.append(PageBreak())

    # ---------------- 06 ----------------
    sec(el, "06", "WHAT THIS FACILITY CANNOT DO", "Stated plainly, so nobody is sold a promise.")
    el.append(tbl(
        [["Anything requiring an overnight stay", "There are no inpatient beds and there is no "
          "plan for any. Day case means home the same day"],
         ["Major joint replacement, spinal, cardiac, neurosurgery",
          "Needs inpatient beds, ICU backup and a blood bank"],
         ["Anything needing intensive care backup",
          "Patient selection must exclude it, which means firm ASA and BMI criteria"],
         ["Full endoscopy service",
          "Needs a dedicated scope decontamination room. A separate decision, and not solved by "
          "the theatre"],
         ["Obstetric delivery", "No labour or delivery capability, and none intended"],
         ["Emergency and trauma", "No accident and emergency function. Walk-in emergencies get "
          "stabilised and transferred"],
         ["Radiotherapy, dialysis, chemotherapy day unit",
          "Not in scope. Infusion only if Medlyfe takes first-floor rooms later"]],
        ["Not possible here", "Why"], [188, 279], aligns=["l"]))

    # ---------------- 07 ----------------
    sec(el, "07", "ANAESTHETISTS ON ROSTER", "What it unlocks, and what it obliges.")
    el.append(Paragraph(
        "Putting anaesthetists on roster raises the clean procedure room from local infiltration to "
        "<b>conscious and moderate sedation, monitored anaesthesia care and regional blocks</b>. That "
        "unlocks longer FUE lists run comfortably, larger excisions, blepharoplasty with sedation, "
        "hysteroscopy, some endoscopy and paediatric imaging sedation, all without a theatre.", LEDE))
    el.append(card(
        "<b>It does not relax the evacuation rule. It tightens it.</b> A sedated patient cannot "
        "self-evacuate, so sedation raises the standard rather than lowering it. Sedation happens in "
        "the <b>ground-floor clean procedure room only</b>, where there is level trolley access to an "
        "ambulance. The first-floor treatment room stays local-only whoever is on the roster.",
        bg=ALERT, rule=RUST))
    el.append(Spacer(1, 4))
    el.append(Paragraph("What a competent anaesthetist will not work without", H2))
    el.append(tbl(
        [["Capnography, end-tidal CO2", "Standard of care for any sedation. Not optional and not "
          "negotiable", "3 to 5"],
         ["Anaesthetic machine or piped oxygen with backup", "Plus scavenging if any volatile agent "
          "is used", "8 to 15"],
         ["Difficult airway trolley", "Laryngoscopes, supraglottic airways, bougie, "
          "cricothyroidotomy kit", "2 to 3"],
         ["Defibrillator and resuscitation trolley", "With reversal agents, flumazenil and naloxone",
          "2 to 4"],
         ["Monitored recovery bay", "Pulse oximetry, NIBP, ECG, and a nurse trained in "
          "post-anaesthetic care to formal discharge criteria", "2 to 3"],
         ["Additional capital over the base room", "", "17 to 30"]],
        ["Requirement", "Note", "NGN M"], [148, 253, 66], total_row=True, aligns=["l", "r"]))
    el.append(Spacer(1, 3))
    el.append(Paragraph(
        "That takes the clean procedure room from NGN 25M to 35M up to <b>NGN 45M to 60M</b>. Two "
        "further obligations carry no capital but are absolute: the <b>two-person rule</b>, meaning "
        "whoever administers sedation cannot also perform the procedure, so every sedation case needs "
        "proceduralist, anaesthetist and nurse; and a <b>written transfer agreement</b> with a nearby "
        "hospital with theatre and ICU capability, which is both a licensing expectation and an "
        "insurance condition.", P))
    el.append(Spacer(1, 4))
    el.append(Paragraph("Roster shape, and who carries the cost", H2))
    el.append(tbl(
        [["Fixed sessions, recommended", "Two anaesthetist days a week with all sedation cases "
          "scheduled into them. Makes the roster affordable, gives proceduralists a predictable slot, "
          "and means recovery staffing is only needed on those days"],
         ["On-call roster", "Available with notice, booked per case. Cheapest, least reliable, and "
          "hard to staff recovery around"],
         ["Retainer plus case fee", "A small availability retainer plus a per-case fee. Worth "
          "considering once volume is proven"]],
        ["Option", "Assessment"], [128, 339], aligns=["l"], hi={0}))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>Do not carry the anaesthetist on the facility payroll.</b> At NGN 200,000 a session "
        "against 138 sold sessions, absorbing the cost would leave the sedation-capable room earning "
        "<i>less</i> than the local-only room. The right structure is that The Lyfe Place provides a "
        "compliant room and rosters the anaesthetist, and the fee is <b>billed through to the "
        "operating clinician with a coordination margin</b>. Room at NGN 480,000 a session plus a "
        "roughly NGN 40,000 coordination margin gives about <b>NGN 72M a year against NGN 44M</b> for "
        "the local-only room, and the facility carries no sessional risk.", bg=PANEL))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "One item to confirm rather than assume: FCT health facility registration will need to "
        "reflect sedation capability, and there may be specific conditions attached. Worth "
        "establishing before the equipment is ordered.", P))
    el.append(PageBreak())

    sec(el, "08", "WHAT THE THEATRE OBLIGES", "Governance, before the first list.")
    el.append(Paragraph(
        "A theatre is not a room, it is a clinical governance system. These are conditions of "
        "opening, not refinements.", P))
    el.append(tbl(
        [["Anaesthetist cover and a pre-assessment clinic",
          "Named consultant anaesthetist, and every Tier 3 patient assessed before the list"],
         ["Written patient selection criteria",
          "ASA I to II, BMI ceiling, a responsible escort home, no untreated sleep apnoea, "
          "distance from the facility"],
         ["Resuscitation capability",
          "Full trolley, difficult airway equipment, defibrillator, and an ALS-trained team on "
          "site whenever the theatre is in use"],
         ["A written transfer agreement",
          "With a named receiving hospital, signed before the first case, not after the first "
          "problem"],
         ["Discharge criteria and follow-up",
          "Written, auditable, with a 24-hour contact number"],
         ["Sterile services",
          "Either a decontamination room and autoclave on site, or an outsourced CSSD contract "
          "with tracked instrument sets"],
         ["Theatre register, WHO checklist, audit",
          "Logbook, safety checklist every case, and a morbidity review that actually meets"],
         ["Regulatory",
          "FCT health facility registration extended to surgical services, and MDCN registration "
          "for every operating clinician including visiting Egyptian specialists"]],
        ["Obligation", "What it means"], [172, 295], aligns=["l"]))
    el.append(Spacer(1, 5))
    el.append(card(
        "<b>The honest sequence.</b> Open on Tiers 1 and 2, which need nothing beyond the treatment "
        "room and the FUE suite you already have, and run the theatre-requiring specialties through "
        "a partner hospital in the meantime. Fund the theatre unit when there is a booked list to "
        "justify it, which on ophthalmology and general surgery alone should be inside eighteen "
        "months. Building it first and looking for surgeons afterwards is the expensive way round.",
        bg=PANEL))
    el.append(Spacer(1, 8))
    el.append(card(
        "<b>Debo Odulana</b> &nbsp; Consult for Africa &nbsp; / &nbsp; +234 913 813 8553 &nbsp; / "
        "&nbsp; hello@consultforafrica.com", bg=NAVY, fg=white))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "Procedure lists follow standard day case and office-based practice and are indicative, not "
        "a scope of practice. Every case mix must be confirmed by a clinical governance review and "
        "against each practitioner's own credentials and indemnity. Tier boundaries on sedation are "
        "conservative by design. Not medical advice. Companions: the engagement note, the space "
        "allocation drawing and the rate assumptions.", SMALL))

    doc.build(el)
    print("wrote %s" % OUT)


if __name__ == "__main__":
    build()
