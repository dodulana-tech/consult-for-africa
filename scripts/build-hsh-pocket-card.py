"""
Build the HSH Director's Duties & Conflicts pocket card for Consult for Africa.

A one-page, two-panel reference each director keeps: FRONT = your duties and the
board hat; BACK = conflicts, the four standing questions, who-decides, and fair
process. Two A6-ish panels laid out side by side on a landscape A4, with a
centre cut/fold line, so it prints, cuts, and carries.

Output: docs/hsh-duties-conflicts-card-cfa.pdf  (A4 landscape)

Run:
  python3 scripts/build-hsh-pocket-card.py
"""

from __future__ import annotations

from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
OUT = DOCS / "hsh-duties-conflicts-card-cfa.pdf"
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


def build():
    c = canvas.Canvas(str(OUT), pagesize=landscape(A4))
    c.setTitle("HSH Director's Duties & Conflicts Card - Consult for Africa")
    c.setAuthor("Consult for Africa")

    # page background
    c.setFillColor(SURFACE)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)

    margin = 30
    gutter = 26
    pw = (PAGE_W - 2 * margin - gutter) / 2
    ph = PAGE_H - 2 * margin
    left_x = margin
    right_x = margin + pw + gutter
    oy = margin

    # centre cut/fold guide
    c.setStrokeColor(HexColor("#C9D6E0"))
    c.setDash(3, 3)
    c.setLineWidth(0.5)
    c.line(margin + pw + gutter / 2, oy + 6, margin + pw + gutter / 2, oy + ph - 6)
    c.setDash()

    # ── FRONT PANEL: your duties ────────────────────────────────────────
    panel(c, left_x, oy, pw, ph)
    header(c, left_x, oy, pw, ph, "Havana Specialist Hospital", "Your Duties as a Director")
    y = oy + ph - 82
    c.setFillColor(TEAL)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(left_x + 18, y, "UNDER CAMA 2020, EVERY DIRECTOR MUST:")
    y -= 18
    duties = [
        ("Act in good faith", "in the best interests of the company as a whole, not one family, one department, or yourself."),
        ("Use power for a proper purpose", "the reason it was given, not for advantage."),
        ("Exercise care, skill & diligence", "prepare, attend, pay attention, apply your judgement."),
        ("Avoid conflicts of interest", "and where one arises, declare and step out (see back)."),
        ("Make no secret profit", "and accept no improper benefit from the office."),
        ("Have regard to wider interests", "including the workforce and the community you serve."),
    ]
    y = bullet_block(c, left_x, y, pw, duties)

    # the board hat callout
    box_h = 52
    c.setFillColor(CREAM)
    c.roundRect(left_x + 16, oy + 20, pw - 32, box_h, 6, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(left_x + 16, oy + 20, 4, box_h, fill=1, stroke=0)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(left_x + 30, oy + 20 + box_h - 16, "In the boardroom, wear the board hat.")
    para(c, "You may be an owner outside the room; inside it you are a steward of the whole "
            "institution. Govern, do not reach into management.",
         left_x + 30, oy + 20 + box_h - 30, "Helvetica", 8.3, BODY, pw - 60, 10.5)

    # ── BACK PANEL: conflicts, questions, who decides ───────────────────
    panel(c, right_x, oy, pw, ph)
    header(c, right_x, oy, pw, ph, "Duties & Conflicts Card", "Conflicts & Good Questions")
    y = oy + ph - 82

    c.setFillColor(TEAL)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(right_x + 18, y, "IF A MATTER TOUCHES YOU OR YOUR FAMILY:")
    y -= 18
    conflicts = [
        ("Declare it", "at the start of the discussion."),
        ("Step out", "recuse; leave the room for that decision if the interest is material."),
        ("Record it", "the Company Secretary notes it in the minutes and the register."),
    ]
    y = bullet_block(c, right_x, y, pw, conflicts)
    y -= 2

    c.setFillColor(TEAL)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(right_x + 18, y, "FOUR QUESTIONS YOU CAN ALWAYS ASK:")
    y -= 16
    questions = [
        "Why is this different from what we planned?",
        "Is this a one-off, or a trend?",
        "What is being done about it?",
        "What would have to be true for this to get worse?",
    ]
    c.setFont("Helvetica", 9)
    for q in questions:
        c.setFillColor(GOLD)
        c.circle(right_x + 20, y + 3.4, 2.2, fill=1, stroke=0)
        c.setFillColor(BODY)
        c.drawString(right_x + 30, y, q)
        y -= 14
    y -= 6

    # who decides + fair process, two mini-bands
    c.setFillColor(SURFACE)
    c.roundRect(right_x + 16, y - 30, pw - 32, 34, 5, fill=1, stroke=0)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(right_x + 26, y - 8, "Who decides? ")
    c.setFillColor(BODY)
    c.setFont("Helvetica", 8.5)
    c.drawString(right_x + 26 + c.stringWidth("Who decides? ", "Helvetica-Bold", 8.5), y - 8,
                 "Check the Delegation of Authority.")
    para(c, "Reserved matters are the board's. Confidential: what is said in the boardroom stays there.",
         right_x + 26, y - 20, "Helvetica", 8.3, MUTED, pw - 52, 10)
    y -= 44

    # fair process footer band
    fp_h = 46
    c.setFillColor(NAVY)
    c.roundRect(right_x + 16, oy + 20, pw - 32, fp_h, 6, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(right_x + 30, oy + 20 + fp_h - 15, "FAIR PROCESS")
    c.setFillColor(white)
    c.setFont("Helvetica", 8.4)
    c.drawString(right_x + 30, oy + 20 + fp_h - 29,
                 "Everyone heard  ·  reasons explained  ·  decide for the company")
    c.drawString(right_x + 30, oy + 20 + fp_h - 40,
                 "·  once decided, support it.")

    # footer strip under both
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 6.8)
    c.drawCentredString(PAGE_W / 2, 16,
                        "Consult for Africa  /  Confidential  /  A quick reference, not a substitute for the Handbook or formal legal advice.")

    c.showPage()
    c.save()
    print(f"wrote {OUT}")


if __name__ == "__main__":
    build()
