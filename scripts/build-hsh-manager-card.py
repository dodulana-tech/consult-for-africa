"""
Build the HSH Manager's Card for Consult for Africa.

The one-page reference each manager and Afya operational lead keeps after
Module 10: FRONT = what escalates, to whom, and by when, plus the money ladder;
BACK = the six-section report by exception, the four standing questions, and the
dates of the September cycle.

Two panels side by side on a landscape A4, with a centre cut/fold line, so it
prints, cuts, and carries.

Source: docs/hsh-board-instruments-pack-cfa.md (instruments 5 and 10, calendar)
        docs/hsh-delegation-of-authority-cfa.md (bands and rules)
Output: docs/hsh-manager-card-cfa.pdf  (A4 landscape)

Run:
  python3 scripts/build-hsh-manager-card.py
"""
from __future__ import annotations

from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
OUT = DOCS / "hsh-manager-card-cfa.pdf"
LOGO = DOCS / "c4a-logo-reversed.png"   # white knockout for navy header

NAVY = HexColor("#0B3C5D")
DEEP_NAVY = HexColor("#081521")
GOLD = HexColor("#D4AF37")
TEAL = HexColor("#1F7A8C")
BODY = HexColor("#1F2937")
MUTED = HexColor("#6B7280")
SURFACE = HexColor("#F1F5F9")
CREAM = HexColor("#FBF6E6")
LIGHT = HexColor("#C9D6E0")

PAGE_W, PAGE_H = landscape(A4)   # 842 x 595


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


def panel(c, ox, oy, w, h):
    """Draw the card background/border for a panel with its origin at (ox, oy)."""
    c.setFillColor(white)
    c.roundRect(ox, oy, w, h, 10, fill=1, stroke=0)
    c.setStrokeColor(HexColor("#E5E7EB"))
    c.setLineWidth(0.6)
    c.roundRect(ox, oy, w, h, 10, fill=0, stroke=1)


def header(c, ox, oy, w, h, kicker, title):
    band = 62
    c.setFillColor(NAVY)
    c.roundRect(ox, oy + h - band, w, band, 10, fill=1, stroke=0)
    c.setFillColor(NAVY)
    c.rect(ox, oy + h - band, w, band - 10, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(ox, oy + h - band - 3, w, 3, fill=1, stroke=0)
    # logo
    try:
        img = ImageReader(str(LOGO))
        iw, ih = img.getSize()
        dw = 96
        dh = dw * ih / iw
        c.drawImage(img, ox + 18, oy + h - 30 - dh / 2, width=dw, height=dh, mask="auto", preserveAspectRatio=True)
    except Exception:
        pass
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 7)
    c.drawRightString(ox + w - 18, oy + h - 22, kicker.upper())
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 13)
    c.drawRightString(ox + w - 18, oy + h - 40, title)


def bullet_block(c, ox, y, w, items, pad=18, gap=6, dot=GOLD):
    for lead, rest in items:
        # gold dot
        c.setFillColor(dot)
        c.circle(ox + pad + 2, y + 3.4, 2.2, fill=1, stroke=0)
        # lead (bold navy) then rest (body)
        c.setFont("Helvetica-Bold", 9)
        c.setFillColor(NAVY)
        lead_w = c.stringWidth(lead + " ", "Helvetica-Bold", 9)
        c.drawString(ox + pad + 12, y, lead)
        # wrap the remainder after the lead on the first line
        max_w = w - pad - 12 - (pad - 6)
        first_avail = max_w - lead_w
        words = rest.split()
        line1, i = "", 0
        for i, wd in enumerate(words):
            t = (line1 + " " + wd).strip()
            if c.stringWidth(t, "Helvetica", 9) <= first_avail:
                line1 = t
            else:
                break
        else:
            i = len(words)
        c.setFont("Helvetica", 9)
        c.setFillColor(BODY)
        c.drawString(ox + pad + 12 + lead_w, y, line1)
        y -= 12.5
        rem = " ".join(words[i:]) if line1 else rest
        if line1 and i < len(words):
            for ln in wrap(c, rem, "Helvetica", 9, max_w):
                c.drawString(ox + pad + 12, y, ln)
                y -= 12.5
        y -= gap
    return y




def rule_row(c, ox, y, w, left, right, pad=18, size=8.6):
    """A two-column line: trigger on the left, timeframe bold on the right."""
    c.setFont("Helvetica-Bold", size)
    c.setFillColor(NAVY)
    rw = c.stringWidth(right, "Helvetica-Bold", size)
    c.drawRightString(ox + w - pad, y, right)
    c.setFont("Helvetica", size)
    c.setFillColor(BODY)
    avail = w - 2 * pad - rw - 24
    lines = wrap(c, left, "Helvetica", size, avail)
    c.setFillColor(GOLD)
    c.circle(ox + pad + 2, y + 3.2, 2.0, fill=1, stroke=0)
    for i, ln in enumerate(lines):
        c.setFont("Helvetica", size)
        c.setFillColor(BODY)
        c.drawString(ox + pad + 12, y, ln)
        y -= 11
    return y - 3.5


def build():
    c = canvas.Canvas(str(OUT), pagesize=landscape(A4))
    c.setTitle("HSH Manager's Card, reporting and escalation - Consult for Africa")
    c.setAuthor("Consult for Africa")

    c.setFillColor(SURFACE)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)

    margin = 30
    gutter = 26
    pw = (PAGE_W - 2 * margin - gutter) / 2
    ph = PAGE_H - 2 * margin
    left_x = margin
    right_x = margin + pw + gutter
    oy = margin

    c.setStrokeColor(HexColor("#C9D6E0"))
    c.setDash(3, 3)
    c.setLineWidth(0.5)
    c.line(margin + pw + gutter / 2, oy + 6, margin + pw + gutter / 2, oy + ph - 6)
    c.setDash()

    # ── FRONT PANEL: escalation and authority ───────────────────────────
    panel(c, left_x, oy, pw, ph)
    header(c, left_x, oy, pw, ph, "Havana Specialist Hospital", "What Escalates, and Who Decides")
    y = oy + ph - 82

    c.setFillColor(TEAL)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(left_x + 18, y, "GOES UP IMMEDIATELY, WITHOUT WAITING FOR A MEETING")
    y -= 17
    triggers = [
        ("Never event, or a death in unexpected circumstances. Chair and Quality chair, then all directors", "Same day"),
        ("Serious clinical incident, or a cluster. Medical Director to the Quality chair", "24 hours"),
        ("Regulatory inspection, notice, sanction, or licence issue. Chair and Audit chair", "24 hours"),
        ("Data or information security breach. Chair, Transformation and Audit chairs, data protection lead", "24 hours"),
        ("Cash below the set days of operating cost. Chair and Finance co-chairs", "Immediate"),
        ("Budget variance beyond the set threshold. Finance co-chairs", "Next cycle"),
        ("Departure or suspension of a senior clinician or executive. Chair and RemCo chair", "Same day"),
        ("Loss of a significant HMO or corporate contract. Chair and Finance co-chairs", "48 hours"),
        ("Litigation or a claim above the set threshold. Chair and Audit chair", "48 hours"),
        ("Any risk newly rated 15 or above. Audit chair, then the board", "That week"),
        ("Any proposed change to the Afya agreement. The board, as a reserved matter", "Before agreeing"),
    ]
    for left, right in triggers:
        y = rule_row(c, left_x, y, pw, left, right)

    y -= 6
    c.setFillColor(TEAL)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(left_x + 18, y, "THE MONEY LADDER, ONCE THE BOARD SETS THE BANDS")
    y -= 17
    bands = [
        ("Band 1", "up to N2m per item, inside approved budget. You decide."),
        ("Band 2", "N2m to N10m. The Afya-HSH Governance Committee decides."),
        ("Band 3", "N10m to N50m. The board decides."),
        ("Band 4", "above N50m, or any reserved matter. The board, and the owners where marked."),
    ]
    y = bullet_block(c, left_x, y, pw, bands, gap=2)

    box_h = 62
    c.setFillColor(CREAM)
    c.roundRect(left_x + 16, oy + 18, pw - 32, box_h, 6, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(left_x + 16, oy + 18, 4, box_h, fill=1, stroke=0)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(left_x + 30, oy + 18 + box_h - 16, "Escalating is never penalised.")
    para(c, "A threshold crossed and escalated is the system working. A threshold crossed and not "
            "escalated is the only version of this that is a disciplinary matter. Outside budget or "
            "outside policy escalates whatever the amount. When in doubt, escalate.",
         left_x + 30, oy + 18 + box_h - 30, "Helvetica", 8.3, BODY, pw - 60, 10.5)

    # ── BACK PANEL: the report, the questions, the dates ────────────────
    panel(c, right_x, oy, pw, ph)
    header(c, right_x, oy, pw, ph, "Manager's Card", "Reporting to the Board")
    y = oy + ph - 82

    c.setFillColor(TEAL)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(right_x + 18, y, "THE REPORT BY EXCEPTION, THREE PAGES, SIX SECTIONS")
    y -= 17
    secs = [
        ("1  Three things the board should know.", "At least one should be uncomfortable."),
        ("2  Performance against plan.", "Narrate only what is off plan, with the four questions answered."),
        ("3  What went well, briefly.", "Two or three."),
        ("4  What is coming.", "Next quarter, and what could knock it off course."),
        ("5  Where we need the board.", "Decisions requested, steers wanted, where you are blocked."),
        ("6  Declared escalations since the last meeting.", "Nil returns are stated as nil."),
    ]
    y = bullet_block(c, right_x, y, pw, secs, gap=3)

    y -= 4
    c.setFillColor(TEAL)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(right_x + 18, y, "THE FOUR STANDING QUESTIONS, ANSWERED BEFORE THEY ARE ASKED")
    y -= 17
    qs = [
        ("Why is it different from plan?", "The cause, not the category."),
        ("Is it one-off, or a trend?", "Show the prior period and the direction of travel."),
        ("What is being done, by whom, by when?", "A named owner and a date, or it is a hope."),
        ("What would make it worse?", "The honest downside, stated by you first."),
    ]
    y = bullet_block(c, right_x, y, pw, qs, gap=2)

    y -= 4
    c.setFillColor(TEAL)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(right_x + 18, y, "THE SEPTEMBER CYCLE, AND EVERY CYCLE AFTER IT")
    y -= 17
    dates = [
        ("Tue 1 Sep", "Afya-HSH Governance Committee. Monthly report and KPI pack."),
        ("Tue 8 to Tue 15 Sep", "Committee week. Papers in five working days ahead."),
        ("Mon 14 Sep", "Management report by exception to the Company Secretary."),
        ("Thu 17 Sep", "Board pack circulated. Nothing is added after this date."),
        ("Thu 24 Sep", "Board meeting. The suite is adopted and the thresholds are set."),
    ]
    y = bullet_block(c, right_x, y, pw, dates, gap=2)

    box_h = 48
    c.setFillColor(CREAM)
    c.roundRect(right_x + 16, oy + 18, pw - 32, box_h, 6, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(right_x + 16, oy + 18, 4, box_h, fill=1, stroke=0)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(right_x + 30, oy + 18 + box_h - 16, "No paper, no board item.")
    para(c, "Nothing reaches the board except through an instrument in the pack. Never take an "
            "instruction from a single director: route it through the Chair or the Company Secretary.",
         right_x + 30, oy + 18 + box_h - 30, "Helvetica", 8.3, BODY, pw - 60, 10.5)

    c.showPage()
    c.save()
    print("Wrote %s" % OUT)


if __name__ == "__main__":
    build()
