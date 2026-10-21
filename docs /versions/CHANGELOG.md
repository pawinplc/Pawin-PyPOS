# PyPOS Version History

All notable releases of Pawin PyPOS are recorded here.
Newest release first.

---

## 1.1.0.DTCPyPoS — 2026-10-21

### Added

- Branded PDF report exports (logo, **PAWIN PYPOS**, "Premium Stationery Inventory
  System", report title, and report date).
- Item-level Daily and Monthly sales reports with cost, profit, and margin.
- Item-level Stock Arrival reports.
- Backend Excel exports for Daily Sales, Monthly Sales, and Stock Arrivals.
- Backend report endpoints for API/mobile clients:
  - `GET /api/reports/daily-sales/pdf`
  - `GET /api/reports/daily-sales/excel`
  - `GET /api/reports/monthly-sales/pdf`
  - `GET /api/reports/monthly-sales/excel`
  - `GET /api/reports/stock-arrival/pdf`
  - `GET /api/reports/stock-arrival/excel`
- Version history documentation (`docs /versions/CHANGELOG.md`).
- FastAPI branding and logo on the Account → About PyPOS card.

### Changed

- Monthly sales exports now include **all months and actual sale rows**, not just
  today's sales.
- Sales API cap removed for Reports, Analytics, and Admin Dashboard (requests up
  to 10,000 sales).
- Admin Dashboard KPI cards are now responsive: 1 column on phones, 2 on
  tablets/small laptops, 4 on wide screens.
- POS layout: items on the left, cart on the right; cart reaches the right edge.
- POS mobile cart is now a floating action button with a bottom-sheet cart.
- Analytics is full width, uses POS-style data fetching, and no longer animates
  charts or page entrances.
- Skeleton loaders now mirror the layout of the real content.
- Dialog heights are content-based instead of always stretching to 85% of the
  viewport; long forms scroll inside the dialog with pinned header/footer.
- Add New Item form fields now align in two columns correctly.
- CORS now exposes `Content-Disposition` so exported filenames are preserved.
- Backend and frontend versions aligned to **1.1.0.DTCPyPoS** (npm package
  metadata stays `1.1.0` because npm requires valid semver).

### Fixed

- Monthly PDF/bundle exports showing empty data because they filtered
  `dailySales` (today only) by month.
- Reports, Analytics, and Admin Dashboard only seeing the first 100 sales.
- Stock Arrival report `date` variable shadowing crash.
- Daily/Monthly PDF month-summary rows overlapping in the table layout.
- Dashboard KPI cards collapsing to ~60px wide on mobile.
- Bootstrap modal `height: 100%` leaking through and stretching dialogs.
- Bootstrap grid gutters conflicting with the custom grid and stacking
  two-column form fields.

### Deployed

- Backend files deployed to `/root/pypos-backend` and `pypos-backend.service`
  restarted. Backups stored in `/root/backups/pypos/`.

---

## 1.0.0 — Initial release

- React + Vite frontend with FastAPI + MySQL backend.
- Dashboard, POS, Analytics, Sales, Debt, Reports, Inventory, Users, Audit Log,
  and Account pages.
- Role-based access (`admin`, `on_duty`).
- Client-side PDF exports and Excel exports.
