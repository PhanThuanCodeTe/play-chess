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

Sau khi làm theo bài viết trên the ý mình thì đã kết nối đến database thành công.
Tiếp theo tôi thấy respone trả về chưa đúng như mong muốn nên tôi phải chỉnh sửa lại để có thể trả về đúng dạng mà mình cần.
{
    success: true/false,
    message: "message",
    response: {}/null
}
Tạo 1 utils để sửa đổi respone trả về đặt tại /src/utils/api-respone.util.ts

Tiếp đó tôi không muốn các biến như tài khoản, mật khẩu, port, tên database bị lộ ra ngoài, điều đó khiến cho hacker có thể dễ dàng truy cập database của mình.
Vì vậy nên tôi phải thêm 1 file .env để chứa các thông tin cần thiết để kết nối đến database.

Mà sau này tôi cũng cần có nhiều loại config hay kết nối khác nữa nên tôi nghĩ mình nên tạo ra 1 folder config và đặt tất cả các file config vào đó.

### 4. Thêm JWT cho project
1. Cài đặt cái gói cần thiết
> npm install @nestjs/jwt @nestjs/passport passport passport-jwt passport-local
> npm install -D @types/passport-jwt @types/passport-local
> nest g module auth -> lười biếng
> nest g controller auth -> lười biếng
> nest g service auth -> lười biếng

Nên tự tay tạo ra từng file một rồi cập nhật app.module nhé. Đừng như tôi :<






