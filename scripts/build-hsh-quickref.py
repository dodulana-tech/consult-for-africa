"""
Build the HSH "Board Member at a Glance" one-page quick-reference card for
Consult For Africa. A single A4 portrait page distilling the Director's Guide
into a desk reference for the executive directors.

Output: docs/hsh-board-at-a-glance-cfa.pdf  (1 page, A4 portrait, branded)

Run:
  python3 scripts/build-hsh-quickref.py
"""

from __future__ import annotations

from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.platypus import Paragraph

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
OUT = DOCS / "hsh-board-at-a-glance-cfa.pdf"
ICON = DOCS / "c4a-icon.png"

NAVY = HexColor("#0B3C5D")
GOLD = HexColor("#D4AF37")
TEAL = HexColor("#1F7A8C")
BODY = HexColor("#1F2937")
MUTED = HexColor("#6B7280")
SURFACE = HexColor("#F1F5F9")
CREAM = HexColor("#FBF6E6")
ICEBLUE = HexColor("#EAF1F4")

PAGE_W, PAGE_H = A4  # 595 x 842
MX = 40

ITEM = ParagraphStyle(
    "item", fontName="Helvetica", fontSize=8.3, leading=10.6, textColor=BODY,
    alignment=TA_LEFT, leftIndent=11, firstLineIndent=-11, bulletIndent=0,
    bulletFontName="Helvetica-Bold", bulletFontSize=8.3, spaceAfter=4,
)


def item_para(lead, rest):
    if lead and rest:
        txt = '<font color="#0B3C5D"><b>%s</b></font> %s' % (lead, rest)
    elif lead:
        txt = '<font color="#0B3C5D"><b>%s</b></font>' % lead
    else:
        txt = rest
    p = Paragraph(txt, ITEM)
    p.bulletText = "•"
    return p


def card(c, x, y, w, h, kicker, items, spine=GOLD, bg=SURFACE):
    c.setFillColor(bg)
    c.roundRect(x, y - h, w, h, 7, fill=1, stroke=0)
    c.setFillColor(spine)
    c.rect(x, y - h, 4, h, fill=1, stroke=0)
    c.setFillColor(TEAL)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(x + 15, y - 17, kicker.upper())
    cy = y - 30
    availw = w - 15 - 14
    for lead, rest in items:
        p = item_para(lead, rest)
        pw, ph = p.wrap(availw, 200)
        p.drawOn(c, x + 15, cy - ph)
        cy -= ph + 3


def build():
    c = canvas.Canvas(str(OUT), pagesize=A4)
    c.setTitle("HSH Board Member at a Glance - Consult for Africa")
    c.setAuthor("Consult for Africa")

    # ---- header band ----
    c.setFillColor(NAVY)
    c.rect(0, PAGE_H - 92, PAGE_W, 92, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(0, PAGE_H - 96, PAGE_W, 4, fill=1, stroke=0)
    # icon top-right
    try:
        ic = ImageReader(str(ICON))
        iw, ih = ic.getSize()
        hh = 40.0
        ww = hh * iw / ih
        c.drawImage(ic, PAGE_W - MX - ww, PAGE_H - 66, width=ww, height=hh, mask="auto")
    except Exception:
        pass
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(MX, PAGE_H - 32, "CONSULT FOR AFRICA")
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 22)
    c.drawString(MX, PAGE_H - 58, "Board Member at a Glance")
    c.setFillColor(HexColor("#C9D6E0"))
    c.setFont("Helvetica", 10.5)
    c.drawString(MX, PAGE_H - 76, "Havana Specialist Hospital   /   a one-page reference for directors")

    # ---- hero ----
    hy = PAGE_H - 108
    hh = 46
    c.setFillColor(CREAM)
    c.roundRect(MX, hy - hh, PAGE_W - 2 * MX, hh, 7, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(MX, hy - hh, 5, hh, fill=1, stroke=0)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(MX + 18, hy - 20, "The one idea:  govern, don't manage.")
    c.setFillColor(BODY)
    c.setFont("Helvetica", 8.6)
    c.drawString(MX + 18, hy - 35,
                 "The board sets direction, checks progress, and holds management to account. Management and Afya run the hospital day to day.")

    # ---- grid ----
    gx = 16
    colw = (PAGE_W - 2 * MX - gx) / 2
    top = hy - hh - 16
    ch = 128
    rgap = 12
    L = MX
    R = MX + colw + gx

    card(c, L, top, colw, ch, "Your two hats",
         [("In the room, wear the board hat.", "Act for the whole company, both families, not a side or a department."),
          ("Keep board matters confidential.", ""),
          ("If you also run operations (the MD),", "you report in, you do not chair. You cannot assure your own work.")])
    card(c, R, top, colw, ch, "How you steer in 4 meetings a year",
         [("Like a ship:", "set the heading, read the dials, correct at intervals."),
          ("Management runs the moving parts", "between meetings, within delegated limits."),
          ("Reporting brings the org to you;", "committees go deeper between board meetings.")])

    r2 = top - ch - rgap
    card(c, L, r2, colw, ch, "What it asks of your time",
         [("~1 to 2 days a month", "once running; more early, and more if you chair."),
          ("4 board meetings a year", "plus committees; read the pack, 2 to 4 hours, before each."),
          ("This sits on top", "of your existing executive role.")],
         spine=TEAL, bg=ICEBLUE)
    card(c, R, r2, colw, ch, "The one habit that matters",
         [("Read the board pack before every meeting.", "Block the time; note your questions."),
          ("A prepared director", "contributes well and feels in control."),
          ("“Please explain that”", "is one of the most useful sentences in any boardroom.")])

    r3 = r2 - ch - rgap
    card(c, L, r3, colw, ch, "If you chair a committee",
         [("Set the agenda", "with the Company Secretary and management."),
          ("Run to time; hear everyone;", "reach and record clear decisions."),
          ("You lead the conversation,", "you are not the expert on everything in it.")])
    card(c, R, r3, colw, ch, "Questions you can always ask",
         [("Why is this different from plan?", ""),
          ("Is it a one-off or a trend?", "What is being done about it?"),
          ("What would make it worse?", "Asking the question is the governance.")],
         spine=TEAL, bg=ICEBLUE)

    r4 = r3 - ch - rgap
    card(c, L, r4, colw, ch, "Conflicts of interest",
         [("Declare it.", "If it touches you, your family, or a connected business, say so."),
          ("Step out of it.", "Leave the room for that decision (recusal)."),
          ("Record it.", "The Company Secretary keeps the register.")])
    card(c, R, r4, colw, ch, "Disagreeing well",
         [("Everyone is heard", "before a decision is made."),
          ("Reasons are explained;", "decide for what is best for HSH."),
          ("Once decided properly,", "get behind it, together.")])

    # ---- footer strip ----
    fy = r4 - ch - 14
    fh = 42
    c.setFillColor(NAVY)
    c.roundRect(MX, fy - fh, PAGE_W - 2 * MX, fh, 7, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(MX + 16, fy - 15, "THE BOARD'S FOUR JOBS")
    c.setFillColor(white)
    c.setFont("Helvetica", 8.1)
    c.drawString(MX + 16, fy - 30,
                 "Oversee the Afya partnership   /   Secure HSH long-term   /   Build credibility & influence   /   Protect both families")

    c.setFillColor(MUTED)
    c.setFont("Helvetica", 7)
    c.drawString(MX, 22, "When unsure who decides, check the Delegation of Authority. When in doubt, ask or escalate.")
    c.drawRightString(PAGE_W - MX, 22, "Consult for Africa  /  Confidential  /  companion to the Director's Guide")
    c.setFillColor(GOLD)
    c.rect(MX, 32, 16, 2, fill=1, stroke=0)

    c.showPage()
    c.save()
    print(f"wrote {OUT}")


from reportlab.pdfgen import canvas  # noqa: E402

if __name__ == "__main__":
    build()
