Cách chạy chương trình:
Đổi tên .env.example thành .env
Mở terminal 2 terminal

Cái 1: --> Chạy Server API
cd server 
npm install
npm install passport passport-google-oauth20
npm install mailer
npm install qs moment

npm run dev
Cái 2: --> Chạy trang web
cd client
npm install

npm run dev
LƯU Ý QUANG TRỌNG !!!!!!!
NHỚ ĐỔI TÊN .env.example thành .env trước khi chạy
NHỚ MỞ MONGO DB RỒI KẾT NỐI MONGO DB TRƯỚC (Bấm Connection)

Nhớ CLONE về xong là TÁCH NHÁNH LIỀN - TÊN NHÁNH MỚI LÀ TÊN MÌNH
TÁCH NHÁNH XONG MỚI CODE - CODE XONG ĐẨY LÊN NHÁNH TÊN MÌNH


!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
Do mấy cái cơ sở dữ liệu cần thiết để mọi người test hoạt động bình thường rồi 
nên mọi người tự tạo dữ liệu để test ở máy của chính mình nha.

Chạy web xong --> Đăng ký 5 tài khoản --> Vào MongoDB
--> Sửa role 1 tài khoản thành admin (không viết hoa)
--> Vào TK admin tạo 1 hoặc n danh mục (tùy mọi người)
--> Vào TK admin tạo 1 hoặc n loại coupon (FREESHIP, GIẢM THEO GIÁ, GIẢM THEO %) --> sau đó có thể tạo 1 đến n coupon

--> Đăng nhập 2 tài khoản bất kỳ (lần lượt) --> Nhấn yêu cầu nâng cấp tài khoản --> Đăng nhập Admin duyệt --> Quay lại 2 tài khoản lúc nãy yêu cầu
--> Tạo 2 shop cho 2 tài khoản đó (lên seller mới tạo được shop) --> Quay lại Admin duyệt shop


--> 2 cái còn lại giữ nguyên.

TẠO SẢN PHẨM:
--> Vào 2 tk seller đã tạo shop --> tạo sản phẩm để test (shop được duyệt mới thêm sản phẩm được) --> có thể tạo thêm coupon riêng của shop

-------> Đó là tất cả dữ liệu cần để các bảng khác hoạt động được


