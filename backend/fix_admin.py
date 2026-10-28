import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine, Base
import models, crud, schemas
from auth import verify_password, get_password_hash

Base.metadata.create_all(bind=engine)

db = SessionLocal()
try:
    user = crud.get_user_by_username(db, "admin")
    if user:
        print(f"[OK] User 'admin' found: id={user.id}, role={user.role}, is_active={user.is_active}")
        result = verify_password("password", user.hashed_password)
        print(f"[OK] Password verify ('password'): {result}")
        
        if not result:
            print("[FIX] Resetting password to 'password'...")
            user.hashed_password = get_password_hash("password")
            db.commit()
            print("[OK] Password reset done!")
    else:
        print("[FIX] User 'admin' NOT found! Creating...")
        new_user = schemas.UserCreate(username="admin", password="password", role="manager")
        crud.create_user(db, new_user)
        print("[OK] Created admin user with password 'password'")
    
    # Verify again
    user = crud.get_user_by_username(db, "admin")
    final_check = verify_password("password", user.hashed_password)
    print(f"\n[FINAL CHECK] Login admin/password: {'SUCCESS' if final_check else 'FAILED'}")
    
finally:
    db.close()
