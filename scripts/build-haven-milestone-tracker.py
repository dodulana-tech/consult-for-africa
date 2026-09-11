"""
Build the Haven Paediatric Centre six-month milestone tracker PDF.

Six 30-day windows (Month 1 to Month 6) to the growth mandate, each with its
milestones, owner, lever, definition of done, a run-rate target, and an empty
status box to tick. A4 portrait, C4A branded.

Output: docs/haven-milestone-tracker-cfa.pdf
Run:    python3 scripts/build-haven-milestone-tracker.py
"""

from __future__ import annotations
from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.platypus import (
    BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether,
)

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
OUT = DOCS / "haven-milestone-tracker-cfa.pdf"

NAVY = HexColor("#0B3C5D"); DEEP_NAVY = HexColor("#081521"); GOLD = HexColor("#D4AF37")
TEAL = HexColor("#1F7A8C"); BODY = HexColor("#1F2937"); MUTED = HexColor("#6B7280")
SURFACE = HexColor("#F1F5F9"); LIGHT = HexColor("#C9D6E0"); CREAM = HexColor("#FBF6E6")

PAGE_W, PAGE_H = A4
MARGIN = 40
CW = PAGE_W - 2 * MARGIN

MONTHS = [
    ("Month 1 · Days 1-30", "Stabilise & switch on the engine", "~N16M / mo", [
        ("Billing & revenue-capture system live", "Every service delivered is recorded and billed; the handover-sheet record retired.", "Finance + C4A", "Lever 6"),
        ("Tariff mystery-shop + reprice the zero-priced lines", "5-6 peers benchmarked; the 80.9% of lines at zero given defensible prices.", "C4A", "Lever 6"),
        ("Receivables recovery push (Leadway & NEM)", "First tranche of the N4.2M recovered; a weekly chase routine running.", "Finance", "Lever 7"),
        ("Vendor-managed inventory partner selected", "Consignment terms agreed to free the N2.77M in stock and end stockouts.", "Pharmacy + C4A", "Lever 7"),
        ("Referral portal v1 live + inbound analyst calling", "Portal takes referrals; the dedicated analyst working the hospital call list.", "Business dev", "Lever 1"),
        ("NICU repriced + hyperlocal catchment mapped", "New NICU rate set; every maternity unit and Ob/Gyn near GRA Ikeja ranked.", "Dr Odedina + BD", "Lever 2"),
        ("Senior operations leader: role defined, search live", "Spec and KPIs written; candidates being sourced.", "Board + C4A", "Lever 8"),
        ("Safety & just-culture quick wins", "Crash-cart standard locked; just-culture standard drafted from the survey.", "Clinical lead", "Lever 8"),
    ]),
    ("Month 2 · Days 31-60", "Professionalise, drive the NICU, launch the club", "~N24M / mo", [
        ("Senior operations leader in post", "Hired and running the facility day to day.", "Board", "Lever 8"),
        ("NICU growth drive running", "Ob/Gyn NICU tours underway; high-risk antenatal pathway live; first referral agreements signed.", "Dr Odedina + BD", "Lever 2"),
        ("Neonatal transport ambulance operational", "A mobile NICU that collects sick babies from referring facilities.", "Operations", "Lever 2"),
        ("Haven Club launched", "Three plans live; Bump-to-Baby on-ramp open; first members enrolling at every discharge.", "Membership + C4A", "Lever 5"),
        ("New tariff live + HMO renegotiation started", "Repriced tariff in the billing system; new HMO empanelment and renegotiation begun.", "Finance + BD", "Levers 4, 6"),
        ("Management reporting dashboard live", "One reconciled monthly report: revenue by line, EBITDA, occupancy, receivables.", "Finance + C4A", "Lever 8"),
        ("Staff app configured + incentives redesigned", "HR app running onboarding, rota, payslips, KPIs; new commission/JD/KPI structure drafted.", "HR + C4A", "Lever 8"),
    ]),
    ("Month 3 · Days 61-90", "Add the lines & turn on marketing", "~N30M / mo", [
        ("Home care & telemedicine live", "Newborn home checks, post-discharge visits, home phototherapy, virtual follow-ups.", "Clinical", "Lever 9"),
        ("Nutrition, lactation & therapy clinics open", "Nutrition/lactation and developmental & therapy (speech, OT, physio) services live.", "Clinical", "Lever 9"),
        ("First sessional paediatric surgery lists", "Visiting surgeon sessions running; theatre in use.", "Clinical", "Lever 3"),
        ("Lab outsourcing live", "Accredited reference partner running; point-of-care core kept in-house, rest sent out.", "Clinical + C4A", "Lever 7"),
        ("Corporate & school retainers: first signed", "First contracts closed, starting from the Toddler Town relationship.", "Business dev", "Lever 4"),
        ("Marketing engine on", "Events calendar live with the first community event; podcast launched; agency held to booked leads.", "Marketing / agency", "Lever 10"),
        ("Club membership building", "First cohort of members enrolling steadily at discharge and registration.", "Membership lead", "Lever 5"),
    ]),
    ("Month 4 · Days 91-120", "Scale demand & embed the culture", "~N36M / mo", [
        ("NICU occupancy scaling into the season", "Cots filling on the referral pipeline; occupancy climbing week on week.", "Dr Odedina + BD", "Lever 2"),
        ("Referral network widened", "Beyond hyperlocal; the analyst pipeline at full tilt with tracked conversion.", "Business dev", "Lever 1"),
        ("More HMO panels live + corporates growing", "New empanelments active; corporate and school retainers expanding.", "Finance + BD", "Lever 4"),
        ("Club events cadence running; membership growing", "Regular member events; membership base building toward target.", "Membership lead", "Lever 5"),
        ("Cultural transformation embedded", "Onboarding, SOPs, culture & EQ training, peer-to-peer learning, and the new incentives all live.", "HR + Clinical", "Lever 8"),
        ("Add-on clinics maturing", "Dentistry, audiology and allergy/asthma added as they come ready.", "Clinical", "Lever 9"),
    ]),
    ("Month 5 · Days 121-150", "Fill the beds at peak & optimise yield", "~N42M / mo", [
        ("NICU near full through the high season", "Peak occupancy sustained; transport and referrals feeding the cots.", "Dr Odedina + BD", "Lever 2"),
        ("Tariff second tranche / yield optimisation", "Second price step where defensible; payer mix actively managed for margin.", "Finance + C4A", "Lever 6"),
        ("Surgery lists regular; theatre utilisation up", "Sessional surgery a steady line; theatre time well used.", "Clinical", "Lever 3"),
        ("Membership ramp accelerating; renewals live", "Enrolment accelerating; retention and renewal mechanics in place.", "Membership lead", "Lever 5"),
        ("Marketing at pace", "Events, podcast and agency delivering a steady flow of booked leads.", "Marketing / agency", "Lever 10"),
        ("Working-capital discipline holding", "Receivables and stock under control; margin at or above the floor.", "Finance + C4A", "Lever 7"),
    ]),
    ("Month 6 · Days 151-180", "Hit the mandate & lock it in", "~N46M / mo · 18-20% EBITDA", [
        ("Run-rate at N45-50M, EBITDA at the floor", "The mandate met: revenue and 18-20% EBITDA confirmed on the reconciled dashboard.", "Board + C4A", "Mandate"),
        ("NICU at peak; referral engine self-sustaining", "Cots full; referrals flowing without heroics.", "Dr Odedina + BD", "Lever 2"),
        ("Club at first membership milestone", "Membership base at its first target; ancillary spend from members flowing.", "Membership lead", "Lever 5"),
        ("All service lines live and contributing", "Surgery, home care, therapy and diagnostics each carrying revenue.", "Clinical", "Levers 3, 9"),
        ("Licence resolved; accreditation pathway underway", "Establishment licence squared; clinical governance and accreditation in motion.", "Board + C4A", "Quality"),
        ("Plan to hold the run-rate agreed", "A costed plan to carry the peak through the low season, signed off by the board.", "Board + C4A", "Lever 8"),
    ]),
]

def st(name, **kw):
    base = dict(fontName="Helvetica", fontSize=9, leading=11.5, textColor=BODY, alignment=TA_LEFT)
    base.update(kw); return ParagraphStyle(name, **base)

MILE = st("mile", fontName="Helvetica-Bold", fontSize=9.5, leading=12, textColor=NAVY)
DOD = st("dod", fontSize=8.2, leading=10.2, textColor=MUTED)
OWN = st("own", fontSize=8.5, leading=10.5, textColor=BODY)
LEV = st("lev", fontSize=8, leading=10, textColor=TEAL, fontName="Helvetica-Bold")
HDRW = st("hdrw", fontName="Helvetica-Bold", fontSize=8.5, leading=10.5, textColor=white)


def page_bg(c, doc):
    c.saveState()
    c.setFillColor(NAVY); c.rect(0, PAGE_H - 30, PAGE_W, 30, fill=1, stroke=0)
    c.setFillColor(GOLD); c.rect(0, PAGE_H - 33, PAGE_W, 3, fill=1, stroke=0)
    c.setFillColor(white); c.setFont("Helvetica-Bold", 8.5)
    c.drawString(MARGIN, PAGE_H - 20, "CONSULT FOR AFRICA")
    c.setFillColor(LIGHT); c.setFont("Helvetica", 8.5)
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 20, "Haven Paediatric Centre  /  Six-Month Milestone Tracker")
    c.setFillColor(GOLD); c.rect(MARGIN, 26, 20, 2, fill=1, stroke=0)
    c.setFillColor(MUTED); c.setFont("Helvetica", 7.5)
    c.drawString(MARGIN, 16, "Confidential  /  Prepared for the Haven Paediatric Centre board")
    c.drawRightString(PAGE_W - MARGIN, 16, "Page %d" % doc.page)
    try:
        _ic = ImageReader(str(DOCS / "c4a-icon.png"))
        iw, ih = _ic.getSize(); h = 20.0; w = h * iw / ih
        c.drawImage(_ic, PAGE_W - MARGIN - w, PAGE_H - 55, width=w, height=h, mask="auto")
    except Exception:
        pass
    c.restoreState()


def month_block(idx, meta):
    day, title, target, items = meta
    el = []
    # month header bar
    hdr = Table([[
        Paragraph(f'<font size=11><b>{day}</b></font><br/><font size=9.5 color="#D4AF37"><b>{title}</b></font>', HDRW),
        Paragraph(f'<font size=8 color="#C9D6E0">RUN-RATE TARGET</font><br/><font size=13><b>{target}</b></font>',
                  ParagraphStyle("t", parent=HDRW, alignment=2)),
    ]], colWidths=[CW * 0.66, CW * 0.34])
    hdr.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NAVY), ("LINEBELOW", (0, 0), (-1, -1), 2, GOLD),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12), ("TOPPADDING", (0, 0), (-1, -1), 8), ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    # column header
    cols = [CW * 0.55, CW * 0.20, CW * 0.15, CW * 0.10]
    rows = [[Paragraph("Milestone", HDRW), Paragraph("Owner", HDRW), Paragraph("Lever", HDRW), Paragraph("Done", HDRW)]]
    for t, dod, own, lev in items:
        rows.append([
            Paragraph(f"{t}<br/><font size=8.2 color='#6B7280'>{dod}</font>", MILE),
            Paragraph(own, OWN), Paragraph(lev, LEV), Paragraph("", OWN),
        ])
    tbl = Table(rows, colWidths=cols, repeatRows=1)
    style = [
        ("BACKGROUND", (0, 0), (-1, 0), TEAL),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, SURFACE]),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 9), ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LINEBELOW", (0, 0), (-1, -2), 0.5, HexColor("#E3E8EE")),
        ("GRID", (3, 1), (3, -1), 0.9, LIGHT),  # tick boxes down the Done column
        ("ALIGN", (3, 0), (3, -1), "CENTER"),
    ]
    tbl.setStyle(TableStyle(style))
    el.append(hdr); el.append(tbl); el.append(Spacer(1, 14))
    return KeepTogether(el)


def build():
    doc = BaseDocTemplate(str(OUT), pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN,
                          topMargin=44, bottomMargin=34,
                          title="Haven Paediatric Centre - Six-Month Milestone Tracker", author="Consult for Africa")
    frame = Frame(MARGIN, 34, CW, PAGE_H - 44 - 34, id="c")
    doc.addPageTemplates([PageTemplate(id="c", frames=[frame], onPage=page_bg)])

    el = []
    el.append(Paragraph("Haven Growth Plan", st("t1", fontName="Helvetica-Bold", fontSize=22, leading=25, textColor=NAVY)))
    el.append(Paragraph("The first six months, month by month", st("t2", fontName="Helvetica-Bold", fontSize=12.5, leading=15, textColor=TEAL, spaceAfter=6)))
    el.append(Paragraph(
        "The milestones that carry Haven from where it is today to the mandate of N45-50M a month at an "
        "18-20% EBITDA floor. Six 30-day windows, each ending on a run-rate target and feeding the next. "
        "Owners and levers are shown for each milestone; tick the Done column as each is met.",
        st("intro", fontSize=9.5, leading=13, textColor=BODY, spaceAfter=6)))
    # target ramp strip
    ramp = [["M1", "M2", "M3", "M4", "M5", "M6"], ["N16M", "N24M", "N30M", "N36M", "N42M", "N46M"]]
    rt = Table(ramp, colWidths=[CW / 6] * 6)
    rt.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), SURFACE), ("BACKGROUND", (0, 1), (-1, 1), CREAM),
        ("LINEABOVE", (0, 1), (-1, 1), 1.2, GOLD),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"), ("FONTNAME", (0, 1), (-1, 1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 8.5), ("FONTSIZE", (0, 1), (-1, 1), 12),
        ("TEXTCOLOR", (0, 0), (-1, 0), MUTED), ("TEXTCOLOR", (0, 1), (-1, 1), NAVY),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"), ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("GRID", (0, 0), (-1, -1), 0.5, white),
    ]))
    el.append(rt)
    el.append(Paragraph("Monthly run-rate targets, building to the February peak.", st("cap", fontSize=8, leading=10, textColor=MUTED, spaceAfter=12, alignment=TA_CENTER)))

    for i, m in enumerate(MONTHS):
        el.append(month_block(i, m))

    doc.build(el)
    print(f"wrote {OUT}")


if __name__ == "__main__":
    build()
