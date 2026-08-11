"""
Build "Lyfe Place Abuja: Fit-out breakdown and revised forecast" PDF.

Two jobs:
  1. The full package-by-package fit-out breakdown, which the commercial model
     only carried at summary level.
  2. A rebuild of the whole forecast on the client's steer that the building is
     in good shape and needs interior decoration and some partitioning at most.

Three fit-out scenarios carried throughout:
  FULL CONVERSION  NGN 370M  (the original assumption: strip out, full rewire)
  REALISTIC        NGN 232M  (good-shape building, decoration and partitioning)
  LEAN             NGN 183M  (minimum to open, clinical flooring deferred)

Headline effect of the realistic case: total capital NGN 676M -> NGN 527M,
fixed cost base NGN 187M -> NGN 173.5M, break-even 5.7% -> 1.5% sessional fill,
payback 1.8 -> 1.3 years from stabilisation.

Companion to:
  docs/lyfeplace-abuja-commercial-model-cfa.pdf
  docs/lyfeplace-abuja-summary-cfa.pdf
Output: docs/lyfeplace-abuja-fitout-forecast-cfa.pdf

House style matches the CFA repo. Naira shown as NGN. No em dashes anywhere.

Run:
  python3 scripts/build-lyfeplace-abuja-fitout.py
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
OUT = DOCS / "lyfeplace-abuja-fitout-forecast-cfa.pdf"

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
MARGIN = 44
FULLW = PAGE_W - 2 * MARGIN

ss = getSampleStyleSheet()


def style(name, **kw):
    base = dict(fontName="Helvetica", fontSize=9.2, leading=12.6, textColor=BODY,
                alignment=TA_LEFT, spaceAfter=6)
    base.update(kw)
    return ParagraphStyle(name, **base)


EYEBROW = style("eyebrow", fontName="Helvetica-Bold", fontSize=8.4, leading=11,
                textColor=GOLD, spaceAfter=2)
H1 = style("h1", fontName="Helvetica-Bold", fontSize=13.5, leading=17, textColor=NAVY,
           spaceBefore=8, spaceAfter=6)
H2 = style("h2", fontName="Helvetica-Bold", fontSize=10, leading=13, textColor=TEAL,
           spaceBefore=8, spaceAfter=3)
P = style("p")
LEDE = style("lede", fontSize=10, leading=14.5, textColor=HexColor("#374151"))
SMALL = style("small", fontSize=7.8, leading=10.5, textColor=MUTED)
CELL = style("cell", fontSize=8.4, leading=11)
CELL_R = style("cellr", fontSize=8.4, leading=11, alignment=2)
CELL_B = style("cellb", fontSize=8.4, leading=11, fontName="Helvetica-Bold", textColor=NAVY)
CELL_BR = style("cellbr", fontSize=8.4, leading=11, fontName="Helvetica-Bold",
                textColor=NAVY, alignment=2)
CELL_W = style("cellw", fontSize=8.4, leading=11, fontName="Helvetica-Bold", textColor=white)
CELL_WR = style("cellwr", fontSize=8.4, leading=11, fontName="Helvetica-Bold",
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
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 20,
                      "Fit-out breakdown and revised forecast  /  Consult for Africa")
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
        ("LINEBELOW", (0, 0), (-1, 0), 1.6, GOLD),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 3.6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3.6),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
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


def build():
    doc = BaseDocTemplate(
        str(OUT), pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN, topMargin=42, bottomMargin=30,
        title="Lyfe Place Abuja - Fit-out breakdown and revised forecast",
        author="Consult for Africa",
    )
    doc.addPageTemplates([PageTemplate(
        id="p", frames=[Frame(MARGIN, 30, FULLW, PAGE_H - 42 - 30, id="f")],
        onPage=page_bg)])

    el = []

    el.append(Paragraph("Fit-out breakdown and revised forecast",
                        style("t", fontName="Helvetica-Bold", fontSize=18, leading=21,
                              textColor=NAVY, spaceAfter=2)))
    el.append(Paragraph("Rebuilt on a building in good shape.",
                        style("st", fontName="Helvetica-Oblique", fontSize=10.5, leading=13,
                              textColor=GOLD, spaceAfter=8)))

    # ---------- 01 ----------
    sec(el, "01", "THE REVISED BASIS", "What changed, and what it is worth.")
    el.append(Paragraph(
        "The NGN 370M fit-out in the commercial model assumed a full conversion: strip out, full "
        "rewire, structural and roof repairs, new ceilings throughout. On the steer that the "
        "property is sound and needs interior decoration and some partitioning at most, the whole "
        "forecast rebuilds. Three cases are carried through this note.", LEDE))
    el.append(tbl(
        [["Building fit-out element", "241", "148", "121"],
         ["Per sqm across 711 sqm gross", "339,000", "208,000", "170,000"],
         ["PropCo fit-out, all in", "370", "232", "183"]],
        ["NGN M unless stated", "Full conversion", "Realistic", "Lean"],
        [200, 106, 100, 101], total_row=True, hi={1}))
    el.append(Spacer(1, 5))
    el.append(card(
        "<b>Plan on the realistic case.</b> It takes roughly NGN 138M off the fit-out against a full "
        "conversion, and the lean case is what you fall back to if the head lease cannot be extended "
        "beyond two years. This note covers the fit-out only. Capital, cost base, payback and the "
        "five-year outlook are in the companion engagement note, which carries the Mezo management "
        "fee and the current space plan.", bg=PANEL))

    # ---------- 02 ----------
    sec(el, "02", "THE BREAKDOWN", "Package by package.")
    el.append(Paragraph("A.  Building fit-out", H2))
    el.append(tbl(
        [["Cooling: about 28 split units, ceiling cassettes front of house", "34", "24", "22"],
         ["ICT: cabling, network, CCTV, access control, emergency call, room-status displays",
          "17", "15", "14"],
         ["Electrical: distribution boards, solar and grid load zoning, medical circuits, "
          "emergency lighting", "30", "14", "12"],
         ["Joinery: reception desk, nurse stations, room casework, storage", "21", "14", "11"],
         ["Interior decoration: painting, window treatments, soft finishes", "17", "12", "10"],
         ["Fire: detection, alarm, escape lighting, extinguishers", "14", "9", "8"],
         ["Clinical flooring: welded and coved vinyl, clinical areas only", "23", "9", "4"],
         ["Ceilings and lighting", "19", "9", "6"],
         ["Partitioning: subdivide two living rooms, no wall removal", "in enabling", "8", "8"],
         ["Procedure room: scrub and clinical services", "9", "7", "6"],
         ["Signage and wayfinding", "in painting", "7", "4"],
         ["Mechanical fresh air and extract", "7", "6", "5"],
         ["Plumbing: clinical hand-wash points, condensate runs", "11", "6", "5"],
         ["Doors and ironmongery", "13", "5", "3"],
         ["Medical waste holding and route", "4", "3", "3"],
         ["Enabling: strip out, structural and roof repairs", "22", "nil", "nil"],
         ["Building fit-out", "241", "148", "121"]],
        ["Package", "Full", "Realistic", "Lean"],
        [281, 62, 66, 58], total_row=True))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "Per sqm across 711 sqm gross: <b>NGN 339,000</b> full, <b>NGN 208,000</b> realistic, "
        "<b>NGN 170,000</b> lean. A light-touch clinical conversion in Nigeria sits at NGN 180,000 "
        "to NGN 250,000 per sqm, so the realistic case lands mid-range and the lean case is at the "
        "floor of what is deliverable.", P))

    el.append(Paragraph("B.  Everything else", H2))
    el.append(tbl(
        [["Building fit-out, from A", "241", "148", "121"],
         ["FF&E: 8 consulting rooms, FUE suite, procedure, reception, waiting, lounge",
          "32", "30", "26"],
         ["External: car park, lighting, drainage, gate house, perimeter", "26", "10", "6"],
         ["Water: treatment, storage, pressure, hot water", "10", "5", "3"],
         ["Design, M&E consultant, project management, approvals", "22", "14", "10"],
         ["Contingency", "40 at 12%", "25 at 12%", "17 at 10%"],
         ["PropCo fit-out total", "370", "232", "183"]],
        ["Package", "Full", "Realistic", "Lean"],
        [281, 62, 66, 58], total_row=True))
    el.append(Spacer(1, 5))
    el.append(Paragraph("C.  Also Medbury cash, different entities", H2))
    el.append(tbl(
        [["Medbury Diagnostics unit: benching, safety cabinets, reagent cold chain, "
          "specimen reception", "34", "28", "24"],
         ["Medbury Pharmaceuticals unit: dispensing counter, controlled drugs store, "
          "shelving, cold chain", "29", "24", "20"],
         ["Total Medbury fit-out cash", "433", "284", "227"]],
        ["Package", "Full", "Realistic", "Lean"],
        [281, 62, 66, 58], total_row=True))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "<b>Not Medbury's cash.</b> Radiology shielding, room and equipment sit under Medbury "
        "Diagnostics' arrangement with the imaging partner. Medlyfe funds its own guest chalet "
        "clinical fit-out at roughly NGN 35M. The 25KVA hybrid power system is a separate NGN 33M "
        "line and is not inside any figure above.", P))

    # ---------- 03 ----------
    sec(el, "03", "WHAT DOES NOT REDUCE", "Good building condition helps less than it looks.")
    el.append(Paragraph(
        "Six packages are driven by the change of use, not by the state of the building. They "
        "total <b>NGN 75M in the realistic case, half the building fit-out</b>, and they would be "
        "the same in a brand new house.", P))
    el.append(tbl(
        [["Cooling", "24", "A four-bedroom house has six to eight units. A campus needs about 28"],
         ["ICT", "15", "Access control, CCTV, emergency call and clinical-grade cabling do not "
                        "exist in a house"],
         ["Fire", "9", "Detection, alarm and escape lighting to commercial standard"],
         ["Partitioning", "8", "Bedrooms and living rooms are not consulting rooms"],
         ["Fresh air", "6", "Split units recirculate. Clinical spaces need mechanical ventilation"],
         ["Medical waste", "3", "A compliant holding area and route, outside clinical space"],
         ["", "75", ""]],
        ["Package", "NGN M", "Why building condition is irrelevant"],
        [92, 52, 323], total_row=True, aligns=["r", "l"]))
    el.append(Spacer(1, 5))
    el.append(card(
        "<b>No nurse call system.</b> Nurse call is inpatient infrastructure: bedside bells, corridor "
        "domes and a central annunciator, for patients who are in a bed and cannot walk. This is an "
        "ambulatory centre where every patient is either with a clinician or in a waiting area, so "
        "the spec is wrong for the building. What replaces it is a hardwired <b>emergency call button "
        "in each clinical room and an emergency pull cord in every WC</b>, which is a safety floor "
        "and probably a licensing requirement, plus <b>room-status displays</b>. Everything else that "
        "a nurse call system would have done, chaperone requests, specimen collection, next-patient "
        "calls and room turnaround, belongs in the EMR or the staff app. The roughly NGN 3M saved on "
        "hardware is reallocated to the emergency call circuit and the room-status displays rather "
        "than taken out, so the ICT line is unchanged.", bg=PANEL))
    el.append(Spacer(1, 5))
    el.append(card(
        "<b>The electrical line is the one to watch.</b> I have cut it from NGN 30M to NGN 14M on "
        "the assumption that existing wiring is serviceable. But a residential incoming supply and "
        "distribution board will not carry 28 air conditioning units plus imaging plus a "
        "laboratory. The incoming capacity, the main board and the load zoning for solar all need "
        "upgrading whatever condition the wiring is in. If the supply turns out to be undersized, "
        "this line goes back toward NGN 30M on its own.", bg=ALERT, rule=RUST))

    # ---------- 04 ----------
    sec(el, "04", "WHERE IT LANDS", "How the fit-out sits in the capital plan.")
    el.append(Paragraph(
        "Under the current space plan, Medbury Diagnostics and Medbury Pharmaceuticals occupy the "
        "guest chalet and the boys' quarters, so the fit-out splits three ways by who funds it. The "
        "package rates in section 02 are the method; these are the totals they produce.", P))
    el.append(tbl(
        [["PropCo: the main building, 563 sqm gross", "208"],
         ["Medbury Diagnostics: chalet conversion, laboratory, and the imaging suite in the main "
          "building", "75"],
         ["Medbury Pharmaceuticals: boys' quarters conversion and dispensary", "38"],
         ["Total Medbury fit-out cash", "321"]],
        ["Funded by", "NGN M"], [407, 60], total_row=True))
    el.append(Spacer(1, 5))
    el.append(Paragraph(
        "Converting two outbuildings costs more than fitting the same functions inside the main "
        "house, which is why the diagnostics and pharmacy lines are higher than they were when both "
        "sat on the ground floor. It is the right trade: it frees the ground floor for the Conversion "
        "Clinic and it puts the laboratory and the dispensary where they belong, out of the patient "
        "route.", P))

    # ---------- 05 ----------
    sec(el, "05", "CONDITIONS", "What would move the fit-out number.")
    el.append(tbl(
        [["Incoming electrical supply undersized",
          "+NGN 16M", "The single most likely overrun. A residential supply will not carry 28 AC "
                      "units, imaging and a laboratory"],
         ["Structure found on opening walls for partitioning",
          "+NGN 10 to 22M", "The enabling package returns. Cannot be known until walls are opened"],
         ["Roof condition, before the rains",
          "+NGN 8 to 15M", "Not visible from a walk-through. Worth a specific inspection"],
         ["No functioning borehole or storage",
          "+NGN 8M", "The water line assumes existing infrastructure is serviceable"],
         ["Ceilings not sound",
          "+NGN 10M", "Ceilings and lighting was cut from 19 to 9 on the assumption they stay"]],
        ["Risk", "Effect", "Note"],
        [150, 76, 241], aligns=["r", "l"]))
    el.append(Spacer(1, 5))
    el.append(card(
        "<b>The head lease condition still holds.</b> A lower fit-out softens it but does not remove "
        "it. NGN 321M amortised over two years is NGN 161M a year against a campus that produces "
        "NGN 282M of revenue in year one. Over a five plus five it is NGN 32M. Five plus five remains "
        "the condition before capital is released, and at this level of spend the case for phasing "
        "largely disappears: doing it in one pass avoids returning contractors to a trading clinical "
        "building.", bg=ALERT, rule=RUST))
    el.append(Spacer(1, 6))
    el.append(Paragraph("Before this is used to commit capital", H2))
    el.append(tbl(
        [["A quantity surveyor's take-off", "This is still the largest line in the project and the "
                                            "least verified. Every figure here is built up by "
                                            "package, not measured"],
         ["An electrical load assessment", "Incoming supply capacity and main board rating against "
                                           "a 38kW average and 55kW peak"],
         ["A condition survey", "Roof, ceilings, wiring age, borehole and storage. Confirms or "
                                "removes the assumptions this note rests on"],
         ["Confirmation of the areas", "Measured from the as-built PDFs at about 711 sqm gross. "
                                       "Every per sqm figure re-bases if the CAD differs"]],
        ["What", "Why"], [150, 317], aligns=["l"]))
    el.append(Spacer(1, 8))
    el.append(card(
        "<b>Debo Odulana</b> &nbsp; Consult for Africa &nbsp; / &nbsp; +234 913 813 8553 &nbsp; / "
        "&nbsp; hello@consultforafrica.com", bg=NAVY, fg=white))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "Fit-out figures are built up by package at Nigerian clinical rates and are estimates, not "
        "a take-off. The realistic case rests on the steer that the building is structurally sound "
        "and needs decoration and partitioning at most, which a condition survey should confirm. "
        "Not a binding offer, and not legal or tax advice. FX USD/NGN 1,550.", SMALL))

    doc.build(el)
    print("wrote %s" % OUT)


if __name__ == "__main__":
    build()
