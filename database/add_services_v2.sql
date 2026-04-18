-- Step 1: Add service categories first
INSERT INTO categories (name, description) VALUES
('Stationery Services', 'Printing, scanning, laminating services'),
('Printing & Scanning', 'Document printing and scanning services')
ON CONFLICT DO NOTHING;

-- Step 2: Get the correct category IDs
SELECT id, name FROM categories WHERE name LIKE '%Stationery%' OR name LIKE '%Printing%';

-- Step 3: Add service items using the correct IDs (replace X with actual IDs from step 2)
-- Example (adjust IDs based on step 2 results):
-- INSERT INTO items (name, sku, category_id, unit_price, quantity, min_stock_level, is_service) VALUES
-- ('Black & White Printing (per page)', 'PRINT-BW-001', X, 50, 9999, 0, true);
