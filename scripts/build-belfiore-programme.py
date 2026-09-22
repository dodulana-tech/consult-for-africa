"""
Build the Belfiore Client Experience Programme prospectus as a branded PDF.

Uses scripts/belfiore_doc.py rather than the sober house template: this one
goes to the chief executive of a luxury aesthetics practice, and the cover has
to be worth opening.

    python3 scripts/build-belfiore-programme.py

Source: docs/belfiore-client-experience-programme-cfa.md
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from belfiore_doc import build_doc  # noqa: E402

DOCS = Path(__file__).resolve().parents[1] / "docs"

if __name__ == "__main__":
    build_doc(
        DOCS / "belfiore-client-experience-programme-cfa.md",
        DOCS / "belfiore-client-experience-programme-cfa.pdf",
        "Prepared for Belfiore Medical Aesthetics",
        "The Client Experience Programme",
        "Confidential  /  Prepared for Dr Uju Rapu and Belfiore Medical Aesthetics",
        cover_list=[
            ("01", "What good looks like here"),
            ("02", "Doing the job day to day"),
            ("03", "When it is difficult"),
            ("04", "The client who is not in the room"),
            ("05", "How we know it is working"),
        ],
    )
