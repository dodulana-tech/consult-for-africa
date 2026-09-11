"""
Build the invitation-to-collaborate PDF for Dr Chisom Adaobi Nri-Ezedi.

An offer of two engagements under Consult for Africa:
  1. Design and implement a virtual paediatric haemato-oncology service (her build).
  2. Clinical protocol design on a live paediatric and neonatal engagement.

Output: docs/chisom-invitation-cfa.pdf  (A4, multi-page, branded)

Run:
  python3 scripts/build-chisom-invitation.py
"""

from __future__ import annotations

from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
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
OUT = DOCS / "chisom-invitation-cfa.pdf"

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
                 PAGE_H - 153, "/  CLINICAL FACULTY AND ADVISORY")
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
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 23, "An invitation to collaborate")
    c.setFillColor(GOLD)
    c.rect(MARGIN, 30, 24, 2, fill=1, stroke=0)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8)
    c.drawString(MARGIN, 18, "Private and confidential  /  Prepared for Dr Chisom Adaobi Nri-Ezedi")
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
        title="An Invitation to Collaborate - Dr Chisom Nri-Ezedi - Consult for Africa",
        author="Consult for Africa",
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

    el = []

    # ---------------- COVER ----------------
    el.append(Spacer(1, 40))
    el.append(Paragraph("An invitation to collaborate",
                        ParagraphStyle("ct", fontName="Helvetica-Bold", fontSize=30,
                                       leading=34, textColor=white)))
    el.append(Spacer(1, 10))
    el.append(Paragraph("Two mandates for Dr Chisom Adaobi Nri-Ezedi",
                        ParagraphStyle("cs", fontName="Helvetica-Bold", fontSize=15,
                                       leading=20, textColor=GOLD)))
    el.append(Spacer(1, 26))
    el.append(Paragraph(
        "A virtual paediatric haemato-oncology service to design and lead, and a clinical "
        "protocol mandate on a live paediatric and neonatal engagement. Two ways to bring "
        "your clinical depth to bear at scale, under the Consult for Africa banner.",
        ParagraphStyle("cp", fontName="Helvetica", fontSize=11.5, leading=18, textColor=LIGHT)))
    el.append(Spacer(1, 30))
    for line in [
        "Date:  23 July 2026",
        "For:  Dr Chisom Adaobi Nri-Ezedi",
        "From:  Dr Debo Odulana, Founding Partner, Consult for Africa",
    ]:
        el.append(Paragraph(line, ParagraphStyle("cm", fontName="Helvetica", fontSize=10.5,
                                                  leading=18, textColor=white)))
    el.append(NextPageTemplate("content"))
    el.append(PageBreak())

    # ---------------- 1 ----------------
    el.append(Paragraph("1.  Why I am writing", H1))
    el.append(Paragraph(
        "Chisom, you sit in a rare position. You are a consultant paediatrician with genuine "
        "subspecialty depth in haemato-oncology and endocrinology, a Reader and acting head of "
        "department, and at the same time a self-taught data scientist who ships real clinical "
        "software. Very few clinicians anywhere combine that clinical authority with the "
        "instinct to build. That combination is exactly what Consult for Africa exists to put "
        "to work.", LEDE))
    el.append(Paragraph(
        "This note sets out two mandates I would like you to take on with us. The first is a "
        "service to design and lead as your own. The second is delivery work on a live "
        "engagement where your expertise is needed now. You can take one or both.", P))

    # ---------------- 2 ----------------
    el.append(Paragraph("2.  How Consult for Africa works", H1))
    el.append(Paragraph(
        "Consult for Africa is a healthcare transformation partner working with hospitals, "
        "clinics, and health businesses across Nigeria. We deliver through a faculty of senior "
        "clinicians and operators who lead defined mandates under the firm's banner, with the "
        "firm handling the commercials, the client relationship, and the platform behind you. "
        "You bring the clinical authority; we bring the structure, the reach, and the delivery "
        "engine.", P))
    el.append(card(
        "In short: you do the work you are uniquely good at, at a scale you could not reach "
        "alone, and we make it a business rather than a favour.", bg=SURFACE, bold=True))

    # ---------------- 3 ----------------
    el.append(Paragraph("3.  Mandate one: a virtual paediatric haemato-oncology service", H1))
    el.append(Paragraph("Yours to design, build, and lead.", H2))
    el.append(Paragraph(
        "Childhood cancer and blood disorders in Nigeria are concentrated in a handful of "
        "centres, while the children and the referring doctors are everywhere. A virtual "
        "service closes that distance. I would like you to design and implement it as a "
        "Consult for Africa service line, with you as its clinical lead.", P))
    el.append(Paragraph("What it could include:", P))
    for b in [
        "Remote consultation and second-opinion pathways for referring paediatricians and "
        "family doctors who do not have a haem-oncologist to hand.",
        "A virtual tumour board and shared-care model, so a child can be co-managed close to "
        "home under specialist oversight.",
        "Protocolised supportive care and treatment guidance for centres delivering care "
        "locally, with clear escalation and referral criteria.",
        "The digital layer to make it work, an area where your own building instinct is a real "
        "advantage rather than an afterthought.",
        "A workable access and payment model, including how diaspora and senior specialists "
        "could contribute sessions through our workforce platform.",
    ]:
        el.append(Paragraph("&bull;&nbsp;&nbsp;" + b, P))
    el.append(Paragraph(
        "We would start with a short design phase: the clinical model, the operating model, and "
        "a costed pilot. From there we build and run it together. This is meant to be yours to "
        "own and grow, not a task to complete.", P))

    # ---------------- 4 ----------------
    el.append(Paragraph("4.  Mandate two: clinical protocol design on a live engagement", H1))
    el.append(Paragraph("Immediate, well-defined delivery work.", H2))
    el.append(Paragraph(
        "We are advising a young, ambitious paediatric and neonatal facility in Lagos that is "
        "deliberately building its clinical systems early, before growth outpaces them. Part of "
        "that work is authoring the clinical protocols and nursing standards of work that make "
        "reliable care automatic rather than dependent on individual diligence. It needs a "
        "paediatrician of unimpeachable standing to lead it, and I would like that to be you.", P))
    el.append(Paragraph("The scope would cover:", P))
    for b in [
        "Core paediatric and neonatal clinical protocols and care pathways, written to a "
        "best-practice standard the team can grow into.",
        "Nursing standards of work and shift-level routines, including emergency-readiness "
        "standards such as a checklist-governed crash cart.",
        "Clear escalation, referral, and handover pathways.",
        "A light-touch review cadence so the protocols stay living documents, not shelfware.",
    ]:
        el.append(Paragraph("&bull;&nbsp;&nbsp;" + b, P))
    el.append(Paragraph(
        "You would work alongside our engagement lead on the project, focused purely on the "
        "clinical-standards layer. The client is a strong young facility getting the "
        "foundations right first, which is precisely the kind of forward-looking work that "
        "suits your standing. Full details follow once we agree to proceed and put the usual "
        "confidentiality in place.", P))

    el.append(PageBreak())

    # ---------------- 5 ----------------
    el.append(Paragraph("5.  Why you, specifically", H1))
    fit = [
        ["What the work needs", "What you bring"],
        ["Subspecialty authority in paediatric haem-oncology",
         "FWACP, MD Paediatrics, PhD in clinical oncology, and a paediatric haematology-oncology "
         "and endocrinology practice"],
        ["Credibility to set clinical standards others follow",
         "Reader and acting head of department, subspecialty training coordinator, honorary "
         "consultant at a teaching hospital"],
        ["Ability to build the digital service, not just specify it",
         "Certified data analyst and self-taught developer who has shipped clinical apps and "
         "won global data competitions"],
        ["A mission that matches the work",
         "A stated commitment to widening access to specialist care for African children"],
    ]
    frows = [[Paragraph(c, CELL_W if i == 0 else (CELL_B if j == 0 else CELL))
              for j, c in enumerate(r)] for i, r in enumerate(fit)]
    ft = Table(frows, colWidths=[(PAGE_W - 2 * MARGIN) * 0.42, (PAGE_W - 2 * MARGIN) * 0.58])
    ft.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, SURFACE]),
        ("LINEBELOW", (0, 0), (-1, 0), 2, GOLD),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
    ]))
    el.append(ft)

    # ---------------- 6 ----------------
    el.append(Paragraph("6.  How we would structure it", H1))
    el.append(Paragraph(
        "Both mandates run as Consult for Africa engagements, with clear scope and clear terms "
        "agreed up front. The protocol work is a defined deliverable and would be scoped and "
        "priced as such. The virtual service is a build, so we would structure it to reflect "
        "that you are creating and leading a lasting service line, not billing hours. We will "
        "agree the commercial shape together, and I want it to feel worth your while and "
        "aligned to the value you create.", P))
    el.append(Paragraph(
        "Practical points, such as time commitment around your university duties, will be built "
        "around your availability. Nothing here asks you to choose between this and your post at "
        "the university. It is designed to sit alongside it.", P))

    # ---------------- 7 ----------------
    el.append(Paragraph("7.  Next steps", H1))
    el.append(Paragraph(
        "If either mandate appeals, and I hope both do, let us find a short call. For the "
        "virtual service we would agree the design phase and its scope. For the protocol work we "
        "would put confidentiality in place, share the detail, and set you up with the "
        "engagement lead. I would be glad to move quickly.", P))
    el.append(Spacer(1, 10))
    el.append(card(
        "<b>Dr Debo Odulana</b> &nbsp; Founding Partner, Consult for Africa<br/>"
        "hello@consultforafrica.com &nbsp; / &nbsp; +234 913 813 8553 &nbsp; / &nbsp; "
        "consultforafrica.com<br/>Lagos and Abuja, Nigeria",
        bg=NAVY, fg=white))

    doc.build(el)
    print(f"wrote {OUT}")


if __name__ == "__main__":
    build()
