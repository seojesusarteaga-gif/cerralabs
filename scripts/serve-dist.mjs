/**
 * Servidor estático mínimo para auditar el build con Screaming Frog.
 * Replica el comportamiento de Vercel con cleanUrls: /servicio -> /servicio/index.html
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('dist');
const PORT = Number(process.argv[2] || 4321);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

http
  .createServer((req, res) => {
    const url = decodeURIComponent(req.url.split('?')[0]);
    const rel = url.replace(/^\/+/, '');
    const candidates = [
      path.join(ROOT, rel),
      path.join(ROOT, rel, 'index.html'),
      path.join(ROOT, rel + '.html'),
    ];
    const hit = candidates.find((p) => fs.existsSync(p) && fs.statSync(p).isFile());

    if (!hit) {
      res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
      res.end('<!doctype html><title>404</title><h1>404</h1>');
      return;
    }
    res.writeHead(200, { 'content-type': TYPES[path.extname(hit)] || 'application/octet-stream' });
    fs.createReadStream(hit).pipe(res);
  })
  .listen(PORT, () => console.log(`sirviendo dist/ en http://localhost:${PORT}`));
