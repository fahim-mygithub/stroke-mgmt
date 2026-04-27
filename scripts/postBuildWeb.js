#!/usr/bin/env node
/**
 * Post-export step for the web build.
 *
 * Run after `expo export -p web` (which writes `dist/`). Three jobs:
 *
 *   1. Copy `web/` (service worker, manifest, PWA icons) into `dist/` so
 *      they sit at the same origin as the bundle and the SW's scope
 *      matches.
 *   2. Walk the resulting `dist/` and write `dist/precache-manifest.json`
 *      — `[{url, revision}]` pairs the SW reads on install. The SW itself
 *      and the manifest file are excluded so the SW doesn't try to cache
 *      itself.
 *   3. Compute a single build hash from all asset hashes and substitute
 *      it into `dist/service-worker.js` for `__BUILD_HASH__`. This drives
 *      the cache name so old caches get cleaned in the SW's `activate`
 *      step.
 *   4. Inject `<link rel="manifest">` and `<link rel="apple-touch-icon">`
 *      into `dist/index.html`. Expo's web template doesn't expose a
 *      hook for this so a string-replace post-step is the simplest path.
 *
 * Idempotent: running twice on the same `dist/` produces the same output.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const projectRoot = path.resolve(__dirname, '..');
const webSrcDir = path.join(projectRoot, 'web');
const distDir = path.join(projectRoot, 'dist');

// Same baseUrl Expo bakes in via app.config.js's experiments.baseUrl.
const BASE_URL = '/stroke-mgmt-web-preview/';

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyRecursive(srcDir, destDir) {
  ensureDir(destDir);
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const src = path.join(srcDir, entry.name);
    const dest = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(src, dest);
    } else if (entry.isFile()) {
      fs.copyFileSync(src, dest);
    }
  }
}

function listFilesRecursive(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listFilesRecursive(full));
    } else if (entry.isFile()) {
      out.push(full);
    }
  }
  return out;
}

function shortHash(buffer) {
  return crypto.createHash('sha1').update(buffer).digest('hex').slice(0, 8);
}

function toUrl(absPath) {
  // Convert an absolute filesystem path under dist/ to a URL relative to
  // the SW's scope. The SW resolves these against its registration scope,
  // so we want paths *relative to* dist/, with forward slashes.
  const rel = path.relative(distDir, absPath).split(path.sep).join('/');
  return rel;
}

function main() {
  if (!fs.existsSync(distDir)) {
    console.error(`[postBuildWeb] dist/ not found at ${distDir}. Run \`expo export -p web\` first.`);
    process.exit(1);
  }
  if (!fs.existsSync(webSrcDir)) {
    console.error(`[postBuildWeb] web/ not found at ${webSrcDir}.`);
    process.exit(1);
  }

  console.log('[postBuildWeb] Copying web/ → dist/');
  copyRecursive(webSrcDir, distDir);

  // Build precache manifest. Skip the SW itself and the JSON manifest
  // (the SW fetches the manifest fresh on install — caching it would
  // create a chicken-and-egg).
  const swDistPath = path.join(distDir, 'service-worker.js');
  const manifestDistPath = path.join(distDir, 'precache-manifest.json');

  const allFiles = listFilesRecursive(distDir).filter((f) => {
    if (f === swDistPath) return false;
    if (f === manifestDistPath) return false;
    return true;
  });

  const entries = allFiles.map((file) => {
    const buf = fs.readFileSync(file);
    return { url: toUrl(file), revision: shortHash(buf) };
  });

  // Stable order for reproducible builds.
  entries.sort((a, b) => a.url.localeCompare(b.url));

  // Build hash = sha1 of all entry hashes concatenated.
  const buildHash = crypto
    .createHash('sha1')
    .update(entries.map((e) => e.revision).join(''))
    .digest('hex')
    .slice(0, 8);

  console.log(`[postBuildWeb] precache entries: ${entries.length}, buildHash: ${buildHash}`);

  fs.writeFileSync(manifestDistPath, JSON.stringify(entries, null, 2));

  // Substitute __BUILD_HASH__ in the SW.
  if (!fs.existsSync(swDistPath)) {
    console.error(`[postBuildWeb] expected ${swDistPath} after copy step but it's missing`);
    process.exit(1);
  }
  const swSrc = fs.readFileSync(swDistPath, 'utf8');
  if (!swSrc.includes('__BUILD_HASH__')) {
    console.warn('[postBuildWeb] service-worker.js does not contain __BUILD_HASH__ token; skipping substitution');
  } else {
    const swOut = swSrc.replace(/__BUILD_HASH__/g, buildHash);
    fs.writeFileSync(swDistPath, swOut);
  }

  // Inject manifest + apple-touch-icon links into index.html.
  const indexHtmlPath = path.join(distDir, 'index.html');
  if (fs.existsSync(indexHtmlPath)) {
    let html = fs.readFileSync(indexHtmlPath, 'utf8');
    const manifestHref = `${BASE_URL}manifest.webmanifest`;
    const appleIconHref = `${BASE_URL}icons/icon-192.png`;
    const themeColor = '#478e3e';
    const tagsToInject = [
      `<link rel="manifest" href="${manifestHref}" />`,
      `<link rel="apple-touch-icon" href="${appleIconHref}" />`,
      `<meta name="theme-color" content="${themeColor}" />`,
    ];
    // Only inject if not already present (idempotent re-runs).
    const missing = tagsToInject.filter((tag) => !html.includes(tag));
    if (missing.length > 0) {
      html = html.replace('</head>', `${missing.join('\n  ')}\n</head>`);
      fs.writeFileSync(indexHtmlPath, html);
      console.log(`[postBuildWeb] Injected ${missing.length} tag(s) into index.html`);
    } else {
      console.log('[postBuildWeb] index.html already has PWA tags; skipping inject');
    }
  } else {
    console.warn('[postBuildWeb] dist/index.html not found; skipping link injection');
  }

  console.log('[postBuildWeb] Done.');
}

main();
