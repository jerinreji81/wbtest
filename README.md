# WorshipBase Phase D — Constants, Utilities, and DOM Helpers

**Created:** 2026-05-11  
**Baseline:** v8.17 stability freeze  
**Purpose:** Begin modular extraction without changing product behaviour.

## What this phase does

- Keeps the v8.17 frozen reference at `src/legacy/index.v8.17.html`.
- Adds `src/legacy/index.phase-d.html` as the active app shell.
- Extracts constants to `src/core/constants.js`.
- Extracts pure helpers and safe storage wrappers to `src/core/utils.js`.
- Extracts DOM helpers to `src/ui/dom.js`.
- Updates `scripts/build.js` so the deployable app is still a single static output.
- Bumps the service worker cache version to avoid stale mixed files.

## What this phase does not do

- Does not redesign UI.
- Does not change CSS.
- Does not touch navigation, gestures, song transitions, or route ownership.
- Does not touch export/PDF internals.
- Does not restore attached song PDF workflows.
- Does not extract Firebase services yet.

## Build command

```bash
npm run build
```

or:

```bash
node scripts/build.js
```

## Deployable output

```text
dist/index.html
dist/wb-offline-sw.js
dist/build-manifest.json
```

## Rule

Deployable files are generated from source through the build script. Do not hand-edit `dist/`.
