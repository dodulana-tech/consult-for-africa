"""
Read the Lyfe Place Abuja as-built survey drawings and return true geometry in millimetres.

The as-builts in docs/lyfeplace-abuja/as-built are vector PDFs exported from CAD, not
scans, so the line work can be recovered exactly rather than traced. The exporter used a
consistent pen width per class, which is what lets us separate the layers:

    1.44 pt stroke   wall faces
    0.54 pt stroke   door swings and window symbols
    0.72 pt stroke   dimension lines, stair treads, sheet border
    filled           columns and piers

Both sheets are drawn at the same scale with the same origin, so the two floors stack.
Scale is fixed by the overall 24,695 mm width carried on the bottom dimension chain of
both sheets, which the extracted wall envelope reproduces to within about 10 mm.
"""

from __future__ import annotations

import collections
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "docs" / "lyfeplace-abuja" / "as-built"

SHEETS = {
    "ground": SRC / "ground-floor-as-built.pdf",
    "first": SRC / "first-floor-as-built.pdf",
}

OVERALL_WIDTH = 24695.0  # mm, bottom dimension chain, both sheets
W_WALL, W_DOOR, W_THIN = 1.44, 0.54, 0.72

# The ground sheet carries three column details below the plan. They are drawn in the
# wall pen and would otherwise stretch the envelope. Everything below this line in the
# unrotated page space belongs to the details, not the building.
GROUND_DETAIL_CUT = 470.0

# Millimetres from the survey origin. The building floor plate ends at 16,317 mm; the
# entrance canopy on the first sheet sits below that and is not part of either plan.
FLOOR_PLATE_CUT = 17000.0

CELL = 25.0        # mm, flood-fill resolution
ERODE = 8          # cells; a 300 mm wall cavity does not survive 200 mm of erosion
MIN_ROOM = 1.2     # sqm


# ----------------------------------------------------------------- extraction
def _segments(page):
    """Every drawn item as (layer, (ax, ay), (bx, by)) in rotated page points."""
    M = page.rotation_matrix
    out = []
    for g in page.get_drawings():
        w = round(g.get("width") or 0, 2)
        if "f" in g["type"]:
            layer = "fill"
        elif w == W_WALL:
            layer = "wall"
        elif w == W_DOOR:
            layer = "door"
        elif w == W_THIN:
            layer = "thin"
        else:
            continue
        pts = []
        for it in g["items"]:
            if it[0] == "l":
                a, b = it[1] * M, it[2] * M
                pts.append(((a.x, a.y), (b.x, b.y)))
            elif it[0] == "qu":
                q = it[1]
                c = [q.ul * M, q.ur * M, q.lr * M, q.ll * M]
                pts += [((c[i].x, c[i].y), (c[(i + 1) % 4].x, c[(i + 1) % 4].y)) for i in range(4)]
            elif it[0] == "re":
                r = it[1] * M
                c = [(r.x0, r.y0), (r.x1, r.y0), (r.x1, r.y1), (r.x0, r.y1)]
                pts += [(c[i], c[(i + 1) % 4]) for i in range(4)]
            elif it[0] == "c":
                a, b, c_, d_ = it[1] * M, it[2] * M, it[3] * M, it[4] * M
                prev = (a.x, a.y)
                for i in range(1, 9):
                    t = i / 8
                    u = 1 - t
                    x = u ** 3 * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c_.x + t ** 3 * d_.x
                    y = u ** 3 * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c_.y + t ** 3 * d_.y
                    pts.append((prev, (x, y)))
                    prev = (x, y)
        for a, b in pts:
            out.append((layer, a, b))
    words = []
    for w_ in page.get_text("words"):
        r = fitz.Rect(w_[:4]) * M
        words.append((w_[4], (r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2))
    return out, words


def read_sheet(tag):
    page = fitz.open(SHEETS[tag])[0]
    segs, words = _segments(page)
    if tag == "ground":
        segs = [s for s in segs if max(s[1][1], s[2][1]) <= GROUND_DETAIL_CUT]
    walls = [s for s in segs if s[0] == "wall"]
    xs = [p[0] for _, a, b in walls for p in (a, b)]
    ys = [p[1] for _, a, b in walls for p in (a, b)]
    x0, y0 = min(xs), min(ys)
    scale = OVERALL_WIDTH / (max(xs) - x0)

    def conv(p):
        return ((p[0] - x0) * scale, (p[1] - y0) * scale)

    geo = collections.defaultdict(list)
    for layer, a, b in segs:
        A, B = conv(a), conv(b)
        # Below the floor plate is the entrance canopy on the first sheet and the column
        # details on the ground sheet. Neither is part of the plan.
        if min(A[1], B[1]) > FLOOR_PLATE_CUT:
            continue
        geo[layer].append((A, B))
    text = [(t, (x - x0) * scale, (y - y0) * scale) for t, x, y in words]
    return {"geo": dict(geo), "text": text, "scale": scale, "tag": tag}


# ----------------------------------------------------------------- openings
def _faces(segs, axis, tol=30.0):
    out = collections.defaultdict(list)
    for a, b in segs:
        if axis == "v" and abs(b[0] - a[0]) < 15 and abs(b[1] - a[1]) > 1:
            out[round((a[0] + b[0]) / 2 / tol) * tol].append((min(a[1], b[1]), max(a[1], b[1])))
        if axis == "h" and abs(b[1] - a[1]) < 15 and abs(b[0] - a[0]) > 1:
            out[round((a[1] + b[1]) / 2 / tol) * tol].append((min(a[0], b[0]), max(a[0], b[0])))
    return out


def _merge(iv):
    iv = sorted(iv)
    out = [list(iv[0])]
    for lo, hi in iv[1:]:
        if lo <= out[-1][1] + 1:
            out[-1][1] = max(out[-1][1], hi)
        else:
            out.append([lo, hi])
    return out


def openings(geo, min_gap=500.0, max_gap=6000.0):
    """Gaps in the wall faces, split into those a door or window already closes and
    those that are cased openings with nothing in them."""
    doors = []
    for a, b in geo.get("door", []):
        doors.append((min(a[0], b[0]), min(a[1], b[1]), max(a[0], b[0]), max(a[1], b[1])))
    found = {"door": [], "cased": []}
    for axis in ("v", "h"):
        for pos, iv in _faces(geo["wall"], axis).items():
            runs = _merge(iv)
            if len(runs) < 2 or sum(hi - lo for lo, hi in runs) < 1200:
                continue
            for i in range(len(runs) - 1):
                lo, hi = runs[i][1], runs[i + 1][0]
                if not (min_gap <= hi - lo <= max_gap):
                    continue
                mid = (lo + hi) / 2
                if axis == "v":
                    sealed = any(x0 - 260 <= pos <= x1 + 260 and y0 - 150 <= mid <= y1 + 150
                                 for x0, y0, x1, y1 in doors)
                else:
                    sealed = any(y0 - 260 <= pos <= y1 + 260 and x0 - 150 <= mid <= x1 + 150
                                 for x0, y0, x1, y1 in doors)
                found["door" if sealed else "cased"].append((axis, pos, lo, hi))
    return found


def split_lines(geo):
    out = []
    for axis, pos, lo, hi in openings(geo)["cased"]:
        out.append(((pos, lo), (pos, hi)) if axis == "v" else ((lo, pos), (hi, pos)))
    return out


# ----------------------------------------------------------------- rooms
def _rasterise(geo, extra):
    segs = list(geo["wall"]) + list(geo.get("door", [])) + list(geo.get("fill", [])) + list(extra)
    xs = [p[0] for a, b in geo["wall"] for p in (a, b)]
    ys = [p[1] for a, b in geo["wall"] for p in (a, b)]
    nx = int((max(xs) + CELL) / CELL) + 2
    ny = int((max(ys) + CELL) / CELL) + 2
    solid = bytearray(nx * ny)
    for a, b in segs:
        ax, ay, bx, by = a[0] / CELL, a[1] / CELL, b[0] / CELL, b[1] / CELL
        n = max(2, int(max(abs(bx - ax), abs(by - ay)) * 2) + 1)
        for i in range(n + 1):
            t = i / n
            x, y = ax + (bx - ax) * t, ay + (by - ay) * t
            for dx in (0, 1):
                for dy in (0, 1):
                    cx, cy = int(x) + dx, int(y) + dy
                    if 0 <= cx < nx and 0 <= cy < ny:
                        solid[cy * nx + cx] = 1
    return solid, nx, ny


def _components(solid, nx, ny):
    lab = [0] * (nx * ny)
    out = []
    cur = 0
    for start in range(nx * ny):
        if solid[start] or lab[start]:
            continue
        cur += 1
        q = collections.deque([start])
        lab[start] = cur
        cells, edge = [], False
        while q:
            i = q.popleft()
            cells.append(i)
            cx, cy = i % nx, i // nx
            if cx in (0, nx - 1) or cy in (0, ny - 1):
                edge = True
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                jx, jy = cx + dx, cy + dy
                if 0 <= jx < nx and 0 <= jy < ny:
                    j = jy * nx + jx
                    if not solid[j] and not lab[j]:
                        lab[j] = cur
                        q.append(j)
        out.append({"id": cur, "cells": cells, "edge": edge})
    return lab, out


def _core(cells, nx, k=ERODE):
    cur = set(cells)
    for _ in range(k):
        cur = {i for i in cur
               if all(((i // nx + dy) * nx + (i % nx + dx)) in cur
                      for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))}
        if not cur:
            return None
    mx = sum(i % nx for i in cur) / len(cur)
    my = sum(i // nx for i in cur) / len(cur)
    seed = min(cur, key=lambda i: (i % nx - mx) ** 2 + (i // nx - my) ** 2)
    return ((seed % nx) * CELL + CELL / 2, (seed // nx) * CELL + CELL / 2)


def row_runs(cells, nx):
    """Cells merged into horizontal runs, as (x, y, w, h) in mm. Cheap area fills."""
    by_row = collections.defaultdict(list)
    for i in cells:
        by_row[i // nx].append(i % nx)
    out = []
    for row, xs in by_row.items():
        xs.sort()
        s = p = xs[0]
        for x in xs[1:]:
            if x == p + 1:
                p = x
            else:
                out.append((s * CELL, row * CELL, (p + 1 - s) * CELL, CELL))
                s = p = x
        out.append((s * CELL, row * CELL, (p + 1 - s) * CELL, CELL))
    return out


def rooms(sheet, extra=()):
    geo, text = sheet["geo"], sheet["text"]
    extra = list(split_lines(geo)) + list(extra)
    solid, nx, ny = _rasterise(geo, extra)
    lab, comps = _components(solid, nx, ny)
    skip = {"Floor", "Level", "As", "Built", "Plan", "Ground", "First", "+"}
    labels = [(t, x, y) for t, x, y in text
              if not t.replace(".", "").replace("+", "").isdigit() and t not in skip]
    out = []
    for c in comps:
        if c["edge"]:
            continue
        area = len(c["cells"]) * CELL * CELL / 1e6
        if area < MIN_ROOM:
            continue
        seed = _core(c["cells"], nx)
        if seed is None:
            continue
        rx = [i % nx for i in c["cells"]]
        ry = [i // nx for i in c["cells"]]
        out.append({"id": c["id"], "area": area, "seed": seed, "cells": c["cells"],
                    "bbox": (min(rx) * CELL, min(ry) * CELL, (max(rx) + 1) * CELL, (max(ry) + 1) * CELL),
                    "was": []})
    byid = {r["id"]: r for r in out}
    for t, x, y in labels:
        cx, cy = int(x / CELL), int(y / CELL)
        if 0 <= cx < nx and 0 <= cy < ny and lab[cy * nx + cx] in byid:
            byid[lab[cy * nx + cx]]["was"].append(t)
    out.sort(key=lambda r: -r["area"])
    for i, r in enumerate(out, 1):
        r["n"] = i
    return out, nx, ny, extra


def load(extra_by_floor=None):
    extra_by_floor = extra_by_floor or {}
    data = {}
    for tag in SHEETS:
        sheet = read_sheet(tag)
        rs, nx, ny, splits = rooms(sheet, extra_by_floor.get(tag, ()))
        sheet.update({"rooms": rs, "nx": nx, "ny": ny, "splits": splits})
        data[tag] = sheet
    return data


if __name__ == "__main__":
    for tag, d in load().items():
        print(f"\n== {tag}: {len(d['rooms'])} rooms, {sum(r['area'] for r in d['rooms']):.1f} sqm net")
        for r in d["rooms"]:
            print("  %2d %6.1f sqm  seed (%5.0f,%5.0f)  was %s"
                  % (r["n"], r["area"], r["seed"][0], r["seed"][1], " ".join(r["was"]) or "-"))
