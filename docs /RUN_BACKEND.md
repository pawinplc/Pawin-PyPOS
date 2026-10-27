# Running the PyPOS Backend Locally

This guide explains how to start the **Pawin PyPOS backend** (FastAPI + MySQL)
on your own machine, and how to point the **frontend dev server** at it.

The production API remains `https://pypos.pawinplc.com` — only `npm run dev`
uses the local backend. A production build (`npm run build`) is untouched.

---

## 1. What you need

| Requirement | Notes |
|---|---|
| Python 3.10+ | `python --version` |
| MySQL 8.x | Local server, or access to an existing PyPOS database |
| Node.js 18+ | Only needed for the frontend |
| Git | Already used to clone the repo |

All backend commands below are run from the `backend/` folder.

```bash
cd Pawin-PyPOS/backend
```

---

## 2. Create the environment file

The backend reads `backend/.env` (loaded by `python-dotenv`).

```bash
cp .env.example .env
```

Then edit `backend/.env`:

```dotenv
# Local development database (SQLite file next to the backend folder)
DATABASE_URL=sqlite:///./pypos_dev.db

# Server binding (the guide uses 8001 for local development)
HOST=0.0.0.0
PORT=8001
```

A relative `sqlite:///./pypos_dev.db` is resolved from the directory you start
uvicorn in, so always start it from `backend/`. If you prefer an absolute path:

```dotenv
DATABASE_URL=sqlite:////absolute/path/to/backend/pypos_dev.db
```

> **Do not commit `.env`.** It is git-ignored and may contain credentials.
> `*.db` files are git-ignored too.

### Port choice

Use **8001** for local development. This is the port the deployed backend also
uses, so behaviour matches production. `start_server.bat` and
`python app/main.py` still default to **8000** — pass `--port 8001` explicitly
if you want to follow this guide.

---

## 3. Create the local database (first time only)

Local development uses **SQLite** — no database server or admin rights needed.
The schema comes from the SQLAlchemy models, so it matches what the app expects
at runtime. The seed script is safe to re-run; it never overwrites existing
rows.

### 3.1 Create the tables and seed data

```bash
# from backend/, with the venv active
python scripts/init_sqlite.py
```

Output looks like:

```
Database: sqlite:////.../backend/pypos_dev.db
Tables: categories, debts, items, sale_items, sales, stock_movements, user_activity, user_sessions, users
Seed complete: 2 users, 7 categories, 23 items

Master admin: master@pawinplc.com (username: admin) / admin123
Cashier:      cashier1 / admin123
```

This creates `backend/pypos_dev.db` with:

- all tables, including `user_sessions`
- 2 users, 7 categories, 17 products and 6 service items

### 3.2 Default logins

| Login | Password |
|---|---|
| `admin` (username) / `master@pawinplc.com` | `admin123` |
| `cashier1` (username) | `admin123` |

> The seeded `admin` account has the **Master Admin** role.
> `pawinplc2022@gmail.com` is intentionally left free so the master admin can
> create a normal Admin with it.

Role hierarchy (highest first):

| Role | Access |
|---|---|
| `master_admin` | Everything, including **Users** and **Audit Log** |
| `admin` | Everything except Users and Audit Log |
| `on_duty` | POS, sales, reports, inventory viewing |

See [`ROLES_AND_PERMISSIONS.md`](./ROLES_AND_PERMISSIONS.md) for accounts,
permissions, audit behaviour and deployment steps.

> Change the default passwords before using the app for anything real.

### 3.3 Reset the local database

To start over, stop the backend, delete the file, and re-run the seed script:

```bash
rm pypos_dev.db
python scripts/init_sqlite.py
```

### 3.4 Using MySQL instead (optional)

Production uses MySQL. If you want a local MySQL database instead of SQLite,
create the database/user, then load the schema:

```sql
CREATE DATABASE pypos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'pypos'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON pypos.* TO 'pypos'@'localhost';
FLUSH PRIVILEGES;
```

```bash
mysql -h 127.0.0.1 -u pypos -p pypos < ../database/local_schema_mysql.sql
mysql -h 127.0.0.1 -u pypos -p pypos < migrations/001_user_sessions.sql
mysql -h 127.0.0.1 -u pypos -p pypos < migrations/002_inventory_audit.sql
mysql -h 127.0.0.1 -u pypos -p pypos < migrations/003_master_admin_role.sql
mysql -h 127.0.0.1 -u pypos -p pypos < migrations/004_master_admin_email.sql
mysql -h 127.0.0.1 -u pypos -p pypos -e \
  "UPDATE users SET role='on_duty' WHERE role='staff';"
```

Then set `DATABASE_URL=mysql+pymysql://pypos:password@127.0.0.1:3306/pypos`
in `backend/.env` and restart the backend.

> The seed SQL uses the `staff` role, but the API expects `on_duty`; that is why
> the `UPDATE` above is needed.

---

## 4. Install dependencies

### Linux / macOS

```bash
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### Windows (PowerShell / CMD)

```bat
python -m venv venv
venv\Scripts\activate.bat
pip install --upgrade pip
pip install -r requirements.txt
```

Or simply run `setup_backend.bat`, which creates the venv and installs
everything for you.

---

## 5. Start the backend

With the virtual environment active:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

| URL | Purpose |
|---|---|
| `http://localhost:8001/` | Service info + version |
| `http://localhost:8001/health` | Health check → `{"status":"healthy"}` |
| `http://localhost:8001/docs` | Interactive Swagger UI |
| `http://localhost:8001/redoc` | ReDoc API reference |

Stop the server with `Ctrl+C`.

### Using an IDE / Windows helper

`start_server.bat` activates the venv and runs uvicorn, but on port **8000**.
If you use it, also set the frontend dev URL to `http://localhost:8000`.

`python app/main.py` also hard-codes port `8000` and `reload=True`.

---

## 6. Verify the API

Health check:

```bash
curl http://localhost:8001/health
# {"status":"healthy"}
```

Log in and get a token:

```bash
TOKEN=$(curl -s -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"master@pawinplc.com","password":"admin123"}' | python -c "import sys,json;print(json.load(sys.stdin)['access_token'])")
```

Use the token:

```bash
curl http://localhost:8001/api/items -H "Authorization: Bearer $TOKEN" | head
```

### Receipt PDFs

Each sale can be downloaded as an 80 mm thermal receipt:

```bash
curl -L "http://localhost:8001/api/sales/42/receipt.pdf" \
  -H "Authorization: Bearer $TOKEN" \
  -o receipt_00042.pdf
```

The receipt logo lives at `backend/assets/receipt_logo.png`. Branding is
configurable in `.env`:

```dotenv
RECEIPT_STORE_NAME=PAWIN Stationery
RECEIPT_STORE_PHONE=+255 664 834 083
RECEIPT_CURRENCY=TSH
RECEIPT_FOOTER=Thank you for your purchase!
RECEIPT_POWERED_BY=Powered by PyPOS
```

---

## 7. Point the frontend dev server at the local backend

The frontend reads `VITE_API_URL` from Vite environment files
(`frontend/src/services/api.js`).

Because production and development need different URLs, the project uses
mode-specific env files:

| File | Used by | Value |
|---|---|---|
| `frontend/.env` | Production build (`npm run build`) | `https://pypos.pawinplc.com` |
| `frontend/.env.development` | Dev server (`npm run dev`) | `http://localhost:8001` |

`frontend/.env.development` is already committed with:

```dotenv
VITE_API_URL=http://localhost:8001
```

Vite loads `.env` first, then overlays `.env.[mode]`. Since `dev` uses
`mode=development`, **only the dev server uses the local backend**. A normal
production build keeps using the production URL.

### Start the frontend

```bash
cd ../frontend
npm install        # first time only
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

### If you run the backend on port 8000

Edit `frontend/.env.development`:

```dotenv
VITE_API_URL=http://localhost:8000
```

Restart `npm run dev` — Vite only reads env files at startup.

---

## 8. Troubleshooting

### `ModuleNotFoundError: No module named 'app'`

Run uvicorn from the `backend/` directory (the folder that contains `app/`),
with the venv activated.

### Database errors

**SQLite (default)**

- Check `DATABASE_URL` in `backend/.env` starts with `sqlite:///`.
- If you used a relative path, start uvicorn from `backend/` — otherwise the
  file is created somewhere else.
- `no such table: users` → run `python scripts/init_sqlite.py`.
- Delete `pypos_dev.db` and re-run the seed script to reset.

**MySQL (optional)**

- Check all parts of `DATABASE_URL` (`user:password@host:port/database`).
- Confirm MySQL is running: `mysqladmin -h 127.0.0.1 -u pypos -p ping`.
- Use the `mysql+pymysql://…` driver, not PostgreSQL.
- If the database server is remote, make sure port `3306` is reachable.

### `Table 'pypos.user_sessions' doesn't exist`

- SQLite: run `python scripts/init_sqlite.py` (it creates all tables).
- MySQL: run `backend/migrations/001_user_sessions.sql` (section 3.4).

### Login fails / user has no permissions

The API expects roles `master_admin`, `admin` or `on_duty`. For MySQL, run the update in
section 3.4. For SQLite, re-run `scripts/init_sqlite.py` or delete the database
and seed it again.

### Frontend still calls `pypos.pawinplc.com` in dev

- Make sure you started with `npm run dev`, not a production preview.
- Confirm `frontend/.env.development` exists and contains `VITE_API_URL`.
- Restart the dev server after changing env files.
- Hard-refresh the browser.

### CORS errors

The backend allows all origins in development (`allow_origins=["*"]`). If you
still see CORS errors, check that the request is going to the backend you
actually started, and that the port matches the frontend env file.

### Receipt download returns 404

The route is `GET /api/sales/{sale_id}/receipt.pdf`. The sale must exist, and
the request must include a valid Bearer token. Check
`http://localhost:8001/docs` to confirm the endpoint is registered.

### Port already in use

```bash
# Linux / macOS
lsof -i :8001

# Windows
netstat -ano | findstr :8001
```

Stop the other process or start the backend on another port and update
`frontend/.env.development` to match.
