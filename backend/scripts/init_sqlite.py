"""Create and seed the local SQLite development database.

Usage (from the backend directory):

    venv/bin/python scripts/init_sqlite.py

It creates every table from the SQLAlchemy models (the same schema the app
uses at runtime) and adds the default admin/cashier accounts plus a small
sample catalogue. Existing rows are left untouched, so the script is safe to
run more than once.
"""

import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

from passlib.context import CryptContext  # noqa: E402

from app.database import Base, SessionLocal, engine  # noqa: E402
from app.models import models  # noqa: E402  (import registers all models)


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
DEFAULT_PASSWORD = "admin123"

CATEGORIES = [
    ("Paper Products", "A4 paper, notebooks, sticky notes"),
    ("Writing Instruments", "Pens, pencils, markers"),
    ("Office Supplies", "Staplers, clips, tape, scissors"),
    ("Files & Folders", "Binders, file folders, dividers"),
    ("Electronics", "Calculators, batteries, USB drives"),
    ("Stationery Services", "Printing, scanning, laminating services"),
    ("Printing & Scanning", "Document printing and scanning services"),
]

ITEMS = [
    # name, sku, category, unit_price, cost_price, quantity, min_stock
    ("A4 Paper (500 sheets)", "PAP001", "Paper Products", 150, 120, 50, 10),
    ("Notebook A5 (100 pages)", "NOTE001", "Paper Products", 45, 30, 100, 20),
    ("Ballpoint Pen Blue", "PEN001", "Writing Instruments", 15, 8, 200, 50),
    ("Ballpoint Pen Black", "PEN002", "Writing Instruments", 15, 8, 200, 50),
    ("Pencil 2B", "PENC001", "Writing Instruments", 10, 5, 150, 30),
    ("Marker Set (12 colors)", "MARK001", "Writing Instruments", 180, 120, 30, 10),
    ("Sticky Notes (3x3)", "STICK001", "Paper Products", 35, 20, 80, 20),
    ("Stapler Heavy Duty", "STAP001", "Office Supplies", 120, 80, 25, 5),
    ("Paper Clips (100pcs)", "CLIP001", "Office Supplies", 25, 15, 100, 20),
    ("Clear Tape", "TAPE001", "Office Supplies", 30, 18, 60, 15),
    ("Scissors", "SCIS001", "Office Supplies", 55, 35, 40, 10),
    ("Ring Binder A4", "BIND001", "Files & Folders", 85, 55, 35, 10),
    ("File Folder", "FILE001", "Files & Folders", 20, 12, 150, 30),
    ("Document Divider", "DIV001", "Files & Folders", 15, 8, 100, 25),
    ("Calculator Desktop", "CALC001", "Electronics", 350, 250, 15, 5),
    ("AA Batteries (4 pack)", "BAT001", "Electronics", 60, 40, 50, 15),
    ("USB Flash Drive 16GB", "USB001", "Electronics", 180, 120, 20, 5),
]

SERVICES = [
    ("Black & White Printing (per page)", "PRINT-BW-001", 50, "Stationery Services"),
    ("Color Printing (per page)", "PRINT-COLOR-001", 150, "Stationery Services"),
    ("Document Scanning (per page)", "SCAN-001", 30, "Printing & Scanning"),
    ("Laminating A4 (per page)", "LAMIN-A4-001", 100, "Stationery Services"),
    ("Binding (per document)", "BIND-001", 250, "Stationery Services"),
    ("Color Copy (per page)", "COPY-COLOR-001", 200, "Stationery Services"),
]


def seed_users(db):
    users = [
        ("admin", "master@pawinplc.com", "System Admin", "master_admin"),
        ("cashier1", "cashier1@pawin.com", "Cashier One", "on_duty"),
    ]
    for username, email, full_name, role in users:
        existing = db.query(models.User).filter(models.User.username == username).first()
        if existing:
            if username == "admin":
                if existing.role != "master_admin":
                    existing.role = "master_admin"
                if existing.email != email:
                    existing.email = email
            continue
        db.add(
            models.User(
                username=username,
                email=email,
                full_name=full_name,
                role=role,
                password_hash=pwd_context.hash(DEFAULT_PASSWORD),
                is_active=True,
            )
        )
    db.commit()


def seed_catalogue(db):
    categories = {}
    for name, description in CATEGORIES:
        category = db.query(models.Category).filter(models.Category.name == name).first()
        if not category:
            category = models.Category(name=name, description=description)
            db.add(category)
            db.flush()
        categories[name] = category.id
    db.commit()

    for name, sku, category, price, cost, quantity, min_stock in ITEMS:
        if db.query(models.Item).filter(models.Item.sku == sku).first():
            continue
        db.add(
            models.Item(
                name=name,
                sku=sku,
                category_id=categories.get(category),
                unit_price=price,
                cost_price=cost,
                quantity=quantity,
                min_stock_level=min_stock,
                is_active=True,
                is_service=False,
            )
        )

    for name, sku, price, category in SERVICES:
        if db.query(models.Item).filter(models.Item.sku == sku).first():
            continue
        db.add(
            models.Item(
                name=name,
                sku=sku,
                category_id=categories.get(category),
                unit_price=price,
                cost_price=0,
                quantity=9999,
                min_stock_level=0,
                is_active=True,
                is_service=True,
            )
        )
    db.commit()


def main():
    print(f"Database: {engine.url}")
    Base.metadata.create_all(bind=engine)
    print(f"Tables: {', '.join(sorted(Base.metadata.tables))}")

    db = SessionLocal()
    try:
        seed_users(db)
        seed_catalogue(db)
        print(
            "Seed complete: "
            f"{db.query(models.User).count()} users, "
            f"{db.query(models.Category).count()} categories, "
            f"{db.query(models.Item).count()} items"
        )
    finally:
        db.close()

    print(f"\nMaster admin: master@pawinplc.com (username: admin) / {DEFAULT_PASSWORD}")
    print(f"Cashier:      cashier1 / {DEFAULT_PASSWORD}")


if __name__ == "__main__":
    main()
