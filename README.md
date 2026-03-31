# PyPOS - University Stationery Inventory & POS System

A modern, responsive inventory management and point-of-sale system designed specifically for university stationery stores.

![PyPOS Dashboard](https://img.shields.io/badge/React-Vite-brightgreen) ![Supabase](https://img.shields.io/badge/Database-Supabase-blue) ![License](https://img.shields.io/badge/License-MIT-green)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
  - [Prerequisites](#prerequisites)
  - [Supabase Setup](#supabase-setup)
  - [Frontend Setup](#frontend-setup)
- [Database Schema](#database-schema)
- [Key Terms](#key-terms)
- [Features Guide](#features-guide)
  - [Dashboard](#dashboard)
  - [Point of Sale (POS)](#point-of-sale-pos)
  - [Items Management](#items-management)
  - [Categories Management](#categories-management)
  - [Stock Management](#stock-management)
  - [Sales History](#sales-history)
  - [Reports](#reports)
  - [User Management](#user-management)
- [Import/Export](#importexport)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)

---

## Features

- **Dashboard** - Real-time stats, recent sales, low stock alerts
- **Point of Sale (POS)** - Fast checkout with barcode support
- **Items Management** - Add, edit, delete products with SKU tracking
- **Categories Management** - Organize products by category
- **Stock Management** - Track stock in/out/adjustments
- **Sales History** - View all transactions with receipt details
- **Reports** - Daily/monthly sales, stock arrivals
- **User Management** - Admin and staff roles
- **CSV/XLS Import** - Bulk upload items and categories
- **Responsive Design** - Works on desktop and mobile
- **Multiple Currency Support** - Configured for TSH (Tanzanian Shilling)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18 + Vite |
| **Styling** | Custom CSS (InApp Design) |
| **Database** | Supabase (PostgreSQL) |
| **Authentication** | Supabase Auth |
| **Icons** | Tabler Icons |
| **Excel/CSV** | xlsx library |

---

## Quick Start

### Prerequisites

1. Node.js 18+ installed
2. Supabase account (free tier available)

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up
2. Click **New Project**
3. Enter project details:
   - **Name**: PyPOS Stationery
   - **Database Password**: (remember this!)
   - **Region**: Choose closest to you
4. Wait for project to be created (~2 minutes)

### Step 2: Setup Database Tables

Go to **SQL Editor** in your Supabase dashboard and run the following SQL:

```sql
-- ============================================
-- STEP 1: Disable Row Level Security
-- ============================================
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.users TO authenticated, anon, service_role;
GRANT ALL ON public.categories TO authenticated, anon, service_role;
GRANT ALL ON public.items TO authenticated, anon, service_role;
GRANT ALL ON public.stock_movements TO authenticated, anon, service_role;
GRANT ALL ON public.sales TO authenticated, anon, service_role;

-- ============================================
-- STEP 2: Create sale_items table
-- ============================================
CREATE TABLE IF NOT EXISTS public.sale_items (
  id SERIAL PRIMARY KEY,
  sale_id INTEGER NOT NULL,
  item_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(12, 2) NOT NULL,
  subtotal DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.sale_items DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.sale_items TO authenticated, anon, service_role;

-- ============================================
-- STEP 3: Insert Sample Categories
-- ============================================
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
-- STEP 4: Insert Sample Items (Prices in TSH)
-- ============================================
INSERT INTO public.items (name, sku, category_id, unit_price, cost_price, quantity, min_stock_level, barcode) VALUES
-- Pens & Pencils
('Blue Ballpoint Pen (10 pack)', 'PEN-001', 1, 3500, 1800, 150, 20, '8901234567890'),
('Black Gel Pen (5 pack)', 'PEN-002', 1, 4500, 2200, 120, 15, '8901234567891'),
('HB Pencil (12 pack)', 'PEN-003', 1, 2500, 1200, 200, 30, '8901234567892'),
('Highlighters Set (6 colors)', 'PEN-004', 1, 5500, 2800, 80, 10, '8901234567893'),
('Permanent Marker (Black)', 'PEN-005', 1, 2800, 1400, 90, 15, '8901234567894'),

-- Notebooks
('A5 Exercise Book (100 pages)', 'NB-001', 2, 1800, 900, 300, 50, '8901234568001'),
('A4 Spiral Notebook', 'NB-002', 2, 3500, 1800, 150, 25, '8901234568002'),
('Grid Notebook A4', 'NB-003', 2, 4200, 2100, 100, 20, '8901234568003'),

-- Paper Products
('A4 Paper (500 sheets)', 'PAP-001', 3, 12000, 6500, 100, 20, '8901234569001'),
('Sticky Notes 3x3 (12 pack)', 'PAP-002', 3, 4500, 2200, 200, 40, '8901234569002'),

-- Office Supplies
('Paper Clips (100 pack)', 'OFF-001', 4, 2200, 1100, 250, 40, '8901234570001'),
('Stapler with staples', 'OFF-002', 4, 6500, 3200, 75, 15, '8901234570002'),

-- Technology
('USB Flash Drive 32GB', 'TEC-001', 8, 19900, 12000, 50, 10, '8901234574001'),
('AA Batteries (8 pack)', 'TEC-003', 8, 8500, 4500, 100, 20, '8901234574003');
```

### Step 3: Create Authenticated User

1. Go to **Authentication** in Supabase dashboard
2. Click **Add user** (or **Create user**)
3. Enter email and password:
   - **Email**: `admin@pypos.com`
   - **Password**: `admin123`
4. Click **Create user**
5. Copy the **User ID** (UUID) from the user list

### Step 4: Configure Frontend

Create or update `frontend/.env`:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

Get these values from: **Settings > API** in your Supabase dashboard.

### Step 5: Install and Run

```bash
cd frontend
npm install
npm run dev
```

### Step 6: Access the App

Open your browser to: **http://localhost:5173**

Login with your created user credentials.

---

## Database Schema

```
┌─────────────────┐
│    categories    │
├─────────────────┤
│ id (PK)         │
│ name            │
│ description     │
│ created_at      │
└────────┬────────┘
         │ 1:N
         ▼
┌─────────────────┐
│      items       │
├─────────────────┤
│ id (PK)         │
│ category_id (FK) │
│ sku (unique)     │  ◄── SKU = Stock Keeping Unit
│ name             │
│ unit_price       │  ◄── Price in TSH
│ cost_price       │
│ quantity         │  ◄── Current stock
│ min_stock_level  │  ◄── Low stock alert threshold
│ barcode          │
│ description      │
│ is_active        │
│ created_at       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│   sales         │     │   sale_items    │
├─────────────────┤     ├─────────────────┤
│ id (PK)         │────▶│ sale_id (FK)    │
│ cashier_id      │     │ item_id (FK)    │
│ total_amount    │     │ quantity        │
│ discount_amount │     │ unit_price      │
│ final_amount   │     │ subtotal        │
│ payment_method │     └─────────────────┘
│ created_at     │
└─────────────────┘

┌─────────────────────┐
│  stock_movements   │
├─────────────────────┤
│ id (PK)             │
│ item_id (FK)        │
│ movement_type       │  ◄── 'in', 'out', 'adjustment'
│ quantity            │
│ reference           │
│ notes              │
│ user_id            │
│ created_at         │
└─────────────────────┘
```

---

## Key Terms

### SKU (Stock Keeping Unit)
**SKU** is a unique identifier assigned to each product in your inventory. 

Examples:
- `PEN-001` - Blue Ballpoint Pen
- `NB-002` - A4 Spiral Notebook
- `PAP-001` - A4 Paper Pack

Benefits of SKUs:
- Easy product identification
- Fast search and lookup
- Inventory tracking
- Barcode integration

### TSH (Tanzanian Shilling)
The default currency. Configure in code by changing the currency symbol displayed throughout the app.

### Categories
Top-level organization for items:
- Pens & Pencils
- Notebooks
- Paper Products
- Office Supplies
- Art Supplies
- Files & Folders
- Desk Accessories
- Technology

---

## Features Guide

### Dashboard

The main overview page showing:
- **Total Items** - Number of products in inventory
- **Low Stock** - Items below minimum stock level
- **Today's Sales** - Total sales amount for today
- **Transactions** - Number of sales today
- **Recent Sales** - Last 5 transactions
- **Low Stock Alert** - Items that need restocking
- **Quick Actions** - Shortcuts to common tasks

### Point of Sale (POS)

1. **Select Category** - Filter items by category
2. **Search Items** - Find by name, SKU, or barcode
3. **Click Item** - Add to cart
4. **Adjust Quantity** - Use +/- buttons or click quantity
5. **Complete Sale** - Click checkout button

Cart features:
- Edit item quantities
- Remove items
- Clear entire cart
- Auto-calculate totals

### Items Management

**Add Item Form Fields:**
| Field | Required | Description |
|-------|----------|-------------|
| Name | Yes | Product name |
| SKU | Yes | Unique stock keeping unit code |
| Category | No | Product category |
| Unit Price | Yes | Selling price (TSH) |
| Cost Price | No | Purchase price (TSH) |
| Quantity | No | Initial stock count |
| Min Stock Level | No | Low stock alert threshold |
| Barcode | No | Product barcode/SKU |
| Description | No | Additional notes |

**Bulk Import:**
1. Click "Import CSV/XLS"
2. Select your file (.csv or .xlsx)
3. Preview data
4. Click "Import"

### Categories Management

Simple category CRUD operations:
- Add new categories
- Edit existing categories
- Delete categories (if no items linked)

**Bulk Import Categories:**
- Upload CSV/XLS with columns: `name`, `description`

### Stock Management

Three types of stock operations:

1. **Stock In** - Add new inventory
   - Select item
   - Enter quantity
   - Add reference (e.g., PO number)
   - Optional notes

2. **Stock Out** - Remove inventory
   - Select item
   - Enter quantity
   - Add reference
   - Optional notes

3. **Adjust Stock** - Correct inventory counts
   - Set new exact quantity
   - Add notes explaining adjustment

### Sales History

View all past transactions:
- Receipt number
- Date and time
- Cashier name
- Items purchased
- Total amounts
- Click to view full receipt

### Reports

Generate reports for:
- **Daily Sales** - Today's transactions
- **Monthly Sales** - Monthly breakdown
- **Stock Arrivals** - Inventory received

Reports show:
- Transaction counts
- Total revenue
- Average transaction value
- Stock movement history

### User Management

**Admin Features:**
- View all users
- Add new users
- Set user roles (Admin/Staff)
- Assign email and password

**Role Permissions:**
| Feature | Admin | Staff |
|---------|-------|-------|
| Dashboard | ✓ | ✓ |
| POS | ✓ | ✓ |
| Items | ✓ | ✗ |
| Categories | ✓ | ✗ |
| Stock | ✓ | ✗ |
| Sales History | ✓ | ✓ |
| Reports | ✓ | ✓ |
| User Management | ✓ | ✗ |

---

## Import/Export

### Import Items (CSV/XLS)

Create a file with these columns:
```csv
name,sku,category,unit_price,cost_price,quantity,min_stock_level,barcode,description
Blue Pen,PEN-001,Pens & Pencils,3500,1800,100,10,123456789,High quality pen
```

**Tips:**
- Category names must match exactly (case-sensitive)
- Prices in TSH
- Keep SKU unique

### Import Categories (CSV/XLS)

Create a file with these columns:
```csv
name,description
Pens & Pencils,All types of pens and pencils
Notebooks,Exercise books and notebooks
```

### Export Data

Click "Export" button to download:
- All items as Excel file
- Includes all columns

---

## Project Structure

```
PyPOS/
├── database/
│   ├── supabase_setup.sql     # Complete setup script
│   ├── create_sale_items.sql   # Sale items table
│   └── disable_rls.sql        # Security settings
│
└── frontend/
    ├── public/
    │   └── favicon.svg
    │
    ├── src/
    │   ├── components/
    │   │   ├── Layout.jsx     # Main layout with sidebar
    │   │   └── Sidebar.jsx    # Navigation sidebar
    │   │
    │   ├── context/
    │   │   └── AuthContext.jsx # Authentication state
    │   │
    │   ├── pages/
    │   │   ├── Dashboard.jsx  # Main dashboard
    │   │   ├── POS.jsx        # Point of Sale
    │   │   ├── Items.jsx      # Items management
    │   │   ├── Categories.jsx  # Categories management
    │   │   ├── Stock.jsx      # Stock management
    │   │   ├── Sales.jsx      # Sales history
    │   │   ├── Reports.jsx    # Reports page
    │   │   ├── Users.jsx      # User management
    │   │   └── Login.jsx      # Login page
    │   │
    │   ├── services/
    │   │   └── supabase.js    # Supabase API client
    │   │
    │   ├── App.jsx           # Main app component
    │   ├── App.css           # Global styles
    │   ├── index.css         # CSS reset
    │   └── main.jsx          # Entry point
    │
    ├── index.html
    ├── package.json
    └── .env                 # Environment variables
```

---

## Troubleshooting

### Common Issues

**1. "Failed to load data" error**
- Check Supabase URL and key in `.env`
- Ensure tables exist in database
- Check browser console for detailed errors

**2. Can't add/edit items**
- Make sure RLS is disabled
- Run the RLS disable SQL again

**3. Login not working**
- Create user in Supabase Authentication
- Check email/password are correct
- Try clearing browser cache

**4. Currency showing wrong symbol**
- Search for "฿" or "TSH" in code
- Replace with desired currency symbol

**5. Import not working**
- Check file format (CSV/XLS)
- Ensure column names match exactly
- No empty rows in data

### Getting Help

1. Check browser console (F12)
2. Check Supabase dashboard for errors
3. Review browser network tab
4. Verify environment variables

---

## License

This project is open source and available under the MIT License.

---

## Credits

- **Design**: InApp Dashboard Template
- **Icons**: Tabler Icons
- **Database**: Supabase
- **Font**: Poppins (Google Fonts)

---

**Version**: 1.0.0  
**Last Updated**: March 2026
