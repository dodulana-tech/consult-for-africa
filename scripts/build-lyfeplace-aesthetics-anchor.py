"""
Build "Lyfe Place Abuja: the aesthetics anchor" exploration PDF.

Itunu's steer: theme the park towards aesthetics and cosmetic practice, mirroring
the Lagos arrangement (KP Plastics / Medlyfe Aesthetics), with The Cloister and
the private consulting-room rentals layered on as add-ons. In Abuja the anchor
may be a hair-restoration SPV plus a practitioner covering services Dr Chinwe
does not.

The requirement she set: the ambulatory side must satisfy all day case needs of a
cosmetics-heavy, surgically oriented anchor.

What this note concludes:
  - Tier 1 (non-surgical) and Tier 2 (minor surgery under local) are fully
    satisfied by the building
  - Tier 3 (sedation or GA day case surgery) cannot happen inside it, and the
    stopper is evacuation, not cost
  - FUE hair transplant is the ideal anchor for THIS building: local anaesthesia,
    all-day single-patient sessions, no theatre, 8x the yield of a consulting room
  - An aesthetics anchor is worth 1.2x to 2.5x the Alameda SPV on the same floor,
    which puts the two in direct competition for the ground floor
  - Ring 2 specialties are the anchor's own surgical pathway, not a dilution of
    the theme

Output: docs/lyfeplace-abuja-aesthetics-anchor-cfa.pdf

House style matches the CFA repo. Naira shown as NGN. No em dashes anywhere.

Run:
  python3 scripts/build-lyfeplace-aesthetics-anchor.py
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
OUT = DOCS / "lyfeplace-abuja-aesthetics-anchor-cfa.pdf"

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
MARGIN = 44
FULLW = PAGE_W - 2 * MARGIN

ss = getSampleStyleSheet()


def style(name, **kw):
    base = dict(fontName="Helvetica", fontSize=9.1, leading=12.4, textColor=BODY,
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
LEDE = style("lede", fontSize=9.9, leading=14.2, textColor=HexColor("#374151"))
SMALL = style("small", fontSize=7.8, leading=10.5, textColor=MUTED)
CELL = style("cell", fontSize=8.3, leading=10.8)
CELL_R = style("cellr", fontSize=8.3, leading=10.8, alignment=2)
CELL_B = style("cellb", fontSize=8.3, leading=10.8, fontName="Helvetica-Bold", textColor=NAVY)
CELL_BR = style("cellbr", fontSize=8.3, leading=10.8, fontName="Helvetica-Bold",
                textColor=NAVY, alignment=2)
CELL_W = style("cellw", fontSize=8.3, leading=10.8, fontName="Helvetica-Bold", textColor=white)
CELL_WR = style("cellwr", fontSize=8.3, leading=10.8, fontName="Helvetica-Bold",
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
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 20, "The aesthetics anchor  /  exploration")
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
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
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


def build():
    doc = BaseDocTemplate(
        str(OUT), pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN, topMargin=42, bottomMargin=30,
        title="Lyfe Place Abuja - The aesthetics anchor",
        author="Consult for Africa",
    )
    doc.addPageTemplates([PageTemplate(
        id="p", frames=[Frame(MARGIN, 30, FULLW, PAGE_H - 42 - 30, id="f")],
        onPage=page_bg)])

    el = []

    el.append(Paragraph("The aesthetics theme",
                        style("t", fontName="Helvetica-Bold", fontSize=18, leading=21,
                              textColor=NAVY, spaceAfter=2)))
    el.append(Paragraph("An exploration. What it needs, and where it now sits.",
                        style("st", fontName="Helvetica-Oblique", fontSize=10.5, leading=13,
                              textColor=GOLD, spaceAfter=7)))
    el.append(card(
        "<b>Superseding note.</b> This paper explored an aesthetics anchor taking the ground floor. "
        "That is not the configuration. <b>The ground floor is the Alameda / Medbury Conversion "
        "Clinic</b>, with imaging and phlebotomy as campus facility alongside it. The aesthetics "
        "theme therefore lives on the <b>first floor</b>, expressed through who is recruited into the "
        "plaza: the FUE suite in the only room large enough for it, the Playroom as the treatment "
        "room, and Ring 1 practitioners filling the eight consulting rooms. The clinical analysis in "
        "sections 02 to 07 stands unchanged and is the reason the theme works. The ground-floor space "
        "plan and the anchor economics in sections 08 and 09 do not apply.",
        bg=ALERT, rule=RUST))

    # ================= 01 =================
    sec(el, "01", "THE THESIS", "Anchor first, then layer.")
    el.append(Paragraph(
        "Themed on aesthetics and cosmetic practice, mirroring the Lagos arrangement, with The "
        "Cloister and the private consulting-room rentals layered on top. It is the right instinct "
        "and it is stronger than the generic medical park for four reasons.", LEDE))
    el.append(tbl(
        [["An identity, not an address",
          "A park with an anchor product profile is sellable. A generic address has to be explained"],
         ["The right patients, already in the building",
          "Aesthetic patients are cash-pay, repeat, and precisely the demographic that buys a "
          "Cloister family membership. The layering is a genuine funnel, not co-location"],
         ["Appeal to the other tenants",
          "A specialist renting a room by the session is buying access to a patient base that is "
          "already on site for something else"],
         ["Uniformity across Lagos and Abuja",
          "One structure, one brand, one operating model, and a template for the third site. That "
          "is worth something on its own"]],
        ["Why the anchor thesis works", "Reason"], [156, 311], aligns=["l"]))
    el.append(Spacer(1, 5))
    el.append(card(
        "<b>Your requirement, taken literally, splits in two.</b> The ambulatory side can satisfy "
        "<b>all office-based and local-anaesthesia day case work</b>, which is the large majority of "
        "aesthetic revenue and almost all of the repeat revenue. It cannot satisfy sedation or "
        "general-anaesthesia surgery inside this building, and that limit is clinical rather than "
        "financial. Sections 03 and 05 set out what that means and what it would take to change it.",
        bg=PANEL))

    # ================= 02 =================
    sec(el, "02", "THE THREE TIERS", "Aesthetic work sorted by what the facility must provide.")
    el.append(Paragraph(
        "Anaesthesia and recovery decide the room. Everything else follows.", P))
    el.append(tbl(
        [["Tier 1<br/>Non-surgical",
          "Topical or none",
          "None to 15 minutes, ambulant",
          "Botulinum toxin, dermal fillers, chemical peels, microneedling and RF microneedling, "
          "laser hair removal, pigmentation and non-ablative resurfacing, HIFU, RF tightening, "
          "cryolipolysis, PRP face and scalp, mesotherapy, skin boosters, IV therapy",
          "Treatment room. First floor is fine"],
         ["Tier 2<br/>Minor surgery, local",
          "Local infiltration",
          "30 to 60 minutes, walks out",
          "Mole and lesion excision, earlobe repair, scar revision, small lipoma, upper-lid "
          "blepharoplasty, labiaplasty, thread lifts, and FUE hair transplant",
          "Clean procedure room. Ground floor for level access"],
         ["Tier 3<br/>Day case surgery",
          "Sedation or general",
          "2 to 6 hours, monitored",
          "Liposuction beyond small volume, abdominoplasty, breast augmentation and reduction, "
          "rhinoplasty, facelift, gynaecomastia, fat transfer and buttock augmentation",
          "Theatre with anaesthetic support. Not possible in this building"]],
        ["Tier", "Anaesthesia", "Recovery", "Cases", "Facility needed"],
        [72, 58, 62, 165, 110], aligns=["l", "l", "l", "l"], hi={2}))
    el.append(Spacer(1, 5))
    el.append(Paragraph(
        "Tiers 1 and 2 together are typically <b>80% or more of an aesthetic clinic's case volume</b> "
        "and the overwhelming majority of its repeat revenue, because injectables and devices bring "
        "patients back every three to six months while surgery does not. Tier 3 is high ticket and "
        "low frequency.", P))
    el.append(PageBreak())

    # ================= 03 =================
    sec(el, "03", "THE LIMIT", "Why Tier 3 cannot happen here, at any budget.")
    el.append(card(
        "<b>The stopper is evacuation.</b> A patient under sedation or general anaesthesia who "
        "deteriorates must be moved horizontally, on a trolley, to an ambulance. This building has "
        "no lift and the staircase is in the right-hand block. Stairs are not an option for an "
        "unconscious patient. That is a clinical governance failure no budget corrects, and it "
        "applies to the first floor absolutely.", bg=ALERT, rule=RUST))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "Three further requirements compound it, all of which a converted residential house resists:", P))
    el.append(tbl(
        [["Ventilation", "Positive pressure with HEPA filtration and 15 to 25 air changes an hour. "
                         "That is an air handling unit, ductwork and a plant room. The campus is "
                         "specified on zoned split units precisely because none of those exist"],
         ["Power", "Isolated power supply panels and UPS-backed essential circuits. A different "
                   "order of electrical work from the rest of the fit-out"],
         ["Staffing and cover", "Surgeon, anaesthetist, scrub and circulating nurse, recovery nurse, "
                                "plus resuscitation capability and a written transfer agreement with "
                                "a receiving hospital"]],
        ["Requirement", "Why the building resists it"], [104, 363], aligns=["l"]))
    el.append(Spacer(1, 5))
    el.append(card(
        "<b>What this does not prevent.</b> A surgically oriented anchor can still be built here. "
        "Upper-lid blepharoplasty, labiaplasty, thread lifts, lipoma and lesion excision, scar "
        "revision and full FUE hair transplant are all Tier 2 and all deliverable in a ground-floor "
        "clean procedure room. The line is drawn at sedation, not at surgery.", bg=PANEL))

    # ================= 04 =================
    sec(el, "04", "THE FUE INSIGHT", "The anchor that fits this building better than any other.")
    el.append(Paragraph(
        "Follicular unit extraction is worth singling out, because it is the rare high-ticket "
        "surgical service that suits a converted house with one reception and no lift.", LEDE))
    el.append(tbl(
        [["Anaesthesia", "Local only. No anaesthetist, no monitored recovery, no evacuation problem"],
         ["Session length", "Six to ten hours. One patient occupies the suite for the whole day"],
         ["Effect on throughput", "One arrival per day per suite. It <b>relieves</b> the "
                                  "single-reception constraint rather than worsening it"],
         ["Ticket", "NGN 1.2M to 4M in Nigeria by graft count. Take NGN 2.5M as an average"],
         ["Room requirement", "25 to 30 sqm: reclined chair, three to four operators working "
                              "simultaneously, instrument trays, excellent task lighting"],
         ["Patient at discharge", "Awake, ambulant, walks out with a dressing"]],
        ["Why it fits", "Detail"], [124, 343], aligns=["l"]))
    el.append(Spacer(1, 5))
    el.append(card(
        "<b>One FUE suite at two cases a week is about NGN 230M a year of clinical revenue. A "
        "sessional consulting room on the first floor earns NGN 28.6M. That is eight times the "
        "yield from the same floor area.</b> It is also the least demanding use in the building on "
        "reception, waiting and parking, because it brings one patient a day instead of thirty.",
        bg=PANEL))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "This argues for pursuing the hair-restoration SPV as a <b>named anchor in its own right</b>, "
        "not as a service line inside a general aesthetics practice. It has different staffing, "
        "different room design, a different patient journey and a different marketing channel, and "
        "it justifies its own dedicated suite.", P))
    el.append(PageBreak())

    # ================= 05 =================
    sec(el, "05", "IF TIER 3 IS WANTED", "Three routes, and what each costs.")
    el.append(tbl(
        [["Partner a nearby hospital for theatre lists",
          "The anchor consults, assesses and follows up at Lyfe Place, and operates at a partner "
          "theatre. Patient stays inside the Lyfe Place relationship throughout. No capital",
          "nil", "Phase 1"],
         ["Modular theatre unit sited on the grounds",
          "Solves ventilation, isolated power and level access in one, at ground level next to the "
          "aesthetics suite. This is the coherent long-term campus plan",
          "90 to 150", "Phase 2, on volume"],
         ["Theatre inside the main building",
          "Consumes three or four of the highest-yielding rooms and still fails the evacuation test",
          "not viable", "Never"]],
        ["Route", "What it means", "NGN M", "When"],
        [128, 219, 60, 60], aligns=["l", "r", "l"], hi={0}))
    el.append(Spacer(1, 5))
    el.append(card(
        "<b>Recommendation: open on the partner-theatre route.</b> It costs nothing, it lets the "
        "anchor sell a full surgical offer from day one, and it defers a NGN 90M to 150M decision "
        "until there is a list volume to justify it. Write the transfer and theatre-access agreement "
        "before the anchor signs, because it is part of what they are buying. A modular unit becomes "
        "the obvious phase 2 move once the anchor is doing more than about two GA cases a week.",
        bg=PANEL))
    el.append(Spacer(1, 4))

    # ================= 06 =================
    sec(el, "06", "SPECIALTIES", "Two rings, and why the outer one is not a dilution.")
    el.append(Paragraph("Ring 1: the anchor and its immediate adjacencies", H2))
    el.append(tbl(
        [["Aesthetic and plastic surgery", "The anchor. Injectables, devices, Tier 2 surgery, and "
                                           "Tier 3 through the partner theatre"],
         ["Hair restoration, FUE", "Its own anchor and its own suite. See section 04"],
         ["Dermatology, medical and cosmetic", "The clinical spine of the theme. Also brings "
                                               "skin cancer excision, which is Tier 2"],
         ["Aesthetic gynaecology and intimate health", "High margin, discreet, underserved in Abuja"],
         ["Weight management and metabolic", "The GLP-1 era makes this the fastest-growing "
                                             "adjacency in aesthetics anywhere"],
         ["Longevity and hormone optimisation", "Where Medlyfe fits when it comes in as a "
                                                "first-floor tenant"],
         ["Dental aesthetics and smile design", "Same patient, same decision, different clinician"],
         ["Oculoplastics", "Blepharoplasty under local. Bridges ophthalmology and aesthetics"],
         ["Vascular, veins and sclerotherapy", "Cosmetic and medical at once, and device heavy"]],
        ["Ring 1", "Why it belongs"], [172, 295], aligns=["l"]))
    el.append(Spacer(1, 4))
    el.append(Paragraph("Ring 2: aligned enough to let by the session", H2))
    el.append(Paragraph(
        "These are not filler. <b>Every one of them is something the surgical anchor needs and "
        "would otherwise have to send patients out for.</b> Letting rooms to them completes the "
        "theme rather than diluting it.", P))
    el.append(tbl(
        [["Cardiology", "Pre-operative clearance for any sedation or general anaesthesia case"],
         ["Endocrinology", "Diabetes and thyroid control before surgery, and it feeds weight management"],
         ["Anaesthetics", "A pre-assessment clinic, even when the surgery itself happens elsewhere"],
         ["Psychiatry and psychology", "Body-image assessment and bariatric psychological clearance, "
                                       "which is a genuine requirement and not a courtesy"],
         ["Physiotherapy", "Post-operative rehabilitation and lymphatic drainage after liposuction"],
         ["Nutrition and dietetics", "Pre and post-surgical optimisation, and GLP-1 programmes"],
         ["Obstetrics, gynaecology, fertility", "Same demographic, ultrasound intensive, high "
                                                "willingness to pay"],
         ["ENT", "The rhinoplasty referral partner, plus sleep and snoring work"]],
        ["Ring 2", "What the anchor needs it for"], [148, 319], aligns=["l"]))
    el.append(Spacer(1, 4))
    el.append(card(
        "The test for admitting a specialty should be: <b>does it either serve the anchor's patients "
        "or draw the anchor's kind of patient into the building?</b> Anything that does neither "
        "belongs somewhere else, however good the practitioner.", bg=SURFACE))

    # ================= 07 =================
    sec(el, "07", "ROOM SPECIFICATIONS", "What each room must be able to do.")
    el.append(tbl(
        [["Treatment room x 2", "16 to 20 each", "First floor or ground",
          "Tier 1. Procedure couch with trendelenburg, mobile task light, laser-safe blinds and "
          "door interlock, eye protection store, device trolleys, hand-wash, sharps and clinical "
          "waste, mirror and photography station with fixed lighting for before and after imaging"],
         ["FUE suite x 1 to 2", "25 to 30 each", "Ground floor",
          "Tier 2, all day. Reclined transplant chair, room for three to four operators, "
          "microscope or magnification station, graft storage on ice, two instrument trolleys, "
          "excellent shadow-free lighting, patient entertainment, adjacent WC access"],
         ["Clean procedure room", "28 with recovery", "Ground floor only",
          "Tier 2 surgical. Filtered supply at modest positive pressure from a dedicated unit, "
          "operating light, diathermy, piped or cylinder oxygen and suction, resuscitation trolley, "
          "scrub position, level trolley route to the ambulance bay, two recovery bays"],
         ["Consultation room", "14", "Either floor",
          "Assessment, consent, photography, quotation. Needs to feel like the practice, not a "
          "clinic room"],
         ["Recovery lounge", "20", "Ground floor",
          "Post-treatment observation for Tier 1 and 2. Recliners, refreshments, discreet exit"],
         ["Device store", "8", "Ground floor",
          "Secure. Aesthetic lasers and energy platforms are the most valuable movable assets on "
          "the campus"]],
        ["Room", "sqm", "Where", "Must be able to do"],
        [88, 58, 66, 255], aligns=["l", "l", "l"]))
    el.append(Spacer(1, 5))
    el.append(card(
        "<b>Two specification points that get missed.</b> First, <b>laser safety</b>: door "
        "interlocks, controlled-access signage, laser-safe window treatments and eyewear storage are "
        "regulatory, not optional, and they are cheap at design stage and expensive later. Second, "
        "<b>the photography station</b>: standardised before-and-after imaging with fixed lighting "
        "and positioning is how aesthetic practices sell, defend outcomes and manage complaints. It "
        "belongs in the room specification, not in someone's phone.", bg=PANEL))

    # ================= 08 =================
    sec(el, "08", "SPACE PLAN", "The ground floor as an aesthetics and day-procedure anchor.")
    el.append(tbl(
        [["2 treatment rooms: injectables, lasers, energy devices", "36"],
         ["2 FUE hair transplant suites", "52"],
         ["Clean procedure room plus recovery bay, level access", "30"],
         ["Post-treatment recovery lounge", "20"],
         ["Consultation room", "14"],
         ["Phlebotomy draw point and medication hatch", "14"],
         ["Device store, secure", "8"],
         ["Ultrasound room", "27"],
         ["Total, of 201 usable", "201"]],
        ["Ground floor", "sqm"], [407, 60], total_row=True))
    el.append(Spacer(1, 5))
    el.append(card(
        "<b>An aesthetics anchor removes the need for the 55 sqm X-ray and echocardiography suite.</b> "
        "Aesthetic and Tier 2 surgical work needs bloods and ultrasound, not radiography. Diagnostics "
        "on this campus becomes a phlebotomy draw point, the laboratory in the guest chalet, and one "
        "ultrasound room. That releases about 40 sqm on the ground floor and cuts the diagnostics "
        "fit-out from NGN 75M to roughly NGN 45M.<br/><br/>"
        "The counterweight: the Ring 2 specialists on the first floor do want imaging, so the "
        "decision is whether to keep a reduced imaging capability for them or refer imaging out. "
        "That is a live question and it turns on how many Ring 2 rooms you expect to let.",
        bg=PANEL))
    el.append(PageBreak())

    # ================= 09 =================
    sec(el, "09", "WHAT IT IS WORTH", "And the ground floor now has two claimants.")
    el.append(tbl(
        [["Tier 1, injectables and devices, 2 rooms", "298", "442", "552"],
         ["Tier 2, minor surgery", "55", "83", "83"],
         ["FUE suites", "172", "230", "460"],
         ["Anchor clinical revenue", "526", "754", "1,095"]],
        ["Anchor clinical revenue, NGN M", "Conservative", "Mid", "Mature"],
        [239, 76, 76, 76], total_row=True))
    el.append(Spacer(1, 4))
    el.append(tbl(
        [["Licence, at 18% of anchor revenue", "95", "136", "197"],
         ["Product and skincare retail margin", "47", "68", "99"],
         ["Pre-operative bloods", "8", "8", "8"],
         ["Share of anchor SPV profit, 45% of 25%", "59", "85", "123"],
         ["Total to Medbury", "209", "297", "427"]],
        ["Medbury's take, NGN M", "Conservative", "Mid", "Mature"],
        [239, 76, 76, 76], total_row=True))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "<b>Product retail is a line a general medical park does not have.</b> Aesthetic practices "
        "sell skincare, post-procedure and maintenance products at 40% to 60% margin, typically 20% "
        "of clinic revenue. Medbury Pharmaceuticals should own that shelf, and it is worth NGN 47M "
        "to NGN 99M a year on its own.", P))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>The ground floor now has two claimants and they cannot both have it.</b> The Alameda "
        "Conversion Clinic SPV is worth about NGN 168M a year to Medbury from that floor, being a "
        "NGN 132M licence plus roughly NGN 36M of capture. The aesthetics anchor is worth "
        "<b>NGN 209M to NGN 427M, or 1.2 to 2.5 times as much</b>, and the money is retained in "
        "Nigeria rather than landing in Cairo.", bg=ALERT, rule=RUST))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "There is a resolution that does not require dropping Alameda. What Alameda actually needs "
        "is <b>consulting rooms for visiting specialists running screening clinics</b>, which is "
        "exactly what the first floor is. Move the Conversion Clinic upstairs as a large block "
        "sessional user, and the ground floor goes to the anchor. Alameda loses a dedicated floor "
        "and gains flexibility and a lower cost base, which is arguably an easier sell than the "
        "current NGN 132M for 104 sqm.", P))
    el.append(tbl(
        [["Ground floor", "Aesthetics and day-procedure anchor, plus the hair-restoration SPV",
          "Licence, SPV equity, product retail"],
         ["First floor", "The private medical plaza. Ring 2 specialists by the session, plus "
          "Alameda as a block user, plus Medlyfe when it comes",
          "Membership and session fees"],
         ["Guest chalet", "Medbury Diagnostics laboratory", "Facility, recovered in rates"],
         ["Boys' quarters", "Medbury Pharmaceuticals dispensary and the product shelf",
          "Facility, plus retail margin"]],
        ["Where", "Who", "How Medbury earns"], [78, 236, 153], aligns=["l", "l"]))

    # ================= 10 =================
    sec(el, "10", "WHAT TO DECIDE", "Five questions, in order.")
    el.append(tbl(
        [["1", "Does the aesthetics anchor take the ground floor?",
          "If yes, Alameda moves upstairs as a block sessional user and the whole model reruns on "
          "the anchor economics"],
         ["2", "Is the hair-restoration SPV pursued as a named anchor in its own right?",
          "It has the best yield per sqm in the building and the lowest operational burden"],
         ["3", "Partner theatre now, modular unit later?",
          "Recommended. It lets the anchor sell a full surgical offer with no capital, and the "
          "transfer agreement must be in place before they sign"],
         ["4", "Does Medbury Pharmaceuticals own the product shelf?",
          "Worth NGN 47M to 99M a year and it needs to be written into the anchor agreement, not "
          "assumed"],
         ["5", "Keep reduced imaging for the Ring 2 specialists, or refer out?",
          "Turns on how many Ring 2 rooms you expect to let. Releases 40 sqm and NGN 30M if dropped"]],
        ["", "Question", "What turns on it"], [18, 178, 271], aligns=["l", "l"]))
    el.append(Spacer(1, 6))
    el.append(card(
        "On question 1 my view is yes. It earns more, it keeps the money in Nigeria, it gives the "
        "park the identity you are after, it matches Lagos, and it makes the Cloister and the "
        "private rentals easier to sell rather than harder. The cost is renegotiating a floor with "
        "Alameda that has not yet been contracted, which is the cheapest moment to do it.", bg=PANEL))
    el.append(Spacer(1, 8))
    el.append(card(
        "<b>Debo Odulana</b> &nbsp; Consult for Africa &nbsp; / &nbsp; +234 913 813 8553 &nbsp; / "
        "&nbsp; hello@consultforafrica.com", bg=NAVY, fg=white))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "An exploration, not a recommendation to sign. Anchor revenue figures are illustrative and "
        "built from stated assumptions on room count, patients per day, case frequency and ticket, "
        "all of which should be tested against the Lagos pilot's actual trading data. Clinical tier "
        "definitions follow standard practice on anaesthesia and recovery but are not a substitute "
        "for a clinical governance review. Not a binding offer, and not legal or medical advice. "
        "Companions: the engagement note, the fit-out note and the rate assumptions.", SMALL))

    doc.build(el)
    print("wrote %s" % OUT)


if __name__ == "__main__":
    build()
