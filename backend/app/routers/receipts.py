"""80 mm thermal receipt PDFs for completed sales.

The receipt is generated server-side so the web app, desktop app and any
future mobile client print exactly the same document.
"""

import os
from datetime import datetime
from decimal import Decimal, InvalidOperation
from io import BytesIO

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.models import Sale, SaleItem, User
from app.routers.auth import get_current_active_user


router = APIRouter(prefix="/api/sales", tags=["Sales"])

# ---------------------------------------------------------------------------
# Receipt configuration
# ---------------------------------------------------------------------------

STORE_NAME = os.getenv("RECEIPT_STORE_NAME", "PAWIN Stationery")
STORE_PHONE = os.getenv("RECEIPT_STORE_PHONE", "+255 664 834 083")
STORE_FOOTER = os.getenv("RECEIPT_FOOTER", "Thank you for your purchase!")
POWERED_BY = os.getenv("RECEIPT_POWERED_BY", "Powered by PyPOS")
CURRENCY = os.getenv("RECEIPT_CURRENCY", "TSH")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_LOGO_CANDIDATES = [
    os.path.join(BASE_DIR, "assets", "receipt_logo.png"),
    os.path.join(BASE_DIR, "assets", "pawin_logo.png"),
    os.path.join(BASE_DIR, "assets", "logo1.png"),
]
LOGO_PATH = next((path for path in _LOGO_CANDIDATES if os.path.exists(path)), None)

# 80 mm thermal roll
PAGE_WIDTH = 80 * mm
SIDE_MARGIN = 5 * mm
CONTENT_WIDTH = PAGE_WIDTH - (2 * SIDE_MARGIN)
BOTTOM_MARGIN = 8 * mm

PAYMENT_LABELS = {
    "cash": "Cash",
    "card": "Card",
    "debt": "Debt",
    "other": "Other",
}


def _money(value) -> str:
    try:
        amount = Decimal(str(value if value is not None else 0))
    except (InvalidOperation, TypeError, ValueError):
        amount = Decimal("0")
    return f"{CURRENCY} {amount:,.2f}"


def _wrap(text: str, font: str, size: float, max_width: float):
    words = str(text or "").split()
    if not words:
        return [""]

    lines = []
    current = words[0]
    for word in words[1:]:
        candidate = f"{current} {word}"
        if stringWidth(candidate, font, size) <= max_width:
            current = candidate
        else:
            lines.append(current)
            current = word
    lines.append(current)
    return lines


class _ReceiptLayout:
    """Draws a receipt top-down. Runs twice: once to measure, once to render."""

    def __init__(self, c: canvas.Canvas = None):
        self.c = c
        self.width = PAGE_WIDTH
        self.margin = SIDE_MARGIN
        self.y = 0.0

    def _set_font(self, size, bold=False):
        if self.c is not None:
            self.c.setFont("Helvetica-Bold" if bold else "Helvetica", size)

    def spacer(self, height):
        self.y += height

    def line(self, left="", right=None, size=9, bold=False, gap=1.6, indent=0):
        if self.c is not None:
            self._set_font(size, bold)
            baseline = -(self.y + size)
            if left:
                self.c.drawString(self.margin + indent, baseline, str(left))
            if right is not None:
                self.c.drawRightString(self.width - self.margin, baseline, str(right))
        self.y += (size * 1.25) + gap

    def center(self, text, size=9, bold=False, gap=1.6, color=None):
        if self.c is not None:
            self.c.saveState()
            self._set_font(size, bold)
            if color:
                self.c.setFillColor(colors.HexColor(color))
            self.c.drawCentredString(self.width / 2.0, -(self.y + size), str(text))
            self.c.restoreState()
        self.y += (size * 1.25) + gap

    def divider(self, before=2.5, after=2.5):
        self.y += before
        if self.c is not None:
            self.c.saveState()
            self.c.setStrokeColor(colors.HexColor("#8f8f8f"))
            self.c.setLineWidth(0.6)
            self.c.setDash(1.6, 1.6)
            self.c.line(self.margin, -self.y, self.width - self.margin, -self.y)
            self.c.restoreState()
        self.y += after

    def logo(self, path):
        if not path:
            return
        try:
            reader = ImageReader(path)
            img_w, img_h = reader.getSize()
        except Exception:
            return

        draw_width = CONTENT_WIDTH * 0.38
        draw_height = draw_width * img_h / img_w
        if self.c is not None:
            self.c.drawImage(
                path,
                (self.width - draw_width) / 2.0,
                -(self.y + draw_height),
                width=draw_width,
                height=draw_height,
                mask="auto",
            )
        self.y += draw_height + 2.5

    def wrapped(self, text, size=9, bold=False, indent=0, gap=0.8):
        font = "Helvetica-Bold" if bold else "Helvetica"
        lines = _wrap(text, font, size, CONTENT_WIDTH - indent)
        for line_text in lines:
            self.line(line_text, size=size, bold=bold, gap=gap, indent=indent)

    def item(self, name, quantity, unit_price, subtotal):
        self.wrapped(name, size=9, bold=True, gap=0.2)
        self.line(
            f"{quantity} x {_money(unit_price)}",
            _money(subtotal),
            size=8.5,
            gap=2.2,
            indent=2 * mm,
        )


def _build_receipt(sale: Sale, cashier_name: str = None, customer_name: str = None, c: canvas.Canvas = None):
    """Draw the receipt and return the required page height (points)."""
    layout = _ReceiptLayout(c)

    layout.spacer(2 * mm)
    layout.logo(LOGO_PATH)
    layout.spacer(1 * mm)
    layout.center(STORE_NAME, size=12.5, bold=True, gap=0.5)
    layout.center(STORE_PHONE, size=9, gap=2)
    layout.divider()

    layout.line(f"Receipt No: #{sale.id:05d}", size=9)
    created_at = sale.created_at
    if isinstance(created_at, datetime):
        layout.line(f"Date: {created_at.strftime('%d %b %Y, %I:%M %p')}", size=9)
    if cashier_name:
        layout.line(f"Cashier: {cashier_name}", size=9)
    receipt_customer = (customer_name or "").strip() or sale.customer_name
    if receipt_customer:
        for line_text in _wrap(f"Customer: {receipt_customer}", "Helvetica", 9, CONTENT_WIDTH):
            layout.line(line_text, size=9)

    layout.divider()
    layout.line("ITEM", "AMOUNT", size=8, bold=True, gap=1)

    for sale_item in sale.sale_items or []:
        item_name = sale_item.item.name if sale_item.item else "Item"
        layout.item(item_name, sale_item.quantity, sale_item.unit_price, sale_item.subtotal)

    layout.divider()

    total_amount = Decimal(str(sale.total_amount or 0))
    discount_amount = Decimal(str(sale.discount_amount or 0))
    final_amount = Decimal(str(sale.final_amount or 0))

    layout.line("Subtotal", _money(total_amount), size=9)
    if discount_amount > 0:
        layout.line("Discount", f"-{_money(discount_amount)}", size=9)
    layout.line("TOTAL", _money(final_amount), size=11, bold=True, gap=1)

    payment_method = str(sale.payment_method or "").lower()
    layout.line("Payment Method", PAYMENT_LABELS.get(payment_method, payment_method.title()), size=9)
    if payment_method == "debt" and final_amount > 0:
        layout.line("Balance Due", _money(final_amount), size=9, bold=True)

    layout.divider()
    layout.center(STORE_FOOTER, size=9, gap=1)
    layout.center(POWERED_BY, size=7.5, gap=0, color="#7a7a7a")
    layout.spacer(2 * mm)

    return layout.y + BOTTOM_MARGIN


@router.get("/{sale_id}/receipt.pdf")
def sale_receipt_pdf(
    sale_id: int,
    customer_name: str = Query(None, max_length=120),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    sale = (
        db.query(Sale)
        .options(
            joinedload(Sale.cashier),
            joinedload(Sale.sale_items).joinedload(SaleItem.item),
        )
        .filter(Sale.id == sale_id)
        .first()
    )
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")

    cashier_name = None
    if sale.cashier:
        cashier_name = sale.cashier.full_name or sale.cashier.username

    page_height = _build_receipt(sale, cashier_name, customer_name)
    page_height = max(page_height, 120 * mm)

    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=(PAGE_WIDTH, page_height))
    pdf.setTitle(f"Receipt #{sale.id:05d}")
    pdf.setAuthor(STORE_NAME)
    pdf.setSubject("Sales receipt")
    pdf.translate(0, page_height)
    _build_receipt(sale, cashier_name, customer_name, pdf)
    pdf.showPage()
    pdf.save()
    buffer.seek(0)

    filename = f"receipt_{sale.id:05d}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-store",
        },
    )
