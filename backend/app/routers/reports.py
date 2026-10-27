from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta
from io import BytesIO
import os

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, Border, Side, PatternFill

from app.database import get_db
from app.models.models import User, Sale, StockMovement
from app.routers.auth import get_current_active_user

router = APIRouter(prefix="/api/reports", tags=["Reports"])

CURRENCY = "TSH"

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
LOGO_PATH = os.path.join(BASE_DIR, "assets", "logo1.png")
COMPANY_NAME = "PAWIN PYPOS"
COMPANY_TAGLINE = "Premium Stationery Inventory System"

SALES_HEADERS = [
    "Receipt #", "Date & Time", "Category", "Item", "Qty",
    "Unit Price", "Subtotal", "Cost", "Total Cost", "Profit", "Margin",
]
SALES_COL_WIDTHS = [55, 80, 65, 100, 30, 55, 55, 45, 60, 55, 40]

STOCK_HEADERS = [
    "Date", "Time", "Item", "SKU", "Category", "Qty",
    "Unit Cost", "Total Cost", "Reference", "Notes", "Received By",
]
STOCK_COL_WIDTHS = [55, 35, 100, 60, 70, 40, 55, 65, 70, 100, 60]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _report_stamp():
    return datetime.now().strftime("%A, %B %d, %Y, %I:%M %p")


def create_pdf_buffer(title, headers, data, column_widths, report_date=None):
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        leftMargin=36,
        rightMargin=36,
        topMargin=24,
        bottomMargin=24,
    )
    elements = []

    styles = getSampleStyleSheet()
    company_style = ParagraphStyle(
        'CompanyName',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=20,
        textColor=colors.HexColor('#212529'),
    )
    tagline_style = ParagraphStyle(
        'CompanyTagline',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#646464'),
    )
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=17,
        textColor=colors.HexColor('#212529'),
        spaceBefore=8,
    )
    date_style = ParagraphStyle(
        'ReportDate',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=11,
        textColor=colors.HexColor('#646464'),
    )

    # Branded header: logo + company name/tagline, matching the old jsPDF PDFs.
    text_block = [
        Paragraph(COMPANY_NAME, company_style),
        Paragraph(COMPANY_TAGLINE, tagline_style),
    ]

    logo = None
    if os.path.exists(LOGO_PATH):
        try:
            logo = Image(LOGO_PATH, width=28, height=28)
        except Exception:
            logo = None

    if logo is not None:
        header_table = Table(
            [[logo, text_block]],
            colWidths=[38, doc.width - 38],
        )
        header_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ('TOPPADDING', (0, 0), (-1, -1), 0),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ]))
        elements.append(header_table)
    else:
        elements.extend(text_block)

    elements.append(Paragraph(title, title_style))
    elements.append(Paragraph(f"Report Date: {report_date or _report_stamp()}", date_style))
    elements.append(Spacer(1, 12))

    table_data = [headers]
    span_styles = []
    for row_idx, row in enumerate(data, 1):
        if len(row) == 1:
            table_data.append([row[0]] + [""] * (len(headers) - 1))
            span_styles.extend([
                ('SPAN', (0, row_idx), (-1, row_idx)),
                ('BACKGROUND', (0, row_idx), (-1, row_idx), colors.HexColor('#eef2f5')),
                ('FONTNAME', (0, row_idx), (-1, row_idx), 'Helvetica-Bold'),
                ('ALIGN', (0, row_idx), (-1, row_idx), 'LEFT'),
            ])
        else:
            table_data.append(row)

    table = Table(table_data, colWidths=column_widths, repeatRows=1)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c3e50')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8f9fa')]),
        ('LEFTPADDING', (0, 1), (-1, -1), 4),
        ('RIGHTPADDING', (0, 1), (-1, -1), 4),
    ] + span_styles))

    elements.append(table)
    doc.build(elements)
    buffer.seek(0)
    return buffer


def create_excel_buffer(title, headers, data):
    wb = Workbook()
    ws = wb.active
    ws.title = title[:31]

    header_font = Font(bold=True, color="FFFFFF")
    header_fill = PatternFill(start_color="2C3E50", end_color="2C3E50", fill_type="solid")
    header_alignment = Alignment(horizontal="center", vertical="center")
    thin_border = Border(
        left=Side(style='thin'),
        right=Side(style='thin'),
        top=Side(style='thin'),
        bottom=Side(style='thin')
    )

    for col, header in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col, value=header)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = header_alignment
        cell.border = thin_border

    for row_idx, row_data in enumerate(data, 2):
        for col_idx, value in enumerate(row_data, 1):
            cell = ws.cell(row=row_idx, column=col_idx, value=value)
            cell.border = thin_border
            cell.alignment = Alignment(horizontal="center")

    for col in ws.columns:
        max_length = 0
        column = col[0].column_letter
        for cell in col:
            try:
                if len(str(cell.value)) > max_length:
                    max_length = len(str(cell.value))
            except Exception:
                pass
        adjusted_width = min((max_length + 2), 50)
        ws.column_dimensions[column].width = adjusted_width

    buffer = BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return buffer


def _money(value):
    try:
        return float(value or 0)
    except (TypeError, ValueError):
        return 0.0


def _margin(profit, subtotal):
    return (profit / subtotal * 100) if subtotal else 0.0


def _sale_item_rows(sale):
    """One row per sale item, with receipt info repeated only on the first row."""
    rows = []
    profit_total = 0.0

    for idx, si in enumerate(sale.sale_items or []):
        qty = si.quantity or 0
        unit_price = _money(si.unit_price)
        subtotal = _money(si.subtotal)
        cost = _money(si.item.cost_price) if si.item else 0.0
        total_cost = cost * qty
        profit = subtotal - total_cost
        profit_total += profit

        category = si.item.category.name if si.item and si.item.category else "-"
        item_name = si.item.name if si.item else "N/A"

        rows.append([
            f"#{sale.id:05d}" if idx == 0 else "",
            sale.created_at.strftime("%Y-%m-%d %H:%M") if idx == 0 else "",
            category,
            item_name,
            qty,
            f"{unit_price:,.2f}",
            f"{subtotal:,.2f}",
            f"{cost:,.2f}",
            f"{total_cost:,.2f}",
            f"{profit:,.2f}",
            f"{_margin(profit, subtotal):.1f}%",
        ])

    return rows, profit_total


def _daily_sales_data(sales):
    data = []
    grand_total = 0.0
    grand_profit = 0.0

    for sale in sales:
        rows, profit = _sale_item_rows(sale)
        data.extend(rows)
        grand_total += _money(sale.final_amount)
        grand_profit += profit

    data.append([
        "", "", "", "", "", "GRAND TOTAL:",
        f"{grand_total:,.2f}", "", "",
        f"{grand_profit:,.2f}", f"{_margin(grand_profit, grand_total):.1f}%",
    ])
    return data


def _monthly_sales_data(sales, compact=False):
    months = {}
    for sale in sales:
        months.setdefault(sale.created_at.strftime("%Y-%m"), []).append(sale)

    data = []
    grand_total = 0.0
    grand_profit = 0.0

    for key in sorted(months.keys()):
        month_sales = months[key]
        month_total = sum(_money(s.final_amount) for s in month_sales)
        month_rows = []
        month_profit = 0.0

        for sale in month_sales:
            rows, profit = _sale_item_rows(sale)
            month_rows.extend(rows)
            month_profit += profit

        margin = _margin(month_profit, month_total)

        if compact:
            data.append([
                f"--- {key} ---    Transactions: {len(month_sales)}    "
                f"Total: {CURRENCY}{month_total:,.2f}    "
                f"Profit: {CURRENCY}{month_profit:,.2f}    Margin: {margin:.1f}%"
            ])
        else:
            data.append([
                "", f"--- {key} ---", "", "", "",
                f"Transactions: {len(month_sales)}",
                f"Total: {CURRENCY}{month_total:,.2f}",
                "", "",
                f"Profit: {CURRENCY}{month_profit:,.2f}",
                f"{margin:.1f}%",
            ])

        data.extend(month_rows)
        grand_total += month_total
        grand_profit += month_profit

    margin = _margin(grand_profit, grand_total)
    if compact:
        data.append([
            f"GRAND TOTAL    Transactions: {len(sales)}    "
            f"Total: {CURRENCY}{grand_total:,.2f}    "
            f"Profit: {CURRENCY}{grand_profit:,.2f}    Margin: {margin:.1f}%"
        ])
    else:
        data.append([
            "", "", "", "", "", "GRAND TOTAL:",
            f"{grand_total:,.2f}", "", "",
            f"{grand_profit:,.2f}", f"{margin:.1f}%",
        ])
    return data


def _stock_arrival_data(movements):
    data = []
    total_qty = 0

    for m in movements:
        qty = m.quantity or 0
        total_qty += qty
        unit_cost = _money(m.item.cost_price) if m.item else 0.0
        total_cost = unit_cost * qty
        data.append([
            m.created_at.strftime("%Y-%m-%d"),
            m.created_at.strftime("%H:%M"),
            m.item.name if m.item else "N/A",
            m.item.sku if m.item else "N/A",
            m.item.category.name if m.item and m.item.category else "N/A",
            qty,
            f"{unit_cost:,.2f}",
            f"{total_cost:,.2f}",
            m.reference or "-",
            m.notes or "-",
            (m.user.full_name or m.user.username) if m.user else "N/A",
        ])

    data.append([
        "", "", "", "", "TOTAL:", total_qty, "", "", "", "", "",
    ])
    return data


def _month_bounds(year, month):
    start = datetime(year, month, 1)
    if month == 12:
        end = datetime(year + 1, 1, 1)
    else:
        end = datetime(year, month + 1, 1)
    return start, end


def _sales_query(db, year=None, month=None):
    query = db.query(Sale)

    if year and month:
        start, end = _month_bounds(year, month)
        query = query.filter(Sale.created_at >= start, Sale.created_at < end)
    elif year:
        query = query.filter(
            Sale.created_at >= datetime(year, 1, 1),
            Sale.created_at < datetime(year + 1, 1, 1),
        )
    elif month:
        start, end = _month_bounds(date.today().year, month)
        query = query.filter(Sale.created_at >= start, Sale.created_at < end)

    return query.order_by(Sale.created_at.asc())


def _monthly_title(year, month):
    if year and month:
        return f"Monthly Sales Report - {date(year, month, 1).strftime('%B %Y')}"
    if year:
        return f"Monthly Sales Report - {year}"
    if month:
        return f"Monthly Sales Report - {date(date.today().year, month, 1).strftime('%B %Y')}"
    return "Monthly Sales Report - All Months"


def _monthly_filename(year, month, ext):
    if year and month:
        return f"monthly_sales_{year}_{month:02d}.{ext}"
    if year:
        return f"monthly_sales_{year}.{ext}"
    if month:
        return f"monthly_sales_{date.today().year}_{month:02d}.{ext}"
    return f"monthly_sales_all.{ext}"


def _stock_query(db, start_date=None, end_date=None):
    query = db.query(StockMovement).filter(StockMovement.movement_type == "in")

    if start_date:
        start_datetime = datetime.strptime(start_date, "%Y-%m-%d")
        query = query.filter(StockMovement.created_at >= start_datetime)
    if end_date:
        end_datetime = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
        query = query.filter(StockMovement.created_at < end_datetime)

    return query.order_by(StockMovement.created_at.desc())


# ---------------------------------------------------------------------------
# Daily sales
# ---------------------------------------------------------------------------

@router.get("/daily-sales/pdf")
def daily_sales_pdf(
    report_date: str = Query(None, alias="date"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if report_date:
        target_date = datetime.strptime(report_date, "%Y-%m-%d").date()
    else:
        target_date = date.today()

    start_datetime = datetime.combine(target_date, datetime.min.time())
    end_datetime = datetime.combine(target_date, datetime.max.time())

    sales = db.query(Sale).filter(
        Sale.created_at >= start_datetime,
        Sale.created_at <= end_datetime
    ).order_by(Sale.created_at.asc()).all()

    title = f"Daily Sales Report - {target_date.strftime('%d %B %Y')}"
    buffer = create_pdf_buffer(title, SALES_HEADERS, _daily_sales_data(sales), SALES_COL_WIDTHS)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=daily_sales_{target_date.isoformat()}.pdf"}
    )


@router.get("/daily-sales/excel")
def daily_sales_excel(
    report_date: str = Query(None, alias="date"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if report_date:
        target_date = datetime.strptime(report_date, "%Y-%m-%d").date()
    else:
        target_date = date.today()

    start_datetime = datetime.combine(target_date, datetime.min.time())
    end_datetime = datetime.combine(target_date, datetime.max.time())

    sales = db.query(Sale).filter(
        Sale.created_at >= start_datetime,
        Sale.created_at <= end_datetime
    ).order_by(Sale.created_at.asc()).all()

    title = f"Daily Sales {target_date.strftime('%Y%m%d')}"
    buffer = create_excel_buffer(title, SALES_HEADERS, _daily_sales_data(sales))

    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=daily_sales_{target_date.isoformat()}.xlsx"}
    )


# ---------------------------------------------------------------------------
# Monthly sales
# ---------------------------------------------------------------------------

@router.get("/monthly-sales/pdf")
def monthly_sales_pdf(
    year: int = Query(None),
    month: int = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    sales = _sales_query(db, year, month).all()
    title = _monthly_title(year, month)
    buffer = create_pdf_buffer(title, SALES_HEADERS, _monthly_sales_data(sales, compact=True), SALES_COL_WIDTHS)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={_monthly_filename(year, month, 'pdf')}"}
    )


@router.get("/monthly-sales/excel")
def monthly_sales_excel(
    year: int = Query(None),
    month: int = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    sales = _sales_query(db, year, month).all()
    title = _monthly_title(year, month)
    buffer = create_excel_buffer(title, SALES_HEADERS, _monthly_sales_data(sales))

    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={_monthly_filename(year, month, 'xlsx')}"}
    )


# ---------------------------------------------------------------------------
# Stock arrivals
# ---------------------------------------------------------------------------

@router.get("/stock-arrival/pdf")
def stock_arrival_pdf(
    start_date: str = Query(None),
    end_date: str = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role not in ("admin", "master_admin", "on_duty"):
        raise HTTPException(status_code=403, detail="Only admin and on-duty staff can view stock arrival reports")

    movements = _stock_query(db, start_date, end_date).all()

    title = "Stock Arrival Report"
    if start_date and end_date:
        title += f" ({start_date} to {end_date})"
    elif start_date:
        title += f" (from {start_date})"
    elif end_date:
        title += f" (until {end_date})"

    buffer = create_pdf_buffer(title, STOCK_HEADERS, _stock_arrival_data(movements), STOCK_COL_WIDTHS)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=stock_arrivals.pdf"}
    )


@router.get("/stock-arrival/excel")
def stock_arrival_excel(
    start_date: str = Query(None),
    end_date: str = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role not in ("admin", "master_admin", "on_duty"):
        raise HTTPException(status_code=403, detail="Only admin and on-duty staff can view stock arrival reports")

    movements = _stock_query(db, start_date, end_date).all()
    buffer = create_excel_buffer("Stock Arrival Report", STOCK_HEADERS, _stock_arrival_data(movements))

    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=stock_arrivals.xlsx"}
    )
