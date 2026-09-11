"""
Build print-ready A4 QR posters to drive Haven survey completion:
  1. Patient experience  -> docs/haven-patient-survey-poster-cfa.pdf  (waiting room)
  2. Staff safety culture -> docs/haven-staff-survey-poster-cfa.pdf    (staff room)

Uses the existing QR codes in docs/. CFA house style. No em dashes.

Run:
  python3 scripts/build-haven-survey-posters.py
"""

from __future__ import annotations

from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"

NAVY = HexColor("#0B3C5D")
DEEP_NAVY = HexColor("#081521")
GOLD = HexColor("#D4AF37")
MUTED = HexColor("#6B7280")
LIGHT = HexColor("#C9D6E0")
BODY = HexColor("#1F2937")

PAGE_W, PAGE_H = A4


def poster(out_name, eyebrow, headline_lines, subline, qr_file, footlines, scan_prompt):
    c = canvas.Canvas(str(DOCS / out_name), pagesize=A4)
    # header band
    c.setFillColor(NAVY); c.rect(0, PAGE_H - 150, PAGE_W, 150, fill=1, stroke=0)
    c.setFillColor(GOLD); c.rect(0, PAGE_H - 156, PAGE_W, 6, fill=1, stroke=0)
    c.setFillColor(GOLD); c.setFont("Helvetica-Bold", 13)
    c.drawCentredString(PAGE_W / 2, PAGE_H - 70, eyebrow)
    c.setFillColor(white); c.setFont("Helvetica-Bold", 30)
    c.drawCentredString(PAGE_W / 2, PAGE_H - 112, headline_lines[0])
    if len(headline_lines) > 1:
        c.setFont("Helvetica-Bold", 30)
        c.drawCentredString(PAGE_W / 2, PAGE_H - 145, headline_lines[1])

    # subline
    c.setFillColor(NAVY); c.setFont("Helvetica-Bold", 16)
    y = PAGE_H - 210
    for ln in subline:
        c.drawCentredString(PAGE_W / 2, y, ln); y -= 24

    # QR
    qr = ImageReader(str(DOCS / qr_file))
    size = 300
    qx = (PAGE_W - size) / 2
    qy = PAGE_H - 210 - 40 - size
    # gold frame
    c.setStrokeColor(GOLD); c.setLineWidth(2)
    c.rect(qx - 14, qy - 14, size + 28, size + 28, fill=0, stroke=1)
    c.drawImage(qr, qx, qy, width=size, height=size, mask="auto")

    # scan prompt
    c.setFillColor(NAVY); c.setFont("Helvetica-Bold", 18)
    c.drawCentredString(PAGE_W / 2, qy - 44, scan_prompt)
    c.setFillColor(MUTED); c.setFont("Helvetica", 13)
    c.drawCentredString(PAGE_W / 2, qy - 66, "Point your phone camera at the code, then tap the link.")

    # foot message
    yy = qy - 110
    c.setFillColor(BODY); c.setFont("Helvetica-Oblique", 13)
    for ln in footlines:
        c.drawCentredString(PAGE_W / 2, yy, ln); yy -= 20

    # bottom credit
    c.setFillColor(GOLD); c.rect(PAGE_W / 2 - 30, 66, 60, 3, fill=1, stroke=0)
    c.setFillColor(MUTED); c.setFont("Helvetica", 10)
    c.drawCentredString(PAGE_W / 2, 48, "Run by Consult for Africa on behalf of Haven Paediatric Centre")
    c.drawCentredString(PAGE_W / 2, 34, "consultforafrica.com")
    c.showPage(); c.save()
    print(f"wrote {DOCS / out_name}")


poster(
    "haven-patient-survey-poster-cfa.pdf",
    "HAVEN PAEDIATRIC CENTRE",
    ["How was your visit?"],
    ["Tell us how we cared for your child.",
     "Anonymous  ·  about 5 minutes"],
    "haven-patient-survey-qr.png",
    ["We do not ask your name. Please be honest,",
     "it is how we make Haven better and safer for every family."],
    "Scan to share your experience",
)

poster(
    "haven-staff-survey-poster-cfa.pdf",
    "HAVEN PAEDIATRIC CENTRE  ·  FOR STAFF",
    ["Your voice matters."],
    ["Anonymous staff safety survey.",
     "About 10 minutes  ·  it goes to Consult for Africa, not management"],
    "haven-staff-survey-qr.png",
    ["Honesty is the whole point. It is how we make Haven",
     "safer for patients and fairer to work in. There are no right answers."],
    "Scan to take the survey",
)
