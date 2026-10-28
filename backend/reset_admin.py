"""
Script để reset/tạo lại user admin.
Chạy: python reset_admin.py
"""
import sys, os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine, Base
import models, crud, schemas
from auth import verify_password, get_password_hash

Base.metadata.create_all(bind=engine)

db = SessionLocal()
try:
    user = crud.get_user_by_username(db, "admin")
    
    if user:
        print(f"[INFO] User 'admin' found (id={user.id})")
        ok = verify_password("password", user.hashed_password)
        print(f"[INFO] Password 'password' verify: {ok}")
        
        if not ok:
            print("[FIX] Đặt lại mật khẩu...")
            user.hashed_password = get_password_hash("password")
            db.commit()
            print("[OK] Đã đặt lại mật khẩu thành 'password'!")
        else:
            print("[OK] Mật khẩu đúng rồi - không cần sửa!")
    else:
        print("[FIX] Không tìm thấy user 'admin'. Đang tạo...")
        new_user = schemas.UserCreate(username="admin", password="password", role="manager")
        crud.create_user(db, new_user)
        print("[OK] Tạo xong! Đăng nhập: admin / password")
    
    # Kiểm tra lần cuối
    user = crud.get_user_by_username(db, "admin")
    final = verify_password("password", user.hashed_password)
    print(f"\n✅ KẾT QUẢ: Đăng nhập admin/password {'THÀNH CÔNG' if final else 'THẤT BẠI'}")

finally:
    db.close()
