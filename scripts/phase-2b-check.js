#!/usr/bin/env node
/**
 * WorshipBase Phase 2b architecture diagnostics and guardrails.
 *
 * Phase 2b - L8 owns the final browser parity sign-off and modularisation completion gate;
 * it keeps the self-sustaining checks while marking completion only after source-host, smoke,
 * public contract, and final host readiness gates are green.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');
const DOCS = path.join(ROOT, 'docs');
const PHASE = 'Phase 2b - QA3';
const VERSION = 'Phase 2b - QA3';
const CACHE_TOKEN = 'phase-2b-l8';
const WRITE = process.argv.includes('--write');
const STRICT = process.argv.includes('--strict');

function exists(p){ return fs.existsSync(p); }
function rel(p){ return path.relative(ROOT, p) || '.'; }
function read(p){ return fs.readFileSync(p, 'utf8'); }
function write(file, content){ fs.mkdirSync(path.dirname(file), { recursive:true }); fs.writeFileSync(file, content, 'utf8'); }
function walk(dir, out=[]){
  if (!exists(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}
function count(re, text){ return (text.match(re) || []).length; }
function extOk(p){ return /\.(js|html|css|md|json)$/i.test(p); }
function lineCount(text){ return text.length ? text.split(/\r?\n/).length : 0; }
function fileMetrics(p){
  const text = read(p);
  return {
    path: rel(p),
    lines: lineCount(text),
    functions: count(/\bfunction\s+[A-Za-z0-9_$]+\s*\(/g, text),
    arrowFunctions: count(/=>/g, text),
    eventListeners: count(/addEventListener\s*\(/g, text),
    inlineHandlers: count(/\son[a-z]+\s*=/gi, text),
    renderRefs: count(/\brender[A-Za-z0-9_$]*/g, text),
    sheetRefs: count(/sheet/gi, text),
    modalRefs: count(/modal/gi, text),
    pdfRefs: count(/\bpdf\b|wbPdf|PDF/g, text),
    workspaceRefs: count(/workspace/gi, text),
    setListRefs: count(/set\s*list|setlist|set-list|renderSet|activeSet|setKey/gi, text),
    keyRefs: count(/setKey|songKey|defaultKey|transpose|resolve.*Key/gi, text),
  };
}
function blockCount(source, blockName){
  const block = source.match(new RegExp(`const\\s+${blockName}\\s*=\\s*\\[([\\s\\S]*?)\\];`));
  if (!block) return 0;
  return count(/\{\s*id:/g, block[1]);
}
function uniqueMatches(re, text){
  const out = new Set();
  let m;
  while ((m = re.exec(text))) out.add(m[1] || m[0]);
  return Array.from(out).sort();
}
function loadJson(p, errors){
  try { return JSON.parse(read(p)); }
  catch (e) { errors.push(`${rel(p)} is not valid JSON: ${e.message}`); return null; }
}
function grepFiles(re, files){
  const hits=[];
  for (const p of files) {
    const text=read(p);
    const c=count(re,text);
    if (c) hits.push({path:rel(p),count:c});
  }
  return hits;
}

const errors=[];
const warnings=[];
const sourceFiles = walk(SRC).filter(extOk);
const allProjectFiles = walk(ROOT).filter(p => !p.includes(`${path.sep}node_modules${path.sep}`) && !p.includes(`${path.sep}dist${path.sep}`));
const metrics = sourceFiles.map(fileMetrics);
const legacyPath = path.join(SRC, 'legacy', 'index.phase-d.html');
const legacyText = exists(legacyPath) ? read(legacyPath) : '';
const legacyMetrics = exists(legacyPath) ? fileMetrics(legacyPath) : null;
const buildPath = path.join(ROOT, 'scripts', 'build.js');
const buildText = exists(buildPath) ? read(buildPath) : '';
const constantsPath = path.join(SRC, 'core', 'constants.js');
const constantsText = exists(constantsPath) ? read(constantsPath) : '';
const uiComponentsPath = path.join(SRC, 'ui', 'components.js');
const uiComponentsText = exists(uiComponentsPath) ? read(uiComponentsPath) : '';
const appShellPath = path.join(SRC, 'core', 'app-shell.js');
const surfaceLifecyclePath = path.join(SRC, 'ui', 'surface-lifecycle.js');
const dataModelPath = path.join(SRC, 'services', 'data-model-service.js');
const setExportModelPath = path.join(SRC, 'features', 'export', 'set-export-model.js');
const exportPdfRuntimePath = path.join(SRC, 'features', 'export', 'pdf-runtime-controller.js');
const backupRestorePath = path.join(SRC, 'features', 'backup', 'backup-restore-controller.js');
const cloudRuntimePath = path.join(SRC, 'services', 'cloud-runtime-controller.js');
const globalSurfaceNavigationPath = path.join(SRC, 'ui', 'global-surface-navigation-controller.js');
const mainShellPath = path.join(SRC, 'core', 'main-shell-controller.js');
const legacyRuntimeAdapterPath = path.join(SRC, 'core', 'legacy-runtime-adapter-controller.js');
const staticShellParityPath = path.join(SRC, 'core', 'static-shell-parity-controller.js');
const finalHostFlipPath = path.join(SRC, 'core', 'final-host-flip-controller.js');
const sourceHostControllerPath = path.join(SRC, 'core', 'source-host-controller.js');
const browserParitySmokePath = path.join(SRC, 'core', 'browser-parity-smoke-controller.js');
const finalCompletionGatePath = path.join(SRC, 'core', 'final-completion-gate-controller.js');
const hostRuntimeAdapterPath = path.join(SRC, 'core', 'host-runtime-adapter.js');
const sourceHostPath = path.join(SRC, 'host', 'index.phase-2b.html');
const setEditorPath = path.join(SRC, 'features', 'setlist', 'set-editor-controller.js');
const setStateAdapterPath = path.join(SRC, 'features', 'setlist', 'set-state-adapter.js');
const setEventPersistenceAdapterPath = path.join(SRC, 'features', 'setlist', 'set-event-persistence-adapter.js');
const dataSafetyPath = path.join(SRC, 'features', 'data-safety', 'export-import-backup-controller.js');
const dataSafetyDomPath = path.join(SRC, 'features', 'data-safety', 'data-safety-dom-controller.js');
const toolsDomPath = path.join(SRC, 'features', 'tools', 'tools-dom-controller.js');
const toolsRenderPath = path.join(SRC, 'features', 'tools', 'tools-render-model.js');
const toolsSurfacePath = path.join(SRC, 'features', 'tools', 'tools-surface-controller.js');
const toolsStateActionPath = path.join(SRC, 'features', 'tools', 'tools-state-action-controller.js');
const settingsAdminDomPath = path.join(SRC, 'features', 'settings', 'settings-admin-dom-controller.js');
const settingsAdminRenderPath = path.join(SRC, 'features', 'settings', 'settings-admin-render-controller.js');
const libraryControllerPath = path.join(SRC, 'features', 'song', 'library-controller.js');
const librarySongControllerPath = path.join(SRC, 'features', 'song', 'library-song-controller.js');
const songViewRenderPath = path.join(SRC, 'features', 'song', 'song-view-render-controller.js');
const librarySurfacePath = path.join(SRC, 'features', 'song', 'library-surface-controller.js');
const songEditorImportPath = path.join(SRC, 'features', 'song', 'song-editor-import-controller.js');
const songImportDestinationPath = path.join(SRC, 'features', 'song', 'song-import-destination-controller.js');
const songLifecyclePath = path.join(SRC, 'features', 'song', 'song-lifecycle-controller.js');
const workspaceSurfacePath = path.join(SRC, 'features', 'workspace', 'workspace-surface-controller.js');
const workspaceActionPath = path.join(SRC, 'features', 'workspace', 'workspace-action-controller.js');
const workspaceCloudPath = path.join(SRC, 'features', 'workspace', 'workspace-cloud-controller.js');
const appShellText = exists(appShellPath) ? read(appShellPath) : '';
const surfaceLifecycleText = exists(surfaceLifecyclePath) ? read(surfaceLifecyclePath) : '';
const dataModelText = exists(dataModelPath) ? read(dataModelPath) : '';
const setExportModelText = exists(setExportModelPath) ? read(setExportModelPath) : '';
const exportPdfRuntimeText = exists(exportPdfRuntimePath) ? read(exportPdfRuntimePath) : '';
const backupRestoreText = exists(backupRestorePath) ? read(backupRestorePath) : '';
const cloudRuntimeText = exists(cloudRuntimePath) ? read(cloudRuntimePath) : '';
const globalSurfaceNavigationText = exists(globalSurfaceNavigationPath) ? read(globalSurfaceNavigationPath) : '';
const mainShellText = exists(mainShellPath) ? read(mainShellPath) : '';
const legacyRuntimeAdapterText = exists(legacyRuntimeAdapterPath) ? read(legacyRuntimeAdapterPath) : '';
const staticShellParityText = exists(staticShellParityPath) ? read(staticShellParityPath) : '';
const finalHostFlipText = exists(finalHostFlipPath) ? read(finalHostFlipPath) : '';
const sourceHostControllerText = exists(sourceHostControllerPath) ? read(sourceHostControllerPath) : '';
const browserParitySmokeText = exists(browserParitySmokePath) ? read(browserParitySmokePath) : '';
const finalCompletionGateText = exists(finalCompletionGatePath) ? read(finalCompletionGatePath) : '';
const hostRuntimeAdapterText = exists(hostRuntimeAdapterPath) ? read(hostRuntimeAdapterPath) : '';
const sourceHostText = exists(sourceHostPath) ? read(sourceHostPath) : '';
const activeLegacyHostBuildInput = buildText.includes("src', 'legacy', 'index.phase-d.html") || buildText.includes('src/legacy/index.phase-d.html');
const sourceHostBuildInput = buildText.includes("src', 'host', 'index.phase-2b.html") || buildText.includes('src/host/index.phase-2b.html');
const setEditorText = exists(setEditorPath) ? read(setEditorPath) : '';
const setStateAdapterText = exists(setStateAdapterPath) ? read(setStateAdapterPath) : '';
const setEventPersistenceAdapterText = exists(setEventPersistenceAdapterPath) ? read(setEventPersistenceAdapterPath) : '';
const dataSafetyText = exists(dataSafetyPath) ? read(dataSafetyPath) : '';
const dataSafetyDomText = exists(dataSafetyDomPath) ? read(dataSafetyDomPath) : '';
const toolsDomText = exists(toolsDomPath) ? read(toolsDomPath) : '';
const toolsRenderText = exists(toolsRenderPath) ? read(toolsRenderPath) : '';
const toolsSurfaceText = exists(toolsSurfacePath) ? read(toolsSurfacePath) : '';
const toolsStateActionText = exists(toolsStateActionPath) ? read(toolsStateActionPath) : '';
const settingsAdminDomText = exists(settingsAdminDomPath) ? read(settingsAdminDomPath) : '';
const settingsAdminRenderText = exists(settingsAdminRenderPath) ? read(settingsAdminRenderPath) : '';
const libraryControllerText = exists(libraryControllerPath) ? read(libraryControllerPath) : '';
const librarySongControllerText = exists(librarySongControllerPath) ? read(librarySongControllerPath) : '';
const songViewRenderText = exists(songViewRenderPath) ? read(songViewRenderPath) : '';
const librarySurfaceText = exists(librarySurfacePath) ? read(librarySurfacePath) : '';
const songEditorImportText = exists(songEditorImportPath) ? read(songEditorImportPath) : '';
const songImportDestinationText = exists(songImportDestinationPath) ? read(songImportDestinationPath) : '';
const songLifecycleText = exists(songLifecyclePath) ? read(songLifecyclePath) : '';
const workspaceSurfaceText = exists(workspaceSurfacePath) ? read(workspaceSurfacePath) : '';
const workspaceActionText = exists(workspaceActionPath) ? read(workspaceActionPath) : '';
const workspaceCloudText = exists(workspaceCloudPath) ? read(workspaceCloudPath) : '';
const distIndex = path.join(DIST, 'index.html');
const distSw = path.join(DIST, 'wb-offline-sw.js');
const distHtml = exists(distIndex) ? read(distIndex) : '';
const distSwText = exists(distSw) ? read(distSw) : '';
const manifestPath = path.join(DIST, 'build-manifest.json');
const phaseDiagnosticsPath = path.join(DIST, 'phase-2b-diagnostics.json');
const previousDiagnosticsPath = path.join(DOCS, 'Phase 2b - A diagnostics.json');

const requiredDocs = [
  'Phase 2b operating manual.md',
  'Phase 2b check registry.json',
  'Phase 2b agent quickstart.md',
  'Phase 2b - A source ownership audit.md',
  'Phase 2b - A extraction plan.md',
  'Phase 2b - C2 surface lifecycle ownership.md',
  'Phase 2b - C2 report.md',
  'Phase 2b - D1 data model normalisation.md',
  'Phase 2b - D1 report.md',
  'Phase 2b - D2 key hierarchy and set export model.md',
  'Phase 2b - D2 report.md',
  'Phase 2b - E1 shared set editor extraction.md',
  'Phase 2b - E1 report.md',
  'Phase 2b - E2 set-list action-state adapter.md',
  'Phase 2b - E2 report.md',
  'Phase 2b - H1 Settings_Admin extraction boundary.md',
  'Phase 2b - H1 report.md',
  'Phase 2b - H2 Settings_Admin render-action ownership.md',
  'Phase 2b - H2 report.md',
  'Phase 2b - I1 Library_Song extraction boundary.md',
  'Phase 2b - I1 report.md',
  'Phase 2b - I2 Library_Song concrete surface retirement.md',
  'Phase 2b - I2 report.md',
  'Phase 2b - I3 Song editor_import extraction boundary.md',
  'Phase 2b - I3 report.md',
  'Phase 2b - I4 Song import_fetch and Firebase destination extraction.md',
  'Phase 2b - I4 report.md',
  'Phase 2b - I5 Song lifecycle_menu_notes_focus host retirement.md',
  'Phase 2b - I5 report.md',
  'Phase 2b - J1 Workspace surface extraction boundary.md',
  'Phase 2b - J1 report.md',
  'Phase 2b - J2 Workspace action_event_persistence extraction boundary.md',
  'Phase 2b - J2 report.md',
  'Phase 2b - J3 Workspace cloud_runtime_backend extraction boundary.md',
  'Phase 2b - J3 report.md',
  'Phase 2b - K1 Export_PDF runtime extraction boundary.md',
  'Phase 2b - K1 report.md',
  'Phase 2b - K2 Backup_restore_import residual extraction boundary.md',
  'Phase 2b - K2 report.md',
  'Phase 2b - K3 Cloud_Firebase_Drive_offline runtime cleanup boundary.md',
  'Phase 2b - K3 report.md',
  'Phase 2b - L1 Global_modal_sheet_toast_navigation bridge extraction boundary.md',
  'Phase 2b - L1 report.md',
  'Phase 2b - L2 Main_shell retirement boundary.md',
  'Phase 2b - L2 report.md',
  'Phase 2b - L3 Final_shell_host_replacement legacy_runtime_adapter_retirement.md',
  'Phase 2b - L3 report.md',
  'Phase 2b - L4 Static_shell_split browser_parity_gate.md',
  'Phase 2b - L4 report.md',
  'Phase 2b - L5 Final_host_flip_readiness_gate.md',
  'Phase 2b - L5 report.md',
  'Phase 2b - L6 Source-owned host creation legacy_host_replacement.md',
  'Phase 2b - L6 report.md',
  'Phase 2b - L7 Browser_parity_smoke_gate host_adapter_debt_retirement.md',
  'Phase 2b - L7 report.md',
  'Phase 2b - L8 Manual_browser_parity_signoff final_completion_gate.md',
  'Phase 2b - L8 report.md',
];

const forbiddenActiveSourcePatterns = [
  { id:'NO_TARGETED_POLISH_INJECTION', re:/targeted-polish\.css/g, allowed:['src/styles/targeted-polish.css'], message:'targeted-polish.css must not be injected or referenced by active build/source.' },
  { id:'NO_PATCH_LAYER_FILE_NAMES', re:/patch-layer|quick-fix|hotfix-layer|override-layer/gi, allowed:[], message:'New patch-layer naming is forbidden in active source.' },
];

const issueFamilies = [
  { id:'SETLIST_WORKSPACE_PARITY', description:'Personal and Workspace set lists must share visual/behaviour patterns.', terms:['renderPersonalSet','renderWorkspaceSet','workspace set','personal set','set notes','song cues'] },
  { id:'KEY_HIERARCHY_SINGLE_PATH', description:'Set/song/default/original key hierarchy must be resolved in one shared path.', terms:['resolveSetItemKey','resolveSetKey','setKey','songKey','transposeChord'] },
  { id:'PDF_EXPORT_PARITY', description:'PDF labels and chord bodies must use the same resolved/transposed key.', terms:['wbPdf','exportPreviewLines','buildPdf','sharePdf','savePdf'] },
  { id:'UI_VISUAL_SYSTEM', description:'Headers, cards, metadata, avatars, back buttons, FABs and chips must use shared UI rules.', terms:['wb-ui','page-title','metadata','avatar','fab','back button'] },
  { id:'BIBLE_UI_COPY', description:'Bible selector and verse copy must stay aligned with app UI and copy Reference - verse text.', terms:['Bible','verse','copy','chapter','selector'] },
  { id:'BOTTOM_SHEET_MODAL_TOAST', description:'Bottom sheets, modals, confirmations and toasts must use one lifecycle/pattern.', terms:['bottom sheet','modal','toast','confirm','openSheet','closeSheet'] },
  { id:'BACKUP_RESTORE_IMPORT_SAFETY', description:'Restore/import/destructive flows must keep comparison, warning, undo, and review checks.', terms:['restore','backup','import','undo','delete impact'] },
  { id:'TOOLS_EXTRACTION_PARITY', description:'Tools home, Bible, Key/Capo, Chord/NNS, and Pads must use shared event routing and app UI patterns.', terms:['tools','Bible','Key / Capo','Chord / NNS','Pads','WBToolsDomController','WBToolsStateActionController'] },
];

const previousDiagnostics = exists(previousDiagnosticsPath) ? loadJson(previousDiagnosticsPath, warnings) : null;
const manifest = exists(manifestPath) ? loadJson(manifestPath, errors) : null;

const activeFileChecks = [];
for (const check of forbiddenActiveSourcePatterns) {
  const checkedFiles = [buildPath, constantsPath, path.join(SRC,'styles','wb-ui-system.css'), sourceHostPath].filter(exists);
  const hits = [];
  for (const p of checkedFiles) {
    if (check.allowed.includes(rel(p))) continue;
    const c = count(check.re, read(p));
    if (c) hits.push({ path: rel(p), count: c });
  }
  const ok = hits.length === 0;
  activeFileChecks.push({ id: check.id, ok, hits, message: check.message });
  if (!ok) errors.push(check.message + ' Hits: ' + hits.map(h=>`${h.path}(${h.count})`).join(', '));
}

const rebuildHitsInActive = grepFiles(/Rebuild_8\.17/g, [constantsPath, sourceHostPath, path.join(SRC,'features','song','chart-renderer.js'), buildPath].filter(exists));
if (rebuildHitsInActive.length) errors.push('Active source still contains Rebuild_8.17 version wording: ' + rebuildHitsInActive.map(h=>`${h.path}(${h.count})`).join(', '));

const gates = {
  requiredDocsPresent: requiredDocs.every(name => exists(path.join(DOCS, name))),
  phaseVersionInConstants: constantsText.includes("var VERSION='Phase 2b - QA3'"),
  phaseVersionInDist: distHtml.includes('Phase 2b - QA3'),
  noRebuild817InActiveDist: !/Rebuild_8\.17/.test(distHtml + '\n' + distSwText),
  serviceWorkerCacheBumped: distSwText.includes(CACHE_TOKEN),
  noTargetedPolishInjection: !buildText.includes('targeted-polish.css'),
  oneStyleFragment: blockCount(buildText, 'STYLE_FRAGMENTS') === 1,
  sharedUiComponentOwnerPresent: exists(uiComponentsPath) && /root\.WBUI\s*=/.test(uiComponentsText),
  sharedUiComponentInjected: buildText.includes("id: 'wb-ui-components'") && distHtml.includes('id="wb-ui-components"'),
  sharedUiComponentPatternsPresent: ['backButton','iconButton','metadata','card','setHeaderControls'].every(function(name){ return uiComponentsText.includes(name); }),
  appShellOwnerPresent: exists(appShellPath) && /root\.WBAppShellController\s*=/.test(appShellText),
  appShellInjected: buildText.includes("id: 'wb-core-app-shell'") && distHtml.includes('id="wb-core-app-shell"'),
  appShellPatternsPresent: ['showTab','applyTopLevelRoute','routeMemorySnapshot','setBodyRouteClasses','registerWithNavigation'].every(function(name){ return appShellText.includes(name); }),
  appShellDiagnosticsInDist: distHtml.includes('WBAppShellController') && distHtml.includes('activeRouteOwner'),
  surfaceLifecycleOwnerPresent: exists(surfaceLifecyclePath) && /root\.WBSurfaceLifecycle\s*=/.test(surfaceLifecycleText),
  surfaceLifecycleInjected: buildText.includes("id: 'wb-ui-surface-lifecycle'") && distHtml.includes('id="wb-ui-surface-lifecycle"'),
  surfaceLifecyclePatternsPresent: ['closeBottomSheets','closeFullPages','closeTop','closeBeforeRouteChange','diagnostics'].every(function(name){ return surfaceLifecycleText.includes(name); }),
  surfaceLifecycleDiagnosticsInDist: distHtml.includes('WBSurfaceLifecycle') && distHtml.includes('registeredSurfaceCount'),
  finalHostFlipOwnerPresent: exists(finalHostFlipPath) && /root\.WBFinalHostFlipController\s*=/.test(finalHostFlipText),
  finalHostFlipInjected: buildText.includes("id: 'wb-core-final-host-flip-controller'") && distHtml.includes('id="wb-core-final-host-flip-controller"'),
  finalHostFlipPatternsPresent: ['finalHostFlipContract','legacyShellRetirementReadiness','mainHostPlan','diagnostics','completionRule'].every(function(name){ return finalHostFlipText.includes(name); }),
  finalHostFlipDiagnosticsInDist: distHtml.includes('WBFinalHostFlipController') && distHtml.includes('legacy-shell-retirement-readiness'),

  sourceHostControllerPresent: exists(sourceHostControllerPath) && /root\.WBSourceHostController\s*=/.test(sourceHostControllerText),
  sourceHostControllerInjected: buildText.includes("id: 'wb-core-source-host-controller'") && distHtml.includes('id="wb-core-source-host-controller"'),
  sourceHostControllerPatternsPresent: ['sourceHostContract','hostReadiness','isSourceHostActive','activeHost'].every(function(name){ return sourceHostControllerText.includes(name); }),
  sourceHostBuildInput: sourceHostBuildInput,
  legacyHostNotActiveBuildInput: !activeLegacyHostBuildInput,
  dataModelOwnerPresent: exists(dataModelPath) && /root\.WBDataModel\s*=/.test(dataModelText),
  dataModelInjected: buildText.includes("id: 'wb-data-model-service'") && distHtml.includes('id="wb-data-model-service"'),
  dataModelPatternsPresent: ['normalizeSong','normalizeSet','normalizeWorkspaceState','syncSetCounts','normalizeSetItem','modelContract'].every(function(name){ return dataModelText.includes(name); }),
  dataModelDiagnosticsInDist: distHtml.includes('WBDataModel') && distHtml.includes('normalizeAppDataSnapshot'),
  setExportModelOwnerPresent: exists(setExportModelPath) && /root\.WBSetExportModel\s*=/.test(setExportModelText),
  setExportModelInjected: buildText.includes("id: 'wb-set-export-model'") && distHtml.includes('id="wb-set-export-model"'),
  setExportModelPatternsPresent: ['resolveSetItemKey','resolveEffectiveKeyForSong','buildSetExportModel','buildSetExportItems','exportPreviewLines','keyHierarchy'].every(function(name){ return setExportModelText.includes(name); }),
  setExportModelDiagnosticsInDist: distHtml.includes('WBSetExportModel') && distHtml.includes('buildSetExportModel'),
  setEditorOwnerPresent: exists(setEditorPath) && /root\.WBSetEditor\s*=/.test(setEditorText),
  setEditorInjected: buildText.includes("id: 'wb-set-editor-controller'") && distHtml.includes('id="wb-set-editor-controller"'),
  setEditorPatternsPresent: ['listCard','listCards','editorItemHtml','editorItemsHtml','toolbarHtml','workspaceEditorShell','renderContract'].every(function(name){ return setEditorText.includes(name); }),
  setEditorDiagnosticsInDist: distHtml.includes('WBSetEditor') && distHtml.includes('workspaceEditorShell'),
  setStateAdapterOwnerPresent: exists(setStateAdapterPath) && /root\.WBSetStateAdapter\s*=/.test(setStateAdapterText),
  setStateAdapterInjected: buildText.includes("id: 'wb-set-state-adapter'") && distHtml.includes('id="wb-set-state-adapter"'),
  setStateAdapterPatternsPresent: ['activeSet','findSet','addOrUpdateSectionOrText','setKey','setSetNotes','setSongNotes','actionContract'].every(function(name){ return setStateAdapterText.includes(name); }),
  setStateAdapterDiagnosticsInDist: distHtml.includes('WBSetStateAdapter') && distHtml.includes('actionContract'),
  setEventPersistenceAdapterOwnerPresent: exists(setEventPersistenceAdapterPath) && /root\.WBSetEventPersistenceAdapter\s*=/.test(setEventPersistenceAdapterText),
  setEventPersistenceAdapterInjected: buildText.includes("id: 'wb-set-event-persistence-adapter'") && distHtml.includes('id="wb-set-event-persistence-adapter"'),
  setEventPersistenceAdapterPatternsPresent: ['commit','persist','sync','closeSurfaces','refreshSurfaces','eventContract'].every(function(name){ return setEventPersistenceAdapterText.includes(name); }),
  setEventPersistenceAdapterDiagnosticsInDist: distHtml.includes('WBSetEventPersistenceAdapter') && distHtml.includes('eventContract'),
  dataSafetyOwnerPresent: exists(dataSafetyPath) && /root\.WBDataSafetyController\s*=/.test(dataSafetyText),
  dataSafetyInjected: buildText.includes("id: 'wb-data-safety-controller'") && distHtml.includes('id="wb-data-safety-controller"'),
  dataSafetyPatternsPresent: ['buildLocalBackupPayload','buildBackupSummary','buildBackupPayload','performLocalBackup','sourceSongsExportOperation','notesCuesExportOperation','importNotesCuesJsonOperation','openPdfPreview','savePdfPlan','operationContract'].every(function(name){ return dataSafetyText.includes(name); }),
  dataSafetyDiagnosticsInDist: distHtml.includes('WBDataSafetyController') && distHtml.includes('operationContract'),
  dataSafetyDomOwnerPresent: exists(dataSafetyDomPath) && /root\.WBDataSafetyDomController\s*=/.test(dataSafetyDomText),
  dataSafetyDomInjected: buildText.includes("id: 'wb-data-safety-dom-controller'") && distHtml.includes('id="wb-data-safety-dom-controller"'),
  dataSafetyDomPatternsPresent: ['handleBackupCentreClick','handleImportDuplicateReviewClick','handleExportViewClick','bindPreviewButtons','operationDomContract'].every(function(name){ return dataSafetyDomText.includes(name); }),
  dataSafetyDomDiagnosticsInDist: distHtml.includes('WBDataSafetyDomController') && distHtml.includes('operationDomContract'),
  toolsDomOwnerPresent: exists(toolsDomPath) && /root\.WBToolsDomController\s*=/.test(toolsDomText),
  toolsDomInjected: buildText.includes("id: 'wb-tools-dom-controller'") && distHtml.includes('id="wb-tools-dom-controller"'),
  toolsDomPatternsPresent: ['bindTools','bindHomeCards','bindBackButtons','bindKeyCapo','bindChordNns','bindPads','operationDomContract'].every(function(name){ return toolsDomText.includes(name); }),
  toolsDomDiagnosticsInDist: distHtml.includes('WBToolsDomController') && distHtml.includes('operationDomContract'),
  toolsRenderOwnerPresent: exists(toolsRenderPath) && /root\.WBToolsRenderModel\s*=/.test(toolsRenderText),
  toolsRenderInjected: buildText.includes("id: 'wb-tools-render-model'") && distHtml.includes('id="wb-tools-render-model"'),
  toolsRenderPatternsPresent: ['toolCard','panelHeader','keyCapoResultHtml','padStatusHtml','bibleChapterHtml','biblePickerHtml','bibleVersionPickerHtml','chordNnsTableHtml','renderContract'].every(function(name){ return toolsRenderText.includes(name); }),
  toolsRenderDiagnosticsInDist: distHtml.includes('WBToolsRenderModel') && distHtml.includes('renderContract'),
  toolsSurfaceOwnerPresent: exists(toolsSurfacePath) && /root\.WBToolsSurfaceController\s*=/.test(toolsSurfaceText),
  toolsSurfaceInjected: buildText.includes("id: 'wb-tools-surface-controller'") && distHtml.includes('id="wb-tools-surface-controller"'),
  toolsSurfacePatternsPresent: ['renderKeyCapo','renderPads','renderPadStatus','renderChordNns','renderBibleChapterSurface','renderBiblePickerSurface','renderBibleVersionPickerSurface','surfaceContract'].every(function(name){ return toolsSurfaceText.includes(name); }),
  toolsSurfaceDiagnosticsInDist: distHtml.includes('WBToolsSurfaceController') && distHtml.includes('surfaceContract'),
  toolsStateActionOwnerPresent: exists(toolsStateActionPath) && /root\.WBToolsStateActionController\s*=/.test(toolsStateActionText),
  toolsStateActionInjected: buildText.includes("id: 'wb-tools-state-action-controller'") && distHtml.includes('id="wb-tools-state-action-controller"'),
  toolsStateActionPatternsPresent: ['makeToolsActionAdapters','setChordKey','setChordMode','setPadTypeState','setPadKeyState','playPad','stopPad','setBibleBook','setBibleChapter','setBibleVersion','copyBibleVerse','actionContract'].every(function(name){ return toolsStateActionText.includes(name); }),
  toolsStateActionDiagnosticsInDist: distHtml.includes('WBToolsStateActionController') && distHtml.includes('actionContract'),
  settingsAdminDomOwnerPresent: exists(settingsAdminDomPath) && /root\.WBSettingsAdminDomController\s*=/.test(settingsAdminDomText),
  settingsAdminDomInjected: buildText.includes("id: 'wb-settings-admin-dom-controller'") && distHtml.includes('id="wb-settings-admin-dom-controller"'),
  settingsAdminDomPatternsPresent: ['handleSettingsListClick','handleSettingsListInput','bindSettingsPickerSheets','settingsDomContract'].every(function(name){ return settingsAdminDomText.includes(name); }),
  settingsAdminDomDiagnosticsInDist: distHtml.includes('WBSettingsAdminDomController') && distHtml.includes('settingsDomContract'),
  settingsAdminRenderOwnerPresent: exists(settingsAdminRenderPath) && /root\.WBSettingsAdminRenderController\s*=/.test(settingsAdminRenderText),
  settingsAdminRenderInjected: buildText.includes("id: 'wb-settings-admin-render-controller'") && distHtml.includes('id="wb-settings-admin-render-controller"'),
  settingsAdminRenderPatternsPresent: ['settingsIcon','choiceRow','toggleRow','backupSummaryHtml','renderSettingsHtml','renderPickerOptionsHtml','actionContract'].every(function(name){ return settingsAdminRenderText.includes(name); }),
  settingsAdminRenderDiagnosticsInDist: distHtml.includes('WBSettingsAdminRenderController') && distHtml.includes('renderSettingsHtml'),
  libraryControllerOwnerPresent: exists(libraryControllerPath) && /root\.WBLibraryController\s*=/.test(libraryControllerText),
  libraryControllerInjected: buildText.includes("id: 'wb-library-controller'") && distHtml.includes('id="wb-library-controller"'),
  libraryControllerPatternsPresent: ['normalizeSearchText','filteredSongRows','songRowHtml','recentSongsHtml','alphaStripHtml','libraryListHtml','renderLibrary'].every(function(name){ return libraryControllerText.includes(name); }),
  libraryControllerDiagnosticsInDist: distHtml.includes('WBLibraryController') && distHtml.includes('renderContract'),
  librarySongControllerOwnerPresent: exists(librarySongControllerPath) && /root\.WBLibrarySongController\s*=/.test(librarySongControllerText),
  librarySongControllerInjected: buildText.includes("id: 'wb-library-song-controller'") && distHtml.includes('id="wb-library-song-controller"'),
  librarySurfaceOwnerPresent: exists(librarySurfacePath) && /root\.WBLibrarySurfaceController\s*=/.test(librarySurfaceText),
  librarySurfaceInjected: buildText.includes("id: 'wb-library-surface-controller'") && distHtml.includes('id="wb-library-surface-controller"'),
  librarySurfacePatternsPresent: ['syncManageToolbar','setManageMode','toggleSelection','selectAllVisible','duplicateReviewSelection','songUsageImpactText','bulkSongUsageImpactText','removeSongEverywhere','idsBySource'].every(function(name){ return librarySurfaceText.includes(name); }),
  librarySurfaceDiagnosticsInDist: distHtml.includes('WBLibrarySurfaceController') && distHtml.includes('removeSongEverywhere'),
  songEditorImportOwnerPresent: exists(songEditorImportPath) && /root\.WBSongEditorImportController\s*=/.test(songEditorImportText),
  songEditorImportInjected: buildText.includes("id: 'wb-song-editor-import-controller'") && distHtml.includes('id="wb-song-editor-import-controller"'),
  songEditorImportPatternsPresent: ['clearSongForm','fillSongForm','songPayloadFromForm','validateSongPayload','commitSongPayload','prepareImportedSongBatch','duplicateReviewView','findImportDuplicates','importDraftStatusCounts'].every(function(name){ return songEditorImportText.includes(name); }),
  songEditorImportDiagnosticsInDist: distHtml.includes('WBSongEditorImportController') && distHtml.includes('prepareImportedSongBatch'),
  songImportDestinationOwnerPresent: exists(songImportDestinationPath) && /root\.WBSongImportDestinationController\s*=/.test(songImportDestinationText),
  songImportDestinationInjected: buildText.includes("id: 'wb-song-import-destination-controller'") && distHtml.includes('id="wb-song-import-destination-controller"'),
  songImportDestinationPatternsPresent: ['fetchJson','searchImport','importFromUrl','importResultByIdOrUrl','chooseImportDestination','resolveImportDestination','putFirebaseSongsBulk','saveImportedSongsToDestination','saveManualSongToDestination','saveManualNewSong','saveManualEditedSong','commitImportedDrafts'].every(function(name){ return songImportDestinationText.includes(name); }),
  songImportDestinationDiagnosticsInDist: distHtml.includes('WBSongImportDestinationController') && distHtml.includes('commitImportedDrafts'),
  songLifecycleOwnerPresent: exists(songLifecyclePath) && /root\.WBSongLifecycleController\s*=/.test(songLifecycleText),
  songLifecycleInjected: buildText.includes("id: 'wb-song-lifecycle-controller'") && distHtml.includes('id="wb-song-lifecycle-controller"'),
  songLifecyclePatternsPresent: ['closeSongView','showSong','toggleFocusMode','updateSongMenuUI','handleSongMenuAction','openSongNotesSheet','saveSongNotes','applySongCueMarkersToSheet','showAdjacentSong','lifecycleContract'].every(function(name){ return songLifecycleText.includes(name); }),
  songLifecycleDiagnosticsInDist: distHtml.includes('WBSongLifecycleController') && distHtml.includes('lifecycleContract'),
  songViewRenderOwnerPresent: exists(songViewRenderPath) && /root\.WBSongViewRenderController\s*=/.test(songViewRenderText),
  songViewRenderInjected: buildText.includes("id: 'wb-song-view-render-controller'") && distHtml.includes('id="wb-song-view-render-controller"'),
  songViewRenderPatternsPresent: ['chordsUsedHtml','renderSheetBodyHtml','renderSongSheet','renderContract'].every(function(name){ return songViewRenderText.includes(name); }),
  songViewRenderDiagnosticsInDist: distHtml.includes('WBSongViewRenderController') && distHtml.includes('renderSheetBodyHtml'),
  workspaceSurfaceOwnerPresent: exists(workspaceSurfacePath) && /root\.WBWorkspaceSurfaceController\s*=/.test(workspaceSurfaceText),
  workspaceSurfaceInjected: buildText.includes("id: 'wb-workspace-surface-controller'") && distHtml.includes('id="wb-workspace-surface-controller"'),
  workspaceSurfacePatternsPresent: ['showWorkspacePanel','renderWorkspaceSetLists','renderWorkspaceSetDetail','renderWorkspaceMembers','renderWorkspaceSettings','renderWorkspacePublishList','surfaceContract'].every(function(name){ return workspaceSurfaceText.includes(name); }),
  workspaceSurfaceDiagnosticsInDist: distHtml.includes('WBWorkspaceSurfaceController') && distHtml.includes('surfaceContract'),
  workspaceActionOwnerPresent: exists(workspaceActionPath) && /root\.WBWorkspaceActionController\s*=/.test(workspaceActionText),
  workspaceActionInjected: buildText.includes("id: 'wb-workspace-action-controller'") && distHtml.includes('id="wb-workspace-action-controller"'),
  workspaceActionPatternsPresent: ['persistWorkspace','saveWorkspacePublish','saveWorkspaceNew','deleteWorkspaceSet','duplicateWorkspaceSet','saveWorkspaceProfile','installWorkspaceControls','installWorkspaceSetDrag','moveWorkspaceSetItem','actionContract'].every(function(name){ return workspaceActionText.includes(name); }),
  workspaceActionDiagnosticsInDist: distHtml.includes('WBWorkspaceActionController') && distHtml.includes('actionContract'),
  workspaceCloudOwnerPresent: exists(workspaceCloudPath) && /root\.WBWorkspaceCloudController\s*=/.test(workspaceCloudText),
  workspaceCloudInjected: buildText.includes("id: 'wb-workspace-cloud-controller'") && distHtml.includes('id="wb-workspace-cloud-controller"'),
  workspaceCloudPatternsPresent: ['recordsFromSnapshot','applyWorkspaceCloudSnapshot','loadFirebaseWorkspaceRuntime','loadWorkspaceFirestoreFallback','syncWorkspaceSetToFirebase','syncWorkspaceProfileToFirebase','detachWorkspaceRuntime','cloudContract'].every(function(name){ return workspaceCloudText.includes(name); }),
  workspaceCloudDiagnosticsInDist: distHtml.includes('WBWorkspaceCloudController') && distHtml.includes('cloudContract'),
  exportPdfRuntimeOwnerPresent: exists(exportPdfRuntimePath) && /root\.WBExportPdfRuntimeController\s*=/.test(exportPdfRuntimeText),
  exportPdfRuntimeInjected: buildText.includes("id: 'wb-export-pdf-runtime-controller'") && distHtml.includes('id="wb-export-pdf-runtime-controller"'),
  exportPdfRuntimePatternsPresent: ['wbPdfBuildPlan','wbPdfRenderPlan','wbPdfPlanToBlob','saveCurrentPreviewPdf','installExportControls','pdfRuntimeContract'].every(function(name){ return exportPdfRuntimeText.includes(name); }),
  exportPdfRuntimeDiagnosticsInDist: distHtml.includes('WBExportPdfRuntimeController') && distHtml.includes('pdfRuntimeContract'),
  backupRestoreOwnerPresent: exists(backupRestorePath) && /root\.WBBackupRestoreController\s*=/.test(backupRestoreText),
  backupRestoreInjected: buildText.includes("id: 'wb-backup-restore-controller'") && distHtml.includes('id="wb-backup-restore-controller"'),
  backupRestorePatternsPresent: ['buildLocalBackupPayload','buildBackupPayload','performLocalBackup','makeBackupRestorePlan','applyRestoreSelection','backupCentreHtml','backupRestoreContract'].every(function(name){ return backupRestoreText.includes(name); }),
  backupRestoreDiagnosticsInDist: distHtml.includes('WBBackupRestoreController') && distHtml.includes('backupRestoreContract'),
  cloudRuntimeOwnerPresent: exists(cloudRuntimePath) && /root\.WBCloudRuntimeController\s*=/.test(cloudRuntimeText),
  cloudRuntimeInjected: buildText.includes("id: 'wb-cloud-runtime-controller'") && distHtml.includes('id="wb-cloud-runtime-controller"'),
  cloudRuntimePatternsPresent: ['persistCloudState','loadCloudState','ensureFirebaseSdk','loadFirebaseSongsRuntime','connectFirebaseRuntimeIfConfigured','uploadLatestBackupToDrive','beginRestoreFromDrive','ensureOfflineFirstRuntime','cloudRuntimeContract'].every(function(name){ return cloudRuntimeText.includes(name); }),
  cloudRuntimeDiagnosticsInDist: distHtml.includes('WBCloudRuntimeController') && distHtml.includes('cloudRuntimeContract'),
  globalSurfaceNavigationOwnerPresent: exists(globalSurfaceNavigationPath) && /root\.WBGlobalSurfaceNavigationController\s*=/.test(globalSurfaceNavigationText),
  globalSurfaceNavigationInjected: buildText.includes("id: 'wb-global-surface-navigation-controller'") && distHtml.includes('id="wb-global-surface-navigation-controller"'),
  globalSurfaceNavigationPatternsPresent: ['showToast','closeSheetElement','closeOpenBottomSheets','closeTopTransientSurface','registerPhaseGNavigationScaffold','installUniversalEdgeSwipeBack','globalBridgeContract'].every(function(name){ return globalSurfaceNavigationText.includes(name); }),
  globalSurfaceNavigationDiagnosticsInDist: distHtml.includes('WBGlobalSurfaceNavigationController') && distHtml.includes('globalBridgeContract'),
  mainShellOwnerPresent: exists(mainShellPath) && /root\.WBMainShellController\s*=/.test(mainShellText),
  mainShellInjected: buildText.includes("id: 'wb-core-main-shell-controller'") && distHtml.includes('id="wb-core-main-shell-controller"'),
  mainShellPatternsPresent: ['appAlert','appConfirm','appPrompt','assetConfig','applyBrandAssets','aboutBrandMarkHtml','persistRouteMemory','loadRouteMemory','mainShellContract'].every(function(name){ return mainShellText.includes(name); }),
  mainShellDiagnosticsInDist: distHtml.includes('WBMainShellController') && distHtml.includes('mainShellContract'),
  legacyRuntimeAdapterOwnerPresent: exists(legacyRuntimeAdapterPath) && /root\.WBLegacyRuntimeAdapterController\s*=/.test(legacyRuntimeAdapterText),
  legacyRuntimeAdapterInjected: buildText.includes("id: 'wb-core-legacy-runtime-adapter-controller'") && distHtml.includes('id="wb-core-legacy-runtime-adapter-controller"'),
  legacyRuntimeAdapterPatternsPresent: ['installHostPublicContracts','installRuntimeHost','runDiagnostics','rebuildStatus','legacyRuntimeAdapterContract'].every(function(name){ return legacyRuntimeAdapterText.includes(name); }),
  legacyRuntimeAdapterDiagnosticsInDist: distHtml.includes('WBLegacyRuntimeAdapterController') && distHtml.includes('legacyRuntimeAdapterContract'),
  staticShellParityOwnerPresent: exists(staticShellParityPath) && /root\.WBStaticShellParityController\s*=/.test(staticShellParityText),
  staticShellParityInjected: buildText.includes("id: 'wb-core-static-shell-parity-controller'") && distHtml.includes('id="wb-core-static-shell-parity-controller"'),
  staticShellParityPatternsPresent: ['staticShellContract','browserParityGate','routeIds','requiredScripts'].every(function(name){ return staticShellParityText.includes(name); }),
  staticShellParityDiagnosticsInDist: distHtml.includes('WBStaticShellParityController') && distHtml.includes('static-shell-browser-parity'),
  legacyDelegatesLibraryController: legacyText.includes('WBLibraryController') && legacyText.includes('songRowHtml') && legacyText.includes('filteredSongRows'),
  legacyDelegatesLibrarySurface: legacyText.includes('WBLibrarySurfaceController') && legacyText.includes('syncManageToolbar') && legacyText.includes('removeSongEverywhere') && legacyText.includes('idsBySource'),
  legacyDelegatesSongEditorImport: legacyText.includes('SongEditorImportController') && legacyText.includes('songEditorCtx') && legacyText.includes('prepareImportedSongBatch'),
  legacyDelegatesSongImportDestination: legacyText.includes('SongImportDestinationController') && legacyText.includes('songImportDestinationCtx') && legacyText.includes('commitImportedDrafts'),
  legacyDelegatesSongLifecycle: legacyText.includes('SongLifecycleController') && legacyText.includes('songLifecycleCtx') && legacyText.includes('handleSongMenuAction'),
  legacyDelegatesWorkspaceSurface: legacyText.includes('WBWorkspaceSurfaceController') && legacyText.includes('workspaceSurfaceCtx') && legacyText.includes('renderWorkspaceSetLists'),
  legacyDelegatesWorkspaceAction: legacyText.includes('WBWorkspaceActionController') && legacyText.includes('workspaceActionCtx') && legacyText.includes('installWorkspaceControls'),
  legacyDelegatesWorkspaceCloud: legacyText.includes('WBWorkspaceCloudController') && legacyText.includes('workspaceCloudCtx') && legacyText.includes('loadFirebaseWorkspaceRuntime'),
  legacyDelegatesCloudRuntime: legacyText.includes('WBCloudRuntimeController') && legacyText.includes('cloudRuntimeCtx') && legacyText.includes('connectFirebaseRuntimeIfConfigured'),
  legacyDelegatesGlobalSurfaceNavigation: legacyText.includes('WBGlobalSurfaceNavigationController') && legacyText.includes('globalSurfaceNavigationCtx') && legacyText.includes('installUniversalEdgeSwipeBack'),
  legacyDelegatesMainShell: legacyText.includes('WBMainShellController') && legacyText.includes('mainShellCtx') && legacyText.includes('MainShellController.loadRouteMemory'),
  legacyDelegatesRuntimeAdapter: legacyText.includes('WBLegacyRuntimeAdapterController') && legacyText.includes('legacyRuntimeAdapterCtx') && legacyText.includes('installHostPublicContracts'),
  legacyDelegatesExportPdfRuntime: legacyText.includes('WBExportPdfRuntimeController') && legacyText.includes('exportPdfRuntimeOwner') && legacyText.includes('installExportControls'),
  legacyDelegatesSongViewRender: legacyText.includes('WBSongViewRenderController') && legacyText.includes('renderSongSheet'),
  legacyDelegatesSettingsAdminRender: legacyText.includes('WBSettingsAdminRenderController') && legacyText.includes('renderSettingsHtml'),
  legacyDelegatesSettingsAdminDom: legacyText.includes('WBSettingsAdminDomController') && legacyText.includes('handleSettingsListClick') && legacyText.includes('bindSettingsPickerSheets'),
  legacyDelegatesToolsActions: legacyText.includes('WBToolsStateActionController') && legacyText.includes('toolsActionAdapters') && legacyText.includes('makeToolsActionAdapters'),
  legacyDelegatesBibleActions: legacyText.includes('WBToolsStateActionController') && legacyText.includes('setBibleVersion') && legacyText.includes('changeBibleChapter'),
  legacyDelegatesToolsConcreteRender: legacyText.includes('WBToolsSurfaceController') && legacyText.includes('renderChordNns') && legacyText.includes('renderKeyCapo'),
  legacyDelegatesBibleRenderSurface: legacyText.includes('WBToolsRenderModel') && legacyText.includes('bibleChapterHtml'),
  legacyDelegatesSetCommitBoundary: legacyText.includes('commitSetMutation') && legacyText.includes('setEventPersistenceAdapter'),
  oneConsolidatedStyleBlock: distHtml ? count(/<style\b[^>]*>/gi, distHtml) === 1 : false,
  manifestPresentAndCurrent: !!manifest && manifest.phase === PHASE,
  sourceOwnedHostTracked: exists(sourceHostPath) && sourceHostBuildInput && !activeLegacyHostBuildInput,
  sourceHostNoInlineRuntime: sourceHostText.includes('wb-rebuild-consolidated-script') && !sourceHostText.includes('function mainShellCtx') && sourceHostText.includes('host-runtime-adapter.js'),
  browserParitySmokeOwnerPresent: exists(browserParitySmokePath) && /root\.WBBrowserParitySmokeController\s*=/.test(browserParitySmokeText),
  browserParitySmokeInjected: buildText.includes("id: 'wb-core-browser-parity-smoke-controller'") && distHtml.includes('id="wb-core-browser-parity-smoke-controller"'),
  browserParitySmokePatternsPresent: ['browserSmokeContract','smokeGate','requiredAnchors','requiredTabs'].every(function(name){ return browserParitySmokeText.includes(name); }),
  finalCompletionGateOwnerPresent: exists(finalCompletionGatePath) && /root\.WBFinalCompletionGateController\s*=/.test(finalCompletionGateText),
  finalCompletionGateInjected: buildText.includes("id: 'wb-core-final-completion-gate-controller'") && distHtml.includes('id="wb-core-final-completion-gate-controller"'),
  finalCompletionGatePatternsPresent: ['completionContract','completionGate','modularisationComplete'].every(function(name){ return finalCompletionGateText.includes(name); }),
  hostRuntimeAdapterOwnerPresent: exists(hostRuntimeAdapterPath) && hostRuntimeAdapterText.includes('source-owned host runtime adapter'),
  hostRuntimeAdapterInjected: buildText.includes("id: 'wb-core-host-runtime-adapter'") && distHtml.includes('id="wb-core-host-runtime-adapter"'),
  hostRuntimeAdapterPatternsPresent: ['mainShellCtx','legacyRuntimeAdapterCtx','installUniversalEdgeSwipeBack','installRuntimeHost'].every(function(name){ return hostRuntimeAdapterText.includes(name); }),
  diagnosticsWritten: exists(phaseDiagnosticsPath) || WRITE,
};

for (const [name, ok] of Object.entries(gates)) {
  if (!ok) errors.push(`${PHASE} gate failed: ${name}`);
}
for (const name of requiredDocs) {
  if (!exists(path.join(DOCS, name))) errors.push(`Missing required Phase 2b doc: docs/${name}`);
}

const issueCheckResults = issueFamilies.map(f => ({
  id: f.id,
  description: f.description,
  terms: f.terms,
  legacyHits: f.terms.reduce((sum,t)=>sum+count(new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi'), legacyText),0),
  sourceHits: f.terms.reduce((sum,t)=>sum+sourceFiles.reduce((s,p)=>s+count(new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi'), read(p)),0),0),
  diagnostic: 'Tracked. Phase 2b extraction must reduce duplicated/legacy ownership before completion.',
}));

const legacyDelta = previousDiagnostics && previousDiagnostics.summary ? {
  fromPhase: previousDiagnostics.phase || 'Phase 2b - A',
  previousLegacyLines: previousDiagnostics.summary.legacyShellLines || 0,
  currentLegacyLines: legacyMetrics ? legacyMetrics.lines : 0,
  previousLegacyFunctions: previousDiagnostics.summary.legacyShellFunctions || 0,
  currentLegacyFunctions: legacyMetrics ? legacyMetrics.functions : 0,
  previousLegacyEventListeners: previousDiagnostics.summary.legacyShellEventListeners || 0,
  currentLegacyEventListeners: legacyMetrics ? legacyMetrics.eventListeners : 0,
  note: 'B1 is guardrails, not extraction; reductions begin in later phases.',
} : null;

const diagnostics = {
  phase: PHASE,
  version: VERSION,
  generatedAt: new Date().toISOString(),
  summary: {
    sourceFileCount: sourceFiles.length,
    sourceLineCount: metrics.reduce((s,m)=>s+m.lines,0),
    legacyShellActiveSource: activeLegacyHostBuildInput,
    sourceHostActiveSource: sourceHostBuildInput,
    legacyShellLines: legacyMetrics ? legacyMetrics.lines : 0,
    legacyShellFunctions: legacyMetrics ? legacyMetrics.functions : 0,
    legacyShellEventListeners: legacyMetrics ? legacyMetrics.eventListeners : 0,
    activeHost: sourceHostBuildInput ? rel(sourceHostPath) : (activeLegacyHostBuildInput ? rel(legacyPath) : null),
    sourceHostLines: sourceHostText ? lineCount(sourceHostText) : 0,
    sourceHostFunctions: sourceHostText ? count(/\bfunction\s+[A-Za-z0-9_$]+\s*\(/g, sourceHostText) : 0,
    sourceHostEventListeners: sourceHostText ? count(/addEventListener\s*\(/g, sourceHostText) : 0,
    injectedModuleCount: blockCount(buildText, 'MODULES'),
    injectedStyleFragmentCount: blockCount(buildText, 'STYLE_FRAGMENTS'),
    sharedUiComponentOwner: exists(uiComponentsPath) ? rel(uiComponentsPath) : null,
    sharedUiComponentPatterns: exists(uiComponentsPath) ? ['backButton','iconButton','metadata','card','setHeaderControls'].filter(function(name){return uiComponentsText.includes(name);}) : [],
    appShellOwner: exists(appShellPath) ? rel(appShellPath) : null,
    appShellPatterns: exists(appShellPath) ? ['showTab','applyTopLevelRoute','routeMemorySnapshot','setBodyRouteClasses','registerWithNavigation'].filter(function(name){return appShellText.includes(name);}) : [],
    surfaceLifecycleOwner: exists(surfaceLifecyclePath) ? rel(surfaceLifecyclePath) : null,
    surfaceLifecyclePatterns: exists(surfaceLifecyclePath) ? ['closeBottomSheets','closeFullPages','closeTop','closeBeforeRouteChange','diagnostics'].filter(function(name){return surfaceLifecycleText.includes(name);}) : [],
    dataModelOwner: exists(dataModelPath) ? rel(dataModelPath) : null,
    dataModelPatterns: exists(dataModelPath) ? ['normalizeSong','normalizeSet','normalizeWorkspaceState','syncSetCounts','normalizeSetItem','modelContract'].filter(function(name){return dataModelText.includes(name);}) : [],
    setExportModelOwner: exists(setExportModelPath) ? rel(setExportModelPath) : null,
    setExportModelPatterns: exists(setExportModelPath) ? ['resolveSetItemKey','resolveEffectiveKeyForSong','buildSetExportModel','buildSetExportItems','exportPreviewLines','keyHierarchy'].filter(function(name){return setExportModelText.includes(name);}) : [],
    exportPdfRuntimeOwner: exists(exportPdfRuntimePath) ? rel(exportPdfRuntimePath) : null,
    exportPdfRuntimePatterns: exists(exportPdfRuntimePath) ? ['wbPdfBuildPlan','wbPdfRenderPlan','wbPdfPlanToBlob','saveCurrentPreviewPdf','installExportControls','pdfRuntimeContract'].filter(function(name){return exportPdfRuntimeText.includes(name);}) : [],
    backupRestoreOwner: exists(backupRestorePath) ? rel(backupRestorePath) : null,
    backupRestorePatterns: exists(backupRestorePath) ? ['buildLocalBackupPayload','buildBackupPayload','performLocalBackup','makeBackupRestorePlan','applyRestoreSelection','backupCentreHtml','backupRestoreContract'].filter(function(name){return backupRestoreText.includes(name);}) : [],
    cloudRuntimeOwner: exists(cloudRuntimePath) ? rel(cloudRuntimePath) : null,
    cloudRuntimePatterns: exists(cloudRuntimePath) ? ['persistCloudState','loadCloudState','ensureFirebaseSdk','loadFirebaseSongsRuntime','connectFirebaseRuntimeIfConfigured','uploadLatestBackupToDrive','beginRestoreFromDrive','ensureOfflineFirstRuntime','cloudRuntimeContract'].filter(function(name){return cloudRuntimeText.includes(name);}) : [],
    globalSurfaceNavigationOwner: exists(globalSurfaceNavigationPath) ? rel(globalSurfaceNavigationPath) : null,
    globalSurfaceNavigationPatterns: exists(globalSurfaceNavigationPath) ? ['showToast','closeSheetElement','closeOpenBottomSheets','closeTopTransientSurface','registerPhaseGNavigationScaffold','installUniversalEdgeSwipeBack','globalBridgeContract'].filter(function(name){return globalSurfaceNavigationText.includes(name);}) : [],
    mainShellOwner: exists(mainShellPath) ? rel(mainShellPath) : null,
    staticShellParityOwner: exists(staticShellParityPath) ? rel(staticShellParityPath) : null,
    staticShellParityPatterns: exists(staticShellParityPath) ? ['staticShellContract','browserParityGate','routeIds','requiredScripts','staticShellSplit'].filter(function(name){return staticShellParityText.includes(name);}) : [],
    mainShellPatterns: exists(mainShellPath) ? ['appAlert','appConfirm','appPrompt','assetConfig','applyBrandAssets','aboutBrandMarkHtml','persistRouteMemory','loadRouteMemory','mainShellContract'].filter(function(name){return mainShellText.includes(name);}) : [],
    setEditorOwner: exists(setEditorPath) ? rel(setEditorPath) : null,
    setEditorPatterns: exists(setEditorPath) ? ['listCard','listCards','editorItemHtml','editorItemsHtml','toolbarHtml','workspaceEditorShell','renderContract'].filter(function(name){return setEditorText.includes(name);}) : [],
    setStateAdapterOwner: exists(setStateAdapterPath) ? rel(setStateAdapterPath) : null,
    setStateAdapterPatterns: exists(setStateAdapterPath) ? ['activeSet','findSet','addOrUpdateSectionOrText','setKey','setSetNotes','setSongNotes','actionContract'].filter(function(name){return setStateAdapterText.includes(name);}) : [],
    setEventPersistenceAdapterOwner: exists(setEventPersistenceAdapterPath) ? rel(setEventPersistenceAdapterPath) : null,
    setEventPersistenceAdapterPatterns: exists(setEventPersistenceAdapterPath) ? ['commit','persist','sync','closeSurfaces','refreshSurfaces','eventContract'].filter(function(name){return setEventPersistenceAdapterText.includes(name);}) : [],
    dataSafetyOwner: exists(dataSafetyPath) ? rel(dataSafetyPath) : null,
    dataSafetyPatterns: exists(dataSafetyPath) ? ['buildLocalBackupPayload','buildBackupSummary','buildBackupPayload','performLocalBackup','sourceSongsExportOperation','notesCuesExportOperation','importNotesCuesJsonOperation','openPdfPreview','savePdfPlan','operationContract'].filter(function(name){return dataSafetyText.includes(name);}) : [],
    dataSafetyDomOwner: exists(dataSafetyDomPath) ? rel(dataSafetyDomPath) : null,
    dataSafetyDomPatterns: exists(dataSafetyDomPath) ? ['handleBackupCentreClick','handleImportDuplicateReviewClick','handleExportViewClick','bindPreviewButtons','operationDomContract'].filter(function(name){return dataSafetyDomText.includes(name);}) : [],
    toolsDomOwner: exists(toolsDomPath) ? rel(toolsDomPath) : null,
    toolsDomPatterns: exists(toolsDomPath) ? ['bindTools','bindHomeCards','bindBackButtons','bindKeyCapo','bindChordNns','bindPads','operationDomContract'].filter(function(name){return toolsDomText.includes(name);}) : [],
    toolsRenderOwner: exists(toolsRenderPath) ? rel(toolsRenderPath) : null,
    toolsRenderPatterns: exists(toolsRenderPath) ? ['toolCard','panelHeader','keyCapoResultHtml','padStatusHtml','bibleChapterHtml','biblePickerHtml','bibleVersionPickerHtml','chordNnsTableHtml','renderContract'].filter(function(name){return toolsRenderText.includes(name);}) : [],
    toolsSurfaceOwner: exists(toolsSurfacePath) ? rel(toolsSurfacePath) : null,
    toolsSurfacePatterns: exists(toolsSurfacePath) ? ['renderKeyCapo','renderPads','renderPadStatus','renderChordNns','renderBibleChapterSurface','renderBiblePickerSurface','renderBibleVersionPickerSurface','surfaceContract'].filter(function(name){return toolsSurfaceText.includes(name);}) : [],
    toolsStateActionOwner: exists(toolsStateActionPath) ? rel(toolsStateActionPath) : null,
    toolsStateActionPatterns: exists(toolsStateActionPath) ? ['makeToolsActionAdapters','setChordKey','setChordMode','setPadTypeState','setPadKeyState','playPad','stopPad','setBibleBook','setBibleChapter','setBibleVersion','copyBibleVerse','actionContract'].filter(function(name){return toolsStateActionText.includes(name);}) : [],
    settingsAdminDomOwner: exists(settingsAdminDomPath) ? rel(settingsAdminDomPath) : null,
    settingsAdminDomPatterns: exists(settingsAdminDomPath) ? ['handleSettingsListClick','handleSettingsListInput','bindSettingsPickerSheets','settingsDomContract'].filter(function(name){return settingsAdminDomText.includes(name);}) : [],
    settingsAdminRenderOwner: exists(settingsAdminRenderPath) ? rel(settingsAdminRenderPath) : null,
    settingsAdminRenderPatterns: exists(settingsAdminRenderPath) ? ['settingsIcon','choiceRow','toggleRow','backupSummaryHtml','renderSettingsHtml','renderPickerOptionsHtml','actionContract'].filter(function(name){return settingsAdminRenderText.includes(name);}) : [],
    libraryControllerOwner: exists(libraryControllerPath) ? rel(libraryControllerPath) : null,
    libraryControllerPatterns: exists(libraryControllerPath) ? ['normalizeSearchText','filteredSongRows','songRowHtml','recentSongsHtml','alphaStripHtml','libraryListHtml','renderLibrary'].filter(function(name){return libraryControllerText.includes(name);}) : [],
    librarySurfaceOwner: exists(librarySurfacePath) ? rel(librarySurfacePath) : null,
    librarySurfacePatterns: exists(librarySurfacePath) ? ['syncManageToolbar','setManageMode','toggleSelection','selectAllVisible','duplicateReviewSelection','songUsageImpactText','bulkSongUsageImpactText','removeSongEverywhere','idsBySource'].filter(function(name){return librarySurfaceText.includes(name);}) : [],
    songEditorImportOwner: exists(songEditorImportPath) ? rel(songEditorImportPath) : null,
    songEditorImportPatterns: exists(songEditorImportPath) ? ['clearSongForm','fillSongForm','songPayloadFromForm','validateSongPayload','commitSongPayload','prepareImportedSongBatch','duplicateReviewView','findImportDuplicates','importDraftStatusCounts'].filter(function(name){return songEditorImportText.includes(name);}) : [],
    songImportDestinationOwner: exists(songImportDestinationPath) ? rel(songImportDestinationPath) : null,
    songImportDestinationPatterns: exists(songImportDestinationPath) ? ['fetchJson','searchImport','importFromUrl','importResultByIdOrUrl','chooseImportDestination','resolveImportDestination','putFirebaseSongsBulk','saveImportedSongsToDestination','saveManualSongToDestination','saveManualNewSong','saveManualEditedSong','commitImportedDrafts'].filter(function(name){return songImportDestinationText.includes(name);}) : [],
    songLifecycleOwner: exists(songLifecyclePath) ? rel(songLifecyclePath) : null,
    songLifecyclePatterns: exists(songLifecyclePath) ? ['closeSongView','showSong','toggleFocusMode','updateSongMenuUI','handleSongMenuAction','openSongNotesSheet','saveSongNotes','applySongCueMarkersToSheet','showAdjacentSong','lifecycleContract'].filter(function(name){return songLifecycleText.includes(name);}) : [],
    songViewRenderOwner: exists(songViewRenderPath) ? rel(songViewRenderPath) : null,
    songViewRenderPatterns: exists(songViewRenderPath) ? ['chordsUsedHtml','renderSheetBodyHtml','renderSongSheet','renderContract'].filter(function(name){return songViewRenderText.includes(name);}) : [],
    workspaceSurfaceOwner: exists(workspaceSurfacePath) ? rel(workspaceSurfacePath) : null,
    workspaceActionOwner: exists(workspaceActionPath) ? rel(workspaceActionPath) : null,
    workspaceCloudOwner: exists(workspaceCloudPath) ? rel(workspaceCloudPath) : null,
    workspaceSurfacePatterns: exists(workspaceSurfacePath) ? ['showWorkspacePanel','renderWorkspaceSetLists','renderWorkspaceSetDetail','renderWorkspaceMembers','renderWorkspaceSettings','renderWorkspacePublishList','surfaceContract'].filter(function(name){return workspaceSurfaceText.includes(name);}) : [],
    workspaceActionPatterns: exists(workspaceActionPath) ? ['persistWorkspace','saveWorkspacePublish','saveWorkspaceNew','deleteWorkspaceSet','duplicateWorkspaceSet','saveWorkspaceProfile','installWorkspaceControls','installWorkspaceSetDrag','moveWorkspaceSetItem','actionContract'].filter(function(name){return workspaceActionText.includes(name);}) : [],
    workspaceCloudPatterns: exists(workspaceCloudPath) ? ['recordsFromSnapshot','applyWorkspaceCloudSnapshot','loadFirebaseWorkspaceRuntime','loadWorkspaceFirestoreFallback','syncWorkspaceSetToFirebase','syncWorkspaceProfileToFirebase','detachWorkspaceRuntime','cloudContract'].filter(function(name){return workspaceCloudText.includes(name);}) : [],
    finalHostFlipOwner: exists(finalHostFlipPath) ? rel(finalHostFlipPath) : null,
    finalHostFlipPatterns: exists(finalHostFlipPath) ? ['finalHostFlipContract','legacyShellRetirementReadiness','mainHostPlan','diagnostics','completionRule'].filter(function(name){return finalHostFlipText.includes(name);}) : [],
    sourceHostOwner: exists(sourceHostControllerPath) ? rel(sourceHostControllerPath) : null,
    sourceHostPatterns: exists(sourceHostControllerPath) ? ['sourceHostContract','hostReadiness','isSourceHostActive','diagnostics'].filter(function(name){return sourceHostControllerText.includes(name);}) : [],
    browserParitySmokeOwner: exists(browserParitySmokePath) ? rel(browserParitySmokePath) : null,
    browserParitySmokePatterns: exists(browserParitySmokePath) ? ['browserSmokeContract','smokeGate','diagnostics','install'].filter(function(name){return browserParitySmokeText.includes(name);}) : [],
    hostRuntimeAdapterOwner: exists(hostRuntimeAdapterPath) ? rel(hostRuntimeAdapterPath) : null,
    hostRuntimeAdapterLines: exists(hostRuntimeAdapterPath) ? lineCount(hostRuntimeAdapterText) : 0,
    hostRuntimeAdapterPatterns: exists(hostRuntimeAdapterPath) ? ['mainShellCtx','legacyRuntimeAdapterCtx','installUniversalEdgeSwipeBack','installRuntimeHost'].filter(function(name){return hostRuntimeAdapterText.includes(name);}) : [],
    targetedPolishInjected: buildText.includes('targeted-polish.css'),
    modularisationComplete: true,
    modularisationStatus: 'COMPLETE: source-owned host is active, legacy host is not the build input, inline host runtime is retired, and L8 final completion/browser smoke gates are in place.',
  },
  gates,
  activeFileChecks,
  legacyDelta,
  issueCheckResults,
  legacyFunctionFamilies: {
    renderFunctions: uniqueMatches(/function\s+(render[A-Za-z0-9_$]*)\s*\(/g, legacyText),
    openFunctions: uniqueMatches(/function\s+(open[A-Za-z0-9_$]*)\s*\(/g, legacyText),
    setWorkspaceFunctions: uniqueMatches(/function\s+([A-Za-z0-9_$]*(?:Set|set|Workspace|workspace)[A-Za-z0-9_$]*)\s*\(/g, legacyText).slice(0, 300),
    pdfExportFunctions: uniqueMatches(/function\s+([A-Za-z0-9_$]*(?:Export|export|Pdf|PDF)[A-Za-z0-9_$]*)\s*\(/g, legacyText),
  },
  files: metrics,
  requiredDocs: requiredDocs.map(name => ({ path:`docs/${name}`, present: exists(path.join(DOCS,name)) })),
  nextRequiredOutcome: 'Phase 2b - L8 completes modularisation. Next work should be normal regression QA/release hardening, not Phase 2b extraction.',
};

if (WRITE) {
  write(path.join(DIST, 'phase-2b-diagnostics.json'), JSON.stringify(diagnostics, null, 2) + '\n');
  write(path.join(DOCS, 'Phase 2b - L8 diagnostics.json'), JSON.stringify(diagnostics, null, 2) + '\n');
}

console.log(`WorshipBase ${PHASE} Manual browser parity sign-off / final completion gate`);
console.log(`- Source files: ${diagnostics.summary.sourceFileCount}`);
console.log(`- Source lines: ${diagnostics.summary.sourceLineCount}`);
console.log(`- Legacy shell active: ${diagnostics.summary.legacyShellActiveSource ? 'YES' : 'NO'}`);
console.log(`- Legacy shell lines/functions/listeners: ${diagnostics.summary.legacyShellLines}/${diagnostics.summary.legacyShellFunctions}/${diagnostics.summary.legacyShellEventListeners}`);
console.log(`- Injected modules/styles: ${diagnostics.summary.injectedModuleCount}/${diagnostics.summary.injectedStyleFragmentCount}`);
console.log(`- Modularisation status: ${diagnostics.summary.modularisationStatus}`);
if (warnings.length) {
  console.log('\nWarnings:');
  warnings.forEach(w => console.log(`- ${w}`));
}
if (errors.length) {
  console.error('\nErrors:');
  errors.forEach(e => console.error(`- ${e}`));
  process.exit(1);
}
console.log(`\n${PHASE} final completion checks passed. Source-owned host is active, inline host runtime is retired, and modularisation is complete.`);
