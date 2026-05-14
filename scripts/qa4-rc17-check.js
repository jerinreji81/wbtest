#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const checks = [];
function check(id, pass, detail){ checks.push({id, pass: !!pass, detail}); }
const css = read('src/styles/wb-ui-system.css');
const host = read('src/host/index.phase-2b.html');
const personal = read('src/features/setlist/personal-set-controller.js');
const workspace = read('src/features/workspace/workspace-action-controller.js');
const setExport = read('src/features/export/set-export-model.js');
const importer = read('src/features/song/song-import-destination-controller.js');
const tools = read('src/features/tools/tools-surface-controller.js');
const docs = [
  'Phase 2b operating manual.md',
  'Phase 2b check registry.json',
  'Phase 2b agent quickstart.md',
  'Phase 2b - L8 report.md'
];
check('RC17-001 package docs present in 02_SOURCE/docs', docs.every(d => fs.existsSync(path.join(root, 'docs', d))), docs.join(', '));
check('RC17-002 sheet footer grid contract exists', /workspace-sheet-actions[\s\S]*grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)/.test(css), 'two-column viewport-safe footer');
check('RC17-003 settings Done is footer button, not close circle', /settings-picker-sheet\.open \.bs>\.settings-picker-close\.bs-cancel[\s\S]*width:calc\(100% - 36px\)/.test(css), 'settings Done full-width footer sizing');
check('RC17-004 static sheet actions have semantic roles', /workspace-new-save" data-wb-confirm/.test(host) && /workspace-new-cancel" data-wb-cancel/.test(host), 'workspace new save/cancel roles');
check('RC17-005 filled actions use contrast foreground token', /--wb-filled-action-fg/.test(css) && /-webkit-text-fill-color:var\(--wb-filled-action-fg/.test(css), 'contrast-aware foreground');
check('RC17-006 focus title is viewport-centred by absolute contract', /song-view\.song-focus \.sv-pres-title[\s\S]*position:absolute/.test(css) && /left:50%/.test(css) && /translate\(-50%,-50%\)/.test(css), 'focus header centring');
check('RC17-007 transition pane back button size locked', /song-transition-pane[\s\S]*width:var\(--wb-control-size\)/.test(css), 'swipe transition chrome normalized');
check('RC17-008 personal section edit uses shared index helper', /var edit=e\.target\.closest[\s\S]*personalSetItemIndexFromElement\(edit\)/.test(personal), 'data-set-index/data-index helper');
check('RC17-009 personal publish passes explicit active set id', /openWorkspacePublishSheet',\[callCtx\(ctx,'getActiveSetId'/.test(personal), 'explicit publish source');
check('RC17-010 workspace publish accepts sourceSet parameter', /function openWorkspacePublishSheet\(ctx,sourceSet\)/.test(workspace) && /explicitId/.test(workspace), 'explicit source set publish');
check('RC17-011 Original key resolves to true song original', /if\(choice==='original'\)return songOriginalKey/.test(setExport), 'original does not route through app default');
check('RC17-012 import selection state tokens exist', /activeImportTokens/.test(importer) && /setImportPreviewState/.test(importer), 'import state machine primitives');
check('RC17-013 import clears stale draft before selection load', /clearImportedDraft\(kind,ctx\);\s*setImportPreviewState\(kind,'loading'/.test(importer), 'no stale preview during selection load');
check('RC17-014 import guards stale async responses', /function stillActive\(\)/.test(importer) && /if\(!stillActive\(\)\)return null/.test(importer), 'selection token guard');
check('RC17-015 import requires chart content before setting draft', /!String\(row\.chart\|\|''\)\.trim\(\)/.test(importer), 'no metadata-only loaded state');
check('RC17-016 converter selected-key output is primary', /var baseKey=state\.transposeTarget\|\|state\.key\|\|'C'/.test(tools) && /Chords in '\+baseKey/.test(tools) && /Selected key/.test(tools), 'NNS conversion based on selected key');
check('RC17-017 worship wrapping policy preserved in CSS', /pair-chord[\s\S]*white-space:pre-wrap[\s\S]*overflow-wrap:normal/.test(css), 'chord alignment preserved');
const passed = checks.filter(c => c.pass).length;
const failed = checks.filter(c => !c.pass);
console.log(`QA4-RC1.7 static verification: ${passed} PASS / ${failed.length} FAIL`);
checks.forEach(c => console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.id} - ${c.detail}`));
if(failed.length){ process.exit(1); }
