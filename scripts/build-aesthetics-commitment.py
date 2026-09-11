"""
Build "Commitment, and how equity is earned" for the Lagos aesthetics and
plastic surgery company.

Written in answer to Dr Itunu Akinware's closing question of 30 August 2026:
"the bone of contention now is what prevents dr chinwe or CFA from walking away",
and to the ten questions in Medbury's adviser's review of the sharing framework.

The argument: the walking-away problem is not a lock-in problem. It is a timing
problem of our own making. The first framework awarded equity today for value
delivered over three years, which is what leaves the door open. Split equity into
what is delivered at completion and what is delivered over time, vest the second
against actual delivery, and the commitment question answers itself without a
single restrictive covenant.

Companion to scripts/build-aesthetics-sharing-framework.py and
scripts/build-aesthetics-mou.py.

Serif, black, plain rules. NGN. No em dashes.

Run:
  python3 scripts/build-aesthetics-commitment.py
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
OUT = DOCS / "aesthetics-commitment-cfa.pdf"

# The contribution model lives in scripts/lib_aesthetics_model.py so that this
# paper, the memorandum and the sharing framework cannot drift apart.
M = MODEL.M
REV3 = MODEL.REV3
OPERATOR_MARKET = MODEL.OPERATOR_MARKET
PARTIES = MODEL.PARTIES

# Lyfe Place opportunity cost, at Medbury's own figure of 30 August.
RENT_PER_SQM_LOW, RENT_PER_SQM_HIGH = 350_000, 375_000
CLINIC_SQM = 200

# Commitment schedule. Shaped by what the clinical partner has said privately is
# sustainable. PRIVATE, do not attribute in any shared document: three visits a
# year rather than four, July and December unavailable, and four remote sessions a
# month rather than one.
VISITS_PER_YEAR = 3
DAYS_PER_VISIT = 10
LISTS_PER_VISIT = 2


def totals():
    out = MODEL.founding_earned()
    return out, sum(v[2] for v in out.values())


# =============================================================================
PAGE_W, PAGE_H = A4
LM = RM = 64
TM, BM = 62, 58
FULLW = PAGE_W - LM - RM
RULE = HexColor("#000000")
FAINT = HexColor("#666666")
SHADE = HexColor("#EDEDED")
SERIF, SERIF_B = "Times-Roman", "Times-Bold"


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
TH = stl("th", fontName=SERIF_B, fontSize=9, leading=12, alignment=TA_LEFT)
THR = stl("thr", fontName=SERIF_B, fontSize=9, leading=12, alignment=2)
TD = stl("td", fontSize=9, leading=12, alignment=TA_LEFT)
TDR = stl("tdr", fontSize=9, leading=12, alignment=2)
TDB = stl("tdb", fontName=SERIF_B, fontSize=9, leading=12, alignment=TA_LEFT)
TDBR = stl("tdbr", fontName=SERIF_B, fontSize=9, leading=12, alignment=2)


def page_num(c, doc):
    c.saveState(); c.setFont(SERIF, 9); c.setFillColor(FAINT)
    c.drawCentredString(PAGE_W / 2.0, 34, str(doc.page - 1)); c.restoreState()


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
        el.append(Paragraph(t, SUBCL, bulletText="(%s)" % "abcdefghij"[i]))


def ngn(x):
    return f"{x/M:,.0f}"


def tbl(el, data, widths, indent=30, shade_last=False, valign="TOP"):
    t = Table(data, colWidths=widths, repeatRows=1)
    s = [("GRID", (0, 0), (-1, -1), 0.5, RULE),
         ("LINEBELOW", (0, 0), (-1, 0), 0.9, RULE),
         ("VALIGN", (0, 0), (-1, -1), valign),
         ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
         ("LEFTPADDING", (0, 0), (-1, -1), 5), ("RIGHTPADDING", (0, 0), (-1, -1), 5)]
    if shade_last:
        s += [("BACKGROUND", (0, -1), (-1, -1), SHADE),
              ("LINEABOVE", (0, -1), (-1, -1), 0.9, RULE)]
    t.setStyle(TableStyle(s))
    hold = Table([["", t]], colWidths=[indent, FULLW - indent])
    hold.setStyle(TableStyle([("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                              ("TOPPADDING", (0, 0), (-1, -1), 3), ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
                              ("VALIGN", (0, 0), (-1, -1), "TOP")]))
    el.append(hold)


def build():
    doc = BaseDocTemplate(str(OUT), pagesize=A4, leftMargin=LM, rightMargin=RM,
                          topMargin=TM, bottomMargin=BM,
                          title="Commitment, and how equity is earned",
                          author="Consult for Africa")
    doc.addPageTemplates([
        PageTemplate(id="front", frames=[Frame(LM, BM, FULLW, PAGE_H - TM - BM, id="f")], onPage=blank),
        PageTemplate(id="body", frames=[Frame(LM, BM, FULLW, PAGE_H - TM - BM, id="b")], onPage=page_num),
    ])
    el = []
    T, GRAND = totals()
    pct = {p: 100 * T[p][2] / GRAND for p in PARTIES}
    surgeon_pool = MODEL.SURGEON_POOL
    PCTR = MODEL.pct_rounded()

    # ------------------------------------------------------------ front sheet
    el.append(Spacer(1, 150))
    el.append(Paragraph("COMMITMENT, AND HOW EQUITY IS EARNED", FS_TITLE))
    el.append(Spacer(1, 16))
    el.append(Paragraph("A response to Medbury's review of the sharing framework, and an answer "
                        "to the question of what keeps each party in", FS_SUB))
    el.append(Spacer(1, 40))
    el.append(Paragraph("Medbury Healthcare Group&nbsp;&nbsp;·&nbsp;&nbsp;Dr Chinwe Kpaduwa"
                        "&nbsp;&nbsp;·&nbsp;&nbsp;Consult for Africa", FS_SUB))
    el.append(Spacer(1, 180))
    el.append(Paragraph("Prepared by Consult for Africa. Draft for discussion. "
                        "Private and confidential.", FS_FOOT))
    el.append(NextPageTemplate("body"))
    el.append(PageBreak())

    # ============================================================ 1. AGREEMENT
    heading(el, "Where we have already landed")
    c_(el, "Medbury's review is a good one and most of it is right. This paper concedes eight of "
           "the ten questions outright, answers the other two, and then addresses the point that "
           "actually matters, which is the one put at the end of the exchange: what prevents "
           "Dr Kpaduwa or CFA from walking away.")
    c_(el, "Two concessions have already been made in the conversation and they change the "
           "arithmetic, so they are recorded here first. <b>CFA will hold 10 per cent, not 15. And "
           "CFA will charge an arm's length market rate for management rather than a discounted "
           "one.</b> The second of those disposes of the review's strongest objection, which was "
           "that the difference between a theoretical market fee and a negotiated fee should not "
           "automatically become permanent equity. It should not, and it no longer does. CFA is "
           "paid the market rate for management and takes no equity for management at all.")
    c_(el, f"Run on that basis, and with the brand valued on the revenue the name can be shown "
           f"to attract rather than on the whole book, the framework produces "
           f"<b>{PCTR[PARTIES[0]]} / {PCTR[PARTIES[1]]} / {PCTR[PARTIES[2]]}</b>. Medbury's own stated comfort zone "
           f"was 55 to 60, 30 to 35, and 8 to 12. The three numbers sit inside it. <b>The "
           f"negotiation over percentages is therefore substantially closed</b>, and what is left "
           f"is the architecture, which is where Medbury said it wanted to start.")

    # ============================================================ 2. THE QUESTION
    heading(el, "The question, and why it answers itself")
    c_(el, "The concern is that sweat equity leaves the door open, because a party that has put "
           "no tangible asset in feels little pain in walking out. That is correct as the first "
           "framework was drafted, and the fault is ours rather than anybody's character.")
    c_(el, "<b>The first framework valued three years of contribution and then awarded the "
           "equity for all of it on day one.</b> Nobody would design that deliberately. It pays in "
           "advance for work not yet done, and a party paid in advance is, by construction, free "
           "to leave. The problem is not that the contributions are intangible. It is that the "
           "timing of the award and the timing of the delivery were never aligned.")
    c_(el, "Align them and the problem dissolves without a single restrictive covenant. That is "
           "the whole of this paper. It is also, usefully, not a lock imposed on anyone. It is the "
           "ordinary consequence of the valuation method all three parties have already accepted.")

    # ============================================================== 3. TWO CLASSES
    heading(el, "Two classes of equity")
    c_(el, "Every contribution is classified by when it is delivered, and the equity for it is "
           "granted at that point and not before.")
    subs(el, [
        "<b>Founding equity</b> is granted for value that is delivered and verifiable at or near "
        "completion: money actually funded, a fit-out actually installed, protocols actually "
        "written and handed over, a company actually incorporated and licensed, a team actually "
        "hired, systems actually working. It is granted on delivery, not on promise, and once "
        "granted it is unconditional.",
        "<b>Earned equity</b> is granted for value delivered over time: clinical work, training, "
        "the use of a name, a referral flow, an operating service. It vests as the contribution is "
        "actually made, measured against what actually happens rather than what was forecast.",
    ])
    c_(el, "The classification is not a judgement about who is trusted. It is a statement about "
           "when a thing arrives.")

    # ============================================================ 4. THE SCHEDULE
    heading(el, "What that produces, and the answer it gives")
    c_(el, "Applying the classification to the contributions already agreed, and with everyone "
           "now paid a market rate in cash for services rendered:")
    data = [[Paragraph("Party", TH), Paragraph("Founding", THR), Paragraph("Earned", THR),
             Paragraph("Total", THR), Paragraph("Equity", THR), Paragraph("Of which vests", THR)]]
    for p in PARTIES:
        f, e, t = T[p]
        data.append([Paragraph(p, TD), Paragraph(ngn(f), TDR), Paragraph(ngn(e), TDR),
                     Paragraph(ngn(t), TDR), Paragraph(f"{100*t/GRAND:.0f}%", TDR),
                     Paragraph(f"{100*e/t:.0f}%", TDR)])
    data.append([Paragraph("Total", TDB), Paragraph(ngn(sum(T[p][0] for p in PARTIES)), TDBR),
                 Paragraph(ngn(sum(T[p][1] for p in PARTIES)), TDBR),
                 Paragraph(ngn(GRAND), TDBR), Paragraph("100%", TDBR), Paragraph("", TDBR)])
    tbl(el, data, [FULLW - 30 - 265, 53, 53, 53, 53, 53], shade_last=True)
    c_(el, "Figures are NGN millions. The last column is the answer to the question that was "
           "asked, and it is worth reading slowly.")
    subs(el, [
        f"<b>{100*T['Dr Chinwe Kpaduwa'][1]/T['Dr Chinwe Kpaduwa'][2]:.0f} per cent of "
        f"Dr Kpaduwa's equity is earned rather than founding.</b> It vests only as she licenses "
        f"the name, trains the team and generates demand. If she steps away after eighteen "
        f"months, she keeps what she has delivered and the rest never vests. Nothing restrains "
        f"her, and nothing needs to.",
        f"<b>All of CFA's equity is founding.</b> Because CFA now charges a market fee for "
        f"management, none of its {pct['Consult for Africa']:.0f} per cent is for future service. "
        f"It is for incorporation, regulatory establishment, recruitment and systems, each of "
        f"which is a deliverable with a date. It vests on delivery of those milestones, and if "
        f"CFA walks before delivering them it receives nothing for them.",
        f"<b>{100*T['Medbury Healthcare Group'][0]/T['Medbury Healthcare Group'][2]:.0f} per cent "
        f"of Medbury's equity is founding</b>, which is right, because its money is spent and at "
        f"risk from the first day and cannot be handed back.",
    ])
    c_(el, "So the party whose commitment was most in doubt holds the equity that is most "
           "contingent, and the party bearing the cash risk holds the equity that is most secure. "
           "That is the correct shape, and it falls out of the method rather than being imposed.")

    # ============================================================ 5. COMMITMENT
    heading(el, "What commitment actually means, and who sets the number")
    c_(el, "The question of how often Dr Kpaduwa appears, and what happens if she does not, has "
           "been treated so far as a commercial one to be negotiated. It is not. For the surgical "
           "part of the business it is settled by a professional standard, and the standard is set "
           "by her own specialty body rather than by any party to this venture.")
    c_(el, "The American Society of Plastic Surgeons issued a Position Statement on Itinerant "
           "Surgery on 19 September 2024. Itinerant surgery is defined as a procedure performed by "
           "a surgeon at a distance from the surgeon's primary practice where the surgeon is not "
           "available for part or all of the patient's preoperative or postoperative care. The "
           "position is that <b>it is unethical for physicians to intentionally perform surgery "
           "under circumstances where they do not establish a relationship with the patient and "
           "or do not maintain responsibility for the continuity of the patient's care.</b> The "
           "surgeon must be involved in preoperative diagnosis and treatment planning, informed "
           "consent, performance of the procedure, and postoperative care including the treatment "
           "of surgical complications.")
    c_(el, "Delegation is permitted only in narrow circumstances, which ASPS lists as a remote "
           "area where subspecialty surgical care is unavailable, illness of the operating "
           "surgeon, live surgery at an accredited educational symposium, and disaster relief or "
           "humanitarian assistance. A commercial clinic in Lagos is none of those. Where care is "
           "nonetheless transferred, the patient must be informed and the transfer should be to a "
           "board-certified plastic surgeon, or failing that to a qualified surgeon trained in the "
           "anatomical areas involved.")
    c_(el, "Two consequences follow and both matter to this venture.")
    subs(el, [
        "<b>The standard has teeth for Dr Kpaduwa personally.</b> ASPS states that members who "
        "perform itinerant surgery without maintaining responsibility for postoperative care, or "
        "who delegate that care to a provider not qualified to undertake it, may be refused "
        "membership, and that active members in violation face the Ethics Committee, the Judicial "
        "Council and possible expulsion. Designing this badly puts her standing at risk. Designing "
        "it properly protects it. That is why this section exists.",
        "<b>ASPS names our business model as the risk case.</b> It records that business models "
        "are deeply problematic where, as a means of lowering the cost of surgery to increase "
        "profit through higher case volume, they rely heavily on contracted surgeons to perform "
        "itinerant surgery. A venture built on a visiting surgeon has to answer that objection "
        "deliberately rather than hope nobody raises it.",
    ])
    c_(el, "The clinical window sets the length of a visit. Haematoma presents within 24 to 72 "
           "hours and can appear up to ten days after drains are removed. Infection presents "
           "typically between days three and fourteen. So the period over which the operating "
           "surgeon's involvement actually matters is about two weeks from the procedure, not two "
           "days.")
    c_(el, "That produces a hard design choice, and it is the choice that should be made now "
           "because it also decides who the Company hires.")
    tbl(el, [
        [Paragraph("Option", TH), Paragraph("What it requires", TH), Paragraph("Consequence", TH)],
        [Paragraph("A. She covers alone", TD),
         Paragraph("Operating early in each visit and remaining through the fourteen day window. "
                   "In practice a visit of about two weeks, four times a year, which is roughly "
                   "56 days a year in Nigeria.", TD),
         Paragraph("No resident surgeon needed. Heavy on her time, and fragile: one changed "
                   "flight and the standard is breached.", TD)],
        [Paragraph("B. A resident plastic surgeon covers", TD),
         Paragraph("The Company recruits a board-certified or equivalently qualified plastic "
                   f"surgeon resident in Lagos. She operates, co-manages, and transfers care with "
                   f"the patient's informed consent. Visits can then be about "
                   f"{DAYS_PER_VISIT} days, {VISITS_PER_YEAR} times a year.", TD),
         Paragraph("Meets the standard, is robust to travel, and is the only version that scales. "
                   "Adds a senior salary to the operating model.", TD)],
    ], [104, FULLW - 30 - 104 - 132, 132])
    c_(el, "<b>We recommend option B, and that the appointment of the resident surgeon is a "
           "condition of the Company offering any surgical procedure at all.</b> The Company's "
           "present hiring plan is two surgical nurses and a care coordinator. That plan supports "
           "the non-surgical menu and does not support surgery. The commitment schedule and the "
           "recruitment plan are therefore the same decision, and it is better made now than "
           "discovered after the first case.")
    c_(el, "None of this constrains the non-surgical business, which is the whole of Stage 1. "
           "Injectables, skin, regenerative treatments and dermatology are delivered by "
           "Nigeria-registered clinicians to her protocols under a resident prescriber, and her "
           "presence is required for training, governance and complex cases rather than for "
           "safety cover.")
    c_(el, "On that basis the commitment schedule below is proposed. It is shaped by what is "
           "sustainable rather than by what sounds acceptable in a meeting, and it remains the "
           "Clinical Director's to accept or correct.")
    tbl(el, [
        [Paragraph("Party", TH), Paragraph("Commitment", TH), Paragraph("Measured by", TH)],
        [Paragraph("Dr Chinwe Kpaduwa", TD),
         Paragraph(f"{VISITS_PER_YEAR} visits a year, minimum {DAYS_PER_VISIT} working days each "
                   f"under option B, with at least {LISTS_PER_VISIT} operating lists per visit "
                   f"once registration permits. Four remote clinical governance sessions a "
                   f"month. Protocols reviewed and signed off quarterly. Named training "
                   f"milestones delivered for each clinician. Named as responsible surgeon for "
                   f"each of her cases, with any transfer of postoperative care made to the "
                   f"resident plastic surgeon on the patient's informed consent. An initial term "
                   f"renewed annually, with the operating calendar fixed a year ahead and two months of the year excluded by agreement.", TD),
         Paragraph("Attendance recorded. Cases logged. Sign-offs dated. Transfers of care "
                   "documented. Reported to the Board quarterly.", TD)],
        [Paragraph("Consult for Africa", TD),
         Paragraph("Incorporation and statutory registrations. Regulatory establishment including "
                   "facility registration and the Clinical Director's licence process. The "
                   "founding team recruited and in post, including the resident plastic surgeon "
                   "before any surgical procedure is offered. Operating systems live. The first "
                   "two quarters of operation delivered against an agreed plan.", TD),
         Paragraph("Each is a dated deliverable. Vesting on written Board acceptance of each "
                   "milestone.", TD)],
        [Paragraph("Medbury Healthcare Group", TD),
         Paragraph("Funding drawn to the approved budget and schedule. The base delivered and "
                   "fitted out to programme. Group referral protocol in force and referrals "
                   "actually routed to the Company.", TD),
         Paragraph("Drawdowns evidenced. Practical completion certified. Referrals counted "
                   "quarterly.", TD)],
    ], [92, FULLW - 30 - 92 - 118, 118])
    c_(el, "If a commitment is missed, the tranche it relates to does not vest in that period. It "
           "is not forfeited for good where the failure is temporary and explained, and the Board "
           "may carry it forward once. What it does not do is vest automatically.")

    # ============================================================== 6. DEPARTURE
    heading(el, "If a party leaves")
    c_(el, "Unvested equity lapses. Vested equity is kept and is bought out on the valuation basis "
           "in the Shareholders' Agreement.")
    c_(el, "On a departure by Dr Kpaduwa the licence of her name terminates on an agreed wind-down "
           "and the Company continues under its own name, which is precisely why the Company was "
           "given a name of its own. <b>The Company keeps what it has been built out of:</b> the "
           "protocols as documented within it, the trained and credentialed team, its patient "
           "records and data, its systems and its content. Those were transferred, not lent.")
    c_(el, "On a departure by CFA the operating systems revert to CFA under the services "
           "agreement, and the Company keeps its records, its team and its documented processes. "
           "CFA's founding equity, being for work already delivered and accepted, is unaffected.")
    c_(el, "Bad leaver treatment, being forfeiture of unvested equity and a buy-out of vested "
           "equity at the lower of cost and value, applies only on defined and serious breach. The "
           "definition is deliberately narrow and belongs in the Shareholders' Agreement.")

    # ============================================================ 7. DECISIONS
    heading(el, "Decision making and ownership")
    c_(el, "The point has been made that greater investment and greater risk should carry "
           "corresponding authority. That is fair, and the current drafting does not fully "
           "reflect it. We propose the following, which gives Medbury the authority it is asking "
           "for without disturbing what made the structure acceptable to Dr Kpaduwa.")
    subs(el, [
        "<b>Commercial decisions follow ownership.</b> On the operating matters reserved to the "
        "Board, being budget, pricing, appointments, contracts, premises and marketing spend, the "
        "chair appointed by Medbury has a casting vote. Medbury carries the commercial risk and "
        "should carry the commercial decision.",
        "<b>Clinical decisions do not.</b> The clinical standard, the protocols, credentialing, "
        "patient selection, clinical claims and the use of Dr Kpaduwa's name remain hers "
        "absolutely and are not voted on. No investor should hold a casting vote over a clinical "
        "judgement, and no clinician of standing would lend a name to a business where one did.",
        "<b>Fundamental matters stay unanimous.</b> The name, dilution, scope, sale, a new site "
        "and termination of the brand licence continue to require all three shareholders, which "
        "protects every party including Medbury.",
    ])
    c_(el, "That division is the ordinary one in clinician-led businesses. It costs Dr Kpaduwa "
           "nothing she was relying on, because her concern was never the marketing budget, and it "
           "gives Medbury the control its capital justifies.")

    # ============================================================== 8. FACILITY
    heading(el, "The facility, at Medbury's own figure")
    lo3 = CLINIC_SQM * RENT_PER_SQM_LOW * 3
    hi3 = CLINIC_SQM * RENT_PER_SQM_HIGH * 3
    c_(el, f"The review is right that the opportunity cost of the space was not separately valued, "
           f"and it should have been. Taking Medbury's own figure of NGN {RENT_PER_SQM_LOW:,} to "
           f"NGN {RENT_PER_SQM_HIGH:,} per square metre and an indicative "
           f"{CLINIC_SQM} square metres, the space is worth roughly NGN "
           f"{ngn(CLINIC_SQM*RENT_PER_SQM_LOW)}m to NGN {ngn(CLINIC_SQM*RENT_PER_SQM_HIGH)}m a "
           f"year, or NGN {ngn(lo3)}m to NGN {ngn(hi3)}m over three years. The area is the input "
           f"to confirm.")
    c_(el, "It should be treated exactly as Medbury proposed, as a rent cost in the profit and "
           "loss account. That keeps the Company's accounts honest and lets the campus recover its "
           "value. The consequence under the agreed principle is simple and cuts both ways: "
           "<b>rent that is paid is compensated and earns no equity; rent that is waived is a "
           "contribution and does.</b> Any waiver should be limited to the recovery of Medbury's "
           "own investment in the base, as proposed, and should be time-limited and stated in "
           "naira rather than open-ended.")
    c_(el, "A hybrid of a reduced rent plus a revenue share is workable and is common for anchor "
           "space. It should be modelled before it is agreed, because a revenue share behaves very "
           "differently from a fixed rent in the years when the Company is still filling its "
           "diary.")

    # ============================================================ 9. TEN QUESTIONS
    heading(el, "The ten questions")
    rows = [
        ("1", "Valuation basis for every intangible",
         "Agreed. A basis note will be supplied for each line, showing the market rate used, its "
         "source and the period."),
        ("2", "Same methodology for Medbury's access and Dr K's demand",
         "Agreed, and correct. Both will be restated on one basis, being acquisition cost avoided "
         "on the revenue each is shown to attract. Whatever that produces, it produces for both."),
        ("3", "Breakdown of the corporate platform figure",
         "Agreed. It will be itemised by function, with the market cost of buying each service in."),
        ("4", "Medbury contributions excluded from the calculation",
         "Conceded. The opportunity cost of the space was omitted and is dealt with at section 8. "
         "Governance architecture, quality systems and procurement leverage will be itemised and "
         "valued or expressly recorded as nil, with reasons."),
        ("5", "Market comparables for the operating fee",
         "Will be supplied. The point largely falls away because CFA now charges the market rate, "
         "so nothing turns on the comparison."),
        ("6", "Why a fee discount should become equity",
         "Conceded in full. It should not, and it no longer does. This was the best point in the "
         "review."),
        ("7", "Separate founding contributions from ongoing service",
         "Agreed. That separation is section 3 and is now the spine of the structure."),
        ("8", "Vest future-service equity as delivered",
         "Agreed. Sections 3 to 5."),
        ("9", "Recalculate variable contributions on actual revenue",
         "Agreed. The royalty and clinical components will be computed annually on actual revenue, "
         "and vesting will follow the actual figure, not the forecast."),
        ("10", "Leaver and termination scenarios in the model",
         "Agreed. Section 6, and carried into the Shareholders' Agreement."),
    ]
    tbl(el, [[Paragraph("", TH), Paragraph("Question", TH), Paragraph("Response", TH)]] +
        [[Paragraph(n, TD), Paragraph(q, TD), Paragraph(a, TD)] for n, q, a in rows],
        [18, 150, FULLW - 30 - 168])

    # ============================================================ 10. THE TEST
    heading(el, "The test Medbury proposed for itself")
    c_(el, "The review asks what it would cost Medbury to hire equivalent clinical talent, build "
           "the brand and hire a management team if neither other party existed. It is the right "
           "test and we would encourage it, with one qualification.")
    c_(el, "Applied to management, the test is now answered by concession: CFA charges the market "
           "rate, so Medbury pays exactly what hiring a team would cost, and the equity is for "
           "founding work with dated deliverables which can be priced against what a firm would "
           "charge to do them.")
    c_(el, f"Applied to the clinical side the test has a limit worth naming. A surgeon can be "
           f"hired, and the surgeon fee pool of roughly NGN {ngn(surgeon_pool)}m over three years "
           f"is what that costs. What cannot be hired is the name, the following it brings, or a "
           f"standard already proven in this patient population, because those belong to a person "
           f"rather than to a role. The correct conclusion from the test is therefore to pay the "
           f"market rate for the service and to grant equity only for the part that could not have "
           f"been bought, which is what the schedule at section 4 now does.")

    # ============================================================ 11. SURVEY
    heading(el, "How the remaining numbers get settled")
    c_(el, "Several of the figures in this paper are ours rather than the Parties'. The honest "
           "way to replace them is to ask each principal the same questions privately and in "
           "writing, rather than to negotiate them in a group chat where nobody wants to be the "
           "first to state a limit.")
    c_(el, "A short structured questionnaire is being issued to Dr Kpaduwa and to Medbury. It "
           "asks each for the things only they can answer: for Dr Kpaduwa the visits and days she "
           "can genuinely sustain and for how long, the procedures she will and will not perform "
           "in Lagos, what she needs in a resident surgeon, and how she wishes to be paid against "
           "equity; for Medbury the funding ceiling and drawdown, the rent basis and any waiver, "
           "the referral volume it can actually commit, and the decisions over which it requires "
           "authority. Both are asked the same closing questions: what would make you walk away, "
           "and what does success look like at the November review.")
    c_(el, "This paper is a position, not a conclusion. It is being sent now because the work "
           "cannot wait for perfect information, and it will be revised on the answers.")

    # ============================================================== 12. ASKS
    heading(el, "What we need to agree")
    subs(el, [
        "That the classification at section 3 is the right one, and that equity is granted when "
        "the contribution is delivered.",
        "The commitment schedule at section 5, in particular the number of visits, days and "
        "operating lists, which are ours to propose and Dr Kpaduwa's to accept.",
        "The vesting periods, and whether earned equity vests quarterly or annually.",
        "The division of decision rights at section 7.",
        "The area of the clinic and the rent basis at section 8, and whether any waiver applies.",
        "The Parties' own figures in place of every benchmark, at which point the schedule is "
        "rerun and the percentages settle themselves.",
    ])
    el.append(Spacer(1, 10))
    el.append(Paragraph("Consult for Africa&nbsp;&nbsp;·&nbsp;&nbsp;August 2026", FS_FOOT))

    doc.build(el)
    print(f"wrote {OUT}")
    for p in PARTIES:
        f, e, t = T[p]
        print(f"  {p:26s} {100*t/GRAND:4.1f}%  founding {100*f/t:3.0f}%  earned {100*e/t:3.0f}%")


if __name__ == "__main__":
    build()
