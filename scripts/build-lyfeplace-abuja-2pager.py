"""
Build the two-page Lyfe Place Abuja summary for Dr Itunu Akinware.

Answers only the three questions she actually asked:
  1. How will the ROI be confirmed against NGN 100M of prepaid rent?
  2. What do we charge Alameda per sqm?
  3. How do we lock them in long term, especially with the SPV agreement?

Page 2 carries the three corrections she needs to know, the two decisions only
she can make, the conditions precedent, and what still needs verifying.

Companion to the full note: docs/lyfeplace-abuja-commercial-model-cfa.pdf
Output: docs/lyfeplace-abuja-summary-cfa.pdf

House style matches the CFA repo. Naira shown as NGN. No em dashes anywhere.
FX reference: USD/NGN ~1,550.

Run:
  python3 scripts/build-lyfeplace-abuja-2pager.py
"""

from __future__ import annotations

from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import (
    BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer, Table, TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs" / "lyfeplace-abuja"
OUT = DOCS / "lyfeplace-abuja-summary-cfa.pdf"

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
    base = dict(fontName="Helvetica", fontSize=8.9, leading=11.5, textColor=BODY,
                alignment=TA_LEFT, spaceAfter=5)
    base.update(kw)
    return ParagraphStyle(name, **base)


Q = style("q", fontName="Helvetica-Bold", fontSize=11.6, leading=14, textColor=NAVY,
          spaceBefore=5, spaceAfter=3)
H2 = style("h2", fontName="Helvetica-Bold", fontSize=9.6, leading=12.6, textColor=TEAL,
           spaceBefore=7, spaceAfter=3)
P = style("p")
SMALL = style("small", fontSize=7.6, leading=10.2, textColor=MUTED)
CELL = style("cell", fontSize=8.1, leading=10.4)
CELL_R = style("cellr", fontSize=8.1, leading=10.4, alignment=2)
CELL_B = style("cellb", fontSize=8.1, leading=10.4, fontName="Helvetica-Bold", textColor=NAVY)
CELL_BR = style("cellbr", fontSize=8.1, leading=10.4, fontName="Helvetica-Bold",
                textColor=NAVY, alignment=2)
CELL_W = style("cellw", fontSize=8.1, leading=10.4, fontName="Helvetica-Bold", textColor=white)
CELL_WR = style("cellwr", fontSize=8.1, leading=10.4, fontName="Helvetica-Bold",
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
                      "Summary for Dr Itunu Akinware  /  Consult for Africa")
    c.setFillColor(GOLD)
    c.rect(MARGIN, 26, 20, 2, fill=1, stroke=0)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 7.4)
    c.drawString(MARGIN, 15, "Private and confidential  /  August 2026  /  "
                             "Full note: lyfeplace-abuja-commercial-model-cfa.pdf")
    c.drawRightString(PAGE_W - MARGIN, 15, "Page %d of 2" % doc.page)
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


def tbl(rows, labels, widths, total_row=False, aligns=None):
    ncols = len(labels)
    if aligns is None:
        aligns = ["r"] * (ncols - 1)
    data = [[Paragraph(labels[0], CELL_W)] +
            [Paragraph(t, CELL_WR if aligns[j] == "r" else CELL_W)
             for j, t in enumerate(labels[1:])]]
    for i, r in enumerate(rows):
        emph = total_row and i == len(rows) - 1
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
        ("TOPPADDING", (0, 0), (-1, -1), 3.4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3.4),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("ROWBACKGROUNDS", (0, 1), (-1, -2 if total_row else -1), [white, SURFACE]),
    ]
    if total_row:
        st.append(("BACKGROUND", (0, -1), (-1, -1), CREAM))
        st.append(("LINEABOVE", (0, -1), (-1, -1), 1, GOLD))
    t.setStyle(TableStyle(st))
    return t


def build():
    doc = BaseDocTemplate(
        str(OUT), pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN, topMargin=42, bottomMargin=30,
        title="Lyfe Place Abuja - Summary for Dr Itunu Akinware",
        author="Consult for Africa",
    )
    doc.addPageTemplates([PageTemplate(
        id="p", frames=[Frame(MARGIN, 30, FULLW, PAGE_H - 42 - 30, id="f")],
        onPage=page_bg)])

    el = []

    # ---------- TITLE ----------
    el.append(Paragraph("Lyfe Place Abuja",
                        style("t", fontName="Helvetica-Bold", fontSize=19, leading=22,
                              textColor=NAVY, spaceAfter=2)))
    el.append(Paragraph("Your three questions, answered.",
                        style("st", fontName="Helvetica-Oblique", fontSize=11, leading=14,
                              textColor=GOLD, spaceAfter=5)))

    # ---------- Q1 ROI ----------
    el.append(Paragraph("1.  How is the ROI confirmed against NGN 100M of prepaid rent?", Q))
    el.append(Paragraph(
        "The ground floor is a conversion hub Alameda anchors on 67 drive days, with the other 209 "
        "sellable to other international groups.", P))
    el.append(tbl(
        [["Conversion hub, 137 drive days at NGN 2.0M", "274.0"],
         ["Sessional programme, 5 consulting rooms", "164.4"],
         ["Memberships at 60 x NGN 2.5M", "150.0"],
         ["Day case theatre, ground level", "62.1"],
         ["Procedure room, first floor", "29.8"],
         ["Campus revenue at stabilisation", "680.3"]],
        ["Stabilised, NGN M / yr", "Amount"],
        [391, 120], total_row=True))
    el.append(Spacer(1, 3))
    el.append(card(
        "<b>The conversion hub is the largest single line, not the plaza.</b> The first floor is "
        "deliberately not room-maximised: 5 consulting rooms, a procedure room, the FUE suite, a "
        "lounge at the head of the stairs and a coordinator room. The lounge earns nothing directly "
        "and is what makes the memberships and the hub sellable.", bg=PANEL))
    el.append(Spacer(1, 4))
    el.append(tbl(
        [["Net contribution to Medbury", "(41)", "471", "833"],
         ["Payback on NGN 403.5M, route B", "3.4 yrs", "2.4 yrs", "2.1 yrs"]],
        ["NGN M", "Downside", "Base", "Upside"], [239, 90, 90, 92]))
    el.append(Spacer(1, 3))
    el.append(Paragraph(
        "The downside halves sessional fill and cuts capture by 40%, and still returns. "
        "<b>This is a leasing risk, not an operating risk.</b>", P))

    # ---------- Q2 ALAMEDA ----------
    el.append(Paragraph("2.  What do we charge Alameda per sqm?", Q))
    el.append(Paragraph(
        "Not per sqm. Two rooms at market rate is NGN 12M a year, nowhere near the load 15 to 20 "
        "visiting specialists place on the building. Charge one blended figure for their window, "
        "09:00 to 17:00 Monday to Friday, with the on-site laboratory, imaging and pharmacy "
        "included in the offer rather than charged separately.", P))
    el.append(tbl(
        [["Rent, priority rooms and MDT room", "38.75", "25,000"],
         ["Facility and services, laboratory, imaging and pharmacy included", "93.25", "60,000"],
         ["Blended annual charge", "132.00", "85,000"]],
        ["Component", "NGN M / yr", "USD / yr"], [271, 120, 120], total_row=True))
    el.append(Spacer(1, 3))
    el.append(Paragraph(
        "The rent line takes their entire stated USD 25,000 property budget, at market for the "
        "demise so it survives an arm's length test. The service charge is a separate cost centre, "
        "so \"the budget is spent\" is not available to them. No drive fee, no marketing line, no "
        "throughput charge. Twelve months in advance in USD, escalating 12%. Four rooms during "
        "drives, capped at 56 consultations a day. <b>NGN 132M is the ask, NGN 114M the floor.</b>", P))
    el.append(Spacer(1, 2))
    el.append(card(
        "<b>One thing to hold in mind.</b> This is billed to the joint venture, which Medbury owns "
        "49% of, so the net transfer from Alameda is nearer NGN 67M than NGN 132M. That is why the "
        "clause routing every user's diagnostics to Medbury Diagnostics and prescriptions to "
        "Medbury Pharmaceuticals is worth more than the rent negotiation. Capture is 100% Medbury's.",
        bg=ALERT, rule=RUST))

    # ---------- Q3 LOCK-IN ----------
    el.append(Paragraph("3.  How do we lock them in through the SPV?", Q))
    el.append(Paragraph(
        "<b>The property never enters the joint venture.</b> It stays in a wholly owned Medbury "
        "PropCo and the JV is a tenant paying market rate rent. On that basis 49% is tolerable, "
        "and five amendments do the locking.", P))
    el.append(tbl(
        [["1", "Delete clause 24.I",
          "Termination for convenience on 30 days' notice, against two years of prepaid rent and "
          "NGN 284M of fit-out. The most dangerous line in the document"],
         ["2", "Break fee",
          "Unamortised fit-out plus remaining head rent on early exit. Today there is no route to "
          "recover a naira"],
         ["3", "Define the reserved matters",
          "Clause 6(g) refers to them and never defines them. A Medbury veto over budget, capex, "
          "borrowing, new shares and the MD appointment"],
         ["4", "Mutual non-solicitation",
          "No non-compete: it clashes with the independent specialists upstairs and would lock "
          "Medbury out of other conversion partnerships. Protect relationships, not a market"],
         ["5", "Deadlock mechanism",
          "There is none. Escalation, then a shoot-out, with the property expressly carved out"]],
        ["", "Amendment", "Why it matters"], [18, 122, 371], aligns=["l", "l"]))

    # ================= PAGE 2 =================
    from reportlab.platypus import PageBreak
    el.append(PageBreak())

    el.append(Paragraph("Three things you should know before you decide",
                        style("t2", fontName="Helvetica-Bold", fontSize=14, leading=17,
                              textColor=NAVY, spaceAfter=6)))
    el.append(tbl(
        [["The building", "1,235 sqm", "About 711 sqm gross, 520 net lettable. Measured from the "
                                       "as-built drawings"],
         ["Total capital", "About NGN 185M", "About NGN 527M on a light-touch fit-out"],
         ["Fit-out", "NGN 35M to 40M", "NGN 284M. On a sound building this is decoration, "
                                       "partitioning, cooling, ICT, fire and FF&amp;E, not a "
                                       "conversion. Breakdown in the companion note"]],
        ["Item", "Currently assumed", "Corrected"], [86, 108, 317], aligns=["l", "l"]))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "None of this stops the project. The corrected capital still pays back inside four years on "
        "the base case. But it should be the number in front of the board, not NGN 185M.", P))
    el.append(Spacer(1, 2))
    el.append(card(
        "<b>Run both.</b> The facility view is what tenants see and it is the better pitch. The "
        "tenant view stays in the management accounts: it costs nothing, it shows whether "
        "diagnostics earns its 115 sqm, and it keeps pricing arm's length for FIRS and for any "
        "future investor in PropCo.", bg=SURFACE))

    el.append(Paragraph("Two decisions only you can make", Q))
    el.append(Paragraph(
        "<b>One. Extend the head lease to five plus five before any fit-out money moves.</b> "
        "NGN 284M over two years is NGN 142M a year of amortisation, which pushes break-even to 36% "
        "sessional fill and removes the entire margin of safety. Over five plus five it is NGN 28M "
        "and the campus carries it comfortably. The lower fit-out softens this but does not remove "
        "it.", P))
    el.append(Paragraph(
        "<b>Two. Whether to sign a joint venture that names medical tourism conversion as its "
        "purpose and provides no mechanism to be paid for it.</b> No referral fee, no revenue "
        "share, no volume commitment, no audit right anywhere in the twenty-three pages. The "
        "treatment revenue lands in Cairo, where Medbury participates in nothing. That may be an "
        "acceptable trade for the patient flow, but it should be a decision, not an oversight.", P))

    el.append(Paragraph("Before money moves", Q))
    el.append(tbl(
        [["Change of use approval, plus the landlord's written consent",
          "Before the NGN 115M rent and fees are paid"],
         ["Head lease at five plus five, with a reinstatement waiver",
          "Before any fit-out capital is released"],
         ["MDCN temporary registration for the Egyptian specialists",
          "No certificate, no room key. Medbury's licence is what is at risk"],
         ["NNRA radiation licence and lead shielding",
          "Before imaging installs"]],
        ["Condition precedent", "Trigger"], [285, 226], aligns=["l"]))

    el.append(Paragraph("What we still need to verify", Q))
    el.append(tbl(
        [["Building areas", "Measured from the as-built PDFs. Confirm against the CAD, because "
                            "everything re-bases if it is wrong"],
         ["Electricity tariff", "Modelled at a blended NGN 250 per kWh. Confirm from an actual "
                                "AEDC bill"],
         ["Fit-out at NGN 284M", "Rests on the building being sound. Needs a condition survey, an "
                                 "electrical load assessment and a QS take-off"],
         ["Sessional fill, 35% to 55%", "Borrowed from the Ikoyi model and unvalidated for Abuja. "
                                        "The largest single sensitivity in the model"]],
        ["Input", "Status"], [140, 371], aligns=["l"]))

    el.append(Paragraph("Next, in this order", Q))
    el.append(tbl(
        [["1", "The landlord", "Five plus five, change of use consent, fit-out recognition. "
                               "Nothing else can be committed until this lands"],
         ["2", "Alameda", "The blended charge, the four-room cap, first call on diagnostics and "
                          "pharmacy, and the five amendments"],
         ["3", "Medbury Diagnostics", "Confirm the combined laboratory and imaging demise, and "
                                      "appoint the radiology partner underneath it"],
         ["4", "Medlyfe", "Confirm the guest chalet lease. It is the fourth of the four leases "
                          "that carry the campus"]],
        ["", "Who", "What"], [18, 108, 385], aligns=["l", "l"]))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "Both fixed leases are unsigned and Medlyfe has not been approached. Alongside the head "
        "lease term, that is the critical path and the whole of the risk.", P))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>Debo Odulana</b> &nbsp; Consult for Africa &nbsp; / &nbsp; +234 913 813 8553 &nbsp; / "
        "&nbsp; hello@consultforafrica.com", bg=NAVY, fg=white))
    el.append(Spacer(1, 3))
    el.append(Paragraph(
        "Estimates, to be set against a quantity surveyor's take-off, a live electricity bill and "
        "Medbury Diagnostics' trading data. Not a binding offer, and not legal or tax advice. "
        "FX USD/NGN 1,550.", SMALL))

    doc.build(el)
    print("wrote %s" % OUT)


if __name__ == "__main__":
    build()
