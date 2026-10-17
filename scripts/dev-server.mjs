/**
 * Минимальный npm dev/preview сервер без зависимостей.
 * По умолчанию доступен только с этого компьютера (127.0.0.1).
 */
import { createServer } from 'node:http';
import { readFile, stat, watch } from 'node:fs';
import { resolve, dirname, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const preview = process.argv.includes('--dist');
const base = preview ? resolve(root, 'dist') : root;
const port = Number(process.env.PORT || (preview ? 4173 : 5173));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png', '.ico': 'image/x-icon' };
const clients = new Set();

const server = createServer((req, res) => {
  const url = new URL(req.url || '/', 'http://localhost');
  if (!preview && url.pathname === '/__atlas_reload') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    res.write(': ATLAS live reload\n\n');
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }
  let requested;
  try { requested = decodeURIComponent(url.pathname); }
  catch { res.writeHead(400).end('Bad request'); return; }
  if (requested.includes('\0')) { res.writeHead(400).end('Bad request'); return; }
  // Никогда не отдаём .git, .env, скрипты обновления и внутренние файлы.
  if (requested !== '/' && requested !== '/index.html' && !requested.startsWith('/src/') && !requested.startsWith('/public/')) {
    res.writeHead(404).end('Not found'); return;
  }
  const path = resolve(base, '.' + (requested === '/' ? '/index.html' : requested));
  if (!(path === base || path.startsWith(base + sep))) { res.writeHead(403).end('Forbidden'); return; }
  stat(path, (statError, info) => {
    if (statError || !info.isFile()) { res.writeHead(404).end('Not found'); return; }
    readFile(path, (readError, content) => {
      if (readError) { res.writeHead(500).end('Server error'); return; }
      res.setHeader('Content-Type', (types[extname(path)] || 'application/octet-stream') + (['.html','.js','.css','.json'].includes(extname(path)) ? '; charset=utf-8' : ''));
      res.setHeader('Cache-Control', 'no-store');
      if (!preview && extname(path) === '.html') {
        const reload = '<script>new EventSource("/__atlas_reload").onmessage=()=>location.reload()</script>';
        content = Buffer.from(content.toString('utf8').replace('</body>', reload + '</body>'));
      }
      res.end(content);
    });
  });
});
if (!preview) {
  let debounce;
  watch(root, { recursive: true }, (_event, filename) => {
    if (!filename || /(^|[\\/])(\.git|dist|node_modules|docs)([\\/]|$)/.test(filename)) return;
    clearTimeout(debounce);
    debounce = setTimeout(() => { for (const client of clients) client.write('data: reload\n\n'); }, 160);
  }).on('error', (error) => console.warn('ATLAS: наблюдение за файлами недоступно:', error.message));
}
server.listen(port, '127.0.0.1', () => console.log(`ATLAS ${preview ? 'preview' : 'dev'}: http://127.0.0.1:${port}`));
