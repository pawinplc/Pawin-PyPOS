from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from decimal import Decimal

from app.database import get_db
from app.models.models import User, Item, Sale, SaleItem
from app.schemas.schemas import SaleCreate, SaleResponse, SaleItemResponse
from app.routers.auth import get_current_active_user

router = APIRouter(prefix="/api/sales", tags=["Sales"])

@router.post("", response_model=SaleResponse)
def create_sale(sale_data: SaleCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if not sale_data.items:
        raise HTTPException(status_code=400, detail="No items in sale")
    
    total_amount = Decimal("0.00")
    sale_items_data = []
    
    for item_data in sale_data.items:
        item = db.query(Item).filter(Item.id == item_data.item_id).first()
        if not item:
            raise HTTPException(status_code=404, detail=f"Item ID {item_data.item_id} not found")
        if item.quantity < item_data.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {item.name}. Available: {item.quantity}")
        
        subtotal = item_data.unit_price * item_data.quantity
        total_amount += subtotal
        sale_items_data.append({
            "item": item,
            "quantity": item_data.quantity,
            "unit_price": item_data.unit_price,
            "subtotal": subtotal
        })
    
    final_amount = total_amount - sale_data.discount_amount
    
    db_sale = Sale(
        total_amount=total_amount,
        discount_amount=sale_data.discount_amount,
        final_amount=final_amount,
        payment_method=sale_data.payment_method,
        cashier_id=current_user.id,
        customer_name=sale_data.customer_name,
        notes=sale_data.notes
    )
    db.add(db_sale)
    db.flush()
    
    for item_data in sale_items_data:
        db_sale_item = SaleItem(
            sale_id=db_sale.id,
            item_id=item_data["item"].id,
            quantity=item_data["quantity"],
            unit_price=item_data["unit_price"],
            subtotal=item_data["subtotal"]
        )
        db.add(db_sale_item)
        item_data["item"].quantity -= item_data["quantity"]
    
    db.commit()
    db.refresh(db_sale)
    
    sale_items = db.query(SaleItem).filter(SaleItem.sale_id == db_sale.id).all()
    
    return {
        "id": db_sale.id,
        "total_amount": db_sale.total_amount,
        "discount_amount": db_sale.discount_amount,
        "final_amount": db_sale.final_amount,
        "payment_method": db_sale.payment_method,
        "cashier_id": db_sale.cashier_id,
        "customer_name": db_sale.customer_name,
        "notes": db_sale.notes,
        "created_at": db_sale.created_at,
        "cashier_name": current_user.full_name or current_user.username,
        "sale_items": [
            {
                "id": si.id,
                "item_id": si.item_id,
                "quantity": si.quantity,
                "unit_price": si.unit_price,
                "subtotal": si.subtotal,
                "item_name": si.item.name if si.item else None
            }
            for si in sale_items
        ]
    }

@router.get("", response_model=List[SaleResponse])
def get_sales(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    sales = db.query(Sale).order_by(Sale.created_at.desc()).offset(skip).limit(limit).all()
    
    result = []
    for sale in sales:
        sale_items = db.query(SaleItem).filter(SaleItem.sale_id == sale.id).all()
        result.append({
            "id": sale.id,
            "total_amount": sale.total_amount,
            "discount_amount": sale.discount_amount,
            "final_amount": sale.final_amount,
            "payment_method": sale.payment_method,
            "cashier_id": sale.cashier_id,
            "customer_name": sale.customer_name,
            "notes": sale.notes,
            "created_at": sale.created_at,
            "cashier_name": sale.cashier.full_name or sale.cashier.username if sale.cashier else None,
            "sale_items": [
                {
                    "id": si.id,
                    "item_id": si.item_id,
                    "quantity": si.quantity,
                    "unit_price": si.unit_price,
                    "subtotal": si.subtotal,
                    "item_name": si.item.name if si.item else None
                }
                for si in sale_items
            ]
        })
    return result

@router.get("/{sale_id}", response_model=SaleResponse)
def get_sale(sale_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    
    sale_items = db.query(SaleItem).filter(SaleItem.sale_id == sale.id).all()
    
    return {
        "id": sale.id,
        "total_amount": sale.total_amount,
        "discount_amount": sale.discount_amount,
        "final_amount": sale.final_amount,
        "payment_method": sale.payment_method,
        "cashier_id": sale.cashier_id,
        "customer_name": sale.customer_name,
        "notes": sale.notes,
        "created_at": sale.created_at,
        "cashier_name": sale.cashier.full_name or sale.cashier.username if sale.cashier else None,
        "sale_items": [
            {
                "id": si.id,
                "item_id": si.item_id,
                "quantity": si.quantity,
                "unit_price": si.unit_price,
                "subtotal": si.subtotal,
                "item_name": si.item.name if si.item else None
            }
            for si in sale_items
        ]
    }
