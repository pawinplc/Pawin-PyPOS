#!/usr/bin/env python3
"""One-off import of Stock_and_Sales_Records.xlsx into pypos-db.

Parses the two Stock Report sheets (Beverages + Items), splits bundled
rows ("Pencil + Red Pen") into individual items, generates SKUs, and
inserts categories/items plus one baseline `adjustment` stock movement
per stocked item. Service items (Printing/Scanning/Binding) are added
as is_service with no stock movement.

Usage:
    venv/bin/python scripts/import_excel.py --xlsx /tmp/Stock_and_Sales_Records.xlsx   # dry-run (default)
    venv/bin/python scripts/import_excel.py --xlsx /tmp/Stock_and_Sales_Records.xlsx --execute

Rules baked in (approved):
  - quantity = CLOSING stock; Sales sheet used as price lookup only
  - beverages + unknown prices default to 0; cost_price = 0
  - single-price bundle rows put the price on the first component
  - single-quantity bundle "Pad + Tissue" (21) splits 11/10
  - idempotent: existing SKUs are skipped, never duplicated
"""
import argparse
import os
import re
import sys
from decimal import Decimal

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

STOCK_DATE = "21/09/2026"

# (sheet name, row label) -> component item names (in order)
BUNDLES = {
    ("Stock Report - Items", "Daftari Pg 100 + 200"): ["Daftari Page 100", "Daftari Page 200"],
    ("Stock Report - Items", "Counter 2Q, 3Q, 4Q"): ["Counter 2Q", "Counter 3Q", "Counter 4Q"],
    ("Stock Report - Items", "Ruler Ndogo + Kubwa"): ["Ruler Ndogo", "Ruler Kubwa"],
    ("Stock Report - Items", "Pencil + Red Pen"): ["Pencil", "Red Pen"],
    ("Stock Report - Items", "Notergi + N.pen"): ["Notergi", "N.pen"],
    ("Stock Report - Items", "Sharpener + Rubber"): ["Sharpener", "Rubber"],
    ("Stock Report - Items", "Markpen + Correction"): ["Markpen", "Correction"],
    ("Stock Report - Items", "Bahasha A3, A4, A6"): ["Bahasha A3", "Bahasha A4", "Bahasha A6"],
    ("Stock Report - Items", "Manilla + Transparent"): ["Manilla", "Transparent"],
    ("Stock Report - Items", "Cookies + Toomuch"): ["Cookies", "Toomuch"],
    ("Stock Report - Items", "Bigboss + Pipi sote"): ["Bigboss", "Pipi sote"],
    ("Stock Report - Items", "Bigbom + Batook"): ["Bigbom", "Batook"],
    ("Stock Report - Items", "Minimin + Biscuit"): ["Minimin", "Biscuit"],
    ("Stock Report - Items", "Pad + Tissue"): ["Pad", "Tissue"],
}

# (sheet name, row label) -> explicit per-component quantities (closing stock)
QTY_OVERRIDE = {
    ("Stock Report - Items", "Pad + Tissue"): [11, 10],
}

# Component name -> unit_price in TZS (from Sales Records sheet, 12 Aug 2026).
# Anything missing here defaults to 0 (approved).
PRICES = {
    "Notebook": 1500,
    "Daftari Page 100": 1000, "Daftari Page 200": 1500,
    "Daftari Msomi": 800,
    "Counter Ndogo": 2000,
    "Counter 2Q": 2500, "Counter 3Q": 3500, "Counter 4Q": 4000,
    "Ruler Ndogo": 500, "Ruler Kubwa": 0,
    "Pencil": 300, "Red Pen": 200,
    "Notergi": 500, "N.pen": 200,
    "Sharpener": 300, "Rubber": 300,
    "Markpen": 1000, "Correction": 0,
    "Bahasha A3": 500, "Bahasha A4": 300, "Bahasha A6": 200,
    "Manilla": 0, "Transparent": 0,
    "Spiral": 0,
    "Ream bundle": 100,
    "Ubuyu": 500,
    "Achari": 1000,
    "Cookies": 200, "Toomuch": 300,
    "Korosho": 2000,
    "Crips": 500,
    "Bigboss": 100, "Pipi sote": 0,
    "Bigbom": 300, "Batook": 0,
    "Love chocolate": 200,
    "Minimin": 200, "Biscuit": 300,
    "Pad": 2000, "Tissue": 1500,
    "Water Tissue": 0,
}

# (name, unit_price) service items - never decrement stock, no movements
SERVICES = [
    ("Printing (per page)", 100),
    ("Scanning (per page)", 500),
    ("Binding (per document)", 3000),
]

CATEGORY_FOR_SHEET = {
    "Stock Report - Beverages": "Beverages",
    "Stock Report - Items": "Items",
}


def parse_int_cell(value, where):
    """Parse '34', '10 + 16', '05 + 05 + 02', '00 + 59' into [int, ...]."""
    if value is None or (isinstance(value, str) and not value.strip()):
        raise ValueError(f"{where}: empty quantity cell")
    if isinstance(value, (int, float)):
        return [int(value)]
    parts = [p.strip() for p in str(value).split("+")]
    out = []
    for p in parts:
        if not re.fullmatch(r"\d+", p):
            raise ValueError(f"{where}: bad quantity part {p!r} in {value!r}")
        out.append(int(p))
    return out


def build_plan(xlsx_path):
    from openpyxl import load_workbook
    wb = load_workbook(xlsx_path, data_only=True)
    for sheet in CATEGORY_FOR_SHEET:
        if sheet not in wb.sheetnames:
            raise ValueError(f"missing sheet {sheet!r} (have {wb.sheetnames})")

    plan = []  # dicts: category, name, sku, unit_price, quantity, is_service
    counters = {"Beverages": 0, "Items": 0}
    prefixes = {"Beverages": "BEV", "Items": "ITM"}

    for sheet, category in CATEGORY_FOR_SHEET.items():
        ws = wb[sheet]
        for r in range(4, ws.max_row + 1):
            raw_name = ws.cell(row=r, column=1).value
            raw_close = ws.cell(row=r, column=4).value
            name = (str(raw_name).strip() if raw_name is not None else "")
            if not name or name.lower() == "vi":
                continue  # skip junk/empty rows
            key = (sheet, name)
            components = BUNDLES.get(key, [name])
            if key in QTY_OVERRIDE:
                qtys = QTY_OVERRIDE[key]
            else:
                qtys = parse_int_cell(raw_close, f"{sheet} row {r} ({name})")
            if len(qtys) != len(components):
                raise ValueError(
                    f"{sheet} row {r} ({name}): {len(components)} components "
                    f"but {len(qtys)} quantities {qtys}"
                )
            for comp, qty in zip(components, qtys):
                if qty < 0:
                    raise ValueError(f"{comp}: negative quantity {qty}")
                if len(comp) > 200:
                    raise ValueError(f"{comp}: name too long")
                counters[category] += 1
                sku = f"{prefixes[category]}-{counters[category]:03d}"
                plan.append({
                    "category": category,
                    "name": comp,
                    "sku": sku,
                    "unit_price": Decimal(str(PRICES.get(comp, 0))),
                    "quantity": qty,
                    "is_service": False,
                })

    for i, (name, price) in enumerate(SERVICES, 1):
        plan.append({
            "category": "Services",
            "name": name,
            "sku": f"SRV-{i:03d}",
            "unit_price": Decimal(str(price)),
            "quantity": 9999,
            "is_service": True,
        })

    # duplicate-name / duplicate-sku sanity
    names = [p["name"] for p in plan]
    dupes = sorted({n for n in names if names.count(n) > 1})
    if dupes:
        raise ValueError(f"duplicate item names in plan: {dupes}")
    return plan


def print_preview(plan):
    print(f"\nIMPORT PREVIEW ({len(plan)} items)\n")
    print(f"{'Category':<10} {'SKU':<9} {'Qty':>5} {'Price':>9}  Name")
    print("-" * 70)
    for p in plan:
        print(f"{p['category']:<10} {p['sku']:<9} {p['quantity']:>5} {str(p['unit_price']):>9}  {p['name']}")
    zero_price = [p for p in plan if p["unit_price"] == 0 and not p["is_service"]]
    zero_qty = [p for p in plan if p["quantity"] == 0 and not p["is_service"]]
    print(f"\nTotal items: {len(plan)} | services: {sum(1 for p in plan if p['is_service'])}")
    print(f"Price = 0 ({len(zero_price)}): " + ", ".join(p["name"] for p in zero_price))
    print(f"Stock = 0 ({len(zero_qty)}): " + ", ".join(p["name"] for p in zero_qty))


def run_execute(plan):
    from dotenv import load_dotenv
    from sqlalchemy import create_engine, text

    load_dotenv(os.path.join(BASE_DIR, ".env"))
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        raise ValueError("DATABASE_URL not set (checked environment + .env)")
    engine = create_engine(db_url, pool_pre_ping=True)

    with engine.begin() as conn:  # single transaction, all-or-nothing
        existing_skus = {r[0] for r in conn.execute(text("SELECT sku FROM items"))}
        clash = [p["sku"] for p in plan if p["sku"] in existing_skus]
        if clash:
            raise ValueError(f"SKUs already in DB, aborting (idempotent skip refused): {clash}")

        cat_ids = {}
        for cat in ("Beverages", "Items", "Services"):
            row = conn.execute(
                text("SELECT id FROM categories WHERE name = :n"), {"n": cat}
            ).first()
            if row:
                cat_ids[cat] = row[0]
            else:
                conn.execute(
                    text("INSERT INTO categories (name, description) VALUES (:n, :d)"),
                    {"n": cat, "d": f"Imported from Excel stock report {STOCK_DATE}"},
                )
                cat_ids[cat] = conn.execute(text("SELECT LAST_INSERT_ID()")).scalar()

        admin = conn.execute(
            text("SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1")
        ).first()
        if not admin:
            raise ValueError("no admin user found for movement attribution")
        admin_id = admin[0]

        n_items = n_moves = 0
        for p in plan:
            conn.execute(
                text(
                    "INSERT INTO items (name, sku, category_id, description, unit_price, "
                    "cost_price, quantity, min_stock_level, is_active, is_service) "
                    "VALUES (:name, :sku, :cat, :desc, :price, 0, :qty, 5, 1, :svc)"
                ),
                {
                    "name": p["name"], "sku": p["sku"], "cat": cat_ids[p["category"]],
                    "desc": f"Imported from Excel stock report {STOCK_DATE}",
                    "price": p["unit_price"], "qty": p["quantity"],
                    "svc": 1 if p["is_service"] else 0,
                },
            )
            item_id = conn.execute(text("SELECT LAST_INSERT_ID()")).scalar()
            n_items += 1
            if not p["is_service"]:
                conn.execute(
                    text(
                        "INSERT INTO stock_movements (item_id, movement_type, quantity, "
                        "reference, notes, user_id) VALUES (:i, 'adjustment', :q, :r, :n, :u)"
                    ),
                    {
                        "i": item_id, "q": p["quantity"],
                        "r": "Initial stock from Excel import",
                        "n": f"Closing stock as of {STOCK_DATE} ({p['category']})",
                        "u": admin_id,
                    },
                )
                n_moves += 1

    print(f"\nCOMMITTED: {n_items} items, {n_moves} baseline movements.")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--xlsx", required=True)
    ap.add_argument("--execute", action="store_true",
                    help="write to DB (default is dry-run preview only)")
    args = ap.parse_args()

    plan = build_plan(args.xlsx)
    print_preview(plan)
    if not args.execute:
        print("\nDRY-RUN only - no database writes. Re-run with --execute to import.")
        return
    run_execute(plan)


if __name__ == "__main__":
    main()
