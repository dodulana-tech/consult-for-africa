"""
Render the Clearview / Dr Kunle Ajayi markdown deliverables to branded PDFs,
using the shared house renderer in scripts/osteon_doc.py.

    python3 scripts/build-clearview-docs.py
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from osteon_doc import build_doc

ROOT = Path(__file__).resolve().parents[1]
DIR = ROOT / "docs" / "clearview"
FOOTER = "Confidential  /  Prepared for Dr Kunle Ajayi"

DOCS_TO_BUILD = [
    ("clearview-ajayi-positioning-strategy-cfa.md",
     "Clearview  /  Destination Fertility"),
    ("clearview-ajayi-discovery-questionnaire-cfa.md",
     "Clearview  /  Discovery"),
]

if __name__ == "__main__":
    for name, header in DOCS_TO_BUILD:
        src = DIR / name
        build_doc(src, src.with_suffix(".pdf"), header, FOOTER)
