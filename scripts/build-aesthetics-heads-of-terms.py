"""
Build the short three-party Heads of Terms for the new Lagos aesthetics and
plastic surgery company.

This is the document that goes to the group. It records only what the three
principals have already settled, plus the work that starts now. Everything that
is properly a lawyer's clause, meaning any build-up on a holding, any commitment
after exit, leaver terms, deadlock and liquidation, is deliberately absent and
sits in the companion memorandum and then the shareholders' agreement.

Companion: scripts/build-aesthetics-mou.py, the full memorandum, which is
the drafting instruction and not a group document.

Tri-party palette (aubergine + rose-gold + ivory). NGN. No em dashes.

Run:
  python3 scripts/build-aesthetics-heads-of-terms.py
"""

from __future__ import annotations

from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import (
    BaseDocTemplate, CondPageBreak, Frame, NextPageTemplate, PageBreak, PageTemplate,
    Paragraph, Spacer, Table, TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
OUT = DOCS / "aesthetics-company-heads-of-terms-cfa.pdf"

NAVY = HexColor("#3B2A45")
DEEP_NAVY = HexColor("#291C31")
GOLD = HexColor("#C79A73")
TEAL = HexColor("#8A5E7E")
BODY = HexColor("#2C2530")
MUTED = HexColor("#8A8288")
SURFACE = HexColor("#F6F1EA")
LIGHT = HexColor("#E3D3DE")
PANEL = HexColor("#F1E9EE")
CREAM = HexColor("#F7EEDF")

PAGE_W, PAGE_H = A4
MARGIN = 46
FULLW = PAGE_W - 2 * MARGIN
ss = getSampleStyleSheet()


def style(name, **kw):
    base = dict(fontName="Helvetica", fontSize=10.5, leading=15.5, textColor=BODY,
                alignment=TA_LEFT, spaceAfter=7)
    base.update(kw)
    return ParagraphStyle(name, **base)


EYEBROW = style("eyebrow", fontName="Helvetica-Bold", fontSize=9, leading=12, textColor=GOLD, spaceBefore=14, spaceAfter=3, keepWithNext=1)
H1 = style("h1", fontName="Helvetica-Bold", fontSize=15, leading=19, textColor=NAVY, spaceBefore=10, spaceAfter=8)
H2 = style("h2", fontName="Helvetica-Bold", fontSize=11.5, leading=15, textColor=TEAL, spaceBefore=9, spaceAfter=4, keepWithNext=1)
P = style("p")
LEDE = style("lede", fontSize=11, leading=16.5, textColor=HexColor("#3C333B"))
SMALL = style("small", fontSize=8.5, leading=12, textColor=MUTED)
BUL = style("bul", leftIndent=14, bulletIndent=3, spaceAfter=3.5)
CELL = style("cell", fontSize=9.5, leading=12.5)
CELL_R = style("cellr", fontSize=9.5, leading=12.5, alignment=2)
CELL_B = style("cellb", fontSize=9.5, leading=12.5, fontName="Helvetica-Bold", textColor=NAVY)
CELL_BR = style("cellbr", fontSize=9.5, leading=12.5, fontName="Helvetica-Bold", textColor=NAVY, alignment=2)
CELL_W = style("cellw", fontSize=9.5, leading=12.5, fontName="Helvetica-Bold", textColor=white)
CELL_WR = style("cellwr", fontSize=9.5, leading=12.5, fontName="Helvetica-Bold", textColor=white, alignment=2)


def cover_bg(c, doc):
    c.saveState()
    cw = PAGE_W / 2.0
    c.setFillColor(NAVY); c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.setStrokeColor(GOLD); c.setLineWidth(0.6); c.line(MARGIN, PAGE_H - 62, PAGE_W - MARGIN, PAGE_H - 62)
    c.setFillColor(LIGHT); c.setFont("Helvetica", 8)
    c.drawString(MARGIN, PAGE_H - 56, "A THREE-PARTY PARTNERSHIP")
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 56, "PRIVATE AND CONFIDENTIAL")

    c.setStrokeColor(GOLD); c.setLineWidth(0.9); c.line(cw - 34, PAGE_H - 322, cw + 34, PAGE_H - 322)
    c.setFillColor(white); c.setFont("Helvetica-Bold", 32)
    c.drawCentredString(cw, PAGE_H - 366, "Heads of Terms")
    c.setFillColor(GOLD); c.setFont("Helvetica-Oblique", 13)
    c.drawCentredString(cw, PAGE_H - 398, "A joint aesthetics and plastic surgery company")
    c.drawCentredString(cw, PAGE_H - 416, "in Lagos")
    c.setStrokeColor(GOLD); c.setLineWidth(0.7); c.line(cw - 30, PAGE_H - 436, cw + 30, PAGE_H - 436)
    c.setFillColor(LIGHT); c.setFont("Helvetica", 9.5)
    c.drawCentredString(cw, PAGE_H - 456, "Medbury Healthcare Group  ·  KP Plastics  ·  Consult for Africa")

    c.setStrokeColor(GOLD); c.setLineWidth(0.6); c.line(cw - 26, 122, cw + 26, 122)
    c.setFillColor(LIGHT); c.setFont("Helvetica", 9.5)
    c.drawCentredString(cw, 104, "What we have agreed, and what starts now")
    c.setFillColor(MUTED); c.setFont("Helvetica", 8)
    c.drawCentredString(cw, 89, "Prepared by Consult for Africa  ·  August 2026")
    c.restoreState()


def content_bg(c, doc):
    c.saveState()
    c.setFillColor(NAVY); c.rect(0, PAGE_H - 34, PAGE_W, 34, fill=1, stroke=0)
    c.setFillColor(GOLD); c.rect(0, PAGE_H - 37, PAGE_W, 3, fill=1, stroke=0)
    c.setFillColor(white); c.setFont("Helvetica-Bold", 8.5)
    c.drawString(MARGIN, PAGE_H - 23, "HEADS OF TERMS")
    c.setFillColor(LIGHT); c.setFont("Helvetica", 8.5)
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 23, "Medbury  ·  KP Plastics  ·  Consult for Africa")
    c.setFillColor(GOLD); c.rect(MARGIN, 30, 24, 2, fill=1, stroke=0)
    c.setFillColor(MUTED); c.setFont("Helvetica", 8)
    c.drawString(MARGIN, 18, "Private and confidential")
    c.drawRightString(PAGE_W - MARGIN, 18, "Page %d" % doc.page)
    c.restoreState()


def card(text, bg=SURFACE, fg=BODY):
    st = ParagraphStyle("c", parent=P, textColor=fg, leftIndent=8, rightIndent=8, spaceBefore=4, spaceAfter=4)
    t = Table([[Paragraph(text, st)]], colWidths=[FULLW])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg), ("LINEBEFORE", (0, 0), (0, -1), 3, GOLD),
        ("TOPPADDING", (0, 0), (-1, -1), 8), ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 12), ("RIGHTPADDING", (0, 0), (-1, -1), 12),
    ]))
    return t


def grid(rows, col_labels, widths, total_rows=None, aligns=None):
    total_rows = total_rows or set()
    ncols = len(col_labels)
    if aligns is None:
        aligns = ["l"] * (ncols - 1)
    data = [[Paragraph(col_labels[0], CELL_W)] + [Paragraph(t, CELL_WR if aligns[j] == "r" else CELL_W)
                                                  for j, t in enumerate(col_labels[1:])]]
    for i, r in enumerate(rows):
        emph = i in total_rows
        cells = [Paragraph(r[0], CELL_B if emph else CELL)]
        for j, v in enumerate(r[1:]):
            if aligns[j] == "r":
                cells.append(Paragraph(v, CELL_BR if emph else CELL_R))
            else:
                cells.append(Paragraph(v, CELL_B if emph else CELL))
        data.append(cells)
    t = Table(data, colWidths=widths, repeatRows=1)
    stl = [
        ("BACKGROUND", (0, 0), (-1, 0), NAVY), ("LINEBELOW", (0, 0), (-1, 0), 2, GOLD),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 9), ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, SURFACE]),
    ]
    for i in total_rows:
        stl.append(("BACKGROUND", (0, i + 1), (-1, i + 1), CREAM))
        stl.append(("LINEABOVE", (0, i + 1), (-1, i + 1), 1.0, GOLD))
    t.setStyle(TableStyle(stl))
    return t


_SECTION = [0]


def sec(el, eyebrow, title, numbered=True):
    if numbered:
        _SECTION[0] += 1
        label = "%02d  /  %s" % (_SECTION[0], eyebrow)
    else:
        label = eyebrow
    el.append(CondPageBreak(104))
    el.append(Paragraph(label, EYEBROW))
    el.append(Paragraph(title, H1))


def bullets(el, items):
    for it in items:
        el.append(Paragraph(it, BUL, bulletText="•"))


def para(el, *texts, st=P):
    for t in texts:
        el.append(Paragraph(t, st))


def build():
    doc = BaseDocTemplate(
        str(OUT), pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=52, bottomMargin=42,
        title="Heads of Terms - Lagos aesthetics and plastic surgery company",
        author="Consult for Africa")
    doc.addPageTemplates([
        PageTemplate(id="cover", frames=[Frame(MARGIN, 170, FULLW, PAGE_H - 330, id="cover")], onPage=cover_bg),
        PageTemplate(id="content", frames=[Frame(MARGIN, 42, FULLW, PAGE_H - 52 - 42, id="content")], onPage=content_bg),
    ])
    el = []
    el.append(Spacer(1, 2))
    el.append(NextPageTemplate("content"))
    el.append(PageBreak())

    # ================================================== 1. WHAT WE ARE BUILDING
    sec(el, "WHAT WE AGREED", "One company, built together.")
    para(el,
         "On 25 and 26 August the three of us settled what we are building. We are creating a "
         "single company, held by all three parties, separate from the Los Angeles practice, with "
         "its own board, its own team and its own assets, led clinically by Dr Chinwe Kpaduwa. It "
         "will carry its own name. Decisions will be made together, with clear roles. This is that "
         "agreement, written down.",
         st=LEDE)
    el.append(Spacer(1, 2))
    el.append(card(
        "Two things are true at once and the whole design follows from holding both. The product is "
        "proved before it is scaled, so the standard is never traded for growth. And what we build "
        "is capable of scaling once proved, so the investment stands on its own and the standard "
        "reaches more people than one diary ever could.", bg=PANEL))
    el.append(Paragraph("How this document is organised", H2))
    para(el,
         "Each question is answered in one place and one place only. What we each put in is a "
         "different question from who is accountable week to week, and both are different from what "
         "the Company owns and from where the cash goes. They are separated deliberately, so that "
         "nothing is agreed twice in slightly different words and nothing falls between two "
         "sections.")
    el.append(grid(
        [["What we are building", "01 to 04", "The decision, the parties, the company, its name"],
         ["What the Company owns", "05", "Its brand and property, and what it licenses in"],
         ["What each of us puts in", "06 to 08", "Contributions, shareholding, and all of the money"],
         ["How it is run", "09 to 12", "Decisions, the board, accountability, the group relationship"],
         ["How it grows and how we behave", "13 to 14", "Stages and the review, and how we conduct ourselves"],
         ["What happens next", "15 to 16", "The work with owners and dates, and what follows this"]],
        ["", "Sections", "Answering"], [178, 62, FULLW - 240]))

    sec(el, "THE PARTIES", "Three shareholders in one company.")
    el.append(grid(
        [["Medbury Healthcare Group", "Dr Itunu Akinware, Group Chief Executive"],
         ["KP Plastics", "Dr Chinwe Kpaduwa, plastic surgeon and Clinical Director of the Company"],
         ["Consult for Africa", "Dr Adebowale Odulana, Founding Partner"]],
        ["Party", "Represented by"], [180, FULLW - 180]))

    sec(el, "THE COMPANY", "A Nigerian company, standing on its own.")
    el.append(grid(
        [["Form", "A private company limited by shares, incorporated in Nigeria, registered office Lagos"],
         ["Business",
          "Premium aesthetics and plastic surgery: injectables, regenerative treatments, skin, medical dermatology, and cosmetic and plastic surgery delivered at licensed partner theatres. A full-body service with a developed focus on the face"],
         ["Base", "The Lyfe Place, with delivery from partner sites while the base is prepared"],
         ["Separate from KP Plastics LA",
          "Wholly. Its own board, management, employees, assets, accounts and books. Collaboration between the two is expected and welcome, and happens by agreement rather than assumption"],
         ["Separate from Medbury",
          "Equally. It is not a department of the group. It has its own board, its own executive and its own accounts, and group requests reach it through its board"],
         ["Its own people",
          "The Company employs its own team. Where Medbury seconds someone, it is on written terms"]],
        ["", "Agreed"], [138, FULLW - 138]))

    sec(el, "THE NAME", "The Company carries its own name. Dr Kpaduwa keeps hers.")
    para(el,
         "The Company is incorporated and trades under its own name, distinct from KP Plastics. "
         "That protects both. It keeps the Los Angeles practice and the Lagos institution from "
         "being confused with one another in either direction, and it means the Company owns a "
         "name that is genuinely its own.")
    para(el,
         "Dr Kpaduwa's name is not given up by this. Her marks remain her property and are licensed "
         "to the Company on the terms in section 05.")
    el.append(grid(
        [["The criteria",
          "Ownable and registrable in Nigeria. Clearly distinct from KP Plastics. True to a woman-led, natural-result, boutique clinical promise. Able to carry more than one clinician in time"],
         ["The process", "CFA prepares a shortlist with availability searches within ten business days and circulates it to all three"],
         ["Who decides",
          "All three agree. Where we do not converge, Dr Kpaduwa holds the casting view, because the brand is the clinical promise she is accountable for and she is the one who has to stand behind it"]],
        ["", "Agreed"], [118, FULLW - 118]))

    # ============================================== 2. WHAT THE COMPANY OWNS
    sec(el, "WHAT THE COMPANY OWNS", "Everything it makes, and a licence for the one thing it does not.")
    para(el,
         "Every question of property is answered here, so there is no doubt later about what "
         "belongs to whom.")
    el.append(grid(
        [["Owned by the Company, outright and in perpetuity",
          "Its name, identity and house brand. Its protocols and standard operating procedures as documented within it. Its training curriculum and credentialing records. Its patient records and database. Its booking and operating systems as configured. Its marketing content and its own photography. Its supplier terms"],
         ["Owned by KP Plastics, licensed to the Company",
          "The KP Plastics and Dr Kpaduwa marks, and the underlying clinical know-how, technique and standard she brings. Licensed for Nigeria, for the term, used in endorsement, for example the Company's name followed by a line recording that it is founded and clinically led by Dr Chinwe Kpaduwa of KP Plastics. She approves every use and may withdraw approval for any use that falls below her standard. If the licence ever ends, her marks come off and the Company continues under its own name"],
         ["Owned by CFA, licensed to the Company",
          "CFA's platforms and systems, licensed on arm's length terms under the services agreement in section 08. They are not contributed as equity"],
         ["Patient data",
          "Held by the Company, in the Company's systems, under Nigerian data protection law. No party takes a copy for its own use, and records are never moved out of the Company except as the law requires or the patient directs"]],
        ["", "Position"], [170, FULLW - 170]))

    # ========================================== 3. WHAT EACH OF US PUTS IN
    sec(el, "WHAT EACH OF US BRINGS", "Three contributions, none of them substitutable.")
    para(el,
         "This section answers what each of us <b>puts in</b>. Who is accountable for what, week to "
         "week, is a different question and is answered once, in section 11. Each party brings "
         "something the other two cannot buy, hire or build quickly, and the shareholding in "
         "section 07 follows from it.")

    el.append(Paragraph("Medbury brings the capital and the place", H2))
    bullets(el, [
        "The establishment and working capital, which is the money genuinely at risk.",
        "The facility: The Lyfe Place base, re-planned around this partnership at material cost, and the fit-out that turns it into a clinic.",
        "The equipment the service runs on.",
        "An existing Nigerian corporate platform for the Company to sit on, rather than build: payroll, statutory compliance, banking, insurance and back office.",
        "Market access and institutional standing, opening host institutions, referring hospitals and corporate accounts to a business with no trading history of its own.",
        "Referral flow from the wider group, on the terms in section 12.",
    ])

    el.append(Paragraph("KP Plastics brings the reason a patient pays a premium", H2))
    bullets(el, [
        "The clinical authority the premium rests on. A United States trained and certified plastic "
        "surgeon leading the practice is the difference between a clinic that can charge premium "
        "prices and one that competes on price. It cannot be recruited locally and it cannot be bought.",
        "Her name, licensed to the Company under section 05: a reputation built over years in "
        "exactly the patient population this business serves, lent to a company that has none yet.",
        "The clinical standard itself. The protocols, the technique, the treatment algorithms, the "
        "patient selection criteria and the safety backbone. This is real intellectual property and "
        "a new clinic cannot write it from scratch.",
        "The manufacture of the team. Training and credentialing every clinician the Company "
        "employs. This is the contribution that compounds, and Dr Kpaduwa is its only possible source.",
        "Her own hands on the advanced and surgical work, which is the highest value line on the "
        "menu and the scarcest capacity in the business.",
        "Demand: an existing following, the enquiry and audience data from the United States "
        "practice, and the interest that comes with a known name.",
        "Brand and messaging direction already tested against this audience and proven to convert.",
    ])

    el.append(Paragraph("Consult for Africa brings what turns the other two into a company", H2))
    bullets(el, [
        "The structure: this agreement, the shareholders' agreement, the brand licence and the entity itself.",
        "The regulatory pathway, which is a gating item and not an administrative one. Incorporation, "
        "facility registration, Dr Kpaduwa's Nigerian practising licence from temporary through to "
        "full, product registration and import compliance, and data protection. Until this is done "
        "the Company cannot lawfully treat a single patient.",
        "A specialist healthcare recruitment and leadership assessment capability, which the Company "
        "would otherwise have to buy in.",
        "The operating systems the Company runs on: patient records, booking, the customer database "
        "and board reporting.",
        "A supply chain for imported consumables, carrying the foreign exchange exposure and lead "
        "times that are where new aesthetics clinics most often run aground.",
        "The operating team itself, week by week, so that the plan actually happens between three "
        "busy principals in two countries.",
    ])
    el.append(Spacer(1, 3))
    el.append(card(
        "Medbury is the only party that can fund and house this. KP Plastics is the only party that "
        "can make it worth a premium. CFA is the only party whose job is to make it exist and keep "
        "running. Remove any one and there is no company.", bg=PANEL))

    sec(el, "SHAREHOLDING", "The equity that follows from section 06.")
    el.append(grid(
        [["Medbury Healthcare Group", "51%", "Capital, facility, equipment, corporate platform and market access"],
         ["KP Plastics", "34%", "The brand licence, clinical leadership, the founding standard and the training, issued for non-cash consideration. No cash subscription is asked"],
         ["Consult for Africa", "15%", "Structuring and establishment of the Company, and the continuing operator role"],
         ["Total", "100%", ""]],
        ["Shareholder", "Holding", "For"], [155, 62, FULLW - 217],
        total_rows={3}, aligns=["r", "l"]))
    el.append(Spacer(1, 5))
    para(el,
         "These percentages are the proposal on the table and are confirmed in the shareholders' "
         "agreement. If any party subscribes cash beyond the contribution recorded in section 06, "
         "they are adjusted by agreement to reflect it.")

    sec(el, "MONEY", "Every question about cash, answered here.")
    el.append(grid(
        [["Revenue", "All patient income belongs to the Company and is banked to the Company. No party invoices a patient of the Company directly"],
         ["Paying the clinicians",
          "Clinicians, including the Clinical Director, are paid by the Company for clinical work, on terms agreed in writing before Stage 1 delivery begins. This is separate from and additional to any shareholder return. Equity is not a substitute for being paid for the work"],
         ["Funding",
          "Medbury funds the establishment budget and the working capital to sustainable trading, against a budget approved before any drawdown. The launch phase is currently sized at NGN 60M to NGN 75M excluding the facility, which the approved budget confirms"],
         ["Getting it back",
          "Medbury's funding is repaid, with an agreed priority return, out of distributable cash before profit is shared. Then reserves and reinvestment, then distributions to shareholders in proportion to holdings"],
         ["Paying for the premises and equipment",
          "Medbury's investment in the base and its equipment is capital genuinely at risk and is recognised in the shareholding. The Company occupies under a written lease at an agreed rate, and holds equipment on agreed terms, so Medbury is repaid over the term and the Company's accounts stay true"],
         ["CFA's fee",
          "CFA is engaged under a separate written services agreement at arm's length, approved by Medbury and KP Plastics with CFA not voting. Stated here so it is visible from the start: CFA's equity is for the deal and the structuring, and the fee pays the operating team that does the work. They are different things and they sit in different agreements"],
         ["What we have each spent already",
          "Each of us schedules the costs we have incurred since 1 July in reliance on this partnership. On incorporation the board reviews them and either reimburses them or credits them to that party's contribution"],
         ],
        ["", "Agreed"], [150, FULLW - 150]))

    # ==================================================== 4. HOW IT IS RUN
    sec(el, "HOW DECISIONS ARE MADE", "Four tiers, so nothing is ambiguous and nothing is unowned.")
    para(el,
         "This is what makes collaborative decision making real rather than a sentiment. Decisions "
         "sit in four tiers that do not overlap, and the fourth is the catch-all, so nothing is "
         "left without an owner. Every voting threshold in this agreement is set here and nowhere "
         "else.")
    el.append(grid(
        [["One",
          "The Clinical Director alone",
          "The clinical standard and every protocol. Which treatments the Company offers. Who is credentialed to do what. Patient selection. Every clinical claim in marketing, and every use of her name and marks. Immediate suspension of any service on safety grounds"],
         ["Two",
          "The board, three of four votes",
          "The budget, business plan and price list. Capital spend. Appointment of the executive. Host agreements, premises and material contracts. Marketing strategy and spend. Any related-party contract, on which the interested party does not vote"],
         ["Three",
          "All three shareholders, unanimously",
          "Change of the Company's name or brand. New shares, dilution or a new shareholder. Any change to the business in section 03. Sale of the Company. Amending the constitution. Opening an additional site"],
         ["Four",
          "Management",
          "Everything else, within the approved budget and plan, reported to the board. This tier exists so the list above is complete and the Company can run day to day without a meeting"]],
        ["Tier", "Decided by", "Covering"], [52, 122, FULLW - 174]))
    el.append(Spacer(1, 5))
    el.append(card(
        "The test when something new comes up. Is it clinical, or does it use her name? Tier one. "
        "Does it change what the Company fundamentally is? Tier three. Is it a commitment of the "
        "Company's money, people or premises? Tier two. Otherwise management gets on with it.",
        bg=SURFACE))

    sec(el, "THE BOARD", "Who sits, how it meets, and what happens when the principals differ.")
    el.append(grid(
        [["Composition", "Four directors. Medbury appoints two, KP Plastics one, CFA one. Dr Kpaduwa takes the KP Plastics seat as Clinical Director"],
         ["Chair", "Appointed by Medbury, with no casting vote, so no party can carry a decision alone"],
         ["Where the principals differ",
          "If Medbury and KP Plastics take different positions on a tier two matter, it is referred to the two of them to resolve before any vote is taken. CFA facilitates that conversation rather than casting the deciding vote"],
         ["Rhythm and information",
          "Board quarterly, and a monthly operating review with the executive. Everyone sees the same accounts, at the same time, in the same detail"]],
        ["", "Agreed"], [148, FULLW - 148]))

    sec(el, "WHO DOES WHAT", "One accountable party for every function.")
    para(el,
         "This section answers who is accountable, week to week, for the Company's work. It is a "
         "different question from what each of us contributed, which is section 06. Where a "
         "function needs more than one of us, one is accountable and the other supports. "
         "Accountability is never shared, because shared accountability is how things fall down the "
         "gap between two willing people.")
    el.append(grid(
        [["Clinical standard, protocols and credentialing", "KP Plastics", ""],
         ["Delivery of the advanced and surgical work", "KP Plastics", ""],
         ["Training and sign-off of the clinical team", "KP Plastics", "CFA organises"],
         ["Brand direction, messaging and approval of clinical content", "KP Plastics", "CFA executes"],
         ["Corporate back office: payroll, statutory, banking, insurance", "Medbury", "CFA sets up"],
         ["Institutional and referral relationships", "Medbury", "CFA contracts"],
         ["Delivering the fit-out", "Medbury", "CFA project manages"],
         ["Formation, licensing and regulatory establishment", "CFA", "Medbury sponsors locally"],
         ["Recruitment of the team", "CFA", "Medbury sources internally where it can"],
         ["Systems, patient records, booking and data", "CFA", ""],
         ["Marketing operations, funnel and content production", "CFA", "KP Plastics approves"],
         ["Procurement, imports and supply chain", "CFA", "Clinical Director specifies"],
         ["Programme management and board reporting", "CFA", ""],
         ["Running the clinic day to day, and the profit and loss", "The Company's own lead", "CFA recruits and supports"]],
        ["Function", "Accountable", "Supporting"], [FULLW - 252, 120, 132]))
    el.append(Spacer(1, 4))
    para(el,
         "The Company appoints its own day-to-day lead, recruited by CFA and appointed by the "
         "board. Until that seat is filled, CFA carries it.")

    sec(el, "THE MEDBURY GROUP", "The commercial relationship with the group, and only that.")
    el.append(grid(
        [["Referral in",
          "The Company is the exclusive provider of aesthetics and cosmetic surgery to the Medbury group. The group refers into the Company and does not build or buy a competing service while this holds. This is real value to the Company: a patient base from day one"],
         ["On arm's length terms",
          "Referrals, and any group services the Company uses, run to a written protocol at agreed rates, so both sides' accounts are true and no clinical decision is shaped by an internal transfer price"]],
        ["", "Agreed"], [148, FULLW - 148]))
    el.append(Spacer(1, 4))
    para(el,
         "The Company's independence from the group is dealt with in section 03, and what it pays "
         "for premises and equipment in section 08.")

    # ================================ 5. HOW IT GROWS AND HOW WE BEHAVE
    sec(el, "HOW IT GROWS", "Prove the product, then build the bench, then grow.")
    para(el,
         "Scale is the destination, not the starting position. Sequencing it this way makes the "
         "ambition to grow and the insistence on proving the product first the same plan rather "
         "than competing ones. This section sets the stages and the test at each one. The tasks "
         "themselves, with owners and dates, are in section 15.")
    el.append(grid(
        [["Stage 1", "Now to November 2026",
          "Prove the product. The Company exists, the core team is hired and in training, the launch partnership is open, the Stage 1 menu is defined and delivered, and the first cases are documented"],
         ["The review", "November 2026",
          "The three of us look at clinical outcomes, patient experience, the standard held, what the team can deliver, and revenue and cash against plan. We decide together what comes next, and that honestly includes proceeding, taking longer over Stage 1, or agreeing to stop. If we stop, we do it cooperatively, with continuity of patient care as the first consideration. Nobody is committed past the point of proof"],
         ["Stage 2", "2027",
          "The base at The Lyfe Place opens. The team widens. The share of the menu delivered to standard grows. The Company reaches sustainable trading"],
         ["Stage 3", "Thereafter",
          "Growth: more capacity, a second site or a second city. Proposed by the Clinical Director and the executive, and only if all three of us agree"]],
        ["", "When", "The test"], [58, 105, FULLW - 163]))
    el.append(Spacer(1, 5))
    el.append(card(
        "What we are building is an institution, and an institution is what makes a standard reach "
        "further than the person who set it. Growth of the team and of the menu is proposed by the "
        "Clinical Director, at the pace she judges the standard can hold. Nothing is offered that "
        "she has not approved.", bg=PANEL))

    sec(el, "HOW WE WORK", "The standard prevails over the commercial opportunity.")
    para(el,
         "Each of us has stated a position on this and they are the same position. It is recorded "
         "so that it governs the Company rather than depending on who is in the room.")
    bullets(el, [
        "<b>The standard.</b> The Company delivers to the standard Dr Kpaduwa applies in her United "
        "States practice. Where local market practice and that standard differ, the higher standard "
        "applies, without exception.",
        "<b>Consent.</b> No clinical image or patient story is published without the patient's "
        "specific, written and revocable consent. Consent to treatment and consent to publication "
        "are separate, and neither is a condition of the other.",
        "<b>Honest results.</b> Results the Company shows are the Company's own cases. Building a "
        "body of documented results in the population the Company treats is a stated objective, "
        "because patients are entitled to see work done well in people like them.",
        "<b>No barter.</b> No treatment, discount or service is exchanged for promotion, coverage or "
        "endorsement. The Company does not use influencer partnerships.",
        "<b>Safety is resourced, not assumed.</b> A resident prescriber, a written complications "
        "protocol, and hyaluronidase and an anaphylaxis kit stocked and in date wherever injectables "
        "are performed. Every clinician is registered with the relevant Nigerian council and "
        "verified before practice. The Company and every clinician carry medical indemnity, and "
        "every site carries public liability.",
        "<b>We speak for the Company, not for ourselves.</b> Host and partner conversations are had "
        "on behalf of the Company, to an agreed written brief, and the Company holds the "
        "relationship that results.",
        "<b>Conflict.</b> Where a commercial opportunity meets the clinical or ethical standard, the "
        "standard prevails and the Clinical Director's decision is final.",
    ])

    # ============================================== 6. WHAT HAPPENS NEXT
    sec(el, "WHAT STARTS NOW", "The work, with one owner and a date against each item.")
    el.append(grid(
        [["Shortlist, search and agree the Company name", "CFA prepares, all three agree", "10 business days"],
         ["Incorporate, open bank accounts, statutory registrations", "CFA", "10 business days from the name"],
         ["Instruct lawyers on the shareholders' agreement and constitution", "CFA instructs, all three review", "2 weeks"],
         ["Stage 1 menu: the services the Company offers before November", "Dr Kpaduwa", "7 days"],
         ["Establishment budget and twelve month operating budget", "CFA prepares, board approves", "2 weeks"],
         ["Recruit two surgical nurses and one care coordinator", "CFA, with Medbury sourcing internally", "Offers out in 3 weeks"],
         ["Training: discovery call, patient management, the patient journey, protocols", "Dr Kpaduwa, organised by CFA", "Starts on hire"],
         ["Review the United States enquiry and audience data, build the Nigerian interest list", "KP Plastics marketing team with CFA", "At the marketing meeting"],
         ["Agree the written brief for host partners, then meet Euracare", "CFA drafts, all three attend", "Brief first, meeting within 2 weeks"],
         ["Three to five procedures, consented, documented and photographed to standard", "Dr Kpaduwa, coordinated by CFA", "Before the November review"],
         ["Marketing funnel: channels, referral protocol, content calendar", "CFA, approved by KP Plastics", "3 weeks"],
         ["The Lyfe Place base: brief, drawings and fit-out programme", "Medbury, project managed by CFA", "4 weeks"],
         ["Regulatory: facility registration, the Clinical Director's licence, product compliance", "CFA", "Started within 2 weeks"],
         ["The November review", "All three", "November 2026"]],
        ["Action", "Owner", "By when"], [FULLW - 248, 143, 105]))

    sec(el, "WHAT FOLLOWS", "This is the spine. The lawyers put the detail on it.")
    para(el,
         "This document records what we have agreed and lets the work start. The shareholders' "
         "agreement, the constitution and the brand licence follow over the coming weeks and carry "
         "the detail that properly belongs to lawyers, including how shares may be transferred and "
         "the ordinary protections every shareholders' agreement contains. None of that needs to "
         "hold up a single item in section 15.")
    el.append(grid(
        [["What binds now",
          "Confidentiality, the position in section 05 on what the Company owns, and each of us bearing our own costs of getting to the shareholders' agreement"],
         ["What does not",
          "Everything else, which takes effect when the shareholders' agreement and the constitution are signed. This is a statement of what we intend and have agreed in principle, not a binding contract to form a company"],
         ["Confidentiality",
          "This document and everything discussed around it stays between the three of us and our professional advisers, and continues to after any of us steps away"],
         ["Law", "Nigerian law. If we disagree: we talk, then we mediate, then we arbitrate in Lagos"]],
        ["", "Agreed"], [128, FULLW - 128]))

    el.append(PageBreak())
    el.append(Paragraph("AGREED", EYEBROW))
    el.append(Paragraph("Signed by the three parties.", H1))
    for who, name in [
        ("For Medbury Healthcare Group", "Dr Itunu Akinware, Group Chief Executive"),
        ("For KP Plastics", "Dr Chinwe Kpaduwa"),
        ("For Consult for Africa", "Dr Adebowale Odulana, Founding Partner"),
    ]:
        t = Table([[Paragraph("<b>" + who + "</b>", CELL_B)],
                   [Paragraph(name, CELL)],
                   [Spacer(1, 30)],
                   [Paragraph("Signature", SMALL)],
                   [Spacer(1, 12)],
                   [Paragraph("Date", SMALL)]], colWidths=[FULLW])
        t.setStyle(TableStyle([
            ("TOPPADDING", (0, 0), (-1, -1), 2), ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ("LINEBELOW", (0, 3), (0, 3), 0.7, MUTED),
            ("LINEBELOW", (0, 5), (0, 5), 0.7, MUTED),
        ]))
        el.append(t)
        el.append(Spacer(1, 18))

    el.append(Spacer(1, 4))
    el.append(card(
        "<b>Debo Odulana</b> &nbsp; Consult for Africa &nbsp; / &nbsp; Lagos and Abuja<br/>"
        "+234 913 813 8553 &nbsp; / &nbsp; hello@consultforafrica.com &nbsp; / &nbsp; consultforafrica.com",
        bg=NAVY, fg=white))
    el.append(Spacer(1, 6))
    el.append(Paragraph(
        "Draft, shared in confidence between Dr Itunu Akinware, Dr Chinwe Kpaduwa and Dr Adebowale "
        "Odulana. Shareholding and commercial terms are as proposed and are confirmed in the "
        "shareholders' agreement.", SMALL))

    doc.build(el)
    print(f"wrote {OUT}")


if __name__ == "__main__":
    build()
