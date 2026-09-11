"""
Build the Aman HMO invoice PDF for Consult for Africa.

Reflects the agreed engagement fee of N5,100,000 for the Lagos provider-network
growth engagement (mobilisation + three months of execution), and the
disbursement plan agreed with the client:

  27 Jul 2026  Mobilisation fee (37.50%)      N1,912,500
               Month 1 execution (20.83%)     N1,062,500   -> due now N2,975,000 (58.33%)
  27 Aug 2026  Month 2 execution (20.83%)     N1,062,500
  27 Sep 2026  Month 3 execution (20.83%)     N1,062,500
                                              -----------
                              Total           N5,100,000

Output: docs/aman-invoice-cfa.pdf  (A4 portrait, branded)

Run:
  python3 scripts/build-aman-invoice.py
"""

from __future__ import annotations

from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
OUT = DOCS / "aman-invoice-cfa.pdf"
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
INV_NO = "CFA-AMAN-2026-001"
INV_DATE = "27 July 2026"
FROM_NAME = "Consult for Africa Management Services Limited"
BILL_TO = [
    "Aman HMO",
    "Attn: Zayyad Abdulrahman, Chief Financial Officer",
    "Abuja, Nigeria",
]
LINE_ITEMS = [
    ("Mobilisation:  build the engine",
     "Enrollee and account geography analysis, priority-cluster and adequacy mapping, and full structuring of the Lagos provider-network growth plan.",
     "N1,912,500"),
    ("Execution:  enable the BD team (3 months)",
     "Equip and drive Aman's existing business-development team against the plan, including the clinician-led build, ancillary terms and partnership pipeline.",
     "N3,187,500"),
]
AGREED_FEE = "N5,100,000"
SCHEDULE = [
    ("1", "Mobilisation fee + Month 1", "27 July 2026", "N2,975,000"),
    ("2", "Month 2 execution", "27 August 2026", "N1,062,500"),
    ("3", "Month 3 execution", "27 September 2026", "N1,062,500"),
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
    c.setTitle(f"Consult for Africa - Invoice {INV_NO} - Aman Health")
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
    c.drawString(MX, y, "Lagos Provider-Network Growth  /  mobilisation + execution")
    y -= 14
    c.setFillColor(MUTED)
    c.setFont("Helvetica-Oblique", 9)
    c.drawString(MX, y, "Data-led, clinician-led onboarding of the Lagos provider network, enabling Aman's existing business-development team.")
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
    c.drawString(MX + 10, y - 12, "Fixed-fee engagement at the agreed introductory rate. No success fee.")
    y -= 30

    # ---- payment schedule ----
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 11.5)
    c.drawString(MX, y, "Disbursement plan")
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
    c.drawString(MX + 16, y - 48, "N2,975,000")
    c.setFillColor(BODY)
    c.setFont("Helvetica", 9)
    c.drawString(MX + 16, y - 66, "Mobilisation fee plus Month 1,")
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
    notes = ("Fixed-fee engagement; no success fee. On acceptance and receipt of the mobilisation "
             "fee, Consult for Africa mobilises within the week. Monthly execution instalments fall "
             "due on the 27th of August and September 2026. Thank you.")
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
