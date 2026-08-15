from datetime import date
from typing import Optional, List
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import User, Debt
from app.schemas.schemas import DebtCreate, DebtResponse, DebtPayment
from app.routers.auth import get_current_active_user

router = APIRouter(prefix="/api/debts", tags=["Debts"])


def debt_to_response(debt: Debt) -> dict:
    return {
        "id": debt.id,
        "person_name": debt.person_name,
        "phone_number": debt.phone_number,
        "type": debt.type,
        "amount": debt.amount,
        "remaining_amount": debt.remaining_amount,
        "status": debt.status,
        "description": debt.description,
        "due_date": debt.due_date,
        "created_at": debt.created_at,
        "updated_at": debt.updated_at
    }


@router.get("", response_model=List[DebtResponse])
def get_debts(
    type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Debt)
    if type:
        query = query.filter(Debt.type == type)
    if status:
        query = query.filter(Debt.status == status)
    debts = query.order_by(Debt.created_at.desc()).all()
    return [debt_to_response(d) for d in debts]


@router.post("", response_model=DebtResponse)
def create_debt(debt: DebtCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_debt = Debt(
        person_name=debt.person_name,
        phone_number=debt.phone_number,
        type=debt.type,
        amount=debt.amount,
        remaining_amount=debt.amount,
        status="pending",
        description=debt.description,
        due_date=debt.due_date
    )
    db.add(db_debt)
    db.commit()
    db.refresh(db_debt)
    return debt_to_response(db_debt)


@router.post("/{debt_id}/payment", response_model=DebtResponse)
def record_payment(debt_id: int, payment: DebtPayment, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_debt = db.query(Debt).filter(Debt.id == debt_id).first()
    if not db_debt:
        raise HTTPException(status_code=404, detail="Debt record not found")
    if payment.amount <= 0:
        raise HTTPException(status_code=400, detail="Payment amount must be positive")

    new_remaining = max(Decimal("0.00"), db_debt.remaining_amount - payment.amount)
    db_debt.remaining_amount = new_remaining
    db_debt.status = "paid" if new_remaining == 0 else "partially_paid"
    db.commit()
    db.refresh(db_debt)
    return debt_to_response(db_debt)


@router.delete("/{debt_id}")
def delete_debt(debt_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_debt = db.query(Debt).filter(Debt.id == debt_id).first()
    if not db_debt:
        raise HTTPException(status_code=404, detail="Debt record not found")

    db.delete(db_debt)
    db.commit()
    return {"message": "Debt record deleted"}