import { useState, useEffect } from 'react';
import { itemsAPI } from '../services/supabase';
import toast from 'react-hot-toast';

const Services = ({ isAdmin = false }) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadServices();
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
        <div className="mb-4">
          <h1 className="fs-3 mb-1" style={{ color: 'var(--text-primary)' }}>Services</h1>
          <p className="text-muted mb-0">Manage stationery services pricing</p>
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
                        {editingId !== service.id && !isAdmin && (
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
    </div>
  );
};

export default Services;
