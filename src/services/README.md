# Services

Owns data, storage, migration, Firebase, settings, export/import, backup, song/set/workspace services.

Current extracted service owners:

- `storage-service.js` — localStorage-safe access, JSON helpers, migration-safe set/set-entry preservation.
- `firebase-service.js` — Firebase SDK/config/path boundary, Realtime Database listeners, Firestore reads/writes, cloud-safe clone helpers.
- `backup-service.js` — Google Identity/Drive appdata boundary, backup JSON upload/download helpers, backup metadata stamping.

Services should expose explicit contracts to feature modules.
