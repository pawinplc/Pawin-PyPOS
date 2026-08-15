-- PyPOS MySQL Schema
-- University Stationery Inventory & POS System
-- Run: mysql -h127.0.0.1 -upypos -p'PyPosSecret2026!' pypos < local_schema_mysql.sql

-- Users table (web logs in by email)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'staff',
    avatar_url VARCHAR(500),
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Items table (is_service marks service items like printing)
CREATE TABLE IF NOT EXISTS items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    sku VARCHAR(50) UNIQUE NOT NULL,
    category_id INT,
    description TEXT,
    unit_price DECIMAL(10,2) DEFAULT 0.00,
    cost_price DECIMAL(10,2) DEFAULT 0.00,
    quantity INT DEFAULT 0,
    min_stock_level INT DEFAULT 5,
    barcode VARCHAR(50),
    is_active TINYINT(1) DEFAULT 1,
    is_service TINYINT(1) DEFAULT 0,
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_items_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Stock Movements table
CREATE TABLE IF NOT EXISTS stock_movements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    movement_type VARCHAR(20) NOT NULL,
    quantity INT NOT NULL,
    reference VARCHAR(100),
    notes TEXT,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_movements_item FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    CONSTRAINT fk_movements_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Sales table
CREATE TABLE IF NOT EXISTS sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    total_amount DECIMAL(10,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    final_amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(20) DEFAULT 'cash',
    cashier_id INT NOT NULL,
    customer_name VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sales_cashier FOREIGN KEY (cashier_id) REFERENCES users(id)
);

-- Sale Items table
CREATE TABLE IF NOT EXISTS sale_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT NOT NULL,
    item_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_saleitems_sale FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    CONSTRAINT fk_saleitems_item FOREIGN KEY (item_id) REFERENCES items(id)
);

-- User Activity table (audit log)
CREATE TABLE IF NOT EXISTS user_activity (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action VARCHAR(50) NOT NULL,
    ip_address VARCHAR(50),
    user_agent VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_activity_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Debts table (receivables/payables tracking)
CREATE TABLE IF NOT EXISTS debts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    person_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(50),
    type VARCHAR(20) NOT NULL DEFAULT 'receivable',
    amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    remaining_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    description TEXT,
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_items_sku ON items(sku);
CREATE INDEX idx_items_category ON items(category_id);
CREATE INDEX idx_stock_movements_item ON stock_movements(item_id);
CREATE INDEX idx_sales_cashier ON sales(cashier_id);
CREATE INDEX idx_sales_created ON sales(created_at);
CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_debts_type ON debts(type);
CREATE INDEX idx_debts_status ON debts(status);

-- Insert default admin user (password: admin123 - bcrypt hashed)
INSERT INTO users (username, email, password_hash, full_name, role) VALUES
('admin', 'pawinplc2022@gmail.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4Q0y2w5P7.OoGzLe', 'System Admin', 'admin'),
('cashier1', 'cashier1@pawin.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4Q0y2w5P7.OoGzLe', 'Cashier One', 'staff')
ON DUPLICATE KEY UPDATE username = username;

-- Insert sample categories
INSERT INTO categories (name, description) VALUES
('Paper Products', 'A4 paper, notebooks, sticky notes'),
('Writing Instruments', 'Pens, pencils, markers'),
('Office Supplies', 'Staplers, clips, tape, scissors'),
('Files & Folders', 'Binders, file folders, dividers'),
('Electronics', 'Calculators, batteries, USB drives'),
('Stationery Services', 'Printing, scanning, laminating services'),
('Printing & Scanning', 'Document printing and scanning services');

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
('USB Flash Drive 16GB', 'USB001', 5, 180.00, 120.00, 20, 5, '8901234567906')
ON DUPLICATE KEY UPDATE name = name;

-- Insert service items (is_service = true, quantity = 9999 for display)
INSERT INTO items (name, sku, category_id, unit_price, quantity, min_stock_level, is_service) VALUES
('Black & White Printing (per page)', 'PRINT-BW-001', (SELECT id FROM categories WHERE name = 'Stationery Services' LIMIT 1), 50, 9999, 0, 1),
('Color Printing (per page)', 'PRINT-COLOR-001', (SELECT id FROM categories WHERE name = 'Stationery Services' LIMIT 1), 150, 9999, 0, 1),
('Document Scanning (per page)', 'SCAN-001', (SELECT id FROM categories WHERE name = 'Printing & Scanning' LIMIT 1), 30, 9999, 0, 1),
('Laminating A4 (per page)', 'LAMIN-A4-001', (SELECT id FROM categories WHERE name = 'Stationery Services' LIMIT 1), 100, 9999, 0, 1),
('Binding (per document)', 'BIND-001', (SELECT id FROM categories WHERE name = 'Stationery Services' LIMIT 1), 250, 9999, 0, 1),
('Color Copy (per page)', 'COPY-COLOR-001', (SELECT id FROM categories WHERE name = 'Stationery Services' LIMIT 1), 200, 9999, 0, 1)
ON DUPLICATE KEY UPDATE name = name;
