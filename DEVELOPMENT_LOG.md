# PyPOS Development Log

## Project Overview
Point of Sale (POS) system with:
- **Web Frontend**: React + Vite + Supabase
- **Android App**: Java + OkHttp + Supabase
- **Design**: Matching UI between web and mobile

---

## Web Application (Pawin-PyPOS/frontend)

### Completed Features

#### 1. Supabase API Key Fix
- Fixed invalid/expired API key in `services/supabase.js`
- Updated to new keys provided by user

#### 2. Service Items Feature
- Added `is_service` boolean column to items table
- Service items don't track inventory/stock
- Filtering logic added to:
  - `POS.jsx` - Service items displayed separately
  - `Stock.jsx` - Excluded from stock management
  - `Dashboard.jsx` - Excluded from low stock alerts

#### 3. Services Page
- Created `Services.jsx` for editing service prices
- Added sidebar link (admin only)
- Route added to `App.jsx`

#### 4. Notification System
- Added notification sound using Web Audio API (beep)
- Added popup toast for low stock alerts
- Badge updates for stock alerts
- Sidebar shows dot indicator for pages needing attention

#### 5. Sidebar Enhancements
- Added `alertCount` prop to show red dot on Dashboard/Items/Stock when alerts exist
- CSS animation for pulsing dot indicator

#### 6. UI Updates
- Reduced service card sizes in POS
- Created "More Services" popup for additional services

---

## Android Application (PyPOS)

### Completed Features

#### 1. Java Conversion (from Kotlin)
- Converted all Kotlin code to pure Java
- Created Java models: User, Category, Item, CartItem, Sale, SaleItem, DashboardStats

#### 2. Supabase API Integration
- Created `ApiService.java` with OkHttp for REST API calls
- Created `SupabaseClient.java` for auth/session management
- Fixed login response parsing (access_token at root level, not in session object)
- Added null-safe JSON parsing throughout

#### 3. UI Styling (Matching Web)
- **Poppins Font**: Downloaded and added all weights (Regular, Medium, SemiBold, Bold)
- **Theme Updates** (`themes.xml`):
  - Base theme uses Poppins font
  - Button styles: 6dp corner radius, no caps
  - TextInput: 6dp corner radius, gray 300 border
  - Card style: 12dp corner radius
  - Chip style: 6dp corner radius

#### 4. Icon Library
- Created custom vector drawables matching web themify-icons:
  - `ic_home`, `ic_cart`, `ic_printer`, `ic_receipt`
  - `ic_settings`, `ic_box`, `ic_archive`, `ic_tags`
  - `ic_chart`, `ic_user`, `ic_search`, `ic_edit`
  - `ic_delete`, `ic_check`, `ic_close`, `ic_minus`
  - `ic_add`, `ic_email`, `ic_lock`, `ic_trash`
  - `ic_arrow_left`
- Updated bottom navigation to use custom icons

#### 5. Layout Updates

**Login Page** (`activity_login.xml`):
- Card 12dp corner radius
- Custom TextInputLayout style
- Button 6dp corner radius

**Main Activity** (`activity_main.xml`):
- Bottom navigation 56dp height
- Icon size 24dp
- Proper label visibility

**POS Fragment** (`fragment_pos.xml`):
- Redesigned cart section with:
  - Primary color header bar with cart icon
  - White text for better contrast
  - Elevation 8dp for visibility
  - Shows "(X items)" count
- Items RecyclerView properly constrained
- Services section in HorizontalScrollView

#### 6. Bug Fixes
- Fixed login error handling (invalid response parsing)
- Fixed null pointer exceptions in JSON parsing
- Fixed API response handling for getCurrentUser, getCategories, getItems, getSales

---

## Database Changes

### SQL Script for Service Items
```sql
-- Add is_service column to items table
ALTER TABLE items ADD COLUMN is_service boolean DEFAULT false;

-- Insert service items
INSERT INTO items (name, sku, unit_price, is_service, is_active, category_id)
VALUES 
  ('Black & White Printing', 'SVC-PRINT-BW', 500, true, true, 1),
  ('Document Scanning', 'SVC-SCAN', 1000, true, true, 1),
  ('Binding', 'SVC-BIND', 2000, true, true, 1);
```

---

## Next Steps

### Web
- Test notification sound and popup alerts
- Verify service items display correctly

### Android
- Fix RecyclerView item display issue (may be related to bottom nav height)
- Build and test in Android Studio
- Fix dashboard stats (currently shows zeros)

---

## Files Modified

### Web
- `frontend/src/services/supabase.js` - API key
- `frontend/src/pages/POS.jsx` - Service items logic
- `frontend/src/pages/Services.jsx` - New services page
- `frontend/src/components/Sidebar.jsx` - Alert dot indicator
- `frontend/src/components/Layout.jsx` - Notifications with sound
- `frontend/src/App.css` - Nav dot styling

### Android
- `app/build.gradle` - Dependencies
- `gradle/libs.versions.toml` - Version catalog
- `app/src/main/res/values/themes.xml` - Theme styles
- `app/src/main/res/values/colors.xml` - Colors (already matching web)
- `app/src/main/res/layout/activity_main.xml` - Main layout
- `app/src/main/res/layout/activity_login.xml` - Login layout
- `app/src/main/res/layout/fragment_pos.xml` - POS layout
- `app/src/main/res/layout/fragment_dashboard.xml` - Dashboard layout
- `app/src/main/res/layout/fragment_sales.xml` - Sales layout
- `app/src/main/res/layout/fragment_services.xml` - Services layout
- `app/src/main/res/layout/dialog_edit_price.xml` - Edit price dialog
- `app/src/main/res/layout/dialog_checkout.xml` - Checkout dialog
- `app/src/main/res/layout/item_pos.xml` - Item card
- `app/src/main/res/layout/item_cart.xml` - Cart item
- `app/src/main/res/layout/item_service.xml` - Service item
- `app/src/main/res/menu/bottom_navigation.xml` - Bottom nav menu
- `app/src/main/res/drawable/` - Custom vector icons
- `app/src/main/res/font/` - Poppins font files
- `app/src/main/java/com/dtcteam/pypos/api/ApiService.java` - API service
- `app/src/main/java/com/dtcteam/pypos/api/SupabaseClient.java` - Supabase client
- `app/src/main/java/com/dtcteam/pypos/ui/pos/PosFragment.java` - POS fragment

---

## Known Issues

### Android
- Items not showing in RecyclerView (may need to check adapter or data loading)
- Dashboard stats showing zeros (needs full API implementation)

### Environment
- Cannot build Android app in current environment (JRE only, no JDK)
- Need to build in Android Studio with JDK installed
