"""
Build the Havana Specialist Hospital BOARD OPERATING MODEL deck for Consult For Africa.

A landscape, slide-per-page briefing deck for the full HSH board (both founding
families, the four non-executives, and the Afya partnership). Narrative spine:
what the board is for -> composition & gaps -> chairmanship & legitimacy ->
committee architecture -> the Afya relationship & reporting -> cadence -> next steps.

Neutral and shareable: principle-led on chairmanship, no family politics on any slide.

Source narrative: docs/hsh-board-operating-model-cfa.md
Output:          docs/hsh-board-deck-cfa.pdf  (A4 landscape, branded slides)

Run:
  python3 scripts/build-hsh-board-deck.py
"""

from __future__ import annotations

from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
OUT = DOCS / "hsh-board-deck-cfa.pdf"
LOGO = DOCS / "c4a-logo-reversed.png"

# ---- brand palette (source: docs/brand-guide-cfa.pdf) ----------------------
NAVY = HexColor("#0B3C5D")
DEEP_NAVY = HexColor("#081521")
GOLD = HexColor("#D4AF37")
TEAL = HexColor("#1F7A8C")
BODY = HexColor("#1F2937")
MUTED = HexColor("#6B7280")
SURFACE = HexColor("#F1F5F9")
LIGHT = HexColor("#C9D6E0")
CREAM = HexColor("#FBF6E6")

PAGE_W, PAGE_H = landscape(A4)   # 842 x 595
MX = 54
TOTAL = "16"


# ----------------------------------------------------------- helpers ---------
def wrap(c, text, font, size, max_w):
    words = text.split()
    lines, cur = [], ""
    for w in words:
        trial = (cur + " " + w).strip()
        if c.stringWidth(trial, font, size) <= max_w:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def para(c, text, x, y, font, size, color, max_w, leading):
    c.setFont(font, size)
    c.setFillColor(color)
    for line in wrap(c, text, font, size, max_w):
        c.drawString(x, y, line)
        y -= leading
    return y


def chrome(c, n, kicker):
    c.setFillColor(NAVY)
    c.rect(0, PAGE_H - 6, PAGE_W, 6, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(0, PAGE_H - 9, PAGE_W, 3, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(MX, PAGE_H - 60, 26, 3, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 10.5)
    c.setFillColor(TEAL)
    c.drawString(MX + 36, PAGE_H - 63, kicker.upper())
    c.setFillColor(GOLD)
    c.rect(MX, 30, 20, 2, fill=1, stroke=0)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8)
    c.drawString(MX, 19, "Consult for Africa   /   Confidential   /   Havana Specialist Hospital  /  Board Operating Model")
    c.drawRightString(PAGE_W - MX, 19, "%s / %s" % (str(n).zfill(2), TOTAL))
    try:
        _ic = ImageReader(str(DOCS / "c4a-icon.png"))
        _iw, _ih = _ic.getSize()
        _h = 30.0
        _w = _h * _iw / _ih
        c.drawImage(_ic, PAGE_W - MX - _w, PAGE_H - 78, width=_w, height=_h, mask="auto")
    except Exception:
        pass


def heading(c, text, y=PAGE_H - 108, size=27, color=NAVY, max_w=None):
    max_w = max_w or (PAGE_W - 2 * MX)
    c.setFont("Helvetica-Bold", size)
    c.setFillColor(color)
    leading = size + 6
    for line in wrap(c, text, "Helvetica-Bold", size, max_w):
        c.drawString(MX, y, line)
        y -= leading
    return y


def bullet_block(c, items, x, y, max_w, gap=14, size=12.5, leading=16.5,
                 lead_font="Helvetica-Bold", body_color=BODY, tick=GOLD):
    for lead, rest in items:
        c.setFillColor(tick)
        c.rect(x, y - 1, 7, 3, fill=1, stroke=0)
        tx = x + 18
        if lead:
            c.setFont(lead_font, size)
            c.setFillColor(NAVY)
            c.drawString(tx, y, lead)
            offset = c.stringWidth(lead + "  ", lead_font, size)
        else:
            offset = 0
        words = rest.split()
        cur, cy = "", y
        line_x = tx + offset
        avail = max_w - offset
        out_lines = []
        for w in words:
            trial = (cur + " " + w).strip()
            if c.stringWidth(trial, "Helvetica", size) <= avail:
                cur = trial
            else:
                out_lines.append((line_x, cur))
                cur = w
                line_x = tx
                avail = max_w
        if cur:
            out_lines.append((line_x, cur))
        for lx, ln in out_lines:
            c.setFont("Helvetica", size)
            c.setFillColor(body_color)
            c.drawString(lx, cy, ln)
            cy -= leading
        y = cy - gap
    return y


def callout(c, x, y, w, text, bg=SURFACE, spine=TEAL, fg=NAVY, pad=22,
            size=12.5, leading=17, font="Helvetica-Bold"):
    lines = wrap(c, text, font, size, w - 2 * pad)
    h = pad * 2 + leading * len(lines) - (leading - size)
    c.setFillColor(bg)
    c.roundRect(x, y - h, w, h, 8, fill=1, stroke=0)
    c.setFillColor(spine)
    c.rect(x, y - h, 5, h, fill=1, stroke=0)
    ty = y - pad - size + 3
    c.setFont(font, size)
    c.setFillColor(fg)
    for ln in lines:
        c.drawString(x + pad, ty, ln)
        ty -= leading
    return y - h


def box(c, x, y, w, h, fill, spine=None, spine_w=5):
    c.setFillColor(fill)
    c.roundRect(x, y, w, h, 8, fill=1, stroke=0)
    if spine:
        c.setFillColor(spine)
        c.rect(x, y, spine_w, h, fill=1, stroke=0)


# ----------------------------------------------------------- slides ----------
def slide_cover(c):
    c.setFillColor(NAVY)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.setFillColor(DEEP_NAVY)
    c.rect(0, 0, PAGE_W, 12, fill=1, stroke=0)
    c.rect(0, PAGE_H - 12, PAGE_W, 12, fill=1, stroke=0)
    try:
        img = ImageReader(str(LOGO))
        iw, ih = img.getSize()
        dw = 168
        dh = dw * ih / iw
        c.drawImage(img, MX, PAGE_H - 70 - dh + 20, width=dw, height=dh,
                    mask="auto", preserveAspectRatio=True)
    except Exception:
        c.setFillColor(GOLD)
        c.setFont("Helvetica-Bold", 13)
        c.drawString(MX, PAGE_H - 64, "CONSULT FOR AFRICA")

    c.setFillColor(GOLD)
    c.rect(MX, PAGE_H - 188, 44, 3, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(GOLD)
    c.drawString(MX + 56, PAGE_H - 191, "BOARD BRIEFING  /  GOVERNANCE & OPERATING MODEL")

    c.setFont("Helvetica-Bold", 44)
    c.setFillColor(white)
    c.drawString(MX, PAGE_H - 248, "Setting up the HSH Board")
    c.setFont("Helvetica-Bold", 19)
    c.setFillColor(GOLD)
    c.drawString(MX, PAGE_H - 282, "A fit-for-purpose operating model under the Afya partnership")

    para(c,
         "Composition and skills, the committee architecture, chairmanship and legitimacy, the "
         "relationship between the Board and the Afya-HSH Governance Committee, and how reporting "
         "flows upward. A working model to agree, then hand to the Company Secretary to administer.",
         MX, PAGE_H - 326, "Helvetica", 13, LIGHT, 600, 19)

    c.setFillColor(GOLD)
    c.rect(MX, 96, 60, 3, fill=1, stroke=0)
    for i, line in enumerate([
        "For:   The Board of Havana Specialist Hospital Limited",
        "From:  Dr Debo Odulana, Independent Non-Executive Director  /  Consult for Africa",
        "hello@consultforafrica.com   /   consultforafrica.com   /   Confidential",
    ]):
        c.setFont("Helvetica", 10.5)
        c.setFillColor(white if i < 2 else LIGHT)
        c.drawString(MX, 72 - i * 17, line)


def slide_mandate(c):
    chrome(c, 2, "What the board is for")
    heading(c, "Four jobs, and the test for every choice that follows")
    y = PAGE_H - 168
    items = [
        ("Oversee the Afya partnership.", "Assure delivery against the management agreement, KPIs, and turnaround progress."),
        ("Secure HSH for the long term.", "Growth and sustainability of the hospital, with or without Afya."),
        ("Build credibility and influence.", "Institutional standing, networks, and reputation that open doors."),
        ("Protect the families' interests.", "Both founding families. Balance between them is itself a governance objective."),
    ]
    y = bullet_block(c, items, MX, y, PAGE_W - 2 * MX - 20, gap=15, size=13, leading=17)
    callout(c, MX, y - 4, PAGE_W - 2 * MX,
            "Protecting the families' interests is not in tension with professional governance, it depends "
            "on it. Family control belongs in ownership and reserved matters, not in day-to-day management.",
            bg=CREAM, spine=GOLD)


def slide_principles(c):
    chrome(c, 3, "Design principles")
    heading(c, "Five principles we design to")
    y = PAGE_H - 162
    items = [
        ("The board oversees; management operates.", "The board sets direction, approves budget and risk appetite, and holds management and Afya to account. It does not run the hospital."),
        ("Independence provides challenge.", "Assurance committees are led by non-executive directors."),
        ("HSH keeps an independent read on Afya.", "The joint Afya-HSH committee cannot be our only check on Afya's own delivery."),
        ("Report by exception, against a standard.", "A consolidated pack on a fixed template, with escalation thresholds, not raw data."),
        ("One parent per committee, conflicts in the open.", "Every committee reports to one body; related-party matters are declared and registered."),
    ]
    bullet_block(c, items, MX, y, PAGE_W - 2 * MX - 20, gap=12, size=12.5, leading=16)


def slide_composition(c):
    chrome(c, 4, "Composition")
    hy = heading(c, "A balanced board: four executive, four non-executive")
    para(c,
         "A 4:4 balance is a strong starting point, unusual in the good sense for a family hospital, "
         "all four non-executives independent, so the assurance committees are genuinely independent-led.",
         MX, hy - 14, "Helvetica", 12.5, BODY, PAGE_W - 2 * MX, 18)
    colw = (PAGE_W - 2 * MX - 28) / 2
    top = PAGE_H - 200
    boxh = 176
    # executive
    box(c, MX, top - boxh, colw, boxh, SURFACE, GOLD)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(MX + 22, top - 28, "Executive directors (family)")
    ex = [
        "Dr Ijeoma Iwuala, Medical Director, clinical governance & quality",
        "Nwando Okeke, legal, regulatory, governance",
        "Ugo Nwokoro, product, technology, digital transformation",
        "Okeke Chukwuemeka, operations, administration, procurement",
    ]
    yy = top - 52
    for t in ex:
        yy = para(c, "•  " + t, MX + 22, yy, "Helvetica", 11, BODY, colw - 40, 15) - 6
    # non-executive
    rx = MX + colw + 28
    box(c, rx, top - boxh, colw, boxh, HexColor("#EAF1F4"), TEAL)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(rx + 22, top - 28, "Non-executive directors (all independent)")
    ne = [
        "Dennis Olisa, Board Chair (interim); banking, risk, governance (ex-bank ED)",
        "Chief Charles Odunukwe, corporate, investment, networks",
        "Prof Oliver Ezechi, clinical governance, research, academic",
        "Dr Debo Odulana, healthcare systems, transformation, structure",
    ]
    yy = top - 52
    for t in ne:
        yy = para(c, "•  " + t, rx + 22, yy, "Helvetica", 11, BODY, colw - 40, 15) - 6


def slide_gaps(c):
    chrome(c, 5, "Skills & experience")
    hy = heading(c, "Functionally strong, with two gaps worth a conscious decision")
    para(c,
         "Across clinical governance, finance and audit, legal, technology, operations, strategy, and "
         "networks, the board is well covered, and Dennis Olisa brings the finance and audit depth. Two gaps remain.",
         MX, hy - 14, "Helvetica", 12.5, BODY, PAGE_W - 2 * MX, 18)
    colw = (PAGE_W - 2 * MX - 28) / 2
    top = PAGE_H - 210
    boxh = 128
    box(c, MX, top - boxh, colw, boxh, CREAM, GOLD)
    c.setFillColor(NAVY); c.setFont("Helvetica-Bold", 13.5)
    c.drawString(MX + 22, top - 28, "1.  Payer & managed-care")
    para(c, "Health-insurance, HMO contracting, and revenue-cycle economics, central to viability. "
            "Not backfilled by a finance profile. Dr Awoyinfa is the fit.",
         MX + 22, top - 50, "Helvetica", 11.3, BODY, colw - 40, 15)
    rx = MX + colw + 28
    box(c, rx, top - boxh, colw, boxh, SURFACE, TEAL)
    c.setFillColor(NAVY); c.setFont("Helvetica-Bold", 13.5)
    c.drawString(rx + 22, top - 28, "2.  Nursing & accreditation")
    para(c, "Senior nursing leadership and accreditation depth, the largest clinical workforce and the "
            "front line of safety. Dr Hanson is the fit.",
         rx + 22, top - 50, "Helvetica", 11.3, BODY, colw - 40, 15)
    callout(c, MX, top - boxh - 16, PAGE_W - 2 * MX,
            "Recommendation: confirm Dennis Olisa now; decide the payer seat deliberately rather than let "
            "it drift; keep any growth past eight tied to distinct competencies, not more of the same.",
            bg=HexColor("#EAF1F4"), spine=TEAL, size=12)


def slide_chair(c):
    chrome(c, 6, "Chairmanship")
    heading(c, "An independent, non-family Chair, on neutral principle")
    y = PAGE_H - 166
    items = [
        ("Separate the Chair from the MD.", "A board cannot hold management to account if the chair is also the executive being held to account."),
        ("Chair and top executive on different sides.", "With the MD role held in one family, a non-family Chair keeps the top of the house balanced and protects both families."),
        ("The Chair must command three constituencies.", "Both families, the independents, and Afya. That calls for external stature and visible neutrality."),
        ("Frame it as interim.", "Chair for the establishment phase, reviewed at the first annual board evaluation. Low-pressure and reversible."),
    ]
    y = bullet_block(c, items, MX, y, PAGE_W - 2 * MX - 20, gap=13, size=12.5, leading=16.5)
    callout(c, MX, y - 2, PAGE_W - 2 * MX,
            "On these principles, a credible external non-executive fits the chair, recommended on an "
            "interim basis and confirmed by a joint process both families endorse.",
            bg=CREAM, spine=GOLD, size=12.3)


def slide_legitimacy(c):
    chrome(c, 7, "Legitimacy")
    hy = heading(c, "Legitimacy is the process, not the person")
    para(c,
         "A new board earns trust by how it decides, not only by whom it appoints. Four moves make the "
         "chairmanship, and the board itself, legitimate to everyone.",
         MX, hy - 14, "Helvetica", 12.5, BODY, PAGE_W - 2 * MX, 18)
    y = hy - 48
    items = [
        ("Let the trusted, neutral directors carry it.", "Those familiar with and accepted by both families propose and vouch for the Chair."),
        ("Both families formally endorse.", "Proposed through Nominations, ratified by the board, with each family on record. A consensus chair cannot later be dismissed as one side's."),
        ("Fair process on reserved matters.", "Genuine deliberation, and both voices sought where a family has a material interest. Being heard buys more peace than any appointment."),
        ("Re-own the board's composition.", "The full board adopts its own membership and terms, so it becomes everyone's board rather than anyone's project."),
    ]
    bullet_block(c, items, MX, y, PAGE_W - 2 * MX - 20, gap=13, size=12.3, leading=16)


def slide_two_tier(c):
    chrome(c, 8, "Committee architecture")
    hy = heading(c, "Two tiers of committee, one rule that sorts them")
    callout(c, MX, hy - 16, PAGE_W - 2 * MX,
            "A committee is a BOARD committee only if the board has delegated it authority to assure on the "
            "board's behalf, and it reports to the board. Everything else is an operating committee that "
            "reports up through the Afya-HSH Governance Committee.",
            bg=NAVY, spine=GOLD, fg=white, size=12.5)
    colw = (PAGE_W - 2 * MX - 28) / 2
    top = PAGE_H - 300
    boxh = 150
    box(c, MX, top - boxh, colw, boxh, SURFACE, GOLD)
    c.setFillColor(NAVY); c.setFont("Helvetica-Bold", 13.5)
    c.drawString(MX + 22, top - 28, "Tier 1  /  Board committees")
    para(c, "Few. Non-executive led. Report to the board. Provide assurance: finance and operations, "
            "audit and risk, quality and clinical governance, people and remuneration, transformation.",
         MX + 22, top - 50, "Helvetica", 11.3, BODY, colw - 40, 15)
    rx = MX + colw + 28
    box(c, rx, top - boxh, colw, boxh, HexColor("#EAF1F4"), TEAL)
    c.setFillColor(NAVY); c.setFont("Helvetica-Bold", 13.5)
    c.drawString(rx + 22, top - 28, "Tier 2  /  Operating committees")
    para(c, "As many as operations needs. Chaired by executives or Afya. Report into the Governance "
            "Committee: Quality Assurance, Hospital Manager, Clinical Administrator, Performance Review.",
         rx + 22, top - 50, "Helvetica", 11.3, BODY, colw - 40, 15)
    c.setFillColor(MUTED); c.setFont("Helvetica-Oblique", 9.5)
    c.drawString(MX, top - boxh - 18, "Reconciling with Afya: sort each proposed committee with the rule. Expect most to be Tier 2.")


def slide_committees(c):
    chrome(c, 9, "The five board committees")
    heading(c, "Five board committees, chairs spread for balance")
    rows = [
        ("Finance, Investment & Operations", "Co-chairs: Chukwuemeka & Ugo",
         "Financial performance, capital and investment, operational delivery. Co-chaired across both families."),
        ("Audit & Risk", "Chief Odunukwe",
         "Independent assurance: controls, audit, enterprise risk, compliance, related-party. Holds finance to account."),
        ("Quality & Clinical Governance", "Prof Ezechi  (LID)",
         "Clinical quality and safety, incident learning, credentialing, accreditation readiness."),
        ("People & Remuneration / Nominations", "Nwando Okeke",
         "Composition, appointments, remuneration, evaluation, conflicts, sitting-allowance policy."),
        ("Transformation & Digital  (time-boxed)", "Dr Debo Odulana",
         "Technology and digital roadmap, systems, data governance. Reviewed and sunset as it stabilises."),
    ]
    top = PAGE_H - 150
    rh = 66
    gap = 8
    w = PAGE_W - 2 * MX
    namew = 250
    for i, (title, chair, body) in enumerate(rows):
        yy = top - i * (rh + gap) - rh
        spine = GOLD if i % 2 == 0 else TEAL
        box(c, MX, yy, w, rh, SURFACE, spine)
        c.setFillColor(NAVY); c.setFont("Helvetica-Bold", 13)
        c.drawString(MX + 20, yy + rh - 24, title)
        c.setFillColor(TEAL); c.setFont("Helvetica-Bold", 10)
        c.drawString(MX + 20, yy + 14, "Chair: " + chair)
        para(c, body, MX + namew + 10, yy + rh - 24, "Helvetica", 10.5, BODY, w - namew - 34, 14)


def slide_two_layer(c):
    chrome(c, 10, "The Afya relationship")
    hy = heading(c, "Two layers: strategic board over operational governance")
    colw = (PAGE_W - 2 * MX - 28) / 2
    top = hy - 24
    boxh = 150
    box(c, MX, top - boxh, colw, boxh, NAVY, GOLD)
    c.setFillColor(white); c.setFont("Helvetica-Bold", 14)
    c.drawString(MX + 22, top - 30, "HSH Board")
    c.setFillColor(GOLD); c.setFont("Helvetica-Bold", 10)
    c.drawString(MX + 22, top - 48, "Quarterly  /  strategic oversight")
    para(c, "Final approval of budgets, major investments, and risk appetite. Owns the reserved matters. "
            "Ultimate accountability for the hospital and both families' interests.",
         MX + 22, top - 68, "Helvetica", 11, LIGHT, colw - 40, 15)
    rx = MX + colw + 28
    box(c, rx, top - boxh, colw, boxh, SURFACE, TEAL)
    c.setFillColor(NAVY); c.setFont("Helvetica-Bold", 14)
    c.drawString(rx + 22, top - 30, "Afya-HSH Governance Committee")
    c.setFillColor(TEAL); c.setFont("Helvetica-Bold", 10)
    c.drawString(rx + 22, top - 48, "Monthly  /  operational governance")
    para(c, "Afya Care and HSH executives jointly. Tracks execution, KPIs, and turnaround via the "
            "Performance Review Subcommittee and operating functions. Escalates to the board.",
         rx + 22, top - 68, "Helvetica", 11, BODY, colw - 40, 15)
    callout(c, MX, top - boxh - 16, PAGE_W - 2 * MX,
            "Because this committee is jointly controlled with Afya, it cannot be HSH's only assurance over "
            "Afya's own delivery. The board keeps an independent read through Finance and Quality, and a "
            "standing quarterly partnership review.",
            bg=CREAM, spine=GOLD, size=12)


def slide_reporting(c):
    chrome(c, 11, "Reporting pathways")
    heading(c, "How information flows, and is filtered, upward")
    # vertical flow of stacked bands
    bands = [
        ("Frontline clinical & operational activity", SURFACE, BODY),
        ("Management: HSH Executive + Afya Care Executive", SURFACE, BODY),
        ("Tier 2: Quality Assurance  /  Hospital Manager  /  Clinical Administrator", HexColor("#EAF1F4"), BODY),
        ("Afya-HSH Governance Committee  (monthly; Performance Review)", TEAL, white),
        ("Board committees: Finance/Ops  /  Audit & Risk  /  Quality  /  People & Rem  /  Transformation", HexColor("#EAF1F4"), BODY),
        ("HSH BOARD  (quarterly; consolidated pack; by exception)", NAVY, white),
    ]
    x = MX
    w = PAGE_W - 2 * MX
    bh = 40
    gap = 10
    top = PAGE_H - 150
    for i, (label, bg, fg) in enumerate(bands):
        yy = top - i * (bh + gap)
        box(c, x, yy - bh, w, bh, bg, GOLD if fg == white else None)
        c.setFillColor(fg); c.setFont("Helvetica-Bold", 11.5)
        c.drawString(x + 22, yy - bh + 14, label)
        if i < len(bands) - 1:
            c.setFillColor(GOLD)
            c.setFont("Helvetica-Bold", 13)
            c.drawCentredString(x + w / 2, yy - bh - gap + 1, "▲")
    c.setFillColor(MUTED); c.setFont("Helvetica-Oblique", 9.3)
    c.drawString(MX, 40, "Standard one-page templates, pre-agreed escalation thresholds, and one consolidated board pack, seven days ahead.")


def slide_cadence(c):
    chrome(c, 12, "Cadence & compensation")
    hy = heading(c, "A predictable rhythm, and transparent sitting fees")
    y = hy - 18
    items = [
        ("Board: quarterly.", "Plus one annual strategy session. Consider six-weekly for the first two or three meetings while the model beds in."),
        ("Afya-HSH Governance Committee: monthly.", "Operational tracking and escalation between board meetings."),
        ("Committees: to their own cadence.", "Finance quarterly plus audit planning; Quality quarterly; People twice a year; Transformation monthly then quarterly."),
        ("Sitting allowance.", "N250,000 per meeting. Board-only ~N1.0M per director a year; with committee attendance ~N2.5M. People & Rem sets a clear participation policy."),
    ]
    bullet_block(c, items, MX, y, PAGE_W - 2 * MX - 20, gap=14, size=12.5, leading=16.5)


def slide_reserved(c):
    chrome(c, 13, "Reserved matters")
    hy = heading(c, "The line the Governance Committee cannot cross")
    para(c,
         "A one-page delegation schedule, owned by People & Remuneration and administered by the Company "
         "Secretary, draws the line that protects both families' interests in practice.",
         MX, hy - 14, "Helvetica", 12.5, BODY, PAGE_W - 2 * MX, 18)
    colw = (PAGE_W - 2 * MX - 28) / 2
    top = PAGE_H - 208
    boxh = 150
    box(c, MX, top - boxh, colw, boxh, CREAM, GOLD)
    c.setFillColor(NAVY); c.setFont("Helvetica-Bold", 13.5)
    c.drawString(MX + 22, top - 28, "Reserved to the board")
    para(c, "Strategy and annual budget; capital above a threshold; any change to the Afya agreement; "
            "senior executive and MD appointments; opening or closing service lines; borrowing; "
            "related-party transactions above a threshold; distributions.",
         MX + 22, top - 50, "Helvetica", 10.8, BODY, colw - 40, 14.5)
    rx = MX + colw + 28
    box(c, rx, top - boxh, colw, boxh, SURFACE, TEAL)
    c.setFillColor(NAVY); c.setFont("Helvetica-Bold", 13.5)
    c.drawString(rx + 22, top - 28, "Delegated to management & the Governance Committee")
    para(c, "Operational spend within budget and thresholds; day-to-day clinical and operational "
            "decisions; hiring below senior level; suppliers within policy.",
         rx + 22, top - 58, "Helvetica", 10.8, BODY, colw - 40, 14.5)


def slide_next(c):
    chrome(c, 14, "Next steps")
    heading(c, "What we agree today, and what follows")
    y = PAGE_H - 158
    items = [
        ("Agree the frame.", "The two-tier committee model, the quarterly board over the monthly Governance Committee, and reserved matters."),
        ("Chairmanship.", "Confirm the approach: interim, non-family Chair, endorsed jointly through Nominations, with a Lead Independent Director alongside."),
        ("Decide the payer seat.", "Confirm Dennis Olisa; take a deliberate decision on adding managed-care expertise."),
        ("Reconcile with Afya.", "Sort their committee proposal into Tier 1 and Tier 2 when it lands."),
        ("Hand to the Company Secretary.", "Terms of reference, reserved-matters schedule, reporting templates, board calendar, participation policy."),
    ]
    bullet_block(c, items, MX, y, PAGE_W - 2 * MX - 20, gap=12, size=12.5, leading=16)


def slide_close(c):
    c.setFillColor(NAVY)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.setFillColor(DEEP_NAVY)
    c.rect(0, 0, PAGE_W, 12, fill=1, stroke=0)
    c.rect(0, PAGE_H - 12, PAGE_W, 12, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(MX, PAGE_H - 130, 44, 3, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(GOLD)
    c.drawString(MX + 56, PAGE_H - 133, "THE THROUGH-LINE")
    c.setFont("Helvetica-Bold", 30)
    c.setFillColor(white)
    c.drawString(MX, PAGE_H - 186, "A credible board both families own.")
    para(c,
         "Get the structure right, keep the process fair, and hold an independent line on the Afya "
         "relationship, and the board protects the hospital, the partnership, and both families at once. "
         "That is what good governance is for.",
         MX, PAGE_H - 228, "Helvetica", 13.5, LIGHT, 660, 21)
    c.setFillColor(GOLD)
    c.rect(MX, 120, 60, 3, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 14)
    c.setFillColor(white)
    c.drawString(MX, 96, "Consult for Africa")
    c.setFont("Helvetica", 11)
    c.setFillColor(LIGHT)
    c.drawString(MX, 76, "Healthcare governance & transformation partner")
    c.drawString(MX, 58, "hello@consultforafrica.com   /   consultforafrica.com")
    c.drawString(MX, 40, "Lagos, Nigeria   /   Confidential")


def build():
    c = canvas.Canvas(str(OUT), pagesize=landscape(A4))
    c.setTitle("Havana Specialist Hospital - Board Operating Model - Consult for Africa")
    c.setAuthor("Consult for Africa")
    slides = [
        slide_cover, slide_mandate, slide_principles, slide_composition,
        slide_gaps, slide_chair, slide_legitimacy, slide_two_tier,
        slide_committees, slide_two_layer, slide_reporting, slide_cadence,
        slide_reserved, slide_next, slide_close,
    ]
    global TOTAL
    TOTAL = str(len(slides))
    for s in slides:
        s(c)
        c.showPage()
    c.save()
    print(f"wrote {OUT}  ({len(slides)} slides)")


if __name__ == "__main__":
    build()
