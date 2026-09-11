"""
Build the HFN housemanship policy brief PDF.

Source narrative: docs/hfn-housemanship-policy-brief.md
Output:          docs/hfn-housemanship-policy-brief.pdf  (A4, multi-page)

Neutral, ministerial styling. No Consult for Africa branding: this is an HFN
document, prepared by Dr Debo Odulana as a member, for HFN leadership to review,
adopt, and place on HFN letterhead before transmission to the Minister.

Run:
  python3 scripts/build-hfn-housemanship-brief.py
"""

from __future__ import annotations

from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
OUT = DOCS / "hfn-housemanship-policy-brief.pdf"

# ---- neutral, institutional palette ----------------------------------------
INK = HexColor("#14261C")        # deep green-black, healthcare/institutional
GREEN = HexColor("#1B5E3A")      # HFN-neutral deep green (placeholder accent)
DEEP = HexColor("#0C1A12")
ACCENT = HexColor("#B8863B")     # muted gold rule
BODY = HexColor("#1F2937")
MUTED = HexColor("#6B7280")
SURFACE = HexColor("#F2F5F3")
LIGHT = HexColor("#CBD9CF")

PAGE_W, PAGE_H = A4
MARGIN = 48

ss = getSampleStyleSheet()


def style(name, **kw):
    base = dict(fontName="Helvetica", fontSize=10.5, leading=15.5, textColor=BODY,
                alignment=TA_LEFT, spaceAfter=7)
    base.update(kw)
    return ParagraphStyle(name, **base)


H1 = style("h1", fontName="Helvetica-Bold", fontSize=14.5, leading=18, textColor=GREEN,
           spaceBefore=15, spaceAfter=7)
H2 = style("h2", fontName="Helvetica-Bold", fontSize=11.5, leading=15, textColor=INK,
           spaceBefore=9, spaceAfter=3)
P = style("p")
LEDE = style("lede", fontSize=11, leading=16.5, textColor=HexColor("#374151"))
SMALL = style("small", fontSize=8.5, leading=12, textColor=MUTED)
CELL = style("cell", fontSize=9.5, leading=13)
CELL_B = style("cellb", fontSize=9.5, leading=13, fontName="Helvetica-Bold")
CELL_W = style("cellw", fontSize=9.5, leading=13, fontName="Helvetica-Bold", textColor=white)


def cover_bg(c, doc):
    c.saveState()
    c.setFillColor(GREEN)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.setFillColor(DEEP)
    c.rect(0, 0, PAGE_W, 10, fill=1, stroke=0)
    c.rect(0, PAGE_H - 10, PAGE_W, 10, fill=1, stroke=0)
    x = MARGIN
    c.setFillColor(ACCENT)
    c.rect(x, PAGE_H - 150, 40, 3, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(ACCENT)
    c.drawString(x + 50, PAGE_H - 153, "HEALTHCARE FEDERATION OF NIGERIA")
    c.setFillColor(LIGHT)
    c.setFont("Helvetica-Oblique", 8.5)
    c.drawString(x + 50, PAGE_H - 168, "[ Draft for adoption. Place on HFN letterhead before transmission. ]")
    c.setFillColor(ACCENT)
    c.rect(x, 150, 60, 3, fill=1, stroke=0)
    c.setFillColor(LIGHT)
    c.setFont("Helvetica", 9)
    c.drawString(x, 128, "Policy brief and recommendations")
    c.drawString(x, 112, "For the Honourable Minister of State for Health and Social Welfare")
    c.restoreState()


def content_bg(c, doc):
    c.saveState()
    c.setFillColor(GREEN)
    c.rect(0, PAGE_H - 34, PAGE_W, 34, fill=1, stroke=0)
    c.setFillColor(ACCENT)
    c.rect(0, PAGE_H - 37, PAGE_W, 3, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(MARGIN, PAGE_H - 23, "HEALTHCARE FEDERATION OF NIGERIA")
    c.setFillColor(LIGHT)
    c.setFont("Helvetica", 8.5)
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 23, "Unlocking the House Officer Bottleneck")
    c.setFillColor(ACCENT)
    c.rect(MARGIN, 30, 24, 2, fill=1, stroke=0)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8)
    c.drawString(MARGIN, 18, "Draft for HFN leadership review and adoption")
    c.drawRightString(PAGE_W - MARGIN, 18, "Page %d" % doc.page)
    c.restoreState()


def build():
    doc = BaseDocTemplate(
        str(OUT), pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=52, bottomMargin=42,
        title="Unlocking the House Officer Bottleneck - HFN Policy Brief",
        author="Healthcare Federation of Nigeria",
    )
    content_frame = Frame(MARGIN, 42, PAGE_W - 2 * MARGIN, PAGE_H - 52 - 42, id="content")
    cover_frame = Frame(MARGIN, 170, PAGE_W - 2 * MARGIN, PAGE_H - 330, id="cover")
    doc.addPageTemplates([
        PageTemplate(id="cover", frames=[cover_frame], onPage=cover_bg),
        PageTemplate(id="content", frames=[content_frame], onPage=content_bg),
    ])

    def card(text, bg=SURFACE, fg=BODY, bold=False, accent=ACCENT):
        st = ParagraphStyle("c", parent=P, textColor=fg, leftIndent=8, rightIndent=8,
                            spaceBefore=4, spaceAfter=4,
                            fontName="Helvetica-Bold" if bold else "Helvetica")
        t = Table([[Paragraph(text, st)]], colWidths=[PAGE_W - 2 * MARGIN])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), bg),
            ("LINEBEFORE", (0, 0), (0, -1), 3, accent),
            ("TOPPADDING", (0, 0), (-1, -1), 9),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
            ("LEFTPADDING", (0, 0), (-1, -1), 12),
            ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ]))
        return t

    def bullets(items):
        for b in items:
            el.append(Paragraph("&bull;&nbsp;&nbsp;" + b, P))

    el = []

    # ---------------- COVER ----------------
    el.append(Spacer(1, 30))
    el.append(Paragraph("Unlocking the House Officer Bottleneck",
                        ParagraphStyle("ct", fontName="Helvetica-Bold", fontSize=27,
                                       leading=32, textColor=white)))
    el.append(Spacer(1, 12))
    el.append(Paragraph("Letting the doctors Nigeria has already trained start work",
                        ParagraphStyle("cs", fontName="Helvetica-Bold", fontSize=14,
                                       leading=19, textColor=ACCENT)))
    el.append(Spacer(1, 26))
    el.append(Paragraph(
        "Roughly 2,000 fully qualified doctors are stranded each year because the "
        "housemanship system has room for only 4,000 of the 6,000 who graduate. This "
        "brief sets out four connected reforms to clear that bottleneck without training "
        "a single additional doctor.",
        ParagraphStyle("cp", fontName="Helvetica", fontSize=11, leading=17, textColor=LIGHT)))
    el.append(Spacer(1, 28))
    for line in [
        "For:  Prof Iziaq Adekunle Salako, Honourable Minister of State for Health and Social Welfare",
        "Prepared for the Healthcare Federation of Nigeria by:  Dr Debo Odulana, member, HFN",
        "Date:  July 2026",
    ]:
        el.append(Paragraph(line, ParagraphStyle("cm", fontName="Helvetica", fontSize=10,
                                                 leading=17, textColor=white)))
    el.append(NextPageTemplate("content"))
    el.append(PageBreak())

    # ---------------- ADDRESS BLOCK ----------------
    el.append(card(
        "<b>For the attention of:</b>&nbsp; Professor Iziaq Adekunle Salako, Honourable Minister "
        "of State for Health and Social Welfare, Federal Republic of Nigeria<br/>"
        "<b>Copied to:</b>&nbsp; The Coordinating Minister of Health and Social Welfare; the "
        "Registrar, Medical and Dental Council of Nigeria<br/>"
        "<b>From:</b>&nbsp; The Healthcare Federation of Nigeria", bg=SURFACE))
    el.append(Spacer(1, 6))

    # ---------------- EXEC SUMMARY ----------------
    el.append(Paragraph("Executive summary", H1))
    el.append(Paragraph(
        "Nigeria is training more doctors than at any point in its history, and at the same "
        "time turning thousands of them away at the very first step of their careers. Roughly "
        "6,000 doctors qualify each year, but the centralised housemanship system has room for "
        "only about 4,000. Around 2,000 fully qualified graduates are therefore left stranded "
        "every year, unable to begin the one year of supervised internship that stands between "
        "graduation and full registration. Many wait six to twelve months. Some are asked for "
        "bribes and other improper fees to secure a place.", LEDE))
    el.append(Paragraph(
        "The bribery and the frustration with the recent centralisation of placement are real, "
        "but they are symptoms. The underlying problem is structural, and it has four distinct "
        "parts: the pool of accredited training capacity is too small and too narrowly defined; "
        "graduate numbers are rising by deliberate government policy against that frozen pool; "
        "the funding of the intern post is fragile and does not follow the graduate; and the "
        "allocation mechanism is centralised, opaque, and easy to game. Left unaddressed, the "
        "gap will widen sharply, because the expansion of medical school intake now underway "
        "will push annual output well above 6,000 while internship capacity stays where it is.", P))
    el.append(Paragraph(
        "The Medical and Dental Council of Nigeria has itself told the National Assembly that "
        "the answer is to bring state and private hospitals into the system. The Healthcare "
        "Federation of Nigeria agrees, and goes further. This brief sets out four connected "
        "reforms, each targeted at one of the four root causes, that together would clear the "
        "backlog, protect training quality, and turn a bottleneck into an on-ramp for the "
        "workforce Nigeria is investing so heavily to create.", P))

    # ---------------- 1 ----------------
    el.append(Paragraph("1.  The problem, stated plainly", H1))
    el.append(Paragraph(
        "A Nigerian medical graduate cannot practise, cannot be fully registered, and in most "
        "cases cannot proceed to residency or leave for national service until completing a "
        "twelve-month housemanship: three months each, uninterrupted, in Internal Medicine, "
        "Surgery, Obstetrics and Gynaecology, and Paediatrics, under consultant supervision in "
        "an accredited hospital. That single requirement has become the tightest chokepoint in "
        "the entire medical workforce pipeline.", P))
    bullets([
        "About <b>6,000 doctors qualify each year</b>; the centralised housemanship system has "
        "capacity for about <b>4,000</b>. Roughly <b>2,000 graduates are stranded annually</b>. "
        "These are the Council's own figures, presented by the MDCN Registrar to the Senate "
        "Committee on Health.",
        "The stranded graduates are not failing candidates. They have passed every examination "
        "and met every academic requirement. They are simply told there is no room.",
        "Waiting times of <b>six to twelve months</b> are now common, and competition for the "
        "limited slots has created space for <b>unofficial payments and other improper fees</b>. "
        "Graduates have publicly reported being asked for sums such as <b>N400,000</b> to secure a "
        "place, and describe sought-after centres where about 30 slots draw over 300 applicants. "
        "These pressures fall hardest on graduates from families least able to pay.",
    ])
    el.append(Paragraph(
        "The human cost is a cohort of young, fully qualified doctors kept idle at the exact "
        "moment the country needs them most, and at the exact moment they are deciding whether "
        "their future is in Nigeria or abroad.", P))

    # ---------------- 2 ----------------
    el.append(Paragraph("2.  Why this matters now more than ever", H1))
    el.append(Paragraph(
        "<b>First, the pipeline is being deliberately widened at the top.</b> As part of the "
        "Government's own workforce strategy, admission quotas for medical training have risen "
        "by around 38 per cent since 2023, the number of medical schools has grown, and roughly "
        "twenty more are in the accreditation pipeline. New intakes are reported to have risen "
        "by about 160 per cent between 2023 and the end of 2025. This is the right ambition. But "
        "every one of those additional students becomes a graduate who needs a housemanship "
        "place. If internship capacity stays frozen at 4,000 while output climbs toward 8,000 "
        "and beyond, the number stranded each year does not creep up, it multiplies.", P))
    el.append(Paragraph(
        "<b>Second, the bottleneck feeds the very emigration the Government is fighting.</b> More "
        "than 8,500 Nigerian doctors joined the United Kingdom register between 2021 and 2024 "
        "alone, and by some measures around half of Nigerian-trained doctors now practise "
        "abroad. A graduate forced to sit idle for a year, hustling for a placement and "
        "sometimes asked to pay for it, receives a powerful early signal that the system does "
        "not value them. Many act on it. Each departure also writes off a public training "
        "investment estimated in the tens of thousands of dollars per doctor. The housemanship "
        "bottleneck is not separate from the japa crisis; it is one of its first and most "
        "avoidable causes.", P))
    el.append(card(
        "Clearing the housemanship bottleneck does not require training a single additional "
        "doctor. It requires letting the doctors we have already trained start work. Few reforms "
        "in the health sector offer so much return for so little cost.", bg=SURFACE, bold=True))

    # ---------------- 3 diagnosis ----------------
    el.append(PageBreak())
    el.append(Paragraph("3.  Root-cause diagnosis", H1))
    el.append(Paragraph(
        "The symptoms, bribery, delay, and the friction of centralised posting, all trace back "
        "to four distinct and addressable causes. They are set out separately below because "
        "each needs its own remedy, and together they account for the whole problem.", P))

    el.append(Paragraph("Cause 1:  Accredited capacity is too small and too narrowly defined", H2))
    el.append(Paragraph(
        "The training pool is dominated by federal institutions. Of the 114 hospitals accredited "
        "for housemanship, 47 are teaching hospitals, 21 are Federal Medical Centres, 37 are "
        "general and specialist hospitals that are mostly state-owned and military, and just 9 "
        "are private. Only 44, all of them federal, sit on the centralised posting portal; the "
        "other 70 are left outside it entirely, and between them the 44 federal centres advertise "
        "only about 2,783 medical housemanship places in a posting cycle. Two design choices keep "
        "the private and state pool small:", P))
    bullets([
        "<b>The accreditation criteria for private hospitals are disproportionately "
        "restrictive.</b> Requirements around infrastructure, resident accommodation, and "
        "departmental scope are set at a level that many capable, high-volume private hospitals "
        "cannot meet, even where the clinical training they could offer is excellent. The bar "
        "screens out good trainers rather than bad ones.",
        "<b>The slots allocated to those private hospitals that do qualify are too few.</b> Even "
        "an accredited private hospital is typically granted a small quota, far below the number "
        "of house officers it could competently supervise. The pool is both shallow and "
        "under-used.",
    ])
    el.append(Paragraph(
        "A related rule compounds the problem: accreditation generally expects a single hospital "
        "to provide all four core postings under one roof. Many otherwise strong hospitals have "
        "real depth in two or three of the four disciplines but not all four, and are therefore "
        "excluded entirely.", P))

    el.append(Paragraph("Cause 2:  Graduate demand is rising by policy while capacity stays fixed", H2))
    el.append(Paragraph(
        "The Government is expanding medical school intake as a matter of deliberate strategy. "
        "There is currently no mechanism that requires internship capacity to expand in step "
        "with graduate output. Capacity planning for training posts is not tied to the number of "
        "doctors the system is about to produce. The two numbers are managed by different "
        "processes and are drifting apart.", P))

    el.append(Paragraph("Cause 3:  The funding of the intern post is fragile and non-portable", H2))
    el.append(Paragraph(
        "House officers are paid on the first grade of the Consolidated Medical Salary "
        "Structure, funded through the federal payroll for federal centres. In practice this "
        "funding is unreliable and non-portable:", P))
    bullets([
        "Intern salary lines are frequently not captured cleanly in institutional annual "
        "budgets, so hospitals decline to take house officers even where the clinical need is "
        "obvious.",
        "Where posts are funded, payment is often delayed; house officers have publicly reported "
        "months of unpaid salaries.",
        "Because the money is attached to specific federal institutions rather than to the "
        "graduate, a willing state or private hospital that could train an intern has no funding "
        "stream to do so.",
    ])

    el.append(Paragraph("Cause 4:  Allocation is centralised, opaque, and easy to game", H2))
    el.append(Paragraph(
        "The centralised posting system was introduced to bring order and fairness to placement. "
        "In practice, applied to a supply that is far too small, it has rationed scarcity rather "
        "than expanded access. Vacancies and quotas are not transparently published in real "
        "time, state hospitals sit largely outside the portal, and graduates compete blind for a "
        "shrinking set of preferred slots. The transparently contestable pool is narrower still "
        "than the headline numbers suggest, because even within the federal centres a large share "
        "of places is reserved for discretionary allocation by hospital managers. Teaching "
        "hospitals commonly route only around 40 per cent of their places to the open portal, "
        "reserving the rest for the Chief Medical Director, the Provost, and internal use. That "
        "discretionary space is precisely where graduates report slots being sold. Opacity plus "
        "scarcity is the condition in which unofficial payments flourish. Centralising the "
        "allocation of an inadequate supply did not create the shortage, but it concentrated and "
        "exposed it, and made rent-seeking easier.", P))

    # ---------------- MECE table ----------------
    el.append(Paragraph("The four causes and their remedies, at a glance", H2))
    mece = [
        ["Root cause", "Remedy"],
        ["1.  Accredited supply too small and too narrow "
         "(private bar too high, slots too few, single-roof rule)",
         "Broaden supply safely: proportionate criteria, rotational consortium accreditation, "
         "larger private and state quotas, national quality standard"],
        ["2.  Graduate demand rising by policy against a frozen pool",
         "Plan internship capacity to the graduate pipeline"],
        ["3.  Intern funding fragile and non-portable",
         "Ring-fence a portable house-officer stipend that follows the graduate"],
        ["4.  Allocation centralised, opaque, gameable (bribes, delay)",
         "Transparent, rules-based matching with anti-corruption safeguards"],
    ]
    mrows = [[Paragraph(cc, CELL_W if i == 0 else (CELL_B if j == 0 else CELL))
              for j, cc in enumerate(r)] for i, r in enumerate(mece)]
    mt = Table(mrows, colWidths=[(PAGE_W - 2 * MARGIN) * 0.46, (PAGE_W - 2 * MARGIN) * 0.54])
    mt.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), GREEN),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, SURFACE]),
        ("LINEBELOW", (0, 0), (-1, 0), 2, ACCENT),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
    ]))
    el.append(mt)

    # ---------------- 4 recommendations ----------------
    el.append(PageBreak())
    el.append(Paragraph("4.  Recommendations", H1))
    el.append(Paragraph(
        "The four reforms below map directly onto the four causes. Each can begin within the "
        "current budget cycle. Together they are designed to be comprehensive: fix all four and "
        "the bottleneck clears; fix only some and the pressure simply moves.", P))

    el.append(Paragraph("Recommendation 1:  Broaden accredited supply, safely  (targets Cause 1)", H2))
    bullets([
        "<b>Right-size the accreditation criteria.</b> Move to proportionate, competency- and "
        "outcome-based standards focused on what protects trainees: adequate patient volume and "
        "case mix, consultant supervision, structured teaching, and record-keeping. Relax "
        "requirements that exclude capable hospitals without improving training, and review the "
        "private-hospital criteria specifically against this test.",
        "<b>Adopt a rotational, consortium model of accreditation.</b> Where no single hospital "
        "offers all four core disciplines to standard, allow two or three hospitals with "
        "complementary strengths to be accredited together as a training network, with house "
        "officers rotating between them under a lead coordinating institution. Housemanship does "
        "not have to happen under one roof.",
        "<b>Raise the slot quotas</b> of accredited private and state hospitals to match their "
        "genuine supervisory capacity, and bring all accredited state hospitals onto the portal.",
        "<b>Guarantee quality with a national standard.</b> Introduce a national housemanship "
        "curriculum, a structured logbook, and an end-of-internship competency assessment, so a "
        "house officer trained in a private or state hospital, or across a consortium, meets the "
        "same standard as one trained in a federal teaching hospital. This standard is what "
        "makes expansion defensible.",
    ])

    el.append(Paragraph("Recommendation 2:  Plan internship capacity to the graduate pipeline  (targets Cause 2)", H2))
    bullets([
        "Establish a simple, published, rolling reconciliation between projected annual graduate "
        "output and accredited housemanship capacity, reviewed each year by MDCN and the "
        "Ministry together.",
        "Make the approval of new medical schools and intake increases conditional on a credible "
        "plan for the additional internship capacity those graduates will need, so the top and "
        "bottom of the pipeline expand together.",
    ])

    el.append(Paragraph("Recommendation 3:  Ring-fence and make house-officer funding portable  (targets Cause 3)", H2))
    bullets([
        "Create a dedicated, ring-fenced federal funding line for house-officer stipends that "
        "<b>follows the graduate to any accredited centre, public or private</b>, rather than "
        "being tied to specific federal institutions. Funding should enable training wherever "
        "capacity exists, not confine it to where the payroll happens to sit.",
        "Guarantee timely payment under the existing salary structure, and remove the "
        "budget-capture barrier that currently lets willing hospitals decline interns for want "
        "of a line item.",
    ])

    el.append(Paragraph("Recommendation 4:  Make allocation transparent, rules-based, and clean  (targets Cause 4)", H2))
    bullets([
        "Publish accredited centres, their quotas, and live vacancies in real time on the "
        "portal, so every graduate can see what is available.",
        "Run allocation on transparent, rules-based, automated matching, with a published "
        "appeals and grievance channel.",
        "Pair this with a clear anti-corruption safeguard and reporting route, so any demand for "
        "payment to secure a placement can be reported and acted on. Transparency is the "
        "cheapest and fastest cure for the bribery the current scarcity invites.",
    ])

    # ---------------- 5 open door ----------------
    el.append(Paragraph("5.  A proven direction, and an open door", H1))
    el.append(Paragraph(
        "None of this is speculative. The Nursing and Midwifery Council of Nigeria, facing the "
        "same shortage of internship sites for its own graduates, has moved to accredit a wider "
        "range of hospitals, including in the private sector, as clinical training sites. The "
        "medical profession can follow the same logic.", P))
    el.append(Paragraph(
        "More importantly, the MDCN has already told the National Assembly that the solution is "
        "to include state and privately owned hospitals in the housemanship system. The "
        "regulator, the profession, and the private sector are in agreement on the direction. "
        "What is needed now is the political sponsorship to turn that agreement into "
        "accreditation reform, a funding mechanism, and a transparent portal, on a defined "
        "timeline.", P))

    # ---------------- 6 the ask ----------------
    el.append(Paragraph("6.  The ask, and the Federation's offer", H1))
    el.append(Paragraph(
        "The Healthcare Federation of Nigeria respectfully asks the Honourable Minister of State "
        "to:", P))
    bullets([
        "<b>Sponsor a review of housemanship accreditation</b> to introduce proportionate, "
        "competency-based criteria and a rotational, consortium model, and to expand private and "
        "state hospital participation and quotas.",
        "<b>Commission a national housemanship curriculum and end-of-internship competency "
        "assessment</b> to guarantee quality as capacity broadens.",
        "<b>Direct the creation of a ring-fenced, portable house-officer funding line</b> so that "
        "funding follows the graduate to any accredited centre.",
        "<b>Mandate a transparent, real-time, rules-based allocation portal</b> with "
        "anti-corruption safeguards.",
        "<b>Convene a time-bound implementation task team</b> drawing together the Ministry, "
        "MDCN, and the private sector, with quarterly capacity targets reconciled against "
        "graduate output.",
    ])
    el.append(Paragraph(
        "The Federation offers more than a request. Its members operate a substantial share of "
        "Nigeria's accreditable private hospital capacity, and are willing to help design the "
        "rotational model, pilot it, and open their institutions as training sites. The "
        "Federation can also help mobilise senior supervisory capacity, including from Nigerian "
        "medical networks at home and in the diaspora, to meet the consultant-supervision "
        "standards that quality training requires. We are ready to sit down with the relevant "
        "offices and work through the detail carefully.", P))

    el.append(Spacer(1, 10))
    el.append(card(
        "Prepared for the Healthcare Federation of Nigeria by Dr Debo Odulana, a member of the "
        "Federation who also serves as President of the Doctors Foundation for Care. Submitted "
        "for the review and adoption of HFN leadership ahead of transmission.",
        bg=HexColor("#EAF1EC")))

    # ---------------- annex ----------------
    el.append(PageBreak())
    el.append(Paragraph("Annex:  figures and sources for verification", H1))
    el.append(Paragraph(
        "The following figures are drawn from public reporting and official statements, and are "
        "provided so that HFN leadership can verify each before transmission.", P))
    bullets([
        "6,000 graduates per year; 4,000 system capacity; about 2,000 stranded annually: MDCN "
        "Registrar, Dr Fatima Kyari, presentation to the Senate Committee on Health, reported "
        "February 2026 (ThisDay, New Dawn, Daily Trust).",
        "114 accredited housemanship hospitals (47 teaching, 21 Federal Medical Centres, 37 "
        "general and specialist that are mostly state-owned and military, 9 private); only 44, "
        "all federal, on the centralised portal, the other 70 outside it; about 2,783 medical and "
        "211 dental places advertised across the 44 portal centres: MDCN Registrar, Dr Fatima "
        "Kyari, quoted in Punch and Punch Healthwise reporting. Directly attributable to MDCN.",
        "Reports of graduates asked for sums such as N400,000 to secure a place, sought-after "
        "centres with about 30 slots against 300-plus applicants, and teaching hospitals routing "
        "only about 40 per cent of places to the open portal: named-graduate accounts in Punch "
        "and Punch Healthwise reporting.",
        "Core postings of 12 weeks each in Medicine, Surgery, Obstetrics and Gynaecology, and "
        "Paediatrics: MDCN housemanship guidance.",
        "Medical school intake up about 38 per cent since 2023, new schools added, about 20 in "
        "the accreditation pipeline; new intakes up about 160 per cent 2023 to end 2025: Federal "
        "Ministry of Health statements, 2024 to 2025.",
        "More than 8,500 Nigerian doctors joined the UK register 2021 to 2024; an estimated "
        "16,000 doctors lost to emigration over five years against roughly 55,000 licensed; about "
        "half of Nigerian-trained doctors practise abroad: General Medical Council data, Punch "
        "reporting, and related analyses.",
        "Cost of training a doctor in Nigeria estimated in the tens of thousands of dollars: Mo "
        "Ibrahim Foundation analysis.",
        "National Policy on Health Workforce Migration approved by the Federal Executive Council, "
        "August 2024; Nigeria Health Sector Renewal Investment Initiative: Federal Ministry of "
        "Health.",
        "Nursing and Midwifery Council of Nigeria broadening accredited clinical training sites: "
        "NMCN and WHO Africa reporting.",
    ])

    doc.build(el)
    print(f"wrote {OUT}")


if __name__ == "__main__":
    build()
