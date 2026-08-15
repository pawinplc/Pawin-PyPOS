from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
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

class DebtType(str, Enum):
    receivable = "receivable"
    payable = "payable"

class DebtStatus(str, Enum):
    pending = "pending"
    partially_paid = "partially_paid"
    paid = "paid"

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserBase(BaseModel):
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: UserRole = UserRole.staff

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None

class UserResponse(UserBase):
    id: int
    avatar_url: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    email: str
    password: str

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
    is_service: Optional[bool] = False

class ItemCreate(ItemBase):
    pass

class ItemUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    category_id: Optional[int] = None
    description: Optional[str] = None
    unit_price: Optional[Decimal] = None
    cost_price: Optional[Decimal] = None
    quantity: Optional[int] = None
    min_stock_level: Optional[int] = None
    barcode: Optional[str] = None
    is_active: Optional[bool] = None
    is_service: Optional[bool] = None
    image_url: Optional[str] = None

class ItemResponse(ItemBase):
    id: int
    is_active: bool
    is_service: bool = False
    image_url: Optional[str] = None
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
    cost_price: Optional[Decimal] = None
    is_service: Optional[bool] = False
    category_name: Optional[str] = None

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
    categories_involved: List[str] = []
    sale_items: List[SaleItemResponse] = []

    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    total_items: int
    low_stock_items: int
    out_of_stock: int
    active_users: int
    total_users: int
    today_sales: Decimal
    today_transactions: int
    week_sales: Decimal
    week_transactions: int
    month_sales: Decimal
    month_transactions: int
    total_sales: Decimal
    total_transactions: int

class DebtBase(BaseModel):
    person_name: str
    phone_number: Optional[str] = None
    type: DebtType = DebtType.receivable
    amount: Decimal = Decimal("0.00")
    description: Optional[str] = None
    due_date: Optional[date] = None

class DebtCreate(DebtBase):
    pass

class DebtResponse(DebtBase):
    id: int
    remaining_amount: Decimal
    status: DebtStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class DebtPayment(BaseModel):
    amount: Decimal

class ReportFilter(BaseModel):
    start_date: Optional[str] = None
    end_date: Optional[str] = None

class StockArrivalFilter(BaseModel):
    start_date: Optional[str] = None
    end_date: Optional[str] = None
