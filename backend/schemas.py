from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ProductBase(BaseModel):
    name: str
    price: float

class ProductCreate(ProductBase):
    pass

class ProductPriceUpdate(BaseModel):
    price: float

class Product(ProductBase):
    id: int

    class Config:
        from_attributes = True

class TankBase(BaseModel):
    name: str
    capacity: float
    product_id: int

class TankCreate(TankBase):
    pass

class Tank(TankBase):
    id: int
    current_volume: float

    class Config:
        from_attributes = True

class ImportRecordCreate(BaseModel):
    tank_id: int
    volume: float

class ImportRecord(BaseModel):
    id: int
    tank_id: int
    user_id: int
    volume: float
    timestamp: datetime

    class Config:
        from_attributes = True

class ShiftStart(BaseModel):
    pass

class ShiftEndActualVolumes(BaseModel):
    actual_volumes: dict[int, float] = {}

class Shift(BaseModel):
    id: int
    user_id: int
    start_time: datetime
    end_time: Optional[datetime] = None
    status: str

    class Config:
        from_attributes = True

class SaleRecordCreate(BaseModel):
    product_id: int
    volume: float

class SaleRecord(BaseModel):
    id: int
    shift_id: int
    product_id: int
    volume: float
    total_price: float
    timestamp: datetime

    class Config:
        from_attributes = True

class UserBase(BaseModel):
    username: str
    role: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TransactionRecord(BaseModel):
    id: int
    type: str
    description: str
    volume: float
    timestamp: datetime

class DashboardStats(BaseModel):
    revenue_today: float
    volume_sold_today: float
    alerts_count: int
    weekly_chart: List[float]
    recent_transactions: List[TransactionRecord] = []
    alerts: List[str] = []

class ChatMessage(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str

class UserRoleUpdate(BaseModel):
    role: str

class UserStatusUpdate(BaseModel):
    is_active: bool
