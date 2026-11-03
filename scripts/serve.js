/**
 * Serves dist/ locally to try the installable app: `npm run export:web && npm run serve`.
 * Service workers need https or localhost, so open http://localhost:8080.
 * With TOYBOX_BASE_URL set, the app is served under that path, like in Home Assistant.
 */
const fs = require('fs');
const http = require('http');
const path = require('path');

const { normalizeBase } = require('./build-pwa');

const DIST = path.join(__dirname, '..', 'dist');
const BASE = normalizeBase(process.env.TOYBOX_BASE_URL);
const PORT = Number(process.env.PORT) || 8080;
const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
};

http
  .createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (!pathname.startsWith(`${BASE}/`)) {
      res.writeHead(302, { Location: `${BASE}/` }).end();
      return;
    }
    let file = path.join(DIST, pathname.slice(BASE.length));
    if (!file.startsWith(DIST)) return res.writeHead(403).end();
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST, 'index.html');
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    fs.createReadStream(file).pipe(res);
  })
  .listen(PORT, () => console.log(`Serving dist/ at http://localhost:${PORT}${BASE}/`));
