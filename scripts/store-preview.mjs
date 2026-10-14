// Asset review only. Serve two explicit directories; never expose workspace
// caches, credentials, node_modules, or other project files.
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const project = fileURLToPath(new URL('../', import.meta.url));
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm', '.png': 'image/png' };
createServer(async (request, response) => {
  try {
    if (!['GET', 'HEAD'].includes(request.method)) return response.writeHead(405).end();
    const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const prefix = path.startsWith('/extension/') ? 'extension' : path.startsWith('/store-kit/') ? 'store-kit' : null;
    if (!prefix) return response.writeHead(404).end();
    const root = resolve(project, prefix);
    const target = resolve(project, '.' + path);
    if (!target.startsWith(root + sep)) return response.writeHead(403).end();
    const info = await stat(target);
    if (!info.isFile()) return response.writeHead(404).end();
    response.writeHead(200, { 'Content-Type': mime[extname(target)] || 'application/octet-stream', 'Content-Length': info.size, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    if (request.method === 'HEAD') response.end(); else createReadStream(target).pipe(response);
  } catch { response.writeHead(404).end(); }
}).listen(4180, '127.0.0.1', () => console.log('Store asset preview: http://127.0.0.1:4180/store-kit/sample-article.html'));
