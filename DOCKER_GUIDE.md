# Hướng dẫn chạy và đẩy Docker (Docker Deployment & Push Guide)

Dự án đã được cấu hình hoàn chỉnh Docker & Docker Compose cho cả **Backend (FastAPI)** và **Frontend (React/Vite Nginx)**.

---

## 1. Trạng thái hiện tại
- **Backend container**: Đang chạy tại cổng `8000` (`http://localhost:8000`)
  - Swagger UI: `http://localhost:8000/docs`
  - Đã tích hợp khởi tạo cơ sở dữ liệu và seed dữ liệu ban đầu (admin / password, sản phẩm, bồn chứa).
- **Frontend container**: Đang chạy tại cổng `3000` (`http://localhost:3000`)
  - Sử dụng Nginx production serve SPA và tự động forward / cấu hình URL API.

---

## 2. Quản lý hệ thống bằng Docker Compose

### Khởi động toàn bộ hệ thống:
```bash
docker compose up -d
```
*(Nếu muốn build lại sau khi sửa code: `docker compose up --build -d`)*

### Xem logs:
```bash
# Xem log backend
docker logs -f gas_station_backend

# Xem log frontend
docker logs -f gas_station_frontend
```

### Dừng hệ thống:
```bash
docker compose down
```

### Seed thêm dữ liệu bán hàng 30 ngày (demo charts/revenue):
```bash
docker exec -it gas_station_backend python seed_sales_data.py
```

---

## 3. Cách đẩy (push) Image lên Docker Hub

Để đẩy các image này lên Docker Hub cá nhân của bạn:

### Bước 1: Đăng nhập vào Docker Hub
Mở terminal trên máy và chạy:
```bash
docker login
```
*(Nhập username và password/Personal Access Token của tài khoản Docker Hub của bạn)*

### Bước 2: Đặt tag cho image theo username của bạn
Giả sử username Docker Hub của bạn là `<your-dockerhub-username>`:
```bash
docker tag aiii-backend:latest <your-dockerhub-username>/gas-station-backend:latest
docker tag aiii-frontend:latest <your-dockerhub-username>/gas-station-frontend:latest
```

### Bước 3: Đẩy image lên Docker Hub
```bash
docker push <your-dockerhub-username>/gas-station-backend:latest
docker push <your-dockerhub-username>/gas-station-frontend:latest
```

