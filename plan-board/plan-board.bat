@echo off
chcp 65001 >nul
REM Mở Plan Board cho thư mục hiện tại (cần có .board/ — tạo bằng: node "%~dp0bin\board.mjs" init --template web)
REM Cách dùng: mở terminal trong thư mục dự án rồi chạy plan-board.bat (thêm --port 4180 nếu cần)
node "%~dp0bin\board.mjs" serve %*
