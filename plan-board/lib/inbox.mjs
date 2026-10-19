// inbox.jsonl (§5): đọc theo offset byte, định dạng, hook UserPromptSubmit.
import fs from 'node:fs';
import path from 'node:path';
import { boardDir, cut, findBoardRoot } from './util.mjs';

export const CAP = 20;
export const KINDS = ['comment', 'choose', 'edit', 'ask'];
const inboxFile = (root) => path.join(boardDir(root), 'inbox.jsonl');
const offsetFile = (root) => path.join(boardDir(root), '.inbox-offset');

export function readOffset(root) {
  try {
    const n = parseInt(fs.readFileSync(offsetFile(root), 'utf8').trim(), 10);
    return n >= 0 ? n : 0;
  } catch { return 0; }
}
export const writeOffset = (root, n) => fs.writeFileSync(offsetFile(root), String(n));

function readInbox(root) {
  try { return fs.readFileSync(inboxFile(root)); } catch { return Buffer.alloc(0); }
}

/**
 * Các mục hoàn chỉnh (kết thúc bằng \n) từ `offset`. Dòng cuối dở dang bị bỏ qua.
 * @returns {{entries:{o:object,end:number}[], end:number}} end = offset sau dòng \n cuối cùng
 */
export function scan(root, offset) {
  const buf = readInbox(root);
  const last = buf.lastIndexOf(0x0a) + 1; // byte sau \n cuối cùng
  if (offset > last) offset = 0; // file bị cắt ngắn/xoá → đọc lại từ đầu
  const entries = [];
  let pos = offset;
  while (pos < last) {
    const nl = buf.indexOf(0x0a, pos);
    const line = buf.toString('utf8', pos, nl).trim();
    pos = nl + 1;
    if (!line) continue;
    try {
      const o = JSON.parse(line);
      if (o && typeof o === 'object') entries.push({ o, end: pos });
    } catch { /* bỏ dòng hỏng */ }
  }
  return { entries, end: last, start: offset };
}

const itemLine = (o) => {
  const sec = o.sec || 'chung';
  const who = o.node ? `${sec}@${o.node}` : sec;
  const parts = [o.kind || 'comment'];
  if (o.val) parts.push(cut(o.val, 200));
  if (o.text) parts.push(`"${cut(o.text, 200)}"`);
  return `- ${who}: ${parts.join(' ')}`;
};

/** Định dạng §5, tối đa `cap` dòng nội dung; trả text + offset kế tiếp. */
export function render(entries, end, cap = CAP) {
  const pages = new Map();
  let lines = 0;
  let take = 0;
  for (const { o } of entries) {
    const page = o.page || 'chung';
    const add = 1 + (pages.has(page) ? 0 : 1);
    if (lines + add > cap && take > 0) break;
    lines += add;
    if (!pages.has(page)) pages.set(page, []);
    pages.get(page).push(itemLine(o));
    take++;
  }
  const remaining = entries.length - take;
  const next = remaining > 0 ? entries[take - 1].end : end;
  const out = [];
  for (const [page, items] of pages) {
    out.push(`[board ${page}] ${items.length} góp ý`, ...items);
  }
  if (remaining > 0) out.push(`…còn ${remaining} mục (board inbox)`);
  if (take > 0 || remaining > 0) out.push(`[inbox@${next}]`);
  return { text: out.join('\n'), next, taken: take, remaining };
}

/** Trạng thái chờ gửi — dùng cho server (/api/inbox/pending) và context. */
export function pending(root) {
  const { entries, end } = scan(root, readOffset(root));
  const r = render(entries, end);
  return { pending: entries.length, text: r.text };
}

export function pendingCount(root) {
  return scan(root, readOffset(root)).entries.length;
}

/** Thêm một góp ý (server gọi). Ném lỗi nếu dữ liệu sai. */
export function appendFeedback(root, body) {
  if (!body || typeof body !== 'object') throw new Error('body phải là object JSON');
  const s = (v, n) => (typeof v === 'string' ? v.slice(0, n) : '');
  if (!KINDS.includes(body.kind)) throw new Error(`kind phải là ${KINDS.join('|')}`);
  const rec = {
    t: new Date().toISOString(), page: s(body.page, 200), sec: s(body.sec, 200), node: s(body.node, 500),
    kind: body.kind, val: s(body.val, 500), text: s(body.text, 2000),
  };
  const file = inboxFile(root);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  let prefix = '';
  try {
    const st = fs.statSync(file);
    if (st.size > 0) {
      const fd = fs.openSync(file, 'r');
      const b = Buffer.alloc(1);
      fs.readSync(fd, b, 0, 1, st.size - 1);
      fs.closeSync(fd);
      if (b[0] !== 0x0a) prefix = '\n'; // dòng cũ dở dang → tách riêng
    }
  } catch { /* chưa có file */ }
  fs.appendFileSync(file, prefix + JSON.stringify(rec) + '\n');
  return rec;
}

/** `board inbox [--peek]` — promptOffset: N lớn nhất trong các `[inbox@N]` của prompt. */
export function runInbox(root, { peek = false, header = '', promptOffset = 0 } = {}) {
  const stored = readOffset(root);
  const { entries, end, start } = scan(root, stored);
  let offset = start;
  if (promptOffset > offset) offset = Math.min(promptOffset, end);
  const todo = entries.filter((e) => e.end > offset);
  const r = render(todo, end);
  const next = todo.length ? r.next : Math.max(offset, end);
  if (!peek && next !== stored) writeOffset(root, next);
  return { text: r.text ? header + r.text : '', count: todo.length };
}

function readStdin(timeoutMs = 1500) {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) return resolve('');
    let data = '';
    const done = () => resolve(data);
    const t = setTimeout(done, timeoutMs);
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => { data += c; });
    process.stdin.on('end', () => { clearTimeout(t); done(); });
    process.stdin.on('error', () => { clearTimeout(t); done(); });
  });
}

/** Hook UserPromptSubmit: im lặng nếu không có .board/ hoặc không có góp ý mới. */
export async function runHook() {
  let prompt = '';
  let cwd = '';
  try {
    const j = JSON.parse(await readStdin());
    prompt = typeof j.prompt === 'string' ? j.prompt : '';
    cwd = typeof j.cwd === 'string' ? j.cwd : '';
  } catch { /* stdin không phải JSON */ }
  const root = findBoardRoot(process.cwd()) || (cwd && findBoardRoot(cwd));
  if (!root) return 0;
  let promptOffset = 0;
  for (const m of prompt.matchAll(/\[inbox@(\d+)\]/g)) promptOffset = Math.max(promptOffset, parseInt(m[1], 10));
  const r = runInbox(root, { header: '[plan-board] góp ý mới:\n', promptOffset });
  if (r.text) process.stdout.write(r.text + '\n');
  return 0;
}
