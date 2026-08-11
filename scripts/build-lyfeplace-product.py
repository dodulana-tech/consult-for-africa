"""
Build "Lyfe Place Abuja: the product" PDF.

Product first, then pricing, then positioning, then financials. Written because
the numbers kept moving: they were being derived from a product that had not been
settled.

THE PRODUCT
  Three revenue lines, two capture businesses:
    1. PANEL AND MEMBERSHIP   Access for specialists. Panel is breadth at guest
       rates with no commitment; membership is the upgrade for the 2+ sessions a
       week cohort. Empanelment replaces the earlier single-tier 60-member model.
    2. FAMILY PRACTICE        Lyfe Place's own bundled packages. The demand
       engine: it manufactures the flow the panel needs.
    3. DAY CASE AND AESTHETICS ANCHOR   Aesthetics, dermatology, hair transplant.
       Defines the ambulatory identity.
  Plus Medbury Diagnostics and Medbury Pharmaceuticals, capturing from all three.

KEY NUMBERS
  Empanelment base case: plaza NGN 444M, break-even 42%, against the earlier
  60-member model's NGN 501M and 37%. A lower number with far better odds of
  being hit, which is the right trade.

  X-ray enables orthopaedics, and paediatric orthopaedics in particular. Ponseti
  clubfoot serial casting is clinic-based, high-volume and needs only X-ray, a
  plaster trap and a cast saw.

Output: docs/lyfeplace-abuja/lyfeplace-abuja-product-cfa.pdf
House style matches the CFA repo. Naira shown as NGN. No em dashes.

Run:
  python3 scripts/build-lyfeplace-product.py
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
OUT = DOCS / "lyfeplace-abuja-product-cfa.pdf"

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
                textColor=GOLD, spaceAfter=2)
H1 = style("h1", fontName="Helvetica-Bold", fontSize=13, leading=16.5, textColor=NAVY,
           spaceBefore=6, spaceAfter=5)
H2 = style("h2", fontName="Helvetica-Bold", fontSize=9.8, leading=12.8, textColor=TEAL,
           spaceBefore=7, spaceAfter=3)
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
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 20,
                      "Product, pricing, positioning, financials")
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


def build():
    doc = BaseDocTemplate(
        str(OUT), pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN, topMargin=42, bottomMargin=30,
        title="Lyfe Place Abuja - product, pricing, positioning, financials",
        author="Consult for Africa",
    )
    doc.addPageTemplates([PageTemplate(
        id="p", frames=[Frame(MARGIN, 30, FULLW, PAGE_H - 42 - 30, id="f")], onPage=page_bg)])

    el = []
    el.append(Paragraph("The product",
                        style("t", fontName="Helvetica-Bold", fontSize=18, leading=21,
                              textColor=NAVY, spaceAfter=2)))
    el.append(Paragraph("What we sell, what it costs, where it sits, what it earns.",
                        style("st", fontName="Helvetica-Oblique", fontSize=10.5, leading=13,
                              textColor=GOLD, spaceAfter=7)))
    el.append(card(
        "The figures in this work have moved repeatedly, and the reason is that they were being "
        "derived from a product that had not been settled. This note fixes the product first. "
        "Pricing, positioning and financials then follow from it rather than the other way round.",
        bg=PANEL))

    # 01
    sec(el, "01", "THE PRODUCT", "Three revenue lines, two capture businesses.")
    el.append(tbl(
        [["1. Panel and membership", "Specialists", "Access to rooms, infrastructure and an "
          "address. Panel for breadth, membership for the committed", "Sessions and fees"],
         ["2. Family practice", "Families and corporates", "Bundled annual care. <b>The demand "
          "engine</b>: it manufactures the flow the panel needs", "Packages"],
         ["3. Day case and aesthetics", "Cash-pay patients", "Aesthetics, dermatology, hair "
          "transplant. Defines the ambulatory identity", "Procedure fees"],
         ["Medbury Diagnostics", "Everyone above", "Laboratory and imaging", "Per test"],
         ["Medbury Pharmaceuticals", "Everyone above", "Dispensing and retail", "Per script"]],
        ["Line", "Sold to", "What it is", "Revenue"],
        [104, 84, 210, 69], aligns=["l", "l", "l"], hi={1}))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>Line 2 is the one that makes the others work.</b> A panel of specialists with no patients "
        "is an empty building. The family practice generates first-contact volume, refers into the "
        "panel, and drives the diagnostics and pharmacy capture. It is the only line Lyfe Place "
        "controls end to end, and it should be built first.", bg=PANEL))

    # 02
    sec(el, "02", "LINE 1", "Panel for breadth, membership for the committed.")
    el.append(tbl(
        [["<b>Panel</b>", "Credentialed, listed in the directory, books sessions at guest rates. "
          "No minimum, no lease, small annual administration fee", "Breadth. Fills the specialty "
          "map cheaply and carries no risk"],
         ["<b>Membership</b>", "Everything above, plus member session rates, priority booking, "
          "named room preference, directory prominence and the lounge",
          "Depth. For the two-plus sessions a week cohort, where the discount pays for the fee"]],
        ["Tier", "What it is", "What it does"], [72, 220, 175], aligns=["l", "l"]))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "The upgrade is self-selecting. At a 33% member discount and a NGN 2.5M fee, a consultant "
        "breaks even at roughly two sessions a week. Below that the panel is better value and above "
        "it membership is. Nobody has to be persuaded, and nobody is oversold.", P))
    el.append(Spacer(1, 3))
    el.append(card(
        "<b>Lyfe Place markets the campus and that is what fills diaries.</b> Campus marketing, "
        "family practice referrals, diagnostics walk-in traffic and corporate accounts are all real "
        "and all funded. But they appear in the sale as what the campus does, <b>never as a patient "
        "volume a member is owed</b>. A volume promise creates a liability nobody can control and it "
        "will be produced against you at the first quiet quarter.", bg=ALERT, rule=RUST))

    # 03
    sec(el, "03", "LINE 2", "Family practice, bundled and packaged.")
    el.append(Paragraph(
        "Lyfe Place's own operating company, not a tenant. Two ground-floor rooms beside the "
        "diagnostics, which is exactly where a first-contact service belongs.", P))
    el.append(tbl(
        [["Individual", "Unlimited GP access, annual screen, vaccinations, chronic disease "
          "management, quarterbacked referral into the panel", "600,000"],
         ["Family, up to four", "As above for the household, with paediatric cover", "1,500,000"],
         ["Corporate, per head", "Executive screen, occupational health, priority access",
          "400,000"]],
        ["Package", "What is included", "NGN a year"], [96, 291, 80]))
    el.append(Spacer(1, 3))
    el.append(Paragraph(
        "<b>Quarterbacked referral is the point.</b> The family physician does not just refer, they "
        "book the specialist, order the tests in advance and hold the thread. That is what a package "
        "buys that a consultation does not, and it is what routes the patient into the panel, the "
        "laboratory and the pharmacy rather than out of the building.", P))
    el.append(PageBreak())

    # 04
    sec(el, "04", "LINE 3", "Aesthetics and day case, as the anchor.")
    el.append(tbl(
        [["Aesthetic medicine", "Injectables, fillers, peels, microneedling, laser hair removal and "
          "resurfacing, HIFU, cryolipolysis, PRP, skin boosters", "Treatment room"],
         ["Aesthetic surgery, local", "Mole and lesion excision, earlobe repair, scar revision, "
          "upper-lid blepharoplasty, thread lifts, labiaplasty", "Clean procedure room"],
         ["Dermatology", "Medical and cosmetic, with skin cancer excision and biopsy",
          "Treatment room"],
         ["Hair transplant", "FUE, six to ten hour single-patient cases under local anaesthesia",
          "FUE suite"]],
        ["Sub-line", "What is done", "Where"], [104, 285, 78], aligns=["l", "l"]))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>Hair transplant is the best single fit for this building.</b> Local anaesthesia only, so "
        "no theatre and no anaesthetist. One patient occupies the suite all day, so it produces "
        "<b>one arrival</b> and relieves the single-reception constraint instead of loading it. And "
        "the ticket runs NGN 1.2M to 4M. Nothing else on the campus converts a room into revenue at "
        "that rate.", bg=PANEL))

    # 05
    sec(el, "05", "WHAT THE PANEL COVERS", "Specialties, and what enables each.")
    el.append(tbl(
        [["<b>Digital X-ray</b>", "<b>Orthopaedics, adult</b>: fracture clinic, osteoarthritis, "
          "sports injury, pre and post-operative review<br/><b>Paediatric orthopaedics</b>: see "
          "below<br/>Rheumatology, respiratory with spirometry"],
         ["<b>Ultrasound</b>", "Obstetrics and gynaecology, fertility, general surgery for hernia "
          "and gallbladder, vascular including varicose veins and sclerotherapy, musculoskeletal and "
          "sports, paediatrics, urology"],
         ["<b>Echocardiography</b>", "Cardiology, and pre-operative cardiac clearance for the "
          "surgical aesthetic work, which the anchor needs anyway"],
         ["<b>Laboratory</b>", "Endocrinology, nephrology, haematology, infectious disease, "
          "gastroenterology, fertility, and the family practice's screening programme"],
         ["<b>Clean procedure room<br/>with an anaesthetist</b>", "Endoscopy, upper GI and flexible "
          "sigmoidoscopy. Hysteroscopy. Cystoscopy. Image-guided pain injections. Vasectomy"],
         ["<b>No diagnostics needed</b>", "Psychiatry, psychology, neurology, palliative care, "
          "dietetics, occupational health, genetics"]],
        ["Enabled by", "Specialties"], [112, 355], aligns=["l"], hi={0}))
    el.append(Spacer(1, 4))
    el.append(Paragraph("Paediatric orthopaedics, which X-ray unlocks specifically", H2))
    el.append(Paragraph(
        "This deserves separating out because it is high-volume, clinic-based, needs no theatre, and "
        "is materially under-provided in Nigeria.", P))
    el.append(tbl(
        [["<b>Ponseti clubfoot correction</b>", "Serial casting over six to eight weeks, then "
          "bracing. Clinic-based, no theatre, life-changing, and there is very little of it "
          "available. <b>The strongest single paediatric proposition on the campus</b>"],
         ["Developmental hip dysplasia", "Ultrasound screening in infants, X-ray after six months, "
          "Pavlik harness fitting and review"],
         ["Limb deformity", "Genu varum and valgum, torsional profiles, leg length"],
         ["Scoliosis", "Screening, monitoring and brace review"],
         ["Perthes and SCFE", "Diagnosis and serial monitoring"],
         ["Fracture follow-up", "Cast changes, removal, review films"]],
        ["Condition", "What is done here"], [148, 319], aligns=["l"], hi={0}))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>One fit-out addition unlocks all of it: a plaster trap and a cast saw.</b> Serial casting "
        "blocks ordinary drainage, so the sink needs a plaster trap, and cast removal needs a saw and "
        "somewhere the noise does not carry into consulting. Site it in the <b>ground floor "
        "consulting room, next to X-ray</b>, so the check film, the cast and the review film all "
        "happen in one place. The cost is a few hundred thousand naira and it opens an entire "
        "specialty.", bg=ALERT, rule=RUST))
    el.append(PageBreak())

    # 06
    sec(el, "06", "PRICING", "Three tariffs, one principle.")
    el.append(Paragraph(
        "The principle: <b>price the access to fill it, and take the margin on what the flow "
        "generates.</b> Sessions and packages are priced to be said yes to. Diagnostics, pharmacy and "
        "procedures are where the money is made.", P))
    el.append(tbl(
        [["Early, 07:00 to 09:00, 2h", "44,000", "66,000"],
         ["Daytime, 09:00 to 13:00, 4h", "61,000", "91,500"],
         ["Afternoon, 13:00 to 17:00, 4h", "61,000", "91,500"],
         ["Evening, 17:00 to 21:00, 4h", "94,000", "141,000"],
         ["Treatment room, per session", "180,000", "270,000"],
         ["Clean procedure room, sedation-capable", "480,000", "720,000"]],
        ["Sessions, NGN", "Member", "Panel or guest"], [239, 114, 114]))
    el.append(Spacer(1, 3))
    el.append(tbl(
        [["Membership, specialist", "2,500,000 a year", "Member rates, priority booking, named room "
          "preference, lounge"],
         ["Panel, specialist", "150,000 a year", "Credentialing, directory listing, booking access"],
         ["Family practice, individual", "600,000 a year", ""],
         ["Family practice, family of four", "1,500,000 a year", ""],
         ["Family practice, corporate per head", "400,000 a year", ""]],
        ["Fees", "Price", "What it buys"], [163, 100, 204], aligns=["l", "l"]))
    el.append(Spacer(1, 3))
    el.append(Paragraph(
        "Guest and panel rates are set at 1.5x member. The evening rate is the one most exposed: at "
        "NGN 23,500 an hour it sits 29% above our Lagos benchmark, and there is about NGN 21,000 of "
        "room to concede if the survey says so.", P))

    # 07
    sec(el, "07", "POSITIONING", "What it is, and what it is not.")
    el.append(tbl(
        [["<b>It is</b>", "A private ambulatory campus where senior specialists hold sessions at a "
          "good address, families buy bundled care, and aesthetic and day-case work anchors the "
          "identity. Diagnostics, pharmacy and procedure rooms on site, so a patient is worked up "
          "and treated in one visit"],
         ["<b>It is not</b>", "A hospital. No theatre, no beds, no emergency department, no "
          "overnight stay. It does not compete with the tertiary centres and should never be "
          "described as though it does"],
         ["<b>For specialists</b>", "The address and the infrastructure, without a lease. Turn up, "
          "practise, be paid, leave. Somebody else handles reception, records, billing, collection "
          "and the nurse"],
         ["<b>For patients</b>", "One building, one visit. Seen, scanned, tested, prescribed, "
          "without crossing town between each step"],
         ["<b>For Medbury</b>", "A medical park under the Medical Infrastructure Division, earning "
          "from access, from packages, and from every test and script the flow generates"]],
        ["", ""], [92, 375], aligns=["l"]))

    # 08
    sec(el, "08", "FINANCIALS", "What it earns, on the empanelled model.")
    el.append(tbl(
        [["Members", "15", "25", "40"],
         ["Panel specialists", "30", "45", "60"],
         ["Room fill", "20%", "38%", "65%"],
         ["Sessions and fees", "181.1", "342.2", "583.7"],
         ["Procedure and treatment rooms", "101.6", "101.6", "101.6"],
         ["Family practice packages", "64.0", "128.0", "192.0"],
         ["Campus revenue", "346.7", "571.8", "877.3"],
         ["Fixed cost base, including family practice", "(230.5)", "(230.5)", "(230.5)"],
         ["Contribution", "116.2", "341.3", "646.8"]],
        ["NGN M a year, stabilised", "Low", "Base", "High"],
        [239, 76, 76, 76], total_row=True, hi={2}))
    el.append(Spacer(1, 4))
    el.append(tbl(
        [["Total capital", "527", "527", "527"],
         ["Break-even, share of campus revenue", "66%", "40%", "26%"],
         ["Payback from stabilisation", "4.5 yrs", "1.5 yrs", "0.8 yrs"]],
        ["", "Low", "Base", "High"], [239, 76, 76, 76]))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>Empanelment gives a lower number with far better odds of hitting it, and that is the "
        "right trade.</b> The earlier single-tier model needed 60 specialists each paying NGN 2.5M, "
        "which is a lot of persuasion. This needs 25 members and 45 on a panel at NGN 150,000, which "
        "is a much easier sale and a much shorter path to breadth. <b>Everything turns on the member "
        "count, which is precisely what the survey measures.</b>", bg=PANEL))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "The family practice line is indicative and needs its own model: panel size, physician "
        "ratios, utilisation and renewal rates all matter and none has been worked. It is shown here "
        "because leaving it out understates the campus, not because the number is settled.", P))
    el.append(Spacer(1, 6))
    el.append(card(
        "<b>Debo Odulana</b> &nbsp; Consult for Africa &nbsp; / &nbsp; +234 913 813 8553 &nbsp; / "
        "&nbsp; hello@consultforafrica.com", bg=NAVY, fg=white))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "Session rates are derived from our Lagos work less 10% and are unvalidated for Abuja. Member "
        "and panel counts, family practice packages and fill assumptions are what the consultant "
        "survey exists to test. Capital and cost base are carried from the fit-out and forecast note. "
        "Not a binding offer, and not legal or tax advice.", SMALL))

    doc.build(el)
    print("wrote %s" % OUT)


if __name__ == "__main__":
    build()
