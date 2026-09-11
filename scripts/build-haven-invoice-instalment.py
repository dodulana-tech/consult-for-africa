"""
Build the Haven Paediatric Centre INSTALMENT invoice PDF for Consult for Africa.

Instalment 1 of 3 (N2,500,000) against the agreed N9,300,000 engagement
(original invoice CFA-HAV-2026-001). Does NOT create a second engagement
invoice; it requests the monthly instalment now due, so no double-counting.

Output: docs/haven-invoice-instalment-1-cfa.pdf  (A4 portrait, branded)
Run:    python3 scripts/build-haven-invoice-instalment.py
"""

from __future__ import annotations

from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
OUT = DOCS / "haven-invoice-instalment-1-cfa.pdf"
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
GREEN = HexColor("#15803D")
GREEN_BG = HexColor("#E7F4EC")

PAGE_W, PAGE_H = A4
MX = 46

INV_NO = "CFA-HAV-2026-002"
INV_DATE = "6 September 2026"
REF = "Against engagement invoice CFA-HAV-2026-001"
FROM_NAME = "Consult for Africa Management Services Limited"
BILL_TO = [
    "Haven Paediatric Centre",
    "Attn: Kabir Aregbesola",
    "GRA Ikeja, Lagos, Nigeria",
    "kabir@aurorahills.co  /  cc usman.g@aurorahills.co",
]
# (num, name, due/status, amount, state)  state in {"paid","due","upcoming"}
SCHEDULE = [
    ("1", "Mobilisation:  Diagnostic Audit", "Paid 7 July 2026", "N1,800,000", "paid"),
    ("2", "Instalment 1 of 3", "Due 25 August 2026", "N2,500,000", "due"),
    ("3", "Instalment 2 of 3", "Due 23 September 2026", "N2,500,000", "upcoming"),
    ("4", "Instalment 3 of 3", "Due 22 October 2026", "N2,500,000", "upcoming"),
]
DUE_NOW = "N2,500,000"
ENG_TOTAL = "N9,300,000"
PAID_TO_DATE = "N1,800,000"
BAL_AFTER = "N5,000,000"
BANK = [
    ("Bank", "Zenith Bank"),
    ("Account name", "Consult for Africa Management Services Limited"),
    ("Account number", "1312352157"),
    ("Payment reference", INV_NO),
]


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


def build():
    c = canvas.Canvas(str(OUT), pagesize=A4)
    c.setTitle(f"Consult for Africa - Invoice {INV_NO} - Haven Paediatric Centre")
    c.setAuthor(FROM_NAME)

    # header band
    c.setFillColor(NAVY)
    c.rect(0, PAGE_H - 118, PAGE_W, 118, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(0, PAGE_H - 122, PAGE_W, 4, fill=1, stroke=0)
    try:
        img = ImageReader(str(LOGO))
        iw, ih = img.getSize()
        dw = 150
        dh = dw * ih / iw
        c.drawImage(img, MX, PAGE_H - 64 - dh / 2, width=dw, height=dh, mask="auto", preserveAspectRatio=True)
    except Exception:
        c.setFillColor(GOLD)
        c.setFont("Helvetica-Bold", 13)
        c.drawString(MX, PAGE_H - 60, "CONSULT FOR AFRICA")
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 30)
    c.drawRightString(PAGE_W - MX, PAGE_H - 52, "INVOICE")
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 9.5)
    c.drawRightString(PAGE_W - MX, PAGE_H - 68, "Instalment 1 of 3")
    c.setFillColor(LIGHT)
    c.setFont("Helvetica", 9.5)
    c.drawRightString(PAGE_W - MX, PAGE_H - 84, f"No. {INV_NO}")
    c.drawRightString(PAGE_W - MX, PAGE_H - 98, f"Date: {INV_DATE}")
    c.drawRightString(PAGE_W - MX, PAGE_H - 110, "Currency: NGN")

    y = PAGE_H - 150

    # From / Bill to
    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(TEAL)
    c.drawString(MX, y, "FROM")
    c.drawString(PAGE_W / 2 + 6, y, "BILL TO")
    y -= 15
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(NAVY)
    c.drawString(MX, y, FROM_NAME)
    c.setFont("Helvetica", 9.5)
    c.setFillColor(BODY)
    for i, line in enumerate(["Healthcare transformation partner",
                              "Lagos and Abuja, Nigeria",
                              "hello@consultforafrica.com",
                              "+234 913 813 8553"]):
        c.drawString(MX, y - 14 - i * 13, line)
    bx = PAGE_W / 2 + 6
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(NAVY)
    c.drawString(bx, y, BILL_TO[0])
    c.setFont("Helvetica", 9.5)
    c.setFillColor(BODY)
    for i, line in enumerate(BILL_TO[1:]):
        c.drawString(bx, y - 14 - i * 13, line)

    y -= 14 + 4 * 13 + 20

    # engagement description
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 11.5)
    c.drawString(MX, y, "Operational Turnaround, Culture & Growth  /  board-led engagement")
    y -= 14
    y = para(c, REF + ".  This invoice requests the monthly instalment now due; it does not add to the agreed fee.",
             MX, y, "Helvetica-Oblique", 9, MUTED, PAGE_W - 2 * MX, 12)
    y -= 10

    # this-invoice line item
    col_amt = PAGE_W - MX
    c.setFillColor(NAVY)
    c.rect(MX, y - 18, PAGE_W - 2 * MX, 18, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(MX, y - 18, PAGE_W - 2 * MX, 2, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 9.5)
    c.drawString(MX + 10, y - 13, "This invoice")
    c.drawRightString(col_amt - 10, y - 13, "Amount")
    y -= 18
    c.setFillColor(CREAM)
    c.rect(MX, y - 40, PAGE_W - 2 * MX, 40, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(MX, y - 40, 3, 40, fill=1, stroke=0)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 10.5)
    c.drawString(MX + 12, y - 16, "Monthly instalment 1 of 3")
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8.5)
    c.drawString(MX + 12, y - 30, "Culture and clinical standards, process and operations, and revenue and growth work now under way.")
    c.setFillColor(BODY)
    c.setFont("Helvetica-Bold", 11)
    c.drawRightString(col_amt - 12, y - 22, "N2,500,000")
    y -= 40 + 22

    # schedule / status
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 11.5)
    c.drawString(MX, y, "Where this sits in the agreed schedule")
    y -= 16
    cw0, cw2, cw3 = 24, 170, 110
    c.setFillColor(NAVY)
    c.rect(MX, y - 17, PAGE_W - 2 * MX, 17, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(MX, y - 17, PAGE_W - 2 * MX, 2, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(MX + 8, y - 12, "#")
    c.drawString(MX + cw0 + 8, y - 12, "Payment")
    c.drawString(PAGE_W - MX - cw2 - cw3, y - 12, "Status")
    c.drawRightString(PAGE_W - MX - 10, y - 12, "Amount")
    y -= 17
    for num, name, due, amt, state in SCHEDULE:
        rh = 18
        bg = GREEN_BG if state == "paid" else (CREAM if state == "due" else (white))
        c.setFillColor(bg)
        c.rect(MX, y - rh, PAGE_W - 2 * MX, rh, fill=1, stroke=0)
        spine = GREEN if state == "paid" else (GOLD if state == "due" else None)
        if spine:
            c.setFillColor(spine)
            c.rect(MX, y - rh, 3, rh, fill=1, stroke=0)
        c.setFillColor(BODY)
        c.setFont("Helvetica-Bold" if state == "due" else "Helvetica", 9)
        c.drawString(MX + 8, y - 12.5, num)
        c.drawString(MX + cw0 + 8, y - 12.5, name)
        # status text
        if state == "paid":
            c.setFillColor(GREEN)
        elif state == "due":
            c.setFillColor(NAVY)
        else:
            c.setFillColor(MUTED)
        c.setFont("Helvetica", 9)
        label = due + ("   • due now" if state == "due" else "")
        c.drawString(PAGE_W - MX - cw2 - cw3, y - 12.5, label)
        c.setFillColor(BODY)
        c.setFont("Helvetica-Bold", 9.5)
        c.drawRightString(PAGE_W - MX - 10, y - 12.5, amt)
        y -= rh
    # engagement total row
    c.setFillColor(NAVY)
    c.rect(MX, y - 20, PAGE_W - 2 * MX, 20, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 9.5)
    c.drawString(MX + 8, y - 14, "Engagement total")
    c.setFont("Helvetica", 8.5)
    c.setFillColor(LIGHT)
    c.drawString(MX + 150, y - 14, f"Paid to date {PAID_TO_DATE}   /   balance after this instalment {BAL_AFTER}")
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 10)
    c.drawRightString(PAGE_W - MX - 10, y - 14, ENG_TOTAL)
    y -= 20 + 18

    # amount due now + bank details
    colw = (PAGE_W - 2 * MX - 16) / 2
    box_h = 120
    c.setFillColor(CREAM)
    c.roundRect(MX, y - box_h, colw, box_h, 7, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(MX, y - box_h, 4, box_h, fill=1, stroke=0)
    c.setFillColor(TEAL)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(MX + 16, y - 20, "AMOUNT DUE NOW")
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 24)
    c.drawString(MX + 16, y - 50, DUE_NOW)
    c.setFillColor(BODY)
    c.setFont("Helvetica", 9)
    c.drawString(MX + 16, y - 70, "Monthly instalment 1 of 3.")
    c.drawString(MX + 16, y - 83, "Kindly use the payment reference shown.")
    bx2 = MX + colw + 16
    c.setFillColor(SURFACE)
    c.roundRect(bx2, y - box_h, colw, box_h, 7, fill=1, stroke=0)
    c.setFillColor(TEAL)
    c.rect(bx2, y - box_h, 4, box_h, fill=1, stroke=0)
    c.setFillColor(TEAL)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(bx2 + 16, y - 20, "PAYMENT DETAILS")
    ly = y - 36
    for label, val in BANK:
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 8)
        c.drawString(bx2 + 16, ly, label)
        c.setFillColor(NAVY)
        c.setFont("Helvetica-Bold", 9)
        lines = wrap(c, val, "Helvetica-Bold", 9, colw - 30)
        for j, ln in enumerate(lines):
            c.drawString(bx2 + 16, ly - 10 - j * 10, ln)
        ly -= 10 + 10 * len(lines) + 2
    y -= box_h + 16

    # notes
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8)
    notes = ("With thanks for a productive engagement. Fixed-fee, no success fee; the optional board-level "
             "oversight retainer is billed separately. Please let us know if a different split of the "
             "remaining balance would be easier on your side.")
    para(c, notes, MX, y, "Helvetica", 8, MUTED, PAGE_W - 2 * MX, 11)

    # footer
    c.setFillColor(NAVY)
    c.rect(0, 0, PAGE_W, 26, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(0, 26, PAGE_W, 2, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(MX, 10, "Consult for Africa Management Services Limited")
    c.setFillColor(LIGHT)
    c.setFont("Helvetica", 8)
    c.drawRightString(PAGE_W - MX, 10, "hello@consultforafrica.com   /   consultforafrica.com")

    c.showPage()
    c.save()
    print(f"wrote {OUT}")


if __name__ == "__main__":
    build()
