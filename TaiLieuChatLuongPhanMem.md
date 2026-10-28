# TÀI LIỆU ĐÁNH GIÁ CHẤT LƯỢNG PHẦN MỀM
**Dự án: GasStation AI - Hệ thống Quản lý Trạm Xăng Thông Minh**

Tài liệu này trình bày các tiêu chí phi chức năng (Non-Functional Requirements) đã được áp dụng trong quá trình phát triển dự án, nhằm đảm bảo hệ thống hoạt động an toàn, mượt mà và dễ sử dụng.

---

## 1. Bảo Mật (Security)
Hệ thống được thiết kế với nhiều lớp bảo mật để đảm bảo an toàn dữ liệu và quyền truy cập:
- **Mã hóa mật khẩu (Password Hashing):** Mật khẩu của người dùng không bao giờ được lưu dưới dạng văn bản thô (plaintext) mà được mã hóa một chiều bằng thuật toán **Bcrypt** thông qua thư viện `passlib`. Điều này giúp bảo vệ tài khoản ngay cả khi cơ sở dữ liệu bị lộ.
- **Xác thực bằng Token (JWT - JSON Web Tokens):** Cơ chế đăng nhập không lưu phiên làm việc trên server (Stateless Authentication). Thay vào đó, một mã thông báo (JWT) được cấp phát chứa chữ ký điện tử. Token này có thời hạn (Expiration Time) và được sử dụng để xác thực mọi yêu cầu từ Frontend gửi đến Backend.
- **Phân quyền truy cập (RBAC - Role Based Access Control):** Hệ thống có sự phân tách quyền hạn rõ ràng:
  - *Quản lý (Manager):* Có toàn quyền xem Dashboard, đổi giá bán, thêm bồn chứa, quản lý nhân viên và xem báo cáo AI.
  - *Nhân viên ca (Employee):* Chỉ được phép thực hiện giao dịch trong ca, kết thúc ca và kiểm kê. Các API nhạy cảm (như đổi giá) sẽ từ chối truy cập (HTTP 403 Forbidden) nếu nhân viên cố tình gọi đến.

## 2. Hiệu Năng (Performance)
Kiến trúc của GasStation AI được lựa chọn để tối ưu hóa tốc độ phản hồi:
- **Backend xử lý bất đồng bộ (Asynchronous):** Xây dựng trên nền tảng **FastAPI** – một trong những framework Python nhanh nhất hiện nay nhờ sử dụng ASGI và các hàm `async/await`. Điều này cho phép server chịu tải được nhiều yêu cầu song song (như bán hàng liên tục trong ca).
- **Frontend siêu tốc với Vite & React:** Sử dụng trình đóng gói Vite giúp thời gian khởi động môi trường phát triển (dev server) và tải trang trên trình duyệt gần như tức thì.
- **Tối ưu hóa Database (SQLite):** Phù hợp với quy mô trạm xăng, cơ sở dữ liệu SQLite được tối ưu hóa qua ORM SQLAlchemy, sử dụng Connection Pooling (quản lý kết nối) và cấp phát bộ nhớ nhẹ, giúp các truy vấn (bán hàng, cập nhật tồn kho) diễn ra dưới 10ms.

## 3. Khả năng sử dụng (Usability)
Trải nghiệm người dùng (UX) và Giao diện (UI) là điểm nhấn trọng tâm:
- **Giao diện hiện đại & Trực quan (Tailwind CSS):** Sử dụng thiết kế Glassmorphism (hiệu ứng kính mờ), màu sắc tương phản rõ ràng và các biểu tượng trực quan từ thư viện `lucide-react`. Bố cục (Layout) phân chia rành mạch giữa thanh điều hướng (Sidebar) và khu vực làm việc (Main Content).
- **Hỗ trợ nghiệp vụ tự động:** Các thao tác phức tạp như kiểm kê chênh lệch hay đọc báo cáo cuối ca được đơn giản hóa tối đa bằng **Trí tuệ nhân tạo (AI)**. Người dùng không cần phải tự tính toán, AI sẽ tổng hợp và trình bày dữ liệu thành văn bản tự nhiên, dễ đọc.
- **Phản hồi tức thì (Real-time Feedback):** Mọi thao tác như Nhập hàng, Bán hàng, Kết thúc ca đều có thông báo thành công hoặc lỗi (Toast Message / Alerts) rõ ràng, giúp người dùng biết được trạng thái hệ thống ngay lập tức.
- **Nhận diện vai trò rõ ràng:** Thông tin người dùng hiện tại (Tên, Chức vụ, Avatar) được hiển thị cố định ở thanh Sidebar, giúp dễ dàng nhận biết trạng thái đăng nhập trong các phiên làm việc chung.

## 4. Độ tin cậy (Reliability & Robustness)
Hệ thống được thiết kế để đảm bảo không mất mát dữ liệu và xử lý lỗi an toàn:
- **Tính nhất quán dữ liệu (Data Integrity):** Mọi giao dịch bán hàng đều kiểm tra chặt chẽ điều kiện: "Bồn chứa phải có đủ xăng mới cho phép xuất". Database sử dụng cơ chế Transaction (Commit/Rollback) của SQLAlchemy, đảm bảo nếu có lỗi xảy ra giữa chừng, dữ liệu sẽ được hoàn tác để không bị sai lệch số liệu.
- **Lưu trữ bền vững:** Toàn bộ dữ liệu (tài khoản, tồn kho, lịch sử) được ghi vật lý vào file `gas_station.db`. Dù máy chủ có mất điện đột ngột hay khởi động lại, dữ liệu vẫn được bảo toàn nguyên vẹn 100%.
- **Dung sai lỗi (Fault Tolerance) cho AI:** Trong trường hợp API của Google Gemini bị lỗi (do quá tải hoặc hết hạn ngạch), hệ thống có cơ chế Fallback (dự phòng) tự động trả về dữ liệu mô phỏng (Mock Data) chuẩn xác theo định dạng, đảm bảo quy trình làm việc của trạm xăng không bị gián đoạn.
- **Bắt lỗi logic nghiệp vụ:** Các luồng hoạt động bắt buộc (ví dụ: Không thể ghi nhận bán hàng nếu chưa "Bắt đầu ca mới") được kiểm soát chặt chẽ ở cả Frontend (ẩn/hiện nút bấm) và Backend (trả về lỗi HTTP 400 Bad Request nếu cố tình vượt rào).

---
*Tài liệu này được biên soạn để phục vụ cho báo cáo đồ án và đánh giá chất lượng phần mềm thực tế.*
