"""
Shared markdown-to-PDF renderer in CFA house style, for the Osteon Clinics
audit documents.

Style and page furniture only. No content. It is a generalisation of
scripts/build-osteon-docs.py: output path, header and footer are parameters,
tables size themselves from their content, and numbered and checkbox lists
render. Import this rather than copying it.
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
AVAIL = PAGE_W - 2 * MARGIN

H1 = ParagraphStyle("h1", fontName="Helvetica-Bold", fontSize=14.5, leading=18.5,
                    textColor=NAVY, spaceBefore=13, spaceAfter=7, alignment=TA_LEFT)
H2 = ParagraphStyle("h2", fontName="Helvetica-Bold", fontSize=11.5, leading=15,
                    textColor=TEAL, spaceBefore=10, spaceAfter=3, alignment=TA_LEFT)
H3 = ParagraphStyle("h3", fontName="Helvetica-BoldOblique", fontSize=10.3, leading=14,
                    textColor=NAVY, spaceBefore=8, spaceAfter=2, alignment=TA_LEFT)
P = ParagraphStyle("p", fontName="Helvetica", fontSize=10.3, leading=15,
                   textColor=BODY, spaceAfter=6, alignment=TA_LEFT)
BUL = ParagraphStyle("bul", parent=P, leftIndent=12, spaceAfter=3)
NUM = ParagraphStyle("num", parent=P, leftIndent=15, spaceAfter=4)
QUOTE = ParagraphStyle("quote", fontName="Helvetica", fontSize=10, leading=15,
                       textColor=HexColor("#243b53"), alignment=TA_LEFT)
SMALL = ParagraphStyle("small", fontName="Helvetica", fontSize=8.5, leading=12, textColor=MUTED)
CELL = ParagraphStyle("cell", fontName="Helvetica", fontSize=9, leading=12.5, textColor=BODY)
CELL_B = ParagraphStyle("cellb", parent=CELL, fontName="Helvetica-Bold")
CELL_W = ParagraphStyle("cellw", fontName="Helvetica-Bold", fontSize=9.3, leading=12.5, textColor=white)


def inline(text: str) -> str:
    """Markdown inline to reportlab mini-HTML, with safe escaping."""
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    # glyphs outside the standard font encoding
    text = text.replace("\u2192", "&gt;").replace("\u2190", "&lt;")
    text = text.replace("\u2011", "-").replace("\u2013", "-").replace("\u2014", "-")
    text = re.sub(r"\[([^\]]+)\]\((?:[^)]+)\)", r"\1", text)
    text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
    text = re.sub(r"(?<!\*)\*(?!\s)(.+?)(?<!\s)\*", r"<i>\1</i>", text)
    text = re.sub(r"`(.+?)`", r'<font face="Courier">\1</font>', text)
    return text


def col_widths(rows):
    """Size columns from their content, so a narrow index column stays narrow."""
    n = len(rows[0])
    # longest word sets the floor, mean length sets the share
    weight = []
    for j in range(n):
        lens = [len(re.sub(r"[*`]", "", r[j])) for r in rows if j < len(r)]
        body_len = sum(lens[1:]) / max(1, len(lens) - 1)
        weight.append(max(float(lens[0]), body_len, 4.0))
    total = sum(weight)
    share = [w / total for w in weight]
    # nothing narrower than 7 per cent or wider than 60
    share = [min(0.60, max(0.07, s)) for s in share]
    total = sum(share)
    return [AVAIL * s / total for s in share]


def make_page_furniture(header_label: str, footer_label: str):
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
        c.drawString(MARGIN, 18, footer_label)
        c.drawRightString(PAGE_W - MARGIN, 18, "Page %d" % doc.page)
        try:
            ic = ImageReader(str(DOCS / "c4a-icon.png"))
            iw, ih = ic.getSize()
            h = 22.0
            w = h * iw / ih
            c.drawImage(ic, PAGE_W - MARGIN - w, PAGE_H - 61, width=w, height=h, mask="auto")
        except Exception:
            pass
        c.restoreState()

    return cover_bg, content_bg


def quote_card(lines):
    inner = [[Paragraph(inline(ln) if ln.strip() else "&nbsp;", QUOTE)] for ln in lines]
    t = Table(inner, colWidths=[AVAIL - 16])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), QUOTEBG),
        ("LINEBEFORE", (0, 0), (0, -1), 3, GOLD),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ]))
    outer = Table([[t]], colWidths=[AVAIL])
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
    t = Table(data, colWidths=col_widths(rows), repeatRows=1)
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


def build_doc(src: Path, out: Path, header_label: str, footer_label: str):
    lines = src.read_text(encoding="utf-8").splitlines()

    # cover: title, subtitle, meta lines, up to the first rule
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

    cover_bg, content_bg = make_page_furniture(header_label, footer_label)
    out.parent.mkdir(parents=True, exist_ok=True)
    doc = BaseDocTemplate(
        str(out), pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=52, bottomMargin=42,
        title=f"{title} - Consult For Africa", author="Consult For Africa",
    )
    doc.addPageTemplates([
        PageTemplate(id="cover",
                     frames=[Frame(MARGIN, 150, AVAIL, PAGE_H - 300, id="cover")],
                     onPage=cover_bg),
        PageTemplate(id="content",
                     frames=[Frame(MARGIN, 42, AVAIL, PAGE_H - 52 - 42, id="content")],
                     onPage=content_bg),
    ])

    el = [Spacer(1, 30), Paragraph(inline(title), ParagraphStyle(
        "ctitle", fontName="Helvetica-Bold", fontSize=27, leading=31, textColor=white))]
    if subtitle:
        el += [Spacer(1, 10), Paragraph(inline(subtitle), ParagraphStyle(
            "csub", fontName="Helvetica-Bold", fontSize=13.5, leading=18, textColor=GOLD))]
    el.append(Spacer(1, 26))
    for mline in meta:
        el.append(Paragraph(inline(mline), ParagraphStyle(
            "cmeta", fontName="Helvetica", fontSize=10.5, leading=17, textColor=white)))
    el += [NextPageTemplate("content"), PageBreak()]

    n = len(body)
    k = 0
    while k < n:
        s = body[k].strip()

        if s in ("---", ""):
            k += 1
            continue

        if s.startswith("|"):
            tbl = []
            while k < n and body[k].strip().startswith("|"):
                cells = [c.strip() for c in body[k].strip().strip("|").split("|")]
                if not re.match(r"^[\s:\-]+$", "".join(cells)):
                    tbl.append(cells)
                k += 1
            if tbl:
                el += [Spacer(1, 2), render_table(tbl), Spacer(1, 6)]
            continue

        if s.startswith(">"):
            q = []
            while k < n and body[k].strip().startswith(">"):
                q.append(body[k].strip()[1:].strip())
                k += 1
            while q and not q[0]:
                q.pop(0)
            while q and not q[-1]:
                q.pop()
            el.append(quote_card(q))
            continue

        if s.startswith("#### "):
            el.append(Paragraph(inline(s[5:]), H3))
            k += 1
            continue
        if s.startswith("### "):
            el.append(Paragraph(inline(s[4:]), H3 if s[4:].endswith(".") else H2))
            k += 1
            continue
        if s.startswith("## "):
            # a heading with nothing under it yet needs room to start
            el.append(KeepTogether([Paragraph(inline(s[3:]), H1)]))
            k += 1
            continue
        if s.startswith("# "):
            el.append(Paragraph(inline(s[2:]), H1))
            k += 1
            continue

        mnum = re.match(r"^(\d+)\.\s+(.*)$", s)
        if mnum:
            el.append(Paragraph("<b>%s.</b>&nbsp;&nbsp;%s" % (mnum.group(1), inline(mnum.group(2))), NUM))
            k += 1
            continue

        if s.startswith("- [ ] "):
            el.append(Paragraph("&#9744;&nbsp;&nbsp;" + inline(s[6:]), BUL))
            k += 1
            continue

        if s.startswith("- ") or s.startswith("* "):
            el.append(Paragraph("&#8226;&nbsp;&nbsp;" + inline(s[2:]), BUL))
            k += 1
            continue

        if s.startswith("*") and s.endswith("*") and s.count("*") == 2:
            el += [Spacer(1, 4), Paragraph(inline(s), SMALL)]
            k += 1
            continue

        el.append(Paragraph(inline(s), P))
        k += 1

    doc.build(el)
    print("wrote %s" % out)
