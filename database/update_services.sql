-- Mark existing services with is_service = true
UPDATE items SET is_service = true WHERE name ILIKE '%printing%';
UPDATE items SET is_service = true WHERE name ILIKE '%scanning%';
UPDATE items SET is_service = true WHERE name ILIKE '%binding%';

-- Verify the update
SELECT id, name, is_service FROM items WHERE is_service = true;