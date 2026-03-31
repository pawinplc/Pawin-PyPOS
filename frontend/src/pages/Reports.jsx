import { useState, useEffect } from 'react';
import { salesAPI, stockAPI } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

const Reports = () => {
  const { isAdmin } = useAuth();
  const [reportData, setReportData] = useState({
    dailySales: [],
    monthlySales: [],
    stockMovements: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const [sales, movements] = await Promise.all([
        salesAPI.getAll(),
        stockAPI.getMovements({})
      ]);

      const today = new Date().toISOString().split('T')[0];
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
      setLoading(false);
    }
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
    return <div className="page-loading">Loading reports...</div>;
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
            <button className="btn btn-outline-secondary btn-sm" onClick={exportDailySales}>
              <i className="ti ti-file-export me-1"></i>
              Daily
            </button>
            <button className="btn btn-outline-secondary btn-sm" onClick={exportMonthlySales}>
              <i className="ti ti-file-export me-1"></i>
              Monthly
            </button>
            <button className="btn btn-outline-secondary btn-sm" onClick={exportStockArrivals}>
              <i className="ti ti-package-export me-1"></i>
              Stock
            </button>
            <button className="btn btn-primary btn-sm" onClick={exportAllReports}>
              <i className="ti ti-download me-1"></i>
              Export All
            </button>
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

      {isAdmin() && reportData.stockMovements.length > 0 && (
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
