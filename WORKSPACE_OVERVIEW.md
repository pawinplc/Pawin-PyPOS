# Pawin PyPOS Project Ecosystem

This document provides a high-level overview of the entire Pawin PyPOS project ecosystem, covering the Web application, the Desktop implementation, and shared backend services.

## 📁 Repository Structure

```text
Pawin-PyPOS-Desktop/    # JavaFX Desktop Application (Standalone)
Pawin-PyPOS/            # Web & Backend Repository
├── frontend/           # React + Vite Web Application
├── backend/            # FastAPI (Python) - Legacy Service
├── database/           # SQL Scripts
└── inapp-1.0.0/        # Supplementary project
```

---

## 🌐 Web Application (`/frontend`)

The core of the system, designed for standard browser-based operations.

*   **Tech Stack**: React 19, Vite, React Router 7 (HashRouter), Supabase JS Client.
*   **Deployment**: 
    *   **Live Demo**: [Vercel](https://pawin-pypos.vercel.app)
    *   **GitHub Pages**: [Automated via GH Actions](https://pawinplc.github.io/Pawin-PyPOS/)
*   **Key Features**:
    *   Full Point of Sale (POS) interface.
    *   Inventory Management with low-stock notifications.
    *   Responsive design with Light/Dark mode.
    *   Admin dashboard with Analytics and User management.

---

## 🖥️ Desktop Application (Sibling Folder: `../Pawin-PyPOS-Desktop`)

A standalone desktop version optimized for dedicated POS terminals at the University Stationery shop.

*   **Tech Stack**: Java 17, JavaFX 21, Maven, OkHttp, Jackson.
*   **Repository**: Standalone Git repository initialized in this folder.
*   **How to Run**:
    ```bash
    cd Pawin-PyPOS-Desktop
    mvn javafx:run
    ```
*   **Current State**: Includes Main App (Login UI) and Supabase Service Layer.

---

## 🗄️ Backend & Database (`/database`)

Powered by **Supabase** (PostgreSQL).

*   **Tables**: `items`, `categories`, `sales`, `sale_items`, `stock_movements`, `users`.
*   **Auth**: Handled via Supabase Auth (Email/Password).
*   **Security**: RLS (Row Level Security) configurations provided in `fix_rls.sql`.

---

## 🛠️ Developer Commands Reference

### Web (Frontend)
```bash
cd frontend
npm run dev      # Local development
npm run deploy   # Deploy to GitHub Pages
```

### Desktop (JavaFX)
```bash
cd Pawin-PyPOS-Desktop
mvn clean compile   # Verify build
mvn javafx:run      # Launch App
```

### Database Utilities
Refer to [flush data.md](file:///home/mrdino/Desktop/DTC/Pawin/Pawin-PyPOS/flush%20data.md) for clearing sales history while keeping items.

---

*Last Updated: April 2026*
*Developed by DTC Team*
