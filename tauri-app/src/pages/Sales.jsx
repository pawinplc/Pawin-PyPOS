import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { salesAPI, subscribeToSales } from '../services/supabase';
import toast from 'react-hot-toast';

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [viewingId, setViewingId] = useState(null);

  useEffect(() => {
    loadSales();
    
    // Real-time subscription for sales changes
    let unsubscribe;
    try {
      unsubscribe = subscribeToSales((payload) => {
        console.log('Sale change detected:', payload);
        loadSales();
        toast.success('New sale detected!', { icon: '🔥' });
      });
    } catch (error) {
      console.warn('Realtime disabled:', error.message);
    }
    
    // Auto-refresh every 10 seconds as backup
    const interval = setInterval(() => {
      loadSales();
    }, 10000);
    
    return () => {
      if (unsubscribe) unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const loadSales = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const data = await salesAPI.getAll();
      setSales(data || []);
    } catch (error) {
      toast.error('Failed to load sales');
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
    loadSales(true);
  };

  const viewSale = (sale) => {
    setViewingId(sale.id);
    setTimeout(() => {
      setSelectedSale(sale);
      setViewingId(null);
    }, 300);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDateRange = (period) => {
    const now = new Date();
    const todayKey = now.toISOString().split('T')[0];
    let start, end;
    
    switch (period) {
      case 'today':
        start = new Date(todayKey + 'T00:00:00.000Z');
        end = new Date(todayKey + 'T23:59:59.999Z');
        break;
      case 'week':
        const dayOfWeek = now.getDay();
        start = new Date(now);
        start.setDate(now.getDate() - dayOfWeek);
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      default:
        start = new Date(0);
        end = new Date();
    }
    
    return { start, end };
  };

  const calculateSales = (period) => {
    if (period === 'today') {
      const now = new Date();
      // Use local date parts, not UTC, to match user's local day
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const todayKey = `${year}-${month}-${day}T`;
      const filtered = sales.filter(sale => sale.created_at && sale.created_at.startsWith(todayKey));
      const totalAmount = filtered.reduce((sum, sale) => sum + parseFloat(sale.final_amount || 0), 0);
      const transactions = filtered.length;
      const avgTransaction = transactions > 0 ? totalAmount / transactions : 0;
      return { totalAmount, transactions, avgTransaction, period };
    }
    const { start, end } = getDateRange(period);
    const filtered = sales.filter(sale => {
      const saleDate = new Date(sale.created_at);
      return saleDate >= start && saleDate <= end;
    });
    
    const totalAmount = filtered.reduce((sum, sale) => sum + parseFloat(sale.final_amount || 0), 0);
    const transactions = filtered.length;
    const avgTransaction = transactions > 0 ? totalAmount / transactions : 0;
    
    return { totalAmount, transactions, avgTransaction, period };
  };

  const salesStats = {
    today: calculateSales('today'),
    week: calculateSales('week'),
    month: calculateSales('month'),
    year: calculateSales('year')
  };

  const formatCurrency = (amount) => {
    return 'TSH ' + amount.toLocaleString();
  };

  if (loading) {
    return (
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <div className="skeleton" style={{ width: 150, height: 24, marginBottom: 8 }}></div>
              <div className="skeleton" style={{ width: 200, height: 16 }}></div>
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
                      <div className="skeleton" style={{ width: 100, height: 20 }}></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="col-12">
          <div className="card">
            <div className="table-responsive">
              <table className="table mb-0">
                <thead className="table-light">
                  <tr>
                    <th><div className="skeleton" style={{ width: 80, height: 14 }}></div></th>
                    <th><div className="skeleton" style={{ width: 140, height: 14 }}></div></th>
                    <th><div className="skeleton" style={{ width: 50, height: 14 }}></div></th>
                    <th><div className="skeleton" style={{ width: 80, height: 14 }}></div></th>
                    <th><div className="skeleton" style={{ width: 60, height: 14 }}></div></th>
                  </tr>
                </thead>
                <tbody>
                  {[...Array(8)].map((_, i) => (
                    <tr key={i}>
                      <td><div className="skeleton" style={{ width: 70, height: 16 }}></div></td>
                      <td><div className="skeleton" style={{ width: 140, height: 16 }}></div></td>
                      <td><div className="skeleton" style={{ width: 40, height: 16 }}></div></td>
                      <td><div className="skeleton" style={{ width: 80, height: 16 }}></div></td>
                      <td><div className="skeleton" style={{ width: 50, height: 16 }}></div></td>
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
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="fs-3 mb-1">Sales History</h1>
            <p className="text-muted mb-0">View all sales transactions</p>
          </div>
          <button className="btn btn-outline-secondary" onClick={handleRefresh} disabled={refreshing}>
            <i className={`ti ti-refresh ${refreshing ? 'fa-spin' : ''}`}></i>
            {refreshing ? ' Refreshing...' : ' Refresh'}
          </button>
        </div>
      </div>

      <div className="col-12">
        <div className="row g-3 mb-4">
          <div className="col-sm-6 col-lg-3">
            <Link to="/sales/today" className="text-decoration-none">
              <div className="card p-3 h-100 stat-card" style={{ cursor: 'pointer' }}>
                <div className="d-flex gap-3 align-items-center">
                  <div className="icon-shape icon-md bg-primary text-white rounded-2">
                    <i className="ti ti-calendar fs-5"></i>
                  </div>
                  <div>
                    <p className="mb-1 small text-muted">Today</p>
                    <h3 className="fw-bold mb-0">{formatCurrency(salesStats.today.totalAmount)}</h3>
                    <small className="text-muted">{salesStats.today.transactions} transactions</small>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          <div className="col-sm-6 col-lg-3">
            <Link to="/sales/week" className="text-decoration-none">
              <div className="card p-3 h-100 stat-card" style={{ cursor: 'pointer' }}>
                <div className="d-flex gap-3 align-items-center">
                  <div className="icon-shape icon-md bg-success text-white rounded-2">
                    <i className="ti ti-calendar-week fs-5"></i>
                  </div>
                  <div>
                    <p className="mb-1 small text-muted">This Week</p>
                    <h3 className="fw-bold mb-0">{formatCurrency(salesStats.week.totalAmount)}</h3>
                    <small className="text-muted">{salesStats.week.transactions} transactions</small>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          <div className="col-sm-6 col-lg-3">
            <Link to="/sales/month" className="text-decoration-none">
              <div className="card p-3 h-100 stat-card" style={{ cursor: 'pointer' }}>
                <div className="d-flex gap-3 align-items-center">
                  <div className="icon-shape icon-md bg-info text-white rounded-2">
                    <i className="ti ti-calendar-month fs-5"></i>
                  </div>
                  <div>
                    <p className="mb-1 small text-muted">This Month</p>
                    <h3 className="fw-bold mb-0">{formatCurrency(salesStats.month.totalAmount)}</h3>
                    <small className="text-muted">{salesStats.month.transactions} transactions</small>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          <div className="col-sm-6 col-lg-3">
            <Link to="/sales/year" className="text-decoration-none">
              <div className="card p-3 h-100 stat-card" style={{ cursor: 'pointer' }}>
                <div className="d-flex gap-3 align-items-center">
                  <div className="icon-shape icon-md bg-warning text-white rounded-2">
                    <i className="ti ti-calendar-year fs-5"></i>
                  </div>
                  <div>
                    <p className="mb-1 small text-muted">This Year</p>
                    <h3 className="fw-bold mb-0">{formatCurrency(salesStats.year.totalAmount)}</h3>
                    <small className="text-muted">{salesStats.year.transactions} transactions</small>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      <div className="col-12">
        <div className="card">
          <div className="table-responsive">
            <table className="table mb-0 text-nowrap table-hover">
              <thead className="table-light border-light">
                <tr>
                  <th>Receipt #</th>
                  <th>Date & Time</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {sales.map(sale => (
                  <tr key={sale.id} className="align-middle">
                    <td className="fw-semibold">#{String(sale.id).padStart(5, '0')}</td>
                    <td className="small">{formatDate(sale.created_at)}</td>
                    <td>{sale.sale_items?.length || 0}</td>
                    <td className="fw-bold">TSH{parseFloat(sale.final_amount).toLocaleString()}</td>
                    <td>
                      <button onClick={() => viewSale(sale)} className="btn btn-sm btn-light" disabled={viewingId === sale.id}>
                        {viewingId === sale.id ? (
                          <span className="spinner-border spinner-border-sm"></span>
                        ) : (
                          <i className="ti ti-eye"></i>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sales.length === 0 && (
              <div className="empty-state py-5">
                <i className="ti ti-receipt fs-1 text-muted"></i>
                <p className="mt-2">No sales found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedSale && (
        <div className="modal-overlay" onClick={() => setSelectedSale(null)}>
          <div className="modal" style={{ maxWidth: 450 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Receipt #{String(selectedSale.id).padStart(5, '0')}</h3>
              <button onClick={() => setSelectedSale(null)} className="modal-close">
                <i className="ti ti-x"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="text-center border-bottom pb-3 mb-3">
                <h4 className="mb-1">Pawin PyPOS</h4>
                <p className="text-muted mb-1 small">Pawin PyPOS Stationery</p>
                <p className="text-muted mb-0 small">{formatDate(selectedSale.created_at)}</p>
              </div>

              <div className="border-bottom pb-3 mb-3">
                <div className="d-flex justify-content-between fw-semibold mb-2">
                  <span>Item</span>
                  <span>Total</span>
                </div>
                {selectedSale.sale_items?.map((item, index) => (
                  <div key={index} className="d-flex justify-content-between small mb-1">
                    <span>{item.item_name} x{item.quantity}</span>
                    <span>TSH{parseFloat(item.subtotal).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div>
                <div className="d-flex justify-content-between small mb-1">
                  <span>Subtotal:</span>
                  <span>TSH{parseFloat(selectedSale.total_amount).toLocaleString()}</span>
                </div>
                <div className="d-flex justify-content-between fw-bold fs-5 mt-2 pt-2 border-top">
                  <span>TOTAL:</span>
                  <span>TSH{parseFloat(selectedSale.final_amount).toLocaleString()}</span>
                </div>
              </div>

              <div className="text-center mt-4 pt-3 border-top">
                <p className="text-muted mb-0 small">Thank you for your purchase!</p>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setSelectedSale(null)} className="btn btn-primary w-100">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
