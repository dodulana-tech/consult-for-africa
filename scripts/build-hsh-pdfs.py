"""
Render HSH board markdown documents to branded, multi-page A4 PDFs for
Consult For Africa. A small markdown -> platypus converter that handles the
subset of markdown used in the HSH docs: headings, bold-lead bullets, numbered
lists, tables, blockquotes (rendered as callout boxes), fenced code (mono),
horizontal rules, and inline bold/italic/code.

Inputs (docs/):
  hsh-board-operating-model-cfa.md   -> hsh-board-operating-model-cfa.pdf
  hsh-committee-terms-of-reference-cfa.md -> hsh-committee-terms-of-reference-cfa.pdf

Run:
  python3 scripts/build-hsh-pdfs.py
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
    HRFlowable,
    KeepTogether,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
ICON = DOCS / "c4a-icon.png"

NAVY = HexColor("#0B3C5D")
GOLD = HexColor("#D4AF37")
TEAL = HexColor("#1F7A8C")
BODY = HexColor("#1F2937")
MUTED = HexColor("#6B7280")
SURFACE = HexColor("#F1F5F9")
CREAM = HexColor("#FBF6E6")
LIGHT = HexColor("#C9D6E0")

PAGE_W, PAGE_H = A4
MARGIN = 48


def st(name, **kw):
    base = dict(fontName="Helvetica", fontSize=10.3, leading=15, textColor=BODY,
                alignment=TA_LEFT, spaceAfter=6)
    base.update(kw)
    return ParagraphStyle(name, **base)


TITLE = st("title", fontName="Helvetica-Bold", fontSize=24, leading=28, textColor=NAVY, spaceAfter=4)
SUB = st("sub", fontName="Helvetica-Bold", fontSize=12.5, leading=16, textColor=TEAL, spaceAfter=10)
H1 = st("h1", fontName="Helvetica-Bold", fontSize=15, leading=19, textColor=NAVY, spaceBefore=15, spaceAfter=7)
H2 = st("h2", fontName="Helvetica-Bold", fontSize=12, leading=15.5, textColor=NAVY, spaceBefore=9, spaceAfter=4)
H3 = st("h3", fontName="Helvetica-Bold", fontSize=10.8, leading=14, textColor=TEAL, spaceBefore=6, spaceAfter=3)
P = st("p")
LEDE = st("lede", fontSize=10.8, leading=16, textColor=HexColor("#374151"))
BULLET = st("bullet", leftIndent=16, bulletIndent=3, spaceAfter=4)
META = st("meta", fontSize=9, leading=13, textColor=MUTED)
SMALL = st("small", fontSize=8, leading=11, textColor=MUTED)
CELL = st("cell", fontSize=9, leading=12.5)
CELLB = st("cellb", fontSize=9, leading=12.5, fontName="Helvetica-Bold", textColor=white)
QUOTE = st("quote", fontSize=10, leading=14.5, textColor=NAVY, fontName="Helvetica-Bold",
           leftIndent=12, rightIndent=10, spaceBefore=2, spaceAfter=2)
MONO = st("mono", fontName="Courier", fontSize=8.2, leading=10.5, textColor=NAVY)


def inline(text):
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
    text = re.sub(r"(?<!\*)\*(?!\*)(.+?)\*(?!\*)", r"<i>\1</i>", text)
    text = re.sub(r"`(.+?)`", r'<font face="Courier">\1</font>', text)
    text = re.sub(r"\[(.+?)\]\((.+?)\)", r"\1", text)
    return text


def parse(md_text):
    """Yield flowables from markdown text."""
    lines = md_text.split("\n")
    flow = []
    i = 0
    first_h1_seen = False
    n = len(lines)
    while i < n:
        line = lines[i]
        stripped = line.strip()

        # fenced code
        if stripped.startswith("```"):
            i += 1
            buf = []
            while i < n and not lines[i].strip().startswith("```"):
                buf.append(lines[i])
                i += 1
            i += 1
            code = "<br/>".join(
                l.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace(" ", "&nbsp;")
                for l in buf
            )
            box = Table([[Paragraph(code, MONO)]], colWidths=[PAGE_W - 2 * MARGIN])
            box.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), SURFACE),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
                ("LINEBEFORE", (0, 0), (0, -1), 3, GOLD),
            ]))
            flow += [Spacer(1, 4), box, Spacer(1, 6)]
            continue

        # table
        if stripped.startswith("|") and i + 1 < n and re.match(r"^\s*\|[\s:|-]+\|\s*$", lines[i + 1]):
            header = [c.strip() for c in stripped.strip("|").split("|")]
            i += 2
            rows = []
            while i < n and lines[i].strip().startswith("|"):
                rows.append([c.strip() for c in lines[i].strip().strip("|").split("|")])
                i += 1
            data = [[Paragraph(inline(c), CELLB) for c in header]]
            for r in rows:
                data.append([Paragraph(inline(c), CELL) for c in r])
            ncol = len(header)
            cw = (PAGE_W - 2 * MARGIN) / ncol
            t = Table(data, colWidths=[cw] * ncol, repeatRows=1)
            t.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), NAVY),
                ("LINEBELOW", (0, 0), (-1, 0), 1.5, GOLD),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, SURFACE]),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("LINEBELOW", (0, 1), (-1, -1), 0.4, HexColor("#E5E7EB")),
            ]))
            flow += [Spacer(1, 4), t, Spacer(1, 8)]
            continue

        # blockquote (callout)
        if stripped.startswith(">"):
            buf = []
            while i < n and lines[i].strip().startswith(">"):
                buf.append(lines[i].strip().lstrip(">").strip())
                i += 1
            para = Paragraph(inline(" ".join(buf)), QUOTE)
            box = Table([[para]], colWidths=[PAGE_W - 2 * MARGIN])
            box.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), CREAM),
                ("LEFTPADDING", (0, 0), (-1, -1), 16),
                ("RIGHTPADDING", (0, 0), (-1, -1), 14),
                ("TOPPADDING", (0, 0), (-1, -1), 9),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
                ("LINEBEFORE", (0, 0), (0, -1), 4, GOLD),
            ]))
            flow += [Spacer(1, 3), box, Spacer(1, 7)]
            continue

        # horizontal rule
        if stripped == "---":
            flow += [Spacer(1, 4), HRFlowable(width="100%", thickness=0.6, color=HexColor("#E5E7EB")), Spacer(1, 4)]
            i += 1
            continue

        # headings
        if stripped.startswith("#### "):
            flow.append(Paragraph(inline(stripped[5:]), H3)); i += 1; continue
        if stripped.startswith("### "):
            flow.append(Paragraph(inline(stripped[4:]), H2)); i += 1; continue
        if stripped.startswith("## "):
            flow.append(Paragraph(inline(stripped[3:]), H1)); i += 1; continue
        if stripped.startswith("# "):
            if not first_h1_seen:
                first_h1_seen = True
                flow.append(Paragraph(inline(stripped[2:]), TITLE))
            else:
                flow.append(Paragraph(inline(stripped[2:]), H1))
            i += 1
            continue

        # bullets
        if stripped.startswith("- "):
            flow.append(Paragraph(inline(stripped[2:]), BULLET, bulletText="•"))
            i += 1
            continue

        # numbered
        m = re.match(r"^(\d+)\.\s+(.*)$", stripped)
        if m:
            flow.append(Paragraph(inline(m.group(2)), BULLET, bulletText=m.group(1) + "."))
            i += 1
            continue

        # blank
        if not stripped:
            i += 1
            continue

        # metadata-ish lines near the top (bold label lines) -> META until first H1 section
        style = P
        if stripped.startswith("**") and stripped.endswith("**") and len(stripped) < 90 and not first_h1_seen:
            style = META
        flow.append(Paragraph(inline(stripped), style))
        i += 1

    return flow


def make_header_footer(kicker):
    def draw(canvas, doc):
        canvas.saveState()
        # top rule
        canvas.setFillColor(NAVY)
        canvas.rect(0, PAGE_H - 5, PAGE_W, 5, fill=1, stroke=0)
        canvas.setFillColor(GOLD)
        canvas.rect(0, PAGE_H - 7.5, PAGE_W, 2.5, fill=1, stroke=0)
        # kicker
        canvas.setFillColor(TEAL)
        canvas.setFont("Helvetica-Bold", 7.5)
        canvas.drawString(MARGIN, PAGE_H - 24, kicker.upper())
        # icon top-right
        try:
            ic = ImageReader(str(ICON))
            iw, ih = ic.getSize()
            h = 20.0
            w = h * iw / ih
            canvas.drawImage(ic, PAGE_W - MARGIN - w, PAGE_H - 28, width=w, height=h, mask="auto")
        except Exception:
            pass
        # footer
        canvas.setFillColor(MUTED)
        canvas.setFont("Helvetica", 7.5)
        canvas.drawString(MARGIN, 22, "Consult for Africa   /   Confidential   /   Havana Specialist Hospital")
        canvas.drawRightString(PAGE_W - MARGIN, 22, "Page %d" % doc.page)
        canvas.setFillColor(GOLD)
        canvas.rect(MARGIN, 33, 18, 2, fill=1, stroke=0)
        canvas.restoreState()
    return draw


def render(md_path, out_path, kicker):
    text = md_path.read_text()
    doc = BaseDocTemplate(
        str(out_path), pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN, topMargin=44, bottomMargin=42,
        title=md_path.stem, author="Consult for Africa",
    )
    frame = Frame(MARGIN, 42, PAGE_W - 2 * MARGIN, PAGE_H - 44 - 42, id="body")
    doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=make_header_footer(kicker))])
    doc.build(parse(text))
    print(f"wrote {out_path}")


def build():
    render(DOCS / "hsh-board-operating-model-cfa.md",
           DOCS / "hsh-board-operating-model-cfa.pdf",
           "Board Operating Model")
    render(DOCS / "hsh-committee-terms-of-reference-cfa.md",
           DOCS / "hsh-committee-terms-of-reference-cfa.pdf",
           "Committee Terms of Reference")
    render(DOCS / "hsh-delegation-of-authority-cfa.md",
           DOCS / "hsh-delegation-of-authority-cfa.pdf",
           "Delegation of Authority")
    render(DOCS / "hsh-governance-enablement-proposal-cfa.md",
           DOCS / "hsh-governance-enablement-proposal-cfa.pdf",
           "Board & Committee Enablement Proposal")
    render(DOCS / "hsh-director-guide-cfa.md",
           DOCS / "hsh-director-guide-cfa.pdf",
           "A Guide for Board Members & Committee Chairs")
    render(DOCS / "hsh-company-secretary-instruction-doa.md",
           DOCS / "hsh-company-secretary-instruction-doa.pdf",
           "Instruction to the Company Secretary")
    render(DOCS / "hsh-governance-training-curriculum-cfa.md",
           DOCS / "hsh-governance-training-curriculum-cfa.pdf",
           "Governance Training Curriculum")
    render(DOCS / "hsh-board-committee-handbook-cfa.md",
           DOCS / "hsh-board-committee-handbook-cfa.pdf",
           "Board & Committee Handbook")
    render(DOCS / "hsh-training-summary-cfa.md",
           DOCS / "hsh-training-summary-cfa.pdf",
           "Governance Training, Summary of the Programme")
    render(DOCS / "hsh-board-instruments-pack-cfa.md",
           DOCS / "hsh-board-instruments-pack-cfa.pdf",
           "Board & Committee Instruments Pack")
    render(DOCS / "hsh-competency-check-and-mock-cfa.md",
           DOCS / "hsh-competency-check-and-mock-cfa.pdf",
           "Competency Check & Live Mock Committee Meeting")


if __name__ == "__main__":
    build()
