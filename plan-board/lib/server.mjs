// board serve: node:http, 127.0.0.1 only. API §6. fs.watch → rebuild → SSE.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { boardDir, readText } from './util.mjs';
import { build, readBuilt } from './build.mjs';
import { pending, appendFeedback } from './inbox.mjs';

const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const MIME = {
  html: 'text/html; charset=utf-8', js: 'text/javascript; charset=utf-8', mjs: 'text/javascript; charset=utf-8',
  css: 'text/css; charset=utf-8', json: 'application/json; charset=utf-8', svg: 'image/svg+xml',
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', ico: 'image/x-icon',
  woff: 'font/woff', woff2: 'font/woff2', ttf: 'font/ttf', txt: 'text/plain; charset=utf-8',
  md: 'text/plain; charset=utf-8', map: 'application/json', wasm: 'application/wasm', mp3: 'audio/mpeg',
  mp4: 'video/mp4', webm: 'video/webm',
};
const mime = (f) => MIME[path.extname(f).slice(1).toLowerCase()] || 'application/octet-stream';
const FALLBACK = '<!doctype html><meta charset="utf-8"><title>Plan Board</title>' +
  '<body style="font:16px system-ui;padding:2rem"><h2>UI chưa build — chạy ui/build.bat</h2>' +
  '<p>API vẫn chạy: <a href="/api/board">/api/board</a></p>';

const send = (res, code, body, type = 'application/json; charset=utf-8') => {
  res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
  res.end(body);
};
const sendJson = (res, code, obj) => send(res, code, JSON.stringify(obj));

function sendFile(res, file) {
  fs.readFile(file, (err, buf) => {
    if (err) return sendJson(res, 404, { error: 'không thấy file' });
    res.writeHead(200, { 'Content-Type': mime(file), 'Cache-Control': 'no-cache' });
    res.end(buf);
  });
}

/** Ghép đường dẫn con vào base; trả null nếu thoát ra ngoài base. */
function safeJoin(base, rel) {
  if (rel.includes('\0')) return null;
  const abs = path.resolve(base, '.' + path.sep + rel.replace(/^[/\\]+/, ''));
  const r = path.relative(base, abs);
  return r.startsWith('..') || path.isAbsolute(r) ? null : abs;
}

function readBody(req, max = 65536) {
  return new Promise((resolve, reject) => {
    let n = 0; const chunks = [];
    req.on('data', (c) => { n += c.length; if (n > max) { reject(new Error('body quá lớn')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function openBrowser(url) {
  try {
    const [cmd, args] = process.platform === 'win32' ? ['cmd', ['/c', 'start', '""', url]]
      : process.platform === 'darwin' ? ['open', [url]] : ['xdg-open', [url]];
    spawn(cmd, args, { detached: true, stdio: 'ignore', windowsHide: true }).on('error', () => {}).unref();
  } catch { /* bỏ qua */ }
}

/** Khởi động server; trả về {server, port, close}. */
export function startServer(root, { port = 4173, open = false, log = console.log, watch = true } = {}) {
  const bd = boardDir(root);
  const clients = new Set();
  const emit = (event, data = {}) => {
    for (const c of clients) c.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };
  let lastErrors = [];
  const rebuild = () => {
    const r = build(root);
    lastErrors = r.errors;
    return r;
  };
  const first = rebuild();
  log(first.errors.length ? `Build lỗi:\n${first.errors.join('\n')}` : first.summary);

  const handler = async (req, res) => {
    try {
      const host = (req.headers.host || '').replace(/:\d+$/, '');
      if (host !== '127.0.0.1' && host !== 'localhost') return sendJson(res, 403, { error: 'host không hợp lệ' });
      const u = new URL(req.url, 'http://127.0.0.1');
      const p = decodeURIComponent(u.pathname);

      if (req.method === 'POST' && p === '/api/feedback') {
        const origin = req.headers.origin;
        if (origin && new URL(origin).host !== req.headers.host) return sendJson(res, 403, { error: 'origin không hợp lệ' });
        let body;
        try { body = JSON.parse(await readBody(req)); } catch { return sendJson(res, 400, { error: 'JSON sai' }); }
        try { appendFeedback(root, body); } catch (e) { return sendJson(res, 400, { error: e.message }); }
        const { pending: n } = pending(root);
        emit('inbox', { pending: n });
        return sendJson(res, 200, { ok: true, pending: n });
      }
      if (req.method !== 'GET' && req.method !== 'HEAD') return sendJson(res, 405, { error: 'method không hỗ trợ' });

      if (p === '/api/board') {
        const j = readBuilt(root, 'pages.json');
        return j ? sendJson(res, 200, j) : sendJson(res, 503, { error: 'chưa build được', errors: lastErrors });
      }
      if (p === '/knowledge-graph.json' || p === '/domain-graph.json') {
        const name = p.slice(1);
        let file = path.join(bd, 'build', name);
        if (u.searchParams.get('src') === 'ua') {
          let cur = {};
          try { cur = JSON.parse(readText(path.join(bd, 'board.json'), '{}')); } catch { /* để trống */ }
          if (!cur.ua) return sendJson(res, 404, { error: 'board.json chưa có "ua"' });
          const uaFile = path.resolve(root, cur.ua);
          file = name === 'knowledge-graph.json' ? uaFile : path.join(path.dirname(uaFile), name);
        }
        return fs.existsSync(file) ? sendFile(res, file) : sendJson(res, 404, { error: `không có ${name}`, errors: lastErrors });
      }
      if (p === '/api/events') {
        res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
        res.write(': ok\n\n');
        clients.add(res);
        req.on('close', () => clients.delete(res));
        return;
      }
      if (p === '/api/inbox/pending') return sendJson(res, 200, pending(root));
      if (p.startsWith('/files/')) {
        const abs = safeJoin(root, p.slice(7));
        if (!abs) return sendJson(res, 403, { error: 'đường dẫn ngoài project' });
        if (/(^|[\\/])\.git([\\/]|$)/.test(path.relative(root, abs))) return sendJson(res, 403, { error: 'cấm' });
        return sendFile(res, abs);
      }
      // static dist
      if (fs.existsSync(path.join(DIST, 'index.html'))) {
        const abs = safeJoin(DIST, p === '/' ? 'index.html' : p);
        if (!abs) return sendJson(res, 403, { error: 'cấm' });
        if (fs.existsSync(abs) && fs.statSync(abs).isFile()) return sendFile(res, abs);
        if (!path.extname(p)) return sendFile(res, path.join(DIST, 'index.html'));
        return sendJson(res, 404, { error: 'không thấy' });
      }
      if (p === '/') return send(res, 200, FALLBACK, 'text/html; charset=utf-8');
      return sendJson(res, 404, { error: 'không thấy' });
    } catch (e) {
      if (!res.headersSent) sendJson(res, 500, { error: e.message });
      else res.end();
    }
  };

  const server = http.createServer(handler);
  const ping = setInterval(() => { for (const c of clients) c.write(': ping\n\n'); }, 25000);
  let watcher = null;
  let timer = null;
  if (watch) {
    const ignore = /^(build([\\/]|$)|inbox\.jsonl$|\.inbox-offset$)/;
    try {
      watcher = fs.watch(bd, { recursive: true }, (_ev, name) => {
        if (name && ignore.test(String(name))) return;
        clearTimeout(timer);
        timer = setTimeout(() => {
          const r = rebuild();
          log(r.errors.length ? `Build lỗi:\n${r.errors.join('\n')}` : r.summary);
          emit('changed', { ok: !r.errors.length, errors: r.errors });
        }, 200);
      });
      watcher.on('error', () => {});
    } catch (e) { log(`Không watch được .board/: ${e.message}`); }
  }

  const close = () => new Promise((resolve) => {
    clearInterval(ping); clearTimeout(timer);
    if (watcher) watcher.close();
    for (const c of clients) c.end();
    server.close(() => resolve());
    server.closeAllConnections?.();
  });

  return new Promise((resolve, reject) => {
    let tries = 0;
    const listen = (pt) => {
      server.once('error', (e) => {
        if (e.code === 'EADDRINUSE' && tries++ < 10) listen(pt + 1);
        else reject(e);
      });
      server.listen(pt, '127.0.0.1', () => {
        const url = `http://127.0.0.1:${pt}`;
        log(`Plan Board: ${url}  (Ctrl+C để dừng)`);
        if (open) openBrowser(url);
        resolve({ server, port: pt, url, close });
      });
    };
    listen(port);
  });
}
