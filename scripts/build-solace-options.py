"""
Solace Healthcare, Games Village Abuja: a strategic options note.

Not a plan and not a proposal. Four ways the site could go, and a set of
conditionals. Ranges come from scripts/solace_model.py.

    python3 scripts/build-solace-options.py
"""

from __future__ import annotations

import sys
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.platypus import (BaseDocTemplate, Frame, PageBreak, PageTemplate,
                                Paragraph, Spacer)

sys.path.insert(0, str(Path(__file__).resolve().parent))
import solace_model as S
from lyfeplace_doc import (ALERT, CREAM, FULLW, GOLD, GREEN, H2, LETTER_TO, MARGIN, MUTED,
                           NAVY, P, PH, PW, SIG, SMALL, SUBTITLE, TITLE, card, footer_bar,
                           m, sec, tbl)

OUT = Path(__file__).resolve().parents[1] / "docs" / "solace-abuja" / "solace-options-cfa.pdf"

B = S.build()
MB = S.metrics(B)
DIAG = ["Radiology and imaging", "Laboratory and pathology", "Family medicine, clinics, corporate",
        "Pharmacy and retail", "Rehabilitation and physiotherapy"]
DAYCASE = DIAG + ["Oncology day therapy", "Day surgery, endoscopy, interventions",
                  "Palliative and home based care"]
ALL = [n for n, *_ in S.LINES]


def only(names, **kw):
    return S.build(line_mult={n: (1.0 if n in names else 0.0) for n in ALL}, **kw)


def with_ct():
    """What a scanner on a managed service, in a ground floor bay, would be worth."""
    keep_lines, keep_capex = list(S.LINES), list(S.CAPEX[1])
    S.LINES[1] = ("Radiology and imaging", 9, 68.4, 4.0, 0.34, 1)
    S.CAPEX[1][4] = ("Radiology rooms, shielding and regulatory authorisation", 38.0)
    S.CAPEX_TOTAL[1] = sum(v for _n, v in S.CAPEX[1])
    out, extra = S.build(), S.CAPEX_TOTAL[1] - sum(v for _n, v in keep_capex)
    S.LINES[:], S.CAPEX[1][:] = keep_lines, keep_capex
    S.CAPEX_TOTAL[1] = sum(v for _n, v in S.CAPEX[1])
    return out, extra


O1, O2 = only(DIAG, intensify=False), only(DAYCASE, intensify=False)
CT, CT_CAPEX = with_ct()
MCT = S.metrics(CT)
FLAT = S.build(intensify=False, line_mult={"Renal dialysis": 0.0})
THIN = S.build(line_mult={S.ONCO: 55 / 85})
DRIFT = S.build(dso=S.DRIFT_DSO)
SOURCE = S.build(dcr_override={S.ONCO: S.ONCO_DCR_GOOD})
FLAG = S.build(line_mult={S.ONCO: 0.75})
NODIAL = S.build(line_mult={"Renal dialysis": 0.0})
NOHARD = S.build(intensify=False)
O1_CAPEX = 78 + 193.5 + 70 + 42 + 132 + 24 + 54 + 34 + 80 + 46 + 38
O2_CAPEX = 78 + S.CAPEX_TOTAL[1]
O3_CAPEX = sum(S.CAPEX_TOTAL.values())
YR7 = sum(B["ebitda"][73:85])
TV3 = YR7 * 3 / (1 + S.HURDLE) ** 7


def rng(x, lo=0.92, hi=1.09, dp=0):
    return "NGN %s to %s m" % (m(x * lo, dp), m(x * hi, dp))


def brng(x, lo=0.94, hi=1.12):
    return "NGN %s to %s bn" % (m(x * lo / 1000, 1), m(x * hi / 1000, 1))


def furniture(canv, doc):
    canv.saveState()
    canv.setFillColor(NAVY)
    canv.rect(0, PH - 15 * mm, PW, 15 * mm, stroke=0, fill=1)
    canv.setFillColor(colors.white)
    canv.setFont("Helvetica-Bold", 8.2)
    canv.drawString(MARGIN, PH - 10 * mm, "SOLACE HEALTHCARE")
    canv.setFont("Helvetica", 8.2)
    canv.drawRightString(PW - MARGIN, PH - 10 * mm, "Games Village, Abuja  /  options note")
    canv.setFillColor(GOLD)
    canv.rect(0, PH - 16.4 * mm, PW, 1.4 * mm, stroke=0, fill=1)
    canv.setStrokeColor(GOLD)
    canv.setLineWidth(1.2)
    canv.line(MARGIN, 14 * mm, MARGIN + 11 * mm, 14 * mm)
    canv.setFillColor(MUTED)
    canv.setFont("Helvetica", 7.2)
    canv.drawString(MARGIN, 10 * mm,
                    "Private  /  Dr Oby Clems-Anunwa  /  not a plan and not a proposal")
    canv.drawRightString(PW - MARGIN, 10 * mm, "Page %d" % doc.page)
    canv.restoreState()


el = []
p = lambda t, st=P: el.append(Paragraph(t, st))
sp = lambda h=4: el.append(Spacer(0, h))
h2 = lambda t: el.append(Paragraph(t, H2))

# ==================================================================== note ====
p("Solace Healthcare, Games Village", TITLE)
p("What the site could become, and what would have to be true for each of them.", SUBTITLE)
p("Dr Oby Clems-Anunwa", LETTER_TO)
for t in [
    "Dr Oby, thank you for the time, and for the context on what you are trying to build near "
    "Games Village. I have been thinking about it since.",
    "I want to be clear about what this is and what it is not. It is not a plan and it is not a "
    "proposal. Nobody has measured your building, nobody has tested the slab, and I have not "
    "verified a single price in your catchment. Writing you a plan on that basis would be "
    "dishonest, and you would be right not to trust it.",
    "What I can give you is how I would think about the site. Four ways it could go, what each "
    "would cost and earn if things went reasonably well, and a set of conditionals: if this turns "
    "out to be true, then expect that. The numbers are ranges rather than figures, and they are "
    "there to show you the shape of the thing rather than to give you an answer.",
    "Two decisions you have already taken, which I have built on rather than around. You are not "
    "taking a second property, so everything here sits inside the complex you already own. And "
    "magnetic resonance and computed tomography go to AMCE rather than onto your site. On the "
    "property I think you are right, and it changes the plan less than you might expect, because "
    "the third phase stops being a new building and becomes the same rooms worked harder. On "
    "imaging I agree completely about magnetic resonance, which a converted apartment cannot carry "
    "at any sensible cost, and I would ask you to think again about computed tomography. I have put "
    "the number on it in Section 03 rather than argue it here.",
    "A few things I want to say plainly up front.",
    "The first is that the building is a larger problem than the medicine. Residential apartments "
    "convert into consulting rooms very easily and into theatres and wards with great difficulty, "
    "because the corridors are too narrow for a trolley, the staircases will not take a stretcher, "
    "and a residential floor slab was never designed to carry a scanner. On the last residential "
    "conversion we ran in Abuja the measured survey came back a third larger than the brief, and "
    "every extra square metre of it was corridor, so the cost moved and the revenue did not. Until "
    "somebody measures your five units properly, every number anybody gives you, mine included, is "
    "a guess delivered in a confident tone.",
    "The second is about the African Medical Centre of Excellence, because you will at some point "
    "be offered a version of this pitch that says nobody in Abuja does cancer care from end to "
    "end, and it is not true. AMCE is twenty minutes from you and does exactly that, radiotherapy "
    "included. I would not build an argument against them. I would build one underneath them. They "
    "were priced against Chennai and Istanbul, which is the correct position for them, and it "
    "leaves a great many people in Apo, Lokogoma and Gudu standing outside it. Those people are "
    "the opportunity, and at the moment nobody in this city is organised around them.",
    "The third is that a cancer service is really a drugs business wearing a hospital's clothes. "
    "Roughly two thirds of the cost of treating a patient is the medication, and most private "
    "schemes cap or exclude it, so the money comes largely from families. That makes sourcing and "
    "payment terms the difference between a cancer service that works and one that quietly runs "
    "out of cash while looking busy. It is also the part where your position at National Hospital "
    "is worth considerably more than the referrals everybody will tell you it is worth, because "
    "you already know how those drugs are priced and how patients are enrolled onto the programmes "
    "that pay for them.",
    "The fourth is about your own discipline rather than about the market. The most common way a "
    "doctor-owned hospital in this country fails is neither clinical nor commercial. It is that "
    "equity gets handed to colleagues as a thank you, twenty people end up holding five per cent "
    "each, and by year three nobody is able to take a hard decision. I raise it now because it is "
    "very much easier to structure before anybody has assumed anything.",
    "I have kept this short on purpose. There is a great deal more to say and most of it depends "
    "on answers I do not have yet. If any of it is useful, I would rather talk than write.",
]:
    p(t)
p("Warm regards,<br/><br/>Dr Debo Odulana<br/>"
  "<font size=8 color='#6b7280'>Founding Partner, Consult for Africa</font>", SIG)

# ====================================================================== 01 ====
el.append(PageBreak())
sec(el, "01", "CONTEXT", "Six things about this market I would want you to have first.")
for t, body in [
    ("The payor picture decides the model, not the clinical plan.",
     "Most private schemes in Nigeria cap or exclude systemic cancer therapy outright, which means "
     "a cancer service is funded largely out of pocket and by families, often by a son or a "
     "daughter abroad. Scheme business, by contrast, takes between eighty and a hundred and thirty "
     "days to pay. So the mix you accept is not an administrative matter. It sets how much cash "
     "you have to find and keep in the business, and it is the single most common reason a busy "
     "facility runs out of money."),
    ("Cancer in Nigeria is a cash business with a hospital attached.",
     "The drugs are bought for cash or on thirty days and they are the majority of the cost. A "
     "service that starts treatment before it is funded is lending money to its patients at a "
     "scale it cannot sustain, and it usually does not notice until the second year. The discipline "
     "of pre-authorising and pre-funding each course, from the very first patient, is worth more "
     "than any financing you could raise."),
    ("AMCE reset the top of this market, and that is useful to you.",
     "A well-capitalised quaternary centre twenty minutes away, built to stop Nigerians flying to "
     "India and Turkey, is not a competitor to a converted day-case facility. It is a ceiling. It "
     "establishes what the very best available costs, and it leaves everything below that price "
     "unserved. It is also a referral partner in both directions, because follow-up, "
     "rehabilitation and palliative care are not what a flagship wants its capacity used for. If "
     "your scanning is going to sit with them, that relationship stops being goodwill and becomes "
     "a dependency, and I would want it written down: named slots, an agreed turnaround, and a "
     "price, before you promise any patient anything about speed."),
    ("The consents take longer than the building.",
     "Three in particular are routinely discovered late. Change of use, because people assume the "
     "title deed settles it and it does not. Radiation authorisation, because shielding is treated "
     "as the equipment supplier's problem when it is a design input that has to be approved before "
     "the room is built. And the controlled drug licence for opioid analgesia, which is slow, and "
     "which nobody applies for early because the palliative service is a year away. Palliative care "
     "without morphine is not palliative care."),
    ("A quaternary centre is not a front door.",
     "Screening, family medicine, survivorship follow-up and home palliative care are the two ends "
     "of the cancer journey, and they are where Nigerian care actually fails. The diagnosis arrives "
     "too late, and afterwards people are sent home with very little. Neither end is what a "
     "flagship does well or particularly wants to do, and both are what a family physician is "
     "trained for. That is a structural advantage rather than a sentimental one."),
    ("A new building is worth about a year.",
     "You are right that people like new facilities, and the effect is real, but it lasts nine to "
     "twelve months and then what is left is whether you answered the phone. What holds people is "
     "time. Time to an appointment, time to a result, time to a treatment decision. In this city a "
     "woman who finds a breast lump commonly spends between four and ten weeks and visits three "
     "places before anybody tells her what it is. A facility that could honestly promise a "
     "diagnosis in forty-eight hours and a plan in a week would not need to advertise."),
]:
    h2(t)
    p(body)

# ====================================================================== 02 ====
el.append(PageBreak())
sec(el, "02", "OPTIONS", "Four ways the site could go.")
p("These are not phases of one plan. They are four different businesses, and the choice between "
  "them is a choice about how much capital you want at risk and how much of the clinical brand you "
  "want to own. All four fit on your site.")
el.append(tbl(
    [["A", "Diagnostics and clinics",
      "Ultrasound, plain film, mammography, laboratory, family medicine and specialist sessions. "
      "No theatre, no chemotherapy, no beds.", brng(O1_CAPEX), rng(O1["rev"][24])],
     ["B", "The day-case cancer service",
      "Everything in A, plus a chemotherapy day unit, a theatre, endoscopy, rehabilitation and "
      "home palliative care. Still no beds.", brng(O2_CAPEX), rng(O2["rev"][24])],
     ["C", "The whole complex",
      "Everything in B, plus around twenty beds and a second theatre in the fourth unit, and then "
      "a dialysis unit, more infusion chairs and a six day week in the fifth.",
      brng(O3_CAPEX), rng(B["rev"][24])],
     ["D", "The landlord",
      "Fit the shell to clinical standard and let established operators run the services inside "
      "it. Rent and a share of turnover.", "NGN 0.6 to 0.8 bn", "NGN 40 to 65 m"]],
    ["", "Option", "What it is", "Roughly what it costs", "A month, by year two"],
    [10 * mm, 42 * mm, FULLW - 148 * mm, 44 * mm, 52 * mm], aligns=["r", "r"]))
p("Revenue is what the option would be earning in month 24 if the ramp went reasonably well. "
  "Capital is the build. For Option C you would need roughly NGN %s billion available rather than "
  "the %s billion of build cost, because the difference is working capital, which no equipment "
  "quotation ever mentions."
  % (m(MB["peak"] / 1000, 1), m(O3_CAPEX / 1000, 1)), SMALL)

sp(6)
h2("What has to be true, and what kills each one")
el.append(tbl(
    [["A", "Very little. It is the easiest thing to build in this envelope and the quickest to "
      "open.",
      "Nothing much kills it. It also has a low ceiling and it competes head on with Clina-Lancet, "
      "Synlab and everybody else already doing this well in Abuja."],
     ["B", "That you can build a consultant panel, that the drug sourcing works, and that the "
      "conversion comes in near budget.",
      "A conversion that runs over budget and late together. Either alone is survivable. Both "
      "together stops the whole thing being worth doing."],
     ["C", "Everything in B, plus a lift and stretcher-capable circulation, which is a structural "
      "project rather than a fit-out, and then genuinely filling a six day week.",
      "The same construction risk, magnified, and a working capital requirement approaching NGN "
      "%s million. On current assumptions this option is worth doing but it is not comfortable, "
      "and Section 03 shows what would make it comfortable." % m(B["nwc"][24], 0)],
     ["D", "That you are content not to own the clinical brand or the patient relationship.",
      "Nothing financial. What it costs you is the thing that makes the other three worth doing, "
      "which is that the business is yours."]],
    ["", "What has to be true", "What kills it"],
    [10 * mm, 72 * mm, FULLW - 82 * mm], tiny=True))

sp(6)
el.append(card(
    "If you asked me today, and on the understanding that nobody has measured anything, I would "
    "build B and design the building so that C stays possible. B gives you a real business on a "
    "manageable amount of capital, it plays to what you personally bring rather than to what money "
    "can buy, and it does not require you to solve the hardest structural problem in the complex "
    "on day one. C is the better business in the end, but only if the survey says the building "
    "will take a lift, only if you fund the working capital properly, and only if the third phase "
    "is a real operating change rather than a line in a plan. A is a sound business and a poor use "
    "of your particular advantages. D I would not do, because you would be carrying the property "
    "risk and giving away the part that grows.", CREAM))


# ====================================================================== 03 ====
el.append(PageBreak())
sec(el, "03", "CONDITIONALS", "If this turns out to be true, then expect that.")
p("This is the honest form of a forecast at this stage. Each line below moves one thing and leaves "
  "the rest alone, against Option C, which is the fullest version and therefore the one where the "
  "sensitivities show most clearly.")
el.append(tbl(
    [["Computed tomography stays off site, at AMCE",
      "Expect about NGN %s million a month less by year two, and roughly NGN %s million less over "
      "seven years, against about NGN %s million of capital saved. A scanner taken on a managed "
      "service costs you no capital, because the vendor places it and takes a share of each study. "
      "It sits in a ground floor bay, it is the best margin line in the building, and it is what "
      "makes a two-day diagnosis yours rather than dependent on somebody else's slot list. This is "
      "the one decision in this note I would genuinely press you on. Magnetic resonance is a "
      "different matter and I would send that to them without hesitation."
      % (m(CT["rev"][24] - B["rev"][24], 0), m(MCT["npv"] - MB["npv"], 0), m(CT_CAPEX, 0))],
     ["AMCE will give you named scan slots and a next-day report",
      "The two-day diagnosis promise survives without your own scanner, and the referral "
      "relationship becomes a real asset. If they will not, do not make the promise. A pathway you "
      "do not control is not a pathway you can advertise."],
     ["The third phase happens properly: dialysis, more chairs, a six day week",
      "You reach NGN 400 million a month around month %d. If the third phase stays on paper, "
      "expect month %d and a business that does not really justify the capital that built it. "
      "Without a second site this is now the whole of your growth after year two."
      % (S.crosses(B), S.crosses(FLAT))],
     ["The dialysis unit goes into the fifth unit as planned",
      "It contributes about NGN %s million a month by year two on modest capital, it needs no "
      "structural work, and it suits the patients you already have. Without it, expect month %d "
      "for the NGN 400 million." % (m(B["rev"][24] - NODIAL["rev"][24], 0), S.crosses(NODIAL))],
     ["The cancer service reaches around 85 patients on treatment a month",
      "The plan works. At 55 patients expect month %d and a return that no longer justifies the "
      "risk, which tells you that oncology volume is now the assumption carrying the most weight."
      % S.crosses(THIN)],
     ["Drug sourcing through access programmes works as well as I think it can",
      "Monthly earnings at year two go from about NGN %s million to about NGN %s million on "
      "identical revenue. This is the largest single thing you personally can influence."
      % (m(B["ebitda"][24], 0), m(SOURCE["ebitda"][24], 0))],
     ["Scheme business is allowed to drift above forty per cent of revenue",
      "Profit barely moves and your cash requirement rises by about NGN %s million. Nothing in the "
      "monthly accounts shows this going wrong until it already has."
      % m(S.metrics(DRIFT)["peak"] - MB["peak"], 0)],
     ["The flagship opens a lower-priced tier and takes a quarter of your cancer volume",
      "You lose roughly NGN %s million a month. Uncomfortable now, rather than survivable, which "
      "is a direct consequence of the imaging decision."
      % m(B["rev"][24] - FLAG["rev"][24], 0)],
     ["The conversion runs over budget and late at the same time",
      "The project stops being worth doing. Either one alone is survivable. This remains the only "
      "single scenario that destroys value outright, and it is a construction scenario rather than "
      "a market one."],
     ["You start building before change of use is granted",
      "Expect to redesign work you have already paid for, or to be granted the change with "
      "conditions that force you to. The cheapest mistake to avoid and the most commonly made."],
     ["Colleagues are given equity as a thank you",
      "Expect a cap table you cannot manage by year three and a first hard decision that cannot be "
      "taken. Pay them well as a panel instead, and keep ownership small and earned."],
     ["You price near the flagship rather than well below it",
      "Expect a very good building with not enough people in it. The entire argument for this site "
      "is that it serves the people who cannot reach those prices."]],
    ["If", "Then expect"], [64 * mm, FULLW - 64 * mm]))

sp(5)
el.append(card(
    "<b>One convention worth knowing about, because it cuts both ways.</b> Everything above counts "
    "only what is earned inside seven years and gives the business no value at the end of them, "
    "which is deliberately conservative. On the plan as it now stands that convention does real "
    "work: the seven-year value is NGN %s million, and a going concern earning NGN %s million a "
    "year at that point would be worth several times that to a buyer. I would rather show you the "
    "hard version and let you add the optimism yourself than the other way round."
    % (m(MB["npv"], 0), m(YR7, 0)), ALERT))


# ====================================================================== 04 ====
el.append(PageBreak())
sec(el, "04", "WHAT I DO NOT KNOW", "The questions that would change these answers.")
p("I would want the answers to these before I said anything more definite, and two of them need "
  "instruments rather than opinions.")
el.append(tbl(
    [["What is the measured area, unit by unit, and what does the structure actually allow?",
      "A measured survey and a structural engineer. About three weeks.",
      "Changes every number in this note, and decides whether Option C exists at all."],
     ["What does the certificate of occupancy say, and what will development control accept?",
      "A pre-application conversation, lodged early.",
      "Decides whether there is a project. Everything else waits behind it."],
     ["What do AMCE and the two or three nearest private operators actually charge?",
      "Fieldwork. Two to three weeks.",
      "Sets your tariff, and therefore the volume you need."],
     ["How many oncology patients are realistically within your reach in year one?",
      "Your own judgement, and conversations with the people who would refer.",
      "The largest single driver in the plan, and the one I trust you on more than I trust myself."],
     ["Which drug access programmes would accept Solace as an administration site, and on what "
      "terms?", "Conversations you are better placed to have than we are.",
      "Decides whether the price position is real or aspirational."],
     ["Who else is in this with you, and what have they been told to expect?",
      "A conversation, and then a shareholders' agreement.",
      "Cheap to settle now and very expensive to settle later."]],
    ["Question", "How it gets answered", "Why it matters"],
    [62 * mm, 44 * mm, FULLW - 106 * mm], tiny=True))

el.append(PageBreak())
sec(el, "05", "WHAT WE CAN DO", "Three pieces of work, and only the first one needs deciding now.")
p("Consult for Africa builds and runs health businesses in Nigeria. We have converted a "
  "residential building into a clinical one in this city, structured medical joint ventures and "
  "shareholder agreements, taken facilities through licensing, built tariff and payor strategies, "
  "audited hospitals on behalf of their boards, and recruited consultants, including from the "
  "diaspora. We work with founders and boards rather than with procurement departments, and we "
  "tend to still be involved long after the document is delivered.")
p("There are three things we could do here. They are sequential, and you would be committing only "
  "to the first.")
sp(2)
el.append(tbl(
    [["One", "Prove it, or kill it",
      "Measure the building and get a structural verdict on whether it will carry a scanner and a "
      "lift. Lodge the change of use. Verify what AMCE and the nearest private operators actually "
      "charge. Agree the service model room by room. Build you a monthly financial model that you "
      "own and can run yourself. Draft the ownership structure and the consultant panel before "
      "anybody has assumed anything.",
      "10 to 12 weeks", "NGN 70 to 85 m"],
     ["Two", "Build it with you",
      "Design managed to a fixed price. Equipment procured, with managed service negotiated "
      "wherever it saves capital. Licences granted. The clinical and management team recruited and "
      "credentialed. Payor contracts signed and a revenue cycle that works on the first day rather "
      "than the first crisis. Commissioning and opening.",
      "Through to opening", "Scoped after stage one"],
     ["Three", "Run it with you",
      "If at that point you would rather have an operator than an adviser, we manage the business "
      "itself. This is a different arrangement and it is not one you need to think about yet.",
      "From opening", "Scoped separately"]],
    ["", "What it is", "What it involves", "How long", "Indicative"],
    [13 * mm, 34 * mm, FULLW - 129 * mm, 26 * mm, 30 * mm], aligns=["r", "r"]))

sp(6)
h2("How we would price it")
p("We charge setup and delivery work as the time it actually takes, at published day rates, rather "
  "than as a percentage of what you spend. You see the effort, and if a workstream turns out not "
  "to be needed it comes straight off the fee. The fee is capped, and billed monthly against "
  "timesheets, so you never pay for a day that was not worked. Third party consultants, meaning "
  "the architect, the structural and services engineers, the quantity surveyor and the radiation "
  "physicist, pass through at cost and we do not mark them up.")
p("If it ever got as far as stage three, the management fee would sit on contribution rather than "
  "on revenue. That matters more than it sounds. A fifth of a cancer service's revenue is drug "
  "pass-through earning a fraction of what the rest of the business earns, so a percentage of "
  "revenue would pay us most for the line that makes you least, and it would rise every time a "
  "drug price did.")

sp(6)
el.append(card(
    "<b>What I would actually suggest.</b> Do stage one and nothing else. It costs a small "
    "fraction of what you would spend making the wrong decision confidently, it takes about three "
    "months, and at the end of it you either have a real plan built on measured facts or a clear "
    "and early reason not to proceed. Both of those are worth paying for. I would rather you "
    "bought that from us and then decided freely about the rest than commit to anything larger on "
    "the strength of a document written before anybody measured your building.", CREAM))
sp(6)
el.append(card(
    "One last thought, and it is the reason I took the time over this. There is a version of "
    "Solace that is another good private hospital in Abuja, and the city has several already. "
    "There is another version that is the place people in this part of town go when somebody they "
    "love is told they have cancer, because it is close, because it is affordable, because "
    "somebody there owns the whole journey rather than one appointment in it, and because it "
    "answers the phone. The second is a considerably better business, and I think it is the one "
    "your background is actually suited to building. I would like to talk about it.", GREEN))
p("Dr Debo Odulana<br/><font size=8 color='#6b7280'>Founding Partner, Consult for Africa</font>",
  SIG)
sp(8)
el.append(footer_bar())

doc = BaseDocTemplate(str(OUT), pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN,
                      topMargin=22 * mm, bottomMargin=18 * mm,
                      title="Solace Healthcare, Games Village: options note",
                      author="Consult for Africa")
doc.addPageTemplates([PageTemplate(id="m", frames=[Frame(MARGIN, 18 * mm, FULLW, PH - 40 * mm,
                                                         id="f")], onPage=furniture)])
doc.build(el)
print("wrote %s" % OUT)
