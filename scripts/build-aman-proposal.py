"""
Build the Aman Health (Lagos provider network) proposal PDF for Consult For Africa.

Source narrative: docs/aman-hmo-proposal-cfa.md
Output:          docs/aman-hmo-proposal-cfa.pdf  (A4, multi-page, branded, house navy style)

Run:
  python3 scripts/build-aman-proposal.py
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
OUT = DOCS / "aman-hmo-proposal-cfa.pdf"

# ---- brand palette (source: docs/brand-guide-cfa.pdf) ----------------------
NAVY = HexColor("#0B3C5D")
DEEP_NAVY = HexColor("#081521")
GOLD = HexColor("#D4AF37")
TEAL = HexColor("#1F7A8C")
BODY = HexColor("#1F2937")
MUTED = HexColor("#6B7280")
SURFACE = HexColor("#F1F5F9")
LIGHT = HexColor("#C9D6E0")

PAGE_W, PAGE_H = A4
MARGIN = 46

# ---------------------------------------------------------------- styles -----
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
CELL = style("cell", fontSize=9.5, leading=13)
CELL_B = style("cellb", fontSize=9.5, leading=13, fontName="Helvetica-Bold")
CELL_W = style("cellw", fontSize=9.5, leading=13, fontName="Helvetica-Bold", textColor=white)


# ----------------------------------------------------------- page furniture --
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
                 PAGE_H - 153, "/  BUSINESS DEVELOPMENT & GROWTH")
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
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 23, "Aman Health  /  Lagos Provider Network Proposal")
    c.setFillColor(GOLD)
    c.rect(MARGIN, 30, 24, 2, fill=1, stroke=0)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8)
    c.drawString(MARGIN, 18, "Confidential  /  Prepared for Aman Health")
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
        title="Aman Health - Lagos Provider Network Proposal - Consult For Africa",
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

    def simple_table(data, widths, foot=False):
        rows = []
        n = len(data)
        for i, r in enumerate(data):
            head = (i == 0)
            last = foot and (i == n - 1)
            rows.append([Paragraph(str(cval), CELL_W if head else (CELL_B if (last or j == 0) else CELL))
                         for j, cval in enumerate(r)])
        t = Table(rows, colWidths=widths)
        stylecmds = [
            ("BACKGROUND", (0, 0), (-1, 0), NAVY),
            ("LINEBELOW", (0, 0), (-1, 0), 2, GOLD),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 7),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ("LEFTPADDING", (0, 0), (-1, -1), 9),
            ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ]
        if foot:
            stylecmds += [
                ("BACKGROUND", (0, -1), (-1, -1), HexColor("#FBF6E6")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -2), [white, SURFACE]),
                ("LINEABOVE", (0, -1), (-1, -1), 1.5, GOLD),
            ]
        else:
            stylecmds += [("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, SURFACE])]
        t.setStyle(TableStyle(stylecmds))
        return t

    el = []

    # ---------------- COVER ----------------
    el.append(Spacer(1, 30))
    el.append(Paragraph("A Sharper Path to 300",
                        ParagraphStyle("ct", fontName="Helvetica-Bold", fontSize=30,
                                       leading=34, textColor=white)))
    el.append(Spacer(1, 10))
    el.append(Paragraph("Building Aman's Lagos provider network",
                        ParagraphStyle("cs", fontName="Helvetica-Bold", fontSize=15,
                                       leading=20, textColor=GOLD)))
    el.append(Spacer(1, 24))
    el.append(Paragraph(
        "The right network, not just a bigger one. Grown from your own member and "
        "branch data, led through your affinity network, and won with the promise you "
        "already make: zero rejected eligible claims.",
        ParagraphStyle("cp", fontName="Helvetica", fontSize=11.5, leading=18, textColor=LIGHT)))
    el.append(Spacer(1, 28))
    for line in [
        "Date:  10 July 2026",
        "For:  Abubakar Hassan, Chief Executive Officer, Aman Health",
        "From:  Consult for Africa",
    ]:
        el.append(Paragraph(line, ParagraphStyle("cm", fontName="Helvetica", fontSize=10.5,
                                                 leading=18, textColor=white)))
    el.append(NextPageTemplate("content"))
    el.append(PageBreak())

    # ---------------- 1 ----------------
    el.append(Paragraph("1.  Why we are writing", H1))
    el.append(Paragraph(
        "Thank you for sharing the Lagos brief. We have studied it closely, and we have "
        "studied Aman: the integrated model across Aman HMO, Aman Family Clinics, and MedPay; "
        "the Takaful foundation; the technology-first infrastructure; and the promise at the "
        "centre of your brand, zero rejected eligible claims.", LEDE))
    el.append(Paragraph(
        "We think that promise, more than any campaign, is the key to the provider problem. "
        "This note sets out how we would help Aman reach the Lagos network you need, why we "
        "believe our approach converts materially better than the current effort, and how we "
        "would like to begin. We have kept it short on purpose. The detailed model is the "
        "work itself.", P))

    # ---------------- 2 ----------------
    el.append(Paragraph("2.  The one idea worth leading with", H1))
    el.append(card(
        "Aman does not have a 300-provider problem. It has a coverage-and-conversion problem. "
        "Solve those, and the number takes care of itself, with far less spend and far better "
        "retention.", bg=SURFACE, bold=True))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "“Onboard 300 providers” is a volume target, and email blasts and roaming "
        "field agents are built for volume. But volume is not the constraint. The constraint "
        "is signing the right providers, where your members actually are, using the right "
        "reason for a provider to say yes. Both of those are things Aman already has the raw "
        "material for and is not yet using.", P))

    # ---------------- 3 ----------------
    el.append(Paragraph("3.  What we see in your current approach", H1))
    el.append(Paragraph(
        "The brief is honest that conversion is low across email, callbacks, and field agents. "
        "We would respectfully add why, because the reasons point straight at the fix.", P))
    for t, d in [
        ("It is national when the problem is local.",
         "A nationwide email to 3,000 providers spreads effort across the whole country to "
         "solve a Lagos coverage gap. Many of those providers sit nowhere near an Aman member, "
         "so even a “yes” adds cost without adding coverage."),
        ("It leads with awareness when the barrier is trust and economics.",
         "Lagos providers are not short of HMO invitations. They decline over low tariffs, "
         "delayed payment, and above all denied and reduced claims. An email cannot move any "
         "of those. It does not carry the one thing that would: your zero rejected eligible "
         "claims commitment, delivered by someone the provider trusts."),
        ("It does not use Aman's two real advantages.",
         "Your existing client book and your Islamic-affinity network are assets a generic HMO "
         "does not have. Neither is expressed in a mass email or a cold visit."),
    ]:
        el.append(Paragraph(t, H2))
        el.append(Paragraph(d, P))
    el.append(Paragraph(
        "None of this is a criticism of effort. It is a case for pointing the same energy at "
        "a much smaller, much better target.", P))

    # ---------------- 4 ----------------
    el.append(Paragraph("4.  A sharper approach, in three moves", H1))
    el.append(Paragraph(
        "We would rebuild the effort around three moves. This is the shape of it; the engine "
        "that produces it is the engagement.", P))
    for t, d in [
        ("1.  Grow the network out of your own data, not a provider list.",
         "Your initial Lagos members will largely be existing accounts with Lagos branches, so "
         "you already know where demand is. We geocode your members and every Lagos office of "
         "your corporate accounts, overlay network-adequacy standards, and find the exact gaps. "
         "The target list is then generated from that map, ranked and named, so every approach "
         "opens with a fact the provider cannot ignore: a specific, countable number of Aman "
         "members are next to them today."),
        ("2.  Lead distribution through your affinity network, not cold outreach.",
         "As a Takaful HMO with strong links to Islamic-led organisations, Aman has warm routes "
         "email cannot enter: large Lagos-rooted Muslim organisations, Islamic-finance "
         "employers, faith-aligned hospitals and clinics, and Muslim medical networks. In this "
         "market, trust is carried by warm, faith-fluent introductions. A provider who ignores "
         "an email will take a meeting arranged through a shared institution. This is your most "
         "defensible edge, and it is currently unused."),
        ("3.  Recruit providers with the promise you already make.",
         "Turn zero rejected eligible claims and prompt, predictable payment into a "
         "provider-facing proposition, backed operationally so it is credible. This attacks the "
         "number-one reason providers decline HMOs. Paired with guaranteed nearby volume from "
         "move one, it is a far stronger opening than any benefits-package pitch."),
    ]:
        el.append(Paragraph(t, H2))
        el.append(Paragraph(d, P))
    el.append(card(
        "<b>A note on your own clinics.</b>&nbsp; Aman Family Clinics are part of the model, so "
        "the network is not a buy-everything exercise. As your own primary-care clinics come "
        "on stream, the external network should complement them rather than duplicate them: we "
        "prioritise the higher tiers your clinics will not cover, secondary, inpatient, and "
        "specialist, and the areas a clinic will not reach soon. Sequencing the provider map "
        "against your clinic rollout during mobilisation removes a large share of low-value "
        "signatures from the target and focuses spend where it changes coverage.",
        bg=HexColor("#EAF1F4")))

    el.append(PageBreak())

    # ---------------- 5 clinician unlock ----------------
    el.append(Paragraph("5.  A richer network, seeded by clinicians", H1))
    el.append(Paragraph(
        "The fastest way to build coverage, and the one thing no other partner can bring you, "
        "is to engage the clinicians directly. Consult for Africa operates CadreHealth, a "
        "workforce platform with more than 10,000 clinicians. From it we can curate an initial "
        "cohort of around 500 Lagos-based specialists for direct partnership with Aman, and "
        "start there.", LEDE))
    el.append(Paragraph("Why lead with the specialists", H2))
    for b in [
        "<b>Warm and fast.</b> These are clinicians already in our network, so onboarding is a "
        "curated introduction, not a cold canvass.",
        "<b>A coverage multiplier.</b> Senior Lagos specialists typically practise across "
        "several hospitals, so each relationship extends your members' access to more than one "
        "facility at once, bridging gaps quickly.",
        "<b>The hospital still wins.</b> When a partnered specialist brings an Aman member into "
        "a hospital, the facility still earns on the bed, theatre, nursing, diagnostics, and "
        "pharmacy. This is added insured volume, not lost business, which makes the hospital an "
        "easier partner too.",
    ]:
        el.append(Paragraph("•&nbsp;&nbsp;" + b, P))
    el.append(Paragraph("Then unbundle the rest, so the network is richer, not just longer", H2))
    for b in [
        "<b>Pharmacy and consumables.</b> Capture the last mile directly through your pharmacy "
        "vehicle, or through partnership, for margin and dependable supply.",
        "<b>Diagnostics.</b> Arrange through dedicated partners, such as Beacon HealthCare "
        "Diagnostics, chosen for quality, price, and reach.",
    ]:
        el.append(Paragraph("•&nbsp;&nbsp;" + b, P))
    el.append(card(
        "The result is a network organised around what a member actually needs: a specialist "
        "to see them, a facility to be treated in, medicines, and diagnostics, each sourced "
        "where it is strongest. That is richer and more defensible than a list of contracted "
        "hospitals, and it stands up faster.", bg=SURFACE, bold=True))

    el.append(PageBreak())

    # ---------------- 6 ----------------
    el.append(Paragraph("6.  A few things the market is telling us", H1))
    el.append(Paragraph("To show the ground we are standing on, three findings from our market work:", P))
    for b in [
        "<b>Your category is already validated in Lagos.</b> A Sharia-compliant HMO launched "
        "here in late 2024. That de-risks the product and confirms the affinity thesis, and it "
        "means there is a first mover to out-execute on network quality and relationships. "
        "Speed matters.",
        "<b>Roughly 40 percent of Lagos facilities accept no insurance at all,</b> and "
        "participation is far higher among established, larger, secondary and tertiary private "
        "facilities. That gives a precise, high-conversion segment to target rather than the "
        "whole field.",
        "<b>Payment reliability, not persuasion, is the lever.</b> The Lagos evidence is "
        "unambiguous that providers accept insurance for reliable volume and predictable "
        "payment, and decline it over delays and denials. Aman's brand promise is, almost word "
        "for word, the answer to that objection.",
    ]:
        el.append(Paragraph("•&nbsp;&nbsp;" + b, P))
    el.append(Paragraph(
        "There is more where this came from. It is the reason we are confident this converts "
        "better.", P))

    # ---------------- 7 ----------------
    el.append(Paragraph("7.  Why this beats the status quo", H1))
    el.append(simple_table([
        ["Current effort", "The Aman-specific approach"],
        ["National spray to 3,000", "A ranked, named target list where your members are"],
        ["Onboard facilities cold, one by one",
         "Seed with ready specialists from CadreHealth, each spanning several hospitals"],
        ["Cold email and cold visits", "Warm introductions through your affinity network"],
        ["“Join our network”",
         "“Members are next to you, and we pay reliably with no rejected eligible claims”"],
        ["Success = signatures", "Success = share of members with good access"],
        ["Sign everyone", "Contract the gaps; use your own clinics for the rest"],
    ], widths=[(PAGE_W - 2 * MARGIN) / 2] * 2))
    el.append(Spacer(1, 6))
    el.append(Paragraph(
        "The prize is not 300 signatures. It is a network where most of your Lagos members can "
        "reach an appropriate, in-network provider quickly. That is what keeps corporate "
        "accounts and wins the next ones, which is the business outcome the brief is really "
        "about.", P))

    # ---------------- 8 ----------------
    el.append(Paragraph("8.  How we would work with you", H1))
    el.append(Paragraph(
        "The brief is clear, so we do not propose a drawn-out diagnostic. We mobilise, "
        "structure the project around your data, then execute. Three stages:", P))
    el.append(simple_table([
        ["Stage", "Focus", "Timing"],
        ["Mobilisation<br/>Diagnosis & project structuring",
         "Once your data is in hand we analyse it, build the demand-and-adequacy map and the "
         "ranked, named provider target list, and structure the project: the provider "
         "proposition and payment SLA, territory and tier design, the affinity partnership "
         "plan, the curated CadreHealth specialist cohort, and the field playbook. This is the "
         "diagnosis and the plan, in one step.", "~2 weeks"],
        ["Execution<br/>Enable your BD team",
         "We run the sprint with your existing BD team, not in place of it: rolling out the "
         "playbook, brokering the affinity introductions, coaching your managers against the "
         "named target list, and tracking coverage weekly, with fortnightly steering. Your "
         "team finishes able to run this itself.", "~8 weeks"],
        ["Extended execution<br/>Scale & hand-over",
         "An opt-in continuation to keep scaling coverage with your team beyond the core "
         "engagement, and hand over a repeatable engine your office runs itself.",
         "Opt-in"],
    ], widths=[118, PAGE_W - 2 * MARGIN - 188, 70]))

    # ---------------- 8 ----------------
    el.append(Paragraph("9.  Commercials", H1))
    el.append(Paragraph(
        "We price every stage at standard Consult for Africa rates so you see the real value, "
        "then show a single introductory discount for a first engagement, then the net. Nothing "
        "is hidden in the rate.", P))
    el.append(simple_table([
        ["Stage", "Standard rate", "Introductory rate (35% off)"],
        ["Mobilisation (build the engine)", "N6,000,000", "N3,900,000"],
        ["Execution, enable your BD team (per month)", "N5,000,000 / mo", "N3,250,000 / mo"],
        ["Core engagement (mobilisation + 2 months)", "N16,000,000", "N10,400,000"],
    ], widths=[PAGE_W - 2 * MARGIN - 230, 115, 115], foot=True))
    el.append(Spacer(1, 6))
    el.append(Paragraph(
        "The introductory discount is a N5,600,000 concession for a first engagement, shown in "
        "full rather than buried in a lower headline rate.", SMALL))
    el.append(Spacer(1, 6))
    el.append(card(
        "This is not a fee per provider. It buys a coverage engine and the capability to run "
        "it, and a single corporate account retained through better coverage typically exceeds "
        "it in a year's premium.", bg=SURFACE, bold=True))
    el.append(Spacer(1, 8))
    el.append(Paragraph(
        "<b>Payment schedule:</b> a mobilisation fee on signing, then execution billed in equal "
        "monthly instalments, so cost tracks delivery.", P))
    el.append(simple_table([
        ["Payment", "When", "Amount"],
        ["Mobilisation", "On signing", "N3,900,000"],
        ["Execution instalment (x2)", "Months 1 to 2", "N3,250,000 each"],
        ["Core engagement total", "", "N10,400,000"],
    ], widths=[PAGE_W - 2 * MARGIN - 230, 115, 115], foot=True))
    el.append(Spacer(1, 8))
    el.append(card(
        "<b>Extended execution (opt-in):</b>&nbsp; standard N5,000,000 per month, introductory "
        "rate <b>N3,250,000 per month</b>, if you want us to keep scaling coverage with your "
        "team beyond the core engagement. Billed monthly and separately, and reviewed against "
        "results.", bg=HexColor("#EAF1F4")))

    # ---------------- 9 ----------------
    el.append(Paragraph("10.  What we would need from you to begin", H1))
    el.append(Paragraph(
        "The analysis is only as good as the data, and this data only Aman holds. To begin "
        "mobilisation we would ask for:", P))
    for b in [
        "Your Lagos member register (by area or LGA).",
        "Your corporate accounts, with every Lagos office or branch address.",
        "Your current provider list, with location, tier, and status.",
        "Your Family Clinics rollout plan and intended locations, so the network is sequenced "
        "around them rather than duplicating them.",
        "Utilisation or claims data showing where members actually seek care.",
        "Your current claims-processing turnaround, so the payment promise we design is one "
        "operations can honestly keep.",
    ]:
        el.append(Paragraph("•&nbsp;&nbsp;" + b, P))
    el.append(Paragraph(
        "Where a dataset is not ready, we proxy it and flag the assumption, so nothing waits.", P))

    # ---------------- 10 ----------------
    el.append(Paragraph("11.  The next step", H1))
    el.append(Paragraph(
        "We would like a 60-minute working session with you and your Lagos lead to confirm "
        "scope, agree the data hand-over, and mobilise. We can be ready to begin the week "
        "you are.", P))
    el.append(Paragraph(
        "Aman has the model, the brand promise, and the community relationships to build the "
        "best faith-aligned network in Lagos. What has been missing is a way to point the "
        "effort at the right targets with the right message. That is exactly the work we do, "
        "and we would be glad to do it with you.", P))
    el.append(Spacer(1, 10))
    el.append(card(
        "<b>Consult for Africa</b> &nbsp; Business Development & Growth Practice<br/>"
        "hello@consultforafrica.com &nbsp; / &nbsp; +234 913 813 8553 &nbsp; / &nbsp; "
        "consultforafrica.com<br/>Lagos and Abuja, Nigeria",
        bg=NAVY, fg=white))

    doc.build(el)
    print(f"wrote {OUT}")


if __name__ == "__main__":
    build()
