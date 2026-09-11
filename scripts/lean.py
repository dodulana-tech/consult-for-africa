# ---------------------------------------------------------------
# LEAN CAPITAL: what Medbury actually has to write a cheque for
# ---------------------------------------------------------------
# cols: as costed, LEAN CASH at opening, how the balance is carried
items = [
 ("Building fit-out, first floor + reception + minimum ground", 232, 110,
  "Lean spec per the fit-out forecast; ground floor completed in phase 2 from trading"),
 ("Theatre suite",                                              120,   0,
  "Deferred. Gated on a signed surgical anchor, then leased"),
 ("Power, 25KVA hybrid solar",                                   33,   0,
  "Solar PPA / lease-to-own. Zero capex, title transfers years 5 to 7"),
 ("Medbury Diagnostics unit",                                    28,   8,
  "Analysers placed free against a committed reagent spend. Cash is benching only"),
 ("Medbury Pharmaceuticals unit",                                24,  10,
  "Fit-out only. Opening stock on consignment and 60 day terms"),
 ("Aesthetics: equipment and clinical fit-out",                  55,  15,
  "Energy devices on lease-to-own or pay-per-use. Injectables need no capital"),
 ("Hair restoration suite",                                      35,   8,
  "Or nil on a revenue-share partnership where the operator brings the kit"),
 ("Longevity and infusion bays",                                 18,  10,
  "Recliners and pumps bought, monitoring leased"),
 ("Opening inventory across the units",                          22,   7,
  "Consignment and supplier terms on the balance"),
 ("Working capital",                                             95,  45,
  "Trough is shallower: rent prepaid, annual lines collected up front"),
]
c_cost = sum(i[1] for i in items); c_lean = sum(i[2] for i in items)
w = max(len(i[0]) for i in items)
print("LEAN CAPITAL\n" + "-"*96)
for n,a,b,_ in items: print(f"{n:{w}s} {a:5.0f} -> {b:5.0f}   saves {a-b:5.0f}")
print("-"*96)
print(f"{'CASH TO OPEN':{w}s} {c_cost:5.0f} -> {c_lean:5.0f}   saves {c_cost-c_lean:5.0f}")
print(f"{'plus rent and fees already paid':{w}s} {'':5s}    {115:5.0f}")
print(f"{'TOTAL CASH EXPOSURE':{w}s} {c_cost+115:5.0f} -> {c_lean+115:5.0f}\n")

# ---------------------------------------------------------------
# what leaning costs in annual margin (capex -> opex)
# ---------------------------------------------------------------
drag = [("Solar PPA premium over owning the array",                6.0),
        ("Equipment lease cost above the amortisation it replaces", 28.0),
        ("Reagent-rental premium on placed analysers",             14.5),
        ("Consignment and supplier-terms margin give-up",           3.0)]
D = sum(d for _,d in drag)
for n,d in drag: print(f"  {n:52s} {d:5.1f}")
print(f"  {'annual opex drag':52s} {D:5.1f}")

PRE_FEE, REV = 645.0, 1697.0
lean_pre_fee = PRE_FEE - D
print(f"\nto Medbury before fee: {PRE_FEE:.0f} -> {lean_pre_fee:.0f}")
print(f"payback from stabilisation: as costed {662/PRE_FEE:.2f} yrs -> LEAN {c_lean/lean_pre_fee:.2f} yrs")
print(f"capital at risk if it fails: {662+115:.0f} -> {c_lean+115:.0f}\n")

# phase 2, funded from trading not from a cheque
p2 = [("Ground floor completion and balance of fit-out", 75),
      ("Theatre suite, leased, cash deposit only",       35)]
print("PHASE 2, funded from cash flow once trading:")
for n,v in p2: print(f"  {n:52s} {v:5.0f}")
print(f"  {'total, from trading':52s} {sum(v for _,v in p2):5.0f}")

# ---------------------------------------------------------------
# THE FEE PROBLEM leaning creates for CFA
# ---------------------------------------------------------------
print("\n" + "="*96)
print("WHY %-OF-CAPITAL BREAKS UNDER A LEAN MANDATE")
for lab, base in [("as costed", 662), ("LEAN", c_lean)]:
    print(f"  development fee at 15% of {lab:9s} capital {base:5.0f} = {base*0.15:6.1f}")
print(f"  -> CFA is PUNISHED {662*0.15 - c_lean*0.15:.0f} for doing exactly what she asked for.\n")
BUDGET = 450.0                      # approved, benchmarked conventional build budget
saving = BUDGET - c_lean
share = min(0.20 * saving, 50.0)
print(f"  FIX: fixed delivery fee 90.0, plus 20% of cash capital saved against an approved "
      f"benchmarked budget")
print(f"       budget {BUDGET:.0f}, delivered {c_lean:.0f}, saving {saving:.0f} -> "
      f"CFA earns {share:.1f} (capped 50)")
print(f"       total development economics {90+share:.1f} vs {662*0.15:.1f} on the old basis")
print(f"       and now CFA is PAID TO REDUCE her capital, not to spend it.")

# ---------------------------------------------------------------
# restated headline for Itunu
# ---------------------------------------------------------------
print("\n" + "="*96)
print("THE HEADLINE SHE SEES")
setup_fee = 90 + 4*28 + 4*6
print(f"  cash to open the campus            {c_lean:6.0f}")
print(f"  CFA setup fees                     {setup_fee:6.0f}")
print(f"  total cash before trading          {c_lean+setup_fee:6.0f}   (was {662+235:.0f})")
print(f"  returns, before management fee     {lean_pre_fee:6.0f} a year")
print(f"  payback from stabilisation         {(c_lean+setup_fee)/lean_pre_fee:6.2f} years")
