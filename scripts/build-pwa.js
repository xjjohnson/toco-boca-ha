/**
 * Turns `expo export --platform web` output (dist/) into an installable,
 * offline-capable web app:
 *   - copies the app icons in,
 *   - writes manifest.webmanifest,
 *   - writes sw.js, a service worker that precaches every exported file,
 *   - adds the manifest link and service worker registration to index.html.
 *
 * Set TOYBOX_BASE_URL (e.g. /local/toybox-town) when the app is served from a
 * sub-folder, such as Home Assistant's www folder. It must match the base the
 * export was built with.
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const ICONS = path.join(ROOT, 'assets', 'pwa');
const SW_TEMPLATE = path.join(__dirname, 'sw-template.js');
const THEME = '#FFE3A3';
const APP_NAME = 'Toybox Town';

/** "/local/x/" or "local/x" -> "/local/x"; "" or "/" -> "". */
function normalizeBase(base) {
  const trimmed = (base || '').trim().replace(/^\/+|\/+$/g, '');
  return trimmed ? `/${trimmed}` : '';
}

/** Every file under dir, as forward-slash paths relative to it. */
function listFiles(dir, prefix = '') {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      return entry.isDirectory() ? listFiles(path.join(dir, entry.name), rel) : [rel];
    })
    .sort();
}

/** URLs the service worker caches on install. */
function precacheList(files, base) {
  const skip = new Set(['sw.js', 'metadata.json']);
  return files
    .filter((f) => !skip.has(f) && !f.endsWith('.map'))
    .map((f) => `${base}/${f}`);
}

function manifest(base) {
  return {
    name: APP_NAME,
    short_name: 'Toybox',
    description: 'A pretend-play toy house that plays along with your home.',
    start_url: `${base}/`,
    scope: `${base}/`,
    display: 'fullscreen',
    orientation: 'landscape',
    background_color: THEME,
    theme_color: THEME,
    icons: [
      { src: `${base}/icons/icon-192.png`, sizes: '192x192', type: 'image/png' },
      { src: `${base}/icons/icon-512.png`, sizes: '512x512', type: 'image/png' },
      { src: `${base}/icons/maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}

const MARKER = '<!-- toybox-pwa -->';

/** Adds the PWA tags to index.html. Safe to run twice. */
function injectHtml(html, base) {
  if (html.includes(MARKER)) return html;
  const head = [
    MARKER,
    `<link rel="manifest" href="${base}/manifest.webmanifest">`,
    `<meta name="theme-color" content="${THEME}">`,
    `<link rel="apple-touch-icon" href="${base}/icons/apple-touch-icon.png">`,
    '<meta name="apple-mobile-web-app-capable" content="yes">',
    '<meta name="mobile-web-app-capable" content="yes">',
    `<meta name="apple-mobile-web-app-title" content="${APP_NAME}">`,
  ].join('\n');
  const register = `<script>
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('${base}/sw.js', { scope: '${base}/' }).catch(function (e) {
      console.warn('Offline mode unavailable:', e);
    });
  });
}
</script>`;
  return html.replace('</head>', `${head}\n</head>`).replace('</body>', `${register}\n</body>`);
}

function buildServiceWorker(template, urls, version, base) {
  return template
    .replace('__VERSION__', JSON.stringify(version))
    .replace('__BASE__', JSON.stringify(base))
    .replace('__PRECACHE__', JSON.stringify(urls, null, 2));
}

function main() {
  const base = normalizeBase(process.env.TOYBOX_BASE_URL);
  if (!fs.existsSync(path.join(DIST, 'index.html'))) {
    throw new Error('dist/index.html not found. Run `expo export --platform web` first.');
  }

  fs.mkdirSync(path.join(DIST, 'icons'), { recursive: true });
  for (const icon of fs.readdirSync(ICONS)) {
    fs.copyFileSync(path.join(ICONS, icon), path.join(DIST, 'icons', icon));
  }
  fs.writeFileSync(path.join(DIST, 'manifest.webmanifest'), JSON.stringify(manifest(base), null, 2));

  const indexPath = path.join(DIST, 'index.html');
  fs.writeFileSync(indexPath, injectHtml(fs.readFileSync(indexPath, 'utf8'), base));

  // The version changes whenever any shipped file changes, so devices pick up updates.
  const files = listFiles(DIST).filter((f) => f !== 'sw.js');
  const hash = crypto.createHash('sha256');
  for (const f of files) hash.update(f).update(fs.readFileSync(path.join(DIST, f)));
  const version = hash.digest('hex').slice(0, 12);

  const urls = precacheList(files, base);
  const sw = buildServiceWorker(fs.readFileSync(SW_TEMPLATE, 'utf8'), urls, version, base);
  fs.writeFileSync(path.join(DIST, 'sw.js'), sw);
  fs.writeFileSync(path.join(DIST, 'version.json'), JSON.stringify({ version }) + '\n');

  console.log(`PWA ready: ${urls.length} files precached, version ${version}, base "${base || '/'}"`);
}

module.exports = { normalizeBase, precacheList, manifest, injectHtml, buildServiceWorker };

if (require.main === module) main();
