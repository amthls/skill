# Mẫu dự án (`board init --template X`)

Mỗi mẫu tạo `.board/` với `board.json`, `graph.txt` (vài node giữ chỗ + 1 flow) và 3 trang:
`01-tong-quan` (mục tiêu, người dùng, hành trình), `02-ky-thuat` (graph + flow), `03-ke-hoach` (quyết định MỞ + lộ trình).
Không ghi đè file đã có. Tên dự án = tên thư mục.

| mẫu | layer mặc định | quyết định mở điển hình |
|---|---|---|
| `blank` | core, ui | stack |
| `web` | infra, data, core, ui, test | framework, hosting, db |
| `game` | engine, gameplay, assets, ui, test | engine, platform, art |
| `api` | infra, data, service, api, test | runtime, db, auth |
| `ai` | data, training, model, serving, eval | model, metric, compute |
| `mobile` | platform, data, core, ui, test | framework, offline, store |

Sau khi init: thay node giữ chỗ (tag `#placeholder`) bằng file/khái niệm thật, điền mục tiêu, chốt từng quyết định bằng `board decide`.
Dự án mẫu đầy đủ mọi tính năng: `examples/demo/.board/`.
