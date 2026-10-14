// Development only: serve the extension assets with its real CSP, including
// worker responses. The installed extension never needs this preview server.
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat, readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(fileURLToPath(new URL('../extension/', import.meta.url)));
const { content_security_policy } = JSON.parse(await readFile(resolve(root, 'manifest.json')));
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm' };
createServer(async (request, response) => {
  try {
    if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405).end(); return; }
    const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const target = resolve(root, '.' + (path === '/' ? '/panel.html' : path));
    if (!target.startsWith(root + sep) && target !== root) { response.writeHead(403).end(); return; }
    const info = await stat(target);
    if (!info.isFile()) { response.writeHead(404).end(); return; }
    response.writeHead(200, {
      'Content-Type': mime[extname(target)] || 'application/octet-stream',
      'Content-Length': info.size,
      'Content-Security-Policy': content_security_policy.extension_pages,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    });
    if (request.method === 'HEAD') response.end();
    else createReadStream(target).pipe(response);
  } catch { response.writeHead(404).end(); }
}).listen(4177, '127.0.0.1', () => console.log('Development preview: http://127.0.0.1:4177 (no tab extraction)'));
