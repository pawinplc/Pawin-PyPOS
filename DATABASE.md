# Pawin PyPOS - Database Management

## Flush All Data (Keep Users)

Run this in your Supabase SQL Editor to delete all data except users:

```sql
-- Disable RLS temporarily
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE items DISABLE ROW LEVEL SECURITY;
ALTER TABLE sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements DISABLE ROW LEVEL SECURITY;

-- Delete all data except users
TRUNCATE categories, items, sales, sale_items, stock_movements CASCADE;

-- Re-enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
```

## Tables

| Table | Description |
|-------|-------------|
| users | User accounts (NOT deleted) |
| categories | Item categories |
| items | Products inventory |
| sales | Sales transactions |
| sale_items | Individual items in each sale |
| stock_movements | Stock movement history |

## Storage Buckets

- `item-images` - Item product images

## Notes

- This will delete ALL data from categories, items, sales, sale_items, and stock_movements
- User accounts will NOT be affected
- This is useful for testing or starting fresh
