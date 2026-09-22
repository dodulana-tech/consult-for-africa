"""
A bespoke document renderer for the Belfiore Medical Aesthetics work.

The house osteon_doc template is deliberately sober because it carries audit
and governance material. Belfiore is a luxury aesthetics practice in Ikoyi and
the document has to look like something you would want to open, so this module
gives it its own cover, its own palette (CFA navy and gold, warmed with a
champagne tone) and richer page furniture: section openers with a large gold
numeral, stat tiles, an at-a-glance card and pull quotes.

Markdown supported, beyond the usual headings, bullets, numbers and tables:

    ::: stats                     three tiles across
    2 days | of training | 10 hours in total
    :::

    ::: glance                    a cream label/value card
    Programme | Client Experience Programme
    :::

    > a pull quote, in a champagne card with a gold rule

Style only. No content. Import this, do not copy it.
"""

from __future__ import annotations

import re
from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.platypus import (
    BaseDocTemplate, CondPageBreak, Frame, KeepTogether, NextPageTemplate,
    PageBreak, PageTemplate, Paragraph, Spacer, Table, TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"

# ---- palette ---------------------------------------------------------------
INK = HexColor("#061E2E")      # cover ground, deeper than the house navy
NAVY = HexColor("#0B3C5D")
GOLD = HexColor("#C9A227")
GOLD_LT = HexColor("#E3C766")
BLUSH = HexColor("#E7C6B5")    # the champagne warmth, for an aesthetics client
TEAL = HexColor("#1F7A8C")
BODY = HexColor("#22303C")
MUTED = HexColor("#6B7280")
SURFACE = HexColor("#F4F7F9")
CREAM = HexColor("#FBF4EA")
LINE = HexColor("#E3E9ED")

PAGE_W, PAGE_H = A4
MARGIN = 52
AVAIL = PAGE_W - 2 * MARGIN
_CELL_PAD = 16.0

# ---- type ------------------------------------------------------------------
H1 = ParagraphStyle("h1", fontName="Helvetica-Bold", fontSize=17, leading=21,
                    textColor=NAVY, spaceBefore=4, spaceAfter=3, alignment=TA_LEFT)
H2 = ParagraphStyle("h2", fontName="Helvetica-Bold", fontSize=11.8, leading=15.5,
                    textColor=TEAL, spaceBefore=12, spaceAfter=3, alignment=TA_LEFT)
H3 = ParagraphStyle("h3", fontName="Helvetica-BoldOblique", fontSize=10.2, leading=14,
                    textColor=NAVY, spaceBefore=8, spaceAfter=2, alignment=TA_LEFT)
P = ParagraphStyle("p", fontName="Helvetica", fontSize=10.2, leading=15.4,
                   textColor=BODY, spaceAfter=7, alignment=TA_LEFT)
LEDE = ParagraphStyle("lede", parent=P, fontSize=11.4, leading=17, textColor=HexColor("#3B4A57"))
BUL = ParagraphStyle("bul", parent=P, leftIndent=13, spaceAfter=4)
NUM = ParagraphStyle("num", parent=P, leftIndent=16, spaceAfter=5)
SMALL = ParagraphStyle("small", fontName="Helvetica-Oblique", fontSize=8.6, leading=12, textColor=MUTED)
QUOTE = ParagraphStyle("quote", fontName="Helvetica", fontSize=10.6, leading=15.8,
                       textColor=HexColor("#2A3C4B"), alignment=TA_LEFT)
CELL = ParagraphStyle("cell", fontName="Helvetica", fontSize=8.9, leading=12.4, textColor=BODY)
CELL_B = ParagraphStyle("cellb", parent=CELL, fontName="Helvetica-Bold", textColor=NAVY)
CELL_W = ParagraphStyle("cellw", fontName="Helvetica-Bold", fontSize=9.1, leading=12.4, textColor=white)
# An empty cell is a cell somebody has to write in, so it carries its own height.
CELL_FILL = ParagraphStyle("cellfill", parent=CELL, leading=19)
EYEBROW = ParagraphStyle("eyebrow", fontName="Helvetica-Bold", fontSize=7.8, leading=10,
                         textColor=GOLD, spaceAfter=2)


def inline(text: str) -> str:
    """Markdown inline to reportlab mini-HTML, with safe escaping."""
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    text = text.replace("→", "&gt;").replace("←", "&lt;")
    text = text.replace("‑", "-").replace("–", "-").replace("—", "-")
    text = re.sub(r"\[([^\]]+)\]\((?:[^)]+)\)", r"\1", text)
    text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
    text = re.sub(r"(?<!\*)\*(?!\s)(.+?)(?<!\s)\*", r"<i>\1</i>", text)
    text = re.sub(r"`(.+?)`", r'<font face="Courier">\1</font>', text)
    return text


# ---- tables ----------------------------------------------------------------
def _widest_word(cells, bold):
    """Width of the widest unbreakable word in a column.

    Row 0 is the header and always renders bold at 9.1pt, so it is measured
    that way whatever the body does. Measuring it as regular is what lets a
    header like "Days" wrap to "Day / s" in a column sized to fit it.
    """
    font = "Helvetica-Bold" if bold else "Helvetica"
    widest = 0.0
    for i, c in enumerate(cells):
        f, size = ("Helvetica-Bold", 9.1) if i == 0 else (font, 9)
        for w in c.split():
            widest = max(widest, stringWidth(w, f, size))
    return widest


def col_widths(rows):
    n = len(rows[0])
    weight, longest_word = [], []
    for j in range(n):
        cells = [re.sub(r"[*`]", "", r[j]) for r in rows if j < len(r)]
        lens = [len(c) for c in cells]
        body_len = sum(lens[1:]) / max(1, len(lens) - 1)
        weight.append(max(float(lens[0]), body_len, 4.0))
        longest_word.append(_widest_word(cells, bold=(j == 0)))
    total = sum(weight)
    share = [min(0.60, max(0.07, w / total)) for w in weight]
    total = sum(share)
    widths = [AVAIL * s / total for s in share]
    floors = [min(AVAIL * 0.45, lw + _CELL_PAD) for lw in longest_word]
    if sum(floors) > AVAIL * 0.95:
        k = AVAIL * 0.95 / sum(floors)
        floors = [f * k for f in floors]
    widths = [max(w, f) for w, f in zip(widths, floors)]
    over = sum(widths) - AVAIL
    if over > 0:
        slack = [w - f for w, f in zip(widths, floors)]
        if sum(slack) > 0:
            widths = [w - over * sl / sum(slack) for w, sl in zip(widths, slack)]
        else:
            widths = [w * AVAIL / sum(widths) for w in widths]
    return widths


def render_table(rows):
    data = []
    for i, r in enumerate(rows):
        cells = []
        for j, cval in enumerate(r):
            if i and not cval.strip():
                cells.append(Paragraph("&nbsp;", CELL_FILL))
                continue
            st = CELL_W if i == 0 else (CELL_B if j == 0 else CELL)
            cells.append(Paragraph(inline(cval), st))
        data.append(cells)
    t = Table(data, colWidths=col_widths(rows), repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("LINEBELOW", (0, 0), (-1, 0), 1.6, GOLD),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, SURFACE]),
        ("LINEBELOW", (0, 1), (-1, -2), 0.4, LINE),
    ]))
    return t


def quote_card(lines):
    inner = [[Paragraph(inline(ln) if ln.strip() else "&nbsp;", QUOTE)] for ln in lines]
    t = Table(inner, colWidths=[AVAIL - 18])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), CREAM),
        ("LINEBEFORE", (0, 0), (0, -1), 3.5, GOLD),
        ("LEFTPADDING", (0, 0), (-1, -1), 15),
        ("RIGHTPADDING", (0, 0), (-1, -1), 14),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    outer = Table([[t]], colWidths=[AVAIL])
    outer.setStyle(TableStyle([
        ("TOPPADDING", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))
    return outer


def stat_tiles(rows):
    """Each row is 'big | label | sub'. Rendered as tiles across the page."""
    big = ParagraphStyle("tileb", fontName="Helvetica-Bold", fontSize=21, leading=24, textColor=NAVY)
    lbl = ParagraphStyle("tilel", fontName="Helvetica-Bold", fontSize=8, leading=11, textColor=GOLD)
    sub = ParagraphStyle("tiles", fontName="Helvetica", fontSize=8.6, leading=11.6, textColor=MUTED)
    cells = []
    for r in rows:
        parts = [p.strip() for p in r.split("|")]
        while len(parts) < 3:
            parts.append("")
        inner = Table([[Paragraph(inline(parts[1].upper()), lbl)],
                       [Paragraph(inline(parts[0]), big)],
                       [Paragraph(inline(parts[2]), sub)]], colWidths=[(AVAIL - 24) / len(rows) - 24])
        inner.setStyle(TableStyle([
            ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ("TOPPADDING", (0, 0), (-1, -1), 1), ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
        ]))
        cells.append(inner)
    t = Table([cells], colWidths=[(AVAIL - 24) / len(rows) + 12] * len(rows))
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), SURFACE),
        ("LINEABOVE", (0, 0), (-1, 0), 2.2, GOLD),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 14), ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 13), ("BOTTOMPADDING", (0, 0), (-1, -1), 13),
        ("LINEAFTER", (0, 0), (-2, -1), 0.7, LINE),
    ]))
    return t


def glance_card(rows):
    """Each row is 'Label | Value'. A cream card, gold labels."""
    lbl = ParagraphStyle("gl", fontName="Helvetica-Bold", fontSize=7.9, leading=11.4, textColor=GOLD)
    val = ParagraphStyle("gv", fontName="Helvetica", fontSize=9.6, leading=13.4, textColor=NAVY)
    data = []
    for r in rows:
        parts = [p.strip() for p in r.split("|")]
        data.append([Paragraph(inline(parts[0].upper()), lbl),
                     Paragraph(inline(parts[1] if len(parts) > 1 else ""), val)])
    t = Table(data, colWidths=[132, AVAIL - 132 - 30])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), CREAM),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (0, -1), 18), ("LEFTPADDING", (1, 0), (1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LINEBEFORE", (0, 0), (0, -1), 3.5, GOLD),
    ]))
    outer = Table([[t]], colWidths=[AVAIL])
    outer.setStyle(TableStyle([
        ("TOPPADDING", (0, 0), (-1, -1), 10), ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
        ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))
    return outer


def section_heading(numeral: str, text: str):
    """A large gold numeral beside the section title. Unnumbered sections do not
    carry the empty numeral column, or the title would sit oddly indented."""
    big = ParagraphStyle("secn", fontName="Helvetica-Bold", fontSize=27, leading=29,
                         textColor=GOLD_LT)
    gut = 46 if numeral else 0
    row = ([Paragraph(numeral, big), Paragraph(inline(text), H1)] if numeral
           else [Paragraph(inline(text), H1)])
    t = Table([row], colWidths=([gut, AVAIL - gut] if numeral else [AVAIL]))
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (0, 0), 0 if numeral else 6),
        ("TOPPADDING", (-1, 0), (-1, 0), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ("LINEABOVE", (0, 0), (-1, 0), 1.2, GOLD),
    ]))
    outer = Table([[t]], colWidths=[AVAIL])
    outer.setStyle(TableStyle([
        ("TOPPADDING", (0, 0), (-1, -1), 16), ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))
    return outer


def _next_content(body, k):
    """The next non-blank line after k, so a heading can reserve enough room
    for whatever actually follows it."""
    j = k + 1
    while j < len(body) and not body[j].strip():
        j += 1
    return body[j].strip() if j < len(body) else ""


def part_divider(text: str):
    """A full-width navy band that opens a part of the book, so somebody
    flicking through can see where day one ends and day two begins."""
    st = ParagraphStyle("part", fontName="Helvetica-Bold", fontSize=15.5, leading=20,
                        textColor=white)
    rule = Table([[""]], colWidths=[54], rowHeights=[2.6])
    rule.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), GOLD),
                              ("LEFTPADDING", (0, 0), (-1, -1), 0),
                              ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                              ("TOPPADDING", (0, 0), (-1, -1), 0),
                              ("BOTTOMPADDING", (0, 0), (-1, -1), 0)]))
    inner = Table([[rule], [Paragraph(inline(text.upper()), st)]], colWidths=[AVAIL - 44])
    inner.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (0, 0), 0), ("BOTTOMPADDING", (0, 0), (0, 0), 9),
        ("TOPPADDING", (0, 1), (0, 1), 0), ("BOTTOMPADDING", (0, 1), (0, 1), 0),
    ]))
    t = Table([[inner]], colWidths=[AVAIL])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NAVY),
        ("LEFTPADDING", (0, 0), (-1, -1), 22), ("RIGHTPADDING", (0, 0), (-1, -1), 22),
        ("TOPPADDING", (0, 0), (-1, -1), 20), ("BOTTOMPADDING", (0, 0), (-1, -1), 22),
    ]))
    outer = Table([[t]], colWidths=[AVAIL])
    outer.setStyle(TableStyle([
        ("TOPPADDING", (0, 0), (-1, -1), 2), ("BOTTOMPADDING", (0, 0), (-1, -1), 18),
        ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))
    return outer


def script_card(lines):
    """Word-for-word wording the team can say. Set apart so it reads as a
    script to be used, not prose to be skimmed."""
    st = ParagraphStyle("scr", fontName="Helvetica-Oblique", fontSize=10, leading=15,
                        textColor=HexColor("#17455C"), alignment=TA_LEFT)
    inner = [[Paragraph(inline(ln) if ln.strip() else "&nbsp;", st)] for ln in lines]
    t = Table(inner, colWidths=[AVAIL - 20])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), HexColor("#EFF5F8")),
        ("LINEBEFORE", (0, 0), (0, -1), 3.5, TEAL),
        ("LEFTPADDING", (0, 0), (-1, -1), 15),
        ("RIGHTPADDING", (0, 0), (-1, -1), 14),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    outer = Table([[t]], colWidths=[AVAIL])
    outer.setStyle(TableStyle([
        ("TOPPADDING", (0, 0), (-1, -1), 8), ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
        ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))
    return outer


def writing_lines(n: int, label: str = ""):
    """Ruled lines to write on. A handbook that cannot be written in is a
    brochure."""
    rows = []
    if label:
        rows.append([Paragraph(inline(label), ParagraphStyle(
            "wl", fontName="Helvetica-Bold", fontSize=8.4, leading=12, textColor=GOLD))])
    for _ in range(n):
        rows.append([Spacer(1, 17)])
    t = Table(rows, colWidths=[AVAIL])
    style = [
        ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 2), ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ]
    first = 1 if label else 0
    for i in range(first, len(rows)):
        style.append(("LINEBELOW", (0, i), (-1, i), 0.6, HexColor("#C8D3DB")))
    t.setStyle(TableStyle(style))
    outer = Table([[t]], colWidths=[AVAIL])
    outer.setStyle(TableStyle([
        ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
        ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))
    return outer


# ---- page furniture --------------------------------------------------------
def _wrap(c, text, font, size, max_w):
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


def make_page_furniture(client_line: str, title: str, subtitle: str, meta: list[tuple[str, str]],
                        header_label: str, footer_label: str,
                        cover_list: list[tuple[str, str]] | None = None):

    def cover_bg(c, doc):
        c.saveState()
        c.setFillColor(INK)
        c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)

        # Two tonal sweeps give the page depth. Both are kept clear of the type,
        # low and right, so nothing ever reads across a headline.
        c.saveState()
        c.setFillAlpha(0.50)
        c.setFillColor(NAVY)
        c.circle(PAGE_W + 150, -330, 560, fill=1, stroke=0)
        c.restoreState()
        c.saveState()
        c.setFillAlpha(0.28)
        c.setFillColor(NAVY)
        c.circle(-120, PAGE_H + 150, 340, fill=1, stroke=0)
        c.restoreState()
        # Only the upper arc of that sweep is drawn, so the gold hairline never
        # crosses the meta grid or the footer line.
        c.saveState()
        c.setStrokeAlpha(0.40)
        c.setStrokeColor(GOLD)
        c.setLineWidth(0.7)
        cx, cy, r = PAGE_W + 150, -330, 604
        c.arc(cx - r, cy - r, cx + r, cy + r, 104, 31)
        c.restoreState()

        # logo
        try:
            img = ImageReader(str(DOCS / "c4a-logo-reversed.png"))
            iw, ih = img.getSize()
            w = 134.0
            c.drawImage(img, MARGIN, PAGE_H - 92, width=w, height=w * ih / iw,
                        mask="auto", preserveAspectRatio=True)
        except Exception:
            c.setFillColor(GOLD)
            c.setFont("Helvetica-Bold", 12)
            c.drawString(MARGIN, PAGE_H - 76, "CONSULT FOR AFRICA")

        c.setFillColor(BLUSH)
        c.setFont("Helvetica-Bold", 7.6)
        c.drawRightString(PAGE_W - MARGIN, PAGE_H - 78, "C O N F I D E N T I A L")

        # eyebrow
        y = PAGE_H - 252
        c.setFillColor(GOLD)
        c.rect(MARGIN, y + 56, 44, 2.4, fill=1, stroke=0)
        c.setFont("Helvetica-Bold", 8.2)
        c.drawString(MARGIN, y + 36, " ".join(client_line.upper()))

        # title
        c.setFillColor(white)
        size = 40 if len(title) < 42 else 33
        for ln in _wrap(c, title, "Helvetica-Bold", size, AVAIL - 40):
            c.setFont("Helvetica-Bold", size)
            c.drawString(MARGIN, y, ln)
            y -= size * 1.12

        y -= 4
        c.setFillColor(GOLD)
        c.rect(MARGIN, y, 74, 2.6, fill=1, stroke=0)
        y -= 26

        if subtitle:
            c.setFillColor(BLUSH)
            for ln in _wrap(c, subtitle, "Helvetica", 14, AVAIL - 120):
                c.setFont("Helvetica", 14)
                c.drawString(MARGIN, y, ln)
                y -= 20

        # The five domains, on the cover, so the reader knows what is inside
        # before deciding whether to open it.
        if cover_list:
            y -= 18
            c.setFillColor(HexColor("#2C4A61"))
            c.rect(MARGIN, y, AVAIL, 0.8, fill=1, stroke=0)
            y -= 22
            for num, label in cover_list:
                c.setFillColor(GOLD)
                c.setFont("Helvetica-Bold", 9.6)
                c.drawString(MARGIN, y, num)
                c.setFillColor(HexColor("#D8E3EC"))
                c.setFont("Helvetica", 10.4)
                c.drawString(MARGIN + 30, y, label)
                y -= 21
            y -= 6
            c.setFillColor(HexColor("#2C4A61"))
            c.rect(MARGIN, y, AVAIL, 0.8, fill=1, stroke=0)

        # meta grid, two columns
        my = y - 30
        col = 0
        for label, value in meta:
            x = MARGIN + col * (AVAIL / 2)
            c.setFillColor(GOLD)
            c.setFont("Helvetica-Bold", 7)
            c.drawString(x, my, label.upper())
            c.setFillColor(white)
            c.setFont("Helvetica", 9.2)
            for k, ln in enumerate(_wrap(c, value, "Helvetica", 9.2, AVAIL / 2 - 30)):
                c.drawString(x, my - 13 - k * 11.5, ln)
            col += 1
            if col == 2:
                col = 0
                my -= 42

        # footer
        c.setFillColor(BLUSH)
        c.setFillAlpha(0.45)
        c.rect(MARGIN, 74, AVAIL, 0.8, fill=1, stroke=0)
        c.setFillAlpha(1)
        c.setFillColor(HexColor("#9FB4C4"))
        c.setFont("Helvetica", 8.4)
        c.drawString(MARGIN, 58, "Consult for Africa Management Services Limited   /   "
                                 "2 Tom Ogboi Avenue, Lekki Phase 1, Lagos")
        c.drawString(MARGIN, 45, "hello@consultforafrica.com   /   +234 913 813 8553   /   consultforafrica.com")

        # the champagne signature strip, drawn last so nothing sits over it
        c.setFillColor(BLUSH)
        c.rect(0, 0, 8, PAGE_H, fill=1, stroke=0)
        c.restoreState()

    def content_bg(c, doc):
        c.saveState()
        # champagne signature strip, so every page is recognisably this document
        c.setFillColor(BLUSH)
        c.rect(0, 0, 5, PAGE_H, fill=1, stroke=0)

        # running head
        c.setFillColor(GOLD)
        c.rect(MARGIN, PAGE_H - 46, 26, 2, fill=1, stroke=0)
        c.setFillColor(NAVY)
        c.setFont("Helvetica-Bold", 7.8)
        c.drawString(MARGIN + 34, PAGE_H - 45, "CONSULT FOR AFRICA")
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 7.8)
        c.drawRightString(PAGE_W - MARGIN, PAGE_H - 45, header_label)
        c.setFillColor(LINE)
        c.rect(MARGIN, PAGE_H - 56, AVAIL, 0.6, fill=1, stroke=0)

        # footer
        c.setFillColor(LINE)
        c.rect(MARGIN, 44, AVAIL, 0.6, fill=1, stroke=0)
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 7.6)
        c.drawString(MARGIN, 31, footer_label)
        c.setFillColor(GOLD)
        c.circle(PAGE_W - MARGIN - 20, 34, 8.5, fill=1, stroke=0)
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", 7.6)
        c.drawCentredString(PAGE_W - MARGIN - 20, 31.3, str(doc.page))
        c.restoreState()

    return cover_bg, content_bg


# ---- the document ----------------------------------------------------------
def build_doc(src: Path, out: Path, client_line: str, header_label: str, footer_label: str,
              cover_list: list[tuple[str, str]] | None = None,
              section_breaks: bool = False):
    """section_breaks starts every numbered `##` section on a fresh page. Right
    for a handbook somebody flicks through to find session 7; wrong for a
    prospectus that should read continuously."""
    lines = src.read_text(encoding="utf-8").splitlines()

    title, subtitle, meta = "", "", []
    i = 0
    while i < len(lines) and lines[i].strip() != "---":
        ln = lines[i].strip()
        if ln.startswith("# ") and not title:
            title = ln[2:].strip()
        elif ln.startswith("**") and ln.endswith("**") and not subtitle:
            subtitle = ln.strip("*").strip()
        elif ln:
            plain = ln.replace("**", "")
            if ":" in plain:
                lbl, _, val = plain.partition(":")
                meta.append((lbl.strip(), val.strip()))
            else:
                meta.append(("", plain))
        i += 1
    body = lines[i + 1:] if i < len(lines) else []

    cover_bg, content_bg = make_page_furniture(
        client_line, title, subtitle, meta, header_label, footer_label, cover_list)
    out.parent.mkdir(parents=True, exist_ok=True)
    doc = BaseDocTemplate(
        str(out), pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=66, bottomMargin=56,
        title=f"{title} - Consult for Africa", author="Consult for Africa",
    )
    doc.addPageTemplates([
        PageTemplate(id="cover", frames=[Frame(MARGIN, 300, AVAIL, 120, id="cover")],
                     onPage=cover_bg),
        PageTemplate(id="content",
                     frames=[Frame(MARGIN, 56, AVAIL, PAGE_H - 66 - 56, id="content")],
                     onPage=content_bg),
    ])

    el = [NextPageTemplate("content"), PageBreak()]

    n = len(body)
    k = 0
    just_divided = False   # a part divider already opened a page; do not open another
    pending_head = None    # a `###` waiting to be emitted with the table below it
    while k < n:
        # A held heading is released the moment something that is not its table
        # turns up, so it can never be swallowed.
        if pending_head is not None:
            nxt_line = body[k].strip()
            if nxt_line and not nxt_line.startswith("|"):
                el += [CondPageBreak(96), pending_head]
                pending_head = None
        s = body[k].strip()

        if s in ("---", ""):
            k += 1
            continue

        # custom blocks
        if s in (":::break", "::: break"):
            el.append(PageBreak())
            k += 1
            continue

        m = re.match(r"^:::\s*(\w+)\s*$", s)
        if m:
            kind, rows = m.group(1), []
            k += 1
            while k < n and body[k].strip() != ":::":
                if body[k].strip():
                    rows.append(body[k].strip())
                k += 1
            k += 1
            if kind == "lines":
                lbl = rows[0] if rows and not rows[0].isdigit() else ""
                cnt = next((int(r) for r in rows if r.isdigit()), 4)
                el.append(writing_lines(cnt, lbl))
            elif rows:
                if kind == "stats":
                    el += [Spacer(1, 4), stat_tiles(rows), Spacer(1, 10)]
                elif kind == "glance":
                    el.append(glance_card(rows))
                elif kind == "script":
                    el.append(script_card(rows))
            continue

        if s.startswith("|"):
            tbl = []
            while k < n and body[k].strip().startswith("|"):
                cells = [c.strip() for c in body[k].strip().strip("|").split("|")]
                if not re.match(r"^[\s:\-]+$", "".join(cells)):
                    tbl.append(cells)
                k += 1
            if tbl:
                t = render_table(tbl)
                lead = [pending_head] if pending_head is not None else []
                # A short table that breaks leaves one orphan row on the next
                # page, which looks like a mistake. Keep small ones whole.
                if len(tbl) <= 11:
                    block = KeepTogether(lead + [Spacer(1, 3), t])
                    el += [CondPageBreak(76), block, Spacer(1, 8)]
                else:
                    el += [CondPageBreak(168)] + lead + [Spacer(1, 3), t, Spacer(1, 8)]
                pending_head = None
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
            el += [CondPageBreak(84), Paragraph(inline(s[5:]), H3)]
            k += 1
            continue
        if s.startswith("### "):
            nxt = _next_content(body, k)
            head = Paragraph(inline(s[4:]), H2)
            if nxt.startswith("|"):
                # A heading whose table jumps to the next page is left stranded,
                # so the heading travels with the table instead of before it.
                pending_head = head
            else:
                el += [CondPageBreak(96), head]
            k += 1
            continue
        if s.startswith("## "):
            head = s[3:]
            mnum = re.match(r"^(\d+)\.\s+(.*)$", head)
            if section_breaks:
                if len(el) > 2 and not just_divided:
                    el.append(PageBreak())
            else:
                el.append(CondPageBreak(190))
            just_divided = False
            if mnum:
                el.append(section_heading("%02d" % int(mnum.group(1)), mnum.group(2)))
            else:
                el.append(section_heading("", head))
            k += 1
            continue
        if s.startswith("# "):
            if len(el) > 2:
                el.append(PageBreak())
            el.append(part_divider(s[2:]))
            just_divided = True
            k += 1
            continue

        mnum = re.match(r"^(\d+)\.\s+(.*)$", s)
        if mnum:
            el.append(Paragraph('<font color="#C9A227"><b>%s.</b></font>&nbsp;&nbsp;%s'
                                % (mnum.group(1), inline(mnum.group(2))), NUM))
            k += 1
            continue

        if s.startswith("- [ ] "):
            el.append(Paragraph('<font color="#C9A227">&#9744;</font>&nbsp;&nbsp;' + inline(s[6:]), BUL))
            k += 1
            continue

        if s.startswith("- ") or s.startswith("* "):
            el.append(Paragraph('<font color="#C9A227">&#9679;</font>&nbsp;&nbsp;' + inline(s[2:]), BUL))
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
