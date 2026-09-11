"""
Build the Haven Paediatrics organisational audit FINDINGS deck.

A landscape, slide-per-page board presentation of the audit report at
docs/haven-organisational-audit-report-cfa.pdf. Same evidence, same numbers,
sized for a board session rather than for reading.

Source data: docs/data/haven-survey-analysis.json (written by
             scripts/compute-haven-surveys.ts)
Output:      docs/haven-audit-findings-deck-cfa.pdf  (A4 landscape, branded)

Run:
  python3 scripts/build-haven-audit-findings-deck.py
"""

from __future__ import annotations

import json
from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
OUT = DOCS / "haven-audit-findings-deck-cfa.pdf"
LOGO = DOCS / "c4a-logo-reversed.png"
DATA = DOCS / "data" / "haven-survey-analysis.json"

# ---- brand palette ---------------------------------------------------------
NAVY = HexColor("#0B3C5D")
DEEP_NAVY = HexColor("#081521")
GOLD = HexColor("#D4AF37")
TEAL = HexColor("#1F7A8C")
BODY = HexColor("#1F2937")
MUTED = HexColor("#6B7280")
SURFACE = HexColor("#F1F5F9")
LIGHT = HexColor("#C9D6E0")
CREAM = HexColor("#FBF6E6")
GOOD = HexColor("#15803D")
GOOD_BG = HexColor("#E7F4EC")
WARN = HexColor("#92400E")
WARN_BG = HexColor("#FBF0D9")
BAD = HexColor("#B91C1C")
BAD_BG = HexColor("#FBE7E7")

PAGE_W, PAGE_H = landscape(A4)
MX = 54

# ---- data ------------------------------------------------------------------
_d = json.loads(DATA.read_text())
STAFF = next(s for s in _d["surveys"] if s["id"] == "haven-safety-culture")
PATIENT = next(s for s in _d["surveys"] if s["id"] == "haven-patient-experience")


def _item(sv, key):
    return next(q for q in sv["scale"] if q["key"] == key)


def m(sv, key):
    return f'{_item(sv, key)["mean"]:.2f}'


def _cat(sv, key):
    return next(c for c in sv["categorical"] if c["key"] == key)


S_N = STAFF["count"]
P_N = PATIENT["count"]
S_POS = f'{STAFF["positiveAvg"]:.2f}'
P_POS = f'{PATIENT["positiveAvg"]:.2f}'
_g = _cat(STAFF, "grade")["counts"]
GRADE_TOP = _g.get("Excellent", 0) + _g.get("Very good", 0)
_r = _cat(PATIENT, "recommend")
P_DEF = _r["counts"].get("Definitely", 0)
P_REC_N = _r["answered"]
_ten = _cat(STAFF, "tenure")
TEN_N = _ten["answered"]
TEN_U1 = _ten["counts"].get("Under 6 months", 0) + _ten["counts"].get("6–12 months", 0)

SLIDES = []


def slide(fn):
    SLIDES.append(fn)
    return fn


# ---- helpers ---------------------------------------------------------------
def wrap(c, text, font, size, max_w):
    words, lines, cur = text.split(), [], ""
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
    c.drawString(MX, 19, "Consult for Africa   /   Confidential   /   "
                         "Haven Paediatrics: Organisational Audit")
    c.drawRightString(PAGE_W - MX, 19, "%s / %s" % (str(n).zfill(2), str(len(SLIDES)).zfill(2)))
    try:
        ic = ImageReader(str(DOCS / "c4a-icon.png"))
        iw, ih = ic.getSize()
        h = 30.0
        c.drawImage(ic, PAGE_W - MX - h * iw / ih, PAGE_H - 78,
                    width=h * iw / ih, height=h, mask="auto")
    except Exception:
        pass


def heading(c, text, y=PAGE_H - 108, size=26, color=NAVY, max_w=None):
    max_w = max_w or (PAGE_W - 2 * MX)
    c.setFont("Helvetica-Bold", size)
    c.setFillColor(color)
    for line in wrap(c, text, "Helvetica-Bold", size, max_w):
        c.drawString(MX, y, line)
        y -= size + 6
    return y


def bullets(c, items, x, y, max_w, gap=13, size=12, leading=16):
    for lead, rest in items:
        c.setFillColor(GOLD)
        c.rect(x, y - 1, 7, 3, fill=1, stroke=0)
        tx = x + 18
        offset = 0
        if lead:
            c.setFont("Helvetica-Bold", size)
            c.setFillColor(NAVY)
            c.drawString(tx, y, lead)
            offset = c.stringWidth(lead + "  ", "Helvetica-Bold", size)
        cur, cy, line_x, avail, out = "", y, tx + offset, max_w - offset, []
        for w in rest.split():
            trial = (cur + " " + w).strip()
            if c.stringWidth(trial, "Helvetica", size) <= avail:
                cur = trial
            else:
                out.append((line_x, cur))
                cur, line_x, avail = w, tx, max_w
        if cur:
            out.append((line_x, cur))
        for lx, ln in out:
            c.setFont("Helvetica", size)
            c.setFillColor(BODY)
            c.drawString(lx, cy, ln)
            cy -= leading
        y = cy - gap
    return y


def callout(c, x, y, w, text, bg=SURFACE, spine=TEAL, fg=NAVY, pad=20,
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


def stat(c, x, y, w, h, value, label, hint, accent=NAVY):
    c.setFillColor(SURFACE)
    c.roundRect(x, y, w, h, 8, fill=1, stroke=0)
    c.setFillColor(accent)
    c.rect(x, y, 4, h, fill=1, stroke=0)
    c.setFillColor(MUTED)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(x + 18, y + h - 22, label.upper())
    c.setFillColor(accent)
    c.setFont("Helvetica-Bold", 30)
    c.drawString(x + 18, y + h - 58, value)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 9)
    for i, ln in enumerate(wrap(c, hint, "Helvetica", 9, w - 34)):
        c.drawString(x + 18, y + h - 76 - i * 12, ln)


def table(c, x, y, widths, rows, header=True, size=10, pad=8, zebra=True,
          head_bg=NAVY, row_h=None):
    total_w = sum(widths)
    cy = y
    for i, row in enumerate(rows):
        cells = []
        maxlines = 1
        for j, cell in enumerate(row):
            font = "Helvetica-Bold" if (i == 0 and header) or j == 0 else "Helvetica"
            lines = wrap(c, str(cell), font, size, widths[j] - 2 * pad)
            cells.append((lines, font))
            maxlines = max(maxlines, len(lines))
        h = row_h or (maxlines * (size + 3.5) + pad * 1.5)
        if i == 0 and header:
            c.setFillColor(head_bg)
            c.rect(x, cy - h, total_w, h, fill=1, stroke=0)
            c.setFillColor(GOLD)
            c.rect(x, cy - h - 2, total_w, 2, fill=1, stroke=0)
        elif zebra and i % 2 == 0:
            c.setFillColor(SURFACE)
            c.rect(x, cy - h, total_w, h, fill=1, stroke=0)
        cx = x
        for j, (lines, font) in enumerate(cells):
            c.setFont(font, size)
            c.setFillColor(white if (i == 0 and header) else
                           (NAVY if j == 0 else BODY))
            ty = cy - pad - size + 2
            for ln in lines:
                c.drawString(cx + pad, ty, ln)
                ty -= size + 3.5
            cx += widths[j]
        cy -= h
    return cy


def pill(c, x, y, text, bg, fg, w=None, h=15, size=8.5):
    w = w or (c.stringWidth(text, "Helvetica-Bold", size) + 16)
    c.setFillColor(bg)
    c.roundRect(x, y, w, h, 3, fill=1, stroke=0)
    c.setFillColor(fg)
    c.setFont("Helvetica-Bold", size)
    c.drawCentredString(x + w / 2, y + 4.5, text)
    return w


# ============================================================== slides =======
def slide_cover(c, n):
    c.setFillColor(NAVY)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.setFillColor(DEEP_NAVY)
    c.rect(0, 0, PAGE_W, 12, fill=1, stroke=0)
    c.rect(0, PAGE_H - 12, PAGE_W, 12, fill=1, stroke=0)
    try:
        img = ImageReader(str(LOGO))
        iw, ih = img.getSize()
        dw = 168
        c.drawImage(img, MX, PAGE_H - 70 - dw * ih / iw + 20, width=dw,
                    height=dw * ih / iw, mask="auto", preserveAspectRatio=True)
    except Exception:
        c.setFillColor(GOLD)
        c.setFont("Helvetica-Bold", 13)
        c.drawString(MX, PAGE_H - 64, "CONSULT FOR AFRICA")

    c.setFillColor(GOLD)
    c.rect(MX, PAGE_H - 188, 44, 3, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(GOLD)
    c.drawString(MX + 56, PAGE_H - 191, "FINDINGS FOR THE BOARD")

    c.setFont("Helvetica-Bold", 44)
    c.setFillColor(white)
    c.drawString(MX, PAGE_H - 250, "Organisational Audit")
    c.setFont("Helvetica-Bold", 19)
    c.setFillColor(GOLD)
    c.drawString(MX, PAGE_H - 283, "Haven Paediatrics")

    para(c,
         "What we found when we looked underneath a hospital that is, on every measure "
         "your families can see, doing the hard part well.",
         MX, PAGE_H - 322, "Helvetica", 13.5, LIGHT, 560, 20)

    c.setFillColor(GOLD)
    c.rect(MX, 104, 60, 3, fill=1, stroke=0)
    for i, line in enumerate([
        "For:   Kabir Aregbesola,  Mrs Abisodun Alli,  Dr Shakirah Saliu,  "
        "Dr Odedina,  Ogochukwu Odum",
        "From:  Dr Debo Odulana, Founding Partner, Consult for Africa",
        "August 2026   /   Read alongside the full audit report",
    ]):
        c.setFont("Helvetica", 10.5)
        c.setFillColor(white if i < 2 else GOLD)
        c.drawString(MX, 80 - i * 17, line)


def slide_evidence(c, n):
    chrome(c, n, "What this is based on")
    heading(c, "Four independent sources, and they agree with each other")
    y = PAGE_H - 150
    para(c, "Your people, your families and your own records were tested separately. "
            "Where they disagree, this report says so.",
         MX, y, "Helvetica", 12.5, MUTED, PAGE_W - 2 * MX, 17)

    w = (PAGE_W - 2 * MX - 3 * 14) / 4
    y = PAGE_H - 210
    for i, (v, lab, hint) in enumerate([
        ("9", "Departments interviewed", "One to one, on site, 4 August"),
        (str(S_N), "Staff responses", "Anonymous, safety and culture"),
        (str(P_N), "Caregiver responses", "Anonymous, patient experience"),
        ("34", "Documents reviewed", "January to July, recomputed from source"),
    ]):
        stat(c, MX + i * (w + 14), y - 96, w, 96, v, lab, hint,
             accent=TEAL if i < 3 else NAVY)

    y = y - 130
    table(c, MX, y, [180, PAGE_W - 2 * MX - 180], [
        ["Source", "What it covered"],
        ["Field validation", "Nursing, front desk, billing, pharmacy, laboratory, "
                             "administration, business development, doctors, patients"],
        ["Staff survey", "Nine sections adapted from a recognised hospital safety-culture "
                         "instrument, plus items on readiness, reward and ownership"],
        ["Caregiver survey", "Access, communication, safety, environment and cost"],
        ["Documentary review", "Sales files, admission record, pharmacy report, claims "
                               "file, tariff, fee schedule, board decks, half-year report, "
                               "weekly report, six procedures, staff list, four rosters"],
    ], size=9.5)

    callout(c, MX, 96, PAGE_W - 2 * MX,
            "Every figure taken from your records was recomputed from the underlying "
            "patient rows, not read off a total line. Where data is missing we say it is "
            "missing.", bg=CREAM, spine=GOLD)


def slide_headline(c, n):
    chrome(c, n, "Where Haven stands")
    heading(c, "The care is ahead of the systems holding it up")
    w = (PAGE_W - 2 * MX - 3 * 14) / 4
    y = PAGE_H - 250
    stat(c, MX, y, w, 100, "2.5 / 5", "Organisational maturity", "Developing. Opened at 3.0", NAVY)
    stat(c, MX + w + 14, y, w, 100, f"{P_POS} / 5", "Patient experience",
         f"{P_N} caregiver responses", GOOD)
    stat(c, MX + 2 * (w + 14), y, w, 100, f"{GRADE_TOP} / {S_N}", "Staff safety grade",
         "rated very good or excellent", GOOD)
    stat(c, MX + 3 * (w + 14), y, w, 100, f"{TEN_U1} / {TEN_N}", "Staff under one year",
         "none beyond two years", BAD)

    y = y - 34
    y = para(c,
             "Your patients rate you highly and your staff rate the safety of the care "
             "they give as good. What sits underneath is not yet a hospital's "
             "infrastructure. Processes are written but untaught and unmeasured. The "
             "revenue record is a nursing handover sheet. Four registered nurses covered "
             "the half year. No pharmacist is rostered on any day.",
             MX, y, "Helvetica", 13, BODY, PAGE_W - 2 * MX, 19)

    callout(c, MX, y - 16, PAGE_W - 2 * MX,
            "Haven is not underperforming. It is a hospital whose performance rests on "
            "particular people rather than on systems that would survive their leaving.",
            bg=CREAM, spine=GOLD, size=14)


def slide_working(c, n):
    chrome(c, n, "Protect this")
    heading(c, "Five things are working and should survive any change")
    y = PAGE_H - 168
    y = bullets(c, [
        ("Patient experience.", f"Caregivers rate you {P_POS} of 5. {P_DEF} of {P_REC_N} "
                                "would definitely recommend you. Access, cleanliness and "
                                "confidence in the medical team are the strongest items."),
        ("Clinical delivery.", "Pathways are coherent and consistently described by every "
                               "department. Emergency equipment readiness is trusted. "
                               "Staff report errors openly."),
        ("Pharmacy discipline.", "Monthly counts, consumption-led purchasing, expiry lists "
                                 "circulated months ahead, weekly procurement. The internal "
                                 "benchmark for every other department."),
        ("The billing front end.", "Bills assemble from the clinical record without manual "
                                   "work. Eligibility is checked before treatment. Errors "
                                   "are rare and a documented overpayment was refunded "
                                   "within a week."),
        ("Teamwork.", f"Mutual respect {m(STAFF, 'q1')}, pulling together under load "
                       f"{m(STAFF, 'q2')}, handover clarity {m(STAFF, 'q25')}. The hard "
                       "part of culture is already there."),
    ], MX, y, PAGE_W - 2 * MX - 20, size=12.5, leading=17, gap=14)

    callout(c, MX, y - 6, PAGE_W - 2 * MX,
            "Every recommendation in this report is designed to protect these five while "
            "fixing what sits under them.", bg=GOOD_BG, spine=GOOD, fg=BODY)


def slide_three_questions(c, n):
    chrome(c, n, "Before anything else")
    heading(c, "Three questions only the board can close")
    y = PAGE_H - 150
    y = para(c, "These are not items for a workplan. Until they are answered the rest of "
                "the plan cannot be sequenced honestly.",
             MX, y, "Helvetica", 12.5, MUTED, PAGE_W - 2 * MX, 17)

    w = (PAGE_W - 2 * MX - 2 * 16) / 3
    top = y - 24
    h = 250
    for i, (num, title, body) in enumerate([
        ("01", "Regulatory currency",
         "Registration is confirmed and this year's renewal is pending. What remains is "
         "that your monthly reports said the facility was still a clinic and unregistered, "
         "every month January to April, in a period when it held registration and was "
         "admitting overnight, transfusing and running neonatal care. Both lines then "
         "disappeared without correction."),
        ("02", "The establishment",
         "Four registered nurses covered the first half of the year. Eight days in July "
         "had two people covering the ward, emergency room, neonatal unit and triage for a "
         "full 24 hours. On four of those days one of the two was not a nurse. No "
         "pharmacist appears on any day of the roster."),
        ("03", "The record",
         "Your nursing procedure has nurses filling in the revenue spreadsheets at the end "
         "of shift, so those sheets sit beside your clinical system rather than being the "
         "financial record. June HMO revenue is absent from the sales record, though the "
         "claims were submitted and paid. The system underneath looks sound."),
    ]):
        x = MX + i * (w + 16)
        c.setFillColor(BAD_BG)
        c.roundRect(x, top - h, w, h, 8, fill=1, stroke=0)
        c.setFillColor(BAD)
        c.rect(x, top - h, 5, h, fill=1, stroke=0)
        c.setFillColor(BAD)
        c.setFont("Helvetica-Bold", 22)
        c.drawString(x + 20, top - 42, num)
        c.setFillColor(NAVY)
        c.setFont("Helvetica-Bold", 15)
        c.drawString(x + 20, top - 68, title)
        para(c, body, x + 20, top - 92, "Helvetica", 10.5, BODY, w - 40, 14.5)

    callout(c, MX, top - h - 18, PAGE_W - 2 * MX,
            "The first is now largely closed. The renewal is the outstanding item, and the "
            "four months of inaccurate reporting behind it is the finding that carries "
            "into Section 10.", bg=CREAM, spine=GOLD)


def slide_licence(c, n):
    chrome(c, n, "Question one")
    heading(c, "Registration is held. The reporting said otherwise for four months.")
    y = PAGE_H - 156
    y = table(c, MX, y, [230, 200, PAGE_W - 2 * MX - 430], [
        ["Item", "Status", "Action"],
        ["Facility registration", "Obtained, confirmed by management",
         "Closed. Hold the certificate on the governance file"],
        ["Current year renewal", "Pending",
         "Submit and evidence. Do not let it run into another quarter"],
        ["Health insurance scheme registration", "Not separately confirmed",
         "Confirm in writing. The monthly reports are not a reliable guide either way"],
    ], size=10.5, row_h=44)

    y = para(c, "The substantive question is answered. What it leaves is a reporting "
                "problem, and it is the clearest single illustration of the finding in "
                "Section 10.",
             MX, y - 24, "Helvetica", 12.5, BODY, PAGE_W - 2 * MX, 17)

    y = table(c, MX, y - 16, [(PAGE_W - 2 * MX) / 2, (PAGE_W - 2 * MX) / 2], [
        ["What the monthly reporting recorded", "What was actually the case"],
        ["Still running as a clinic, every month January to April",
         "Registration held, and twenty-four hour admissions running since August 2025"],
        ["Registration not yet obtained, same period", "Registration had been obtained"],
        ["Both statements removed from May with no correction recorded",
         "A correction would normally be minuted. None was"],
    ], size=10)

    callout(c, MX, y - 18, PAGE_W - 2 * MX,
            "Two functions of the same organisation reported opposite positions on the "
            "same fact, in the same months, to the same board. One was right. Nobody "
            "reconciled them.", bg=WARN_BG, spine=WARN, fg=BODY)


def slide_establishment(c, n):
    chrome(c, n, "Question two")
    heading(c, "The hospital is staffed like the clinic it used to be")
    y = PAGE_H - 152
    y = table(c, MX, y, [150, 96, PAGE_W - 2 * MX - 246], [
        ["Function", "Established", "What the roster shows"],
        ["Registered nurses", "4 through the half year",
         "The fifth and sixth joined 14 and 15 July. Your half-year report describes six "
         "covering January to June"],
        ["Medical officers", "3", "All 31 days of July on a three-day rotation. No rest "
                                  "day, no leave cover, no relief named"],
        ["Pharmacist", "1, part time", "Appears on no day of the July pharmacy roster. Two "
                                       "technicians verify paediatric weight-based doses"],
        ["Laboratory scientists", "2", "One scientist covers 72 consecutive hours in "
                                       "three-day blocks. Before 16 April, one in total"],
        ["Consultant rota", "In place", "Not supplied for review, so consultant cover could "
                                        "not be tested against the medical officer rota"],
        ["HMO officer", "0", "The post that owns every gate in the insured revenue cycle, "
                             "including the daily claims audit, does not exist"],
    ], size=9.8)

    y = callout(c, MX, y - 18, PAGE_W - 2 * MX,
                "Eight days in July were covered by two people across a full 24 hours. On "
                "four of those the cover was one registered nurse and a pharmacy "
                "technician, who on three of them was also rostered to the pharmacy.",
                bg=BAD_BG, spine=BAD, fg=BODY)

    para(c, "Every monthly report states a one to two patient to nurse ratio, unchanged "
            "across six months in which monthly encounters rose from 174 to 311. A ratio "
            "that does not move when the numerator triples is not a measurement.",
         MX, y - 20, "Helvetica", 11, MUTED, PAGE_W - 2 * MX, 15)


def slide_record(c, n):
    chrome(c, n, "Question three")
    heading(c, "The spreadsheets sit beside the system, not above it")
    y = PAGE_H - 152
    y = para(c, "Your nursing procedure instructs nurses to bill opened medications from "
                "memory at the end of a shift, and to fill in the revenue spreadsheets "
                "before handover, with the obligation passing to the next shift if they "
                "have not managed it. Every finding below follows from that one "
                "instruction.",
             MX, y, "Helvetica", 12.5, BODY, PAGE_W - 2 * MX, 17)

    y = table(c, MX, y - 16, [270, 110, PAGE_W - 2 * MX - 380], [
        ["What is missing or wrong", "Amount", "How it is known"],
        ["June HMO revenue absent from the sales record. The claims were submitted and paid",
         "N7,510,645", "What is missing is the sales record of it. Corroborated by "
                       "N2,097,155 of June pharmacy dispensing with no matching entry"],
        ["April private pharmacy revenue. Column total never written", "N1,394,020",
         "Patient rows sum 14.6 percent above the month total row"],
        ["May insured revenue across three columns", "N225,893",
         "Total rows are hardcoded values, so rows added later are silently excluded"],
        ["Service revenue on the largest episode of the period", "N4,000,000",
         "Appears once in a weekly report and is excluded from that report's own total"],
        ["Pharmacy stock fails to roll forward in every month tested", "N562,272",
         "The physical count is written into the ledger instead of reconciled against it"],
    ], size=9.5)

    callout(c, MX, y - 18, PAGE_W - 2 * MX,
            "1,952 of the 2,413 lines in the tariff file we were given carry a price of "
            "zero. Either that is not the list your team prices from, and we should see the "
            "one that is, or pricing is being set at the point of billing. Both need "
            "answers and they are different answers.", bg=WARN_BG, spine=WARN, fg=BODY)


def slide_reporting(c, n):
    chrome(c, n, "Management reporting")
    heading(c, "Your board pack does not reconcile to your transaction record")
    y = PAGE_H - 150
    y = table(c, MX, y, [130, 150, 150, PAGE_W - 2 * MX - 430], [
        ["Month", "Reported to board", "Transaction record", "Variance"],
        ["January", "N12,698,284", "N4,696,654", "+N8,001,630"],
        ["March", "N8,543,518", "N16,410,449", "(N7,866,931)"],
        ["June", "N14,638,870", "N14,638,870", "Nil"],
        ["Half-year total", "N68,159,516", "N68,063,877", "+N95,639"],
    ], size=11, row_h=30)

    y = para(c, "The half-year total is accurate to 0.14 percent. Every individual month "
                "before June is wrong. January is overstated by N8.00M, March understated "
                "by N7.87M, and those are the same money. June reconciles to the naira, "
                "which shows the method works when the month is prepared properly.",
             MX, y - 24, "Helvetica", 12, BODY, PAGE_W - 2 * MX, 17)

    y = bullets(c, [
        ("", "N6,395,450 of neonatal revenue reported in January, a month whose entire "
             "private revenue across all lines was N4,696,654."),
        ("", "Insured revenue reported above what was actually claimed by N386,887, with "
             "the February and May variances each tracing to a single payer to the naira."),
        ("", "Laboratory revenue reported as an identical figure in March and April, "
             "matching neither month, carried through two board cycles."),
    ], MX, y - 14, PAGE_W - 2 * MX - 20, size=11.5, leading=15, gap=9)

    callout(c, MX, y - 4, PAGE_W - 2 * MX,
            "There is an innocent explanation available and it fits most of this. We "
            "recommend a reconciliation done outside the operations function, and nothing "
            "beyond that. The board should not reach a conclusion before that work is "
            "done.", bg=CREAM, spine=GOLD)


def slide_patients(c, n):
    chrome(c, n, "What your families say")
    heading(c, f"Caregivers rate you {P_POS} out of 5")
    w = (PAGE_W - 2 * MX - 2 * 14) / 3
    y = PAGE_H - 240
    stat(c, MX, y, w, 96, f"{P_POS} / 5", "Overall", "mean across all ten items", GOOD)
    stat(c, MX + w + 14, y, w, 96, f"{P_DEF} / {P_REC_N}", "Would definitely recommend",
         "to another family", GOOD)
    stat(c, MX + 2 * (w + 14), y, w, 96, f"{P_N}", "Responses",
         "anonymous, 4 to 14 August", TEAL)

    y = y - 30
    y = table(c, MX, y, [(PAGE_W - 2 * MX) / 2 - 8, (PAGE_W - 2 * MX) / 2 - 8], [
        ["Strongest", "Softest"],
        [f"Easy to book and be seen  {m(PATIENT, 'q1')}",
         f"Charges and payments explained clearly  {m(PATIENT, 'q10')}"],
        [f"Clean and comfortable  {m(PATIENT, 'q7')}",
         f"Waiting time  {m(PATIENT, 'q2')}"],
        [f"Treated with respect and kindness  {m(PATIENT, 'q3')}",
         f"Knowing what was happening with the child  {m(PATIENT, 'q6')}"],
        [f"Confidence in the medical team  {m(PATIENT, 'q9')}",
         f"Care explained understandably  {m(PATIENT, 'q4')}"],
    ], size=10.5)

    callout(c, MX, y - 18, PAGE_W - 2 * MX,
            "All three soft edges are about information, not clinical care. They are the "
            "cheapest things in this report to fix. The comments ask for remote "
            "consultation, results by email, and clearer medicine costs under insurance.",
            bg=GOOD_BG, spine=GOOD, fg=BODY)


def slide_staff(c, n):
    chrome(c, n, "What your staff say")
    heading(c, "Safety rates well. The deal does not.")
    y = PAGE_H - 158
    left_w = (PAGE_W - 2 * MX) / 2 - 12
    table(c, MX, y, [left_w - 70, 70], [
        ["Strongest", ""],
        ["Would recommend Haven as a place to receive care", m(STAFF, "rec_care")],
        ["Staff treat each other with respect", m(STAFF, "q1")],
        ["Clear what I am responsible for", m(STAFF, "q33")],
        ["Emergency resuscitation readiness", m(STAFF, "q30")],
        ["Information shared clearly across shifts", m(STAFF, "q25")],
    ], size=10)
    table(c, MX + left_w + 24, y, [left_w - 70, 70], [
        ["Softest", ""],
        ["Recent resuscitation training", m(STAFF, "q32")],
        ["Pay, commission and rewards are fair and clear", m(STAFF, "q34")],
        ["Rewards encourage careful work, not just volume", m(STAFF, "q35")],
        ["Free to question those with more authority", m(STAFF, "q6")],
        ["Blamed rather than helped after reporting (reverse)", m(STAFF, "q12")],
    ], size=10)

    y = y - 150
    y = bullets(c, [
        ("Tenure.", f"{TEN_U1} of {TEN_N} who disclosed it have been here under a year. "
                    "None beyond two."),
        ("The two asks, repeated across every department.",
         "More hands for patient safety, and welfare: health insurance, pension, fair and "
         "timely pay, recognition, clinical training."),
        ("Tone.", "Almost every critical comment is prefaced with warmth about the place. "
                  "These are people asking to be invested in by an employer they like."),
    ], MX, y, PAGE_W - 2 * MX - 20, size=11.5, leading=15, gap=10)


def slide_central(c, n):
    chrome(c, n, "The central finding")
    heading(c, "Processes exist. They are not followed. That has four causes.")
    y = PAGE_H - 160
    w = (PAGE_W - 2 * MX - 3 * 14) / 4
    for i, (num, title, body) in enumerate([
        ("01", "Nobody was taught them",
         "Procedures are emailed and staff are expected to absorb them. Two of three "
         "nurses interviewed had never had any training on them. No induction, no "
         "sign-off, no refresher."),
        ("02", "Nobody measures them",
         "No compliance audit, no spot check, no exception report. Supervision is real but "
         "informal, and triggered by error. Adherence is invisible until it fails."),
        ("03", "The workforce is new",
         f"{TEN_U1} of {TEN_N} under a year, none beyond two. A workforce this new cannot "
         "inherit institutional habit. There is nobody to inherit it from."),
        ("04", "Several cannot be followed",
         "The daily claims audit is assigned to a post nobody holds. The witness control "
         "needs two officers where one is rostered. The nursing procedure prohibits what "
         "it has just instructed."),
    ]):
        x = MX + i * (w + 14)
        c.setFillColor(SURFACE)
        c.roundRect(x, y - 190, w, 190, 8, fill=1, stroke=0)
        c.setFillColor(GOLD)
        c.rect(x, y - 190, 4, 190, fill=1, stroke=0)
        c.setFillColor(GOLD)
        c.setFont("Helvetica-Bold", 16)
        c.drawString(x + 18, y - 34, num)
        c.setFillColor(NAVY)
        c.setFont("Helvetica-Bold", 12)
        for k, ln in enumerate(wrap(c, title, "Helvetica-Bold", 12, w - 36)):
            c.drawString(x + 18, y - 58 - k * 15, ln)
        para(c, body, x + 18, y - 96, "Helvetica", 10, BODY, w - 36, 13.5)

    callout(c, MX, y - 210, PAGE_W - 2 * MX,
            "Writing more procedure will not close this, and enforcing what exists would "
            "in several cases enforce something impossible. Rebuild the core processes "
            "with the people who run them, then train, sign off and audit, in that order.",
            bg=CREAM, spine=GOLD)


def slide_people(c, n):
    chrome(c, n, "People systems")
    heading(c, "Rated across the employee lifecycle: 1.4 out of 5")
    y = PAGE_H - 152
    y = table(c, MX, y, [170, 60, PAGE_W - 2 * MX - 230], [
        ["Stage", "Rating", "What is missing"],
        ["Workforce planning", "1", "An establishment plan by role and shift, linked to "
                                    "volume and acuity"],
        ["Selection", "2", "Role profiles, structured interview, competency assessment, "
                           "credential verification"],
        ["Onboarding", "1", "Defined induction, procedure walkthrough and sign-off, 30 and "
                            "90 day checkpoints"],
        ["Training", "1", "Annual calendar, mandatory clinical currency, competency "
                          "framework, training record"],
        ["Performance", "1", "Objectives set by management, monthly one to one, quarterly "
                             "review. Staff were asked to write their own indicators"],
        ["Reward", "2", "Published grade and pay structure, transparent review basis, a "
                        "decided benefits position"],
        ["Engagement", "2", "Regular all-staff forum, department briefing rhythm, closed "
                            "feedback loop. Two general meetings in a year"],
        ["Retention", "1", "Exit interviews, tenure and turnover reporting, cost of "
                           "turnover model"],
    ], size=9.8)

    callout(c, MX, y - 16, PAGE_W - 2 * MX,
            "The opening review scored this workstream 3.0 on the strength of rosters and "
            "departmental schedules. Those are scheduling artefacts. Haven has "
            "administration; it does not yet have human resources.", bg=BAD_BG, spine=BAD,
            fg=BODY)


def slide_alignment(c, n):
    chrome(c, n, "The decision above the others")
    heading(c, "Two legitimate instincts at owner level, no agreed resolution")
    y = PAGE_H - 152
    half = (PAGE_W - 2 * MX) / 2 - 12
    for i, (title, body, colour, bgc) in enumerate([
        ("Weighted to the workforce",
         "Right that Haven's entire quality proposition rests on people, and that the "
         "turnover exposure is real and under-measured. Cautious about applying commercial "
         "pressure to a young team doing difficult work.", TEAL, SURFACE),
        ("Weighted to the commercial model",
         "Right that a young facility committing to benefits it cannot sustain damages the "
         "workforce more, not less. Cautious about fixed costs a fifteen month old "
         "facility has not yet earned.", NAVY, SURFACE),
    ]):
        x = MX + i * (half + 24)
        c.setFillColor(bgc)
        c.roundRect(x, y - 130, half, 130, 8, fill=1, stroke=0)
        c.setFillColor(colour)
        c.rect(x, y - 130, 5, 130, fill=1, stroke=0)
        c.setFillColor(NAVY)
        c.setFont("Helvetica-Bold", 14)
        c.drawString(x + 20, y - 32, title)
        para(c, body, x + 20, y - 56, "Helvetica", 11, BODY, half - 40, 15)

    y = y - 154
    y = para(c, "The problem is not that both views exist. It is that the trade-off has "
                "never been settled, written down, and given to management as a rule. So "
                "the answer to any question depends on which owner is asked, and "
                "management learns to avoid asking. That is how a benefits decision goes "
                "unresolved while appearing in every staff survey.",
             MX, y, "Helvetica", 12, BODY, PAGE_W - 2 * MX, 17)

    callout(c, MX, y - 14, PAGE_W - 2 * MX,
            "The fix is five or six written operating principles that convert both "
            "instincts into one decision rule. Section 19 of the report drafts them. The "
            "central one: workforce investment is funded from identified yield "
            "improvement, so it is real and it is earned.", bg=CREAM, spine=GOLD)


def slide_commercial(c, n):
    chrome(c, n, "Where the money is")
    heading(c, "Your two highest-value assets are not managed for yield")
    y = PAGE_H - 156
    half = (PAGE_W - 2 * MX) / 2 - 12

    c.setFillColor(SURFACE)
    c.roundRect(MX, y - 216, half, 216, 8, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(MX, y - 216, 5, 216, fill=1, stroke=0)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 15)
    c.drawString(MX + 20, y - 32, "The neonatal unit")
    para(c, "The highest-yield service you run and the hardest to replicate. A staffed, "
            "equipped, empty cot costs almost as much as an occupied one. It is not the "
            "focus of the outreach effort, and neonatal referral is a clinical sale, not a "
            "general marketing one. Your business development team is working genuinely "
            "hard and has not been given the clinical content to hold that conversation "
            "with paediatricians, obstetricians and maternity centres.",
         MX + 20, y - 58, "Helvetica", 10.8, BODY, half - 40, 14.5)

    x2 = MX + half + 24
    c.setFillColor(SURFACE)
    c.roundRect(x2, y - 216, half, 216, 8, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(x2, y - 216, 5, 216, fill=1, stroke=0)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 15)
    c.drawString(x2 + 20, y - 32, "The laboratory")
    para(c, "Sound workflow, accuracy validated against an external reference laboratory. "
            "No economic instrumentation at all. Nobody measures how many reportable "
            "results a reagent pack produces against how many it should, so wastage from "
            "repeat testing, calibration and low batch utilisation is invisible. "
            "Under-loaded analysers make every result more expensive. Servicing is "
            "reactive, and samples are referred out at unquantified cost while machines "
            "are repaired.",
         x2 + 20, y - 58, "Helvetica", 10.8, BODY, half - 40, 14.5)

    y = y - 236
    callout(c, MX, y, PAGE_W - 2 * MX,
            "Both gaps close with content and measurement, not headcount. Specialist "
            "clinics delivered 119 encounters in six months across thirteen consultant "
            "relationships. Speech therapy delivered one. Nephrology, a lead promoted "
            "specialism, delivered none.", bg=WARN_BG, spine=WARN, fg=BODY)


def slide_estate(c, n):
    chrome(c, n, "The building")
    heading(c, "Space is now on the critical path, and two items are compliance")
    y = PAGE_H - 152
    y = table(c, MX, y, [190, 110, PAGE_W - 2 * MX - 300], [
        ["Constraint", "Nature", "Why it matters"],
        ["General ward drainage", "Compliance", "The ward floods when it rains. Infection "
                                                "prevention, electrical safety and service "
                                                "continuity are all implicated"],
        ["Controlled medicines storage", "Compliance", "Correctly segregated but "
                                                       "insufficient capacity. The exposure "
                                                       "grows with volume"],
        ["Inpatient bed spaces", "Capacity", "Named repeatedly by staff as the limit on "
                                             "patient care. Caps inpatient growth"],
        ["Caregiver access", "Experience", "Parents repeatedly raise the staircases and ask "
                                           "for lift access"],
        ["Consultation rooms", "Capacity", "Constrains sessional specialist clinics, "
                                           "otherwise a low capital growth option"],
    ], size=10)

    y = callout(c, MX, y - 18, PAGE_W - 2 * MX,
                "Drainage and controlled medicines storage should be remediated now, as "
                "compliance items, not as part of any expansion case. They are inexpensive "
                "against their risk and neither should wait on a capital decision.",
                bg=BAD_BG, spine=BAD, fg=BODY)

    para(c, "One of your staff put the strategic version better than we could: what we "
            "have is working, but we are growing bigger.",
         MX, y - 22, "Helvetica-Oblique", 12, MUTED, PAGE_W - 2 * MX, 16)


def slide_maturity(c, n):
    chrome(c, n, "The assessment")
    heading(c, "The average moved a little. The distribution moved a lot.")
    y = PAGE_H - 148
    y = table(c, MX, y, [200, 80, 70, PAGE_W - 2 * MX - 350], [
        ["Workstream", "Opening", "Now", "Why"],
        ["Patient experience", "2.0", "4.5", "Now evidenced, and the strongest result in "
                                             "the audit"],
        ["Human resources", "3.0", "2.0", "Rosters are scheduling, not people systems"],
        ["Performance management", "3.0", "2.0", "Reporting exists; nothing sits above it"],
        ["Clinical operations", "4.0", "3.0", "Delivery strong, establishment thin"],
        ["Clinical governance", "n/a", "1.5", "Separated out. No incidents, audit or "
                                              "compatibility method"],
        ["Revenue cycle", "2.0", "2.0", "Front end works; the record behind it does not"],
        ["Finance", "2.0", "1.5", "Now evidenced. No accounting record was produced"],
        ["Risk and compliance", "2.0", "1.5", "No register, no audit, licensing unresolved"],
        ["Overall", "3.0", "2.5", "Two workstreams rose sharply, seven fell"],
    ], size=10)

    callout(c, MX, y - 16, PAGE_W - 2 * MX,
            "Everything that touches the patient scored better than we assumed. Everything "
            "that supports the patient scored worse. Haven has been building outward and "
            "has not yet built inward.", bg=CREAM, spine=GOLD)


def slide_this_week(c, n):
    chrome(c, n, "This week")
    heading(c, "Six things that should not wait for a plan or a board meeting")
    y = PAGE_H - 158
    y = bullets(c, [
        ("Submit the registration renewal.", "Registration itself is confirmed. Get the "
                                              "current year renewal in and confirm the "
                                              "health insurance scheme position in "
                                              "writing."),
        ("Start a fridge temperature log today.", "Every day without one adds to a period "
                                                  "of vaccination for which cold chain "
                                                  "cannot be evidenced. N5.3M of "
                                                  "vaccination revenue sits behind it."),
        ("Roster a pharmacist on every dispensing day.", "Paediatric doses are weight "
                                                         "calculated and verification "
                                                         "currently happens without a "
                                                         "pharmacist on the premises."),
        ("Set a floor of two registered nurses in the building.", "And stop rostering "
                                                                  "non-nursing staff as "
                                                                  "nursing cover."),
        ("Commission a load calculation for the neonatal unit.", "The primary generator is "
                                                                 "recorded down for six "
                                                                 "months while ventilated "
                                                                 "neonates were cared for."),
        ("Turn on nightly backup of the clinical record system.", "It is the record for "
                                                                  "both care and billing, "
                                                                  "and none operated "
                                                                  "through the half year."),
    ], MX, y, PAGE_W - 2 * MX - 20, size=12, leading=16, gap=11)

    callout(c, MX, y - 4, PAGE_W - 2 * MX,
            "None of these six is a recommendation in the ordinary sense. They are the "
            "conditions under which the rest of this work can sensibly be implemented.",
            bg=BAD_BG, spine=BAD, fg=BODY)


def slide_ninety(c, n):
    chrome(c, n, "The first ninety days")
    heading(c, "Settle the direction, then build the people system, then measure it")
    y = PAGE_H - 152
    y = table(c, MX, y, [110, PAGE_W - 2 * MX - 110], [
        ["Window", "What gets done"],
        ["Days 0 to 30", "Board alignment session producing written operating principles. "
                         "Clinical incident register open. Departmental objectives "
                         "published, five per department. Benefits position decided and "
                         "communicated. The last pay round explained."],
        ["Days 30 to 60", "Structured induction built and run retrospectively for everyone "
                          "hired in the last twelve months. Performance cycle live. Core "
                          "procedures redesigned with the teams who run them. Complaints "
                          "framework. Laboratory yield audit. Neonatal referral programme."],
        ["Days 60 to 90", "Adherence audit against the redesigned procedures. Retention "
                          "diagnostic from payroll. Finance review and receivables. "
                          "Continuous patient experience measurement. Referral tracking. "
                          "Senior operations leader recruited."],
        ["Months 4 to 12", "Clinical governance committee and audit programme. Competency "
                           "framework. Published grade structure. Governance instrument "
                           "set. Service line reporting by contribution. Estate decision "
                           "executed. Membership and bundled care launched."],
    ], size=10.2)

    callout(c, MX, y - 16, PAGE_W - 2 * MX,
            "One sequencing rule matters above the rest. Do not audit adherence before the "
            "procedures have been redesigned and people have been inducted. Auditing "
            "people against standards they were never taught converts goodwill into "
            "resentment, and goodwill is the asset this whole plan depends on.",
            bg=CREAM, spine=GOLD)


def slide_decisions(c, n):
    chrome(c, n, "Strategic choices")
    heading(c, "Five decisions, and what we would do")
    y = PAGE_H - 150
    y = table(c, MX, y, [150, PAGE_W - 2 * MX - 150 - 230, 230], [
        ["Decision", "Options", "Our recommendation"],
        ["Where growth comes from", "Deepen the current site, extend it, open a second "
                                    "site, or extend reach without consuming the building",
         "Deepen and extend reach now. Decide the extension within two quarters on the "
         "estate review. No second site until maturity reaches 3.5"],
        ["Who runs the hospital", "Founder-led and strengthened, a senior operations "
                                  "leader, or an interim then a permanent hire",
         "Interim operating capability now so the ninety day plan lands, then recruit "
         "permanently into a role proven rather than imagined"],
        ["The workforce proposition", "Lean employer, credible employer, or premium "
                                      "employer",
         "Credible, phased, funded explicitly from yield. Publish the structure and explain "
         "the last round immediately; both cost nothing"],
        ["The service portfolio", "Continue selling episodes, or add membership and "
                                  "bundled care",
         "Design the membership and bundle programme now, launch when capacity and "
         "measurement can carry it. The prize is reversing the cash cycle"],
        ["How it is funded", "From operations, debt against the estate, or partner capital",
         "Operations for everything in year one. Debt only once the estate review "
         "quantifies the return and service line reporting exists"],
    ], size=9.5)

    callout(c, MX, y - 16, PAGE_W - 2 * MX,
            "Settle the workforce proposition before committing capital to growth. It is "
            "what makes the growth deliverable.", bg=CREAM, spine=GOLD)


def slide_close(c, n):
    c.setFillColor(NAVY)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.setFillColor(DEEP_NAVY)
    c.rect(0, 0, PAGE_W, 12, fill=1, stroke=0)
    c.rect(0, PAGE_H - 12, PAGE_W, 12, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(MX, PAGE_H - 150, 44, 3, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(GOLD)
    c.drawString(MX + 56, PAGE_H - 153, "WHERE THIS LEAVES YOU")

    c.setFont("Helvetica-Bold", 30)
    c.setFillColor(white)
    y = PAGE_H - 205
    for ln in wrap(c, "The hard part is done. The machinery is not.",
                   "Helvetica-Bold", 30, PAGE_W - 2 * MX - 120):
        c.drawString(MX, y, ln)
        y -= 38

    y = para(c,
             "Haven is fifteen months old and already delivers care that families trust "
             "and that staff will defend anonymously. What is not built is the induction "
             "that carries the standard to the next nurse, the record that proves what was "
             "done, the rota that means the standard does not depend on who is on shift, "
             "and the measurement that tells you before a family does.",
             MX, y - 16, "Helvetica", 13.5, LIGHT, PAGE_W - 2 * MX - 100, 20)

    y = para(c,
             "None of that requires capital you do not have or talent you cannot hire. "
             "Most of the first ninety days is decisions, documents and discipline.",
             MX, y - 14, "Helvetica", 13.5, LIGHT, PAGE_W - 2 * MX - 100, 20)

    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(MX, y - 22,
                 "Close the three questions. Then build the people system. Then grow.")

    c.setFillColor(GOLD)
    c.rect(MX, 74, 60, 3, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica", 10.5)
    c.drawString(MX, 52, "Dr Debo Odulana, Founding Partner, Consult for Africa")
    c.setFillColor(LIGHT)
    c.drawString(MX, 36, "hello@consultforafrica.com   /   +234 913 813 8553   /   "
                         "consultforafrica.com")


# ---- register in order -----------------------------------------------------
for _fn in [slide_cover, slide_evidence, slide_headline, slide_working,
            slide_three_questions, slide_licence, slide_establishment, slide_record,
            slide_reporting, slide_patients, slide_staff, slide_central, slide_people,
            slide_alignment, slide_commercial, slide_estate, slide_maturity,
            slide_this_week, slide_ninety, slide_decisions, slide_close]:
    slide(_fn)


def build():
    c = canvas.Canvas(str(OUT), pagesize=landscape(A4))
    c.setTitle("Haven Paediatrics - Organisational Audit: Findings for the Board")
    c.setAuthor("Consult for Africa")
    for i, fn in enumerate(SLIDES, 1):
        fn(c, i)
        c.showPage()
    c.save()
    print(f"wrote {OUT.relative_to(ROOT)}  ({len(SLIDES)} slides, "
          f"{OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    build()
