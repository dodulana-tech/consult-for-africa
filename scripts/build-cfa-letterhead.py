"""
Build a blank Consult for Africa letterhead (A4, empty body) for day-to-day use.

Matches the refined house style of docs/healthstack-cover-letter.html:
logo top-left on white, thin gold accent, hairline rules, minimal footer.
No body content.

Output: docs/cfa-letterhead-blank-cfa.pdf

Run:
  python3 scripts/build-cfa-letterhead.py
"""

from __future__ import annotations

from pathlib import Path

from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
OUT = DOCS / "cfa-letterhead-blank-cfa.pdf"

# ---- brand palette (source: docs/brand-guide-cfa.pdf) ----
NAVY = HexColor("#0B3C5D")
GOLD = HexColor("#D4AF37")
HAIR = HexColor("#E8EBF0")   # hairline rule
MUTED = HexColor("#888888")

PAGE_W, PAGE_H = A4
# @page margin equivalent from the HTML: 22mm top/bottom, 18mm sides
MX = 18 * 2.83465
MY = 22 * 2.83465


def draw(c: canvas.Canvas) -> None:
    # ---- letterhead: logo top-left ----
    logo = ImageReader(str(DOCS / "c4a-logo.png"))
    lw, lh = logo.getSize()
    h = 34.0
    w = h * lw / lh
    logo_top = PAGE_H - MY
    c.drawImage(logo, MX, logo_top - h, width=w, height=h, mask="auto")

    # gold accent: full-width line under the logo, closing the letterhead band
    rule_y = logo_top - h - 14
    c.setFillColor(GOLD)
    c.rect(MX, rule_y, PAGE_W - 2 * MX, 2, fill=1, stroke=0)

    # ---- footer: hairline rule + contact line ----
    fy = MY + 4
    c.setStrokeColor(HAIR)
    c.line(MX, fy, PAGE_W - MX, fy)
    c.setFillColor(NAVY)
    c.setFont("Helvetica", 7.5)
    c.drawString(
        MX, fy - 13,
        "CONSULT FOR AFRICA",
    )
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 7.5)
    c.drawString(
        MX + 108, fy - 13,
        "hello@consultforafrica.com   /   +234 913 813 8553   /   consultforafrica.com",
    )
    c.drawRightString(PAGE_W - MX, fy - 13, "Lagos and Abuja, Nigeria")


def build() -> None:
    c = canvas.Canvas(str(OUT), pagesize=A4)
    c.setTitle("Consult for Africa - Letterhead")
    c.setAuthor("Consult for Africa")
    draw(c)
    c.showPage()
    c.save()
    print(f"wrote {OUT}")


if __name__ == "__main__":
    build()
