"""
Build "Medlyfe: recruiting the COO and the health coach" PDF.

Itunu asked directly on WhatsApp (2026-08-16, 23:20 to 23:22):
  "Can you help us hire a full time COO for medlyfe as a recruitment contract"
  "Also need to recruit a solid health coach for medlyfe"
  "Pls let me know how to engage for the recruitments"

This answers exactly that and nothing else. It is DELIBERATELY single-purpose:
the medipark setup-and-management mandate goes to her separately. Tangling a
simple recruitment yes into the bigger fee negotiation risks losing both.

NO PLATFORM NAMES IN CLIENT BODY COPY (Debo, 2026-08-17): no Maarova, CadreHealth or
DFC name-drops. Describe what is done, not which CFA product does it. Naming them
reads as selling tools rather than outcomes and invites questions.

Commercials follow the canonical CFA rate: 15% of first-year total package,
retained, tranched so the engagement fee lands before the search starts. The
client's pattern is to begin work before contractual alignment (the Abuja
property search), so the non-refundable engagement tranche is the point.

Output: docs/medlyfe-recruitment-terms-cfa.pdf
House style: CFA navy and gold. Naira as NGN. No em dashes.

Run:
  python3 scripts/build-medlyfe-recruitment-terms.py
"""

from __future__ import annotations

from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import (
    BaseDocTemplate, Frame, PageBreak, PageTemplate, Paragraph, Spacer, Table, TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "medlyfe-recruitment-terms-cfa.pdf"

NAVY = HexColor("#0F3D2E")
GOLD = HexColor("#C6A15B")
TEAL = HexColor("#2F6B52")
BODY = HexColor("#23302B")
MUTED = HexColor("#7C7C74")
SURFACE = HexColor("#F5F2EA")
LIGHT = HexColor("#CBDDD1")
PANEL = HexColor("#E9F0EA")
CREAM = HexColor("#F6EFDD")
ALERT = HexColor("#FBF0E4")
RUST = HexColor("#B8763A")

PAGE_W, PAGE_H = A4
MARGIN = 44
FULLW = PAGE_W - 2 * MARGIN
ss = getSampleStyleSheet()


def style(name, **kw):
    base = dict(fontName="Helvetica", fontSize=9.0, leading=12.2, textColor=BODY,
                alignment=TA_LEFT, spaceAfter=5)
    base.update(kw)
    return ParagraphStyle(name, **base)


EYEBROW = style("eyebrow", fontName="Helvetica-Bold", fontSize=8.2, leading=10.8,
                textColor=GOLD, spaceAfter=2)
H1 = style("h1", fontName="Helvetica-Bold", fontSize=13, leading=16.5, textColor=NAVY,
           spaceBefore=2, spaceAfter=6, keepWithNext=True)
H2 = style("h2", fontName="Helvetica-Bold", fontSize=9.8, leading=12.8, textColor=TEAL,
           spaceBefore=12, spaceAfter=4, keepWithNext=True)
P = style("p")
LEDE = style("lede", fontSize=9.7, leading=13.6, textColor=HexColor("#374151"))
SMALL = style("small", fontSize=7.5, leading=10.0, textColor=MUTED)
CELL = style("cell", fontSize=8.1, leading=10.5)
CELL_R = style("cellr", fontSize=8.1, leading=10.5, alignment=2)
CELL_B = style("cellb", fontSize=8.1, leading=10.5, fontName="Helvetica-Bold", textColor=NAVY)
CELL_BR = style("cellbr", fontSize=8.1, leading=10.5, fontName="Helvetica-Bold",
                textColor=NAVY, alignment=2)
CELL_W = style("cellw", fontSize=8.1, leading=10.5, fontName="Helvetica-Bold", textColor=white)
CELL_WR = style("cellwr", fontSize=8.1, leading=10.5, fontName="Helvetica-Bold",
                textColor=white, alignment=2)


def page_bg(c, doc):
    c.saveState()
    c.setFillColor(NAVY)
    c.rect(0, PAGE_H - 30, PAGE_W, 30, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(0, PAGE_H - 33, PAGE_W, 3, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(MARGIN, PAGE_H - 20, "MEDLYFE")
    c.setFillColor(LIGHT)
    c.setFont("Helvetica", 8)
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 20, "Recruitment: COO and health coach")
    c.setFillColor(GOLD)
    c.rect(MARGIN, 26, 20, 2, fill=1, stroke=0)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 7.4)
    c.drawString(MARGIN, 15, "Private and confidential  /  Prepared for Dr Itunu Akinware, Group CEO")
    c.drawRightString(PAGE_W - MARGIN, 15, "Page %d" % doc.page)
    c.restoreState()


def card(text, bg=SURFACE, fg=BODY, rule=GOLD):
    st = ParagraphStyle("c", parent=P, textColor=fg, leftIndent=6, rightIndent=6,
                        spaceBefore=2, spaceAfter=2)
    t = Table([[Paragraph(text, st)]], colWidths=[FULLW])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("LINEBEFORE", (0, 0), (0, -1), 2.5, rule),
        ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 10), ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ]))
    return t


def tbl(rows, labels, widths, total_row=False, aligns=None, hi=None, sub=None):
    ncols = len(labels)
    if aligns is None:
        aligns = ["r"] * (ncols - 1)
    hi = hi or set()
    sub = sub or set()
    for i, r in enumerate(rows):
        assert len(r) == ncols, "row %d has %d cells, header has %d" % (i, len(r), ncols)
    data = [[Paragraph(labels[0], CELL_W)] +
            [Paragraph(t, CELL_WR if aligns[j] == "r" else CELL_W) for j, t in enumerate(labels[1:])]]
    for i, r in enumerate(rows):
        emph = (total_row and i == len(rows) - 1) or i in hi or i in sub
        cells = [Paragraph(r[0], CELL_B if emph else CELL)]
        for j, v in enumerate(r[1:]):
            cells.append(Paragraph(v, (CELL_BR if emph else CELL_R) if aligns[j] == "r"
                                   else (CELL_B if emph else CELL)))
        data.append(cells)
    t = Table(data, colWidths=widths, repeatRows=1)
    st = [
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("LINEBELOW", (0, 0), (-1, 0), 1.5, GOLD),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 3.2), ("BOTTOMPADDING", (0, 0), (-1, -1), 3.2),
        ("LEFTPADDING", (0, 0), (-1, -1), 7), ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("ROWBACKGROUNDS", (0, 1), (-1, -2 if total_row else -1), [white, SURFACE]),
    ]
    if total_row:
        st += [("BACKGROUND", (0, -1), (-1, -1), CREAM), ("LINEABOVE", (0, -1), (-1, -1), 1, GOLD)]
    for i in hi:
        st.append(("BACKGROUND", (0, i + 1), (-1, i + 1), PANEL))
    for i in sub:
        st.append(("LINEABOVE", (0, i + 1), (-1, i + 1), 0.6, GOLD))
    t.setStyle(TableStyle(st))
    return t


def sec(el, num, eyebrow, title):
    """Section header. The leading spacer is the point: without it the eyebrow
    collides with whatever table or card ended the previous section."""
    el.append(Spacer(1, 13))
    el.append(Paragraph(num + "  /  " + eyebrow, EYEBROW))
    el.append(Paragraph(title, H1))


def build():
    doc = BaseDocTemplate(
        str(OUT), pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=42, bottomMargin=30,
        title="Medlyfe - recruiting the COO and the health coach",
        author="Consult for Africa")
    doc.addPageTemplates([PageTemplate(
        id="p", frames=[Frame(MARGIN, 30, FULLW, PAGE_H - 42 - 30, id="f")], onPage=page_bg)])
    el = []

    el.append(Paragraph("Recruiting for Medlyfe",
                        style("t", fontName="Helvetica-Bold", fontSize=18, leading=21,
                              textColor=NAVY, spaceAfter=2)))
    el.append(Paragraph("A full-time COO and a health coach. How to engage.",
                        style("st", fontName="Helvetica-Oblique", fontSize=10.5, leading=13,
                              textColor=GOLD, spaceAfter=8)))
    el.append(Paragraph(
        "<b>Two searches, and they are not the same search twice.</b> The COO is a commercial hire who "
        "carries the Medlyfe P&amp;L, drawn from a market of general managers and divisional operators "
        "who are almost all currently employed and not looking. The health coach is a specialist hire "
        "who carries the client relationship day to day, drawn from a younger and much shallower pool "
        "where the few strong practitioners are usually already placed. Different markets, different "
        "timelines, and different work to reach them.", LEDE))
    el.append(Paragraph(
        "Both are retained, and both produce the same thing: three or four candidates mapped, "
        "approached and interviewed against your brief, assessed for how they lead rather than only "
        "for what they have done, with references and credentials verified before you meet anyone. "
        "<b>The fee on each is 15% of first-year total package.</b> What follows is how that is paid, "
        "what it covers, what happens if a hire does not work, and the single step needed to start.",
        LEDE))

    # ---------------- THE TWO ROLES ----------------
    sec(el, "01", "THE TWO ROLES", "What each mandate is.")
    el.append(tbl(
        [["Chief Operating Officer, Medlyfe", "Full time, permanent",
          "<b>Owns the Medlyfe P&amp;L</b>, on the same basis as the leads of Hospitals, "
          "Pharmaceuticals and Diagnostics. Revenue, margin and growth, with clinical operations, "
          "quality and compliance, and the team reporting in. Answers to the Group Chief Executive",
          "8 to 10 weeks to offer"],
         ["Health coach, Medlyfe", "Full time, permanent",
          "Owns the client relationship across programmes: goal setting, behaviour change, "
          "adherence, and the handover between the physician, the nutritionist and the client",
          "4 to 6 weeks to offer"]],
        ["Role", "Basis", "What the person owns", "Timeline"],
        [116, 76, 210, 76], aligns=["l", "l", "l"], hi={0}))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>The COO joins the divisional leads as a peer, and that sets the bar.</b> Three "
        "consequences worth naming before the search opens. The search is for a commercial operator "
        "rather than a clinical operations manager, because the person carries revenue and margin, "
        "which is a materially smaller pool. The package has to be competitive against divisional "
        "general management rather than against clinical administration, and the benchmark we bring "
        "to the scoping call will reflect that. And because divisional leads at Medbury are given "
        "genuine autonomy, <b>this hire has to be someone capable of running independently from the "
        "first quarter</b>, not someone who needs to be managed into the role. That last point is the "
        "one that most often decides whether an operator hire works, and it is what the assessment on "
        "the shortlist is designed to test.", bg=PANEL))

    # ---------------- THE FEE ----------------
    sec(el, "02", "THE FEE", "What it costs, and when it is paid.")
    el.append(tbl(
        [["Chief Operating Officer, Medlyfe", "15%", "4.5"],
         ["Health coach, Medlyfe", "15%", "1.8"],
         ["Both mandates together", "", "6.3"]],
        ["Mandate", "Fee rate", "Minimum fee, NGN M"],
        [255, 100, 152], aligns=["r", "r"], total_row=True))
    el.append(Spacer(1, 3))
    el.append(Paragraph(
        "Total package means base salary plus guaranteed allowances and any guaranteed bonus for the "
        "first twelve months. It excludes discretionary bonus, equity and benefits in kind. Where 15% "
        "of the agreed package exceeds the minimum, the percentage applies; where it falls below, the "
        "minimum applies.", SMALL))
    el.append(Spacer(1, 4))
    el.append(Paragraph("Payment", H2))
    el.append(tbl(
        [["On engagement", "40%", "Payable before the search opens. It funds the search team, the "
          "package benchmark and the mapping work"],
         ["On delivery of the shortlist", "30%", "Three to four assessed candidates, with written "
          "profiles and a leadership assessment on each"],
         ["On acceptance of offer", "30%", "Payable when the candidate signs, not when they start"]],
        ["Tranche", "Share", "Note"], [148, 56, 274], aligns=["r", "l"], hi={0}))
    el.append(Spacer(1, 4))
    el.append(card(
        "<b>A structured leadership assessment on every shortlisted candidate is included at no "
        "additional charge.</b> For a COO it is the part that matters most, because the failure mode "
        "in an operator hire is rarely technical. It is judgement, temperament and the ability to "
        "hold a team through a difficult quarter, and an interview does not surface any of the three "
        "reliably.", bg=PANEL))

    # ---------------- WHAT IS INCLUDED ----------------
    sec(el, "03", "WHAT THE FEE COVERS", "And what it does not.")
    el.append(tbl(
        [["Included", "Role scoping, an evidenced package benchmark, and the written brief"],
         ["Included", "Market mapping and direct approach, including senior Nigerians working "
          "abroad where the role suits a returner"],
         ["Included", "Screening, competency interviewing, and a structured leadership assessment "
          "on the shortlist"],
         ["Included", "Reference and credential verification, including regulatory standing where "
          "the role is clinical"],
         ["Included", "Offer construction, negotiation support, and a thirty-day check-in after "
          "the start date"],
         ["Not included", "Candidate travel and relocation, and any pre-employment medical. "
          "Reimbursed at cost if incurred"],
         ["Not included", "Advertising in paid media, if Medbury wants it. Agreed in advance and "
          "reimbursed at cost with no commission"]],
        ["", "Item"], [88, 390], aligns=["l"], hi={2}))
    el.append(Spacer(1, 4))
    el.append(Paragraph("The guarantee", H2))
    el.append(card(
        "<b>If the person resigns or is dismissed for cause within six months of starting, CFA "
        "re-runs the search for the balance of out-of-pocket costs only. No second fee.</b> The "
        "condition is that the role, the package and the reporting line are unchanged. It is the term "
        "that puts the risk of a wrong hire where it belongs, which is with the firm that recommended "
        "the person.", bg=PANEL))

    # ---------------- INTERIM ----------------
    sec(el, "04", "THE GAP IN THE MEANTIME", "Optional, and worth considering for the COO only.")
    el.append(Paragraph(
        "A COO search runs eight to ten weeks to offer, and a candidate of that seniority will owe one "
        "to three months of notice, so realistically the seat is filled around month four. If Medlyfe "
        "cannot carry that gap, CFA can second an experienced operator into the role while the "
        "permanent search runs.", P))
    el.append(tbl(
        [["Interim operations lead, seconded from CFA",
          "NGN 3M a month, six months minimum, NGN 18M",
          "Full time on site. Holds the operating rhythm, the reporting and the team, and hands over "
          "to the permanent COO with the work in progress rather than in a folder"]],
        ["Option", "Rate", "What it is"], [138, 132, 208], aligns=["l", "l"]))
    el.append(Spacer(1, 3))
    el.append(card(
        "<b>Six months is the minimum because a shorter secondment does not repay itself.</b> An "
        "interim spends the first month learning the business and the last handing it over, so three "
        "months buys one useful month. Six buys a full operating quarter in the middle, and it covers "
        "the search, the successful candidate's notice period, and a proper overlap once they arrive. "
        "<b>It also produces a far better brief for the permanent search</b>, because the role ends up "
        "defined by what the clinic actually needs rather than by what an organogram says it should "
        "be.", bg=PANEL))
    el.append(Spacer(1, 3))
    el.append(Paragraph(
        "Entirely optional, and the permanent search proceeds either way. There is a question on the "
        "brief form for it.", P))

    # ---------------- NEXT ----------------
    el.append(PageBreak())
    sec(el, "05", "HOW IT STARTS", "Fill the brief. Everything else follows from it.")
    el.append(Paragraph(
        "There is no separate paperwork to sign. <b>The brief form is the instruction to proceed</b>, and "
        "submitting it authorises the search on the terms in this note. It also has to come first, "
        "because the fee is a percentage of the package and we cannot invoice a number the brief has "
        "not yet stated.", LEDE))
    el.append(card(
        '<b><font size="10.5" color="#0F3D2E">consultforafrica.com/recruitment/brief</font></b><br/>'
        '<link href="https://consultforafrica.com/recruitment/brief" color="#2F6B52">'
        '<b>Open the brief and start the search</b></link>'
        '<br/><font size="8" color="#7C7C74">Five steps, about ten minutes. Submit once for the COO '
        'and again for the health coach.</font>', bg=CREAM))
    el.append(Spacer(1, 5))
    el.append(tbl(
        [["1", "You complete the brief, once per role",
          "Accountability, person specification, package and process. The two answers that matter "
          "most are whether the role owns a P&amp;L and what the package is, because between them they "
          "decide who we can credibly approach"],
         ["2", "We invoice the engagement tranche",
          "Within one working day. 40% of the fee, calculated on the package in your brief, and "
          "non-refundable"],
         ["3", "<b>The search opens on receipt of funds</b>",
          "Not before. You then have a written brief and an evidenced package benchmark to approve "
          "within three working days"],
         ["4", "Shortlist, then offer",
          "30% of the fee falls due on delivery of the shortlist and 30% on acceptance of offer"]],
        ["", "Step", "What happens"], [18, 152, 308], aligns=["l", "l"], hi={2}))
    el.append(Spacer(1, 5))
    el.append(Paragraph(
        "If a field is not yet settled, submit your best answer and flag it in the notes. It is faster "
        "to correct one line at the scoping call than to hold the search waiting for certainty on a "
        "package range.", P))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "On the wider work, Medbury Aesthetics and the SPVs, the medipark, and the conversion centre: "
        "that comes to you as its own note so this one is not held up behind it.", P))
    el.append(Spacer(1, 6))
    el.append(card(
        "<b>Debo Odulana</b> &nbsp; Consult for Africa &nbsp; / &nbsp; +234 913 813 8553 &nbsp; / "
        "&nbsp; hello@consultforafrica.com", bg=NAVY, fg=white))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "The fee is calculated on the package stated in your brief. Where 15% of it falls below the minimum "
        "for the role, the minimum applies. We bring an evidenced package benchmark to the scoping call, "
        "so the level is set against the market rather than against an assumption. Timelines are to offer "
        "and exclude the candidate's notice period. Not a binding offer, and not legal advice.",
        SMALL))

    doc.build(el)
    print("wrote %s" % OUT)


if __name__ == "__main__":
    build()
