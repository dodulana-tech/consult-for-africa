"""
Build the Afrihealth Magazine full-page advert for Consult For Africa.

Output:
  docs/afrihealth-advert-cfa.pdf   (A4, print-ready, RGB)

Run:
  python3 scripts/build-afrihealth-advert.py
"""

from __future__ import annotations

from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas as canvaslib


ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
PUBLIC = ROOT / "public"

PAGE_W, PAGE_H = A4  # 595.28 x 841.89 pt
MARGIN = 42

# ---- brand palette (source: docs/brand-guide-cfa.pdf) ----------------------
NAVY = HexColor("#0B3C5D")
DEEP_NAVY = HexColor("#081521")
GOLD = HexColor("#D4AF37")
TEAL = HexColor("#1F7A8C")
BODY = HexColor("#1F2937")
MUTED = HexColor("#6B7280")
SURFACE = HexColor("#F1F5F9")
LIGHT = HexColor("#C9D6E0")  # light navy tint for text on navy


def wrap(c, text, font, size, max_w):
    c.setFont(font, size)
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


def para(c, x, y, text, font, size, color, max_w, leading):
    c.setFillColor(color)
    for ln in wrap(c, text, font, size, max_w):
        c.setFont(font, size)
        c.drawString(x, y, ln)
        y -= leading
    return y


def build():
    out = DOCS / "afrihealth-advert-cfa.pdf"
    c = canvaslib.Canvas(str(out), pagesize=A4)
    c.setTitle("Consult For Africa - Afrihealth Magazine Advert")

    content_w = PAGE_W - 2 * MARGIN

    # ---- white page base ----
    c.setFillColor(white)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)

    # ============================================================
    # HERO BAND (navy, full bleed top)
    # ============================================================
    hero_h = 300
    hero_y = PAGE_H - hero_h
    c.setFillColor(NAVY)
    c.rect(0, hero_y, PAGE_W, hero_h, fill=1, stroke=0)
    # subtle deep-navy floor for depth
    c.setFillColor(DEEP_NAVY)
    c.rect(0, hero_y, PAGE_W, 6, fill=1, stroke=0)

    x = MARGIN
    y = PAGE_H - 52

    # eyebrow: gold tick + wordmark
    c.setFillColor(GOLD)
    c.rect(x, y + 10, 34, 3, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(GOLD)
    c.drawString(x + 44, y + 8, "CONSULT FOR AFRICA")
    c.setFillColor(LIGHT)
    c.setFont("Helvetica", 9)
    c.drawString(x + 44 + c.stringWidth("CONSULT FOR AFRICA", "Helvetica-Bold", 9) + 10,
                 y + 8, "/  HEALTHCARE TRANSFORMATION")

    # hero headline
    y -= 40
    headline = "The people, the leadership, and the systems African healthcare runs on."
    c.setFillColor(white)
    for ln in wrap(c, headline, "Helvetica-Bold", 27, content_w - 70):
        c.setFont("Helvetica-Bold", 27)
        c.drawString(x, y, ln)
        y -= 32

    # one-line punch in gold
    y -= 6
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(x, y, "In one partner.")

    # gold rule
    y -= 22
    c.setFillColor(GOLD)
    c.rect(x, y, 60, 2.5, fill=1, stroke=0)

    # brand promise
    y -= 24
    promise = ("We help hospitals, health systems, investors, and governments turn "
               "ambition into delivery. We do not hand you a report and walk away. "
               "We build, staff, and stand behind the outcome.")
    para(c, x, y, promise, "Helvetica", 11, LIGHT, content_w - 40, 16)

    # ============================================================
    # BRAND SELL (white)
    # ============================================================
    y = hero_y - 36
    sell = ("The gap between a struggling hospital and a thriving one is rarely the "
            "building or the equipment. It is execution. It is leadership. It is people. "
            "Consult For Africa exists to close that gap, and around that work we have built "
            "three things African healthcare has long been missing.")
    y = para(c, x, y, sell, "Helvetica", 11, BODY, content_w, 16)

    # ============================================================
    # THREE PILLARS (cards)
    # ============================================================
    y -= 14
    gap = 16
    card_w = (content_w - 2 * gap) / 3
    card_h = 150
    card_y = y - card_h

    pillars = [
        ("MAAROVA",
         "Leadership assessment and coaching for healthcare's decision-makers.",
         "Identify, measure, and grow the clinical and executive leaders you depend on. "
         "Stronger leaders, steadier institutions.",
         "consultforafrica.com/maarova"),
        ("CADREHEALTH",
         "The workforce platform connecting your facility to the talent it needs.",
         "Verified doctors, nurses, and specialists, including diaspora professionals. "
         "Permanent, locum, or fractional.",
         "consultforafrica.com/oncadre"),
        ("COOKEDINDOORS",
         "Medical nutrition and catering, because recovery happens on the plate too.",
         "Clinically informed, condition-specific meal programmes for patients, "
         "facilities, and care teams.",
         "cookedindoors.com"),
    ]

    for i, (name, lede, desc, link) in enumerate(pillars):
        cx = x + i * (card_w + gap)
        # card surface
        c.setFillColor(SURFACE)
        c.rect(cx, card_y, card_w, card_h, fill=1, stroke=0)
        # gold top edge
        c.setFillColor(GOLD)
        c.rect(cx, card_y + card_h - 4, card_w, 4, fill=1, stroke=0)

        pad = 12
        ty = card_y + card_h - 4 - 20
        c.setFillColor(NAVY)
        c.setFont("Helvetica-Bold", 12.5)
        c.drawString(cx + pad, ty, name)
        ty -= 17
        ty = para(c, cx + pad, ty, lede, "Helvetica-Bold", 8.6, BODY, card_w - 2 * pad, 11) - 4
        ty = para(c, cx + pad, ty, desc, "Helvetica", 8.2, MUTED, card_w - 2 * pad, 11)
        # link pinned near bottom
        c.setFillColor(TEAL)
        c.setFont("Helvetica-Bold", 9)
        c.drawString(cx + pad, card_y + 12, link)

    # ============================================================
    # PROOF BAND (navy strip)
    # ============================================================
    band_h = 66
    band_y = card_y - 18 - band_h
    c.setFillColor(NAVY)
    c.rect(0, band_y, PAGE_W, band_h, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(MARGIN, band_y, 4, band_h, fill=1, stroke=0)

    px = MARGIN + 18
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(px, band_y + band_h - 24, "Trusted to run, not just advise.")
    proof = ("Consult For Africa is the management partner for Pastor Dr. Tony Rapu's "
             "21-bed drug and addiction rehabilitation centre in Lekki, Lagos.")
    para(c, px, band_y + band_h - 40, proof, "Helvetica", 9.5, LIGHT, content_w - 30, 13)

    # ============================================================
    # CALL TO ACTION (bottom)
    # ============================================================
    cta_top = band_y - 26
    c.setFillColor(BODY)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(x, cta_top, "Whatever you are trying to build, start the conversation today.")
    yy = cta_top - 18
    cta_sub = ("Leadership, workforce, operations, or nutrition. One partner, the full "
               "picture. Executive response within 48 hours.")
    yy = para(c, x, yy, cta_sub, "Helvetica", 10.5, MUTED, content_w, 14) - 8

    # contact rows
    def contact_row(yc, label, value, value_bold=True):
        c.setFillColor(GOLD)
        c.setFont("Helvetica-Bold", 9)
        c.drawString(x, yc, label)
        c.setFillColor(BODY)
        c.setFont("Helvetica-Bold" if value_bold else "Helvetica", 10.5)
        c.drawString(x + 92, yc, value)

    contact_row(yy, "ENQUIRE", "hello@consultforafrica.com   /   partnerships@consultforafrica.com")
    yy -= 18
    contact_row(yy, "CALL / WHATSAPP", "+234 913 813 8553")
    yy -= 18
    contact_row(yy, "WEB", "consultforafrica.com")
    yy -= 18
    contact_row(yy, "OFFICES", "Lagos and Abuja, Nigeria   /   Pan-African operations, global partnerships")

    # follow line
    yy -= 22
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8.5)
    c.drawString(x, yy, "LinkedIn: Consult For Africa     X: @consultforafrica     Instagram: @consultforafrica")

    # footer hairline + founded mark
    c.setFillColor(GOLD)
    c.rect(x, MARGIN - 4, 28, 2, fill=1, stroke=0)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8)
    c.drawRightString(PAGE_W - MARGIN, MARGIN - 2, "Founded 2024   /   Healthcare performance, restored.")

    c.showPage()
    c.save()
    print(f"wrote {out}")


if __name__ == "__main__":
    build()
