from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from typing import List

# --- THÊM IMPORT CORS ---
from fastapi.middleware.cors import CORSMiddleware
# -----------------------

import models, schemas, crud, ai_service, auth
from database import engine, get_db, SessionLocal

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Gas Station Management System API")

@app.on_event("startup")
def startup_seed():
    """Tự động tạo/sửa user admin mặc định khi server khởi động."""
    db = SessionLocal()
    try:
        user = crud.get_user_by_username(db, "admin")
        if not user:
            new_user = schemas.UserCreate(username="admin", password="password", role="manager")
            crud.create_user(db, new_user)
            print("[STARTUP] Đã tạo user mặc định: admin / password")
        else:
            # Luôn reset lại mật khẩu để đảm bảo đúng
            user.hashed_password = auth.get_password_hash("password")
            user.is_active = True
            user.role = "manager"
            db.commit()
            print(f"[STARTUP] Đã xác nhận lại user admin (id={user.id}) - password='password'")
    finally:
        db.close()

# --- CẤU HÌNH CORS ---
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = auth.jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except auth.JWTError:
        raise credentials_exception
    user = crud.get_user_by_username(db, username=username)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: models.User = Depends(get_current_user)):
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

async def get_current_manager_user(current_user: models.User = Depends(get_current_active_user)):
    if current_user.role != "manager":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return current_user

@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    print(f"[LOGIN] username='{form_data.username}' password_len={len(form_data.password)}")
    user = crud.get_user_by_username(db, username=form_data.username)
    print(f"[LOGIN] user_found={user is not None}")
    if user:
        pw_ok = auth.verify_password(form_data.password, user.hashed_password)
        print(f"[LOGIN] password_verify={pw_ok}, is_active={user.is_active}")
        if not pw_ok:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(data={"sub": user.username, "role": user.role})
    print(f"[LOGIN] SUCCESS for '{user.username}'")
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    return crud.create_user(db=db, user=user)

@app.get("/users/me/", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.get("/users/list", response_model=List[schemas.User])
def get_users_list(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_manager_user)):
    return crud.get_users(db, skip=skip, limit=limit)

@app.put("/users/{user_id}/role", response_model=schemas.User)
def update_user_role(user_id: int, role_update: schemas.UserRoleUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_manager_user)):
    user = crud.update_user_role(db, user_id, role_update.role)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.put("/users/{user_id}/status", response_model=schemas.User)
def update_user_status(user_id: int, status_update: schemas.UserStatusUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_manager_user)):
    user = crud.update_user_status(db, user_id, status_update.is_active)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_manager_user)):
    user = crud.delete_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}

@app.get("/users/{user_id}/shifts", response_model=List[schemas.Shift])
def get_user_shifts_endpoint(user_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_manager_user)):
    return crud.get_user_shifts(db, user_id, skip=skip, limit=limit)

@app.get("/dashboard/stats", response_model=schemas.DashboardStats)
def read_dashboard_stats(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_dashboard_stats(db)

@app.get("/products/", response_model=List[schemas.Product])
def read_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    products = crud.get_products(db, skip=skip, limit=limit)
    return products

@app.post("/products/", response_model=schemas.Product)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "manager":
        raise HTTPException(status_code=403, detail="Only manager can create products")
    return crud.create_product(db=db, product=product)

@app.put("/products/{product_id}/price", response_model=schemas.Product)
def update_product_price(product_id: int, price_update: schemas.ProductPriceUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "manager":
        raise HTTPException(status_code=403, detail="Only manager can update prices")
    product = crud.update_product_price(db, product_id, price_update.price)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@app.post("/products/sync-prices", response_model=List[schemas.Product])
def sync_market_prices(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "manager":
        raise HTTPException(status_code=403, detail="Only manager can sync prices")
    return crud.sync_mock_prices(db)

@app.get("/tanks/", response_model=List[schemas.Tank])
def read_tanks(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    tanks = crud.get_tanks(db, skip=skip, limit=limit)
    return tanks

@app.post("/tanks/", response_model=schemas.Tank)
def create_tank(tank: schemas.TankCreate, db: Session = Depends(get_db)):
    return crud.create_tank(db=db, tank=tank)

@app.post("/imports/", response_model=schemas.ImportRecord)
def import_fuel(import_record: schemas.ImportRecordCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role not in ["manager", "employee"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    record = crud.create_import_record(db, import_record, current_user.id)
    if not record:
        raise HTTPException(status_code=404, detail="Tank not found")
    return record

@app.get("/shifts/active", response_model=schemas.Shift)
def get_active_shift(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    shift = crud.get_active_shift(db, current_user.id)
    if not shift:
        raise HTTPException(status_code=404, detail="No active shift")
    return shift

@app.post("/shifts/start", response_model=schemas.Shift)
def start_shift(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.start_shift(db, current_user.id)

@app.post("/shifts/{shift_id}/end", response_model=schemas.Shift)
def end_shift(shift_id: int, payload: schemas.ShiftEndActualVolumes, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    shift = crud.end_shift(db, shift_id, payload.actual_volumes)
    if not shift:
        raise HTTPException(status_code=404, detail="Active shift not found")
    return shift

@app.post("/sales/{shift_id}", response_model=schemas.SaleRecord)
def record_sale(shift_id: int, sale: schemas.SaleRecordCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    try:
        return crud.create_sale_record(db, sale, shift_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/shifts/{shift_id}/ai-report")
def generate_ai_shift_report(shift_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role not in ["manager", "accountant", "employee"]:
        raise HTTPException(status_code=403, detail="Not enough permissions to generate reports")

    shift = db.query(models.Shift).filter(models.Shift.id == shift_id).first()
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")

    # Gather data for the AI
    sales = db.query(models.SaleRecord).filter(models.SaleRecord.shift_id == shift_id).all()
    inventories = db.query(models.TankInventory).filter(models.TankInventory.shift_id == shift_id).all()
    
    # We also need imports that happened during the shift
    imports = []
    if shift.end_time:
        imports = db.query(models.ImportRecord).filter(
            models.ImportRecord.timestamp >= shift.start_time,
            models.ImportRecord.timestamp <= shift.end_time
        ).all()

    # Format the data
    shift_data = {
        "shift_id": shift.id,
        "start_time": shift.start_time.isoformat() if shift.start_time else None,
        "end_time": shift.end_time.isoformat() if shift.end_time else None,
        "status": shift.status,
        "sales": [{"product_id": s.product_id, "volume": s.volume, "total_price": s.total_price} for s in sales],
        "tank_inventories": [{"tank_id": i.tank_id, "start_volume": i.start_volume, "theoretical_end_volume": i.theoretical_end_volume, "actual_end_volume": i.end_volume} for i in inventories],
        "imports_during_shift": [{"tank_id": i.tank_id, "volume": i.volume} for i in imports]
    }

    try:
        report = ai_service.generate_shift_report(shift_data)
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat", response_model=schemas.ChatResponse)
def chat_with_ai(chat_msg: schemas.ChatMessage, db: Session = Depends(get_db)):
    # Lấy ngữ cảnh: tồn kho, mặt hàng, doanh thu hôm nay
    tanks = crud.get_tanks(db)
    products = crud.get_products(db)
    stats = crud.get_dashboard_stats(db)
    
    # Lấy danh sách ca đang trực
    active_shifts = crud.get_all_active_shifts(db)
    active_employees = []
    for shift in active_shifts:
        user = crud.get_user(db, shift.user_id)
        if user:
            active_employees.append({"username": user.username, "shift_id": shift.id, "start_time": shift.start_time.isoformat() if shift.start_time else None})
    
    db_context = {
        "tanks": [{"name": t.name, "current_volume": t.current_volume, "capacity": t.capacity} for t in tanks],
        "products": [{"name": p.name, "price": p.price} for p in products],
        "today_stats": stats,
        "active_employees": active_employees
    }
    try:
        response_text = ai_service.generate_chat_response(db_context, chat_msg.message)
        return schemas.ChatResponse(response=response_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def read_root():
    return {"message": "Welcome to Gas Station Management System API"}