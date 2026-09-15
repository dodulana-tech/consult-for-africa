"""
Build the orientation brief on the aesthetics venture for Abigail.

For the intern in the Office of the Founding Partner, so she can follow the
matter in meetings, take minutes that make sense, and know what the commitment
register should be tracking.

Deliberately an ORIENTATION, not the negotiating file. It carries what the
parties have agreed and what the documents say. It does not carry either
principal's private position, what CFA expects them to object to next, or
anything from the confidential surveys. If she needs that she should ask Debo
rather than read it here.

Reads from the shared model so the figures match the Memorandum.

Run:
  python3 scripts/build-aesthetics-brief-abigail.py
"""

from __future__ import annotations

from pathlib import Path

from reportlab.lib.colors import HexColor, black
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    BaseDocTemplate, Frame, PageBreak, PageTemplate, Paragraph, Spacer, Table, TableStyle,
)

import lib_aesthetics_model as MODEL

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "aesthetics-brief-abigail-cfa.pdf"

PAGE_W, PAGE_H = A4
LM = RM = 58
TM, BM = 52, 46
FULLW = PAGE_W - LM - RM
RULE = HexColor("#000000")
FAINT = HexColor("#666666")
SERIF, SERIF_B, SERIF_I = "Times-Roman", "Times-Bold", "Times-Italic"


def st(name, **kw):
    base = dict(fontName=SERIF, fontSize=9.4, leading=12.6, textColor=black,
                alignment=TA_JUSTIFY, spaceAfter=0)
    base.update(kw)
    return ParagraphStyle(name, **base)


TITLE = st("t", fontName=SERIF_B, fontSize=14, leading=17, alignment=TA_CENTER, spaceAfter=3)
SUB = st("s", fontSize=9, leading=12, alignment=TA_CENTER, textColor=FAINT, spaceAfter=12)
H = st("h", fontName=SERIF_B, fontSize=10, leading=13, alignment=TA_LEFT, spaceBefore=10, spaceAfter=4)
P = st("p", spaceAfter=6)
BUL = st("b", leftIndent=13, bulletIndent=2, spaceAfter=3)
TH = st("th", fontName=SERIF_B, fontSize=8.8, leading=11.4)
TD = st("td", fontSize=8.8, leading=11.4)
NOTE = st("n", fontSize=8.6, leading=11.4, textColor=FAINT, spaceBefore=4)


def table(el, rows, widths, header):
    data = [[Paragraph(h, TH) for h in header]]
    data += [[Paragraph(c, TD) for c in r] for r in rows]
    t = Table(data, colWidths=widths)
    t.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.4, RULE),
        ("LINEBELOW", (0, 0), (-1, 0), 0.8, RULE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 3.5), ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5),
        ("LEFTPADDING", (0, 0), (-1, -1), 5), ("RIGHTPADDING", (0, 0), (-1, -1), 5),
    ]))
    el.append(t)
    el.append(Spacer(1, 5))


def bullets(el, items):
    for i in items:
        el.append(Paragraph(i, BUL, bulletText="•"))


def build():
    doc = BaseDocTemplate(str(OUT), pagesize=A4, leftMargin=LM, rightMargin=RM,
                          topMargin=TM, bottomMargin=BM,
                          title="The aesthetics venture: an orientation",
                          author="Consult for Africa")
    doc.addPageTemplates([PageTemplate(id="p", frames=[Frame(LM, BM, FULLW, PAGE_H - TM - BM, id="f")])])
    el = []
    pct = MODEL.pct_rounded()

    el.append(Paragraph("THE AESTHETICS VENTURE", TITLE))
    el.append(Paragraph("An orientation for Abigail  ·  Office of the Founding Partner  ·  "
                        "11 September 2026", SUB))

    el.append(Paragraph("What is being built", H))
    el.append(Paragraph(
        "A new company in Lagos offering premium aesthetics and plastic surgery: injectables, "
        "skin and regenerative treatments, medical dermatology, and cosmetic surgery covering "
        "face, breast and body. Three organisations are forming it together. It does not exist "
        "yet, which is the point of the work you will see: everything at the moment is about "
        "agreeing how it will be owned, governed and run before anybody spends money.", P))

    el.append(Paragraph("The three parties, and why each is needed", H))
    table(el, [
        ["Medbury Healthcare Group", "Dr Itunu Akinware",
         "The capital and the place. Funds the company, provides the premises at The Lyfe Place "
         "and the equipment, and brings the standing and relationships of an established "
         "Nigerian healthcare group."],
        ["Dr Chinwe Kpaduwa", "personally",
         "The clinical authority. A plastic surgeon trained and certified in the United States. "
         "She sets the clinical standard, writes the protocols, trains and signs off every "
         "clinician, and performs the advanced and surgical work. Her practice there is called "
         "KP Plastic Surgery and is entirely separate from this company."],
        ["Consult for Africa", "Dr Adebowale Odulana",
         "Builds it and runs it. Structures the venture and its agreements, gets the company "
         "incorporated and licensed, recruits the team, puts in the systems, runs marketing and "
         "procurement, and manages the programme."],
    ], [104, 84, FULLW - 188], ["Party", "Represented by", "What it brings"])
    el.append(Paragraph(
        "The line that captures it, and which appears in the Memorandum: Medbury is the only "
        "party that can fund and house this, Dr Kpaduwa is the only party that can make it worth "
        "a premium, and CFA is the only party whose job is to make it exist and keep running. "
        "Remove any one and there is no company.", P))

    el.append(Paragraph("Where it stands", H))
    el.append(Paragraph(
        f"The three have agreed the ownership split at <b>{pct[MODEL.MEDBURY]} / "
        f"{pct[MODEL.KPADUWA]} / {pct[MODEL.CFA]}</b> in that order. A Memorandum of "
        "Understanding has been drafted, revised through several rounds of comment from both "
        "Medbury's and Dr Kpaduwa's advisers, and is now with the parties. It is a draft for "
        "review, not for signature: lawyers still have to see it before anyone executes.", P))

    el.append(Paragraph("The idea underneath the numbers, which is worth understanding", H))
    el.append(Paragraph(
        "The hard question was how to divide ownership when the three parties contribute "
        "completely different things. Cash is easy to value. A surgeon's reputation is not. The "
        "answer the parties adopted is a single rule applied to everyone: <b>value what each "
        "party brings at market, deduct whatever they are paid for it in cash, and let ownership "
        "follow the balance.</b>", P))
    el.append(Paragraph(
        "So a party paid in full for something contributes nothing by it and earns no equity for "
        "it. A party who forgoes income does contribute, and earns. That is why Medbury waives "
        "part of the rent rather than charging it all, and why Dr Kpaduwa takes half a market "
        "surgeon's fee rather than the whole of it. It is also why CFA charges its management fee "
        "in full and takes no equity at all for managing: if it discounted the fee, the discount "
        "would become a contribution and CFA's share would rise, which is the opposite of what it "
        "wants.", P))

    el.append(Paragraph("Words you will hear in meetings", H))
    table(el, [
        ["Vesting", "Equity that is earned over time rather than handed over on day one. All "
                    "three parties vest here, so nobody holds a stake for work not yet done."],
        ["Tier one, two, three", "The four levels of decision. Tier one is clinical and belongs "
                                 "to Dr Kpaduwa alone. Tier two is the board. Tier three needs "
                                 "every shareholder. Tier four is everything else, which "
                                 "management just gets on with."],
        ["The Clinical Director", "Dr Kpaduwa's role in the company, as distinct from her being "
                                  "a shareholder."],
        ["The House Brand", "The company's own name, which it will own. Separate from her "
                            "personal marks, which she keeps and licenses to it."],
        ["The window", "The period over which contributions of forgone income are counted. It "
                       "closes when Medbury's capital comes back or after three years."],
        ["Stage 1, 2, 3", "Stage 1 runs to a review in November from an existing Medbury clinic. "
                          "Stage 2 opens the permanent base at The Lyfe Place. Stage 3 is growth."],
        ["HEFAMAA, MDCN, NAFDAC", "The Lagos health facility regulator, the doctors' council, and "
                                  "the food and drug agency. The company needs all three before "
                                  "it can treat anyone."],
    ], [96, FULLW - 96], ["Term", "What it means"])

    el.append(PageBreak())
    el.append(Paragraph("What is still open", H))
    bullets(el, [
        "Three figures in the documents are still estimates: CFA's day rates, the cost of "
        "equipment the existing clinic is missing, and the rental value of the space. The last "
        "of these matters most, and the Memorandum requires it to be measured and evidenced "
        "before anyone signs.",
        "The shareholders' agreement and the company's constitution are not drafted yet.",
        "The company has no name. A shortlist is to be prepared and the three parties agree it.",
        "The November review is the next milestone. The parties decide there whether to proceed, "
        "take longer, or stop.",
    ])

    el.append(Paragraph("What this means for your work", H))
    bullets(el, [
        "<b>Minutes.</b> When this comes up, capture decisions and who owns them, not the "
        "discussion. The recurring questions are the split, what each party contributes, who "
        "decides what, and what happens if someone leaves.",
        "<b>The commitment register.</b> The Memorandum has a work plan at Schedule 2 with an "
        "owner and a date against every item. That is the spine of what should be tracked. "
        "Several items are already overdue against it.",
        "<b>Documents.</b> Every document here is generated by a script in <i>scripts/</i> and "
        "written to <i>docs/</i>. Never edit a PDF. If a number needs changing it changes in "
        "<i>scripts/lib_aesthetics_model.py</i> and every document rebuilds from it, which is "
        "how they are kept from contradicting each other.",
        "<b>Filing.</b> The share copies are the ones prefixed “Aesthetics Company” in "
        "<i>docs/</i>. Those are what go to the parties. The others are working files.",
    ])

    el.append(Paragraph("Two things to be careful about", H))
    el.append(Paragraph(
        "<b>This is confidential and commercially sensitive.</b> It involves the private "
        "financial positions of two people and an organisation, and a deal that is not signed. "
        "Nothing about it goes outside the office, and nothing goes to one party that was said by "
        "another. If you are unsure whether something can be shared, assume it cannot and ask.", P))
    el.append(Paragraph(
        "<b>Some of what you will see in the files is not for the parties.</b> Working papers "
        "record CFA's own view of the negotiation, and there are confidential responses from the "
        "principals held separately. Those are for Debo. When you are pulling material for a "
        "meeting pack, take it from the share copies rather than from the working files.", P))

    el.append(Paragraph("Where to read more, in this order", H))
    table(el, [
        ["Aesthetics Company - What Has Changed.pdf", "One page. Start here."],
        ["Aesthetics Company - Memorandum of Understanding (Draft).pdf",
         "The main document. The Principal Terms page at the front is a summary of the whole deal."],
        ["Aesthetics Company - A Fair Framework for Sharing (Draft).pdf",
         "How the ownership split was worked out, if you want the reasoning."],
        ["Aesthetics Company - Commitment and How Equity Is Earned (Draft).pdf",
         "How vesting works and what each party has to do to earn its stake."],
    ], [214, FULLW - 214], ["File in docs/", "What it is"])
    el.append(Paragraph(
        "Ask me anything on this. It is a genuinely complicated deal and nobody expects you to "
        "have absorbed it from one note.", NOTE))
    doc.build(el)
    print(f"wrote {OUT}")


if __name__ == "__main__":
    build()
