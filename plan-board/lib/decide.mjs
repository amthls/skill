// board decide <decisionId> <optionId> ["note"] — viết lại fence decision thành done.
import fs from 'node:fs';
import path from 'node:path';
import { boardDir, listPageFiles } from './util.mjs';
import { parsePage } from './pages.mjs';

/** @returns {{ok:boolean,msg:string}} */
export function decide(root, decisionId, optionId, note = '') {
  const dir = path.join(boardDir(root), 'pages');
  for (const file of listPageFiles(root)) {
    const full = path.join(dir, file);
    const text = fs.readFileSync(full, 'utf8').replace(/^﻿/, '');
    const { page } = parsePage(text, file);
    for (const s of page.sections) {
      for (const b of s.blocks) {
        if (b.kind !== 'decision' || b.id !== decisionId) continue;
        if (!b.options.some((o) => o.id === optionId)) {
          return { ok: false, msg: `option "${optionId}" không có trong "${decisionId}" (có: ${b.options.map((o) => o.id).join(', ')})` };
        }
        const eol = text.includes('\r\n') ? '\r\n' : '\n';
        const lines = text.split(/\r?\n/);
        const open = b._line - 1;
        const close = b._end - 1; // dòng ``` đóng (hoặc hết file)
        const ticks = /^(`{3,})/.exec(lines[open])[1];
        const body = lines.slice(open + 1, close).filter((l) => !/^\s*note\s*:/.test(l));
        while (body.length && !body[body.length - 1].trim()) body.pop();
        const n = String(note || '').replace(/\s+/g, ' ').trim();
        if (n) body.push(`note: ${n}`);
        const head = `${ticks}decision id=${decisionId} status=done chosen=${optionId}`;
        const out = [...lines.slice(0, open), head, ...body, ...lines.slice(close)];
        fs.writeFileSync(full, out.join(eol));
        return { ok: true, msg: `OK ${decisionId} → ${optionId} (${page.id}#${s.id})` };
      }
    }
  }
  return { ok: false, msg: `không thấy decision "${decisionId}"` };
}
