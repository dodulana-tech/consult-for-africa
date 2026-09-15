"""
Build the Osteon Clinics organisational audit documents as branded PDFs.

    python3 scripts/build-osteon-audit-docs.py

Two go to the client, one stays with the audit team. The survey instruments
are built by scripts/build-osteon-surveys.py.
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from osteon_doc import build_doc  # noqa: E402

OUT = Path(__file__).resolve().parents[1] / "docs" / "osteon"

CLIENT_FOOTER = "Confidential  /  Prepared for Dr Bolarinwa Akinola and Osteon Clinics"
INTERNAL_FOOTER = "Consult for Africa internal  /  Not for circulation to the client"

DOCS_TO_BUILD = [
    ("osteon-audit-scope-cfa", "Osteon Clinics  /  Audit Scope and Method", CLIENT_FOOTER),
    ("osteon-audit-information-request-cfa", "Osteon Clinics  /  Information Request", CLIENT_FOOTER),
    ("osteon-audit-fieldwork-kit-cfa", "Osteon Clinics  /  Fieldwork Kit", INTERNAL_FOOTER),
]


if __name__ == "__main__":
    for stem, header, footer in DOCS_TO_BUILD:
        build_doc(OUT / f"{stem}.md", OUT / f"{stem}.pdf", header, footer)
