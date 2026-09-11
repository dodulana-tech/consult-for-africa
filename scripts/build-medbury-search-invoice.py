"""
Build the Medbury Healthcare Group invoice PDF for the Abuja facility search.

Position taken:
  - The NGN 750,000 is billed exactly as agreed. No percentage of any kind
    appears on this invoice. The 5% of rental proposed at the outset was not
    accepted by Medbury (it would have sat on top of agency, legal and caution
    payable with the rent) and CFA withdrew it. That is stated on the face of
    the invoice as nil, so the record is clean and it never comes back.
  - The 750,000 was a mobilisation fee for CFA's own time. It was never a
    budget for third-party cash. The agreed term already reads "agency and
    legal fees contracted directly by Medbury". Viewing and inspection fees
    demanded by Abuja agents at the door are the same category of cost. CFA
    advanced them so the viewings could happen, and recovers them at cost with
    receipts, no mark-up.
  - CFA's own consultant time beyond the mobilisation scope is shown and
    waived, so the true cost of the search is on the record without being
    charged.

Output: docs/medbury-search-invoice-cfa.pdf  (A4 portrait, branded)

Run:
  python3 scripts/build-medbury-search-invoice.py

BEFORE SENDING: replace the PLACEHOLDER disbursement figures below with the
actual receipted amounts, then set DRAFT = False. While DRAFT is True the PDF
carries a visible DRAFT stamp so it cannot be sent by accident.
"""

from __future__ import annotations

from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
OUT = DOCS / "medbury-search-invoice-cfa.pdf"
LOGO = DOCS / "c4a-logo-reversed.png"   # white knockout for navy header

# ---- brand palette ---------------------------------------------------------
NAVY = HexColor("#0B3C5D")
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
DRAFT = False           # <-- set True to stamp the PDF while figures are being confirmed

INV_NO = "CFA-MBY-2026-001"
INV_DATE = "16 August 2026"
FROM_NAME = "Consult for Africa Management Services Limited"
BILL_TO = [
    "Medbury Healthcare Group",
    "Attn: Dr Itunu Akinware, Group Chief Executive Officer",
    "Lagos, Nigeria",
]

FEE = 750_000

# ---- Disbursements. Amount None renders as "Waived" and is excluded from the total.
#      Replace each charged amount with the receipted actual. Rule of thumb: keep the
#      charged disbursements at or under two thirds of the fee, and waive the balance
#      openly, so the line never reads as a fee increase by the back door.
DISBURSEMENTS = [
    ("Agent viewing and inspection fees",
     "Paid at the gate to open properties, across the Asokoro, Maitama and Wuse II field", 310_000),
    ("Site visit transport and logistics",
     "Abuja ground movement across the full viewing programme", 190_000),
    ("Lagos to Abuja travel and accommodation",
     "Incurred by Consult for Africa, shown for the record, not charged", None),
]
# ---------------------------------------------------------------------------

WAIVED_NOTE = ("Consultant time beyond the mobilisation scope, the travel line above, and the 5% of "
               "rental proposed at the outset and withdrawn at Medbury's request, are not charged.")

BANK = [
    ("Bank", "Zenith Bank"),
    ("Account name", "Consult for Africa Management Services Limited"),
    ("Account number", "1312352157"),
    ("Payment reference", INV_NO),
]

DISB_TOTAL = sum(a for _, _, a in DISBURSEMENTS if a)
TOTAL = FEE + DISB_TOTAL


def naira(n: int) -> str:
    return "N{:,}".format(n)


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
    c.setTitle(f"Consult for Africa - Invoice {INV_NO} - Medbury Healthcare Group")
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
        for j, ln in enumerate(wrap(c, line, "Helvetica", 9.5, PAGE_W / 2 - MX - 6)):
            c.drawString(bx, y - 14 - (i + j) * 13, ln)

    y -= 14 + 4 * 13 + 16

    # ---- engagement description ----
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 11.5)
    c.drawString(MX, y, "Abuja facility search and site evaluation  /  Hospitals Division")
    y -= 14
    c.setFillColor(MUTED)
    c.setFont("Helvetica-Oblique", 9)
    c.drawString(MX, y, "Search complete. Site identified, evaluated and secured. Billed on the terms Medbury accepted.")
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

    items = [
        ("Professional fee, location search and site evaluation",
         "Search brief, agent engagement, site visits and filtering across Asokoro, Maitama and Wuse II, "
         "comparative evaluation and shortlist, and management of the search to a secured site. Agreed "
         "mobilisation fee, unchanged.",
         naira(FEE), 52),
        ("Disbursements advanced on Medbury's behalf",
         "Third-party cash paid out so the viewings could proceed. At cost, no mark-up, receipts attached. "
         "Itemised in the schedule below.",
         naira(DISB_TOTAL), 42),
        ("Percentage of rental",
         "Proposed at the outset, not accepted by Medbury, withdrawn by Consult for Africa. Not charged, "
         "and not carried forward to any later phase.",
         "Nil", 42),
    ]
    for i, (title, desc, amt, rows_h) in enumerate(items):
        c.setFillColor(white if i % 2 == 0 else SURFACE)
        c.rect(MX, y - rows_h, PAGE_W - 2 * MX, rows_h, fill=1, stroke=0)
        c.setFillColor(NAVY)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(MX + 12, y - 15, title)
        para(c, desc, MX + 12, y - 28, "Helvetica", 8.3, MUTED, PAGE_W - 2 * MX - 150, 10.5)
        c.setFillColor(BODY if amt != "Nil" else MUTED)
        c.setFont("Helvetica-Bold", 10.5)
        c.drawRightString(col_amt - 12, y - 15, amt)
        y -= rows_h

    # total row
    c.setFillColor(NAVY)
    c.rect(MX, y - 24, PAGE_W - 2 * MX, 24, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(MX, y - 24, PAGE_W - 2 * MX, 2, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(MX + 10, y - 16, "Total due")
    c.drawRightString(col_amt - 10, y - 16, naira(TOTAL))
    y -= 24
    y = para(c, WAIVED_NOTE, MX + 10, y - 12, "Helvetica-Oblique", 8.3, MUTED,
             PAGE_W - 2 * MX - 20, 10.5) - 12

    # ---- disbursement schedule ----
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 11.5)
    c.drawString(MX, y, "Schedule of disbursements")
    y -= 15
    c.setFillColor(NAVY)
    c.rect(MX, y - 17, PAGE_W - 2 * MX, 17, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(MX, y - 17, PAGE_W - 2 * MX, 2, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(MX + 10, y - 12, "Item")
    c.drawRightString(PAGE_W - MX - 10, y - 12, "At cost")
    y -= 17
    for i, (name, note, amt) in enumerate(DISBURSEMENTS):
        rh = 26
        c.setFillColor(white if i % 2 == 0 else SURFACE)
        c.rect(MX, y - rh, PAGE_W - 2 * MX, rh, fill=1, stroke=0)
        c.setFillColor(NAVY)
        c.setFont("Helvetica-Bold", 9)
        c.drawString(MX + 10, y - 11, name)
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 8)
        c.drawString(MX + 10, y - 21, note)
        c.setFillColor(BODY if amt else MUTED)
        c.setFont("Helvetica-Bold" if amt else "Helvetica-Oblique", 9.5)
        c.drawRightString(PAGE_W - MX - 10, y - 11, naira(amt) if amt else "Waived")
        y -= rh
    c.setFillColor(CREAM)
    c.rect(MX, y - 20, PAGE_W - 2 * MX, 20, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(MX, y - 20, 3, 20, fill=1, stroke=0)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 9.5)
    c.drawString(MX + 10, y - 14, "Disbursements, at cost")
    c.drawRightString(PAGE_W - MX - 10, y - 14, naira(DISB_TOTAL))
    y -= 20 + 18

    # ---- amount due now + bank details (two columns) ----
    colw = (PAGE_W - 2 * MX - 16) / 2
    box_h = 112
    c.setFillColor(CREAM)
    c.roundRect(MX, y - box_h, colw, box_h, 7, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(MX, y - box_h, 4, box_h, fill=1, stroke=0)
    c.setFillColor(TEAL)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(MX + 16, y - 20, "AMOUNT DUE")
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 24)
    c.drawString(MX + 16, y - 48, naira(TOTAL))
    c.setFillColor(BODY)
    c.setFont("Helvetica", 9)
    c.drawString(MX + 16, y - 66, "Fee " + naira(FEE) + " plus disbursements " + naira(DISB_TOTAL) + ".")
    c.drawString(MX + 16, y - 79, "Payable within 14 days of receipt.")

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
        ly -= 10 + 10 * len(lines) + 1
    y -= box_h + 14

    # ---- notes ----
    notes = ("Agency, legal and caution payable on the lease are contracted and settled directly by Medbury, "
             "as agreed. Disbursements above are third-party costs Consult for Africa advanced so viewings "
             "could proceed, and are recovered at cost. Later phases of the Abuja work are priced separately "
             "under the setup and management mandate.")
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

    if DRAFT:
        c.saveState()
        c.setFillColor(HexColor("#C8102E"))
        c.setFont("Helvetica-Bold", 72)
        c.translate(PAGE_W / 2, PAGE_H / 2)
        c.rotate(38)
        try:
            c.setFillAlpha(0.13)
        except Exception:
            pass
        c.drawCentredString(0, 0, "DRAFT")
        c.restoreState()

    c.showPage()
    c.save()
    print(f"wrote {OUT}")
    if DRAFT:
        print("DRAFT stamp is on. Replace the placeholder disbursement figures "
              "with receipted actuals, then set DRAFT = False and rerun.")


if __name__ == "__main__":
    build()
