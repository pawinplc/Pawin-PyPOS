from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from app.database import get_db
from app.models.models import User, Item, Category
from app.schemas.schemas import ItemCreate, ItemUpdate, ItemResponse
from app.routers.auth import get_current_active_user

router = APIRouter(prefix="/api/items", tags=["Items"])

def item_to_response(item: Item) -> dict:
    is_low_stock = item.quantity <= item.min_stock_level
    category_name = item.category.name if item.category else None
    return {
        "id": item.id,
        "name": item.name,
        "sku": item.sku,
        "category_id": item.category_id,
        "description": item.description,
        "unit_price": item.unit_price,
        "cost_price": item.cost_price,
        "quantity": item.quantity,
        "min_stock_level": item.min_stock_level,
        "barcode": item.barcode,
        "is_active": item.is_active,
        "created_at": item.created_at,
        "category_name": category_name,
        "is_low_stock": is_low_stock
    }

@router.get("", response_model=List[ItemResponse])
def get_items(
    search: Optional[str] = Query(None),
    category_id: Optional[int] = Query(None),
    low_stock: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Item).options(joinedload(Item.category))
    
    if search:
        query = query.filter(
            (Item.name.ilike(f"%{search}%")) |
            (Item.sku.ilike(f"%{search}%")) |
            (Item.barcode.ilike(f"%{search}%"))
        )
    
    if category_id:
        query = query.filter(Item.category_id == category_id)
    
    if low_stock:
        query = query.filter(Item.quantity <= Item.min_stock_level)
    
    items = query.all()
    return [item_to_response(item) for item in items]

@router.get("/{item_id}", response_model=ItemResponse)
def get_item(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    item = db.query(Item).options(joinedload(Item.category)).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item_to_response(item)

@router.post("", response_model=ItemResponse)
def create_item(item: ItemCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can create items")
    
    existing = db.query(Item).filter(Item.sku == item.sku).first()
    if existing:
        raise HTTPException(status_code=400, detail="SKU already exists")
    
    db_item = Item(**item.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    
    item_response = db.query(Item).options(joinedload(Item.category)).filter(Item.id == db_item.id).first()
    return item_to_response(item_response)

@router.put("/{item_id}", response_model=ItemResponse)
def update_item(item_id: int, item: ItemUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can update items")
    
    db_item = db.query(Item).filter(Item.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    update_data = item.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_item, key, value)
    
    db.commit()
    db.refresh(db_item)
    
    item_response = db.query(Item).options(joinedload(Item.category)).filter(Item.id == item_id).first()
    return item_to_response(item_response)

@router.delete("/{item_id}")
def delete_item(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can delete items")
    
    db_item = db.query(Item).filter(Item.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    db.delete(db_item)
    db.commit()
    return {"message": "Item deleted successfully"}
