"""
Lyfe Place Abuja: the business plan, which is a go to market plan.

The campus is not a property project with a marketing problem attached. Signing 45
consultants is the only variable with thin headroom, so this document is mostly about
how that happens, and then how each clinical company wins its own patients.

Numbers come from scripts/lyfeplace_campus.py. The funnel is worked backwards from the
target and every conversion rate is stated so it can be argued with.

    python3 scripts/build-lyfeplace-gtm.py
"""

from __future__ import annotations

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
OUT = ROOT / "docs" / "lyfeplace-abuja" / "lyfeplace-gtm.pdf"

M = C.build()
MET = C.metrics(M["cash"])
rr = lambda k: M[k][-1] * 12
TARGET, RAMP, OPEN_M = C.CONSULTANTS_TARGET, C.CONSULTANTS_RAMP_M, C.CONSULTANTS_OPEN_M

# ---- the funnel, worked backwards from the target
FUNNEL = [
    ("Identified and contacted", 0.40,
     "A named consultant, a warm route in, and a first approach made"),
    ("Qualified conversation", 0.45,
     "Wants sessional space, right specialty, can commit to a recurring slot"),
    ("Books a trial session", 0.60,
     "First session at half rate. This is the real conversion event, not the meeting"),
    ("Signs, guest or tier", 1.00,
     "Books a second time within 30 days. That is what counts as signed"),
]


def funnel_chain():
    """Count AT each stage. Stage n's count times stage n's conversion is stage n+1."""
    counts = [TARGET]
    for _name, conv, _note in reversed(FUNNEL[:-1]):
        counts.append(counts[-1] / conv)
    counts.reverse()
    return [(n, v, c, note) for (n, c, note), v in zip(FUNNEL, counts)]


SEGMENTS = [
    ("Hospital consultants with privileges", "About two thirds of the market",
     "64% of the survey practise at a hospital where they have privileges and only 4% have "
     "their own rooms. They want an address and a nurse, not a lease",
     "Direct approach through the medical directors and heads of unit. Specialty society "
     "meetings. Consultant to consultant referral once the first 10 are in"),
    ("Specialists already in private practice", "The fastest to convert",
     "Already paying for space somewhere worse. The pitch is the address, the parking, the "
     "billing handled and no lease",
     "Direct approach with a costed comparison against what they pay today"),
    ("Sub specialists with no local theatre", "The theatre segment",
     "30% of the survey perform procedures needing a full theatre and 24% need sedation. "
     "They currently travel or turn work away",
     "Theatre open days. A surgical anchor who brings his own list brings others"),
    ("Diaspora and visiting consultants", "Episodic, high value",
     "Fly in for a week, need a fully serviced room and a booked list waiting. No interest "
     "in overheads at all",
     "Professional bodies abroad, alumni networks, and the campus website carrying a "
     "visiting consultant page"),
]

CHANNELS = [
    ("Consultant to consultant referral", 12.0, "Free, and the best channel we have. A "
     "signed consultant introducing one more is worth more than any campaign. Pay for it: "
     "a month of free sessions for a successful introduction"),
    ("Open evenings at the campus", 8.0, "Monthly from month 2. They have to stand in the "
     "room. The survey says the address and how it feels is what 85% are buying"),
    ("Specialty society and NMA meetings", 6.0, "Sponsor, present, and take the room list "
     "away. This is where the named list of 167 comes from"),
    ("Direct approach through heads of unit", 5.0, "The BD officer's core job. Five "
     "contacts and two qualified conversations a week is the whole target"),
    ("Digital: the site, the booking page, search", 8.0, "A consultant checking us at "
     "11pm has to be able to see a room, a rate and a slot without calling anyone"),
]

CLINIC_GTM = [
    ("Medlyfe Aesthetics and Regenerative", 285.0, 633, "active patients a year at ~450k",
     "Consumer, visual, repeat",
     "Instagram and TikTok led, before and after with consent, practitioner as the brand. "
     "Corporate wellness days for the professional women who are the core buyer. Cross "
     "referral from longevity and from the conversion clinic. Repeat is the whole model: "
     "injectables return every three to four months, so retention beats acquisition"),
    ("Lyfe Place Hair Restoration", 220.0, 132, "cases a year at ~1.67 M",
     "High value, long consideration",
     "6 to 12 months from first search to booking, so the funnel has to be patient. "
     "Testimonial and result led with real cases. Diaspora is a genuine segment and will "
     "travel. Private consultation, discreet entrance, and no waiting room overlap with "
     "the aesthetics clinic. A high acquisition cost is affordable here and nowhere else"),
    ("Bariatric, Metabolic and Endoscopic", 263.0, 0, "",
     "Referral and demand led, and it steps up three times",
     "Three products at three price points, and a patient can move up the ladder without "
     "leaving. <b>GLP-1 and dietetics</b> from month 3 at about 780k a year across 122 "
     "patients: demand is running ahead of supply and does not need creating, only "
     "capturing. <b>Swallowable balloons</b> from month 3 too, 24 cases at about 4.0 M, and "
     "this is the important one because it is a real bariatric procedure that needs no "
     "theatre, no anaesthetist and no endoscopy stack. <b>Endoscopic balloon, sleeve "
     "gastroplasty and gastric botox</b> from month 9 when the stack lands, 12 cases at "
     "about 5.0 M plus minor work. Surgery only if the theatre is built.<br/><br/>"
     "Channel is search and pharmacy referral, endocrinology and primary care referral, and "
     "corporate health screening as the front door. Programme based and monthly, so the "
     "metric that matters is month four retention, not sign ups. The GLP-1 cohort is also "
     "the referral base for the balloons: a patient who plateaus on medication is already "
     "in the building and already trusts the team"),
    ("Medlyfe Longevity and Infusion", 240.0, 267, "members a year at ~900k",
     "Corporate and pre-sellable",
     "The only line that can be sold before the doors open, which is why it de-risks the "
     "ramp. Corporate wellness contracts and executive health packages, not consumer "
     "digital. Sell annual programmes to companies in Q1 and the suite opens with a book"),
]


def build():
    doc = BaseDocTemplate(str(OUT), pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN,
                          topMargin=22 * mm, bottomMargin=18 * mm,
                          title="Lyfe Place Abuja: the business plan",
                          author="Consult for Africa")
    doc.addPageTemplates([PageTemplate(
        id="m", frames=[Frame(MARGIN, 18 * mm, FULLW, PH - 40 * mm, id="f")],
        onPage=make_furniture("LYFE PLACE", "Abuja campus  /  business plan"))])
    el = []
    chain = funnel_chain()
    top = chain[0][1]
    mk = sum(v for n, v, o, f, d in C.CAMPUS_COST
             if any(w in n.lower() for w in ["brand", "business development"]))
    own_rev = sum(x[1] for x in C.OWN_CLINICS)

    el.append(Paragraph("How the campus fills", TITLE))
    el.append(Paragraph("The business plan, which is mostly a plan for signing %d consultants."
                        % TARGET, SUBTITLE))

    el.append(Paragraph("Dr Itunu Akinware, Group Chief Executive, Medbury Medical Services",
                        LETTER_TO))
    for para in [
        "Itunu,",
        "The financial plan showed you that this campus can only be hurt in one place. You "
        "can overrun the building by 60 per cent and still make money. You can only miss the "
        "consultant target by a third. So this document is mostly about how %d consultants "
        "get signed, and then how each clinical company wins its own patients." % TARGET,
        "The headline is that the number is smaller than it sounds. To sign %d we have to "
        "reach <b>%.0f named consultants over %d months</b>, which is about five a week. That "
        "is a job for one person with a budget, not a campaign."
        % (TARGET, top, RAMP),
        "What I would watch is not the total but the trial. A meeting converts nothing. A "
        "consultant who books one session at half rate and comes back within 30 days has "
        "signed, whatever the paperwork says. Everything here is built to get people into a "
        "room rather than into a conversation.",
        "The four clinical companies each need a different route to market and I have set "
        "them out separately. Only one of them, longevity and infusion, can be sold before "
        "we open. That is why it matters more than its share of revenue suggests.",
    ]:
        el.append(Paragraph(para, P))
    el.append(Paragraph("Debo Odulana<br/><font size=8 color='#6b7280'>Founding Partner, "
                        "Consult for Africa</font>", SIG))

    # ------------------------------------------------------------- 01 the number
    sec(el, "01", "THE NUMBER", "Worked backwards from %d, not forwards from hope." % TARGET)
    el.append(tbl(
        [[n, "%.0f" % v, "%.0f%%" % (100 * c), note] for n, v, c, note in chain],
        ["Stage", "Needed", "Converts", "What it means"],
        [126, 46, 50, FULLW - 222], aligns=["r", "r", "l"], hi={0}))
    el.append(card(
        "<b>%.0f named consultants over %d months is about 23 a month, or 5 a week.</b> That "
        "is the whole target. Every conversion rate above is an assumption and none of them "
        "is heroic: 40 per cent of named contacts give you a real conversation, 45 per cent "
        "of those want what we are selling, and 60 per cent of those who try a session come "
        "back. If the trial conversion is better than 60 per cent, and it should be once the "
        "rooms are finished, the whole funnel gets easier."
        % (top, RAMP), bg=GREEN))
    el.append(Paragraph("The signing profile is not flat", H2))

    def ramp_f(i, n):
        if i <= 0:
            return 0.0
        if i >= n:
            return 1.0
        x = i / n
        return x * x * (3 - 2 * x)

    rows, prev = [], 0.0
    for q in range(1, 7):
        mth = q * 3
        cum = TARGET * ramp_f(mth, RAMP)
        rows.append(["Quarter %d, to month %d" % (q, mth + OPEN_M - 1),
                     "%.0f" % cum, "+%.0f" % (cum - prev),
                     "%.0f contacts in the quarter" % ((cum - prev) / TARGET * top)])
        prev = cum
    el.append(tbl(rows, ["", "Signed by then", "In the quarter", "Implied effort"],
                  [140, 74, 74, FULLW - 288], aligns=["r", "r", "l"]))
    el.append(Paragraph(
        "The middle four quarters carry three quarters of the signings. Quarter one is slow "
        "because the rooms are new and there is nothing to show; the last quarter is slow "
        "because prime time is filling up. Judge the campaign on quarters two to five.", SMALL))
    el.append(Paragraph("How big is the pool", H2))
    el.append(tbl(
        [["If Abuja holds %s specialist consultants" % format(p, ","),
          "%d is %.1f%% of them" % (TARGET, 100 * TARGET / p),
          "Comfortable" if TARGET / p < 0.05 else "Needs a wide net"]
         for p in (600, 900, 1200)],
        ["", "Penetration", "Read"], [200, 130, FULLW - 330], aligns=["r", "l"]))
    el.append(Paragraph(
        "The survey tells us what 20 consultants want. It does not size the pool, and that "
        "is the first gap named in the feasibility study. Sizing it is a six week piece of "
        "work and it should run alongside the fit-out, not after it.", SMALL))

    # ------------------------------------------------------------- 02 segments
    sec(el, "02", "WHO WE ARE SELLING TO", "Four segments, and they do not want the same thing.")
    el.append(tbl(
        [[n, w, why, how] for n, w, why, how in SEGMENTS],
        ["Segment", "Size", "What they actually want", "How we reach them"],
        [116, 74, FULLW - 190 - 150, 150], aligns=["r", "l", "l"], tiny=True))

    # ------------------------------------------------------------- 03 the offer
    sec(el, "03", "THE OFFER", "Designed to get people into a room, not into a meeting.")
    el.append(tbl(
        [["The trial", "First session at half rate", "No commitment, no membership, no "
          "conversation about tiers. The only ask is that they use a room once"],
         ["The guest rate", "NGN %s an hour, rack" % format(C.RACK_HR, ","),
          "25% of the survey will not join anything. They are not a lost sale, they are a "
          "different product"],
         ["Entry, NGN 350k", "10% off the room", "Where 38% of the survey sit. This is the "
          "volume tier and it should be the default recommendation"],
         ["Practice, NGN 750k", "20% off the room", "For two or more sessions a week"],
         ["Founding, NGN 1.5M", "30% off the room, and priority prime slots",
          "Only for the first 15. Prime time is the scarce asset and it is worth more than "
          "the discount"],
         ["The referral", "A month of free sessions", "For any introduction that signs. "
          "Consultant to consultant is the best channel and it should be paid for"]],
        ["", "What it is", "Why it is set that way"], [98, 116, FULLW - 214], aligns=["r", "l"],
        hi={0, 5}))
    el.append(card(
        "<b>Prime time is the lever, not price.</b> Demand concentrates in weekday evenings "
        "and Saturday mornings, and there are only %d prime hours a week across the six "
        "rooms. Below about %d consultants a guaranteed Tuesday and Thursday evening costs "
        "us nothing to give and is worth a great deal to someone with a hospital job. Past "
        "that it is the most valuable thing we own. Sell the founding tier on the slot, not "
        "on the discount, and sell it early while it is still free to give."
        % (C.PRIME_CAP_WK, C.CONSULTANTS_CAP)))

    # ------------------------------------------------------------- 04 channels
    sec(el, "04", "CHANNELS AND MONEY", "Where the NGN %.0f M a year goes." % mk)
    el.append(tbl(
        [[n, m(v, 1), note] for n, v, note in CHANNELS] +
        [["Business development officer", m(9.0, 1),
          "In post from month 1, two months before the doors open. Two qualified "
          "conversations a week is the job"]] +
        [["Campus demand generation", m(mk, 1), ""]],
        ["Channel", "NGN M a year", "What it buys"], [150, 62, FULLW - 212],
        aligns=["r", "l"], total_row=True, tiny=True))
    el.append(Spacer(1, 4))
    el.append(tbl(
        [["Brand and identity", "10.0", "Name, marks, collateral, tone"],
         ["Website and booking front end", "8.0", "A consultant must be able to see a room, "
          "a rate and a slot at 11pm without calling anyone"],
         ["Photography, film and virtual tour", "4.0", "85% are buying the address and how "
          "it feels. They cannot feel a price list"],
         ["Launch and consultant open evenings", "8.0", "Three events before opening, not one after"],
         ["Launch marketing, one off", "%.1f" % C.MARKETING_LAUNCH, ""]],
        ["Launch", "NGN M", "What it buys"], [150, 62, FULLW - 212],
        aligns=["r", "l"], total_row=True, tiny=True))

    # ------------------------------------------------------------- 05 clinics
    sec(el, "05", "THE CLINICAL COMPANIES", "Four businesses, four different routes to market.")
    for n, rev, need, unit, kind, how in CLINIC_GTM:
        _sub = ("NGN %s M a year, %s %s. %s" % (m(rev, 0), format(need, ","), unit, kind)
                if need else "NGN %s M a year. %s" % (m(rev, 0), kind))
        el.append(Paragraph("%s  <font size=8 color='#6b7280'>%s</font>" % (n, _sub), H2))
        el.append(Paragraph(how, P))
    el.append(card(
        "<b>Longevity and infusion is the one to start selling first.</b> It is the only "
        "line that can be sold before we open, because it is programme based and corporate "
        "rather than walk in. Every annual programme sold in the fit-out period is revenue "
        "on day one and it is the cheapest de-risking available to the ramp. It is also the "
        "highest revenue per square metre on the campus.<br/><br/>"
        "The clinics fund their own patient acquisition from inside their margins, about "
        "NGN %.0f to %.0f M a year across the four, which is 8 to 10 per cent of their NGN "
        "%.0f M. The NGN %.0f M of campus money above is for the building and the "
        "consultants, and the two should not be confused or spent twice."
        % (own_rev * 0.08, own_rev * 0.10, own_rev, mk), bg=ALERT))

    # ------------------------------------------------------------- 06 milestones
    sec(el, "06", "WHAT GOOD LOOKS LIKE", "Five checkpoints, and what to do if one is missed.")
    el.append(tbl(
        [["Month 1", "BD officer in post. Named list of 60 built. Longevity corporate "
          "conversations opened", "If the list is not built, nothing downstream happens"],
         ["Month 3, opening", "8 consultants signed. First open evening held. Longevity "
          "opens with a book of pre-sold programmes",
          "Fewer than 5 signed means the proposition is wrong, not the effort"],
         ["Month 6", "18 signed. Trial to signed conversion measured for the first time",
          "If trial conversion is under 40%, the rooms or the service are the problem"],
         ["Month 12", "33 signed. Referral producing at least a quarter of new signings",
          "If referral is not working by now, the existing consultants are not happy"],
         ["Month 20", "%d signed. Prime time at about 90%% and the founding tier closed" % TARGET,
          "At this point the constraint is the building, and the ground floor break clause "
          "becomes the live question"]],
        ["When", "What should be true", "What it means if it is not"],
        [64, FULLW - 64 - 170, 170], aligns=["r", "l"], hi={1}, tiny=True))
    el.append(card(
        "<b>One number to run this business on.</b> Not revenue, not occupancy, not "
        "marketing spend: <b>consultants signed, reported monthly against this curve.</b> "
        "Everything else in the campus follows it. If it is on track the model holds and the "
        "capital comes home in month %d. If it is a quarter behind for two quarters running, "
        "that is the moment to change the offer rather than spend more, and the feasibility "
        "study shows what a slow ramp does to the return."
        % MET["payback"], bg=CREAM))

    el.append(Spacer(1, 6))
    el.append(footer_bar())
    el.append(Spacer(1, 3))
    el.append(Paragraph(
        "Conversion rates in section 01 are assumptions, not evidence, and are stated so "
        "they can be challenged. Demand evidence from the premium medipark consultant "
        "survey, n=20, 12 to 19 August 2026, against a target of 40 to 60; it does not size "
        "the consultant pool. Patient volumes in section 05 are derived from the revenue "
        "plan and average values, not from a comparable clinic's accounts. Marketing "
        "allocations are planning figures before any agency or media quotation.", SMALL))
    doc.build(el)
    print("wrote %s" % OUT.name)
    print("  %d signed over %d months needs %.0f named contacts, about %.0f a week"
          % (TARGET, RAMP, top, top / RAMP / 4.3))
    print("  campus demand generation %.1f a year plus %.1f launch" % (mk, C.MARKETING_LAUNCH))


if __name__ == "__main__":
    build()
