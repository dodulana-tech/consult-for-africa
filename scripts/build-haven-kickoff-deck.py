"""
Haven Paediatric Centre — Diagnostic Audit KICKOFF deck (for leadership/board).

Signals the engagement is a go: the team, the approach, everything we examine,
the information we need, the live surveys, quick wins, timeline, next steps.

Output: docs/haven-audit-kickoff-deck-cfa.pdf  (A4 landscape, branded)
Run:    python3 scripts/build-haven-kickoff-deck.py
"""
from __future__ import annotations
from pathlib import Path
from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
OUT = DOCS / "haven-audit-kickoff-deck-cfa.pdf"
LOGO = DOCS / "c4a-logo-reversed.png"

NAVY = HexColor("#0B3C5D"); DEEP = HexColor("#081521"); GOLD = HexColor("#D4AF37")
TEAL = HexColor("#1F7A8C"); BODY = HexColor("#1F2937"); MUTED = HexColor("#6B7280")
SURFACE = HexColor("#F1F5F9"); LIGHT = HexColor("#C9D6E0"); CREAM = HexColor("#FBF6E6")
PANEL = HexColor("#EAF1F4")
PAGE_W, PAGE_H = landscape(A4)
MX = 54
TOTAL = "12"


def wrap(c, text, font, size, mw):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if c.stringWidth(t, font, size) <= mw:
            cur = t
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def para(c, text, x, y, font, size, color, mw, lead):
    c.setFont(font, size); c.setFillColor(color)
    for ln in wrap(c, text, font, size, mw):
        c.drawString(x, y, ln); y -= lead
    return y


def chrome(c, n, kicker):
    c.setFillColor(NAVY); c.rect(0, PAGE_H - 6, PAGE_W, 6, fill=1, stroke=0)
    c.setFillColor(GOLD); c.rect(0, PAGE_H - 9, PAGE_W, 3, fill=1, stroke=0)
    c.setFillColor(GOLD); c.rect(MX, PAGE_H - 60, 26, 3, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 10.5); c.setFillColor(TEAL)
    c.drawString(MX + 36, PAGE_H - 63, kicker.upper())
    c.setFillColor(GOLD); c.rect(MX, 30, 20, 2, fill=1, stroke=0)
    c.setFillColor(MUTED); c.setFont("Helvetica", 8)
    c.drawString(MX, 19, "Consult for Africa   /   Confidential   /   Haven Paediatric Centre  /  Diagnostic Audit Kickoff")
    c.drawRightString(PAGE_W - MX, 19, "%s / %s" % (str(n).zfill(2), TOTAL))
    try:
        ic = ImageReader(str(DOCS / "c4a-icon.png")); iw, ih = ic.getSize()
        h = 30.0; w = h * iw / ih
        c.drawImage(ic, PAGE_W - MX - w, PAGE_H - 78, width=w, height=h, mask="auto")
    except Exception:
        pass


def heading(c, text, y=PAGE_H - 108, size=27, color=NAVY):
    c.setFont("Helvetica-Bold", size); c.setFillColor(color)
    for ln in wrap(c, text, "Helvetica-Bold", size, PAGE_W - 2 * MX):
        c.drawString(MX, y, ln); y -= size + 6
    return y


def bullets(c, items, x, y, mw, gap=13, size=12.5, lead=16.5):
    for lead_txt, rest in items:
        c.setFillColor(GOLD); c.rect(x, y - 1, 7, 3, fill=1, stroke=0)
        tx = x + 18
        if lead_txt:
            c.setFont("Helvetica-Bold", size); c.setFillColor(NAVY)
            c.drawString(tx, y, lead_txt)
            off = c.stringWidth(lead_txt + "  ", "Helvetica-Bold", size)
        else:
            off = 0
        words, cur, cy = rest.split(), "", y
        lx, avail, out = tx + off, mw - off, []
        for w in words:
            t = (cur + " " + w).strip()
            if c.stringWidth(t, "Helvetica", size) <= avail:
                cur = t
            else:
                out.append((lx, cur)); cur = w; lx = tx; avail = mw
        if cur:
            out.append((lx, cur))
        for lxx, ln in out:
            c.setFont("Helvetica", size); c.setFillColor(BODY); c.drawString(lxx, cy, ln); cy -= lead
        y = cy - gap
    return y


def statusbar(c, y, items):
    n = len(items); gap = 16
    w = (PAGE_W - 2 * MX - gap * (n - 1)) / n
    for i, (big, lab) in enumerate(items):
        x = MX + i * (w + gap)
        c.setFillColor(SURFACE); c.roundRect(x, y - 96, w, 96, 9, fill=1, stroke=0)
        c.setFillColor(GOLD); c.rect(x, y - 96, w, 4, fill=1, stroke=0)
        c.setFillColor(NAVY); c.setFont("Helvetica-Bold", 15)
        c.drawString(x + 16, y - 40, big)
        c.setFillColor(MUTED); c.setFont("Helvetica", 10)
        yy = y - 58
        for ln in wrap(c, lab, "Helvetica", 10, w - 30):
            c.drawString(x + 16, yy, ln); yy -= 13


# ------------------------------------------------------------------- slides --
def slide_cover(c):
    c.setFillColor(NAVY); c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.setFillColor(DEEP); c.rect(0, 0, PAGE_W, 12, fill=1, stroke=0); c.rect(0, PAGE_H - 12, PAGE_W, 12, fill=1, stroke=0)
    try:
        img = ImageReader(str(LOGO)); iw, ih = img.getSize(); dw = 168; dh = dw * ih / iw
        c.drawImage(img, MX, PAGE_H - 70 - dh + 20, width=dw, height=dh, mask="auto", preserveAspectRatio=True)
    except Exception:
        pass
    c.setFillColor(GOLD); c.rect(MX, PAGE_H - 188, 44, 3, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 11); c.setFillColor(GOLD)
    c.drawString(MX + 56, PAGE_H - 191, "ENGAGEMENT KICKOFF  /  THE WORK IS UNDERWAY")
    c.setFont("Helvetica-Bold", 42); c.setFillColor(white)
    c.drawString(MX, PAGE_H - 248, "Haven Paediatric Centre")
    c.setFont("Helvetica-Bold", 19); c.setFillColor(GOLD)
    c.drawString(MX, PAGE_H - 282, "Diagnostic Audit: how we work, what we examine, what we need")
    para(c, "The engagement is mobilised and the audit has begun. This is the full picture: your team, "
            "our approach, every area we are digging into, the information we will need, and the surveys "
            "already live.", MX, PAGE_H - 326, "Helvetica", 13, LIGHT, 640, 20)
    c.setFillColor(GOLD); c.rect(MX, 96, 60, 3, fill=1, stroke=0)
    for i, line in enumerate([
        "Engagement Lead:  Tito Ipinmoye, Director of Product & Strategy",
        "Partner oversight:  Dr Debo Odulana, Founding Partner",
        "Consult for Africa  ·  hello@consultforafrica.com  ·  consultforafrica.com",
    ]):
        c.setFont("Helvetica", 10.5); c.setFillColor(white if i < 2 else LIGHT)
        c.drawString(MX, 72 - i * 17, line)


def slide_status(c):
    chrome(c, 2, "Where we are")
    heading(c, "This is a go: the engagement is live")
    para(c, "Mobilisation is complete, your Consult for Africa team is in place, and data collection has "
            "already started. Here is exactly where things stand today.",
         MX, PAGE_H - 158, "Helvetica", 13, BODY, PAGE_W - 2 * MX, 19)
    statusbar(c, PAGE_H - 190, [
        ("Mobilised", "Engagement commenced and active; four-week diagnostic audit begun"),
        ("Team in place", "Engagement lead and partner oversight assigned and ready"),
        ("Surveys live", "Staff and patient experience surveys already collecting responses"),
        ("Quick wins started", "Crash-cart standard and receivables recovery from week one"),
    ])
    c.setFillColor(NAVY); c.setFont("Helvetica-Bold", 13)
    c.drawCentredString(PAGE_W / 2, 96, "Nothing here is theoretical. The work has started, and this deck shows you the whole plan.")


def team_card(c, x, w, name, role, lines, tag):
    h = 300
    c.setFillColor(SURFACE); c.roundRect(x, 96, w, h, 10, fill=1, stroke=0)
    c.setFillColor(NAVY); c.rect(x, 96 + h - 6, w, 6, fill=1, stroke=0)
    # monogram
    c.setFillColor(NAVY); c.roundRect(x + 20, 96 + h - 74, 48, 48, 8, fill=1, stroke=0)
    c.setFillColor(GOLD); c.setFont("Helvetica-Bold", 20)
    initials = "".join([p[0] for p in name.split()[:2]]).upper()
    c.drawCentredString(x + 44, 96 + h - 58, initials)
    c.setFillColor(GOLD); c.setFont("Helvetica-Bold", 9)
    c.drawString(x + 80, 96 + h - 40, tag.upper())
    c.setFillColor(NAVY); c.setFont("Helvetica-Bold", 15)
    c.drawString(x + 80, 96 + h - 56, name)
    c.setFillColor(TEAL); c.setFont("Helvetica-Bold", 10.5)
    c.drawString(x + 80, 96 + h - 71, role)
    y = 96 + h - 96
    for ln in lines:
        y = para(c, ln, x + 20, y, "Helvetica", 10.3, BODY, w - 40, 14) - 5


def slide_team(c):
    chrome(c, 3, "Your Consult for Africa team")
    heading(c, "Led by Tito Ipinmoye, with partner oversight from Debo Odulana")
    gap = 28
    w = (PAGE_W - 2 * MX - gap) / 2
    team_card(c, MX, w, "Tito Ipinmoye", "Director of Product & Strategy · Engagement Lead", [
        "A clinician by training and a healthcare executive by practice, with nearly a decade "
        "transforming hospitals, health systems and health-tech ventures across Europe and Africa.",
        "She pairs frontline clinical insight with the strategic and operational discipline to build "
        "resilient, high-performing healthcare organisations: operational diagnostics, clinical "
        "governance, financial sustainability, process redesign and digital innovation.",
        "Also Chief Product Officer at Cooked Indoors; completing an Executive MBA at ESADE Business "
        "School, Barcelona.",
        "For Haven she owns day-to-day delivery of the audit end to end: stakeholder engagement, "
        "operational and clinical assessment, diagnostics, analysis and the recommendations.",
    ], "Engagement lead")
    team_card(c, MX + w + gap, w, "Dr Debo Odulana", "Founding Partner · Partner oversight", [
        "Founding Partner of Consult for Africa, a doctor and healthcare entrepreneur who has built and "
        "advised health ventures across Nigeria and beyond.",
        "On Haven he provides senior partner oversight and strategic guidance, staying close to the "
        "board and the shape of the engagement while Tito leads delivery.",
        "The model is deliberate: a dedicated engagement lead on the ground, backed by partner-level "
        "judgement, so Haven gets both intensity and seniority.",
    ], "Partner")


def slide_approach(c):
    c.setFillColor(NAVY); c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.setFillColor(GOLD); c.rect(0, PAGE_H - 9, PAGE_W, 3, fill=1, stroke=0)
    c.setFillColor(GOLD); c.rect(MX, PAGE_H - 70, 26, 3, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 10.5); c.setFillColor(GOLD)
    c.drawString(MX + 36, PAGE_H - 73, "HOW WE APPROACH THIS")
    c.setFont("Helvetica-Bold", 30); c.setFillColor(white)
    y = PAGE_H - 132
    for ln in ["A strategic diagnostic, not an", "operational checklist."]:
        c.drawString(MX, y, ln); y -= 38
    y -= 14
    para(c, "We read Haven through one lens: alignment. Strong facilities get into difficulty when how "
            "they are built to run drifts out of line with where they want to go. Our job is to find those "
            "gaps and close them in the right order.", MX, y, "Helvetica", 13.5, LIGHT, PAGE_W - 2 * MX - 40, 20)
    by = 150
    for i, (t, s) in enumerate([
        ("Culture is the multiplier.", "Build the routines, standards and incentives first; safe care, healthy margins and growth follow."),
        ("Evidence over impression.", "Every finding grounded in records, observation and the voice of each stakeholder, not opinion."),
        ("Collaborative, not audit-by-ambush.", "We work alongside your team as partners in the findings, never to catch anyone out."),
    ]):
        yy = by - i * 0
    # three principles as a row
    cw = (PAGE_W - 2 * MX - 2 * 18) / 3
    py = 150
    for i, (t, s) in enumerate([
        ("Culture is the multiplier", "Build the routines, standards and incentives first; safe care, healthy margins and growth follow."),
        ("Evidence over impression", "Every finding grounded in records, observation and the voice of each stakeholder."),
        ("Collaborative, not ambush", "We work alongside your team as partners in the findings, never to catch anyone out."),
    ]):
        x = MX + i * (cw + 18)
        c.setFillColor(HexColor("#0E4A6E")); c.roundRect(x, 96, cw, py - 96 + 40, 8, fill=1, stroke=0)
        c.setFillColor(GOLD); c.rect(x, 96, 4, py - 96 + 40, fill=1, stroke=0)
        c.setFillColor(white); c.setFont("Helvetica-Bold", 12.5)
        c.drawString(x + 16, py + 18, t)
        para(c, s, x + 16, py, "Helvetica", 10.2, LIGHT, cw - 30, 13.5)


def slide_domains(c):
    chrome(c, 5, "What we examine")
    heading(c, "A complete, MECE picture: every domain, no gaps, no overlaps")
    para(c, "We assess the whole facility across ten domains, grouped by the enablers that make care safe "
            "and the business sustainable. Nothing important is left out; nothing is double-counted.",
         MX, PAGE_H - 156, "Helvetica", 12.5, BODY, PAGE_W - 2 * MX, 18)
    domains = [
        ("1", "Demand &\nMarket"), ("2", "Access &\nPatient Flow"),
        ("3", "Clinical Care\n& Governance"), ("4", "Pharmacy &\nSupply Chain"),
        ("5", "Revenue\nCycle"), ("6", "Finance &\nCapital"),
        ("7", "People &\nOrganisation"), ("8", "Infrastructure\n& Utilities"),
        ("9", "Digital &\nTechnology"), ("10", "Governance\n& Compliance"),
    ]
    cols = 5; gx, gy = 16, 16
    cw = (PAGE_W - 2 * MX - gx * (cols - 1)) / cols
    chh = 92; top = PAGE_H - 188
    for idx, (num, lab) in enumerate(domains):
        r, col = divmod(idx, cols)
        x = MX + col * (cw + gx); yy = top - r * (chh + gy) - chh
        c.setFillColor(SURFACE); c.roundRect(x, yy, cw, chh, 8, fill=1, stroke=0)
        c.setFillColor(GOLD); c.rect(x, yy, 4, chh, fill=1, stroke=0)
        c.setFillColor(TEAL); c.setFont("Helvetica-Bold", 18)
        c.drawString(x + 14, yy + chh - 28, num)
        c.setFillColor(NAVY); c.setFont("Helvetica-Bold", 10)
        for j, ln in enumerate(lab.split("\n")):
            c.drawString(x + 14, yy + 34 - j * 13, ln)
    c.setFillColor(MUTED); c.setFont("Helvetica-Oblique", 9.5)
    c.drawString(MX, 40, "Each domain is examined through six cross-cutting lenses (culture, cash, data, risk, stakeholder voice, scalability), a genuinely MECE structure.")


def slide_stakeholders(c):
    chrome(c, 6, "The voice of every stakeholder")
    heading(c, "Five perspectives, each with a benchmark-grade instrument")
    para(c, "A hospital has more customers than patients. We measure the experience of everyone with a "
            "stake, using validated tools so results can be benchmarked, not just collected.",
         MX, PAGE_H - 156, "Helvetica", 12.5, BODY, PAGE_W - 2 * MX, 18)
    rows = [
        ("Patients & caregivers", "Experience survey (Child-HCAHPS / Picker PPE-15 basis)", "LIVE"),
        ("Staff", "Safety culture (AHRQ HSOPS 2.0)", "LIVE"),
        ("Visiting consultants", "Physician engagement & satisfaction", "Next"),
        ("Payors / HMOs", "Provider–payer relationship, both directions + claims analytics", "Next"),
        ("Referring clinicians", "Referrer satisfaction (validated instruments + NPS)", "Next"),
    ]
    y = PAGE_H - 196; rh = 40; cw = PAGE_W - 2 * MX
    for i, (who, inst, status) in enumerate(rows):
        ry = y - i * (rh + 6)
        c.setFillColor(white if i % 2 == 0 else SURFACE)
        c.roundRect(MX, ry - rh, cw, rh, 6, fill=1, stroke=0)
        live = status == "LIVE"
        c.setFillColor(GOLD if live else LIGHT); c.rect(MX, ry - rh, 4, rh, fill=1, stroke=0)
        c.setFillColor(NAVY); c.setFont("Helvetica-Bold", 12)
        c.drawString(MX + 18, ry - 25, who)
        c.setFillColor(BODY); c.setFont("Helvetica", 10.5)
        c.drawString(MX + 210, ry - 25, inst)
        # status chip
        cx = PAGE_W - MX - 70
        c.setFillColor(TEAL if live else HexColor("#E7EDF2"))
        c.roundRect(cx, ry - rh + 10, 60, 20, 5, fill=1, stroke=0)
        c.setFillColor(white if live else MUTED); c.setFont("Helvetica-Bold", 9)
        c.drawCentredString(cx + 30, ry - rh + 16, "LIVE NOW" if live else "TO COME")


def slide_surveys(c):
    chrome(c, 7, "Already collecting")
    heading(c, "Two surveys are already live and collecting")
    para(c, "Both are anonymous, take a few minutes, and open on any phone with no login. The more voices, "
            "the sharper the plan we bring back to the board.",
         MX, PAGE_H - 158, "Helvetica", 13, BODY, PAGE_W - 2 * MX, 19)
    colw = (PAGE_W - 2 * MX - 28) / 2; top = PAGE_H - 196; bh = 150
    cards = [
        ("Staff Safety Culture", "For every member of the Haven team", "consultforafrica.com/haven-audit.html", CREAM, GOLD),
        ("Patient / Caregiver Experience", "A QR card at the front / discharge desk", "consultforafrica.com/haven-patient-survey.html", SURFACE, TEAL),
    ]
    for i, (t, s, url, bg, spine) in enumerate(cards):
        x = MX + i * (colw + 28)
        c.setFillColor(bg); c.roundRect(x, top - bh, colw, bh, 9, fill=1, stroke=0)
        c.setFillColor(spine); c.rect(x, top - bh, 5, bh, fill=1, stroke=0)
        c.setFillColor(NAVY); c.setFont("Helvetica-Bold", 15)
        c.drawString(x + 22, top - 32, t)
        c.setFillColor(MUTED); c.setFont("Helvetica", 11)
        c.drawString(x + 22, top - 50, s)
        c.setFillColor(TEAL); c.setFont("Helvetica-Bold", 12.5)
        c.drawString(x + 22, top - 84, url)
        c.setFillColor(BODY); c.setFont("Helvetica", 10)
        c.drawString(x + 22, top - 108, "Tito will share the direct links and a QR code for printing.")


def slide_data(c):
    chrome(c, 8, "Information we will need")
    heading(c, "What we will ask Haven for")
    para(c, "A single secure, read-only folder does it. Twelve Week-1 items unlock the analysis immediately; "
            "the rest can follow. Partial records are fine; nothing here is a test.",
         MX, PAGE_H - 156, "Helvetica", 12.5, BODY, PAGE_W - 2 * MX, 18)
    left = [
        ("Finance", "Management accounts / P&L (12 mo), bank statements, trial balance, budget"),
        ("Revenue & receivables", "Revenue by service & payer, receivables ageing, price list / tariff"),
        ("HMO / payer", "HMO contracts & tariffs, claims register, denials, ageing per HMO"),
        ("Pharmacy & stock", "Full stock count with values, sales & purchase records, wastage"),
        ("Procurement", "Supplier terms & lead times, payables ageing"),
    ]
    right = [
        ("People & payroll", "Full staff list, payroll / salary schedule, JDs & KPIs, commission structure"),
        ("Clinical governance", "Protocols, incident & M&M records, training, NICU criteria"),
        ("Operations", "Patient volumes (12 mo), occupancy, booking system, SOPs"),
        ("Reporting & systems", "Current management reports, KPIs, EMR / billing system access"),
        ("Corporate", "Licences (HEFAMAA), org chart, board minutes, insurance"),
    ]
    colw = (PAGE_W - 2 * MX - 30) / 2
    bullets(c, left, MX, PAGE_H - 196, colw, gap=9, size=10.5, lead=13.5)
    bullets(c, right, MX + colw + 30, PAGE_H - 196, colw, gap=9, size=10.5, lead=13.5)
    c.setFillColor(NAVY); c.setFont("Helvetica-Bold", 11)
    c.drawString(MX, 42, "The full itemised Information & Data Request accompanies this deck.")


def slide_quickwins(c):
    chrome(c, 9, "Value from week one")
    heading(c, "Two quick wins, before the audit even reports")
    colw = (PAGE_W - 2 * MX - 28) / 2; top = PAGE_H - 186; bh = 150
    c.setFillColor(CREAM); c.roundRect(MX, top - bh, colw, bh, 9, fill=1, stroke=0)
    c.setFillColor(GOLD); c.rect(MX, top - bh, 5, bh, fill=1, stroke=0)
    c.setFillColor(NAVY); c.setFont("Helvetica-Bold", 14)
    c.drawString(MX + 22, top - 30, "1.  A crash cart you can trust")
    para(c, "A stocked, sealed, checklist-governed emergency standard with a shift-level check routine, "
            "the most basic safety assurance, in place from the very first week.",
         MX + 22, top - 54, "Helvetica", 11.5, BODY, colw - 40, 16)
    rx = MX + colw + 28
    c.setFillColor(SURFACE); c.roundRect(rx, top - bh, colw, bh, 9, fill=1, stroke=0)
    c.setFillColor(TEAL); c.rect(rx, top - bh, 5, bh, fill=1, stroke=0)
    c.setFillColor(NAVY); c.setFont("Helvetica-Bold", 14)
    c.drawString(rx + 22, top - 30, "2.  Cash starts moving")
    para(c, "An immediate recovery push on the largest HMO receivables (Leadway, NEM) so working capital "
            "starts freeing up before the audit reports. The work begins to pay for itself.",
         rx + 22, top - 54, "Helvetica", 11.5, BODY, colw - 40, 16)


def slide_timeline(c):
    chrome(c, 10, "The four weeks")
    heading(c, "Mobilise now, present to the board in week four")
    weeks = [
        ("Week 1", "Mobilise", "Point person agreed, data request issued, surveys circulated, quick wins live, accounts reconciled"),
        ("Week 2", "On site", "Interviews and observation across shifts, SOP walk-throughs, NICU readiness"),
        ("Week 3", "Deep-dives", "Finance & working capital, procurement, HMO economics, reporting integrity; surveys close"),
        ("Week 4", "Board readout", "Synthesis into a prioritised, costed plan, presented in a working session"),
    ]
    y = PAGE_H - 152; cw = PAGE_W - 2 * MX; lw = 150; bx = MX + lw + 14; bw = cw - lw - 14; rh = 62
    for i, (wk, nm, focus) in enumerate(weeks):
        ry = y - i * (rh + 10)
        c.setFillColor(NAVY); c.roundRect(MX, ry - rh, lw, rh, 6, fill=1, stroke=0)
        c.setFillColor(GOLD); c.setFont("Helvetica-Bold", 14); c.drawString(MX + 16, ry - 26, wk)
        c.setFillColor(white); c.setFont("Helvetica-Bold", 10); c.drawString(MX + 16, ry - 44, nm)
        c.setFillColor(SURFACE); c.roundRect(bx, ry - rh, bw, rh, 6, fill=1, stroke=0)
        c.setFillColor(GOLD); c.rect(bx, ry - rh, 4, rh, fill=1, stroke=0)
        para(c, focus, bx + 18, ry - 26, "Helvetica", 11.5, BODY, bw - 36, 15)


def slide_close(c):
    c.setFillColor(NAVY); c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.setFillColor(DEEP); c.rect(0, 0, PAGE_W, 12, fill=1, stroke=0); c.rect(0, PAGE_H - 12, PAGE_W, 12, fill=1, stroke=0)
    c.setFillColor(GOLD); c.rect(MX, PAGE_H - 120, 44, 3, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 11); c.setFillColor(GOLD); c.drawString(MX + 56, PAGE_H - 123, "WHAT HAPPENS NOW")
    c.setFont("Helvetica-Bold", 30); c.setFillColor(white)
    c.drawString(MX, PAGE_H - 176, "The audit has begun. Here is week one.")
    bullets_dark(c, [
        "Tito agrees a point person with you, and we suggest the Head of Operations.",
        "The Information & Data Request goes across; the twelve Week-1 items unlock the analysis.",
        "The staff and patient surveys circulate; the crash-cart standard and receivables push go live.",
        "We reconcile the management accounts and confirm the on-site schedule for week two.",
    ], MX, PAGE_H - 210)
    c.setFillColor(GOLD); c.rect(MX, 96, 60, 3, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 13); c.setFillColor(white)
    c.drawString(MX, 74, "Tito Ipinmoye  ·  Engagement Lead  ·  Consult for Africa")
    c.setFont("Helvetica", 10.5); c.setFillColor(LIGHT)
    c.drawString(MX, 56, "tito.ipinmoye@consultforafrica.com   /   hello@consultforafrica.com   /   consultforafrica.com")


def bullets_dark(c, items, x, y):
    for t in items:
        c.setFillColor(GOLD); c.rect(x, y - 1, 7, 3, fill=1, stroke=0)
        y = para(c, t, x + 18, y, "Helvetica", 12.5, LIGHT, PAGE_W - 2 * MX - 30, 17) - 8
    return y


def build():
    c = canvas.Canvas(str(OUT), pagesize=landscape(A4))
    c.setTitle("Haven Paediatric Centre - Diagnostic Audit Kickoff"); c.setAuthor("Consult for Africa")
    slides = [slide_cover, slide_status, slide_team, slide_approach, slide_domains,
              slide_stakeholders, slide_surveys, slide_data, slide_quickwins, slide_timeline, slide_close]
    global TOTAL; TOTAL = str(len(slides))
    for s in slides:
        s(c); c.showPage()
    c.save(); print(f"wrote {OUT}  ({len(slides)} slides)")


if __name__ == "__main__":
    build()
