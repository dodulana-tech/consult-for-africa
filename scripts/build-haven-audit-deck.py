"""
Build the Haven Paediatric Centre PHASE 1 deck: the Diagnostic Audit.

A landscape, slide-per-page deck that goes deep on Workstream 1 (the 4-week
diagnostic audit): objective, method, the areas examined, quick wins,
deliverables, timeline, what we need, and the fee. For the full board.

Source narrative: docs/haven-diagnostic-audit-scope-cfa.md
Output:          docs/haven-audit-deck-cfa.pdf  (A4 landscape, branded slides)

Run:
  python3 scripts/build-haven-audit-deck.py
"""

from __future__ import annotations

from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
OUT = DOCS / "haven-audit-deck-cfa.pdf"
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
MX = 54
TOTAL = "17"


# ----------------------------------------------------------- helpers ---------
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
    c.drawString(MX, 19, "Consult for Africa   /   Confidential   /   Haven Paediatric Centre  /  Phase 1: Diagnostic Audit")
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
                 lead_font="Helvetica-Bold", body_color=BODY, tick=GOLD):
    for lead, rest in items:
        c.setFillColor(tick)
        c.rect(x, y - 1, 7, 3, fill=1, stroke=0)
        tx = x + 18
        if lead:
            c.setFont(lead_font, size)
            c.setFillColor(NAVY)
            c.drawString(tx, y, lead)
            offset = c.stringWidth(lead + "  ", lead_font, size)
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


def callout(c, x, y, w, text, bg=SURFACE, spine=TEAL, fg=NAVY, pad=22,
            size=12.5, leading=17, font="Helvetica-Bold"):
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
    c.drawString(x + 18, y + h - 28, num)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 12.5)
    c.drawString(x + 40, y + h - 28, title)
    para(c, body, x + 18, y + h - 50, "Helvetica", 10.3, BODY, w - 34, 14)


# ----------------------------------------------------------- slides ----------
def slide_cover(c):
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
        c.drawImage(img, MX, PAGE_H - 70 - dh + 20, width=dw, height=dh,
                    mask="auto", preserveAspectRatio=True)
    except Exception:
        c.setFillColor(GOLD)
        c.setFont("Helvetica-Bold", 13)
        c.drawString(MX, PAGE_H - 64, "CONSULT FOR AFRICA")

    c.setFillColor(GOLD)
    c.rect(MX, PAGE_H - 188, 44, 3, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(GOLD)
    c.drawString(MX + 56, PAGE_H - 191, "PHASE 1 OF THE ENGAGEMENT  /  WORKSTREAM 1")

    c.setFont("Helvetica-Bold", 46)
    c.setFillColor(white)
    c.drawString(MX, PAGE_H - 250, "The Diagnostic Audit")
    c.setFont("Helvetica-Bold", 20)
    c.setFillColor(GOLD)
    c.drawString(MX, PAGE_H - 285, "Four weeks. Evidence, not impression. A costed plan of action.")

    para(c,
         "The mobilisation phase of the Haven turnaround. We establish exactly where the "
         "facility stands across safety, culture, operations, and cash, and deliver two quick "
         "wins while the audit is still running.",
         MX, PAGE_H - 330, "Helvetica", 13.5, LIGHT, 600, 20)

    c.setFillColor(GOLD)
    c.rect(MX, 96, 60, 3, fill=1, stroke=0)
    for i, line in enumerate([
        "For:   Mr Kabir Aregbesola,  Mrs Abisodun Alli,  Dr Shakirah Saliu,  Dr Odedina, Mr Ogochukwu Odum",
        "From:  Dr Debo Odulana, Founding Partner, Consult for Africa",
        "Fee:   N2,100,000 on signing  (standard N3,500,000, at the 40% partner discount)",
    ]):
        c.setFont("Helvetica", 10.5)
        c.setFillColor(white if i < 2 else GOLD)
        c.drawString(MX, 72 - i * 17, line)


def slide_where_it_sits(c):
    chrome(c, 2, "Where this sits")
    hy = heading(c, "One commitment now: the audit that shapes everything after it")
    para(c,
         "The engagement is one board-led turnaround with five workstreams. The board only needs "
         "to commission Workstream 1 today. Its findings shape the detail, and the price, of "
         "everything that follows.",
         MX, hy - 14, "Helvetica", 13, BODY, PAGE_W - 2 * MX, 19)
    # 5 workstream chips, WS1 highlighted
    labels = [
        ("1", "Diagnostic\naudit"),
        ("2", "Culture &\nincentives"),
        ("3", "Process &\noperations"),
        ("4", "Revenue &\ngrowth"),
        ("5", "Board\noversight"),
    ]
    n = len(labels)
    gap = 18
    cw = (PAGE_W - 2 * MX - gap * (n - 1)) / n
    cy, chh = 150, 132
    for i, (num, lab) in enumerate(labels):
        x = MX + i * (cw + gap)
        active = (i == 0)
        c.setFillColor(NAVY if active else SURFACE)
        c.roundRect(x, cy, cw, chh, 9, fill=1, stroke=0)
        c.setFillColor(GOLD if active else LIGHT)
        c.rect(x, cy, cw, 4, fill=1, stroke=0)
        c.setFillColor(GOLD if active else TEAL)
        c.setFont("Helvetica-Bold", 30)
        c.drawString(x + 16, cy + chh - 46, num)
        c.setFillColor(white if active else BODY)
        c.setFont("Helvetica-Bold", 12.5)
        for j, ln in enumerate(lab.split("\n")):
            c.drawString(x + 16, cy + 44 - j * 16, ln)
        if active:
            c.setFillColor(GOLD)
            c.setFont("Helvetica-Bold", 8.5)
            c.drawString(x + 16, cy + 16, "YOU ARE HERE")
    # arrow hint
    c.setFillColor(MUTED)
    c.setFont("Helvetica-Oblique", 9.5)
    c.drawString(MX, cy - 22, "Phase 1 is the foundation. The remaining workstreams are scoped and priced off the audit's findings.")


def slide_objective(c):
    chrome(c, 3, "The objective")
    hy = heading(c, "Leave the board with proof, and a prioritised, costed plan")
    para(c,
         "Establish, from evidence rather than impression, exactly where Haven stands across "
         "clinical safety, culture, operations, and cash.",
         MX, hy - 14, "Helvetica", 13, BODY, PAGE_W - 2 * MX, 19)
    pw = (PAGE_W - 2 * MX - 2 * 18) / 3
    py, ph = 150, 132
    pillar(c, MX, py, pw, ph, "01", "Evidence",
           "Findings grounded in records, observation, and interviews, not in impression or blame.",
           accent=GOLD)
    pillar(c, MX + pw + 18, py, pw, ph, "02", "A costed plan",
           "Prioritised recommendations, each costed, so the board can decide what to do and in what order.",
           accent=TEAL)
    pillar(c, MX + 2 * (pw + 18), py, pw, ph, "03", "Value during",
           "Two safety and cash quick wins are delivered while the audit runs, not after it reports.",
           accent=GOLD)


def slide_method(c):
    chrome(c, 4, "How we work")
    hy = heading(c, "Collaborative, not audit-by-ambush")
    y = hy - 18
    items = [
        ("Structured interviews.", "Leadership and frontline staff, nursing, pharmacy, customer "
         "service, and operations, so the picture reflects how work actually happens."),
        ("Direct observation on site.", "We watch the real operating day, not just the documented one."),
        ("Records review.", "Financial, clinical, and operational records, read against each other "
         "for what reconciles and what does not."),
        ("A short data request in week one.", "A focused list issued on day one so analysis starts "
         "immediately, not in week three."),
    ]
    y = bullet_block(c, items, MX, y, PAGE_W - 2 * MX - 20, gap=15, size=12.5, leading=16.5)
    callout(c, MX, y - 4, PAGE_W - 2 * MX,
            "The team is a partner in the findings, not a target of them. Honest data depends on people "
            "feeling safe to show us the real picture.", bg=CREAM, spine=GOLD)


def slide_areas_overview(c):
    chrome(c, 5, "What we examine")
    heading(c, "Eight areas, one connected picture")
    areas = [
        ("1", "Clinical governance\n& patient safety"),
        ("2", "Culture, routines\n& incentives"),
        ("3", "Operations &\nSOP adherence"),
        ("4", "Finance &\nworking capital"),
        ("5", "Procurement\n& inventory"),
        ("6", "HMO\neconomics"),
        ("7", "People &\nstructure"),
        ("8", "Management\nreporting integrity"),
    ]
    cols, rows = 4, 2
    gx, gy = 18, 16
    cw = (PAGE_W - 2 * MX - gx * (cols - 1)) / cols
    chh = 96
    top = PAGE_H - 168
    for idx, (num, lab) in enumerate(areas):
        r, col = divmod(idx, cols)
        x = MX + col * (cw + gx)
        yy = top - r * (chh + gy) - chh
        c.setFillColor(SURFACE)
        c.roundRect(x, yy, cw, chh, 8, fill=1, stroke=0)
        c.setFillColor(GOLD)
        c.rect(x, yy, 4, chh, fill=1, stroke=0)
        c.setFillColor(TEAL)
        c.setFont("Helvetica-Bold", 22)
        c.drawString(x + 16, yy + chh - 34, num)
        c.setFillColor(NAVY)
        c.setFont("Helvetica-Bold", 12)
        for j, ln in enumerate(lab.split("\n")):
            c.drawString(x + 16, yy + 36 - j * 15, ln)
    c.setFillColor(MUTED)
    c.setFont("Helvetica-Oblique", 9.5)
    c.drawString(MX, 44, "The next pages go deeper on each. The areas are examined together, because the failures connect.")


def exam_slide(c, n, idx_label, title, question, items, insight, insight_bg=CREAM, insight_spine=GOLD):
    chrome(c, n, idx_label)
    hy = heading(c, title, size=25)
    c.setFillColor(TEAL)
    c.setFont("Helvetica-BoldOblique", 12.5)
    qy = hy - 16
    for ln in wrap(c, "The question we answer:  " + question, "Helvetica-BoldOblique", 12.5, PAGE_W - 2 * MX):
        c.drawString(MX, qy, ln)
        qy -= 16
    y = qy - 14
    y = bullet_block(c, items, MX, y, PAGE_W - 2 * MX - 20, gap=11, size=11.8, leading=15.5)
    callout(c, MX, y - 2, PAGE_W - 2 * MX, insight, bg=insight_bg, spine=insight_spine,
            size=11.8, leading=16)


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
    c.drawString(MX, PAGE_H - 172, "Commission the audit.")
    c.drawString(MX, PAGE_H - 210, "We mobilise within the week.")
    para(c,
         "The diagnostic audit is N2,100,000, payable on signing (standard rate N3,500,000, at the "
         "40% partner discount). On the board's go-ahead, we issue the data request, set the "
         "crash-cart standard live, and begin the receivables push, all in week one.",
         MX, PAGE_H - 250, "Helvetica", 13.5, LIGHT, 660, 21)
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


# ------------------------------- detail slides built inline ------------------
def slide_quick_wins(c):
    chrome(c, 12, "Value before the report lands")
    hy = heading(c, "Two quick wins, delivered during the audit")
    para(c,
         "The board sees safety and cash improve in week one, before any findings are written up.",
         MX, hy - 14, "Helvetica", 13, BODY, PAGE_W - 2 * MX, 19)
    colw = (PAGE_W - 2 * MX - 28) / 2
    top = PAGE_H - 196
    boxh = 150
    # crash cart
    c.setFillColor(CREAM)
    c.roundRect(MX, top - boxh, colw, boxh, 9, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(MX, top - boxh, 5, boxh, fill=1, stroke=0)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(MX + 22, top - 30, "1.  A crash cart you can trust")
    para(c,
         "Stocked, sealed, and checklist-governed, with a shift-level check routine, live in week "
         "one. A core safety standard put in place from the start, not deferred to the end.",
         MX + 22, top - 54, "Helvetica", 11.5, BODY, colw - 40, 16)
    # receivables
    rx = MX + colw + 28
    c.setFillColor(SURFACE)
    c.roundRect(rx, top - boxh, colw, boxh, 9, fill=1, stroke=0)
    c.setFillColor(TEAL)
    c.rect(rx, top - boxh, 5, boxh, fill=1, stroke=0)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(rx + 22, top - 30, "2.  Cash starts moving")
    para(c,
         "An immediate recovery push on the largest HMO receivables, Leadway and NEM, so money "
         "starts coming in before the audit even reports. The work begins to pay for itself.",
         rx + 22, top - 54, "Helvetica", 11.5, BODY, colw - 40, 16)


def slide_deliverables(c):
    chrome(c, 13, "What you receive")
    hy = heading(c, "Two deliverables, presented to the board")
    para(c,
         "Both are walked through with the board in a working session at the end of week four, "
         "not emailed as a document to file away.",
         MX, hy - 14, "Helvetica", 13, BODY, PAGE_W - 2 * MX, 19)
    colw = (PAGE_W - 2 * MX - 28) / 2
    top = PAGE_H - 196
    boxh = 158
    items = [
        ("1.  Operational & Clinical Governance Audit Report", GOLD, CREAM,
         "Findings across every area examined, each with a prioritised, costed recommendation, so the "
         "board can act in order of impact and decide the shape of the workstreams that follow."),
        ("2.  Working Capital & Receivables Recovery Plan", TEAL, SURFACE,
         "A concrete plan to unlock the cash tied up in the ~N4.2M of receivables and ~N2.77M of "
         "pharmacy stock, with the routines that keep it from locking up again."),
    ]
    for i, (title, spine, bg, body) in enumerate(items):
        x = MX + i * (colw + 28)
        c.setFillColor(bg)
        c.roundRect(x, top - boxh, colw, boxh, 9, fill=1, stroke=0)
        c.setFillColor(spine)
        c.rect(x, top - boxh, 5, boxh, fill=1, stroke=0)
        c.setFillColor(NAVY)
        c.setFont("Helvetica-Bold", 13.5)
        ty = top - 30
        for ln in wrap(c, title, "Helvetica-Bold", 13.5, colw - 40):
            c.drawString(x + 22, ty, ln)
            ty -= 18
        para(c, body, x + 22, ty - 6, "Helvetica", 11.3, BODY, colw - 40, 15.5)


def slide_timeline(c):
    chrome(c, 14, "The four weeks")
    heading(c, "Mobilise in week one, present in week four")
    weeks = [
        ("Week 1", "Mobilise", "Stakeholder interviews, data request issued, crash-cart standard live, receivables push begins"),
        ("Week 2", "Care & operations", "Clinical governance and safety, culture and routines, operations and SOP walkthrough"),
        ("Week 3", "Money & numbers", "Finance and working capital, procurement and inventory, HMO economics, reporting integrity"),
        ("Week 4", "Synthesis", "Prioritised, costed recommendations, and the board presentation"),
    ]
    y = PAGE_H - 150
    cw = PAGE_W - 2 * MX
    labelw = 150
    barx = MX + labelw + 14
    barw = cw - labelw - 14
    rh = 64
    for i, (wk, name, focus) in enumerate(weeks):
        ry = y - i * (rh + 10)
        c.setFillColor(NAVY)
        c.roundRect(MX, ry - rh, labelw, rh, 6, fill=1, stroke=0)
        c.setFillColor(GOLD)
        c.setFont("Helvetica-Bold", 14)
        c.drawString(MX + 16, ry - 26, wk)
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(MX + 16, ry - 44, name)
        c.setFillColor(SURFACE)
        c.roundRect(barx, ry - rh, barw, rh, 6, fill=1, stroke=0)
        c.setFillColor(GOLD)
        c.rect(barx, ry - rh, 4, rh, fill=1, stroke=0)
        para(c, focus, barx + 18, ry - 26, "Helvetica", 11.8, BODY, barw - 36, 16)


def slide_what_we_need(c):
    chrome(c, 15, "What we need from Haven")
    hy = heading(c, "A light lift on your side, set up in week one")
    y = hy - 18
    items = [
        ("A named point person.", "We suggest the Head of Operations, as the single channel for the engagement."),
        ("Read access to the records.", "Revenue, receivables ageing and P&L, pharmacy stock data, HMO "
         "contracts, the staff roster and job descriptions, clinical incident records, and existing SOPs."),
        ("Time with the people who do the work.", "Leadership, plus the nursing, pharmacy, and "
         "customer-service leads."),
        ("Walk-through access to the facility.", "So observation reflects the real operating day."),
    ]
    bullet_block(c, items, MX, y, PAGE_W - 2 * MX - 20, gap=16, size=12.8, leading=17)


def build():
    c = canvas.Canvas(str(OUT), pagesize=landscape(A4))
    c.setTitle("Haven Paediatric Centre - Phase 1 Diagnostic Audit - Consult for Africa")
    c.setAuthor("Consult for Africa")

    slides = [slide_cover, slide_where_it_sits, slide_objective, slide_method,
              slide_areas_overview]

    # six examination deep-dives (slides 6-11)
    def s6(c):
        exam_slide(c, 6, "What we examine  /  1 of 6",
                   "Clinical governance & patient safety",
                   "What makes acute paediatric care dependable on every shift, and ready to scale?",
                   [("Incident and near-miss systems.", "The reporting and learning process that lets the "
                     "team surface and fix risks early, the marker of mature clinical governance."),
                    ("Emergency readiness.", "Crash-cart and emergency-readiness standards, and the "
                     "shift-level checks that keep them dependable."),
                    ("Clinical protocols.", "Paediatric and NICU protocols, and real adherence against them."),
                    ("NICU readiness.", "What it takes to scale admissions safely, the engagement's "
                     "highest-yield growth lever.")],
                   "Strong clinical governance is what lets a growing facility take on more complex care, "
                   "including NICU, with the team and families confident in the standard. It is the "
                   "foundation everything else builds on.",
                   insight_bg=CREAM, insight_spine=GOLD)

    def s7(c):
        exam_slide(c, 7, "What we examine  /  2 of 6",
                   "Culture, routines & incentives",
                   "Do the culture and incentives produce safe, efficient care without anyone chasing it?",
                   [("How work actually gets done.", "The real operating day versus what the documents say."),
                    ("Where routines break down.", "The nursing and operational routines that should run "
                     "every shift, and where they quietly fail."),
                    ("Whether incentives reward the right things.", "The staff commission structure and the "
                     "JDS and KPIs: do they reward quality and ownership, or only activity?"),
                    ("Accountability norms.", "Who owns what across shifts, and how that is held.")],
                   "The commission structure and JDS/KPIs already on the board's decision list are the "
                   "levers. The audit calibrates them so the culture sustains itself.",
                   insight_bg=HexColor("#EAF1F4"), insight_spine=TEAL)

    def s8(c):
        exam_slide(c, 8, "What we examine  /  3 of 6",
                   "Operations & SOP adherence",
                   "Where does the operating model leak time, money, and goodwill?",
                   [("Patient flow, end to end.", "From arrival through care to discharge and billing."),
                    ("Customer service and booking.", "The experience that drives repeat visits and referral."),
                    ("SOP adherence.", "The gap between what is documented and what actually happens."),
                    ("Bottlenecks.", "The points that cost time, margin, or patient experience.")],
                   "Thin margins on reasonable revenue point to leakage in the operating model, not to a "
                   "pricing problem. We find where it leaks.",
                   insight_bg=CREAM, insight_spine=GOLD)

    def s9(c):
        exam_slide(c, 9, "What we examine  /  4 of 6",
                   "Finance, working capital & HMO economics",
                   "Where is the cash, and how fast can we free the ~N7M that is locked up?",
                   [("Revenue mix and yield.", "Private versus HMO, and the true margin by service line."),
                    ("The real pharmacy margin.", "Separating genuine margin from the 201% figure that is a "
                     "markup, not a margin."),
                    ("~N4.2M in receivables.", "Leadway and NEM ageing and recoverability, close to a full "
                     "period's revenue."),
                    ("~N2.77M in pharmacy stock.", "How much is working capital that can be released."),
                    ("HMO contract economics.", "Terms, claims, ageing, and yield per HMO versus private.")],
                   "The cash problem is a working-capital problem, not a profit problem. The money is on "
                   "the shelf and in the HMO ledgers, and it is recoverable.",
                   insight_bg=CREAM, insight_spine=GOLD)

    def s10(c):
        exam_slide(c, 10, "What we examine  /  5 of 6",
                   "Procurement & inventory",
                   "Can inventory keep every critical item available and lift margin at once?",
                   [("Stock management.", "Reorder discipline and the controls that keep critical items "
                     "reliably in stock."),
                    ("Procurement reliability.", "Supplier terms, lead times, and single points of failure."),
                    ("Margin leakage.", "Where pharmacy margin is lost between purchase and sale."),
                    ("The case for vendor-managed inventory.", "Whether a VMI model, such as Medbury Pharma, "
                     "keeps stock dependable and lifts margin together.")],
                   "Reliable inventory does two jobs at once: critical items are always available, and "
                   "pharmacy margin lifts. A vendor-managed model delivers both.",
                   insight_bg=HexColor("#EAF1F4"), insight_spine=TEAL)

    def s11(c):
        exam_slide(c, 11, "What we examine  /  6 of 6",
                   "People, structure & reporting integrity",
                   "Is the team structured to run safely, and can the board trust its own numbers?",
                   [("Staffing and roles.", "Ratios, role clarity, and where structure creates risk or cost."),
                    ("The senior operations leader spec.", "The role defined here, so it can be recruited "
                     "into clarity afterward, sourced through CadreHealth."),
                    ("Reporting integrity.", "Whether the numbers the board sees can be trusted: visit counts "
                     "that do not reconcile, and a receivables table that does not foot."),
                    ("Single source of truth.", "What it takes to give the board a report it can act on.")],
                   "You cannot manage what you cannot measure reliably. Fixing the reporting layer is the "
                   "precondition for every other decision the board makes.",
                   insight_bg=CREAM, insight_spine=GOLD)

    slides += [s6, s7, s8, s9, s10, s11,
               slide_quick_wins, slide_deliverables, slide_timeline,
               slide_what_we_need, slide_close]

    global TOTAL
    TOTAL = str(len(slides))
    for s in slides:
        s(c)
        c.showPage()
    c.save()
    print(f"wrote {OUT}  ({len(slides)} slides)")


if __name__ == "__main__":
    build()
