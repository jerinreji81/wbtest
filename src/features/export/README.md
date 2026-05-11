# Export / PDF Feature Boundary

Phase K3 creates the owner boundary for app-generated export/PDF formatting.

Scope:

- app-generated set/song PDF export
- export preview formatting contracts
- preset metadata such as Compact, Standard, and Large
- future readability review for title/meta hierarchy, chord visibility, section labels, page breaks, and preview controls

Out of scope:

- attached song PDF upload
- attached song PDF base64 storage
- attached song PDF extraction
- any revival of cancelled attached-PDF workflows

Current status:

- `pdf-format-controller.js` owns formatting metadata and review contracts.
- The legacy shell still owns the actual PDF DOM/render/save implementation.
- K3 deliberately does not change PDF output yet; it creates the owner so later polish is not patch-stacked.
