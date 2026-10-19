# Cheatsheet — `.board/graph.txt`
```
== core: Bộ não | Logic thuần          # layer: id: Tên | mô tả (node bên dưới thuộc layer)
js/core/model.js : Lưu 54 ô #model !moderate     # file: ref : tóm tắt #tag !độ-phức-tạp
  fn applyMove(state, move) -> state : Xoay 1 mặt   # hàm, thụt lề dưới file
lib:three [service] : Thư viện 3D                # lib:x = service
auth-flow : Khái niệm không có file               # còn lại = concept
db/schema.sql [schema] : ép loại node (UA NodeType)
--                                               # hết layer; node sau không thuộc layer
js/app.js -> js/core/model.js, js/ui/view.js : gọi   # cạnh, nhiều đích
js/ui/view.js -> lib:three [depends_on]          # [loại cạnh], mặc định imports (file→file) hoặc calls
js/app.js.run -> js/core/model.js.applyMove      # file.fn là ref hợp lệ
```
Mặc định: tóm tắt `""`, tag `[]`, độ phức tạp `simple` (simple|moderate|complex). Ref phải định nghĩa TRƯỚC khi dùng. Chú thích: `#` đầu dòng hoặc ` # `; `#tag` dính liền là tag.

## Flow
```
>> flow paint: Tô 1 ô | Người dùng chạm lưới
js/ui/net.js : Nhận chạm | vào: index 20 | ra: {index:20,color:"R"}
js/app.js.run : Gọi logic
```
Hết flow khi gặp `>>`, `==`, `--` hoặc hết file. `vào:`/`ra:` tuỳ chọn.

## Trang `pages/NN-<id>.md` (id = tên file bỏ `NN-`)
```
---
title: Kỹ thuật
lead: Một dòng mô tả
---
## Kiến trúc {#arch}
> 🎯 Bạn sẽ hiểu được: …
```
Mục bắt đầu ở mỗi `##`; `{#id}` tuỳ chọn (không có thì tự sinh từ tiêu đề).

````
```graph
layers: core, ui      # lọc layer (tuỳ chọn)
ids: js/app.js        # lọc thêm ref
focus: js/app.js
max: 40               # mặc định 40
direction: RIGHT      # RIGHT|DOWN
src: plan             # plan|ua
```
```flow
paint
```
```decision id=renderer status=open
? Dùng thư viện 3D nào?
- three: Three.js | Phổ biến
- css: CSS 3D | Nhẹ
```
```cards
🎨 Bạn tô màu | Tô lại khối
```
```embed
src: giai-thich/index.html#s4    # đường dẫn từ gốc dự án, hoặc http(s)
height: 420
```
````
Chốt quyết định: `board decide renderer three "ghi chú"` → `status=done chosen=three` + `note:`.
