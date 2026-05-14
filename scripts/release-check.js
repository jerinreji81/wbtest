#!/usr/bin/env node
/**
 * WorshipBase Phase 2b - L8 release preflight.
 * Run after `npm run build` from the repo root.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const PHASE = 'Phase 2b - QA4';
const CACHE_TOKEN = 'phase-2b-l8';
const REQUIRED_RUNTIME = [
  path.join(DIST, 'index.html'),
  path.join(DIST, 'wb-offline-sw.js'),
  path.join(DIST, 'build-manifest.json'),
  path.join(DIST, 'phase-2b-diagnostics.json'),
];
const REQUIRED_DOCS = [
  path.join(ROOT, 'docs', 'Phase 2b operating manual.md'),
  path.join(ROOT, 'docs', 'Phase 2b check registry.json'),
  path.join(ROOT, 'docs', 'Phase 2b agent quickstart.md'),
  path.join(ROOT, 'docs', 'Phase 2b - A source ownership audit.md'),
  path.join(ROOT, 'docs', 'Phase 2b - A extraction plan.md'),
  path.join(ROOT, 'docs', 'Phase 2b - B2 shared UI ownership.md'),
  path.join(ROOT, 'docs', 'Phase 2b - C2 surface lifecycle ownership.md'),
  path.join(ROOT, 'docs', 'Phase 2b - C2 report.md'),
  path.join(ROOT, 'docs', 'Phase 2b - D1 data model normalisation.md'),
  path.join(ROOT, 'docs', 'Phase 2b - D1 report.md'),
  path.join(ROOT, 'docs', 'Phase 2b - D2 key hierarchy and set export model.md'),
  path.join(ROOT, 'docs', 'Phase 2b - D2 report.md'),
  path.join(ROOT, 'docs', 'Phase 2b - E1 shared set editor extraction.md'),
  path.join(ROOT, 'docs', 'Phase 2b - E1 report.md'),
  path.join(ROOT, 'docs', 'Phase 2b - E2 set-list action-state adapter.md'),
  path.join(ROOT, 'docs', 'Phase 2b - E2 report.md'),
  path.join(ROOT, 'docs', 'Phase 2b - G3 Tools concrete render extraction.md'),
  path.join(ROOT, 'docs', 'Phase 2b - G3 report.md'),
  path.join(ROOT, 'docs', 'Phase 2b - H1 Settings_Admin extraction boundary.md'),
  path.join(ROOT, 'docs', 'Phase 2b - H1 report.md'),
  path.join(ROOT, 'docs', 'Phase 2b - H2 Settings_Admin render-action ownership.md'),
  path.join(ROOT, 'docs', 'Phase 2b - H2 report.md'),
  path.join(ROOT, 'docs', 'Phase 2b - I1 Library_Song extraction boundary.md'),
  path.join(ROOT, 'docs', 'Phase 2b - I1 report.md'),
  path.join(ROOT, 'docs', 'Phase 2b - I2 Library_Song concrete surface retirement.md'),
  path.join(ROOT, 'docs', 'Phase 2b - I2 report.md'),
  path.join(ROOT, 'docs', 'Phase 2b - I3 Song editor_import extraction boundary.md'),
  path.join(ROOT, 'docs', 'Phase 2b - I3 report.md'),
  path.join(ROOT, 'docs', 'Phase 2b - I4 Song import_fetch and Firebase destination extraction.md'),
  path.join(ROOT, 'docs', 'Phase 2b - I4 report.md'),
  path.join(ROOT, 'docs', 'Phase 2b - I5 Song lifecycle_menu_notes_focus host retirement.md'),
  path.join(ROOT, 'docs', 'Phase 2b - I5 report.md'),
  path.join(ROOT, 'docs', 'Phase 2b - J1 Workspace surface extraction boundary.md'),
  path.join(ROOT, 'docs', 'Phase 2b - J1 report.md'),
  path.join(ROOT, 'docs', 'Phase 2b - J2 Workspace action_event_persistence extraction boundary.md'),
  path.join(ROOT, 'docs', 'Phase 2b - J2 report.md'),
  path.join(ROOT, 'docs', 'Phase 2b - J3 Workspace cloud_runtime_backend extraction boundary.md'),
  path.join(ROOT, 'docs', 'Phase 2b - J3 report.md'),
  path.join(ROOT, 'docs', 'Phase 2b - K1 Export_PDF runtime extraction boundary.md'),
  path.join(ROOT, 'docs', 'Phase 2b - K1 report.md'),
  path.join(ROOT, 'docs', 'Phase 2b - K2 Backup_restore_import residual extraction boundary.md'),
  path.join(ROOT, 'docs', 'Phase 2b - K2 report.md'),
  path.join(ROOT, 'docs', 'Phase 2b - K3 Cloud_Firebase_Drive_offline runtime cleanup boundary.md'),
  path.join(ROOT, 'docs', 'Phase 2b - K3 report.md'),
  path.join(ROOT, 'docs', 'Phase 2b - L1 Global_modal_sheet_toast_navigation bridge extraction boundary.md'),
  path.join(ROOT, 'docs', 'Phase 2b - L1 report.md'),
  path.join(ROOT, 'docs', 'Phase 2b - L2 Main_shell retirement boundary.md'),
  path.join(ROOT, 'docs', 'Phase 2b - L2 report.md'),
  path.join(ROOT, 'docs', 'Phase 2b - L3 Final_shell_host_replacement legacy_runtime_adapter_retirement.md'),
  path.join(ROOT, 'docs', 'Phase 2b - L3 report.md'),
  path.join(ROOT, 'docs', 'Phase 2b - L4 Static_shell_split browser_parity_gate.md'),
  path.join(ROOT, 'docs', 'Phase 2b - L4 report.md'),
  path.join(ROOT, 'docs', 'Phase 2b - L5 Final_host_flip_readiness_gate.md'),
  path.join(ROOT, 'docs', 'Phase 2b - L5 report.md'),
  path.join(ROOT, 'docs', 'Phase 2b - L6 Source-owned host creation legacy_host_replacement.md'),
  path.join(ROOT, 'docs', 'Phase 2b - L6 report.md'),
  path.join(ROOT, 'docs', 'Phase 2b - L7 Browser_parity_smoke_gate host_adapter_debt_retirement.md'),
  path.join(ROOT, 'docs', 'Phase 2b - L7 report.md'),
  path.join(ROOT, 'docs', 'Phase 2b - L8 Manual_browser_parity_signoff final_completion_gate.md'),
  path.join(ROOT, 'docs', 'Phase 2b - L8 report.md'),
];
const REQUIRED_SOURCE = [
  path.join(ROOT, 'src', 'ui', 'components.js'),
  path.join(ROOT, 'src', 'core', 'app-shell.js'),
  path.join(ROOT, 'src', 'core', 'main-shell-controller.js'),
  path.join(ROOT, 'src', 'core', 'legacy-runtime-adapter-controller.js'),
  path.join(ROOT, 'src', 'core', 'static-shell-parity-controller.js'),
  path.join(ROOT, 'src', 'core', 'final-host-flip-controller.js'),
  path.join(ROOT, 'src', 'core', 'source-host-controller.js'),
  path.join(ROOT, 'src', 'core', 'browser-parity-smoke-controller.js'),
  path.join(ROOT, 'src', 'core', 'final-completion-gate-controller.js'),
  path.join(ROOT, 'src', 'core', 'host-runtime-adapter.js'),
  path.join(ROOT, 'src', 'host', 'index.phase-2b.html'),
  path.join(ROOT, 'src', 'ui', 'surface-lifecycle.js'),
  path.join(ROOT, 'src', 'services', 'data-model-service.js'),
  path.join(ROOT, 'src', 'features', 'export', 'set-export-model.js'),
  path.join(ROOT, 'src', 'features', 'setlist', 'set-editor-controller.js'),
  path.join(ROOT, 'src', 'features', 'setlist', 'set-state-adapter.js'),
  path.join(ROOT, 'src', 'features', 'setlist', 'set-event-persistence-adapter.js'),
  path.join(ROOT, 'src', 'features', 'data-safety', 'export-import-backup-controller.js'),
  path.join(ROOT, 'src', 'features', 'data-safety', 'data-safety-dom-controller.js'),
  path.join(ROOT, 'src', 'features', 'tools', 'tools-dom-controller.js'),
  path.join(ROOT, 'src', 'features', 'tools', 'tools-render-model.js'),
  path.join(ROOT, 'src', 'features', 'tools', 'tools-surface-controller.js'),
  path.join(ROOT, 'src', 'features', 'tools', 'tools-state-action-controller.js'),
  path.join(ROOT, 'src', 'features', 'settings', 'settings-admin-dom-controller.js'),
  path.join(ROOT, 'src', 'features', 'settings', 'settings-admin-render-controller.js'),
  path.join(ROOT, 'src', 'features', 'song', 'library-controller.js'),
  path.join(ROOT, 'src', 'features', 'song', 'library-surface-controller.js'),
  path.join(ROOT, 'src', 'features', 'song', 'song-editor-import-controller.js'),
  path.join(ROOT, 'src', 'features', 'song', 'song-import-destination-controller.js'),
  path.join(ROOT, 'src', 'features', 'song', 'song-lifecycle-controller.js'),
  path.join(ROOT, 'src', 'features', 'song', 'song-view-render-controller.js'),
  path.join(ROOT, 'src', 'features', 'workspace', 'workspace-surface-controller.js'),
  path.join(ROOT, 'src', 'features', 'workspace', 'workspace-action-controller.js'),
  path.join(ROOT, 'src', 'features', 'workspace', 'workspace-cloud-controller.js'),
  path.join(ROOT, 'src', 'features', 'export', 'pdf-runtime-controller.js'),
  path.join(ROOT, 'src', 'features', 'backup', 'backup-restore-controller.js'),
  path.join(ROOT, 'src', 'services', 'cloud-runtime-controller.js'),
  path.join(ROOT, 'src', 'ui', 'global-surface-navigation-controller.js'),
];
const RECOMMENDED_SITE_ROOT = [
  path.join(ROOT, 'esv_chapter_package', 'bible-index.json'),
  path.join(ROOT, 'worshipbase_layered_fold_w_proper'),
  path.join(ROOT, 'assets', 'drones'),
];
function exists(p){ return fs.existsSync(p); }
function read(p){ return fs.readFileSync(p, 'utf8'); }
function sha256File(p){ return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'); }
function rel(p){ return path.relative(ROOT, p) || '.'; }
function count(re, text){ return (text.match(re) || []).length; }
function loadJson(p, errors){
  try { return JSON.parse(read(p)); }
  catch(e){ errors.push(`${rel(p)} is not valid JSON: ${e.message}`); return null; }
}
const errors = [];
const warnings = [];
for (const p of REQUIRED_RUNTIME) if (!exists(p)) errors.push(`Missing build output: ${rel(p)}`);
for (const p of REQUIRED_DOCS) if (!exists(p)) errors.push(`Missing Phase 2b doc: ${rel(p)}`);
for (const p of REQUIRED_SOURCE) if (!exists(p)) errors.push(`Missing Phase 2b source owner: ${rel(p)}`);
for (const p of RECOMMENDED_SITE_ROOT) if (!exists(p)) warnings.push(`Recommended deployed asset not found in this local package: ${rel(p)}`);

if (exists(path.join(DIST, 'index.html'))) {
  const html = read(path.join(DIST, 'index.html'));
  const styleBlocks = count(/<style\b[^>]*>/gi, html);
  if (styleBlocks !== 1) errors.push(`Expected 1 consolidated style block, found ${styleBlocks}`);
  if (!html.includes(PHASE)) errors.push(`Dist index does not contain ${PHASE} version label`);
  if (/Rebuild_8\.17/.test(html)) errors.push('Dist index still contains active Rebuild_8.17 wording');
  if (/targeted-polish\.css/.test(html)) errors.push('Dist index references targeted-polish.css');
  if (!html.includes('id="wb-ui-components"')) errors.push('Dist index does not include shared UI component owner script');
  if (!html.includes('WBUI')) errors.push('Dist index does not expose WBUI component owner');
  if (!html.includes('id="wb-core-app-shell"')) errors.push('Dist index does not include app shell/router owner script');
  if (!html.includes('WBAppShellController')) errors.push('Dist index does not expose WBAppShellController');
  if (!html.includes('id="wb-core-main-shell-controller"')) errors.push('Dist index does not include main shell retirement owner script');
  if (!html.includes('WBMainShellController')) errors.push('Dist index does not expose WBMainShellController');
  if (!html.includes('id="wb-core-legacy-runtime-adapter-controller"')) errors.push('Dist index does not include legacy runtime adapter owner script');
  if (!html.includes('WBLegacyRuntimeAdapterController')) errors.push('Dist index does not expose WBLegacyRuntimeAdapterController');
  if (!html.includes('id="wb-core-static-shell-parity-controller"')) errors.push('Dist index does not include static shell parity owner script');
  if (!html.includes('WBStaticShellParityController')) errors.push('Dist index does not expose WBStaticShellParityController');
  if (!html.includes('id="wb-core-final-host-flip-controller"')) errors.push('Dist index does not include final host flip readiness owner script');
  if (!html.includes('WBFinalHostFlipController')) errors.push('Dist index does not expose WBFinalHostFlipController');
  if (!html.includes('id="wb-core-source-host-controller"')) errors.push('Dist index does not include source host owner script');
  if (!html.includes('WBSourceHostController')) errors.push('Dist index does not expose WBSourceHostController');
  if (!html.includes('id="wb-data-model-service"')) errors.push('Dist index does not include data model service owner script');
  if (!html.includes('WBDataModel')) errors.push('Dist index does not expose WBDataModel');
  if (!html.includes('id="wb-set-export-model"')) errors.push('Dist index does not include set export model owner script');
  if (!html.includes('WBSetExportModel')) errors.push('Dist index does not expose WBSetExportModel');
  if (!html.includes('id="wb-set-editor-controller"')) errors.push('Dist index does not include shared set editor owner script');
  if (!html.includes('id="wb-set-state-adapter"')) errors.push('Dist index does not include set state adapter owner script');
  if (!html.includes('WBSetStateAdapter')) errors.push('Dist index does not expose WBSetStateAdapter');
  if (!html.includes('id="wb-set-event-persistence-adapter"')) errors.push('Dist index does not include set event/persistence adapter owner script');
  if (!html.includes('WBSetEventPersistenceAdapter')) errors.push('Dist index does not expose WBSetEventPersistenceAdapter');
  if (!html.includes('id="wb-data-safety-controller"')) errors.push('Dist index does not include data safety owner script');
  if (!html.includes('WBDataSafetyController')) errors.push('Dist index does not expose WBDataSafetyController');
  if (!html.includes('id="wb-data-safety-dom-controller"')) errors.push('Dist index does not include data safety DOM owner script');
  if (!html.includes('WBDataSafetyDomController')) errors.push('Dist index does not expose WBDataSafetyDomController');
  if (!html.includes('id="wb-tools-dom-controller"')) errors.push('Dist index does not include Tools DOM owner script');
  if (!html.includes('WBToolsDomController')) errors.push('Dist index does not expose WBToolsDomController');
  if (!html.includes('id="wb-tools-render-model"')) errors.push('Dist index does not include Tools render-model owner script');
  if (!html.includes('WBToolsRenderModel')) errors.push('Dist index does not expose WBToolsRenderModel');
  if (!html.includes('id="wb-tools-surface-controller"')) errors.push('Dist index does not include Tools concrete surface owner script');
  if (!html.includes('WBToolsSurfaceController')) errors.push('Dist index does not expose WBToolsSurfaceController');
  if (!html.includes('id="wb-tools-state-action-controller"')) errors.push('Dist index does not include Tools state/action owner script');
  if (!html.includes('WBToolsStateActionController')) errors.push('Dist index does not expose WBToolsStateActionController');
  if (!html.includes('id="wb-settings-admin-render-controller"')) errors.push('Dist index does not include Settings/Admin render owner script');
  if (!html.includes('WBSettingsAdminRenderController')) errors.push('Dist index does not expose WBSettingsAdminRenderController');
  if (!html.includes('id="wb-library-controller"')) errors.push('Dist index does not include Library controller owner script');
  if (!html.includes('WBLibraryController')) errors.push('Dist index does not expose WBLibraryController');
  if (!html.includes('id="wb-library-surface-controller"')) errors.push('Dist index does not include Library manage surface owner script');
  if (!html.includes('WBLibrarySurfaceController')) errors.push('Dist index does not expose WBLibrarySurfaceController');
  if (!html.includes('id="wb-song-editor-import-controller"')) errors.push('Dist index does not include Song editor/import owner script');
  if (!html.includes('WBSongEditorImportController')) errors.push('Dist index does not expose WBSongEditorImportController');
  if (!html.includes('id="wb-song-import-destination-controller"')) errors.push('Dist index does not include Song import destination/fetch owner script');
  if (!html.includes('WBSongImportDestinationController')) errors.push('Dist index does not expose WBSongImportDestinationController');
  if (!html.includes('id="wb-song-lifecycle-controller"')) errors.push('Dist index does not include Song lifecycle/menu/notes/focus owner script');
  if (!html.includes('WBSongLifecycleController')) errors.push('Dist index does not expose WBSongLifecycleController');
  if (!html.includes('id="wb-song-view-render-controller"')) errors.push('Dist index does not include Song view render owner script');
  if (!html.includes('id="wb-workspace-surface-controller"')) errors.push('Dist index does not include Workspace surface owner script');
  if (!html.includes('id="wb-workspace-action-controller"')) errors.push('Dist index does not include Workspace action/event owner script');
  if (!html.includes('id="wb-workspace-cloud-controller"')) errors.push('Dist index does not include Workspace cloud/runtime owner script');
  if (!html.includes('WBWorkspaceCloudController')) errors.push('Dist index does not expose WBWorkspaceCloudController');
  if (!html.includes('id="wb-export-pdf-runtime-controller"')) errors.push('Dist index does not include Export/PDF runtime owner script');
  if (!html.includes('WBExportPdfRuntimeController')) errors.push('Dist index does not expose WBExportPdfRuntimeController');
  if (!html.includes('id="wb-backup-restore-controller"')) errors.push('Dist index does not include Backup/Restore residual owner script');
  if (!html.includes('WBBackupRestoreController')) errors.push('Dist index does not expose WBBackupRestoreController');
  if (!html.includes('id="wb-cloud-runtime-controller"')) errors.push('Dist index does not include Cloud runtime owner script');
  if (!html.includes('WBCloudRuntimeController')) errors.push('Dist index does not expose WBCloudRuntimeController');
  if (!html.includes('WBWorkspaceSurfaceController')) errors.push('Dist index does not expose WBWorkspaceSurfaceController');
  if (!html.includes('WBSongViewRenderController')) errors.push('Dist index does not expose WBSongViewRenderController');
}


if (exists(path.join(DIST, 'wb-offline-sw.js'))) {
  const sw = read(path.join(DIST, 'wb-offline-sw.js'));
  if (!sw.includes(CACHE_TOKEN)) errors.push(`Service worker cache version does not contain ${CACHE_TOKEN}`);
  if (/Rebuild_8\.17/.test(sw)) errors.push('Service worker still contains active Rebuild_8.17 wording');
  if (!sw.includes('WB_SW_ACTIVATED')) warnings.push('Service worker activation message not found');
  if (!sw.includes('esv_chapter_package')) warnings.push('Bible package cache handling not found in service worker');
}
const manifest = exists(path.join(DIST, 'build-manifest.json')) ? loadJson(path.join(DIST, 'build-manifest.json'), errors) : null;
if (manifest) {
  if (manifest.phase !== PHASE) errors.push(`Manifest phase is ${manifest.phase}, expected ${PHASE}`);
  if (manifest.validation && manifest.validation.styleBlocks !== 1) errors.push('Manifest style block count is not 1');
  if (manifest.validation && manifest.validation.modularisationComplete !== true) errors.push('Manifest must mark modularisationComplete=true after L8 final completion gate');
  if (!((manifest.modules||[]).some(m => m.id === 'wb-ui-components'))) errors.push('Manifest does not list wb-ui-components module');
  if (!((manifest.modules||[]).some(m => m.id === 'wb-core-app-shell'))) errors.push('Manifest does not list wb-core-app-shell module');
  if (!((manifest.modules||[]).some(m => m.id === 'wb-core-main-shell-controller'))) errors.push('Manifest does not list wb-core-main-shell-controller module');
  if (!((manifest.modules||[]).some(m => m.id === 'wb-core-legacy-runtime-adapter-controller'))) errors.push('Manifest does not list wb-core-legacy-runtime-adapter-controller module');
  if (!((manifest.modules||[]).some(m => m.id === 'wb-core-static-shell-parity-controller'))) errors.push('Manifest does not list wb-core-static-shell-parity-controller module');
  if (!((manifest.modules||[]).some(m => m.id === 'wb-core-final-host-flip-controller'))) errors.push('Manifest does not list wb-core-final-host-flip-controller module');
  if (!((manifest.modules||[]).some(m => m.id === 'wb-core-source-host-controller'))) errors.push('Manifest does not list wb-core-source-host-controller module');
  if (!((manifest.modules||[]).some(m => m.id === 'wb-core-browser-parity-smoke-controller'))) errors.push('Manifest does not list wb-core-browser-parity-smoke-controller module');
  if (!((manifest.modules||[]).some(m => m.id === 'wb-core-final-completion-gate-controller'))) errors.push('Manifest does not list wb-core-final-completion-gate-controller module');
  if (!((manifest.modules||[]).some(m => m.id === 'wb-core-host-runtime-adapter'))) errors.push('Manifest does not list wb-core-host-runtime-adapter module');
  if (manifest.validation && manifest.validation.activeSourceHost !== 'src/host/index.phase-2b.html') errors.push('Manifest does not record src/host/index.phase-2b.html as active source host');
  if (!((manifest.modules||[]).some(m => m.id === 'wb-data-model-service'))) errors.push('Manifest does not list wb-data-model-service module');
  if (!((manifest.modules||[]).some(m => m.id === 'wb-set-export-model'))) errors.push('Manifest does not list wb-set-export-model module');
  if (!((manifest.modules||[]).some(m => m.id === 'wb-set-editor-controller'))) errors.push('Manifest does not list wb-set-editor-controller module');
  if (!((manifest.modules||[]).some(m => m.id === 'wb-set-state-adapter'))) errors.push('Manifest does not list wb-set-state-adapter module');
  if (!((manifest.modules||[]).some(m => m.id === 'wb-set-event-persistence-adapter'))) errors.push('Manifest does not list wb-set-event-persistence-adapter module');
  if (!((manifest.modules||[]).some(m => m.id === 'wb-data-safety-controller'))) errors.push('Manifest does not list wb-data-safety-controller module');
  if (!((manifest.modules||[]).some(m => m.id === 'wb-data-safety-dom-controller'))) errors.push('Manifest does not list wb-data-safety-dom-controller module');
  if (!((manifest.modules||[]).some(m => m.id === 'wb-tools-dom-controller'))) errors.push('Manifest does not list wb-tools-dom-controller module');
  if (!((manifest.modules||[]).some(m => m.id === 'wb-tools-surface-controller'))) errors.push('Manifest does not list wb-tools-surface-controller module');
  if (!((manifest.modules||[]).some(m => m.id === 'wb-tools-state-action-controller'))) errors.push('Manifest does not list wb-tools-state-action-controller module');
  if (!((manifest.modules||[]).some(m => m.id === 'wb-settings-admin-render-controller'))) errors.push('Manifest does not list wb-settings-admin-render-controller module');
  if (!((manifest.modules||[]).some(m => m.id === 'wb-library-controller'))) errors.push('Manifest does not list wb-library-controller module');
  if (!((manifest.modules||[]).some(m => m.id === 'wb-library-song-controller'))) errors.push('Manifest does not list wb-library-song-controller module');
  if (!((manifest.modules||[]).some(m => m.id === 'wb-library-surface-controller'))) errors.push('Manifest does not list wb-library-surface-controller module');
  if (!((manifest.modules||[]).some(m => m.id === 'wb-song-editor-import-controller'))) errors.push('Manifest does not list wb-song-editor-import-controller module');
  if (!((manifest.modules||[]).some(m => m.id === 'wb-song-import-destination-controller'))) errors.push('Manifest does not list wb-song-import-destination-controller module');
  if (!((manifest.modules||[]).some(m => m.id === 'wb-song-lifecycle-controller'))) errors.push('Manifest does not list wb-song-lifecycle-controller module');
  if (!((manifest.modules||[]).some(m => m.id === 'wb-song-view-render-controller'))) errors.push('Manifest does not list wb-song-view-render-controller module');
  if (!((manifest.modules||[]).some(m => m.id === 'wb-workspace-surface-controller'))) errors.push('Manifest does not list wb-workspace-surface-controller module');
  if (!((manifest.modules||[]).some(m => m.id === 'wb-workspace-action-controller'))) errors.push('Manifest does not list wb-workspace-action-controller module');
  if (!((manifest.modules||[]).some(m => m.id === 'wb-workspace-cloud-controller'))) errors.push('Manifest does not list wb-workspace-cloud-controller module');
  if (!((manifest.modules||[]).some(m => m.id === 'wb-export-pdf-runtime-controller'))) errors.push('Manifest does not list wb-export-pdf-runtime-controller module');
  if (!((manifest.modules||[]).some(m => m.id === 'wb-backup-restore-controller'))) errors.push('Manifest does not list wb-backup-restore-controller module');
  if (!((manifest.modules||[]).some(m => m.id === 'wb-cloud-runtime-controller'))) errors.push('Manifest does not list wb-cloud-runtime-controller module');
  for (const [name, meta] of Object.entries(manifest.files || {})) {
    const p = path.join(DIST, name);
    if (exists(p) && meta.sha256 && sha256File(p) !== meta.sha256) errors.push(`Manifest hash mismatch: ${name}`);
  }
}
const diagnostics = exists(path.join(DIST, 'phase-2b-diagnostics.json')) ? loadJson(path.join(DIST, 'phase-2b-diagnostics.json'), errors) : null;
if (diagnostics) {
  if (diagnostics.phase !== PHASE) errors.push(`Phase diagnostics phase is ${diagnostics.phase}, expected ${PHASE}`);
  if (diagnostics.summary && diagnostics.summary.modularisationComplete !== true) errors.push('Phase 2b diagnostics must mark modularisationComplete=true after L8 final completion gate');
  if (diagnostics.gates && diagnostics.gates.noTargetedPolishInjection !== true) errors.push('Phase diagnostics reports targeted polish injection still active');
  if (diagnostics.gates && diagnostics.gates.noRebuild817InActiveDist !== true) errors.push('Phase diagnostics reports Rebuild_8.17 wording in active dist');
  if (diagnostics.gates && diagnostics.gates.mainShellOwnerPresent !== true) errors.push('Phase diagnostics reports missing main shell owner');
  if (diagnostics.gates && diagnostics.gates.mainShellInjected !== true) errors.push('Phase diagnostics reports main shell owner was not injected');
  if (diagnostics.gates && diagnostics.gates.staticShellParityOwnerPresent !== true) errors.push('Phase diagnostics reports missing static shell parity owner');
  if (diagnostics.gates && diagnostics.gates.staticShellParityInjected !== true) errors.push('Phase diagnostics reports static shell parity owner was not injected');
  if (diagnostics.gates && diagnostics.gates.finalHostFlipOwnerPresent !== true) errors.push('Phase diagnostics reports missing final host flip readiness owner');
  if (diagnostics.gates && diagnostics.gates.finalHostFlipInjected !== true) errors.push('Phase diagnostics reports final host flip readiness owner was not injected');
  if (diagnostics.gates && diagnostics.gates.sourceHostControllerPresent !== true) errors.push('Phase diagnostics reports missing source host owner');
  if (diagnostics.gates && diagnostics.gates.sourceHostControllerInjected !== true) errors.push('Phase diagnostics reports source host owner was not injected');
  if (diagnostics.gates && diagnostics.gates.sourceHostBuildInput !== true) errors.push('Phase diagnostics reports source host is not the build input');
  if (diagnostics.gates && diagnostics.gates.legacyHostNotActiveBuildInput !== true) errors.push('Phase diagnostics reports legacy host is still active build input');
  if (diagnostics.gates && diagnostics.gates.sourceHostNoInlineRuntime !== true) errors.push('Phase diagnostics reports source host still owns inline runtime');
  if (diagnostics.gates && diagnostics.gates.browserParitySmokeOwnerPresent !== true) errors.push('Phase diagnostics reports missing browser parity smoke owner');
  if (diagnostics.gates && diagnostics.gates.browserParitySmokeInjected !== true) errors.push('Phase diagnostics reports browser parity smoke owner was not injected');
  if (diagnostics.gates && diagnostics.gates.finalCompletionGateOwnerPresent !== true) errors.push('Phase diagnostics reports missing final completion gate owner');
  if (diagnostics.gates && diagnostics.gates.finalCompletionGateInjected !== true) errors.push('Phase diagnostics reports final completion gate owner was not injected');
  if (diagnostics.gates && diagnostics.gates.hostRuntimeAdapterOwnerPresent !== true) errors.push('Phase diagnostics reports missing host runtime adapter owner');
  if (diagnostics.gates && diagnostics.gates.hostRuntimeAdapterInjected !== true) errors.push('Phase diagnostics reports host runtime adapter was not injected');
  if (diagnostics.gates && diagnostics.gates.sharedUiComponentOwnerPresent !== true) errors.push('Phase diagnostics reports missing shared UI component owner');
  if (diagnostics.gates && diagnostics.gates.sharedUiComponentInjected !== true) errors.push('Phase diagnostics reports shared UI component owner was not injected');
  if (diagnostics.gates && diagnostics.gates.dataModelOwnerPresent !== true) errors.push('Phase diagnostics reports missing data model owner');
  if (diagnostics.gates && diagnostics.gates.dataModelInjected !== true) errors.push('Phase diagnostics reports data model owner was not injected');
  if (diagnostics.gates && diagnostics.gates.setExportModelOwnerPresent !== true) errors.push('Phase diagnostics reports missing set export model owner');
  if (diagnostics.gates && diagnostics.gates.setExportModelInjected !== true) errors.push('Phase diagnostics reports set export model owner was not injected');
  if (diagnostics.gates && diagnostics.gates.setEditorOwnerPresent !== true) errors.push('Phase diagnostics reports missing set editor owner');
  if (diagnostics.gates && diagnostics.gates.setEditorInjected !== true) errors.push('Phase diagnostics reports set editor owner was not injected');
  if (diagnostics.gates && diagnostics.gates.setEventPersistenceAdapterOwnerPresent !== true) errors.push('Phase diagnostics reports missing set event/persistence adapter owner');
  if (diagnostics.gates && diagnostics.gates.setEventPersistenceAdapterInjected !== true) errors.push('Phase diagnostics reports set event/persistence adapter owner was not injected');
  if (diagnostics.gates && diagnostics.gates.dataSafetyOwnerPresent !== true) errors.push('Phase diagnostics reports missing data safety owner');
  if (diagnostics.gates && diagnostics.gates.dataSafetyInjected !== true) errors.push('Phase diagnostics reports data safety owner was not injected');
  if (diagnostics.gates && diagnostics.gates.toolsDomOwnerPresent !== true) errors.push('Phase diagnostics reports missing Tools DOM owner');
  if (diagnostics.gates && diagnostics.gates.toolsDomInjected !== true) errors.push('Phase diagnostics reports Tools DOM owner was not injected');
  if (diagnostics.gates && diagnostics.gates.toolsSurfaceOwnerPresent !== true) errors.push('Phase diagnostics reports missing Tools concrete surface owner');
  if (diagnostics.gates && diagnostics.gates.toolsSurfaceInjected !== true) errors.push('Phase diagnostics reports Tools concrete surface owner was not injected');
  if (diagnostics.gates && diagnostics.gates.toolsStateActionOwnerPresent !== true) errors.push('Phase diagnostics reports missing Tools state/action owner');
  if (diagnostics.gates && diagnostics.gates.toolsStateActionInjected !== true) errors.push('Phase diagnostics reports Tools state/action owner was not injected');
  if (diagnostics.gates && diagnostics.gates.settingsAdminRenderOwnerPresent !== true) errors.push('Phase diagnostics reports missing Settings/Admin render owner');
  if (diagnostics.gates && diagnostics.gates.settingsAdminRenderInjected !== true) errors.push('Phase diagnostics reports Settings/Admin render owner was not injected');
  if (diagnostics.gates && diagnostics.gates.libraryControllerOwnerPresent !== true) errors.push('Phase diagnostics reports missing Library controller owner');
  if (diagnostics.gates && diagnostics.gates.libraryControllerInjected !== true) errors.push('Phase diagnostics reports Library controller owner was not injected');
  if (diagnostics.gates && diagnostics.gates.librarySongControllerOwnerPresent !== true) errors.push('Phase diagnostics reports missing Library/Song controller owner');
  if (diagnostics.gates && diagnostics.gates.librarySongControllerInjected !== true) errors.push('Phase diagnostics reports Library/Song controller owner was not injected');
  if (diagnostics.gates && diagnostics.gates.songEditorImportOwnerPresent !== true) errors.push('Phase diagnostics reports missing Song editor/import owner');
  if (diagnostics.gates && diagnostics.gates.songEditorImportInjected !== true) errors.push('Phase diagnostics reports Song editor/import owner was not injected');
  if (diagnostics.gates && diagnostics.gates.songImportDestinationOwnerPresent !== true) errors.push('Phase diagnostics reports missing Song import destination/fetch owner');
  if (diagnostics.gates && diagnostics.gates.songImportDestinationInjected !== true) errors.push('Phase diagnostics reports Song import destination/fetch owner was not injected');
  if (diagnostics.gates && diagnostics.gates.songLifecycleOwnerPresent !== true) errors.push('Phase diagnostics reports missing Song lifecycle/menu/notes/focus owner');
  if (diagnostics.gates && diagnostics.gates.songLifecycleInjected !== true) errors.push('Phase diagnostics reports Song lifecycle/menu/notes/focus owner was not injected');
  if (diagnostics.gates && diagnostics.gates.songViewRenderOwnerPresent !== true) errors.push('Phase diagnostics reports missing Song view render owner');
  if (diagnostics.gates && diagnostics.gates.songViewRenderInjected !== true) errors.push('Phase diagnostics reports Song view render owner was not injected');
  if (diagnostics.gates && diagnostics.gates.workspaceSurfaceOwnerPresent !== true) errors.push('Phase diagnostics reports missing Workspace surface owner');
  if (diagnostics.gates && diagnostics.gates.workspaceSurfaceInjected !== true) errors.push('Phase diagnostics reports Workspace surface owner was not injected');
  if (diagnostics.gates && diagnostics.gates.workspaceActionOwnerPresent !== true) errors.push('Phase diagnostics reports missing Workspace action/event owner');
  if (diagnostics.gates && diagnostics.gates.workspaceActionInjected !== true) errors.push('Phase diagnostics reports Workspace action/event owner was not injected');
  if (diagnostics.gates && diagnostics.gates.workspaceCloudOwnerPresent !== true) errors.push('Phase diagnostics reports missing Workspace cloud/runtime owner');
  if (diagnostics.gates && diagnostics.gates.workspaceCloudInjected !== true) errors.push('Phase diagnostics reports Workspace cloud/runtime owner was not injected');
  if (diagnostics.gates && diagnostics.gates.exportPdfRuntimeOwnerPresent !== true) errors.push('Phase diagnostics reports missing Export/PDF runtime owner');
  if (diagnostics.gates && diagnostics.gates.exportPdfRuntimeInjected !== true) errors.push('Phase diagnostics reports Export/PDF runtime owner was not injected');
  if (diagnostics.gates && diagnostics.gates.backupRestoreOwnerPresent !== true) errors.push('Phase diagnostics reports missing Backup/Restore residual owner');
  if (diagnostics.gates && diagnostics.gates.backupRestoreInjected !== true) errors.push('Phase diagnostics reports Backup/Restore residual owner was not injected');
  if (diagnostics.gates && diagnostics.gates.cloudRuntimeOwnerPresent !== true) errors.push('Phase diagnostics reports missing Cloud runtime owner');
  if (diagnostics.gates && diagnostics.gates.cloudRuntimeInjected !== true) errors.push('Phase diagnostics reports Cloud runtime owner was not injected');
}
console.log(`WorshipBase ${PHASE} release preflight`);
console.log('Runtime outputs:');
for (const p of REQUIRED_RUNTIME) console.log(`- ${rel(p)} ${exists(p) ? 'OK' : 'MISSING'}`);
if (warnings.length) {
  console.log('\nWarnings:');
  warnings.forEach(w => console.log(`- ${w}`));
}
if (errors.length) {
  console.error('\nErrors:');
  errors.forEach(e => console.error(`- ${e}`));
  process.exit(1);
}
console.log('\nPreflight passed.');
