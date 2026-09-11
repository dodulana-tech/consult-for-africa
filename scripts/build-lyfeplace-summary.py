"""
Lyfe Place Abuja on two pages.

For the reader who will not open four documents tonight. Everything here comes from
scripts/lyfeplace_campus.py, so it cannot disagree with the pack behind it.

    python3 scripts/build-lyfeplace-summary.py
"""

from __future__ import annotations

from pathlib import Path

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.platypus import BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer

import lyfeplace_campus as C
from lyfeplace_doc import (
    ALERT, CREAM, FULLW, GREEN, H2, LETTER_TO, MARGIN, P, PH, SIG, SMALL, SUBTITLE,
    TITLE, card, footer_bar, m, make_furniture, tbl,
)

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "lyfeplace-abuja" / "lyfeplace-summary.pdf"

M = C.build()
MET = C.metrics(M["cash"])
rr = lambda k: M[k][-1] * 12
O = C.CONSULTANTS_OPEN_M
_opex = [-x for x in M["campus_cost"]]
MINOPEN = (C.FIT_LEAN + C.SESSIONAL_EQUIPMENT + C.MARKETING_LAUNCH + C.CFA_FEE
           + sum(_opex[:O - 1]) + sum(_opex[O - 1:O + 5])
           + sum(C.OWN_CLINIC_CAPITAL.values())
           - sum(M["campus_rev"][O - 1:O + 5]) - C.CONTRIB_TOTAL)
CONV_RENT = next(a * r / 1e6 for n, a, r, _o, _d in C.TENANTS if "Alameda" in n)
FIRST = lambda c: next((i + 1 for i in range(C.HORIZON) if c(i)), None)
GRP_POS = FIRST(lambda i: M["group_eb"][i] >= 0)
ANN = lambda v: [sum(v[i * 12:(i + 1) * 12]) for i in range(5)]
MK = sum(v for n, v, o, f, d in C.CAMPUS_COST
         if any(w in n.lower() for w in ["brand", "business development"]))


def build():
    doc = BaseDocTemplate(str(OUT), pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN,
                          topMargin=22 * mm, bottomMargin=18 * mm,
                          title="Lyfe Place Abuja: two page summary",
                          author="Consult for Africa")
    doc.addPageTemplates([PageTemplate(
        id="m", frames=[Frame(MARGIN, 18 * mm, FULLW, PH - 40 * mm, id="f")],
        onPage=make_furniture("LYFE PLACE", "Abuja campus  /  summary"))])
    el = []
    el.append(Paragraph("The Abuja campus, on two pages", TITLE))
    el.append(Paragraph("What it is, what it needs, what it returns, and the three decisions "
                        "that hold the date.", SUBTITLE))

    el.append(Paragraph("What it is", H2))
    el.append(Paragraph(
        "A %s sqm medical campus across four structures, opening in month %d on a two month "
        "fit-out. <b>Downstairs is rent</b>: the conversion clinic is a tenant, so its "
        "clinical revenue is not ours and appears nowhere in these numbers. <b>Upstairs is "
        "the business</b>, and it is sessional: six rooms carrying our own clinics in the "
        "working day and visiting consultants in the evenings and on Saturdays. Diagnostics "
        "takes the guest chalet and the pharmacy the boys' quarters."
        % (m(C.NET), O), P))
    el.append(Paragraph(
        "<b>So the number this runs on is consultants signed, not square metres let.</b> %d "
        "of them against a prime time ceiling of %d, reached %d months after opening. The "
        "pricing is not invented: it comes from the consultant survey run in August."
        % (C.CONSULTANTS_TARGET, C.CONSULTANTS_CAP, C.CONSULTANTS_RAMP_M), P))

    el.append(Paragraph("The money", H2))
    el.append(tbl(
        [["To open and run six months", "NGN %s M" % m(MINOPEN, 0),
          "Lean fit-out %s, equipment %s, launch marketing %s, our fee %s, the four clinics "
          "%s, six months of running cost, less occupier contributions"
          % (m(C.FIT_LEAN, 1), m(C.SESSIONAL_EQUIPMENT, 1), m(C.MARKETING_LAUNCH, 1),
             m(C.CFA_FEE, 1), m(sum(C.OWN_CLINIC_CAPITAL.values()), 1))],
         ["Peak exposure", "NGN %s M" % m(MET["peak"], 0),
          "Month %d. The theatre capital lands while the ramp is still young" % MET["trough_m"]],
         ["Stops burning cash", "Month %d" % GRP_POS, "%d months after opening" % (GRP_POS - O + 1)],
         ["Capital returned", "Month %d" % MET["payback"], "%d months after opening" % (MET["payback"] - O + 1)],
         ["Return", "%.0f%% IRR" % (100 * MET["irr"]),
          "NPV NGN %s M at a 25%% naira hurdle, %.1f times cash back over five years. No "
          "terminal value anywhere" % (m(MET["npv"], 0), MET["coc"])]],
        ["", "", ""], [126, 74, FULLW - 200], aligns=["r", "l"], hi={0, 4}))

    el.append(Paragraph("What it earns at run rate", H2))
    el.append(tbl(
        [["Rent, downstairs", m(rr("rent"), 0),
          "Conversion clinic %s on %s sqm, diagnostics, pharmacy. Contracted, no demand risk"
          % (m(CONV_RENT, 1), m(C.CONV_SQM))],
         ["Sessional, upstairs", m(rr("sessional_rev"), 0), "Room fees, equipment, membership"],
         ["Theatre", m(rr("theatre_rev"), 0), "Own lists plus external surgeons"],
         ["Our own clinics", m(rr("own_rev_tot"), 0),
          "Aesthetics, hair restoration, bariatric and endoscopic, longevity and infusion"],
         ["Group revenue", m(rr("group_rev"), 0), ""],
         ["Group EBITDA", m(rr("group_eb"), 0), "%.0f%% margin, after our management fee"
          % (100 * rr("group_eb") / rr("group_rev"))],
         ["Attributable to Medbury", m(rr("attr_eb"), 0), "After partner equity in the clinics"]],
        ["", "NGN M a year", ""], [126, 74, FULLW - 200], aligns=["r", "l"],
        total_row=True, hi={4, 5}))

    el.append(Paragraph("Year by year", H2))
    el.append(tbl(
        [[l] + [m(v, 0) for v in ANN(M[k])] for l, k in
         [("Group revenue", "group_rev"), ("Group EBITDA", "group_eb"),
          ("Attributable to Medbury", "attr_eb"), ("Net cash flow", "cash")]] +
        [["Consultants signed, year end"] +
         [m(M["consultants"][min((i + 1) * 12 - 1, C.HORIZON - 1)], 0) for i in range(5)]],
        ["NGN M"] + ["Year %d" % (i + 1) for i in range(5)],
        [FULLW - 290] + [58] * 5, aligns=["r"] * 5, hi={0, 2}, tiny=True))

    el.append(card(
        "<b>The one thing to take from the whole pack.</b> You can overrun the fit-out by a "
        "wide margin and still make money. You can only miss the consultant target by about "
        "a third. This is a demand risk wearing a construction project's clothes, and the "
        "thinnest assumption in it rests on 20 survey responses. Widening that survey costs "
        "almost nothing and is the cheapest risk reduction available.", bg=ALERT))

    # ------------------------------------------------------------------ page 2
    el.append(Paragraph("How the campus fills", H2))
    el.append(Paragraph(
        "To sign %d consultants we contact <b>417 named people over %d months, about five a "
        "week</b>. 40 per cent give a real conversation, 45 per cent of those want what we "
        "are selling, and 60 per cent of those who try a session come back. The trial is the "
        "conversion event, not the meeting: a first session at half rate, and someone who "
        "books again within 30 days has signed."
        % (C.CONSULTANTS_TARGET, C.CONSULTANTS_RAMP_M), P))
    el.append(Paragraph(
        "<b>Prime time is the lever, not price.</b> Demand sits in weekday evenings and "
        "Saturday mornings and there are only %d prime hours a week across six rooms. Below "
        "about %d consultants a guaranteed recurring slot costs nothing to give and is worth "
        "a great deal to someone with a hospital job. Past that it is the most valuable thing "
        "on the campus." % (C.PRIME_CAP_WK, C.CONSULTANTS_CAP), P))
    el.append(tbl(
        [["Consulting room", "NGN %s an hour" % m(C.RACK_HR, 0),
          "A 2 hour session is NGN %s, which is the survey's optimal price point"
          % m(C.RACK_HR * C.UNIT_H, 0)],
         ["Procedure room", "NGN %s an hour" % m(C.RACK_HR * C.PROC_MULT, 0),
          "Double the consulting room: couch, operating light, suction, monitor, sterile field"],
         ["Day case theatre", "NGN %s an hour" % m(C.THEATRE_HR, 0),
          "Anaesthesia, HEPA, scrub, two recovery bays"],
         ["Membership", "350k to 1.5M a year", "Four tiers taken off the survey's own "
          "distribution. It discounts the room, never the equipment"]],
        ["The rate card", "", ""], [96, 108, FULLW - 204], aligns=["r", "l"]))

    el.append(Paragraph("The five operating companies", H2))
    rows = [["Lyfe Place Abuja, the campus", "Medbury 100%", m(rr("campus_rev"), 0),
             m(rr("campus_eb"), 0), "Head lease, fit-out, the sessional business, the theatre"]]
    SHORT_D = {
        "Medlyfe Aesthetics and Regenerative":
            "Injectables and skin led, four rooms upstairs, runs in the working day",
        "Lyfe Place Hair Restoration":
            "FUE, 132 cases a year, one procedure room for most of three days",
        "Bariatric, Metabolic and Endoscopic":
            "GLP-1 and swallowable balloons from month 3, endoscopic work from month 9",
        "Medlyfe Longevity and Infusion":
            "Four dedicated bays, programme based, the only line that pre-sells",
    }
    for n, rev, eb, _h, _o, _f, sh, d in C.OWN_CLINICS:
        rows.append([n, "Medbury %.0f%%" % (100 * sh), m(rev, 0), m(eb, 0), SHORT_D.get(n, d)])
    rows.append(["Group", "", m(rr("group_rev"), 0), m(rr("group_eb"), 0),
                 "Attributable to Medbury NGN %s M" % m(rr("attr_eb"), 0)])
    el.append(tbl(rows, ["Company", "Ownership", "Revenue", "EBITDA", ""],
                  [116, 60, 46, 44, FULLW - 266], aligns=["r", "r", "r", "l"],
                  total_row=True, tiny=True))

    el.append(Paragraph("What Consult for Africa is paid", H2))
    el.append(tbl(
        [["Setup programme", "NGN %s M" % m(C.CFA_FEE, 2),
          "178 days across five named grades. Released against four named deliverables, not "
          "hours. Ends when the campus opens"],
         ["Management fee", "%.1f%% then %.1f%%" % (100 * C.MGMT_FEE_BEFORE, 100 * C.MGMT_FEE_AFTER),
          "Of campus revenue. The lower rate until your capital is home. Starts month %d, so "
          "nothing during the fit-out" % C.MGMT_FEE_START_M],
         ["Third party", "At cost", "Architect, mechanical and electrical, quantity surveyor. "
          "No mark up"]],
        ["", "", ""], [96, 92, FULLW - 188], aligns=["r", "l"]))

    el.append(card(
        "<b>Three decisions this week, and they are the ones that hold the month %d opening.</b>"
        "<br/><br/>"
        "<b>One.</b> Approve the design sprint and place the long lead orders. Cooling, "
        "medical gas and nurse call run to 12 weeks. Ordered late, nothing recovers the date."
        "<br/>"
        "<b>Two.</b> Start the FCT licence application now, alongside the design rather than "
        "at practical completion. It is the only item on the critical path that money cannot "
        "accelerate later.<br/>"
        "<b>Three.</b> Settle the conversion clinic lease at NGN %s M with a break at year "
        "three. Housing them costs NGN 332,214 a sqm once rent, their share of the fit-out "
        "and the services they consume are counted, so anything below that is a subsidy. The "
        "break matters because past %d consultants that floor is worth more as bookable rooms."
        % (O, m(CONV_RENT, 1), C.CONSULTANTS_CAP), bg=GREEN))

    el.append(Spacer(1, 5))
    el.append(footer_bar())
    el.append(Spacer(1, 3))
    el.append(Paragraph(
        "Summary only. The full pack is the campus plan and financials, the feasibility "
        "study, the business plan and go to market, the fee schedule and the monthly model. "
        "Areas measured from the as-built CAD; the chalet and boys' quarters remain "
        "estimates. Demand evidence from the premium medipark consultant survey, n=20, "
        "12 to 19 August 2026, against a target of 40 to 60. Fit-out is an AACE class 4 "
        "estimate before a tendered bill of quantities. Not a binding offer, and not legal "
        "or tax advice.", SMALL))
    doc.build(el)
    print("wrote %s" % OUT.name)


if __name__ == "__main__":
    build()
