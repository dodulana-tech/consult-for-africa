"""
Clearview Fertility and Clearview Hospital: the arithmetic behind the ranges.

Nothing in here is measured. Every input is an assumption chosen to be
defensible for a nine year old consultant led fertility unit, and every one of
them is confirmable in a fortnight by counting. The note publishes ranges
rather than the midpoints below, because a point estimate produced before
anybody has counted is a guess wearing a suit.

Calibrated for Lekki, Lagos, which is the most contested and the most expensive
fertility market in West Africa. Both the price and the cost of being open are
at the top of the national range.

Money is NGN millions a month unless a name says otherwise.

    python3 scripts/clearview_model.py
"""

from __future__ import annotations

# ------------------------------------------------------------------ price ----
# All in price of a fresh own egg cycle, drugs included. Priced for the Lekki and
# Victoria Island axis, which is the top of the Nigerian market. A mainland or
# South East clinic sits materially below this.
FRESH_PRICE = (3.5, 6.0)
# Stimulation drugs as a share of that price. Imported, so priced in dollars.
DRUG_SHARE = (0.30, 0.40)
# Everything variable: drugs, disposables, media, andrology, sessional fees.
FRESH_VAR = (0.52, 0.62)
# A frozen transfer, as a multiple of a fresh cycle. No stimulation, no
# retrieval, no anaesthetist, which is why the margin is so much better.
FET_MULTIPLE = (0.30, 0.38)
FET_VAR = (0.28, 0.38)
# Annual storage, per patient with embryos in the tank.
STORAGE_YEAR_M = (0.15, 0.25)

# ------------------------------------------------------------------ volume ---
# Fresh cycles a month. A nine year old consultant led unit on this axis.
CYCLES = (8, 22)

# ------------------------------------------------------------------ funnel ---
# Enquiry to first cycle. The first pair is what these units typically run at
# before anybody owns the pathway. The second is what a coordinator, a costed
# package and a seven day response reliably reach.
CONV_NOW = (0.10, 0.15)
CONV_ABLE = (0.15, 0.20)

# ---------------------------------------------------------------- the tank ---
# Share of fresh cycles leaving surplus embryos worth freezing, and the share
# of those patients who return for a transfer inside two years.
FREEZE_RATE = (0.45, 0.60)
RETURN_RATE = (0.45, 0.60)

# ------------------------------------------------------------- the back end --
# Ongoing pregnancy per transfer, blended across age bands.
ONGOING = (0.22, 0.32)
# Antenatal package plus delivery in the sister hospital. IVF pregnancies
# carry a high caesarean rate and an elevated twin rate, so this sits above a
# spontaneous conception booking.
DELIVERY_M = (1.5, 3.0)
CS_RATE = (0.50, 0.70)


def mid(band):
    return sum(band) / 2


def rng(f):
    """Run f over the low and high corner of every band and return the span."""
    lo = f(0)
    hi = f(1)
    return (min(lo, hi), max(lo, hi))


def fresh_revenue(i):
    return CYCLES[i] * FRESH_PRICE[i]


def fresh_contribution(i):
    return CYCLES[i] * FRESH_PRICE[i] * (1 - FRESH_VAR[1 - i])


def enquiries(i):
    """Enquiries a month implied by today's cycle count and conversion."""
    return CYCLES[i] / CONV_NOW[i]


def conversion_upside(i):
    """Extra cycles a month from the same enquiries, at reachable conversion."""
    return enquiries(i) * (CONV_ABLE[i] - CONV_NOW[i])


def conversion_revenue(i):
    return conversion_upside(i) * FRESH_PRICE[i]


def fet_volume(i):
    """Frozen transfers a month a mature recall programme produces."""
    return CYCLES[i] * FREEZE_RATE[i] * RETURN_RATE[i]


def fet_revenue(i):
    return fet_volume(i) * FRESH_PRICE[i] * FET_MULTIPLE[i]


def fet_contribution(i):
    return fet_volume(i) * FRESH_PRICE[i] * FET_MULTIPLE[i] * (1 - FET_VAR[1 - i])


def storage_revenue(i):
    """Patients with embryos banked build up over years. Three years' worth."""
    banked = CYCLES[i] * FREEZE_RATE[i] * 12 * 3
    return banked * STORAGE_YEAR_M[i] / 12


def transfers(i):
    return CYCLES[i] + fet_volume(i)


def pregnancies_year(i):
    return transfers(i) * ONGOING[i] * 12


def obstetric_year(i):
    return pregnancies_year(i) * DELIVERY_M[i]


def caesareans_year(i):
    return pregnancies_year(i) * CS_RATE[i]


def fx_exposure(i):
    """Share of a cycle's price that is set in dollars."""
    return DRUG_SHARE[i]


def midcase():
    """Every band at its midpoint. This is the scenario the note quotes when a
    range spans so wide that it stops being useful."""
    cyc, price = mid(CYCLES), mid(FRESH_PRICE)
    fet = cyc * mid(FREEZE_RATE) * mid(RETURN_RATE)
    tr = cyc + fet
    preg = tr * mid(ONGOING) * 12
    return dict(
        cycles=cyc,
        fresh_rev=cyc * price,
        enquiries=cyc / mid(CONV_NOW),
        extra_cycles=(cyc / mid(CONV_NOW)) * (mid(CONV_ABLE) - mid(CONV_NOW)),
        fet=fet,
        fet_rev=fet * price * mid(FET_MULTIPLE),
        storage_rev=cyc * mid(FREEZE_RATE) * 12 * 3 * mid(STORAGE_YEAR_M) / 12,
        transfers=tr,
        pregnancies=preg,
        obstetric=preg * mid(DELIVERY_M),
        caesareans=preg * mid(CS_RATE),
    )


MID = midcase()

BANDS = {
    "fresh revenue a month": rng(fresh_revenue),
    "fresh contribution a month": rng(fresh_contribution),
    "enquiries a month implied": rng(enquiries),
    "extra cycles a month from conversion": rng(conversion_upside),
    "revenue from conversion alone": rng(conversion_revenue),
    "frozen transfers a month at maturity": rng(fet_volume),
    "frozen transfer revenue a month": rng(fet_revenue),
    "frozen transfer contribution a month": rng(fet_contribution),
    "storage revenue a month, year three": rng(storage_revenue),
    "ongoing pregnancies a year": rng(pregnancies_year),
    "obstetric revenue a year, if it stays in the group": rng(obstetric_year),
    "caesarean sections a year, if they stay": rng(caesareans_year),
}

# -------------------------------------------------- what each option moves ---
# Capital to stand it up, and revenue a month once it is working. Ranges are
# deliberately wide because the scope of each depends on what Clearview
# already owns, which nobody has established.
OPTIONS = {
    "A": dict(capital=(15, 45), revenue=rng(lambda i: conversion_revenue(i)
                                            + fet_revenue(i) + storage_revenue(i)),
              months=(6, 12)),
    "B": dict(capital=(90, 260), revenue=(25, 70), months=(9, 18)),
    "C": dict(capital=(45, 160), revenue=rng(lambda i: fresh_revenue(i) * 0.6),
              months=(12, 24)),
    "D": dict(capital=(20, 60), revenue=rng(lambda i: fresh_revenue(i) * 0.35),
              months=(9, 18)),
}


if __name__ == "__main__":
    print("Clearview: the bands behind the note\n")
    for k, (lo, hi) in BANDS.items():
        print("  %-52s  %8.1f  to %8.1f" % (k, lo, hi))
    print("\n  Mid case, every band at its midpoint\n")
    for k, v in MID.items():
        print("  %-52s  %8.1f" % (k, v))
    print("\n  Options (capital NGN m, revenue NGN m a month, months to get there)\n")
    for k, o in OPTIONS.items():
        print("  %s   capital %5.0f to %5.0f   revenue %5.1f to %5.1f   %2d to %2d months"
              % (k, o["capital"][0], o["capital"][1], o["revenue"][0], o["revenue"][1],
                 o["months"][0], o["months"][1]))


# ==================================================================== inbound ==
# Destination IVF. The thesis is that Lekki is the right DESTINATION but the
# wrong CATCHMENT, so the growth comes from four concentric source markets.
#
# Deliberately NOT sized as a market. Nigerian cycle-volume data is poor and a
# confident TAM here would be invented. Instead we size what a meaningful win
# COSTS, which is the honest and more useful direction, because the answer is
# that it is a surprisingly small number of families.

SOURCES = ["Mainland Lagos", "Rest of Nigeria", "West Africa", "Diaspora"]

# A travelling patient pays more than a local one, because the package carries
# accommodation, transfers, coordination and the OHSS safety net. Diaspora more
# again, and still a fraction of what they pay at home.
TRAVEL_UPLIFT = {"Mainland Lagos": 1.00, "Rest of Nigeria": 1.15,
                 "West Africa": 1.25, "Diaspora": 1.60}

# What a diaspora couple pays at home, NGN m equivalent, for one fresh cycle.
HOME_PRICE = {"United Kingdom, private": (9.0, 16.0),
              "United States, private": (22.0, 38.0)}


def inbound(cycles_a_month, source="Rest of Nigeria", price=None):
    """Annual revenue from N extra cycles a month from one source market."""
    price = price if price is not None else mid(FRESH_PRICE)
    return cycles_a_month * 12 * price * TRAVEL_UPLIFT[source]


def inbound_table(per_month=(1, 2, 4, 6)):
    return {n: {s: inbound(n, s) for s in SOURCES} for n in per_month}


def arbitrage():
    """What a diaspora patient saves by cycling in Lekki instead of at home."""
    here = mid(FRESH_PRICE) * TRAVEL_UPLIFT["Diaspora"]
    return {k: (lo - here, hi - here) for k, (lo, hi) in HOME_PRICE.items()}, here
