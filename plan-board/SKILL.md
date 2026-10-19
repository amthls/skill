---
name: plan-board
description: Lập kế hoạch, bàn bạc, thiết kế hoặc giải thích kiến trúc của BẤT KỲ dự án nào (web, game, API, AI, mobile…) trên một bảng web trực quan thay vì chat chữ. Dùng khi người dùng muốn "lên kế hoạch", "thảo luận thiết kế", "vẽ kiến trúc/sơ đồ", "giải thích dự án", cần một plan board / bảng kế hoạch / diagram trực quan, hoặc muốn chọn phương án rồi góp ý ngay trên trang.
---

# Plan Board

Bảng kế hoạch cục bộ: AI chỉ viết text gọn trong `<project>/.board/`, CLI `board` biên dịch thành đồ thị + trang thảo luận, người dùng xem/chọn/góp ý trên web.

CLI: `node ~/.claude/skills/plan-board/bin/board.mjs <lệnh>` (gọi tắt `board`).

## 1. Khi nào dùng
- Người dùng muốn lên kế hoạch / thảo luận / thiết kế / giải thích kiến trúc một dự án (mới hoặc có sẵn).
- Cần chọn giữa nhiều phương án (framework, hosting, DB…) và ghi lại quyết định.
- Cần sơ đồ, luồng chạy từng bước, hoặc trang giải thích trực quan thay vì đoạn chat dài.
- KHÔNG dùng cho sửa code thường ngày hay câu hỏi một dòng.

## 2. Vòng lặp
1. `board init --template web|game|api|ai|mobile|blank` (trong thư mục dự án; không ghi đè file có sẵn).
2. Sửa `.board/graph.txt` (kiến trúc + flow) và `.board/pages/NN-*.md` (trang thảo luận). Cú pháp: `docs/DSL-CHEATSHEET.md`.
3. `board check` — lặp đến khi in `OK … check ✓`.
4. `board serve` (chạy NỀN, vd `run_in_background`) — báo URL cho người dùng, rồi dừng nói; họ xem và góp ý trên trang.
5. Góp ý đến qua hook (tự chèn `[plan-board] góp ý mới:`) hoặc người dùng dán khối `[board …] … [inbox@N]`. Cần xem lại: `board inbox`.
6. Áp dụng: sửa NHỎ trong `.board/` (Edit đúng đoạn), chốt lựa chọn bằng `board decide <id> <option> "ghi chú"`, rồi `board check`. Server tự dựng lại; quay lại bước 4.
Hook cần cài một lần: xem `settings-snippet.json` (người dùng tự dán vào settings.json).

## 3. QUY TẮC TIẾT KIỆM TOKEN (bắt buộc)
- CHỈ viết text trong `.board/` (graph.txt, pages/*.md, embeds/). Không sửa code UI của kit.
- KHÔNG đọc `.board/build/` hay `dist/` (file sinh ra, rất lớn).
- Muốn biết trạng thái: `board context` (≤40 dòng). Muốn chi tiết một thứ: `board get <node-ref | trang#mục | flow-id | decision-id>`. Không đọc cả file để "xem lại".
- Dùng Edit cho đoạn nhỏ; không viết lại cả file. Thêm node/trang = thêm vài dòng.
- Mỗi summary / mô tả ≤ 100 ký tự. Trang ngắn, mỗi mục một ý, mở đầu bằng `> 🎯 Bạn sẽ hiểu được: …`.
- Kiểm tra bằng `board check`, KHÔNG chụp màn hình (chỉ chụp khi sửa chính UI của kit).
- Giao việc cho subagent: đưa ĐƯỜNG DẪN file, không dán nội dung; bắt trả lời ≤ 10 dòng.
- Việc kiểm tra/lặt vặt (check, tóm tắt, rà lỗi) dùng Haiku.
- Mọi id (trang, mục, flow, decision, layer) dạng `a-z0-9._/-`, ổn định — sửa theo id, đừng đổi tên.

## 4. Các khối trong trang `.md`
Chỉ 5 loại fence đặc biệt: `graph`, `flow`, `decision`, `cards`, `embed` (ví dụ ở `docs/DSL-CHEATSHEET.md`). Còn lại là markdown GFM thường (bảng, `- [ ]`, danh sách có số).
Quyết định đang mở: `decision id=… status=open`; `board decide` chuyển thành `status=done chosen=…`.

## 5. Tra cứu khi cần (đừng đọc trước)
- Hợp đồng đầy đủ: `schema/SCHEMA.md`
- Cú pháp nhanh: `docs/DSL-CHEATSHEET.md` · mẫu: `docs/TEMPLATES.md`
- Dự án mẫu chạy được: `examples/demo/.board/`
- Chạy cho người dùng: `plan-board.bat` (trong thư mục dự án).
