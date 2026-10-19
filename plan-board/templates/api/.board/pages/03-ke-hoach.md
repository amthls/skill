---
title: Kế hoạch
lead: Quyết định còn mở và lộ trình
---
## Quyết định cần chốt {#decisions}
> 🎯 Bạn chọn từng hướng; mình ghi lại và cập nhật kế hoạch.
```decision id=runtime status=open
? Dùng ngôn ngữ/khung nào?
- node: Node.js | Cùng ngôn ngữ với web
- python: Python (FastAPI) | Nhanh viết, hợp AI
- go: Go | Nhanh, một file chạy
```

```decision id=db status=open
? Cơ sở dữ liệu?
- postgres: PostgreSQL | Quan hệ, mạnh
- sqlite: SQLite | Một file, khởi đầu nhanh
```

```decision id=auth status=open
? Xác thực kiểu nào?
- jwt: JWT | Không trạng thái
- key: API key | Đơn giản cho đối tác
```

## Lộ trình {#roadmap}
- [ ] Chốt công nghệ + DB
- [ ] Khung dự án + một endpoint
- [ ] Xác thực
- [ ] Dữ liệu thật + migrate
- [ ] Triển khai + giám sát
