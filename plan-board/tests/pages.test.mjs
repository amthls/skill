import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePage } from '../lib/pages.mjs';

const MD = `---
title: Kỹ thuật
lead: Một dòng
---
Giới thiệu trước mục.

## Kiến trúc 3 tầng {#arch}
> 🎯 Bạn sẽ hiểu được: tầng
Đoạn **markdown** với | bảng.
\`\`\`graph
layers: core, ui   # lọc
max: 10
direction: DOWN
\`\`\`
\`\`\`flow
paint
\`\`\`
\`\`\`js
## không phải heading
\`\`\`

## Trả lời nhanh
\`\`\`decision id=renderer status=open
? Dùng thư viện 3D nào?
- three: Three.js | Phổ biến, 3D thật
- css: CSS 3D | Nhẹ
\`\`\`
\`\`\`cards
🎨 Bạn tô màu | Tô lại khối
Không icon
\`\`\`
\`\`\`embed
src: giai-thich/index.html#s4
height: 420
\`\`\`
`;

test('frontmatter, section id, lead, 5 loại block', () => {
  const { page, errors } = parsePage(MD, '02-ky-thuat.md');
  assert.deepEqual(errors, []);
  assert.equal(page.id, 'ky-thuat'); assert.equal(page.title, 'Kỹ thuật'); assert.equal(page.lead, 'Một dòng');
  assert.deepEqual(page.sections.map((s) => s.id), ['intro', 'arch', 'tra-loi-nhanh']);
  const arch = page.sections[1];
  assert.equal(arch.title, 'Kiến trúc 3 tầng'); assert.equal(arch.lead, 'Bạn sẽ hiểu được: tầng');
  assert.deepEqual(arch.blocks.map((b) => b.kind), ['md', 'graph', 'flow', 'md']);
  assert.ok(!arch.blocks[0].md.includes('🎯'));
  assert.ok(arch.blocks[3].md.includes('## không phải heading'), 'fence code thường giữ nguyên');
  const g = arch.blocks[1];
  assert.deepEqual([g.layers, g.max, g.direction, g.src, g.ids, g.focus], [['core', 'ui'], 10, 'DOWN', 'plan', [], '']);
  assert.equal(arch.blocks[2].id, 'paint');
  const [dec, cards, embed] = page.sections[2].blocks;
  assert.deepEqual([dec.id, dec.status, dec.question, dec.options.length, dec.options[0]],
    ['renderer', 'open', 'Dùng thư viện 3D nào?', 2, { id: 'three', label: 'Three.js', desc: 'Phổ biến, 3D thật' }]);
  assert.deepEqual(cards.items, [{ icon: '🎨', title: 'Bạn tô màu', desc: 'Tô lại khối' }, { icon: '', title: 'Không icon', desc: '' }]);
  assert.deepEqual([embed.src, embed.height], ['giai-thich/index.html#s4', 420]);
});

test('lỗi: id mục trùng, fence không đóng, khóa lạ', () => {
  const r = parsePage('## A\n## A\n```graph\nfoo: 1\n```\n```flow\nx', '01-x.md');
  assert.ok(r.errors.some((e) => e.line === 2 && /trùng/.test(e.msg)));
  assert.ok(r.errors.some((e) => e.line === 4 && /foo/.test(e.msg)));
  assert.ok(r.errors.some((e) => e.line === 6 && /đóng/.test(e.msg)));
});
