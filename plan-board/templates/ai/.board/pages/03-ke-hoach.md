---
title: Kế hoạch
lead: Quyết định còn mở và lộ trình
---
## Quyết định cần chốt {#decisions}
> 🎯 Bạn chọn từng hướng; mình ghi lại và cập nhật kế hoạch.
```decision id=model status=open
? Dùng mô hình nền nào?
- finetune: Tinh chỉnh mô hình có sẵn | Nhanh, cần ít dữ liệu
- scratch: Tự huấn luyện từ đầu | Kiểm soát hoàn toàn
- api: Gọi API mô hình lớn | Không cần huấn luyện
```

```decision id=metric status=open
? Thước đo chính?
- acc: Độ chính xác | Dễ hiểu
- f1: F1 | Hợp dữ liệu lệch lớp
```

```decision id=compute status=open
? Chạy huấn luyện ở đâu?
- local: Máy cá nhân | Miễn phí
- cloud: GPU đám mây | Mạnh, tốn tiền
```

## Lộ trình {#roadmap}
- [ ] Chốt bài toán + thước đo
- [ ] Có tập dữ liệu sạch
- [ ] Baseline đơn giản
- [ ] Huấn luyện + đánh giá
- [ ] Đưa ra dùng thử
