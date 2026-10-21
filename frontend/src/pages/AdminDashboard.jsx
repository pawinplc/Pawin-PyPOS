import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI, salesAPI } from '../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    total_items: 0, low_stock_items: 0, out_of_stock: 0,
    today_sales: 0, today_transactions: 0,
    week_sales: 0, week_transactions: 0,
    month_sales: 0, month_transactions: 0,
    total_sales: 0, total_transactions: 0,
    total_users: 0, active_users: 0
  });
  const [recentSales, setRecentSales] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [yearSales, setYearSales] = useState({ totalAmount: 0, transactions: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const calculateYearSales = (sales) => {
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    const filtered = (sales || []).filter(sale => {
      const saleDate = new Date(sale.created_at);
      return saleDate >= yearStart && saleDate <= yearEnd;
    });
    const totalAmount = filtered.reduce((sum, sale) => sum + parseFloat(sale.final_amount || 0), 0);
    return { totalAmount, transactions: filtered.length };
  };

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [statsData, salesData, lowStockData, usersData, allSales] = await Promise.all([
        dashboardAPI.getAdminStats(),
        dashboardAPI.getRecentSales(10),
        dashboardAPI.getLowStock(10),
        dashboardAPI.getUsersStats(),
        salesAPI.getAll(10000)
      ]);
      setStats(statsData || getDefaultStats());
      setRecentSales(salesData || []);
      setLowStock(lowStockData || []);
      setTopItems(usersData?.top_items || []);
      setYearSales(calculateYearSales(allSales));
    } catch (error) {
      console.error('Failed to load admin data:', error);
      setStats(getDefaultStats());
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  const getDefaultStats = () => ({
    total_items: 0, low_stock_items: 0, out_of_stock: 0,
    today_sales: 0, today_transactions: 0,
    week_sales: 0, week_transactions: 0,
    month_sales: 0, month_transactions: 0,
    total_sales: 0, total_transactions: 0,
    total_users: 0, active_users: 0
  });

  const handleRefresh = () => loadData(true);

  const formatCurrency = (amount) => {
    return 'TSH ' + amount.toLocaleString();
  };

  if (loading) {
    return (
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <div className="skeleton" style={{ width: 200, height: 28, marginBottom: 8 }}></div>
              <div className="skeleton" style={{ width: 240, height: 16 }}></div>
            </div>
            <div className="skeleton" style={{ width: 100, height: 36, borderRadius: 4 }}></div>
          </div>
        </div>
        <div className="col-12">
          <div className="row g-3 mb-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="dash-stat-col">
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
          <div className="row g-3 mb-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="dash-stat-col">
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
        <div className="col-lg-6">
          <div className="card mb-4">
            <div className="card-header bg-white px-4 py-3">
              <div className="skeleton" style={{ width: 140, height: 20 }}></div>
            </div>
            <div className="card-body p-0">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="list-group-item d-flex justify-content-between align-items-center">
                  <div className="skeleton" style={{ width: 160, height: 16 }}></div>
                  <div className="skeleton" style={{ width: 60, height: 16 }}></div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="card">
            <div className="card-header bg-white px-4 py-3">
              <div className="skeleton" style={{ width: 140, height: 20 }}></div>
            </div>
            <div className="card-body p-0">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="list-group-item d-flex justify-content-between align-items-center">
                  <div className="skeleton" style={{ width: 160, height: 16 }}></div>
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
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="fs-3 fw-bold mb-1" style={{ color: 'var(--gray-900)' }}>Admin Dashboard</h1>
            <p className="text-muted mb-0">System overview and analytics</p>
          </div>
          <button className="btn btn-outline-secondary" onClick={handleRefresh} disabled={refreshing}>
            <i className={`ti ti-refresh ${refreshing ? 'fa-spin' : ''}`}></i>
            {refreshing ? ' Refreshing...' : ' Refresh'}
          </button>
        </div>
      </div>

      {/* Sales KPIs */}
      <div className="col-12">
        <div className="row g-3 mb-4">
          <div className="dash-stat-col">
            <Link to="/sales" className="text-decoration-none">
              <div className="card p-3 h-100 stat-card" style={{ cursor: 'pointer' }}>
                <div className="d-flex gap-3 align-items-center">
                  <div className="icon-shape icon-md bg-primary text-white rounded-2">
                    <i className="ti ti-calendar fs-5"></i>
                  </div>
                  <div>
                    <p className="mb-1 small text-muted">Today</p>
                    <h3 className="fw-bold mb-0">{formatCurrency(stats.today_sales)}</h3>
                    <small className="text-muted">{stats.today_transactions} transactions</small>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          <div className="dash-stat-col">
            <Link to="/sales" className="text-decoration-none">
              <div className="card p-3 h-100 stat-card" style={{ cursor: 'pointer' }}>
                <div className="d-flex gap-3 align-items-center">
                  <div className="icon-shape icon-md bg-info text-white rounded-2">
                    <i className="ti ti-calendar-week fs-5"></i>
                  </div>
                  <div>
                    <p className="mb-1 small text-muted">This Week</p>
                    <h3 className="fw-bold mb-0">{formatCurrency(stats.week_sales)}</h3>
                    <small className="text-muted">{stats.week_transactions} transactions</small>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          <div className="dash-stat-col">
            <Link to="/sales" className="text-decoration-none">
              <div className="card p-3 h-100 stat-card" style={{ cursor: 'pointer' }}>
                <div className="d-flex gap-3 align-items-center">
                  <div className="icon-shape icon-md bg-success text-white rounded-2">
                    <i className="ti ti-calendar-month fs-5"></i>
                  </div>
                  <div>
                    <p className="mb-1 small text-muted">This Month</p>
                    <h3 className="fw-bold mb-0">{formatCurrency(stats.month_sales)}</h3>
                    <small className="text-muted">{stats.month_transactions} transactions</small>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          <div className="dash-stat-col">
            <Link to="/sales" className="text-decoration-none">
              <div className="card p-3 h-100 stat-card" style={{ cursor: 'pointer' }}>
                <div className="d-flex gap-3 align-items-center">
                  <div className="icon-shape icon-md bg-warning text-white rounded-2">
                    <i className="ti ti-calendar-year fs-5"></i>
                  </div>
                  <div>
                    <p className="mb-1 small text-muted">This Year</p>
                    <h3 className="fw-bold mb-0">{formatCurrency(yearSales.totalAmount)}</h3>
                    <small className="text-muted">{yearSales.transactions} transactions</small>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Inventory & Users */}
      <div className="col-12">
        <div className="row g-3 mb-4">
          <div className="dash-stat-col">
            <Link to="/items" className="text-decoration-none">
              <div className="card p-3 h-100 stat-card" style={{ cursor: 'pointer' }}>
                <div className="d-flex gap-3 align-items-center">
                  <div className="icon-shape icon-md bg-primary text-white rounded-2">
                    <i className="ti ti-box fs-5"></i>
                  </div>
                  <div>
                    <p className="mb-1 small text-muted">Total Items</p>
                    <h3 className="fw-bold mb-0">{stats.total_items}</h3>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          <div className="dash-stat-col">
            <Link to="/stock" className="text-decoration-none">
              <div className="card p-3 h-100 stat-card" style={{ cursor: 'pointer' }}>
                <div className="d-flex gap-3 align-items-center">
                  <div className="icon-shape icon-md bg-warning text-white rounded-2">
                    <i className="ti ti-alert-triangle fs-5"></i>
                  </div>
                  <div>
                    <p className="mb-1 small text-muted">Low Stock</p>
                    <h3 className="fw-bold mb-0 text-warning">{stats.low_stock_items}</h3>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          <div className="dash-stat-col">
            <Link to="/stock" className="text-decoration-none">
              <div className="card p-3 h-100 stat-card" style={{ cursor: 'pointer' }}>
                <div className="d-flex gap-3 align-items-center">
                  <div className="icon-shape icon-md bg-danger text-white rounded-2">
                    <i className="ti ti-x fs-5"></i>
                  </div>
                  <div>
                    <p className="mb-1 small text-muted">Out of Stock</p>
                    <h3 className="fw-bold mb-0 text-danger">{stats.out_of_stock}</h3>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          <div className="dash-stat-col">
            <Link to="/users" className="text-decoration-none">
              <div className="card p-3 h-100 stat-card" style={{ cursor: 'pointer' }}>
                <div className="d-flex gap-3 align-items-center">
                  <div className="icon-shape icon-md bg-success text-white rounded-2">
                    <i className="ti ti-users fs-5"></i>
                  </div>
                  <div>
                    <p className="mb-1 small text-muted">Active Users</p>
                    <h3 className="fw-bold mb-0">{stats.active_users}</h3>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Low Stock & Recent Sales */}
      <div className="col-lg-6">
        <div className="card mb-4">
          <div className="card-header d-flex justify-content-between align-items-center">
            <span className="fw-bold">Low Stock Alerts</span>
            <Link to="/stock" className="btn btn-sm btn-outline-primary">View All</Link>
          </div>
          <div className="card-body p-0">
            {lowStock.length === 0 ? (
              <div className="text-center text-muted py-4">No low stock items</div>
            ) : (
              <div className="list-group list-group-flush">
                {lowStock.slice(0, 5).map(item => (
                  <div key={item.id} className="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-medium">{item.name}</div>
                      <div className="small text-muted">SKU: {item.sku}</div>
                    </div>
                    <div className="text-end">
                      <div className={`badge ${item.quantity === 0 ? 'bg-danger' : 'bg-warning'}`}>
                        {item.quantity} left
                      </div>
                      <div className="small text-muted">Min: {item.min_stock_level}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="col-lg-6">
        <div className="card mb-4">
          <div className="card-header d-flex justify-content-between align-items-center">
            <span className="fw-bold">Recent Sales</span>
            <Link to="/sales" className="btn btn-sm btn-outline-primary">View All</Link>
          </div>
          <div className="card-body p-0">
            {recentSales.length === 0 ? (
              <div className="text-center text-muted py-4">No recent sales</div>
            ) : (
              <div className="list-group list-group-flush">
                {recentSales.slice(0, 5).map(sale => (
                  <div key={sale.id} className="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-medium">#{String(sale.id).padStart(5, '0')}</div>
                      <div className="small text-muted">{sale.cashier_name || 'Unknown'}</div>
                    </div>
                    <div className="text-end">
                      <div className="fw-bold">TSH {sale.final_amount.toLocaleString()}</div>
                      <div className="small text-muted">{sale.items_count} items</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="col-12">
        <div className="card">
          <div className="card-header">
            <span className="fw-bold">Quick Actions</span>
          </div>
          <div className="card-body">
            <div className="row g-2">
              <div className="col-6 col-md-3">
                <Link to="/items" className="btn btn-outline-primary w-100">
                  <i className="ti ti-plus me-1"></i> Add Item
                </Link>
              </div>
              <div className="col-6 col-md-3">
                <Link to="/categories" className="btn btn-outline-primary w-100">
                  <i className="ti ti-tags me-1"></i> Categories
                </Link>
              </div>
              <div className="col-6 col-md-3">
                <Link to="/users" className="btn btn-outline-primary w-100">
                  <i className="ti ti-users me-1"></i> Manage Users
                </Link>
              </div>
              <div className="col-6 col-md-3">
                <Link to="/reports" className="btn btn-outline-primary w-100">
                  <i className="ti ti-chart-bar me-1"></i> Reports
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
