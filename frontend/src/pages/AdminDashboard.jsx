import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../services/supabase';

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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [statsData, salesData, lowStockData, usersData] = await Promise.all([
        dashboardAPI.getAdminStats(),
        dashboardAPI.getRecentSales(10),
        dashboardAPI.getLowStock(10),
        dashboardAPI.getUsersStats()
      ]);
      setStats(statsData || getDefaultStats());
      setRecentSales(salesData || []);
      setLowStock(lowStockData || []);
      setTopItems(usersData?.top_items || []);
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

  if (loading) {
    return (
      <div className="p-3">
        <div className="skeleton" style={{ width: 200, height: 32, marginBottom: 20 }}></div>
        <div className="row g-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="col-md-6 col-lg-3">
              <div className="card p-3">
                <div className="skeleton" style={{ width: 80, height: 16, marginBottom: 8 }}></div>
                <div className="skeleton" style={{ width: 100, height: 28 }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="fs-4 fw-bold mb-1">Admin Dashboard</h1>
          <p className="text-muted small mb-0">System overview and analytics</p>
        </div>
        <button className="btn btn-outline-secondary" onClick={handleRefresh} disabled={refreshing}>
          <i className={`ti ti-refresh ${refreshing ? 'spinner' : ''}`}></i> Refresh
        </button>
      </div>

      {/* Quick Stats */}
      <div className="row g-3 mb-4">
        <div className="col-md-6 col-lg-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex align-items-center mb-2">
                <div className="avatar-sm bg-primary-subtle rounded p-2 me-2">
                  <i className="ti ti-box text-primary"></i>
                </div>
                <span className="text-muted small">Total Items</span>
              </div>
              <div className="fs-3 fw-bold">{stats.total_items}</div>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-lg-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex align-items-center mb-2">
                <div className="avatar-sm bg-warning-subtle rounded p-2 me-2">
                  <i className="ti ti-alert-triangle text-warning"></i>
                </div>
                <span className="text-muted small">Low Stock</span>
              </div>
              <div className="fs-3 fw-bold text-warning">{stats.low_stock_items}</div>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-lg-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex align-items-center mb-2">
                <div className="avatar-sm bg-danger-subtle rounded p-2 me-2">
                  <i className="ti ti-x text-danger"></i>
                </div>
                <span className="text-muted small">Out of Stock</span>
              </div>
              <div className="fs-3 fw-bold text-danger">{stats.out_of_stock}</div>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-lg-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex align-items-center mb-2">
                <div className="avatar-sm bg-success-subtle rounded p-2 me-2">
                  <i className="ti ti-users text-success"></i>
                </div>
                <span className="text-muted small">Active Users</span>
              </div>
              <div className="fs-3 fw-bold">{stats.active_users}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Stats */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card bg-primary text-white h-100">
            <div className="card-body">
              <div className="small opacity-75">Today</div>
              <div className="fs-4 fw-bold mb-1">TSH {stats.today_sales.toLocaleString()}</div>
              <div className="small opacity-75">{stats.today_transactions} transactions</div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card bg-info text-white h-100">
            <div className="card-body">
              <div className="small opacity-75">This Week</div>
              <div className="fs-4 fw-bold mb-1">TSH {stats.week_sales.toLocaleString()}</div>
              <div className="small opacity-75">{stats.week_transactions} transactions</div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card bg-success text-white h-100">
            <div className="card-body">
              <div className="small opacity-75">This Month</div>
              <div className="fs-4 fw-bold mb-1">TSH {stats.month_sales.toLocaleString()}</div>
              <div className="small opacity-75">{stats.month_transactions} transactions</div>
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock & Recent Sales */}
      <div className="row g-3 mb-4">
        <div className="col-lg-6">
          <div className="card h-100">
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
          <div className="card h-100">
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
      </div>

      {/* Quick Actions */}
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
  );
};

export default AdminDashboard;