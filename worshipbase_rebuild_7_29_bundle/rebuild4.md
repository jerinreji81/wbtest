# Rebuild 7.10 handover — Restore review + selective backup restore

## Source of truth
- Clean base: `Rebuild_7.9_ug_pair_wrap_backup_restore.html`
- Reference authority: `Working-v85.0-fixed.html`
- Output: `Rebuild_7.10_restore_review_selective_restore.html`

## What changed

### 1. Backup Centre moved from direct restore to review-first restore
Restore no longer immediately applies a full JSON after the file picker.

New flow:
1. User chooses a backup JSON.
2. Rebuild parses the file and builds a restore plan.
3. Backup Centre changes into a **Restore Review** screen.
4. User chooses the sections to restore.
5. App saves a pre-restore snapshot.
6. Only selected sections are applied.

This keeps the v85 backup-centre pattern of review-first restore while avoiding legacy Drive/OAuth patches.

### 2. Selective restore added
Restore review can selectively restore:
- Songs
- Set lists
- Settings
- Recents / active set pointer

Direct Backup Centre shortcuts were also added:
- Restore from backup
- Import songs from JSON
- Restore set lists only
- Restore settings only

### 3. Selective exports added
Backup Centre now supports:
- Create full local backup
- Export songs only
- Export set lists only
- Export settings only

All exports are local JSON only. Google Drive remains deferred.

### 4. Songs import path remains safe
The “Import songs from JSON” path still routes through the existing duplicate-review import flow instead of replacing the whole library.

Inside the Restore Review screen, “Import songs through duplicate review” is also available as a safer alternative to replacing the songs section.

### 5. BackupModule diagnostics updated
`window.WBBackupModule.diagnostics()` now reports:
- `localBackup`
- `selectiveExport`
- `restoreReview`
- `restoreSelected`
- `restoreSongs`
- `restoreSetLists`
- `restoreSettings`
- `preRestoreSnapshot`
- `drive: 'deferred'`

`window.WBRebuildStatus()` active list now includes restore review and selective restore.

## Validation run
- `node --check` on consolidated script: passed.
- CSS brace balance: passed.
- Version/title updated to `Rebuild_7.10`.

## Console checks
After opening the file in browser preview, run:

```js
window.WBRunDiagnostics()
window.WBRebuildStatus()
window.WBBackupModule.diagnostics()
```

Expected highlights:
- `backupModule.restoreReview === true`
- `backupModule.restoreSelected === true`
- `backupModule.restoreSetLists === true`
- `backupModule.restoreSettings === true`
- `active` includes restore review and selective restore

## Still deferred
- Google Drive OAuth / hidden Drive backup file flow
- Firebase workspace sync
- Attached PDF binary handling
- Full Bible data package

## Next suggested phase
Move into the remaining backup owner work:
1. Add notes/cues-only restore/import if needed.
2. Add Drive module boundary and mock state.
3. Then implement Google Drive OAuth and hidden backup file flow only after local restore is fully confirmed.


## Version Rebuild_7.24
- Based on Rebuild_7.23 with explicit offline-first hardening pass.
- Added offline connectivity watchers with online/offline sync badge behavior and reconnect scheduling when the app comes back online or regains visibility.
- Added app-shell cache warming for same-origin manifest/icon assets and service-worker registration for hosted deployments.
- Added more tolerant Firebase RTDB parsing so songs/sets can load from object or array snapshot shapes and accept lyrics/content fields when chart is missing.
- Added offline diagnostics to `window.WBRunDiagnostics()` including online state, service worker availability, cached song count, cached Bible chapter count, and last sync timestamps.
- New supporting file: `wb-offline-sw.js` for same-origin hosted offline shell caching.


---

# Rebuild 7.29 — loading gate + simplified About + external brand asset support

## Summary
This version combines the next planned cleanup passes into one build:
- keeps the loading screen up until songs are actually ready (or Firebase has definitively settled with no songs)
- removes the awkward empty-library flash on startup
- simplifies the About section
- switches the brand setup to read from the extracted **Layered Fold W** folder structure instead of relying on embedded branding payloads

## What changed
1. **Loading screen timing fixed**
   - Startup no longer drops straight into an empty library while Firebase is still loading.
   - If songs are already available from local/cache, the loading screen exits quickly.
   - If no cached songs are available, the loading screen stays visible until Firebase finishes loading or fails.

2. **About section simplified**
   - Removed the extra bottom pills / clutter.
   - Switched the About card to a quieter presentation using the final Layered Fold W mark.
   - Keeps only the essentials: brand mark, name, version, creator line.

3. **External brand folder support added**
   - The rebuild now expects branding files from the extracted folder:
     `./worshipbase_layered_fold_w_proper/`
   - Default file references now point at the existing folder structure from the approved ZIP:
     - `app-icons/`
     - `png/`
     - `svg/`
     - `launch/`
   - This makes the setup lighter and more future-proof than embedding all assets inside one HTML file.

4. **Offline cache warming updated**
   - Brand icon files and the dark launch asset are now included in the warm-cache list.

## Future plan note
The rebuild log should keep noting future stability work as it comes up. The current next-line plan is:
1. keep the app stable and fix only remaining real bugs from testing
2. continue using the extracted brand asset folder as the long-term source of truth
3. once stable, keep final production assets/config documented instead of buried inside the app file

## Output file
- `Rebuild_7.29_loading_about_external_brand.html`
