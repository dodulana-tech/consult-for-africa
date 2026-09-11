"""
Build the Haven Paediatric Centre strategic plan PDF for Consult For Africa.

Source narrative: docs/haven-strategic-outlook-cfa.md  (edit this, then rebuild)
Output:          docs/haven-strategic-outlook-cfa.pdf   (A4, multi-page, branded)

This renderer parses a small, fixed subset of Markdown so the .md stays the
single source of truth:
  ## H1   ### H2   > callout   - bullet   | tables |   **bold**
Front matter (everything up to the first '---') is ignored; the cover is drawn
here. Horizontal rules ('---') in the body are treated as separators (skipped).

Run:
  python3 scripts/build-haven-strategic-outlook.py
"""

from __future__ import annotations

import re
from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
SRC = DOCS / "haven-strategic-outlook-cfa.md"
OUT = DOCS / "haven-strategic-outlook-cfa.pdf"

NAVY = HexColor("#0B3C5D")
DEEP_NAVY = HexColor("#081521")
GOLD = HexColor("#D4AF37")
TEAL = HexColor("#1F7A8C")
BODY = HexColor("#1F2937")
MUTED = HexColor("#6B7280")
SURFACE = HexColor("#F1F5F9")
LIGHT = HexColor("#C9D6E0")

PAGE_W, PAGE_H = A4
MARGIN = 46


def style(name, **kw):
    base = dict(fontName="Helvetica", fontSize=10.5, leading=15.5, textColor=BODY,
                alignment=TA_LEFT, spaceAfter=7)
    base.update(kw)
    return ParagraphStyle(name, **base)


H1 = style("h1", fontName="Helvetica-Bold", fontSize=15, leading=19, textColor=NAVY,
           spaceBefore=15, spaceAfter=8)
H2 = style("h2", fontName="Helvetica-Bold", fontSize=11.5, leading=15, textColor=TEAL,
           spaceBefore=9, spaceAfter=4)
P = style("p")
LEDE = style("lede", fontSize=11, leading=16.5, textColor=HexColor("#374151"))
LETTER = style("letter", fontSize=10.5, leading=16, textColor=BODY, spaceAfter=9)
SIG = style("sig", fontName="Helvetica-Bold", fontSize=10.5, leading=14, textColor=NAVY)
SMALL = style("small", fontSize=8.5, leading=12, textColor=MUTED)
CELL = style("cell", fontSize=9, leading=12.5)
CELL_B = style("cellb", fontSize=9, leading=12.5, fontName="Helvetica-Bold")
CELL_W = style("cellw", fontSize=9, leading=12.5, fontName="Helvetica-Bold", textColor=white)


def fmt(s: str) -> str:
    """Escape XML, then turn **bold** into <b>bold</b>."""
    s = s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    s = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", s)
    return s


def cover_bg(c, doc):
    c.saveState()
    c.setFillColor(NAVY)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.setFillColor(DEEP_NAVY)
    c.rect(0, 0, PAGE_W, 10, fill=1, stroke=0)
    c.rect(0, PAGE_H - 10, PAGE_W, 10, fill=1, stroke=0)
    x = MARGIN
    c.setFillColor(GOLD)
    c.rect(x, PAGE_H - 150, 40, 3, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(GOLD)
    c.drawString(x + 50, PAGE_H - 153, "CONSULT FOR AFRICA")
    c.setFillColor(LIGHT)
    c.setFont("Helvetica", 10)
    c.drawString(x + 50 + c.stringWidth("CONSULT FOR AFRICA", "Helvetica-Bold", 10) + 10,
                 PAGE_H - 153, "/  HEALTHCARE TRANSFORMATION")
    c.setFillColor(GOLD)
    c.rect(x, 150, 60, 3, fill=1, stroke=0)
    c.setFillColor(LIGHT)
    c.setFont("Helvetica", 9)
    c.drawString(x, 128, "hello@consultforafrica.com   /   +234 913 813 8553   /   consultforafrica.com")
    c.drawString(x, 112, "Lagos and Abuja, Nigeria")
    c.restoreState()


def content_bg(c, doc):
    c.saveState()
    c.setFillColor(NAVY)
    c.rect(0, PAGE_H - 34, PAGE_W, 34, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(0, PAGE_H - 37, PAGE_W, 3, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(MARGIN, PAGE_H - 23, "CONSULT FOR AFRICA")
    c.setFillColor(LIGHT)
    c.setFont("Helvetica", 8.5)
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 23, "Haven Paediatric Centre  /  Strategic Plan")
    c.setFillColor(GOLD)
    c.rect(MARGIN, 30, 24, 2, fill=1, stroke=0)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8)
    c.drawString(MARGIN, 18, "Confidential  /  Prepared for the Haven Paediatric Centre board")
    c.drawRightString(PAGE_W - MARGIN, 18, "Page %d" % doc.page)
    try:
        _ic = ImageReader(str(DOCS / "c4a-icon.png"))
        _iw, _ih = _ic.getSize()
        _h = 22.0
        _w = _h * _iw / _ih
        c.drawImage(_ic, PAGE_W - MARGIN - _w, PAGE_H - 61, width=_w, height=_h, mask="auto")
    except Exception:
        pass
    c.restoreState()


def card(text, bg=SURFACE, fg=BODY, bold=False):
    st = ParagraphStyle("c", parent=P, textColor=fg, leftIndent=8, rightIndent=8,
                        spaceBefore=4, spaceAfter=4,
                        fontName="Helvetica-Bold" if bold else "Helvetica")
    t = Table([[Paragraph(text, st)]], colWidths=[PAGE_W - 2 * MARGIN])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("LINEBEFORE", (0, 0), (0, -1), 3, GOLD),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
    ]))
    return t


def make_table(rows):
    ncol = len(rows[0])
    avail = PAGE_W - 2 * MARGIN
    # first column narrow, remaining share the rest
    if ncol == 1:
        widths = [avail]
    else:
        first = avail * 0.20
        rest = (avail - first) / (ncol - 1)
        widths = [first] + [rest] * (ncol - 1)
    data = []
    for i, r in enumerate(rows):
        if i == 0:
            data.append([Paragraph(fmt(c), CELL_W) for c in r])
        else:
            data.append([Paragraph(fmt(c), CELL_B if j == 0 else CELL) for j, c in enumerate(r)])
    t = Table(data, colWidths=widths, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, SURFACE]),
        ("LINEBELOW", (0, 0), (-1, 0), 2, GOLD),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    return t


def is_table_sep(line: str) -> bool:
    return bool(re.match(r"^\|?[\s:\-|]+\|?$", line)) and "-" in line


def parse_body(lines):
    """Yield flowables from the markdown body."""
    el = []
    i = 0
    n = len(lines)
    in_letter = False
    while i < n:
        raw = lines[i]
        line = raw.rstrip()
        stripped = line.strip()

        if stripped in ("---", "***", ""):
            i += 1
            continue

        # tables: a run of lines starting with |
        if stripped.startswith("|"):
            block = []
            while i < n and lines[i].strip().startswith("|"):
                if not is_table_sep(lines[i].strip()):
                    cells = [c.strip() for c in lines[i].strip().strip("|").split("|")]
                    block.append(cells)
                i += 1
            if block:
                el.append(Spacer(1, 2))
                el.append(make_table(block))
                el.append(Spacer(1, 4))
            continue

        if line.startswith("## "):
            in_letter = line[3:].strip().lower().startswith("a letter")
            el.append(Paragraph(fmt(line[3:].strip()), H1))
            i += 1
            continue
        if line.startswith("### "):
            el.append(Paragraph(fmt(line[4:].strip()), H2))
            i += 1
            continue
        if line.startswith("> "):
            el.append(card(fmt(line[2:].strip()), bg=SURFACE))
            i += 1
            continue
        if line.startswith("- "):
            el.append(Paragraph("&bull;&nbsp;&nbsp;" + fmt(line[2:].strip()), P))
            i += 1
            continue

        # signature lines (Dr Debo Odulana ... Founding Partner ...)
        if stripped == "Dr Debo Odulana":
            el.append(Spacer(1, 4))
            el.append(Paragraph(fmt(stripped), SIG))
            i += 1
            continue
        if stripped.startswith("Founding Partner"):
            el.append(Paragraph(fmt(stripped), SMALL))
            i += 1
            continue

        # default paragraph
        el.append(Paragraph(fmt(stripped), LETTER if in_letter else P))
        i += 1
    return el


def build():
    md = SRC.read_text(encoding="utf-8")
    lines = md.split("\n")
    # drop front matter up to and including the first horizontal rule
    start = 0
    for idx, l in enumerate(lines):
        if l.strip() == "---":
            start = idx + 1
            break
    body_lines = lines[start:]

    doc = BaseDocTemplate(
        str(OUT), pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=52, bottomMargin=42,
        title="Haven Paediatric Centre - Strategic Plan",
        author="Consult For Africa",
    )
    content_frame = Frame(MARGIN, 42, PAGE_W - 2 * MARGIN, PAGE_H - 52 - 42, id="content")
    cover_frame = Frame(MARGIN, 170, PAGE_W - 2 * MARGIN, PAGE_H - 330, id="cover")
    doc.addPageTemplates([
        PageTemplate(id="cover", frames=[cover_frame], onPage=cover_bg),
        PageTemplate(id="content", frames=[content_frame], onPage=content_bg),
    ])

    el = []
    el.append(Spacer(1, 40))
    el.append(Paragraph("Haven Paediatric Centre",
                        ParagraphStyle("ct", fontName="Helvetica-Bold", fontSize=30,
                                       leading=34, textColor=white)))
    el.append(Spacer(1, 10))
    el.append(Paragraph("Strategic plan: the moves, costed",
                        ParagraphStyle("cs", fontName="Helvetica-Bold", fontSize=15,
                                       leading=20, textColor=GOLD)))
    el.append(Spacer(1, 26))
    el.append(Paragraph(
        "Fifteen concrete moves across revenue, cost and structure, each with what it is, "
        "what it earns or saves, what it takes, and when. Grounded in the Lagos market as it "
        "prices care today.",
        ParagraphStyle("cp", fontName="Helvetica", fontSize=11.5, leading=18, textColor=LIGHT)))
    el.append(Spacer(1, 30))
    for line in [
        "Date:  26 August 2026",
        "For:  Mr Kabir Aregbesola, Mrs Abisodun Alli, Dr Shakirah Saliu, Dr Odedina, Mr Ogochukwu Odum",
        "From:  Dr Debo Odulana, Founding Partner, Consult for Africa",
    ]:
        el.append(Paragraph(line, ParagraphStyle("cm", fontName="Helvetica", fontSize=10.5,
                                                  leading=18, textColor=white)))
    el.append(NextPageTemplate("content"))
    el.append(PageBreak())

    el.extend(parse_body(body_lines))

    doc.build(el)
    print(f"wrote {OUT}")


if __name__ == "__main__":
    build()
