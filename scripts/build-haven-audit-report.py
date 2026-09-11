"""
Build the Haven Paediatrics Organisational Audit Report for Consult For Africa.

Phase 2 report: opening hypotheses tested against field validation interviews,
an anonymous staff safety-and-culture survey, and an anonymous patient and
caregiver experience survey.

Survey exhibits are computed live from docs/data/haven-survey-analysis.json
(regenerate with: npx tsx --env-file=.env.local scripts/compute-haven-surveys.ts docs/data/haven-survey-analysis.json)

Output: docs/haven-organisational-audit-report-cfa.pdf   (A4, branded)

Run:
  python3 scripts/build-haven-audit-report.py
"""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.platypus import (
    BaseDocTemplate,
    Flowable,
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
OUT = DOCS / "haven-organisational-audit-report-cfa.pdf"
ANALYSIS = DOCS / "data" / "haven-survey-analysis.json"

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
LINE = HexColor("#E4E9EF")

GOOD_BG, GOOD = HexColor("#E7F4EC"), HexColor("#15803D")
WARN_BG, WARN = HexColor("#FBF0D9"), HexColor("#92400E")
BAD_BG, BAD = HexColor("#FBE7E7"), HexColor("#B91C1C")

PAGE_W, PAGE_H = A4
MARGIN = 46
CONTENT_W = PAGE_W - 2 * MARGIN

# ---------------------------------------------------------------- styles -----
def style(name, **kw):
    base = dict(fontName="Helvetica", fontSize=10, leading=15, textColor=BODY,
                alignment=TA_LEFT, spaceAfter=7)
    base.update(kw)
    return ParagraphStyle(name, **base)


H1 = style("h1", fontName="Helvetica-Bold", fontSize=15, leading=19, textColor=NAVY,
           spaceBefore=16, spaceAfter=8)
H2 = style("h2", fontName="Helvetica-Bold", fontSize=11.5, leading=15, textColor=TEAL,
           spaceBefore=10, spaceAfter=4)
H3 = style("h3", fontName="Helvetica-Bold", fontSize=10, leading=14, textColor=NAVY,
           spaceBefore=6, spaceAfter=3)
EYEBROW = style("eyebrow", fontName="Helvetica-Bold", fontSize=7.5, textColor=GOLD,
                leading=11, spaceAfter=3)
P = style("p")
LEDE = style("lede", fontSize=10.8, leading=16.5, textColor=HexColor("#374151"))
SMALL = style("small", fontSize=8.5, leading=12, textColor=MUTED)
CELL = style("cell", fontSize=9, leading=12.5, spaceAfter=0)
CELL_S = style("cells", fontSize=8.2, leading=11.5, spaceAfter=0)
CELL_B = style("cellb", fontSize=9, leading=12.5, fontName="Helvetica-Bold", spaceAfter=0)
CELL_W = style("cellw", fontSize=8.6, leading=12, fontName="Helvetica-Bold",
               textColor=white, spaceAfter=0)
CELL_C = style("cellc", fontSize=9, leading=12.5, alignment=TA_CENTER, spaceAfter=0)
CELL_CB = style("cellcb", fontSize=9, leading=12.5, alignment=TA_CENTER,
                fontName="Helvetica-Bold", spaceAfter=0)
NUM = style("num", fontSize=9, leading=12.5, alignment=TA_RIGHT,
            fontName="Helvetica-Bold", spaceAfter=0)

# ------------------------------------------------------------------ data -----
DATA = json.loads(ANALYSIS.read_text())
STAFF = next(s for s in DATA["surveys"] if s["id"] == "haven-safety-culture")
PATIENT = next(s for s in DATA["surveys"] if s["id"] == "haven-patient-experience")


def q(survey, key):
    return next(s for s in survey["scale"] if s["key"] == key)


def m(survey, key):
    """Mean of an item, formatted to two decimals."""
    return f'{q(survey, key)["mean"]:.2f}'


def cat(survey, key):
    return next(c for c in survey["categorical"] if c["key"] == key)


def fmt_date(iso):
    return datetime.fromisoformat(iso.replace("Z", "+00:00")).strftime("%-d %B %Y")


S_N = STAFF["count"]
P_N = PATIENT["count"]
S_FROM, S_TO = fmt_date(STAFF["earliest"]), fmt_date(STAFF["latest"])
P_FROM, P_TO = fmt_date(PATIENT["earliest"]), fmt_date(PATIENT["latest"])
S_POS = f'{STAFF["positiveAvg"]:.2f}'
P_POS = f'{PATIENT["positiveAvg"]:.2f}'

_grade = cat(STAFF, "grade")["counts"]
GRADE_TOP = _grade.get("Excellent", 0) + _grade.get("Very good", 0)
_overall = cat(PATIENT, "overall")["counts"]
P_TOP = _overall.get("Excellent", 0) + _overall.get("Very good", 0)
_rec = cat(PATIENT, "recommend")
P_DEFINITELY = _rec["counts"].get("Definitely", 0)
P_REC_N = _rec["answered"]
_ten = cat(STAFF, "tenure")
TEN_N = _ten["answered"]
TEN_UNDER_1Y = _ten["counts"].get("Under 6 months", 0) + _ten["counts"].get("6–12 months", 0)
TEN_OVER_2Y = _ten["counts"].get("2 years or more", 0)


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
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 23,
                      "Haven Paediatrics  /  Organisational Audit Report")
    c.setFillColor(GOLD)
    c.rect(MARGIN, 30, 24, 2, fill=1, stroke=0)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8)
    c.drawString(MARGIN, 18, "Confidential  /  Prepared for the Haven Paediatrics board")
    c.drawRightString(PAGE_W - MARGIN, 18, "Page %d" % (doc.page - 1))
    try:
        _ic = ImageReader(str(DOCS / "c4a-icon.png"))
        _iw, _ih = _ic.getSize()
        _h = 22.0
        _w = _h * _iw / _ih
        c.drawImage(_ic, PAGE_W - MARGIN - _w, PAGE_H - 61, width=_w, height=_h, mask="auto")
    except Exception:
        pass
    c.restoreState()


# -------------------------------------------------------------- components ---
def card(text, bg=SURFACE, fg=BODY, bold=False, rule=GOLD):
    st = ParagraphStyle("c", parent=P, textColor=fg, spaceBefore=2, spaceAfter=2,
                        fontName="Helvetica-Bold" if bold else "Helvetica")
    t = Table([[Paragraph(text, st)]], colWidths=[CONTENT_W])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("LINEBEFORE", (0, 0), (0, -1), 3, rule),
        ("TOPPADDING", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
    ]))
    return t


def table(rows, widths, align_centre=(), zebra=True, total_row=False, small=False):
    """Header row + body rows of plain strings."""
    body_style = CELL_S if small else CELL
    out = []
    for i, r in enumerate(rows):
        cells = []
        for j, c in enumerate(r):
            if i == 0:
                st = CELL_W
            elif total_row and i == len(rows) - 1:
                st = CELL_B
            elif j == 0:
                st = CELL_B if not small else style("cbs", fontSize=8.2, leading=11.5,
                                                    fontName="Helvetica-Bold", spaceAfter=0)
            else:
                st = body_style
            if j in align_centre and i > 0:
                st = ParagraphStyle("ac", parent=st, alignment=TA_CENTER)
            cells.append(Paragraph(str(c), st))
        out.append(cells)
    t = Table(out, colWidths=widths, repeatRows=1)
    cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("LINEBELOW", (0, 0), (-1, 0), 2, GOLD),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]
    if zebra:
        end = -2 if total_row else -1
        cmds.append(("ROWBACKGROUNDS", (0, 1), (-1, end), [white, SURFACE]))
    if total_row:
        cmds += [("BACKGROUND", (0, -1), (-1, -1), CREAM),
                 ("LINEABOVE", (0, -1), (-1, -1), 1.5, GOLD)]
    t.setStyle(TableStyle(cmds))
    return t


class Rule(Flowable):
    def __init__(self, w=CONTENT_W, colour=LINE, thickness=0.7):
        super().__init__()
        self.w, self.colour, self.thickness = w, colour, thickness
        self.height = thickness

    def draw(self):
        self.canv.setStrokeColor(self.colour)
        self.canv.setLineWidth(self.thickness)
        self.canv.line(0, 0, self.w, 0)


def hr(space_before=10, space_after=8):
    return [Spacer(1, space_before), Rule(), Spacer(1, space_after)]


def bullets(items, st=P, bullet="•"):
    return [Paragraph(f"{bullet}&nbsp;&nbsp;{b}", st) for b in items]


def stat_row(items):
    """items: list of (label, value, hint)."""
    cells = []
    for label, value, hint in items:
        inner = Table([
            [Paragraph(label.upper(), style("sl", fontSize=6.8, fontName="Helvetica-Bold",
                                            textColor=MUTED, leading=9, spaceAfter=0))],
            [Paragraph(value, style("sv", fontSize=19, fontName="Helvetica-Bold",
                                    textColor=NAVY, leading=22, spaceAfter=0))],
            [Paragraph(hint, style("sh", fontSize=7.2, textColor=MUTED, leading=9.5,
                                   spaceAfter=0))],
        ], colWidths=[(CONTENT_W - 3 * 8) / len(items) - 16])
        inner.setStyle(TableStyle([
            ("TOPPADDING", (0, 0), (-1, -1), 1),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ]))
        cells.append(inner)
    t = Table([cells], colWidths=[CONTENT_W / len(items)] * len(items))
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), SURFACE),
        ("LINEABOVE", (0, 0), (-1, 0), 2, GOLD),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ]))
    return t


def finding(ref, title, verdict, body, evidence, risk=None, vcolour=BAD, vbg=BAD_BG):
    """A numbered audit finding block."""
    head = Table([[
        Paragraph(ref, style("fr", fontSize=8, fontName="Helvetica-Bold", textColor=white,
                             alignment=TA_CENTER, leading=11, spaceAfter=0)),
        Paragraph(title, style("ft", fontSize=10.5, fontName="Helvetica-Bold",
                               textColor=NAVY, leading=14, spaceAfter=0)),
        Paragraph(verdict.upper(), style("fv", fontSize=7.2, fontName="Helvetica-Bold",
                                         textColor=vcolour, alignment=TA_RIGHT,
                                         leading=11, spaceAfter=0)),
    ]], colWidths=[38, CONTENT_W - 38 - 108, 108])
    head.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, 0), NAVY),
        ("BACKGROUND", (2, 0), (2, 0), vbg),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    el = [head, Spacer(1, 5)]
    for para in body:
        el.append(Paragraph(para, P))
    meta = [[Paragraph("<b>Evidence</b>&nbsp; " + evidence,
                       style("fe", fontSize=8.2, leading=11.5, textColor=MUTED, spaceAfter=0))]]
    if risk:
        meta.append([Paragraph("<b>Consequence if unaddressed</b>&nbsp; " + risk,
                               style("fk", fontSize=8.2, leading=11.5, textColor=MUTED,
                                     spaceAfter=0))])
    mt = Table(meta, colWidths=[CONTENT_W])
    mt.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), HexColor("#F8FAFC")),
        ("LINEBEFORE", (0, 0), (0, -1), 2, LIGHT),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ]))
    el.append(mt)
    el.append(Spacer(1, 14))
    return el


def section_profile(survey):
    """Per-section averages: positive items and reverse items separately."""
    order, pos, rev = [], {}, {}
    for item in survey["scale"]:
        s = item["section"]
        if s not in order:
            order.append(s)
            pos[s], rev[s] = [], []
        (rev if item["reverse"] else pos)[s].append(item["mean"])
    out = []
    for s in order:
        p = sum(pos[s]) / len(pos[s]) if pos[s] else None
        r = sum(rev[s]) / len(rev[s]) if rev[s] else None
        out.append((s, p, r, len(pos[s]) + len(rev[s])))
    return out


def score_style(mean, reverse):
    g = (6 - mean) if reverse else mean
    if g >= 4:
        return GOOD_BG, GOOD
    if g >= 3:
        return WARN_BG, WARN
    return BAD_BG, BAD


def survey_table(survey, note_reverse=True):
    """Full item table for a survey, grouped by section, colour-coded."""
    rows = [[Paragraph("Item", CELL_W), Paragraph("Mean", CELL_W),
             Paragraph("n", CELL_W), Paragraph("N/A", CELL_W)]]
    cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("LINEBELOW", (0, 0), (-1, 0), 2, GOLD),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]
    section = None
    r = 1
    for item in survey["scale"]:
        if item["section"] != section:
            section = item["section"]
            rows.append([Paragraph(section.upper(),
                                   style("sec", fontSize=7.4, fontName="Helvetica-Bold",
                                         textColor=TEAL, leading=10, spaceAfter=0)), "", "", ""])
            cmds += [("SPAN", (0, r), (-1, r)),
                     ("BACKGROUND", (0, r), (-1, r), HexColor("#EEF3F7")),
                     ("TOPPADDING", (0, r), (-1, r), 7)]
            r += 1
        label = item["text"] + (' <font color="#92400E">(rev)</font>'
                                if item["reverse"] and note_reverse else "")
        na = item["dist"].get("NA", 0)
        bg, fg = score_style(item["mean"], item["reverse"])
        rows.append([
            Paragraph(label, CELL_S),
            Paragraph(f'{item["mean"]:.2f}',
                      style("sm", fontSize=8.6, fontName="Helvetica-Bold", textColor=fg,
                            alignment=TA_CENTER, leading=11, spaceAfter=0)),
            Paragraph(str(item["n"]), CELL_C),
            Paragraph(str(na) if na else "", CELL_C),
        ])
        cmds.append(("BACKGROUND", (1, r), (1, r), bg))
        r += 1
    t = Table(rows, colWidths=[CONTENT_W - 150, 54, 48, 48], repeatRows=1)
    t.setStyle(TableStyle(cmds))
    return t


def quotes(answers, limit=None, cols=1):
    """Boxed verbatim comments."""
    out = []
    for a in (answers[:limit] if limit else answers):
        safe = (a.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                 .replace("\n", "<br/>"))
        t = Table([[Paragraph(safe, style("qt", fontSize=8.6, leading=12,
                                          textColor=HexColor("#37444f"), spaceAfter=0))]],
                  colWidths=[CONTENT_W])
        t.setStyle(TableStyle([
            ("BOX", (0, 0), (-1, -1), 0.6, LINE),
            ("LEFTPADDING", (0, 0), (-1, -1), 11),
            ("RIGHTPADDING", (0, 0), (-1, -1), 11),
            ("TOPPADDING", (0, 0), (-1, -1), 7),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ]))
        out.append(t)
        out.append(Spacer(1, 5))
    return out


# ===================================================================== build ==
def build():
    doc = BaseDocTemplate(
        str(OUT), pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN, topMargin=52, bottomMargin=42,
        title="Haven Paediatrics - Organisational Audit Report",
        author="Consult for Africa",
    )
    content_frame = Frame(MARGIN, 42, CONTENT_W, PAGE_H - 52 - 42, id="content")
    cover_frame = Frame(MARGIN, 170, CONTENT_W, PAGE_H - 330, id="cover")
    doc.addPageTemplates([
        PageTemplate(id="cover", frames=[cover_frame], onPage=cover_bg),
        PageTemplate(id="content", frames=[content_frame], onPage=content_bg),
    ])

    el = []

    # ============================================================ COVER ======
    el.append(Spacer(1, 30))
    el.append(Paragraph("Haven Paediatrics",
                        ParagraphStyle("ct", fontName="Helvetica-Bold", fontSize=30,
                                       leading=34, textColor=white)))
    el.append(Spacer(1, 8))
    el.append(Paragraph("Organisational Audit Report",
                        ParagraphStyle("cs", fontName="Helvetica-Bold", fontSize=17,
                                       leading=22, textColor=GOLD)))
    el.append(Spacer(1, 6))
    el.append(Spacer(1, 20))
    el.append(Paragraph(
        "What we found when we looked underneath a hospital that is, on every measure "
        "your families can see, doing the hard part well.",
        ParagraphStyle("cp", fontName="Helvetica", fontSize=11.5, leading=18, textColor=LIGHT)))
    el.append(Spacer(1, 26))
    for line in [
        "Date:  August 2026",
        "For:  Kabir Aregbesola, Mrs Abisodun Alli, Dr Shakirah Saliu, Dr Odedina, "
        "Ogochukwu Odum",
        "From:  Dr Debo Odulana, Founding Partner, Consult for Africa",
        "Status:  Confidential.  Prepared for the board and executive leadership team",
    ]:
        el.append(Paragraph(line, ParagraphStyle("cm", fontName="Helvetica", fontSize=10,
                                                 leading=17, textColor=white)))
    el.append(NextPageTemplate("content"))
    el.append(PageBreak())

    # ============================================== LETTER TO THE BOARD ======
    el.append(Paragraph("A NOTE FROM THE PARTNER", EYEBROW))
    el.append(Paragraph("To the Haven board", H1))
    el.append(Paragraph(
        "Thank you for the access your team gave us. Your people were open with us in a "
        "way that made this work possible, and it is worth saying that not every "
        "organisation is.", LEDE))
    el.append(Paragraph(
        "You are doing the hard part well. Your patients rate you 4.60 out of 5 and "
        "thirteen of fifteen would definitely recommend you to another family. Your staff, "
        "answering anonymously, rate the safety of the care they give as very good or "
        "excellent in twenty-two cases out of twenty-three. Fifteen months in, that is "
        "real, and it belongs to your team.", P))
    el.append(Paragraph(
        "Our earlier read was built on interviews alone. This one keeps all of that, adds "
        "one to one sessions with nine departments and two anonymous surveys, then tests it "
        "against thirty-four of your own records. Reading them against each other is what "
        "changed my view, and the report sets out where and why.", P))
    el.append(Paragraph(
        "A word on how to read what follows. Almost nothing in it is the fault of the "
        "people doing the work. Your nurses bill at shift end because a procedure tells "
        "them to. Your technicians check paediatric doses because no pharmacist is "
        "rostered. What the report describes is a hospital that has grown faster than the "
        "systems around it. That is the normal shape of this stage, and it is the version "
        "of the problem you want, because systems are what you can change.", P))
    el.append(Paragraph(
        "Haven is better at the difficult part than most facilities twice its age, and the "
        "difficult part is the one that cannot be bought in. What is missing is machinery, "
        "and machinery is buildable. You are early enough that this is a matter of will "
        "rather than money, and I would rather be handing you this report now than in three "
        "years.", P))
    el.append(Spacer(1, 14))
    el.append(Paragraph(
        "Debo<br/><font color='#6B7280'>Dr Debo Odulana, Founding Partner, "
        "Consult for Africa</font>",
        style("sig", fontSize=10.5, leading=15, fontName="Helvetica-Bold")))

    el.append(PageBreak())

    # ================================================ EXECUTIVE DASHBOARD ====
    el.append(Paragraph("EXECUTIVE DASHBOARD", EYEBROW))
    el.append(Paragraph("Where Haven stands", H1))
    el.append(Paragraph(
        "Our opening assessment was that you had designed a stronger hospital than you "
        "could yet demonstrate you were running. We tested that four ways: we interviewed "
        "your departments, we surveyed your staff and your families anonymously, and we "
        "read thirty-four of your own operational, financial and policy documents. It "
        "holds. Your own records make it sharper, and in places more serious, than the "
        "conversations alone had suggested.", LEDE))
    el.append(Spacer(1, 6))
    el.append(stat_row([
        ("Organisational maturity", "2.5 / 5", "Developing. Opened at 3.0"),
        ("Patient experience", f"{P_POS} / 5", f"{P_N} caregiver responses"),
        ("Staff safety grade", f"{GRADE_TOP} / {S_N}", "rated Very good or Excellent"),
        ("Confidence", "High", "in the evidence behind it"),
    ]))
    el.append(Spacer(1, 12))

    el.append(card(
        "<b>The headline.</b>&nbsp; You deliver a genuinely good service and your patients "
        "say so. What sits underneath it does not yet support a hospital of this size. "
        "Processes have been written but are not followed, because almost nobody has been "
        "trained on them and nobody is measured against them. The document you treat as your "
        "revenue record is a nursing handover sheet filled in from memory at the end of a "
        "twenty-four hour shift. Four registered nurses covered the half year. No "
        "pharmacist appears on any day of the roster. And your own reporting describes the "
        "facility as unregistered through April, in months when it held registration and was "
        "admitting, transfusing and billing as a hospital. Your clinical service is better "
        "than "
        "the systems holding it up, and closing that gap is what this report is for.",
        bg=CREAM))

    el.append(Spacer(1, 12))
    el.append(Paragraph("Where the assessment moved, and why", H2))
    el.append(table([
        ["Assessment", "Opening view", "Now", "Why it moved"],
        ["Patient experience", "2.0 Not assessed", "4.5 Strong",
         f"{P_N} caregiver responses averaging {P_POS} of 5; {P_DEFINITELY} of {P_REC_N} "
         "would definitely recommend Haven"],
        ["Revenue cycle", "2.0 Requires review", "2.0 Confirmed weak",
         "The front end is automated and works. The record behind it is a manual nursing "
         "sheet; 80.9 percent of the tariff is priced at zero; a month of insured billing "
         "is missing"],
        ["Finance", "2.0 Unevidenced", "1.5 Materially weak",
         "Now evidenced. No accounting record was produced at all. Every revenue figure "
         "available is an operational log, and the operational logs do not reconcile"],
        ["Pharmacy", "3.0 Untested", "3.0 Strong process, weak governance",
         "Process discipline is real and is the internal benchmark. No pharmacist is "
         "rostered, no temperature log exists, and stock does not roll forward in any month "
         "tested"],
        ["Clinical operations", "4.0 Strong", "3.0 Delivery strong, cover thin",
         "Pathways and teamwork hold up. Four nurses through the half year, no rostered "
         "pharmacist, and eight days in July with two people covering 24 hours"],
        ["Human resources", "3.0 Structured", "2.0 Materially weak",
         "No appraisals, no objectives, no structured induction, no training calendar, and a "
         "workforce almost entirely in its first year"],
        ["Performance management", "3.0 Developing", "2.0 Absent in practice",
         "Reporting templates exist; there is no performance layer above them. Staff were "
         "asked to write their own KPIs"],
        ["Risk and compliance", "2.0 Immature", "1.5 Materially weak",
         "No incident register, no clinical audit, no risk register, and an unresolved "
         "reporting that misstated the facility's own regulatory standing for four "
         "months"],
    ], [96, 78, 88, CONTENT_W - 262], small=True))

    el.append(Spacer(1, 14))
    el.append(Paragraph("The eight findings that matter", H2))
    el.append(table([
        ["#", "Finding", "Status"],
        ["1", "Facility registration is in place and this year's renewal is pending. The "
              "monthly reports nonetheless recorded the facility as unregistered for four "
              "months without correction.", "Renewal outstanding"],
        ["2", "The clinical establishment does not match the service being run. Four "
              "nurses through the half year, no rostered pharmacist, "
              "and no cold chain record.", "Confirmed"],
        ["3", "The revenue record is a nursing handover document completed from memory at "
              "the end of shift. Four fifths of the tariff is priced at zero.",
         "Confirmed"],
        ["4", "Board reporting does not reconcile to the transaction record at monthly "
              "level, while the half-year aggregate lands within 0.14 percent.",
         "Requires resolution"],
        ["5", "Processes exist and are not followed. The cause is absent training and "
              "absent measurement, not indiscipline.", "Confirmed"],
        ["6", "There is no performance management system anywhere in the organisation, "
              "and no structured induction into the operating model.", "Confirmed"],
        ["7", "The board is not aligned on the trade-off between investing in the "
              "workforce and pressing the commercial model.", "Confirmed"],
        ["8", "Patient experience and clinical delivery are strong, and are currently "
              "produced by people rather than by systems.", "Confirmed"],
    ], [22, CONTENT_W - 22 - 92, 92], align_centre=(0, 2), small=True))

    el.append(Spacer(1, 14))
    el.append(Paragraph("The risks that matter", H2))
    el.append(table([
        ["Risk", "Rating", "Why"],
        ["Regulatory currency", "High",
         "Facility registration is confirmed and this year's renewal is pending. The health "
         "insurance scheme position is unconfirmed, and the monthly reports misstated the "
         "facility's own standing for four months"],
        ["Clinical establishment", "Critical",
         "Four registered nurses covered the half year. Eight days in July are staffed by "
         "two people across a full 24 hours, and no pharmacist is rostered on any day"],
        ["Medicines and cold chain", "Critical",
         "No pharmacist is rostered on any day, and no temperature record exists behind "
         "N5.3M of vaccination revenue"],
        ["Revenue and reporting integrity", "Critical",
         "The revenue record is a nursing handover document. Board reporting moves N8.0M "
         "between two months while the half-year total lands within 0.14 percent"],
        ["Workforce stability", "Critical",
         f"No respondent has been at Haven more than two years. {TEN_UNDER_1Y} of {TEN_N} who "
         "disclosed tenure have been here under a year"],
        ["Adherence to standards", "Critical",
         "Written procedures are not trained, audited, or measured, so compliance depends on "
         "individual memory"],
        ["Board alignment", "High",
         "Two legitimate but opposed instincts at owner level, with no agreed operating "
         "principle to reconcile them"],
        ["Physical capacity", "High",
         "Bed spaces, storage, drainage and access are already constraining service, before "
         "any growth plan is executed"],
    ], [128, 62, CONTENT_W - 190], align_centre=(1,), small=True))

    el.append(Spacer(1, 14))
    el.append(Paragraph("The six things to do first", H2))
    el.append(Paragraph(
        "The first three are safety and standing. They should not wait for the board to "
        "agree anything, and they should not wait for this engagement to conclude.", P))
    el.append(Spacer(1, 2))
    for i, b in enumerate([
        "<b>Submit the registration renewal</b> and confirm the health insurance scheme "
        "position in writing. Registration itself is confirmed; the currency is what is "
        "outstanding.",
        "<b>Roster a pharmacist on every dispensing day, and start a fridge temperature log "
        "today.</b> Neither is a capital decision, and both close an exposure that grows "
        "with every week.",
        "<b>Set a nursing floor of two registered nurses in the building at all times</b>, "
        "and commission the load calculation that establishes what the neonatal unit needs "
        "to run through a grid failure.",
        "<b>Commission an independent reconciliation</b> of the clinical record system "
        "against board reporting for January, March, April and July, exported by someone "
        "outside the operations function.",
        "<b>Hold a board alignment session</b> and write down the operating principles that "
        "settle how far Haven invests in its workforce before it presses for margin.",
        "<b>Open a clinical incident register</b> this month, with a weekly review and a "
        "corrective action log, and decide the staff benefit position.",
    ], 1):
        el.append(Paragraph(f"{i}.&nbsp;&nbsp;{b}", P))

    el.append(PageBreak())

    # ============================================================== TOC ======
    el.append(Paragraph("CONTENTS", EYEBROW))
    el.append(Paragraph("What is in this report", H1))
    el.append(Paragraph(
        "The report runs in four movements. Sections 1 to 4 set out the summary and the "
        "method. Sections 5 to 23 are the diagnosis, moving from the tested hypotheses "
        "down through the evidence to the individual findings and the detail behind "
        "them. Sections 24 to 27 are the formal assessment: maturity, controls, risk and "
        "root cause. Sections 28 to 33 are what to do about it, ending with the strategic "
        "options the board has to choose between.", P))
    el.append(Spacer(1, 6))
    _toc = [
        ("Part one", "Summary and method", ""),
        ("1", "Executive summary", "The whole argument in two pages"),
        ("2", "Background and engagement context", "Why this work was commissioned and what has changed"),
        ("3", "Scope, method and evidence base", "What Phase 2 did, and what it deliberately did not do"),
        ("4", "How to read this report", "Classification, maturity model and confidence"),
        ("Part two", "The diagnosis", ""),
        ("5", "Verdict on the opening hypotheses", "What survived contact with the evidence"),
        ("6", "The central finding", "Design is not the constraint. Adherence is"),
        ("7", "What is working, and must be protected", "The assets to defend through any change"),
        ("8", "Confirmed findings", "The interview and survey findings, with evidence and consequence"),
        ("9", "The record layer", "Why the revenue record is not a financial record"),
        ("10", "Management reporting", "Three accounts of the same months, and what they show"),
        ("11", "Regulatory standing", "Registration, renewal, and a four month reporting error"),
        ("12", "Clinical establishment and rostering", "Who is actually in the building"),
        ("13", "Medicines and cold chain", "Pharmacist cover, temperature record, controlled drugs"),
        ("14", "Laboratory and transfusion governance", "The pathway that needs rewriting"),
        ("15", "What patients say", "The caregiver survey in full"),
        ("16", "What staff say", "The safety and culture survey in full"),
        ("17", "What the departments told us", "All nine interviews, in full"),
        ("18", "Culture in depth", "The culture profile section by section"),
        ("19", "People systems in depth", "Selection, induction, development, performance, reward, retention"),
        ("20", "Governance and owner alignment", "The decision that sits above the others"),
        ("21", "Clinical governance and quality", "The gap between good care and demonstrable care"),
        ("22", "Commercial yield", "The neonatal unit, the laboratory, and the cost of idle capability"),
        ("23", "Estate and physical capacity", "Where the building has become the constraint"),
        ("Part three", "Formal assessment", ""),
        ("24", "Workstream assessment", "Maturity by workstream, opening view against now"),
        ("25", "COSO reassessment", "Design against operating effectiveness"),
        ("26", "Updated risk register", "What moved, what is new"),
        ("27", "Root cause analysis", "A small number of problems expressed many ways"),
        ("Part four", "What to do", ""),
        ("28", "Recommendations", "The design principle, then 30, 60, 90 days and beyond"),
        ("29", "Initiative register and sequencing", "Owner, effort, dependency, order"),
        ("30", "Measurement baseline", "The numbers to hold the programme to"),
        ("31", "What good looks like in six months", "Observable conditions, not intentions"),
        ("32", "Strategic options", "Five decisions the board has to make, with the trade-offs"),
        ("33", "Recommended path and decision calendar", "What we would do, and by when"),
        ("Appendices", "A to F", "Documentary findings register, survey results, evidence "
                                 "register, outstanding information, glossary"),
    ]
    rows = []
    for num, title, hint in _toc:
        rows.append([num, title, hint])
    tt = Table([[Paragraph(f'<b>{r[0]}</b>' if r[0] in ("Part one", "Part two", "Part three",
                                                        "Part four", "Appendices") else r[0],
                           CELL_S),
                 Paragraph(f'<b>{r[1]}</b>', CELL_S),
                 Paragraph(r[2], style("toch", fontSize=8.2, leading=11.5, textColor=MUTED,
                                       spaceAfter=0))] for r in rows],
                colWidths=[64, 186, CONTENT_W - 250])
    _cmds = [("VALIGN", (0, 0), (-1, -1), "TOP"),
             ("TOPPADDING", (0, 0), (-1, -1), 4),
             ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
             ("LEFTPADDING", (0, 0), (-1, -1), 8),
             ("RIGHTPADDING", (0, 0), (-1, -1), 8)]
    for i, r in enumerate(rows):
        if r[0] in ("Part one", "Part two", "Part three", "Part four", "Appendices"):
            _cmds += [("BACKGROUND", (0, i), (-1, i), NAVY),
                      ("TEXTCOLOR", (0, i), (-1, i), white),
                      ("TOPPADDING", (0, i), (-1, i), 6),
                      ("BOTTOMPADDING", (0, i), (-1, i), 6)]
    tt.setStyle(TableStyle(_cmds))
    el.append(tt)
    el.append(PageBreak())

    # =========================================================== SECTION 1 ===
    el.append(Paragraph("1.  Executive summary", H1))
    el.append(Paragraph(
        "Haven is a young specialist hospital doing the hard part well. Your families "
        "rate their experience highly and would send other families to you. Your staff "
        "rate the safety of the care they give as good. Clinical workflows are coherent, "
        "your record system ties care to billing without anyone reconciling it by hand, "
        "and your pharmacy runs to a standard that would hold up in a much larger "
        "institution.", LEDE))
    el.append(Paragraph(
        "That is the achievement and it belongs to you, and everything that follows is "
        "written on top of it. Haven is not an underperforming hospital. It is a hospital "
        "whose performance rests on the effort and goodwill of particular people rather "
        "than on systems that would survive their leaving. That distinction is the whole "
        "subject of this report, and it is the difference between a good facility and an "
        "institution.", P))
    el.append(Paragraph(
        "We tested that against your own records this time: thirty-four operational, "
        "financial and policy documents covering January to July, alongside the site visit "
        "and the two anonymous surveys. The documents are harder than the interviews were. "
        "They move the assessment down rather than up.", P))
    el.append(Paragraph("What the records show", H2))
    el.append(Paragraph(
        "Three things sit above the rest. They are not items for a workplan. They are "
        "questions only the board can close, and until they are closed the rest of the "
        "plan is difficult to sequence honestly.", P))
    el.append(Paragraph(
        "<b>First, regulatory currency and what the reporting said about it.</b> Facility "
        "registration was obtained, and management has confirmed that this year's renewal "
        "is pending. That is a currency item to close, not a question of standing. What "
        "remains is a reporting problem, and it is a serious one. The monthly operations "
        "reports state, in every month from January through April 2026, that the facility "
        "was still running as a clinic and that registration had not been obtained. Over "
        "the same period it ran twenty-four hour admissions, collected deposits under a "
        "signed policy, performed and billed transfusion, billed neonatal intensive care "
        "and claimed from nine payers as a hospital. Both statements were then removed from "
        "later reporting with no correction recorded. For four months the board was told "
        "something about its own regulatory position that was not the case, and nobody "
        "caught it. The health insurance scheme registration is recorded the same way and "
        "has not been separately confirmed to us.", P))
    el.append(Paragraph(
        "<b>Second, the establishment does not match the hospital you have become.</b> Four "
        "registered nurses covered the whole of the half year; the fifth and sixth joined "
        "in mid-July, after the period your half-year report describes as staffed by six. "
        "No pharmacist is rostered on any day in July, so paediatric weight-based dose "
        "verification is being performed by technicians. Eight days in July are covered by "
        "two people across a full twenty-four hours, and on four of those the cover is one "
        "registered nurse and a pharmacy technician who is simultaneously rostered to the "
        "pharmacy on three of them. No cold chain temperature record exists behind N5.3M "
        "of vaccination revenue. The primary generator is recorded as down for six "
        "consecutive months while the neonatal unit, oxygen and phototherapy ran on a "
        "smaller backup.", P))
    el.append(Paragraph(
        "<b>Third, your revenue record is not a financial record.</b> Your nursing "
        "procedure instructs nurses to bill opened medications from memory at the end of a "
        "shift and to fill in the revenue spreadsheets before handover. Those spreadsheets "
        "are what the hospital treats as its transaction record. So a month of HMO billing "
        "is simply absent, two monthly totals understate their own patient rows by N1.62M "
        "between them, and four fifths of the tariff those bills are priced from carries no "
        "price at all. Your board reporting then moves N8.0M between January and March "
        "while the half-year total lands within 0.14 percent of the transaction record.", P))
    el.append(Paragraph(
        "We are deliberately not drawing a conclusion from that last point, and we would "
        "ask you not to either until it has been reconciled properly by someone outside "
        "the operations function. Each item has an innocent explanation available to it. "
        "What the pattern of them together means is a question the reconciliation will "
        "answer and we cannot.", P))
    el.append(Paragraph(
        "Below those three, the risk sits almost entirely on the people side. There is no "
        "performance management anywhere in the hospital: no objectives, no appraisals, no "
        "review cycle. When staff asked how they would be measured, they were told to "
        "write their own indicators. "
        "There is no structured induction, so new employees absorb the operating model by "
        "observation. Standard operating procedures exist and are accessible, but most "
        "staff have never been trained on them, and no one audits whether they are "
        "followed. Training is not scheduled or funded, and resuscitation currency, the "
        "one clinical training item measured in the survey, is the weakest score in the "
        f"entire staff instrument at {m(STAFF, 'q32')} of 5.", P))
    el.append(Paragraph(
        "Retention sits underneath all of it. Of the staff who told us how long they had "
        f"been with you, {TEN_UNDER_1Y} of {TEN_N} had been here under a year and none had "
        "been here more than two. You cannot build adherence to a standard on a workforce "
        "that is permanently in its first year, and you cannot compound clinical judgement "
        "that keeps walking out of the door. This one determines whether any of the other "
        "fixes hold.", P))
    el.append(Paragraph(
        "Above the operating layer there is an alignment question. The owners hold two "
        "legitimate positions that currently pull against each other: one weighted towards "
        "protecting and investing in staff, the other weighted towards commercial "
        "discipline and financial return. Neither instinct is wrong. Left unreconciled, "
        "they produce inconsistent signals to management, and management passes that "
        "inconsistency down as an uneven leadership culture, which is exactly what the "
        "staff survey detects.", P))
    el.append(Paragraph(
        "There is a commercial version of the same pattern, and it is the one that costs "
        "you money every month. Your two highest-value assets are the neonatal unit and the "
        "laboratory, and neither is managed for yield. The neonatal unit is not the focus "
        "of the outreach effort, and your business development team, which is working "
        "genuinely hard, has not been given the clinical fluency that neonatal referral "
        "selling needs. The laboratory runs a "
        "sound workflow but nobody measures its capacity utilisation, its turnaround, or "
        "the reagent yield that determines what each test actually costs. Effort is being "
        "spent; yield is not being counted.", P))
    el.append(Paragraph(
        "Finally, the building itself has become a constraint, and your own people raised "
        "it before we asked. Bed spaces, storage for controlled medicines, ward drainage "
        "when it rains, inpatient facilities for families, and stair access for parents "
        "carrying infants. One staff member put it better than we could: what we have is "
        "working, but we are growing bigger. Space now sits on the critical path of any "
        "growth plan you make.", P))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>Our judgement.</b>&nbsp; You do not need more policy. You already have more "
        "policy than the hospital can execute. What you need is the machinery that makes "
        "the policy real: regulatory currency held on file, clinical cover that matches the "
        "service, "
        "records captured at the point of care, and then induction, training, objectives, "
        "measurement and a reward structure your people can understand. Built once and run "
        "consistently, those things turn the quality of care you already deliver from a "
        "personal achievement into an institutional one. Left as they are, that quality is "
        "one resignation away from slipping, and nothing in your records would show you "
        "that it had.", bg=SURFACE, bold=True))

    # =========================================================== SECTION 2 ===
    el.append(PageBreak())
    el.append(Paragraph("2.  Background and engagement context", H1))
    el.append(Paragraph(
        "You asked us to look at the whole organisation rather than the accounts. This is "
        "not a statutory audit and it does not pretend to be one. It is an assessment of "
        "how well the hospital is governed, managed and positioned to do what you want it "
        "to do, and of what has to change for it to keep doing that as it grows.", P))
    el.append(Paragraph("Why the work was commissioned", H2))
    el.append(Paragraph(
        "You raised four concerns when we started: a culture and accountability challenge, "
        "operational inefficiency in the day to day, a gap between what leadership expected "
        "and what was happening, and a worry that something in the revenue cycle was "
        "costing you money. All four were well founded. Three are confirmed with evidence. "
        "The fourth turned out to be larger than expected and Section 9 is given over to "
        "it.", P))
    el.append(Paragraph("What the strategic discussions added", H2))
    el.append(Paragraph(
        "Subsequent strategy sessions materially widened the brief. Leadership articulated "
        "an ambition to position Haven as a leading paediatric specialist hospital, "
        "recognised for clinical excellence, operational maturity, exceptional patient "
        "experience and sustainable growth. Priorities named for the next twelve months "
        "included financial sustainability, expansion of specialist clinical services, "
        "stronger referral networks, deeper community engagement, sharper brand "
        "positioning, and the management systems required to support expansion.", P))
    el.append(Paragraph(
        "That widening is why this report does not stop at diagnosis. A diagnostic that "
        "tells a board what is broken without telling it what its choices are is only half "
        "the work. Section 32 sets out the strategic options in the detail the founders "
        "need to decide between them.", P))
    el.append(Paragraph("Where the organisation sits today", H2))
    el.append(Paragraph(
        "Haven is a young specialist facility that has passed the survival test. It funds "
        "its own salaries, holds a steady patient base, has earned genuine standing with "
        "the families it serves, and operates a neonatal capability that few facilities of "
        "its size attempt. It is now at the point in an institution's life where the "
        "informal arrangements that carried it through the first phase begin to cost more "
        "than they save.", P))
    el.append(Spacer(1, 4))
    el.append(card(
        "That transition, from a founder-led organisation held together by proximity and "
        "goodwill to a systems-led organisation that can absorb new people and new volume "
        "without diluting, is the actual subject of this report. Haven is not failing at "
        "it. It has simply not yet started it deliberately, and the evidence in Section 8 "
        "shows what that is now costing.", bg=SURFACE))

    # =========================================================== SECTION 3 ===
    el.append(Paragraph("3.  Scope, method and evidence base", H1))
    el.append(Paragraph(
        "The opening review rested on founder interviews, the Head of Operations interview, a "
        "documentary review, and preliminary site observation. It deliberately stopped "
        "short of conclusions because the people doing the work had not yet been asked. "
        "Phase 2 asked them.", P))
    el.append(Paragraph("The evidence added", H2))
    el.append(table([
        ["Activity", "Detail", "Date"],
        ["Field validation interviews",
         "One to one interviews across Nursing, Front Desk, Billing, Pharmacy, Laboratory, "
         "Administration, Business Development, and Doctors, conducted on site",
         "4 August 2026"],
        ["Informal patient interviews",
         "Unstructured conversations with parents and caregivers on site during the "
         "validation visit", "4 August 2026"],
        ["Staff safety and culture survey",
         f"Anonymous instrument adapted from the AHRQ hospital survey on patient safety "
         f"culture, with Haven-specific items on emergency readiness, incentives and "
         f"ownership. {S_N} responses", f"{S_FROM} to {S_TO}"],
        ["Patient and caregiver experience survey",
         f"Anonymous instrument covering access, communication, safety, environment and "
         f"cost. {P_N} responses", f"{P_FROM} to {P_TO}"],
        ["Operational walkthroughs",
         "Patient journey from front desk through nursing assessment, consultation, "
         "laboratory, pharmacy and billing", "4 August 2026"],
        ["Documentary and financial review",
         "Thirty-four operational, financial and policy documents supplied by the "
         "operations team: seven monthly sales files, the admission record, the pharmacy "
         "report, the claims file, the tariff, the specialist fee schedule, the marketing "
         "register, six monthly board decks, the half-year report, a weekly management "
         "report, six departmental procedure documents, the staff list, the organogram and "
         "four July rosters", "August 2026"],
    ], [128, CONTENT_W - 128 - 86, 86], small=True))
    el.append(Spacer(1, 8))
    el.append(Paragraph(
        "Every figure quoted from the documentary set has been recomputed independently "
        "from the underlying patient-level rows rather than taken from a total line. Where "
        "a source states a total, both the stated and the recomputed figure are given. No "
        "estimation or extrapolation has been applied anywhere; where data is missing it is "
        "reported as missing.", SMALL))
    el.append(Spacer(1, 8))
    el.append(Paragraph(
        "Field validation was led by Sule Azeezat for Consult for Africa. Both surveys "
        "were anonymous, hosted independently of Haven systems, and open to all staff and "
        "to caregivers on site. No response was attributable to an individual, which "
        "matters for the credibility of what the free text says.", SMALL))
    el.append(Spacer(1, 6))
    el.append(Paragraph("What remains outstanding", H2))
    el.append(Paragraph(
        "Three limitations are material and are reported rather than worked around.", P))
    el.append(Paragraph(
        "<b>No accounting record was produced.</b> Every revenue figure in this report is "
        "drawn from an operational log. No general ledger, trial balance, management "
        "account or bank statement was provided, so the operational logs could not be "
        "tested against an accounting record. This is why the finance rating in Section 24 "
        "is low rather than absent: the absence is itself the evidence.", P))
    el.append(Paragraph(
        "<b>The clinical record system was not exported.</b> The board reporting carries a "
        "specialist, paediatrician and general consultation split that cannot be derived "
        "from the manual sheets, and which reconciles exactly in May and to within N5,000 "
        "in June. A second and more complete source therefore exists. Until it is exported "
        "by someone outside the operations function, every monthly revenue figure in this "
        "report is indicative rather than final.", P))
    el.append(Paragraph(
        "<b>Human resources records have not been examined.</b> The retention picture rests "
        "on the tenure profile of survey respondents, the staff list start dates and "
        "interview testimony. That triangulates well but is not the same as a turnover "
        "calculation from payroll.", P))
    el.append(Paragraph(
        "Appendix E lists the specific items requested and not provided. None of "
        "them changes the direction of the findings. Several of them would close individual "
        "findings entirely, which is the reason for listing them precisely.", P))

    el.append(PageBreak())

    # =========================================================== SECTION 4 ===
    el.append(Paragraph("4.  How to read this report", H1))
    el.append(Paragraph(
        "This is a long document and you should not have to read it end to end to use it. "
        "If you read three things, read the letter at the front, Section 8, and Section 28. "
        "Everything else is the evidence behind them and is there for when you want to "
        "check our working or hand a section to the person who has to act on it.", LEDE))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>On how it is written.</b>&nbsp; We separate what we know, what we think, and "
        "what we cannot tell you. Where the evidence settles a question we say so. Where it "
        "points one way without settling it, we say that instead of rounding it up. You "
        "will make decisions off this document and you need to know which parts bear "
        "weight.", bg=CREAM))
    el.append(Spacer(1, 8))
    el.append(Paragraph("What the classifications mean", H2))
    el.append(Paragraph(
        "Nothing here is asserted at a strength the evidence does not carry, and every "
        "observation carries its classification so you can see which is which.", P))
    el.append(table([
        ["Classification", "Definition", "How it is used here"],
        ["Confirmed", "Supported by at least two independent evidence sources",
         "Stated as fact and carried into the risk register and recommendations"],
        ["Confirmed, indicative", "Supported by multiple sources, but the underlying data "
                                  "to quantify it has not been examined",
         "Stated as fact with the validation step named. Used for the retention finding"],
        ["Preliminary", "Supported by limited evidence and awaiting validation",
         "Carried forward for Phase 3 rather than acted on"],
        ["Information gap", "Insufficient evidence to reach a conclusion",
         "Recorded as outstanding rather than inferred. Used for finance"],
    ], [96, 168, CONTENT_W - 264], small=True))
    el.append(Spacer(1, 10))
    el.append(Paragraph("Maturity model", H2))
    el.append(Paragraph(
        "Workstreams are rated on the five-level model we set out at the start, unchanged so "
        "that the two reports can be compared line for line.", P))
    el.append(table([
        ["Level", "Name", "What it means in practice"],
        ["1", "Initial", "Processes are informal or largely undocumented. Outcomes depend "
                         "on individuals"],
        ["2", "Developing", "Basic processes exist but are applied inconsistently. No "
                            "measurement"],
        ["3", "Defined", "Processes are documented and generally understood. Adherence is "
                         "not systematically monitored"],
        ["4", "Managed", "Processes are monitored, measured and consistently implemented"],
        ["5", "Optimised", "Continuous improvement is embedded and performance is "
                           "proactively managed"],
    ], [44, 78, CONTENT_W - 122], align_centre=(0,), small=True))
    el.append(Spacer(1, 8))
    el.append(Paragraph(
        "A rating of 3 is therefore not a pass mark. It means the work has been written "
        "down. Level 4 is the first level at which an organisation can prove it does what "
        "it says it does, and it is the level a hospital taking on complex neonatal care "
        "should be targeting on its clinical and governance workstreams.", P))
    el.append(Spacer(1, 6))
    el.append(Paragraph("Confidence", H2))
    el.append(Paragraph(
        "Confidence is stated separately from the rating and refers to the strength of "
        "evidence behind it, not to the quality of what was found. A workstream can be "
        "rated poorly with high confidence, which is the most actionable combination, or "
        "rated well with low confidence, which is the most dangerous one. At the opening "
        "review most workstreams carried Low confidence. Most now carry High.", P))
    el.append(Spacer(1, 6))
    el.append(Paragraph("A note on tone", H2))
    el.append(Paragraph(
        "This report is deliberately direct, and it is written for owners who asked for "
        "the truth rather than for reassurance. It is also written with the facts of the "
        "matter in view: Haven is fifteen months into building a specialist paediatric "
        "hospital, its patients rate it highly, and its staff say they would send their "
        "own families here. The findings that follow are the findings of an institution "
        "growing faster than its systems, which is a far better problem than the "
        "alternative, and a solvable one.", P))

    el.append(PageBreak())

    # =========================================================== SECTION 5 ===
    el.append(Paragraph("5.  Verdict on the opening hypotheses", H1))
    el.append(Paragraph(
        "We set out five working hypotheses at the start so that this phase could test rather "
        "than "
        "confirm them. Two are validated outright, two are validated with an important "
        "correction, and one is partly refuted. Reporting the correction matters as much "
        "as reporting the confirmation.", P))
    el.append(Spacer(1, 4))
    el.append(table([
        ["Hypothesis", "Verdict", "What the evidence showed"],
        ["H1. Mature documentation, less mature implementation and supervision",
         "Validated",
         "Procedures exist and are accessible, but most clinical staff have never been "
         "trained on them, supervision is informal, and no one audits compliance"],
        ["H2. Accountability concentrated in senior leadership, with executives drawn into "
         "routine matters", "Partly validated, corrected",
         "Departments do resolve their own operational issues and the escalation path is "
         "understood. The real gap is not executive over-involvement, it is the absence of "
         "a middle management performance layer"],
        ["H3. Management information designed but not used to drive decisions", "Validated",
         "The clinical record produces excellent transactional data. Nothing converts it "
         "into objectives, targets, or appraisal. Data exists; performance management "
         "does not"],
        ["H4. The gap between founder expectation and operational reality is execution, "
         "not strategy", "Partly validated, reframed",
         "Execution is a genuine gap, but there is also an unresolved strategic question "
         "at owner level about how far to invest in the workforce before pressing for "
         "return"],
        ["H5. The revenue cycle contains improvement opportunities driving cash pressure",
         "Partly refuted at process level",
         "Billing, eligibility checking and claims handling are stronger than assumed. The "
         "working capital question raised at the outset is unresolved and awaits the finance "
         "review"],
    ], [148, 90, CONTENT_W - 238], small=True))
    el.append(Spacer(1, 10))
    el.append(card(
        "The engagement also opened with a broader hypothesis: that Haven's constraint "
        "would prove to be its management systems rather than the capability of its "
        "people. That is now the clearest conclusion in this report. Staff capability, "
        "teamwork and goodwill measure well and patients feel the result. What is missing "
        "sits above the individual, in the systems that are supposed to direct, develop "
        "and retain them.", bg=SURFACE))

    # =========================================================== SECTION 4 ===
    el.append(Paragraph("6.  The central finding", H1))
    el.append(Paragraph("Design is not the constraint. Adherence is, and adherence has a cause.", H2))
    el.append(Paragraph(
        "The single most consistent observation across every department is that processes "
        "have been created and are not followed. It is tempting to read that as a "
        "discipline problem and to respond with enforcement. The evidence does not support "
        "that reading.", P))
    el.append(Paragraph("Four mechanisms explain the gap, and all four are fixable.", P))
    el.append(Paragraph("First, nobody was taught the procedures.", H3))
    el.append(Paragraph(
        "Procedures are distributed by email and staff are expected to absorb them. Two of "
        "the three nurses interviewed had never received any formal training on them. There "
        "is no induction module, no sign-off, and no refresher. A procedure that has only "
        "ever been emailed is a document, not a standard.", P))
    el.append(Paragraph("Second, nobody measures whether they are followed.", H3))
    el.append(Paragraph(
        "There is no compliance audit, no spot check, and no exception report. Supervision "
        "happens, and supervisors are visible, but it is informal and it is triggered by "
        "error. Staff described feedback arriving when something goes wrong and rarely "
        "otherwise. In that environment adherence is invisible until it fails, which is the "
        "most expensive moment to discover it.", P))
    el.append(Paragraph("Third, the people expected to follow them are new.", H3))
    el.append(Paragraph(
        f"Of the {TEN_N} respondents who disclosed tenure, {TEN_UNDER_1Y} had been at Haven "
        "under a year and none had been here more than two. Interviews found newly "
        "recruited nurses, a newly recruited pharmacist, and newly recruited front desk "
        "staff, and one account of a colleague resigning without a handover period. A "
        "workforce this new cannot inherit institutional habit, because there is no one to "
        "inherit it from and no induction to transmit it.", P))
    el.append(Paragraph("Fourth, several procedures cannot be followed as written.", H3))
    el.append(Paragraph(
        "This is the mechanism the interviews could not surface and the documents make "
        "obvious. The billing policy assigns every gate in the insured revenue cycle, "
        "including a mandatory daily claims audit, to an officer post that does not exist "
        "in the establishment. The billing policy requires a second staff member to witness "
        "financial discussions with parents, while the roster puts one customer service "
        "officer on duty at a time. The nursing procedure sets out a full transfusion "
        "procedure and then instructs nurses not to perform transfusions. The nursing "
        "procedure mandates an oxygen concentrator as first line, and no concentrator "
        "appears in any asset record. The transfusion procedure depends on a crossmatch "
        "release form for which the laboratory procedure contains no generating method.", P))
    el.append(Paragraph(
        "None of these is a compliance failure. They are design failures, and staff who "
        "work around them are behaving rationally. Any adherence programme that begins by "
        "auditing people against these documents will punish the wrong behaviour.", P))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>The implication for the remedy.</b>&nbsp; Writing more procedure will not close "
        "this gap, and enforcing the existing procedure will close it only while someone is "
        "watching, and in several cases would enforce something impossible. The durable fix "
        "is to rebuild the core processes with the people who have to run them, so that the "
        "way the work is designed matches the way the work actually happens and the "
        "establishment actually allows. Procedures designed around the human being "
        "executing them get followed because they fit, not because they are policed. Then "
        "train them, sign them off, and audit them, in that order.", bg=CREAM, bold=True))

    el.append(PageBreak())

    # =========================================================== SECTION 5 ===
    el.append(Paragraph("7.  What is working, and must be protected", H1))
    el.append(Paragraph(
        "An audit that only lists failures gives leadership no way to tell which of its "
        "instincts to keep. These five things are working and should be defended through "
        "any change programme.", P))

    el.append(Paragraph("7.1  Patient experience is a genuine asset", H2))
    el.append(Paragraph(
        f"Caregivers rated their experience {P_POS} of 5 across all items. "
        f"{P_TOP} of {P_N} rated the overall experience Very good or Excellent, and "
        f"{P_DEFINITELY} of {P_REC_N} said they would definitely recommend Haven to other "
        f"parents. Cleanliness and comfort scored {m(PATIENT, 'q7')}, ease of access "
        f"{m(PATIENT, 'q1')}, respect and kindness {m(PATIENT, 'q3')}, and confidence in "
        f"the medical team {m(PATIENT, 'q9')}. Informal interviews on site echoed the "
        "survey precisely: fair billing, short waits, good communication, and a stated "
        "intention to return.", P))

    el.append(Paragraph("7.2  Clinical workflow is coherent and well understood", H2))
    el.append(Paragraph(
        "Every department described the same patient journey without prompting: front desk "
        "registration, nursing assessment and vital signs, then medical consultation. "
        "Nursing covers absence internally through permanent staff rather than agency "
        f"cover. Handover quality rates {m(STAFF, 'q25')} of 5, and the risk items around "
        f"handover score low, which is the good result: things falling between the cracks "
        f"{m(STAFF, 'q26')} and shift change being a risky time {m(STAFF, 'q27')}.", P))
    el.append(Paragraph(
        "The laboratory belongs in this list for one specific practice: accuracy is "
        "validated by comparing selected results against an external reference laboratory. "
        "That is a deliberate quality control choice that many facilities of this size do "
        "not make, and it should be retained and formalised into a documented programme "
        "rather than left as a habit.", P))

    el.append(Paragraph("7.3  The pharmacy is the internal benchmark", H2))
    el.append(Paragraph(
        "Pharmacy runs monthly physical stock counts, purchases against consumption and "
        "sales trends, circulates lists of medicines approaching expiry to prescribers six "
        "to seven months ahead so stock is used rather than written off, and procures "
        "weekly, which is why shortages are rare. This is a mature operation and it is the "
        "model the rest of the hospital should be measured against. Two control points "
        "need attention and are recorded in the findings: storage capacity for controlled "
        "medicines, and the fact that the pharmacy lead approves their own procurement "
        "requests.", P))

    el.append(Paragraph("7.4  The billing front end works", H2))
    el.append(Paragraph(
        "Billing is generated automatically from the clinical record, with consultations, "
        "medicines and investigations flowing into the bill without manual assembly. "
        "Eligibility is verified before treatment, and where an item falls outside cover "
        "the provider is contacted directly. Approvals are described as running at "
        "approximately 95 percent without issue, errors are rare, and a documented "
        "overpayment was refunded within three to five working days. At the point of "
        "billing, the transaction controls are sound.", P))
    el.append(Paragraph(
        "This is worth protecting precisely because Section 9 is severe about the record "
        "layer behind it. The two findings are not in conflict. Haven has a working front "
        "end feeding a manual record that cannot support it, which means the remedy is to "
        "extend what already works rather than to build something new.", P))

    el.append(Paragraph("7.5  Teamwork and willingness to speak up", H2))
    el.append(Paragraph(
        f"Staff rate mutual respect {m(STAFF, 'q1')}, pulling together under heavy workload "
        f"{m(STAFF, 'q2')}, and mutual support {m(STAFF, 'q3')}. Talking openly about errors "
        f"so the team can learn scores {m(STAFF, 'q9')}, and speaking up about something "
        f"that might harm a patient scores {m(STAFF, 'q7')}. Free text repeatedly named "
        "teamwork as the thing that makes Haven a good place to work. This is real cultural "
        "capital and it is the asset the rest of the programme should be built on.", P))

    el.append(PageBreak())

    # =========================================================== SECTION 6 ===
    el.append(Paragraph("8.  Confirmed findings", H1))
    el.append(Paragraph(
        "Each finding below is supported by at least two independent evidence sources and "
        "is classified Confirmed under the report's evidence framework. References are "
        "given as I (interview), S (staff survey), P (patient survey), D (documentary) and "
        "O (observation).", P))
    el.append(Spacer(1, 8))

    el += finding(
        "F-01", "Written procedures are not translated into practice", "Confirmed",
        ["Standard operating procedures exist across nursing, pharmacy, laboratory, HMO "
         "handling and customer service, and staff can access them. Implementation depends "
         "on individual interpretation. Two of three nurses interviewed had never received "
         "formal training on the procedures they are expected to follow. There is no "
         "induction to them, no refresher cycle, no sign-off record, and no compliance "
         "audit.",
         "The immediate operational consequence already shows: incomplete handovers were "
         "named by nursing as a recurring source of error, even though handover practice "
         "rates well on average. Average adherence with no floor is what an untrained, "
         "unaudited standard produces."],
        "I-07 Nursing, I-14 Doctors, D-03 to D-07 procedure set, S-01 staff survey",
        "Care quality stays dependent on who is on shift, and variation grows as the "
        "workforce turns over.")

    el += finding(
        "F-02", "There is no performance management system", "Confirmed",
        ["Across every department interviewed, staff reported no key performance "
         "indicators, no agreed objectives, and no appraisal process. Nursing reported "
         "being asked by human resources to write their own indicators. Laboratory "
         "confirmed no formal appraisal had taken place.",
         "This is the most consequential organisational gap in the report. Without "
         "objectives there is nothing to hold a conversation about, nothing to develop "
         "against, nothing to reward, and no defensible basis for pay decisions. It also "
         "explains the reward findings below: staff cannot experience a reward system as "
         "fair when the performance it is supposedly based on is never measured.",
         f"Staff nonetheless report clear role clarity at {m(STAFF, 'q33')} of 5. People "
         "know what their job is. What they do not have is any statement of what good "
         "looks like, or any moment in the year when someone tells them."],
        "I-07 Nursing, I-11 Laboratory, I-12 Administration, S-01 staff survey",
        "No accountability mechanism, no development path, no basis for progression, and a "
        "reward structure that will keep reading as arbitrary.")

    el += finding(
        "F-03", "Selection, onboarding and orientation are informal", "Confirmed",
        ["New employees are not inducted into the operating model. There is no structured "
         "orientation programme, no procedure walkthrough, no competency check at entry, "
         "and no probationary review tied to defined standards. Staff learn the way the "
         "hospital works by watching colleagues, which transmits habit rather than "
         "standard, including whatever drift has crept into the habit.",
         "This compounds directly with the tenure profile. A hospital hiring steadily "
         "into an unstructured induction is manufacturing variation at the same rate as "
         "it is hiring."],
        "I-07 Nursing, I-12 Administration, S-01 tenure distribution",
        "Every new hire dilutes the standard rather than inheriting it, and the cost of "
        "each departure is higher than it needs to be.")

    el += finding(
        "F-04", "Learning and development is neither scheduled nor funded", "Confirmed",
        ["This was the single most consistent theme across departments. Nurses learn "
         "largely through experience. Doctors asked directly for more frequent clinical "
         "training and structured skills development. There is no training calendar, no "
         "competency framework, and no training budget evidenced.",
         f"The clinical exposure is measurable. Recent resuscitation training currency, "
         f"covering basic life support, paediatric advanced life support and neonatal "
         f"resuscitation, scores {m(STAFF, 'q32')} of 5, the weakest item in the staff "
         f"instrument. For a paediatric facility with neonatal intensive care beds this is "
         f"the finding to act on first. Note the contrast with equipment readiness, which "
         f"scores well: staff believe the trolley is stocked ({m(STAFF, 'q28')}) and that "
         f"they could resuscitate a child now ({m(STAFF, 'q30')}). The kit is ready. The "
         f"training currency behind the kit is not."],
        "I-07 Nursing, I-14 Doctors, S-01 item q32, free text (staff training named "
        "repeatedly in both open questions)",
        "Skills decay silently, clinical confidence outruns clinical currency, and the "
        "facility carries an avoidable clinical and regulatory exposure.")

    el += finding(
        "F-05", "Workforce stability is the quiet emergency", "Confirmed, indicative",
        [f"Of the {TEN_N} survey respondents who disclosed tenure, {TEN_UNDER_1Y} had been "
         f"at Haven under a year and {TEN_OVER_2Y} had been here more than two years. "
         "Interviews independently found newly recruited nurses, a newly recruited "
         "pharmacist and newly recruited front desk staff, and one account of a colleague "
         "resigning abruptly without completing a handover, leaving the team short.",
         "The reasons for leaving were not established in this phase and should not be "
         "assumed. What the evidence does establish is a concentration of recent hires "
         "consistent with elevated turnover, in a hospital with no exit interview process "
         "and no retention data. This is classified as indicative and is the first item "
         "for validation against human resources records.",
         "Turnover is also the multiplier on every other finding in this section. It is "
         "what makes the absence of induction expensive, the absence of training "
         "expensive, and the absence of documented process dangerous."],
        "I-07 Nursing, I-09 Pharmacy, I-10 Front Desk, S-01 tenure distribution",
        "Institutional knowledge never accumulates, recruitment cost recurs, and clinical "
        "standards reset with each intake.")

    el += finding(
        "F-06", "Reward and benefits are the loudest source of dissatisfaction, and the "
                "issue is transparency as much as quantum", "Confirmed",
        [f"Fairness and clarity of pay, commission and reward is the weakest positively "
         f"worded item in the staff survey at {m(STAFF, 'q34')} of 5. Whether reward "
         f"encourages careful work rather than speed scores {m(STAFF, 'q35')}. In "
         "interviews, administrative staff described a salary adjustment round in which "
         "some colleagues received increases of roughly 75 percent and others "
         "subsequently received about 25 percent, with tax reducing the perceived gain "
         "further. The process was widely read as inequitable and remains an active "
         "grievance.",
         "The free text separates the two problems cleanly. The most repeated single "
         "request across the survey is health insurance and a pension, described as a "
         "sense that staff welfare is not taken into consideration. Alongside it sits a "
         "request for fair and timely salary review, recognition, and simply not being "
         "spoken to impolitely.",
         "The distinction matters commercially. A material part of this finding can be "
         "resolved by explaining the structure and publishing the basis of the decision, "
         "which costs very little. The benefit question is a real cost decision and "
         "belongs to the board, but even there, naming a position and a timeline would "
         "remove most of the corrosive uncertainty."],
        "I-12 Administration, S-01 items q34 and q35, staff free text (both open questions)",
        "Continued attrition of exactly the staff Haven can least afford to lose, and a "
        "reward structure that cannot be used as a management lever because it is not "
        "trusted.")

    el += finding(
        "F-07", "Culture is strong on teamwork and uneven on voice, recognition and "
                "leadership experience", "Confirmed",
        [f"Teamwork measures well. Voice does not. Feeling free to question the decisions "
         f"of those with more authority scores {m(STAFF, 'q6')} of 5, and it is the "
         f"weakest item in the communication section. The just-culture items are the "
         f"weakest of the reverse-worded set: the sense that a reported event leads to the "
         f"person being blamed rather than the problem being fixed scores "
         f"{m(STAFF, 'q12')}, and mistakes being held against staff scores "
         f"{m(STAFF, 'q11')}. Being treated fairly after an error scores "
         f"{m(STAFF, 'q13')}, notably below the teamwork scores around it.",
         "Interviews found the same split. Some staff described management as accessible "
         "and supportive; others said Haven does not genuinely operate an open door and "
         "that they would not speak openly. Both accounts are true, which is the point: "
         "the experience of leadership differs by department and by manager rather than "
         "being set by a common standard.",
         "Recognition is the practical expression of it. Supervision is present but "
         "corrective. Feedback arrives when something goes wrong and rarely when something "
         "goes right, and staff named that directly. Note that this is a leadership "
         "practice gap, not a leadership intent gap: management commitment to patient "
         f"safety scores {m(STAFF, 'q23')} and supervisors taking safety suggestions "
         f"seriously scores {m(STAFF, 'q20')}."],
        "I-07 Nursing, I-12 Administration, S-01 items q6, q11, q12, q13, staff free text",
        "Reporting narrows over time, problems surface later and more expensively, and "
        "good people leave managers rather than organisations.")

    el += finding(
        "F-08", "Clinical incidents are escalated but not documented", "Confirmed",
        ["Doctors confirmed that incidents are reported and dealt with promptly, and "
         "nursing gave a specific account of a medication error raised openly with the "
         "head nurse and resolved appropriately. The willingness to report is a genuine "
         "strength and should be said clearly.",
         "There is, however, no formal documentation process for recording clinical "
         "incidents. Nothing is captured, coded, trended, or reviewed. There is no "
         "incident register, no root cause record, and no corrective action log.",
         "Three consequences follow. Clinically, the same latent problem can recur "
         "indefinitely because nobody can see it recurring. Organisationally, the "
         "learning stays with whoever was on shift. And in governance terms, a facility "
         "that cannot produce an incident record cannot demonstrate to a regulator, an "
         "insurer or an accreditation body that it manages clinical risk, regardless of "
         "how well it actually manages it."],
        "I-14 Doctors, I-07 Nursing, D-08 reporting templates (no incident instrument "
        "evidenced)",
        "Recurrent problems remain invisible, and the hospital has no defensible record "
        "of how clinical risk is handled.")

    el += finding(
        "F-09", "Physical space has become a binding constraint", "Confirmed",
        ["Space surfaced unprompted in both the interviews and the survey free text, from "
         "staff who were otherwise positive about the facility. The specific constraints "
         "named were bed spaces for inpatient care, storage capacity for controlled "
         "medicines, the general ward flooding when it rains, the absence of basic "
         "inpatient utilities such as a microwave and freezer, and stair access which "
         "caregivers repeatedly raise as a difficulty.",
         "One respondent put the strategic version of it plainly: what Haven has is "
         "working, but Haven is growing bigger. That is the right frame. This is not a "
         "complaint about a poor facility, it is a growing service meeting the edges of "
         "its envelope.",
         "The commercial reading is that space now sits on the critical path. Neonatal "
         "intensive care expansion, additional specialist clinics, and higher inpatient "
         "volumes all consume the same constrained footprint. Two of the constraints, "
         "controlled medicines storage and ward drainage, are compliance and safety "
         "matters rather than comfort matters and should be treated as such."],
        "I-09 Pharmacy, S-01 free text, P-01 caregiver free text, O-01 site observation",
        "Growth plans stall against the building, and two of the constraints carry "
        "regulatory rather than merely operational risk.")

    el += finding(
        "F-10", "Owner alignment on the strategic trade-off is unresolved", "Confirmed",
        ["The founding group holds two legitimate and currently opposed instincts. One "
         "pole weights protection of and investment in staff, and is cautious about "
         "commercial pressure on a young team. The other weights financial discipline and "
         "return, and is cautious about cost commitments a young facility has not yet "
         "earned. Both are defensible positions held by people who want the same outcome.",
         "The difficulty is that the trade-off between them has never been settled and "
         "written down. Management therefore receives inconsistent signals about which "
         "consideration wins when the two conflict, which is most weeks. That "
         "inconsistency is passed downward and reappears at the front line as the uneven "
         "leadership experience described in F-07, and as the reward opacity in F-06.",
         "This finding sits above all the others in sequence. Several recommendations in "
         "this report, most obviously the benefits decision and the investment in "
         "training and induction, cannot be settled by management because they are "
         "precisely the trade-off the owners have not yet resolved. A middle ground has "
         "to be created deliberately, against the new strategic outlook, and stated as a "
         "small set of operating principles that management can apply without going back "
         "to the board each time."],
        "I-01 and I-02 founder interviews, D-11 founder alignment meeting, D-10 strategy "
        "and marketing workshop",
        "Management continues to optimise for whichever owner it spoke to last, and the "
        "transformation programme inherits the ambiguity.")

    el += finding(
        "F-11", "Laboratory performance, capacity and reagent yield are not measured",
        "Confirmed",
        ["The laboratory runs a sound workflow. Samples are received, prioritised by "
         "urgency and turnaround time, processed, and uploaded to the clinical record for "
         "electronic access by clinicians. Accuracy is checked by comparing selected "
         "results against an external reference laboratory, which is good practice and "
         "should be retained. Reagent levels are monitored weekly and expired reagents are "
         "discarded.",
         "What is absent is any performance or economic measurement of the function. There "
         "is no audit of capacity utilisation, no measure of tests per analyser against "
         "capability, no turnaround time reporting against a standard, and critically no "
         "measure of reagent yield: how many reportable results each reagent pack actually "
         "produces against how many it should, and therefore what each test costs to run.",
         "This matters commercially as well as clinically. Reagent efficiency is where "
         "laboratory margin is won or lost. Wastage from calibration runs, repeat testing, "
         "open-vial expiry and low batch utilisation is invisible unless it is measured, "
         "and none of it currently is. Where analysers are under-loaded, reagent cost per "
         "reportable result rises sharply, which means an under-promoted laboratory is "
         "also a more expensive one per test.",
         "Maintenance compounds it. Calibration is regular, which is correct, but servicing "
         "is reactive: equipment is serviced when it develops a fault, at which point "
         "samples are referred out. Referral out is both a cost and a turnaround penalty, "
         "and neither is currently quantified."],
        "I-11 Laboratory, field validation; D-05 laboratory procedure; no audit or "
        "utilisation reporting evidenced",
        "Laboratory margin leaks silently, capacity decisions are made without data, and "
        "unplanned downtime keeps converting internal revenue into external referral cost.")

    el += finding(
        "F-12", "The neonatal unit, the highest-value asset in the building, is not being "
                "promoted as it should be", "Confirmed",
        ["Business development is genuinely active. The team pursues schools, faith "
         "organisations, maternity centres and referral partnerships through proposals, "
         "follow-up, calls and physical visits, and identifies networking and direct "
         "outreach as the most effective channels. Effort is not the problem.",
         "Direction and specificity are. Neonatal intensive care is the highest-yield "
         "service Haven operates and the one with the highest barrier to entry for "
         "competitors, yet it is not the centre of the outreach effort. Marketing "
         "effectiveness is currently judged by general patient footfall and by occupancy "
         "after the fact, rather than by demand deliberately generated into the unit that "
         "matters most.",
         "The underlying cause is capability rather than commitment. The team is working "
         "hard but carries core healthcare domain gaps. Neonatal referral is a clinical "
         "sale: it is won with paediatricians, obstetricians, maternity centres and "
         "general practitioners who need to understand cot capability, admission criteria, "
         "escalation pathways, transfer arrangements and clinical outcomes before they "
         "will send a sick newborn. That conversation cannot be held on general marketing "
         "fluency, and the team has not been equipped with the clinical content, the "
         "referral proposition, or the tooling to run it.",
         "The commercial consequence is direct. Neonatal cots that sit unfilled are the "
         "most expensive idle capacity in the facility, and they are idle for want of a "
         "referral pipeline rather than for want of demand in the catchment."],
        "I-13 Business development, field validation; D-10 strategy and marketing workshop; "
        "no referral tracking or conversion data evidenced",
        "The single highest-margin service stays under-utilised, and growth continues to "
        "be measured by activity rather than by yield.")

    # =========================================================== SECTION 9 ===
    el.append(PageBreak())
    el.append(Paragraph("9.  The record layer", H1))
    el.append(Paragraph(
        "This answers the fourth concern you raised at the start. Because the conclusion "
        "matters, this section separates three things: what your documents say, what we "
        "observed in the files, and what we infer from the two together.", LEDE))
    el.append(Spacer(1, 4))
    el.append(table([
        ["", "Basis", "Confidence"],
        ["What your procedure says", "The nursing procedure instructs nurses to bill "
                                     "opened medications at the end of a shift and to fill "
                                     "in the revenue spreadsheets before handover, with "
                                     "the obligation passing to the incoming shift. "
                                     "Verbatim from the document you supplied",
         "Certain"],
        ["What the files show", "Counts, sums and reconciliations performed directly on "
                                "the files supplied, recomputed from patient-level rows "
                                "rather than read off total lines",
         "Certain as to the files"],
        ["What we infer", "That the spreadsheets are a manual layer beside the clinical "
                          "record system rather than the financial record itself, and that "
                          "the system underneath holds more than the sheets do",
         "Strong, not proven"],
    ], [116, CONTENT_W - 116 - 96, 96], small=True))
    el.append(Spacer(1, 8))
    el.append(Paragraph(
        "The inference is testable in an afternoon. The board reporting carries a "
        "specialist, paediatrician and general consultation split that cannot be derived "
        "from the single consultation column in the sheets, and which reconciles exactly in "
        "May and to within N5,000 in June. Something else holds that detail. Export it and "
        "this section either closes or sharpens.", P))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>The spreadsheets Haven treats as its revenue record are nursing handover "
        "documents.</b>&nbsp; They are completed retrospectively, from recall, at the end "
        "of a twenty-four hour shift, by whichever nurse is on duty. Every data quality "
        "finding below traces to that single design decision, and none of them is a "
        "discipline failure by the people filling them in.",
        bg=BAD_BG, rule=BAD, bold=True))

    el.append(Paragraph("9.1  What the record does not capture", H2))
    el.append(table([
        ["What is missing", "Amount", "How it is known"],
        ["June 2026 HMO revenue is absent from the sales record. The June file contains no "
         "HMO sheet",
         "N7,510,645 claimed", "The claims were submitted and largely paid, so the billing "
                               "happened. What is missing is the sales record of it. "
                               "Corroborated by N2,097,155 of June HMO pharmacy dispensing "
                               "with no matching entry"],
        ["April private pharmacy revenue. The pharmacy column total was never written into "
         "the month total row",
         "N1,394,020", "Patient rows sum to N9,545,480 against a total row of N8,151,460, "
                       "understating the month by 14.6 percent"],
        ["May HMO revenue across three columns",
         "N225,893", "Pharmacy, full blood count and malaria parasite columns all "
                     "understated in the total row"],
        ["The service revenue on the largest single episode of the period. A N7,000,000 "
         "neonatal admission appears in the sales record as a N3,000,000 deposit only",
         "N4,000,000", "The balance appears once in a weekly management report as "
                       "'sales from NICU' and is excluded from that report's own period "
                       "total"],
    ], [176, 82, CONTENT_W - 258], small=True))
    el.append(Spacer(1, 8))
    el.append(Paragraph(
        "The mechanism behind the second and third items is the same and it is mechanical: "
        "the total rows are hardcoded values rather than live formulas, so any row entered "
        "after the total was struck is silently excluded. Nobody has to make a mistake for "
        "the number to be wrong.", P))

    el.append(Paragraph("9.2  Why the pricing master cannot correct it", H2))
    el.append(Paragraph(
        "The tariff file is the document billing, pharmacy and the payer function are all "
        "meant to price from. It carries 2,413 line items. 1,952 of them, being 80.9 "
        "percent, are priced at zero.", P))
    el.append(table([
        ["Category", "Items", "Priced at zero", "Zero rate"],
        ["Drugs", "2,030", "1,741", "85.8 percent"],
        ["Laboratory investigation", "227", "184", "81.1 percent"],
        ["Consultation", "52", "13", "25.0 percent"],
        ["Procedures", "28", "7", "25.0 percent"],
        ["All other categories", "76", "7", "9.2 percent"],
        ["Total", "2,413", "1,952", "80.9 percent"],
    ], [CONTENT_W - 240, 70, 84, 86], align_centre=(1, 2, 3), small=True, total_row=True))
    el.append(Spacer(1, 8))
    el.append(Paragraph(
        "There are two readings of that and they need different answers. Either this file "
        "is not the list your team actually prices from, in which case we have not been "
        "given the operative one and should be. Or it is, in which case every drug and "
        "laboratory test dispensed against a zero-priced line is being priced by an "
        "individual at the point of billing.", P))
    el.append(Paragraph(
        "Two observations point towards the second reading without settling it. "
        "Consultation is defined six different ways within the same file, at prices ranging "
        "from N35,000 to zero. And the sales record shows consultation actually billed at "
        "twelve different values between N15,000 and N160,000. Whichever reading is right, "
        "there is currently no document against which a given charge can be tested as "
        "correct, and that is the finding.", P))

    el.append(Paragraph("9.3  What it costs at the payer end", H2))
    el.append(table([
        ["Measure", "Position", "Comment"],
        ["Claimed since May 2025", "N61,225,122", "Fifteen months of submissions"],
        ["Collection shortfall", "N6,967,751", "11.4 percent of everything ever claimed"],
        ["Outstanding at the reporting date", "N6,472,006",
         "Of which N399,253 sits beyond sixty days"],
        ["Rejection reasons captured", "None",
         "No rejection reason field exists anywhere in the claims record, so no root cause "
         "analysis is possible"],
        ["Payer concentration", "72.1 percent",
         "Two payers account for 72.1 percent of insured revenue and 71.3 percent of "
         "insured encounters. Loss of either removes roughly a quarter of total revenue"],
        ["Non-payer entries in the receivables schedule", "N399,253",
         "Two lines in the ageing schedule are not payers at all. One is a patient name, "
         "the other last appears as a claim in November 2025 and was never paid"],
    ], [148, 84, CONTENT_W - 232], small=True))
    el.append(Spacer(1, 8))
    el.append(Paragraph(
        "The cause of the payer-side losses is established elsewhere in the evidence and is "
        "structural rather than behavioural. The signed billing policy assigns every gate "
        "in the insured revenue cycle, including a mandatory daily claims audit, to an "
        "officer post. That post does not exist in the establishment. A month of insured "
        "billing went missing because the control it should have been caught by is assigned "
        "to nobody.", P))

    el.append(Paragraph("9.4  Stock does not reconcile either", H2))
    el.append(Paragraph(
        "Pharmacy inventory was roll-forward tested for every month for which a stock "
        "report exists. Expected closing equals opening plus purchases less cost of goods "
        "sold less loss. None of the four months tested reconciles.", P))
    el.append(table([
        ["Month", "Expected closing", "Stated closing", "Variance"],
        ["March", "N2,637,649", "N2,599,085", "N38,564"],
        ["April", "N3,371,367", "N3,185,344", "N186,023"],
        ["May", "N2,911,043", "N2,321,797", "N589,246"],
        ["June", "N2,215,573", "N2,467,134", "(N251,561)"],
        ["Net across the period", "", "", "N562,272"],
    ], [CONTENT_W - 300, 100, 100, 100], align_centre=(1, 2, 3), small=True,
        total_row=True))
    el.append(Spacer(1, 8))
    el.append(Paragraph(
        "The May variance alone is 25.4 percent of that month's stated closing stock. In "
        "every month the stated closing balance is identical to the stated physical count, "
        "which means the count is being written into the ledger rather than reconciled "
        "against it. A stock count that always agrees with the book is not a control. "
        "January has no stock report at all, and February opening stock is recorded as "
        "zero with a note confirming no January count was performed, so the entire record "
        "runs from an unverified base.", P))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>The fix is not a better spreadsheet, and it is more encouraging than it "
        "sounds.</b>&nbsp; Your clinical record system already assembles bills from "
        "consultations, medicines and investigations without manual work. The task is to "
        "let it be the record, capture revenue at the point of service, and retire the "
        "parallel manual layer. That is an extension of something that already works "
        "rather than a build from nothing. Until the system is exported independently, "
        "treat monthly revenue figures as indicative, including the ones in this report.",
        bg=CREAM, bold=True))

    # ========================================================== SECTION 10 ===
    el.append(PageBreak())
    el.append(Paragraph("10.  Management reporting", H1))
    el.append(Paragraph(
        "You have three independent records of the same months: the transaction sheets, "
        "the claims file you submitted to payers, and the board decks with the half-year "
        "report. They do not agree with each other, and the pattern of disagreement is not "
        "random.", LEDE))
    el.append(Spacer(1, 6))
    el.append(Paragraph("10.1  Private revenue, board reporting against the record", H2))
    el.append(table([
        ["Month", "Reported to board", "Transaction record", "Variance"],
        ["January", "N12,698,284", "N4,696,654", "+N8,001,630"],
        ["February", "N10,053,020", "N10,758,330", "(N705,310)"],
        ["March", "N8,543,518", "N16,410,449", "(N7,866,931)"],
        ["April", "N10,618,480", "N9,545,480", "+N1,073,000"],
        ["May", "N11,607,344", "N12,014,094", "(N406,750)"],
        ["June", "N14,638,870", "N14,638,870", "Nil"],
        ["Half-year total", "N68,159,516", "N68,063,877", "+N95,639"],
    ], [CONTENT_W - 330, 110, 110, 110], align_centre=(1, 2, 3), small=True,
        total_row=True))
    el.append(Spacer(1, 8))
    el.append(Paragraph(
        "The half-year total is accurate to within 0.14 percent. Every individual month "
        "before June is wrong. January is overstated by N8.00M, March is understated by "
        "N7.87M, and those two figures are the same money. June reconciles to the naira, "
        "which establishes that the reporting method is capable of producing an exact "
        "figure when the month is prepared correctly.", P))
    el.append(Paragraph(
        "The specific item is identifiable. The January board deck reports a line of "
        "N6,395,450 for neonatal accommodation and professional consultations. The January "
        "transaction record contains no neonatal revenue, no deposit revenue, and total "
        "private revenue across every line of N4,696,654, which is less than the single "
        "line the board was shown. The event it describes occurred in March.", P))

    el.append(Paragraph("10.2  The same pattern, repeated", H2))
    el.append(table([
        ["What was reported", "What the record shows"],
        ["N3,000,000 of neonatal revenue in April",
         "No such entry exists in April. A N3,000,000 deposit exists dated 7 July, for the "
         "episode that is separately N4,000,000 short"],
        ["Insured revenue exceeding the claims actually submitted by N386,887",
         "February and May variances each trace to a single payer to the naira: N26,378 and "
         "N287,970. These are not timing or rounding differences"],
        ["January insured revenue by payer",
         "Two payers, together N268,081, are absent from the board's view of the month"],
        ["Laboratory revenue of N1,893,170 in March and the identical figure in April",
         "Matches neither month. Carried through two board cycles and into the half-year "
         "report uncorrected"],
        ["A half-year revenue matrix",
         "Does not sum to its own stated totals in March or April. April insured revenue "
         "appears at four different values across the same document set"],
        ["Encounter totals in the most recent weekly report",
         "Three different totals for the same week: 61 in the header, 51 by payer split, "
         "75 by visit type"],
        ["Rejected claims stated as nil in the same weekly report",
         "The claims file records rejections in April and in May"],
        ["The largest outstanding payer named as one holding N833,077",
         "The actual largest outstanding payer, at N2,718,998, is absent from the schedule "
         "entirely"],
    ], [188, CONTENT_W - 188], small=True))

    el.append(Paragraph("10.3  How this should be handled", H2))
    el.append(Paragraph(
        "Each item above has a plausible individual explanation. A young facility, one "
        "person carrying operations and reporting together, spreadsheets rather than "
        "systems, and no independent review of anything. That explanation is likely to be "
        "the right one for most of it.", P))
    el.append(Paragraph(
        "What it does not comfortably explain is the shape. A neonatal revenue line "
        "reported in a month with no neonatal activity, offset almost exactly by an "
        "understatement in the month the event actually occurred, with the aggregate "
        "landing within 0.14 percent of correct, is a pattern rather than an error. So is "
        "a payer figure reported above the amount submitted to that payer, to the naira, "
        "twice.", P))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>The recommendation is procedural, not accusatory.</b>&nbsp; The board should "
        "commission an independent reconciliation of the clinical record system against "
        "the board reporting for January, March, April and July, exported by someone "
        "outside the operations function. That single exercise resolves the question in "
        "either direction. Until it is complete, the position is that the reporting cannot "
        "be relied upon, not that anyone has been shown to have acted improperly. It is "
        "also relevant that the most recent management report contains, in its decisions "
        "section, the preparer's request for their own salary review.",
        bg=CREAM, bold=True))

    # ========================================================== SECTION 11 ===
    el.append(PageBreak())
    el.append(Paragraph("11.  Regulatory standing", H1))
    el.append(Paragraph(
        "Management has confirmed that facility registration was obtained and that this "
        "year's renewal is pending. That settles the substantive question. What it does "
        "not settle is why the monthly reporting said otherwise for four months, and that "
        "is the finding this section carries.", LEDE))
    el.append(Spacer(1, 6))
    el.append(Paragraph("11.1  Where the position now stands", H2))
    el.append(table([
        ["Item", "Status", "Action"],
        ["State health facility registration", "Obtained, confirmed by management",
         "Closed. Retain the certificate on the governance file"],
        ["Current year renewal", "Pending",
         "Submit and evidence. This is a currency item and should not be allowed to run "
         "into another quarter"],
        ["Health insurance scheme registration", "Not separately confirmed to us",
         "Confirm in writing. The monthly reports record it in the same terms as the "
         "facility registration, which we now know was inaccurate, so the reports are not "
         "a reliable guide either way"],
    ], [150, 150, CONTENT_W - 300], small=True))

    el.append(Spacer(1, 12))
    el.append(Paragraph("11.2  What the reporting said, and why that matters", H2))
    el.append(Paragraph(
        "The reporting error is worth setting out in full, because it is the clearest "
        "single illustration of the management reporting finding in Section 10. This is not "
        "a compliance failure. It is a control failure in what the board is told.", P))
    el.append(table([
        ["What the monthly reporting recorded", "What was actually the case"],
        ["Still running as a clinic, stated in every monthly report January to April 2026",
         "The facility held registration and was operating twenty-four hour inpatient "
         "admissions, dated in the half-year report to August 2025"],
        ["Facility registration not yet obtained, same period",
         "Registration had been obtained"],
        ["Health insurance scheme registration not yet obtained",
         "Unconfirmed. Given the above, the reporting cannot be relied on"],
        ["Both statements removed from May onward with no correction recorded",
         "A correction, if the position had changed, would normally be minuted. None was"],
        ["The business development report asserts completed registration and licensing",
         "Correct as to registration, and directly contradicted by the operations reporting "
         "running alongside it"],
    ], [CONTENT_W / 2, CONTENT_W / 2], small=True))
    el.append(Spacer(1, 10))
    el.append(card(
        "<b>Two departments of the same organisation reported opposite positions on the "
        "same fact, in the same months, to the same board.</b>&nbsp; One was right. Nobody "
        "reconciled them. That is the pattern this report keeps finding, and it is why "
        "Section 10 recommends an independent reconciliation rather than a better "
        "template.", bg=WARN_BG, rule=WARN, bold=True))
    el.append(Spacer(1, 10))
    el.append(Paragraph("11.3  The neonatal service timeline", H2))
    el.append(Paragraph(
        "A second question sits alongside it and should be answered in the same exercise. "
        "The most recent weekly management report, dated 13 July 2026, "
        "records under clinical events: the facility had its first neonatal admission.", P))
    el.append(Paragraph("The same reporting line had previously recorded:", P))
    el += bullets([
        "N6,395,450 of neonatal revenue in January 2026.",
        "A N1,750,000 neonatal claim submitted to and paid by an insurer in March 2026.",
        "N3,000,000 of neonatal revenue in April 2026.",
        "Neonatal services established in November 2025, and eight preterm babies "
        "successfully managed and discharged, in the half-year report.",
    ])
    el.append(Paragraph(
        "Both cannot be true. The item to test first is the March claim, because unlike the "
        "internal reporting it was submitted to a third party and paid. The board should "
        "obtain the neonatal admission register from November 2025, with gestational ages, "
        "ventilator hours, lengths of stay and outcomes, and the clinical file supporting "
        "the March claim. If the register supports the activity, the weekly report was "
        "loosely worded and the matter closes.", P))

    # ========================================================== SECTION 12 ===
    el.append(PageBreak())
    el.append(Paragraph("12.  Clinical establishment and rostering", H1))
    el.append(Paragraph(
        "Your staff list, your four July rosters and your weekly management report "
        "reconcile to each other exactly. That makes this the most reliable evidence in the "
        "set. It describes a hospital being run on an outpatient clinic's establishment.",
        LEDE))
    el.append(Spacer(1, 6))
    el.append(Paragraph("12.1  The establishment as it actually stands", H2))
    el.append(table([
        ["Function", "Established", "What the evidence shows"],
        ["Chief medical director", "1", "Full time"],
        ["Medical officers", "3",
         "Covering all 31 days of July on a strict three-day rotation with no rest day, no "
         "leave cover and no relief officer named"],
        ["Registered nurses", "4 through the half year",
         "The fifth and sixth joined on 14 and 15 July, after the period closed. The "
         "half-year report describes six nurses covering January to June"],
        ["Consultant and paediatrician rota", "In place",
         "A consultant rota operates. It was not among the documents supplied for review, "
         "so consultant cover could not be tested against the medical officer rota or "
         "against the escalation points named in the billing policy"],
        ["Pharmacist", "1, part time",
         "Does not appear on the July pharmacy roster on any day. Two technicians cover "
         "every day"],
        ["Laboratory scientists", "2",
         "One scientist covers 72 consecutive hours in three-day blocks. Before 16 April "
         "2026 the laboratory had one scientist in total"],
        ["Insured revenue officer", "0",
         "The role is named throughout the billing policy and the organogram and exists in "
         "neither the payroll nor the roster"],
        ["Matron, head of clinicals, head of laboratory, billing officer, facility officer",
         "0", "Named in the organogram, absent from the establishment"],
    ], [124, 88, CONTENT_W - 212], small=True))

    el.append(Paragraph("12.2  What the July nursing roster shows", H2))
    el.append(table([
        ["Observation", "Detail"],
        ["Eight days covered by two people across a full 24 hours",
         "4, 5, 11, 12, 18, 19, 25 and 26 July, with no senior nurse present. This covers "
         "the ward, the emergency room, the neonatal unit and outpatient triage"],
        ["Four of those days covered by one registered nurse and a pharmacy technician",
         "4, 11, 12 and 19 July. On three of the four the technician is simultaneously "
         "rostered to the pharmacy"],
        ["A pharmacy technician rostered as a nurse for 15 days including night cover",
         "Seven days double-booked across both departments. She is not a nurse on the "
         "payroll"],
        ["Twenty-four hour shifts",
         "The nursing procedure confirms a single handover at 8am, and instructs the "
         "overnight nurse to sleep in the emergency room until 6am"],
        ["A reported absconding that the rosters do not reflect",
         "The same individual is reported to management on 13 July as having absconded, "
         "while remaining rostered in both departments to 29 and 31 July. The July rosters "
         "are therefore not a reliable record of who was present"],
        ["A stated ratio that never moves",
         "Every monthly report states a one to two patient to nurse ratio, unchanged across "
         "six months in which monthly encounters rose from 174 to 311 and inpatients from 4 "
         "to 16. The half-year report describes it as exceptional and world class"],
    ], [176, CONTENT_W - 176], small=True))
    el.append(Spacer(1, 8))
    el.append(card(
        "A ratio that does not move when the numerator triples is not a measurement. On the "
        "facility's own figures, four to six nurses covering a twenty-four hour inpatient "
        "unit, a neonatal unit and an outpatient clinic gives roughly one and a half nurses "
        "per shift before leave or sickness. A single ventilated neonatal cot requires one "
        "to one nursing on its own.", bg=BAD_BG, rule=BAD))

    el.append(Paragraph("12.3  Power and the clinical estate", H2))
    el.append(Paragraph(
        "Two facility findings sit directly on the clinical risk. The 30KVA generator is "
        "recorded as down in every monthly report from January through June 2026 and as "
        "operational in the July consolidated report, with no repair, replacement or cost "
        "recorded anywhere. Over that period the facility ran neonatal intensive care, "
        "oxygen therapy and phototherapy on a 9KVA backup. Separately, the nursing "
        "procedure mandates an oxygen concentrator as first line, which is mains dependent, "
        "and no concentrator appears in any asset record. The only oxygen assets recorded "
        "are two cylinders.", P))
    el.append(Paragraph(
        "A solar installation is disclosed for the first time in the July weekly report, "
        "having appeared in no monthly report and not in the half-year report written in "
        "the same month. Whatever the reporting position, the practical question for the "
        "board is a load calculation: what the neonatal unit needs to run safely through a "
        "grid failure, and whether the current arrangement provides it.", P))

    # ========================================================== SECTION 13 ===
    el.append(PageBreak())
    el.append(Paragraph("13.  Medicines and cold chain", H1))
    el.append(Paragraph(
        "Your pharmacy is the best-run department in the building. On process discipline "
        "that judgement stands. The documents add three governance gaps the interviews "
        "could not have surfaced. Two of them can be closed this week at no cost.", LEDE))
    el.append(Spacer(1, 6))
    el.append(table([
        ["Finding", "What the evidence shows", "Severity"],
        ["No pharmacist is rostered on any day",
         "The only registered pharmacist on the staff list is part time and appears on no "
         "day of the July roster. Two technicians perform prescription verification, "
         "paediatric weight-based dose checking and dispensing. In a facility where every "
         "dose is calculated by milligram per kilogram, this is the highest clinical risk "
         "finding in the documentary set, and it is also a scope of practice matter",
         "Critical"],
        ["No cold chain temperature record exists",
         "The pharmacy procedure requires storage temperature to be monitored and logged. "
         "No log was provided for any period. N5,313,232 of vaccination revenue was "
         "recorded across the seven months. Cold chain integrity for every vaccine "
         "administered in the period is unevidenced, which is both a safety matter and a "
         "reason an insurer could retrospectively reject every immunisation claim",
         "Critical"],
        ["No controlled drugs evidence",
         "The pharmacy procedure sets out a narcotics process requiring authorised "
         "requisition, a register under lock and key and patient acknowledgement of "
         "receipt. None of it was provided. The field validation separately established "
         "that controlled medicines storage capacity is already insufficient",
         "High"],
        ["Two measurement bases in the same department",
         "Monthly reports state gross margin between 51 and 64 percent. The most recent "
         "weekly report states percentage profit of 144.9, which is markup on cost, not "
         "margin, against a policy threshold expressed as a 25 percent gross margin. A "
         "control tested on the wrong basis has never actually been applied",
         "High"],
        ["An unexplained gap between two consecutive reports",
         "Closing stock at 30 June of N2,467,134 against opening stock at 6 July of "
         "N2,144,481, with no record covering the intervening days. N322,653 unexplained",
         "High"],
    ], [124, CONTENT_W - 124 - 54, 54], align_centre=(2,), small=True))
    el.append(Spacer(1, 10))
    el.append(card(
        "<b>Two of these can be closed this week and should be.</b>&nbsp; A fridge "
        "temperature log started today costs nothing and stops the exposure growing. A "
        "pharmacist physically present whenever the pharmacy dispenses is a rostering and "
        "contracting decision, not a capital one. Neither should wait for the audit to "
        "conclude.", bg=CREAM, bold=True))

    # ========================================================== SECTION 14 ===
    el.append(PageBreak())
    el.append(Paragraph("14.  Laboratory and transfusion governance", H1))
    el.append(Paragraph(
        "Your laboratory procedure is the best drafted clinical document you gave us, and "
        "the transfusion section is careful and correctly ordered on donor unit inspection. "
        "That should be on the record before the gaps. The gaps are structural, not a "
        "reflection on the scientist who wrote it alone while covering seventy-two hour "
        "shifts.", LEDE))
    el.append(Spacer(1, 6))
    el.append(Paragraph("14.1  The transfusion pathway", H2))
    el.append(table([
        ["Element", "Position"],
        ["Crossmatch method",
         "Absent. The procedure is titled to include crossmatch, defines it, and requires a "
         "crossmatch release form on every unit issued. No crossmatch method appears "
         "anywhere in the document, and neither does antibody screening. Transfusions are "
         "being performed and billed"],
        ["Nursing instruction",
         "The nursing procedure sets out a full transfusion procedure, then concludes that "
         "nurses should not administer blood transfusions. A procedure that instructs and "
         "then prohibits is unusable in an incident review, and the document does not name "
         "who does administer. That needs stating in writing, and tested against the "
         "consultant rota"],
        ["Consent",
         "The nursing procedure directs staff to obtain informed consent from the doctor or "
         "laboratory scientist. Consent for transfusion of a child must come from the "
         "parent or guardian. The laboratory procedure gets this right, which means two "
         "documents in the same facility disagree on who consents"],
        ["Finance gate",
         "The transfusion procedure requires billing approval before any transfusion "
         "related action, including contacting the blood bank. An emergency release clause "
         "exists four pages later with no cross-reference at the point of the finance gate. "
         "As written, the sequence a scientist follows places payment before the blood bank "
         "is contacted"],
    ], [92, CONTENT_W - 92], small=True))
    el.append(Spacer(1, 8))
    el.append(card(
        "This is a paediatric facility. The transfusion pathway needs rewriting as one "
        "document, with the compatibility method stated, consent assigned to the parent, "
        "administration responsibility named, and the emergency pathway stated at the point "
        "of the finance gate rather than four pages after it.", bg=BAD_BG, rule=BAD))

    el.append(Paragraph("14.2  Analytical governance", H2))
    el.append(table([
        ["Missing", "Why it matters here"],
        ["Critical value reporting procedure",
         "No panic value list, no escalation pathway, no timeframe for communicating a "
         "critical result to a clinician. In a facility running neonatal intensive care "
         "this is the most consequential omission in the document"],
        ["Paediatric reference ranges",
         "No age-banded intervals. Neonatal and infant haematology values differ "
         "substantially from adult values, so a paediatric laboratory reporting without "
         "age-specific ranges will produce clinically misleading reports"],
        ["Quality control and external assessment",
         "No acceptance criteria, no action on a failed run, no proficiency testing, no "
         "calibration schedule. Accuracy is validated informally against an external "
         "reference laboratory, which is good practice run as a habit rather than as a "
         "documented programme"],
        ["Coverage",
         "Five procedures against 227 laboratory investigations in the tariff. Two further "
         "procedures are referenced by the document and do not exist"],
        ["Document control",
         "Prepared and reviewed by the same individual, with no medical director approval. "
         "The document invokes an international standard that requires exactly the "
         "independence it lacks"],
        ["Sample storage conditions",
         "Urine specified at 20 degrees for one day, which permits bacterial overgrowth and "
         "is not achievable as written in Lagos ambient conditions. Whole blood specified "
         "across a sixteen degree range, which is not a specification"],
    ], [128, CONTENT_W - 128], small=True))

    el.append(Paragraph("14.3  A control gap that costs money as well as safety", H2))
    el.append(Paragraph(
        "The billing policy requires the laboratory to upload all investigation results to "
        "the payer portal. The laboratory procedure requires upload to the clinical record "
        "system only and contains no portal step at all. Missing investigation results are "
        "among the commonest causes of claim rejection in this market, and Haven carries a "
        "N6.97M cumulative shortfall with no rejection reason data to work from. Two "
        "procedures from the same organisation disagree on whose job it is. That is worth "
        "testing directly against the rejection data once it is obtained.", P))
    el.append(Spacer(1, 6))
    el.append(card(
        "<b>A note on document control across the whole set.</b>&nbsp; Of the six "
        "procedure documents reviewed, only the two nursing documents carry approval by the "
        "chief medical director, and both are past their review date. The pharmacy "
        "procedure, which governs controlled drugs and paediatric dose verification, has no "
        "named approver. The customer service procedure has no version, no date and no "
        "approver, and it contains the only statement anywhere in the evidence of the "
        "fourteen day validity period attached to the consultation fee. Patient "
        "identifiable data is routed through a consumer messaging application by design in "
        "four separate procedures, which is a data protection exposure and means the "
        "referral record cannot be reconstructed when someone leaves.", bg=SURFACE))

    # =========================================================== SECTION 7 ===
    el.append(PageBreak())
    el.append(Paragraph("15.  What patients say", H1))
    el.append(Paragraph(
        f"{P_N} parents and caregivers completed the anonymous experience survey between "
        f"{P_FROM} and {P_TO}. The result is the strongest evidence in this report and it "
        "moves patient experience from the weakest-evidenced workstream at the outset to one "
        "of the best.", LEDE))
    el.append(Spacer(1, 4))
    el.append(stat_row([
        ("Responses", str(P_N), "parents and caregivers"),
        ("Average score", f"{P_POS} / 5", "across all ten items"),
        ("Rated very good or better", f"{P_TOP} / {P_N}", "overall experience"),
        ("Would definitely recommend", f"{P_DEFINITELY} / {P_REC_N}", "to other parents"),
    ]))
    el.append(Spacer(1, 12))
    el.append(Paragraph("Where Haven is strongest", H2))
    el.append(Paragraph(
        f"Ease of booking and being seen ({m(PATIENT, 'q1')}) and cleanliness and comfort "
        f"({m(PATIENT, 'q7')}) are the joint highest scores in the instrument. Respect and "
        f"kindness ({m(PATIENT, 'q3')}) and confidence in the medical team "
        f"({m(PATIENT, 'q9')}) follow immediately behind, and feeling safe and well cared "
        f"for scores {m(PATIENT, 'q8')}. Caregivers feel listened to and able to ask "
        f"questions ({m(PATIENT, 'q5')}) and understand the explanation of their child's "
        f"care ({m(PATIENT, 'q4')}). These are the fundamentals of paediatric experience "
        "and Haven is meeting them.", P))
    el.append(Paragraph("Where the score falls off", H2))
    el.append(Paragraph(
        f"Three items sit below the rest and they form a pattern. Clarity of charges and "
        f"payments is the weakest item at {m(PATIENT, 'q10')}. Knowing what is happening "
        f"with the child's care on an ongoing basis scores {m(PATIENT, 'q6')}, below the "
        f"score for the explanation given at the point of consultation. Waiting time scores "
        f"{m(PATIENT, 'q2')}, the weakest of the access items.", P))
    el.append(Paragraph(
        "In other words, Haven communicates well at the moment of the encounter and less "
        "well in the gaps between encounters, and it communicates about cost less clearly "
        "than about care. The verbatim comments make the cost point concretely: one "
        "caregiver described being surprised by the cost of medicines billed to their "
        "health plan and identified an information gap between what is administered, what "
        "is charged, and what the family is told. This aligns with the inpatient "
        "communication weakness raised independently by staff, and it is a cheap problem "
        "to fix.", P))
    el.append(Spacer(1, 6))
    el.append(Paragraph("In their own words", H2))
    el += quotes(next(o for o in PATIENT["openText"] if o["key"] == "open_better")["answers"])
    el.append(Spacer(1, 2))
    el.append(Paragraph(
        "Two service asks recur and are worth noting commercially rather than only as "
        "feedback. Remote consultation is requested by families who travel long distances, "
        "and it appears in the staff free text as well. It relieves physical capacity, "
        "which is a constrained resource under F-09. Access to results electronically is "
        "the second, and the clinical record system already holds the data.", P))

    el.append(PageBreak())

    # =========================================================== SECTION 8 ===
    el.append(Paragraph("16.  What staff say", H1))
    el.append(Paragraph(
        f"{S_N} staff completed the anonymous safety and culture survey between {S_FROM} "
        f"and {S_TO}. The instrument is adapted from the AHRQ hospital survey on patient "
        "safety culture, with additional Haven-specific items on emergency readiness, "
        "incentives and ownership. Negatively worded items are marked and a lower score "
        "is the good result on those.", LEDE))
    el.append(Spacer(1, 4))
    el.append(stat_row([
        ("Responses", str(S_N), "anonymous, all departments"),
        ("Positive items average", f"{S_POS} / 5", "excludes reverse-worded items"),
        ("Safety graded very good or better", f"{GRADE_TOP} / {S_N}", "no poor or failing grade"),
        ("Would recommend for care", f"{m(STAFF, 'rec_care')} / 5", "as a place to receive care"),
    ]))
    el.append(Spacer(1, 12))
    el.append(Paragraph("The headline is a vote of confidence in the care", H2))
    el.append(Paragraph(
        f"Every respondent graded patient safety at Acceptable or better, with "
        f"{GRADE_TOP} of {S_N} at Very good or Excellent. Staff would recommend Haven as a "
        f"place to receive care at {m(STAFF, 'rec_care')} of 5, higher than they would "
        f"recommend it as a place to work at {m(STAFF, 'rec_work')}. That gap of "
        f"{float(m(STAFF, 'rec_care')) - float(m(STAFF, 'rec_work')):.2f} points is the "
        "whole report in one number: the people delivering the care believe in the care "
        "more than they believe in the employment.", P))
    el.append(Paragraph("The five weakest signals", H2))
    el.append(table([
        ["Item", "Score", "Reading"],
        ["Recent resuscitation training currency", m(STAFF, "q32"),
         "Weakest item in the instrument, and a clinical risk in a paediatric and neonatal "
         "setting"],
        ["Pay, commission and reward are fair and clear", m(STAFF, "q34"),
         "Weakest positively worded culture item; transparency is as much the issue as "
         "amount"],
        ["Reported events feel like blame rather than fixing the problem (rev)",
         m(STAFF, "q12"), "Weakest of the reverse set; the just-culture edge to watch"],
        ["Free to question those with more authority", m(STAFF, "q6"),
         "Voice is the soft spot in an otherwise strong communication section"],
        ["Reward encourages careful work, not just speed", m(STAFF, "q35"),
         "Incentives are not currently pulling towards quality"],
    ], [CONTENT_W - 200, 52, 148], align_centre=(1,), small=True))
    el.append(Spacer(1, 10))
    el.append(Paragraph("The five strongest signals", H2))
    el.append(table([
        ["Item", "Score", "Reading"],
        ["If a child needed resuscitation now, we would have what we need",
         m(STAFF, "q30"), "Equipment readiness is trusted, in contrast to training currency"],
        ["Staff treat each other with respect", m(STAFF, "q1"),
         "Teamwork is the cultural asset to build on"],
        ["I understand what I am responsible for and what good performance looks like",
         m(STAFF, "q33"), "Role clarity is high even without formal objectives"],
        ["The crash trolley is fully stocked and ready", m(STAFF, "q28"),
         "The emergency readiness standard has landed"],
        ["Management's actions show patient safety is a priority", m(STAFF, "q23"),
         "Leadership intent is credible; leadership practice is uneven"],
    ], [CONTENT_W - 200, 52, 148], align_centre=(1,), small=True))
    el.append(Spacer(1, 12))
    el.append(Paragraph("What the free text asks for", H2))
    el.append(Paragraph(
        "The open questions produced two dominant clusters and one secondary one, and they "
        "are consistent with the interviews. On patient safety, staff ask for more "
        "manpower and for the equipment, training and consumables to do the job properly. "
        "On the workplace, staff ask for welfare and structure: health insurance, pension, "
        "fair and timely pay review, recognition, clinical training, and simply being "
        "treated courteously. The secondary cluster is the facility itself: bed spaces, "
        "inpatient communication, drainage, lift access, and remote care for families who "
        "cannot travel.", P))
    el.append(Spacer(1, 4))
    el.append(Paragraph("Selected verbatim comments", H2))
    _safe = next(o for o in STAFF["openText"] if o["key"] == "open_safe")["answers"]
    _work = next(o for o in STAFF["openText"] if o["key"] == "open_work")["answers"]
    el.append(Paragraph("ON MAKING HAVEN SAFER FOR PATIENTS",
                        style("st1", fontSize=7.5, fontName="Helvetica-Bold",
                              textColor=TEAL, leading=11, spaceAfter=4)))
    el += quotes([a for a in _safe if a.strip().lower() != "nil"][:6])
    el.append(Spacer(1, 4))
    el.append(Paragraph("ON MAKING HAVEN A BETTER PLACE TO WORK",
                        style("st2", fontSize=7.5, fontName="Helvetica-Bold",
                              textColor=TEAL, leading=11, spaceAfter=4)))
    el += quotes([a for a in _work if a.strip().lower() != "nil"][:6])
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>Read the tone, not only the scores.</b>&nbsp; Almost every critical comment is "
        "prefaced with genuine warmth about the place. Staff are not disaffected. They are "
        "asking to be invested in by an employer they like. That is a far easier position "
        "to act from than a hostile one, and it will not stay open indefinitely.",
        bg=CREAM))

    el.append(PageBreak())

    # ========================================================== SECTION 11 ===
    # ========================================================== SECTION 17 ===
    el.append(Paragraph("17.  What the departments told us", H1))
    el.append(Paragraph(
        "Nine departments were interviewed one to one on site, without managers present. "
        "This section records what each said, in full, because the departmental picture "
        "carries detail the thematic findings compress out of it. Where a department's "
        "account is later contradicted by the documentary evidence, that is noted at the "
        "relevant finding and not hidden here.", LEDE))
    el.append(Spacer(1, 4))
    el.append(card(
        "Read this section for two things. First, how consistently the patient journey is "
        "described across departments that were interviewed separately, which is a real "
        "strength. Second, how often a department names the same three gaps without "
        "prompting: no training on the procedures, no measure of performance, and no "
        "recognition unless something goes wrong.", bg=SURFACE))
    el.append(Spacer(1, 10))

    _depts = [
        ("Nursing",
         ["Rotating shift pattern of a 24 hour shift, 48 hours off, a 36 hour shift, then "
          "48 hours off. The patient journey is clearly understood: front desk, nursing "
          "assessment and vital signs, then medical consultation.",
          "Absence is covered internally by permanent nursing staff, coordinated by the "
          "head nurse. Locum use is rare, and one nurse reported never having worked "
          "alongside one."],
         ["Stable internal shift cover with minimal dependence on temporary staff",
          "Willingness to report error openly, evidenced by a medication error raised "
          "directly with the head nurse and resolved appropriately",
          "Clear shared understanding of the patient pathway"],
         ["Two of three nurses had never received formal training on the procedures",
          "Supervision is informal and feedback is corrective rather than developmental",
          "Incomplete handovers named as a recurring source of error",
          "No key performance indicators, targets or appraisal. Staff were asked to write "
          "their own indicators",
          "Psychological safety is inconsistent between individuals"]),
        ("Front desk",
         ["Patients are categorised as covered or self-paying, entered into the clinical "
          "record system before referral to nursing, and consultation fees are "
          "communicated upfront.",
          "Complaints are said to be documented and reviewed weekly with the operations "
          "lead."],
         ["Clear understanding of patient flow and no administrative bottleneck observed "
          "at reception",
          "Fees communicated before service, which supports the fair billing perception in "
          "the caregiver survey"],
         ["Delays occur waiting for doctors and waiting for medication, neither of which "
          "originates at reception",
          "No formal complaints register evidenced, so complaint volume, resolution time "
          "and themes cannot be reported"]),
        ("Billing and cash office",
         ["After-service billing. The clinical record system generates the bill "
          "automatically from consultations, medicines administered and investigations "
          "ordered, which removes manual assembly.",
          "Eligibility is verified before treatment, and items outside cover are taken up "
          "directly with the provider."],
         ["Largely automated, with effective integration between clinical care and finance",
          "Approvals reported at approximately 95 percent without issue",
          "Few billing errors. A documented overpayment was refunded within three to five "
          "working days"],
         ["Delays, where they occur, come from pending approvals or medicine availability "
          "rather than from billing itself",
          "Receivables ageing, denial management and collection performance were not "
          "available for review and remain the open question"]),
        ("Pharmacy",
         ["Monthly physical stock counts. Purchasing is driven by consumption and sales "
          "trends. Weekly procurement cycles keep shortages rare.",
          "Medicines approaching expiry are listed and circulated to prescribers six to "
          "seven months ahead so stock is used rather than written off. Expired stock is "
          "removed and disposed of."],
         ["The most mature operational department in the facility and the internal "
          "benchmark for the others",
          "Proactive expiry management that protects both margin and safety",
          "Controlled drugs are stored separately"],
         ["Storage capacity for controlled medicines is insufficient and will become a "
          "compliance exposure as volume grows",
          "The pharmacy lead approves their own procurement requests, which is a "
          "segregation of duties gap rather than a conduct concern"]),
        ("Laboratory",
         ["Samples are received, prioritised by urgency and turnaround requirement, "
          "processed, and uploaded to the clinical record for electronic access by "
          "clinicians.",
          "Accuracy is validated by comparing selected results against an external "
          "reference laboratory. Reagent levels are monitored weekly and expired reagents "
          "discarded."],
         ["Structured workflow with results available to clinicians electronically",
          "External reference comparison is genuine good practice for a facility of this "
          "size",
          "Regular calibration"],
         ["No audit of performance, capacity utilisation or reagent yield. Cost per "
          "reportable result is unknown",
          "Servicing is reactive rather than planned. When equipment faults, samples are "
          "referred out at unquantified cost and turnaround penalty",
          "No formal appraisal for laboratory staff"]),
        ("Administration",
         ["Most organisational communication runs through informal messaging. Management "
          "meetings are weekly; general staff meetings are rare, estimated at two in the "
          "year.",
          "Escalation runs from department lead to the operations lead, to the managing "
          "director, to the founders, and the path is understood across departments."],
         ["The escalation structure is understood and used, which is a genuine governance "
          "strength for an organisation of this age"],
         ["Salary adjustment is the most significant staff concern. Increases of roughly "
          "75 percent for some and about 25 percent later for others, with tax reducing "
          "the perceived gain, were widely read as inequitable",
          "General staff communication is infrequent, so organisational messages arrive "
          "through informal channels",
          "Multiple respondents said Haven does not consistently operate an open door "
          "culture"]),
        ("Business development",
         ["Activity focuses on schools, faith organisations, maternity centres and "
          "referral partnerships, pursued through proposals, follow-up, calls and physical "
          "visits.",
          "Networking and direct outreach are identified as the most effective channels. "
          "Effectiveness is measured through patient footfall and occupancy, including the "
          "neonatal unit."],
         ["Genuine outreach effort across multiple credible channels",
          "The team identified its own need for better prospecting and sales tooling, "
          "which is an accurate self-assessment"],
         ["The neonatal unit, the highest-yield asset, is not the focus of the effort",
          "Core healthcare domain gaps limit the team's ability to hold a clinical "
          "referral conversation with paediatricians, obstetricians and maternity centres",
          "No referral source tracking or conversion measurement, so effort cannot be "
          "judged by result"]),
        ("Medical staff",
         ["Clinical operations are described as organised and patient-centred. "
          "Communication with nursing runs through intercom, messaging and face to face "
          "contact, and breakdowns are reported as uncommon.",
          "Clinical procedures are available."],
         ["Coherent clinical operation with effective interprofessional communication",
          "Incidents are reported and escalated promptly"],
         ["No formal documentation process for recording clinical incidents, which is the "
          "most significant governance gap identified",
          "Doctors asked directly for more frequent clinical training and structured "
          "skills development",
          "Requests for increased clinical investigation where appropriate, which "
          "intersects with the laboratory utilisation finding"]),
        ("Patients and caregivers",
         ["Informal interviews on site during the validation visit, corroborated by the "
          "anonymous experience survey."],
         ["Positive overall experience, fair billing, minimal waiting, and good "
          "communication",
          "High stated likelihood of returning and of recommending Haven to others"],
         ["Requests for remote consultation for families who travel long distances",
          "Requests for electronic access to results",
          "Clarity on the cost of medicines billed to health plans",
          "A request for additional doctors on site"]),
    ]
    for name, context, strengths, gaps in _depts:
        block = [Paragraph(name, style("dh", fontSize=11, fontName="Helvetica-Bold",
                                       textColor=NAVY, leading=14, spaceAfter=4))]
        for c in context:
            block.append(Paragraph(c, P))
        block.append(Paragraph("What is working", style("dsh", fontSize=7.4,
                                                        fontName="Helvetica-Bold",
                                                        textColor=GOOD, leading=11,
                                                        spaceAfter=3)))
        block += bullets(strengths, st=style("db", fontSize=9, leading=12.5, spaceAfter=2))
        block.append(Spacer(1, 4))
        block.append(Paragraph("What is missing", style("dgh", fontSize=7.4,
                                                        fontName="Helvetica-Bold",
                                                        textColor=BAD, leading=11,
                                                        spaceAfter=3)))
        block += bullets(gaps, st=style("dg", fontSize=9, leading=12.5, spaceAfter=2))
        block.append(Spacer(1, 12))
        el.append(KeepTogether(block))

    # ========================================================== APPENDIX E ===
    el.append(PageBreak())
    el.append(Paragraph("APPENDIX F", EYEBROW))
    el.append(Paragraph("Outstanding information requests", H1))
    el.append(Paragraph(
        "The following were requested or are required and were not available during Phase "
        "2. They are listed so that the gap in this report is explicit and so that Phase 3 "
        "can be scoped precisely. Several would close a documentary finding outright.", P))
    el.append(Spacer(1, 8))
    el.append(Paragraph("Would close a finding on production", H2))
    el.append(table([
        ["Item", "Closes", "Priority"],
        ["Registration certificate and evidence of the current year renewal submission",
         "D-01", "Critical"],
        ["Health insurance scheme registration status and correspondence", "D-02",
         "Critical"],
        ["Clinical record system revenue export for January, March, April and July 2026, "
         "produced by someone outside the operations function",
         "D-18, D-29, D-30, D-31", "Critical"],
        ["Neonatal admission register from November 2025: gestational ages, ventilator "
         "hours, length of stay and outcomes", "D-37", "Critical"],
        ["The March neonatal claim file: clinical notes, approval correspondence and the "
         "admission record", "D-37", "Critical"],
        ["Pharmacy and vaccine fridge temperature logs, or the date monitoring began",
         "D-08", "Critical"],
        ["Premises and superintendent pharmacist licences, and the contracted hours and "
         "attendance record of the pharmacist", "D-07", "Critical"],
        ["Nursing council registration numbers for all nurses, and confirmation of who "
         "administers transfusions", "D-04, D-16", "Critical"],
        ["Generator fault report, repair or replacement record, and the neonatal load "
         "calculation", "D-09", "Critical"],
        ["Backup schedule and last successful restore test for the clinical record system",
         "D-11", "Critical"],
        ["June 2026 insured billing sheet, or written confirmation it was never prepared",
         "D-19", "Critical"],
        ["Explanation of the N4,000,000 difference on the largest neonatal episode",
         "D-20", "Critical"],
        ["The actual price list the billing and pharmacy teams work from day to day",
         "D-21", "Critical"],
        ["Confirmation whether any referral rebate has been paid, to whom, and bank "
         "records if so", "D-03", "Critical"],
        ["Board or management minute recording the decision on the proposed staff referral "
         "commission structure", "D-03, D-39", "Critical"],
        ["Rejection reason data from the payer portals for every rejected claim since May "
         "2025", "D-26", "High"],
        ["Contract, job description and attendance record for the individual rostered "
         "across two departments, and clarification of the reported departure",
         "D-05", "High"],
        ["Laboratory quality control records, external quality assessment participation "
         "and analyser calibration logs", "D-14", "High"],
        ["Biohazard waste disposal and spillage procedures, both referenced and neither "
         "supplied", "D-14", "High"],
        ["Controlled drugs register, requisition file and authority documentation",
         "D-46", "High"],
        ["January 2026 pharmacy stock report and the opening position at 1 January",
         "D-23", "High"],
        ["The 1 to 5 July pharmacy record bridging the N322,653 gap", "D-24", "High"],
        ["Weekly management reports for every other week in the period. Only one was "
         "provided", "D-36", "High"],
        ["Written confirmation of which document governs insured billing, with effective "
         "dates", "D-41", "High"],
        ["Incident register, complaints log and claim vetting log for the period",
         "D-45", "High"],
        ["Oxygen concentrator purchase record and location, or confirmation none exists",
         "D-12", "High"],
        ["Nursing roster for the full period, and the basis of the stated ratio", "D-04",
         "High"],
        ["Consultant and paediatrician call rota, which operates but was not supplied",
         "D-06", "High"],
        ["Deposit collection and refund ledger for all inpatient episodes, and management "
         "authorisations for admissions below the deposit floor", "D-42", "High"],
        ["Partnership register, pipeline file and analytics export supporting the "
         "half-year presentation", "D-38", "Medium"],
        ["Security and housekeeping contracts, since neither appears on the payroll list",
         "D-04", "Medium"],
    ], [CONTENT_W - 128 - 66, 128, 66], align_centre=(2,), small=True))

    el.append(Spacer(1, 14))
    el.append(Paragraph("Required to complete the assessment", H2))
    el.append(table([
        ["Item", "Needed for", "Priority"],
        ["General ledger or trial balance for the period", "Nothing in the evidence set is "
                                                           "an accounting record. Every "
                                                           "revenue figure is an "
                                                           "operational log", "Critical"],
        ["Bank statements for the period", "To test the private receipts recorded across "
                                           "three payment channels", "Critical"],
        ["Payroll and consultant payment records", "To verify the specialist fee "
                                                   "arrangements and calculate turnover",
         "Critical"],
        ["Management accounts, last twelve months", "Financial governance assessment, "
                                                    "service line contribution", "Critical"],
        ["Accounts receivable ageing by payer", "The working capital question carried "
                                                "forward from the outset", "Critical"],
        ["Claims submitted, paid, rejected and outstanding, by payer",
         "Denial management and revenue assurance", "Critical"],
        ["Payroll and personnel records, including start and leave dates",
         "Turnover rate, average tenure and cost per departure", "Critical"],
        ["Cash collection and banking reports", "Cash cycle and collection discipline",
         "High"],
        ["Budget against actual, if prepared", "Whether financial planning exists at all",
         "High"],
        ["Procurement and supplier records", "Segregation of duties, pricing and vendor "
                                             "concentration", "High"],
        ["Pharmacy stock valuation and movement", "Working capital tied up in stock, and "
                                                  "attach rate potential", "High"],
        ["Laboratory reagent purchase and consumption records",
         "Reagent yield and cost per reportable result at F-11", "High"],
        ["Analyser specifications and throughput capability",
         "Capacity utilisation and the external diagnostics option", "Medium"],
        ["Neonatal admissions, occupancy and source, last twelve months",
         "The yield case at F-12 and the membership design", "Critical"],
        ["Board and committee minutes, if held", "Governance assessment at Section 20",
         "High"],
        ["Any existing incident records, however informal", "Baseline for the incident "
                                                            "register", "High"],
        ["Training records and certification status by clinician",
         "Resuscitation currency register", "Critical"],
        ["Employment contracts and any benefit arrangements",
         "The benefits decision at Section 32.3", "High"],
        ["Floor plan and measured areas", "Estate review and capacity modelling", "High"],
        ["Tariff and price list, all service lines", "Membership and bundle pricing",
         "High"],
    ], [190, CONTENT_W - 190 - 66, 66], align_centre=(2,), small=True))

    for name, context, strengths, gaps in _depts:
        block = [Paragraph(name, style("dh", fontSize=12, fontName="Helvetica-Bold",
                                       textColor=NAVY, leading=15, spaceAfter=5))]
        for c in context:
            block.append(Paragraph(c, P))
        block.append(Paragraph("What is working", style("dsh", fontSize=7.6,
                                                        fontName="Helvetica-Bold",
                                                        textColor=GOOD, leading=11,
                                                        spaceAfter=3)))
        block += bullets(strengths, st=style("db", fontSize=9.2, leading=13, spaceAfter=2))
        block.append(Spacer(1, 5))
        block.append(Paragraph("What is missing", style("dgh", fontSize=7.6,
                                                        fontName="Helvetica-Bold",
                                                        textColor=BAD, leading=11,
                                                        spaceAfter=3)))
        block += bullets(gaps, st=style("dg", fontSize=9.2, leading=13, spaceAfter=2))
        block.append(Spacer(1, 14))
        el.append(KeepTogether(block))

    el.append(Spacer(1, 4))
    el.append(Paragraph("17.1  What every department said", H2))
    el.append(Paragraph(
        "Five themes appear in departments that were interviewed separately and could not "
        "have coordinated their answers. That consistency is what moves them from opinion "
        "to finding.", P))
    el.append(table([
        ["Theme", "Where it came up", "What it means"],
        ["No training on the written procedures",
         "Nursing, doctors, laboratory, front desk",
         "Procedures are distributed by email and absorbed by observation. Two of three "
         "nurses had never had formal training on them"],
        ["No performance measure of any kind",
         "Nursing, laboratory, administration, and confirmed by every other department",
         "No objectives, no appraisal, no review cycle. Staff were told to write their own "
         "indicators"],
        ["Feedback only when something goes wrong",
         "Nursing, administration",
         "Supervision is visible and well intentioned, and almost entirely corrective. "
         "Recognition is close to absent"],
        ["Welfare and reward",
         "Administration most strongly, and every department in the survey free text",
         "The salary adjustment round is read as inequitable, and health cover and pension "
         "are the most repeated single request"],
        ["A workforce that is mostly new",
         "Nursing, pharmacy, front desk",
         "Newly recruited staff across three departments, and one account of a colleague "
         "resigning without a handover period"],
    ], [130, 148, CONTENT_W - 278], small=True))

    el.append(Spacer(1, 12))
    el.append(Paragraph("17.2  Where the interviews and the records disagree", H2))
    el.append(Paragraph(
        "Three departmental accounts are contradicted by the documentary evidence. None of "
        "this suggests anyone misled us. In each case the department described what it "
        "believed to be true.", P))
    el.append(table([
        ["What we were told", "What the records show"],
        ["Complaints are documented and reviewed weekly",
         "No complaints register was produced. Complaint volume, resolution time and themes "
         "cannot be reported"],
        ["Approvals run at roughly 95 percent without issue",
         "True at the point of authorisation. Collection is a different matter: 11.4 "
         "percent of everything claimed since May 2025 has not been collected, and no "
         "rejection reason is recorded anywhere"],
        ["Pharmacy stock is counted monthly and the count is reliable",
         "The count is performed. In every month tested the stated closing balance is "
         "identical to the count, which means it is being written into the ledger instead "
         "of reconciled against it"],
    ], [200, CONTENT_W - 200], small=True))
    el.append(Spacer(1, 8))
    el.append(card(
        "That gap between what a department believes about its own controls and what the "
        "records show is itself the finding. It is what happens when nobody outside the "
        "department ever checks.", bg=CREAM, bold=True))

    el.append(PageBreak())

    el.append(Paragraph("18.  Culture in depth", H1))
    el.append(Paragraph(
        "Culture is the workstream most often asserted and least often measured. Because "
        "the staff instrument is sectioned, Haven's culture can be read as a profile "
        "rather than as a single number, and the profile is more useful than the average.",
        LEDE))
    el.append(Spacer(1, 6))
    el.append(Paragraph("18.1  The culture profile", H2))
    _prof_rows = [["Dimension", "Positive items", "Reverse items", "Reading"]]
    _readings = {
        "Your area & teamwork": "The strongest dimension. Teamwork is Haven's cultural "
                                "asset and the platform for everything else",
        "Communication & openness": "Strong on speaking up about patient care, weak on "
                                    "questioning authority. Voice is conditional",
        "Response to mistakes": "The softest dimension. Fair treatment after error is "
                                "below the surrounding scores and the blame items are the "
                                "weakest of the reverse set",
        "Reporting & learning": "Reporting happens and change follows, but feedback to "
                                "the reporter is the weak link",
        "Management & supervisor support": "Intent is credible and supervisors are "
                                           "trusted. Resourcing is the constraint staff "
                                           "feel most",
        "Handovers between shifts": "Strong on the measures, contradicted by interview "
                                    "testimony on incomplete handovers. Treat as good "
                                    "average with no floor",
        "Emergency readiness & routines": "Equipment and stock readiness are trusted. High "
                                          "N/A counts show a sizeable group with no line "
                                          "of sight to it",
        "Emergency readiness (about you)": "The weakest item in the instrument. Training "
                                           "currency, not equipment, is the exposure",
        "Fairness, incentives & ownership": "Role clarity is high, reward fairness is the "
                                            "lowest positive score in the survey. People "
                                            "know the job and distrust the deal",
        "Recommendation": "Staff would recommend the care more readily than the "
                          "employment. That gap is the report in one line",
    }
    for name, pos, rev, _n in section_profile(STAFF):
        _prof_rows.append([
            name,
            f"{pos:.2f}" if pos is not None else "n/a",
            f"{rev:.2f}" if rev is not None else "n/a",
            _readings.get(name, ""),
        ])
    el.append(table(_prof_rows, [128, 64, 60, CONTENT_W - 252],
                    align_centre=(1, 2), small=True))
    el.append(Spacer(1, 8))
    el.append(Paragraph(
        "Reverse items are negatively worded, so a lower number is the good result on that "
        "column. Read the two columns together: a dimension is healthy when the positive "
        "column is high and the reverse column is low.", SMALL))

    el.append(Paragraph("18.2  Psychological safety is conditional, not absent", H2))
    el.append(Paragraph(
        f"Staff will speak up about a patient at risk, scoring {m(STAFF, 'q7')}, and they "
        f"know how to report a safety concern, scoring {m(STAFF, 'q19')}. What they will "
        f"not reliably do is challenge a decision made by someone more senior, scoring "
        f"{m(STAFF, 'q6')}, the weakest item in the communication section. Fear of asking "
        f"when something does not look right sits at {m(STAFF, 'q8')} on the reverse "
        "scale, which is not alarming but is not clean either.", P))
    el.append(Paragraph(
        "This is the classic profile of a young clinical organisation with strong "
        "interpersonal warmth and undeveloped structural safety. People will speak up "
        "about the patient in front of them, because the immediate duty overrides the "
        "social cost. They will not speak up about a decision, a process, or a manager, "
        "because there is no structural protection for doing so and no forum designed for "
        "it. The interview evidence matched this precisely: some staff described an open "
        "door, others said the open door is not real.", P))
    el.append(Paragraph(
        "The practical consequence is that Haven hears about problems late, and hears "
        "about the wrong category of problem. Clinical near misses surface; process "
        "failures, resourcing frustrations, and manager behaviour do not, until they "
        "surface as a resignation.", P))

    el.append(Paragraph("18.3  Just culture is the edge to watch", H2))
    el.append(Paragraph(
        f"Three items describe how Haven responds when something goes wrong. The sense "
        f"that a reported event leads to blame rather than a fix scores {m(STAFF, 'q12')}, "
        f"mistakes being held against staff scores {m(STAFF, 'q11')}, and being treated "
        f"fairly after an error scores {m(STAFF, 'q13')}. On the reverse items a lower "
        "score is better, so these are not red. They are, however, the weakest cluster in "
        "the instrument relative to everything around them, and they sit directly next to "
        "a documented absence of incident recording.", P))
    el.append(Paragraph(
        "The combination matters. A hospital with no incident register handles events "
        "verbally, and verbal handling is personal by nature. Without a written process, "
        "the difference between a fair response and an unfair one depends entirely on "
        "which manager is in the room. Introducing the incident register recommended at "
        "F-08 is therefore a just-culture intervention as much as a governance one: it "
        "moves the response from personality to procedure.", P))

    el.append(Paragraph("18.4  Recognition is the missing management habit", H2))
    el.append(Paragraph(
        "Supervision at Haven is present, visible and well intentioned. It is also almost "
        "entirely corrective. Staff across departments described feedback arriving when "
        "something went wrong and rarely otherwise, and free text asked directly for "
        "recognition, for monthly encouragement from management, and, memorably, for "
        "colleagues not to be spoken to impolitely.", P))
    el.append(Paragraph(
        "Recognition is not a soft nicety here, it is the cheapest retention instrument "
        "available to an organisation that has not yet settled its benefits position. It "
        "costs nothing to implement, it can start this month, and in a workforce whose "
        "principal complaint is that welfare is not considered, it is the fastest visible "
        "signal that the complaint has been heard.", P))

    el.append(Paragraph("18.5  Culture is not evenly distributed", H2))
    el.append(Paragraph(
        "The most important cultural finding is variance rather than level. Staff "
        "descriptions of leadership differed sharply between departments: supportive and "
        "accessible in some accounts, closed in others. Both descriptions are accurate "
        "reports of different experiences within the same building.", P))
    el.append(Paragraph(
        "Variance of this kind is a management systems signal, not a personality one. "
        "Where there is no common standard for how a manager runs a team, no objectives to "
        "manage against, no one to one rhythm, and no measurement of the manager's own "
        "practice, each department inherits the temperament of whoever leads it. Fixing "
        "the variance therefore runs through the same instrument as everything else in "
        "Section 19: a defined management standard, applied consistently, measured "
        "honestly.", P))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>The cultural bottom line.</b>&nbsp; Haven does not have a culture problem in "
        "the usual sense. It has strong horizontal culture, meaning how colleagues treat "
        "each other, and weak vertical culture, meaning how the organisation treats its "
        "people and how safely they can speak upwards. Horizontal culture is the hard one "
        "to build and Haven already has it. Vertical culture is largely a function of "
        "systems that do not yet exist, which makes it the more tractable of the two.",
        bg=CREAM, bold=True))

    el.append(PageBreak())

    # ========================================================== SECTION 12 ===
    el.append(Paragraph("19.  People systems in depth", H1))
    el.append(Paragraph(
        "This is the chapter the rest of the report keeps pointing at. Seven of the twelve "
        "confirmed findings are people-system findings, one more is the owner decision "
        "that gates them, and the two commercial findings are constrained by the same "
        "gap. The assessment below runs the full employee lifecycle and rates each stage.",
        LEDE))
    el.append(Spacer(1, 6))
    el.append(table([
        ["Lifecycle stage", "Current state", "Rating", "What is missing"],
        ["Workforce planning", "Reactive. Hiring follows vacancy rather than a staffing "
                               "model", "1", "Establishment plan by role and shift, linked "
                                             "to volume and acuity"],
        ["Selection", "Informal. No structured competency assessment evidenced at entry",
         "2", "Role profiles, structured interview, competency and values assessment, "
              "reference and credential verification standard"],
        ["Onboarding and orientation", "Absent as a structured programme. Learning is by "
                                       "observation", "1",
         "Defined induction, procedure walkthrough and sign-off, buddy assignment, "
         "30 and 90 day checkpoints"],
        ["Training and development", "Not scheduled, not budgeted, not tracked", "1",
         "Annual training calendar, mandatory clinical currency, competency framework, "
         "training record per employee"],
        ["Performance management", "Does not exist. Staff were asked to write their own "
                                   "indicators", "1",
         "Objectives set by management, monthly one to one, quarterly review, calibrated "
         "ratings, documented outcome"],
        ["Reward and recognition", "Opaque and contested. No structured recognition",
         "2", "Published grade and pay structure, transparent review basis, formal "
              "recognition programme, decided benefits position"],
        ["Engagement and voice", "Warm peer culture, weak upward channel. Two general "
                                 "staff meetings in a year", "2",
         "Regular all-staff forum, department briefing rhythm, anonymous channel, "
         "closed-loop feedback on what changed"],
        ["Retention and exit", "No retention data, no exit interviews, no tenure tracking",
         "1", "Exit interview standard, tenure and turnover reporting, cost of turnover "
              "model, stay conversations for critical roles"],
    ], [104, 132, 40, CONTENT_W - 276], align_centre=(2,), small=True))
    el.append(Spacer(1, 10))
    el.append(card(
        "<b>Composite human resources maturity: 1.4 of 5.</b>&nbsp; This is the lowest "
        "rating anywhere in the report, and it is the rating that explains the others. "
        "The opening review scored this workstream at 3.0 on the strength of rosters and "
        "departmental "
        "schedules, which are scheduling artefacts rather than people systems. The "
        "distinction matters: Haven has administration, it does not have human resources.",
        bg=BAD_BG, rule=BAD))

    el.append(Paragraph("19.1  Why the tenure profile is the number to act on", H2))
    el.append(Paragraph(
        f"Of the {TEN_N} respondents who disclosed tenure, none had been at Haven for more "
        f"than two years and {TEN_UNDER_1Y} had been here under one. For a facility of "
        "Haven's age some of that is simply growth, and it should not be over-read. But "
        "the interview evidence points the same way: newly recruited nurses, a newly "
        "recruited pharmacist, newly recruited front desk staff, and an abrupt resignation "
        "without a handover period.", P))
    el.append(Paragraph(
        "Turnover is the multiplier on every other finding in this report. It is what "
        "makes the absence of induction expensive, because the cost is paid on every "
        "arrival. It is what makes the absence of documented process dangerous, because "
        "there is no one left who remembers the undocumented version. It is what prevents "
        "adherence from ever compounding, because the population being asked to adhere "
        "keeps changing. And it is what will quietly cap the growth plan, because "
        "specialist paediatric and neonatal capability is built over years in the same "
        "team.", P))
    el.append(Paragraph(
        "The honest position is that Haven does not currently know its turnover rate, its "
        "leaver reasons, or what a departure costs it. Establishing those three numbers is "
        "a two-week exercise against payroll and personnel records, and it converts the "
        "loudest anxiety in this report into a manageable figure the board can price.", P))

    el.append(Paragraph("19.2  The reward question, separated properly", H2))
    el.append(Paragraph(
        "Reward is the most emotionally charged finding and it is being discussed as one "
        "problem when it is three. Separating them makes it far cheaper to resolve.", P))
    el.append(table([
        ["Component", "The issue", "Cost to fix", "Timing"],
        ["Process transparency", "The last adjustment round was read as inequitable "
                                 "because the basis was never explained. Some received "
                                 "around 75 percent, others later around 25 percent",
         "Near zero", "Immediate"],
        ["Structure", "There is no published grade, band or progression structure, so "
                      "no one can see how pay is meant to move",
         "Low, design effort only", "30 to 60 days"],
        ["Benefits", "Health insurance and pension are the single most repeated staff "
                     "request in the survey and are currently absent",
         "Material, and a board decision", "Decide in 30 days, phase thereafter"],
    ], [96, CONTENT_W - 96 - 108 - 78, 108, 78], small=True))
    el.append(Spacer(1, 8))
    el.append(Paragraph(
        "Two of the three cost almost nothing and would remove most of the corrosive "
        "uncertainty. The third is a genuine commitment and belongs to the owners. Note "
        "the irony in the evidence: a paediatric hospital whose staff do not have health "
        "cover is a difficult position to hold publicly, and staff named it plainly.", P))

    el.append(Paragraph("19.3  What the induction programme has to contain", H2))
    el.append(Paragraph(
        "Induction is the build that changes the most, so it is specified here in full "
        "instead of left as a recommendation heading. It should be five working days for "
        "clinical staff and three for non-clinical, delivered to every new joiner and "
        "retrospectively to everyone hired in the last twelve months.", P))
    el += bullets([
        "<b>Day one, orientation.</b> The facility, the people, the values, the escalation "
        "map, and what Haven expects of every employee regardless of role.",
        "<b>Day two, the operating model.</b> The patient journey end to end, so that "
        "every employee understands where their work sits in the chain and who depends on "
        "it. This is the single most effective antidote to the handover failures already "
        "observed.",
        "<b>Day three, the procedures for the role.</b> Walked through, demonstrated, not "
        "emailed. Ending with a signed acknowledgement that becomes part of the personnel "
        "record.",
        "<b>Day four, clinical competency and emergency response.</b> For clinical staff: "
        "resuscitation status verified, crash trolley walkthrough, escalation drill. No "
        "clinical staff member should complete induction without their resuscitation "
        "currency recorded.",
        "<b>Day five, systems and expectations.</b> The clinical record system, "
        "documentation standards, the objectives for the role, and how performance will be "
        "reviewed.",
        "<b>Checkpoints at 30 and 90 days</b>, held by the department lead, documented, "
        "and tied to confirmation in post.",
    ])

    el.append(PageBreak())

    # ========================================================== SECTION 13 ===
    el.append(Paragraph("20.  Governance and owner alignment", H1))
    el.append(Paragraph(
        "Finding F-10 is placed last in the findings list and first in the sequence of "
        "remedies, because it is the only finding that management cannot fix on its own.",
        LEDE))
    el.append(Paragraph("20.1  Two legitimate instincts, no agreed resolution", H2))
    el.append(Paragraph(
        "The founding group holds two positions. One weights the protection of and "
        "investment in staff, and is cautious about applying commercial pressure to a "
        "young team doing difficult work. The other weights financial discipline and "
        "return, and is cautious about fixed cost commitments a fifteen month old facility "
        "has not yet earned.", P))
    el.append(Paragraph(
        "Both are correct about something important. The staff-weighted position is right "
        "that Haven's entire quality proposition currently rests on people, and that its "
        "turnover exposure is real and under-measured. The finance-weighted position is "
        "right that a young facility that commits to benefits it cannot sustain damages "
        "the workforce more, not less, and that the discipline to fund commitments from "
        "yield rather than optimism is what keeps the institution alive.", P))
    el.append(Paragraph(
        "The problem is not that the two views exist. It is that the trade-off between "
        "them has never been settled, written down, or given to management as a rule. So "
        "the answer to any given question depends on which owner is asked, and management "
        "learns, sensibly, to avoid asking. That is how a benefits decision goes eighteen "
        "months without resolution while appearing in every staff survey.", P))

    el.append(Paragraph("20.2  What the middle ground actually looks like", H2))
    el.append(Paragraph(
        "The middle ground is not a compromise on values. It is a set of operating "
        "principles that convert both instincts into a single decision rule, tied to the "
        "new strategic outlook. Written well, five or six principles remove the need for "
        "the board to arbitrate week by week. The following are offered as a starting "
        "draft for the alignment session, not as a recommendation to adopt unread.", P))
    el.append(table([
        ["Draft principle", "What it settles"],
        ["Workforce investment is funded from yield improvement, not from hope. Each "
         "commitment is matched to an identified source: neonatal occupancy, laboratory "
         "utilisation, pharmacy attach, or receivables recovery",
         "Reconciles both instincts. Staff investment is real and it is earned, so neither "
         "pole has to win"],
        ["Clinical safety spend is never traded. Resuscitation currency, emergency "
         "equipment, controlled medicines storage and infection prevention sit outside the "
         "commercial conversation",
         "Removes the most dangerous category of item from negotiation entirely"],
        ["Core benefits are a floor, not a reward. Health cover and pension are treated as "
         "the cost of employing people, phased to affordability but committed to a date",
         "Answers the loudest staff question with a decision rather than a silence"],
        ["No growth commitment is made that the building, the roster or the systems cannot "
         "carry. Capacity is proven before demand is generated",
         "Prevents the marketing-ahead-of-capability failure mode, and sequences the "
         "estate decision correctly"],
        ["Management decides within the envelope; the board decides the envelope. Owners "
         "set the annual people and capital envelope once, and do not reopen individual "
         "items inside it",
         "Ends the ask-the-last-owner pattern and gives management a real mandate"],
        ["Every material decision is recorded with its rationale in a decision register",
         "Creates institutional memory and makes the principles auditable rather than "
         "aspirational"],
    ], [CONTENT_W - 190, 190], small=True))

    el.append(Paragraph("20.3  The governance architecture that is missing", H2))
    el.append(Paragraph(
        "Beyond alignment, the formal governance instruments were not available for "
        "review and, on the interview evidence, largely do not yet exist. The escalation "
        "path is understood and used, which is a genuine strength, but understanding is "
        "not the same as documented authority.", P))
    el.append(table([
        ["Instrument", "Status", "Why it matters at Haven's stage"],
        ["Delegation of authority matrix", "Not evidenced",
         "Defines what management can approve without the board, which is the practical "
         "expression of the envelope principle above"],
        ["Board and committee terms of reference", "Not evidenced",
         "A clinical governance committee and a finance committee are the minimum for a "
         "facility operating neonatal intensive care"],
        ["Decision register", "Not evidenced",
         "Records what was decided, by whom, and why. Removes the ambiguity that currently "
         "reaches the front line"],
        ["Governance calendar", "Not evidenced",
         "Predictable rhythm of board, clinical governance, finance and performance "
         "reviews, so oversight is routine rather than event-driven"],
        ["Enterprise risk register", "Not evidenced",
         "Section 26 of this report is, in effect, Haven's first one. It needs an owner "
         "and a review cadence to stay alive"],
        ["Clinical incident register", "Not evidenced",
         "The single most urgent instrument. Covered at F-08"],
    ], [140, 78, CONTENT_W - 218], small=True))

    el.append(PageBreak())

    # ========================================================== SECTION 14 ===
    el.append(Paragraph("21.  Clinical governance and quality", H1))
    el.append(Paragraph(
        "Haven delivers good clinical care. It cannot currently demonstrate that it does, "
        "and the distinction is not academic: it is the difference between quality that is "
        "believed and quality that is provable to a regulator, an insurer, a referring "
        "consultant or a partner.", LEDE))
    el.append(Paragraph("21.1  Delivery and governance are at different maturities", H2))
    el.append(Paragraph(
        "Splitting the clinical workstream in two makes the position clear. On delivery, "
        "the evidence supports a rating around 4. On governance, it supports around 2. The "
        "composite rating of 3.5 in Section 24 conceals that spread, so it is set out here.",
        P))
    el.append(table([
        ["Element", "Assessment", "Evidence"],
        ["Clinical pathways and workflow", "Strong",
         "Consistent description of the patient journey across every department "
         "interviewed; nursing assessment precedes consultation as designed"],
        ["Handover practice", "Good on average, no floor",
         f"Information sharing across shifts rates {m(STAFF, 'q25')} and shift change "
         "risk is low, yet incomplete handovers were named in interview as a recurring "
         "source of error"],
        ["Emergency equipment readiness", "Strong",
         f"Crash trolley readiness {m(STAFF, 'q28')}, shift checking routine "
         f"{m(STAFF, 'q29')}, confidence in resuscitating now {m(STAFF, 'q30')}"],
        ["Clinical training currency", "Weak",
         f"Resuscitation currency {m(STAFF, 'q32')}, the weakest item in the survey; "
         "doctors asked directly for more frequent clinical training"],
        ["Incident documentation", "Absent",
         "Doctors confirmed no formal documentation process for clinical incidents, "
         "although incidents are escalated and resolved"],
        ["Clinical audit", "Absent", "No clinical audit reports, quality improvement "
                                     "records or governance committee minutes evidenced"],
        ["Laboratory quality control", "Good practice, informal",
         "Accuracy validated against an external reference laboratory, but not run as a "
         "documented programme with recorded results"],
        ["Medicines management", "Strong, with two control gaps",
         "Mature inventory and expiry practice; controlled medicines storage capacity is "
         "constrained and procurement is self-approved by the pharmacy lead"],
    ], [126, 104, CONTENT_W - 230], small=True))

    el.append(Paragraph("21.2  The incident register is the first build", H2))
    el.append(Paragraph(
        "Of everything recommended in this report, the clinical incident register is the "
        "item with the shortest distance between effort and value. It takes days to "
        "establish, it costs nothing meaningful, and it converts a category of risk that "
        "is currently uncontrolled into one that is managed.", P))
    el.append(Paragraph(
        "The willingness is already there, which is the hard part. Nursing described "
        "reporting a medication error openly to the head nurse and having it resolved "
        "appropriately. Doctors confirmed that incidents get escalated. Haven has the "
        "reporting culture and lacks only the instrument. Most hospitals have the "
        "instrument and lack the culture, which is a far worse place to start from.", P))
    el.append(Paragraph("The register should capture, at minimum:", P))
    el += bullets([
        "What happened, when, where, and who was involved, recorded factually rather than "
        "attributively.",
        "Whether the event reached the patient, and whether harm resulted, using a "
        "consistent severity scale.",
        "Immediate action taken, and by whom.",
        "Contributory factors, examined at system level rather than individual level, "
        "which is what makes it a just-culture instrument.",
        "Corrective action, owner, due date, and evidence of completion.",
        "Whether the corrective action worked, checked at a later date. This last field is "
        "the one most registers omit and the one that creates actual learning.",
    ])
    el.append(Spacer(1, 4))
    el.append(card(
        "A weekly fifteen minute review of the register, chaired by the clinical lead with "
        "nursing and pharmacy present, would close the learning loop that F-08 identifies "
        "as broken. It would also give Haven, within one quarter, something it cannot "
        "produce today: a documented record of how it manages clinical risk.", bg=SURFACE))

    el.append(PageBreak())

    # ========================================================== SECTION 15 ===
    el.append(Paragraph("22.  Commercial yield", H1))
    el.append(Paragraph(
        "Haven has two assets that carry disproportionate value and are both being run "
        "below their economic potential, for different reasons. Neither problem is a "
        "demand problem.", LEDE))
    el.append(Paragraph("22.1  The neonatal unit: the sale is clinical", H2))
    el.append(Paragraph(
        "Neonatal intensive care is the highest-yield service Haven operates and the "
        "hardest for a competitor to replicate. It also has the least forgiving economics: "
        "a cot that is staffed, equipped and empty costs almost as much as a cot that is "
        "occupied. Under-utilisation there is the most expensive idle capacity in the "
        "building.", P))
    el.append(Paragraph(
        "The unit is not being promoted as it should be, and the cause is capability "
        "rather than effort. Business development is genuinely active across schools, "
        "faith organisations, maternity centres and referral partners, and identifies "
        "networking and direct outreach as its most effective channels. But neonatal "
        "referral is a clinical sale, not a general marketing one. It is won with "
        "paediatricians, obstetricians, midwives and maternity centre operators who need "
        "to know cot capability, admission criteria, what Haven will and will not accept, "
        "how transfer works, how escalation works, and what happens to the referring "
        "clinician's relationship with the family afterwards.", P))
    el.append(Paragraph(
        "That conversation cannot be held without clinical fluency, and the team has not "
        "been equipped with it. The gap is therefore closable with content and pairing "
        "rather than with headcount.", P))
    el.append(table([
        ["What is missing", "What to build"],
        ["A referral proposition aimed at clinicians rather than at families",
         "A short clinical referral pack: capability, criteria, contacts, transfer "
         "protocol, escalation, and the commitment on referring-clinician feedback"],
        ["A named target list rather than general outreach",
         "A mapped catchment of maternity centres, obstetricians, paediatricians and "
         "general practitioners, ranked by delivery volume and proximity"],
        ["Clinical fluency in the commercial team",
         "A standing clinical briefing rhythm, and a clinician attending referral meetings "
         "until the team can carry them alone"],
        ["Measurement by yield rather than activity",
         "Referral source tracking, conversion rate by source, and neonatal admissions "
         "reported separately from general footfall"],
        ["A reason for the referrer to keep referring",
         "A discharge summary and outcome letter back to the referring clinician as "
         "standard. This is the cheapest and most durable referral loyalty instrument in "
         "healthcare"],
    ], [180, CONTENT_W - 180], small=True))

    el.append(Paragraph("22.2  The laboratory: unmeasured capacity is unmanaged margin", H2))
    el.append(Paragraph(
        "The laboratory runs a sound clinical workflow and validates its accuracy against "
        "an external reference laboratory, which is genuinely good practice. What it does "
        "not have is any economic or capacity instrumentation, and in diagnostics that is "
        "where the money is.", P))
    el.append(Paragraph(
        "Reagent yield is the specific gap. Nobody currently measures how many reportable "
        "results each reagent pack actually produces against how many it should, which "
        "means nobody can see wastage from calibration runs, repeat testing, open-vial "
        "expiry, or low batch utilisation. Under-loaded analysers make this worse in a "
        "compounding way: the fewer samples run per batch, the higher the reagent cost per "
        "reportable result, so an under-promoted laboratory is also a structurally more "
        "expensive one.", P))
    el.append(Paragraph(
        "Maintenance follows the same pattern. Calibration is regular, which is correct, "
        "but servicing is reactive: machines are serviced when they fault, and samples are "
        "referred out while repairs happen. Referral out is both a direct cost and a "
        "turnaround penalty for the clinician waiting on the result, and neither is "
        "quantified today.", P))
    el.append(table([
        ["Measure to introduce", "What it tells you"],
        ["Reagent yield: reportable results per pack against manufacturer expectation",
         "Where reagent value is being lost, and how much"],
        ["Cost per reportable result, by test and by analyser",
         "Which tests make money, which subsidise others, and where pricing is wrong"],
        ["Analyser utilisation against rated capability",
         "How much diagnostic capacity Haven is paying for and not using"],
        ["Turnaround time against a stated standard, by test category",
         "The clinical service level, and the case for internal versus referred testing"],
        ["Repeat and reject rate, with reasons",
         "Sample quality, calibration and training issues, all of which consume reagent"],
        ["Referred-out volume and cost during downtime",
         "The real price of reactive maintenance, which funds the preventive schedule"],
    ], [230, CONTENT_W - 230], small=True))
    el.append(Spacer(1, 8))
    el.append(Paragraph(
        "There is also a growth option sitting inside this finding. Spare, instrumented "
        "diagnostic capacity can be sold outward to nearby clinics and practices as an "
        "external service line, which converts an under-utilised fixed asset into revenue "
        "without consuming any additional physical space. That option is developed in "
        "Section 32.", P))

    el.append(PageBreak())

    # ========================================================== SECTION 16 ===
    el.append(Paragraph("23.  Estate and physical capacity", H1))
    el.append(Paragraph(
        "Space surfaced unprompted from staff who were otherwise positive about the "
        "facility, and from caregivers in the patient survey. It is treated here as a "
        "distinct chapter because it is the one constraint that no amount of management "
        "improvement will relieve, and because two of its components are compliance "
        "matters rather than comfort ones.", LEDE))
    el.append(Spacer(1, 6))
    el.append(table([
        ["Constraint", "Nature", "Priority", "Why"],
        ["Inpatient bed spaces", "Capacity", "High",
         "Named repeatedly by staff as the limit on patient care. Caps inpatient growth "
         "and creates admission refusal risk at peak"],
        ["Controlled medicines storage", "Compliance", "Critical",
         "Controlled drugs are correctly segregated but storage capacity is insufficient. "
         "This is a regulatory exposure that grows with volume"],
        ["General ward drainage", "Compliance and safety", "Critical",
         "The general ward floods when it rains. Infection prevention, electrical safety "
         "and service continuity are all implicated"],
        ["Caregiver access", "Experience and access", "High",
         "Caregivers repeatedly raise the staircases and ask for lift access. Affects "
         "families with infants, equipment and limited mobility"],
        ["Inpatient utilities", "Experience", "Medium",
         "Basic facilities for inpatient families, including refrigeration and food "
         "warming, were named by staff on behalf of parents"],
        ["Consultation and clinic rooms", "Capacity", "Medium",
         "Constrains sessional specialist clinics, which is a low capital growth option "
         "otherwise available"],
        ["Overall footprint", "Strategic", "High",
         "Staff summary, unprompted: what Haven has is working, but Haven is growing "
         "bigger"],
    ], [116, 96, 62, CONTENT_W - 274], align_centre=(2,), small=True))
    el.append(Spacer(1, 10))
    el.append(Paragraph("23.1  Why this sits on the critical path", H2))
    el.append(Paragraph(
        "Every growth option in Section 32 that increases physical presence consumes the "
        "same constrained footprint: more neonatal cots, more inpatient beds, more "
        "specialist clinic sessions, more diagnostic throughput. Two of the options, "
        "remote consultation and external diagnostics, deliberately do not, which is "
        "precisely why they are attractive in the near term.", P))
    el.append(Paragraph(
        "The board therefore has a sequencing decision as much as a capital one. "
        "Generating demand that the building cannot absorb converts a strength, the "
        "patient experience score in Section 15, into a weakness, because the first thing "
        "that degrades under capacity pressure is waiting time and attention, which are "
        "already the two softest items in the caregiver survey.", P))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>Immediate, regardless of the strategic decision.</b>&nbsp; Ward drainage and "
        "controlled medicines storage should be remediated now and treated as compliance "
        "items, not as part of any expansion business case. They are inexpensive relative "
        "to their risk, and neither should wait on a capital decision that may take "
        "months.", bg=BAD_BG, rule=BAD))

    el.append(PageBreak())

    # =========================================================== SECTION 9 ===
    el.append(Paragraph("24.  Workstream assessment", H1))
    el.append(Paragraph(
        "Each workstream is rated on the five-level maturity model set out at the start of the "
        "engagement, "
        "where 1 is Initial, 3 is Defined, and 5 is Optimised. Confidence reflects the "
        "strength of the evidence behind the rating, not the rating itself.", P))
    el.append(Spacer(1, 4))
    el.append(table([
        ["Workstream", "Opening", "Now", "Target", "Confidence", "Basis for the current rating"],
        ["Leadership and governance", "3.0", "3.0", "4.5", "High",
         "Escalation path understood and used; weekly management meetings held. "
         "Delegation, committee structure and owner alignment still unresolved"],
        ["Organisational culture", "3.0", "3.0", "4.5", "High",
         "Strong teamwork, weaker voice and recognition, uneven leadership experience "
         "across departments"],
        ["Human resources", "3.0", "2.0", "4.5", "High",
         "No appraisal, no objectives, no structured induction, no training calendar, "
         "indicative retention risk"],
        ["Clinical operations", "4.0", "3.0", "5.0", "High",
         "Pathways, teamwork and emergency readiness are strong. Establishment does not "
         "match the service: four nurses through the half year, no rostered pharmacist, "
         "72-hour single-cover laboratory blocks, and eight days in July with two people "
         "across 24 hours"],
        ["Clinical governance", "n/a", "1.5", "4.0", "High",
         "Separated from delivery because the two are at different maturities. No incident "
         "documentation, no clinical audit, no transfusion compatibility method, no "
         "critical value pathway, no paediatric reference ranges, lapsed document control"],
        ["Revenue cycle", "2.0", "2.0", "4.5", "High",
         "The automated front end works and the payer process is understood. The record "
         "behind it is a manual nursing sheet, 80.9 percent of the tariff is unpriced, a "
         "month of insured billing is missing, and the officer post that owns the daily "
         "claims audit does not exist"],
        ["Finance", "2.0", "1.5", "4.5", "Medium",
         "Now evidenced rather than assumed. No accounting record was produced. Every "
         "figure available is an operational log; the logs do not reconcile to each other "
         "or to board reporting"],
        ["Pharmacy", "3.0", "3.0", "4.5", "High",
         "Process discipline is genuine and is the internal benchmark. Offset by no "
         "rostered pharmacist, no temperature log, no controlled drugs evidence, and stock "
         "that does not roll forward in any month tested"],
        ["Patient experience", "2.0", "4.5", "5.0", "High",
         f"{P_N} caregiver responses averaging {P_POS}. Cost clarity and in-stay "
         "communication are the gaps"],
        ["Performance management", "3.0", "2.0", "4.5", "High",
         "Reporting exists; no objectives, measurement or review cycle sits above it"],
        ["Risk and compliance", "2.0", "1.5", "4.0", "High",
         "No incident register, no risk register, no internal audit, no complaints log, "
         "and four months of monthly reporting that misstated the facility's own "
         "regulatory standing"],
        ["Growth, brand and market development", "n/a", "2.0", "4.0", "High",
         "Active outreach to schools, faith organisations, maternity centres and referrers, "
         "but the neonatal unit is not the focus of it, the team carries healthcare domain "
         "gaps, and there is no pipeline tooling, referral tracking or conversion "
         "measurement"],
        ["Overall", "3.0", "2.5", "4.5", "High",
         "Down from the opening view, and the distribution has changed more than the average"],
    ], [110, 42, 42, 40, 54, CONTENT_W - 288], align_centre=(1, 2, 3, 4),
        small=True, total_row=True))
    el.append(Spacer(1, 10))
    el.append(card(
        "<b>Read the shape, not the average.</b>&nbsp; Overall maturity moved from 3.0 to "
        "2.5, and the distribution moved further than the average. Two workstreams rose "
        "sharply and seven fell. The pattern is clean: everything that touches the patient "
        "scored better than we assumed, and everything that supports the patient, "
        "meaning people systems, records, medicines governance and clinical infrastructure, "
        "scored worse. Haven has been building outward and has not yet built inward.",
        bg=SURFACE, bold=True))

    el.append(Paragraph("24.1  The movers explained", H2))
    el.append(Paragraph("Patient experience, 2.0 to 4.5", H3))
    el.append(Paragraph(
        "We could not rate this workstream at the outset because the patient voice had not been "
        "collected. It now has been, and the result is the clearest strength in the "
        "organisation. Rated at 4.5 rather than 5.0 because cost communication, in-stay "
        "communication and waiting times are measurable gaps, and because there is no "
        "formal complaints register, service recovery framework or satisfaction "
        "measurement running as a routine. The outcome is excellent; the system producing "
        "it is not yet instrumented.", P))
    el.append(Paragraph("Human resources, 3.0 to 2.0", H3))
    el.append(Paragraph(
        "The opening view rated this on the presence of rosters and departmental schedules, "
        "which "
        "are administrative artefacts rather than people systems. Fieldwork found the "
        "substance missing: no appraisal, no objectives, no induction, no training plan, "
        "no competency framework, and an indicative retention problem. The downgrade "
        "reflects better evidence, not deterioration.", P))
    el.append(Paragraph("Revenue cycle, held at 2.0", H3))
    el.append(Paragraph(
        "The field validation found the transactional front end well controlled and largely "
        "automated, and that finding stands: eligibility is verified before treatment, "
        "bills assemble from the clinical record, error rates are low and a documented "
        "overpayment was refunded within a week. On interview evidence alone this would "
        "have been an upgrade to 3.5. The documentary evidence prevents it. The record "
        "behind the automated front end is a manual nursing sheet, four fifths of the "
        "tariff carries no price, an entire month of insured billing is absent, the officer "
        "post that owns the daily claims audit does not exist, and 11.4 percent of "
        "everything ever claimed has not been collected with no rejection reason data to "
        "work from. A well-run front end sitting on an unreliable record is not a "
        "functioning revenue cycle.", P))
    el.append(Paragraph("Clinical operations, 4.0 to 3.0, and clinical governance separated out", H3))
    el.append(Paragraph(
        "Clinical delivery would still rate around 4.0 on the evidence: coherent pathways, "
        "good handover scores, trusted emergency equipment, willingness to report errors, "
        "and patients who feel safe. What pulls the composite down is establishment rather "
        "than practice. Four registered nurses covered the half year, eight days in July "
        "are covered by two people across twenty-four hours, the laboratory runs "
        "seventy-two hour single-cover blocks, and no pharmacist is rostered on any day.", P))
    el.append(Paragraph(
        "Clinical governance has been separated into its own line at 1.5 because averaging "
        "it into delivery concealed the spread. No incident documentation, no clinical "
        "audit, no transfusion compatibility method, no critical value pathway, no "
        "paediatric reference ranges, no quality control programme, and document control "
        "that has lapsed across the set.", P))
    el.append(Paragraph("Pharmacy, held at 3.0", H3))
    el.append(Paragraph(
        "The field validation rated this department the internal benchmark and the process "
        "discipline behind that judgement is real. It is held rather than upgraded because "
        "three governance findings sit against it: no pharmacist rostered on any day, no "
        "temperature record behind N5.3M of vaccination revenue, and stock that fails to "
        "roll forward in any month tested, with the physical count written into the ledger "
        "instead of reconciled against it.", P))

    el.append(PageBreak())

    # ========================================================== SECTION 10 ===
    el.append(Paragraph("25.  COSO reassessment", H1))
    el.append(Paragraph(
        "The opening review assessed the five COSO components on documented design only, and "
        "said so. "
        "Phase 2 allows an operating effectiveness view alongside the design view. The "
        "pattern is consistent across all five components: design ratings hold, operating "
        "ratings sit below them.", P))
    el.append(Spacer(1, 4))
    el.append(table([
        ["Component", "Design", "Operating", "Assessment"],
        ["Control environment", "Moderate to high", "Moderate",
         "Structures, responsibilities and reporting lines are documented and understood. "
         "Delegation of authority, committee terms of reference and owner alignment remain "
         "unevidenced or unresolved"],
        ["Risk assessment", "Low to moderate", "Low",
         "No enterprise risk register, no clinical incident register, no fraud risk "
         "assessment and no business continuity plan evidenced. Risk is recognised "
         "informally by leadership and managed by reaction"],
        ["Control activities", "High", "Moderate",
         "The strongest design area in the organisation, and the clearest example of the "
         "design and adherence gap. Procedures are comprehensive; training on them, "
         "sign-off and compliance audit are absent"],
        ["Information and communication", "Moderate to high", "Moderate",
         "The clinical record system is a genuine strength and produces reliable "
         "transactional information. Internal communication runs largely through informal "
         "messaging, general staff meetings are rare, and performance information is not "
         "converted into management action"],
        ["Monitoring activities", "Low to moderate", "Low",
         "The weakest component. No compliance audit, no internal audit, no corrective "
         "action register, no exception reporting, and no incident trending"],
    ], [110, 82, 68, CONTENT_W - 260], align_centre=(1, 2), small=True))
    el.append(Spacer(1, 10))
    el.append(Paragraph(
        "The two components rated lowest, risk assessment and monitoring, are the two that "
        "would have caught every other finding in this report. That is not a coincidence. "
        "An organisation without a monitoring layer does not know what it does not know, "
        "and this audit is currently performing the function that the monitoring layer "
        "should perform for itself.", P))

    # ========================================================== SECTION 11 ===
    el.append(Paragraph("26.  Updated risk register", H1))
    el.append(Paragraph(
        "Risks are restated against the evidence gathered this phase. Three of the opening "
        "risks are "
        "downgraded because fieldwork did not support them at the level assumed. Four are "
        "added or raised.", P))
    el.append(Spacer(1, 4))
    el.append(table([
        ["Risk", "Likelihood", "Impact", "Rating", "Movement", "Response"],
        ["Regulatory currency", "Medium", "High", "High", "New",
         "Registration confirmed. Submit the current year renewal, confirm the health "
         "insurance scheme position in writing, and hold both on the governance file"],
        ["Clinical establishment against service run", "High", "High", "Critical", "New",
         "Set a two registered nurse floor, roster a pharmacist on every dispensing day, and "
         "test consultant cover against the medical officer rota"],
        ["Medicines governance and cold chain", "High", "High", "Critical", "New",
         "Start the temperature log today, produce the controlled drugs register, roster "
         "pharmacist supervision of dispensing"],
        ["Transfusion pathway integrity", "Medium", "High", "Critical", "New",
         "Rewrite the pathway as one document with the compatibility method, consent from "
         "the parent, administration responsibility named and the emergency route at the "
         "finance gate"],
        ["Revenue record integrity", "High", "High", "Critical", "New",
         "Retire the manual layer, capture at the point of care, price the tariff, "
         "establish the payer officer role"],
        ["Management reporting reliability", "High", "High", "Critical", "New",
         "Independent reconciliation of the clinical record system against board reporting, "
         "prepared outside the operations function"],
        ["Power resilience for critical care", "Medium", "High", "High", "New",
         "Load calculation for the neonatal unit, and resolution of the generator position"],
        ["Clinical record system continuity", "Low", "High", "High", "New",
         "Automated nightly backup with a tested restore, given the system is the record "
         "for both clinical care and billing"],
        ["Referral commission arrangements", "Medium", "High", "High", "New",
         "Establish whether any rebate has been paid, and take a board position on the "
         "arrangement before it is extended internally"],
        ["Workforce stability and retention", "High", "High", "Critical", "New",
         "Validate against HR records, introduce exit interviews, build the retention case "
         "into the reward decision"],
        ["Adherence to clinical and operational standards", "High", "High", "Critical",
         "Held", "Redesign core procedures with the teams, train and sign off, then audit "
         "adherence weekly"],
        ["Absent performance management", "High", "High", "Critical", "Raised",
         "Install objectives, monthly conversations and a quarterly review cycle"],
        ["Clinical governance record", "High", "High", "High", "Raised",
         "Open an incident register with weekly review and corrective action tracking"],
        ["Owner alignment on strategic trade-offs", "Medium", "High", "High", "New",
         "Board alignment session producing written operating principles"],
        ["Physical capacity and estate", "High", "Medium", "High", "New",
         "Estate review; treat drainage and controlled medicines storage as compliance "
         "items"],
        ["Clinical training currency", "Medium", "High", "High", "New",
         "Resuscitation training schedule with a currency register per clinician"],
        ["Working capital and receivables", "Medium", "High", "High", "Held",
         "Complete the finance review; receivables ageing and collection discipline"],
        ["Under-utilised neonatal capacity", "High", "High", "High", "New",
         "Build a clinician-facing neonatal referral programme and equip business "
         "development with the clinical content to run it"],
        ["Unmeasured laboratory yield and capacity", "High", "Medium", "High", "New",
         "Introduce reagent yield, cost per reportable result, turnaround and utilisation "
         "reporting; move servicing from reactive to planned"],
        ["Payer concentration", "Medium", "High", "High", "New",
         "Two payers carry 72.1 percent of insured revenue. Build the third relationship "
         "before either is lost"],
        ["Revenue cycle front-end controls", "Low", "Medium", "Medium", "Lowered",
         "Transaction controls at the point of billing tested as sound; the exposure is in "
         "the record behind them, carried separately above"],
        ["Patient experience gap against documented standards", "Low", "Medium", "Low",
         "Lowered", "Evidence contradicts the assumed gap; instrument it and keep "
         "measuring"],
        ["Executive over-involvement in routine operations", "Low", "Medium", "Low",
         "Lowered", "Departments resolve at their own level; focus on the middle "
         "management layer instead"],
    ], [128, 52, 42, 46, 48, CONTENT_W - 316], align_centre=(1, 2, 3, 4), small=True))

    el.append(PageBreak())

    # ========================================================== SECTION 12 ===
    el.append(Paragraph("27.  Root cause analysis", H1))
    el.append(Paragraph(
        "The findings are not twenty separate problems. They are a small number of "
        "problems expressed many ways, with one problem sitting above all of them.", P))
    el.append(Spacer(1, 4))
    el.append(table([
        ["Layer", "What sits here", "What it causes downstream"],
        ["Root: unresolved owner trade-off",
         "No written position on how far to invest in the workforce before pressing for "
         "commercial return",
         "Management cannot commit to benefits, training spend or a reward structure, so "
         "none of them get built"],
        ["Consequence: no people system",
         "No structured selection and induction, no training calendar, no objectives, no "
         "appraisal, no reward transparency",
         "Staff arrive untrained in the operating model, are never measured, and leave "
         "before institutional habit forms"],
        ["Consequence: no adherence",
         "Procedures are emailed rather than taught, and never audited",
         "Practice varies by individual and drifts as the workforce turns over"],
        ["Consequence: no learning loop",
         "Incidents are resolved verbally and never recorded; feedback is corrective and "
         "arrives only after error",
         "Problems recur invisibly and improvement depends on individual memory"],
        ["Compounding: physical constraint",
         "Bed spaces, storage, drainage and access at the edge of the envelope",
         "Growth options narrow and two constraints carry regulatory exposure"],
        ["Result: performance rests on people",
         "Good outcomes produced by effort and goodwill rather than by system",
         "Quality is real but not durable, and is exposed to exactly the turnover the "
         "hospital is experiencing"],
    ], [122, CONTENT_W - 122 - 172, 172], small=True))
    el.append(Spacer(1, 10))
    el.append(card(
        "This is why the sequence of the recommendations matters more than their content. "
        "Building performance management before the owners have agreed what they are "
        "willing to invest produces a system nobody can fund. Auditing adherence before "
        "anyone has been trained produces a compliance culture that punishes people for "
        "not knowing something they were never taught. The order below is deliberate.",
        bg=CREAM))

    # ========================================================== SECTION 13 ===
    el.append(Paragraph("28.  Recommendations", H1))
    el.append(Paragraph("The design principle", H2))
    el.append(Paragraph(
        "Everything that follows should be built the same way, and it is worth naming the "
        "principle because it is the opposite of what most improvement programmes do. You "
        "have already proved that writing a process and issuing it does not produce a "
        "followed process. The alternative is to design each process around the person who "
        "has to execute it: "
        "observe the work as it is actually done, build the standard with the people doing "
        "it, test it against a real shift, then train, sign off and audit. Processes "
        "designed this way get followed because they fit the work, not because someone is "
        "enforcing them. The same principle applies to the patient-facing processes, "
        "designed around the family's experience of the journey rather than the "
        "hospital's internal convenience.", P))
    el.append(Spacer(1, 6))

    el.append(Paragraph("28.0  This week, before anything else", H2))
    el.append(Paragraph(
        "Six things should not wait for a thirty day plan, or for the next board meeting, "
        "or for us. Each is either a safety exposure that grows every week it is open, or "
        "a question whose answer changes the order of everything else. None of them needs "
        "a strategy discussion and none of them needs meaningful money.", P))
    el.append(table([
        ["Action", "Owner", "Why it cannot wait"],
        ["Submit the registration renewal and confirm the health insurance scheme position "
         "in writing",
         "Founders", "Registration is confirmed. The renewal is the outstanding item and "
                     "should not run into another quarter"],
        ["Start a pharmacy and vaccine fridge temperature log today",
         "Pharmacy lead", "Every day without one adds to a period of vaccination for which "
                          "cold chain integrity cannot be evidenced"],
        ["Roster a pharmacist on every day the pharmacy dispenses",
         "Head of Operations", "Paediatric doses are weight calculated. Verification is "
                               "currently performed without a pharmacist on the premises"],
        ["Set a floor of two registered nurses in the building at all times, and stop "
         "rostering non-nursing staff as nursing cover",
         "Clinical lead", "Eight days in July were covered by two people across twenty-four "
                          "hours, four of them by one nurse and a pharmacy technician"],
        ["Commission a load calculation for the neonatal unit and resolve the generator "
         "position", "Head of Operations",
         "The primary generator is recorded as down for six months while ventilated "
         "neonates were being cared for"],
        ["Turn on automated nightly backup of the clinical record system with a tested "
         "restore", "Head of Operations",
         "It is the record for both clinical care and billing, and no automated backup "
         "operated through the half year"],
    ], [186, 88, CONTENT_W - 274], small=True))
    el.append(Spacer(1, 8))
    el.append(card(
        "None of these six is a recommendation in the ordinary sense. They are the "
        "conditions under which the rest of this report can sensibly be implemented, and "
        "we would expect all six to be closed or in progress before the board meets to "
        "discuss anything else in it.", bg=BAD_BG, rule=BAD, bold=True))

    el.append(Spacer(1, 12))
    el.append(Paragraph("28.1  First 30 days: settle the direction and stop the bleeding", H2))
    el.append(table([
        ["Action", "Owner", "What done looks like"],
        ["Board alignment session on the strategic trade-off",
         "Founders",
         "A written set of five or six operating principles that tell management how to "
         "decide between workforce investment and commercial pressure, plus an agreed "
         "envelope for people spend over twelve months"],
        ["Open the clinical incident register", "Clinical lead",
         "A single reporting form, all incidents logged, weekly review, corrective actions "
         "tracked to closure"],
        ["Publish departmental objectives", "Head of Operations with department leads",
         "No more than five indicators per department, written by management, visible to "
         "every member of staff"],
        ["Resuscitation training plan", "Clinical lead",
         "A dated schedule for basic life support, paediatric advanced life support and "
         "neonatal resuscitation, and a currency register showing every clinician's status"],
        ["Decide the staff benefit position", "Founders",
         "A decision on health insurance and pension, and a communicated timeline, even if "
         "phased or partial"],
    ], [140, 96, CONTENT_W - 236], small=True))

    el.append(Spacer(1, 12))
    el.append(Paragraph("28.2  Days 30 to 60: build the people system", H2))
    el.append(table([
        ["Action", "Owner", "What done looks like"],
        ["Structured induction programme", "Human resources with department leads",
         "A defined induction covering values, the operating model, procedures relevant to "
         "the role, and a competency check. Every person hired in the last twelve months "
         "runs back through it"],
        ["Performance management cycle", "Human resources with Head of Operations",
         "Objectives set, a monthly one to one, a quarterly review, and a written link "
         "between review outcome and reward"],
        ["Reward transparency", "Founders with human resources",
         "The pay, commission and review structure written down and explained to staff, "
         "including how the last adjustment round was decided"],
        ["Human-centred redesign of the core procedures", "Consult for Africa with "
         "department teams",
         "The eight highest-risk procedures rebuilt with the teams that run them, then "
         "trained and signed off. Handover is the first of them"],
        ["Complaints and service recovery framework", "Customer service lead",
         "A complaints register, acknowledgement and resolution standards, monthly trend "
         "review"],
        ["Estate and space review", "Operations with founders",
         "A measured assessment of the current footprint against a three-year volume plan. "
         "Ward drainage and controlled medicines storage treated as compliance items and "
         "remediated first"],
        ["Laboratory yield and capacity audit", "Laboratory lead with finance",
         "Reagent yield per pack against expected, cost per reportable result, analyser "
         "utilisation against capability, turnaround time against a stated standard, and "
         "a planned preventive maintenance schedule replacing reactive servicing"],
        ["Neonatal referral programme", "Business development with clinical lead",
         "A clinician-facing proposition covering cot capability, admission criteria, "
         "escalation and transfer, a named target list of referring paediatricians, "
         "obstetricians and maternity centres, and clinical briefing for the business "
         "development team so they can hold the conversation"],
    ], [140, 96, CONTENT_W - 236], small=True))

    el.append(Spacer(1, 12))
    el.append(Paragraph("28.3  Days 60 to 90: make it stick and measure it", H2))
    el.append(table([
        ["Action", "Owner", "What done looks like"],
        ["Adherence audit programme", "Operations",
         "Weekly spot checks against the redesigned procedures, scored by department, "
         "reported to the executive meeting, with corrective actions tracked"],
        ["Retention diagnostic", "Human resources",
         "Tenure curve, leaver reasons, exit interviews introduced as standard, and a cost "
         "of turnover estimate the board can act on"],
        ["Complete the finance review", "Finance with Consult for Africa",
         "Receivables ageing, collection performance, days sales outstanding, and the "
         "working capital position quantified"],
        ["Instrument patient experience", "Customer service lead",
         "The experience survey running continuously rather than as a one-off, with a "
         "monthly dashboard covering satisfaction, complaints, resolution time and waiting "
         "time"],
        ["Growth infrastructure", "Business development",
         "Referral source tracking and conversion measurement, reported by service line "
         "with neonatal admissions separated out, so outreach is judged by yield rather "
         "than by activity. Prospecting and follow-up tooling to replace manual tracking"],
        ["Close the domain gap in the commercial team", "Business development with "
         "clinical lead",
         "A standing clinical briefing rhythm so the team can speak credibly about "
         "capability and pathways, and a clinician alongside them in referral meetings "
         "until they can hold it alone"],
        ["Senior operations leader", "Founders with Consult for Africa",
         "Role and objectives defined against this report, then recruited. Most of the "
         "gaps above are the work of a senior operator who does not currently exist in "
         "the structure"],
    ], [140, 96, CONTENT_W - 236], small=True))

    el.append(Spacer(1, 12))
    el.append(Spacer(1, 12))
    el.append(Paragraph("28.4  Months 4 to 12: build the institution", H2))
    el.append(Paragraph(
        "The first ninety days stop the bleeding and install the basics. The following "
        "nine months are where Haven stops being a facility that performs well and becomes "
        "an institution that performs reliably.", P))
    el.append(table([
        ["Action", "Owner", "What done looks like"],
        ["Clinical governance committee", "Clinical lead with board",
         "A standing committee with terms of reference, meeting monthly, owning incidents, "
         "audit, training currency and quality improvement, reporting to the board"],
        ["Clinical audit programme", "Clinical lead",
         "A rolling annual audit plan covering documentation, prescribing, infection "
         "prevention, patient identification and neonatal pathways, with findings tracked "
         "to closure"],
        ["Competency framework by role", "Human resources with clinical lead",
         "Defined competencies per role and grade, assessed at induction, at probation "
         "confirmation and annually, feeding progression decisions"],
        ["Grade, band and progression structure", "Founders with human resources",
         "A published structure showing how pay moves and what it moves for, replacing "
         "discretionary adjustment rounds"],
        ["Governance instrument set", "Board",
         "Delegation of authority matrix, committee terms of reference, decision register, "
         "governance calendar and enterprise risk register all live and in use"],
        ["Service line reporting", "Finance with operations",
         "Revenue, direct cost and contribution reported separately for neonatal, "
         "inpatient, outpatient, laboratory and pharmacy, so decisions are made on "
         "contribution rather than on revenue"],
        ["Estate decision executed", "Board",
         "The space option chosen in Section 32 under way, with compliance remediation "
         "already complete"],
        ["Membership and bundled care launched", "Business development with clinical lead",
         "The packaged offer in Section 32.4 live, with enrolment at every clinical touch "
         "point and prepaid cash arriving monthly"],
        ["Second measurement cycle", "Consult for Africa",
         "Both surveys repeated against the baselines in Section 30, with movement "
         "reported to the board"],
    ], [140, 96, CONTENT_W - 236], small=True))

    el.append(Spacer(1, 12))
    el.append(Paragraph("28.5  Two decisions that need the board, not management", H2))
    el.append(Paragraph(
        "Most of the above can be delegated. Two items cannot, because they are the "
        "trade-off itself rather than the execution of it.", P))
    el += bullets([
        "<b>The people investment envelope.</b> Health insurance, pension, training spend "
        "and the reward structure are a single decision with a single number attached. "
        "Management cannot set it, and staff are currently reading the silence as an "
        "answer.",
        "<b>The space decision.</b> Whether Haven expands the current footprint, acquires "
        "adjacent capacity, or constrains growth to fit the building is a capital "
        "decision that determines what every growth plan in the strategy is allowed to "
        "assume.",
    ])

    el.append(PageBreak())

    # ========================================================== SECTION 14 ===
    el.append(PageBreak())

    # ========================================================== SECTION 22 ===
    el.append(Paragraph("29.  Initiative register and sequencing", H1))
    el.append(Paragraph(
        "The recommendations in Section 28 consolidate into twenty-four initiatives. "
        "Attempting them simultaneously is the most common way a programme of this kind "
        "fails. The "
        "register below states effort, dependency and sequence so the board can see what "
        "genuinely has to happen first and what can wait without cost.", P))
    el.append(Spacer(1, 4))
    el.append(table([
        ["#", "Initiative", "Effort", "Depends on", "Wave"],
        ["1", "Board alignment session and operating principles", "Low", "Nothing", "1"],
        ["2", "Clinical incident register", "Low", "Nothing", "1"],
        ["3", "Ward drainage and controlled medicines storage remediation", "Medium",
         "Nothing", "1"],
        ["4", "Resuscitation training schedule and currency register", "Medium", "Nothing",
         "1"],
        ["5", "Departmental objectives, five per department", "Low", "1", "1"],
        ["6", "Staff benefit position decided and communicated", "Board decision", "1", "1"],
        ["7", "Reward process transparency, explain the last round", "Low", "1", "1"],
        ["8", "Structured induction programme", "Medium", "5", "2"],
        ["9", "Retrospective induction for the last twelve months of hires", "Medium", "8",
         "2"],
        ["10", "Performance management cycle", "Medium", "5, 6", "2"],
        ["11", "Human-centred redesign of the eight core procedures", "High", "8", "2"],
        ["12", "Complaints and service recovery framework", "Low", "Nothing", "2"],
        ["13", "Laboratory yield and capacity audit", "Medium", "Nothing", "2"],
        ["14", "Neonatal referral programme and clinical referral pack", "Medium", "1", "2"],
        ["15", "Estate review against a three-year volume plan", "Medium", "1", "2"],
        ["16", "Adherence audit programme", "Medium", "11", "3"],
        ["17", "Retention diagnostic and exit interview standard", "Low", "Nothing", "3"],
        ["18", "Finance review, receivables and working capital", "Medium", "Nothing", "3"],
        ["19", "Continuous patient experience measurement", "Low", "12", "3"],
        ["20", "Referral tracking and conversion measurement", "Medium", "14", "3"],
        ["21", "Clinical briefing rhythm for the commercial team", "Low", "14", "3"],
        ["22", "Senior operations leader recruited", "High", "1, 5", "3"],
        ["23", "Membership and bundled care programme", "High", "13, 14, 19", "4"],
        ["24", "Clinical governance committee and audit programme", "Medium", "2, 22", "4"],
    ], [20, CONTENT_W - 20 - 74 - 74 - 44, 74, 74, 44], align_centre=(0, 2, 4), small=True))
    el.append(Spacer(1, 10))
    el.append(table([
        ["Wave", "Window", "Theme", "Test of completion"],
        ["1", "Days 0 to 30", "Settle the direction, remove the compliance risk",
         "The board has written principles; nothing clinically unsafe is left unaddressed"],
        ["2", "Days 30 to 60", "Build the people system and the commercial instruments",
         "A new joiner can be inducted properly; the neonatal referral conversation can be "
         "held"],
        ["3", "Days 60 to 90", "Measure everything that was built",
         "Adherence, retention, experience and referral yield all have live numbers"],
        ["4", "Months 4 to 12", "Institutionalise",
         "Governance instruments live, service lines reported by contribution, packaged "
         "offer selling"],
    ], [42, 82, 168, CONTENT_W - 292], align_centre=(0,), small=True))
    el.append(Spacer(1, 10))
    el.append(card(
        "<b>The one sequencing rule that matters.</b>&nbsp; Do not start initiative 16, the "
        "adherence audit, before initiative 11, the procedure redesign, and initiative 8, "
        "induction, are complete. Auditing people against standards they were never taught "
        "is how an improvement programme converts goodwill into resentment, and Haven's "
        "goodwill is the asset the whole plan depends on.", bg=CREAM, bold=True))

    el.append(PageBreak())

    # ========================================================== SECTION 23 ===
    el.append(Paragraph("30.  Measurement baseline", H1))
    el.append(Paragraph(
        "This report establishes numbers that did not previously exist. They are recorded "
        "here as a baseline so that progress can be demonstrated rather than asserted, and "
        "so that the next measurement cycle has something honest to compare against.", P))
    el.append(Spacer(1, 4))
    el.append(Paragraph("30.1  Measured today", H2))
    el.append(table([
        ["Measure", "Baseline", "Source", "Target in 6 months"],
        ["Patient experience, mean across all items", f"{P_POS} / 5", "P-01",
         f"Hold at or above {P_POS}"],
        ["Caregivers who would definitely recommend", f"{P_DEFINITELY} of {P_REC_N}",
         "P-01", "Hold above 85 percent"],
        ["Clarity of charges and payments", f"{m(PATIENT, 'q10')} / 5", "P-01", "4.50"],
        ["Knowing what is happening with the child's care", f"{m(PATIENT, 'q6')} / 5",
         "P-01", "4.60"],
        ["Waiting time satisfaction", f"{m(PATIENT, 'q2')} / 5", "P-01", "4.60"],
        ["Staff positive items mean", f"{S_POS} / 5", "S-01", "4.20"],
        ["Staff safety grade, very good or excellent", f"{GRADE_TOP} of {S_N}", "S-01",
         "Hold above 95 percent"],
        ["Pay and reward fairness", f"{m(STAFF, 'q34')} / 5", "S-01", "3.80"],
        ["Resuscitation training currency", f"{m(STAFF, 'q32')} / 5", "S-01",
         "4.50, with a 100 percent currency register"],
        ["Freedom to question authority", f"{m(STAFF, 'q6')} / 5", "S-01", "4.00"],
        ["Blame rather than fix, reverse scored", f"{m(STAFF, 'q12')} / 5", "S-01",
         "Below 2.00"],
        ["Would recommend Haven as a place to work", f"{m(STAFF, 'rec_work')} / 5", "S-01",
         "4.50"],
        ["Staff with more than two years' tenure", f"{TEN_OVER_2Y} of {TEN_N}", "S-01",
         "Rising, with turnover measured"],
        ["Organisational maturity, composite", "2.5 / 5", "This report", "3.5"],
    ], [188, 76, 48, CONTENT_W - 312], align_centre=(1, 2), small=True))

    el.append(Spacer(1, 12))
    el.append(Paragraph("30.2  Not yet measured, and needed", H2))
    el.append(Paragraph(
        "The following have no baseline because Haven does not currently produce them. "
        "Each is a management instrument, not a reporting chore, and the absence of each "
        "is itself a finding.", P))
    el.append(table([
        ["Measure", "Why it is needed", "Owner"],
        ["Staff turnover rate and average tenure", "The multiplier on every people finding "
                                                   "in this report", "Human resources"],
        ["Cost per departure, fully loaded", "Converts the retention argument into a "
                                             "number the board can weigh against benefits "
                                             "cost", "Finance"],
        ["Procedure adherence score by department", "The direct measure of the central "
                                                    "finding", "Operations"],
        ["Clinical incidents reported, by severity", "Cannot improve safety without "
                                                     "counting events", "Clinical lead"],
        ["Neonatal cot occupancy and admissions by referral source",
         "The yield measure for the highest-value asset", "Business development"],
        ["Laboratory reagent yield and cost per reportable result",
         "Where diagnostic margin is won or lost", "Laboratory lead"],
        ["Analyser utilisation against capability", "Whether to sell capacity outward",
         "Laboratory lead"],
        ["Receivables ageing and days sales outstanding",
         "The unresolved working capital question from the outset", "Finance"],
        ["Complaints received, resolved, and time to resolution",
         "Patient experience currently has no failure measure at all", "Customer service"],
        ["Training compliance against the mandatory schedule",
         "Makes training currency visible before it becomes a clinical exposure",
         "Human resources"],
    ], [176, CONTENT_W - 176 - 96, 96], small=True))

    el.append(PageBreak())
    el.append(Paragraph("31.  What good looks like in six months", H1))
    el.append(Paragraph(
        "Stated as observable conditions, not intentions, so that progress can be checked "
        "and not merely asserted.", P))
    el += bullets([
        "Every member of staff can state their five objectives and has had at least two "
        "documented conversations about them.",
        "No one joins Haven without a structured induction, and no one signs off a "
        "procedure they have not been trained on.",
        "Every clinician has a current resuscitation certification, visible on a single "
        "register.",
        "Clinical incidents are logged, trended and reviewed weekly, and the register can "
        "be shown to a regulator, an insurer or a partner without preparation.",
        "The pay and reward structure is written down, and staff can explain how it works "
        "without guessing.",
        "Adherence to the core procedures is measured weekly and the trend is improving "
        "against a stated baseline.",
        "Neonatal admissions are tracked to a named referral source, and the business "
        "development team can hold a clinical referral conversation without a clinician "
        "in the room.",
        "The laboratory reports utilisation, turnaround and cost per reportable result "
        "monthly, and services its analysers on a schedule rather than on failure.",
        "The board has a written statement of its operating principles and management can "
        "point to decisions made under them.",
        "The patient experience survey runs continuously and its score has held at or "
        f"above the {P_POS} baseline established in this report.",
        "Tenure is rising, and the hospital knows why people leave because it asks them.",
    ])
    el.append(Spacer(1, 8))
    el.append(card(
        "None of this changes what Haven is good at. It changes who owns it. Today the "
        "quality of care at Haven belongs to the people currently working there. In six "
        "months it should belong to the institution, so that it survives them.",
        bg=SURFACE, bold=True))

    # ========================================================== SECTION 25 ===
    el.append(PageBreak())
    el.append(Paragraph("32.  Strategic options", H1))
    el.append(Paragraph(
        "A diagnostic that stops at what is broken leaves the board with work rather than "
        "with choices. This section sets out the five decisions Haven actually has to "
        "make, the options under each, and what each option costs, returns and requires. "
        "The options are written to be chosen between, not admired.", LEDE))
    el.append(Spacer(1, 6))
    el.append(card(
        "<b>How to use this section.</b>&nbsp; The five decisions are not independent. "
        "Decision one, the growth axis, is constrained by the estate. Decision three, the "
        "workforce proposition, is what makes decision one deliverable. Decision two, who "
        "runs the hospital, determines whether any of it survives contact with a normal "
        "week. Take them in the order given, and settle decision three before committing "
        "capital to decision one.", bg=SURFACE))

    # ---- 25.1 growth axis
    el.append(Paragraph("32.1  Decision one: where the next naira of revenue comes from", H2))
    el.append(Paragraph(
        "Four routes to growth, in ascending order of capital intensity. They are not "
        "mutually exclusive, but they compete for the same management attention, which is "
        "the scarcer resource.", P))
    el.append(table([
        ["Option", "What it means", "Capital", "Speed", "Ceiling", "Key risk"],
        ["A. Deepen the current site",
         "Fill what already exists: neonatal occupancy through a clinical referral "
         "programme, laboratory utilisation, pharmacy attach, payer mix, receivables "
         "recovery",
         "Very low", "1 to 2 quarters", "Capped by the building",
         "Meets the estate constraint before it meets the demand constraint"],
        ["B. Extend the current site",
         "Acquire or convert adjacent space: more inpatient beds, more clinic rooms, "
         "resolved storage and drainage, lift access",
         "Medium to high", "2 to 4 quarters", "Raises A's ceiling substantially",
         "Capital committed before the management system can absorb the volume"],
        ["C. Second site",
         "A satellite outpatient and day paediatrics unit feeding the hub's neonatal and "
         "inpatient capability",
         "High", "4 quarters plus", "Highest, over years",
         "Duplicates every system weakness in this report at a second address"],
        ["D. Asset-light reach",
         "Extend catchment without consuming the building: remote consultation, school and "
         "corporate contracts, outreach clinics, diagnostics sold outward",
         "Low", "1 to 2 quarters", "Moderate but genuine",
         "Needs digital and commercial discipline Haven has not yet built"],
    ], [80, CONTENT_W - 80 - 54 - 58 - 76 - 100, 54, 58, 76, 100], small=True))
    el.append(Spacer(1, 8))
    el.append(Paragraph(
        "<b>The reading.</b>&nbsp; A and D are available now, need almost no capital, and "
        "are directly supported by findings in this report: the neonatal referral gap at "
        "F-12, the laboratory yield gap at F-11, and the caregiver requests for remote "
        "consultation and electronic results at Section 15. B is the decision the board "
        "should take deliberately within two quarters, informed by the estate review, "
        "because it is what removes A's ceiling. C should not be contemplated until the "
        "composite maturity in Section 24 reaches at least 3.5, because a second site "
        "replicates systems, and Haven's systems are the finding.", P))

    # ---- 25.2 operating model
    el.append(Paragraph("32.2  Decision two: who runs the hospital day to day", H2))
    el.append(table([
        ["Option", "What it means", "Trade-off"],
        ["A. Founder-led, strengthened",
         "Current arrangement, with a stronger middle management layer built underneath",
         "Cheapest and lowest disruption. But it leaves the ask-the-last-owner pattern "
         "intact and consumes owner time that Section 20 says is needed for governance"],
        ["B. Senior operations leader appointed",
         "A senior, experienced hospital operator runs the facility. Owners move to "
         "governance, strategy and capital",
         "The structural answer. Most of the twenty-four initiatives in Section 29 are the "
         "day job of a senior operator who does not currently exist in the structure. Cost "
         "is a real fixed salary, and a poor hire is expensive"],
        ["C. Interim operator, then hire",
         "An experienced interim runs the transformation and the facility for two to three "
         "quarters, then hands to a permanent appointment",
         "Fastest route to capability and lowest hiring risk, because the permanent role is "
         "defined by someone who has done it at Haven. Higher short-run cost, and requires "
         "a genuine handover discipline"],
    ], [110, 172, CONTENT_W - 282], small=True))
    el.append(Spacer(1, 8))
    el.append(Paragraph(
        "<b>The reading.</b>&nbsp; B is the destination and it was already advised early in "
        "the engagement. The practical route is C into B: define the role against this "
        "report, bring in operating capability now so the ninety day plan actually lands, "
        "and recruit permanently into a role whose objectives have been proven rather than "
        "imagined. Whichever is chosen, the appointment should follow the board alignment "
        "session, not precede it, so the operator arrives into a settled mandate.", P))

    # ---- 25.3 workforce
    el.append(Paragraph("32.3  Decision three: the workforce proposition", H2))
    el.append(Paragraph(
        "This is the trade-off Section 20 identifies as unresolved, expressed as three "
        "concrete positions so the board can choose one rather than continue to hold two.",
        P))
    el.append(table([
        ["Option", "The position", "What it costs", "What it buys", "What it risks"],
        ["A. Lean employer",
         "Market-median pay, minimal benefits, hire quickly to replace leavers",
         "Lowest visible payroll cost", "Short-run margin and flexibility",
         "The status quo. Turnover continues, induction cost recurs, specialist capability "
         "never compounds, and the quality asset stays person-dependent"],
        ["B. Credible employer",
         "Market-median pay, core benefits phased in, published structure, funded "
         "development, real recognition",
         "Material but modelled, funded from yield improvement",
         "Retention, the ability to recruit senior clinicians, and a workforce that can "
         "carry the growth plan",
         "Commitments must be honoured. A promised benefit withdrawn is worse than one "
         "never offered"],
        ["C. Premium employer",
         "Above-market pay, full benefits, selective hiring, employer brand as a "
         "differentiator",
         "Highest fixed cost", "Best talent in a competitive Lagos market, lowest turnover",
         "Unaffordable at current yield. Would require the growth in decision one to land "
         "first"],
    ], [88, 128, 92, 108, CONTENT_W - 416], small=True))
    el.append(Spacer(1, 8))
    el.append(Paragraph(
        "<b>The reading.</b>&nbsp; B, phased, and the phasing is what reconciles the two "
        "owner instincts. Publish the structure and explain the last review round "
        "immediately, because those cost nothing. Commit to core benefits with a dated "
        "start, funded explicitly from the yield improvements in decision one, so that the "
        "financially cautious position is respected rather than overridden. Staff have not "
        "asked to be paid at the top of the market. They have asked to be able to see how "
        "the deal works and to be covered when they are ill.", P))

    # ---- 25.4 portfolio and membership
    el.append(PageBreak())
    el.append(Paragraph("32.4  Decision four: the service and revenue portfolio", H2))
    el.append(Paragraph(
        "Haven currently sells episodes. A family arrives when a child is unwell, is "
        "treated well, pays, and leaves. Everything about that model is transactional: "
        "revenue is unpredictable, cash follows the payer's schedule rather than Haven's, "
        "and the relationship with the family has to be won again at every episode.", P))
    el.append(Paragraph(
        "Paediatrics is unusually well suited to a different model, because childhood is "
        "the one part of medicine with a predictable, scheduled, multi-year care calendar. "
        "Immunisation, growth and development monitoring, school health, and the common "
        "chronic conditions of childhood are all known in advance. That is the raw "
        "material for membership and bundled offers, and Haven is not currently monetising "
        "any of it.", P))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>Why this matters beyond revenue.</b>&nbsp; Prepaid membership converts the "
        "working capital problem identified at the outset into its opposite. Today Haven "
        "delivers care and waits for a payer. Under a membership model a proportion of "
        "revenue arrives before the care is delivered. For a facility whose principal "
        "financial complaint is that there is little left after salaries, changing the "
        "direction of the cash cycle is worth more than the margin on the plans "
        "themselves.", bg=CREAM, bold=True))
    el.append(Spacer(1, 8))

    el.append(Paragraph("Membership: the proposition", H3))
    el.append(Paragraph(
        "Sold to families directly, priced annually with a monthly payment option. The "
        "design principle is that families are not buying a quantity of consultations. "
        "They are buying certainty, access and a named relationship with a paediatric "
        "team, which is precisely what the caregiver survey says they already value. The "
        "tiers below are a design, not a price list. The finance review should set the "
        "numbers.", P))
    el.append(table([
        ["Tier", "Who it is for", "What is included", "Why a family buys it"],
        ["Newborn Start",
         "0 to 12 months. Sold at discharge, at first newborn visit, and through maternity "
         "centre partners",
         "The full first-year schedule: newborn checks, complete immunisation course, "
         "growth and development surveillance, feeding and lactation support, a nurse line "
         "for the anxious hours, priority same-day access, discounted consultations",
         "The first year is the most anxious and least predictable period of parenthood. "
         "This is the tier that sells itself, and it is the natural bridge from the "
         "neonatal unit into a lifetime relationship"],
        ["Haven Child Essential",
         "1 to 16 years, one child",
         "Annual wellness review, immunisations at plan rate, a set number of consultations "
         "a year, discounted laboratory and pharmacy, priority booking",
         "Predictable cost for the routine, protection against the unexpected, and no "
         "queueing when it matters"],
        ["Haven Child Plus",
         "1 to 16 years, families who want the full service",
         "Everything in Essential, plus fair-use consultations, remote consultations "
         "included, an annual screening panel, discount on day-case procedures, and a "
         "home-visit allowance",
         "For working parents and families who travel to reach Haven, the remote and "
         "priority elements are the purchase"],
        ["Haven Family",
         "Households with two or more children",
         "Sibling coverage at a reduced rate per additional child, one shared family "
         "record, and a maternal wellness add-on",
         "The economics of a second and third child are what make paediatric membership "
         "compelling to Nigerian families"],
    ], [82, 96, CONTENT_W - 82 - 96 - 156, 156], small=True))

    el.append(Spacer(1, 10))
    el.append(Paragraph("Bundles: episode and pathway offers", H3))
    el.append(Paragraph(
        "Bundles are bought once for a defined purpose, and they are the entry drug for "
        "membership. Each one is a packaged, prepaid pathway with a single visible price "
        "against a visible list of what it would otherwise cost.", P))
    el.append(table([
        ["Bundle", "What is in it", "Strategic purpose"],
        ["Newborn discharge pathway",
         "Structured follow-up after neonatal discharge: review schedule, developmental "
         "surveillance, hearing screening, immunisation catch-up, parent education",
         "Converts the highest-acuity, highest-cost episode into a continuing "
         "relationship. Directly monetises the neonatal unit beyond the admission"],
        ["Immunisation programme",
         "The complete national schedule, prepaid, payable monthly, with reminders and a "
         "digital record",
         "Highest-frequency reason a healthy child attends. Prepayment smooths cash and "
         "the reminder cadence keeps the family engaged"],
        ["School readiness",
         "Pre-school health assessment, vision and hearing screening, immunisation status "
         "certification, and a school-format report",
         "Sold through the school partnerships business development already works. Turns "
         "an existing channel into contracted volume"],
        ["Childhood diagnostics",
         "Common paediatric panels prepaid at a package rate, with results delivered "
         "electronically",
         "Loads the analysers. Directly attacks the reagent cost per result problem in "
         "F-11 by raising batch utilisation"],
        ["Chronic care pathways",
         "Asthma, sickle cell disease and allergy: scheduled reviews, medication supply, "
         "education, and an escalation plan the family understands",
         "High clinical value in this population, and the most predictable recurring "
         "revenue in paediatrics"],
        ["Corporate child health",
         "Employers purchase paediatric cover for staff dependants, billed per employee "
         "per month",
         "Business to business revenue through the corporate outreach already under way, "
         "at far lower acquisition cost per child"],
    ], [104, CONTENT_W - 104 - 168, 168], small=True))

    el.append(Spacer(1, 10))
    el.append(Paragraph("How to make the value visible", H3))
    el.append(Paragraph(
        "Most healthcare membership schemes fail on presentation rather than on economics. "
        "Six rules make the difference, and all six are within Haven's reach now.", P))
    el += bullets([
        "<b>Sell the year, not the visits.</b> Families buy a plan for their child's first "
        "year, not a bundle of twelve consultations. Name the tiers for what they protect, "
        "and describe them as a calendar the family no longer has to remember.",
        "<b>Show the arithmetic.</b> Print the à la carte cost of everything included "
        "beside the plan price. A saving that is asserted is a discount; a saving that is "
        "itemised is a reason to buy.",
        "<b>Lead with access, because access is what they are actually buying.</b> "
        "Same-day appointments for members, a priority line, and a named team. The "
        "caregiver survey already rates ease of access at "
        f"{m(PATIENT, 'q1')}, so this is a promise Haven can credibly make.",
        "<b>Enrol at the clinical moment.</b> At neonatal discharge, at the first "
        "immunisation, at the end of a well-handled acute episode. Enrolment at the point "
        "of relief converts far better than any campaign.",
        "<b>Give the plan a digital front door.</b> Membership record, results access and "
        "remote consultation, all three of which caregivers asked for unprompted in the "
        "survey free text.",
        "<b>Make the family feel chosen, not processed.</b> A welcome pack, the child's "
        "care calendar for the year ahead, and one named contact. This is where a "
        "paediatric brand is actually built, and it costs almost nothing.",
    ])

    el.append(Spacer(1, 10))
    el.append(Paragraph("What has to be modelled before launch", H3))
    el.append(table([
        ["Question", "Why it decides the design"],
        ["Expected utilisation per tier against included entitlement",
         "The single largest determinant of whether a plan is profitable. Set fair-use "
         "limits from real attendance data, not from assumption"],
        ["Contribution per member after clinical, pharmacy and diagnostic cost",
         "Membership must improve contribution, not just revenue. Attach rates on pharmacy "
         "and diagnostics are what make the plans work"],
        ["Capacity impact by tier and by session",
         "Members with priority access consume slots. Section 23 says the building is "
         "already tight, so enrolment has to be capped against real capacity"],
        ["Adverse selection and waiting periods",
         "Families with a sick child will buy the richest tier first. Waiting periods and "
         "clear exclusions, with chronic conditions served by their own pathway bundle, "
         "manage this without being unkind"],
        ["Cash profile: annual prepaid against monthly collection",
         "The working capital benefit is the strategic prize. Price to reward prepayment"],
        ["Regulatory structure",
         "The offer must be structured as prepaid services from the provider, not as risk "
         "transfer, so that it is a care plan rather than an insurance product. Take "
         "specific advice before launch"],
    ], [176, CONTENT_W - 176], small=True))

    # ---- 25.5 funding
    el.append(PageBreak())
    el.append(Paragraph("32.5  Decision five: how it is funded", H2))
    el.append(table([
        ["Option", "What it means", "Suits", "Watch"],
        ["A. Self-funded from operations",
         "Growth paid for out of improved yield: neonatal occupancy, laboratory "
         "utilisation, membership prepayment, receivables recovery",
         "Decision one option A and D, and the workforce commitments in decision three",
         "Slowest for estate. Requires the yield improvements to actually be measured, "
         "which Section 30 shows they currently are not"],
        ["B. Debt against the estate decision",
         "Borrowing to fund the extension in decision one option B",
         "A defined, bounded capital project with a measurable capacity return",
         "Only after the estate review quantifies the return. Debt service against "
         "unmeasured service line contribution is the classic small hospital failure"],
        ["C. Partner or equity capital",
         "External capital for a step change, most plausibly a second site",
         "Decision one option C, and only later",
         "Dilutes control and invites governance scrutiny that Section 20 shows Haven is "
         "not yet ready to withstand. Fix governance before inviting an investor to "
         "inspect it"],
    ], [104, 148, 116, CONTENT_W - 368], small=True))
    el.append(Spacer(1, 8))
    el.append(Paragraph(
        "<b>The reading.</b>&nbsp; A for everything in the first year. B for the estate, "
        "once the review has quantified the return and once service line reporting exists "
        "to service the borrowing honestly. C is a conversation for a later Haven, and the "
        "single best preparation for it is the governance work in Section 20, because that "
        "is what an investor will price.", P))

    # ---- 25.6 matrix
    el.append(Paragraph("32.6  The options side by side", H2))
    el.append(Paragraph(
        "Scored against four criteria that matter at Haven's stage: speed to cash, capital "
        "required, strain on the management system, and whether the constraints identified "
        "in this report currently permit it.", P))
    el.append(table([
        ["Option", "Speed to cash", "Capital", "Management strain", "Constraint check",
         "Verdict"],
        ["1A. Deepen the site", "High", "Very low", "Medium",
         "Permitted now", "Do now"],
        ["1D. Asset-light reach", "Medium", "Low", "Medium",
         "Permitted now, relieves estate", "Do now"],
        ["1B. Extend the site", "Low", "High", "High",
         "Needs estate review and B decision", "Decide in 2 quarters"],
        ["1C. Second site", "Very low", "Very high", "Very high",
         "Blocked by maturity below 3.5", "Not yet"],
        ["2C into 2B. Interim then permanent operator", "Indirect", "Medium", "Reduces it",
         "Permitted now", "Do now"],
        ["3B. Credible employer, phased", "Indirect", "Medium", "Reduces it",
         "Needs board principles first", "Decide in 30 days"],
        ["4. Membership and bundles", "High once live", "Low", "High to design",
         "Needs capacity model and measurement", "Design now, launch in wave 4"],
        ["5A. Self-funded", "n/a", "n/a", "Low", "Permitted now", "Default"],
    ], [116, 62, 50, 74, 106, CONTENT_W - 408], align_centre=(1, 2, 3), small=True))

    # ========================================================== SECTION 26 ===
    el.append(PageBreak())
    el.append(Paragraph("33.  Recommended path and decision calendar", H1))
    el.append(Paragraph(
        "Taking the five decisions together, this is what we would do if it were ours, and "
        "the dates by which each decision needs to be made for the sequence to hold. You "
        "may reach different answers on some of them. The order matters more than our "
        "particular preferences.", LEDE))
    el.append(Spacer(1, 6))
    el.append(Paragraph("33.1  The recommended path in one paragraph", H2))
    el.append(card(
        "Settle the owner trade-off first and write it down. Bring in operating capability "
        "immediately so the ninety day plan lands, and recruit permanently into a proven "
        "role. Commit to being a credible employer, phased and funded explicitly from "
        "yield. Grow first by filling what already exists, the neonatal unit and the "
        "laboratory, and by extending reach without consuming the building. Design the "
        "membership and bundle programme now and launch it once capacity and measurement "
        "can carry it. Decide the estate question within two quarters, on evidence. Fund "
        "everything from operations in year one, and keep the second site conversation "
        "closed until the systems are ready to be copied.", bg=CREAM, bold=True))
    el.append(Spacer(1, 10))
    el.append(Paragraph("33.2  Decision calendar", H2))
    el.append(table([
        ["By when", "Decision", "Who decides", "What it unblocks"],
        ["Within 30 days", "Operating principles and the people investment envelope",
         "Board", "Almost everything. Benefits, training spend, reward structure and the "
                  "operator's mandate all wait on this"],
        ["Within 30 days", "Core benefits position and a dated start",
         "Board", "The loudest staff concern, and the credibility of every other people "
                  "initiative"],
        ["Within 30 days", "Operating model: interim operating capability now, permanent "
                           "role defined",
         "Board", "Delivery of the ninety day plan without consuming owner time"],
        ["Within 60 days", "Commissioning the estate review against a three-year volume "
                           "plan",
         "Board with operations", "The extend-or-not decision, and the sequencing of all "
                                  "physical growth"],
        ["Within 60 days", "Approval of the neonatal referral programme and its clinical "
                           "content",
         "Board with clinical lead", "The highest-yield growth available without capital"],
        ["Within 90 days", "Membership and bundle design approved for build",
         "Board with clinical and commercial leads", "The cash cycle change, and the "
                                                     "diagnostics utilisation case"],
        ["Within 2 quarters", "Extend the site, or hold and optimise",
         "Board", "The ceiling on every physical growth option"],
        ["Within 2 quarters", "Permanent senior operations leader appointed",
         "Board", "The transition from founder-led to systems-led"],
        ["At 12 months", "Second site, considered only if composite maturity is 3.5 or "
                         "above",
         "Board", "Scale, and only when the systems are worth copying"],
    ], [82, 168, 96, CONTENT_W - 346], small=True))
    el.append(Spacer(1, 12))
    el.append(Paragraph("33.3  What we would watch for in the first quarter", H2))
    el.append(Paragraph(
        "Three early signals will tell the board whether the programme is real or "
        "ceremonial, well before any of the measures in Section 30 have had time to move.",
        P))
    el += bullets([
        "<b>Does the incident register have entries?</b> If it is open and empty after a "
        "month, the reporting culture that Section 18 identified as a strength has been "
        "damaged by the act of formalising it, and that needs immediate attention.",
        "<b>Has anyone been told what good looks like?</b> Ask three members of staff at "
        "random what their objectives are. If they cannot answer by day sixty, the "
        "performance work has not started, whatever the plan says.",
        "<b>Did the benefits decision get communicated, or only made?</b> A decision the "
        "staff have not heard is worth nothing to retention, which is the entire reason "
        "for taking it.",
    ])
    el.append(Spacer(1, 10))
    el.append(card(
        "Haven asked for a diagnostic and is receiving one. But the more useful output of "
        "this work is the position it puts the board in: a facility whose patients and "
        "staff both rate it well, whose problems are systemic rather than clinical, and "
        "whose principal constraints are all things that can be built. That is a strong "
        "hand. What it now needs is a decision about how to play it, and the calendar "
        "above is our recommendation for when to take each one.", bg=SURFACE))

    # ========================================================== APPENDIX A ===
    el.append(PageBreak())
    el.append(Paragraph("APPENDIX A", EYEBROW))
    el.append(Paragraph("Documentary findings register", H1))
    el.append(Paragraph(
        "The findings below arise from the review of the thirty-four operational, financial "
        "and policy documents supplied by the operations team. They are grouped by theme "
        "rather than listed in the order they were discovered, and each carries its "
        "severity and the quantified exposure where one can be calculated. Findings "
        "arising from the interviews and surveys are set out in Section 8.", P))
    el.append(Spacer(1, 8))

    _fr = [
        ("Regulatory standing", [
            ("D-01", "Operations reporting records the facility as still running as a "
                     "clinic and registration as not obtained, in every month January to "
                     "April 2026. Management has since confirmed registration was in fact "
                     "held. Both statements were removed from May onward with no correction "
                     "recorded",
             "High", "Four months of board reporting misstated the facility's own "
                     "regulatory standing"),
            ("D-02", "Health insurance scheme registration recorded as not obtained across "
                     "the same period and not separately confirmed. The business "
                     "development report asserts completed registration and licensing, "
                     "directly contradicting the operations reporting alongside it",
             "High", "Position unconfirmed; two functions reported opposite facts"),
            ("D-03", "Referral rebates of 7.5 to 10 percent recorded against 21 referring "
                     "facilities, including differentiated rates for clinical and "
                     "administrative staff at one hospital, with a staff referral "
                     "commission structure separately proposed to the board",
             "Critical", "Professional conduct exposure. No evidence any rebate has been "
                         "paid, which is the first thing to establish"),
        ]),
        ("Clinical establishment and safety", [
            ("D-04", "Four registered nurses covered the half year. The half-year report "
                     "describes six; the fifth and sixth started 14 and 15 July",
             "Critical", "Establishment misstated to the board"),
            ("D-05", "Eight days in July covered by two people across a full 24 hours, "
                     "four of them by one registered nurse and a pharmacy technician who "
                     "is simultaneously rostered to the pharmacy on three",
             "Critical", "Ward, emergency room, neonatal unit and triage"),
            ("D-06", "Three medical officers cover all 31 days of July on a strict "
                     "three-day rotation with no rest day, no leave cover and no relief "
                     "named. A consultant rota operates but was not supplied, so consultant "
                     "cover and the escalation points named in the billing policy could not "
                     "be tested against it",
             "High", "Continuity of medical officer cover; consultant cover unverified"),
            ("D-07", "No pharmacist is rostered on any day. Prescription verification and "
                     "paediatric weight-based dose checking are performed by technicians",
             "Critical", "Scope of practice and dosing safety"),
            ("D-08", "No cold chain temperature log exists for any period, against "
                     "N5,313,232 of vaccination revenue across seven months",
             "Critical", "Safety, and retrospective claim rejection risk"),
            ("D-09", "The 30KVA generator is recorded as down in every monthly report "
                     "January to June and as operational in July, with no repair or cost "
                     "recorded. Neonatal care, oxygen and phototherapy ran on a 9KVA "
                     "backup",
             "Critical", "Power resilience for ventilated neonates"),
            ("D-10", "The laboratory is covered by one scientist for 72 consecutive hours "
                     "in three-day blocks. Before 16 April 2026 it had one scientist in "
                     "total",
             "Critical", "Single point of failure on diagnostics"),
            ("D-11", "No automated backup of the clinical record system operated through "
                     "the half year. It is the record for both clinical care and billing",
             "Critical", "Total loss exposure"),
            ("D-12", "The nursing procedure mandates an oxygen concentrator as first line. "
                     "No concentrator appears in any asset record",
             "Critical", "First-line oxygen device unavailable as specified"),
        ]),
        ("Laboratory and transfusion", [
            ("D-13", "No crossmatch method and no antibody screening procedure exist, in a "
                     "document titled to include crossmatch which requires a crossmatch "
                     "release form on every unit issued. Transfusions are performed and "
                     "billed",
             "Critical", "Transfusion reaction risk"),
            ("D-14", "No critical value reporting procedure, no paediatric age-banded "
                     "reference ranges, no quality control acceptance criteria, no external "
                     "quality assessment, no calibration schedule, no competency "
                     "assessment. Two referenced procedures do not exist",
             "Critical", "Misreported neonatal results"),
            ("D-15", "The transfusion procedure requires billing approval before any "
                     "transfusion-related action including contacting the blood bank. The "
                     "emergency exception sits four pages later with no cross-reference",
             "Critical", "Delay to emergency transfusion"),
            ("D-16", "The nursing procedure sets out a transfusion procedure then states "
                     "nurses should not administer transfusions, and directs consent to be "
                     "taken from the doctor or laboratory scientist rather than the parent",
             "Critical", "Unusable in incident review; consent taken from the wrong party"),
            ("D-17", "Sample storage conditions are not clinically safe as written. Urine "
                     "at 20 degrees for one day; whole blood specified across a sixteen "
                     "degree range",
             "High", "Specimen integrity"),
        ]),
        ("Revenue record integrity", [
            ("D-18", "The revenue spreadsheets are nursing handover documents. The nursing "
                     "procedure instructs nurses to bill opened medications from memory at "
                     "the end of shift and to complete the sheets before handover, with "
                     "the obligation passing to the next shift",
             "Critical", "Mechanism behind every data finding below"),
            ("D-19", "June 2026 insured billing is entirely absent. No insured sheet exists "
                     "for the month",
             "Critical", "N7,510,645 claimed, corroborated by N2,097,155 of unbilled June "
                         "pharmacy dispensing"),
            ("D-20", "The largest single episode of the period appears in the sales record "
                     "as a deposit only. The service revenue appears once in a weekly "
                     "management report and is excluded from that report's own total",
             "Critical", "N4,000,000"),
            ("D-21", "80.9 percent of the tariff is priced at zero, including 85.8 percent "
                     "of drugs and 81.1 percent of laboratory tests. Consultation is "
                     "defined six ways and billed at twelve different values",
             "Critical", "No basis exists on which any charge can be tested as correct"),
            ("D-22", "Monthly total rows are hardcoded values rather than formulas, so rows "
                     "entered after the total was struck are silently excluded",
             "High", "N1,394,020 April private, N225,893 May insured"),
            ("D-23", "Pharmacy stock fails to roll forward in every month tested, with the "
                     "physical count written into the ledger rather than reconciled against "
                     "it. January has no stock report and February opens at zero",
             "Critical", "N562,272 net across four months; N589,246 in May alone"),
            ("D-24", "A further N322,653 unexplained between the 30 June closing stock and "
                     "the 6 July opening stock, with no record covering the intervening "
                     "days", "High", "N322,653"),
            ("D-25", "The insured revenue officer role, to which the billing policy assigns "
                     "every gate including the mandatory daily claims audit, does not exist "
                     "in the establishment",
             "Critical", "Direct cause of the missing month and the uncollected balance"),
            ("D-26", "Cumulative collection shortfall of N6,967,751 since May 2025, being "
                     "11.4 percent of everything claimed. No rejection reason is captured "
                     "anywhere, so no root cause analysis is possible",
             "High", "N6,967,751"),
            ("D-27", "Receivables of N6,472,006 outstanding, of which N399,253 sits beyond "
                     "sixty days. Two entries in the ageing schedule are not payers",
             "High", "N399,253 likely irrecoverable"),
            ("D-28", "Two payers account for 72.1 percent of insured revenue and 71.3 "
                     "percent of insured encounters",
             "High", "Roughly a quarter of total revenue on either relationship"),
        ]),
        ("Management reporting", [
            ("D-29", "Private revenue reported to the board is misallocated between months. "
                     "January overstated by N8,001,630, March understated by N7,866,931, "
                     "while the half-year total is accurate to 0.14 percent and June "
                     "reconciles exactly",
             "Critical", "N8,001,630 moved between periods"),
            ("D-30", "N6,395,450 of neonatal revenue reported in January, a month whose "
                     "entire private revenue across all lines was N4,696,654 and which "
                     "contains no neonatal, deposit or matching accommodation revenue",
             "Critical", "N6,395,450"),
            ("D-31", "N3,000,000 of neonatal revenue reported in April. No such entry "
                     "exists in April. A N3,000,000 deposit exists dated 7 July for the "
                     "episode already N4,000,000 short",
             "Critical", "N3,000,000"),
            ("D-32", "Insured revenue reported to the board exceeds claims actually "
                     "submitted by N386,887. The February and May variances each trace to a "
                     "single payer to the naira",
             "Critical", "N386,887"),
            ("D-33", "Two payers, together N268,081, are absent from the board's view of "
                     "January insured revenue", "High", "N268,081"),
            ("D-34", "Laboratory revenue reported as an identical figure in March and "
                     "April, matching neither month, carried through two board cycles and "
                     "into the half-year report",
             "High", "N801,500 March, N267,820 April"),
            ("D-35", "The half-year revenue matrix does not sum to its own stated totals in "
                     "March or April. April insured revenue appears at four different "
                     "values across the same document set",
             "High", "N404,000 and a N200,000 spread"),
            ("D-36", "The most recent weekly report gives three different encounter totals "
                     "for the same week, omits the largest outstanding payer, reports paid "
                     "claims as outstanding, and states rejections as nil against recorded "
                     "rejections", "Critical", "Reliability of current reporting"),
            ("D-37", "The operations lead reported the first neonatal admission on 13 July "
                     "2026, having previously reported January and April neonatal revenue, "
                     "a March neonatal claim paid by an insurer, and eight preterm "
                     "discharges", "Critical", "Requires the neonatal register to resolve"),
            ("D-38", "Every quantified claim in the half-year executive presentation is "
                     "unsupported by an underlying record, and the minimum monthly revenue "
                     "claim is contradicted by the transaction data in five of seven months",
             "High", "Board reporting integrity"),
            ("D-39", "The preparer's own salary review request appears within the board "
                     "management report, in the same decisions section that escalates the "
                     "referral commission structure",
             "High", "Conflict within the reporting line"),
        ]),
        ("Policy and document control", [
            ("D-40", "Of six procedure documents, only the two nursing documents carry "
                     "chief medical director approval, and both are past review date. The "
                     "pharmacy procedure governing controlled drugs has no named approver. "
                     "The customer service procedure has no version, date or approver",
             "High", "No effective document control"),
            ("D-41", "Two undated, unversioned documents govern insured billing and they "
                     "disagree materially, including on whether ambulatory care is "
                     "permitted for insured patients at all",
             "High", "Read literally, one directs admission of every insured enrollee"),
            ("D-42", "The billing policy requires a witness at financial discussions with "
                     "parents. One customer service officer is rostered at a time, so the "
                     "control cannot operate. No completed top-up form exists in the set",
             "High", "Control designed against an establishment that cannot run it"),
            ("D-43", "Patient-identifiable data is routed through a consumer messaging "
                     "application by design across four separate procedures",
             "High", "Data protection exposure; referral record cannot be reconstructed"),
            ("D-44", "A fourteen day validity period attached to the consultation fee "
                     "appears only in an undated, unapproved procedure and in no tariff or "
                     "billing policy", "High", "Material revenue policy with no governance"),
            ("D-45", "The operating model document covers waste disposal, leave, appraisal "
                     "and recruitment only. It contains no clinical governance, infection "
                     "prevention, incident reporting, drug management or neonatal protocol",
             "High", "Governance gap"),
            ("D-46", "No controlled drugs register, narcotics requisition file or authority "
                     "documentation was provided, against a procedure that requires all "
                     "three", "High", "Controlled medicines governance"),
        ]),
        ("Commercial and pricing", [
            ("D-47", "Specialist consultations appear as no distinct billing line. 119 "
                     "encounters across six months and thirteen consultant relationships, "
                     "with the two lead promoted specialisms delivering one encounter and "
                     "none respectively",
             "High", "Approximately N4.2M half-year contribution, unmeasurable by service"),
            ("D-48", "One specialist line retains 16.7 percent, below the facility's own "
                     "margin floor for medicines. Two consultants are paid different rates "
                     "for the same service at the same patient price. One specialist price "
                     "conflicts between the tariff and the fee schedule",
             "Medium", "Margin leakage on specialist clinics"),
            ("D-49", "Registration is billed on approximately 212 of 1,399 encounters and "
                     "never to an insured enrollee, against a policy requiring disclosure "
                     "at every private arrival",
             "Medium", "Estimated N2M to N4M under-billed if the policy is universal"),
            ("D-50", "Insured nursing care revenue of N103,000 across seven months against "
                     "N2,213,893 of insured accommodation revenue. Insured inpatients are "
                     "on a separate floor and their nursing is not being captured",
             "Medium", "Unbilled service"),
        ]),
    ]
    for group, rows in _fr:
        el.append(Paragraph(group.upper(), EYEBROW))
        el.append(Spacer(1, 3))
        el.append(table(
            [["Ref", "Finding", "Severity", "Exposure or consequence"]] +
            [[r[0], r[1], r[2], r[3]] for r in rows],
            [32, CONTENT_W - 32 - 52 - 132, 52, 132], align_centre=(2,), small=True))
        el.append(Spacer(1, 12))
    el.append(card(
        "<b>On severity.</b>&nbsp; Critical here means the finding carries either a patient "
        "safety consequence, a regulatory consequence, or a consequence for the reliability "
        "of the numbers the board governs by. It does not imply that harm has occurred, and "
        "nothing in this register should be read as a conclusion about any individual's "
        "conduct. Several findings would close entirely on production of a single document, "
        "which is why Appendix E lists those documents precisely.", bg=SURFACE))

    # ========================================================== APPENDIX B ===
    el.append(PageBreak())
    el.append(Paragraph("APPENDIX B", EYEBROW))
    el.append(Paragraph("Staff safety and culture survey: full results", H1))
    el.append(Paragraph(
        f"{S_N} anonymous responses, {S_FROM} to {S_TO}. Scale items run from 1, strongly "
        "disagree or never, to 5, strongly agree or always. Items marked (rev) are "
        "negatively worded, so a lower score is the good result, and they are excluded "
        "from the positive items average. N/A responses are excluded from the mean; n is "
        "the number of scored answers per item. Colour is set on the corrected direction "
        "for each item.", SMALL))
    el.append(Spacer(1, 8))
    el.append(survey_table(STAFF))
    el.append(Spacer(1, 12))
    el.append(Paragraph("Respondent profile", H2))
    _prof = []
    for c in STAFF["categorical"]:
        rows = [[c["label"], "Responses"]]
        for opt in c["options"]:
            n = c["counts"].get(opt, 0)
            rows.append([opt.replace("\u2013", " to "), str(n)])
        _prof.append(table(rows, [CONTENT_W - 90, 90], align_centre=(1,), small=True))
    for t in _prof:
        el.append(t)
        el.append(Spacer(1, 8))
    el.append(Paragraph(
        "Area and tenure were optional. Tenure is the material result: no respondent has "
        "been at Haven for more than two years.", SMALL))

    # ========================================================== APPENDIX B ===
    el.append(PageBreak())
    el.append(Paragraph("APPENDIX C", EYEBROW))
    el.append(Paragraph("Patient and caregiver experience survey: full results", H1))
    el.append(Paragraph(
        f"{P_N} anonymous responses, {P_FROM} to {P_TO}. All items are positively worded, "
        "so a higher score is the good result on every line.", SMALL))
    el.append(Spacer(1, 8))
    el.append(survey_table(PATIENT, note_reverse=False))
    el.append(Spacer(1, 12))
    el.append(Paragraph("Overall ratings", H2))
    for c in PATIENT["categorical"]:
        rows = [[c["label"], "Responses"]]
        for opt in c["options"]:
            rows.append([opt.replace("\u2013", " to "), str(c["counts"].get(opt, 0))])
        el.append(table(rows, [CONTENT_W - 90, 90], align_centre=(1,), small=True))
        el.append(Spacer(1, 8))

    # ========================================================== APPENDIX C ===
    el.append(PageBreak())
    el.append(Paragraph("APPENDIX D", EYEBROW))
    el.append(Paragraph("Evidence register", H1))
    el.append(Paragraph(
        "Every finding in this report is traceable to the sources below. Codes carried "
        "forward from the opening review retain their original references.", P))
    el.append(Spacer(1, 6))
    el.append(Paragraph("Interview evidence", H2))
    el.append(table([
        ["Code", "Source", "Status"],
        ["I-01", "Founder interview, founder 1", "Complete"],
        ["I-02", "Founder interview, founder 2", "Complete"],
        ["I-03", "Head of Operations interview", "Complete"],
        ["I-07", "Nursing, field validation, three interviews", "Complete"],
        ["I-08", "Billing and cash office, field validation", "Complete"],
        ["I-09", "Pharmacy, field validation", "Complete"],
        ["I-10", "Front desk, field validation", "Complete"],
        ["I-11", "Laboratory, field validation", "Complete"],
        ["I-12", "Administration, field validation", "Complete"],
        ["I-13", "Business development, field validation", "Complete"],
        ["I-14", "Doctors, field validation", "Complete"],
        ["I-15", "Informal patient and caregiver interviews on site", "Complete"],
        ["I-04", "Head of Finance interview", "Outstanding"],
        ["I-16", "Human resources interview and records review", "Outstanding"],
    ], [46, CONTENT_W - 46 - 92, 92], align_centre=(2,), small=True))
    el.append(Spacer(1, 10))
    el.append(Paragraph("Survey evidence", H2))
    el.append(table([
        ["Code", "Source", "Responses", "Period"],
        ["S-01", "Staff safety and culture survey, anonymous", str(S_N),
         f"{S_FROM} to {S_TO}"],
        ["P-01", "Patient and caregiver experience survey, anonymous", str(P_N),
         f"{P_FROM} to {P_TO}"],
    ], [46, CONTENT_W - 46 - 76 - 150, 76, 150], align_centre=(2,), small=True))
    el.append(Spacer(1, 10))
    el.append(Paragraph("Documentary and observation evidence", H2))
    el.append(table([
        ["Code", "Source"],
        ["D-01 to D-09", "Organogram, management report template, nursing, pharmacy, "
                         "laboratory, HMO and customer service procedures, operational "
                         "performance reports, departmental duty rosters"],
        ["D-10", "Strategy and marketing workshop minutes"],
        ["D-11", "Founder alignment meeting minutes"],
        ["O-01", "Site observation, housekeeping, waste management and physical estate"],
        ["O-02", "Site observation, executive involvement in routine operations"],
        ["O-03", "Site observation, operational coordination"],
        ["T-01", "Operational walkthrough, patient journey end to end, 4 August 2026"],
    ], [90, CONTENT_W - 90], small=True))

    # ========================================================== APPENDIX D ===
    el.append(PageBreak())
    el.append(Paragraph("APPENDIX E", EYEBROW))
    el.append(Paragraph("Department by department summary", H1))
    el.append(Paragraph(
        "The field validation visit assessed each department against documented process, "
        "actual practice, and the department's own account of what helps and hinders it. "
        "This appendix records the departmental picture in full, since much of it does not "
        "surface in the thematic findings.", P))
    el.append(Spacer(1, 6))

    _depts = [
        ("Nursing",
         ["Rotating shift pattern of a 24 hour shift, 48 hours off, a 36 hour shift, then "
          "48 hours off. The patient journey is clearly understood: front desk, nursing "
          "assessment and vital signs, then medical consultation.",
          "Absence is covered internally by permanent nursing staff, coordinated by the "
          "head nurse. Locum use is rare, and one nurse reported never having worked "
          "alongside one."],
         ["Stable internal shift cover with minimal dependence on temporary staff",
          "Willingness to report error openly, evidenced by a medication error raised "
          "directly with the head nurse and resolved appropriately",
          "Clear shared understanding of the patient pathway"],
         ["Two of three nurses had never received formal training on the procedures",
          "Supervision is informal and feedback is corrective rather than developmental",
          "Incomplete handovers named as a recurring source of error",
          "No key performance indicators, targets or appraisal. Staff were asked to write "
          "their own indicators",
          "Psychological safety is inconsistent between individuals"]),
        ("Front desk",
         ["Patients are categorised as covered or self-paying, entered into the clinical "
          "record system before referral to nursing, and consultation fees are "
          "communicated upfront.",
          "Complaints are said to be documented and reviewed weekly with the operations "
          "lead."],
         ["Clear understanding of patient flow and no administrative bottleneck observed "
          "at reception",
          "Fees communicated before service, which supports the fair billing perception in "
          "the caregiver survey"],
         ["Delays occur waiting for doctors and waiting for medication, neither of which "
          "originates at reception",
          "No formal complaints register evidenced, so complaint volume, resolution time "
          "and themes cannot be reported"]),
        ("Billing and cash office",
         ["After-service billing. The clinical record system generates the bill "
          "automatically from consultations, medicines administered and investigations "
          "ordered, which removes manual assembly.",
          "Eligibility is verified before treatment, and items outside cover are taken up "
          "directly with the provider."],
         ["Largely automated, with effective integration between clinical care and finance",
          "Approvals reported at approximately 95 percent without issue",
          "Few billing errors. A documented overpayment was refunded within three to five "
          "working days"],
         ["Delays, where they occur, come from pending approvals or medicine availability "
          "rather than from billing itself",
          "Receivables ageing, denial management and collection performance were not "
          "available for review and remain the open question"]),
        ("Pharmacy",
         ["Monthly physical stock counts. Purchasing is driven by consumption and sales "
          "trends. Weekly procurement cycles keep shortages rare.",
          "Medicines approaching expiry are listed and circulated to prescribers six to "
          "seven months ahead so stock is used rather than written off. Expired stock is "
          "removed and disposed of."],
         ["The most mature operational department in the facility and the internal "
          "benchmark for the others",
          "Proactive expiry management that protects both margin and safety",
          "Controlled drugs are stored separately"],
         ["Storage capacity for controlled medicines is insufficient and will become a "
          "compliance exposure as volume grows",
          "The pharmacy lead approves their own procurement requests, which is a "
          "segregation of duties gap rather than a conduct concern"]),
        ("Laboratory",
         ["Samples are received, prioritised by urgency and turnaround requirement, "
          "processed, and uploaded to the clinical record for electronic access by "
          "clinicians.",
          "Accuracy is validated by comparing selected results against an external "
          "reference laboratory. Reagent levels are monitored weekly and expired reagents "
          "discarded."],
         ["Structured workflow with results available to clinicians electronically",
          "External reference comparison is genuine good practice for a facility of this "
          "size",
          "Regular calibration"],
         ["No audit of performance, capacity utilisation or reagent yield. Cost per "
          "reportable result is unknown",
          "Servicing is reactive rather than planned. When equipment faults, samples are "
          "referred out at unquantified cost and turnaround penalty",
          "No formal appraisal for laboratory staff"]),
        ("Administration",
         ["Most organisational communication runs through informal messaging. Management "
          "meetings are weekly; general staff meetings are rare, estimated at two in the "
          "year.",
          "Escalation runs from department lead to the operations lead, to the managing "
          "director, to the founders, and the path is understood across departments."],
         ["The escalation structure is understood and used, which is a genuine governance "
          "strength for an organisation of this age"],
         ["Salary adjustment is the most significant staff concern. Increases of roughly "
          "75 percent for some and about 25 percent later for others, with tax reducing "
          "the perceived gain, were widely read as inequitable",
          "General staff communication is infrequent, so organisational messages arrive "
          "through informal channels",
          "Multiple respondents said Haven does not consistently operate an open door "
          "culture"]),
        ("Business development",
         ["Activity focuses on schools, faith organisations, maternity centres and "
          "referral partnerships, pursued through proposals, follow-up, calls and physical "
          "visits.",
          "Networking and direct outreach are identified as the most effective channels. "
          "Effectiveness is measured through patient footfall and occupancy, including the "
          "neonatal unit."],
         ["Genuine outreach effort across multiple credible channels",
          "The team identified its own need for better prospecting and sales tooling, "
          "which is an accurate self-assessment"],
         ["The neonatal unit, the highest-yield asset, is not the focus of the effort",
          "Core healthcare domain gaps limit the team's ability to hold a clinical "
          "referral conversation with paediatricians, obstetricians and maternity centres",
          "No referral source tracking or conversion measurement, so effort cannot be "
          "judged by result"]),
        ("Medical staff",
         ["Clinical operations are described as organised and patient-centred. "
          "Communication with nursing runs through intercom, messaging and face to face "
          "contact, and breakdowns are reported as uncommon.",
          "Clinical procedures are available."],
         ["Coherent clinical operation with effective interprofessional communication",
          "Incidents are reported and escalated promptly"],
         ["No formal documentation process for recording clinical incidents, which is the "
          "most significant governance gap identified",
          "Doctors asked directly for more frequent clinical training and structured "
          "skills development",
          "Requests for increased clinical investigation where appropriate, which "
          "intersects with the laboratory utilisation finding"]),
        ("Patients and caregivers",
         ["Informal interviews on site during the validation visit, corroborated by the "
          "anonymous experience survey."],
         ["Positive overall experience, fair billing, minimal waiting, and good "
          "communication",
          "High stated likelihood of returning and of recommending Haven to others"],
         ["Requests for remote consultation for families who travel long distances",
          "Requests for electronic access to results",
          "Clarity on the cost of medicines billed to health plans",
          "A request for additional doctors on site"]),
    ]
    for name, context, strengths, gaps in _depts:
        block = [Paragraph(name, style("dh", fontSize=11, fontName="Helvetica-Bold",
                                       textColor=NAVY, leading=14, spaceAfter=4))]
        for c in context:
            block.append(Paragraph(c, P))
        block.append(Paragraph("What is working", style("dsh", fontSize=7.4,
                                                        fontName="Helvetica-Bold",
                                                        textColor=GOOD, leading=11,
                                                        spaceAfter=3)))
        block += bullets(strengths, st=style("db", fontSize=9, leading=12.5, spaceAfter=2))
        block.append(Spacer(1, 4))
        block.append(Paragraph("What is missing", style("dgh", fontSize=7.4,
                                                        fontName="Helvetica-Bold",
                                                        textColor=BAD, leading=11,
                                                        spaceAfter=3)))
        block += bullets(gaps, st=style("dg", fontSize=9, leading=12.5, spaceAfter=2))
        block.append(Spacer(1, 12))
        el.append(KeepTogether(block))

    # ========================================================== APPENDIX E ===
    el.append(PageBreak())
    el.append(Paragraph("APPENDIX F", EYEBROW))
    el.append(Paragraph("Glossary", H1))
    el.append(table([
        ["Term", "Meaning as used in this report"],
        ["Adherence", "Whether a documented process is actually followed in practice, as "
                      "distinct from whether it exists"],
        ["Attach rate", "The proportion of clinical encounters that also generate pharmacy "
                        "or diagnostic revenue"],
        ["Confirmed finding", "An observation supported by at least two independent "
                              "evidence sources"],
        ["Contribution", "Revenue less the direct cost of delivering it, before overhead. "
                         "The figure that should drive service line decisions"],
        ["Control design", "Whether an appropriate control exists and is well constructed"],
        ["COSO", "The internal control framework used as the governance lens for this "
                 "review, covering control environment, risk assessment, control "
                 "activities, information and communication, and monitoring"],
        ["Days sales outstanding", "The average number of days between delivering care and "
                                   "being paid for it"],
        ["Just culture", "A response to error that examines the system before the "
                         "individual, so that reporting remains safe"],
        ["Maturity level", "Position on the five-level scale set out in Section 4, from "
                           "Initial to Optimised"],
        ["Operating effectiveness", "Whether a control that exists is consistently applied "
                                    "in practice"],
        ["Reagent yield", "The number of reportable results actually produced by a reagent "
                          "pack against the number it should produce"],
        ["Reverse-worded item", "A survey question written negatively, where a lower score "
                                "is the good result"],
        ["Service line", "A distinct clinical or commercial activity reported separately, "
                         "such as neonatal, laboratory or pharmacy"],
        ["Working capital", "Cash tied up in stock and in amounts owed by payers, and "
                            "therefore unavailable to run the business"],
    ], [130, CONTENT_W - 130], small=True))

    el.append(Spacer(1, 16))
    el.append(Paragraph("Basis of preparation", H2))
    el.append(Paragraph(
        "This report is an organisational diagnostic, not a statutory financial audit and "
        "not an assurance opinion. Findings are classified Confirmed where supported by at "
        "least two independent evidence sources, and are otherwise stated as indicative "
        "with the validation required. Where evidence was not available, the position is "
        "recorded as outstanding rather than inferred. Survey figures reflect responses "
        f"received as at {S_TO} for staff and {P_TO} for patients and caregivers, and are "
        "reproduced without adjustment.", SMALL))

    el.append(PageBreak())
    el.append(Paragraph("CLOSING", EYEBROW))
    el.append(Paragraph("Where this leaves you", H1))
    el.append(Paragraph(
        "Haven is fifteen months old and already delivers care that families trust and "
        "that staff will defend anonymously. That is the hard part and it is done.", LEDE))
    el.append(Paragraph(
        "What is not built is the machinery behind it. The induction that carries the "
        "standard to the next nurse. The record that proves what was done. The rota that "
        "means the standard does not depend on who is on shift. The measurement that tells "
        "you before a family does.", P))
    el.append(Paragraph(
        "None of that requires capital you do not have or talent you cannot hire. Most of "
        "the first ninety days is decisions, documents and discipline.", P))
    el.append(Paragraph(
        "Settle the three questions at the front first. Then build the people system, "
        "because it multiplies everything else. Then grow, into a building and a workforce "
        "that can carry it.", P))

    el.append(Spacer(1, 14))
    el.append(card(
        "<b>Consult for Africa</b> &nbsp; Healthcare transformation partner<br/>"
        "hello@consultforafrica.com &nbsp; / &nbsp; +234 913 813 8553 &nbsp; / &nbsp; "
        "consultforafrica.com<br/>Lagos and Abuja, Nigeria",
        bg=NAVY, fg=white))

    doc.build(el)
    print(f"wrote {OUT.relative_to(ROOT)}  ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    build()
