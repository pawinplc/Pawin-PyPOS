-- Fix for Item/Category Deletion
-- Run this in Supabase SQL Editor if you want to allow full deletion of items/categories 
-- even if they have transaction history.

-- 1. Ensure stock_movements has CASCADE
ALTER TABLE stock_movements 
DROP CONSTRAINT IF EXISTS stock_movements_item_id_fkey,
ADD CONSTRAINT stock_movements_item_id_fkey 
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE;

-- 2. Add CASCADE to sale_items (The main reason deletion fails)
ALTER TABLE sale_items 
DROP CONSTRAINT IF EXISTS sale_items_item_id_fkey,
ADD CONSTRAINT sale_items_item_id_fkey 
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE;

-- 3. Ensure categories deletion sets item category to NULL (already should be, but let's be sure)
ALTER TABLE items
DROP CONSTRAINT IF EXISTS items_category_id_fkey,
ADD CONSTRAINT items_category_id_fkey 
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;
