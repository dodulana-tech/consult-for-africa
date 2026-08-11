"""
Build "Lyfe Place Abuja: entity map and naming" PDF.

The canonical reference for who is who. Five entities:

  1. AL SALAM             Al Salam Hospitals Group, Egypt. The destination hospital.
                          Earns the treatment revenue. Not a party to the JV.
  2. ALAMEDA              Alameda Financial Limited, Egypt. Al Salam's international
                          patient desk and BD arm. A cost centre. JV shareholder.
                          The conduit guaranteeing conversion fee remittances.
  3. MEDBURY HEALTHCARE   Medbury Medical Services Limited, Nigeria. The Nigerian
                          host. JV shareholder. Owns the brand, Medbury Diagnostics
                          and Medbury Pharmaceuticals.
  4. THE LYFE PLACE,      Nigeria, to be incorporated. Facility owner. Holds the head
     ABUJA                lease and the fit-out, leases to every tenant. Wholly owned
                          by Medbury Healthcare.
  5. THE CONVERSION       Nigeria, to be incorporated. The SPV. Medbury Healthcare
     CLINIC               plus Alameda. Tenant of The Lyfe Place. Operates the ground
                          floor conversion clinic.

Contracted parties, not principals: Mezo Health (facility manager), Consult for
Africa (diagnostics phase, interior design, fit-out delivery).

Three naming defects in the draft agreement, all recorded here:
  - Cover page says ALAMEDIA FINANCIAL LIMITED, body says ALAMEDA.
  - Recital 2 describes Alameda as operating the Al Salam hospitals. It does not;
    it is a financial company acting as the patient desk. The whole remittance
    structure depends on knowing which entity does what.
  - The Company is named "Allox Kings City Estates Ltd", a real estate entity.

Output: docs/lyfeplace-abuja/lyfeplace-abuja-entities-cfa.pdf
House style matches the CFA repo. Naira shown as NGN. No em dashes. FX USD/NGN 1,550.

Run:
  python3 scripts/build-lyfeplace-entities.py
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
OUT = DOCS / "lyfeplace-abuja-entities-cfa.pdf"

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
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 20, "Entity map and naming")
    c.setFillColor(GOLD)
    c.rect(MARGIN, 26, 20, 2, fill=1, stroke=0)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 7.4)
    c.drawString(MARGIN, 15, "Canonical reference  /  Consult for Africa for Medbury Healthcare")
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
        ("TOPPADDING", (0, 0), (-1, -1), 3.4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3.4),
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
        title="Lyfe Place Abuja - Entity map and naming",
        author="Consult for Africa",
    )
    doc.addPageTemplates([PageTemplate(
        id="p", frames=[Frame(MARGIN, 30, FULLW, PAGE_H - 42 - 30, id="f")],
        onPage=page_bg)])

    el = []
    el.append(Paragraph("Entity map and naming",
                        style("t", fontName="Helvetica-Bold", fontSize=18, leading=21,
                              textColor=NAVY, spaceAfter=2)))
    el.append(Paragraph("Five entities. Who is who, and who pays whom.",
                        style("st", fontName="Helvetica-Oblique", fontSize=10.5, leading=13,
                              textColor=GOLD, spaceAfter=7)))

    sec(el, "01", "THE FIVE ENTITIES", "Use these names, in these words, everywhere.")
    el.append(tbl(
        [["1", "<b>Al Salam</b>", "Al Salam Hospitals Group", "Egypt",
          "A destination hospital, and one of the assets in Alameda's portfolio. Earns the treatment revenue. <b>Not a party to the joint "
          "venture</b> and does not need to be"],
         ["2", "<b>Alameda</b>", "Alameda Financial Limited", "Egypt",
          "A healthcare <b>asset management company</b> with Al Salam in its portfolio. It also "
          "holds hospital management contracts, including <b>an existing SPV with Medbury in Port "
          "Harcourt</b>. Joint venture shareholder, and the conduit guaranteeing conversion fee "
          "remittances"],
         ["3", "<b>Medbury Healthcare</b>", "Medbury Medical Services Limited", "Nigeria",
          "The Nigerian host. Joint venture shareholder. Owns the brand, Medbury Diagnostics and "
          "Medbury Pharmaceuticals, and owns The Lyfe Place outright"],
         ["4", "<b>The Lyfe Place, Abuja</b>", "To be incorporated", "Nigeria",
          "Facility owner. Holds the head lease and the fit-out and leases space to every tenant "
          "including the Conversion Clinic. Wholly owned by Medbury Healthcare"],
         ["5", "<b>The Conversion Clinic</b>", "To be incorporated", "Nigeria",
          "The SPV. Medbury Healthcare and Alameda. A <b>tenant</b> of The Lyfe Place, operating the "
          "ground floor conversion clinic"]],
        ["", "Name to use", "Legal entity", "Where", "What it is"],
        [20, 92, 92, 44, 219], aligns=["l", "l", "l", "l"]))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>The distinction that matters most is 1 versus 2.</b> Al Salam is a hospital that earns "
        "treatment revenue. Alameda is the asset manager that operates it and others, and is building "
        "a conversion clinic to feed its portfolio. They must never be written as one party because "
        "they carry different obligations, but the agreement's description of Alameda is accurate, "
        "and the standing it gives Alameda over Al Salam is what makes the remittance guarantee "
        "credible.", bg=PANEL))

    sec(el, "02", "NOT PRINCIPALS", "Contracted parties and internal business units.")
    el.append(tbl(
        [["Mezo Health", "Contracted", "Facility manager for the whole Abuja entity. 6% of campus "
          "revenue plus a 10% incentive on gross operating profit, capped at 10% of revenue"],
         ["Consult for Africa", "Contracted", "Diagnostics phase, interior design and fit-out "
          "delivery. Hands over to Mezo Health at practical completion"],
         ["Medbury Diagnostics", "Business unit", "Of Medbury Healthcare. Laboratory and imaging. "
          "Sold as part of the facility, not billed as a tenant"],
         ["Medbury Pharmaceuticals", "Business unit", "Of Medbury Healthcare. Same treatment"],
         ["Medlyfe", "Prospective tenant", "Longevity and infusion, guest chalet. Conventional lease"],
         ["The Cloister", "Product", "The membership sold to first-floor plaza members and patients. "
          "Not an entity"]],
        ["Name", "Status", "What it is"], [110, 74, 283], aligns=["l", "l"]))

    sec(el, "03", "THE FLOWS", "Who pays whom, and for what.")
    el.append(tbl(
        [["Al Salam", "The Conversion Clinic", "Conversion fee, remitted through Alameda as conduit",
          "15% of treatment invoice"],
         ["The Conversion Clinic", "Alameda", "BD and patient desk fee, payable only out of fees "
          "actually received", "10% of conversion fees"],
         ["The Conversion Clinic", "Medbury Healthcare", "Host and brand fee",
          "10% of conversion fees"],
         ["The Conversion Clinic", "The Lyfe Place", "Rent and service charge", "~NGN 68M a year"],
         ["Medbury Healthcare<br/>and Alameda", "The Conversion Clinic",
          "Establishment capital, pro rata", "NGN 231M total"],
         ["The Lyfe Place", "The landlord", "Head rent", "NGN 50M a year"],
         ["The Lyfe Place", "Mezo Health", "Management fee", "6% plus incentive, capped at 10%"],
         ["Plaza members", "The Lyfe Place", "Session fees and membership", "~NGN 330M a year"],
         ["Patients", "Medbury Diagnostics<br/>and Pharmaceuticals", "Tests and prescriptions",
          "100% Medbury Healthcare"]],
        ["From", "To", "For what", "Amount"],
        [104, 104, 173, 86], aligns=["l", "l", "l"]))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>Read the first three rows together.</b> The conversion fee flows Al Salam to The "
        "Conversion Clinic, and only then does The Conversion Clinic pay Alameda its 10%. Never Al "
        "Salam to Alameda and the net onward. If Alameda receives first, it holds the tap and every "
        "row below it becomes decorative.", bg=ALERT, rule=RUST))
    el.append(PageBreak())

    sec(el, "04", "THREE NAMING DEFECTS", "In the draft agreement, all needing correction.")
    el.append(tbl(
        [["1", "Two different names for the same party",
          "The cover page says <b>ALAMEDIA FINANCIAL LIMITED</b>. The body says <b>ALAMEDA FINANCIAL "
          "LIMITED</b>. One of them is wrong and the executed version must be internally consistent"],
         ["2", "The conversion fee is scoped to Al Salam alone",
          "Alameda manages a portfolio, not one hospital, and is building this clinic to feed that "
          "portfolio. If the conversion fee names only Al Salam, a patient routed to any other "
          "Alameda-managed facility triggers no fee at all. <b>Define the destination as any facility "
          "owned, operated, managed or advised by Alameda or its affiliates.</b> This is the single "
          "most valuable drafting change available"],
         ["3", "The Company is named as a real estate entity",
          "Clause 1.1 defines the Company as <b>\"Allox Kings City Estates Ltd\"</b>. That is a real "
          "estate company and the wrong vehicle for a clinic. Incorporate a purpose-built healthcare "
          "SPV and name it The Conversion Clinic, or a proper trading name for it"]],
        ["", "Defect", "What it says, and why it matters"], [20, 148, 299], aligns=["l", "l"]))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "Defect 2 is the substantive one, and worth more than the other two combined. Recital 2 is "
        "otherwise <b>accurate</b>: Alameda does provide and operate facility management for Al "
        "Salam, which is precisely what gives it the standing to procure remittance. Leave it as "
        "drafted.", P))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>Ask for the Port Harcourt papers before signing this one.</b> Medbury and Alameda already "
        "have an SPV together. Whatever was agreed there on equity, fees, funding obligations and "
        "dispute resolution is the natural benchmark for Abuja, and how it has actually performed is "
        "better evidence of Alameda as a partner than anything in a new agreement. Two structures "
        "with the same counterparty also invites arbitrage, so consider aligning or cross-defaulting "
        "them.", bg=PANEL))

    sec(el, "05", "NAMING RULES", "For every document, deck and contract from here.")
    el.append(tbl(
        [["Say <b>The Lyfe Place</b>", "Not PropCo, not Lyfe Place Abuja PropCo. Where owner and "
          "facility must be distinguished, say The Lyfe Place (the facility) and The Lyfe Place "
          "Limited (the owner)"],
         ["Say <b>The Conversion Clinic</b>", "Not the SPV, not the Conversion Clinic SPV, not the "
          "Alameda SPV. It is a named business, and calling it an SPV in front of a partner makes it "
          "sound temporary"],
         ["Say <b>Medbury Healthcare</b>", "Consistently. Not Medbury Healthcare Group in one place "
          "and Medbury in another"],
         ["Never write <b>Alameda / Al Salam</b>", "They are different entities with different roles "
          "and different obligations. The slash is where the earlier confusion started"],
         ["<b>Lyfe Place Abuja</b> is the park", "The medical park brand, under Medbury Healthcare's "
          "Medical Infrastructure Division. The Conversion Clinic and the first-floor plaza are "
          "businesses inside it"]],
        ["Rule", "Why"], [148, 319], aligns=["l"]))
    el.append(Spacer(1, 8))
    el.append(card(
        "<b>Debo Odulana</b> &nbsp; Consult for Africa &nbsp; / &nbsp; +234 913 813 8553 &nbsp; / "
        "&nbsp; hello@consultforafrica.com", bg=NAVY, fg=white))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "Legal entity names for The Lyfe Place and The Conversion Clinic are to be incorporated and "
        "are placeholders here. Clause references are to the draft joint venture agreement as "
        "supplied. Amounts are from the companion notes and are assumptions, not commitments. Not a "
        "binding offer, and not legal advice. FX USD/NGN 1,550.", SMALL))

    doc.build(el)
    print("wrote %s" % OUT)


if __name__ == "__main__":
    build()
