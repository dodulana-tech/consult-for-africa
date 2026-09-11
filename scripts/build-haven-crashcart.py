"""
Build the Haven crash-cart standard + shift checklist PDF (printable, hangs on the cart).

Source: docs/haven-crash-cart-standard.md
Output: docs/haven-crash-cart-standard-cfa.pdf

Run: python3 scripts/build-haven-crashcart.py
"""
from __future__ import annotations
from pathlib import Path
from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.platypus import (
    BaseDocTemplate, Frame, KeepTogether, PageTemplate, Paragraph, Spacer, Table, TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
OUT = DOCS / "haven-crash-cart-standard-cfa.pdf"

NAVY = HexColor("#0B3C5D"); GOLD = HexColor("#D4AF37"); TEAL = HexColor("#1F7A8C")
BODY = HexColor("#1F2937"); MUTED = HexColor("#6B7280"); SURFACE = HexColor("#F1F5F9")
LIGHT = HexColor("#C9D6E0"); CREAM = HexColor("#FBF6E6")
PAGE_W, PAGE_H = A4
MARGIN = 46


def sty(name, **kw):
    base = dict(fontName="Helvetica", fontSize=9.7, leading=13.5, textColor=BODY, alignment=TA_LEFT, spaceAfter=3)
    base.update(kw); return ParagraphStyle(name, **base)


H1 = sty("h1", fontName="Helvetica-Bold", fontSize=11.5, leading=14, textColor=NAVY, spaceBefore=11, spaceAfter=5)
P = sty("p"); SMALL = sty("small", fontSize=8.3, leading=11.5, textColor=MUTED)
BOXTXT = sty("box", fontSize=9.5, leading=12.5)


def furniture(c, doc):
    c.saveState()
    c.setFillColor(NAVY); c.rect(0, PAGE_H - 34, PAGE_W, 34, fill=1, stroke=0)
    c.setFillColor(GOLD); c.rect(0, PAGE_H - 37, PAGE_W, 3, fill=1, stroke=0)
    c.setFillColor(white); c.setFont("Helvetica-Bold", 8.5)
    c.drawString(MARGIN, PAGE_H - 23, "CONSULT FOR AFRICA")
    c.setFillColor(LIGHT); c.setFont("Helvetica", 8.5)
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 23, "Haven Paediatric Centre  /  Crash-Cart Standard")
    c.setFillColor(GOLD); c.rect(MARGIN, 30, 24, 2, fill=1, stroke=0)
    c.setFillColor(MUTED); c.setFont("Helvetica", 8)
    c.drawString(MARGIN, 18, "Consult for Africa  /  Week-1 quick win  /  finalise contents with clinical leads")
    c.drawRightString(PAGE_W - MARGIN, 18, "Page %d" % doc.page)
    try:
        _ic = ImageReader(str(DOCS / "c4a-icon.png")); _iw, _ih = _ic.getSize()
        _h = 22.0; _w = _h * _iw / _ih
        c.drawImage(_ic, PAGE_W - MARGIN - _w, PAGE_H - 61, width=_w, height=_h, mask="auto")
    except Exception:
        pass
    c.restoreState()


def checklist(title, items, cols=1):
    """Grouped checkbox list. Each item gets a real empty box to tick."""
    out = [Paragraph(title, ParagraphStyle("cg", parent=P, fontName="Helvetica-Bold", textColor=TEAL, spaceBefore=6, spaceAfter=3))]
    rows = [[Paragraph("", P), Paragraph(t, BOXTXT)] for t in items]
    t = Table(rows, colWidths=[16, PAGE_W - 2 * MARGIN - 16])
    ts = [("VALIGN", (0, 0), (-1, -1), "TOP"),
          ("TOPPADDING", (0, 0), (-1, -1), 3), ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
          ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 6)]
    for i in range(len(rows)):
        ts.append(("BOX", (0, i), (0, i), 0.8, NAVY))
        ts.append(("TOPPADDING", (0, i), (0, i), 3))
    t.setStyle(TableStyle(ts))
    out.append(t)
    return out


def build():
    doc = BaseDocTemplate(str(OUT), pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN,
                          topMargin=50, bottomMargin=40, title="Haven Crash-Cart Standard", author="Consult For Africa")
    frame = Frame(MARGIN, 40, PAGE_W - 2 * MARGIN, PAGE_H - 50 - 40, id="f")
    doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=furniture)])
    el = []
    el.append(Paragraph("Crash-Cart Standard &amp; Shift Checklist", ParagraphStyle("t", fontName="Helvetica-Bold", fontSize=18, leading=21, textColor=NAVY, spaceAfter=2)))
    el.append(Paragraph("Haven Paediatric Centre  ·  Week-1 quick win", ParagraphStyle("s", fontName="Helvetica-Bold", fontSize=11.5, leading=14, textColor=TEAL, spaceAfter=6)))
    el.append(Paragraph(
        "A stocked, sealed, checklist-governed paediatric crash cart with a routine that runs every shift, by "
        "habit, not reminder. Finalise contents and doses with Dr Shakirah and Dr Odedina against Haven's "
        "protocols and patient mix; this is the operating standard, not a clinical prescription.", P))

    el.append(Paragraph("The standard", H1))
    for i, s in enumerate([
        "<b>One cart, one standard layout.</b> Same drawer for the same thing, every time. A laminated contents map on the cart.",
        "<b>Sealed when ready.</b> A numbered breakaway seal. Intact seal = complete and in date. Broken seal = restock, re-check and re-seal before it counts as ready.",
        "<b>Checked every shift.</b> At the start of each shift the responsible nurse confirms the seal is intact and its number matches the log. A full contents-and-expiry check at least daily and after every use.",
        "<b>Restocked immediately after any use.</b> Returned to full, in-date and re-sealed before the shift ends — never 'later'.",
        "<b>Owned.</b> A named role (matron / shift lead) owns cart readiness each shift and signs the log.",
    ], 1):
        el.append(Paragraph(str(i) + ".&nbsp;&nbsp;" + s, P))

    el.append(Paragraph("Shift check log (kept on the cart)", H1))
    hdr = ["Date", "Shift", "Seal intact?", "Seal # matches?", "Full check (daily)", "Used?", "Restocked &amp; re-sealed", "Checked by"]
    data = [[Paragraph(h, ParagraphStyle("ch", fontName="Helvetica-Bold", fontSize=7.6, leading=9, textColor=white)) for h in hdr]]
    for _ in range(8):
        data.append([Paragraph("", P) for _ in hdr])
    cw = PAGE_W - 2 * MARGIN
    widths = [cw*0.13, cw*0.10, cw*0.12, cw*0.13, cw*0.14, cw*0.08, cw*0.16, cw*0.14]
    t = Table(data, colWidths=widths, rowHeights=[20] + [22]*8)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY), ("LINEBELOW", (0, 0), (-1, 0), 1.5, GOLD),
        ("GRID", (0, 1), (-1, -1), 0.5, LIGHT), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4), ("RIGHTPADDING", (0, 0), (-1, -1), 4),
    ]))
    el.append(t)

    el.append(Paragraph("Contents checklist (confirm / adjust with clinical leads)", H1))
    el.extend(checklist("Airway / breathing", [
        "Paediatric &amp; neonatal bag-valve-mask; masks (sizes)",
        "Oxygen source + tubing; suction + catheters (sizes)",
        "Oropharyngeal airways (range); ET tubes (range) + introducer; laryngoscope + blades (working, spare batteries)",
    ]))
    el.extend(checklist("Circulation / access", [
        "IV cannulae (paediatric / neonatal range); IO access device",
        "Syringes, needles, giving sets; fluids (per protocol); tape, tourniquet, gloves",
    ]))
    el.extend(checklist("Emergency drugs (doses per Haven paediatric / neonatal protocol)", [
        "Adrenaline / epinephrine", "Atropine", "Dextrose (appropriate concentration)", "Adenosine",
        "Amiodarone", "Naloxone", "Hydrocortisone", "Salbutamol / bronchodilator",
        "Anticonvulsant (per protocol)", "Sodium bicarbonate (per protocol)", "Normal saline / flushes",
    ]))
    el.extend(checklist("Monitoring / equipment", [
        "Pulse oximeter (paediatric / neonatal probe)", "Glucometer + strips",
        "BP cuffs (sizes); thermometer", "Defibrillator with paediatric pads/paddles (if applicable), checked &amp; charged",
    ]))
    el.extend(checklist("Documentation", [
        "Paediatric resuscitation algorithm / weight-dose chart on the cart",
        "Broselow-style weight/dose reference (if used); incident / resuscitation record forms",
    ]))

    el.append(Spacer(1, 8))
    box = Table([[Paragraph("This standard, plus the shift log, is the first thing we put in place. It costs almost "
                            "nothing, and it is the clearest signal to the team that the way things are done is changing.",
                            ParagraphStyle("wc", parent=P, fontName="Helvetica-Bold", textColor=NAVY))]],
                colWidths=[PAGE_W - 2 * MARGIN])
    box.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), CREAM), ("LINEBEFORE", (0, 0), (0, -1), 3, GOLD),
                             ("TOPPADDING", (0, 0), (-1, -1), 8), ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                             ("LEFTPADDING", (0, 0), (-1, -1), 12), ("RIGHTPADDING", (0, 0), (-1, -1), 12)]))
    el.append(box)
    doc.build(el)
    print(f"wrote {OUT}")


if __name__ == "__main__":
    build()
