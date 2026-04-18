-- Add is_service column to items table
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_service BOOLEAN DEFAULT FALSE;

-- Add service categories
INSERT INTO categories (name, description) VALUES
('Stationery Services', 'Printing, scanning, laminating services'),
('Printing & Scanning', 'Document printing and scanning services')
ON CONFLICT DO NOTHING;

-- Add service items (is_service = true, quantity = 9999 for display)
INSERT INTO items (name, sku, category_id, unit_price, quantity, min_stock_level, is_service) VALUES
('Black & White Printing (per page)', 'PRINT-BW-001', (SELECT id FROM categories WHERE name = 'Stationery Services' LIMIT 1), 50, 9999, 0, true),
('Color Printing (per page)', 'PRINT-COLOR-001', (SELECT id FROM categories WHERE name = 'Stationery Services' LIMIT 1), 150, 9999, 0, true),
('Document Scanning (per page)', 'SCAN-001', (SELECT id FROM categories WHERE name = 'Printing & Scanning' LIMIT 1), 30, 9999, 0, true),
('Laminating A4 (per page)', 'LAMIN-A4-001', (SELECT id FROM categories WHERE name = 'Stationery Services' LIMIT 1), 100, 9999, 0, true),
('Binding (per document)', 'BIND-001', (SELECT id FROM categories WHERE name = 'Stationery Services' LIMIT 1), 250, 9999, 0, true),
('Color Copy (per page)', 'COPY-COLOR-001', (SELECT id FROM categories WHERE name = 'Stationery Services' LIMIT 1), 200, 9999, 0, true)
ON CONFLICT (sku) DO NOTHING;

-- Verify the changes
SELECT id, name, sku, unit_price, quantity, is_service FROM items WHERE is_service = true;
