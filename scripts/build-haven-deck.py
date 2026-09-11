"""
Build the Haven Paediatric Centre board PRESENTATION deck for Consult For Africa.

A landscape, slide-per-page briefing deck for the full board
(Mr Kabir Aregbesola, Dr Shakirah Saliu, Dr Odedina). Narrative spine:
context -> culture -> the fix -> the numbers.

Source narrative: docs/haven-paediatric-proposal-cfa.md
Output:          docs/haven-paediatric-deck-cfa.pdf  (A4 landscape, branded slides)

Run:
  python3 scripts/build-haven-deck.py
"""

from __future__ import annotations

from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
OUT = DOCS / "haven-paediatric-deck-cfa.pdf"
LOGO = DOCS / "c4a-logo-reversed.png"   # white knockout for dark cover

# ---- brand palette (source: docs/brand-guide-cfa.pdf) ----------------------
NAVY = HexColor("#0B3C5D")
DEEP_NAVY = HexColor("#081521")
GOLD = HexColor("#D4AF37")
TEAL = HexColor("#1F7A8C")
BODY = HexColor("#1F2937")
MUTED = HexColor("#6B7280")
SURFACE = HexColor("#F1F5F9")
LIGHT = HexColor("#C9D6E0")
CREAM = HexColor("#FBF6E6")

PAGE_W, PAGE_H = landscape(A4)   # 842 x 595
MX = 54                          # left/right margin
TOTAL = "16"                     # filled after slides are counted


# ----------------------------------------------------------- helpers ---------
def wrap(c, text, font, size, max_w):
    """Greedy word-wrap into a list of lines that fit max_w."""
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
    """Standard content-slide furniture: top band, kicker, footer."""
    # top hairline + band
    c.setFillColor(NAVY)
    c.rect(0, PAGE_H - 6, PAGE_W, 6, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(0, PAGE_H - 9, PAGE_W, 3, fill=1, stroke=0)
    # kicker
    c.setFillColor(GOLD)
    c.rect(MX, PAGE_H - 60, 26, 3, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 10.5)
    c.setFillColor(TEAL)
    c.drawString(MX + 36, PAGE_H - 63, kicker.upper())
    # footer
    c.setFillColor(GOLD)
    c.rect(MX, 30, 20, 2, fill=1, stroke=0)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8)
    c.drawString(MX, 19, "Consult for Africa   /   Confidential   /   Prepared for the Haven Paediatric Centre board")
    c.drawRightString(PAGE_W - MX, 19, "%s / %s" % (str(n).zfill(2), TOTAL))
    # logomark, top-right of each white content slide
    try:
        _ic = ImageReader(str(DOCS / "c4a-icon.png"))
        _iw, _ih = _ic.getSize()
        _h = 30.0
        _w = _h * _iw / _ih
        c.drawImage(_ic, PAGE_W - MX - _w, PAGE_H - 78, width=_w, height=_h, mask="auto")
    except Exception:
        pass


def heading(c, text, y=PAGE_H - 108, size=27, color=NAVY, max_w=None):
    max_w = max_w or (PAGE_W - 2 * MX)
    c.setFont("Helvetica-Bold", size)
    c.setFillColor(color)
    leading = size + 6
    for line in wrap(c, text, "Helvetica-Bold", size, max_w):
        c.drawString(MX, y, line)
        y -= leading
    return y


def bullet_block(c, items, x, y, max_w, gap=14, size=12.5, leading=16.5,
                 lead_font="Helvetica-Bold", body_color=BODY):
    """items: list of (lead, rest). lead is bolded inline, rest wraps after."""
    for lead, rest in items:
        # gold tick
        c.setFillColor(GOLD)
        c.rect(x, y - 1, 7, 3, fill=1, stroke=0)
        tx = x + 18
        if lead:
            c.setFont(lead_font, size)
            c.setFillColor(NAVY)
            c.drawString(tx, y, lead)
            offset = c.stringWidth(lead + "  ", lead_font, size)
        else:
            offset = 0
        # first line continues after lead, subsequent lines full width
        c.setFont("Helvetica", size)
        c.setFillColor(body_color)
        words = rest.split()
        first_w = max_w - offset
        cur, first_done, cy = "", False, y
        line_x = tx + offset
        avail = first_w
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
        for i, (lx, ln) in enumerate(out_lines):
            c.setFont("Helvetica", size)
            c.setFillColor(body_color)
            c.drawString(lx, cy, ln)
            cy -= leading
        y = cy - gap
    return y


def stat_card(c, x, y, w, h, big, label, accent=GOLD, bg=SURFACE, big_color=NAVY):
    c.setFillColor(bg)
    c.roundRect(x, y, w, h, 8, fill=1, stroke=0)
    c.setFillColor(accent)
    c.rect(x, y, 4, h, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 26)
    c.setFillColor(big_color)
    c.drawString(x + 18, y + h - 40, big)
    c.setFont("Helvetica", 10)
    c.setFillColor(MUTED)
    ly = y + h - 62
    for line in wrap(c, label, "Helvetica", 10, w - 30):
        c.drawString(x + 18, ly, line)
        ly -= 13


# ----------------------------------------------------------- slides ----------
def slide_cover(c):
    c.setFillColor(NAVY)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.setFillColor(DEEP_NAVY)
    c.rect(0, 0, PAGE_W, 12, fill=1, stroke=0)
    c.rect(0, PAGE_H - 12, PAGE_W, 12, fill=1, stroke=0)
    # logo (top-left), fallback to wordmark
    try:
        img = ImageReader(str(LOGO))
        iw, ih = img.getSize()
        dw = 168
        dh = dw * ih / iw
        c.drawImage(img, MX, PAGE_H - 70 - dh + 20, width=dw, height=dh,
                    mask="auto", preserveAspectRatio=True)
    except Exception:
        c.setFillColor(GOLD)
        c.setFont("Helvetica-Bold", 13)
        c.drawString(MX, PAGE_H - 64, "CONSULT FOR AFRICA")

    # eyebrow
    c.setFillColor(GOLD)
    c.rect(MX, PAGE_H - 188, 44, 3, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(GOLD)
    c.drawString(MX + 56, PAGE_H - 191, "BOARD BRIEFING  /  HEALTHCARE TRANSFORMATION")

    c.setFont("Helvetica-Bold", 46)
    c.setFillColor(white)
    c.drawString(MX, PAGE_H - 250, "Haven Paediatric Centre")
    c.setFont("Helvetica-Bold", 20)
    c.setFillColor(GOLD)
    c.drawString(MX, PAGE_H - 285, "Operational turnaround, culture, and growth")

    para(c,
         "Building the culture, standards, and financial discipline that let a strong young "
         "facility grow with confidence. What the numbers show, the plan, and exactly what it costs.",
         MX, PAGE_H - 330, "Helvetica", 13.5, LIGHT, 560, 20)

    # meta strip
    c.setFillColor(GOLD)
    c.rect(MX, 96, 60, 3, fill=1, stroke=0)
    for i, line in enumerate([
        "For:   Mr Kabir Aregbesola,  Mrs Abisodun Alli,  Dr Shakirah Saliu,  Dr Odedina, Mr Ogochukwu Odum",
        "From:  Dr Debo Odulana, Founding Partner, Consult for Africa",
        "hello@consultforafrica.com   /   +234 913 813 8553   /   consultforafrica.com",
    ]):
        c.setFont("Helvetica", 10.5)
        c.setFillColor(white if i < 2 else LIGHT)
        c.drawString(MX, 72 - i * 17, line)


def slide_why(c):
    chrome(c, 2, "Why we are here")
    heading(c, "A strong young facility, ready to build for what comes next")
    y = PAGE_H - 168
    y = para(c,
             "Haven funds its own salaries, holds a steady patient base, and has earned a real "
             "reputation in Ikeja. For a facility this young, that is a genuine achievement.",
             MX, y, "Helvetica", 13, BODY, PAGE_W - 2 * MX, 19)
    y -= 10
    cx, cw = MX, PAGE_W - 2 * MX
    ch = 130
    c.setFillColor(CREAM)
    c.roundRect(cx, y - ch, cw, ch, 8, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(cx, y - ch, 5, ch, fill=1, stroke=0)
    para(c,
         "Leadership is now doing what the best operators do: looking hard at the systems beneath "
         "the surface before growth outpaces them.",
         cx + 22, y - 28, "Helvetica-Bold", 13.5, NAVY, cw - 44, 19)
    para(c,
         "As Haven scales into more complex care, including neonatal intensive care, its clinical "
         "governance, its standards of work, and its financial discipline need to be deliberate "
         "rather than assumed. This engagement builds exactly that foundation, so the "
         "facility grows with confidence.",
         cx + 22, y - 70, "Helvetica", 11.5, BODY, cw - 44, 16)


def slide_diagnosis(c):
    c.setFillColor(NAVY)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(0, PAGE_H - 9, PAGE_W, 3, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(MX, PAGE_H - 70, 26, 3, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 10.5)
    c.drawString(MX + 36, PAGE_H - 73, "THE CORE INSIGHT")

    c.setFont("Helvetica-Bold", 34)
    c.setFillColor(white)
    y = PAGE_H - 150
    for line in ["Culture is the multiplier,", "not a later add-on."]:
        c.drawString(MX, y, line)
        y -= 42
    y -= 18
    para(c,
         "Process fixes rarely hold on their own. What makes safe, efficient care automatic, rather "
         "than dependent on individual diligence, is the culture, the standards of work, and the "
         "incentives beneath it. Build that foundation first, and everything above it holds.",
         MX, y, "Helvetica", 14, LIGHT, PAGE_W - 2 * MX - 40, 21)

    # foundation first
    by = 150
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 15)
    c.drawString(MX, by, "Build the foundation first.")
    c.setFillColor(white)
    c.drawString(MX, by - 26, "Then safety, margin, and growth all follow.")
    c.setFooterRule = None
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8)
    c.drawRightString(PAGE_W - MX, 19, "03 / " + TOTAL)


def slide_root_cause(c):
    chrome(c, 4, "The same root cause, everywhere")
    heading(c, "One root cause, showing up in three places")
    y = PAGE_H - 168
    items = [
        ("Safety.", "Consistent, shift-level clinical routines are the backbone of reliable "
         "care, and formalising them is foundational as the facility grows."),
        ("Margin.", "Margins are thin despite reasonable revenue, because no ownership culture "
         "is pushing efficiency and yield."),
        ("The answer is already on the table.", "Two items already on the board's own decision "
         "list, the staff commission structure and the JDS and KPIs, are exactly the incentive "
         "and accountability tools a strong culture runs on."),
    ]
    y = bullet_block(c, items, MX, y, PAGE_W - 2 * MX - 20, gap=18, size=13.5, leading=18)
    y -= 6
    cw = PAGE_W - 2 * MX
    ch = 60
    c.setFillColor(SURFACE)
    c.roundRect(MX, y - ch, cw, ch, 8, fill=1, stroke=0)
    c.setFillColor(TEAL)
    c.rect(MX, y - ch, 5, ch, fill=1, stroke=0)
    para(c,
         "So the work is not to patch processes. It is to build the culture, standards of work, "
         "and incentives that make good processes self-sustaining, then reengineer the processes "
         "so the culture has something solid to run on.",
         MX + 22, y - 24, "Helvetica-Bold", 12.5, NAVY, cw - 44, 17)


def slide_working_capital(c):
    chrome(c, 5, "What the report already tells us")
    hy = heading(c, "The cash problem is a working-capital problem, not a profit problem")
    para(c,
         "Leadership feels there is “barely anything left” after salaries. The report shows why: "
         "the money is not missing. It is on the shelf and in the HMO ledgers.",
         MX, hy - 14, "Helvetica", 13, BODY, PAGE_W - 2 * MX, 19)
    # three stat cards
    cardw = (PAGE_W - 2 * MX - 2 * 20) / 3
    cy, chh = 196, 130
    stat_card(c, MX, cy, cardw, chh, "~N4.2M", "HMO receivables, Leadway and NEM alone, close to a full period's revenue", accent=GOLD)
    stat_card(c, MX + cardw + 20, cy, cardw, chh, "~N2.77M", "Sitting in pharmacy stock, cash converted into inventory on the shelf", accent=TEAL)
    stat_card(c, MX + 2 * (cardw + 20), cy, cardw, chh, "~N7M", "Total working capital locked up, recoverable without selling a single extra service", accent=GOLD, bg=CREAM)


def slide_nicu(c):
    chrome(c, 6, "The through-line of the engagement")
    hy = heading(c, "NICU is the growth engine, and it rewards getting the basics right first")
    y = hy - 22
    colbot = 132
    # two columns
    colw = (PAGE_W - 2 * MX - 28) / 2
    # left: engine
    c.setFillColor(SURFACE)
    c.roundRect(MX, colbot, colw, y - colbot - 4, 8, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(MX, colbot, 5, y - colbot - 4, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 14)
    c.setFillColor(NAVY)
    c.drawString(MX + 22, y - 26, "The highest-yield lever in the building")
    para(c,
         "At an N3M deposit per admission against three beds, nothing else in the facility "
         "compares for revenue per bed. This is where growth comes from.",
         MX + 22, y - 52, "Helvetica", 12, BODY, colw - 40, 17)
    # right: risk
    rx = MX + colw + 28
    c.setFillColor(CREAM)
    c.roundRect(rx, colbot, colw, y - colbot - 4, 8, fill=1, stroke=0)
    c.setFillColor(TEAL)
    c.rect(rx, colbot, 5, y - colbot - 4, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 14)
    c.setFillColor(NAVY)
    c.drawString(rx + 22, y - 26, "And what safe scaling asks first")
    para(c,
         "Scaling neonatal intensive care durably means putting the governance, standards, and "
         "team readiness in place first. Get that right, and the growth compounds.",
         rx + 22, y - 52, "Helvetica", 12, BODY, colw - 40, 17)
    # bottom line
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 13)
    c.drawCentredString(PAGE_W / 2, 92,
                        "Get the governance right first. Then scale NICU with confidence, and the revenue follows.")


def slide_reporting(c):
    chrome(c, 7, "What the report already tells us")
    heading(c, "The reporting layer is immature, and that is itself a finding")
    y = PAGE_H - 168
    items = [
        ("", "Visit-type counts do not reconcile to total encounters."),
        ("", "The receivables table does not foot."),
        ("", "A 201% pharmacy “profit” is a markup, not a margin."),
    ]
    y = bullet_block(c, items, MX, y, PAGE_W - 2 * MX - 20, gap=12, size=13.5, leading=18)
    y -= 8
    cw = PAGE_W - 2 * MX
    ch = 66
    c.setFillColor(SURFACE)
    c.roundRect(MX, y - ch, cw, ch, 8, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(MX, y - ch, 5, ch, fill=1, stroke=0)
    para(c,
         "None of this is incompetence. It is the absence of a senior operator. You cannot manage "
         "what you cannot measure reliably, and right now the numbers the board sees cannot be "
         "fully trusted.",
         MX + 22, y - 26, "Helvetica-Bold", 12.5, NAVY, cw - 44, 17)


def slide_workstreams(c):
    chrome(c, 8, "The fix")
    heading(c, "One board-led turnaround, five workstreams")
    y = PAGE_H - 150
    rows = [
        ("1", "Diagnostic audit  (4 weeks)",
         "Clinical governance, operations, finance and working capital, procurement, HMO economics, "
         "reporting. Two quick wins from week one: a checklist-governed crash cart, and a receivables push."),
        ("2", "Culture, incentives & clinical standards of work, the spine",
         "Shift-level routines, nursing standards of work, the safety-huddle cadence. Redesign the "
         "commission structure and JDS/KPIs around quality and ownership, not activity alone."),
        ("3", "Process reengineering & operations",
         "Vendor-managed inventory (recommend Medbury Pharma) to end stockouts and lift pharmacy "
         "margin. Build the receivables-recovery process and a reliable reporting layer."),
        ("4", "Revenue & growth optimisation",
         "Internal: NICU activation, pricing, pharmacy attach, HMO yield. External: corporate tie-ups, "
         "school partnerships (Toddler Town), a referral pipeline."),
        ("5", "Board-level oversight  (optional retainer)",
         "Up to two days a month of partner-level oversight, continuing after the core project. The "
         "ongoing governance layer, offered as an opt-in."),
    ]
    rh = 70
    cw = PAGE_W - 2 * MX
    for i, (num, title, desc) in enumerate(rows):
        ry = y - i * (rh + 6)
        spine = GOLD if num != "2" else TEAL
        c.setFillColor(SURFACE if num != "2" else CREAM)
        c.roundRect(MX, ry - rh, cw, rh, 7, fill=1, stroke=0)
        # number chip
        c.setFillColor(NAVY)
        c.roundRect(MX + 10, ry - rh + 12, 40, rh - 24, 6, fill=1, stroke=0)
        c.setFillColor(GOLD)
        c.setFont("Helvetica-Bold", 22)
        c.drawCentredString(MX + 30, ry - rh / 2 - 8, num)
        c.setFillColor(spine)
        c.rect(MX, ry - rh, 4, rh, fill=1, stroke=0)
        tx = MX + 64
        c.setFont("Helvetica-Bold", 12.5)
        c.setFillColor(NAVY)
        c.drawString(tx, ry - 22, title)
        para(c, desc, tx, ry - 38, "Helvetica", 9.8, BODY, cw - 64 - 18, 12.5)


def slide_ops_leader(c):
    chrome(c, 9, "The hire that makes it stick")
    heading(c, "A senior operations leader, running the facility day to day")
    y = PAGE_H - 168
    y = para(c,
             "One thing advised early still holds, and leadership is now ready for it: Haven needs a "
             "senior, experienced operator running the facility day to day.",
             MX, y, "Helvetica", 13.5, BODY, PAGE_W - 2 * MX, 19)
    y -= 6
    items = [
        ("Define first, then hire.", "The audit specifies the role and its KPIs before anyone is "
         "recruited, so the hire lands into clarity rather than chaos."),
        ("Sourced through CadreHealth.", "Consult for Africa's workforce platform sources and vets "
         "the candidate, including diaspora and senior-operator profiles."),
    ]
    bullet_block(c, items, MX, y, PAGE_W - 2 * MX - 20, gap=16, size=13, leading=17.5)


def slide_timeline(c):
    chrome(c, 10, "Timeline")
    heading(c, "Stabilise fast, build deliberately, then grow")
    phases = [
        ("Stabilise", "Weeks 1 to 2", "Crash-cart standard and checklist, receivables recovery push"),
        ("Diagnostic audit", "Weeks 1 to 4", "Full audit across all functions"),
        ("Culture & process build", "Months 2 to 4", "Standards of work, incentives, procurement, reporting"),
        ("Growth", "Months 3 to 6", "NICU activation, pricing, corporate and HMO tie-ups"),
        ("Oversight", "Ongoing (optional)", "Board-level management retainer"),
    ]
    y = PAGE_H - 150
    cw = PAGE_W - 2 * MX
    labelw = 200
    barx = MX + labelw + 14
    barw = cw - labelw - 14
    rh = 56
    for i, (name, timing, focus) in enumerate(phases):
        ry = y - i * (rh + 8)
        c.setFillColor(NAVY)
        c.roundRect(MX, ry - rh, labelw, rh, 6, fill=1, stroke=0)
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", 12.5)
        c.drawString(MX + 14, ry - 22, name)
        c.setFillColor(GOLD)
        c.setFont("Helvetica-Bold", 9.5)
        c.drawString(MX + 14, ry - 38, timing)
        c.setFillColor(SURFACE)
        c.roundRect(barx, ry - rh, barw, rh, 6, fill=1, stroke=0)
        c.setFillColor(GOLD)
        c.rect(barx, ry - rh, 4, rh, fill=1, stroke=0)
        para(c, focus, barx + 18, ry - 24, "Helvetica", 11.5, BODY, barw - 36, 15)


def _money_table(c, x, y, headers, rows, colw, highlight_last=True, header_bg=NAVY):
    rh = 28
    tw = sum(colw)
    # header
    c.setFillColor(header_bg)
    c.rect(x, y - rh, tw, rh, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(x, y - rh, tw, 2.5, fill=1, stroke=0)
    cxp = x
    for j, h in enumerate(headers):
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", 10.5)
        if j == 0:
            c.drawString(cxp + 12, y - 19, h)
        else:
            c.drawRightString(cxp + colw[j] - 12, y - 19, h)
        cxp += colw[j]
    # body
    for i, row in enumerate(rows):
        ry = y - rh - (i + 1) * rh
        last = highlight_last and (i == len(rows) - 1)
        if last:
            c.setFillColor(CREAM)
        else:
            c.setFillColor(white if i % 2 == 0 else SURFACE)
        c.rect(x, ry, tw, rh, fill=1, stroke=0)
        if last:
            c.setFillColor(GOLD)
            c.rect(x, ry + rh - 1.5, tw, 1.5, fill=1, stroke=0)
        cxp = x
        for j, cell in enumerate(row):
            c.setFillColor(NAVY if last else BODY)
            c.setFont("Helvetica-Bold" if (last or j > 0) else "Helvetica", 10.2)
            if j == 0:
                c.setFont("Helvetica-Bold" if last else "Helvetica", 10.2)
                c.drawString(cxp + 12, ry + 10, cell)
            else:
                c.drawRightString(cxp + colw[j] - 12, ry + 10, cell)
            cxp += colw[j]
    return y - rh - len(rows) * rh


def slide_commercials(c):
    chrome(c, 11, "Commercials, in full transparency")
    heading(c, "Full value, one visible discount, then the net")
    y = PAGE_H - 150
    y = para(c,
             "Every workstream is priced at standard rates so the board sees the real value, then a "
             "single 40% partner discount line, then the net. Nothing is hidden in the rate.",
             MX, y, "Helvetica", 12.5, BODY, PAGE_W - 2 * MX, 18)
    y -= 6
    headers = ["Workstream", "Standard", "Partner (40% off)"]
    rows = [
        ["1.  Diagnostic audit (4 weeks)", "N3,500,000", "N2,100,000"],
        ["2.  Culture, incentives & standards", "N5,000,000", "N3,000,000"],
        ["3.  Process reengineering & operations", "N4,000,000", "N2,400,000"],
        ["4.  Revenue & growth optimisation", "N4,500,000", "N2,700,000"],
        ["Core project total", "N17,000,000", "N10,200,000"],
    ]
    cw = PAGE_W - 2 * MX
    colw = [cw - 2 * 160, 160, 160]
    yend = _money_table(c, MX, y, headers, rows, colw)
    # concession + retainer callouts side by side
    cardw = (cw - 20) / 2
    cy = yend - 14
    chh = 56
    c.setFillColor(SURFACE)
    c.roundRect(MX, cy - chh, cardw, chh, 7, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(MX, cy - chh, 4, chh, fill=1, stroke=0)
    para(c, "The discount is an N6,800,000 concession, shown in full rather than buried in a lower headline rate.",
         MX + 16, cy - 20, "Helvetica-Bold", 11, NAVY, cardw - 30, 15)
    rx = MX + cardw + 20
    c.setFillColor(HexColor("#EAF1F4"))
    c.roundRect(rx, cy - chh, cardw, chh, 7, fill=1, stroke=0)
    c.setFillColor(TEAL)
    c.rect(rx, cy - chh, 4, chh, fill=1, stroke=0)
    para(c, "Optional oversight (WS5): N1,000,000/mo standard, N600,000/mo partner, up to two days a month. Opt-in.",
         rx + 16, cy - 20, "Helvetica-Bold", 11, NAVY, cardw - 30, 15)


def slide_payment(c):
    chrome(c, 12, "How payment works")
    hy = heading(c, "Cost tracks delivery, covered by the cash the early work unlocks")
    y = para(c,
             "A mobilisation fee on signing, then the balance spread in equal monthly instalments. "
             "The receivables recovery and margin gains from the early work comfortably cover the schedule.",
             MX, hy - 14, "Helvetica", 12.5, BODY, PAGE_W - 2 * MX, 18)
    y -= 6
    headers = ["Payment", "When", "Amount"]
    rows = [
        ["Mobilisation (diagnostic audit)", "On signing", "N2,100,000"],
        ["Monthly instalment (x5)", "Months 1 to 5", "N1,620,000 each"],
        ["Core project total", "", "N10,200,000"],
    ]
    cw = PAGE_W - 2 * MX
    colw = [cw - 2 * 175, 175, 175]
    yend = _money_table(c, MX, y, headers, rows, colw)
    para(c,
         "The optional oversight retainer, if taken up, is billed monthly and separately from the schedule above.",
         MX, yend - 22, "Helvetica-Oblique", 10, MUTED, cw, 14)
    # governance note card
    gy = yend - 50
    gh = 86
    c.setFillColor(NAVY)
    c.roundRect(MX, gy - gh, cw, gh, 8, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(MX, gy - gh, 5, gh, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 12)
    c.setFillColor(GOLD)
    c.drawString(MX + 22, gy - 24, "A note on governance")
    para(c,
         "Dr Odulana has been invited to Haven's board, and Consult for Africa would be a paid partner. "
         "That overlap is common and workable. Pricing and the discount are disclosed in full to all owners, "
         "the engagement is clean fixed fees plus an optional retainer, and there is no success fee tied to "
         "outcomes he would oversee. Transparency is part of the standard we are setting.",
         MX + 22, gy - 42, "Helvetica", 10.3, LIGHT, cw - 44, 14)


def slide_six_months(c):
    chrome(c, 13, "What good looks like in six months")
    heading(c, "Six months from now")
    y = PAGE_H - 158
    left = [
        "A safety culture where the crash cart, and every critical routine, is checked every shift by habit, not reminder.",
        "The N4.2M in receivables recovered, with working-capital discipline that keeps cash moving.",
        "A vendor-managed inventory model that ends stockouts and lifts pharmacy margin.",
    ]
    right = [
        "NICU admissions growing safely against a governance standard the team trusts.",
        "A senior operations leader in post, running a facility that measures itself honestly.",
        "Incentives that reward quality and ownership, so the culture sustains itself after we step back.",
    ]
    colw = (PAGE_W - 2 * MX - 30) / 2
    bullet_block(c, [("", t) for t in left], MX, y, colw, gap=16, size=12.5, leading=16.5)
    bullet_block(c, [("", t) for t in right], MX + colw + 30, y, colw, gap=16, size=12.5, leading=16.5)


def slide_close(c):
    c.setFillColor(NAVY)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.setFillColor(DEEP_NAVY)
    c.rect(0, 0, PAGE_W, 12, fill=1, stroke=0)
    c.rect(0, PAGE_H - 12, PAGE_W, 12, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(MX, PAGE_H - 120, 44, 3, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(GOLD)
    c.drawString(MX + 56, PAGE_H - 123, "NEXT STEP")
    c.setFont("Helvetica-Bold", 32)
    c.setFillColor(white)
    c.drawString(MX, PAGE_H - 178, "Commission the diagnostic audit.")
    para(c,
         "If the board is content with the direction, the first step is the four-week diagnostic "
         "audit at N2,100,000 on signing. Its findings shape the detail of the culture, process, "
         "and growth work, and the timeline firms up around real data. On the go-ahead, we mobilise "
         "within the week.",
         MX, PAGE_H - 220, "Helvetica", 13.5, LIGHT, 640, 21)
    # contact card
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
    c.setTitle("Haven Paediatric Centre - Board Briefing - Consult for Africa")
    c.setAuthor("Consult for Africa")
    slides = [
        slide_cover, slide_why, slide_diagnosis, slide_root_cause,
        slide_working_capital, slide_nicu, slide_reporting, slide_workstreams,
        slide_ops_leader, slide_timeline, slide_commercials, slide_payment,
        slide_six_months, slide_close,
    ]
    global TOTAL
    TOTAL = str(len(slides))
    for s in slides:
        s(c)
        c.showPage()
    c.save()
    print(f"wrote {OUT}  ({len(slides)} slides)")


if __name__ == "__main__":
    build()
