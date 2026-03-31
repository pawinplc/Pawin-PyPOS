-- ============================================
-- PyPOS: Supabase Setup Script
-- Run this entire script in your Supabase SQL Editor
-- ============================================

-- ============================================
-- PART 1: DISABLE ROW LEVEL SECURITY
-- ============================================

-- Disable RLS for all tables (click "Disable RLS" for each table in Supabase Dashboard OR run these commands)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales DISABLE ROW LEVEL SECURITY;

-- Grant permissions to all roles
GRANT ALL ON public.users TO authenticated, anon, service_role;
GRANT ALL ON public.categories TO authenticated, anon, service_role;
GRANT ALL ON public.items TO authenticated, anon, service_role;
GRANT ALL ON public.stock_movements TO authenticated, anon, service_role;
GRANT ALL ON public.sales TO authenticated, anon, service_role;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon, service_role;

-- ============================================
-- PART 2: INSERT SAMPLE CATEGORIES
-- ============================================

INSERT INTO public.categories (name, description) VALUES
('Pens & Pencils', 'All types of pens, pencils, markers, and highlighters'),
('Notebooks', 'Exercise books, spiral notebooks, and writing pads'),
('Paper Products', 'A4 paper, sticky notes, sticky tabs, and paper pads'),
('Office Supplies', 'Staplers, clips, tape, scissors, and rulers'),
('Art Supplies', 'Paint, brushes, sketch pads, and craft materials'),
('Files & Folders', 'Ring binders, file folders, and document wallets'),
('Desk Accessories', 'Desk organizers, pen holders, and mouse pads'),
('Technology', 'USB drives, headphones, calculators, and batteries')
ON CONFLICT DO NOTHING;

-- ============================================
-- PART 3: INSERT SAMPLE ITEMS (Currency: TSH)
-- ============================================

INSERT INTO public.items (name, sku, category_id, unit_price, cost_price, quantity, min_stock_level, barcode) VALUES
-- Pens & Pencils (category_id = 1)
('Blue Ballpoint Pen (10 pack)', 'PEN-001', 1, 3500.00, 1800.00, 150, 20, '8901234567890'),
('Black Gel Pen (5 pack)', 'PEN-002', 1, 4500.00, 2200.00, 120, 15, '8901234567891'),
('HB Pencil (12 pack)', 'PEN-003', 1, 2500.00, 1200.00, 200, 30, '8901234567892'),
('Highlighters Set (6 colors)', 'PEN-004', 1, 5500.00, 2800.00, 80, 10, '8901234567893'),
('Permanent Marker (Black)', 'PEN-005', 1, 2800.00, 1400.00, 90, 15, '8901234567894'),

-- Notebooks (category_id = 2)
('A5 Exercise Book (100 pages)', 'NB-001', 2, 1800.00, 900.00, 300, 50, '8901234568001'),
('A4 Spiral Notebook', 'NB-002', 2, 3500.00, 1800.00, 150, 25, '8901234568002'),
('Grid Notebook A4', 'NB-003', 2, 4200.00, 2100.00, 100, 20, '8901234568003'),
('Hardcover Journal A5', 'NB-004', 2, 8900.00, 4500.00, 50, 10, '8901234568004'),
('Writing Pad A4 (50 sheets)', 'NB-005', 2, 2500.00, 1200.00, 180, 30, '8901234568005'),

-- Paper Products (category_id = 3)
('A4 Paper (500 sheets)', 'PAP-001', 3, 12000.00, 6500.00, 100, 20, '8901234569001'),
('Sticky Notes 3x3 (12 pack)', 'PAP-002', 3, 4500.00, 2200.00, 200, 40, '8901234569002'),
('Sticky Flags/Tabs', 'PAP-003', 3, 3500.00, 1800.00, 150, 25, '8901234569003'),
('Copy Paper A3 (500 sheets)', 'PAP-004', 3, 18000.00, 9500.00, 60, 15, '8901234569004'),
('Card Stock Colored (20 pack)', 'PAP-005', 3, 6500.00, 3200.00, 80, 15, '8901234569005'),

-- Office Supplies (category_id = 4)
('Paper Clips (100 pack)', 'OFF-001', 4, 2200.00, 1100.00, 250, 40, '8901234570001'),
('Stapler with staples', 'OFF-002', 4, 6500.00, 3200.00, 75, 15, '8901234570002'),
('Scotch Tape (3 pack)', 'OFF-003', 4, 4500.00, 2200.00, 120, 20, '8901234570003'),
('Scissors (7 inch)', 'OFF-004', 4, 5500.00, 2800.00, 60, 10, '8901234570004'),
('Ruler 30cm', 'OFF-005', 4, 1500.00, 700.00, 150, 30, '8901234570005'),
('Eraser Large', 'OFF-006', 4, 1200.00, 600.00, 200, 40, '8901234570006'),
('Pencil Sharpener', 'OFF-007', 4, 1800.00, 900.00, 100, 20, '8901234570007'),
('Correction Tape', 'OFF-008', 4, 3200.00, 1600.00, 90, 15, '8901234570008'),

-- Art Supplies (category_id = 5)
('Watercolor Set (12 colors)', 'ART-001', 5, 18500.00, 9500.00, 40, 8, '8901234571001'),
('Paint Brushes Set', 'ART-002', 5, 9500.00, 4800.00, 50, 10, '8901234571002'),
('Sketch Pad A4', 'ART-003', 5, 6500.00, 3200.00, 70, 15, '8901234571003'),
('Colored Pencils (24 colors)', 'ART-004', 5, 14500.00, 7500.00, 45, 10, '8901234571004'),
('Craft Paper Pack', 'ART-005', 5, 5500.00, 2800.00, 100, 20, '8901234571005'),

-- Files & Folders (category_id = 6)
('Ring Binder A4 (2 inch)', 'FIL-001', 6, 8500.00, 4200.00, 60, 12, '8901234572001'),
('Lever Arch File', 'FIL-002', 6, 9500.00, 4800.00, 55, 10, '8901234572002'),
('Document Wallet', 'FIL-003', 6, 2500.00, 1200.00, 120, 25, '8901234572003'),
('Index Cards (100 pack)', 'FIL-004', 6, 2800.00, 1400.00, 150, 30, '8901234572004'),
('Hanging File Folder', 'FIL-005', 6, 6500.00, 3200.00, 80, 15, '8901234572005'),

-- Desk Accessories (category_id = 7)
('Desk Organizer', 'DSK-001', 7, 12500.00, 6200.00, 40, 8, '8901234573001'),
('Pen Holder (Metal)', 'DSK-002', 7, 7500.00, 3800.00, 50, 10, '8901234573002'),
('Mouse Pad', 'DSK-003', 7, 4500.00, 2200.00, 80, 15, '8901234573003'),
('Desk Calendar 2026', 'DSK-004', 7, 8500.00, 4200.00, 30, 5, '8901234573004'),
('Calculator (Desktop)', 'DSK-005', 7, 19500.00, 9800.00, 25, 5, '8901234573005'),

-- Technology (category_id = 8)
('USB Flash Drive 32GB', 'TEC-001', 8, 19900.00, 12000.00, 50, 10, '8901234574001'),
('USB Flash Drive 64GB', 'TEC-002', 8, 29900.00, 18000.00, 35, 8, '8901234574002'),
('AA Batteries (8 pack)', 'TEC-003', 8, 8500.00, 4500.00, 100, 20, '8901234574003'),
('AAA Batteries (8 pack)', 'TEC-004', 8, 8500.00, 4500.00, 100, 20, '8901234574004'),
('Earbuds Wired', 'TEC-005', 8, 14500.00, 7200.00, 40, 10, '8901234574005')
ON CONFLICT (sku) DO NOTHING;

-- ============================================
-- PART 4: VERIFY SETUP
-- ============================================

-- Check if RLS is disabled
SELECT 
    tablename, 
    rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check if data was inserted
SELECT 'Categories' as table_name, COUNT(*) as count FROM categories
UNION ALL
SELECT 'Items', COUNT(*) FROM items;
