"""
Build "A fair framework for sharing" for the Lagos aesthetics and plastic
surgery company.

Written in answer to Dr Itunu Akinware's request of 27 August 2026: act as
though every party is bringing cash, determine the cost of set-up, value what
each party brings, monetise it, and let equity follow from that, so that there
is a straightforward way to calculate the value of the equity.

The method is hers. The disciplines added are that contributions are valued
gross and then netted against whatever the party is separately paid, and that
the answer is presented as a schedule rather than a single number, because the
equity each party earns is a function of the cash it agrees to forgo.

Every figure below is a BENCHMARK INPUT to be replaced with the Parties' own
numbers. Nothing in the prose is hardcoded: change the constants and the tables,
the grid and the sentences all recompute.

Companion to scripts/build-aesthetics-mou.py.

Serif, black, plain rules. NGN. No em dashes.

Run:
  python3 scripts/build-aesthetics-sharing-framework.py
"""

from __future__ import annotations

from pathlib import Path

from reportlab.lib.colors import HexColor, black
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    BaseDocTemplate, CondPageBreak, Frame, NextPageTemplate, PageBreak,
    PageTemplate, Paragraph, Spacer, Table, TableStyle,
)

import lib_aesthetics_model as MODEL

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
OUT = DOCS / "aesthetics-sharing-framework-cfa.pdf"

# The model lives in scripts/lib_aesthetics_model.py. This paper, the memorandum
# and the commitment paper all read from it, so they cannot disagree.
M = MODEL.M
REV3 = MODEL.REV3
OPERATOR_MARKET = MODEL.OPERATOR_MARKET
KP_FEE_SHARE = MODEL.KP_FEE_SHARE
CFA_FEE_RATE = MODEL.CFA_FEE_RATE
SURGEON_POOL = MODEL.SURGEON_POOL


def contributions(kp_fee_share=KP_FEE_SHARE, cfa_fee_rate=CFA_FEE_RATE):
    L = MODEL.lines(kp_fee_share, cfa_fee_rate)
    return (
        [(lbl, g, c) for lbl, _b, g, c, _cat, _w in L[MODEL.MEDBURY]],
        [(lbl, g, c) for lbl, _b, g, c, _cat, _w in L[MODEL.KPADUWA]],
        [(lbl, g, c) for lbl, _b, g, c, _cat, _w in L[MODEL.CFA]],
    )


def net(rows):
    return sum(g - c for _, g, c in rows)


ORDER = [MODEL.MEDBURY, MODEL.KPADUWA, MODEL.CFA]


def split(kp_fee_share=KP_FEE_SHARE, cfa_fee_rate=CFA_FEE_RATE):
    """Whole percentages via largest remainder, so every document agrees and
    the three figures always total 100."""
    p_ = MODEL.pct_rounded(kp_fee_share, cfa_fee_rate)
    _, n_, t_ = MODEL.split(kp_fee_share, cfa_fee_rate)
    return [p_[p] for p in ORDER], [n_[p] for p in ORDER], t_


# =============================================================================
PAGE_W, PAGE_H = A4
LM = RM = 64
TM, BM = 62, 58
FULLW = PAGE_W - LM - RM
RULE = HexColor("#000000")
FAINT = HexColor("#666666")
SHADE = HexColor("#EDEDED")
SERIF, SERIF_B, SERIF_I = "Times-Roman", "Times-Bold", "Times-Italic"


def stl(name, **kw):
    base = dict(fontName=SERIF, fontSize=10.5, leading=14.6, textColor=black,
                alignment=TA_JUSTIFY, spaceAfter=0)
    base.update(kw)
    return ParagraphStyle(name, **base)


FS_TITLE = stl("fst", fontName=SERIF_B, fontSize=18, leading=23, alignment=TA_CENTER)
FS_SUB = stl("fss", fontSize=11, leading=15, alignment=TA_CENTER)
FS_FOOT = stl("fsf", fontSize=9, leading=12.5, alignment=TA_CENTER, textColor=FAINT)
H = stl("h", fontName=SERIF_B, fontSize=10.5, leading=14.6, alignment=TA_LEFT,
        leftIndent=30, bulletIndent=0, spaceBefore=13, spaceAfter=5, keepWithNext=1)
CL = stl("cl", leftIndent=30, bulletIndent=0, spaceAfter=6)
SUBCL = stl("s", leftIndent=58, bulletIndent=30, spaceAfter=5)
PLAIN = stl("p", spaceAfter=7)
CENTRE_B = stl("cb", fontName=SERIF_B, fontSize=11, leading=15, alignment=TA_CENTER,
               spaceBefore=6, spaceAfter=8)
CENTRE = stl("c", alignment=TA_CENTER, spaceAfter=6)
TH = stl("th", fontName=SERIF_B, fontSize=9, leading=12, alignment=TA_LEFT)
THR = stl("thr", fontName=SERIF_B, fontSize=9, leading=12, alignment=2)
TD = stl("td", fontSize=9, leading=12, alignment=TA_LEFT)
TDR = stl("tdr", fontSize=9, leading=12, alignment=2)
TDB = stl("tdb", fontName=SERIF_B, fontSize=9, leading=12, alignment=TA_LEFT)
TDBR = stl("tdbr", fontName=SERIF_B, fontSize=9, leading=12, alignment=2)
TDC = stl("tdc", fontSize=9, leading=12, alignment=TA_CENTER)
TDCB = stl("tdcb", fontName=SERIF_B, fontSize=9, leading=12, alignment=TA_CENTER)


def page_num(c, doc):
    c.saveState()
    c.setFont(SERIF, 9); c.setFillColor(FAINT)
    c.drawCentredString(PAGE_W / 2.0, 34, str(doc.page - 1))
    c.restoreState()


def blank(c, doc):
    return


_S = {"n": 0, "sub": 0}


def heading(el, title):
    _S["n"] += 1; _S["sub"] = 0
    el.append(CondPageBreak(92))
    el.append(Paragraph(title.upper(), H, bulletText="%d." % _S["n"]))


def c_(el, text):
    _S["sub"] += 1
    el.append(Paragraph(text, CL, bulletText="%d.%d" % (_S["n"], _S["sub"])))


def subs(el, items):
    for i, t in enumerate(items):
        el.append(Paragraph(t, SUBCL, bulletText="(%s)" % "abcdefgh"[i]))


def ngn(x):
    return "%,.0f" % (x / M) if False else f"{x/M:,.0f}"


def money_table(el, rows, total_label, indent=30):
    data = [[Paragraph("Contribution", TH), Paragraph("At market", THR),
             Paragraph("Paid in cash", THR), Paragraph("Net contribution", THR)]]
    for label, gross, paid in rows:
        data.append([Paragraph(label, TD), Paragraph(ngn(gross), TDR),
                     Paragraph(ngn(paid) if paid else "nil", TDR),
                     Paragraph(ngn(gross - paid), TDR)])
    tot = sum(g - p for _, g, p in rows)
    data.append([Paragraph(total_label, TDB), Paragraph(ngn(sum(g for _, g, _ in rows)), TDBR),
                 Paragraph(ngn(sum(p for _, _, p in rows)), TDBR), Paragraph(ngn(tot), TDBR)])
    t = Table(data, colWidths=[FULLW - indent - 216, 72, 72, 72])
    t.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.5, RULE),
        ("LINEBELOW", (0, 0), (-1, 0), 0.9, RULE),
        ("LINEABOVE", (0, -1), (-1, -1), 0.9, RULE),
        ("BACKGROUND", (0, -1), (-1, -1), SHADE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 5), ("RIGHTPADDING", (0, 0), (-1, -1), 5),
    ]))
    hold = Table([["", t]], colWidths=[indent, FULLW - indent])
    hold.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 3), ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("VALIGN", (0, 0), (-1, -1), "TOP")]))
    el.append(hold)


def build():
    doc = BaseDocTemplate(str(OUT), pagesize=A4, leftMargin=LM, rightMargin=RM,
                          topMargin=TM, bottomMargin=BM,
                          title="A fair framework for sharing", author="Consult for Africa")
    doc.addPageTemplates([
        PageTemplate(id="front", frames=[Frame(LM, BM, FULLW, PAGE_H - TM - BM, id="f")], onPage=blank),
        PageTemplate(id="body", frames=[Frame(LM, BM, FULLW, PAGE_H - TM - BM, id="b")], onPage=page_num),
    ])
    el = []
    base_pct, base_net, base_tot = split(KP_FEE_SHARE, CFA_FEE_RATE)
    full_pct, _, _ = split(1.0, OPERATOR_MARKET)
    none_pct, _, _ = split(0.0, 0.0)

    # ------------------------------------------------------------ front sheet
    el.append(Spacer(1, 150))
    el.append(Paragraph("A FAIR FRAMEWORK FOR SHARING", FS_TITLE))
    el.append(Spacer(1, 16))
    el.append(Paragraph("How the equity in the aesthetics and plastic surgery company "
                        "is derived from what each party actually contributes", FS_SUB))
    el.append(Spacer(1, 40))
    el.append(Paragraph("Medbury Healthcare Group&nbsp;&nbsp;·&nbsp;&nbsp;Dr Chinwe Kpaduwa"
                        "&nbsp;&nbsp;·&nbsp;&nbsp;Consult for Africa", FS_SUB))
    el.append(Spacer(1, 180))
    el.append(Paragraph("Prepared by Consult for Africa. Draft for discussion. "
                        "Private and confidential.", FS_FOOT))
    el.append(NextPageTemplate("body"))
    el.append(PageBreak())

    # ================================================================ 1. WHY
    heading(el, "What this is")
    c_(el, "This paper answers the question put on 27 August: act as though every party is "
           "bringing cash, determine the cost of setting the business up, value what each party "
           "brings, monetise it, and let the equity follow from that, so that there is a "
           "straightforward way to calculate the value of the equity. The method is not ours. It "
           "is the right method, and this paper applies it.")
    c_(el, "It reaches one conclusion that is worth stating at the top. <b>The equity split is not "
           "a matter of opinion once the method is agreed. It is a function of a single decision: "
           "how much cash each party takes for what it provides.</b> A party paid the full market "
           "rate for its contribution has contributed nothing to the balance sheet and should hold "
           "little equity. A party that forgoes cash has, in substance, subscribed for shares with "
           "the money it did not take. Everything else follows arithmetically.")
    c_(el, "So this paper does not propose a number. It sets out the method, applies it, and "
           "presents the answer as a schedule at section 7, on which every candidate split "
           "discussed so far can be located. The Parties choose the setting; the arithmetic gives "
           "the split.")
    c_(el, "<b>Every figure in this paper is a benchmark to be replaced with the Parties' own "
           "numbers.</b> They are the honest starting estimates of an adviser who has built the "
           "operating model, not agreed facts. The value of the paper is the method and the "
           "schedule, not the decimals.")

    # ============================================================ 2. PRINCIPLE
    heading(el, "The principle")
    c_(el, "<b>Equity compensates contribution that is not otherwise compensated.</b> If a party "
           "is paid in cash for a thing, it should not also receive equity for that same thing. "
           "That principle is agreed and this paper adopts it without qualification.")
    c_(el, "Two disciplines are needed or the principle produces the wrong answer.")
    subs(el, [
        "<b>Value gross, then net.</b> Each contribution is first valued at what the Company "
        "would have to pay a third party for it, and only then reduced by what the contributing "
        "party is actually paid. Without this step the contributions of whoever is paid in cash "
        "disappear into the profit and loss account and are never counted at all.",
        "<b>Apply it to everyone.</b> The principle is uncomfortable in every direction. It "
        "reduces the equity of a clinician who takes a market surgeon's fee. It equally reduces "
        "the equity of an operator who takes a market operating fee. And it raises a question "
        "about capital that is repaid first with a priority return, which is dealt with at "
        "section 8.",
    ])

    # =============================================================== 3. METHOD
    heading(el, "The method")
    c_(el, "Five steps.")
    subs(el, [
        "Determine the cost of setting the business up and funding it to a settled state: capital "
        "expenditure, and working capital for the first twelve months.",
        "List what each party brings, itemised, with nothing omitted because it is intangible.",
        "Value each item at market, being what the Company would have to pay a third party to "
        "obtain it, over a stated period. This paper uses the first three years.",
        "Deduct from each item whatever the contributing party is actually paid in cash for it.",
        "The residual is that party's contributed capital. Equity is each party's residual as a "
        "proportion of the total.",
    ])
    c_(el, "The period matters and is a choice. Three years is used here because it is long "
           "enough for a service contribution to be worth something real and short enough that the "
           "revenue forecast is not fiction.")

    # =============================================================== 4. INPUTS
    heading(el, "The inputs")
    c_(el, "These are the figures that drive everything. They are the numbers to argue about, "
           "because the method itself is not in dispute.")
    rows = [
        ["Working capital funded to trading", f"NGN {ngn(MODEL.MEDBURY_OPEX)}m"],
        ["Equipment capital expenditure", f"NGN {ngn(MODEL.MEDBURY_EQUIPMENT)}m"],
        ["Rental value of the premises the Company occupies",
         f"NGN {ngn(MODEL.RENT_PER_YEAR)}m a year, {MODEL.RENT_WAIVED*100:.0f} per cent waived"],
        ["Cumulative revenue, years one to three", f"NGN {ngn(REV3)}m"],
        ["Surgical and advanced work as a share of revenue", f"{MODEL.SURGICAL_SHARE*100:.0f} per cent"],
        ["Market surgeon share of that revenue", f"{MODEL.SURGEON_MARKET_RATE*100:.0f} per cent"],
        ["Market royalty for a personal brand licence",
         f"{MODEL.ROYALTY_MARKET*100:.0f} per cent of the NGN {ngn(MODEL.BRAND_ATTRIBUTABLE)}m the name attracts"],
        ["Partner theatre access",
         f"{MODEL.PARTNER_ACCESS_RATE*100:.1f} per cent of the NGN {ngn(MODEL.SURGICAL_REVENUE)}m it enables"],
        ["Full market operating fee", f"{OPERATOR_MARKET*100:.0f} per cent of revenue"],
    ]
    t = Table([[Paragraph(a, TD), Paragraph(b, TDR)] for a, b in rows],
              colWidths=[FULLW - 30 - 150, 150])
    t.setStyle(TableStyle([("GRID", (0, 0), (-1, -1), 0.5, RULE),
                           ("VALIGN", (0, 0), (-1, -1), "TOP"),
                           ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                           ("LEFTPADDING", (0, 0), (-1, -1), 5), ("RIGHTPADDING", (0, 0), (-1, -1), 5)]))
    hold = Table([["", t]], colWidths=[30, FULLW - 30])
    hold.setStyle(TableStyle([("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                              ("TOPPADDING", (0, 0), (-1, -1), 3), ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
                              ("VALIGN", (0, 0), (-1, -1), "TOP")]))
    el.append(hold)
    c_(el, f"On these inputs the market surgeon fee pool over three years is "
           f"NGN {ngn(SURGEON_POOL)}m, the brand licence is NGN {ngn(MODEL.BRAND_VALUE)}m, and "
           f"the full market operating fee pool is NGN {ngn(REV3*OPERATOR_MARKET)}m. Those three "
           f"are where almost all of the movement in the answer comes from.")

    # ========================================================= 5. CONTRIBUTIONS
    heading(el, "What each party brings, valued")
    c_(el, f"Valued at market over three years, and netted against cash actually paid. The "
           f"settings shown are the middle case: Dr Kpaduwa takes "
           f"{KP_FEE_SHARE*100:.0f} per cent of market surgeon fees, and CFA charges "
           f"{CFA_FEE_RATE*100:.0f} per cent of revenue against a market rate of "
           f"{OPERATOR_MARKET*100:.0f} per cent. All figures NGN millions.")
    med, kp, cfa = contributions(KP_FEE_SHARE, CFA_FEE_RATE)
    el.append(Paragraph("<b>Medbury Healthcare Group</b>", PLAIN))
    money_table(el, med, "Medbury, net contribution")
    el.append(Paragraph("<b>Dr Chinwe Kpaduwa</b>", PLAIN))
    money_table(el, kp, "Dr Kpaduwa, net contribution")
    el.append(Paragraph("<b>Consult for Africa</b>", PLAIN))
    money_table(el, cfa, "CFA, net contribution")

    # ================================================================ 6. RESULT
    heading(el, "What that produces")
    data = [[Paragraph("Party", TH), Paragraph("Net contribution", THR), Paragraph("Equity", THR)]]
    for name, n, p in zip(["Medbury Healthcare Group", "Dr Chinwe Kpaduwa", "Consult for Africa"],
                          base_net, base_pct):
        data.append([Paragraph(name, TD), Paragraph(f"NGN {ngn(n)}m", TDR),
                     Paragraph(f"{p:.0f}%", TDR)])
    data.append([Paragraph("Total", TDB), Paragraph(f"NGN {ngn(base_tot)}m", TDBR),
                 Paragraph("100%", TDBR)])
    t = Table(data, colWidths=[FULLW - 30 - 200, 110, 90])
    t.setStyle(TableStyle([("GRID", (0, 0), (-1, -1), 0.5, RULE),
                           ("LINEBELOW", (0, 0), (-1, 0), 0.9, RULE),
                           ("LINEABOVE", (0, -1), (-1, -1), 0.9, RULE),
                           ("BACKGROUND", (0, -1), (-1, -1), SHADE),
                           ("VALIGN", (0, 0), (-1, -1), "TOP"),
                           ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                           ("LEFTPADDING", (0, 0), (-1, -1), 5), ("RIGHTPADDING", (0, 0), (-1, -1), 5)]))
    hold = Table([["", t]], colWidths=[30, FULLW - 30])
    hold.setStyle(TableStyle([("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                              ("TOPPADDING", (0, 0), (-1, -1), 3), ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
                              ("VALIGN", (0, 0), (-1, -1), "TOP")]))
    el.append(hold)

    # ================================================================ 7. THE DIAL
    heading(el, "The schedule, which is the actual answer")
    c_(el, "The table below is the straightforward way to calculate the equity that was asked "
           "for. Read down for how much of a market surgeon's fee Dr Kpaduwa takes in cash. Read "
           "across for the operating fee CFA charges against a market rate of "
           f"{OPERATOR_MARKET*100:.0f} per cent. Each cell is the resulting split, Medbury first.")
    cols = [OPERATOR_MARKET, 0.06, 0.03, 0.0]
    head = [Paragraph("Dr K takes", TH)] + [
        Paragraph(f"CFA fee {c*100:.0f}%" + (" (market)" if c == OPERATOR_MARKET else ""), THR) for c in cols]
    data = [head]
    for kpf in [1.0, 0.75, 0.5, 0.25, 0.0]:
        row = [Paragraph(f"{kpf*100:.0f}% of market fees", TD)]
        for cfar in cols:
            s, _, _ = split(kpf, cfar)
            row.append(Paragraph(f"{s[0]:.0f} / {s[1]:.0f} / {s[2]:.0f}", TDC))
        data.append(row)
    t = Table(data, colWidths=[FULLW - 30 - 4 * 84] + [84] * 4)
    t.setStyle(TableStyle([("GRID", (0, 0), (-1, -1), 0.5, RULE),
                           ("LINEBELOW", (0, 0), (-1, 0), 0.9, RULE),
                           ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                           ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                           ("LEFTPADDING", (0, 0), (-1, -1), 5), ("RIGHTPADDING", (0, 0), (-1, -1), 5)]))
    hold = Table([["", t]], colWidths=[30, FULLW - 30])
    hold.setStyle(TableStyle([("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                              ("TOPPADDING", (0, 0), (-1, -1), 3), ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
                              ("VALIGN", (0, 0), (-1, -1), "TOP")]))
    el.append(hold)
    c_(el, "Three things follow from that table.")
    subs(el, [
        f"<b>If every Party is paid the full market rate for what it provides, the split is "
        f"approximately {full_pct[0]} / {full_pct[1]} / {full_pct[2]}.</b> Medbury's holding "
        f"rises, because it is then the only Party that has contributed anything not paid for. "
        f"That is the honest answer to the proposition that those who are paid should not also "
        f"hold equity, and it is available to Medbury if it wants it. It costs cash.",
        f"<b>The percentages are not a negotiating position, they are an output.</b> Every "
        f"candidate split discussed between the Parties sits somewhere on this table. The "
        f"question is not which number is right but how much cash the Company pays out, and that "
        f"is a decision rather than an argument.",
        f"<b>The opening position of {base_pct[0]} / {base_pct[1]} / {base_pct[2]} assumes the "
        f"Clinical Director draws {KP_FEE_SHARE*100:.0f} per cent of a market surgeon's fee and "
        f"CFA charges its fee in full.</b> Move either and the answer moves with it. The "
        f"memorandum bounds that movement with a collar, so that no Party's holding can travel "
        f"far from where it starts.",
    ])

    # ======================================================== 8. THE HARD ONE
    heading(el, "The question this method asks of the capital")
    c_(el, "Applied evenly, the principle raises one question that has to be faced, because it is "
           "the same question being asked of everybody else.")
    c_(el, "Under the draft memorandum Medbury's funding is repaid in full, with a priority "
           "return, before any profit is shared. The facility is let to the Company at a rate and "
           "the equipment is held on agreed terms. On the principle in section 2, capital that is "
           "returned first with a return on top has been compensated, and compensated "
           "contributions do not also earn equity.")
    c_(el, "This paper does not push that argument to its conclusion, because it would be wrong "
           "to. A priority return compensates for time and for ranking. It does not compensate for "
           "the risk that the money is never repaid at all, and that risk is real and is Medbury's "
           "alone: the other two parties contribute services and rights, and if the venture fails "
           "they lose their effort while Medbury loses its money. That asymmetry deserves equity "
           "credit, and the tables above give the capital full credit for exactly that reason.")
    c_(el, "But the choice should be made deliberately rather than by omission. Medbury may take "
           "the priority return, or full equity credit for the capital, and the more of the first "
           "it takes the weaker its claim to the second. Our recommendation is that it keeps both "
           "as drafted, on the ground set out above, and that the framework records why rather "
           "than leaving it to be discovered later.")

    # ============================================================== 9. LIMITS
    heading(el, "What this framework does not decide")
    c_(el, "It does not value the business. It values contributions, which is a different "
           "exercise and the right one at this stage.")
    c_(el, "It does not settle the clinical remuneration itself. Whether Dr Kpaduwa takes half a "
           "market surgeon's fee or all of it is a decision for the Parties, and the table shows "
           "the consequence of each.")
    c_(el, "It does not price the regulatory position. Until the Council's answer on registration "
           "is received, the timing of surgical revenue is uncertain, and the surgeon fee pool at "
           "section 4 is the figure most exposed to it.")
    c_(el, "It does not bind anyone. It is a basis for a conversation, offered so that the "
           "conversation is about arithmetic rather than about who feels short-changed.")

    # ============================================================== 10. ASK
    heading(el, "What we need in order to finalise it")
    subs(el, [
        "Agreement that the method at section 3 is the method.",
        "The Parties' own figures for the seven inputs at section 4, in place of the benchmarks.",
        "A decision on the two settings at section 7: the share of market surgeon fees taken in "
        "cash, and the operating fee charged.",
        "A decision on section 8, being whether Medbury takes the priority return, full equity "
        "credit for its capital, or both as currently drafted.",
    ])
    el.append(Spacer(1, 10))
    el.append(Paragraph("Consult for Africa&nbsp;&nbsp;·&nbsp;&nbsp;August 2026", FS_FOOT))

    doc.build(el)
    print(f"wrote {OUT}")
    print(f"middle case  {base_pct[0]:.0f} / {base_pct[1]:.0f} / {base_pct[2]:.0f}")
    print(f"full market  {full_pct[0]:.0f} / {full_pct[1]:.0f} / {full_pct[2]:.0f}")
    print(f"no cash      {none_pct[0]:.0f} / {none_pct[1]:.0f} / {none_pct[2]:.0f}")


if __name__ == "__main__":
    build()
