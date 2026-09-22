"""
Build the Belfiore Medical Aesthetics invoice for the Client Experience
Programme (the two-day front-of-house training), 25 and 26 September 2026.

Three participants from the admin team at N200,000 each, the rate quoted in the
prospectus, plus VAT at 7.5%. Training is paid before delivery, not in arrears,
so this replaces the Net 7 terms on the draft Abigail put together.

  Two-day programme, 3 participants   N600,000
  VAT @ 7.5%                           N45,000
                                      --------
  Total payable                       N645,000

The baseline diagnostic (the four live surveys sent with this invoice) and the
30-day plan are inside this fee. The measurement system that holds the standard
in place after the two days is quoted separately in the prospectus.

Output: docs/belfiore-training-invoice-cfa.pdf  (A4 portrait, branded)

Run:
  python3 scripts/build-belfiore-training-invoice.py
"""

from __future__ import annotations

from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
OUT = DOCS / "belfiore-training-invoice-cfa.pdf"
LOGO = DOCS / "c4a-logo-reversed.png"

# ---- brand palette ---------------------------------------------------------
NAVY = HexColor("#0B3C5D")
GOLD = HexColor("#D4AF37")
TEAL = HexColor("#1F7A8C")
BODY = HexColor("#1F2937")
MUTED = HexColor("#6B7280")
SURFACE = HexColor("#F1F5F9")
LIGHT = HexColor("#C9D6E0")
CREAM = HexColor("#FBF6E6")

PAGE_W, PAGE_H = A4
MX = 46

# ---- invoice data ----------------------------------------------------------
INV_NO = "CFA-BELF-2026-002"
INV_DATE = "22 September 2026"
FROM_NAME = "Consult for Africa Management Services Limited"
BILL_TO = [
    "Belfiore Medical Aesthetics",
    "Attn: Dr Uju Rapu, Managing Director and Chief Executive",
    "1 Shoreline Drive, Ikoyi",
    "Lagos, Nigeria",
]

ENGAGEMENT = "Client Experience Programme  /  front-of-house team, two days"
ENGAGEMENT_SUB = ("Ten sessions across five domains, delivered to the Belfiore admin team on "
                  "25 and 26 September 2026.")

LINE_ITEMS = [
    ("Two-day Client Experience Programme  -  3 participants",
     "Ten taught sessions, 5 hours a day, at N200,000 per participant. Covers the client journey and the "
     "Belfiore service standard, first contact across phone, WhatsApp, Instagram and the door, the difficult "
     "client, the dissatisfied result, follow-up and aftercare contact, prompting, recall and rebooking, and "
     "feedback and audit. Every session is built on Belfiore's own treatments, channels and clients.",
     "N600,000"),
    ("Included at no charge  -  baseline diagnostic and 30-day plan",
     "Four live surveys run before the training (the admin team, your clients, people who enquired and did not "
     "book, and the leadership view), so the two days are taught against what is actually happening at your front "
     "desk rather than a generic syllabus. Each participant leaves with a signed 30-day plan.",
     "Included"),
]

SUBTOTAL = "N600,000"
VAT_LABEL = "VAT @ 7.5%"
VAT_AMOUNT = "N45,000"
TOTAL_DUE = "N645,000"
DUE_NOW = "N645,000"
DUE_WHEN = ["Payable in full on or before", "25 September 2026, the first", "day of training."]

INCLUDED = [
    "Two days of training, 10 hours in total",
    "Design customised to Belfiore's own channels",
    "Baseline diagnostic: four live surveys",
    "Workbook, role plays, complaint framework",
    "A drafted Belfiore service standard",
    "A signed 30-day plan for each participant",
    "Certificates of completion",
    "Delivered at our office or at Belfiore",
]

SCOPE_NOTE = ("The measurement system that holds the standard in place after the two days is scoped and "
              "priced separately in the accompanying prospectus.")

TERMS_TITLE = "Terms of engagement"
TERMS = [
    ("Fees are non-refundable.",
     "Once this invoice is settled the fee is not refundable in whole or in part, including where a participant does not attend."),
    ("Substitution is free.",
     "Send a colleague in place of anyone who cannot make it, at any time up to the first session."),
    ("The dates may be moved once at no charge,",
     "on five working days of written notice. Inside five working days, 50% of the fee is charged to reschedule."),
    ("Seats are confirmed on payment,",
     "which is due in full before the first session. VAT is remitted by Consult for Africa to the FIRS."),
]


BANK = [
    ("Bank", "Zenith Bank"),
    ("Account name", "Consult for Africa Management Services Limited"),
    ("Account number", "1312352157"),
    ("Payment reference", INV_NO),
]

CONTACT = ("Questions about this invoice: Dr Debo Odulana  /  hello@consultforafrica.com  /  "
           "+234 913 813 8553")


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
    c.setTitle(f"Consult for Africa - Invoice {INV_NO} - Belfiore Medical Aesthetics")
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
        c.drawImage(img, MX, PAGE_H - 64 - dh / 2, width=dw, height=dh,
                    mask="auto", preserveAspectRatio=True)
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

    y = PAGE_H - 148

    # ---- From / Bill to ----
    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(TEAL)
    c.drawString(MX, y, "FROM")
    c.drawString(PAGE_W / 2 + 6, y, "BILL TO")
    y -= 15
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(NAVY)
    c.drawString(MX, y, "Consult for Africa Management")
    c.drawString(MX, y - 13, "Services Limited")
    c.setFont("Helvetica", 9.5)
    c.setFillColor(BODY)
    for i, line in enumerate(["2 Tom Ogboi Avenue, Lekki Phase 1",
                              "Lagos, Nigeria",
                              "hello@consultforafrica.com",
                              "+234 913 813 8553"]):
        c.drawString(MX, y - 27 - i * 13, line)
    bx = PAGE_W / 2 + 6
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(NAVY)
    c.drawString(bx, y, BILL_TO[0])
    c.setFont("Helvetica", 9.5)
    c.setFillColor(BODY)
    for i, line in enumerate(BILL_TO[1:]):
        c.drawString(bx, y - 14 - i * 13, line)

    y -= 27 + 4 * 13 + 14

    # ---- engagement description ----
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 11.5)
    c.drawString(MX, y, ENGAGEMENT)
    y -= 13
    c.setFillColor(MUTED)
    c.setFont("Helvetica-Oblique", 8.7)
    c.drawString(MX, y, ENGAGEMENT_SUB)
    y -= 17

    # ---- line items ----
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
        rows_h = 66 if i == 0 else 54
        c.setFillColor(white if i % 2 == 0 else SURFACE)
        c.rect(MX, y - rows_h, PAGE_W - 2 * MX, rows_h, fill=1, stroke=0)
        c.setFillColor(NAVY)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(MX + 12, y - 16, title)
        para(c, desc, MX + 12, y - 30, "Helvetica", 8.4, MUTED,
             PAGE_W - 2 * MX - 110, 11)
        c.setFillColor(BODY if amt.startswith("N") else MUTED)
        c.setFont("Helvetica-Bold" if amt.startswith("N") else "Helvetica-Oblique", 10.5)
        c.drawRightString(col_amt - 12, y - 16, amt)
        y -= rows_h

    # subtotal
    c.setFillColor(CREAM)
    c.rect(MX, y - 22, PAGE_W - 2 * MX, 22, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(MX, y - 1.5, PAGE_W - 2 * MX, 1.5, fill=1, stroke=0)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(MX + 10, y - 15, "Subtotal")
    c.drawRightString(col_amt - 10, y - 15, SUBTOTAL)
    y -= 22
    # VAT
    c.setFillColor(SURFACE)
    c.rect(MX, y - 18, PAGE_W - 2 * MX, 18, fill=1, stroke=0)
    c.setFillColor(BODY)
    c.setFont("Helvetica", 9.5)
    c.drawString(MX + 10, y - 13, VAT_LABEL)
    c.setFont("Helvetica-Bold", 9.5)
    c.drawRightString(col_amt - 10, y - 13, VAT_AMOUNT)
    y -= 18
    # total
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
    c.setFont("Helvetica-Oblique", 8.4)
    c.drawString(MX + 10, y - 12,
                 "Additional participants are charged at N200,000 each. Seats are confirmed on payment.")
    y -= 28

    # ---- amount due + bank details ----
    colw = (PAGE_W - 2 * MX - 16) / 2
    box_h = 104
    c.setFillColor(CREAM)
    c.roundRect(MX, y - box_h, colw, box_h, 7, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(MX, y - box_h, 4, box_h, fill=1, stroke=0)
    c.setFillColor(TEAL)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(MX + 16, y - 20, "AMOUNT DUE")
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 24)
    c.drawString(MX + 16, y - 48, DUE_NOW)
    c.setFillColor(BODY)
    c.setFont("Helvetica", 8.8)
    for i, ln in enumerate(DUE_WHEN):
        c.drawString(MX + 16, y - 62 - i * 11, ln)

    bx2 = MX + colw + 16
    c.setFillColor(SURFACE)
    c.roundRect(bx2, y - box_h, colw, box_h, 7, fill=1, stroke=0)
    c.setFillColor(TEAL)
    c.rect(bx2, y - box_h, 4, box_h, fill=1, stroke=0)
    c.setFillColor(TEAL)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(bx2 + 16, y - 20, "PAYMENT DETAILS")
    ly = y - 32
    for label, val in BANK:
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 7.8)
        c.drawString(bx2 + 16, ly, label)
        ly -= 9
        c.setFillColor(NAVY)
        c.setFont("Helvetica-Bold", 8.8)
        for ln in wrap(c, val, "Helvetica-Bold", 8.8, colw - 30):
            c.drawString(bx2 + 16, ly, ln)
            ly -= 9
    y -= box_h + 14

    # ---- what the fee includes ----
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 10.5)
    c.drawString(MX, y, "What the fee includes")
    y -= 14
    half = (PAGE_W - 2 * MX) / 2
    rows = (len(INCLUDED) + 1) // 2
    for i, item in enumerate(INCLUDED):
        cx = MX + (0 if i < rows else half)
        yy = y - (i if i < rows else i - rows) * 11.5
        c.setFillColor(GOLD)
        c.circle(cx + 3, yy + 3, 2, fill=1, stroke=0)
        c.setFillColor(BODY)
        c.setFont("Helvetica", 8.2)
        c.drawString(cx + 10, yy, item)
    y -= rows * 11.5 + 4
    c.setFillColor(MUTED)
    c.setFont("Helvetica-Oblique", 8)
    c.drawString(MX, y, SCOPE_NOTE)
    y -= 16

    # ---- terms of engagement ----
    terms_h = 18 + len(TERMS) * 11.5 + 7
    c.setFillColor(CREAM)
    c.roundRect(MX, y - terms_h, PAGE_W - 2 * MX, terms_h, 5, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(MX, y - terms_h, 3.5, terms_h, fill=1, stroke=0)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 9.3)
    c.drawString(MX + 14, y - 13, TERMS_TITLE)
    ty = y - 27
    for head, detail in TERMS:
        c.setFillColor(NAVY)
        c.setFont("Helvetica-Bold", 7.7)
        c.drawString(MX + 14, ty, head)
        w = c.stringWidth(head, "Helvetica-Bold", 7.7)
        c.setFillColor(BODY)
        c.setFont("Helvetica", 7.7)
        c.drawString(MX + 14 + w + 3, ty, detail)
        ty -= 11.5
    y -= terms_h + 8

    # ---- footer ----
    c.setFillColor(NAVY)
    c.rect(0, 0, PAGE_W, 46, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(0, 46, PAGE_W, 3, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 8.6)
    c.drawString(MX, 28, "Thank you. We are looking forward to working with your team.")
    c.setFillColor(LIGHT)
    c.setFont("Helvetica", 7.8)
    c.drawString(MX, 15, CONTACT)

    c.showPage()
    c.save()
    print(f"wrote {OUT}")


if __name__ == "__main__":
    build()
