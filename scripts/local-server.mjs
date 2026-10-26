import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../local-dist/', import.meta.url));
const types = { '.wav': 'audio/wav', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.json': 'application/json; charset=utf-8' };
const server = createServer(async (request, response) => {
  const host = request.headers.host;
  if (host !== '127.0.0.1:4173' && host !== 'localhost:4173') { response.writeHead(403); response.end('Local access only'); return; }
  if (request.method !== 'GET' && request.method !== 'HEAD') { response.writeHead(405); response.end('Method not allowed'); return; }
  const url = new URL(request.url || '/', 'http://127.0.0.1:4173');
  if (url.pathname === '/__runeblade') { response.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); response.end(JSON.stringify({ app: 'runeblade-local', version: 3 })); return; }
  let filename;
  try { filename = path.resolve(root, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname)); }
  catch { response.writeHead(400); response.end('Invalid path'); return; }
  const relative = path.relative(root, filename);
  if (relative.startsWith('..') || path.isAbsolute(relative)) { response.writeHead(403); response.end('Forbidden'); return; }
  try {
    if (!(await stat(filename)).isFile()) throw new Error('Not a file');
    const data = await readFile(filename);
    const headers = { 'Content-Type': types[path.extname(filename)] || 'application/octet-stream', 'Content-Length': data.length, 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; frame-ancestors 'none'" };
    // Media seeking and gap-free looping need a known length and byte-range responses.
    if (path.extname(filename) === '.wav') {
      headers['Accept-Ranges'] = 'bytes';
      if (request.headers.range && request.method === 'GET') {
        const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.range);
        const start = range?.[1] ? Number(range[1]) : range?.[2] ? Math.max(0, data.length - Number(range[2])) : NaN;
        const end = range?.[1] && range[2] ? Math.min(data.length - 1, Number(range[2])) : data.length - 1;
        if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start > end || start >= data.length) {
          response.writeHead(416, { 'Content-Range': `bytes */${data.length}` }); response.end(); return;
        }
        response.writeHead(206, { ...headers, 'Content-Length': end - start + 1, 'Content-Range': `bytes ${start}-${end}/${data.length}` });
        response.end(data.subarray(start, end + 1)); return;
      }
    }
    response.writeHead(200, headers);
    response.end(request.method === 'HEAD' ? undefined : data);
  } catch { response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); response.end('RUNEBLADE: file not found. Build with npm run build:local.'); }
});
server.on('error', error => { console.error(error.code === 'EADDRINUSE' ? 'Port 4173 is already in use. No other process was stopped.' : error.message); process.exitCode = 1; });
server.listen(4173, '127.0.0.1', () => console.log('RUNEBLADE local: http://127.0.0.1:4173/'));
