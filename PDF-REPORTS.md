# Complete PDF report downloads

- `pdf/全公司_2026Q3完整報告.pdf`: overview and all 13 current individual reports (14 roles), with PDF bookmarks.
- `pdf/全公司總覽_2026Q3完整報告.pdf`: team overview and methodology only.
- Each person's PDF contains the current report HTML in full plus all A, B/S0, B/S5, C/S0, C/S5 radar comparisons. Hsieh's two roles are separate within one PDF.
- Only data already in the public website is included. Linked source documents and historical reports are links, not embedded attachments. No access or sharing changes.
- These are snapshots, not formal personnel determinations. 'Company' refers only to the management team in this dashboard.

## Rebuild after content changes

Install `weasyprint`, `lxml`, `pypdf`, Node.js, and Noto Sans CJK TC fonts. Run `python build-pdfs.py` from this directory. `render-radar.cjs` executes the existing, unchanged radar.js with a minimal DOM adapter; no new scoring formulas are introduced. The builder embeds all model/scenario variants, preserves source links, checks text extraction, and merges individual PDFs with bookmarks. `pdf/manifest.json` records provenance, page counts and hashes. Regenerate and review the PDFs whenever scores or report content changes; PDF snapshots do not update by themselves.
