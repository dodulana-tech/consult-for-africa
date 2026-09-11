"""
Build the Belfiore Medical invoice PDF for Consult for Africa.

Reflects the agreed Phase 1 fee of N6,400,000 for the Belfiore Client Vault
(secure client data system + NDPA 2023 compliance groundwork), at the
founding-client rate against the standard N9,500,000 fee, and the
milestone-based payment schedule set out in the proposal:

  On signing   Mobilisation (60%)          N3,840,000   -> due now
  Milestone 1  Vault built, records in     N1,280,000
  Milestone 2  Trained, live, handed over  N1,280,000
                                           -----------
                             Total         N6,400,000

Care & hosting (N250,000/month) begins at go-live and is invoiced separately.
The NDPC registration fee is payable directly to the Commission.

Output: docs/belfiore-invoice-cfa.pdf  (A4 portrait, branded)

Run:
  python3 scripts/build-belfiore-invoice.py
"""

from __future__ import annotations

from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
OUT = DOCS / "belfiore-invoice-cfa.pdf"
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
INV_NO = "CFA-BELF-2026-001"
INV_DATE = "31 July 2026"
FROM_NAME = "Consult for Africa Management Services Limited"
BILL_TO = [
    "Belfiore Medical",
    "Attn: Dr Uju Rapu, Chief Executive Officer",
    "Lagos, Nigeria",
]
LINE_ITEMS = [
    ("Phase 1:  The Belfiore Client Vault",
     "Discovery and channel mapping across all six client categories; DPIA and NDPC registration handled with you; "
     "secure Vault built with unified client records, role-based access and a full audit trail; migration from paper; "
     "team training, go-live and two weeks of support. Fixed scope.",
     "N9,500,000"),
    ("Founding-client rate",
     "Approximately one third off the standard Phase 1 fee, applied in full.",
     "-N3,100,000"),
]
AGREED_FEE = "N6,400,000"
VAT_LABEL = "VAT @ 7.5%"
VAT_AMOUNT = "N480,000"
TOTAL_DUE = "N6,880,000"
SCHEDULE = [
    ("1", "Mobilisation (60%)  -  discovery, DPIA & NDPC", "On signing", "N3,840,000"),
    ("2", "Build milestone 1 (20%)  -  Vault built, records in", "On milestone", "N1,280,000"),
    ("3", "Build milestone 2 (20%) + VAT  -  live, handed over", "On handover", "N1,760,000"),
]
DUE_NOW = "N3,840,000"
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
    c.setTitle(f"Consult for Africa - Invoice {INV_NO} - Belfiore Medical")
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
    c.drawString(MX, y, "Belfiore Client Vault  /  secure client data system and NDPA compliance")
    y -= 14
    c.setFillColor(MUTED)
    c.setFont("Helvetica-Oblique", 9)
    c.drawString(MX, y, "One secure home for every client category, built as the practice's NDPA 2023 compliance instrument.")
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
        rows_h = 60 if i == 0 else 40
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
    c.rect(MX, y - 22, PAGE_W - 2 * MX, 22, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(MX, y - 1.5, PAGE_W - 2 * MX, 1.5, fill=1, stroke=0)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(MX + 10, y - 15, "Agreed Phase 1 fee")
    c.drawRightString(col_amt - 10, y - 15, AGREED_FEE)
    y -= 22
    # VAT row
    c.setFillColor(SURFACE)
    c.rect(MX, y - 18, PAGE_W - 2 * MX, 18, fill=1, stroke=0)
    c.setFillColor(BODY)
    c.setFont("Helvetica", 9.5)
    c.drawString(MX + 10, y - 13, VAT_LABEL)
    c.setFont("Helvetica-Bold", 9.5)
    c.drawRightString(col_amt - 10, y - 13, VAT_AMOUNT)
    y -= 18
    # total including VAT
    c.setFillColor(NAVY)
    c.rect(MX, y - 24, PAGE_W - 2 * MX, 24, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(MX, y - 24, PAGE_W - 2 * MX, 2, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 11.5)
    c.drawString(MX + 10, y - 16, "Total payable, including VAT")
    c.drawRightString(col_amt - 10, y - 16, TOTAL_DUE)
    y -= 24
    c.setFillColor(MUTED)
    c.setFont("Helvetica-Oblique", 8.5)
    c.drawString(MX + 10, y - 12, "Fixed-scope Phase 1 at the founding-client rate, a saving of N3,100,000. VAT falls due with the final milestone.")
    y -= 32

    # ---- payment schedule ----
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 11.5)
    c.drawString(MX, y, "Payment schedule")
    y -= 16
    # header
    cw0, cw2, cw3 = 24, 110, 120  # no., due, amount; description fills middle
    c.setFillColor(NAVY)
    c.rect(MX, y - 17, PAGE_W - 2 * MX, 17, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(MX, y - 17, PAGE_W - 2 * MX, 2, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(MX + 8, y - 12, "#")
    c.drawString(MX + cw0 + 8, y - 12, "Milestone")
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
    c.drawString(MX + 8, y - 14, "Total, including VAT")
    c.drawRightString(PAGE_W - MX - 10, y - 14, TOTAL_DUE)
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
    c.drawString(MX + 16, y - 48, DUE_NOW)
    c.setFillColor(BODY)
    c.setFont("Helvetica", 9)
    c.drawString(MX + 16, y - 66, "Mobilisation fee, payable on")
    c.drawString(MX + 16, y - 79, "acceptance of this invoice.")
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
    y -= box_h + 12

    # ---- notes ----
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8)
    notes = ("Fixed-scope Phase 1 engagement. All fees are exclusive of VAT; VAT of N480,000 at 7.5% is carried on "
             "the final milestone. On receipt of the mobilisation fee, C4A mobilises within the week; "
             "discovery and compliance groundwork run in parallel from week 1, with go-live targeted at week 7. "
             "Care & hosting (in-country hosting and database, encrypted daily backups, monitoring, security "
             "patches and ongoing support, all infrastructure bundled) begins at go-live and is invoiced "
             "separately: N250,000 per month, or N230,000 per month where the quarter is paid in advance "
             "(N690,000 per quarter, plus VAT), held for the first twelve months from go-live. The NDPC "
             "registration fee is payable directly to the Commission and is not included above. Later modules "
             "are separate phases, each scoped and quoted on their own. Thank you.")
    para(c, notes, MX, y, "Helvetica", 8, MUTED, PAGE_W - 2 * MX, 10.5)

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
