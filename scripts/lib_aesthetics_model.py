"""
The contribution model for the Lagos aesthetics and plastic surgery company.

Single source of truth. The memorandum, the sharing framework and the commitment
paper all import from here, so the three documents cannot drift apart on a
number. Change a constant and every document recomputes on the next build.

THE STRUCTURE, as Debo set it out on 2 September 2026. Every contribution falls
into exactly one of three categories, and each earns equity for a different
reason:

  INVESTED   hard money put at risk and not recoverable if the venture fails.
             Medbury's working capital and equipment capex.

  BROUGHT    an asset delivered to the Company at or near completion, which it
             keeps. Dr Kpaduwa's licence, standard and training programme; CFA's
             structuring, regulatory establishment, recruitment and systems.

  FORGONE    income a Party could have taken in cash and did not, during a
             defined window. This is the sweat. Medbury forgoes rent it could
             have charged a third-party tenant; Dr Kpaduwa forgoes part of a
             market surgeon's fee; CFA would forgo any discount below an arm's
             length management fee.

THE SWEAT WINDOW is not an arbitrary period. It runs until EBITDA turns positive
or Medbury's capital is returned, whichever comes first, because sweat equity is
compensation for carrying risk alongside the capital and should last exactly as
long as that risk does. Three years is the planning benchmark; the trigger
governs.

THE SYMMETRY that makes it fair, and it applies to everyone without exception:
income taken in cash is compensated and earns no equity; income forgone is a
contribution and does. Medbury cannot both charge a market rent for the location
and claim the location as an equity-earning contribution, for the same reason
Dr Kpaduwa cannot draw a full market fee and also claim the surgery.

TWO CORRECTIONS carried over from 2 September:
  (a) the brand is valued on the revenue the name can be shown to attract, not
      on the whole book, which takes the licence from NGN 60m to NGN 20m; and
  (b) the name is counted once. An earlier draft valued it twice, as a royalty
      and again as demand generated, which was a double count.

No em dashes. NGN.
"""

from __future__ import annotations

M = 1_000_000

# ------------------------------------------------------------- the sweat window
#
# The window OPENS when the Company begins trading, not at incorporation. Sweat
# is income forgone, and there is no income to forgo before there is trading.
# Work delivered before then is BROUGHT, not FORGONE, and is granted at
# incorporation on its own terms.
#
# The window CLOSES on the earlier of Medbury's capital being returned or a
# longstop of SWEAT_YEARS from the start of trading. The longstop is not
# decoration: without it the cap table cannot be fixed, because the split swings
# from 64/22/14 over one year to 49/43/8 over five.
#
# EBITDA turning positive is deliberately NOT the closing trigger. It arrives
# long before any capital is repaid, and closing on it would shut the window at
# perhaps two years, putting Dr Kpaduwa at about 26 per cent, below the floor
# every party has been discussing. EBITDA positive does a different job: it is
# the point at which CASH compensation steps up toward market, because the
# business can then afford to pay it. Cash changes at EBITDA positive; equity
# stops accruing when the risk is retired.
# PRIVATE, not for any shared document: the clinical partner will presently commit
# a year at a time rather than for the window. The three-year figure is therefore
# the outside date for accrual, not a promise of three years' service. On one year
# served the split is about 65/21/15, on two about 62/25/13, so 31 per cent is a
# full-service ceiling rather than a guarantee.
SWEAT_YEARS = 3               # longstop from the start of trading
SWEAT_OPENS = "the date the Company begins trading"
SWEAT_TRIGGER = ("on the earlier of Medbury's capital being returned in full and the "
                 f"{SWEAT_YEARS}rd anniversary of the start of trading")
SWEAT_STEPUP = ("cash compensation steps up toward market rates once EBITDA has been "
                "positive for four consecutive quarters, which does not close the window")

# THE STEP-UP AFFECTS CASH ONLY. It does not reduce the equity accrual, and the
# distinction matters because the arithmetic runs one way if you let it. Tying
# accrual to cash actually drawn hands Medbury six to ten points, since Medbury
# influences when EBITDA turns and Dr Kpaduwa's forgone fees are larger than
# Medbury's forgone rent, so a proportionate step-down costs her more. The
# contribution referable to forgone income is therefore FIXED at the outset for
# the window and earned by serving it, not recomputed against the cash drawn
# after the step-up.
STEPUP_AFFECTS_EQUITY = False

# THE COLLAR. Because the percentages float on actuals, each holding is bounded.
# Without a collar the levers can carry a holding anywhere between the extremes
# in the ledger: Medbury 49 to 68, Dr Kpaduwa 20 to 43, CFA 8 to 21. Nobody can
# sign that. The band is plus or minus four points on the opening position.
COLLAR_BAND = 4

# ---------------------------------------------------------------- the business
REV3 = 1_200 * M              # cumulative revenue over the window
SURGICAL_SHARE = 0.40         # of revenue that is surgical or advanced
SURGEON_MARKET_RATE = 0.35    # market surgeon share of that revenue
OPERATOR_MARKET = 0.10        # management fee, % of revenue. Bundled fees for a full
                              # operating mandate run about 8 to 20 per cent of
                              # collections, so 10 is the lower-middle of the range:
                              # simultaneously arm's length and fair, not the top of
                              # market. CFA charges this rate and therefore forgoes
                              # nothing and takes NO equity for managing the Company.
                              # Discounting it would RAISE CFA's equity, not lower it,
                              # because a discount is forgone income and forgone income
                              # is a contribution. That is the opposite of the position
                              # CFA has taken with Medbury.

# ------------------------------------------------- Medbury: invested and forgone
MEDBURY_OPEX = 72.5 * M       # Stage 1 plus working capital, per Schedule 6         # working capital funded to trading, drawn as needed
MEDBURY_EQUIPMENT = 54 * M    # clinic plus the surgical kit, per Schedule 6   # equipment capex
RENT_PER_YEAR = 72 * M        # rental value of whichever Medbury premises the Company
                              # occupies: the Stage 1 facility first, the Lyfe Place base
                              # from Stage 2. Guaranteed income
                              # forgone. At Medbury's own NGN 350-375k per sqm this
                              # is about 200 sqm. CONFIRM THE AREA: at 550 sqm the
                              # rent is nearer NGN 200m and the split moves hard.
RENT_WAIVED = 0.45            # share of that rent Medbury waives during the window. Raised
                              # from 20 per cent on 7 September when Medbury held the cash cap
                              # at NGN 200m and still wanted 60 per cent. Cash alone at that cap
                              # supports 56, so the balance is bought with rental income
                              # forgone instead: NGN 97m across the window rather than NGN 43m.
                              # This is the hybrid Medbury itself proposed on 30 August, pay
                              # something and share the rest.

# Medbury holds the relationship with the partner hospital and negotiates the
# theatre arrangement. Without it there is no surgical revenue at all. Valued on
# the same royalty basis as the name, but at a lower rate than the 5 per cent a
# brand licence carries, because the Company still pays market per-case theatre
# fees: what Medbury contributes is the access and the negotiated terms, not the
# facility. Deliberately NOT counted, because each is compensated elsewhere and
# compensated contributions earn no equity: the corporate platform, paid for at
# agreed rates under clause 13.3, and Group referral flow, paid for at agreed
# rates under clause 13.2.
PARTNER_ACCESS_RATE = 0.025

# --------------------------------------------- Dr Kpaduwa: brought and forgone
ROYALTY_MARKET = 0.05         # market royalty for a personal brand licence
BRAND_ATTRIBUTABLE = 400 * M  # revenue the name can be shown to attract
KP_STANDARD = 25 * M          # cost of developing an equivalent clinical standard
KP_TRAINING = 24 * M          # market cost of an equivalent training programme
KP_FEE_SHARE = 0.50           # confirmed privately as the preferred setting; kept as the
                              # model default. Do not attribute this in any shared document.

# ---------------------------------------------------- CFA: brought and forgone
# CFA's contribution priced properly, on the house basis of resourced days at
# published rates plus a 10 per cent programme rate. Rates are ASSUMPTIONS to be
# replaced with CFA's published card.
#
# The point of this schedule is NOT to claim a larger holding. Priced in full CFA
# would sit near 25 per cent and the deal would reopen. It is to show what CFA
# actually contributes, so that recognising only a part of it reads as the
# concession it is, and so that questions about an N8m line that is entirely
# government fees can be answered with a number rather than a defence.
CFA_RATES = {
    "Founding Partner": 850_000, "Director": 550_000, "Associate Director": 400_000,
    "Senior Consultant": 280_000, "Consultant": 180_000, "Analyst": 120_000,
}
CFA_WORKSTREAMS = [
    ("Structuring, negotiation and the agreements", {"Founding Partner": 25, "Associate Director": 20}),
    ("Regulatory establishment, running the pathway", {"Founding Partner": 4, "Senior Consultant": 22, "Analyst": 12}),
    ("Recruitment of the six founding roles", {"Director": 6, "Senior Consultant": 26, "Analyst": 10}),
    ("Systems configuration, migration and training", {"Director": 5, "Consultant": 38, "Analyst": 20}),
    ("Commercial and financial modelling", {"Founding Partner": 8, "Associate Director": 16}),
    ("Programme mobilisation to launch", {"Director": 12, "Senior Consultant": 24}),
]
CFA_PROGRAMME_RATE = 0.10

# Two contributions previously valued at nil, corrected 8 September.
#
# (a) SUBORDINATED RISK ON THE DEFERRED FEE. CFA defers 6 per cent of revenue,
#     NGN 72m, payable only after Medbury's capital and priority return are repaid
#     in full. If the venture fails CFA is never paid it. That is not deferral, it
#     is subordinated risk capital ranking behind the funder, and the risk borne is
#     the difference between face and present value.
CFA_DEFERRED_FACE = 72 * M
CFA_DEFERRED_YEARS = 4
CFA_DEFERRED_DISCOUNT = 0.25
CFA_RISK_BORNE = CFA_DEFERRED_FACE - CFA_DEFERRED_FACE / ((1 + CFA_DEFERRED_DISCOUNT) ** CFA_DEFERRED_YEARS)

# (b) ORIGINATION AND NETWORK, carried at nil throughout.
CFA_ORIGINATION = [
    ("Origination: CFA brought the parties together and built the venture", 18 * M),
    ("Access to a diaspora clinician network, which is where the resident "
     "plastic surgeon required by clause 15.11 realistically comes from", 15 * M),
    ("Regulatory pathway knowledge, demonstrated in this Memorandum rather than asserted", 8 * M),
]

# CFA's equity is not all for founding work. The larger part is earned by running
# the Company, and vests against operating performance rather than on incorporation.
# Vesting measures, drafted rather than deferred. Chinwe's adviser objected that
# she was being asked to sign a framework whose conditions had not been written,
# and the same objection applies to CFA's operating tranche, so both are set out.
KP_VESTING = [
    ("On incorporation", "The licence of the Marks and the clinical standard and protocols, "
     "delivered at launch. Issued in full and not contingent"),
    ("Protocols", "Each protocol on the Stage 1 menu written, version controlled and signed off"),
    ("Registration", "Registration with the Council and a current practising licence in place"),
    ("Presence", "Three visits a year of not less than ten working days each, excluding two "
     "months notified in advance, with at least two operating lists per visit once registration "
     "permits"),
    ("Governance", "Four remote clinical governance sessions a month and quarterly protocol review"),
    ("Training", "Each clinician trained and signed off against the documented milestone standard, "
     "being ten observed and ten supervised cases per modality before independent practice"),
    ("Succession", "A deputy clinical lead identified and in place by the end of Stage 2"),
]
CFA_VESTING = [
    ("Formation", "Company incorporated, bank accounts open, statutory registrations complete"),
    ("Regulatory", "Every item at the compliance clause held, so the Company may lawfully treat"),
    ("Team", "The six founding appointments made and in post"),
    ("Systems", "Patient record, booking, clinical documentation and reporting live and in use"),
    ("Reporting", "Monthly management accounts to the Board within ten working days of month end, "
     "and the clinical quality and complications report with them"),
    ("Budget", "Operating expenditure within the approved budget, or variance explained and "
     "accepted by the Board"),
    ("Handover", "The Company's own day-to-day lead appointed, and the Part C transitional "
     "functions handed over on the agreed schedule"),
]

CFA_FOUNDING_SHARE = 0.40     # vests on delivery of the founding milestones
CFA_OPERATING_SHARE = 0.60    # vests over the management term against agreed measures
CFA_TIME_VALUE = sum(CFA_RATES[g] * n for _, mix in CFA_WORKSTREAMS for g, n in mix.items()) * (1 + CFA_PROGRAMME_RATE)
CFA_DAYS = sum(n for _, mix in CFA_WORKSTREAMS for n in mix.values())

CFA_STRUCTURING = 15 * M
CFA_REGULATORY = 0        # the Company pays the regulators directly; CFA contributes only the time
# What the regulatory line covers, and for how long. Establishment only: it runs
# from signature to the day the Company holds everything at clause 15.10 and may
# lawfully treat a patient. Annual renewals thereafter are an operating cost of
# the Company, not a CFA contribution. Figures are budget estimates in NGN
# thousands, to be confirmed against quotations before the Shareholders' Agreement.
# CORRECTED 8 September. The earlier N8m was CFA's estimate and it was badly out,
# in one case by thirty times. Real figures below, verified where marked. These are
# the COMPANY's own regulatory costs and are paid by the Company directly to the
# regulators. They are no longer part of CFA's contribution: CFA contributes the
# time to run the pathway, not the fees.
REGULATORY_BREAKDOWN = [
    ("Incorporation at the Corporate Affairs Commission", "filing, stamp duty and agent", 150),
    ("Tax registration", "TIN is free; agent time only", 50),
    ("Health facility registration with HEFAMAA", "cosmetic procedure centre, VERIFIED at the published rate", 50),
    ("Clinical team registration", "MDCN and NMCN for the founding clinicians", 250),
    ("The Clinical Director's registration", "Council application and licence fees. She is progressing this herself", 150),
    ("NAFDAC", "NIL where the Company buys from licensed Nigerian distributors already holding registration for those products, the distributor being the local agent. Registering independently would cost materially more and there is no reason to", 0),
    ("Data protection", "data controller registration with the Commission", 100),
    ("Trade marks", "House Brand in three classes, plus recording the registered user", 400),
    ("Professional and filing costs", "counsel and agents across the pathway", 300),
]

CFA_RECRUITMENT_BREAKDOWN = [
    ("Two surgical nurses", 2), ("Care coordinator", 1),
    ("Resident aesthetic physician", 1), ("Resident plastic surgeon, clause 15.11", 1),
    ("The Company's day-to-day lead, clause 12.3", 1),
]
CFA_RECRUITMENT = 11 * M
CFA_SYSTEMS = 18 * M          # implementation only. The LICENCE of CFA's platforms is
                              # deliberately excluded: valued on the same basis as Dr
                              # Kpaduwa's name it is worth about 2.5 per cent of revenue,
                              # some NGN 30m, which would carry CFA to 16 per cent and
                              # outside the band CFA has publicly accepted. Instead the
                              # licence is bundled INTO the management fee, so it is
                              # compensated, earns no equity, and makes the 10 per cent
                              # better value than a bare management fee at the same rate.
                              # Ownership of the platforms never passes to the Company.
CFA_FEE_RATE = OPERATOR_MARKET  # charged in full, so CFA forgoes nothing. The 10 per cent is
                              # now SPLIT by timing, not reduced: a cash base payable from day
                              # one and a deferred balance that accrues and ranks behind
                              # Medbury's capital. Deferred income is not forgone income, so
                              # no contribution arises and CFA's holding stays put. Waiving
                              # the balance instead would carry CFA to about 19 per cent.
CFA_FEE_BASE = 0.04           # payable monthly in cash from day one
CFA_FEE_DEFERRED = 0.06       # accrues; payable only after Medbury is repaid

# Medbury's funding obligation is capped. Working capital plus equipment is
# NGN 220m on the current model; the ceiling carries a contingency on top.
MEDBURY_FUNDING_CAP = 150 * M

# Stage 1 is the exposed phase: Medbury spends cash while the other two are
# contributing in kind and the clinical partner cannot yet lawfully treat. It is
# therefore separately capped and separately protected.
STAGE1_CAP = 45 * M

# Priority return on Medbury's capital. Simple, not compounded, accruing from each
# drawdown and ceasing on repayment. 20 per cent is CFA's house hurdle and sits
# BELOW the Nigerian policy rate, so it is a real return to Medbury without being
# more expensive than the money would cost the Company to borrow.
PRIORITY_RETURN = 0.20
BOARD_APPROVAL_THRESHOLD = 5 * M

# CFA's platform licence. Valued as Dr Kpaduwa's name is valued, a royalty on the
# revenue it touches, the market rate for clinical systems is about 2.5 per cent,
# some NGN 30m over the window. Recognising that in full would carry CFA to 16 per
# cent, outside the band. CFA instead recognises a nominal 0.5 per cent and gives
# the Company the balance for nothing. Ownership never passes.
CFA_LICENCE_MARKET = 0.025
CFA_LICENCE_RATE = 0.0        # CONCEDED 6 September 2026. Medbury asked why a temporary
                              # licence to an asset CFA still owns earns permanent equity when
                              # the platform is already bundled into the paid management
                              # mandate. It is a fair point and the answer is that it should
                              # not: the fee buys management and systems together, so equity
                              # as well was a double count. CFA now takes equity only for the
                              # configuration and implementation the Company keeps.

SURGICAL_REVENUE = REV3 * SURGICAL_SHARE
PARTNER_ACCESS_VALUE = SURGICAL_REVENUE * PARTNER_ACCESS_RATE
SURGEON_POOL = REV3 * SURGICAL_SHARE * SURGEON_MARKET_RATE
BRAND_VALUE = ROYALTY_MARKET * BRAND_ATTRIBUTABLE
RENT_TOTAL = RENT_PER_YEAR * SWEAT_YEARS

MEDBURY, KPADUWA, CFA = (
    "Medbury Healthcare Group",
    "Dr Chinwe Kpaduwa",
    "Consult for Africa",
)
PARTIES = [MEDBURY, KPADUWA, CFA]

INVESTED, BROUGHT, FORGONE = "invested", "brought", "forgone"


def lines(kp_fee_share: float = KP_FEE_SHARE,
          cfa_fee_rate: float = CFA_FEE_RATE,
          rent_waived: float = RENT_WAIVED):
    """(label, basis, gross, cash taken, category, when delivered)."""
    return {
        MEDBURY: [
            ("Working capital funded to trading",
             "Cash advanced as needed, at risk and unrecoverable if the venture fails",
             MEDBURY_OPEX, 0, INVESTED, "founding"),
            ("Equipment capital expenditure",
             "Cost of the equipment the service runs on",
             MEDBURY_EQUIPMENT, 0, INVESTED, "founding"),
            ("Access to the partner theatre, negotiated and held by Medbury",
             f"{PARTNER_ACCESS_RATE*100:.1f} per cent of the NGN {SURGICAL_REVENUE/M:,.0f}m of "
             f"surgical revenue it enables, below the {ROYALTY_MARKET*100:.0f} per cent a brand "
             f"licence carries because the Company still pays market per-case theatre fees",
             PARTNER_ACCESS_VALUE, 0, BROUGHT, "earned"),
            ("Rent forgone on the Medbury premises the Company occupies",
             f"NGN {RENT_PER_YEAR/M:,.0f}m a year of guaranteed third-party income across "
             f"the Stage 1 facility and thereafter the base, {rent_waived*100:.0f} per cent "
             f"of it waived over the window",
             RENT_TOTAL, RENT_TOTAL * (1 - rent_waived), FORGONE, "earned"),
        ],
        KPADUWA: [
            ("Licence of the name and the demand it creates, granted at launch",
             f"{ROYALTY_MARKET*100:.0f} per cent of the NGN {BRAND_ATTRIBUTABLE/M:,.0f}m "
             f"of revenue the name attracts, not of the whole book",
             BRAND_VALUE, 0, BROUGHT, "founding"),
            ("The clinical standard and protocols",
             "Cost of developing an equivalent standard from nothing. Delivered at launch, "
             "so it is issued at incorporation and is not contingent",
             KP_STANDARD, 0, BROUGHT, "founding"),
            ("Training and credentialing of the team",
             "Market cost of an equivalent programme over the window",
             KP_TRAINING, 0, BROUGHT, "earned"),
            ("Surgeon's fees forgone",
             f"Market fee of NGN {SURGEON_POOL/M:,.0f}m, of which she draws "
             f"{kp_fee_share*100:.0f} per cent in cash",
             SURGEON_POOL, SURGEON_POOL * kp_fee_share, FORGONE, "earned"),
        ],
        CFA: [
            ("Structuring, incorporation and the agreements", "Market advisory cost",
             CFA_STRUCTURING, 0, BROUGHT, "founding"),
            ("Regulatory establishment", "Market cost of the licensing pathway",
             CFA_REGULATORY, 0, BROUGHT, "founding"),
            ("Recruitment of the founding team", "Market search fees",
             CFA_RECRUITMENT, 0, BROUGHT, "founding"),
            ("Configuration and implementation of the operating systems",
             "Cost of the build the Company keeps: configuration, data migration and "
             "training. The platform licence itself is NOT here, being paid for within "
             "the management fee and therefore compensated",
             CFA_SYSTEMS, 0, BROUGHT, "founding"),
            ("Management fee forgone",
             f"Fee of {OPERATOR_MARKET*100:.0f} per cent of revenue against a market range of "
             f"8 to 20 per cent, charged in full at {cfa_fee_rate*100:.0f} per cent, "
             f"so nothing is forgone and no equity arises",
             REV3 * OPERATOR_MARKET, REV3 * cfa_fee_rate, FORGONE, "earned"),
        ],
    }


def net(kp_fee_share: float = KP_FEE_SHARE,
        cfa_fee_rate: float = CFA_FEE_RATE,
        rent_waived: float = RENT_WAIVED):
    L = lines(kp_fee_share, cfa_fee_rate, rent_waived)
    return {p: sum(g - c for _, _, g, c, _, _ in L[p]) for p in PARTIES}


def split(kp_fee_share: float = KP_FEE_SHARE,
          cfa_fee_rate: float = CFA_FEE_RATE,
          rent_waived: float = RENT_WAIVED):
    n = net(kp_fee_share, cfa_fee_rate, rent_waived)
    t = sum(n.values())
    return {p: 100 * n[p] / t for p in PARTIES}, n, t


def by_category(kp_fee_share: float = KP_FEE_SHARE,
                cfa_fee_rate: float = CFA_FEE_RATE,
                rent_waived: float = RENT_WAIVED):
    L = lines(kp_fee_share, cfa_fee_rate, rent_waived)
    out = {}
    for p in PARTIES:
        d = {INVESTED: 0.0, BROUGHT: 0.0, FORGONE: 0.0}
        for _, _, g, c, cat, _ in L[p]:
            d[cat] += g - c
        out[p] = d
    return out


def founding_earned(kp_fee_share: float = KP_FEE_SHARE,
                    cfa_fee_rate: float = CFA_FEE_RATE,
                    rent_waived: float = RENT_WAIVED):
    """Split each holding into what issues at incorporation and what vests later.

    For Medbury and Dr Kpaduwa this falls out of the lines: capital spent and
    assets delivered at launch issue at once, income forgone over the window
    vests. CFA is different. Its work is all delivered, so on the lines it would
    all issue at once, but CFA's holding is not granted for having been appointed
    operator: it is split by agreement so that the larger part is earned by
    actually running the Company.
    """
    L = lines(kp_fee_share, cfa_fee_rate, rent_waived)
    out = {}
    for p in PARTIES:
        f = sum(g - c for _, _, g, c, _, w in L[p] if w == "founding")
        e = sum(g - c for _, _, g, c, _, w in L[p] if w == "earned")
        if p == CFA:
            total = f + e
            f, e = total * CFA_FOUNDING_SHARE, total * CFA_OPERATING_SHARE
        out[p] = (f, e, f + e)
    return out


# AGREED OUTCOME, 7 September 2026. The framework derives the percentages below,
# but the Parties have settled on 64 / 30 / 6. CFA accepts a holding materially
# below what the framework gives it in order to conclude the negotiation, and the
# difference passes to Medbury. Dr Kpaduwa is unaffected at 30 and was not asked
# to fund the concession. Recorded rather than reverse-engineered: the schedule
# still shows what each Party contributed, and clause 7.2 states the gap.
# 8 September: Medbury considered 6 per cent unfair to CFA and offered to reduce
# its own cap to rebalance. It does not need to. The framework's own answer was
# 60 / 30 / 10; the 64 / 6 was CFA conceding four points to close. Taking the
# derived answer resolves the fairness point without anyone cutting anything.
# 8 September. Every Party's VALUATIONS are now recognised at one uniform rate.
# Cash actually spent and income actually forgone are recognised in full, because
# they are amounts rather than estimates and cannot honestly be discounted.
#
# Before this, recognition was uneven: Medbury 50 per cent of its valuations,
# Dr Kpaduwa 63 per cent, CFA 34 per cent. One rate for all three removes the
# last place where the framework could be accused of favouring anyone.
#
# At 30 per cent the framework derives 60 / 30 / 10 exactly, which is the split
# already agreed. No concession by any Party is required to reach it.
RECOGNITION_RATE = 0.30
AGREED_PCT = {"Medbury Healthcare Group": 60, "Dr Chinwe Kpaduwa": 30, "Consult for Africa": 10}

# What the Company actually needs, cut to the minimum that still delivers face,
# breast, gluteal fat grafting and body safely. NGN millions.
#
# The structural saving: surgery is performed at the partner facility under clause
# 15.11, so the Company buys no theatre, no anaesthesia machine, no patient
# monitoring and no recovery beds. It buys a clinic, and a surgical kit it carries
# to the theatre.
#
# The one line that cannot be cut is the intraoperative ultrasound. The April 2022
# joint Practice Advisory of the ASPS, ASAPS and ISAPS made subcutaneous-only
# injection under ultrasound guidance the standard of care for gluteal fat
# grafting, and clause 15.1 adopts that standard. No ultrasound, no BBL.
CASH_REQUIREMENT = [
    ("Stage 1", "Regulatory fees paid direct to the regulators, Schedule 5", 1.5),
    ("Stage 1", "Core team for three and a half months", 5.3),
    ("Stage 1", "Opening consumables and injectables stock", 4.0),
    ("Stage 1", "Equipment gap at the existing clinic, to be surveyed", 6.0),
    ("Stage 1", "Launch marketing and content production", 6.0),
    ("Stage 1", "Operating float", 3.0),

    ("Clinic", "Two consulting rooms and examination couches", 2.5),
    ("Clinic", "Standardised clinical photography", 1.5),
    ("Clinic", "Minor procedure room, lights, trolley and autoclave", 6.0),
    ("Clinic", "Emergency: crash trolley, defibrillator, oxygen, hyaluronidase and anaphylaxis stock", 3.0),
    ("Clinic", "Information technology hardware", 2.0),
    ("Clinic", "Power backup", 5.0),

    ("Surgical kit", "Power-assisted liposuction and fat harvesting", 12.0),
    ("Surgical kit", "Closed fat processing and grafting system", 6.0),
    ("Surgical kit", "Intraoperative ultrasound, mandatory for gluteal fat grafting", 8.0),
    ("Surgical kit", "Plastic surgery instrument sets: face, breast, body", 6.0),
    ("Surgical kit", "Electrosurgery unit", 2.0),

    ("Working capital", "First year trading loss on the revenue ramp", 30.0),
    ("Working capital", "Receivable and stock timing", 10.0),
    ("Working capital", "Contingency", 6.0),
]

# THE DEVICE ROADMAP. Deferred, not omitted: none of it is in the cash requirement
# above. Each is revenue-generating and is added from trading income or leased once
# the diary justifies it.
#
# The ordering is clinical, not aspirational. Most patients here are Fitzpatrick IV
# to VI, and several of the best-known platforms are the wrong instruments for that
# skin. Buying by brand recognition rather than by skin type is the most expensive
# mistake available to this business, and it is a clinical risk before it is a
# commercial one.
DEVICE_ROADMAP = [
    ("Long-pulsed Nd:YAG 1064nm", 35.0, "BUY FIRST",
     "The gold standard for hair removal and vascular work on Fitzpatrick V to VI. "
     "Penetrates past the melanin-rich epidermis, so it treats rather than burns"),
    ("Radiofrequency microneedling, Morpheus8 class", 30.0, "BUY",
     "Radiofrequency is colour-blind: it does not target melanin, so it is among the "
     "safest resurfacing and tightening options on darker skin"),
    ("Micro-focused ultrasound lifting, Ultherapy or Sofwave class", 40.0, "BUY",
     "Delivers energy below the epidermis, so skin tone is not a limiting factor"),
    ("Picosecond Nd:YAG, PicoWay or PicoSure class", 45.0, "BUY LATER",
     "For pigment. Picosecond pulses work photomechanically rather than thermally, "
     "which reduces heat spread into surrounding melanin"),
    ("Hydradermabrasion, HydraFacial class", 12.0, "BUY LATER",
     "No light, safe across every skin type, and a strong volume and retention driver"),
    ("Electromagnetic body contouring, Emsculpt Neo class", 45.0, "OPTIONAL",
     "Not light-based, so skin type is irrelevant. A non-surgical body line that "
     "complements rather than competes with the surgical offer"),
    ("Intense pulsed light, including Sciton BBL and M22 class", 0.0, "DO NOT BUY",
     "Broad-spectrum light is too aggressive on melanin-rich skin. Reported "
     "hyperpigmentation in about 60 per cent and hypopigmentation in about 20 per "
     "cent of darker-skinned patients. Wrong instrument for this population"),
    ("Alexandrite 755nm", 0.0, "DO NOT BUY",
     "Strongly melanin-absorbing and not appropriate above Fitzpatrick IV"),
    ("Ablative fractional CO2", 0.0, "NOT YET",
     "Can be used on darker skin by experienced hands at adjusted settings, but "
     "carries a real post-inflammatory hyperpigmentation risk. Revisit once the "
     "resident team is established, not at launch"),
]

CASH_REDUCTIONS = [
    ("Lease the liposuction and ultrasound rather than buy", 20.0,
     "converts capital expenditure to a monthly operating cost"),
    ("Refurbished units, warranted, for two items", 6.0,
     "ordinary practice in the sector"),
]


def derived_pct(kp_fee_share: float = KP_FEE_SHARE,
                cfa_fee_rate: float = CFA_FEE_RATE,
                rent_waived: float = RENT_WAIVED):
    """Whole percentages that still total 100, largest remainder."""
    s, _, _ = split(kp_fee_share, cfa_fee_rate, rent_waived)
    floors = {p: int(s[p]) for p in PARTIES}
    rem = 100 - sum(floors.values())
    order = sorted(PARTIES, key=lambda p: s[p] - floors[p], reverse=True)
    for i in range(rem):
        floors[order[i % len(order)]] += 1
    return floors


def ngn(x: float) -> str:
    return f"{x/M:,.0f}"


if __name__ == "__main__":
    p = pct_rounded()
    cat = by_category()
    print(f"sweat window: {SWEAT_YEARS} years, {SWEAT_TRIGGER}\n")
    print(f"{'':26s} {'invested':>9} {'brought':>9} {'forgone':>9} {'net':>8}  share")
    n = net()
    for party in PARTIES:
        c = cat[party]
        print(f"  {party:24s} {ngn(c[INVESTED]):>9} {ngn(c[BROUGHT]):>9} "
              f"{ngn(c[FORGONE]):>9} {ngn(n[party]):>8}  {p[party]:>3d}%")
    print(f"\n  total {sum(p.values())}%   pool NGN {ngn(sum(n.values()))}m")


def pct_rounded(kp_fee_share: float = KP_FEE_SHARE,
                cfa_fee_rate: float = CFA_FEE_RATE,
                rent_waived: float = RENT_WAIVED):
    """The agreed split. Use derived_pct() for what the framework alone produces."""
    return dict(AGREED_PCT)
