"""
Render the Kemi Balogun group + healthcare structuring advisory note to a
branded, multi-page A4 PDF for Consult for Africa.

A navy cover page (medbury house style) sits in front of a markdown-driven body
(the hsh renderer subset: headings, bold-lead bullets, numbered lists, tables,
blockquote callouts, rules, inline bold/italic/code). No em dashes anywhere.

Input:  docs/kemi-balogun-group-structuring-cfa.md
Output: docs/kemi-balogun-group-structuring-cfa.pdf

Run:
  python3 scripts/build-kemi-structuring.py
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
    Flowable,
    Frame,
    HRFlowable,
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
ICON = DOCS / "c4a-icon.png"

# ---- brand palette (source: docs/brand-guide-cfa.pdf) ----------------------
NAVY = HexColor("#0B3C5D")
DEEP_NAVY = HexColor("#081521")
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


TITLE = st("title", fontName="Helvetica-Bold", fontSize=22, leading=26, textColor=NAVY,
           spaceBefore=6, spaceAfter=4)
H1 = st("h1", fontName="Helvetica-Bold", fontSize=15, leading=19, textColor=NAVY,
        spaceBefore=15, spaceAfter=7)
H2 = st("h2", fontName="Helvetica-Bold", fontSize=12, leading=15.5, textColor=NAVY,
        spaceBefore=9, spaceAfter=4)
H3 = st("h3", fontName="Helvetica-Bold", fontSize=10.8, leading=14, textColor=TEAL,
        spaceBefore=6, spaceAfter=3)
P = st("p")
BULLET = st("bullet", leftIndent=16, bulletIndent=3, spaceAfter=4)
META = st("meta", fontSize=9.5, leading=14, textColor=MUTED)
SMALL = st("small", fontSize=8, leading=11, textColor=MUTED)
CELL = st("cell", fontSize=8.6, leading=11.8)
CELLB = st("cellb", fontSize=8.6, leading=11.8, fontName="Helvetica-Bold", textColor=white)
QUOTE = st("quote", fontSize=10, leading=14.5, textColor=NAVY, fontName="Helvetica-Bold",
           leftIndent=12, rightIndent=10, spaceBefore=2, spaceAfter=2)
FIGEYE = st("figeye", fontName="Helvetica-Bold", fontSize=7.5, leading=10, textColor=GOLD,
            spaceBefore=6, spaceAfter=1)
FIGCAP = st("figcap", fontSize=8.6, leading=12, textColor=MUTED, spaceAfter=3)

# ---- diagram palette -------------------------------------------------------
STEEL = HexColor("#4A6B82")   # sub-holding boxes
OPCO_BG = HexColor("#EDF2F6")  # operating-company boxes
OPCO_BR = HexColor("#B7C7D3")
LINE = HexColor("#9DB2C0")     # connectors

KIND = {
    #  key       fill      text     border    dashed
    "hold":    (NAVY,     white,   None,     False),
    "trust":   (white,    NAVY,    GOLD,     True),
    "services": (TEAL,    white,   None,     False),
    "subhold": (STEEL,    white,   None,     False),
    "opco":    (OPCO_BG,  NAVY,    OPCO_BR,  False),
}


class OrgChart(Flowable):
    """A tidy tiered box-and-connector org chart from a nested node spec.

    node = {"label": str, "kind": one of KIND, "note": optional str,
            "children": [node, ...]}
    """

    def __init__(self, root, width, box_h=34, v_gap=24, font=7.6):
        super().__init__()
        self.root = root
        self.width = width
        self.box_h = box_h
        self.v_gap = v_gap
        self.font = font
        self._measure()

    # -- layout ------------------------------------------------------------
    def _measure(self):
        leaves = []
        self._maxd = 0

        def cols(n, d):
            self._maxd = max(self._maxd, d)
            n["_d"] = d
            if n.get("children"):
                for c in n["children"]:
                    cols(c, d + 1)
            else:
                n["_col"] = len(leaves)
                leaves.append(n)

        cols(self.root, 0)
        self._ncols = max(1, len(leaves))
        self._colw = self.width / self._ncols
        for lf in leaves:
            lf["_x"] = (lf["_col"] + 0.5) * self._colw

        def setx(n):
            if n.get("children"):
                for c in n["children"]:
                    setx(c)
                xs = [c["_x"] for c in n["children"]]
                n["_x"] = (min(xs) + max(xs)) / 2

        setx(self.root)
        self.height = (self._maxd + 1) * self.box_h + self._maxd * self.v_gap

    def wrap(self, availW, availH):
        return (self.width, self.height)

    # -- helpers -----------------------------------------------------------
    def _box_w(self, n):
        if n.get("children") or n["_d"] == 0:
            return min(132, self._colw * 1.05) if n.get("children") else min(140, self.width * 0.5)
        return max(42, self._colw - 9)

    def _top(self, d):
        return self.height - d * (self.box_h + self.v_gap)

    def _wrap_label(self, label, bw):
        words = label.split()
        lines, cur = [], ""
        for w in words:
            trial = (cur + " " + w).strip()
            if self.canv.stringWidth(trial, "Helvetica-Bold", self.font) <= bw - 8 or not cur:
                cur = trial
            else:
                lines.append(cur)
                cur = w
        if cur:
            lines.append(cur)
        return lines[:2]

    # -- draw --------------------------------------------------------------
    def draw(self):
        c = self.canv
        # connectors first, so boxes sit on top
        c.setStrokeColor(LINE)
        c.setLineWidth(0.8)

        def connect(n):
            if not n.get("children"):
                return
            d = n["_d"]
            pbot = self._top(d) - self.box_h
            bus_y = pbot - self.v_gap / 2
            c.line(n["_x"], pbot, n["_x"], bus_y)
            xs = [ch["_x"] for ch in n["children"]]
            if len(xs) > 1:
                c.line(min(xs), bus_y, max(xs), bus_y)
            for ch in n["children"]:
                ctop = self._top(ch["_d"])
                c.line(ch["_x"], bus_y, ch["_x"], ctop)
                connect(ch)

        connect(self.root)

        def box(n):
            fill, txt, border, dashed = KIND[n["kind"]]
            bw = self._box_w(n)
            x = n["_x"] - bw / 2
            top = self._top(n["_d"])
            y = top - self.box_h
            c.saveState()
            if dashed:
                c.setDash(2.4, 2)
            c.setFillColor(fill)
            if border is not None:
                c.setStrokeColor(border)
                c.setLineWidth(1.1)
                c.roundRect(x, y, bw, self.box_h, 4, stroke=1, fill=1)
            else:
                c.roundRect(x, y, bw, self.box_h, 4, stroke=0, fill=1)
            c.restoreState()
            # text
            lines = self._wrap_label(n["label"], bw)
            note = n.get("note")
            total_h = len(lines) * (self.font + 1.4) + (7.6 if note else 0)
            ty = y + (self.box_h + total_h) / 2 - self.font
            c.setFillColor(txt)
            c.setFont("Helvetica-Bold", self.font)
            for ln in lines:
                c.drawCentredString(n["_x"], ty, ln)
                ty -= self.font + 1.4
            if note:
                c.setFont("Helvetica-Oblique", 6.6)
                c.setFillColor(GOLD if n["kind"] in ("hold", "trust") else txt)
                c.drawCentredString(n["_x"], ty, note)
            for ch in n.get("children", []):
                box(ch)

        box(self.root)


class OwnershipBar(Flowable):
    """A 100%-width stacked ownership bar with a chip legend below."""

    def __init__(self, segments, width, bar_h=30):
        super().__init__()
        self.segments = segments  # [(name, pct, fill, textcolor), ...]
        self.width = width
        self.bar_h = bar_h
        self.height = bar_h + 30

    def wrap(self, availW, availH):
        return (self.width, self.height)

    def draw(self):
        c = self.canv
        x = 0
        top = self.height
        by = top - self.bar_h
        for name, pct, fill, tc in self.segments:
            w = self.width * pct / 100.0
            c.setFillColor(fill)
            c.rect(x, by, w, self.bar_h, stroke=0, fill=1)
            c.setFillColor(tc)
            c.setFont("Helvetica-Bold", 9)
            c.drawCentredString(x + w / 2, by + self.bar_h / 2 - 3, "%d%%" % pct)
            x += w
        c.setStrokeColor(white)
        c.setLineWidth(1.4)
        x = 0
        for _, pct, _, _ in self.segments[:-1]:
            x += self.width * pct / 100.0
            c.line(x, by, x, top)
        # legend
        lx = 0
        ly = by - 16
        for name, pct, fill, tc in self.segments:
            c.setFillColor(fill)
            c.rect(lx, ly, 9, 9, stroke=0, fill=1)
            c.setFillColor(BODY)
            c.setFont("Helvetica", 8)
            label = "%s  %d%%" % (name, pct)
            c.drawString(lx + 13, ly + 1.5, label)
            lx += 15 + c.stringWidth(label, "Helvetica", 8) + 16


class PhaseStrip(Flowable):
    """Navy pills joined by gold arrows: Phase 1 > Phase 2 > ... ."""

    def __init__(self, phases, width, height=46, font=8.2):
        super().__init__()
        self.phases = phases
        self.width = width
        self.height = height
        self.font = font

    def wrap(self, availW, availH):
        return (self.width, self.height)

    def _wrap2(self, label, bw):
        words = label.split()
        lines, cur = [], ""
        for w in words:
            trial = (cur + " " + w).strip()
            if self.canv.stringWidth(trial, "Helvetica-Bold", self.font) <= bw - 10 or not cur:
                cur = trial
            else:
                lines.append(cur)
                cur = w
        if cur:
            lines.append(cur)
        return lines[:2]

    def draw(self):
        c = self.canv
        n = len(self.phases)
        gap = 16
        pill_w = (self.width - gap * (n - 1)) / n
        pill_h = self.height - 6
        y = 3
        for i, phase in enumerate(self.phases):
            x = i * (pill_w + gap)
            c.setFillColor(NAVY)
            c.roundRect(x, y, pill_w, pill_h, 6, stroke=0, fill=1)
            # small gold phase index
            c.setFillColor(GOLD)
            c.setFont("Helvetica-Bold", 6.6)
            c.drawCentredString(x + pill_w / 2, y + pill_h - 12, "PHASE %d" % i)
            # label, up to two lines
            lines = self._wrap2(phase, pill_w)
            c.setFillColor(white)
            c.setFont("Helvetica-Bold", self.font)
            ty = y + pill_h / 2 - self.font + (3 if len(lines) == 1 else 6.5)
            for ln in lines:
                c.drawCentredString(x + pill_w / 2, ty, ln)
                ty -= self.font + 1.6
            # arrow
            if i < n - 1:
                cy = y + pill_h / 2
                c.setStrokeColor(GOLD)
                c.setLineWidth(1.8)
                c.line(x + pill_w + 2, cy, x + pill_w + gap - 4, cy)
                c.setFillColor(GOLD)
                p = c.beginPath()
                p.moveTo(x + pill_w + gap - 2, cy)
                p.lineTo(x + pill_w + gap - 7, cy - 3.5)
                p.lineTo(x + pill_w + gap - 7, cy + 3.5)
                p.close()
                c.drawPath(p, stroke=0, fill=1)


# ---- diagram specs & registry ----------------------------------------------
def _op(label):
    return {"label": label, "kind": "opco"}


ARMS = ["Education", "Energy", "Agriculture", "Health (ilé)", "Fashion"]

DIAGRAMS = {
    "opt1": lambda: {
        "label": "HoldCo", "kind": "hold",
        "children": [_op(a) for a in ARMS],
    },
    "opt2": lambda: {
        "label": "HoldCo", "kind": "hold",
        "children": [{"label": "Shared Services & Tech", "kind": "services"}]
                    + [_op(a) for a in ARMS],
    },
    "opt3": lambda: {
        "label": "HoldCo", "kind": "hold",
        "children": [
            {"label": "Energy Sub-HoldCo", "kind": "subhold",
             "children": [_op("Oil & Gas"), _op("Solar")]},
            {"label": "Health Sub-HoldCo", "kind": "subhold",
             "children": [_op("ilé")]},
            _op("Education"), _op("Agriculture"), _op("Fashion"),
        ],
    },
    "opt4": lambda: {
        "label": "Family Trust", "kind": "trust", "note": "owns HoldCo",
        "children": [{
            "label": "HoldCo", "kind": "hold",
            "children": [_op(a) for a in ARMS],
        }],
    },
    "opt5": lambda: {
        "label": "Family Trust", "kind": "trust", "note": "add later",
        "children": [{
            "label": "HoldCo", "kind": "hold",
            "children": [
                {"label": "Shared Services & Tech", "kind": "services"},
                {"label": "Energy Sub-HoldCo", "kind": "subhold",
                 "children": [_op("Oil & Gas"), _op("Solar")]},
                {"label": "Health Sub-HoldCo", "kind": "subhold",
                 "children": [_op("ilé")]},
                _op("Education"), _op("Agriculture"), _op("Fashion"),
            ],
        }],
    },
    "service-map": lambda: {
        "label": "ilé care at home", "kind": "hold",
        "children": [
            {"label": "Home healthcare", "kind": "services",
             "children": [_op("Companion care"), _op("Skilled nursing"), _op("Complex care")]},
            {"label": "Virtual consultations", "kind": "services",
             "children": [_op("On-demand GP"), _op("Specialist e-consults"), _op("Remote monitoring")]},
            {"label": "Care coordination", "kind": "services",
             "children": [_op("Assessment & plans"), _op("Meds & diagnostics"), _op("Family dashboard")]},
        ],
    },
}

ROLLOUT_PHASES = ["Foundations", "Lagos pilot", "Scale & diaspora", "Multi-city & residential"]

CAP_SEGMENTS = [
    ("Kemi (via HoldCo)", 51, NAVY, white),
    ("Consult for Africa", 34, TEAL, white),
    ("Dr Anele", 10, GOLD, NAVY),
    ("ESOP pool", 5, OPCO_BG, NAVY),
]


def diagram_flowables(key, caption, width):
    els = [Paragraph("FIGURE", FIGEYE)]
    if caption:
        els.append(Paragraph(caption, FIGCAP))
    if key == "ile-cap":
        els.append(OwnershipBar(CAP_SEGMENTS, width))
    elif key == "rollout":
        els.append(PhaseStrip(ROLLOUT_PHASES, width))
    elif key == "service-map":
        els.append(OrgChart(DIAGRAMS[key](), width, box_h=30, v_gap=22, font=7.2))
    else:
        els.append(OrgChart(DIAGRAMS[key](), width))
    return [Spacer(1, 4), KeepTogether(els), Spacer(1, 10)]


def inline(text):
    text = text.replace("₦", "N")  # Helvetica has no naira glyph; use the N prefix
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
    text = re.sub(r"(?<!\*)\*(?!\*)(.+?)\*(?!\*)", r"<i>\1</i>", text)
    text = re.sub(r"`(.+?)`", r'<font face="Courier">\1</font>', text)
    text = re.sub(r"\[(.+?)\]\((.+?)\)", r"\1", text)
    return text


def parse(md_text):
    """Yield flowables from the markdown subset used in this note."""
    lines = md_text.split("\n")
    flow = []
    i = 0
    first_h1_seen = False
    body_started = False  # flips at the first heading; gates front-matter styling
    n = len(lines)
    while i < n:
        line = lines[i]
        stripped = line.strip()

        # diagram directive:  [[DIAGRAM:key]]  or  [[DIAGRAM:key|Caption]]
        m = re.match(r"^\[\[DIAGRAM:\s*([\w-]+)\s*(?:\|\s*(.*?))?\]\]$", stripped)
        if m:
            key = m.group(1)
            cap = (m.group(2) or "").strip()
            flow += diagram_flowables(key, cap, PAGE_W - 2 * MARGIN)
            i += 1
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
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
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
            body_started = True
            flow.append(Paragraph(inline(stripped[5:]), H3)); i += 1; continue
        if stripped.startswith("### "):
            body_started = True
            flow.append(Paragraph(inline(stripped[4:]), H2)); i += 1; continue
        if stripped.startswith("## "):
            body_started = True
            flow.append(Paragraph(inline(stripped[3:]), H1)); i += 1; continue
        if stripped.startswith("# "):
            body_started = True
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

        # top-of-doc metadata lines (bold label lines before the first heading)
        style = P
        if stripped.startswith("**") and not body_started:
            style = META
        flow.append(Paragraph(inline(stripped), style))
        i += 1

    return flow


# ----------------------------------------------------------- page furniture --
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
    c.drawString(x + 50, PAGE_H - 153, "CONSULT FOR AFRICA")
    c.setFillColor(LIGHT)
    c.setFont("Helvetica", 10)
    c.drawString(x + 50 + c.stringWidth("CONSULT FOR AFRICA", "Helvetica-Bold", 10) + 10,
                 PAGE_H - 153, "/  ADVISORY NOTE")
    c.setFillColor(GOLD)
    c.rect(x, 150, 60, 3, fill=1, stroke=0)
    c.setFillColor(LIGHT)
    c.setFont("Helvetica", 9)
    c.drawString(x, 128, "hello@consultforafrica.com   /   +234 913 813 8553   /   consultforafrica.com")
    c.drawString(x, 112, "Lagos and Abuja, Nigeria")
    c.restoreState()


def make_content_bg(kicker, footer):
    def content_bg(c, doc):
        c.saveState()
        # top rule
        c.setFillColor(NAVY)
        c.rect(0, PAGE_H - 5, PAGE_W, 5, fill=1, stroke=0)
        c.setFillColor(GOLD)
        c.rect(0, PAGE_H - 7.5, PAGE_W, 2.5, fill=1, stroke=0)
        c.setFillColor(TEAL)
        c.setFont("Helvetica-Bold", 7.5)
        c.drawString(MARGIN, PAGE_H - 24, kicker.upper())
        # icon top-right
        try:
            ic = ImageReader(str(ICON))
            iw, ih = ic.getSize()
            h = 20.0
            w = h * iw / ih
            c.drawImage(ic, PAGE_W - MARGIN - w, PAGE_H - 28, width=w, height=h, mask="auto")
        except Exception:
            pass
        # footer
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 7.5)
        c.drawString(MARGIN, 22, footer)
        c.drawRightString(PAGE_W - MARGIN, 22, "Page %d" % doc.page)
        c.setFillColor(GOLD)
        c.rect(MARGIN, 33, 18, 2, fill=1, stroke=0)
        c.restoreState()
    return content_bg


def render(src, out, doc_title, title_html, subtitle, kicker,
           prepared_for="Kemi Balogun",
           prepared_by="Debo Odulana, Founding Partner, Consult for Africa",
           status="Private and confidential. Advisory, not a legal or tax opinion.",
           footer="Consult for Africa   /   Private and confidential   /   Prepared for Kemi Balogun"):
    doc = BaseDocTemplate(
        str(out), pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN, topMargin=44, bottomMargin=42,
        title=doc_title, author="Consult for Africa",
    )
    content_frame = Frame(MARGIN, 42, PAGE_W - 2 * MARGIN, PAGE_H - 44 - 42, id="content")
    cover_frame = Frame(MARGIN, 175, PAGE_W - 2 * MARGIN, PAGE_H - 340, id="cover")
    doc.addPageTemplates([
        PageTemplate(id="cover", frames=[cover_frame], onPage=cover_bg),
        PageTemplate(id="content", frames=[content_frame], onPage=make_content_bg(kicker, footer)),
    ])

    el = []
    # ---- COVER ----
    el.append(Spacer(1, 20))
    el.append(Paragraph("AN ADVISORY NOTE",
                        ParagraphStyle("ceyebrow", fontName="Helvetica-Bold", fontSize=10,
                                       leading=13, textColor=GOLD, spaceAfter=12)))
    el.append(Paragraph(title_html,
                        ParagraphStyle("ct", fontName="Helvetica-Bold", fontSize=26,
                                       leading=32, textColor=white)))
    el.append(Spacer(1, 16))
    el.append(Paragraph(subtitle,
                        ParagraphStyle("cs", fontName="Helvetica", fontSize=12, leading=18,
                                       textColor=LIGHT)))
    el.append(Spacer(1, 26))
    for label, value in [
        ("PREPARED FOR", prepared_for),
        ("PREPARED BY", prepared_by),
        ("DATE", "July 2026"),
        ("STATUS", status),
    ]:
        el.append(Paragraph(label, ParagraphStyle("clbl", fontName="Helvetica-Bold",
                                                  fontSize=8, leading=11, textColor=GOLD,
                                                  spaceBefore=8, spaceAfter=1)))
        el.append(Paragraph(value, ParagraphStyle("cval", fontName="Helvetica",
                                                  fontSize=10.5, leading=14, textColor=white)))
    el.append(NextPageTemplate("content"))
    el.append(PageBreak())

    # ---- BODY ----
    el += parse(src.read_text())

    doc.build(el)
    print(f"wrote {out}")


def render_onepager(src, out, doc_title):
    """A single-page letterhead sheet: navy ilé header band, then the body."""
    def furniture(c, doc):
        c.saveState()
        # header band
        c.setFillColor(NAVY)
        c.rect(0, PAGE_H - 82, PAGE_W, 82, fill=1, stroke=0)
        c.setFillColor(GOLD)
        c.rect(0, PAGE_H - 85, PAGE_W, 3, fill=1, stroke=0)
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", 26)
        c.drawString(MARGIN, PAGE_H - 44, "ilé")
        c.setFillColor(GOLD)
        c.setFont("Helvetica-Bold", 8)
        c.drawString(MARGIN, PAGE_H - 58, "A CONSULT FOR AFRICA HEALTHCARE VENTURE")
        c.setFillColor(LIGHT)
        c.setFont("Helvetica", 9.5)
        c.drawRightString(PAGE_W - MARGIN, PAGE_H - 44, "Proposed terms for a")
        c.drawRightString(PAGE_W - MARGIN, PAGE_H - 57, "founding clinical partner")
        # footer
        c.setFillColor(GOLD)
        c.rect(MARGIN, 33, 18, 2, fill=1, stroke=0)
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 7.5)
        c.drawString(MARGIN, 22, "Private and confidential   /   Prepared for Dr Chris Anele   /   July 2026")
        c.drawRightString(PAGE_W - MARGIN, 22, "consultforafrica.com")
        c.restoreState()

    doc = BaseDocTemplate(
        str(out), pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN, topMargin=90, bottomMargin=36,
        title=doc_title, author="Consult for Africa",
    )
    frame = Frame(MARGIN, 36, PAGE_W - 2 * MARGIN, PAGE_H - 90 - 36, id="body")
    doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=furniture)])
    doc.build(parse(src.read_text()))
    print(f"wrote {out}")


def build():
    render(
        DOCS / "kemi-balogun-group-structuring-cfa.md",
        DOCS / "kemi-balogun-group-structuring-cfa.pdf",
        "Structuring the Group - Consult for Africa Advisory Note",
        "Structuring the<br/>group holding company",
        "Five ways to hold a multi-sector group across education, energy, agriculture, "
        "healthcare and fashion, with the tax and regulatory implications of Nigeria's 2025 "
        "reform, and a recommendation.",
        "Group holding structure",
    )
    render(
        DOCS / "kemi-ile-healthcare-venture-cfa.md",
        DOCS / "kemi-ile-healthcare-venture-cfa.pdf",
        "The ilé Healthcare Venture - Consult for Africa Advisory Note",
        "The ilé<br/>healthcare venture",
        "The shareholding proposal and founders' agreement for the home-care and residential "
        "eldercare business, with Dr Chris Anele as clinical co-founder and Consult for Africa "
        "building and managing for equity.",
        "ilé healthcare venture",
    )
    render(
        DOCS / "kemi-counsel-instruction-brief-cfa.md",
        DOCS / "kemi-counsel-instruction-brief-cfa.pdf",
        "Instruction to Counsel - Consult for Africa",
        "Instruction to<br/>legal and tax counsel",
        "A brief to establish the group holding structure and the ilé founders' agreement, "
        "and to confirm the open questions under Nigeria's 2025 tax reform.",
        "Instruction to counsel",
        prepared_for="Appointed legal and tax counsel",
        prepared_by="Debo Odulana, Consult for Africa, for Kemi Balogun",
        status="Private and confidential. Instructions, not a legal or tax opinion.",
        footer="Consult for Africa   /   Private and confidential   /   For Kemi Balogun and appointed counsel",
    )
    render_onepager(
        DOCS / "ile-anele-terms-onepager-cfa.md",
        DOCS / "ile-anele-terms-onepager-cfa.pdf",
        "ilé - Founding Clinical Partner Terms",
    )
    render(
        DOCS / "ile-rollout-plan-cfa.md",
        DOCS / "ile-rollout-plan-cfa.pdf",
        "ilé Rollout Plan - Consult for Africa",
        "ilé rollout plan<br/>phase one",
        "Home healthcare and virtual consultations for older adults and dependents, targeted at "
        "local and diaspora families: objectives, service profile, go-to-market and a gated "
        "four-phase rollout.",
        "ilé rollout plan",
        footer="Consult for Africa   /   Private and confidential   /   ilé rollout plan",
    )


if __name__ == "__main__":
    build()
