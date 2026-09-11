"""
Build the HSH Governance Training MODULE 10 teaching deck for Consult for Africa.

Module 10, "The management interface: reporting, escalation, and the Afya
relationship". Cohort C (management, the Afya operational leads, and the Company
Secretary), with a joint session with Cohort A. ~2.5 hours.
Faculty: Consult for Africa (Dr Debo Odulana).

Delivered on the eve of the September establishment cycle: the committees sit
3 to 15 September, the pack is circulated Thursday 17 September, and the board
meets Thursday 24 September to adopt the instrument suite. This session is the
one that decides whether that meeting runs on paper or on anecdote.

Source: docs/hsh-governance-training-curriculum-cfa.md   (M10 learning objectives)
        docs/hsh-board-instruments-pack-cfa.md           (instruments 5, 10, calendar)
        docs/hsh-delegation-of-authority-cfa.md          (bands, codes, the eight rules)
        docs/hsh-board-operating-model-cfa.md            (the architecture)
Output: docs/hsh-m10-management-interface-cfa.pdf  (A4 landscape, branded slides)

Run:
  python3 scripts/build-hsh-m10-deck.py
"""

from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
OUT = DOCS / "hsh-m10-management-interface-cfa.pdf"
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
TOTAL = "20"
FOOTER = ("Consult for Africa   /   Confidential   /   Havana Specialist Hospital  /  "
          "Governance Training, Module 10")


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
    c.drawString(MX, 19, FOOTER)
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


def centred_lines(c, text, cx, top, w, font, size, color, leading):
    """Centre-wrap text inside a box of width w, first baseline at `top`."""
    c.setFont(font, size)
    c.setFillColor(color)
    lines = wrap(c, text, font, size, w)
    y = top
    for ln in lines:
        c.drawCentredString(cx, y, ln)
        y -= leading
    return y


def col_panel(c, x, y, w, h, title, title_col, items, bg=SURFACE, spine=TEAL,
              size=11, leading=14.5, gap=9):
    """A titled panel with a simple bulleted list. Returns nothing."""
    box(c, x, y, w, h, bg, spine)
    c.setFont("Helvetica-Bold", 13)
    c.setFillColor(title_col)
    c.drawString(x + 20, y + h - 28, title)
    ty = y + h - 54
    for it in items:
        c.setFillColor(GOLD)
        c.rect(x + 20, ty + 3, 6, 2.5, fill=1, stroke=0)
        ty = para(c, it, x + 33, ty, "Helvetica", size, BODY, w - 53, leading) - (gap - leading) - leading
        ty += leading - leading
    return ty



# ----------------------------------------------------------- slides ----------
def slide_cover(c):
    c.setFillColor(DEEP_NAVY)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(0, 0, PAGE_W, 12, fill=1, stroke=0)
    c.rect(0, PAGE_H - 12, PAGE_W, 12, fill=1, stroke=0)
    try:
        img = ImageReader(str(LOGO))
        iw, ih = img.getSize()
        dh = 40.0
        dw = dh * iw / ih
        c.drawImage(img, MX, PAGE_H - 70 - dh + 20, width=dw, height=dh, mask="auto")
    except Exception:
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", 13)
        c.drawString(MX, PAGE_H - 64, "CONSULT FOR AFRICA")

    c.setFillColor(GOLD)
    c.rect(MX, PAGE_H - 188, 44, 3, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(GOLD)
    c.drawString(MX + 56, PAGE_H - 191, "MODULE 10  /  GOVERNANCE TRAINING  /  MANAGEMENT AND THE SECRETARIAT")

    c.setFont("Helvetica-Bold", 44)
    c.setFillColor(white)
    c.drawString(MX, PAGE_H - 248, "Reporting to the board")
    sub_y = para(c,
                 "The management interface: what escalates, what is reported, and how the Afya "
                 "relationship is governed",
                 MX, PAGE_H - 282, "Helvetica-Bold", 18, LIGHT, 620, 25)

    para(c,
         "The board has been trained. The instruments are drafted. On Thursday 24 September the board adopts them and "
         "runs its first meeting on the new model. Everything that board will read, question and decide on that day is "
         "written by the people in this room. This session is about that job: reporting by exception, escalating "
         "without being asked, and working inside the delegation of authority.",
         MX, sub_y - 18, "Helvetica", 13, LIGHT, 660, 19)

    c.setFillColor(GOLD)
    c.rect(MX, 96, 30, 2, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 12)
    c.setFillColor(white)
    c.drawString(MX, 70, "Dr Debo Odulana, Independent Non-Executive Director")
    c.setFont("Helvetica", 10.5)
    c.setFillColor(LIGHT)
    c.drawString(MX, 52, "Consult for Africa   /   31 August 2026   /   approximately two and a half hours, working session   /   Confidential")


def slide_why_you(c):
    chrome(c, 2, "why this room")
    heading(c, "Why management is in a governance programme")
    para(c,
         "Governance is often taught as something that happens to management. It is not. A board can only be as good as "
         "the information it is given, and that information is produced here.",
         MX, PAGE_H - 152, "Helvetica", 13, BODY, PAGE_W - 2 * MX - 20, 18)

    w = PAGE_W - 2 * MX
    cw = (w - 24) / 2

    box(c, MX, 214, cw, 208, SURFACE, TEAL)
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(TEAL)
    c.drawString(MX + 22, 214 + 208 - 26, "WHAT THIS SESSION IS NOT")
    bullet_block(c,
                 [("", "It is not the board learning to check up on you."),
                  ("", "It is not more paperwork for its own sake. Three pages replace a long verbal update."),
                  ("", "It is not a transfer of blame. Escalation protects the person who escalates."),
                  ("", "It is not about Afya being distrusted. Structure is not suspicion.")],
                 MX + 22, 214 + 208 - 56, cw - 46, gap=7, size=11, leading=14.5)

    x2 = MX + cw + 24
    box(c, x2, 214, cw, 208, CREAM, GOLD)
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(HexColor("#8A6D1F"))
    c.drawString(x2 + 22, 214 + 208 - 26, "WHAT IT IS")
    bullet_block(c,
                 [("", "The rules that tell you which decisions are yours, so you can take them without asking."),
                  ("", "A short, honest reporting format that gets you a decision instead of a debate."),
                  ("", "Thresholds that carry bad news upward automatically, so nobody has to judge the moment."),
                  ("", "A shared language with the board about what good reporting and good challenge look like.")],
                 x2 + 22, 214 + 208 - 56, cw - 46, gap=7, size=11, leading=14.5)

    callout(c, MX, 182, w,
            "A well-drawn governance system gives management more freedom, not less. Everything below the line is "
            "yours to decide, and the line is now written down.")


def slide_objectives(c):
    chrome(c, 3, "learning objectives")
    heading(c, "What you will be able to do by the end")
    y = PAGE_H - 152
    items = [
        ("1.", "Prepare a report by exception against target on the Havana template, in three pages, and know what belongs in each section."),
        ("2.", "Answer the four standing questions on any variance before a director has to ask them."),
        ("3.", "Read the delegation of authority and say whether a decision is yours, the joint committee's, a board committee's, or the board's."),
        ("4.", "Name what escalates, to whom, and within what time, without waiting for the quarter and without waiting to be asked."),
        ("5.", "Describe how information flows from the ward and the department, through the Afya-HSH Governance Committee and the board committees, to the board."),
        ("6.", "Explain your own record-keeping and legal duties in supporting the board, and work to the calendar that binds the September cycle."),
    ]
    y = bullet_block(c, items, MX, y, PAGE_W - 2 * MX - 20, gap=13, size=12.5, leading=16.5)
    callout(c, MX, y - 2, PAGE_W - 2 * MX,
            "The test is not this session. The test is the pack that goes out on Thursday 17 September.",
            bg=CREAM, spine=GOLD)


def slide_where_you_sit(c):
    chrome(c, 4, "your position")
    heading(c, "Where you sit, in one sentence")
    y = callout(c, MX, PAGE_H - 148, PAGE_W - 2 * MX,
                "The board directs the hospital. Management runs it. The board holds management to account for "
                "running it, and it can only do that on what management tells it.",
                bg=CREAM, spine=GOLD, size=14, leading=19)

    para(c,
         "Three organs, from Module 1: the owners, the board, and management. Each has work the others cannot do.",
         MX, y - 26, "Helvetica", 12.5, BODY, PAGE_W - 2 * MX, 17)

    w = PAGE_W - 2 * MX
    cw = (w - 40) / 3
    top, h = 150, 178
    cols = [
        ("THE OWNERS", "Two founding families. They own the company, appoint the board, and decide the matters reserved to shareholders. They do not run the hospital, and they do not instruct you.", SURFACE, TEAL),
        ("THE BOARD", "Eight directors, meeting quarterly. Sets direction, oversees performance and risk, holds management to account, protects the owners and the mission.", CREAM, GOLD),
        ("MANAGEMENT", "You, with the Afya executive. Runs the hospital every day, inside the budget, the policy and the delegated authority the board has set.", SURFACE, TEAL),
    ]
    for i, (label, text, bg, spine) in enumerate(cols):
        x = MX + i * (cw + 20)
        box(c, x, top, cw, h, bg, spine)
        c.setFont("Helvetica-Bold", 12)
        c.setFillColor(NAVY)
        c.drawString(x + 20, top + h - 30, label)
        para(c, text, x + 20, top + h - 56, "Helvetica", 11, BODY, cw - 40, 15)

    c.setFont("Helvetica-Oblique", 11)
    c.setFillColor(MUTED)
    c.drawString(MX, 116, "A single director, however senior, cannot instruct you. The board speaks through its decisions, minuted, and through the Chair.")


def slide_four_jobs(c):
    chrome(c, 5, "what the board is for")
    heading(c, "The board's four jobs, and what each one asks of you")
    para(c,
         "Everything the board wants from management traces back to one of these four. If a request does not, it is "
         "worth asking which job it serves.",
         MX, PAGE_H - 152, "Helvetica", 13, BODY, PAGE_W - 2 * MX - 20, 18)

    rows = [
        ("Set direction", "Strategy, the annual plan, the budget, the risk appetite.", "Your plan, your forecast, and an honest view of what could knock it off course."),
        ("Oversee performance and risk", "Against the plan the board approved, and the risks on the register.", "The dashboard, on time, with actual against plan and prior period, and the risks you own."),
        ("Hold management to account", "Constructively, on the evidence, not on personality.", "Variance explained before it is asked about, and what is being done, by whom, by when."),
        ("Protect the owners and the mission", "The licence, the patients, the reputation, the two families' asset.", "Escalation the moment a threshold is crossed, whatever it looks like."),
    ]
    w = PAGE_W - 2 * MX
    y = PAGE_H - 200
    c.setFont("Helvetica-Bold", 9.5)
    c.setFillColor(TEAL)
    c.drawString(MX + 18, y + 8, "THE JOB")
    c.drawString(MX + 210, y + 8, "WHAT IT MEANS")
    c.drawString(MX + 500, y + 8, "WHAT IT ASKS OF MANAGEMENT")
    y -= 12
    for i, (job, means, asks) in enumerate(rows):
        h = 62
        box(c, MX, y - h, w, h, SURFACE if i % 2 == 0 else HexColor("#F7FAFC"),
            GOLD if i % 2 == 0 else TEAL)
        c.setFont("Helvetica-Bold", 12)
        c.setFillColor(NAVY)
        para(c, job, MX + 18, y - 24, "Helvetica-Bold", 12, NAVY, 180, 15)
        para(c, means, MX + 210, y - 24, "Helvetica", 10.5, BODY, 275, 14)
        para(c, asks, MX + 500, y - 24, "Helvetica", 10.5, BODY, w - 520, 14)
        y -= h + 8


def slide_flow(c):
    chrome(c, 6, "the information system")
    heading(c, "How information travels from the ward to the board")
    para(c,
         "Four layers, each with a different frequency and a different job. Nothing skips a layer except an escalation, "
         "which is designed to skip all of them.",
         MX, PAGE_H - 152, "Helvetica", 13, BODY, PAGE_W - 2 * MX - 20, 18)

    w = PAGE_W - 2 * MX
    lanes = [
        ("DAILY AND WEEKLY", "Management and the departments", "The hospital runs. Decisions inside budget, policy and delegated authority are taken here and not referred upward.", TEAL),
        ("MONTHLY, FIRST TUESDAY", "Afya-HSH Governance Committee", "Operational performance against the agreed KPI set, partnership milestones, service issues, decisions taken under delegation, and what is being escalated.", TEAL),
        ("TWO TO THREE WEEKS BEFORE THE BOARD", "The five board committees", "The detail is examined here: finance and operations, audit and risk, quality and clinical governance, people and remuneration, transformation and digital. Each reports to the board on one page.", GOLD),
        ("QUARTERLY", "The board", "Reads the pack seven clear days ahead, questions the exceptions, takes the decisions reserved to it, and records them with their reasons.", GOLD),
    ]
    y = PAGE_H - 190
    for label, who, what, spine in lanes:
        h = 66
        box(c, MX, y - h, w, h, SURFACE if spine == TEAL else CREAM, spine)
        c.setFont("Helvetica-Bold", 9)
        c.setFillColor(TEAL if spine == TEAL else HexColor("#8A6D1F"))
        c.drawString(MX + 20, y - 22, label)
        c.setFont("Helvetica-Bold", 13)
        c.setFillColor(NAVY)
        c.drawString(MX + 20, y - 40, who)
        para(c, what, MX + 300, y - 24, "Helvetica", 10, BODY, w - 320, 13)
        y -= h + 8

    callout(c, MX, y - 2, w,
            "The escalation schedule is the exception to all of this. It goes straight up, the same day or within "
            "hours, and it does not wait for a meeting.", bg=HexColor("#FDF2F2"), spine=HexColor("#B4472F"),
            fg=HexColor("#7A2E1E"), pad=14, size=11.5, leading=15)


def slide_calendar(c):
    chrome(c, 7, "the september cycle")
    heading(c, "Working backwards from Thursday 24 September")
    para(c,
         "The board meets on Thursday 24 September and adopts the instrument suite. Everything before it is a lead "
         "time, and lead times are not negotiable once the board has adopted the calendar.",
         MX, PAGE_H - 152, "Helvetica", 13, BODY, PAGE_W - 2 * MX - 20, 18)

    rows = [
        ("Tue 1 Sep", "Afya-HSH Governance Committee, monthly", "Your monthly report and KPI pack. First run on the new format.", TEAL),
        ("Thu 3 Sep", "Transformation and Digital Committee", "Papers to the Company Secretary five working days ahead.", TEAL),
        ("Tue 8 to Tue 15 Sep", "Committee week: Finance and Operations, Audit and Risk, Quality and Clinical Governance, People and Remuneration", "Your committee papers and the underlying detail. The committees examine here so the board does not have to.", TEAL),
        ("Mon 14 Sep", "Management report by exception due to the Company Secretary", "Three pages. Signed off by the Medical Director with the Afya operational lead.", GOLD),
        ("Thu 17 Sep", "BOARD PACK CIRCULATED, seven clear days", "Nothing is added after this date. A paper that misses the pack waits for the next meeting.", GOLD),
        ("Thu 24 Sep", "BOARD MEETING, adoption of the instrument suite", "The board sets the thresholds you will then work to.", GOLD),
    ]
    w = PAGE_W - 2 * MX
    y = PAGE_H - 192
    for date, what, note, spine in rows:
        h = 52
        box(c, MX, y - h, w, h, CREAM if spine == GOLD else SURFACE, spine)
        c.setFont("Helvetica-Bold", 11.5)
        c.setFillColor(NAVY)
        c.drawString(MX + 18, y - 24, date)
        para(c, what, MX + 160, y - 20, "Helvetica-Bold", 10.2, NAVY, 300, 12.5)
        para(c, note, MX + 480, y - 20, "Helvetica", 9.8, BODY, w - 500, 12.5)
        y -= h + 6

    c.setFont("Helvetica-Oblique", 10)
    c.setFillColor(MUTED)
    c.drawString(MX, y - 4, "After September: six-weekly to December, then quarterly. The lead times never change. Committees two to three weeks before, pack seven clear days before.")


def slide_who_decides(c):
    chrome(c, 8, "who decides what")
    heading(c, "Reading the delegation of authority")
    para(c,
         "One schedule, one owner per decision. It exists so you can act without asking, and so that the few things "
         "you must not decide alone are written down rather than assumed.",
         MX, PAGE_H - 152, "Helvetica", 13, BODY, PAGE_W - 2 * MX - 20, 18)

    w = PAGE_W - 2 * MX
    cw = (w - 24) / 2

    box(c, MX, 196, cw, 224, SURFACE, TEAL)
    c.setFont("Helvetica-Bold", 13.5)
    c.setFillColor(NAVY)
    c.drawString(MX + 22, 196 + 224 - 30, "The money ladder")
    para(c, "A Naira figure alone tells you who decides. Bands are indicative until the board sets them on 24 September.",
         MX + 22, 196 + 224 - 52, "Helvetica", 10, MUTED, cw - 46, 13)
    bullet_block(c,
                 [("Band 1", "up to N2m per item, inside approved budget. You decide."),
                  ("Band 2", "N2m to N10m. The Afya-HSH Governance Committee decides."),
                  ("Band 3", "N10m to N50m. The board decides."),
                  ("Band 4", "above N50m, or any reserved matter. The board, and the owners where marked.")],
                 MX + 22, 196 + 224 - 82, cw - 46, gap=6, size=10.5, leading=13.5)

    x2 = MX + cw + 24
    box(c, x2, 196, cw, 224, CREAM, GOLD)
    c.setFont("Helvetica-Bold", 13.5)
    c.setFillColor(NAVY)
    c.drawString(x2 + 22, 196 + 224 - 30, "The five rules that catch everything else")
    bullet_block(c,
                 [("Residual.", "Anything not expressly delegated is reserved to the board. Nothing falls through by omission."),
                  ("No splitting.", "Related transactions are added together for banding. A spend cannot be split to stay under a limit."),
                  ("Within authority.", "Outside budget or outside policy escalates, whatever the amount."),
                  ("Dual control.", "Above Band 1, two authorised signatories, and the approver is never the sole executor."),
                  ("Emergency.", "Where a decision cannot wait, the Medical Director acts on clinical emergencies and reports it for ratification at the earliest opportunity.")],
                 x2 + 22, 196 + 224 - 56, cw - 46, gap=4, size=10.5, leading=13.5)

    callout(c, MX, 164, w,
            "When in doubt, escalate. That is a rule in the schedule, not a personal preference. Nobody at Havana is "
            "criticised for putting something up a level.")


def slide_reserved(c):
    chrome(c, 9, "the line you do not cross")
    heading(c, "What never comes to management")
    para(c,
         "However sensible the answer is. Learn this list: it is short, and it is the single most common way a "
         "well-run hospital creates a governance problem for itself.",
         MX, PAGE_H - 152, "Helvetica", 13, BODY, PAGE_W - 2 * MX - 20, 18)

    w = PAGE_W - 2 * MX
    cw = (w - 24) / 2
    top, h = 178, 216

    box(c, MX, top, cw, h, CREAM, GOLD)
    c.setFont("Helvetica-Bold", 14)
    c.setFillColor(NAVY)
    c.drawString(MX + 22, top + h - 30, "Reserved to the board")
    bullet_block(c,
                 [("", "Strategy, the annual business plan, and the budget."),
                  ("", "Opening or closing a service line or a facility."),
                  ("", "Capital projects at Band 3 and above."),
                  ("", "Appointment or removal of the Medical Director, the auditor, and the Company Secretary."),
                  ("", "Borrowing, guarantees, and security over assets."),
                  ("", "Risk appetite and the enterprise risk register."),
                  ("", "The annual operating plan and KPIs under the Afya agreement.")],
                 MX + 22, top + h - 56, cw - 46, gap=3, size=10.5, leading=13.5)

    x2 = MX + cw + 24
    box(c, x2, top, cw, h, SURFACE, TEAL)
    c.setFont("Helvetica-Bold", 14)
    c.setFillColor(TEAL)
    c.drawString(x2 + 22, top + h - 30, "Reserved to the owners")
    bullet_block(c,
                 [("", "Changes to the constitution or the articles."),
                  ("", "Share capital, share issues, and shareholding structure."),
                  ("", "Dividends and distributions."),
                  ("", "Sale, merger, acquisition, or winding up."),
                  ("", "Any change to, or termination of, the Afya management agreement."),
                  ("", "Related-party transactions above Band 4.")],
                 x2 + 22, top + h - 56, cw - 46, gap=5, size=10.5, leading=13.5)

    callout(c, MX, 146, w,
            "Note the Afya agreement sits with the owners, not with the joint committee and not with management. "
            "Nothing in the partnership may be varied, waived, or informally agreed below that level.")


def slide_exception_what(c):
    chrome(c, 10, "reporting by exception")
    heading(c, "Reporting by exception, and what it is not")
    para(c,
         "This is the single biggest change to how you write for the board. Three pages, not thirty. Directors are "
         "there to exercise judgement, and judgement needs the exceptions, not the whole record.",
         MX, PAGE_H - 152, "Helvetica", 13, BODY, PAGE_W - 2 * MX - 20, 18)

    w = PAGE_W - 2 * MX
    cw = (w - 24) / 2
    top, h = 206, 200

    box(c, MX, top, cw, h, HexColor("#FDF2F2"), HexColor("#B4472F"))
    c.setFont("Helvetica-Bold", 14)
    c.setFillColor(HexColor("#7A2E1E"))
    c.drawString(MX + 22, top + h - 30, "Not this")
    bullet_block(c,
                 [("", "A narrative of everything that happened last quarter."),
                  ("", "Every metric listed, on plan and off plan alike."),
                  ("", "Good news first and at length, problems late and softened."),
                  ("", "A verbal update with no paper behind it."),
                  ("", "Data without a view. Numbers with nobody's judgement attached.")],
                 MX + 22, top + h - 58, cw - 46, gap=6, size=11, leading=14)

    x2 = MX + cw + 24
    box(c, x2, top, cw, h, SURFACE, TEAL)
    c.setFont("Helvetica-Bold", 14)
    c.setFillColor(TEAL)
    c.drawString(x2 + 22, top + h - 30, "This")
    bullet_block(c,
                 [("", "Only what is off plan, and what is newly on the horizon."),
                  ("", "Each exception with its cause, its trend, its owner and its date."),
                  ("", "The uncomfortable item stated first, in your own words."),
                  ("", "Your recommendation, so the board decides rather than drafts."),
                  ("", "The full data available underneath, in the committees, on request.")],
                 x2 + 22, top + h - 58, cw - 46, gap=6, size=11, leading=14)

    callout(c, MX, 174, w,
            "The rule that makes the suite work: nothing reaches the board except through one of these instruments. "
            "A verbal update with no paper is not a board item.")


def slide_template(c):
    chrome(c, 11, "instrument 5")
    heading(c, "The management report by exception, section by section")
    para(c,
         "Three pages maximum. Written by the Medical Director with the Afya operational lead. Same six sections every "
         "quarter, so the board learns where to look and reads it in ten minutes.",
         MX, PAGE_H - 152, "Helvetica", 13, BODY, PAGE_W - 2 * MX - 20, 18)

    secs = [
        ("1", "The three things the board should know", "Three bullets. If a director reads nothing else, this is what they must not miss. At least one should be uncomfortable."),
        ("2", "Performance against plan", "Reference the dashboard. Narrate only what is off plan, and answer the four standing questions for each exception."),
        ("3", "What went well, briefly", "Two or three. Boards that only ever hear problems stop being told about them."),
        ("4", "What is coming", "Next quarter: what you expect, and what could knock it off course."),
        ("5", "Where we need the board", "Decisions requested, cross-referenced to board papers. Steers wanted. Anywhere management feels blocked."),
        ("6", "Declared escalations since the last meeting", "What crossed a threshold, when, to whom, and how it was resolved. Nil returns are stated as nil."),
    ]
    w = PAGE_W - 2 * MX
    cw = (w - 20) / 2
    top = PAGE_H - 200
    for i, (num, title, body) in enumerate(secs):
        col, row = i % 2, i // 2
        x = MX + col * (cw + 20)
        y = top - row * 78
        box(c, x, y - 68, cw, 68, SURFACE if i % 2 == 0 else HexColor("#F7FAFC"),
            GOLD if i % 2 == 0 else TEAL)
        c.setFont("Helvetica-Bold", 20)
        c.setFillColor(HexColor("#C3CFDA"))
        c.drawString(x + 16, y - 30, num)
        c.setFont("Helvetica-Bold", 11.5)
        c.setFillColor(NAVY)
        c.drawString(x + 44, y - 22, title)
        para(c, body, x + 44, y - 38, "Helvetica", 9.8, BODY, cw - 62, 12.5)

    c.setFont("Helvetica-Oblique", 10.5)
    c.setFillColor(MUTED)
    c.drawString(MX, 108, "The Word template is instrument 05 in the pack. Do not rebuild it. Do not add sections. If something does not fit the six, it belongs in a committee paper.")


def slide_three_things(c):
    chrome(c, 12, "section 1")
    heading(c, "\"At least one should be uncomfortable\"")
    y = callout(c, MX, PAGE_H - 148, PAGE_W - 2 * MX,
                "A management report in which everything is fine is not reassuring to an experienced board. It is the "
                "thing that makes them start looking elsewhere.",
                bg=CREAM, spine=GOLD, size=13.5, leading=18)

    para(c,
         "Section 1 is three bullets, written last, in plain language. Two worked examples of the same quarter:",
         MX, y - 24, "Helvetica", 12.5, BODY, PAGE_W - 2 * MX, 17)

    w = PAGE_W - 2 * MX
    cw = (w - 24) / 2
    top, h = 132, 196

    box(c, MX, top, cw, h, HexColor("#FDF2F2"), HexColor("#B4472F"))
    c.setFont("Helvetica-Bold", 12)
    c.setFillColor(HexColor("#7A2E1E"))
    c.drawString(MX + 22, top + h - 28, "WEAK")
    bullet_block(c,
                 [("", "\"Activity remained broadly in line with expectations during the period.\""),
                  ("", "\"Some staffing challenges were experienced in certain areas.\""),
                  ("", "\"Work is ongoing to address receivables.\"")],
                 MX + 22, top + h - 54, cw - 46, gap=8, size=11, leading=14)
    c.setFont("Helvetica-Oblique", 10)
    c.setFillColor(MUTED)
    c.drawString(MX + 22, top + 20, "No number, no owner, no date. The board must interrogate to learn anything.")

    x2 = MX + cw + 24
    box(c, x2, top, cw, h, SURFACE, TEAL)
    c.setFont("Helvetica-Bold", 12)
    c.setFillColor(TEAL)
    c.drawString(x2 + 22, top + h - 28, "STRONG")
    bullet_block(c,
                 [("", "\"Theatre utilisation is 54 per cent against a plan of 70. Two lists a week are being lost to anaesthetic cover.\""),
                  ("", "\"Night nursing has been below establishment for eleven of thirteen weeks. I judge this a patient safety risk, not a rota problem.\""),
                  ("", "\"HMO receivables over 90 days have doubled to N83m. I need a board steer on suspending one payer.\"")],
                 x2 + 22, top + h - 54, cw - 46, gap=5, size=10.5, leading=13.5)

    c.setFont("Helvetica-Oblique", 11)
    c.setFillColor(MUTED)
    c.drawString(MX, 100, "The strong version is more exposing and far safer. A board that was told cannot later say it was not.")


def slide_four_questions(c):
    chrome(c, 13, "the drill")
    heading(c, "The four standing questions")
    para(c,
         "Answer them before they are asked. Every director has been taught to put these to every variance, so "
         "answering them in the paper moves the meeting to the decision instead of the interrogation.",
         MX, PAGE_H - 152, "Helvetica", 13, BODY, PAGE_W - 2 * MX - 20, 18)

    qs = [
        ("1", "Why is it different from plan?", "The cause, not the category. \"Locum spend rose\" is a category. \"Two anaesthetists resigned in June and cover is agency\" is a cause."),
        ("2", "Is it one-off, or a trend?", "Show the prior period and the direction of travel. The board treats a trend very differently from a one-off."),
        ("3", "What is being done, by whom, by when?", "A named owner and a date. Without both, it is a hope, and the board will treat it as one."),
        ("4", "What would make it worse?", "The honest downside. This is the question that most reports duck, and the one that most protects you when you answered it early."),
    ]
    w = PAGE_W - 2 * MX
    y = PAGE_H - 198
    for i, (n, q, a) in enumerate(qs):
        h = 66
        box(c, MX, y - h, w, h, SURFACE if i % 2 == 0 else HexColor("#F7FAFC"),
            GOLD if i % 2 == 0 else TEAL)
        c.setFont("Helvetica-Bold", 24)
        c.setFillColor(HexColor("#C3CFDA"))
        c.drawString(MX + 18, y - 44, n)
        c.setFont("Helvetica-Bold", 13.5)
        c.setFillColor(NAVY)
        c.drawString(MX + 54, y - 26, q)
        para(c, a, MX + 54, y - 44, "Helvetica", 10.5, BODY, w - 90, 13.5)
        y -= h + 9

    c.setFont("Helvetica-Oblique", 11)
    c.setFillColor(MUTED)
    c.drawString(MX, y - 12, "Four sentences per exception. That is the whole discipline.")


def slide_honesty_test(c):
    chrome(c, 14, "section 6")
    heading(c, "The honesty test of the whole system")
    y = callout(c, MX, PAGE_H - 148, PAGE_W - 2 * MX,
                "If serious things happened in the quarter and section 6 is empty, the escalation thresholds are not "
                "being used. That is a governance failure whatever the underlying result looked like.",
                bg=HexColor("#FDF2F2"), spine=HexColor("#B4472F"), fg=HexColor("#7A2E1E"),
                size=13.5, leading=18)

    para(c,
         "Section 6 records every threshold crossed since the last meeting: what it was, when it was escalated, to "
         "whom, and how it was resolved. Three things follow from that.",
         MX, y - 26, "Helvetica", 12.5, BODY, PAGE_W - 2 * MX, 17)

    items = [
        ("A nil return is stated as nil.", "Silence is not a nil return. \"No thresholds were crossed this quarter\" is a sentence someone has signed."),
        ("The board reconciles it against what it already knows.", "The Chair, the committee chairs and the Company Secretary receive escalations in real time. Section 6 is where those meet the record."),
        ("It is read as evidence the system works.", "A quarter with four escalations, all handled, reads better to an experienced board than a quarter with none."),
    ]
    y = bullet_block(c, items, MX, y - 66, PAGE_W - 2 * MX - 20, gap=15, size=12.5, leading=16.5)

    callout(c, MX, y + 6, PAGE_W - 2 * MX,
            "Write section 6 first, at the start of the quarter, and add to it as things happen. Reconstructing it "
            "from memory at the end is how items go missing.", bg=CREAM, spine=GOLD)


def slide_escalation(c):
    chrome(c, 15, "escalation")
    heading(c, "What goes up immediately, to whom, and by when")
    para(c,
         "These are the board's proposed defaults, to be set on 24 September. They exist so that nobody has to judge "
         "the moment. If the trigger is met, the clock starts.",
         MX, PAGE_H - 150, "Helvetica", 12.5, BODY, PAGE_W - 2 * MX - 20, 17)

    rows = [
        ("Never event, or a death in unexpected circumstances", "Board Chair and Quality and Clinical Governance chair, then all directors", "Same day"),
        ("Serious clinical incident, or a cluster of related incidents", "Medical Director to the Quality and Clinical Governance chair", "24 hours"),
        ("Regulatory inspection, notice, sanction, or licence issue", "Board Chair and Audit and Risk chair", "24 hours"),
        ("Data or information security breach", "Board Chair, Transformation chair, Audit and Risk chair, and the data protection lead", "24 hours"),
        ("Cash below the set number of days of operating cost", "Board Chair and the Finance co-chairs", "Immediate"),
        ("Budget variance beyond the set threshold", "Finance, Investment and Operations co-chairs", "Next cycle, or immediate"),
        ("Departure or suspension of a senior clinician or executive", "Board Chair and the People and Remuneration chair", "Same day"),
        ("Loss of, or material change to, a significant HMO or corporate contract", "Board Chair and the Finance co-chairs", "48 hours"),
        ("Any proposed change to the Afya agreement", "The board, as a reserved matter", "Before agreement"),
    ]
    w = PAGE_W - 2 * MX
    y = PAGE_H - 182
    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(TEAL)
    c.drawString(MX + 16, y + 6, "TRIGGER")
    c.drawString(MX + 360, y + 6, "ESCALATES TO")
    c.drawString(MX + 650, y + 6, "TIMEFRAME")
    y -= 10
    for i, (trig, to, when) in enumerate(rows):
        h = 34
        box(c, MX, y - h, w, h, SURFACE if i % 2 == 0 else HexColor("#F7FAFC"),
            GOLD if i % 2 == 0 else TEAL, spine_w=4)
        para(c, trig, MX + 16, y - 15, "Helvetica", 9.8, BODY, 335, 12)
        para(c, to, MX + 360, y - 15, "Helvetica", 9.8, BODY, 272, 12)
        para(c, when, MX + 640, y - 15, "Helvetica-Bold", 9.8, NAVY, w - 652, 12)
        y -= h + 5

    c.setFont("Helvetica-Oblique", 10)
    c.setFillColor(MUTED)
    c.drawString(MX, y - 2, "Also: litigation or a claim above the set threshold, and any risk newly rated 15 or above on the register. The full schedule is instrument 10.")


def slide_escalation_rule(c):
    chrome(c, 16, "the rule that makes it work")
    y = heading(c, "Escalating is never penalised")
    para(c,
         "This is the sentence to take away from the session, and the board will say it out loud when it adopts the "
         "schedule on 24 September.",
         MX, y - 14, "Helvetica", 13, BODY, PAGE_W - 2 * MX - 20, 18)

    w = PAGE_W - 2 * MX
    cw = (w - 24) / 2
    top, h = 286, 128

    box(c, MX, top, cw, h, SURFACE, TEAL)
    c.setFont("Helvetica-Bold", 15)
    c.setFillColor(TEAL)
    c.drawString(MX + 24, top + h - 34, "A threshold crossed and escalated")
    para(c, "is the system working. Nobody is criticised for it, and nobody is asked why they bothered. It is recorded "
            "in section 6 and read as evidence that the hospital notices things.",
         MX + 24, top + h - 60, "Helvetica", 12, BODY, cw - 48, 16)

    x2 = MX + cw + 24
    box(c, x2, top, cw, h, HexColor("#FDF2F2"), HexColor("#B4472F"))
    c.setFont("Helvetica-Bold", 15)
    c.setFillColor(HexColor("#7A2E1E"))
    c.drawString(x2 + 24, top + h - 34, "A threshold crossed and not escalated")
    para(c, "is the only version of this that is a disciplinary matter. Not the underlying event. The failure to pass "
            "it on.",
         x2 + 24, top + h - 60, "Helvetica", 12, BODY, cw - 48, 16)

    y2 = callout(c, MX, 262, w,
                 "Which means an escalation is not an admission. It is the thing you were asked to do. The judgement "
                 "the board makes is about the system, not about the messenger.",
                 bg=CREAM, spine=GOLD, size=13, leading=17.5)

    items = [
        ("Escalate on the trigger, not on the outcome.", "You do not wait to see whether it turns out badly. The trigger is the trigger."),
        ("Escalate up, not sideways.", "To the named chair, copied to the Company Secretary, who records it. Not to the director you know best."),
        ("Escalating does not hand over the problem.", "You still own the management response. The board owns knowing about it."),
    ]
    bullet_block(c, items, MX, y2 - 30, w - 20, gap=10, size=11.5, leading=15)


def slide_afya(c):
    chrome(c, 17, "the afya relationship")
    heading(c, "The partnership, and the one structural point")
    y = callout(c, MX, PAGE_H - 148, PAGE_W - 2 * MX,
                "The Afya-HSH Governance Committee is jointly controlled with Afya. It therefore cannot be the board's "
                "only line of sight over Afya's own delivery.",
                bg=CREAM, spine=GOLD, size=13.5, leading=18)

    para(c,
         "This is not distrust of the partner. It is the same principle that stops any executive from being the sole "
         "assurance over their own work. Three consequences for how you operate.",
         MX, y - 24, "Helvetica", 12.5, BODY, PAGE_W - 2 * MX, 17)

    cols = [
        ("The joint committee runs the partnership", "Monthly, first Tuesday. Operational performance against the agreed KPI set, milestones, service issues, and decisions taken under delegation. It reports to the board on one page, in the same format as every committee.", SURFACE, TEAL),
        ("The board keeps its own read", "Audit and Risk takes an independent view of Afya's financial delivery, and Quality and Clinical Governance of the clinical side. Expect to be asked for the same numbers twice, by two bodies, for different purposes.", CREAM, GOLD),
        ("The agreement itself is untouchable below the owners", "The operating plan and KPIs are approved by the board. Any change to the agreement is reserved to the shareholders. Nothing is varied by practice, by custom, or by a helpful email.", SURFACE, TEAL),
    ]
    w = PAGE_W - 2 * MX
    cw = (w - 40) / 3
    top, h = 146, 182
    for i, (title, text, bg, spine) in enumerate(cols):
        x = MX + i * (cw + 20)
        box(c, x, top, cw, h, bg, spine)
        ty = para(c, title, x + 20, top + h - 28, "Helvetica-Bold", 12.5, NAVY, cw - 40, 16)
        para(c, text, x + 20, ty - 8, "Helvetica", 10.5, BODY, cw - 40, 14)

    c.setFont("Helvetica-Oblique", 10.5)
    c.setFillColor(MUTED)
    c.drawString(MX, 116, "For the Afya leads in the room: you report in as operators, and the board assures the delivery separately. Both are normal, and both are in the agreement.")


def slide_challenge(c):
    chrome(c, 18, "being challenged")
    heading(c, "Being challenged well")
    para(c,
         "The board's job is to hold management to account. Done properly it is uncomfortable and impersonal. Here is "
         "what to expect, and how the strongest executives handle it.",
         MX, PAGE_H - 152, "Helvetica", 13, BODY, PAGE_W - 2 * MX - 20, 18)

    items = [
        ("Challenge is about the paper, not about you.", "A director pressing on a variance is discharging a legal duty of care. It is not a signal of lost confidence."),
        ("\"I do not know, I will come back by Friday\" is a strong answer.", "A guess that turns out wrong costs far more credibility than a date. Then meet the date, through the Company Secretary, so it is on the action log."),
        ("Never take an instruction from a single director.", "However senior, however reasonable. The board acts through minuted decisions and through the Chair. Route it, and disclose that you were approached."),
        ("The in-camera session is routine, not an event.", "The non-executives sit alone for ten minutes at the end of every meeting, with no executives and no Afya present. It happens every time, from the first meeting, precisely so that it never means anything in particular."),
        ("Bring the recommendation, not only the problem.", "Section 5 exists for this. A board asked to decide between your two options will decide. A board handed an open problem will discuss it and defer."),
    ]
    y = bullet_block(c, items, MX, PAGE_H - 200, PAGE_W - 2 * MX - 20, gap=13, size=12, leading=15.5)

    callout(c, MX, y - 8, PAGE_W - 2 * MX,
            "An executive who is never challenged is not being governed. If a quarter passes with no hard questions, "
            "something has gone wrong upstairs, not right downstairs.", bg=CREAM, spine=GOLD)


def slide_practice(c):
    chrome(c, 19, "practice")
    heading(c, "Practice: what do you do, to whom, and by when?")
    para(c,
         "Take these in pairs, five minutes, then we work them together. For each one: is this yours to decide, and "
         "does anything escalate, to whom, within what time?",
         MX, PAGE_H - 152, "Helvetica", 13, BODY, PAGE_W - 2 * MX - 20, 18)

    cases = [
        "The CT scanner fails on a Friday. Repair is quoted at N7.4 million and the vendor wants a decision today.",
        "A patient dies unexpectedly after a routine procedure. The next board meeting is in five weeks.",
        "Night nursing has been below establishment for eleven of the last thirteen weeks.",
        "An Afya operational lead asks you to reallocate two theatre lists to a visiting surgeon on a revenue-share the agreement does not mention.",
        "HMO receivables over ninety days have doubled since the last quarter.",
        "A director telephones you at home and asks you to expedite a relative's admission.",
        "You need three additional beds' worth of equipment, N1.8 million, and it is in the approved budget.",
        "A staff member emails a spreadsheet of patient records to a personal account to work at home.",
    ]
    w = PAGE_W - 2 * MX
    cw = (w - 20) / 2
    top = PAGE_H - 200
    for i, txt in enumerate(cases):
        col, row = i % 2, i // 2
        x = MX + col * (cw + 20)
        y = top - row * 62
        box(c, x, y - 52, cw, 52, SURFACE if (i % 2 == 0) else HexColor("#F7FAFC"),
            GOLD if i % 2 == 0 else TEAL)
        c.setFont("Helvetica-Bold", 12)
        c.setFillColor(HexColor("#9AA8B5"))
        c.drawString(x + 18, y - 22, str(i + 1))
        para(c, txt, x + 40, y - 20, "Helvetica", 10.5, BODY, cw - 60, 13.5)

    c.setFont("Helvetica-Oblique", 10.5)
    c.setFillColor(MUTED)
    c.drawString(MX, 128, "Answer with the instrument, not the instinct. Point to the band, the reserved matter, or the escalation trigger.")


def slide_asks(c):
    chrome(c, 20, "what we ask of you")
    heading(c, "Six things, from September")
    para(c,
         "The board adopts the suite on 24 September. These are the commitments that make it real on the management "
         "side, and the People and Remuneration Committee receives assurance that they are being met.",
         MX, PAGE_H - 152, "Helvetica", 12.5, BODY, PAGE_W - 2 * MX - 20, 17)

    items = [
        ("Use the templates as they are.", "Instrument 5 for the board, the committee report for committees, the dashboard monthly. Do not rebuild them and do not add sections."),
        ("Hit the lead times.", "Committee papers five working days ahead, the management report to the Company Secretary by Monday 14 September, and nothing added after the pack goes out on the 17th."),
        ("Answer the four standing questions in the paper.", "Every exception, every time, with a named owner and a date."),
        ("Escalate on the trigger, the same day where the schedule says so.", "To the named chair, copied to the Company Secretary. Then record it in section 6."),
        ("Keep the record.", "Decisions taken under delegation, the risk register you own, and the registers the Company Secretary maintains. If it is not written down, it did not happen."),
        ("Tell the board what you need.", "Section 5 is not decoration. A blocked executive who did not say so is a governance failure too."),
    ]
    y = bullet_block(c, items, MX, PAGE_H - 196, PAGE_W - 2 * MX - 20, gap=11, size=11.8, leading=15)

    callout(c, MX, y + 4, PAGE_W - 2 * MX,
            "The test of this programme is not that we all sat through it. It is that the meeting on 24 September runs "
            "on paper that was read, exceptions that were challenged, and decisions recorded with their reasons.",
            bg=CREAM, spine=GOLD, size=12.5, leading=17)

    c.setFillColor(GOLD)
    c.rect(MX, 92, 30, 2, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 15)
    c.setFillColor(NAVY)
    c.drawString(MX, 66, "Questions.")
    c.setFont("Helvetica", 10.5)
    c.setFillColor(MUTED)
    c.drawString(MX, 48, "Dr Debo Odulana, Independent Non-Executive Director. Consult for Africa.")


# ----------------------------------------------------------- build -----------
def build():
    c = canvas.Canvas(str(OUT), pagesize=landscape(A4))
    c.setTitle("HSH Governance Training, Module 10: The Management Interface")
    c.setAuthor("Consult for Africa")
    c.setSubject("Havana Specialist Hospital management reporting, escalation, and the Afya relationship")

    slides = [
        slide_cover, slide_why_you, slide_objectives, slide_where_you_sit,
        slide_four_jobs, slide_flow, slide_calendar, slide_who_decides,
        slide_reserved, slide_exception_what, slide_template, slide_three_things,
        slide_four_questions, slide_honesty_test, slide_escalation,
        slide_escalation_rule, slide_afya, slide_challenge, slide_practice,
        slide_asks,
    ]
    for fn in slides:
        fn(c)
        c.showPage()
    c.save()
    print("Wrote %s (%d slides)" % (OUT, len(slides)))


if __name__ == "__main__":
    build()
