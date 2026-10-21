# PyPOS Backend — Run Guide

FastAPI + SQLAlchemy + MySQL backend for the PyPOS system.

- App entry point: `app/main.py` (`app.main:app`)
- Default local port: `8001` (from `.env`); `python app/main.py` hardcodes `8000`
- Interactive API docs: `http://localhost:8001/docs`

---

## 1. Prerequisites

| Requirement | Version / Notes |
|---|---|
| Python | 3.11+ (project venv uses 3.12) |
| MySQL / MariaDB | 8.x / 10.x, reachable from the backend |
| Git | optional |

Check Python:

```bash
python3 --version
```

---

## 2. Configure environment

The backend reads `backend/.env` (loaded by `python-dotenv`).

```bash
cd backend
cp .env.example .env   # then edit values
```

`.env` format:

```env
# MySQL connection string (SQLAlchemy format)
DATABASE_URL=mysql+pymysql://USER:PASSWORD@HOST:3306/DATABASE

# Server bind address / port
HOST=0.0.0.0
PORT=8001
```

> The database user needs `CREATE`, `ALTER`, `SELECT`, `INSERT`, `UPDATE`, `DELETE`
> on the target schema if the app/import scripts create tables.

---

## 3. Install dependencies

Linux / macOS:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

Windows (or just run the provided script):

```bat
setup_backend.bat
```

`requirements.txt` installs: FastAPI, Uvicorn, SQLAlchemy, PyMySQL,
python-jose, passlib/bcrypt, pydantic, python-multipart, reportlab, openpyxl.

---

## 4. Run the server

### Development (auto-reload)

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

Windows:

```bat
start_server.bat
```

(or `venv\Scripts\activate` then the same `uvicorn` command)

### Production (no reload, multiple workers)

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8001 --workers 4
```

> If you change `PORT` in `.env`, restart the server. `python app/main.py`
> ignores `PORT` and uses `8000`, so prefer the `uvicorn` command above.

---

## 5. Verify it is running

```bash
curl http://localhost:8001/health
# {"status":"healthy"}

curl http://localhost:8001/
# {"message":"PyPOS API - University Stationery System","version":"1.0.0"}
```

Open Swagger UI: <http://localhost:8001/docs>

Log in and grab a token:

```bash
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your-password"}'
```

Use it on protected routes:

```bash
curl http://localhost:8001/api/sales?limit=100 \
  -H "Authorization: Bearer <TOKEN>"
```

---

## 6. Report endpoints

The backend can generate reports server-side (PDF via ReportLab, Excel via openpyxl):

| Endpoint | Format | Scope |
|---|---|---|
| `GET /api/reports/daily-sales/pdf` | PDF | one day (`?date=YYYY-MM-DD`, default today) |
| `GET /api/reports/daily-sales/excel` | XLSX | one day |
| `GET /api/reports/monthly-sales/pdf` | PDF | one month (`?year=YYYY&month=M`) |
| `GET /api/reports/monthly-sales/excel` | XLSX | one month |
| `GET /api/reports/stock-arrival/pdf` | PDF | date range (`?start_date=&end_date=`) |
| `GET /api/reports/stock-arrival/excel` | XLSX | date range |

All require a Bearer token. Stock-arrival routes are restricted to
`admin` and `on_duty` roles.

**Frontend usage:** the Excel exports download from the backend — the
buttons in `frontend/src/pages/Reports.jsx` call `reportsAPI` in
`frontend/src/services/api.js`, which fetches the file as a blob (with the
Bearer token) and saves it.

The **PDF exports remain generated in the browser** with `jspdf` +
`jspdf-autotable` so they keep the original branded header (logo,
"PAWIN PYPOS", tagline and report date). The backend PDF endpoints are also
branded and available for API/mobile clients. The "Export All (Bundle)"
option builds a combined workbook client-side.

If you later want PDFs served by the backend too, deploy the new
`app/routers/reports.py` and upload `assets/logo1.png`; the output is designed
to match the browser version.

Monthly exports:
- no params → **all months** in one report (matches the on-screen list)
- `?year=2026` → whole year
- `?year=2026&month=10` → a single month

Daily exports accept `?date=YYYY-MM-DD` (defaults to the server's today).
Stock-arrival exports accept optional `?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`.

### Example: download the monthly Excel from the backend

```bash
curl -L "http://localhost:8001/api/reports/monthly-sales/excel?year=2026&month=10" \
  -H "Authorization: Bearer <TOKEN>" \
  -o monthly_sales_2026_10.xlsx
```

### Example: download the stock-arrival PDF

```bash
curl -L "http://localhost:8001/api/reports/stock-arrival/pdf?start_date=2026-09-01&end_date=2026-09-30" \
  -H "Authorization: Bearer <TOKEN>" \
  -o stock_arrivals.pdf
```

---

## 7. Data import (optional, one-off)

Imports items and baseline stock from an Excel workbook:

```bash
cd backend
source venv/bin/activate

# dry run (default)
venv/bin/python scripts/import_excel.py --xlsx /path/to/Stock_and_Sales_Records.xlsx

# actually write to the DB
venv/bin/python scripts/import_excel.py --xlsx /path/to/Stock_and_Sales_Records.xlsx --execute
```

The script is idempotent — existing SKUs are skipped.

---

## 8. Deploying on a VPS (systemd example)

Create `/etc/systemd/system/pypos-backend.service`:

```ini
[Unit]
Description=PyPOS Backend (FastAPI)
After=network.target mysql.service

[Service]
User=www-data
WorkingDirectory=/var/www/Pawin-PyPOS/backend
EnvironmentFile=/var/www/Pawin-PyPOS/backend/.env
ExecStart=/var/www/Pawin-PyPOS/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8001 --workers 4
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now pypos-backend
sudo systemctl status pypos-backend
sudo journalctl -u pypos-backend -f
```

Then put nginx (or another reverse proxy) in front and forward `/api` to
`http://127.0.0.1:8001`. Example:
```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8001/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    client_max_body_size 20m;
}
```

### Applying backend updates

When backend code changes (e.g. `app/routers/reports.py`, `app/main.py`):

```bash
# copy the changed files to the server (plus assets/ if missing), then:
sudo systemctl restart pypos-backend
sudo systemctl status pypos-backend
curl https://your-domain.com/api/health
```

The reports API must be redeployed for the new server-side Excel/PDF
downloads (item-level rows with profit/margin) to take effect. Until then the
frontend will still receive files from the older backend report code.

Branded PDFs use `backend/assets/logo1.png`; make sure that file is uploaded
alongside the code, otherwise the PDFs fall back to a text-only header.

---

## 9. Troubleshooting

| Symptom | Fix |
|---|---|
| `ModuleNotFoundError: No module named 'app'` | Run `uvicorn` from the `backend/` directory. |
| `Can't connect to MySQL server` | Check `DATABASE_URL` host/port, MySQL service, firewall, and user grants. |
| `Access denied for user` | Wrong DB credentials or the user lacks privileges on that schema. |
| `bcrypt` / `passlib` error | Keep pinned versions (`bcrypt==4.0.1`); reinstall `pip install -r requirements.txt`. |
| Port already in use | `lsof -i :8001` then stop the process, or change `PORT`. |
| CORS errors in browser | `app/main.py` currently allows all origins; check the proxy forwards headers correctly. |
| Uploads not served | `backend/uploads/` is mounted at `/uploads`; ensure the directory is writable. |

---

## 10. Project layout

```
backend/
├── app/
│   ├── main.py            # FastAPI app, router registration, static /uploads
│   ├── database.py        # SQLAlchemy engine/session, reads DATABASE_URL
│   ├── models/            # ORM models
│   ├── schemas/           # Pydantic schemas
│   └── routers/           # auth, items, stock, sales, reports, dashboard, debts, analytics, uploads, audit
├── scripts/import_excel.py
├── assets/logo1.png     # logo used in branded PDF report headers
├── uploads/               # item images, served at /uploads
├── requirements.txt
├── .env / .env.example
├── setup_backend.bat      # Windows setup helper
└── start_server.bat       # Windows run helper
```
