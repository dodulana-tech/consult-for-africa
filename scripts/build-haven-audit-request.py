"""
Build the Haven Paediatric Centre diagnostic-audit Information & Data Request PDF.

Source: docs/haven-audit-information-request.md
Output: docs/haven-audit-information-request-cfa.pdf  (A4, branded, multi-page)

Run:
  python3 scripts/build-haven-audit-request.py
"""

from __future__ import annotations

from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.platypus import (
    BaseDocTemplate, Frame, KeepTogether, PageTemplate, Paragraph, Spacer, Table, TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
OUT = DOCS / "haven-audit-information-request-cfa.pdf"

NAVY = HexColor("#0B3C5D")
GOLD = HexColor("#D4AF37")
TEAL = HexColor("#1F7A8C")
BODY = HexColor("#1F2937")
MUTED = HexColor("#6B7280")
SURFACE = HexColor("#F1F5F9")
LIGHT = HexColor("#C9D6E0")
CREAM = HexColor("#FBF6E6")

PAGE_W, PAGE_H = A4
MARGIN = 46


def st(name, **kw):
    base = dict(fontName="Helvetica", fontSize=9.7, leading=13.5, textColor=BODY, alignment=TA_LEFT, spaceAfter=3)
    base.update(kw)
    return ParagraphStyle(name, **base)


H1 = st("h1", fontName="Helvetica-Bold", fontSize=11.5, leading=14, textColor=NAVY, spaceBefore=11, spaceAfter=5)
P = st("p")
LEDE = st("lede", fontSize=10, leading=14.5, textColor=HexColor("#374151"))
SMALL = st("small", fontSize=8.3, leading=11.5, textColor=MUTED)


def furniture(c, doc):
    c.saveState()
    c.setFillColor(NAVY)
    c.rect(0, PAGE_H - 34, PAGE_W, 34, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(0, PAGE_H - 37, PAGE_W, 3, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(MARGIN, PAGE_H - 23, "CONSULT FOR AFRICA")
    c.setFillColor(LIGHT)
    c.setFont("Helvetica", 8.5)
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 23, "Haven Paediatric Centre  /  Information & Data Request")
    c.setFillColor(GOLD)
    c.rect(MARGIN, 30, 24, 2, fill=1, stroke=0)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8)
    c.drawString(MARGIN, 18, "Confidential  /  Prepared for the Haven Paediatric Centre board and management")
    c.drawRightString(PAGE_W - MARGIN, 18, "Page %d" % doc.page)
    try:
        _ic = ImageReader(str(DOCS / "c4a-icon.png"))
        _iw, _ih = _ic.getSize()
        _h = 22.0
        _w = _h * _iw / _ih
        c.drawImage(_ic, PAGE_W - MARGIN - _w, PAGE_H - 61, width=_w, height=_h, mask="auto")
    except Exception:
        pass
    c.restoreState()


CRIT = ' <font color="#0B3C5D"><b>[Week&nbsp;1]</b></font>'


def bullet(text, crit=False):
    return Paragraph("•&nbsp;&nbsp;" + text + (CRIT if crit else ""), P)


def section(title, items):
    """items: list of (text, crit_bool). Kept together so a heading never orphans."""
    out = [Paragraph(title, H1)]
    out += [bullet(t, cr) for (t, cr) in items]
    return KeepTogether(out) if len(items) <= 6 else out  # long sections may break


def callout(text, bg=CREAM, spine=GOLD, style=None):
    style = style or ParagraphStyle("co", parent=P, fontName="Helvetica-Bold", textColor=NAVY, leading=14)
    t = Table([[Paragraph(text, style)]], colWidths=[PAGE_W - 2 * MARGIN])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("LINEBEFORE", (0, 0), (0, -1), 3, spine),
        ("TOPPADDING", (0, 0), (-1, -1), 8), ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 12), ("RIGHTPADDING", (0, 0), (-1, -1), 12),
    ]))
    return t


SECTIONS = [
    ("A.  Corporate, licensing & governance", [
        ("Certificate of incorporation, shareholding/ownership structure, current board composition", False),
        ("Facility operating licence and regulatory registrations (HEFAMAA Lagos and any others), current validity", False),
        ("Organisation chart / organogram with reporting lines", True),
        ("Register of current policies and the SOP index (a list of what exists)", False),
        ("Board and management meeting minutes, last 12 months", False),
        ("Professional indemnity / facility insurance policies; details of any pending litigation or regulatory action", False),
    ]),
    ("B.  Finance: statements, ledgers & cash", [
        ("Monthly management accounts / profit & loss, last 12 months", True),
        ("Latest balance sheet and most recent prior year-end", False),
        ("Bank statements for all accounts, last 6–12 months", True),
        ("Latest trial balance and the chart of accounts", False),
        ("Current-year budget and budget-vs-actual, if prepared", False),
        ("Fixed asset register", False),
        ("Any audited financials or prior accountant's / auditor's reports", False),
        ("Accounting system in use, with read access or exports", False),
    ]),
    ("C.  Revenue & receivables", [
        ("Revenue by service line / department, monthly, last 12 months", True),
        ("Revenue split by payer: self-pay / private vs each HMO", False),
        ("Debtors / receivables ageing by payer, current, where the ~N4.2M sits", True),
        ("Current price list / tariff for all services", True),
        ("Deposit, billing and credit policy (documented or described)", False),
    ]),
    ("D.  HMO / payer economics", [
        ("All HMO contracts and tariff schedules (Leadway, NEM, and any others)", True),
        ("HMO claims register: submitted / approved / rejected / paid / outstanding, per HMO", False),
        ("Claim rejection reasons (summary or raw log)", False),
        ("Enrollee volumes and typical claim-cycle time per HMO", False),
        ("Any capitation vs fee-for-service arrangements", False),
    ]),
    ("E.  Pharmacy, stock & inventory", [
        ("Full current stock count (drugs and consumables) with quantities and values (the ~N2.77M)", True),
        ("Stock valuation method and last stock-count date", False),
        ("Pharmacy sales report, last 6–12 months", False),
        ("Purchase records / supplier invoices, last 6–12 months", False),
        ("Reorder levels and stock-control policy, if any", False),
        ("Expired / near-expiry and wastage log", False),
        ("Stockout log or list of known stockout incidents", False),
        ("Current crash-cart contents list and any existing check records", False),
        ("Pharmacy margin working (cost vs selling by line, if available)", False),
    ]),
    ("F.  Procurement & payables", [
        ("Supplier list with credit terms and typical lead times", False),
        ("Procurement and approval process (documented or described)", False),
        ("Creditors / accounts-payable ageing", False),
        ("Any existing vendor-managed-inventory or consignment arrangements", False),
    ]),
    ("G.  Staffing, payroll & HR", [
        ("Full staff list: name, role, department, employment type, start date", True),
        ("Payroll register / salary schedule (gross, allowances, deductions, net), last 3 months", True),
        ("Job descriptions for all roles, and any current KPIs", False),
        ("Current staff commission / incentive structure, and the proposed one awaiting board approval", True),
        ("Employment contracts / offer letters (samples plus key clinical roles)", False),
        ("Duty rosters / shift schedules, last 2 months", False),
        ("Staff turnover: joiners and leavers, last 12 months", False),
        ("Training records (including BLS / PALS / NRP / resuscitation)", False),
        ("Disciplinary and grievance log", False),
        ("Statutory compliance status: PAYE, pension, NHF", False),
    ]),
    ("H.  Clinical governance & patient safety", [
        ("Clinical protocols and guidelines in use (general paediatrics and NICU)", False),
        ("Incident / adverse-event register and near-miss log", False),
        ("Mortality & morbidity review records and M&M meeting minutes", False),
        ("Emergency / resuscitation protocols, the crash-cart standard, and resuscitation training records", False),
        ("Medication-management policy and sample drug charts", False),
        ("Infection prevention & control policy and any audit records", False),
        ("NICU admission criteria and protocols", False),
        ("Consent forms and sample clinical documentation; patient complaints register", False),
    ]),
    ("I.  Operations & patient flow", [
        ("Patient volumes by month, last 12 months: OPD attendances, admissions, NICU admissions", True),
        ("Average length of stay and bed occupancy (general and NICU)", False),
        ("Booking / appointment system and its data", False),
        ("SOPs for registration, triage, admission, discharge and billing (what exists)", False),
        ("Any patient-satisfaction or customer-feedback data; facility layout and bed configuration", False),
    ]),
    ("J.  Management reporting & systems", [
        ("The current management report(s) (including the fortnightly report) and any dashboards", True),
        ("The list of KPIs currently tracked", False),
        ("EMR / HMIS / billing software in use, with read access or data exports", False),
    ]),
]


def build():
    doc = BaseDocTemplate(
        str(OUT), pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN, topMargin=50, bottomMargin=40,
        title="Haven Paediatric Centre - Information & Data Request", author="Consult For Africa",
    )
    frame = Frame(MARGIN, 40, PAGE_W - 2 * MARGIN, PAGE_H - 50 - 40, id="f")
    doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=furniture)])

    el = []
    el.append(Paragraph("Diagnostic Audit", ParagraphStyle("t", fontName="Helvetica-Bold", fontSize=19, leading=22, textColor=NAVY, spaceAfter=1)))
    el.append(Paragraph("Information & Data Request", ParagraphStyle("s", fontName="Helvetica-Bold", fontSize=12.5, leading=15, textColor=TEAL, spaceAfter=6)))
    el.append(Paragraph("Consult for Africa  ·  Workstream 1 of the engagement  ·  for the Haven Paediatric Centre board and management", SMALL))
    el.append(Spacer(1, 8))
    el.append(Paragraph("<b>Point of contact (Haven):</b> to be nominated; we suggest the Head of Operations.", P))
    el.append(Paragraph("<b>How to share:</b> a single secure, read-only shared folder with a sub-folder per section. A CSV / Excel export from the accounting, EMR or payroll system is perfectly fine. Everything is handled under strict confidentiality and used only for this audit.", P))
    el.append(Spacer(1, 6))
    el.append(callout(
        "The twelve Week-1 Critical items are marked [Week&nbsp;1]. These unlock the analysis "
        "immediately; the rest can follow during weeks 1 to 2. Nothing here is a test; partial or "
        "imperfect records are themselves a finding, so please share what exists rather than "
        "reconstructing anything."))
    el.append(Spacer(1, 4))

    for title, items in SECTIONS:
        block = section(title, items)
        if isinstance(block, list):
            el.extend(block)
        else:
            el.append(block)

    el.append(Spacer(1, 8))
    el.append(Paragraph("What happens with this", H1))
    el.append(Paragraph(
        "Week 1 we reconcile the numbers, size the working-capital opportunity precisely, and map the "
        "operating model. Week 2 we are on site for interviews and observation. Week 3 covers finance, "
        "procurement, HMO and reporting-integrity deep-dives. Week 4 we synthesise into a prioritised, "
        "costed plan and present to the board. Two quick wins (the crash-cart standard and the "
        "Leadway/NEM receivables push) begin in week 1, before the audit reports.", P))
    el.append(Spacer(1, 8))
    el.append(callout(
        "<b>Consult for Africa</b> &nbsp; hello@consultforafrica.com &nbsp;·&nbsp; +234 913 813 8553 "
        "&nbsp;·&nbsp; consultforafrica.com",
        bg=NAVY, spine=GOLD,
        style=ParagraphStyle("wc", parent=P, textColor=white, fontName="Helvetica")))

    doc.build(el)
    print(f"wrote {OUT}")


if __name__ == "__main__":
    build()
