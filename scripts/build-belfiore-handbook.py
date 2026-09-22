"""
Build the Belfiore Client Experience Handbook, the participant workbook for the
two days and the desk reference afterwards.

Numbered sections start on a fresh page: this is a book somebody opens at
session 7 on a Tuesday afternoon, not a document read straight through.

    python3 scripts/build-belfiore-handbook.py

Source: docs/belfiore-client-experience-handbook-cfa.md
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from belfiore_doc import build_doc  # noqa: E402

DOCS = Path(__file__).resolve().parents[1] / "docs"

if __name__ == "__main__":
    build_doc(
        DOCS / "belfiore-client-experience-handbook-cfa.md",
        DOCS / "belfiore-client-experience-handbook-cfa.pdf",
        "The Belfiore front desk",
        "The Client Experience Handbook",
        "Belfiore Medical Aesthetics  /  Participant handbook  /  Consult for Africa",
        cover_list=[
            ("01", "What good looks like here"),
            ("02", "Doing the job day to day"),
            ("03", "When it is difficult"),
            ("04", "The client who is not in the room"),
            ("05", "How we know it is working"),
        ],
        section_breaks=True,
    )
