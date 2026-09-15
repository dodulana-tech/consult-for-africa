"""
Build the one page note of what changed in the Memorandum, for Dr Itunu Akinware.

Written in answer to her question on 11 September 2026. Organised around what she
asked for rather than around the order of the document, so that she can see her
own points answered first. Reads from the shared model, so the figures cannot
drift from the Memorandum.

One page. Same serif setting as the Memorandum so the two sit together.

Run:
  python3 scripts/build-aesthetics-changes.py
"""

from __future__ import annotations

from pathlib import Path

from reportlab.lib.colors import HexColor, black
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer, Table, TableStyle,
)

import lib_aesthetics_model as MODEL

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "aesthetics-changes-note-cfa.pdf"

PAGE_W, PAGE_H = A4
LM = RM = 52
TM, BM = 46, 40
FULLW = PAGE_W - LM - RM
RULE = HexColor("#000000")
FAINT = HexColor("#666666")
SERIF, SERIF_B = "Times-Roman", "Times-Bold"


def st(name, **kw):
    base = dict(fontName=SERIF, fontSize=8.6, leading=11.4, textColor=black,
                alignment=TA_JUSTIFY, spaceAfter=0)
    base.update(kw)
    return ParagraphStyle(name, **base)


TITLE = st("t", fontName=SERIF_B, fontSize=13, leading=16, alignment=TA_CENTER, spaceAfter=3)
SUB = st("s", fontSize=9, leading=12, alignment=TA_CENTER, textColor=FAINT, spaceAfter=9)
H = st("h", fontName=SERIF_B, fontSize=9.2, leading=12, alignment=TA_LEFT,
       spaceBefore=7, spaceAfter=3)
P = st("p", spaceAfter=4)
TH = st("th", fontName=SERIF_B, fontSize=8.4, leading=11)
TD = st("td", fontSize=8.4, leading=11)
FOOT = st("f", fontSize=7.6, leading=10, textColor=FAINT, spaceBefore=6)


def table(el, rows, widths, header):
    data = [[Paragraph(h, TH) for h in header]]
    data += [[Paragraph(c, TD) for c in r] for r in rows]
    t = Table(data, colWidths=widths)
    t.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.4, RULE),
        ("LINEBELOW", (0, 0), (-1, 0), 0.8, RULE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 3), ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("LEFTPADDING", (0, 0), (-1, -1), 4), ("RIGHTPADDING", (0, 0), (-1, -1), 4),
    ]))
    el.append(t)
    el.append(Spacer(1, 3))


def build():
    doc = BaseDocTemplate(str(OUT), pagesize=A4, leftMargin=LM, rightMargin=RM,
                          topMargin=TM, bottomMargin=BM,
                          title="What has changed in the Memorandum",
                          author="Consult for Africa")
    doc.addPageTemplates([PageTemplate(
        id="p", frames=[Frame(LM, BM, FULLW, PAGE_H - TM - BM, id="f")])])
    el = []
    pct = MODEL.pct_rounded()
    el.append(Paragraph("WHAT HAS CHANGED IN THE MEMORANDUM", TITLE))
    el.append(Paragraph("For Dr Itunu Akinware  ·  Consult for Africa  ·  11 September 2026", SUB))

    el.append(Paragraph("The five you called non-negotiable", H))
    table(el, [
        ["Vesting rather than equity issued up front",
         "All three parties now vest. Nobody holds a stake for work not yet done. Medbury is "
         f"{46}% contingent, Dr Kpaduwa {71}%, CFA {60}%. The measures are written at Schedule 4A, "
         "not deferred to the lawyers."],
        ["CFA's fee",
         f"Split by timing rather than cut. {MODEL.CFA_FEE_BASE*100:.0f}% of revenue in cash from "
         f"month one, {MODEL.CFA_FEE_DEFERRED*100:.0f}% deferred until your capital and priority "
         "return are repaid. The Company pays 4 rather than 10 in the loss-making years. Plus a "
         "defined term, KPIs, termination rights, a cap on reimbursables, and the fee decomposed "
         "quarterly so personnel cost is not mistaken for CFA margin."],
        ["A cap on your funding",
         f"NGN {MODEL.ngn(MODEL.MEDBURY_FUNDING_CAP)}m, aggregate and all-in, including cash, "
         "equipment and any other capital expenditure, so nothing can be argued to sit above it. "
         "Beyond it no party is obliged to fund. The ceiling is a limit and not an entitlement: "
         f"the requirement is costed at NGN {sum(v for _, _, v in MODEL.CASH_REQUIREMENT):.0f}m and "
         "the difference is contingency that needs a further approval to draw."],
        ["Minority vetoes",
         "Sale, new sites and borrowing move from unanimity to 75% with a drag, so no minority can "
         "block an exit. Deadlock now has a mechanism: principals, mediation, then a buy-sell."],
        ["Exclusivity tied to performance",
         "Narrowed to cosmetic and plastic surgery only, because aesthetics was too broad to close "
         "off to the Group. Non-surgical becomes a right of first refusal instead. It is now "
         "reciprocal, binding all three, and falls away on a missed longstop, lost licence, "
         "repeated inability to take your referrals, or failure at the November review."],
    ], [118, FULLW - 118], ["Your point", "What the document now does"])

    el.append(Paragraph("Your other points", H))
    table(el, [
        ["The shareholding",
         f"{pct[MODEL.MEDBURY]} / {pct[MODEL.KPADUWA]} / {pct[MODEL.CFA]}. Derived, not "
         "negotiated: every party's valuations are now recognised at one uniform 30%, with cash "
         "spent and income forgone recognised in full. Recognition had been uneven in your "
         "disfavour, at 50% for Medbury against 63% for Dr Kpaduwa."],
        ["CFA's contribution interrogated",
         "The platform licence is conceded: it now earns CFA nothing, because the fee already buys "
         "the systems. The regulatory line was wrong and is corrected from NGN 8m to NGN 1.45m, "
         "and it is now paid by the Company direct to the regulators rather than counted as a CFA "
         "contribution. Schedule 5 itemises every line and the period it covers."],
        ["Your priority return, left blank",
         f"Set at {MODEL.PRIORITY_RETURN*100:.0f}% per annum, simple, accruing from each drawdown "
         "and ceasing on repayment. The board approval threshold is set at NGN 5m. No blanks "
         "remain in the document."],
        ["The Stage 1 exposure you raised",
         f"Separately capped at NGN {MODEL.ngn(MODEL.STAGE1_CAP)}m. Cash you advance before the "
         "review ranks as a first-priority shareholder loan; if the parties discontinue, assets are "
         "realised to repay you first, equipment reverts to you at written-down value, and "
         "unvested equity lapses."],
        ["Your non-cash contribution",
         f"NGN {MODEL.ngn(MODEL.PARTNER_ACCESS_VALUE + MODEL.RENT_TOTAL * MODEL.RENT_WAIVED)}m, not "
         "the NGN 66m your adviser is still quoting from the earlier draft. You have been "
         "undervaluing yourself by some NGN 43m."],
    ], [118, FULLW - 118], ["Your point", "What the document now does"])

    el.append(Paragraph("Changes you did not ask for, which you should know about", H))
    el.append(Paragraph(
        "<b>On Dr Kpaduwa's side.</b> An earlier draft reduced her equity if she declined a "
        "procedure on clinical grounds. That was wrong and it is deleted: a clinical director "
        "financially penalised for saying no is a hazard rather than a safeguard. She also gains "
        "consent rights over decisions bearing directly on her, a floor against dilution, "
        "protection of her background intellectual property, and a defined end to the licence of "
        "her name. Her United States patient database does not transfer; interested individuals "
        "opt in instead. She takes on a positive obligation to be the public face of the Company, "
        "which you asked for and the document previously omitted.", P))
    el.append(Paragraph(
        "<b>On CFA's side.</b> CFA's contribution is disclosed in full at NGN "
        f"{MODEL.ngn(MODEL.CFA_TIME_VALUE + MODEL.CFA_RECRUITMENT + MODEL.CFA_SYSTEMS + MODEL.CFA_RISK_BORNE + sum(v for _, v in MODEL.CFA_ORIGINATION))}m "
        f"and recognised at NGN {MODEL.ngn(MODEL.CFA_STRUCTURING + MODEL.CFA_RECRUITMENT + MODEL.CFA_SYSTEMS)}m, "
        "some 21%, against the 30% at which your valuations and Dr Kpaduwa's are recognised. On "
        "the framework CFA would hold about 16%. It holds 10. CFA's equity is also split so that "
        "the larger part is earned by running the Company and is forfeited if it stops.", P))

    el.append(Paragraph("What is still open", H))
    el.append(Paragraph(
        "Three inputs remain estimates and none of them is a drafting question. CFA's day rates "
        "behind Schedule 5. The equipment gap at the existing clinic, which needs a site visit "
        "rather than an estimate. And the rental value of the space, which carries more of your "
        "holding than any other single figure: the document now requires the measured area and "
        "evidence of market rate to be produced <b>before</b> signature, with the percentages "
        "recomputed on the evidenced figure rather than trued up afterwards.", P))
    el.append(Paragraph(
        "The Memorandum is a draft for review and not for signature. Clause 17 identifies what "
        "binds now. The indemnity, insurance and deadlock provisions want Nigerian counsel before "
        "anyone executes.", FOOT))
    doc.build(el)
    print(f"wrote {OUT}")


if __name__ == "__main__":
    build()
