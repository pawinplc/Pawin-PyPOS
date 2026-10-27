# Roles, Accounts & Audit

This document describes the PyPOS role hierarchy, the default master admin
account, how to create a normal admin, and what the audit log records.

---

## 1. Role hierarchy

Highest privilege first:

| Role value | Display label | Access |
|---|---|---|
| `master_admin` | **Master Admin** | Everything, including **Users** and **Audit Log** |
| `admin` | **Administrator** | Everything except Users and Audit Log |
| `on_duty` | **On Duty** | POS, sales, reports, inventory viewing |

- A Master Admin can create, edit, and delete users, assign roles, and view the
  Audit Log and Login Sessions.
- A normal Admin can manage inventory, stock, sales, debts, reports and POS, but
  cannot open Users or Audit Log (the pages are hidden and the API returns
  `403`).
- On Duty users can operate the POS and view inventory pages, but cannot change
  items, categories, services, or stock.

Only a Master Admin can promote someone to Master Admin.

---

## 2. Default accounts

| Account | Username | Email | Role | Default password |
|---|---|---|---|---|
| Master Admin | `admin` | `master@pawinplc.com` | `master_admin` | `admin123` |
| Cashier | `cashier1` | set per installation | `on_duty` | `admin123` |

Login accepts **either the email or the username** in the email field.

> Change both passwords before using the system for real business.

### Reserved email

`pawinplc2022@gmail.com` is **not used by the master admin**. It is left free on
purpose so the Master Admin can use it when creating the first normal Admin
account.

---

## 3. Create a normal admin

1. Log in as the Master Admin (`master@pawinplc.com`).
2. Open **Users** in the sidebar.
3. Click **Add New User**.
4. Fill in:

   | Field | Value |
   |---|---|
   | Full name | e.g. `Pawin Admin` |
   | Email | `pawinplc2022@gmail.com` |
   | Username | e.g. `pawinadmin` |
   | Password | a strong password |
   | Role | **Admin** |

5. Click **Create**.

The new account can then log in with `pawinplc2022@gmail.com` and manage the
shop, but it will not see **Users** or **Audit Log**.

### Equivalent API call

```bash
# 1. Log in as master admin
TOKEN=$(curl -s -X POST https://pypos.pawinplc.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"master@pawinplc.com","password":"admin123"}' \
  | python -c "import sys,json;print(json.load(sys.stdin)['access_token'])")

# 2. Create a normal admin
curl -X POST https://pypos.pawinplc.com/api/auth/register \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "username": "pawinadmin",
        "email": "pawinplc2022@gmail.com",
        "password": "STRONG_PASSWORD_HERE",
        "full_name": "Pawin Admin",
        "role": "admin"
      }'
```

---

## 4. Permissions by area

| Area | Master Admin | Admin | On Duty |
|---|---|---|---|
| POS / sales | ✅ | ✅ | ✅ |
| Debts | ✅ | ✅ | ✅ |
| Reports & analytics | ✅ | ✅ | ✅ |
| View inventory (Services, Items, Categories, Stock) | ✅ | ✅ | ✅ |
| Add/edit/delete items, categories, services | ✅ | ✅ | ❌ |
| Stock In / Out / Adjust | ✅ | ✅ | ❌ |
| Users page / user management | ✅ | ❌ | ❌ |
| Audit Log & Login Sessions | ✅ | ❌ | ❌ |

Backend enforcement lives in `backend/app/roles.py` and the individual routers.

### Safety rules

- You cannot demote your own master admin account.
- You cannot delete your own account.
- The **last** master admin cannot be demoted or deleted.
- User and audit endpoints check the role from the database on every request,
  so a role change takes effect on the next request (no re-login required).

---

## 5. What the audit log records

Open **Audit Log** as a Master Admin. The **Role** column shows the role the
user had when the action happened.

| Type | Source | Examples |
|---|---|---|
| Sales | `sales` | Sale completed (includes cashier role) |
| Debts | `debts` | Debt recorded |
| Stock Movements | `stock_movements` | Stock In / Out / Adjust (includes role) |
| Inventory Changes | `audit_logs` | Item/category/service created, updated, deleted |
| User Activity | `user_activity` | Login / logout (includes role) |

Inventory audit entries store a **role snapshot** (`audit_logs.role`), so the
history stays accurate even if the user's role changes later.

Audit entries include:

- actor user id and username
- actor role at the time
- action (`created`, `updated`, `deleted`, `login`, `logout`, …)
- entity type (`item`, `category`, `service`)
- entity id
- human-readable description with changed fields
- timestamp

---

## 6. Database migrations

| Migration | Purpose |
|---|---|
| `001_user_sessions.sql` | Saved login devices and sessions |
| `002_inventory_audit.sql` | Inventory CRUD audit table |
| `003_master_admin_role.sql` | Promotes `admin` to `master_admin` |
| `004_master_admin_email.sql` | Sets the master admin email to `master@pawinplc.com` |

Apply to MySQL in order:

```bash
mysql -h 127.0.0.1 -u <user> -p <database> < backend/migrations/001_user_sessions.sql
mysql -h 127.0.0.1 -u <user> -p <database> < backend/migrations/002_inventory_audit.sql
mysql -h 127.0.0.1 -u <user> -p <database> < backend/migrations/003_master_admin_role.sql
mysql -h 127.0.0.1 -u <user> -p <database> < backend/migrations/004_master_admin_email.sql
```

Then redeploy the backend and restart the service.

### Local SQLite development

```bash
cd backend
python scripts/init_sqlite.py
```

The seed script creates or updates the master account (`admin`) with:

- email `master@pawinplc.com`
- role `master_admin`

It leaves `pawinplc2022@gmail.com` unused.

---

## 7. Verification checklist

After deploying the role changes:

```bash
# Master admin can see users and audit logs
curl -o /dev/null -w "%{http_code}\n" https://pypos.pawinplc.com/api/auth/users \
  -H "Authorization: Bearer $MASTER_TOKEN"          # 200

# A normal admin cannot
curl -o /dev/null -w "%{http_code}\n" https://pypos.pawinplc.com/api/auth/users \
  -H "Authorization: Bearer $ADMIN_TOKEN"           # 403

# Master admin email
curl https://pypos.pawinplc.com/api/auth/me \
  -H "Authorization: Bearer $MASTER_TOKEN"          # "role":"master_admin"
```

Expected database state:

| Username | Email | Role |
|---|---|---|
| `admin` | `master@pawinplc.com` | `master_admin` |
| `cashier1` | per installation | `on_duty` |
| `pawinadmin` (after step 3) | `pawinplc2022@gmail.com` | `admin` |

---

## 8. Security notes

- Store the master admin password in a password manager, not in the repository.
- Do not share the master admin account; create a normal Admin for daily work.
- The reserved email `pawinplc2022@gmail.com` should only be assigned to a
  trusted normal Admin.
- Rotate the default `admin123` password immediately after installation.
