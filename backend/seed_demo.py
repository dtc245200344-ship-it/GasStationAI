import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from sqlalchemy.orm import Session
from database import SessionLocal
import models, crud, schemas
import time

def generate_demo_data():
    db = SessionLocal()
    try:
        # Get admin user
        user = db.query(models.User).filter(models.User.username == "admin").first()
        if not user:
            print("Admin user not found. Run seed.py first.")
            return

        print("Starting a new shift...")
        shift = crud.start_shift(db, user.id)
        print(f"Shift started: {shift.id}")

        products = db.query(models.Product).all()
        tanks = db.query(models.Tank).all()
        
        if not products or not tanks:
            print("Products or Tanks not found. Run seed.py first.")
            return

        print("Generating mock sales data...")
        # Create some sales
        for product in products:
            try:
                sale1 = schemas.SaleRecordCreate(product_id=product.id, volume=50.5)
                crud.create_sale_record(db, sale1, shift.id)
                print(f"Sold 50.5L of {product.name}")
                
                sale2 = schemas.SaleRecordCreate(product_id=product.id, volume=120.0)
                crud.create_sale_record(db, sale2, shift.id)
                print(f"Sold 120.0L of {product.name}")
            except Exception as e:
                print(f"Error selling {product.name}: {e}")
        
        print("Ending the shift...")
        crud.end_shift(db, shift.id)
        print(f"Shift {shift.id} closed.")

    finally:
        db.close()

if __name__ == "__main__":
    generate_demo_data()
    print("Demo data generation completed successfully!")
