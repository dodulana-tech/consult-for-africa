"""
Generate the Lyfe Place Abuja space-allocation drawing in CAD format.

Outputs two files from one geometry definition:
  docs/lyfeplace-abuja-allocation.dxf   AutoCAD R12 ASCII, for the architect
  docs/lyfeplace-abuja-allocation.pdf   scaled preview, for review without CAD

WHAT THIS IS. A room allocation schedule drawn to scale, not a survey. Every room
rectangle carries its TRUE area, taken from the dimension strings on the as-built
drawings. Rooms are packed in reading order inside each structure's true overall
outline rather than traced wall-for-wall, because wall centrelines cannot be
derived reliably from the as-built PDFs. The architect overlays the allocation on
the real CAD.

Zones follow the aesthetics-anchor configuration:
  ANCHOR       ground floor aesthetics and day procedures, incl. the FUE suite
  PROCEDURE    clean procedure room and the first-floor treatment room
  PLAZA        first-floor private consulting rooms, sold by the session
  DIAGNOSTICS  phlebotomy and specimen handling, laboratory in the guest chalet
  PHARMACY     dispensary in the boys' quarters, collection point in the building
  COMMON       reception, waiting, circulation, WCs, sterilising, staff
  BOH          back of house

Key capacity findings carried in the drawing notes:
  - First floor yields 9 generous consulting rooms, 10 only if the 24.3 sqm
    bedroom is subdivided. The financial model assumes 10.
  - No single ground-floor room reaches the 28 to 30 sqm a clean procedure room
    with an integral recovery bay needs. Combining the 19.3 sqm bedroom with its
    7.8 sqm en-suite gives 27.1 sqm on one wall removal.
  - Only ONE FUE suite fits, in the 24.7 sqm bedroom. Not two.

Run:
  python3 scripts/build-lyfeplace-cad.py
"""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs" / "lyfeplace-abuja"
DXF_OUT = DOCS / "lyfeplace-abuja-allocation.dxf"
PDF_OUT = DOCS / "lyfeplace-abuja-allocation.pdf"

# ---------------------------------------------------------------- zones
# name -> (AutoCAD colour index, preview RGB, label)
ZONES = {
    "CONVERSION":  (30, (0.90, 0.55, 0.20), "Conversion hub, Alameda anchors"),
    "THEATRE":     (1,  (0.80, 0.30, 0.30), "Day case theatre suite, proposed"),
    "PROCEDURE":   (6,  (0.72, 0.35, 0.62), "Treatment room"),
    "PLAZA":       (5,  (0.24, 0.45, 0.72), "Private consulting plaza"),
    "DIAGNOSTICS": (3,  (0.30, 0.60, 0.38), "Medbury Diagnostics"),
    "PHARMACY":    (2,  (0.80, 0.68, 0.20), "Medbury Pharmaceuticals"),
    "COMMON":      (8,  (0.55, 0.55, 0.55), "Reception, circulation, WC"),
    "BOH":         (9,  (0.72, 0.72, 0.70), "Back of house"),
}

# ---------------------------------------------------------------- rooms
# (as-built name, new use, width mm, height mm, zone)
GROUND = [
    ("Living Room", "RECEPTION, WAITING & CONCIERGE",           8776, 6615, "COMMON"),
    ("Bedroom",     "CONVERSION HUB: CONSULTING 1 & OBSERVATION", 5729, 4306, "CONVERSION"),
    ("Bedroom",     "CONVERSION HUB: CONSULTING 2",          5690, 3385, "CONVERSION"),
    ("Bedroom",     "CONVERSION HUB: CONSULTING 3 / COORDINATOR", 3760, 2776, "CONVERSION"),
    ("Kitchen",     "PHLEBOTOMY & SPECIMEN HANDLING",           5306, 3435, "DIAGNOSTICS"),
    ("Bedroom",     "DIGITAL X-RAY, LEAD SHIELDED",             3010, 4695, "DIAGNOSTICS"),
    ("Dining",      "ULTRASOUND & ECHOCARDIOGRAPHY",            3170, 4095, "DIAGNOSTICS"),
    ("Bath",        "IMAGING REPORTING & CONTROL",              3760, 2080, "DIAGNOSTICS"),
    ("Store",       "MEDICATION COLLECTION POINT",              3170, 1905, "PHARMACY"),
    ("Bath",        "PATIENT WC",                               1700, 2899, "COMMON"),
    ("Bath",        "PATIENT WC",                               1345, 2470, "COMMON"),
    ("V.T",         "PATIENT WC",                               1330, 1660, "COMMON"),
]
FIRST = [
    ("Living Room", "CONSULTING 1-3 + SPINE  new partitions",   8285, 6228, "PLAZA"),
    ("Living Room", "DOCTORS' & MEMBERS' LOUNGE  head of stairs", 5930, 5740, "COMMON"),
    ("Bedroom",     "FUE HAIR TRANSPLANT SUITE",                3905, 6228, "PLAZA"),
    ("Playroom",    "CASE CONFERENCE, MDT & TELEMEDICINE",      7270, 3080, "CONVERSION"),
    ("Bedroom",     "CONSULTING ROOM 4  en-suite WC",           5925, 3340, "PLAZA"),
    ("Bedroom",     "CONSULTING ROOM 5  en-suite WC",           3845, 5145, "PLAZA"),
    ("Kitchen",     "PROCEDURE ROOM  existing water & drainage", 4700, 3148, "PROCEDURE"),
    ("Bedroom",     "COORDINATOR & COUNSELLING",                5690, 2408, "CONVERSION"),
    ("Store",       "LINEN & CONSUMABLES",                      3810, 2600, "BOH"),
    ("Bath",        "STERILISING  existing water & drainage",   4465, 2100, "COMMON"),
    ("Bath",        "PATIENT WC",                               3588, 1990, "COMMON"),
    ("Balcony",     "TERRACE, off the lounge",                  3505, 1778, "COMMON"),
    ("Bath",        "PHLEBOTOMY DRAW POINT",                    2340, 2430, "DIAGNOSTICS"),
]
CHALET = [
    ("Kitchen",            "LABORATORY  benching & analysers",     3930, 2930, "DIAGNOSTICS"),
    ("Bed Room",           "LABORATORY  extension",                3700, 4390, "DIAGNOSTICS"),
    ("Bed Room",           "SPECIMEN RECEPTION & SORTING",         3360, 3405, "DIAGNOSTICS"),
    ("Living Room",        "REPORTING OFFICE",                     4990, 2360, "DIAGNOSTICS"),
    ("Bath",               "REAGENT COLD CHAIN & STORE",           2905, 1855, "DIAGNOSTICS"),
    ("Bath",               "STAFF WC",                             2675, 1615, "COMMON"),
]
BQ = [
    ("Bed Room",           "DISPENSARY & STOCK",                   4629, 3660, "PHARMACY"),
    ("Bed Room",           "PRODUCT & SKINCARE RETAIL STORE",      4061, 3660, "PHARMACY"),
    ("Bath",               "CONTROLLED DRUGS STORE",               1375, 2079, "PHARMACY"),
    ("Bath",               "COLD CHAIN",                           1300, 2079, "PHARMACY"),
]

THEATRE = [
    ("new build",   "OPERATING THEATRE",                        6000, 5500, "THEATRE"),
    ("new build",   "MONITORED RECOVERY, 2 BAYS",               4500, 3200, "THEATRE"),
    ("new build",   "ANAESTHETIC / PREP ROOM",                  3200, 2800, "THEATRE"),
    ("new build",   "STERILE STORE",                            2800, 2500, "THEATRE"),
    ("new build",   "DIRTY UTILITY",                            2400, 2500, "THEATRE"),
    ("new build",   "SCRUB",                                    2200, 2300, "THEATRE"),
    ("new build",   "AHU & ISOLATED POWER PLANT, external",     3000, 2200, "THEATRE"),
]

# (title, rooms, true overall width, true overall height)
STRUCTURES = [
    ("GROUND FLOOR|Lyfe Place International Clinic, conversion hub", GROUND, 24695, 13025),
    ("FIRST FLOOR|private medical plaza", FIRST, 24396, 12345),
    ("GUEST CHALET|Medbury Diagnostics laboratory", CHALET, 9380, 10915),
    ("BOYS' QUARTERS|Medbury Pharmaceuticals", BQ, 12515, 4120),
    ("DAY CASE THEATRE|ground-level unit, level trolley access", THEATRE, 11000, 8000),
]

GAP = 400          # mm between packed rooms
PAD = 500          # mm inside the column
PACKW = 10500      # mm packing column width, deliberately narrow so columns run tall
COLPITCH = 12800   # mm between column origins


def pack(rooms):
    """Pack rooms into a fixed-width column, largest first, tallest column wins the scale."""
    ordered = sorted(rooms, key=lambda r: -(r[2] * r[3]))
    placed, x, y, row_h = [], PAD, PAD, 0
    for name, use, w, h, zone in ordered:
        if x + w > PACKW - PAD and x > PAD:
            x = PAD
            y += row_h + GAP
            row_h = 0
        placed.append((name, use, x, y, w, h, zone))
        x += w + GAP
        row_h = max(row_h, h)
    return placed, y + row_h + PAD


def layout():
    """Assign each structure a column origin in a single row, tops aligned."""
    packed = [(t, r, oW, oH) + pack(r) for t, r, oW, oH in STRUCTURES]
    tallest = max(p[5] for p in packed)
    out = []
    for i, (title, rooms, oW, oH, placed, used_h) in enumerate(packed):
        out.append((title, rooms, oW, oH, i * COLPITCH, tallest - used_h, placed, used_h))
    return out


# ---------------------------------------------------------------- DXF
def dxf_pair(code, value):
    return "%d\n%s\n" % (code, value)


def dxf_polyline(layer, pts, closed=True):
    s = dxf_pair(0, "POLYLINE") + dxf_pair(8, layer) + dxf_pair(66, 1)
    s += dxf_pair(70, 1 if closed else 0)
    s += dxf_pair(10, "0.0") + dxf_pair(20, "0.0") + dxf_pair(30, "0.0")
    for px, py in pts:
        s += dxf_pair(0, "VERTEX") + dxf_pair(8, layer)
        s += dxf_pair(10, "%.1f" % px) + dxf_pair(20, "%.1f" % py) + dxf_pair(30, "0.0")
    s += dxf_pair(0, "SEQEND") + dxf_pair(8, layer)
    return s


def dxf_rect(layer, x, y, w, h):
    return dxf_polyline(layer, [(x, y), (x + w, y), (x + w, y + h), (x, y + h)])


def dxf_text(layer, x, y, height, text):
    s = dxf_pair(0, "TEXT") + dxf_pair(8, layer)
    s += dxf_pair(10, "%.1f" % x) + dxf_pair(20, "%.1f" % y) + dxf_pair(30, "0.0")
    s += dxf_pair(40, "%.1f" % height) + dxf_pair(1, text)
    return s


def write_dxf():
    layers = ["OUTLINE", "ROOM-TEXT", "TITLE", "NOTES"] + ["ZONE-" + z for z in ZONES]
    out = []
    out.append(dxf_pair(0, "SECTION") + dxf_pair(2, "HEADER"))
    out.append(dxf_pair(9, "$ACADVER") + dxf_pair(1, "AC1009"))
    out.append(dxf_pair(9, "$INSUNITS") + dxf_pair(70, "4"))   # millimetres
    out.append(dxf_pair(0, "ENDSEC"))

    out.append(dxf_pair(0, "SECTION") + dxf_pair(2, "TABLES"))
    out.append(dxf_pair(0, "TABLE") + dxf_pair(2, "LAYER") + dxf_pair(70, str(len(layers))))
    for name in layers:
        if name.startswith("ZONE-"):
            colour = ZONES[name[5:]][0]
        elif name == "OUTLINE":
            colour = 7
        elif name == "TITLE":
            colour = 7
        elif name == "NOTES":
            colour = 8
        else:
            colour = 7
        out.append(dxf_pair(0, "LAYER") + dxf_pair(2, name) + dxf_pair(70, "0")
                   + dxf_pair(62, str(colour)) + dxf_pair(6, "CONTINUOUS"))
    out.append(dxf_pair(0, "ENDTAB") + dxf_pair(0, "ENDSEC"))

    out.append(dxf_pair(0, "SECTION") + dxf_pair(2, "ENTITIES"))
    for title, rooms, oW, oH, ox, oy, placed, used_h in layout():
        out.append(dxf_rect("OUTLINE", ox, oy, PACKW, used_h))
        head, subhead = title.split("|")
        out.append(dxf_text("TITLE", ox, oy + used_h + 1500, 620, head))
        out.append(dxf_text("TITLE", ox, oy + used_h + 900, 420, subhead))
        out.append(dxf_text("NOTES", ox, oy + used_h + 350, 360,
                            "true overall %d x %d mm  /  %d rooms  /  %.0f sqm allocated"
                            % (oW, oH, len(rooms), sum(r[2] * r[3] for r in rooms) / 1e6)))
        for name, use, x, y, w, h, zone in placed:
            out.append(dxf_rect("ZONE-" + zone, ox + x, oy + y, w, h))
            out.append(dxf_text("ROOM-TEXT", ox + x + 150, oy + y + h - 700, 330, use))
            out.append(dxf_text("ROOM-TEXT", ox + x + 150, oy + y + h - 1180, 260,
                                "was %s  /  %d x %d  /  %.1f sqm" % (name, w, h, w * h / 1e6)))

    # legend
    lx, ly = 0, -7000
    out.append(dxf_text("TITLE", lx, ly + 2200, 700, "ZONE LEGEND"))
    for i, (z, (_, _, label)) in enumerate(ZONES.items()):
        yy = ly + 1200 - i * 900
        out.append(dxf_rect("ZONE-" + z, lx, yy, 1400, 600))
        out.append(dxf_text("ROOM-TEXT", lx + 1700, yy + 130, 380, "%s   %s" % (z, label)))

    notes = [
        "LYFE PLACE ABUJA  /  SPACE ALLOCATION  /  Consult for Africa  /  units mm",
        "",
        "THIS IS AN ALLOCATION SCHEDULE DRAWN TO SCALE, NOT A FLOOR PLAN.",
        "Room rectangles carry TRUE areas taken from the dimension strings on the as-built",
        "drawings, and are packed into equal-width columns for legibility. Positions do NOT",
        "represent locations. Wall centrelines cannot be derived reliably from the as-built",
        "PDFs. Overlay the allocation on the real CAD.",
        "",
        "CAPACITY FINDINGS",
        "1. The first floor yields 9 generous consulting rooms. Ten only if the 24.3 sqm",
        "   bedroom is subdivided. The financial model assumes 10.",
        "2. No single ground-floor room reaches the 28 to 30 sqm that a clean procedure room",
        "   with an integral recovery bay requires. Combining the 19.3 sqm bedroom with its",
        "   7.8 sqm en-suite gives 27.1 sqm on one wall removal, and the bath position gives",
        "   plumbing for the scrub.",
        "3. Only ONE FUE suite fits, in the 24.7 sqm bedroom. Not two.",
        "4. No lift. Stairs are in the right-hand block. No sedation-dependent day case work",
        "   on the first floor at any budget.",
        "5. Both existing kitchens already have water and drainage. They take the wet",
        "   functions: phlebotomy on the ground floor, sterilising on the first.",
        "6. Most bedrooms have en-suite bathrooms, so consulting rooms come with private WCs.",
    ]
    nx, ny = 28000, -7000
    for i, line in enumerate(notes):
        out.append(dxf_text("NOTES", nx, ny + 2600 - i * 620, 380, line))

    out.append(dxf_pair(0, "ENDSEC") + dxf_pair(0, "EOF"))
    DXF_OUT.write_text("".join(out))
    print("wrote %s" % DXF_OUT)


# ---------------------------------------------------------------- PDF preview
def write_pdf():
    from reportlab.lib.colors import Color, HexColor, white
    from reportlab.lib.pagesizes import A3, landscape
    from reportlab.pdfgen import canvas

    PW, PH = landscape(A3)
    c = canvas.Canvas(str(PDF_OUT), pagesize=(PW, PH))
    c.setTitle("Lyfe Place Abuja - Space allocation")

    NAVY = HexColor("#0F3D2E")
    GOLD = HexColor("#C6A15B")
    c.setFillColor(NAVY)
    c.rect(0, PH - 34, PW, 34, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(0, PH - 38, PW, 4, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(28, PH - 24, "LYFE PLACE ABUJA  /  SPACE ALLOCATION")
    c.setFont("Helvetica", 9)
    c.drawRightString(PW - 28, PH - 24,
                      "Allocation schedule drawn to scale, not a survey  /  Consult for Africa")

    # world extents
    L = layout()
    maxx = max(ox + PACKW for *_, ox, oy, placed, used_h in L)
    maxy = max(oy + used_h for *_, ox, oy, placed, used_h in L)
    COLW_FRAC = 0.60
    scale = min((PW * COLW_FRAC - 56) / maxx, (PH - 255) / maxy)
    offx, offy = 28, 150

    def X(v):
        return offx + v * scale

    def Y(v):
        return offy + v * scale

    for title, rooms, oW, oH, ox, oy, placed, used_h in L:
        c.setStrokeColor(HexColor("#999999"))
        c.setLineWidth(0.7)
        c.setDash(3, 3)
        c.rect(X(ox), Y(oy), PACKW * scale, used_h * scale, fill=0, stroke=1)
        c.setDash()
        head, subhead = title.split("|")
        c.setFillColor(NAVY)
        c.setFont("Helvetica-Bold", 8.5)
        c.drawString(X(ox), Y(oy + used_h) + 23, head)
        c.setFillColor(HexColor("#2F6B52"))
        c.setFont("Helvetica", 6.8)
        c.drawString(X(ox), Y(oy + used_h) + 14, subhead)
        c.setFillColor(HexColor("#7C7C74"))
        c.setFont("Helvetica", 6.2)
        c.drawString(X(ox), Y(oy + used_h) + 5,
                     "%d x %d mm  /  %d rooms  /  %.0f sqm"
                     % (oW, oH, len(rooms), sum(r[2] * r[3] for r in rooms) / 1e6))
        for name, use, x, y, w, h, zone in placed:
            r, g, b = ZONES[zone][1]
            c.setFillColor(Color(r, g, b, alpha=0.30))
            c.setStrokeColor(Color(r * 0.7, g * 0.7, b * 0.7))
            c.setLineWidth(0.8)
            c.rect(X(ox + x), Y(oy + y), w * scale, h * scale, fill=1, stroke=1)
            boxw, boxh = w * scale, h * scale
            sub = "was %s  %.1f sqm" % (name, w * h / 1e6)
            c.setFillColor(HexColor("#1A1A1A"))
            fits_h = len(use) * 2.9 + 5 <= boxw
            if fits_h or boxw >= boxh:
                c.setFont("Helvetica-Bold", 5.4)
                maxc = max(4, int((boxw - 5) / 2.9))
                c.drawString(X(ox + x) + 2.5, Y(oy + y + h) - 7,
                             use if len(use) <= maxc else use[:maxc - 1].rstrip() + ".")
                if boxh > 15:
                    c.setFont("Helvetica", 4.6)
                    c.setFillColor(HexColor("#555555"))
                    maxc2 = max(4, int((boxw - 5) / 2.45))
                    c.drawString(X(ox + x) + 2.5, Y(oy + y + h) - 13,
                                 sub if len(sub) <= maxc2 else sub[:maxc2 - 1].rstrip() + ".")
            else:
                # narrow box: read the label vertically, standard CAD practice
                c.saveState()
                c.translate(X(ox + x) + 7, Y(oy + y) + 3)
                c.rotate(90)
                c.setFont("Helvetica-Bold", 5.2)
                maxc = max(4, int((boxh - 6) / 2.8))
                c.drawString(0, 0, use if len(use) <= maxc else use[:maxc - 1].rstrip() + ".")
                if boxw > 15:
                    c.setFont("Helvetica", 4.5)
                    c.setFillColor(HexColor("#555555"))
                    maxc2 = max(4, int((boxh - 6) / 2.4))
                    c.drawString(0, -6, sub if len(sub) <= maxc2 else sub[:maxc2 - 1].rstrip() + ".")
                c.restoreState()

    # legend and findings, right-hand column
    rx = PW * 0.62
    ry = PH - 90
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(rx, ry, "ZONES")
    for i, (z, (_, rgb, label)) in enumerate(ZONES.items()):
        yy = ry - 16 - i * 15
        r, g, b = rgb
        c.setFillColor(Color(r, g, b, alpha=0.30))
        c.setStrokeColor(Color(r * 0.7, g * 0.7, b * 0.7))
        c.rect(rx, yy, 16, 9, fill=1, stroke=1)
        c.setFillColor(HexColor("#23302B"))
        c.setFont("Helvetica", 7.2)
        c.drawString(rx + 22, yy + 1.5, label)

    fy = ry - 16 - len(ZONES) * 15 - 26
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(rx, fy, "CAPACITY FINDINGS")
    findings = [
        ("NO STRUCTURAL WALL REMOVAL. Every room is used as",
         "it stands. Subdivision adds stud partitions; light",
         "breaking is for three or four door openings only."),
        ("Ground floor is a CONVERSION HUB, not one tenant's",
         "clinic. Alameda anchors it on 67 drive days a year;",
         "the other 209 days are sellable to other groups."),
        ("Imaging is campus facility, not one tenant's space.",
         "X-ray, ultrasound and echo serve the Conversion",
         "Clinic, Ring 2 pre-op clearance and the theatre."),
        ("Wet functions follow the existing plumbing. The first-",
         "floor kitchen becomes the PROCEDURE ROOM and a bath",
         "becomes sterilising. No new drainage runs."),
        ("First floor is 5 CONSULTING ROOMS, a procedure room,",
         "the FUE suite, a 34 sqm members' lounge and a",
         "coordinator room. Not a room-maximised floor."),
        ("A day case theatre must be at ground level for trolley",
         "evacuation, and does not fit inside the main building.",
         "It is a new unit on the grounds, and it serves Alameda,"),
        ("the aesthetic surgeons and the Ring 2 surgical",
         "specialists alike. Cases that do not need Cairo get",
         "done here and earn locally."),
    ]
    yy = fy - 15
    for i, lines in enumerate(findings):
        c.setFillColor(NAVY)
        c.setFont("Helvetica-Bold", 7.2)
        c.drawString(rx, yy, "%d." % (i + 1))
        c.setFillColor(HexColor("#23302B"))
        c.setFont("Helvetica", 7.2)
        for j, ln in enumerate(lines):
            c.drawString(rx + 12, yy - j * 9.2, ln)
        yy -= len(lines) * 9.2 + 8

    c.setFillColor(HexColor("#FBF0E4"))
    c.rect(rx, yy - 44, PW - rx - 28, 40, fill=1, stroke=0)
    c.setFillColor(HexColor("#B8763A"))
    c.rect(rx, yy - 44, 2.5, 40, fill=1, stroke=0)
    c.setFillColor(HexColor("#23302B"))
    c.setFont("Helvetica-Bold", 7.2)
    c.drawString(rx + 8, yy - 15, "This is an allocation schedule, not a floor plan.")
    c.setFont("Helvetica", 7)
    c.drawString(rx + 8, yy - 25, "Areas are true. Positions are not: rooms are packed into")
    c.drawString(rx + 8, yy - 34, "equal-width columns for legibility. Overlay on the real CAD.")

    c.setFillColor(HexColor("#7C7C74"))
    c.setFont("Helvetica", 6)
    c.drawString(28, 22, "Areas are true, from the as-built dimension strings. Positions are indicative: "
                         "rooms are packed in reading order, not traced wall-for-wall. "
                         "Companion CAD file: lyfeplace-abuja-allocation.dxf  /  units mm")
    c.showPage()
    c.save()
    print("wrote %s" % PDF_OUT)


if __name__ == "__main__":
    write_dxf()
    write_pdf()
