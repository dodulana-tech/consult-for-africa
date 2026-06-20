"""
Build three brand-guide PDFs from the codebase's source of truth:

  docs/brand-guide-cfa.pdf
  docs/brand-guide-maarova.pdf
  docs/brand-guide-cadrehealth.pdf

Run:
  python3 scripts/build-brand-guides.py
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

from reportlab.lib.colors import HexColor, white, Color
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas as canvaslib
from reportlab.lib.utils import ImageReader


ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
PUBLIC = ROOT / "public"

PAGE_W, PAGE_H = LETTER
MARGIN = 0.75 * inch


# ---------- data model ------------------------------------------------------

@dataclass
class Swatch:
    name: str
    hex: str
    usage: str


@dataclass
class Brand:
    slug: str
    name: str
    wordmark_text: str
    tagline: str
    positioning: str
    audience: str
    cover_bg: str
    cover_accent: str
    cover_text: str
    cover_subtext: str
    palette_primary: list[Swatch]
    palette_accent: list[Swatch] = field(default_factory=list)
    palette_neutral: list[Swatch] = field(default_factory=list)
    logo_path: Optional[Path] = None
    logo_status: str = ""
    voice_principles: list[tuple[str, str]] = field(default_factory=list)
    voice_say: list[str] = field(default_factory=list)
    voice_avoid: list[str] = field(default_factory=list)
    typography_note: str = ""
    sample_headlines: list[tuple[str, str]] = field(default_factory=list)


# ---------- shared content --------------------------------------------------

VOICE_HOUSE_RULES = [
    ("No em dashes",
     "Never use em dashes in any copy, headlines, bios, or UI text. Use commas, periods, or rework the sentence."),
    ("Plain language",
     "Write for a senior medic reading on a phone between cases. Short sentences. No jargon for its own sake."),
    ("Specific over generic",
     "Name the hospital, the cadre, the country. Concrete proof beats adjectives every time."),
    ("Avoid AI framing",
     'Do not lead with "AI-powered" or "AI-driven" in user-facing copy. It triggers data-privacy concerns with our audience. Describe the outcome, not the engine.'),
]


# ---------- brand definitions ----------------------------------------------

CFA = Brand(
    slug="cfa",
    name="Consult For Africa",
    wordmark_text="Consult For Africa",
    tagline="Healthcare performance, restored.",
    positioning=(
        "Consult For Africa is a healthcare management consulting firm. "
        "We turn around struggling hospitals, install clinical governance, "
        "and stand up fractional leadership for African health systems."
    ),
    audience=(
        "Hospital owners, health-system executives, development financiers, "
        "and ministries across Nigeria, Ghana, Kenya, and the wider continent."
    ),
    cover_bg="#0B3C5D",
    cover_accent="#D4AF37",
    cover_text="Consult For Africa",
    cover_subtext="Brand Guide  /  v1.0",
    logo_path=PUBLIC / "logo-cfa.png",
    logo_status="Wordmark in use. PNG only. SVG master is an open item.",
    palette_primary=[
        Swatch("Brand Navy", "#0B3C5D", "Primary surface, headers, large brand fields."),
        Swatch("Brand Gold", "#D4AF37", "Accent, hairlines, CTA fills, highlight type."),
    ],
    palette_accent=[
        Swatch("Deep Navy", "#081521", "Hero gradient floor, dark-mode surfaces."),
        Swatch("Teal", "#1F7A8C", "Secondary accent for charts and data."),
    ],
    palette_neutral=[
        Swatch("Body", "#1F2937", "Long-form text on light surfaces."),
        Swatch("Muted", "#6B7280", "Secondary text, captions, metadata."),
        Swatch("Surface", "#F8FAFC", "Section backgrounds, cards on white."),
        Swatch("White", "#FFFFFF", "Cards, primary surface."),
    ],
    voice_principles=[
        ("Senior, not salesy",
         "Read like a strategy partner who has run a hospital, not a SaaS marketer. Gravitas earns the meeting."),
        ("Operator vocabulary",
         "Use the words our clients use: turnaround, governance, capex, occupancy, locum, secondment."),
        ("Africa-specific proof",
         "Lead with continent-relevant numbers and named markets. Generic global benchmarks land flat."),
    ] + VOICE_HOUSE_RULES,
    voice_say=[
        "Hospital turnaround and clinical governance.",
        "Fractional leadership for African health systems.",
        "Operations in Nigeria, Ghana, Kenya, and beyond.",
    ],
    voice_avoid=[
        '"Disruptive", "synergy", "revolutionary".',
        '"AI-powered consulting", "AI-driven insights".',
        "Borrowed Silicon Valley voice. We are an Africa firm.",
    ],
    typography_note=(
        "Current state: system stack (San Francisco on Apple, Segoe UI on Windows). "
        "Recommendation pending: lock a neutral grotesque such as Inter or Söhne for the wordmark "
        "and a transitional serif for long-form (Source Serif Pro or Lyon) once a brand designer is engaged."
    ),
    sample_headlines=[
        ("Hero", "Healthcare performance transformation across Africa."),
        ("Sub", "Hospital turnaround, clinical governance, strategy, and operational excellence."),
        ("Proof line", "Operations in Nigeria, Ghana, Kenya, and across the continent."),
        ("CTA", "Book a discovery call."),
    ],
)


MAAROVA = Brand(
    slug="maarova",
    name="Maarova",
    wordmark_text="Maarova™",
    tagline="Assess, develop, and retain Africa's healthcare leaders.",
    positioning=(
        "Maarova is C4A's proprietary psychometric assessment and coaching platform "
        "for healthcare leaders. Six dimensions, ICF-certified African coaches, "
        "and a measurable arc from assessment to retention."
    ),
    audience=(
        "Hospital groups, training hospitals, and health-system foundations hiring or developing "
        "frontline, middle, and executive leaders."
    ),
    cover_bg="#0F1A2A",
    cover_accent="#D4A574",
    cover_text="Maarova™",
    cover_subtext="Brand Guide  /  v1.0",
    logo_path=None,
    logo_status=(
        "Wordmark pending. The product currently ships as type-only Maarova™ alongside the C4A mark. "
        "Dedicated logomark is an open design task."
    ),
    palette_primary=[
        Swatch("Maarova Night", "#0F1A2A", "Primary brand surface, hero backgrounds."),
        Swatch("Warm Amber", "#D4A574", "Primary accent, CTA fill, highlight type."),
    ],
    palette_accent=[
        Swatch("Stream Blue", "#2D9CDB", "Recruitment Assessment stream."),
        Swatch("Stream Green", "#10B981", "Organisational Intelligence stream."),
        Swatch("Amber Alt", "#F59E0B", "Warnings and caution badges in reports."),
        Swatch("Signal Red", "#EF4444", "Critical findings, retention risk."),
        Swatch("Insight Purple", "#7C3AED", "Data viz, secondary chart series."),
    ],
    palette_neutral=[
        Swatch("Ink", "#06090F", "Type on amber CTAs and light surfaces."),
        Swatch("Slate", "#1A3A52", "Maarova label on white dashboard chrome."),
        Swatch("Muted", "#94A3B8", "Captions, axis labels, metadata."),
        Swatch("Surface", "#FFFFFF", "Report and dashboard background."),
    ],
    voice_principles=[
        ("Science, not horoscope",
         "Maarova is psychometric. Lean on validity, reliability, and predictive language. Never describe results as personality types."),
        ("Coach-led, not algorithmic",
         "Every output points to a human ICF-certified coach. The platform supports the relationship, it does not replace it."),
        ("Measured language for leaders",
         "Senior consultants and CMDs are the audience. Tone is calm, respectful, and developmental."),
    ] + VOICE_HOUSE_RULES,
    voice_say=[
        "Psychometric science meets African healthcare.",
        "Assess. Coach. Measure. Repeat.",
        "Paired with an ICF-certified coach from our African network.",
    ],
    voice_avoid=[
        '"Personality test", "find your type".',
        '"AI coach", "AI-generated insights".',
        "Em dashes. Exclamation marks. Hustle-culture phrasing.",
    ],
    typography_note=(
        "Current state: system stack. Recommendation pending: a humanist sans (Inter, Söhne, or General Sans) "
        "for UI and report body, plus a confident display weight for hero headlines. "
        "Reserve a single serif italic for pull quotes from coaches."
    ),
    sample_headlines=[
        ("Hero", "Assess, develop, and retain Africa's healthcare leaders."),
        ("Sub", "Psychometric science meets African healthcare. Built by C4A. Nothing else like it."),
        ("Stream, Recruitment", "Hire with science, not gut feel."),
        ("Stream, Development", "Assess. Coach. Measure. Repeat."),
        ("Stream, Intelligence", "See your entire leadership landscape."),
    ],
)


CADREHEALTH = Brand(
    slug="cadrehealth",
    name="CadreHealth",
    wordmark_text="CadreHealth",
    tagline="Your career. Your call.",
    positioning=(
        "CadreHealth is the career platform for Nigerian healthcare professionals. "
        "Real salary data, honest hospital reviews, verified credentials, and a readiness score "
        "calibrated to UK, US, Canada, and Gulf markets."
    ),
    audience=(
        "Doctors, nurses, midwives, pharmacists, and every cadre in between. "
        "Built first for Nigeria, scaling to the continent."
    ),
    cover_bg="#0B3C5D",
    cover_accent="#D4AF37",
    cover_text="CadreHealth",
    cover_subtext="Brand Guide  /  v1.0",
    logo_path=None,
    logo_status=(
        "Logomark pending. CadreHealth currently inherits the C4A navy and gold and renders as type-only. "
        "A dedicated logomark is the highest-priority open brand task."
    ),
    palette_primary=[
        Swatch("Cadre Navy", "#0B3C5D", "Hero backgrounds, primary brand fields."),
        Swatch("Cadre Gold", "#D4AF37", "Accent, CTAs, badges, hairlines."),
    ],
    palette_accent=[
        Swatch("Readiness Green", "#10B981", "Career Readiness Score."),
        Swatch("Salary Amber", "#F59E0B", "Salary Intelligence."),
        Swatch("Reviews Blue", "#3B82F6", "Hospital Reviews."),
        Swatch("Report Purple", "#8B5CF6", "Career Intelligence Report."),
        Swatch("Advisor Pink", "#EC4899", "Career Advisor."),
        Swatch("Jobs Red", "#EF4444", "Job Board."),
        Swatch("CV Cyan", "#06B6D4", "CV Builder."),
        Swatch("Wallet Indigo", "#6366F1", "Credential Wallet."),
        Swatch("Migrate Orange", "#F97316", "Migration Pathways."),
        Swatch("Exam Teal", "#14B8A6", "Exam Guides."),
    ],
    palette_neutral=[
        Swatch("Ink", "#06090F", "Type on gold CTAs."),
        Swatch("Body", "#1F2937", "Long-form text on light surfaces."),
        Swatch("Surface", "#FAFAFA", "Page background, cards."),
        Swatch("White", "#FFFFFF", "Cards on grey, modals."),
    ],
    voice_principles=[
        ("Talk to the cadre, not the system",
         "Every line should make a junior pharmacist or a third-year doctor feel seen. Avoid HR voice."),
        ("Honest, not aspirational",
         "We earn trust with real salary numbers and real hospital reviews. Match the copy to the receipts."),
        ("Cadre-inclusive by default",
         "Doctors are not the centre. Nurses, midwives, pharmacists, lab scientists, radiographers, and CHEWs are first-class."),
    ] + VOICE_HOUSE_RULES,
    voice_say=[
        "Real salary data. Honest hospital reviews. Verified credentials.",
        "For doctors, nurses, pharmacists, and every cadre in between.",
        "Your career. Your call.",
    ],
    voice_avoid=[
        '"Talent", "human capital", "resources".',
        '"AI career coach", "AI-matched jobs".',
        "Migration framed as exit. Frame it as choice.",
    ],
    typography_note=(
        "Current state: system stack. Recommendation pending: a readable humanist sans (Inter or General Sans) "
        "tuned for phone screens, with a heavier display cut for the hero headline. "
        "All numerals should be tabular to keep salary tables aligned."
    ),
    sample_headlines=[
        ("Hero", "Your career. Your call."),
        ("Sub", "How ready are you?"),
        ("Proof", "Real salary data. Honest hospital reviews. Verified credentials."),
        ("CTA", "Check Your Readiness Score."),
    ],
)


BRANDS = [CFA, MAAROVA, CADREHEALTH]


# ---------- rendering primitives -------------------------------------------

def draw_text_block(c: canvaslib.Canvas, x: float, y: float, lines: list[tuple[str, str, float, str]]):
    """Draw a list of (text, font, size, color_hex) lines, returns final y."""
    cur_y = y
    for text, font, size, color in lines:
        c.setFont(font, size)
        c.setFillColor(HexColor(color))
        c.drawString(x, cur_y, text)
        cur_y -= size * 1.35
    return cur_y


def wrap_text(c: canvaslib.Canvas, text: str, font: str, size: float, max_width: float) -> list[str]:
    c.setFont(font, size)
    words = text.split()
    lines: list[str] = []
    cur: list[str] = []
    for w in words:
        trial = " ".join(cur + [w])
        if c.stringWidth(trial, font, size) <= max_width:
            cur.append(w)
        else:
            if cur:
                lines.append(" ".join(cur))
            cur = [w]
    if cur:
        lines.append(" ".join(cur))
    return lines


def draw_paragraph(c: canvaslib.Canvas, x: float, y: float, text: str, font: str, size: float,
                   color: str, max_width: float, leading: float = 1.45) -> float:
    lines = wrap_text(c, text, font, size, max_width)
    c.setFont(font, size)
    c.setFillColor(HexColor(color))
    for ln in lines:
        c.drawString(x, y, ln)
        y -= size * leading
    return y


def page_footer(c: canvaslib.Canvas, brand: Brand, page_num: int):
    c.setFont("Helvetica", 8)
    c.setFillColor(HexColor("#9CA3AF"))
    c.drawString(MARGIN, 0.45 * inch, f"{brand.name}  /  Brand Guide  /  v1.0")
    c.drawRightString(PAGE_W - MARGIN, 0.45 * inch, f"{page_num:02d}")


# ---------- page templates --------------------------------------------------

def render_cover(c: canvaslib.Canvas, brand: Brand):
    c.setFillColor(HexColor(brand.cover_bg))
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)

    c.setFillColor(HexColor(brand.cover_accent))
    c.rect(MARGIN, PAGE_H - 1.4 * inch, 0.6 * inch, 2, fill=1, stroke=0)

    c.setFont("Helvetica", 9)
    c.setFillColor(HexColor(brand.cover_accent))
    c.drawString(MARGIN, PAGE_H - 1.55 * inch, "C4A  /  BRAND SYSTEM")

    c.setFont("Helvetica-Bold", 44)
    c.setFillColor(white)
    c.drawString(MARGIN, MARGIN + 2.2 * inch, brand.cover_text)

    c.setFont("Helvetica", 14)
    c.setFillColor(Color(1, 1, 1, alpha=0.7))
    for i, ln in enumerate(wrap_text(c, brand.tagline, "Helvetica", 14, PAGE_W - 2 * MARGIN)):
        c.drawString(MARGIN, MARGIN + 1.7 * inch - i * 20, ln)

    c.setFont("Helvetica", 9)
    c.setFillColor(Color(1, 1, 1, alpha=0.4))
    c.drawString(MARGIN, MARGIN, brand.cover_subtext)
    c.drawRightString(PAGE_W - MARGIN, MARGIN, "consultforafrica.com")


def render_section_header(c: canvaslib.Canvas, title: str, eyebrow: str, brand: Brand) -> float:
    c.setFillColor(HexColor(brand.cover_accent))
    c.rect(MARGIN, PAGE_H - MARGIN - 4, 0.4 * inch, 2, fill=1, stroke=0)
    c.setFont("Helvetica", 8)
    c.drawString(MARGIN + 0.5 * inch, PAGE_H - MARGIN - 5, eyebrow.upper())
    c.setFont("Helvetica-Bold", 24)
    c.setFillColor(HexColor("#0B0F19"))
    c.drawString(MARGIN, PAGE_H - MARGIN - 0.5 * inch, title)
    return PAGE_H - MARGIN - 0.95 * inch


def render_essence(c: canvaslib.Canvas, brand: Brand):
    y = render_section_header(c, "Brand essence", "01", brand)
    content_w = PAGE_W - 2 * MARGIN

    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(HexColor("#0B0F19"))
    c.drawString(MARGIN, y, "Positioning")
    y -= 18
    y = draw_paragraph(c, MARGIN, y, brand.positioning, "Helvetica", 11, "#1F2937", content_w)
    y -= 24

    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(HexColor("#0B0F19"))
    c.drawString(MARGIN, y, "Audience")
    y -= 18
    y = draw_paragraph(c, MARGIN, y, brand.audience, "Helvetica", 11, "#1F2937", content_w)
    y -= 24

    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(HexColor("#0B0F19"))
    c.drawString(MARGIN, y, "Tagline")
    y -= 18
    c.setFont("Helvetica-Bold", 18)
    c.setFillColor(HexColor(brand.cover_bg))
    c.drawString(MARGIN, y, brand.tagline)


def render_logo(c: canvaslib.Canvas, brand: Brand):
    y = render_section_header(c, "Logo", "02", brand)
    content_w = PAGE_W - 2 * MARGIN

    panel_h = 2.6 * inch
    c.setFillColor(HexColor(brand.cover_bg))
    c.rect(MARGIN, y - panel_h, content_w, panel_h, fill=1, stroke=0)

    if brand.logo_path and brand.logo_path.exists():
        img = ImageReader(str(brand.logo_path))
        iw, ih = img.getSize()
        target_h = 1.0 * inch
        scale = target_h / ih
        target_w = iw * scale
        c.drawImage(img, MARGIN + (content_w - target_w) / 2, y - panel_h / 2 - target_h / 2,
                    target_w, target_h, mask="auto")
    else:
        c.setFont("Helvetica-Bold", 38)
        c.setFillColor(white)
        text_w = c.stringWidth(brand.wordmark_text, "Helvetica-Bold", 38)
        c.drawString(MARGIN + (content_w - text_w) / 2, y - panel_h / 2 - 12, brand.wordmark_text)

    y -= panel_h + 30

    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(HexColor("#0B0F19"))
    c.drawString(MARGIN, y, "Current state")
    y -= 16
    y = draw_paragraph(c, MARGIN, y, brand.logo_status, "Helvetica", 10.5, "#1F2937", content_w) - 14

    rules = [
        ("Clearspace", "Reserve space equal to the cap-height of the wordmark on all sides. Nothing crowds it."),
        ("Minimum size", "Wordmark must not render below 16 px on screen or 12 mm in print. Below that, use a future logomark only."),
        ("On dark", "Wordmark reverses to white. Never recolour into the gold or accent palette."),
        ("On light", "Wordmark sits in brand navy. Never grey, never black."),
        ("Do not", "Stretch, rotate, outline, drop-shadow, gradient-fill, or recolour the wordmark."),
    ]
    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(HexColor("#0B0F19"))
    c.drawString(MARGIN, y, "Usage rules")
    y -= 16
    for label, body in rules:
        c.setFont("Helvetica-Bold", 10)
        c.setFillColor(HexColor(brand.cover_bg))
        c.drawString(MARGIN, y, label)
        c.setFont("Helvetica", 10)
        c.setFillColor(HexColor("#1F2937"))
        label_w = c.stringWidth(label + "   ", "Helvetica-Bold", 10)
        y = draw_paragraph(c, MARGIN + label_w, y, body, "Helvetica", 10, "#1F2937",
                            content_w - label_w) - 4


def draw_swatch_row(c: canvaslib.Canvas, x: float, y: float, swatches: list[Swatch],
                    width: float, height: float = 0.95 * inch) -> float:
    if not swatches:
        return y
    n = len(swatches)
    gap = 8
    sw = (width - gap * (n - 1)) / n
    for i, sw_def in enumerate(swatches):
        sx = x + i * (sw + gap)
        c.setFillColor(HexColor(sw_def.hex))
        c.rect(sx, y - height, sw, height, fill=1, stroke=0)
    text_y = y - height - 14
    for i, sw_def in enumerate(swatches):
        sx = x + i * (sw + gap)
        c.setFont("Helvetica-Bold", 8.5)
        c.setFillColor(HexColor("#0B0F19"))
        c.drawString(sx, text_y, sw_def.name)
        c.setFont("Helvetica", 8)
        c.setFillColor(HexColor("#6B7280"))
        c.drawString(sx, text_y - 11, sw_def.hex)
    return text_y - 22


def render_palette(c: canvaslib.Canvas, brand: Brand):
    y = render_section_header(c, "Colour palette", "03", brand)
    content_w = PAGE_W - 2 * MARGIN

    sections = [
        ("Primary", brand.palette_primary),
        ("Accent", brand.palette_accent),
        ("Neutral", brand.palette_neutral),
    ]
    for label, swatches in sections:
        if not swatches:
            continue
        c.setFont("Helvetica-Bold", 10)
        c.setFillColor(HexColor("#0B0F19"))
        c.drawString(MARGIN, y, label.upper())
        c.setFont("Helvetica", 9)
        c.setFillColor(HexColor("#6B7280"))
        c.drawRightString(MARGIN + content_w, y, f"{len(swatches)} colour{'s' if len(swatches) != 1 else ''}")
        y -= 16

        # If too many swatches for one row, break into rows of up to 5
        per_row = 5
        rows = [swatches[i:i + per_row] for i in range(0, len(swatches), per_row)]
        for row in rows:
            y = draw_swatch_row(c, MARGIN, y, row, content_w)
        y -= 10


def render_typography_voice(c: canvaslib.Canvas, brand: Brand):
    y = render_section_header(c, "Typography & voice", "04", brand)
    content_w = PAGE_W - 2 * MARGIN

    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(HexColor("#0B0F19"))
    c.drawString(MARGIN, y, "Typography")
    y -= 16
    y = draw_paragraph(c, MARGIN, y, brand.typography_note, "Helvetica", 10.5, "#1F2937", content_w) - 18

    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(HexColor("#0B0F19"))
    c.drawString(MARGIN, y, "Voice principles")
    y -= 16
    for title, body in brand.voice_principles:
        c.setFont("Helvetica-Bold", 10)
        c.setFillColor(HexColor(brand.cover_bg))
        c.drawString(MARGIN, y, title)
        y -= 13
        y = draw_paragraph(c, MARGIN, y, body, "Helvetica", 9.5, "#1F2937", content_w) - 6
        if y < MARGIN + 1.0 * inch:
            break


def render_say_avoid(c: canvaslib.Canvas, brand: Brand):
    y = render_section_header(c, "Say this, not that", "05", brand)
    content_w = PAGE_W - 2 * MARGIN
    col_w = (content_w - 30) / 2

    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(HexColor("#10B981"))
    c.drawString(MARGIN, y, "Say")
    c.setFillColor(HexColor("#EF4444"))
    c.drawString(MARGIN + col_w + 30, y, "Avoid")
    y -= 18

    yl = yr = y
    for s in brand.voice_say:
        yl = draw_paragraph(c, MARGIN, yl, "+  " + s, "Helvetica", 10.5, "#1F2937", col_w) - 10
    for s in brand.voice_avoid:
        yr = draw_paragraph(c, MARGIN + col_w + 30, yr, "-  " + s, "Helvetica", 10.5, "#1F2937", col_w) - 10


def render_applications(c: canvaslib.Canvas, brand: Brand):
    y = render_section_header(c, "Applications", "06", brand)
    content_w = PAGE_W - 2 * MARGIN

    panel_h = 3.2 * inch
    c.setFillColor(HexColor(brand.cover_bg))
    c.rect(MARGIN, y - panel_h, content_w, panel_h, fill=1, stroke=0)

    c.setFillColor(HexColor(brand.cover_accent))
    c.rect(MARGIN + 0.4 * inch, y - 0.45 * inch, 0.35 * inch, 2, fill=1, stroke=0)
    c.setFont("Helvetica", 8)
    c.drawString(MARGIN + 0.85 * inch, y - 0.45 * inch + 2, "SAMPLE HERO")

    hero = next((h for k, h in brand.sample_headlines if "hero" in k.lower()), brand.tagline)
    sub = next((h for k, h in brand.sample_headlines if "sub" in k.lower() or "proof" in k.lower()), brand.positioning)

    c.setFont("Helvetica-Bold", 28)
    c.setFillColor(white)
    lines = wrap_text(c, hero, "Helvetica-Bold", 28, content_w - 0.8 * inch)
    cy = y - 1.1 * inch
    for ln in lines:
        c.drawString(MARGIN + 0.4 * inch, cy, ln)
        cy -= 32

    c.setFont("Helvetica", 12)
    c.setFillColor(Color(1, 1, 1, alpha=0.65))
    for ln in wrap_text(c, sub, "Helvetica", 12, content_w - 0.8 * inch):
        c.drawString(MARGIN + 0.4 * inch, cy, ln)
        cy -= 16

    y -= panel_h + 28

    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(HexColor("#0B0F19"))
    c.drawString(MARGIN, y, "Approved headlines")
    y -= 16
    for label, headline in brand.sample_headlines:
        c.setFont("Helvetica-Bold", 9)
        c.setFillColor(HexColor("#6B7280"))
        c.drawString(MARGIN, y, label.upper())
        c.setFont("Helvetica", 11)
        c.setFillColor(HexColor("#1F2937"))
        c.drawString(MARGIN + 1.1 * inch, y, headline)
        y -= 18


def render_closer(c: canvaslib.Canvas, brand: Brand):
    y = render_section_header(c, "Stewardship", "07", brand)
    content_w = PAGE_W - 2 * MARGIN

    body = (
        f"This guide is the working source of truth for the {brand.name} brand. "
        "It is not exhaustive. Logomark, full typography licensing, motion principles, photography "
        "direction, and stationery templates remain open items and will be appended as they are commissioned."
    )
    y = draw_paragraph(c, MARGIN, y, body, "Helvetica", 11, "#1F2937", content_w) - 24

    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(HexColor("#0B0F19"))
    c.drawString(MARGIN, y, "Open items")
    y -= 16
    open_items = [
        "Commission SVG masters of the wordmark and any new logomark.",
        "Lock display and body typefaces with a licensed foundry.",
        "Define motion principles for hero animations and chart reveals.",
        "Build photography direction: lighting, composition, subject brief.",
        "Stationery, deck templates, email signatures, social templates.",
    ]
    for item in open_items:
        c.setFont("Helvetica", 10.5)
        c.setFillColor(HexColor("#1F2937"))
        c.drawString(MARGIN, y, "•  " + item)
        y -= 16

    y -= 8
    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(HexColor("#0B0F19"))
    c.drawString(MARGIN, y, "Steward")
    y -= 16
    c.setFont("Helvetica", 10.5)
    c.setFillColor(HexColor("#1F2937"))
    c.drawString(MARGIN, y, "Dr. Debo Odulana, Founding Partner")
    y -= 14
    c.drawString(MARGIN, y, "hello@consultforafrica.com")


# ---------- assemble --------------------------------------------------------

def build_pdf(brand: Brand) -> Path:
    out = DOCS / f"brand-guide-{brand.slug}.pdf"
    DOCS.mkdir(exist_ok=True)
    c = canvaslib.Canvas(str(out), pagesize=LETTER)
    c.setTitle(f"{brand.name} Brand Guide")
    c.setAuthor("Consult For Africa")

    render_cover(c, brand)
    c.showPage()

    pages = [
        render_essence,
        render_logo,
        render_palette,
        render_typography_voice,
        render_say_avoid,
        render_applications,
        render_closer,
    ]
    for i, render in enumerate(pages, start=2):
        render(c, brand)
        page_footer(c, brand, i)
        c.showPage()

    c.save()
    return out


def main():
    outs = [build_pdf(b) for b in BRANDS]
    for p in outs:
        print(f"wrote {p.relative_to(ROOT)}  ({p.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
