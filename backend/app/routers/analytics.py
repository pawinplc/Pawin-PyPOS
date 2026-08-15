from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from decimal import Decimal

from app.database import get_db
from app.models.models import User, SaleItem, Item, Category
from app.routers.auth import get_current_active_user

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/sales-by-category")
def get_sales_by_category(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    sale_items = (
        db.query(SaleItem)
        .join(Item, SaleItem.item_id == Item.id)
        .outerjoin(Category, Item.category_id == Category.id)
        .all()
    )

    category_data = {}
    for si in sale_items:
        category_name = si.item.category.name if si.item and si.item.category else "Uncategorized"
        if category_name not in category_data:
            category_data[category_name] = {"count": 0, "total": Decimal("0.00")}
        category_data[category_name]["count"] += si.quantity or 0
        category_data[category_name]["total"] += si.subtotal or 0

    result = [
        {"name": name, "count": data["count"], "total": data["total"]}
        for name, data in category_data.items()
    ]
    result.sort(key=lambda x: x["total"], reverse=True)
    return result