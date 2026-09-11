"""
Build the HSH Governance Training MODULE 3 teaching deck for Consult for Africa.

Module 3, "Governing versus managing, and the HSH operating model".
Cohorts A (the full board) and C (management and the secretariat). ~2 hours.
Faculty: Consult for Africa (Dr Debo Odulana).

Runs immediately after Barr. Gesiye Otuogha's M1 (CAMA 2020 and the company as a
legal person), and deliberately picks up where M1 ends: the three organs of the
company. M1 says what the board legally is; M3 says what it actually does here.

Source: docs/hsh-governance-training-curriculum-cfa.md (M3 learning objectives)
        docs/hsh-board-operating-model-cfa.md (the model being taught)
Output: docs/hsh-m3-governing-vs-managing-cfa.pdf  (A4 landscape, branded slides)

Run:
  python3 scripts/build-hsh-m3-deck.py
"""

from __future__ import annotations

from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
OUT = DOCS / "hsh-m3-governing-vs-managing-cfa.pdf"
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
TOTAL = "18"
FOOTER = ("Consult for Africa   /   Confidential   /   Havana Specialist Hospital  /  "
          "Governance Training, Module 3")


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
        c.drawImage(img, MX, PAGE_H - 70 - dh + 20, width=dw, height=dh,
                    mask="auto")
    except Exception:
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", 13)
        c.drawString(MX, PAGE_H - 64, "CONSULT FOR AFRICA")

    c.setFillColor(GOLD)
    c.rect(MX, PAGE_H - 188, 44, 3, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(GOLD)
    c.drawString(MX + 56, PAGE_H - 191, "MODULE 3  /  GOVERNANCE TRAINING  /  COHORTS A AND C")

    c.setFont("Helvetica-Bold", 44)
    c.setFillColor(white)
    c.drawString(MX, PAGE_H - 248, "Governing versus managing")
    c.setFont("Helvetica-Bold", 19)
    c.setFillColor(LIGHT)
    c.drawString(MX, PAGE_H - 282, "The HSH operating model, and the line between the board and the hospital")

    para(c,
         "Barr. Otuogha has just set out what the company is in law, and its three organs: the members who own it, "
         "the board that directs it, and the management that runs it. This session takes the middle organ and makes it "
         "practical. What does this board actually do, how does it direct a hospital it meets in only four times a year, "
         "and where exactly does governing stop and managing begin.",
         MX, PAGE_H - 326, "Helvetica", 13, LIGHT, 640, 19)

    c.setFillColor(GOLD)
    c.rect(MX, 96, 30, 2, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 12)
    c.setFillColor(white)
    c.drawString(MX, 70, "Dr Debo Odulana, Independent Non-Executive Director")
    c.setFont("Helvetica", 10.5)
    c.setFillColor(LIGHT)
    c.drawString(MX, 52, "Consult for Africa   /   13 August 2026   /   approximately two hours, working session   /   Confidential")


def slide_where_we_are(c):
    chrome(c, 2, "the handoff")
    heading(c, "Where this session sits")
    para(c,
         "The law first, then the craft. That sequencing is deliberate: every later module leans on what you have "
         "just heard.",
         MX, PAGE_H - 148, "Helvetica", 13, BODY, PAGE_W - 2 * MX - 20, 18)

    w = PAGE_W - 2 * MX
    cw = (w - 24) / 2

    # left: what M1 established
    box(c, MX, 232, cw, 190, SURFACE, TEAL)
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(TEAL)
    c.drawString(MX + 22, 232 + 190 - 26, "JUST COVERED, MODULE 1")
    c.setFont("Helvetica-Bold", 15)
    c.setFillColor(NAVY)
    c.drawString(MX + 22, 232 + 190 - 50, "The company in law")
    bullet_block(c,
                 [("", "HSH is a separate legal person, distinct from both founding families."),
                  ("", "Three organs: the members in general meeting, the board, and management."),
                  ("", "The board's authority comes from the Act and the articles, not from anyone's goodwill."),
                  ("", "Statutory registers, records, and filings must be kept.")],
                 MX + 22, 232 + 108, cw - 46, gap=6, size=10.5, leading=13.5)

    # right: what M3 does with it
    x2 = MX + cw + 24
    box(c, x2, 232, cw, 190, CREAM, GOLD)
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(HexColor("#8A6D1F"))
    c.drawString(x2 + 22, 232 + 190 - 26, "THIS SESSION, MODULE 3")
    c.setFont("Helvetica-Bold", 15)
    c.setFillColor(NAVY)
    c.drawString(x2 + 22, 232 + 190 - 50, "The board in practice")
    bullet_block(c,
                 [("", "What this board is for, and the four jobs it holds."),
                  ("", "The architecture: the board, its five committees, and the Afya-HSH Governance Committee."),
                  ("", "Who decides what, read off the delegation of authority."),
                  ("", "What management owes the board, and what the board will not reach into.")],
                 x2 + 22, 232 + 108, cw - 46, gap=6, size=10.5, leading=13.5)

    callout(c, MX, 200, w,
            "The duty Barr. Otuogha described, to act with reasonable care, skill and diligence, is discharged through "
            "the model in this session. Governing well is how a director stays safe.")


def slide_objectives(c):
    chrome(c, 3, "learning objectives")
    heading(c, "What you will be able to do by the end")
    y = PAGE_H - 152
    items = [
        ("1.", "State the difference between governing and managing, and apply the \"which hat am I wearing\" test to a live example."),
        ("2.", "Describe the HSH two-tier architecture: the quarterly board, the five board committees, and the monthly Afya-HSH Governance Committee beneath it."),
        ("3.", "Explain the four jobs of this board, and point to where each one lives in the model."),
        ("4.", "Explain how a board directs a complex hospital while meeting only quarterly, through delegation, reporting, and committees working continuously underneath it."),
        ("5.", "Read the delegation of authority schedule and say who decides what, including the matters the board reserves to itself."),
        ("6.", "For management: say what the board needs from you, and what you can expect the board not to reach into."),
    ]
    y = bullet_block(c, items, MX, y, PAGE_W - 2 * MX - 20, gap=13, size=12.5, leading=16.5)
    callout(c, MX, y - 2, PAGE_W - 2 * MX,
            "These are things you will be able to do, not topics we will have covered. We test them in the week six mock.",
            bg=CREAM, spine=GOLD)


def slide_distinction(c):
    chrome(c, 4, "the core distinction")
    heading(c, "Governing is not managing")
    para(c,
         "Both are demanding. Neither outranks the other. They are different jobs, and the board fails when it does the "
         "second one.",
         MX, PAGE_H - 152, "Helvetica", 13, BODY, PAGE_W - 2 * MX - 20, 18)

    w = PAGE_W - 2 * MX
    cw = (w - 22) / 2
    top, h = 190, 220

    box(c, MX, top, cw, h, SURFACE, NAVY)
    c.setFont("Helvetica-Bold", 17)
    c.setFillColor(NAVY)
    c.drawString(MX + 24, top + h - 34, "The board governs")
    bullet_block(c,
                 [("Direction.", "Sets strategy, approves the budget, sets risk appetite."),
                  ("Oversight.", "Monitors delivery against the plan it approved."),
                  ("Accountability.", "Holds management and Afya to account for results."),
                  ("Assurance.", "Satisfies itself, independently, that what it is told is true."),
                  ("Stewardship.", "Protects the owners, the mission, and the licence to operate.")],
                 MX + 24, top + h - 62, cw - 48, gap=7, size=11, leading=14)

    x2 = MX + cw + 22
    box(c, x2, top, cw, h, SURFACE, TEAL)
    c.setFont("Helvetica-Bold", 17)
    c.setFillColor(TEAL)
    c.drawString(x2 + 24, top + h - 34, "Management operates")
    bullet_block(c,
                 [("Execution.", "Runs the hospital day to day, within the approved budget."),
                  ("Decisions.", "Makes the operational calls, thousands of them, between meetings."),
                  ("Reporting.", "Tells the board the truth early, against a standard template."),
                  ("Escalation.", "Raises what crosses a threshold, without waiting to be asked."),
                  ("Delivery.", "Owns the result, and is answerable for it.")],
                 x2 + 24, top + h - 62, cw - 48, gap=7, size=11, leading=14)

    callout(c, MX, 160, w,
            "The board's job is to be sure the hospital is well run. It is not to run it. A board that starts managing "
            "loses the distance it needs to hold anyone to account, and there is then nobody left doing the board's job.")


def slide_which_hat(c):
    chrome(c, 5, "the test")
    heading(c, "The test: which hat am I wearing?")
    para(c,
         "Several of us hold more than one role here. The test is not about who you are, it is about what the room is "
         "doing at that moment. Ask it out loud, and it costs nothing.",
         MX, PAGE_H - 152, "Helvetica", 13, BODY, PAGE_W - 2 * MX - 20, 18)

    w = PAGE_W - 2 * MX
    cw = (w - 24) / 2

    box(c, MX, 214, cw, 178, CREAM, GOLD)
    c.setFont("Helvetica-Bold", 15)
    c.setFillColor(NAVY)
    c.drawString(MX + 22, 214 + 178 - 30, "You are governing when you ask")
    bullet_block(c,
                 [("", "Is this the right direction for the hospital?"),
                  ("", "How will we know whether it worked?"),
                  ("", "What is the risk, and who owns it?"),
                  ("", "Is the person accountable for this the right person, properly supported?"),
                  ("", "Am I satisfied by the evidence, or only by the reassurance?")],
                 MX + 22, 214 + 178 - 56, cw - 46, gap=5, size=11, leading=14)

    x2 = MX + cw + 24
    box(c, x2, 214, cw, 178, SURFACE, TEAL)
    c.setFont("Helvetica-Bold", 15)
    c.setFillColor(NAVY)
    c.drawString(x2 + 22, 214 + 178 - 30, "You have slipped into managing when")
    bullet_block(c,
                 [("", "You are choosing the supplier rather than the policy."),
                  ("", "You are instructing someone who does not report to the board."),
                  ("", "You are solving the problem instead of assuring yourself it will be solved."),
                  ("", "You took the call directly, and management hears it from the staff member."),
                  ("", "You are in the detail because it interests you, not because it is material.")],
                 x2 + 22, 214 + 178 - 56, cw - 46, gap=5, size=11, leading=14)

    callout(c, MX, 182, w,
            "A director speaks with authority only in a properly constituted meeting, as part of the board. Alone, in a "
            "corridor or on the phone, you are one voice and not an instruction. That is the law and it is also the manners.")


def slide_md_example(c):
    chrome(c, 6, "worked example")
    heading(c, "The Medical Director's two hats")
    para(c,
         "Dr Iwuala sits on both sides of the line, and does so entirely properly. Naming which hat is on, in the room, is "
         "what keeps it clean.",
         MX, PAGE_H - 152, "Helvetica", 13, BODY, PAGE_W - 2 * MX - 20, 18)

    w = PAGE_W - 2 * MX
    cw = (w - 24) / 2

    box(c, MX, 226, cw, 172, SURFACE, NAVY)
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(NAVY)
    c.drawString(MX + 22, 226 + 172 - 24, "HAT ONE")
    c.setFont("Helvetica-Bold", 16)
    c.setFillColor(NAVY)
    c.drawString(MX + 22, 226 + 172 - 48, "Director of the company")
    bullet_block(c,
                 [("", "Owes duties to HSH as a whole, not to the medical function."),
                  ("", "Votes on strategy, budget, and risk with the other seven directors."),
                  ("", "Must be able to challenge a report she also had a hand in."),
                  ("", "Shares collective responsibility for every board decision.")],
                 MX + 22, 226 + 172 - 74, cw - 46, gap=6, size=11, leading=14)

    x2 = MX + cw + 24
    box(c, x2, 226, cw, 172, SURFACE, TEAL)
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(TEAL)
    c.drawString(x2 + 22, 226 + 172 - 24, "HAT TWO")
    c.setFont("Helvetica-Bold", 16)
    c.setFillColor(TEAL)
    c.drawString(x2 + 22, 226 + 172 - 48, "Executive clinical lead")
    bullet_block(c,
                 [("", "Reports in to the board and to the Quality and Clinical Governance Committee."),
                  ("", "Is held to account for clinical quality and safety delivery."),
                  ("", "Provides the evidence; the committee independently assures it."),
                  ("", "Does not assure her own work, which is why Prof Ezechi chairs that committee.")],
                 x2 + 22, 226 + 172 - 74, cw - 46, gap=6, size=11, leading=14)

    callout(c, MX, 194, w,
            "The same principle applies to every one of us who wears two hats, including me. I am a director here and "
            "Consult for Africa is a paid adviser, so I recuse from any decision on our own fees or scope. Say it, "
            "register it, step out. That is the whole discipline.",
            bg=CREAM, spine=GOLD, size=12)


def slide_four_jobs(c):
    chrome(c, 7, "the mandate")
    heading(c, "The four jobs of the HSH board")
    para(c,
         "Everything the board does should be traceable to one of these four. If a proposed agenda item is not, ask why "
         "it is on the agenda.",
         MX, PAGE_H - 152, "Helvetica", 13, BODY, PAGE_W - 2 * MX - 20, 18)

    w = PAGE_W - 2 * MX
    cw = (w - 3 * 16) / 4
    top, h = 224, 176
    jobs = [
        ("01", "Oversee Afya\npartnership delivery",
         "Hold the operating partner to the agreement and to the numbers, with an independent read of our own."),
        ("02", "Secure long-term\ngrowth and sustainability",
         "Build a hospital that stands with or without any single partner. Strategy, capital, service lines."),
        ("03", "Build credibility,\nnetworks, and influence",
         "Reputation, standards, accreditation, and the relationships that a specialist hospital lives on."),
        ("04", "Protect the owners'\ninterests",
         "Both founding families, through ownership, reserved matters, and fair process. Not through daily control."),
    ]
    for i, (num, title, blurb) in enumerate(jobs):
        x = MX + i * (cw + 16)
        box(c, x, top, cw, h, SURFACE, GOLD if i % 2 == 0 else TEAL)
        c.setFont("Helvetica-Bold", 26)
        c.setFillColor(HexColor("#C9D6E0"))
        c.drawString(x + 20, top + h - 40, num)
        ty = top + h - 66
        for ln in title.split("\n"):
            c.setFont("Helvetica-Bold", 13.5)
            c.setFillColor(NAVY)
            c.drawString(x + 20, ty, ln)
            ty -= 17
        para(c, blurb, x + 20, ty - 8, "Helvetica", 10.5, BODY, cw - 40, 13.5)

    callout(c, MX, 192, w,
            "Job four is the one most often misread. Protecting the owners does not mean managing the hospital on their "
            "behalf. It means a disciplined board, real challenge, and clean process, because that is what protects the "
            "value of the asset both families own.")


def slide_architecture(c):
    chrome(c, 8, "the architecture")
    heading(c, "How the whole system fits together", size=25)

    w = PAGE_W - 2 * MX
    cx = PAGE_W / 2

    def connector(y0, y1):
        c.setFillColor(GOLD)
        c.rect(cx - 2, y0, 4, y1 - y0, fill=1, stroke=0)

    # Board
    box(c, MX, 400, w, 46, NAVY)
    c.setFont("Helvetica-Bold", 15)
    c.setFillColor(white)
    c.drawCentredString(cx, 418, "HSH BOARD")
    c.setFont("Helvetica", 10)
    c.setFillColor(LIGHT)
    c.drawCentredString(cx, 406, "Quarterly  ·  consolidated pack  ·  by exception  ·  final authority on reserved matters")

    connector(378, 400)

    # Committees band
    box(c, MX, 306, w, 72, SURFACE, TEAL)
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(TEAL)
    c.drawString(MX + 20, 362, "TIER 1  ·  FIVE BOARD COMMITTEES  ·  NON-EXECUTIVE LED  ·  REPORT TO THE BOARD")
    names = ["Finance, Investment and Operations", "Audit and Risk", "Quality and Clinical Governance",
             "People and Remuneration", "Transformation and Digital"]
    pad, gapx = 14, 8
    bw = (w - 2 * pad - 4 * gapx) / 5
    for i, nm in enumerate(names):
        bx = MX + pad + i * (bw + gapx)
        box(c, bx, 314, bw, 40, white)
        centred_lines(c, nm, bx + bw / 2, 314 + 40 - 14, bw - 12, "Helvetica-Bold", 8, NAVY, 9.5)

    connector(280, 306)

    # Afya-HSH Governance Committee
    box(c, MX, 226, w, 54, HexColor("#E3EEF1"), TEAL)
    c.setFont("Helvetica-Bold", 14)
    c.setFillColor(NAVY)
    c.drawCentredString(cx, 258, "AFYA-HSH GOVERNANCE COMMITTEE")
    c.setFont("Helvetica", 10)
    c.setFillColor(BODY)
    c.drawCentredString(cx, 244, "Monthly  ·  jointly staffed with Afya Care  ·  operational governance within limits set by the board")
    c.setFont("Helvetica", 9)
    c.setFillColor(MUTED)
    c.drawCentredString(cx, 232, "Tier 2 operating functions beneath it: Performance Review, Quality Assurance, Hospital Manager, Clinical Administrator")

    connector(200, 226)

    # Management
    box(c, MX, 154, w, 46, SURFACE)
    c.setFont("Helvetica-Bold", 13)
    c.setFillColor(NAVY)
    c.drawCentredString(cx, 176, "MANAGEMENT  ·  HSH executive and the Afya Care executive")
    c.setFont("Helvetica", 10)
    c.setFillColor(BODY)
    c.drawCentredString(cx, 162, "Runs the hospital daily, within the delegation of authority")

    connector(130, 154)

    box(c, MX, 92, w, 38, HexColor("#EFF3F6"))
    c.setFont("Helvetica-Bold", 12)
    c.setFillColor(MUTED)
    c.drawCentredString(cx, 106, "FRONTLINE CLINICAL AND OPERATIONAL ACTIVITY")

    c.setFont("Helvetica-Oblique", 10)
    c.setFillColor(MUTED)
    c.drawCentredString(cx, 70, "Information is consolidated and filtered at each step, so that it reaches the board decision-ready rather than raw.")


def slide_one_rule(c):
    chrome(c, 9, "the sorting rule")
    heading(c, "One rule sorts every committee")
    y = callout(c, MX, PAGE_H - 148, PAGE_W - 2 * MX,
                "A committee is a board committee only if the board has delegated it authority to oversee or assure on "
                "the board's behalf, and it reports to the board. Everything else is an operating committee.",
                bg=CREAM, spine=GOLD, size=13.5, leading=18)

    w = PAGE_W - 2 * MX
    cw = (w - 24) / 2
    top, h = 150, 180

    box(c, MX, top, cw, h, SURFACE, NAVY)
    c.setFont("Helvetica-Bold", 15)
    c.setFillColor(NAVY)
    c.drawString(MX + 22, top + h - 30, "Tier 1, board committees")
    bullet_block(c,
                 [("", "Few, by design. Five."),
                  ("", "Chaired by a non-executive, or co-chaired where the board has said so."),
                  ("", "Delegated authority in a written terms of reference."),
                  ("", "Reports to the board, in writing, one page, every quarter."),
                  ("", "Exists to oversee and to assure, never to deliver.")],
                 MX + 22, top + h - 56, cw - 46, gap=5, size=11, leading=14)

    x2 = MX + cw + 24
    box(c, x2, top, cw, h, SURFACE, TEAL)
    c.setFont("Helvetica-Bold", 15)
    c.setFillColor(TEAL)
    c.drawString(x2 + 22, top + h - 30, "Tier 2, operating committees")
    bullet_block(c,
                 [("", "As many as running the hospital genuinely needs."),
                  ("", "Chaired by an executive or by Afya."),
                  ("", "Meets on an operational cadence, weekly or monthly."),
                  ("", "Reports into the Afya-HSH Governance Committee, not to the board."),
                  ("", "Reaches the board only inside a consolidated report.")],
                 x2 + 22, top + h - 56, cw - 46, gap=5, size=11, leading=14)

    c.setFont("Helvetica-Oblique", 11)
    c.setFillColor(MUTED)
    para(c,
         "Every committee reports to exactly one parent. When a new committee is proposed, from any direction, apply "
         "the rule before agreeing to it. Most proposals are Tier 2.",
         MX, 120, "Helvetica-Oblique", 11, MUTED, w, 14)


def slide_committees(c):
    chrome(c, 10, "tier 1")
    heading(c, "The five board committees, and what each is for")
    rows = [
        ("Finance, Investment and Operations", "Performance",
         "Management accounts, budget monitoring, capital and investment appraisal, operational delivery. Quarterly."),
        ("Audit and Risk", "Assurance",
         "Financial statements, internal control, external audit, the enterprise risk register, related-party transactions. Quarterly plus audit planning."),
        ("Quality and Clinical Governance", "Assurance",
         "Clinical quality and safety metrics, incidents and learning, credentialing, accreditation readiness. Quarterly."),
        ("People and Remuneration", "Stewardship",
         "Board composition and succession, appointments, remuneration, board evaluation, the conflicts register. Twice a year."),
        ("Transformation and Digital", "Time-boxed",
         "The digital and operational transformation while it is live, with a defined review date. Monthly, then quarterly."),
    ]
    y = PAGE_H - 160
    w = PAGE_W - 2 * MX
    for i, (name, kind, remit) in enumerate(rows):
        h = 54
        box(c, MX, y - h, w, h, SURFACE if i % 2 == 0 else HexColor("#F7FAFC"),
            TEAL if kind == "Assurance" else GOLD)
        c.setFont("Helvetica-Bold", 13)
        c.setFillColor(NAVY)
        c.drawString(MX + 20, y - 22, name)
        c.setFont("Helvetica-Bold", 8.5)
        c.setFillColor(TEAL if kind == "Assurance" else HexColor("#8A6D1F"))
        c.drawString(MX + 20, y - 36, kind.upper())
        para(c, remit, MX + 268, y - 22, "Helvetica", 10.5, BODY, w - 292, 13.5)
        y -= h + 8

    c.setFont("Helvetica-Oblique", 10.5)
    c.setFillColor(MUTED)
    c.drawString(MX, y - 16,
                 "Performance looks forward and decides. Assurance looks back and checks, independently of the people who did the work. Keeping the two apart is the point.")


def slide_quarterly(c):
    chrome(c, 11, "the mechanism")
    heading(c, "Directing a hospital on four meetings a year")
    para(c,
         "The board is not absent between meetings. Three mechanisms carry its authority continuously.",
         MX, PAGE_H - 152, "Helvetica", 13, BODY, PAGE_W - 2 * MX - 20, 18)

    w = PAGE_W - 2 * MX
    cw = (w - 2 * 18) / 3
    top, h = 214, 190
    cols = [
        ("Delegation", GOLD,
         ["A written delegation of authority says who may decide what, and to what value.",
          "Management decides inside it without asking, and that is not weakness, it is design.",
          "What sits outside it cannot be settled anywhere but the board."]),
        ("Reporting", TEAL,
         ["Fixed one-page templates: metrics against target, exceptions, risks, decisions needed.",
          "By exception, not everything. A full data dump is a way of hiding.",
          "Pre-agreed thresholds trigger escalation without anyone having to judge the moment."]),
        ("Committees", NAVY,
         ["Five committees working continuously beneath the quarterly board.",
          "They do the depth the board cannot do in one sitting, and report one page up.",
          "Serious matters do not wait for the next quarter. They escalate immediately."]),
    ]
    for i, (title, col, pts) in enumerate(cols):
        x = MX + i * (cw + 18)
        box(c, x, top, cw, h, SURFACE, col)
        c.setFont("Helvetica-Bold", 17)
        c.setFillColor(NAVY)
        c.drawString(x + 22, top + h - 34, title)
        bullet_block(c, [("", p) for p in pts], x + 22, top + h - 62, cw - 46,
                     gap=8, size=11, leading=14)

    callout(c, MX, 184, w,
            "During the establishment phase the board may sit six-weekly for the first two or three meetings, then "
            "settle to quarterly. The Company Secretary publishes a rolling twelve-month calendar so committees feed "
            "the board in the right order.")


def slide_reserved(c):
    chrome(c, 12, "reserved matters")
    heading(c, "What the board keeps for itself")
    para(c,
         "These cannot be settled by management, and they cannot be settled in the Afya-HSH Governance Committee "
         "alone. This list is the line the partnership cannot cross.",
         MX, PAGE_H - 152, "Helvetica", 13, BODY, PAGE_W - 2 * MX - 20, 18)

    w = PAGE_W - 2 * MX
    cw = (w - 24) / 2
    top, h = 178, 208

    box(c, MX, top, cw, h, CREAM, GOLD)
    c.setFont("Helvetica-Bold", 15)
    c.setFillColor(NAVY)
    c.drawString(MX + 22, top + h - 30, "Reserved to the board")
    bullet_block(c,
                 [("", "Strategy and the annual budget."),
                  ("", "Capital expenditure above the threshold."),
                  ("", "Any change to the Afya partnership or management agreement."),
                  ("", "Senior executive and Medical Director appointments."),
                  ("", "Opening or closing a service line."),
                  ("", "Borrowing, and distributions to the owners."),
                  ("", "Related-party transactions above the threshold.")],
                 MX + 22, top + h - 56, cw - 46, gap=4, size=11, leading=14)

    x2 = MX + cw + 24
    box(c, x2, top, cw, h, SURFACE, TEAL)
    c.setFont("Helvetica-Bold", 15)
    c.setFillColor(TEAL)
    c.drawString(x2 + 22, top + h - 30, "Delegated to management and Afya")
    bullet_block(c,
                 [("", "Operational spend within budget and within threshold."),
                  ("", "Day-to-day clinical and operational decisions."),
                  ("", "Hiring below senior level."),
                  ("", "Supplier selection within policy."),
                  ("", "The hundreds of judgements a hospital makes each week.")],
                 x2 + 22, top + h - 70, cw - 46, gap=6, size=11, leading=14)

    callout(c, MX, 146, w,
            "The schedule is owned by the People and Remuneration Committee and administered by the Company Secretary. "
            "It is a live instrument. If a threshold is wrong in practice, the answer is to change it at the board, "
            "not to work around it.")


def slide_afya_sight(c):
    chrome(c, 13, "the structural point")
    heading(c, "The one structural point that must not be missed")
    y = callout(c, MX, PAGE_H - 148, PAGE_W - 2 * MX,
                "The Afya-HSH Governance Committee is jointly controlled with Afya. It therefore cannot be HSH's only "
                "assurance over Afya's own delivery.",
                bg=CREAM, spine=GOLD, size=13.5, leading=18)

    para(c,
         "If the board only ever sees the partner's performance through a body the partner co-chairs, then the first of "
         "the board's four jobs is compromised on day one. The model answers this in three places.",
         MX, y - 24, "Helvetica", 12.5, BODY, PAGE_W - 2 * MX, 17)

    items = [
        ("Independent committee read.", "Audit and Risk reads the numbers, and Quality and Clinical Governance reads clinical quality, on HSH's own account and not through the joint committee."),
        ("A standing board item.", "Every quarter the board takes Afya partnership performance as a named agenda item, informed by both the joint committee's report and its own committees."),
        ("Reserved matters.", "Any change to the Afya agreement comes to the board. The partnership cannot quietly reshape its own terms."),
    ]
    y2 = bullet_block(c, items, MX, y - 92, PAGE_W - 2 * MX - 20, gap=14, size=12.5, leading=16.5)

    c.setFont("Helvetica-Oblique", 11.5)
    c.setFillColor(MUTED)
    para(c,
         "None of this implies distrust of Afya. A partnership survives on clarity, and it is far easier to have a "
         "good relationship with a partner when both sides know exactly who is assuring what.",
         MX, y2 - 6, "Helvetica-Oblique", 11.5, MUTED, PAGE_W - 2 * MX, 15)


def slide_mgmt_needs(c):
    chrome(c, 14, "for management")
    heading(c, "What the board needs from management")
    para(c,
         "Being governed well is a skill, and it is largely a reporting skill. Five things make a board effective, and "
         "management supplies four of them.",
         MX, PAGE_H - 152, "Helvetica", 13, BODY, PAGE_W - 2 * MX - 20, 18)
    items = [
        ("The truth, early.", "A problem brought to the board early is a shared problem. The same problem discovered late is a failure of governance, and it is the discovery, not the problem, that damages trust."),
        ("Exception, not everything.", "Report against target and explain what is off, why, whether it is one-off or a trend, what is being done, and what would make it worse. That is the whole template."),
        ("Decision-ready papers.", "Say plainly what you need from the board: a decision, a steer, or noting. Give the options, the recommendation, and the risk. Seven days ahead, through the Company Secretary."),
        ("Escalation without being asked.", "Serious clinical incidents go up immediately. Budget variance beyond the threshold goes to Finance, Investment and Operations. High-rated risks go to Audit and Risk. Do not wait for the quarter."),
        ("Reconciliation.", "Numbers in the narrative must match the numbers in the pack. A report that does not reconcile costs the board more time than a bad result does."),
    ]
    y = bullet_block(c, items, MX, PAGE_H - 190, PAGE_W - 2 * MX - 20, gap=11, size=11.5, leading=15)
    callout(c, MX, y - 2, PAGE_W - 2 * MX,
            "The board is not the audience for your effort. It is the audience for your results, your risks, and your asks.",
            bg=SURFACE, spine=TEAL, size=12)


def slide_mgmt_protection(c):
    chrome(c, 15, "for management")
    heading(c, "What the board will not reach into")
    para(c,
         "The discipline runs both ways. If the board expects clean reporting, management is entitled to clean "
         "boundaries. Hold us to these.",
         MX, PAGE_H - 152, "Helvetica", 13, BODY, PAGE_W - 2 * MX - 20, 18)
    items = [
        ("Operational decisions inside the delegation.", "If it is within budget, within policy, and within your authority, it is yours. You do not need to ask, and you should not be second-guessed for exercising it."),
        ("Individual staffing below senior level.", "Hiring, rostering, and day-to-day people decisions belong to management, subject to policy."),
        ("Supplier choice within policy.", "The board sets the procurement policy and the thresholds. It does not pick the vendor."),
        ("Clinical judgement in an individual case.", "The board assures the system: protocols, credentialing, incident review, learning. It does not adjudicate a single patient's care."),
        ("Direct instruction from a single director.", "One director, outside a meeting, is one opinion. If a director asks you for something material, route it through the Chair, the Medical Director, or the Company Secretary. Saying so is not insubordination, it is the model working."),
    ]
    y = bullet_block(c, items, MX, PAGE_H - 190, PAGE_W - 2 * MX - 20, gap=10, size=11.5, leading=15)
    callout(c, MX, y - 2, PAGE_W - 2 * MX,
            "Where the board does need to go deeper, it does so openly: through a committee, on the record, with the "
            "executive present. Never around you.",
            bg=CREAM, spine=GOLD, size=12)


def slide_practice(c):
    chrome(c, 16, "practice")
    heading(c, "Practice: which hat, and who decides?")
    para(c,
         "Take these in pairs, five minutes, then we work them together. For each one: is it governing or managing, and "
         "where in the model does it land?",
         MX, PAGE_H - 152, "Helvetica", 13, BODY, PAGE_W - 2 * MX - 20, 18)

    cases = [
        "A surgeon asks the board to approve a new theatre stack costing N45 million. It is not in the approved budget.",
        "Night-duty nursing gaps have recurred for three weeks running.",
        "Afya proposes replacing the Head of Finance.",
        "A never event occurs on a Tuesday. The next board meeting is in seven weeks.",
        "A director is called at home by a patient's family about a disputed bill.",
        "Management wants to open a dialysis service line next year.",
        "A supplier the board chair knows well has bid for the imaging contract.",
        "The monthly management accounts show payroll 18 per cent above plan.",
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
    c.drawString(MX, 128, "Answer with the instrument, not the instinct. Point to the delegation of authority, the reserved matters, or the escalation threshold.")


def slide_close(c):
    chrome(c, 17, "what good looks like")
    heading(c, "What a well-governed HSH looks like from the inside")
    items = [
        ("Meetings feel short and consequential.", "Papers arrive seven days ahead, are read, and the meeting is spent on judgement rather than on being briefed."),
        ("Nobody is surprised.", "Bad news travels upward fast, through a threshold rather than through a relationship."),
        ("Decisions are traceable.", "Anyone can open the minute book and see what was decided and why, which is exactly the protection Barr. Otuogha described."),
        ("Management is trusted and tested.", "Delegated authority is real, and assurance over it is independent. Both, not one."),
        ("The partner is well held.", "Afya has a clear counterparty, and the board has its own line of sight."),
        ("Both families are protected the same way.", "Through ownership, reserved matters, and fair process. We take that up properly in Module 8."),
    ]
    y = bullet_block(c, items, MX, PAGE_H - 168, PAGE_W - 2 * MX - 20, gap=11, size=12, leading=15.5)
    callout(c, MX, y - 2, PAGE_W - 2 * MX,
            "None of this asks anyone to know it all on day one. It is entirely learnable, and learning it is exactly "
            "what this phase is for.",
            bg=CREAM, spine=GOLD, size=12.5)


def slide_next(c):
    chrome(c, 18, "next")
    heading(c, "What happens next")
    w = PAGE_W - 2 * MX
    cw = (w - 24) / 2

    box(c, MX, 250, cw, 190, SURFACE, TEAL)
    c.setFont("Helvetica-Bold", 15)
    c.setFillColor(NAVY)
    c.drawString(MX + 22, 250 + 190 - 30, "Take away today")
    bullet_block(c,
                 [("", "The Director Guide, and the Board and Committee Handbook."),
                  ("", "The one-page duties and conflicts card, from Module 2."),
                  ("", "The delegation of authority schedule. Read it before the next session."),
                  ("", "The committee terms of reference for any committee you sit on.")],
                 MX + 22, 250 + 190 - 56, cw - 46, gap=7, size=11, leading=14)

    x2 = MX + cw + 24
    box(c, x2, 250, cw, 190, CREAM, GOLD)
    c.setFont("Helvetica-Bold", 15)
    c.setFillColor(NAVY)
    c.drawString(x2 + 22, 250 + 190 - 30, "Still to come")
    bullet_block(c,
                 [("Modules 4 and 5.", "Compliant meetings, and reading the board pack."),
                  ("Modules 6 and 7.", "Clinical governance, and financial oversight and audit."),
                  ("Modules 8 and 9.", "Conflicts and fair process, then chairing craft for committee chairs."),
                  ("Module 10.", "The management interface and the Afya relationship, joint session."),
                  ("Week six.", "A live mock committee meeting, and the competency check.")],
                 x2 + 22, 250 + 190 - 56, cw - 46, gap=5, size=11, leading=14)

    callout(c, MX, 218, w,
            "The whole programme lands before the September board meeting. The test is not that we sat through it. "
            "The test is that the September meeting runs like the model we have just described.")

    c.setFont("Helvetica-Bold", 12)
    c.setFillColor(NAVY)
    c.drawString(MX, 120, "Questions.")
    c.setFont("Helvetica", 10.5)
    c.setFillColor(MUTED)
    c.drawString(MX, 100, "Dr Debo Odulana, Independent Non-Executive Director. Consult for Africa.")


# ----------------------------------------------------------- build -----------
def build():
    c = canvas.Canvas(str(OUT), pagesize=landscape(A4))
    c.setTitle("HSH Governance Training, Module 3: Governing versus Managing")
    c.setAuthor("Consult for Africa")
    c.setSubject("Havana Specialist Hospital board and management governance training")

    slides = [
        slide_cover, slide_where_we_are, slide_objectives, slide_distinction,
        slide_which_hat, slide_md_example, slide_four_jobs, slide_architecture,
        slide_one_rule, slide_committees, slide_quarterly, slide_reserved,
        slide_afya_sight, slide_mgmt_needs, slide_mgmt_protection,
        slide_practice, slide_close, slide_next,
    ]
    for fn in slides:
        fn(c)
        c.showPage()
    c.save()
    print("Wrote %s (%d slides)" % (OUT, len(slides)))


if __name__ == "__main__":
    build()
