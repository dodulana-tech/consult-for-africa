"""
Build the three-party Memorandum of Understanding for the Lagos aesthetics and
plastic surgery company, in conventional legal form.

Parties: Medbury Healthcare Group (Dr Itunu Akinware), KP Plastics
(Dr Chinwe Kpaduwa) and Consult for Africa (Dr Adebowale Odulana).

Records the structure the principals settled on 25 and 26 August 2026. Front
sheet, contents, recitals, numbered clauses with hanging indents, schedules and
an execution block. Serif, black, no branding and no decorative panels: this is
an instrument, not a brochure.

MECE by construction. Every term sits in exactly one clause and cross-references
point rather than restate. Every function in Schedule 1 has exactly one
accountable party. Every decision falls into exactly one of four tiers under
clause 9, the fourth being residual so nothing is unassigned.

Matters deliberately left to the Shareholders' Agreement, and listed at
Schedule 3 rather than imposed here: any build-up on a holding, any commitment
continuing after a Party ceases to be a shareholder, and leaver terms.

NGN. No em dashes.

Run:
  python3 scripts/build-aesthetics-mou.py
"""

from __future__ import annotations

import re
from pathlib import Path

from reportlab.lib.colors import HexColor, black
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    BaseDocTemplate, CondPageBreak, Frame, NextPageTemplate, PageBreak,
    PageTemplate, Paragraph, Spacer, Table, TableStyle,
)

import lib_aesthetics_model as MODEL

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
OUT = DOCS / "aesthetics-company-mou-cfa.pdf"

PAGE_W, PAGE_H = A4
LM = RM = 64
TM, BM = 62, 58
FULLW = PAGE_W - LM - RM

RULE = HexColor("#000000")
FAINT = HexColor("#666666")

SERIF, SERIF_B, SERIF_I = "Times-Roman", "Times-Bold", "Times-Italic"


def st(name, **kw):
    base = dict(fontName=SERIF, fontSize=10.5, leading=14.6, textColor=black,
                alignment=TA_JUSTIFY, spaceAfter=0)
    base.update(kw)
    return ParagraphStyle(name, **base)


FS_DATE = st("fsdate", fontName=SERIF_B, fontSize=12, leading=16, alignment=TA_CENTER)
FS_TITLE = st("fstitle", fontName=SERIF_B, fontSize=19, leading=24, alignment=TA_CENTER)
FS_CONN = st("fsconn", fontName=SERIF_I, fontSize=11, leading=15, alignment=TA_CENTER)
FS_PARTY = st("fsparty", fontName=SERIF_B, fontSize=12, leading=16, alignment=TA_CENTER)
FS_SUB = st("fssub", fontSize=11, leading=15, alignment=TA_CENTER)
FS_FOOT = st("fsfoot", fontSize=9, leading=12.5, alignment=TA_CENTER, textColor=FAINT)

H = st("h", fontName=SERIF_B, fontSize=10.5, leading=14.6, alignment=TA_LEFT,
       leftIndent=34, bulletIndent=0, spaceBefore=13, spaceAfter=5, keepWithNext=1)
CL = st("cl", leftIndent=34, bulletIndent=0, spaceAfter=6)
SUBCL = st("subcl", leftIndent=64, bulletIndent=34, spaceAfter=5)
PLAIN = st("plain", spaceAfter=7)
CENTRE_B = st("centreb", fontName=SERIF_B, fontSize=11, leading=15, alignment=TA_CENTER,
              spaceBefore=6, spaceAfter=8)
CENTRE = st("centre", alignment=TA_CENTER, spaceAfter=6)
REC = st("rec", leftIndent=34, bulletIndent=0, spaceAfter=6)
TH = st("th", fontName=SERIF_B, fontSize=9.5, leading=12.6, alignment=TA_LEFT)
TD = st("td", fontSize=9.5, leading=12.6, alignment=TA_LEFT)
TD_C = st("tdc", fontSize=9.5, leading=12.6, alignment=TA_CENTER)
THR = st("thr", fontName=SERIF_B, fontSize=9.5, leading=12.6, alignment=2)
TDR = st("tdr", fontSize=9.5, leading=12.6, alignment=2)
TDB = st("tdb", fontName=SERIF_B, fontSize=9.5, leading=12.6, alignment=TA_LEFT)
TDBR = st("tdbr", fontName=SERIF_B, fontSize=9.5, leading=12.6, alignment=2)
SIGL = st("sigl", fontSize=10, leading=14, alignment=TA_LEFT)


def front_page(c, doc):
    c.saveState()
    c.setStrokeColor(RULE)
    c.setLineWidth(0.8)
    c.rect(LM - 16, BM - 10, FULLW + 32, PAGE_H - TM - BM + 26, fill=0, stroke=1)
    c.restoreState()


def body_page(c, doc):
    c.saveState()
    c.setFont(SERIF, 9)
    c.setFillColor(FAINT)
    c.drawCentredString(PAGE_W / 2.0, 34, str(doc.page - 3))
    c.restoreState()


def plain_page(c, doc):
    return


# Cross-references are SYMBOLIC. A clause registers a label; references write
# {label} and are resolved at build time. The document is built twice: the first
# pass assigns numbers, the second renders with them substituted. Inserting a
# clause anywhere can no longer silently misdirect a reference, which is exactly
# what went wrong before.
_CL = {"clause": 0, "sub": 0}
_LABELS = {}
_RESOLVING = {"pass": 1}


def _res(text):
    if _RESOLVING["pass"] == 1:
        return re.sub(r"\{([a-z0-9_]+)\}", "0.0", text)
    def sub_(m):
        k = m.group(1)
        if k not in _LABELS:
            raise KeyError("undefined cross-reference label: " + k)
        return _LABELS[k]
    return re.sub(r"\{([a-z0-9_]+)\}", sub_, text)


def heading(el, title, label=None):
    _CL["clause"] += 1
    _CL["sub"] = 0
    if label:
        _LABELS[label] = str(_CL["clause"])
    el.append(CondPageBreak(96))
    el.append(Paragraph(title.upper(), H, bulletText="%d." % _CL["clause"]))


def c(el, text, label=None):
    _CL["sub"] += 1
    num = "%d.%d" % (_CL["clause"], _CL["sub"])
    if label:
        _LABELS[label] = num
    el.append(Paragraph(_res(text), CL, bulletText=num))


def sub(el, letter, text):
    el.append(Paragraph(_res(text), SUBCL, bulletText="(%s)" % letter))


def subs(el, items):
    for i, t in enumerate(items):
        sub(el, "abcdefghijklmnop"[i], t)


def table(el, rows, widths, header=None, indent=34, align_c=()):
    data = []
    if header:
        data.append([Paragraph(_res(h), TH) for h in header])
    for r in rows:
        data.append([Paragraph(_res(v), TD_C if j in align_c else TD) for j, v in enumerate(r)])
    t = Table(data, colWidths=widths, repeatRows=1 if header else 0)
    style = [
        ("GRID", (0, 0), (-1, -1), 0.5, RULE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 4.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4.5),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ]
    if header:
        style.append(("LINEBELOW", (0, 0), (-1, 0), 0.9, RULE))
    t.setStyle(TableStyle(style))
    if not indent:
        # append directly: a table nested in a holder cannot split across pages
        el.append(Spacer(1, 3))
        el.append(t)
        el.append(Spacer(1, 10))
        return
    holder = Table([["", t]], colWidths=[indent, FULLW - indent])
    holder.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 3), ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    el.append(holder)


def sig_block(el, party, signatory):
    rows = [
        [Paragraph("SIGNED for and on behalf of<br/><b>%s</b>" % party, SIGL),
         Paragraph("&nbsp;<br/>&nbsp;<br/>_______________________________<br/>%s" % signatory, SIGL)],
        [Paragraph("Date", SIGL), Paragraph("_______________________________", SIGL)],
    ]
    t = Table(rows, colWidths=[FULLW * 0.45, FULLW * 0.55])
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    el.append(t)
    el.append(Spacer(1, 30))


def build():
    doc = BaseDocTemplate(
        str(OUT), pagesize=A4, leftMargin=LM, rightMargin=RM, topMargin=TM, bottomMargin=BM,
        title="Memorandum of Understanding", author="Consult for Africa")
    doc.addPageTemplates([
        PageTemplate(id="front", frames=[Frame(LM, BM, FULLW, PAGE_H - TM - BM, id="f")], onPage=front_page),
        PageTemplate(id="plain", frames=[Frame(LM, BM, FULLW, PAGE_H - TM - BM, id="p")], onPage=plain_page),
        PageTemplate(id="body", frames=[Frame(LM, BM, FULLW, PAGE_H - TM - BM, id="b")], onPage=body_page),
    ])
    el = []
    PCT = MODEL.pct_rounded()

    # ------------------------------------------------------------ front sheet
    el.append(Spacer(1, 60))
    el.append(Paragraph("DATED&nbsp;&nbsp;__________________&nbsp;&nbsp;2026", FS_DATE))
    el.append(Spacer(1, 78))
    el.append(Paragraph("MEDBURY HEALTHCARE GROUP", FS_PARTY))
    el.append(Paragraph("and", FS_CONN))
    el.append(Paragraph("DR CHINWE KPADUWA", FS_PARTY))
    el.append(Paragraph("and", FS_CONN))
    el.append(Paragraph("CONSULT FOR AFRICA", FS_PARTY))
    el.append(Spacer(1, 78))
    el.append(Paragraph("MEMORANDUM OF UNDERSTANDING", FS_TITLE))
    el.append(Spacer(1, 14))
    el.append(Paragraph("relating to the establishment of a joint aesthetics and "
                        "plastic surgery company in Lagos", FS_SUB))
    el.append(Spacer(1, 140))
    el.append(Paragraph("Draft for discussion. Private and confidential.", FS_FOOT))

    el.append(NextPageTemplate("plain"))
    el.append(PageBreak())

    # --------------------------------------------------------------- contents
    el.append(Paragraph("CONTENTS", CENTRE_B))
    el.append(Spacer(1, 6))
    contents = [
        ("1.", "Definitions and interpretation"), ("2.", "Purpose"),
        ("3.", "The Company"), ("4.", "Name"),
        ("5.", "Intellectual property and data"), ("6.", "Contributions"),
        ("7.", "Share capital"), ("8.", "Balance of the framework"),
        ("9.", "Funding and financial arrangements"), ("10.", "Decision making"),
        ("11.", "The Board"), ("12.", "Roles and responsibilities"),
        ("13.", "Relationship with the Medbury group"), ("14.", "Stages and review"),
        ("15.", "Standards of conduct"), ("16.", "Confidentiality"),
        ("17.", "Status of this Memorandum"), ("18.", "Governing law and disputes"),
        ("19.", "General"),
    ]
    tt = Table([[n, t] for n, t in contents], colWidths=[34, FULLW - 34])
    tt.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), SERIF), ("FONTSIZE", (0, 0), (-1, -1), 10.5),
        ("TOPPADDING", (0, 0), (-1, -1), 2.6), ("BOTTOMPADDING", (0, 0), (-1, -1), 2.6),
        ("LEFTPADDING", (0, 0), (-1, -1), 0), ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    el.append(tt)
    el.append(Spacer(1, 18))
    tt = Table([["Schedule 1", "Roles and responsibilities"],
                ["Schedule 2", "Immediate work plan"],
                ["Schedule 3", "Matters to be settled in the Shareholders' Agreement"],
            ["Schedule 4", "Derivation of the shareholding"],
            ["Schedule 4A", "Vesting measures"],
            ["Schedule 5", "What CFA's contributions cover, and over what period"],
            ["Schedule 6", "What the Company needs, and what the ceiling is for"]],
               colWidths=[80, FULLW - 80])
    tt.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), SERIF), ("FONTSIZE", (0, 0), (-1, -1), 10.5),
        ("TOPPADDING", (0, 0), (-1, -1), 2.6), ("BOTTOMPADDING", (0, 0), (-1, -1), 2.6),
        ("LEFTPADDING", (0, 0), (-1, -1), 0), ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    el.append(tt)

    el.append(PageBreak())

    # -------------------------------------------------------- principal terms
    el.append(Paragraph("PRINCIPAL TERMS", CENTRE_B))
    el.append(Paragraph("A summary for the Parties. The clauses govern; where this page and a "
                        "clause differ, the clause prevails.", CENTRE))
    el.append(Spacer(1, 6))
    table(el, [
        ["<b>Medbury<br/>Healthcare<br/>Group</b>",
         f"Funding to an aggregate ceiling of NGN {MODEL.ngn(MODEL.MEDBURY_FUNDING_CAP)}m, all in ({{funding_cap}}).<br/>"
         "as working capital and equipment, plus NGN 97m of rental income forgone (9.3, 9.6).<br/>The Lyfe Place base and its fit-out (6.2).<br/>The clinical and "
         "aesthetic equipment (6.2).<br/>The Nigerian corporate platform and back office "
         "(6.2).<br/>Institutional access, and referral of all Group aesthetics work to the "
         "Company (13.1).",
         "<b>" + str(PCT[MODEL.MEDBURY]) + "% of the Company</b> (7.1).<br/><b>Its funding repaid in full, with a priority "
         "return, before any profit is shared with anyone</b> (9.5).<br/>Rent for the base and "
         "terms for the equipment, so the investment is recovered and not written off "
         "(9.6).<br/>Approval of every budget before a naira is drawn, and of any spend above the "
         "threshold (9.4).<br/>Two of four board seats and, because tier two needs three votes, "
         "<b>a position on which it cannot be outvoted on any operating decision</b> "
         "(11.2).<br/>A veto on the name, dilution, scope, sale and any new site (10.4)."],
        ["<b>Dr Chinwe<br/>Kpaduwa</b>",
         "The clinical standard, protocols, technique and patient selection criteria (6.3).<br/>"
         "A royalty-free Nigerian licence of her name and marks, procured from KP Plastics "
         "(5.2).<br/>Training and credentialing of every clinician the Company employs "
         "(6.3).<br/>Personal delivery of the advanced and surgical work, once registered (6.3, "
         "15.7).<br/>Her following, and the enquiry and audience data of her practice (6.3).",
         "<b>" + str(PCT[MODEL.KPADUWA]) + "% of the Company, issued for non-cash consideration, with no cash subscription "
         "asked of her</b> (7.1, 7.4).<br/>Payment by the Company for clinical work, separate from "
         "and additional to any shareholder return (9.2).<br/><b>Sole authority over the clinical "
         "standard, credentialing, patient selection, and every use of her name</b> (10.2).<br/>"
         "A seat on the Board as Clinical Director.<br/>Ownership of her marks retained throughout, with reversion if the venture ends "
         "(5.2).<br/>The casting view on the Company's name (4.4)."],
        ["<b>Consult<br/>for Africa</b>",
         "Structuring, incorporation and the agreements (6.4).<br/>Regulatory establishment, "
         "without which the Company cannot lawfully treat a patient (6.4, 15.10).<br/>"
         "Recruitment, operating systems, marketing operations, procurement and programme "
         "management (6.4, Schedule 1).",
         "<b>" + str(PCT[MODEL.CFA]) + "% of the Company</b> (7.1).<br/>A services agreement at arm's length, approved by "
         "the other two Parties with CFA not voting (9.7).<br/>One board seat, and expressly "
         "<b>no deciding vote in any disagreement between the other two</b> (11.4)."],
    ], [64, 200, 203], header=["Party", "What it commits", "What it receives, and how it is protected"], indent=0)
    el.append(Spacer(1, 4))
    el.append(Paragraph("The matters still open are listed at Schedule 3, and none of them "
                        "prevents the work at Schedule 2 from starting.", PLAIN))

    el.append(NextPageTemplate("body"))
    el.append(PageBreak())

    # --------------------------------------------------------------- recitals
    el.append(Paragraph("THIS MEMORANDUM OF UNDERSTANDING is made on "
                        "__________________ 2026", PLAIN))
    el.append(Paragraph("<b>BETWEEN:</b>", PLAIN))
    el.append(Paragraph("<b>MEDBURY HEALTHCARE GROUP</b>, of [registered address], represented by "
                        "Dr Itunu Akinware, Group Chief Executive (<b>“Medbury”</b>);",
                        REC, bulletText="(1)"))
    el.append(Paragraph("<b>DR CHINWE KPADUWA</b>, of [address], a citizen of the Federal "
                        "Republic of Nigeria (<b>“Dr Kpaduwa”</b>); and",
                        REC, bulletText="(2)"))
    el.append(Paragraph("<b>CONSULT FOR AFRICA</b>, of [registered address], represented by "
                        "Dr Adebowale Odulana, Founding Partner (<b>“CFA”</b>),",
                        REC, bulletText="(3)"))
    el.append(Spacer(1, 3))
    el.append(Paragraph("each a <b>“Party”</b> and together the <b>“Parties”</b>.", PLAIN))
    el.append(Spacer(1, 6))
    el.append(Paragraph("<b>BACKGROUND</b>", PLAIN))
    for letter, text in [
        ("A", "The Parties wish to establish a company in Nigeria to carry on a premium "
              "aesthetics and plastic surgery practice in Lagos."),
        ("B", "On 25 and 26 August 2026 the Parties agreed the structure of that venture: a "
              "single company held by all three Parties, separate from the Los Angeles practice "
              "of Dr Kpaduwa, having its own board, management, team and assets, carrying its own "
              "name, and clinically led by Dr Kpaduwa."),
        ("C", "Dr Kpaduwa holds the Marks through KP Plastics, her United States entity. KP "
              "Plastics is not a shareholder in the Company; it licenses the Marks to the Company "
              "under clause 5.2, and Dr Kpaduwa shall procure its execution of that licence."),
        ("D", "This Memorandum records the terms so agreed, sets out at Schedule 2 the work each "
              "Party is to undertake pending incorporation, and identifies at Schedule 3 the "
              "matters to be settled in the Shareholders' Agreement."),
        ("E", "Save for the provisions identified in clause 17.1, this Memorandum is not intended "
              "to be legally binding."),
    ]:
        el.append(Paragraph(text, REC, bulletText="(%s)" % letter))
    el.append(Spacer(1, 6))
    el.append(Paragraph("<b>IT IS AGREED</b> as follows:", PLAIN))

    # ======================================================== 1. DEFINITIONS
    heading(el, "Definitions and interpretation")
    c(el, "In this Memorandum, unless the context otherwise requires:")
    table(el, [
        ["<b>Board</b>", "the board of directors of the Company, constituted under clause {tiers_section}"],
        ["<b>Business</b>", "the business described in clause 3.2"],
        ["<b>Clinical Director</b>", "Dr Chinwe Kpaduwa, in her capacity as clinical director of the Company"],
        ["<b>Company</b>", "the company to be incorporated under clause {incorporation}"],
        ["<b>Group</b>", "Medbury and its subsidiaries and affiliated businesses from time to time"],
        ["<b>KP Plastic Surgery</b>", "the United States practice and entity of that name controlled by Dr Kpaduwa, the United States practice and entity controlled by Dr Kpaduwa, which owns the Marks and is the licensor under clause {marks_licence}. KP Plastics is not a shareholder in the Company"],
        ["<b>House Brand</b>", "the name, marks and identity of the Company, selected under clause {name_section}"],
        ["<b>Marks</b>", "the “KP Plastic Surgery”, “KP Plastics” and “Dr Chinwe Kpaduwa” names and the trade marks associated with them, owned by KP Plastic Surgery"],
        ["<b>Review Date</b>", "the date in November 2026 on which the Parties conduct the review under clause {review}"],
        ["<b>Shareholders' Agreement</b>", "the shareholders' agreement and the constitution of the Company to be entered into by the Parties"],
        ["<b>Stage 1</b>, <b>Stage 2</b> and <b>Stage 3</b>", "the stages described in clause {stages}"],
    ], [136, FULLW - 34 - 136])
    c(el, "Clause and Schedule headings do not affect interpretation. A reference to a clause or "
          "a Schedule is to a clause of or a Schedule to this Memorandum, and the Schedules form "
          "part of it. Words in the singular include the plural and the converse.")
    c(el, "Each matter is dealt with in one place only. Where a clause refers to another, the "
          "provision referred to governs and is not repeated.")

    # ============================================================= 2. PURPOSE
    heading(el, "Purpose")
    c(el, "The purpose of the Company is to build a premium, woman-led aesthetics and plastic "
          "surgery institution in Lagos, offering a full-body service with a developed focus on "
          "the face, delivered to the standard in clause {standard}, and to build the team, the "
          "protocols and the systems by which that standard is delivered consistently.")
    c(el, "The Company shall be developed on two principles, held together: that the product is "
          "proved before it is scaled, so that the standard is not traded for growth; and that "
          "what is built is capable of being scaled once proved, so that the investment stands on "
          "its own and the standard reaches more patients than the practice of any single "
          "clinician could.")

    # ========================================================= 3. THE COMPANY
    heading(el, "The Company")
    c(el, "The Parties shall procure the incorporation in Nigeria of a private company limited by "
          "shares under the Companies and Allied Matters Act 2020, having its registered office "
          "in Lagos.", label="incorporation")
    c(el, "The Business of the Company shall be premium aesthetics and plastic surgery, comprising "
          "injectable treatments, regenerative treatments, skin treatments, medical dermatology, "
          "aesthetic assessment and treatment planning, aftercare and the management of "
          "complications, cosmetic and plastic surgery delivered at licensed partner theatres "
          "under use-of-facility arrangements and operating privileges, and the training and "
          "credentialing of the Company's own clinicians.", label="business")
    c(el, "The Business does not extend to the Los Angeles practice, patients, entity or brand of "
          "Dr Kpaduwa; to the general wellness, occupational health, diagnostic or pharmaceutical "
          "activities of the Group; to the ownership or operation of an inpatient hospital; or to "
          "any treatment which the Company cannot deliver to the standard in clause {standard} and "
          "safely manage the complications of.")
    c(el, "The permanent base of the Company shall be at The Lyfe Place, opening in Stage 2. "
          "During Stage 1 the Company shall trade from an existing Medbury facility identified by "
          "the Board, so that trading may begin without waiting for the base, and non-surgical "
          "treatment shall be delivered there. Procedures requiring a theatre, anaesthesia or "
          "overnight recovery shall be performed at a licensed partner facility under clause "
          "15.11 throughout, both before and after the base opens. Occupancy of any Medbury "
          "premises, whether the Stage 1 facility or the base, is on the terms in clause {occupancy}.", label="base")
    c(el, "The Company shall be wholly separate from the Los Angeles practice of Dr Kpaduwa, "
          "having its own board, management, employees, assets, bank accounts, books and "
          "liabilities. Neither shall be liable for the obligations of the other, and any "
          "collaboration between them shall be by written agreement.")
    c(el, "The Company shall not be a department or division of the Group. It shall have its own "
          "board, its own executive and its own accounts, and requests from the Group shall be "
          "made through the Board.")
    c(el, "The Company shall employ its own personnel. Where Medbury seconds any person to the "
          "Company it shall do so on written terms approved by the Board.", label="own_personnel")

    # ================================================================ 4. NAME
    heading(el, "Name", label="name_section")
    c(el, "The Company shall be incorporated and shall trade under the House Brand, being a name "
          "of its own and distinct from the Marks, so that neither the Los Angeles practice nor "
          "the Company is confused with or prejudiced by the other, and so that the Company owns "
          "a name that is genuinely its own.")
    c(el, "The House Brand shall be capable of registration at the Corporate Affairs Commission "
          "and as a trade mark in Nigeria; clearly distinct from the Marks; consistent with a "
          "woman-led, natural-result and boutique clinical proposition; and capable of carrying "
          "more than one site and more than one clinician in due course.")
    c(el, "CFA shall prepare and circulate to the Parties, within ten business days of the date of "
          "this Memorandum, a shortlist of candidate names together with availability searches at "
          "the Corporate Affairs Commission and the Trade Marks Registry.")
    c(el, "The Parties shall agree the House Brand. Where the Parties do not converge it shall "
          "be determined by the Board as a tier two matter under clause {tier2}, the House Brand "
          "being an enduring asset of the Company rather than a clinical question. The Clinical "
          "Director's approval of the use of her own Marks under clause {marks_licence}(c), and of clinical "
          "claims under clause 10.2(e), is unaffected and is not a power over the House Brand.")
    c(el, "On selection the Company shall register the House Brand as a trade mark in Nigeria in "
          "the classes covering medical, surgical and beauty services, and shall register the "
          "corresponding domain names and social media handles.")

    # =========================================== 5. INTELLECTUAL PROPERTY & DATA
    heading(el, "Intellectual property and data")
    c(el, "The Company shall own absolutely and in perpetuity the House Brand and its identity; "
          "the protocols and standard operating procedures as adapted for and documented within "
          "the Company; the training curriculum and the credentialing records; the patient "
          "records and database; the booking and operating systems as configured for the Company; "
          "the marketing content and photography produced by or for the Company, subject to "
          "clause {consent}; and the Company's supplier terms.", label="company_ip")
    c(el, "The Marks, and the underlying clinical know-how, technique and standard brought by "
          "Dr Kpaduwa, shall remain the property of KP Plastic Surgery and shall be licensed to the "
          "Company under a written trade mark and know-how licence executed alongside the "
          "Shareholders' Agreement, on the following terms:", label="marks_licence")
    subs(el, [
        "the licence shall be exclusive for Nigeria, royalty free for its term and limited to the "
        "Business;",
        "the Marks shall be used in endorsement and not in substitution, the Company being held "
        "out as founded and clinically led by Dr Chinwe Kpaduwa of KP Plastic Surgery and never as the "
        "Los Angeles practice;",
        "KP Plastic Surgery shall approve each use of the Marks and may withdraw approval for any use "
        "falling below its standard;",
        "the Company shall not use the Marks outside Nigeria, and KP Plastics shall not license "
        "the Marks to any competing service in Nigeria during the term; and",
        "the licence terminates automatically on the earliest of: her ceasing to be Clinical "
        "Director; her ceasing active participation for a continuous period agreed in the "
        "Shareholders' Agreement; material breach by the Company that is not remedied; failure "
        "by the Company to maintain the clinical standard at clause {standard}; a change of "
        "control to which she has not consented; the Company's insolvency; or non-use of the "
        "Marks for an agreed period. Her vested equity survives termination of the licence; and",
        "on termination the Marks shall be withdrawn from the Company's use within an agreed "
        "wind-down period and the Company shall continue under the House Brand.",
    ])
    c(el, "The Parties acknowledge that registration of the Marks outside Nigeria confers no "
          "rights within Nigeria, and that under the Trade Marks Act Cap T13, Laws of the "
          "Federation of Nigeria 2004 no proceeding lies to restrain the infringement of an "
          "unregistered trade mark. Accordingly KP Plastics shall, as a condition of the licence "
          "having practical effect, apply to register the Marks in Nigeria in the relevant "
          "classes, and the Company shall be recorded at the Trade Marks Registry as a registered "
          "user of the Marks under sections 33 to 35 of that Act. CFA shall first conduct "
          "availability searches, and if the Marks or a confusingly similar mark are already held "
          "by a third party in Nigeria the Parties shall reconsider the form of endorsement in "
          "clause 5.2(b).", label="marks_nigeria")
    c(el, "<b>The boundary between what she brings and what the Company owns.</b> Background "
          "intellectual property, being everything Dr Kpaduwa or KP Plastic Surgery held before "
          "the venture together with any generalised improvement, technique, know-how, algorithm, "
          "protocol or training concept derived from her clinical expertise and capable of "
          "application outside the Company, remains hers and is licensed under clause "
          "{marks_licence}. Company intellectual property, being workflows, administrative "
          "procedures, local forms, patient-facing materials and operational adaptations specific "
          "to the Company, belongs to the Company. Writing a technique down while working for the "
          "Company does not transfer it, and clause {company_ip} is to be read subject to this "
          "clause.", label="background_ip")
    c(el, "CFA's platforms and systems remain the property of CFA and are licensed to the "
          "Company for the term under the services agreement. Ownership does not pass to the "
          "Company on any exit, and on termination the licence ends while the Company retains "
          "its own data, records and configuration.")
    c(el, "That licence earns CFA no equity whatever. The fee at clause {fee} buys the management "
          "and the systems together, so recognising the licence in the shareholding as well "
          "would be a double count on the same asset, and it is not recognised at Schedule 4.", label="cfa_platform_nil")
    c(el, "What CFA does take equity for, at Schedule 4, is the configuration and implementation "
          "of those systems within the Company, being the build the Company keeps: the "
          "configuration, the data migration and the training. That is delivered work and is "
          "distinct from the licence.")
    c(el, "Patient records and data shall be owned and controlled by the Company, held in the "
          "Company's systems and processed in accordance with the Nigeria Data Protection "
          "Act 2023 and the directives of the Nigeria Data Protection Commission. No Party shall take a copy for its own use, and no patient record shall be "
          "transferred out of the Company save as required by law or as directed by the patient.")

    # ======================================================== 6. CONTRIBUTIONS
    heading(el, "Contributions")
    c(el, "This clause records what each Party contributes to the Company. It is distinct from "
          "clause 12 and Schedule 1, which record the Party accountable for each function of the "
          "Company from time to time.")
    c(el, "Medbury shall contribute the establishment capital and working capital referred to in "
          "clause 9.3; the equipment on which the Business operates; the use of its own premises, "
          "being the Stage 1 facility and thereafter The Lyfe Place base, re-planned to "
          "accommodate the Business at material cost together with its fit-out; and the "
          "relationship with the partner hospital, which Medbury holds and negotiates and without "
          "which the Company has no theatre and no surgical revenue.")
    c(el, "Medbury shall in addition provide Group referral flow under clause {first_refusal}, transitional "
          "shared back office services under clause {shared_services} if the Board so requires, and "
          "institutional standing and introductions to referring hospitals and corporate "
          "accounts. Those are not valued at Schedule 4 and earn no equity, because the Company "
          "pays for them at agreed rates under the clauses named. That is the same principle "
          "applied to every Party: what is paid for in cash is compensated, and what is "
          "compensated does not also earn equity.")

    c(el, "<b>The Clinical Director shall act as the public face of the Company.</b> The Company "
          "is built on her credibility as much as on her technique, and lending the name without "
          "appearing behind it would give the Company the licence and not the benefit. She shall "
          "accordingly participate in the launch and in the public representation of the "
          "Company: named appearances at its events, participation in its social channels and "
          "press, interviews and speaking where reasonably requested, and the release of "
          "consented case material under clause {consent}. The extent is agreed in the Shareholders' "
          "Agreement, is measured with the other commitments at clause {two_parts} and vests with them. "
          "This obligation sits alongside the training and the protocols and is not subordinate "
          "to them.")
    c(el, "Dr Kpaduwa shall contribute the clinical authority on which the premium positioning "
          "of the Company rests, being the leadership of a United States trained and certified "
          "plastic surgeon, which the Company could not recruit locally; the licence of the Marks "
          "under clause 5.2; the clinical standard, protocols, technique, treatment algorithms "
          "and patient selection criteria constituting the founding standard of the Company; the "
          "training and credentialing of each clinician the Company employs, being the means by "
          "which the Company acquires its clinical capability; the personal delivery of the "
          "advanced and surgical work; introductions to her existing following on the basis in "
          "clause {no_db_transfer}; and brand and messaging direction.")
    c(el, "<b>No database passes to the Company.</b> The patient, enquiry and audience data of "
          "KP Plastic Surgery remains its own and is not transferred, disclosed or made available "
          "to the Company. KP Plastic Surgery may communicate with its own audience and invite "
          "interested individuals to opt in to communications from the Company, and only the data "
          "of those who so opt in comes to the Company, on its own lawful basis. Nothing in this "
          "Memorandum requires the disclosure of personal data in breach of any law binding on "
          "KP Plastic Surgery.", label="no_db_transfer")
    c(el, "CFA shall contribute the structuring of the venture, including this Memorandum, the "
          "Shareholders' Agreement, the licence under clause {marks_licence} and the incorporation of the "
          "Company; the regulatory establishment of the Company under clause {compliance}, without which "
          "the Company cannot lawfully treat any patient; a specialist healthcare recruitment and "
          "leadership assessment capability; the operating systems on which the Company runs; a "
          "supply chain for imported consumables together with the management of foreign exchange "
          "exposure and lead times; and the operating team by which the Company is established "
          "and run.")

    # ======================================================== 7. SHARE CAPITAL
    heading(el, "Share capital")
    c(el, "The issued share capital of the Company shall on incorporation be held as follows, "
          "derived as set out at Schedule 4.", label="share_capital")
    table(el, [
        ["Medbury Healthcare Group", f"{PCT[MODEL.MEDBURY]}%",
         "capital, the facility, equipment, the corporate platform and market access"],
        ["Dr Chinwe Kpaduwa", f"{PCT[MODEL.KPADUWA]}%",
         "the licence of the Marks, clinical leadership, the founding standard and the training"],
        ["Consult for Africa", f"{PCT[MODEL.CFA]}%",
         "structuring and establishment of the Company and the continuing operator role"],
        ["<b>Total</b>", "<b>100%</b>", ""],
    ], [132, 54, FULLW - 34 - 186],
        header=["Shareholder", "Holding", "Issued in consideration of"], align_c=(1,))
    c(el, "The percentages at clause {share_capital} are the output of the contribution framework agreed "
          "between the Parties, under which each contribution is valued at market over three "
          "years, reduced by whatever cash the contributing Party is paid for it, and equity "
          "follows the residual.", label="framework_output")
    c(el, f"They are computed on two settings, each of which is a choice belonging to the Party "
          f"affected. The Clinical Director draws "
          f"{MODEL.KP_FEE_SHARE*100:.0f} per cent of a market surgeon's fee in cash under clause "
          f"9.2, the balance being a contribution to the Company. CFA charges the full market "
          f"operating fee of {MODEL.OPERATOR_MARKET*100:.0f} per cent of revenue under clause 9.7 "
          f"and therefore takes no equity at all for operating the Company. If either election "
          f"changes, the percentages change with it: a Party that takes more cash contributes "
          f"less and holds less, and the converse. The Parties shall settle both elections before "
          f"the Shareholders' Agreement is executed and the percentages shall be recomputed on "
          f"the elections actually made.")
    c(el, f"Medbury's holding is carried by two things and not one. Its cash is capped at NGN "
          f"{MODEL.ngn(MODEL.MEDBURY_FUNDING_CAP)}m under clause 9.3, and cash at that level "
          f"alone would support about 56 per cent. The balance is bought with rental income "
          f"forgone: Medbury waives {MODEL.RENT_WAIVED*100:.0f} per cent of the market rent on "
          f"the premises the Company occupies, being NGN "
          f"{MODEL.ngn(MODEL.RENT_TOTAL*MODEL.RENT_WAIVED)}m across the window rather than the "
          f"NGN {MODEL.ngn(MODEL.RENT_TOTAL*0.20)}m a lighter waiver would give. That is the "
          f"hybrid of paying something and forgoing the rest, and it relieves the Company's "
          f"profit and loss in the years it can least afford rent.")
    c(el, "No Party is asked to accept the percentages on trust. Schedule 4 shows every line, the "
          "basis on which it is valued, the cash netted against it and the arithmetic that "
          "produces the result.")
    c(el, f"Contributions of income forgone accrue over a defined window. The window opens on "
          f"{MODEL.SWEAT_OPENS}, because income cannot be forgone before there is income, and "
          f"closes {MODEL.SWEAT_TRIGGER}. Value delivered before trading begins is not forgone "
          f"income but an asset brought to the Company, and is dealt with as such.", label="window")
    c(el, "The longstop matters. The percentages are a function of how long the "
          "window runs, and without an outside date they could not be fixed at all. The Parties "
          "record that EBITDA turning positive does not close the window. It arrives well before "
          "any capital is repaid, and closing on it would end the accrual early and understate "
          "the contribution of the Parties forgoing income. What EBITDA turning positive does, "
          "once it has been sustained for four consecutive quarters, is trigger a step-up of cash "
          "compensation toward market rates, the Company being able by then to afford it. Cash "
          "changes when the business can pay; equity stops accruing when the risk is retired.")
    c(el, "Because the window may close before the longstop, the percentages at clause {share_capital} are "
          "the position expected on the current forecast and are not a fixed cap table. Equity "
          "referable to income forgone shall be issued in tranches against the amounts actually "
          "forgone, computed at each anniversary on actual revenue rather than forecast revenue, "
          "and shall cease to accrue when the window closes. Equity referable to assets brought "
          "and to capital invested is not affected and is fixed at incorporation.", label="not_fixed")
    c(el, "Dr Kpaduwa is a citizen of the Federal Republic of Nigeria. Her shares are "
          "accordingly held by a Nigerian shareholder, and the Company is not a company with "
          "foreign participation. The Parties record that this is deliberate and material: had "
          "the holding been taken by KP Plastics as a United States entity, the Company would "
          "have required issued share capital of not less than NGN 100,000,000 under the Revised "
          "Handbook on Expatriate Quota Administration 2022 as applied by the Corporate Affairs "
          "Commission, fully paid up before any Business Permit or expatriate quota, together "
          "with registration at the Nigerian Investment Promotion Commission, a Business Permit "
          "and a Certificate of Capital Importation. None of those requirements arises on the "
          "structure in clause 7.1.", label="citizenship")
    c(el, "No share in the Company shall be issued or transferred to a non-Nigerian person or "
          "entity, and KP Plastics shall not take shares in the Company, without the prior "
          "unanimous agreement of the shareholders under clause {tier3}(b), the Parties having regard "
          "to the consequences in clause {citizenship}. If Dr Kpaduwa prefers to hold through a company, it "
          "shall be a Nigerian company owned by her, which preserves the position in this clause.", label="no_foreign")
    c(el, "Shares may be paid up in cash or by a valuable consideration other than cash under "
          "section 160 of the Companies and Allied Matters Act 2020. The shares issued in respect "
          "of the matters recorded against KP Plastics at clause {share_capital} shall be issued for non-cash "
          "consideration, and no cash subscription is required of KP Plastics. The requirement in "
          "section 162 of that Act for an independent valuer to determine the value of "
          "consideration other than cash applies to public companies only and does not apply to "
          "the Company.", label="non_cash")
    c(el, "If any Party subscribes cash in excess of the contribution recorded against it in "
          "clause 6, the percentages shall be adjusted by agreement to reflect it.")
    c(el, "<b>Not all of the Clinical Director's holding is contingent.</b> Equity referable to "
          "value delivered at or before launch, being the licence of the Marks, the clinical "
          "standard, the protocols and the founding clinical architecture, vests in full on "
          "incorporation and is not subject to any milestone. Only equity referable to services "
          "yet to be performed vests over time, and the measures against which it vests shall be "
          "objective and written, and they are at Schedule 4A. No "
          "milestone may be introduced afterwards without her consent.", label="kp_vested_at_once")
    c(el, "A holding at clause {share_capital} is the figure reached on full service across the window. It "
          "is a ceiling rather than a guarantee. Each Party vests against what it has actually "
          "contributed in each year, and a Party that ceases to contribute keeps what it has "
          "vested and no more, the other holdings adjusting to match.")
    c(el, "<b>Each holding comprises two parts.</b> The first is issued at incorporation, in "
          "consideration of capital already advanced and of assets already delivered to the "
          "Company. The second vests as the contribution it represents is actually made, and does "
          "not vest before. No Party receives equity in advance for a thing it has not yet done. "
          "The proportions follow from Schedule 4 and are:", label="two_parts")
    FE = MODEL.founding_earned()
    table(el, [
        [p, f"{PCT[p]}%", f"NGN {MODEL.ngn(FE[p][0])}m", f"NGN {MODEL.ngn(FE[p][1])}m",
         f"{100*FE[p][1]/FE[p][2]:.0f}%"] for p in MODEL.PARTIES
    ], [FULLW - 34 - 240, 46, 74, 58, 62],
        header=["Shareholder", "Holding", "Issued at once", "Vesting", "Of which vests"],
        align_c=(0, 1, 2, 3))
    c(el, "Equity vests as follows, and the Board shall record each vesting in the register:", label="vesting")
    subs(el, [
        "<b>Medbury.</b> Equity referable to capital vests as that capital is actually drawn "
        "against the approved budget, and equity referable to rent forgone vests as the rent is "
        "actually forgone. Medbury is not credited on day one for money it has not yet advanced.",
        "<b>Dr Kpaduwa.</b> Equity referable to the clinical standard and protocols is issued at "
        "incorporation upon their delivery to and documentation within the Company. Equity "
        "referable to the licence of the Marks, to training and credentialing, and to clinical "
        "fees forgone vests annually against, respectively, the licence remaining in force and "
        "registered under clause {marks_nigeria}, the training and credentialing milestones being met, and "
        "the fees actually forgone in that year.",
        "<b>CFA.</b> Equity vests on the Board's written acceptance of each founding deliverable, "
        "being incorporation and the statutory registrations; the regulatory establishment under "
        "clause 15.10; the founding team recruited and in post, including the resident surgeon "
        "before any surgical procedure is offered; and the operating systems live and configured. "
        "Nothing vests on incorporation alone.",
    ])
    c(el, "The milestones against which Dr Kpaduwa's vesting is measured shall be settled in the "
          "Shareholders' Agreement and shall include her registration with the Medical and Dental "
          "Council of Nigeria on whichever route clause {registration} establishes; the delivery of the "
          "training and credentialing programme to each clinician against the documented "
          "standard; the minimum clinical presence agreed under that Agreement; and the transfer "
          "and documentation of the protocols within the Company.")
    c(el, "<b>Each Party has one core obligation, and the consequences of not meeting it are the "
          "same for all three.</b> Medbury's is to fund to the ceiling in clause {funding_cap} against the "
          "approved budget. The Clinical Director's is to provide the clinical leadership, "
          "training and presence agreed in the Shareholders' Agreement. CFA's is to establish and "
          "operate the Company to the milestones and service levels in its services agreement. A "
          "Party that does not meet its core obligation stops accruing the equity referable to "
          "it, and the Board shall record that at the next true-up under clause {trueup}.")
    c(el, "<b>Amicable exit.</b> Any Party may give six months' written notice that it wishes to "
          "withdraw, without fault and without needing a reason. On expiry it ceases to accrue "
          "equity, keeps what it has vested, and its vested shares are offered first to the "
          "remaining Parties in proportion to their holdings at a valuation agreed between them "
          "or determined by an independent valuer, failing which they may be retained as a "
          "passive holding carrying no board seat and no tier three vote. A Party leaving this "
          "way is not a bad leaver and forfeits nothing it has earned.")
    c(el, "A withdrawal notice given before the review under clause {review} does not oblige the "
          "remaining Parties to continue, and they may instead discontinue under clause {review_outcomes}, in "
          "which case clause 9.4 governs what happens to the money.")
    c(el, "<b>If a Party ceases to participate.</b> Equity that has vested is retained. Equity "
          "that has not vested lapses and does not vest afterwards, and the holdings of the "
          "remaining Parties adjust accordingly. Where a Party is in serious and defined breach, "
          "its vested equity may in addition be acquired at the lower of cost and value. The "
          "definition of serious breach shall be narrow and is settled in the Shareholders' "
          "Agreement, together with the treatment of a departure that is agreed rather than "
          "in breach.")
    c(el, "For the avoidance of doubt, vesting applies to every Party on the same principle. It "
          "is not a condition imposed on one of them.")

    # ============================================================ 8. BALANCE
    heading(el, "Balance of the framework")
    c(el, "The percentages at clause {share_capital} are produced by a small number of inputs, and each of "
          "those inputs moves the answer. The inputs do not move it evenly, and most of them lie "
          "within the practical control of one Party. "
          "Medbury sets the budget and so influences when EBITDA turns; it owns the premises and "
          "so states the rent; it funds and so paces the drawdown. This clause exists so that no "
          "Party can move a lever that changes another Party's holding.")
    c(el, "<b>The rental figure is evidenced before signature, not after.</b> Medbury's holding "
          "turns more on the rent it forgoes than on any other single input. Before this "
          "Memorandum is signed Medbury shall produce the measured area of the premises the "
          "Company will occupy and evidence of the market rate for comparable space, and the "
          "figure at Schedule 4 shall be restated to match. If the evidenced figure differs "
          "materially from the figure modelled, the percentages are recomputed on it before "
          "signature rather than trued up afterwards.", label="rent_evidenced")
    c(el, "<b>The inputs are agreed between the Parties.</b> The figures at Schedule 4, being the rental "
          "value and area of the clinic, the revenue attributable to the name, the market surgeon "
          "rate, the management fee benchmark and the forecast revenue, are agreed between the "
          "Parties at signature and recorded there. No Party may substitute its own figure "
          "afterwards. Any change to them requires the unanimous agreement of the shareholders "
          "under clause 10.4.")
    c(el, "<b>The step-up affects cash only.</b> The contribution referable to income forgone is "
          "fixed at the outset for the window and is earned by serving that window. It is not "
          "recomputed against the cash actually drawn after the step-up under clause {window}. Were it "
          "otherwise, a Party able to influence the timing of the step-up could reduce another "
          "Party's holding by exercising a judgement about spending, which is not a basis on "
          "which anyone should hold equity.")
    c(el, "<b>EBITDA is defined and certified.</b> It shall be computed on a basis "
          "agreed in the Shareholders' Agreement, excluding the effect of discretionary variations "
          "in expenditure, and certified by the Board before any step-up takes effect.")
    c(el, f"<b>Each holding is collared.</b> Because the percentages float on actual outcomes "
          f"rather than forecast ones, each Party's holding is bounded at plus or minus "
          f"{MODEL.COLLAR_BAND} percentage points of its opening position at clause {{share_capital}}, save "
          f"that CFA's holding shall not in any event exceed {MODEL.pct_rounded()[MODEL.CFA]} "
          f"per cent, CFA having accepted that ceiling. Without a collar the inputs could carry "
          f"a holding a long way from where it starts, and no Party could reasonably sign. "
          f"Within the collar the arithmetic governs; at its edge the collar does.")
    table(el, [
        [p, f"{MODEL.pct_rounded()[p]}%",
         f"{MODEL.pct_rounded()[p] - MODEL.COLLAR_BAND}%",
         (f"{MODEL.pct_rounded()[p]}%" if p == MODEL.CFA
          else f"{MODEL.pct_rounded()[p] + MODEL.COLLAR_BAND}%")]
        for p in MODEL.PARTIES
    ], [FULLW - 34 - 180, 60, 60, 60],
        header=["Shareholder", "Opening", "Floor", "Ceiling"], align_c=(0, 1, 2))
    c(el, "<b>The true-up is visible to everyone.</b> At each anniversary the Company shall "
          "recompute the schedule on actual figures, circulate it to all Parties in the same form "
          "at the same time, and allow twenty-one days for any Party to challenge it before it is "
          "acted on.", label="trueup")

    # =============================================== 9. FUNDING AND FINANCIALS
    heading(el, "Funding and financial arrangements")
    c(el, "All income from patients of the Company belongs to the Company and shall be banked to "
          "the Company's accounts. No Party shall invoice a patient of the Company directly.", label="revenue")
    c(el, "Clinicians, including the Clinical Director, shall be remunerated by the Company for "
          "clinical work on terms agreed in writing before Stage 1 delivery begins. Such "
          "remuneration is separate from and additional to any return as a shareholder, and "
          "equity is not in substitution for payment for clinical work.", label="clinical_pay")
    c(el, f"<b>Medbury's aggregate funding obligation, including cash, equipment and any other "
          f"capital expenditure funded by Medbury, shall not exceed NGN "
          f"{MODEL.ngn(MODEL.MEDBURY_FUNDING_CAP)},000,000.</b> The ceiling is all in and is not a "
          f"cash-only figure, so that no separate equipment or facility obligation can be argued "
          f"to sit above it. Schedule 4 models the whole of it, being NGN "
          f"{MODEL.ngn(MODEL.MEDBURY_OPEX)}m of working capital and NGN "
          f"{MODEL.ngn(MODEL.MEDBURY_EQUIPMENT)}m of equipment. That is the whole of Medbury's "
          f"funding obligation and it is not open-ended. Drawdown is against the "
          f"approved budget under clause {{stage1_cap}}, and the ceiling is a limit rather than "
          f"an entitlement: the difference between it and the requirement at Schedule 6 is "
          f"contingency and may not be drawn without a further Board approval identifying "
          f"what it is for.", label="funding_cap")
    c(el, f"<b>Stage 1 is separately capped and separately protected.</b> Expenditure before the "
          f"review under clause 14.2 shall not exceed NGN {MODEL.ngn(MODEL.STAGE1_CAP)},000,000 "
          f"without the unanimous agreement of the shareholders. Stage 1 is the exposed phase: "
          f"Medbury advances cash while the other Parties are contributing in kind and the "
          f"Clinical Director cannot yet lawfully treat, so the money at risk is Medbury's alone "
          f"and the ceiling should reflect what proof actually costs rather than what the full "
          f"build will.", label="stage1_cap")
    c(el, "Cash advanced by Medbury before the review ranks as a first-priority shareholder loan. "
          "If the Parties discontinue at the review, the Company's assets shall be realised or "
          "distributed and the proceeds applied first in repaying that loan with the return under "
          "clause {waterfall}, before anything is applied to any other Party. Equipment and fit-out "
          "acquired in Stage 1 revert to Medbury at written-down value at its election. Unvested "
          "equity lapses under clause 7.15, so no Party carries away equity for a venture that "
          "did not proceed.", label="stage1_loan")
    c(el, "The Parties have considered whether Stage 1 should instead be funded by all three in "
          "proportion to their holdings. That remains open and is listed at Schedule 3. It would "
          "materially change the position recorded at clause {non_cash}, under which no cash "
          "subscription is asked of the Clinical Director, and it should not be decided without "
          "her.")
    c(el, "Costs incurred by a Party's own advisers, agencies or contractors are that Party's "
          "own unless the Board has approved them in advance as a Company cost within an approved "
          "budget.")
    c(el, "Funding required beyond that ceiling is not an obligation of any Party. It shall first "
          "be offered to all shareholders in proportion to their holdings, on the same terms and "
          "at the same time.", label="further_funding")
    c(el, "A Party funding beyond its proportionate share may elect that the excess be treated "
          "either as shareholder debt, repayable ahead of distributions on the terms in clause "
          "{waterfall}, or as a subscription for new shares at a valuation agreed between the Parties or "
          "determined independently. A Party that does not take up its proportion is diluted "
          "accordingly, and no Party is obliged to follow its money.")
    c(el, "<b>Fresh capital may not be used to dilute a Party rather than to fund the Company.</b> "
          "Any issue under the preceding clause requires a bona fide funding need identified in a "
          "Board-approved business case; a subscription price set by an independent valuation "
          "where the Parties do not agree it; identical terms offered to every shareholder; and "
          "not less than thirty days' notice. <b>The Clinical Director's holding shall not be "
          "reduced below twenty per cent by any issue in which she was not offered a genuine "
          "opportunity to participate on those terms</b>, and Medbury and CFA shall not together "
          "exceed seventy-four per cent by such an issue, so that the threshold at clause "
          "{tier3a} cannot be reached without her.", label="antidilution")
    c(el, "Shares issued for fresh capital under the preceding clause fall outside the collar at "
          "clause 8.5. The collar bounds movement in the true-up of the original contribution "
          "assumptions; it is not intended to cap a Party that puts materially more cash at risk "
          "than was forecast, and a Party doing so is entitled to have that reflected.", label="fresh_capital_collar")
    c(el, "No drawdown shall be made otherwise than against an establishment budget and a twelve "
          "month operating budget approved by the Board, and no expenditure outside an approved "
          f"budget above NGN {MODEL.ngn(MODEL.BOARD_APPROVAL_THRESHOLD)},000,000 shall be "
          f"incurred without Board approval.")
    c(el, "Distributable cash shall be applied in the following order: operating costs; repayment "
          f"of Medbury's funding together with a priority return of "
          f"{MODEL.PRIORITY_RETURN*100:.0f} per cent per annum, simple and not compounded, "
          f"accruing on each drawdown from the date it is made and ceasing on repayment; "
          f"reserves and "
          "reinvestment approved by the Board; and thereafter distributions to shareholders in "
          "proportion to their holdings.", label="waterfall")
    c(el, "Medbury's investment in the base and the equipment is capital at risk and is recognised "
          "in the shareholding under clause {share_capital}. So that it is recovered rather than written off "
          "and the Company's accounts remain true, the Company shall occupy the base under a "
          "written lease or occupancy licence at an agreed rate and shall hold equipment provided "
          "by Medbury on agreed terms. Medbury shall carry out the fit-out works to the base as "
          "owner of the premises, to a specification agreed with the Board.", label="occupancy")
    c(el, "CFA shall be engaged by the Company under a separate written services agreement, "
          "approved by Medbury and Dr Kpaduwa as a related-party matter with CFA not voting.", label="services_agreement")
    c(el, f"The fee shall be {MODEL.OPERATOR_MARKET*100:.0f} per cent of revenue. Bundled fees "
          f"for a full operating mandate of this kind run at about 8 to 20 per cent of "
          f"collections, so the rate is at the lower-middle of the market. It shall be evidenced "
          f"by comparables before the Shareholders' Agreement is executed.", label="fee")
    c(el, f"<b>That fee is split by timing rather than reduced.</b> A base of "
          f"{MODEL.CFA_FEE_BASE*100:.0f} per cent of revenue is payable monthly in cash from the "
          f"first month. The balance of {MODEL.CFA_FEE_DEFERRED*100:.0f} per cent accrues as a "
          f"subordinated payable and is not paid until Medbury's funding and priority return have "
          f"been repaid in full under clause 9.5. The Company therefore pays "
          f"{MODEL.CFA_FEE_BASE*100:.0f} per cent, not {MODEL.OPERATOR_MARKET*100:.0f}, in the "
          f"years before it is profitable, which is when the charge is hardest to carry.")
    c(el, "The deferred balance is deferred and not waived, and the distinction is deliberate. "
          "Income forgone is a contribution under clause {framework_output} and would increase CFA's holding. "
          "Income deferred is not, so CFA's holding is unaffected and the Company keeps the cash. "
          "If CFA is removed for defined breach the deferred balance is extinguished.")
    c(el, "The base steps down as the Company's own staff assume the functions in Part C of "
          "Schedule 1, on a schedule set out in the services agreement. That agreement shall have "
          "a defined initial term, service levels and key performance indicators reviewed "
          "annually by the Board, rights of termination for failure against them, a cap on "
          "reimbursable costs, and an express list of what the fee covers.")
    c(el, f"CFA charges the base in cash and defers the balance. The deferred "
          f"{MODEL.CFA_FEE_DEFERRED*100:.0f} per cent, being NGN "
          f"{MODEL.ngn(MODEL.CFA_DEFERRED_FACE)}m across the window, ranks behind Medbury's "
          f"capital and priority return and is paid only if the venture succeeds. It is "
          f"therefore not merely deferred income but subordinated risk capital, and CFA carries "
          f"the same risk of never being paid that a funder carries. That risk is recognised at "
          f"Schedule 4 and nowhere else: CFA takes no equity for the management itself.")
    c(el, "Each Party shall submit, within fourteen days of the date of this Memorandum, a "
          "schedule of the costs incurred by it from 1 July 2026 in reliance on the venture. On "
          "incorporation the Board shall review each schedule and shall either reimburse the cost "
          "from the Company or credit it to that Party's contribution, save that expenditure "
          "constituting investment in a Party's own asset shall be dealt with under clause {occupancy}. "
          "Undisputed items shall be settled within thirty days of incorporation, and no Party "
          "shall vote on its own claim.", label="preformation_costs")
    c(el, "No Party shall charge the Company for anything not provided for in an approved budget "
          "and a written agreement.")

    # ====================================================== 9. DECISION MAKING
    heading(el, "Decision making", label="tiers_section")
    c(el, "Decisions of the Company fall into four tiers which do not overlap, the fourth being "
          "residual so that every decision has an owner. Every voting threshold in this "
          "Memorandum is fixed by this clause.", label="tiers")
    c(el, "<b>Tier one.</b> The following are reserved to the Clinical Director alone and shall "
          "not be put to a vote:", label="tier1")
    subs(el, [
        "the clinical standard and each treatment protocol;",
        "which treatments within the Business the Company offers and which it does not;",
        "the credentialing of each clinician, and the sign-off of each clinician before "
        "independent practice;",
        "patient selection, and the refusal of any patient or procedure on clinical grounds;",
        "each clinical claim made in the Company's marketing, and each use of the Marks; and",
        "the immediate suspension of any service on safety grounds, effective on notice and "
        "without prior Board approval.",
    ])
    c(el, "The tier one matters are clinical. They do not extend to the commercial conduct of "
          "the business, and the following are tier two whatever their marketing consequence: "
          "the price list and pricing architecture; the marketing budget and the choice of "
          "channels; commercial positioning and the naming and packaging of services; opening "
          "hours; staffing numbers; and expansion. Approval of a clinical claim is not approval "
          "of a campaign, and the Clinical Director's authority over her own Marks under clause "
          "5.2(c) is a right over the use of her name and not a veto on marketing.", label="tier1_boundary")
    c(el, "Where the Clinical Director declines on clinical or ethical grounds to offer a "
          "treatment the Board wishes to offer, her decision stands under clause {tier1}(b) and "
          "clause {standard_prevails}, and the Company's plan and forecast are adjusted to the "
          "menu actually offered.")
    c(el, "<b>No exercise by the Clinical Director, in good faith, of her clinical, patient "
          "safety, credentialing, ethical or professional judgment shall constitute a failure of "
          "contribution, reduce her vested or unvested equity, alter the valuation of her "
          "contribution at Schedule 4, or constitute a breach of any obligation under this "
          "Memorandum.</b> The Parties record that an earlier draft provided otherwise and that "
          "it was wrong to do so: a Clinical Director who is financially penalised for declining "
          "a procedure is not a safeguard but a hazard, and the premium the Company charges "
          "rests on her being free to say no.", label="judgment_protected")
    c(el, "<b>Tier two.</b> The following are reserved to the Board and carry on the affirmative "
          "votes of three of the four directors:", label="tier2")
    subs(el, [
        "the annual budget, the business plan and the price list;",
        "capital expenditure, and expenditure above the threshold set under clause {{stage1_cap}};",
        "the appointment and removal of the executive;",
        "host institution agreements, any lease or occupancy of premises, and any other material "
        "contract;",
        "marketing strategy and marketing expenditure, subject always to clause {tier1}(e); and",
        "any related-party contract, on which the interested Party shall not vote.",
    ])
    c(el, "<b>Tier three.</b> The following require the unanimous agreement of all shareholders, "
          "being matters that change what the Company fundamentally is:", label="tier3")
    subs(el, [
        "any change to the House Brand or to the name of the Company;",
        "the admission of a new shareholder, and any issue of shares other than an issue for "
        "fresh capital under clause 9.5, which requires no unanimity so that funding cannot be "
        "blocked by a Party declining to provide it;",
        "any change to the Business as described in clause {business};",
        "any amendment to the constitution or to the Shareholders' Agreement; and",
        "the termination or material amendment of the licence granted under clause {marks_licence}.",
    ])
    c(el, "<b>Tier three A.</b> The following require the agreement of shareholders holding "
          "seventy-five per cent or more of the shares, and not unanimity:", label="tier3a")
    subs(el, [
        "the sale of the Company or of its business, or its winding up. Shareholders holding "
        "seventy-five per cent or more may require the remaining shareholders to participate in "
        "a bona fide arm's length sale on the same terms, and no shareholder may block such a "
        "sale. CFA gives up its own veto here, an operator holding a minority stake being the "
        "wrong party to prevent an exit the owners of the capital and the clinical practice both "
        "support;",
        "a sale to which the Clinical Director has not consented shall, on completion, "
        "terminate the licence of the Marks under clause {marks_licence} and every right of the "
        "Company to use her name, the Company continuing under the House Brand;",
        "the opening of any additional site, subject always to the clinical standard and to the "
        "Clinical Director's rights under clause {tier1}, which are unaffected; and",
        "borrowing above a threshold agreed by the Parties, or the granting of security over the "
        "Company's assets.",
    ])
    c(el, "<b>Deadlock.</b> Where a tier three or tier three A matter is not resolved within "
          "thirty days, it shall be referred to the principals, then to a jointly appointed "
          "mediator within a further thirty days. If it remains unresolved and the matter is "
          "fundamental to the Company continuing, any shareholder may serve a notice offering to "
          "buy the others' shares at a stated price per share, and each recipient may either "
          "accept or itself buy at that price.", label="deadlock")
    c(el, "The Parties record that a mechanism of that kind favours the Party with the deepest "
          "pocket, and that they are not equally capitalised. It is accordingly available only "
          "after the escalation and mediation above have been exhausted; only for a matter that "
          "genuinely prevents the Company continuing; not at all during the first two years; and "
          "subject to a minimum price supported by an independent valuation, a right for a "
          "recipient to require third-party financing time of not less than ninety days, and the "
          "termination of the licence of the Marks under clause {marks_licence} if the Clinical "
          "Director is bought out under it. The full mechanics are settled in the Shareholders' "
          "Agreement.", label="shootout_safeguards")
    c(el, "<b>Protective consents.</b> The Parties record that Medbury appointing two directors "
          "and CFA one means the two of them together carry a tier two decision. So that the "
          "Clinical Director is not exposed on matters that bear directly on her, the following "
          "additionally require her written consent, not to be unreasonably withheld or delayed:",
          label="protective_consents")
    subs(el, [
        "any change to her remuneration, or to the basis on which she is remunerated;",
        "any change to the clinical presence or time commitment expected of her;",
        "any change to her vesting, its measures, or the dates against which it is measured;",
        "any use of her name or the Marks beyond the endorsement form at clause {marks_licence}(b);",
        "any material change to the clinical scope of the Business, or the withdrawal of a "
        "treatment she has approved;",
        "any reduction in clinical staffing or clinical resources below the level her protocols "
        "require for safe practice; and",
        "any change that materially increases her personal professional exposure.",
    ])
    c(el, "Where she withholds consent she shall give her reason in writing, and the matter is "
          "referred to the principals under clause {deadlock}. A refusal on grounds of patient "
          "safety or professional obligation is conclusive and is protected by clause "
          "{judgment_protected}.")
    c(el, "<b>Tier four.</b> Every decision not falling within clauses 10.2 to 10.6 is a management "
          "decision, to be taken by the executive within the approved budget and business plan "
          "and reported to the Board.")

    # ============================================================ 10. THE BOARD
    heading(el, "The Board")
    c(el, "The Board shall comprise four directors. Medbury shall appoint two, Dr Kpaduwa one "
          "and CFA one. Dr Kpaduwa shall take her seat as Clinical Director.", label="board")
    c(el, "The chair shall be appointed by Medbury and shall not have a casting vote. The rule "
          "operates in both directions, and the Parties record its effect so that it is not "
          "mistaken. No Party may carry a tier two decision alone. Equally, because a tier two "
          "decision requires three of four votes and Medbury appoints two directors, no tier two "
          "decision can be taken against Medbury's wishes. Medbury therefore holds, on every "
          "operating decision of the Company, a position from which it cannot be outvoted. A "
          "casting vote would allow a Party to win alone; this arrangement ensures the Party "
          "funding the Company cannot lose.", label="no_casting")
    c(el, "A quorum shall be three directors, including at least one director appointed by each "
          "of two different Parties.")
    c(el, "Where Medbury and Dr Kpaduwa take different positions on a tier two matter, the matter "
          "shall be referred to them to resolve before any vote is taken, and CFA shall "
          "facilitate that discussion rather than cast a deciding vote. A vote shall be taken "
          "only once they have had the opportunity to resolve it, or after fourteen days.")
    c(el, "The Board shall meet quarterly, and a monthly operating review shall be held with the "
          "executive and minuted. Monthly management accounts, a clinical quality and "
          "complications report and progress against the current Stage shall be circulated to all "
          "Parties five business days before each review, in the same form and at the same time.")
    c(el, "A fifth, independent director may be appointed by unanimous agreement of the "
          "shareholders.")

    # =========================================== 11. ROLES AND RESPONSIBILITIES
    heading(el, "Roles and responsibilities")
    c(el, "The Company performs its own functions through its own officers and employees. A "
          "function is performed for the Company by a Party only where this Memorandum or a "
          "written agreement approved by the Board so provides.")
    c(el, "Schedule 1 records, for each function, whether it is performed by the Company itself "
          "or by a Party for the Company, and identifies the person accountable to the Board. "
          "Accountability for a function shall not be shared.")
    c(el, f"CFA's holding is not granted for having been appointed operator. It divides in two. "
          f"{MODEL.CFA_FOUNDING_SHARE*100:.0f} per cent of it is founding equity, vesting on the "
          f"Board's acceptance of each founding deliverable at Schedule 5, each of which has a "
          f"date. The remaining {MODEL.CFA_OPERATING_SHARE*100:.0f} per cent is operating "
          f"equity, and vests only as CFA actually runs the Company, in equal instalments against "
          f"the measures at Schedule 4A, measured annually by the Board. Those measures are "
          f"written now and not deferred, for the same reason the Clinical Director's are: no "
          f"party should be asked to accept conditions that have yet to be drafted.")
    c(el, "If CFA ceases to operate the Company, or fails against those measures, the unvested "
          "operating equity does not vest and is not paid for. CFA does not hold equity for a "
          "job it is no longer doing, and the Parties record that this is CFA's own proposal.")
    c(el, "The Company shall appoint its own day-to-day lead, recruited by CFA and appointed by "
          "the Board under clause 10.3(c). The arrangements that apply until the Company is fully "
          "staffed are set out in Part C of Schedule 1.", label="lead")

    # =============================================== 12. RELATIONSHIP WITH GROUP
    heading(el, "Relationship with the Medbury group")
    c(el, "<b>Exclusivity is confined to surgery.</b> The Company shall be the exclusive provider "
          "of cosmetic and plastic surgery to the Group in Nigeria, and the Group shall not "
          "establish, acquire or partner into a competing cosmetic or plastic surgery service "
          "while this clause subsists. Aesthetics is deliberately excluded from that exclusivity, "
          "the field being too broad to close off to a diversified healthcare group and already "
          "practised across a number of the Group's settings.")
    c(el, "For non-surgical aesthetics the Group instead gives the Company a right of first "
          "refusal. Where a Group business wishes to add or expand a non-surgical aesthetics "
          "service it shall first offer the Company the opportunity to provide it on terms no "
          "less favourable, and may proceed independently only if the Company declines or cannot "
          "meet the requirement within an agreed period.", label="first_refusal")
    c(el, "<b>The restriction is reciprocal.</b> For so long as it remains a shareholder each "
          "Party is bound in the same way: it shall not establish, acquire, clinically lead or "
          "partner into a competing cosmetic or plastic surgery service in Nigeria, and shall "
          "channel such activity through the Company. Nothing in this clause touches the Los "
          "Angeles practice of Dr Kpaduwa or anything she does outside Nigeria, the Group's "
          "existing wellness, occupational health, diagnostic and pharmaceutical lines, or CFA's "
          "advisory work for third parties save that CFA shall not structure or operate a "
          "competing cosmetic or plastic surgery clinic in Lagos.")
    c(el, "That exclusivity is conditional on performance and is not given indefinitely. It shall "
          "fall away, at Medbury's election and on notice, if the Company fails to commence "
          "trading by a longstop date agreed in the Shareholders' Agreement; ceases to hold any "
          "registration or licence required under clause {compliance}; is unable to accept referrals "
          "from the Group within a service level agreed in the referral protocol, on more than an "
          "agreed number of occasions; falls below the clinical or service standards agreed at "
          "the review under clause {review}; or is in material breach of this clause. A diversified "
          "healthcare group should not be shut out of a field of practice across a whole country "
          "by a venture that is not serving it.")
    c(el, "Where exclusivity falls away, the Company continues and the other provisions of this "
          "Memorandum are unaffected. Medbury regains the freedom to meet demand the Company "
          "cannot meet, and shall not use that freedom to compete for the Company's existing "
          "patients.")
    c(el, "Referrals shall be on arm's length terms recorded in a written referral protocol at "
          "agreed rates, so that the accounts of each are true and no clinical decision is "
          "influenced by an internal transfer price.")
    c(el, "Any other service provided by the Group to the Company, including any transitional "
          "shared back office service, shall be provided under a written agreement at agreed "
          "rates, shall be approved as a related-party contract under clause {tier2}(f) with Medbury "
          "not voting, and shall be terminable by the Company on reasonable notice. No such "
          "service shall be assumed, and none shall continue after the Company has appointed its "
          "own staff to the function unless the Board resolves otherwise.", label="shared_services")
    c(el, "The independence of the Company from the Group is dealt with in clauses 3.6 and 3.7, "
          "and what the Company pays for premises and equipment in clause {occupancy}.")

    # ====================================================== 13. STAGES & REVIEW
    heading(el, "Stages and review")
    c(el, "The Company shall be developed in stages:", label="stages")
    table(el, [
        ["Stage 1", "From the date of this Memorandum to the Review Date",
         "Proof of the product, traded from the Stage 1 facility under clause {base}. "
         "Incorporation; the hiring and training of the core team; the "
         "conclusion of the partner theatre arrangement; the definition of the Stage 1 treatment "
         "menu and its delivery by clinicians registered in Nigeria; the completion of the first "
         "documented cases; and the establishment of the "
         "enquiry pipeline. The tasks are at Schedule 2"],
        ["Stage 2", "2027",
         "The opening of the base at The Lyfe Place; the widening of the clinical team; the growth "
         "of the proportion of the menu delivered to standard by the team; and the attainment of "
         "sustainable trading"],
        ["Stage 3", "Thereafter",
         "Growth, including additional capacity, a further site or a further city, proposed by the "
         "Clinical Director and the executive and requiring unanimous agreement under clause "
         "10.4(g)"],
    ], [52, 110, FULLW - 34 - 162], header=["Stage", "Period", "Object"])
    c(el, "On the Review Date the Parties shall review the Company against clinical outcomes and "
          "complications; patient experience; the standard held, as certified by the Clinical "
          "Director; the proportion of the menu delivered to standard by the trained team; "
          "revenue, contribution and cash against the approved plan; and the enquiry pipeline and "
          "its conversion.", label="review")
    c(el, "Following that review the Parties may agree to proceed to Stage 2, to extend Stage 1, "
          "or to discontinue the venture. If the Parties agree to discontinue they shall do so "
          "cooperatively, with continuity of patient care as the first consideration, and no "
          "Party shall be committed beyond the point of proof.", label="review_outcomes")
    c(el, "The Parties agree that the object of the Company is that its standard be institutional. "
          "Accordingly each protocol shall be written, version controlled and signed off by the "
          "Clinical Director; each clinician shall be trained and credentialed against a "
          "documented milestone standard; no treatment shall be offered which the Clinical "
          "Director has not approved and none delegated which she has not certified as safe to "
          "delegate; a deputy clinical lead shall be identified and in place by the end of Stage "
          "2; and the growth of the team and of the menu shall be proposed by the Clinical "
          "Director at the pace at which she judges the standard can be held.", label="institutional")

    # ================================================== 14. STANDARDS OF CONDUCT
    heading(el, "Standards of conduct")
    c(el, "The Company shall deliver to a written clinical quality standard approved by the "
          "Clinical Director and documented in the Company's protocols, which shall be no lower "
          "than the standard she applies in her own practice and shall in all cases comply with "
          "Nigerian law and applicable professional standards. Where local market practice falls "
          "below that documented standard, the documented standard prevails. For the avoidance "
          "of doubt, the standard is the one documented in the protocols and not every feature "
          "of any other practice.", label="standard")
    c(el, "No clinical image or patient account shall be published without the specific, written "
          "and revocable consent of the patient, recorded and auditable. Consent to treatment and "
          "consent to publication are separate, and neither shall be a condition of the other.", label="consent")
    c(el, "Results published by the Company shall be the Company's own cases. The building of a "
          "documented body of results in the patient population the Company treats is a stated "
          "object of its content.")
    c(el, "No treatment, discount or service shall be exchanged for promotion, coverage or "
          "endorsement, and the Company shall not enter into influencer partnerships.")
    c(el, "The Clinical Director shall hold registration with the Medical and Dental Council of "
          "Nigeria and a current practising licence before she treats any patient of the Company. "
          "She is progressing that registration, and CFA shall support it and report its "
          "completion to the Board.", label="registration")
    c(el, "Until it is in place she shall not treat any patient in Nigeria, shall not be held "
          "out as entitled to do so, and shall not supervise clinical work performed in Nigeria. "
          "Her contribution in that period is the authorship of protocols, the design of the "
          "training programme, the setting of the clinical standard and the governance of "
          "quality, none of which requires registration, and clinical delivery is by clinicians "
          "registered in Nigeria working to her protocols.", label="not_until_registered")
    c(el, "The Company shall not hold the Clinical Director out as entitled to practise otherwise "
          "than as her registration permits, and shall not offer any treatment she cannot lawfully "
          "deliver at the site at which it is offered. The Company shall in addition appoint a "
          "Nigerian-registered practitioner as its medical director of record for each site it "
          "operates, that person meeting the requirements of the Council and of the Health "
          "Facility Monitoring and Accreditation Agency. That appointment is distinct from the "
          "role of Clinical Director, and a medical director's certificate may be used for one "
          "facility only at any time.", label="medical_director")
    c(el, "<b>Clinical governance is not the practice of medicine on a patient.</b> The "
          "Nigerian-registered clinician who treats a patient, and the medical director of "
          "record, remain independently and personally responsible for diagnosis, treatment, "
          "informed consent, execution, follow-up and compliance with their own professional "
          "obligations. The Clinical Director's authorship of a protocol, credentialing of a "
          "clinician, approval of a treatment for the menu or setting of the standard does not "
          "constitute supervision of, or participation in, any individual patient encounter, and "
          "shall not be construed as such, unless she expressly undertakes that encounter "
          "herself.", label="governance_not_treatment")
    c(el, "The Company shall indemnify the Clinical Director against claims arising from the acts "
          "or omissions of others in the course of the Business, save for her own fraud or wilful "
          "misconduct, and shall advance her defence costs. It shall maintain, at its own cost "
          "and for so long as any claim may be brought: medical indemnity expressly covering her "
          "activities as Clinical Director as distinct from her activities as a treating "
          "clinician; directors' and officers' cover; and run-off cover for a period agreed in "
          "the Shareholders' Agreement after she ceases to hold the role. Evidence of cover shall "
          "be produced to her annually.", label="indemnity")
    c(el, "The Company shall use only products registered by the National Agency for Food and "
          "Drug Administration and Control, no product being lawfully importable, sold or used in "
          "Nigeria otherwise than as registered under the NAFDAC Act Cap N1, Laws of the "
          "Federation of Nigeria 2004. Where a product used in the Clinical Director's United "
          "States practice is not registered in Nigeria, she shall either approve a registered "
          "equivalent or the treatment shall not be offered, and clause 15.1 shall be read "
          "accordingly.")
    c(el, "Before treating any patient the Company shall hold incorporation and tax registration; "
          "health facility registration with HEFAMAA for each site; full registration of each "
          "clinician with the Medical and Dental Council of Nigeria or the Nursing and Midwifery "
          "Council of Nigeria as applicable, verified before practice; the Nigerian practising "
          "registration and current practising licence of the Clinical Director on whichever "
          "route clause 15.6 establishes, together with "
          "imported product; prescription-only medicines held under a named resident prescriber; "
          "a written complications protocol, with hyaluronidase and an anaphylaxis kit stocked "
          "and in date at each site at which injectable treatments are performed; compliance with "
          "the Nigeria Data Protection Act 2023; and medical indemnity for the Company and each "
          "clinician together with public liability cover at each site.", label="compliance")
    c(el, "The position of the American Society of Plastic Surgeons on itinerant surgery, issued "
          "19 September 2024, governs the surgical practice of the Company. It makes the "
          "operating surgeon responsible for the continuity of the patient's care including the "
          "treatment of complications. Accordingly the Company "
          "shall appoint a plastic surgeon resident in Lagos, board certified or equivalently "
          "qualified, to whom care may be transferred on the patient's informed consent, and no "
          "surgical procedure shall be offered before that appointment is made.")
    c(el, "The Company shall contract with one or more licensed partner facilities for the use of "
          "a theatre, anaesthesia, recovery and any overnight or escalation capacity its cases "
          "require. Each such arrangement shall be contracted by the Company and not by any Party "
          "individually, and no Party shall negotiate with or commit to a facility on the "
          "Company's behalf without a written brief and a mandate from the Board. Operating "
          "privileges may be held personally by a clinician where the facility so requires, but "
          "the patient, the record, the consent and the revenue belong to the Company. Each "
          "arrangement shall settle theatre access and scheduling, anaesthesia and recovery, "
          "escalation and admission, fees and the flow of funds, and the terms on which each "
          "party's name may be used. Such arrangements are non-exclusive to the Company unless "
          "the Board agrees otherwise.", label="partner_facility")
    c(el, "Where a commercial opportunity conflicts with the clinical or ethical standard, the "
          "standard shall prevail and the decision of the Clinical Director shall be final.", label="standard_prevails")

    # ======================================================= 15. CONFIDENTIALITY
    heading(el, "Confidentiality")
    c(el, "Each Party shall keep confidential this Memorandum, its terms, and all information "
          "disclosed to it by another Party in connection with the venture, and shall not "
          "disclose the same otherwise than to its professional advisers or as required by law.")
    c(el, "This clause continues in force after a Party ceases to participate in the venture.")

    # ============================================================== 16. STATUS
    heading(el, "Status of this Memorandum")
    c(el, "Clause 5 (intellectual property and data), clause {preformation_costs} (costs already incurred), "
          "clause 16 (confidentiality), this clause 17, clause 18 (governing law and disputes) "
          "and clause 19 (general) are intended to be legally binding on the Parties from the "
          "date of this Memorandum.")
    c(el, "The remaining provisions record the Parties' intentions and their agreement in "
          "principle. They are not intended to create legal relations and shall take effect only "
          "on execution of the Shareholders' Agreement and the constitution of the Company.")
    c(el, "Nothing in this Memorandum obliges any Party to enter into the Shareholders' Agreement "
          "or to incorporate the Company.")
    c(el, "Each Party shall bear its own costs of negotiating and preparing this Memorandum and "
          "the Shareholders' Agreement. The costs of incorporation shall be borne by the Company.")

    # ========================================================== 17. GOVERNING LAW
    heading(el, "Governing law and disputes")
    c(el, "This Memorandum, and any dispute arising out of or in connection with it, are governed "
          "by the laws of the Federal Republic of Nigeria.")
    c(el, "The Parties shall seek to resolve any dispute by negotiation between the principals "
          "within fourteen days, failing which by mediation before a jointly appointed mediator, "
          "and failing which by arbitration in Lagos under the Arbitration and Mediation Act "
          "2023.")

    # =============================================================== 18. GENERAL
    heading(el, "General")
    c(el, "This Memorandum may be executed in counterparts and by electronic signature, each of "
          "which is an original and all of which together constitute one instrument.")
    c(el, "This Memorandum supersedes all prior drafts, term sheets and discussions between the "
          "Parties concerning the venture, and may be varied only in writing signed by all "
          "Parties.")
    c(el, "No Party may assign or transfer the benefit of this Memorandum without the written "
          "consent of the others.")
    c(el, "Nothing in this Memorandum creates a partnership between the Parties or constitutes any "
          "Party the agent of another.")

    # ============================================================== SCHEDULE 1
    el.append(PageBreak())
    el.append(Paragraph("SCHEDULE 1", CENTRE_B))
    el.append(Paragraph("<b>Functions and accountability</b>", CENTRE))
    el.append(Spacer(1, 4))
    el.append(Paragraph("This Schedule is given under clause 12. Part A lists the functions the "
                        "Company performs itself, Part B those a Party performs for it, and Part C "
                        "the transitional arrangements until the Company is fully staffed.", PLAIN))

    el.append(Paragraph("<b>Part A: functions the Company performs itself</b>", PLAIN))
    el.append(Paragraph("Performed by the Company's own officers and employees, and accountable to "
                        "the Board through the Company's day-to-day lead appointed under clause "
                        "12.3.", PLAIN))
    table(el, [
        ["Clinical delivery by the Company's employed clinicians, within their credentialing"],
        ["Patient reception, coordination, scheduling and aftercare follow-up"],
        ["Consent taking and record keeping, including consent to publication under clause {consent}"],
        ["Finance: bookkeeping, management accounts, banking and treasury"],
        ["Payroll, employment administration and pension and statutory deductions"],
        ["Statutory filings and corporate secretarial compliance"],
        ["Insurance placement and renewal, including medical indemnity and public liability"],
        ["Site level stock control, cold chain and expiry management"],
        ["Patient feedback and complaints"],
        ["Health and safety, clinical waste and incident reporting"],
        ["Data protection compliance under the Nigeria Data Protection Act 2023, and the response to data subject requests"],
    ], [FULLW], indent=0)

    el.append(Paragraph("<b>Part B: functions a Party performs for the Company</b>", PLAIN))
    el.append(Paragraph("Each is performed under the written agreement identified against it, and "
                        "is accountable to the Board.", PLAIN))
    table(el, [
        ["Clinical standard, protocols and treatment algorithms", "Dr Kpaduwa",
         "Clause {tier1} and the licence under clause {marks_licence}"],
        ["Credentialing of clinicians and sign-off before independent practice", "Dr Kpaduwa",
         "Clause {tier1}"],
        ["Training of the clinical team", "Dr Kpaduwa",
         "Clause 14.4; scheduled and organised by CFA"],
        ["Delivery of the advanced and surgical work", "Dr Kpaduwa",
         "Clinical engagement terms under clause {clinical_pay}"],
        ["Brand direction, messaging, and approval of clinical content", "Dr Kpaduwa",
         "Clause {tier1} and the licence under clause {marks_licence}"],
        ["Formation, licensing and regulatory establishment", "CFA",
         "Services agreement, clause {services_agreement}"],
        ["Recruitment of the Company's team", "CFA", "Services agreement, clause {services_agreement}"],
        ["Implementation of the operating systems and the patient record", "CFA",
         "Services agreement, clause {services_agreement}"],
        ["Marketing operations, funnel and content production", "CFA",
         "Services agreement, clause {services_agreement}; content approved by Dr Kpaduwa"],
        ["Procurement, importation and supply chain", "CFA",
         "Services agreement, clause {services_agreement}; specification set by the Clinical Director"],
        ["Programme management and reporting to the Board", "CFA",
         "Services agreement, clause {services_agreement}"],
        ["The base and the fit-out works, and the equipment", "Medbury",
         "As owner of the premises, under clause {occupancy}"],
        ["Introductions to host institutions, referring hospitals and corporate accounts",
         "Medbury", "Clause 6.2. The Company contracts with the institution under clause {partner_facility}"],
        ["Referral of aesthetics and cosmetic surgery work from the Group", "Medbury",
         "Referral protocol under clause {first_refusal}"],
    ], [FULLW - 250, 82, 168],
        header=["Function", "Performed by", "Under"], indent=0)

    el.append(Paragraph("<b>Part C: transitional arrangements</b>", PLAIN))
    table(el, [
        ["Until the Company's day-to-day lead is appointed, and until the Company has appointed "
         "its own finance and administrative staff, CFA shall carry the Part A finance, payroll, "
         "filings and insurance functions under the services agreement referred to in clause {services_agreement}."],
        ["Medbury may provide any Part A function as a transitional shared service, but only on "
         "the terms and subject to the approvals in clause {shared_services}."],
        ["Where a person employed within the Group is to work for the Company, that person shall "
         "either be employed by the Company or seconded to it on written terms approved by the "
         "Board under clause 3.7. No person shall perform a Company function without one or the "
         "other being in place."],
    ], [FULLW], indent=0)

    # ============================================================== SCHEDULE 2
    el.append(PageBreak())
    el.append(Paragraph("SCHEDULE 2", CENTRE_B))
    el.append(Paragraph("<b>Immediate work plan</b>", CENTRE))
    el.append(Spacer(1, 4))
    el.append(Paragraph("Periods run from the date of this Memorandum unless otherwise stated.", PLAIN))
    table(el, [
        ["Shortlist, search and agreement of the House Brand", "CFA prepares; all Parties agree", "10 business days"],
        ["Incorporation, bank accounts and statutory registrations", "CFA", "10 business days from selection of the name"],
        ["Instruction of lawyers on the Shareholders' Agreement and constitution", "CFA instructs; all Parties review", "2 weeks"],
        ["Execution of the licence under clause {marks_licence}", "KP Plastic Surgery, procured by Dr Kpaduwa, and the Company", "With the Shareholders' Agreement"],
        ["Written enquiry to the Medical and Dental Council and opinion on the registration route under clause {registration}",
         "CFA", "Enquiry within 7 days; report within 28 days"],
        ["Definition of the Stage 1 treatment menu", "Clinical Director", "7 days"],
        ["Establishment budget and twelve month operating budget", "CFA prepares; Board approves", "2 weeks"],
        ["Recruitment of two surgical nurses and one care coordinator", "CFA, with Medbury sourcing internally", "Offers issued within 3 weeks"],
        ["Training programme: discovery call, patient management, the patient journey and protocols",
         "Clinical Director; organised by CFA", "On appointment of the team"],
        ["Review of United States enquiry and audience data, and compilation of the Nigerian interest list",
         "Dr Kpaduwa's marketing team with CFA", "At the marketing meeting"],
        ["Written brief for the partner theatre arrangement, and thereafter the meeting with Euracare",
         "CFA drafts; all Parties attend", "Brief first; meeting within 2 weeks"],
        ["Three to five index procedures, consented, documented and photographed to standard, performed by a clinician registered to perform them",
         "Coordinated by CFA to the Clinical Director's protocols", "Before the Review Date, subject to clause {not_until_registered}"],
        ["Marketing funnel: channels, referral protocol and content calendar", "CFA; approved by Dr Kpaduwa", "3 weeks"],
        ["The Lyfe Place base: brief, drawings and fit-out programme", "Medbury; project managed by CFA", "4 weeks"],
        ["Occupancy terms for The Lyfe Place", "Medbury and the Company", "With the Shareholders' Agreement"],
        ["Regulatory: facility registration, the Clinical Director's licence and product compliance", "CFA", "Commenced within 2 weeks"],
        ["The review under clause 14.2", "All Parties", "November 2026"],
    ], [FULLW - 262, 140, 122], header=["Action", "Owner", "By when"], indent=0)

    # ============================================================== SCHEDULE 3
    el.append(PageBreak())
    el.append(Paragraph("SCHEDULE 3", CENTRE_B))
    el.append(Paragraph("<b>Matters to be settled in the Shareholders' Agreement</b>", CENTRE))
    el.append(Spacer(1, 4))
    el.append(Paragraph("The following are not settled by this Memorandum. None of them prevents "
                        "the work at Schedule 2 from proceeding.", PLAIN))
    table(el, [
        ["1", "The shareholding", "Confirmation of the percentages at clause {share_capital}"],
        ["2", "The holding vehicle", "Whether Dr Kpaduwa holds her shares personally or through a Nigerian company she owns, both of which preserve the position in clause {citizenship}"],
        ["3", "The registration route", "The Clinical Director's route to registration on the Council's answer under clause {registration}, and what it means for the Stage 1 timetable and for who performs the first cases"],
        ["4", "Cash subscription", "Whether any Party subscribes cash beyond its contribution under clause 6, and the consequent adjustment"],
        ["5", "Build-up on holdings", "Whether any holding is subject to a build-up or milestone arrangement, and on what basis"],
        ["6", "Clinical remuneration", "The terms on which the Clinical Director and the clinical team are remunerated under clause {clinical_pay}"],
        ["7", "Funding terms", "The establishment budget, the drawdown schedule and the priority return under clause {waterfall}"],
        ["8", "Occupancy and equipment", "The rate and the term under clause {occupancy}"],
        ["9", "CFA's services agreement", "Scope and terms under clause {services_agreement}"],
        ["10", "The operating calendar", "The Stage 1 and Stage 2 calendars against which the Company plans, books and staffs"],
        ["11", "Interim delivery", "Where non-surgical treatment is delivered before the base opens"],
        ["12", "The partner theatre", "Which facility, and the terms on which the Company's cases are performed there under clause {partner_facility}"],
        ["13", "Continuing commitments", "Whether any commitment binds a Party after it ceases to be a shareholder, and for how long"],
        ["14", "Transfers and leaver terms", "Pre-emption, tag and drag rights, valuation, and the treatment of a holding on departure"],
        ["15", "Deadlock", "The mechanism for resolving a fundamental deadlock"],
    ], [22, 132, FULLW - 154], header=["", "Matter", "To be settled"], indent=0)

    # ============================================================== SCHEDULE 4
    el.append(PageBreak())
    el.append(Paragraph("SCHEDULE 4", CENTRE_B))
    el.append(Paragraph("<b>Derivation of the shareholding</b>", CENTRE))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "The method, agreed between the Parties, is to cost the set-up, value what each Party "
        "brings at what a third party would charge for it, deduct whatever cash that Party is "
        "actually paid for it, and let equity follow the residual. A Party paid the full market "
        "rate for a thing has contributed nothing to the balance sheet in respect of it. A Party "
        "that forgoes cash has subscribed with the money it did not take.", PLAIN))
    el.append(Paragraph(
        "All figures NGN millions, over the first three years, on cumulative revenue of NGN "
        f"{MODEL.ngn(MODEL.REV3)}m. Every figure is a benchmark to be replaced with the Parties' "
        "own numbers, at which point the percentages recompute.", PLAIN))

    L = MODEL.lines()
    NET = MODEL.net()
    for party in MODEL.PARTIES:
        el.append(Paragraph(f"<b>{party}</b>", PLAIN))
        rows = [[Paragraph("Contribution", TH), Paragraph("Valued on", TH),
                 Paragraph("At market", THR), Paragraph("Cash paid", THR), Paragraph("Net", THR)]]
        for label, basis, gross, cash, _cat, _when in L[party]:
            rows.append([Paragraph(label, TD), Paragraph(basis, TD),
                         Paragraph(MODEL.ngn(gross), TDR),
                         Paragraph(MODEL.ngn(cash) if cash else "nil", TDR),
                         Paragraph(MODEL.ngn(gross - cash), TDR)])
        rows.append([Paragraph("Net contribution", TDB), Paragraph("", TDB),
                     Paragraph(MODEL.ngn(sum(g for _, _, g, _, _, _ in L[party])), TDBR),
                     Paragraph(MODEL.ngn(sum(c for _, _, _, c, _, _ in L[party])), TDBR),
                     Paragraph(MODEL.ngn(NET[party]), TDBR)])
        t = Table(rows, colWidths=[128, FULLW - 128 - 156, 52, 52, 52], repeatRows=1)
        t.setStyle(TableStyle([
            ("GRID", (0, 0), (-1, -1), 0.5, RULE),
            ("LINEBELOW", (0, 0), (-1, 0), 0.9, RULE),
            ("LINEABOVE", (0, -1), (-1, -1), 0.9, RULE),
            ("BACKGROUND", (0, -1), (-1, -1), HexColor("#EDEDED")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("LEFTPADDING", (0, 0), (-1, -1), 5), ("RIGHTPADDING", (0, 0), (-1, -1), 5)]))
        el.append(t)
        el.append(Spacer(1, 12))

    total = sum(NET.values())
    rows = [[Paragraph("Party", TH), Paragraph("Net contribution", THR), Paragraph("Share", THR),
             Paragraph("Held", THR)]]
    for party in MODEL.PARTIES:
        rows.append([Paragraph(party, TD), Paragraph(MODEL.ngn(NET[party]), TDR),
                     Paragraph(f"{100*NET[party]/total:.1f}%", TDR),
                     Paragraph(f"{PCT[party]}%", TDR)])
    rows.append([Paragraph("Total", TDB), Paragraph(MODEL.ngn(total), TDBR),
                 Paragraph("100.0%", TDBR), Paragraph("100%", TDBR)])
    t = Table(rows, colWidths=[FULLW - 216, 88, 64, 64], repeatRows=1)
    t.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.5, RULE),
        ("LINEBELOW", (0, 0), (-1, 0), 0.9, RULE),
        ("LINEABOVE", (0, -1), (-1, -1), 0.9, RULE),
        ("BACKGROUND", (0, -1), (-1, -1), HexColor("#EDEDED")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 5), ("RIGHTPADDING", (0, 0), (-1, -1), 5)]))
    el.append(t)
    el.append(Spacer(1, 10))
    el.append(Paragraph(
        "<b>Two points on the valuation of the name, which is the line most open to challenge.</b> "
        f"A royalty of {MODEL.ROYALTY_MARKET*100:.0f} per cent is the market rate for an "
        "established brand in its own market. In Nigeria the marks have no trading history and no "
        "local recognition, so the royalty is applied to the revenue the name can be shown to "
        f"attract, being NGN {MODEL.ngn(MODEL.BRAND_ATTRIBUTABLE)}m of the "
        f"NGN {MODEL.ngn(MODEL.REV3)}m, and not to the whole book. That values the licence at NGN "
        f"{MODEL.ngn(MODEL.BRAND_VALUE)}m rather than NGN "
        f"{MODEL.ngn(MODEL.ROYALTY_MARKET*MODEL.REV3)}m. The identical basis is applied to "
        "Medbury's referral flow, so that the capability each Party claims is measured the same "
        "way. The name is valued once. It is not counted again as demand generated, those being "
        "two ways of pricing the same pull.", PLAIN))

    # ============================================================== SCHEDULE 4A
    el.append(PageBreak())
    el.append(Paragraph("SCHEDULE 4A", CENTRE_B))
    el.append(Paragraph("<b>Vesting measures</b>", CENTRE))
    el.append(Spacer(1, 4))
    el.append(Paragraph(_res(
        "Given under clause {vesting}. These are the measures themselves rather than an "
        "undertaking to agree measures later. No measure may be added, removed or altered "
        "without the written consent of the Party it applies to."), PLAIN))
    el.append(Paragraph("<b>Dr Chinwe Kpaduwa</b>", PLAIN))
    table(el, [[a, b] for a, b in MODEL.KP_VESTING], [104, FULLW-104],
          header=["Measure", "What is required"], indent=0)
    el.append(Paragraph("<b>Consult for Africa, operating tranche</b>", PLAIN))
    el.append(Paragraph("Measured annually by the Board. The founding tranche vests on "
                        "acceptance of the deliverables at Schedule 5.", PLAIN))
    table(el, [[a, b] for a, b in MODEL.CFA_VESTING], [104, FULLW-104],
          header=["Measure", "What is required"], indent=0)
    el.append(Paragraph("<b>Medbury Healthcare Group</b>", PLAIN))
    el.append(Paragraph(_res(
        "Equity referable to capital issues as the capital is actually advanced against the "
        "approved budget. Equity referable to rent forgone vests as it is forgone, month by "
        "month, over the window at clause {window}."), PLAIN))

    # ============================================================== SCHEDULE 5
    el.append(PageBreak())
    el.append(Paragraph("SCHEDULE 5", CENTRE_B))
    el.append(Paragraph("<b>What CFA's contributions cover, and over what period</b>", CENTRE))
    el.append(Spacer(1, 4))
    el.append(Paragraph("Given in answer to the question of what each line at Schedule 4 buys. "
                        "Figures are budget estimates to be confirmed against quotations before "
                        "the Shareholders' Agreement is executed, and any underspend reduces the "
                        "contribution and the holding with it.", PLAIN))

    el.append(Paragraph("<b>Regulatory establishment, NGN %sm</b>" % MODEL.ngn(MODEL.CFA_REGULATORY), PLAIN))
    el.append(Paragraph("Establishment only. It runs from signature until the Company holds "
                        "everything at clause 15.10 and may lawfully treat a patient. Annual "
                        "renewals after that are an operating cost of the Company and not a CFA "
                        "contribution.", PLAIN))
    table(el, [[a, b, f"{v:,}"] for a, b, v in MODEL.REGULATORY_BREAKDOWN] +
              [["<b>Total</b>", "", f"<b>{sum(v for _,_,v in MODEL.REGULATORY_BREAKDOWN):,}</b>"]],
          [150, FULLW - 150 - 62, 62], header=["Item", "What it covers", "NGN 000"], indent=0)

    el.append(Paragraph("<b>Recruitment of the founding team, NGN %sm</b>" % MODEL.ngn(MODEL.CFA_RECRUITMENT), PLAIN))
    el.append(Paragraph("Six appointments, being the team the Company needs to open and to "
                        "satisfy clause 15.11. Priced at market search fees for the roles. It "
                        "covers the founding team only; hiring after the Company is open is an "
                        "operating cost.", PLAIN))
    table(el, [[r, str(n)] for r, n in MODEL.CFA_RECRUITMENT_BREAKDOWN] +
              [["<b>Total appointments</b>", f"<b>{sum(n for _,n in MODEL.CFA_RECRUITMENT_BREAKDOWN)}</b>"]],
          [FULLW - 90, 90], header=["Role", "Number"], indent=0)

    el.append(Paragraph("<b>Structuring, NGN %sm, and systems, NGN %sm</b>"
                        % (MODEL.ngn(MODEL.CFA_STRUCTURING), MODEL.ngn(MODEL.CFA_SYSTEMS)), PLAIN))
    el.append(Paragraph(_res("Structuring covers this Memorandum, the Shareholders' Agreement, the "
                        "constitution, the licence at clause {marks_licence} and the services agreement, to "
                        "execution. Systems covers the configuration of the patient record, "
                        "booking, clinical documentation and reporting, the data migration and "
                        "the training of staff on them, to go-live. It is the build the Company "
                        "keeps. The licence of the underlying platforms earns CFA nothing, per "
                        "clause 5.5."), PLAIN))

    el.append(Paragraph("<b>What CFA actually contributes, and what it recognises</b>", PLAIN))
    el.append(Paragraph(_res("The figures above are deliverable prices and pass-through costs. They "
                        "price no professional time at all. Because the fee at clause {fee} is "
                        "charged on revenue and there is no revenue before launch, every hour "
                        "CFA works between signature and opening is uncompensated. Priced on "
                        "CFA's ordinary basis of resourced days at published rates plus a "
                        "programme rate, that time is set out below."), PLAIN))
    rows=[[ws, str(sum(mix.values())),
           f"{sum(MODEL.CFA_RATES[g]*n for g,n in mix.items())/MODEL.M:,.1f}"]
          for ws, mix in MODEL.CFA_WORKSTREAMS]
    rows.append([f"<b>Professional time, {MODEL.CFA_DAYS} days, with the programme rate</b>", "",
                 f"<b>{MODEL.CFA_TIME_VALUE/MODEL.M:,.0f}</b>"])
    table(el, rows, [FULLW-140, 62, 78], header=["Workstream", "Days", "NGN m"], indent=0)
    el.append(Paragraph("Two further contributions were carried at nil in earlier drafts and are "
                        "recorded here.", PLAIN))
    rows=[["Subordinated risk on the deferred fee",
           f"{MODEL.ngn(MODEL.CFA_RISK_BORNE)}",
           f"CFA defers NGN {MODEL.ngn(MODEL.CFA_DEFERRED_FACE)}m ranking behind Medbury's capital "
           f"and priority return, paid only if the venture succeeds. Risk borne is the difference "
           f"between face and present value"]]
    rows += [[a, f"{MODEL.ngn(v)}", ""] for a, v in MODEL.CFA_ORIGINATION]
    table(el, rows, [178, 46, FULLW-224], header=["Contribution", "NGN m", "Basis"], indent=0)
    el.append(Paragraph(
        "Taken together CFA's contribution is about NGN %s m. <b>CFA recognises NGN %s m of "
        "it, being some %d per cent, against the %d per cent at which Medbury's and Dr "
        "Kpaduwa's valuations are recognised.</b> On the framework CFA would hold about %d per "
        "cent. It holds %d. The difference is not an oversight and it is not charged for: it "
        "is recorded so that the Parties know what the operator is contributing and choosing "
        "not to count."
        % (MODEL.ngn(MODEL.CFA_TIME_VALUE + MODEL.CFA_RECRUITMENT + MODEL.CFA_SYSTEMS + MODEL.CFA_RISK_BORNE + sum(v for _, v in MODEL.CFA_ORIGINATION)),
           MODEL.ngn(MODEL.CFA_STRUCTURING + MODEL.CFA_RECRUITMENT + MODEL.CFA_SYSTEMS),
           round(100*(MODEL.CFA_STRUCTURING+MODEL.CFA_RECRUITMENT+MODEL.CFA_SYSTEMS)/(MODEL.CFA_TIME_VALUE + MODEL.CFA_RECRUITMENT + MODEL.CFA_SYSTEMS + MODEL.CFA_RISK_BORNE + sum(v for _, v in MODEL.CFA_ORIGINATION))),
           round(MODEL.RECOGNITION_RATE*100),
           16, MODEL.AGREED_PCT[MODEL.CFA]), PLAIN))
    el.append(Paragraph("The regulatory line is the one most often mistaken for a fee. It is "
                        "not. Every naira of it goes to the Corporate Affairs Commission, "
                        "HEFAMAA, the Councils, NAFDAC, the Trade Marks Registry or an agent, as "
                        "itemised above. CFA's own time running that pathway sits in the table "
                        "above and is not charged.", PLAIN))

    el.append(Paragraph(_res("<b>What the management fee at clause {fee} pays for</b>"), PLAIN))
    el.append(Paragraph(_res("The fee shall be decomposed in the services agreement and reported to "
                        "the Board each quarter in three parts, so that no part of it is "
                        "mistaken for another: the cost of personnel CFA provides who work "
                        "wholly for the Company, which is reimbursement and not margin; the "
                        "cost of the platforms and third-party services CFA supplies; and CFA's "
                        "management margin, being the residue. Only the third is CFA's "
                        "remuneration, and only the third is to be compared with the market rate "
                        "for management services. CFA takes no equity for personnel whose cost "
                        "the Company reimburses, and its holding at clause {share_capital} is for the "
                        "founding work at Schedule 4 alone."), PLAIN))
    el.append(Paragraph("The fee is not a profit share and it is not a second charge for the "
                        "founding work above. It funds the operating team and the systems that "
                        "run the Company day to day: the executive and operations staff CFA "
                        "provides until the Company employs its own under Part C of Schedule 1, "
                        "the use of CFA's platforms, marketing operations, procurement and "
                        "supply chain including foreign exchange management, management "
                        "reporting to the Board, and CFA's supervision of the whole. It steps "
                        "down as the Company's own staff take those functions on, and an "
                        "itemised statement of what it covers is annexed to the services "
                        "agreement.", PLAIN))

    # ============================================================== SCHEDULE 6
    el.append(PageBreak())
    el.append(Paragraph("SCHEDULE 6", CENTRE_B))
    el.append(Paragraph("<b>What the Company needs, and what the ceiling is for</b>", CENTRE))
    el.append(Spacer(1, 4))
    el.append(Paragraph(_res("The ceiling at clause {funding_cap} is not a target. It is an outside limit, and "
                        "the Company draws only what the approved budget requires. This Schedule "
                        "sets out the requirement built up from the work rather than assumed, so "
                        "that the ceiling can be tested against it."), PLAIN))
    rows=[[st, item, f"{v:,.1f}"] for st,item,v in MODEL.CASH_REQUIREMENT]
    rows.append(["<b>Total</b>","",f"<b>{sum(v for _,_,v in MODEL.CASH_REQUIREMENT):,.1f}</b>"])
    table(el, rows, [92, FULLW-92-70, 70],
          header=["Stage", "Requirement", "NGN m"], indent=0)
    el.append(Paragraph(_res("The fit-out of the base is Medbury's investment in its own estate, "
                        "recovered through the occupancy terms at clause {occupancy}, and is not a cash "
                        "requirement of the Company."), PLAIN))
    el.append(Paragraph("<b>The device roadmap, which is deferred and not in the requirement above</b>", PLAIN))
    el.append(Paragraph("None of the following is in the cash requirement. Each is "
                        "revenue-generating and is added from trading income or leased once the "
                        "diary justifies it. The ordering is clinical rather than aspirational: "
                        "most patients of this Company will be Fitzpatrick IV to VI, and several "
                        "of the best known platforms are the wrong instruments for that skin. "
                        "Selecting by brand recognition rather than by skin type is a clinical "
                        "risk before it is a commercial one, and the Clinical Director's approval "
                        "under clause 10.2 governs.", PLAIN))
    rows=[[n, ("deferred" if v == 0 else f"{v:,.0f}"), tag, why]
          for n, v, tag, why in MODEL.DEVICE_ROADMAP]
    table(el, rows, [118, 46, 60, FULLW-224],
          header=["Platform", "NGN m", "Position", "Why"], indent=0)

    el.append(Paragraph("<b>How the requirement can be reduced</b>", PLAIN))
    el.append(Paragraph("The Board shall consider each of the following before drawing against "
                        "the ceiling. They reduce the peak funding rather than the total cost of "
                        "the assets, and they improve the Company's cash profile in the period "
                        "when it is least able to carry one.", PLAIN))
    rows=[[a, f"{v:,.0f}", note] for a,v,note in MODEL.CASH_REDUCTIONS]
    rows.append(["<b>Peak requirement if all three are taken</b>",
                 f"<b>{sum(v for _,_,v in MODEL.CASH_REQUIREMENT)-sum(v for _,v,_ in MODEL.CASH_REDUCTIONS):,.0f}</b>",""])
    table(el, rows, [190, 56, FULLW-246], header=["Measure", "NGN m", "Effect"], indent=0)

    # ============================================================== EXECUTION
    el.append(PageBreak())
    el.append(Paragraph("EXECUTION", CENTRE_B))
    el.append(Spacer(1, 12))
    el.append(Paragraph("The Parties have signed this Memorandum on the date first written above.",
                        PLAIN))
    el.append(Spacer(1, 26))
    sig_block(el, "MEDBURY HEALTHCARE GROUP", "Dr Itunu Akinware, Group Chief Executive")
    sig_block(el, "DR CHINWE KPADUWA", "Dr Chinwe Kpaduwa, in her personal capacity")
    sig_block(el, "CONSULT FOR AFRICA", "Dr Adebowale Odulana, Founding Partner")
    el.append(Spacer(1, 8))
    el.append(Paragraph(_res("<b>JOINDER, limited to clause {marks_licence}</b>"), PLAIN))
    el.append(_res(Paragraph)("", PLAIN) if False else Paragraph(_res(
        "KP Plastic Surgery joins this Memorandum for the sole purpose of the licence of the "
        "Marks at clause {marks_licence} and for no other purpose. It is not a shareholder in "
        "the Company, assumes no obligation under any other clause, and its execution here does "
        "not make it a Party."), PLAIN))
    sig_block(el, "KP PLASTIC SURGERY", "for and on behalf of KP Plastic Surgery")

    doc.build(el)
    print(f"wrote {OUT}")


if __name__ == "__main__":
    import io
    _RESOLVING["pass"] = 1
    _real = OUT
    try:
        globals()["OUT"] = Path("/dev/null")
        build()
    finally:
        globals()["OUT"] = _real
    _CL["clause"] = 0
    _CL["sub"] = 0
    _RESOLVING["pass"] = 2
    build()
