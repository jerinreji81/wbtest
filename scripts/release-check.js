#!/usr/bin/env node
/**
 * WorshipBase RC2 release preflight.
 * Run after `npm run build` from the repo root.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const REQUIRED_RUNTIME = [
  path.join(DIST, 'index.html'),
  path.join(DIST, 'wb-offline-sw.js'),
  path.join(DIST, 'build-manifest.json'),
];
const RECOMMENDED_SITE_ROOT = [
  path.join(ROOT, 'esv_chapter_package', 'bible-index.json'),
  path.join(ROOT, 'worshipbase_layered_fold_w_proper'),
  path.join(ROOT, 'assets', 'drones'),
];

function exists(p){ return fs.existsSync(p); }
function sha256File(p){ return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'); }
function rel(p){ return path.relative(ROOT, p) || '.'; }
function count(re, text){ return (text.match(re) || []).length; }

const errors = [];
const warnings = [];

for (const p of REQUIRED_RUNTIME) {
  if (!exists(p)) errors.push(`Missing build output: ${rel(p)}`);
}
for (const p of RECOMMENDED_SITE_ROOT) {
  if (!exists(p)) warnings.push(`Recommended deployed asset not found in this local package: ${rel(p)}`);
}

if (exists(path.join(DIST, 'index.html'))) {
  const html = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
  const styleBlocks = count(/<style\b[^>]*>/gi, html);
  if (styleBlocks !== 1) errors.push(`Expected 1 consolidated style block, found ${styleBlocks}`);
  if (!html.includes('Rebuild_8.17RC2')) errors.push('Dist index does not contain Rebuild_8.17RC2 version label');
  if (/attached song pdf/i.test(html) && !/cancelled|disabled|do not revive/i.test(html)) {
    warnings.push('Potential attached-song PDF wording found; verify cancelled workflow remains inactive.');
  }
}

if (exists(path.join(DIST, 'wb-offline-sw.js'))) {
  const sw = fs.readFileSync(path.join(DIST, 'wb-offline-sw.js'), 'utf8');
  if (!sw.includes('rc2')) errors.push('Service worker cache version does not contain rc2');
  if (!sw.includes('WB_SW_ACTIVATED')) warnings.push('Service worker activation message not found');
  if (!sw.includes('esv_chapter_package')) warnings.push('Bible package cache handling not found in service worker');
}

let manifest = null;
if (exists(path.join(DIST, 'build-manifest.json'))) {
  try { manifest = JSON.parse(fs.readFileSync(path.join(DIST, 'build-manifest.json'), 'utf8')); }
  catch (e) { errors.push('build-manifest.json is not valid JSON'); }
}
if (manifest) {
  if (manifest.phase !== 'RC2') errors.push(`Manifest phase is ${manifest.phase}, expected RC2`);
  if (manifest.validation && manifest.validation.styleBlocks !== 1) errors.push('Manifest style block count is not 1');
  for (const [name, meta] of Object.entries(manifest.files || {})) {
    const p = path.join(DIST, name);
    if (exists(p) && meta.sha256 && sha256File(p) !== meta.sha256) errors.push(`Manifest hash mismatch: ${name}`);
  }
}

console.log('WorshipBase RC2 release preflight');
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
