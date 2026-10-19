---
title: Kế hoạch
lead: Quyết định còn mở và lộ trình
---
## Chọn khung giao diện {#ui}
> 🎯 Bạn chọn một hướng để chốt cách vẽ danh sách.
```decision id=framework status=open
? Dùng khung giao diện nào?
- vanilla: JS thuần | Nhẹ, không cần build
- react: React | Quen thuộc, nhiều thư viện
- svelte: Svelte | Gọn, ít code
```

## Nơi lưu dữ liệu {#storage}
```decision id=storage status=done chosen=local
? Lưu việc ở đâu?
- local: localStorage | Đơn giản, chạy offline
- cloud: Máy chủ | Đồng bộ nhiều máy
note: Bản đầu chỉ cần chạy offline
```

## Lộ trình {#roadmap}
- [x] Bản đầu: thêm / tick
- [ ] Lọc việc
- [ ] Đồng bộ đám mây
