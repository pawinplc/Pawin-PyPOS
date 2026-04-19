import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { salesAPI } from '../services/supabase';
import toast from 'react-hot-toast';

const SalesDetail = () => {
  const { period } = useParams();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState(null);

  useEffect(() => {
    loadSales();
  }, [period]);

  const loadSales = async () => {
    try {
      setLoading(true);
      const data = await salesAPI.getAll();
      const allSales = data || [];
      
      const now = new Date();
      let filtered = [];
      
      switch (period) {
        case 'today':
          const today = now.toISOString().split('T')[0];
          filtered = allSales.filter(s => s.created_at && s.created_at.startsWith(today));
          break;
        case 'week':
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay());
          weekStart.setHours(0, 0, 0, 0);
          filtered = allSales.filter(s => new Date(s.created_at) >= weekStart);
          break;
        case 'month':
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          filtered = allSales.filter(s => new Date(s.created_at) >= monthStart);
          break;
        case 'year':
          const yearStart = new Date(now.getFullYear(), 0, 1);
          filtered = allSales.filter(s => new Date(s.created_at) >= yearStart);
          break;
        default:
          filtered = allSales;
      }
      
      setSales(filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } catch (error) {
      console.error('Failed to load sales:', error);
      toast.error('Failed to load sales');
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = sales.reduce((sum, s) => sum + parseFloat(s.final_amount || 0), 0);
  const avgAmount = sales.length > 0 ? totalAmount / sales.length : 0;

  const getPeriodTitle = () => {
    switch (period) {
      case 'today': return "Today's Sales";
      case 'week': return "This Week's Sales";
      case 'month': return "This Month's Sales";
      case 'year': return "This Year's Sales";
      default: return 'All Sales';
    }
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

  if (loading) {
    return (
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <div className="skeleton" style={{ width: 80, height: 24 }}></div>
            </div>
          </div>
        </div>
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <div className="text-center mb-4">
                <div className="skeleton" style={{ width: 150, height: 24, margin: '0 auto 8px' }}></div>
                <div className="skeleton" style={{ width: 200, height: 16, margin: '0 auto 4px' }}></div>
                <div className="skeleton" style={{ width: 150, height: 14, margin: '0 auto' }}></div>
              </div>
              <div className="border-bottom pb-3 mb-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="d-flex justify-content-between py-2">
                    <div className="skeleton" style={{ width: 120, height: 16 }}></div>
                    <div className="skeleton" style={{ width: 60, height: 16 }}></div>
                  </div>
                ))}
              </div>
              <div className="d-flex justify-content-between pt-2">
                <div className="skeleton" style={{ width: 80, height: 24 }}></div>
                <div className="skeleton" style={{ width: 80, height: 24 }}></div>
              </div>
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
            <div className="d-flex align-items-center gap-2 mb-2">
              <Link to="/sales" className="btn btn-sm btn-outline-secondary">
                <i className="ti ti-arrow-left"></i>
              </Link>
              <h1 className="fs-3 mb-0">{getPeriodTitle()}</h1>
            </div>
            <p className="text-muted mb-0">
              {sales.length} transaction{sales.length !== 1 ? 's' : ''} • Total: TSH {totalAmount.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="col-12">
        <div className="card mb-4">
          <div className="card-body p-4">
            <div className="row text-center">
              <div className="col-4">
                <h3 className="mb-1 fw-bold">TSH {totalAmount.toLocaleString()}</h3>
                <p className="text-muted mb-0 small">Total Sales</p>
              </div>
              <div className="col-4 border-start border-end">
                <h3 className="mb-1 fw-bold">{sales.length}</h3>
                <p className="text-muted mb-0 small">Transactions</p>
              </div>
              <div className="col-4">
                <h3 className="mb-1 fw-bold">TSH {avgAmount.toLocaleString()}</h3>
                <p className="text-muted mb-0 small">Average</p>
              </div>
            </div>
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
                  <th>Categories</th>
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
                    <td>
                      <div className="d-flex flex-wrap gap-1">
                        {(sale.categories_involved || []).map((cat, idx) => (
                          <span key={idx} className="badge bg-primary-subtle text-primary border border-primary">{cat}</span>
                        ))}
                      </div>
                    </td>
                    <td>{sale.sale_items?.length || 0}</td>
                    <td className="fw-bold">TSH {parseFloat(sale.final_amount).toLocaleString()}</td>
                    <td>
                      <button 
                        className="btn btn-sm btn-light"
                        onClick={() => setSelectedSale(sale)}
                      >
                        <i className="ti ti-eye"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sales.length === 0 && (
              <div className="empty-state py-5 text-center">
                <i className="ti ti-receipt fs-1 text-muted"></i>
                <p className="mt-2 text-muted">No sales found for this period</p>
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

      <div className="col-12">
        <footer className="text-center py-3 mt-4">
          <p className="mb-0 small text-muted">Copyright © 2026 Pawin PyPOS Stationery Inventory System</p>
        </footer>
      </div>
    </div>
  );
};

export default SalesDetail;
