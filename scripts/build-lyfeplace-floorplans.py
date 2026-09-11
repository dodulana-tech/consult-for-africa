"""
Lyfe Place Abuja: measured floor plans of the target operating state.

Unlike scripts/build-lyfeplace-cad.py, which packs room rectangles into columns because
the earlier pass could not recover wall positions, this draws the building where it
actually is. The as-built PDFs turned out to be vector exports, so scripts/lyfeplace_survey.py
recovers wall faces, door swings and window symbols exactly, to about 10 mm against the
dimension chains. Everything here is drawn on that geometry at 1:40.

Outputs:
  docs/lyfeplace-abuja/lyfeplace-abuja-floor-plans-cfa.pdf   7 sheets, A1 landscape, 1:40
  docs/lyfeplace-abuja/lyfeplace-abuja-floor-plans.dxf       AutoCAD R12 ASCII, mm, layered

Run:
  python3 scripts/build-lyfeplace-floorplans.py
"""

from __future__ import annotations

import math
from pathlib import Path

from reportlab.lib.colors import HexColor, black, white
from reportlab.pdfgen import canvas

from lyfeplace_survey import CELL, load, row_runs, openings

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs" / "lyfeplace-abuja"
PDF_OUT = DOCS / "lyfeplace-abuja-floor-plans-cfa.pdf"
DXF_OUT = DOCS / "lyfeplace-abuja-floor-plans.dxf"

NAVY = HexColor("#0F3D2E")
GOLD = HexColor("#C6A15B")
INK = HexColor("#1A1A1A")
MUTED = HexColor("#7C7C74")
RULE = HexColor("#D8DEDA")

PT_PER_MM = 2.834645669
A1 = (2384.0, 1684.0)          # landscape
DRAW_SCALE = 40.0              # 1:40, chosen so the plan fills an A1 sheet
SC = PT_PER_MM / DRAW_SCALE    # page points per real millimetre

# ---------------------------------------------------------------- zones
ZONES = {
    "THEATRE":     ("#D96C6C", 1,  "Day case theatre suite, sole use"),
    "CLINIC":      ("#6E9BC5", 5,  "Consulting, private medical plaza"),
    "PROCEDURE":   ("#A987C4", 6,  "Procedure and treatment"),
    "DIAGNOSTICS": ("#6FAE7E", 3,  "Diagnostics and imaging"),
    "PHARMACY":    ("#D4B25A", 2,  "Pharmacy, patient facing"),
    "COMMON":      ("#AEB6B0", 8,  "Arrival, circulation, WC"),
    "BOH":         ("#CBD0CA", 9,  "Back of house"),
}

# ---------------------------------------------------------------- new partitions
# Blockwork or stud walls that do not exist today. Coordinates in millimetres on the
# survey origin, so they can be handed straight to the architect. Ends are taken to the
# centreline of the wall they die into, which is both correct drafting and what makes
# them close the flood fill.
NEW_WALLS = {
    "ground": [],
    "first": [
        # Consulting spine, formed in the 41.8 sqm south-west living room
        ((3467, 11000), (11772, 11000)),
        ((6300, 11000), (6300, 16166)),
        ((8950, 11000), (8950, 16166)),
        # Two consulting rooms formed in the 33.4 sqm south-east bedroom
        ((14800, 9650), (14800, 16166)),
    ],
}

# New door openings in the new partitions: (x, y, width, orientation, swing quadrant)
# orientation "h" = opening lies in a horizontal wall, "v" = vertical wall.
NEW_DOORS = {
    "ground": [],
    "first": [
        (4900, 11000, 900, "h", "sw"),
        (7550, 11000, 900, "h", "sw"),
        (10200, 11000, 900, "h", "sw"),
        (14800, 10500, 900, "v", "se"),
    ],
}

# New openings cut in existing EXTERNAL walls. None of these exists today, and the
# flow rules in the brief cannot be kept without them: with one external door the
# specimen and clinical waste routes have to cross the patient waiting hall.
NEW_EXTERNAL_DOORS = {
    "ground": [
        (15500, 16166, 1200, "h", "sw"),   # ambulance and trolley access, off the theatre
        (5500, 2940, 1000, "h", "nw"),     # back of house exit, specimens to the chalet
        (24545, 7300, 900, "v", "ne"),     # clinical waste exit, off the dirty utility
    ],
    "first": [],
}

# ---------------------------------------------------------------- schedule
# Anchor points pick the region out of the flood fill, so the mapping survives any
# change in region ordering. (anchor x, anchor y, use, zone, note)
SCHEDULE = {
    "ground": [
        (4212, 11888, "RECEPTION, WAITING AND CONCIERGE", "COMMON",
         "Single arrival point for the campus. Two waiting zones divided by joinery, not a wall"),
        (13588, 7938, "CIRCULATION SPINE", "COMMON", "Controlled entry to the theatre suite off this spine"),
        (15088, 12812, "DAY CASE THEATRE", "THEATRE",
         "Positive pressure HEPA from external AHU. Isolated power with UPS. Level trolley access south"),
        (21588, 10388, "MONITORED RECOVERY, 2 BAYS", "THEATRE", "Oxygen, suction and monitoring to each bay"),
        (17762, 10638, "SCRUB AND STERILE STORE", "THEATRE", "Existing drainage. One way dirty to clean"),
        (22662, 7288, "DIRTY UTILITY", "THEATRE", "Existing drainage. Waste leaves without re-entering the suite"),
        (22562, 3012, "CONSULTING 1", "CLINIC", "Ground floor room, beside imaging, for pre and post operative clinics"),
        (11262, 3238, "DIGITAL X-RAY, LEAD SHIELDED", "DIAGNOSTICS",
         "Lead to walls, door and observation panel. Warning light interlock. Fixed here by weight and evacuation"),
        (13388, 1612, "X-RAY CHANGING AND CONTROL", "DIAGNOSTICS", "Shielded control position"),
        (6088, 7338, "PHLEBOTOMY AND SPECIMEN HANDLING", "DIAGNOSTICS",
         "Existing water and drainage. Specimen pass-out to the chalet laboratory"),
        (5788, 4112, "CLEAN UTILITY AND CONSUMABLES", "BOH", "Off the staff route, not the waiting hall"),
        (1788, 3988, "MEDICATION COLLECTION POINT", "PHARMACY",
         "Serving hatch to the waiting hall. The pharmacy's only patient facing space"),
        (19362, 2038, "STAFF CHANGE AND WC", "BOH", "On the back of house route at the head of the stair"),
        (17088, 3012, "STAIRCASE", "COMMON", "No lift, and none to be added"),
        (14888, 3538, "STAFF CIRCULATION", "COMMON", "Back of house route, does not pass through waiting"),
        (10938, 13462, "ENTRANCE VESTIBULE", "COMMON", "Draught lobby, wheelchair turning circle"),
        (10762, 15512, "ENTRANCE PORCH", "COMMON", "The only patient entrance to the campus"),
        (20538, 6162, "CIRCULATION", "COMMON", ""),
        (20412, 4262, "CIRCULATION", "COMMON", ""),
    ],
    "first": [
        (12462, 3138, "DOCTORS' AND MEMBERS' LOUNGE", "COMMON",
         "At the head of the stair. Touchdown desks and refreshments. Part of what the membership buys"),
        (5812, 7338, "FUE HAIR TRANSPLANT SUITE", "PROCEDURE",
         "Existing water and drainage for graft preparation. 360 degree access for three to four operators"),
        (16862, 7762, "TREATMENT ROOM", "PROCEDURE",
         "Local and topical anaesthesia only. No sedation above ground level, at any budget"),
        (21538, 1938, "ULTRASOUND AND ECHOCARDIOGRAPHY", "DIAGNOSTICS",
         "Beside the consultants who order it. Dimmable lighting, hand-wash, changing space"),
        (11638, 7938, "STERILISING AND CLEAN UTILITY", "COMMON",
         "Shares the drainage run with the FUE suite. Dirty to clean in one direction"),
        (2012, 12712, "CONSULTING 2", "CLINIC", "Family practice"),
        (21438, 9812, "CONSULTING 3", "CLINIC", "Family practice"),
        (16938, 3088, "STAIRCASE", "COMMON", ""),
        (2088, 4238, "LINEN AND CONSUMABLES", "BOH", ""),
        (22288, 5038, "PATIENT WC, ACCESSIBLE", "COMMON", "Emergency pull cord"),
        (1262, 7612, "STAFF WC", "COMMON", ""),
        (6912, 3812, "TERRACE", "COMMON", "Member amenity, off the lounge"),
        (17262, 14938, "PATIENT WC", "COMMON", "Emergency pull cord"),
        (23638, 7838, "PHLEBOTOMY DRAW POINT", "DIAGNOSTICS",
         "So first floor patients do not descend for bloods"),
        (19812, 6212, "CIRCULATION", "COMMON", ""),
        (10412, 10312, "CIRCULATION", "COMMON", ""),
        (19062, 4988, "STAIR LANDING", "COMMON", ""),
        # formed by the new partitions
        (7600, 10400, "CONSULTING CORRIDOR", "COMMON", "New spine, 1,200 mm clear"),
        (4900, 13500, "CONSULTING 4", "CLINIC", "New partitions"),
        (7600, 13500, "CONSULTING 5", "CLINIC", "New partitions"),
        (10200, 13500, "CONSULTING 6", "CLINIC", "New partitions"),
        (13000, 12800, "CONSULTING 7", "CLINIC", "New partition"),
        (16500, 11500, "CONSULTING 8", "CLINIC", "New partition"),
    ],
}


# ---------------------------------------------------------------- routing
# Flows are not drawn by hand. A walkability grid is built from the wall faces only,
# so every doorway the survey recorded is a real gap, and the routes are shortest
# paths through those gaps. A line that crosses a wall on these sheets would be a bug,
# not a drafting shortcut.
WALK_CELL = 50.0
WALK_CLEAR = 3          # cells kept off the wall face, 150 mm


def walk_grid(tag, geo):
    segs = list(geo["wall"]) + list(geo.get("fill", []))
    for a, b in NEW_WALLS[tag]:
        segs.append((a, b))
    xs = [p[0] for a, b in geo["wall"] for p in (a, b)]
    ys = [p[1] for a, b in geo["wall"] for p in (a, b)]
    nx = int(max(xs) / WALK_CELL) + 8
    ny = int(max(ys) / WALK_CELL) + 8
    solid = bytearray(nx * ny)

    def stamp(a, b, value=1):
        ax, ay, bx, by = a[0] / WALK_CELL, a[1] / WALK_CELL, b[0] / WALK_CELL, b[1] / WALK_CELL
        n = max(2, int(max(abs(bx - ax), abs(by - ay)) * 2) + 1)
        for i in range(n + 1):
            t = i / n
            x, y = ax + (bx - ax) * t, ay + (by - ay) * t
            for dx in (0, 1):
                for dy in (0, 1):
                    cx, cy = int(x) + dx, int(y) + dy
                    if 0 <= cx < nx and 0 <= cy < ny:
                        solid[cy * nx + cx] = value

    for a, b in segs:
        stamp(a, b)
    # punch the new openings back out, including the ones cut in existing external walls
    for x, y, w, o, q in NEW_DOORS[tag] + NEW_EXTERNAL_DOORS[tag]:
        if o == "h":
            stamp((x - w / 2, y - 400), (x + w / 2, y - 400), 0)
            for dy in range(-8, 9):
                stamp((x - w / 2, y + dy * WALK_CELL), (x + w / 2, y + dy * WALK_CELL), 0)
        else:
            for dx in range(-8, 9):
                stamp((x + dx * WALK_CELL, y - w / 2), (x + dx * WALK_CELL, y + w / 2), 0)

    # keep routes off the wall faces
    for _ in range(WALK_CLEAR):
        grow = bytearray(solid)
        for i, v in enumerate(solid):
            if v:
                cx, cy = i % nx, i // nx
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    jx, jy = cx + dx, cy + dy
                    if 0 <= jx < nx and 0 <= jy < ny:
                        grow[jy * nx + jx] = 1
        solid = grow
    return solid, nx, ny


def _nearest_free(solid, nx, ny, p):
    cx, cy = int(p[0] / WALK_CELL), int(p[1] / WALK_CELL)
    best, bestd = None, 1e18
    for r in range(0, 40):
        for dx in range(-r, r + 1):
            for dy in (-r, r) if r else (0,):
                for jx, jy in ((cx + dx, cy + dy), (cx + dy, cy + dx)):
                    if 0 <= jx < nx and 0 <= jy < ny and not solid[jy * nx + jx]:
                        d = (jx - cx) ** 2 + (jy - cy) ** 2
                        if d < bestd:
                            best, bestd = (jx, jy), d
        if best:
            return best
    return None


def _bfs(solid, nx, ny, a, b):
    import collections as _c
    start, goal = _nearest_free(solid, nx, ny, a), _nearest_free(solid, nx, ny, b)
    if not start or not goal:
        return []
    si, gi = start[1] * nx + start[0], goal[1] * nx + goal[0]
    prev = {si: None}
    q = _c.deque([si])
    while q:
        i = q.popleft()
        if i == gi:
            break
        cx, cy = i % nx, i // nx
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            jx, jy = cx + dx, cy + dy
            if 0 <= jx < nx and 0 <= jy < ny:
                j = jy * nx + jx
                if not solid[j] and j not in prev:
                    prev[j] = i
                    q.append(j)
    if gi not in prev:
        return []
    out, i = [], gi
    while i is not None:
        out.append(((i % nx) * WALK_CELL + WALK_CELL / 2, (i // nx) * WALK_CELL + WALK_CELL / 2))
        i = prev[i]
    return out[::-1]


def _simplify(pts, tol=180.0):
    if len(pts) < 3:
        return pts
    a, b = pts[0], pts[-1]
    dx, dy = b[0] - a[0], b[1] - a[1]
    n = math.hypot(dx, dy) or 1.0
    worst, wi = 0.0, 0
    for i in range(1, len(pts) - 1):
        d = abs(dy * (pts[i][0] - a[0]) - dx * (pts[i][1] - a[1])) / n
        if d > worst:
            worst, wi = d, i
    if worst <= tol:
        return [a, b]
    return _simplify(pts[:wi + 1], tol)[:-1] + _simplify(pts[wi:], tol)


def route(tag, geo, waypoints):
    solid, nx, ny = walk_grid(tag, geo)
    out = []
    for i in range(len(waypoints) - 1):
        leg = _bfs(solid, nx, ny, waypoints[i], waypoints[i + 1])
        if not leg:
            print("  %s: no route from %s to %s" % (tag, waypoints[i], waypoints[i + 1]))
            continue
        out += leg if not out else leg[1:]
    return _simplify(out) if out else []


# ---------------------------------------------------------------- flows
# Polylines in millimetres. Drawn as centreline routes, not corridors.
FLOWS = {
    "ground": [
        ("PATIENT", "#1F6FB8", [(10900, 17600), (10900, 15400), (10900, 13400), (4212, 11888)]),
        ("PATIENT", "#1F6FB8", [(4212, 11888), (13588, 7938), (22562, 3012)]),
        ("PATIENT", "#1F6FB8", [(13588, 7938), (11262, 3238)]),
        ("PATIENT", "#1F6FB8", [(13588, 7938), (21588, 10388)]),
        ("STAFF", "#E08A1E", [(14888, 3538), (13588, 7938), (5788, 4112)]),
        ("STAFF", "#E08A1E", [(14888, 3538), (19362, 2038)]),
        ("SPECIMEN", "#2E9E5B", [(6088, 7338), (5788, 4112), (5500, 1900)]),
        ("WASTE", "#B03030", [(15088, 12812), (17762, 10638), (22662, 7288), (25400, 7300)]),
    ],
    "first": [
        ("PATIENT", "#1F6FB8", [(16938, 3088), (12462, 3138), (7600, 10400), (4900, 13500)]),
        ("PATIENT", "#1F6FB8", [(7600, 10400), (7600, 13500)]),
        ("PATIENT", "#1F6FB8", [(7600, 10400), (10200, 13500)]),
        ("PATIENT", "#1F6FB8", [(16938, 3088), (13000, 12800)]),
        ("PATIENT", "#1F6FB8", [(16938, 3088), (21438, 9812)]),
        ("STAFF", "#E08A1E", [(16938, 3088), (11638, 7938), (2088, 4238)]),
        ("SPECIMEN", "#2E9E5B", [(23638, 7838), (16938, 3088)]),
        ("WASTE", "#B03030", [(16862, 7762), (11638, 7938), (16938, 3088)]),
    ],
}

FLOW_LABEL = {
    "PATIENT": "Patient  arrival, waiting, consulting room, out",
    "STAFF": "Staff  back of house, never through the waiting hall",
    "SPECIMEN": "Specimen  draw point to the chalet laboratory",
    "WASTE": "Clinical waste  to the external holding area",
}
FLOW_ORDER = ["PATIENT", "STAFF", "SPECIMEN", "WASTE"]

SHEET_TITLES = {
    "ground": "GROUND FLOOR",
    "first": "FIRST FLOOR",
}


# ---------------------------------------------------------------- helpers
def assign(rooms, schedule):
    """Attach the target use to each region by nearest anchor, and report both ways."""
    used, out, orphan_anchors = set(), [], []
    for ax, ay, use, zone, note in schedule:
        best, bestd = None, 1e18
        for r in rooms:
            if r["n"] in used:
                continue
            d = (r["seed"][0] - ax) ** 2 + (r["seed"][1] - ay) ** 2
            if d < bestd:
                best, bestd = r, d
        if best is None or bestd > 3000 ** 2:
            orphan_anchors.append((use, ax, ay, math.sqrt(bestd) if best else -1))
            continue
        used.add(best["n"])
        rec = dict(best)
        rec.update({"use": use, "zone": zone, "note": note})
        out.append(rec)
    unmapped = [r for r in rooms if r["n"] not in used]
    return out, unmapped, orphan_anchors


def door_symbol(c, x, y, width, orient, quad, colour, lw=0.9):
    """A new door: jambs, leaf and swing arc, drawn like the surveyed ones."""
    c.setStrokeColor(colour)
    c.setLineWidth(lw)
    if orient == "h":
        hx = -1 if "w" in quad else 1
        vy = -1 if "n" in quad else 1
        hinge = (x - width / 2 * hx, y)
        leaf = (hinge[0], hinge[1] + width * vy)
        c.line(X(hinge[0]), Y(hinge[1]), X(leaf[0]), Y(leaf[1]))
        arc(c, hinge, width, 90 if vy > 0 else 270, 0 if hx > 0 else 180)
    else:
        vy = -1 if "n" in quad else 1
        hx = -1 if "w" in quad else 1
        hinge = (x, y - width / 2 * vy)
        leaf = (hinge[0] + width * hx, hinge[1])
        c.line(X(hinge[0]), Y(hinge[1]), X(leaf[0]), Y(leaf[1]))
        arc(c, hinge, width, 0 if hx > 0 else 180, 90 if vy > 0 else 270)


def arc(c, centre, r, a0, a1):
    steps = 14
    if a1 < a0:
        a1 += 360
    pts = []
    for i in range(steps + 1):
        a = math.radians(a0 + (a1 - a0) * i / steps)
        pts.append((centre[0] + r * math.cos(a), centre[1] + r * math.sin(a)))
    p = c.beginPath()
    p.moveTo(X(pts[0][0]), Y(pts[0][1]))
    for q in pts[1:]:
        p.lineTo(X(q[0]), Y(q[1]))
    c.drawPath(p)


# world -> page, rebound per sheet
_ORIGIN = [0.0, 0.0]


def X(v):
    return _ORIGIN[0] + v * SC


def Y(v):
    return _ORIGIN[1] - v * SC


def set_origin(ox, oy):
    _ORIGIN[0], _ORIGIN[1] = ox, oy


def wrap(text, width, c, font, size):
    c.setFont(font, size)
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if c.stringWidth(t, font, size) <= width:
            cur = t
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


# ---------------------------------------------------------------- sheet furniture
def frame(c, title, subtitle, sheet_no, total):
    c.setFillColor(NAVY)
    c.rect(0, A1[1] - 58, A1[0], 58, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(0, A1[1] - 64, A1[0], 6, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 19)
    c.drawString(40, A1[1] - 38, "LYFE PLACE ABUJA")
    c.setFont("Helvetica", 13)
    c.drawString(268, A1[1] - 38, title)
    c.setFillColor(HexColor("#CBDDD1"))
    c.setFont("Helvetica", 10)
    c.drawRightString(A1[0] - 40, A1[1] - 26, subtitle)
    c.drawRightString(A1[0] - 40, A1[1] - 42, "Consult for Africa   /   sheet %d of %d" % (sheet_no, total))
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 7.5)
    c.drawString(40, 22,
                 "Drawn from the as-built survey PDFs by vector extraction, not tracing. "
                 "Wall faces, door swings and window symbols are the surveyed positions. "
                 "Areas are net internal, measured on a 25 mm grid. Units millimetres.")
    c.drawRightString(A1[0] - 40, 22, "Scale 1:40 at A1   /   %s" % PDF_OUT.name)


def scale_bar(c, x, y):
    c.setFont("Helvetica", 7)
    c.setFillColor(INK)
    c.setStrokeColor(INK)
    c.setLineWidth(0.6)
    for i in range(5):
        c.setFillColor(INK if i % 2 == 0 else white)
        c.rect(x + i * 1000 * SC, y, 1000 * SC, 6, fill=1, stroke=1)
    c.setFillColor(INK)
    for i in range(6):
        c.drawCentredString(x + i * 1000 * SC, y - 10, str(i))
    c.drawString(x + 5000 * SC + 8, y - 1, "metres")


def north_point(c, x, y, r=17):
    c.setStrokeColor(INK)
    c.setLineWidth(0.8)
    c.circle(x, y, r, fill=0, stroke=1)
    p = c.beginPath()
    p.moveTo(x, y + r)
    p.lineTo(x - r * 0.34, y - r * 0.5)
    p.lineTo(x, y - r * 0.2)
    p.lineTo(x + r * 0.34, y - r * 0.5)
    p.close()
    c.setFillColor(INK)
    c.drawPath(p, fill=1, stroke=1)
    c.setFont("Helvetica-Bold", 8)
    c.drawCentredString(x, y + r + 5, "N")
    c.setFont("Helvetica", 6)
    c.setFillColor(MUTED)
    c.drawCentredString(x, y - r - 10, "assumed")


# ---------------------------------------------------------------- plan drawing
def draw_fills(c, mapped, nx, alpha=1.0):
    for r in mapped:
        col = HexColor(ZONES[r["zone"]][0])
        c.setFillColor(col, alpha=alpha)
        c.setStrokeColor(col, alpha=alpha)
        c.setLineWidth(0.2)
        for x, y, w, h in row_runs(r["cells"], nx):
            c.rect(X(x), Y(y + h), w * SC, h * SC, fill=1, stroke=1)


def draw_shell(c, geo, new_walls=(), doors=True):
    if doors:
        c.setStrokeColor(HexColor("#4A4A4A"))
        c.setLineWidth(0.55)
        for a, b in geo.get("door", []):
            c.line(X(a[0]), Y(a[1]), X(b[0]), Y(b[1]))
    c.setFillColor(INK)
    c.setStrokeColor(INK)
    c.setLineWidth(0.35)
    for a, b in geo.get("fill", []):
        c.line(X(a[0]), Y(a[1]), X(b[0]), Y(b[1]))
    c.setStrokeColor(INK)
    c.setLineWidth(1.35)
    for a, b in geo["wall"]:
        c.line(X(a[0]), Y(a[1]), X(b[0]), Y(b[1]))
    if new_walls:
        c.setStrokeColor(HexColor("#B03030"))
        c.setLineWidth(3.2)
        for a, b in new_walls:
            c.line(X(a[0]), Y(a[1]), X(b[0]), Y(b[1]))


def draw_stairs(c, tag):
    """Tread lines, redrawn rather than pulled off the dimension layer."""
    if tag == "ground":
        x0, x1, y0, y1, n = 15750, 17150, 900, 4250, 13
    else:
        x0, x1, y0, y1, n = 15900, 17300, 900, 4250, 13
    c.setStrokeColor(HexColor("#6A6A6A"))
    c.setLineWidth(0.5)
    for i in range(n + 1):
        y = y0 + (y1 - y0) * i / n
        c.line(X(x0), Y(y), X(x1), Y(y))
    c.setLineWidth(0.8)
    mid = (x0 + x1) / 2
    c.line(X(mid), Y(y0 + 200), X(mid), Y(y1 - 200))
    p = c.beginPath()
    tip = y1 - 200 if tag == "first" else y0 + 200
    d = -1 if tag == "first" else 1
    p.moveTo(X(mid), Y(tip))
    p.lineTo(X(mid - 180), Y(tip + 320 * d))
    p.lineTo(X(mid + 180), Y(tip + 320 * d))
    p.close()
    c.setFillColor(HexColor("#6A6A6A"))
    c.drawPath(p, fill=1, stroke=0)
    c.setFont("Helvetica", 5.5)
    c.setFillColor(MUTED)
    c.drawCentredString(X(mid), Y(y1 + 500), "UP" if tag == "ground" else "DN")


def label_rooms(c, mapped):
    for r in mapped:
        sx, sy = r["seed"]
        w = max(r["bbox"][2] - r["bbox"][0], 1500)
        lines = wrap(r["use"], min(w * SC * 0.92, 118), c, "Helvetica-Bold", 5.6)
        c.setFillColor(INK)
        top = Y(sy) + (len(lines) - 1) * 3.1 + 3
        for i, ln in enumerate(lines):
            c.setFont("Helvetica-Bold", 5.6)
            c.drawCentredString(X(sx), top - i * 6.2, ln)
        c.setFont("Helvetica", 5.2)
        c.setFillColor(HexColor("#3E4A44"))
        c.drawCentredString(X(sx), top - len(lines) * 6.2 - 0.5, "%.1f sqm" % r["area"])


def legend(c, x, y, mapped, extra_note=None):
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(x, y, "ZONES")
    yy = y - 16
    present = [z for z in ZONES if any(r["zone"] == z for r in mapped)]
    for z in present:
        col, _, desc = ZONES[z]
        c.setFillColor(HexColor(col))
        c.rect(x, yy - 2, 18, 9, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("Helvetica-Bold", 7)
        c.drawString(x + 25, yy + 1, z)
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 7)
        c.drawString(x + 92, yy + 1, desc)
        yy -= 14
    if extra_note:
        yy -= 6
        for ln in wrap(extra_note, 330, c, "Helvetica", 7):
            c.setFillColor(MUTED)
            c.setFont("Helvetica", 7)
            c.drawString(x, yy, ln)
            yy -= 9
    return yy


def schedule_table(c, x, y, mapped, width=340):
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(x, y, "ROOM SCHEDULE, MEASURED")
    yy = y - 15
    c.setFont("Helvetica-Bold", 6.4)
    c.setFillColor(MUTED)
    c.drawString(x, yy, "USE")
    c.drawString(x + 214, yy, "WAS")
    c.drawRightString(x + width, yy, "SQM")
    yy -= 4
    c.setStrokeColor(RULE)
    c.setLineWidth(0.5)
    c.line(x, yy, x + width, yy)
    yy -= 10
    for r in sorted(mapped, key=lambda r: -r["area"]):
        c.setFillColor(HexColor(ZONES[r["zone"]][0]))
        c.rect(x, yy - 1, 5, 6, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("Helvetica", 6.6)
        use = r["use"]
        while c.stringWidth(use, "Helvetica", 6.6) > 198:
            use = use[:-2]
        c.drawString(x + 10, yy, use)
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 6.2)
        c.drawString(x + 214, yy, (" ".join(r["was"]) or "new")[:22])
        c.setFillColor(INK)
        c.setFont("Helvetica", 6.6)
        c.drawRightString(x + width, yy, "%.1f" % r["area"])
        yy -= 9.4
    yy -= 2
    c.setStrokeColor(RULE)
    c.line(x, yy + 5, x + width, yy + 5)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 7)
    c.drawString(x + 10, yy - 5, "NET INTERNAL, THIS FLOOR")
    c.drawRightString(x + width, yy - 5, "%.1f" % sum(r["area"] for r in mapped))
    return yy - 20


# ---------------------------------------------------------------- sheets
def sheet_plan(c, tag, d, mapped, sheet_no, total):
    frame(c, SHEET_TITLES[tag] + "  /  TARGET OPERATING STATE",
          "Measured from the as-built survey", sheet_no, total)
    set_origin(56, A1[1] - 108)
    draw_fills(c, mapped, d["nx"])
    draw_shell(c, d["geo"], NEW_WALLS[tag])
    for x, y, w, o, q in NEW_DOORS[tag] + NEW_EXTERNAL_DOORS[tag]:
        door_symbol(c, x, y, w, o, q, HexColor("#B03030"))
    draw_stairs(c, tag)
    label_rooms(c, mapped)
    scale_bar(c, 56, 300)
    north_point(c, 300, 316)
    lx = 56 + 24695 * SC + 52
    yy = legend(c, lx, A1[1] - 108, mapped,
                "Red walls are new. Red door symbols are new openings. Everything in black is surveyed.")
    schedule_table(c, lx, yy - 14, mapped)


def sheet_flow(c, tag, d, mapped, sheet_no, total):
    frame(c, SHEET_TITLES[tag] + "  /  ACCESS AND FLOW",
          "Four routes, and where they must not cross", sheet_no, total)
    set_origin(56, A1[1] - 108)
    draw_fills(c, mapped, d["nx"], alpha=0.22)
    draw_shell(c, d["geo"], NEW_WALLS[tag])
    for x, y, w, o, q in NEW_DOORS[tag] + NEW_EXTERNAL_DOORS[tag]:
        door_symbol(c, x, y, w, o, q, HexColor("#9A9A9A"))
    draw_stairs(c, tag)
    dash = {"PATIENT": None, "STAFF": (5, 3), "SPECIMEN": (2.5, 2.5), "WASTE": (7, 3, 2, 3)}
    for kind, colour, waypoints in FLOWS[tag]:
        pts = route(tag, d["geo"], waypoints)
        if len(pts) < 2:
            continue
        c.setStrokeColor(HexColor(colour))
        c.setLineWidth(2.4)
        c.setLineCap(1)
        if dash[kind]:
            c.setDash(*[dash[kind]])
        p = c.beginPath()
        p.moveTo(X(pts[0][0]), Y(pts[0][1]))
        for q in pts[1:]:
            p.lineTo(X(q[0]), Y(q[1]))
        c.drawPath(p)
        c.setDash()
        ax, ay = pts[-2], pts[-1]
        ang = math.atan2(-(ay[1] - ax[1]), ay[0] - ax[0])
        c.setFillColor(HexColor(colour))
        head = c.beginPath()
        head.moveTo(X(ay[0]), Y(ay[1]))
        for s in (2.5, -2.5):
            head.lineTo(X(ay[0]) - 11 * math.cos(ang - s / 9), Y(ay[1]) + 11 * math.sin(ang - s / 9))
        head.close()
        c.drawPath(head, fill=1, stroke=0)
    for r in mapped:
        if r["area"] < 6:
            continue
        sx, sy = r["seed"]
        c.setFont("Helvetica", 5)
        c.setFillColor(HexColor("#55605A"))
        use = r["use"]
        while c.stringWidth(use, "Helvetica", 5) > max(r["bbox"][2] - r["bbox"][0], 2000) * SC:
            use = use[:-2]
        c.drawCentredString(X(sx), Y(sy), use)
    scale_bar(c, 56, 300)
    north_point(c, 300, 316)
    lx = 56 + 24695 * SC + 52
    yy = A1[1] - 108
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(lx, yy, "ROUTES")
    yy -= 20
    for kind in FLOW_ORDER:
        colour = next((c_ for k, c_, _ in FLOWS[tag] if k == kind), None)
        if colour is None:
            continue
        c.setStrokeColor(HexColor(colour))
        c.setLineWidth(2.6)
        if dash[kind]:
            c.setDash(*[dash[kind]])
        c.line(lx, yy + 2, lx + 34, yy + 2)
        c.setDash()
        c.setFillColor(INK)
        c.setFont("Helvetica-Bold", 7.4)
        c.drawString(lx + 42, yy, kind)
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 7)
        c.drawString(lx + 100, yy, FLOW_LABEL[kind].split("  ", 1)[1])
        yy -= 17
    yy -= 8
    rules = [
        "The specimen route must not cross the patient waiting hall.",
        "The clinical waste route must not cross the patient or specimen routes.",
        "Staff reach the lounge, sterilising and linen without passing through waiting.",
        "One reception desk, one patient entrance. Do not draw a second.",
        "The theatre suite has a single controlled entry off the spine. Nothing "
        "passes through it to reach anywhere else.",
    ]
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(lx, yy, "RULES THE DRAWING MUST KEEP")
    yy -= 15
    for r in rules:
        for i, ln in enumerate(wrap(r, 330, c, "Helvetica", 7.2)):
            c.setFillColor(INK if i == 0 else MUTED)
            c.setFont("Helvetica", 7.2)
            c.drawString(lx + (0 if i == 0 else 8), yy, ("-  " if i == 0 else "") + ln)
            yy -= 9.6
        yy -= 3


def sheet_works(c, tag, d, mapped, sheet_no, total):
    frame(c, SHEET_TITLES[tag] + "  /  DEMOLITION AND NEW WORK",
          "What is retained, what is formed", sheet_no, total)
    set_origin(56, A1[1] - 108)
    c.setFillColor(HexColor("#EFF2EF"))
    for r in mapped:
        c.setStrokeColor(HexColor("#EFF2EF"))
        c.setLineWidth(0.2)
        for x, y, w, h in row_runs(r["cells"], d["nx"]):
            c.rect(X(x), Y(y + h), w * SC, h * SC, fill=1, stroke=1)
    draw_shell(c, d["geo"], NEW_WALLS[tag])
    for x, y, w, o, q in NEW_DOORS[tag] + NEW_EXTERNAL_DOORS[tag]:
        door_symbol(c, x, y, w, o, q, HexColor("#B03030"), lw=1.1)
    draw_stairs(c, tag)
    op = openings(d["geo"])
    c.setStrokeColor(HexColor("#1F6FB8"))
    c.setLineWidth(2.2)
    for axis, pos, lo, hi in op["cased"]:
        if axis == "v":
            c.line(X(pos), Y(lo), X(pos), Y(hi))
        else:
            c.line(X(lo), Y(pos), X(hi), Y(pos))
    for r in mapped:
        sx, sy = r["seed"]
        c.setFont("Helvetica", 5)
        c.setFillColor(HexColor("#55605A"))
        use = r["use"]
        while c.stringWidth(use, "Helvetica", 5) > max(r["bbox"][2] - r["bbox"][0], 2000) * SC:
            use = use[:-2]
        c.drawCentredString(X(sx), Y(sy), use)
    scale_bar(c, 56, 300)
    north_point(c, 300, 316)
    lx = 56 + 24695 * SC + 52
    yy = A1[1] - 108
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(lx, yy, "KEY")
    yy -= 20
    keys = [
        (INK, 1.4, "Existing wall, retained"),
        (HexColor("#B03030"), 3.2, "New partition"),
        (HexColor("#1F6FB8"), 2.2, "Existing cased opening, no door today"),
        (HexColor("#4A4A4A"), 0.6, "Existing door swing or window, surveyed position"),
    ]
    for col, lw, txt in keys:
        c.setStrokeColor(col)
        c.setLineWidth(lw)
        c.line(lx, yy + 2, lx + 34, yy + 2)
        c.setFillColor(INK)
        c.setFont("Helvetica", 7.2)
        c.drawString(lx + 42, yy, txt)
        yy -= 16
    yy -= 8
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(lx, yy, "COUNTS, THIS FLOOR")
    yy -= 15
    rows = [
        ("Existing door and window openings, surveyed", str(len(op["door"]))),
        ("Existing cased openings with no door", str(len(op["cased"]))),
        ("New partitions", str(len(NEW_WALLS[tag]))),
        ("New internal door openings", str(len(NEW_DOORS[tag]))),
        ("New openings in external walls", str(len(NEW_EXTERNAL_DOORS[tag]))),
        ("Rooms in the target state", str(len(mapped))),
    ]
    for a, b in rows:
        c.setFillColor(INK)
        c.setFont("Helvetica", 7.2)
        c.drawString(lx, yy, a)
        c.setFont("Helvetica-Bold", 7.2)
        c.drawRightString(lx + 340, yy, b)
        yy -= 12
    yy -= 10
    notes = {
        "ground": [
            "No new partitions are needed on this floor. Every room in the target state "
            "is an existing room, which is why the ground floor can be fitted out first.",
            "The theatre suite is formed from four existing rooms that already adjoin: "
            "theatre, recovery, scrub and sterile store, dirty utility. Only the doors "
            "and the services change.",
            "The two waiting zones in the reception hall are divided by joinery, not a "
            "wall, so the single desk keeps sight of both.",
        ],
        "first": [
            "Four new partitions form five rooms out of two. Nothing structural is touched.",
            "The consulting spine is 1,200 mm clear. Three rooms hang off it at about "
            "13 sqm each. Two rooms of 18 sqm would be more comfortable and would take "
            "the plaza from eight consulting rooms to seven. That is a commercial call, "
            "not a technical one.",
            "No sedation on this floor at any budget. There is no lift, and a sedated "
            "patient must be evacuated horizontally.",
        ],
    }
    for n in notes[tag]:
        for i, ln in enumerate(wrap(n, 330, c, "Helvetica", 7.2)):
            c.setFillColor(INK if i == 0 else MUTED)
            c.setFont("Helvetica", 7.2)
            c.drawString(lx + (0 if i == 0 else 8), yy, ("-  " if i == 0 else "") + ln)
            yy -= 9.6
        yy -= 4


def sheet_cover(c, data, mapped_all, total):
    frame(c, "DRAWING SET  /  MEASURED FLOOR PLANS", "Target operating state", 1, total)
    x = 56
    y = A1[1] - 120
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 15)
    c.drawString(x, y, "What changed, and why these drawings are different")
    y -= 24
    intro = (
        "The earlier allocation drawing packed room rectangles into columns and said so, "
        "because wall centrelines could not be recovered from the as-built PDFs. That was "
        "wrong about the PDFs. They are vector exports from CAD, not scans, and the "
        "exporter used a separate pen width for wall faces, for door swings and window "
        "symbols, and for dimension lines. Every wall, every door and every swing on these "
        "sheets is the surveyed position, recovered to about 10 mm against the dimension "
        "chains. Rooms are flood filled between the real walls, so the areas are measured "
        "rather than assumed."
    )
    for ln in wrap(intro, 1180, c, "Helvetica", 10):
        c.setFillColor(INK)
        c.setFont("Helvetica", 10)
        c.drawString(x, y, ln)
        y -= 14
    y -= 18

    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(x, y, "Corrections to the architectural brief")
    y -= 20
    corrections = [
        ("Overall footprint", "24,695 x 13,025 mm", "24,695 x 16,317 mm",
         "The brief understated the depth. The building is deeper on the west than on the east, "
         "13,527 mm against 12,346 mm, and the two blocks are offset."),
        ("Theatre room", "24.7 sqm, from 5,729 x 4,306",
         "32.8 sqm measured",
         "The as-built dimension is 6,306 deep, not 4,306. The theatre is a third larger than "
         "assumed and comfortably takes a day case suite."),
        ("Recovery", "13.0 sqm in the Dining, across the plan",
         "19.2 sqm directly adjoining the theatre",
         "The Dining is open to the reception hall and is nowhere near the theatre. The east "
         "bedroom shares a wall with it, so the suite closes properly."),
        ("Reception and waiting", "58.1 sqm", "69.6 sqm measured",
         "The Living Room and Dining are one open space with no wall between them."),
        ("First floor consulting", "Three rooms of about 17 sqm each",
         "Three of about 13 sqm, or two of 18",
         "The room measures 41.8 sqm net, not 51.6. Three 17 sqm rooms plus a corridor needs "
         "space that is not there."),
    ]
    col = [0, 150, 330, 520]
    c.setFont("Helvetica-Bold", 7)
    c.setFillColor(MUTED)
    for i, hdr in enumerate(["ITEM", "BRIEF SAID", "SURVEY SAYS", "WHY IT MATTERS"]):
        c.drawString(x + col[i], y, hdr)
    y -= 5
    c.setStrokeColor(RULE)
    c.line(x, y, x + 1180, y)
    y -= 13
    for item, was, now, why in corrections:
        c.setFillColor(INK)
        c.setFont("Helvetica-Bold", 8)
        c.drawString(x + col[0], y, item)
        c.setFont("Helvetica", 8)
        c.setFillColor(MUTED)
        c.drawString(x + col[1], y, was)
        c.setFillColor(HexColor("#B03030"))
        c.setFont("Helvetica-Bold", 8)
        c.drawString(x + col[2], y, now)
        c.setFillColor(INK)
        c.setFont("Helvetica", 8)
        lines = wrap(why, 660, c, "Helvetica", 8)
        for i, ln in enumerate(lines):
            c.drawString(x + col[3], y - i * 10, ln)
        y -= max(len(lines) * 10, 10) + 8
    y -= 10

    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(x, y, "Measured areas")
    y -= 20
    hx = x
    for tag in ("ground", "first"):
        mapped = mapped_all[tag]
        c.setFillColor(NAVY)
        c.setFont("Helvetica-Bold", 9)
        c.drawString(hx, y, SHEET_TITLES[tag])
        yy = y - 14
        by_zone = {}
        for r in mapped:
            by_zone.setdefault(r["zone"], [0, 0.0])
            by_zone[r["zone"]][0] += 1
            by_zone[r["zone"]][1] += r["area"]
        for z in ZONES:
            if z not in by_zone:
                continue
            n, a = by_zone[z]
            c.setFillColor(HexColor(ZONES[z][0]))
            c.rect(hx, yy - 1, 6, 7, fill=1, stroke=0)
            c.setFillColor(INK)
            c.setFont("Helvetica", 8)
            c.drawString(hx + 12, yy, z.title())
            c.drawRightString(hx + 230, yy, "%d rooms" % n)
            c.setFont("Helvetica-Bold", 8)
            c.drawRightString(hx + 300, yy, "%.1f sqm" % a)
            yy -= 12
        c.setStrokeColor(RULE)
        c.line(hx, yy + 6, hx + 300, yy + 6)
        c.setFillColor(NAVY)
        c.setFont("Helvetica-Bold", 8.5)
        c.drawString(hx + 12, yy - 4, "Net internal")
        c.drawRightString(hx + 300, yy - 4, "%.1f sqm" % sum(r["area"] for r in mapped))
        hx += 360
    y -= 150

    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(x, y, "Sheets")
    y -= 18
    for i, s in enumerate(
        ["Drawing set, corrections and measured areas",
         "Ground floor, target operating state",
         "First floor, target operating state",
         "Ground floor, access and flow",
         "First floor, access and flow",
         "Ground floor, demolition and new work",
         "First floor, demolition and new work"], 1):
        c.setFillColor(GOLD if i == 1 else INK)
        c.setFont("Helvetica-Bold", 9)
        c.drawString(x, y, "%d" % i)
        c.setFillColor(INK)
        c.setFont("Helvetica", 9)
        c.drawString(x + 18, y, s)
        y -= 14
    y -= 12
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(x, y, "Not drawn here")
    y -= 16
    for ln in wrap(
        "The guest chalet and the boys' quarters have no as-built drawing in the pack, so "
        "they are not on these sheets. Their allocation stays in "
        "lyfeplace-abuja-allocation.pdf, which remains a schedule rather than a plan. "
        "Ask the vendor for those two survey drawings and they can be drawn the same way "
        "in an afternoon. Site levels, the car park, the external waste holding area and "
        "the ambulance standing are also outside this set: they need a site plan, which "
        "the pack does not contain.", 1180, c, "Helvetica", 9):
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 9)
        c.drawString(x, y, ln)
        y -= 12


# ---------------------------------------------------------------- DXF

def merged_rects(cells, nx):
    """Row runs stacked into the tallest rectangle that shares the same x span.

    row_runs is right for filling a PDF, where thousands of thin bars cost nothing.
    A DXF full of 25 mm slivers is unusable in AutoCAD, so merge first."""
    from collections import defaultdict
    runs = defaultdict(list)
    for x, y, w, h in row_runs(cells, nx):
        runs[(x, w)].append(y)
    out = []
    for (x, w), ys in runs.items():
        ys.sort()
        start = prev = ys[0]
        for y in ys[1:]:
            if abs(y - prev - CELL) < 1e-6:
                prev = y
            else:
                out.append((x, start, w, prev + CELL - start))
                start = prev = y
        out.append((x, start, w, prev + CELL - start))
    return out


def dxf(mapped_all, data):
    def pair(code, value):
        return "%d\n%s\n" % (code, value)

    def line(layer, a, b):
        return (pair(0, "LINE") + pair(8, layer) + pair(10, "%.1f" % a[0]) + pair(20, "%.1f" % -a[1])
                + pair(30, "0.0") + pair(11, "%.1f" % b[0]) + pair(21, "%.1f" % -b[1]) + pair(31, "0.0"))

    def text(layer, x, y, h, s):
        return (pair(0, "TEXT") + pair(8, layer) + pair(10, "%.1f" % x) + pair(20, "%.1f" % -y)
                + pair(30, "0.0") + pair(40, "%.1f" % h) + pair(1, s))

    def rect(layer, x, y, w, h):
        pts = [(x, y), (x + w, y), (x + w, y + h), (x, y + h), (x, y)]
        return "".join(line(layer, pts[i], pts[i + 1]) for i in range(4))

    layers = {"WALL-EXISTING": 7, "WALL-NEW": 1, "DOOR-EXISTING": 8, "DOOR-NEW": 1,
              "COLUMN": 7, "ROOM-TEXT": 7, "ROOM-AREA": 8, "GRID": 9, "NOTES": 8,
              "FLOW-PATIENT": 5, "FLOW-STAFF": 30, "FLOW-SPECIMEN": 3, "FLOW-WASTE": 1,
              "OPENING-CASED": 4}
    for z in ZONES:
        layers["ZONE-" + z] = ZONES[z][1]

    out = [pair(0, "SECTION") + pair(2, "HEADER") + pair(9, "$ACADVER") + pair(1, "AC1009")
           + pair(9, "$INSUNITS") + pair(70, "4") + pair(0, "ENDSEC")]
    out.append(pair(0, "SECTION") + pair(2, "TABLES") + pair(0, "TABLE") + pair(2, "LAYER")
               + pair(70, str(len(layers))))
    for name, colour in layers.items():
        out.append(pair(0, "LAYER") + pair(2, name) + pair(70, "0") + pair(62, str(colour))
                   + pair(6, "CONTINUOUS"))
    out.append(pair(0, "ENDTAB") + pair(0, "ENDSEC"))
    out.append(pair(0, "SECTION") + pair(2, "ENTITIES"))

    # the two floors side by side, 4 m apart, on the shared survey origin
    OFF = {"ground": 0.0, "first": 24695.0 + 4000.0}
    for tag, d in data.items():
        dx = OFF[tag]
        sh = lambda p: (p[0] + dx, p[1])
        out.append(text("NOTES", dx, -2400, 700, "LYFE PLACE ABUJA  %s  TARGET OPERATING STATE" % tag.upper()))
        out.append(text("NOTES", dx, -1500, 400,
                        "surveyed geometry, units mm, net internal areas measured on a 25 mm grid"))
        for a, b in d["geo"]["wall"]:
            out.append(line("WALL-EXISTING", sh(a), sh(b)))
        for a, b in d["geo"].get("door", []):
            out.append(line("DOOR-EXISTING", sh(a), sh(b)))
        for a, b in d["geo"].get("fill", []):
            out.append(line("COLUMN", sh(a), sh(b)))
        for a, b in NEW_WALLS[tag]:
            out.append(line("WALL-NEW", sh(a), sh(b)))
        for x, y, w, o, q in NEW_DOORS[tag] + NEW_EXTERNAL_DOORS[tag]:
            if o == "h":
                out.append(line("DOOR-NEW", sh((x - w / 2, y)), sh((x - w / 2, y + w))))
            else:
                out.append(line("DOOR-NEW", sh((x, y - w / 2)), sh((x + w, y - w / 2))))
        for axis, pos, lo, hi in openings(d["geo"])["cased"]:
            a = (pos, lo) if axis == "v" else (lo, pos)
            b = (pos, hi) if axis == "v" else (hi, pos)
            out.append(line("OPENING-CASED", sh(a), sh(b)))
        for r in mapped_all[tag]:
            for x, y, w, h in merged_rects(r["cells"], d["nx"]):
                out.append(rect("ZONE-" + r["zone"], x + dx, y, w, h))
            sx, sy = r["seed"]
            out.append(text("ROOM-TEXT", sx + dx - len(r["use"]) * 55, sy, 220, r["use"]))
            out.append(text("ROOM-AREA", sx + dx - 400, sy + 350, 180, "%.1f sqm" % r["area"]))
        for kind, _, waypoints in FLOWS[tag]:
            pts = route(tag, d["geo"], waypoints)
            for i in range(len(pts) - 1):
                out.append(line("FLOW-" + kind, sh(pts[i]), sh(pts[i + 1])))

    out.append(pair(0, "ENDSEC") + pair(0, "EOF"))
    DXF_OUT.write_text("".join(out))
    print("wrote %s" % DXF_OUT)


# ---------------------------------------------------------------- main
def main():
    data = load({tag: NEW_WALLS[tag] for tag in NEW_WALLS})
    mapped_all = {}
    for tag, d in data.items():
        mapped, unmapped, orphans = assign(d["rooms"], SCHEDULE[tag])
        mapped_all[tag] = mapped
        if unmapped:
            print("  %s: %d regions with no target use" % (tag, len(unmapped)))
            for r in unmapped:
                print("     %5.1f sqm at (%5.0f,%5.0f)  was %s"
                      % (r["area"], r["seed"][0], r["seed"][1], " ".join(r["was"]) or "-"))
        for use, ax, ay, dist in orphans:
            print("  %s: anchor for %r found nothing within 3 m (nearest %.0f mm)" % (tag, use, dist))
        print("  %s: %d rooms mapped, %.1f sqm net" % (tag, len(mapped), sum(r["area"] for r in mapped)))

    total = 7
    c = canvas.Canvas(str(PDF_OUT), pagesize=A1)
    c.setTitle("Lyfe Place Abuja - measured floor plans, target operating state")
    c.setAuthor("Consult for Africa")
    sheet_cover(c, data, mapped_all, total)
    c.showPage()
    n = 2
    for tag in ("ground", "first"):
        sheet_plan(c, tag, data[tag], mapped_all[tag], n, total)
        c.showPage()
        n += 1
    for tag in ("ground", "first"):
        sheet_flow(c, tag, data[tag], mapped_all[tag], n, total)
        c.showPage()
        n += 1
    for tag in ("ground", "first"):
        sheet_works(c, tag, data[tag], mapped_all[tag], n, total)
        c.showPage()
        n += 1
    c.save()
    print("wrote %s" % PDF_OUT)
    dxf(mapped_all, data)


if __name__ == "__main__":
    main()
