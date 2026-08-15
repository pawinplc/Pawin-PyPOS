from sqlalchemy import Column, Integer, String, Text, Boolean, DECIMAL, ForeignKey, TIMESTAMP, DateTime, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(150), unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100))
    role = Column(String(20), default='staff')
    avatar_url = Column(String(500))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    items = relationship("Item", back_populates="category")

class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    sku = Column(String(50), unique=True, nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"))
    description = Column(Text)
    unit_price = Column(DECIMAL(10,2), default=0.00)
    cost_price = Column(DECIMAL(10,2), default=0.00)
    quantity = Column(Integer, default=0)
    min_stock_level = Column(Integer, default=5)
    barcode = Column(String(50))
    is_active = Column(Boolean, default=True)
    is_service = Column(Boolean, default=False)
    image_url = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    category = relationship("Category", back_populates="items")
    stock_movements = relationship("StockMovement", back_populates="item")
    sale_items = relationship("SaleItem", back_populates="item")

class StockMovement(Base):
    __tablename__ = "stock_movements"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    movement_type = Column(String(20), nullable=False)
    quantity = Column(Integer, nullable=False)
    reference = Column(String(100))
    notes = Column(Text)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    item = relationship("Item", back_populates="stock_movements")
    user = relationship("User")

class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    total_amount = Column(DECIMAL(10,2), default=0.00)
    discount_amount = Column(DECIMAL(10,2), default=0.00)
    final_amount = Column(DECIMAL(10,2), nullable=False)
    payment_method = Column(String(20), default='cash')
    cashier_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    customer_name = Column(String(100))
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    cashier = relationship("User")
    sale_items = relationship("SaleItem", back_populates="sale", cascade="all, delete-orphan")

class SaleItem(Base):
    __tablename__ = "sale_items"

    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(DECIMAL(10,2), nullable=False)
    subtotal = Column(DECIMAL(10,2), nullable=False)

    sale = relationship("Sale", back_populates="sale_items")
    item = relationship("Item", back_populates="sale_items")

class UserActivity(Base):
    __tablename__ = "user_activity"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String(50), nullable=False)
    ip_address = Column(String(50))
    user_agent = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")

class Debt(Base):
    __tablename__ = "debts"

    id = Column(Integer, primary_key=True, index=True)
    person_name = Column(String(100), nullable=False)
    phone_number = Column(String(50))
    type = Column(String(20), default='receivable', nullable=False)
    amount = Column(DECIMAL(10,2), default=0.00, nullable=False)
    remaining_amount = Column(DECIMAL(10,2), default=0.00, nullable=False)
    status = Column(String(20), default='pending', nullable=False)
    description = Column(Text)
    due_date = Column(Date)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
