-- PyPOS Database Setup for Supabase
-- Run this in Supabase SQL Editor

-- Drop existing tables if they exist (optional - remove if you have data)
DROP TABLE IF EXISTS sale_items CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS stock_movements CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    full_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create categories table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create items table
CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    sku VARCHAR(50) UNIQUE NOT NULL,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    description TEXT,
    unit_price DECIMAL(10,2) DEFAULT 0.00,
    cost_price DECIMAL(10,2) DEFAULT 0.00,
    quantity INTEGER DEFAULT 0,
    min_stock_level INTEGER DEFAULT 5,
    barcode VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stock movements table
CREATE TABLE stock_movements (
    id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment')),
    quantity INTEGER NOT NULL,
    reference VARCHAR(100),
    notes TEXT,
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sales table
CREATE TABLE sales (
    id SERIAL PRIMARY KEY,
    total_amount DECIMAL(10,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    final_amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(20) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'other')),
    cashier_id UUID REFERENCES users(id),
    customer_name VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sale items table
CREATE TABLE sale_items (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL REFERENCES items(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL
);

-- Create indexes
CREATE INDEX idx_items_sku ON items(sku);
CREATE INDEX idx_items_category ON items(category_id);
CREATE INDEX idx_stock_movements_item ON stock_movements(item_id);
CREATE INDEX idx_sales_cashier ON sales(cashier_id);
CREATE INDEX idx_sales_created ON sales(created_at);
CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);

-- Disable Row Level Security for all tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE items DISABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements DISABLE ROW LEVEL SECURITY;
ALTER TABLE sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items DISABLE ROW LEVEL SECURITY;

-- Insert sample categories
INSERT INTO categories (name, description) VALUES
('Paper Products', 'A4 paper, notebooks, sticky notes'),
('Writing Instruments', 'Pens, pencils, markers'),
('Office Supplies', 'Staplers, clips, tape, scissors'),
('Files & Folders', 'Binders, file folders, dividers'),
('Electronics', 'Calculators, batteries, USB drives');

-- Insert sample items
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
('USB Flash Drive 16GB', 'USB001', 5, 180.00, 120.00, 20, 5, '8901234567906');

-- Verify tables
SELECT 'Tables created successfully!' as status;
SELECT table_name FROM pg_tables WHERE schemaname = 'public';
