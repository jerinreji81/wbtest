#!/usr/bin/env node
/**
 * WorshipBase Phase 2b - L8 build scaffold.
 *
 * Purpose:
 * - Keep the Phase 2b single deployable output.
 * - Inject extracted constants, utility helpers, startup/PWA lifecycle owner, navigation/registry/gesture scaffold,
 *   storage service, Firebase service, backup/Drive service, cloud runtime owner, global surface/navigation bridge owner, main shell retirement owner, legacy runtime adapter owner, static shell parity gate + final host flip readiness gate owner, final host flip readiness owner, chart renderer, song-view controller, song editor/import controller, song import destination/fetch controller, song lifecycle/menu/notes/focus controller, focus/performance controller, personal set-list controller, Workspace set controller, Workspace surface controller, Workspace action/event controller, Workspace cloud/runtime controller, export/PDF runtime controller, backup/restore residual controller, add-to-set controller, Tools controller, Settings controller, Backup Centre UI controller, Bible tools controller, export/PDF format controller, feature style registry, style controller, shared UI component owner, and DOM helpers before the legacy app shell.
 * - Leave visual redesign, attached song PDF workflows, Firebase rewrite, and visual redesign and attached song PDF workflows
 *   untouched; inject the canonical Phase 2b - C2 UI system, app shell owner, and surface lifecycle owner, and data model owner only.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const SRC_INDEX = path.join(ROOT, 'src', 'host', 'index.phase-2b.html');
const SRC_SW = path.join(ROOT, 'src', 'legacy', 'wb-offline-sw.phase-d.js');
const MODULES = [
  { id: 'wb-core-constants', file: path.join(ROOT, 'src', 'core', 'constants.js') },
  { id: 'wb-core-utils', file: path.join(ROOT, 'src', 'core', 'utils.js') },
  { id: 'wb-core-startup', file: path.join(ROOT, 'src', 'core', 'startup.js') },
  { id: 'wb-core-navigation', file: path.join(ROOT, 'src', 'core', 'navigation.js') },
  { id: 'wb-core-app-shell', file: path.join(ROOT, 'src', 'core', 'app-shell.js') },
  { id: 'wb-core-main-shell-controller', file: path.join(ROOT, 'src', 'core', 'main-shell-controller.js') },
  { id: 'wb-core-legacy-runtime-adapter-controller', file: path.join(ROOT, 'src', 'core', 'legacy-runtime-adapter-controller.js') },
  { id: 'wb-core-static-shell-parity-controller', file: path.join(ROOT, 'src', 'core', 'static-shell-parity-controller.js') },
  { id: 'wb-core-final-host-flip-controller', file: path.join(ROOT, 'src', 'core', 'final-host-flip-controller.js') },
  { id: 'wb-core-source-host-controller', file: path.join(ROOT, 'src', 'core', 'source-host-controller.js') },
  { id: 'wb-core-browser-parity-smoke-controller', file: path.join(ROOT, 'src', 'core', 'browser-parity-smoke-controller.js') },
  { id: 'wb-core-final-completion-gate-controller', file: path.join(ROOT, 'src', 'core', 'final-completion-gate-controller.js') },
  { id: 'wb-storage-service', file: path.join(ROOT, 'src', 'services', 'storage-service.js') },
  { id: 'wb-data-model-service', file: path.join(ROOT, 'src', 'services', 'data-model-service.js') },
  { id: 'wb-firebase-service', file: path.join(ROOT, 'src', 'services', 'firebase-service.js') },
  { id: 'wb-backup-service', file: path.join(ROOT, 'src', 'services', 'backup-service.js') },
  { id: 'wb-cloud-runtime-controller', file: path.join(ROOT, 'src', 'services', 'cloud-runtime-controller.js') },
  { id: 'wb-global-surface-navigation-controller', file: path.join(ROOT, 'src', 'ui', 'global-surface-navigation-controller.js') },
  { id: 'wb-chart-renderer', file: path.join(ROOT, 'src', 'features', 'song', 'chart-renderer.js') },
  { id: 'wb-set-export-model', file: path.join(ROOT, 'src', 'features', 'export', 'set-export-model.js') },
  { id: 'wb-set-editor-controller', file: path.join(ROOT, 'src', 'features', 'setlist', 'set-editor-controller.js') },
  { id: 'wb-song-view-controller', file: path.join(ROOT, 'src', 'features', 'song', 'song-view-controller.js') },
  { id: 'wb-library-controller', file: path.join(ROOT, 'src', 'features', 'song', 'library-controller.js') },
  { id: 'wb-library-song-controller', file: path.join(ROOT, 'src', 'features', 'song', 'library-song-controller.js') },
  { id: 'wb-library-surface-controller', file: path.join(ROOT, 'src', 'features', 'song', 'library-surface-controller.js') },
  { id: 'wb-song-editor-import-controller', file: path.join(ROOT, 'src', 'features', 'song', 'song-editor-import-controller.js') },
  { id: 'wb-song-import-destination-controller', file: path.join(ROOT, 'src', 'features', 'song', 'song-import-destination-controller.js') },
  { id: 'wb-song-lifecycle-controller', file: path.join(ROOT, 'src', 'features', 'song', 'song-lifecycle-controller.js') },
  { id: 'wb-song-view-render-controller', file: path.join(ROOT, 'src', 'features', 'song', 'song-view-render-controller.js') },
  { id: 'wb-song-focus-controller', file: path.join(ROOT, 'src', 'features', 'song', 'focus-controller.js') },
  { id: 'wb-song-interaction-controller', file: path.join(ROOT, 'src', 'features', 'song', 'interaction-controller.js') },
  { id: 'wb-personal-set-controller', file: path.join(ROOT, 'src', 'features', 'setlist', 'personal-set-controller.js') },
  { id: 'wb-workspace-set-controller', file: path.join(ROOT, 'src', 'features', 'workspace', 'workspace-set-controller.js') },
  { id: 'wb-workspace-surface-controller', file: path.join(ROOT, 'src', 'features', 'workspace', 'workspace-surface-controller.js') },
  { id: 'wb-workspace-action-controller', file: path.join(ROOT, 'src', 'features', 'workspace', 'workspace-action-controller.js') },
  { id: 'wb-workspace-cloud-controller', file: path.join(ROOT, 'src', 'features', 'workspace', 'workspace-cloud-controller.js') },
  { id: 'wb-set-state-adapter', file: path.join(ROOT, 'src', 'features', 'setlist', 'set-state-adapter.js') },
  { id: 'wb-set-event-persistence-adapter', file: path.join(ROOT, 'src', 'features', 'setlist', 'set-event-persistence-adapter.js') },
  { id: 'wb-add-to-set-controller', file: path.join(ROOT, 'src', 'features', 'setlist', 'add-to-set-controller.js') },
  { id: 'wb-tools-controller', file: path.join(ROOT, 'src', 'features', 'tools', 'tools-controller.js') },
  { id: 'wb-tools-render-model', file: path.join(ROOT, 'src', 'features', 'tools', 'tools-render-model.js') },
  { id: 'wb-tools-surface-controller', file: path.join(ROOT, 'src', 'features', 'tools', 'tools-surface-controller.js') },
  { id: 'wb-tools-state-action-controller', file: path.join(ROOT, 'src', 'features', 'tools', 'tools-state-action-controller.js') },
  { id: 'wb-tools-dom-controller', file: path.join(ROOT, 'src', 'features', 'tools', 'tools-dom-controller.js') },
  { id: 'wb-pad-audio-controller', file: path.join(ROOT, 'src', 'features', 'tools', 'pad-audio-controller.js') },
  { id: 'wb-chord-nns-controller', file: path.join(ROOT, 'src', 'features', 'tools', 'chord-nns-controller.js') },
  { id: 'wb-settings-controller', file: path.join(ROOT, 'src', 'features', 'settings', 'settings-controller.js') },
  { id: 'wb-admin-controller', file: path.join(ROOT, 'src', 'features', 'settings', 'admin-controller.js') },
  { id: 'wb-settings-admin-dom-controller', file: path.join(ROOT, 'src', 'features', 'settings', 'settings-admin-dom-controller.js') },
  { id: 'wb-settings-admin-render-controller', file: path.join(ROOT, 'src', 'features', 'settings', 'settings-admin-render-controller.js') },
  { id: 'wb-backup-ui-controller', file: path.join(ROOT, 'src', 'features', 'backup', 'backup-ui-controller.js') },
  { id: 'wb-restore-review-controller', file: path.join(ROOT, 'src', 'features', 'backup', 'restore-review-controller.js') },
  { id: 'wb-backup-restore-controller', file: path.join(ROOT, 'src', 'features', 'backup', 'backup-restore-controller.js') },
  { id: 'wb-bible-controller', file: path.join(ROOT, 'src', 'features', 'tools', 'bible-controller.js') },
  { id: 'wb-export-pdf-format-controller', file: path.join(ROOT, 'src', 'features', 'export', 'pdf-format-controller.js') },
  { id: 'wb-export-pdf-runtime-controller', file: path.join(ROOT, 'src', 'features', 'export', 'pdf-runtime-controller.js') },
  { id: 'wb-data-safety-controller', file: path.join(ROOT, 'src', 'features', 'data-safety', 'export-import-backup-controller.js') },
  { id: 'wb-data-safety-dom-controller', file: path.join(ROOT, 'src', 'features', 'data-safety', 'data-safety-dom-controller.js') },
  { id: 'wb-feature-style-registry', file: path.join(ROOT, 'src', 'styles', 'feature-style-registry.js') },
  { id: 'wb-style-controller', file: path.join(ROOT, 'src', 'styles', 'style-controller.js') },
  { id: 'wb-ui-components', file: path.join(ROOT, 'src', 'ui', 'components.js') },
  { id: 'wb-ui-dialog-controller', file: path.join(ROOT, 'src', 'ui', 'dialog-controller.js') },
  { id: 'wb-ui-surface-lifecycle', file: path.join(ROOT, 'src', 'ui', 'surface-lifecycle.js') },
  { id: 'wb-ui-dom', file: path.join(ROOT, 'src', 'ui', 'dom.js') },
  { id: 'wb-core-host-runtime-adapter', file: path.join(ROOT, 'src', 'core', 'host-runtime-adapter.js') },
];
const DIST_DIR = path.join(ROOT, 'dist');
const DIST_INDEX = path.join(DIST_DIR, 'index.html');
const DIST_SW = path.join(DIST_DIR, 'wb-offline-sw.js');
const MANIFEST = path.join(DIST_DIR, 'build-manifest.json');
const STYLE_FRAGMENTS = [
  { id: 'wb-ui-system-css', file: path.join(ROOT, 'src', 'styles', 'wb-ui-system.css') },
];

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, 'utf8');
}

function sha256(content) {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

function scriptTag(id, content) {
  return `<script id="${id}">\n${content.replace(/\s+$/,'')}\n</script>\n`;
}


function injectStyleFragments(html, fragments) {
  if (!fragments.length) return html;
  const styleId = 'wb-rebuild-consolidated-style';
  const openNeedle = `<style id="${styleId}">`;
  const openIndex = html.indexOf(openNeedle);
  if (openIndex < 0) throw new Error('Cannot find consolidated style block');
  const closeIndex = html.indexOf('</style>', openIndex);
  if (closeIndex < 0) throw new Error('Cannot find consolidated style block close');
  const addition = '\n\n/* Phase 2b - L7 canonical UI system; single consolidated style block retained. */\n' +
    fragments.map(f => `/* ${f.id} */\n${f.content.replace(/\s+$/,'')}`).join('\n\n') + '\n';
  return html.slice(0, closeIndex) + addition + html.slice(closeIndex);
}

function injectModules(html, modules) {
  const needle = '<script id="wb-rebuild-consolidated-script">';
  const index = html.indexOf(needle);
  if (index < 0) throw new Error('Cannot find app script injection point');
  return html.slice(0, index) + modules.map(m => scriptTag(m.id, m.content)).join('') + html.slice(index);
}

function extractInlineScripts(html) {
  const scripts = [];
  const re = /<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = re.exec(html))) {
    scripts.push(match[1]);
  }
  return scripts;
}

function countStyleBlocks(html) {
  const matches = html.match(/<style\b[^>]*>/gi);
  return matches ? matches.length : 0;
}

function syntaxCheckInlineScripts(html) {
  const scripts = extractInlineScripts(html);
  const errors = [];
  scripts.forEach((script, index) => {
    try {
      // Syntax-only check without executing app code.
      new Function(script);
    } catch (err) {
      errors.push({ index: index + 1, message: err && err.message ? err.message : String(err) });
    }
  });
  return { count: scripts.length, errors };
}

function ownershipChecks(shell) {
  const forbidden = [
    { label: 'legacy STORAGE_KEYS object', pattern: /var\s+STORAGE_KEYS\s*=\s*\{/ },
    { label: 'legacy DEFAULT_SETTINGS object', pattern: /var\s+DEFAULT_SETTINGS\s*=\s*\{/ },
    { label: 'legacy THEME_PALETTE object', pattern: /var\s+THEME_PALETTE\s*=\s*\{/ },
    { label: 'legacy safeGet helper', pattern: /function\s+safeGet\s*\(/ },
    { label: 'legacy safeSet helper', pattern: /function\s+safeSet\s*\(/ },
    { label: 'legacy safeRemove helper', pattern: /function\s+safeRemove\s*\(/ },
    { label: 'legacy qs helper', pattern: /function\s+qs\s*\(/ },
    { label: 'legacy qsa helper', pattern: /function\s+qsa\s*\(/ },
    { label: 'legacy qv helper', pattern: /function\s+qv\s*\(/ },
    { label: 'legacy esc helper', pattern: /function\s+esc\s*\(/ },
    { label: 'legacy firstLetter helper', pattern: /function\s+firstLetter\s*\(/ },
    { label: 'legacy Google Drive client id literal owner', pattern: /var\s+GOOGLE_DRIVE_CLIENT_ID\s*=\s*'137901259240-/ },
    { label: 'legacy Firebase SDK script loader owner', pattern: /firebase-app-compat\.js/ },
    { label: 'legacy WBNavigationController object owner', pattern: /var\s+WBNavigationController\s*=\s*\{/ },
    ];
  return forbidden.filter(check => check.pattern.test(shell)).map(check => check.label);
}

function main() {
  const shellHtml = read(SRC_INDEX);
  const swJs = read(SRC_SW);
  const modules = MODULES.map(module => ({
    id: module.id,
    source: path.relative(ROOT, module.file),
    content: read(module.file),
  }));
  const styleFragments = STYLE_FRAGMENTS.map(fragment => ({
    id: fragment.id,
    source: path.relative(ROOT, fragment.file),
    content: read(fragment.file),
  }));
  const styledHtml = injectStyleFragments(shellHtml, styleFragments);
  const indexHtml = injectModules(styledHtml, modules);

  const ownershipViolations = ownershipChecks(shellHtml);
  if (ownershipViolations.length) {
    console.error('Phase 2b - L8 ownership violations:', JSON.stringify(ownershipViolations, null, 2));
    process.exit(1);
  }

  fs.rmSync(DIST_DIR, { recursive: true, force: true });
  fs.mkdirSync(DIST_DIR, { recursive: true });

  write(DIST_INDEX, indexHtml);
  write(DIST_SW, swJs);

  const syntax = syntaxCheckInlineScripts(indexHtml);
  if (syntax.errors.length) {
    console.error('Inline script syntax errors:', JSON.stringify(syntax.errors, null, 2));
    process.exit(1);
  }

  const manifest = {
    phase: 'Phase 2b - L8',
    purpose: 'Manual browser parity sign-off / final completion gate',
    baseline: 'Phase 2b - L7 made the source host static and moved runtime into a source-owned adapter. L8 fixes the browser smoke blockers and records final completion readiness.',
    generatedAt: new Date().toISOString(),
    files: {
      'index.html': {
        source: 'src/host/index.phase-2b.html static source-owned host + canonical UI system CSS + Phase 2b owners + injected modules + final completion gate',
        sha256: sha256(indexHtml),
        bytes: Buffer.byteLength(indexHtml, 'utf8'),
      },
      'wb-offline-sw.js': {
        source: 'src/legacy/wb-offline-sw.phase-d.js',
        sha256: sha256(swJs),
        bytes: Buffer.byteLength(swJs, 'utf8'),
      },
    },
    styleFragments: styleFragments.map(fragment => ({
      id: fragment.id,
      source: fragment.source,
      sha256: sha256(fragment.content),
      bytes: Buffer.byteLength(fragment.content, 'utf8'),
    })),
    modules: modules.map(module => ({
      id: module.id,
      source: module.source,
      sha256: sha256(module.content),
      bytes: Buffer.byteLength(module.content, 'utf8'),
    })),
    validation: {
      inlineScriptBlocks: syntax.count,
      inlineScriptSyntaxErrors: syntax.errors.length,
      styleBlocks: countStyleBlocks(indexHtml),
      ownershipViolations: ownershipViolations.length,
      productBehaviourChanged: 'No intended product behaviour change; Phase 2b - L8 fixes source-owner injection/adapter wiring and records final modularisation completion.',
      visualRedesign: false,
      modularisationComplete: true,
      activeLegacyShell: null,
      activeSourceHost: 'src/host/index.phase-2b.html',
      attachedSongPdfWorkflows: 'cancelled / untouched',
    },
  };

  write(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');

  console.log('WorshipBase Phase 2b - L8 build complete.');
  console.log(`- ${path.relative(ROOT, DIST_INDEX)}`);
  console.log(`- ${path.relative(ROOT, DIST_SW)}`);
  console.log(`- ${path.relative(ROOT, MANIFEST)}`);
  console.log(`Injected modules: ${modules.length}`);
  console.log(`Inline script blocks checked: ${syntax.count}`);
  console.log(`Style blocks checked: ${countStyleBlocks(indexHtml)}`);
}

main();
