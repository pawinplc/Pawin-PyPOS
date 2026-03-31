from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from enum import Enum

class UserRole(str, Enum):
    admin = "admin"
    staff = "staff"

class MovementType(str, Enum):
    in_stock = "in"
    out = "out"
    adjustment = "adjustment"

class PaymentMethod(str, Enum):
    cash = "cash"
    card = "card"
    other = "other"

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserBase(BaseModel):
    username: str
    full_name: Optional[str] = None
    role: UserRole = UserRole.staff

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class ItemBase(BaseModel):
    name: str
    sku: str
    category_id: Optional[int] = None
    description: Optional[str] = None
    unit_price: Decimal = Decimal("0.00")
    cost_price: Decimal = Decimal("0.00")
    quantity: int = 0
    min_stock_level: int = 5
    barcode: Optional[str] = None

class ItemCreate(ItemBase):
    pass

class ItemUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    category_id: Optional[int] = None
    description: Optional[str] = None
    unit_price: Optional[Decimal] = None
    cost_price: Optional[Decimal] = None
    min_stock_level: Optional[int] = None
    barcode: Optional[str] = None
    is_active: Optional[bool] = None

class ItemResponse(ItemBase):
    id: int
    is_active: bool
    created_at: datetime
    category_name: Optional[str] = None
    is_low_stock: bool = False

    class Config:
        from_attributes = True

class StockMovementBase(BaseModel):
    item_id: int
    movement_type: MovementType
    quantity: int
    reference: Optional[str] = None
    notes: Optional[str] = None

class StockMovementCreate(StockMovementBase):
    pass

class StockMovementResponse(StockMovementBase):
    id: int
    user_id: int
    created_at: datetime
    item_name: Optional[str] = None
    username: Optional[str] = None

    class Config:
        from_attributes = True

class SaleItemCreate(BaseModel):
    item_id: int
    quantity: int
    unit_price: Decimal

class SaleItemResponse(BaseModel):
    id: int
    item_id: int
    quantity: int
    unit_price: Decimal
    subtotal: Decimal
    item_name: Optional[str] = None

    class Config:
        from_attributes = True

class SaleCreate(BaseModel):
    items: List[SaleItemCreate]
    discount_amount: Decimal = Decimal("0.00")
    payment_method: PaymentMethod = PaymentMethod.cash
    customer_name: Optional[str] = None
    notes: Optional[str] = None

class SaleResponse(BaseModel):
    id: int
    total_amount: Decimal
    discount_amount: Decimal
    final_amount: Decimal
    payment_method: PaymentMethod
    cashier_id: int
    customer_name: Optional[str]
    notes: Optional[str]
    created_at: datetime
    cashier_name: Optional[str] = None
    sale_items: List[SaleItemResponse] = []

    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    total_items: int
    low_stock_items: int
    today_sales: Decimal
    today_transactions: int
    total_revenue: Decimal

class ReportFilter(BaseModel):
    start_date: Optional[str] = None
    end_date: Optional[str] = None

class StockArrivalFilter(BaseModel):
    start_date: Optional[str] = None
    end_date: Optional[str] = None
