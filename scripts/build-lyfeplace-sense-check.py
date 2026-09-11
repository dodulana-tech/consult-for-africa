"""
Build the family practice projection sense check PDF.

Source: docs/lyfeplace-abuja/lyfeplace-family-practice-sense-check.md, checked against
lyfeplace-family-practice-model.xlsx, the measured floor plans, the rate assumptions and
the product definition.

THE THREE FINDINGS
  1. The model sizes physicians and never sizes rooms. Loaded properly the practice needs
     2 / 3.5 / 5 consulting rooms against the 1 the campus brief allows.
  2. The staffing floor is set by opening hours, not volume. A 07:00 to 21:00 campus needs
     about 2.6 physicians to be open at all. The ramp puts 0.5 against 420 lives.
  3. The rate assumptions and the product definition disagree about sessional fill,
     35 to 55 per cent against a 75 per cent ceiling. Everything downstream depends on it.

Restated Base contribution N284.5M against the model's N367.6M. The practice still works.
The campus model is what needs redoing.

Output: docs/lyfeplace-abuja/lyfeplace-family-practice-sense-check-cfa.pdf
House style matches the CFA repo. Naira shown as NGN. No em dashes.

Run:
  python3 scripts/build-lyfeplace-sense-check.py
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
DOCS = ROOT / "docs" / "lyfeplace-abuja"
OUT = DOCS / "lyfeplace-family-practice-sense-check-cfa.pdf"

NAVY = HexColor("#0F3D2E")
GOLD = HexColor("#C6A15B")
TEAL = HexColor("#2F6B52")
BODY = HexColor("#23302B")
MUTED = HexColor("#7C7C74")
SURFACE = HexColor("#F5F2EA")
LIGHT = HexColor("#CBDDD1")
PANEL = HexColor("#E9F0EA")
CREAM = HexColor("#F6EFDD")
ALERT = HexColor("#FBF0E4")
RUST = HexColor("#B8763A")

PAGE_W, PAGE_H = A4
MARGIN = 42
FULLW = PAGE_W - 2 * MARGIN

ss = getSampleStyleSheet()


def style(name, **kw):
    base = dict(fontName="Helvetica", fontSize=8.9, leading=12.0, textColor=BODY,
                alignment=TA_LEFT, spaceAfter=5)
    base.update(kw)
    return ParagraphStyle(name, **base)


EYEBROW = style("eyebrow", fontName="Helvetica-Bold", fontSize=8.2, leading=11,
                textColor=GOLD, spaceAfter=2, keepWithNext=True)
H1 = style("h1", fontName="Helvetica-Bold", fontSize=13, leading=16.5, textColor=NAVY,
           spaceBefore=6, spaceAfter=5, keepWithNext=True)
H2 = style("h2", fontName="Helvetica-Bold", fontSize=9.8, leading=12.8, textColor=TEAL,
           spaceBefore=7, spaceAfter=3, keepWithNext=True)
P = style("p")
LEDE = style("lede", fontSize=9.6, leading=13.6, textColor=HexColor("#374151"))
SMALL = style("small", fontSize=7.4, leading=10, textColor=MUTED)
CELL = style("cell", fontSize=8.0, leading=10.4)
CELL_R = style("cellr", fontSize=8.0, leading=10.4, alignment=2)
CELL_B = style("cellb", fontSize=8.0, leading=10.4, fontName="Helvetica-Bold", textColor=NAVY)
CELL_BR = style("cellbr", fontSize=8.0, leading=10.4, fontName="Helvetica-Bold",
                textColor=NAVY, alignment=2)
CELL_W = style("cellw", fontSize=8.0, leading=10.4, fontName="Helvetica-Bold", textColor=white)
CELL_WR = style("cellwr", fontSize=8.0, leading=10.4, fontName="Helvetica-Bold",
                textColor=white, alignment=2)


def page_bg(c, doc):
    c.saveState()
    c.setFillColor(NAVY)
    c.rect(0, PAGE_H - 30, PAGE_W, 30, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(0, PAGE_H - 33, PAGE_W, 3, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(MARGIN, PAGE_H - 20, "LYFE PLACE ABUJA")
    c.setFillColor(LIGHT)
    c.setFont("Helvetica", 8)
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 20, "Family practice projection, sense check")
    c.setFillColor(GOLD)
    c.rect(MARGIN, 26, 20, 2, fill=1, stroke=0)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 7.4)
    c.drawString(MARGIN, 15, "Private and confidential  /  Prepared for Dr Itunu Akinware, Group CEO")
    c.drawRightString(PAGE_W - MARGIN, 15, "Page %d" % doc.page)
    c.restoreState()


def card(text, bg=SURFACE, fg=BODY, rule=GOLD):
    st = ParagraphStyle("c", parent=P, textColor=fg, leftIndent=6, rightIndent=6,
                        spaceBefore=2, spaceAfter=2)
    t = Table([[Paragraph(text, st)]], colWidths=[FULLW])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("LINEBEFORE", (0, 0), (0, -1), 2.5, rule),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ]))
    return t


def tbl(rows, labels, widths, total_row=False, aligns=None, hi=None):
    ncols = len(labels)
    if aligns is None:
        aligns = ["r"] * (ncols - 1)
    hi = hi or set()
    data = [[Paragraph(labels[0], CELL_W)] +
            [Paragraph(t, CELL_WR if aligns[j] == "r" else CELL_W)
             for j, t in enumerate(labels[1:])]]
    for i, r in enumerate(rows):
        emph = (total_row and i == len(rows) - 1) or i in hi
        cells = [Paragraph(r[0], CELL_B if emph else CELL)]
        for j, v in enumerate(r[1:]):
            if aligns[j] == "r":
                cells.append(Paragraph(v, CELL_BR if emph else CELL_R))
            else:
                cells.append(Paragraph(v, CELL_B if emph else CELL))
        data.append(cells)
    t = Table(data, colWidths=widths)
    st = [
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("LINEBELOW", (0, 0), (-1, 0), 1.5, GOLD),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 3.0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3.0),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("ROWBACKGROUNDS", (0, 1), (-1, -2 if total_row else -1), [white, SURFACE]),
    ]
    if total_row:
        st.append(("BACKGROUND", (0, -1), (-1, -1), CREAM))
        st.append(("LINEABOVE", (0, -1), (-1, -1), 1, GOLD))
    for i in hi:
        st.append(("BACKGROUND", (0, i + 1), (-1, i + 1), PANEL))
    t.setStyle(TableStyle(st))
    return t


def sec(el, num, eyebrow, title):
    el.append(Paragraph(num + "  /  " + eyebrow, EYEBROW))
    el.append(Paragraph(title, H1))


def bullets(el, items, style_=None):
    for b in items:
        el.append(Paragraph("&bull;&nbsp;&nbsp;" + b, style_ or style(
            "b", leftIndent=10, firstLineIndent=-10, spaceAfter=3)))


def build():
    doc = BaseDocTemplate(
        str(OUT), pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN, topMargin=42, bottomMargin=30,
        title="Lyfe Place Abuja - family practice projection, sense check",
        author="Consult for Africa",
    )
    doc.addPageTemplates([PageTemplate(
        id="p", frames=[Frame(MARGIN, 30, FULLW, PAGE_H - 42 - 30, id="f")], onPage=page_bg)])

    el = []
    el.append(Paragraph("Family practice projection",
                        style("t", fontName="Helvetica-Bold", fontSize=18, leading=21,
                              textColor=NAVY, spaceAfter=2)))
    el.append(Paragraph("A sense check, and what it changes.",
                        style("st", fontName="Helvetica-Oblique", fontSize=10.5, leading=13,
                              textColor=GOLD, spaceAfter=7)))
    el.append(card(
        "The arithmetic in the workbook is clean. Every total reconciles, the tier build-up is "
        "consistent, and the model is unusually honest about which of its own inputs are weak. "
        "<b>Three things are wrong, and only one of them is about money.</b>", bg=PANEL))

    # 01
    sec(el, "01", "THE SHORT VERSION", "Three findings.")
    el.append(tbl(
        [["<b>1. The model never counts rooms.</b> It sizes physicians and stops. Loaded "
          "properly the practice needs <b>two rooms at Low, three and a half at Base, five at "
          "High</b>. The campus brief gives it one. At Base that takes two and a half rooms out "
          "of the sessional pool, which is where the campus makes its margin.", "Rooms"],
         ["<b>2. The staffing floor is opening hours, not volume.</b> A campus open 07:00 to "
          "21:00 needs about <b>2.6 physicians just to be open</b>, whatever the panel size. The "
          "ramp puts half a physician against 420 covered lives at month nine. That is not a "
          "costing error, it is a promise the practice cannot keep.", "Coverage"],
         ["<b>3. Two of our own documents disagree about sessional fill</b>, 35 to 55 per cent in "
          "the rate assumptions against a 75 per cent booking ceiling in the product definition. "
          "That is a 1.8 times difference on the largest revenue line on the campus, and the "
          "family practice room take makes it worse.", "Fill"]],
        ["Finding", "Theme"], [FULLW - 62, 62], aligns=["l"]))
    el.append(Spacer(1, 5))
    el.append(card(
        "<b>Corrected, the practice still works.</b> Base contribution falls from NGN 368M to "
        "about <b>NGN 285M</b>, a 23 per cent haircut, and the case to build it first is "
        "unchanged. The campus model is the thing that needs redoing, not the practice.",
        bg=CREAM, rule=RUST))

    # 02
    sec(el, "02", "WHAT IT GETS RIGHT", "Worth saying, because the rest of this is criticism.")
    el.append(tbl(
        [["Arithmetic", "Every line reconciles. Membership revenue, encounter weighting, the "
          "transfer to diagnostics, the cost base and contribution all tie out to the naira"],
         ["Pods driven by encounters", "The Panel tab sizes on weighted encounter demand, not "
          "member count. Most primary care models size on headcount and drift"],
         ["Break-even framing", "Correctly identifies that the wellness catalogue, not "
          "membership, sets break-even. NGN 186M of a NGN 270M cost base is covered before a "
          "single member joins"],
         ["Transfer honesty", "The Capture tab warns that the diagnostics transfer is gross "
          "revenue, not contribution, and tells the reader to apply margin first. Most models "
          "quietly add it"],
         ["Status column", "Every driver is marked derived, benchmarked or judgement, and the "
          "three weakest are named in the Readme"]],
        ["", "Why it holds"], [118, FULLW - 118], aligns=["l"]))
    el.append(Spacer(1, 4))
    el.append(card(
        "The self-critique is also correct. The Panel tab flags that implied lives per physician, "
        "567, 626 and 657, exceed the adopted 550 design capacity, and says <i>if it does, the "
        "headroom factor is too low</i>. It is. <b>The model raises the flag and then does not "
        "act on it.</b>"))

    el.append(Spacer(1, 12))

    # 03
    sec(el, "03", "THE ROOM COUNT", "The number the model does not compute.")
    el.append(Paragraph("What the model does", H2))
    el.append(Paragraph(
        "Pods are derived from membership encounters only, then multiplied by a 1.18 headroom "
        "factor described as carrying the wellness catalogue. That factor buys 966 encounters of "
        "capacity at Base. <b>The wellness catalogue is 3,285 units a year.</b> The headroom "
        "covers under a third of it.", P))
    el.append(Paragraph("Load the catalogue properly", H2))
    el.append(Paragraph(
        "Two different capacities are in play and the model treats them as one. A screening "
        "package or a pre-employment medical occupies a <b>room</b> for a full slot but occupies "
        "a <b>physician</b> only for sign-off and the results conversation. Split them, take the "
        "physician share of a wellness encounter at 0.35, and exclude the eleven corporate "
        "wellness days as off-site events.", P))
    el.append(tbl(
        [["Membership encounters a year", "2,874", "5,370", "7,900"],
         ["Wellness room encounters", "1,801", "3,274", "4,257"],
         ["Total room encounters", "4,675", "8,644", "12,157"],
         ["Physician demand, wellness at 0.35", "3,504", "6,516", "9,390"],
         ["Physicians needed", "1.5", "3.0", "4.0"],
         ["Model says", "1.5", "2.5", "3.5"],
         ["Consulting rooms needed", "2.0", "3.5", "5.0"],
         ["Campus brief allows", "1", "1", "1"]],
        ["", "Low", "Base", "High"], [FULLW - 210, 70, 70, 70], hi={6, 7}))
    el.append(Spacer(1, 4))
    el.append(card(
        "The pod count survives almost intact. The 1.18 fudge happens to approximate the "
        "physician load of the catalogue, so the model is <b>roughly right by accident</b>, half "
        "a pod light at Base and High. The room count is the finding. The practice needs three "
        "and a half of the campus's eight consulting rooms at Base, not one.", bg=ALERT, rule=RUST))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "An extra half pod costs NGN 16.7M a year. Two and a half extra rooms cost the campus its "
        "sessional pool. On the rate assumptions tariff and fills a first floor consulting room "
        "grosses about NGN 24M a year; on the product definition's 75 per cent ceiling, about "
        "NGN 56M. Either way <b>the facility charge of NGN 28M in the model is priced for one "
        "room</b>.", P))

    # 04
    sec(el, "04", "THE COVERAGE FLOOR", "Staffing is set by the opening hours, not the panel.")
    el.append(Paragraph(
        "The campus operating window in the brief is 07:00 to 21:00, with a Saturday band. A pod "
        "delivers six clinical hours a day, five days a week: thirty clinical hours a week per "
        "physician. Opening hours a week are roughly 78. <b>Single cover therefore needs 2.6 "
        "physicians, before a single member joins.</b> Volume does not enter it.", P))
    el.append(tbl(
        [["9", "420", "0.5", "2.6"],
         ["12", "680", "1.0", "2.6"],
         ["18", "1,180", "2.0", "2.6"],
         ["24", "1,565", "2.5", "2.6"]],
        ["Month", "Covered lives", "Pods in the ramp", "Coverage floor"],
        [FULLW - 240, 80, 80, 80]))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "Half a physician cannot deliver same-day access to 420 people who have paid between "
        "NGN 185,000 and NGN 750,000 a year for it. The Low scenario at 1.5 pods is not a smaller "
        "version of the practice, it is a different product. There are two honest resolutions, "
        "and they are a product decision rather than a modelling one.", P))
    bullets(el, [
        "<b>Run the practice on shorter hours than the campus</b>, say 08:00 to 18:00 weekdays "
        "plus Saturday morning, and say so in the membership terms. The coverage floor drops to "
        "about 1.9.",
        "<b>Hold two physicians on duty from opening</b> and accept the cost while the panel "
        "fills. That front-loads roughly NGN 30M to NGN 40M into months one to twelve."])
    el.append(Paragraph(
        "The model assumes neither. Whichever is chosen has to be written into the membership "
        "promise before a single tier is sold.", P))

    el.append(Spacer(1, 12))

    # 05
    sec(el, "05", "REVENUE ASSUMPTIONS", "Where the thin ice is.")
    el.append(Paragraph("The catalogue is half the business, and it is not a family practice", H2))
    el.append(Paragraph(
        "Wellness catalogue gross at Base is <b>NGN 489.5M</b> against membership revenue of "
        "<b>NGN 503.7M</b>. The line called family practice is, in revenue terms, a screening and "
        "occupational health business with a membership panel attached. That is not a criticism "
        "of the strategy. It is a criticism of the name, because the name is driving the design. "
        "An occupational health unit doing 2,112 corporate and visa medicals a year, roughly ten "
        "a working day arriving in batches, needs its own room, its own flow and its own front "
        "desk. The floor plans put the family practice upstairs and the X-ray on the ground "
        "floor, which is right for weight and evacuation and wrong for a visa medical.", P))
    el.append(tbl(
        [["Pre-employment medical, corporate rate", "1,120 a year", "5 a day",
          "NGN 53.8M, the largest volume line. Assumes corporate contracts that do not exist yet"],
         ["Visa and travel medical, both grades", "720 a year", "3.3 a day",
          "<b>This may be a licensing question, not a demand question</b>"]],
        ["Line", "Base volume", "A day", "Comment"],
        [150, 62, 44, FULLW - 256], aligns=["r", "r", "l"]))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>Check the visa medical line before anything else in the workbook.</b> In Nigeria the "
        "volume destinations run through panel physicians appointed by the embassy or by IOM. If "
        "Lyfe Place is not on those panels, 720 visa medicals a year at NGN 85,000 and NGN "
        "145,000 is not a marketing problem, it is unreachable. Confirm panel status, or the "
        "application route and its lead time, before the number stays in a board pack.",
        bg=ALERT, rule=RUST))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "The chest X-ray load is the second order consequence. 720 visa medicals plus a share of "
        "1,120 pre-employment medicals puts perhaps 1,200 to 1,800 chest films a year through the "
        "single ground floor X-ray room, alongside orthopaedics and the theatre. Feasible, but it "
        "makes imaging a shared bottleneck between two businesses with different rhythms.", P))

    el.append(Paragraph("The flat 62 per cent diagnostics transfer", H2))
    el.append(Paragraph(
        "A single 62 per cent test share is applied to all eighteen catalogue lines. It is roughly "
        "right for screening packages, where bloods and imaging dominate. It is clearly wrong for "
        "the four programme lines, where the cost is clinician time and coaching.", P))
    el.append(tbl(
        [["Cardiometabolic reset, 12 weeks", "480,000", "297,600", "perhaps 20%"],
         ["Diabetes stabilisation, 6 months", "620,000", "384,400", "perhaps 25%"],
         ["Hypertension stabilisation, 6 months", "420,000", "260,400", "perhaps 20%"],
         ["Weight and metabolic, 6 months", "540,000", "334,800", "perhaps 15%"]],
        ["Line", "Price NGN", "62% to diagnostics", "Plausible test share"],
        [FULLW - 260, 70, 100, 90]))
    el.append(Spacer(1, 3))
    el.append(Paragraph(
        "Programme lines total NGN 43.1M at Base. Correcting the transfer moves roughly NGN 18M a "
        "year from diagnostics back to the practice. Small against the total, but it misstates "
        "two business units against each other, which matters if the group is comparing BU "
        "performance.", P))

    el.append(Paragraph("Encounter rates, none of them validated", H2))
    bullets(el, [
        "<b>Corporate Core carries 520 of 1,565 lives at 2.2 encounters</b> a year. Nigerian HMO "
        "utilisation for corporate lives frequently runs higher, because members use cover they "
        "did not pay for directly. At 3.2 the panel adds 520 encounters and a fifth of a pod.",
        "<b>Elders at 7.5 encounters</b> is low for a 60 plus panel with chronic disease. Only 70 "
        "lives, so immaterial, but it suggests the rates were set optimistically throughout.",
        "A uniform 20 per cent overshoot across all tiers takes Base to 6,444 membership "
        "encounters and <b>the room requirement to four</b>."])

    el.append(PageBreak())

    el.append(Paragraph("Renewal, and the year the model does not show", H2))
    el.append(Paragraph(
        "76 per cent into year two is named in the Readme as the assumption with the least "
        "evidence and the most riding on it. Agreed. The consequence the model does not show is "
        "that the ramp stops at month 24, which is exactly when churn starts to bite. At Base the "
        "practice must <b>replace 375 lives in year three</b> while still growing. That is a sales "
        "capacity question, not a budget one: the NGN 50M marketing line covers the cash easily. "
        "<b>Extend the ramp to month 36.</b> A model that ends the month before its hardest year "
        "is not finished.", P))

    el.append(Paragraph("Pricing against the market", H2))
    el.append(Paragraph(
        "Blended NGN 321,800 per covered life a year, for primary care access only, no "
        "hospitalisation and no specialist cover. Against 2026 Nigerian HMO plans that is at the "
        "premium end, and the question the model does not answer is whether this is <b>additive "
        "to an existing HMO</b>. Most of this target market already has employer cover. If Lyfe "
        "Place membership is a second payment rather than a replacement, the renewal assumption "
        "is doing even more work than the Readme admits. The corporate tiers make this sharpest: "
        "<b>565 of 1,565 lives, 36 per cent of the panel, is corporate</b>, sold to employers who "
        "are already buying HMO cover. That is the least proven channel in the model carrying the "
        "largest single block of lives.", P))

    # 06
    sec(el, "06", "THE CAMPUS INTERFACE", "Where the numbers actually break.")
    el.append(Paragraph(
        "This is not the workbook's fault. Two CFA documents disagree with each other.", LEDE))
    el.append(tbl(
        [["lyfeplace-rate-assumptions-cfa.pdf", "35% early, 35% daytime, 55% evening, 45% Saturday",
          "about NGN 24M per room"],
         ["lyfeplace-abuja-product-cfa.pdf", "a practical booking ceiling of about 75%, 4,970 "
          "sessions across six rooms", "about NGN 56M per room"]],
        ["Source", "Sessional fill", "Implied"],
        [168, FULLW - 288, 120], aligns=["l", "r"]))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "Both cannot be right. The rate document's own tariff and fills produce roughly NGN 144M "
        "across six rooms; the product document carries NGN 337.1M. <b>Until that is reconciled in "
        "one place, no campus number that includes a sessional line can be relied on.</b>", P))
    el.append(Paragraph("Then the family practice takes two and a half more rooms than anyone "
                        "allowed for", H2))
    el.append(tbl(
        [["Consulting rooms on the campus", "8", "8, measured"],
         ["To the family practice", "1", "3.5 at Base"],
         ["Sessional pool", "6 to 7", "3.5 to 4.5"]],
        ["", "Brief assumes", "Survey and this check"],
        [FULLW - 220, 110, 110], hi={2}))
    el.append(Spacer(1, 4))
    el.append(card(
        "At the rate document's own fills, a sessional pool of 3.5 rooms grosses roughly NGN 84M "
        "against the NGN 337.1M in the product definition. <b>That is the single largest "
        "correction in the whole campus case, and it falls out of the family practice sizing.</b> "
        "The model charges the practice NGN 28M a year for facility and room allocation, priced "
        "for one room. Corrected to three and a half rooms it is between NGN 84M and NGN 196M. "
        "The campus contribution memo of NGN 230.7M nets off none of it.", bg=ALERT, rule=RUST))

    el.append(Spacer(1, 12))

    # 07
    sec(el, "07", "RESTATED BASE CASE", "Every revenue assumption held. Only the two errors fixed.")
    el.append(tbl(
        [["Practice revenue, net", "637.7", "637.7", "unchanged"],
         ["Clinical pod cost", "(83.3)", "(99.9)", "3.0 pods, not 2.5"],
         ["Facility and room allocation", "(28.0)", "(94.5)", "3.5 rooms at NGN 27M"],
         ["Other overhead", "(158.8)", "(158.8)", "unchanged"],
         ["Contribution", "367.6", "284.5", "down 23%"]],
        ["NGN M a year, Base", "Model", "Restated", "Why"],
        [FULLW - 250, 62, 66, 122], aligns=["r", "r", "l"], total_row=True))
    el.append(Spacer(1, 4))
    el.append(tbl(
        [["Contribution margin on net revenue", "57.7%", "44.6%"],
         ["Contribution per covered life, NGN", "234,903", "181,789"]],
        ["", "Model", "Restated"], [FULLW - 180, 90, 90]))
    el.append(Spacer(1, 5))
    el.append(card(
        "<b>The practice still works.</b> A 44.6 per cent contribution margin on a primary care "
        "line that also generates NGN 230.7M of contribution elsewhere on the campus is a good "
        "business. The case for building it first is unchanged and, if anything, strengthened, "
        "because the capture is now the majority of the value.<br/><br/>"
        "<b>The campus case does not survive unchanged.</b> The sessional pool shrinks by two and "
        "a half rooms and the fill assumption behind it is disputed between two of our own "
        "documents. That correction is larger than anything in the practice profit and loss.",
        bg=PANEL))

    # 08
    sec(el, "08", "WHAT TO DO", "In order.")
    el.append(tbl(
        [["1", "Check the visa medical panel status", "Gates NGN 71M of catalogue revenue and it "
          "is a licensing fact, not an estimate. One phone call", "Changes the answer"],
         ["2", "Reconcile sessional fill in one place", "35 to 55 per cent or 75 per cent. Every "
          "campus number downstream depends on it", "Changes the answer"],
         ["3", "Add a rooms tab to the workbook", "Room-slot and physician-slot demand separately, "
          "with the catalogue loaded explicitly rather than hidden inside a 1.18 factor. Then "
          "reprice the facility charge off the room count it produces", "Confidence"],
         ["4", "Decide the opening hours of the practice", "Write them into the membership terms "
          "before the tiers are sold, then set month-one staffing off the coverage floor",
          "Confidence"],
         ["5", "Split the transfer rate by catalogue group", "Screening, programme and "
          "occupational are three different cost structures", "Confidence"],
         ["6", "Extend the ramp to month 36", "So the first full year of churn is visible",
          "Confidence"],
         ["7", "Sensitise Corporate Core encounters", "At 2.2, 2.7 and 3.2. A third of the panel, "
          "unvalidated", "Confidence"]],
        ["", "Do this", "Why", "Effect"],
        [16, 148, FULLW - 268, 104], aligns=["l", "l", "l"], hi={0, 1}))
    el.append(Spacer(1, 5))
    el.append(Paragraph(
        "<b>What this note does not cover.</b> Capex and fit-out are outside the workbook and "
        "outside this check. So is whether the membership proposition is additive to an existing "
        "HMO, which is a research question rather than a modelling one and is the largest single "
        "risk to the revenue line. The wellness catalogue prices have not been benchmarked "
        "against Abuja comparators; only the volumes have been challenged.", SMALL))

    doc.build(el)
    print("wrote %s" % OUT)


if __name__ == "__main__":
    build()
