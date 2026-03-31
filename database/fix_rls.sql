-- Fix Row Level Security Policies for all tables
-- Run this in Supabase SQL Editor

-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow all for categories" ON categories;
DROP POLICY IF EXISTS "Allow all for items" ON items;
DROP POLICY IF EXISTS "Allow all for stock_movements" ON stock_movements;
DROP POLICY IF EXISTS "Allow all for sales" ON sales;
DROP POLICY IF EXISTS "Allow all for sale_items" ON sale_items;

-- Create permissive policies for development
CREATE POLICY "Allow all for categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for items" ON items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for stock_movements" ON stock_movements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for sales" ON sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for sale_items" ON sale_items FOR ALL USING (true) WITH CHECK (true);

-- For users table - be more restrictive
DROP POLICY IF EXISTS "Allow read for users" ON users;
CREATE POLICY "Allow read for users" ON users FOR SELECT USING (true);

-- Create categories if not exists
INSERT INTO categories (name, description) VALUES
('Paper Products', 'A4 paper, notebooks, sticky notes'),
('Writing Instruments', 'Pens, pencils, markers'),
('Office Supplies', 'Staplers, clips, tape, scissors'),
('Files & Folders', 'Binders, file folders, dividers'),
('Electronics', 'Calculators, batteries, USB drives')
ON CONFLICT DO NOTHING;

-- Create sample items if not exists
INSERT INTO items (name, sku, category_id, unit_price, cost_price, quantity, min_stock_level, barcode) VALUES
('A4 Paper (500 sheets)', 'PAP001', 1, 150.00, 120.00, 50, 10, '8901234567890'),
('Notebook A5 (100 pages)', 'NOTE001', 1, 45.00, 30.00, 100, 20, '8901234567891'),
('Ballpoint Pen Blue', 'PEN001', 2, 15.00, 8.00, 200, 50, '8901234567892'),
('Ballpoint Pen Black', 'PEN002', 2, 15.00, 8.00, 200, 50, '8901234567893'),
('Pencil 2B', 'PENC001', 2, 10.00, 5.00, 150, 30, '8901234567894'),
('Marker Set (12 colors)', 'MARK001', 2, 180.00, 120.00, 30, 10, '8901234567895'),
('Sticky Notes (3x3)', 'STICK001', 1, 35.00, 20.00, 80, 20, '8901234567896'),
('Stapler Heavy Duty', 'STAP001', 3, 120.00, 80.00, 25, 5, '8901234567897'),
('Paper Clips (100pcs)', 'CLIP001', 3, 25.00, 15.00, 100, 20, '8901234567898'),
('Clear Tape', 'TAPE001', 3, 30.00, 18.00, 60, 15, '8901234567899'),
('Scissors', 'SCIS001', 3, 55.00, 35.00, 40, 10, '8901234567900'),
('Ring Binder A4', 'BIND001', 4, 85.00, 55.00, 35, 10, '8901234567901'),
('File Folder', 'FILE001', 4, 20.00, 12.00, 150, 30, '8901234567902'),
('Document Divider', 'DIV001', 4, 15.00, 8.00, 100, 25, '8901234567903'),
('Calculator Desktop', 'CALC001', 5, 350.00, 250.00, 15, 5, '8901234567904'),
('AA Batteries (4 pack)', 'BAT001', 5, 60.00, 40.00, 50, 15, '8901234567905'),
('USB Flash Drive 16GB', 'USB001', 5, 180.00, 120.00, 20, 5, '8901234567906')
ON CONFLICT (sku) DO NOTHING;
