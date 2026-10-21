# Future Features — PyPOS

## 1. Rename `staff` role → `on_duty` ("On Duty") with expanded access

**Goal:** Repurpose the existing `staff` role as `on_duty`. On-duty can see: Dashboard, POS, Analytics, Sales, Debt, Reports (exports incl. Stock Arrivals), Account. NO Inventory (Services/Items/Categories/Stock), Users, or Audit Log.

**Decisions made:**
- Role name: `on_duty` (shown as "On Duty").
- On-duty sees Debt.
- On-duty can export Stock Arrivals (not just Daily/Monthly sales).
- Modify existing `staff` role instead of adding a new role alongside it.

### Backend (`backend/app/`)
- `schemas/schemas.py:7-8` — `UserRole`: `on_duty = "on_duty"` (replace `staff`).
- `schemas/schemas.py:42` — new-user default role → `UserRole.on_duty`.
- `routers/auth.py` — register/update flow automatically; admin-only gates already in place.
- `routers/reports.py:331,382` — stock-arrival PDF/Excel guard: `role != "admin"` → allow `admin` **and** `on_duty` so on-duty can export Stock Arrivals.
- No other backend changes — item/category/stock/user/audit write gates already keep non-admins out.

### Database (live `pypos-db`, on VPS)
```sql
UPDATE users SET role='on_duty' WHERE role='staff';  -- cashier1 → On Duty
```
No schema migration needed (`role` is unconstrained `varchar(20)`).

### Frontend (`frontend/src/`)
- `components/Sidebar.jsx:35` — remove `adminOnly: true` from `/reports` (filter at `:140` then shows it to on-duty).
- `pages/Users.jsx:10,34,40` — new-user default role `'staff'` → `'on_duty'`; `:93` `roleLabels` → `{ admin: 'Administrator', on_duty: 'On Duty' }`; `:279` option `<option value="staff">Staff</option>` → `on_duty` / "On Duty".
- `App.jsx`, `AuthContext.jsx`, `Dashboard.jsx` — no change (non-admins already get staff Dashboard; `/reports` open to any authenticated user).

### Deploy & verify
1. Back up DB: `mysqldump pypos-db | gzip > /root/backups/pypos-db-pre-onduty-<date>.sql.gz`.
2. `rsync backend/` → VPS `/root/pypos-backend/`, restart `pypos-backend.service`.
3. Run the `UPDATE`.
4. Build frontend (`npm run build`), rsync `dist/` → `/home/pawinplc-pypos/htdocs/pypos.pawinplc.com`.
5. Verify as `cashier1@pawin.com/admin123`: staff Dashboard; sidebar has Dashboard, POS, Analytics, Sales, Debt, Reports, Account (no Inventory/Users/Audit); export Daily + Monthly + Stock Arrivals (Excel & PDF) all succeed; `POST /api/items`, `POST /api/stock/in`, `GET /api/audit/logs` → 403. Admin login untouched.

---

## 2. Admin: edit/update user credentials + view password hash (Users page)

**Goal:** On `#/users`, admin can edit a user's email, full name, role, and reset password; and can view the stored password hash (bcrypt).

### Current state (verified)
- Backend **already** has `PUT /api/auth/users/{user_id}` (`backend/app/routers/auth.py:104`) — admin-only, handles `password` → `password_hash` re-hash, supports partial update.
- Frontend `usersAPI.update()` **already** exists (`services/api.js:215`).
- **Missing:** `Users.jsx` has no Edit button/modal; the users list does not return `password_hash` (`UserResponse` in `schemas/schemas.py:55` has no hash field).

### Backend (`backend/app/`)
- `schemas/schemas.py` — add `password_hash: Optional[str] = None` to `UserResponse` (so `GET /api/auth/users` returns it for admin display). Note: `/me` also uses `UserResponse` (returns own hash — acceptable; alternative is a separate admin-only response model).

### Frontend (`frontend/src/pages/Users.jsx`)
- Add **Edit** button (✎) per row alongside Delete.
- Edit modal: email, full name, role dropdown (Admin / On Duty), optional new Password (blank = keep current), prefilled from the row.
- Submit → `usersAPI.update(id, {...})`, toast + reload.
- Add "Password Hash" column to the table (monospace, truncated with toggle/copy, show bcrypt `$2b$...`).
- Move role badge to use `roleLabels` map (instead of hardcoded admin/staff at `:206-210`).

### Deploy & verify
1. Restart `pypos-backend.service` after schema change (no DB migration needed).
2. Deploy built frontend to nginx site root.
3. Verify as admin: edit cashier1's full name/role/email; reset cashier1's password and confirm new password works at login; confirm hash column shows and changes after reset; non-admin hitting `PUT /api/auth/users/2` → 403.
