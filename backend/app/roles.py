"""Role hierarchy helpers.

Roles, highest first:

- ``master_admin`` — full access, including Users and Audit Log.
- ``admin`` — everything except Users and Audit Log.
- ``on_duty`` — normal staff access.
"""

ADMIN_ROLES = ("admin", "master_admin")


def is_admin(user) -> bool:
    return bool(user and user.role in ADMIN_ROLES)


def is_master_admin(user) -> bool:
    return bool(user and user.role == "master_admin")
