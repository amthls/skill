---
title: Kỹ thuật
lead: Kiến trúc 3 tầng và luồng chính
---
## Kiến trúc 3 tầng {#arch}
> 🎯 Bạn sẽ thấy vì sao tách dữ liệu, logic và giao diện.
```graph
layers: data, logic, ui   # lọc theo layer
ids: src/app.js
focus: src/core/tasks.js
max: 30
direction: RIGHT
src: plan
```
Logic thuần nên **dễ test**, không đụng DOM.

## Luồng thêm việc {#add}
```flow
add-task
```
```flow
toggle
```

## Bản đồ nhỏ {#small}
```graph
layers: logic
direction: DOWN
```

## Demo tương tác {#demo}
```embed
src: .board/embeds/demo.html#s1
height: 240
```

```js
// code thường vẫn được giữ nguyên
## không phải heading
```
