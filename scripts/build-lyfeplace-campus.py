"""
Build "Lyfe Place Abuja: the campus" PDF.

The definitive space and capacity map for the whole site: both floors of the main
building, the guest chalet and the boys' quarters. Room by room, from the as-built
drawings, with the right clinical use for each space.

Written with the conversion clinic paused, so the ground floor consulting rooms
return to general campus use. Areas are measured from the as-built PDFs and must
be confirmed against the CAD.

  MAIN BUILDING, GROUND   286 sqm gross, 182 sqm of rooms
                          Arrival, diagnostics and imaging, procedure, 2 consulting
  MAIN BUILDING, FIRST    277 sqm gross, 239 sqm of rooms
                          The private medical plaza: 7 consulting, FUE suite,
                          treatment room, lounge
  GUEST CHALET             96 sqm gross,  61 sqm of rooms
                          Medbury Diagnostics laboratory
  BOYS' QUARTERS           52 sqm gross,  37 sqm of rooms
                          Medbury Pharmaceuticals

  CAMPUS                  711 sqm gross, 519 sqm of rooms (73% efficiency)

Headline capacity: 9 consulting rooms, 1 FUE suite, 2 procedure rooms, against a
single-reception throughput ceiling of about 98 arrivals a day.

Output: docs/lyfeplace-abuja/lyfeplace-abuja-campus-cfa.pdf
House style matches the CFA repo. Naira shown as NGN. No em dashes.

Run:
  python3 scripts/build-lyfeplace-campus.py
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
OUT = DOCS / "lyfeplace-abuja-campus-cfa.pdf"

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
    base = dict(fontName="Helvetica", fontSize=9.0, leading=12.2, textColor=BODY,
                alignment=TA_LEFT, spaceAfter=6)
    base.update(kw)
    return ParagraphStyle(name, **base)


EYEBROW = style("eyebrow", fontName="Helvetica-Bold", fontSize=8.4, leading=11,
                textColor=GOLD, spaceAfter=2)
H1 = style("h1", fontName="Helvetica-Bold", fontSize=13.5, leading=17, textColor=NAVY,
           spaceBefore=7, spaceAfter=5)
H2 = style("h2", fontName="Helvetica-Bold", fontSize=10, leading=13, textColor=TEAL,
           spaceBefore=8, spaceAfter=3)
P = style("p")
LEDE = style("lede", fontSize=9.8, leading=14, textColor=HexColor("#374151"))
SMALL = style("small", fontSize=7.6, leading=10.2, textColor=MUTED)
CELL = style("cell", fontSize=8.1, leading=10.5)
CELL_R = style("cellr", fontSize=8.1, leading=10.5, alignment=2)
CELL_B = style("cellb", fontSize=8.1, leading=10.5, fontName="Helvetica-Bold", textColor=NAVY)
CELL_BR = style("cellbr", fontSize=8.1, leading=10.5, fontName="Helvetica-Bold",
                textColor=NAVY, alignment=2)
CELL_W = style("cellw", fontSize=8.1, leading=10.5, fontName="Helvetica-Bold", textColor=white)
CELL_WR = style("cellwr", fontSize=8.1, leading=10.5, fontName="Helvetica-Bold",
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
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 20, "The campus: space and capacity")
    c.setFillColor(GOLD)
    c.rect(MARGIN, 26, 20, 2, fill=1, stroke=0)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 7.4)
    c.drawString(MARGIN, 15, "Measured from the as-built drawings  /  Consult for Africa")
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
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 3.2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3.2),
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
        title="Lyfe Place Abuja - The campus",
        author="Consult for Africa",
    )
    doc.addPageTemplates([PageTemplate(
        id="p", frames=[Frame(MARGIN, 30, FULLW, PAGE_H - 42 - 30, id="f")],
        onPage=page_bg)])

    el = []
    el.append(Paragraph("The campus",
                        style("t", fontName="Helvetica-Bold", fontSize=18, leading=21,
                              textColor=NAVY, spaceAfter=2)))
    el.append(Paragraph("Every room, and what the building can actually carry.",
                        style("st", fontName="Helvetica-Oblique", fontSize=10.5, leading=13,
                              textColor=GOLD, spaceAfter=7)))

    # 01
    sec(el, "01", "FOUR STRUCTURES", "711 sqm gross, 519 sqm of usable rooms.")
    el.append(tbl(
        [["Main building, ground", "286", "182", "64%", "Arrival, diagnostics and imaging, "
          "procedure, consulting"],
         ["Main building, first", "277", "239", "86%", "The private medical plaza"],
         ["Guest chalet", "96", "61", "63%", "Medbury Diagnostics laboratory"],
         ["Boys' quarters", "52", "37", "72%", "Medbury Pharmaceuticals"],
         ["Campus", "711", "519", "73%", ""]],
        ["Structure", "Gross sqm", "Rooms sqm", "Efficiency", "Role"],
        [116, 60, 60, 56, 175], total_row=True))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "The difference between gross and rooms is walls, circulation, the staircase and the "
        "verandas. 73% is normal for a converted residential building and it is the number to plan "
        "on, not the 711.", P))
    el.append(Spacer(1, 3))
    el.append(card(
        "Areas are measured from the as-built PDFs. <b>Confirm against the CAD before anything is "
        "committed</b>, because every rate, capacity and cost figure in the whole document set "
        "re-bases if they are wrong.", bg=ALERT, rule=RUST))

    # 02
    sec(el, "02", "GROUND FLOOR", "286 sqm gross. Arrival, diagnostics, procedure.")
    el.append(tbl(
        [["Living Room", "Reception, waiting and concierge", "58.1", "Single arrival point for the "
          "whole campus. 16 to 18 seats at premium spacing"],
         ["Bedroom", "Clean procedure room and recovery bay", "24.7", "Level trolley access. The "
          "only space where sedation can be done"],
         ["Bedroom", "Consulting room", "19.3", "General campus use"],
         ["Kitchen", "Phlebotomy and specimen handling", "18.2", "Existing water and drainage"],
         ["Bedroom", "Digital X-ray, lead shielded", "14.1", "Ground floor is mandatory: weight, "
          "shielding, no lift"],
         ["Dining", "Ultrasound and echocardiography", "13.0", "Serves the plaza's cardiology and "
          "orthopaedic users"],
         ["Bedroom", "Counselling and small office", "10.4", "Too small for consulting at premium "
          "standard"],
         ["Bath", "Imaging reporting and control", "7.8", ""],
         ["Store", "Medication collection point", "6.0", "Pharmacy's patient-facing presence"],
         ["Bath x2, V.T", "Patient WCs", "10.4", "Emergency pull cords required"],
         ["", "", "182.1", ""]],
        ["As built", "Use", "sqm", "Note"],
        [76, 148, 42, 201], total_row=True))

    # 03
    sec(el, "03", "FIRST FLOOR", "277 sqm gross. The private medical plaza.")
    el.append(tbl(
        [["Living Room", "Consulting 1, 2 and 3, plus spine", "51.6", "New partitions. Three rooms "
          "of about 17 sqm off a central corridor"],
         ["Living Room", "Doctors' and members' lounge", "34.0", "At the head of the stairs. Part "
          "of what the membership buys"],
         ["Bedroom", "FUE hair transplant suite", "24.3", "All-day single-patient cases. Relieves "
          "the reception rather than loading it"],
         ["Playroom", "Consulting room 6", "22.4", "Was the MDT room. Returns to consulting with "
          "the conversion clinic paused"],
         ["Bedroom", "Consulting room 4", "19.8", "En-suite WC"],
         ["Bedroom", "Consulting room 5", "19.8", "En-suite WC"],
         ["Kitchen", "Treatment room", "14.8", "Local anaesthesia only. Existing water and drainage"],
         ["Bedroom", "Consulting room 7", "13.7", "Was the coordinator room"],
         ["Store", "Linen and consumables", "9.9", ""],
         ["Bath", "Sterilising", "9.4", "Existing water and drainage"],
         ["Bath", "Patient WC", "7.1", ""],
         ["Balcony", "Terrace, off the lounge", "6.2", "Amenity for members"],
         ["Bath", "Phlebotomy draw point", "5.7", "So first-floor patients do not go downstairs "
          "for bloods"],
         ["", "", "238.8", ""]],
        ["As built", "Use", "sqm", "Note"],
        [76, 148, 42, 201], total_row=True))

    # 04
    sec(el, "04", "GUEST CHALET", "96 sqm gross. Medbury Diagnostics laboratory.")
    el.append(tbl(
        [["Bed Room", "Laboratory, main", "16.2", "Benching and analysers"],
         ["Living Room", "Reporting office", "11.8", ""],
         ["Kitchen", "Laboratory, wet area", "11.5", "Existing water and drainage"],
         ["Bed Room", "Specimen reception and sorting", "11.4", "Receives from both phlebotomy "
          "points in the main building"],
         ["Bath", "Reagent cold chain and store", "5.4", ""],
         ["Bath", "Staff WC", "4.3", ""],
         ["", "", "60.7", ""]],
        ["As built", "Use", "sqm", "Note"],
        [76, 148, 42, 201], total_row=True))
    el.append(Spacer(1, 3))
    el.append(Paragraph(
        "The laboratory fills the chalet. There is no room left in it for anything else, which is "
        "why Medlyfe cannot also be housed there and needs a separate decision.", P))

    el.append(PageBreak())

    # 05
    sec(el, "05", "BOYS' QUARTERS", "52 sqm gross. Medbury Pharmaceuticals.")
    el.append(tbl(
        [["Bed Room", "Dispensary and stock", "16.9", "Dispensing bench and shelving"],
         ["Bed Room", "Product and skincare retail", "14.9", "Retail margin runs 40% to 60% and is "
          "a real line, not an afterthought"],
         ["Bath", "Controlled drugs store", "2.9", "Secure, with its own access control"],
         ["Bath", "Cold chain", "2.7", ""],
         ["", "", "37.4", ""]],
        ["As built", "Use", "sqm", "Note"],
        [76, 148, 42, 201], total_row=True))
    el.append(Spacer(1, 3))
    el.append(Paragraph(
        "Patients never come here. They collect from the medication point in the main building, "
        "which is the pharmacy's only patient-facing space. Dispensing, stock and cold chain all sit "
        "out of the way in a separate structure, which is the right arrangement for a campus this "
        "size.", P))

    # 06
    sec(el, "06", "WHAT THE CAMPUS CAN DO", "Capacity, at stabilisation.")
    el.append(tbl(
        [["Consulting rooms", "9", "7 on the first floor, 2 on the ground"],
         ["FUE hair transplant suite", "1", "One all-day case, so one arrival a day"],
         ["Procedure rooms", "2", "Treatment room upstairs at local only, clean procedure room "
          "downstairs with sedation"],
         ["Imaging modalities", "3", "Digital X-ray, ultrasound, echocardiography"],
         ["Phlebotomy points", "2", "One per floor"],
         ["Sessional blocks a year", "9,936", "9 rooms, 4 bands a day, 6 days, 46 weeks"],
         ["Blocks sold at 41% fill", "4,074", "Fill varies by band, 35% to 55%"],
         ["Consultations a year", "20,370", "At 5 patients a block"],
         ["Arrivals a day", "about 72", "Including procedure and FUE"]],
        ["Capacity", "Number", "Basis"], [148, 60, 259], hi={8}))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>About 72 arrivals a day against a single-reception ceiling of roughly 98.</b> That is "
        "real headroom, but not a great deal, and it assumes the two calendar rules hold: staggered "
        "start times in the early band, and timed arrival slots whenever the ground floor is running "
        "at volume.", bg=PANEL))

    # 07
    sec(el, "07", "WHAT CAPS IT", "Four constraints, in order of how hard they bind.")
    el.append(tbl(
        [["1", "One reception", "Seven to eight arrivals an hour sustained across the 14-hour "
          "window. This is the binding constraint on the whole campus and no amount of extra room "
          "capacity relieves it"],
         ["2", "No lift", "No sedation-dependent work above ground level, at any budget. A sedated "
          "patient must be evacuated horizontally on a trolley"],
         ["3", "Waiting area", "58 sqm carries 16 to 18 seats at premium spacing. Two waiting zones "
          "within it, so plaza patients and any high-volume clinic do not share seating"],
         ["4", "Ground floor imaging", "X-ray cannot move upstairs. Weight, lead shielding and "
          "evacuation all fix it to the ground floor, which constrains everything else placed there"]],
        ["", "Constraint", "What it means"], [20, 118, 329], aligns=["l", "l"]))
    el.append(Spacer(1, 5))
    el.append(card(
        "<b>The building supports a nine-room plaza with proper diagnostics, two procedure rooms and "
        "a hair transplant suite, and that is a serious facility.</b> What it will not support is a "
        "theatre, an inpatient bed, or a second high-volume clinic sharing the same front door. "
        "Those need either a lift, a modular unit on the grounds, or a different building.",
        bg=PANEL))
    el.append(Spacer(1, 6))
    el.append(card(
        "<b>Debo Odulana</b> &nbsp; Consult for Africa &nbsp; / &nbsp; +234 913 813 8553 &nbsp; / "
        "&nbsp; hello@consultforafrica.com", bg=NAVY, fg=white))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "Room areas are measured from the as-built PDFs supplied and are approximate. Confirm against "
        "the CAD. Fill and patients-per-block assumptions are carried from the Ikoyi model and remain "
        "unvalidated for Abuja. Not a binding offer.", SMALL))

    doc.build(el)
    print("wrote %s" % OUT)


if __name__ == "__main__":
    build()
