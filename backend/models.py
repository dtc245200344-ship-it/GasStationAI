from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, DateTime
from sqlalchemy.orm import relationship
import datetime

from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="employee") # manager, employee, accountant
    is_active = Column(Boolean, default=True)

    shifts = relationship("Shift", back_populates="user")
    import_records = relationship("ImportRecord", back_populates="user")

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    price = Column(Float)
    
    tanks = relationship("Tank", back_populates="product")
    sale_records = relationship("SaleRecord", back_populates="product")

class Tank(Base):
    __tablename__ = "tanks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    capacity = Column(Float)
    current_volume = Column(Float, default=0.0)

    product = relationship("Product", back_populates="tanks")
    import_records = relationship("ImportRecord", back_populates="tank")
    inventories = relationship("TankInventory", back_populates="tank")

class ImportRecord(Base):
    __tablename__ = "import_records"

    id = Column(Integer, primary_key=True, index=True)
    tank_id = Column(Integer, ForeignKey("tanks.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    volume = Column(Float)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    tank = relationship("Tank", back_populates="import_records")
    user = relationship("User", back_populates="import_records")

class Shift(Base):
    __tablename__ = "shifts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    start_time = Column(DateTime, default=datetime.datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    status = Column(String, default="active") # active, closed

    user = relationship("User", back_populates="shifts")
    sale_records = relationship("SaleRecord", back_populates="shift")
    inventories = relationship("TankInventory", back_populates="shift")

class SaleRecord(Base):
    __tablename__ = "sale_records"

    id = Column(Integer, primary_key=True, index=True)
    shift_id = Column(Integer, ForeignKey("shifts.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    volume = Column(Float)
    total_price = Column(Float)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    shift = relationship("Shift", back_populates="sale_records")
    product = relationship("Product", back_populates="sale_records")

class TankInventory(Base):
    __tablename__ = "tank_inventories"

    id = Column(Integer, primary_key=True, index=True)
    shift_id = Column(Integer, ForeignKey("shifts.id"))
    tank_id = Column(Integer, ForeignKey("tanks.id"))
    start_volume = Column(Float)
    theoretical_end_volume = Column(Float, nullable=True)
    end_volume = Column(Float, nullable=True)

    shift = relationship("Shift", back_populates="inventories")
    tank = relationship("Tank", back_populates="inventories")
