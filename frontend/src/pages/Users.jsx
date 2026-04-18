import { useState, useEffect } from 'react';
import supabase from '../services/supabase';
import { Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    email: '', password: '', full_name: '', role: 'staff'
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase.auth.admin.listUsers();
      if (error) throw error;
      setUsers(data.users || []);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    setFormData({ email: '', password: '', full_name: '', role: 'staff' });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({ email: '', password: '', full_name: '', role: 'staff' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error('Email and password are required');
      return;
    }

    try {
      const { error } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        user_metadata: { full_name: formData.full_name, role: formData.role }
      });

      if (error) throw error;
      toast.success('User created successfully');
      closeModal();
      loadUsers();
    } catch (error) {
      toast.error(error.message || 'Failed to create user');
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <div className="skeleton" style={{ width: 150, height: 28, marginBottom: 8 }}></div>
              <div className="skeleton" style={{ width: 200, height: 18 }}></div>
            </div>
            <div className="skeleton" style={{ width: 100, height: 36, borderRadius: 4 }}></div>
          </div>
        </div>
        <div className="col-12">
          <div className="card">
            <div className="table-responsive">
              <table className="table mb-0">
                <thead className="table-light">
                  <tr>
                    <th><div className="skeleton" style={{ width: 60, height: 14 }}></div></th>
                    <th><div className="skeleton" style={{ width: 150, height: 14 }}></div></th>
                    <th><div className="skeleton" style={{ width: 120, height: 14 }}></div></th>
                    <th><div className="skeleton" style={{ width: 80, height: 14 }}></div></th>
                  </tr>
                </thead>
                <tbody>
                  {[...Array(6)].map((_, i) => (
                    <tr key={i}>
                      <td><div className="skeleton" style={{ width: 40, height: 40, borderRadius: 20 }}></div></td>
                      <td><div className="skeleton" style={{ width: 150, height: 16 }}></div></td>
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
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="fs-3 mb-1">User Management</h1>
            <p className="text-muted mb-0">Manage system users and roles</p>
          </div>
          <div>
            <button className="btn btn-primary" onClick={openModal}>
              <i className="ti ti-plus"></i>
              Add User
            </button>
          </div>
        </div>
      </div>

      <div className="col-12">
        <div className="card">
          <div className="table-responsive">
            <table className="table mb-0 text-nowrap table-hover">
              <thead className="table-light border-light">
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="align-middle">
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        <div className="avatar avatar-sm avatar-primary">
                          <span className="avatar-initials">{getInitials(user.user_metadata?.full_name)}</span>
                        </div>
                        <span className="fw-medium">{user.user_metadata?.full_name || '-'}</span>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      {user.user_metadata?.role === 'admin' ? (
                        <span className="badge bg-danger-subtle text-danger border border-danger">Admin</span>
                      ) : (
                        <span className="badge bg-info-subtle text-info border border-info">Staff</span>
                      )}
                    </td>
                    <td>
                      {user.confirmed_at ? (
                        <span className="badge bg-success-subtle text-success border border-success">Active</span>
                      ) : (
                        <span className="badge bg-warning-subtle text-warning border border-warning">Pending</span>
                      )}
                    </td>
                    <td className="small">{new Date(user.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="empty-state py-5">
                <i className="ti ti-users fs-1 text-muted"></i>
                <p className="mt-2">No users found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add New User</h3>
              <button onClick={closeModal} className="modal-close">
                <i className="ti ti-x"></i>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    className="form-control"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Role *</label>
                  <select
                    className="form-select"
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                  >
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="form-group mb-0">
                  <label className="form-label">Password *</label>
                  <input
                    type="password"
                    className="form-control"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={closeModal} className="btn btn-outline-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
