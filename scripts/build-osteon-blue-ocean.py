"""
Build the Osteon / Dr Bola Akinola Blue Ocean strategy PDF for Consult For Africa.

Source narrative: docs/osteon-akinola-blue-ocean-strategy-cfa.md
Output:          docs/osteon-akinola-blue-ocean-strategy-cfa.pdf  (A4, branded, house navy style)

Run:
  python3 scripts/build-osteon-blue-ocean.py
"""

from __future__ import annotations

from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.utils import ImageReader
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
OUT = DOCS / "osteon-akinola-blue-ocean-strategy-cfa.pdf"

NAVY = HexColor("#0B3C5D")
DEEP_NAVY = HexColor("#081521")
GOLD = HexColor("#D4AF37")
TEAL = HexColor("#1F7A8C")
BODY = HexColor("#1F2937")
MUTED = HexColor("#6B7280")
SURFACE = HexColor("#F1F5F9")
LIGHT = HexColor("#C9D6E0")
OCEAN = HexColor("#0E5A6E")

PAGE_W, PAGE_H = A4
MARGIN = 46

ss = getSampleStyleSheet()


def style(name, **kw):
    base = dict(fontName="Helvetica", fontSize=10.5, leading=15.5, textColor=BODY,
                alignment=TA_LEFT, spaceAfter=7)
    base.update(kw)
    return ParagraphStyle(name, **base)


H1 = style("h1", fontName="Helvetica-Bold", fontSize=15, leading=19, textColor=NAVY,
           spaceBefore=14, spaceAfter=8)
H2 = style("h2", fontName="Helvetica-Bold", fontSize=11.5, leading=15, textColor=TEAL,
           spaceBefore=8, spaceAfter=4)
P = style("p")
LEDE = style("lede", fontSize=11, leading=16.5, textColor=HexColor("#374151"))
SMALL = style("small", fontSize=8.5, leading=12, textColor=MUTED)
CELL = style("cell", fontSize=9, leading=12.5)
CELL_B = style("cellb", fontSize=9, leading=12.5, fontName="Helvetica-Bold")
CELL_W = style("cellw", fontSize=9.5, leading=13, fontName="Helvetica-Bold", textColor=white)
ERRC_H = style("errch", fontSize=9.5, leading=13, fontName="Helvetica-Bold", textColor=NAVY)


def cover_bg(c, doc):
    c.saveState()
    c.setFillColor(NAVY)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.setFillColor(DEEP_NAVY)
    c.rect(0, 0, PAGE_W, 10, fill=1, stroke=0)
    c.rect(0, PAGE_H - 10, PAGE_W, 10, fill=1, stroke=0)
    x = MARGIN
    c.setFillColor(GOLD)
    c.rect(x, PAGE_H - 150, 40, 3, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(GOLD)
    c.drawString(x + 50, PAGE_H - 153, "CONSULT FOR AFRICA")
    c.setFillColor(LIGHT)
    c.setFont("Helvetica", 10)
    c.drawString(x + 50 + c.stringWidth("CONSULT FOR AFRICA", "Helvetica-Bold", 10) + 10,
                 PAGE_H - 153, "/  STRATEGY")
    c.setFillColor(GOLD)
    c.rect(x, 150, 60, 3, fill=1, stroke=0)
    c.setFillColor(LIGHT)
    c.setFont("Helvetica", 9)
    c.drawString(x, 128, "hello@consultforafrica.com   /   +234 913 813 8553   /   consultforafrica.com")
    c.drawString(x, 112, "Lagos and Abuja, Nigeria")
    c.restoreState()


def content_bg(c, doc):
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
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 23, "Dr Bola Akinola  /  The Blue Ocean Plan")
    c.setFillColor(GOLD)
    c.rect(MARGIN, 30, 24, 2, fill=1, stroke=0)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8)
    c.drawString(MARGIN, 18, "Confidential  /  Prepared for Dr Bolarinwa Akinola")
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


def build():
    doc = BaseDocTemplate(
        str(OUT), pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=52, bottomMargin=42,
        title="Dr Bola Akinola - The Blue Ocean Plan - Consult For Africa",
        author="Consult For Africa",
    )
    content_frame = Frame(MARGIN, 42, PAGE_W - 2 * MARGIN, PAGE_H - 52 - 42, id="content")
    cover_frame = Frame(MARGIN, 170, PAGE_W - 2 * MARGIN, PAGE_H - 330, id="cover")
    doc.addPageTemplates([
        PageTemplate(id="cover", frames=[cover_frame], onPage=cover_bg),
        PageTemplate(id="content", frames=[content_frame], onPage=content_bg),
    ])

    def card(text, bg=SURFACE, fg=BODY, bold=False):
        st = ParagraphStyle("c", parent=P, textColor=fg, leftIndent=8, rightIndent=8,
                            spaceBefore=4, spaceAfter=4,
                            fontName="Helvetica-Bold" if bold else "Helvetica")
        t = Table([[Paragraph(text, st)]], colWidths=[PAGE_W - 2 * MARGIN])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), bg),
            ("LINEBEFORE", (0, 0), (0, -1), 3, GOLD),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("LEFTPADDING", (0, 0), (-1, -1), 12),
            ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ]))
        return t

    def simple_table(data, widths):
        rows = []
        for i, r in enumerate(data):
            head = (i == 0)
            rows.append([Paragraph(str(cval), CELL_W if head else (CELL_B if j == 0 else CELL))
                         for j, cval in enumerate(r)])
        t = Table(rows, colWidths=widths)
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), NAVY),
            ("LINEBELOW", (0, 0), (-1, 0), 2, GOLD),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 9),
            ("RIGHTPADDING", (0, 0), (-1, -1), 9),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, SURFACE]),
        ]))
        return t

    def errc_grid(cells):
        # cells = [(title, colour, [lines])] x4 in order EL, RAISE, REDUCE, CREATE
        def quad(title, accent, lines):
            body = [Paragraph("<b>" + title + "</b>", ERRC_H)]
            for ln in lines:
                body.append(Paragraph("&#8226;&nbsp; " + ln, CELL))
            inner = Table([[b] for b in body], colWidths=[(PAGE_W - 2 * MARGIN) / 2 - 6])
            inner.setStyle(TableStyle([
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 2),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                ("BACKGROUND", (0, 0), (-1, -1), accent),
                ("LINEBEFORE", (0, 0), (0, -1), 3, GOLD),
            ]))
            return inner
        g = Table([
            [quad(*cells[0]), quad(*cells[1])],
            [quad(*cells[2]), quad(*cells[3])],
        ], colWidths=[(PAGE_W - 2 * MARGIN) / 2] * 2)
        g.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 3),
            ("RIGHTPADDING", (0, 0), (-1, -1), 3),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ]))
        return g

    def bullets(items):
        for b in items:
            el.append(Paragraph("&#8226;&nbsp;&nbsp;" + b, P))

    el = []

    # ---------------- COVER ----------------
    el.append(Spacer(1, 22))
    el.append(Paragraph("The Blue Ocean Plan",
                        ParagraphStyle("ct", fontName="Helvetica-Bold", fontSize=32,
                                       leading=36, textColor=white)))
    el.append(Spacer(1, 10))
    el.append(Paragraph("Making the competition irrelevant",
                        ParagraphStyle("cs", fontName="Helvetica-Bold", fontSize=15,
                                       leading=20, textColor=GOLD)))
    el.append(Spacer(1, 22))
    el.append(Paragraph(
        "A brand-revamp strategy for Dr Bola Akinola. Not a plan to out-spend the market leader "
        "on the things he already owns, but to change the game so that the terms he competes on "
        "stop being the terms that matter. Value innovation, unmet patient needs, and the large "
        "latent demand no competitor is serving.",
        ParagraphStyle("cp", fontName="Helvetica", fontSize=11, leading=17, textColor=LIGHT)))
    el.append(Spacer(1, 26))
    for line in [
        "Date:  23 July 2026",
        "For:  Dr Bolarinwa Akinola, FRCS (Tr. & Orth.)",
        "From:  Consult for Africa",
        "Status:  Standalone strategy for discussion",
    ]:
        el.append(Paragraph(line, ParagraphStyle("cm", fontName="Helvetica", fontSize=10.5,
                                                 leading=18, textColor=white)))
    el.append(NextPageTemplate("content"))
    el.append(PageBreak())

    # ---------------- IDEA ----------------
    el.append(Paragraph("The idea in one line", H1))
    el.append(card(
        "Do not try to out-Oni Oni. Change the game so the terms he competes on stop being the "
        "terms that matter.", bg=NAVY, fg=white, bold=True))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "The premium Lagos arthroplasty market is a small, crowded pool where everyone competes "
        "on the same few things: Western pedigree, a big procedure number, speed of recovery, "
        "robots, and a nice building. Dr Julius Oni currently wins that contest, and fighting "
        "him on it means out-spending him on what he already owns. That is a losing game.", P))
    el.append(Paragraph(
        "Blue Ocean Strategy says stop fighting for a share of existing demand and create new "
        "demand in uncontested space, through value innovation: raising the value patients "
        "actually receive while lowering the cost to deliver it, at the same time. Do that well "
        "and the competition becomes irrelevant, because you are no longer selling the same "
        "thing. Oni appears here as the clearest example of the old logic, not as the finish "
        "line.", P))

    # ---------------- 1 RED OCEAN ----------------
    el.append(Paragraph("1.  The red ocean: what everyone is fighting over", H1))
    el.append(Paragraph(
        "On a Strategy Canvas, every serious player traces almost the same curve, which is the "
        "definition of a red ocean.", P))
    el.append(simple_table([
        ["Factor of competition", "Industry norm", "Oni's position"],
        ["Western pedigree", "High, rising", "Very high (Johns Hopkins)"],
        ["Procedure-volume claim", "High", "Very high (4,000+, self-reported)"],
        ["Speed of recovery", "High", "Very high (24-hour promise)"],
        ["Technology / robotics", "Rising", "High"],
        ["Facility luxury", "High", "High"],
        ["Price (headline)", "High, opaque", "High, opaque"],
        ["Breadth of services", "Broad", "Broad (lists complex & revision)"],
    ], widths=[(PAGE_W - 2 * MARGIN) * 0.4, (PAGE_W - 2 * MARGIN) * 0.27,
               (PAGE_W - 2 * MARGIN) * 0.33]))
    el.append(Spacer(1, 6))
    el.append(Paragraph(
        "Two things matter. First, Oni already lists complex and revision surgery, so that "
        "category is not literally empty; Dr Bola wins it only by proving depth Oni asserts on "
        "paper. Second, and more important, notice what is absent from the entire canvas: "
        "<b>transparency, honesty, communication, recovery support, and access.</b> Nobody "
        "competes on these. That absence is the opportunity.", P))

    el.append(PageBreak())

    # ---------------- 2 DISCOVERY ----------------
    el.append(Paragraph("2.  What patients value is not what the industry sells", H1))
    el.append(Paragraph("The evidence on how patients choose a surgeon points at what nobody sells:", P))
    bullets([
        "<b>Manner and communication is the single highest-rated factor (4.7/5),</b> just above "
        "demonstrated quality (4.6). Cost and convenience rate lowest (3.5). Patients choose the "
        "surgeon who listens and is trusted, not the fanciest building.",
        "<b>Patients want transparency and cannot get it.</b> Around 96 percent believe "
        "surgeons' outcomes should be public, 95 percent their experience, 92 percent their case "
        "volume, and 80 to 95 percent want price transparency, yet only about 46 percent can "
        "find any data to compare surgeons. The largest unmet need in the market.",
        "<b>Fear drives hesitation:</b> fear of a poor outcome or revision, and fear of "
        "recovering alone. Remove those and you convert people currently doing nothing.",
        "<b>Word of mouth and the surgeon's personal brand dominate</b> the decision, far above "
        "hospital reputation and advertising. This validates leading with Dr Bola the person, "
        "and a referral engine over an ad budget.",
    ])
    el.append(card(
        "The market sells prestige, speed and robots. Patients want to be heard, told the truth, "
        "shown the evidence, supported through recovery, and able to afford it. The gap between "
        "those two lists is the blue ocean.", bg=SURFACE, bold=True))

    # ---------------- 3 ERRC ----------------
    el.append(Paragraph("3.  The ERRC grid: how Dr Bola breaks away", H1))
    el.append(Paragraph(
        "What to eliminate, reduce, raise and create to build a new value curve without simply "
        "spending more.", P))
    el.append(errc_grid([
        ("ELIMINATE", HexColor("#FBEAEA"), [
            "The pedigree arms race as the lead message. Let training be a quiet credential.",
            "Opaque, call-for-pricing cost.",
            "Hype and superlatives every rival already uses.",
        ]),
        ("RAISE", HexColor("#EAF3EC"), [
            "Radical transparency: published outcomes, case volumes, revision rates.",
            "Communication and dignity. The highest-rated value driver.",
            "Demonstrated depth in the hard cases, evidenced not asserted.",
        ]),
        ("REDUCE", HexColor("#FDF6E3"), [
            "Spend on facility luxury and robotics-as-marketing, which patients rate low.",
            "Reliance on paid advertising, which patients trust least.",
            "The discharge-at-the-theatre-door model.",
        ]),
        ("CREATE", HexColor("#EAF1F4"), [
            "Fixed, all-in, transparent package pricing. Nobody in Lagos offers it.",
            "A supported-recovery guarantee that removes the fear that stops people.",
            "Access and financing, and a before-you-fly second opinion.",
        ]),
    ]))
    el.append(Spacer(1, 6))
    el.append(Paragraph(
        "Every raise and create item is wanted by patients and offered by no competitor, and "
        "several eliminate and reduce items lower Dr Bola's cost base at the same time. That is "
        "value innovation, not a spending war.", P))

    el.append(PageBreak())

    # ---------------- 4 NEW CURVE ----------------
    el.append(Paragraph("4.  The new value curve", H1))
    el.append(Paragraph(
        "Dr Bola's canvas should look visibly different from everyone else's, not higher on the "
        "same shape. He dips low where the industry over-invests (pedigree-as-headline, facility "
        "luxury, robotics-as-marketing, advertising) and rises steeply where the industry is "
        "silent (transparency, communication, recovery support, demonstrated complex-case depth, "
        "fixed pricing, financing). A curve that diverges like that is the visual signature of a "
        "blue ocean, and it tells one coherent story: the honest, transparent, fully-supported "
        "way to have your joint replaced, at home, by the surgeon others trust with the hard "
        "cases.", P))

    # ---------------- 5 UTILITY MAP ----------------
    el.append(Paragraph("5.  The Buyer Utility Map: where the journey is blocked", H1))
    el.append(simple_table([
        ["Journey stage", "The block no one removes", "The blue-ocean move"],
        ["Awareness", "Is my pain even treatable here?", "Education; honest 'is it time?' screening"],
        ["Decision", "No way to compare or price; fear", "Radical transparency: outcomes & fixed price"],
        ["Choosing", "Distrust of local capability", "Demonstrated depth + before-you-fly opinion"],
        ["Surgery", "Fear of a bad outcome or infection", "Evidenced track record; revision reassurance"],
        ["Recovery", "I will manage this alone", "Supported-recovery programme with a navigator"],
        ["Aftercare", "Discharged and forgotten", "Structured long-term follow-up as standard"],
        ["Affordability", "Cost is a wall; no financing", "Instalment financing; diaspora payment"],
    ], widths=[(PAGE_W - 2 * MARGIN) * 0.18, (PAGE_W - 2 * MARGIN) * 0.42,
               (PAGE_W - 2 * MARGIN) * 0.40]))
    el.append(Spacer(1, 6))
    el.append(Paragraph(
        "The two heaviest blocks sit at the moment of decision: <b>opacity</b> (you cannot "
        "compare or price anything) and <b>fear</b> (of the outcome and of recovering alone). A "
        "strategy that removes those two does more for the practice than any amount of pedigree.", P))

    el.append(PageBreak())

    # ---------------- 6 NONCUSTOMERS ----------------
    el.append(Paragraph("6.  The real prize: the noncustomers", H1))
    el.append(Paragraph(
        "Stop fighting for Oni's existing patients, a small contested pool of already-converted "
        "self-payers, and unlock the far larger population not getting joint replacement at all. "
        "Three tiers, none of them targeted by any competitor.", P))
    el.append(simple_table([
        ["Tier", "Who they are", "How to unlock them"],
        ["1. Soon-to-be", "Arthritis sufferers managing on painkillers, not yet considering "
         "surgery. Huge in number.", "Education; an honest, accessible entry point; removal of fear"],
        ["2. Refusing", "Considered local surgery and said no from distrust, fear or cost. Fly "
         "abroad or suffer on.", "Transparency; recovery guarantee; financing; before-you-fly opinion"],
        ["3. Unexplored", "Never considered that a worn joint could be fixed, especially outside "
         "the affluent core.", "Community, GP, physio, employer and faith-network outreach"],
    ], widths=[(PAGE_W - 2 * MARGIN) * 0.16, (PAGE_W - 2 * MARGIN) * 0.46,
               (PAGE_W - 2 * MARGIN) * 0.38]))
    el.append(Spacer(1, 6))
    el.append(Paragraph(
        "This is where the growth is, and it is uncontested.", P))

    # ---------------- 7 MOVES ----------------
    el.append(Paragraph("7.  The value-innovation moves, ranked", H1))
    for t, d in [
        ("Move 1 (first): Radical transparency.",
         "Publish real outcomes, actual case volumes (revision and infection specifically), "
         "complication rates, and a clear fixed price. Low cost, wanted by ~96 percent of "
         "patients, offered by no one. Against genuine data, a rival's self-reported "
         "'4,000 procedures' looks like marketing, not evidence. Highest impact, high "
         "feasibility."),
        ("Move 2: The supported-recovery guarantee.",
         "Bundle structured aftercare, rehabilitation, a recovery navigator, and revision-risk "
         "reassurance into every replacement. Removes the biggest fear that stops people, and "
         "drives the word of mouth that actually grows the practice. High impact, high "
         "feasibility."),
        ("Move 3: Fixed-price bundles plus financing.",
         "One transparent all-in price per joint, paired with instalment financing (on the model "
         "Duchess runs with CarePay) and a clean diaspora payment route. Instalments raise "
         "elective volume 20 to 25 percent elsewhere, and fixed bundles can be more profitable "
         "per joint when episode costs are understood. High impact, medium feasibility."),
        ("Move 4: Before-you-fly second opinion, and the salvage safety net.",
         "An easy, low-cost second opinion for anyone weighing treatment abroad, plus being the "
         "place botched-abroad cases come home to. Catches Tier 2 at the decision and turns the "
         "outbound leak into inbound demand. Medium impact, high feasibility."),
    ]:
        el.append(Paragraph(t, H2))
        el.append(Paragraph(d, P))
    el.append(card(
        "<b>Sequence:</b>&nbsp; Moves 1 and 2 first (cheap, fast, differentiating), then Move 3 "
        "(build the finance partnership), with Move 4 running alongside from the start.",
        bg=SURFACE, bold=True))

    el.append(PageBreak())

    # ---------------- 8 PROOFS ----------------
    el.append(Paragraph("8.  It has been done: three proofs", H1))
    bullets([
        "<b>Shouldice Hospital (hernia).</b> By doing one operation only, it reached 0.8 percent "
        "recurrence versus roughly 10 percent elsewhere, 300,000 patients at 99 percent success, "
        "at about half the cost, in a warm un-clinical setting. Focus raises outcomes and lowers "
        "price at once. Lesson: narrow, deep focus on the hip and knee is a strength.",
        "<b>Narayana Health (India),</b> founded by a UK-trained surgeon, delivers open-heart "
        "surgery at under $2,000 versus $100,000-plus in the US at comparable outcomes, via high "
        "volume, task-shifting and cross-subsidy. Lesson: focus plus volume plus cross-subsidy "
        "expands access without lowering quality.",
        "<b>Aravind Eye Care (India)</b> actively creates demand through community camps and "
        "outreach rather than waiting for patients, and cross-subsidises the poor at identical "
        "surgical quality. Lesson: the Tier 3 play, going to find demand, is proven at scale.",
    ])
    el.append(Paragraph(
        "The through-line: none won by out-luxurising a rival. They won by focusing, being "
        "transparent about outcomes, expanding access, and creating demand. Exactly this plan.", P))

    # ---------------- 9 ACTION PLAN ----------------
    el.append(Paragraph("9.  The brand-revamp action plan", H1))
    el.append(Paragraph(
        "<b>Positioning.</b> Dr Bola (primary brand) as the honest, transparent, fully-supported "
        "way to have your joint replaced at home, by the surgeon others trust with the hardest "
        "cases. Osteon (secondary) as the place that delivers it. Complex-case authority is the "
        "credibility anchor; radical transparency is the proof; honest counsel is the voice; "
        "supported recovery and access are the felt difference.", P))
    el.append(Paragraph("Offer and packaging", H2))
    bullets([
        "A single, fixed, all-in, published package price per joint replacement.",
        "The supported-recovery programme included as standard in every package.",
        "A named second-opinion service, including before-you-fly.",
        "A defined complex-and-revision pathway for referred and salvage cases.",
    ])
    el.append(Paragraph("Financing and access", H2))
    bullets([
        "A lender partnership for instalment financing (study Duchess CarePay: ~40 percent "
        "deposit, 3 to 12 month terms, third-party lender).",
        "A clean diaspora payment route for children-abroad paying for parents.",
        "Later, a modest cross-subsidy so full-pay volume funds access for those who cannot pay "
        "(the Aravind and Narayana model), also a strong brand and PR asset.",
    ])
    el.append(Paragraph("Proof, digital and demand creation", H2))
    bullets([
        "Publish the outcomes and volumes; this is the centre of gravity of the digital presence.",
        "A referral and testimonial engine (see the referrer-engine playbook), because word of "
        "mouth is what patients act on.",
        "Patient-education content serving the Tier 1 and Tier 3 noncustomers and winning search "
        "on the terms Oni is weak on (revision, failed, infected, 'do I need a replacement').",
        "Screening and education through GPs, physios, employers and faith and community networks.",
    ])
    el.append(card(
        "<b>Sequencing.</b>&nbsp; Now: radical transparency and the recovery guarantee. Next: "
        "the finance partnership, diaspora payment, second-opinion service, referral and content "
        "engine. Then: community demand-creation, and consider the cross-subsidy access "
        "programme.", bg=HexColor("#EAF1F4")))

    el.append(PageBreak())

    # ---------------- 10 VALIDATE ----------------
    el.append(Paragraph("10.  What must be validated before we commit", H1))
    el.append(Paragraph(
        "The strategy is sound in shape, but two honest gaps need closing with local reality "
        "before large spend:", P))
    bullets([
        "<b>No Nigeria-specific patient-value data exists.</b> Every study behind Section 2 is US "
        "or Indian. Validate the transparency and recovery-support drivers with a small round of "
        "Lagos patient and referrer interviews before betting the brand on them.",
        "<b>Dr Bola's own numbers must support the transparency move.</b> Radical transparency "
        "only works if the outcomes and volumes are genuinely strong. Confirm his real "
        "revision and infection volumes and results before publishing anything. Transparency is "
        "a weapon only when the truth is good, and for a surgeon of his training it should be.",
    ])
    el.append(Paragraph(
        "Everything else, the fixed pricing, the recovery guarantee, the financing partnership "
        "and the second-opinion service, is buildable now and differentiating from day one.", P))
    el.append(Spacer(1, 6))
    el.append(Paragraph(
        "<b>Evidence note.</b> Patient-value findings are peer-reviewed US and Indian studies "
        "applied to Lagos by inference; competitor claims are Oni's own marketing, described as "
        "such; frameworks are the Kim and Mauborgne canon. Some transparency figures are from "
        "shoulder rather than hip and knee arthroplasty. Directional, and to be locally "
        "validated.", SMALL))
    el.append(Spacer(1, 10))
    el.append(card(
        "<b>Consult for Africa</b> &nbsp; Strategy<br/>"
        "hello@consultforafrica.com &nbsp; / &nbsp; +234 913 813 8553 &nbsp; / &nbsp; "
        "consultforafrica.com<br/>Lagos and Abuja, Nigeria",
        bg=NAVY, fg=white))

    doc.build(el)
    print(f"wrote {OUT}")


if __name__ == "__main__":
    build()
