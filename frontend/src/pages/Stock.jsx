import { useState, useEffect } from 'react';
import { stockAPI, itemsAPI } from '../services/supabase';
import { Plus, ArrowDownToLine, ArrowUpFromLine, RefreshCw, X } from 'lucide-react';
import toast from 'react-hot-toast';

const Stock = () => {
  const [items, setItems] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [movementType, setMovementType] = useState('in');
  const [formData, setFormData] = useState({
    item_id: '', quantity: '', reference: '', notes: ''
  });
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [itemsData, movementsData] = await Promise.all([
        itemsAPI.getAll(),
        stockAPI.getMovements({}),
      ]);
      setItems(itemsData || []);
      setMovements((movementsData || []).slice(0, 50));
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (type) => {
    setMovementType(type);
    setFormData({ item_id: '', quantity: '', reference: '', notes: '' });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({ item_id: '', quantity: '', reference: '', notes: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        item_id: parseInt(formData.item_id),
        quantity: parseInt(formData.quantity),
        reference: formData.reference || null,
        notes: formData.notes || null,
      };

      if (movementType === 'in') {
        await stockAPI.stockIn(data);
        toast.success('Stock added successfully');
      } else if (movementType === 'out') {
        await stockAPI.stockOut(data);
        toast.success('Stock removed successfully');
      } else {
        await stockAPI.adjust(data);
        toast.success('Stock adjusted successfully');
      }
      closeModal();
      loadData();
    } catch (error) {
      toast.error(error.message || 'Failed to process stock movement');
    }
  };

  const getMovementIcon = (type) => {
    switch (type) {
      case 'in': return <i className="ti ti-arrow-down text-success"></i>;
      case 'out': return <i className="ti ti-arrow-up text-danger"></i>;
      default: return <i className="ti ti-refresh text-warning"></i>;
    }
  };

  const filteredItems = items.filter(i => 
    search === '' || 
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.sku.toLowerCase().includes(search.toLowerCase())
  );

  const getItemStatus = (item) => {
    if (item.is_low_stock && item.quantity > 0) {
      return 'low';
    } else if (item.quantity === 0) {
      return 'out';
    }
    return 'ok';
  };

  if (loading) {
    return <div className="page-loading">Loading...</div>;
  }

  return (
    <div className="row">
      <div className="col-12">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="fs-3 mb-1">Stock Management</h1>
            <p className="text-muted mb-0">Manage inventory stock levels</p>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-success" onClick={() => openModal('in')}>
              <i className="ti ti-arrow-down"></i>
              Stock In
            </button>
            <button className="btn btn-danger" onClick={() => openModal('out')}>
              <i className="ti ti-arrow-up"></i>
              Stock Out
            </button>
            <button className="btn btn-warning" style={{ color: 'white' }} onClick={() => openModal('adjustment')}>
              <i className="ti ti-refresh"></i>
              Adjust
            </button>
          </div>
        </div>
      </div>

      <div className="col-lg-6">
        <div className="card mb-4">
          <div className="card-header bg-white d-flex justify-content-between align-items-center px-4 py-3">
            <h4 className="mb-0 h5">Stock Overview</h4>
            <div className="search-box">
              <span className="search-box-icon"><i className="ti ti-search"></i></span>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ maxWidth: 180 }}
              />
            </div>
          </div>
          <div className="table-responsive">
            <table className="table mb-0 text-nowrap table-hover">
              <thead className="table-light border-light">
                <tr>
                  <th>SKU</th>
                  <th>Name</th>
                  <th>Stock</th>
                  <th>Min</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map(item => {
                  const status = getItemStatus(item);
                  return (
                    <tr key={item.id} className="align-middle">
                      <td>{item.sku}</td>
                      <td>{item.name}</td>
                      <td className={status === 'low' ? 'text-danger fw-semibold' : status === 'out' ? 'text-danger fw-semibold' : ''}>{item.quantity}</td>
                      <td>{item.min_stock_level}</td>
                      <td>
                        {status === 'low' ? (
                          <span className="badge bg-danger-subtle text-danger border border-danger">Low Stock</span>
                        ) : status === 'out' ? (
                          <span className="badge bg-secondary-subtle text-secondary border border-secondary">Out of Stock</span>
                        ) : (
                          <span className="badge bg-success-subtle text-success border border-success">In Stock</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredItems.length === 0 && (
              <div className="empty-state py-4">
                <i className="ti ti-box fs-1 text-muted"></i>
                <p className="mt-2">No items found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="col-lg-6">
        <div className="card">
          <div className="card-header bg-white d-flex justify-content-between align-items-center px-4 py-3">
            <h4 className="mb-0 h5">Recent Stock Movements</h4>
          </div>
          <div className="table-responsive" style={{ maxHeight: 400, overflowY: 'auto' }}>
            <table className="table mb-0 text-nowrap table-hover">
              <thead className="table-light border-light">
                <tr>
                  <th>Date</th>
                  <th>Item</th>
                  <th>Type</th>
                  <th>Qty</th>
                  <th>By</th>
                </tr>
              </thead>
              <tbody>
                {movements.map(m => (
                  <tr key={m.id} className="align-middle">
                    <td className="small">{new Date(m.created_at).toLocaleString()}</td>
                    <td>{m.item_name}</td>
                    <td>
                      <span className="d-flex align-items-center gap-2">
                        {getMovementIcon(m.movement_type)}
                        <span className={`text-${m.movement_type === 'in' ? 'success' : m.movement_type === 'out' ? 'danger' : 'warning'}`}>
                          {m.movement_type}
                        </span>
                      </span>
                    </td>
                    <td>{m.quantity}</td>
                    <td>{m.username}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {movements.length === 0 && (
              <div className="empty-state py-4">
                <i className="ti ti-arrows-exchange fs-1 text-muted"></i>
                <p className="mt-2">No movements recorded</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {movementType === 'in' && <i className="ti ti-arrow-down text-success me-2"></i>}
                {movementType === 'out' && <i className="ti ti-arrow-up text-danger me-2"></i>}
                {movementType === 'adjustment' && <i className="ti ti-refresh text-warning me-2"></i>}
                {movementType === 'in' ? 'Stock In' : movementType === 'out' ? 'Stock Out' : 'Adjust Stock'}
              </h3>
              <button onClick={closeModal} className="modal-close">
                <i className="ti ti-x"></i>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Item *</label>
                  <select
                    className="form-select"
                    value={formData.item_id}
                    onChange={(e) => setFormData({...formData, item_id: e.target.value})}
                    required
                  >
                    <option value="">Select Item</option>
                    {items.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.sku}) - Stock: {item.quantity}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {movementType === 'adjustment' ? 'New Quantity *' : 'Quantity *'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Reference (PO/Invoice #)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.reference}
                    onChange={(e) => setFormData({...formData, reference: e.target.value})}
                    placeholder="Optional"
                  />
                </div>

                <div className="form-group mb-0">
                  <label className="form-label">Notes</label>
                  <textarea
                    className="form-control"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={3}
                    placeholder="Optional notes..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={closeModal} className="btn btn-outline-secondary">
                  Cancel
                </button>
                <button type="submit" className={`btn btn-${movementType === 'in' ? 'success' : movementType === 'out' ? 'danger' : 'warning'}`} style={{ color: movementType === 'adjustment' ? 'white' : undefined }}>
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stock;
