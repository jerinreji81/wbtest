#!/usr/bin/env node
/**
 * WorshipBase RC3 build scaffold.
 *
 * Purpose:
 * - Keep the Phase B single deployable output.
 * - Inject extracted constants, utility helpers, startup/PWA lifecycle owner, navigation/registry/gesture scaffold,
 *   storage service, Firebase service, backup/Drive service, chart renderer, song-view controller, focus/performance controller, personal set-list controller, Workspace set controller, add-to-set controller, Tools controller, Settings controller, Backup Centre UI controller, Bible tools controller, export/PDF format controller, feature style registry, style controller, and DOM helpers before the legacy app shell.
 * - Leave visual redesign, attached song PDF workflows, Firebase rewrite, and visual redesign and attached song PDF workflows
 *   untouched; add targeted token-driven visual polish pass only.
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
  { id: 'wb-song-interaction-controller', file: path.join(ROOT, 'src', 'features', 'song', 'interaction-controller.js') },
  { id: 'wb-personal-set-controller', file: path.join(ROOT, 'src', 'features', 'setlist', 'personal-set-controller.js') },
  { id: 'wb-workspace-set-controller', file: path.join(ROOT, 'src', 'features', 'workspace', 'workspace-set-controller.js') },
  { id: 'wb-add-to-set-controller', file: path.join(ROOT, 'src', 'features', 'setlist', 'add-to-set-controller.js') },
  { id: 'wb-tools-controller', file: path.join(ROOT, 'src', 'features', 'tools', 'tools-controller.js') },
  { id: 'wb-pad-audio-controller', file: path.join(ROOT, 'src', 'features', 'tools', 'pad-audio-controller.js') },
  { id: 'wb-chord-nns-controller', file: path.join(ROOT, 'src', 'features', 'tools', 'chord-nns-controller.js') },
  { id: 'wb-settings-controller', file: path.join(ROOT, 'src', 'features', 'settings', 'settings-controller.js') },
  { id: 'wb-admin-controller', file: path.join(ROOT, 'src', 'features', 'settings', 'admin-controller.js') },
  { id: 'wb-backup-ui-controller', file: path.join(ROOT, 'src', 'features', 'backup', 'backup-ui-controller.js') },
  { id: 'wb-restore-review-controller', file: path.join(ROOT, 'src', 'features', 'backup', 'restore-review-controller.js') },
  { id: 'wb-bible-controller', file: path.join(ROOT, 'src', 'features', 'tools', 'bible-controller.js') },
  { id: 'wb-export-pdf-format-controller', file: path.join(ROOT, 'src', 'features', 'export', 'pdf-format-controller.js') },
  { id: 'wb-feature-style-registry', file: path.join(ROOT, 'src', 'styles', 'feature-style-registry.js') },
  { id: 'wb-style-controller', file: path.join(ROOT, 'src', 'styles', 'style-controller.js') },
  { id: 'wb-ui-dialog-controller', file: path.join(ROOT, 'src', 'ui', 'dialog-controller.js') },
  { id: 'wb-ui-dom', file: path.join(ROOT, 'src', 'ui', 'dom.js') },
];
const DIST_DIR = path.join(ROOT, 'dist');
const DIST_INDEX = path.join(DIST_DIR, 'index.html');
const DIST_SW = path.join(DIST_DIR, 'wb-offline-sw.js');
const MANIFEST = path.join(DIST_DIR, 'build-manifest.json');
const STYLE_FRAGMENTS = [
  { id: 'wb-targeted-polish-css', file: path.join(ROOT, 'src', 'styles', 'targeted-polish.css') },
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
  const addition = '\n\n/* RC3 owner-injected targeted polish; single consolidated style block retained. */\n' +
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
    console.error('AUDIT-FIX3 ownership violations:', JSON.stringify(ownershipViolations, null, 2));
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
    phase: 'AUDIT-FIX3',
    purpose: 'Data safety UX for destructive actions and import review' ,
    baseline: 'v8.17 stability freeze, RC3 notes/cues and readability cleanup; v85 reference artifact included',
    generatedAt: new Date().toISOString(),
    files: {
      'index.html': {
        source: 'src/legacy/index.phase-d.html + targeted polish CSS + injected modules',
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
      productBehaviourChanged: 'AUDIT-FIX3 adds undo affordances, delete impact summaries, and import review statuses while preserving ADD5.5 tools UI'  ,
      visualRedesign: false,
      attachedSongPdfWorkflows: 'cancelled / untouched',
    },
  };

  write(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');

  console.log('WorshipBase AUDIT-FIX3 build complete.');
  console.log(`- ${path.relative(ROOT, DIST_INDEX)}`);
  console.log(`- ${path.relative(ROOT, DIST_SW)}`);
  console.log(`- ${path.relative(ROOT, MANIFEST)}`);
  console.log(`Injected modules: ${modules.length}`);
  console.log(`Inline script blocks checked: ${syntax.count}`);
  console.log(`Style blocks checked: ${countStyleBlocks(indexHtml)}`);
}

main();
