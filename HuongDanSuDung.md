# HƯỚNG DẪN CHẠY VÀ SỬ DỤNG DỰ ÁN GAS STATION AI

Dự án của bạn được chia làm 2 phần độc lập: **Backend** (Xử lý dữ liệu, Database) và **Frontend** (Giao diện người dùng). Để dự án hoạt động, bạn cần chạy cả 2 phần này song song.

## 1. Dữ liệu có bị mất khi tắt máy không?
**Câu trả lời là KHÔNG.**
Toàn bộ dữ liệu (tài khoản, tồn kho bồn chứa, lịch sử bán hàng, giá xăng) đều được lưu trữ vĩnh viễn trong file cơ sở dữ liệu `gas_station.db` nằm ở thư mục `backend`. Dù bạn tắt máy tính hay khởi động lại, dữ liệu vẫn sẽ được giữ nguyên vẹn 100%.

---

## 2. Cách khởi động dự án (Dành cho ngày mai hoặc khi báo cáo)
Nếu bạn tắt VS Code đi và muốn mở lại dự án để dùng, hãy làm theo đúng 2 bước sau:

### Bước 1: Khởi động Backend (Máy chủ dữ liệu)
1. Mở Terminal mới trong VS Code.
2. Gõ lệnh di chuyển vào thư mục backend:
   ```bash
   cd backend
   .\venv\Scripts\activate

   ```
3. Gõ lệnh khởi động máy chủ:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   *(Chỉ cần thấy dòng `Application startup complete.` là Backend đã chạy thành công).*

### Bước 2: Khởi động Frontend (Giao diện)
1. Mở thêm một Terminal thứ hai (dấu `+` trên thanh Terminal).
2. Gõ lệnh di chuyển vào thư mục frontend:
   ```bash
   cd frontend
   ```
3. Gõ lệnh khởi động giao diện:
   ```bash
   npm run dev
   ```
4. Khi chạy xong, Terminal sẽ hiện ra một đường link (thường là `http://localhost:5173`). Bạn giữ nút **Ctrl** trên bàn phím và click chuột trái vào đường link đó để mở trang web.

---

## 3. Cách sử dụng hiện tại
Hiện tại, tôi (AI) ĐÃ KHỞI ĐỘNG SẴN cả Backend và Frontend cho bạn rồi! 
Bạn không cần gõ lệnh gì cả. Chỉ cần mở trình duyệt web (Chrome, Cốc Cốc...) và truy cập vào địa chỉ sau:

👉 **http://localhost:5173**

### Thông tin tài khoản đăng nhập:
- **Tài khoản Quản lý (Full quyền, có quản lý giá và Dashboard):**
  - Tên đăng nhập: `admin`
  - Mật khẩu: `password`

- **Tài khoản Nhân viên (Chỉ có quyền bán hàng trong ca):**
  - Tên đăng nhập: `nhanvien`
  - Mật khẩu: `password`

Chúc bạn có một buổi báo cáo đồ án thật thành công và đạt điểm tuyệt đối nhé!
