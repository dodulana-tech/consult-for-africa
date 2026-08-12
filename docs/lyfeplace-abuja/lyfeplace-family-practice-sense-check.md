# Lyfe Place Abuja: family practice projection, sense check

Consult for Africa, August 2026. Against `lyfeplace-family-practice-model.xlsx`, the
measured floor plans in `lyfeplace-abuja-floor-plans-cfa.pdf`, the rate assumptions in
`lyfeplace-rate-assumptions-cfa.pdf` and the product definition in
`lyfeplace-abuja-product-cfa.pdf`.

---

## The short version

The arithmetic in the workbook is clean. Every total reconciles, the tier build-up is
consistent, and the model is unusually honest about which of its own inputs are weak.
Three things are wrong, and only one of them is about money.

1. **The model never counts rooms.** It sizes physicians and stops. Loaded properly, the
   practice needs **two rooms at Low, three and a half at Base and five at High**. The
   campus brief gives it **one**. At Base that takes two and a half rooms out of the
   sessional pool, which is where the campus makes its margin.
2. **The staffing floor is set by opening hours, not by volume.** A campus open 07:00 to
   21:00 needs about **2.6 physicians just to be open**, whatever the panel size. The
   ramp puts half a physician against 420 covered lives at month nine. That is not a
   costing error, it is a promise the practice cannot keep.
3. **Two CFA documents disagree about sessional fill**, 35 to 55 per cent in the rate
   assumptions against a 75 per cent booking ceiling in the product definition. That is
   a 1.8 times difference on the largest revenue line in the campus, and the family
   practice room take makes it worse.

Corrected, the practice still works. Base contribution falls from **N368m to about
N285m**, a 23 per cent haircut, and the case to build it first is unchanged. The campus
model is the thing that needs redoing, not the practice.

---

## 1. What the model gets right

Worth saying plainly, because the rest of this note is criticism.

| | |
|---|---|
| Arithmetic | Every line reconciles. Membership revenue, encounter weighting, the transfer to diagnostics, the cost base and the contribution all tie out to the naira. |
| Pods driven by encounters, not headcount | The Panel tab is right to size on weighted encounter demand. Most primary care models size on member count and drift. |
| Break-even framing | Correctly identifies that the wellness catalogue, not membership, sets break-even. N186m of a N270m cost base is covered before a single member joins. That is the most useful sentence in the workbook. |
| Transfer honesty | The Capture tab explicitly warns that the diagnostics transfer is gross revenue, not contribution, and tells the reader to apply the margin first. Most models quietly add it. |
| Status column | Every driver is marked derived, benchmarked or judgement. The three weakest are named in the Readme. |

The self-critique is also correct. The Panel tab flags that implied lives per physician
(567, 626, 657) exceed the adopted 550 design capacity and says "if it does, the headroom
factor is too low." It is. The model raises the flag and then does not act on it.

---

## 2. The room count, which the model does not compute

### What the model does

Pods are derived from membership encounters only, then multiplied by a 1.18 headroom
factor described as carrying the wellness catalogue.

| | Low | Base | High |
|---|---|---|---|
| Membership encounters a year | 2,874 | 5,370 | 7,900 |
| Divided by 2,534 per physician | 1.13 | 2.12 | 3.12 |
| Times 1.18 headroom | 1.34 | 2.50 | 3.68 |
| **Pods adopted** | **1.5** | **2.5** | **3.5** |

The 1.18 factor buys 966 encounters of capacity at Base. The wellness catalogue is
**3,285 units a year**. The headroom covers under a third of it.

### Load the catalogue properly

Two different capacities are in play and the model treats them as one. A screening
package or a pre-employment medical occupies a **room** for a full slot but occupies a
**physician** only for sign-off and the results conversation. Split them, take the
physician share of a wellness encounter at 0.35, and exclude the eleven corporate
wellness days as off-site events.

| | Low | Base | High |
|---|---|---|---|
| Membership encounters | 2,874 | 5,370 | 7,900 |
| Wellness room encounters | 1,801 | 3,274 | 4,257 |
| **Total room encounters** | **4,675** | **8,644** | **12,157** |
| Physician demand, at 0.35 wellness share | 3,504 | 6,516 | 9,390 |
| **Physicians needed** | **1.5** | **3.0** | **4.0** |
| Model says | 1.5 | 2.5 | 3.5 |
| **Consulting rooms needed** | **2.0** | **3.5** | **5.0** |
| Campus brief allows | 1 | 1 | 1 |

The pod count survives almost intact. The 1.18 fudge happens to approximate the physician
load of the catalogue, so the model is roughly right by accident, half a pod light at
Base and High. **The room count is the finding.** The practice needs three and a half of
the campus's eight consulting rooms at Base, not one.

### Why that matters more than the extra half pod

An extra half pod costs N16.7m a year. Two and a half extra rooms cost the campus its
sessional pool. On the rate assumptions tariff and fills, a first floor consulting room
grosses about **N24m a year**; on the product definition's 75 per cent ceiling, about
N56m. Either way the facility charge of N28m in the model is priced for one room.

---

## 3. The coverage floor

The campus operating window in the brief is **07:00 to 21:00**, with a Saturday band. A
pod delivers six clinical hours a day, five days a week: thirty clinical hours a week per
physician.

- Opening hours a week: roughly 78
- Physician clinical hours a week: 30
- **Physicians needed for single cover: 2.6**

Before a single member joins. Volume does not enter it.

Against that floor:

| Month | Covered lives | Pods in the ramp | Coverage floor |
|---|---|---|---|
| 9 | 420 | 0.5 | 2.6 |
| 12 | 680 | 1.0 | 2.6 |
| 18 | 1,180 | 2.0 | 2.6 |
| 24 | 1,565 | 2.5 | 2.6 |

Half a physician cannot deliver same-day access to 420 people who have paid between
N185,000 and N750,000 a year for it. The Low scenario at 1.5 pods is not a smaller version
of the practice, it is a different product.

There are only two honest resolutions, and they are a product decision rather than a
modelling one:

- **Run the practice on shorter hours than the campus**, say 08:00 to 18:00 weekdays plus
  Saturday morning, and say so in the membership terms. Coverage floor drops to about 1.9.
- **Hold two physicians on duty from opening** and accept the cost while the panel fills.
  That front-loads roughly N30m to N40m into months one to twelve.

The model currently assumes neither. Whichever is chosen has to be written into the
membership promise before a single tier is sold.

---

## 4. Where the revenue assumptions are thin

### The catalogue is half the business, and it is not a family practice

Wellness catalogue gross at Base is **N489.5m** against membership revenue of **N503.7m**.
The line called family practice is, in revenue terms, a screening and occupational health
business with a membership panel attached.

That is not a criticism of the strategy. It is a criticism of the name, because the name
is driving the design. An occupational health unit doing **2,112 corporate and visa
medicals a year**, roughly ten a working day, arriving in batches, needs its own room, its
own flow and its own front desk. The floor plans put the family practice on the first
floor and the X-ray on the ground floor, which is correct for weight and evacuation and
wrong for a visa medical.

### The two volume lines carrying it

| Line | Base volume | A day's worth | Comment |
|---|---|---|---|
| Pre-employment medical, corporate rate | 1,120 a year | 5 a day | N53.8m, the largest volume line. Assumes corporate contracts that do not exist yet |
| Visa and travel medical, both grades | 720 a year | 3.3 a day | **This may be a licensing question, not a demand question** |

The visa medical line needs checking before anything else in the workbook. In Nigeria the
volume destinations run through **panel physicians appointed by the embassy or by IOM**.
If Lyfe Place is not on those panels, 720 visa medicals a year at N85,000 and N145,000 is
not a marketing problem, it is unreachable. Confirm panel status, or the application route
and its lead time, before the number stays in a board pack.

The chest X-ray load is the second-order consequence: 720 visa medicals plus a share of
1,120 pre-employment medicals puts perhaps **1,200 to 1,800 chest films a year** through
the single ground floor X-ray room, alongside orthopaedics and the theatre. Feasible, but
it makes imaging a shared bottleneck between two businesses with different rhythms.

### The flat 62 per cent diagnostics transfer

A single 62 per cent test share is applied to all eighteen catalogue lines. It is roughly
right for the screening packages, where bloods and imaging dominate. It is clearly wrong
for the four programme lines, where the cost is clinician time and coaching:

| Line | Price | 62% to diagnostics | Plausible test share |
|---|---|---|---|
| Cardiometabolic reset, 12 weeks | 480,000 | 297,600 | perhaps 20% |
| Diabetes stabilisation, 6 months | 620,000 | 384,400 | perhaps 25% |
| Hypertension stabilisation, 6 months | 420,000 | 260,400 | perhaps 20% |
| Weight and metabolic, 6 months | 540,000 | 334,800 | perhaps 15% |

Programme lines total N43.1m at Base. Correcting the transfer moves roughly **N18m a year**
from diagnostics back to the practice. Small against the total, but it misstates two
business units against each other, which matters if Itunu is comparing BU performance.

### Encounter rates, none of them validated

Every encounter rate in the model is marked "estimated, not validated". The exposure is
concentrated:

- **Corporate Core carries 520 of 1,565 lives at 2.2 encounters** a year. Nigerian HMO
  utilisation for corporate lives frequently runs higher, because members use cover they
  did not pay for directly. At 3.2 the panel adds 520 encounters and a fifth of a pod.
- **Elders at 7.5 encounters** is low for a 60-plus panel with chronic disease. Only 70
  lives, so immaterial, but it suggests the rates were set optimistically throughout.
- A uniform 20 per cent overshoot across all tiers takes Base to 6,444 membership
  encounters and the room requirement to **four**.

### Renewal, and the year the model does not show

76 per cent into year two is named in the Readme as the assumption with the least evidence
and the most riding on it. Agreed. The consequence the model does not show is that the
ramp stops at month 24, which is exactly when the churn starts to bite. At Base the
practice must **replace 375 lives in year three** while still growing. That is a sales
capacity question, not a budget one; the N50m marketing line covers the cash easily.

**Extend the ramp to month 36.** A model that ends the month before its hardest year is
not finished.

### Pricing against the market

Blended N321,800 per covered life a year, for primary care access only, no hospitalisation
and no specialist cover. Against 2026 Nigerian HMO plans that is at the premium end, and
the question the model does not answer is whether this is **additive to an existing HMO**.
Most of this target market already has employer cover. If Lyfe Place membership is a
second payment rather than a replacement, the renewal assumption is doing even more work
than the Readme admits.

The corporate tiers make this sharpest. **565 of 1,565 lives, 36 per cent of the panel, is
corporate**, sold to employers who are already buying HMO cover. That is the least proven
channel in the model carrying the largest single block of lives.

---

## 5. The interface with the campus model

This is where the numbers actually break, and it is not the workbook's fault.

**The rate assumptions document and the product definition disagree about fill.**

| Source | Sessional fill | Implied first floor sessional |
|---|---|---|
| `lyfeplace-rate-assumptions-cfa.pdf` | 35% early, 35% daytime, 55% evening, 45% Saturday | about N24m per room |
| `lyfeplace-abuja-product-cfa.pdf` | "practical booking ceiling of about 75%", 4,970 sessions across six rooms | about N56m per room |

Both cannot be right. The rate document's own tariff and fills produce roughly **N144m**
across six rooms; the product document carries **N337.1m**. Until that is reconciled in one
place, no campus number that includes a sessional line can be relied on.

**Then the family practice takes two and a half more rooms than anyone allowed for.**

| | Brief assumes | Survey and this check |
|---|---|---|
| Consulting rooms on the campus | 8 | 8, measured |
| To the family practice | 1 | 3.5 at Base |
| **Sessional pool** | **6 to 7** | **3.5 to 4.5** |

At the rate document's own fills, a sessional pool of 3.5 rooms grosses roughly **N84m**,
against the N337.1m in the product definition. That is the single largest correction in
the whole campus case, and it falls out of the family practice sizing.

**The practice is being subsidised and the memo line hides it.** The model charges the
practice N28m a year for "facility and room allocation", priced for one room. Corrected
to three and a half rooms it is between **N84m and N196m** depending on whose fill
assumption survives. The "campus contribution generated" memo of N230.7m does not net any
of this off.

---

## 6. Restated Base case

Holding every revenue assumption in the workbook, and correcting only the two things that
are demonstrably wrong.

| NGN a year, Base | Model | Restated | Change |
|---|---|---|---|
| Practice revenue, net | 637.7m | 637.7m | unchanged |
| Clinical pod cost | (83.3m) | (99.9m) | 3.0 pods, not 2.5 |
| Facility and room allocation | (28.0m) | (94.5m) | 3.5 rooms at N27m |
| Other overhead | (158.8m) | (158.8m) | unchanged |
| **Contribution** | **367.6m** | **284.5m** | **down 23%** |
| Contribution margin | 57.7% | 44.6% | |
| Contribution per covered life | 234,903 | 181,789 | |

Two things to take from that table.

**The practice still works.** A 44.6 per cent contribution margin on a primary care line
that also generates N230.7m of contribution elsewhere on the campus is a good business.
The case for building it first is unchanged and, if anything, strengthened, because the
capture is now the majority of the value.

**The campus case does not survive unchanged.** The sessional pool shrinks by two and a
half rooms and the fill assumption behind it is disputed between two of our own documents.
That correction is larger than anything in the practice P&L.

---

## 7. What to do, in order

1. **Check the visa medical panel status.** It gates N71m of catalogue revenue and it is a
   licensing fact, not an estimate. One phone call.
2. **Reconcile sessional fill in one place.** 35 to 55 per cent or 75 per cent. Every
   campus number downstream depends on it and the two documents currently disagree.
3. **Add a rooms tab to the workbook.** Room-slot demand and physician-slot demand
   separately, with the wellness catalogue loaded explicitly rather than hidden inside a
   1.18 factor. Then reprice the facility charge off the room count it produces.
4. **Decide the opening hours of the practice** and write them into the membership terms
   before the tiers are sold. Then set the month-one staffing off the coverage floor, not
   off the panel size.
5. **Split the transfer rate by catalogue group.** Screening, programme and occupational
   are three different cost structures and a flat 62 per cent misstates two business
   units against each other.
6. **Extend the ramp to month 36** so the first full year of churn is visible.
7. **Sensitise Corporate Core encounters** at 2.2, 2.7 and 3.2. It is a third of the
   panel and it is unvalidated.

Items 1 and 2 change the answer. The rest change the confidence.

---

## What this note does not cover

Capex and fit-out are outside the workbook and outside this check. So is the question of
whether the membership proposition is additive to an existing HMO, which is a research
question rather than a modelling one and is the largest single risk to the revenue line.
The wellness catalogue prices have not been benchmarked against Abuja comparators; only
the volumes have been challenged.
