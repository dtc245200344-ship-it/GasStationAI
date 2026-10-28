from sqlalchemy.orm import Session
from passlib.context import CryptContext
import models, schemas

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(username=user.username, hashed_password=hashed_password, role=user.role)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()

def update_user_role(db: Session, user_id: int, new_role: str):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user:
        db_user.role = new_role
        db.commit()
        db.refresh(db_user)
    return db_user

def update_user_status(db: Session, user_id: int, is_active: bool):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user:
        db_user.is_active = is_active
        db.commit()
        db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user:
        db.delete(db_user)
        db.commit()
    return db_user

def get_user_shifts(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Shift).filter(models.Shift.user_id == user_id).order_by(models.Shift.start_time.desc()).offset(skip).limit(limit).all()

def get_products(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Product).offset(skip).limit(limit).all()

def create_product(db: Session, product: schemas.ProductCreate):
    db_product = models.Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

def update_product_price(db: Session, product_id: int, price: float):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if db_product:
        db_product.price = price
        db.commit()
        db.refresh(db_product)
    return db_product

def sync_mock_prices(db: Session):
    import random
    products = db.query(models.Product).all()
    # Giả lập giá ngẫu nhiên nhưng thực tế cho xăng dầu
    base_prices = {
        "RON 95": 24000,
        "E5": 23000,
        "DO": 21000
    }
    for product in products:
        # random variant between -500 and +500
        variant = random.randint(-5, 5) * 100
        new_price = product.price + variant
        
        # Nếu chưa có giá thì dùng base price
        if product.price == 0 or not product.price:
            for key, bp in base_prices.items():
                if key in product.name:
                    new_price = bp + variant
                    break
            else:
                new_price = 22000 + variant
        
        # Đảm bảo giá luôn dương và hợp lý
        product.price = max(10000, new_price)

    db.commit()
    return products

def get_tanks(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Tank).offset(skip).limit(limit).all()

def create_tank(db: Session, tank: schemas.TankCreate):
    db_tank = models.Tank(**tank.model_dump())
    db.add(db_tank)
    db.commit()
    db.refresh(db_tank)
    return db_tank

def create_import_record(db: Session, import_record: schemas.ImportRecordCreate, user_id: int):
    # Update tank volume
    tank = db.query(models.Tank).filter(models.Tank.id == import_record.tank_id).first()
    if not tank:
        return None
    tank.current_volume += import_record.volume
    
    # Create record
    db_record = models.ImportRecord(tank_id=import_record.tank_id, user_id=user_id, volume=import_record.volume)
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record

def get_active_shift(db: Session, user_id: int):
    return db.query(models.Shift).filter(models.Shift.user_id == user_id, models.Shift.status == "active").first()

def get_all_active_shifts(db: Session):
    return db.query(models.Shift).filter(models.Shift.status == "active").all()

def start_shift(db: Session, user_id: int):
    # Check if there's an active shift
    active_shift = db.query(models.Shift).filter(models.Shift.user_id == user_id, models.Shift.status == "active").first()
    if active_shift:
        return active_shift
    
    db_shift = models.Shift(user_id=user_id, status="active")
    db.add(db_shift)
    db.commit()
    db.refresh(db_shift)

    # Record starting tank inventories
    tanks = db.query(models.Tank).all()
    for tank in tanks:
        inventory = models.TankInventory(shift_id=db_shift.id, tank_id=tank.id, start_volume=tank.current_volume)
        db.add(inventory)
    
    db.commit()
    return db_shift

def end_shift(db: Session, shift_id: int, actual_volumes: dict = None):
    shift = db.query(models.Shift).filter(models.Shift.id == shift_id, models.Shift.status == "active").first()
    if not shift:
        return None
    
    shift.status = "closed"
    import datetime
    shift.end_time = datetime.datetime.utcnow()

    if actual_volumes is None:
        actual_volumes = {}

    # Record ending tank inventories
    tanks = db.query(models.Tank).all()
    for tank in tanks:
        inventory = db.query(models.TankInventory).filter(models.TankInventory.shift_id == shift.id, models.TankInventory.tank_id == tank.id).first()
        if inventory:
            inventory.theoretical_end_volume = tank.current_volume
            
            actual = actual_volumes.get(tank.id)
            if actual is not None:
                inventory.end_volume = actual
                tank.current_volume = actual
            else:
                inventory.end_volume = tank.current_volume
    
    db.commit()
    db.refresh(shift)
    return shift

def create_sale_record(db: Session, sale: schemas.SaleRecordCreate, shift_id: int):
    shift = db.query(models.Shift).filter(models.Shift.id == shift_id, models.Shift.status == "active").first()
    if not shift:
        raise ValueError("Invalid or closed shift")

    product = db.query(models.Product).filter(models.Product.id == sale.product_id).first()
    if not product:
        raise ValueError("Product not found")

    # Find the tank for this product (assuming 1 tank per product for simplicity in MVP)
    tank = db.query(models.Tank).filter(models.Tank.product_id == sale.product_id).first()
    if not tank or tank.current_volume < sale.volume:
        raise ValueError("Not enough fuel in tank")

    # Update tank volume
    tank.current_volume -= sale.volume

    total_price = sale.volume * product.price

    db_sale = models.SaleRecord(
        shift_id=shift_id,
        product_id=sale.product_id,
        volume=sale.volume,
        total_price=total_price
    )
    db.add(db_sale)
    db.commit()
    db.refresh(db_sale)
    return db_sale

def get_dashboard_stats(db: Session):
    import datetime
    # Thay vì reset vào 0h UTC, ta dùng khung giờ 48h gần nhất để số liệu demo không bị mất quá nhanh
    today = datetime.datetime.utcnow() - datetime.timedelta(hours=48)
    
    # Doanh thu hôm nay (24h qua)
    sales_today = db.query(models.SaleRecord).filter(models.SaleRecord.timestamp >= today).all()
    revenue_today = sum(s.total_price for s in sales_today)
    volume_sold_today = sum(s.volume for s in sales_today)
    
    # Cảnh báo: tồn kho thấp (< 1000) HOẶC vượt quá dung lượng bồn
    tanks = db.query(models.Tank).all()
    alerts = []
    for t in tanks:
        if t.current_volume < 1000:
            alerts.append(f"Bồn '{t.name}' sắp hết xăng (còn lại {t.current_volume:,.0f} L / {t.capacity:,.0f} L)")
        if t.current_volume > t.capacity:
            alerts.append(f"Quá tải: Bồn '{t.name}' vượt dung lượng ({t.current_volume:,.0f} L / {t.capacity:,.0f} L)")
            
    # Giả lập tính năng phát hiện tình huống nguy hiểm (IoT/Cảm biến)
    import random
    import time
    # Dùng chu kỳ 5 phút (300 giây) làm seed để cảnh báo không bị nháy mỗi 3 giây
    random.seed(int(time.time() / 300))
    if random.random() < 0.4: # 40% chance per 5 minutes to show a safety warning for demo purposes
        alerts.append("⚠️ CẢNH BÁO AN TOÀN: Hệ thống cảm biến phát hiện nhiệt độ tăng bất thường tại khu vực Bồn 1 (38°C). Vui lòng kiểm tra ngay!")
    random.seed() # reset seed
            
    alerts_count = len(alerts)
    
    # Biểu đồ tuần (7 ngày gần nhất, dữ liệu thật từ DB)
    weekly_chart = []
    for i in range(6, -1, -1):
        day_start = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0) - datetime.timedelta(days=i)
        day_end = day_start + datetime.timedelta(days=1)
        day_sales = db.query(models.SaleRecord).filter(
            models.SaleRecord.timestamp >= day_start,
            models.SaleRecord.timestamp < day_end
        ).all()
        day_volume = sum(s.volume for s in day_sales)
        weekly_chart.append(round(day_volume, 1))
    
    # Lấy 10 giao dịch gần nhất
    recent_sales = db.query(models.SaleRecord).order_by(models.SaleRecord.timestamp.desc()).limit(10).all()
    recent_imports = db.query(models.ImportRecord).order_by(models.ImportRecord.timestamp.desc()).limit(10).all()
    
    transactions = []
    for s in recent_sales:
        product = db.query(models.Product).filter(models.Product.id == s.product_id).first()
        p_name = product.name if product else "Unknown"
        transactions.append({
            "id": s.id,
            "type": "SALE",
            "description": f"Bán {p_name}",
            "volume": s.volume,
            "timestamp": s.timestamp
        })
        
    for i in recent_imports:
        tank = db.query(models.Tank).filter(models.Tank.id == i.tank_id).first()
        t_name = tank.name if tank else "Unknown"
        transactions.append({
            "id": i.id,
            "type": "IMPORT",
            "description": f"Nhập bồn {t_name}",
            "volume": i.volume,
            "timestamp": i.timestamp
        })
        
    transactions.sort(key=lambda x: x["timestamp"], reverse=True)
    transactions = transactions[:10]

    return {
        "revenue_today": revenue_today,
        "volume_sold_today": volume_sold_today,
        "alerts_count": alerts_count,
        "weekly_chart": weekly_chart,
        "recent_transactions": transactions,
        "alerts": alerts
    }
