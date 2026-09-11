"""
Build the Haven Paediatric Centre survey-results PDF for Consult For Africa.

Input:  a computed analysis JSON (see scripts/_tmp_haven_compute.ts / lib/haven-survey.ts).
        Path via argv[1], else the session scratchpad analysis.json.
Output: docs/haven-survey-results-cfa.pdf  (A4, multi-page, branded)

Run:
  python3 scripts/build-haven-survey-results.py [path/to/analysis.json]
"""

from __future__ import annotations

import json
import sys
from datetime import datetime
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate,
    Flowable,
    Frame,
    KeepTogether,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "haven-survey-results-cfa.pdf"
DEFAULT_JSON = ROOT / "docs" / "data" / "haven-survey-analysis.json"

# ---- brand palette (source: docs/brand-guide-cfa.pdf) ----------------------
NAVY = HexColor("#0B3C5D")
DEEP = HexColor("#081726")
GOLD = HexColor("#D4AF37")
TEAL = HexColor("#1F7A8C")
INK = HexColor("#1E2A33")
MUTED = HexColor("#64748B")
LINE = HexColor("#E4E9EF")
SURFACE = HexColor("#FAF8F2")

GOOD_BG, GOOD = HexColor("#E7F4EC"), HexColor("#15803D")
WARN_BG, WARN = HexColor("#FBF0D9"), HexColor("#92400E")
BAD_BG, BAD = HexColor("#FBE7E7"), HexColor("#B91C1C")
DIST = {
    "1": HexColor("#EF4444"), "2": HexColor("#F59E0B"), "3": HexColor("#FCD34D"),
    "4": HexColor("#84CC16"), "5": HexColor("#10B981"),
}

PAGE_W, PAGE_H = A4
MARGIN = 16 * mm
CONTENT_W = PAGE_W - 2 * MARGIN

# ---- styles ----------------------------------------------------------------
def p(name, **kw):
    base = dict(fontName="Helvetica", fontSize=9, leading=13, textColor=INK)
    base.update(kw)
    return ParagraphStyle(name, **base)

S = {
    "eyebrow": p("eyebrow", fontName="Helvetica-Bold", fontSize=7.5, textColor=GOLD, leading=11),
    "h": p("h", fontName="Times-Roman", fontSize=14, textColor=NAVY, leading=17, spaceBefore=2),
    "st": p("st", fontName="Helvetica-Bold", fontSize=7.5, textColor=TEAL, leading=11),
    "q": p("q", fontSize=8.2, leading=10.5),
    "qrev": p("qrev", fontSize=8.2, leading=10.5, textColor=HexColor("#7a5a12")),
    "body": p("body", fontSize=8.8, leading=13, textColor=HexColor("#3a4956")),
    "cell": p("cell", fontSize=8, leading=11),
    "num": p("num", fontName="Helvetica-Bold", fontSize=8.5, alignment=TA_RIGHT),
    "small": p("small", fontSize=7, textColor=MUTED, leading=9, alignment=TA_RIGHT),
    "foot": p("foot", fontSize=7.2, leading=10, textColor=MUTED),
    "cardl": p("cardl", fontName="Helvetica-Bold", fontSize=6.8, textColor=MUTED, leading=9),
    "cardv": p("cardv", fontName="Times-Roman", fontSize=20, textColor=NAVY, leading=21),
    "cardh": p("cardh", fontSize=7, textColor=MUTED, leading=9),
    "findh": p("findh", fontName="Helvetica-Bold", fontSize=8.5, leading=12),
    "cmt": p("cmt", fontSize=8, leading=11.5, textColor=HexColor("#37444f")),
}


def fmt_date(iso):
    if not iso:
        return "—"
    return datetime.fromisoformat(iso.replace("Z", "+00:00")).strftime("%-d %b %Y")


def goodness(mean, rev):
    return (6 - mean) if rev else mean


def score_colors(mean, rev):
    g = goodness(mean, rev)
    if g >= 4:
        return GOOD_BG, GOOD
    if g >= 3:
        return WARN_BG, WARN
    return BAD_BG, BAD


# ---- distribution bar flowable --------------------------------------------
class DistBar(Flowable):
    def __init__(self, dist, n, width, height=6):
        super().__init__()
        self.dist, self.n, self.width, self.height = dist, n, width, height

    def draw(self):
        c = self.canv
        total = max(self.n, 1)
        x = 0
        c.setFillColor(HexColor("#EEF2F6"))
        c.roundRect(0, 0, self.width, self.height, 2, fill=1, stroke=0)
        for k in ["1", "2", "3", "4", "5"]:
            cnt = self.dist.get(k, 0)
            if not cnt:
                continue
            w = self.width * cnt / total
            c.setFillColor(DIST[k])
            c.rect(x, 0, w, self.height, fill=1, stroke=0)
            x += w


class Pill(Flowable):
    """Coloured rounded score chip."""
    def __init__(self, text, bg, fg, width=30, height=13):
        super().__init__()
        self.text, self.bg, self.fg, self.width, self.height = text, bg, fg, width, height

    def draw(self):
        c = self.canv
        c.setFillColor(self.bg)
        c.roundRect(0, 0, self.width, self.height, 3, fill=1, stroke=0)
        c.setFillColor(self.fg)
        c.setFont("Helvetica-Bold", 8.5)
        c.drawCentredString(self.width / 2, 3.2, self.text)


# ---- page furniture --------------------------------------------------------
def draw_header_footer(canv, doc):
    canv.saveState()
    # footer rule + text
    canv.setStrokeColor(LINE)
    canv.setLineWidth(0.5)
    canv.line(MARGIN, 12 * mm, PAGE_W - MARGIN, 12 * mm)
    canv.setFont("Helvetica", 7)
    canv.setFillColor(MUTED)
    canv.drawString(MARGIN, 8 * mm, "Consult for Africa  ·  Haven Paediatric Centre  ·  Confidential")
    canv.drawRightString(PAGE_W - MARGIN, 8 * mm, "Page %d" % doc.page)
    canv.restoreState()


def hr(space_before=8, space_after=8):
    t = Table([[""]], colWidths=[CONTENT_W], rowHeights=[0.5])
    t.setStyle(TableStyle([("LINEBELOW", (0, 0), (-1, -1), 0.5, LINE)]))
    return [Spacer(1, space_before), t, Spacer(1, space_after)]


def eyebrow(text, note=""):
    if note:
        return Paragraph(f'{text}  <font color="#94a3b8" size=7>{note}</font>', S["eyebrow"])
    return Paragraph(text, S["eyebrow"])


# ---- builders --------------------------------------------------------------
def part_title(story, number, title, blurb):
    story += hr()
    story.append(Paragraph(f"PART {number}", S["eyebrow"]))
    story.append(Spacer(1, 2))
    story.append(Paragraph(title, S["h"]))
    story.append(Spacer(1, 4))
    story.append(Paragraph(blurb, S["body"]))
    story.append(Spacer(1, 10))


def build_cover_band(story, staff, patient):
    span = sorted(
        [d for d in (staff["earliest"], staff["latest"], patient["earliest"], patient["latest"]) if d]
    )
    band = Table(
        [[Paragraph('CONSULT FOR <font color="#D4AF37">AFRICA</font>',
                    p("m", fontName="Helvetica-Bold", fontSize=8, textColor=white))],
         [Paragraph("Haven Paediatric Centre", p("t1", fontName="Times-Roman", fontSize=22, textColor=white, leading=25))],
         [Paragraph("Diagnostic Audit: Survey Results", p("t2", fontName="Times-Roman", fontSize=15, textColor=HexColor("#c3d3de"), leading=18))],
         [Spacer(1, 6)],
         [Paragraph(
             f'<b>{patient["count"]}</b> caregiver responses &nbsp;·&nbsp; '
             f'<b>{staff["count"]}</b> staff responses &nbsp;·&nbsp; both anonymous &nbsp;·&nbsp; '
             f'Fieldwork <b>{fmt_date(span[0])} to {fmt_date(span[-1])}</b> &nbsp;·&nbsp; '
             f'Scale <b>1 to 5</b> &nbsp;·&nbsp; Prepared by <b>Consult for Africa</b>',
             p("mt", fontSize=8, textColor=HexColor("#aebfca"), leading=12))]],
        colWidths=[CONTENT_W],
    )
    band.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NAVY),
        ("LEFTPADDING", (0, 0), (-1, -1), 16), ("RIGHTPADDING", (0, 0), (-1, -1), 16),
        ("TOPPADDING", (0, 0), (0, 0), 14), ("BOTTOMPADDING", (0, -1), (-1, -1), 14),
        ("LINEABOVE", (0, 4), (-1, 4), 0.5, HexColor("#3a5f78")),
        ("TOPPADDING", (0, 4), (-1, 4), 8),
    ]))
    story.append(band)
    story.append(Spacer(1, 14))


def build_cards(story, specs):
    def card(label, value, hint):
        return Table(
            [[Paragraph(label.upper(), S["cardl"])],
             [Paragraph(value, S["cardv"])],
             [Paragraph(hint, S["cardh"])]],
            colWidths=[(CONTENT_W - 3 * 8) / 4],
        )
    cards = [card(*s) for s in specs]
    row = Table([cards], colWidths=[CONTENT_W / 4] * 4)
    row.setStyle(TableStyle([
        ("BOX", (0, 0), (0, 0), 0.6, LINE), ("BOX", (1, 0), (1, 0), 0.6, LINE),
        ("BOX", (2, 0), (2, 0), 0.6, LINE), ("BOX", (3, 0), (3, 0), 0.6, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8), ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 8), ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(row)


def build_grade_chart(story, grade, title="OVERALL GRADE ON PATIENT SAFETY", rule=True):
    if rule:
        story += hr()
    story.append(eyebrow(title))
    story.append(Spacer(1, 8))
    gcolors = ["#10B981", "#84CC16", "#FCD34D", "#F59E0B", "#EF4444"]
    rows = []
    for i, r in enumerate(grade["rows"]):
        bar = DistBar({"5": r["count"]}, grade["answered"], width=CONTENT_W - 62 - 46 - 20, height=12)
        # recolor: use single colour by grade rank
        bar.dist = {"x": r["count"]}
        # simpler: draw with custom colour via a tiny subclass instance
        rows.append([
            Paragraph(r["label"], S["cell"]),
            SingleBar(r["count"], grade["answered"], HexColor(gcolors[i] if i < len(gcolors) else "#94a3b8"),
                      width=CONTENT_W - 62 - 46 - 24, height=12),
            Paragraph(f'{r["count"]}/{grade["answered"]}', S["small"]),
        ])
    t = Table(rows, colWidths=[62, CONTENT_W - 62 - 46 - 24 + 12, 46 + 12])
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 2.5), ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
    ]))
    story.append(t)


class SingleBar(Flowable):
    def __init__(self, count, total, color, width, height=12):
        super().__init__()
        self.count, self.total, self.color, self.width, self.height = count, total, color, width, height

    def draw(self):
        c = self.canv
        c.setFillColor(HexColor("#F1F4F8"))
        c.roundRect(0, 0, self.width, self.height, 2, fill=1, stroke=0)
        w = self.width * self.count / max(self.total, 1)
        if w > 0:
            c.setFillColor(self.color)
            c.roundRect(0, 0, max(w, 2), self.height, 2, fill=1, stroke=0)


def build_findings(story, safety):
    scored = [s for s in safety["scale"] if s["mean"] is not None]
    strengths = sorted([s for s in scored if not s["reverse"]], key=lambda s: -s["mean"])[:5]
    watch = sorted(scored, key=lambda s: goodness(s["mean"], s["reverse"]))[:5]

    def col(title, items, color):
        rows = [[Paragraph(title, ParagraphStyle("fh", parent=S["findh"], textColor=color))]]
        for s in items:
            bg, fg = score_colors(s["mean"], s["reverse"])
            label = s["text"] + (' <font size=6 color="#92400E">(rev)</font>' if s["reverse"] else "")
            rows.append([
                Table([[Paragraph(label, S["cell"]),
                        Pill(f'{s["mean"]:.2f}', bg, fg, width=30, height=13)]],
                      colWidths=[(CONTENT_W / 2 - 16) - 38, 34])
            ])
        t = Table(rows, colWidths=[CONTENT_W / 2 - 12])
        style = [("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                 ("TOPPADDING", (0, 1), (-1, -1), 4), ("BOTTOMPADDING", (0, 1), (-1, -1), 4),
                 ("BOTTOMPADDING", (0, 0), (-1, 0), 6)]
        for i in range(1, len(rows)):
            style.append(("LINEBELOW", (0, i), (-1, i), 0.4, LINE))
        t.setStyle(TableStyle(style))
        return t

    story += hr()
    two = Table([[col("▲ Strongest signals", strengths, GOOD),
                  col("▼ Where to look next", watch, WARN)]],
                colWidths=[CONTENT_W / 2, CONTENT_W / 2])
    two.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"),
                             ("LEFTPADDING", (0, 0), (0, 0), 0),
                             ("RIGHTPADDING", (1, 0), (1, 0), 0),
                             ("LEFTPADDING", (1, 0), (1, 0), 24)]))
    story.append(two)


def build_narrative(story, paras, title="WHAT THE NUMBERS SAY"):
    story += hr()
    story.append(eyebrow(title))
    story.append(Spacer(1, 6))
    inner = [[Paragraph(t, S["body"])] for t in paras]
    box = Table(inner, colWidths=[CONTENT_W - 24])
    box.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), SURFACE),
        ("LINEBEFORE", (0, 0), (0, -1), 2.5, GOLD),
        ("LEFTPADDING", (0, 0), (-1, -1), 14), ("RIGHTPADDING", (0, 0), (-1, -1), 14),
        ("TOPPADDING", (0, 0), (0, 0), 12), ("BOTTOMPADDING", (0, -1), (-1, -1), 12),
        ("TOPPADDING", (0, 1), (-1, -1), 6),
    ]))
    story.append(box)


def build_results(story, safety):
    story += hr()
    story.append(eyebrow("FULL RESULTS BY SECTION"))
    story.append(Spacer(1, 4))
    bar_w = 120
    # group by section preserving order
    groups = []
    for s in safety["scale"]:
        if groups and groups[-1][0] == s["section"]:
            groups[-1][1].append(s)
        else:
            groups.append((s["section"], [s]))

    for section, items in groups:
        rows = []
        for s in items:
            bg, fg = score_colors(s["mean"], s["reverse"])
            label = s["text"] + (' <font size=6 color="#92400E">(rev)</font>' if s["reverse"] else "")
            na = f' · NA {s["dist"]["NA"]}' if s["dist"].get("NA") else ""
            rows.append([
                Paragraph(label, S["qrev"] if s["reverse"] else S["q"]),
                DistBar(s["dist"], s["n"], width=bar_w, height=7),
                Pill(f'{s["mean"]:.2f}', bg, fg, width=32, height=13),
                Paragraph(f'n={s["n"]}{na}', S["small"]),
            ])
        col_q = CONTENT_W - bar_w - 40 - 46 - 24
        t = Table(rows, colWidths=[col_q, bar_w + 12, 40, 46 + 12])
        style = [
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]
        for i in range(len(rows)):
            style.append(("LINEBELOW", (0, i), (-1, i), 0.4, LINE))
        t.setStyle(TableStyle(style))
        block = [Paragraph(section.upper(), S["st"]), Spacer(1, 3), t, Spacer(1, 10)]
        story.append(KeepTogether(block))


def build_demographics(story, safety):
    story += hr()
    story.append(eyebrow("WHO RESPONDED", "(optional, self-reported)"))
    story.append(Spacer(1, 8))

    def demo(cat):
        rows = [[Paragraph(cat["label"], p("dl", fontName="Helvetica-Bold", fontSize=8.5, textColor=NAVY)),
                 Paragraph(f'{cat["answered"]} answered', S["small"])]]
        head = Table([rows[0]], colWidths=[(CONTENT_W / 2 - 30) * 0.7, (CONTENT_W / 2 - 30) * 0.3])
        head.setStyle(TableStyle([("LEFTPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 6)]))
        drows = []
        bw = CONTENT_W / 2 - 30 - 90 - 24
        for r in cat["rows"]:
            drows.append([
                Paragraph(r["label"], S["cell"]),
                SingleBar(r["count"], cat["answered"], NAVY, width=bw, height=7),
                Paragraph(str(r["count"]), S["small"]),
            ])
        body = Table(drows, colWidths=[90, bw + 12, 24])
        body.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("TOPPADDING", (0, 0), (-1, -1), 2.5), ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5),
        ]))
        cell = Table([[head], [body]], colWidths=[CONTENT_W / 2 - 12])
        cell.setStyle(TableStyle([("BOX", (0, 0), (-1, -1), 0.6, LINE),
                                  ("LEFTPADDING", (0, 0), (-1, -1), 12), ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                                  ("TOPPADDING", (0, 0), (-1, -1), 10), ("BOTTOMPADDING", (0, 0), (-1, -1), 10)]))
        return cell

    area = next(c for c in safety["categorical"] if c["key"] == "area")
    tenure = next(c for c in safety["categorical"] if c["key"] == "tenure")
    two = Table([[demo(area), demo(tenure)]], colWidths=[CONTENT_W / 2, CONTENT_W / 2])
    two.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"),
                             ("LEFTPADDING", (0, 0), (0, 0), 0), ("RIGHTPADDING", (1, 0), (1, 0), 0),
                             ("LEFTPADDING", (1, 0), (1, 0), 24)]))
    story.append(KeepTogether(two))


def build_comments(story, safety):
    story += hr()
    story.append(eyebrow("IN THEIR OWN WORDS"))
    for o in safety["openText"]:
        if not o["answers"]:
            continue
        story.append(Spacer(1, 8))
        story.append(Paragraph(f'{o["label"].upper()} · {len(o["answers"])}', S["st"]))
        story.append(Spacer(1, 4))
        for a in o["answers"]:
            safe = a.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\n", "<br/>")
            cmt = Table([[Paragraph(safe, S["cmt"])]], colWidths=[CONTENT_W])
            cmt.setStyle(TableStyle([("BOX", (0, 0), (-1, -1), 0.6, LINE),
                                     ("LEFTPADDING", (0, 0), (-1, -1), 11), ("RIGHTPADDING", (0, 0), (-1, -1), 11),
                                     ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7)]))
            story.append(cmt)
            story.append(Spacer(1, 5))


def build_method(story, staff, patient):
    story += hr()
    latest = max(d for d in (staff["latest"], patient["latest"]) if d)
    txt = (
        f'<b>Method.</b> Two anonymous on-platform surveys. {patient["count"]} caregiver responses '
        f'collected {fmt_date(patient["earliest"])} to {fmt_date(patient["latest"])}, and '
        f'{staff["count"]} staff responses collected {fmt_date(staff["earliest"])} to '
        f'{fmt_date(staff["latest"])}. Scale items run 1 (strongly disagree or never) to 5 (strongly '
        "agree or always); “N/A, don't know” is excluded from the mean. <b>n</b> is the number of scored "
        "answers per item. <b>(rev)</b>-tagged items are negatively worded, so a lower score is the good "
        "result; colour is set on that basis and they are excluded from the positive-items average. "
        "Distribution bars run red (1) to green (5). Both instruments are self-selecting and anonymous, "
        "so they measure the views of those who chose to respond rather than of the whole population. "
        "Free-text comments are reproduced verbatim, including original spelling. Prepared by Consult "
        f'for Africa for Haven Paediatric Centre; figures reflect responses as at {fmt_date(latest)}.'
    )
    story.append(Paragraph(txt, S["foot"]))


def normalise(survey):
    """Expand categorical counts into ordered label/count rows."""
    for c in survey["categorical"]:
        c["rows"] = [{"label": opt.replace("–", " to "), "count": c["counts"].get(opt, 0)}
                     for opt in c["options"]]
    return survey


def cat(survey, key):
    return next(c for c in survey["categorical"] if c["key"] == key)


def item(survey, key):
    return next(s for s in survey["scale"] if s["key"] == key)


def main():
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_JSON
    data = json.loads(src.read_text())
    staff = normalise(next(s for s in data["surveys"] if s["id"] == "haven-safety-culture"))
    patient = normalise(next(s for s in data["surveys"] if s["id"] == "haven-patient-experience"))

    grade = cat(staff, "grade")
    overall = cat(patient, "overall")
    recommend = cat(patient, "recommend")
    top_grade = grade["rows"][0]["count"] + grade["rows"][1]["count"]
    definitely = recommend["rows"][0]["count"]
    excellent = overall["rows"][0]["count"]

    def sm(k):
        return item(staff, k)["mean"]

    def pm(k):
        return item(patient, k)["mean"]

    doc = BaseDocTemplate(
        str(OUT), pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN, topMargin=MARGIN, bottomMargin=18 * mm,
        title="Haven Paediatric Centre - Survey Results", author="Consult for Africa",
    )
    frame = Frame(MARGIN, 18 * mm, CONTENT_W, PAGE_H - MARGIN - 18 * mm, id="main")
    doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=draw_header_footer)])

    story = []
    build_cover_band(story, staff, patient)
    build_cards(story, [
        ("Caregiver rating", f'{patient["positiveAvg"]:.2f} <font size=11 color="#64748B">/5</font>',
         "mean, all items"),
        ("Would recommend",
         f'{definitely} <font size=11 color="#64748B">/{recommend["answered"]}</font>',
         "definitely, to other parents"),
        ("Staff rating", f'{staff["positiveAvg"]:.2f} <font size=11 color="#64748B">/5</font>',
         "mean of positive items"),
        ("Safety graded", f'{top_grade} <font size=11 color="#64748B">/{grade["answered"]}</font>',
         "very good or excellent"),
    ])

    # ---------------- PART 1: caregivers ----------------
    part_title(
        story, "ONE", "What families say",
        f'{patient["count"]} parents and caregivers responded anonymously between '
        f'{fmt_date(patient["earliest"])} and {fmt_date(patient["latest"])}. This is the first time '
        "patient voice has been measured at Haven, and it is the strongest result in the diagnostic.")
    build_grade_chart(story, overall, "OVERALL EXPERIENCE", rule=False)
    story.append(Spacer(1, 10))
    build_grade_chart(story, recommend, "WOULD RECOMMEND HAVEN TO OTHER PARENTS", rule=False)
    build_findings(story, patient)
    build_narrative(story, [
        f"<b>The result is unambiguous.</b> The mean across all ten items is "
        f"{patient['positiveAvg']:.2f} of 5, every respondent rated their overall experience Good or "
        f"better, {excellent} of {overall['answered']} rated it Excellent, and {definitely} of "
        f"{recommend['answered']} would definitely recommend Haven to other parents. Cleanliness "
        f"({pm('q7'):.2f}), ease of access ({pm('q1'):.2f}), confidence in the medical team "
        f"({pm('q9'):.2f}) and being treated with kindness ({pm('q3'):.2f}) are the strongest signals.",
        f"<b>Three softer edges, and they are all about information.</b> Clarity of charges and "
        f"payments ({pm('q10'):.2f}) is the lowest item in the instrument. Knowing what is happening "
        f"with the child's care ({pm('q6'):.2f}) and waiting time ({pm('q2'):.2f}) follow. None is a "
        "failing score. All three are communication rather than clinical, which makes them "
        "inexpensive to fix.",
        "<b>The comments ask for access, not for better care.</b> Remote consultation for families "
        "who travel long distances, electronic access to results, clearer information on the cost of "
        "medicines billed to health plans, and more doctors on site. Every one of these is a request "
        "to make an experience they already rate highly easier to reach.",
    ], title="WHAT FAMILIES ARE TELLING US")
    build_results(story, patient)
    build_comments(story, patient)

    # ---------------- PART 2: staff ----------------
    part_title(
        story, "TWO", "What staff say",
        f'{staff["count"]} staff responded anonymously between {fmt_date(staff["earliest"])} and '
        f'{fmt_date(staff["latest"])}, across nine sections adapted from a recognised hospital '
        "safety-culture instrument. Read alongside Part One, it shows an organisation whose people "
        "are producing an excellent patient experience without the systems that should be supporting "
        "them.")
    build_cards(story, [
        ("Responses", str(staff["count"]), "Staff, anonymous"),
        ("Safety grade",
         f'{grade["rows"][0]["count"]} <font size=11 color="#64748B">/{grade["answered"]}</font>',
         "rated Excellent"),
        ("Positive items avg", f'{staff["positiveAvg"]:.2f} <font size=11 color="#64748B">/5</font>',
         "mean of positive items"),
        ("Recommend care", f'{sm("rec_care"):.2f} <font size=11 color="#64748B">/5</font>',
         "place to receive care"),
    ])
    build_grade_chart(story, grade)
    build_findings(story, staff)
    build_narrative(story, [
        f"<b>Safety and teamwork read strongly.</b> Every respondent graded patient safety Acceptable "
        f"or better and {top_grade} of {grade['answered']} graded it Very good or Excellent. Teamwork "
        f"({sm('q1'):.2f}), handovers ({sm('q25'):.2f}), learning from error ({sm('q9'):.2f}) and "
        f"management commitment to safety ({sm('q23'):.2f}) all sit at or above 4.2, and the "
        "reverse-worded risk items sit low, which is the good result.",
        f"<b>The soft edges are all about the deal, not the work.</b> Pay and reward fairness "
        f"({sm('q34'):.2f}) is the weakest positive item in the instrument, recognition "
        f"({sm('q35'):.2f}) is close behind, and freedom to question those with more authority "
        f"({sm('q6'):.2f}) shows that voice is conditional. Resuscitation training currency "
        f"({sm('q32'):.2f}) is the single lowest score and is a clinical exposure rather than a "
        "welfare one.",
        f"<b>The reverse items point at just culture.</b> Feeling blamed rather than helped after "
        f"reporting an event ({sm('q12'):.2f}) is the weakest of the reverse set. Set against a "
        "documented absence of any incident register, it is the edge most worth protecting, because "
        "an organisation that reports openly is far harder to build than one that records formally.",
        "<b>The free text is remarkably consistent.</b> Two themes dominate: more staffing for "
        "patient safety, and staff welfare, meaning health insurance, pension, fair and timely pay, "
        "recognition and clinical training, for a better place to work. Facility asks form a "
        "secondary cluster: bed spaces, inpatient communication, lift access, and ward flooding. "
        "Almost every critical comment is prefaced with warmth about the place.",
    ])
    build_results(story, staff)
    build_demographics(story, staff)
    build_comments(story, staff)

    build_method(story, staff, patient)

    doc.build(story)
    print(f"wrote {OUT.relative_to(ROOT)}  ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
