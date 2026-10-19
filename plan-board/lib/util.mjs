// Tiện ích dùng chung: tìm .board, đọc/ghi, slug.
import fs from 'node:fs';
import path from 'node:path';

export const ID_RE = /^[a-z0-9][a-z0-9._/-]*$/;

export function findBoardRoot(start = process.cwd()) {
  let dir = path.resolve(start);
  for (;;) {
    try {
      if (fs.statSync(path.join(dir, '.board')).isDirectory()) return dir;
    } catch { /* tiếp tục lên */ }
    const up = path.dirname(dir);
    if (up === dir) return null;
    dir = up;
  }
}

export const boardDir = (root) => path.join(root, '.board');

export function readText(file, fallback = '') {
  try {
    return fs.readFileSync(file, 'utf8').replace(/^﻿/, '');
  } catch {
    return fallback;
  }
}

export function readJson(file, fallback = null) {
  const t = readText(file, null);
  if (t === null) return fallback;
  try { return JSON.parse(t); } catch { return fallback; }
}

/** Bỏ dấu tiếng Việt → slug ASCII kebab-case. */
export function slug(s) {
  return String(s)
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function cut(s, n) {
  s = String(s).replace(/\s+/g, ' ').trim();
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

/** Tìm board root hoặc in lỗi và thoát. */
export function needRoot() {
  const root = findBoardRoot();
  if (!root) {
    console.error('Không thấy .board/ — chạy: board init');
    process.exit(1);
  }
  return root;
}

export function listPageFiles(root) {
  const dir = path.join(boardDir(root), 'pages');
  try {
    return fs.readdirSync(dir).filter((f) => /^\d+-.+\.md$/.test(f)).sort();
  } catch {
    return [];
  }
}
