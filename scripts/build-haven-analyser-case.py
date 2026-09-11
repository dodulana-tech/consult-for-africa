"""
Build the Haven haematology-analyser one-page business case PDF for CFA.

Output: docs/haven-analyser-business-case-cfa.pdf  (A4, single page, branded)

Run:
  python3 scripts/build-haven-analyser-case.py
"""

from __future__ import annotations

from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageTemplate,
)

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
OUT = DOCS / "haven-analyser-business-case-cfa.pdf"

# ---- brand palette ----------------------------------------------------------
NAVY = HexColor("#0B3C5D")
GOLD = HexColor("#D4AF37")
TEAL = HexColor("#1F7A8C")
BODY = HexColor("#1F2937")
MUTED = HexColor("#6B7280")
SURFACE = HexColor("#F1F5F9")
LIGHT = HexColor("#C9D6E0")
GREEN = HexColor("#15803D")

PAGE_W, PAGE_H = A4
MARGIN = 46


def style(name, **kw):
    base = dict(fontName="Helvetica", fontSize=9, leading=12.4, textColor=BODY,
                alignment=TA_LEFT, spaceAfter=4)
    base.update(kw)
    return ParagraphStyle(name, **base)


H1 = style("h1", fontName="Helvetica-Bold", fontSize=10.5, leading=13, textColor=NAVY,
           spaceBefore=8, spaceAfter=3)
P = style("p")
SMALL = style("small", fontSize=7.6, leading=10.5, textColor=MUTED)
CELL = style("cell", fontSize=8.5, leading=11)
CELL_B = style("cellb", fontSize=8.5, leading=11, fontName="Helvetica-Bold")
CELL_W = style("cellw", fontSize=8.5, leading=11, fontName="Helvetica-Bold", textColor=white)


def page_bg(c, doc):
    c.saveState()
    # header band
    c.setFillColor(NAVY)
    c.rect(0, PAGE_H - 78, PAGE_W, 78, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(0, PAGE_H - 81, PAGE_W, 3, fill=1, stroke=0)
    # eyebrow
    c.setFillColor(GOLD)
    c.rect(MARGIN, PAGE_H - 34, 30, 2.5, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(MARGIN + 40, PAGE_H - 36, "CONSULT FOR AFRICA")
    c.setFillColor(LIGHT)
    c.setFont("Helvetica", 9)
    c.drawString(MARGIN + 40 + c.stringWidth("CONSULT FOR AFRICA", "Helvetica-Bold", 9) + 8,
                 PAGE_H - 36, "/  HEALTHCARE TRANSFORMATION")
    # title
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 17)
    c.drawString(MARGIN, PAGE_H - 60, "Haematology Analyser Upgrade  /  Business Case")
    c.setFillColor(GOLD)
    c.setFont("Helvetica", 9.5)
    c.drawString(MARGIN, PAGE_H - 73,
                 "Haven Paediatric Centre   /   5-part analyser acquisition, current 3-part relegated to backup")
    # icon top-right
    try:
        _ic = ImageReader(str(DOCS / "c4a-icon.png"))
        _iw, _ih = _ic.getSize()
        _h = 30.0
        _w = _h * _iw / _ih
        c.drawImage(_ic, PAGE_W - MARGIN - _w, PAGE_H - 52, width=_w, height=_h, mask="auto")
    except Exception:
        pass
    # footer
    c.setFillColor(GOLD)
    c.rect(MARGIN, 30, 22, 2, fill=1, stroke=0)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 7.6)
    c.drawString(MARGIN, 19, "Confidential  /  Prepared for Haven leadership  /  Dr Debo Odulana, Founding Partner")
    c.drawRightString(PAGE_W - MARGIN, 19, "23 July 2026")
    c.restoreState()


def card(text, bg=SURFACE, fg=BODY, bold=False, rule=GOLD):
    st = ParagraphStyle("c", parent=P, textColor=fg, spaceBefore=2, spaceAfter=2,
                        fontName="Helvetica-Bold" if bold else "Helvetica")
    t = Table([[Paragraph(text, st)]], colWidths=[PAGE_W - 2 * MARGIN])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("LINEBEFORE", (0, 0), (0, -1), 3, rule),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ]))
    return t


def kv_table(rows):
    data = [[Paragraph(r[0], CELL_W if i == 0 else CELL_B),
             Paragraph(r[1], CELL_W if i == 0 else CELL),
             Paragraph(r[2], CELL_W if i == 0 else CELL)] for i, r in enumerate(rows)]
    t = Table(data, colWidths=[PAGE_W - 2 * MARGIN - 250, 125, 125])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, SURFACE]),
        ("LINEBELOW", (0, 0), (-1, 0), 1.5, GOLD),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    return t


def build():
    doc = BaseDocTemplate(
        str(OUT), pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=90, bottomMargin=34,
        title="Haven Haematology Analyser - Business Case",
        author="Consult For Africa",
    )
    frame = Frame(MARGIN, 34, PAGE_W - 2 * MARGIN, PAGE_H - 90 - 34, id="main")
    doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=page_bg)])

    el = []

    # The decision
    el.append(Paragraph("The decision", H1))
    el.append(Paragraph(
        "Buy a Zybio 5-part haematology analyser, promote it to primary, and drop the current 3-part machine "
        "to backup. Quoted at $6,316 landed on freight. This is a low-regret capital purchase, but the case "
        "for it is redundancy and clinical quality, not new revenue, so it must be justified honestly.", P))

    # The numbers
    el.append(Paragraph("The numbers that matter", H1))
    el.append(Paragraph(
        "A haematology analyser produces the FBC. Malaria (MP) is microscopy or RDT, so it is set aside here. "
        "The relevant revenue line is FBC alone (Jan to Jun 2026 actuals from the Head of Ops):", P))
    el.append(kv_table([
        ["Line", "Monthly average", "Annualised run-rate"],
        ["FBC (the analyser's output)", "N695,296", "N8.34M"],
        ["All labs (context)", "N2,179,576", "N26.15M"],
        ["Machine, quoted landed ($6,316 at ~N1,450/$)", "one-off", "~N9.2M"],
    ]))
    el.append(Spacer(1, 3))
    el.append(Paragraph(
        "Capex is roughly 1.5 months of total lab revenue. The trap: FBC income already exists on the 3-part "
        "machine, so a second analyser does not earn it again. Any payback sold against FBC revenue is double-counting.",
        SMALL))

    # The real case
    el.append(Paragraph("The real case: three levers", H1))
    el.append(card(
        "<b>1. Business continuity.</b>&nbsp; A single analyser is a single point of failure. If it dies, "
        "N695K/month of FBC stops and children get sent out. A ~N9-13M machine is cheap insurance on an "
        "N8.3M/yr line and a N26M/yr lab, and on clinical safety in a paediatric and NICU setting.",
        bg=SURFACE, rule=TEAL))
    el.append(Spacer(1, 3))
    el.append(card(
        "<b>2. Clinical quality.</b>&nbsp; 5-part gives the full white-cell differential (neutrophils, "
        "lymphocytes, monocytes, eosinophils, basophils) versus the 3-part's coarse split. For neonatal sepsis "
        "and paediatric differentials this is a genuine standard-of-care step up.",
        bg=SURFACE, rule=TEAL))
    el.append(Spacer(1, 3))
    el.append(card(
        "<b>3. Optionality.</b>&nbsp; Fewer send-outs for 5-part differentials, and a defensible basis to hold "
        "or raise the N11,500 private tariff.",
        bg=SURFACE, rule=TEAL))

    # Cost reality
    el.append(Paragraph("Cost reality check", H1))
    el.append(Paragraph(
        "The $6,316 is machine plus freight only. It is not the landed cost. Fully landed, with duty, VAT, "
        "clearing, install and training, realistically lands nearer <b>N11-13M</b>. Three items decide the call, "
        "and none are on the quote yet:", P))
    for b in [
        "<b>Reagents.</b> The real long-run cost. 5-part reagents are pricier and often proprietary. Confirm "
        "cost per test and a local supplier. Reagent lock-in on an orphan machine is the true risk, not the sticker.",
        "<b>Service and warranty in-country.</b> Zybio is a budget brand. A 5-part with no local engineer is "
        "worse than the 3-part you trust. Confirm who services it and the warranty terms.",
        "<b>Fully landed cost.</b> Duty, VAT, clearing, installation and training added to the $6,316.",
    ]:
        el.append(Paragraph("&bull;&nbsp;&nbsp;" + b, P))

    # Verdict
    el.append(Spacer(1, 3))
    el.append(card(
        "<b>Verdict: Conditional GO.</b>&nbsp; The capex is small, the continuity and clinical-quality logic is "
        "sound for a paediatric centre, and the downside is bounded. Approve subject to the three answers above. "
        "If reagent cost per FBC sits comfortably under the tariff and local service exists, it is a clear yes. If "
        "reagents are proprietary and imported with no local support, pause and price a mainstream brand (Sysmex "
        "or Mindray) even at a higher sticker, because uptime beats unit price here.",
        bg=HexColor("#EAF3EC"), rule=GREEN))

    doc.build(el)
    print(f"wrote {OUT}")


if __name__ == "__main__":
    build()
