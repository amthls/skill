// board init [--template X]: chép templates/<X>/.board vào project, không ghi đè.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TEMPLATES = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'templates');
export const TEMPLATE_NAMES = ['blank', 'web', 'game', 'api', 'ai', 'mobile'];

function copyTree(src, dst, created, skipped, base) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name);
    const d = path.join(dst, e.name);
    if (e.isDirectory()) copyTree(s, d, created, skipped, base);
    else if (fs.existsSync(d)) skipped.push(path.relative(base, d));
    else { fs.copyFileSync(s, d); created.push(path.relative(base, d)); }
  }
}

export function init(root, template = 'blank') {
  if (!TEMPLATE_NAMES.includes(template)) return { ok: false, msg: `template "${template}" không có (dùng: ${TEMPLATE_NAMES.join('|')})` };
  const src = path.join(TEMPLATES, template, '.board');
  const created = []; const skipped = [];
  copyTree(src, path.join(root, '.board'), created, skipped, path.join(root, '.board'));
  const bj = path.join(root, '.board', 'board.json');
  if (created.includes('board.json')) { // tên project = tên thư mục
    try {
      const j = JSON.parse(fs.readFileSync(bj, 'utf8'));
      j.title = path.basename(path.resolve(root)) || j.title;
      fs.writeFileSync(bj, JSON.stringify(j, null, 2) + '\n');
    } catch { /* giữ nguyên */ }
  }
  const gi = path.join(root, '.board', '.gitignore');
  if (!fs.existsSync(gi)) fs.writeFileSync(gi, 'build/\n.inbox-offset\ninbox.jsonl\n');
  return { ok: true, msg: `OK template ${template}: tạo ${created.length} file${skipped.length ? `, giữ nguyên ${skipped.length}` : ''}` };
}
