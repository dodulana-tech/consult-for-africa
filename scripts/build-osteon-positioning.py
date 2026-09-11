"""
Build the Osteon / Dr Bola Akinola positioning-and-brand strategy PDF for Consult For Africa.

Source narrative: docs/osteon-akinola-positioning-strategy-cfa.md
Output:          docs/osteon-akinola-positioning-strategy-cfa.pdf  (A4, branded, house navy style)

Run:
  python3 scripts/build-osteon-positioning.py
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
OUT = DOCS / "osteon-akinola-positioning-strategy-cfa.pdf"

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
                 PAGE_H - 153, "/  BRAND & POSITIONING")
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
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 23, "Osteon Clinics  /  Positioning & Brand Strategy")
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
        title="Osteon / Dr Bola Akinola - Positioning & Brand Strategy - Consult For Africa",
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
        stylecmds += [("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, SURFACE])]
        t.setStyle(TableStyle(stylecmds))
        return t

    def bullets(items):
        for b in items:
            el.append(Paragraph("&#8226;&nbsp;&nbsp;" + b, P))

    el = []

    # ---------------- COVER ----------------
    el.append(Spacer(1, 24))
    el.append(Paragraph("The Surgeon Others<br/>Refer To",
                        ParagraphStyle("ct", fontName="Helvetica-Bold", fontSize=30,
                                       leading=34, textColor=white)))
    el.append(Spacer(1, 10))
    el.append(Paragraph("Positioning and brand strategy for Dr Bola Akinola and Osteon Clinics",
                        ParagraphStyle("cs", fontName="Helvetica-Bold", fontSize=14,
                                       leading=19, textColor=GOLD)))
    el.append(Spacer(1, 22))
    el.append(Paragraph(
        "The growth constraint is not the postcode. Elective joint replacement is a decision "
        "patients make about a surgeon and an institution they trust, not about a convenient "
        "address. This note sets out where the white space is, an honest verdict on the "
        "location question, and the position we recommend building the brand around.",
        ParagraphStyle("cp", fontName="Helvetica", fontSize=11, leading=17, textColor=LIGHT)))
    el.append(Spacer(1, 26))
    for line in [
        "Date:  22 July 2026",
        "For:  Dr Bolarinwa Akinola, FRCS (Tr. & Orth.), Osteon Clinics",
        "From:  Consult for Africa",
        "Status:  Draft strategy for discussion",
    ]:
        el.append(Paragraph(line, ParagraphStyle("cm", fontName="Helvetica", fontSize=10.5,
                                                 leading=18, textColor=white)))
    el.append(NextPageTemplate("content"))
    el.append(PageBreak())

    # ---------------- 1 EXEC SUMMARY ----------------
    el.append(Paragraph("1.  The headline reframe", H1))
    el.append(Paragraph(
        "You believe the practice is held back by the location of the Amuwo Odofin clinic. The "
        "evidence says location is a symptom you have mistaken for the disease.", LEDE))
    el.append(Paragraph(
        "Elective joint replacement is a decision patients make about a surgeon and an "
        "institution they trust, at a price of several million naira, paid out of pocket. It is "
        "not a footfall business. The proof is in front of us: Nigerians already board planes to "
        "India and Turkey for the exact operation you perform. If distance governed this market, "
        "outbound medical tourism could not exist. Patients travel to trust; they do not stay "
        "home for convenience.", P))
    el.append(Paragraph("So the real constraints are three, and none is the address:", P))
    bullets([
        "<b>A thin, un-engineered referral pipeline,</b> which is the actual engine of elective "
        "specialist volume.",
        "<b>A personal and institutional brand that badly under-sells a world-class CV.</b>",
        "<b>Leakage to outbound medical tourism</b> that you are positioned to recapture but are "
        "not marketed to capture.",
    ])
    el.append(card(
        "The move is not to relocate. It is to decouple the brand from the postcode: build "
        "Osteon into a named centre of excellence, and lead with a position no competitor in "
        "Lagos has claimed.", bg=SURFACE, bold=True))
    el.append(Spacer(1, 4))
    el.append(Paragraph(
        "<b>Our recommendation:</b> position you as the complex-case and revision authority, the "
        "surgeon other surgeons refer to when a case is hard or has gone wrong. This is your "
        "genuine subspecialty (revision arthroplasty, bone and joint infection, complex trauma "
        "and limb reconstruction), it is unoccupied by every competitor we mapped, it is the "
        "hardest position to fake and therefore the highest in trust, and it is the strongest "
        "referral magnet there is: surgeons who send you their failures also send you their "
        "primary cases. It reframes medical tourism in your favour: not “do not go "
        "abroad,” but “when abroad goes wrong, this is where you come home.”", P))
    el.append(Paragraph(
        "That spearhead is carried by an ethics-forward voice, the surgeon who will tell you "
        "honestly when not to operate, powered by your public-health training. In a market whose "
        "defining problem is a trust deficit, honesty is a differentiator, not a soft skill.", P))

    el.append(PageBreak())

    # ---------------- 2 MARKET ----------------
    el.append(Paragraph("2.  The market: real, large, and getting more winnable", H1))
    bullets([
        "<b>The leakage is big.</b> Nigeria loses between roughly US$685m (narrowly tracked) and "
        "a widely cited about US$2bn a year (medical-association advocacy estimate) to outbound "
        "medical travel. Orthopaedics is consistently named among the top leakage specialties.",
        "<b>The reported collapse in outbound spend is a mirage.</b> Tracked medical-tourism FX "
        "fell about 96 percent year-on-year, but health-sector leaders attribute this to "
        "payments moving to untracked channels after FX convergence, not to patients staying "
        "home. The outflow continues; it has gone invisible to the data.",
        "<b>The economics of flying out have turned, and this is the real tailwind.</b> India "
        "markets knee and hip packages at about US$4,000 to US$8,000, which post-devaluation is "
        "roughly N6m to N13m in surgery alone, before flights, visas and accommodation for the "
        "patient and a companion, pushing the true cost of a trip abroad well past N10m. Local "
        "arthroplasty is not cheap either: the floor in Nigeria is now around N5.5m post-"
        "devaluation, with premium and complex cases higher. But even so the strong local surgeon "
        "is now both better value and more convenient. The high local price cuts the other way "
        "too: at N5.5m and up, cost prices most patients out, which is why access and "
        "affordability matter as much as reputation.",
        "<b>The barrier is trust, not price or competence.</b> This is the single most important "
        "finding: once patients have confidence in local quality, safety and demonstrated "
        "outcomes, the reason to travel disappears. A trust barrier is a branding barrier, which "
        "is exactly the problem we have been engaged to solve.",
    ])
    el.append(Paragraph("Two channels are opening:", H2))
    bullets([
        "<b>Diaspora-doctor batch surgery.</b> Nigerian specialists abroad partner with local "
        "hospitals to complete blocks of complex procedures, explicitly including advanced "
        "orthopaedics. A locally based, UK-credentialled surgeon can anchor this rather than "
        "cede it to fly-in visitors.",
        "<b>Diaspora-funded care.</b> Adult children abroad paying for a parent's surgery at "
        "home. This buyer is often more reachable online than the patient, and responds strongly "
        "to a recognisable UK credential and clear outcomes.",
    ])

    # ---------------- 3 COMPETITIVE ----------------
    el.append(Paragraph("3.  The competitive map: two flags planted, a wide-open centre", H1))
    el.append(simple_table([
        ["Player", "Position they own", "Gap they leave open"],
        ["Dr Julius Oni /<br/>O.N.I. Clinic",
         "“World-Class Orthopedics, Here at Home.” The reverse-medical-tourism flag, on "
         "Johns Hopkins pedigree and 4,000+ procedures.",
         "A volume-and-speed, borrowed-prestige play. Thin on complex, revision and salvage."],
        ["Dr Seyi Idowu /<br/>Lagos Ortho Clinic",
         "Public-institution anchor (National Orthopaedic Hospital, Igbobi) plus musculoskeletal "
         "oncology and tumour surgery.",
         "Not a premium private brand; oncology focus, not revision or infection."],
        ["Vedic / Duchess /<br/>Starcare / Indian inbound",
         "Facility-led or price-led packages.",
         "Commoditised; no named-surgeon trust equity."],
    ], widths=[100, (PAGE_W - 2 * MARGIN - 100) / 2, (PAGE_W - 2 * MARGIN - 100) / 2]))
    el.append(Spacer(1, 6))
    el.append(Paragraph("Two conclusions follow, and they set the whole strategy:", P))
    bullets([
        "<b>“World-class at home” is already Oni's territory.</b> You cannot lead with "
        "it without becoming a me-too against a stronger-branded Johns Hopkins name on the "
        "Island. The market is real; the slogan is taken.",
        "<b>Nobody has claimed the complex-case and revision authority.</b> No premium Lagos "
        "brand foregrounds revision arthroplasty, bone and joint infection, and complex trauma "
        "and limb reconstruction, the cases that go wrong elsewhere. That is precisely your "
        "subspecialty and your BOA arthroplasty-and-trauma fellowship.",
    ])

    el.append(PageBreak())

    # ---------------- 4 LOCATION VERDICT ----------------
    el.append(Paragraph("4.  The location verdict", H1))
    el.append(Paragraph(
        "For elective, high-value specialist surgery, the evidence points away from geography as "
        "the constraint. The referral-science literature finds specialist referral turns on "
        "three things: the specialist's reputation; patient-interaction factors, of which "
        "convenience is only one sub-factor; and the referrer-to-specialist relationship (trust, "
        "communication, institutional affiliation, reciprocity). Referrers rely on subjective "
        "trust and relationships, not outcome data. That means the pipeline is built by "
        "relationship work, not real estate. The one study that looks pro-location is US "
        "routine-surgery data, and it is contradicted by Nigerians travelling six hours to India "
        "for this same operation.", P))
    el.append(card(
        "<b>One honest caveat.</b>&nbsp; The arthroplasty literature does say institutional "
        "reputation matters alongside surgeon reputation. Patients do not care about the Amuwo "
        "postcode, but they do care whether the place reads as a credible centre of excellence. "
        "So the answer is not “personal brand only,” and it is definitely not "
        "“move.” It is to turn Osteon into a recognisable institutional brand of "
        "arthroplasty excellence, so the address stops mattering. Location is a brand-equity "
        "problem wearing a real-estate costume.", bg=HexColor("#EAF1F4")))
    el.append(Paragraph("What to do instead of relocating:", H2))
    bullets([
        "<b>Formalise the hub-and-spoke visiting model</b> already in place (Cedarcrest Lagos, "
        "Diamed) so the brand and the surgeon travel to where the patients and referrers are, "
        "with Osteon as the named home base.",
        "<b>Engineer a referrer engine</b>: GPs, physiotherapists, rheumatologists, and above "
        "all other orthopaedic and trauma surgeons who refer their complications. The "
        "complex-case position is the single best tool for this.",
        "<b>Add a concierge patient pathway</b> (pre-op guidance, transport, diaspora liaison) "
        "so the journey to Amuwo feels premium and considered, not peripheral.",
    ])

    el.append(PageBreak())

    # ---------------- 5 POSITIONING ----------------
    el.append(Paragraph("5.  Recommended positioning", H1))
    el.append(Paragraph(
        "We recommend a layered position, not an either/or: a spearhead niche, carried by a "
        "trust-first voice, with a deliberate touch of world-class care at home as the "
        "reassurance that closes.", P))

    el.append(Paragraph("5.1  The spearhead: the complex, revision and salvage authority", H2))
    el.append(Paragraph(
        "Position you as the surgeon other surgeons refer to. The authority for the cases others "
        "cannot or will not take: failed and infected joint replacements, revision arthroplasty, "
        "non-union and complex trauma, limb reconstruction, and pointedly, botched-abroad cases "
        "that come home to be fixed.", P))
    bullets([
        "<b>It is genuinely yours.</b> This is naming what you already are, not inventing a "
        "claim.",
        "<b>It is unoccupied.</b> No competitor we mapped foregrounds it.",
        "<b>It is the highest-trust position available.</b> Complex and salvage work is the "
        "hardest to fake, so the claim carries weight a volume number cannot.",
        "<b>It is the strongest referral magnet.</b> Surgeons who trust you with their failures "
        "send you their primaries too. The complex position is the lighthouse; the primary "
        "practice is the harbour it fills.",
        "<b>It reframes medical tourism in your favour.</b> Oni's volume-and-speed brand cannot "
        "credibly say “when your surgery abroad goes wrong, come home to me.” You can.",
    ])

    el.append(Paragraph("5.2  The voice: right care, honestly", H2))
    el.append(Paragraph(
        "Wrap the spearhead in an ethics-forward, outcomes-and-integrity tone, powered by your "
        "MPH: the surgeon who will tell you honestly when you do not need the operation. Against "
        "price-driven package sellers and volume players, “I will tell you the truth about "
        "whether you need this surgery” is a powerful and defensible differentiator, and it "
        "makes every recommendation to operate more believable.", P))

    el.append(Paragraph("5.3  A touch of world-class care at home", H2))
    el.append(Paragraph(
        "Keep a deliberate touch of “world-class care, at home” running through the "
        "brand, but do not lead the whole practice on it, because Oni already owns that flag as "
        "a general promise. The differentiation is in what we attach it to: world-class care at "
        "home for exactly the cases you would otherwise fly abroad for, the revision, the "
        "infection, the complex reconstruction. That turns a crowded slogan into a sharp one. In "
        "practice: the complex-case position is the headline, the honest-counsel voice is the "
        "tone, and world-class-care-at-home is the reassurance that closes the diaspora child "
        "and the anxious patient.", P))

    el.append(Paragraph("5.4  Brand architecture: two separate brands, one clear hierarchy", H2))
    el.append(Paragraph(
        "You own Osteon Clinics, but the two are deliberately kept as separate entities and "
        "separate brands. That is the right structure, and the strategy leans into it. The "
        "hierarchy is explicit:", P))
    bullets([
        "<b>Dr Bola Akinola is the primary, hero brand.</b> The named surgeon is where the "
        "marketing investment, the personal story, the credentials and the complex-case "
        "authority live. He is the draw, the trust anchor and the referral magnet, and the "
        "person a referring doctor or a diaspora child is actually choosing. "
        "bolarinwaakinola.com is the flagship.",
        "<b>Osteon Clinics is the secondary, supporting brand.</b> It is the institution that "
        "delivers the care and supplies the centre-of-excellence credibility patients also "
        "weigh: standards, theatre, team, outcomes, pathway. Endorsed by your reputation, but a "
        "distinct brand you own.",
    ])
    el.append(Paragraph("Why keep them separate rather than merge them:", H2))
    bullets([
        "<b>The personal brand carries what cannot scale; the institution carries what can.</b> "
        "A complex-case, high-trust reputation is inherently personal, which is why it commands "
        "premium and generates referrals, but it caps at your own hands. Osteon, kept separate, "
        "can later carry what your name should not stretch to: primary-elective volume, other "
        "surgeons, allied services, insurance-friendly lines, more sites, growing beyond and "
        "outlasting any single surgeon without diluting your specialist positioning.",
        "<b>It protects the premium.</b> If the hero brand and the institution are one, every "
        "routine and price-led line drags on the specialist reputation. Separated, your name "
        "stays scarce and elevated, while Osteon does the broader, more accessible work under "
        "its own name.",
    ])
    el.append(card(
        "<b>How they hand off.</b>&nbsp; Your name draws the complex or referral patient in and "
        "earns the trust; Osteon delivers the care and reassures the patient that the place, not "
        "just the person, is world-class, which is what keeps them in Nigeria. Marketing leads "
        "with the man; delivery and institutional proof are branded Osteon. In copy this reads "
        "as “Dr Bola Akinola at Osteon Clinics,” never “Osteon” alone for "
        "the specialist work.", bg=HexColor("#EAF1F4")))
    el.append(card(
        "<b>The flagship site (bolarinwaakinola.com) currently under-sells all of this.</b>&nbsp; "
        "It leads on a generic “care you can trust” line and buries the revision, "
        "infection and complex-trauma subspecialty that is the moat. No visible outcomes, proof "
        "points, testimonials or referrer pathway. The rebuild should lead with the complex-case "
        "authority under your name, present Osteon as the endorsed place of delivery, surface "
        "proof, and add referrer and diaspora pathways.", bg=SURFACE))

    el.append(PageBreak())

    # ---------------- 6 NEXT ----------------
    el.append(Paragraph("6.  What we need to confirm before we build", H1))
    el.append(Paragraph(
        "Four things the research left open, best answered from your own numbers and a few "
        "market calls. Your answers turn this strategy into an execution plan.", P))
    el.append(simple_table([
        ["#", "Question we need answered"],
        ["1", "Payer mix and price band for your cases: self-pay versus diaspora-funded versus "
              "any HMO, and how price-sensitive the self-pay segment is."],
        ["2", "Your actual case mix today: what share is already complex or revision versus "
              "primary elective. This tells us whether the position is a reposition or simply "
              "naming what you already do."],
        ["3", "Which referral sources already convert, and whether the Cedarcrest and Diamed "
              "visiting work already out-produces the Amuwo base. A direct test of the location "
              "verdict."],
        ["4", "The remaining competitors' positioning (Vedic, Duchess, Cedarcrest as a brand) to "
              "confirm the centre is as open as it appears."],
    ], widths=[26, PAGE_W - 2 * MARGIN - 26]))
    el.append(Spacer(1, 8))
    el.append(card(
        "<b>Suggested next step:</b>&nbsp; a short discovery questionnaire covering items 1 to 3, "
        "plus a 45-minute working session. On the answers, we lock the positioning, then move to "
        "the brand and website build.", bg=SURFACE, bold=True))
    el.append(Spacer(1, 8))
    el.append(Paragraph(
        "<b>A note on the evidence base.</b> The market, competitor and medical-tourism figures "
        "come from a structured research exercise with each central claim independently "
        "fact-checked. Two things to hold lightly: the headline medical-tourism spend figures "
        "are advocacy estimates, not audited data, and the strongest referral-behaviour studies "
        "are international and applied here by inference. Directional, not precise.", SMALL))
    el.append(Spacer(1, 10))
    el.append(card(
        "<b>Consult for Africa</b> &nbsp; Brand & Positioning<br/>"
        "hello@consultforafrica.com &nbsp; / &nbsp; +234 913 813 8553 &nbsp; / &nbsp; "
        "consultforafrica.com<br/>Lagos and Abuja, Nigeria",
        bg=NAVY, fg=white))

    doc.build(el)
    print(f"wrote {OUT}")


if __name__ == "__main__":
    build()
