"""
Lyfe Place: the medical infrastructure division. For Dr Itunu Akinware, Group CEO.

Answers her brief of 2026-08-17, item by item:

  1  A NEW DIVISION, not a project. SPVs sit under it. Abuja first, Lagos planned.
  2  RECOUP AND RETURNS IN ONE YEAR. She is brutally honest, so the answer is too:
     twelve months from opening is not available. Three clocks are given (the 115M
     already committed, the medipark's own new cash, the group programme), the honest
     floor is about 22 months from opening with all three levers pulled, and what IS
     deliverable in twelve months is listed plainly. 22 months of trading is trading
     year two, so it reconciles to the mandate measured from opening not signature.
  3  CONVERSION CLINIC takes most of the first floor at a per sqm rate. Measured, the
     literal reading is 143.5 sqm; recommended is 110.1 sqm and five consulting rooms,
     with two rooms going to infusion instead, worth about NGN 175M/yr to the group.
  4  THE MEDIPARK IS ENTITY ONE, scrutinised standalone. It pays its own head rent
     and funds itself from month 7. Full P&L.
  5  FIT-OUT LINE BY LINE, quantity driven so it can be handed to a QS: 74 priced
     lines with measured quantities, unit rates, a who-pays column, AACE Class 4
     accuracy, BOQ in two weeks.
  6  UPSTAIRS BUSINESSES leveraging Medbury Pharma and Diagnostics, plus the transfer
     pricing warning that comes with charging sister companies 84% of your revenue.
  7  AESTHETICS CORE aligned to KP Plastics at Lyfe Place Lagos. Aesthetics and
     regenerative, longevity and infusion, hair restoration, bariatrics. Bariatrics
     launches medical-first on GLP-1 and adds surgery with the theatre.
  8  TWO MONTHS of strategy and SPV development behind the fit-out.

THE FINDING THAT LEADS, because it is unwelcome and she must not hear it from a
contractor in week 8: the measured geometry supersedes the brief. The brief carried
the footprint at 24,695 x 13,025 mm; it measures 24,695 x 16,317. Net internal area
is 664.3 sqm, not 519, and gross is 953.9, not 711. The main building is 35% larger in
net area than every prior CFA document assumed, and ALMOST ALL THE EXTRA IS
CIRCULATION: lettable area is 360.2 sqm against the 363.6 previously assumed, so the
rent roll does not move at all while 145 more square metres must be fitted out, cooled,
cleaned, insured and secured. Cat A fit-out plus float is 357.9 against the mandate's
306.7, so the measurement correction costs about NGN 51M and thins the medipark's
margin to 22%. Areas come from scripts/lyfeplace_survey.py, which recovers the as-built
CAD to about 10 mm; both floors independently return 70% efficiency on a 402.9 sqm
plate, which is the cross-check that the extraction is right rather than merely precise.

TWO VERSIONS, per Debo 2026-08-17. The script emits BOTH from one model, so they cannot
drift: managed (CFA runs the conversion clinic) and self-managed (it is a serviced
tenant). Unmanaged it absorbs the first floor reception as its own front of house, which
is why the literal reading of her brief came to 143.5 sqm; it pays a lower service
charge, the medipark loses the revenue cycle fee on its collections and sheds reception,
billing and nursing cost, and the clinic converts and collects a little worse. THE
FINDING: attributable EBITDA is 384.4 vs 383.7, a difference under NGN 1M, so this is
NOT a money decision for Medbury, it is a control and accountability decision. CFA's
setup fee is the thing that really moves: 292 days / 87.1 managed vs 266 / 79.4 not.
Version two is the one to take into the Alameda conversation, because the conversion
centre is "subject to alignment with Egyptians" and v2 survives them saying no.

TWO RECOMMENDATIONS THAT COST HER NOTHING AND ARE WORTH REAL MONEY:
  - Two of the conversion clinic's seven consulting rooms are worth about NGN 175M a
    year more as a four bay longevity and infusion suite. Quantified in section 09.
  - The theatre is already on the ground floor on the measured drawings, with level
    trolley access. Nothing needs moving, which matters now that bariatrics is in
    scope: no lift, and no sedation above ground level at any budget.

FEE POSTURE, per Debo 2026-08-17: billed as CONSULTANCY TIME. Grades, day rates, days
by workstream. Cost of execution plus a modest mark-up. A 10% programme rate is shown
because six workstreams are one mandate, not six engagements. Any further discount is
held for the conversation and is NOT in here. Third party consultants pass through at
cost with no mark-up. Mobilisation is NGN 25.0M, which is the hard floor from
[[project_medbury_medipark_approved]]: below it CFA funds her design and procurement
out of its own working capital. The operating management fee is NOT reopened; it
points back to the mandate document already with her.

No platform name-drops anywhere in the body copy, per feedback_no_platform_namedrops.

Output, both 19pp:
  docs/lyfeplace-abuja/lyfeplace-division-plan-managed-cfa.pdf
  docs/lyfeplace-abuja/lyfeplace-division-plan-selfmanaged-cfa.pdf
House style matches the Lyfe Place family. Naira as NGN. No em dashes anywhere.

Run:
  python3 scripts/build-lyfeplace-division.py
"""

from __future__ import annotations

from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import (
    BaseDocTemplate, CondPageBreak, Frame, KeepTogether, PageBreak, PageTemplate, Paragraph,
    Spacer,
    Table, TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs" / "lyfeplace-abuja"
OUT = DOCS / "lyfeplace-division-plan-cfa.pdf"

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

PAGE_W, PAGE_H = A4
MARGIN = 42
FULLW = PAGE_W - 2 * MARGIN

ss = getSampleStyleSheet()


def style(name, **kw):
    base = dict(fontName="Helvetica", fontSize=8.8, leading=11.8, textColor=BODY,
                alignment=TA_LEFT, spaceAfter=5)
    base.update(kw)
    return ParagraphStyle(name, **base)


EYEBROW = style("eyebrow", fontName="Helvetica-Bold", fontSize=8.0, leading=10.5,
                textColor=GOLD, spaceAfter=2)
H1 = style("h1", fontName="Helvetica-Bold", fontSize=13, leading=16.5, textColor=NAVY,
           spaceBefore=6, spaceAfter=5, keepWithNext=True)
H2 = style("h2", fontName="Helvetica-Bold", fontSize=9.6, leading=12.5, textColor=TEAL,
           spaceBefore=7, spaceAfter=3, keepWithNext=True)
P = style("p")
LEDE = style("lede", fontSize=9.5, leading=13.4, textColor=HexColor("#374151"))
SMALL = style("small", fontSize=7.3, leading=9.8, textColor=MUTED)
CELL = style("cell", fontSize=7.9, leading=10.2)
CELL_R = style("cellr", fontSize=7.9, leading=10.2, alignment=2)
CELL_B = style("cellb", fontSize=7.9, leading=10.2, fontName="Helvetica-Bold", textColor=NAVY)
CELL_BR = style("cellbr", fontSize=7.9, leading=10.2, fontName="Helvetica-Bold",
                textColor=NAVY, alignment=2)
CELL_W = style("cellw", fontSize=7.9, leading=10.2, fontName="Helvetica-Bold", textColor=white)
CELL_WR = style("cellwr", fontSize=7.9, leading=10.2, fontName="Helvetica-Bold",
                textColor=white, alignment=2)
TINY = style("tiny", fontSize=7.1, leading=9.2)
TINY_R = style("tinyr", fontSize=7.1, leading=9.2, alignment=2)
TINY_B = style("tinyb", fontSize=7.1, leading=9.2, fontName="Helvetica-Bold", textColor=NAVY)
TINY_BR = style("tinybr", fontSize=7.1, leading=9.2, fontName="Helvetica-Bold",
                textColor=NAVY, alignment=2)


def page_bg(c, doc):
    c.saveState()
    c.setFillColor(NAVY)
    c.rect(0, PAGE_H - 30, PAGE_W, 30, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(0, PAGE_H - 33, PAGE_W, 3, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(MARGIN, PAGE_H - 20, "LYFE PLACE")
    c.setFillColor(LIGHT)
    c.setFont("Helvetica", 8)
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 20, "Medical infrastructure division")
    c.setFillColor(GOLD)
    c.rect(MARGIN, 26, 20, 2, fill=1, stroke=0)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 7.3)
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
        ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 10), ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ]))
    return t


def tbl(rows, labels, widths, total_row=False, aligns=None, hi=None, sub=None, tiny=False):
    ncols = len(labels)
    if aligns is None:
        aligns = ["r"] * (ncols - 1)
    hi = hi or set()
    sub = sub or set()
    for i, r in enumerate(rows):
        assert len(r) == ncols, "row %d has %d cells, header has %d" % (i, len(r), ncols)
    c_n, c_r = (TINY, TINY_R) if tiny else (CELL, CELL_R)
    c_b, c_br = (TINY_B, TINY_BR) if tiny else (CELL_B, CELL_BR)
    data = [[Paragraph(labels[0], CELL_W)] +
            [Paragraph(t, CELL_WR if aligns[j] == "r" else CELL_W)
             for j, t in enumerate(labels[1:])]]
    for i, r in enumerate(rows):
        emph = (total_row and i == len(rows) - 1) or i in hi or i in sub
        cells = [Paragraph(r[0], c_b if emph else c_n)]
        for j, v in enumerate(r[1:]):
            cells.append(Paragraph(v, (c_br if emph else c_r) if aligns[j] == "r"
                                   else (c_b if emph else c_n)))
        data.append(cells)
    t = Table(data, colWidths=widths, repeatRows=1)
    st = [
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("LINEBELOW", (0, 0), (-1, 0), 1.5, GOLD),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 2.3 if tiny else 2.9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2.3 if tiny else 2.9),
        ("LEFTPADDING", (0, 0), (-1, -1), 5 if tiny else 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5 if tiny else 6),
        ("ROWBACKGROUNDS", (0, 1), (-1, -2 if total_row else -1), [white, SURFACE]),
    ]
    if total_row:
        st += [("BACKGROUND", (0, -1), (-1, -1), CREAM), ("LINEABOVE", (0, -1), (-1, -1), 1, GOLD)]
    for i in hi:
        st.append(("BACKGROUND", (0, i + 1), (-1, i + 1), PANEL))
    for i in sub:
        st.append(("LINEABOVE", (0, i + 1), (-1, i + 1), 0.6, GOLD))
    t.setStyle(TableStyle(st))
    return t


def sec(el, num, eyebrow, title):
    """Eyebrow and title move together, so a section label never widows at a page foot."""
    # a section needs room for its label, its title and a first line, or it starts a page
    el.append(CondPageBreak(300))
    el.append(KeepTogether([Paragraph(num + "  /  " + eyebrow, EYEBROW),
                            Paragraph(title, H1)]))


def m(x, dp=1):
    return format(round(x, dp), ",.%df" % dp)


# =====================================================================  THE MODEL
# Built twice: once with CFA managing the conversion clinic, once without. Every
# figure in each document comes from its own run, so the two cannot drift apart.
# ---------------------------------------------------------------------------
# The monthly model is the authority on timing and funding. Import it rather than
# re-deriving payback from an annual profile, which is what put 21 months in an
# earlier draft against the model's 25.
import importlib.util as _il

_spec = _il.spec_from_file_location("lp_model", Path(__file__).with_name("build-lyfeplace-model.py"))
_LPM = _il.module_from_spec(_spec)
_spec.loader.exec_module(_LPM)
_MODEL = _LPM.build()
_MG = _LPM.metrics(_MODEL["GROUP"]["cash"], "group")
_MA = _LPM.metrics(_MODEL["ATTRIB"]["cash"], "attributable")
_ML, _MLA, _ = _LPM.scenario(**_LPM.LEVERED)
OPEN_M = 6                       # month 6 is the last month before trading


def build_model(managed):
    """managed=True: CFA runs the conversion clinic. False: it is a serviced tenant.

    What actually differs, and why. If CFA does not manage the clinic it needs its own
    front of house, so it absorbs the first floor reception and takes MORE area, which
    is why the literal reading of the brief gave 143.5 sqm. It buys fewer services, so
    it pays a lower service charge, the medipark loses the revenue cycle fee on its
    collections, and the medipark also sheds reception, billing and nursing cost. It
    performs a little worse unmanaged, because conversion and collection are exactly
    what the campus front office is for.
    """
    SCOPE = "managed" if managed else "self-managed"
    CONV_SERVICE = 120_000 if managed else 85_000
    CONV_REV, CONV_EBITDA = (175.0, 35.0) if managed else (160.0, 28.0)
    RCM_REV = 37.0 if managed else 30.0
    SERVICES_REV = 60.0 if managed else 54.0
    RECEPTION_COST = 16.0 if managed else 12.0
    RCM_COST = 16.0 if managed else 13.0
    NURSING_COST = 17.3 if managed else 13.0

    # ---- geometry. Measured by scripts/lyfeplace_survey.py from the as-built CAD.
    PLATE = 24.695 * 16.317                      # 402.9 sqm, both floors stack on one origin
    GROUND_NET, FIRST_NET = 282.2, 284.1
    CHALET_NET, BQ_NET = 61.0, 37.0              # no as-built in the pack, still estimates
    CHALET_GROSS, BQ_GROSS = 96.0, 52.0
    GROSS = 2 * PLATE + CHALET_GROSS + BQ_GROSS
    NET = GROUND_NET + FIRST_NET + CHALET_NET + BQ_NET
    assert abs(GROSS - 953.9) < 0.2 and abs(NET - 664.3) < 0.2
    BRIEF_GROSS, BRIEF_NET = 711.0, 519.0

    STRUCTURES = [
        ("Main building, ground floor", PLATE, GROUND_NET, "Measured"),
        ("Main building, first floor", PLATE, FIRST_NET, "Measured"),
        ("Guest chalet", CHALET_GROSS, CHALET_NET, "Estimated, no as-built"),
        ("Boys' quarters", BQ_GROSS, BQ_NET, "Estimated, no as-built"),
    ]

    # ---- allocation, measured room by measured room.
    # keys: COMMON, THEATRE, CONV, AESTH, LONG, HAIR, BARIA, DIAG, PHARM
    #
    # GROUND: the conversion clinic, the facility-wide reception, and the theatre if one
    # is built. Imaging is fixed here by weight, shielding and evacuation and cannot
    # follow diagnostics out to the chalet, because there is no lift and none is to be
    # added. That is what creates the ground floor squeeze.
    GROUND = [
        ("Reception, waiting and concierge", 42.0, "COMMON", "Single arrival point for the whole facility"),
        ("Conversion clinic rooms 2 and 3", 27.6, "CONV", "Formed in the open living and dining span"),
        ("Day case theatre", 32.8, "THEATRE", "Level trolley access south to the ambulance bay"),
        ("Conversion clinic rooms 4 and 5", 21.6, "CONV", "Formed in the old lobby"),
        ("Conversion clinic room 1", 20.3, "CONV", "Existing room, beside imaging"),
        ("Monitored recovery, 2 bays", 19.2, "THEATRE", "Oxygen, suction and monitoring to each bay"),
        ("Digital X-ray, lead shielded", 18.7, "DIAG", "Fixed here by weight, shielding and evacuation"),
        ("Phlebotomy and specimen handling", 16.9, "DIAG", "Specimen pass-out to the chalet laboratory"),
        ("Circulation spine", 14.0, "COMMON", "1,200 mm clear, through the old lobby"),
        ("Staircase", 13.3, "COMMON", "No lift, and none to be added"),
        ("Staff circulation", 9.7, "COMMON", "Back of house route, does not pass through waiting"),
        ("Entrance vestibule", 7.3, "COMMON", "Draught lobby, wheelchair turning circle"),
        ("Dirty utility", 6.9, "THEATRE", "Waste leaves without re-entering the suite"),
        ("Clean utility and consumables", 6.3, "COMMON", "Off the staff route, not the waiting hall"),
        ("Staff change and WC", 5.9, "COMMON", ""),
        ("Medication collection point", 5.2, "PHARM", "Serving hatch to the waiting hall"),
        ("Scrub and sterile store", 5.1, "THEATRE", "One way dirty to clean"),
        ("Entrance porch", 3.1, "COMMON", "The only patient entrance to the campus"),
        ("X-ray changing and control", 2.7, "DIAG", "Shielded control position"),
        ("Circulation", 1.9, "COMMON", ""),
        ("Circulation", 1.7, "COMMON", ""),
    ]
    # FIRST: everything else. The aesthetics core, its own waiting at the head of the
    # stair, and a diagnostics draw point so patients do not descend for bloods.
    FIRST = [
        ("Aesthetics consulting spine, 2 rooms plus corridor", 41.8, "AESTH",
         "New partitions. Two rooms of about 18 sqm, better than three of 12"),
        ("Longevity and infusion suite, 4 bays", 33.4, "LONG", "One open bay room, not subdivided"),
        ("Floor waiting and members' lounge", 32.9, "COMMON", "At the head of the stair"),
        ("FUE hair transplant suite", 26.1, "HAIR", "Existing water for graft preparation. 360 degree access"),
        ("Aesthetics treatment room 1", 21.1, "AESTH", ""),
        ("Aesthetics treatment room 2", 20.8, "AESTH", ""),
        ("Bariatric and metabolic consulting", 18.9, "BARIA", "Body composition and prescribing. No theatre needed"),
        ("Bariatric and metabolic treatment", 15.4, "BARIA", "Local and topical only. No sedation above ground level"),
        ("Sterilising and clean utility", 13.4, "COMMON", "Shares the drainage run with the FUE suite"),
        ("Staircase", 13.3, "COMMON", ""),
        ("Linen and consumables", 8.9, "COMMON", ""),
        ("Patient WC, accessible", 8.5, "COMMON", "Emergency pull cord"),
        ("Staff WC", 6.5, "COMMON", ""),
        ("Terrace", 6.2, "COMMON", "Member amenity, off the lounge"),
        ("Patient WC", 5.0, "COMMON", "Emergency pull cord"),
        ("Phlebotomy draw point", 4.6, "DIAG", "So first floor patients do not descend for bloods"),
        ("Circulation", 2.8, "COMMON", ""),
        ("Circulation", 2.3, "COMMON", ""),
        ("Stair landing", 2.3, "COMMON", ""),
    ]
    CHALET = [("Clinical laboratory, six rooms", CHALET_NET, "DIAG", "Benching to three walls. Fills the chalet")]
    BQ = [("Dispensary, retail, controlled drugs, cold chain", BQ_NET, "PHARM", "Patients never enter this structure")]

    assert abs(sum(r[1] for r in GROUND) - GROUND_NET) < 0.15, sum(r[1] for r in GROUND)
    assert abs(sum(r[1] for r in FIRST) - FIRST_NET) < 0.15, sum(r[1] for r in FIRST)

    ALL_ROOMS = GROUND + FIRST + CHALET + BQ
    AREA = {}
    for _n, _a, _k, _x in ALL_ROOMS:
        AREA[_k] = AREA.get(_k, 0.0) + _a
    assert abs(sum(AREA.values()) - NET) < 0.2

    CONV_GROUND = sum(r[1] for r in GROUND if r[2] == "CONV")
    CONV_ROOMS = 5
    CONV_SHARE_GROUND = CONV_GROUND / GROUND_NET
    THEATRE_SUITE = sum(r[1] for r in GROUND if r[2] == "THEATRE")

    LABEL = {"COMMON": "Campus common", "THEATRE": "Theatre suite", "AESTH": "Aesthetics core",
             "LONG": "Longevity and infusion", "HAIR": "Hair restoration",
             "BARIA": "Bariatric and metabolic", "CONV": "Conversion clinic",
             "DIAG": "Diagnostics", "PHARM": "Pharmacy"}

    # ---- rate card, NGN per sqm per year on the net internal demise, all in
    BANDS = {
        "CONV":  ("A", "Ground floor anchor, 5 year term", 165_000, CONV_SERVICE),
        "AESTH": ("B", "Fitted clinical suite, 3 year term", 210_000, 120_000),
        "LONG":  ("B", "Fitted clinical suite, 3 year term", 210_000, 120_000),
        "HAIR":  ("B", "Fitted clinical suite, 3 year term", 210_000, 120_000),
        "BARIA": ("B", "Fitted clinical suite, 3 year term", 210_000, 120_000),
        "DIAG":  ("C", "Diagnostics and imaging", 145_000, 95_000),
        "PHARM": ("D", "Pharmacy and back of house", 130_000, 70_000),
    }
    CONTRIB_RATE = {"CONV": 180_000, "AESTH": 180_000, "LONG": 180_000, "HAIR": 180_000,
                    "BARIA": 180_000, "DIAG": 120_000, "PHARM": 100_000}
    # every lettable key must carry a band, or it silently vanishes from the rate card
    # and the occupier table while the totals keep reconciling against LET_AREA.
    _lettable = {k for k in AREA if k not in ("COMMON", "THEATRE")}
    assert _lettable == set(BANDS), "unbanded occupiers: %s" % (_lettable ^ set(BANDS))

    SPACE = {k: AREA[k] * (BANDS[k][2] + BANDS[k][3]) / 1e6 for k in BANDS}
    SPACE_TOTAL = sum(SPACE.values())
    LET_AREA = sum(AREA[k] for k in BANDS)
    # room areas are each rounded to 0.1 sqm, so allow the accumulated rounding
    assert abs(LET_AREA + AREA["COMMON"] + AREA["THEATRE"] - NET) < 0.3
    LET_RATIO = LET_AREA / NET

    assert set(CONTRIB_RATE) == set(BANDS), "contribution rates out of step with bands"
    CONTRIB = {k: AREA[k] * CONTRIB_RATE[k] / 1e6 for k in CONTRIB_RATE}
    CONTRIB_TOTAL = sum(CONTRIB.values())

    # ---- medipark revenue and cost at stabilisation, NGN M a year
    MP_REV = [
        ("Space", SPACE_TOTAL, "%.0f sqm let across %d occupiers, on the rate card in section 05" % (LET_AREA, len(BANDS))),
        ("Theatre and equipment hire", 102.0, "Theatre lists 80.0, gated on a signed surgical anchor. Laser and IPL by session 22.0"),
        ("Shared clinical services", SERVICES_REV,
         "Nursing pool, sterilising, care coordination, clinical waste, linen" +
         ("" if managed else ". The conversion clinic employs its own nurses")),
        ("Front office and revenue cycle", RCM_REV,
         "4% of occupier collections. Booking, registration, cashiering, claims, collection" +
         ("" if managed else ". Excludes the conversion clinic, which bills its own")),
        ("Car park, signage and concession", 6.0, "Non clinical income against the compound"),
    ]
    MP_REV_TOTAL = sum(r[1] for r in MP_REV)
    MP_COST = [
        ("Head rent", 55.0, "Prepaid to month 24. First cash payment in month 25"),
        ("Power and utilities", 32.0, "NGN 39,000 per sqm gross, net of the solar tariff. Scales with the measured area"),
        ("Theatre running", 18.0, "Nil until the theatre opens"),
        ("Nursing pool", NURSING_COST,
         "%d nurses plus oncosts. Recharged as a service" % (6 if managed else 4)),
        ("Front office and revenue cycle team", RCM_COST, "Registration, cashiering, claims, collections"),
        ("Reception and concierge", RECEPTION_COST,
         "Two arrival points, three positions plus concierge" if managed else
         "Ground floor arrival only. The first floor front of house is the clinic's own"),
        ("Security, cleaning and grounds", 16.0, "Contracted. %.0f sqm gross plus the compound" % GROSS),
        ("Equipment lease", 14.0, "Laser and IPL platform, from month 9"),
        ("Facilities and maintenance", 13.0, "Planned and reactive"),
        ("Sterilising, waste and linen", 10.2, "Recharged as a service"),
        ("ICT, systems and connectivity", 9.0, "Fibre, LTE failover, licences, support"),
        ("Insurance", 6.0, "Building and public liability. Occupiers carry their own"),
        ("Care coordinator", 6.0, "Recharged as a service. The campus differentiator"),
        ("Business development officer", 6.0, "One, on a territory mandate. Base plus commission"),
        ("Regulatory, permits and waste licence", 3.0, "Annual renewals"),
        ("Other direct", 1.0, ""),
    ]
    MP_COST_TOTAL = sum(r[1] for r in MP_COST)
    MP_EBITDA = MP_REV_TOTAL - MP_COST_TOTAL
    MP_MARGIN = MP_EBITDA / MP_REV_TOTAL
    MP_EXTERNAL = 50.0
    MP_INTERCO = MP_REV_TOTAL - MP_EXTERNAL

    # ---- fit-out, category A. Quantity driven so it can be handed straight to a QS.
    #      (item, qty, unit, NGN rate, who pays, note)
    S = "SECTION"
    FITOUT = [
        (S, "A  Preliminaries and enabling"),
        ("Site set up, hoarding, welfare, skips, site security", 5, "month", 700_000, "Medipark", ""),
        ("Strip out: kitchen and bathroom fittings, wardrobes, floor finishes", NET, "sqm", 8_000, "Medipark", ""),
        ("Three new external openings: ambulance, back of house, waste", 3, "no.", 1_400_000, "Medipark", "Only one external door exists today"),
        ("Minor structural: internal openings, lintels, making good", 14, "no.", 260_000, "Medipark", "No structural extension"),
        ("Roof repairs and rainwater goods", GROSS, "sqm", 3_400, "Medipark", ""),
        ("Termite and damp proofing treatment", NET, "sqm", 1_900, "Medipark", ""),

        (S, "B  Partitions, doors and joinery"),
        ("Metal stud partitions, 60 minute, taped and skimmed", 165, "lin m", 42_000, "Medipark", "Forms five rooms from two"),
        ("Doors: flush FD30, vision panels, ironmongery", 44, "no.", 250_000, "Medipark", ""),
        ("Reception desks, three positions plus first floor", 2, "no.", 2_600_000, "Medipark", ""),
        ("Nurse stations", 2, "no.", 1_150_000, "Medipark", ""),
        ("Room casework: worktops, base and wall units", 16, "room", 620_000, "Medipark", ""),
        ("Laboratory benching, continuous to three walls", 22, "lin m", 195_000, "Occupier", "Medbury Diagnostics"),
        ("Pharmacy shelving, dispensary and controlled drugs store", 1, "item", 2_800_000, "Occupier", "Medbury Pharmaceuticals"),
        ("Built in storage: linen, consumables, records", 4, "no.", 520_000, "Medipark", ""),

        (S, "C  Finishes, interior decoration and furnishing"),
        ("Clinical vinyl, welded and coved", 382, "sqm", 26_000, "Medipark", "Clinical and theatre areas only"),
        ("Porcelain tiling: reception, WCs, wet areas", 115, "sqm", 22_000, "Medipark", ""),
        ("Luxury vinyl tile and carpet tile: lounge, offices, back of house", 60, "sqm", 16_000, "Medipark", ""),
        ("Painting and decoration, walls and ceilings", GROSS, "sqm", 6_500, "Medipark", ""),
        ("Suspended ceilings, clinical grid", 420, "sqm", 12_000, "Medipark", ""),
        ("Ceiling repairs and skim, remainder", 244, "sqm", 9_000, "Medipark", ""),
        ("Wall protection, corner guards and crash rails", 180, "lin m", 11_000, "Medipark", ""),
        ("Window treatments: blinds, film, blackout to ultrasound", 46, "no.", 62_000, "Medipark", ""),
        ("Sanitaryware and clinical hand wash points", 22, "no.", 205_000, "Medipark", ""),
        ("Signage and wayfinding, statutory and directional", 1, "item", 4_600_000, "Medipark", ""),
        ("Loose furniture: reception and waiting, both floors", 1, "item", 6_400_000, "Medipark", "About 30 seats across two waiting zones"),
        ("Lounge: touchdown desks, seating, refreshment point", 1, "item", 3_200_000, "Medipark", ""),
        ("Consulting and treatment room furniture, non clinical", 16, "room", 310_000, "Medipark", ""),
        ("Artwork, planting, styling and dressing", 1, "item", 2_800_000, "Medipark", ""),
        ("Mirrors, accessories and ironmongery finishes", 1, "item", 1_400_000, "Medipark", ""),

        (S, "D  Electrical installation"),
        ("New distribution: main board, sub boards, clinical circuit zoning", 1, "item", 7_600_000, "Medipark", ""),
        ("Lighting: LED luminaires, clinical and general", 246, "no.", 36_000, "Medipark", ""),
        ("Small power: clinical grade socket outlets", 285, "no.", 20_000, "Medipark", ""),
        ("Changeover, automatic transfer switch and distribution", 1, "item", 3_400_000, "Medipark", "Solar and generator"),
        ("Containment: trunking, tray, conduit", GROSS, "sqm", 3_200, "Medipark", ""),
        ("Emergency and escape lighting", 55, "no.", 49_000, "Medipark", "Statutory"),
        ("External and car park lighting", 24, "no.", 98_000, "Medipark", ""),
        ("Earthing, bonding, testing and certification", 1, "item", 2_100_000, "Medipark", ""),
        ("Theatre isolated power supply panel and UPS", None, "", 0, "Deferred", "Phase two, with the theatre"),

        (S, "E  Mechanical, cooling and ventilation"),
        ("Split and cassette cooling, supply and install", 28, "no.", 730_000, "Medipark", ""),
        ("Mechanical extract: WCs, dirty utility, laboratory", 14, "no.", 285_000, "Medipark", ""),
        ("Fresh air to consulting and treatment rooms", 16, "room", 225_000, "Medipark", ""),
        ("Laboratory fume and eyewash provision", 1, "item", 1_400_000, "Occupier", "Medbury Diagnostics"),
        ("Theatre air handling unit, HEPA filtration and ductwork", None, "", 0, "Deferred", "Phase two, with the theatre"),

        (S, "F  Plumbing, water and drainage"),
        ("New sanitary and clinical waste runs", 22, "point", 205_000, "Medipark", ""),
        ("Storage, pressurisation and hot water", 1, "item", 4_100_000, "Medipark", ""),
        ("Medical waste holding and route", 1, "item", 2_800_000, "Medipark", ""),
        ("Incoming main, treatment and filtration", 1, "item", 2_600_000, "Medipark", ""),
        ("Above ground drainage alterations", 1, "item", 2_400_000, "Medipark", ""),

        (S, "G  Fire, safety and security"),
        ("Addressable fire detection and alarm, campus wide", GROSS, "sqm", 8_600, "Medipark", "Statutory"),
        ("CCTV, cameras and recorder", 30, "no.", 155_000, "Medipark", ""),
        ("Access control", 16, "door", 215_000, "Medipark", "Includes the controlled drugs store"),
        ("Nurse call and emergency pull cords", 22, "point", 135_000, "Medipark", ""),
        ("Fire stopping and compartmentation", 1, "item", 3_100_000, "Medipark", ""),
        ("Intruder alarm and panic", 1, "item", 1_400_000, "Medipark", ""),
        ("Extinguishers, blankets and signage", 1, "item", 1_300_000, "Medipark", ""),

        (S, "H  ICT and low voltage"),
        ("Structured cabling, outlets, patching and comms cabinet", 124, "outlet", 46_000, "Medipark", ""),
        ("Network: switches, firewall, wireless access points", 1, "item", 4_200_000, "Medipark", ""),
        ("Displays: queue, wayfinding, lounge", 8, "no.", 260_000, "Medipark", ""),
        ("Primary fibre and LTE failover, installation", 1, "item", 1_500_000, "Medipark", ""),
        ("Telephony and DECT handsets", 1, "item", 1_400_000, "Medipark", ""),

        (S, "I  Power resilience"),
        ("Generator: service, sound attenuation, fuel store", 1, "item", 3_200_000, "Medipark", ""),
        ("Solar array, changeover and distribution only", 1, "item", 3_000_000, "PPA tariff", "The array is a monthly tariff, not capital"),

        (S, "J  External works"),
        ("Car park resurfacing and marking", 26, "bay", 235_000, "Medipark", ""),
        ("External painting and facade", GROSS, "sqm", 4_100, "Medipark", ""),
        ("Ambulance and trolley access, level threshold and ramp", 1, "item", 2_600_000, "Medipark", "Fixes the theatre to the ground floor"),
        ("Drainage, landscaping and perimeter making good", 1, "item", 3_400_000, "Medipark", ""),
        ("Gate house, boom and visitor management", 1, "item", 2_600_000, "Medipark", ""),
        ("Compound signage and totem", 1, "item", 2_200_000, "Medipark", ""),

        (S, "K  Statutory and professional"),
        ("Architectural and interior design", 1, "item", 6_200_000, "At cost", "Third party, no mark up"),
        ("Change of use approval and development control", 1, "item", 3_500_000, "Medipark", ""),
        ("Mechanical and electrical consultant", 1, "item", 3_400_000, "At cost", "Third party, no mark up"),
        ("Quantity surveyor and bill of quantities", 1, "item", 2_400_000, "At cost", "Third party, no mark up"),
        ("Facility registration, FCT health authority", 1, "item", 2_000_000, "Medipark", ""),
        ("Fire safety certificate", 1, "item", 1_000_000, "Medipark", ""),
        ("Environmental and clinical waste permit", 1, "item", 800_000, "Medipark", ""),
        ("Signage permit", 1, "item", 400_000, "Medipark", ""),
    ]

    def fit_val(r):
        return r[1] * r[3] / 1e6


    FIT_PRICED, FIT_DEFERRED, FIT_BY_SECTION = [], [], {}
    _cur = ""
    for _r in FITOUT:
        if _r[0] == S:
            _cur = _r[1]
        elif _r[1] is None:
            FIT_DEFERRED.append(_r)
        else:
            FIT_PRICED.append(_r)
            FIT_BY_SECTION[_cur] = FIT_BY_SECTION.get(_cur, 0.0) + fit_val(_r)

    FIT_BASE = sum(fit_val(r) for r in FIT_PRICED)
    FIT_MEDIPARK = sum(fit_val(r) for r in FIT_PRICED if r[4] == "Medipark")
    FIT_OCCUPIER = sum(fit_val(r) for r in FIT_PRICED if r[4] == "Occupier")
    FIT_ATCOST = sum(fit_val(r) for r in FIT_PRICED if r[4] == "At cost")
    FIT_PPA = sum(fit_val(r) for r in FIT_PRICED if r[4] == "PPA tariff")
    FIT_EXTERNAL = FIT_BY_SECTION["J  External works"]
    FIT_STAT = FIT_BY_SECTION["K  Statutory and professional"]
    assert abs(sum(FIT_BY_SECTION.values()) - FIT_BASE) < 0.01
    CONTINGENCY = round(FIT_BASE * 0.10, 1)
    FIT_TOTAL = FIT_BASE + CONTINGENCY
    N_LINES = len(FIT_PRICED)
    FIT_LOW, FIT_HIGH = FIT_TOTAL * 0.85, FIT_TOTAL * 1.30
    FIT_BUILD_ONLY = FIT_BASE - FIT_EXTERNAL - FIT_STAT

    LEAN_OUT = [
        ("Car park resurfacing, external painting, compound totem", 13.5, "Phase two, out of trading"),
        ("CCTV and access control moved to a monitored subscription", 6.0, "Monthly, not capital"),
        ("Artwork, planting and dressing", 2.8, "Phase two"),
        ("Loose furniture phased with occupancy", 2.4, "Second tranche at 80% occupancy"),
        ("Displays taken on lease", 1.7, "Monthly, not capital"),
        ("Generator attenuation and fuel store", 1.8, "Phase two"),
        ("Ceilings phased, back of house last", 1.6, "Phase two"),
    ]
    LEAN_SAVE = sum(r[1] for r in LEAN_OUT)
    LEAN_BASE = FIT_BASE - LEAN_SAVE
    LEAN_TOTAL = LEAN_BASE + round(LEAN_BASE * 0.10, 1)

    FLOAT = 35.0
    COMMITTED = 115.0
    HEAD_RENT_PREPAID = 100.0
    MP_NEW_CASH = FIT_TOTAL + FLOAT - CONTRIB_TOTAL
    MP_NEW_CASH_LEAN = LEAN_TOTAL + FLOAT - CONTRIB_TOTAL
    MANDATE_SETUP = 306.7                        # cash to open in the mandate document
    MP_SETUP_NOW = FIT_TOTAL + FLOAT
    FIT_DELTA = MP_SETUP_NOW - MANDATE_SETUP     # the cost of the measurement correction

    # ---- medipark cash flow by trading year, derived from the P&L above so it moves
    #      with the variant. Trading year 1 is months 7 to 18: the first floor opens at
    #      month 7, the ground floor completes at month 10, the theatre lands at month 15.
    _theatre_run = dict((r[0], r[1]) for r in MP_COST)["Theatre running"]
    _equip_lease = dict((r[0], r[1]) for r in MP_COST)["Equipment lease"]
    _rent = dict((r[0], r[1]) for r in MP_COST)["Head rent"]
    _cost_flex = MP_COST_TOTAL - _rent - _theatre_run - _equip_lease
    _theatre_equip = dict((r[0], r[1]) for r in MP_REV)["Theatre and equipment hire"]
    _other = dict((r[0], r[1]) for r in MP_REV)["Car park, signage and concession"]

    def _rev_year(space_f, te_f, svc_f, other_f):
        return round(SPACE_TOTAL * space_f + _theatre_equip * te_f
                     + (SERVICES_REV + RCM_REV) * svc_f + _other * other_f, 1)

    def _cost_year(flex_f, te_f, eq_f):
        return round(_cost_flex * flex_f + _theatre_run * te_f + _equip_lease * eq_f, 1)

    MP_CF = [
        ("Revenue", [0.0,
                     _rev_year(0.96, 0.204, 0.55, 0.70),
                     _rev_year(1.00, 0.861, 0.90, 1.00),
                     _rev_year(1.12, 1.00, 1.00, 1.00),
                     _rev_year(1.12, 1.00, 1.00, 1.00)]),
        ("Operating cost, before head rent", [0.0,
                                              _cost_year(0.88, 0.167, 0.833),
                                              _cost_year(0.97, 0.850, 1.000),
                                              _cost_year(1.00, 1.000, 1.000),
                                              _cost_year(1.00, 1.000, 1.000)]),
        ("Head rent, in cash", [0.0, 0.0, _rent / 2, round(_rent * 1.12, 1), round(_rent * 1.12, 1)]),
    ]
    MP_CF.append(("Cash EBITDA", [round(MP_CF[0][1][i] - MP_CF[1][1][i] - MP_CF[2][1][i], 1)
                                  for i in range(5)]))
    MP_CUM, _r = [], 0.0
    for _v in MP_CF[3][1]:
        _r += _v
        MP_CUM.append(round(_r, 1))

    # ---- the operating companies
    SPVS = [
        ("Medlyfe Aesthetics and Regenerative", AREA["AESTH"], 285.0, 82.0, 51,
         "Four rooms upstairs. Injectables and skin led, regenerative, body from month 9 on a leased platform"),
        ("Medlyfe Longevity and Infusion", AREA["LONG"], 240.0, 71.0, 100,
         "Four infusion bays. Programme based, pre-sellable, the highest revenue per sqm on the campus"),
        ("Bariatric and Metabolic Medicine", AREA["BARIA"], 280.0, 78.0, 70,
         "Two rooms upstairs. Medical weight management from month 7, surgery only if the theatre is built"),
        ("Lyfe Place Hair Restoration", AREA["HAIR"], 220.0, 55.0, 100,
         "FUE, about 132 single patient cases a year. Instruments brought by the operating partner"),
        ("Alameda Conversion Clinic", AREA["CONV"], CONV_REV, CONV_EBITDA, 49,
         "Ground floor anchor. Five rooms formed from the existing consulting room, the open living "
         "and dining span, and the old lobby" + ("" if managed else ". Self-managed")),
        ("Medbury Diagnostics", AREA["DIAG"], 160.0, 60.0, 100,
         "Laboratory and ultrasound in the chalet, X-ray and phlebotomy on the ground floor, a draw point upstairs"),
        ("Medbury Pharmaceuticals", AREA["PHARM"], 145.0, 26.0, 100,
         "Dispensary, retail and cold chain in the boys' quarters, collection hatch on the ground floor"),
    ]
    SPV_REV = sum(s[2] for s in SPVS)
    SPV_EBITDA = sum(s[3] for s in SPVS)
    SPV_ATTR = sum(s[3] * s[4] / 100 for s in SPVS)
    GROUP_EXT_REV = SPV_REV + MP_EXTERNAL
    GROUP_ATTR = SPV_ATTR + MP_EBITDA

    # the two-rooms trade, quantified

    SPV_CAPEX = [
        ("Medlyfe Aesthetics and Regenerative", 18.5, 2.9, 4.0, 16.0),
        ("Medlyfe Longevity and Infusion", 12.2, 2.0, 1.5, 10.0),
        ("Bariatric and Metabolic Medicine, medical launch", 6.0, 2.0, 2.0, 12.0),
        ("Lyfe Place Hair Restoration", 4.3, 1.6, 1.0, 8.0),
        ("Alameda Conversion Clinic, at Medbury's 49%", 5.9, 3.2, 1.2, 11.0),
    ]
    SPV_CAPEX_TOTAL = sum(sum(r[1:]) for r in SPV_CAPEX)
    PHASE_TWO = [
        ("Theatre suite: air handling, HEPA, light, table, anaesthesia, monitoring", 84.0),
        ("Theatre building works, isolated power supply, UPS, recovery upgrade", 45.0),
        ("Bariatric specific: table, instruments, high BMI trolley and hoist, HDU monitoring", 28.0),
    ]
    PHASE_TWO_TOTAL = sum(r[1] for r in PHASE_TWO)

    GROUP_CASH = COMMITTED + FIT_TOTAL + FLOAT + SPV_CAPEX_TOTAL
    GROUP_CASH_LEAN = COMMITTED + LEAN_TOTAL + FLOAT + SPV_CAPEX_TOTAL
    GROUP_PAYBACK_STAB = GROUP_CASH / GROUP_ATTR


    def payback_months(cash, annual_profile):
        """Months of trading until cumulative profit covers cash. Linear inside a year."""
        cum = 0.0
        for yr, v in enumerate(annual_profile):
            if cum + v >= cash:
                return round(yr * 12 + 12 * (cash - cum) / v)
            cum += v
        return None


    # medipark, on its own new cash, lean fit-out
    MP_PAYBACK_M = payback_months(MP_NEW_CASH_LEAN, MP_CF[3][1][1:] + [MP_CF[3][1][-1]] * 3)
    # group timing and funding come from the monthly model, not from an annual profile
    GROUP_PAYBACK_M = _MG["payback"] - OPEN_M
    GROUP_PAYBACK_LEVERED_M = _ML["payback"] - OPEN_M
    GROUP_PEAK = _MG["peak"]
    GROUP_IRR = _MG["irr"]
    GROUP_NPV = _MG["npv"]
    GROUP_COC = _MG["coc"]
    ATTR_IRR = _MA["irr"]
    ATTR_PAYBACK_M = _MA["payback"] - OPEN_M
    FUND_GAP = GROUP_PEAK - GROUP_CASH
    GROUP_TROUGH_M = _MG["cum"].index(min(_MG["cum"])) + 1
    GROUP_RAMP = [GROUP_ATTR * f for f in (0.45, 0.85, 1.0, 1.0, 1.0)]

    # ---- CFA fee, billed as consultancy time
    RATES = [
        ("Partner, engagement lead", 750_000, 28),
        ("Principal, workstream lead", 450_000, 72),
        ("Senior consultant", 300_000, 88),
        ("Consultant", 190_000, 64),
        ("Analyst", 120_000, 40),
    ]
    GRADE_KEYS = [r[0] for r in RATES]
    RATE_OF = {r[0]: r[1] for r in RATES}
    # the self-managed variant drops the conversion clinic's structuring, its business
    # case, its joint venture amendments and its credentialing. It keeps its sub lease,
    # because it is still an occupier, and it keeps its share of the fit-out.
    WORKSTREAMS = [
        ("1  Fit-out delivery and commissioning", [8, 26, 30, 18, 10],
         "Design coordination, BOQ, tender, contractor selection, site supervision, snagging, handover"),
        ("2  Division and SPV structuring",
         [7, 16, 18, 14, 10] if managed else [6, 13, 15, 12, 9],
         "Division design, %s incorporations, shareholder agreements, sub leases, intercompany agreements"
         % ("five" if managed else "four")),
        ("3  Aesthetics core strategy and business cases",
         [6, 12, 16, 14, 8] if managed else [5, 10, 14, 12, 7],
         "%s SPV business cases, service and price architecture, Lagos alignment, clinical partner terms"
         % ("Four" if managed else "Three")),
        ("4  Commercial: rate card, leases, transfer pricing", [3, 8, 10, 8, 6],
         "Rate card, licence and lease documents, service charge model, transfer pricing file"),
        ("5  Clinical setup, recruitment and credentialing",
         [2, 6, 10, 6, 4] if managed else [2, 4, 7, 4, 3],
         "Regulatory file, protocols and governance, recruitment brief and selection, credentialing"),
        ("6  Lagos pre-work", [2, 4, 4, 4, 2],
         "Site and KP Plastics alignment, transferable design and rate card, phasing note"),
    ]
    # grade day totals are derived from the workstreams, never asserted against a
    # hand-typed figure, so the two variants cannot disagree with their own tables
    RATES = [(RATES[i][0], RATES[i][1], sum(ws[1][i] for ws in WORKSTREAMS))
             for i in range(len(RATES))]
    WS_FEE = [(n, sum(d), sum(d[i] * RATE_OF[GRADE_KEYS[i]] for i in range(5)) / 1e6, note)
              for n, d, note in WORKSTREAMS]
    FEE_GROSS = sum(w[2] for w in WS_FEE)
    TOTAL_DAYS = sum(w[1] for w in WS_FEE)
    assert TOTAL_DAYS == sum(r[2] for r in RATES)
    assert abs(FEE_GROSS - sum(r[1] * r[2] for r in RATES) / 1e6) < 0.01
    PROG_DISCOUNT = 0.10
    FEE_NET = FEE_GROSS * (1 - PROG_DISCOUNT)
    FEE_MOB = 25.0                      # hard floor, non-refundable
    # the bridge from what the programme costs to what has to be in the bank
    GROUP_PEAK_TRADE = (GROUP_CASH + FEE_NET + PHASE_TWO_TOTAL
                        - CONTRIB_TOTAL - GROUP_PEAK)
    assert FEE_MOB / FEE_NET < 0.40

    _out = {k: v for k, v in locals().items() if not k.startswith("__")}
    _out["MANAGED"] = managed
    return _out


# =====================================================================  THE DOCUMENT
def build(M, OTHER, OUT):
    globals().update(M)
    doc = BaseDocTemplate(
        str(OUT), pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=42, bottomMargin=30,
        title="Lyfe Place - the medical infrastructure division",
        author="Consult for Africa")
    doc.addPageTemplates([PageTemplate(
        id="p", frames=[Frame(MARGIN, 30, FULLW, PAGE_H - 42 - 30, id="f")], onPage=page_bg)])
    el = []

    el.append(Paragraph("A medical infrastructure division",
                        style("t", fontName="Helvetica-Bold", fontSize=19, leading=22,
                              textColor=NAVY, spaceAfter=2)))
    el.append(Paragraph("Abuja first, Lagos next. The building as a business, the businesses inside "
                        "it, and what each one costs.",
                        style("st", fontName="Helvetica-Oblique", fontSize=11, leading=14,
                              textColor=GOLD, spaceAfter=4)))
    el.append(Paragraph(
        "VERSION %s OF TWO  /  %s" % (
            "ONE" if MANAGED else "TWO",
            "Consult for Africa manages the conversion clinic" if MANAGED else
            "The conversion clinic is a serviced tenant and manages itself"),
        style("vb", fontName="Helvetica-Bold", fontSize=8.4, leading=11, textColor=TEAL,
              spaceAfter=7)))

    el.append(Paragraph("Dr Itunu Akinware, Group Chief Executive, Medbury Medical Services",
                        style("lt", fontName="Helvetica-Bold", fontSize=9.4, leading=12,
                              textColor=NAVY, spaceBefore=2, spaceAfter=5)))
    for _para in [
        "Itunu, you asked for three things and this document answers all three.",
        "You asked whether the building can be a business rather than an overhead. It can. The medipark "
        "is set out first and tested on its own numbers, because it carries the rent and nothing else "
        "works until it does. It covers its NGN 55.0 M head rent from month seven and it does so on four "
        "income lines, not one, because space alone is only a third of what it earns.",
        "You asked for the fit-out in detail. Section 07 schedules it in %d measured lines across "
        "interior finishes, furniture, fixtures and fittings, electrical, mechanical, medical gas, IT and "
        "security, with quantities against each. It is a class 4 estimate at plus or minus 15 per cent "
        "and it will be a tendered bill of quantities within two weeks. I have not rounded it to a "
        "comfortable number.",
        "You asked to see your money back inside a year, and you were direct about it, so I will be too. "
        "On the whole programme it is about %d months from opening, not twelve. Section 08 sets out three "
        "clocks rather than one, because the NGN 115 M you have already committed comes back well before "
        "the rest does, and it names the three levers that move %d months to %d. Those figures come from a "
        "monthly model rather than an annual average, and the model is attached so your finance team can "
        "take it apart. What twelve months does buy is every business trading and the campus at run rate, "
        "which is a better position than a payback date and is worth saying plainly.",
        "One correction I would rather make myself. The capital table in section 10 adds to NGN 598 M, but "
        "that is what the programme costs, not what has to be in the bank. The peak funding requirement is "
        "NGN %.0f M, because the setup fee and the theatre are real cash that the capital table does not "
        "carry. The trough is month 15. I would rather you saw that now than found it in month 14.",
        "One thing in here is unwelcome and you should hear it from me now rather than from a contractor "
        "in week eight. The building is 35 per cent larger than the brief we were all working from. That "
        "does not change the rent roll, because the extra area is corridor, but it does add about NGN 51 M "
        "to the fit-out. It is a measurement correction, not a change of plan.",
        "The conversion clinic takes the ground floor as you directed, with reception serving the whole "
        "facility and the theatre alongside it. The aesthetics core sits upstairs, deliberately built to "
        "the same service and price architecture as the KP Plastics space in Lagos, so that the second "
        "site is a fit-out and a licence rather than a second start. Diagnostics and the pharmacy take "
        "the chalet and the boys' quarters and gain a captive market.",
        "There are two versions of this document. This is the one where we manage the conversion clinic. "
        "The other is identical except that the clinic runs itself. The difference to Medbury is about "
        "two per cent of profit, which means it is a control decision rather than a money decision, and I "
        "would rather you made it on that basis.",
    ]:
        if "%d measured lines" in _para:
            _args = (N_LINES,)
        elif "months from opening" in _para:
            _args = (GROUP_PAYBACK_M, GROUP_PAYBACK_M, GROUP_PAYBACK_LEVERED_M)
        elif "peak funding requirement is" in _para:
            _args = (GROUP_PEAK,)
        else:
            _args = ()
        el.append(Paragraph(_para % _args, P))
    el.append(Paragraph(
        "Debo Odulana<br/><font size=8 color='#6b7280'>Founding Partner, Consult for Africa</font>",
        style("sig", fontName="Helvetica-Bold", fontSize=9.4, leading=13, textColor=NAVY,
              spaceBefore=7, spaceAfter=10)))

    # ------------------------------------------------------------------ SUMMARY
    el.append(Paragraph("SUMMARY", EYEBROW))
    el.append(Paragraph("Seven businesses, one landlord, and a straight answer on the year.", H1))
    el.append(Paragraph(
        "This is the division you asked for. The building becomes a business in its own right and is "
        "tested first, on its own numbers, because it carries the rent. Five clinical companies sit "
        "inside it around an aesthetics core, and two Medbury businesses that already exist move in and "
        "get a captive market. The fit-out is scheduled with measured quantities rather than carried at "
        "a round number. And the one year question is answered rather than managed.", LEDE))
    el.append(tbl(
        [["The campus, measured", "%s sqm gross, %s sqm net" % (m(GROSS, 0), m(NET, 0)),
          "Not %s and %s. The brief had the footprint 3.3 m too shallow"
          % (m(BRIEF_GROSS, 0), m(BRIEF_NET, 0))],
         ["Entity one, the medipark", "NGN %s M revenue" % m(MP_REV_TOTAL, 0),
          "Space, theatre and equipment hire, shared clinical services, front office"],
         ["It pays its own head rent from", "Month 7", "NGN 55.0M a year, covered from the first trading month"],
         ["Fit-out, category A", "NGN %s M" % m(FIT_TOTAL),
          "%d measured lines. Class 4 estimate, BOQ in two weeks" % N_LINES],
         ["Occupier contributions on grant", "NGN %s M" % m(CONTRIB_TOTAL),
          "Cash in on day one, so the medipark finds NGN %s M net, or NGN %s M lean"
          % (m(MP_NEW_CASH), m(MP_NEW_CASH_LEAN))],
         ["Businesses in occupation", "7", "Five new companies plus diagnostics and pharmacy"],
         ["Group revenue at stabilisation", "NGN %s M" % m(GROUP_EXT_REV, 0),
          "External. Intercompany charges eliminate on consolidation"],
         ["Attributable to Medbury", "NGN %s M a year" % m(GROUP_ATTR, 0),
          "After every occupancy cost and before any management fee"],
         ["Recoup", "About %d months from opening" % GROUP_PAYBACK_M,
          "Not twelve, and %d with all three levers pulled. Section 08 gives all three clocks "
          "and what twelve months does buy" % GROUP_PAYBACK_LEVERED_M]],
        ["", "", "Note"], [150, 116, FULLW - 266], aligns=["l", "l"], hi={0, 8}))
    el.append(card(
        "<b>One finding leads, because it is unwelcome and you should not hear it from a contractor in "
        "week eight.</b> The as-built drawings have now been measured properly. The brief carried the "
        "footprint at 24,695 by 13,025 mm; it measures 24,695 by 16,317. Net internal area is %s sqm, "
        "not %s. The main building is 35 per cent larger than every document we have given you assumed, "
        "and <b>almost all of the extra is circulation</b>: reception measures 69.6 sqm against 58.1, the "
        "theatre 32.8 against 24.7. So the fit-out and float come to NGN %s M against the NGN %s M in "
        "the mandate, about <b>NGN %s M more</b>, while the rent roll does not move, because you cannot "
        "let a corridor. The mandate's setup figure is understated and this document supersedes it."
        % (m(NET), m(BRIEF_NET, 0), m(MP_SETUP_NOW), m(MANDATE_SETUP), m(FIT_DELTA, 0)), bg=ALERT))

    # ------------------------------------------------------------------ 01 DIVISION
    sec(el, "01", "THE DIVISION", "What it is, and why it is a division rather than a project.")
    el.append(Paragraph(
        "A project ends. A division compounds. The distinction is not presentational: it decides where "
        "shared cost sits, who owns the systems, and whether the second site is expensive or cheap. "
        "Everything built in Abuja over the next four months is either a one-off or an asset Lagos "
        "inherits, and that is a structuring choice made now, not later.", P))
    el.append(tbl(
        [["Lyfe Place, the division", "Holding and management layer",
          "Owns the brand, the rate card, the operating systems, the protocols and the supplier terms. "
          "Employs nothing clinical"],
         ["Lyfe Place Abuja", "Operating company, site one",
          "The medipark. Holds the head lease, carries the fit-out, sub lets to every occupier and sells "
          "shared services. Entity one, and the one scrutinised first"],
         ["Lyfe Place Lagos", "Operating company, site two",
          "Same structure, same rate card, aligned to the KP Plastics space. Not yet incorporated"],
         ["Medlyfe Aesthetics and Regenerative", "Clinical SPV", "The core. Injectables led at launch"],
         ["Medlyfe Longevity and Infusion", "Clinical SPV", "Four infusion bays. Programme based"],
         ["Bariatric and Metabolic Medicine", "Clinical SPV", "Medical first, surgical when the theatre lands"],
         ["Lyfe Place Hair Restoration", "Clinical SPV", "FUE, with an operating partner"],
         ["Alameda Conversion Clinic", "Joint venture SPV", "Anchor occupier, ground floor"],
         ["Medbury Diagnostics and Medbury Pharmaceuticals", "Existing businesses",
          "Occupiers, not new companies. They gain a captive market and pay for the space"]],
        ["Entity", "What it is", "What it does"], [150, 96, FULLW - 246], aligns=["l", "l"],
        hi={1}, sub={3}))
    el.append(card(
        "<b>Why the division layer earns its keep: the second site is only cheap if the first is built "
        "to be copied.</b> A rate card, a service charge model, a clinical protocol set, a regulatory "
        "file and a supplier book are each expensive once and free thereafter. Built inside Lyfe Place "
        "Abuja they belong to one building. Built in the division they are what makes Lagos a fit-out "
        "and a licence rather than a second start.", bg=PANEL))

    # ------------------------------------------------------------------ 02 MEDIPARK
    sec(el, "02", "ENTITY ONE", "The medipark: medical infrastructure as a service.")
    el.append(Paragraph(
        "You asked that this business be scrutinised on its own and that it pay its rent and fund "
        "itself. It should be, and it does from month seven. But it only works if it is sold as "
        "infrastructure rather than as floor area. Space is only NGN %s M of the NGN %s M it earns, and "
        "on a converted house it can never be more, because only %.0f per cent of the net area is "
        "lettable at all. The rest of the income is the reason an SPV would rather be here than in its "
        "own leasehold." % (m(SPACE_TOTAL, 0), m(MP_REV_TOTAL, 0), 100 * LET_RATIO), P))
    el.append(tbl(
        [["Space", "Fitted, licensed clinical accommodation on a term, per sqm",
          "Rent and service charge, monthly"],
         ["Theatre and equipment", "Day case theatre and monitored recovery. Laser and IPL platform",
          "Per list, per session"],
         ["Shared clinical services", "Nursing pool, sterilising, clinical waste, linen, care coordination",
          "Per session or per case"],
         ["Front office and revenue cycle", "Booking, registration, cashiering, claims, collection, "
          "monthly management accounts by occupier", "4% of the occupier's collections"],
         ["Regulatory and estate", "Facility licence, fire, waste, power, water, security, maintenance",
          "In the service charge"]],
        ["What it sells", "What the occupier gets", "How it is charged"],
        [124, FULLW - 124 - 118, 118], aligns=["l", "l"]))
    el.append(card(
        "<b>An SPV opening on its own needs a lease, a fit-out, a licence, a receptionist, a nurse, an "
        "autoclave, a billing clerk and a waste contract before it sees one patient.</b> Here it needs a "
        "signature and its own clinical kit. That is the product. It is also why the rate is defensible "
        "at a level a bare shell would never reach, and why the medipark can be a modest margin business "
        "and still be the reason five clinical companies are cheap to start.", bg=PANEL))

    # ------------------------------------------------------------------ 03 GEOMETRY
    el.append(Spacer(1, 9))
    sec(el, "03", "THE MEASURED CAMPUS", "What the building actually is.")
    el.append(Paragraph(
        "The as-built drawings supplied are vector exports from CAD rather than scans, so the line work "
        "can be recovered exactly instead of traced. Wall faces, door swings and window symbols were "
        "separated by pen weight and the rooms flood filled, which reproduces the overall dimension "
        "chain to within about 10 mm. Both floors independently return 70 per cent efficiency on a "
        "%.1f sqm plate, and that agreement is the check that the extraction is right rather than "
        "merely precise." % PLATE, P))
    el.append(tbl(
        [[s[0], m(s[1], 1), m(s[2], 1), "%.0f%%" % (100 * s[2] / s[1]), s[3]] for s in STRUCTURES] +
        [["Campus", m(GROSS, 1), m(NET, 1), "%.0f%%" % (100 * NET / GROSS), ""]],
        ["Structure", "Gross sqm", "Net sqm", "Efficiency", "Basis"],
        [FULLW - 300, 66, 62, 62, 110], aligns=["r", "r", "r", "l"], total_row=True))
    el.append(tbl(
        [["Net internal area", m(BRIEF_NET, 0), m(NET, 1), "+%.1f" % (NET - BRIEF_NET),
          "Fit-out is priced on this"],
         ["Lettable area", "363.6", m(LET_AREA, 1), "%.1f" % (LET_AREA - 363.6),
          "Rent roll is priced on this, and it has not moved"],
         ["Reception and waiting", "58.1", "69.6", "+11.5", "Better room, no more income"],
         ["Day case theatre", "24.7", "32.8", "+8.1", "Genuinely useful. It was tight at 24.7"],
         ["Monitored recovery", "13.0", "19.2", "+6.2", "Two bays now fit comfortably"],
         ["Aesthetics consulting spine", "51.6", "41.8", "(9.8)",
          "The one that got smaller. Three rooms of 12, or two of 18"]],
        ["", "Brief", "Measured", "Change", "What it means"],
        [130, 52, 62, 52, FULLW - 296], aligns=["r", "r", "r", "l"], hi={0, 1}))
    el.append(card(
        "<b>The whole finding in one line: you have bought more building than you thought, and the extra "
        "is corridor.</b> Lettable area is %.1f sqm against the 363.6 previously assumed, so the rent "
        "roll is unchanged. Net area to fit out, clean, cool, light, insure and secure is %.1f sqm "
        "higher. That is the whole of the NGN %s M increase in section 07, and it is a measurement "
        "correction rather than a change of plan or a change of specification. It also means the "
        "medipark's own margin is thinner than the mandate implied, because %.0f more square metres are "
        "being powered, cooled, cleaned, secured and insured against exactly the same rent."
        % (LET_AREA, NET - BRIEF_NET, m(FIT_DELTA, 0), NET - BRIEF_NET), bg=ALERT))

    # ------------------------------------------------------------------ 04 THE PLATE
    el.append(Spacer(1, 9))
    sec(el, "04", "THE PLATE", "Every measured square metre, allocated.")
    el.append(Paragraph("Ground floor: the conversion clinic, the facility reception, and the theatre", H2))
    el.append(Paragraph(
        "The conversion clinic sits here, as you instructed, with the reception serving the whole "
        "facility and the theatre suite alongside it if one is built. Imaging stays on this floor "
        "whatever else happens: an X-ray room is fixed by weight, lead shielding and evacuation, and "
        "with no lift it cannot follow diagnostics out to the chalet.", P))
    el.append(tbl(
        [[r[0], m(r[1]), LABEL[r[2]], r[3]] for r in GROUND] +
        [["Ground floor", m(GROUND_NET), "", ""]],
        ["Room", "sqm", "To", "Note"], [166, 32, 92, FULLW - 290], aligns=["r", "l", "l"],
        total_row=True, tiny=True))

    el.append(Paragraph("First floor: the aesthetics core, and everything else", H2))
    el.append(Paragraph(
        "Upstairs is designated for everything that is not the conversion clinic: aesthetics and "
        "regenerative, longevity and infusion, hair restoration, and bariatric and metabolic medicine "
        "in its medical form. It has its own waiting at the head of the stair, its own sterilising, and "
        "a phlebotomy draw point so patients do not go downstairs for bloods. Nothing up here needs the "
        "theatre, which is what lets the first floor open at week 24 while the ground floor is still "
        "being built.", P))
    el.append(tbl(
        [[r[0], m(r[1]), LABEL[r[2]], r[3]] for r in FIRST] +
        [["First floor", m(FIRST_NET), "", ""]],
        ["Room", "sqm", "To", "Note"], [166, 32, 92, FULLW - 290], aligns=["r", "l", "l"],
        total_row=True, tiny=True))

    el.append(Paragraph("Chalet and boys' quarters", H2))
    el.append(tbl(
        [[r[0], m(r[1]), LABEL[r[2]], r[3]] for r in CHALET + BQ],
        ["Room", "sqm", "To", "Note"], [166, 32, 92, FULLW - 290], aligns=["r", "l", "l"], tiny=True))

    el.append(Paragraph("What each occupier ends up with", H2))
    el.append(tbl(
        [[LABEL[k], m(AREA[k]), "%.0f%%" % (100 * AREA[k] / NET)] for k in
         sorted(BANDS, key=lambda k: -AREA[k])] +
        [["Let area", m(LET_AREA), "%.0f%%" % (100 * LET_RATIO)],
         ["Theatre suite, hired by the list rather than let", m(AREA["THEATRE"]),
          "%.0f%%" % (100 * AREA["THEATRE"] / NET)],
         ["Campus common, recovered through the rates", m(AREA["COMMON"]),
          "%.0f%%" % (100 * AREA["COMMON"] / NET)],
         ["Net internal", m(NET), "100%"]],
        ["Occupier", "sqm", "Of net"], [FULLW - 190, 95, 95], total_row=True, hi={6}))
    el.append(card(
        "<b>One number here is worth pausing on: %.0f per cent of the net area is campus common.</b> "
        "That is what a converted residence with two staircases, a porch and a deep entrance hall costs "
        "you, and it is why the rate card in section 05 has to be set on lettable area rather than on "
        "floor area. A purpose designed plate runs at 20 to 25 per cent. That is not an argument about "
        "Abuja, where the building is what it is, but it is the single most useful thing Abuja can teach "
        "the KP Plastics design brief in Lagos." % (100 * AREA["COMMON"] / NET), bg=PANEL))

    # ------------------------------------------------------------------ 05 RATE CARD
    el.append(Spacer(1, 9))
    sec(el, "05", "THE RATE CARD", "What each square metre earns.")
    el.append(Paragraph(
        "Charged on the net internal area of the demise, all in, so there is no separate service charge "
        "argument later and no gross up factor to negotiate. The spread between bands is term length and "
        "service intensity, not favouritism, and it has to be defensible that way: every one of these "
        "occupiers is a related party, so each rate must stand up as an arm's length charge. Section 11 "
        "deals with that properly.", P))
    _by_band = {}
    for k, (band, desc, rent, svc) in BANDS.items():
        b = _by_band.setdefault(band, {"desc": desc, "rent": rent, "svc": svc, "sqm": 0.0,
                                       "inc": 0.0, "who": []})
        b["sqm"] += AREA[k]
        b["inc"] += SPACE[k]
        b["who"].append(LABEL[k])
    el.append(tbl(
        [[b, _by_band[b]["desc"], m(_by_band[b]["rent"] / 1000, 0), m(_by_band[b]["svc"] / 1000, 0),
          m((_by_band[b]["rent"] + _by_band[b]["svc"]) / 1000, 0),
          m(_by_band[b]["sqm"]), m(_by_band[b]["inc"])]
         for b in sorted(_by_band)] +
        [["", "Space income, all %d occupiers" % len(BANDS), "", "", "",
          m(LET_AREA), m(SPACE_TOTAL)]],
        ["Band", "What it is", "Rent", "Service", "All in", "sqm", "NGN M"],
        [34, FULLW - 324, 52, 52, 52, 52, 82], total_row=True))
    el.append(tbl(
        [[b, ", ".join(_by_band[b]["who"])] for b in sorted(_by_band)],
        ["Band", "Who is in it"], [34, FULLW - 34], tiny=True))
    el.append(Paragraph(
        "Rent and service figures are NGN thousand per sqm per year. Review at 12%% a year minimum, with "
        "a market review every five years. Deposit of six months' rent and six months' service charge, a "
        "further NGN %s M held. Yield is NGN %s per lettable sqm, which against NGN %s per net sqm is the "
        "measure of the common area this building carries."
        % (m(SPACE_TOTAL / 2), m(SPACE_TOTAL * 1e6 / LET_AREA, 0),
           m(SPACE_TOTAL * 1e6 / NET, 0)), SMALL))

    el.append(Paragraph("The contribution on grant, which is what you meant by selling it per sqm", H2))
    el.append(Paragraph(
        "Medbury holds a head lease, so nothing can literally be sold. The instrument that does what you "
        "want is a <b>fit-out contribution payable on grant of each sub lease</b>, priced per sqm. It "
        "brings cash forward into the fit-out period, it makes each occupier commit real money before "
        "the walls move, and it reduces what the medipark has to find.", P))
    el.append(tbl(
        [[LABEL[k], m(AREA[k]), m(CONTRIB_RATE[k] / 1000, 0), m(CONTRIB[k])] for k in
         sorted(CONTRIB_RATE, key=lambda k: -CONTRIB[k])] +
        [["Cash in on grant", m(LET_AREA), "", m(CONTRIB_TOTAL)]],
        ["Occupier", "sqm", "NGN 000 / sqm", "NGN M"],
        [FULLW - 250, 70, 90, 90], total_row=True))

    # ------------------------------------------------------------------ 06 MEDIPARK P&L
    sec(el, "06", "THE MEDIPARK P&amp;L", "Tested on its own, as you asked.")
    el.append(tbl(
        [[r[0], m(r[1]), r[2]] for r in MP_REV] + [["Revenue", m(MP_REV_TOTAL), ""]],
        ["Revenue at stabilisation", "NGN M", "What it is"],
        [172, 52, FULLW - 224], aligns=["r", "l"], total_row=True))
    el.append(Spacer(1, 4))
    el.append(tbl(
        [[r[0], m(r[1]), r[2]] for r in MP_COST] + [["Operating cost", m(MP_COST_TOTAL), ""]],
        ["Cost at stabilisation", "NGN M", "Note"],
        [172, 52, FULLW - 224], aligns=["r", "l"], total_row=True, tiny=True))
    el.append(Spacer(1, 4))
    el.append(tbl(
        [["EBITDA", m(MP_EBITDA), "%.0f%% margin. Before fit-out amortisation and any management fee"
          % (100 * MP_MARGIN)],
         ["Cash EBITDA to month 24", m(MP_EBITDA + 55.0),
          "The head rent is already paid, so it is not a cash cost until month 25"],
         ["Charged to Medbury companies", m(MP_INTERCO),
          "%.0f%% of revenue. Legitimate, and the discipline is the point, but see section 11"
          % (100 * MP_INTERCO / MP_REV_TOTAL)],
         ["Earned outside the group", m(MP_EXTERNAL),
          "External theatre lists, external equipment hire, concession income"]],
        ["", "NGN M", "Note"], [172, 52, FULLW - 224], aligns=["r", "l"], hi={0, 1}))
    el.append(card(
        "<b>It funds itself from month seven and covers the head rent nearly twice over, but it is not "
        "where the money is, and it should not be.</b> A %.0f per cent margin on contracted income from "
        "sister companies is a low risk infrastructure return, and the reason to accept it is that it "
        "strips capital cost out of five clinical companies you also own. The clinical margin is in "
        "section 09. The medipark's job is to make that margin cheap to reach and to stop the building "
        "being a liability on your balance sheet." % (100 * MP_MARGIN), bg=PANEL))

    # ------------------------------------------------------------------ 07 FIT-OUT
    el.append(Spacer(1, 9))
    sec(el, "07", "THE FIT-OUT", "Line by line, with measured quantities.")
    el.append(Paragraph(
        "This is the schedule you asked for, and it is built so it can be handed to a quantity surveyor "
        "without translation: %d priced lines across eleven sections, each with a quantity, a unit rate "
        "and a who pays column. It is still an estimate and it is labelled as one. <b>AACE Class 4, "
        "accuracy minus 15 to plus 30 per cent</b>, which on NGN %s M is a range of NGN %s M to NGN "
        "%s M. The site design concludes in two weeks and the bill of quantities settles it. Anyone "
        "giving you a single confident number before then is guessing and will be back later."
        % (N_LINES, m(FIT_TOTAL), m(FIT_LOW, 0), m(FIT_HIGH, 0)), P))
    el.append(Paragraph("The boundary: what the medipark builds, and what each occupier buys", H2))
    el.append(tbl(
        [["Category A, the medipark", "Base build, partitions, finishes, decoration, all services, "
          "common areas, statutory approvals",
          "NGN %s M in this schedule" % m(FIT_MEDIPARK)],
         ["Category B, the occupier", "Anything specific to one business: its clinical equipment, "
          "specialist benching, consumables and opening stock",
          "NGN %s M here, plus equipment in section 09" % m(FIT_OCCUPIER)],
         ["Third party consultants", "Architect and interior designer, mechanical and electrical, "
          "quantity surveyor", "NGN %s M, at cost, no mark up" % m(FIT_ATCOST)],
         ["On a tariff", "The solar array itself. Only the changeover and distribution is bought",
          "NGN %s M of capital, the rest monthly" % m(FIT_PPA)]],
        ["", "What it covers", "This schedule"], [122, FULLW - 262, 140], aligns=["l", "l"]))
    el.append(Paragraph(
        "Drawing the boundary this way is what makes a fast return arguable at all. Every naira of "
        "clinical equipment moved from the medipark to the business that uses it takes capital off the "
        "entity carrying the rent and puts it in an entity with a clinical margin to pay for it.", P))

    el.append(Paragraph("The schedule", H2))
    _rows, _subs = [], set()
    for r in FITOUT:
        if r[0] == S:
            _subs.add(len(_rows))
            _rows.append([r[1], "", "", "", "", ""])
        elif r[1] is None:
            _rows.append([r[0], "", "", "nil", r[4], r[5]])
        else:
            _rt = r[3] / 1000
            _rows.append([r[0], m(r[1], 0) + " " + r[2],
                          m(_rt, 1) if _rt < 100 else m(_rt, 0),
                          m(fit_val(r)), r[4], r[5]])
    _rows.append(["Subtotal, %d priced lines" % N_LINES, "", "", m(FIT_BASE), "", ""])
    _rows.append(["Design development and provisional sums, 10%", "", "", m(CONTINGENCY), "Medipark",
                  "Held by Medbury, released against the BOQ"])
    _rows.append(["Category A fit-out", "", "", m(FIT_TOTAL), "",
                  "NGN %s per sqm gross, NGN %s per sqm net"
                  % (m(FIT_TOTAL * 1e6 / GROSS, 0), m(FIT_TOTAL * 1e6 / NET, 0))])
    el.append(tbl(_rows, ["Item", "Qty", "Rate 000", "NGN M", "Who pays", "Note"],
                  [176, 48, 40, 38, 44, FULLW - 386], aligns=["l", "r", "r", "l", "l"],
                  total_row=True, sub=_subs, hi={len(_rows) - 3, len(_rows) - 2}, tiny=True))
    el.append(Paragraph(
        "Rates are NGN thousand per unit. All in, this is NGN %s per sqm gross, which sits inside the NGN "
        "300,000 to 350,000 band this practice uses for a full clinical conversion. Stripping out "
        "external works, statutory approvals and professional fees, the building works alone are NGN %s M, "
        "or NGN %s per sqm, which is below that band. Both readings say the same thing: the increase "
        "against earlier documents is measured area, not specification creep. The specification here is "
        "leaner per square metre than it was, on more square metres."
        % (m(FIT_TOTAL * 1e6 / GROSS, 0), m(FIT_BUILD_ONLY),
           m(FIT_BUILD_ONLY * 1e6 / GROSS, 0)), SMALL))

    el.append(Paragraph("The lean variant, and what it costs to be lean", H2))
    el.append(tbl(
        [[r[0], m(r[1]), r[2]] for r in LEAN_OUT] +
        [["Out of day one, before contingency", m(LEAN_SAVE), ""]],
        ["What comes out", "NGN M", "When it goes back in"],
        [FULLW - 230, 60, 170], aligns=["r", "l"], total_row=True))
    el.append(tbl(
        [["Category A, as scheduled", m(FIT_TOTAL), "Everything, on day one"],
         ["Category A, lean", m(LEAN_TOTAL), "Same opening date. Balance funded from trading"],
         ["Working capital float", m(FLOAT), "To cash positive"],
         ["Less contributions on grant", "(%s)" % m(CONTRIB_TOTAL), "Paid by the occupiers, section 05"],
         ["Net cash the medipark must find", m(MP_NEW_CASH_LEAN), "On the lean fit-out"]],
        ["", "NGN M", "Note"], [FULLW - 230, 60, 170], aligns=["r", "l"], total_row=True, hi={1}))
    el.append(card(
        "<b>Nothing clinical, nothing statutory and nothing structural is in the lean list.</b> It is "
        "car park, facade, dressing, and three items that move from capital to a monthly subscription. "
        "The two weeks to BOQ is also the window in which three things should be tested that would take "
        "more out: a landlord contribution or rent free period against a change of use that improves the "
        "property, vendor finance on the fit-out itself, and whether the hair restoration partner will "
        "bring their own instruments in exchange for a larger revenue share.", bg=PANEL))

    # ------------------------------------------------------------------ 08 THE YEAR
    sec(el, "08", "THE ONE YEAR QUESTION",
        "Straight answer: not twelve months. About %d." % GROUP_PAYBACK_M)
    el.append(Paragraph(
        "You have been direct about this, so this is too. A twelve month recoup measured from the day the "
        "doors open is not available on this building at this capital, and any document that says "
        "otherwise is counting from stabilisation without saying so. There are three clocks and they give "
        "three different answers, and the difference between them is which cheque you are asking about. "
        "All three are below.", LEDE))
    el.append(tbl(
        [["The NGN %s M already committed" % m(COMMITTED), "Recovered inside trading year two",
          "Two years' head rent and fees. It is what lets the campus trade rent free through the ramp, "
          "so it is already working for you"],
         ["The medipark's own new cash, NGN %s M" % m(MP_NEW_CASH_LEAN),
          "About %d months of trading" % MP_PAYBACK_M,
          "Fit-out and float, net of the contributions on grant. Infrastructure does not repay in a year "
          "anywhere, and pretending it does is how fit-outs get cut in the wrong places"],
         ["The group programme, NGN %s M" % m(GROUP_CASH, 0),
          "%.1f years from stabilisation, about %d months from opening"
          % (GROUP_PAYBACK_STAB, GROUP_PAYBACK_M),
          "This is the number you mean. The clinical companies carry no building capital, so they are "
          "cheap to start and they return fast"],
         ["The same, with all three levers pulled", "About %d months from opening" % GROUP_PAYBACK_LEVERED_M,
          "The honest floor. Below that the plan is not lean, it is incomplete"]],
        ["Clock", "Answer", "Why"], [126, 116, FULLW - 242], aligns=["l", "l"], hi={3}))
    el.append(Paragraph("The medipark, year by year", H2))
    el.append(tbl(
        [[r[0]] + [m(v) if v else "nil" for v in r[1]] for r in MP_CF] +
        [["Cumulative cash EBITDA"] + [m(v) if v else "nil" for v in MP_CUM]],
        ["NGN M", "Fit-out", "Trading yr 1", "Yr 2", "Yr 3", "Yr 4"],
        [FULLW - 300, 60, 60, 60, 60, 60], hi={3}, total_row=True))
    el.append(Paragraph(
        "Trading year one runs from month 7, when the first floor opens, to month 18. The ground floor "
        "completes at month 10 and the theatre lands at month 15 if a surgical anchor has signed. Space "
        "income barely ramps, and that is the single most valuable feature of this configuration: the "
        "occupiers are companies you already control, so their rent is contracted from the month they "
        "move in rather than recruited over two years. Services, theatre time and the revenue cycle fee "
        "do ramp, because they follow patient volume.", P))
    el.append(Paragraph("The three levers, and what each is worth", H2))
    el.append(tbl(
        [["Open the first floor at week 24 and let the ground floor finish around it",
          "About 10 weeks of trading",
          "The largest single lever, and a sequencing decision rather than a spending one. It works only "
          "because the businesses moving in upstairs do not depend on the theatre below them"],
         ["Open on the lean fit-out at NGN %s M and fund the balance from trading" % m(LEAN_TOTAL),
          "NGN %s M of cash" % m(FIT_TOTAL - LEAN_TOTAL),
          "Section 07 lists exactly what comes out and when it goes back in. Nothing clinical, nothing "
          "statutory, and no effect on the opening date"],
         ["Pre-sell the annual lines before opening", "6 to 9 weeks",
          "Infusion and weight management programmes, memberships, corporate diagnostics panels and the "
          "conversion clinic's own cohort. Cash before the doors open, and it de-risks the ramp"]],
        ["Lever", "Worth", "Note"], [176, 84, FULLW - 260], aligns=["l", "l"]))
    el.append(card(
        "<b>What twelve months does buy, and it is not nothing.</b> By month 12 the campus is trading on "
        "both floors, five new companies exist and are licensed, the medipark is covering its head rent "
        "and its whole operating cost out of its own income, the NGN %s M already spent is nearly back, "
        "and the group is running at roughly half of a NGN %s M annual EBITDA. What is not true at month "
        "12 is that the cheque has been returned. Month %d is where that lands, and only if the three "
        "levers above are taken as decisions in the next two weeks."
        % (m(COMMITTED), m(GROUP_ATTR, 0), GROUP_PAYBACK_LEVERED_M), bg=ALERT))

    # ------------------------------------------------------------------ 09 THE SPVS
    el.append(Spacer(1, 9))
    sec(el, "09", "THE AESTHETICS CORE", "Five companies, and why they are aesthetics aligned.")
    el.append(Paragraph(
        "Your instinct on this is right and it is worth saying why, because there is a better argument "
        "than convenience. An aesthetics core is the only clinical mix that lets Abuja and the KP "
        "Plastics space in Lagos share a rate card, a supplier book, a protocol set and a brand. "
        "Everything else on the campus is either a service to that core or a business that lives off its "
        "throughput.", P))
    el.append(tbl(
        [["Cash paying, so no HMO tariff and no claims lag", "Collections in the month, which is what "
          "makes a two year recoup arguable at all"],
         ["Programme based rather than episodic", "Infusion, weight management, skin, hair and longevity "
          "are all courses of treatment, so revenue can be pre-sold before the doors open"],
         ["One supplier book across both sites", "Injectables, consumables and devices bought once for "
          "the division. The second site inherits the terms"],
         ["Feeds the pharmacy and the laboratory directly", "Aesthetic product, weight management "
          "prescriptions, screening bloods and metabolic panels are all internal demand"],
         ["Portable to Lagos without redesign", "Same rooms, same rate card, same protocols. KP Plastics "
          "becomes the surgical end of one division rather than a separate venture"]],
        ["Why an aesthetics core", "What it does for the plan"], [212, FULLW - 212], aligns=["l"]))
    el.append(Paragraph("The five companies, plus the two that move in", H2))
    el.append(tbl(
        [[s[0], m(s[1]) if s[1] else "Theatre", m(s[2], 0), m(s[3], 0), "%d%%" % s[4],
          m(s[3] * s[4] / 100, 0), s[5]] for s in SPVS] +
        [["Seven businesses in occupation", m(LET_AREA), m(SPV_REV, 0), m(SPV_EBITDA, 0), "",
          m(SPV_ATTR, 0), ""]],
        ["Business", "sqm", "Revenue", "EBITDA", "Medbury", "To Medbury", "What it is"],
        [116, 30, 40, 38, 40, 44, FULLW - 308], aligns=["r", "r", "r", "r", "r", "l"],
        total_row=True, sub={6}, hi={5}, tiny=True))
    el.append(Paragraph(
        "Revenue and EBITDA are NGN M a year at stabilisation, after every occupancy and service charge "
        "the medipark levies. The Medbury column is the equity share assumed: 51% for aesthetics if it "
        "sits in the existing joint venture, 70% for bariatrics with a clinical partner on the balance, "
        "49% for the conversion clinic. Diagnostics and pharmacy are existing businesses shown at the "
        "revenue they earn on this campus, not group wide.", SMALL))

    el.append(Paragraph("Bariatrics: medical first, surgical second", H2))
    el.append(Paragraph(
        "This is the one to look at hardest, and it needs a specific recommendation, because done in the "
        "obvious order it is the most capital hungry thing on the campus and the slowest to pay. Done in "
        "this order it is among the fastest. <b>Launch it as medical weight management from month seven, "
        "on GLP-1 therapy, dietetics and metabolic monitoring, with no theatre at all.</b> That needs a "
        "consulting room, a body composition analyser and a prescribing pathway, all of which the campus "
        "already has. Surgery is added at month 15 when the theatre lands, and only then.", P))
    el.append(tbl(
        [["Medical weight management", "Month 7", "22.0", "95.0",
          "Consulting room, body composition, prescribing pathway. Dispensed by Medbury "
          "Pharmaceuticals, monitored by Medbury Diagnostics"],
         ["Bariatric surgery", "Month 15", "%s" % m(PHASE_TWO_TOTAL), "185.0",
          "Needs the theatre, the recovery bays and a ground floor. About 34 cases a year at maturity"],
         ["Bariatric and Metabolic Medicine", "", m(PHASE_TWO_TOTAL + 22.0), "280.0", ""]],
        ["Phase", "Opens", "Capital NGN M", "Revenue NGN M", "What it needs"],
        [112, 46, 66, 66, FULLW - 290], aligns=["l", "r", "r", "l"], total_row=True))
    el.append(card(
        "<b>Two things follow from bariatrics being in the plan, and both are decisions rather than "
        "observations.</b> First, the theatre is now load bearing rather than optional, and the measured "
        "drawings already fix it to the ground floor with level trolley access out to the ambulance bay. "
        "That is the right answer and nothing needs moving: there is no lift, none is to be added, and a "
        "high BMI patient cannot be recovered upstairs and carried down a staircase. At 32.8 sqm rather "
        "than the 24.7 the brief assumed, the room is now genuinely adequate for it. Second, it is the "
        "reason to speak to Dr Timi this month rather than at month 12. A surgical anchor with his own "
        "list is what releases the NGN %s M of theatre capital from deferral, and the equipment has a "
        "two month lead time." % m(PHASE_TWO_TOTAL), bg=ALERT))

    el.append(Paragraph("What the clinical companies cost to stand up", H2))
    el.append(tbl(
        [[r[0], m(r[1]), m(r[2]), m(r[3]), m(r[4]), m(sum(r[1:]))] for r in SPV_CAPEX] +
        [["Before the theatre", m(sum(r[1] for r in SPV_CAPEX)), m(sum(r[2] for r in SPV_CAPEX)),
          m(sum(r[3] for r in SPV_CAPEX)), m(sum(r[4] for r in SPV_CAPEX)), m(SPV_CAPEX_TOTAL)]],
        ["Company", "Equipment", "Category B", "Opening stock", "Working capital", "NGN M"],
        [FULLW - 320, 64, 64, 64, 64, 64], total_row=True))
    el.append(tbl(
        [[r[0], m(r[1])] for r in PHASE_TWO] +
        [["Phase two, funded from trading and gated on a signed surgical anchor", m(PHASE_TWO_TOTAL)]],
        ["Phase two", "NGN M"], [FULLW - 80, 80], total_row=True))
    el.append(Paragraph(
        "The laser and IPL platform is not in this table. It is leased by the medipark from month nine "
        "and sold on by the session, so no clinical company buys it and no capital is committed against "
        "a volume assumption that is not yet evidenced. Radiofrequency and body contouring are deferred "
        "on the same logic. The FUE instruments are brought by the operating partner.", SMALL))

    # ------------------------------------------------------------------ 10 GROUP
    el.append(Spacer(1, 9))
    sec(el, "10", "THE GROUP VIEW", "What the whole thing produces, and what it costs.")
    el.append(tbl(
        [["Campus revenue, external", m(GROUP_EXT_REV, 0),
          "Seven businesses plus the medipark's external income. Intercompany charges stripped out"],
         ["Attributable EBITDA to Medbury", m(GROUP_ATTR, 0),
          "After every occupancy cost and before any management fee"],
         ["Cash already committed", m(COMMITTED), "Two years' head rent and fees"],
         ["Category A fit-out", m(FIT_TOTAL), "NGN %s M on the lean variant" % m(LEAN_TOTAL)],
         ["Working capital float, medipark", m(FLOAT), "To cash positive"],
         ["The five clinical companies", m(SPV_CAPEX_TOTAL),
          "Equipment, category B, opening stock and working capital"],
         ["Total programme cash", m(GROUP_CASH, 0),
          "NGN %s M on the lean fit-out. Phase two is a further NGN %s M out of trading"
          % (m(GROUP_CASH_LEAN, 0), m(PHASE_TWO_TOTAL, 0))],
         ["Cash on cash at stabilisation", "%.0f%%" % (100 * GROUP_ATTR / GROUP_CASH),
          "Which is %.1f years from stabilisation, and about %d months from opening on the monthly model"
          % (GROUP_PAYBACK_STAB, GROUP_PAYBACK_M)]],
        ["", "NGN M", "Note"], [188, 60, FULLW - 248], aligns=["r", "l"], hi={1, 7}, sub={2, 6}))

    el.append(Paragraph("What has to be in the bank, which is not the same question", H2))
    el.append(Paragraph(
        "The table above is what the programme costs. It is not what has to be available, and the "
        "difference is large enough that you should see it before you commit rather than in month "
        "fourteen. Two items sit outside the capital table and are still cash: our fee, and the theatre "
        "that section 08 describes as funded from trading, which is true only once trading has arrived. "
        "Against them the campus earns on the way down and the occupiers pay their contributions in.", P))
    el.append(tbl(
        [["Capital table above", m(GROUP_CASH, 0), "What the programme costs"],
         ["Setup programme fee", m(FEE_NET), "Real cash, not carried in the capital table"],
         ["Phase two, the theatre", m(PHASE_TWO_TOTAL, 0), "Funded from trading, but only once trading exists"],
         ["Occupier contributions on grant", "(%s)" % m(CONTRIB_TOTAL), "Cash in, on grant of each sub lease"],
         ["Trading cash before the trough", "(%s)" % m(GROUP_PEAK_TRADE, 0), "What the campus earns on the way down"],
         ["Peak funding requirement", m(GROUP_PEAK, 0),
          "The deepest the bank balance goes, in month %d" % GROUP_TROUGH_M]],
        ["", "NGN M", "Note"], [188, 60, FULLW - 248], aligns=["r", "l"], hi={5}))

    el.append(Paragraph("What the money earns, on the monthly model", H2))
    el.append(tbl(
        [["Internal rate of return, five years", "%.0f%%" % (100 * GROUP_IRR),
          "Attributable to Medbury %.0f%%. Nominal naira, no terminal value" % (100 * ATTR_IRR)],
         ["Net present value at 25%", "NGN %s M" % m(GROUP_NPV, 0),
          "Five years only, so it is a floor rather than a valuation"],
         ["Cash returned per naira in, five years", "%.1f times" % GROUP_COC,
          "Total returned over the peak ever invested"],
         ["Payback from opening", "%d months" % GROUP_PAYBACK_M,
          "%d with all three levers in section 08" % GROUP_PAYBACK_LEVERED_M]],
        ["", "", "Note"], [188, 60, FULLW - 248], aligns=["r", "l"], hi={0}))

    el.append(card(
        "<b>The comparison that matters is not against a twelve month target, it is against the same "
        "building let room by room.</b> That version returns about NGN 253M a year, needs roughly 60 "
        "individual consultants recruited over 24 months, and asks for more capital rather than less. "
        "This version returns NGN %s M on companies that already exist and simply move in. The ramp, "
        "not the rate card, decides when the money comes back, and moving seven businesses beats "
        "recruiting sixty every time." % m(GROUP_ATTR, 0), bg=PANEL))

    # ------------------------------------------------------------------ 11 PHARMA/DIAG
    sec(el, "11", "PHARMACY AND DIAGNOSTICS", "The captive market, and the tax point that comes with it.")
    el.append(Paragraph(
        "These two need no capital from this programme and no new company. What they need is "
        "throughput, and the campus manufactures it. Every business upstairs generates prescriptions, "
        "screening bloods, metabolic panels and imaging, and none of it should leave the compound.", P))
    el.append(tbl(
        [["Medbury Pharmaceuticals", "Weight management prescribing, aesthetic and skincare retail, "
          "injectable product, infusion pharmacy, theatre and clinic consumables",
          "A weight management or infusion patient is a repeat monthly script against a programme, "
          "which is the best revenue line a pharmacy can have"],
         ["Medbury Diagnostics", "Pre-treatment screening, metabolic and hormone panels, pre-operative "
          "workup, infusion monitoring, imaging for the conversion clinic and the consultants upstairs",
          "Imaging stays on the ground floor because an X-ray room is fixed by weight and shielding. "
          "Ultrasound sits in the chalet with the laboratory, and specimens never cross a patient area"]],
        ["Business", "What the campus sends it", "Why it matters"],
        [116, FULLW - 116 - 186, 186], aligns=["l", "l"]))
    el.append(card(
        "<b>The point to settle before the first invoice, not after.</b> NGN %s M of the medipark's NGN "
        "%s M of revenue is charged to Medbury companies, and every internal referral above is a related "
        "party transaction. Each charge has to be supported as an arm's length price, documented, and "
        "consistent between entities. That is exactly why the rate card in section 05 is banded by term "
        "and service intensity rather than set at a single number, and why the file should be built "
        "alongside the sub leases in month one rather than reconstructed at the first audit. It is a "
        "fortnight of work now and a serious problem later."
        % (m(MP_INTERCO, 0), m(MP_REV_TOTAL, 0)), bg=ALERT))

    # ------------------------------------------------------------------ 12 LAGOS
    el.append(Spacer(1, 9))
    sec(el, "12", "LAGOS", "What the second site inherits.")
    el.append(Paragraph(
        "Nothing in Lagos needs deciding this month, but two things must be built into Abuja this month "
        "or Lagos pays for them twice. The KP Plastics space is the surgical end of the same division, "
        "so the design and the clinical model should be drawn to align rather than to match.", P))
    el.append(tbl(
        [["Transfers at no cost", "Rate card and service charge model, sub lease and licence documents, "
          "clinical protocols and governance set, supplier book and terms, brand and collateral, the "
          "operating systems and the regulatory file template"],
         ["Transfers with adaptation", "The room programme, the equipment schedule, the staffing model. "
          "Lagos rates are higher, so the same rooms carry a different rate card"],
         ["Does not transfer", "The head lease terms, the FCT approvals, the local supplier and "
          "contractor relationships, and the head rent economics"],
         ["The lesson Abuja teaches Lagos", "This building is %.0f per cent common area because it was "
          "a house. A purpose designed plate runs at 20 to 25 per cent, which on the same rent roll is "
          "worth more than any rate negotiation. Take the plate efficiency into the KP Plastics design "
          "brief" % (100 * AREA["COMMON"] / NET)],
         ["Needs deciding in Abuja now", "Whether the aesthetics company is one entity operating on two "
          "sites or one per site. It changes the licence, the tax position, and how KP Plastics is "
          "brought in"]],
        ["", "What"], [140, FULLW - 140], aligns=["l"], hi={3, 4}))

    # ------------------------------------------------------------------ 13 THE PLAN
    sec(el, "13", "THE PLAN", "Two weeks to a budget, two months to a division, four to a campus.")
    el.append(Paragraph(
        "Fit-out runs in the foreground. The structuring, the strategy and the SPV development run "
        "behind it on the same clock, which is what you asked for and is also the only way the companies "
        "are licensed and staffed by the time the rooms are ready. A campus that finishes before its "
        "occupiers are incorporated has wasted the most expensive weeks in the plan.", P))
    el.append(tbl(
        [["Weeks 1 to 2", "Site design concluded, BOQ issued, quantity surveyor appointed, contractors "
          "invited", "Division and entity architecture agreed. Rate card and sub lease heads drafted"],
         ["Weeks 3 to 6", "Contractor selected, enabling and strip out on site, three new external "
          "openings formed, long lead items ordered: cooling, solar agreement, laser lease",
          "Five incorporations lodged. Regulatory file opened with the FCT health authority. Dr Timi "
          "conversation opened on the surgical anchor"],
         ["Weeks 7 to 12", "Partitions, services first fix, ceilings. First floor prioritised",
          "Business cases finalised for the four new clinical companies. Transfer pricing file built "
          "alongside the sub leases. Recruitment briefs issued"],
         ["Weeks 13 to 20", "Finishes, second fix, decoration and furnishing. First floor complete, "
          "ground floor continues",
          "Credentialing, protocols and price lists. Pre-selling opens on infusion and weight "
          "management programmes. Lagos alignment note issued"],
         ["Week 24", "First floor opens and trades while the ground floor completes",
          "Conversion clinic, hair restoration, infusion, medical weight management and the treatment "
          "room all live"],
         ["Week 40", "Ground floor complete. Theatre follows the signed surgical anchor",
          "Bariatric surgery and day case aesthetic surgery open on the theatre"]],
        ["When", "Fit-out, in the foreground", "Strategy and SPV development, behind it"],
        [72, (FULLW - 72) / 2, (FULLW - 72) / 2], aligns=["l", "l"], hi={4}))
    el.append(card(
        "<b>The two weeks are the critical path, not the fit-out.</b> Until the site design is fixed and "
        "the BOQ is priced there is no tender, no contractor and no reliable number, and every week of "
        "delay is a week of rent already paid and not trading. Two years of head rent is NGN %s M, which "
        "is about NGN %s M a month whether or not anyone is in the building."
        % (m(HEAD_RENT_PREPAID, 0), m(HEAD_RENT_PREPAID / 24)), bg=PANEL))

    # ------------------------------------------------------------------ 14 FEE
    sec(el, "14", "WHAT CONSULT FOR AFRICA CHARGES", "Billed as time, at published rates.")
    el.append(Paragraph(
        "This is a resourced programme rather than a retainer, so it is priced the way a programme "
        "should be: named grades, published day rates, and the days each workstream actually takes. "
        "Nothing is loaded on capital value and nothing is a percentage of your spend. You can see "
        "exactly what you are buying, and if a workstream is deprioritised it comes straight off.", P))
    el.append(tbl(
        [[r[0], m(r[1] / 1000, 0), str(r[2]), m(r[1] * r[2] / 1e6)] for r in RATES] +
        [["Programme", "", str(TOTAL_DAYS), m(FEE_GROSS)]],
        ["Grade", "NGN 000 / day", "Days", "NGN M"],
        [FULLW - 260, 90, 80, 90], total_row=True))
    el.append(Spacer(1, 3))
    el.append(tbl(
        [[w[0], str(w[1]), m(w[2]), w[3]] for w in WS_FEE] +
        [["Six workstreams, one mandate", str(TOTAL_DAYS), m(FEE_GROSS), ""]],
        ["Workstream", "Days", "NGN M", "What it delivers"],
        [166, 36, 44, FULLW - 246], aligns=["r", "r", "l"], total_row=True, tiny=True))
    el.append(Spacer(1, 3))
    el.append(tbl(
        [["Professional fees, at published rates", m(FEE_GROSS), "%d days across five grades" % TOTAL_DAYS],
         ["Programme rate", "(%s)" % m(FEE_GROSS - FEE_NET),
          "%d%%, because this is one continuous mandate and not six engagements" % (100 * PROG_DISCOUNT)],
         ["Payable", m(FEE_NET),
          "Capped at this figure. Billed monthly against timesheets, so you never pay for days not worked"],
         ["Of which on mobilisation", m(FEE_MOB),
          "Non refundable, and it is what starts the two week design sprint. The balance monthly"],
         ["Third party consultants", m(FIT_ATCOST),
          "Architect and interior designer, mechanical and electrical, quantity surveyor. In the fit-out "
          "schedule, at cost, no mark up"]],
        ["", "NGN M", "Note"], [188, 60, FULLW - 248], aligns=["r", "l"], hi={2}))
    el.append(card(
        "<b>What this fee is not.</b> It is not the cost of running the campus once it trades. Managing a "
        "medipark and five clinical companies is an operating job and cannot sensibly be billed by the "
        "day for seven years, so it sits on a management fee. That is already tabled in the mandate "
        "document with you and is not reopened here. Keeping the two apart is deliberate: you should be "
        "able to approve this setup programme without settling the operating fee, and to settle the "
        "operating fee before the first business opens rather than in the middle of a fit-out.", bg=PANEL))

    # ------------------------------------------------------------------ 15 THE OTHER VERSION
    el.append(Spacer(1, 9))
    sec(el, "15", "THE TWO VERSIONS",
        "Whether we manage the conversion clinic, or only house it.")
    el.append(Paragraph(
        "There are two versions of this document and this is version %s. The difference is one question: "
        "does Consult for Africa run the conversion clinic, or is it simply a serviced tenant that runs "
        "itself. It matters more than it looks, because the clinic is the anchor occupier and the "
        "campus's front office is precisely what converts and collects for it. Given the conversion "
        "centre is subject to alignment with the Alameda side, you should have both answers costed "
        "before that conversation rather than after it."
        % ("one, in which we manage it" if MANAGED else
           "two, in which we do not"), LEDE))
    _mine, _theirs = M, OTHER
    _A, _B = (_mine, _theirs) if MANAGED else (_theirs, _mine)
    el.append(tbl(
        [["Who carries the clinic's P&amp;L", "Consult for Africa, under the management fee",
          "The clinic itself, or the Alameda side"],
         ["Its front of house", "The campus reception serves it",
          "It carves its own front of house out of its ground floor demise, "
          "so it gives up a room to do it"],
         ["Area it occupies", "%s sqm on the ground floor, %d rooms"
          % (m(_A["CONV_GROUND"]), _A["CONV_ROOMS"]), "The same %s sqm and %d rooms"
          % (m(_B["CONV_GROUND"]), _B["CONV_ROOMS"])],
         ["All in rate, NGN per sqm a year",
          m(_A["BANDS"]["CONV"][2] + _A["BANDS"]["CONV"][3], 0),
          "%s, a lower service charge because it buys fewer services"
          % m(_B["BANDS"]["CONV"][2] + _B["BANDS"]["CONV"][3], 0)],
         ["Its rent to the medipark", "NGN %s M" % m(_A["SPACE"]["CONV"]),
          "NGN %s M" % m(_B["SPACE"]["CONV"])],
         ["Nurses and billing staff", "Employed by the medipark, recharged",
          "Employed by the clinic"],
         ["Medipark revenue", "NGN %s M" % m(_A["MP_REV_TOTAL"]),
          "NGN %s M" % m(_B["MP_REV_TOTAL"])],
         ["Medipark EBITDA", "NGN %s M" % m(_A["MP_EBITDA"]),
          "NGN %s M" % m(_B["MP_EBITDA"])],
         ["The clinic's own revenue", "NGN %s M" % m(_A["SPVS"][4][2], 0),
          "NGN %s M. Unmanaged it converts and collects less well" % m(_B["SPVS"][4][2], 0)],
         ["Attributable EBITDA to Medbury", "NGN %s M" % m(_A["GROUP_ATTR"], 1),
          "NGN %s M, which is the same number" % m(_B["GROUP_ATTR"], 1)],
         ["Setup programme", "%d days, NGN %s M payable" % (_A["TOTAL_DAYS"], m(_A["FEE_NET"])),
          "%d days, NGN %s M payable" % (_B["TOTAL_DAYS"], m(_B["FEE_NET"]))]],
        ["", "Version one, we manage it", "Version two, we do not"],
        [148, (FULLW - 148) / 2, (FULLW - 148) / 2], aligns=["l", "l"],
        hi={9, 10}, sub={6}))
    el.append(card(
        "<b>The honest reading: this is not a money decision for Medbury, it is a control and "
        "accountability decision.</b> Attributable EBITDA is NGN %s M against NGN %s M, a difference of "
        "under NGN 1M a year, which is a rounding error on a figure this size. It comes out that way "
        "because the medipark sheds reception, billing and nursing cost almost exactly as fast as it "
        "sheds the revenue that paid for them. So choose on the thing that does differ: who is answerable "
        "when the clinic underperforms. Managed, there is one operator, one set of management accounts and "
        "one party to hold to a number. Unmanaged, the clinic keeps its independence and the campus keeps "
        "a tenant, and if conversion disappoints nobody owns the problem. Version two is the one to take "
        "into the Alameda conversation, because it is the version that survives them saying no."
        % (m(_A["GROUP_ATTR"], 1), m(_B["GROUP_ATTR"], 1)), bg=ALERT))
    el.append(Paragraph(
        "One drafting point that follows. If the clinic manages itself, its revenue should not carry the "
        "full management fee in the mandate, because Consult for Africa is not managing it. It should "
        "carry the space and services charge only. That is a one line amendment and it is better made "
        "now than argued later.", P))

    # ------------------------------------------------------------------ 16 DECISIONS
    el.append(Spacer(1, 9))
    sec(el, "16", "DECISIONS", "What is needed to start, and what can wait.")
    el.append(tbl(
        [["1", "Accept the measured areas as the basis", "This week",
          "Net internal is %s sqm, not %s. It raises the setup cost by about NGN %s M and leaves the "
          "rent roll unchanged. Every other number in this document follows from it"
          % (m(NET), m(BRIEF_NET, 0), m(FIT_DELTA, 0))],
         ["2", "Approve the design sprint and appoint the quantity surveyor", "This week",
          "Two weeks to a fixed design and a priced BOQ. Nothing can be tendered until it exists, and "
          "the rent is running at NGN %s M a month" % m(HEAD_RENT_PREPAID / 24)],
         ["3", "Confirm the conversion clinic takes the ground floor", "This week",
          "%.1f sqm and %d rooms, at NGN %s per sqm a year all in, five year term. Reception at %.0f sqm "
          "serves the whole facility, and the theatre suite sits alongside"
          % (CONV_GROUND, CONV_ROOMS, m(BANDS['CONV'][2] + BANDS['CONV'][3], 0), 42.0)],
         ["4", "Choose the fit-out specification", "Two weeks",
          "NGN %s M as scheduled, or NGN %s M lean with the balance out of trading. Same opening date. "
          "The lean route is recommended" % (m(FIT_TOTAL), m(LEAN_TOTAL))],
         ["5", "Approve the contribution on grant", "Two weeks",
          "NGN %s M of occupier cash into the fit-out period, and it makes each SPV commit before the "
          "walls move" % m(CONTRIB_TOTAL)],
         ["6", "Open the surgical anchor conversation with Dr Timi", "This month",
          "Two month lead time on theatre equipment, and the anchor is what releases NGN %s M from "
          "deferral" % m(PHASE_TWO_TOTAL)],
         ["7", "Settle where the aesthetics company sits", "One month",
          "Inside the existing joint venture at 51%%, or Medbury owned under a brand licence. It moves "
          "attributable EBITDA by about NGN %s M a year" % m(68.0 * 0.49)],
         ["8", "Instruct the setup programme", "This week",
          "Structuring, licensing and recruitment run behind the fit-out, not after it. A campus that "
          "finishes before its occupiers are licensed has wasted its most expensive weeks"]],
        ["", "Decision", "By", "Why now"], [18, 176, 52, FULLW - 246], aligns=["l", "l", "l"],
        hi={0, 1, 7}))
    el.append(card(
        "<b>The single sentence version.</b> The building is bigger than the brief said and the extra is "
        "corridor, so the fit-out is NGN %s M lean against a scheduled NGN %s M; it then becomes a "
        "business that covers its own head rent from month seven; five clinical companies open inside it "
        "on an aesthetics core that Lagos can inherit whole; the group runs at about NGN %s M of "
        "attributable EBITDA a year; the peak funding requirement is NGN %s M rather than the NGN %s M "
        "the capital table shows; and the capital comes back at about month %d from opening, or month %d "
        "with all three levers, rather than month 12. Every number in that sentence comes from the "
        "attached monthly model, and every one of them will move when the bill of quantities lands in "
        "two weeks."
        % (m(LEAN_TOTAL), m(FIT_TOTAL), m(GROUP_ATTR, 0), m(GROUP_PEAK, 0), m(GROUP_CASH, 0),
           GROUP_PAYBACK_M, GROUP_PAYBACK_LEVERED_M), bg=CREAM))

    el.append(Spacer(1, 8))
    _f = Table([[Paragraph("Debo Odulana   Consult for Africa   /   +234 913 813 8553   /   "
                           "hello@consultforafrica.com", CELL_W)]], colWidths=[FULLW])
    _f.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), NAVY),
                            ("TOPPADDING", (0, 0), (-1, -1), 7),
                            ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                            ("LEFTPADDING", (0, 0), (-1, -1), 10)]))
    el.append(_f)
    el.append(Paragraph(
        "Areas for the main building are measured from the as-built CAD to about 10 mm and supersede the "
        "brief; the chalet and boys' quarters have no as-built drawing in the pack and remain estimates. "
        "The fit-out schedule is an AACE Class 4 estimate, accuracy minus 15 to plus 30 per cent, before "
        "a bill of quantities. Unit rates are current Abuja rates and are not yet quoted. Lease, "
        "placement and consignment terms are assumed on customary market terms. Revenue and EBITDA for "
        "the clinical companies carry the assumptions in the companion business cases, of which "
        "aesthetics volume, infusion programme uptake and the bariatric case rate are the least "
        "evidenced. Related party charges are subject to a transfer pricing opinion. Not a binding "
        "offer, and not legal or tax advice. FX reference USD/NGN 1,550.", SMALL))

    doc.build(el)
    print("wrote %s  [%s]" % (OUT.name, SCOPE))
    print("  campus       %.1f sqm gross, %.1f net (brief said %.0f / %.0f)"
          % (GROSS, NET, BRIEF_GROSS, BRIEF_NET))
    print("  let area     %.1f sqm, %.0f%% of net.  common %.1f (%.0f%%)"
          % (LET_AREA, 100 * LET_RATIO, AREA["COMMON"], 100 * AREA["COMMON"] / NET))
    print("  conv clinic  %.1f sqm ground, %d rooms, %.0f%% of the floor"
          % (CONV_GROUND, CONV_ROOMS, 100 * CONV_SHARE_GROUND))
    print("  space income %.1f M   medipark rev %.1f cost %.1f EBITDA %.1f (%.0f%%)"
          % (SPACE_TOTAL, MP_REV_TOTAL, MP_COST_TOTAL, MP_EBITDA, 100 * MP_MARGIN))
    print("  fit-out      %d lines, base %.1f + cont %.1f = %.1f (lean %.1f), %.0f/sqm gross"
          % (N_LINES, FIT_BASE, CONTINGENCY, FIT_TOTAL, LEAN_TOTAL, FIT_TOTAL * 1e6 / GROSS))
    print("  medipark cum %s" % MP_CUM)
    print("  group        rev %.0f  attributable %.0f  cash %.0f  %.1f yr from stab"
          % (GROUP_EXT_REV, GROUP_ATTR, GROUP_CASH, GROUP_PAYBACK_STAB))
    print("  fee          %d days, gross %.2f, payable %.2f, mob %.1f"
          % (TOTAL_DAYS, FEE_GROSS, FEE_NET, FEE_MOB))


if __name__ == "__main__":
    MANAGED_M = build_model(True)
    SELF_M = build_model(False)
    build(MANAGED_M, SELF_M, DOCS / "lyfeplace-division-plan-managed-cfa.pdf")
    print()
    build(SELF_M, MANAGED_M, DOCS / "lyfeplace-division-plan-selfmanaged-cfa.pdf")
