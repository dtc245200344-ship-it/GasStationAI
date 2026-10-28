"""
Script tạo dữ liệu bán hàng demo thực tế cho 30 ngày gần nhất.
Bao gồm:
- Thêm sản phẩm (DO 0.05S, RON 95-III, E5 RON 92-II) + bồn chứa nếu chưa có
- Tạo nhân viên demo (nv1, nv2, nv3)
- Mỗi ngày 2-3 ca, mỗi ca có nhiều lượt bán hàng
- Nhập hàng định kỳ (mỗi 3-5 ngày)
- Doanh thu dao động thực tế theo ngày trong tuần
"""
import sys
import os
import random
from datetime import datetime, timedelta

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
import models

# Đảm bảo tables tồn tại
Base.metadata.create_all(bind=engine)


def clear_old_data(db: Session):
    """Xóa toàn bộ dữ liệu cũ để seed lại từ đầu (giữ nguyên users)."""
    db.query(models.SaleRecord).delete()
    db.query(models.TankInventory).delete()
    db.query(models.ImportRecord).delete()
    db.query(models.Shift).delete()
    db.commit()
    print("  ✓ Đã xóa dữ liệu cũ (sales, inventories, imports, shifts)")


def ensure_products_and_tanks(db: Session):
    """Đảm bảo có đủ sản phẩm và bồn chứa."""
    product_specs = [
        {"name": "RON 95-III", "price": 24150.0},
        {"name": "E5 RON 92-II", "price": 23080.0},
        {"name": "DO 0.05S", "price": 21350.0},
    ]

    products = []
    for spec in product_specs:
        p = db.query(models.Product).filter(models.Product.name == spec["name"]).first()
        if not p:
            p = models.Product(name=spec["name"], price=spec["price"])
            db.add(p)
            db.commit()
            db.refresh(p)
            print(f"  ✓ Tạo sản phẩm: {spec['name']} - {spec['price']:,.0f} đ/L")
        else:
            # Cập nhật giá nếu cần
            p.price = spec["price"]
            db.commit()
        products.append(p)

    tank_specs = [
        {"name": "Bồn 1 - RON 95", "capacity": 10000.0, "product_name": "RON 95-III"},
        {"name": "Bồn 2 - E5 RON 92", "capacity": 8000.0, "product_name": "E5 RON 92-II"},
        {"name": "Bồn 3 - DO", "capacity": 12000.0, "product_name": "DO 0.05S"},
    ]

    tanks = []
    for spec in tank_specs:
        t = db.query(models.Tank).filter(models.Tank.name == spec["name"]).first()
        product = next(p for p in products if p.name == spec["product_name"])
        if not t:
            t = models.Tank(
                name=spec["name"],
                capacity=spec["capacity"],
                product_id=product.id,
                current_volume=spec["capacity"] * 0.8,  # bắt đầu 80%
            )
            db.add(t)
            db.commit()
            db.refresh(t)
            print(f"  ✓ Tạo bồn: {spec['name']} ({spec['capacity']:,.0f} L)")
        else:
            t.product_id = product.id
            t.capacity = spec["capacity"]
            t.current_volume = spec["capacity"] * 0.8
            db.commit()
        tanks.append(t)

    return products, tanks


def ensure_employees(db: Session):
    """Tạo nhân viên demo."""
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

    employees_specs = [
        {"username": "admin", "role": "manager"},
        {"username": "nv_an", "role": "employee"},
        {"username": "nv_binh", "role": "employee"},
        {"username": "nv_cuong", "role": "employee"},
    ]

    employees = []
    for spec in employees_specs:
        u = db.query(models.User).filter(models.User.username == spec["username"]).first()
        if not u:
            u = models.User(
                username=spec["username"],
                hashed_password=pwd_context.hash("password"),
                role=spec["role"],
                is_active=True,
            )
            db.add(u)
            db.commit()
            db.refresh(u)
            print(f"  ✓ Tạo nhân viên: {spec['username']} ({spec['role']})")
        employees.append(u)

    return employees


def generate_sales_data(db: Session, products, tanks, employees, num_days=30):
    """Tạo dữ liệu bán hàng cho num_days ngày gần nhất."""
    now = datetime.utcnow()
    start_date = now - timedelta(days=num_days)

    # Hệ số bán hàng theo ngày trong tuần (0=Mon, 6=Sun)
    # Cuối tuần bán nhiều hơn
    day_multiplier = {
        0: 0.85,  # Thứ 2
        1: 0.90,  # Thứ 3
        2: 1.00,  # Thứ 4
        3: 1.05,  # Thứ 5
        4: 1.15,  # Thứ 6
        5: 1.30,  # Thứ 7
        6: 1.20,  # Chủ nhật
    }

    # Sản lượng bán cơ bản (lít/ca) cho mỗi loại sản phẩm
    base_volume_per_shift = {
        "RON 95-III": (180, 450),      # phổ biến nhất
        "E5 RON 92-II": (120, 350),    # phổ biến
        "DO 0.05S": (100, 300),        # dầu diesel, ít hơn
    }

    # Map product id -> tank
    product_tank_map = {}
    for t in tanks:
        product_tank_map[t.product_id] = t

    total_sales = 0
    total_revenue = 0
    total_shifts = 0
    import_count = 0

    for day_offset in range(num_days):
        current_date = start_date + timedelta(days=day_offset)
        weekday = current_date.weekday()
        mult = day_multiplier[weekday]

        # Mỗi ngày 2-3 ca
        num_shifts = random.choice([2, 2, 3])
        shift_hours = [
            (6, 14),   # Ca sáng
            (14, 22),  # Ca chiều
            (22, 30),  # Ca đêm (22h -> 6h hôm sau)
        ]

        for shift_idx in range(num_shifts):
            start_h, end_h = shift_hours[shift_idx]

            # Chọn nhân viên (chỉ employee, không admin thì lấy bất kỳ)
            emp_choices = [e for e in employees if e.role == "employee"]
            if not emp_choices:
                emp_choices = employees
            employee = random.choice(emp_choices)

            shift_start = current_date.replace(
                hour=start_h % 24, minute=random.randint(0, 15), second=0, microsecond=0
            )
            shift_end = current_date.replace(
                hour=0, minute=0, second=0, microsecond=0
            ) + timedelta(hours=end_h, minutes=random.randint(0, 30))

            # Tạo shift
            shift = models.Shift(
                user_id=employee.id,
                start_time=shift_start,
                end_time=shift_end,
                status="closed",
            )
            db.add(shift)
            db.commit()
            db.refresh(shift)
            total_shifts += 1

            # Tạo tank inventory cho ca này
            for t in tanks:
                inv = models.TankInventory(
                    shift_id=shift.id,
                    tank_id=t.id,
                    start_volume=t.current_volume,
                )
                db.add(inv)

            # Tạo nhiều lượt bán trong ca (5-15 giao dịch)
            num_transactions = random.randint(5, 15)
            shift_elapsed = (shift_end - shift_start).total_seconds()

            for tx_idx in range(num_transactions):
                # Chọn sản phẩm ngẫu nhiên (RON 95 có xác suất cao hơn)
                weights = []
                for p in products:
                    if "95" in p.name:
                        weights.append(5)
                    elif "92" in p.name:
                        weights.append(3)
                    else:
                        weights.append(2)
                product = random.choices(products, weights=weights, k=1)[0]

                # Sản lượng bán
                vol_range = base_volume_per_shift.get(product.name, (100, 300))
                base_vol = random.uniform(vol_range[0] / num_transactions, vol_range[1] / num_transactions)
                volume = round(base_vol * mult, 1)

                # Kiểm tra bồn có đủ
                tank = product_tank_map.get(product.id)
                if not tank or tank.current_volume < volume:
                    # Nhập thêm xăng nếu hết
                    if tank:
                        import_vol = tank.capacity * random.uniform(0.5, 0.8)
                        tank.current_volume += import_vol
                        imp = models.ImportRecord(
                            tank_id=tank.id,
                            user_id=employee.id,
                            volume=import_vol,
                            timestamp=shift_start + timedelta(seconds=random.uniform(0, shift_elapsed * 0.1)),
                        )
                        db.add(imp)
                        import_count += 1
                    else:
                        continue

                total_price = round(volume * product.price, 0)

                # Timestamp ngẫu nhiên trong ca
                tx_time = shift_start + timedelta(
                    seconds=random.uniform(
                        (tx_idx / num_transactions) * shift_elapsed,
                        ((tx_idx + 1) / num_transactions) * shift_elapsed,
                    )
                )

                sale = models.SaleRecord(
                    shift_id=shift.id,
                    product_id=product.id,
                    volume=volume,
                    total_price=total_price,
                    timestamp=tx_time,
                )
                db.add(sale)

                # Cập nhật bồn
                tank.current_volume -= volume
                tank.current_volume = max(0, tank.current_volume)

                total_sales += 1
                total_revenue += total_price

            # Cập nhật tank inventory cuối ca
            db.commit()
            for t in tanks:
                inv = (
                    db.query(models.TankInventory)
                    .filter(
                        models.TankInventory.shift_id == shift.id,
                        models.TankInventory.tank_id == t.id,
                    )
                    .first()
                )
                if inv:
                    inv.theoretical_end_volume = t.current_volume
                    # Tồn thực tế = lý thuyết ± sai số nhỏ (mô phỏng hao hụt)
                    variance = random.uniform(-20, 5)
                    inv.end_volume = max(0, t.current_volume + variance)

            db.commit()

        # Nhập hàng định kỳ mỗi 3-4 ngày
        if day_offset % random.choice([3, 4]) == 0:
            for t in tanks:
                if t.current_volume < t.capacity * 0.4:
                    import_vol = round(t.capacity * random.uniform(0.4, 0.7), 0)
                    t.current_volume = min(t.current_volume + import_vol, t.capacity)
                    imp = models.ImportRecord(
                        tank_id=t.id,
                        user_id=employees[0].id,  # admin nhập
                        volume=import_vol,
                        timestamp=current_date.replace(hour=5, minute=30),
                    )
                    db.add(imp)
                    import_count += 1
            db.commit()

    return total_shifts, total_sales, total_revenue, import_count


def main():
    print("=" * 60)
    print("  🔧 SEED DỮ LIỆU BÁN HÀNG - GasStation AI")
    print("=" * 60)

    db = SessionLocal()
    try:
        print("\n[1/5] Xóa dữ liệu cũ...")
        clear_old_data(db)

        print("\n[2/5] Tạo sản phẩm & bồn chứa...")
        products, tanks = ensure_products_and_tanks(db)

        print("\n[3/5] Tạo nhân viên...")
        employees = ensure_employees(db)

        print("\n[4/5] Tạo dữ liệu bán hàng 30 ngày...")
        shifts, sales, revenue, imports = generate_sales_data(
            db, products, tanks, employees, num_days=30
        )

        print(f"\n[5/5] Hoàn tất!")
        print("=" * 60)
        print(f"  📊 Tổng ca làm việc : {shifts}")
        print(f"  🛒 Tổng giao dịch   : {sales}")
        print(f"  💰 Tổng doanh thu   : {revenue:,.0f} VNĐ")
        print(f"  🚛 Lần nhập hàng    : {imports}")
        print("=" * 60)

        # Xác nhận tồn kho cuối
        print("\n📦 Tồn kho hiện tại:")
        for t in tanks:
            db.refresh(t)
            pct = (t.current_volume / t.capacity) * 100
            bar = "█" * int(pct / 5) + "░" * (20 - int(pct / 5))
            print(f"  {t.name}: {t.current_volume:,.0f}/{t.capacity:,.0f} L ({pct:.0f}%) [{bar}]")

    except Exception as e:
        print(f"\n❌ Lỗi: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    random.seed(42)  # Seed cố định để kết quả nhất quán
    main()
