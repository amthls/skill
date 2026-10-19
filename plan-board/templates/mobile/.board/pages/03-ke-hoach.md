---
title: Kế hoạch
lead: Quyết định còn mở và lộ trình
---
## Quyết định cần chốt {#decisions}
> 🎯 Bạn chọn từng hướng; mình ghi lại và cập nhật kế hoạch.
```decision id=framework status=open
? Dùng khung nào?
- flutter: Flutter | Một mã nguồn cho cả hai nền
- rn: React Native | Quen JS/React
- native: Native (Swift/Kotlin) | Hiệu năng tối đa
```

```decision id=offline status=open
? Có cần chạy offline?
- yes: Có | Trải nghiệm tốt khi mất mạng
- no: Không | Đơn giản hơn
```

```decision id=store status=open
? Phát hành ở đâu trước?
- android: Android | Nhanh, rẻ
- ios: iOS | Người dùng trả tiền nhiều hơn
```

## Lộ trình {#roadmap}
- [ ] Chốt khung + nền tảng đầu
- [ ] Khung app + điều hướng
- [ ] Luồng chính chạy được
- [ ] Lưu cục bộ
- [ ] Bản thử nội bộ
