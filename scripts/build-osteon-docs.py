"""
Render the remaining Osteon / Dr Bola Akinola markdown deliverables to branded PDFs
(house navy/gold style), using a shared markdown renderer.

Covers:
  docs/osteon-akinola-discovery-questionnaire-cfa.md  -> .pdf
  docs/osteon-akinola-website-brief-cfa.md            -> .pdf
  docs/osteon-akinola-referrer-engine-cfa.md          -> .pdf

Run:
  python3 scripts/build-osteon-docs.py
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

NAVY = HexColor("#0B3C5D")
DEEP_NAVY = HexColor("#081521")
GOLD = HexColor("#D4AF37")
TEAL = HexColor("#1F7A8C")
BODY = HexColor("#1F2937")
MUTED = HexColor("#6B7280")
SURFACE = HexColor("#F1F5F9")
LIGHT = HexColor("#C9D6E0")
QUOTEBG = HexColor("#EEF3F6")

PAGE_W, PAGE_H = A4
MARGIN = 46

H1 = ParagraphStyle("h1", fontName="Helvetica-Bold", fontSize=14.5, leading=18.5,
                    textColor=NAVY, spaceBefore=13, spaceAfter=7, alignment=TA_LEFT)
H2 = ParagraphStyle("h2", fontName="Helvetica-Bold", fontSize=11.5, leading=15,
                    textColor=TEAL, spaceBefore=9, spaceAfter=3, alignment=TA_LEFT)
P = ParagraphStyle("p", fontName="Helvetica", fontSize=10.3, leading=15,
                   textColor=BODY, spaceAfter=6, alignment=TA_LEFT)
BUL = ParagraphStyle("bul", parent=P, leftIndent=12, spaceAfter=3)
QUOTE = ParagraphStyle("quote", fontName="Helvetica", fontSize=10, leading=15,
                       textColor=HexColor("#243b53"), alignment=TA_LEFT)
SMALL = ParagraphStyle("small", fontName="Helvetica", fontSize=8.5, leading=12, textColor=MUTED)
CELL = ParagraphStyle("cell", fontName="Helvetica", fontSize=9, leading=12.5, textColor=BODY)
CELL_B = ParagraphStyle("cellb", parent=CELL, fontName="Helvetica-Bold")
CELL_W = ParagraphStyle("cellw", fontName="Helvetica-Bold", fontSize=9.3, leading=12.5, textColor=white)


def inline(text: str) -> str:
    """Markdown inline -> reportlab mini-HTML, with safe escaping."""
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    # glyphs not in the standard font encoding
    text = text.replace("→", "&gt;").replace("←", "&lt;")
    text = text.replace("‑", "-").replace("–", "-").replace("—", "-")
    # links [text](url) -> text
    text = re.sub(r"\[([^\]]+)\]\((?:[^)]+)\)", r"\1", text)
    # bold then italic then code
    text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
    text = re.sub(r"(?<!\*)\*(?!\s)(.+?)(?<!\s)\*", r"<i>\1</i>", text)
    text = re.sub(r"`(.+?)`", r'<font face="Courier">\1</font>', text)
    return text


def col_widths(ncols: int):
    avail = PAGE_W - 2 * MARGIN
    if ncols == 2:
        w = [0.30, 0.70]
    elif ncols == 3:
        w = [0.22, 0.40, 0.38]
    elif ncols == 4:
        w = [0.16, 0.42, 0.22, 0.20]
    else:
        w = [1.0 / ncols] * ncols
    return [avail * x for x in w]


def make_page_furniture(header_label: str):
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
        c.setFont("Helvetica", 9)
        c.drawString(x, 128, "hello@consultforafrica.com   /   +234 913 813 8553   /   consultforafrica.com")
        c.drawString(x, 112, "Lagos and Abuja, Nigeria")
        c.setFillColor(GOLD)
        c.rect(x, 150, 60, 3, fill=1, stroke=0)
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
        c.drawRightString(PAGE_W - MARGIN, PAGE_H - 23, header_label)
        c.setFillColor(GOLD)
        c.rect(MARGIN, 30, 24, 2, fill=1, stroke=0)
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 8)
        c.drawString(MARGIN, 18, "Confidential  /  Prepared for Dr Bolarinwa Akinola")
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

    return cover_bg, content_bg


def quote_card(lines):
    inner = [[Paragraph(inline(ln) if ln.strip() else "&nbsp;", QUOTE)] for ln in lines]
    t = Table(inner, colWidths=[PAGE_W - 2 * MARGIN - 16])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), QUOTEBG),
        ("LINEBEFORE", (0, 0), (0, -1), 3, GOLD),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ]))
    outer = Table([[t]], colWidths=[PAGE_W - 2 * MARGIN])
    outer.setStyle(TableStyle([
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))
    return outer


def render_table(rows):
    data = []
    for i, r in enumerate(rows):
        cells = []
        for j, cval in enumerate(r):
            st = CELL_W if i == 0 else (CELL_B if j == 0 else CELL)
            cells.append(Paragraph(inline(cval), st))
        data.append(cells)
    t = Table(data, colWidths=col_widths(len(rows[0])))
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("LINEBELOW", (0, 0), (-1, 0), 2, GOLD),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, SURFACE]),
    ]))
    return t


def build_doc(md_name: str, header_label: str):
    src = DOCS / md_name
    out = src.with_suffix(".pdf")
    lines = src.read_text(encoding="utf-8").splitlines()

    # --- parse cover (title, subtitle, meta) up to first '---' ---
    title, subtitle, meta = "", "", []
    i = 0
    while i < len(lines) and lines[i].strip() != "---":
        ln = lines[i].strip()
        if ln.startswith("# ") and not title:
            title = ln[2:].strip()
        elif ln.startswith("**") and ln.endswith("**") and not subtitle:
            subtitle = ln.strip("*").strip()
        elif ln and not ln.startswith("#"):
            meta.append(ln.replace("**", ""))
        i += 1
    body = lines[i + 1:] if i < len(lines) else []

    cover_bg, content_bg = make_page_furniture(header_label)
    doc = BaseDocTemplate(
        str(out), pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=52, bottomMargin=42,
        title=f"{title} - Consult For Africa", author="Consult For Africa",
    )
    content_frame = Frame(MARGIN, 42, PAGE_W - 2 * MARGIN, PAGE_H - 52 - 42, id="content")
    cover_frame = Frame(MARGIN, 150, PAGE_W - 2 * MARGIN, PAGE_H - 300, id="cover")
    doc.addPageTemplates([
        PageTemplate(id="cover", frames=[cover_frame], onPage=cover_bg),
        PageTemplate(id="content", frames=[content_frame], onPage=content_bg),
    ])

    el = []
    # cover content
    el.append(Spacer(1, 30))
    el.append(Paragraph(inline(title), ParagraphStyle(
        "ctitle", fontName="Helvetica-Bold", fontSize=27, leading=31, textColor=white)))
    if subtitle:
        el.append(Spacer(1, 10))
        el.append(Paragraph(inline(subtitle), ParagraphStyle(
            "csub", fontName="Helvetica-Bold", fontSize=13.5, leading=18, textColor=GOLD)))
    el.append(Spacer(1, 26))
    for m in meta:
        el.append(Paragraph(inline(m), ParagraphStyle(
            "cmeta", fontName="Helvetica", fontSize=10.5, leading=17, textColor=white)))
    el.append(NextPageTemplate("content"))
    el.append(PageBreak())

    # --- body walk ---
    n = len(body)
    k = 0
    while k < n:
        raw = body[k]
        s = raw.strip()

        if s == "---" or s == "":
            k += 1
            continue

        # table block
        if s.startswith("|"):
            tbl = []
            while k < n and body[k].strip().startswith("|"):
                row = body[k].strip().strip("|")
                cells = [c.strip() for c in row.split("|")]
                if not re.match(r"^[\s:\-]+$", "".join(cells)):  # skip |---| separator
                    tbl.append(cells)
                k += 1
            if tbl:
                el.append(Spacer(1, 2))
                el.append(render_table(tbl))
                el.append(Spacer(1, 6))
            continue

        # blockquote block
        if s.startswith(">"):
            q = []
            while k < n and body[k].strip().startswith(">"):
                q.append(body[k].strip()[1:].strip())
                k += 1
            # trim leading/trailing blanks
            while q and not q[0]:
                q.pop(0)
            while q and not q[-1]:
                q.pop()
            el.append(quote_card(q))
            continue

        # headings
        if s.startswith("### "):
            el.append(Paragraph(inline(s[4:]), H2))
            k += 1
            continue
        if s.startswith("## "):
            el.append(Paragraph(inline(s[3:]), H1))
            k += 1
            continue
        if s.startswith("# "):
            el.append(Paragraph(inline(s[2:]), H1))
            k += 1
            continue

        # bullets
        if s.startswith("- ") or s.startswith("* "):
            el.append(Paragraph("&#8226;&nbsp;&nbsp;" + inline(s[2:]), BUL))
            k += 1
            continue

        # italic-only footer line
        if s.startswith("*") and s.endswith("*") and s.count("*") == 2:
            el.append(Spacer(1, 4))
            el.append(Paragraph(inline(s), SMALL))
            k += 1
            continue

        # default paragraph
        el.append(Paragraph(inline(s), P))
        k += 1

    doc.build(el)
    print(f"wrote {out}")


DOCS_TO_BUILD = [
    ("osteon-akinola-discovery-questionnaire-cfa.md", "Osteon  /  Positioning Discovery"),
    ("osteon-akinola-website-brief-cfa.md", "Dr Bola Akinola  /  Website Rebuild Brief"),
    ("osteon-akinola-referrer-engine-cfa.md", "Dr Bola Akinola  /  The Referrer Engine"),
    ("osteon-akinola-doctor-portal-cfa.md", "Dr Bola Akinola  /  Clinical Community Portal"),
    ("orthosurplus-akinola-group-strategy-cfa.md", "OrthoSurplus + Dr Bola  /  Working Together"),
]


if __name__ == "__main__":
    for name, label in DOCS_TO_BUILD:
        build_doc(name, label)
