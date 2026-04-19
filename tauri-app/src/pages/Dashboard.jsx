import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../services/supabase';

const Dashboard = () => {
  const [stats, setStats] = useState({ total_items: 0, low_stock_items: 0, today_sales: 0, today_transactions: 0 });
  const [recentSales, setRecentSales] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      console.log('Loading dashboard data...');
      const statsData = await dashboardAPI.getStats();
      console.log('Stats:', statsData);
      const salesData = await dashboardAPI.getRecentSales(5);
      console.log('Recent sales:', salesData);
      setStats(statsData);
      setRecentSales(salesData || []);
      setLowStock([]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setStats({ total_items: 0, low_stock_items: 0, out_of_stock: 0, active_users: 0, today_sales: 0, today_transactions: 0, week_sales: 0, month_sales: 0 });
    } finally {
      setLoading(false);
if (isRefresh) setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadData(true);
  };

  if (loading) {
    return (
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-start mb-4">
            <div>
              <div className="skeleton" style={{ width: 150, height: 28, marginBottom: 8 }}></div>
              <div className="skeleton" style={{ width: 220, height: 18 }}></div>
            </div>
          </div>
        </div>
        <div className="col-sm-6 col-lg-3">
          <div className="card p-3">
            <div className="skeleton" style={{ width: 80, height: 16, marginBottom: 8 }}></div>
            <div className="skeleton" style={{ width: 60, height: 32 }}></div>
          </div>
        </div>
        <div className="col-sm-6 col-lg-3">
          <div className="card p-3">
            <div className="skeleton" style={{ width: 80, height: 16, marginBottom: 8 }}></div>
            <div className="skeleton" style={{ width: 60, height: 32 }}></div>
          </div>
        </div>
        <div className="col-sm-6 col-lg-3">
          <div className="card p-3">
            <div className="skeleton" style={{ width: 80, height: 16, marginBottom: 8 }}></div>
            <div className="skeleton" style={{ width: 60, height: 32 }}></div>
          </div>
        </div>
        <div className="col-sm-6 col-lg-3">
          <div className="card p-3">
            <div className="skeleton" style={{ width: 80, height: 16, marginBottom: 8 }}></div>
            <div className="skeleton" style={{ width: 60, height: 32 }}></div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="card">
            <div className="card-header"><div className="skeleton" style={{ width: 120, height: 20 }}></div></div>
            <div className="card-body">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="d-flex justify-content-between py-2 border-bottom">
                  <div className="skeleton" style={{ width: 100, height: 16 }}></div>
                  <div className="skeleton" style={{ width: 60, height: 16 }}></div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="card">
            <div className="card-header"><div className="skeleton" style={{ width: 120, height: 20 }}></div></div>
            <div className="card-body">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="d-flex justify-content-between py-2 border-bottom">
                  <div className="skeleton" style={{ width: 100, height: 16 }}></div>
                  <div className="skeleton" style={{ width: 60, height: 16 }}></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="row">
      <div className="col-12">
        <div className="d-flex justify-content-between align-items-start mb-4">
          <div>
            <h1 className="fs-3 mb-1">Dashboard</h1>
            <p className="mb-0 text-muted">Welcome back! Here's what's happening today.</p>
          </div>
          <button 
            className="btn btn-outline-secondary btn-sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <>
                <span className="spinner-border spinner-border-sm me-1"></span>
                Refreshing...
              </>
            ) : (
              <>
                <i className="ti ti-refresh me-1"></i>
                Refresh
              </>
            )}
          </button>
        </div>
      </div>

      <div className="col-12">
        <div className="row g-3">
          <div className="col-sm-6 col-lg-3">
            <div className="card p-3 bg-primary bg-opacity-10 border border-primary border-opacity-25 rounded-2">
              <div className="d-flex gap-3 align-items-center">
                <div className="icon-shape icon-md bg-primary text-white rounded-2">
                  <i className="ti ti-box fs-5"></i>
                </div>
                <div>
                  <p className="mb-1 small text-muted">Total Items</p>
                  <h3 className="fw-bold mb-0">{stats?.total_items || 0}</h3>
                </div>
              </div>
            </div>
          </div>

          <div className="col-sm-6 col-lg-3">
            <div className="card p-3 bg-danger bg-opacity-10 border border-danger border-opacity-25 rounded-2">
              <div className="d-flex gap-3 align-items-center">
                <div className="icon-shape icon-md bg-danger text-white rounded-2">
                  <i className="ti ti-alert-triangle fs-5"></i>
                </div>
                <div>
                  <p className="mb-1 small text-muted">Low Stock</p>
                  <h3 className="fw-bold mb-0">{stats?.low_stock_items || 0}</h3>
                </div>
              </div>
            </div>
          </div>

          <div className="col-sm-6 col-lg-3">
            <div className="card p-3 bg-success bg-opacity-10 border border-success border-opacity-25 rounded-2">
              <div className="d-flex gap-3 align-items-center">
                <div className="icon-shape icon-md bg-success text-white rounded-2">
                  <i className="ti ti-currency-dollar fs-5"></i>
                </div>
                <div>
                  <p className="mb-1 small text-muted">Today's Sales</p>
                  <h3 className="fw-bold mb-0">TSH{(stats?.today_sales || 0).toLocaleString()}</h3>
                </div>
              </div>
            </div>
          </div>

          <div className="col-sm-6 col-lg-3">
            <div className="card p-3 bg-info bg-opacity-10 border border-info border-opacity-25 rounded-2">
              <div className="d-flex gap-3 align-items-center">
                <div className="icon-shape icon-md bg-info text-white rounded-2">
                  <i className="ti ti-receipt fs-5"></i>
                </div>
                <div>
                  <p className="mb-1 small text-muted">Transactions</p>
                  <h3 className="fw-bold mb-0">{stats?.today_transactions || 0}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="col-12 mt-4">
        <div className="row g-3">
          <div className="col-lg-4 col-md-6">
            <div className="card h-100">
              <div className="card-header bg-white d-flex justify-content-between align-items-center px-3 py-2">
                <h4 className="mb-0 h6">Recent Sales</h4>
                <Link to="/sales" className="small link-primary text-decoration-none">View All</Link>
              </div>
              <ul className="list-group list-group-flush">
                {recentSales.length === 0 ? (
                  <li className="list-group-item text-center text-muted py-4">No recent sales</li>
                ) : (
                  recentSales.map((sale) => (
                    <li key={sale?.id} className="list-group-item d-flex align-items-center gap-2 py-2">
                      <div className="flex-grow-1 min-width-0">
                        <p className="mb-0 small fw-medium text-truncate">#{String(sale?.id || 0).padStart(5, '0')}</p>
                        <p className="mb-0 text-muted" style={{ fontSize: '0.7rem' }}>
                          {sale?.created_at ? new Date(sale.created_at).toLocaleTimeString() : '-'}
                        </p>
                      </div>
                      <span className="badge bg-success-subtle text-success border border-success">
                        TSH{(sale?.final_amount || 0).toLocaleString()}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>

          <div className="col-lg-4 col-md-6">
            <div className="card h-100">
              <div className="card-header bg-white d-flex justify-content-between align-items-center px-3 py-2">
                <h4 className="mb-0 h6">Low Stock Alert</h4>
                <Link to="/items" className="small link-primary text-decoration-none">View All</Link>
              </div>
              <ul className="list-group list-group-flush">
                {lowStock.length === 0 ? (
                  <li className="list-group-item text-center text-muted py-4">
                    <i className="ti ti-check fs-4 text-success"></i>
                    <p className="mb-0 mt-2">All items are well stocked!</p>
                  </li>
                ) : (
                  lowStock.map((item) => (
                    <li key={item?.id} className="list-group-item d-flex align-items-center gap-2 py-2">
                      <div className="flex-grow-1 min-width-0">
                        <p className="mb-0 small fw-medium text-truncate">{item?.name || '-'}</p>
                        <p className="mb-0 text-muted" style={{ fontSize: '0.7rem' }}>SKU: {item?.sku || '-'}</p>
                      </div>
                      <span className="fw-bold text-danger">{item?.quantity || 0}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>

          <div className="col-lg-4 col-md-12">
            <div className="card h-100">
              <div className="card-header bg-white d-flex justify-content-between align-items-center px-3 py-2">
                <h4 className="mb-0 h6">Quick Actions</h4>
              </div>
              <div className="card-body p-3">
                <div className="d-flex flex-column gap-2">
                  <Link to="/pos" className="btn btn-primary">
                    <i className="ti ti-shopping-cart me-2"></i>
                    New Sale
                  </Link>
                  <Link to="/stock" className="btn btn-outline-secondary">
                    <i className="ti ti-plus me-2"></i>
                    Add Stock
                  </Link>
                  <Link to="/reports" className="btn btn-outline-secondary">
                    <i className="ti ti-chart-bar me-2"></i>
                    View Reports
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="col-12">
        <footer className="text-center py-3 mt-4">
          <p className="mb-0 small text-muted">Copyright © 2026 Pawin PyPOS Stationery Inventory System</p>
        </footer>
      </div>
    </div>
  );
};

export default Dashboard;
