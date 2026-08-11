"""
Build "Lyfe Place Abuja: Rate and area assumptions" PDF.

A reference note, not a proposal. Records the per sqm assumptions behind the
Lyfe Place Abuja model so they can be lifted into later business planning for
the Medbury Medical Infrastructure Division.

Structure recorded here:
  Medbury Healthcare Group
    -> Medical Infrastructure Division
       -> LYFE PLACE ABUJA, a medical park
          GROUND FLOOR  Alameda / Medbury Conversion Clinic SPV
          FIRST FLOOR   Rentable private clinic business (Harley Street model,
                        The Cloister membership)
          SUPPORT       Medbury Diagnostics (lab + imaging), Medbury Pharmaceuticals
          CHALET        Medlyfe longevity and infusion
          BQ            Back of house

Key methodological point: a single service-charge-per-sqm figure does not work
for a park with a sessional floor. Recovery runs three different ways, and the
meaningful headline is yield per LET-BEARING sqm (NGN 1.73M/sqm/yr), not per
gross or per net internal sqm.

Output: docs/lyfeplace-rate-assumptions-cfa.pdf

House style matches the CFA repo. Naira shown as NGN. No em dashes anywhere.

Run:
  python3 scripts/build-lyfeplace-rate-assumptions.py
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
OUT = DOCS / "lyfeplace-rate-assumptions-cfa.pdf"

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
MONO = style("mono", fontName="Courier", fontSize=8.4, leading=12, textColor=NAVY)
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
                      "Rate and area assumptions  /  Medical Infrastructure Division")
    c.setFillColor(GOLD)
    c.rect(MARGIN, 26, 20, 2, fill=1, stroke=0)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 7.4)
    c.drawString(MARGIN, 15, "Reference note  /  Consult for Africa for Medbury Healthcare Group")
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
        title="Lyfe Place Abuja - Rate and area assumptions",
        author="Consult for Africa",
    )
    doc.addPageTemplates([PageTemplate(
        id="p", frames=[Frame(MARGIN, 30, FULLW, PAGE_H - 42 - 30, id="f")],
        onPage=page_bg)])

    el = []

    el.append(Paragraph("Rate and area assumptions",
                        style("t", fontName="Helvetica-Bold", fontSize=18, leading=21,
                              textColor=NAVY, spaceAfter=2)))
    el.append(Paragraph("Reference note for the Medical Infrastructure Division.",
                        style("st", fontName="Helvetica-Oblique", fontSize=10.5, leading=13,
                              textColor=GOLD, spaceAfter=8)))

    # ---------- 01 ----------
    sec(el, "01", "WHERE THIS SITS", "Lyfe Place Abuja, and what it is.")
    el.append(Paragraph(
        "Lyfe Place Abuja is a Medbury Healthcare expression under the <b>Medical Infrastructure "
        "Division</b>. A medical park, not a clinic Medbury staffs. Two businesses occupy it, one "
        "per floor, with Medbury Diagnostics and Medbury Pharmaceuticals supporting both.", LEDE))
    el.append(tbl(
        [["Ground floor", "Alameda / Medbury Conversion Clinic SPV",
          "Medical tourism conversion. Blended annual licence"],
         ["First floor", "Rentable private clinic business",
          "The Harley Street model and The Cloister membership. Sold by the session"],
         ["Ground floor support", "Medbury Diagnostics, laboratory and imaging",
          "Serves both floors. Facility, not a tenant"],
         ["Ground floor support", "Medbury Pharmaceuticals",
          "Serves both floors. Facility, not a tenant"],
         ["Guest chalet", "Medlyfe longevity and infusion",
          "Conventional lease, own entrance"],
         ["Boys' quarters", "Back of house",
          "Staff, records, medical waste holding, plant"]],
        ["Where", "Who", "Basis"],
        [86, 168, 213], aligns=["l", "l"]))
    el.append(Spacer(1, 5))
    el.append(card(
        "The two floors are different businesses with different economics, and that is the point. "
        "The ground floor is a single anchor licence, contracted and predictable. The first floor is "
        "a sessional business that yields several times a conventional lease on the same square "
        "metre. Diagnostics and pharmacy capture value from both, and Medbury owns them outright.",
        bg=PANEL))

    # ---------- 02 ----------
    sec(el, "02", "AREA BASIS", "Measure from let-bearing, not from gross.")
    el.append(tbl(
        [["Gross external", "711", "Measured from the as-built drawings"],
         ["Net internal, at 87%", "619", "After wall thicknesses"],
         ["Let-bearing", "288", "47% of net internal. The only space that carries a rate"],
         ["Facility", "331", "53%. Diagnostics, pharmacy, reception, waiting, circulation, "
                             "doctors' lounge, back of house"]],
        ["Area", "sqm", "Note"],
        [116, 60, 291], aligns=["r", "l"], hi={2}))
    el.append(Spacer(1, 5))
    el.append(Paragraph(
        "<b>47% let-bearing is the number to carry forward.</b> A purpose-built medical block runs "
        "at 75% to 80%. A converted residential property that also houses its own diagnostics and "
        "pharmacy runs at 45% to 50%. Any future park should be planned on the lower figure unless "
        "it is purpose-built, because it is the single biggest driver of the rate per let sqm.", P))
    el.append(tbl(
        [["Conversion Clinic SPV, exclusive demise", "46"],
         ["First floor: 8 consulting rooms, FUE suite, procedure room", "162"],
         ["Medlyfe, guest chalet", "80"],
         ["Total let-bearing", "288"]],
        ["Let-bearing space", "sqm"], [407, 60], total_row=True))

    # ---------- 03 ----------
    sec(el, "03", "THE RECOVERY ROUTES", "One service charge per sqm does not work here.")
    el.append(Paragraph(
        "This is the methodological point worth carrying into any future park. Annual operating "
        "cost is NGN 92M. Divided across 288 let-bearing sqm that is NGN 319,000 per sqm, which is "
        "an unlettable number. Divided across 619 net internal sqm it is NGN 149,000, which "
        "under-recovers. Neither is right, because <b>the three occupier types recover cost in "
        "three different ways</b>.", P))
    el.append(tbl(
        [["Conversion Clinic SPV", "46", "Blended annual licence, rent and services in one figure",
          "132.0"],
         ["First floor sessional", "162", "Per block. Recovery is inside the tariff", "337.1"],
         ["Medlyfe, chalet", "80", "Conventional lease, NGN per sqm all-in", "36.5"],
         ["Total", "288", "", "499.4"]],
        ["Occupier", "sqm", "How cost is recovered", "NGN M / yr"],
        [110, 42, 235, 80], total_row=True, aligns=["r", "l", "r"]))
    el.append(Spacer(1, 5))
    el.append(card(
        "<b>The meaningful headline is yield per let-bearing sqm: NGN 1.73M per sqm per year.</b> "
        "Cost is NGN 602,000 per let-bearing sqm, so margin is about NGN 1.13M per sqm. Use that "
        "ratio for planning, not a service charge per sqm, and never quote a market service charge "
        "comparable in a building with a sessional floor.", bg=PANEL))
    el.append(PageBreak())

    # ---------- 04 ----------
    sec(el, "04", "RATE CARD", "The assumptions, and where each comes from.")
    el.append(Paragraph("Conventional leases", H2))
    el.append(tbl(
        [["Premium medical suite", "270,000 to 300,000", "105,000 to 125,000", "375,000 to 425,000"],
         ["Wellness and longevity, chalet", "331,000", "125,000", "456,000"],
         ["Diagnostic provider, if ever external", "300,000 to 340,000", "105,000 to 125,000",
          "405,000 to 465,000"],
         ["Pharmacy, if ever external", "340,000 to 375,000", "105,000 to 125,000",
          "445,000 to 500,000"]],
        ["Category, NGN / sqm / yr", "Base rent", "Service charge", "All in"],
        [153, 104, 104, 106]))
    el.append(Spacer(1, 4))
    el.append(Paragraph("Sessional tariff, first floor", H2))
    el.append(tbl(
        [["Weekday early, 07:00 to 09:00", "2 hours", "44,000", "35%"],
         ["Weekday daytime, non-drive days", "4 hours", "61,000", "35%"],
         ["Weekday evening, 17:00 to 21:00", "4 hours", "94,000", "55%"],
         ["Saturday", "3.3 hours", "83,000", "45%"],
         ["Procedure room", "per session", "248,000", "n/a"],
         ["Guest and ad hoc", "any band", "about 2x member", "n/a"]],
        ["Band", "Block", "NGN per block", "Assumed fill"],
        [180, 78, 104, 105]))
    el.append(Spacer(1, 4))
    el.append(Paragraph("Conversion Clinic SPV, blended licence", H2))
    el.append(tbl(
        [["Rent, priority rooms and MDT room", "38.75", "25,000"],
         ["Facility and services, laboratory, imaging and pharmacy included", "93.25", "60,000"],
         ["Blended annual licence. Ask 132, floor 114", "132.00", "85,000"]],
        ["Component", "NGN M / yr", "USD / yr"],
        [267, 100, 100], total_row=True))
    el.append(Spacer(1, 5))
    el.append(Paragraph("Common terms", H2))
    el.append(tbl(
        [["Rent review", "12% a year, minimum, with market review every 5 years"],
         ["Lease term", "5 years firm plus a 5 year option"],
         ["Deposit", "6 months' rent plus 6 months' service charge"],
         ["Fit-out", "Tenant funded, subject to landlord approval"],
         ["Operating window", "07:00 to 21:00 Monday to Saturday, all tenants"],
         ["Payment", "12 months in advance for the SPV licence, in USD"]],
        ["Term", "Assumption"], [116, 351], aligns=["l"]))

    # ---------- 05 ----------
    sec(el, "05", "THE SESSIONAL INSIGHT", "The same metre, sold many times.")
    el.append(tbl(
        [["Consulting rooms, 8 at ~14 sqm", "112", "263.1", "2.35"],
         ["Procedure and treatment rooms", "50", "74.0", "1.48"],
         ["First floor blended", "162", "337.1", "2.08"],
         ["A conventional lease on the same space, at 425,000 all-in", "162", "68.9", "0.425"]],
        ["Basis", "sqm", "NGN M / yr", "NGN M / sqm"],
        [225, 60, 90, 92], hi={2}))
    el.append(Spacer(1, 5))
    el.append(card(
        "<b>Sessional letting yields 4.9x a conventional lease on the same square metre, at about "
        "39% fill.</b> A single consulting room produces roughly NGN 32.9M a year. That multiple, "
        "not the rent per sqm, is the reason a medical park works, and it is the assumption most "
        "worth stress-testing before any future site is committed. It is also validated against the "
        "Harley Street in Ikoyi model, which showed NGN 37M per room at 55% fill on Lagos rates.",
        bg=PANEL))
    el.append(PageBreak())

    # ---------- 06 ----------
    sec(el, "06", "DIVISION PLANNING ASSUMPTIONS", "Rules of thumb to reuse.")
    el.append(Paragraph(
        "These are the numbers to carry into a business plan for any future Medbury medical park, "
        "not just Abuja. Each is derived in this note or its companions.", P))
    el.append(tbl(
        [["Gross to net internal", "87%", "Wall thicknesses in a converted residential property"],
         ["Net internal to let-bearing", "45% to 50%",
          "Converted property with on-site diagnostics and pharmacy. Purpose-built runs 75% to 80%"],
         ["Yield per let-bearing sqm", "NGN 1.7M / yr",
          "At stabilisation, with a sessional floor and an anchor licence"],
         ["Cost per let-bearing sqm", "NGN 600,000 / yr", "Including rent and amortisation"],
         ["Sessional multiple over a lease", "4.9x", "At about 39% fill across four daily bands"],
         ["Per consulting room", "NGN 33M to 37M / yr", "Abuja to Lagos. Eight rooms is the first-floor ceiling with the FUE suite in place"],
         ["Conventional medical suite, all in", "NGN 375,000 to 460,000 / sqm / yr", ""],
         ["Light-touch clinical fit-out", "NGN 180,000 to 250,000 / sqm",
          "Sound building. Decoration, partitioning, cooling, ICT, fire, FF&amp;E"],
         ["Full conversion fit-out", "NGN 300,000 to 350,000 / sqm",
          "Strip out, rewire, structural and roof"],
         ["Capital intensity, all in", "NGN 740,000 / sqm gross",
          "Rent prepay, fees, fit-out, power and working capital"],
         ["Power", "NGN 39,000 / sqm gross / yr",
          "14 hours over 6 days, with hybrid solar carrying daytime load"],
         ["Rent review", "12% a year minimum", "Below Nigerian inflation but defensible"],
         ["Break-even test", "Fixed leases cover 90% to 100% of fixed cost",
          "Sessional and capture are margin, never the base case"]],
        ["Assumption", "Value", "Basis"],
        [141, 118, 208], aligns=["r", "l"]))
    el.append(Spacer(1, 5))
    el.append(card(
        "The last line is the discipline. <b>A park should be underwritten on its anchor leases "
        "alone.</b> If the fixed leases do not roughly cover the fixed cost base, the site is being "
        "bought on hope about sessional fill, which is the assumption most likely to be wrong.",
        bg=PANEL))

    # ---------- 07 ----------
    sec(el, "07", "ONE OPEN QUESTION", "How much of the ground floor the SPV actually takes.")
    el.append(Paragraph(
        "The ground floor has 201 sqm of usable space. Medbury Diagnostics needs 115 of it and "
        "Medbury Pharmaceuticals 40, which leaves 46 for the Conversion Clinic. Imaging cannot go "
        "upstairs: no lift, equipment weight, and lead shielding. So there are two readings of the "
        "SPV taking the ground floor.", P))
    el.append(tbl(
        [["A. Anchor, not sole occupier",
          "SPV demise is 46 sqm exclusive, rising to about 100 during drives. Diagnostics and "
          "pharmacy sit alongside as campus support serving both floors",
          "Recommended"],
         ["B. Full floor",
          "SPV takes all 201 sqm. Pharmacy relocates to the boys' quarters, laboratory moves "
          "upstairs, imaging stays on the ground floor inside the SPV demise",
          "Not recommended"]],
        ["Reading", "What it means", "View"],
        [116, 273, 78], aligns=["l", "l"]))
    el.append(Spacer(1, 5))
    el.append(card(
        "<b>Option B has a structural problem.</b> It puts Medbury Diagnostics' imaging suite, the "
        "highest-margin asset on the campus, inside a demise controlled by an entity Alameda holds "
        "51% of. That is precisely the exposure the wholly owned PropCo structure exists to "
        "prevent. Option A gives the SPV the ground floor as its clinical home and its identity, "
        "without handing a JV partner the landlord position over Medbury's own business.",
        bg=ALERT, rule=RUST))
    el.append(Spacer(1, 6))
    el.append(Paragraph("Still to verify", H2))
    el.append(tbl(
        [["Areas", "Measured from as-built PDFs. Confirm against the CAD. Every rate here re-bases "
                   "if the areas differ"],
         ["Sessional fill", "35% to 55% by band, borrowed from the Ikoyi model. Unvalidated for "
                            "Abuja and the largest single sensitivity"],
         ["Session rates", "Derived from the Ikoyi tariff less 10%. Should be tested against live "
                           "Med Lyfe room rates before launch"],
         ["Service charge inputs", "Power at a blended NGN 250 per kWh. Confirm from an AEDC bill"]],
        ["Input", "Status"], [116, 351], aligns=["l"]))
    el.append(Spacer(1, 8))
    el.append(card(
        "<b>Debo Odulana</b> &nbsp; Consult for Africa &nbsp; / &nbsp; +234 913 813 8553 &nbsp; / "
        "&nbsp; hello@consultforafrica.com", bg=NAVY, fg=white))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "A reference note, not a proposal and not a binding offer. Rates are assumptions to be "
        "tested against live comparables, a quantity surveyor's take-off and Medbury's own trading "
        "data. Companions: the commercial model, the two-page summary, and the fit-out and forecast "
        "note. FX USD/NGN 1,550.", SMALL))

    doc.build(el)
    print("wrote %s" % OUT)


if __name__ == "__main__":
    build()
