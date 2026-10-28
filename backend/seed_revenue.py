import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from sqlalchemy.orm import Session
from database import SessionLocal
import models, crud, schemas

def seed_revenue():
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.username == "admin").first()
        if not user:
            print("Admin user not found")
            return

        # Refill tanks first to avoid "Not enough fuel" error
        tanks = db.query(models.Tank).all()
        for tank in tanks:
            tank.current_volume = tank.capacity
        db.commit()

        # Start a shift
        shift = crud.start_shift(db, user.id)
        
        products = db.query(models.Product).all()
        
        # Add sales
        for product in products:
            tank = db.query(models.Tank).filter(models.Tank.product_id == product.id).first()
            if tank:
                sale = schemas.SaleRecordCreate(product_id=product.id, volume=200.0)
                crud.create_sale_record(db, sale, shift.id)
            
        # End shift
        crud.end_shift(db, shift.id)
        print("Successfully generated sales data and ended shift.")

    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    # Ensure stdout handles utf-8 on Windows
    sys.stdout.reconfigure(encoding='utf-8')
    seed_revenue()
