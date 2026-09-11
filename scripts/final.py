REV, LANDLORD = 1697.0, 273.0
PRE_FEE = 594.0            # lean: 645 less 51.5 opex drag from leasing/PPA/consignment
CASH_OPEN, PHASE2, PAID = 213.0, 110.0, 115.0
DEPLOYED = CASH_OPEN + PHASE2

# ---- CFA anchor: light early where she is sensitive, heavy late where she is not ----
DELIV, MOBIL = 90.0, 25.0
EST_PER, EST_KICK, LIC_PER = 22.0, 5.5, 6.0
BUDGET = 450.0
eff = min(0.20 * (BUDGET - CASH_OPEN), 50.0)
BASE_PCT, FLOOR_M, INC_PCT, HURDLE_PCT, EQUITY = 0.06, 6.0, 0.25, 0.15, 0.15

cash_before_trading = CASH_OPEN + MOBIL + 4 * EST_KICK
print(f"CASH BEFORE TRADING (what she writes) = capital {CASH_OPEN:.0f} + mobilisation {MOBIL:.0f}"
      f" + establishment kickoff {4*EST_KICK:.0f} = {cash_before_trading:.0f}")
print(f"  already paid (rent + fees) {PAID:.0f};  total exposure {cash_before_trading+PAID:.0f}"
      f"   (conventional build was 897)")
print(f"  capital efficiency share {eff:.1f}, paid out of the {BUDGET-CASH_OPEN:.0f} she did not spend\n")

base_s = max(REV * BASE_PCT, FLOOR_M * 12)
hurdle = DEPLOYED * HURDLE_PCT
inc_s = (PRE_FEE - base_s - hurdle) * INC_PCT
print(f"STABILISED: base {base_s:.1f} ({BASE_PCT:.0%}, floor {FLOOR_M:.0f}/mo)  "
      f"incentive {inc_s:.1f} ({INC_PCT:.0%} over a {HURDLE_PCT:.0%} return on {DEPLOYED:.0f})")
print(f"  CFA {base_s+inc_s:.1f}/yr = {(base_s+inc_s)/REV:.1%} of revenue, "
      f"{(base_s+inc_s)/(PRE_FEE-LANDLORD):.0%} of the {PRE_FEE-LANDLORD:.0f} it creates")
print(f"  Medbury keeps {PRE_FEE-base_s-inc_s:.1f} vs {LANDLORD:.0f} on the alternative\n")

# ---- ramp, lean cost base ----
amort = 20.0
cash_cost = REV - PRE_FEE - amort
var, fixed = cash_cost * 0.55, cash_cost * 0.45
def qtr(p): return REV*p/4 - var*p/4 - fixed/4
Y1 = sum(qtr(p) for p in (0.30, 0.50, 0.68, 0.82)) - 30.0
Y2 = sum(qtr(p) for p in (0.92, 1.00, 1.00, 1.00))
Y3 = 4 * qtr(1.00)

d_yr, e_yr = (DELIV - MOBIL) / 3, (EST_PER - EST_KICK) * 4 / 2.5   # 36 mo and 30 mo
rows, cum = [], 0.0
for lab, cash, rv, inc_frac, lic, est in [
        ("Year 1", Y1, 976.0, 0.0, 12.0, e_yr), ("Year 2", Y2, 1663.0, 8/12, 12.0, e_yr),
        ("Year 3", Y3, REV, 1.0, 0.0, e_yr*0.5), ("Year 4", Y3, REV, 1.0, 0.0, 0.0)]:
    b = max(rv * BASE_PCT, FLOOR_M * 12)
    i = inc_s * inc_frac
    cfa = b + i + d_yr * (1 if lab != "Year 4" else 0) + est + lic
    keep = cash - cfa
    cum += keep
    rows.append((lab, rv, b, i, cfa, keep, cum))
    print(f"{lab}: rev {rv:6.0f}  cash before fee {cash:6.1f}  |  base {b:6.1f} inc {i:6.1f} "
          f"deferred {d_yr*(1 if lab!='Year 4' else 0)+est+lic:5.1f}  CFA {cfa:6.1f} ({cfa/rv:5.1%})"
          f"  |  Medbury {keep:6.1f}  cum {cum:6.1f}")

for lab, _, _, _, _, _, c in rows:
    if c >= cash_before_trading:
        print(f"\n  capital back during {lab} (cumulative {c:.0f} vs {cash_before_trading:.0f})"); break
print(f"  landlord alternative would be at {LANDLORD:.0f}/yr, payback ~month 37\n")
print(f"THE TRADE: leaning gives up {51.5:.1f}/yr of margin to avoid {449.0:.0f} of upfront capital.")
print(f"  {449.0/51.5:.1f} years of margin buys back the whole capital saving. She keeps the cash now.")
