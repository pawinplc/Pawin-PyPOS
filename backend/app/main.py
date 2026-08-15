from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.routers import auth, categories, items, stock, sales, reports, dashboard, debts, analytics, uploads

app = FastAPI(
    title="PyPOS API",
    description="University Stationery Inventory & POS System",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(items.router)
app.include_router(stock.router)
app.include_router(sales.router)
app.include_router(reports.router)
app.include_router(dashboard.router)
app.include_router(debts.router)
app.include_router(analytics.router)
app.include_router(uploads.router)

@app.get("/")
def root():
    return {"message": "PyPOS API - University Stationery System", "version": "1.0.0"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)