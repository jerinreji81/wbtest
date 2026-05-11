# Backup feature owner

Phase J3 introduces the Backup Centre UI controller boundary.

Owns:
- backup action labels
- visible progress/success/failure feedback for async backup actions
- Drive disconnect confirmation contract
- Backup Centre UI action-state helpers

Does not own yet:
- Google Drive API primitives (`src/services/backup-service.js`)
- Backup Centre full DOM rendering
- Restore Review visual redesign
- PDF/export rendering
- attached song PDF workflows, which remain cancelled
