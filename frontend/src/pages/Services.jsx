import { useState, useEffect } from 'react';
import { itemsAPI, poll } from '../services/api';
import toast from 'react-hot-toast';

const Services = ({ isAdmin = false }) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newService, setNewService] = useState({ name: '', sku: '', unit_price: '' });

  useEffect(() => {
    loadServices();
    
    const stopPolling = poll(() => loadServices(), 15000);
    
    return () => {
      stopPolling();
    };
  }, []);

  const loadServices = async () => {
    try {
      const data = await itemsAPI.getAll({});
      const serviceItems = (data || []).filter(item => item.is_service === true);
      setServices(serviceItems);
    } catch (error) {
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (service) => {
    setEditingId(service.id);
    setEditPrice(service.unit_price);
  };

  const handleSave = async (id) => {
    if (!editPrice || parseFloat(editPrice) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    setSubmitting(true);
    try {
      await itemsAPI.update(id, { unit_price: parseFloat(editPrice) });
      toast.success('Price updated successfully');
      setEditingId(null);
      loadServices();
    } catch (error) {
      toast.error('Failed to update price');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditPrice('');
  };

  const openAddModal = () => {
    setNewService({ name: '', sku: '', unit_price: '' });
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    if (saving) return;
    setShowAddModal(false);
  };

  const handleAddService = async (event) => {
    event.preventDefault();
    const name = newService.name.trim();
    const sku = newService.sku.trim();
    const price = parseFloat(newService.unit_price);

    if (!name || !sku) {
      toast.error('Service name and SKU are required');
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    setSaving(true);
    try {
      await itemsAPI.create({
        name,
        sku,
        unit_price: price,
        cost_price: 0,
        quantity: 9999,
        min_stock_level: 0,
        is_service: true,
      });
      toast.success('Service added successfully');
      setShowAddModal(false);
      setNewService({ name: '', sku: '', unit_price: '' });
      loadServices();
    } catch (error) {
      toast.error(error.message || 'Failed to add service');
    } finally {
      setSaving(false);
    }
  };

  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.sku.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="row">
        <div className="col-12">
          <div className="mb-4">
            <div className="skeleton" style={{ width: 100, height: 28, marginBottom: 8 }}></div>
            <div className="skeleton" style={{ width: 200, height: 18 }}></div>
          </div>
        </div>
        <div className="col-12">
          <div className="card">
            <div className="card-body p-3">
              <div className="skeleton" style={{ width: 200, height: 20, marginBottom: 16 }}></div>
            </div>
            <div className="table-responsive">
              <table className="table mb-0">
                <thead className="table-light">
                  <tr>
                    <th><div className="skeleton" style={{ width: 150, height: 14 }}></div></th>
                    <th><div className="skeleton" style={{ width: 80, height: 14 }}></div></th>
                    <th><div className="skeleton" style={{ width: 100, height: 14 }}></div></th>
                    <th><div className="skeleton" style={{ width: 80, height: 14 }}></div></th>
                  </tr>
                </thead>
                <tbody>
                  {[...Array(6)].map((_, i) => (
                    <tr key={i}>
                      <td><div className="skeleton" style={{ width: 150, height: 16 }}></div></td>
                      <td><div className="skeleton" style={{ width: 80, height: 16 }}></div></td>
                      <td><div className="skeleton" style={{ width: 100, height: 16 }}></div></td>
                      <td><div className="skeleton" style={{ width: 60, height: 16 }}></div></td>
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
        <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-2">
          <div>
            <h1 className="fs-3 mb-1" style={{ color: 'var(--text-primary)' }}>Services</h1>
            <p className="text-muted mb-0">Manage stationery services pricing</p>
          </div>
          {isAdmin && (
            <button className="btn btn-primary" onClick={openAddModal}>
              <i className="ti ti-plus me-1"></i>
              Add Service
            </button>
          )}
        </div>
      </div>

      <div className="col-12">
        <div className="card">
          <div className="card-body p-3">
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <div className="search-box" style={{ maxWidth: 250 }}>
                <span className="search-box-icon"><i className="ti ti-search"></i></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search services..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <span className="text-muted">{filteredServices.length} services</span>
            </div>

            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Service Name</th>
                    <th>SKU</th>
                    <th>Current Price (TSH)</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredServices.map(service => (
                    <tr key={service.id}>
                      <td className="fw-medium">{service.name}</td>
                      <td className="text-muted">{service.sku}</td>
                      <td>
                        {editingId === service.id ? (
                          <div className="d-flex gap-2 align-items-center">
                            <input
                              type="number"
                              className="form-control"
                              style={{ width: 120 }}
                              value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value)}
                              min="0"
                              step="50"
                            />
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => handleSave(service.id)}
                              disabled={submitting}
                            >
                              <i className="ti ti-check"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={handleCancel}
                            >
                              <i className="ti ti-x"></i>
                            </button>
                          </div>
                        ) : (
                          <span className="fw-bold text-primary">
                            {parseFloat(service.unit_price).toLocaleString()}
                          </span>
                        )}
                      </td>
                      <td>
                        {editingId !== service.id && isAdmin && (
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => handleEdit(service)}
                          >
                            <i className="ti ti-edit me-1"></i>
                            Edit Price
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredServices.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center text-muted py-4">
                        No services found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={closeAddModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add Service</h3>
              <button onClick={closeAddModal} className="modal-close" type="button">
                <i className="ti ti-x"></i>
              </button>
            </div>
            <form onSubmit={handleAddService}>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-12">
                    <div className="form-group">
                      <label className="form-label">Service Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newService.name}
                        onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                        placeholder="e.g., A3 Printing (per page)"
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">SKU *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newService.sku}
                        onChange={(e) => setNewService({ ...newService, sku: e.target.value })}
                        placeholder="e.g., PRINT-A3-001"
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Price (TSH) *</label>
                      <input
                        type="number"
                        className="form-control"
                        value={newService.unit_price}
                        onChange={(e) => setNewService({ ...newService, unit_price: e.target.value })}
                        min="0"
                        step="50"
                        placeholder="0"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={closeAddModal} className="btn btn-outline-secondary" disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Creating...
                    </>
                  ) : (
                    'Create Service'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;
