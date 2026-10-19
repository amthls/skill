import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { runInbox, readOffset, pending, appendFeedback } from '../lib/inbox.mjs';

const BIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'bin', 'board.mjs');
const mk = () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pb-in-'));
  fs.mkdirSync(path.join(root, '.board'));
  return root;
};
const inboxPath = (root) => path.join(root, '.board', 'inbox.jsonl');
const line = (o) => JSON.stringify({ t: 'x', page: 'ky-thuat', sec: 'arch', node: '', kind: 'comment', val: '', text: '', ...o }) + '\n';
const hook = (cwd, prompt) => spawnSync('node', [BIN, 'hook'], { cwd, input: JSON.stringify({ prompt }), encoding: 'utf8' });

test('định dạng §5 + offset đến \\n cuối', () => {
  const root = mk();
  const l1 = line({ kind: 'ask', text: 'Vì sao tách core?' });
  const l2 = line({ sec: 'renderer', kind: 'choose', val: 'three' });
  const l3 = line({ node: 'file:js/app.js', text: 'node này rối' });
  fs.writeFileSync(inboxPath(root), l1 + l2 + l3);
  const r = runInbox(root);
  const total = Buffer.byteLength(l1 + l2 + l3);
  assert.equal(r.text, `[board ky-thuat] 3 góp ý\n- arch: ask "Vì sao tách core?"\n- renderer: choose three\n- arch@file:js/app.js: comment "node này rối"\n[inbox@${total}]`);
  assert.equal(readOffset(root), total);
  assert.equal(runInbox(root).text, '', 'không in lại');
});

test('dòng cuối dở dang không được tính, đọc tiếp khi đủ', () => {
  const root = mk();
  const l1 = line({ text: 'một' });
  const l2 = line({ text: 'hai' });
  fs.writeFileSync(inboxPath(root), l1 + l2.slice(0, 10));
  const r1 = runInbox(root);
  assert.match(r1.text, /1 góp ý/);
  assert.equal(readOffset(root), Buffer.byteLength(l1));
  assert.equal(runInbox(root).text, '');
  fs.appendFileSync(inboxPath(root), l2.slice(10));
  const r2 = runInbox(root);
  assert.match(r2.text, /"hai"/);
  assert.equal(readOffset(root), Buffer.byteLength(l1 + l2));
});

test('--peek không đẩy offset', () => {
  const root = mk();
  fs.writeFileSync(inboxPath(root), line({ text: 'a' }));
  assert.ok(runInbox(root, { peek: true }).text);
  assert.equal(readOffset(root), 0);
  assert.ok(runInbox(root).text);
});

test('[inbox@N] trong prompt nâng offset (hook không in trùng)', () => {
  const root = mk();
  const l1 = line({ text: 'đã dán' });
  const l2 = line({ text: 'mới' });
  fs.writeFileSync(inboxPath(root), l1 + l2);
  const n = Buffer.byteLength(l1);
  const out = hook(root, `đây là góp ý\n[board ky-thuat] 1 góp ý\n- arch: comment "đã dán"\n[inbox@${n}]`);
  assert.equal(out.status, 0);
  assert.ok(out.stdout.startsWith('[plan-board] góp ý mới:\n[board ky-thuat] 1 góp ý'));
  assert.ok(out.stdout.includes('"mới"') && !out.stdout.includes('đã dán'));
  assert.equal(readOffset(root), Buffer.byteLength(l1 + l2));
  assert.equal(hook(root, 'tiếp').stdout, '', 'lần sau im lặng');
});

test('giới hạn 20 dòng + "…còn K mục", offset dừng đúng chỗ', () => {
  const root = mk();
  const rows = Array.from({ length: 30 }, (_, i) => line({ text: `m${i}` }));
  fs.writeFileSync(inboxPath(root), rows.join(''));
  const r = runInbox(root);
  const lines = r.text.split('\n');
  assert.equal(lines.length, 20 + 2);
  assert.equal(lines[0], '[board ky-thuat] 19 góp ý');
  assert.equal(lines[20], '…còn 11 mục (board inbox)');
  const n = Buffer.byteLength(rows.slice(0, 19).join(''));
  assert.equal(lines[21], `[inbox@${n}]`);
  assert.equal(readOffset(root), n);
  const r2 = runInbox(root);
  assert.match(r2.text, /11 góp ý/);
  assert.ok(!r2.text.includes('…còn'));
});

test('nhiều trang → nhiều header; chuỗi dài cắt 200', () => {
  const root = mk();
  fs.writeFileSync(inboxPath(root), line({ page: 'a', text: 'x'.repeat(500) }) + line({ page: 'b' }));
  const t = runInbox(root).text.split('\n');
  assert.equal(t[0], '[board a] 1 góp ý');
  assert.ok(t[1].length < 230 && t[1].includes('…'));
  assert.equal(t[2], '[board b] 1 góp ý');
});

test('pending + appendFeedback', () => {
  const root = mk();
  appendFeedback(root, { page: 'p', sec: 's', kind: 'ask', text: 'q' });
  const p = pending(root);
  assert.equal(p.pending, 1);
  assert.match(p.text, /\[inbox@\d+\]$/);
  assert.throws(() => appendFeedback(root, { kind: 'bad' }));
  assert.equal(readOffset(root), 0, 'pending không đẩy offset');
});

test('hook im lặng khi không có .board/', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pb-none-'));
  const out = hook(dir, 'xin chào');
  assert.equal(out.status, 0);
  assert.equal(out.stdout, '');
  assert.equal(out.stderr, '');
  const empty = spawnSync('node', [BIN, 'hook'], { cwd: dir, input: '', encoding: 'utf8' });
  assert.equal(empty.stdout + empty.stderr, '');
});
