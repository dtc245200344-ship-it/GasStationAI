import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
import models, crud, schemas

Base.metadata.create_all(bind=engine)

def seed_db():
    db = SessionLocal()
    try:
        # Create user if not exists
        if not crud.get_user_by_username(db, "admin"):
            user = schemas.UserCreate(username="admin", password="password", role="manager")
            crud.create_user(db, user)
            print("Created default admin user.")

        # Create product if not exists
        if not db.query(models.Product).first():
            product = schemas.ProductCreate(name="RON 95-III", price=24000.0)
            db_product = crud.create_product(db, product)
            print("Created product RON 95-III.")
            
            product2 = schemas.ProductCreate(name="E5 RON 92-II", price=23000.0)
            crud.create_product(db, product2)

            # Create tanks
            tank1 = schemas.TankCreate(name="Bồn 1 - RON 95", capacity=10000.0, product_id=db_product.id)
            crud.create_tank(db, tank1)
            print("Created Tank 1.")
            
            # Initial import to tank 1
            db_tank = db.query(models.Tank).first()
            import_req = schemas.ImportRecordCreate(tank_id=db_tank.id, volume=5000.0)
            crud.create_import_record(db, import_req, 1)
            print("Added initial 5000L fuel to Tank 1.")

    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
    print("Database seeding completed.")
