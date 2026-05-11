import { useState, useEffect } from 'react';
import { debtsAPI } from '../services/supabase';
import toast from 'react-hot-toast';

const Debts = () => {
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending');
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  
  const [formData, setFormData] = useState({
    person_name: '',
    phone_number: '',
    amount: '',
    type: 'receivable',
    description: '',
    due_date: ''
  });

  useEffect(() => {
    loadDebts();
  }, [filterType, filterStatus]);

  const loadDebts = async () => {
    setLoading(true);
    try {
      const data = await debtsAPI.getAll({ type: filterType, status: filterStatus });
      setDebts(data || []);
    } catch (error) {
      toast.error('Failed to load debts');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await debtsAPI.create({
        ...formData,
        amount: parseFloat(formData.amount)
      });
      toast.success('Debt record created');
      setShowModal(false);
      setFormData({
        person_name: '',
        phone_number: '',
        amount: '',
        type: 'receivable',
        description: '',
        due_date: ''
      });
      loadDebts();
    } catch (error) {
      toast.error('Failed to create record');
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    try {
      await debtsAPI.recordPayment(selectedDebt.id, parseFloat(paymentAmount));
      toast.success('Payment recorded');
      setShowPaymentModal(false);
      setPaymentAmount('');
      loadDebts();
    } catch (error) {
      toast.error('Failed to record payment');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await debtsAPI.delete(id);
        toast.success('Record deleted');
        loadDebts();
      } catch (error) {
        toast.error('Failed to delete record');
      }
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1" style={{ color: 'var(--text-primary)' }}>Debt Records</h1>
          <p className="text-muted mb-0">Manage accounts receivable and payable</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <i className="ti ti-plus me-2"></i>
          Add Record
        </button>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm p-3" style={{ borderLeft: '4px solid var(--primary)' }}>
            <small className="text-muted text-uppercase fw-bold">Total Receivables</small>
            <h3 className="mb-0 mt-1">
              TSH {debts.filter(d => d.type === 'receivable').reduce((sum, d) => sum + parseFloat(d.remaining_amount), 0).toLocaleString()}
            </h3>
            <small className="text-success">Money owed to you</small>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm p-3" style={{ borderLeft: '4px solid var(--danger)' }}>
            <small className="text-muted text-uppercase fw-bold">Total Payables</small>
            <h3 className="mb-0 mt-1">
              TSH {debts.filter(d => d.type === 'payable').reduce((sum, d) => sum + parseFloat(d.remaining_amount), 0).toLocaleString()}
            </h3>
            <small className="text-danger">Money you owe others</small>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3">
          <div className="d-flex gap-3 flex-wrap">
            <div style={{ minWidth: '200px' }}>
              <label className="form-label small">Type</label>
              <select className="form-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="">All Types</option>
                <option value="receivable">Receivables (Others owe us)</option>
                <option value="payable">Payables (We owe others)</option>
              </select>
            </div>
            <div style={{ minWidth: '200px' }}>
              <label className="form-label small">Status</label>
              <select className="form-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light">
              <tr>
                <th className="ps-4">Person/Entity</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Remaining</th>
                <th>Status</th>
                <th>Due Date</th>
                <th className="text-end pe-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-5">
                    <div className="spinner-border text-primary" role="status"></div>
                  </td>
                </tr>
              ) : debts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">
                    No records found
                  </td>
                </tr>
              ) : (
                debts.map(debt => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const dueDate = debt.due_date ? new Date(debt.due_date) : null;
                  const isOverdue = dueDate && dueDate < today && debt.status !== 'paid';
                  const isUpcoming = dueDate && !isOverdue && debt.status !== 'paid' && 
                                   (dueDate.getTime() - today.getTime()) < (3 * 24 * 60 * 60 * 1000);

                  return (
                    <tr key={debt.id} className={isOverdue ? 'bg-danger-light' : ''}>
                      <td className="ps-4">
                        <div className="fw-bold d-flex align-items-center">
                          {debt.person_name}
                          {isOverdue && <span className="badge bg-danger ms-2" style={{ fontSize: '0.65rem' }}>OVERDUE</span>}
                          {isUpcoming && <span className="badge bg-warning text-dark ms-2" style={{ fontSize: '0.65rem' }}>DUE SOON</span>}
                        </div>
                        <small className="text-muted">{debt.phone_number || debt.description}</small>
                      </td>
                      <td>
                        <div className={`d-flex align-items-center gap-1 ${debt.type === 'receivable' ? 'text-success' : 'text-danger'}`} style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                          <i className={`ti ${debt.type === 'receivable' ? 'ti-arrow-down-left' : 'ti-arrow-up-right'}`}></i>
                          {debt.type === 'receivable' ? 'Money In' : 'Money Out'}
                        </div>
                        <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                          {debt.type === 'receivable' ? 'Customer' : 'Supplier'}
                        </small>
                      </td>
                      <td className="fw-medium">TSH {parseFloat(debt.amount).toLocaleString()}</td>
                      <td className="fw-bold text-primary">TSH {parseFloat(debt.remaining_amount).toLocaleString()}</td>
                      <td>
                        <span className={`badge ${
                          debt.status === 'paid' ? 'bg-success' : 
                          debt.status === 'partially_paid' ? 'bg-warning' : 'bg-secondary'
                        }`}>
                          {debt.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div className={isOverdue ? 'text-danger fw-bold' : isUpcoming ? 'text-warning fw-bold' : ''}>
                          <i className="ti ti-calendar me-1"></i>
                          {debt.due_date ? new Date(debt.due_date).toLocaleDateString() : 'N/A'}
                        </div>
                      </td>
                      <td className="text-end pe-4">
                        <div className="d-flex justify-content-end gap-2">
                          {debt.status !== 'paid' && (
                            <button 
                              className="btn btn-sm btn-outline-primary px-3"
                              onClick={() => {
                                setSelectedDebt(debt);
                                setShowPaymentModal(true);
                              }}
                            >
                              Record Payment
                            </button>
                          )}
                          <button className="btn btn-sm btn-icon text-danger" onClick={() => handleDelete(debt.id)}>
                            <i className="ti ti-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">New Debt Record</h3>
              <button onClick={() => setShowModal(false)} className="modal-close"><i className="ti ti-x"></i></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Type</label>
                  <select 
                    className="form-select" 
                    value={formData.type} 
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    required
                  >
                    <option value="receivable">Receivable (Others owe us)</option>
                    <option value="payable">Payable (We owe others)</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={formData.person_name}
                    onChange={(e) => setFormData({...formData, person_name: e.target.value})}
                    placeholder="Person or Company name"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Amount (TSH)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Phone Number</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={formData.phone_number}
                    onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Due Date</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={formData.due_date}
                    onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Description/Notes</label>
                  <textarea 
                    className="form-control" 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows="2"
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Record Payment</h3>
              <button onClick={() => setShowPaymentModal(false)} className="modal-close"><i className="ti ti-x"></i></button>
            </div>
            <form onSubmit={handlePayment}>
              <div className="modal-body">
                <p>Recording payment for <strong>{selectedDebt?.person_name}</strong></p>
                <div className="mb-3 p-3 bg-light rounded">
                  <div className="d-flex justify-content-between mb-1">
                    <span>Original Amount:</span>
                    <span className="fw-medium">TSH {parseFloat(selectedDebt?.amount).toLocaleString()}</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Remaining Balance:</span>
                    <span className="fw-bold text-primary">TSH {parseFloat(selectedDebt?.remaining_amount).toLocaleString()}</span>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Payment Amount (TSH)</label>
                  <input 
                    type="number" 
                    className="form-control form-control-lg" 
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    max={selectedDebt?.remaining_amount}
                    placeholder="Enter amount paid..."
                    required
                    autoFocus
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPaymentModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Confirm Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Debts;
