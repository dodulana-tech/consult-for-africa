"""
Build the Havana Specialist Hospital invoice PDF for Consult for Africa.

Board Governance Framework (Board and Committee Enablement) engagement.
Net fee N2,000,000 (full professional value N5,000,000 less a N3,000,000
board-partner concession). Revised payment schedule agreed with Exec Director
Ugo Nwokoro: N1,000,000 on mobilisation, N500,000 at an agreed milestone,
N500,000 on completion.

Output: docs/hsh-invoice-cfa.pdf  (A4 portrait, branded)

Run:
  python3 scripts/build-hsh-invoice.py
"""

from __future__ import annotations

from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
OUT = DOCS / "hsh-invoice-cfa.pdf"
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
# Two invoices are issued against the same fixed-fee engagement. Select with:
#   python3 scripts/build-hsh-invoice.py 001     (mobilisation, 15 Jul 2026)
#   python3 scripts/build-hsh-invoice.py 002     (milestone, instruments delivered)
INVOICES = {
    "001": dict(
        no="CFA-HSH-2026-001",
        date="15 July 2026",
        out="hsh-invoice-cfa.pdf",
        strapline="Per the proposal of 2 July 2026 and the board's approval to proceed. "
                  "Fixed fee; the optional legal-counsel secondment is billed separately.",
        current=0,
        due_now="N1,000,000",
        due_lines=["Mobilisation fee,", "payable on acceptance of this invoice."],
        schedule=[
            ("1", "Mobilisation", "On acceptance", "N1,000,000"),
            ("2", "Agreed project milestone", "At milestone", "N500,000"),
            ("3", "Completion of engagement", "On completion", "N500,000"),
        ],
        notes="Fixed-fee engagement; no success fee. The optional legal-counsel secondment "
              "(from N600,000 per quarter, opt-in) is billed separately. On acceptance and receipt "
              "of the mobilisation fee, Consult for Africa mobilises within the week. Thank you.",
    ),
    "002": dict(
        no="CFA-HSH-2026-002",
        date="18 August 2026",
        out="hsh-invoice-002-cfa.pdf",
        strapline="Milestone claim. Workstream 2 (capability and training) is complete, and the "
                  "Workstream 1 instrument suite has been delivered to the board and the Company Secretary.",
        current=1,
        due_now="N500,000",
        due_lines=["Milestone payment,", "board and committee instruments delivered."],
        schedule=[
            ("1", "Mobilisation", "Received, with thanks", "N1,000,000"),
            ("2", "Agreed project milestone", "Due on this invoice", "N500,000"),
            ("3", "Completion of engagement", "On completion", "N500,000"),
        ],
        notes="Milestone reached: the instruments pack is issued to the board and the Company Secretary, "
              "and the training programme is complete. The final N500,000 falls due on adoption of the "
              "suite at the September 2026 board meeting.",
    ),
    "003": dict(
        no="CFA-HSH-2026-003",
        date="18 August 2026",
        out="hsh-invoice-003-cfa.pdf",
        strapline="Final claim, closing the fixed fee. Settled by Havana ahead of the September 2026 "
                  "board meeting at which the suite is adopted.",
        current=2,
        due_label="FINAL PAYMENT, RECEIVED",
        due_now="N500,000",
        due_lines=["Settled in full. Nothing further", "is due on this engagement."],
        schedule=[
            ("1", "Mobilisation", "Received, with thanks", "N1,000,000"),
            ("2", "Agreed project milestone", "Received, with thanks", "N500,000"),
            ("3", "Completion of engagement", "Received on this invoice", "N500,000"),
        ],
        notes="This closes the fixed fee of N2,000,000 in full. The supported first governance cycle "
              "continues at no further charge. With thanks for a prompt and complete settlement.",
    ),
}

INV_NO = "CFA-HSH-2026-001"
INV_DATE = "15 July 2026"
STRAPLINE = INVOICES["001"]["strapline"]
DUE_LABEL = "AMOUNT DUE NOW"
CURRENT_IDX = 0
DUE_NOW = "N1,000,000"
DUE_LINES = INVOICES["001"]["due_lines"]
NOTES = INVOICES["001"]["notes"]
FROM_NAME = "Consult for Africa Management Services Limited"
BILL_TO = [
    "Havana Specialist Hospital Limited",
    "Attn: Mrs Nneka Chukwubuisi Solomon, Head of Finance",
    "Lagos, Nigeria",
]
LINE_ITEMS = [
    ("Workstream 1:  Board and committee instruments",
     "Board pack and committee report templates, agendas, minutes and action logs, reporting dashboard and KPI pack, annual calendar, finalised delegation-of-authority schedule and committee terms of reference.",
     "N2,000,000"),
    ("Workstream 2:  Capability, training and handbook",
     "Working sessions for the executive directors and management: reporting and escalation discipline, using the instruments, chairing a committee, board interaction and fair process, the Afya interface, plus the Board and Committee Handbook.",
     "N3,000,000"),
    ("Supported first governance cycle",
     "Attendance and light coaching through the first quarter of board and committee meetings.",
     "included"),
]
FULL_VALUE = "N5,000,000"
CONCESSION = "(N3,000,000)"
NET_FEE = "N2,000,000"
SCHEDULE = [
    ("1", "Mobilisation", "On acceptance", "N1,000,000"),
    ("2", "Agreed project milestone", "At milestone", "N500,000"),
    ("3", "Completion of engagement", "On completion", "N500,000"),
]
BANK = [
    ("Bank", "Zenith Bank"),
    ("Account name", "Consult for Africa Management Services Limited"),
    ("Account number", "1312352157"),
    ("Payment reference", INV_NO),
]


def configure(key):
    """Point the module-level invoice fields at one of the INVOICES configs."""
    global INV_NO, INV_DATE, STRAPLINE, CURRENT_IDX, DUE_NOW, DUE_LINES, NOTES, BANK, OUT, SCHEDULE, DUE_LABEL
    cfg = INVOICES[key]
    SCHEDULE = cfg["schedule"]
    INV_NO = cfg["no"]
    INV_DATE = cfg["date"]
    STRAPLINE = cfg["strapline"]
    DUE_LABEL = cfg.get("due_label", "AMOUNT DUE NOW")
    CURRENT_IDX = cfg["current"]
    DUE_NOW = cfg["due_now"]
    DUE_LINES = cfg["due_lines"]
    NOTES = cfg["notes"]
    OUT = DOCS / cfg["out"]
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
    c.setTitle(f"Consult for Africa - Invoice {INV_NO} - Havana Specialist Hospital")
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
    for i, line in enumerate(["Healthcare governance and transformation partner",
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
    bill_w = PAGE_W / 2 - MX - 12
    by = y - 14
    right_lines = 0
    for line in BILL_TO[1:]:
        for ln in wrap(c, line, "Helvetica", 9.5, bill_w):
            c.drawString(bx, by, ln)
            by -= 13
            right_lines += 1

    y -= 14 + max(4, right_lines) * 13 + 18

    # ---- engagement description ----
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 11.5)
    c.drawString(MX, y, "Board Governance Framework  /  Board and Committee Enablement")
    y -= 14
    c.setFillColor(MUTED)
    c.setFont("Helvetica-Oblique", 9)
    y = para(c, STRAPLINE, MX, y, "Helvetica-Oblique", 9, MUTED, PAGE_W - 2 * MX, 11) - 8

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
        desc_lines = wrap(c, desc, "Helvetica", 8.5, PAGE_W - 2 * MX - 150)
        rows_h = 20 + len(desc_lines) * 11.5
        c.setFillColor(white if i % 2 == 0 else SURFACE)
        c.rect(MX, y - rows_h, PAGE_W - 2 * MX, rows_h, fill=1, stroke=0)
        c.setFillColor(NAVY)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(MX + 12, y - 16, title)
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 8.5)
        ly = y - 30
        for ln in desc_lines:
            c.drawString(MX + 12, ly, ln)
            ly -= 11.5
        c.setFillColor(BODY)
        c.setFont("Helvetica-Bold", 10.5)
        c.drawRightString(col_amt - 12, y - 16, amt)
        y -= rows_h
    # full value row
    c.setFillColor(SURFACE)
    c.rect(MX, y - 20, PAGE_W - 2 * MX, 20, fill=1, stroke=0)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(MX + 10, y - 14, "Full professional value")
    c.drawRightString(col_amt - 10, y - 14, FULL_VALUE)
    y -= 20
    # concession row
    c.setFillColor(white)
    c.rect(MX, y - 20, PAGE_W - 2 * MX, 20, fill=1, stroke=0)
    c.setFillColor(TEAL)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(MX + 10, y - 14, "Board-partner concession")
    c.drawRightString(col_amt - 10, y - 14, CONCESSION)
    y -= 20
    # net fee row
    c.setFillColor(CREAM)
    c.rect(MX, y - 24, PAGE_W - 2 * MX, 24, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(MX, y - 1.5, PAGE_W - 2 * MX, 1.5, fill=1, stroke=0)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(MX + 10, y - 16, "Net fee, payable by HSH")
    c.drawRightString(col_amt - 10, y - 16, NET_FEE)
    y -= 24
    c.setFillColor(MUTED)
    c.setFont("Helvetica-Oblique", 8.5)
    c.drawString(MX + 10, y - 12, "Concession applied because Dr Odulana serves on the HSH board; disclosed in full to the board and both families.")
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
        first = (i == CURRENT_IDX)
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
    c.drawRightString(PAGE_W - MX - 10, y - 14, NET_FEE)
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
    c.drawString(MX + 16, y - 20, DUE_LABEL)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 24)
    c.drawString(MX + 16, y - 48, DUE_NOW)
    c.setFillColor(BODY)
    c.setFont("Helvetica", 9)
    for k, ln in enumerate(DUE_LINES):
        c.drawString(MX + 16, y - 66 - k * 13, ln)
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
    # anchor the notes above the footer band so they can never be clipped
    note_lines = wrap(c, NOTES, "Helvetica", 8, PAGE_W - 2 * MX)
    ny = 32 + 11 * (len(note_lines) - 1)
    c.setFont("Helvetica", 8)
    c.setFillColor(MUTED)
    for ln in note_lines:
        c.drawString(MX, ny, ln)
        ny -= 11

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
    import sys
    key = sys.argv[1] if len(sys.argv) > 1 else "001"
    if key not in INVOICES:
        raise SystemExit(f"unknown invoice {key!r}; choose from {sorted(INVOICES)}")
    configure(key)
    build()
