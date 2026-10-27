from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.audit import record_inventory_change
from app.models.models import User, Category
from app.schemas.schemas import CategoryCreate, CategoryResponse
from app.routers.auth import get_current_active_user
from app.roles import is_admin

router = APIRouter(prefix="/api/categories", tags=["Categories"])

@router.get("", response_model=List[CategoryResponse])
def get_categories(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return db.query(Category).all()

@router.get("/{category_id}", response_model=CategoryResponse)
def get_category(category_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category

@router.post("", response_model=CategoryResponse)
def create_category(category: CategoryCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Only admin can create categories")
    
    db_category = Category(**category.model_dump())
    db.add(db_category)
    db.flush()

    record_inventory_change(
        db,
        current_user,
        action="created",
        entity_type="category",
        entity_id=db_category.id,
        description=f"Created category '{db_category.name}'",
    )

    db.commit()
    db.refresh(db_category)
    return db_category

@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(category_id: int, category: CategoryCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Only admin can update categories")
    
    db_category = db.query(Category).filter(Category.id == category_id).first()
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    for key, value in category.model_dump().items():
        setattr(db_category, key, value)

    record_inventory_change(
        db,
        current_user,
        action="updated",
        entity_type="category",
        entity_id=db_category.id,
        description=f"Updated category '{db_category.name}'",
    )

    db.commit()
    db.refresh(db_category)
    return db_category

@router.delete("/{category_id}")
def delete_category(category_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Only admin can delete categories")
    
    db_category = db.query(Category).filter(Category.id == category_id).first()
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    record_inventory_change(
        db,
        current_user,
        action="deleted",
        entity_type="category",
        entity_id=db_category.id,
        description=f"Deleted category '{db_category.name}'",
    )

    db.delete(db_category)
    db.commit()
    return {"message": "Category deleted successfully"}
