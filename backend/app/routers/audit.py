from datetime import datetime, timedelta, timezone
from typing import Optional
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models.models import User, Sale, SaleItem, Debt, StockMovement, UserActivity
from app.schemas.schemas import AuditLogResponse, AuditEntry
from app.routers.auth import get_current_active_user

router = APIRouter(prefix="/api/audit", tags=["Audit Log"])


@router.get("/logs", response_model=AuditLogResponse)
def get_audit_logs(
    type: Optional[str] = Query(None, description="Filter: sale, debt, stock, auth"),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can view audit logs")

    entries = []

    if not type or type == "sale":
        sales = db.query(Sale).order_by(Sale.created_at.desc()).limit(limit).all()
        for s in sales:
            item_count = len(s.sale_items) if s.sale_items else 0
            entries.append(AuditEntry(
                id=s.id,
                type="sale",
                action="sale_created",
                description=f"Sale of {item_count} item(s) via {s.payment_method or 'cash'}",
                amount=s.final_amount,
                user_id=s.cashier_id,
                username=s.cashier.username if s.cashier else None,
                created_at=s.created_at
            ))

    if not type or type == "debt":
        debts = db.query(Debt).order_by(Debt.created_at.desc()).limit(limit).all()
        for d in debts:
            entries.append(AuditEntry(
                id=d.id,
                type="debt",
                action="debt_created",
                description=f"Debt recorded for {d.person_name} ({d.type})",
                amount=d.amount,
                created_at=d.created_at
            ))

    if not type or type == "stock":
        movements = db.query(StockMovement).order_by(StockMovement.created_at.desc()).limit(limit).all()
        for m in movements:
            direction = {"in": "added", "out": "removed", "adjustment": "adjusted"}.get(m.movement_type, m.movement_type)
            entries.append(AuditEntry(
                id=m.id,
                type="stock",
                action=f"stock_{m.movement_type}",
                description=f"{direction.capitalize()} {m.quantity} of {m.item.name if m.item else 'item'}",
                user_id=m.user_id,
                username=m.user.username if m.user else None,
                created_at=m.created_at
            ))

    if not type or type == "auth":
        activities = db.query(UserActivity).order_by(UserActivity.created_at.desc()).limit(limit).all()
        for a in activities:
            action_label = "logged in" if a.action == "login" else "logged out" if a.action == "logout" else a.action
            entries.append(AuditEntry(
                id=a.id,
                type="auth",
                action=a.action,
                description=f"User {action_label}",
                user_id=a.user_id,
                username=a.user.username if a.user else None,
                created_at=a.created_at
            ))

    def sort_key(e):
        ts = e.created_at
        if ts is None:
            return datetime.min.replace(tzinfo=timezone.utc)
        if ts.tzinfo is not None:
            return ts.astimezone(timezone.utc)
        return ts.replace(tzinfo=timezone.utc)

    entries.sort(key=sort_key, reverse=True)
    entries = entries[:limit]

    return AuditLogResponse(entries=entries, total=len(entries))