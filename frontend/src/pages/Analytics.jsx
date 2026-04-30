import { useState, useEffect } from 'react';
import { salesAPI, itemsAPI, categoriesAPI, stockAPI } from '../services/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#E66239', '#00C951', '#00B8DB', '#F0B100', '#FB2C36', '#525252'];

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [salesData, setSalesData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [itemProfits, setItemProfits] = useState([]);
  const [stockData, setStockData] = useState({ low: 0, medium: 0, good: 0, out: 0 });
  const [period, setPeriod] = useState('week'); // week, month, year
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setError(null);
    try {
      console.log('Loading analytics data...');
      
      const [salesResult, itemsResult, categoriesResult, movementsResult] = await Promise.all([
        salesAPI.getAll().catch(e => { console.error('Sales error:', e); return []; }),
        itemsAPI.getAll({}).catch(e => { console.error('Items error:', e); return []; }),
        categoriesAPI.getAll().catch(e => { console.error('Categories error:', e); return []; }),
        stockAPI.getMovements ? stockAPI.getMovements({}).catch(e => { console.error('Stock error:', e); return []; }) : Promise.resolve([])
      ]);

      console.log('Data loaded:', { 
        sales: salesResult?.length, 
        items: itemsResult?.length, 
        categories: categoriesResult?.length, 
        movements: movementsResult?.length 
      });
      
      processSalesData(salesResult || []);
      processCategoryData(itemsResult || [], categoriesResult || []);
      processTopItems(salesResult || []);
      processStockData(itemsResult || []);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError(err.message);
      toast.error('Failed to load analytics: ' + err.message);
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  const processSalesData = (sales) => {
    const now = new Date();
    let startDate = new Date();
    
    if (period === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    } else {
      startDate.setFullYear(now.getFullYear() - 1);
    }

    const filtered = sales.filter(s => new Date(s.created_at) >= startDate);
    
    const grouped = {};
    filtered.forEach(sale => {
      const date = new Date(sale.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const saleRevenue = parseFloat(sale.final_amount || 0);
      let saleCost = 0;
      (sale.sale_items || []).forEach(item => {
        saleCost += (parseFloat(item.cost_price) || 0) * (parseFloat(item.quantity) || 0);
      });
      if (!grouped[date]) {
        grouped[date] = { amount: 0, profit: 0 };
      }
      grouped[date].amount += saleRevenue;
      grouped[date].profit += (saleRevenue - saleCost);
    });

    const data = Object.entries(grouped)
      .map(([date, vals]) => ({ date, amount: vals.amount, profit: vals.profit }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-15);

    setSalesData(data);
  };

  const processCategoryData = (items, categories) => {
    const categoryTotals = {};
    items.forEach(item => {
      const catName = item.categories?.name || 'Uncategorized';
      categoryTotals[catName] = (categoryTotals[catName] || 0) + (item.quantity || 0);
    });

    const data = Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    setCategoryData(data);
  };

  const processTopItems = (sales) => {
    const now = new Date();
    let startDate = new Date();
    if (period === 'week') startDate.setDate(now.getDate() - 7);
    else if (period === 'month') startDate.setMonth(now.getMonth() - 1);
    else startDate.setFullYear(now.getFullYear() - 1);

    const filtered = sales.filter(s => new Date(s.created_at) >= startDate);

    const itemTotals = {};
    filtered.forEach(sale => {
      (sale.sale_items || []).forEach(item => {
        const name = item.item_name || `Item ${item.item_id}`;
        if (!itemTotals[name]) {
          itemTotals[name] = { name, quantity: 0, revenue: 0, profit: 0, cost: 0 };
        }
        const qty = parseFloat(item.quantity) || 0;
        const rev = qty * (parseFloat(item.unit_price) || 0);
        const cost = qty * (parseFloat(item.cost_price) || 0);
        itemTotals[name].quantity += qty;
        itemTotals[name].revenue += rev;
        itemTotals[name].cost += cost;
        itemTotals[name].profit += (rev - cost);
      });
    });

    const data = Object.values(itemTotals)
      .sort((a, b) => b.profit - a.profit)
      .map(item => ({
        ...item,
        margin: item.revenue > 0 ? ((item.profit / item.revenue) * 100).toFixed(1) : 0
      }));

    setTopItems(data.slice(0, 8).map(item => ({
      ...item,
      name: item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name
    })));
    setItemProfits(data);
  };

  const processStockData = (items) => {
    let low = 0, medium = 0, good = 0, out = 0;
    items.forEach(item => {
      if (item.is_service) return;
      const qty = item.quantity || 0;
      const min = item.min_stock_level || 5;
      if (qty === 0) out++;
      else if (qty <= min) low++;
      else if (qty <= min * 2) medium++;
      else good++;
    });
    setStockData({ low, medium, good, out });
  };

  if (loading) {
    return (
      <div className="p-3">
        <div className="skeleton" style={{ width: 200, height: 32, marginBottom: 20 }}></div>
        <div className="row g-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="col-6">
              <div className="card p-4">
                <div className="skeleton" style={{ height: 200 }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3">
        <div className="alert alert-danger">
          <h5>Error loading analytics</h5>
          <p className="mb-0">{error}</p>
          <button className="btn btn-outline-danger mt-2" onClick={() => loadData()}>Retry</button>
        </div>
      </div>
    );
  }

  const stockPieData = [
    { name: 'Out of Stock', value: stockData.out },
    { name: 'Low Stock', value: stockData.low },
    { name: 'Medium Stock', value: stockData.medium },
    { name: 'Good Stock', value: stockData.good }
  ].filter(d => d.value > 0);

  return (
    <div className="p-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="fs-4 fw-bold mb-1">Analytics</h1>
          <p className="text-muted small mb-0">Visual insights and trends</p>
        </div>
        <div className="d-flex gap-2">
          <select className="form-select form-select-sm" value={period} onChange={(e) => setPeriod(e.target.value)} style={{ width: 'auto' }}>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="year">Last 12 Months</option>
          </select>
          <button className="btn btn-outline-secondary btn-sm" onClick={() => loadData(true)} disabled={refreshing}>
            <i className={`ti ti-refresh ${refreshing ? 'spinner' : ''}`}></i> Refresh
          </button>
        </div>
      </div>

      {/* Profit Data Table */}
      <div className="row g-3 mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header bg-white px-4 py-3">
              <span className="fw-bold">Product Profitability Data</span>
            </div>
            <div className="table-responsive">
              <table className="table mb-0 text-nowrap table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Product / Service</th>
                    <th>Qty Sold</th>
                    <th>Revenue (TSH)</th>
                    <th>Cost (TSH)</th>
                    <th>Profit (TSH)</th>
                    <th>Margin (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {itemProfits.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center text-muted py-4">No profitability data available for this period</td>
                    </tr>
                  ) : (
                    itemProfits.map((item, idx) => (
                      <tr key={idx} className="align-middle">
                        <td className="fw-medium">{item.name}</td>
                        <td>{item.quantity}</td>
                        <td className="text-primary">{(item.revenue).toLocaleString()}</td>
                        <td className="text-danger">{(item.cost).toLocaleString()}</td>
                        <td className="text-success fw-bold">{(item.profit).toLocaleString()}</td>
                        <td>
                          <span className={`badge ${parseFloat(item.margin) >= 50 ? 'bg-success' : parseFloat(item.margin) >= 20 ? 'bg-warning' : 'bg-danger'}`}>
                            {item.margin}%
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="row g-3 mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <span className="fw-bold">Revenue Trend</span>
            </div>
            <div className="card-body" style={{ height: 280 }}>
              {salesData.length === 0 ? (
                <div className="text-center text-muted py-5">No sales data available</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value, name) => ['TSH ' + value.toLocaleString(), name === 'amount' ? 'Revenue' : 'Profit']}
                      contentStyle={{ borderRadius: 8, border: '1px solid #eee' }}
                    />
                    <Line type="monotone" dataKey="amount" name="amount" stroke="#E66239" strokeWidth={2} dot={{ fill: '#E66239' }} />
                    <Line type="monotone" dataKey="profit" name="profit" stroke="#00C951" strokeWidth={2} dot={{ fill: '#00C951' }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="row g-3 mb-4">
        {/* Top Items */}
        <div className="col-lg-6">
          <div className="card h-100">
            <div className="card-header">
              <span className="fw-bold">Top Profitable Items</span>
            </div>
            <div className="card-body" style={{ height: 280 }}>
              {topItems.length === 0 ? (
                <div className="text-center text-muted py-5">No data available</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topItems} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value, name) => [name === 'profit' ? 'TSH ' + value.toLocaleString() : value, name === 'quantity' ? 'Qty Sold' : (name === 'profit' ? 'Profit' : 'Revenue')]} />
                    <Bar dataKey="profit" fill="#00C951" name="profit" />
                    <Bar dataKey="quantity" fill="#E66239" name="quantity" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Stock Status */}
        <div className="col-lg-6">
          <div className="card h-100">
            <div className="card-header">
              <span className="fw-bold">Stock Status Overview</span>
            </div>
            <div className="card-body" style={{ height: 280 }}>
              {stockPieData.length === 0 ? (
                <div className="text-center text-muted py-5">No stock data available</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stockPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {stockPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Category Distribution */}
      <div className="row g-3">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <span className="fw-bold">Items by Category</span>
            </div>
            <div className="card-body" style={{ height: 250 }}>
              {categoryData.length === 0 ? (
                <div className="text-center text-muted py-5">No category data available</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#00C951" name="Items" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>



    </div>
  );
};

export default Analytics;