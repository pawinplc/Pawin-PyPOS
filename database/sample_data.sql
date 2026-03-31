-- ============================================
-- PyPOS: Insert Sample Categories and Items
-- Run AFTER disable_rls.sql
-- ============================================

-- INSERT SAMPLE CATEGORIES
INSERT INTO public.categories (name, description) VALUES
('Pens & Pencils', 'All types of pens, pencils, markers, and highlighters'),
('Notebooks', 'Exercise books, spiral notebooks, and writing pads'),
('Paper Products', 'A4 paper, sticky notes, sticky tabs, and paper pads'),
('Office Supplies', 'Staplers, clips, tape, scissors, and rulers'),
('Art Supplies', 'Paint, brushes, sketch pads, and craft materials'),
('Files & Folders', 'Ring binders, file folders, and document wallets'),
('Desk Accessories', 'Desk organizers, pen holders, and mouse pads'),
('Technology', 'USB drives, headphones, calculators, and batteries');

-- ============================================
-- INSERT SAMPLE ITEMS
-- ============================================

INSERT INTO public.items (name, sku, category_id, unit_price, cost_price, quantity, min_stock_level, barcode) VALUES
-- Pens & Pencils (category_id = 1)
('Blue Ballpoint Pen (10 pack)', 'PEN-001', 1, 35.00, 18.00, 150, 20, '8901234567890'),
('Black Gel Pen (5 pack)', 'PEN-002', 1, 45.00, 22.00, 120, 15, '8901234567891'),
('HB Pencil (12 pack)', 'PEN-003', 1, 25.00, 12.00, 200, 30, '8901234567892'),
('Highlighters Set (6 colors)', 'PEN-004', 1, 55.00, 28.00, 80, 10, '8901234567893'),
('Permanent Marker (Black)', 'PEN-005', 1, 28.00, 14.00, 90, 15, '8901234567894'),

-- Notebooks (category_id = 2)
('A5 Exercise Book (100 pages)', 'NB-001', 2, 18.00, 9.00, 300, 50, '8901234568001'),
('A4 Spiral Notebook', 'NB-002', 2, 35.00, 18.00, 150, 25, '8901234568002'),
('Grid Notebook A4', 'NB-003', 2, 42.00, 21.00, 100, 20, '8901234568003'),
('Hardcover Journal A5', 'NB-004', 2, 89.00, 45.00, 50, 10, '8901234568004'),
('Writing Pad A4 (50 sheets)', 'NB-005', 2, 25.00, 12.00, 180, 30, '8901234568005'),

-- Paper Products (category_id = 3)
('A4 Paper (500 sheets)', 'PAP-001', 3, 120.00, 65.00, 100, 20, '8901234569001'),
('Sticky Notes 3x3 (12 pack)', 'PAP-002', 3, 45.00, 22.00, 200, 40, '8901234569002'),
('Sticky Flags/Tabs', 'PAP-003', 3, 35.00, 18.00, 150, 25, '8901234569003'),
('Copy Paper A3 (500 sheets)', 'PAP-004', 3, 180.00, 95.00, 60, 15, '8901234569004'),
('Card Stock Colored (20 pack)', 'PAP-005', 3, 65.00, 32.00, 80, 15, '8901234569005'),

-- Office Supplies (category_id = 4)
('Paper Clips (100 pack)', 'OFF-001', 4, 22.00, 11.00, 250, 40, '8901234570001'),
('Stapler with staples', 'OFF-002', 4, 65.00, 32.00, 75, 15, '8901234570002'),
('Scotch Tape (3 pack)', 'OFF-003', 4, 45.00, 22.00, 120, 20, '8901234570003'),
('Scissors (7 inch)', 'OFF-004', 4, 55.00, 28.00, 60, 10, '8901234570004'),
('Ruler 30cm', 'OFF-005', 4, 15.00, 7.00, 150, 30, '8901234570005'),
('Eraser Large', 'OFF-006', 4, 12.00, 6.00, 200, 40, '8901234570006'),
('Pencil Sharpener', 'OFF-007', 4, 18.00, 9.00, 100, 20, '8901234570007'),
('Correction Tape', 'OFF-008', 4, 32.00, 16.00, 90, 15, '8901234570008'),

-- Art Supplies (category_id = 5)
('Watercolor Set (12 colors)', 'ART-001', 5, 185.00, 95.00, 40, 8, '8901234571001'),
('Paint Brushes Set', 'ART-002', 5, 95.00, 48.00, 50, 10, '8901234571002'),
('Sketch Pad A4', 'ART-003', 5, 65.00, 32.00, 70, 15, '8901234571003'),
('Colored Pencils (24 colors)', 'ART-004', 5, 145.00, 75.00, 45, 10, '8901234571004'),
('Craft Paper Pack', 'ART-005', 5, 55.00, 28.00, 100, 20, '8901234571005'),

-- Files & Folders (category_id = 6)
('Ring Binder A4 (2 inch)', 'FIL-001', 6, 85.00, 42.00, 60, 12, '8901234572001'),
('Lever Arch File', 'FIL-002', 6, 95.00, 48.00, 55, 10, '8901234572002'),
('Document Wallet', 'FIL-003', 6, 25.00, 12.00, 120, 25, '8901234572003'),
('Index Cards (100 pack)', 'FIL-004', 6, 28.00, 14.00, 150, 30, '8901234572004'),
('Hanging File Folder', 'FIL-005', 6, 65.00, 32.00, 80, 15, '8901234572005'),

-- Desk Accessories (category_id = 7)
('Desk Organizer', 'DSK-001', 7, 125.00, 62.00, 40, 8, '8901234573001'),
('Pen Holder (Metal)', 'DSK-002', 7, 75.00, 38.00, 50, 10, '8901234573002'),
('Mouse Pad', 'DSK-003', 7, 45.00, 22.00, 80, 15, '8901234573003'),
('Desk Calendar 2026', 'DSK-004', 7, 85.00, 42.00, 30, 5, '8901234573004'),
('Calculator (Desktop)', 'DSK-005', 7, 195.00, 98.00, 25, 5, '8901234573005'),

-- Technology (category_id = 8)
('USB Flash Drive 32GB', 'TEC-001', 8, 199.00, 120.00, 50, 10, '8901234574001'),
('USB Flash Drive 64GB', 'TEC-002', 8, 299.00, 180.00, 35, 8, '8901234574002'),
('AA Batteries (8 pack)', 'TEC-003', 8, 85.00, 45.00, 100, 20, '8901234574003'),
('AAA Batteries (8 pack)', 'TEC-004', 8, 85.00, 45.00, 100, 20, '8901234574004'),
('Earbuds Wired', 'TEC-005', 8, 145.00, 72.00, 40, 10, '8901234574005');
