"""
Build the printable Osteon Clinics survey instruments and the two QR posters.

    npx tsx scripts/export-osteon-surveys.ts     # refresh the question set first
    python3 scripts/build-osteon-surveys.py

The question set comes from docs/data/osteon-surveys.json, exported from
lib/osteon-survey.ts, which mirrors the live forms in public/. Nothing here
retypes a question, so the paper and the web instrument cannot diverge.

Outputs, all under docs/osteon/:
  osteon-staff-survey-cfa.pdf         paper instrument, also the client's copy
  osteon-patient-survey-cfa.pdf       paper instrument for the waiting room
  osteon-referrer-survey-cfa.pdf      what referring colleagues are asked
  osteon-leadership-survey-cfa.pdf    what the leadership group is asked
  osteon-staff-survey-poster-cfa.pdf  A4 QR poster for the staff room
  osteon-patient-survey-poster-cfa.pdf A4 QR poster for the waiting room
  osteon-*-qr.png                      the QR codes themselves
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import qrcode
from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas as pdfcanvas
from reportlab.platypus import (
    BaseDocTemplate, CondPageBreak, Frame, KeepTogether, NextPageTemplate,
    PageBreak, PageTemplate, Paragraph, Spacer, Table, TableStyle,
)

sys.path.insert(0, str(Path(__file__).resolve().parent))
from osteon_doc import (  # noqa: E402
    AVAIL, BODY, CELL, DOCS, GOLD, H1, H2, LIGHT, MARGIN, MUTED, NAVY, P,
    PAGE_H, PAGE_W, SMALL, SURFACE, inline, make_page_furniture,
)

OUT = DOCS / "osteon"
DATA = DOCS / "data" / "osteon-surveys.json"
BASE_URL = "https://www.consultforafrica.com"

AGREE = ["Strongly\ndisagree", "Disagree", "Neither", "Agree", "Strongly\nagree"]
FREQ = ["Never", "Rarely", "Sometimes", "Most times", "Always"]

QNUM = ParagraphStyle("qnum", parent=P, fontName="Helvetica-Bold", textColor=NAVY, spaceAfter=3)
QTEXT = ParagraphStyle("qtext", parent=P, spaceAfter=3)
OPTLAB = ParagraphStyle("optlab", fontName="Helvetica", fontSize=7.2, leading=8.6,
                        textColor=MUTED, alignment=1)
BOXNUM = ParagraphStyle("boxnum", fontName="Helvetica-Bold", fontSize=10, leading=12,
                        textColor=NAVY, alignment=1)

META = {
    "osteon-staff-culture": dict(
        stem="osteon-staff-survey-cfa",
        cover="Staff Survey",
        header="Osteon Clinics  /  Staff Survey",
        minutes="about 10 minutes",
    ),
    "osteon-patient-experience": dict(
        stem="osteon-patient-survey-cfa",
        cover="Your Experience",
        header="Osteon Clinics  /  Patient Survey",
        minutes="about 5 minutes",
    ),
    "osteon-referrer": dict(
        stem="osteon-referrer-survey-cfa",
        cover="What Colleagues Need From an Orthopaedic Service",
        header="Osteon Clinics  /  Referring Doctors",
        minutes="about 6 minutes",
    ),
    "osteon-leadership-direction": dict(
        stem="osteon-leadership-survey-cfa",
        cover="Where Should This Business Go?",
        header="Osteon Clinics  /  Leadership Direction",
        minutes="about 10 minutes",
    ),
}

FOOTER = "Confidential  /  Consult for Africa  /  Osteon Clinics organisational audit"


# ── small flowable builders ──────────────────────────────────────────────────

# Helvetica has no ballot-box glyph, so every tick box on these forms is a
# drawn table cell rather than a character.
BOXLINE = HexColor("#94A3B8")


def tick_row(labels, na_label=None):
    """A row of empty tick boxes under their labels, as a paper answer scale."""
    caps = [Paragraph(l.replace("\n", "<br/>"), OPTLAB) for l in labels]
    if na_label:
        caps.append(Paragraph(na_label, OPTLAB))
    n = len(caps)
    w = min(62.0, (AVAIL - 8) / n)
    t = Table([[""] * n, caps], colWidths=[w] * n, rowHeights=[15, None], hAlign="LEFT")
    t.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, 0), 0.6, BOXLINE),
        ("VALIGN", (0, 1), (-1, 1), "TOP"),
        ("TOPPADDING", (0, 1), (-1, 1), 2),
        ("BOTTOMPADDING", (0, 1), (-1, 1), 6),
    ]))
    return t


def option_list(options, columns=2):
    """Tick boxes down the page, in one or two columns. Each box is drawn."""
    colw = AVAIL / columns
    rows, style = [], [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
    ]
    filled = list(options) + [None] * ((-len(options)) % columns)
    for r, i in enumerate(range(0, len(filled), columns)):
        row = []
        for c, opt in enumerate(filled[i:i + columns]):
            row += ["", Paragraph(inline(opt), CELL) if opt else Paragraph("", CELL)]
            if opt:
                # the box is the narrow cell to the left of each label
                style.append(("GRID", (c * 2, r), (c * 2, r), 0.6, BOXLINE))
        rows.append(row)
    widths = []
    for _ in range(columns):
        widths += [11, colw - 15]
    t = Table(rows, colWidths=widths, hAlign="LEFT")
    t.setStyle(TableStyle(style))
    return t


def write_lines(n=3, label=None):
    rows = [[Paragraph("", CELL)] for _ in range(n)]
    t = Table(rows, colWidths=[AVAIL], rowHeights=[17] * n)
    t.setStyle(TableStyle([
        ("LINEBELOW", (0, 0), (-1, -1), 0.5, HexColor("#CBD5E1")),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    if label:
        return KeepTogether([Paragraph(inline(label), QTEXT), t, Spacer(1, 7)])
    return t


def number_box(label):
    t = Table([[Paragraph(inline(label), CELL), Paragraph("", CELL)]],
              colWidths=[AVAIL - 62, 62], rowHeights=[20])
    t.setStyle(TableStyle([
        ("BOX", (1, 0), (1, 0), 0.6, HexColor("#94A3B8")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (0, 0), 0),
        ("LINEBELOW", (0, 0), (0, 0), 0.4, HexColor("#E2E8F0")),
    ]))
    return t


def intro_card(text):
    inner = Table([[Paragraph(inline(text), CELL)]], colWidths=[AVAIL - 16])
    inner.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), HexColor("#FBF6E6")),
        ("LINEBEFORE", (0, 0), (0, -1), 3, GOLD),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
    ]))
    outer = Table([[inner]], colWidths=[AVAIL])
    outer.setStyle(TableStyle([("LEFTPADDING", (0, 0), (-1, -1), 0),
                               ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                               ("BOTTOMPADDING", (0, 0), (-1, -1), 10)]))
    return outer


# ── the instrument ───────────────────────────────────────────────────────────

def build_instrument(survey):
    m = META[survey["id"]]
    out = OUT / (m["stem"] + ".pdf")
    cover_bg, content_bg = make_page_furniture(m["header"], FOOTER)
    out.parent.mkdir(parents=True, exist_ok=True)
    doc = BaseDocTemplate(
        str(out), pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=52, bottomMargin=42,
        title=f"Osteon Clinics - {m['cover']} - Consult For Africa",
        author="Consult For Africa")
    doc.addPageTemplates([
        PageTemplate(id="cover", frames=[Frame(MARGIN, 150, AVAIL, PAGE_H - 300)], onPage=cover_bg),
        PageTemplate(id="content", frames=[Frame(MARGIN, 42, AVAIL, PAGE_H - 94)], onPage=content_bg),
    ])

    el = [Spacer(1, 30),
          Paragraph("Osteon Clinics", ParagraphStyle(
              "ct", fontName="Helvetica-Bold", fontSize=27, leading=31, textColor=white)),
          Spacer(1, 10),
          Paragraph(inline(m["cover"]), ParagraphStyle(
              "cs", fontName="Helvetica-Bold", fontSize=13.5, leading=18, textColor=GOLD)),
          Spacer(1, 26)]
    for line in [
        f"{survey['audience']}  /  {m['minutes']}",
        "Anonymous" if survey["anonymous"] else "Answered in your own name",
        "Prepared by Consult for Africa  /  September 2026",
        "",
        f"To answer online instead: {BASE_URL}{survey['formPath']}",
    ]:
        el.append(Paragraph(inline(line) if line else "&nbsp;", ParagraphStyle(
            "cm", fontName="Helvetica", fontSize=10.5, leading=17, textColor=white)))
    el += [NextPageTemplate("content"), PageBreak()]

    el.append(intro_card(survey["intro"]))

    # constant-sum splits come first on the forms that have them
    for split in survey["splits"]:
        el.append(Paragraph(inline(split["label"]), H1))
        el.append(Paragraph(
            "Write a number against each line. They must add up to exactly 100.", SMALL))
        el.append(Spacer(1, 4))
        for item in split["items"]:
            el.append(number_box(item["label"]))
        el.append(Spacer(1, 4))
        el.append(number_box("**Total, which must be 100**"))
        el.append(Spacer(1, 8))

    # A or B tensions
    if survey["tensions"]:
        el.append(Paragraph("The choices", H1))
        el.append(Paragraph(
            "Each pair is a real trade-off. Tick where you personally sit. The middle is allowed "
            "but it is rarely honest.", SMALL))
        for t in survey["tensions"]:
            el.append(Spacer(1, 6))
            el.append(KeepTogether([
                Table([[Paragraph(inline(t["a"]), CELL),
                        Paragraph(inline(t["b"]), ParagraphStyle("rt", parent=CELL, alignment=2))]],
                      colWidths=[AVAIL / 2, AVAIL / 2],
                      style=TableStyle([("LEFTPADDING", (0, 0), (-1, -1), 0),
                                        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                                        ("BOTTOMPADDING", (0, 0), (-1, -1), 3)])),
                tick_row(["Strongly A", "Lean A", "Middle", "Lean B", "Strongly B"]),
            ]))
        el.append(Spacer(1, 6))

    # scale questions, grouped by their section
    seen = []
    for q in survey["questions"]:
        if q["section"] not in seen:
            seen.append(q["section"])
            el.append(CondPageBreak(110))
            el.append(Paragraph(inline(q["section"]), H1))
            if len(seen) == 1:
                el.append(Paragraph(
                    "Tick one box on each line. There are no right answers, and anything you "
                    "cannot answer belongs in the N/A column rather than being guessed.", SMALL))
                el.append(Spacer(1, 4))
        labels = FREQ if q.get("scale") == "frequency" else AGREE
        n = len(seen) and survey["questions"].index(q) + 1
        el.append(KeepTogether([
            Paragraph("<b>%d.</b>&nbsp;&nbsp;%s%s" % (
                n, inline(q["text"]),
                '  <font size="7" color="#6B7280">(lower is better)</font>' if q.get("reverse") else ""),
                QTEXT),
            tick_row(labels, "N/A"),
        ]))

    # single-answer and multi-answer blocks
    if survey["categorical"] or survey["multi"]:
        el.append(CondPageBreak(120))
        el.append(Paragraph("A few more questions", H1))
    for c in survey["categorical"]:
        el.append(CondPageBreak(80))
        el.append(KeepTogether([
            Paragraph(inline(c["label"]) + "  <font size='7' color='#6B7280'>(tick one)</font>", H2),
            option_list(c["options"], 2 if len(c["options"]) > 5 else 1),
        ]))
        el.append(Spacer(1, 4))
    for mu in survey["multi"]:
        el.append(CondPageBreak(80))
        el.append(KeepTogether([
            Paragraph(inline(mu["label"]) + "  <font size='7' color='#6B7280'>(tick as many as apply)</font>", H2),
            option_list(mu["options"], 1),
        ]))
        el.append(Spacer(1, 4))

    if survey["open"]:
        el.append(CondPageBreak(130))
        el.append(Paragraph("In your own words", H1))
        el.append(Paragraph("Optional, and usually the most useful part of the form.", SMALL))
        el.append(Spacer(1, 4))
        for o in survey["open"]:
            el.append(write_lines(3, o["label"]))

    el.append(Spacer(1, 10))
    el.append(Paragraph(
        "*Please hand the completed form back in the envelope provided, or answer online at "
        f"{BASE_URL}{survey['formPath']}. Thank you.*", SMALL))

    doc.build(el)
    print("wrote %s" % out)


# ── QR posters ───────────────────────────────────────────────────────────────

def make_qr(url, path):
    q = qrcode.QRCode(version=None, box_size=12, border=2,
                      error_correction=qrcode.constants.ERROR_CORRECT_M)
    q.add_data(url)
    q.make(fit=True)
    q.make_image(fill_color="#0B3C5D", back_color="white").save(path)
    return path


def poster(out_name, eyebrow, headline, subline, qr_file, scan_prompt, footlines, url):
    c = pdfcanvas.Canvas(str(OUT / out_name), pagesize=A4)
    band = 175
    c.setFillColor(NAVY); c.rect(0, PAGE_H - band, PAGE_W, band, fill=1, stroke=0)
    c.setFillColor(GOLD); c.rect(0, PAGE_H - band - 6, PAGE_W, 6, fill=1, stroke=0)
    c.setFillColor(GOLD); c.setFont("Helvetica-Bold", 13)
    c.drawCentredString(PAGE_W / 2, PAGE_H - 52, eyebrow)
    c.setFillColor(white); c.setFont("Helvetica-Bold", 27)
    y = PAGE_H - 90
    for line in headline:
        c.drawCentredString(PAGE_W / 2, y, line)
        y -= 32
    c.setFillColor(HexColor("#C9D6E0")); c.setFont("Helvetica", 13)
    c.drawCentredString(PAGE_W / 2, PAGE_H - band + 22, subline)

    size = 260
    qr_top = PAGE_H - band - 40
    c.drawImage(ImageReader(str(qr_file)), (PAGE_W - size) / 2, qr_top - size,
                width=size, height=size, mask="auto")
    c.setFillColor(NAVY); c.setFont("Helvetica-Bold", 18)
    c.drawCentredString(PAGE_W / 2, qr_top - size - 28, scan_prompt)

    c.setFillColor(HexColor("#1F2937")); c.setFont("Helvetica", 12.5)
    y = qr_top - size - 60
    for line in footlines:
        c.drawCentredString(PAGE_W / 2, y, line)
        y -= 20

    # Not everyone will scan, so the address has to be typeable as well.
    c.setFillColor(HexColor("#6B7280")); c.setFont("Helvetica", 10.5)
    c.drawCentredString(PAGE_W / 2, y - 12, "Or type this into a browser:")
    c.setFillColor(NAVY); c.setFont("Helvetica-Bold", 11.5)
    c.drawCentredString(PAGE_W / 2, y - 30, url)

    c.setFillColor(GOLD); c.rect(MARGIN, 66, 60, 3, fill=1, stroke=0)
    c.setFillColor(MUTED); c.setFont("Helvetica", 9.5)
    c.drawString(MARGIN, 48, "Run by Consult for Africa on behalf of Osteon Clinics")
    c.drawRightString(PAGE_W - MARGIN, 48, "consultforafrica.com")
    c.showPage(); c.save()
    print("wrote %s" % (OUT / out_name))


if __name__ == "__main__":
    surveys = {s["id"]: s for s in json.loads(DATA.read_text(encoding="utf-8"))}
    for sid in META:
        build_instrument(surveys[sid])

    staff_qr = make_qr(BASE_URL + "/osteon-staff-survey.html", OUT / "osteon-staff-survey-qr.png")
    patient_qr = make_qr(BASE_URL + "/osteon-patient-survey.html", OUT / "osteon-patient-survey-qr.png")
    make_qr(BASE_URL + "/osteon-referrer-survey.html", OUT / "osteon-referrer-survey-qr.png")
    make_qr(BASE_URL + "/osteon-leadership-survey.html", OUT / "osteon-leadership-survey-qr.png")

    poster("osteon-staff-survey-poster-cfa.pdf",
           "OSTEON CLINICS",
           ["Tell us how this place", "really works."],
           "Anonymous. About 10 minutes. Nobody here sees your answers.",
           staff_qr,
           "Point your camera here",
           ["Your name is not asked for, and your answers go to Consult for Africa,",
            "not to anyone who manages you. They are reported only as totals.",
            "",
            "There are no right answers. Honesty is the whole point."],
           BASE_URL + "/osteon-staff-survey.html")

    poster("osteon-patient-survey-poster-cfa.pdf",
           "OSTEON CLINICS",
           ["How was your", "experience with us?"],
           "Anonymous. About 5 minutes.",
           patient_qr,
           "Point your camera here",
           ["We do not ask your name, so nobody can tell which answers are yours.",
            "Please be honest, including about anything that disappointed you.",
            "",
            "Thank you for trusting us with your care."],
           BASE_URL + "/osteon-patient-survey.html")
