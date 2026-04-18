import { useState, useEffect } from 'react';
import { salesAPI, stockAPI } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import toast from 'react-hot-toast';

const Reports = ({ isAdmin: propIsAdmin }) => {
  const { isAdmin: authIsAdmin } = useAuth();
  const isAdmin = propIsAdmin ?? authIsAdmin;
  const [reportData, setReportData] = useState({
    dailySales: [],
    monthlySales: [],
    stockMovements: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const [sales, movements] = await Promise.all([
        salesAPI.getAll(),
        stockAPI.getMovements({})
      ]);

      // Use local date (same as Sales page and Android)
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T`;
      const dailySales = (sales || []).filter(s => 
        s.created_at && s.created_at.startsWith(today)
      );

      const monthlySales = {};
      (sales || []).forEach(s => {
        if (s.created_at) {
          const month = s.created_at.substring(0, 7);
          if (!monthlySales[month]) {
            monthlySales[month] = { count: 0, total: 0 };
          }
          monthlySales[month].count++;
          monthlySales[month].total += parseFloat(s.final_amount || 0);
        }
      });

      setReportData({
        dailySales: dailySales,
        monthlySales: Object.entries(monthlySales).map(([month, data]) => ({
          month,
          ...data
        })).sort((a, b) => b.month.localeCompare(a.month)),
        stockMovements: (movements || []).filter(m => m.movement_type === 'in')
      });
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadReports(true);
  };

  const dailyTotal = reportData.dailySales.reduce((sum, s) => sum + parseFloat(s?.final_amount || 0), 0);
  const monthlyTotal = reportData.monthlySales.reduce((sum, m) => sum + (m?.total || 0), 0);
  const totalArrivals = reportData.stockMovements.reduce((sum, m) => sum + m.quantity, 0);

  const getFormattedDate = () => {
    const now = new Date();
    return now.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportDailySales = () => {
    const headers = [
      ['PAWIN PYPOS - DAILY SALES REPORT'],
      [`Report Date: ${getFormattedDate()}`],
      [''],
      ['Receipt #', 'Date & Time', 'Category', 'Item', 'Quantity', 'Unit Price', 'Subtotal']
    ];

    const rows = [];
    let grandTotal = 0;
    
    reportData.dailySales.forEach(sale => {
      sale.sale_items?.forEach((item, idx) => {
        rows.push([
          idx === 0 ? `#${String(sale.id).padStart(5, '0')}` : '',
          idx === 0 ? new Date(sale.created_at).toLocaleString() : '',
          item.category_name || '-',
          item.item_name || '-',
          item.quantity,
          parseFloat(item.unit_price || 0).toFixed(2),
          parseFloat(item.subtotal || 0).toFixed(2)
        ]);
      });
      grandTotal += parseFloat(sale.final_amount || 0);
    });

    rows.push(['', '', '', '', '', 'GRAND TOTAL:', grandTotal.toFixed(2)]);

    const data = [...headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(data);
    
    ws['!cols'] = [
      { wch: 12 },
      { wch: 22 },
      { wch: 20 },
      { wch: 25 },
      { wch: 10 },
      { wch: 12 },
      { wch: 15 }
    ];
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Daily Sales');
    XLSX.writeFile(wb, `daily_sales_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Daily sales exported!');
  };

  const exportDailySalesPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('PAWIN PYPOS - DAILY SALES REPORT', 14, 20);
    doc.setFontSize(10);
    doc.text(`Report Date: ${getFormattedDate()}`, 14, 28);

    const tableData = [];
    reportData.dailySales.forEach(sale => {
      sale.sale_items?.forEach((item, idx) => {
        tableData.push([
          idx === 0 ? `#${String(sale.id).padStart(5, '0')}` : '',
          idx === 0 ? new Date(sale.created_at).toLocaleString() : '',
          item.category_name || '-',
          item.item_name || '-',
          item.quantity,
          parseFloat(item.unit_price || 0).toFixed(2),
          parseFloat(item.subtotal || 0).toFixed(2)
        ]);
      });
    });

    doc.autoTable({
      head: [['Receipt #', 'Date & Time', 'Category', 'Item', 'Qty', 'Unit Price', 'Subtotal']],
      body: tableData,
      startY: 35,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] }
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.text(`GRAND TOTAL: TSH${dailyTotal.toFixed(2)}`, 140, finalY);

    doc.save(`daily_sales_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('Daily sales PDF exported!');
  };

  const exportMonthlySales = () => {
    const headers = [
      ['PAWIN PYPOS - MONTHLY SALES REPORT'],
      [`Report Date: ${getFormattedDate()}`],
      [''],
      ['Receipt #', 'Date & Time', 'Category', 'Item', 'Quantity', 'Unit Price', 'Subtotal']
    ];

    const rows = [];
    let grandTotal = 0;
    
    reportData.monthlySales.forEach(monthData => {
      const monthSales = reportData.dailySales.filter(s => 
        s.created_at && s.created_at.substring(0, 7) === monthData.month
      );
      
      if (monthSales.length > 0) {
        rows.push(['', `--- ${monthData.month} ---`, '', '', '', `Transactions: ${monthData.count}`, `Total: ${monthData.total.toFixed(2)}`]);
        
        monthSales.forEach(sale => {
          sale.sale_items?.forEach((item, idx) => {
            rows.push([
              idx === 0 ? `#${String(sale.id).padStart(5, '0')}` : '',
              idx === 0 ? new Date(sale.created_at).toLocaleString() : '',
              item.category_name || '-',
              item.item_name || '-',
              item.quantity,
              parseFloat(item.unit_price || 0).toFixed(2),
              parseFloat(item.subtotal || 0).toFixed(2)
            ]);
          });
          grandTotal += parseFloat(sale.final_amount || 0);
        });
      }
    });

    rows.push(['', '', '', '', '', 'GRAND TOTAL:', grandTotal.toFixed(2)]);

    const data = [...headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(data);
    
    ws['!cols'] = [
      { wch: 12 },
      { wch: 22 },
      { wch: 20 },
      { wch: 25 },
      { wch: 10 },
      { wch: 15 },
      { wch: 15 }
    ];
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Monthly Sales');
    XLSX.writeFile(wb, `monthly_sales_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Monthly sales exported!');
  };

  const exportMonthlySalesPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('PAWIN PYPOS - MONTHLY SALES REPORT', 14, 20);
    doc.setFontSize(10);
    doc.text(`Report Date: ${getFormattedDate()}`, 14, 28);

    const tableData = [];
    let grandTotal = 0;
    
    reportData.monthlySales.forEach(monthData => {
      const monthSales = reportData.dailySales.filter(s => 
        s.created_at && s.created_at.substring(0, 7) === monthData.month
      );
      
      if (monthSales.length > 0) {
        tableData.push(['', `--- ${monthData.month} ---`, '', '', '', `Tx: ${monthData.count}`, `Total: TSH${monthData.total.toFixed(2)}`]);
        
        monthSales.forEach(sale => {
          sale.sale_items?.forEach((item, idx) => {
            tableData.push([
              idx === 0 ? `#${String(sale.id).padStart(5, '0')}` : '',
              idx === 0 ? new Date(sale.created_at).toLocaleString() : '',
              item.category_name || '-',
              item.item_name || '-',
              item.quantity,
              parseFloat(item.unit_price || 0).toFixed(2),
              parseFloat(item.subtotal || 0).toFixed(2)
            ]);
          });
          grandTotal += parseFloat(sale.final_amount || 0);
        });
      }
    });

    doc.autoTable({
      head: [['Receipt #', 'Date & Time', 'Category', 'Item', 'Qty', 'Unit Price', 'Subtotal']],
      body: tableData,
      startY: 35,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] }
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.text(`GRAND TOTAL: TSH${grandTotal.toFixed(2)}`, 140, finalY);

    doc.save(`monthly_sales_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('Monthly sales PDF exported!');
  };

  const exportStockArrivals = () => {
    const headers = [
      ['PAWIN PYPOS - STOCK ARRIVALS REPORT'],
      [`Report Date: ${getFormattedDate()}`],
      [''],
      ['#', 'Date', 'Item', 'Category', 'Quantity', 'Reference', 'Notes']
    ];

    const rows = reportData.stockMovements.map((m, index) => [
      index + 1,
      new Date(m.created_at).toLocaleString(),
      m.item_name || '-',
      m.category_name || '-',
      m.quantity,
      m.reference || '-',
      m.notes || '-'
    ]);

    rows.push(['', '', '', '', totalArrivals, '', 'TOTAL ITEMS RECEIVED']);

    const data = [...headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(data);
    
    ws['!cols'] = [
      { wch: 5 },
      { wch: 22 },
      { wch: 25 },
      { wch: 20 },
      { wch: 10 },
      { wch: 20 },
      { wch: 25 }
    ];
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Stock Arrivals');
    XLSX.writeFile(wb, `stock_arrivals_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Stock arrivals exported!');
  };

  const exportStockArrivalsPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('PAWIN PYPOS - STOCK ARRIVALS REPORT', 14, 20);
    doc.setFontSize(10);
    doc.text(`Report Date: ${getFormattedDate()}`, 14, 28);

    const tableData = reportData.stockMovements.map((m, index) => [
      index + 1,
      new Date(m.created_at).toLocaleString(),
      m.item_name || '-',
      m.category_name || '-',
      m.quantity,
      m.reference || '-',
      m.notes || '-'
    ]);

    doc.autoTable({
      head: [['#', 'Date', 'Item', 'Category', 'Qty', 'Reference', 'Notes']],
      body: tableData,
      startY: 35,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] }
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.text(`TOTAL ITEMS RECEIVED: ${totalArrivals}`, 14, finalY);

    doc.save(`stock_arrivals_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('Stock arrivals PDF exported!');
  };

  const exportAllReports = () => {
    const wb = XLSX.utils.book_new();
    
    // Daily Sales Sheet
    if (reportData.dailySales.length > 0) {
      const headers = [
        ['PAWIN PYPOS - DAILY SALES REPORT'],
        [`Report Date: ${getFormattedDate()}`],
        [''],
        ['Receipt #', 'Date & Time', 'Category', 'Item', 'Quantity', 'Unit Price', 'Subtotal']
      ];

      const rows = [];
      let grandTotal = 0;
      
      reportData.dailySales.forEach(sale => {
        sale.sale_items?.forEach((item, idx) => {
          rows.push([
            idx === 0 ? `#${String(sale.id).padStart(5, '0')}` : '',
            idx === 0 ? new Date(sale.created_at).toLocaleString() : '',
            item.category_name || '-',
            item.item_name || '-',
            item.quantity,
            parseFloat(item.unit_price || 0).toFixed(2),
            parseFloat(item.subtotal || 0).toFixed(2)
          ]);
        });
        grandTotal += parseFloat(sale.final_amount || 0);
      });

      rows.push(['', '', '', '', '', 'GRAND TOTAL:', grandTotal.toFixed(2)]);
      
      const ws = XLSX.utils.aoa_to_sheet([...headers, ...rows]);
      ws['!cols'] = [{ wch: 12 }, { wch: 22 }, { wch: 20 }, { wch: 25 }, { wch: 10 }, { wch: 12 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, ws, 'Daily Sales');
    }
    
    // Monthly Sales Sheet
    if (reportData.monthlySales.length > 0) {
      const headers = [
        ['PAWIN PYPOS - MONTHLY SALES REPORT'],
        [`Report Date: ${getFormattedDate()}`],
        [''],
        ['Receipt #', 'Date & Time', 'Category', 'Item', 'Quantity', 'Unit Price', 'Subtotal']
      ];

      const rows = [];
      let grandTotal = 0;
      
      reportData.monthlySales.forEach(monthData => {
        const monthSales = reportData.dailySales.filter(s => 
          s.created_at && s.created_at.substring(0, 7) === monthData.month
        );
        
        if (monthSales.length > 0) {
          rows.push(['', `--- ${monthData.month} ---`, '', '', '', `Transactions: ${monthData.count}`, `Total: ${monthData.total.toFixed(2)}`]);
          
          monthSales.forEach(sale => {
            sale.sale_items?.forEach((item, idx) => {
              rows.push([
                idx === 0 ? `#${String(sale.id).padStart(5, '0')}` : '',
                idx === 0 ? new Date(sale.created_at).toLocaleString() : '',
                item.category_name || '-',
                item.item_name || '-',
                item.quantity,
                parseFloat(item.unit_price || 0).toFixed(2),
                parseFloat(item.subtotal || 0).toFixed(2)
              ]);
            });
            grandTotal += parseFloat(sale.final_amount || 0);
          });
        }
      });

      rows.push(['', '', '', '', '', 'GRAND TOTAL:', grandTotal.toFixed(2)]);
      
      const ws = XLSX.utils.aoa_to_sheet([...headers, ...rows]);
      ws['!cols'] = [{ wch: 12 }, { wch: 22 }, { wch: 20 }, { wch: 25 }, { wch: 10 }, { wch: 15 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, ws, 'Monthly Sales');
    }
    
    // Stock Arrivals Sheet
    if (reportData.stockMovements.length > 0) {
      const headers = [
        ['PAWIN PYPOS - STOCK ARRIVALS REPORT'],
        [`Report Date: ${getFormattedDate()}`],
        [''],
        ['#', 'Date', 'Item', 'Category', 'Quantity', 'Reference', 'Notes']
      ];
      const rows = reportData.stockMovements.map((m, index) => [
        index + 1,
        new Date(m.created_at).toLocaleString(),
        m.item_name || '-',
        m.category_name || '-',
        m.quantity,
        m.reference || '-',
        m.notes || '-'
      ]);
      rows.push(['', '', '', '', totalArrivals, '', 'TOTAL ITEMS RECEIVED']);
      
      const ws = XLSX.utils.aoa_to_sheet([...headers, ...rows]);
      ws['!cols'] = [{ wch: 5 }, { wch: 22 }, { wch: 25 }, { wch: 20 }, { wch: 10 }, { wch: 20 }, { wch: 25 }];
      XLSX.utils.book_append_sheet(wb, ws, 'Stock Arrivals');
    }

    XLSX.writeFile(wb, `pawin_pypos_reports_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('All reports exported!');
  };

  if (loading) {
    return (
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
            <div>
              <div className="skeleton" style={{ width: 150, height: 24, marginBottom: 8 }}></div>
              <div className="skeleton" style={{ width: 250, height: 16 }}></div>
            </div>
            <div className="d-flex gap-2">
              <div className="skeleton" style={{ width: 70, height: 32, borderRadius: 4 }}></div>
              <div className="skeleton" style={{ width: 70, height: 32, borderRadius: 4 }}></div>
              <div className="skeleton" style={{ width: 80, height: 32, borderRadius: 4 }}></div>
            </div>
          </div>
        </div>
        <div className="col-12">
          <div className="row g-3 mb-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="col-sm-6 col-lg-3">
                <div className="card p-3 h-100">
                  <div className="d-flex gap-3 align-items-center">
                    <div className="skeleton" style={{ width: 48, height: 48, borderRadius: 4 }}></div>
                    <div>
                      <div className="skeleton" style={{ width: 60, height: 14, marginBottom: 4 }}></div>
                      <div className="skeleton" style={{ width: 80, height: 20 }}></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="col-lg-6">
          <div className="card">
            <div className="card-header bg-white px-4 py-3">
              <div className="skeleton" style={{ width: 100, height: 18 }}></div>
            </div>
            <div className="table-responsive">
              <table className="table mb-0">
                <thead className="table-light">
                  <tr>
                    <th><div className="skeleton" style={{ width: 80, height: 14 }}></div></th>
                    <th><div className="skeleton" style={{ width: 60, height: 14 }}></div></th>
                    <th><div className="skeleton" style={{ width: 80, height: 14 }}></div></th>
                  </tr>
                </thead>
                <tbody>
                  {[...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td><div className="skeleton" style={{ width: 70, height: 16 }}></div></td>
                      <td><div className="skeleton" style={{ width: 50, height: 16 }}></div></td>
                      <td><div className="skeleton" style={{ width: 70, height: 16 }}></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="card">
            <div className="card-header bg-white px-4 py-3">
              <div className="skeleton" style={{ width: 120, height: 18 }}></div>
            </div>
            <div className="table-responsive">
              <table className="table mb-0">
                <thead className="table-light">
                  <tr>
                    <th><div className="skeleton" style={{ width: 80, height: 14 }}></div></th>
                    <th><div className="skeleton" style={{ width: 60, height: 14 }}></div></th>
                    <th><div className="skeleton" style={{ width: 80, height: 14 }}></div></th>
                  </tr>
                </thead>
                <tbody>
                  {[...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td><div className="skeleton" style={{ width: 70, height: 16 }}></div></td>
                      <td><div className="skeleton" style={{ width: 50, height: 16 }}></div></td>
                      <td><div className="skeleton" style={{ width: 70, height: 16 }}></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="row">
      <div className="col-12">
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div>
            <h1 className="fs-3 mb-1">Reports</h1>
            <p className="text-muted mb-0">View your inventory analytics and reports</p>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            <button className="btn btn-outline-secondary btn-sm" onClick={handleRefresh} disabled={refreshing}>
              <i className={`ti ti-refresh ${refreshing ? 'fa-spin' : ''}`}></i>
              {refreshing ? ' Refreshing...' : ' Refresh'}
            </button>
            {!isAdmin && (
              <>
                <div className="dropdown">
                  <button className="btn btn-outline-secondary btn-sm dropdown-toggle" data-bs-toggle="dropdown">
                    <i className="ti ti-file-export me-1"></i>
                    Excel
                  </button>
                  <ul className="dropdown-menu">
                    <li><button className="dropdown-item" onClick={exportDailySales}>Daily Sales</button></li>
                    <li><button className="dropdown-item" onClick={exportMonthlySales}>Monthly Sales</button></li>
                    <li><button className="dropdown-item" onClick={exportStockArrivals}>Stock Arrivals</button></li>
                    <li><hr className="dropdown-divider" /></li>
                    <li><button className="dropdown-item fw-bold" onClick={exportAllReports}>Export All</button></li>
                  </ul>
                </div>
                <div className="dropdown">
                  <button className="btn btn-outline-secondary btn-sm dropdown-toggle" data-bs-toggle="dropdown">
                    <i className="ti ti-file-type-pdf me-1"></i>
                    PDF
                  </button>
                  <ul className="dropdown-menu">
                    <li><button className="dropdown-item" onClick={exportDailySalesPdf}>Daily Sales</button></li>
                    <li><button className="dropdown-item" onClick={exportMonthlySalesPdf}>Monthly Sales</button></li>
                    <li><button className="dropdown-item" onClick={exportStockArrivalsPdf}>Stock Arrivals</button></li>
                  </ul>
                </div>
              </>
            )}
            {isAdmin && (
              <button className="btn btn-outline-secondary btn-sm" onClick={exportStockArrivals}>
                <i className="ti ti-package-export me-1"></i>
                Export System Health
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-md-3">
          <div className="card h-100">
            <div className="card-body p-4">
              <h6 className="mb-4 text-muted">Today's Sales</h6>
              <h3 className="mb-1 fw-bold">TSH{dailyTotal.toLocaleString()}</h3>
              <p className="mb-0 text-success small">
                <i className="ti ti-arrow-up"></i> {reportData.dailySales.length} transactions
              </p>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-md-3">
          <div className="card h-100">
            <div className="card-body p-4">
              <h6 className="mb-4 text-muted">Monthly Revenue</h6>
              <h3 className="mb-1 fw-bold">TSH{monthlyTotal.toLocaleString()}</h3>
              <p className="mb-0 text-success small">
                <i className="ti ti-arrow-up"></i> {reportData.monthlySales.length} months active
              </p>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-md-3">
          <div className="card h-100">
            <div className="card-body p-4">
              <h6 className="mb-4 text-muted">Stock Arrivals</h6>
              <h3 className="mb-1 fw-bold">{reportData.stockMovements.length}</h3>
              <p className="mb-0 text-info small">
                <i className="ti ti-package"></i> {totalArrivals} items received
              </p>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-md-3">
          <div className="card h-100">
            <div className="card-body p-4">
              <h6 className="mb-4 text-muted">Total Transactions</h6>
              <h3 className="mb-1 fw-bold">{reportData.monthlySales.reduce((sum, m) => sum + m.count, 0)}</h3>
              <p className="mb-0 text-muted small">All time</p>
            </div>
          </div>
        </div>
      </div>

      <div className="col-12">
        <div className="card mb-4">
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="mb-0 fs-5">Monthly Sales Breakdown</h2>
            </div>

            <div className="list-group list-group-flush">
              {reportData.monthlySales.slice(0, 6).map((item) => (
                <div key={item.month} className="list-group-item p-3 d-flex align-items-center">
                  <div className="flex-grow-1">
                    <h6 className="mb-0">{item.month}</h6>
                    <small className="text-secondary">{item.count} transactions</small>
                  </div>
                  <div className="text-end">
                    <strong>TSH{item.total.toLocaleString()}</strong>
                    <br />
                    <small className="text-success">Avg: TSH{(item.total / item.count).toLocaleString()}</small>
                  </div>
                </div>
              ))}
              {reportData.monthlySales.length === 0 && (
                <div className="list-group-item p-4 text-center text-muted">
                  No sales data available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isAdmin && reportData.stockMovements.length > 0 && (
        <div className="col-12">
          <div className="card">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="mb-0 fs-5">Recent Stock Arrivals</h2>
              </div>

              <div className="table-responsive">
                <table className="table mb-0 text-nowrap">
                  <thead className="table-light border-light">
                    <tr>
                      <th>#</th>
                      <th>Date</th>
                      <th>Item</th>
                      <th>Quantity</th>
                      <th>Reference</th>
                      <th>By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.stockMovements.slice(0, 10).map((m, index) => (
                      <tr key={m.id} className="align-middle">
                        <td>{index + 1}</td>
                        <td className="small">{new Date(m.created_at).toLocaleDateString()}</td>
                        <td>{m.item_name}</td>
                        <td className="text-success fw-semibold">+{m.quantity}</td>
                        <td>{m.reference || '-'}</td>
                        <td>{m.username}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="col-12">
        <footer className="text-center py-2 mt-6">
          <p className="mb-0 small text-muted">Copyright © 2026 Pawin PyPOS Stationery Inventory System</p>
        </footer>
      </div>
    </div>
  );
};

export default Reports;
