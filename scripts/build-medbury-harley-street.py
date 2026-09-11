"""
Build the "Harley Street in Ikoyi" concept note PDF for Consult for Africa,
prepared for Medbury Healthcare Group. Board-grade note designed to move
Dr Itunu Akinware to action.

The proposition is a premium medical INSTITUTION for Lagos, two businesses under
one prestige Ikoyi address:
  A. THE ADDRESS (facility) -- a members' club for specialists. They pay a
     membership to belong and pay per use by the session. Plus 2 BQ office leases.
     Priced from deep research into premium consulting-room practice (23 Harley
     Street, Ten Harley Street two-part tariff; procedure rooms at a theatre
     premium). Facility contribution ~NGN 326M/yr.
  B. THE FAMILY-PRACTICE MEMBERSHIP (Medbury OpCo) -- concierge family medicine
     with an embedded annual executive wellness screen and "quarterbacked"
     priority specialist access. Priced from research (HCA UK GP subscription
     template; Duchess N83k-478k exec checks + N4M Royal; Reddington premium
     screen content; US concierge $2-5k/yr, panels 300-600). Tiers: Individual
     NGN 1.5M, Family NGN 3.5M, Executive NGN 6M /yr. Year-2 membership revenue
     ~NGN 905M/yr. The OpCo anchors the address as a tenant.

Property: 5-bed house + 2-room BQ, Ikoyi. Lease ~NGN 50M/yr, hold ~NGN 7.67M/mo.
FX reference only: GBP/NGN ~1,950, USD/NGN ~1,550. Priced to Lagos cash-pay HNI.

Source narrative: docs/medbury-harley-street-ikoyi-cfa.md
Output:          docs/medbury-harley-street-ikoyi-cfa.pdf

House style matches the CFA repo. Naira shown as NGN. No em dashes anywhere.

Run:
  python3 scripts/build-medbury-harley-street.py
"""

from __future__ import annotations

from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.utils import ImageReader
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
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
OUT = DOCS / "medbury-harley-street-ikoyi-cfa.pdf"

# Premium members'-club palette: deep emerald + champagne gold + warm ivory.
# (Deliberately NOT the CFA navy/teal house style.) Variable names kept for reuse.
NAVY = HexColor("#0F3D2E")      # deep emerald (cover, headers, table heads)
DEEP_NAVY = HexColor("#08261C")  # near-black emerald (band edges)
GOLD = HexColor("#C6A15B")      # champagne gold (accents, eyebrows, rules)
TEAL = HexColor("#2F6B52")      # mid emerald (H2 section accent)
BODY = HexColor("#23302B")      # warm dark ink
MUTED = HexColor("#7C7C74")     # warm grey
SURFACE = HexColor("#F5F2EA")   # warm ivory (row stripes, soft panels)
LIGHT = HexColor("#CBDDD1")     # pale sage (light text on emerald)
PANEL = HexColor("#E9F0EA")     # pale sage (callout panels)
CREAM = HexColor("#F6EFDD")     # pale gold (total rows)

PAGE_W, PAGE_H = A4
MARGIN = 46

ss = getSampleStyleSheet()


def style(name, **kw):
    base = dict(fontName="Helvetica", fontSize=10.5, leading=15.5, textColor=BODY,
                alignment=TA_LEFT, spaceAfter=7)
    base.update(kw)
    return ParagraphStyle(name, **base)


EYEBROW = style("eyebrow", fontName="Helvetica-Bold", fontSize=9, leading=12,
                textColor=GOLD, spaceAfter=3)
H1 = style("h1", fontName="Helvetica-Bold", fontSize=15, leading=19, textColor=NAVY,
           spaceBefore=12, spaceAfter=8)
H2 = style("h2", fontName="Helvetica-Bold", fontSize=11.5, leading=15, textColor=TEAL,
           spaceBefore=8, spaceAfter=4)
P = style("p")
LEDE = style("lede", fontSize=11, leading=16.5, textColor=HexColor("#374151"))
SMALL = style("small", fontSize=8.5, leading=12, textColor=MUTED)
CELL = style("cell", fontSize=9.5, leading=12.5)
CELL_R = style("cellr", fontSize=9.5, leading=12.5, alignment=2)
CELL_B = style("cellb", fontSize=9.5, leading=12.5, fontName="Helvetica-Bold", textColor=NAVY)
CELL_BR = style("cellbr", fontSize=9.5, leading=12.5, fontName="Helvetica-Bold",
                textColor=NAVY, alignment=2)
CELL_W = style("cellw", fontSize=9.5, leading=12.5, fontName="Helvetica-Bold", textColor=white)
CELL_WR = style("cellwr", fontSize=9.5, leading=12.5, fontName="Helvetica-Bold",
                textColor=white, alignment=2)


def draw_colonnade(c, cx, cy, n=7, aw=13, gap=8, legh=12, color=GOLD, lw=1.0):
    """A row of arches, the cloister motif."""
    total = n * aw + (n - 1) * gap
    x0 = cx - total / 2.0
    c.setStrokeColor(color)
    c.setLineWidth(lw)
    for i in range(n):
        x = x0 + i * (aw + gap)
        c.line(x, cy, x, cy + legh)
        c.line(x + aw, cy, x + aw, cy + legh)
        p = c.beginPath()
        p.arc(x, cy + legh - aw / 2.0, x + aw, cy + legh + aw / 2.0, 0, 180)
        c.drawPath(p, stroke=1, fill=0)
    c.setLineWidth(lw * 0.8)
    c.line(x0 - 4, cy, x0 + total + 4, cy)


def cover_bg(c, doc):
    c.saveState()
    cw = PAGE_W / 2.0
    c.setFillColor(NAVY)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.setStrokeColor(GOLD); c.setLineWidth(0.6)
    c.line(MARGIN, PAGE_H - 62, PAGE_W - MARGIN, PAGE_H - 62)
    c.setFillColor(LIGHT); c.setFont("Helvetica", 8)
    c.drawString(MARGIN, PAGE_H - 56, "THE CLOISTER")
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 56, "A MEDBURY INSTITUTION, IKOYI")
    draw_colonnade(c, cw, PAGE_H - 305, n=7, color=GOLD)
    c.setFillColor(white); c.setFont("Helvetica-Bold", 42)
    c.drawCentredString(cw, PAGE_H - 362, "The Cloister")
    c.setFillColor(GOLD); c.setFont("Helvetica-Oblique", 16)
    c.drawCentredString(cw, PAGE_H - 393, "Care worth staying home for.")
    c.setStrokeColor(GOLD); c.setLineWidth(0.8)
    c.line(cw - 36, PAGE_H - 410, cw + 36, PAGE_H - 410)
    c.setFillColor(LIGHT); c.setFont("Helvetica", 10.5)
    c.drawCentredString(cw, PAGE_H - 430, "Lagos's Harley Street  ·  a private medical members' address in Ikoyi")
    c.setStrokeColor(GOLD); c.setLineWidth(0.6)
    c.line(cw - 26, 120, cw + 26, 120)
    c.setFillColor(LIGHT); c.setFont("Helvetica", 9.5)
    c.drawCentredString(cw, 102, "Prepared for Dr Itunu Akinware, Group CEO, Medbury Healthcare Group")
    c.setFillColor(MUTED); c.setFont("Helvetica", 8)
    c.drawCentredString(cw, 87, "A Consult for Africa concept  ·  July 2026  ·  Private and confidential")
    c.restoreState()


def content_bg(c, doc):
    c.saveState()
    c.setFillColor(NAVY)
    c.rect(0, PAGE_H - 34, PAGE_W, 34, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(0, PAGE_H - 37, PAGE_W, 3, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(MARGIN, PAGE_H - 23, "THE CLOISTER")
    c.setFillColor(LIGHT)
    c.setFont("Helvetica", 8.5)
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 23, "A Consult for Africa concept for Medbury")
    c.setFillColor(GOLD)
    c.rect(MARGIN, 30, 24, 2, fill=1, stroke=0)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8)
    c.drawString(MARGIN, 18, "Private and confidential  /  Prepared for Dr Itunu Akinware, Group CEO")
    c.drawRightString(PAGE_W - MARGIN, 18, "Page %d" % doc.page)
    c.restoreState()


def card(text, bg=SURFACE, fg=BODY, bold=False):
    st = ParagraphStyle("c", parent=P, textColor=fg, leftIndent=8, rightIndent=8,
                        spaceBefore=4, spaceAfter=4,
                        fontName="Helvetica-Bold" if bold else "Helvetica")
    t = Table([[Paragraph(text, st)]], colWidths=[PAGE_W - 2 * MARGIN])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("LINEBEFORE", (0, 0), (0, -1), 3, GOLD),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
    ]))
    return t


def money_table(rows, col_labels, widths, total_row=False, aligns=None, subtotal_rows=None):
    ncols = len(col_labels)
    if aligns is None:
        aligns = ["r"] * (ncols - 1)
    subtotal_rows = subtotal_rows or set()
    data = []
    header = [Paragraph(col_labels[0], CELL_W)]
    for j, t in enumerate(col_labels[1:]):
        header.append(Paragraph(t, CELL_WR if aligns[j] == "r" else CELL_W))
    data.append(header)
    for i, r in enumerate(rows):
        is_last = total_row and i == len(rows) - 1
        emph = is_last or (i in subtotal_rows)
        lab_style = CELL_B if emph else CELL
        cells = [Paragraph(r[0], lab_style)]
        for j, cval in enumerate(r[1:]):
            if aligns[j] == "r":
                cells.append(Paragraph(cval, CELL_BR if emph else CELL_R))
            else:
                cells.append(Paragraph(cval, CELL_B if emph else CELL))
        data.append(cells)
    t = Table(data, colWidths=widths)
    styles = [
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("LINEBELOW", (0, 0), (-1, 0), 2, GOLD),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("ROWBACKGROUNDS", (0, 1), (-1, -2 if total_row else -1), [white, SURFACE]),
    ]
    if total_row:
        styles.append(("BACKGROUND", (0, -1), (-1, -1), CREAM))
        styles.append(("LINEABOVE", (0, -1), (-1, -1), 1.2, GOLD))
    t.setStyle(TableStyle(styles))
    return t


def sec(el, num, eyebrow, title):
    el.append(Paragraph(num + "  /  " + eyebrow, EYEBROW))
    el.append(Paragraph(title, H1))


def build():
    doc = BaseDocTemplate(
        str(OUT), pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=52, bottomMargin=42,
        title="The Cloister - Consult for Africa Concept Note for Medbury",
        author="Consult for Africa",
    )
    content_frame = Frame(MARGIN, 42, PAGE_W - 2 * MARGIN, PAGE_H - 52 - 42, id="content")
    cover_frame = Frame(MARGIN, 170, PAGE_W - 2 * MARGIN, PAGE_H - 330, id="cover")
    doc.addPageTemplates([
        PageTemplate(id="cover", frames=[cover_frame], onPage=cover_bg),
        PageTemplate(id="content", frames=[content_frame], onPage=content_bg),
    ])

    FULLW = PAGE_W - 2 * MARGIN
    el = []

    # ---------------- COVER ----------------
    el.append(Spacer(1, 2))
    el.append(NextPageTemplate("content"))
    el.append(PageBreak())

    # ---------------- 01: The idea ----------------
    sec(el, "01", "THE IDEA", "Lagos's first Harley Street.")
    el.append(Paragraph(
        "Harley Street has been the address London's private specialists take their consulting "
        "rooms for more than a century. The patient trusts the street before the doctor. The "
        "address does the selling, and the specialists pay to sit behind it. Lagos has no "
        "equivalent, and the top of its market pays for that gap by flying abroad.", LEDE))
    el.append(Paragraph(
        "This is a concept for the Lagos equivalent, in Ikoyi. We call it The Cloister: not a "
        "clinic and not a building to rent out, but a medical institution with two memberships "
        "under one prestige address. The specialists who practise there belong to it, and the "
        "families who trust it belong to it too. Medbury owns the institution. Consult for Africa "
        "builds and runs it, and brings the specialists.", P))
    el.append(Spacer(1, 3))
    el.append(card(
        "Done right, this is not a cost Medbury carries for prestige. It is a medical institution "
        "that carries the Medbury name to the top of the Lagos market, is funded by recurring "
        "memberships on both sides, and pays for itself from the first year.", bg=PANEL))
    el.append(PageBreak())

    # ---------------- 02: The opportunity ----------------
    sec(el, "02", "THE OPPORTUNITY", "The top of the market is flying abroad.")
    el.append(Paragraph(
        "More than three quarters of Nigerian health spending is out of pocket, and the wealthiest "
        "slice of that spending leaves the country: the executives, the families and the diaspora "
        "who take their serious care to London, Dubai and India. They are not flying for the "
        "procedure. They are flying for the address, the trust, and the experience, and those are "
        "the things Lagos has never packaged.", P))
    el.append(Paragraph(
        "The market is not empty, it is unfinished. Duchess sells executive health checks from "
        "NGN 83,000 to NGN 478,000 and a flagship three-day check at NGN 4M, positioned openly as "
        "an alternative to medical tourism. Reddington runs a premium screen of the same shape. "
        "What none of them has built is the address that keeps the relationship: a trusted place, "
        "a family physician who knows you, and the specialist on call the day you need one. The "
        "check-up is a transaction. The membership is a relationship, and the relationship is what "
        "sends people abroad.", P))
    el.append(Spacer(1, 3))
    el.append(card(
        "The opportunity is to bring both home at once: the prestige address the specialists want, "
        "and the continuous membership the families want. That is the whole of this concept.", bg=SURFACE))
    el.append(PageBreak())

    # ---------------- 03: The moat ----------------
    sec(el, "03", "THE MOAT", "The part no competitor can copy.")
    el.append(Paragraph("A supply of specialists we can call.", H2))
    el.append(Paragraph(
        "As President of the Doctors Foundation for Care, C4A can bring diaspora specialists to "
        "practise directly, through MANSAG, ANPA, CANPAD and the wider network. These are the "
        "names that make a premium address credible from the first week, and the hardest thing for "
        "any competitor to assemble. The founding specialists are people we already know.", P))
    el.append(Paragraph("The Medbury network underneath it.", H2))
    el.append(Paragraph(
        "Lifecheck diagnostics, the pharmacy arm, and a tertiary use-of-facilities partnership in "
        "Ikoyi, such as Lagoon, sit under the whole institution. The specialist consults at the "
        "address and operates at the tertiary partner, so the patient gets the full pathway and "
        "Medbury never has to build or own a hospital to deliver it.", P))
    el.append(Paragraph("A two-sided pull no single-sided business has.", H2))
    el.append(Paragraph(
        "The specialists come for the address and the patients already booked for them. The "
        "families come for the specialists and the family physician who coordinates them. Each side "
        "makes the other more valuable, and the diagnostics and pharmacy revenue from both flows "
        "back into the Medbury network. A competitor would have to assemble the address, the "
        "diaspora bench, the family practice and the network at once. We already hold all four.", P))
    el.append(PageBreak())

    # ---------------- 04: Two businesses ----------------
    sec(el, "04", "THE ARCHITECTURE", "Two businesses under one address.")
    el.append(Paragraph(
        "The institution runs as two businesses that feed each other. The address is a members' "
        "club for specialists. The family-practice membership is a concierge product for families, "
        "run as a dedicated Medbury operating company. The OpCo anchors the address as a tenant; "
        "the address gives the OpCo its specialist bench.", P))
    el.append(money_table(
        [
            ["Who belongs", "Specialists", "HNI individuals and families"],
            ["What they pay", "Membership, then per session", "An annual membership"],
            ["What they get", "A prestige base, member rates, offices",
             "A family physician, an annual check, specialists on call"],
            ["Run by", "C4A operates the address", "A Medbury family-practice OpCo"],
        ],
        ["Two businesses", "The address", "The family-practice membership"],
        [95, (FULLW - 95) / 2, (FULLW - 95) / 2],
        aligns=["l", "l"]))
    el.append(Spacer(1, 6))
    el.append(card(
        "Underneath both sits the Medbury network: Lifecheck diagnostics, the pharmacy, and the "
        "tertiary pathway. The address gives the membership its specialists; the membership gives "
        "the address its patients; Medbury owns both and captures the diagnostics, pharmacy and "
        "procedure revenue they generate.", bg=PANEL))
    el.append(PageBreak())

    # ---------------- 05: The address ----------------
    sec(el, "05", "THE ADDRESS", "Belong by membership. Pay per use.")
    el.append(Paragraph(
        "The address is priced the way Harley Street is, proven for decades. A specialist does not "
        "rent a room by the month. They pay a membership to belong, which buys the Ikoyi address "
        "and nameplate, the fully staffed and serviced facility, and member rates, then pay per "
        "use by the session. Casual, non-member use is priced at roughly twice the member rate, so "
        "committing always wins. Membership is annual and paid upfront, a deliberate commitment "
        "rather than a casual room-hire, so the address carries only serious, practising "
        "specialists.", P))
    el.append(Paragraph("Specialist membership.", H2))
    el.append(money_table(
        [
            ["Affiliate (fly-in / diaspora)", "NGN 500,000 / yr",
             "The address and a listed plate, member session rates, booking support when in town"],
            ["Practising (resident)", "NGN 1,000,000 / yr",
             "The above, plus priority booking, the lowest rates, and referrals from the membership"],
            ["Dedicated room (exclusive)", "NGN 2,500,000 / mo",
             "A whole consulting room held permanently; membership included"],
        ],
        ["Specialist membership", "Recurring", "What it buys"],
        [138, 100, FULLW - 238],
        aligns=["l", "l"]))
    el.append(Spacer(1, 5))
    el.append(Paragraph("Room use, per 6-hour session.", H2))
    el.append(money_table(
        [
            ["Consulting room", "NGN 120,000", "NGN 220,000"],
            ["Procedure room", "NGN 280,000", "NGN 500,000"],
        ],
        ["Pay per use", "Member", "Guest / ad hoc"],
        [FULLW - 230, 115, 115]))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "The address runs two six-hour sessions a day, roughly 8am to 8pm. A member's session at "
        "NGN 120,000, staff and power included, is a genuine bargain for a specialist billing "
        "premium fees. The two BQ offices are let whole, on a permanent lease, to organisations "
        "such as the Doctors Foundation for Care. Every rate is validated against the live Med Lyfe "
        "rooms before launch.", SMALL))
    el.append(PageBreak())

    # ---------------- 06: The membership ----------------
    sec(el, "06", "THE MEMBERSHIP", "A family physician, an annual check, and the specialists on call.")
    el.append(Paragraph(
        "The patient side is a product in its own right, run through a dedicated Medbury operating "
        "company. It is concierge family medicine, the model HCA runs in London and MDVIP in the "
        "United States, priced to Lagos: a dedicated family physician holding a small panel, "
        "unlimited priority care, an embedded annual executive wellness screen, and specialist "
        "access the family physician coordinates and expedites at the address. It is sold as a "
        "membership, in three tiers.", P))
    el.append(money_table(
        [
            ["Individual", "NGN 1,500,000 / yr", "Family physician, priority care, annual screen, specialist access"],
            ["Family (up to four)", "NGN 3,500,000 / yr", "The above for the family; screens for the two principals"],
            ["Executive / Elite", "NGN 6,000,000 / yr", "A Royal-level annual screen, 24/7 access, home visits, fastest referral"],
        ],
        ["Membership tier", "Per year", "What it includes"],
        [118, 110, FULLW - 228],
        aligns=["l", "l"]))
    el.append(Spacer(1, 5))
    el.append(Paragraph(
        "The annual screen follows the local premium standard, the shape Reddington and Duchess "
        "already sell: full physical, broad labs, resting and stress ECG, chest imaging, "
        "ultrasound, mammography and cancer screening. It is the anchor benefit that justifies a "
        "recurring fee, and it drives diagnostics and pharmacy volume back into the Medbury "
        "network. A family physician carries a panel of about 350 members, so the practice scales "
        "on a handful of physicians. Full product design and the OpCo P&amp;L are in a companion "
        "brief.", SMALL))
    el.append(PageBreak())

    # ---------------- 07: The experience ----------------
    sec(el, "07", "THE EXPERIENCE", "What it feels like.")
    el.append(Paragraph("The family.", H2))
    el.append(Paragraph(
        "A Lagos family belongs to The Cloister. Their family physician knows their history and "
        "takes their calls. The annual executive check happens on-site, unhurried, in a building "
        "that feels like the private clinics they used to fly to. When the father needs a "
        "cardiologist, the family physician walks him to one of the address's specialists that "
        "week, not onto a flight to London. When the daughter needs a procedure, it happens down "
        "the corridor or at the tertiary partner. The relationship, and the money, stay in Lagos.", P))
    el.append(Paragraph("The specialist.", H2))
    el.append(Paragraph(
        "A diaspora cardiologist flies in for a week each month. She holds her clinics at a "
        "prestige Ikoyi address, with patients already booked by the family physicians, a nurse and "
        "front-of-house she does not have to hire, and a theatre pathway at the tertiary partner. "
        "She pays a modest membership and a fair session rate, and keeps a real Lagos practice "
        "without building one. The names on the plates are the reason the families join, and the "
        "families are the reason the names come.", P))
    el.append(PageBreak())

    # ---------------- 08: The financials ----------------
    sec(el, "08", "THE FINANCIALS", "Two recurring engines, one building.")
    el.append(Paragraph("The address earns from specialists, sessions and leases.", H2))
    el.append(money_table(
        [
            ["Specialist membership (roster ~30)", "NGN 1,666,667", "NGN 20,000,000"],
            ["Consulting sessions (5 rooms, ~55% sold)", "NGN 15,600,000", "NGN 187,200,000"],
            ["Procedure sessions (2 rooms, ~35% sold)", "NGN 9,000,000", "NGN 108,000,000"],
            ["BQ offices, permanent lease (2, e.g. DFC)", "NGN 2,000,000", "NGN 24,000,000"],
            ["Family-practice OpCo (anchor tenant)", "NGN 4,000,000", "NGN 48,000,000"],
            ["Gross revenue", "NGN 32,266,667", "NGN 387,200,000"],
            ["Less: cost to hold the building", "(NGN 7,666,667)", "(NGN 92,000,000)"],
            ["Address contribution before operator fee", "NGN 24,600,000", "NGN 295,200,000"],
        ],
        ["The address, at target run-rate", "Monthly", "Annual"],
        [FULLW - 230, 115, 115],
        total_row=True, subtotal_rows={5}))
    el.append(Spacer(1, 6))
    el.append(Paragraph("The membership earns from families, at a Year-2 target.", H2))
    el.append(money_table(
        [
            ["Individual members", "250", "NGN 375,000,000"],
            ["Family members", "100", "NGN 350,000,000"],
            ["Executive / Elite members", "30", "NGN 180,000,000"],
            ["Membership revenue", "380", "NGN 905,000,000"],
        ],
        ["The membership OpCo (Year 2)", "Members", "Annual revenue"],
        [FULLW - 230, 115, 115],
        total_row=True))
    el.append(Spacer(1, 5))
    el.append(Paragraph(
        "The upfront to open the address is NGN 100M (fit-out NGN 50M, one year's lease advance "
        "NGN 50M), recovered inside the first year. Together, at the Year-2 target, the two "
        "businesses run close to NGN 1.3 billion a year in gross revenue, most of it recurring, from a "
        "converted Ikoyi house, and both drive further diagnostics, pharmacy and procedure revenue "
        "into the Medbury network. Figures are conservative and validated against the live Med Lyfe "
        "rates before the lease is committed.", SMALL))
    el.append(PageBreak())

    # ---------------- 09: Rollout ----------------
    sec(el, "09", "ROLLOUT", "How it opens, without ever holding an empty building.")
    for h, t in [
        ("Before the lease.",
         "C4A signs the founding specialists from the diaspora network, lines up anchor member "
         "families from the Medbury base, confirms the tertiary pathway, and lets Med Lyfe set the "
         "live rates. Signed members, not optimism, take on the building."),
        ("Months 1 to 3.",
         "Secure and fit out the Ikoyi house. Open the address with names already on the plates. "
         "Launch the family-practice membership to Medbury's existing HNI patients and corporate "
         "principals, with the annual screen as the opening hook."),
        ("Months 4 to 12.",
         "Fill the specialist roster and the membership, ramp the sessions, and run the "
         "annual-screen engine that feeds diagnostics. The address reaches its run-rate; the "
         "membership builds its panels."),
        ("Year 2 and beyond.",
         "Scale the membership, add a second address, and take the model to Abuja. The name is now "
         "the premium medical address in Lagos."),
    ]:
        el.append(Paragraph("<b>" + h + "</b>&nbsp; " + t, P))
    el.append(PageBreak())

    # ---------------- 10: Structure, risk, the ask ----------------
    sec(el, "10", "STRUCTURE AND THE ASK", "Who owns it, who runs it, and how we start.")
    el.append(Paragraph(
        "Medbury owns and funds the institution: the address and the family-practice OpCo. C4A "
        "builds and operates both, brings the founding specialists through the Doctors Foundation "
        "for Care network, and holds the clinical pathway. C4A is paid an operator fee, "
        "illustratively a share of the contribution in Medbury's favour, set on signing. C4A's "
        "platforms and network are licensed to the venture, not contributed as equity, so the "
        "asset and its upside stay with Medbury.", P))
    el.append(money_table(
        [
            ["Address contribution (target run-rate)", "NGN 295,200,000", "per year"],
            ["Operator fee to C4A (illustrative, ~40%)", "NGN 118,080,000", "per year"],
            ["Net to Medbury from the address alone", "NGN 177,120,000", "per year"],
        ],
        ["Illustrative address economics", "Amount", ""],
        [FULLW - 210, 110, 100],
        total_row=True, aligns=["r", "l"]))
    el.append(Spacer(1, 5))
    el.append(Paragraph(
        "That is before the membership OpCo's own profit and before the diagnostics, pharmacy and "
        "procedure revenue both engines drive into Medbury. The risks are held the same way: we "
        "sign members on both sides before the lease, we validate every rate against Med Lyfe, and "
        "we negotiate a landlord contribution so the fit-out is part-funded.", SMALL))
    el.append(Spacer(1, 6))
    el.append(card(
        "<b>What we need from you.</b><br/>"
        "1.&nbsp; Confirm the concept and the direction of the tariff and the membership tiers."
        "<br/>"
        "2.&nbsp; C4A signs the founding specialists, opens the family-practice membership to your "
        "HNI base, and confirms the tertiary pathway.<br/>"
        "3.&nbsp; On confirmed members, we shortlist Ikoyi buildings and bring back a costed "
        "lease-and-fit-out plan and the companion OpCo product brief for your decision.",
        bg=PANEL))
    el.append(Spacer(1, 8))
    el.append(card(
        "<b>Debo Odulana</b> &nbsp; Consult for Africa &nbsp; / &nbsp; Lagos and Abuja<br/>"
        "+234 913 813 8553 &nbsp; / &nbsp; hello@consultforafrica.com &nbsp; / &nbsp; "
        "consultforafrica.com",
        bg=NAVY, fg=white))
    el.append(Spacer(1, 6))
    el.append(Paragraph(
        "Figures are illustrative, priced to Lagos cash-pay and diaspora demand and benchmarked to "
        "premium London and Lagos practice, and to be set against the live lease, the fit-out "
        "design and the early Med Lyfe rates. Shared in confidence with Dr Itunu Akinware and "
        "Medbury Healthcare Group leadership. Not a binding offer.", SMALL))

    doc.build(el)
    print(f"wrote {OUT}")


if __name__ == "__main__":
    build()
