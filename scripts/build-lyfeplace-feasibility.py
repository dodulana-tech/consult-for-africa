"""
Lyfe Place Abuja: the feasibility study.

Five tests, each with a verdict, and a recommendation with conditions attached. The
numbers come from scripts/lyfeplace_campus.py; the stress test and breakevens are
solved here rather than typed.

    python3 scripts/build-lyfeplace-feasibility.py
"""

from __future__ import annotations

import importlib
from pathlib import Path

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.platypus import BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer

import lyfeplace_campus as C
from lyfeplace_doc import (
    ALERT, CREAM, FULLW, GREEN, H2, LETTER_TO, MARGIN, P, PH, SIG, SMALL, SUBTITLE,
    TITLE, card, footer_bar, m, make_furniture, sec, tbl,
)

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "lyfeplace-abuja" / "lyfeplace-feasibility.pdf"

M = C.build()
MET = C.metrics(M["cash"])
OPEN_M = C.CONSULTANTS_OPEN_M
rr = lambda k: M[k][-1] * 12
FROM_OPEN = lambda x: x - OPEN_M + 1


def scenario(**kw):
    mod = importlib.reload(C)
    for k, v in kw.items():
        setattr(mod, k, v)
    mod.BLEND_HR = mod.CONSULT_SHARE * mod.RACK_HR + (1 - mod.CONSULT_SHARE) * mod.RACK_HR * mod.PROC_MULT
    mod.SESSION_PRICE = mod.BLEND_HR * mod.UNIT_H * mod.TIER_FACTOR
    mod.CONSULTANTS_CAP = int(mod.PRIME_CAP_WK / (mod.SESS_PER_CONSULTANT_WK * mod.UNIT_H))
    MM = mod.build()
    return MM, mod.metrics(MM["cash"])


def solve(key, lo, hi, integer=False, higher_is_worse=False):
    for _ in range(34):
        mid = (lo + hi) / 2
        v = int(round(mid)) if integer else mid
        good = scenario(**{key: v})[1]["npv"] > 0
        if higher_is_worse:
            lo, hi = (mid, hi) if good else (lo, mid)
        else:
            lo, hi = (lo, mid) if good else (mid, hi)
    return (lo + hi) / 2


NO_TH = dict(THEATRE_CAPITAL=0.0, THEATRE_OWN=[], THEATRE_EXT_SHARE=0.0)
STRESS = [
    ("Base case", {}),
    ("Only 30 consultants, taking 30 months", dict(CONSULTANTS_TARGET=30, CONSULTANTS_RAMP_M=30)),
    ("Survey optimistic: 1.2 sessions a week at 28k", dict(SESS_PER_CONSULTANT_WK=1.2, RACK_HR=28_000)),
    ("No theatre, ever", NO_TH),
    ("Alameda walks, no ground floor tenant",
     dict(TENANTS=[t for t in C.TENANTS if "Alameda" not in t[0]])),
    ("Own clinics 30 per cent below plan",
     dict(OWN_CLINICS=[(n, rv * .7, e * .7, h, o, f, s, d) for n, rv, e, h, o, f, s, d in C.OWN_CLINICS])),
    ("Fit-out 25 per cent over, three months late",
     dict(FIT_SCHEDULED=C.FIT_LEAN * 1.25, CONSULTANTS_OPEN_M=OPEN_M + 3)),
    ("Two demand failures together",
     dict(CONSULTANTS_TARGET=30, CONSULTANTS_RAMP_M=30, SESS_PER_CONSULTANT_WK=1.2, RACK_HR=28_000)),
    ("Three together, with no theatre",
     dict(CONSULTANTS_TARGET=30, CONSULTANTS_RAMP_M=30, SESS_PER_CONSULTANT_WK=1.2,
          RACK_HR=28_000, **NO_TH)),
]


def build():
    OWNCAP = sum(C.OWN_CLINIC_CAPITAL.values())
    opex = [-x for x in M["campus_cost"]]
    MINOPEN = (C.FIT_LEAN + C.SESSIONAL_EQUIPMENT + C.MARKETING_LAUNCH + C.CFA_FEE
               + sum(opex[:OPEN_M - 1])
               + sum(opex[OPEN_M - 1:OPEN_M + 5]) + OWNCAP
               - sum(M["campus_rev"][OPEN_M - 1:OPEN_M + 5]) - C.CONTRIB_TOTAL)
    first = lambda c: next((i + 1 for i in range(C.HORIZON) if c(i)), None)
    GRP_POS = first(lambda i: M["group_eb"][i] >= 0)

    out = []
    for lbl, kw in STRESS:
        _MM, me = scenario(**kw)
        out.append((lbl, me))
    S = dict(out)
    be_cons = solve("CONSULTANTS_TARGET", 18, C.CONSULTANTS_TARGET, integer=True)
    be_rack = solve("RACK_HR", 15_000, C.RACK_HR)
    be_sess = solve("SESS_PER_CONSULTANT_WK", 0.7, C.SESS_PER_CONSULTANT_WK)
    be_ramp = solve("CONSULTANTS_RAMP_M", C.CONSULTANTS_RAMP_M, 60, integer=True, higher_is_worse=True)
    be_fit = solve("FIT_SCHEDULED", C.FIT_LEAN, 900.0, higher_is_worse=True)
    cons_head = 100 * (C.CONSULTANTS_TARGET - be_cons) / C.CONSULTANTS_TARGET
    fit_head = 100 * (be_fit - C.FIT_LEAN) / C.FIT_LEAN
    importlib.reload(C)

    doc = BaseDocTemplate(str(OUT), pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN,
                          topMargin=22 * mm, bottomMargin=18 * mm,
                          title="Lyfe Place Abuja: feasibility study",
                          author="Consult for Africa")
    doc.addPageTemplates([PageTemplate(
        id="m", frames=[Frame(MARGIN, 18 * mm, FULLW, PH - 40 * mm, id="f")],
        onPage=make_furniture("LYFE PLACE", "Abuja campus  /  feasibility study"))])
    el = []
    el.append(Paragraph("Is this worth doing?", TITLE))
    el.append(Paragraph("Five tests, a verdict on each, and the conditions I would attach "
                        "to a yes.", SUBTITLE))

    el.append(Paragraph("Dr Itunu Akinware, Group Chief Executive, Medbury Medical Services",
                        LETTER_TO))
    for para in [
        "Itunu, this tests whether to commit NGN %s M to converting the building into a "
        "medical campus, incorporating six companies around it and operating it. It says "
        "yes, with three conditions, and all three are on the next page." % m(MINOPEN, 0),
        "Five tests: demand, the building, the money, the funding, and what would break it. "
        "Four pass outright. Demand passes on evidence that is real but thin, a consultant "
        "survey with 20 responses against a target of 40 to 60.",
        "It returns <b>%.0f per cent</b>, NPV NGN %s M at a 25 per cent naira hurdle. You need "
        "<b>NGN %s M</b> to open and run six months. Peak exposure is NGN %s M in month %d and "
        "your capital is back in month %d. No terminal value in any of it."
        % (100 * MET["irr"], m(MET["npv"], 0), m(MINOPEN, 0), m(MET["peak"], 0),
           MET["trough_m"], MET["payback"]),
        "One thing to take from it. <b>You can overrun the fit-out by %.0f per cent and still "
        "make money. You can only miss the consultant target by %.0f per cent.</b> The building "
        "is not the risk." % (fit_head, cons_head),
    ]:
        el.append(Paragraph(para, P))
    el.append(Paragraph("Debo Odulana<br/><font size=8 color='#6b7280'>Founding Partner, "
                        "Consult for Africa</font>", SIG))

    # ---------------------------------------------------------------- verdict
    el.append(Paragraph("THE VERDICT", TITLE.clone("v", fontSize=7.4, leading=9.6,
                                                   textColor=CREAM)) if False else Spacer(0, 0))
    sec(el, "00", "THE VERDICT", "Proceed, on three conditions.")
    el.append(tbl(
        [["1  Is there demand?", "QUALIFIED PASS",
          "The survey evidences price, frequency and theatre need. It is 20 responses. "
          "Widen it before the fit-out is committed"],
         ["2  Can the building do it?", "PASS",
          "%d bookable rooms, %d prime hours a week, a ceiling of about %d consultants. "
          "Measured, not assumed" % (C.BOOKABLE, C.PRIME_CAP_WK, C.CONSULTANTS_CAP)],
         ["3  Does it make money?", "PASS",
          "%.0f%% IRR, NPV NGN %s M at 25%%, %.1f times cash back over five years"
          % (100 * MET["irr"], m(MET["npv"], 0), MET["coc"])],
         ["4  Can it be funded?", "PASS",
          "NGN %s M to open and run six months, peaking at NGN %s M in month %d"
          % (m(MINOPEN, 0), m(MET["peak"], 0), MET["trough_m"])],
         ["5  What would break it?", "QUALIFIED PASS",
          "No single failure kills it. Two demand failures together take the return to "
          "single figures"]],
        ["Test", "Verdict", "On what basis"], [136, 92, FULLW - 228],
        aligns=["r", "l"], verdict_col=1))
    el.append(card(
        "<b>Proceed, subject to three conditions.</b><br/>"
        "<b>One.</b> Widen the consultant survey past 40 responses before the fit-out is "
        "committed. It is the thinnest assumption in the pack and the cheapest to firm up. Six "
        "weeks and almost no money.<br/>"
        "<b>Two.</b> Put a break at year three in the conversion clinic's lease. If consultants "
        "sign faster than %d the ground floor is worth more as bookable rooms than as rent, and "
        "a five year term signs that option away.<br/>"
        "<b>Three.</b> Start the FCT licence application in week one, alongside the design "
        "sprint. It is the only item on the critical path that no amount of money or labour "
        "can accelerate later." % C.CONSULTANTS_CAP, bg=GREEN))

    # ---------------------------------------------------------------- 01 demand
    sec(el, "01", "IS THERE DEMAND?", "Qualified pass. Real evidence, thin sample.")
    el.append(Paragraph(
        "The premium medipark consultant survey ran from 12 to 19 August 2026 and returned "
        "20 responses. The target was 40 to 60, so it is under-powered and should be "
        "read with care. What it does say, it says clearly.", P))
    el.append(tbl(
        [["What they will pay", "Optimal price point NGN 65,000, indifference NGN 85,000",
          "van Westendorp, n=16. A 2 hour session at our NGN %s rack rate is NGN %s, which "
          "sits on the optimal point" % (m(C.RACK_HR, 0), m(C.RACK_HR * C.UNIT_H, 0))],
         ["How often they would come", "%.2f sessions a week on average" % C.SESS_PER_CONSULTANT_WK,
          "Half want two or more a week. Only one respondent wanted none"],
         ["When they want to come", "Evenings and Saturday mornings",
          "Saturday morning 25%, evening 19%, afternoon 19%. Weekday daytime is weakest, "
          "which is why our own clinics can share the same rooms"],
         ["Whether they need a theatre", "%.0f%% do" % (100 * C.THEATRE_EXT_SHARE),
          "30% perform procedures needing a full operating theatre, 24% need sedation and "
          "an anaesthetist"],
         ["What they are actually buying", "The service, not the room",
          "Nurse or chaperone 85%, address and how it feels 85%, parking and discretion 84%, "
          "on-site lab and imaging 75%, billing handled 75%"],
         ["Where they practise now", "64% at a hospital where they have privileges",
          "Only 4% have their own consulting rooms, which is the gap this fills"]],
        ["", "What the survey says", "Detail"], [116, 130, FULLW - 246], aligns=["r", "l"]))
    el.append(card(
        "<b>What the survey broke, and this matters.</b> The membership tiers in earlier work "
        "were 1.2M, 2.4M and 4.2M. 25 per cent of respondents said they would not pay "
        "a membership at all, and 38 per cent sit under NGN 500,000. Those tiers do not survive "
        "contact with this sample and have been replaced with 350k, 750k and 1.5M plus a "
        "pay-as-you-go guest rate. A study that only confirms the plan is not a study.", bg=ALERT))
    el.append(Paragraph("What we do not know", H2))
    el.append(tbl(
        [["How many consultants exist", "The survey tells us what 20 want. It does not "
          "size the pool. We need %d and the ceiling is %d, so the question is whether Abuja "
          "holds 50 consultants who want sessional space, not five thousand"
          % (C.CONSULTANTS_TARGET, C.CONSULTANTS_CAP)],
         ["How fast they sign", "The base case says %d in %d months. Nothing in the survey "
          "evidences the pace, only the appetite" % (C.CONSULTANTS_TARGET, C.CONSULTANTS_RAMP_M)],
         ["Whether they pay the rack rate", "The optimal price point is a stated preference, "
          "not a transaction. Stated willingness to pay usually overstates the real thing"]],
        ["The three gaps", ""], [136, FULLW - 136]))

    # ---------------------------------------------------------------- 02 building
    sec(el, "02", "CAN THE BUILDING DO IT?", "Pass. Measured, not assumed.")
    el.append(tbl(
        [["Net internal area", "%s sqm" % m(C.NET), "Extracted from the as-built CAD to about "
          "10 mm. Both floors independently return 70% efficiency, which is the check"],
         ["Lettable ground floor", "%s sqm" % m(C.GF_LETTABLE),
          "282.2 less %s of reception and shared services. The theatre takes %s, the "
          "conversion clinic the remaining %s" % (m(C.GF_SHARED), m(C.THEATRE_SQM), m(C.CONV_SQM))],
         ["Bookable rooms", "%d" % C.BOOKABLE, "%d consulting and %d procedure. The infusion "
          "suite is dedicated and leaves the pool" % (C.ROOMS_CONSULT, C.ROOMS_PROC)],
         ["Prime capacity", "%d hours a week" % C.PRIME_CAP_WK,
          "Weekday 17:00 to 21:00 plus Saturday, across six rooms"],
         ["Consultant ceiling", "%d" % C.CONSULTANTS_CAP,
          "At %.2f sessions a week of %d hours each. We plan for %d, just under it"
          % (C.SESS_PER_CONSULTANT_WK, C.UNIT_H, C.CONSULTANTS_TARGET)],
         ["Our own clinics", "%s room hours a year" % m(sum(h for _n, _r, _e, h, _o, _f, _s, _d
                                                            in C.OWN_CLINICS), 0),
          "They run in the working day, when the consultants do not want the rooms"]],
        ["", "", "Basis"], [128, 84, FULLW - 212], aligns=["r", "l"], hi={4}))
    el.append(Paragraph("The two things that are not in our gift", H2))
    el.append(tbl(
        [["Long lead items", "6 to 12 weeks",
          "Cooling, medical gas, nurse call. They must be ordered in week one against the "
          "design, not when the contractor mobilises. Ordered late, no amount of labour "
          "recovers a month %d opening" % OPEN_M],
         ["Regulatory licensing", "Unknown",
          "FCT facility registration, fire safety certificate, environmental and clinical "
          "waste permit. You cannot open a clinical facility without them. This is the real "
          "gate on the opening date and it is the one item money cannot compress"]],
        ["Risk", "Lead time", "Why it matters"], [116, 62, FULLW - 178], aligns=["r", "l"]))

    # ---------------------------------------------------------------- 03 money
    sec(el, "03", "DOES IT MAKE MONEY?", "Pass, and not marginally.")
    el.append(tbl(
        [["Rent, downstairs", m(rr("rent"), 1),
          "Diagnostics and pharmacy from month %d, the conversion clinic from month %d. "
          "Contracted, so no demand risk"
          % (next(o for n, _a, _r, o, _d in C.TENANTS if "Diagnostics" in n),
             next(o for n, _a, _r, o, _d in C.TENANTS if "Alameda" in n))],
         ["Sessional, upstairs", m(rr("sessional_rev"), 1), "Room fees, equipment, membership"],
         ["Theatre", m(rr("theatre_rev"), 1), "Own lists plus external surgeons"],
         ["Our own clinics", m(rr("own_rev_tot"), 1), "Aesthetics, hair, bariatric medical, infusion"],
         ["Group revenue", m(rr("group_rev"), 1), ""],
         ["Group EBITDA", m(rr("group_eb"), 1), "%.0f%% margin, after our management fee"
          % (100 * rr("group_eb") / rr("group_rev"))],
         ["Attributable to Medbury", m(rr("attr_eb"), 1), "After partner equity in the clinics"]],
        ["", "NGN M a year", "Note"], [136, 78, FULLW - 214], aligns=["r", "l"], hi={4, 5, 6}))
    el.append(Spacer(1, 4))
    el.append(tbl(
        [["Internal rate of return", "%.0f%%" % (100 * MET["irr"]), "Five years, nominal naira"],
         ["Net present value at 25%", "NGN %s M" % m(MET["npv"], 0), "No terminal value, so a floor"],
         ["Cash returned per naira in", "%.1f times" % MET["coc"], "Over the peak ever invested"],
         ["Stops burning cash", "Month %d" % GRP_POS, "%d months after opening" % FROM_OPEN(GRP_POS)],
         ["Capital returned", "Month %d" % MET["payback"], "%d months after opening" % FROM_OPEN(MET["payback"])]],
        ["Returns", "", "Note"], [136, 78, FULLW - 214], aligns=["r", "l"], hi={0}))

    # ---------------------------------------------------------------- 04 funding
    sec(el, "04", "CAN IT BE FUNDED?", "Pass. And the cheque is smaller than the peak.")
    el.append(tbl(
        [["Category A fit-out, after the line by line review", m(C.FIT_LEAN, 1), "Two months on site"],
         ["Clinical and basic equipment, the six let rooms", m(C.SESSIONAL_EQUIPMENT, 1),
          "Couches, procedure lights, monitors, autoclave, resus trolley, front office"],
         ["Launch marketing", m(C.MARKETING_LAUNCH, 1),
          "Brand, website and booking front end, launch and consultant open evenings"],
         ["Setup programme fee", m(C.CFA_FEE, 1), "NGN %s M of it on mobilisation" % m(C.CFA_MOB, 0)],
         ["Pre-opening operating cost", m(sum(opex[:OPEN_M - 1]), 1), "Months 1 to %d" % (OPEN_M - 1)],
         ["Operating cost, first six trading months", m(sum(opex[OPEN_M - 1:OPEN_M + 5]), 1),
          "Management fee included"],
         ["Capital for the four clinics", m(OWNCAP, 1), "Equipment, opening stock, working capital"],
         ["Less revenue, first six trading months", m(-sum(M["campus_rev"][OPEN_M - 1:OPEN_M + 5]), 1), ""],
         ["Less contributions on grant", m(-C.CONTRIB_TOTAL, 1), "Occupier cash on grant of each sub lease"],
         ["Minimum to open and run six months", m(MINOPEN, 1),
          "Building only, without the clinics: NGN %s M" % m(MINOPEN - OWNCAP, 1)]],
        ["", "NGN M", "Note"], [176, 56, FULLW - 232], aligns=["r", "l"], total_row=True))
    el.append(Paragraph(
        "The NGN %s M already committed is spent and is not a new cheque. Peak exposure is NGN "
        "%s M in month %d, which is deeper than the opening cheque because the theatre capital "
        "lands in months 11 to 13 while the consultant ramp is still young. If the theatre "
        "slips, the trough is shallower rather than deeper."
        % (m(C.COMMITTED, 0), m(MET["peak"], 0), MET["trough_m"]), SMALL))

    # ---------------------------------------------------------------- 05 break
    sec(el, "05", "WHAT WOULD BREAK IT?", "Qualified pass. One failure survivable, two not.")
    el.append(tbl(
        [[lbl, "%.0f" % s["peak"], ("%.0f%%" % (100 * s["irr"])) if s["irr"] else "n/a",
          "%.0f" % s["npv"], str(s["payback"] - OPEN_M + 1) if s["payback"] else "never"]
         for lbl, s in out],
        ["Case", "Peak", "IRR", "NPV", "Payback"], [FULLW - 236, 56, 52, 56, 60],
        aligns=["r", "r", "r", "r"], hi={0}, tiny=True))
    el.append(Paragraph("How far each number can fall before the value goes", H2))
    el.append(tbl(
        [["Consultants signed", "%d" % C.CONSULTANTS_TARGET, "%.0f" % be_cons,
          "%.0f%% below plan" % cons_head],
         ["Rack rate an hour", m(C.RACK_HR, 0), m(be_rack, 0),
          "%.0f%% below plan" % (100 * (C.RACK_HR - be_rack) / C.RACK_HR)],
         ["Sessions per consultant a week", "%.2f" % C.SESS_PER_CONSULTANT_WK, "%.2f" % be_sess,
          "%.0f%% below plan" % (100 * (C.SESS_PER_CONSULTANT_WK - be_sess) / C.SESS_PER_CONSULTANT_WK)],
         ["Months to reach the target", "%d" % C.CONSULTANTS_RAMP_M, "%.0f" % be_ramp,
          "%.0f months of slack" % (be_ramp - C.CONSULTANTS_RAMP_M)],
         ["Category A fit-out", m(C.FIT_LEAN, 1), m(be_fit, 1), "%.0f%% over budget" % fit_head]],
        ["Driver", "Base", "Breaks at", "Room to move"],
        [FULLW - 260, 78, 80, 102], aligns=["r", "r", "r"], hi={0}, tiny=True))
    el.append(card(
        "<b>The asymmetry is the finding.</b> Losing Alameda entirely still returns %.0f per "
        "cent, because the ground floor rent is a small part of a NGN %s M business. Losing the "
        "theatre is survivable. A 25 per cent fit-out overrun with a three month delay is "
        "survivable. But 30 consultants arriving slowly, combined with the survey being "
        "optimistic on price and frequency, takes the return to single figures, and adding a "
        "third failure means it never pays back at all.<br/><br/>"
        "So the money is not at risk from the thing everyone will spend the next three months "
        "discussing. <b>It is at risk from a recruitment campaign nobody has run yet, resting "
        "on a survey of 20 people.</b> That is where the attention and the contingency "
        "belong."
        % (100 * S["Alameda walks, no ground floor tenant"]["irr"], m(rr("group_rev"), 0)),
        bg=ALERT))

    # ---------------------------------------------------------------- 06 risks
    sec(el, "06", "RISK REGISTER", "What we would do about each one.")
    el.append(tbl(
        [["Consultants sign slower than planned", "High", "Severe",
          "BD officer in post from month 1 and the recruitment line spent. Pre-sell "
          "founding memberships before opening. Widen the survey now"],
         ["The survey overstates willingness to pay", "Medium", "Severe",
          "Guest rate at rack with no commitment, so the first booking is a low barrier"],
         ["Licence delays the opening", "Medium", "High",
          "Apply in week 1 alongside the design sprint, not at practical completion"],
         ["Long lead items arrive late", "Medium", "High",
          "Ordered in week 1 against the design. A sequencing decision, not a budget one"],
         ["Alameda does not sign", "Medium", "Low",
          "The campus still returns %.0f per cent. Let the ground floor sessionally instead"
          % (100 * S["Alameda walks, no ground floor tenant"]["irr"])],
         ["No surgical anchor for the theatre", "Medium", "Medium",
          "Theatre capital is phase two and gated. Bariatrics launches medical first"],
         ["Fit-out overruns", "Medium", "Low",
          "%.0f per cent of headroom before it matters, and nothing clinical is deferred"
          % fit_head],
         ["Related party pricing challenged", "Low", "Medium",
          "Transfer pricing file built alongside the sub leases in month 1"]],
        ["Risk", "Likelihood", "Impact", "What we do about it"],
        [130, 50, 42, FULLW - 222], aligns=["r", "l", "l"], tiny=True))

    el.append(Spacer(1, 4))
    el.append(tbl(
        [["Internal rate of return", "%.0f%%" % (100 * MET["irr"]), "Five years, nominal naira"],
         ["Net present value at 25%", "NGN %s M" % m(MET["npv"], 0), "No terminal value, so a floor"],
         ["Cash returned per naira in", "%.1f times" % MET["coc"], "Over the peak ever invested"],
         ["Stops burning cash", "Month %d" % GRP_POS, "%d months after opening" % FROM_OPEN(GRP_POS)],
         ["Capital returned", "Month %d" % MET["payback"], "%d months after opening" % FROM_OPEN(MET["payback"])]],
        ["Returns", "", "Note"], [136, 78, FULLW - 214], aligns=["r", "l"], hi={0}))

    # ---------------------------------------------------------------- 04 funding
    el.append(Spacer(1, 6))
    el.append(footer_bar())
    el.append(Spacer(1, 3))
    el.append(Paragraph(
        "Areas measured from the as-built CAD to about 10 mm; the chalet and boys' quarters "
        "have no as-built drawing and remain estimates. Demand evidence from the premium "
        "medipark consultant survey, n=20, 12 to 19 August 2026, against a target of 40 to 60. "
        "The fit-out is an AACE class 4 estimate, minus 15 to plus 30 per cent, before a "
        "tendered bill of quantities. Aesthetics volume, membership uptake and the bariatric "
        "case rate are the least evidenced assumptions. Related party charges are subject to a "
        "transfer pricing opinion. Not a binding offer, and not legal or tax advice.", SMALL))
    doc.build(el)
    print("wrote %s" % OUT.name)
    print("  verdict: proceed on three conditions")
    print("  IRR %.0f%% | NPV %.0f | min to open %.0f | peak %.0f | payback m%d"
          % (100 * MET["irr"], MET["npv"], MINOPEN, MET["peak"], MET["payback"]))
    print("  headroom: consultants %.0f%%, fit-out %.0f%%" % (cons_head, fit_head))


if __name__ == "__main__":
    build()
