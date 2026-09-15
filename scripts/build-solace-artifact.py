"""
The web version of the Solace document, generated from the same model as the PDF
so the two can never disagree.

    python3 scripts/build-solace-artifact.py
"""

from __future__ import annotations

import html
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import solace_model as S

OUT = Path(__file__).resolve().parents[1] / "docs" / "solace-abuja" / "solace.html"

B, NS, DR = S.build(), S.build(drop_spoke=True), S.build(dso=S.DRIFT_DSO)
UP = S.build(dcr_override={S.ONCO: S.ONCO_DCR_GOOD})
MB, MNS, MDR, MUP = S.metrics(B), S.metrics(NS), S.metrics(DR), S.metrics(UP)
CROSS, CROSS_NS = S.crosses(B), S.crosses(NS)
M24, EB24 = B["rev"][24], B["ebitda"][24]
CONTRIB24 = M24 - B["direct"][24]
EB_PCT, CONTRIB_PCT = 100 * EB24 / M24, 100 * CONTRIB24 / M24
CAPEX_ALL = sum(S.CAPEX_TOTAL.values())
WC_GAP = MB["peak"] - CAPEX_ALL
RECV24 = M24 * S.DSO / S.DAYS
FEE_G = S.fee_by_phase()
FEE_N = {k: v * 0.9 for k, v in FEE_G.items()}
FEE_GROSS, FEE_NET = sum(FEE_G.values()), sum(FEE_N.values())
GRADE_DAYS = {g: sum(d[i] for _p, _w, d in S.WORK) for i, g in enumerate(S.GRADES)}
TOTAL_DAYS = sum(GRADE_DAYS.values())
BE_CAPEX = S.solve(lambda v: dict(capex_mult=v), 1.0, 2.6, higher_is_worse=True)
BE_DELAY = S.solve(lambda v: dict(delay=v), 0, 36, higher_is_worse=True, integer=True)
BE_DSO = S.solve(lambda v: dict(dso=v), S.DSO, 260.0, higher_is_worse=True)
BE_ONCO = S.solve(lambda v: dict(line_mult={S.ONCO: v}), 0.05, 1.0) * 85
BE_SURG = S.solve(lambda v: dict(line_mult={S.SURG: v}), 0.05, 1.0) * 80
WORDS = {6: "six", 7: "seven", 8: "eight", 9: "nine", 10: "ten"}
DELAY_W = WORDS.get(int(BE_DELAY), "%d" % BE_DELAY)
ONCO24 = 121.5 * S.maturity(24, 9, 6.2)
RAD24 = 68.4 * S.maturity(24, 9, 4.0)


def n(x, dp=1):
    return ("{:,.%df}" % dp).format(x)


OUT_PARTS = []
w = OUT_PARTS.append
SECTIONS = []


def sec(num, eyebrow, title, lede=""):
    sid = "s%s" % num
    SECTIONS.append((num, eyebrow, sid))
    w('<section class="sec" id="%s"><div class="sec-head"><span class="num">%s</span>'
      '<div><p class="eyebrow">%s</p><h2>%s</h2>%s</div></div>'
      % (sid, num, eyebrow, title,
         '<p class="lede">%s</p>' % lede if lede else ""))


def end():
    w("</section>")


def para(*ps):
    for t in ps:
        w("<p>%s</p>" % t)


def note(t):
    w('<p class="note">%s</p>' % t)


def card(t, kind="plain"):
    w('<aside class="card %s">%s</aside>' % (kind, t))


def ul(items, tight=False):
    w('<ul class="%s">' % ("list tight" if tight else "list"))
    for i in items:
        w("<li>%s</li>" % i)
    w("</ul>")


def table(head, rows, align=None, foot=False, chips=None, wide=False):
    align = align or []
    w('<div class="tw%s"><table>' % (" wide" if wide else ""))
    w("<thead><tr>" + "".join(
        '<th class="%s">%s</th>' % ("r" if i in align else "", h) for i, h in enumerate(head))
      + "</tr></thead><tbody>")
    for k, r in enumerate(rows):
        cls = ' class="foot"' if (foot and k == len(rows) - 1) else ""
        cells = []
        for i, c in enumerate(r):
            klass = "r" if i in align else ""
            if chips is not None and i == chips:
                v = str(c).lower()
                cells.append('<td class="%s"><span class="chip %s">%s</span></td>' % (klass, v, c))
            else:
                cells.append('<td class="%s">%s</td>' % (klass, c))
        w("<tr%s>%s</tr>" % (cls, "".join(cells)))
    w("</tbody></table></div>")


# ======================================================================= head =
w('<title>Solace Healthcare Abuja</title>')
w('<link rel="preconnect" href="https://fonts.googleapis.com">')
w('<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>')
w('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?'
  'family=Archivo:wght@500;600;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;'
  '1,8..60,400&family=IBM+Plex+Mono:wght@400;500;600&display=swap">')
w("<style>%s</style>" % """
:root{
  --bg:#FCFAF4; --surface:#FFFFFF; --surface2:#F5F3EB; --ink:#1B2621; --muted:#5E6B64;
  --rule:#DEE3DD; --rule-soft:#EAEEE8; --head:#0F3D2E; --bar:#0F3D2E; --bar-ink:#F6F1E1;
  --gold:#96790F; --gold-line:#C9A227; --teal:#2F6F5E;
  --warn:#FAF0DC; --good:#E9F1EB; --bad:#F7E6DF;
  --pass:#2F6F5E; --thin:#96790F; --fail:#A4442A;
}
@media (prefers-color-scheme:dark){ :root:not([data-theme="light"]){
  --bg:#0E1310; --surface:#151C18; --surface2:#1B241E; --ink:#E6EDE7; --muted:#94A39A;
  --rule:#27322C; --rule-soft:#1E2722; --head:#CFE3D6; --bar:#0B2B20; --bar-ink:#EBE3CC;
  --gold:#D9B44A; --gold-line:#B4931F; --teal:#77BBA1;
  --warn:#2A2216; --good:#15231B; --bad:#2B1A15;
  --pass:#77BBA1; --thin:#D9B44A; --fail:#D98468;
}}
:root[data-theme="dark"]{
  --bg:#0E1310; --surface:#151C18; --surface2:#1B241E; --ink:#E6EDE7; --muted:#94A39A;
  --rule:#27322C; --rule-soft:#1E2722; --head:#CFE3D6; --bar:#0B2B20; --bar-ink:#EBE3CC;
  --gold:#D9B44A; --gold-line:#B4931F; --teal:#77BBA1;
  --warn:#2A2216; --good:#15231B; --bad:#2B1A15;
  --pass:#77BBA1; --thin:#D9B44A; --fail:#D98468;
}
*{box-sizing:border-box}
body{background:var(--bg);color:var(--ink);margin:0;
  font-family:"Source Serif 4",Georgia,"Times New Roman",serif;
  font-size:17px;line-height:1.62;-webkit-font-smoothing:antialiased}
h1,h2,h3,.eyebrow,.num,th,.chip,.masthead,.statk,nav{font-family:Archivo,"Helvetica Neue",Arial,sans-serif}
.masthead{background:var(--bar);color:var(--bar-ink);border-bottom:3px solid var(--gold-line)}
.masthead .in{max-width:1180px;margin:0 auto;padding:14px 28px;display:flex;flex-wrap:wrap;
  gap:14px;justify-content:space-between;align-items:baseline;font-size:12.5px;
  letter-spacing:.09em;text-transform:uppercase;font-weight:600}
.masthead .in span{opacity:.78;letter-spacing:.06em}
.wrap{max-width:1180px;margin:0 auto;padding:0 28px 96px;display:grid;gap:0 52px;
  grid-template-columns:1fr}
@media(min-width:1080px){.wrap{grid-template-columns:186px minmax(0,1fr)}}
nav.index{display:none}
@media(min-width:1080px){nav.index{display:block;position:sticky;top:26px;align-self:start;
  padding-top:56px;max-height:calc(100vh - 52px);overflow-y:auto}}
nav.index p{font-size:11px;letter-spacing:.13em;text-transform:uppercase;color:var(--muted);
  margin:0 0 12px;font-weight:600}
nav.index a{display:flex;gap:10px;text-decoration:none;color:var(--muted);font-size:12.5px;
  padding:3px 0;line-height:1.35}
nav.index a b{color:var(--gold);font-variant-numeric:tabular-nums;font-weight:600;min-width:18px}
nav.index a:hover,nav.index a:focus-visible{color:var(--ink)}
main{min-width:0;padding-top:52px}
.title{font-size:clamp(30px,4.6vw,46px);line-height:1.06;margin:0 0 14px;color:var(--head);
  font-weight:700;letter-spacing:-.02em;text-wrap:balance;max-width:19ch}
.sub{font-size:19px;color:var(--gold);font-style:italic;margin:0 0 40px;max-width:56ch}
.letter{border-top:2px solid var(--gold-line);border-bottom:1px solid var(--rule);
  padding:26px 0 22px;margin-bottom:16px}
.letter .to{font-family:Archivo,sans-serif;font-weight:700;font-size:14.5px;color:var(--head);
  margin:0 0 18px;letter-spacing:.01em}
.letter p{max-width:66ch}
.sig{font-family:Archivo,sans-serif;font-weight:700;color:var(--head);margin:26px 0 0;font-size:15px}
.sig span{display:block;font-weight:500;font-size:12.5px;color:var(--muted);letter-spacing:.04em}
.sec{padding:46px 0 6px;border-top:1px solid var(--rule-soft)}
.sec:first-of-type{border-top:none}
.sec-head{display:flex;gap:18px;align-items:flex-start;margin-bottom:20px}
.num{font-size:12px;font-weight:700;color:var(--gold);font-variant-numeric:tabular-nums;
  padding-top:7px;letter-spacing:.06em}
.eyebrow{font-size:11px;letter-spacing:.15em;text-transform:uppercase;color:var(--muted);
  margin:0 0 4px;font-weight:600}
h2{font-size:clamp(21px,2.5vw,27px);line-height:1.18;margin:0;color:var(--head);font-weight:700;
  letter-spacing:-.015em;text-wrap:balance}
.lede{margin:8px 0 0;color:var(--muted);font-size:16px;font-style:italic;max-width:54ch}
h3{font-family:Archivo,sans-serif;font-size:13px;letter-spacing:.1em;text-transform:uppercase;
  color:var(--teal);margin:34px 0 12px;font-weight:600}
p{margin:0 0 14px;max-width:70ch}
.note{font-size:13.5px;color:var(--muted);line-height:1.5;max-width:78ch}
.list{margin:0 0 16px;padding:0;list-style:none;display:flex;flex-direction:column;gap:12px}
.list.tight{gap:7px}
.list li{position:relative;padding-left:20px;max-width:70ch}
.list li::before{content:"";position:absolute;left:0;top:.62em;width:7px;height:7px;
  background:var(--gold-line)}
.card{background:var(--surface2);border-left:3px solid var(--gold-line);padding:17px 20px;
  margin:22px 0;font-size:16px;line-height:1.56}
.card.good{background:var(--good);border-left-color:var(--teal)}
.card.warn{background:var(--warn);border-left-color:var(--gold-line)}
.card p{margin:0 0 10px;max-width:66ch}.card p:last-child{margin:0}
.tw{overflow-x:auto;margin:18px 0 8px;border-top:2px solid var(--head)}
table{border-collapse:collapse;width:100%;font-size:14px;
  font-family:Archivo,"Helvetica Neue",sans-serif;line-height:1.42}
.tw.wide table{min-width:720px}
th{text-align:left;font-size:11px;letter-spacing:.08em;text-transform:uppercase;font-weight:600;
  color:var(--muted);padding:9px 12px 9px 0;border-bottom:1px solid var(--rule);vertical-align:bottom}
td{padding:10px 12px 10px 0;border-bottom:1px solid var(--rule-soft);vertical-align:top}
th:last-child,td:last-child{padding-right:0}
td.r,th.r{text-align:right;font-variant-numeric:tabular-nums;
  font-family:"IBM Plex Mono",ui-monospace,monospace;font-size:13px;white-space:nowrap}
tr.foot td{border-top:2px solid var(--gold-line);border-bottom:none;font-weight:600;
  background:var(--surface2)}
tbody tr:hover td{background:var(--surface2)}
tr.foot:hover td{background:var(--surface2)}
.chip{display:inline-block;font-size:10.5px;letter-spacing:.1em;font-weight:700;padding:2px 8px;
  border:1px solid currentColor}
.chip.pass{color:var(--pass)}.chip.thin{color:var(--thin)}.chip.fail{color:var(--fail)}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(158px,1fr));gap:1px;
  background:var(--rule);border:1px solid var(--rule);margin:26px 0 8px}
.stat{background:var(--surface);padding:16px 18px}
.statv{font-family:"IBM Plex Mono",monospace;font-size:25px;font-weight:500;color:var(--head);
  letter-spacing:-.02em;font-variant-numeric:tabular-nums;line-height:1.1}
.statk{font-size:11px;letter-spacing:.09em;text-transform:uppercase;color:var(--muted);
  margin-top:7px;font-weight:600;line-height:1.35}
.foot-rule{margin-top:56px;border-top:2px solid var(--gold-line);padding-top:18px;
  font-size:12.5px;color:var(--muted);letter-spacing:.04em;
  font-family:Archivo,sans-serif;display:flex;flex-wrap:wrap;gap:6px 22px}
a{color:var(--gold)}
:focus-visible{outline:2px solid var(--gold-line);outline-offset:3px}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
""")

w('<div class="masthead"><div class="in"><div>Solace Healthcare '
  '<span>&nbsp;/&nbsp; Games Village, Abuja</span></div>'
  '<div><span>Private and confidential &nbsp;/&nbsp; Prepared for Dr Oby Clems-Anunwa '
  '&nbsp;/&nbsp; 14 September 2026</span></div></div></div>')
w('<div class="wrap"><nav class="index" aria-label="Sections"><p>Contents</p>'
  '<!--INDEX--></nav><main>')

# ===================================================================== letter =
w('<h1 class="title">Five apartments, three phases, two years</h1>')
w('<p class="sub">Whether this site can carry a NGN 400 million a month healthcare business, '
  'what it would take, and what we would do with you.</p>')
w('<div class="letter"><p class="to">Dr Oby Clems-Anunwa, Promoter, Solace Healthcare</p>')
para(
    "Dr Oby, you asked whether five converted apartments near Games Village can become a "
    "healthcare business turning over NGN 400 million a month within two years. The answer is yes, "
    "in month %d." % CROSS,
    "A few things I want to put plainly before the detail.",
    "The target is reachable, but not from this site alone. The five units on their own reach "
    "NGN %s million in month 24 and do not cross NGN 400 million until month %d. A second "
    "diagnostic and clinic site, opened in month 22, closes the gap. It sits in Phase 3 on the "
    "plan. It has to be committed in Phase 1, because the lease and the fit-out take eight months."
    % (n(NS["rev"][24], 0), CROSS_NS),
    "Revenue is the wrong thing to manage here. About a fifth of what you are aiming at is cancer "
    "drug pass-through, and it earns roughly half what a scan earns on the same naira. I would "
    "hold you to NGN %s million of monthly earnings at month 24 rather than to the revenue figure."
    % n(EB24, 0),
    "The number that catches people is working capital. At that run rate you are carrying about "
    "NGN %s million of it, nearly all of it money owed to you. You buy the drugs for cash and bill "
    "payors who take between 38 and 135 days. Section 08 deals with it and nothing else."
    % n(B["nwc"][24], 0),
    "We stressed this ten ways. Demand can disappoint quite badly and the business survives. Two "
    "of the ten destroy value and both are construction. You can be %.0f per cent over budget. You "
    "can be %s months late. You cannot be both." % (100 * (BE_CAPEX - 1), DELAY_W),
    "One caution on the site. The last residential conversion we ran in Abuja came back from the "
    "measured survey %.0f per cent larger than the brief, and all of the extra was corridor, so "
    "the cost moved and the revenue did not. Until your five units are measured, every figure in "
    "here is an estimate, ours included. That survey costs about NGN %s million and I would spend "
    "it before anything else." % (100 * S.SURVEY_VARIANCE, n(S.CAPEX[0][0][1], 0)),
    "One correction to make early, because the pitch depends on it. The African Medical Centre of "
    "Excellence is under twenty minutes from your site and it does the whole cancer pathway "
    "properly, radiotherapy included. Do not build an argument that says nobody in Abuja does. "
    "Build the one underneath it. AMCE was priced against Chennai and Istanbul, which is the right "
    "position for them and leaves most of your catchment standing outside it.",
    "Last thing. You are a consultant family physician at a federal hospital. That will be read as "
    "a source of referrals. I read it as two advantages that are hard to buy. Cancer care here "
    "fails at the two ends family medicine owns, the front door where the diagnosis comes too late "
    "and afterwards where people are sent home with nothing, and neither of those is what a "
    "flagship centre wants to run. And you know how cancer drugs are actually sourced and priced in "
    "this country, which decides whether a private service can be affordable at all.",
)
w('<p class="sig">Debo Odulana<span>Founding Partner, Consult for Africa</span></p></div>')

# ===================================================================== 00 =====
sec("00", "The answer", "Yes, in month %d, on three conditions." % CROSS)
w('<div class="stats">')
for v, k in [("NGN %s m" % n(M24, 0), "Revenue, month 24"),
             ("NGN %s m" % n(EB24, 0), "Monthly earnings, month 24"),
             ("%.0f%%" % EB_PCT, "Earnings margin"),
             ("NGN %s bn" % n(MB["peak"] / 1000, 2), "Peak funding, month %d" % MB["trough_m"]),
             ("%.0f%%" % (100 * MB["irr"]), "Return over seven years"),
             ("Month %d" % MB["payback"], "Capital back")]:
    w('<div class="stat"><div class="statv">%s</div><div class="statk">%s</div></div>' % (v, k))
w("</div>")
note("Seven year monthly model, no terminal value counted, at a 25 per cent naira hurdle.")
table(["Question", "Answer", "Why"],
      [["Can the site reach NGN 400m a month inside two years?", "Yes, in month %d" % CROSS,
        "Only with the second site opened in month 22. Without it, month %d." % CROSS_NS],
       ["Is it worth doing?", "Yes",
        "%.0f per cent over seven years, NGN %s m of value at a 25 per cent naira hurdle."
        % (100 * MB["irr"], n(MB["npv"], 0))],
       ["What does it cost to build?", "NGN %s bn" % n(CAPEX_ALL / 1000, 2),
        "Across three phases, from the survey to the second site."],
       ["What do you actually need to fund?", "NGN %s bn" % n(MB["peak"] / 1000, 2),
        "Peaking in month %d. The extra NGN %s m over the build cost is working capital."
        % (MB["trough_m"], n(WC_GAP, 0))],
       ["When does the money come back?", "Month %d" % MB["payback"],
        "A six to seven year asset. Anyone selling you a three year payback on a cancer service "
        "is not counting the drugs."],
       ["What earns the most?", "The theatre",
        "Day surgery is the largest single source of profit. Oncology is the largest source of "
        "revenue. They are not the same thing."],
       ["Who are you competing with?", "Nobody directly",
        "AMCE is twenty minutes away and holds the top of this market. You take the people who "
        "cannot reach their prices, and you refer complexity up to them."],
       ["What breaks it?", "The conversion",
        "Not demand. Two of ten stress cases destroy value and both are construction."],
       ["What has to be decided now?", "The second site",
        "A Phase 3 asset that has to be committed in Phase 1, because the lease, the licence and "
        "the fit-out take eight months."]], wide=True)
card("<p><b>Three conditions.</b> Commit to the second site in Phase 1, not in Phase 3. Pre-fund "
     "systemic therapy from the first patient. Do not break ground until change of use is granted "
     "and the conversion is on a fixed price. Everything else in here is detail.</p>")
end()

# ===================================================================== 01 =====
sec("01", "The site", "What five apartments will become.")
para("We have assumed %d units, %s sqm gross, %s sqm net of circulation and plant. Those are "
     "planning figures and they are the weakest numbers in this document. Everything below is "
     "written to be re-run the week the survey lands."
     % (S.UNITS, n(S.GROSS_SQM, 0), n(S.NET_SQM, 0)))
table(["Unit", "Becomes", "What goes in it", "When"],
      [["A", "Front of house and clinics", "Reception, triage, nine consulting rooms, family "
        "medicine and visiting specialist sessions", "Phase 1"],
       ["B", "Diagnostics", "Laboratory and phlebotomy on the ground floor, imaging in a "
        "purpose-shielded ground bay, reporting above", "Phase 1"],
       ["C", "Cancer day unit", "Fourteen infusion chairs, two private bays, compounding clean "
        "room and isolator, oncology clinics, counselling", "Phase 1"],
       ["D", "Procedures", "Theatre one and endoscopy, recovery bays, sterile services. Theatre "
        "two and high dependency follow in Phase 2", "Phase 1 and 2"],
       ["E", "Living with it, and support", "Rehabilitation gymnasium, palliative day space, home "
        "care base, pharmacy, administration, plant", "Phase 1 and 2"]], wide=True)
w("<h3>Six things residential geometry will do to you</h3>")
ul(["<b>Corridors.</b> A residential corridor runs 900mm to 1.2m. A trolley needs 1.5m and a bed "
    "needs 2.1m with room to turn. Widening one means moving walls that are holding the floor "
    "above up. It is the largest single cost in the conversion and it earns you nothing.",
    "<b>Stairs.</b> A residential staircase will not take a stretcher. Anything above ground floor "
    "that a patient cannot walk out of needs a lift, and a lift in a finished building needs an "
    "external shaft on its own foundation. We have carried NGN %s m for it. That is why the beds "
    "are a Phase 2 item and not a Phase 1 one." % n(S.CAPEX[2][1][1], 0),
    "<b>Slabs.</b> A residential floor is designed for roughly 1.5 to 2.0 kN per square metre. A "
    "computed tomography gantry is a concentrated load and wants a ground bay, usually thickened. "
    "I do not know what your slab will take, and neither does anybody else until it is tested. If "
    "the answer is no, the scanner goes off site and the plan loses about NGN 29 million a month "
    "of its best margin revenue.",
    "<b>Drainage.</b> Bedrooms become consulting rooms easily. They do not become theatres. "
    "Theatre, sterile services and the compounding room need falls, dirty utility, and clean and "
    "dirty flows kept apart.",
    "<b>Power.</b> A residential three-phase service will not carry imaging, theatre and chillers "
    "together. Own transformer, synchronised generation, uninterruptible supply on the scanner. "
    "NGN %s m." % n(S.CAPEX[1][1][1], 0),
    "<b>Change of use.</b> Not a building problem. Your certificate of occupancy almost certainly "
    "says residential, development control has to agree otherwise, and neighbours in a residential "
    "estate are entitled to be heard. It is the longest item in the programme and it is lodged in "
    "week one."])
para("One practical thing this week. Ask whoever built the units for the as-built drawings and the "
     "structural calculations. If they do not exist, we should know that now rather than in "
     "month four.")
card("<p>Five houses give you daylight, domestic scale, gardens and privacy that a purpose-built "
     "hospital block cannot buy at any price. For somebody sitting through four hours of "
     "chemotherapy, and for the relative sitting with them, that is worth more than a grand lobby. "
     "Do not spend money making this look like a hospital.</p>", "good")
end()

# ===================================================================== 02 =====
sec("02", "The market", "The catchment is good. The gap is in cancer.")
para("Games Village, Apo, Apo Legislative Quarters, Gudu, Durumi, Lokogoma, Gaduwa, Kaura and "
     "Wuye. Salaried households, heavily weighted to the federal civil service and the "
     "legislature, largely insured through employer schemes, and accustomed to paying out of "
     "pocket for speed when the scheme is slow. The Central Business District and National "
     "Hospital are a short drive north.")
table(["Segment", "Who is in it", "What it means for you"],
      [["General and multi-specialty", "Cedarcrest, Kelina, Zenith Medical and Kidney Centre, Nisa "
        "Premier, Garki Hospital, Nizamiye, Primus, Alliance", "The cluster is well served. Do not "
        "compete here."],
       ["Public anchors", "National Hospital Abuja, the FCTA district hospitals",
        "The source of the consultant body, and of the referrals that matter."],
       ["Diagnostics", "Clina-Lancet, Synlab, Afriglobal, Me Cure, Union Diagnostics",
        "Strong on tests, absent on the pathway that turns a test into a decision."],
       ["Cancer care", "The African Medical Centre of Excellence, under twenty minutes away, plus "
        "a small number of private day units and the public radiotherapy capacity at National "
        "Hospital",
        "AMCE has taken the top of this market and taken it properly. The opening is underneath "
        "them, not against them."]], wide=True)
note("Treat the third column as our hypothesis, not as fact. Competitor positions move, and the "
     "first six weeks of work is to verify this on the ground rather than to assume it.")
w("<h3>The gap, which is not the one you will be offered</h3>")
para("There is a version of this pitch that says nobody in Abuja does cancer care end to end. It "
     "is not true and you should not use it. The African Medical Centre of Excellence sits under "
     "twenty minutes from your site, it is backed by Afreximbank, and it was built to do exactly "
     "that, including the radiotherapy you cannot put on this plot. It is a serious institution and "
     "it is not going anywhere.",
     "The real gap is underneath it. AMCE was built to stop Nigerians flying to India and Turkey, "
     "which means it is priced against Chennai and Istanbul rather than against Abuja. That is the "
     "correct position for them. It also leaves a very large number of people standing outside it.",
     "Those people are your market. A household in Apo or Lokogoma with an employer scheme that "
     "caps oncology, a salary, some savings, and a relative abroad who can send something but not "
     "everything. Today they assemble their care across three or four places, or they start a "
     "treatment plan and stop when the money does. A woman who finds a breast lump will typically "
     "spend between four and ten weeks and visit three separate places before anybody tells her "
     "what it is, and by then the disease has often moved a stage. Nobody in this city is organised "
     "around her.",
     "There is a second gap and it has nothing to do with price. A quaternary centre is not a front "
     "door. Screening, family medicine, survivorship follow-up and home palliative care are not "
     "what a flagship does well, and not what it wants its capacity used for. Those are the two "
     "ends of the journey, and they are the ends you own by training.")
w("<h3>Where you would price, and why you can sit there</h3>")
para("Price the diagnostic pathway and standard systemic therapy at roughly half the flagship "
     "tariff. We would price-shop AMCE and two others properly in the first six weeks and set the "
     "exact ratio then. Half is the working number, and the tariff behind Section 04 is already "
     "built at that level, so nothing in this model depends on charging flagship prices.")
ul(["Your capital base. NGN %s billion across three phases, against a purpose-built quaternary "
    "hospital. Financing and depreciation per patient episode is a different order of number."
    % n(CAPEX_ALL / 1000, 2),
    "No beds at all in Phase 1, and twenty of them in Phase 2 rather than hundreds. Beds carry "
    "night nursing, catering and twenty four hour everything. Day case work does not.",
    "A visiting consultant panel paid per session and per case, instead of a salaried quaternary "
    "establishment.",
    "Reporting, the reference laboratory and the scanner itself on managed contracts, so your "
    "fixed cost per study stays low while volume is still building.",
    "Drug sourcing, which is the next section and the largest of these.",
    "No radiotherapy, no transplant and no quaternary surgery to carry. You refer those up, and "
    "you should."])
card("<p>Do not position this against AMCE. Position it underneath them, and alongside them. They "
     "will have patients who need systemic therapy closer to home, follow-up, rehabilitation and "
     "palliative care, and none of that is what a flagship wants its theatres and bunkers used "
     "for. A referral relationship running both ways is worth more to you than a rivalry, and it "
     "is available precisely because you are not trying to take their work.</p>", "good")
end()


# ===================================================================== 03 =====
sec("03", "The strategy", "Own the whole journey.")
table(["Stage", "What it is", "Who owns it in Abuja today", "Who owns it at Solace"],
      [["The front door", "Where the symptom is first seen", "A general practice, late",
        "Family medicine, screening, corporate schemes"],
       ["The answer", "Imaging, biopsy, pathology, a named diagnosis",
        "Three sites and four to ten weeks, or the flagship at flagship prices",
        "One site, 48 hours, a plan in seven days"],
       ["The treatment", "Surgery, systemic therapy, radiotherapy",
        "AMCE for those who can pay it, otherwise a hospital that does not know the patient",
        "Day unit and theatre at half the tariff, one record"],
       ["Living with it", "Rehabilitation, lymphoedema, nutrition, mental health",
        "Largely absent at any price", "Rehabilitation and survivorship built in from Phase 1"],
       ["Going home", "Palliative care, pain control, family support",
        "The patient is discharged and disappears",
        "Home based care with a controlled drug licence"]], wide=True)
w("<h3>The promise</h3>")
card("<p><b>A diagnosis in 48 hours. A plan in seven days.</b></p><p>Published, measured and "
     "reported every month. It is the thing every referring doctor in this city wants and cannot "
     "get. It is also the only claim a new facility can make honestly on day one, because it "
     "depends on how you are organised rather than on how long you have been open.</p>")
w("<h3>Why you are the right promoter, which is not the reason people will give you</h3>")
para("You will be told your value is referrals from colleagues at National Hospital. That is true "
     "and it is the smaller half of it.",
     "Family medicine is the only specialty trained to hold a whole person over time rather than "
     "one organ at one moment. What fails in Nigerian cancer care is not a shortage of "
     "oncologists. It is that nobody owns the patient in between the specialists. A cancer service "
     "with a family medicine front door and a home care back door is a different thing from a "
     "hospital that treats cancer, and it is harder for a specialist-founded competitor to copy "
     "than a machine is.")
w("<h3>Your second advantage, which may be worth more than the first</h3>")
para("You know how cancer drugs are actually sourced and priced in this country. A private facility "
     "starting cold buys from whichever distributor quotes it. You know which regimens sit on "
     "manufacturer access programmes, which biosimilars are quality assured and accepted here, what "
     "the federal schemes cover and how a patient is actually enrolled onto them, and roughly what "
     "a cycle should cost before anybody marks it up.",
     "Drugs are about two thirds of the cost of your largest revenue line, which is why this "
     "matters more than it sounds. If access programme sourcing lands and that ratio moves from 66 "
     "to %.0f per cent, month 24 earnings go from NGN %s m to NGN %s m, the margin goes from %.0f "
     "to %.0f per cent, and the seven year value rises by NGN %s m. Nobody else opening a cancer "
     "service in Abuja this year starts with that knowledge, and it is what makes a price position "
     "at half the flagship tariff something you can hold rather than something you announce."
     % (100 * S.ONCO_DCR_GOOD, n(EB24, 0), n(UP["ebitda"][24], 0), EB_PCT,
        100 * UP["ebitda"][24] / UP["rev"][24], n(MUP["npv"] - MB["npv"], 0)))
card("<p>One line to draw now, and to draw in writing. Nothing procured under a public "
     "institution's programme moves to a private facility. The advantage here is knowing the "
     "pathways and enrolling your own patients onto them directly. It is not access to anybody "
     "else's stock. Put that in the conflict of interest policy in Section 12 alongside the "
     "referral rules, and put it there before anybody has to ask you about it.</p>", "warn")
w("<h3>On new buildings</h3>")
para("You are right that people like new facilities. Newness is worth nine to twelve months and "
     "then it is gone, and what is left is whether you answered the phone.")
ul(["Publish your time to appointment, time to result and time to treatment every month, and put "
    "them on the wall in reception. Nobody else in Abuja will.",
    "Give every patient one named person who owns their journey, whose number the family has, and "
    "who is measured on whether anybody got lost. It is cheap and hardly anyone buys it.",
    "Daylight, a chair a relative can sit in, a garden, food, wifi. Your building gives you this "
    "for nothing."])
end()

# ===================================================================== 04 =====
sec("04", "The service mix", "Ten lines, and which of them actually pay.")
rows = []
for name, opens, steady, hl, d, ph in S.LINES:
    v = steady * S.maturity(24, opens, hl)
    rows.append([name, "%d" % opens, n(steady), n(v), "%.0f%%" % (100 * v / M24),
                 "%.0f%%" % (100 * (1 - d)), "%.0f%%" % (100 * v * (1 - d) / CONTRIB24)])
rows.append(["Total", "", n(sum(s for _a, _b, s, _c, _d, _e in S.LINES)), n(M24), "100%",
             "%.0f%%" % CONTRIB_PCT, "100%"])
table(["Service line", "Opens", "At maturity", "Month 24", "Share of revenue",
       "Margin after direct cost", "Share of profit"], rows,
      align=[1, 2, 3, 4, 5, 6], foot=True, wide=True)
note("Revenue in NGN millions a month. Maturity is what the line earns once the ramp is complete, "
     "which for most lines is around month 36.")
para("Read the last two columns together. Oncology is %.0f per cent of the revenue and %.0f per "
     "cent of the profit. Radiology is %.0f per cent of the revenue and %.0f per cent of the "
     "profit, the same relationship the other way round, and day surgery is the largest single "
     "source of profit in the plan. The cancer service is what brings people to you and what the "
     "place will be known for. The theatre and the scanner are what pay for the building."
     % (100 * ONCO24 / M24, 100 * ONCO24 * 0.34 / CONTRIB24,
        100 * RAD24 / M24, 100 * RAD24 * 0.66 / CONTRIB24))
w("<h3>What each line assumes</h3>")
table(["Line", "Volume assumption", "Note"], [[a, b, c] for a, b, c in S.DRIVERS], wide=True)
end()

# ===================================================================== 05 =====
sec("05", "The payors", "Who pays, and how long they take.")
notes = ["Cancer care in Nigeria is largely self-funded, and a large share of that is funded by "
         "family abroad. Collect from them in their own currency.",
         "Corporate schemes, mission and embassy accounts, retainers. Predictable and the quiet "
         "win. Family medicine sells these.",
         "Most private plans cap or exclude systemic cancer therapy. Useful for clinics, imaging "
         "and day surgery. Dangerous if it grows.",
         "Formal sector lives, the Cancer Health Fund and the vulnerable group fund. Real money, "
         "slow money. Budget it as slow.",
         "Manufacturer access programmes and charitable funds. Small, and they lock referrals."]
table(["Payor", "Share", "Days to cash", "NGN m at month 24", "What it is and what it is for"],
      [[nm, "%.0f%%" % (100 * s), "%d" % d, n(M24 * s), nt]
       for (nm, s, d), nt in zip(S.PAYORS, notes)]
      + [["Blended", "100%", "%.0f" % S.DSO, n(M24), "Days to cash, weighted by share."]],
      align=[1, 2, 3], foot=True, wide=True)
w("<h3>Six rules I would write into the operating model on day one</h3>")
ul(["<b>Systemic cancer therapy is pre-authorised and pre-funded before cycle one. No exceptions "
    "and no goodwill starts.</b> This one rule protects your largest revenue line and most of your "
    "cash cycle. It will feel hard the first time you enforce it on somebody you know. Enforce it "
    "anyway.",
    "Do not chase scheme volume to look busy. If the health maintenance organisation share drifts "
    "from %.0f to 40 per cent your returns barely move, but your peak funding requirement rises by "
    "NGN %s million. It will not show up in any month's profit. It shows up as a call for cash "
    "nobody planned for." % (100 * S.PAYORS[2][1], n(MDR["peak"] - MB["peak"], 0)),
    "Build the foreign currency rail early. A great deal of cancer treatment in this country is "
    "paid for by a son or a daughter abroad, and a compliant way for them to pay in sterling or "
    "dollars turns an 82 day receivable into a same day one.",
    "Get onto the manufacturer access programmes in Phase 1, before you need them. They lower the "
    "price the patient sees and they cost you nothing but paperwork.",
    "Apply for Cancer Health Fund designation. Do not spend the money until it arrives.",
    "Weekly claims cycle, seven day submission, and a hard stop on new elective work for any payor "
    "past ninety days. Put the stop in the contract at signature. It is unenforceable once they "
    "are already late."])
end()

# ===================================================================== 06 =====
sec("06", "The three phases", "What opens when, and the decision inside each phase.")
table(["Phase", "When", "What it is", "What opens", "Capex NGN m", "Revenue at close"],
      [["Phase 1", "Months 1 to %d" % S.OPEN_P1, "Day case and ambulatory",
        "Clinics, laboratory, imaging, cancer day unit, theatre one, endoscopy, rehabilitation, "
        "palliative day service and home care",
        n(S.CAPEX_TOTAL[0] + S.CAPEX_TOTAL[1], 0), n(B["rev"][12], 0)],
       ["Phase 2", "Months 10 to %d" % S.OPEN_P2, "Inpatient, at half capacity",
        "Twenty beds including three high dependency and four ring-fenced for palliative "
        "admissions, theatre two, bed lift and stretcher-capable circulation",
        n(S.CAPEX_TOTAL[2], 0), n(B["rev"][18], 0)],
       ["Phase 3", "Months 18 to 27", "Centre of excellence, and the second site",
        "Accreditation, outcomes registry, tumour board with external faculty, training post "
        "recognition, trials capability, and a leased diagnostic and clinic spoke",
        n(S.CAPEX_TOTAL[3], 0), n(B["rev"][24], 0)]], align=[4, 5], wide=True)
w("<h3>The decision inside each phase</h3>")
ul(["<b>Phase 1 is a licensing race.</b> The fit-out will finish before the consents do unless the "
    "consents start first. Change of use, radiation authorisation and the controlled drug licence "
    "all go in inside the first ninety days, including the drug licence for a palliative service "
    "that does not open until month 12. Palliative care without morphine is not palliative care, "
    "and that permit is slow.",
    "<b>Phase 2 is a circulation problem, not a bed problem.</b> The beds are easy. The lift, the "
    "shaft and the corridor widths are the project. Design them in Phase 1 even though you build "
    "them in Phase 2. Retrofitting a shaft into a finished building costs about twice what "
    "designing it in costs.",
    "<b>Phase 3 contains the decision you have to take first.</b> The second site takes eight "
    "months from decision to opening, so a month 22 opening is a month 14 decision at the latest "
    "and the search starts in Phase 1. It is worth NGN %s million of value for NGN %s million of "
    "capital, and it is what puts NGN 400 million a month inside two years rather than four months "
    "outside." % (n(MB["npv"] - MNS["npv"], 0), n(S.SPOKE_CAPEX, 0))])
card("<p><b>On the centre of excellence.</b> It is not a building and you cannot buy it. It is "
     "four things: published outcomes, a tumour board that senior people want to attend, "
     "accreditation an insurer recognises, and a training post the postgraduate college has "
     "approved. The last of those is the strongest consultant magnet in Nigerian medicine and "
     "hardly anyone in the private sector goes after it.</p>"
     "<p><b>And on radiotherapy, since you will be asked.</b> Do not put a linear accelerator on "
     "this site. A bunker needs two to three metres of concrete, deep excavation and a nuclear "
     "regulatory licence, and a converted residential plot will not carry it. Partner for "
     "radiotherapy in Phase 3 and put the bunker on a second site later, if at all.</p>", "good")
end()

# ===================================================================== 07 =====
sec("07", "The money", "Seven years, monthly, with no terminal value counted.")
yr = []
for y in range(1, 8):
    a, b = (y - 1) * 12 + 1, y * 12
    r, e = sum(B["rev"][a:b + 1]), sum(B["ebitda"][a:b + 1])
    yr.append(["Year %d" % y, n(r, 0), n(e, 0), "%.0f%%" % (100 * e / max(r, 1e-9)),
               n(sum(B["capex"][a:b + 1]), 0), n(B["cum"][b], 0)])
table(["", "Revenue", "Earnings before interest, tax and depreciation", "Margin", "Capital spend",
       "Cumulative cash"], yr, align=[1, 2, 3, 4, 5], wide=True)
note("NGN millions. Earnings are before the cost of any borrowing and before tax. Capital "
     "allowances on NGN %s bn of spend will shelter tax well into year three, and a pioneer status "
     "application is worth making." % n(CAPEX_ALL / 1000, 2))
w("<h3>Month 24, line by line</h3>")
table(["Month 24", "NGN m", ""],
      [["Revenue", n(M24), "The number you asked for."],
       ["Direct clinical cost", "(%s)" % n(B["direct"][24]),
        "Drugs, consumables, reagents, reporting fees, procedure-linked staff cost."],
       ["Contribution", n(CONTRIB24),
        "%.0f per cent. This is the number to manage." % CONTRIB_PCT],
       ["Fixed operating cost", "(%s)" % n(B["ovh"][24]),
        "Establishment, power, estate, service contracts, marketing, insurance, administration."],
       ["Earnings", n(EB24), "%.0f per cent margin, annualising at about NGN %s m."
        % (EB_PCT, n(EB24 * 12, 0))]], align=[1], foot=True)
w("<h3>What you have to fund, which is not the same as what you spend</h3>")
table(["", "NGN m"],
      [["Capital spend across all three phases", n(CAPEX_ALL, 0)],
       ["Losses before the site trades profitably",
        n(-sum(min(0, B["ebitda"][t]) for t in range(1, 85)), 0)],
       ["Working capital at its peak", n(max(B["nwc"]), 0)],
       ["Our fees across 27 months", n(FEE_NET, 0)],
       ["Peak funding requirement, month %d" % MB["trough_m"], n(MB["peak"], 0)]],
      align=[1], foot=True)
note("The lines above do not sum to the total, because revenue offsets some of them as they "
     "occur. The total is taken from the monthly cash model, which is the only place this number "
     "is reliable.")
card("<p><b>The headline build cost is NGN %s billion. The money you have to have available is "
     "NGN %s billion.</b> The gap of NGN %s million is working capital, and it is the number that "
     "catches promoters, because no equipment quotation ever mentions it. Raise against the peak, "
     "not against the build.</p>"
     % (n(CAPEX_ALL / 1000, 2), n(MB["peak"] / 1000, 2), n(WC_GAP, 0)), "warn")
end()

# ===================================================================== 08 =====
sec("08", "Working capital", "The number that is larger than your scanner.")
para("At month 24 you are carrying NGN %s million of working capital, of which NGN %s million is "
     "money owed to you. You will have bought the cancer drugs for cash, or on thirty days, and "
     "billed them to payors who take between 38 and 135 days. Nothing about this appears in a "
     "profit statement. It appears as a bank balance that never recovers."
     % (n(B["nwc"][24], 0), n(RECV24, 0)))
table(["", "NGN m", ""],
      [["Money owed to you", n(RECV24, 0),
        "%.0f days of revenue, weighted by payor" % S.DSO],
       ["Stock held", n(B["direct"][24] * S.DIO / S.DAYS, 0),
        "%d days, and it is expensive stock" % S.DIO],
       ["Money you owe suppliers", "(%s)" % n(B["direct"][24] * S.DPO / S.DAYS, 0),
        "%d days, which is what the drug trade gives" % S.DPO],
       ["Net working capital at month 24", n(B["nwc"][24], 0), ""]], align=[1], foot=True)
w("<h3>Six levers, and what each releases</h3>")
table(["Lever", "What it releases", "How it works"],
      [["Managed equipment service on the scanner", "About NGN 320m of capital",
        "A vendor places the machine and takes a share of each scan. You give up margin per study "
        "and you keep the cash. At this stage of the business that is the right trade."],
       ["Reagent rental on the laboratory", "About NGN 95m",
        "The analyser arrives against a reagent commitment rather than a purchase order. Standard, "
        "and every major supplier will do it."],
       ["Consignment stock on high cost biologics", "About NGN 120m",
        "The distributor keeps title until the drug goes into the patient. Harder to negotiate, "
        "worth the effort, and easier once you have twelve months of volume to show."],
       ["Pre-funding systemic therapy", "Holds days to cash at plan",
        "The discipline rule from Section 05. It is worth more than all the financing you could "
        "raise."],
       ["Foreign currency collection from families abroad", "Converts 82 days to same day",
        "On the share of oncology paid from overseas, which is not small."],
       ["Weekly claims cycle and a ninety day stop", "Protects against drift",
        "Contractual, agreed at signature, enforced without discussion."]], wide=True)
end()

# ===================================================================== 09 =====
sec("09", "What breaks it", "Ten ways this goes wrong. Two of them matter.")
rows = []
for lbl, kw in S.STRESS:
    MM = S.build(**kw)
    me = S.metrics(MM)
    v = "PASS" if me["npv"] > 250 else ("FAIL" if me["npv"] < 0 else "THIN")
    rows.append([lbl, n(MM["rev"][24], 0), n(MM["ebitda"][24], 0), n(me["npv"], 0),
                 n(me["peak"], 0), "%s" % (S.crosses(MM) or "never"), v])
table(["Case", "Revenue m24", "Earnings m24", "Value", "Peak funding", "NGN 400m in month",
       "Verdict"], rows, align=[1, 2, 3, 4, 5], chips=6, wide=True)
note("Value is net present value in NGN millions at a 25 per cent naira hurdle over seven years, "
     "with no terminal value. PASS is comfortably positive, THIN is positive but not by enough to "
     "be worth the trouble, FAIL destroys value.")
w("<h3>How much room you actually have</h3>")
table(["Assumption", "Breaks even at", "Comment"],
      [["Conversion cost", "%.0f per cent over budget" % (100 * (BE_CAPEX - 1)),
        "Real, and thinner than it looks once a delay is stacked on top of it"],
       ["Programme schedule", "%d months late" % BE_DELAY,
        "Generous, because the ramp is slow anyway"],
       ["Days to cash", "%.0f days, against %.0f planned" % (BE_DSO, S.DSO),
        "Very wide. Payor drift is a funding problem, not a returns problem"],
       ["Oncology volume", "%.0f patients a month, against 85 planned" % BE_ONCO,
        "Wide. You would have to miss by more than half"],
       ["Theatre volume", "%.0f cases a month, against 80 planned" % BE_SURG,
        "Tighter, because the theatre carries the profit"]], wide=True)
card("<p>Demand can disappoint quite badly and this still works. Construction cannot. You can be "
     "%.0f per cent over budget, or %s months late, and survive either one on its own. The case "
     "that destroys value is both at once, and that is the ordinary way a Nigerian conversion goes "
     "wrong. It is why the survey, the design and a fixed price conversion contract come before "
     "everything else, and most of the reason Phase 0 exists.</p>"
     % (100 * (BE_CAPEX - 1), DELAY_W), "warn")
end()

# ===================================================================== 10 =====
sec("10", "The critical path", "The consents, and when each one is lodged.")
table(["Consent", "Who grants it", "Lodge by", "What it blocks"],
      [["Change of use, residential to health institution", "Development control, AMMC and the FCDA",
        "Week 1", "Everything. Nothing is safe to build until this is granted"],
       ["Private health facility registration and annual licence",
        "FCT Health and Human Services Secretariat", "Month 3",
        "Opening. Separate categories for the hospital, the diagnostic centre and the laboratory"],
       ["Radiation authorisation: siting, shielding design, source",
        "Nigerian Nuclear Regulatory Authority", "At design, month 2",
        "All imaging. Shielding is designed in, never retrofitted"],
       ["Pharmacy premises and cytotoxic compounding unit", "Pharmacists Council of Nigeria",
        "Month 3", "The cancer day unit. A superintendent pharmacist is a condition, not a "
        "preference"],
       ["Controlled drug licence for opioid analgesia",
        "Federal Ministry of Health and the drug enforcement agency", "Month 3",
        "Palliative care, which opens in month 12. Slow, so lodge it nine months early"],
       ["Laboratory registration", "Medical Laboratory Science Council of Nigeria", "Month 4",
        "The laboratory, and any accreditation an insurer will recognise"],
       ["Practitioner registration and practising licences", "Medical and Dental Council of Nigeria",
        "Month 5", "Every doctor on the panel, checked at credentialing and again annually"],
       ["Provider accreditation", "NHIA, then each scheme separately", "Month 6",
        "Insured revenue. Each health maintenance organisation panel is its own application"],
       ["Data controller registration and a data protection officer",
        "Nigeria Data Protection Commission", "Month 5",
        "Lawful processing. A health facility is a controller of major importance under the 2023 "
        "Act, and this is routinely missed"],
       ["Fire safety, environmental consent, licensed clinical waste contractor", "FCT authorities",
        "Month 6", "Occupation and inspection"],
       ["Corporate: companies registry, tax registrations, pension and statutory schemes",
        "CAC, FIRS, FCT-IRS", "Week 2", "Contracting, banking and payroll"]], wide=True)
card("<p><b>Three of these are routinely discovered late, and all three are expensive.</b> Change "
     "of use, because people assume a title deed settles it. Radiation shielding, because it is "
     "treated as a supplier's problem rather than a design input. The opioid licence, because the "
     "palliative service is not opening for a year and it does not feel urgent in month three. "
     "It is.</p>")
end()

# ===================================================================== 11 =====
sec("11", "Outsourcing", "You were right to want it. Here is where the line sits.")
card("<p>Outsource anything that is a cost centre with a mature supplier market and a service "
     "level you can measure. Keep anything that is a source of referral, of margin, or of "
     "reputation. Most people get this backwards and outsource the things patients can feel.</p>")
w("<h3>Outsource</h3>")
table(["What", "Why it is safe to let go"],
      [["Reference laboratory, molecular and immunohistochemistry",
        "Keep a rapid laboratory in house for anything that changes today's decision. Send the "
        "rest out and mark it up."],
       ["Radiology reporting", "Sub-specialty and overnight reporting, including from consultants "
        "abroad. You keep the scanner and the patient. Somebody else keeps the rota problem."],
       ["Imaging equipment itself", "A managed service or concession puts the scanner in without "
        "the capital. This is the single largest cash saving available to you."],
       ["Estate, security, cleaning, laundry, catering, clinical waste",
        "Mature market, clear service levels. Buy clinical grade cleaning specifically, not "
        "general office cleaning."],
       ["Records system and software", "Buy it, do not build it. There is no prize for owning code."],
       ["Payroll, non-clinical human resources, locum supply",
        "Administrative load with no clinical consequence."],
       ["Biomedical engineering and medical gases", "Contract with response times written in."],
       ["Ambulance and retrieval beyond your own vehicle", "Partner rather than own a fleet."],
       ["Claims chasing labour", "On a collection fee. Outsource the chasing. Never outsource the "
        "decision about who to chase."]], wide=True)
w("<h3>Keep, whatever the saving looks like</h3>")
table(["What", "Why"],
      [["The patient record, the booking system and the data",
        "Whoever holds the record holds the relationship. This is the asset."],
       ["The consultant relationships and the credentialing",
        "This is the business. It cannot be delegated to an agency."],
       ["The tumour board and every treatment decision",
        "Your clinical reputation is made here and it is the only thing competitors cannot buy."],
       ["Control of the revenue cycle",
        "Outsource the labour if you like. Keep the pricing, the payor selection and the write-off "
        "authority."],
       ["Sterile services for your own theatre",
        "Small footprint, and a day case list dies when instruments arrive late."],
       ["The care coordinator",
        "The one role that delivers the 48 hour promise. Never a contractor."]], wide=True)
end()

# ===================================================================== 12 =====
sec("12", "The consultant question", "Your colleagues are the asset and the trap.")
para("Your access to the consultant body at National Hospital gives you a specialist roster on day "
     "one without a full-time salary bill. It is worth more than any equipment on your list. It is "
     "also the most common way a doctor-owned Nigerian hospital destroys itself, and the mechanism "
     "is always the same: equity given as thanks.")
table(["Tier", "Who", "How it is structured"],
      [["The owners", "You and at most two to four aligned partners",
        "A proper shareholders' agreement. Reserved matters, drag and tag, pre-emption, vesting on "
        "anyone who is also working in the business, and a fair valuation mechanism on exit. Small "
        "enough that decisions can be made in a room."],
       ["The panel", "As wide as you can credential",
        "Not shareholders. Paid properly on a published tariff, per session or per case, with an "
        "attendance commitment, a credentialing file, and privileges reviewed every year. Wide, "
        "generous, and entirely separate from ownership."],
       ["The founding scheme", "A capped pool, 8 to 12 per cent, earned not given",
        "Allocated annually against measurable contribution: cases performed, sessions kept, "
        "tumour board attendance, patients referred. Reviewed each year. It rewards behaviour that "
        "continues rather than enthusiasm that was present at the beginning."]], wide=True)
w("<h3>The conflict of interest policy, written before the first patient</h3>")
para("You hold a public appointment and you will have an interest in a private facility. That is "
     "lawful and it is ordinary. It becomes a problem only when it is undocumented. Write the "
     "policy now, while it is theoretical and nobody is defensive about it.")
ul(["Every referring clinician with an ownership interest discloses it to the patient, in writing, "
    "and the disclosure goes in the record.",
    "Patient choice is offered and documented. Always a named alternative, never a gesture.",
    "No payment, no commission and no benefit in kind for a referral. Ever, and from anyone.",
    "Panel appointments are made on credentials by a committee, not by the promoter alone.",
    "Nothing procured under a public institution's programme, at any price, moves to this "
    "facility. Enrol your own patients onto access programmes directly, in Solace's name.",
    "The policy is published on the wall and on the website, which protects you far better than "
    "keeping it in a drawer does."], tight=True)
card("<p><b>Say the hard part out loud now.</b> Several of the colleagues who help you open this "
     "will expect equity, and some will expect it without having done anything measurable. The "
     "kindest moment to explain the founding scheme is before anyone has assumed otherwise. The "
     "cruellest is at the first valuation.</p>", "warn")
end()

# ===================================================================== 13 =====
sec("13", "How this fails", "Five ways. I have watched all of them.")
table(["Failure mode", "What it looks like", "What prevents it"],
      [["Building before consenting",
        "Work starts because the site is there and the contractor is available. Change of use is "
        "refused, or granted with conditions that force a redesign of work already done.",
        "Lodge in week one. Do not mobilise a contractor before it is granted."],
       ["Buying equipment before designing the service",
        "A scanner is bought because a good price appeared, and then sited where it cannot be "
        "serviced, shielded or fed with clean power.",
        "Service model first, room data sheets second, purchase orders third. In that order, "
        "without exception."],
       ["Equity as a thank you",
        "Twenty well-meaning colleagues hold five per cent each. Nobody is accountable, nobody can "
        "be removed, and the first hard decision cannot be taken.",
        "Two tiers. A small owner group and a wide paid panel. Section 12."],
       ["Chasing insured volume to look busy",
        "The waiting room fills, the revenue line rises, and the bank balance falls for eleven "
        "straight months.",
        "Pre-fund systemic therapy, cap the scheme share, and stop new elective work at ninety "
        "days."],
       ["The founder as clinician and chief executive at once",
        "The clinic fills because the promoter is good at medicine. The business does not get run, "
        "because nobody is running it.",
        "Hire a chief operating officer before opening, not after the first crisis. You are the "
        "clinical leader and the face. That is a full job."]], wide=True)
end()

# ===================================================================== 14 =====
sec("14", "What we would do", "Twenty one workstreams over 27 months.")
para("We build and run health businesses in Nigeria. We have converted a residential building into "
     "a clinical one in this city, structured medical joint ventures and shareholder agreements, "
     "taken facilities through licensing, built payor and tariff strategies, and recruited "
     "consultants, including from the diaspora. This is the work we do most of.")
for ph, nm, when in [(0, "Phase 0: mobilisation and the bankable case", "Weeks 1 to 12"),
                     (1, "Phase 1: delivering the day case facility", "Months 3 to 11"),
                     (2, "Phase 2: opening inpatient capacity", "Months 10 to 18"),
                     (3, "Phase 3: centre of excellence and the second site", "Months 18 to 27")]:
    ws = [(x, d) for p_, x, d in S.WORK if p_ == ph]
    w("<h3>%s <span style='color:var(--muted);letter-spacing:.04em'>&nbsp;%s</span></h3>" % (nm, when))
    table(["Workstream", "Days", "NGN m"],
          [[x, "%d" % sum(d), n(sum(dd * S.RATES[g] for dd, g in zip(d, S.GRADES)) / 1000)]
           for x, d in ws]
          + [["Total", "%d" % sum(sum(d) for _x, d in ws), n(FEE_G[ph])]],
          align=[1, 2], foot=True)
w("<h3>What each phase actually produces</h3>")
table(["Phase", "What you have at the end of it"],
      [["Phase 0", "A measured survey and a structural verdict on the scanner bay. A verified "
        "catchment and competitor map. A clinical service model with room data sheets. A tariff "
        "and payor strategy. A monthly financial model you own. Consents lodged. A shareholders' "
        "agreement and a consultant panel structure."],
       ["Phase 1", "Design managed to tender and to a fixed price. Equipment procured, with "
        "managed service negotiated where it saves capital. Licences granted. The clinical and "
        "management team recruited, credentialed and inducted. Payor contracts signed and a "
        "revenue cycle that works on day one. A commissioned, licensed, open facility."],
       ["Phase 2", "Inpatient and theatre two delivered. The workforce stepped up for night and "
        "weekend cover. Working capital and payor performance under weekly management, which is "
        "the phase where most facilities quietly lose control of it."],
       ["Phase 3", "Accreditation achieved. An outcomes registry and a tumour board that people "
        "attend. A training post application lodged with the postgraduate college. The second site "
        "sited, leased, fitted and open. A group structure and an investment case, if you decide "
        "to raise."]], wide=True)
end()

# ===================================================================== 15 =====
sec("15", "What it costs", "Resourced days at our published rates.")
para("We price setup and delivery work as the time it actually takes, at published rates, rather "
     "than as a percentage of what you spend. You can see the effort, and if a workstream is "
     "deprioritised it comes straight off the fee.")
table(["Grade", "Days", "Day rate NGN m", "NGN m"],
      [[g, "%d" % GRADE_DAYS[g], n(S.RATES[g] / 1000, 3), n(GRADE_DAYS[g] * S.RATES[g] / 1000)]
       for g in S.GRADES]
      + [["Total", "%d" % TOTAL_DAYS, "", n(FEE_GROSS)]], align=[1, 2, 3], foot=True)
table(["", "At rate card NGN m", "Programme rate NGN m", "When"],
      [["Phase 0: mobilisation and the bankable case", n(FEE_G[0]), n(FEE_N[0]), "Weeks 1 to 12"],
       ["Phase 1: delivering the day case facility", n(FEE_G[1]), n(FEE_N[1]), "Months 3 to 11"],
       ["Phase 2: opening inpatient capacity", n(FEE_G[2]), n(FEE_N[2]), "Months 10 to 18"],
       ["Phase 3: centre of excellence and second site", n(FEE_G[3]), n(FEE_N[3]),
        "Months 18 to 27"],
       ["Total across 27 months", n(FEE_GROSS), n(FEE_NET), "%d resourced days" % TOTAL_DAYS]],
      align=[1, 2], foot=True, wide=True)
w("<h3>How it is paid, and what is not in it</h3>")
ul(["<b>One programme rate of %.0f per cent</b> because these are one continuous mandate rather "
    "than four separate engagements. It is applied above." % (100 * S.PROGRAMME_RATE),
    "<b>Mobilisation of NGN %s million on signature</b>, non-refundable and credited in full "
    "against Phase 0." % n(S.MOBILISATION, 0),
    "<b>Billed monthly against timesheets and capped at the figures above</b>, so you never pay "
    "for a day that was not worked.",
    "<b>Third party consultants pass through at cost with no mark-up.</b> Architect, structural "
    "and services engineers, quantity surveyor, radiation physicist. We will not earn on their "
    "invoices.",
    "<b>Travel and disbursements at cost</b>, agreed in advance above NGN 500,000.",
    "<b>What is not in this fee:</b> running the business once it opens. Twenty-seven months of "
    "setup can sensibly be billed by the day. Operating a hospital for seven years cannot. That "
    "sits on a separate arrangement, and it is in the next section so that you can approve the "
    "setup programme without reopening it."])
end()

# ===================================================================== 16 =====
sec("16", "If you want us to run it", "A separate decision, and one you can take later.")
para("Everything before this section assumes you build your own management team and we advise you. "
     "The alternative is that we build it and then run it for you, which is a different mandate "
     "with a different fee. You do not have to decide now. You should know the shape of it before "
     "you commit to the programme, because it changes what we recruit in Phase 1.")
table(["What", "Basis", "Why it is on that basis"], [[a, b, c] for a, b, c in S.OPERATE], wide=True)
card("<p>The management fee sits on contribution rather than on revenue for a reason. A fifth of "
     "your revenue is drug pass-through earning a fraction of what the rest of the business earns. "
     "A percentage of revenue would pay us most for the line that makes you least, and it would "
     "rise every time a drug price did. A percentage of contribution pays us for the value of what "
     "we actually manage. It happens to cost you less in the years when drug prices run.</p>",
     "good")
w("<h3>Recruitment, whichever track you choose</h3>")
para("We source, assess, credential and place clinical and management staff through our own "
     "workforce channel, including consultants abroad and retired senior clinicians who will take "
     "sessional and visiting work. Charged separately from the programme fee.")
table(["Role", "Fee", "Minimum"], [[a, b, c] for a, b, c in S.RECRUIT])
end()

# ===================================================================== 17 =====
sec("17", "The first ninety days", "What happens if you say yes this month.")
table(["When", "What happens", "Who"],
      [["Weeks 1 to 2", "Change of use lodged. Companies registry and tax registrations filed. "
        "Measured survey instructed. Structural engineer on site.",
        "You, our partner, a surveyor, a structural engineer"],
       ["Weeks 2 to 4", "Measured survey returned and the whole model re-run against real "
        "geometry. Structural verdict on the scanner bay. Catchment and competitor fieldwork "
        "begins.", "Our team, your architect"],
       ["Weeks 4 to 7", "Clinical service model agreed with you, room by room. Room data sheets "
        "issued to design. Radiation authorisation pre-submission with shielding design.",
        "You, oncology and surgical advisers, our clinical lead"],
       ["Weeks 6 to 9", "Tariff built and payor strategy agreed. First conversations with schemes, "
        "corporates and manufacturer access programmes. Consultant panel structure drafted.",
        "Our commercial team, you"],
       ["Weeks 8 to 11", "Shareholders' agreement and the founding consultant scheme drafted and "
        "discussed with the people it affects, before anybody has assumed anything.",
        "You, your lawyer, our partner"],
       ["Weeks 10 to 12", "Financial model handed over in your hands, not ours. Funding plan and "
        "lender or investor pack. Design to tender. Phase 1 decision taken on real numbers.",
        "Everyone"]], wide=True)
card("<p>At the end of ninety days you can stop. You will hold a measured survey, a structural "
     "verdict, a verified market, a service model, a tariff, a funding plan, lodged consents and a "
     "financial model you can run yourself. If the survey comes back badly, or the consent looks "
     "difficult, that is the cheapest place to find it out. Phase 0 is built to stand on its own, "
     "and I would rather you had that option than committed to twenty-seven months on an "
     "estimate.</p>")
end()

# ===================================================================== 18 =====
sec("18", "If we only had a page", "")
para("You have five houses on a good plot, in a catchment full of insured salaried households who "
     "are used to paying for speed, in a city where cancer care is slow and fragmented. That is a "
     "better starting position than most of what we are shown.",
     "The answer to your question is yes. NGN 400 million a month arrives in month %d, with about "
     "NGN %s million of monthly earnings under it, on a %.0f per cent margin. Over seven years it "
     "returns %.0f per cent with no terminal value counted. You will need NGN %s billion "
     "available, peaking in month %d, and about NGN %s million of that is working capital rather "
     "than building."
     % (CROSS, n(EB24, 0), EB_PCT, 100 * MB["irr"], n(MB["peak"] / 1000, 2), MB["trough_m"],
        n(WC_GAP, 0)),
     "Three decisions carry most of the outcome. Commit to the second site in Phase 1. Pre-fund "
     "systemic therapy from the first patient. Do not start construction until the change of use "
     "is granted and the conversion is on a fixed price.",
     "The strategy is not a hospital. It is the whole cancer journey in one place, close to home, "
     "with a family medicine front door and a home care back door, and a published promise about "
     "time that nobody else in this city will make.",
     "What we would do is measure the building before anyone believes a number, lodge the consents "
     "in week one, design the service before you buy a machine, settle the ownership before your "
     "colleagues assume anything, and then deliver it with you, phase by phase.",
     "We would like to do it. Ninety days is enough to know whether it is real.")
w('<p class="sig">Debo Odulana<span>Founding Partner, Consult for Africa</span></p>')
end()

# =================================================================== appendix =
sec("A", "Appendix", "Capital spend, item by item.")
for ph, t in [(0, "Phase 0: survey, design and consents"), (1, "Phase 1: the day case facility"),
              (2, "Phase 2: inpatient capacity"),
              (3, "Phase 3: centre of excellence and the second site")]:
    w("<h3>%s</h3>" % t)
    table(["Item", "NGN m"], [[x, n(v)] for x, v in S.CAPEX[ph]]
          + [["Total", n(S.CAPEX_TOTAL[ph])]], align=[1], foot=True)
table(["", "NGN m"], [["All phases", n(CAPEX_ALL)],
                      ["Peak funding requirement, month %d" % MB["trough_m"], n(MB["peak"])]],
      align=[1], foot=True)
end()

sec("B", "Appendix", "The assumptions, and how confident we are in each.")
table(["Assumption", "What we used", "Confidence", "Note"],
      [["Gross floor area", "%s sqm across %d units" % (n(S.GROSS_SQM, 0), S.UNITS), "Low",
        "Planning figure. A measured survey supersedes it and has moved by a third before"],
       ["Net to gross", "%.0f per cent" % (100 * S.NET_FACTOR), "Low",
        "Conversions lose more to circulation than new build does"],
       ["Conversion cost", "About NGN 430,000 a square metre", "Medium",
        "Clinical grade with structural work. Firms up at tender"],
       ["Oncology patients on treatment", "85 a month at maturity", "Medium",
        "Breaks even at %.0f. The judgement is referral capture, not clinical capacity" % BE_ONCO],
       ["Blended revenue per oncology patient", "NGN 1.43m a month", "Medium",
        "Very sensitive to the share on biologics and to the exchange rate"],
       ["Theatre volume", "80 cases a month at maturity", "Medium",
        "Depends entirely on how well the consultant panel is built"],
       ["Days to cash", "%.0f days blended" % S.DSO, "Medium",
        "Follows directly from the payor mix, which is a choice you make"],
       ["Payor mix", "%.0f per cent out of pocket" % (100 * S.PAYORS[0][1]), "Medium",
        "Reflects that most schemes cap or exclude systemic cancer therapy"],
       ["Ramp speed", "Half of steady state in 3 to 9 months by line", "Medium",
        "Oncology is the slowest because it is built on trust"],
       ["Second site revenue", "NGN 58m a month at maturity", "Medium",
        "Imaging, phlebotomy and clinics only. No theatre and no beds"],
       ["Fixed operating cost",
        "NGN %s m a month at full operation" % n(sum(v for _x, v in S.OVERHEAD_DETAIL), 0),
        "Medium", "Detailed below. Assumes you employ your own management team"],
       ["Tax", "Sheltered by capital allowances into year three", "Medium",
        "A pioneer status application is worth making and is not assumed here"],
       ["Terminal value", "None counted", "High",
        "Everything above is earned inside seven years"]], wide=True)
w("<h3>Fixed operating cost at full operation</h3>")
table(["", "NGN m"], [[x, n(v)] for x, v in S.OVERHEAD_DETAIL]
      + [["Total a month", n(sum(v for _x, v in S.OVERHEAD_DETAIL))]], align=[1], foot=True)
para("Every figure in this document is produced by a single monthly model. If one assumption "
     "changes, the whole document changes with it, which is how we would like to work with you: "
     "you tell us what you believe, and we show you what it does to the answer within a day.")
end()

w('<div class="foot-rule"><span>Debo Odulana</span><span>Consult for Africa</span>'
  '<span>+234 913 813 8553</span><span>hello@consultforafrica.com</span></div>')
w("</main></div>")

doc = "\n".join(OUT_PARTS)
idx = "".join('<a href="#%s"><b>%s</b><span>%s</span></a>' % (sid, num, html.escape(eb))
              for num, eb, sid in SECTIONS)
doc = doc.replace("<!--INDEX-->", idx)
OUT.write_text(doc, encoding="utf-8")
print("wrote %s  (%.0f KB, %d sections)" % (OUT, OUT.stat().st_size / 1024, len(SECTIONS)))
