"""
Build the Haven Paediatric Centre STRATEGY & GROWTH deck for Consult For Africa.

A 40-slide, landscape, slide-per-page board deck tying every workstream to the
growth mandate: N45-50M/month revenue at an 18-20% EBITDA floor. Shows where
Haven is now, the target, and exactly how the target is reached.

Financial figures are an illustrative target architecture with stated
assumptions; the current baseline is an estimate because the audit found the
reporting layer does not yet reconcile (fixed by Move C1, the billing system).

Output: docs/haven-strategy-deck-cfa.pdf  (A4 landscape, branded slides)
Run:    python3 scripts/build-haven-strategy-deck.py
"""

from __future__ import annotations

from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
OUT = DOCS / "haven-strategy-deck-cfa.pdf"
LOGO = DOCS / "c4a-logo-reversed.png"

# ---- brand palette ---------------------------------------------------------
NAVY = HexColor("#0B3C5D")
DEEP_NAVY = HexColor("#081521")
GOLD = HexColor("#D4AF37")
TEAL = HexColor("#1F7A8C")
BODY = HexColor("#1F2937")
MUTED = HexColor("#6B7280")
SURFACE = HexColor("#F1F5F9")
LIGHT = HexColor("#C9D6E0")
CREAM = HexColor("#FBF6E6")
GREEN = HexColor("#15803D")
GREEN_BG = HexColor("#E7F4EC")

PAGE_W, PAGE_H = landscape(A4)  # 842 x 595
MX = 54
TOTAL = "40"
PAGENO = 0  # set per-slide in build(); chrome/divider read it so slides auto-number

# ============================================================ FINANCIAL MODEL
# All values N million per month unless noted. Illustrative, assumption-driven.
CUR_REV = 18.0  # current run-rate, midpoint of the N15-20M/month they average today
CUR_EBITDA_PCT = 8
TGT_REV = 46.5
TGT_EBITDA_PCT = 19
WC_LOCKED = 7.0

REV_LINES = [
    ("NICU & special care baby unit", 14.0),
    ("Haven Club memberships", 8.0),
    ("Outpatient consults & procedures", 7.5),
    ("Paediatric admissions (ward)", 5.5),
    ("Pharmacy (retail, VMI-lifted)", 4.5),
    ("Diagnostics & laboratory", 3.0),
    ("Home care", 1.5),
    ("Immunisation (standalone)", 1.5),
    ("Corporate & school retainers", 1.0),
]  # = 46.5

COST_LINES = [
    ("Clinical & nursing salaries", 14.5),
    ("Drugs & consumables (post-VMI)", 7.5),
    ("Other staff: admin, ops, CX, club", 4.0),
    ("Rent, facility, utilities, power", 4.5),
    ("Outsourced lab & services", 2.0),
    ("Membership programme & events", 1.8),
    ("Marketing & business development", 1.5),
    ("C4A management fee", 1.9),
]  # = 37.7  ->  EBITDA 8.8 (18.9%)

BRIDGE = [
    ("NICU reprice + fill the cots", 12.0),
    ("Haven Club memberships (new)", 8.0),
    ("Tariff reprice & existing yield", 2.0),
    ("Pharmacy retail + VMI margin", 2.0),
    ("Diagnostics & lab capture", 1.5),
    ("Outpatient volume growth", 1.5),
    ("Home care (new line)", 0.5),
    ("Immunisation product (new)", 0.5),
    ("Corporate & school (new)", 0.5),
]  # = 28.5   (18.0 + 28.5 = 46.5)

MEMBERS = [
    ("First Year  (0-15 months)", 80, "N600k-1.2M", 64.0),
    ("Growing Child  (1-5 years)", 55, "N350-500k", 23.4),
    ("School Age  (5-16 years)", 40, "N180-280k", 8.8),
]  # 175 members, N96.2M/yr  (base builds fastest through the season)

# The six-month ramp to the mandate: monthly run-rate and EBITDA, peaking across
# the paediatric high season. (month, run-rate N m/month, EBITDA %, is_peak)
SPRINT = [
    ("Sep", 18.0, 8, False),
    ("Oct", 24.0, 10, False),
    ("Nov", 31.0, 13, False),
    ("Dec", 38.0, 16, True),
    ("Jan", 44.0, 18, True),
    ("Feb", 48.0, 20, True),
]


def moneyM(v):
    return ("N%dM" % round(v)) if abs(v - round(v)) < 0.05 else ("N%.1fM" % v)


# ----------------------------------------------------------- text helpers ----
def wrap(c, text, font, size, max_w):
    words = text.split()
    lines, cur = [], ""
    for w in words:
        trial = (cur + " " + w).strip()
        if c.stringWidth(trial, font, size) <= max_w:
            cur = trial
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
    for line in wrap(c, text, font, size, max_w):
        c.drawString(x, y, line)
        y -= leading
    return y


def chrome(c, n, kicker):
    c.setFillColor(NAVY)
    c.rect(0, PAGE_H - 6, PAGE_W, 6, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(0, PAGE_H - 9, PAGE_W, 3, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(MX, PAGE_H - 60, 26, 3, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 10.5)
    c.setFillColor(TEAL)
    c.drawString(MX + 36, PAGE_H - 63, kicker.upper())
    c.setFillColor(GOLD)
    c.rect(MX, 30, 20, 2, fill=1, stroke=0)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8)
    c.drawString(MX, 19, "Consult for Africa   /   Confidential   /   Haven Paediatric Centre  /  Strategy & Growth Plan")
    c.drawRightString(PAGE_W - MX, 19, "%s / %s" % (str(PAGENO).zfill(2), TOTAL))
    try:
        _ic = ImageReader(str(DOCS / "c4a-icon.png"))
        _iw, _ih = _ic.getSize()
        _h = 30.0
        _w = _h * _iw / _ih
        c.drawImage(_ic, PAGE_W - MX - _w, PAGE_H - 78, width=_w, height=_h, mask="auto")
    except Exception:
        pass


def heading(c, text, y=PAGE_H - 108, size=26, color=NAVY, max_w=None):
    max_w = max_w or (PAGE_W - 2 * MX)
    c.setFont("Helvetica-Bold", size)
    c.setFillColor(color)
    leading = size + 6
    for line in wrap(c, text, "Helvetica-Bold", size, max_w):
        c.drawString(MX, y, line)
        y -= leading
    return y


def subhead(c, text, y, size=13, color=BODY):
    return para(c, text, MX, y, "Helvetica", size, color, PAGE_W - 2 * MX, 19)


def bullet_block(c, items, x, y, max_w, gap=13, size=12, leading=16,
                 body_color=BODY, tick=GOLD):
    for lead, rest in items:
        c.setFillColor(tick)
        c.rect(x, y - 1, 7, 3, fill=1, stroke=0)
        tx = x + 18
        if lead:
            c.setFont("Helvetica-Bold", size)
            c.setFillColor(NAVY)
            c.drawString(tx, y, lead)
            offset = c.stringWidth(lead + "  ", "Helvetica-Bold", size)
        else:
            offset = 0
        words = rest.split()
        cur, cy = "", y
        line_x = tx + offset
        avail = max_w - offset
        out_lines = []
        for w in words:
            trial = (cur + " " + w).strip()
            if c.stringWidth(trial, "Helvetica", size) <= avail:
                cur = trial
            else:
                out_lines.append((line_x, cur))
                cur = w
                line_x = tx
                avail = max_w
        if cur:
            out_lines.append((line_x, cur))
        for lx, ln in out_lines:
            c.setFont("Helvetica", size)
            c.setFillColor(body_color)
            c.drawString(lx, cy, ln)
            cy -= leading
        y = cy - gap
    return y


def callout(c, x, y, w, text, bg=SURFACE, spine=TEAL, fg=NAVY, pad=20,
            size=12, leading=16.5, font="Helvetica-Bold"):
    lines = wrap(c, text, font, size, w - 2 * pad)
    h = pad * 2 + leading * len(lines) - (leading - size)
    c.setFillColor(bg)
    c.roundRect(x, y - h, w, h, 8, fill=1, stroke=0)
    c.setFillColor(spine)
    c.rect(x, y - h, 5, h, fill=1, stroke=0)
    ty = y - pad - size + 3
    c.setFont(font, size)
    c.setFillColor(fg)
    for ln in lines:
        c.drawString(x + pad, ty, ln)
        ty -= leading
    return y - h


def pillar(c, x, y, w, h, num, title, body, accent=GOLD):
    c.setFillColor(SURFACE)
    c.roundRect(x, y, w, h, 8, fill=1, stroke=0)
    c.setFillColor(accent)
    c.rect(x, y, 4, h, fill=1, stroke=0)
    c.setFillColor(accent)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(x + 16, y + h - 26, num)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 12)
    ty = y + h - 26
    for ln in wrap(c, title, "Helvetica-Bold", 12, w - 52):
        c.drawString(x + 38, ty, ln)
        ty -= 15
    para(c, body, x + 16, ty - 6, "Helvetica", 10, BODY, w - 32, 13.5)


def stat_tiles(c, x, top, tiles, tile_w=None, h=96, gap=16):
    n = len(tiles)
    tile_w = tile_w or (PAGE_W - 2 * MX - gap * (n - 1)) / n
    for i, (big, label, sub) in enumerate(tiles):
        tx = x + i * (tile_w + gap)
        c.setFillColor(NAVY)
        c.roundRect(tx, top - h, tile_w, h, 9, fill=1, stroke=0)
        c.setFillColor(GOLD)
        c.rect(tx, top - h, tile_w, 4, fill=1, stroke=0)
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", 27)
        c.drawString(tx + 16, top - 44, big)
        c.setFillColor(GOLD)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(tx + 16, top - 62, label.upper())
        if sub:
            c.setFillColor(LIGHT)
            c.setFont("Helvetica", 9)
            for j, ln in enumerate(wrap(c, sub, "Helvetica", 9, tile_w - 30)):
                c.drawString(tx + 16, top - 78 - j * 11, ln)
    return top - h


def hbars(c, x, top, chart_w, rows, maxval, bar_h=19, gap=11, label_w=232,
          barcolor=TEAL, top_color=None):
    y = top
    for i, (label, val) in enumerate(rows):
        c.setFillColor(BODY)
        c.setFont("Helvetica", 10.3)
        c.drawString(x, y - bar_h + 5, label)
        bx = x + label_w
        bw = chart_w - label_w - 56
        c.setFillColor(SURFACE)
        c.roundRect(bx, y - bar_h, bw, bar_h, 3, fill=1, stroke=0)
        fillw = max(bw * (val / maxval), 2)
        col = top_color if (top_color and i == 0) else barcolor
        c.setFillColor(col)
        c.roundRect(bx, y - bar_h, fillw, bar_h, 3, fill=1, stroke=0)
        c.setFillColor(NAVY)
        c.setFont("Helvetica-Bold", 10.3)
        c.drawString(bx + fillw + 6, y - bar_h + 5, moneyM(val))
        y -= (bar_h + gap)
    return y


def ledger(c, x, top, w, title, rows, total_label, total_val, accent=GOLD):
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 12.5)
    c.drawString(x, top, title)
    y = top - 20
    for label, val in rows:
        c.setFillColor(BODY)
        c.setFont("Helvetica", 10.3)
        c.drawString(x, y, label)
        c.setFillColor(BODY)
        c.setFont("Helvetica-Bold", 10.3)
        c.drawRightString(x + w, y, moneyM(val))
        y -= 16
    c.setStrokeColor(accent)
    c.setLineWidth(1.4)
    c.line(x, y + 6, x + w, y + 6)
    y -= 6
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 11.5)
    c.drawString(x, y, total_label)
    c.drawRightString(x + w, y, moneyM(total_val))
    return y


def section_divider(c, n, kicker, big, sub, letter):
    c.setFillColor(NAVY)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.setFillColor(DEEP_NAVY)
    c.rect(0, 0, PAGE_W, 10, fill=1, stroke=0)
    c.rect(0, PAGE_H - 10, PAGE_W, 10, fill=1, stroke=0)
    c.setFillColor(HexColor("#12324c"))
    c.setFont("Helvetica-Bold", 200)
    c.drawRightString(PAGE_W - 30, 40, letter)
    c.setFillColor(GOLD)
    c.rect(MX, PAGE_H - 150, 44, 3, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(GOLD)
    c.drawString(MX + 56, PAGE_H - 153, kicker.upper())
    c.setFont("Helvetica-Bold", 40)
    c.setFillColor(white)
    y = PAGE_H - 210
    for ln in wrap(c, big, "Helvetica-Bold", 40, PAGE_W - 2 * MX - 120):
        c.drawString(MX, y, ln)
        y -= 46
    para(c, sub, MX, y - 6, "Helvetica", 14, LIGHT, 620, 21)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8)
    c.drawString(MX, 19, "Consult for Africa   /   Confidential   /   Haven Paediatric Centre  /  Strategy & Growth Plan")
    c.drawRightString(PAGE_W - MX, 19, "%s / %s" % (str(PAGENO).zfill(2), TOTAL))


# =============================================================== SLIDES ======
def s01_cover(c):
    c.setFillColor(NAVY)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.setFillColor(DEEP_NAVY)
    c.rect(0, 0, PAGE_W, 12, fill=1, stroke=0)
    c.rect(0, PAGE_H - 12, PAGE_W, 12, fill=1, stroke=0)
    try:
        img = ImageReader(str(LOGO))
        iw, ih = img.getSize()
        dw = 168
        dh = dw * ih / iw
        c.drawImage(img, MX, PAGE_H - 70 - dh + 20, width=dw, height=dh, mask="auto", preserveAspectRatio=True)
    except Exception:
        c.setFillColor(GOLD)
        c.setFont("Helvetica-Bold", 13)
        c.drawString(MX, PAGE_H - 64, "CONSULT FOR AFRICA")
    c.setFillColor(GOLD)
    c.rect(MX, PAGE_H - 190, 44, 3, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(GOLD)
    c.drawString(MX + 56, PAGE_H - 193, "STRATEGY & GROWTH PLAN  /  THE FULL ENGAGEMENT")
    c.setFont("Helvetica-Bold", 44)
    c.setFillColor(white)
    c.drawString(MX, PAGE_H - 252, "From clinic to institution")
    c.setFont("Helvetica-Bold", 19)
    c.setFillColor(GOLD)
    c.drawString(MX, PAGE_H - 286, "The plan to reach N45-50M a month at an 18-20% EBITDA floor")
    para(c,
         "Every change and every workstream Consult for Africa will deliver at Haven, tied to one "
         "growth mandate. Where the business is now, the target, and exactly how the target is reached.",
         MX, PAGE_H - 330, "Helvetica", 13.5, LIGHT, 640, 20)
    c.setFillColor(GOLD)
    c.rect(MX, 96, 60, 3, fill=1, stroke=0)
    for i, line in enumerate([
        "For:   Mr Kabir Aregbesola,  Mrs Abisodun Alli,  Dr Shakirah Saliu,  Dr Odedina,  Mr Ogochukwu Odum",
        "From:  Dr Debo Odulana, Founding Partner, Consult for Africa",
        "Status:  Board strategy deck  /  figures are an illustrative target architecture with stated assumptions",
    ]):
        c.setFont("Helvetica", 10.5)
        c.setFillColor(white if i < 2 else GOLD)
        c.drawString(MX, 72 - i * 17, line)


def s02_mandate(c):
    chrome(c, 2, "The mandate")
    heading(c, "One number governs this plan")
    subhead(c, "Every workstream in this deck is judged against a single growth mandate. If a move does "
               "not move the mandate, it waits.", PAGE_H - 150)
    stat_tiles(c, MX, PAGE_H - 200, [
        ("N45-50M", "Monthly revenue", "Roughly N540-600M a year, about 2.5x the N15-20M Haven averages today"),
        ("18-20%", "EBITDA floor", "A minimum, not a hope: the business must be durably profitable"),
        ("6 months", "To the mandate", "Reached by February, driven by the NICU into the paediatric high season"),
    ], h=110)
    callout(c, MX, PAGE_H - 340, PAGE_W - 2 * MX,
            "The mandate is deliberately a floor on profitability, not just a revenue target. Growing "
            "revenue while margins stay thin is the trap Haven is in now. This plan grows both, together.",
            bg=CREAM, spine=GOLD)


def s03_exec(c):
    chrome(c, 3, "Executive summary")
    hy = heading(c, "The thesis in four moves")
    y = hy - 16
    items = [
        ("Culture is the multiplier.", "Haven already has the expensive thing, a staff that cares, "
         "confirmed by its own survey. We build the systems that let good people be good without heroics."),
        ("Capture before you drive.", "You cannot bank revenue you cannot record. Billing, tariff and "
         "working capital come first, then the growth engines are switched on."),
        ("Clinic to club.", "The membership turns one-off visits into a recurring relationship, and Haven "
         "from a place families visit when sick into a paediatric club they belong to."),
        ("Own the moat, rent the rest.", "Own the clinical care, the culture and the differentiated "
         "services. Outsource inventory, the lab and the back office to people who do them for a living."),
    ]
    y = bullet_block(c, items, MX, y, PAGE_W - 2 * MX - 20, gap=13, size=12.3, leading=16)
    callout(c, MX, y - 2, PAGE_W - 2 * MX,
            "Ten essential growth levers across five jobs, sequenced so the early "
            "moves fund the later ones. The trapped N7M and early margin gains pay for the growth.",
            bg=SURFACE, spine=TEAL)


def s04_howtoread(c):
    chrome(c, 4, "How to read this deck")
    heading(c, "Where we are, the target, and how we get there")
    steps = [
        ("1", "WHERE WE ARE", "A young hospital with a real culture and immature systems. N15-20M a "
         "month, thin margins, and N7M of cash locked up.", TEAL),
        ("2", "THE TARGET", "N45-50M a month at an 18-20% EBITDA floor, reached in six months, by "
         "February, with a clear P&L behind it.", GOLD),
        ("3", "HOW WE GET THERE", "Ten essential growth levers in five jobs: fill the beds, lift value "
         "per patient, free the cash, build the team, and make Haven known.", TEAL),
    ]
    n = len(steps)
    gap = 20
    cw = (PAGE_W - 2 * MX - gap * (n - 1)) / n
    top, hh = PAGE_H - 170, 190
    for i, (num, title, body, accent) in enumerate(steps):
        x = MX + i * (cw + gap)
        c.setFillColor(SURFACE)
        c.roundRect(x, top - hh, cw, hh, 10, fill=1, stroke=0)
        c.setFillColor(accent)
        c.rect(x, top - hh, cw, 5, fill=1, stroke=0)
        c.setFillColor(accent)
        c.setFont("Helvetica-Bold", 40)
        c.drawString(x + 20, top - 58, num)
        c.setFillColor(NAVY)
        c.setFont("Helvetica-Bold", 13)
        c.drawString(x + 20, top - 84, title)
        para(c, body, x + 20, top - 108, "Helvetica", 11.3, BODY, cw - 40, 15.5)


def s05_today(c):
    chrome(c, 5, "Where we are  /  1")
    hy = heading(c, "Haven today: a strong start on young systems")
    y = hy - 16
    items = [
        ("A genuine achievement.", "Around 18 months in, Haven funds its own salaries, holds a steady "
         "patient base, and has earned a real reputation for paediatric care in Ikeja."),
        ("The expensive thing is already built.", "The hardest asset in any hospital, a team that "
         "genuinely cares, is in place, as the staff survey confirms."),
        ("The systems beneath it are immature.", "Revenue is captured on what is effectively a nursing "
         "handover sheet, the management numbers do not reconcile, and around N7M of cash is locked in "
         "receivables and stock."),
        ("Growth is now outpacing the systems.", "As Haven scales into more complex neonatal care, the "
         "governance, standards and financial discipline have to be deliberate, not assumed."),
    ]
    y = bullet_block(c, items, MX, y, PAGE_W - 2 * MX - 20, gap=13, size=12.3, leading=16)
    callout(c, MX, y - 2, PAGE_W - 2 * MX,
            "This is the good kind of problem: the hard part is done, and what remains is the more "
            "tractable work of building systems, best done now while the facility is still young.",
            bg=GREEN_BG, spine=GREEN, fg=NAVY)


def s06_culture(c):
    chrome(c, 6, "Where we are  /  2")
    hy = heading(c, "The staff survey: culture is a real asset")
    subhead(c, "An anonymous survey of 23 staff, built with reverse-worded items so people could not "
               "simply agree with everything. It still came back strong.", hy - 12)
    stat_tiles(c, MX, PAGE_H - 220, [
        ("16 / 17", "Rated safety very good or excellent", "on the first wave of responses"),
        ("4.6 / 5", "Would recommend Haven for care", "the highest-scoring item in the survey"),
        ("Low", "Fear, unsafe pace, risky handovers", "the reverse items scored low, the good result"),
    ], h=104)
    callout(c, MX, PAGE_H - 360, PAGE_W - 2 * MX,
            "The soft spots were not about safety. They were pay clarity, reward fairness, recent "
            "resuscitation training, and staff welfare, health insurance and pension. Staff are telling "
            "us where the next investment belongs, calmly, which is the best time to hear it.",
            bg=CREAM, spine=GOLD)


def s07_audit(c):
    chrome(c, 7, "Where we are  /  3")
    hy = heading(c, "The audit: where the systems leak")
    y = hy - 16
    items = [
        ("Revenue capture.", "The revenue record is effectively a nursing handover sheet, so services "
         "delivered are not reliably billed. That gap is pure lost revenue."),
        ("Working capital.", "Around N4.2M sits in HMO receivables and N2.77M in pharmacy stock: roughly "
         "N7M of cash locked up while leadership feels cash is tight."),
        ("Reporting integrity.", "Visit counts do not reconcile, the receivables table does not foot, and "
         "a 201% pharmacy 'profit' is a markup, not a margin. The board cannot yet trust its own numbers."),
        ("Licensing & governance.", "The establishment licence must be squared with the service Haven now "
         "delivers before it scales further into complex neonatal care."),
    ]
    y = bullet_block(c, items, MX, y, PAGE_W - 2 * MX - 20, gap=12, size=12.3, leading=16)
    callout(c, MX, y - 2, PAGE_W - 2 * MX,
            "None of this is a failure of effort. It is the absence of a senior operator and the systems "
            "one installs. Every one of these is fixable, and fixing them is where the plan starts.",
            bg=SURFACE, spine=TEAL)


def s08_economics(c):
    chrome(c, 8, "Where we are  /  4")
    heading(c, "Current economics, honestly stated")
    stat_tiles(c, MX, PAGE_H - 180, [
        ("N15-20M", "Revenue per month", "What Haven averages today, on a reporting layer that does not yet reconcile"),
        ("~8%", "EBITDA (estimated)", "Thin. 'Barely anything left' after salaries"),
        ("N7M", "Working capital locked", "In receivables and pharmacy stock, not in profit"),
    ], h=104)
    callout(c, MX, PAGE_H - 320, PAGE_W - 2 * MX,
            "We state the baseline as an estimate on purpose. The first build in this plan, a real billing "
            "and reporting system, is what turns these estimates into numbers the board can stand behind. "
            "You cannot manage what you cannot measure.",
            bg=CREAM, spine=GOLD)
    c.setFillColor(MUTED)
    c.setFont("Helvetica-Oblique", 9.5)
    c.drawString(MX, 44, "Baseline firmed up by Move C1 (billing & reporting) in the first two months.")


def s09_gap(c):
    chrome(c, 9, "Where we are  /  the gap")
    heading(c, "The distance to the mandate")
    # simple two-anchor visual
    top = PAGE_H - 180
    colw = (PAGE_W - 2 * MX - 120) / 2
    for i, (lab, val, pct, col, sub) in enumerate([
        ("TODAY", CUR_REV, CUR_EBITDA_PCT, TEAL, "Thin margin, cash locked"),
        ("THE MANDATE", TGT_REV, TGT_EBITDA_PCT, NAVY, "Durably profitable, at scale"),
    ]):
        x = MX + i * (colw + 120)
        c.setFillColor(col)
        c.roundRect(x, top - 150, colw, 150, 10, fill=1, stroke=0)
        c.setFillColor(GOLD)
        c.rect(x, top - 150, colw, 5, fill=1, stroke=0)
        c.setFillColor(GOLD)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(x + 22, top - 34, lab)
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", 40)
        c.drawString(x + 22, top - 82, moneyM(val))
        c.setFont("Helvetica-Bold", 15)
        c.setFillColor(GOLD)
        c.drawString(x + 22, top - 108, "%d%% EBITDA" % pct)
        c.setFillColor(LIGHT)
        c.setFont("Helvetica", 10.5)
        c.drawString(x + 22, top - 130, sub)
    # arrow
    c.setFillColor(GOLD)
    ax = MX + colw + 30
    c.setFont("Helvetica-Bold", 40)
    c.drawCentredString(ax + 30, top - 92, ">")
    c.setFont("Helvetica-Bold", 13)
    c.setFillColor(NAVY)
    c.drawCentredString(ax + 30, top - 118, "~2.6x")
    callout(c, MX, top - 190, PAGE_W - 2 * MX,
            "About two and a half times, in six months. It is not one heroic leap; it is led by the NICU, "
            "which is underused today, driven into the paediatric high season, with the fast fixes "
            "underneath funding it.",
            bg=SURFACE, spine=TEAL)


def s10_target_state(c):
    chrome(c, 10, "The target  /  1")
    hy = heading(c, "What the business looks like at target")
    subhead(c, "At steady state, roughly month 24, Haven runs nine revenue lines instead of one, with the "
               "highest-margin lines carrying the most weight.", hy - 12)
    hbars(c, MX, PAGE_H - 210, PAGE_W - 2 * MX, REV_LINES, maxval=14.0,
          barcolor=TEAL, top_color=NAVY)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 12)
    c.drawRightString(PAGE_W - MX, 52, "Total  ~N46.5M / month   (~N558M / year)")


def s11_bridge(c):
    chrome(c, 11, "The target  /  2")
    hy = heading(c, "How we close the gap")
    subhead(c, "The bridge from N18M to N46.5M a month, ranked by contribution. NICU and the "
               "Haven Club do the heaviest lifting.", hy - 12)
    hbars(c, MX, PAGE_H - 205, PAGE_W - 2 * MX, BRIDGE, maxval=12.0,
          barcolor=GOLD, top_color=GOLD)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 11.5)
    c.drawRightString(PAGE_W - MX, 52, "N18M today  +  N28.5M of new monthly revenue  =  ~N46.5M / month")


def s12_pnl(c):
    chrome(c, 12, "The target  /  3")
    heading(c, "The target P&L, monthly")
    colw = (PAGE_W - 2 * MX - 60) / 2
    top = PAGE_H - 150
    ledger(c, MX, top, colw, "Revenue", REV_LINES, "Total revenue", TGT_REV, accent=TEAL)
    ye = ledger(c, MX + colw + 60, top, colw, "Operating costs", COST_LINES, "Total costs", 37.7, accent=GOLD)
    # EBITDA band
    by = 96
    c.setFillColor(NAVY)
    c.roundRect(MX, by, PAGE_W - 2 * MX, 46, 9, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(MX, by, 5, 46, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 15)
    c.drawString(MX + 22, by + 17, "EBITDA")
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 15)
    c.drawRightString(PAGE_W - MX - 22, by + 17, "~N8.8M / month    =    ~19%   (above the 18% floor)")


def s13_ramp(c):
    chrome(c, 0, "The target  /  the timeline")
    hy = heading(c, "Six months to the mandate")
    subhead(c, "Run the fast fixes now and drive the NICU into the paediatric high season, and Haven "
               "reaches N45-50M a month at an 18-20% EBITDA floor by February, month six.", hy - 12)
    base = 116
    chh = 222
    x = MX + 10
    chart_w = PAGE_W - 2 * MX - 20
    n = len(SPRINT)
    gap = 40
    cw = (chart_w - gap * (n - 1)) / n
    maxv = 54.0
    peak_idx = [i for i, r in enumerate(SPRINT) if r[3]]
    if peak_idx:
        px0 = x + peak_idx[0] * (cw + gap) - gap / 2
        px1 = x + peak_idx[-1] * (cw + gap) + cw + gap / 2
        c.setFillColor(CREAM)
        c.roundRect(px0, base - 4, px1 - px0, chh + 78, 8, fill=1, stroke=0)
        c.setFillColor(GOLD)
        c.setFont("Helvetica-Bold", 9.5)
        c.drawCentredString((px0 + px1) / 2, base + chh + 62, "PEAK  /  PAEDIATRIC HIGH SEASON")
    for i, (lab, val, pct, peak) in enumerate(SPRINT):
        cx = x + i * (cw + gap)
        bh = chh * (val / maxv)
        c.setFillColor(NAVY if peak else TEAL)
        c.roundRect(cx, base, cw, bh, 5, fill=1, stroke=0)
        c.setFillColor(NAVY)
        c.setFont("Helvetica-Bold", 13)
        c.drawCentredString(cx + cw / 2, base + bh + 9, moneyM(val))
        c.setFillColor(GOLD)
        c.roundRect(cx + cw / 2 - 32, base + bh + 24, 64, 15, 7, fill=1, stroke=0)
        c.setFillColor(NAVY)
        c.setFont("Helvetica-Bold", 9)
        c.drawCentredString(cx + cw / 2, base + bh + 28, "%d%% EBITDA" % pct)
        c.setFillColor(BODY)
        c.setFont("Helvetica-Bold", 11)
        c.drawCentredString(cx + cw / 2, base - 18, lab)
    c.setStrokeColor(LIGHT)
    c.setLineWidth(1)
    c.line(x, base, x + chart_w, base)


def s_sprint(c):
    chrome(c, 0, "The target  /  why six months")
    hy = heading(c, "Why six months is achievable")
    subhead(c, "From N15-20M today the mandate is about two and a half times, and it is reachable fast for "
               "one reason: it is led by the NICU, a price-and-throughput decision, not a slow ramp.", hy - 12)
    pw = (PAGE_W - 2 * MX - 2 * 18) / 3
    py, ph = 178, 158
    pillar(c, MX, py, pw, ph, "01", "NICU is a decision, not a ramp",
           "The price is reset at once and three underused cots fill from a referral drive. High unit "
           "value, so it moves the number fast.")
    pillar(c, MX + pw + 18, py, pw, ph, "02", "High margin, so EBITDA follows",
           "NICU is the highest-margin work Haven does, so revenue and the 18-20% floor climb together, "
           "not one long after the other.", accent=TEAL)
    pillar(c, MX + 2 * (pw + 18), py, pw, ph, "03", "The season is the tailwind",
           "November to February is the paediatric high season. Launch now and demand arrives exactly when "
           "the beds and the pipeline are ready.")
    callout(c, MX, py - 18, PAGE_W - 2 * MX,
            "The fast fixes underneath, revenue capture, the tariff reprice, VMI and receivables, land in "
            "weeks, not quarters. Nothing on the six-month path waits for the slow structural build.",
            bg=CREAM, spine=GOLD, size=11.5)


def s_sprint_dependency(c):
    chrome(c, 0, "The target  /  the honest read")
    hy = heading(c, "The one dependency, and the honest read")
    colw = (PAGE_W - 2 * MX - 30) / 2
    top = PAGE_H - 150
    boxh = 250
    # A: the critical path
    c.setFillColor(SURFACE)
    c.roundRect(MX, top - boxh, colw, boxh, 9, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(MX, top - boxh, 5, boxh, fill=1, stroke=0)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(MX + 20, top - 28, "The make-or-break: fill the NICU")
    bullet_block(c, [
        ("The cots are underused today.", "So the peak rests on filling them, the number-one priority "
         "from week one."),
        ("But it is controllable.", "Three feeders do it: Ob/Gyn tours and an antenatal pathway, a "
         "neonatal transport ambulance, and a referral network, so Haven actively generates referrals, "
         "not just waits on them."),
        ("The season helps.", "November to February is the paediatric high season, so the demand tailwind "
         "is real if the feeders are built to catch it."),
    ], MX + 16, top - 52, colw - 40, gap=10, size=10.6, leading=14.5)
    # B: peak vs sustained
    rx = MX + colw + 30
    c.setFillColor(NAVY)
    c.roundRect(rx, top - boxh, colw, boxh, 9, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(rx, top - boxh, 5, boxh, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(rx + 20, top - 28, "Reach it in six. Then hold it.")
    para(c,
         "Six months reaches N45-50M, at the February peak, on the NICU and the season together. From "
         "N15-20M today that is the mandate, hit inside the year.",
         rx + 16, top - 52, "Helvetica", 10.8, LIGHT, colw - 34, 15)
    para(c,
         "The job after February is to hold it through the quieter months, converting the seasonal NICU "
         "peak into diversified, year-round revenue as the club and the other lines mature. Reaching it "
         "and holding it are two tasks, and honesty about that protects the win.",
         rx + 16, top - 100, "Helvetica", 10.8, LIGHT, colw - 34, 15)
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 10.5)
    c.drawString(rx + 16, top - boxh + 44, "If the referral drive lags, February is ~N38-42M:")
    c.setFillColor(LIGHT)
    c.setFont("Helvetica", 10.3)
    c.drawString(rx + 16, top - boxh + 28, "still a major step from N15-20M, and the honest downside to plan for.")


def s14_workstreams(c):
    chrome(c, 0, "How we get there")
    hy = heading(c, "Five jobs, ten levers")
    subhead(c, "The whole strategy on one slide: ten essential growth levers, grouped into the five jobs "
               "that take Haven to the mandate, led by the NICU.", hy - 12)
    rows = [
        ("A. Fill the beds", "DEMAND", "1 Referral portal & analyst   2 NICU growth plan   4 HMO & corporates", GOLD),
        ("B. Lift value per patient", "YIELD", "6 Reprice the tariff   3 Service expansion (surgery)   5 Haven Club   9 Add-on services", TEAL),
        ("C. Free cash & margin", "MARGIN", "7 Working capital: vendor-managed inventory and lab outsourcing", GOLD),
        ("D. Build the engine", "PEOPLE", "8 Cultural transformation and the staff app", TEAL),
        ("E. Make Haven known", "AWARENESS", "10 Marketing and promotion", GOLD),
    ]
    top = PAGE_H - 172
    rh = 60
    labelw = 200
    for i, (job, delivers, levers, accent) in enumerate(rows):
        ry = top - i * (rh + 8)
        c.setFillColor(NAVY)
        c.roundRect(MX, ry - rh, labelw, rh, 6, fill=1, stroke=0)
        c.setFillColor(accent)
        c.rect(MX, ry - rh, labelw, 4, fill=1, stroke=0)
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", 12.5)
        for j, ln in enumerate(wrap(c, job, "Helvetica-Bold", 12.5, labelw - 24)):
            c.drawString(MX + 14, ry - 23 - j * 15, ln)
        c.setFillColor(GOLD)
        c.setFont("Helvetica-Bold", 8.5)
        c.drawString(MX + 14, ry - rh + 12, delivers)
        bx = MX + labelw + 12
        bw = PAGE_W - MX - bx
        c.setFillColor(SURFACE)
        c.roundRect(bx, ry - rh, bw, rh, 6, fill=1, stroke=0)
        c.setFillColor(accent)
        c.rect(bx, ry - rh, 4, rh, fill=1, stroke=0)
        para(c, levers, bx + 16, ry - 24, "Helvetica", 11.5, BODY, bw - 32, 15)
    c.setFillColor(MUTED)
    c.setFont("Helvetica-Oblique", 9.5)
    c.drawString(MX, 40, "Each lever is detailed in the slides that follow.")


# ----- Workstream A: revenue -----
def sA_intro(c):
    section_divider(c, 15, "Workstream A", "The revenue model",
                    "Nine lines instead of one. A membership club, a repriced tariff, the NICU engine, "
                    "a retail pharmacy, captured diagnostics, and three new service lines.", "A")


def sA_club_concept(c):
    chrome(c, 16, "Revenue  /  the Haven Club")
    hy = heading(c, "From clinic to club")
    y = hy - 16
    items = [
        ("Parents buy care because they must.", "They renew a club because it removes fear, gives them a "
         "named doctor who knows their child, and lets them belong."),
        ("The want, not the need, is what recurs.", "Treating illness is the need. Reassurance, "
         "development, community and status are the wants, and the wants are what a parent pays to keep."),
        ("It is genuine white space.", "No Lagos paediatric hospital runs a membership club. Haven can "
         "define the category in its catchment."),
        ("Registration stays and rises.", "The one-off registration goes from N10k to N15k for everyone; "
         "the club is an optional annual membership on top. Non-members still pay per visit."),
    ]
    y = bullet_block(c, items, MX, y, PAGE_W - 2 * MX - 20, gap=13, size=12.3, leading=16)
    callout(c, MX, y - 2, PAGE_W - 2 * MX,
            "The club sells the relationship, not a discount. It also turns Haven from a place families "
            "visit when sick into a paediatric health-and-development club they belong to for a decade.",
            bg=CREAM, spine=GOLD)


def sA_club_plans(c):
    chrome(c, 17, "Revenue  /  the Haven Club")
    hy = heading(c, "Three plans, by the child's stage")
    subhead(c, "Each plan bundles the essentials, needs and wants of one age, wrapped in the club: a named "
               "paediatrician, a 24/7 line, no queue, events, community and milestone moments.", hy - 12)
    rows = [
        ("First Year (0-15 mo)", "N600k / N1.2M", "Full vaccine schedule, well-baby visits, unlimited "
         "waived consults, newborn home check, lactation, sleep and weaning support"),
        ("Growing Child (1-5 yr)", "N350-500k", "Unlimited waived sick consults, development monitoring, "
         "boosters, play sessions, parenting workshops"),
        ("School Age (5-16 yr)", "N180-280k", "Annual check with school and sports forms, waived "
         "consults, emotional-wellbeing check, activity access"),
    ]
    top = PAGE_H - 200
    rh = 66
    for i, (plan, price, incl) in enumerate(rows):
        ry = top - i * (rh + 10)
        c.setFillColor(NAVY)
        c.roundRect(MX, ry - rh, 168, rh, 6, fill=1, stroke=0)
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", 12)
        for j, ln in enumerate(wrap(c, plan, "Helvetica-Bold", 12, 148)):
            c.drawString(MX + 14, ry - 22 - j * 15, ln)
        c.setFillColor(GOLD)
        c.setFont("Helvetica-Bold", 12)
        c.drawString(MX + 14, ry - rh + 12, price)
        bx = MX + 168 + 12
        bw = PAGE_W - MX - bx
        c.setFillColor(SURFACE)
        c.roundRect(bx, ry - rh, bw, rh, 6, fill=1, stroke=0)
        c.setFillColor(GOLD)
        c.rect(bx, ry - rh, 4, rh, fill=1, stroke=0)
        para(c, incl, bx + 16, ry - 22, "Helvetica", 10.8, BODY, bw - 30, 15)
    c.setFillColor(MUTED)
    c.setFont("Helvetica-Oblique", 9.3)
    c.drawString(MX, 44, "Included: consults, well-child visits, the 24/7 line and events. Billed at a member discount: labs, drugs, admissions, procedures, NICU.")


def sA_club_sales(c):
    chrome(c, 18, "Revenue  /  the Haven Club")
    hy = heading(c, "How many we sell, and what it earns")
    subhead(c, "The target is 175 active memberships by month 24, built from the patient base and every "
               "new birth Haven touches. Priced to the family wallet, not to an HMO.", hy - 12)
    # table
    top = PAGE_H - 200
    heads = ["Plan", "Members", "Annual fee", "Annual value"]
    xs = [MX, MX + 250, MX + 360, MX + 500]
    c.setFillColor(NAVY)
    c.roundRect(MX, top - 6, PAGE_W - 2 * MX, 26, 5, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 10.5)
    for h, x in zip(heads, xs):
        c.drawString(x + 10, top + 3, h)
    y = top - 30
    for plan, count, fee, annual in MEMBERS:
        c.setFillColor(BODY)
        c.setFont("Helvetica", 11)
        c.drawString(xs[0] + 10, y, plan)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(xs[1] + 10, y, str(count))
        c.setFont("Helvetica", 11)
        c.drawString(xs[2] + 10, y, fee)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(xs[3] + 10, y, moneyM(annual))
        y -= 26
    c.setStrokeColor(GOLD)
    c.setLineWidth(1.4)
    c.line(MX, y + 8, PAGE_W - MX, y + 8)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 11.5)
    c.drawString(xs[0] + 10, y - 8, "Total")
    c.drawString(xs[1] + 10, y - 8, "175")
    c.drawString(xs[3] + 10, y - 8, "N96.2M / yr")
    callout(c, MX, y - 30, PAGE_W - 2 * MX,
            "That is about N8M a month in membership fees alone, before the labs, drugs and admissions "
            "those loyal families also buy. The ramp: roughly 70 members by month 12, 175 by month 24.",
            bg=CREAM, spine=GOLD, size=11.5)


def sA_tariff(c):
    chrome(c, 0, "Revenue  /  tariff")
    hy = heading(c, "Reprice the tariff: switch on revenue already earned")
    subhead(c, "This is not a market study. It is capturing income Haven already produces but does not "
               "charge for.", hy - 12)
    y = hy - 44
    items = [
        ("80.9% of the tariff is priced at zero.", "Of Haven's own 2,413-line tariff, four lines in five "
         "carry no price, so the service is delivered and never billed. Repricing those lines is "
         "immediate, found revenue, not new work."),
        ("And the priced lines sit 34% below competitors.", "Close that gap by raising prices up to 45% "
         "overall, in two tranches across the year, against a real peer tariff, so the rise is gradual, "
         "defensible, and easy to communicate."),
        ("Anchor on self-pay, manage the payer mix.", "Price on self-pay first; treat HMOs as a separate, "
         "much lower schedule. An HMO pays a fraction of cost per child and never covers a NICU stay, so "
         "the mix is managed on purpose, not by drift."),
    ]
    y = bullet_block(c, items, MX, y, PAGE_W - 2 * MX - 20, gap=12, size=12.2, leading=15.5)
    callout(c, MX, y - 2, PAGE_W - 2 * MX,
            "The zero-priced lines plus the 34% gap to market make this the fastest, lowest-risk revenue "
            "in the plan: about N2M a month to start, and more as the second tranche lands.",
            bg=SURFACE, spine=TEAL, size=11.5)


def sA_nicu(c):
    chrome(c, 0, "Revenue  /  NICU")
    hy = heading(c, "NICU: the growth engine")
    y = hy - 16
    items = [
        ("The highest-yield asset in the building.", "Three cots at about N3M per admission, anchored by "
         "Dr Odedina, a consultant neonatologist. It is the highest-margin work Haven does, and today the "
         "cots are underused."),
        ("Getting the basics right first.", "Scaling neonatal care rewards putting the governance, "
         "standards and team readiness in place first, so the unit runs full with confidence. That is the "
         "people and quality work in Workstream B."),
        ("Then fill it, deliberately.", "Because the cots are underused today, filling them is the single "
         "highest priority. Three practical, controllable feeders do it, next slide."),
    ]
    y = bullet_block(c, items, MX, y, PAGE_W - 2 * MX - 20, gap=13, size=12.3, leading=16)
    callout(c, MX, y - 2, PAGE_W - 2 * MX,
            "Repriced and filled, NICU is the single biggest lever in the plan: about N14M a month at "
            "target, and the engine of the six-month peak.",
            bg=CREAM, spine=GOLD, size=11.5)


def sA_nicu_fill(c):
    chrome(c, 0, "Revenue  /  filling the NICU")
    hy = heading(c, "Fill the NICU: three practical feeders")
    subhead(c, "Haven does not take deliveries; obstetricians keep their delivery and antenatal revenue. "
               "The play is to win the baby when it needs the NICU. Three controllable feeders do it.", hy - 12)
    tiles = [
        ("1   Ob/Gyn tours + antenatal pathway", "Welcome obstetricians to tour the NICU with Dr Odedina "
         "and build confidence in the capacity. Then co-plan the high-risk pregnancies antenatally, so "
         "babies likely to need neonatal care are identified early and pre-booked. They keep the delivery; "
         "Haven gets the baby that needs more."),
        ("2   A neonatal transport ambulance", "A NICU-equipped ambulance that goes out and collects sick "
         "and preterm babies from other facilities. A mobile NICU is a feeder, a paid transport service, "
         "and a trust-builder with referring hospitals at once."),
        ("3   A referral network", "Structured relationships with maternity units that refer complications "
         "in, backed by visible governance so they trust Haven with a newborn who needs more."),
    ]
    n = len(tiles)
    gap = 18
    cw = (PAGE_W - 2 * MX - gap * (n - 1)) / n
    top, hh = PAGE_H - 175, 200
    for i, (title, body) in enumerate(tiles):
        x = MX + i * (cw + gap)
        c.setFillColor(SURFACE)
        c.roundRect(x, top - hh, cw, hh, 9, fill=1, stroke=0)
        c.setFillColor(TEAL if i == 1 else GOLD)
        c.rect(x, top - hh, cw, 4, fill=1, stroke=0)
        c.setFillColor(NAVY)
        c.setFont("Helvetica-Bold", 13)
        ty = top - 28
        for ln in wrap(c, title, "Helvetica-Bold", 13, cw - 32):
            c.drawString(x + 16, ty, ln)
            ty -= 16
        para(c, body, x + 16, ty - 6, "Helvetica", 10.2, BODY, cw - 32, 14.2)
    callout(c, MX, top - hh - 14, PAGE_W - 2 * MX,
            "The digital marketing agency already in place drives demand into all three, held to booked "
            "leads and admissions, not just posts and reach. Fill the cots and the six-month peak is real.",
            bg=CREAM, spine=GOLD, size=11.3)


def sA_pharmacy(c):
    chrome(c, 21, "Revenue  /  pharmacy & diagnostics")
    hy = heading(c, "Pharmacy and diagnostics: margin, not cost centres")
    colw = (PAGE_W - 2 * MX - 30) / 2
    top = PAGE_H - 150
    boxh = 205
    # pharmacy
    c.setFillColor(SURFACE)
    c.roundRect(MX, top - boxh, colw, boxh, 9, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(MX, top - boxh, 5, boxh, fill=1, stroke=0)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(MX + 20, top - 28, "Pharmacy as a retail line")
    bullet_block(c, [
        ("Vendor-managed inventory.", "A consignment model frees the N2.77M tied up in stock and ends "
         "stockouts: the vendor owns the stock and carries the expiry risk."),
        ("Run it for margin.", "Proper attach discipline and formulary management turn the pharmacy from a "
         "cash trap into a contributor."),
    ], MX + 16, top - 52, colw - 40, gap=10, size=10.8, leading=14.5)
    c.setFillColor(TEAL)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(MX + 20, top - boxh + 16, "Bridge: ~N3M / month")
    # diagnostics
    rx = MX + colw + 30
    c.setFillColor(SURFACE)
    c.roundRect(rx, top - boxh, colw, boxh, 9, fill=1, stroke=0)
    c.setFillColor(TEAL)
    c.rect(rx, top - boxh, 5, boxh, fill=1, stroke=0)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(rx + 20, top - 28, "Diagnostics, capital-light")
    bullet_block(c, [
        ("Point-of-care in-house.", "Keep the tests that change management within the hour, including a "
         "bedside bilirubin analyser for jaundice."),
        ("Send the rest out.", "An accredited reference partner runs the specialised tests; Haven captures "
         "a transparent markup, no kickbacks. Capex becomes opex."),
    ], rx + 16, top - 52, colw - 40, gap=10, size=10.8, leading=14.5)
    c.setFillColor(TEAL)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(rx + 20, top - boxh + 16, "Bridge: ~N2.5M / month")


def sA_newlines(c):
    chrome(c, 22, "Revenue  /  new lines")
    hy = heading(c, "New and growing service lines")
    subhead(c, "New revenue that also deepens the club and the family relationship.", hy - 12)
    tiles = [
        ("Home care", "Newborn home checks, post-discharge follow-up, home sample collection, and home "
         "phototherapy for jaundice, which no one in Lagos offers.", "~N1.5M / mo"),
        ("Immunisation product", "Vaccination marketed as a named, reliable product line, the reason young "
         "families choose and keep a paediatric relationship.", "~N1.5M / mo"),
        ("Corporate & school", "Recurring paediatric retainers with schools and employers, starting from "
         "the Toddler Town relationship.", "~N1M / mo"),
    ]
    n = len(tiles)
    gap = 18
    cw = (PAGE_W - 2 * MX - gap * (n - 1)) / n
    top, hh = PAGE_H - 175, 190
    for i, (title, body, tag) in enumerate(tiles):
        x = MX + i * (cw + gap)
        c.setFillColor(SURFACE)
        c.roundRect(x, top - hh, cw, hh, 9, fill=1, stroke=0)
        c.setFillColor(GOLD)
        c.rect(x, top - hh, cw, 4, fill=1, stroke=0)
        c.setFillColor(NAVY)
        c.setFont("Helvetica-Bold", 13.5)
        c.drawString(x + 16, top - 30, title)
        para(c, body, x + 16, top - 52, "Helvetica", 10.5, BODY, cw - 32, 14.5)
        c.setFillColor(TEAL)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(x + 16, top - hh + 16, tag)
    c.setFillColor(MUTED)
    c.setFont("Helvetica-Oblique", 9.5)
    c.drawString(MX, 44, "Alongside growing the allergy & asthma and sickle-cell clinics already running, and adding therapy, dentistry and imaging over time.")


# ----- Workstream B: people & culture -----
def sB_intro(c):
    section_divider(c, 23, "Workstream B", "People & culture",
                    "The multiplier. Protect the culture Haven already has, and build the systems, "
                    "benefits and incentives that make good care self-sustaining.", "B")


def sB_culture(c):
    chrome(c, 24, "People  /  culture")
    hy = heading(c, "Culture: the multiplier")
    y = hy - 16
    items = [
        ("Start from strength.", "The survey shows the culture is sound, so the work is to protect and "
         "deepen it, not rebuild it."),
        ("Install a just-culture standard.", "So a reported error fixes the system rather than blames the "
         "person, the one culture item the survey flagged as softening."),
        ("Make good work automatic.", "Shift-level clinical routines and standards of work so safety and "
         "efficiency do not depend on who is on shift."),
    ]
    y = bullet_block(c, items, MX, y, PAGE_W - 2 * MX - 20, gap=14, size=12.5, leading=16.5)
    callout(c, MX, y - 2, PAGE_W - 2 * MX,
            "Culture is the only lever that makes every other lever cheaper. Underfund it and everything "
            "above it, the club, the NICU, the growth, gets harder.",
            bg=CREAM, spine=GOLD)


def sB_staff(c):
    chrome(c, 25, "People  /  staff app & benefits")
    hy = heading(c, "A staff app and a welfare structure")
    subhead(c, "The survey's clearest message was welfare. We answer it in a structured, affordable way, "
               "because at this stage the team stops being a cost and becomes the engine.", hy - 12)
    colw = (PAGE_W - 2 * MX - 30) / 2
    top = PAGE_H - 205
    boxh = 175
    c.setFillColor(SURFACE)
    c.roundRect(MX, top - boxh, colw, boxh, 9, fill=1, stroke=0)
    c.setFillColor(TEAL)
    c.rect(MX, top - boxh, 5, boxh, fill=1, stroke=0)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 13.5)
    c.drawString(MX + 20, top - 28, "The staff app")
    bullet_block(c, [
        ("The whole HR function, in one app.", "Onboarding, rota and shift swaps, leave, payslips, "
         "appraisals and KPIs, training and compliance, incident reporting and benefits, so HR runs on a "
         "system, not on paper and memory."),
        ("Recognition and standards, visible.", "The standards of work, peer recognition and rewards live "
         "where the team already is, reinforcing the culture every day."),
    ], MX + 16, top - 52, colw - 40, gap=10, size=10.8, leading=14.5)
    rx = MX + colw + 30
    c.setFillColor(SURFACE)
    c.roundRect(rx, top - boxh, colw, boxh, 9, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(rx, top - boxh, 5, boxh, fill=1, stroke=0)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 13.5)
    c.drawString(rx + 20, top - 28, "The welfare structure")
    bullet_block(c, [
        ("What staff asked for.", "Health insurance, a pension, fair and timely pay, and clinical "
         "training, phased so it is affordable as revenue grows."),
        ("Retention is the return.", "Losing a good clinical lead is months of ward instability. Welfare "
         "is what keeps them."),
    ], rx + 16, top - 52, colw - 40, gap=10, size=10.8, leading=14.5)


def sB_incentives(c):
    chrome(c, 26, "People  /  incentives")
    hy = heading(c, "Redesign the incentives")
    y = hy - 16
    items = [
        ("Fix what is already on the board's list.", "The staff commission structure and the job "
         "descriptions and KPIs are already awaiting approval. They are the incentive and accountability "
         "tools a strong culture runs on."),
        ("Reward quality and ownership.", "Not activity or volume alone. The survey showed reward fairness "
         "is one of the softest scores, so this is felt, not theoretical."),
        ("Make ownership real.", "Clear responsibility and a sense of ownership for how well Haven runs, "
         "which the survey found people want and partly lack."),
    ]
    y = bullet_block(c, items, MX, y, PAGE_W - 2 * MX - 20, gap=14, size=12.5, leading=16.5)
    callout(c, MX, y - 2, PAGE_W - 2 * MX,
            "Incentives aligned to quality and ownership are what make the culture sustain itself after we "
            "step back. Without them, every improvement depends on someone chasing it.",
            bg=SURFACE, spine=TEAL)


def sB_training(c):
    chrome(c, 27, "People  /  capability")
    hy = heading(c, "Close the clinical-training gap")
    y = hy - 16
    items = [
        ("Resuscitation first.", "Recent resuscitation training, BLS, PALS and NRP, was the lowest "
         "clinical-readiness score in the survey. For a paediatric and neonatal centre that is a live "
         "safety gap, closed with a standing training cadence."),
        ("A capability ladder.", "Structured competencies for nursing and clinical staff, tied to the "
         "standards of work and to progression."),
        ("A credential the market trusts.", "Training that also underwrites the NICU referral pipeline and "
         "the accreditation pathway."),
    ]
    y = bullet_block(c, items, MX, y, PAGE_W - 2 * MX - 20, gap=14, size=12.5, leading=16.5)
    callout(c, MX, y - 2, PAGE_W - 2 * MX,
            "Capability is also a revenue enabler: a team trusted with complex neonatal care is what lets "
            "Haven scale the highest-margin line it has.",
            bg=CREAM, spine=GOLD)


def sB_leader(c):
    chrome(c, 28, "People  /  leadership")
    hy = heading(c, "A senior operations leader: the keystone")
    y = hy - 16
    items = [
        ("Almost every move needs an owner who is not a founder.", "The audit's plainest finding was the "
         "absence of a senior operator. This is the person who runs the billing system, the vendor "
         "contracts, the referral relationships and the numbers."),
        ("Define the role, then recruit into it.", "The role and its measures are set first, so the hire "
         "lands into clarity rather than chaos."),
        ("Sourced and vetted.", "Consult for Africa can source and vet the person through our workforce "
         "platform, including senior operator and diaspora profiles."),
    ]
    y = bullet_block(c, items, MX, y, PAGE_W - 2 * MX - 20, gap=14, size=12.5, leading=16.5)
    callout(c, MX, y - 2, PAGE_W - 2 * MX,
            "Without this hire the whole plan depends on the founders' own bandwidth, which is exactly the "
            "constraint the plan exists to remove.",
            bg=SURFACE, spine=TEAL)


# ----- Workstream C: process & quality -----
def sC_intro(c):
    section_divider(c, 29, "Workstream C", "Process & quality",
                    "The plumbing the whole business stands on: real billing, freed cash, outsourced "
                    "non-core, clinical governance, and a patient experience worth paying for.", "C")


def sC_billing(c):
    chrome(c, 30, "Process  /  capture & reporting")
    hy = heading(c, "Real revenue capture and reporting")
    y = hy - 16
    items = [
        ("Replace the handover sheet.", "A proper capture and billing point so every service delivered is "
         "recorded, priced and billed. This is the foundation the entire revenue side stands on."),
        ("The first build.", "The membership, the repriced tariff, the pharmacy attach and the NICU "
         "repricing all assume what Haven does is what Haven bills. Today it is not, and that gap is pure "
         "lost revenue."),
        ("Numbers the board can trust.", "A management reporting layer so the figures reconcile and the "
         "board can see the business at a glance."),
    ]
    y = bullet_block(c, items, MX, y, PAGE_W - 2 * MX - 20, gap=14, size=12.5, leading=16.5)
    callout(c, MX, y - 2, PAGE_W - 2 * MX,
            "Nothing else in the revenue plan pays out reliably until this is fixed. It is Move number one "
            "for exactly that reason.",
            bg=CREAM, spine=GOLD)


def sC_workingcapital(c):
    chrome(c, 31, "Process  /  working capital")
    heading(c, "Free the N7M that is locked up")
    stat_tiles(c, MX, PAGE_H - 178, [
        ("N4.2M", "In HMO receivables", "Recovered, then kept moving by a monthly discipline"),
        ("N2.77M", "In pharmacy stock", "Freed by moving to vendor-managed, pay-on-consumption stock"),
        ("Week 1", "Recovery begins", "A push on the two largest HMO balances as a quick win"),
    ], h=104)
    callout(c, MX, PAGE_H - 320, PAGE_W - 2 * MX,
            "This is the fastest money in the plan. The cash is not missing, it is on the shelf and in the "
            "HMO ledgers, and recovering it helps fund the growth without a large new injection.",
            bg=SURFACE, spine=TEAL)


def sC_outsource(c):
    chrome(c, 32, "Process  /  operating model")
    hy = heading(c, "Own the core, outsource the rest")
    y = hy - 16
    items = [
        ("Keep what is truly Haven's.", "Clinical care, the culture and the standards stay in-house. They "
         "are the brand."),
        ("Rent what is not.", "Inventory and pharmacy supply to a vendor-managed partner, the lab to an "
         "accredited reference partner, and payroll, biomedical maintenance, security and laundry to "
         "service contracts."),
        ("Buy focus and cash.", "Outsourcing converts fixed headaches and trapped capital into predictable "
         "service costs, and frees the founders' time for care, culture and growth."),
    ]
    y = bullet_block(c, items, MX, y, PAGE_W - 2 * MX - 20, gap=14, size=12.5, leading=16.5)
    callout(c, MX, y - 2, PAGE_W - 2 * MX,
            "Every hour a founder spends supervising a generator or a laundry is an hour not spent on the "
            "things only Haven can do.",
            bg=CREAM, spine=GOLD)


def sC_quality(c):
    chrome(c, 33, "Process  /  quality & governance")
    hy = heading(c, "Quality, governance and the licence")
    y = hy - 16
    items = [
        ("Resolve the licence first.", "Square the establishment licence with the service Haven delivers. "
         "It gates everything above the stabilise stage."),
        ("Install clinical governance.", "Formal standards, incident-and-learning systems, and the "
         "accountability that a growing facility taking on complex care must have."),
        ("Earn accreditation.", "An external accreditation an HMO or corporate client recognises, which "
         "unlocks pricing power, referrals and trust."),
        ("Mature the board.", "Separate ownership, oversight and management, the cleanest way to handle an "
         "adviser who also sits on the board."),
    ]
    y = bullet_block(c, items, MX, y, PAGE_W - 2 * MX - 20, gap=12, size=12.2, leading=15.5)
    callout(c, MX, y - 2, PAGE_W - 2 * MX,
            "Governance feels like overhead until the moment it is the only thing standing between Haven "
            "and a serious event. Then it is the whole business.",
            bg=SURFACE, spine=TEAL, size=11.5)


def sC_cx(c):
    chrome(c, 34, "Process  /  customer experience")
    hy = heading(c, "A patient experience worth paying for")
    y = hy - 16
    items = [
        ("Design the journey.", "From booking to arrival, care, discharge and follow-up, mapped and "
         "smoothed, because the experience is what drives repeat visits and referral."),
        ("No queue, unhurried, communicated.", "Same-day access, appointment discipline, and proactive "
         "communication, exactly what affluent parents rank above price."),
        ("Measure it.", "A simple satisfaction and net-promoter pulse so experience is managed with data, "
         "not assumed."),
    ]
    y = bullet_block(c, items, MX, y, PAGE_W - 2 * MX - 20, gap=14, size=12.5, leading=16.5)
    callout(c, MX, y - 2, PAGE_W - 2 * MX,
            "Experience is the club's product as much as the medicine is. It is also the cheapest "
            "marketing Haven has: a parent who felt seen tells every other parent they know.",
            bg=CREAM, spine=GOLD)


# ----- Workstream D: business development -----
def sD_intro(c):
    section_divider(c, 35, "Workstream D", "Business development",
                    "Make the growth deliberate: a referral engine, a funnel that captures families "
                    "before birth, a brand that means something, and the partnerships that deliver it.", "D")


def sD_engine(c):
    chrome(c, 36, "Growth  /  the engine")
    hy = heading(c, "The growth engine")
    colw = (PAGE_W - 2 * MX - 30) / 2
    top = PAGE_H - 150
    boxh = 215
    c.setFillColor(SURFACE)
    c.roundRect(MX, top - boxh, colw, boxh, 9, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(MX, top - boxh, 5, boxh, fill=1, stroke=0)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 13.5)
    c.drawString(MX + 20, top - 28, "Referral & Bump-to-Baby")
    bullet_block(c, [
        ("A referral pipeline.", "Structured relationships with maternity units that feed the NICU, and "
         "with clinicians who refer complex cases."),
        ("Start before birth.", "Antenatal and newborn-prep classes and a postpartum circle capture "
         "expectant parents, when loyalty is set, and channel them into the First Year plan."),
    ], MX + 16, top - 52, colw - 40, gap=11, size=10.8, leading=14.5)
    rx = MX + colw + 30
    c.setFillColor(SURFACE)
    c.roundRect(rx, top - boxh, colw, boxh, 9, fill=1, stroke=0)
    c.setFillColor(TEAL)
    c.rect(rx, top - boxh, 5, boxh, fill=1, stroke=0)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 13.5)
    c.drawString(rx + 20, top - 28, "Brand & partnerships")
    bullet_block(c, [
        ("Direct the agency you already have.", "The digital marketing agency in place is pointed at the "
         "club, the maternity offer and NICU awareness, and held to booked leads and admissions, not just "
         "posts and reach."),
        ("A brand that means something.", "The paediatric and neonatal centre for complex care in Lagos, "
         "built on one excellent site before any thought of a second."),
    ], rx + 16, top - 52, colw - 40, gap=11, size=10.8, leading=14.5)


# ----- delivery, governance, risk, close -----
def s37_roadmap(c):
    chrome(c, 37, "Delivery  /  roadmap")
    hy = heading(c, "The six-month roadmap")
    subhead(c, "Sequenced so the fast, cash-releasing moves in month one fund the NICU drive that peaks the "
               "revenue by February.", hy - 12)
    phases = [
        ("Month 1", "Stabilise & capture", "Billing & reporting live, tariff repriced, licence confirmed, "
         "receivables recovery, VMI started, NICU repriced, referral drive begun", GOLD),
        ("Months 1-2", "The NICU drive", "Referral relationships with maternity units, neonatal staffing "
         "and governance to run three cots full safely, operations leader in post", TEAL),
        ("Months 2-4", "Switch on the lines", "Haven Club launch, pharmacy retail and lab outsourcing, "
         "staff app and welfare, immunisation, home care, HMO renegotiation", GOLD),
        ("Months 4-6", "Peak the season", "NICU full into the high season, all lines live, revenue peaks "
         "at N45-50M by February at the EBITDA floor", TEAL),
    ]
    y = PAGE_H - 190
    labelw = 150
    barx = MX + labelw + 14
    barw = PAGE_W - MX - barx
    rh = 62
    for i, (win, name, focus, col) in enumerate(phases):
        ry = y - i * (rh + 9)
        c.setFillColor(NAVY)
        c.roundRect(MX, ry - rh, labelw, rh, 6, fill=1, stroke=0)
        c.setFillColor(GOLD)
        c.setFont("Helvetica-Bold", 12.5)
        c.drawString(MX + 14, ry - 25, win)
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(MX + 14, ry - 42, name)
        c.setFillColor(SURFACE)
        c.roundRect(barx, ry - rh, barw, rh, 6, fill=1, stroke=0)
        c.setFillColor(col)
        c.rect(barx, ry - rh, 4, rh, fill=1, stroke=0)
        para(c, focus, barx + 16, ry - 24, "Helvetica", 11, BODY, barw - 32, 15)


def sBoard_align(c):
    chrome(c, 0, "Board alignment  /  where you agree")
    hy = heading(c, "The founders' survey: a strongly aligned board")
    subhead(c, "Four of five founders have responded (Dr Odedina outstanding). The survey forced "
               "trade-offs rather than agreement scales, so where they line up, it is real.", hy - 12)
    items = [
        ("Reinvest, not distribute.", "All four would put the surplus back into Haven rather than take it "
         "out now."),
        ("Hand daily management to professionals.", "Unanimous, which is the mandate for the senior "
         "operations leader this plan hires."),
        ("Perfect one site, one flagship.", "All four want to perfect one site before growing, and all "
         "four want one exceptional hospital, not a multi-site group."),
        ("Invest in staff as the engine.", "All four chose staff investment over protecting margin."),
        ("Fund revenue and growth first.", "The N100 split puts revenue systems and growth ahead, with "
         "quality and licensing agreed as the lower near-term priority."),
    ]
    y = bullet_block(c, items, MX, hy - 44, PAGE_W - 2 * MX - 20, gap=12, size=12.2, leading=15.5)
    callout(c, MX, y - 2, PAGE_W - 2 * MX,
            "On the fundamentals the board is strikingly aligned: reinvest, professionalise, perfect one "
            "site, back the staff. That shared foundation is what makes committing to a plan possible.",
            bg=GREEN_BG, spine=GREEN, fg=NAVY, size=11.5)


def sBoard_diverge(c):
    chrome(c, 0, "Board alignment  /  where you diverge")
    hy = heading(c, "...and the real conversations still to have")
    items = [
        ("How high to climb.", "Two founders aim to stabilise, two aim for a centre of excellence, and "
         "they misread each other on it. The ambition itself is not yet settled."),
        ("The senior operations leader.", "Everyone wants professional management, but how much to fund it "
         "now splits widest, from 5 to 30 of every 100. One founder names hiring a GM as the single most "
         "important move."),
        ("Build in-house or outsource.", "An even split, two each way."),
        ("Pace.", "Three of four lean to protecting harmony over pushing hard, worth weighing against any "
         "pressure to hit the number fast."),
    ]
    y = bullet_block(c, items, MX, hy - 16, PAGE_W - 2 * MX - 20, gap=11, size=12, leading=15)
    callout(c, MX, y - 2, PAGE_W - 2 * MX,
            "The hidden gap: all four chose to invest in staff, yet half assume their fellow founders "
            "would protect margin instead, and staff is funded below revenue and growth. That is the "
            "trade-off one founder named as the one being quietly avoided. It is the board's to resolve, "
            "not ours, and best resolved out loud.",
            bg=CREAM, spine=GOLD, size=11.3)


def s38_governance(c):
    chrome(c, 38, "Delivery  /  governance & measurement")
    hy = heading(c, "How C4A delivers, and how we measure it")
    y = hy - 16
    items = [
        ("Yours to own, ours to enable.", "Consult for Africa sets the targets, the levers and the "
         "expectations, and runs the delivery day to day. The strategy and the decisions stay the "
         "founders'. We hold the standard and the pace; we do not take over ownership of your business."),
        ("One dashboard, honest numbers.", "Once billing is live, the board sees a single monthly report: "
         "revenue by line, EBITDA against the floor, cot occupancy, membership count, receivables days, "
         "and the experience pulse."),
        ("Reviewed against the six-month ramp.", "Every month is judged against the plan: revenue and "
         "EBITDA versus target, and each feeder and move tracked, so course corrections happen early."),
    ]
    y = bullet_block(c, items, MX, y, PAGE_W - 2 * MX - 20, gap=13, size=12.3, leading=16)
    callout(c, MX, y - 2, PAGE_W - 2 * MX,
            "Transparency is part of the standard we are setting for the facility: the pricing, the "
            "discount and the adviser's board seat are all disclosed in full to every owner.",
            bg=SURFACE, spine=TEAL, size=11.5)


def s39_risks(c):
    chrome(c, 39, "Delivery  /  risks")
    hy = heading(c, "The risks, and how we hold them")
    rows = [
        ("Execution capacity", "The senior operations leader and clear sequencing stop the plan resting on "
         "the founders' bandwidth."),
        ("Membership take-up", "Priced to the family wallet and tested with real parents before launch; "
         "value published so it is a visible win, not a gamble."),
        ("Club over-build", "Kept asset-light. A heavy family club collapsed elsewhere on capped "
         "membership versus fit-out; Haven leans on its clinical core and partners."),
        ("Adverse selection", "Enrolment windows, waiting periods and a well-child framing stop the club "
         "attracting only the already-sick."),
        ("Baseline uncertainty", "The current numbers are estimates until billing is live; the plan makes "
         "that its first build rather than papering over it."),
    ]
    top = PAGE_H - 150
    rh = 44
    for i, (risk, mit) in enumerate(rows):
        ry = top - i * (rh + 7)
        c.setFillColor(CREAM)
        c.roundRect(MX, ry - rh, 190, rh, 6, fill=1, stroke=0)
        c.setFillColor(GOLD)
        c.rect(MX, ry - rh, 4, rh, fill=1, stroke=0)
        c.setFillColor(NAVY)
        c.setFont("Helvetica-Bold", 11)
        for j, ln in enumerate(wrap(c, risk, "Helvetica-Bold", 11, 168)):
            c.drawString(MX + 14, ry - 18 - j * 13, ln)
        bx = MX + 190 + 12
        bw = PAGE_W - MX - bx
        c.setFillColor(SURFACE)
        c.roundRect(bx, ry - rh, bw, rh, 6, fill=1, stroke=0)
        para(c, mit, bx + 14, ry - 17, "Helvetica", 10.5, BODY, bw - 28, 14)


def s40_close(c):
    c.setFillColor(NAVY)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.setFillColor(DEEP_NAVY)
    c.rect(0, 0, PAGE_W, 12, fill=1, stroke=0)
    c.rect(0, PAGE_H - 12, PAGE_W, 12, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(MX, PAGE_H - 118, 44, 3, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(GOLD)
    c.drawString(MX + 56, PAGE_H - 121, "THE MANDATE, RESTATED")
    c.setFont("Helvetica-Bold", 34)
    c.setFillColor(white)
    c.drawString(MX, PAGE_H - 172, "N45-50M a month. 18-20% EBITDA.")
    c.drawString(MX, PAGE_H - 210, "Reached in six months, into the season.")
    para(c,
         "From N15-20M today it is about two and a half times, led by the NICU into the paediatric high "
         "season, with the fast fixes funding it. The targets and the levers are ours to set and deliver; "
         "the strategy and the calls stay yours. The first moves start now: the tariff and billing, the "
         "NICU feeders with Dr Odedina, and the operations hire.",
         MX, PAGE_H - 250, "Helvetica", 13.5, LIGHT, 680, 21)
    c.setFillColor(GOLD)
    c.rect(MX, 120, 60, 3, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 14)
    c.setFillColor(white)
    c.drawString(MX, 96, "Consult for Africa")
    c.setFont("Helvetica", 11)
    c.setFillColor(LIGHT)
    c.drawString(MX, 76, "Healthcare transformation partner")
    c.drawString(MX, 58, "hello@consultforafrica.com   /   +234 913 813 8553   /   consultforafrica.com")
    c.drawString(MX, 40, "Lagos and Abuja, Nigeria")


def build():
    c = canvas.Canvas(str(OUT), pagesize=landscape(A4))
    c.setTitle("Haven Paediatric Centre - Strategy & Growth Plan - Consult for Africa")
    c.setAuthor("Consult for Africa")
    slides = [
        s01_cover, s02_mandate, s03_exec, s04_howtoread,
        s05_today, s06_culture, s07_audit, s08_economics, s09_gap,
        s10_target_state, s11_bridge, s12_pnl, s13_ramp,
        s_sprint, s_sprint_dependency,
        s14_workstreams,
        sA_intro, sA_club_concept, sA_club_plans, sA_club_sales, sA_tariff,
        sA_nicu, sA_nicu_fill, sA_pharmacy, sA_newlines,
        sB_intro, sB_culture, sB_staff, sB_incentives, sB_training, sB_leader,
        sC_intro, sC_billing, sC_workingcapital, sC_outsource, sC_quality, sC_cx,
        sD_intro, sD_engine,
        s37_roadmap, sBoard_align, sBoard_diverge, s38_governance, s39_risks, s40_close,
    ]
    global TOTAL, PAGENO
    TOTAL = str(len(slides))
    for i, s in enumerate(slides):
        PAGENO = i + 1
        s(c)
        c.showPage()
    c.save()
    print(f"wrote {OUT}  ({len(slides)} slides)")


if __name__ == "__main__":
    build()
