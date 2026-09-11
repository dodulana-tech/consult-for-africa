"""
Build the Haven Paediatric Centre invoice PDF for Consult for Africa.

Reflects the negotiated fee (27 June 2026 meeting): N9,300,000 total, with the
diagnostic audit at N1,800,000 (mobilisation, on acceptance) and the N7,500,000
balance over three equal monthly instalments of N2,500,000.

Output: docs/haven-invoice-cfa.pdf  (A4 portrait, branded)

Run:
  python3 scripts/build-haven-invoice.py
"""

from __future__ import annotations

from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
OUT = DOCS / "haven-invoice-cfa.pdf"
LOGO = DOCS / "c4a-logo-reversed.png"   # white knockout for navy header

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

PAGE_W, PAGE_H = A4   # 595 x 842
MX = 46

# ---- invoice data ----------------------------------------------------------
INV_NO = "CFA-HAV-2026-001"
INV_DATE = "30 June 2026"
FROM_NAME = "Consult for Africa Management Services Limited"
BILL_TO = [
    "Haven Paediatric Centre",
    "Attn: Kabir Aregbesola",
    "GRA Ikeja, Lagos, Nigeria",
    "kabir@aurorahills.co",
]
LINE_ITEMS = [
    ("Workstream 1:  Diagnostic Audit (4 weeks)",
     "Clinical governance, operations, finance and working capital, procurement, HMO economics and reporting integrity.",
     "N1,800,000"),
    ("Workstreams 2-4:  Core engagement",
     "Culture, incentives and clinical standards of work; process reengineering and operations; revenue and growth optimisation.",
     "N7,500,000"),
]
AGREED_FEE = "N9,300,000"
STANDARD_VALUE = "N17,000,000"
SCHEDULE = [
    ("1", "Mobilisation:  Diagnostic Audit", "On acceptance", "N1,800,000"),
    ("2", "Instalment 1 of 3", "31 July 2026", "N2,500,000"),
    ("3", "Instalment 2 of 3", "31 August 2026", "N2,500,000"),
    ("4", "Instalment 3 of 3", "30 September 2026", "N2,500,000"),
]
BANK = [
    ("Bank", "Zenith Bank"),
    ("Account name", "Consult for Africa Management Services Limited"),
    ("Account number", "1312352157"),
    ("Payment reference", INV_NO),
]


# ---- helpers ---------------------------------------------------------------
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

    # ---- header band ----
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
    c.drawRightString(PAGE_W - MX, PAGE_H - 56, "INVOICE")
    c.setFillColor(LIGHT)
    c.setFont("Helvetica", 9.5)
    c.drawRightString(PAGE_W - MX, PAGE_H - 74, f"No. {INV_NO}")
    c.drawRightString(PAGE_W - MX, PAGE_H - 88, f"Date: {INV_DATE}")
    c.drawRightString(PAGE_W - MX, PAGE_H - 102, "Currency: Nigerian Naira (NGN)")

    y = PAGE_H - 150

    # ---- From / Bill to ----
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
    # bill to
    bx = PAGE_W / 2 + 6
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(NAVY)
    c.drawString(bx, y, BILL_TO[0])
    c.setFont("Helvetica", 9.5)
    c.setFillColor(BODY)
    for i, line in enumerate(BILL_TO[1:]):
        c.drawString(bx, y - 14 - i * 13, line)

    y -= 14 + 4 * 13 + 18

    # ---- engagement description ----
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 11.5)
    c.drawString(MX, y, "Operational Turnaround, Culture & Growth  /  board-led engagement")
    y -= 14
    c.setFillColor(MUTED)
    c.setFont("Helvetica-Oblique", 9)
    c.drawString(MX, y, "Agreed at the meeting of 27 June 2026. Five workstreams; the optional board-oversight retainer is billed separately.")
    y -= 18

    # ---- line items table ----
    col_amt = PAGE_W - MX
    c.setFillColor(NAVY)
    c.rect(MX, y - 18, PAGE_W - 2 * MX, 18, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(MX, y - 18, PAGE_W - 2 * MX, 2, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 9.5)
    c.drawString(MX + 10, y - 13, "Description")
    c.drawRightString(col_amt - 10, y - 13, "Amount")
    y -= 18
    for i, (title, desc, amt) in enumerate(LINE_ITEMS):
        rows_h = 46
        c.setFillColor(white if i % 2 == 0 else SURFACE)
        c.rect(MX, y - rows_h, PAGE_W - 2 * MX, rows_h, fill=1, stroke=0)
        c.setFillColor(NAVY)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(MX + 12, y - 16, title)
        c.setFillColor(MUTED)
        para(c, desc, MX + 12, y - 30, "Helvetica", 8.5, MUTED, PAGE_W - 2 * MX - 150, 11.5)
        c.setFillColor(BODY)
        c.setFont("Helvetica-Bold", 10.5)
        c.drawRightString(col_amt - 12, y - 16, amt)
        y -= rows_h
    # agreed fee row
    c.setFillColor(CREAM)
    c.rect(MX, y - 24, PAGE_W - 2 * MX, 24, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(MX, y - 1.5, PAGE_W - 2 * MX, 1.5, fill=1, stroke=0)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(MX + 10, y - 16, "Agreed engagement fee")
    c.drawRightString(col_amt - 10, y - 16, AGREED_FEE)
    y -= 24
    c.setFillColor(MUTED)
    c.setFont("Helvetica-Oblique", 8.5)
    c.drawString(MX + 10, y - 12, f"Standard Consult for Africa value {STANDARD_VALUE}. Negotiated concession of N7,700,000 reflected above.")
    y -= 30

    # ---- payment schedule ----
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 11.5)
    c.drawString(MX, y, "Payment schedule")
    y -= 16
    # header
    cw0, cw2, cw3 = 24, 150, 120  # no., due, amount; description fills middle
    c.setFillColor(NAVY)
    c.rect(MX, y - 17, PAGE_W - 2 * MX, 17, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(MX, y - 17, PAGE_W - 2 * MX, 2, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(MX + 8, y - 12, "#")
    c.drawString(MX + cw0 + 8, y - 12, "Payment")
    c.drawString(PAGE_W - MX - cw2 - cw3, y - 12, "Due")
    c.drawRightString(PAGE_W - MX - 10, y - 12, "Amount")
    y -= 17
    for i, (num, name, due, amt) in enumerate(SCHEDULE):
        rh = 17
        first = (i == 0)
        c.setFillColor(CREAM if first else (white if i % 2 == 0 else SURFACE))
        c.rect(MX, y - rh, PAGE_W - 2 * MX, rh, fill=1, stroke=0)
        if first:
            c.setFillColor(GOLD)
            c.rect(MX, y - rh, 3, rh, fill=1, stroke=0)
        c.setFillColor(BODY)
        c.setFont("Helvetica-Bold" if first else "Helvetica", 9)
        c.drawString(MX + 8, y - 12, num)
        c.drawString(MX + cw0 + 8, y - 12, name)
        c.setFont("Helvetica", 9)
        c.drawString(PAGE_W - MX - cw2 - cw3, y - 12, due)
        c.setFont("Helvetica-Bold", 9.5)
        c.drawRightString(PAGE_W - MX - 10, y - 12, amt)
        y -= rh
    # total row
    c.setFillColor(NAVY)
    c.rect(MX, y - 20, PAGE_W - 2 * MX, 20, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(MX + 8, y - 14, "Total")
    c.drawRightString(PAGE_W - MX - 10, y - 14, AGREED_FEE)
    y -= 20

    # ---- amount due now + bank details (two columns) ----
    y -= 16
    colw = (PAGE_W - 2 * MX - 16) / 2
    box_h = 126
    # amount due now
    c.setFillColor(CREAM)
    c.roundRect(MX, y - box_h, colw, box_h, 7, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(MX, y - box_h, 4, box_h, fill=1, stroke=0)
    c.setFillColor(TEAL)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(MX + 16, y - 20, "AMOUNT DUE NOW")
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 24)
    c.drawString(MX + 16, y - 48, "N1,800,000")
    c.setFillColor(BODY)
    c.setFont("Helvetica", 9)
    c.drawString(MX + 16, y - 66, "Mobilisation (Diagnostic Audit),")
    c.drawString(MX + 16, y - 79, "payable on acceptance of this invoice.")
    # bank details
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
        for j, ln in enumerate(wrap(c, val, "Helvetica-Bold", 9, colw - 30)):
            c.drawString(bx2 + 16, ly - 10 - j * 10, ln)
        ly -= 10 + 10 * len(wrap(c, val, "Helvetica-Bold", 9, colw - 30)) + 2
    y -= box_h + 16

    # ---- notes ----
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8)
    notes = ("Fixed-fee engagement; no success fee. The optional board-level oversight retainer "
             "(N600,000/month, opt-in) is billed separately. On acceptance and receipt of the mobilisation "
             "fee, Consult for Africa mobilises within the week. Thank you.")
    para(c, notes, MX, y, "Helvetica", 8, MUTED, PAGE_W - 2 * MX, 11)

    # ---- footer ----
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
