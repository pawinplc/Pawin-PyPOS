from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.models import User, Item, StockMovement
from app.schemas.schemas import StockMovementCreate, StockMovementResponse
from app.routers.auth import get_current_active_user

router = APIRouter(prefix="/api/stock", tags=["Stock Management"])

@router.get("/movements", response_model=List[StockMovementResponse])
def get_stock_movements(
    item_id: int = None,
    movement_type: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(StockMovement).order_by(StockMovement.created_at.desc())
    
    if item_id:
        query = query.filter(StockMovement.item_id == item_id)
    if movement_type:
        query = query.filter(StockMovement.movement_type == movement_type)
    
    movements = query.all()
    result = []
    for m in movements:
        result.append({
            "id": m.id,
            "item_id": m.item_id,
            "movement_type": m.movement_type,
            "quantity": m.quantity,
            "reference": m.reference,
            "notes": m.notes,
            "user_id": m.user_id,
            "created_at": m.created_at,
            "item_name": m.item.name if m.item else None,
            "username": m.user.username if m.user else None
        })
    return result

@router.post("/in", response_model=StockMovementResponse)
def stock_in(movement: StockMovementCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can add stock")
    
    item = db.query(Item).filter(Item.id == movement.item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    item.quantity += movement.quantity
    
    db_movement = StockMovement(
        item_id=movement.item_id,
        movement_type="in",
        quantity=movement.quantity,
        reference=movement.reference,
        notes=movement.notes,
        user_id=current_user.id
    )
    db.add(db_movement)
    db.commit()
    db.refresh(db_movement)
    
    return {
        "id": db_movement.id,
        "item_id": db_movement.item_id,
        "movement_type": db_movement.movement_type,
        "quantity": db_movement.quantity,
        "reference": db_movement.reference,
        "notes": db_movement.notes,
        "user_id": db_movement.user_id,
        "created_at": db_movement.created_at,
        "item_name": item.name,
        "username": current_user.username
    }

@router.post("/out", response_model=StockMovementResponse)
def stock_out(movement: StockMovementCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can remove stock")
    
    item = db.query(Item).filter(Item.id == movement.item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    if item.quantity < movement.quantity:
        raise HTTPException(status_code=400, detail=f"Insufficient stock. Available: {item.quantity}")
    
    item.quantity -= movement.quantity
    
    db_movement = StockMovement(
        item_id=movement.item_id,
        movement_type="out",
        quantity=movement.quantity,
        reference=movement.reference,
        notes=movement.notes,
        user_id=current_user.id
    )
    db.add(db_movement)
    db.commit()
    db.refresh(db_movement)
    
    return {
        "id": db_movement.id,
        "item_id": db_movement.item_id,
        "movement_type": db_movement.movement_type,
        "quantity": db_movement.quantity,
        "reference": db_movement.reference,
        "notes": db_movement.notes,
        "user_id": db_movement.user_id,
        "created_at": db_movement.created_at,
        "item_name": item.name,
        "username": current_user.username
    }

@router.post("/adjust", response_model=StockMovementResponse)
def adjust_stock(movement: StockMovementCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can adjust stock")
    
    item = db.query(Item).filter(Item.id == movement.item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    item.quantity = movement.quantity
    
    db_movement = StockMovement(
        item_id=movement.item_id,
        movement_type="adjustment",
        quantity=movement.quantity,
        reference=movement.reference,
        notes=movement.notes,
        user_id=current_user.id
    )
    db.add(db_movement)
    db.commit()
    db.refresh(db_movement)
    
    return {
        "id": db_movement.id,
        "item_id": db_movement.item_id,
        "movement_type": db_movement.movement_type,
        "quantity": db_movement.quantity,
        "reference": db_movement.reference,
        "notes": db_movement.notes,
        "user_id": db_movement.user_id,
        "created_at": db_movement.created_at,
        "item_name": item.name,
        "username": current_user.username
    }
