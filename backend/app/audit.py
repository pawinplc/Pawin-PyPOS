"""Helpers for writing inventory audit entries.

Call these from the CRUD routes before committing. The entry is added to the
same transaction as the change, so an operation and its audit record succeed or
fail together.
"""

from typing import Optional

from sqlalchemy.orm import Session

from app.models.models import AuditLog, User


def record_inventory_change(
    db: Session,
    user: Optional[User],
    action: str,
    entity_type: str,
    entity_id: Optional[int],
    description: str,
) -> None:
    """Queue an audit entry for an item/category/service CRUD operation.

    ``role`` is snapshotted so the log still shows the role the user had when
    they performed the action, even if their role changes later.
    """
    db.add(
        AuditLog(
            user_id=user.id if user else None,
            username=user.username if user else None,
            role=user.role if user else None,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            description=description,
        )
    )
