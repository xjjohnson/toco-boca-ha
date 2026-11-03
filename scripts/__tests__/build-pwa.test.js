const { buildServiceWorker, injectHtml, manifest, normalizeBase, precacheList } = require('../build-pwa');

describe('build-pwa', () => {
  it('normalizes the base path', () => {
    expect(normalizeBase('')).toBe('');
    expect(normalizeBase('/')).toBe('');
    expect(normalizeBase(undefined)).toBe('');
    expect(normalizeBase('local/toybox-town/')).toBe('/local/toybox-town');
  });

  it('precaches exported files under the base, skipping the worker and source maps', () => {
    expect(precacheList(['index.html', 'sw.js', 'metadata.json', 'a.js', 'a.js.map'], '/local/t')).toEqual([
      '/local/t/index.html',
      '/local/t/a.js',
    ]);
  });

  it('scopes the manifest to the base', () => {
    const m = manifest('/local/t');
    expect(m.start_url).toBe('/local/t/index.html');
    expect(m.scope).toBe('/local/t/');
    expect(m.icons.every((i) => i.src.startsWith('/local/t/icons/'))).toBe(true);
  });

  it('injects the manifest and worker registration once', () => {
    const html = '<html><head><title>x</title></head><body><div id="root"></div></body></html>';
    const once = injectHtml(html, '/b');
    expect(once).toContain('<link rel="manifest" href="/b/manifest.webmanifest">');
    expect(once).toContain("register('/b/sw.js', { scope: '/b/' })");
    expect(injectHtml(once, '/b')).toBe(once);
  });

  it('fills in the worker template', () => {
    const sw = buildServiceWorker('const V = __VERSION__; const B = __BASE__; const P = __PRECACHE__;', ['/a'], 'abc', '');
    expect(sw).toContain('const V = "abc"; const B = ""; const P = [\n  "/a"\n];');
  });
});
