---
title: Kế hoạch
lead: Quyết định còn mở và lộ trình
---
## Quyết định cần chốt {#decisions}
> 🎯 Bạn chọn từng hướng; mình ghi lại và cập nhật kế hoạch.
```decision id=framework status=open
? Dùng khung nào cho giao diện?
- react: React | Phổ biến, nhiều thư viện
- svelte: Svelte | Gọn, ít code
- vanilla: JS thuần | Không cần build
```

```decision id=hosting status=open
? Triển khai ở đâu?
- static: Hosting tĩnh | Rẻ, đơn giản
- vps: VPS | Toàn quyền, tự quản
```

```decision id=db status=open
? Dùng cơ sở dữ liệu nào?
- sqlite: SQLite | Một file, dễ khởi đầu
- postgres: PostgreSQL | Mạnh, mở rộng tốt
```

## Lộ trình {#roadmap}
- [ ] Chốt khung và hosting
- [ ] Dựng khung trang + điều hướng
- [ ] Làm luồng chính end-to-end
- [ ] Đăng nhập
- [ ] Triển khai bản thử
