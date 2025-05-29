# Dự án chơi cờ vua online một mình tao làm

## 1. Lên ý tưởng
Tạo ra 1 hệ thống để người chơi có thể chơi cờ vua cross-platform (Website, **Android, IOS, Window** nào in đậm thì làm sau giờ không có rảnh :)), người chơi có thể tạo phòng thi đấu với nhau hay có thể leo rank nếu muốn.
## 2. Chi tiết về trò chơi
- Giao diện:
    - Trang chủ: Trang đơn giản giới thiệu trò chơi, nếu chưa dăng nhập thì hiện đăng nhập đăng ký.
    - Sau khi đăng nhập thì hiện Chơi (Rank), Tự do (tạo phòng, nhập số phòng), Giao diện (tạm thời chỉ có csdl để người chơi thay đổi sân đấu, quân cờ), đăng xuất (thoát tài khoản).
    - Giao diện Ghép trận (Có nút chấp nhận chơi và từ chối).
    - Giao diện Profile người chơi.
    - Giao diện nhập số phòng, tạo phòng, phòng chờ, người xem trận cờ trong phòng đó (tối đa 3 người).
    - Giao diện chơi cờ: xoay tuỳ theo góc nhìn của người chơi mà nó sẽ xuất hiện phía dưới màn hình còn đối thủ thì hiện ở trên, còn người xem thì mặc định là quân đen phía trên quân trắng phía dưới (csdl phải lưu hình ảnh với tên mặc định den trắng để sau này dễ mở tính năng skin cho trang web).
    - Thông báo chiến thắng, thua cuộc và hoà (hên xui).
- Quy tắc:
    - Mỗi người chơi có skin cờ và bàn cờ riêng biệt, nếu 2 người chọn 2 bộ skin khác nhau thì phân nửa sân sẽ là skin của mỗi người (cờ không có vụ giống nhau tại bên trắng bên đen rồi)
    - Có 7 mức rank tương ứng với các cột mốc sau:
        - 0 - 100 điểm: Rookie
        - 101 - 500 điểm: Primary
        - 501 - 1000 điểm: Veteran
        - 1001 - 2000 điểm: Master
        - 2001 - 5000 điểm: Grandmaster
        - Trên 500 điểm : God I - Mỗi 5000 điểm sẽ tăng 1 như God II, III, IV, ...
    - Ghép trận sẽ ghép người gần điểm nhất với người chơi, nếu quá 1 phút thì ghép với AI theo rank của ngời chơi, Profile bất kỳ.
    - Điểm cộng trừ cho mức rank:
        - Rookie: Thắng +20; Thua +5.
        - Primary: Thắng +30; Thua không trừ.
        - Veteran: Thắng +35; Thua -10.
        - Master: Thắng +50; Thua -30.
        - Grandmaster: Thắng +60; Thua -40.
        - God I trở lên: Thắng +60; Thua -60.
    - Chức năng custom Profile: Thay avatar, Viền avatar (Viền avatar sẽ có khi đạt thành tựu hay lên rank trên Rookie), Thay Background, Thay tên người chơi, Thay slogan.
    - Tích hợp thêm AI chơi với người chơi.
## 3. Định hướng thực hiện
- Frontend: NextJS + MUI + TailwindCSS.
- Backend: NestJS + Socket.io + TypeORM.
- Database: Firebase.
## 4. Dự kiến
### Tuần 1 (Cốt lõi backend + frontend):
- Đăng ký / đăng nhập (Firebase Auth).
- Giao diện trang chủ, chơi nhanh, tạo phòng, vào phòng.
- Backend NestJS xử lý tạo phòng, lưu người chơi, trạng thái phòng.
- Tạo giao diện chơi cờ cơ bản + Socket.io truyền nước đi.
- Lưu game vào Firebase (realtime DB hoặc Firestore).
- Giao diện thắng / thua / hòa.
### Tuần 2 (Hoàn thiện, thêm tính năng):
- Giao diện profile người chơi + tùy chỉnh avatar / slogan.
- Hệ thống rank và điểm.
- Tùy chỉnh skin bàn cờ.
- Ghép trận tự động (nếu không tìm thấy người → chơi với bot).
- Thêm người xem (dạng read-only).
- Hoàn thiện UX/UI: popup, hiệu ứng, validate, loading.
