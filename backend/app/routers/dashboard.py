from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, date
from decimal import Decimal

from app.database import get_db
from app.models.models import User, Item, Sale, SaleItem
from app.schemas.schemas import DashboardStats
from app.routers.auth import get_current_active_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    total_items = db.query(func.count(Item.id)).filter(Item.is_active == True).scalar() or 0
    
    low_stock_items = db.query(func.count(Item.id)).filter(
        Item.is_active == True,
        Item.quantity <= Item.min_stock_level
    ).scalar() or 0
    
    today = date.today()
    today_start = datetime.combine(today, datetime.min.time())
    today_end = datetime.combine(today, datetime.max.time())
    
    today_sales_result = db.query(func.coalesce(func.sum(Sale.final_amount), 0)).filter(
        Sale.created_at >= today_start,
        Sale.created_at <= today_end
    ).scalar() or Decimal("0.00")
    
    today_transactions = db.query(func.count(Sale.id)).filter(
        Sale.created_at >= today_start,
        Sale.created_at <= today_end
    ).scalar() or 0
    
    total_revenue = db.query(func.coalesce(func.sum(Sale.final_amount), 0)).scalar() or Decimal("0.00")
    
    return {
        "total_items": total_items,
        "low_stock_items": low_stock_items,
        "today_sales": today_sales_result,
        "today_transactions": today_transactions,
        "total_revenue": total_revenue
    }

@router.get("/recent-sales")
def get_recent_sales(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    sales = db.query(Sale).order_by(Sale.created_at.desc()).limit(limit).all()
    
    result = []
    for sale in sales:
        sale_items = db.query(SaleItem).filter(SaleItem.sale_id == sale.id).all()
        result.append({
            "id": sale.id,
            "final_amount": float(sale.final_amount),
            "cashier_name": sale.cashier.full_name or sale.cashier.username,
            "items_count": len(sale_items),
            "created_at": sale.created_at.isoformat()
        })
    
    return result

@router.get("/low-stock")
def get_low_stock_items(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    items = db.query(Item).filter(
        Item.is_active == True,
        Item.quantity <= Item.min_stock_level
    ).order_by(Item.quantity.asc()).limit(limit).all()
    
    return [
        {
            "id": item.id,
            "name": item.name,
            "sku": item.sku,
            "quantity": item.quantity,
            "min_stock_level": item.min_stock_level,
            "category_name": item.category.name if item.category else None
        }
        for item in items
    ]
