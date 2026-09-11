"""
Build the HSH Board and Committee Instruments Pack as INDIVIDUAL, FILLABLE FILES.

The master reference document (docs/hsh-board-instruments-pack-cfa.pdf) explains
the system. This script produces the working files the Company Secretary, chairs,
and executives actually type into: Word for narrative instruments, Excel for the
tabular registers and schedules. Everything is branded, pre-structured, and uses
[square brackets] for fields to complete.

Output:
  docs/hsh-instruments/                      the individual files
  docs/hsh-board-instruments-pack-cfa.zip    the whole set plus the master PDF

Run:
  python3 scripts/build-hsh-instrument-files.py
"""

from __future__ import annotations

import shutil
import zipfile
from pathlib import Path

from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
OUT = DOCS / "hsh-instruments"
ZIP_PATH = DOCS / "hsh-board-instruments-pack-cfa.zip"
MASTER_PDF = DOCS / "hsh-board-instruments-pack-cfa.pdf"

NAVY = RGBColor(0x0B, 0x3C, 0x5D)
TEAL = RGBColor(0x1F, 0x7A, 0x8C)
GREY = RGBColor(0x6B, 0x72, 0x80)
BODY = RGBColor(0x1F, 0x29, 0x37)

X_NAVY = "0B3C5D"
X_TEAL = "1F7A8C"
X_GOLD = "D4AF37"
X_SURFACE = "F1F5F9"
X_CREAM = "FBF6E6"
X_WHITE = "FFFFFF"

FONT = "Arial"
ORG = "HAVANA SPECIALIST HOSPITAL LIMITED"


# --------------------------------------------------------------- docx helpers
def shade(cell, hex_fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), hex_fill)
    tc_pr.append(shd)


def no_borders(table):
    tbl_pr = table._tbl.tblPr
    borders = OxmlElement("w:tblBorders")
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        el = OxmlElement(f"w:{edge}")
        el.set(qn("w:val"), "none")
        borders.append(el)
    tbl_pr.append(borders)


def run(p, text, size=10, bold=False, italic=False, color=BODY, font=FONT):
    r = p.add_run(text)
    r.font.name = font
    r.font.size = Pt(size)
    r.bold = bold
    r.italic = italic
    r.font.color.rgb = color
    return r


def new_doc(instrument_name):
    doc = Document()
    for s in doc.sections:
        s.top_margin = Inches(0.7)
        s.bottom_margin = Inches(0.7)
        s.left_margin = Inches(0.85)
        s.right_margin = Inches(0.85)

    normal = doc.styles["Normal"]
    normal.font.name = FONT
    normal.font.size = Pt(10)
    normal.paragraph_format.space_after = Pt(6)

    hdr = doc.sections[0].header.paragraphs[0]
    run(hdr, ORG, size=8, bold=True, color=TEAL)

    ftr = doc.sections[0].footer.paragraphs[0]
    run(ftr, f"Consult for Africa   /   Confidential   /   {instrument_name}",
        size=7.5, color=GREY)
    return doc


def title_block(doc, instrument_no, title, subtitle, meta_lines):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(2)
    run(p, f"INSTRUMENT {instrument_no}", size=8.5, bold=True, color=TEAL)

    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(3)
    run(p, title, size=19, bold=True, color=NAVY)

    if subtitle:
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(8)
        run(p, subtitle, size=10.5, color=GREY)

    for line in meta_lines:
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(1)
        run(p, line, size=8.5, color=GREY)
    doc.add_paragraph()


def h1(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(4)
    run(p, text, size=12.5, bold=True, color=NAVY)
    return p


def h2(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(8)
    p.paragraph_format.space_after = Pt(3)
    run(p, text, size=10.5, bold=True, color=TEAL)
    return p


def para(doc, text, size=10, italic=False, color=BODY):
    p = doc.add_paragraph()
    run(p, text, size=size, italic=italic, color=color)
    return p


def bullets(doc, items):
    for it in items:
        p = doc.add_paragraph(style="List Bullet")
        p.paragraph_format.space_after = Pt(3)
        run(p, it, size=10)


def guidance(doc, text):
    """Cream guidance box. Delete-before-use instructions for the author."""
    t = doc.add_table(rows=1, cols=1)
    t.alignment = WD_TABLE_ALIGNMENT.LEFT
    cell = t.cell(0, 0)
    shade(cell, X_CREAM)
    no_borders(t)
    cell.paragraphs[0].paragraph_format.space_after = Pt(0)
    run(cell.paragraphs[0], text, size=8.5, italic=True, color=NAVY)
    doc.add_paragraph().paragraph_format.space_after = Pt(2)


def fields(doc, rows, label_w=1.9, value_w=4.6):
    """Label / fillable-value grid."""
    t = doc.add_table(rows=len(rows), cols=2)
    no_borders(t)
    for i, (label, hint) in enumerate(rows):
        c0, c1 = t.rows[i].cells
        c0.width = Inches(label_w)
        c1.width = Inches(value_w)
        for c in (c0, c1):
            c.paragraphs[0].paragraph_format.space_after = Pt(2)
        run(c0.paragraphs[0], label, size=9.5, bold=True, color=NAVY)
        run(c1.paragraphs[0], hint, size=9.5, color=GREY)
    doc.add_paragraph().paragraph_format.space_after = Pt(2)
    return t


def grid(doc, headers, rows, widths=None):
    t = doc.add_table(rows=1 + len(rows), cols=len(headers))
    t.style = "Table Grid"
    for j, htext in enumerate(headers):
        cell = t.cell(0, j)
        shade(cell, X_NAVY)
        cell.paragraphs[0].paragraph_format.space_after = Pt(1)
        run(cell.paragraphs[0], htext, size=8.5, bold=True,
            color=RGBColor(0xFF, 0xFF, 0xFF))
    for i, r in enumerate(rows):
        for j, val in enumerate(r):
            cell = t.cell(i + 1, j)
            if i % 2 == 1:
                shade(cell, X_SURFACE)
            cell.paragraphs[0].paragraph_format.space_after = Pt(1)
            run(cell.paragraphs[0], val, size=8.5)
    if widths:
        for j, w in enumerate(widths):
            for row in t.rows:
                row.cells[j].width = Inches(w)
    doc.add_paragraph().paragraph_format.space_after = Pt(2)
    return t


def write_lines(doc, n=3, label=None):
    """Blank ruled space to write into."""
    if label:
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(2)
        run(p, label, size=9.5, bold=True, color=NAVY)
    t = doc.add_table(rows=n, cols=1)
    t.style = "Table Grid"
    for i in range(n):
        t.cell(i, 0).paragraphs[0].paragraph_format.space_after = Pt(6)
        run(t.cell(i, 0).paragraphs[0], "", size=10)
    doc.add_paragraph().paragraph_format.space_after = Pt(2)


META = ["Template issued by Consult for Africa for the Board of Havana Specialist Hospital Limited.",
        "Adopted by the Board on [date]. Administered by the Company Secretary.",
        "Complete every field in [square brackets]. Delete the italic guidance before circulating."]


# --------------------------------------------------------------- xlsx helpers
THIN = Side(style="thin", color="D5DBE1")
BORDER = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)


def xl_new(title):
    wb = Workbook()
    wb.remove(wb.active)
    wb.properties.title = title
    wb.properties.creator = "Consult for Africa"
    return wb


def xl_sheet(wb, name, headers, widths, rows=None, title=None, note=None,
             freeze="A5"):
    ws = wb.create_sheet(name[:31])
    ws.sheet_properties.tabColor = X_NAVY

    ws["A1"] = title or name
    ws["A1"].font = Font(name=FONT, size=14, bold=True, color=X_NAVY)
    ws["A2"] = ORG.title().replace("Limited", "Limited")
    ws["A2"].font = Font(name=FONT, size=9, color="6B7280")
    if note:
        ws["A3"] = note
        ws["A3"].font = Font(name=FONT, size=8.5, italic=True, color="6B7280")

    hrow = 4
    for j, h in enumerate(headers, start=1):
        c = ws.cell(row=hrow, column=j, value=h)
        c.font = Font(name=FONT, size=9, bold=True, color=X_WHITE)
        c.fill = PatternFill("solid", fgColor=X_NAVY)
        c.alignment = Alignment(vertical="center", wrap_text=True)
        c.border = BORDER
    ws.row_dimensions[hrow].height = 30

    for i, r in enumerate(rows or [], start=hrow + 1):
        for j, v in enumerate(r, start=1):
            c = ws.cell(row=i, column=j, value=v)
            c.font = Font(name=FONT, size=9)
            c.alignment = Alignment(vertical="top", wrap_text=True)
            c.border = BORDER
            if (i - hrow) % 2 == 0:
                c.fill = PatternFill("solid", fgColor=X_SURFACE)

    for j, w in enumerate(widths, start=1):
        ws.column_dimensions[get_column_letter(j)].width = w
    ws.freeze_panes = freeze
    return ws


def xl_validation(ws, col_letter, options, first=5, last=200):
    dv = DataValidation(type="list", formula1='"' + ",".join(options) + '"',
                        allow_blank=True)
    ws.add_data_validation(dv)
    dv.add(f"{col_letter}{first}:{col_letter}{last}")
    return dv


def blank_rows(n, cols):
    return [[""] * cols for _ in range(n)]


# ------------------------------------------------------------- instrument 01
def build_01():
    doc = new_doc("Instrument 1, Consolidated Board Pack")
    title_block(doc, "1", "Consolidated Board Pack",
                "Cover sheet, contents, and the Company Secretary's assembly checklist",
                META)
    guidance(doc, "One pack, one file, assembled by the Company Secretary and circulated seven clear "
                  "days before the meeting. Target 40 pages. If it exceeds 60, the problem is the "
                  "reporting, not the printer.")

    h1(doc, "Cover")
    fields(doc, [
        ("Meeting", "[Board / committee name]"),
        ("Date and time", "[day, date, start and end time]"),
        ("Venue", "[venue, and video link]"),
        ("Chair", "[name]"),
        ("Company Secretary", "[name]"),
        ("Pack issued on", "[date]  (must be seven clear days before the meeting)"),
        ("Pack version", "[v1.0]"),
        ("Classification", "Confidential, for directors and named attendees only"),
    ])

    h1(doc, "Contents and assembly checklist")
    grid(doc,
         ["Tab", "Section", "Prepared by", "Max length", "Received", "In pack"],
         [["A", "Agenda and meeting notice", "Company Secretary with the Chair", "1 page", "[ ]", "[ ]"],
          ["B", "Chair's introduction, the three things that matter", "Board Chair", "1 page", "[ ]", "[ ]"],
          ["C", "Minutes of the previous meeting, for approval", "Company Secretary", "as required", "[ ]", "[ ]"],
          ["D", "Action and decision log, with status", "Company Secretary", "1 to 2 pages", "[ ]", "[ ]"],
          ["E", "Management report by exception", "Medical Director with Afya leads", "3 pages", "[ ]", "[ ]"],
          ["F", "Performance dashboard and KPI pack", "Head of Finance, Hospital Manager", "2 pages", "[ ]", "[ ]"],
          ["G", "Finance pack: accounts, cash, debtors, variance", "Head of Finance", "4 pages", "[ ]", "[ ]"],
          ["H", "Committee reports, one page each", "The five committee chairs", "5 pages", "[ ]", "[ ]"],
          ["I", "Afya-HSH Governance Committee report", "Joint committee, countersigned", "1 to 2 pages", "[ ]", "[ ]"],
          ["J", "Risk register summary", "Audit and Risk chair", "1 to 2 pages", "[ ]", "[ ]"],
          ["K", "Board papers for decision, one per matter", "Sponsoring executive", "2 pages each", "[ ]", "[ ]"],
          ["L", "Papers for noting", "Various", "as required", "[ ]", "[ ]"],
          ["M", "Governance and compliance: filings, interests, attendance", "Company Secretary", "1 page", "[ ]", "[ ]"]],
         widths=[0.4, 2.5, 1.7, 0.8, 0.6, 0.5])

    h1(doc, "The five rules of the pack")
    bullets(doc, [
        "Cap it. Target 40 pages, hard question at 60.",
        "Decision-ready. Every agenda item is labelled Decision, Discussion, or Noting.",
        "Exception only. Sections E to J report variance and exception, not underlying data.",
        "No tabling on the day. Papers not circulated with the pack are not taken, unless the "
        "Chair rules the matter urgent and the minute records why.",
        "One version. The Company Secretary issues the pack. Directors do not receive side-papers "
        "from individual executives.",
    ])

    h1(doc, "Compliance note to the meeting")
    fields(doc, [
        ("Seven-day rule met", "[Yes / No]"),
        ("If no, which papers were late", "[list, and the reason]"),
        ("Chair notified", "[Yes / No, date]"),
    ])
    guidance(doc, "The Company Secretary reports compliance with the seven-day rule at every meeting. "
                  "Directors who receive papers late are entitled to say so, and the minute should record it.")

    doc.save(OUT / "01-consolidated-board-pack-cover-and-checklist.docx")


# ------------------------------------------------------------- instrument 02
def build_02():
    doc = new_doc("Instrument 2, Agenda")
    title_block(doc, "2", "Meeting Agenda",
                "For the Board and, with the remit substituted, for every committee", META)

    fields(doc, [
        ("Meeting", "[Board / committee name]"),
        ("Date", "[day, date]"),
        ("Time", "[start] to [end]"),
        ("Venue", "[venue, and video link]"),
        ("Chair", "[name]"),
        ("Secretary", "[name]"),
        ("Quorum required", "[number, per the articles or the terms of reference]"),
    ])

    h1(doc, "Agenda")
    grid(doc,
         ["No.", "Item", "Lead", "Type", "Time"],
         [["1", "Welcome, quorum, and apologies", "Chair", "Noting", "5 min"],
          ["2", "Declarations of interest", "Chair", "Noting", "5 min"],
          ["3", "Minutes of the meeting of [date]", "Chair", "Decision", "5 min"],
          ["4", "Matters arising and action log", "Secretary", "Noting", "10 min"],
          ["5", "Chair's introduction", "Chair", "Noting", "5 min"],
          ["6", "Management report by exception", "Medical Director", "Discussion", "20 min"],
          ["7", "Finance and performance", "Head of Finance", "Discussion", "20 min"],
          ["8.1", "Finance, Investment and Operations report", "Co-chairs", "Noting", "10 min"],
          ["8.2", "Audit and Risk report", "Chair", "Noting", "10 min"],
          ["8.3", "Quality and Clinical Governance report", "Chair", "Noting", "10 min"],
          ["8.4", "People and Remuneration report", "Chair", "Noting", "5 min"],
          ["8.5", "Transformation and Digital report", "Chair", "Noting", "5 min"],
          ["9", "Afya partnership performance (standing item)", "Chair", "Discussion", "20 min"],
          ["10", "Risk register summary", "Audit and Risk chair", "Discussion", "10 min"],
          ["11", "Decision items: [matter]", "[sponsor]", "Decision", "15 min"],
          ["12", "Items for noting", "Secretary", "Noting", "5 min"],
          ["13", "Any other business notified to the Chair in advance", "Chair", "Noting", "5 min"],
          ["14", "In-camera session, non-executive directors only", "Chair", "Discussion", "10 min"],
          ["15", "Date of next meeting", "Chair", "Noting", "2 min"]],
         widths=[0.45, 3.15, 1.15, 0.85, 0.6])

    h1(doc, "Standing notes for the Chair")
    bullets(doc, [
        "Item 2 is never a formality. Ask explicitly, and have the Secretary record each declaration "
        "in the minute and in the register.",
        "Item 9 is a standing item and cannot be dropped. It is the board's independent line of sight "
        "over the operating partner. If there is nothing to report, the minute says so.",
        "Item 14 is the non-executives alone, no executives and no Afya present, for ten minutes at "
        "every meeting. Routine from the first meeting, so that it never looks like an event.",
        "Times are real. A meeting that habitually overruns is an agenda problem, not a discipline problem.",
    ])
    doc.save(OUT / "02-agenda-template.docx")


# ------------------------------------------------------------- instrument 03
def build_03():
    doc = new_doc("Instrument 3, Board Paper")
    title_block(doc, "3", "Board Paper",
                "The one-page decision paper. No matter comes to the board for decision without one.",
                META)

    fields(doc, [
        ("Paper number", "[BD/2026/09/01]"),
        ("Meeting and date", "[Board, 24 September 2026]"),
        ("Title", "[short, plain title]"),
        ("Sponsor", "[the executive who owns this]"),
        ("Author", "[if different from the sponsor]"),
        ("Committee route", "[which committee reviewed it, and what it recommended]"),
        ("Type", "[DECISION / DISCUSSION / NOTING]"),
    ])

    sections = [
        ("1. The decision requested",
         "One sentence. \"The board is asked to approve X, at a cost of Y, funded from Z.\" "
         "If you cannot write this sentence, the paper is not ready.", 2),
        ("2. Why now",
         "Two or three sentences. What has changed, and what happens if the board does not "
         "decide at this meeting.", 2),
        ("3. Background",
         "Short. Assume directors have read the last pack, not the last decade.", 3),
        ("4. The options considered",
         "Option A, with cost, benefit, and risk. Option B, the same. Option C, do nothing, "
         "and the consequence of it.", 4),
        ("5. Recommendation and why",
         "Which option, and the reasoning in plain terms.", 3),
        ("6. Financial effect",
         "Capital and revenue effect, budget line, whether budgeted or not, payback or return "
         "where relevant, cash effect and timing.", 3),
        ("7. Risks and mitigations",
         "The three that matter, and who owns each.", 3),
        ("8. Legal, regulatory, and clinical implications",
         "Including whether this is a reserved matter, whether it touches the Afya agreement, "
         "and whether any related party is involved.", 3),
        ("9. Who is affected, and who has been consulted",
         "Including staff, clinicians, and where relevant both shareholder families.", 2),
        ("10. How we will know it worked",
         "The measure, the target, and the date it comes back to the board.", 2),
    ]
    for heading, hint, lines in sections:
        h2(doc, heading)
        guidance(doc, hint)
        write_lines(doc, lines)

    fields(doc, [("Prepared by", "[name, role, date]")])
    guidance(doc, "Section 10 is the one most often omitted and the one that most changes behaviour. "
                  "A board that always asks how we will know it worked, and when it comes back, gets "
                  "better proposals within two cycles.")
    doc.save(OUT / "03-board-paper-template.docx")


# ------------------------------------------------------------- instrument 04
COMMITTEE_CONTENT = {
    "Finance, Investment and Operations Committee": [
        "Management accounts against budget",
        "Cash and working capital position",
        "Debtor and HMO receivable position, aged",
        "Capital and investment appraisals",
        "Operational KPIs and delivery against plan",
        "The commercial performance of the Afya arrangement",
    ],
    "Audit and Risk Committee": [
        "Internal control findings",
        "Internal and external audit progress and findings",
        "The enterprise risk register and its movements",
        "Related-party transactions",
        "Statutory filings and compliance status",
        "Going-concern judgement",
        "The independent read on Afya's financial delivery",
    ],
    "Quality and Clinical Governance Committee": [
        "Clinical quality and safety metrics",
        "Serious incidents and never events, with the learning from each",
        "Mortality and morbidity review",
        "Infection prevention and control",
        "Complaints and patient experience",
        "Credentialing currency",
        "Accreditation and regulatory readiness",
        "Clinical risk feeding the single enterprise register",
    ],
    "People and Remuneration Committee": [
        "Board composition and the appointment pipeline",
        "Induction and board evaluation",
        "Executive and senior remuneration",
        "The workforce position, including vacancy and turnover",
        "The conflicts and related-party register",
        "The sitting allowance and participation policy",
    ],
    "Transformation and Digital Committee": [
        "Roadmap milestones against plan",
        "System selection and implementation status",
        "Data governance and information security posture",
        "Benefits realised against the business case",
        "The committee's own sunset review",
    ],
    "Afya-HSH Governance Committee": [
        "Operational performance against the agreed KPI set",
        "Partnership milestones",
        "Service issues and their resolution",
        "Decisions taken within delegated authority",
        "Matters escalated to the board",
    ],
}


def committee_report_doc(committee_name, filename, generic=False):
    doc = new_doc(f"Instrument 4, Committee Report{'' if generic else ', ' + committee_name}")
    title_block(doc, "4", "Committee Report to the Board",
                committee_name if not generic
                else "One page. The same shape for all five board committees and for the Afya-HSH Governance Committee.",
                META)
    guidance(doc, "One page. The board reads six of these in one familiar format, so resist the urge "
                  "to redesign it. Detail belongs in the committee, not here.")

    fields(doc, [
        ("Committee", committee_name if not generic else "[committee name]"),
        ("Chair", "[name]"),
        ("Meeting date", "[date]"),
        ("Attendance", "[x] of [y]"),
        ("Quorate", "[Yes / No]"),
        ("Reporting to", "Board meeting of [date]"),
    ])

    h2(doc, "1. What we decided, within our delegated authority")
    write_lines(doc, 3)

    h2(doc, "2. What we are assured on")
    guidance(doc, "The two or three things the committee has satisfied itself about, and on what evidence.")
    write_lines(doc, 3)

    h2(doc, "3. What we are not yet assured on")
    guidance(doc, "Say it plainly. This section is the reason the committee exists. \"Nothing\" is an "
                  "acceptable answer once, and a warning sign twice.")
    write_lines(doc, 3)

    h2(doc, "4. Exceptions and variances we examined")
    grid(doc, ["Metric", "Plan", "Actual", "Explanation", "Action", "Owner", "By when"],
         [[""] * 7 for _ in range(4)],
         widths=[1.1, 0.55, 0.55, 1.5, 1.4, 0.75, 0.65])

    h2(doc, "5. Risks we are escalating to the board")
    grid(doc, ["Risk", "Rating", "Movement since last quarter", "Owner"],
         [[""] * 4 for _ in range(3)],
         widths=[2.7, 0.7, 1.75, 1.35])

    h2(doc, "6. What we need from the board")
    fields(doc, [
        ("DECISION", "[specific ask, cross-referenced to the board paper number]"),
        ("STEER", "[where the committee wants the board's direction]"),
        ("NOTING", "[everything else]"),
    ])

    h2(doc, "7. Our next meeting, and what is on it")
    write_lines(doc, 2)

    if not generic:
        h1(doc, "This committee's standing content")
        guidance(doc, "The format above is common to every committee. The content below is what this "
                      "committee brings to sections 2 to 5 each quarter. Use it as the completeness check.")
        bullets(doc, COMMITTEE_CONTENT[committee_name])
    else:
        h1(doc, "Standing content by committee")
        guidance(doc, "The format is common; the content is not. Each committee brings its own standing "
                      "set to sections 2 to 5.")
        for name, items in COMMITTEE_CONTENT.items():
            h2(doc, name)
            bullets(doc, items)

    doc.add_paragraph()
    fields(doc, [("Signed", "[chair]"), ("Date", "[date]")])
    doc.save(OUT / filename)


def build_04():
    committee_report_doc("", "04-committee-report-template-GENERIC.docx", generic=True)
    sub = OUT / "04-committee-reports-prefilled"
    sub.mkdir(exist_ok=True)
    slugs = {
        "Finance, Investment and Operations Committee": "04a-finance-investment-operations.docx",
        "Audit and Risk Committee": "04b-audit-and-risk.docx",
        "Quality and Clinical Governance Committee": "04c-quality-and-clinical-governance.docx",
        "People and Remuneration Committee": "04d-people-and-remuneration.docx",
        "Transformation and Digital Committee": "04e-transformation-and-digital.docx",
        "Afya-HSH Governance Committee": "04f-afya-hsh-governance-committee.docx",
    }
    for name, fn in slugs.items():
        committee_report_doc(name, f"04-committee-reports-prefilled/{fn}")


# ------------------------------------------------------------- instrument 05
def build_05():
    doc = new_doc("Instrument 5, Management Report by Exception")
    title_block(doc, "5", "Management Report by Exception",
                "Three pages maximum. Written by the Medical Director with the Afya operational leads.",
                META)

    fields(doc, [
        ("Period", "[quarter]"),
        ("Prepared by", "[Medical Director] with [Afya operational lead]"),
        ("Date", "[date]"),
    ])

    h2(doc, "1. The three things the board should know")
    guidance(doc, "Three bullets. If a director reads nothing else, this is what they must not miss. "
                  "At least one should be uncomfortable.")
    write_lines(doc, 3)

    h2(doc, "2. Performance against plan")
    guidance(doc, "Reference the dashboard. Narrate only what is off plan. For every exception, answer "
                  "the four standing questions in the table below.")
    grid(doc, ["Exception", "Why different from plan?", "One-off or trend?",
               "What is being done, by whom, by when?", "What would make it worse?"],
         [[""] * 5 for _ in range(4)],
         widths=[1.3, 1.4, 0.95, 1.7, 1.15])

    h2(doc, "3. What went well, briefly")
    guidance(doc, "Two or three. Boards that only ever hear problems stop being told about them.")
    write_lines(doc, 2)

    h2(doc, "4. What is coming")
    guidance(doc, "The next quarter: what management expects, and what could knock it off course.")
    write_lines(doc, 3)

    h2(doc, "5. Where we need the board")
    fields(doc, [
        ("Decisions requested", "[cross-referenced to board papers]"),
        ("Steers wanted", "[where management wants direction]"),
        ("Where we feel blocked", "[say it here, plainly]"),
    ])

    h2(doc, "6. Declared escalations since the last meeting")
    guidance(doc, "What crossed a threshold, when it was escalated, to whom, and how it was resolved. "
                  "Nil returns are stated as nil, not left blank.")
    grid(doc, ["What happened", "Threshold crossed", "Date", "Escalated to", "Resolution"],
         [[""] * 5 for _ in range(4)],
         widths=[1.6, 1.3, 0.7, 1.35, 1.55])

    guidance(doc, "Section 6 is the honesty test of the whole system. If serious things happened and "
                  "this section is empty, the escalation thresholds are not being used, and that is a "
                  "governance failure whatever the underlying result looked like.")
    doc.save(OUT / "05-management-report-by-exception.docx")


# ------------------------------------------------------------- instrument 08
def build_08():
    doc = new_doc("Instrument 8, Minutes")
    title_block(doc, "8", "Minutes",
                "A statutory record, not a transcript. Minutes exist to show that the board applied its mind.",
                META)

    p = doc.add_paragraph()
    run(p, ORG, size=11, bold=True, color=NAVY)
    p = doc.add_paragraph()
    run(p, "MINUTES OF THE [BOARD / COMMITTEE] MEETING", size=11, bold=True, color=NAVY)
    p = doc.add_paragraph()
    run(p, "HELD ON [date] AT [time], AT [venue and video link]", size=10, color=BODY)
    doc.add_paragraph()

    fields(doc, [
        ("PRESENT", "[name, role]  [in person / by video]"),
        ("IN ATTENDANCE", "[name, role, and for which items]"),
        ("APOLOGIES", "[name, role]"),
        ("QUORUM", "The Chair confirmed that a quorum was present and the meeting was properly "
                   "constituted, notice having been given in accordance with the articles."),
    ])

    h2(doc, "1. Declarations of interest")
    guidance(doc, "Record precisely. [Name] declared an interest in item [n] as [nature]. [Name] "
                  "withdrew for item [n] and took no part in the discussion or the decision. The "
                  "register was updated.")
    write_lines(doc, 3)

    h2(doc, "2. Minutes of the previous meeting")
    para(doc, "RESOLVED: that the minutes of the meeting held on [date] be approved as a correct "
              "record and signed by the Chair.")

    h2(doc, "3. [Substantive item]")
    guidance(doc, "Repeat this block for each item. Record what the board received, what it relied on, "
                  "the substance of the discussion including the principal challenge and any dissent, "
                  "then the resolution in operative words with its reasons, then the action.")
    para(doc, "The board received paper [ref] from [sponsor].")
    para(doc, "The board noted [the key facts relied on].")
    para(doc, "The board discussed [the substance, including the principal points of challenge].")
    para(doc, "[Where a director dissented and asked for it to be recorded, record it by name.]")
    para(doc, "RESOLVED: that [the decision, in operative words], for the reasons that [the reasons].")
    para(doc, "ACTION: [owner] to [action] by [date].")
    write_lines(doc, 4)

    h2(doc, "[N]. In-camera session")
    para(doc, "The non-executive directors met without the executives present. [Chair to note any "
              "matter arising, or that none arose.]")

    h2(doc, "[N]. Date of next meeting")
    para(doc, "There being no further business the Chair closed the meeting at [time].")
    doc.add_paragraph()
    fields(doc, [("Signed", "___________________________  Chair"), ("Date", "___________________________")])

    h1(doc, "What good minutes do, and do not do")
    bullets(doc, [
        "DO record the decision in operative words, and the reasons for it.",
        "DO record the information the board relied on, so a later reader can see the board was "
        "properly informed.",
        "DO record declarations, recusals, and withdrawals precisely, including that the director "
        "took no part in the decision.",
        "DO record dissent where a director asks for it. That is the director's protection.",
        "DO NOT attribute every contribution by name. Minutes that read like a transcript make "
        "directors cautious, and cautious directors challenge less.",
        "DO NOT leave a decision implied. If it is not resolved in the minute, it was not decided.",
        "Draft within five working days, to the Chair within seven, circulate with the next pack.",
    ])
    doc.save(OUT / "08-minutes-template.docx")


# ------------------------------------------------- xlsx instruments 06,07,09,10,11,12
def build_06():
    wb = xl_new("HSH Performance Dashboard and KPI Pack")
    cols = ["Metric", "Unit", "Plan", "Actual", "Variance", "Prior period",
            "Direction", "RAG threshold", "RAG", "Commentary, exceptions only"]
    widths = [34, 10, 11, 11, 11, 13, 11, 16, 8, 42]

    families = {
        "Activity": ["Admissions", "Bed occupancy rate", "Average length of stay", "Theatre cases",
                     "Theatre utilisation", "Outpatient attendances, new", "Outpatient attendances, follow-up",
                     "Emergency attendances", "Imaging volumes", "Laboratory volumes", "Deliveries"],
        "Quality and safety": ["Crude mortality", "Reviewed mortality", "Never events",
                               "Serious incidents reported", "Serious incidents reviewed within policy",
                               "Healthcare-associated infection rate", "Unplanned readmission within 28 days",
                               "Unplanned return to theatre", "Medication errors", "Patient falls",
                               "Surgical safety checklist compliance", "Complaints received",
                               "Complaints upheld", "Time to complaint resolution", "Patient experience score"],
        "Workforce": ["Vacancy rate, medical", "Vacancy rate, nursing", "Vacancy rate, other",
                      "Nurse staffing against establishment", "Turnover", "Stability index",
                      "Sickness absence", "Overtime spend against budget", "Locum spend against budget",
                      "Credentialing and licence currency", "Mandatory training compliance"],
        "Finance": ["Revenue", "Payer mix, self-pay", "Payer mix, HMO", "Payer mix, corporate",
                    "Payer mix, retainer", "EBITDA", "Cash days on hand", "Debtor days",
                    "HMO receivables, total", "HMO receivables over 90 days", "Claims submitted",
                    "Claims rejected first submission", "Collection rate",
                    "Payroll as percentage of revenue", "Drugs and consumables as percentage of revenue",
                    "Capital spend against plan"],
        "Access and experience": ["Outpatient waiting time", "Time from decision to theatre",
                                  "Emergency door-to-clinician time", "Discharge before noon",
                                  "Cancelled operations", "Cancellation reason profile"],
        "Partnership and transformation": ["Afya milestones against plan", "Partnership KPI set, met",
                                           "Management fee", "Service credits applied",
                                           "Transformation milestones against plan",
                                           "Benefits realised against business case"],
        "Risk and compliance": ["Open high-rated risks", "Overdue risk actions", "Overdue incident reviews",
                                "Regulatory and accreditation status", "Statutory filings status",
                                "Open litigation and claims"],
    }

    for fam, metrics in families.items():
        rows = [[m] + [""] * 9 for m in metrics]
        ws = xl_sheet(wb, fam, cols, widths, rows,
                      title=f"Performance dashboard, {fam.lower()}",
                      note="Monthly for the Afya-HSH Governance Committee, consolidated quarterly for the board. "
                           "RAG thresholds are set by the board; until then, report the numbers without a status colour.")
        xl_validation(ws, "G", ["Improving", "Stable", "Worsening"], last=100)
        xl_validation(ws, "I", ["Green", "Amber", "Red", "Not set"], last=100)

    wb.save(OUT / "06-performance-dashboard-and-kpi-pack.xlsx")


def build_07():
    wb = xl_new("HSH Risk Register")
    cols = ["Ref", "Risk, in one sentence a non-specialist understands", "Category",
            "Likelihood 1-5", "Impact 1-5", "Score", "Movement", "Controls in place now",
            "Further action, by whom, by when", "Owner", "Target score", "Next review",
            "Board action requested"]
    widths = [7, 46, 16, 13, 12, 9, 12, 34, 34, 16, 12, 13, 26]
    ws = xl_sheet(wb, "Enterprise register", cols, widths, blank_rows(40, len(cols)),
                  title="Enterprise risk register",
                  note="One register, two lenses. Owned by Audit and Risk; the clinical lens is read at "
                       "Quality and Clinical Governance. A score of 15 or above escalates to the board automatically.")
    xl_validation(ws, "C", ["Clinical", "Financial", "Operational", "Workforce",
                            "Regulatory", "Reputational", "Partnership", "Information"], last=100)
    xl_validation(ws, "G", ["New", "Increased", "Static", "Reduced", "Closed"], last=100)
    for r in range(5, 45):
        ws.cell(row=r, column=6).value = f"=IF(AND(ISNUMBER(D{r}),ISNUMBER(E{r})),D{r}*E{r},\"\")"

    sum_cols = ["Ref", "Risk", "Score", "Movement", "Owner", "Target score", "Next review",
                "What the board is asked to do"]
    xl_sheet(wb, "Board summary", sum_cols, [7, 46, 9, 12, 16, 12, 13, 30],
             blank_rows(15, len(sum_cols)),
             title="Risk register summary to the board",
             note="Top risks only, plus new risks, risks closed and why, overdue actions, and where we are "
                  "operating outside the risk appetite the board has set.")

    xl_sheet(wb, "Scoring key", ["Score", "Band", "What it means", "Escalation"],
             [10, 14, 46, 40],
             [["1 to 4", "Low", "Tolerable, managed within normal operations", "Committee only"],
              ["5 to 9", "Moderate", "Monitor, controls should be evidenced", "Committee only"],
              ["10 to 14", "High", "Active management, named owner and dated actions", "Committee, board on request"],
              ["15 to 25", "Extreme", "Board-level risk", "Escalates to the board automatically"]],
             title="Scoring key, 5 by 5", note="Likelihood by impact.")
    wb.save(OUT / "07-risk-register.xlsx")


def build_09():
    wb = xl_new("HSH Action and Decision Log")
    cols = ["Ref", "Meeting", "Decision or action", "Owner, one named person", "Due date",
            "Status", "Note", "Date closed"]
    widths = [14, 14, 52, 22, 12, 14, 34, 12]
    for name in ["Board", "Finance Investment Ops", "Audit and Risk",
                 "Quality and Clinical Gov", "People and Remuneration",
                 "Transformation and Digital", "Afya-HSH Governance"]:
        ws = xl_sheet(wb, name, cols, widths, blank_rows(40, len(cols)),
                      title=f"Action and decision log, {name}",
                      note="Rolling. Carried into every meeting, never restarted. Overdue actions are listed "
                           "at every meeting until closed.")
        xl_validation(ws, "F", ["Complete", "On track", "At risk", "Overdue", "Deferred"], last=100)

    xl_sheet(wb, "Rules", ["The four rules"], [110],
             [["An action has one named owner. Not a committee, and not \"management\"."],
              ["An action has a date. \"Ongoing\" is not a date."],
              ["Overdue actions are listed at every meeting until closed. They do not quietly disappear."],
              ["Decisions stay on the log for one meeting after completion, then move to the decision "
               "register held by the Company Secretary."]],
             title="Rules for the log")
    wb.save(OUT / "09-action-and-decision-log.xlsx")


def build_10():
    wb = xl_new("HSH Escalation Thresholds Schedule")
    cols = ["Trigger", "Threshold value, to be set by the board", "Escalates to",
            "Timeframe", "Set at the September board?", "Notes"]
    widths = [52, 30, 40, 20, 22, 30]
    rows = [
        ["Never event, or a death in unexpected circumstances", "Any occurrence",
         "Board Chair and Quality and Clinical Governance chair, then all directors", "Same day", "", ""],
        ["Serious clinical incident, or a cluster of related incidents", "[define severity]",
         "Medical Director to Quality and Clinical Governance chair", "24 hours", "", ""],
        ["Regulatory inspection, notice, sanction, or licence issue", "Any occurrence",
         "Board Chair, Audit and Risk chair", "24 hours", "", ""],
        ["Litigation, or a claim above threshold", "[N5m proposed]",
         "Board Chair, Audit and Risk chair", "48 hours", "", ""],
        ["Data or information security breach", "Any occurrence",
         "Board Chair, Transformation chair, Audit and Risk chair, data protection lead",
         "24 hours internally; the statutory clock runs separately", "", ""],
        ["Cash below threshold days of operating cost", "[30 days proposed]",
         "Board Chair, Finance co-chairs", "Immediate", "", ""],
        ["Budget variance beyond threshold", "[10% on a line, 5% at EBITDA proposed]",
         "Finance, Investment and Operations co-chairs",
         "Next monthly cycle, or immediate if material", "", ""],
        ["Any risk newly rated 15 or above", "Score 15+",
         "Audit and Risk chair, then the board", "Within the week", "", ""],
        ["Unbudgeted commitment above the delegation threshold", "[per the DoA schedule]",
         "Board, as a reserved matter", "Before commitment", "", ""],
        ["Loss of, or material change to, a significant HMO or corporate contract", "[define significant]",
         "Board Chair, Finance co-chairs", "48 hours", "", ""],
        ["Departure or suspension of a senior clinician or executive", "Any occurrence",
         "Board Chair, People and Remuneration chair", "Same day", "", ""],
        ["Any proposed change to the Afya agreement", "Any change",
         "Board, as a reserved matter", "Before agreement", "", ""],
        ["Media, reputational, or community event of significance", "[define significant]",
         "Board Chair", "Same day", "", ""],
    ]
    ws = xl_sheet(wb, "Thresholds", cols, widths, rows,
                  title="Escalation thresholds schedule",
                  note="What must reach the board or a committee chair between meetings, without waiting for "
                       "the quarter. Bracketed values are proposed defaults for the board to set in September.")
    xl_validation(ws, "E", ["Set", "Amended", "Deferred"], last=40)

    xl_sheet(wb, "Escalation log", ["Date", "What happened", "Threshold crossed",
                                    "Escalated to", "Time taken", "Resolution", "Reported to which meeting"],
             [12, 40, 26, 26, 13, 40, 26], blank_rows(40, 7),
             title="Escalation log",
             note="Every escalation recorded here and reported at section 6 of the management report. "
                  "Nil returns are stated as nil.")

    xl_sheet(wb, "The rule", ["The rule that makes this work"], [110],
             [["Escalating is never penalised."],
              ["A threshold crossed and escalated is the system working."],
              ["A threshold crossed and NOT escalated is the only version of this that is a disciplinary matter."],
              ["Say this out loud when the board adopts the schedule."]],
             title="The rule")
    wb.save(OUT / "10-escalation-thresholds-schedule.xlsx")


def build_11():
    wb = xl_new("HSH Register of Interests and Attendance")
    ws = xl_sheet(wb, "Register of interests",
                  ["Director", "Nature of interest", "Entity", "Date declared",
                   "How it relates to HSH", "Management applied", "Date ceased", "Reviewed on"],
                  [22, 30, 26, 13, 34, 28, 13, 13],
                  [["[Family directors]", "Shareholding", "Havana Specialist Hospital Limited", "",
                    "Owner of the company", "Standing declaration; recusal on family remuneration", "", ""],
                   ["[As applicable]", "Operating partner relationship", "Afya Care", "",
                    "Operating partner to HSH", "Declared; independent read retained by ARC and QCGC", "", ""],
                   ["Dr Debo Odulana", "Adviser relationship", "Consult for Africa", "",
                    "Paid adviser on the governance framework",
                    "Recused from any decision on CFA fees or scope", "", ""]] + blank_rows(30, 8),
                  title="Register of interests",
                  note="Maintained continuously by the Company Secretary, declared afresh at the start of each "
                       "board year, and updated within seven days of any change.")
    xl_validation(ws, "B", ["Directorship", "Shareholding", "Employment", "Family relationship",
                            "Supplier relationship", "Professional appointment", "Other"], last=60)
    xl_validation(ws, "F", ["Recusal", "Non-participation", "Information withheld", "None required"], last=60)

    xl_sheet(wb, "Attendance", ["Director", "Board meetings held", "Board attended",
                                "Committee meetings held", "Committee attended",
                                "Papers read on time", "Notes"],
             [24, 18, 15, 20, 18, 18, 34], blank_rows(12, 7),
             title="Attendance register",
             note="Published annually to the board and to the People and Remuneration Committee, which owns "
                  "the participation policy. Attendance is the floor, not the standard.")

    xl_sheet(wb, "Related-party log", ["Date", "Counterparty", "Related director",
                                       "Nature of transaction", "Value", "Approved by",
                                       "Conflict management applied", "Minute reference"],
             [12, 26, 22, 34, 14, 22, 32, 18], blank_rows(30, 8),
             title="Related-party transaction log",
             note="Scrutinised by the Audit and Risk Committee. Transactions above the delegation threshold "
                  "are a reserved matter for the board.")
    wb.save(OUT / "11-register-of-interests-and-attendance.xlsx")


def build_12():
    wb = xl_new("HSH Annual Board and Committee Calendar")
    cols = ["Date", "Day", "Meeting", "Type", "Notes", "Confirmed"]
    widths = [16, 10, 46, 24, 46, 12]

    est = [
        ["1 Sep 2026", "Tue", "Afya-HSH Governance Committee", "Monthly", "", ""],
        ["3 Sep 2026", "Thu", "Transformation and Digital Committee", "Committee", "", ""],
        ["8 Sep 2026", "Tue", "Finance, Investment and Operations Committee", "Committee", "", ""],
        ["9 Sep 2026", "Wed", "Audit and Risk Committee", "Committee", "Including external audit planning", ""],
        ["10 Sep 2026", "Thu", "Quality and Clinical Governance Committee", "Committee", "", ""],
        ["15 Sep 2026", "Tue", "People and Remuneration Committee", "Committee", "", ""],
        ["17 Sep 2026", "Thu", "BOARD PACK CIRCULATED", "Deadline", "Seven clear days before the board", ""],
        ["24 Sep 2026", "Thu", "BOARD MEETING", "Board", "Adoption of the instrument suite; six decisions", ""],
        ["6 Oct 2026", "Tue", "Afya-HSH Governance Committee", "Monthly", "", ""],
        ["8 Oct 2026", "Thu", "Transformation and Digital Committee", "Committee", "", ""],
        ["19 to 22 Oct 2026", "Mon-Thu", "Committee week, all five", "Committee", "", ""],
        ["29 Oct 2026", "Thu", "BOARD PACK CIRCULATED", "Deadline", "", ""],
        ["3 Nov 2026", "Tue", "Afya-HSH Governance Committee", "Monthly", "", ""],
        ["5 Nov 2026", "Thu", "BOARD MEETING", "Board", "Six-weekly establishment cadence", ""],
        ["24 to 26 Nov 2026", "Tue-Thu", "Committee week", "Committee", "", ""],
        ["1 Dec 2026", "Tue", "Afya-HSH Governance Committee", "Monthly", "", ""],
        ["3 Dec 2026", "Thu", "BOARD PACK CIRCULATED", "Deadline", "", ""],
        ["10 Dec 2026", "Thu", "BOARD MEETING", "Board", "Year-end; budget approval for 2027", ""],
    ]
    settled = [
        ["29 to 30 Jan 2027", "Fri-Sat", "Annual strategy session", "Strategy", "Board and senior management", ""],
        ["Monthly, first Tuesday", "Tue", "Afya-HSH Governance Committee", "Monthly", "Throughout 2027", ""],
        ["2 to 4 Mar 2027", "Tue-Thu", "Committee week", "Committee", "", ""],
        ["11 Mar 2027", "Thu", "BOARD PACK CIRCULATED", "Deadline", "", ""],
        ["18 Mar 2027", "Thu", "BOARD MEETING, Q1", "Board", "Annual financial statements; going concern", ""],
        ["1 to 3 Jun 2027", "Tue-Thu", "Committee week", "Committee", "", ""],
        ["10 Jun 2027", "Thu", "BOARD PACK CIRCULATED", "Deadline", "", ""],
        ["17 Jun 2027", "Thu", "BOARD MEETING, Q2", "Board", "Board evaluation and Chair review", ""],
        ["31 Aug to 2 Sep 2027", "Tue-Thu", "Committee week", "Committee", "", ""],
        ["9 Sep 2027", "Thu", "BOARD PACK CIRCULATED", "Deadline", "", ""],
        ["16 Sep 2027", "Thu", "BOARD MEETING, Q3", "Board", "", ""],
        ["23 to 25 Nov 2027", "Tue-Thu", "Committee week", "Committee", "", ""],
        ["2 Dec 2027", "Thu", "BOARD PACK CIRCULATED", "Deadline", "", ""],
        ["9 Dec 2027", "Thu", "BOARD MEETING, Q4", "Board", "Budget approval for 2028", ""],
    ]

    for name, rows, note in [
        ("Establishment phase", est,
         "September to December 2026. Committees meet two to three weeks before the board; the pack goes out "
         "seven clear days ahead. Dates are indicative and confirmed by the Company Secretary."),
        ("Settled cycle 2027", settled,
         "The quarterly rhythm once the establishment phase closes."),
    ]:
        ws = xl_sheet(wb, name, cols, widths, rows, title=name, note=note)
        xl_validation(ws, "F", ["Confirmed", "Provisional", "Moved"], last=60)

    xl_sheet(wb, "Fixed points", ["When", "What", "Owner", "Confirmed"],
             [20, 60, 34, 14],
             [["Q1 board", "Annual financial statements, external audit report, going-concern judgement", "Audit and Risk", ""],
              ["Q1 board", "Confirmation of the Chair's interim appointment", "People and Remuneration", ""],
              ["Q2 board", "Board evaluation and director self-assessment", "People and Remuneration", ""],
              ["Q2 or Q3", "Annual general meeting, and annual return to the Corporate Affairs Commission", "Company Secretary", ""],
              ["Q3 board", "Risk appetite review; insurance and directors' indemnity renewal", "Audit and Risk", ""],
              ["Q4 board", "Annual budget and capital plan approval", "Finance, Investment and Operations", ""],
              ["Q4 board", "Sunset review of the Transformation and Digital Committee", "Board", ""],
              ["Annually", "Register of interests refreshed, declarations retaken", "Company Secretary", ""],
              ["Annually", "Terms of reference and delegation thresholds reviewed", "People and Remuneration", ""]],
             title="Fixed points in the governance year",
             note="TO CONFIRM: the AGM date and the annual return deadline follow HSH's financial year end and "
                  "its incorporation date. The Company Secretary confirms these; the legal faculty confirms the "
                  "statutory deadlines.")
    wb.save(OUT / "12-annual-board-and-committee-calendar.xlsx")


# ---------------------------------------------------------------- readme
def build_readme():
    doc = new_doc("How to use this pack")
    title_block(doc, "0", "How to Use This Pack",
                "The Board and Committee Instruments Pack, as individual working files",
                ["Prepared for the Board of Havana Specialist Hospital Limited and the Company Secretary.",
                 "Prepared by Dr Debo Odulana, Independent Non-Executive Director; Consult for Africa.",
                 "Date: 16 August 2026.  Classification: Confidential."])

    para(doc, "The master document explains the system and why each instrument is shaped as it is. "
              "These are the working files people actually type into. Word for the narrative "
              "instruments, Excel for the registers and schedules. Every field to complete appears "
              "in [square brackets]; italic guidance is for the author and should be deleted before "
              "circulating.")

    h1(doc, "What is in the folder")
    grid(doc, ["File", "Instrument", "Owner"],
         [["hsh-board-instruments-pack-cfa.pdf", "The master reference document", "All"],
          ["01-consolidated-board-pack-cover-and-checklist.docx", "1. Board pack cover and assembly checklist", "Company Secretary"],
          ["02-agenda-template.docx", "2. Agenda, board and committee", "Company Secretary with the Chair"],
          ["03-board-paper-template.docx", "3. Board paper, the decision paper", "Sponsoring executive"],
          ["04-committee-report-template-GENERIC.docx", "4. Committee report, blank plus all standing content", "Committee chairs"],
          ["04-committee-reports-prefilled/", "4. One pre-titled report per committee", "Each committee chair"],
          ["05-management-report-by-exception.docx", "5. Management report", "Medical Director with Afya leads"],
          ["06-performance-dashboard-and-kpi-pack.xlsx", "6. Dashboard and KPIs, seven metric families", "Head of Finance, Hospital Manager"],
          ["07-risk-register.xlsx", "7. Enterprise register, board summary, scoring key", "Audit and Risk chair"],
          ["08-minutes-template.docx", "8. Minutes", "Company Secretary"],
          ["09-action-and-decision-log.xlsx", "9. Action log, one tab per meeting body", "Company Secretary"],
          ["10-escalation-thresholds-schedule.xlsx", "10. Thresholds, escalation log, the rule", "Board, administered by the Secretary"],
          ["11-register-of-interests-and-attendance.xlsx", "11. Interests, attendance, related-party log", "Company Secretary"],
          ["12-annual-board-and-committee-calendar.xlsx", "Calendar, both phases plus fixed points", "Company Secretary"]],
         widths=[2.65, 2.85, 1.6])

    h1(doc, "The two rules that make the suite work")
    bullets(doc, [
        "Nothing reaches the board except through one of these instruments. A verbal update with "
        "no paper is not a board item.",
        "Every template asks the same four things at the end: what is the position against target, "
        "what is the exception, what is the risk, and what decision is requested. Once people learn "
        "that shape, they can fill in any instrument in the pack.",
    ])

    h1(doc, "Before the September board meeting")
    para(doc, "Three things need a decision that the templates deliberately leave open, because they "
              "are the board's to make and not the adviser's:")
    bullets(doc, [
        "The escalation threshold values, bracketed in file 10.",
        "The RAG thresholds for each dashboard metric, the blank column in file 06.",
        "HSH's financial year end, which sets the annual general meeting and the annual return "
        "deadline in file 12. The Company Secretary confirms these, and the legal faculty confirms "
        "the statutory deadlines.",
    ])

    h1(doc, "What the board is asked to do in September")
    grid(doc, ["#", "Decision"],
         [["1", "Adopt the instrument suite, instruments 1 to 11, with effect from this meeting"],
          ["2", "Set the escalation thresholds, filling the bracketed values"],
          ["3", "Set the RAG thresholds for the dashboard metrics"],
          ["4", "Adopt the calendar, and confirm six-weekly for the first three meetings"],
          ["5", "Confirm the delegation thresholds, which the escalation schedule depends on"],
          ["6", "Instruct the Company Secretary to administer the suite, maintain the registers, "
                "and report compliance with the seven-day pack rule at each meeting"]],
         widths=[0.4, 6.1])

    para(doc, "Once those six are minuted, the governance framework is not a document. It is the "
              "operating reality.", italic=True)

    doc.add_paragraph()
    para(doc, "Prepared by Dr Debo Odulana for the Board of Havana Specialist Hospital. Consult for "
              "Africa. Confidential. These instruments set governance process and are not legal "
              "advice; statutory deadlines, filing obligations, and the requirements of the articles "
              "are confirmed by the company's legal advisers and the Company Secretary.",
         size=8.5, color=GREY)
    doc.save(OUT / "00-README-how-to-use-this-pack.docx")


# ---------------------------------------------------------------- build
def build():
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)

    build_readme()
    build_01()
    build_02()
    build_03()
    build_04()
    build_05()
    build_06()
    build_07()
    build_08()
    build_09()
    build_10()
    build_11()
    build_12()

    if MASTER_PDF.exists():
        shutil.copy2(MASTER_PDF, OUT / MASTER_PDF.name)

    files = sorted(p for p in OUT.rglob("*") if p.is_file())
    with zipfile.ZipFile(ZIP_PATH, "w", zipfile.ZIP_DEFLATED) as z:
        for f in files:
            z.write(f, Path("HSH Board and Committee Instruments") / f.relative_to(OUT))

    for f in files:
        print(f"  {f.relative_to(OUT)}")
    print(f"\n{len(files)} files -> {ZIP_PATH} ({ZIP_PATH.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    build()
