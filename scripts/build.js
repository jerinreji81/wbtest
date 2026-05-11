#!/usr/bin/env node
/**
 * WorshipBase Phase I.3.1 build scaffold.
 *
 * Purpose:
 * - Keep the Phase B single deployable output.
 * - Inject extracted constants, utility helpers, startup/PWA lifecycle owner, navigation/registry/gesture scaffold,
 *   storage service, Firebase service, backup/Drive service, chart renderer, song-view controller, focus/performance controller, personal set-list controller, Workspace set controller, add-to-set controller, and DOM helpers before the legacy app shell.
 * - Leave visual redesign, attached song PDF workflows, Firebase rewrite, and visual redesign and attached song PDF workflows
 *   untouched; extract backup/Drive boundary ownership only.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const SRC_INDEX = path.join(ROOT, 'src', 'legacy', 'index.phase-d.html');
const SRC_SW = path.join(ROOT, 'src', 'legacy', 'wb-offline-sw.phase-d.js');
const MODULES = [
  { id: 'wb-core-constants', file: path.join(ROOT, 'src', 'core', 'constants.js') },
  { id: 'wb-core-utils', file: path.join(ROOT, 'src', 'core', 'utils.js') },
  { id: 'wb-core-startup', file: path.join(ROOT, 'src', 'core', 'startup.js') },
  { id: 'wb-core-navigation', file: path.join(ROOT, 'src', 'core', 'navigation.js') },
  { id: 'wb-storage-service', file: path.join(ROOT, 'src', 'services', 'storage-service.js') },
  { id: 'wb-firebase-service', file: path.join(ROOT, 'src', 'services', 'firebase-service.js') },
  { id: 'wb-backup-service', file: path.join(ROOT, 'src', 'services', 'backup-service.js') },
  { id: 'wb-chart-renderer', file: path.join(ROOT, 'src', 'features', 'song', 'chart-renderer.js') },
  { id: 'wb-song-view-controller', file: path.join(ROOT, 'src', 'features', 'song', 'song-view-controller.js') },
  { id: 'wb-song-focus-controller', file: path.join(ROOT, 'src', 'features', 'song', 'focus-controller.js') },
  { id: 'wb-personal-set-controller', file: path.join(ROOT, 'src', 'features', 'setlist', 'personal-set-controller.js') },
  { id: 'wb-workspace-set-controller', file: path.join(ROOT, 'src', 'features', 'workspace', 'workspace-set-controller.js') },
  { id: 'wb-add-to-set-controller', file: path.join(ROOT, 'src', 'features', 'setlist', 'add-to-set-controller.js') },
  { id: 'wb-ui-dom', file: path.join(ROOT, 'src', 'ui', 'dom.js') },
];
const DIST_DIR = path.join(ROOT, 'dist');
const DIST_INDEX = path.join(DIST_DIR, 'index.html');
const DIST_SW = path.join(DIST_DIR, 'wb-offline-sw.js');
const MANIFEST = path.join(DIST_DIR, 'build-manifest.json');

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
  const indexHtml = injectModules(shellHtml, modules);

  const ownershipViolations = ownershipChecks(shellHtml);
  if (ownershipViolations.length) {
    console.error('Phase I.3.1 ownership violations:', JSON.stringify(ownershipViolations, null, 2));
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
    phase: 'I.3.1',
    purpose: 'Stabilize Phase I.3 version label and set/workspace fresh-open mode hierarchy after combined Phase I testing',
    baseline: 'v8.17 stability freeze, Phase H.3 song/chart/focus extraction; v85 reference artifact included',
    generatedAt: new Date().toISOString(),
    files: {
      'index.html': {
        source: 'src/legacy/index.phase-d.html + injected Phase I.3.1 modules',
        sha256: sha256(indexHtml),
        bytes: Buffer.byteLength(indexHtml, 'utf8'),
      },
      'wb-offline-sw.js': {
        source: 'src/legacy/wb-offline-sw.phase-d.js',
        sha256: sha256(swJs),
        bytes: Buffer.byteLength(swJs, 'utf8'),
      },
    },
    modules: modules.map(module => ({
      id: module.id,
      source: module.source,
      sha256: sha256(module.content),
      bytes: Buffer.byteLength(module.content, 'utf8'),
    })),
    validation: {
      inlineScriptBlocks: syntax.count,
      inlineScriptSyntaxErrors: syntax.errors.length,
      ownershipViolations: ownershipViolations.length,
      productBehaviourChanged: 'Add-to-set and song-view mode hierarchy controller extraction with legacy compatibility adapters; no visual redesign',
      visualRedesign: false,
      attachedSongPdfWorkflows: 'cancelled / untouched',
    },
  };

  write(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');

  console.log('WorshipBase Phase I.3.1 build complete.');
  console.log(`- ${path.relative(ROOT, DIST_INDEX)}`);
  console.log(`- ${path.relative(ROOT, DIST_SW)}`);
  console.log(`- ${path.relative(ROOT, MANIFEST)}`);
  console.log(`Injected modules: ${modules.length}`);
  console.log(`Inline script blocks checked: ${syntax.count}`);
}

main();
