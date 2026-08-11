"""
Build the Premium Medipark prospect survey PDF.

Prospect-facing. For senior specialists in Abuja who might take serviced consulting
rooms by the session. Designed to test the two assumptions the whole model rests on
and which are currently borrowed from the Ikoyi work and unvalidated for Abuja:

  1. Session fill by band (35% to 55% assumed)
  2. Membership pricing (NGN 2.5M assumed, 25% of campus revenue)

Design rules followed:
  - Never promises patient volume. Asks about current behaviour, not intention.
  - Price tested with van Westendorp (four questions), not a yes/no at one price,
    so it yields a defensible range rather than confirmation bias.
  - Under 5 minutes, 16 questions.
  - No mention of Alameda, medical tourism, or anything not yet decided.
  - Doubles as a lead generator for the founding cohort.

Output: docs/premium-medipark-survey-cfa.pdf
House style matches the CFA repo. Naira shown as NGN. No em dashes.

Run:
  python3 scripts/build-medipark-survey.py
"""

from __future__ import annotations

from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import (
    BaseDocTemplate, Frame, PageBreak, PageTemplate, Paragraph, Spacer, Table, TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
OUT = DOCS / "premium-medipark-survey-cfa.pdf"

NAVY = HexColor("#0F3D2E")
GOLD = HexColor("#C6A15B")
TEAL = HexColor("#2F6B52")
BODY = HexColor("#23302B")
MUTED = HexColor("#7C7C74")
SURFACE = HexColor("#F5F2EA")
LIGHT = HexColor("#CBDDD1")
PANEL = HexColor("#E9F0EA")
RULE = HexColor("#C9C9C2")

PAGE_W, PAGE_H = A4
MARGIN = 44
FULLW = PAGE_W - 2 * MARGIN
BOX = "[    ]"

ss = getSampleStyleSheet()


def style(name, **kw):
    base = dict(fontName="Helvetica", fontSize=9.2, leading=12.6, textColor=BODY,
                alignment=TA_LEFT, spaceAfter=5)
    base.update(kw)
    return ParagraphStyle(name, **base)


EYEBROW = style("eyebrow", fontName="Helvetica-Bold", fontSize=8.2, leading=11,
                textColor=GOLD, spaceAfter=2, spaceBefore=8)
H1 = style("h1", fontName="Helvetica-Bold", fontSize=12, leading=15, textColor=NAVY,
           spaceBefore=2, spaceAfter=5)
Q = style("q", fontName="Helvetica-Bold", fontSize=9.4, leading=12.6, textColor=NAVY,
          spaceBefore=7, spaceAfter=2)
P = style("p")
OPT = style("opt", fontSize=9.0, leading=13.5, leftIndent=10)
SMALL = style("small", fontSize=7.8, leading=10.5, textColor=MUTED)
CELL = style("cell", fontSize=8.4, leading=11)
CELL_C = style("cellc", fontSize=8.4, leading=11, alignment=1)
CELL_W = style("cellw", fontSize=8.4, leading=11, fontName="Helvetica-Bold", textColor=white)
CELL_WC = style("cellwc", fontSize=8.4, leading=11, fontName="Helvetica-Bold",
                textColor=white, alignment=1)


def page_bg(c, doc):
    c.saveState()
    c.setFillColor(NAVY)
    c.rect(0, PAGE_H - 30, PAGE_W, 30, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(0, PAGE_H - 33, PAGE_W, 3, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(MARGIN, PAGE_H - 20, "A NEW PRIVATE CONSULTING FACILITY IN ABUJA")
    c.setFillColor(LIGHT)
    c.setFont("Helvetica", 8)
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 20, "Consultant survey")
    c.setFillColor(GOLD)
    c.rect(MARGIN, 26, 20, 2, fill=1, stroke=0)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 7.4)
    c.drawString(MARGIN, 15, "Confidential  /  Reported in aggregate only")
    c.drawRightString(PAGE_W - MARGIN, 15, "Page %d of 3" % doc.page)
    c.restoreState()


def card(text, bg=SURFACE, fg=BODY, rule=GOLD):
    st = ParagraphStyle("c", parent=P, textColor=fg, leftIndent=6, rightIndent=6,
                        spaceBefore=2, spaceAfter=2)
    t = Table([[Paragraph(text, st)]], colWidths=[FULLW])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("LINEBEFORE", (0, 0), (0, -1), 2.5, rule),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ]))
    return t


def opts(items, cols=2):
    """Tick-box options laid out in columns."""
    rows, n = [], (len(items) + cols - 1) // cols
    for i in range(n):
        row = []
        for c in range(cols):
            j = i + c * n
            row.append(Paragraph(BOX + "  " + items[j], OPT) if j < len(items) else Paragraph("", OPT))
        rows.append(row)
    t = Table(rows, colWidths=[FULLW / cols] * cols)
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 1),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
    ]))
    return t


def writein(n=1, label=""):
    rows = [[Paragraph(label if i == 0 else "", CELL)] for i in range(n)]
    t = Table(rows, colWidths=[FULLW], rowHeights=[17] * n)
    t.setStyle(TableStyle([
        ("LINEBELOW", (0, 0), (-1, -1), 0.6, RULE),
        ("LEFTPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    return t


def grid(rows, headers, widths):
    data = [[Paragraph(headers[0], CELL_W)] +
            [Paragraph(h, CELL_WC) for h in headers[1:]]]
    for r in rows:
        data.append([Paragraph(r, CELL)] + [Paragraph(BOX, CELL_C) for _ in headers[1:]])
    t = Table(data, colWidths=widths)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("LINEBELOW", (0, 0), (-1, 0), 1.4, GOLD),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, SURFACE]),
    ]))
    return t


def sec(el, num, title):
    el.append(Paragraph("SECTION " + num, EYEBROW))
    el.append(Paragraph(title, H1))


def build():
    doc = BaseDocTemplate(
        str(OUT), pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN, topMargin=44, bottomMargin=32,
        title="Abuja consultant survey - a new private consulting facility",
        author="Consult for Africa",
    )
    doc.addPageTemplates([PageTemplate(
        id="p", frames=[Frame(MARGIN, 32, FULLW, PAGE_H - 44 - 32, id="f")], onPage=page_bg)])

    el = []
    el.append(Paragraph("Would you use it?",
                        style("t", fontName="Helvetica-Bold", fontSize=17, leading=20,
                              textColor=NAVY, spaceAfter=2)))
    el.append(Paragraph("A short survey for consultants practising privately in Abuja.",
                        style("st", fontName="Helvetica-Oblique", fontSize=10.5, leading=13,
                              textColor=GOLD, spaceAfter=7)))
    el.append(card(
        "Consult for Africa is advising on a new private consulting facility in Abuja: serviced "
        "consulting rooms available by the session, with an on-site laboratory, imaging and "
        "pharmacy, trained nursing support, and billing and collection handled for you. "
        "<b>Before anything is built, we want to hear from the consultants who might actually use "
        "it.</b> This takes about five minutes. Your answers are confidential and will be reported "
        "only in aggregate.", bg=PANEL))

    sec(el, "A", "Your practice")
    el.append(Paragraph("1.  What is your specialty?", Q))
    el.append(writein(1))
    el.append(Paragraph("2.  Where do you currently see private patients? Tick all that apply.", Q))
    el.append(opts(["My own consulting rooms", "Rooms I rent or borrow",
                    "A hospital where I have privileges", "At the patient's home or office",
                    "I do not currently see private patients", "Other"]))
    el.append(Paragraph("3.  In a typical week, roughly how many private patients do you see?", Q))
    el.append(opts(["None", "1 to 5", "6 to 10", "11 to 20", "21 to 30", "More than 30"], cols=3))
    el.append(Paragraph("4.  Roughly what do you charge for a first private consultation?", Q))
    el.append(opts(["Under NGN 25,000", "NGN 25,000 to 50,000", "NGN 50,000 to 75,000",
                    "NGN 75,000 to 100,000", "NGN 100,000 to 150,000", "Over NGN 150,000"], cols=3))

    sec(el, "B", "Sessions")
    el.append(Paragraph(
        "A session is a half day of exclusive use of a private consulting room, booked in advance.", P))
    el.append(Paragraph(
        "5.  If serviced consulting rooms were available in Abuja, how many sessions a week would "
        "you realistically use?", Q))
    el.append(opts(["None", "1", "2", "3", "4 or more"], cols=5))
    el.append(Paragraph("6.  Which time bands would work for you? Tick all that apply.", Q))
    el.append(opts(["Early morning, 07:00 to 09:00", "Morning, 09:00 to 13:00",
                    "Afternoon, 13:00 to 17:00", "Evening, 17:00 to 21:00",
                    "Saturday morning", "Saturday afternoon"]))
    el.append(Paragraph("7.  Which single band would you most want?", Q))
    el.append(writein(1))
    el.append(PageBreak())

    el.append(Paragraph(
        "8.  If you currently rent consulting space, what do you pay? Please say per session, per "
        "month or per year.", Q))
    el.append(writein(1))

    sec(el, "C", "What it would be worth")
    el.append(card(
        "<b>A serviced half-day session would include:</b> a private consulting room, reception and "
        "patient check-in, a trained nurse or chaperone on call, records and results handling, "
        "billing and collection, an on-site laboratory, imaging and pharmacy, and parking for your "
        "patients.", bg=SURFACE))
    el.append(Paragraph(
        "Thinking about that, please give a naira figure for each of the four questions below. "
        "There are no right answers and the four should be different numbers.", P))
    el.append(Paragraph(
        "9.  At what price per session would it be so low that you would question the quality?", Q))
    el.append(writein(1))
    el.append(Paragraph("10.  At what price would you consider it good value?", Q))
    el.append(writein(1))
    el.append(Paragraph(
        "11.  At what price would it start to feel expensive, but still worth considering?", Q))
    el.append(writein(1))
    el.append(Paragraph("12.  At what price would it be too expensive to consider at all?", Q))
    el.append(writein(1))
    el.append(Paragraph(
        "13.  An annual membership would give you member session rates, priority booking of your "
        "preferred room and time band, and inclusion in the facility's directory. What would you "
        "consider paying a year?", Q))
    el.append(opts(["I would not pay a membership", "Under NGN 500,000",
                    "NGN 500,000 to 1 million", "NGN 1 to 2 million",
                    "NGN 2 to 3 million", "Over NGN 3 million"]))
    el.append(PageBreak())

    sec(el, "D", "What would matter most")
    el.append(Paragraph(
        "14.  How important would each of these be to you? One tick per row.", Q))
    el.append(grid(
        ["The address, and how the place looks and feels",
         "On-site laboratory and imaging, same visit",
         "Billing and collection handled for you",
         "A trained nurse or chaperone on call",
         "Parking and discretion for your patients",
         "Booking by the session, with no lease",
         "Which other consultants practise there",
         "A room you can call your own"],
        ["", "Not important", "Useful", "Important", "Essential"],
        [223, 62, 62, 62, 62]))

    sec(el, "E", "Procedures")
    el.append(Paragraph(
        "15.  Do you perform any of the following? Tick all that apply.", Q))
    el.append(opts(["Minor procedures under local anaesthesia",
                    "Procedures needing sedation and an anaesthetist",
                    "Procedures needing a full operating theatre",
                    "None of these"]))

    sec(el, "F", "If you would like to hear more")
    el.append(Paragraph(
        "16.  We are assembling a founding group of consultants who will help shape the facility "
        "and take the first rooms. Would you like to be contacted about it?", Q))
    el.append(opts(["Yes, please contact me", "Send me the findings, but no contact",
                    "No thank you"], cols=3))
    el.append(Spacer(1, 4))
    el.append(writein(1, "Name"))
    el.append(writein(1, "Specialty"))
    el.append(writein(1, "Email"))
    el.append(writein(1, "Phone"))
    el.append(Spacer(1, 8))
    el.append(card(
        "Thank you. Please return to <b>hello@consultforafrica.com</b> or WhatsApp a photo of the "
        "completed pages to <b>+234 913 813 8553</b>.", bg=NAVY, fg=white))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "Consult for Africa is a healthcare strategy practice. This survey is research. It is not an "
        "offer, and completing it commits you to nothing. Responses are held confidentially and "
        "reported only in aggregate, and your contact details will be used only if you ask us to "
        "get in touch.", SMALL))

    doc.build(el)
    print("wrote %s" % OUT)


if __name__ == "__main__":
    build()
