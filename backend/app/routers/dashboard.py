from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, date, timedelta
from decimal import Decimal

from app.database import get_db
from app.models.models import User, Item, Sale, SaleItem
from app.schemas.schemas import DashboardStats
from app.routers.auth import get_current_active_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    items = db.query(Item).filter(Item.is_active == True).all()
    total_items = len(items)
    non_service_items = [i for i in items if not i.is_service]
    low_stock_items = len([i for i in non_service_items if i.quantity <= (i.min_stock_level or 0)])
    out_of_stock = len([i for i in non_service_items if i.quantity <= 0])

    users = db.query(User).filter(User.is_active == True).all()
    total_users = len(users)

    all_sales = db.query(Sale.final_amount, Sale.created_at).all()
    today = date.today()
    today_key = datetime.combine(today, datetime.min.time())

    week_start = today - timedelta(days=today.weekday())
    week_key = datetime.combine(week_start, datetime.min.time())

    month_key = datetime(today.year, today.month, 1)

    def bucket(threshold):
        sales = [s for s in all_sales if s.created_at >= threshold]
        return sum((Decimal(str(s.final_amount)) for s in sales), Decimal("0.00")), len(sales)

    today_sales, today_transactions = bucket(today_key)
    week_sales, week_transactions = bucket(week_key)
    month_sales, month_transactions = bucket(month_key)
    total_sales = sum((Decimal(str(s.final_amount)) for s in all_sales), Decimal("0.00"))

    return {
        "total_items": total_items,
        "low_stock_items": low_stock_items,
        "out_of_stock": out_of_stock,
        "active_users": total_users,
        "total_users": total_users,
        "today_sales": today_sales,
        "today_transactions": today_transactions,
        "week_sales": week_sales,
        "week_transactions": week_transactions,
        "month_sales": month_sales,
        "month_transactions": month_transactions,
        "total_sales": total_sales,
        "total_transactions": len(all_sales)
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
            "cashier_name": sale.cashier.full_name or sale.cashier.username if sale.cashier else None,
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
        Item.is_service == False,
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