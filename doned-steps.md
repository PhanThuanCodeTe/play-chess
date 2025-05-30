# Cách bước đã thực hiện được

## 1. Cài đặt ban đầu
1. Cài đặt  [NodeJS](https://nodejs.org/en/download).
Kiểm tra xem NodeJS đã cài đặt hay chưa -> `node --version`.
2. Cài đặt NextJs bằng lệnh: `npx create-next-app@latest`
Lựa chọn các cài dặt phù hợp với bản thân.
3. Cài đặt NestJS bằng lệnh:
`npm i -g @nestjs/cli`
`nest new project-name` (thay project-name bằng tên bạn mong muốn).
Vì trong phần cài đặt nestjs có sẳn 1 git folder rồi nên bạn phải cập nhật subfolder git hay xoá luôn .git của nestjs mới push lên git được.
`rmdir /s /q chess-online-backend\.git` > window
`rm -rf chess-online-backend/.git` > linux
## 2. Thiết kế database cho dự án
Dự án mà không có database rõ rang thì như rắn mất đầu, nhà mất móng chi tiết xem Database.md.

## 3. Bắt đầu với Backend
[Bài viết hướng dẫn kết nối nestJs với postgresql qua typeORM](https://medium.com/simform-engineering/nestjs-and-postgresql-a-crud-tutorial-32aa78778752)
