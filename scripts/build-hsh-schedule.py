"""
Build the Havana Specialist Hospital enablement PLAN & SCHEDULE as a branded,
annotated, two-page landscape PDF for Consult For Africa.

Page 1: a timeline roadmap (phase bars on a month axis + milestone markers).
Page 2: phase-by-phase detail cards, what we need from the client, and next step.

Output: docs/hsh-enablement-schedule-cfa.pdf  (A4 landscape, branded)

Run:
  python3 scripts/build-hsh-schedule.py
"""

from __future__ import annotations

from datetime import date
from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
OUT = DOCS / "hsh-enablement-schedule-cfa.pdf"
LOGO = DOCS / "c4a-logo-reversed.png"

NAVY = HexColor("#0B3C5D")
DEEP_NAVY = HexColor("#081521")
GOLD = HexColor("#D4AF37")
TEAL = HexColor("#1F7A8C")
BODY = HexColor("#1F2937")
MUTED = HexColor("#6B7280")
SURFACE = HexColor("#F1F5F9")
LIGHT = HexColor("#C9D6E0")
CREAM = HexColor("#FBF6E6")
ICE = HexColor("#EAF1F4")

PAGE_W, PAGE_H = landscape(A4)  # 842 x 595
MX = 54
TOTAL = "2"


# ---------------------------------------------------------------- helpers -----
def wrap(c, text, font, size, max_w):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if c.stringWidth(t, font, size) <= max_w:
            cur = t
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def para(c, text, x, y, font, size, color, max_w, leading):
    c.setFont(font, size)
    c.setFillColor(color)
    for ln in wrap(c, text, font, size, max_w):
        c.drawString(x, y, ln)
        y -= leading
    return y


def chrome(c, n, kicker):
    c.setFillColor(NAVY); c.rect(0, PAGE_H - 6, PAGE_W, 6, fill=1, stroke=0)
    c.setFillColor(GOLD); c.rect(0, PAGE_H - 9, PAGE_W, 3, fill=1, stroke=0)
    c.setFillColor(GOLD); c.rect(MX, PAGE_H - 60, 26, 3, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 10.5); c.setFillColor(TEAL)
    c.drawString(MX + 36, PAGE_H - 63, kicker.upper())
    c.setFillColor(GOLD); c.rect(MX, 30, 20, 2, fill=1, stroke=0)
    c.setFillColor(MUTED); c.setFont("Helvetica", 8)
    c.drawString(MX, 19, "Consult for Africa   /   Confidential   /   Havana Specialist Hospital  /  Board & Committee Enablement")
    c.drawRightString(PAGE_W - MX, 19, "%s / %s" % (str(n).zfill(2), TOTAL))
    try:
        ic = ImageReader(str(DOCS / "c4a-icon.png"))
        iw, ih = ic.getSize(); h = 30.0; w = h * iw / ih
        c.drawImage(ic, PAGE_W - MX - w, PAGE_H - 78, width=w, height=h, mask="auto")
    except Exception:
        pass


def heading(c, text, y=PAGE_H - 104, size=26, color=NAVY, max_w=None):
    max_w = max_w or (PAGE_W - 2 * MX)
    c.setFont("Helvetica-Bold", size); c.setFillColor(color)
    for ln in wrap(c, text, "Helvetica-Bold", size, max_w):
        c.drawString(MX, y, ln); y -= size + 6
    return y


def box(c, x, y, w, h, fill, spine=None, radius=8):
    c.setFillColor(fill); c.roundRect(x, y, w, h, radius, fill=1, stroke=0)
    if spine:
        c.setFillColor(spine); c.rect(x, y, 4, h, fill=1, stroke=0)


def callout(c, x, y, w, text, bg=CREAM, spine=GOLD, fg=NAVY, size=12, pad=16):
    lines = wrap(c, text, "Helvetica-Bold", size, w - 2 * pad)
    h = pad * 2 + 15 * len(lines) - 3
    box(c, x, y - h, w, h, bg, spine)
    ty = y - pad - size + 3
    c.setFont("Helvetica-Bold", size); c.setFillColor(fg)
    for ln in lines:
        c.drawString(x + pad, ty, ln); ty -= 15
    return y - h


# ----- timeline geometry -----
T0 = date(2026, 7, 21)
T1 = date(2026, 11, 30)
SPAN = (T1 - T0).days
TL_X = MX + 8
TL_W = PAGE_W - 2 * MX - 16


def xd(d: date) -> float:
    return TL_X + (d - T0).days / SPAN * TL_W


# ---------------------------------------------------------------- page 1 ------
def page_timeline(c):
    chrome(c, 1, "The plan at a glance")
    hy = heading(c, "A six-week build, then support through your first governed cycle")
    para(c,
         "Tentative, high-level dates, confirmed with you at kickoff. We will send a short written update at the "
         "end of every phase, so you always know exactly where things stand.",
         MX, hy - 12, "Helvetica", 12, BODY, PAGE_W - 2 * MX, 17)

    # ---- timeline geometry (top-down, well below the intro) ----
    MONTH_Y = PAGE_H - 244        # month label baseline
    RAIL_Y = PAGE_H - 276         # milestone rail + diamonds
    BARS_TOP = RAIL_Y - 26        # top edge of the first bar
    BAR_H, BAR_GAP = 24, 14
    step = BAR_H + BAR_GAP
    grid_top = MONTH_Y + 4
    grid_bottom = BARS_TOP - 4 * step - 2

    months = [(date(2026, 7, 21), "Late Jul"), (date(2026, 8, 1), "August"),
              (date(2026, 9, 1), "September"), (date(2026, 10, 1), "October"),
              (date(2026, 11, 1), "November")]
    for d, _ in months[1:]:
        c.setStrokeColor(HexColor("#E5E7EB")); c.setLineWidth(1)
        c.line(xd(d), grid_bottom, xd(d), grid_top)
    c.setFont("Helvetica-Bold", 9.5); c.setFillColor(MUTED)
    for d, lab in months:
        c.drawString(xd(d) + 4, MONTH_Y, lab.upper())

    # milestone rail + diamonds (labels staggered ABOVE the rail)
    c.setStrokeColor(LIGHT); c.setLineWidth(1); c.line(TL_X, RAIL_Y, TL_X + TL_W, RAIL_Y)
    milestones = [
        (date(2026, 7, 28), "Kickoff"),
        (date(2026, 8, 15), "Instruments ready"),
        (date(2026, 8, 29), "Directors trained"),
        (date(2026, 9, 6), "System handed over"),
    ]
    for i, (d, lab) in enumerate(milestones):
        x = xd(d)
        c.setFillColor(GOLD)
        c.saveState(); c.translate(x, RAIL_Y); c.rotate(45)
        c.rect(-4, -4, 8, 8, fill=1, stroke=0); c.restoreState()
        c.setFont("Helvetica-Bold", 8.2); c.setFillColor(NAVY)
        ly = RAIL_Y + 8 if i % 2 == 0 else RAIL_Y + 19
        c.drawCentredString(x, ly, lab)

    # phase bars
    bars = [
        ("Phase 1  ·  Kickoff & instruments", date(2026, 7, 28), date(2026, 8, 15), GOLD, False),
        ("Phase 2  ·  Training & capability", date(2026, 8, 11), date(2026, 8, 29), TEAL, False),
        ("Phase 3  ·  Handbook & handover", date(2026, 9, 1), date(2026, 9, 6), NAVY, False),
        ("Phase 4  ·  Supported first cycle  (optional)", date(2026, 9, 8), date(2026, 11, 28), LIGHT, True),
    ]
    for i, (label, s, e, col, optional) in enumerate(bars):
        by = BARS_TOP - i * step - BAR_H
        x0, x1 = xd(s), xd(e)
        w = max(x1 - x0, 6)
        if optional:
            c.setFillColor(ICE); c.roundRect(x0, by, w, BAR_H, 6, fill=1, stroke=0)
            c.setStrokeColor(TEAL); c.setLineWidth(1.2); c.setDash(3, 3)
            c.roundRect(x0, by, w, BAR_H, 6, fill=0, stroke=1); c.setDash()
        else:
            c.setFillColor(col); c.roundRect(x0, by, w, BAR_H, 6, fill=1, stroke=0)
        fits = c.stringWidth(label, "Helvetica-Bold", 9.5) < w - 14
        c.setFont("Helvetica-Bold", 9.5)
        if fits:
            c.setFillColor(white if (col in (NAVY, TEAL) and not optional) else (TEAL if optional else NAVY))
            c.drawString(x0 + 9, by + 8, label)
        else:
            c.setFillColor(NAVY)
            c.drawString(x1 + 8, by + 8, label)

    callout(c, MX, grid_bottom - 16, PAGE_W - 2 * MX,
            "The core build is six weeks, late July to early September. The optional supported cycle runs alongside "
            "your first board and committee meetings, September to November.",
            bg=CREAM, spine=GOLD, size=11.5)


# ---------------------------------------------------------------- page 2 ------
def phase_card(c, x, y, w, h, tag, tagcol, title, dates, what, deliver, need):
    box(c, x, y - h, w, h, SURFACE, tagcol)
    c.setFillColor(tagcol); c.setFont("Helvetica-Bold", 9)
    c.drawString(x + 16, y - 20, tag.upper())
    c.setFillColor(NAVY); c.setFont("Helvetica-Bold", 12.5)
    c.drawString(x + 16, y - 37, title)
    c.setFillColor(TEAL); c.setFont("Helvetica-Oblique", 9.5)
    c.drawString(x + 16, y - 51, dates)
    yy = y - 68
    yy = para(c, what, x + 16, yy, "Helvetica", 9.6, BODY, w - 32, 12.5) - 4
    c.setFillColor(NAVY); c.setFont("Helvetica-Bold", 8.6)
    c.drawString(x + 16, yy, "You receive:");
    yy = para(c, deliver, x + 78, yy, "Helvetica", 8.6, BODY, w - 94, 11) - 3
    c.setFillColor(NAVY); c.setFont("Helvetica-Bold", 8.6)
    c.drawString(x + 16, yy, "From you:")
    para(c, need, x + 68, yy, "Helvetica", 8.6, BODY, w - 84, 11)


def page_detail(c):
    chrome(c, 2, "Phase by phase")
    heading(c, "What happens in each phase")
    cols, gx, gy = 2, 20, 16
    cw = (PAGE_W - 2 * MX - gx) / cols
    ch = 150
    top = PAGE_H - 150
    L, R = MX, MX + cw + gx
    phase_card(c, L, top, cw, ch, "Phase 1", GOLD, "Kickoff & instruments", "Tentative: week of 28 July to mid-August",
               "We finalise the board pack template, committee report templates, agenda, minutes and action-log "
               "templates, the annual board calendar, and the Delegation of Authority and terms of reference, "
               "working alongside your Company Secretary.",
               "the instrument set, ready to use.",
               "a point of contact (ideally the Company Secretary), access to current papers, and 45 minutes for kickoff.")
    phase_card(c, R, top, cw, ch, "Phase 2", TEAL, "Training & capability", "Tentative: 11 to 29 August",
               "Practical working sessions for the executive directors and management: reporting and escalation, "
               "using the templates, chairing a committee, and how information flows between management, the "
               "Afya-HSH Governance Committee, the committees, and the Board.",
               "directors and management confident to run board and committee interactions.",
               "scheduling two to three short sessions with the directors and management.")
    top2 = top - ch - gy
    phase_card(c, L, top2, cw, ch, "Phase 3", NAVY, "Handbook & handover", "Tentative: week of 1 September",
               "We produce the Board and Committee Handbook and hand the system over to your Company Secretary, "
               "so it runs well without us.",
               "the Board & Committee Handbook, and a clean handover.",
               "a final review session.")
    phase_card(c, R, top2, cw, ch, "Phase 4  (optional)", HexColor("#5B8AA6"), "Supported first cycle", "Tentative: September to November",
               "We attend and quietly coach through your first board and committee meetings, refining the templates "
               "against real use and giving each chair light, private feedback.",
               "an embedded model, not just a launched one.",
               "seats at the first board and committee meetings.")

    # next step banner
    by = top2 - ch - 14
    bh = 62
    box(c, MX, by - bh, PAGE_W - 2 * MX, bh, NAVY)
    c.setFillColor(GOLD); c.setFont("Helvetica-Bold", 10)
    c.drawString(MX + 18, by - 19, "IMMEDIATE NEXT STEP")
    para(c,
         "A 30 to 45 minute kickoff call, proposed for Tuesday 28 or Wednesday 29 July. We confirm the point of "
         "contact, agree the document list, and lock these dates.",
         MX + 18, by - 36, "Helvetica", 10.5, white, PAGE_W - 2 * MX - 36, 14)


def build():
    c = canvas.Canvas(str(OUT), pagesize=landscape(A4))
    c.setTitle("Havana Specialist Hospital - Enablement Plan & Schedule - Consult for Africa")
    c.setAuthor("Consult for Africa")
    page_timeline(c); c.showPage()
    page_detail(c); c.showPage()
    c.save()
    print(f"wrote {OUT}")


if __name__ == "__main__":
    build()
